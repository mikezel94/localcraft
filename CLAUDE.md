# CLAUDE.md

Commands:

- `npm run dev` — Vite dev server (syncs the ffmpeg core into public/ffmpeg first)
- `npm run build` — sync ffmpeg → `tsc --noEmit` → client build → SSR build →
  `scripts/prerender.mjs` (writes dist/<path>/index.html, sitemap.xml, robots.txt,
  404.html). All stages must pass; `.ssr/` is temporary and removed by the script.
- `npm run preview` — serve `dist/`; use this (not dev) to test the service worker
  and the prerendered pages.

SEO: every route must stay renderable by `renderToString`. Keep browser APIs out of
module scope / render paths (see guards in `lib/store.ts`, `layout/Header.tsx`).
Per-page head data lives in ONE place: `lib/seoData.ts` (used by both the client
`<Seo>` component and the prerenderer). New registry entries automatically join
routes, sitemap and prerender.

Architecture in one line: `src/tools/registry.ts` is the single source of truth —
routes, ⌘K palette, dashboard, favorites and recents all derive from it. See
README ("Add a tool") for the recipe.

Conventions:

- 100% client-side: never add `fetch()` calls to remote services, CDN fonts, or
  analytics. Fonts are self-hosted via @fontsource packages.
- Tool logic (PDF generation etc.) lives in framework-free modules (e.g.
  `tools/**/pdf.ts`) so it stays testable; components only wire state.
- Heavy deps (pdf-lib, pdf.js) are imported inside tool files only — they are
  code-split per tool and must not leak into the main bundle.
- State: `src/lib/store.ts` (useSyncExternalStore + localStorage). Keys are
  prefixed `localcraft:`.
- Tailwind v4 with CSS-variable theme tokens (`--ink`, `--pencil`, `--highlight`…)
  defined in `src/styles/global.css`. Dark mode = `.dark` class + `dark:` variant.
  Prefer semantic tokens (bg-surface, text-fg, border-line) over raw colors.
- TypeScript is strict with `verbatimModuleSyntax` — use `import type` for types.
  Tailwind gotcha: base control classes include `w-full`; override widths with
  important modifiers (`w-16!`) when passing width classes.
- Heavy tool deps must stay behind dynamic `import()` inside the tool folder
  (`sql-formatter`, `yaml`, `papaparse`, `diff`, `qrcode`, `bwip-js/browser`,
  `@imgly/background-removal`, `@ffmpeg/ffmpeg`) — never import them at the top
  level of shared modules. `import type` is fine (erased at build).
