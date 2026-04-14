export const tokens = {
  colors: {
    black: '#0a0a0a',
    white: '#f7f8f8',
    accent: '#FF3B30',
    success: '#34C759',
    error: '#FF3B30',
    muted: 'rgba(255,255,255,0.5)',
  },
  fonts: {
    display: "'Clash Display', sans-serif",
    body: "'Satoshi', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  spacing: {
    section: '120px',
    content: '64px',
    element: '24px',
    tight: '8px',
  },
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    pill: '9999px',
  },
} as const;

export type Tokens = typeof tokens;
