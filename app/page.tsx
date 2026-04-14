import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { HowItWorks } from '@/components/sections/how-it-works';

// Dynamic imports for below-the-fold heavy components
const PickYourSide = dynamic(() => import('@/components/sections/pick-your-side').then(m => ({ default: m.PickYourSide })));
const MatchesPreview = dynamic(() => import('@/components/sections/matches-preview').then(m => ({ default: m.MatchesPreview })));
const SeasonStats = dynamic(() => import('@/components/sections/season-stats').then(m => ({ default: m.SeasonStats })));
const CharityImpact = dynamic(() => import('@/components/sections/charity-impact').then(m => ({ default: m.CharityImpact })));
const TeamsMarquee = dynamic(() => import('@/components/sections/teams-marquee').then(m => ({ default: m.TeamsMarquee })));
const PlatformFeatures = dynamic(() => import('@/components/sections/platform-features').then(m => ({ default: m.PlatformFeatures })));
const StakingTerminal = dynamic(() => import('@/components/sections/staking-terminal').then(m => ({ default: m.StakingTerminal })));
const ActivityTickerSection = dynamic(() => import('@/components/sections/activity-ticker-section').then(m => ({ default: m.ActivityTickerSection })));


export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <PickYourSide />
        <HowItWorks />
        <StakingTerminal />
        <MatchesPreview />
        <ActivityTickerSection />
        <SeasonStats />
        <CharityImpact />
        <PlatformFeatures />
        <TeamsMarquee />
      </main>
      <Footer />
    </>
  );
}
