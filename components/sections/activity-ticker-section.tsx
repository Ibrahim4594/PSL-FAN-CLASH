'use client';

import { ActivityTicker } from '@/components/activity/ActivityTicker';

/**
 * Landing page section: live on-chain activity ticker.
 * ActivityTicker is self-contained -- it fetches events internally.
 */
export function ActivityTickerSection() {
  return <ActivityTicker />;
}
