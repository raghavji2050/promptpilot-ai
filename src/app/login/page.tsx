import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false }, alternates: { canonical: "/login" } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="h1">Sign in</h1>
      <p className="mt-2 text-slate-600">Optional. Sign in to sync saved prompts across devices. Every tool works without an account.</p>
      <LoginForm />
    </div>
  );
}
