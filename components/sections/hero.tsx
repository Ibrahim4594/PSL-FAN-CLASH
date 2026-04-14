'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@/components/ui/connect-button';
import { useRef } from 'react';
import { useLocale } from '@/lib/locale-context';

/* ── Variants ──────────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.035, delayChildren: 0.4 },
  },
};

const letterVariants = {
  hidden: { opacity: 0, rotateX: -90, y: 40, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    rotateX: 0,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 150, damping: 20 },
  },
};

const subtitleContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.9 },
  },
};

const subtitleLetterVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  visible: {
    opacity: 0.2,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 120, damping: 22 },
  },
};

const fadeIn = (delay: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
});

const ctaVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 1.4, type: 'spring' as const, stiffness: 200, damping: 18 },
  },
};

/* ── Background Paths (unchanged — they're good) ──────────────── */

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full text-white" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.05 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────────── */

export function Hero() {
  const { t, dir, locale } = useLocale();
  const isUrdu = locale === 'ur';
  const titleWords = t('hero.title1').split(' ');
  const subtitleWords = t('hero.title2').split(' ');

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Scroll zoom — title scales up and fades as you scroll past
  const titleScale = useTransform(scrollYProgress, [0, 0.5], [1, 2.2]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  // Background paths parallax slower
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div
      ref={heroRef}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      {/* Background: Animated SVG paths with parallax */}
      <motion.div style={{ position: 'absolute', inset: 0, y: bgY }}>
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </motion.div>

      {/* Content — scroll zoom wrapper */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          scale: titleScale,
          opacity: titleOpacity,
          willChange: 'transform, opacity',
        }}
      >
        <div className="sc" style={{ textAlign: 'center', width: '100%' }}>
          {/* Eyebrow */}
          <motion.p
            variants={fadeIn(0.15)}
            initial="hidden"
            animate="visible"
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '24px',
            }}
          >
            {t('hero.eyebrow')}
          </motion.p>

          {/* Title — 3D flip per letter with perspective, word-wrapped */}
          <div style={{ perspective: '1200px' }}>
            <motion.h1
              className="font-['Clash_Display',sans-serif]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                textAlign: 'center',
                fontSize: 'clamp(3.5rem, 12vw, 9rem)',
                fontWeight: 700,
                textTransform: 'uppercase',
                lineHeight: 0.9,
                letterSpacing: '-0.05em',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Line 1 — English: letter-by-letter 3D flip. Urdu: word-by-word fade (cursive script) */}
              <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.25em', direction: dir }}>
                {isUrdu ? (
                  titleWords.map((word, wi) => (
                    <motion.span
                      key={`tw-${wi}`}
                      variants={letterVariants}
                      style={{ display: 'inline-block' }}
                    >
                      {word}
                    </motion.span>
                  ))
                ) : (
                  titleWords.map((word, wi) => (
                    <span key={`tw-${wi}`} style={{ display: 'inline-flex' }}>
                      {word.split('').map((letter, li) => (
                        <motion.span
                          key={`t-${wi}-${li}`}
                          variants={letterVariants}
                          style={{
                            display: 'inline-block',
                            transformOrigin: 'bottom center',
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          {letter}
                        </motion.span>
                      ))}
                    </span>
                  ))
                )}
              </span>

              {/* Line 2 — dimmed subtitle */}
              <motion.span
                variants={subtitleContainerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.25em', direction: dir }}
              >
                {isUrdu ? (
                  subtitleWords.map((word, wi) => (
                    <motion.span
                      key={`sw-${wi}`}
                      variants={subtitleLetterVariants}
                      style={{ display: 'inline-block' }}
                    >
                      {word}
                    </motion.span>
                  ))
                ) : (
                  subtitleWords.map((word, wi) => (
                    <span key={`sw-${wi}`} style={{ display: 'inline-flex' }}>
                      {word.split('').map((letter, li) => (
                        <motion.span
                          key={`s-${wi}-${li}`}
                          variants={subtitleLetterVariants}
                          style={{ display: 'inline-block' }}
                        >
                          {letter}
                        </motion.span>
                      ))}
                    </span>
                  ))
                )}
              </motion.span>
            </motion.h1>
          </div>

          {/* Subtitle description — fades in after title */}
          <motion.p
            variants={fadeIn(1.15)}
            initial="hidden"
            animate="visible"
            className="mc"
            style={{
              textAlign: 'center',
              maxWidth: '560px',
              marginTop: '32px',
              fontSize: '16px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.7,
            }}
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* CTA — springs in last */}
          <motion.div
            variants={ctaVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '32px',
            }}
          >
            <Link
              href="/matches"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '48px',
                padding: '0 32px',
                background: '#f7f8f8',
                color: '#0a0a0a',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'none',
                borderBottom: '2px solid #FF3B30',
                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0a0a0a';
                e.currentTarget.style.color = '#f7f8f8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f7f8f8';
                e.currentTarget.style.color = '#0a0a0a';
              }}
            >
              {t('hero.cta')}
            </Link>
            <ConnectButton />
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: '8px',
          }}
        >
          {t('common.scroll')}
        </p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <svg
            width="14"
            height="20"
            viewBox="0 0 14 20"
            fill="none"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <path
              d="M7 2v16M7 18l-4-4M7 18l4-4"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
