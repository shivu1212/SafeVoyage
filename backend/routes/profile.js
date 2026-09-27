import express from 'express';
import { getDB, resetDB } from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB(req);
  res.json({ success: true, profile: db.user });
});

router.put('/', (req, res) => {
  const db = getDB(req);
  const { name, email, phone, alternatePhone, notificationPreferences } = req.body;

  if (name) db.user.name = name;
  if (email) db.user.email = email;
  if (phone) {
    db.user.phone = phone;
    // Also update head traveller in travellers list
    const head = db.travellers.find(t => t.isHead);
    if (head) head.phone = phone;
  }
  if (alternatePhone !== undefined) db.user.alternatePhone = alternatePhone;
  if (notificationPreferences) {
    db.user.notificationPreferences = {
      ...db.user.notificationPreferences,
      ...notificationPreferences
    };
  }

  res.json({ success: true, profile: db.user, message: 'Profile updated successfully' });
});

router.post('/reset-demo', (req, res) => {
  const freshDb = resetDB();
  res.json({ success: true, message: 'Demo data successfully reset to Chennai default showcase', db: freshDb });
});

export default router;
