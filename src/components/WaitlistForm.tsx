"use client";
import { useState } from "react";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";

const schema = z.object({ email: z.email().max(254), consent: z.literal(true) });

/** Pro waitlist: email + explicit consent. Insert-only table (supabase/pro-waitlist.sql). No payment. */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) { setState("done"); return; } // honeypot: bots get a fake success
    const parsed = schema.safeParse({ email: email.trim(), consent });
    if (!parsed.success) { setState("error"); setMsg(!consent ? "Please tick the consent box." : "Please enter a valid email."); return; }
    const sb = getSupabase();
    if (!sb) { setState("error"); setMsg("The waitlist isn't available on this deployment yet."); return; }
    setState("busy");
    const { error } = await sb.from("pro_waitlist").insert({ email: parsed.data.email.toLowerCase(), consent: true, source: "pricing" });
    if (error && error.code !== "23505") { setState("error"); setMsg("Couldn't join right now. Please try again later."); return; }
    setState("done");
  }

  if (state === "done") return <p role="status" className="mt-4 rounded-lg border border-line p-3 text-sm text-fg">✓ You&apos;re on the Pro waitlist. We&apos;ll email you once when Pro launches.</p>;
  return (
    <form onSubmit={submit} className="mt-4 space-y-3" noValidate aria-describedby="wl-msg">
      <label className="label" htmlFor="wl-email">Get notified when Pro launches</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="wl-email" type="email" autoComplete="email" required className="input flex-1" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="btn-primary" disabled={state === "busy"}>{state === "busy" ? "Joining…" : "Join waitlist"}</button>
      </div>
      <div className="hidden" aria-hidden="true"><label htmlFor="wl-company">Company</label><input id="wl-company" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></div>
      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>I agree that PromptPilot AI may store my email to tell me about the Pro launch. No spam, no sharing; ask us to delete it any time (see <a className="link" href="/privacy#dpdp">Privacy</a>).</span>
      </label>
      <p id="wl-msg" role="alert" className="text-xs text-red-400">{state === "error" ? msg : ""}</p>
    </form>
  );
}
