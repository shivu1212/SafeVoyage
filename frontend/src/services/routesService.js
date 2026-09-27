/**
 * SafeVoyage Frontend Routes Service
 * Integrates Google Maps Routes API v2 for live route computation,
 * safe evacuation routes, ETA calculation, and polyline visualization.
 */

import { api } from '../utils/api.js';

export function decodePolyline(encoded) {
  if (!encoded) return [];
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    poly.push({
      lat: parseFloat((lat / 1e5).toFixed(6)),
      lng: parseFloat((lng / 1e5).toFixed(6))
    });
  }
  return poly;
}

/**
 * Computes live route from origin to destination via backend Routes API
 */
export async function computeSafeRoute({
  origin,
  destination,
  travelMode = 'DRIVE',
  routingPreference = 'TRAFFIC_AWARE'
}) {
  try {
    const res = await api.computeRoute({
      origin,
      destination,
      travelMode,
      routingPreference
    });
    return res;
  } catch (err) {
    console.warn('[computeSafeRoute Error]', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Generates official Google Maps turn-by-turn navigation URL
 */
export function getGoogleNavigationUrl(origin, destination, travelMode = 'driving') {
  const origStr = typeof origin === 'string' ? encodeURIComponent(origin) : `${origin.lat},${origin.lng}`;
  const destStr = typeof destination === 'string' ? encodeURIComponent(destination) : `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${destStr}&travelmode=${travelMode}`;
}
