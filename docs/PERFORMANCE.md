# Performance (Day 11)

## Lighthouse CI
- Config: `lighthouserc.cjs`
- Threshold: **categories.performance ≥ 0.9** on `/` (mobile emulation).
- Local (box, 6 Nov): **93** performance (also a11y 97, BP 93, SEO 100).
- CI job: `lighthouse` (separate from `check`, `continue-on-error: true`) runs 3× against production URL. GHA shared runners often score ~0.68 under simulated mobile throttling; do not treat a red lighthouse annotation alone as a site regression when local/`check` are green.
- Local: `LHCI_URL=http://127.0.0.1:3100/ npx lhci autorun --config=lighthouserc.cjs` (with `next start -p 3100`).

## Fonts / images
- Fonts: `next/font` Geist + Geist Mono with `display: "swap"` (no Google Fonts `<link>`).
- Images: share cards and run results use dynamic `/api/card` or provider URLs with plain `<img>` (onLoad handlers); no remote CDN. Prefer `next/image` when adding static assets.

## Bundle budget
- `npm run bundle-check` after `next build`.
- Fails if First Load JS for `/` exceeds **450 KB gzip** (unique polyfill + root + page chunks).
