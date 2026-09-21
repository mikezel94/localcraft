import { useEffect } from 'react';

import type { SeoData } from '@/lib/seoData';
import { SITE_URL } from '@/lib/site';

function upsertMeta(selector: string, attrs: Record<string, string>): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.append(el);
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.append(el);
  }
  el.href = href;
}

/**
 * Keeps the document <head> in sync with the current route (SPA navigations).
 * The prerender script writes the same tags statically for first paint + crawlers.
 */
export function Seo({ data }: { data: SeoData }) {
  useEffect(() => {
    document.title = data.title;
    upsertMeta('meta[name="description"]', { name: 'description', content: data.description });
    upsertLink('canonical', `${SITE_URL}${data.path}`);
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: data.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: data.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: `${SITE_URL}${data.path}` });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: data.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: data.description });

    const existing = document.head.querySelectorAll('script[data-seo-jsonld]');
    existing.forEach((el) => el.remove());
    for (const entry of data.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonld = '';
      script.textContent = JSON.stringify(entry);
      document.head.append(script);
    }
  }, [data]);

  return null;
}
