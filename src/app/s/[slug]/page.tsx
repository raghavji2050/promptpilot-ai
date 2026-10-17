import type { Metadata } from "next";
import { SharedPrompt } from "@/components/SharedPrompt";

export const metadata: Metadata = { title: "Shared prompt", robots: { index: false, follow: false } };

export default async function SharedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SharedPrompt slug={slug} />
    </div>
  );
}
