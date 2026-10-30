"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div role="alert" style={{ maxWidth: 560, margin: "96px auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 28 }}>PromptPilot hit an unexpected error</h1>
          <p style={{ color: "#475569" }}>Please try again. If it keeps happening, reload the page.</p>
          {error.digest ? <p style={{ color: "#94a3b8", fontSize: 12 }}>Error reference: <code>{error.digest}</code></p> : null}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button type="button" onClick={() => reset()} style={{ padding: "8px 16px", borderRadius: 8, background: "#4f46e5", color: "#fff", border: 0, cursor: "pointer" }}>Try again</button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", color: "#0f172a", textDecoration: "none" }}>Home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
