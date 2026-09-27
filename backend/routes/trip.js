import express from 'express';
import { getDB } from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB(req);
  res.json({
    success: true,
    trip: db.trip,
    destinations: db.destinations || []
  });
});

router.post('/', (req, res) => {
  const db = getDB(req);
  const { title, origin, destination, startDate, endDate, travelType, travellersCount, notes, destinations } = req.body;

  db.trip = {
    id: db.trip?.id || `trip_${Date.now()}`,
    title: title || (destination ? `${destination} Safe Journey` : 'My Safe Voyage Trip'),
    origin: origin || '',
    destination: destination || '',
    startDate: startDate || '',
    endDate: endDate || '',
    travelType: travelType || 'Flight',
    travellersCount: travellersCount ? parseInt(travellersCount, 10) : (db.travellers?.length || 1),
    notes: notes || '',
    status: 'Active'
  };

  if (Array.isArray(destinations)) {
    db.destinations = destinations;
  } else if (destination && (!db.destinations || db.destinations.length === 0)) {
    db.destinations = [{
      id: `dest_${Date.now()}`,
      name: destination,
      startDate: startDate || '',
      endDate: endDate || '',
      notes: ''
    }];
  }

  res.json({
    success: true,
    trip: db.trip,
    destinations: db.destinations,
    message: 'Trip planned successfully'
  });
});

router.put('/', (req, res) => {
  const db = getDB(req);
  db.trip = { ...db.trip, ...req.body };
  if (Array.isArray(req.body.destinations)) {
    db.destinations = req.body.destinations;
  }
  res.json({
    success: true,
    trip: db.trip,
    destinations: db.destinations,
    message: 'Trip updated successfully'
  });
});

// Destination item CRUD (Requirement 3: Multiple Destinations)
router.get('/destinations', (req, res) => {
  const db = getDB(req);
  res.json({ success: true, destinations: db.destinations || [] });
});

router.post('/destinations', (req, res) => {
  const db = getDB(req);
  const name = req.body.name || req.body.city || req.body.destination;
  const { startDate, endDate, notes, adults, children, elderly } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Destination name is required' });
  }

  if (!Array.isArray(db.destinations)) db.destinations = [];

  const newDest = {
    id: `dest_${Date.now()}`,
    name: name.trim(),
    city: name.trim(),
    startDate: startDate || db.trip.startDate || '',
    endDate: endDate || db.trip.endDate || '',
    notes: notes || '',
    adults: adults !== undefined ? Number(adults) : 1,
    children: children !== undefined ? Number(children) : 0,
    elderly: elderly !== undefined ? Number(elderly) : 0
  };

  db.destinations.push(newDest);

  // If primary trip destination is empty, set this as primary
  if (!db.trip.destination) {
    db.trip.destination = newDest.name;
    db.trip.startDate = newDest.startDate;
    db.trip.endDate = newDest.endDate;
  }

  res.status(201).json({
    success: true,
    destination: newDest,
    destinations: db.destinations,
    message: 'Destination added successfully'
  });
});

router.put('/destinations/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const index = (db.destinations || []).findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Destination not found' });
  }

  db.destinations[index] = { ...db.destinations[index], ...req.body };
  res.json({
    success: true,
    destination: db.destinations[index],
    destinations: db.destinations
  });
});

router.delete('/destinations/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const deletedDest = (db.destinations || []).find(d => d.id === id);
  db.destinations = (db.destinations || []).filter(d => d.id !== id);

  // Remove associated itinerary items for this destination
  if (deletedDest && deletedDest.name && Array.isArray(db.itinerary)) {
    const dName = deletedDest.name.toLowerCase();
    db.itinerary = db.itinerary.filter(it => (it.city || it.destination || '').toLowerCase() !== dName);
  }

  // If deleted destination was primary, switch primary to next available
  if (db.destinations.length > 0) {
    db.trip.destination = db.destinations[0].name;
    db.trip.startDate = db.destinations[0].startDate || db.trip.startDate;
    db.trip.endDate = db.destinations[0].endDate || db.trip.endDate;
    db.trip.adults = db.destinations[0].adults !== undefined ? db.destinations[0].adults : db.trip.adults;
    db.trip.children = db.destinations[0].children !== undefined ? db.destinations[0].children : db.trip.children;
    db.trip.elderly = db.destinations[0].elderly !== undefined ? db.destinations[0].elderly : db.trip.elderly;
  } else {
    db.trip.destination = '';
    db.trip.startDate = '';
    db.trip.endDate = '';
  }

  res.json({
    success: true,
    destinations: db.destinations,
    itinerary: db.itinerary,
    message: 'Destination and associated items removed successfully'
  });
});

export default router;
