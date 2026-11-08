import { festivalOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "The power of a prompt: weak vs PromptPilot";

export default function Image() {
  return festivalOg({
    eyebrow: "The power of a prompt",
    title: "Weak vs PromptPilot",
    subtitle: "See what a structured prompt can do",
    accent: "#047857",
    soft: "#ecfdf5",
  });
}
