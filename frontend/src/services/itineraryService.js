/**
 * SafeVoyage Itinerary Service
 * Unified frontend service layer for managing dynamic activities
 */

const BASE_URL = '/api';

export async function fetchItinerary() {
  try {
    const res = await fetch(`${BASE_URL}/itinerary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.itinerary || [];
  } catch (err) {
    console.warn('[itineraryService fetchItinerary Warning]', err.message);
    return null;
  }
}

export async function createActivity(activityData) {
  try {
    const res = await fetch(`${BASE_URL}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[itineraryService createActivity Error]', err);
    throw err;
  }
}

export async function updateActivity(id, activityData) {
  try {
    const res = await fetch(`${BASE_URL}/itinerary/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[itineraryService updateActivity Error]', err);
    throw err;
  }
}

export async function deleteActivity(id) {
  try {
    const res = await fetch(`${BASE_URL}/itinerary/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[itineraryService deleteActivity Error]', err);
    throw err;
  }
}
