import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AnalyticsContent } from '@/components/sections/analytics-content';

export const metadata = {
  title: 'Analytics | PSL Fan Clash',
  description: 'Platform analytics — fan engagement, team popularity, gas savings, and season trends. Powered by on-chain data from WireFluid.',
};

export default function AnalyticsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-28">
        <AnalyticsContent />
      </main>
      <Footer />
    </>
  );
}
