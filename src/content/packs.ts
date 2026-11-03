import { JOB_HUNTING_PACK } from "./job-hunting-pack";

export type PackSummary = { href: string; title: string; blurb: string; count: number };

export const PACKS: PackSummary[] = [
  { href: "/packs/job-hunting", title: "Job Hunting pack for India", blurb: "Resume bullets, cover letter, HR and technical interview prep, salary negotiation in LPA, LinkedIn summary.", count: JOB_HUNTING_PACK.length },
];
