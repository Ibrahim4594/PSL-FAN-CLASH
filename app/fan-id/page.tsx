'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BlurFade } from '@/components/ui/blur-fade';
import { ConnectButton } from '@/components/ui/connect-button';
import { TxReceipt } from '@/components/ui/tx-receipt';
import { useAccount } from 'wagmi';
import { useHasFanID, useFanStats, useCricketIQ, useMintFanID } from '@/lib/hooks/useFanID';
import { usePulseBalance } from '@/lib/hooks/usePulseToken';
import { PSL_TEAMS } from '@/lib/teams';
import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';

export default function FanIDPage() {
  const { address, isConnected } = useAccount();
  const { hasFanID, isLoading: checkingID } = useHasFanID();
  const { stats } = useFanStats();
  const { cricketIQ } = useCricketIQ();
  const { balance: pulseBalance } = usePulseBalance();
  const { mint, status, txHash, error, startTime, reset } = useMintFanID();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const { t } = useLocale();

  return (
    <>
      <Header />
      <main className="flex-1 pt-28" style={{ paddingBottom: 80 }}>
        <div className="sc">
          {/* Header */}
          <div style={{ textAlign: 'center', paddingBottom: 48 }}>
            <BlurFade delay={0.1} inView>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                {t('fanid.eyebrow')}
              </p>
            </BlurFade>
            <BlurFade delay={0.2} inView>
              <h1 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
                {t('fanid.title')}
              </h1>
            </BlurFade>
            <BlurFade delay={0.3} inView>
              <p className="mc" style={{ maxWidth: 480, color: 'rgba(255,255,255,0.4)', marginTop: 16, lineHeight: 1.7 }}>
                {t('fanid.subtitle')}
              </p>
            </BlurFade>
          </div>

          {/* Not Connected */}
          {!isConnected && (
            <BlurFade delay={0.4} inView>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{t('fanid.connect')}</p>
                <ConnectButton />
              </div>
            </BlurFade>
          )}

          {/* Already Has Fan ID — Show Card */}
          {isConnected && hasFanID && stats && (
            <BlurFade delay={0.4} inView>
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: 32 }}>
                  {/* Team Badge */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 48, fontWeight: 700 }}>
                      {stats.teamShort}
                    </p>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{stats.teamName}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                      {t('fanid.fan_since')} {new Date(stats.mintedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

                  {/* Cricket IQ */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                      {t('fanid.cricket_iq')}
                    </p>
                    <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 36, fontWeight: 700 }}>
                      {cricketIQ > 0 ? `${cricketIQ.toFixed(1)}%` : '—'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                      Verified by {stats.matchesJoined} on-chain matches
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <StatBox label="Matches" value={stats.matchesJoined.toString()} />
                    <StatBox label="Correct Picks" value={stats.correctPicks.toString()} />
                    <StatBox label="WIRE Staked" value={`${parseFloat(stats.totalStaked).toFixed(2)}`} />
                    <StatBox label="WIRE Won" value={`${parseFloat(stats.totalWon).toFixed(2)}`} />
                    <StatBox label="Charity Votes" value={stats.charityVotes.toString()} />
                    <StatBox label="PULSE Earned" value={pulseBalance} />
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

                  {/* On-chain identity */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 8, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Your On-Chain Identity</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)', width: 50, fontSize: 10 }}>EVM</span>
                      <a href={`https://wirefluidscan.com/address/${address}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {address?.slice(0, 10)}...{address?.slice(-8)}
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)', width: 50, fontSize: 10 }}>Cosmos</span>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>wire1{address?.slice(2, 10).toLowerCase()}...{address?.slice(-6).toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Soulbound badge */}
                  <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                    {t('fanid.soulbound')}
                  </p>
                </div>
              </div>
            </BlurFade>
          )}

          {/* Mint Flow — No Fan ID Yet */}
          {isConnected && !hasFanID && !checkingID && (
            <BlurFade delay={0.4} inView>
              <div style={{ maxWidth: 520, margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: 32 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t('fanid.pick_team')}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.7 }}>
                    {t('fanid.pick_desc')}
                  </p>

                  {/* Team Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="md:!grid-cols-4">
                    {PSL_TEAMS.map(team => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team.id)}
                        style={{
                          padding: '16px 8px',
                          background: selectedTeam === team.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                          border: selectedTeam === team.id ? '2px solid #f7f8f8' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1)',
                          minHeight: 48,
                        }}
                      >
                        <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 18, fontWeight: 700 }}>{team.short}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{team.name}</p>
                      </button>
                    ))}
                  </div>

                  {/* Mint Button */}
                  <button
                    onClick={() => selectedTeam !== null && mint(selectedTeam)}
                    disabled={selectedTeam === null || status === 'confirming' || status === 'pending'}
                    style={{
                      width: '100%',
                      marginTop: 24,
                      height: 52,
                      background: selectedTeam !== null ? '#f7f8f8' : 'rgba(255,255,255,0.05)',
                      color: selectedTeam !== null ? '#0a0a0a' : 'rgba(255,255,255,0.2)',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: selectedTeam !== null ? 'pointer' : 'default',
                      transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                    }}
                  >
                    {status === 'confirming' ? t('fanid.confirming') :
                     status === 'pending' ? t('fanid.minting') :
                     selectedTeam !== null ? `${t('fanid.mint_btn')} — ${PSL_TEAMS.find(tm => tm.id === selectedTeam)?.short} (0.01 WIRE)` :
                     t('fanid.pick_first')}
                  </button>

                  <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 12 }}>
                    {t('common.network_fee')} &middot; Your Fan ID is permanent
                  </p>

                  {/* Error */}
                  {error && (
                    <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF3B30', marginTop: 16 }}>
                      {error}
                    </p>
                  )}

                  {/* Success Receipt */}
                  {status === 'success' && txHash && (
                    <TxReceipt
                      hash={txHash}
                      action={`Fan ID minted — ${PSL_TEAMS.find(t => t.id === selectedTeam)?.name}`}
                      startTime={startTime}
                      onClose={reset}
                    />
                  )}
                </div>
              </div>
            </BlurFade>
          )}

          {/* Loading */}
          {isConnected && checkingID && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Checking your Fan ID...</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>{value}</p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{label}</p>
    </div>
  );
}
