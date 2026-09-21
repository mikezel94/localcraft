/**
 * Static prerenderer: renders every route to dist/<path>/index.html with
 * per-route <head> (title, description, canonical, OG, JSON-LD), and emits
 * sitemap.xml, robots.txt and 404.html. Runs after `vite build` + the SSR build.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'dist');

const server = await import(join(root, '.ssr', 'entry-server.js'));
const { render, seoForPath, allSeoPaths, SITE_URL } = server;

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const template = await readFile(join(outDir, 'index.html'), 'utf8');

function inject(html, seo, appHtml) {
  const headExtra = [
    `<link rel="canonical" href="${SITE_URL}${seo.path}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:url" content="${SITE_URL}${seo.path}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    ...seo.jsonLd.map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`),
  ].join('\n    ');

  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, headExtra)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

const paths = allSeoPaths();
for (const path of paths) {
  const seo = seoForPath(path);
  const html = inject(template, seo, render(path));
  const outFile = path === '/' ? join(outDir, 'index.html') : join(outDir, path, 'index.html');
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, html);
  console.log(`  prerendered ${path}`);
}

// SPA fallback for hosts that serve 404.html (GitHub Pages) — renders the app shell.
await writeFile(join(outDir, '404.html'), inject(template, seoForPath('/page-not-found'), render('/page-not-found')));

// Sitemap + robots
const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${SITE_URL}${path}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
await writeFile(join(outDir, 'sitemap.xml'), sitemap);
await writeFile(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

await rm(join(root, '.ssr'), { recursive: true, force: true });
console.log(`  prerender complete: ${paths.length} pages + 404.html + sitemap.xml + robots.txt`);
