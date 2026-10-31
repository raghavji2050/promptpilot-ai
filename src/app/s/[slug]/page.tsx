import type { Metadata } from "next";
import { SharedPrompt } from "@/components/SharedPrompt";
import { BuilderShareRedirect } from "@/components/BuilderShareRedirect";
import { SHORT_ID_RE } from "@/lib/share";

export const metadata: Metadata = { title: "Shared prompt", robots: { index: false, follow: false } };

export default async function SharedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {SHORT_ID_RE.test(slug) ? <BuilderShareRedirect id={slug} /> : <SharedPrompt slug={slug} />}
    </div>
  );
}
