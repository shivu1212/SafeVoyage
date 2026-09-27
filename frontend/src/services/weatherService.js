/**
 * SafeVoyage Weather Service
 * Frontend service layer for retrieving meteorological telemetry and advisories
 */

const BASE_URL = '/api';

export async function getWeather(destination = 'Chennai', isDemoMode = false) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(
      `${BASE_URL}/weather?city=${encodeURIComponent(destination)}&demo=${isDemoMode ? 'true' : 'false'}`,
      {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Weather API error: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.weather) {
      return {
        ...data.weather,
        isDemoMode: !data.weather.isLive
      };
    }

    throw new Error('Malformed weather response');
  } catch (err) {
    console.error('[weatherService Error]', err);

    const errorMessage = err.name === 'AbortError'
      ? 'Weather service request timed out.'
      : 'Live weather unavailable — please verify WEATHER_API_KEY.';

    // Return structured failure object without fake live weather data
    return {
      isLive: false,
      isDemoMode: false,
      error: 'Live weather data unavailable.',
      city: destination,
      temperature: null,
      feelsLike: null,
      condition: 'Unavailable',
      description: 'Live weather data unavailable.',
      humidity: null,
      windSpeed: null,
      rainfall: null,
      rainProbability: null,
      uvIndex: null,
      airQuality: null,
      alerts: [],
      forecast: []
    };
  }
}
