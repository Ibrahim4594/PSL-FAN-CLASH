'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { useActivityEvents } from '@/lib/hooks/useActivityEvents';

/**
 * Formats a Unix timestamp (seconds) into a relative "X ago" string.
 */
function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - timestamp);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function fmtAmount(amount: bigint): string {
  const val = parseFloat(formatEther(amount));
  if (val >= 100) return val.toFixed(0);
  if (val >= 10) return val.toFixed(1);
  return val.toFixed(2);
}

/**
 * ActivityTicker -- horizontal scrolling marquee of recent staking activity.
 * Self-contained: calls useActivityEvents(undefined) internally to fetch from ALL vaults.
 * Uses pure CSS animation for infinite smooth scroll, duplicating content for seamless looping.
 * B&W design system. font-mono, subtle text-white/20.
 */
export function ActivityTicker() {
  const { events, isLoading } = useActivityEvents(undefined, 20);

  // Force re-render every 30s to update relative timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Build the content string items
  const items = events.map(
    (evt) =>
      `${truncAddr(evt.user)} staked ${fmtAmount(evt.amount)} WIRE for ${evt.teamName} \u00B7 ${timeAgo(evt.timestamp)}`
  );

  // Show placeholder if no events yet
  if (isLoading || items.length === 0) {
    return (
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 0',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.12)',
            animation: isLoading ? 'pulse 2s infinite' : undefined,
          }}
        >
          {isLoading
            ? 'Loading on-chain activity...'
            : 'No staking activity yet. Be the first to stake.'}
        </p>
      </div>
    );
  }

  // Join items with separator
  const separator = '    \u00B7\u00B7\u00B7    ';
  const content = items.join(separator);

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 0',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.01)',
        position: 'relative',
      }}
    >
      {/* Left fade edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '48px',
          background: 'linear-gradient(to right, #0a0a0a, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      {/* Right fade edge */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '48px',
          background: 'linear-gradient(to left, #0a0a0a, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Scrolling track */}
      <div
        style={{
          display: 'flex',
          gap: '0px',
          width: 'max-content',
          animation: 'activityTickerScroll 40s linear infinite',
        }}
      >
        {/* Duplicate content for seamless looping */}
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.25)',
              whiteSpace: 'nowrap',
              paddingRight: '80px',
              letterSpacing: '0.02em',
            }}
          >
            {content}
          </span>
        ))}
      </div>

      {/* Inline keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes activityTickerScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `,
        }}
      />
    </div>
  );
}
