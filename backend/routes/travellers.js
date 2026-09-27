import express from 'express';
import { getDB } from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB(req);
  res.json({ success: true, travellers: db.travellers || [] });
});

router.post('/', (req, res) => {
  const db = getDB(req);
  const { name, age, phone, relationship, isHead, specialNeeds, category } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Traveller name is required' });
  }

  const numAge = parseInt(age, 10) || 25;

  // Requirement 4: Travel Partner Categories (Adult, Child, Elderly, Family, Friend)
  let partnerCategory = category;
  if (!partnerCategory) {
    if (numAge >= 60) partnerCategory = 'Elderly';
    else if (numAge < 12) partnerCategory = 'Child';
    else if (relationship === 'Family' || relationship === 'Mother' || relationship === 'Father' || relationship === 'Spouse') partnerCategory = 'Family';
    else if (relationship === 'Friend') partnerCategory = 'Friend';
    else partnerCategory = 'Adult';
  }

  const newTraveller = {
    id: `trav_${Date.now()}`,
    name: name.trim(),
    age: numAge,
    phone: phone ? phone.trim() : '',
    relationship: relationship || 'Co-Traveller',
    category: partnerCategory,
    isHead: Boolean(isHead),
    safetyStatus: 'SAFE',
    specialNeeds: Array.isArray(specialNeeds) ? specialNeeds : (specialNeeds ? [specialNeeds] : []),
    lastKnownLocation: db.trip?.destination ? `${db.trip.destination} Hub` : 'Location Pending',
    lastCheckIn: 'Just now'
  };

  if (!Array.isArray(db.travellers)) db.travellers = [];

  if (newTraveller.isHead) {
    db.travellers.forEach(t => { t.isHead = false; });
    if (newTraveller.phone) db.user.phone = newTraveller.phone;
  }

  db.travellers.push(newTraveller);
  if (db.trip) {
    db.trip.travellersCount = db.travellers.length;
  }

  res.status(201).json({ success: true, traveller: newTraveller, travellers: db.travellers });
});

router.put('/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const index = (db.travellers || []).findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Traveller not found' });
  }

  const updated = { ...db.travellers[index], ...req.body };
  if (updated.isHead) {
    db.travellers.forEach(t => { t.isHead = false; });
    updated.isHead = true;
    if (updated.phone) db.user.phone = updated.phone;
  }

  db.travellers[index] = updated;
  res.json({ success: true, traveller: updated, travellers: db.travellers });
});

router.delete('/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  db.travellers = (db.travellers || []).filter(t => t.id !== id);
  if (db.trip) {
    db.trip.travellersCount = db.travellers.length;
  }
  res.json({ success: true, travellers: db.travellers });
});

export default router;
