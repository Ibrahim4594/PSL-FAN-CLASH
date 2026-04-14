'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { useLocale } from '@/lib/locale-context';

export function HowItWorks() {
  const { t, dir } = useLocale();

  const STEPS = [
    { number: '01', title: t('how.step1.title'), description: t('how.step1.desc') },
    { number: '02', title: t('how.step2.title'), description: t('how.step2.desc') },
    { number: '03', title: t('how.step3.title'), description: t('how.step3.desc') },
  ];
  return (
    <section
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="sc">
        <BlurFade delay={0.1} inView>
          <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>
            {t('how.eyebrow')}
          </p>
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <h2 className="tc font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 700, marginBottom: '16px' }}>
            {t('how.title')}
          </h2>
        </BlurFade>
        <BlurFade delay={0.3} inView>
          <p className="tc mc" style={{ maxWidth: '600px', color: 'rgba(255,255,255,0.4)', marginBottom: '64px', lineHeight: 1.7 }}>
            Fan rivalry, channeled through smart contracts, directly funds charitable causes across Pakistan.
          </p>
        </BlurFade>

        {/* 3 cards — forced 3 columns on md+ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }} className="md:!grid-cols-3">
          {STEPS.map((step, i) => (
            <BlurFade key={step.number} delay={0.2 + i * 0.05} inView>
              <div
                className="glass-card"
                style={{ padding: '28px', display: 'flex', flexDirection: 'column', textAlign: 'left', height: '100%' }}>
                <span className="font-['Clash_Display',sans-serif]" style={{ fontSize: '48px', fontWeight: 700, color: 'rgba(255,255,255,0.1)', marginBottom: '12px', lineHeight: 1 }}>{step.number}</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>{step.description}</p>
              </div>
            </BlurFade>
          ))}
        </div>

        {/* Distribution — oversized number to break visual rhythm */}
        <BlurFade delay={0.7} inView>
          <div style={{ marginTop: '64px', textAlign: 'center' }}>
            <p className="font-['Clash_Display',sans-serif]" style={{ fontSize: 'clamp(4rem, 12vw, 8rem)', fontWeight: 700, lineHeight: 0.9, color: 'rgba(255,255,255,0.06)', marginBottom: -20 }}>
              82 / 15 / 3
            </p>
            <p className="tc" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>Distribution</p>
            <div style={{ display: 'flex', height: '32px', width: '100%', overflow: 'hidden', fontSize: '12px', fontFamily: 'var(--font-mono)', borderRadius: '2px' }}>
              <div style={{ flex: '82', background: '#f7f8f8', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>82% Winners</div>
              <div style={{ flex: '15', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>15%</div>
              <div style={{ flex: '3', background: 'rgba(255,255,255,0.1)', minWidth: 0 }} />
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
