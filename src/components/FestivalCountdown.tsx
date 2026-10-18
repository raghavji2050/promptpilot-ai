"use client";
import { countdown, nextInstance, type Festival } from "@/lib/festivals";
import { useISTToday } from "@/lib/festivals/useISTToday";

/** Live IST countdown for one festival (recomputed on the client so cached pages never go stale). */
export function FestivalCountdown({ festival, serverToday }: { festival: Festival; serverToday: string }) {
  const today = useISTToday(serverToday);
  const inst = nextInstance(festival, today);
  if (!inst) return <p className="festive-count rounded-xl px-4 py-3 text-sm font-medium">Next date to be confirmed</p>;
  const cd = countdown(inst, today);
  return (
    <p className="festive-count rounded-xl px-4 py-3 text-center" aria-label={`Countdown: ${cd.label} (India time)`}>
      {cd.phase === "upcoming"
        ? <><span className="block text-3xl font-semibold tabular-nums">{cd.days}</span><span className="text-xs">{cd.days === 1 ? "day to go" : "days to go"}</span></>
        : <span className="block text-sm font-semibold">{cd.label}</span>}
      <span className="mt-0.5 block text-[11px] opacity-80">IST</span>
    </p>
  );
}
