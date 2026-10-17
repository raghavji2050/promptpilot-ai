"use client";
import { useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/saved";

export function LoginForm() {
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  if (!supabaseConfigured) {
    return <p className="card mt-6 p-5 text-sm text-slate-600">Sign-in isn&apos;t configured on this deployment (missing <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Saved prompts are kept in your browser instead.</p>;
  }
  if (session) return <p className="card mt-6 p-5 text-sm">Signed in as <strong>{session.user.email}</strong>. <a className="text-indigo-700 underline" href="/dashboard">Go to dashboard</a></p>;

  return (
    <form
      className="card mt-6 space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setState("error"); setMsg("Enter a valid email."); return; }
        setState("sending");
        const { error } = await getSupabase()!.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (error) { setState("error"); setMsg(error.message); } else { setState("sent"); setMsg("Check your inbox for a sign-in link."); }
      }}
    >
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" required className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button className="btn-primary w-full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a magic link"}</button>
      {msg && <p className={`text-sm ${state === "error" ? "text-rose-700" : "text-emerald-700"}`}>{msg}</p>}
    </form>
  );
}
