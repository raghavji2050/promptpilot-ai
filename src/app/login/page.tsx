import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Sign in",
    description: "Optional sign-in to sync saved prompts across devices. Every PromptPilot tool works without an account.",
    path: "/login",
  }),
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="h1">Sign in</h1>
      <p className="mt-2 text-slate-600">Optional. Sign in to sync saved prompts across devices. Every tool works without an account.</p>
      <LoginForm />
    </div>
  );
}
