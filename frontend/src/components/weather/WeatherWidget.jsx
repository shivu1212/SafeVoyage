import React from 'react';
import {
  CloudRain,
  Wind,
  Droplets,
  Sun,
  AlertTriangle,
  Compass,
  Gauge,
  Info
} from 'lucide-react';

export default function WeatherWidget({ weather, city = 'Goa' }) {
  const displayCity = weather?.city || city || 'Goa';
  const data = weather || {
    city: displayCity,
    isLive: false,
    temperature: 28,
    feelsLike: 31,
    condition: 'Humid & Partly Cloudy',
    description: `Seasonal coastal breeze in ${displayCity}`,
    humidity: 78,
    windSpeed: 20,
    rainProbability: 25,
    uvIndex: 7,
    airQuality: 'Good (AQI 45)',
    warning: null,
    forecast: [
      { day: 'Today', temp: '28°C / 24°C', condition: 'Partly Cloudy', rain: '20%', wind: '20 km/h' },
      { day: 'Tomorrow', temp: '29°C / 25°C', condition: 'Breezy & Fair', rain: '30%', wind: '22 km/h' },
      { day: 'Day 3', temp: '28°C / 23°C', condition: 'Scattered Clouds', rain: '15%', wind: '18 km/h' }
    ]
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header & Warning */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sun size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Live Weather & Atmospheric Safety — {data.city}
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Coastal meteorological telemetry
          </p>
        </div>

        <span className="badge badge-caution" style={{ fontSize: '0.75rem' }}>
          {data.isLive ? '📡 Live OpenWeather' : '🌦️ Demo Weather Mode'}
        </span>
      </div>

      {/* Advisory Banner if active */}
      {data.warning && (
        <div
          style={{
            backgroundColor: 'var(--caution-bg)',
            border: '1px solid var(--caution-border)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--caution-text)', lineHeight: 1.4 }}>
            <strong>Coastal Weather Advisory:</strong> {data.warning}
          </div>
        </div>
      )}

      {/* Current Conditions Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.85rem',
          backgroundColor: 'var(--bg-subtle)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Temperature</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
            {data.temperature}°C
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Feels like {data.feelsLike}°C</div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Droplets size={13} /> Humidity
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.humidity}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High coastal moisture</div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wind size={13} /> Wind Speed
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.windSpeed} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gusts up to 32 km/h</div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CloudRain size={13} /> Rain Probability
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.rainProbability}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Isolated showers</div>
        </div>
      </div>

      {/* 4-Day Trip Window Forecast */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
          4-DAY TRIP FORECAST
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem' }}>
          {data.forecast?.map((f, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{f.day}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                {f.temp}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.condition}</div>
              <div style={{ fontSize: '0.7rem', color: '#3B82F6', marginTop: '4px' }}>
                💧 Rain {f.rain}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
