import { getTool, toolRegistry } from '@/tools/registry';
import { CATEGORIES, type CategoryId } from '@/tools/types';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from './site';

export interface SeoData {
  title: string;
  description: string;
  /** canonical path, starting with / */
  path: string;
  /** JSON-LD structured data objects, serialized into <script type="application/ld+json"> */
  jsonLd: object[];
}

function breadcrumb(items: { name: string; path: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** Single source for every page's <head> — used by the client <Seo> tag and by the prerender script. */
export function seoForPath(path: string): SeoData {
  const toolMatch = /^\/tools\/([a-z0-9-]+)$/.exec(path);
  if (toolMatch) {
    const tool = getTool(toolMatch[1]!);
    if (tool) {
      const category = CATEGORIES[tool.category];
      return {
        title: `${tool.name} — free & private | ${SITE_NAME}`,
        description: `${tool.blurb} Runs entirely in your browser — no uploads, no accounts, works offline.`,
        path,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: `${tool.name} — ${SITE_NAME}`,
            applicationCategory: tool.category === 'developer' ? 'DeveloperApplication' : 'UtilitiesApplication',
            operatingSystem: 'Any (web browser)',
            description: tool.blurb,
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
          },
          breadcrumb([
            { name: SITE_NAME, path: '/' },
            { name: category.label, path: `/${tool.category}` },
            { name: tool.name, path },
          ]),
        ],
      };
    }
  }

  if (path === '/developer' || path === '/everyday') {
    const category: CategoryId = path === '/developer' ? 'developer' : 'everyday';
    const label = CATEGORIES[category].label;
    return {
      title: `${label} — free & private | ${SITE_NAME}`,
      description: `Every ${label.replace(/s$/, '').toLowerCase()} tool in ${SITE_NAME}, running entirely in your browser. No uploads, no accounts, works offline.`,
      path,
      jsonLd: [
        breadcrumb([
          { name: SITE_NAME, path: '/' },
          { name: label, path },
        ]),
      ],
    };
  }

  if (path === '/') {
    return {
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      path,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          description: SITE_DESCRIPTION,
        },
      ],
    };
  }

  return {
    title: `Page not found | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    path,
    jsonLd: [],
  };
}

/** All indexable routes — drives the sitemap and the prerenderer. */
export function allSeoPaths(): string[] {
  return ['/', '/developer', '/everyday', ...toolRegistry.map((tool) => `/tools/${tool.id}`)];
}
