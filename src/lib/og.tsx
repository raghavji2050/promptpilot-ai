import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 social card: PromptPilot branding, festival accent, title and subtitle. */
export function festivalOg({ eyebrow, title, subtitle, accent, soft }: { eyebrow: string; title: string; subtitle: string; accent: string; soft: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: soft, padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>PP</div>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#111318" }}>PromptPilot AI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderLeft: `10px solid ${accent}`, paddingLeft: 32 }}>
          <div style={{ fontSize: 28, color: accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#111318", lineHeight: 1.1, marginTop: 12 }}>{title}</div>
          <div style={{ fontSize: 30, color: "#4b5262", marginTop: 20 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#4b5262" }}>
          <span>Free festival prompt builder · No sign-up</span>
          <span>promptpilot-ai-psi.vercel.app</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
