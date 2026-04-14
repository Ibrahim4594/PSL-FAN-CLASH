'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BlurFade } from '@/components/ui/blur-fade';
import Image from 'next/image';
import { useSeasonStats, useTopFans, useAllTeamStats, useFanProfile } from '@/lib/hooks/useSeasonLeaderboard';
import { useLocale } from '@/lib/locale-context';
import { PSL_TEAMS } from '@/lib/teams';
import { truncateAddress } from '@/lib/utils';
import { Skeleton, SkeletonTableRow, SkeletonTeamCard } from '@/components/ui/skeleton';
import { useReadContracts } from 'wagmi';
import { SEASONLEADERBOARD_ABI } from '@/src/abi/SeasonLeaderboard.abi';
import { CONTRACTS } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';

const LEADERBOARD_ADDRESS = CONTRACTS.seasonLeaderboard as `0x${string}`;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#f7f8f8', color: '#0a0a0a', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>1</span>
  );
  if (rank === 2) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', color: '#0a0a0a', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>2</span>
  );
  if (rank === 3) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', color: '#f7f8f8', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>3</span>
  );
  return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.3)', width: 32, display: 'inline-block', textAlign: 'center' }}>{rank}</span>;
}

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{rate}%</span>
      <div style={{ width: 48, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: rate / 100 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', height: '100%', background: rate >= 60 ? '#f7f8f8' : 'rgba(255,255,255,0.4)', borderRadius: 2, transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
}

export function LeaderboardContent() {
  const [tab, setTab] = useState<'fans' | 'teams'>('fans');
  const { stats, isLoading: statsLoading } = useSeasonStats();
  const { t } = useLocale();

  const realStats = stats
    ? [
        { label: 'Total Fans', value: stats.totalFans },
        { label: 'WIRE Staked', value: Math.round(parseFloat(stats.totalStaked)) },
        { label: 'Charity Generated', value: Math.round(parseFloat(stats.totalCharity)) },
        { label: 'Matches Played', value: 0 },
      ]
    : [
        { label: 'Total Fans', value: 0 },
        { label: 'WIRE Staked', value: 0 },
        { label: 'Charity Generated', value: 0 },
        { label: 'Matches Played', value: 0 },
      ];

  return (
    <section style={{ paddingBottom: 80 }}>
      <div className="sc">
        {/* -- Page Header -- */}
        <BlurFade delay={0.1} inView>
          <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            {t('leaderboard.eyebrow')} &middot; March 26 &ndash; May 3, 2026
          </p>
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <h1 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: 48 }}>
            {t('leaderboard.title')}
          </h1>
        </BlurFade>

        {/* -- 4 Stat Cards -- */}
        <BlurFade delay={0.3} inView>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="md:!grid-cols-4" >
            {realStats.map((stat, i) => (
              <div key={stat.label} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f7f8f8' }}>
                  {statsLoading ? (
                    <Skeleton style={{ width: '60%', height: 28 }} />
                  ) : (
                    <NumberTicker value={stat.value} delay={0.3 + i * 0.1} className="!text-white" />
                  )}
                </div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </BlurFade>

        {/* -- Tab Switcher -- */}
        <div style={{ marginTop: 56, marginBottom: 32, display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { key: 'fans' as const, label: t('leaderboard.fans_tab') },
            { key: 'teams' as const, label: t('leaderboard.teams_tab') },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                padding: '14px 24px',
                minHeight: 48,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === item.key ? '2px solid #f7f8f8' : '2px solid transparent',
                color: tab === item.key ? '#f7f8f8' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* -- Tab Content -- */}
        {tab === 'fans' ? <FanLeaderboard /> : <TeamLeaderboard />}
      </div>
    </section>
  );
}

function FanLeaderboard() {
  const { fans, isLoading, error } = useTopFans(15);

  // Batch-read fan profiles for all top fans using multicall
  const profileContracts = fans.map((fan) => ({
    address: LEADERBOARD_ADDRESS,
    abi: SEASONLEADERBOARD_ABI,
    functionName: 'getFanProfile' as const,
    args: [fan.address] as const,
    chainId: wirefluid.id,
  }));

  const { data: profileData } = useReadContracts({
    contracts: profileContracts,
    query: { enabled: fans.length > 0, staleTime: 30_000 },
  });

  if (isLoading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Rank', 'Fan', 'Team', 'Total Staked', 'Matches', 'Charity Votes'].map((h, i) => (
                <th key={h} style={{
                  padding: '12px 8px',
                  textAlign: i >= 3 ? 'right' : 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.25)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (fans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>No fans have staked yet. Be the first!</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Rank', 'Fan', 'Team', 'Total Staked', 'Matches', 'Charity Votes'].map((h, i) => (
                <th key={h} style={{
                  padding: '12px 8px',
                  textAlign: i >= 3 ? 'right' : 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.25)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fans.map((fan, i) => {
              const profile = profileData?.[i]?.status === 'success' ? profileData[i].result as {
                totalStaked: bigint;
                totalWon: bigint;
                matchesParticipated: bigint;
                primaryTeam: number;
                charityVotesCast: bigint;
                exists: boolean;
              } : null;

              const team = profile ? PSL_TEAMS.find(t => t.id === profile.primaryTeam) : null;
              const matches = profile ? Number(profile.matchesParticipated) : 0;
              const charityVotes = profile ? Number(profile.charityVotesCast) : 0;

              return (
                <motion.tr
                  key={fan.address}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'default' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 8px' }}><RankBadge rank={i + 1} /></td>
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `rgba(255,255,255,${0.05 + (i % 5) * 0.03})`,
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                      }}>
                        {fan.address.slice(2, 4)}
                      </div>
                      <a href={`https://wirefluidscan.com/address/${fan.address}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#f7f8f8', textDecoration: 'none' }}>
                        {truncateAddress(fan.address)}
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '2px 10px', fontSize: 10, fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF3B30' }} />
                      {team?.short ?? '--'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {parseFloat(fan.totalStaked).toFixed(2)} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>WIRE</span>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{matches}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{charityVotes}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
          Data from SeasonLeaderboard contract on WireFluid
        </p>
      </div>
    </motion.div>
  );
}

function TeamLeaderboard() {
  const { teamStats, isLoading, error } = useAllTeamStats();
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="md:!grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonTeamCard key={i} />
        ))}
      </div>
    );
  }

  // Merge team stats with PSL_TEAMS info
  const TEAM_LOGOS: Record<string, string> = {
    ISL: '/teams/islamabad-united.png',
    KAR: '/teams/karachi-kings.png',
    LHR: '/teams/lahore-qalandars.png',
    MUL: '/teams/multan-sultans.png',
    PSH: '/teams/peshawar-zalmi.png',
    QUE: '/teams/quetta-gladiators.png',
    HYD: '/teams/hyderabad-kingsmen.png',
    RWP: '/teams/rawalpindi-pindiz.png',
  };

  const mergedTeams = teamStats.map((ts) => {
    const team = PSL_TEAMS.find(t => t.id === ts.teamId);
    return {
      ...ts,
      name: team?.name ?? `Team ${ts.teamId}`,
      short: team?.short ?? `T${ts.teamId}`,
      logo: team ? TEAM_LOGOS[team.short] : undefined,
      charityNum: parseFloat(ts.totalCharityGenerated),
      stakedNum: parseFloat(ts.totalStakedByFans),
    };
  }).sort((a, b) => b.charityNum - a.charityNum);

  const maxCharity = Math.max(...mergedTeams.map(t => t.charityNum), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="md:!grid-cols-2">
        {mergedTeams.map((team, i) => (
          <motion.div
            key={team.short}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card"
            style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}
          >
            {/* Rank + Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 56 }}>
              <RankBadge rank={i + 1} />
              <div style={{ width: 44, height: 44, position: 'relative' }}>
                {team.logo && !imgErrors[team.short] ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={44}
                    height={44}
                    style={{ objectFit: 'contain' }}
                    onError={() => setImgErrors(prev => ({ ...prev, [team.short]: true }))}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    {team.short}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <h3 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 18, fontWeight: 700 }}>{team.name}</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{team.short}</span>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 16 }} className="md:!grid-cols-4">
                {[
                  { label: 'Charity', val: team.charityNum.toFixed(2) },
                  { label: 'Fans', val: `${team.uniqueFans}` },
                  { label: 'Staked', val: team.stakedNum.toFixed(2) },
                  { label: 'Wins', val: `${team.wins}` },
                ].map((s) => (
                  <div key={s.label}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.val}</p>
                    <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Charity bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: team.charityNum / maxCharity }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: '100%', height: '100%', background: '#f7f8f8', borderRadius: 2, transformOrigin: 'left' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
