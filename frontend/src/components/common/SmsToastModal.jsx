import React from 'react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { MessageSquare, X, ShieldAlert, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react';

export default function SmsToastModal() {
  const { activeSmsModal, closeSmsModal } = useNotifications();

  if (!activeSmsModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '2px solid var(--primary)',
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Phone / SMS Top bar */}
        <div
          style={{
            background: 'var(--bg-sidebar)',
            color: '#FFFFFF',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span style={{ fontWeight: 600 }}>HEAD TRAVELLER MOBILE ALERT</span>
          </div>
          <button
            onClick={closeSmsModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px'
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* SMS Bubble */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  SMS Dispatch: SafeVoyage
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  To: {activeSmsModal.recipient}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: activeSmsModal.mode?.includes('LIVE') ? 'var(--safe-bg)' : 'var(--caution-bg)',
                color: activeSmsModal.mode?.includes('LIVE') ? 'var(--safe-text)' : 'var(--caution-text)',
                border: `1px solid ${activeSmsModal.mode?.includes('LIVE') ? 'var(--safe-border)' : 'var(--caution-border)'}`
              }}
            >
              {activeSmsModal.mode || 'DEMO SMS'}
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.88rem',
              lineHeight: 1.4,
              color: 'var(--text-main)',
              marginBottom: '12px'
            }}
          >
            {activeSmsModal.message}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} color="#10B981" /> Delivered at {activeSmsModal.timestamp}
            </span>
            <button
              onClick={closeSmsModal}
              className="btn btn-sm btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
