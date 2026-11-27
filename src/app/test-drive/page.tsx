import { TestDriveClient } from "@/components/TestDriveClient";
import { pageMeta } from "@/lib/seo";

const TITLE = "Prompt Test Drive | PromptPilot AI";
const DESCRIPTION = "Score your raw AI prompt against a PromptPilot prompt, then run both on free AI models side by side. Free, no sign-up, no API key.";
export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/test-drive" });

export default function TestDrivePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <span className="badge badge-accent">New</span>
      <h1 className="h1 mt-2">Prompt Test Drive</h1>
      <p className="lead">Type an idea the way you normally would. See its score next to the PromptPilot version, then run both on free AI models and compare the real answers.</p>
      <div className="mt-8"><TestDriveClient /></div>
    </div>
  );
}
