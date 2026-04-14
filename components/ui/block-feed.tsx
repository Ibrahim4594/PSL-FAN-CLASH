'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPublicClient, http } from 'viem';
import { wirefluid } from '@/lib/chains';

interface BlockInfo {
  number: number;
  timestamp: number;
  txCount: number;
}

const client = createPublicClient({
  chain: wirefluid,
  transport: http('https://evm.wirefluid.com'),
});

/**
 * Live block feed showing latest 3 blocks from WireFluid.
 * Polls every 5 seconds. Falls back to demo data if RPC fails.
 */
export function BlockFeed() {
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    async function fetchLatestBlock() {
      try {
        const block = await client.getBlock({ blockTag: 'latest' });
        const info: BlockInfo = {
          number: Number(block.number),
          timestamp: Number(block.timestamp) * 1000,
          txCount: block.transactions.length,
        };
        setBlocks(prev => {
          const exists = prev.some(b => b.number === info.number);
          if (exists) return prev;
          return [info, ...prev].slice(0, 3);
        });
        setIsLive(true);
      } catch {
        // Fallback demo data
        if (blocks.length === 0) {
          setBlocks([
            { number: 4521847, timestamp: Date.now() - 2000, txCount: 12 },
            { number: 4521846, timestamp: Date.now() - 7000, txCount: 8 },
            { number: 4521845, timestamp: Date.now() - 12000, txCount: 15 },
          ]);
        }
      }
    }

    fetchLatestBlock();
    intervalRef.current = setInterval(fetchLatestBlock, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  function timeAgo(ts: number): string {
    const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  // Auto-update time display
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      padding: '12px 16px', borderRadius: 6,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isLive ? '#34C759' : 'rgba(255,255,255,0.2)',
          boxShadow: isLive ? '0 0 8px rgba(52,199,89,0.5)' : 'none',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
          letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)',
        }}>
          WireFluid Live
        </span>
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence mode="popLayout">
          {blocks.map(block => (
            <motion.div
              key={block.number}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                #{block.number.toLocaleString()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                {timeAgo(block.timestamp)} &middot; {block.txCount} txs
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
