'use client';

import { cn } from '@/lib/utils';

/**
 * Base Skeleton
 * A pulsing placeholder block. Pass width/height via className or inline style.
 * Background: white at 6% opacity on dark bg, pulsing to 12%.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton-pulse', className)}
      style={{
        borderRadius: 4,
        ...props.style,
      }}
      {...props}
    />
  );
}

/**
 * SkeletonText
 * A single text-line skeleton. Width defaults to 100% but is configurable.
 */
export function SkeletonText({
  width = '100%',
  height = 14,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: number;
}) {
  return (
    <Skeleton
      className={className}
      style={{ width, height, borderRadius: 3, ...props.style }}
      {...props}
    />
  );
}

/**
 * SkeletonStat
 * Stat card skeleton for leaderboard or season stats.
 * Mimics: large number + small label line.
 */
export function SkeletonStat({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('glass-card', className)}
      style={{ padding: 24, ...props.style }}
      {...props}
    >
      <Skeleton style={{ width: '60%', height: 28, marginBottom: 8 }} />
      <Skeleton style={{ width: '40%', height: 10 }} />
    </div>
  );
}

/**
 * SkeletonCard
 * Card-shaped skeleton for match cards in the grid.
 * Mimics: top bar + team names + pool bar + bottom section.
 */
export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('glass-card', className)}
      style={{
        padding: 0,
        overflow: 'hidden',
        borderRadius: 8,
        ...props.style,
      }}
      {...props}
    >
      {/* Top bar: match number + status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px 8px',
        }}
      >
        <Skeleton style={{ width: 72, height: 12 }} />
        <Skeleton style={{ width: 56, height: 18, borderRadius: 99 }} />
      </div>

      {/* Teams */}
      <div style={{ padding: '12px 20px 16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Skeleton style={{ width: 56, height: 28, marginBottom: 6 }} />
            <Skeleton style={{ width: 96, height: 10 }} />
          </div>
          <Skeleton style={{ width: 20, height: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Skeleton style={{ width: 56, height: 28, marginBottom: 6 }} />
            <Skeleton style={{ width: 96, height: 10 }} />
          </div>
        </div>

        {/* Pool amounts */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
          }}
        >
          <Skeleton style={{ width: 72, height: 12 }} />
          <Skeleton style={{ width: 72, height: 12 }} />
        </div>

        {/* Pool bar */}
        <Skeleton style={{ width: '100%', height: 3, marginTop: 8, borderRadius: 2 }} />
      </div>

      {/* Bottom section */}
      <div
        style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Skeleton style={{ width: 120, height: 12 }} />
      </div>
    </div>
  );
}

/**
 * SkeletonTableRow
 * A single table row skeleton for the fan leaderboard.
 */
export function SkeletonTableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={className}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', ...props.style }}
      {...props}
    >
      {/* Rank */}
      <td style={{ padding: '14px 8px' }}>
        <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
      </td>
      {/* Fan address */}
      <td style={{ padding: '14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Skeleton style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <Skeleton style={{ width: 100, height: 13 }} />
        </div>
      </td>
      {/* Team badge */}
      <td style={{ padding: '14px 8px' }}>
        <Skeleton style={{ width: 52, height: 20, borderRadius: 2 }} />
      </td>
      {/* Total staked */}
      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
        <Skeleton style={{ width: 72, height: 13, marginLeft: 'auto' }} />
      </td>
      {/* Matches */}
      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
        <Skeleton style={{ width: 28, height: 13, marginLeft: 'auto' }} />
      </td>
      {/* Charity votes */}
      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
        <Skeleton style={{ width: 28, height: 13, marginLeft: 'auto' }} />
      </td>
    </tr>
  );
}

/**
 * SkeletonTeamCard
 * Team card skeleton for the team leaderboard.
 * Mimics: rank + logo area + name + stats grid + charity bar.
 */
export function SkeletonTeamCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('glass-card', className)}
      style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start', ...props.style }}
      {...props}
    >
      {/* Rank + Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 56 }}>
        <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
        <Skeleton style={{ width: 44, height: 44, borderRadius: 4 }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <Skeleton style={{ width: '55%', height: 18 }} />
          <Skeleton style={{ width: 32, height: 10 }} />
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton style={{ width: '70%', height: 15, marginBottom: 4 }} />
              <Skeleton style={{ width: '45%', height: 9 }} />
            </div>
          ))}
        </div>

        {/* Charity bar */}
        <Skeleton style={{ width: '100%', height: 3, marginTop: 12, borderRadius: 2 }} />
      </div>
    </div>
  );
}

/**
 * SkeletonCharityCard
 * Charity card skeleton for the charity page (inverted: dark card on light bg).
 */
export function SkeletonCharityCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        background: '#0a0a0a',
        padding: 28,
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 4,
        border: '1px solid transparent',
        ...props.style,
      }}
      {...props}
    >
      <div>
        {/* Heart icon + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <Skeleton style={{ width: 28, height: 28, borderRadius: 4 }} />
          <Skeleton style={{ width: 72, height: 18, borderRadius: 2 }} />
        </div>

        {/* Name */}
        <Skeleton style={{ width: '70%', height: 22, marginBottom: 10 }} />

        {/* Description lines */}
        <Skeleton style={{ width: '100%', height: 13, marginBottom: 6 }} />
        <Skeleton style={{ width: '95%', height: 13, marginBottom: 6 }} />
        <Skeleton style={{ width: '60%', height: 13, marginBottom: 16 }} />

        {/* Bullet items */}
        <Skeleton style={{ width: '80%', height: 12, marginBottom: 6 }} />
        <Skeleton style={{ width: '70%', height: 12, marginBottom: 6 }} />
        <Skeleton style={{ width: '75%', height: 12 }} />
      </div>

      {/* Bottom wallet line */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 20 }}>
        <Skeleton style={{ width: '55%', height: 11 }} />
      </div>
    </div>
  );
}
