import type { FestivalSource } from "./types";

/** Source registry. Full research notes: docs/festival-research.md (verified 18 Oct 2026 IST). */
export const SOURCES: Record<string, FestivalSource> = {
  DoPT26: { label: "DoPT holiday list 2026 (O.M. dated 3 Jul 2025)", url: "https://dopt.gov.in/notifications/orders" },
  DoPT27: { label: "DoPT holiday list 2027 (O.M. dated 16 Jul 2026)", url: "https://dopt.gov.in/notifications/orders" },
  IP26: { label: "India Post holiday list 2026", url: "https://www.indiapost.gov.in/holidays-list" },
  DRIK: { label: "Drik Panchang (New Delhi)", url: "https://www.drikpanchang.com/" },
  TAD: { label: "timeanddate.com India holidays (secondary)", url: "https://www.timeanddate.com/holidays/india/" },
  ET: { label: "Economic Times: Durga Puja 2026 dates (secondary)", url: "https://economictimes.indiatimes.com/astrology/others/durga-puja-2026-dates-know-when-maha-saptami-maha-ashtami-maha-navami-and-vijayadashami-fall/articleshow/134606927.cms" },
  KV: { label: "Kendriya Vidyalaya holiday list 2026 (secondary)", url: "https://cdnbbsr.s3waas.gov.in/s3kv02e791c8ff4befcb27a5a45975b06f/uploads/2026/01/2026012281.pdf" },
  FIXED: { label: "Fixed Gregorian date", url: "https://dopt.gov.in/notifications/orders" },
};

export function sourceList(codes: string[]): FestivalSource[] {
  return codes.map((c) => SOURCES[c]).filter((s): s is FestivalSource => Boolean(s));
}
