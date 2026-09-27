import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { DEFAULT_AVATAR, getAvatarSrc } from '../../utils/avatar.js';
import {
  Shield,
  LayoutDashboard,
  Luggage,
  ShieldAlert,
  HeartPulse,
  AlertOctagon,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Radio,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ onCloseMobile }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/itinerary', label: 'My Trip & Itinerary', icon: Luggage },
    { to: '/safety-alerts', label: 'Safety & Alerts', icon: ShieldAlert },
    { to: '/assistant', label: 'AI Safety Assistant', icon: Sparkles, isAi: true },
    { to: '/health-safety', label: 'Health & Safety', icon: HeartPulse },
    { to: '/emergency', label: 'Emergency / SOS', icon: AlertOctagon, isEmergency: true },
    { to: '/family', label: 'Family & Contacts', icon: Users }
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        color: 'var(--text-sidebar)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
        userSelect: 'none'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#167D5A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(22, 125, 90, 0.4)'
          }}
        >
          <Shield size={24} />
        </div>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            SafeVoyage
          </div>
          <div style={{ fontSize: '0.7rem', color: '#A8E6CF', fontWeight: 600 }}>
            Stay Safe • Travel Better
          </div>
        </div>
      </div>

      {/* Live Sentinel Badge */}
      <div style={{ padding: '0.75rem 1.25rem 0.25rem 1.25rem' }}>
        <div
          style={{
            background: 'rgba(22, 125, 90, 0.15)',
            border: '1px solid rgba(168, 230, 207, 0.3)',
            borderRadius: '8px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#A8E6CF'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} className="animate-pulse-sos" /> Sentinel Monitoring
          </span>
          <span style={{ fontWeight: 700 }}>ACTIVE</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: isActive
                  ? '#FFFFFF'
                  : item.isEmergency
                  ? '#FCA5A5'
                  : 'var(--text-sidebar-muted)',
                backgroundColor: isActive
                  ? item.isEmergency
                    ? '#DC2626'
                    : 'var(--bg-sidebar-active)'
                  : 'transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={item.isAi ? '#A8E6CF' : undefined} />
                <span>{item.label}</span>
              </div>
              {item.isAi ? (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    color: '#A8E6CF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em'
                  }}
                >
                  AI
                </span>
              ) : (
                <ChevronRight size={14} opacity={0.4} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Settings & Logout */}
      <div
        style={{
          padding: '1rem 0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}
      >
        <NavLink
          to="/profile"
          onClick={onCloseMobile}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'var(--text-sidebar-muted)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
          })}
        >
          <img
            src={getAvatarSrc(user?.avatar)}
            alt={user?.name}
            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'Rahul Sharma'}
          </span>
        </NavLink>

        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'var(--text-sidebar-muted)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
          })}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: '#F87171',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'background 0.15s ease'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
