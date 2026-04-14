'use client';

import { useWeather } from '@/lib/hooks/useWeather';
import { useLocale } from '@/lib/locale-context';

const RAIN_RISK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'rgba(52,199,89,0.1)', text: 'rgba(52,199,89,0.7)', label: 'LOW' },
  moderate: { bg: 'rgba(255,204,0,0.1)', text: 'rgba(255,204,0,0.7)', label: 'MODERATE' },
  high: { bg: 'rgba(255,59,48,0.1)', text: 'rgba(255,59,48,0.7)', label: 'HIGH' },
};

/**
 * Displays NASA POWER weather data for a PSL match venue.
 * Pass the home team's short code (e.g., "LHR").
 */
export function WeatherCard({ teamCode }: { teamCode: string }) {
  const { t } = useLocale();
  const { weather, isLoading, error } = useWeather(teamCode);

  if (isLoading) {
    return (
      <div className="glass-card" style={{ padding: 20, minHeight: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
            Loading weather…
          </span>
        </div>
        <div className="skeleton-pulse" style={{ height: 14, width: '60%', borderRadius: 2, marginBottom: 8 }} />
        <div className="skeleton-pulse" style={{ height: 14, width: '80%', borderRadius: 2 }} />
      </div>
    );
  }

  if (error || !weather) return null;

  const risk = RAIN_RISK_STYLES[weather.analysis.rainRisk] ?? RAIN_RISK_STYLES.low;

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{weather.analysis.icon}</span>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
              {t('weather.condition')}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f7f8f8' }}>
              {weather.ground}, {weather.city}
            </p>
          </div>
        </div>
        {/* Rain risk badge */}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
          padding: '3px 8px', borderRadius: 4,
          background: risk.bg, color: risk.text,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {t('weather.rain_risk')}: {risk.label}
        </span>
      </div>

      {/* Weather data grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <WeatherStat label={t('weather.temp')} value={`${weather.weather.temperature}°C`} />
        <WeatherStat label={t('weather.high_low')} value={`${Math.round(weather.weather.temperatureMax)}° / ${Math.round(weather.weather.temperatureMin)}°`} />
        <WeatherStat label={t('weather.humidity')} value={`${weather.weather.humidity}%`} />
        <WeatherStat label={t('weather.wind')} value={`${weather.weather.windSpeed} m/s`} />
      </div>

      {/* Cricket impact analysis */}
      <div style={{
        padding: '12px 14px', borderRadius: 6,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          {weather.analysis.cricketImpact}
        </p>
      </div>

      {/* NASA badge */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'rgba(255,255,255,0.15)', marginTop: 12,
        textTransform: 'uppercase', letterSpacing: '0.15em',
      }}>
        {t('weather.powered_by')} &middot; {weather.dataRange}
      </p>
    </div>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: '#f7f8f8', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
        {label}
      </p>
    </div>
  );
}

/**
 * Compact weather badge for match cards in the grid.
 * Shows just the icon, temp, and rain risk.
 */
export function WeatherBadge({ teamCode }: { teamCode: string }) {
  const { weather, isLoading } = useWeather(teamCode);

  if (isLoading || !weather) return null;

  const risk = RAIN_RISK_STYLES[weather.analysis.rainRisk] ?? RAIN_RISK_STYLES.low;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 4,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 12 }}>{weather.analysis.icon}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
        {Math.round(weather.weather.temperature)}°C
      </span>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: risk.text,
      }} />
    </div>
  );
}
