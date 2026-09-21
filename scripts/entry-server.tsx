import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';

import { App } from '@/App';

export { seoForPath, allSeoPaths } from '@/lib/seoData';
export { SITE_URL } from '@/lib/site';

/** Render a route to static HTML — used by scripts/prerender.mjs at build time. */
export function render(path: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
