import { describe, it, expect } from "vitest";
import { createLogger, newRequestId, withLogging } from "@/lib/log";

describe("structured logger", () => {
  it("writes JSON lines with route + requestId and redacts secret-looking fields", () => {
    const lines: string[] = [];
    const log = createLogger("api/test", "req-123", (_l, line) => lines.push(line));
    log.info("hello", { apiKey: "sk-abc", count: 2 });
    const obj = JSON.parse(lines[0] ?? "{}");
    expect(obj).toMatchObject({ level: "info", route: "api/test", requestId: "req-123", msg: "hello", apiKey: "[redacted]", count: 2 });
    expect(lines[0]).not.toContain("sk-abc");
  });

  it("reuses a safe incoming x-request-id, otherwise generates one", () => {
    expect(newRequestId(new Headers({ "x-request-id": "abc-123456" }))).toBe("abc-123456");
    const gen = newRequestId(new Headers({ "x-request-id": "bad id with spaces!" }));
    expect(gen).not.toContain(" ");
    expect(gen.length).toBeGreaterThan(5);
  });

  it("withLogging adds x-request-id and logs status", async () => {
    const lines: string[] = [];
    const h = withLogging("api/ok", () => Response.json({ ok: true }), (_l, line) => lines.push(line));
    const res = await h(new Request("http://x/api/ok"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const last = JSON.parse(lines.at(-1) ?? "{}");
    expect(last).toMatchObject({ msg: "request", status: 200, path: "/api/ok", requestId: res.headers.get("x-request-id") });
  });

  it("withLogging turns thrown errors into a safe 500 with request id", async () => {
    const lines: string[] = [];
    const h = withLogging("api/boom", () => { throw new Error("db password=hunter2 leaked"); }, (_l, line) => lines.push(line));
    const res = await h(new Request("http://x/api/boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.requestId).toBe(res.headers.get("x-request-id"));
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(lines.some((l) => JSON.parse(l).level === "error")).toBe(true);
  });
});
