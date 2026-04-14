'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BorderBeam } from '@/components/ui/border-beam';
import { BlurFade } from '@/components/ui/blur-fade';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { useAllMatches, type MatchData } from '@/lib/hooks/useMatchFactory';
import { useLocale } from '@/lib/locale-context';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
      {[{ l: 'days', v: t.d }, { l: 'hrs', v: t.h }, { l: 'min', v: t.m }, { l: 'sec', v: t.s }].map((u) => (
        <div key={u.l} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 8px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{String(u.v).padStart(2, '0')}</p>
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{u.l}</p>
        </div>
      ))}
    </div>
  );
}

export function MatchesPreview() {
  const { matches, isLoading } = useAllMatches();
  const { t } = useLocale();

  // Show only the first 3 matches (preferring OPEN ones)
  const previewMatches = (matches ?? [])
    .sort((a, b) => {
      const stateOrder: Record<string, number> = { OPEN: 0, LOCKED: 1, RESOLVED: 2, CANCELLED: 3 };
      return (stateOrder[a.status] ?? 4) - (stateOrder[b.status] ?? 4);
    })
    .slice(0, 3);

  return (
    <section
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="sc">
        <BlurFade delay={0.1} inView>
          <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>
            {t('preview.eyebrow')}
          </p>
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <h2 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 700, marginBottom: '8px' }}>
            {t('preview.title')}
          </h2>
        </BlurFade>
        <BlurFade delay={0.3} inView>
          <p className="tc" style={{ marginBottom: '64px' }}>
            <Link href="/matches" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', borderBottom: '1px solid #FF3B30', paddingBottom: '2px', transition: 'color 0.2s ease' }}>
              {t('preview.view_all')} {'\u2192'}
            </Link>
          </p>
        </BlurFade>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)', animation: 'pulse 2s infinite' }}>Loading matches from WireFluid...</p>
          </div>
        )}

        {/* 3 cards -- forced 3 columns */}
        {!isLoading && previewMatches.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }} className="md:!grid-cols-3">
            {previewMatches.map((match, i) => {
              const poolA = parseFloat(match.poolA);
              const poolB = parseFloat(match.poolB);
              return (
                <BlurFade key={match.id} delay={0.3 + i * 0.12} inView>
                  <CardSpotlight className="rounded" radius={300} color="rgba(255,255,255,0.04)">
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                    <img src="/images/psl-logo.png" alt="" style={{ position: 'absolute', top: 14, right: 14, height: 18, width: 'auto', opacity: 0.08, filter: 'brightness(0) invert(1)', pointerEvents: 'none', zIndex: 2 }} />
                    <Link href={`/matches/${match.id}`}
                      className="glass-card"
                      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', textDecoration: 'none', color: 'inherit', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Match #{match.id}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                          {match.status === 'OPEN' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF3B30', boxShadow: '0 0 6px rgba(255,59,48,0.5)' }} />}
                          {match.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: '28px', fontWeight: 700 }}>{match.teamA.short}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{match.teamA.name}</p>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>vs</span>
                        <div style={{ textAlign: 'right' }}>
                          <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: '28px', fontWeight: 700 }}>{match.teamB.short}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{match.teamB.name}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                        <span>{poolA.toFixed(2)} WIRE</span><span>{poolB.toFixed(2)} WIRE</span>
                      </div>
                      <div style={{ marginTop: 'auto' }}>
                        {match.status === 'OPEN' && (
                          <>
                            <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>{t('matches.staking_closes')}</p>
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
                    </Link>
                    {match.status === 'OPEN' && (
                      <BorderBeam
                        size={250}
                        duration={12}
                        borderWidth={1.5}
                        colorFrom="rgba(255,255,255,0.6)"
                        colorTo="rgba(255,59,48,0.4)"
                        delay={match.id * 4}
                      />
                    )}
                  </div>
                  </CardSpotlight>
                </BlurFade>
              );
            })}
          </div>
        )}

        {!isLoading && previewMatches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No matches loaded yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
