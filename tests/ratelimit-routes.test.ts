import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as enhancePOST } from "@/app/api/enhance/route";
import { GET as cardGET } from "@/app/api/card/route";

describe("route-level rate limiting", () => {
  it("/api/enhance returns 429 JSON + Retry-After after 10 requests/min from one IP", async () => {
    const mk = () => new NextRequest("http://localhost/api/enhance", { method: "POST", headers: { "x-real-ip": "203.0.113.7", "content-type": "application/json" }, body: "{}" });
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) statuses.push((await enhancePOST(mk())).status);
    expect(statuses.every((s) => s === 400)).toBe(true); // no key → validation error, but counted
    const res = await enhancePOST(mk());
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await res.json()).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });

  it("/api/card returns 429 JSON once the per-IP limit is hit (limit checked before rendering)", async () => {
    process.env.RL_CARD_PER_MIN = "1";
    try {
      const mk = () => new Request("http://localhost/api/card?goal=hi", { headers: { "x-real-ip": "203.0.113.8" } });
      await cardGET(mk()).catch(() => undefined); // first render may fail in jsdom/node without fonts; we only care about the limiter
      const res = await cardGET(mk());
      expect(res.status).toBe(429);
      expect(res.headers.get("retry-after")).toBeTruthy();
    } finally {
      delete process.env.RL_CARD_PER_MIN;
    }
  });
});

describe("rate-limit headers on allowed responses", () => {
  it("/api/enhance exposes X-RateLimit-Remaining counting down", async () => {
    const mk = () => new NextRequest("http://localhost/api/enhance", { method: "POST", headers: { "x-real-ip": "203.0.113.9" }, body: "{}" });
    const a = await enhancePOST(mk());
    const b = await enhancePOST(mk());
    expect(a.headers.get("x-ratelimit-limit")).toBe("10");
    expect(Number(a.headers.get("x-ratelimit-remaining"))).toBe(Number(b.headers.get("x-ratelimit-remaining")) + 1);
  });
});
