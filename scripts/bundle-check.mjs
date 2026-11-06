#!/usr/bin/env node
/**
 * Day 11 bundle check (free): after `next build`, sum unique First Load JS chunks
 * for `/` (polyfills + rootMainFiles + page client-reference chunks) and fail if
 * gzipped size exceeds BUDGET_GZIP_KB.
 *
 * Budget: 450 KB gzip for `/` First Load JS (current ~360 KB; room for small growth).
 * Run: npm run build && npm run bundle-check
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const NEXT = join(ROOT, ".next");
const BUDGET_GZIP_KB = 450;

function fail(msg) {
  console.error(`bundle-check: ${msg}`);
  process.exit(1);
}

if (!existsSync(join(NEXT, "build-manifest.json"))) {
  fail("no .next/build-manifest.json — run `npm run build` first");
}

const bm = JSON.parse(readFileSync(join(NEXT, "build-manifest.json"), "utf8"));
const files = new Set([...(bm.polyfillFiles || []), ...(bm.rootMainFiles || [])]);

for (const man of ["server/app/page_client-reference-manifest.js"]) {
  const p = join(NEXT, man);
  if (!existsSync(p)) continue;
  const ref = readFileSync(p, "utf8");
  for (const m of ref.matchAll(/\/?_?next\/static\/chunks\/[^"'\\\s]+\.js|static\/chunks\/[^"'\\\s]+\.js/g)) {
    let f = m[0].replace(/^\/_next\//, "").replace(/^_next\//, "");
    if (!f.startsWith("static/")) f = f.replace(/^\//, "");
    files.add(f);
  }
}

let raw = 0;
let gz = 0;
const missing = [];
for (const f of files) {
  const p = join(NEXT, f);
  if (!existsSync(p)) {
    missing.push(f);
    continue;
  }
  const buf = readFileSync(p);
  raw += buf.length;
  gz += gzipSync(buf).length;
}

const rawKb = raw / 1024;
const gzKb = gz / 1024;
console.log(
  `bundle-check: / First Load JS — ${files.size} chunks, ${rawKb.toFixed(1)} KB raw, ${gzKb.toFixed(1)} KB gzip (budget ${BUDGET_GZIP_KB} KB gzip)`,
);
if (missing.length) console.warn("bundle-check: missing chunks (skipped):", missing.join(", "));
if (gzKb > BUDGET_GZIP_KB) fail(`gzip ${gzKb.toFixed(1)} KB exceeds budget ${BUDGET_GZIP_KB} KB`);
console.log("bundle-check: OK");
