/**
 * Coding-agent context kit generator. Pure and deterministic: same answers produce the same files.
 * File conventions:
 *  - AGENTS.md at repo root (read by many coding agents).
 *  - CLAUDE.md for Claude Code (supports @path imports).
 *  - .cursor/rules/*.mdc with YAML frontmatter: description, globs, alwaysApply (per cursor.com/docs/rules).
 *  - .claude/agents/*.md subagents and .claude/commands/*.md slash commands (Claude Code).
 * Verify against current vendor docs before relying on any convention.
 */

export type StackId = "laravel" | "node" | "nextjs";
export type QType = "text" | "textarea" | "select" | "checkbox";

export interface Question {
  key: string;
  label: string;
  type: QType;
  options?: string[];
  default: string; // checkbox: "true" | "false"
  help?: string;
  maxLen?: number;
}

export interface StackDef {
  id: StackId;
  name: string;
  tagline: string;
  questions: Question[];
}

export interface KitFile { path: string; content: string; kind: "agents_md" | "claude_md" | "cursor_mdc" | "subagent" | "slash_command" }

export const FILE_OPTIONS = [
  { id: "agents_md", label: "AGENTS.md", desc: "Root instructions read by many coding agents" },
  { id: "claude_md", label: "CLAUDE.md", desc: "Claude Code memory file (imports AGENTS.md)" },
  { id: "cursor_mdc", label: ".cursor/rules/*.mdc", desc: "Cursor project rules with frontmatter" },
  { id: "subagent", label: ".claude/agents/code-reviewer.md", desc: "Claude Code reviewer subagent" },
  { id: "slash_command", label: ".claude/commands/*.md", desc: "Claude Code slash commands (/review, /test)" },
] as const;

const COMMON: Question[] = [
  { key: "projectName", label: "Project name", type: "text", default: "my-app", maxLen: 80 },
  { key: "description", label: "One-line description", type: "text", default: "", maxLen: 300, help: "What the app does and for whom." },
  { key: "styleRules", label: "Extra code-style rules (one per line)", type: "textarea", default: "", maxLen: 2000 },
  { key: "neverDo", label: "Things the agent must never do (one per line)", type: "textarea", default: "Commit secrets or .env files\nRun destructive database commands without asking", maxLen: 2000 },
];

export const STACKS: StackDef[] = [
  {
    id: "laravel", name: "Laravel", tagline: "PHP, Laravel, Blade/Livewire/Inertia, Pest/PHPUnit",
    questions: [
      ...COMMON.slice(0, 2),
      { key: "phpVersion", label: "PHP version", type: "text", default: "8.3", maxLen: 10 },
      { key: "laravelVersion", label: "Laravel version", type: "text", default: "12", maxLen: 10 },
      { key: "frontend", label: "Frontend", type: "select", options: ["Blade", "Livewire", "Inertia + React", "Inertia + Vue", "API only"], default: "Blade" },
      { key: "db", label: "Database", type: "select", options: ["MySQL", "PostgreSQL", "SQLite", "MariaDB"], default: "MySQL" },
      { key: "tests", label: "Test framework", type: "select", options: ["Pest", "PHPUnit"], default: "Pest" },
      { key: "queue", label: "Queue driver", type: "select", options: ["none", "database", "redis"], default: "database" },
      { key: "larastan", label: "Uses Larastan / PHPStan", type: "checkbox", default: "false" },
      { key: "pint", label: "Uses Laravel Pint", type: "checkbox", default: "true" },
      ...COMMON.slice(2),
    ],
  },
  {
    id: "node", name: "Node.js API", tagline: "Express/Fastify/NestJS/Hono, TypeScript, Prisma/Drizzle",
    questions: [
      ...COMMON.slice(0, 2),
      { key: "nodeVersion", label: "Node.js version", type: "text", default: "22", maxLen: 10 },
      { key: "framework", label: "Framework", type: "select", options: ["Express", "Fastify", "NestJS", "Hono"], default: "Express" },
      { key: "language", label: "Language", type: "select", options: ["TypeScript", "JavaScript"], default: "TypeScript" },
      { key: "orm", label: "Database layer", type: "select", options: ["Prisma", "Drizzle", "Sequelize", "Knex", "none"], default: "Prisma" },
      { key: "db", label: "Database", type: "select", options: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"], default: "PostgreSQL" },
      { key: "tests", label: "Test runner", type: "select", options: ["Vitest", "Jest", "node:test"], default: "Vitest" },
      { key: "pm", label: "Package manager", type: "select", options: ["npm", "pnpm", "yarn"], default: "npm" },
      ...COMMON.slice(2),
    ],
  },
  {
    id: "nextjs", name: "Next.js", tagline: "React, App Router, Tailwind, Supabase/Prisma",
    questions: [
      ...COMMON.slice(0, 2),
      { key: "nextVersion", label: "Next.js version", type: "text", default: "16", maxLen: 10 },
      { key: "router", label: "Router", type: "select", options: ["App Router", "Pages Router"], default: "App Router" },
      { key: "styling", label: "Styling", type: "select", options: ["Tailwind CSS", "CSS Modules", "styled-components"], default: "Tailwind CSS" },
      { key: "data", label: "Data / backend", type: "select", options: ["Supabase", "Prisma", "Drizzle", "External API", "none"], default: "Supabase" },
      { key: "tests", label: "Test runner", type: "select", options: ["Vitest", "Jest", "Playwright only", "none yet"], default: "Vitest" },
      { key: "pm", label: "Package manager", type: "select", options: ["npm", "pnpm", "yarn"], default: "npm" },
      ...COMMON.slice(2),
    ],
  },
];

export function getStack(id: string): StackDef {
  const s = STACKS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stack: ${id}`);
  return s;
}

export function defaultAnswers(stack: StackId): Record<string, string> {
  return Object.fromEntries(getStack(stack).questions.map((q) => [q.key, q.default]));
}

/** Normalise answers: keep only known keys, enforce options/lengths, single-line where needed. */
export function normaliseAnswers(stack: StackId, raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of getStack(stack).questions) {
    let v = typeof raw[q.key] === "string" ? (raw[q.key] as string) : q.default;
    v = v.replace(/\r\n?/g, "\n").trim().slice(0, q.maxLen ?? 200);
    if (q.type === "text" || q.type === "select") v = v.replace(/\n/g, " ");
    if (q.type === "select" && q.options && !q.options.includes(v)) v = q.default;
    if (q.type === "checkbox") v = v === "true" ? "true" : "false";
    out[q.key] = v;
  }
  const pn = out.projectName ?? "";
  if (!/^[A-Za-z0-9 ._-]{1,80}$/.test(pn)) out.projectName = pn.replace(/[^A-Za-z0-9 ._-]/g, "").slice(0, 80) || "my-app";
  return out;
}

const lines = (s: string | undefined) => (s ?? "").split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const yes = (v: string | undefined) => v === "true";

interface Facts {
  title: string;
  stackLine: string;
  setup: string[];
  commands: [string, string][];
  structure: string[];
  style: string[];
  testing: string[];
  dont: string[];
  security: string[];
  mdc: { name: string; description: string; globs: string; alwaysApply: boolean; body: string[] }[];
}

function laravelFacts(a: Record<string, string>): Facts {
  const usesNode = a.frontend !== "API only";
  const test = "php artisan test";
  const commands: [string, string][] = [
    ["Install PHP deps", "composer install"],
    ...(usesNode ? [["Install JS deps", "npm install"] as [string, string]] : []),
    ["Run migrations", "php artisan migrate"],
    ["Dev server", usesNode ? "php artisan serve (and npm run dev for Vite)" : "php artisan serve"],
    ["Tests", test],
    ...(yes(a.pint) ? [["Format", "./vendor/bin/pint"] as [string, string]] : []),
    ...(yes(a.larastan) ? [["Static analysis", "./vendor/bin/phpstan analyse"] as [string, string]] : []),
  ];
  const fe: Record<string, string[]> = {
    Blade: ["Views live in resources/views; use Blade components for repeated UI", "Escape output with {{ }}; only use {!! !!} for trusted, sanitised HTML"],
    Livewire: ["Livewire components live in app/Livewire with views in resources/views/livewire", "Validate in the component with rules; never trust public properties from the client", "Use wire:model.live sparingly to limit requests"],
    "Inertia + React": ["Pages live in resources/js/Pages; shared props via HandleInertiaRequests middleware", "Return Inertia::render() from controllers; never expose models without selecting fields"],
    "Inertia + Vue": ["Pages live in resources/js/Pages; shared props via HandleInertiaRequests middleware", "Return Inertia::render() from controllers; never expose models without selecting fields"],
    "API only": ["Return API Resources (app/Http/Resources) instead of raw models", "Version routes under routes/api.php and keep responses consistent"],
  };
  return {
    title: a.projectName ?? "my-app",
    stackLine: `Laravel ${a.laravelVersion} on PHP ${a.phpVersion}, ${a.db}, ${a.frontend}, tests with ${a.tests}${a.queue !== "none" ? `, ${a.queue} queue` : ""}.`,
    setup: ["cp .env.example .env", "php artisan key:generate"],
    commands,
    structure: [
      "app/Models: Eloquent models", "app/Http/Controllers: thin controllers", "app/Http/Requests: Form Request validation",
      "app/Actions or app/Services: business logic (create if missing)", "database/migrations, database/factories, database/seeders",
      "routes/web.php" + (a.frontend === "API only" ? ", routes/api.php" : ""), "tests/Feature and tests/Unit",
    ],
    style: [
      "Follow PSR-12 and Laravel conventions" + (yes(a.pint) ? "; run Pint before finishing" : ""),
      "Use strict types and typed properties/returns where practical",
      "Validate input with Form Requests, not inline in controllers",
      "Keep controllers thin; move logic to Actions/Services",
      "Prefer Eloquent relationships and eager loading (with()) to avoid N+1 queries",
      "Use config() not env() outside config files",
      ...(fe[a.frontend ?? ""] ?? []),
      ...(a.queue !== "none" ? ["Dispatch slow work (mail, external APIs) to queued jobs; make jobs idempotent"] : []),
    ],
    testing: [
      `Write ${a.tests} feature tests for every new endpoint or behaviour`,
      "Use model factories and RefreshDatabase; never hit real external services (use Http::fake(), Mail::fake(), Queue::fake())",
      `Run \`${test}\` and make sure it passes before saying the task is done`,
      ...(yes(a.larastan) ? ["Keep PHPStan/Larastan passing at the configured level"] : []),
    ],
    dont: [
      "Do not edit existing migrations that may have run in production; add a new migration instead",
      "Do not run php artisan migrate:fresh, db:wipe or similar destructive commands without explicit approval",
      "Do not add packages without explaining why",
    ],
    security: ["Use mass-assignment protection ($fillable) and authorisation (Policies/Gates)", "Never log secrets or personal data", "Use parameter binding; no raw SQL string concatenation"],
    mdc: [
      { name: "laravel-core", description: `Core conventions for ${a.projectName} (Laravel ${a.laravelVersion})`, globs: "", alwaysApply: true, body: [] },
      { name: "laravel-database", description: "Rules for migrations, models and queries", globs: "database/**/*.php,app/Models/**/*.php", alwaysApply: false,
        body: ["Create a new migration for every schema change; never edit applied migrations", "Add indexes for foreign keys and frequently filtered columns", "Define relationships and casts on models; use $fillable", "Eager-load relationships to avoid N+1 queries"] },
      { name: "laravel-testing", description: `How to write ${a.tests} tests in this project`, globs: "tests/**/*.php", alwaysApply: false,
        body: [`Use ${a.tests} syntax consistently`, "Use factories and RefreshDatabase", "Fake external services (Http::fake, Mail::fake, Queue::fake)", `Run ${test} before finishing`] },
    ],
  };
}

function nodeFacts(a: Record<string, string>): Facts {
  const pm = a.pm, run = pm === "npm" ? "npm run" : pm;
  const ts = a.language === "TypeScript";
  const ext = ts ? "ts" : "js";
  return {
    title: a.projectName ?? "my-app",
    stackLine: `${a.framework} on Node.js ${a.nodeVersion} (${a.language}), ${a.orm !== "none" ? a.orm + " + " : ""}${a.db}, tests with ${a.tests}.`,
    setup: [`${pm} install`, "cp .env.example .env"],
    commands: [
      ["Install", `${pm} install`], ["Dev", `${run} dev`], ["Tests", `${pm} test`], ["Lint", `${run} lint`],
      ...(ts ? [["Type check", `${run} typecheck`] as [string, string]] : []),
      ...(a.orm === "Prisma" ? [["Migrate", "npx prisma migrate dev"] as [string, string]] : a.orm === "Drizzle" ? [["Migrate", "npx drizzle-kit migrate"] as [string, string]] : []),
    ],
    structure: ["src/routes (or src/modules): HTTP layer", "src/services: business logic", "src/db: database client and queries", "src/lib: shared utilities", "tests/: test files"],
    style: [
      ts ? "TypeScript strict mode; avoid `any`, prefer explicit return types on exported functions" : "Use modern ES modules and JSDoc types for public functions",
      "Validate every request body/query with a schema (e.g. zod) at the route boundary",
      "Keep route handlers thin; put logic in services",
      "Use async/await; always handle promise rejections",
      "Return consistent JSON error shapes with proper HTTP status codes",
      `Framework: ${a.framework}. Follow its idiomatic patterns (middleware/plugins/modules)`,
    ],
    testing: [`Write ${a.tests} tests for new behaviour`, "Test HTTP routes with an in-process request library; mock external services", `Run \`${pm} test\` before finishing`],
    dont: ["Do not commit .env or credentials", "Do not change the database schema without a migration", "Do not add dependencies without explaining why"],
    security: ["Never trust client input; validate and sanitise", "Use parameterised queries / ORM methods only", "Set timeouts on outbound HTTP calls", "Never log tokens, passwords or personal data"],
    mdc: [
      { name: "node-core", description: `Core conventions for ${a.projectName} (${a.framework})`, globs: "", alwaysApply: true, body: [] },
      { name: "node-routes", description: "Rules for HTTP routes and validation", globs: `src/**/*.${ext}`, alwaysApply: false,
        body: ["Validate input with a schema at the boundary", "Handlers call services; no business logic in routes", "Map errors to consistent JSON responses"] },
      { name: "node-testing", description: `How to write ${a.tests} tests`, globs: `**/*.test.${ext},**/*.spec.${ext}`, alwaysApply: false,
        body: [`Use ${a.tests}`, "One behaviour per test; descriptive names", "Mock network and time"] },
    ],
  };
}

function nextFacts(a: Record<string, string>): Facts {
  const pm = a.pm, run = pm === "npm" ? "npm run" : pm;
  const app = a.router === "App Router";
  return {
    title: a.projectName ?? "my-app",
    stackLine: `Next.js ${a.nextVersion} (${a.router}), ${a.styling}, data via ${a.data}, tests: ${a.tests}.`,
    setup: [`${pm} install`, "cp .env.example .env.local"],
    commands: [["Install", `${pm} install`], ["Dev", `${run} dev`], ["Build", `${run} build`], ["Lint", `${run} lint`], ...(a.tests !== "none yet" ? [["Tests", `${pm} test`] as [string, string]] : [])],
    structure: app
      ? ["app/: routes, layouts, route handlers (route.ts)", "components/: shared UI", "lib/: utilities, data access", "public/: static assets"]
      : ["pages/: routes and API routes", "components/: shared UI", "lib/: utilities", "public/: static assets"],
    style: [
      "TypeScript strict; no `any` in new code",
      ...(app ? [
        "Default to Server Components; add 'use client' only for interactivity or browser APIs",
        "Read the Next.js docs bundled in node_modules/next/dist/docs for your installed version before using unfamiliar APIs (APIs change between major versions)",
        "params and searchParams are async in recent versions; await them",
      ] : ["Use getStaticProps/getServerSideProps appropriately; avoid client-side fetching for SEO content"]),
      a.styling === "Tailwind CSS" ? "Use Tailwind utility classes; extract repeated patterns into components, not custom CSS" : `Use ${a.styling} consistently`,
      "Every page exports metadata (title, description)",
      "Keep secrets server-side; only NEXT_PUBLIC_* variables reach the browser",
      ...(a.data === "Supabase" ? ["Rely on Supabase Row Level Security; never use the service-role key in client code"] : []),
    ],
    testing: a.tests === "none yet"
      ? ["Add tests for any non-trivial logic you write (suggest a runner if none exists)", `Run \`${run} build\` to catch type errors before finishing`]
      : [`Write ${a.tests} tests for new logic`, `Run \`${pm} test\` and \`${run} build\` before finishing`],
    dont: ["Do not disable TypeScript or ESLint rules to make errors go away", "Do not add client components where a server component works", "Do not commit .env.local"],
    security: ["Validate all route handler / server action input with a schema", "Check authentication and authorisation on the server for every mutation", "Never expose secrets via NEXT_PUBLIC_ variables"],
    mdc: [
      { name: "nextjs-core", description: `Core conventions for ${a.projectName} (Next.js ${a.nextVersion})`, globs: "", alwaysApply: true, body: [] },
      { name: "nextjs-components", description: "Rules for React components and client/server boundaries", globs: app ? "app/**/*.tsx,components/**/*.tsx" : "pages/**/*.tsx,components/**/*.tsx", alwaysApply: false,
        body: ["Prefer Server Components; isolate interactivity in small client components", "Accessible markup: labels, alt text, keyboard focus", "No data fetching in useEffect when a server fetch works"] },
      { name: "nextjs-api", description: "Rules for route handlers and server actions", globs: app ? "app/**/route.ts,app/**/actions.ts" : "pages/api/**/*.ts", alwaysApply: false,
        body: ["Validate input with zod", "Return typed JSON with correct status codes", "Check auth before mutating data"] },
    ],
  };
}

function facts(stack: StackId, a: Record<string, string>): Facts {
  return stack === "laravel" ? laravelFacts(a) : stack === "node" ? nodeFacts(a) : nextFacts(a);
}

function agentsMd(f: Facts, a: Record<string, string>): string {
  const extraStyle = lines(a.styleRules);
  const never = lines(a.neverDo);
  return [
    `# AGENTS.md: ${f.title}`,
    "",
    a.description ? `${a.description}\n` : "",
    "## Stack",
    f.stackLine,
    "",
    "## Setup",
    "```bash",
    ...f.setup,
    "```",
    "",
    "## Commands",
    ...f.commands.map(([k, v]) => `- ${k}: \`${v}\``),
    "",
    "## Project structure",
    bullets(f.structure),
    "",
    "## Code style",
    bullets([...f.style, ...extraStyle]),
    "",
    "## Testing",
    bullets(f.testing),
    "",
    "## Security",
    bullets(f.security),
    "",
    "## Never",
    bullets([...never, ...f.dont]),
    "",
    "## Working agreement",
    bullets([
      "Before editing, state a short plan and the files you will touch",
      "Make the smallest change that solves the task; do not refactor unrelated code",
      "If requirements are ambiguous, ask instead of guessing",
      "When done, summarise what changed and how you verified it",
    ]),
    "",
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
}

function claudeMd(f: Facts, a: Record<string, string>): string {
  return [
    `# CLAUDE.md: ${f.title}`,
    "",
    "Full project conventions live in AGENTS.md (imported below). Keep this file short.",
    "",
    "@AGENTS.md",
    "",
    "## Claude Code specifics",
    bullets([
      "Use plan mode for multi-file changes and wait for approval before large edits",
      `Verify with: ${f.commands.filter(([k]) => /test|lint|type|build|format|static/i.test(k)).map(([, v]) => `\`${v}\``).join(", ") || "the project's test command"}`,
      "Use the code-reviewer subagent (if present) before declaring a task done",
      "Never run commands that delete data or rewrite git history without asking",
    ]),
    "",
    ...(a.description ? ["## Product context", a.description, ""] : []),
  ].join("\n");
}

export function mdcFile(m: Facts["mdc"][number], body: string[]): string {
  const fm = ["---", `description: ${m.description.replace(/\n/g, " ")}`, `globs: ${m.globs}`, `alwaysApply: ${m.alwaysApply}`, "---", ""];
  return [...fm, bullets(body), ""].join("\n");
}

function reviewerAgent(f: Facts): string {
  return [
    "---",
    "name: code-reviewer",
    `description: Reviews recent changes in ${f.title} for bugs, security issues and convention violations. Use after completing a change.`,
    "tools: Read, Grep, Glob, Bash",
    "---",
    "",
    "You are a strict but practical code reviewer for this project.",
    "",
    `Stack: ${f.stackLine}`,
    "",
    "Review the current diff (git diff) and report, in priority order:",
    "1. Bugs and logic errors",
    "2. Security problems (input validation, auth, secrets, injection)",
    "3. Missing or weak tests",
    "4. Violations of the conventions in AGENTS.md",
    "",
    "For each finding give file:line, why it matters, and a concrete fix. If everything looks good, say so briefly. Do not rewrite code yourself unless asked.",
    "",
  ].join("\n");
}

function commands(f: Facts): KitFile[] {
  const test = f.commands.find(([k]) => k === "Tests")?.[1] ?? "the project's test command";
  return [
    { path: ".claude/commands/review.md", kind: "slash_command", content: ["---", "description: Review the current changes against project conventions", "---", "", "Review the uncommitted changes (git diff). Check for bugs, security issues, missing tests and AGENTS.md violations. List findings by priority with file:line and a fix.", ""].join("\n") },
    { path: ".claude/commands/test.md", kind: "slash_command", content: ["---", "description: Write or update tests for the current change, then run them", "---", "", `Identify the behaviour changed in the current diff, write or update tests for it following AGENTS.md, then run \`${test}\` and fix failures. Report what you tested.`, ""].join("\n") },
  ];
}

export interface RenderOptions { files?: string[] }

/** Render the kit. Deterministic and side-effect free. */
export function renderKit(stack: StackId, rawAnswers: Record<string, unknown>, opts: RenderOptions = {}): KitFile[] {
  const a = normaliseAnswers(stack, rawAnswers);
  const f = facts(stack, a);
  const want = new Set(opts.files ?? FILE_OPTIONS.map((o) => o.id));
  const out: KitFile[] = [];
  if (want.has("agents_md")) out.push({ path: "AGENTS.md", kind: "agents_md", content: agentsMd(f, a) });
  if (want.has("claude_md")) out.push({ path: "CLAUDE.md", kind: "claude_md", content: claudeMd(f, a) });
  if (want.has("cursor_mdc")) {
    for (const m of f.mdc) {
      const body = m.alwaysApply
        ? [f.stackLine, ...f.style, ...lines(a.styleRules), ...lines(a.neverDo).map((n) => `Never: ${n}`), "Follow AGENTS.md for commands and testing"]
        : m.body;
      out.push({ path: `.cursor/rules/${m.name}.mdc`, kind: "cursor_mdc", content: mdcFile(m, body) });
    }
  }
  if (want.has("subagent")) out.push({ path: ".claude/agents/code-reviewer.md", kind: "subagent", content: reviewerAgent(f) });
  if (want.has("slash_command")) out.push(...commands(f));
  for (const file of out) assertSafePath(file.path);
  return out;
}

/** Reject traversal, absolute paths and unexpected extensions. */
export function assertSafePath(p: string): void {
  if (p.startsWith("/") || p.includes("..") || p.includes("\\") || !/^[A-Za-z0-9._\-/]+$/.test(p) || !/\.(md|mdc)$/.test(p)) {
    throw new Error(`Unsafe path: ${p}`);
  }
}

/** Parse .mdc frontmatter (used by tests and the in-app validator). */
export function parseMdcFrontmatter(content: string): { description: string; globs: string; alwaysApply: boolean } | null {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const kv: Record<string, string> = {};
  for (const line of (m[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) kv[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!("description" in kv) || !("globs" in kv) || !("alwaysApply" in kv)) return null;
  if (kv.alwaysApply !== "true" && kv.alwaysApply !== "false") return null;
  return { description: kv.description, globs: kv.globs, alwaysApply: kv.alwaysApply === "true" };
}
