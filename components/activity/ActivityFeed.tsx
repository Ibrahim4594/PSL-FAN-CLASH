'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther, type Address } from 'viem';
import { useActivityEvents } from '@/lib/hooks/useActivityEvents';
import { BlurFade } from '@/components/ui/blur-fade';

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

/**
 * Truncates an address for display: "0x7a3b...4f2e"
 */
function truncAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Formats a bigint WIRE amount to a human-readable string.
 */
function fmtAmount(amount: bigint): string {
  const val = parseFloat(formatEther(amount));
  if (val >= 100) return val.toFixed(0);
  if (val >= 10) return val.toFixed(1);
  return val.toFixed(2);
}

interface ActivityFeedProps {
  /** Optional vault address to filter events. If omitted, shows ALL vaults. */
  vaultAddress?: string;
  /** Maximum events to display (default 10). */
  maxItems?: number;
  /** Header label (default "RECENT ACTIVITY"). */
  title?: string;
}

/**
 * ActivityFeed -- vertical list of recent staking events.
 * Self-contained: calls useActivityEvents hook internally.
 * B&W design system compliant. Green dot (#34C759) for live indicator.
 * Framer Motion for entry animations. Wrapped in BlurFade for scroll reveal.
 */
export function ActivityFeed({
  vaultAddress,
  maxItems = 10,
  title = 'RECENT ACTIVITY',
}: ActivityFeedProps) {
  const { events, isLoading } = useActivityEvents(
    vaultAddress ? (vaultAddress as Address) : undefined,
    maxItems
  );

  // Force re-render every 30s to update relative timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const displayEvents = events.slice(0, maxItems);

  return (
    <BlurFade delay={0.5} inView>
      <div>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {/* Pulsing green dot */}
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#34C759',
              boxShadow: '0 0 6px rgba(52, 199, 89, 0.5)',
              animation: 'activityPulse 3s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {title}
          </span>
        </div>

        {/* Loading state */}
        {isLoading && displayEvents.length === 0 && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.2)',
              padding: '16px 0',
              animation: 'pulse 2s infinite',
            }}
          >
            Loading activity...
          </p>
        )}

        {/* Empty state */}
        {!isLoading && displayEvents.length === 0 && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.15)',
              padding: '16px 0',
            }}
          >
            Waiting for first stake...
          </p>
        )}

        {/* Event list */}
        <div>
          <AnimatePresence initial={false}>
            {displayEvents.map((evt) => (
              <motion.div
                key={`${evt.txHash}-${evt.user}-${evt.teamId}`}
                initial={{ opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  {/* Green dot */}
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: '#34C759',
                      flexShrink: 0,
                    }}
                  />

                  {/* Address */}
                  <a
                    href={`https://wirefluidscan.com/address/${evt.user}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.4)',
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    {truncAddr(evt.user)}
                  </a>

                  {/* "staked" */}
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  >
                    staked
                  </span>

                  {/* Amount */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.5)',
                      flexShrink: 0,
                    }}
                  >
                    {fmtAmount(evt.amount)} WIRE
                  </span>

                  {/* "for" */}
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  >
                    for
                  </span>

                  {/* Team */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.6)',
                      flexShrink: 0,
                    }}
                  >
                    {evt.teamName}
                  </span>

                  {/* Time ago -- pushed to the right */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.15)',
                      marginLeft: 'auto',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {timeAgo(evt.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Inline keyframes for the pulsing dot */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes activityPulse {
                0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(52,199,89,0.5); }
                50% { opacity: 0.4; box-shadow: 0 0 2px rgba(52,199,89,0.2); }
              }
            `,
          }}
        />
      </div>
    </BlurFade>
  );
}
