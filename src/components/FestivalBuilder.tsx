"use client";
import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FESTIVAL_FIELDS, FESTIVAL_LANGUAGES, FESTIVAL_PLATFORMS, festivalGoalSentence, isFestivalGoal, TARGETS, type UniversalInput,
} from "@/lib/engine";
import { FESTIVAL_GOALS, type FestivalGoal } from "@/lib/festivals";
import { ResultsPanel } from "./ResultsPanel";
import type { FestivalOption } from "@/lib/festivals/ui";
export type { FestivalOption };


const AUDIENCES = ["Family and friends", "Customers in my city", "Instagram followers", "Office colleagues", "Clients", "School students", "Online shoppers across India"];
const TEXT_TARGETS = TARGETS.filter((t) => t.family === "chat" || t.family === "search");
const IMAGE_TARGETS = TARGETS.filter((t) => t.family === "image");
const shortName = (n: string) => n.split(" (")[0];

interface State {
  slug: string; occasion: string; goal: FestivalGoal; audience: string; language: string; otherLang: string;
  platform: string; targetId: string; tone: string; extra: Record<string, string>;
}

function toInput(s: State, festivals: FestivalOption[]): UniversalInput {
  const name = s.slug === "custom" ? s.occasion.trim() || "my occasion" : festivals.find((f) => f.slug === s.slug)?.name ?? s.slug;
  const language = s.language === "Other" ? s.otherLang.trim() : s.language;
  const extra: Record<string, string> = { festival: s.slug, fgoal: s.goal };
  if (s.slug === "custom") extra.occasion = name;
  if (s.platform) extra.platform = s.platform;
  for (const f of FESTIVAL_FIELDS) if (f.goals.includes(s.goal) && s.extra[f.key]?.trim()) extra[f.key] = s.extra[f.key].trim();
  const lang = language && language !== "English" ? language : "";
  const isImage = s.goal === "image";
  const targetId = isImage ? (IMAGE_TARGETS.some((t) => t.id === s.targetId) || TEXT_TARGETS.some((t) => t.id === s.targetId) ? s.targetId : "midjourney") : TEXT_TARGETS.some((t) => t.id === s.targetId) ? s.targetId : "chatgpt";
  return {
    goal: festivalGoalSentence({ festivalName: name, goal: s.goal, audience: s.audience.trim(), language: lang, platform: s.platform, extra }),
    targetId, language: lang || undefined, audience: s.audience.trim() || undefined, tone: s.tone || undefined, mode: "standard", extra,
  };
}

export function FestivalBuilder({ festivals, initial, autoGenerate = false, headingLevel = 2 }: {
  festivals: FestivalOption[]; initial?: Partial<State>; autoGenerate?: boolean; headingLevel?: 2 | 3;
}) {
  const first = festivals[0];
  const [s, setS] = useState<State>({
    slug: first?.slug ?? "custom", occasion: "", goal: "social-post", audience: "", language: "English", otherLang: "",
    platform: "", targetId: "chatgpt", tone: "", extra: {}, ...initial,
  });
  const [input, setInput] = useState<UniversalInput | null>(() => (autoGenerate ? toInput({ slug: first?.slug ?? "custom", occasion: "", goal: "social-post", audience: "", language: "English", otherLang: "", platform: "", targetId: "chatgpt", tone: "", extra: {}, ...initial }, festivals) : null));
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fest = festivals.find((f) => f.slug === s.slug);
  const goals = s.slug === "custom" || !fest ? FESTIVAL_GOALS : FESTIVAL_GOALS.filter((g) => fest.goals.includes(g.id));
  const fields = useMemo(() => FESTIVAL_FIELDS.filter((f) => f.goals.includes(s.goal)), [s.goal]);
  const set = (p: Partial<State>) => setS((cur) => ({ ...cur, ...p }));
  const H = headingLevel === 2 ? "h2" : "h3";

  function generate() {
    if (s.slug === "custom" && !s.occasion.trim()) { setError("Type the occasion (for example Onam, a shop anniversary or a wedding)."); return; }
    if (s.language === "Other" && !s.otherLang.trim()) { setError("Type the language you want."); return; }
    setError("");
    setInput(toInput(s, festivals));
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      headingRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  /** Results-panel actions; "Change language" also rewrites the goal sentence so it never contradicts the language. */
  function onResultChange(patch: Partial<UniversalInput>) {
    if ("language" in patch) {
      const lang = patch.language || "English";
      const known = (FESTIVAL_LANGUAGES as readonly string[]).includes(lang);
      const next = { ...s, language: known ? lang : "Other", otherLang: known ? "" : lang };
      setS(next);
      setInput((cur) => (cur ? { ...toInput(next, festivals), mode: cur.mode, improve: cur.improve, askFirst: cur.askFirst } : cur));
      return;
    }
    setInput((cur) => (cur ? { ...cur, ...patch } : cur));
  }

  return (
    <div>
      <form className="card p-4 sm:p-6" noValidate onSubmit={(e) => { e.preventDefault(); generate(); }} aria-labelledby="fb-title">
        <H id="fb-title" className="text-lg font-semibold text-fg">Festival prompt builder</H>
        <p className="mt-1 text-sm text-muted">Five quick choices. Everything else is optional.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fb-festival" className="label">1. Festival</label>
            <select id="fb-festival" className="input" value={s.slug} onChange={(e) => { const slug = e.target.value; const f = festivals.find((x) => x.slug === slug); set({ slug, goal: f && !f.goals.includes(s.goal) ? f.goals[0] : s.goal }); }}>
              {festivals.map((f) => <option key={f.slug} value={f.slug}>{f.name}{f.when ? ` · ${f.when}` : ""}</option>)}
              <option value="custom">Custom occasion or other festival…</option>
            </select>
            {s.slug === "custom" && (
              <input aria-label="Occasion name" className="input mt-2" maxLength={60} placeholder="e.g. Onam, shop anniversary, Eid-ul-Adha" value={s.occasion} onChange={(e) => set({ occasion: e.target.value })} />
            )}
          </div>
          <div>
            <label htmlFor="fb-audience" className="label">3. Audience</label>
            <input id="fb-audience" className="input" list="fb-audiences" maxLength={200} placeholder="e.g. customers in my city" value={s.audience} onChange={(e) => set({ audience: e.target.value })} />
            <datalist id="fb-audiences">{AUDIENCES.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="label">2. What do you want to create?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {goals.map((g) => (
              <label key={g.id} className={`chip cursor-pointer ${s.goal === g.id ? "chip-active" : ""}`}>
                <input type="radio" name="fb-goal" value={g.id} className="sr-only" checked={s.goal === g.id} onChange={() => set({ goal: g.id })} />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="fb-language" className="label">4. Language</label>
            <select id="fb-language" className="input" value={s.language} onChange={(e) => set({ language: e.target.value })}>
              {FESTIVAL_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              <option value="Other">Other…</option>
            </select>
            {s.language === "Other" && <input aria-label="Other language" className="input mt-2" maxLength={40} placeholder="e.g. Konkani, Sindhi" value={s.otherLang} onChange={(e) => set({ otherLang: e.target.value })} />}
          </div>
          <div>
            <label htmlFor="fb-platform" className="label">5. Platform</label>
            <select id="fb-platform" className="input" value={s.platform} onChange={(e) => set({ platform: e.target.value })}>
              <option value="">Not sure / any</option>
              {FESTIVAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fb-target" className="label">AI tool</label>
            <select id="fb-target" className="input" value={s.goal === "image" && !IMAGE_TARGETS.some((t) => t.id === s.targetId) && !TEXT_TARGETS.some((t) => t.id === s.targetId) ? "midjourney" : s.targetId} onChange={(e) => set({ targetId: e.target.value })}>
              {(s.goal === "image" ? [...IMAGE_TARGETS, ...TEXT_TARGETS] : TEXT_TARGETS).map((t) => <option key={t.id} value={t.id}>{shortName(t.name)}</option>)}
            </select>
          </div>
        </div>

        <details className="mt-4 rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-medium text-fg">More details (optional)</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`fb-${f.key}`} className="label">{f.label}</label>
                <input id={`fb-${f.key}`} className="input" maxLength={300} placeholder={f.placeholder} value={s.extra[f.key] ?? ""} onChange={(e) => set({ extra: { ...s.extra, [f.key]: e.target.value } })} />
              </div>
            ))}
            {s.goal !== "image" && (
              <div>
                <label htmlFor="fb-tone" className="label">Tone</label>
                <select id="fb-tone" className="input" value={s.tone} onChange={(e) => set({ tone: e.target.value })}>
                  <option value="">Default</option>
                  {["warm", "respectful", "friendly", "professional", "playful", "heartfelt"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>
          {fields.some((f) => f.key === "offer") && <p className="mt-2 text-xs text-subtle">We never invent discounts or prices. If you leave the offer empty, the prompt asks the AI to write value-led copy with an [YOUR OFFER] placeholder.</p>}
        </details>

        {s.goal === "image" && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-muted">Image prompts only. AI image tools often render text imperfectly, so the prompt asks for no text and leaves space: add your greeting later in Canva, Figma or any editor.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" className="btn-primary btn-lg mt-5 w-full sm:w-auto">Create festival prompt <span aria-hidden>→</span></button>
      </form>

      {input && <div className="mt-6"><ResultsPanel ref={headingRef} input={input} onChange={onResultChange} /></div>}
    </div>
  );
}

function FromParams({ festivals, fallbackSlug, headingLevel }: { festivals: FestivalOption[]; fallbackSlug?: string; headingLevel?: 2 | 3 }) {
  const sp = useSearchParams();
  const goal = sp.get("goal");
  const slug = sp.get("festival") ?? fallbackSlug;
  const initial: Partial<State> = {
    ...(slug && (slug === "custom" || festivals.some((f) => f.slug === slug)) ? { slug } : {}),
    ...(isFestivalGoal(goal) ? { goal } : {}),
    ...(sp.get("platform") ? { platform: (FESTIVAL_PLATFORMS as readonly string[]).includes(sp.get("platform")!) ? sp.get("platform")! : "" } : {}),
    ...(sp.get("lang") && (FESTIVAL_LANGUAGES as readonly string[]).includes(sp.get("lang")!) ? { language: sp.get("lang")! } : {}),
  };
  // Re-mount when the query changes (e.g. a starter link on the same page) so the form reflects it.
  return <FestivalBuilder key={sp.toString()} festivals={festivals} initial={initial} autoGenerate={isFestivalGoal(goal)} headingLevel={headingLevel} />;
}

/** Builder prefilled from ?festival=&goal=&platform=&lang= (auto-generates when a goal is given). */
export function FestivalBuilderWithParams(props: { festivals: FestivalOption[]; fallbackSlug?: string; headingLevel?: 2 | 3 }) {
  const fallbackInitial = props.fallbackSlug ? { slug: props.fallbackSlug } : undefined;
  return (
    <Suspense fallback={<FestivalBuilder festivals={props.festivals} initial={fallbackInitial} headingLevel={props.headingLevel} />}>
      <FromParams {...props} />
    </Suspense>
  );
}
