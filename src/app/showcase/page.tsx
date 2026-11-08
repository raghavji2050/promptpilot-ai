import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";
import { showcaseItemListJsonLd } from "@/lib/seo-jsonld";
import { getShowcase } from "@/lib/showcase";

const title = "The power of a prompt: weak vs PromptPilot | PromptPilot AI";
const description = "See the same idea as a one-line prompt and as a PromptPilot prompt, for text, images and reels. Try any of them in the free builder.";
export const metadata = pageMeta({ title, description, path: "/showcase", images: "file" });

export default function ShowcasePage() {
  const cards = getShowcase();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={showcaseItemListJsonLd(cards)} />
      <h1 className="h1">The power of a prompt</h1>
      <p className="lead">The same idea, written two ways. The PromptPilot prompt below is generated live by our builder from the same idea, so it is exactly what you would get.</p>
      <p className="mt-2 text-sm text-muted">Outputs marked &ldquo;Example output&rdquo; are written by us to show the kind of result to expect. They are not real AI responses, and we show no AI images we did not generate.</p>
      <div className="mt-8 space-y-8">
        {cards.map((c) => (
          <section key={c.id} id={c.id} data-testid="showcase-card" className="rounded-2xl border border-line p-5">
            <h2 className="text-xl font-semibold">{c.title}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><p className="text-sm font-medium text-muted">Weak prompt</p><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm">{c.weak}</pre></div>
              <div><p className="text-sm font-medium text-accent-text">PromptPilot prompt</p><pre data-testid="showcase-built" className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm" tabIndex={0} aria-label={`${c.title} PromptPilot prompt`}>{c.built}</pre></div>
            </div>
            <p className="mt-4 text-sm font-medium"><span className="badge">{c.outputLabel}</span></p>
            <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-dashed border-line p-3 text-sm">{c.output}</pre>
            <Link className="btn btn-primary mt-4 inline-block" href={c.tryHref}>Try this prompt</Link>
          </section>
        ))}
      </div>
    </div>
  );
}
