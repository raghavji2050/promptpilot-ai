"use client";
import dynamic from "next/dynamic";

export const EnhancerClient = dynamic(() => import("./Enhancer").then((m) => m.Enhancer), {
  ssr: false,
  loading: () => <div className="card p-8 text-sm text-slate-500">Loading enhancer…</div>,
});
