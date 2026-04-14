import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4050';
const PAGES = [
  { path: '/', name: '01-landing-hero' },
  { path: '/matches', name: '02-matches-grid' },
  { path: '/matches/1', name: '03-match-detail' },
  { path: '/leaderboard', name: '04-leaderboard' },
  { path: '/charity', name: '05-charity-dashboard' },
  { path: '/profile', name: '06-profile' },
];

async function main() {
  mkdirSync('screenshots', { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const page of PAGES) {
    const tab = await context.newPage();
    console.log(`Screenshotting ${page.path} ...`);
    await tab.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    // Force hard reload to bypass cache
    await tab.reload({ waitUntil: 'networkidle' });
    // Wait for animations + fonts to settle
    await tab.waitForTimeout(3000);
    // Viewport screenshot (what user actually sees)
    await tab.screenshot({
      path: `screenshots/${page.name}.png`,
      fullPage: false,
    });
    // Also full-page for reference
    await tab.screenshot({
      path: `screenshots/${page.name}-full.png`,
      fullPage: true,
    });
    console.log(`  -> screenshots/${page.name}.png`);
    await tab.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured.');
}

main().catch(console.error);
