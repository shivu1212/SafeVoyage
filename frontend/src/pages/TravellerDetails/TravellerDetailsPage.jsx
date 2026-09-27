import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import {
  Users,
  UserCheck,
  Phone,
  Shield,
  Plus,
  Trash2,
  Heart,
  ArrowRight
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Adult',
  'Child',
  'Elderly',
  'Family',
  'Friend'
];

const RELATIONSHIP_OPTIONS = [
  'Brother',
  'Mother',
  'Father',
  'Friend',
  'Sister',
  'Other'
];

export default function TravellerDetailsPage() {
  const { user, updateProfile } = useAuth();
  const { 
    travellers, 
    addTraveller, 
    deleteTraveller, 
    partyBreakdown,
    emergencyContacts, 
    addContact, 
    deleteContact 
  } = useTrip();
  const navigate = useNavigate();

  // Head traveller local form state
  const [headData, setHeadData] = useState({
    name: user?.name || '',
    age: user?.age || 30,
    email: user?.email || '',
    phone: user?.phone || '',
    alternatePhone: user?.alternatePhone || '',
    category: 'Adult'
  });

  // Additional traveller input state
  const [newTravellerName, setNewTravellerName] = useState('');
  const [newTravellerAge, setNewTravellerAge] = useState('');
  const [newTravellerPhone, setNewTravellerPhone] = useState('');
  const [newTravellerRel, setNewTravellerRel] = useState('Friend');
  const [newTravellerCat, setNewTravellerCat] = useState('Adult');

  // Emergency contact state
  const [newContactName, setNewContactName] = useState('');
  const [newContactRel, setNewContactRel] = useState('Mother');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddCoTraveller = (e) => {
    e.preventDefault();
    if (!newTravellerName.trim()) return;

    const ageNum = parseInt(newTravellerAge, 10);
    // Auto-detect category if not manually overridden
    let category = newTravellerCat;
    if (newTravellerCat === 'Adult' && !isNaN(ageNum)) {
      if (ageNum >= 60) category = 'Elderly';
      else if (ageNum < 13) category = 'Child';
    }

    addTraveller({
      name: newTravellerName.trim(),
      age: isNaN(ageNum) ? 30 : ageNum,
      phone: newTravellerPhone.trim(),
      relationship: newTravellerRel,
      category: category,
      isHead: false,
      safetyStatus: 'SAFE'
    });

    setNewTravellerName('');
    setNewTravellerAge('');
    setNewTravellerPhone('');
  };

  const handleAddEmergencyContact = (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    addContact({
      name: newContactName.trim(),
      relationship: newContactRel,
      phone: newContactPhone.trim()
    });

    setNewContactName('');
    setNewContactPhone('');
  };

  const handleSaveAndContinue = async () => {
    if (user) {
      await updateProfile({
        name: headData.name,
        email: headData.email,
        phone: headData.phone,
        alternatePhone: headData.alternatePhone
      });
    }
    navigate('/trip');
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
          <Users size={20} /> STEP 1 OF 3 • TRAVELLER CONFIGURATION
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Register Travellers & Travel Party</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Add your travel companions (Adults, Children, Elderly) so safety guidance adapts automatically.
        </p>

        {/* Travel Party Summary Badge */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span className="badge badge-info" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
            Total Travellers: {travellers.length}
          </span>
          <span className="badge badge-safe" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
            Adult: {partyBreakdown?.adult || 0}
          </span>
          <span className="badge badge-caution" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
            Child: {partyBreakdown?.child || 0}
          </span>
          <span className="badge badge-danger" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
            Elderly: {partyBreakdown?.elderly || 0}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* SECTION 1: PRIMARY / HEAD TRAVELLER */}
        <div className="card" style={{ border: '2px solid var(--primary-light)' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>PRIMARY / HEAD TRAVELLER</h3>
                <span style={{ fontSize: '0.78rem', color: '#167D5A', fontWeight: 700 }}>
                  ★ Priority alert recipient for the whole group
                </span>
              </div>
            </div>
            <span className="badge badge-safe">HEAD TRAVELLER</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Your Name"
                className="input-field"
                value={headData.name}
                onChange={(e) => setHeadData({ ...headData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="input-label">Age</label>
              <input
                type="number"
                className="input-field"
                value={headData.age}
                onChange={(e) => setHeadData({ ...headData, age: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>

            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="input-field"
                value={headData.email}
                onChange={(e) => setHeadData({ ...headData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="input-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Mobile Number (SMS Alerts Target) *
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="input-field"
                value={headData.phone}
                onChange={(e) => setHeadData({ ...headData, phone: e.target.value })}
                required
                style={{ borderColor: 'var(--primary)' }}
              />
            </div>

            <div>
              <label className="input-label">Alternate Mobile Number</label>
              <input
                type="tel"
                placeholder="+91 98765 00000"
                className="input-field"
                value={headData.alternatePhone}
                onChange={(e) => setHeadData({ ...headData, alternatePhone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CO-TRAVELLERS LIST & ADD FORM */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>TRAVEL COMPANIONS & CO-TRAVELLERS</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Categorize as Adult, Child, or Elderly for customized safety advice.
              </p>
            </div>
            <span className="badge badge-info">{travellers.length} Registered</span>
          </div>

          {/* List of current travellers */}
          {travellers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              No travellers added yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {travellers.map((trav) => (
                <div
                  key={trav.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{trav.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ({trav.relationship || 'Companion'}, Age: {trav.age})
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {trav.category || 'Adult'}
                    </span>
                    {trav.phone && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        • {trav.phone}
                      </span>
                    )}
                    {trav.isHead && (
                      <span className="badge badge-safe" style={{ fontSize: '0.7rem' }}>
                        PRIMARY HEAD
                      </span>
                    )}
                  </div>

                  {!trav.isHead && (
                    <button
                      onClick={() => deleteTraveller(trav.id)}
                      className="btn btn-sm btn-outline"
                      style={{ color: '#EF4444', borderColor: '#FECACA', padding: '3px 8px' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Co-Traveller Form (Requirement 4) */}
          <form
            onSubmit={handleAddCoTraveller}
            style={{
              backgroundColor: 'var(--bg-main)',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Travel Companion
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="input-label">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya"
                  className="input-field"
                  value={newTravellerName}
                  onChange={(e) => setNewTravellerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Age *</label>
                <input
                  type="number"
                  placeholder="e.g. 65"
                  className="input-field"
                  value={newTravellerAge}
                  onChange={(e) => setNewTravellerAge(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Category (Type of Traveller) *</label>
                <select
                  className="input-field"
                  value={newTravellerCat}
                  onChange={(e) => setNewTravellerCat(e.target.value)}
                  required
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Relationship</label>
                <select
                  className="input-field"
                  value={newTravellerRel}
                  onChange={(e) => setNewTravellerRel(e.target.value)}
                >
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  className="input-field"
                  value={newTravellerPhone}
                  onChange={(e) => setNewTravellerPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-secondary btn-sm">
                <Plus size={14} /> Add Traveller to Party
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: EMERGENCY CONTACTS */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>EMERGENCY CONTACTS</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                These contacts receive automated SMS alerts if SOS is triggered
              </p>
            </div>
            <Heart size={20} color="#EF4444" />
          </div>

          {emergencyContacts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', textAlign: 'center' }}>
              No family contacts added.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {emergencyContacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{c.name}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      ({c.relationship}) • {c.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="btn btn-sm btn-outline"
                    style={{ color: '#EF4444', borderColor: '#FECACA', padding: '3px 8px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleAddEmergencyContact}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) 120px',
              gap: '0.75rem',
              alignItems: 'flex-end'
            }}
          >
            <div>
              <label className="input-label">Contact Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh"
                className="input-field"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Relationship *</label>
              <select
                className="input-field"
                value={newContactRel}
                onChange={(e) => setNewContactRel(e.target.value)}
                required
              >
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Phone Number *</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="input-field"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '42px' }}>
              <Plus size={14} /> Add Contact
            </button>
          </form>
        </div>

        {/* Bottom Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={handleSaveAndContinue}
            className="btn btn-primary btn-lg"
            style={{ padding: '0.85rem 2rem' }}
          >
            Save & Continue to Trip Setup <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
