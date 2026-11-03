import { JOB_HUNTING_PACK } from "./job-hunting-pack";
import { MORE_PACKS } from "./more-packs";

export type PackSummary = { href: string; title: string; blurb: string; count: number };

export const PACKS: PackSummary[] = [
  { href: "/packs/job-hunting", title: "Job Hunting pack for India", blurb: "Resume bullets, cover letter, HR and technical interview prep, salary negotiation in LPA, LinkedIn summary.", count: JOB_HUNTING_PACK.length },
  ...MORE_PACKS.map((p) => ({ href: `/packs/${p.slug}`, title: p.heading, blurb: p.lead, count: p.items.length })),
];
