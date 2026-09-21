import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/spline-sans-mono';
import './styles/global.css';

import { registerSW } from 'virtual:pwa-register';
import { App } from './App';

// Precaches the whole app shell so every tool works with the network off.
registerSW({ immediate: true });

const rootEl = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// The prerender step ships real markup for every route — hydrate over it when
// present, otherwise (plain SPA hosting) render fresh.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
