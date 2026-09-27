import express from 'express';
import { getDB } from '../data/store.js';
import { sendSafetySMS } from '../services/smsService.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB(req);
  const unreadCount = (db.notifications || []).filter(n => !n.read).length;
  res.json({
    success: true,
    unreadCount,
    notifications: db.notifications || [],
    smsLogs: db.smsLogs || [],
    headTravellerPhone: db.user?.phone || ''
  });
});

router.post('/safety', async (req, res) => {
  const db = getDB(req);
  const { title, message, severity, affectedActivity, sendSMS } = req.body;

  const newNotif = {
    id: `notif_${Date.now()}`,
    title: title || 'Trip Safety Update',
    type: 'SAFETY_ALERT',
    severity: severity || 'HIGH',
    message: message || 'A safety alert has been issued for your destination.',
    affectedActivity: affectedActivity || null,
    createdAt: new Date().toISOString(),
    read: false,
    smsSent: Boolean(sendSMS)
  };

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(newNotif);

  let smsResult = null;
  if (sendSMS !== false && db.user?.phone) {
    const smsText = `SafeVoyage Alert: ${newNotif.title} - ${newNotif.message}`;
    smsResult = await sendSafetySMS(db.user.phone, smsText, db.user.name, req);
  }

  res.status(201).json({
    success: true,
    notification: newNotif,
    smsResult,
    notifications: db.notifications
  });
});

router.post('/sms', async (req, res) => {
  const db = getDB(req);
  const { phoneNumber, message, recipientName } = req.body;
  const targetPhone = phoneNumber || db.user?.phone;
  const targetName = recipientName || db.user?.name || 'Contact';

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const result = await sendSafetySMS(targetPhone, message, targetName, req);
  res.json({ success: true, ...result });
});

router.put('/:id/read', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
  }
  const unreadCount = db.notifications.filter(n => !n.read).length;
  res.json({ success: true, unreadCount, notifications: db.notifications });
});

router.put('/read-all', (req, res) => {
  const db = getDB(req);
  db.notifications.forEach(n => { n.read = true; });
  res.json({ success: true, unreadCount: 0, notifications: db.notifications });
});

export default router;
