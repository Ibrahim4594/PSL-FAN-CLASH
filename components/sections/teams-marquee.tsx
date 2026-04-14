'use client';

import { motion } from 'framer-motion';
import { Marquee } from '@/components/ui/marquee';

const TEAMS = [
  'ISLAMABAD UNITED',
  'KARACHI KINGS',
  'LAHORE QALANDARS',
  'MULTAN SULTANS',
  'PESHAWAR ZALMI',
  'QUETTA GLADIATORS',
  'HYDERABAD KINGSMEN',
  'RAWALPINDI PINDIZ',
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function TeamsMarquee() {
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
      variants={fadeIn}
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', paddingTop: '120px', paddingBottom: '120px', overflow: 'hidden' }}>

      <Marquee className="[--duration:30s] [--gap:80px]" pauseOnHover>
        {TEAMS.map((team) => (
          <span key={team}
            className="font-['Clash_Display',sans-serif]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap', userSelect: 'none' }}>
            {team}
          </span>
        ))}
      </Marquee>

      <Marquee className="[--duration:40s] [--gap:80px]" reverse pauseOnHover style={{ marginTop: '16px' }}>
        {TEAMS.map((team) => (
          <span key={team}
            className="font-['Clash_Display',sans-serif]"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.07)', whiteSpace: 'nowrap', userSelect: 'none' }}>
            {team}
          </span>
        ))}
      </Marquee>
    </motion.section>
  );
}
