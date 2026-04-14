'use client';

import { motion } from 'motion/react';
import { ConnectButton } from '@/components/ui/connect-button';
import { LampContainer } from '@/components/ui/lamp';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export function CTASection() {
  const { isConnected } = useAccount();
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <LampContainer>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: '24px',
          }}
        >
          PSL 11 &middot; March 26 &ndash; May 3, 2026
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="font-['Clash_Display',sans-serif]"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: '#f7f8f8',
          }}
        >
          The Season Starts
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="font-['Clash_Display',sans-serif]"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.3)',
            margin: '12px 0',
          }}
        >
          March 26.
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="font-['Clash_Display',sans-serif]"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            color: '#f7f8f8',
          }}
        >
          Fund Real Change.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}
        >
          {isConnected ? (
            <Link href="/matches" style={{
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
            }}>
              View Matches
            </Link>
          ) : (
            <ConnectButton />
          )}
        </motion.div>
      </LampContainer>
    </section>
  );
}
