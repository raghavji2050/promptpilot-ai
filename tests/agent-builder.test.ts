import { describe, expect, it } from "vitest";
import { AGENT_EXAMPLE, AGENT_TAGLINE, buildAgentPrompt } from "@/lib/agent-builder";

describe("agent prompt builder (PromptPilot AI 2.0 slice)", () => {
  it("is deterministic and includes role, numbered tasks, tools and rules", () => {
    const a = buildAgentPrompt(AGENT_EXAMPLE);
    expect(a).toBe(buildAgentPrompt({ ...AGENT_EXAMPLE }));
    expect(a).toContain("# Shop Helper");
    expect(a).toContain("You are Shop Helper, a customer support assistant");
    expect(a).toMatch(/^1\. Answer questions about sizes/m);
    expect(a).toMatch(/^3\. Collect name, phone/m);
    expect(a).toContain("Read uploaded files:");
    expect(a).toContain("- Never ask for card numbers or UPI PINs");
    expect(a).toContain("Do not invent facts");
    expect(a).toContain("Hinglish, friendly.");
  });

  it("returns empty until name, role and a task exist", () => {
    expect(buildAgentPrompt({ ...AGENT_EXAMPLE, name: " " })).toBe("");
    expect(buildAgentPrompt({ ...AGENT_EXAMPLE, role: "" })).toBe("");
    expect(buildAgentPrompt({ ...AGENT_EXAMPLE, tasks: "\n - \n" })).toBe("");
  });

  it("no tools selected means chat-only rule; strips list bullets", () => {
    const a = buildAgentPrompt({ ...AGENT_EXAMPLE, tools: [], tasks: "- Reply to reviews\n2) Draft posts" });
    expect(a).toContain("No tools (chat only)");
    expect(a).not.toContain("Web search");
    expect(a).toMatch(/^1\. Reply to reviews$/m);
    expect(a).toMatch(/^2\. Draft posts$/m);
  });

  it("exposes the 2.0 tagline", () => {
    expect(AGENT_TAGLINE).toBe("Create better prompts, build intelligent AI agents, automate workflows and boost productivity.");
  });
});

import { buildAgentsSdkSnippet } from "@/lib/agent-builder";
describe("Agents SDK snippet", () => {
  it("embeds name and instructions safely in TS and Python", () => {
    const ins = buildAgentPrompt(AGENT_EXAMPLE);
    const ts = buildAgentsSdkSnippet("Shop Helper", ins, "ts");
    expect(ts).toContain("import { Agent, run } from '@openai/agents';");
    expect(ts).toContain('name: "Shop Helper",');
    expect(ts).toContain(`instructions: ${JSON.stringify(ins)},`);
    expect(ts).toContain("result.finalOutput");
    const py = buildAgentsSdkSnippet("", ins, "py");
    expect(py).toContain("from agents import Agent, Runner");
    expect(py).toContain('Agent(name="Assistant"');
    expect(py).toContain("Runner.run_sync");
    expect(buildAgentsSdkSnippet("x", " ", "ts")).toBe("");
    expect(ts).not.toMatch(/sk-/);
  });
});
