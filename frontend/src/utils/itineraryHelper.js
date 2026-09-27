/**
 * SafeVoyage Itinerary Helper
 * Integrates AI Chatbox place suggestions directly with the existing
 * Multi-Day Itinerary Intelligence & My Trip & Itinerary system.
 */

/**
 * Checks whether a location is already present in the itinerary (Duplicate Prevention)
 */
export function isLocationInItinerary(placeName, destinationName = '', itinerary = []) {
  if (!placeName || !Array.isArray(itinerary)) return false;
  
  const cleanTarget = placeName
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();

  if (!cleanTarget) return false;

  return itinerary.some(item => {
    const itemPlace = (item.place || item.name || '')
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/[^\w\s]/g, '')
      .trim();

    if (!itemPlace) return false;

    // Direct match or substring overlap
    const isNameMatch = itemPlace === cleanTarget ||
      itemPlace.includes(cleanTarget) ||
      cleanTarget.includes(itemPlace);

    if (!isNameMatch) return false;

    // If destination name specified, ensure it belongs to the same destination context
    if (destinationName) {
      const itemCity = (item.city || item.destination || '').toLowerCase().trim();
      const targetCity = destinationName.toLowerCase().trim();
      if (itemCity && targetCity && itemCity !== targetCity && !itemCity.includes(targetCity) && !targetCity.includes(itemCity)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extracts a destination/city name from natural language query or context text
 * e.g. "We are going to Netravati", "Visiting Kudremukh", "Places to visit in Ooty"
 */
export function extractDestinationFromText(text = '') {
  if (!text || typeof text !== 'string') return '';

  const clean = text.replace(/[*#_`]/g, ' ');

  const patterns = [
    /(?:going to|headed to|traveling to|travelling to|trip to|tour to|vacation to)\s+([A-Za-z\s]{2,25}?)(?=[.,?!]|\s+(?:what|which|where|places|can|to|for|with|and|is|are|itinerary|tomorrow|today|\d)|$)/i,
    /(?:places to visit in|things to do in|places in|spots in|attractions in)\s+([A-Za-z\s]{2,25}?)(?=[.,?!]|\s+(?:what|which|where|can|to|for|with|and|is|are|itinerary|tomorrow|today|\d)|$)/i,
    /(?:visiting|visit|explore)\s+(?:in\s+|at\s+)?([A-Za-z\s]{2,25}?)(?=[.,?!]|\s+(?:what|which|where|places|can|to|for|with|and|is|are|itinerary|tomorrow|today|\d)|$)/i,
    /(?:places|things to do|spots|attractions)\s+(?:in|at|around)\s+([A-Za-z\s]{2,25}?)(?=[.,?!]|\s+(?:what|which|where|can|to|for|with|and|is|are|itinerary|tomorrow|today|\d)|$)/i,
    /(?:in|at)\s+([A-Z][a-zA-Z\s]{2,25}?)(?=[.,?!]|\s+(?:what|which|where|can|to|for|with|and|is|are|itinerary|tomorrow|today|\d)|$)/
  ];

  const commonWords = new Set([
    'the', 'a', 'an', 'some', 'any', 'my', 'our', 'this', 'that', 'there', 'here',
    'trip', 'vacation', 'holiday', 'tour', 'place', 'places', 'spot', 'spots',
    'beach', 'hotel', 'resort', 'airport', 'station', 'city', 'town', 'village',
    'itinerary', 'schedule', 'plan', 'plans'
  ]);

  for (const pat of patterns) {
    const match = clean.match(pat);
    if (match && match[1]) {
      let candidate = match[1].trim().replace(/^(in|at|to|around|the|a|an)\s+/i, '').trim();
      const lower = candidate.toLowerCase();
      if (!commonWords.has(lower) && candidate.length >= 3 && candidate.length <= 30) {
        return candidate.replace(/\b\w/g, c => c.toUpperCase());
      }
    }
  }

  return '';
}

/**
 * Resolves the destination context for a suggested place.
 * Supports Multi-Destination Trips:
 * (e.g. Netravati 26-28 Sep vs Mysuru 29-30 Sep)
 */
export function resolveDestinationForPlace(placeName = '', description = '', contextText = '', tripContext = {}) {
  const { destinations = [], activeDestination = '', trip = {} } = tripContext;

  const combinedSearchText = `${placeName} ${description} ${contextText}`.toLowerCase();

  // 1. Check if place or context matches any registered trip destination
  if (Array.isArray(destinations) && destinations.length > 0) {
    for (const d of destinations) {
      const dName = (d.name || '').toLowerCase().trim();
      if (dName && combinedSearchText.includes(dName)) {
        return {
          id: d.id,
          name: d.name,
          city: d.name,
          startDate: d.startDate || trip.startDate,
          endDate: d.endDate || trip.endDate
        };
      }
    }
  }

  // 2. Check if a specific destination was mentioned in the user query / context
  const extracted = extractDestinationFromText(contextText);
  if (extracted) {
    // Check if extracted destination matches existing registered destination
    if (Array.isArray(destinations) && destinations.length > 0) {
      const match = destinations.find(d => {
        const dName = (d.name || '').toLowerCase().trim();
        const ext = extracted.toLowerCase().trim();
        return dName === ext || dName.includes(ext) || ext.includes(dName);
      });
      if (match) {
        return {
          id: match.id,
          name: match.name,
          city: match.name,
          startDate: match.startDate || trip.startDate,
          endDate: match.endDate || trip.endDate
        };
      }
    }

    // Check if primary trip.destination matches
    if (trip.destination && (trip.destination.toLowerCase().includes(extracted.toLowerCase()) || extracted.toLowerCase().includes(trip.destination.toLowerCase()))) {
      return {
        id: `dest_${trip.destination.toLowerCase()}`,
        name: trip.destination,
        city: trip.destination,
        startDate: trip.startDate || new Date().toISOString().split('T')[0],
        endDate: trip.endDate || new Date().toISOString().split('T')[0]
      };
    }

    // Explicit new destination from user query (e.g. Netravati)
    return {
      id: `dest_${extracted.toLowerCase().replace(/\s+/g, '_')}`,
      name: extracted,
      city: extracted,
      isNew: true,
      startDate: trip.startDate || new Date().toISOString().split('T')[0],
      endDate: trip.endDate || new Date().toISOString().split('T')[0]
    };
  }

  // 3. Check activeDestination
  if (activeDestination) {
    const activeMatch = destinations.find(
      d => (d.name || '').toLowerCase().trim() === activeDestination.toLowerCase().trim()
    );
    if (activeMatch) {
      return {
        id: activeMatch.id,
        name: activeMatch.name,
        city: activeMatch.name,
        startDate: activeMatch.startDate || trip.startDate,
        endDate: activeMatch.endDate || trip.endDate
      };
    }
    return {
      id: `dest_${activeDestination.toLowerCase().replace(/\s+/g, '_')}`,
      name: activeDestination,
      city: activeDestination,
      startDate: trip.startDate || new Date().toISOString().split('T')[0],
      endDate: trip.endDate || new Date().toISOString().split('T')[0]
    };
  }

  // 4. Default to first destination in the multi-destination list
  if (Array.isArray(destinations) && destinations[0]) {
    return {
      id: destinations[0].id,
      name: destinations[0].name,
      city: destinations[0].name,
      startDate: destinations[0].startDate || trip.startDate,
      endDate: destinations[0].endDate || trip.endDate
    };
  }

  // 5. Fallback to primary trip destination
  const primaryName = trip.destination || 'Trip';
  return {
    id: `dest_${primaryName.toLowerCase()}`,
    name: primaryName,
    city: primaryName,
    startDate: trip.startDate || new Date().toISOString().split('T')[0],
    endDate: trip.endDate || new Date().toISOString().split('T')[0]
  };
}

/**
 * Determines an available day, date, and time slot without overwriting,
 * deleting, or moving any existing activities.
 */
export function calculateAvailableSlot(targetDest = {}, itinerary = []) {
  const destName = (targetDest.name || targetDest.city || '').toLowerCase().trim();
  const startDateStr = targetDest.startDate;
  const endDateStr = targetDest.endDate;

  // Calculate duration in days for this destination
  let totalDays = 1;
  if (startDateStr && endDateStr) {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const diffMs = Math.abs(end - start);
      totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
    } catch (e) {
      totalDays = 1;
    }
  }

  // Standard activity time slots
  const STANDARD_SLOTS = [
    '10:00 AM',
    '02:30 PM',
    '05:30 PM',
    '07:30 PM'
  ];

  const safeItinerary = Array.isArray(itinerary) ? itinerary : [];

  // Filter activities belonging to this destination
  const destActivities = safeItinerary.filter(act => {
    const actCity = (act.city || act.destination || '').toLowerCase().trim();
    return !destName || actCity === destName || actCity.includes(destName) || destName.includes(actCity);
  });

  // Search each day for an unallocated time slot
  for (let dayNum = 1; dayNum <= Math.max(totalDays, 7); dayNum++) {
    const dayActivities = destActivities.filter(act => parseInt(act.day, 10) === dayNum);
    const takenTimes = dayActivities.map(act => (act.time || '').trim().toUpperCase());

    const openSlot = STANDARD_SLOTS.find(slot => !takenTimes.includes(slot.toUpperCase()));
    if (openSlot) {
      let actDate = startDateStr || new Date().toISOString().split('T')[0];
      if (startDateStr) {
        try {
          const d = new Date(startDateStr);
          d.setDate(d.getDate() + (dayNum - 1));
          actDate = d.toISOString().split('T')[0];
        } catch (e) {}
      }
      return {
        day: dayNum,
        time: openSlot,
        date: actDate
      };
    }
  }

  // If all standard slots are populated, append as evening/next activity on Day 1
  return {
    day: 1,
    time: '11:30 AM',
    date: startDateStr || new Date().toISOString().split('T')[0]
  };
}

/**
 * Infers appropriate activity category for matching and safety correlation
 */
export function determineCategory(name = '', desc = '') {
  const text = `${name} ${desc}`.toLowerCase();
  if (text.includes('beach') || text.includes('coast') || text.includes('surf') || text.includes('waterfront')) return 'Beach';
  if (text.includes('temple') || text.includes('church') || text.includes('mosque') || text.includes('shrine') || text.includes('cathedral')) return 'Religious';
  if (text.includes('food') || text.includes('restaurant') || text.includes('cafe') || text.includes('dining') || text.includes('cuisine') || text.includes('eatery')) return 'Food';
  if (text.includes('trek') || text.includes('hike') || text.includes('adventure') || text.includes('peak') || text.includes('summit')) return 'Adventure';
  if (text.includes('garden') || text.includes('park') || text.includes('falls') || text.includes('waterfall') || text.includes('nature') || text.includes('lake') || text.includes('estate') || text.includes('tea')) return 'Nature';
  if (text.includes('museum') || text.includes('fort') || text.includes('palace') || text.includes('heritage') || text.includes('monument') || text.includes('historic')) return 'Historical';
  if (text.includes('mall') || text.includes('bazaar') || text.includes('market') || text.includes('shopping')) return 'Shopping';
  return 'Sightseeing';
}
