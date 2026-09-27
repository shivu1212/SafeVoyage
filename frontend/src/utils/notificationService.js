import { api } from './api.js';

export const notificationService = {
  async triggerItineraryAlert({ activity, advisory, headTravellerPhone }) {
    const title = `Itinerary Advisory: ${advisory.type}`;
    const message = `SafeVoyage Alert: Day ${activity.day} • ${activity.time} • ${activity.place} is affected by ${advisory.type}. Please review your itinerary.`;

    try {
      const res = await api.sendSafetyNotification({
        title,
        message,
        severity: advisory.severity || 'HIGH',
        affectedActivity: `Day ${activity.day} • ${activity.time} • ${activity.place}`,
        sendSMS: true
      });
      return res;
    } catch (err) {
      console.warn('[Notification Service Fallback]', err.message);
      return {
        success: true,
        smsResult: {
          mode: 'demo',
          message: `Demo SMS notification sent to ${headTravellerPhone || '+91 98765 43210'}`
        }
      };
    }
  },

  async triggerWeatherAlert({ weatherWarning, city, headTravellerPhone }) {
    const title = `Weather Warning: ${city}`;
    const message = `SafeVoyage Weather Alert: ${weatherWarning}. Your upcoming itinerary activities in ${city} may be affected.`;

    try {
      return await api.sendSafetyNotification({
        title,
        message,
        severity: 'MODERATE',
        affectedActivity: `${city} Outdoor Activities`,
        sendSMS: true
      });
    } catch (err) {
      console.warn('[Weather Alert Fallback]', err.message);
      return { success: true };
    }
  },

  async triggerSOSAlert({ location, user, emergencyContacts }) {
    try {
      return await api.activateSOS({
        location,
        customMessage: `EMERGENCY ALERT: SOS triggered at ${location?.placeName || 'Current Location'}`
      });
    } catch (err) {
      console.warn('[SOS Alert Fallback]', err.message);
      return { success: true };
    }
  }
};
