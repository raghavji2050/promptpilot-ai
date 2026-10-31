import type { Metadata } from "next";
import Link from "next/link";
import { OWNER, SITE, isPlaceholder } from "@/lib/site";
import { ALL_PROMPTS } from "@/content";

export const metadata: Metadata = {
  title: "About PromptPilot AI",
  description: "Who makes PromptPilot AI, why it exists, what is free, and our privacy promise.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="prose-simple mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">About {SITE.name}</h1>
      <h2>Who made it</h2>
      <p>{SITE.name} is built and run by <strong>{OWNER.makerName}</strong>{isPlaceholder(OWNER.makerName) && <span className="text-subtle"> (placeholder: name to be added)</span>}.</p>
      <h2>Why it exists</h2>
      <p>Most people type one line into ChatGPT or Gemini and get a generic answer. {SITE.name} turns a goal written in plain English, Hindi or Hinglish into a structured prompt (role, context, task, steps, constraints, output format and a self-check) so the AI has what it needs. It is made with Indian creators, students, small businesses and beginners in mind.</p>
      <h2>What is free</h2>
      <ul>
        <li>The <Link href="/builder">Prompt Builder</Link> for every supported AI, with no sign-up and no API key.</li>
        <li>The <Link href="/library">Prompt Library</Link> ({ALL_PROMPTS.length} prompts), <Link href="/festivals">festival prompts</Link> and <Link href="/categories">categories</Link>.</li>
        <li>The <Link href="/enhancer">Prompt Enhancer</Link> checklist and <Link href="/instagram-studio">Instagram Studio</Link>.</li>
        <li>A Pro plan is planned (see <Link href="/pricing">Pricing</Link>). Nothing can be bought today.</li>
      </ul>
      <h2>Privacy promise</h2>
      <p>Prompts are built from templates in your browser. The builder does not send your text to any AI. Saved prompts stay in your browser unless you sign in. We don&apos;t sell data and there are no ads. Details are in the <Link href="/privacy">Privacy Policy</Link>.</p>
      <h2>Contact</h2>
      <p>Email <strong>{OWNER.contactEmail}</strong>{isPlaceholder(OWNER.contactEmail) && <span className="text-subtle"> (placeholder: email to be added)</span>} or use the <Link href="/contact">contact page</Link>.</p>
    </div>
  );
}
