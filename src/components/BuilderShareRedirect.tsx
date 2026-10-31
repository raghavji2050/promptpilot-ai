"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

/** Resolves a short builder link (/s/q…) and opens the builder with its params in the #fragment. */
export function BuilderShareRedirect({ id }: { id: string }) {
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setMissing(true); return; } // eslint-disable-line react-hooks/set-state-in-effect
    sb.rpc("get_builder_share", { p_id: id }).then(({ data }) => {
      if (typeof data === "string" && data) window.location.replace(`/builder#${data}`);
      else setMissing(true);
    });
  }, [id]);
  if (!missing) return <p className="text-subtle">Opening shared prompt…</p>;
  return (
    <div>
      <h1 className="h1">Link not found</h1>
      <p className="lead">This short link doesn&apos;t exist. <Link className="link" href="/builder">Build a new prompt</Link>.</p>
    </div>
  );
}
