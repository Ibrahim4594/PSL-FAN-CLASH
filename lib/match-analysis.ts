/**
 * PSL Fan Clash — AI Match Analysis Engine
 *
 * Generates cricket-analyst-quality reasoning for each matchup.
 * Uses: season stats, recent form, H2H records, key players, and NASA weather.
 * All data hardcoded — zero external API calls.
 */

interface TeamProfile {
  short: string;
  name: string;
  seasonWinRate: number;      // 0-100
  recentForm: string;         // e.g., "WWLWW"
  homeGround: string;
  city: string;
  keyPlayers: string[];       // top 3 players
  strengths: string[];
  weaknesses: string[];
  captainName: string;
}

interface H2HRecord {
  wins: [number, number];     // [teamA wins, teamB wins]
  lastResult: string;         // "LHR won by 23 runs"
}

interface MatchAnalysis {
  favoredTeam: string;
  favoredShort: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  winProbability: [number, number]; // [teamA %, teamB %]
  factors: { name: string; weight: string; teamA: string; teamB: string; advantage: 'A' | 'B' | 'EVEN' }[];
  reasoning: string;          // 2-3 paragraphs of analyst-quality text
  keyBattle: string;          // e.g., "Shaheen Afridi vs Babar Azam"
  weatherImpact: string;
}

const TEAM_PROFILES: Record<string, TeamProfile> = {
  ISL: {
    short: 'ISL', name: 'Islamabad United', seasonWinRate: 62, recentForm: 'WWLWW',
    homeGround: 'Rawalpindi Cricket Stadium', city: 'Rawalpindi',
    keyPlayers: ['Shadab Khan', 'Azam Khan', 'Naseem Shah'],
    strengths: ['Spin bowling depth', 'Middle-order power hitting', 'T20 experience'],
    weaknesses: ['Inconsistent top order', 'Death bowling under pressure'],
    captainName: 'Shadab Khan',
  },
  KAR: {
    short: 'KAR', name: 'Karachi Kings', seasonWinRate: 45, recentForm: 'LWLLW',
    homeGround: 'National Stadium', city: 'Karachi',
    keyPlayers: ['Babar Azam', 'Imad Wasim', 'Mohammad Amir'],
    strengths: ['Top-order batting with Babar Azam', 'Left-arm pace variety', 'Experienced campaigners'],
    weaknesses: ['Over-reliance on Babar', 'Weak lower middle order', 'Fielding lapses'],
    captainName: 'Babar Azam',
  },
  LHR: {
    short: 'LHR', name: 'Lahore Qalandars', seasonWinRate: 68, recentForm: 'WWWLW',
    homeGround: 'Gaddafi Stadium', city: 'Lahore',
    keyPlayers: ['Shaheen Shah Afridi', 'Fakhar Zaman', 'Haris Rauf'],
    strengths: ['Elite pace attack', 'Aggressive powerplay batting', 'Home crowd advantage at Gaddafi'],
    weaknesses: ['Middle-order collapses', 'Spin vulnerability on slow tracks'],
    captainName: 'Shaheen Shah Afridi',
  },
  MUL: {
    short: 'MUL', name: 'Multan Sultans', seasonWinRate: 58, recentForm: 'WLWWL',
    homeGround: 'Multan Cricket Stadium', city: 'Multan',
    keyPlayers: ['Mohammad Rizwan', 'Rilee Rossouw', 'Usama Mir'],
    strengths: ['Consistent batting from Rizwan', 'Strong spin attack', 'Disciplined bowling unit'],
    weaknesses: ['Slow scoring in powerplay', 'Over-dependence on top 3'],
    captainName: 'Mohammad Rizwan',
  },
  PSH: {
    short: 'PSH', name: 'Peshawar Zalmi', seasonWinRate: 55, recentForm: 'WLWLW',
    homeGround: 'Arbab Niaz Stadium', city: 'Peshawar',
    keyPlayers: ['Wahab Riaz', 'Kamran Akmal', 'Shoaib Malik'],
    strengths: ['T20 veterans', 'Big-match temperament', 'Pace bowling depth'],
    weaknesses: ['Aging squad', 'Fielding standards', 'Inconsistent middle overs'],
    captainName: 'Wahab Riaz',
  },
  QUE: {
    short: 'QUE', name: 'Quetta Gladiators', seasonWinRate: 42, recentForm: 'LLWLW',
    homeGround: 'Bugti Stadium', city: 'Quetta',
    keyPlayers: ['Sarfaraz Ahmed', 'Jason Roy', 'Naseem Shah'],
    strengths: ['Experienced captain in Sarfaraz', 'Explosive foreign imports', 'Pace bowling options'],
    weaknesses: ['Inconsistent batting lineup', 'Weak spin options', 'Poor record chasing'],
    captainName: 'Sarfaraz Ahmed',
  },
  HYD: {
    short: 'HYD', name: 'Hyderabad Kingsmen', seasonWinRate: 48, recentForm: 'WLWLL',
    homeGround: 'National Stadium', city: 'Karachi',
    keyPlayers: ['Shan Masood', 'Mohammad Nawaz', 'Ihsanullah'],
    strengths: ['All-round balance', 'Young fast bowling', 'Left-arm spin option'],
    weaknesses: ['New franchise finding form', 'Limited T20 depth', 'No home advantage yet'],
    captainName: 'Shan Masood',
  },
  RWP: {
    short: 'RWP', name: 'Rawalpindi Pindiz', seasonWinRate: 40, recentForm: 'LLWLL',
    homeGround: 'Rawalpindi Cricket Stadium', city: 'Rawalpindi',
    keyPlayers: ['Hasan Ali', 'Saim Ayub', 'Faheem Ashraf'],
    strengths: ['Pace bowling in home conditions', 'Young batting talent', 'All-rounder depth'],
    weaknesses: ['Inexperienced core', 'Death bowling leaks runs', 'Poor away record'],
    captainName: 'Hasan Ali',
  },
};

const H2H_RECORDS: Record<string, H2HRecord> = {
  'LHR-HYD': { wins: [3, 1], lastResult: 'LHR won by 23 runs in their last meeting' },
  'ISL-KAR': { wins: [5, 4], lastResult: 'ISL won by 6 wickets with 8 balls remaining' },
  'PSH-MUL': { wins: [4, 5], lastResult: 'MUL won by 14 runs defending 178' },
  'LHR-KAR': { wins: [6, 3], lastResult: 'LHR dominated with Shaheen taking 3/19' },
  'ISL-MUL': { wins: [4, 4], lastResult: 'Series perfectly tied — high stakes' },
  'PSH-QUE': { wins: [5, 3], lastResult: 'PSH won a last-ball thriller by 2 runs' },
  'LHR-ISL': { wins: [5, 5], lastResult: 'The fiercest rivalry in PSL — dead even' },
  'MUL-QUE': { wins: [4, 2], lastResult: 'MUL cruised with Rizwan hitting 78*(52)' },
};

function getH2H(a: string, b: string): H2HRecord {
  return H2H_RECORDS[`${a}-${b}`] || H2H_RECORDS[`${b}-${a}`] ||
    { wins: [2, 2], lastResult: 'Limited head-to-head data available' };
}

function getWeatherImpact(teamAShort: string, temp: number, humidity: number, precip: number): string {
  const teamA = TEAM_PROFILES[teamAShort];
  if (!teamA) return 'Standard conditions expected.';

  if (precip > 5) {
    return `Rain is a significant factor at ${teamA.homeGround}. If the match is reduced to 10-12 overs, power hitters gain disproportionate value. Duckworth-Lewis scenarios favor the team batting first. The outfield will be slow, making ground strokes harder to convert into boundaries.`;
  }
  if (humidity > 60) {
    return `Humidity at ${humidity}% at ${teamA.homeGround} will cause the ball to swing, particularly in the powerplay and death overs. Conventional swing with the new ball and reverse swing with the old ball will both be in play. Teams with quality pace attacks have a clear advantage in these conditions — this is where bowlers like ${teamA.keyPlayers[0]} can be devastating.`;
  }
  if (temp > 35) {
    return `Extreme heat at ${temp}°C in ${teamA.city} will test player fitness, especially in the field. Expect spinners to dominate the middle overs as the pitch dries out. Batting second becomes harder as dew is unlikely in these dry conditions. Teams should prioritize setting a total.`;
  }
  if (temp < 20) {
    return `Cool conditions at ${temp}°C will help the ball carry to the keeper and slips. Pace bowlers will find extra bounce and movement. The ball will stay harder for longer, benefiting seam bowling throughout the innings.`;
  }
  return `Conditions at ${teamA.homeGround} are fairly neutral at ${temp}°C with ${humidity}% humidity. Neither pacers nor spinners get significant assistance from the weather. This will be decided by batting quality and execution under pressure.`;
}

/**
 * Generates a full cricket-analyst-quality match analysis.
 * Call with both team short codes (e.g., "LHR", "HYD").
 */
export function generateMatchAnalysis(
  teamAShort: string,
  teamBShort: string,
  weather?: { temperature: number; humidity: number; precipitation: number }
): MatchAnalysis {
  const a = TEAM_PROFILES[teamAShort] || TEAM_PROFILES['LHR'];
  const b = TEAM_PROFILES[teamBShort] || TEAM_PROFILES['KAR'];
  const h2h = getH2H(teamAShort, teamBShort);

  // Factor calculations
  const formScore = (form: string) => {
    let score = 0;
    const chars = form.split('');
    chars.forEach((c, i) => { if (c === 'W') score += (i + 1); }); // Recent wins weighted more
    return score;
  };

  const aForm = formScore(a.recentForm);
  const bForm = formScore(b.recentForm);
  const aH2H = h2h.wins[0];
  const bH2H = h2h.wins[1];

  // Weighted score: Win Rate 40%, Form 30%, H2H 20%, Strength 10%
  const aScore = (a.seasonWinRate * 0.4) + (aForm / 15 * 100 * 0.3) + (aH2H / Math.max(aH2H + bH2H, 1) * 100 * 0.2) + (a.strengths.length / 3 * 100 * 0.1);
  const bScore = (b.seasonWinRate * 0.4) + (bForm / 15 * 100 * 0.3) + (bH2H / Math.max(aH2H + bH2H, 1) * 100 * 0.2) + (b.strengths.length / 3 * 100 * 0.1);

  const total = aScore + bScore;
  let aPct = Math.round((aScore / total) * 100);
  let bPct = 100 - aPct;

  // Weather adjustment
  if (weather && weather.humidity > 60 && a.strengths.some(s => s.toLowerCase().includes('pace'))) {
    aPct += 3; bPct -= 3;
  }
  if (weather && weather.humidity > 60 && b.strengths.some(s => s.toLowerCase().includes('pace'))) {
    bPct += 3; aPct -= 3;
  }

  const margin = Math.abs(aPct - bPct);
  const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = margin < 8 ? 'LOW' : margin < 18 ? 'MEDIUM' : 'HIGH';
  const favored = aPct >= bPct ? a : b;
  const underdog = aPct >= bPct ? b : a;

  // Build factors table
  const factors = [
    { name: 'Season Win Rate', weight: '40%', teamA: `${a.seasonWinRate}%`, teamB: `${b.seasonWinRate}%`, advantage: (a.seasonWinRate > b.seasonWinRate ? 'A' : a.seasonWinRate < b.seasonWinRate ? 'B' : 'EVEN') as 'A' | 'B' | 'EVEN' },
    { name: 'Recent Form', weight: '30%', teamA: a.recentForm, teamB: b.recentForm, advantage: (aForm > bForm ? 'A' : aForm < bForm ? 'B' : 'EVEN') as 'A' | 'B' | 'EVEN' },
    { name: 'Head-to-Head', weight: '20%', teamA: `${h2h.wins[0]} wins`, teamB: `${h2h.wins[1]} wins`, advantage: (h2h.wins[0] > h2h.wins[1] ? 'A' : h2h.wins[0] < h2h.wins[1] ? 'B' : 'EVEN') as 'A' | 'B' | 'EVEN' },
    { name: 'Team Strength', weight: '10%', teamA: a.strengths[0], teamB: b.strengths[0], advantage: (a.strengths.length >= b.strengths.length ? 'A' : 'B') as 'A' | 'B' },
  ];

  // Weather impact text
  const weatherText = weather
    ? getWeatherImpact(teamAShort, weather.temperature, weather.humidity, weather.precipitation)
    : `Standard conditions expected at the venue. No significant weather advantage for either side.`;

  // Generate analyst-quality reasoning
  const biggestFactor = factors.reduce((best, f) => parseFloat(f.weight) > parseFloat(best.weight) ? f : best);
  const keyBattle = `${a.keyPlayers[0]} vs ${b.keyPlayers[0]}`;

  let reasoning = '';

  // Paragraph 1: Overview and key matchup
  if (confidence === 'HIGH') {
    reasoning += `${favored.name} enter this fixture as clear favorites with a ${favored.seasonWinRate}% win rate this season. ${favored.captainName}'s side have been in commanding form, winning ${favored.recentForm.split('').filter(c => c === 'W').length} of their last 5 matches. The key matchup to watch will be ${keyBattle} — a contest that could define the outcome of this match. ${favored.name}'s ${favored.strengths[0].toLowerCase()} gives them a significant edge, particularly against ${underdog.name}'s known vulnerability in ${underdog.weaknesses[0].toLowerCase()}.`;
  } else if (confidence === 'MEDIUM') {
    reasoning += `This is a competitive fixture with ${favored.name} holding a slight edge. While their season record of ${favored.seasonWinRate}% gives them the statistical advantage, ${underdog.name} have the quality to cause an upset, particularly through ${underdog.keyPlayers[0]}. The battle between ${keyBattle} adds an extra layer of intrigue. Recent form suggests ${favored.recentForm.split('').filter(c => c === 'W').length > 3 ? 'momentum is firmly with ' + favored.short : 'both teams are finding their rhythm'}.`;
  } else {
    reasoning += `This promises to be a tightly contested encounter. Both ${a.name} and ${b.name} are evenly matched across key metrics, with win rates of ${a.seasonWinRate}% and ${b.seasonWinRate}% respectively. The head-to-head record of ${h2h.wins[0]}-${h2h.wins[1]} confirms how closely matched these sides are. ${h2h.lastResult}. The outcome could come down to individual brilliance — watch for ${keyBattle} as the decisive duel.`;
  }

  // Paragraph 2: Weather and conditions
  reasoning += `\n\n${weatherText}`;

  // Paragraph 3: Verdict
  reasoning += `\n\nThe numbers favor ${favored.name} at ${Math.max(aPct, bPct)}%, but cricket is a game of moments. ${underdog.captainName} will know that ${underdog.strengths[0].toLowerCase()} can turn this match on its head. For staking purposes, ${favored.short} offers the safer bet, but ${underdog.short} at ${Math.min(aPct, bPct)}% represents value if you believe in their ability to perform under pressure.`;

  return {
    favoredTeam: favored.name,
    favoredShort: favored.short,
    confidence,
    winProbability: [aPct, bPct],
    factors,
    reasoning,
    keyBattle,
    weatherImpact: weatherText,
  };
}
