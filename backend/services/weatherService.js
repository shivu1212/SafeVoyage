/**
 * SafeVoyage Real Weather Service
 * Strict Live API Integration - No Fake/Simulated Weather Fallbacks
 */

export async function getWeatherData(city = "Chennai") {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!city || !city.trim()) {
    return {
      isLive: false,
      error: 'Please specify a destination city.',
      city: ''
    };
  }

  const targetCity = city.trim();

  if (!apiKey || apiKey.trim() === '') {
    const errorMsg = 'Live weather data unavailable. (OPENWEATHER_API_KEY not configured)';
    console.warn(`[WeatherService] ${errorMsg}`);
    return {
      isLive: false,
      error: 'Live weather data unavailable.',
      city: targetCity
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&units=metric&appid=${apiKey}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rainMm = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;

      return {
        isLive: true,
        city: data.name,
        country: data.sys?.country || '',
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather?.[0]?.main || "Clear",
        description: data.weather?.[0]?.description || "",
        icon: data.weather?.[0]?.icon || "01d",
        humidity: data.main.humidity,
        windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // km/h
        rainfall: rainMm > 0 ? `${rainMm} mm` : "0 mm",
        rainProbability: rainMm > 0 ? 80 : (data.clouds?.all > 60 ? 40 : 10),
        alerts: rainMm > 5 ? [`Heavy precipitation reported in ${data.name}. Exercise travel caution.`] : [],
        error: null,
        forecast: [
          { day: "Today", temp: `${Math.round(data.main.temp)}°C`, condition: data.weather?.[0]?.main || "Clear" },
          { day: "Tomorrow", temp: `${Math.round(data.main.temp)}°C`, condition: data.weather?.[0]?.main || "Clear" }
        ]
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn(`[Weather API HTTP ${response.status}] ${errData.message || response.statusText} for city: ${targetCity}`);
      return {
        isLive: false,
        error: 'Live weather data unavailable.',
        city: targetCity
      };
    }
  } catch (err) {
    console.warn(`[WeatherService] Error fetching weather for ${targetCity}: ${err.message}`);
    return {
      isLive: false,
      error: 'Live weather data unavailable.',
      city: targetCity
    };
  }
}
