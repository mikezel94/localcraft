/**
 * Canonical origin for the deployed site — used for canonical URLs, the
 * sitemap, Open Graph tags and JSON-LD. Override at build time:
 *   VITE_SITE_URL=https://yourdomain.example npm run build
 */
const raw = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://localcraft.app';
export const SITE_URL = raw.replace(/\/+$/, '');

export const SITE_NAME = 'LocalCraft';
export const SITE_TAGLINE = 'The toolbox that never phones home.';
export const SITE_DESCRIPTION =
  'A toolbox for developers and everyday work that runs entirely in your browser. Zero servers, 100% private, works offline.';
