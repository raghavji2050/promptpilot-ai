import type { LibraryItem } from "./types";

const D = (x: Omit<LibraryItem, "kind" | "targets"> & { targets?: string[] }): LibraryItem => ({
  kind: "developer",
  targets: x.targets ?? ["cursor", "claude-code", "chatgpt", "claude"],
  ...x,
});

export const DEVELOPER_PROMPTS: LibraryItem[] = [
  D({
    slug: "bug-fix-with-root-cause", title: "Fix a bug with root-cause analysis", category: "Debugging", tags: ["bug", "debugging"],
    summary: "Makes the agent find the cause before patching symptoms.",
    failureMode: "Agent patches the symptom (adds a null check) without understanding why it happens.",
    body: `Bug: [describe what happens vs what should happen]
Steps to reproduce: [steps]
Error / logs:
"""
[paste error or stack trace]
"""

Before changing any code:
1. List the 2–3 most likely root causes, with the evidence for each.
2. Tell me which files you need to read to confirm, then read them.
3. State the confirmed root cause in one sentence.

Then fix it with the smallest change that addresses the root cause, add a regression test that fails before the fix and passes after, and run the test suite. Do not refactor unrelated code.`,
  }),
  D({
    slug: "safe-refactor", title: "Refactor without changing behaviour", category: "Refactoring", tags: ["refactor"],
    summary: "Behaviour-preserving refactor with tests as a safety net.",
    failureMode: "Refactor silently changes behaviour or touches half the codebase.",
    body: `Refactor [file/class/function] to [goal: e.g. extract the pricing logic into a service].

Rules:
- Behaviour must not change. If tests for this code are missing, write characterisation tests first and run them.
- Keep public method signatures unless I approve changes.
- Work in small steps; run tests after each step.
- Touch only the files needed. List them before you start.

Finish with: files changed, why the new structure is better, and the test command output.`,
  }),
  D({
    slug: "write-tests-for-existing-code", title: "Write tests for existing code", category: "Testing", tags: ["tests"],
    summary: "Covers happy path, edge cases and failures without testing implementation details.",
    failureMode: "Tests only cover the happy path or assert on internals, so they break on every refactor.",
    body: `Write tests for [file/function/endpoint] using [Pest / PHPUnit / Vitest / Jest].

Cover:
- The main happy path
- Edge cases: empty input, boundaries, invalid types, large input
- Failure paths: exceptions, validation errors, external service failure (mock it)

Test behaviour through the public interface, not private methods. Use the project's existing factories/fixtures. Run the tests and show the output. If you find a real bug, stop and report it instead of writing a test that encodes the bug.`,
  }),
  D({
    slug: "pr-review", title: "Review a pull request", category: "Code review", tags: ["review", "pr"],
    summary: "Prioritised review: bugs, security, tests, then style.",
    failureMode: "Review drowns real bugs in nitpicks about naming and formatting.",
    body: `Review this diff:
"""
[paste diff or say: review the current git diff]
"""

Report findings in this order, skipping empty categories:
1. Bugs / incorrect logic
2. Security (input validation, authz, secrets, injection)
3. Performance problems (N+1 queries, unbounded loops, missing indexes)
4. Missing tests
5. Readability (only if significant)

For each: file:line, the problem, why it matters, a concrete fix. End with an overall verdict: approve / approve with changes / request changes.`,
  }),
  D({
    slug: "explain-codebase", title: "Explain an unfamiliar codebase", category: "Onboarding", tags: ["onboarding", "architecture"],
    summary: "Map of the code before you start changing it.",
    failureMode: "Agent starts editing a codebase it hasn't understood.",
    body: `I'm new to this codebase. Without changing anything, produce:
1. A one-paragraph summary of what the app does.
2. The main folders and what lives in each.
3. The request lifecycle for one typical feature (entry point → data → response), naming real files.
4. How to run it locally and run the tests (from the actual config files).
5. Anything risky or surprising you noticed (dead code, missing tests, unusual patterns).

Cite file paths for every claim. Say "not found" rather than guessing.`,
  }),
  D({
    slug: "security-audit", title: "Security audit of a feature", category: "Security", tags: ["security", "audit"],
    summary: "Targeted OWASP-style review of one feature.",
    failureMode: "Generic security advice instead of findings tied to real code.",
    body: `Audit [feature / files] for security issues. Check specifically:
- Authentication and authorisation on every route/action
- Input validation and output escaping (XSS)
- SQL / command / path injection
- Mass assignment and insecure direct object references
- Secrets in code, logs or client bundles
- File upload handling and SSRF (if applicable)
- Rate limiting on sensitive endpoints

Only report issues you can point to in the code (file:line), with severity (high/medium/low) and a fix. Do not change code yet.`,
  }),
  D({
    slug: "laravel-migration-safe", title: "Laravel: add a safe database migration", category: "Database", stacks: ["laravel"], tags: ["laravel", "migration", "database"],
    summary: "New column/table with indexes, rollback and model updates.",
    failureMode: "Edits an existing migration, forgets indexes, or breaks rollback.",
    body: `Add a migration to [describe change, e.g. add a nullable "gst_number" to customers].

Requirements:
- Create a NEW migration with php artisan make:migration; never edit existing migrations.
- Provide a working down() method.
- Add indexes for foreign keys and columns used in where/order clauses.
- For large tables, avoid changes that lock the table for long; tell me if that's a risk.
- Update the model ($fillable, casts, relationships) and the factory.
- Add or update a feature test that uses the new column.
Run php artisan migrate and php artisan test, and show the output.`,
  }),
  D({
    slug: "laravel-n-plus-one", title: "Laravel: find and fix N+1 queries", category: "Performance", stacks: ["laravel"], tags: ["laravel", "performance", "eloquent"],
    summary: "Eager loading fixes with proof.",
    failureMode: "Adds with() everywhere blindly, or misses the real N+1 in a Blade/Resource loop.",
    body: `Find N+1 query problems in [controller / page / API resource].

1. Trace which relationships are accessed inside loops (controllers, Blade views, API Resources, Livewire components).
2. Fix with eager loading (with(), load(), withCount()) only where needed.
3. If useful, suggest enabling Model::preventLazyLoading() in non-production environments.
4. Show the before/after query count from a feature test using DB::enableQueryLog() or similar.
Don't change response shape or behaviour.`,
  }),
  D({
    slug: "laravel-form-request", title: "Laravel: move validation into a Form Request", category: "Refactoring", stacks: ["laravel"], tags: ["laravel", "validation"],
    summary: "Thin controllers with proper authorisation.",
    failureMode: "Validation duplicated across controllers and authorize() left returning true.",
    body: `Move the validation in [Controller@method] into a dedicated Form Request.
- Generate it with php artisan make:request.
- Implement authorize() using the existing Policy/Gate (do not just return true unless there is truly no auth requirement; tell me if so).
- Keep the exact same rules and messages.
- Use $request->validated() in the controller.
- Add feature tests for one valid and two invalid payloads.`,
  }),
  D({
    slug: "laravel-queue-job", title: "Laravel: move slow work to a queued job", category: "Performance", stacks: ["laravel"], tags: ["laravel", "queue"],
    summary: "Idempotent jobs with retries and tests.",
    failureMode: "Job is not idempotent, so retries send duplicate emails or charges.",
    body: `Move [slow work, e.g. sending invoice PDF email] from the request cycle into a queued job.
- Make the job idempotent (safe to run twice).
- Set sensible $tries, backoff and timeout; handle failure in failed().
- Pass IDs, not whole models with large relations, unless using SerializesModels intentionally.
- Use Queue::fake() / Bus::fake() in tests to assert dispatch, and a separate test for the job's handle().
Explain how to run the worker locally.`,
  }),
  D({
    slug: "livewire-component", title: "Laravel Livewire: build a component", category: "Frontend", stacks: ["laravel"], tags: ["laravel", "livewire"],
    summary: "Secure Livewire component with validation and tests.",
    failureMode: "Trusts public properties from the browser and skips authorisation.",
    body: `Create a Livewire component for [feature, e.g. editable invoice line items].
- Validate all input with rules; never trust public properties.
- Authorise actions (Policies) inside action methods.
- Use wire:model.live only where instant feedback is needed.
- Keep heavy queries in computed properties.
- Add a Livewire test covering render, a successful action, and a validation failure.`,
  }),
  D({
    slug: "node-endpoint-zod", title: "Node.js: add a validated API endpoint", category: "API", stacks: ["node"], tags: ["node", "api", "validation"],
    summary: "Endpoint with schema validation, errors and tests.",
    failureMode: "Endpoint trusts req.body and returns inconsistent error shapes.",
    body: `Add [METHOD /path] to the [Express/Fastify/NestJS/Hono] API that [does X].
- Validate body/query/params with a schema (zod or the framework's validator).
- Keep the handler thin; put logic in a service function.
- Return consistent JSON errors: { error: { code, message } } with correct status codes.
- Check authentication/authorisation.
- Write tests for success, validation failure, and unauthorised access.
Run the tests and the type checker.`,
  }),
  D({
    slug: "node-error-handling", title: "Node.js: centralise error handling", category: "Refactoring", stacks: ["node"], tags: ["node", "errors"],
    summary: "One error middleware, typed errors, no leaked stack traces.",
    failureMode: "Unhandled promise rejections and stack traces leaking to clients.",
    body: `Introduce centralised error handling in this [framework] app.
- Define a small set of typed application errors (NotFound, Validation, Unauthorized, Conflict).
- Add one error-handling middleware/hook that maps them to HTTP responses and logs unexpected errors without leaking stack traces to clients.
- Ensure async handlers' rejections reach the handler.
- Update 2–3 existing routes as examples and add tests for each error type.`,
  }),
  D({
    slug: "nextjs-server-component-data", title: "Next.js: fetch data in a Server Component", category: "Frontend", stacks: ["nextjs"], tags: ["nextjs", "react", "app-router"],
    summary: "Moves client-side fetching to the server where it belongs.",
    failureMode: "useEffect + fetch on pages that should be server-rendered for speed and SEO.",
    body: `Refactor [page/component] to load its data in a Server Component instead of useEffect.
- Check the installed Next.js version's docs (node_modules/next/dist/docs) for current caching and params APIs before writing code.
- Keep interactive parts in small 'use client' components that receive data as props.
- Add loading and error states (loading.tsx / error.tsx or Suspense).
- Don't expose secrets to the client.
Run the build to confirm there are no type or prerender errors.`,
  }),
  D({
    slug: "nextjs-route-handler", title: "Next.js: secure route handler / server action", category: "API", stacks: ["nextjs"], tags: ["nextjs", "api", "security"],
    summary: "Validated, authenticated mutation endpoint.",
    failureMode: "Server action trusts client input and skips auth because 'it's server code'.",
    body: `Create a [route handler / server action] that [mutation].
- Validate input with zod; return 400 with field errors on failure.
- Verify the user session on the server and check they own the resource.
- Return typed JSON (route handler) or a typed result object (server action).
- Revalidate affected paths/tags after mutation, using the APIs documented for this Next.js version.
- Add a test for success, validation error and unauthorised.`,
  }),
  D({
    slug: "supabase-rls-policy", title: "Supabase: write and test RLS policies", category: "Database", stacks: ["nextjs", "node"], tags: ["supabase", "postgres", "rls", "security"],
    summary: "Row Level Security that is actually tested.",
    failureMode: "RLS enabled but policies too broad, or service-role key used in the browser.",
    body: `Write Row Level Security for the [table] table.
Access rules: [e.g. users read/write their own rows; anyone reads rows where visibility = 'public'].
- Enable RLS and write one policy per operation (select/insert/update/delete) using auth.uid().
- Use column-level grants if some columns must not be user-editable.
- Write SQL tests that switch role (anon / authenticated with different user ids) and prove each rule, including a negative case per rule.
- Never use the service-role key in client code.`,
  }),
  D({
    slug: "write-agents-md", title: "Generate AGENTS.md from a repo", category: "Agent setup", tags: ["agents-md", "setup"],
    summary: "Have the agent draft its own instructions from real config files.",
    failureMode: "Instruction file full of generic advice that doesn't match the repo.",
    body: `Read this repository's config files (package.json/composer.json, lockfiles, CI config, test config, linters) and draft an AGENTS.md with:
- Stack and versions (from files, not guesses)
- Exact setup, dev, test, lint and build commands
- Folder structure summary
- Code-style rules evidenced by linters/config
- Testing expectations
- A "Never" list (destructive commands, secrets, editing generated files)
Mark anything you're unsure of with TODO. Keep it under 150 lines.`,
  }),
  D({
    slug: "plan-before-code", title: "Plan a feature before coding", category: "Planning", tags: ["planning", "architecture"],
    summary: "Implementation plan you approve before any edits.",
    failureMode: "Agent writes 600 lines before you notice it misunderstood the feature.",
    body: `Feature: [describe]
Acceptance criteria:
- [criterion 1]
- [criterion 2]

Do not write code yet. Produce:
1. Questions about anything ambiguous (max 5).
2. Files to create/modify, with one line on each change.
3. Data model / migration changes.
4. Test plan.
5. Risks and how you'll mitigate them.
Wait for my approval before implementing.`,
  }),
  D({
    slug: "commit-message", title: "Write a conventional commit message", category: "Git", tags: ["git", "commit"],
    summary: "Accurate commit message from the staged diff.",
    failureMode: "Vague messages like 'fix stuff' or messages describing changes that aren't in the diff.",
    body: `Write a commit message for the staged changes (git diff --staged).
- Format: Conventional Commits (type(scope): summary), summary under 72 characters, imperative mood.
- Body: what changed and why, wrapped at 72 characters.
- Mention breaking changes with BREAKING CHANGE: if any.
Only describe changes that are actually in the diff.`,
  }),
  D({
    slug: "dependency-upgrade", title: "Upgrade a dependency safely", category: "Maintenance", tags: ["upgrade", "dependencies"],
    summary: "Read the changelog, upgrade, fix, verify.",
    failureMode: "Bumps a major version and 'fixes' errors by disabling checks.",
    body: `Upgrade [package] from [current] to [target].
1. Read its changelog / upgrade guide and list breaking changes that affect this codebase (search for usages).
2. Upgrade and fix each affected usage.
3. Run the full test suite, type checker and build.
4. Do not disable lint rules, type checks or tests to make things pass.
Summarise what changed and anything that needs manual QA.`,
  }),
  D({
    slug: "performance-profile", title: "Investigate a slow page or endpoint", category: "Performance", tags: ["performance", "profiling"],
    summary: "Measure first, then optimise the real bottleneck.",
    failureMode: "Premature micro-optimisation without measuring.",
    body: `[Page/endpoint] is slow (~[time]). Investigate:
1. Measure: list how you will measure (query log, profiler, timing logs) and do it.
2. Identify the top bottleneck with evidence (queries, payload size, external calls, rendering).
3. Propose up to 3 fixes ranked by impact/effort.
4. Implement the top fix and show before/after measurements.
No speculative changes without measurements.`,
  }),
  D({
    slug: "sql-query-review", title: "Review and optimise a SQL query", category: "Database", tags: ["sql", "database", "performance"],
    summary: "EXPLAIN-driven query and index review.",
    failureMode: "Adds random indexes without checking the query plan.",
    body: `Optimise this query for [MySQL/PostgreSQL]:
"""
[paste query]
"""
Table sizes (approx): [rows]
Existing indexes: [paste or say unknown]

1. Explain what the query does.
2. Ask me for EXPLAIN / EXPLAIN ANALYZE output if you need it rather than guessing.
3. Suggest index or query changes with the reasoning and trade-offs (write cost, storage).
4. Provide the migration for any index.`,
  }),
];
