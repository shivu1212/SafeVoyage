import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext.jsx';
import {
  Users,
  Heart,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Phone,
  UserCheck
} from 'lucide-react';
import Modal from '../../components/common/Modal.jsx';

const RELATIONSHIP_OPTIONS = [
  'Brother',
  'Mother',
  'Father',
  'Friend',
  'Sister',
  'Other'
];

export default function FamilyContactsPage() {
  const { 
    travellers, 
    emergencyContacts, 
    addContact, 
    updateContact,
    deleteContact, 
    trip, 
    matchingResults 
  } = useTrip();

  const [addContactModal, setAddContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactRel, setContactRel] = useState('Mother');
  const [contactPhone, setContactPhone] = useState('');

  const topAffected = matchingResults?.affected?.[0];

  const handleOpenAddModal = () => {
    setEditingContactId(null);
    setContactName('');
    setContactRel('Mother');
    setContactPhone('');
    setAddContactModal(true);
  };

  const handleOpenEditModal = (contact) => {
    setEditingContactId(contact.id);
    setContactName(contact.name);
    setContactRel(contact.relationship || 'Mother');
    setContactPhone(contact.phone || '');
    setAddContactModal(true);
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    if (editingContactId) {
      updateContact(editingContactId, {
        name: contactName.trim(),
        relationship: contactRel,
        phone: contactPhone.trim()
      });
    } else {
      addContact({
        name: contactName.trim(),
        relationship: contactRel,
        phone: contactPhone.trim()
      });
    }

    setContactName('');
    setContactPhone('');
    setEditingContactId(null);
    setAddContactModal(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
            <Users size={20} /> TRAVEL GROUP & GUARDIAN NETWORK
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Family & Co-Traveller Safety Status</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time individual safety telemetry, risk flags, and emergency guardian list for {trip?.destination || 'your destination'}.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary btn-sm"
          style={{ gap: '6px' }}
        >
          <Plus size={16} /> Add Emergency Contact
        </button>
      </div>

      {/* Travellers Grid */}
      <div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
          Registered Co-Travellers ({travellers.length})
        </div>

        {travellers.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No travellers added yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            {travellers.map((trav, idx) => {
              const isAlert = trav.safetyStatus === 'ALERT' || (topAffected && idx === 1);
              const isCaution = trav.safetyStatus === 'CAUTION' || trav.age >= 60;

              let statusBadge = { label: '🟢 SAFE', class: 'badge-safe', color: '#10B981' };
              if (isAlert) statusBadge = { label: '🔴 ALERT', class: 'badge-danger', color: '#EF4444' };
              else if (isCaution) statusBadge = { label: '🟡 CAUTION', class: 'badge-caution', color: '#F59E0B' };

              return (
                <div
                  key={trav.id}
                  className="card"
                  style={{
                    borderTop: `4px solid ${statusBadge.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                        {trav.name}
                      </span>
                      <span className={`badge ${statusBadge.class}`} style={{ fontSize: '0.7rem' }}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {trav.relationship || 'Traveller'} • Category: <strong>{trav.category || 'Adult'}</strong> {trav.age ? `• Age: ${trav.age}` : ''}
                    </div>

                    {/* Special tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.75rem' }}>
                      {trav.category && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                          {trav.category}
                        </span>
                      )}
                      {trav.isHead && (
                        <span className="badge badge-safe" style={{ fontSize: '0.65rem' }}>
                          HEAD TRAVELLER
                        </span>
                      )}
                    </div>

                    {/* Risk Notes */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        lineHeight: 1.4
                      }}
                    >
                      {isAlert ? (
                        <span style={{ color: 'var(--danger-text)' }}>
                          ⚠️ <strong>Affected:</strong> Scheduled activity in affected risk zone.
                        </span>
                      ) : isCaution ? (
                        <span style={{ color: 'var(--caution-text)' }}>
                          ⚠️ <strong>Caution:</strong> {trav.category === 'Elderly' ? 'Senior traveler hydration and mobility precautions.' : 'Monitor local temperature and advisories.'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--safe-text)' }}>
                          ✓ Regular check-in verified. Zero hazards detected.
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {trav.lastKnownLocation || `${trip?.destination || 'Destination'} Sector`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} /> Check-in: {trav.lastCheckIn || 'Just now'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Contacts Section (Requirement 17) */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Emergency Guardian Contacts ({emergencyContacts.length})</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              These individuals receive live SMS coordinates whenever SOS or critical warnings occur.
            </p>
          </div>
          <Heart size={20} color="#EF4444" />
        </div>

        {emergencyContacts.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '10px',
              border: '1px dashed var(--border-color)'
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
              No family members added.
            </p>
            <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Plus size={15} /> Add First Family Contact
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>{contact.name}</strong>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    ({contact.relationship}) • {contact.phone}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <a
                    href={`tel:${contact.phone}`}
                    className="btn btn-sm btn-primary"
                    style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                  >
                    <Phone size={12} /> Call
                  </a>
                  <button
                    onClick={() => handleOpenEditModal(contact)}
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Edit Contact"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="btn btn-sm btn-outline"
                    style={{ color: '#EF4444', borderColor: '#FECACA', padding: '4px 8px' }}
                    title="Delete Contact"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Contact Modal (Requirement 17 Form) */}
      <Modal
        isOpen={addContactModal}
        onClose={() => setAddContactModal(false)}
        title={editingContactId ? "Edit Contact" : "Add Emergency Contact"}
        maxWidth="440px"
      >
        <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="input-label">Name: *</label>
            <input
              type="text"
              placeholder="e.g. Meera Sharma"
              className="input-field"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Relationship: *</label>
            <select
              className="input-field"
              value={contactRel}
              onChange={(e) => setContactRel(e.target.value)}
              required
            >
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Phone: *</label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              className="input-field"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setAddContactModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingContactId ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
