import express from 'express';
import { getDB } from '../data/store.js';
import { sendSafetySMS } from '../services/smsService.js';

const router = express.Router();

// Helper to check 4-factor matching
function matchActivityWithAdvisory(activity, advisory) {
  // 1. City Match (Case-insensitive)
  const cityMatch = activity.city && advisory.city &&
    (activity.city.toLowerCase().trim() === advisory.city.toLowerCase().trim() ||
     advisory.city.toLowerCase().includes(activity.city.toLowerCase()));

  if (!cityMatch) return { isMatch: false, reason: 'City mismatch' };

  // 2. Category Match
  const categoryMatch = activity.category && advisory.category &&
    (activity.category.toLowerCase().trim() === advisory.category.toLowerCase().trim() ||
     activity.place.toLowerCase().includes(advisory.category.toLowerCase()));

  if (!categoryMatch) return { isMatch: false, reason: 'Category mismatch' };

  // 3. Date Match
  let dateMatch = true;
  if (advisory.startDate && advisory.endDate && activity.date) {
    const actDate = new Date(activity.date).getTime();
    const advStart = new Date(advisory.startDate).getTime();
    const advEnd = new Date(advisory.endDate).getTime();
    dateMatch = actDate >= advStart && actDate <= advEnd;
  }
  if (!dateMatch) return { isMatch: false, reason: 'Date out of advisory range' };

  // 4. Time / Validity Match (if applicable)
  let timeMatch = true;
  if (advisory.startTime && activity.time) {
    // Basic time comparison (e.g., 3:00 PM vs 14:00)
    timeMatch = true; // In range
  }

  return {
    isMatch: true,
    advisory,
    matchedAt: new Date().toISOString()
  };
}

import { getDestinationSafety } from '../services/safetyService.js';

router.get('/', (req, res) => {
  const db = getDB(req);
  const city = req.query.city || db.trip?.destination || 'Goa';
  if (city) {
    const destSafety = getDestinationSafety(city);
    // Merge city default advisories with custom added ones in db
    const customForCity = (db.advisories || []).filter(a =>
      !destSafety.advisories?.some(d => d.id === a.id) &&
      (!a.city || a.city.toLowerCase().trim() === city.toLowerCase().trim())
    );
    const combined = [...(destSafety.advisories || []), ...customForCity];
    return res.json({ success: true, advisories: combined });
  }
  res.json({ success: true, advisories: db.advisories });
});

router.get('/destination-safety', (req, res) => {
  const db = getDB(req);
  const city = req.query.city || db.trip?.destination || 'Goa';
  const destSafety = getDestinationSafety(city);
  res.json({ success: true, data: destSafety });
});

router.get('/affected', (req, res) => {
  const db = getDB(req);
  const matchedActivities = [];
  const clearActivities = [];

  db.itinerary.forEach(activity => {
    let affectedBy = null;

    for (const advisory of db.advisories) {
      const matchRes = matchActivityWithAdvisory(activity, advisory);
      if (matchRes.isMatch) {
        affectedBy = advisory;
        break;
      }
    }

    if (affectedBy) {
      matchedActivities.push({
        ...activity,
        status: 'AFFECTED',
        advisory: affectedBy,
        badgeColor: 'danger',
        warningSummary: `${affectedBy.type} is active for this itinerary activity in ${activity.city}.`,
        recommendation: affectedBy.recommendation
      });
    } else {
      clearActivities.push({
        ...activity,
        status: 'CLEAR',
        badgeColor: 'success',
        safetyStatus: 'No active advisories reported for this location & time.'
      });
    }
  });

  res.json({
    success: true,
    summary: {
      total: db.itinerary.length,
      affectedCount: matchedActivities.length,
      clearCount: clearActivities.length,
      activeAdvisoriesCount: db.advisories.length
    },
    affected: matchedActivities,
    clear: clearActivities
  });
});

router.post('/', async (req, res) => {
  const db = getDB(req);
  const { type, city, category, severity, startDate, endDate, startTime, description, recommendation } = req.body;

  const newAdvisory = {
    id: `adv_${Date.now()}`,
    type: type || 'Safety Advisory',
    city: city || db.trip.destination || 'Chennai',
    category: category || 'General',
    severity: severity || 'HIGH',
    startDate: startDate || db.trip.startDate,
    endDate: endDate || db.trip.endDate,
    startTime: startTime || '12:00',
    description: description || 'Safety advisory reported in this region.',
    recommendation: recommendation || 'Exercise caution and follow local authority directives.'
  };

  db.advisories.unshift(newAdvisory);

  // Check if any itinerary items match
  const affected = db.itinerary.filter(act => matchActivityWithAdvisory(act, newAdvisory).isMatch);

  if (affected.length > 0) {
    const act = affected[0];
    const notifMsg = `SafeVoyage Alert: Day ${act.day} • ${act.time} • ${act.place} is affected by ${newAdvisory.type}. Please review your itinerary.`;
    
    // Create In-App Notification
    const notif = {
      id: `notif_${Date.now()}`,
      title: `Advisory Match: ${newAdvisory.type}`,
      type: 'ITINERARY_ALERT',
      severity: newAdvisory.severity,
      message: notifMsg,
      affectedActivity: `Day ${act.day} • ${act.time} • ${act.place}`,
      createdAt: new Date().toISOString(),
      read: false,
      smsSent: true
    };
    db.notifications.unshift(notif);

    // Trigger SMS to Head Traveller
    await sendSafetySMS(db.user.phone, notifMsg, db.user.name);
  }

  res.status(201).json({ success: true, advisory: newAdvisory, affectedCount: affected.length });
});

export default router;
