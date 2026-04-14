import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LeaderboardContent } from '@/components/sections/leaderboard-content';

export const metadata = {
  title: 'Leaderboard | PSL Fan Clash',
  description: 'See the most passionate PSL fans and most charitable fan bases. Season 11 rankings powered by WireFluid.',
};

export default function LeaderboardPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-36">
        <LeaderboardContent />
      </main>
      <Footer />
    </>
  );
}
