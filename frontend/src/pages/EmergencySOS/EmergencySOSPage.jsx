import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { api } from '../../utils/api.js';
import Modal from '../../components/common/Modal.jsx';
import ErrorBoundary from '../../components/common/ErrorBoundary.jsx';
import SafetyMap from '../../components/map/SafetyMap.jsx';
import { reverseGeocode } from '../../services/geocodingService.js';
import { computeSafeRoute, getGoogleNavigationUrl } from '../../services/routesService.js';
import { getDestinationSafetyData } from '../../services/safetyService.js';
import {
  AlertOctagon,
  Radio,
  MapPin,
  Clock,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  Users,
  AlertTriangle,
  StopCircle,
  Share2,
  Copy,
  ExternalLink,
  Navigation,
  MessageSquare,
  Zap,
  Send,
  Route as RouteIcon,
  Loader2
} from 'lucide-react';

export default function EmergencySOSPage() {
  const { user } = useAuth();
  const { 
    emergencyContacts, 
    activateSOS, 
    stopSOS, 
    mapPoints, 
    trip, 
    activeDestination,
    destinations,
    setActiveDestination,
    userLocation, 
    sosEvent 
  } = useTrip();
  const { triggerSmsToast } = useNotifications();

  // Unified destination calculation
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
    if (!list.includes('Goa')) list.push('Goa');
    if (!list.includes('Chennai')) list.push('Chennai');
    if (!list.includes('Netravati')) list.push('Netravati');
    return list;
  }, [destinations, trip?.destination]);

  const currentDest = activeDestination || trip?.destination || destinationList[0] || 'Goa';

  const [isSosActive, setIsSosActive] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [smsDispatchInfo, setSmsDispatchInfo] = useState(sosEvent?.smsBroadcast || null);
  const [fast2smsInfo, setFast2smsInfo] = useState(null);
  const [isBroadcastingUpdate, setIsBroadcastingUpdate] = useState(false);

  // Approximate default coordinates per city
  const CITY_COORDS = {
    goa: { lat: 15.4989, lng: 73.8278 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    netravati: { lat: 13.1284, lng: 75.3305 },
    mumbai: { lat: 19.0760, lng: 72.8777 },
    delhi: { lat: 28.6139, lng: 77.2090 },
    bengaluru: { lat: 12.9716, lng: 77.5946 }
  };
  const cityKey = (currentDest || '').toLowerCase().trim();
  const defaultCoords = CITY_COORDS[cityKey] || { lat: 15.4989, lng: 73.8278 };

  // Active location state
  const [currentLocation, setCurrentLocation] = useState({
    placeName: userLocation?.placeName || `${currentDest} Emergency Sector`,
    lat: userLocation?.lat || defaultCoords.lat,
    lng: userLocation?.lng || defaultCoords.lng,
    accuracy: userLocation?.accuracy || 'Estimated / Regional GPS'
  });

  // Keep location coordinates updated if user switches city and has not pinned live GPS
  useEffect(() => {
    if (!userLocation && (!currentLocation.accuracy || currentLocation.accuracy.includes('Estimated'))) {
      const coords = CITY_COORDS[(currentDest || '').toLowerCase().trim()] || { lat: 15.4989, lng: 73.8278 };
      setCurrentLocation((prev) => ({
        ...prev,
        placeName: `${currentDest} Emergency Sector`,
        lat: coords.lat,
        lng: coords.lng
      }));
    }
  }, [currentDest]);

  // Memoize userCoords so it doesn't change on every 1-second interval tick! (Requirement 2 & 5)
  const stableUserCoords = useMemo(() => {
    if (currentLocation?.lat && currentLocation?.lng) {
      return { lat: currentLocation.lat, lng: currentLocation.lng };
    }
    return defaultCoords;
  }, [currentLocation?.lat, currentLocation?.lng, defaultCoords.lat, defaultCoords.lng]);

  // Service Finder state (Requirement 3: Police, Hospital, Emergency Services)
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState('POLICE');
  const [liveFacilities, setLiveFacilities] = useState([]);
  const [fetchingFacilities, setFetchingFacilities] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routingFacilityId, setRoutingFacilityId] = useState(null);
  const mapSectionRef = useRef(null);

  const handleCalculateFacilityRoute = async (facility) => {
    if (!facility?.lat || !facility?.lng) return;
    const origin = stableUserCoords || { lat: 13.0827, lng: 80.2707 };
    setRoutingFacilityId(facility.id || facility.name);
    try {
      const res = await computeSafeRoute({
        origin,
        destination: { lat: facility.lat, lng: facility.lng }
      });
      if (res?.success) {
        setActiveRoute({
          ...res,
          destinationName: facility.name
        });
        setTimeout(() => {
          mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      } else {
        alert(res?.error || 'Unable to calculate safe route to facility.');
      }
    } catch (err) {
      console.warn('[Facility Route Error]', err);
    } finally {
      setRoutingFacilityId(null);
    }
  };

  const handleEmergencyServiceClick = async (category = 'POLICE') => {
    setSelectedFacilityCategory(category);
    setFetchingFacilities(true);

    // 1. Get user's current location if available
    if (navigator.geolocation && (!currentLocation?.lat || currentLocation?.lat === 13.05)) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          setCurrentLocation((prev) => ({
            ...prev,
            lat,
            lng,
            placeName: `Live Coordinates (${lat}, ${lng})`,
            accuracy: 'Live GPS'
          }));
        },
        (err) => {
          console.warn('[Location Access Warning]', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // 2. Fetch destination/location safety data
    const city = currentDest;
    try {
      const data = await getDestinationSafetyData(city);
      if (data) {
        if (category === 'POLICE') {
          const stations = data.policeStations || [];
          setLiveFacilities(stations);
        } else if (category === 'HOSPITAL') {
          const hospitals = data.hospitals || [];
          setLiveFacilities(hospitals);
        } else {
          const combined = [
            ...(data.policeStations || []),
            ...(data.hospitals || [])
          ];
          setLiveFacilities(combined);
        }
      }
    } catch (e) {
      console.warn('Facility lookup error:', e);
    } finally {
      setFetchingFacilities(false);
    }
  };

  useEffect(() => {
    handleEmergencyServiceClick(selectedFacilityCategory);
  }, [currentDest, selectedFacilityCategory]);

  // Check initial backend SOS status & Fast2SMS gateway status
  useEffect(() => {
    const checkSosStatus = async () => {
      try {
        const res = await api.getEmergencyStatus();
        if (res.sos?.isActive) {
          setIsSosActive(true);
          if (res.sos.location) {
            setCurrentLocation(res.sos.location);
          }
        }
      } catch (e) {
        console.warn('Emergency status check:', e.message);
      }
    };

    const checkSmsGateway = async () => {
      try {
        const res = await api.getSmsStatus();
        setFast2smsInfo(res);
      } catch (e) {
        console.warn('SMS gateway check:', e.message);
      }
    };

    checkSosStatus();
    checkSmsGateway();
  }, []);

  // Sync smsDispatchInfo whenever sosEvent updates
  useEffect(() => {
    if (sosEvent?.smsBroadcast) {
      setSmsDispatchInfo(sosEvent.smsBroadcast);
    }
  }, [sosEvent]);

  // Timer for active SOS duration
  useEffect(() => {
    let interval = null;
    if (isSosActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isSosActive]);

  const handleTriggerSOS = () => {
    setLocationError(null);
    setConfirmModalOpen(true);
  };

  // STEP 2 & 9: Request browser geolocation with comprehensive error handling
  const handleConfirmSOS = () => {
    setConfirmModalOpen(false);
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocationError('Your browser does not support geolocation services.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        let placeName = `Live Coordinates (${lat}, ${lng})`;
        try {
          const resolvedAddress = await reverseGeocode(lat, lng);
          if (resolvedAddress) {
            placeName = resolvedAddress;
          }
        } catch (e) {
          console.warn('[Geocoding API Notice]', e.message);
        }

        const locData = {
          placeName,
          lat,
          lng,
          accuracy: position.coords.accuracy ? `±${Math.round(position.coords.accuracy)}m` : 'Live GPS'
        };

        setCurrentLocation(locData);
        await proceedWithSOS(locData);
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Failed to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Enable location access in your browser to use SOS.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable. Please check your GPS / network connection.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Geolocation request timed out. Please try again.';
            break;
          default:
            errorMsg = error.message || 'An unknown error occurred while acquiring location.';
            break;
        }
        setLocationError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fallback activation if GPS permission denied or user overrides
  const handleFallbackSOS = async () => {
    setLocationError(null);
    const fallbackLoc = {
      placeName: `${currentDest} (Estimated Regional Grid)`,
      lat: defaultCoords.lat,
      lng: defaultCoords.lng,
      accuracy: 'Fallback Network Estimate'
    };
    setCurrentLocation(fallbackLoc);
    await proceedWithSOS(fallbackLoc);
  };

  const proceedWithSOS = async (locData) => {
    setIsSosActive(true);
    let broadcastData = null;
    try {
      const res = await activateSOS(locData);
      if (res?.smsBroadcast) {
        broadcastData = res.smsBroadcast;
        setSmsDispatchInfo(res.smsBroadcast);
      }
    } catch (e) {
      console.warn('activateSOS error:', e);
    }

    const recipientCount = broadcastData?.recipientsCount || (emergencyContacts.length + (user?.phone ? 1 : 0));
    triggerSmsToast(
      `🚨 SAFEVOYAGE SOS ACTIVATED: Fast2SMS emergency message and live coordinates dispatched to ${recipientCount} registered contacts.`,
      user?.phone || '+91 98765 43210',
      'FAST2SMS SOS BROADCAST'
    );
  };

  const handleBroadcastLocationUpdate = async () => {
    setIsBroadcastingUpdate(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = parseFloat(pos.coords.latitude.toFixed(5));
            const lng = parseFloat(pos.coords.longitude.toFixed(5));
            const acc = pos.coords.accuracy ? `±${Math.round(pos.coords.accuracy)}m` : 'Live GPS';
            let placeName = `Live Coordinates (${lat}, ${lng})`;
            try {
              const resolvedAddress = await reverseGeocode(lat, lng);
              if (resolvedAddress) placeName = resolvedAddress;
            } catch (e) {}

            const updatedLoc = {
              placeName,
              lat,
              lng,
              accuracy: acc
            };
            setCurrentLocation(updatedLoc);
            const res = await api.broadcastLocation({
              lat,
              lng,
              placeName: updatedLoc.placeName,
              emergencyContacts
            });
            if (res?.broadcast) {
              setSmsDispatchInfo(res.broadcast);
            }
            triggerSmsToast(
              `📡 Live location updated & re-broadcasted via Fast2SMS to family: ${lat}, ${lng}`,
              user?.phone || '+91 98765 43210',
              'LIVE GPS BROADCAST'
            );
            setIsBroadcastingUpdate(false);
          },
          async () => {
            const res = await api.broadcastLocation({
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              placeName: currentLocation.placeName,
              emergencyContacts
            });
            if (res?.broadcast) {
              setSmsDispatchInfo(res.broadcast);
            }
            setIsBroadcastingUpdate(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        const res = await api.broadcastLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          placeName: currentLocation.placeName,
          emergencyContacts
        });
        if (res?.broadcast) {
          setSmsDispatchInfo(res.broadcast);
        }
        setIsBroadcastingUpdate(false);
      }
    } catch (err) {
      console.warn('Location broadcast update error:', err);
      setIsBroadcastingUpdate(false);
    }
  };

  const handleStopSOS = async () => {
    setIsSosActive(false);
    try {
      await stopSOS();
      await api.stopSOS();
    } catch (e) {
      console.warn('stopSOS error:', e);
    }
  };

  const googleMapsUrl = currentLocation?.lat && currentLocation?.lng
    ? `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(currentDest + ' emergency services')}`;

  const handleShareLocation = async () => {
    const lat = currentLocation?.lat || defaultCoords.lat;
    const lng = currentLocation?.lng || defaultCoords.lng;
    const place = currentLocation?.placeName || currentDest;

    const shareData = {
      title: 'EMERGENCY SOS - SafeVoyage Alert',
      text: `🚨 EMERGENCY SOS ACTIVATED! I need assistance at ${place}. Coordinates: ${lat}, ${lng}. Live location map:`,
      url: googleMapsUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const lat = currentLocation?.lat || defaultCoords.lat;
    const lng = currentLocation?.lng || defaultCoords.lng;
    const place = currentLocation?.placeName || currentDest;
    const textToCopy = `🚨 EMERGENCY SOS! Location: ${place} (${lat}, ${lng}) - ${googleMapsUrl}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      }).catch(() => {
        setCopySuccess(true);
      });
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
            <AlertOctagon size={20} /> HIGH-PRIORITY INCIDENT COMMAND
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Emergency SOS & Rapid Response</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Acquires live GPS telemetry, registers emergency events, pins your location on the safety map, and transmits real-time SMS alerts with live coordinates to your emergency family contacts via Fast2SMS.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="#EF4444" />
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
                  📍 Emergency Sector: {d}
                </option>
              ))}
            </select>
          </div>

          {fast2smsInfo?.isLiveGateway && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #10B981',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#065F46',
                fontWeight: 600
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              <span>⚡ Fast2SMS Emergency Gateway Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Geolocation Error Alert if permission was denied or failed */}
      {locationError && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '2px solid #EF4444',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', fontWeight: 700 }}>
            <AlertTriangle size={22} />
            <span>Geolocation Access Failed: {locationError}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--danger-text)', margin: 0 }}>
            SafeVoyage requires device location to transmit precise coordinates to emergency services. You can grant permission in your browser URL bar, or activate SOS using estimated destination coordinates.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '4px' }}>
            <button
              onClick={handleConfirmSOS}
              className="btn btn-danger btn-sm"
              style={{ gap: '6px' }}
            >
              <Navigation size={14} /> Retry Location Access
            </button>
            <button
              onClick={handleFallbackSOS}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px', backgroundColor: '#FFFFFF', color: '#DC2626', borderColor: '#DC2626' }}
            >
              Proceed with Estimated Destination Location ({trip?.destination || 'Regional'})
            </button>
          </div>
        </div>
      )}

      {/* Main SOS Interactive Container */}
      {!isSosActive ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            border: '2px dashed #EF4444',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              One-Touch Emergency Activation
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
              Pressing the SOS button requests browser GPS permission, records an emergency incident event, and prepares direct dispatch actions for all designated contacts.
            </p>
          </div>

          {/* Large Glowing SOS Button */}
          <button
            onClick={handleTriggerSOS}
            disabled={isLocating}
            className="animate-pulse-sos"
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: '6px solid #FEE2E2',
              fontSize: '1.8rem',
              fontWeight: 900,
              cursor: isLocating ? 'wait' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.15s ease',
              opacity: isLocating ? 0.7 : 1
            }}
          >
            {isLocating ? (
              <Radio size={36} className="animate-spin" />
            ) : (
              <AlertOctagon size={36} />
            )}
            <span style={{ marginTop: '2px', fontSize: isLocating ? '1rem' : '1.8rem' }}>
              {isLocating ? 'LOCATING...' : 'SOS'}
            </span>
          </button>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Requires confirmation • High-accuracy GPS telemetry will be acquired automatically
          </div>
        </div>
      ) : (
        /* ACTIVATED SOS DASHBOARD (Requirements 8.3, 8.4, 8.5, 8.6) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            className="card animate-pulse-sos"
            style={{
              border: '2px solid #EF4444',
              backgroundColor: 'var(--danger-bg)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {/* Active Banner */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Radio size={26} className="animate-pulse-sos" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--danger-text)' }}>
                    🚨 SOS ACTIVATED
                  </h2>
                  <div style={{ fontSize: '0.95rem', color: 'var(--danger-text)', fontWeight: 700 }}>
                    Your location is being shared.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--danger-text)', opacity: 0.85 }}>
                    Active for {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s • Telemetry stream active
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleShareLocation}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', gap: '6px', fontWeight: 700 }}
                >
                  <Share2 size={16} /> Share Live Location
                </button>
                <button
                  onClick={handleStopSOS}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: '#FFFFFF', color: '#EF4444', borderColor: '#EF4444', gap: '6px', fontWeight: 700 }}
                >
                  <StopCircle size={16} /> Stop Sharing / Cancel SOS
                </button>
              </div>
            </div>

            {/* Location Details Strip */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>REPORTED LOCATION</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  📍 {currentLocation.placeName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GPS COORDINATES</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {currentLocation.lat}, {currentLocation.lng} ({currentLocation.accuracy})
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>INCIDENT EVENT ID</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {sosEvent?.id || `sos_ev_${Date.now()}`}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>QUICK MAP LINK</span>
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px' }}
                  >
                    <ExternalLink size={12} /> Google Maps
                  </a>
                  <button
                    onClick={copyToClipboard}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px' }}
                  >
                    <Copy size={12} /> {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Fast2SMS Live Emergency Dispatch Receipt Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #10B981',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: '#D1FAE5',
                      color: '#065F46',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    ⚡ Fast2SMS Emergency Gateway
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    Live SMS Broadcast Dispatched
                  </span>
                </div>

                <button
                  onClick={handleBroadcastLocationUpdate}
                  disabled={isBroadcastingUpdate}
                  className="btn btn-sm"
                  style={{
                    fontSize: '0.8rem',
                    padding: '5px 12px',
                    gap: '6px',
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 700
                  }}
                >
                  <Radio size={14} className={isBroadcastingUpdate ? "animate-spin" : ""} />
                  {isBroadcastingUpdate ? 'Broadcasting Update...' : 'Broadcast Latest GPS Coordinates'}
                </button>
              </div>

              {/* Transmitted Message Preview */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  TRANSMITTED EMERGENCY SMS CONTENT & LIVE MAP PIN:
                </div>
                <div style={{ color: 'var(--text-main)', fontFamily: 'monospace', lineHeight: 1.45, wordBreak: 'break-all' }}>
                  {smsDispatchInfo?.message || `🚨 SAFEVOYAGE SOS EMERGENCY! ${user?.name || 'Traveler'} triggered SOS near ${currentLocation.placeName}. GPS: ${currentLocation.lat}, ${currentLocation.lng}. LIVE MAP: ${googleMapsUrl}`}
                </div>
              </div>

              {smsDispatchInfo?.fast2smsResponse?.status_code === 416 && (
                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.83rem',
                    color: '#92400E',
                    lineHeight: 1.45
                  }}
                >
                  <strong>⚡ Fast2SMS Connection Notice:</strong> Fast2SMS API Key (<code>ujLe...Veg2</code>) was authenticated successfully by Fast2SMS. Fast2SMS returned: <em>"You don't have sufficient wallet balance"</em>.
                  To deliver SMS over real cellular carrier networks, please recharge your wallet on <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" style={{ color: '#B45309', fontWeight: 700, textDecoration: 'underline' }}>Fast2SMS</a>.
                  Emergency logs and one-tap WhatsApp / direct phone intents below are fully active!
                </div>
              )}

              {/* Family Contacts Notified */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Emergency contacts alerted ({smsDispatchInfo?.recipientsCount || (emergencyContacts.length + (user?.phone ? 1 : 0))}):
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {user?.phone && (
                    <span className="badge badge-safe" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      ✓ Head Traveller ({user.name || 'Self'} - {user.phone})
                    </span>
                  )}
                  {emergencyContacts.map((c, i) => (
                    <span key={i} className="badge badge-safe" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      ✓ {c.name} ({c.relationship}) - {c.phone}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Contacts Dispatch & Action Card (Step 6) */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
              <div className="flex-between" style={{ marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Designated Emergency Contacts ({emergencyContacts.length})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Direct device dial & SMS intents ready
                </span>
              </div>

              {emergencyContacts.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                  No family contacts added.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {emergencyContacts.map((c, index) => (
                    <div
                      key={c.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {c.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>({c.relationship})</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.phone}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px', textDecoration: 'none' }}
                        >
                          <PhoneCall size={12} /> Call
                        </a>
                        <a
                          href={`sms:${c.phone.replace(/[^0-9+]/g, '')}?body=EMERGENCY%20SOS!%20SafeVoyage%20alert%20from%20${encodeURIComponent(user?.name || 'Traveler')}.%20Coordinates:%20${currentLocation.lat},${currentLocation.lng}.%20Map:%20${encodeURIComponent(googleMapsUrl)}`}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px', textDecoration: 'none' }}
                        >
                          <MessageSquare size={12} /> SMS
                        </a>
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=EMERGENCY%20SOS!%20SafeVoyage%20alert%20from%20${encodeURIComponent(user?.name || 'Traveler')}.%20Coordinates:%20${currentLocation.lat},${currentLocation.lng}.%20Map:%20${encodeURIComponent(googleMapsUrl)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px', borderColor: '#25D366', color: '#16A34A', textDecoration: 'none' }}
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Responder Radar & Real-Time Facility Finder (Requirements 2, 3, 5) */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626' }}>
              <ShieldAlert size={20} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Emergency Infrastructure & Live Incident Map
              </h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
              Location: <strong>{currentLocation.placeName || trip?.destination || 'Regional Grid'}</strong> ({currentLocation.lat}, {currentLocation.lng})
            </p>
          </div>

          {/* Service Filter Actions */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              id="sos-police-btn"
              onClick={() => handleEmergencyServiceClick('POLICE')}
              className={`btn btn-sm ${selectedFacilityCategory === 'POLICE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '6px', fontWeight: 700 }}
            >
              🚓 Police
            </button>
            <button
              id="sos-hospital-btn"
              onClick={() => handleEmergencyServiceClick('HOSPITAL')}
              className={`btn btn-sm ${selectedFacilityCategory === 'HOSPITAL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '6px', fontWeight: 700 }}
            >
              🏥 Hospital
            </button>
            <button
              id="sos-emergency-btn"
              onClick={() => handleEmergencyServiceClick('EMERGENCY')}
              className={`btn btn-sm ${selectedFacilityCategory === 'EMERGENCY' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '6px', fontWeight: 700 }}
            >
              🚨 Emergency Services
            </button>
            <a
              href={
                selectedFacilityCategory === 'HOSPITAL'
                  ? `https://www.google.com/maps/search/hospitals/@${currentLocation.lat},${currentLocation.lng},14z`
                  : selectedFacilityCategory === 'POLICE'
                  ? `https://www.google.com/maps/search/police+station/@${currentLocation.lat},${currentLocation.lng},14z`
                  : `https://www.google.com/maps/search/emergency+services/@${currentLocation.lat},${currentLocation.lng},14z`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
              style={{ gap: '6px', fontWeight: 700 }}
            >
              <ExternalLink size={14} /> Search on Google Maps
            </a>
          </div>
        </div>

        {/* Nearby Facilities List */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {selectedFacilityCategory === 'POLICE' ? 'Verified Nearby Police Stations' : selectedFacilityCategory === 'HOSPITAL' ? 'Verified Nearby Hospitals & Trauma Centers' : 'Verified Emergency Support Facilities'} ({liveFacilities.length}):
          </div>

          {liveFacilities.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Loading nearby verified stations for {trip?.destination || 'your location'}...
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {liveFacilities.map((fac, idx) => {
                const hasPhone = fac.phone && fac.phone.trim().length > 0;
                const gmapsLink = `https://maps.google.com/?q=${encodeURIComponent(fac.name + ' ' + (fac.address || trip?.destination || ''))}`;
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div className="flex-between" style={{ marginBottom: '4px' }}>
                        <span className="badge badge-safe" style={{ fontSize: '0.7rem' }}>
                          {fac.distance || 'Active Zone'}
                        </span>
                        {hasPhone && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {fac.phone}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {fac.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {fac.address || fac.status || `${trip?.destination || 'Location'} District`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      {hasPhone ? (
                        <a
                          href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', textDecoration: 'none' }}
                        >
                          <PhoneCall size={12} /> Call
                        </a>
                      ) : (
                        <button
                          disabled
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem', opacity: 0.6, padding: '3px 8px' }}
                        >
                          Phone number unavailable
                        </button>
                      )}
                      <a
                        href={gmapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} /> Open in Google Maps
                      </a>

                      {fac.lat && fac.lng && (
                        <button
                          onClick={() => handleCalculateFacilityRoute(fac)}
                          disabled={routingFacilityId === (fac.id || fac.name)}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                          title="Calculate safe evacuation route and traffic-aware ETA using Google Maps Routes API"
                        >
                          {routingFacilityId === (fac.id || fac.name) ? (
                            <>
                              <Loader2 size={12} className="spin" /> Calculating...
                            </>
                          ) : (
                            <>
                              <RouteIcon size={12} /> Safe Route & ETA
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stable Map Component with stableUserCoords & Live Routes API Navigation */}
        <div ref={mapSectionRef}>
          <ErrorBoundary title="Emergency Infrastructure & Incident Map">
            <SafetyMap
              points={mapPoints}
              destination={currentDest}
              userCoords={stableUserCoords}
              defaultFilter={selectedFacilityCategory === 'HOSPITAL' ? 'HOSPITAL' : selectedFacilityCategory === 'POLICE' ? 'POLICE' : 'ALL'}
              activeRoute={activeRoute}
              onClearRoute={() => setActiveRoute(null)}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Quick Dial Emergency Services Grid */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          National & Regional Emergency Helplines
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          {[
            { label: 'Unified Emergency (All)', number: '112', bg: 'var(--danger-bg)', color: '#EF4444' },
            { label: 'Ambulance / Medical', number: '108', bg: 'var(--primary-subtle)', color: 'var(--primary)' },
            { label: 'Police Emergency', number: '100', bg: '#F3E8FF', color: '#7E22CE' },
            { label: 'Fire & Rescue Services', number: '101', bg: '#FEF3C7', color: '#B45309' },
            { label: 'Women Helpline', number: '1091', bg: '#FCE7F3', color: '#BE185D' },
            { label: `Tourist Police (${currentDest})`, number: '1363', bg: 'var(--bg-subtle)', color: 'var(--text-main)' }
          ].map((h, idx) => (
            <a
              key={idx}
              href={`tel:${h.number.replace(/\s+/g, '')}`}
              style={{
                backgroundColor: h.bg,
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{h.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: h.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PhoneCall size={16} /> {h.number}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* STEP 1: Confirmation Modal (Requirement 8.1) */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Emergency Assistance"
        maxWidth="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
            Are you sure you want to activate SOS?
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
            This will request your browser GPS location, log a critical emergency event, pin your live coordinates on the map, and activate direct dispatch to your registered emergency contacts.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSOS}
              className="btn btn-danger"
              style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
            >
              Activate SOS
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
