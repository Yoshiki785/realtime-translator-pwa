#!/usr/bin/env node

/**
 * scripts/generate_marketing.js
 *
 * Generates product pages, nav links, product listing cards, home product
 * cards, and sitemap.xml from marketing/config/products.json.
 *
 * Uses the same AUTO:KEY:START/END marker pattern as generate_pricing.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'marketing', 'config', 'products.json');
const TEMPLATE_PATH = path.join(ROOT, 'marketing', 'templates', 'product.html');
const PRODUCTS_PAGE = path.join(ROOT, 'marketing', 'pages', 'products.html');
const INDEX_PAGE = path.join(ROOT, 'marketing', 'pages', 'index.html');
const HEADER_PARTIAL = path.join(ROOT, 'marketing', 'templates', '_header.html');
const FOOTER_PARTIAL = path.join(ROOT, 'marketing', 'templates', '_footer.html');
const STATIC_SITEMAP = path.join(ROOT, 'marketing', 'seo', 'sitemap-static.xml');
const OUT_DIR = path.join(ROOT, 'marketing_public');

// ── Load and validate config ──

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const products = config.products;

if (!Array.isArray(products) || products.length === 0) {
  console.error('[generate_marketing] ERROR: products array is empty or missing');
  process.exit(1);
}

products.forEach((p, i) => {
  if (!p.slug) throw new Error(`products[${i}] missing slug`);
  if (!p.name) throw new Error(`products[${i}] missing name`);
  if (!p.tagline) throw new Error(`products[${i}] missing tagline`);
  if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`products[${i}].slug invalid: ${p.slug}`);
});

const SITE_URL = config.site_url || 'https://lingoflow-ai.com';
const APP_URL = config.app_url || 'https://app.lingoflow-ai.com';
const activeProducts = products
  .filter(p => p.status === 'active')
  .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));

// ── Helper: replace AUTO marker block (same pattern as generate_pricing.js) ──

const replaceBlock = (source, key, generatedContent) => {
  const startMarker = `<!-- AUTO:${key}:START -->`;
  const endMarker = `<!-- AUTO:${key}:END -->`;

  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return source; // marker not found, skip
  if (endIdx <= startIdx) {
    throw new Error(`Invalid marker order for ${key}`);
  }

  const head = source.slice(0, startIdx + startMarker.length);
  const endLineStart = source.lastIndexOf('\n', endIdx) + 1;
  const endIndent = source.slice(endLineStart, endIdx);
  const tail = source.slice(endIdx);
  return `${head}\n${generatedContent.trimEnd()}\n${endIndent}${tail}`;
};

// ── 1. Generate individual product pages ──

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

fs.mkdirSync(path.join(OUT_DIR, 'products'), { recursive: true });

products.forEach(product => {
  let page = template;

  const replacements = {
    '{{slug}}': product.slug,
    '{{name}}': product.name,
    '{{tagline}}': product.tagline,
    '{{description}}': product.description || '',
    '{{cta_url}}': product.cta_url || APP_URL,
    '{{cta_text}}': product.cta_text || 'Try Free',
    '{{hero_image}}': product.hero_image || '/assets/images/og-default.png',
    '{{og_image}}': product.og_image || '/assets/images/og-default.png',
    '{{canonical_url}}': `${SITE_URL}/products/${product.slug}`,
    '{{status_badge}}': product.status === 'coming-soon'
      ? '<span class="lp-badge lp-badge--coming-soon">Coming Soon</span>'
      : '',
  };

  // Features list
  const featuresHtml = (product.features || [])
    .map(f => `        <li class="lp-feature-item" data-animate="fade-up"><h3 class="lp-feature-title">${f.title}</h3><p>${f.description}</p></li>`)
    .join('\n');
  replacements['{{features_list}}'] = featuresHtml;

  Object.entries(replacements).forEach(([token, value]) => {
    page = page.split(token).join(value);
  });

  const outPath = path.join(OUT_DIR, 'products', `${product.slug}.html`);
  fs.writeFileSync(outPath, page);
  console.log(`  Generated: products/${product.slug}.html`);
});

// ── 2. Inject navigation links into header partial ──

const navLinks = activeProducts
  .map(p => `        <li><a href="/products/${p.slug}">${p.name}</a></li>`)
  .join('\n');

let headerContent = fs.readFileSync(HEADER_PARTIAL, 'utf8');
headerContent = replaceBlock(headerContent, 'NAV_PRODUCTS', navLinks);
headerContent = replaceBlock(headerContent, 'NAV_PRODUCTS_MOBILE', navLinks);
fs.writeFileSync(HEADER_PARTIAL, headerContent);
console.log('  Updated: _header.html nav links');

// ── 3. Inject footer product links ──

let footerContent = fs.readFileSync(FOOTER_PARTIAL, 'utf8');
const footerLinks = activeProducts
  .map(p => `          <li><a href="/products/${p.slug}">${p.name}</a></li>`)
  .join('\n');
footerContent = replaceBlock(footerContent, 'FOOTER_PRODUCTS', footerLinks);
fs.writeFileSync(FOOTER_PARTIAL, footerContent);
console.log('  Updated: _footer.html product links');

// ── 4. Inject product cards into products.html ──

const productCards = products
  .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
  .map(p => {
    const badge = p.status === 'coming-soon'
      ? ' <span class="lp-badge lp-badge--coming-soon">Coming Soon</span>'
      : '';
    return `        <article class="lp-product-card" data-animate="fade-up">
          <h3>${p.name}${badge}</h3>
          <p>${p.tagline}</p>
          <a href="/products/${p.slug}" class="lp-link" data-analytics="cta_click" data-analytics-label="products-${p.slug}">Learn more &rarr;</a>
        </article>`;
  }).join('\n');

let productsPage = fs.readFileSync(PRODUCTS_PAGE, 'utf8');
productsPage = replaceBlock(productsPage, 'PRODUCT_CARDS', productCards);
fs.writeFileSync(PRODUCTS_PAGE, productsPage);
console.log('  Updated: products.html product cards');

// ── 5. Inject home page product cards ──

const homeCards = activeProducts.map(p => {
  return `        <article class="lp-product-card" data-animate="fade-up">
          <h3>${p.name}</h3>
          <p>${p.tagline}</p>
          <a href="/products/${p.slug}" class="lp-link" data-analytics="cta_click" data-analytics-label="home-${p.slug}">Learn more &rarr;</a>
        </article>`;
}).join('\n');

let indexPage = fs.readFileSync(INDEX_PAGE, 'utf8');
indexPage = replaceBlock(indexPage, 'HOME_PRODUCT_CARDS', homeCards);
fs.writeFileSync(INDEX_PAGE, indexPage);
console.log('  Updated: index.html home product cards');

// ── 6. Generate sitemap.xml ──

const today = new Date().toISOString().split('T')[0];

let staticEntries = '';
if (fs.existsSync(STATIC_SITEMAP)) {
  staticEntries = fs.readFileSync(STATIC_SITEMAP, 'utf8');
}

const productEntries = activeProducts
  .map(p => `  <url>
    <loc>${SITE_URL}/products/${p.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${staticEntries}
${productEntries}
</urlset>
`;

fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap);
console.log('  Generated: sitemap.xml');

console.log('[generate_marketing] done');
