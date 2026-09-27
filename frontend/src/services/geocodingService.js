/**
 * SafeVoyage Geocoding & Places Service
 * Integrates Google Maps JavaScript API, Places API, and Geocoding API
 */

export function getGoogleMapsUrl(query, lat = null, lng = null) {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getShareLocationPayload(lat, lng, destination, placeName) {
  const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const text = `🚨 SAFEVOYAGE SOS EMERGENCY: My live location in ${destination} (${placeName || 'GPS Location'}): ${mapUrl}`;
  return {
    title: 'SafeVoyage Emergency SOS Alert',
    text,
    url: mapUrl
  };
}

/**
 * Reverse-geocodes coordinates (lat, lng) to a human-readable street/area address
 * using the Google Maps Geocoding API (window.google.maps.Geocoder)
 */
export async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return null;

  // 1. Client-side Google Maps Geocoder if Google Maps JS is loaded
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } });
      if (response.results && response.results.length > 0) {
        // Return neighborhood / formatted address
        const bestResult = response.results[0];
        return bestResult.formatted_address;
      }
    } catch (err) {
      console.warn('[Google Geocoder Warning]', err.message);
    }
  }

  // 2. Direct Geocoding API fallback via HTTP
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        return data.results[0].formatted_address;
      }
    } catch (err) {
      console.warn('[Google Geocoding HTTP Warning]', err.message);
    }
  }

  // 3. Fallback to OpenStreetMap / Nominatim reverse geocode
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(nomUrl, { headers: { 'Accept': 'application/json', 'User-Agent': 'SafeVoyage-Travel-Sentinel/1.0' } });
    const data = await res.json();
    if (data?.display_name) {
      return data.display_name;
    }
  } catch (err) {
    console.warn('[Nominatim Reverse Geocoding Error]', err.message);
  }

  return null;
}

/**
 * Forward-geocodes a place name or address to { lat, lng, formattedAddress, name }
 * 1. Uses client-side Google Maps Geocoder if Google Maps JS is loaded
 * 2. Uses Google Maps Geocoding API via HTTP
 * 3. Falls back to OpenStreetMap / Nominatim geocoding (ensures 100% availability)
 */
export async function forwardGeocode(query, nearCoords = null) {
  if (!query || typeof query !== 'string') return null;
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  // 1. Client-side Google Maps Geocoder if Google Maps JS is loaded
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const request = { address: cleanQuery };
      if (nearCoords?.lat && nearCoords?.lng) {
        request.bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(nearCoords.lat - 0.5, nearCoords.lng - 0.5),
          new window.google.maps.LatLng(nearCoords.lat + 0.5, nearCoords.lng + 0.5)
        );
      }
      const response = await geocoder.geocode(request);
      if (response.results && response.results.length > 0) {
        const best = response.results[0];
        return {
          lat: best.geometry.location.lat(),
          lng: best.geometry.location.lng(),
          formattedAddress: best.formatted_address,
          name: cleanQuery,
          source: 'Google Geocoding'
        };
      }
    } catch (err) {
      console.warn('[Google Geocoder Forward Warning]', err.message);
    }
  }

  // 2. Direct Geocoding API fallback via HTTP
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${apiKey}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const best = data.results[0];
        return {
          lat: best.geometry.location.lat,
          lng: best.geometry.location.lng,
          formattedAddress: best.formatted_address,
          name: cleanQuery,
          source: 'Google Maps API'
        };
      }
    } catch (err) {
      console.warn('[Google Geocoding HTTP Warning]', err.message);
    }
  }

  // 3. Fallback to OpenStreetMap / Nominatim (ensures high availability)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1`;
    const res = await fetch(nomUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SafeVoyage-Travel-Sentinel/1.0' }
    });
    const list = await res.json();
    if (list && list.length > 0) {
      return {
        lat: parseFloat(list[0].lat),
        lng: parseFloat(list[0].lon),
        formattedAddress: list[0].display_name,
        name: cleanQuery,
        source: 'Geocoding Service'
      };
    }
  } catch (err) {
    console.warn('[Nominatim Geocoding Error]', err.message);
  }

  return null;
}

/**
 * Searches nearby emergency facilities (hospitals, police stations)
 * using the Google Places API (window.google.maps.places.PlacesService)
 */
export function searchNearbyPlaces(mapInstance, { lat, lng, type = 'hospital', radius = 3000 }) {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService || !mapInstance) {
      return resolve([]);
    }

    try {
      const service = new window.google.maps.places.PlacesService(mapInstance);
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius,
        type
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formatted = results.slice(0, 10).map((place) => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            rating: place.rating,
            isOpen: place.opening_hours?.open_now,
            type: type === 'police' ? 'police' : 'hospital',
            status: place.business_status || 'Open'
          }));
          resolve(formatted);
        } else {
          resolve([]);
        }
      });
    } catch (err) {
      console.warn('[Google Places Search Error]', err);
      resolve([]);
    }
  });
}
