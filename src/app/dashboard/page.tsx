import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false }, alternates: { canonical: "/dashboard" } };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h1">Dashboard</h1>
      <Dashboard />
    </div>
  );
}
