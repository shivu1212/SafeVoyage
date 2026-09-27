import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  AlertTriangle,
  Hospital,
  Shield,
  MapPin,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertOctagon,
  CheckCircle2,
  Info,
  Navigation,
  Clock,
  Route as RouteIcon,
  X,
  Loader2,
  Search,
  ShieldCheck
} from 'lucide-react';
import { computeSafeRoute, getGoogleNavigationUrl } from '../../services/routesService.js';
import { forwardGeocode } from '../../services/geocodingService.js';
import { getDestinationSafetyData } from '../../services/safetyService.js';
import L from 'leaflet';

export default function SafetyMap({
  points = [],
  destination = '',
  userCoords = null,
  height = '440px',
  defaultFilter = 'ALL',
  activeRoute: propActiveRoute = null,
  onClearRoute: propOnClearRoute = null,
  initialLocationQuery = ''
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const alternativePolylinesRef = useRef([]);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const authFailedRef = useRef(false);

  // Leaflet Interactive Fallback Refs
  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);
  const leafletPolylineRef = useRef(null);
  const leafletUserMarkerRef = useRef(null);
  const leafletDestMarkerRef = useRef(null);

  const [mapStatus, setMapStatus] = useState('LOADING'); // 'LOADING' | 'SUCCESS' | 'LEAFLET' | 'NOT CONFIGURED'
  const [statusMessage, setStatusMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [internalRoute, setInternalRoute] = useState(null);
  const [routingPointId, setRoutingPointId] = useState(null);

  // Location search and safest directions state
  const [locationInput, setLocationInput] = useState(initialLocationQuery || '');
  const [travelMode, setTravelMode] = useState('DRIVE'); // 'DRIVE' | 'WALK'
  const [searchingRoute, setSearchingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');

  const currentRoute = propActiveRoute || internalRoute;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [internalPoints, setInternalPoints] = useState(points && points.length > 0 ? points : []);

  useEffect(() => {
    if (points && points.length > 0) {
      setInternalPoints(points);
    } else {
      if (!destination) return;
      getDestinationSafetyData(destination).then((data) => {
        if (data?.mapPoints && data.mapPoints.length > 0) {
          setInternalPoints(data.mapPoints);
        }
      });
    }
  }, [points, destination]);

  const displayPoints = (points && points.length > 0) ? points : internalPoints;
  const filteredPoints = useMemo(() => {
    return (displayPoints || []).filter((p) => {
      if (!p) return false;
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'SAFE') return p.isSafe || p.type === 'shelter';
      if (activeFilter === 'RISK') return !p.isSafe || p.type === 'risk_zone';
      if (activeFilter === 'HOSPITAL') return p.type === 'hospital';
      if (activeFilter === 'POLICE') return p.type === 'police';
      return true;
    });
  }, [displayPoints, activeFilter]);

  const pointsCenter = (displayPoints && displayPoints.length > 0 && displayPoints[0].lat && displayPoints[0].lng) ? { lat: displayPoints[0].lat, lng: displayPoints[0].lng } : null;
  const targetCenter = userCoords || pointsCenter || { lat: 0, lng: 0 };

  // Sync defaultFilter prop if changed from parent
  useEffect(() => {
    if (defaultFilter) {
      setActiveFilter(defaultFilter);
    }
  }, [defaultFilter]);

  // One-time initialization of Google Maps (with seamless Leaflet fallback)
  useEffect(() => {
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_KEY') || authFailedRef.current) {
      setMapStatus('LEAFLET');
      setStatusMessage('Interactive OpenStreetMap engine active.');
      return;
    }

    let isMounted = true;

    window.gm_authFailure = () => {
      authFailedRef.current = true;
      if (isMounted) {
        setMapStatus('LEAFLET');
        setStatusMessage('Interactive OpenStreetMap engine active.');
      }
    };

    const initMapInstance = () => {
      if (!isMounted || !mapRef.current || !window.google?.maps) return;
      if (mapInstanceRef.current) return; // Already initialized, keep stable

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: targetCenter,
          zoom: 12,
          mapTypeId: 'roadmap',
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });
        mapInstanceRef.current = map;
        setMapStatus('SUCCESS');
      } catch (err) {
        console.warn('[Google Maps Init Error]', err);
        authFailedRef.current = true;
        setMapStatus('LEAFLET');
        setStatusMessage('Interactive OpenStreetMap engine active.');
      }
    };

    if (window.google && window.google.maps) {
      initMapInstance();
    } else {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) initMapInstance();
        };
        script.onerror = () => {
          authFailedRef.current = true;
          if (isMounted) {
            setMapStatus('LEAFLET');
            setStatusMessage('Interactive OpenStreetMap engine active.');
          }
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) initMapInstance();
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Initialization of Leaflet Fallback Map (with robust container re-use & cleanup)
  useEffect(() => {
    if (mapStatus !== 'LEAFLET' || !leafletContainerRef.current) return;

    if (leafletContainerRef.current._leaflet_id && !leafletMapRef.current) {
      leafletContainerRef.current._leaflet_id = null;
    }

    if (!leafletMapRef.current) {
      try {
        const map = L.map(leafletContainerRef.current, {
          center: [targetCenter.lat, targetCenter.lng],
          zoom: 12,
          zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        leafletMapRef.current = map;
        setTimeout(() => {
          if (leafletMapRef.current) {
            leafletMapRef.current.invalidateSize();
          }
        }, 200);
      } catch (err) {
        console.warn('[Leaflet Initialization Warning]', err);
      }
    } else {
      try {
        leafletMapRef.current.panTo([targetCenter.lat, targetCenter.lng]);
        leafletMapRef.current.invalidateSize();
      } catch (e) {}
    }

    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
    };
  }, [mapStatus, targetCenter.lat, targetCenter.lng]);

  // Leaflet Markers Rendering
  useEffect(() => {
    if (mapStatus !== 'LEAFLET' || !leafletMapRef.current) return;

    leafletMarkersRef.current.forEach(m => m.remove());
    leafletMarkersRef.current = [];

    filteredPoints.forEach(p => {
      if (p.lat && p.lng) {
        const isHospital = p.type === 'hospital';
        const isPolice = p.type === 'police';
        const isRisk = p.type === 'risk_zone' || !p.isSafe;

        const markerColor = isRisk ? '#EF4444' : isHospital ? '#2563EB' : isPolice ? '#3B82F6' : '#10B981';
        const iconEmoji = isRisk ? '⚠️' : isHospital ? '🏥' : isPolice ? '🚓' : '🛡️';

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="
            background-color: ${markerColor};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            border: 2px solid white;
          ">${iconEmoji}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(leafletMapRef.current);
        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 170px; color: #1E293B;">
            <strong style="font-size: 13px; display: block; margin-bottom: 3px;">${p.name}</strong>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">${p.status || (isRisk ? 'Active Hazard Area' : 'Emergency Infrastructure')}</div>
            ${p.phone ? `<div style="font-size: 11px; color: #167D5A; font-weight: bold; margin-bottom: 4px;">📞 ${p.phone}</div>` : ''}
            <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase;">${p.type || 'Resource'}</div>
          </div>
        `);
        marker.on('click', () => setSelectedPoint(p));
        leafletMarkersRef.current.push(marker);
      }
    });
  }, [filteredPoints, mapStatus]);

  // Leaflet User Location Marker
  useEffect(() => {
    if (mapStatus !== 'LEAFLET' || !leafletMapRef.current) return;

    if (userCoords?.lat && userCoords?.lng) {
      if (leafletUserMarkerRef.current) {
        leafletUserMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `<div style="
            background-color: #EF4444;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.35);
            border: 2px solid white;
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        const marker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, title: 'Your Live Location' })
          .addTo(leafletMapRef.current);
        marker.bindPopup('<b>Your Live Location</b>');
        leafletUserMarkerRef.current = marker;
      }
    } else if (leafletUserMarkerRef.current) {
      leafletUserMarkerRef.current.remove();
      leafletUserMarkerRef.current = null;
    }
  }, [userCoords?.lat, userCoords?.lng, mapStatus]);

  // Leaflet Route Polyline & Bounds Auto-fit
  useEffect(() => {
    if (mapStatus !== 'LEAFLET' || !leafletMapRef.current) return;

    if (leafletPolylineRef.current) {
      leafletPolylineRef.current.remove();
      leafletPolylineRef.current = null;
    }

    if (currentRoute?.path && Array.isArray(currentRoute.path) && currentRoute.path.length > 0) {
      try {
        const isSafe = currentRoute.safetyNotice?.isSafe !== false;
        const latLngs = currentRoute.path.map(p => [p.lat, p.lng]);
        const poly = L.polyline(latLngs, {
          color: isSafe ? '#10B981' : '#F59E0B',
          weight: 6,
          opacity: 0.95
        }).addTo(leafletMapRef.current);
        leafletPolylineRef.current = poly;
        leafletMapRef.current.fitBounds(poly.getBounds(), { padding: [60, 60] });
      } catch (err) {
        console.warn('[Leaflet Route Polyline Error]', err);
      }
    }
  }, [currentRoute, mapStatus]);

  // Stable Pan to target center when destination changes
  useEffect(() => {
    if (mapInstanceRef.current && targetCenter?.lat && targetCenter?.lng) {
      try {
        mapInstanceRef.current.panTo(targetCenter);
      } catch (e) {}
    }
  }, [targetCenter?.lat, targetCenter?.lng]);

  // Live Location Marker update without destroying map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (userCoords?.lat && userCoords?.lng) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(userCoords);
      } else {
        userMarkerRef.current = new window.google.maps.Marker({
          position: userCoords,
          map: mapInstanceRef.current,
          title: 'Your Live Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, [userCoords?.lat, userCoords?.lng]);

  // Markers update without recreating map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    filteredPoints.forEach(p => {
      if (p.lat && p.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInstanceRef.current,
          title: p.name
        });

        marker.addListener('click', () => {
          setSelectedPoint(p);
        });
        markersRef.current.push(marker);
      }
    });
  }, [filteredPoints.length, activeFilter, mapStatus]);

  // Initialize Google Places Autocomplete on search input
  useEffect(() => {
    if (!window.google?.maps?.places?.Autocomplete || !searchInputRef.current) return;
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'name', 'formatted_address']
      });

      if (mapInstanceRef.current) {
        autocomplete.bindTo('bounds', mapInstanceRef.current);
      }

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.name || place.formatted_address || searchInputRef.current.value;
          setLocationInput(name);
          handleComputeRouteToCoords({ lat, lng }, name);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.warn('[Places Autocomplete Init Warning]', err);
    }
  }, [mapStatus]);

  // Handle external or initial query param (e.g. from Dashboard activities)
  useEffect(() => {
    if (initialLocationQuery && initialLocationQuery.trim()) {
      setLocationInput(initialLocationQuery.trim());
      const timer = setTimeout(() => {
        forwardGeocode(initialLocationQuery.trim(), userCoords || targetCenter).then(geo => {
          if (geo?.lat && geo?.lng) {
            handleComputeRouteToCoords({ lat: geo.lat, lng: geo.lng }, geo.name || initialLocationQuery.trim());
          }
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [initialLocationQuery, mapStatus]);

  // Route the selected user destination only after live GPS is available.
  useEffect(() => {
    if (!destination || !userCoords?.lat || !userCoords?.lng || initialLocationQuery || currentRoute) return;

    let cancelled = false;
    forwardGeocode(destination, userCoords).then((geo) => {
      if (!cancelled && geo?.lat && geo?.lng) {
        handleComputeRouteToCoords({ lat: geo.lat, lng: geo.lng }, geo.name || destination);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [destination, userCoords?.lat, userCoords?.lng, initialLocationQuery, currentRoute]);

  // Polyline & Route Display
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    alternativePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    alternativePolylinesRef.current = [];

    if (currentRoute?.path && Array.isArray(currentRoute.path) && currentRoute.path.length > 0) {
      try {
        const isSafe = currentRoute.safetyNotice?.isSafe !== false;
        const polyline = new window.google.maps.Polyline({
          path: currentRoute.path,
          geodesic: true,
          strokeColor: isSafe ? '#10B981' : '#F59E0B',
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map: mapInstanceRef.current
        });
        polylineRef.current = polyline;

        (currentRoute.alternatives || []).forEach((alternative) => {
          if (!alternative.path?.length) return;
          alternativePolylinesRef.current.push(new window.google.maps.Polyline({
            path: alternative.path,
            geodesic: true,
            strokeColor: '#94A3B8',
            strokeOpacity: 0.7,
            strokeWeight: 4,
            map: mapInstanceRef.current
          }));
        });

        // Auto-fit bounds to display origin, destination, and full route
        const bounds = new window.google.maps.LatLngBounds();
        currentRoute.path.forEach(pt => {
          bounds.extend(new window.google.maps.LatLng(pt.lat, pt.lng));
        });
        mapInstanceRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 60, right: 60 });
      } catch (err) {
        console.warn('[Route Polyline Render Error]', err);
      }
    }
  }, [currentRoute, mapStatus]);

  const handleComputeRouteToCoords = async (destCoords, destName) => {
    if (!userCoords?.lat || !userCoords?.lng) {
      setRouteError('Location permission is required to calculate a route from your current location.');
      return;
    }

    const origin = userCoords;
    setSearchingRoute(true);
    setRouteError('');

    try {
      const res = await computeSafeRoute({
        origin,
        destination: destCoords,
        travelMode
      });

      if (!res?.success) {
        setRouteError(res?.error || 'Unable to compute route to this location.');
        return;
      }

      // Prefer a route that avoids known SafeVoyage risk points; otherwise use the shortest returned route.
      const hazardPoints = displayPoints.filter(p => !p.isSafe || p.type === 'risk_zone');
      const routeCandidates = [res, ...(res.alternatives || [])];
      const scoredRoutes = routeCandidates.map((route) => {
        let nearestHazard = null;
        let minDistanceKm = Infinity;
        for (const point of route.path || []) {
          for (const hazard of hazardPoints) {
            if (!hazard.lat || !hazard.lng) continue;
            const dLat = (point.lat - hazard.lat) * 111;
            const dLng = (point.lng - hazard.lng) * 111 * Math.cos(hazard.lat * Math.PI / 180);
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);
            if (distance < minDistanceKm) {
              minDistanceKm = distance;
              nearestHazard = hazard;
            }
          }
        }
        return { route, nearestHazard, minDistanceKm };
      });
      const safetyDataAvailable = hazardPoints.length > 0;
      const selected = safetyDataAvailable
        ? scoredRoutes.sort((a, b) => (a.minDistanceKm < 2 ? 1 : 0) - (b.minDistanceKm < 2 ? 1 : 0) || a.route.distanceMeters - b.route.distanceMeters)[0]
        : scoredRoutes.sort((a, b) => a.route.distanceMeters - b.route.distanceMeters)[0];
      const selectedRoute = selected.route;
      const safetyNotice = selected.nearestHazard && selected.minDistanceKm < 2
        ? { isSafe: false, text: `⚠️ Route overlaps an active safety advisory near ${selected.nearestHazard.name}.` }
        : safetyDataAvailable
          ? { isSafe: true, text: 'Recommended safer route' }
          : { isSafe: true, text: 'Limited safety data; route selection is primarily based on distance and available routing information.' };

      // Create or update destination pin on map
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }

      if (mapInstanceRef.current && window.google?.maps) {
        destinationMarkerRef.current = new window.google.maps.Marker({
          position: destCoords,
          map: mapInstanceRef.current,
          title: `🏁 ${destName} (Safest Destination)`,
          animation: window.google.maps.Animation.DROP
        });
      }

      setInternalRoute({
        ...selectedRoute,
        alternatives: routeCandidates.filter((route) => route !== selectedRoute),
        destinationName: destName,
        destinationCoords: destCoords,
        safetyNotice,
        travelMode
      });
    } catch (err) {
      console.warn('[Compute Safe Route Error]', err);
      setRouteError('Error computing safest route.');
    } finally {
      setSearchingRoute(false);
    }
  };

  const handleSearchLocation = async () => {
    if (!locationInput || !locationInput.trim() || searchingRoute) return;
    setSearchingRoute(true);
    setRouteError('');
    try {
      const geo = await forwardGeocode(locationInput.trim(), userCoords || targetCenter);
      if (!geo || !geo.lat || !geo.lng) {
        setRouteError(`Unable to geocode "${locationInput}". Please try a more specific address or place.`);
        return;
      }
      await handleComputeRouteToCoords(
        { lat: geo.lat, lng: geo.lng },
        geo.name || geo.formattedAddress || locationInput.trim()
      );
    } catch (err) {
      console.warn('[Search Location Error]', err);
      setRouteError('Failed to resolve location.');
    } finally {
      setSearchingRoute(false);
    }
  };

  const handleCalculateRouteToPoint = async (pt) => {
    if (!pt?.lat || !pt?.lng) return;
    setRoutingPointId(pt.id || pt.name);
    await handleComputeRouteToCoords({ lat: pt.lat, lng: pt.lng }, pt.name);
    setRoutingPointId(null);
  };

  const handleClearRoute = () => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    alternativePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    alternativePolylinesRef.current = [];
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }
    if (leafletPolylineRef.current) {
      leafletPolylineRef.current.remove();
      leafletPolylineRef.current = null;
    }
    setInternalRoute(null);
    setLocationInput('');
    setRouteError('');
    if (propOnClearRoute) {
      propOnClearRoute();
    }
    if (mapInstanceRef.current && targetCenter) {
      try {
        mapInstanceRef.current.panTo(targetCenter);
        mapInstanceRef.current.setZoom(12);
      } catch (e) {}
    }
    if (leafletMapRef.current && targetCenter) {
      try {
        leafletMapRef.current.panTo([targetCenter.lat, targetCenter.lng]);
        leafletMapRef.current.setZoom(12);
      } catch (e) {}
    }
  };

  const externalMapSearchUrl = `https://maps.google.com/?q=${encodeURIComponent((destination || '') + ' emergency services safe zones')}`;

  return (
    <div className="card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
      {/* Map Control Bar */}
      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Safety Infrastructure & Alert Map</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {destination || 'Destination'} Safety Grid • Hospitals, police stations, safe havens, and hazard zones
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Markers' },
            { id: 'SAFE', label: '🟢 Safe Zones' },
            { id: 'RISK', label: '🔴 Risk Areas' },
            { id: 'HOSPITAL', label: '🏥 Hospitals' },
            { id: 'POLICE', label: '🚓 Police' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`btn btn-sm ${activeFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Safest Direction & Places Autocomplete Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '1rem',
          backgroundColor: 'var(--bg-subtle)',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
              placeholder="Enter location or place for Safest Directions (e.g. Netravati Peak, Baga Beach, Apollo Hospital)..."
              className="input-field"
              style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
          </div>

          {/* Travel Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={() => setTravelMode('DRIVE')}
              className={`btn btn-sm ${travelMode === 'DRIVE' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '3px 8px', fontSize: '0.75rem', border: 'none' }}
              title="Drive Route"
            >
              🚗 Drive
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('WALK')}
              className={`btn btn-sm ${travelMode === 'WALK' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '3px 8px', fontSize: '0.75rem', border: 'none' }}
              title="Walk Route"
            >
              🚶 Walk
            </button>
          </div>

          {/* Show Safest Direction Button */}
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={searchingRoute || !locationInput.trim()}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', fontSize: '0.82rem', padding: '6px 14px' }}
          >
            {searchingRoute ? <Loader2 size={14} className="spin" /> : <Navigation size={14} />}
            {searchingRoute ? 'Calculating Safest Route...' : 'Show Safest Direction'}
          </button>

          {currentRoute && (
            <button
              type="button"
              onClick={handleClearRoute}
              className="btn btn-secondary btn-sm"
              style={{ gap: '4px', fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <X size={14} /> Clear Route
            </button>
          )}
        </div>

        {/* Quick Location Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUICK SAFEST ROUTES:</span>
          {displayPoints.find(p => p.type === 'hospital') && (
            <button
              type="button"
              onClick={() => {
                const hosp = displayPoints.find(p => p.type === 'hospital');
                setLocationInput(hosp.name);
                handleComputeRouteToCoords({ lat: hosp.lat, lng: hosp.lng }, hosp.name);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '2px 8px', height: '24px' }}
            >
              🏥 Nearest Hospital
            </button>
          )}
          {displayPoints.find(p => p.type === 'police') && (
            <button
              type="button"
              onClick={() => {
                const pol = displayPoints.find(p => p.type === 'police');
                setLocationInput(pol.name);
                handleComputeRouteToCoords({ lat: pol.lat, lng: pol.lng }, pol.name);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '2px 8px', height: '24px' }}
            >
              🚓 Police Station
            </button>
          )}
          {destination && (
            <button
              type="button"
              onClick={() => {
                setLocationInput(destination);
                handleSearchLocation();
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '2px 8px', height: '24px' }}
            >
              📍 {destination} Center
            </button>
          )}
        </div>

        {/* Route Error Notification */}
        {routeError && (
          <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
            {routeError}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: height,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          backgroundColor: '#0F172A'
        }}
      >
        {/* Google Maps Render Target */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            display: mapStatus === 'SUCCESS' ? 'block' : 'none'
          }}
        />

        {/* Leaflet / OpenStreetMap Render Target */}
        <div
          ref={leafletContainerRef}
          style={{
            width: '100%',
            height: '100%',
            display: mapStatus === 'LEAFLET' ? 'block' : 'none'
          }}
        />

        {/* Leaflet Active Status Indicator */}
        {mapStatus === 'LEAFLET' && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 400,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span><strong>Live Map Active</strong> (OpenStreetMap Engine)</span>
            <span style={{ color: '#94A3B8' }}>• Google Cloud Billing Pending</span>
          </div>
        )}

        {/* Google Routes API Live Route HUD Overlay */}
        {currentRoute && (mapStatus === 'SUCCESS' || mapStatus === 'LEAFLET') && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              zIndex: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: `1.5px solid ${currentRoute.safetyNotice?.isSafe !== false ? '#10B981' : '#F59E0B'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: currentRoute.safetyNotice?.isSafe !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: currentRoute.safetyNotice?.isSafe !== false ? '#34D399' : '#FBBF24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${currentRoute.safetyNotice?.isSafe !== false ? '#10B981' : '#F59E0B'}`
                }}
              >
                <RouteIcon size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: currentRoute.safetyNotice?.isSafe !== false ? '#34D399' : '#FBBF24' }}>
                    {currentRoute.durationText || `${currentRoute.durationMinutes} mins`}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
                    ({currentRoute.distanceKm || `${(currentRoute.distanceMeters / 1000).toFixed(1)} km`})
                  </span>
                  <span
                    className={`badge ${currentRoute.safetyNotice?.isSafe !== false ? 'badge-safe' : 'badge-warning'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', fontWeight: 700 }}
                  >
                    {currentRoute.safetyNotice?.text || '🟢 Safest Route Verified'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '3px' }}>
                  To <strong>{currentRoute.destinationName || 'Destination'}</strong> via {currentRoute.description || 'Google Routes API'} • {currentRoute.travelMode === 'WALK' ? '🚶 Walking' : '🚗 Driving'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={getGoogleNavigationUrl(
                  currentRoute.origin || userCoords || targetCenter,
                  currentRoute.destination || currentRoute.destinationCoords,
                  currentRoute.travelMode === 'WALK' ? 'walking' : 'driving'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', gap: '6px', textDecoration: 'none' }}
              >
                <Navigation size={14} /> Turn-by-Turn Navigation
              </a>
              <button
                onClick={handleClearRoute}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 10px', gap: '4px' }}
                title="Clear route"
              >
                <X size={15} /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Not Configured Banner / Fallback UI (Requirement 11 & 20) */}
        {mapStatus === 'NOT CONFIGURED' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#0B132B',
              color: '#FFFFFF'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: '#F87171' }}>
              Google Maps API not configured.
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '520px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              The configured Google Maps API key requires activating <strong>Maps JavaScript API</strong> in Google Cloud Console. In accordance with zero-fake telemetry standards, interactive satellite rendering is disabled until the API is activated.
            </p>

            <a
              href={externalMapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> Open {destination || 'Current Location'} in Google Maps
            </a>
          </div>
        )}

        {mapStatus === 'LOADING' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0B132B',
              color: '#94A3B8',
              fontSize: '0.9rem'
            }}
          >
            Loading Google Maps telemetry...
          </div>
        )}
      </div>

      {/* Structured Location Resource Cards with Clickable Actions (Requirement 12 & 16) */}
      <div style={{ marginTop: '1.25rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          Identified Safety Resources in {destination || 'Destination'} ({filteredPoints.length})
        </h4>

        {filteredPoints.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No specific infrastructure markers cataloged for this category.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {filteredPoints.map((pt) => {
              const isRisk = pt.type === 'risk_zone' || !pt.isSafe;
              const mapUrl = pt.lat && pt.lng
                ? `https://maps.google.com/?q=${pt.lat},${pt.lng}`
                : `https://maps.google.com/?q=${encodeURIComponent(pt.name + ' ' + (destination || ''))}`;

              return (
                <div
                  key={pt.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: `1px solid ${isRisk ? 'var(--danger-border)' : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span
                        className={`badge ${isRisk ? 'badge-danger' : pt.type === 'hospital' ? 'badge-info' : 'badge-safe'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {pt.type?.toUpperCase() || (isRisk ? 'RISK ZONE' : 'SAFE ZONE')}
                      </span>
                      {pt.phone && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {pt.phone}
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {pt.name}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {pt.status || (isRisk ? 'Active Advisory Zone' : 'Verified Emergency Support')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    {pt.phone ? (
                      <a
                        href={`tel:${pt.phone.replace(/[^0-9+]/g, '')}`}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', textDecoration: 'none' }}
                      >
                        <Phone size={12} /> Call
                      </a>
                    ) : (
                      <button disabled className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', opacity: 0.6, padding: '3px 8px' }}>
                        Phone unavailable
                      </button>
                    )}

                    <a
                      href={`sms:${pt.phone ? pt.phone.replace(/[^0-9+]/g, '') : '112'}`}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', textDecoration: 'none' }}
                    >
                      <MessageSquare size={12} /> Message
                    </a>

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> Google Maps
                    </a>

                    {pt.lat && pt.lng && (
                      <button
                        onClick={() => handleCalculateRouteToPoint(pt)}
                        disabled={routingPointId === (pt.id || pt.name)}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', gap: '4px', backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                        title="Compute safe route and live traffic ETA using Google Maps Routes API"
                      >
                        {routingPointId === (pt.id || pt.name) ? (
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
    </div>
  );
}
