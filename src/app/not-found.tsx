import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="h1">Page not found</h1>
      <p className="mt-3 text-slate-600">That page doesn&apos;t exist.</p>
      <div className="mt-6 flex justify-center gap-3"><Link className="btn-primary" href="/">Home</Link><Link className="btn-secondary" href="/library">Browse prompts</Link></div>
    </div>
  );
}
