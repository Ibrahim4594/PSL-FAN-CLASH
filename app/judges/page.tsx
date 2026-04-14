import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { JudgesContent } from '@/components/sections/judges-content';

export const metadata = {
  title: 'For Judges | PSL Fan Clash',
  description: 'Technical deep dive for Entangled 2026 hackathon judges. Contract addresses, deployment hashes, security features, gas optimization, and WireFluid-specific architecture.',
};

export default function JudgesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-28">
        <JudgesContent />
      </main>
      <Footer />
    </>
  );
}
