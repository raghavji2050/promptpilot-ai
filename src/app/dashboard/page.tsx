import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Dashboard",
    description: "Your saved prompts on this device, or across devices after you sign in. This page is private and is not listed in search.",
    path: "/dashboard",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h1">Dashboard</h1>
      <Dashboard />
    </div>
  );
}
