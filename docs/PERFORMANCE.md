# Performance (Day 11)

## Lighthouse CI
- Config: `lighthouserc.cjs`
- Threshold: **categories.performance ≥ 0.9** on `/` (mobile emulation).
- CI job: `lighthouse` (separate from `check` so a flake near 90 does not red typecheck/lint/test/e2e).
- Local: `npm run build && npx next start -p 3100` then `npx @lhci/cli autorun --config=lighthouserc.cjs`.

## Fonts / images
- Fonts: `next/font` Geist + Geist Mono with `display: "swap"` (no Google Fonts `<link>`).
- Images: share cards and run results use dynamic `/api/card` or provider URLs with plain `<img>` (onLoad handlers); no remote CDN. Prefer `next/image` when adding static assets.

## Bundle budget
- `npm run bundle-check` after `next build`.
- Fails if First Load JS for `/` exceeds **450 KB gzip** (unique polyfill + root + page chunks).
