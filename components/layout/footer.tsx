'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';

const RESOURCES = [
  { label: 'WireScan Explorer', href: 'https://wirefluidscan.com' },
  { label: 'WireFluid Faucet', href: 'https://faucet.wirefluid.com' },
  { label: 'WireFluid Docs', href: 'https://wirefluid.com' },
];

export function Footer() {
  const { t } = useLocale();

  const NAV = [
    { label: t('nav.matches'), href: '/matches' },
    { label: t('nav.leaderboard'), href: '/leaderboard' },
    { label: t('nav.charity'), href: '/charity' },
    { label: t('nav.profile'), href: '/profile' },
  ];
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
      <div className="sc" style={{ paddingTop: 64, paddingBottom: 32 }}>
        {/* Top row — logo left, nav center, resources right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="md:!grid-cols-3">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img
                src="/images/fan-clash-logo.jpg"
                alt="PSL Fan Clash logo"
                width={36}
                height={36}
                style={{ height: 36, width: 'auto', borderRadius: 3 }}
              />
              <div>
                <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Fan Clash
                </p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Stake &middot; Win &middot; Donate
                </p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
              Your Rivalry. Their Future.<br />Built on WireFluid.
            </p>
          </div>

          {/* Navigate */}
          <div className="md:text-center">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>{t('footer.navigate')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="md:text-right">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>{t('footer.resources')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RESOURCES.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '48px 0 24px' }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            {t('footer.built_for')}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
            Chain ID 92533 &middot; WireFluid Testnet
          </p>
        </div>
      </div>
    </footer>
  );
}
