"use client";
import { useSyncExternalStore } from "react";
import { istToday } from "./dates";

const noop = () => () => {};
/** Today in IST: the server's date during SSR/hydration, the live IST date afterwards (never the browser's time zone). */
export function useISTToday(serverToday: string) {
  return useSyncExternalStore(noop, () => istToday(), () => serverToday);
}
