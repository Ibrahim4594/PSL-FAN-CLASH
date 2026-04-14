'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { useCharities } from '@/lib/hooks/useCharityDAO';
import { useLocale } from '@/lib/locale-context';

/* Static descriptions for known charities */
const CHARITY_DESCRIPTIONS: Record<string, string> = {
  'Edhi Foundation': 'Healthcare, emergency services & social welfare across Pakistan.',
  'Shaukat Khanum': 'Free cancer treatment for underprivileged patients.',
  'The Citizens Foundation': 'Quality education for children in underserved communities.',
};

export function CharityImpact() {
  const { charities, isLoading } = useCharities();
  const { t } = useLocale();

  // Filter active charities; use on-chain data
  const activeCharities = charities.filter(c => c.active);

  return (
    <section
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="sc">
        {/* LEFT-ALIGNED layout — breaks the centered section pattern */}
        <BlurFade delay={0.1} inView>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 3, height: 48, background: '#FF3B30', borderRadius: 2, flexShrink: 0, marginTop: 4 }} />
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                {t('charity.eyebrow')}
              </p>
              <h2 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1 }}>
                {t('charity.title')}
              </h2>
            </div>
          </div>
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <p style={{ maxWidth: '560px', color: 'rgba(255,255,255,0.4)', marginBottom: '48px', lineHeight: 1.7 }}>
            {t('charity.subtitle')}
          </p>
        </BlurFade>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)', animation: 'pulse 2s infinite' }}>Loading charities...</p>
          </div>
        ) : activeCharities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No charities registered yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }} className="md:!grid-cols-3">
            {activeCharities.map((charity, i) => {
              const description = CHARITY_DESCRIPTIONS[charity.name] ?? charity.description ?? 'Registered on PSL Fan Clash';
              return (
                <BlurFade key={charity.id} delay={0.2 + i * 0.05} inView>
                  <div
                    className="glass-card"
                    style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px', textAlign: 'left', height: '100%' }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '24px', display: 'block', marginBottom: '12px' }}>&hearts;</span>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{charity.name}</h3>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>{description}</p>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        Wallet: <a
                          href={`https://wirefluidscan.com/address/${charity.wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          {charity.wallet.slice(0, 6)}...{charity.wallet.slice(-4)}
                        </a>
                      </p>
                    </div>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
