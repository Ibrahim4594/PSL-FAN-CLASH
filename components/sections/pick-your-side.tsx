'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/lib/locale-context';

interface TeamBadge {
  id: number;
  name: string;
  short: string;
  logo: string;
  className: string;
  scale?: number;
}

const TEAMS: TeamBadge[] = [
  { id: 1, name: 'Islamabad United', short: 'ISL', logo: '/teams/islamabad-united.png', className: 'top-[10%] left-[12%]' },
  { id: 2, name: 'Karachi Kings', short: 'KAR', logo: '/teams/karachi-kings.png', className: 'top-[14%] right-[13%]' },
  { id: 3, name: 'Lahore Qalandars', short: 'LHR', logo: '/teams/lahore-qalandars.png', className: 'top-[70%] left-[13%]' },
  { id: 4, name: 'Multan Sultans', short: 'MUL', logo: '/teams/multan-sultans.png', className: 'bottom-[12%] right-[12%]' },
  { id: 5, name: 'Peshawar Zalmi', short: 'PSH', logo: '/teams/peshawar-zalmi.png', className: 'top-[7%] left-[40%]' },
  { id: 6, name: 'Quetta Gladiators', short: 'QUE', logo: '/teams/quetta-gladiators.png', className: 'top-[42%] right-[8%]' },
  { id: 7, name: 'Hyderabad Kingsmen', short: 'HYD', logo: '/teams/hyderabad-kingsmen.png', className: 'bottom-[10%] left-[32%]' },
  { id: 8, name: 'Rawalpindi Pindiz', short: 'RWP', logo: '/teams/rawalpindi-pindiz.png', className: 'top-[46%] left-[8%]' },
];

function FloatingBadge({ team, mouseX, mouseY, index }: {
  team: TeamBadge;
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  React.useEffect(() => {
    const handleMouseMove = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((mouseX.current - cx) ** 2 + (mouseY.current - cy) ** 2);
        if (dist < 150) {
          const angle = Math.atan2(mouseY.current - cy, mouseX.current - cx);
          const force = (1 - dist / 150) * 50;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
        } else {
          x.set(0);
          y.set(0);
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y, mouseX, mouseY]);

  const [imgError, setImgError] = React.useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY, position: 'absolute' }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`pick-badge ${team.className}`}
    >
      <motion.div
        style={{
          width: '88px',
          height: '88px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          borderRadius: '8px',
          overflow: 'hidden',
          padding: '8px',
        }}
        animate={{
          y: [0, -10, 0, 10, 0],
          x: [0, 8, 0, -8, 0],
          rotate: [0, 3, 0, -3, 0],
        }}
        transition={{
          duration: 6 + Math.random() * 4,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      >
        {!imgError ? (
          <Image
            src={team.logo}
            alt={team.name}
            width={68}
            height={68}
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '16px',
            color: '#f7f8f8',
          }}>
            {team.short}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

export function PickYourSide() {
  const { t } = useLocale();
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.current = e.clientX;
    mouseY.current = e.clientY;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '700px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Floating team badges */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {TEAMS.map((team, i) => (
          <FloatingBadge key={team.id} team={team} mouseX={mouseX} mouseY={mouseY} index={i} />
        ))}
      </div>

      {/* Center content */}
      <div className="sc" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '20px',
        }}>
          {t('pick.eyebrow')}
        </p>

        <h2 className="font-['Clash_Display',sans-serif]" style={{
          textAlign: 'center',
          fontSize: 'clamp(3rem, 8vw, 5.5rem)',
          fontWeight: 700,
          textTransform: 'uppercase',
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
        }}>
          {t('pick.title')}
        </h2>

        <p style={{
          textAlign: 'center',
          maxWidth: '480px',
          margin: '24px auto 0',
          fontSize: '16px',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.7,
        }}>
          {t('pick.subtitle')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
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
            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0a0a0a';
              e.currentTarget.style.color = '#f7f8f8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f7f8f8';
              e.currentTarget.style.color = '#0a0a0a';
            }}>
            {t('pick.cta')}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
