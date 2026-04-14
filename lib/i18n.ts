/**
 * PSL Fan Clash — Internationalization
 * EN/UR with cricket-flavored Urdu (not formal, not textbook — street cricket Urdu)
 */

export type Locale = 'en' | 'ur';

const translations: Record<string, Record<Locale, string>> = {
  // Navigation
  'nav.home': { en: 'Home', ur: 'گھر' },
  'nav.matches': { en: 'Matches', ur: 'میچز' },
  'nav.fanid': { en: 'Fan ID', ur: 'فین آئی ڈی' },
  'nav.leaderboard': { en: 'Leaderboard', ur: 'لیڈر بورڈ' },
  'nav.charity': { en: 'Charity', ur: 'خیرات' },
  'nav.profile': { en: 'Profile', ur: 'پروفائل' },

  // Hero
  'hero.eyebrow': { en: 'PSL 11 · Powered by WireFluid', ur: 'PSL 11 · وائرفلوئڈ پر' },
  'hero.title1': { en: 'Your Rivalry.', ur: 'تمہاری ٹکر۔' },
  'hero.title2': { en: 'Their Future.', ur: 'اُن کا مستقبل۔' },
  'hero.subtitle': {
    en: 'Stake WIRE on your PSL team. Winners earn 82%. Charities earn 15%. Cricket rivalry directly powers social impact.',
    ur: 'اپنی ٹیم پر WIRE لگاؤ۔ جیتنے والوں کو 82% ملے گا۔ 15% خیرات میں جائے گا۔ کرکٹ کی ٹکر سے سماج بدلے گا۔'
  },
  'hero.cta': { en: 'View Matches', ur: 'میچز دیکھیں' },

  // Connect
  'wallet.connect': { en: 'Connect Wallet', ur: 'والیٹ جوڑیں' },
  'wallet.wrong_network': { en: 'Wrong Network', ur: 'غلط نیٹورک' },

  // How it works
  'how.eyebrow': { en: 'How It Works', ur: 'یہ کیسے چلتا ہے' },
  'how.title': { en: 'Three Steps to Impact', ur: 'تین قدم، بڑا اثر' },
  'how.step1.title': { en: 'Pick Your Team', ur: 'اپنی ٹیم چُنو' },
  'how.step1.desc': {
    en: 'Choose from 8 PSL franchises. Back Lahore Qalandars, ride with Karachi Kings, or rep any of the six others.',
    ur: 'آٹھ PSL ٹیموں میں سے چُنو۔ لاہور قلندرز کے ساتھ کھڑے ہو، کراچی کنگز کو سپورٹ کرو، یا کوئی اور ٹیم اُٹھاؤ۔'
  },
  'how.step2.title': { en: 'Back Your Team', ur: 'اپنی ٹیم پر لگاؤ' },
  'how.step2.desc': {
    en: 'Lock WIRE tokens into the match vault before the staking deadline. As low as 0.01 WIRE to play.',
    ur: 'میچ سے پہلے WIRE لگاؤ۔ صرف 0.01 WIRE سے شروع کرو۔ جتنا دل چاہے اُتنا لگاؤ۔'
  },
  'how.step3.title': { en: 'Winners Fund Charity', ur: 'جیتنے والے خیرات کریں' },
  'how.step3.desc': {
    en: 'Winners earn 82% of the pool. 15% goes to a charity chosen by winning fans. Everyone wins.',
    ur: 'جیتنے والوں کو 82% ملتا ہے۔ 15% خیرات میں جاتا ہے جو جیتنے والے فینز چُنتے ہیں۔ سب جیتے۔'
  },

  // Matches
  'matches.eyebrow': { en: 'PSL 11 · Season Live', ur: 'PSL 11 · سیزن لائیو' },
  'matches.title': { en: 'Matches', ur: 'میچز' },
  'matches.subtitle': {
    en: '44 matches. 8 teams. Every rivalry funds charity.',
    ur: '44 میچز۔ 8 ٹیمیں۔ ہر ٹکر سے خیرات ہوگی۔'
  },
  'matches.open': { en: 'Open', ur: 'کھلا ہے' },
  'matches.locked': { en: 'Locked', ur: 'لاک ہے' },
  'matches.resolved': { en: 'Resolved', ur: 'نتیجہ آ گیا' },
  'matches.staking_closes': { en: 'Staking closes in', ur: 'لگانے کا وقت باقی' },
  'matches.winner': { en: 'Winner', ur: 'جیتنے والا' },
  'matches.vs': { en: 'VS', ur: 'بمقابلہ' },

  // Fan ID
  'fanid.eyebrow': { en: 'Your PSL Identity', ur: 'تمہاری PSL شناخت' },
  'fanid.title': { en: 'Get Your Fan ID', ur: 'اپنا فین آئی ڈی بناؤ' },
  'fanid.subtitle': {
    en: 'Your permanent PSL fan pass. Pick your team, build your reputation, earn rewards. One per fan — yours forever.',
    ur: 'تمہارا مستقل PSL فین پاس۔ ٹیم چُنو، شہرت بناؤ، انعام کماؤ۔ ایک فین، ایک ID — ہمیشہ تمہاری۔'
  },
  'fanid.pick_team': { en: 'Pick Your PSL Team', ur: 'اپنی PSL ٹیم چُنو' },
  'fanid.pick_desc': {
    en: 'Choose the team you support. This is permanent — your Fan ID is tied to your team forever. Choose wisely!',
    ur: 'وہ ٹیم چُنو جس کے تم فین ہو۔ یہ ہمیشہ کے لیے ہے — سوچ سمجھ کر چُنو!'
  },
  'fanid.mint_btn': { en: 'Get My Fan ID', ur: 'میرا فین آئی ڈی بناؤ' },
  'fanid.pick_first': { en: 'Pick a team first', ur: 'پہلے ٹیم چُنو' },
  'fanid.confirming': { en: 'Confirm in MetaMask...', ur: 'MetaMask میں تصدیق کرو...' },
  'fanid.minting': { en: 'Getting your Fan ID...', ur: 'تمہارا فین آئی ڈی بن رہا ہے...' },
  'fanid.connect': {
    en: 'Connect your wallet to get your Fan ID and pick your PSL team',
    ur: 'والیٹ جوڑو تاکہ فین آئی ڈی بنا سکو اور ٹیم چُن سکو'
  },
  'fanid.soulbound': { en: 'Soulbound · Non-Transferable · Yours Forever', ur: 'مستقل · ناقابلِ منتقلی · ہمیشہ تمہارا' },
  'fanid.cricket_iq': { en: 'Cricket IQ', ur: 'کرکٹ آئی کیو' },
  'fanid.fan_since': { en: 'Fan since', ur: 'فین بنے' },

  // Match Detail
  'match.back_team': { en: 'Back Your Team', ur: 'اپنی ٹیم پر لگاؤ' },
  'match.place_stake': { en: 'Place Your Stake', ur: 'اپنا داؤ لگاؤ' },
  'match.claim_reward': { en: 'Collect Your Rewards', ur: 'اپنا انعام لو' },
  'match.vote_charity': { en: 'Vote for Charity', ur: 'خیرات کے لیے ووٹ دو' },
  'match.your_stake': { en: 'Your Stake', ur: 'تمہارا داؤ' },
  'match.pool': { en: 'Total Pool', ur: 'کل پول' },
  'match.in_progress': { en: 'Match in progress', ur: 'میچ جاری ہے' },
  'match.amount': { en: 'Amount', ur: 'رقم' },

  // Staking Terminal
  'terminal.eyebrow': { en: 'On-Chain Flow', ur: 'آن چین فلو' },
  'terminal.title': { en: 'How Staking Works', ur: 'داؤ کیسے لگتا ہے' },

  // Season Stats
  'stats.eyebrow': { en: 'PSL 11 Season', ur: 'PSL 11 سیزن' },
  'stats.title': { en: 'The Numbers Speak', ur: 'نمبر بولتے ہیں' },
  'stats.total_staked': { en: 'Total Staked', ur: 'کل لگایا گیا' },
  'stats.donated': { en: 'Donated to Charity', ur: 'خیرات میں دیا گیا' },
  'stats.active_fans': { en: 'Active Fans', ur: 'فعال فینز' },

  // Charity
  'charity.eyebrow': { en: 'Real Impact', ur: 'حقیقی اثر' },
  'charity.title': { en: 'Your Rivalry Changes Lives', ur: 'تمہاری ٹکر زندگیاں بدلتی ہے' },
  'charity.subtitle': {
    en: 'Every match, 15% of the staking pool goes directly to charity. Winning fans vote on where the funds are directed.',
    ur: 'ہر میچ میں پول کا 15% سیدھا خیرات میں جاتا ہے۔ جیتنے والے فینز فیصلہ کرتے ہیں کہ پیسے کہاں جائیں۔'
  },

  // Leaderboard
  'leaderboard.eyebrow': { en: 'Season 11', ur: 'سیزن 11' },
  'leaderboard.title': { en: 'Leaderboard', ur: 'لیڈر بورڈ' },

  // Profile
  'profile.not_connected': { en: 'Connect wallet to see your profile', ur: 'پروفائل دیکھنے کے لیے والیٹ جوڑو' },

  // Common
  'common.wire': { en: 'WIRE', ur: 'WIRE' },
  'common.pulse': { en: 'PULSE', ur: 'PULSE' },
  'common.network_fee': { en: 'Network fee: less than $0.01', ur: 'نیٹورک فیس: $0.01 سے بھی کم' },
  'common.powered_by': { en: 'Built on WireFluid', ur: 'وائرفلوئڈ پر بنایا گیا' },
  'common.scroll': { en: 'Scroll', ur: 'نیچے جاؤ' },

  // Teams Marquee
  'marquee.eyebrow': { en: '8 PSL Teams', ur: '8 PSL ٹیمیں' },
  'marquee.title': { en: 'Pick Your Side.', ur: 'اپنا ساتھ چُنو۔' },

  // Footer
  'footer.built_for': { en: 'Built for Entangled 2026 by WireFluid', ur: 'وائرفلوئڈ کی طرف سے Entangled 2026 کے لیے' },
  'footer.navigate': { en: 'Navigate', ur: 'صفحات' },
  'footer.resources': { en: 'Resources', ur: 'وسائل' },

  // CometBFT
  'consensus.title': { en: 'CometBFT Consensus — WireFluid', ur: 'CometBFT اتفاقِ رائے — وائرفلوئڈ' },
  'consensus.prevote': { en: 'Pre-Vote (validators acknowledging)', ur: 'پری ووٹ (تصدیق کنندگان نے دیکھ لیا)' },
  'consensus.precommit': { en: 'Pre-Commit (2/3+ validators agreed)', ur: 'پری کمٹ (دو تہائی سے زیادہ متفق)' },
  'consensus.committed': { en: 'Committed to block', ur: 'بلاک میں درج ہو گیا' },
  'consensus.finalized': { en: 'Finalized — Byzantine Fault Tolerant', ur: 'حتمی — بازنطینی خرابی سے محفوظ' },

  // Weather
  'weather.title': { en: 'Match-Day Weather', ur: 'میچ کے دن کا موسم' },
  'weather.rain_risk': { en: 'Rain Risk', ur: 'بارش کا خطرہ' },
  'weather.powered_by': { en: 'Powered by NASA POWER API', ur: 'NASA POWER API سے' },
  // Analytics
  'analytics.eyebrow': { en: 'On-Chain Intelligence', ur: 'آن چین انٹیلیجنس' },
  'analytics.title': { en: 'Analytics', ur: 'تجزیات' },
  'analytics.subtitle': { en: 'Every stat pulled from on-chain data. Verifiable on WireScan.', ur: 'ہر نمبر آن چین ڈیٹا سے۔ WireScan پر تصدیق کرو۔' },
  'analytics.total_fans': { en: 'Total Fans', ur: 'کل فینز' },
  'analytics.wire_staked': { en: 'WIRE Staked', ur: 'WIRE لگایا گیا' },
  'analytics.charity_donated': { en: 'Charity Donated', ur: 'خیرات دی گئی' },
  'analytics.transactions': { en: 'Transactions', ur: 'لین دین' },
  'analytics.team_popularity': { en: 'Team Popularity', ur: 'ٹیم کی مقبولیت' },
  'analytics.gas_savings': { en: 'Gas Savings vs Ethereum', ur: 'ایتھیریم کے مقابلے گیس کی بچت' },
  'analytics.saved_across': { en: 'saved across', ur: 'بچت ہوئی' },
  'analytics.cheaper': { en: '99.99% cheaper · Same security guarantees', ur: '99.99% سستا · وہی سیکورٹی' },

  // Platform Features
  'features.eyebrow': { en: 'Why PSL Fan Clash', ur: 'PSL فین کلیش کیوں' },
  'features.title': { en: 'Built for Fans. Powered by Web3.', ur: 'فینز کے لیے بنایا۔ Web3 سے چلتا ہے۔' },

  // Pick Your Side
  'pick.eyebrow': { en: '8 PSL Teams', ur: '8 PSL ٹیمیں' },
  'pick.title': { en: 'Pick Your Side.', ur: 'اپنا ساتھ چُنو۔' },
  'pick.subtitle': { en: '8 franchises, 44 matches. Every rivalry funds charity. Choose your team and stake WIRE to back them.', ur: '8 فرنچائزز، 44 میچز۔ ہر ٹکر سے خیرات۔ ٹیم چُنو اور WIRE لگاؤ۔' },
  'pick.cta': { en: 'View Matches', ur: 'میچز دیکھیں' },

  // Live Matches Preview
  'preview.eyebrow': { en: 'Coming Up', ur: 'آنے والے' },
  'preview.title': { en: 'Live Matches', ur: 'لائیو میچز' },
  'preview.view_all': { en: 'View All Matches', ur: 'سب میچز دیکھیں' },

  // Activity
  'activity.eyebrow': { en: 'Live On-Chain', ur: 'لائیو آن چین' },
  'activity.title': { en: 'Activity', ur: 'سرگرمی' },

  // AI Analysis
  'analysis.title': { en: 'AI Match Analysis', ur: 'AI میچ تجزیہ' },
  'analysis.favored': { en: 'favored at', ur: 'فیورٹ ہے' },
  'analysis.confidence': { en: 'confidence', ur: 'اعتماد' },
  'analysis.key_battle': { en: 'Key Battle', ur: 'اہم مقابلہ' },
  'analysis.how_works': { en: 'How does this work?', ur: 'یہ کیسے کام کرتا ہے؟' },

  // Errors (fan-friendly)
  'error.cancelled': { en: 'Transaction cancelled — no WIRE was spent', ur: 'لین دین منسوخ — کوئی WIRE خرچ نہیں ہوا' },
  'error.already_registered': { en: 'You already have a Fan ID! Check your profile.', ur: 'تمہارا فین آئی ڈی پہلے سے بنا ہوا ہے! پروفائل دیکھو۔' },
  'error.insufficient': { en: 'Not enough WIRE — get free tokens at faucet.wirefluid.com', ur: 'WIRE کم ہے — مفت ٹوکن faucet.wirefluid.com سے لو' },
  'error.min_stake': { en: 'Minimum stake is 0.01 WIRE', ur: 'کم از کم 0.01 WIRE لگانا ضروری ہے' },
  'error.both_teams': { en: 'You already staked for the other team', ur: 'تم پہلے سے دوسری ٹیم پر لگا چکے ہو' },
  'error.generic': { en: 'Something went wrong. Please try again.', ur: 'کچھ غلط ہو گیا۔ دوبارہ کوشش کرو۔' },

  // Weather conditions
  'weather.clear': { en: 'Clear', ur: 'صاف موسم' },
  'weather.overcast': { en: 'Overcast', ur: 'ابر آلود' },
  'weather.hot': { en: 'Hot', ur: 'گرم' },
  'weather.humid': { en: 'Humid', ur: 'مرطوب' },
  'weather.rainy': { en: 'Rain Expected', ur: 'بارش متوقع' },
  'weather.windy': { en: 'Windy', ur: 'تیز ہوا' },

  // Leaderboard tabs
  'leaderboard.fans_tab': { en: 'Most Passionate Fans', ur: 'سب سے جوشیلے فینز' },
  'leaderboard.teams_tab': { en: 'Most Charitable Teams', ur: 'سب سے زیادہ خیرات کرنے والی ٹیمیں' },

  // Profile
  'profile.title': { en: 'Your Profile', ur: 'تمہارا پروفائل' },
  'profile.staking_history': { en: 'Staking History', ur: 'داؤ کی تاریخ' },
  'profile.active_stakes': { en: 'Active Stakes', ur: 'فعال داؤ' },
  'profile.claimable': { en: 'Claimable Rewards', ur: 'قابلِ وصول انعامات' },
  'profile.charity_votes': { en: 'Charity Votes', ur: 'خیرات ووٹ' },
  'profile.total_staked': { en: 'Total Staked', ur: 'کل لگایا' },
  'profile.total_won': { en: 'Total Won', ur: 'کل جیتا' },
  'profile.win_rate': { en: 'Win Rate', ur: 'جیت کی شرح' },
  'profile.matches_played': { en: 'Matches', ur: 'میچز' },
  'profile.team': { en: 'Your Team', ur: 'تمہاری ٹیم' },

  // Match Detail
  'match.eyebrow': { en: 'Match Detail', ur: 'میچ کی تفصیل' },
  'match.staking_form': { en: 'Place Your Stake', ur: 'اپنا داؤ لگاؤ' },
  'match.stake_amount': { en: 'Stake Amount', ur: 'داؤ کی رقم' },
  'match.confirm_stake': { en: 'Confirm & Stake', ur: 'تصدیق کرو اور لگاؤ' },
  'match.staking': { en: 'Staking...', ur: 'لگ رہا ہے...' },
  'match.back_to_matches': { en: 'Back to Matches', ur: 'واپس میچز پر' },
  'match.total_pool': { en: 'Total Pool', ur: 'کل پول' },
  'match.charity_vote': { en: 'Vote for Charity', ur: 'خیرات کے لیے ووٹ' },
  'match.reward_claimed': { en: 'Reward claimed', ur: 'انعام مل گیا' },
  'match.collect': { en: 'Collect Your Rewards', ur: 'اپنا انعام لو' },

  // Charity Page
  'charity_page.eyebrow': { en: 'Real Impact', ur: 'حقیقی اثر' },
  'charity_page.title1': { en: 'Your Rivalry', ur: 'تمہاری ٹکر' },
  'charity_page.title2': { en: 'Changes Lives.', ur: 'زندگیاں بدلتی ہے۔' },
  'charity_page.how_title': { en: 'How Charity Voting Works', ur: 'خیرات ووٹنگ کیسے کام کرتی ہے' },
  'charity_page.charities_title': { en: 'Registered Charities', ur: 'رجسٹرڈ خیراتی ادارے' },
  'charity_page.donate_title': { en: 'Season Charity Impact', ur: 'سیزن کا خیراتی اثر' },
  'charity_page.wire_donated': { en: 'WIRE Donated This Season', ur: 'اس سیزن میں WIRE خیرات' },

  // Connect Button
  'wallet.copy_address': { en: 'Copy Address', ur: 'ایڈریس کاپی کرو' },
  'wallet.view_wirescan': { en: 'View on WireScan', ur: 'WireScan پر دیکھو' },
  'wallet.my_profile': { en: 'My Profile', ur: 'میرا پروفائل' },
  'wallet.disconnect': { en: 'Disconnect', ur: 'منقطع کرو' },

  // Weather
  'weather.condition': { en: 'Match-Day Weather', ur: 'میچ کے دن کا موسم' },
  'weather.impact': { en: 'Impact', ur: 'اثر' },
  'weather.temp': { en: 'Temp', ur: 'درجہ حرارت' },
  'weather.humidity': { en: 'Humidity', ur: 'نمی' },
  'weather.wind': { en: 'Wind', ur: 'ہوا' },
  'weather.high_low': { en: 'High / Low', ur: 'زیادہ / کم' },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] ?? translations[key]?.en ?? key;
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ur' ? 'rtl' : 'ltr';
}
