import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CharityPageContent } from '@/components/sections/charity-page-content';

export const metadata = {
  title: 'Charity | PSL Fan Clash',
  description: 'Cricket rivalry funds real change. 15% of every staking pool goes to Edhi Foundation, Shaukat Khanum, and The Citizens Foundation.',
};

export default function CharityPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-28">
        <CharityPageContent />
      </main>
      <Footer />
    </>
  );
}
