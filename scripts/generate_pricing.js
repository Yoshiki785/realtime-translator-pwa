#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'static', 'config', 'pricing.json');
const CHECK_MODE = process.argv.includes('--check');
const JPY_FORMAT = new Intl.NumberFormat('ja-JP');

const loadConfig = () => {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const config = JSON.parse(raw);

  const ensureInt = (value, field) => {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Invalid ${field}: expected non-negative integer`);
    }
  };

  if (!config || typeof config !== 'object') {
    throw new Error('Invalid pricing config: expected JSON object');
  }
  if (!config.plans || typeof config.plans !== 'object') {
    throw new Error('Invalid pricing config: missing "plans"');
  }
  if (!config.plans.free || !config.plans.pro) {
    throw new Error('Invalid pricing config: missing "plans.free" or "plans.pro"');
  }
  ensureInt(config.plans.free.monthlyMinutes, 'plans.free.monthlyMinutes');
  ensureInt(config.plans.free.dailyMinutes, 'plans.free.dailyMinutes');
  ensureInt(config.plans.free.retentionDays, 'plans.free.retentionDays');
  ensureInt(config.plans.pro.monthlyMinutes, 'plans.pro.monthlyMinutes');
  if (config.plans.pro.dailyMinutes !== null) {
    ensureInt(config.plans.pro.dailyMinutes, 'plans.pro.dailyMinutes');
  }
  ensureInt(config.plans.pro.retentionDays, 'plans.pro.retentionDays');

  if (!Array.isArray(config.ticketPacks)) {
    throw new Error('Invalid pricing config: missing "ticketPacks"');
  }

  config.ticketPacks.forEach((pack, idx) => {
    if (!pack || typeof pack !== 'object') {
      throw new Error(`Invalid ticketPacks[${idx}]: expected object`);
    }
    if (!pack.packId || typeof pack.packId !== 'string') {
      throw new Error(`Invalid ticketPacks[${idx}].packId`);
    }
    ensureInt(pack.minutes, `ticketPacks[${idx}].minutes`);
    ensureInt(pack.priceJpy, `ticketPacks[${idx}].priceJpy`);
  });

  return config;
};

const replaceBlock = (source, key, generatedContent) => {
  const startMarker = `<!-- AUTO:${key}:START -->`;
  const endMarker = `<!-- AUTO:${key}:END -->`;

  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Marker not found for ${key}`);
  }
  if (endIdx <= startIdx) {
    throw new Error(`Invalid marker order for ${key}`);
  }

  const head = source.slice(0, startIdx + startMarker.length);
  const endLineStart = source.lastIndexOf('\n', endIdx) + 1;
  const endIndent = source.slice(endLineStart, endIdx);
  const tail = source.slice(endIdx);
  return `${head}\n${generatedContent.trimEnd()}\n${endIndent}${tail}`;
};

const renderPricingPlanRows = (config) => {
  const free = config.plans.free;
  const pro = config.plans.pro;
  const freeUsage = `月間${free.monthlyMinutes}分 / 1日${free.dailyMinutes}分`;
  const proUsage = pro.dailyMinutes == null
    ? `月間${pro.monthlyMinutes}分 / 日次制限なし`
    : `月間${pro.monthlyMinutes}分 / 1日${pro.dailyMinutes}分`;

  const freeTicket = config.ticketDisplay?.free || '不可';
  const proTicket = config.ticketDisplay?.pro || '可（有料）';

  return [
    '        <tr>',
    '          <td>利用枠</td>',
    `          <td>${freeUsage}</td>`,
    `          <td>${proUsage}</td>`,
    '        </tr>',
    '        <tr>',
    '          <td>チケット追加購入</td>',
    `          <td>${freeTicket}</td>`,
    `          <td>${proTicket}</td>`,
    '        </tr>',
    '        <tr>',
    '          <td>セッションデータ保持期間</td>',
    `          <td>${free.retentionDays}日</td>`,
    `          <td>${pro.retentionDays}日</td>`,
    '        </tr>',
  ].join('\n');
};

const visibleTicketPacks = (config) => config.ticketPacks.filter((pack) => pack.visible !== false);

const renderPricingTicketList = (config) => {
  const items = visibleTicketPacks(config).map((pack) => (
    `      <li>+${pack.minutes}分: ¥${JPY_FORMAT.format(pack.priceJpy)}</li>`
  ));
  return [
    '    <ul>',
    ...items,
    '    </ul>',
  ].join('\n');
};

const renderTermsPlanList = (config) => {
  const free = config.plans.free;
  const pro = config.plans.pro;
  const proDaily = pro.dailyMinutes == null ? '制限なし' : `1日${pro.dailyMinutes}分まで`;

  return [
    '    <ul>',
    `      <li><strong>Free プラン</strong>: 月間${free.monthlyMinutes}分、1日${free.dailyMinutes}分まで、${free.retentionDays}日間保持</li>`,
    `      <li><strong>Pro プラン</strong>: 月間${pro.monthlyMinutes}分、${proDaily}、${pro.retentionDays}日間保持</li>`,
    '    </ul>',
  ].join('\n');
};

const renderPrivacyRetentionList = (config) => {
  const free = config.plans.free;
  const pro = config.plans.pro;
  return [
    '    <ul>',
    `      <li><strong>Free プラン</strong>: セッションデータは ${free.retentionDays}日間 保持後、自動削除</li>`,
    `      <li><strong>Pro プラン</strong>: セッションデータは ${pro.retentionDays}日間 保持後、自動削除</li>`,
    '    </ul>',
  ].join('\n');
};

const renderIndexTicketPacks = (config) => {
  const lines = ['      <div class="ticket-grid">'];
  visibleTicketPacks(config).forEach((pack) => {
    lines.push(`        <button class="ticket-pack" data-pack-id="${pack.packId}">`);
    lines.push(`          <span class="ticket-minutes">+${pack.minutes}分</span>`);
    lines.push(`          <span class="ticket-price">¥${JPY_FORMAT.format(pack.priceJpy)}</span>`);
    lines.push('        </button>');
  });
  lines.push('      </div>');
  return lines.join('\n');
};

const renderIndexPlanPolicySummary = (config) => {
  const free = config.plans.free;
  const pro = config.plans.pro;
  return [
    `      <p>保存期間: Free ${free.retentionDays}日 / Pro ${pro.retentionDays}日</p>`,
    '      <p>返金: 原則返金なし（<a href="/terms.html#refund-policy" data-legal-link="terms" data-link-source="home-policy">利用規約</a>をご確認ください）</p>',
  ].join('\n');
};

const applyTransforms = (config, filePath, source) => {
  let next = source;
  const relPath = path.relative(ROOT_DIR, filePath);

  if (relPath === path.join('static', 'pricing.html')) {
    next = replaceBlock(next, 'PRICING_PLAN_ROWS', renderPricingPlanRows(config));
    next = replaceBlock(next, 'PRICING_TICKET_LIST', renderPricingTicketList(config));
  } else if (relPath === path.join('static', 'terms.html')) {
    next = replaceBlock(next, 'TERMS_PLAN_LIST', renderTermsPlanList(config));
  } else if (relPath === path.join('static', 'privacy.html')) {
    next = replaceBlock(next, 'PRIVACY_RETENTION_LIST', renderPrivacyRetentionList(config));
  } else if (relPath === path.join('static', 'index.html')) {
    next = replaceBlock(next, 'INDEX_TICKET_PACKS', renderIndexTicketPacks(config));
    next = replaceBlock(next, 'INDEX_PLAN_POLICY_SUMMARY', renderIndexPlanPolicySummary(config));
  } else {
    throw new Error(`Unsupported target file: ${relPath}`);
  }

  return next;
};

const main = () => {
  const config = loadConfig();
  const targets = [
    path.join(ROOT_DIR, 'static', 'pricing.html'),
    path.join(ROOT_DIR, 'static', 'terms.html'),
    path.join(ROOT_DIR, 'static', 'privacy.html'),
    path.join(ROOT_DIR, 'static', 'index.html'),
  ];

  const changed = [];
  targets.forEach((targetPath) => {
    const original = fs.readFileSync(targetPath, 'utf8');
    const transformed = applyTransforms(config, targetPath, original);
    if (original !== transformed) {
      changed.push(path.relative(ROOT_DIR, targetPath));
      if (!CHECK_MODE) {
        fs.writeFileSync(targetPath, transformed);
      }
    }
  });

  if (CHECK_MODE) {
    if (changed.length > 0) {
      console.error('[generate_pricing] drift detected in generated blocks:');
      changed.forEach((file) => console.error(`  - ${file}`));
      process.exit(1);
    }
    console.log('[generate_pricing] OK: generated blocks are up to date');
    return;
  }

  if (changed.length === 0) {
    console.log('[generate_pricing] no changes');
    return;
  }
  console.log('[generate_pricing] updated files:');
  changed.forEach((file) => console.log(`  - ${file}`));
};

try {
  main();
} catch (err) {
  console.error(`[generate_pricing] ERROR: ${err.message}`);
  process.exit(1);
}
