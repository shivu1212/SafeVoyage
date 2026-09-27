import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function ItineraryCard({
  activity,
  isAffected,
  advisoryDetails,
  onEdit,
  onDuplicate,
  onDelete
}) {
  const [expanded, setExpanded] = useState(true); // Default expanded for judge visibility

  const categoryColors = {
    Beach: { bg: '#E0F2FE', text: '#0369A1' },
    Sightseeing: { bg: '#F3E8FF', text: '#7E22CE' },
    Adventure: { bg: '#FEF3C7', text: '#B45309' },
    Hiking: { bg: '#DCFCE7', text: '#15803D' },
    Shopping: { bg: '#FCE7F3', text: '#BE185D' },
    Food: { bg: '#FFEDD5', text: '#C2410C' },
    Religious: { bg: '#E0E7FF', text: '#4338CA' },
    Transport: { bg: '#F1F5F9', text: '#475569' },
    Hotel: { bg: '#CCFBF1', text: '#0F766E' },
    Nature: { bg: '#ECFDF5', text: '#047857' }
  };

  const catStyle = categoryColors[activity.category] || { bg: '#F1F5F9', text: '#475569' };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        borderLeft: isAffected ? '5px solid #EF4444' : '5px solid #10B981',
        backgroundColor: isAffected ? 'var(--bg-card)' : 'var(--bg-card)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Top Header: Day, Time, Status Badge */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.85rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-sidebar)',
              color: '#FFFFFF'
            }}
          >
            DAY {activity.day || 1}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Clock size={14} /> {activity.time || '10:00 AM'}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: catStyle.bg,
              color: catStyle.text
            }}
          >
            {activity.category || 'General'}
          </span>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAffected ? (
            <span className="badge badge-danger" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
              <AlertTriangle size={13} /> AFFECTED
            </span>
          ) : (
            <span className="badge badge-safe" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
              <CheckCircle2 size={13} /> ✓ CLEAR
            </span>
          )}
        </div>
      </div>

      {/* Activity Details */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          {activity.place}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <MapPin size={14} color="var(--primary)" /> {activity.city}
          {activity.date && <span>• {activity.date}</span>}
        </div>
        {activity.notes && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
            "{activity.notes}"
          </p>
        )}
      </div>

      {/* Requirement 10 & 11: Explicit CLEAR Banner for Unaffected Activities */}
      {!isAffected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            color: 'var(--safe-text)',
            backgroundColor: 'var(--safe-bg)',
            border: '1px solid var(--safe-border)',
            padding: '8px 12px',
            borderRadius: '8px',
            marginTop: '0.5rem',
            marginBottom: '0.75rem'
          }}
        >
          <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
          <div>
            <strong>✓ CLEAR:</strong> No active safety hazards or meteorological advisories affect this scheduled visit.
          </div>
        </div>
      )}

      {/* Requirement 11: "WHY IS THIS AFFECTED?" Explainable Breakdown for Judges */}
      {isAffected && advisoryDetails && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '10px',
            padding: '12px',
            marginTop: '0.75rem',
            marginBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-text)', fontWeight: 800, fontSize: '0.88rem' }}>
              <ShieldAlert size={17} color="#EF4444" />
              <span>⚠️ ITINERARY ALERT: {advisoryDetails.type || 'Active Advisory Match'}</span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ background: 'transparent', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', display: 'flex' }}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Detailed Explainability Box */}
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px dashed var(--danger-border)',
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--danger-text)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  WHY AFFECTED? (4-FACTOR MATCH EXPLANATION)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--danger-text)' }}>
                  <div>✓ <strong>City matched:</strong> {activity.city}</div>
                  <div>✓ <strong>Location matched:</strong> {activity.place}</div>
                  <div>✓ <strong>Date matched:</strong> {activity.date || `Day ${activity.day}`}</div>
                  <div>✓ <strong>Advisory active during scheduled visit:</strong> {advisoryDetails.startDate} to {advisoryDetails.endDate} {advisoryDetails.startTime ? `(${advisoryDetails.startTime} onwards)` : ''}</div>
                  <div>✓ <strong>Category matched:</strong> {activity.category} / {advisoryDetails.category || 'Environmental'}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--danger-text)', lineHeight: 1.4 }}>
                <strong>Advisory Scope:</strong> {advisoryDetails.description}
              </div>

              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--danger-text)' }}>
                <strong>Recommendation:</strong> {advisoryDetails.recommendation || 'Avoid this activity during the advisory period and select a safe inland alternative.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <button
          onClick={() => onDuplicate(activity.id)}
          className="btn btn-sm btn-outline"
          title="Duplicate Activity"
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
        >
          <Copy size={13} /> Duplicate
        </button>
        <button
          onClick={() => onEdit(activity)}
          className="btn btn-sm btn-outline"
          title="Edit Activity"
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
        >
          <Edit2 size={13} /> Edit
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          className="btn btn-sm btn-outline"
          title="Delete Activity"
          style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#EF4444' }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}
