import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  Smartphone,
  Shield,
  CheckCircle2,
  Lock,
  Radio,
  User,
  Mail,
  Calendar,
  Phone,
  AlertCircle,
  Save,
  Edit2
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { refreshData } = useTrip();

  // Personal Information State (Requirement 7)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || (user?.name ? user.name.split(' ')[0] : '') || '',
    lastName: user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : '') || '',
    age: user?.age ? String(user.age) : '28',
    gender: user?.gender || 'Prefer not to say',
    mobile: user?.mobile || user?.phone || '',
    email: user?.email || ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || (user.name ? user.name.split(' ')[0] : '') || '',
        lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '') || '',
        age: user.age ? String(user.age) : '28',
        gender: user.gender || 'Prefer not to say',
        mobile: user.mobile || user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const [notifPrefs, setNotifPrefs] = useState({
    safetyAlerts: true,
    smsAlerts: true,
    weatherAlerts: true,
    itineraryAlerts: true,
    familyAlerts: true,
    emergencyAlerts: true,
    ...(user?.notificationPreferences || {})
  });

  const [notifSuccess, setNotifSuccess] = useState(false);

  const handleTogglePref = (key) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const fName = profileForm.firstName.trim();
    const lName = profileForm.lastName.trim();
    const ageNum = parseInt(profileForm.age, 10);
    const cleanPhone = profileForm.mobile.replace(/[^0-9+]/g, '');

    if (!fName) {
      setProfileError('Please enter your first name.');
      return;
    }
    if (!lName) {
      setProfileError('Please enter your last name.');
      return;
    }
    if (!profileForm.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setProfileError('Please enter a valid age.');
      return;
    }
    if (!profileForm.gender) {
      setProfileError('Please select your gender.');
      return;
    }
    if (!profileForm.mobile || cleanPhone.length < 8) {
      setProfileError('Please enter a valid mobile number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        firstName: fName,
        lastName: lName,
        name: `${fName} ${lName}`.trim(),
        age: ageNum,
        gender: profileForm.gender,
        mobile: profileForm.mobile,
        phone: profileForm.mobile
      });

      // Synchronize trip context and AI so new age and info propagate immediately
      if (refreshData) {
        await refreshData();
      }

      setIsEditingProfile(false);
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    await updateProfile({
      notificationPreferences: notifPrefs
    });
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
          <SettingsIcon size={20} /> ACCOUNT & PREFERENCES SENTINEL
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account Settings & Preferences</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage your personal traveller profile, theme preferences, and safety alert channels.
        </p>
      </div>

      {profileSuccess && (
        <div
          style={{
            backgroundColor: 'var(--safe-bg)',
            border: '1px solid var(--safe-border)',
            color: 'var(--safe-text)',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          <CheckCircle2 size={18} /> {profileSuccess}
        </div>
      )}

      {/* 1. PERSONAL INFORMATION (Requirement 7) */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Personal Information
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Your verified head traveller details used across AI planning, party composition, and SOS dispatch.
            </p>
          </div>

          {!isEditingProfile ? (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <Edit2 size={14} /> Edit
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setProfileError('');
              }}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
          )}
        </div>

        {profileError && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* First Name */}
            <div>
              <label className="input-label">First Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  disabled={!isEditingProfile}
                  required
                  style={{ paddingLeft: '2.4rem' }}
                />
                <User size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="input-label">Last Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  disabled={!isEditingProfile}
                  required
                  style={{ paddingLeft: '2.4rem' }}
                />
                <User size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="input-label">Age *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="input-field"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  disabled={!isEditingProfile}
                  required
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Calendar size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Gender Dropdown */}
            <div>
              <label className="input-label">Gender *</label>
              <select
                className="input-field"
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                disabled={!isEditingProfile}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="input-label">Mobile Number *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="input-field"
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  disabled={!isEditingProfile}
                  required
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Phone size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  value={profileForm.email}
                  disabled
                  style={{ paddingLeft: '2.4rem', opacity: 0.8 }}
                />
                <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {isEditingProfile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileError('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="btn btn-primary"
                style={{ gap: '6px' }}
              >
                <Save size={16} /> {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. APPEARANCE SETTINGS */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Interface Appearance
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Switch between crisp high-contrast Light mode and sleek Navy Dark mode.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => { if (isDark) toggleTheme(); }}
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              border: `2px solid ${!isDark ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: !isDark ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Sun size={24} color={!isDark ? 'var(--primary)' : 'var(--text-muted)'} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Light Theme</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clean coastal layout</div>
          </button>

          <button
            type="button"
            onClick={() => { if (!isDark) toggleTheme(); }}
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              border: `2px solid ${isDark ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: isDark ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Moon size={24} color={isDark ? 'var(--primary)' : 'var(--text-muted)'} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dark Theme</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tactical midnight navy</div>
          </button>
        </div>
      </div>

      {/* 3. NOTIFICATION & ALERT SENTINEL CHANNELS */}
      <form onSubmit={handleSaveNotifications}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Live Advisory Alert Subscriptions
            </h3>
            {notifSuccess && (
              <span className="badge badge-safe" style={{ fontSize: '0.8rem' }}>
                <CheckCircle2 size={12} /> Preferences Saved
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Configure push indicators and alert notifications for your travel corridors.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { key: 'safetyAlerts', label: 'High-Priority Safety Advisories', desc: 'Critical alerts including beach red-flags, unrest, or evacuations' },
              { key: 'weatherAlerts', label: 'Severe Weather Sentinels', desc: 'Swell, heavy precipitation, and gale warnings' },
              { key: 'itineraryAlerts', label: 'Itinerary Conflict Warnings', desc: 'Direct alerts when your scheduled activities overlap hazard zones' },
              { key: 'familyAlerts', label: 'Emergency Contact Dispatch Receipts', desc: 'Instant confirmation when SOS telemetry is broadcasted' }
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => handleTogglePref(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '999px',
                    backgroundColor: notifPrefs[item.key] ? '#10B981' : '#94A3B8',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: notifPrefs[item.key] ? '23px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 1.5rem' }}>
              Save Notification Preferences
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
