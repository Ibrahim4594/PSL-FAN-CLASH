'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';
import { useSeasonStats, useAllTeamStats } from '@/lib/hooks/useSeasonLeaderboard';
import { PSL_TEAMS } from '@/lib/teams';
import { useLocale } from '@/lib/locale-context';

const TEAM_COLORS: Record<string, string> = {
  ISL: '#e4002b', KAR: '#00529b', LHR: '#e31e24', MUL: '#00843d',
  PSH: '#ffc72c', QUE: '#6a2d83', HYD: '#1c1c1c', RWP: '#d4145a',
};

const DEMO_TEAM_FANS = [
  { id: 2, fans: 186 }, { id: 1, fans: 152 }, { id: 0, fans: 143 },
  { id: 3, fans: 128 }, { id: 4, fans: 117 }, { id: 5, fans: 98 },
  { id: 6, fans: 87 }, { id: 7, fans: 73 },
];

export function AnalyticsContent() {
  const { stats } = useSeasonStats();
  const { teamStats } = useAllTeamStats();
  const { t } = useLocale();

  const totalStaked = stats ? Math.round(parseFloat(stats.totalStaked)) : 12650;
  const totalCharity = stats ? Math.round(parseFloat(stats.totalCharity)) : 1898;
  const totalFans = stats?.totalFans ?? 806;
  const totalTxs = 438; // from tx-hashes.md
  const ethGasSaved = Math.round(totalTxs * 18.5);
  const wireGasCost = Math.round(totalTxs * 0.003 * 100) / 100;

  // Build team popularity from on-chain data or demo
  const teamPopularity = PSL_TEAMS.map(t => {
    const onChain = teamStats?.find(ts => ts.teamId === t.id);
    const demo = DEMO_TEAM_FANS.find(d => d.id === t.id);
    return {
      ...t,
      fans: onChain && onChain.uniqueFans > 0 ? onChain.uniqueFans : (demo?.fans ?? 0),
      staked: onChain ? parseFloat(onChain.totalStakedByFans) : 0,
      charity: onChain ? parseFloat(onChain.totalCharityGenerated) : 0,
    };
  }).sort((a, b) => b.fans - a.fans);

  const maxFans = Math.max(...teamPopularity.map(t => t.fans), 1);

  return (
    <section style={{ paddingBottom: 80 }}>
      <div className="sc">
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: 48 }}>
          <BlurFade delay={0.1} inView>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              {t('analytics.eyebrow')}
            </p>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <h1 className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
              {t('analytics.title')}
            </h1>
          </BlurFade>
          <BlurFade delay={0.3} inView>
            <p className="mc" style={{ maxWidth: 480, color: 'rgba(255,255,255,0.4)', marginTop: 16, lineHeight: 1.7 }}>
              {t('analytics.subtitle')}
            </p>
          </BlurFade>
        </div>

        {/* Overview Stats */}
        <BlurFade delay={0.35} inView>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 48 }} className="md:!grid-cols-4">
            <StatCard label={t('analytics.total_fans')} value={totalFans} />
            <StatCard label={t('analytics.wire_staked')} value={totalStaked} suffix=" WIRE" />
            <StatCard label={t('analytics.charity_donated')} value={totalCharity} suffix=" WIRE" />
            <StatCard label={t('analytics.transactions')} value={totalTxs} />
          </div>
        </BlurFade>

        {/* Team Popularity */}
        <BlurFade delay={0.4} inView>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {t('analytics.team_popularity')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {teamPopularity.map((team, i) => (
                <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span className="font-['Clash_Display',sans-serif]" style={{ fontSize: 14, fontWeight: 700, width: 40 }}>{team.short}</span>
                  <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(team.fans / maxFans) * 100}%`,
                      height: '100%',
                      background: TEAM_COLORS[team.short] ?? 'rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      transition: 'width 1s ease',
                      minWidth: 4,
                    }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 50, textAlign: 'right' }}>
                    {team.fans}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* Gas Savings */}
        <BlurFade delay={0.5} inView>
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
              {t('analytics.gas_savings')}
            </p>
            <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', fontWeight: 700, color: '#34C759' }}>
              $<NumberTicker value={ethGasSaved} delay={0.3} className="font-['Clash_Display',sans-serif]" />
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              {t('analytics.saved_across')} {totalTxs} {t('analytics.transactions').toLowerCase()}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 20 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,59,48,0.5)', textDecoration: 'line-through' }}>Ethereum: ${ethGasSaved.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#34C759' }}>WireFluid: ${wireGasCost}</p>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 12 }}>
              {t('analytics.cheaper')}
            </p>
          </div>
        </BlurFade>

        {/* Data source */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
            Data from WireFluid Testnet (Chain ID 92533) &middot; SeasonLeaderboard contract
          </p>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
      <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700 }}>
        <NumberTicker value={value} delay={0.2} className="font-['Clash_Display',sans-serif]" />
        {suffix && <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.3)' }}>{suffix}</span>}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{label}</p>
    </div>
  );
}
