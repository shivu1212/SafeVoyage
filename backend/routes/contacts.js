import express from 'express';
import { getDB } from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB(req);
  res.json({ success: true, contacts: db.emergencyContacts || [] });
});

router.post('/', (req, res) => {
  const db = getDB(req);
  const { name, relationship, phone } = req.body;

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ success: false, error: 'Name and Phone are required' });
  }

  if (!Array.isArray(db.emergencyContacts)) db.emergencyContacts = [];

  const newContact = {
    id: `emc_${Date.now()}`,
    name: name.trim(),
    relationship: relationship || 'Family',
    phone: phone.trim()
  };

  db.emergencyContacts.push(newContact);
  res.status(201).json({ success: true, contact: newContact, contacts: db.emergencyContacts });
});

router.put('/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  const index = (db.emergencyContacts || []).findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  db.emergencyContacts[index] = { ...db.emergencyContacts[index], ...req.body };
  res.json({ success: true, contact: db.emergencyContacts[index], contacts: db.emergencyContacts });
});

router.delete('/:id', (req, res) => {
  const db = getDB(req);
  const { id } = req.params;
  db.emergencyContacts = (db.emergencyContacts || []).filter(c => c.id !== id);
  res.json({ success: true, contacts: db.emergencyContacts });
});

export default router;
