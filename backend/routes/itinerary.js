import express from 'express';
import { getDB } from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB(req);
  const { city } = req.query;

  let list = db.itinerary || [];
  if (city) {
    list = list.filter(a => 
      (a.city && a.city.toLowerCase() === city.toLowerCase()) ||
      (a.destination && a.destination.toLowerCase() === city.toLowerCase())
    );
  }

  res.json({ success: true, itinerary: list });
});

router.post('/', (req, res) => {
  const db = getDB(req);
  const { day, date, time, city, destination, place, location, category, notes } = req.body;

  const activityPlace = place || location;
  if (!activityPlace || !activityPlace.trim()) {
    return res.status(400).json({ success: false, error: 'Location/Place is required' });
  }

  const activityCity = city || destination || db.trip?.destination || 'Destination';

  if (!Array.isArray(db.itinerary)) db.itinerary = [];

  const newActivity = {
    id: `act_${Date.now()}`,
    day: parseInt(day, 10) || 1,
    date: date || db.trip?.startDate || new Date().toISOString().split('T')[0],
    time: time || '10:00 AM',
    city: activityCity,
    destination: activityCity,
    place: activityPlace.trim(),
    location: activityPlace.trim(),
    category: category || 'Sightseeing',
    notes: notes || ''
  };

  db.itinerary.push(newActivity);
  db.itinerary.sort((a, b) => (a.day - b.day));

  res.status(201).json({ success: true, activity: newActivity, item: newActivity, itinerary: db.itinerary });
});

router.get('/match', (req, res) => {
  const db = getDB(req);
  const matchedActivities = [];
  const clearActivities = [];

  const advisories = Array.isArray(db.advisories) ? db.advisories : [];

  (db.itinerary || []).forEach(activity => {
    let affectedBy = null;
    const reasons = [];

    for (const advisory of advisories) {
      const cityMatch = activity.city && advisory.city &&
        (activity.city.toLowerCase().trim() === advisory.city.toLowerCase().trim() ||
         advisory.city.toLowerCase().includes(activity.city.toLowerCase()) ||
         activity.city.toLowerCase().includes(advisory.city.toLowerCase()));

      const categoryMatch = activity.category && advisory.category &&
        (activity.category.toLowerCase().trim() === advisory.category.toLowerCase().trim() ||
         activity.place.toLowerCase().includes(advisory.category.toLowerCase()) ||
         (activity.notes && activity.notes.toLowerCase().includes(advisory.category.toLowerCase())));

      if (cityMatch && categoryMatch) {
        affectedBy = advisory;
        reasons.push(`City matched: ${activity.city}`);
        reasons.push(`Category matched: ${activity.category}`);
        if (advisory.title || advisory.type) reasons.push(`Advisory active: ${advisory.title || advisory.type}`);
        break;
      }
    }

    if (affectedBy) {
      matchedActivities.push({
        ...activity,
        status: 'AFFECTED',
        advisory: affectedBy,
        matchReasons: reasons
      });
    } else {
      clearActivities.push({
        ...activity,
        status: 'CLEAR'
      });
    }
  });

  res.json({
    success: true,
    total: (db.itinerary || []).length,
    affected: matchedActivities,
    clear: clearActivities
  });
});

router.put('/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const index = (db.itinerary || []).findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Activity not found' });
  }

  db.itinerary[index] = { ...db.itinerary[index], ...req.body };
  if (req.body.day) {
    db.itinerary[index].day = parseInt(req.body.day, 10);
  }
  db.itinerary.sort((a, b) => (a.day - b.day));

  res.json({ success: true, activity: db.itinerary[index], item: db.itinerary[index], itinerary: db.itinerary });
});

router.delete('/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  db.itinerary = (db.itinerary || []).filter(a => a.id !== id);
  res.json({ success: true, itinerary: db.itinerary });
});

router.post('/duplicate/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const item = (db.itinerary || []).find(a => a.id === id);

  if (!item) {
    return res.status(404).json({ success: false, error: 'Activity not found' });
  }

  const duplicated = {
    ...item,
    id: `act_${Date.now()}`,
    place: `${item.place} (Copy)`,
    notes: `Duplicated from Day ${item.day}`
  };

  db.itinerary.push(duplicated);
  db.itinerary.sort((a, b) => (a.day - b.day));

  res.status(201).json({ success: true, activity: duplicated, itinerary: db.itinerary });
});

export default router;
