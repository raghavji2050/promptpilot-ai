/**
 * Structured JSON logger for API routes. One JSON object per line goes to
 * stdout/stderr, which Vercel's free runtime logs capture. Never log secrets,
 * request bodies or API keys — only metadata.
 */
type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

export interface Logger {
  requestId: string;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

const REDACT = /key|token|secret|password|authorization|cookie/i;

function clean(fields: Fields = {}): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (REDACT.test(k)) out[k] = "[redacted]";
    else if (v instanceof Error) out[k] = { name: v.name, message: v.message };
    else out[k] = v;
  }
  return out;
}

export function newRequestId(headers?: Headers): string {
  const fromVercel = headers?.get("x-vercel-id");
  const incoming = headers?.get("x-request-id");
  if (incoming && /^[\w.:-]{6,100}$/.test(incoming)) return incoming;
  if (fromVercel) return fromVercel;
  return globalThis.crypto?.randomUUID?.() ?? `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLogger(route: string, requestId: string, sink: (level: Level, line: string) => void = defaultSink): Logger {
  const write = (level: Level, msg: string, fields?: Fields) =>
    sink(level, JSON.stringify({ time: new Date().toISOString(), level, route, requestId, msg, ...clean(fields) }));
  return {
    requestId,
    info: (m, f) => write("info", m, f),
    warn: (m, f) => write("warn", m, f),
    error: (m, f) => write("error", m, f),
  };
}

function defaultSink(level: Level, line: string) {
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  // eslint-disable-next-line no-console
  else console.log(line);
}

type Handler<R extends Request> = (req: R, log: Logger) => Promise<Response> | Response;

/**
 * Wraps a route handler: assigns a request id (x-request-id response header),
 * logs one access line with status + duration, and turns uncaught errors into
 * a safe 500 JSON response that includes the request id for support.
 */
export function withLogging<R extends Request>(route: string, handler: Handler<R>, sink?: (level: Level, line: string) => void) {
  return async (req: R): Promise<Response> => {
    const requestId = newRequestId(req.headers);
    const log = createLogger(route, requestId, sink);
    const started = Date.now();
    let res: Response;
    try {
      res = await handler(req, log);
    } catch (e) {
      log.error("unhandled_error", { err: e instanceof Error ? e : String(e) });
      res = Response.json({ ok: false, error: { code: "INTERNAL", message: "Unexpected error", requestId } }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
    try { res.headers.set("x-request-id", requestId); } catch { /* immutable headers */ }
    const level: Level = res.status >= 500 ? "error" : res.status >= 400 ? "warn" : "info";
    log[level]("request", { method: req.method, path: new URL(req.url).pathname, status: res.status, durationMs: Date.now() - started });
    return res;
  };
}
