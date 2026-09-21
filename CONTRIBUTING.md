# Contributing to LocalCraft

Thanks for helping build the toolbox that never phones home. 🛠️

## Ground rules

LocalCraft's whole promise is **100% client-side, zero telemetry**. Every change has to
keep that promise:

- **No `fetch()` to remote services.** Tools compute in the browser — pdf-lib, pdf.js,
  Canvas, Web Crypto, WebAssembly. (The two existing model/runtime downloads are
  documented exceptions in the README; new ones need a very good reason and a UI flag.)
- **No uploads, no accounts, no analytics, no CDN fonts.** Everything is self-hosted.
- **Heavy dependencies stay inside tool folders** behind dynamic `import()`, never at
  the top level of shared modules — tool chunks are code-split per tool.
- **Persisted state goes through `src/lib/store.ts`** (`localStorage`, keys prefixed
  `localcraft:`).
- Every route must stay renderable by `renderToString` — keep browser APIs out of
  module scope and render paths (see guards in `src/lib/store.ts`,
  `src/components/layout/Header.tsx`).

## Adding a tool

The recipe is in the [README](./README.md#add-a-tool): one folder under
`src/tools/<category>/<tool-id>/` and one entry in `src/tools/registry.ts`. Routing,
the ⌘K palette, the dashboard, sitemap and prerender pick it up automatically.

Conventions worth knowing:

- TypeScript is strict with `verbatimModuleSyntax` — use `import type` for types.
- Tailwind v4 with CSS-variable theme tokens — prefer semantic classes
  (`bg-surface`, `text-fg`, `border-line`) over raw colors. Dark mode is a `.dark`
  class; test both.
- Tool logic (PDF generation etc.) lives in framework-free modules (e.g.
  `tools/**/pdf.ts`); components only wire state.

## Before you open a PR

```bash
npm run typecheck   # must pass
npm run build       # must pass end to end (client + SSR + prerender)
npm run preview     # click through your tool in the production build
```

Please check dark mode, the ⌘K search (name + keywords), and offline behavior (DevTools
→ Network → Offline) for anything you add.

For anything larger than a small fix, please open an issue first so we can align on
the approach.

## License

By contributing, you agree that your contributions will be licensed under the MIT
[license](./LICENSE).
