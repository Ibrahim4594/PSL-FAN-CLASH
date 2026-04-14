'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TxReceiptProps {
  hash?: string;
  action: string;        // "Staked 0.5 WIRE for LHR" or "Claimed Reward"
  gasUsed?: number;       // gas units
  blockNumber?: number;
  startTime: number;      // Date.now() when tx was submitted
  onClose: () => void;
}

const CONSENSUS_STEPS = [
  { label: 'Pre-Vote', detail: 'Validators acknowledging transaction' },
  { label: 'Pre-Commit', detail: '2/3+ validators reached agreement' },
  { label: 'Committed', detail: 'Written to block — Byzantine Fault Tolerant' },
];

/**
 * Transaction receipt with:
 * 1. CometBFT consensus visualization (animated steps)
 * 2. Instant finality timer (real measured time)
 * 3. Full receipt details with WireScan link + Ethereum comparison
 */
export function TxReceipt({ hash, action, gasUsed, blockNumber, startTime, onClose }: TxReceiptProps) {
  const [consensusStep, setConsensusStep] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [finalityTime, setFinalityTime] = useState(0);

  // Calculate real finality time
  useEffect(() => {
    if (startTime > 0) {
      setFinalityTime(Math.round((Date.now() - startTime) / 100) / 10);
    }
  }, [startTime]);

  // Animate consensus steps
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setConsensusStep(1), 800));
    timers.push(setTimeout(() => setConsensusStep(2), 1800));
    timers.push(setTimeout(() => { setConsensusStep(3); setShowReceipt(true); }, 2800));
    return () => timers.forEach(clearTimeout);
  }, []);

  const gasWire = gasUsed ? (gasUsed * 10 / 1e9).toFixed(4) : '0.0009';
  const ethGasCost = gasUsed ? ((gasUsed * 30 * 2000) / 1e9).toFixed(2) : '18.50';
  const truncatedHash = hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: 24,
          marginTop: 20,
        }}
      >
        {/* CometBFT Consensus Visualization */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
          letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: 16,
        }}>
          CometBFT Consensus — WireFluid
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {CONSENSUS_STEPS.map((step, i) => {
            const done = consensusStep > i;
            const active = consensusStep === i + 1;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: done || active ? 1 : 0.2, x: 0 }}
                transition={{ delay: i * 0.3, duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11,
                  background: done ? 'rgba(52,199,89,0.15)' : 'rgba(255,255,255,0.05)',
                  color: done ? '#34C759' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${done ? 'rgba(52,199,89,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {done ? '✓' : (i + 1)}
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: done ? '#f7f8f8' : 'rgba(255,255,255,0.3)' }}>
                    {step.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Receipt Details */}
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              {/* Finality Banner */}
              <div style={{
                background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.15)',
                borderRadius: 6, padding: '10px 14px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#34C759' }}>
                  Finalized in {finalityTime}s — IRREVERSIBLE
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                  Ethereum: ~13 min
                </p>
              </div>

              {/* Receipt Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ReceiptRow label="Action" value={action} />
                {hash && (
                  <ReceiptRow
                    label="Tx Hash"
                    value={
                      <a
                        href={`https://wirefluidscan.com/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {truncatedHash} →
                      </a>
                    }
                  />
                )}
                {blockNumber && <ReceiptRow label="Block" value={`#${blockNumber.toLocaleString()}`} />}
                <ReceiptRow label="Gas (WireFluid)" value={`~${gasWire} WIRE ($0.002)`} />
                <ReceiptRow label="Gas (Ethereum)" value={`~$${ethGasCost}`} highlight />
                <ReceiptRow label="You saved" value={`$${(parseFloat(ethGasCost) - 0.002).toFixed(2)} (99.99%)`} success />
              </div>

              <button
                onClick={onClose}
                style={{
                  marginTop: 16, width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function ReceiptRow({ label, value, highlight, success }: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: success ? '#34C759' : highlight ? 'rgba(255,59,48,0.6)' : 'rgba(255,255,255,0.6)',
        textDecoration: highlight ? 'line-through' : 'none',
      }}>
        {value}
      </span>
    </div>
  );
}
