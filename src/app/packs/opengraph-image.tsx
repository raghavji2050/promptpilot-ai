import { festivalOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PromptPilot AI prompt packs";

export default function Image() {
  return festivalOg({
    eyebrow: "Free prompt packs · India",
    title: "Prompt packs",
    subtitle: "Work-safe, tested templates for real work",
    accent: "#4f46e5",
    soft: "#eef2ff",
  });
}
