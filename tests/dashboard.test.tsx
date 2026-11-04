// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";

const ME = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
type Resp = { data: unknown; error: { message: string; code?: string } | null };

/** Minimal chainable fake of the supabase-js query builder that records filters. */
function fakeClient(opts: { session: unknown; select?: Resp | (() => Resp); del?: Resp; signOut?: () => void }) {
  const calls: { op: string; filters: [string, unknown][] }[] = [];
  const builder = (op: string) => {
    const rec = { op, filters: [] as [string, unknown][] };
    calls.push(rec);
    const b: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit", "delete", "insert"]) b[m] = (...a: unknown[]) => { if (m === "delete") rec.op = "delete"; void a; return b; };
    b.eq = (c: string, v: unknown) => { rec.filters.push([c, v]); return b; };
    b.then = (res: (r: Resp) => unknown, rej?: (e: unknown) => unknown) => {
      const r = rec.op === "delete" ? (opts.del ?? { data: [], error: null }) : typeof opts.select === "function" ? opts.select() : (opts.select ?? { data: [], error: null });
      return Promise.resolve(r).then(res, rej);
    };
    return b;
  };
  return {
    calls,
    client: {
      from: () => builder("select"),
      rpc: vi.fn(async () => ({ data: null, error: null })),
      auth: {
        getSession: async () => ({ data: { session: opts.session }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: vi.fn(async () => { opts.signOut?.(); return { error: null }; }),
      },
    },
  };
}

async function mount(fc: ReturnType<typeof fakeClient> | null) {
  vi.doMock("@/lib/supabase", () => ({ getSupabase: () => fc?.client ?? null, supabaseConfigured: Boolean(fc) }));
  vi.doMock("@/lib/favorites", () => ({ useFavorites: () => ({ slugs: [], ready: true, remote: false, error: null, toggle: async () => {} }), useUsage: () => null }));
  const { Dashboard } = await import("@/components/Dashboard");
  const { ToastProvider } = await import("@/components/ui/Toast");
  render(<ToastProvider><Dashboard /></ToastProvider>);
}
const live = { user: { id: ME, email: "me@example.com" }, expires_at: Math.floor(Date.now() / 1000) + 3600 };
const row = (id: string, user_id: string, title: string) => ({ id, user_id, title, source: "builder", target_id: null, output: `out ${title}`, created_at: "2026-11-04T00:00:00Z", visibility: user_id === ME ? "private" : "public", share_slug: null });

afterEach(() => { cleanup(); vi.resetModules(); vi.doUnmock("@/lib/supabase"); vi.doUnmock("@/lib/favorites"); localStorage.clear(); });

describe("Dashboard saved prompts (Day 9 hardening)", () => {
  it("shows only my rows: queries with user_id filter and drops other users' public rows", async () => {
    const fc = fakeClient({ session: live, select: { data: [row("a", ME, "Mine"), row("b", OTHER, "Someone else public")], error: null } });
    await mount(fc);
    expect(await screen.findByText("Mine")).toBeTruthy();
    expect(screen.queryByText("Someone else public")).toBeNull();
    expect(fc.calls[0]?.filters).toContainEqual(["user_id", ME]);
  });
  it("empty state when nothing saved", async () => {
    await mount(fakeClient({ session: live }));
    expect(await screen.findByText("Nothing saved yet")).toBeTruthy();
  });
  it("error state with retry, no crash", async () => {
    let n = 0;
    const fc = fakeClient({ session: live, select: () => (++n === 1 ? { data: null, error: { message: "TypeError: Failed to fetch" } } : { data: [row("a", ME, "Back")], error: null }) });
    await mount(fc);
    const alert = await screen.findByTestId("saved-error");
    expect(alert.textContent).toMatch(/connection/);
    expect(screen.queryByText("Nothing saved yet")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Back")).toBeTruthy();
  });
  it("expired JWT on load signs out locally and shows sign-in-again", async () => {
    const fc = fakeClient({ session: live, select: { data: null, error: { message: "JWT expired", code: "PGRST301" } } });
    await mount(fc);
    expect(await screen.findByTestId("session-expired")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign in again" }).getAttribute("href")).toBe("/login");
    expect(fc.client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("stored session past expires_at is treated as expired (no DB call)", async () => {
    const fc = fakeClient({ session: { ...live, expires_at: 1000 } });
    await mount(fc);
    expect(await screen.findByTestId("session-expired")).toBeTruthy();
    expect(fc.calls.length).toBe(0);
  });
  it("delete is scoped to my user_id and reports 0-row deletes", async () => {
    const fc = fakeClient({ session: live, select: { data: [row("a", ME, "Mine")], error: null }, del: { data: [], error: null } });
    await mount(fc);
    await screen.findByText("Mine");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialogBtns = await screen.findAllByRole("button", { name: "Delete", hidden: true });
    fireEvent.click(dialogBtns[dialogBtns.length - 1]!);
    await waitFor(() => expect(fc.calls.some((c) => c.op === "delete")).toBe(true));
    const del = fc.calls.find((c) => c.op === "delete")!;
    expect(del.filters).toEqual([["id", "a"], ["user_id", ME]]);
    expect(await screen.findByText(/not yours/)).toBeTruthy();
  });
  it("logged out without Supabase: browser-only notice", async () => {
    await mount(null);
    expect(await screen.findByText(/in this browser only/)).toBeTruthy();
  });
});
