import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import RiskGauge from '../../components/common/RiskGauge.jsx';
import Modal from '../../components/common/Modal.jsx';
import {
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  Sun,
  AlertOctagon,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Phone,
  MessageSquare,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Search,
  Building,
  Shield,
  Navigation
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    trip,
    destinations,
    activeDestination,
    setActiveDestination,
    addDestination,
    updateDestinationItem,
    deleteDestinationItem,
    updateTravelPartners,
    updateTripDetails,
    travellers,
    partyBreakdown,
    itinerary,
    matchingResults,
    riskAssessment,
    weather,
    destinationSafety,
    addActivity,
    updateActivity,
    deleteActivity,
    updateDestination,
    loading
  } = useTrip();

  const { triggerSmsToast } = useNotifications();
  const navigate = useNavigate();

  // Search input for primary destination
  const [destinationSearch, setDestinationSearch] = useState('');

  // Destination modal state
  const [destModal, setDestModal] = useState(false);
  const [editingDestId, setEditingDestId] = useState(null);
  const [newDestName, setNewDestName] = useState('');
  const [newDestStart, setNewDestStart] = useState('');
  const [newDestEnd, setNewDestEnd] = useState('');
  const [newDestAdults, setNewDestAdults] = useState(1);
  const [newDestChildren, setNewDestChildren] = useState(0);
  const [newDestElderly, setNewDestElderly] = useState(0);
  const [destError, setDestError] = useState('');

  // Destination confirmation remove modal
  const [confirmDeleteDest, setConfirmDeleteDest] = useState(null);

  // Travel Partners quick edit modal
  const [partnerEditModal, setPartnerEditModal] = useState(false);
  const [tempAdults, setTempAdults] = useState(1);
  const [tempChildren, setTempChildren] = useState(0);
  const [tempElderly, setTempElderly] = useState(0);

  // Activity modal state (Customizable Upcoming Activities)
  const [activityModal, setActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [actName, setActName] = useState('');
  const [actLocation, setActLocation] = useState('');
  const [actDate, setActDate] = useState('');
  const [actTime, setActTime] = useState('10:00 AM');
  const [actCategory, setActCategory] = useState('Sightseeing');
  const [actNotes, setActNotes] = useState('');
  const [quickDirectionQuery, setQuickDirectionQuery] = useState('');

  const currentDest = activeDestination || trip?.destination || '';
  const activeDest = destinations.find(d => d.name?.toLowerCase() === currentDest?.toLowerCase());

  // Travel partners counts from active destination or trip data
  const currentAdults = activeDest?.adults !== undefined 
    ? Number(activeDest.adults) 
    : (trip?.adults !== undefined ? Number(trip.adults) : (partyBreakdown.adult || 1));
  const currentChildren = activeDest?.children !== undefined 
    ? Number(activeDest.children) 
    : (trip?.children !== undefined ? Number(trip.children) : (partyBreakdown.child || 0));
  const currentElderly = activeDest?.elderly !== undefined 
    ? Number(activeDest.elderly) 
    : (trip?.elderly !== undefined ? Number(trip.elderly) : (partyBreakdown.elderly || 0));

  // Filter itinerary for current active destination (Robust matching so AI Chatbox added activities always show)
  const destActivities = itinerary.filter(a => {
    if (!currentDest) return true;
    const curr = currentDest.toLowerCase().trim();
    if (!curr) return true;

    // If trip has only 1 destination or no multi-destination list, all itinerary activities belong to this trip
    if (!destinations || destinations.length <= 1) return true;

    const city = (a.city || '').toLowerCase().trim();
    const dest = (a.destination || '').toLowerCase().trim();
    const loc = (a.location || '').toLowerCase().trim();
    const place = (a.place || a.name || '').toLowerCase().trim();

    // 1. Untagged activities default to active destination
    if (!city && !dest) return true;

    // 2. Direct exact match
    if (city === curr || dest === curr) return true;

    // 3. Substring containment match (e.g. "Netravati Peak" vs "Netravati")
    if (city && (city.includes(curr) || curr.includes(city))) return true;
    if (dest && (dest.includes(curr) || curr.includes(dest))) return true;

    // 4. Activity place or location contains destination name
    if (loc && (loc.includes(curr) || curr.includes(loc))) return true;
    if (place && place.includes(curr)) return true;

    return false;
  });

  // Find next affected activity or first scheduled activity
  const nextActivity = matchingResults.affected[0] || destActivities[0];
  const isNextAffected = matchingResults.affected.some(a => a.id === nextActivity?.id);

  const handleOpenAddDest = () => {
    setEditingDestId(null);
    setNewDestName('');
    setNewDestStart(trip?.startDate || '');
    setNewDestEnd(trip?.endDate || '');
    setNewDestAdults(currentAdults || 1);
    setNewDestChildren(currentChildren || 0);
    setNewDestElderly(currentElderly || 0);
    setDestError('');
    setDestModal(true);
  };

  const handleOpenEditDest = (d) => {
    setEditingDestId(d.id);
    setNewDestName(d.name || '');
    setNewDestStart(d.startDate || '');
    setNewDestEnd(d.endDate || '');
    setNewDestAdults(d.adults !== undefined ? Number(d.adults) : 1);
    setNewDestChildren(d.children !== undefined ? Number(d.children) : 0);
    setNewDestElderly(d.elderly !== undefined ? Number(d.elderly) : 0);
    setDestError('');
    setDestModal(true);
  };

  const handleSaveDestination = async (e) => {
    e.preventDefault();
    setDestError('');
    if (!newDestName.trim()) {
      setDestError('Please enter a destination.');
      return;
    }
    if (!newDestStart) {
      setDestError('Please select a start date.');
      return;
    }
    if (!newDestEnd) {
      setDestError('Please select an end date.');
      return;
    }
    if (new Date(newDestStart) > new Date(newDestEnd)) {
      setDestError('Start date must be before or equal to end date.');
      return;
    }

    const payload = {
      name: newDestName.trim(),
      city: newDestName.trim(),
      startDate: newDestStart,
      endDate: newDestEnd,
      adults: Number(newDestAdults) || 1,
      children: Number(newDestChildren) || 0,
      elderly: Number(newDestElderly) || 0
    };

    if (editingDestId && editingDestId !== 'primary') {
      await updateDestinationItem(editingDestId, payload);
    } else if (editingDestId === 'primary') {
      await updateDestination(newDestName.trim());
      await updateTripDetails(payload);
    } else {
      await addDestination(payload);
    }

    setEditingDestId(null);
    setNewDestName('');
    setNewDestStart('');
    setNewDestEnd('');
    setNewDestAdults(1);
    setNewDestChildren(0);
    setNewDestElderly(0);
    setDestError('');
    setDestModal(false);
  };

  const handlePromptDeleteDest = (d) => {
    setConfirmDeleteDest(d);
  };

  const handleConfirmDeleteDest = async () => {
    if (!confirmDeleteDest) return;
    if (confirmDeleteDest.id && confirmDeleteDest.id !== 'primary') {
      await deleteDestinationItem(confirmDeleteDest.id);
    } else {
      await updateTripDetails({ destination: '', startDate: '', endDate: '' });
      await updateDestination('');
    }
    setConfirmDeleteDest(null);
  };

  const handleOpenPartnerEdit = () => {
    setTempAdults(currentAdults);
    setTempChildren(currentChildren);
    setTempElderly(currentElderly);
    setPartnerEditModal(true);
  };

  const handleSaveTravelPartners = async (e) => {
    e.preventDefault();
    const updated = {
      adults: Number(tempAdults) || 1,
      children: Number(tempChildren) || 0,
      elderly: Number(tempElderly) || 0
    };
    if (updateTravelPartners) {
      await updateTravelPartners(updated);
    } else if (activeDest) {
      await updateDestinationItem(activeDest.id, updated);
    } else {
      await updateTripDetails(updated);
    }
    setPartnerEditModal(false);
  };

  const handleOpenAddActivity = () => {
    setEditingActivityId(null);
    setActName('');
    setActLocation('');
    setActDate(trip.startDate || new Date().toISOString().split('T')[0]);
    setActTime('10:00 AM');
    setActCategory('Sightseeing');
    setActNotes('');
    setActivityModal(true);
  };

  const handleOpenEditActivity = (act) => {
    setEditingActivityId(act.id);
    setActName(act.place || act.name || '');
    setActLocation(act.location || act.place || '');
    setActDate(act.date || trip.startDate || '');
    setActTime(act.time || '10:00 AM');
    setActCategory(act.category || 'Sightseeing');
    setActNotes(act.notes || '');
    setActivityModal(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!actName.trim()) return;

    if (editingActivityId) {
      await updateActivity(editingActivityId, {
        place: actName.trim(),
        location: actLocation.trim() || actName.trim(),
        date: actDate,
        time: actTime,
        category: actCategory,
        notes: actNotes,
        city: currentDest
      });
    } else {
      await addActivity({
        place: actName.trim(),
        location: actLocation.trim() || actName.trim(),
        date: actDate,
        time: actTime,
        category: actCategory,
        notes: actNotes,
        destination: currentDest,
        city: currentDest,
        day: 1
      });
    }

    setActivityModal(false);
  };

  const handleSimulateSms = () => {
    const topAffected = matchingResults.affected[0];
    const message = topAffected
      ? `SafeVoyage Alert: ${topAffected.time} • ${topAffected.place} is affected by ${topAffected.alertTitle || 'Active Advisory'}. Please review itinerary.`
      : `SafeVoyage Update: All scheduled activities in ${currentDest || 'your destination'} are currently verified clear.`;

    triggerSmsToast(
      message,
      user?.phone || 'Emergency Contact'
    );
  };

  // Hospital & Police Station infrastructure for Requirement 12
  const primaryHospital = destinationSafety?.hospitals?.[0] || {
    name: currentDest ? `${currentDest} General Hospital & Trauma Center` : 'Emergency Hospital',
    distance: '1.2 km away',
    location: currentDest ? `${currentDest} Central Medical Sector` : 'Medical Sector',
    phone: '108'
  };

  const primaryPolice = destinationSafety?.policeStations?.[0] || {
    name: currentDest ? `${currentDest} Central Police Station` : 'Police Headquarters',
    distance: '0.8 km away',
    location: currentDest ? `${currentDest} Security Sector` : 'Civil Lines',
    phone: '112'
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Welcome & Actions Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Good day, {user?.name?.split(' ')[0] || 'Traveler'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
            Primary Sentinel Dashboard • Active monitoring for <strong>{currentDest || 'No Destination Selected'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/emergency')}
            className="btn btn-danger btn-sm"
            style={{ gap: '6px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}
          >
            <AlertOctagon size={16} />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* MULTIPLE DESTINATIONS TABS & ADD DESTINATION (Requirement 1) */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trip Destinations
          </span>
          <button
            onClick={handleOpenAddDest}
            className="btn btn-primary btn-sm"
            style={{ gap: '4px', fontSize: '0.8rem', padding: '4px 10px' }}
          >
            <Plus size={14} /> + Add Destination
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {destinations.length > 0 ? (
            destinations.map(d => {
              const isSelected = (currentDest || '').toLowerCase() === d.name.toLowerCase();
              return (
                <div
                  key={d.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary-subtle, rgba(22, 125, 90, 0.08))' : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div onClick={() => setActiveDestination(d.name)} style={{ cursor: 'pointer' }}>
                    <div className="flex-between" style={{ marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                        DESTINATION {isSelected ? '• ACTIVE' : ''}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        👥 {d.adults || 1}A • {d.children || 0}C • {d.elderly || 0}E
                      </span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {d.startDate ? `${d.startDate}${d.endDate ? ` – ${d.endDate}` : ''}` : 'Dates not set'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditDest(d)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: '3px 8px', fontSize: '0.78rem', gap: '4px', justifyContent: 'center' }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromptDeleteDest(d)}
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1, padding: '3px 8px', fontSize: '0.78rem', gap: '4px', justifyContent: 'center' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              );
            })
          ) : trip?.destination ? (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '2px solid var(--primary)',
                backgroundColor: 'var(--primary-subtle, rgba(22, 125, 90, 0.08))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  DESTINATION • ACTIVE
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {trip.destination}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {trip.startDate ? `${trip.startDate}${trip.endDate ? ` – ${trip.endDate}` : ''}` : 'Dates not set'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditDest({ id: 'primary', name: trip.destination, startDate: trip.startDate, endDate: trip.endDate, adults: currentAdults, children: currentChildren, elderly: currentElderly })}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, padding: '3px 8px', fontSize: '0.78rem', gap: '4px', justifyContent: 'center' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handlePromptDeleteDest({ id: 'primary', name: trip.destination })}
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1, padding: '3px 8px', fontSize: '0.78rem', gap: '4px', justifyContent: 'center' }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              No destinations entered yet. Click + Add Destination to begin.
            </div>
          )}
        </div>
      </div>

      {/* Primary Trip Parameters & Travel Partners Breakdown (Requirement 1 & 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Destination & Window */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DESTINATION</span>
            <MapPin size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currentDest || 'Not Set'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {activeDest?.startDate ? `${activeDest.startDate}${activeDest.endDate ? ` – ${activeDest.endDate}` : ''}` : (trip?.startDate ? `${trip.startDate} to ${trip.endDate || 'End'}` : 'Dates not configured')}
          </div>
          {currentDest && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => handleOpenEditDest(activeDest || { id: 'primary', name: currentDest, startDate: trip.startDate, endDate: trip.endDate, adults: currentAdults, children: currentChildren, elderly: currentElderly })}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.72rem', gap: '4px' }}
              >
                <Edit2 size={11} /> Edit
              </button>
              <button
                type="button"
                onClick={() => handlePromptDeleteDest(activeDest || { id: 'primary', name: currentDest })}
                className="btn btn-danger btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.72rem', gap: '4px' }}
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Travel Partners Card (Requirement 2) */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TRAVEL PARTNERS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleOpenPartnerEdit}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.72rem', height: '24px', gap: '4px' }}
                title="Edit travel partners"
              >
                <Edit2 size={11} /> Edit
              </button>
              <Users size={16} color="#3B82F6" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Children: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{currentChildren}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Adults: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{currentAdults}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Elderly: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{currentElderly}</span>
            </div>
          </div>
        </div>

        {/* Total Scheduled Activities */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>UPCOMING ACTIVITIES</span>
            <Calendar size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {destActivities.length} in {currentDest || 'Trip'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Customizable itinerary
          </div>
        </div>

        {/* Real Weather Metric (Requirement 5) */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div className="flex-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>WEATHER TELEMETRY</span>
            <Sun size={16} color="#F59E0B" />
          </div>
          {weather?.isLive ? (
            <>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {weather.temperature}°C • {weather.condition}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Feels like {weather.feelsLike}°C • Humidity {weather.humidity}% • Wind {weather.windSpeed} km/h
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Live weather data unavailable.
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Verify WEATHER_API_KEY for live data
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sentinel AI Travel Safety Companion Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 125, 90, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid var(--primary-light)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#167D5A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22, 125, 90, 0.35)',
              flexShrink: 0
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Sentinel AI Travel Companion Active
              </h3>
              <span className="badge badge-safe" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                LIVE AI
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              Tailored suggestions for <strong>{currentDest || 'your trip'}</strong> with {currentAdults} adults, {currentChildren} children, and {currentElderly} elderly travellers.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/assistant')}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.3rem', fontSize: '0.9rem', gap: '6px' }}
        >
          <Sparkles size={16} />
          <span>Launch AI Consultation</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Main Split: Left Risk Gauge Card + Right Nearest Hospital & Police (Requirement 12) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Overall Risk Score Card */}
        <RiskGauge riskAssessment={riskAssessment} />

        {/* Right: Nearest Hospital & Police Station with clickable actions (Requirement 12) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={17} color="var(--primary)" />
              Nearest Emergency Infrastructure ({currentDest || 'Destination'})
            </h4>

            {/* Nearest Hospital Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '0.85rem'
              }}
            >
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    🏥 {primaryHospital.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {primaryHospital.distance} • {primaryHospital.location}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    Hotline: {primaryHospital.phone || 'Phone number unavailable.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/safety-alerts?routeTo=${encodeURIComponent(primaryHospital.name + ' ' + (currentDest || ''))}`)}
                  className="btn btn-sm btn-primary"
                  style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px' }}
                  title="Compute Safest Route to Hospital"
                >
                  <Navigation size={12} /> Safest Route
                </button>

                {primaryHospital.phone ? (
                  <a
                    href={`tel:${primaryHospital.phone}`}
                    className="btn btn-sm btn-secondary"
                    style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                  >
                    <Phone size={12} /> Call
                  </a>
                ) : (
                  <button disabled className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    Phone number unavailable.
                  </button>
                )}

                <a
                  href={`sms:${primaryHospital.phone || '108'}`}
                  className="btn btn-sm btn-secondary"
                  style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                >
                  <MessageSquare size={12} /> Message
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(primaryHospital.name + ' ' + (currentDest || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                >
                  <ExternalLink size={12} /> Google Maps
                </a>
              </div>
            </div>

            {/* Nearest Police Station Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    🚓 {primaryPolice.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {primaryPolice.distance} • {primaryPolice.location}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    Emergency Helpline: {primaryPolice.phone || 'Phone number unavailable.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/safety-alerts?routeTo=${encodeURIComponent(primaryPolice.name + ' ' + (currentDest || ''))}`)}
                  className="btn btn-sm btn-primary"
                  style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px' }}
                  title="Compute Safest Route to Police Station"
                >
                  <Navigation size={12} /> Safest Route
                </button>

                {primaryPolice.phone ? (
                  <a
                    href={`tel:${primaryPolice.phone}`}
                    className="btn btn-sm btn-secondary"
                    style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                  >
                    <Phone size={12} /> Call
                  </a>
                ) : (
                  <button disabled className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    Phone number unavailable.
                  </button>
                )}

                <a
                  href={`sms:${primaryPolice.phone || '112'}`}
                  className="btn btn-sm btn-secondary"
                  style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                >
                  <MessageSquare size={12} /> Message
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(primaryPolice.name + ' ' + (currentDest || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                >
                  <ExternalLink size={12} /> Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USER-CUSTOMIZABLE UPCOMING ACTIVITIES (Requirement 7 & 9) */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Upcoming Activities for {currentDest || 'Trip'} ({destActivities.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Add, edit, or remove planned visits. Schedules dynamically check against weather and municipal hazard alerts.
            </p>
          </div>
          <button
            onClick={handleOpenAddActivity}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px' }}
          >
            <Plus size={15} /> + Add Activity
          </button>
        </div>

        {/* Quick Safest Directions Search Bar */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.25rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            alignItems: 'center'
          }}
        >
          <Navigation size={18} color="var(--primary)" />
          <input
            type="text"
            placeholder={`Enter any destination, landmark, or place in ${currentDest || 'your trip'} for safest directions...`}
            value={quickDirectionQuery}
            onChange={(e) => setQuickDirectionQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickDirectionQuery.trim()) {
                navigate(`/safety-alerts?routeTo=${encodeURIComponent(quickDirectionQuery.trim())}`);
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.88rem',
              color: 'var(--text-main)'
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (quickDirectionQuery.trim()) {
                navigate(`/safety-alerts?routeTo=${encodeURIComponent(quickDirectionQuery.trim())}`);
              }
            }}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            <Navigation size={13} /> Show Safest Direction
          </button>
        </div>

        {destActivities.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '10px',
              border: '1px dashed var(--border-color)'
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
              No itinerary added yet.
            </p>
            <button onClick={handleOpenAddActivity} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Plus size={15} /> Add First Activity
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {destActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {act.category || 'Sightseeing'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {act.time}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {act.place || act.name}
                  </h4>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {act.location ? `📍 ${act.location}` : `📍 ${act.city || currentDest}`} • {act.date}
                  </div>

                  {act.notes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                      "{act.notes}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/safety-alerts?routeTo=${encodeURIComponent(act.place || act.name || '')}`)}
                    className="btn btn-sm btn-primary"
                    style={{ padding: '3px 9px', fontSize: '0.75rem', gap: '4px' }}
                    title="Compute verified safest route to this activity"
                  >
                    <Navigation size={12} /> Safest Route
                  </button>
                  <button
                    onClick={() => handleOpenEditActivity(act)}
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    title="Edit Activity"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => deleteActivity(act.id)}
                    className="btn btn-sm btn-outline"
                    style={{ color: '#EF4444', borderColor: '#FECACA', padding: '3px 8px', fontSize: '0.75rem' }}
                    title="Delete Activity"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Destination Modal */}
      <Modal
        isOpen={destModal}
        onClose={() => {
          setDestModal(false);
          setEditingDestId(null);
          setDestError('');
        }}
        title={editingDestId ? "Edit Destination" : "Add Destination"}
        maxWidth="460px"
      >
        <form onSubmit={handleSaveDestination} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {destError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem' }}>
              {destError}
            </div>
          )}

          <div>
            <label className="input-label">Destination City/Region *</label>
            <input
              type="text"
              placeholder="e.g. Chennai, Madurai, Dubai, Rameshwaram"
              className="input-field"
              value={newDestName}
              onChange={(e) => setNewDestName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={newDestStart}
                onChange={(e) => setNewDestStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">End Date *</label>
              <input
                type="date"
                className="input-field"
                value={newDestEnd}
                onChange={(e) => setNewDestEnd(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Travel Partners connected to destination (Requirement 2) */}
          <div>
            <label className="input-label" style={{ marginBottom: '6px', display: 'block' }}>
              Travel Partners for this Destination
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Adults</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={newDestAdults}
                  onChange={(e) => setNewDestAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Children</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={newDestChildren}
                  onChange={(e) => setNewDestChildren(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Elderly</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={newDestElderly}
                  onChange={(e) => setNewDestElderly(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setDestModal(false);
                setEditingDestId(null);
                setDestError('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDestId ? "Update Destination" : "Add Destination"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Destination Confirmation Modal (Requirement 1) */}
      <Modal
        isOpen={!!confirmDeleteDest}
        onClose={() => setConfirmDeleteDest(null)}
        title="Remove Destination"
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Remove this destination?
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              <strong>{confirmDeleteDest?.name}</strong> and its associated itinerary items, alerts, and recommendations will be removed. Other destinations will remain untouched.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setConfirmDeleteDest(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteDest}
              className="btn btn-danger"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Travel Partners Modal (Requirement 2) */}
      <Modal
        isOpen={partnerEditModal}
        onClose={() => setPartnerEditModal(false)}
        title="Update Travel Partners"
        maxWidth="380px"
      >
        <form onSubmit={handleSaveTravelPartners} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Specify exact partner numbers for <strong>{currentDest || 'your trip'}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="flex-between" style={{ alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Children</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setTempChildren(prev => Math.max(0, prev - 1))}
                >-</button>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={tempChildren}
                  onChange={(e) => setTempChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '60px', textAlign: 'center', fontWeight: 700, padding: '4px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setTempChildren(prev => prev + 1)}
                >+</button>
              </div>
            </div>

            <div className="flex-between" style={{ alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Adults</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setTempAdults(prev => Math.max(1, prev - 1))}
                >-</button>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={tempAdults}
                  onChange={(e) => setTempAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '60px', textAlign: 'center', fontWeight: 700, padding: '4px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setTempAdults(prev => prev + 1)}
                >+</button>
              </div>
            </div>

            <div className="flex-between" style={{ alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Elderly</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setTempElderly(prev => Math.max(0, prev - 1))}
                >-</button>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={tempElderly}
                  onChange={(e) => setTempElderly(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '60px', textAlign: 'center', fontWeight: 700, padding: '4px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setTempElderly(prev => prev + 1)}
                >+</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setPartnerEditModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Partners
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Activity Modal (Requirement 7) */}
      <Modal
        isOpen={activityModal}
        onClose={() => setActivityModal(false)}
        title={editingActivityId ? "Edit Activity" : "Add Upcoming Activity"}
        maxWidth="480px"
      >
        <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="input-label">Activity Name / Place *</label>
            <input
              type="text"
              placeholder="e.g. Marina Beach, Kapaleeshwarar Temple"
              className="input-field"
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Location / Landmark</label>
            <input
              type="text"
              placeholder="e.g. Marina Beach Promenade, Mylapore"
              className="input-field"
              value={actLocation}
              onChange={(e) => setActLocation(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Date *</label>
              <input
                type="date"
                className="input-field"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Time</label>
              <input
                type="text"
                placeholder="e.g. 3:00 PM"
                className="input-field"
                value={actTime}
                onChange={(e) => setActTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Category</label>
            <select
              className="input-field"
              value={actCategory}
              onChange={(e) => setActCategory(e.target.value)}
            >
              <option value="Sightseeing">Sightseeing</option>
              <option value="Cultural">Cultural / Temple</option>
              <option value="Nature">Nature / Beach</option>
              <option value="Historical">Historical</option>
              <option value="Dining">Dining / Food</option>
              <option value="Shopping">Shopping</option>
            </select>
          </div>

          <div>
            <label className="input-label">Notes (Optional)</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g. Beach visit, check surf advisory before visiting."
              value={actNotes}
              onChange={(e) => setActNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setActivityModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingActivityId ? 'Update Activity' : 'Save Activity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
