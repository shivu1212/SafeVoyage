import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import { DEFAULT_AVATAR, getAvatarSrc } from '../../utils/avatar.js';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Edit2,
  Users,
  Heart,
  Luggage,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { trip, travellers, emergencyContacts } = useTrip();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    alternatePhone: user?.alternatePhone || ''
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
    setEditModalOpen(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setAvatarError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile pictures must be 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.onerror = () => {
      setAvatarError('Unable to preview that image. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      await updateProfile({ avatar: avatarPreview });
      setAvatarPreview(null);
    } catch (err) {
      setAvatarError(err.message || 'Unable to save your profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      await updateProfile({ avatar: '' });
      setAvatarPreview(null);
    } catch (err) {
      setAvatarError(err.message || 'Unable to remove your profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const displayedAvatar = avatarPreview || getAvatarSrc(user?.avatar);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Banner */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={displayedAvatar}
              alt={user?.name}
              onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
              style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
            />
            <label
              className="btn btn-secondary btn-sm"
              style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', cursor: isUploadingAvatar ? 'wait' : 'pointer', fontSize: '0.7rem', padding: '3px 8px' }}
            >
              {isUploadingAvatar ? 'Saving...' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
                style={{ display: 'none' }}
              />
            </label>
            {avatarPreview && !isUploadingAvatar && (
              <div style={{ display: 'flex', gap: '4px', position: 'absolute', top: '96px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                <button type="button" onClick={handleSaveAvatar} className="btn btn-primary btn-sm" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>Save</button>
                <button type="button" onClick={() => { setAvatarPreview(null); setAvatarError(''); }} className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>Cancel</button>
              </div>
            )}
          </div>

          {avatarError && <div style={{ width: '100%', color: 'var(--danger-text)', fontSize: '0.8rem' }}>{avatarError}</div>}

          {!avatarPreview && user?.avatar && !isUploadingAvatar && (
            <button type="button" onClick={handleRemoveAvatar} className="btn btn-outline btn-sm" style={{ fontSize: '0.72rem' }}>
              Remove photo
            </button>
          )}

          <div style={{ flex: 1 }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{user?.name || 'Traveler'}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem' }}>
                  <ShieldCheck size={16} /> Designated Primary Head Traveller
                </div>
              </div>

              <button
                onClick={() => {
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    alternatePhone: user?.alternatePhone || ''
                  });
                  setEditModalOpen(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Mail size={15} /> {user?.email || 'No email provided'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Phone size={15} /> <strong>Primary:</strong> {user?.phone || 'Not provided'}
              </div>
              {user?.alternatePhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Phone size={15} /> <strong>Alt:</strong> {user?.alternatePhone}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Telemetry Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CO-TRAVELLERS</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{travellers.length} Individuals</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered under this safety profile</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EMERGENCY CONTACTS</span>
            <Heart size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{emergencyContacts.length} Guardians</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Live SMS emergency broadcast list</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ACTIVE TRIP</span>
            <Luggage size={18} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{trip?.destination || 'Chennai'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>24–27 Sep • Sentinel Active</div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Head Traveller Profile"
        maxWidth="460px"
      >
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="input-label">Primary Mobile Number (SMS Alert Target)</label>
            <input
              type="tel"
              className="input-field"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="input-label">Alternate Phone</label>
            <input
              type="tel"
              className="input-field"
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
