#!/usr/bin/env node
/**
 * GA4 collect リクエスト検証スクリプト
 *
 * Playwright (Chromium) でページを開き、google-analytics.com への
 * /g/collect or /collect リクエストを捕捉して tid=G-39NFY1FDW9 の
 * page_view イベントが送信されるかを検証する。
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MEASUREMENT_ID = 'G-39NFY1FDW9';

/** @type {Array<{url: string, expectCollect: boolean}>} */
const targets = [
  { url: 'https://lingoflow-ai.com/',                expectCollect: true },
  { url: 'https://lingoflow-ai.com/terms',           expectCollect: true },
  { url: 'https://app.lingoflow-ai.com/pricing.html', expectCollect: true },
  { url: 'https://app.lingoflow-ai.com/',             expectCollect: false },
];

function findPlayableExecutablePath() {
  const candidates = [chromium.executablePath()];
  const cacheRoot = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');

  if (fs.existsSync(cacheRoot)) {
    const dirs = fs.readdirSync(cacheRoot);
    const shellDirs = dirs.filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse();
    const chromiumDirs = dirs.filter((d) => d.startsWith('chromium-')).sort().reverse();

    for (const d of shellDirs) {
      candidates.push(path.join(cacheRoot, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell'));
      candidates.push(path.join(cacheRoot, d, 'chrome-headless-shell-mac-x64', 'chrome-headless-shell'));
    }
    for (const d of chromiumDirs) {
      candidates.push(path.join(cacheRoot, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
      candidates.push(path.join(cacheRoot, d, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
    }
  }

  return candidates.find((p) => !!p && fs.existsSync(p));
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    const fallbackPath = findPlayableExecutablePath();
    if (!fallbackPath) {
      throw err;
    }
    console.warn('[verify_ga4_collect] default launch failed; retrying with executablePath:', fallbackPath);
    return await chromium.launch({ headless: true, executablePath: fallbackPath });
  }
}

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
  let ctaParamsOk = false; // track ep.cta_id and ep.link_url

  page.on('request', (req) => {
    try {
      const u = new URL(req.url());
      if (
        u.hostname.includes('google-analytics.com') &&
        (u.pathname.includes('/g/collect') || u.pathname.includes('/collect'))
      ) {
        let tid = u.searchParams.get('tid');
        let en = u.searchParams.get('en');

        // GA4 batches events in POST body — parse all lines
        const postData = req.postData();
        if (postData) {
          const lines = postData.split('\n');
          for (const line of lines) {
            const p = new URLSearchParams(line);
            const lineEn = p.get('en');
            const lineTid = p.get('tid');
            if (lineEn) {
              collected.push({
                tid: lineTid || tid,
                en: lineEn,
                url: req.url(),
              });
              // Check cta_click params enrichment
              if (lineEn === 'cta_click') {
                const hasCTAId = p.has('ep.cta_id');
                const hasLinkUrl = p.has('ep.link_url');
                if (hasCTAId && hasLinkUrl) ctaParamsOk = true;
              }
            }
          }
        }

        // Check URL-level cta_click params (single-event / non-batched beacons)
        if (en === 'cta_click') {
          const hasCTAId = u.searchParams.has('ep.cta_id');
          const hasLinkUrl = u.searchParams.has('ep.link_url');
          if (hasCTAId && hasLinkUrl) ctaParamsOk = true;
        }

        // Also handle URL-param-only requests (non-POST)
        if (en && !postData) {
          collected.push({ tid, en, url: req.url() });
        }
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
  const paramsNote = hasCollect
    ? (ctaParamsOk ? 'cta_id=OK link_url=OK' : 'cta_id=NG link_url=NG')
    : '';

  return {
    url: 'https://lingoflow-ai.com/ (CTA click)',
    expectCollect: true,
    actualCollect: hasCollect,
    collectCount: matching.length,
    totalCollects: collected.length,
    status: hasCollect && ctaParamsOk ? 'OK' : hasCollect ? `NG: ${paramsNote}` : 'NG',
    params: paramsNote,
  };
}

async function main() {
  const browser = await launchBrowser();

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
      'Status'.padEnd(10) +
      'Params'
  );
  console.log('-'.repeat(115));

  let allOk = true;
  for (const r of results) {
    if (r.status !== 'OK') allOk = false;
    console.log(
      r.url.padEnd(50) +
        String(r.expectCollect).padEnd(10) +
        String(r.actualCollect).padEnd(10) +
        String(r.collectCount).padEnd(8) +
        r.status.padEnd(10) +
        (r.params || '')
    );
  }

  console.log('-'.repeat(115));
  console.log(allOk ? '\nAll checks PASSED.' : '\nSome checks FAILED.');

  process.exit(allOk ? 0 : 1);
}

main();
