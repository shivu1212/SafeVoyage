import express from 'express';
import { getDB } from '../data/store.js';
import { sendSafetySMS, sendSOSBroadcast, checkFast2SMSBalance } from '../services/smsService.js';
import { getDestinationSafety } from '../services/safetyService.js';

const router = express.Router();

router.get('/status', (req, res) => {
  const db = getDB(req);
  res.json({
    success: true,
    sos: db.sosState,
    emergencyContacts: db.emergencyContacts || [],
    headTravellerPhone: db.user?.phone || ''
  });
});

router.get('/sms-status', async (req, res) => {
  const balanceInfo = await checkFast2SMSBalance();
  res.json({
    success: true,
    provider: process.env.FAST2SMS_API_KEY ? 'Fast2SMS' : 'Demo Gateway',
    isLiveGateway: Boolean(process.env.FAST2SMS_API_KEY),
    ...balanceInfo
  });
});

router.get('/map-points', (req, res) => {
  const db = getDB(req);
  const city = req.query.city || db.trip?.destination || 'Goa';
  if (city) {
    const destSafety = getDestinationSafety(city);
    return res.json({
      success: true,
      mapPoints: destSafety.mapPoints || []
    });
  }
  res.json({
    success: true,
    mapPoints: []
  });
});

router.post('/sos', async (req, res) => {
  const db = getDB(req);
  const { location, customMessage, destination, emergencyContacts: clientContacts } = req.body;

  db.sosState.isActive = true;
  db.sosState.activatedAt = new Date().toISOString();
  db.sosState.lastUpdate = new Date().toISOString();
  db.sosState.contactsNotified = true;

  if (location) {
    db.sosState.location = {
      lat: location.lat || db.sosState.location?.lat,
      lng: location.lng || db.sosState.location?.lng,
      placeName: location.placeName || `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`,
      accuracy: location.accuracy || 'Browser Geolocation'
    };
  }

  // 1. Dispatch Emergency SMS Broadcast to Head Traveller & Family Contacts via Fast2SMS
  const contactsToAlert = (Array.isArray(clientContacts) && clientContacts.length > 0)
    ? clientContacts
    : (db.emergencyContacts || []);

  const broadcastResult = await sendSOSBroadcast({
    user: db.user,
    contacts: contactsToAlert,
    location: db.sosState.location,
    customMessage,
    req
  });

  // 2. Emergency Incident Event
  const emergencyEvent = {
    id: `sos_ev_${Date.now()}`,
    timestamp: new Date().toISOString(),
    latitude: db.sosState.location?.lat,
    longitude: db.sosState.location?.lng,
    accuracy: db.sosState.location?.accuracy,
    destination: destination || db.trip?.destination || 'Current Location',
    userId: db.user?.id || 'usr_current',
    sessionId: `sess_${Date.now()}`,
    smsBroadcast: broadcastResult
  };

  // 3. System Notification for in-app alert center
  const sosNotif = {
    id: `notif_sos_${Date.now()}`,
    title: 'EMERGENCY SOS ACTIVATED',
    type: 'SOS_ALERT',
    severity: 'CRITICAL',
    message: `EMERGENCY ALERT: SafeVoyage SOS triggered at ${db.sosState.location?.placeName || 'User Location'}. Live GPS coordinates: ${db.sosState.location?.lat}, ${db.sosState.location?.lng}. Live SMS broadcast queued for ${broadcastResult.recipientsCount} contacts.`,
    affectedActivity: 'All Travelers - Critical Emergency',
    createdAt: new Date().toISOString(),
    read: false,
    smsSent: broadcastResult.isLiveGateway,
    smsDetails: broadcastResult
  };
  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(sosNotif);

  res.json({
    success: true,
    sos: db.sosState,
    event: emergencyEvent,
    smsDispatched: broadcastResult.isLiveGateway,
    provider: broadcastResult.provider,
    smsBroadcast: broadcastResult,
    message: broadcastResult.isLiveGateway
      ? `🚨 SOS Activated! Emergency message and live GPS location dispatched to ${broadcastResult.recipientsCount} emergency contacts via ${broadcastResult.provider}.`
      : '🚨 SOS Activated! Emergency telemetry and location sharing logged for emergency response.'
  });
});

router.post('/broadcast-location', async (req, res) => {
  const db = getDB(req);
  const { lat, lng, placeName, emergencyContacts: clientContacts } = req.body;

  if (lat && lng) {
    db.sosState.location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      placeName: placeName || db.sosState.location?.placeName || `${lat}, ${lng}`,
      accuracy: 'Live Tracking'
    };
    db.sosState.lastUpdate = new Date().toISOString();
  }

  const contactsToAlert = (Array.isArray(clientContacts) && clientContacts.length > 0)
    ? clientContacts
    : (db.emergencyContacts || []);

  const broadcastResult = await sendSOSBroadcast({
    user: db.user,
    contacts: contactsToAlert,
    location: db.sosState.location,
    customMessage: `🚨 SAFEVOYAGE LIVE LOCATION UPDATE: ${db.user?.name || 'Traveler'} updated their coordinates to ${db.sosState.location?.placeName} (${db.sosState.location?.lat}, ${db.sosState.location?.lng}). Track live GPS: https://maps.google.com/?q=${db.sosState.location?.lat},${db.sosState.location?.lng}`,
    req
  });

  res.json({
    success: true,
    location: db.sosState.location,
    broadcast: broadcastResult,
    message: `Updated live location broadcasted to ${broadcastResult.recipientsCount} family contacts.`
  });
});

router.post('/stop', (req, res) => {
  const db = getDB(req);
  db.sosState.isActive = false;
  db.sosState.lastUpdate = new Date().toISOString();

  const clearedNotif = {
    id: `notif_sos_clear_${Date.now()}`,
    title: 'SOS Emergency Cleared',
    type: 'INFO',
    severity: 'LOW',
    message: 'The SOS emergency state has been deactivated. Location sharing paused.',
    createdAt: new Date().toISOString(),
    read: false
  };
  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(clearedNotif);

  res.json({
    success: true,
    sos: db.sosState,
    message: 'SOS Deactivated. Normal travel monitoring resumed.'
  });
});

router.post('/location', (req, res) => {
  const db = getDB(req);
  const { lat, lng, placeName, accuracy } = req.body;

  if (lat && lng) {
    db.sosState.location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      placeName: placeName || (db.sosState.location && db.sosState.location.placeName) || 'Current Location',
      accuracy: accuracy || 'GPS Live'
    };
    db.sosState.lastUpdate = new Date().toISOString();
  }

  res.json({ success: true, location: db.sosState.location });
});

export default router;
