import type { Metadata } from "next";
import Link from "next/link";
import { OWNER, SITE, isPlaceholder } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the ${SITE.name} team for feedback, bug reports, data deletion or partnerships.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const ph = isPlaceholder(OWNER.contactEmail);
  return (
    <div className="prose-simple mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">Contact</h1>
      <p className="lead">Feedback, a bug, a prompt idea, or a data deletion request? Write to us.</p>
      <h2>Email</h2>
      <p>{ph ? <strong>{OWNER.contactEmail}</strong> : <a href={`mailto:${OWNER.contactEmail}`}>{OWNER.contactEmail}</a>}{ph && <span className="text-subtle"> (placeholder: email to be added)</span>}</p>
      <h2>What to include</h2>
      <ul>
        <li><strong>Bug:</strong> the page URL, your device/browser, and what you expected.</li>
        <li><strong>Delete my data:</strong> send it from the email you signed in with. See the <Link href="/privacy#dpdp">Privacy Policy</Link>.</li>
        <li><strong>Prompt idea:</strong> the goal and which AI you use.</li>
      </ul>
      <p>Please don&apos;t send passwords, API keys or sensitive personal information. Learn more <Link href="/about">about {SITE.name}</Link>.</p>
    </div>
  );
}
