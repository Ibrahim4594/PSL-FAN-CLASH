'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { BlurFade } from '@/components/ui/blur-fade';
import { ConnectButton } from '@/components/ui/connect-button';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useWireBalance } from '@/lib/balance-context';
import { useMatchInfo, useUserStake, useStakeForTeam, useClaimReward } from '@/lib/hooks/useMatchVault';
import { useCharities, useVoteResults, useVotingPower, useHasVoted, useCastVote } from '@/lib/hooks/useCharityDAO';
import type { CharityData } from '@/lib/hooks/useCharityDAO';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { WeatherCard } from '@/components/sections/weather-card';
import { generateMatchAnalysis } from '@/lib/match-analysis';
import { useWeather } from '@/lib/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';
import { CONTRACTS, MATCH_VAULTS } from '@/lib/contracts';
import { MATCHFACTORY_ABI } from '@/src/abi/MatchFactory.abi';
import { useReadContract } from 'wagmi';
import { wirefluid } from '@/lib/chains';
import { explorerTxUrl } from '@/lib/utils';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {[{ l: 'Days', v: t.d }, { l: 'Hours', v: t.h }, { l: 'Min', v: t.m }, { l: 'Sec', v: t.s }].map((u) => (
        <div key={u.l} className="glass-card" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>{String(u.v).padStart(2, '0')}</p>
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{u.l}</p>
        </div>
      ))}
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const matchId = parseInt(id, 10);

  const { address, isConnected } = useAccount();
  const { balance: wireBalance, refetchBalance } = useWireBalance();

  // Step 1: Get vault address from MatchFactory
  const { data: vaultFromFactory } = useReadContract({
    address: CONTRACTS.matchFactory as `0x${string}`,
    abi: MATCHFACTORY_ABI,
    functionName: 'getMatch',
    args: [BigInt(matchId)],
    chainId: wirefluid.id,
    query: { enabled: !isNaN(matchId) },
  });

  // Also check static MATCH_VAULTS mapping as fallback
  const staticVault = MATCH_VAULTS[matchId]?.address as `0x${string}` | undefined;
  const vaultAddress = (vaultFromFactory as `0x${string}` | undefined) ?? staticVault;
  const isZeroAddress = vaultAddress === '0x0000000000000000000000000000000000000000';

  // Step 2: Read match info from vault
  const {
    matchInfo,
    isLoading: infoLoading,
    error: infoError,
    refetch: refetchInfo,
  } = useMatchInfo(isZeroAddress ? undefined : vaultAddress);

  // Step 3: Read user's stake
  const {
    stake: userStake,
    refetch: refetchStake,
  } = useUserStake(isZeroAddress ? undefined : vaultAddress, address);

  // Step 4: Write hooks
  const {
    stake: doStake,
    status: stakeStatus,
    txHash: stakeTxHash,
    error: stakeError,
    reset: resetStake,
  } = useStakeForTeam(isZeroAddress ? undefined : vaultAddress);

  const {
    claim: doClaim,
    status: claimStatus,
    txHash: claimTxHash,
    error: claimError,
    reset: resetClaim,
  } = useClaimReward(isZeroAddress ? undefined : vaultAddress);

  // Charity voting hooks
  const { charities, isLoading: charitiesLoading } = useCharities();
  const { voteResult, refetch: refetchVoteResult } = useVoteResults(matchId);
  const { data: votingPowerRaw } = useVotingPower(matchId, address as `0x${string}` | undefined);
  const { data: hasVotedRaw, refetch: refetchHasVoted } = useHasVoted(matchId, address as `0x${string}` | undefined);
  const {
    castVote,
    status: voteStatus,
    txHash: voteTxHash,
    error: voteError,
    reset: resetVote,
  } = useCastVote();

  const hasVoted = hasVotedRaw as boolean | undefined;
  const votingPower = votingPowerRaw as bigint | undefined;
  const hasVotingPower = votingPower !== undefined && votingPower > BigInt(0);

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedCharity, setSelectedCharity] = useState<number | null>(null);

  // Computed values
  const poolA = matchInfo ? parseFloat(matchInfo.teamAPool) : 0;
  const poolB = matchInfo ? parseFloat(matchInfo.teamBPool) : 0;
  const total = poolA + poolB;
  const pctA = total > 0 ? Math.round((poolA / total) * 100) : 50;
  const pctB = 100 - pctA;

  // Can the user claim?
  const canClaim = useMemo(() => {
    if (!matchInfo || matchInfo.state !== 'RESOLVED') return false;
    if (!userStake || userStake.amountWei === BigInt(0)) return false;
    if (userStake.claimed) return false;
    if (userStake.teamId !== matchInfo.winningTeam) return false;
    return true;
  }, [matchInfo, userStake]);

  // Handle successful stake -- refetch balance so the entire app updates
  useEffect(() => {
    if (stakeStatus === 'success') {
      refetchInfo();
      refetchStake();
      refetchBalance();
    }
  }, [stakeStatus, refetchInfo, refetchStake, refetchBalance]);

  useEffect(() => {
    if (claimStatus === 'success') {
      refetchInfo();
      refetchStake();
      refetchBalance();
    }
  }, [claimStatus, refetchInfo, refetchStake, refetchBalance]);

  useEffect(() => {
    if (voteStatus === 'success') {
      refetchVoteResult();
      refetchHasVoted();
    }
  }, [voteStatus, refetchVoteResult, refetchHasVoted]);

  const handleStake = async () => {
    if (selectedTeam === null || !stakeAmount || parseFloat(stakeAmount) <= 0) return;
    await doStake(selectedTeam, stakeAmount);
  };

  const handleClaim = async () => {
    await doClaim();
  };

  const handleVote = async () => {
    if (selectedCharity === null) return;
    await castVote(matchId, selectedCharity);
  };

  // Derive active charities for voting
  const activeCharities = charities.filter((c: CharityData) => c.active);

  // Find the winning charity name for display
  const winningCharityName = voteResult && voteResult.executed
    ? charities.find((c: CharityData) => c.id === voteResult.winningCharityId)?.name ?? `Charity #${voteResult.winningCharityId}`
    : null;

  // Find the charity the user voted for
  const votedCharityName = hasVoted && selectedCharity !== null
    ? charities.find((c: CharityData) => c.id === selectedCharity)?.name ?? null
    : null;

  // Loading state
  if (infoLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 pt-32" style={{ paddingBottom: 80 }}>
          <div className="sc">
            {/* Back link skeleton */}
            <Skeleton style={{ width: 120, height: 13, marginBottom: 32 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:!grid-cols-[1fr_360px]">
              {/* LEFT: Match info skeleton */}
              <div>
                {/* Match # + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Skeleton style={{ width: 72, height: 12 }} />
                  <Skeleton style={{ width: 56, height: 18, borderRadius: 99 }} />
                </div>

                {/* Team names */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
                  <Skeleton style={{ width: 100, height: 48 }} />
                  <Skeleton style={{ width: 20, height: 14 }} />
                  <Skeleton style={{ width: 100, height: 48 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 8 }}>
                  <Skeleton style={{ width: 96, height: 12 }} />
                  <Skeleton style={{ width: 96, height: 12 }} />
                </div>

                {/* Pool visualization */}
                <div style={{ marginTop: 48, marginBottom: 48 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Skeleton style={{ width: 140, height: 32, marginBottom: 4 }} />
                      <Skeleton style={{ width: 36, height: 12 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Skeleton style={{ width: 140, height: 32, marginBottom: 4 }} />
                      <Skeleton style={{ width: 36, height: 12 }} />
                    </div>
                  </div>
                  <Skeleton style={{ width: '100%', height: 6, borderRadius: 3 }} />
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                    <Skeleton style={{ width: 160, height: 11 }} />
                  </div>
                </div>

                {/* Countdown skeleton */}
                <div style={{ marginBottom: 48 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                    <Skeleton style={{ width: 100, height: 10 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="glass-card" style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <Skeleton style={{ width: '60%', height: 28, margin: '0 auto 4px' }} />
                        <Skeleton style={{ width: '40%', height: 9, margin: '0 auto' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charity note skeleton */}
                <div className="glass-card" style={{ padding: 24 }}>
                  <Skeleton style={{ width: '70%', height: 10, marginBottom: 8 }} />
                  <Skeleton style={{ width: '90%', height: 13, marginBottom: 4 }} />
                  <Skeleton style={{ width: '50%', height: 12, marginTop: 8 }} />
                </div>
              </div>

              {/* RIGHT: Staking panel skeleton */}
              <div>
                <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 96 }}>
                  <Skeleton style={{ width: '60%', height: 20, marginBottom: 24 }} />
                  <Skeleton style={{ width: '50%', height: 13, margin: '0 auto 12px', display: 'block' }} />
                  <Skeleton style={{ width: '40%', height: 40, margin: '0 auto', borderRadius: 4, display: 'block' }} />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error or no match found
  if (infoError || !matchInfo) {
    return (
      <>
        <Header />
        <main className="flex-1 pt-32" style={{ paddingBottom: 80 }}>
          <div className="sc" style={{ textAlign: 'center', paddingTop: 80 }}>
            <h2 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Match Not Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
              Match #{id} could not be loaded from the blockchain.
            </p>
            <Link href="/matches" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              Back to Matches
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-32" style={{ paddingBottom: 80 }}>
        <div className="sc">
          <BlurFade delay={0.1} inView>
            <Link href="/matches" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'inline-block', marginBottom: 32, transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f7f8f8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
              &larr; Back to Matches
            </Link>
          </BlurFade>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:!grid-cols-[1fr_360px]">
            {/* -- LEFT: Match Info -- */}
            <div>
              <BlurFade delay={0.15} inView>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Match #{id}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, padding: '3px 12px', borderRadius: 99,
                    background: matchInfo.state === 'OPEN' ? '#f7f8f8' : 'rgba(255,255,255,0.08)',
                    color: matchInfo.state === 'OPEN' ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                    fontWeight: 600, textTransform: 'uppercase',
                  }}>{matchInfo.state}</span>
                </div>
              </BlurFade>

              {/* Teams */}
              <BlurFade delay={0.2} inView>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
                  <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 700 }}>{matchInfo.teamAShort}</p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(255,255,255,0.15)' }}>VS</span>
                  <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 700 }}>{matchInfo.teamBShort}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{matchInfo.teamAName}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{matchInfo.teamBName}</span>
                </div>
                {vaultAddress && (
                  <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
                    Vault: <a href={`https://wirefluidscan.com/address/${vaultAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.2)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
                    </a>
                  </p>
                )}
              </BlurFade>

              {/* Pool Visualization */}
              <BlurFade delay={0.3} inView>
                <div style={{ marginTop: 48, marginBottom: 48 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 32, fontWeight: 700 }}>{poolA.toFixed(2)} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>WIRE</span></p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{pctA}%</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 32, fontWeight: 700 }}>{poolB.toFixed(2)} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>WIRE</span></p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{pctB}%</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} style={{ width: `${pctA}%`, background: '#f7f8f8', borderRadius: '3px 0 0 3px', transformOrigin: 'left' }} />
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '0 3px 3px 0' }} />
                  </div>
                  <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>{total.toFixed(2)} WIRE Total Pool</p>
                </div>
              </BlurFade>

              {/* Countdown */}
              {matchInfo.state === 'OPEN' && (
                <BlurFade delay={0.4} inView>
                  <div style={{ marginBottom: 48 }}>
                    <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 12 }}>Staking closes in</p>
                    <Countdown targetTs={matchInfo.stakingDeadline} />
                  </div>
                </BlurFade>
              )}

              {/* NASA Weather Data */}
              <BlurFade delay={0.4} inView>
                <div style={{ marginBottom: 32 }}>
                  <WeatherCard teamCode={matchInfo.teamAShort} />
                </div>
              </BlurFade>

              {/* AI Match Analysis */}
              <MatchAnalysisCard teamA={matchInfo.teamAShort} teamB={matchInfo.teamBShort} />

              {/* User's stake info */}
              {userStake && userStake.amountWei > BigInt(0) && (
                <BlurFade delay={0.45} inView>
                  <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>Your Stake</p>
                    <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {parseFloat(userStake.amount).toFixed(4)} WIRE
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
                        for {userStake.teamId === matchInfo.teamAId ? matchInfo.teamAShort : matchInfo.teamBShort}
                      </span>
                    </p>
                    {userStake.claimed && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#34C759', marginTop: 4 }}>Reward claimed</p>
                    )}
                  </div>
                </BlurFade>
              )}

              {/* Charity Voting Section — only visible when RESOLVED */}
              {matchInfo.state === 'RESOLVED' && (
                <BlurFade delay={0.5} inView>
                  <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>Charity Vote</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                        {(total * 0.15).toFixed(2)} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>WIRE Pool</span>
                      </p>
                    </div>

                    {/* State: Voting executed — show result */}
                    {voteResult && voteResult.executed && (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#34C759', marginBottom: 8 }}>Funds Distributed</p>
                        <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                          {winningCharityName}
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                          Received {voteResult.charityPool} WIRE
                        </p>
                        {voteResult.vaultAddress && voteResult.vaultAddress !== '0x0000000000000000000000000000000000000000' && (
                          <a
                            href={`https://wirefluidscan.com/address/${voteResult.vaultAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
                          >
                            View on WireScan
                          </a>
                        )}
                      </div>
                    )}

                    {/* State: Not connected */}
                    {!voteResult?.executed && !isConnected && (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Connect wallet to vote</p>
                        <ConnectButton />
                      </div>
                    )}

                    {/* State: Connected, voting not started */}
                    {!voteResult?.executed && isConnected && voteResult && voteResult.startTime === 0 && (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Voting has not started yet</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>Charity voting will open after match resolution is finalized.</p>
                      </div>
                    )}

                    {/* State: Connected, user already voted */}
                    {!voteResult?.executed && isConnected && hasVoted && (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#34C759', marginBottom: 8 }}>Vote Cast</p>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                          You voted for <span style={{ color: '#f7f8f8', fontWeight: 700 }}>{votedCharityName ?? 'a charity'}</span>
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>Results will be finalized after the 48hr voting window.</p>
                      </div>
                    )}

                    {/* State: Connected, can vote (has voting power, hasn't voted, voting is active) */}
                    {!voteResult?.executed && isConnected && !hasVoted && hasVotingPower && voteResult && voteResult.startTime > 0 && (
                      <>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                          Select a charity to receive {(total * 0.15).toFixed(2)} WIRE from this match pool. Your vote is weighted by your stake.
                        </p>

                        {/* Charity cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {charitiesLoading && (
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 16 }}>Loading charities...</p>
                          )}
                          {activeCharities.map((charity: CharityData) => (
                            <button
                              key={charity.id}
                              onClick={() => setSelectedCharity(charity.id)}
                              disabled={voteStatus === 'confirming' || voteStatus === 'pending'}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', minHeight: 48,
                                background: selectedCharity === charity.id ? '#f7f8f8' : 'rgba(255,255,255,0.03)',
                                color: selectedCharity === charity.id ? '#0a0a0a' : '#f7f8f8',
                                border: selectedCharity === charity.id ? '1px solid #f7f8f8' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 6, cursor: 'pointer',
                                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                                opacity: voteStatus === 'confirming' || voteStatus === 'pending' ? 0.5 : 1,
                                textAlign: 'left', width: '100%',
                              }}
                            >
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{charity.name}</p>
                                {charity.description && (
                                  <span style={{
                                    display: 'inline-block', marginTop: 4, padding: '2px 8px',
                                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em',
                                    borderRadius: 99,
                                    background: selectedCharity === charity.id ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)',
                                    color: selectedCharity === charity.id ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
                                  }}>
                                    {charity.description}
                                  </span>
                                )}
                              </div>
                              <div style={{
                                width: 18, height: 18, borderRadius: '50%',
                                border: selectedCharity === charity.id ? '2px solid #0a0a0a' : '2px solid rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {selectedCharity === charity.id && (
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a0a0a' }} />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Vote button */}
                        <button
                          disabled={selectedCharity === null || voteStatus === 'confirming' || voteStatus === 'pending'}
                          onClick={handleVote}
                          style={{
                            width: '100%', padding: '14px 0', minHeight: 48,
                            background: voteStatus === 'confirming' || voteStatus === 'pending' ? 'rgba(255,255,255,0.08)' : selectedCharity !== null ? '#f7f8f8' : 'rgba(255,255,255,0.08)',
                            color: voteStatus === 'confirming' || voteStatus === 'pending' ? 'rgba(255,255,255,0.5)' : selectedCharity !== null ? '#0a0a0a' : 'rgba(255,255,255,0.2)',
                            border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 14,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                            cursor: selectedCharity !== null && voteStatus === 'idle' ? 'pointer' : 'default',
                            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                          }}
                        >
                          {voteStatus === 'confirming' ? 'CONFIRM IN WALLET...' :
                           voteStatus === 'pending' ? 'SUBMITTING VOTE...' :
                           'Cast Vote'}
                        </button>

                        {/* Vote tx feedback */}
                        {voteStatus === 'success' && voteTxHash && (
                          <div style={{ marginTop: 12, padding: 12, background: 'rgba(52,199,89,0.1)', borderRadius: 6 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#34C759', marginBottom: 4 }}>Vote submitted!</p>
                            <a href={explorerTxUrl(voteTxHash)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                              View on WireScan: {voteTxHash.slice(0, 10)}...
                            </a>
                          </div>
                        )}

                        {voteStatus === 'error' && voteError && (
                          <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,59,48,0.1)', borderRadius: 6 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF3B30' }}>{voteError}</p>
                            <button onClick={resetVote} style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                              Try again
                            </button>
                          </div>
                        )}

                        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)', marginTop: 12 }}>
                          Vote is stake-weighted &middot; 48hr voting window
                        </p>
                      </>
                    )}

                    {/* State: Connected but no voting power (not a winning staker) */}
                    {!voteResult?.executed && isConnected && !hasVoted && !hasVotingPower && voteResult && voteResult.startTime > 0 && (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Only winning stakers can vote</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>You must have staked on the winning team to participate in charity voting.</p>
                      </div>
                    )}
                  </div>
                </BlurFade>
              )}

              {/* Live activity feed for this match */}
              <div className="glass-card" style={{ padding: 24, marginTop: 32, marginBottom: 32 }}>
                <ActivityFeed
                  vaultAddress={vaultAddress}
                  maxItems={8}
                  title="RECENT ACTIVITY"
                />
              </div>

              {/* Charity note */}
              <BlurFade delay={0.55} inView>
                <div className="glass-card" style={{ padding: 24, marginTop: 32 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>15% of this pool goes to charity</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Winning fans will vote on the charity recipient after match resolution.</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Current charity pool: {(total * 0.15).toFixed(2)} WIRE</p>
                </div>
              </BlurFade>
            </div>

            {/* -- RIGHT: Staking Panel -- */}
            <div>
              <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 96 }}>
                {matchInfo.state === 'OPEN' ? (
                  <>
                    <h3 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Place Your Stake</h3>

                    {!isConnected && (
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Connect your wallet to stake</p>
                        <ConnectButton />
                      </div>
                    )}

                    {isConnected && (
                      <>
                        {/* Team selector */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                          {[
                            { id: matchInfo.teamAId, short: matchInfo.teamAShort },
                            { id: matchInfo.teamBId, short: matchInfo.teamBShort },
                          ].map((team) => (
                            <button
                              key={team.id}
                              onClick={() => setSelectedTeam(team.id)}
                              disabled={stakeStatus === 'confirming' || stakeStatus === 'pending'}
                              style={{
                                padding: '14px 0', minHeight: 48, textAlign: 'center', borderRadius: 6, fontSize: 16,
                                fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
                                background: selectedTeam === team.id ? '#f7f8f8' : 'rgba(255,255,255,0.04)',
                                color: selectedTeam === team.id ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                                border: selectedTeam === team.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                                opacity: stakeStatus === 'confirming' || stakeStatus === 'pending' ? 0.5 : 1,
                              }}
                            >
                              {team.short}
                            </button>
                          ))}
                        </div>

                        {/* Amount input */}
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>Stake Amount</p>
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            disabled={stakeStatus === 'confirming' || stakeStatus === 'pending'}
                            min="0.01"
                            step="0.01"
                            style={{
                              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 6, padding: '14px 80px 14px 16px', fontSize: 22, fontFamily: 'var(--font-mono)',
                              color: '#f7f8f8', outline: 'none',
                            }}
                          />
                          <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>WIRE</span>
                        </div>

                        {/* Quick amounts */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {['0.1', '1', '5', 'MAX'].map((q) => (
                            <button key={q} onClick={() => setStakeAmount(q === 'MAX' ? wireBalance : q)} disabled={stakeStatus === 'confirming' || stakeStatus === 'pending'} style={{
                              flex: 1, padding: '10px 0', minHeight: 44, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                            }}>
                              {q === 'MAX' ? 'MAX' : `${q} WIRE`}
                            </button>
                          ))}
                        </div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>Balance: {wireBalance} WIRE</p>

                        {/* Summary */}
                        {stakeAmount && selectedTeam !== null && (
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 14, marginBottom: 16, fontSize: 13 }}>
                            <p>Your stake: {stakeAmount} WIRE for {selectedTeam === matchInfo.teamAId ? matchInfo.teamAShort : matchInfo.teamBShort}</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>If your team wins, est. return: ~{(parseFloat(stakeAmount || '0') * 1.64).toFixed(2)} WIRE</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Charity contribution: ~{(parseFloat(stakeAmount || '0') * 0.15).toFixed(3)} WIRE</p>
                          </div>
                        )}

                        {/* Stake button */}
                        <button
                          disabled={selectedTeam === null || !stakeAmount || parseFloat(stakeAmount) < 0.01 || stakeStatus === 'confirming' || stakeStatus === 'pending'}
                          onClick={handleStake}
                          style={{
                            width: '100%', padding: '14px 0', minHeight: 48,
                            background: stakeStatus === 'confirming' || stakeStatus === 'pending' ? 'rgba(255,255,255,0.08)' : selectedTeam !== null && stakeAmount ? '#f7f8f8' : 'rgba(255,255,255,0.08)',
                            color: stakeStatus === 'confirming' || stakeStatus === 'pending' ? 'rgba(255,255,255,0.5)' : selectedTeam !== null && stakeAmount ? '#0a0a0a' : 'rgba(255,255,255,0.2)',
                            border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 14,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                            cursor: selectedTeam !== null && stakeAmount && stakeStatus === 'idle' ? 'pointer' : 'default',
                            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                          }}
                        >
                          {stakeStatus === 'confirming' ? 'CONFIRM IN WALLET...' :
                           stakeStatus === 'pending' ? 'STAKING...' :
                           'Stake WIRE'}
                        </button>

                        {/* Tx feedback */}
                        {stakeStatus === 'success' && stakeTxHash && (
                          <div style={{ marginTop: 12, padding: 12, background: 'rgba(52,199,89,0.1)', borderRadius: 6 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#34C759', marginBottom: 4 }}>Stake confirmed!</p>
                            <a href={explorerTxUrl(stakeTxHash)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                              View on WireScan: {stakeTxHash.slice(0, 10)}...
                            </a>
                          </div>
                        )}

                        {stakeStatus === 'error' && stakeError && (
                          <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,59,48,0.1)', borderRadius: 6 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF3B30' }}>{stakeError}</p>
                            <button onClick={resetStake} style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                              Try again
                            </button>
                          </div>
                        )}

                        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)', marginTop: 12 }}>Min stake: 0.01 WIRE &middot; Closes at match start</p>
                      </>
                    )}
                  </>
                ) : matchInfo.state === 'LOCKED' ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Match in progress</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>Results will be announced after the match</p>
                    {userStake && userStake.amountWei > BigInt(0) && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
                        Your stake: {parseFloat(userStake.amount).toFixed(4)} WIRE for {userStake.teamId === matchInfo.teamAId ? matchInfo.teamAShort : matchInfo.teamBShort}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{matchInfo.winner} Won</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Match resolved</p>

                    {isConnected && canClaim && (
                      <>
                        <button
                          onClick={handleClaim}
                          disabled={claimStatus === 'confirming' || claimStatus === 'pending'}
                          style={{
                            marginTop: 20, width: '100%', padding: '14px 0', minHeight: 48,
                            background: claimStatus !== 'idle' ? 'rgba(255,255,255,0.08)' : '#f7f8f8',
                            color: claimStatus !== 'idle' ? 'rgba(255,255,255,0.5)' : '#0a0a0a',
                            border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 14,
                            fontWeight: 700, textTransform: 'uppercase', cursor: claimStatus === 'idle' ? 'pointer' : 'default',
                            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                          }}
                        >
                          {claimStatus === 'confirming' ? 'CONFIRM IN WALLET...' :
                           claimStatus === 'pending' ? 'CLAIMING...' :
                           'Claim Rewards'}
                        </button>

                        {claimStatus === 'success' && claimTxHash && (
                          <div style={{ marginTop: 12, padding: 12, background: 'rgba(52,199,89,0.1)', borderRadius: 6 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#34C759', marginBottom: 4 }}>Reward claimed!</p>
                            <a href={explorerTxUrl(claimTxHash)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                              View on WireScan: {claimTxHash.slice(0, 10)}...
                            </a>
                          </div>
                        )}

                        {claimStatus === 'error' && claimError && (
                          <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,59,48,0.1)', borderRadius: 6 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF3B30' }}>{claimError}</p>
                            <button onClick={resetClaim} style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                              Try again
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {isConnected && userStake && userStake.claimed && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#34C759', marginTop: 16 }}>
                        Reward already claimed
                      </p>
                    )}

                    {!isConnected && (
                      <div style={{ marginTop: 20 }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Connect wallet to check rewards</p>
                        <ConnectButton />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function MatchAnalysisCard({ teamA, teamB }: { teamA: string; teamB: string }) {
  const { weather } = useWeather(teamA);
  const analysis = generateMatchAnalysis(
    teamA, teamB,
    weather ? { temperature: weather.weather.temperature, humidity: weather.weather.humidity, precipitation: weather.weather.precipitation } : undefined
  );

  const [showHow, setShowHow] = useState(false);
  const confColor = analysis.confidence === 'HIGH' ? '#34C759' : analysis.confidence === 'MEDIUM' ? '#FFC700' : 'rgba(255,255,255,0.4)';

  return (
    <BlurFade delay={0.45} inView>
      <div style={{ marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
                AI Match Analysis
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {analysis.favoredTeam} favored at {Math.max(...analysis.winProbability)}%
              </p>
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
              padding: '3px 8px', borderRadius: 4,
              background: `${confColor}15`, color: confColor,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {analysis.confidence} confidence
            </span>
          </div>

          {/* Win Probability Bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              <span>{teamA} {analysis.winProbability[0]}%</span>
              <span>{teamB} {analysis.winProbability[1]}%</span>
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${analysis.winProbability[0]}%`, background: '#f7f8f8', borderRadius: '3px 0 0 3px' }} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '0 3px 3px 0' }} />
            </div>
          </div>

          {/* Factors Table */}
          <div style={{ marginBottom: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 9, textTransform: 'uppercase' }}>Factor</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>Weight</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{teamA}</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{teamB}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.factors.map(f => (
                  <tr key={f.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{f.name}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>{f.weight}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: f.advantage === 'A' ? '#34C759' : 'rgba(255,255,255,0.5)' }}>{f.teamA}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: f.advantage === 'B' ? '#34C759' : 'rgba(255,255,255,0.5)' }}>{f.teamB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Battle */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Key Battle</p>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{analysis.keyBattle}</p>

          {/* Analyst Reasoning */}
          <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6 }}>
            {analysis.reasoning.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: i < analysis.reasoning.split('\n\n').length - 1 ? 12 : 0 }}>
                {para}
              </p>
            ))}
          </div>

          {/* How it works toggle */}
          <button
            onClick={() => setShowHow(!showHow)}
            style={{
              marginTop: 16, background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0,
            }}
          >
            {showHow ? '− Hide' : '+ How does this work?'}
          </button>
          {showHow && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                Our analysis engine evaluates 4 factors: Season Win Rate (40%), Recent Form (30%), Head-to-Head Record (20%), and Team Strength (10%), adjusted for real-time NASA weather data at the match stadium. Weather conditions are factored in using cricket-specific logic — humidity aids swing bowling, heat favors batting, rain triggers DLS probability. All computation runs locally on-chain data — zero external AI API dependency.
              </p>
            </div>
          )}
        </div>
      </div>
    </BlurFade>
  );
}
