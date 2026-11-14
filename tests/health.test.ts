import { describe, it, expect, afterEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { isAuthorized } from "@/lib/health-auth";

const req = (auth?: string) => new Request("http://localhost/api/health", { headers: auth ? { authorization: auth } : {} });
const prev = process.env.HEALTH_TOKEN;
afterEach(() => { if (prev === undefined) delete process.env.HEALTH_TOKEN; else process.env.HEALTH_TOKEN = prev; });

describe("/api/health", () => {
  it("public response is only { status: ok } with no config flags or commit", async () => {
    process.env.HEALTH_TOKEN = "t0ken-for-tests-1234567890";
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("wrong or malformed token gets the public response", async () => {
    process.env.HEALTH_TOKEN = "t0ken-for-tests-1234567890";
    for (const h of ["Bearer nope", "Bearer t0ken-for-tests-123456789X", "t0ken-for-tests-1234567890", "Basic abc"]) {
      expect(await (await GET(req(h))).json()).toEqual({ status: "ok" });
    }
  });

  it("unset HEALTH_TOKEN never unlocks details", async () => {
    delete process.env.HEALTH_TOKEN;
    expect(await (await GET(req("Bearer "))).json()).toEqual({ status: "ok" });
    expect(isAuthorized("Bearer x", "")).toBe(false);
  });

  it("valid bearer token returns detailed booleans and no secret values", async () => {
    process.env.HEALTH_TOKEN = "t0ken-for-tests-1234567890";
    const res = await GET(req("Bearer t0ken-for-tests-1234567890"));
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty("commit");
    for (const v of Object.values(body.checks)) expect(["boolean", "number"]).toContain(typeof v);
    expect(JSON.stringify(body)).not.toContain("t0ken-for-tests");
  });
});
