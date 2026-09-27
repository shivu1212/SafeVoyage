import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { Plus, Check } from 'lucide-react';

const CATEGORIES = [
  'Sightseeing',
  'Beach',
  'Adventure',
  'Hiking',
  'Shopping',
  'Food',
  'Religious',
  'Transport',
  'Hotel',
  'Nature',
  'Other'
];

export default function AddActivityModal({ isOpen, onClose, onSave, editData = null, defaultCity = 'Chennai' }) {
  const [formData, setFormData] = useState({
    day: 1,
    date: '2026-09-24',
    time: '10:00 AM',
    city: defaultCity || 'Chennai',
    place: '',
    category: 'Sightseeing',
    notes: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
        day: 1,
        date: '2026-09-24',
        time: '10:00 AM',
        city: defaultCity || 'Chennai',
        place: '',
        category: 'Sightseeing',
        notes: ''
      });
    }
  }, [editData, defaultCity, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.place.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Itinerary Activity' : 'Add New Itinerary Activity'}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="input-label">Trip Day</label>
            <select
              className="input-field"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value, 10) })}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Date</label>
            <input
              type="date"
              className="input-field"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="input-label">Time</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 3:00 PM"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="input-label">City / Destination</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Chennai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="input-label">Place / Location Name</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Marina Beach, Government Museum"
            value={formData.place}
            onChange={(e) => setFormData({ ...formData, place: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="input-label">Activity Category</label>
          <select
            className="input-field"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Notes & Highlights (Optional)</label>
          <textarea
            className="input-field"
            rows="2"
            placeholder="e.g. Sunset photography, carry water"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editData ? 'Save Changes' : 'Add Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
