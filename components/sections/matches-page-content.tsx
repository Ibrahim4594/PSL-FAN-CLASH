'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { useAllMatches, type MatchData } from '@/lib/hooks/useMatchFactory';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useLocale } from '@/lib/locale-context';

type MatchStatus = 'OPEN' | 'LOCKED' | 'RESOLVED' | 'ALL';

function Countdown({ targetTs }: { targetTs: number }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetTs - Date.now());
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTs]);
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {[{ l: 'd', v: t.d }, { l: 'h', v: t.h }, { l: 'm', v: t.m }, { l: 's', v: t.s }].map((u) => (
        <div key={u.l} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4, minWidth: 36, textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{String(u.v).padStart(2, '0')}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 1 }}>{u.l}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    OPEN: { background: '#f7f8f8', color: '#0a0a0a' },
    LOCKED: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
    RESOLVED: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' },
    CANCELLED: { background: 'rgba(255,59,48,0.1)', color: 'rgba(255,59,48,0.5)' },
  };
  return (
    <span style={{
      ...styles[status] ?? styles.OPEN, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
      padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {status === 'OPEN' && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#FF3B30', marginRight: 5, verticalAlign: 'middle' }} />}
      {status}
    </span>
  );
}

export function MatchesPageContent() {
  const { matches, isLoading, error } = useAllMatches();
  const { t } = useLocale();
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = (matches ?? []).filter((m) => {
    if (filter !== 'ALL' && m.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.teamA.name.toLowerCase().includes(q) || m.teamB.name.toLowerCase().includes(q) || m.teamA.short.toLowerCase().includes(q) || m.teamB.short.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    OPEN: (matches ?? []).filter(m => m.status === 'OPEN').length,
    LOCKED: (matches ?? []).filter(m => m.status === 'LOCKED').length,
    RESOLVED: (matches ?? []).filter(m => m.status === 'RESOLVED').length,
  };

  return (
    <section style={{ paddingBottom: 80 }}>
      <div className="sc">
        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 48 }}>
          <BlurFade delay={0.1} inView>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              {t('matches.eyebrow')}
            </p>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <h1 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
              {t('matches.title')}
            </h1>
          </BlurFade>
          <BlurFade delay={0.3} inView>
            <p className="mc" style={{ maxWidth: 480, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
              {matches.length > 0
                ? `${matches.length} matches loaded from WireFluid.`
                : t('matches.subtitle')}
            </p>
          </BlurFade>
          <BlurFade delay={0.4} inView>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
              <span style={{ color: '#f7f8f8' }}>{counts.OPEN} {t('matches.open')}</span> &middot; {counts.LOCKED} {t('matches.locked')} &middot; {counts.RESOLVED} {t('matches.resolved')}
            </p>
          </BlurFade>
        </div>

        {/* Filter Bar */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {(['ALL', 'OPEN', 'LOCKED', 'RESOLVED'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '12px 16px', minHeight: 48, background: 'transparent', border: 'none',
                borderBottom: filter === f ? '2px solid #f7f8f8' : '2px solid transparent',
                color: filter === f ? '#f7f8f8' : 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.1em', cursor: 'pointer',
                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
              }}>
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by team..."
            aria-label="Search matches by team name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '12px 16px', minHeight: 48, fontSize: 13, fontFamily: 'var(--font-mono)',
              color: '#f7f8f8', outline: 'none', width: 200, maxWidth: '100%',
            }}
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="md:!grid-cols-2 lg:!grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && matches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              Unable to load matches from blockchain.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>
              RPC may be temporarily unavailable.
            </p>
          </div>
        )}

        {/* Match Cards Grid */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="md:!grid-cols-2 lg:!grid-cols-3">
            {filtered.map((match, i) => {
              const poolA = parseFloat(match.poolA);
              const poolB = parseFloat(match.poolB);
              const total = poolA + poolB;
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={`/matches/${match.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <CardSpotlight className="rounded-lg" radius={350} color="rgba(255,255,255,0.04)">
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', borderRadius: 8 }}>
                      {/* PSL watermark */}
                      <img src="/images/psl-logo.png" alt="" style={{ position: 'absolute', top: 14, right: 14, height: 20, width: 'auto', opacity: 0.08, filter: 'brightness(0) invert(1)', pointerEvents: 'none' }} />
                      {/* Top bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Match #{match.id}</span>
                        <StatusBadge status={match.status} />
                      </div>

                      {/* Teams */}
                      <div style={{ padding: '12px 20px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{match.teamA.short}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{match.teamA.name}</p>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.15)', padding: '0 8px' }}>{t('matches.vs')}</span>
                          <div style={{ textAlign: 'right' }}>
                            <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{match.teamB.short}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{match.teamB.name}</p>
                          </div>
                        </div>

                        {/* Pool amounts */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 12 }}>
                          <span>{poolA.toFixed(2)} WIRE</span>
                          <span>{poolB.toFixed(2)} WIRE</span>
                        </div>

                        {/* Pool bar */}
                        {total > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${(poolA / total) * 100}%`, background: '#f7f8f8', borderRadius: '2px 0 0 2px' }} />
                              <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '0 2px 2px 0' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>
                              <span>{Math.round((poolA / total) * 100)}%</span>
                              <span>{Math.round((poolB / total) * 100)}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom */}
                      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        {match.status === 'OPEN' && (
                          <>
                            <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>{t('matches.staking_closes')}</p>
                            <Countdown targetTs={match.deadlineTs} />
                          </>
                        )}
                        {match.status === 'LOCKED' && (
                          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.25)', animation: 'pulse 2s infinite' }}>{t('match.in_progress')}</p>
                        )}
                        {match.status === 'RESOLVED' && match.winner && (
                          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{t('matches.winner')}: </span>
                            <span style={{ fontWeight: 700 }}>{match.winner}</span>
                          </p>
                        )}
                      </div>

                      {match.status === 'OPEN' && (
                        <BorderBeam size={250} duration={12} borderWidth={1} colorFrom="rgba(255,255,255,0.5)" colorTo="rgba(255,59,48,0.3)" delay={match.id * 3} />
                      )}
                    </div>
                    </CardSpotlight>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Vault address info */}
        {!isLoading && matches.length > 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
              Data from WireFluid Testnet (Chain ID 92533)
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
