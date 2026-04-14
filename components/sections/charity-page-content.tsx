'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BlurFade } from '@/components/ui/blur-fade';
import { ConnectButton } from '@/components/ui/connect-button';
import { useCharities } from '@/lib/hooks/useCharityDAO';
import { useSeasonStats } from '@/lib/hooks/useSeasonLeaderboard';
import { Skeleton, SkeletonCharityCard } from '@/components/ui/skeleton';
import { CONTRACTS } from '@/lib/contracts';
import { useLocale } from '@/lib/locale-context';

/* ---- Static content for charity descriptions (not on-chain) ---- */
const CHARITY_META: Record<string, {
  badge: string;
  description: string;
  bullets: string[];
}> = {
  'Edhi Foundation': {
    badge: 'Healthcare',
    description: "Pakistan's largest welfare organization. Healthcare, emergency services, rehabilitation, and social welfare across all provinces. Founded by Abdul Sattar Edhi.",
    bullets: ['Ambulance network (1,800+ vehicles)', 'Orphanages across Pakistan', 'Free blood banks & clinics'],
  },
  'Shaukat Khanum': {
    badge: 'Cancer Treatment',
    description: 'Free cancer treatment for underprivileged patients. One of the leading cancer hospitals in Asia, founded by Imran Khan.',
    bullets: ['Free chemotherapy & radiation', 'Diagnostic lab services', 'Patient support programs'],
  },
  'The Citizens Foundation': {
    badge: 'Education',
    description: 'Quality education for children in underserved communities. Operating 1,800+ schools across Pakistan educating 266,000+ students.',
    bullets: ['Free schooling K-12', 'Teacher training programs', 'School construction in rural areas'],
  },
};

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function CharityPageContent() {
  const { t } = useLocale();
  const { charities, isLoading: charitiesLoading } = useCharities();
  const { stats, isLoading: statsLoading } = useSeasonStats();

  const totalDonated = stats ? Math.round(parseFloat(stats.totalCharity)) : 0;

  return (
    <>
      {/* SECTION 1: Hero */}
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 96 }}>
        <div className="sc" style={{ textAlign: 'center' }}>
          <BlurFade delay={0.1} inView>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
              {t('charity_page.eyebrow')}
            </p>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <h1 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(3.5rem, 11vw, 7rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
              {t('charity_page.title1')}
            </h1>
          </BlurFade>
          <BlurFade delay={0.35} inView>
            <h1 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(3.5rem, 11vw, 7rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.2)' }}>
              {t('charity_page.title2')}
            </h1>
          </BlurFade>

          <BlurFade delay={0.5} inView>
            <p className="mc" style={{ maxWidth: 560, marginTop: 32, fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, textAlign: 'center' }}>
              Every match, 15% of the staking pool goes directly to charity. Winning fans vote on where the funds are directed. Cricket rivalry becomes social impact.
            </p>
          </BlurFade>

          <BlurFade delay={0.65} inView>
            <div style={{ marginTop: 56, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 10vw, 6rem)', fontWeight: 700, letterSpacing: '-0.03em' }}>
                {statsLoading ? (
                  <Skeleton style={{ width: '40%', height: 48, margin: '0 auto' }} />
                ) : (
                  <NumberTicker value={totalDonated} delay={0.8} className="!text-white" />
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {t('charity_page.wire_donated')}
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* SECTION 2: How Charity Works */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', paddingTop: 96, paddingBottom: 96 }}>
        <div className="sc">
          <BlurFade delay={0.1} inView>
            <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              The Process
            </p>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <h2 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, marginBottom: 56 }}>
              {t('charity_page.how_title')}
            </h2>
          </BlurFade>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="md:!grid-cols-3">
            {[
              { num: '01', title: 'Match Resolves', desc: 'When a match ends, the staking pool is split automatically by the smart contract.', stat: '82% Winners / 15% Charity / 3% Platform' },
              { num: '02', title: 'Winners Vote', desc: 'Only winning stakers get to vote. Voting power is weighted by stake size. 48-hour window.', stat: '1 wallet = 1 vote, weighted by stake' },
              { num: '03', title: 'Charity Receives', desc: 'The charity with the most weighted votes receives the entire 15%. Funds sent directly on-chain.', stat: 'Verified on WireScan Explorer' },
            ].map((step, i) => (
              <BlurFade key={step.num} delay={0.2 + i * 0.15} inView>
                <div className="glass-card" style={{ padding: 28, position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <span className="font-['Clash_Display',sans-serif]" style={{ position: 'absolute', top: -8, right: 12, fontSize: 96, fontWeight: 700, color: 'rgba(255,255,255,0.03)', lineHeight: 1 }}>{step.num}</span>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>{step.num}</p>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 16 }}>{step.desc}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>{step.stat}</p>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: The Charities -- uses real contract data */}
      <section style={{ background: '#f7f8f8', paddingTop: 96, paddingBottom: 96 }}>
        <div className="sc">
          <BlurFade delay={0.1} inView>
            <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(0,0,0,0.3)', marginBottom: 16 }}>
              {t('charity_page.charities_title')}
            </p>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <h2 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: '#0a0a0a', marginBottom: 56 }}>
              Where Your WIRE Goes
            </h2>
          </BlurFade>

          {charitiesLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 20 }} className="md:!grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCharityCard key={i} />
              ))}
            </div>
          ) : charities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(0,0,0,0.3)' }}>
                No charities registered yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 20 }} className="md:!grid-cols-3">
              {charities.filter(c => c.active).map((c, i) => {
                const meta = CHARITY_META[c.name] ?? {
                  badge: 'Charity',
                  description: c.description || 'Registered charity on PSL Fan Clash.',
                  bullets: [],
                };

                return (
                  <BlurFade key={c.id} delay={0.2 + i * 0.15} inView>
                    <motion.div
                      whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
                      transition={spring}
                      style={{
                        background: '#0a0a0a', color: '#f7f8f8', padding: 28, minHeight: 360,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        border: '1px solid transparent', borderRadius: 4,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.15)' }}>&hearts;</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 10px' }}>{meta.badge}</span>
                        </div>
                        <h3 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{c.name}</h3>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 16 }}>{meta.description}</p>
                        {meta.bullets.length > 0 && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {meta.bullets.map((b) => (
                              <li key={b} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 0 }}>-</span>{b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 20 }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          Wallet: <a href={`https://wirefluidscan.com/address/${c.wallet}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                            {c.wallet.slice(0, 6)}...{c.wallet.slice(-4)}
                          </a>
                        </p>
                      </div>
                    </motion.div>
                  </BlurFade>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: Season Stats */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', paddingTop: 96, paddingBottom: 96 }}>
        <div className="sc">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="md:!grid-cols-3">
            {[
              { label: 'Total Donated', value: totalDonated, suffix: ' WIRE' },
              { label: 'Total Staked', value: stats ? Math.round(parseFloat(stats.totalStaked)) : 0, suffix: ' WIRE' },
              { label: 'Active Fans', value: stats?.totalFans ?? 0, suffix: '' },
            ].map((stat, i) => (
              <BlurFade key={stat.label} delay={0.1 + i * 0.1} inView>
                <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                  <div className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>
                    {statsLoading ? (
                      <Skeleton style={{ width: '50%', height: 32, margin: '0 auto' }} />
                    ) : (
                      <>
                        <NumberTicker value={stat.value} delay={0.3 + i * 0.1} className="!text-white" />
                        {stat.suffix && <span style={{ fontSize: '0.4em', color: 'rgba(255,255,255,0.3)' }}>{stat.suffix}</span>}
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{stat.label}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Transparent on-chain */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', paddingTop: 96, paddingBottom: 96 }}>
        <div className="sc">
          <BlurFade delay={0.1} inView>
            <h2 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, marginBottom: 16 }}>
              Transparent. On-Chain. Verifiable.
            </h2>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <p className="tc mc" style={{ maxWidth: 560, color: 'rgba(255,255,255,0.5)', marginBottom: 48 }}>
              Every vote and every payout is recorded on WireFluid blockchain. No middlemen. No trust required.
            </p>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <div className="glass-card mc" style={{ maxWidth: 640, padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>CharityDAO Contract</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>All charity votes and payouts are executed by the CharityDAO smart contract</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Contract Address</span>
                  <a href={`https://wirefluidscan.com/address/${CONTRACTS.charityDAO}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    {CONTRACTS.charityDAO.slice(0, 10)}...{CONTRACTS.charityDAO.slice(-6)}
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Vote Duration</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>48 hours</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Registered Charities</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{charities.length}</span>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* SECTION 6: CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', paddingTop: 96, paddingBottom: 96 }}>
        <div className="sc" style={{ textAlign: 'center' }}>
          <BlurFade delay={0.1} inView>
            <h2 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700 }}>
              Every Stake Counts.
            </h2>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <p className="tc mc" style={{ maxWidth: 480, color: 'rgba(255,255,255,0.5)', marginTop: 16, marginBottom: 40 }}>
              Back your team. Fund real change. The season is live.
            </p>
          </BlurFade>
          <BlurFade delay={0.3} inView>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Link href="/matches" style={{
                display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 32px',
                background: '#f7f8f8', color: '#0a0a0a', fontFamily: 'var(--font-mono)',
                fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                textDecoration: 'none', borderBottom: '2px solid #FF3B30',
                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0a0a0a';
                  e.currentTarget.style.color = '#f7f8f8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f7f8f8';
                  e.currentTarget.style.color = '#0a0a0a';
                }}>
                View Matches
              </Link>
              <ConnectButton />
            </div>
          </BlurFade>
        </div>
      </section>
    </>
  );
}
