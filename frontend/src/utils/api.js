/**
 * SafeVoyage Unified API Client
 * Passes Authorization & x-user-id for strict User Data Isolation
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('safevoyage_token');
  const userJson = localStorage.getItem('safevoyage_auth_user');
  let userId = '';
  if (userJson) {
    try {
      const parsed = JSON.parse(userJson);
      userId = parsed?.id || '';
    } catch (e) {}
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[API Request Error ${endpoint}]`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  // Profile
  getProfile: () => request('/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Travellers
  getTravellers: () => request('/travellers'),
  addTraveller: (data) => request('/travellers', { method: 'POST', body: JSON.stringify(data) }),
  updateTraveller: (id, data) => request(`/travellers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTraveller: (id) => request(`/travellers/${id}`, { method: 'DELETE' }),

  // Trip & Multiple Destinations
  getTrip: () => request('/trip'),
  updateTrip: (data) => request('/trip', { method: 'PUT', body: JSON.stringify(data) }),
  createTrip: (data) => request('/trip', { method: 'POST', body: JSON.stringify(data) }),
  getDestinations: () => request('/trip/destinations'),
  addDestination: (data) => request('/trip/destinations', { method: 'POST', body: JSON.stringify(data) }),
  updateDestinationItem: (id, data) => request(`/trip/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDestinationItem: (id) => request(`/trip/destinations/${id}`, { method: 'DELETE' }),

  // Itinerary
  getItinerary: (city) => request(city ? `/itinerary?city=${encodeURIComponent(city)}` : '/itinerary'),
  addActivity: (data) => request('/itinerary', { method: 'POST', body: JSON.stringify(data) }),
  updateActivity: (id, data) => request(`/itinerary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteActivity: (id) => request(`/itinerary/${id}`, { method: 'DELETE' }),
  duplicateActivity: (id) => request(`/itinerary/duplicate/${id}`, { method: 'POST' }),
  matchItinerary: () => request('/itinerary/match'),

  // Alerts
  getAlerts: (city) => request(city ? `/alerts?city=${encodeURIComponent(city)}` : '/alerts'),
  getAffectedAlerts: () => request('/alerts/affected'),
  createAlert: (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  createAdvisory: (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  getDestinationSafety: (city) => request(`/alerts/destination-safety?city=${encodeURIComponent(city || '')}`),

  // Weather
  getWeather: (city) => request(`/weather?city=${encodeURIComponent(city || '')}`),

  // Emergency SOS & Fast2SMS
  getEmergencyStatus: () => request('/emergency/status'),
  getSmsStatus: () => request('/emergency/sms-status'),
  getMapPoints: (city) => request(`/emergency/map-points?city=${encodeURIComponent(city || '')}`),
  activateSOS: (data) => request('/emergency/sos', { method: 'POST', body: JSON.stringify(data) }),
  stopSOS: () => request('/emergency/stop', { method: 'POST' }),
  updateLocation: (data) => request('/emergency/location', { method: 'POST', body: JSON.stringify(data) }),
  broadcastLocation: (data) => request('/emergency/broadcast-location', { method: 'POST', body: JSON.stringify(data) }),
  sendDirectSMS: (data) => request('/notifications/sms', { method: 'POST', body: JSON.stringify(data) }),

  // Google Routes API
  computeRoute: (data) => request('/routes/compute', { method: 'POST', body: JSON.stringify(data) }),

  // Contacts
  getContacts: () => request('/contacts'),
  addContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // AI Assistant
  askAI: (message, history, context) => request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, context })
  })
};
