import { describe, expect, it } from "vitest";
import { renderKit, STACKS, defaultAnswers, parseMdcFrontmatter, assertSafePath, normaliseAnswers, FILE_OPTIONS } from "@/lib/engine";

describe("agent kit", () => {
  for (const s of STACKS) {
    it(`${s.id}: renders all files deterministically with valid .mdc frontmatter`, () => {
      const a = defaultAnswers(s.id);
      const f1 = renderKit(s.id, a);
      const f2 = renderKit(s.id, { ...a });
      expect(f1).toEqual(f2);
      const paths = f1.map((f) => f.path);
      expect(paths).toContain("AGENTS.md");
      expect(paths).toContain("CLAUDE.md");
      expect(paths.some((p) => p.startsWith(".cursor/rules/") && p.endsWith(".mdc"))).toBe(true);
      expect(paths).toContain(".claude/agents/code-reviewer.md");
      for (const f of f1.filter((x) => x.kind === "cursor_mdc")) {
        const fm = parseMdcFrontmatter(f.content);
        expect(fm, f.path).not.toBeNull();
        expect(fm!.description.length).toBeGreaterThan(5);
      }
      expect(f1.filter((x) => x.kind === "cursor_mdc" && parseMdcFrontmatter(x.content)!.alwaysApply)).toHaveLength(1);
      expect(new Set(paths).size).toBe(paths.length);
    });
  }

  it("laravel answers flow into AGENTS.md", () => {
    const files = renderKit("laravel", { ...defaultAnswers("laravel"), projectName: "invoicer", frontend: "Livewire", tests: "PHPUnit", larastan: "true", neverDo: "Touch the billing module" });
    const agents = files.find((f) => f.path === "AGENTS.md")!.content;
    expect(agents).toContain("# AGENTS.md: invoicer");
    expect(agents).toContain("Livewire");
    expect(agents).toContain("PHPUnit");
    expect(agents).toContain("./vendor/bin/phpstan analyse");
    expect(agents).toContain("- Touch the billing module");
    expect(agents).toContain("Do not edit existing migrations");
  });

  it("node uses chosen package manager", () => {
    const files = renderKit("node", { ...defaultAnswers("node"), pm: "pnpm" });
    expect(files.find((f) => f.path === "AGENTS.md")!.content).toContain("`pnpm dev`");
  });

  it("CLAUDE.md imports AGENTS.md", () => {
    const files = renderKit("nextjs", defaultAnswers("nextjs"));
    expect(files.find((f) => f.path === "CLAUDE.md")!.content).toContain("@AGENTS.md");
  });

  it("file selection is respected", () => {
    const files = renderKit("nextjs", defaultAnswers("nextjs"), { files: ["agents_md"] });
    expect(files.map((f) => f.path)).toEqual(["AGENTS.md"]);
    expect(FILE_OPTIONS.length).toBe(5);
  });

  it("invalid select values fall back to defaults; unknown keys dropped; newlines removed from single-line fields", () => {
    const a = normaliseAnswers("laravel", { frontend: "Angular", evil: "x", projectName: "my\napp<script>" });
    expect(a.frontend).toBe("Blade");
    expect("evil" in a).toBe(false);
    expect(a.projectName).not.toMatch(/[<>\n]/);
  });

  it("assertSafePath rejects traversal and absolute paths", () => {
    expect(() => assertSafePath("../etc/passwd.md")).toThrow();
    expect(() => assertSafePath("/abs.md")).toThrow();
    expect(() => assertSafePath("run.sh")).toThrow();
    expect(() => assertSafePath(".cursor/rules/ok.mdc")).not.toThrow();
  });

  it("parseMdcFrontmatter rejects malformed frontmatter", () => {
    expect(parseMdcFrontmatter("no frontmatter")).toBeNull();
    expect(parseMdcFrontmatter("---\ndescription: x\nglobs:\nalwaysApply: maybe\n---\n")).toBeNull();
  });
});

import JSZip from "jszip";
describe("ZIP packaging", () => {
  it("round-trips all kit files through JSZip (same library the UI uses)", async () => {
    const files = renderKit("laravel", defaultAnswers("laravel"));
    const zip = new JSZip();
    for (const f of files) zip.file(f.path, f.content);
    const buf = await zip.generateAsync({ type: "uint8array" });
    const back = await JSZip.loadAsync(buf);
    const names = Object.keys(back.files).filter((n) => !back.files[n]!.dir).sort();
    expect(names).toEqual(files.map((f) => f.path).sort());
    expect(await back.file("AGENTS.md")!.async("string")).toBe(files[0]!.content);
  });
});
