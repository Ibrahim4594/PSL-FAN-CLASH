import { NextResponse } from 'next/server';
import { generateAIMatchAnalysis } from '@/lib/ai-agent';

/**
 * AI Match Analysis API — powered by Claude Sonnet.
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 * Falls back to local heuristic engine if not configured.
 *
 * Usage: GET /api/analysis?teamA=LHR&teamB=KAR
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamA = searchParams.get('teamA')?.toUpperCase() || 'LHR';
  const teamB = searchParams.get('teamB')?.toUpperCase() || 'KAR';

  // Optionally fetch weather for the venue
  let weather: { temperature: number; humidity: number; precipitation: number } | undefined;
  try {
    const weatherRes = await fetch(
      `${new URL(request.url).origin}/api/weather?team=${teamA}`,
      { next: { revalidate: 3600 } }
    );
    if (weatherRes.ok) {
      const wd = await weatherRes.json();
      weather = {
        temperature: wd.weather.temperature,
        humidity: wd.weather.humidity,
        precipitation: wd.weather.precipitation,
      };
    }
  } catch {
    // Weather fetch failed — proceed without it
  }

  const analysis = await generateAIMatchAnalysis(teamA, teamB, weather);

  return NextResponse.json(analysis);
}
