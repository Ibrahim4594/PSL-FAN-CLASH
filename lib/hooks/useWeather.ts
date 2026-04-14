'use client';

import { useState, useEffect } from 'react';

export interface WeatherData {
  stadium: string;
  city: string;
  ground: string;
  coordinates: { lat: number; lng: number };
  weather: {
    temperature: number;
    temperatureMax: number;
    temperatureMin: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    unit: { temp: string; wind: string; precip: string };
  };
  analysis: {
    condition: string;
    icon: string;
    cricketImpact: string;
    rainRisk: 'low' | 'moderate' | 'high';
  };
  source: string;
  dataRange: string;
}

const cache = new Map<string, { data: WeatherData; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches NASA POWER weather data for a PSL team's home stadium.
 * Pass the team short code (LHR, KAR, ISL, etc.).
 */
export function useWeather(teamCode?: string) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamCode) return;

    const key = teamCode.toUpperCase();
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/weather?team=${key}`)
      .then((res) => {
        if (!res.ok) throw new Error('Weather fetch failed');
        return res.json();
      })
      .then((json: WeatherData) => {
        cache.set(key, { data: json, ts: Date.now() });
        setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [teamCode]);

  return { weather: data, isLoading, error };
}
