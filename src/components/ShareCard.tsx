"use client";
import { useId, useState, useSyncExternalStore } from "react";
import type { UniversalInput } from "@/lib/engine";
import { CARD_SIZES, SHARE_NETWORKS, cardUrl, intentUrl, sharedLink, shareText, type CardSize, type ShareChannel } from "@/lib/share";

const noop = () => () => {};
/** Web Share is offered on touch devices that support it (decided on the client to keep hydration stable). */
const useCanWebShare = () => useSyncExternalStore(noop, () => typeof navigator !== "undefined" && typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches, () => false);

/** "Share as image": Before vs After card in 3 sizes, download, share-intent buttons with UTM-tagged links, Web Share on mobile. */
export function ShareCard({ input, festivalName }: { input: UniversalInput; festivalName?: string }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<CardSize>("square");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState("");
  const canShare = useCanWebShare();
  const id = useId();
  if (!input.goal.trim()) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = (c: ShareChannel) => sharedLink(origin, input, c);
  const text = shareText(input, festivalName);
  const src = cardUrl(input, size);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 5000); };

  async function webShare() {
    try {
      const res = await fetch(src);
      const file = new File([await res.blob()], `promptpilot-before-after-${size}.png`, { type: "image/png" });
      const data: ShareData = navigator.canShare?.({ files: [file] }) ? { files: [file], text: `${text} ${link("webshare")}` } : { text, url: link("webshare") };
      await navigator.share(data);
    } catch (e) { if ((e as Error).name !== "AbortError") flash("Sharing isn't available here. Use Download or Copy link instead."); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link("copy")); flash("Link copied."); } catch { flash(link("copy")); }
  }

  return (
    <div className="mt-3">
      <button type="button" className="btn-ghost text-sm" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide share card" : "Share as image"}
      </button>
      {open && (
        <div id={`${id}-panel`} className="mt-3 rounded-2xl border border-line bg-surface p-4" role="region" aria-label="Share a before vs after image">
          <fieldset>
            <legend className="text-sm font-medium text-fg">Card size</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(CARD_SIZES) as CardSize[]).map((s) => (
                <label key={s} className={`chip ${size === s ? "chip-active" : ""}`}>
                  <input type="radio" name={`${id}-size`} value={s} checked={size === s} onChange={() => setSize(s)} className="sr-only" />
                  {CARD_SIZES[s].label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-subtle">{CARD_SIZES[size].hint}</p>
          </fieldset>

          <div className="mt-3 flex justify-center rounded-xl bg-surface-2 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={src} src={src} width={CARD_SIZES[size].width} height={CARD_SIZES[size].height} onLoad={() => setLoaded(src)}
              alt={`Before vs after card: "${input.goal.trim().slice(0, 80)}" turned into a structured PromptPilot prompt`}
              className={`h-auto rounded-lg shadow-sm ${size === "story" ? "max-h-[28rem] w-auto" : "w-full max-w-md"} ${loaded === src ? "" : "animate-pulse opacity-60"}`} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <a className="btn-primary text-sm" href={cardUrl(input, size, { download: true })} download={`promptpilot-before-after-${size}.png`}>Download image</a>
            {canShare && <button type="button" className="btn-secondary text-sm" onClick={webShare}>Share…</button>}
            <button type="button" className="btn-ghost text-sm" onClick={copy}>Copy link</button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Share on">
            <span className="text-sm text-muted">Share on</span>
            {SHARE_NETWORKS.map((n) => (
              <a key={n.id} className="chip" href={intentUrl(n.id, link(n.id), text)} target="_blank" rel="noopener noreferrer" data-network={n.id}>
                {n.label}<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
          {msg && <p className="mt-2 break-all text-xs text-subtle" role="status">{msg}</p>}
          <p className="mt-3 text-xs text-subtle">Nothing is posted for you: each button opens that app&apos;s own share screen. The image and link include what you typed, so leave out private details. For Instagram, download the image and upload it in the app.</p>
        </div>
      )}
    </div>
  );
}
