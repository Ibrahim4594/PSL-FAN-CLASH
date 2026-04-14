'use client';

import { Terminal, TypingAnimation, AnimatedSpan } from '@/components/ui/terminal';
import { BlurFade } from '@/components/ui/blur-fade';
import { useLocale } from '@/lib/locale-context';

export function StakingTerminal() {
  const { t } = useLocale();
  return (
    <section
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0a0a',
        paddingTop: '120px',
        paddingBottom: '120px',
        overflowX: 'hidden',
      }}
    >
      <div className="sc" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BlurFade delay={0.1} inView>
          <p className="tc" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: '20px',
          }}>
            {t('terminal.eyebrow')}
          </p>
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <h2 className="tc font-['Clash_Display',sans-serif]" style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 700,
            marginBottom: '16px',
          }}>
            {t('terminal.title')}
          </h2>
        </BlurFade>
        <BlurFade delay={0.3} inView>
          <p className="tc mc" style={{
            maxWidth: '500px',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '48px',
            lineHeight: 1.7,
          }}>
            Every transaction is on-chain. Transparent, trustless, and verifiable on WireScan.
          </p>
        </BlurFade>

        <BlurFade delay={0.4} inView>
          <Terminal className="w-full max-w-2xl overflow-hidden">
            <TypingAnimation>&gt; psl-fanclash connect --chain wirefluid</TypingAnimation>

            <AnimatedSpan className="text-[#34C759]">
              ✔ Connected to WireFluid Testnet (Chain ID: 92533)
            </AnimatedSpan>

            <AnimatedSpan className="text-white/40">
              Wallet: 0x7a3f...b2c1 | Balance: 50.00 WIRE
            </AnimatedSpan>

            <TypingAnimation>&gt; stake --match 1 --team &quot;Lahore Qalandars&quot; --amount 5</TypingAnimation>

            <AnimatedSpan className="text-white/60">
              Locking 5 WIRE into MatchVault #1...
            </AnimatedSpan>

            <AnimatedSpan className="text-[#34C759]">
              ✔ Staked! Tx: 0xab3d...f291
            </AnimatedSpan>

            <AnimatedSpan className="text-white/40">
              Pool: LHR 250 WIRE vs HYD 189 WIRE
            </AnimatedSpan>

            <TypingAnimation>&gt; match resolve --id 1 --winner &quot;Lahore Qalandars&quot;</TypingAnimation>

            <AnimatedSpan className="text-[#34C759]">
              ✔ Match resolved! Winners: Lahore Qalandars
            </AnimatedSpan>

            <AnimatedSpan className="text-white">
              → 82% to winners: 8.2 WIRE claimed
            </AnimatedSpan>

            <AnimatedSpan className="text-white">
              → 15% to charity: Edhi Foundation (voted)
            </AnimatedSpan>

            <AnimatedSpan className="text-white/40">
              → 3% platform fee
            </AnimatedSpan>

            <TypingAnimation>&gt; Your rivalry. Their future. _</TypingAnimation>
          </Terminal>
        </BlurFade>
      </div>
    </section>
  );
}
