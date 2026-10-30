"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", msg: "client_render_error", digest: error.digest ?? null, message: error.message }));
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role="alert">
      <h1 className="h1">Something went wrong</h1>
      <p className="mt-3 text-slate-600">This page hit an unexpected error. Your saved prompts are safe. Please try again.</p>
      {error.digest ? <p className="mt-2 text-xs text-slate-400">Error reference: <code>{error.digest}</code></p> : null}
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>Try again</button>
        <Link className="btn-secondary" href="/">Home</Link>
      </div>
    </div>
  );
}
