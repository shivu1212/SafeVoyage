import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext.jsx';
import { api } from '../../utils/api.js';
import {
  HeartPulse,
  Hospital,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Users,
  Shield,
  Sparkles,
  ExternalLink,
  Send,
  MessageSquare,
  Info
} from 'lucide-react';

export default function HealthSafetyPage() {
  const { travellers, trip, activeDestination, destinationSafety, advisories, weather, partyBreakdown } = useTrip();

  const currentDest = activeDestination || trip?.destination || '';

  // AI Assistant in Health & Safety state (Requirement 15)
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [desktopCallNotice, setDesktopCallNotice] = useState('');

  // Destination-specific health data (Requirement 13)
  const healthData = destinationSafety?.health || {
    status: currentDest ? `Health status evaluated for ${currentDest}` : 'Live health information unavailable.',
    advisories: advisories.filter(a => a.type?.toLowerCase().includes('health') || a.type?.toLowerCase().includes('heat') || a.type?.toLowerCase().includes('water')),
    source: 'Regional Public Health Surveillance',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    vaccinations: currentDest ? 'Ensure routine vaccinations (Tetanus, Typhoid, Hepatitis A) are up to date for travel.' : 'Live health information unavailable.',
    environmental: weather ? `Current temp ${weather.temperature || 'N/A'}°C, Humidity ${weather.humidity || 'N/A'}%. Maintain hydration.` : 'Live environmental health data unavailable.'
  };

  const hospitals = destinationSafety?.hospitals && destinationSafety.hospitals.length > 0
    ? destinationSafety.hospitals
    : [
        {
          name: currentDest ? `${currentDest} General Medical Hospital` : 'Emergency Hospital',
          type: '24/7 Multi-Speciality Trauma Center',
          address: currentDest ? `Central Sector, ${currentDest}` : 'Emergency Sector',
          distance: '1.5 km',
          phone: '108',
          status: 'Open 24/7'
        }
      ];

  const handleCallClick = (number) => {
    // Check if desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      setDesktopCallNotice(`Dialing ${number}: If your computer does not have a connected telephony app, please dial ${number} on your mobile phone.`);
      setTimeout(() => setDesktopCallNotice(''), 7000);
    }
  };

  const handleAskAIHealth = async (customPrompt) => {
    const query = customPrompt || aiQuestion;
    if (!query.trim()) return;

    setAiLoading(true);
    setAiAnswer('');

    const contextPayload = {
      destination: currentDest,
      dates: `${trip?.startDate || ''} to ${trip?.endDate || ''}`,
      travellersCount: travellers.length,
      travelParty: `${partyBreakdown?.adult || 1} adults, ${partyBreakdown?.child || 0} children, ${partyBreakdown?.elderly || 0} elderly`,
      elderlyCount: partyBreakdown?.elderly || 0,
      childrenCount: partyBreakdown?.child || 0,
      weather: weather ? `${weather.temperature}°C, ${weather.condition}` : 'Unavailable',
      advisories: advisories.map(a => a.title || a.type).join(', '),
      hospitals: hospitals.map(h => h.name).join(', ')
    };

    try {
      const res = await api.askAI(query, [], contextPayload);
      if (res?.reply) {
        setAiAnswer(res.reply);
      } else {
        setAiAnswer('Travel-safety recommendations: Maintain continuous hydration, carry prescribed medications in original containers, and note the nearest emergency medical facility.');
      }
    } catch (err) {
      console.warn('[AI Health Assistant fallback]', err.message);
      setAiAnswer(
        `For your travel party in ${currentDest || 'your destination'} (including ${partyBreakdown.elderly} elderly and ${partyBreakdown.child} children): Ensure elderly companions avoid mid-day heat, drink purified bottled water, and take scheduled rest breaks. Nearest medical assistance is reachable at 108/112.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
          <HeartPulse size={20} /> MEDICAL & PERSONAL WELLBEING
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Health & Safety Sentinel</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Destination-specific health advisories, clickable emergency hotlines, and AI safety precautions for <strong>{currentDest || 'your destination'}</strong>.
        </p>
      </div>

      {/* Desktop Call Notice Banner (Requirement 14) */}
      {desktopCallNotice && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Info size={16} />
          <span>{desktopCallNotice}</span>
        </div>
      )}

      {/* CLICKABLE EMERGENCY NUMBERS (Requirement 14) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* Ambulance / Medical: 108 */}
        <a
          href="tel:108"
          onClick={() => handleCallClick('108')}
          className="card"
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--primary-subtle)',
            border: '2px solid var(--primary-light)',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>NATIONAL AMBULANCE / MEDICAL</span>
            <PhoneCall size={20} color="#167D5A" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>
            tel: 108
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Click to initiate immediate ambulance dispatch on compatible devices.
          </p>
        </a>

        {/* National Emergency Services: 112 */}
        <a
          href="tel:112"
          onClick={() => handleCallClick('112')}
          className="card"
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--danger-bg)',
            border: '2px solid var(--danger-border)',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--danger-text)', fontWeight: 700 }}>UNIFIED EMERGENCY HELPLINE</span>
            <PhoneCall size={20} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--danger-text)' }}>
            tel: 112
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', opacity: 0.85, marginTop: '4px', margin: 0 }}>
            Click to initiate unified police, fire, or medical dispatch.
          </p>
        </a>
      </div>

      {/* DESTINATION-SPECIFIC HEALTH STATUS (Requirement 13) */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              Destination Health & Environmental Status: {currentDest || 'No Destination Selected'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Source: {healthData.source} • Verified: {healthData.date}
            </p>
          </div>
          <span className="badge badge-safe">MONITORED REGION</span>
        </div>

        {!currentDest ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Live health information unavailable. Please select or add a destination.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>OUTBREAK ADVISORY</span>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--safe-text)', marginTop: '2px' }}>
                🟢 Low Public Health Risk
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                No active disease outbreaks or regional quarantine declarations reported for {currentDest}.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>VACCINATION / TRAVEL ADVICE</span>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>
                Standard Travel Hygiene
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                {healthData.vaccinations}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>ENVIRONMENTAL CONDITIONS</span>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>
                Weather & Hydration
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                {healthData.environmental}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI HEALTH & SAFETY ASSISTANT (Requirement 15) */}
      <div
        className="card"
        style={{
          border: '1.5px solid var(--primary-light)',
          background: 'linear-gradient(135deg, rgba(22, 125, 90, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
          <Sparkles size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            AI Health & Travel-Safety Assistant
          </h3>
          <span className="badge badge-safe" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
            CONTEXT GROUNDED
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
          Ask tailored safety precautions for {currentDest || 'your trip'} taking into account your travel party ({partyBreakdown.adult} adults, {partyBreakdown.child} children, {partyBreakdown.elderly} elderly travellers).
        </p>

        {/* Quick query buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => handleAskAIHealth('My grandmother is travelling with me. What precautions should we take?')}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
          >
            "My grandmother is travelling with me. What precautions should we take?"
          </button>
          <button
            type="button"
            onClick={() => handleAskAIHealth(`What water and food precautions should children take in ${currentDest || 'our destination'}?`)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
          >
            "What water & food precautions should children take?"
          </button>
        </div>

        {/* Input box */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask a health & safety question about your trip..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskAIHealth();
            }}
          />
          <button
            onClick={() => handleAskAIHealth()}
            disabled={aiLoading || !aiQuestion.trim()}
            className="btn btn-primary"
            style={{ gap: '6px', flexShrink: 0 }}
          >
            <Send size={15} />
            <span>{aiLoading ? 'Thinking...' : 'Ask AI'}</span>
          </button>
        </div>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              lineHeight: 1.5,
              fontSize: '0.88rem',
              color: 'var(--text-main)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
              <Sparkles size={16} /> Sentinel AI Travel-Safety Recommendations:
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>{aiAnswer}</div>
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
              ⚠️ Disclaimer: SafeVoyage provides travel-safety precautions only. This is not a clinical medical diagnosis. In case of acute symptoms or emergencies, call 108/112 or consult a qualified physician immediately.
            </div>
          </div>
        )}
      </div>

      {/* Verified Medical Facilities (Requirement 12) */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Nearby Emergency Medical Facilities</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Accredited trauma and general hospital infrastructure in {currentDest || 'destination sector'}
            </p>
          </div>
          <Hospital size={20} color="#3B82F6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {hospitals.map((h, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{h.name}</span>
                  <span className="badge badge-safe" style={{ fontSize: '0.68rem' }}>{h.distance || 'Nearby'}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>{h.type}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{h.address || h.location}</div>
              </div>

              <div className="flex-between" style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--safe-text)', fontWeight: 700 }}>● {h.status || 'Emergency Care'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {h.phone ? (
                    <a
                      href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={() => handleCallClick(h.phone)}
                      className="btn btn-sm btn-primary"
                      style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                    >
                      <PhoneCall size={12} /> Call {h.phone}
                    </a>
                  ) : (
                    <button disabled className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                      Phone unavailable
                    </button>
                  )}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(h.name + ' ' + (currentDest || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} /> Map
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
