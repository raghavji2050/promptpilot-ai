import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PACKS } from "@/content/packs";
import { pageMeta } from "@/lib/seo";
import { packsIndexJsonLd } from "@/lib/seo-jsonld";

const title = "Prompt Packs: Work-safe, tested templates | PromptPilot AI";
const description = "Curated, free prompt packs for real work in India. Each pack is built from tested templates that never invent facts.";

export const metadata = pageMeta({ title, description, path: "/packs", images: "file" });

export default function PacksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={packsIndexJsonLd()} />
      <p className="badge">✔ Work-safe, tested templates</p>
      <h1 className="h1 mt-3">Prompt packs</h1>
      <p className="lead">Ready-made sets of prompts for one job. Free, no signup, works with any AI.</p>
      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Packs">
        {PACKS.map((p) => (
          <Link key={p.href} href={p.href} data-testid="pack-card" className="card block p-5 hover:shadow">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-1 text-sm text-muted">{p.blurb}</p>
            <p className="mt-2 text-xs text-muted">{p.count} prompts</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
