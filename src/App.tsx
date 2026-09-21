import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PaletteProvider } from '@/components/palette/CommandPalette';
import { useResolvedTheme } from '@/lib/store';
import { CategoryPage } from '@/pages/CategoryPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ToolPage } from '@/pages/ToolPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  const theme = useResolvedTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <PaletteProvider>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:border-line-strong focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-fg"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/developer" element={<CategoryPage category="developer" />} />
            <Route path="/everyday" element={<CategoryPage category="everyday" />} />
            <Route path="/tools/:toolId" element={<ToolPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </PaletteProvider>
  );
}
