/**
 * PSL Fan Clash — AI Match Analysis Agent
 *
 * Uses Claude Sonnet API to generate cricket-analyst-quality match predictions.
 * Combines team stats, head-to-head records, and NASA weather data to produce
 * natural language reasoning for each PSL matchup.
 *
 * Requires: ANTHROPIC_API_KEY in environment variables.
 * Falls back to local heuristic engine if API key is not configured.
 */

import { generateMatchAnalysis as localAnalysis } from './match-analysis';

interface AIAnalysisResult {
  favoredTeam: string;
  favoredShort: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  winProbability: [number, number];
  reasoning: string;
  keyBattle: string;
  weatherImpact: string;
  source: 'claude-sonnet' | 'local-heuristic';
}

/**
 * Generates match analysis using Claude Sonnet API.
 *
 * The agent receives team profiles, H2H records, and live NASA weather data,
 * then produces cricket-analyst-quality reasoning that references specific
 * players, match conditions, and tactical implications.
 *
 * @param teamA - Home team short code (e.g., "LHR")
 * @param teamB - Away team short code (e.g., "KAR")
 * @param weather - NASA POWER API weather data for the match venue
 * @returns AI-generated match analysis with win probabilities and reasoning
 */
export async function generateAIMatchAnalysis(
  teamA: string,
  teamB: string,
  weather?: { temperature: number; humidity: number; precipitation: number }
): Promise<AIAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fall back to local heuristic if no API key configured
  if (!apiKey) {
    const local = localAnalysis(teamA, teamB, weather);
    return {
      ...local,
      source: 'local-heuristic',
    };
  }

  const teamProfiles = getTeamContext(teamA, teamB);
  const weatherContext = weather
    ? `Stadium conditions: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.precipitation}mm precipitation.`
    : 'No weather data available.';

  const prompt = `You are a professional cricket analyst covering Pakistan Super League (PSL) Season 11.

Analyze this upcoming match and provide a detailed prediction:

MATCH: ${teamProfiles.teamAName} (${teamA}) vs ${teamProfiles.teamBName} (${teamB})

TEAM A — ${teamProfiles.teamAName}:
- Season Win Rate: ${teamProfiles.teamAWinRate}%
- Recent Form: ${teamProfiles.teamAForm}
- Key Players: ${teamProfiles.teamAPlayers.join(', ')}
- Captain: ${teamProfiles.teamACaptain}

TEAM B — ${teamProfiles.teamBName}:
- Season Win Rate: ${teamProfiles.teamBWinRate}%
- Recent Form: ${teamProfiles.teamBForm}
- Key Players: ${teamProfiles.teamBPlayers.join(', ')}
- Captain: ${teamProfiles.teamBCaptain}

HEAD-TO-HEAD: ${teamProfiles.h2h}

WEATHER: ${weatherContext}

Provide your analysis in this exact JSON format:
{
  "favoredTeam": "full team name",
  "favoredShort": "3-letter code",
  "confidence": "LOW" or "MEDIUM" or "HIGH",
  "winProbabilityA": number between 30-70,
  "winProbabilityB": number between 30-70 (must sum to 100 with A),
  "reasoning": "2-3 paragraphs of analyst-quality reasoning. Reference specific players by name. Discuss how weather affects the match. Mention tactical implications. Sound like a real cricket commentator, not an AI.",
  "keyBattle": "Player A vs Player B — the matchup that decides the game",
  "weatherImpact": "1-2 sentences on how conditions affect play"
}

Be specific. Reference player names, bowling styles, batting positions. This should read like it came from a cricket expert who watches every PSL match.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) throw new Error('Empty response');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      favoredTeam: parsed.favoredTeam,
      favoredShort: parsed.favoredShort,
      confidence: parsed.confidence,
      winProbability: [parsed.winProbabilityA, parsed.winProbabilityB],
      reasoning: parsed.reasoning,
      keyBattle: parsed.keyBattle,
      weatherImpact: parsed.weatherImpact,
      source: 'claude-sonnet',
    };
  } catch {
    // Graceful fallback to local heuristic on any API failure
    const local = localAnalysis(teamA, teamB, weather);
    return {
      ...local,
      source: 'local-heuristic',
    };
  }
}

/**
 * Builds team context from hardcoded PSL 11 data for the AI prompt.
 */
function getTeamContext(teamA: string, teamB: string) {
  const teams: Record<string, {
    name: string; winRate: number; form: string;
    players: string[]; captain: string;
  }> = {
    ISL: { name: 'Islamabad United', winRate: 62, form: 'WWLWW', players: ['Shadab Khan', 'Azam Khan', 'Naseem Shah'], captain: 'Shadab Khan' },
    KAR: { name: 'Karachi Kings', winRate: 45, form: 'LWLLW', players: ['Babar Azam', 'Imad Wasim', 'Mohammad Amir'], captain: 'Babar Azam' },
    LHR: { name: 'Lahore Qalandars', winRate: 68, form: 'WWWLW', players: ['Shaheen Shah Afridi', 'Fakhar Zaman', 'Haris Rauf'], captain: 'Shaheen Shah Afridi' },
    MUL: { name: 'Multan Sultans', winRate: 58, form: 'WLWWL', players: ['Mohammad Rizwan', 'Rilee Rossouw', 'Usama Mir'], captain: 'Mohammad Rizwan' },
    PSH: { name: 'Peshawar Zalmi', winRate: 55, form: 'WLWLW', players: ['Wahab Riaz', 'Kamran Akmal', 'Shoaib Malik'], captain: 'Wahab Riaz' },
    QUE: { name: 'Quetta Gladiators', winRate: 42, form: 'LLWLW', players: ['Sarfaraz Ahmed', 'Jason Roy', 'Naseem Shah'], captain: 'Sarfaraz Ahmed' },
    HYD: { name: 'Hyderabad Kingsmen', winRate: 48, form: 'WLWLL', players: ['Shan Masood', 'Mohammad Nawaz', 'Ihsanullah'], captain: 'Shan Masood' },
    RWP: { name: 'Rawalpindi Pindiz', winRate: 40, form: 'LLWLL', players: ['Hasan Ali', 'Saim Ayub', 'Faheem Ashraf'], captain: 'Hasan Ali' },
  };

  const a = teams[teamA] || teams['LHR'];
  const b = teams[teamB] || teams['KAR'];

  return {
    teamAName: a.name, teamAWinRate: a.winRate, teamAForm: a.form,
    teamAPlayers: a.players, teamACaptain: a.captain,
    teamBName: b.name, teamBWinRate: b.winRate, teamBForm: b.form,
    teamBPlayers: b.players, teamBCaptain: b.captain,
    h2h: `${teamA} and ${teamB} have a competitive head-to-head record in PSL history.`,
  };
}
