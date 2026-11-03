import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Improve my prompt: free Chrome extension | PromptPilot AI",
  description: "A small, free Chrome extension that improves any selected prompt with PromptPilot AI. Install it unpacked; not on the Chrome Web Store.",
  alternates: { canonical: "/extension" },
};

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">“Improve my prompt” Chrome extension</h1>
      <p className="lead">Select a prompt on ChatGPT, Claude, Gemini or any page, click the icon, and get a clearer prompt. Free, no signup.</p>
      <a className="btn-primary mt-6 inline-block" href="/promptpilot-extension.zip" download data-testid="ext-download">Download extension (.zip)</a>
      <ol className="mt-6 list-decimal space-y-2 pl-6 text-sm">
        <li>Unzip the file.</li>
        <li>Open <code>chrome://extensions</code> and turn on <b>Developer mode</b>.</li>
        <li>Click <b>Load unpacked</b> and pick the unzipped folder.</li>
      </ol>
      <p className="mt-6 text-sm text-muted">It is not on the Chrome Web Store yet. It only reads the text you select when you click it, and sends that text to PromptPilot&apos;s Smart mode. Source code is in the <a className="underline" href="https://github.com/raghavji2050/promptpilot-ai/tree/main/extension">GitHub repo</a>.</p>
      <p className="mt-4 text-sm"><Link className="underline" href="/enhancer">Or use the enhancer on the website</Link></p>
    </div>
  );
}
