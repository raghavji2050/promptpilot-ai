import { ImageResponse } from "next/og";
import { buildUniversal, fromShareParams, whatWeAdded } from "@/lib/engine";
import { getFestival, FESTIVALS } from "@/lib/festivals";
import { CARD_SIZES, clip, isCardSize, type CardSize } from "@/lib/share";
import { SITE } from "@/lib/site";

const LAYOUT: Record<CardSize, { pad: number; title: number; body: number; mono: number; lines: number; chips: number; goalMax: number; stacked: boolean; lineChars: number }> = {
  square: { pad: 64, title: 64, body: 34, mono: 22, lines: 8, chips: 6, goalMax: 180, stacked: true, lineChars: 78 },
  story: { pad: 80, title: 80, body: 40, mono: 25, lines: 22, chips: 8, goalMax: 260, stacked: true, lineChars: 66 },
  wide: { pad: 48, title: 44, body: 24, mono: 16, lines: 9, chips: 6, goalMax: 140, stacked: false, lineChars: 60 },
};
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const size: CardSize = isCardSize(sp.get("size")) ? (sp.get("size") as CardSize) : "wide";
  const { width, height } = CARD_SIZES[size];
  const L = LAYOUT[size];
  const input = fromShareParams((k) => sp.get(k), sp.keys());
  const goal = input.goal?.trim() || "write a festival post";
  const result = buildUniversal({ ...input, goal, targetId: input.targetId ?? "chatgpt" });
  const chips = whatWeAdded(result).slice(0, L.chips).map((c) => c.label);
  const fest = result.festival ? getFestival(result.festival.slug, FESTIVALS) : undefined;
  const accent = fest?.theme.accent ?? "#4f46e5";
  const soft = fest?.theme.soft ?? "#f4f4fb";
  const label = result.festival ? `${result.festival.name} · ${result.festival.goalLabel}` : `For ${result.target.name.split(" (")[0]}`;
  const lines = result.text.split("\n").filter((l) => l.trim()).slice(0, L.lines).map((l) => clip(l, L.lineChars));
  const host = new URL(SITE.url).host;

  const box = { display: "flex", flexDirection: "column" as const, borderRadius: 24, padding: L.pad * 0.5, background: "white", overflow: "hidden" as const };
  const tag = (txt: string, color: string) => <div style={{ display: "flex", fontSize: L.body * 0.6, fontWeight: 700, letterSpacing: 2, color, textTransform: "uppercase" }}>{txt}</div>;

  const chipRow = chips.length > 0 && (
    <div style={{ display: "flex", flexWrap: "wrap", marginTop: 12 }}>
      {chips.map((c) => <div key={c} style={{ display: "flex", fontSize: L.body * 0.6, color: accent, background: soft, borderRadius: 999, padding: "6px 14px", marginRight: 8, marginBottom: 8 }}>+ {c}</div>)}
    </div>
  );
  const before = (
    <div style={{ ...box, border: "2px solid #d9dbe3", background: "#fafafa", flex: L.stacked ? "0 0 auto" : 1, marginRight: L.stacked ? 0 : 20, marginBottom: L.stacked ? 24 : 0 }}>
      {tag("Before · what I typed", "#6b7280")}
      <div style={{ display: "flex", fontSize: L.body, color: "#111318", marginTop: 14, lineHeight: 1.3 }}>“{clip(goal, L.goalMax)}”</div>
      <div style={{ display: "flex", fontSize: L.body * 0.55, color: "#6b7280", marginTop: 12 }}>{words(goal)} words · no role, context, format or checks</div>
      {!L.stacked && chipRow && <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>{tag("What PromptPilot added", accent)}{chipRow}</div>}
    </div>
  );
  const after = (
    <div style={{ ...box, border: `3px solid ${accent}`, flex: 1 }}>
      {tag("After · PromptPilot prompt", accent)}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 12, overflow: "hidden" }}>
        {lines.map((l, i) => <div key={i} style={{ display: "flex", fontSize: L.mono, color: i === 0 ? "#111318" : "#4b5262", lineHeight: `${Math.round(L.mono * 1.5)}px`, height: Math.round(L.mono * 1.5), overflow: "hidden", whiteSpace: "nowrap" }}>{l}</div>)}
      </div>
      <div style={{ display: "flex", fontSize: L.body * 0.55, color: "#6b7280", marginTop: 10 }}>{words(result.text)} words · built from templates, no AI called</div>
      {L.stacked && chipRow}
    </div>
  );

  const img = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: soft, padding: L.pad, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: L.title * 0.9, height: L.title * 0.9, borderRadius: 14, background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: L.title * 0.4, fontWeight: 700 }}>PP</div>
            <div style={{ display: "flex", fontSize: L.title * 0.5, fontWeight: 600, color: "#111318", marginLeft: 14 }}>PromptPilot AI</div>
          </div>
          <div style={{ display: "flex", fontSize: L.body * 0.65, color: accent, border: `2px solid ${accent}`, borderRadius: 999, padding: "6px 16px" }}>{label}</div>
        </div>
        <div style={{ display: "flex", fontSize: L.title, fontWeight: 700, color: "#111318", marginTop: L.pad * 0.5, marginBottom: L.pad * 0.4 }}>Before vs after</div>
        <div style={{ display: "flex", flexDirection: L.stacked ? "column" : "row", flex: 1, overflow: "hidden" }}>{before}{after}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: L.body * 0.65, color: "#4b5262", marginTop: L.pad * 0.4 }}>
          <span>Free AI prompt builder · no sign-up</span>
          <span style={{ fontWeight: 600, color: "#111318" }}>{host}</span>
        </div>
      </div>
    ),
    { width, height, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Robots-Tag": "noindex", ...(sp.get("dl") === "1" ? { "Content-Disposition": `attachment; filename="promptpilot-before-after-${size}.png"` } : {}) } },
  );
  return img;
}
