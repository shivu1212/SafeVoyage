import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrip } from '../../context/TripContext.jsx';
import SafetyMap from '../../components/map/SafetyMap.jsx';
import WeatherWidget from '../../components/weather/WeatherWidget.jsx';
import Modal from '../../components/common/Modal.jsx';
import ErrorBoundary from '../../components/common/ErrorBoundary.jsx';
import {
  ShieldAlert,
  Compass,
  Sun,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  PlusCircle,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { summarizeAdvisory } from '../../utils/alertSummarizer.js';

export default function SafetyAlertsPage() {
  const [searchParams] = useSearchParams();
  const routeToParam = searchParams.get('routeTo') || '';
  const {
    advisories = [],
    addAdvisory,
    mapPoints = [],
    weather,
    matchingResults = { affected: [], clear: [] },
    itinerary = [],
    trip,
    destinations = [],
    activeDestination,
    setActiveDestination,
    userLocation
  } = useTrip();

  const [activeTab, setActiveTab] = useState('MAP'); // MAP, WEATHER, ALERTS
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingAdvisory, setSubmittingAdvisory] = useState(false);
  const [liveLocation, setLiveLocation] = useState(userLocation || null);

  // New advisory form state
  const [newAdvisoryForm, setNewAdvisoryForm] = useState({
    type: 'Monsoon Heavy Wave & Swell Alert',
    severity: 'HIGH',
    category: 'Beach',
    location: '',
    description: 'High swells and rip currents active along coastal shorelines.',
    recommendation: 'Avoid deep water activities and follow lifeguard safety instructions.'
  });

  // Calculate destination list
  const destinationList = useMemo(() => {
    const list = [];
    if (destinations && destinations.length > 0) {
      destinations.forEach(d => {
        if (d.name && !list.includes(d.name)) list.push(d.name);
      });
    }
    if (trip?.destination && !list.includes(trip.destination)) {
      list.unshift(trip.destination);
    }
    return list;
  }, [destinations, trip?.destination]);

  const currentDest = activeDestination || trip?.destination || destinationList[0] || '';

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.warn('[Safety Alerts geolocation warning]', error.message);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!activeDestination && currentDest && typeof setActiveDestination === 'function') {
      setActiveDestination(currentDest);
    }
  }, [activeDestination, currentDest, setActiveDestination]);

  useEffect(() => {
    if (routeToParam) {
      setActiveTab('MAP');
    }
  }, [routeToParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'MAP') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  };

  const handleCreateAdvisory = async (e) => {
    e.preventDefault();
    if (!newAdvisoryForm.type.trim()) return;

    setSubmittingAdvisory(true);
    try {
      if (typeof addAdvisory === 'function') {
        await addAdvisory({
          ...newAdvisoryForm,
          city: currentDest,
          location: newAdvisoryForm.location || `${currentDest} Central Zone`
        });
      }
      setIsAddModalOpen(false);
      setNewAdvisoryForm({
        type: '',
        severity: 'HIGH',
        category: 'General',
        location: '',
        description: '',
        recommendation: ''
      });
    } catch (err) {
      console.error('[Error creating advisory]', err);
    } finally {
      setSubmittingAdvisory(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
            <ShieldAlert size={20} /> UNIFIED DESTINATION SENTINEL
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Safety, Weather & Live Alerts</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time multi-layered situational intelligence for <strong style={{ color: 'var(--text-main)' }}>{currentDest}</strong>.
          </p>
        </div>

        {/* Destination Switcher & Tab Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Destination Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="var(--primary)" />
            <select
              value={currentDest}
              onChange={(e) => {
                if (typeof setActiveDestination === 'function') {
                  setActiveDestination(e.target.value);
                }
              }}
              className="input"
              style={{
                padding: '6px 12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              {destinationList.map((d) => (
                <option key={d} value={d}>
                  📍 {d}
                </option>
              ))}
            </select>
          </div>

          {/* 3 Unified Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              gap: '4px'
            }}
          >
            <button
              onClick={() => handleTabChange('MAP')}
              className={`btn btn-sm ${activeTab === 'MAP' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', gap: '6px' }}
            >
              <Compass size={16} /> 🗺️ Safety Map
            </button>
            <button
              onClick={() => handleTabChange('WEATHER')}
              className={`btn btn-sm ${activeTab === 'WEATHER' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', gap: '6px' }}
            >
              <Sun size={16} /> 🌦️ Weather
            </button>
            <button
              onClick={() => handleTabChange('ALERTS')}
              className={`btn btn-sm ${activeTab === 'ALERTS' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', gap: '6px' }}
            >
              <ShieldAlert size={16} /> 🚨 Alerts ({advisories.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SAFETY MAP (Retained mounted in DOM to prevent Leaflet/Google Maps recreate bugs) */}
      <div style={{ display: activeTab === 'MAP' ? 'block' : 'none', animation: 'fadeIn 0.2s ease' }}>
        <ErrorBoundary title="Destination Sentinel & Safety Map">
          <SafetyMap 
            points={mapPoints} 
            destination={currentDest} 
            userCoords={liveLocation}
            initialLocationQuery={routeToParam}
          />
        </ErrorBoundary>
      </div>

      {/* TAB 2: WEATHER */}
      {activeTab === 'WEATHER' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <WeatherWidget weather={weather} city={currentDest} />
        </div>
      )}

      {/* TAB 3: ADVISORIES & PLAIN-LANGUAGE SUMMARIES */}
      {activeTab === 'ALERTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
          {/* Top Bar with Report Advisory Action */}
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', backgroundColor: 'var(--card-bg)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Municipal & Meteorological Bulletins for {currentDest}
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                {advisories.length} Active {advisories.length === 1 ? 'Advisory' : 'Advisories'}
              </span>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-sm btn-outline"
              style={{ gap: '6px', fontSize: '0.85rem' }}
            >
              <PlusCircle size={15} /> + Report / Simulate Advisory
            </button>
          </div>

          {/* Empty State when no advisories active */}
          {advisories.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed var(--safe-border, #10B981)',
                backgroundColor: 'rgba(16, 185, 129, 0.04)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <CheckCircle2 size={36} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                All Zones Clear • No Active Severe Hazards
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5, marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                Municipal surveillance and weather monitoring report normal, safe conditions in <strong>{currentDest}</strong>. No critical curfew, flood, or extreme swell warnings are active.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleTabChange('MAP')}
                  className="btn btn-sm btn-primary"
                  style={{ gap: '6px' }}
                >
                  <Compass size={16} /> Explore Safety Infrastructure on Map
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-sm btn-outline"
                  style={{ gap: '6px' }}
                >
                  <PlusCircle size={16} /> Simulate / Add Advisory
                </button>
              </div>
            </div>
          ) : (
            advisories.map((adv) => {
              // Find if any itinerary item is affected by this advisory
              const affectedItems = (matchingResults?.affected || []).filter(
                (a) => a.advisory?.id === adv.id || a.advisory?.type === adv.type
              );
              const summary = summarizeAdvisory(adv, affectedItems[0]);

              return (
                <div
                  key={adv.id}
                  className="card"
                  style={{
                    borderLeft: adv.severity === 'HIGH' ? '4px solid #EF4444' : adv.severity === 'MODERATE' ? '4px solid #F59E0B' : '4px solid #3B82F6',
                    padding: '1.5rem'
                  }}
                >
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className={`badge badge-${adv.severity === 'HIGH' ? 'danger' : adv.severity === 'MODERATE' ? 'caution' : 'info'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {adv.severity} RISK
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                        {adv.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        <span>Valid: {adv.startDate || 'Current'} to {adv.endDate || 'Active'}</span>
                        {adv.startTime && <span>({adv.startTime} onwards)</span>}
                      </div>

                      <button
                        onClick={() => handleTabChange('MAP')}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', gap: '4px' }}
                        title="View hazard zone and emergency perimeter on Safety Map"
                      >
                        <Compass size={14} /> 🗺️ View on Map
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    <strong>Official Bulletin:</strong> {adv.description}
                  </div>

                  {/* Plain-Language Traveller Guidance Box */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                      <Sparkles size={16} /> Plain-Language Traveller Guidance
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {summary?.plainSummary || adv.description}
                    </p>
                    <div style={{ marginTop: '6px', fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      💡 <strong>Action Recommendation:</strong> {adv.recommendation || 'Exercise standard situational awareness.'}
                    </div>
                  </div>

                  {/* Mapped Itinerary Activity Link */}
                  {affectedItems.length > 0 ? (
                    <div
                      style={{
                        backgroundColor: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: 'var(--danger-text)' }}>
                        <strong>⚠️ Correlated Itinerary Activity:</strong> {affectedItems.map(a => `Day ${a.day} • ${a.time} • ${a.place}`).join(', ')}
                      </div>
                      <span className="badge badge-danger">🔴 1 ITINERARY CONFLICT</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--safe-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> No current itinerary activities conflict with this advisory window.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Report Advisory Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Report / Simulate Advisory for ${currentDest}`}
        maxWidth="520px"
      >
        <form onSubmit={handleCreateAdvisory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Advisory Title / Hazard Type *
            </label>
            <input
              type="text"
              required
              className="input"
              value={newAdvisoryForm.type}
              onChange={(e) => setNewAdvisoryForm({ ...newAdvisoryForm, type: e.target.value })}
              placeholder="e.g. Flash Flood Precaution, Coastal Rip Current, Fog Alert"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Severity Level *
              </label>
              <select
                className="input"
                value={newAdvisoryForm.severity}
                onChange={(e) => setNewAdvisoryForm({ ...newAdvisoryForm, severity: e.target.value })}
              >
                <option value="HIGH">HIGH (Red Warning)</option>
                <option value="MODERATE">MODERATE (Amber Caution)</option>
                <option value="LOW">LOW (Informational)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Category *
              </label>
              <select
                className="input"
                value={newAdvisoryForm.category}
                onChange={(e) => setNewAdvisoryForm({ ...newAdvisoryForm, category: e.target.value })}
              >
                <option value="Beach">Beach / Coastal</option>
                <option value="Nature">Nature / Trekking</option>
                <option value="Transport">Transport / Traffic</option>
                <option value="Weather">Weather / Storm</option>
                <option value="General">General / Security</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Specific Location / Perimeter
            </label>
            <input
              type="text"
              className="input"
              value={newAdvisoryForm.location}
              onChange={(e) => setNewAdvisoryForm({ ...newAdvisoryForm, location: e.target.value })}
              placeholder={`e.g. ${currentDest} North Coastal Corridor or Central Ridge`}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Official Bulletin / Description *
            </label>
            <textarea
              required
              rows={3}
              className="input"
              value={newAdvisoryForm.description}
              onChange={(e) => setNewAdvisoryForm({ ...newAdvisoryForm, description: e.target.value })}
              placeholder="Describe the nature of the hazard, conditions observed, and timeline..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Recommended Traveler Action *
            </label>
            <input
              type="text"
              required
              className="input"
              value={newAdvisoryForm.recommendation}
              onChange={(e) => setNewAdvisoryForm({ ...newAdvisoryForm, recommendation: e.target.value })}
              placeholder="e.g. Keep safe distance from water edge, carry rain gear, delay trek..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdvisory}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              {submittingAdvisory ? 'Registering...' : 'Publish Advisory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
