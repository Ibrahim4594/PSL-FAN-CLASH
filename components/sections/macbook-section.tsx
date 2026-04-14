'use client';

import dynamic from 'next/dynamic';
import { BlurFade } from '@/components/ui/blur-fade';

const MacbookScroll = dynamic(
  () => import('@/components/ui/macbook-scroll').then(mod => ({ default: mod.MacbookScroll })),
  { ssr: false }
);

export function MacbookSection() {
  return (
    <section
      style={{
        background: '#0a0a0a',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="hidden md:block">
        <MacbookScroll
          title={
            <span
              className="font-['Clash_Display',sans-serif]"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 700,
                color: '#f7f8f8',
                textAlign: 'center',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                display: 'block',
              }}
            >
              Stake. Win.
              <br />
              Fund Change.
            </span>
          }
          src="/images/staking-preview.webp"
          showGradient={false}
        />
      </div>

      {/* Mobile fallback — static preview */}
      <div
        className="md:hidden"
        style={{
          padding: '96px 24px',
          textAlign: 'center',
        }}
      >
        <BlurFade delay={0.1} inView>
          <h2
            className="font-['Clash_Display',sans-serif]"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#f7f8f8',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            Stake. Win.
            <br />
            Fund Change.
          </h2>
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              overflow: 'hidden',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            <img
              src="/images/staking-preview.webp"
              alt="PSL Fan Clash staking interface"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
