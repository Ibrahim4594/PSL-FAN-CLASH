'use client';

import { Home, Swords, Trophy, Heart, User, IdCard } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { ConnectButton } from '@/components/ui/connect-button';
import Link from 'next/link';

const NAV_ITEMS = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Matches', url: '/matches', icon: Swords },
  { name: 'Fan ID', url: '/fan-id', icon: IdCard },
  { name: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { name: 'Charity', url: '/charity', icon: Heart },
  { name: 'Profile', url: '/profile', icon: User },
];

export function Header() {
  return (
    <NavBar
      items={NAV_ITEMS}
      leftElement={
        <Link href="/" style={{ display: 'flex', alignItems: 'center', padding: '0 8px 0 4px', textDecoration: 'none', gap: '6px', flexShrink: 0 }}>
          <img
            src="/images/fan-clash-logo.jpg"
            alt="PSL Fan Clash logo"
            width={22}
            height={22}
            style={{ height: '22px', width: 'auto', borderRadius: '3px' }}
          />
          <span className="hidden md:inline font-['Clash_Display',sans-serif]" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#f7f8f8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Fan Clash
          </span>
        </Link>
      }
      rightElement={<ConnectButton />}
    />
  );
}
