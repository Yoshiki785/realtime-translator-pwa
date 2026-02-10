#!/usr/bin/env node
/**
 * GA4 collect リクエスト検証スクリプト
 *
 * Playwright (Chromium) でページを開き、google-analytics.com への
 * /g/collect or /collect リクエストを捕捉して tid=G-39NFY1FDW9 の
 * page_view イベントが送信されるかを検証する。
 */

import { chromium } from '@playwright/test';

const MEASUREMENT_ID = 'G-39NFY1FDW9';

/** @type {Array<{url: string, expectCollect: boolean}>} */
const targets = [
  { url: 'https://lingoflow-ai.com/',                expectCollect: true },
  { url: 'https://lingoflow-ai.com/terms',           expectCollect: true },
  { url: 'https://app.lingoflow-ai.com/pricing.html', expectCollect: true },
  { url: 'https://app.lingoflow-ai.com/',             expectCollect: false },
];

async function verify(page, target) {
  const collected = [];

  page.on('request', (req) => {
    try {
      const u = new URL(req.url());
      if (
        u.hostname.includes('google-analytics.com') &&
        (u.pathname.includes('/g/collect') || u.pathname.includes('/collect'))
      ) {
        collected.push({
          tid: u.searchParams.get('tid'),
          en: u.searchParams.get('en'),
          url: req.url(),
        });
      }
    } catch {
      // ignore non-URL requests
    }
  });

  await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30_000 });
  // GA4 collect can fire slightly after networkidle
  await page.waitForTimeout(4_000);

  const matching = collected.filter(
    (c) => c.tid === MEASUREMENT_ID && c.en === 'page_view'
  );

  const hasCollect = matching.length > 0;
  const ok = hasCollect === target.expectCollect;

  return {
    url: target.url,
    expectCollect: target.expectCollect,
    actualCollect: hasCollect,
    collectCount: matching.length,
    totalCollects: collected.length,
    status: ok ? 'OK' : 'NG',
  };
}

async function verifyCTAClick(page) {
  const collected = [];

  page.on('request', (req) => {
    try {
      const u = new URL(req.url());
      if (
        u.hostname.includes('google-analytics.com') &&
        (u.pathname.includes('/g/collect') || u.pathname.includes('/collect'))
      ) {
        let tid = u.searchParams.get('tid');
        let en = u.searchParams.get('en');

        // GA4 batches events in POST body: last line contains the newest event
        const postData = req.postData();
        if (!en && postData && postData.includes('en=')) {
          const bodyParams = new URLSearchParams(postData.split('\n').pop());
          en = en || bodyParams.get('en');
          tid = tid || bodyParams.get('tid');
        }

        collected.push({ tid, en, url: req.url() });
      }
    } catch {
      // ignore non-URL requests
    }
  });

  // Intercept navigation to app domain — fulfill with empty page so pending
  // GA4 beacons are not cancelled (route.abort() would drop them)
  await page.route('https://app.lingoflow-ai.com/**', (route) => {
    if (route.request().resourceType() === 'document') {
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
    } else {
      route.abort();
    }
  });

  await page.goto('https://lingoflow-ai.com/', {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });

  // Click the hero CTA button
  const cta = page.locator('[data-analytics-label="hero-try-free"]').first();
  await cta.click();

  // Wait for the GA4 beacon to fire
  await page.waitForTimeout(3_000);

  const matching = collected.filter(
    (c) => c.tid === MEASUREMENT_ID && c.en === 'cta_click'
  );

  const hasCollect = matching.length > 0;
  return {
    url: 'https://lingoflow-ai.com/ (CTA click)',
    expectCollect: true,
    actualCollect: hasCollect,
    collectCount: matching.length,
    totalCollects: collected.length,
    status: hasCollect ? 'OK' : 'NG',
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const results = [];
  for (const target of targets) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const result = await verify(page, target);
      results.push(result);
    } catch (err) {
      results.push({
        url: target.url,
        expectCollect: target.expectCollect,
        actualCollect: null,
        collectCount: 0,
        totalCollects: 0,
        status: `ERROR: ${err.message}`,
      });
    } finally {
      await context.close();
    }
  }

  // CTA click test
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const result = await verifyCTAClick(page);
      results.push(result);
    } catch (err) {
      results.push({
        url: 'https://lingoflow-ai.com/ (CTA click)',
        expectCollect: true,
        actualCollect: null,
        collectCount: 0,
        totalCollects: 0,
        status: `ERROR: ${err.message}`,
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  // Print results table
  console.log('\n=== GA4 Collect Verification (Playwright) ===\n');
  console.log(
    'URL'.padEnd(50) +
      'Expected'.padEnd(10) +
      'Actual'.padEnd(10) +
      'Count'.padEnd(8) +
      'Status'
  );
  console.log('-'.repeat(85));

  let allOk = true;
  for (const r of results) {
    if (r.status !== 'OK') allOk = false;
    console.log(
      r.url.padEnd(50) +
        String(r.expectCollect).padEnd(10) +
        String(r.actualCollect).padEnd(10) +
        String(r.collectCount).padEnd(8) +
        r.status
    );
  }

  console.log('-'.repeat(85));
  console.log(allOk ? '\nAll checks PASSED.' : '\nSome checks FAILED.');

  process.exit(allOk ? 0 : 1);
}

main();
