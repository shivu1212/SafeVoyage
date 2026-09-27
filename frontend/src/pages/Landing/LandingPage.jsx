import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  Shield,
  ShieldAlert,
  MapPin,
  Clock,
  Compass,
  CloudRain,
  AlertOctagon,
  Users,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Radio,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '74px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#167D5A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(22, 125, 90, 0.4)'
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              SafeVoyage
            </div>
            <div style={{ fontSize: '0.7rem', color: '#167D5A', fontWeight: 700 }}>
              Stay Safe • Travel Better
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#64748B" />}
          </button>

          <Link to="/login" className="btn btn-primary" id="login-nav-btn">
            Login <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '4.5rem 1.5rem 3.5rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary-light)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          <Sparkles size={16} /> 24-Hour Hackathon Edition • Itinerary-Aware Safety Intelligence
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            color: 'var(--text-main)'
          }}
        >
          Your Intelligent Companion for <br />
          <span style={{ color: '#167D5A', textDecoration: 'underline decoration-[#A8E6CF] decoration-wavy' }}>
            Smarter, Safer Journeys
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 3rem auto',
            lineHeight: 1.6
          }}
        >
          SafeVoyage bridges the critical gap between macro travel advisories and your exact daily schedule.
          Our 4-factor risk matcher automatically maps destination threats to specific itinerary activities, keeping your entire travel party secure.
        </p>

        {/* Core Intelligent Platform Showcase */}
        <div
          className="card animate-float"
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'left'
          }}
        >
          <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={18} />
              </div>
              <strong style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                YOUR TRIP. YOUR SAFETY. ONE INTELLIGENT ASSISTANT.
              </strong>
            </div>
            <span className="badge badge-safe" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              INTEGRATED TRAVEL PLATFORM
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Compass size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>AI Trip Planning</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Context-aware itinerary analysis, schedule optimization, and proactive risk avoidance.
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <ShieldAlert size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Live Safety Alerts</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Real-time regional advisories, severe weather forecasts, and hazard perimeter tracking.
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <AlertOctagon size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Emergency Assistance</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Instant SOS emergency broadcast, emergency contacts notification, and nearby hospital radar.
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Users size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Smart Recommendations</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Personalized safety advice tailored to child supervision, senior pacing, and group welfare.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How SafeVoyage Works Section */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>How SafeVoyage Works</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            From departure to safe return, our automated pipeline keeps your family informed and prepared.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Setup Travellers & Trip', desc: 'Designate primary head traveller mobile number and register group safety tags.' },
              { step: '02', title: 'Build Multi-Day Itinerary', desc: 'Add scheduled activities by day, time, place name, and category.' },
              { step: '03', title: '4-Factor Threat Matching', desc: 'Engine correlates location, category, date, and time window with live advisories.' },
              { step: '04', title: 'Instant Head SMS & SOS', desc: 'Head person receives immediate mobile notifications with actionable safety alternatives.' }
            ].map((s, idx) => (
              <div key={idx} className="card" style={{ textAlign: 'left', position: 'relative' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8, marginBottom: '0.5rem' }}>
                  {s.step}
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{s.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Feature Grid */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>Core Safety Architecture</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Purpose-built tools engineered for traveler security and emergency readiness.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: ShieldAlert, title: 'Itinerary-Aware Alerting', desc: 'Pins advisories to exact itinerary entries, displaying affected items in Red and clear items in Green with plain-language recommendations.' },
            { icon: Compass, title: 'Composite 0–100 Risk Engine', desc: 'Transparent composite risk index combining meteorological, epidemiological, geopolitical, and activity hazards.' },
            { icon: MapPin, title: 'Safe Zone & Emergency Map', desc: 'Interactive map displaying verified 24/7 safe havens, trauma centers, police stations, and danger exclusion perimeters.' },
            { icon: CloudRain, title: 'Severe Weather Sentinel', desc: 'Real-time coastal swell, thunderstorm, and humidity forecasts tailored to outdoor excursion windows.' },
            { icon: AlertOctagon, title: 'One-Touch SOS & Live GPS', desc: 'Instant panic broadcast with emergency contact notification and live coordinate sharing.' },
            { icon: Users, title: 'Family Safety & Head Alerts', desc: 'Centralized telemetry dashboard for co-travellers with automated SMS alerts to the primary head traveller.' }
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: 'var(--bg-sidebar)', color: '#FFFFFF', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem', color: '#FFFFFF' }}>
            Experience Next-Gen Travel Protection
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94A3B8', marginBottom: '2rem' }}>
            Start planning safer trips with intelligent threat matching, real-time weather monitoring, and 24/7 emergency response.
          </p>
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="btn btn-primary btn-lg"
            style={{ padding: '0.9rem 2.2rem', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
          >
            PLAN YOUR SAFE TRIP <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
          <Shield size={18} color="#167D5A" />
          <strong style={{ color: 'var(--text-main)' }}>SafeVoyage</strong> — Traveler Safety & Live Alerts
        </div>
        <p>© 2026 SafeVoyage. Built for 24-Hour Hackathon Evaluation.</p>
      </footer>
    </div>
  );
}
