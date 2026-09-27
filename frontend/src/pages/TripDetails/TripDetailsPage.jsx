import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext.jsx';
import {
  Luggage,
  MapPin,
  Calendar,
  Plane,
  Train,
  Bus,
  Car,
  Shield,
  ArrowRight,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import Modal from '../../components/common/Modal.jsx';

const TRAVEL_MODES = [
  { id: 'Flight', icon: Plane, label: 'Flight' },
  { id: 'Train', icon: Train, label: 'Train' },
  { id: 'Bus', icon: Bus, label: 'Bus' },
  { id: 'Car', icon: Car, label: 'Car' },
  { id: 'Other', icon: Luggage, label: 'Other' }
];

export default function TripDetailsPage() {
  const { 
    trip, 
    updateTripDetails, 
    destinations, 
    addDestination, 
    updateDestinationItem,
    deleteDestinationItem, 
    travellers,
    partyBreakdown 
  } = useTrip();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: trip?.title || '',
    origin: trip?.origin || '',
    destination: trip?.destination || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    travelType: trip?.travelType || 'Flight',
    notes: trip?.notes || ''
  });

  // Modal for adding extra destination
  const [destModal, setDestModal] = useState(false);
  const [editingDestId, setEditingDestId] = useState(null);
  const [newDestName, setNewDestName] = useState('');
  const [newDestStart, setNewDestStart] = useState('');
  const [newDestEnd, setNewDestEnd] = useState('');
  const [newDestAdults, setNewDestAdults] = useState(1);
  const [newDestChildren, setNewDestChildren] = useState(0);
  const [newDestElderly, setNewDestElderly] = useState(0);

  const [destModalError, setDestModalError] = useState('');

  const handleAddExtraDest = (e) => {
    e.preventDefault();
    setDestModalError('');
    if (!newDestName.trim()) {
      setDestModalError('Please enter a destination.');
      return;
    }
    if (!newDestStart) {
      setDestModalError('Please select a start date.');
      return;
    }
    if (!newDestEnd) {
      setDestModalError('Please select an end date.');
      return;
    }
    if (new Date(newDestStart) > new Date(newDestEnd)) {
      setDestModalError('Start date must be before or equal to end date.');
      return;
    }

    const payload = {
      name: newDestName.trim(),
      city: newDestName.trim(),
      startDate: newDestStart,
      endDate: newDestEnd,
      adults: Number(newDestAdults) || 1,
      children: Number(newDestChildren) || 0,
      elderly: Number(newDestElderly) || 0
    };

    if (editingDestId) {
      updateDestinationItem(editingDestId, payload);
    } else {
      addDestination(payload);
    }

    setEditingDestId(null);
    setNewDestName('');
    setNewDestStart('');
    setNewDestEnd('');
    setNewDestAdults(1);
    setNewDestChildren(0);
    setNewDestElderly(0);
    setDestModal(false);
  };

  const handleOpenEditDest = (d) => {
    setEditingDestId(d.id);
    setNewDestName(d.name || '');
    setNewDestStart(d.startDate || '');
    setNewDestEnd(d.endDate || '');
    setNewDestAdults(d.adults !== undefined ? Number(d.adults) : 1);
    setNewDestChildren(d.children !== undefined ? Number(d.children) : 0);
    setNewDestElderly(d.elderly !== undefined ? Number(d.elderly) : 0);
    setDestModalError('');
    setDestModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateTripDetails(formData);
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
          <Luggage size={20} /> STEP 2 OF 3 • TRIP PARAMETERS & MULTIPLE DESTINATIONS
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Plan Your Safe Journey</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Specify your travel corridor, dates, and destinations to activate localized safety sentinels.
        </p>

        {/* Travel party breakdown badge */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span className="badge badge-info">Party: {travellers.length} Individuals</span>
          <span className="badge badge-safe">Adult: {partyBreakdown?.adult || 0}</span>
          <span className="badge badge-caution">Child: {partyBreakdown?.child || 0}</span>
          <span className="badge badge-danger">Elderly: {partyBreakdown?.elderly || 0}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Primary Destination & Route Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Primary Route & Dates
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="input-label">Trip Title</label>
              <input
                type="text"
                placeholder="e.g. Tamil Nadu Heritage Tour"
                className="input-field"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="input-label">Starting Location (Origin)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Bengaluru"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <MapPin size={16} color="var(--primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label className="input-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Primary Destination *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Chennai"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                  style={{ paddingLeft: '2.5rem', borderColor: 'var(--primary)' }}
                />
                <MapPin size={16} color="var(--primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label className="input-label">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="input-label">End Date *</label>
              <input
                type="date"
                className="input-field"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* MULTIPLE DESTINATIONS SECTION (Requirement 3) */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Additional Destinations ({destinations.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Add multiple stops (e.g. Bengaluru, Chennai, Rameshwaram, Madurai). Each has independent weather & safety telemetry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDestModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={15} /> + Add Destination
            </button>
          </div>

          {destinations.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Only primary destination currently set. Click <strong>+ Add Destination</strong> to add multiple legs.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {destinations.map((d, index) => (
                <div
                  key={d.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div className="flex-between">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                        DESTINATION {index + 1}
                      </span>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {d.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditDest(d)}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        title="Edit destination"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDestinationItem(d.id)}
                        className="btn btn-sm btn-outline"
                        style={{ color: '#EF4444', borderColor: '#FECACA', padding: '3px 8px', fontSize: '0.75rem' }}
                        title="Remove destination"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Dates: {d.startDate || 'Trip Start'} to {d.endDate || 'Trip End'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Travel Mode Selector */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            Primary Mode of Transport
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
            {TRAVEL_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = formData.travelType === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, travelType: mode.id })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '1.1rem 0.5rem',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 700
                  }}
                >
                  <Icon size={24} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" style={{ padding: '0.85rem 2.25rem' }}>
            Save Trip & Open Sentinel Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </form>

      {/* Add Destination Modal */}
      <Modal
        isOpen={destModal}
        onClose={() => setDestModal(false)}
        title="Add New Destination"
        maxWidth="440px"
      >
        <form onSubmit={handleAddExtraDest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {destModalError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem' }}>
              {destModalError}
            </div>
          )}

          <div>
            <label className="input-label">Destination City/Region *</label>
            <input
              type="text"
              placeholder="e.g. Madurai, Rameshwaram, Chennai"
              className="input-field"
              value={newDestName}
              onChange={(e) => setNewDestName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={newDestStart}
                onChange={(e) => setNewDestStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">End Date *</label>
              <input
                type="date"
                className="input-field"
                value={newDestEnd}
                onChange={(e) => setNewDestEnd(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Travel Partners for this destination (Requirement 11) */}
          <div>
            <label className="input-label" style={{ marginBottom: '6px', display: 'block' }}>
              Travel Partners for this Destination
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Adults</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={newDestAdults}
                  onChange={(e) => setNewDestAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Children</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={newDestChildren}
                  onChange={(e) => setNewDestChildren(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Elderly</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={newDestElderly}
                  onChange={(e) => setNewDestElderly(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setDestModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Destination
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
