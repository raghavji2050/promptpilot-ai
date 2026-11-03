import { festivalOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PromptPilot AI Job Hunting pack";

export default function Image() {
  return festivalOg({ eyebrow: "Free prompt pack · India", title: "Job Hunting pack for India", subtitle: "Resume · Interview prep · Salary in LPA", accent: "#4f46e5", soft: "#eef2ff" });
}
