/**
 * Pure helpers for saved-prompt ownership and session handling (Day 9 hardening).
 * RLS is the real guard; these add an app-level second check so a policy mistake
 * (e.g. select policy also allowing visibility = 'public') never leaks other users'
 * rows into "my" dashboard, and an expired session never crashes the page.
 */

export type DbErrorLike = { message?: string; code?: string; status?: number } | null | undefined;

export const SESSION_EXPIRED_MSG = "Your session expired. Please sign in again.";

/** True when Supabase/PostgREST rejected the request because the JWT/session is expired or invalid. */
export function isSessionExpiredError(err: DbErrorLike): boolean {
  if (!err) return false;
  if (err.status === 401) return true;
  if (err.code === "PGRST301" || err.code === "PGRST302" || err.code === "PGRST303") return true;
  return /jwt expired|invalid jwt|jwt.*(malformed|invalid)|refresh token|session (not found|expired|missing)|auth session missing/i.test(err.message ?? "");
}

/** Maps Postgres/PostgREST/auth errors to readable text. */
export function friendlyDbError(msg: string): string {
  if (msg.includes("FREE_SAVE_LIMIT")) return "Free plan save limit reached (25 prompts).";
  if (msg.includes("AUTH_REQUIRED")) return "Please sign in first.";
  if (msg.includes("NOT_FOUND")) return "Item not found (or not yours).";
  if (isSessionExpiredError({ message: msg })) return SESSION_EXPIRED_MSG;
  if (/failed to fetch|network|fetch failed|timeout/i.test(msg)) return "Couldn't reach the server. Check your connection and try again.";
  return msg;
}

/** Keep only rows owned by userId (rows without user_id are dropped when a user is given). */
export function ownedOnly<T extends { user_id?: string | null }>(rows: readonly T[], userId: string): T[] {
  return rows.filter((r) => r.user_id === userId);
}

/** Session usable for DB calls: present and not past expires_at (seconds since epoch). */
export function isSessionLive(session: { expires_at?: number | null } | null | undefined, nowMs = Date.now()): boolean {
  if (!session) return false;
  if (typeof session.expires_at !== "number") return true;
  return session.expires_at * 1000 > nowMs;
}

/** Throws when an update/delete matched no rows (not found, or owned by someone else). */
export function assertAffected(rows: readonly unknown[] | null | undefined): void {
  if (!rows || rows.length === 0) throw new Error(friendlyDbError("NOT_FOUND"));
}
