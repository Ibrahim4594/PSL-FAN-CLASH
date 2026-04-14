import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MatchesPageContent } from '@/components/sections/matches-page-content';

export const metadata = {
  title: 'Matches | PSL Fan Clash',
  description: 'Stake WIRE on PSL 11 matches. 8 teams, 44 matches. Winners earn 82%, charities earn 15%. Built on WireFluid.',
};

export default function MatchesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-28">
        <MatchesPageContent />
      </main>
      <Footer />
    </>
  );
}
