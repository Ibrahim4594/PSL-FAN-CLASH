import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProfileContent } from '@/components/sections/profile-content';

export const metadata = {
  title: 'Profile | PSL Fan Clash',
  description: 'View your staking history, claimable rewards, win rate, and charity impact on PSL Fan Clash. Powered by WireFluid Testnet.',
};

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-36">
        <ProfileContent />
      </main>
      <Footer />
    </>
  );
}
