'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { wirefluid } from '@/lib/chains';
import { useWireBalance } from '@/lib/balance-context';
import { truncateAddress } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/lib/locale-context';
import Link from 'next/link';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { balance: wireBalance, changeCounter } = useWireBalance();
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [balancePulse, setBalancePulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setMounted(true), []);

  // Trigger a brief opacity pulse when balance changes
  useEffect(() => {
    if (changeCounter === 0) return; // Skip initial render
    setBalancePulse(true);
    const timer = setTimeout(() => setBalancePulse(false), 300);
    return () => clearTimeout(timer);
  }, [changeCounter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!mounted) {
    return <DisconnectedButton label={t('wallet.connect')} disabled />;
  }

  const isWrongNetwork = isConnected && chain?.id !== wirefluid.id;

  // State 2: Wrong Network
  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: wirefluid.id })}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 48, minHeight: 48,
          padding: '0 20px', border: '1px solid rgba(255,255,255,0.15)',
          background: 'transparent', color: '#f7f8f8',
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
          transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF3B30', boxShadow: '0 0 8px rgba(255,59,48,0.6)', animation: 'pulse 2s infinite' }} />
        {t('wallet.wrong_network')}
      </button>
    );
  }

  // State 3: Connected
  if (isConnected && address) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, height: 48, minHeight: 48,
            padding: '0 16px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
            color: '#f7f8f8', cursor: 'pointer',
            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {truncateAddress(address)}
          </span>
          <span
            ref={balanceRef}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)',
              transition: 'opacity 0.15s ease',
              opacity: balancePulse ? 0.5 : 1,
            }}
          >
            {wireBalance} WIRE
          </span>
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            minWidth: 200, background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
            padding: 4, zIndex: 100,
          }}>
            <DropdownItem onClick={() => { navigator.clipboard.writeText(address); setDropdownOpen(false); }}>
              {t('wallet.copy_address')}
            </DropdownItem>
            <DropdownItem href={`https://wirefluidscan.com/address/${address}`} external>
              {t('wallet.view_wirescan')}
            </DropdownItem>
            <DropdownItem href="/profile" onClick={() => setDropdownOpen(false)}>
              {t('wallet.my_profile')}
            </DropdownItem>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            <DropdownItem onClick={() => { disconnect(); setDropdownOpen(false); }} danger>
              {t('wallet.disconnect')}
            </DropdownItem>
          </div>
        )}
      </div>
    );
  }

  // State 1: Not Connected
  return (
    <DisconnectedButton label={t('wallet.connect')} onClick={() => connect({ connector: connectors[0] })} />
  );
}

function DisconnectedButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative', overflow: 'hidden', height: 48, minHeight: 48,
        padding: '0 24px', border: '1px solid rgba(255,255,255,0.8)',
        background: 'transparent', color: '#f7f8f8',
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', cursor: disabled ? 'default' : 'pointer',
        transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = '#f7f8f8';
        e.currentTarget.style.color = '#0a0a0a';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#f7f8f8';
      }}
    >
      {label}
    </button>
  );
}

function DropdownItem({ children, onClick, href, external, danger }: {
  children: React.ReactNode; onClick?: () => void; href?: string; external?: boolean; danger?: boolean;
}) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', width: '100%', padding: '12px 12px', minHeight: 44, background: 'transparent',
    border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, borderRadius: 4,
    color: danger ? '#FF3B30' : 'rgba(255,255,255,0.7)',
    fontFamily: 'var(--font-mono)', textDecoration: 'none',
    transition: 'background 0.15s ease',
  };

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} style={style}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button style={style} onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      {children}
    </button>
  );
}
