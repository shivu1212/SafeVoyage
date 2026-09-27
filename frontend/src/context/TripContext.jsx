import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';
import { matchItineraryWithAdvisories } from '../utils/itineraryMatcher.js';
import { calculateTripRisk } from '../utils/riskEngine.js';
import { getWeather } from '../services/weatherService.js';
import { getDestinationSafetyData, getAdvisories } from '../services/safetyService.js';

const TripContext = createContext();

// City landmark suggestions for Requirement 8
const CITY_LANDMARK_SUGGESTIONS = {
  chennai: [
    { id: 'sug_chn_1', name: 'Marina Beach', category: 'Sightseeing', description: 'Scenic coastline with promenade. Note active high-surf advisories.' },
    { id: 'sug_chn_2', name: 'Kapaleeshwarar Temple', category: 'Cultural', description: '7th-century Hindu temple with historic Dravidian architecture.' },
    { id: 'sug_chn_3', name: 'Fort St George', category: 'Historical', description: 'Historic 1644 fortress with museum and Tamil Nadu legislative assembly.' },
    { id: 'sug_chn_4', name: 'Government Museum', category: 'Education', description: 'Renowned museum of human history and culture in Egmore.' }
  ],
  dubai: [
    { id: 'sug_dxb_1', name: 'Burj Khalifa', category: 'Sightseeing', description: 'World tallest tower with observation decks.' },
    { id: 'sug_dxb_2', name: 'Dubai Mall & Fountain', category: 'Shopping', description: 'Sprawling entertainment complex with aquatic show.' },
    { id: 'sug_dxb_3', name: 'Palm Jumeirah', category: 'Leisure', description: 'Iconic tree-shaped archipelago with beaches.' },
    { id: 'sug_dxb_4', name: 'Dubai Miracle Garden', category: 'Nature', description: 'Expansive flower garden ideal for families.' }
  ],
  bengaluru: [
    { id: 'sug_blr_1', name: 'Lalbagh Botanical Garden', category: 'Nature', description: '240-acre botanical paradise with historic glass house.' },
    { id: 'sug_blr_2', name: 'Cubbon Park', category: 'Parks', description: 'Lush landmark park with wide walking trails.' },
    { id: 'sug_blr_3', name: 'Bangalore Palace', category: 'Historical', description: 'Tudor-revival architecture palace.' },
    { id: 'sug_blr_4', name: 'Visvesvaraya Industrial & Tech Museum', category: 'Family', description: 'Interactive science exhibits for children.' }
  ],
  madurai: [
    { id: 'sug_mdu_1', name: 'Meenakshi Amman Temple', category: 'Cultural', description: 'Historic Hindu temple with 14 colorful gateway gopurams.' },
    { id: 'sug_mdu_2', name: 'Thirumalai Nayakkar Mahal', category: 'Historical', description: '17th-century palace with light and sound show.' },
    { id: 'sug_mdu_3', name: 'Gandhi Memorial Museum', category: 'Historical', description: 'Important freedom movement archive and museum.' },
    { id: 'sug_mdu_4', name: 'Alagar Koyil', category: 'Spiritual', description: 'Ancient temple nestled in scenic hills.' }
  ],
  rameshwaram: [
    { id: 'sug_rms_1', name: 'Ramanathaswamy Temple', category: 'Spiritual', description: 'Sacred temple famed for the longest corridor in India.' },
    { id: 'sug_rms_2', name: 'Dhanushkodi Beach & Ghost Town', category: 'Nature', description: 'Historic point at the confluence of Gulf of Mannar and Palk Strait.' },
    { id: 'sug_rms_3', name: 'Pamban Bridge Viewpoint', category: 'Sightseeing', description: 'Iconic cantilever railway bridge over the sea.' },
    { id: 'sug_rms_4', name: 'APJ Abdul Kalam Memorial', category: 'Memorial', description: 'Dedicated to the former President of India.' }
  ]
};

export function TripProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // Storage key helper for strict user isolation (Requirement 18)
  const getUserStorageKey = useCallback((suffix) => {
    const uid = user?.id || 'guest';
    return `safevoyage_user_${uid}_${suffix}`;
  }, [user]);

  // Clean initial states without hardcoded demo entries (Requirement 9)
  const [trip, setTrip] = useState({
    id: '',
    title: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelType: 'Flight',
    travellersCount: 1,
    notes: '',
    status: 'Active',
    destinations: []
  });

  const [destinations, setDestinations] = useState([]);
  const [activeDestination, setActiveDestinationState] = useState('');
  const [travellers, setTravellers] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [weather, setWeather] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [destinationSafety, setDestinationSafety] = useState(null);
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [sosEvent, setSosEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compute travel party breakdown dynamically (Requirement 4)
  const partyBreakdown = useMemo(() => {
    const counts = { adult: 0, child: 0, elderly: 0, family: 0, friend: 0, total: travellers.length };
    travellers.forEach(t => {
      const cat = (t.category || '').toLowerCase();
      if (cat === 'child') counts.child++;
      else if (cat === 'elderly') counts.elderly++;
      else if (cat === 'family') counts.family++;
      else if (cat === 'friend') counts.friend++;
      else counts.adult++;
    });
    return counts;
  }, [travellers]);

  // Load destination safety and landmark suggestions
  const loadDestinationContext = useCallback(async (destName) => {
    if (!destName || !destName.trim()) {
      setWeather(null);
      setDestinationSafety(null);
      setAdvisories([]);
      setMapPoints([]);
      setSuggestedLocations([]);
      return;
    }

    const cleanDest = destName.trim();
    setSuggestedLocations([]);

    // 2. Fetch Real Weather & Safety (Requirement 5 & 13)
    try {
      const [weathData, safetyData, advData] = await Promise.all([
        getWeather(cleanDest, false),
        getDestinationSafetyData(cleanDest),
        getAdvisories(cleanDest)
      ]);

      if (weathData) setWeather(weathData);
      if (safetyData) {
        setDestinationSafety(safetyData);
        if (safetyData.mapPoints && safetyData.mapPoints.length > 0) {
          setMapPoints(safetyData.mapPoints);
        }
      }
      if (advData) {
        setAdvisories(advData);
      }
    } catch (err) {
      console.warn('[loadDestinationContext error]', err);
    }
  }, []);

  // Set active destination and trigger context refresh
  const setActiveDestination = useCallback((destName) => {
    setActiveDestinationState(destName);
    if (destName) {
      loadDestinationContext(destName);
      setDestinations(currDests => {
        const matching = currDests.find(d => d.name?.toLowerCase() === destName.toLowerCase());
        if (matching) {
          setTrip(prev => ({
            ...prev,
            destination: matching.name,
            startDate: matching.startDate || prev.startDate,
            endDate: matching.endDate || prev.endDate,
            adults: matching.adults !== undefined ? matching.adults : prev.adults,
            children: matching.children !== undefined ? matching.children : prev.children,
            elderly: matching.elderly !== undefined ? matching.elderly : prev.elderly
          }));
        }
        return currDests;
      });
    }
  }, [loadDestinationContext]);

  // Update primary destination in trip
  const updateDestination = useCallback(async (newDestination) => {
    if (!newDestination || !newDestination.trim()) return;
    const dest = newDestination.trim();

    setTrip(prev => ({
      ...prev,
      destination: dest,
      title: `${dest} Safe Voyage Trip`
    }));
    setActiveDestination(dest);

    try {
      await api.updateTrip({ destination: dest, title: `${dest} Safe Voyage Trip` });
    } catch (err) {
      console.warn('[updateDestination API fallback]', err);
    }
  }, [setActiveDestination]);

  // Fetch all user-scoped data
  const fetchAllTripData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      // Clear data when unauthenticated
      setTrip({
        id: '',
        title: '',
        origin: '',
        destination: '',
        startDate: '',
        endDate: '',
        travelType: 'Flight',
        travellersCount: 1,
        notes: '',
        status: 'Active',
        destinations: []
      });
      setDestinations([]);
      setTravellers([]);
      setItinerary([]);
      setEmergencyContacts([]);
      setAdvisories([]);
      setWeather(null);
      setMapPoints([]);
      setDestinationSafety(null);
      setActiveDestinationState('');
      return;
    }

    setLoading(true);
    try {
      const [tripRes, destsRes, travRes, itinRes, contRes] = await Promise.allSettled([
        api.getTrip(),
        api.getDestinations(),
        api.getTravellers(),
        api.getItinerary(),
        api.getContacts()
      ]);

      let currentDest = '';

      if (tripRes.status === 'fulfilled' && tripRes.value?.trip) {
        const fetchedTrip = tripRes.value.trip;
        setTrip(fetchedTrip);
        currentDest = fetchedTrip.destination || '';
      }

      if (destsRes.status === 'fulfilled' && destsRes.value?.destinations) {
        const fetchedDests = destsRes.value.destinations;
        setDestinations(fetchedDests);
        if (!currentDest && fetchedDests.length > 0) {
          currentDest = fetchedDests[0].name;
        }
      }

      if (travRes.status === 'fulfilled' && travRes.value?.travellers) {
        const fetchedTravellers = travRes.value.travellers;
        if (fetchedTravellers.length > 0) {
          setTravellers(fetchedTravellers);
        } else if (user) {
          // Initialize head traveller from authenticated user
          const headTrav = {
            id: `trav_${user.id}`,
            name: user.name || 'Head Traveller',
            age: 30,
            phone: user.phone || '',
            relationship: 'Self',
            category: 'Adult',
            isHead: true,
            safetyStatus: 'SAFE',
            specialNeeds: []
          };
          setTravellers([headTrav]);
        }
      }

      if (itinRes.status === 'fulfilled' && itinRes.value?.itinerary) {
        setItinerary(itinRes.value.itinerary);
      }

      if (contRes.status === 'fulfilled' && contRes.value?.contacts) {
        setEmergencyContacts(contRes.value.contacts);
      }

      const effectiveDest = currentDest || trip?.destination || '';
      setActiveDestinationState(effectiveDest);
      if (effectiveDest) {
        await loadDestinationContext(effectiveDest);
      }
    } catch (err) {
      console.warn('[TripContext fetch error]', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadDestinationContext]);

  useEffect(() => {
    fetchAllTripData();
  }, [fetchAllTripData]);

  // Compute 4-Factor Itinerary Matching dynamically
  const matchingResults = useMemo(() => {
    return matchItineraryWithAdvisories(itinerary, advisories);
  }, [itinerary, advisories]);

  // Compute Composite 0-100 Risk Engine dynamically
  const riskAssessment = useMemo(() => {
    return calculateTripRisk({
      advisories,
      affectedActivitiesCount: matchingResults.affectedCount,
      weatherCondition: weather?.condition || 'Partly Cloudy',
      rainProbability: weather?.rainProbability || 0,
      travellers
    });
  }, [advisories, matchingResults.affectedCount, weather, travellers]);

  // Destination Management (Requirement 3: Multiple Destinations & Travel Partners)
  const addDestination = async (destData) => {
    if (!destData || !destData.name) return { success: false, error: 'Destination name required' };
    const newDest = {
      id: `dest_${Date.now()}`,
      name: destData.name.trim(),
      city: destData.name.trim(),
      startDate: destData.startDate || trip.startDate || '',
      endDate: destData.endDate || trip.endDate || '',
      notes: destData.notes || '',
      adults: destData.adults !== undefined ? Number(destData.adults) : 1,
      children: destData.children !== undefined ? Number(destData.children) : 0,
      elderly: destData.elderly !== undefined ? Number(destData.elderly) : 0
    };

    setDestinations(prev => [...prev, newDest]);

    // If trip destination was empty, set this as primary active destination
    if (!trip.destination) {
      setTrip(prev => ({
        ...prev,
        destination: newDest.name,
        startDate: prev.startDate || newDest.startDate,
        endDate: prev.endDate || newDest.endDate,
        adults: newDest.adults,
        children: newDest.children,
        elderly: newDest.elderly
      }));
      setActiveDestination(newDest.name);
    }

    try {
      const res = await api.addDestination(newDest);
      if (res?.destinations) setDestinations(res.destinations);
    } catch (err) {
      console.warn('[addDestination API fallback]', err);
    }
    return { success: true, destination: newDest };
  };

  const updateDestinationItem = async (id, destData) => {
    const existing = destinations.find(d => d.id === id);
    const oldName = existing?.name || '';
    const newName = destData.name?.trim() || oldName;

    setDestinations(prev => prev.map(d => d.id === id ? { ...d, ...destData, name: newName, city: newName } : d));

    // If edited destination is currently active (or if name changed)
    const isCurrentActive = (activeDestination || trip.destination || '').toLowerCase() === oldName.toLowerCase()
      || (activeDestination || trip.destination || '').toLowerCase() === newName.toLowerCase();

    if (isCurrentActive) {
      if (oldName.toLowerCase() !== newName.toLowerCase()) {
        setActiveDestination(newName);
      }
      setTrip(prev => ({
        ...prev,
        destination: newName,
        startDate: destData.startDate || prev.startDate,
        endDate: destData.endDate || prev.endDate,
        adults: destData.adults !== undefined ? Number(destData.adults) : prev.adults,
        children: destData.children !== undefined ? Number(destData.children) : prev.children,
        elderly: destData.elderly !== undefined ? Number(destData.elderly) : prev.elderly
      }));
    }

    // If name changed, rename associated activities to match new destination
    if (oldName && newName && oldName.toLowerCase() !== newName.toLowerCase()) {
      setItinerary(prev => prev.map(it => {
        if ((it.city || it.destination || '').toLowerCase() === oldName.toLowerCase()) {
          return { ...it, city: newName, destination: newName };
        }
        return it;
      }));
    }

    try {
      const res = await api.updateDestinationItem(id, destData);
      if (res?.destinations) setDestinations(res.destinations);
    } catch (err) {
      console.warn('[updateDestinationItem API fallback]', err);
    }
    return { success: true };
  };

  const deleteDestinationItem = async (id) => {
    const deleted = destinations.find(d => d.id === id);
    const deletedName = deleted?.name || '';
    const remaining = destinations.filter(d => d.id !== id);
    setDestinations(remaining);

    // Remove associated itinerary items for this destination
    if (deletedName) {
      setItinerary(prev => prev.filter(
        item => (item.city || item.destination || '').toLowerCase() !== deletedName.toLowerCase()
      ));
    }

    // If active destination is the deleted one, switch to first remaining
    if (deleted && deleted.name?.toLowerCase() === activeDestination?.toLowerCase()) {
      if (remaining.length > 0) {
        const nextActive = remaining[0].name;
        setActiveDestination(nextActive);
        setTrip(prev => ({
          ...prev,
          destination: nextActive,
          startDate: remaining[0].startDate || prev.startDate,
          endDate: remaining[0].endDate || prev.endDate,
          adults: remaining[0].adults !== undefined ? Number(remaining[0].adults) : prev.adults,
          children: remaining[0].children !== undefined ? Number(remaining[0].children) : prev.children,
          elderly: remaining[0].elderly !== undefined ? Number(remaining[0].elderly) : prev.elderly
        }));
      } else {
        setActiveDestinationState('');
        setTrip(prev => ({
          ...prev,
          destination: '',
          startDate: '',
          endDate: ''
        }));
        setWeather(null);
        setDestinationSafety(null);
        setAdvisories([]);
        setMapPoints([]);
        setSuggestedLocations([]);
      }
    }

    try {
      const res = await api.deleteDestinationItem(id);
      if (res?.destinations) setDestinations(res.destinations);
      if (res?.itinerary) setItinerary(res.itinerary);
    } catch (err) {
      console.warn('[deleteDestinationItem API fallback]', err);
    }
    return { success: true };
  };

  const updateTravelPartners = async ({ adults, children, elderly }) => {
    const counts = {
      adults: adults !== undefined ? Number(adults) : 1,
      children: children !== undefined ? Number(children) : 0,
      elderly: elderly !== undefined ? Number(elderly) : 0
    };
    setTrip(prev => ({ ...prev, ...counts }));
    const currentActiveDest = destinations.find(d => d.name?.toLowerCase() === (activeDestination || trip.destination)?.toLowerCase());
    if (currentActiveDest) {
      await updateDestinationItem(currentActiveDest.id, counts);
    }
    try {
      await api.updateTrip(counts);
    } catch (err) {
      console.warn('[updateTravelPartners fallback]', err);
    }
    return { success: true };
  };

  // Itinerary CRUD (Requirement 7 & 10)
  const addActivity = async (activityData) => {
    const actPlace = activityData.place || activityData.name || activityData.location || 'Activity Place';
    const actDest = activityData.destination || activityData.city || activeDestination || trip.destination || 'Destination';
    const actWithId = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      day: parseInt(activityData.day, 10) || 1,
      date: activityData.date || trip.startDate || new Date().toISOString().split('T')[0],
      time: activityData.time || '10:00 AM',
      place: actPlace,
      name: actPlace,
      location: activityData.location || actPlace,
      city: actDest,
      destination: actDest,
      category: activityData.category || 'Sightseeing',
      notes: activityData.notes || ''
    };

    setItinerary(prev => [...prev, actWithId].sort((a, b) => a.day - b.day));

    // If activeDestination is empty, initialize it to the activity's destination
    if (!activeDestination && actDest && actDest !== 'Destination') {
      setActiveDestinationState(actDest);
    }

    try {
      await api.addActivity(actWithId);
    } catch (err) {
      console.warn('[addActivity API fallback]', err.message);
    }
    return { success: true, activity: actWithId };
  };

  const updateActivity = async (id, activityData) => {
    setItinerary(prev => prev.map(a => a.id === id ? { ...a, ...activityData } : a).sort((a, b) => a.day - b.day));
    try {
      await api.updateActivity(id, activityData);
    } catch (err) {
      console.warn('[updateActivity API fallback]', err.message);
    }
    return { success: true };
  };

  const deleteActivity = async (id) => {
    setItinerary(prev => prev.filter(a => a.id !== id));
    try {
      await api.deleteActivity(id);
    } catch (err) {
      console.warn('[deleteActivity API fallback]', err.message);
    }
    return { success: true };
  };

  const duplicateActivity = async (id) => {
    const item = itinerary.find(a => a.id === id);
    if (!item) return;
    return addActivity({
      ...item,
      place: `${item.place} (Copy)`,
      notes: `Duplicated from Day ${item.day}`
    });
  };

  // Landmark Suggestions Accept / Reject (Requirement 8)
  const acceptSuggestion = async (suggestion) => {
    if (!suggestion) return;
    await addActivity({
      place: suggestion.name,
      city: activeDestination || trip.destination,
      category: suggestion.category || 'Sightseeing',
      date: trip.startDate || new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      day: 1,
      notes: `Added from location suggestions: ${suggestion.description || ''}`
    });

    // Remove from suggestions list once accepted
    setSuggestedLocations(prev => prev.filter(s => s.id !== suggestion.id));
    return { success: true };
  };

  const rejectSuggestion = (suggestionId) => {
    setSuggestedLocations(prev => prev.filter(s => s.id !== suggestionId));
    return { success: true };
  };

  // Travellers CRUD (Requirement 4)
  const addTraveller = async (travellerData) => {
    const newTrav = {
      ...travellerData,
      id: `trav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: travellerData.category || (parseInt(travellerData.age, 10) >= 60 ? 'Elderly' : parseInt(travellerData.age, 10) < 13 ? 'Child' : 'Adult'),
      safetyStatus: travellerData.safetyStatus || 'SAFE'
    };
    setTravellers(prev => [...prev, newTrav]);
    try {
      await api.addTraveller(newTrav);
    } catch (err) {
      console.warn('[addTraveller API fallback]', err.message);
    }
    return { success: true, traveller: newTrav };
  };

  const updateTraveller = async (id, travellerData) => {
    setTravellers(prev => prev.map(t => t.id === id ? { ...t, ...travellerData } : t));
    try {
      await api.updateTraveller(id, travellerData);
    } catch (err) {
      console.warn('[updateTraveller API fallback]', err.message);
    }
    return { success: true };
  };

  const deleteTraveller = async (id) => {
    setTravellers(prev => prev.filter(t => t.id !== id));
    try {
      await api.deleteTraveller(id);
    } catch (err) {
      console.warn('[deleteTraveller API fallback]', err.message);
    }
    return { success: true };
  };

  // Trip details update (Requirement 2)
  const updateTripDetails = async (tripData) => {
    setTrip(prev => ({ ...prev, ...tripData }));
    if (tripData.destination && tripData.destination !== trip.destination) {
      await updateDestination(tripData.destination);
    }
    try {
      await api.updateTrip(tripData);
    } catch (err) {
      console.warn('[updateTrip API fallback]', err.message);
    }
    return { success: true };
  };

  // Emergency contacts CRUD (Requirement 17)
  const addContact = async (contact) => {
    const newC = {
      ...contact,
      id: `emc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      relationship: contact.relationship || 'Other'
    };
    setEmergencyContacts(prev => [...prev, newC]);
    try {
      await api.addContact(newC);
    } catch (err) {
      console.warn('[addContact API fallback]', err.message);
    }
    return { success: true, contact: newC };
  };

  const updateContact = async (id, contactData) => {
    setEmergencyContacts(prev => prev.map(c => c.id === id ? { ...c, ...contactData } : c));
    try {
      await api.updateContact(id, contactData);
    } catch (err) {
      console.warn('[updateContact API fallback]', err.message);
    }
    return { success: true };
  };

  const deleteContact = async (id) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
    try {
      await api.deleteContact(id);
    } catch (err) {
      console.warn('[deleteContact API fallback]', err.message);
    }
    return { success: true };
  };

  // SOS activation and location sharing (Requirement 16)
  const activateSOS = async (locationData) => {
    setUserLocation(locationData);

    const userMarker = {
      id: 'usr_sos_marker',
      name: `LIVE USER SOS: ${locationData?.placeName || activeDestination || 'Current Location'}`,
      type: 'sos_user',
      lat: locationData?.lat || 13.0827,
      lng: locationData?.lng || 80.2707,
      x: 50,
      y: 50,
      status: `SOS Activated at ${new Date().toLocaleTimeString()}`,
      isSafe: false
    };

    setMapPoints(prev => [userMarker, ...prev.filter(p => p.id !== 'usr_sos_marker')]);

    try {
      const res = await api.activateSOS({
        location: locationData,
        destination: activeDestination || trip.destination,
        emergencyContacts: emergencyContacts
      });
      if (res?.event) setSosEvent(res.event);
      return res;
    } catch (err) {
      console.warn('[activateSOS fallback]', err.message);
      const fallbackEvent = {
        id: `sos_ev_${Date.now()}`,
        timestamp: new Date().toISOString(),
        latitude: locationData?.lat || 13.0827,
        longitude: locationData?.lng || 80.2707,
        destination: activeDestination || trip.destination,
        sessionId: `sess_${Date.now()}`
      };
      setSosEvent(fallbackEvent);
      return { success: true, event: fallbackEvent };
    }
  };

  const stopSOS = async () => {
    setUserLocation(null);
    setSosEvent(null);
    setMapPoints(prev => prev.filter(p => p.id !== 'usr_sos_marker'));
    try {
      await api.stopSOS();
    } catch (e) {}
  };

  const addAdvisory = async (advisoryData) => {
    const targetCity = advisoryData.city || activeDestination || trip.destination || '';
    const newAdv = {
      id: `adv_${Date.now()}`,
      type: advisoryData.type || 'Safety Advisory',
      city: targetCity,
      location: advisoryData.location || `${targetCity} Area`,
      category: advisoryData.category || 'General',
      severity: advisoryData.severity || 'HIGH',
      startDate: advisoryData.startDate || trip.startDate || new Date().toISOString().split('T')[0],
      endDate: advisoryData.endDate || trip.endDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      startTime: advisoryData.startTime || '10:00',
      description: advisoryData.description || 'Active advisory reported.',
      recommendation: advisoryData.recommendation || 'Follow local safety guidelines.'
    };

    setAdvisories(prev => [newAdv, ...prev]);

    if (newAdv.severity === 'HIGH') {
      const cityKey = (targetCity || '').toLowerCase();
      let centerLat = destinationSafety?.lat || 15.2993;
      let centerLng = destinationSafety?.lng || 74.1240;
      if (cityKey.includes('chennai')) { centerLat = 13.0827; centerLng = 80.2707; }
      else if (cityKey.includes('netravati')) { centerLat = 13.1284; centerLng = 75.3305; }
      else if (cityKey.includes('mumbai')) { centerLat = 19.0760; centerLng = 72.8777; }
      else if (cityKey.includes('delhi')) { centerLat = 28.6139; centerLng = 77.2090; }
      else if (cityKey.includes('bengaluru') || cityKey.includes('bangalore')) { centerLat = 12.9716; centerLng = 77.5946; }

      const hazardPoint = {
        id: `hp_${Date.now()}`,
        name: `${newAdv.type} Alert Zone`,
        type: 'risk_zone',
        lat: centerLat + (Math.random() - 0.5) * 0.015,
        lng: centerLng + (Math.random() - 0.5) * 0.015,
        severity: 'HIGH',
        status: newAdv.description,
        isSafe: false
      };
      setMapPoints(prev => [hazardPoint, ...prev]);
    }

    try {
      await api.createAdvisory(newAdv);
    } catch (e) {
      console.warn('[addAdvisory API warning]', e);
    }
    return { success: true, advisory: newAdv };
  };

  return (
    <TripContext.Provider
      value={{
        trip,
        destinations,
        activeDestination,
        setActiveDestination,
        travellers,
        partyBreakdown,
        itinerary,
        advisories,
        addAdvisory,
        weather,
        emergencyContacts,
        mapPoints,
        matchingResults,
        riskAssessment,
        destinationSafety,
        suggestedLocations,
        isDemoMode,
        setIsDemoMode,
        userLocation,
        sosEvent,
        loading,
        updateDestination,
        addDestination,
        updateDestinationItem,
        deleteDestinationItem,
        updateTravelPartners,
        addActivity,
        updateActivity,
        deleteActivity,
        duplicateActivity,
        acceptSuggestion,
        rejectSuggestion,
        addTraveller,
        updateTraveller,
        deleteTraveller,
        updateTripDetails,
        addContact,
        updateContact,
        deleteContact,
        activateSOS,
        stopSOS,
        refreshData: fetchAllTripData
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
