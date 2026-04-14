'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ConnectButton } from '@/components/ui/connect-button';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useProfileData } from '@/lib/hooks/useProfileData';
import type { VaultStakeData } from '@/lib/hooks/useProfileData';
import { MATCHVAULT_ABI } from '@/src/abi/MatchVault.abi';
import { PSL_TEAMS } from '@/lib/teams';
import { truncateAddress, explorerAddressUrl, explorerTxUrl } from '@/lib/utils';
import { wirefluid } from '@/lib/chains';
import { useLocale } from '@/lib/locale-context';
import Link from 'next/link';

// ─── Claim Reward Card ───────────────────────────────────────────────

function ClaimRewardCard({ stake, onClaimed }: { stake: VaultStakeData; onClaimed: () => void }) {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [status, setStatus] = useState<'idle' | 'confirming' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: wirefluid.id,
  });

  if (receipt && status === 'pending') {
    setStatus('success');
    onClaimed();
  }

  const handleClaim = useCallback(async () => {
    setStatus('confirming');
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: stake.vaultAddress,
        abi: MATCHVAULT_ABI,
        functionName: 'claimReward',
        chainId: wirefluid.id,
      });
      setTxHash(hash);
      setStatus('pending');
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e.code === 4001 || e.message?.includes('User rejected')) {
        setError('Transaction cancelled');
      } else if (e.message?.includes('AlreadyClaimed')) {
        setError('Already claimed');
      } else {
        setError('Claim failed. Try again.');
      }
      setStatus('error');
    }
  }, [stake.vaultAddress, writeContractAsync]);

  const stakedTeam = PSL_TEAMS.find((team) => team.id === stake.userStakeTeamId);

  return (
    <div
      className="glass-card"
      style={{
        padding: 24,
        border: '1px solid rgba(52, 199, 89, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Green accent line at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#34C759' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Match #{stake.matchId}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px', borderRadius: 99,
          background: 'rgba(52, 199, 89, 0.15)', color: '#34C759',
          fontWeight: 600, textTransform: 'uppercase',
        }}>
          WON
        </span>
      </div>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
        {stake.teamA} vs {stake.teamB}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
        Staked {parseFloat(stake.userStakeAmount).toFixed(4)} WIRE on {stakedTeam?.short ?? 'Team'}
      </p>

      {status === 'success' ? (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#34C759' }}>Reward claimed!</p>
          {txHash && (
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              View Tx &rarr;
            </a>
          )}
        </div>
      ) : (
        <button
          onClick={handleClaim}
          disabled={status === 'confirming' || status === 'pending'}
          style={{
            marginTop: 16, width: '100%', height: 48, background: '#f7f8f8', color: '#0a0a0a',
            border: 'none', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: status === 'confirming' || status === 'pending' ? 'wait' : 'pointer',
            opacity: status === 'confirming' || status === 'pending' ? 0.6 : 1,
            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
          }}
          onMouseEnter={(e) => { if (status === 'idle' || status === 'error') { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#f7f8f8'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.8)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f7f8f8'; e.currentTarget.style.color = '#0a0a0a'; e.currentTarget.style.border = 'none'; }}
        >
          {status === 'confirming' ? 'Confirm in Wallet...' : status === 'pending' ? 'Claiming...' : 'Claim Reward'}
        </button>
      )}

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF3B30', marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}

// ─── Main Profile Content ────────────────────────────────────────────

export function ProfileContent() {
  const { address, isConnected } = useAccount();
  const { t } = useLocale();
  const {
    fanProfile,
    activeStakes,
    claimableRewards,
    pastStakes,
    balance,
    isLoading,
    isError,
    refetch,
  } = useProfileData(address as `0x${string}` | undefined);

  const [tab, setTab] = useState<'history' | 'charity'>('history');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [address]);

  // ── Not Connected ──

  if (!isConnected) {
    return (
      <div style={{ minHeight: 'calc(100dvh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
              <path d="M21 12V7H5a2 2 0 010-4h14v4" />
              <path d="M3 5v14a2 2 0 002 2h16v-5" />
              <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            {t('profile.not_connected')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
            View your staking history, claimable rewards, and charity impact on PSL Fan Clash.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // ── Error State ──

  if (isError && !isLoading) {
    return (
      <div className="sc" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Failed to Load Profile
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
          Could not fetch on-chain data. Please check your connection and try again.
        </p>
        <button
          onClick={refetch}
          style={{
            height: 48, padding: '0 32px', background: 'transparent', color: '#f7f8f8',
            border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Connected ──

  const primaryTeam = fanProfile ? PSL_TEAMS.find((team) => team.id === fanProfile.primaryTeam) : null;
  const totalStaked = fanProfile ? parseFloat(fanProfile.totalStaked) : 0;
  const totalWon = fanProfile ? parseFloat(fanProfile.totalWon) : 0;
  const matchCount = fanProfile?.matchesParticipated ?? 0;
  const charityVotes = fanProfile?.charityVotesCast ?? 0;
  const profit = totalWon - totalStaked;
  const winRate = matchCount > 0 ? Math.round((totalWon > 0 ? (totalWon / totalStaked) * 100 : 0)) : 0;
  const allUserStakes = [...activeStakes, ...pastStakes];

  return (
    <div className="sc">
      {/* ── Profile Header ── */}
      <BlurFade delay={0.1} inView>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
          }}>
            {address ? address.slice(2, 4).toUpperCase() : '??'}
          </div>

          {/* Address + Copy */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#f7f8f8' }}>
              {address ? truncateAddress(address) : '--'}
            </p>
            <button
              onClick={handleCopy}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: copied ? '#34C759' : 'rgba(255,255,255,0.3)',
                transition: 'color 0.2s ease',
              }}
              title="Copy address"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {copied ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* WIRE Balance */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            {balance} WIRE
          </p>

          {/* Primary Team Badge */}
          {primaryTeam && fanProfile?.exists && (
            <div style={{
              display: 'inline-block', marginTop: 10, padding: '4px 14px',
              background: 'rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', borderRadius: 4,
            }}>
              {primaryTeam.name}
            </div>
          )}

          {/* Explorer Link */}
          <p style={{ marginTop: 8 }}>
            <a
              href={explorerAddressUrl(address ?? '')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'rgba(255,255,255,0.2)', textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              View on WireScan &rarr;
            </a>
          </p>
        </div>
      </BlurFade>

      {/* ── 4 Stat Cards ── */}
      <BlurFade delay={0.2} inView>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="md:!grid-cols-4">
          {/* TOTAL STAKED */}
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#f7f8f8' }}>
              {isLoading ? (
                <span style={{ opacity: 0.2 }}>--</span>
              ) : (
                <>
                  <NumberTicker value={Math.round(totalStaked * 100) / 100} delay={0.3} decimalPlaces={2} className="!text-white" />
                  <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.3)' }}> WIRE</span>
                </>
              )}
            </div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {t('profile.total_staked')}
            </p>
          </div>

          {/* TOTAL WON */}
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#f7f8f8' }}>
              {isLoading ? (
                <span style={{ opacity: 0.2 }}>--</span>
              ) : (
                <>
                  <NumberTicker value={Math.round(totalWon * 100) / 100} delay={0.4} decimalPlaces={2} className="!text-white" />
                  <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.3)' }}> WIRE</span>
                </>
              )}
            </div>
            {!isLoading && profit !== 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: profit > 0 ? '#34C759' : '#FF3B30', marginTop: 2 }}>
                {profit > 0 ? '+' : ''}{profit.toFixed(2)} WIRE
              </p>
            )}
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {t('profile.total_won')}
            </p>
          </div>

          {/* WIN RATE */}
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#f7f8f8' }}>
              {isLoading ? (
                <span style={{ opacity: 0.2 }}>--</span>
              ) : (
                <>
                  <NumberTicker value={matchCount} delay={0.5} className="!text-white" />
                </>
              )}
            </div>
            {!isLoading && matchCount > 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </p>
            )}
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {t('profile.matches_played')}
            </p>
          </div>

          {/* CHARITY IMPACT */}
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#f7f8f8' }}>
              {isLoading ? (
                <span style={{ opacity: 0.2 }}>--</span>
              ) : (
                <NumberTicker value={charityVotes} delay={0.6} className="!text-white" />
              )}
            </div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {t('profile.charity_votes')}
            </p>
          </div>
        </div>
      </BlurFade>

      {/* ── Claimable Rewards ── */}
      {claimableRewards.length > 0 && (
        <BlurFade delay={0.3} inView>
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              {t('profile.claimable')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }} className="md:!grid-cols-2 lg:!grid-cols-3">
              {claimableRewards.map((s) => (
                <ClaimRewardCard key={s.vaultAddress} stake={s} onClaimed={refetch} />
              ))}
            </div>
          </div>
        </BlurFade>
      )}

      {/* ── Active Stakes ── */}
      {activeStakes.length > 0 && (
        <BlurFade delay={0.35} inView>
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              {t('profile.active_stakes')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }} className="md:!grid-cols-2 lg:!grid-cols-3">
              {activeStakes.map((s, i) => {
                const stakedTeam = PSL_TEAMS.find((team) => team.id === s.userStakeTeamId);
                const deadline = s.stakingDeadline;
                const now = Date.now();
                const timeLeft = deadline > now ? deadline - now : 0;
                const hoursLeft = Math.floor(timeLeft / 3600000);
                const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

                return (
                  <motion.div
                    key={s.vaultAddress}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="glass-card"
                    style={{ padding: 24 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                        Match #{s.matchId}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px', borderRadius: 99,
                        background: s.state === 'OPEN' ? '#f7f8f8' : 'rgba(255,255,255,0.08)',
                        color: s.state === 'OPEN' ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                        fontWeight: 600, textTransform: 'uppercase',
                      }}>
                        {s.state}
                      </span>
                    </div>

                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                      {s.teamA} vs {s.teamB}
                    </p>

                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Your stake: {parseFloat(s.userStakeAmount).toFixed(4)} WIRE on {stakedTeam?.short ?? 'Team'}
                    </p>

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        Pool: {parseFloat(s.totalPool).toFixed(2)} WIRE
                      </span>
                      {s.state === 'OPEN' && timeLeft > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          {hoursLeft}h {minsLeft}m left
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/matches/${s.matchId}`}
                      style={{
                        display: 'block', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.1)', width: 'fit-content',
                      }}
                    >
                      View Match &rarr;
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </BlurFade>
      )}

      {/* ── Tabs: Staking History | Charity Votes ── */}
      <BlurFade delay={0.4} inView>
        <div style={{ marginTop: 48 }}>
          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
            {(['history', 'charity'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: 12,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: tab === tabKey ? '#f7f8f8' : 'rgba(255,255,255,0.25)',
                  borderBottom: tab === tabKey ? '2px solid #f7f8f8' : '2px solid transparent',
                  transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                  marginBottom: -1,
                }}
              >
                {tabKey === 'history' ? t('profile.staking_history') : t('profile.charity_votes')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'history' && (
            <div>
              {allUserStakes.length === 0 && !isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                    No Stakes Yet
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>
                    You haven&apos;t staked on any matches yet.
                  </p>
                  <Link
                    href="/matches"
                    style={{
                      display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 32px',
                      background: '#f7f8f8', color: '#0a0a0a', fontFamily: 'var(--font-mono)',
                      fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                      textDecoration: 'none',
                    }}
                  >
                    View Matches &rarr;
                  </Link>
                </div>
              ) : isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{ height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Match', 'Team', 'Stake', 'Result', 'Pool', 'Status'].map((h) => (
                          <th
                            key={h}
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.15em',
                              color: 'rgba(255,255,255,0.25)', textAlign: 'left',
                              padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allUserStakes.map((s) => {
                        const stakedTeam = PSL_TEAMS.find((team) => team.id === s.userStakeTeamId);
                        const isWinner = s.state === 'RESOLVED' && s.userStakeTeamId === s.winningTeam;
                        const isLoser = s.state === 'RESOLVED' && s.userStakeTeamId !== s.winningTeam;

                        return (
                          <tr key={s.vaultAddress} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                              <Link href={`/matches/${s.matchId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                #{s.matchId} {s.teamA} vs {s.teamB}
                              </Link>
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                              {stakedTeam?.short ?? '--'}
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#f7f8f8' }}>
                              {parseFloat(s.userStakeAmount).toFixed(4)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {s.state === 'RESOLVED' ? (
                                <span style={{
                                  fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px', borderRadius: 99,
                                  background: isWinner ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)',
                                  color: isWinner ? '#34C759' : '#FF3B30',
                                  fontWeight: 600, textTransform: 'uppercase',
                                }}>
                                  {isWinner ? 'WON' : 'LOST'}
                                </span>
                              ) : s.state === 'CANCELLED' ? (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                                  CANCELLED
                                </span>
                              ) : (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                              {parseFloat(s.totalPool).toFixed(2)} WIRE
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px', borderRadius: 99,
                                background: s.state === 'OPEN' ? '#f7f8f8' : 'rgba(255,255,255,0.06)',
                                color: s.state === 'OPEN' ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                                fontWeight: 600, textTransform: 'uppercase',
                              }}>
                                {s.userClaimed ? 'CLAIMED' : s.state}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'charity' && (
            <div>
              {charityVotes > 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, marginBottom: 8 }}>
                    {charityVotes}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    Charity Votes Cast
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 16, fontSize: 14, maxWidth: 400, margin: '16px auto 0' }}>
                    You have contributed to directing charity funds to causes that matter. Every vote shapes the impact of PSL Fan Clash.
                  </p>
                  <Link
                    href="/charity"
                    style={{
                      display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 24px', marginTop: 24,
                      border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#f7f8f8',
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none',
                    }}
                  >
                    View Charity Page &rarr;
                  </Link>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                    No Votes Yet
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                    Win a match and you will be able to vote on which charity receives 15% of the pool.
                  </p>
                  <Link
                    href="/charity"
                    style={{
                      display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 24px', marginTop: 24,
                      border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#f7f8f8',
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none',
                    }}
                  >
                    View Charities &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </BlurFade>

      {/* ── On-chain Note ── */}
      <div style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
          Profile data from SeasonLeaderboard contract on WireFluid Testnet
        </p>
      </div>
    </div>
  );
}
