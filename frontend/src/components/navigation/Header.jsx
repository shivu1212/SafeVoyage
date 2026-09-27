import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { DEFAULT_AVATAR, getAvatarSrc } from '../../utils/avatar.js';
import {
  Bell,
  Sun,
  Moon,
  MapPin,
  Menu,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function Header({ onToggleMobileMenu }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { trip, matchingResults, updateDestination } = useTrip();
  const { notifications, unreadCount, markAsRead, markAllAsRead, triggerSmsToast } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [destInput, setDestInput] = useState(trip?.destination || '');
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setDestInput(trip?.destination || '');
  }, [trip?.destination]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDestinationSubmit = (e) => {
    e.preventDefault();
    if (destInput && destInput.trim()) {
      updateDestination(destInput.trim());
      setIsEditingDest(false);
    }
  };

  const handleSimulateSms = () => {
    const topAffected = matchingResults.affected[0];
    const message = topAffected 
      ? `SafeVoyage Alert: Day ${topAffected.day} • ${topAffected.time} • ${topAffected.place} is affected by ${topAffected.alertTitle || 'Hazard Advisory'}. Please review itinerary.`
      : `SafeVoyage Update: All scheduled activities in ${trip?.destination || 'your destination'} are currently verified clear.`;

    triggerSmsToast(
      message,
      user?.phone || '+91 98765 43210',
      isDemoMode ? 'DEMO SMS' : 'SMS ALERT'
    );
  };

  // Format date range display
  const formatDateRange = () => {
    if (!trip?.startDate || !trip?.endDate) return 'Trip Dates';
    const s = new Date(trip.startDate);
    const e = new Date(trip.endDate);
    if (isNaN(s) || isNaN(e)) return `${trip.startDate} – ${trip.endDate}`;
    return `${s.getDate()} ${s.toLocaleString('default', { month: 'short' })} – ${e.getDate()} ${e.toLocaleString('default', { month: 'short' })}`;
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Left: Mobile hamburger & Interactive Destination Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '6px' }}
          id="mobile-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Interactive Destination Search Pill */}
        {isEditingDest ? (
          <form onSubmit={handleDestinationSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                autoFocus
                className="input-field"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="Enter destination (e.g. Mumbai, Goa, Jaipur)"
                style={{ padding: '0.35rem 0.75rem 0.35rem 2rem', fontSize: '0.85rem', width: '220px', borderRadius: '999px' }}
              />
              <MapPin size={14} color="var(--primary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
              Update
            </button>
            <button type="button" onClick={() => setIsEditingDest(false)} className="btn btn-sm btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              ✕
            </button>
          </form>
        ) : (
          <div
            onClick={() => setIsEditingDest(true)}
            title="Click to change destination"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'border-color 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)' }}>
              <MapPin size={16} />
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                {trip?.destination || 'Destination'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>✏️</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <Calendar size={14} />
              <span>{formatDateRange()}</span>
            </div>
            {matchingResults.affectedCount > 0 ? (
              <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '1px 7px' }}>
                {matchingResults.affectedCount} Alert
              </span>
            ) : (
              <span className="badge badge-safe" style={{ fontSize: '0.7rem', padding: '1px 7px' }}>
                Clear
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Notification Bell, Theme toggle, Profile Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Quick Sentinel AI Assistant Trigger */}
        <button
          onClick={() => navigate('/assistant')}
          className="btn btn-sm btn-primary"
          title="Open Sentinel AI Safety Assistant"
          style={{ fontSize: '0.8rem', gap: '5px', padding: '0.4rem 0.85rem' }}
          id="header-ask-ai-btn"
        >
          <Sparkles size={14} />
          <span className="hide-mobile">Ask AI</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '360px',
                maxWidth: '90vw',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-xl)',
                overflow: 'hidden',
                zIndex: 100,
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  Safety Notifications ({unreadCount} unread)
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.type === 'ITINERARY_ALERT') navigate('/itinerary');
                        else if (n.type === 'SOS_ALERT') navigate('/emergency');
                        else navigate('/safety-alerts');
                        setShowNotifDropdown(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: n.read ? 'transparent' : 'var(--bg-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span
                          className={`badge badge-${n.severity === 'CRITICAL' || n.severity === 'HIGH' ? 'danger' : n.severity === 'MODERATE' ? 'caution' : 'info'}`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '4px 0', lineHeight: 1.35 }}>
                        {n.message}
                      </p>
                      {n.affectedActivity && (
                        <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>
                          ⚠️ Activity: {n.affectedActivity}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '8px 16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-subtle)',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <button
                  onClick={() => {
                    navigate('/safety-alerts');
                    setShowNotifDropdown(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  View All Safety Advisories →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#64748B" />}
        </button>

        {/* User Avatar Pill */}
        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px 4px 4px',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer'
          }}
        >
          <img
            src={getAvatarSrc(user?.avatar)}
            alt={user?.name}
            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', paddingRight: '4px' }}>
            {user?.name?.split(' ')[0] || 'Profile'}
          </span>
        </div>
      </div>
    </header>
  );
}
