import type { TrendStatus } from "@/content";

const STYLE: Record<TrendStatus, string> = {
  current: "bg-rose-50 text-rose-700 ring-rose-200",
  seasonal: "bg-amber-50 text-amber-800 ring-amber-200",
  evergreen: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};
const LABEL: Record<TrendStatus, string> = { current: "Reported trend", seasonal: "Seasonal", evergreen: "Evergreen" };

export function TrendBadge({ status }: { status: TrendStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLE[status]}`}>{LABEL[status]}</span>;
}
