/**
 * Pure IST date utilities. No browser time zone is ever used: an instant is shifted by +05:30
 * and read in UTC, and civil dates (YYYY-MM-DD) are compared as UTC midnights.
 */
import type { Festival, FestivalInstance, ISODate, Occurrence } from "./types";

const IST_OFFSET_MIN = 330;
const DAY_MS = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(v: unknown): v is ISODate {
  if (typeof v !== "string" || !ISO_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Today's civil date in India for a given instant (defaults to now). */
export function istToday(now: Date | number = Date.now()): ISODate {
  const ms = typeof now === "number" ? now : now.getTime();
  return new Date(ms + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

function toUTC(iso: ISODate): number {
  if (!isISODate(iso)) throw new Error(`Invalid date: ${iso}`);
  return Date.parse(`${iso}T00:00:00Z`);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

export function addDays(iso: ISODate, n: number): ISODate {
  return new Date(toUTC(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

export function yearOf(iso: ISODate): number {
  return Number(iso.slice(0, 4));
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sun, 8 Nov 2026": deterministic, locale- and time-zone-independent. */
export function formatDate(iso: ISODate, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const d = new Date(toUTC(iso));
  const core = `${d.getUTCDate()} ${MO[d.getUTCMonth()]}${opts.year === false ? "" : ` ${d.getUTCFullYear()}`}`;
  return opts.weekday === false ? core : `${WD[d.getUTCDay()]}, ${core}`;
}

/** "8–11 Nov 2026" or "30 Sep – 9 Oct 2027". */
export function formatRange(start: ISODate, end: ISODate): string {
  if (start === end) return formatDate(start, { weekday: false });
  const s = new Date(toUTC(start));
  const e = new Date(toUTC(end));
  if (s.getUTCFullYear() !== e.getUTCFullYear()) return `${formatDate(start, { weekday: false })} – ${formatDate(end, { weekday: false })}`;
  if (s.getUTCMonth() === e.getUTCMonth()) return `${s.getUTCDate()}–${e.getUTCDate()} ${MO[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
  return `${formatDate(start, { weekday: false, year: false })} – ${formatDate(end, { weekday: false })}`;
}

// ------------------------------------------------------------------ occurrences

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Occurrences for a festival in [fromYear, toYear], generating fixed-date ones where needed. */
export function occurrencesFor(f: Festival, fromYear: number, toYear: number): Occurrence[] {
  const list = f.occurrences.filter((o) => !o.hidden && o.year >= fromYear && o.year <= toYear);
  if (f.fixed) {
    for (let y = fromYear; y <= toYear; y++) {
      if (f.occurrences.some((o) => o.year === y)) continue; // explicit (or admin) data wins
      const d = `${y}-${pad(f.fixed.month)}-${pad(f.fixed.day)}`;
      list.push({ year: y, start: d, end: d, primary: d, status: "verified", sources: ["FIXED"], lastVerified: "2026-10-18" });
    }
  }
  return list.sort((a, b) => a.primary.localeCompare(b.primary));
}

export function toInstance(f: Festival, o: Occurrence): FestivalInstance {
  return {
    festival: f,
    occurrence: o,
    campaignStart: o.campaignStart && isISODate(o.campaignStart) ? o.campaignStart : addDays(o.start, -f.leadDays),
    campaignEnd: o.campaignEnd && isISODate(o.campaignEnd) ? o.campaignEnd : o.end,
  };
}

/** All instances that have not ended by `today` (expired ones are retired), soonest first. */
export function upcomingInstances(festivals: Festival[], today: ISODate): FestivalInstance[] {
  const y = yearOf(today);
  const out: FestivalInstance[] = [];
  for (const f of festivals) {
    for (const o of occurrencesFor(f, y - 1, y + 1)) {
      if (o.end >= today) out.push(toInstance(f, o));
    }
  }
  return out.sort((a, b) => {
    // An ongoing multi-day festival counts from today; otherwise sort by its main day.
    const ka = a.occurrence.start <= today ? today : a.occurrence.primary;
    const kb = b.occurrence.start <= today ? today : b.occurrence.primary;
    return ka.localeCompare(kb) || a.festival.priority - b.festival.priority;
  });
}

/** The next occurrence of one festival that hasn't ended (null when no future date is known yet). */
export function nextInstance(f: Festival, today: ISODate): FestivalInstance | null {
  const y = yearOf(today);
  const o = occurrencesFor(f, y - 1, y + 2).find((x) => x.end >= today);
  return o ? toInstance(f, o) : null;
}

export function nextFestival(festivals: Festival[], today: ISODate): FestivalInstance | null {
  return upcomingInstances(festivals, today)[0] ?? null;
}

/** The campaign whose window contains today. Overlaps: soonest main day, then priority. */
export function activeCampaign(festivals: Festival[], today: ISODate): FestivalInstance | null {
  const live = upcomingInstances(festivals, today).filter((i) => i.campaignStart <= today && today <= i.campaignEnd);
  live.sort((a, b) => {
    const pa = a.occurrence.primary < today ? today : a.occurrence.primary;
    const pb = b.occurrence.primary < today ? today : b.occurrence.primary;
    return pa.localeCompare(pb) || a.festival.priority - b.festival.priority;
  });
  return live[0] ?? null;
}

export type Phase = "upcoming" | "today" | "ongoing";

export interface Countdown {
  phase: Phase;
  /** Days until the main day (0 on the day; negative while a multi-day festival continues). */
  days: number;
  label: string;
}

export function countdown(inst: FestivalInstance, today: ISODate): Countdown {
  const { start, end, primary } = inst.occurrence;
  const days = daysBetween(today, primary);
  if (days === 0) return { phase: "today", days, label: "Today" };
  if (days > 0) {
    if (start <= today) return { phase: "ongoing", days, label: `On now · main day in ${days} ${days === 1 ? "day" : "days"}` };
    return { phase: "upcoming", days, label: days === 1 ? "Tomorrow" : `In ${days} days` };
  }
  // Main day passed but the festival continues (end >= today).
  return { phase: "ongoing", days, label: `On now · until ${formatDate(end, { weekday: false, year: false })}` };
}
