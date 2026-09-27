import React from 'react';
import { Shield, CloudRain, HeartPulse, AlertTriangle, Info } from 'lucide-react';

export default function RiskGauge({ riskAssessment }) {
  const { score = 72, level = 'HIGH', badgeColor = 'danger', breakdown = {}, reasons = [], disclaimer } = riskAssessment || {};

  // Calculate circular stroke
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = '#EF4444';
  if (score <= 30) gaugeColor = '#10B981';
  else if (score <= 60) gaugeColor = '#F59E0B';
  else if (score <= 80) gaugeColor = '#EF4444';
  else gaugeColor = '#991B1B';

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>OVERALL TRIP RISK SCORE</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time itinerary & destination threat analysis
          </p>
        </div>
        <span className={`badge badge-${badgeColor}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
          {level} RISK
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', margin: '0.5rem 0 1.25rem 0' }}>
        {/* Radial Gauge SVG */}
        <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="var(--border-color)"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={gaugeColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: gaugeColor }}>
              {score}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
              / 100
            </div>
          </div>
        </div>

        {/* Breakdown Factors */}
        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Weather */}
          <div>
            <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <CloudRain size={14} /> Weather Risk
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {breakdown.weather?.score || 20}/25 ({breakdown.weather?.label || 'MODERATE'})
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${((breakdown.weather?.score || 20) / 25) * 100}%`, backgroundColor: '#F59E0B', height: '100%' }} />
            </div>
          </div>

          {/* Health */}
          <div>
            <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <HeartPulse size={14} /> Health Risk
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {breakdown.health?.score || 10}/25 ({breakdown.health?.label || 'LOW'})
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${((breakdown.health?.score || 10) / 25) * 100}%`, backgroundColor: '#10B981', height: '100%' }} />
            </div>
          </div>

          {/* Safety */}
          <div>
            <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <Shield size={14} /> Safety Risk
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {breakdown.safety?.score || 24}/25 ({breakdown.safety?.label || 'HIGH'})
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${((breakdown.safety?.score || 24) / 25) * 100}%`, backgroundColor: '#EF4444', height: '100%' }} />
            </div>
          </div>

          {/* Advisories */}
          <div>
            <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <AlertTriangle size={14} /> Local Advisories
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {breakdown.advisory?.score || 20}/25 ({breakdown.advisory?.label || 'HIGH'})
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${((breakdown.advisory?.score || 20) / 25) * 100}%`, backgroundColor: '#EF4444', height: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Risk Factors Bulleted */}
      {reasons.length > 0 && (
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            KEY THREAT DRIVERS:
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {reasons.slice(0, 3).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <Info size={12} />
        <span>{disclaimer || 'SafeVoyage Demo Risk Score'}</span>
      </div>
    </div>
  );
}
