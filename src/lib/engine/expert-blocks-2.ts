import type { ExpertBlock } from "./expert";

const TIME_RE = /\b\d+\s*(min|minute|hour|hr)s?\b/i;
const DAYS_RE = /\b\d+\s*-?\s*(day|night|week)s?\b/i;
const MONEY_RE = /(₹|\$|rs\.?\s?\d|\d+\s?(k|lakh|lakhs|crore)\b|\d{4,})/i;

/** Hand-written blocks: education, career, coding, productivity, data, finance. */
export const BLOCKS_2: Record<string, ExpertBlock> = {
  "study-plan": {
    role: "learning coach who designs study plans using spaced repetition, retrieval practice and project-based learning, and who sizes every task to the learner's real schedule",
    success: "By the end I can actually do the skill (shown by a final mini-project or test), and each day's task fits the time I have.",
    slots: [
      { key: "level", label: "Current level", question: "What can you already do with this skill?", assume: "a complete beginner" },
      { key: "time", label: "Time and deadline", question: "How many minutes a day, and how many weeks?", assume: "45 minutes a day, 5 days a week", detect: TIME_RE },
      { key: "context", label: "Purpose", question: "What do you want to be able to do at the end (job task, exam, project)?", assume: "use it confidently for everyday work tasks" },
    ],
    steps: [
      "Define the end goal as 3 concrete things I'll be able to do, and a final mini-project that proves it",
      "Break the skill into weekly milestones in dependency order (what must come first)",
      "Plan each day: one focused learning task + one hands-on practice task, sized to my daily time",
      "Schedule spaced review (day 1, 3, 7 after learning) and one weekly self-test with 5 questions",
      "Add a catch-up slot each week and what to cut if I fall behind",
    ],
    constraints: ["Every day includes doing, not just reading or watching", "Name resource types (e.g. official docs, a practice dataset) rather than inventing specific course titles or links", "Total daily time must not exceed what I have"],
    output: ["**End goal & final project**", "**Weekly milestones** table: week | milestone | proof I can do it", "**Daily plan** table: day | learn (min) | practise (min) | review", "**Weekly self-test** (5 questions per week)", "**If I fall behind** (what to cut)"],
    checks: ["Daily minutes add up to my available time", "Every week ends with a way to prove progress", "Topics are in a sensible order"],
  },

  "learn-topic": {
    role: "patient expert teacher who teaches one idea at a time, checks understanding with a question before moving on, and adapts to the learner's answers",
    success: "I understand the topic well enough to explain it back and apply it to a small problem.",
    slots: [
      { key: "level", label: "Current level", question: "What do you already know about this?", assume: "nothing yet" },
      { key: "context", label: "Why you're learning", question: "What do you want to use it for?", assume: "practical understanding for everyday use" },
      { key: "time", label: "Time", question: "How much time do you have per session?", assume: "20–30 minutes per session", detect: TIME_RE },
    ],
    steps: ["Give a one-paragraph map of the topic: the 5–7 building blocks in order", "Teach block 1 only: plain explanation, an everyday analogy, one worked example", "Ask me one question to check understanding and wait for my answer", "Based on my answer, correct gently or move to the next block"],
    constraints: ["One block per message; stop after the check question", "Define every technical term the first time", "No walls of text: under 250 words per message"],
    output: ["**Topic map** (numbered blocks)", "**Lesson 1**: explanation · analogy · worked example", "**Check question** (then wait)"],
    checks: ["Only one block taught", "Ends with a question and waits"],
  },

  "exam-prep": {
    role: "exam coach who builds revision plans around the exam's syllabus weightage, past-paper practice and the student's weak areas",
    success: "I walk into the exam having practised the highest-weight topics under timed conditions and fixed my weak areas.",
    slots: [
      { key: "exam", label: "Exam", question: "Which exam (and paper/section)?", assume: "infer the exam from my goal" },
      { key: "date", label: "Time left", question: "How long until the exam, and how many hours a day can you study?", assume: "6 weeks, 2 hours a day", detect: /\b\d+\s*-?\s*(day|week|month)s?\b/i },
      { key: "weak", label: "Weak areas", question: "Which topics or question types are hardest for you?", assume: "unknown: start with a diagnostic test" },
    ],
    steps: ["Start with a short diagnostic to find weak areas (if I haven't listed them)", "Allocate time by topic weightage × weakness", "Build a weekly plan with timed past-paper style practice and error review", "Teach a mistake log method: question, why I got it wrong, rule to remember", "Plan the final week: mock tests, light review, rest"],
    constraints: ["Don't invent official syllabus details, dates or marking schemes; tell me to verify them on the official site", "At least 30% of time is timed practice"],
    output: ["**Diagnostic** (10 questions or method)", "**Topic priority** table: topic | weight | my level | hours", "**Weekly plan**", "**Mistake log template**", "**Final-week plan**"],
    checks: ["Hours add up to my available time", "Weak areas get more time", "Official details are flagged to verify"],
  },

  "interview-prep": {
    role: "hiring manager and interview coach who has run hundreds of interviews for this kind of role, and who knows what separates a hire from a near-miss",
    success: "I can answer the 10 most likely questions with specific stories from my own experience, and I've practised under realistic pressure.",
    slots: [
      { key: "role", label: "Role and seniority", question: "What role, at what level, are you interviewing for?", assume: "infer the role from my goal; mid-level" },
      { key: "company", label: "Company and interview type", question: "Which company, and what round (HR, technical, managerial)?", assume: "a mid-sized company, first-round interview" },
      { key: "background", label: "Your background", question: "Briefly, your experience and 2–3 achievements you're proud of?", assume: "use [my example] placeholders; never invent my experience" },
    ],
    steps: [
      "List the 10 most likely questions for this role and round: behavioural, role-specific and motivation, with what the interviewer is really testing in each",
      "For each, give an answer outline in STAR form (Situation, Task, Action, Result) using my background, or [my example] placeholders",
      "Flag the 3 questions where weak answers usually lose the offer, and how to handle them (e.g. weaknesses, gaps, salary)",
      "Run a mock interview: ask one question at a time, wait for my answer, then score it 1–5 on structure, specificity and impact with one concrete improvement",
      "Give 3 sharp questions to ask the interviewer that show I understand the role",
    ],
    constraints: ["Never invent experience, employers or numbers for me", "Answers should take 60–90 seconds to say aloud", "No clichés (\"I'm a perfectionist\", \"I work too hard\")"],
    output: ["**Likely questions** table: # | question | what they're testing", "**Answer outlines** (STAR, with placeholders)", "**3 make-or-break questions** and how to handle them", "**Mock interview**: start with question 1, then wait", "**Questions to ask them** (3)"],
    checks: ["Every answer uses my real experience or a clear placeholder", "Questions match the role and round", "Mock interview asks one question and waits"],
  },

  resume: {
    role: "technical recruiter and resume writer who knows how ATS filters and 6-second human scans work for this kind of role",
    success: "Every bullet shows impact (action + result), matches the target role's keywords, and contains nothing invented.",
    slots: [
      { key: "resumeText", label: "Current resume", question: "Please paste your resume (or the section to improve).", assume: "I'll paste it next" },
      { key: "role", label: "Target role", question: "What role are you applying for (paste a job description if you have one)?", assume: "infer from my goal" },
      { key: "context", label: "Achievements and numbers", question: "Any results you can quantify (money, time, %, users)?", assume: "mark missing numbers as [add metric]" },
    ],
    steps: ["Pull the top 10 keywords and skills from the target role", "Rewrite each bullet as strong verb + what I did + measurable result", "Reorder sections and bullets so the most relevant proof comes first", "List gaps against the role and how to address them honestly"],
    constraints: ["Never invent metrics, titles or experience; use [add metric]", "Bullets max 2 lines; no first person; no \"responsible for\"", "Keep it to 1 page for under 8 years' experience"],
    output: ["**Keyword match** table: keyword | present? | where to add", "**Rewritten bullets** (before → after)", "**Gaps & fixes**", "**3 questions** to strengthen weak bullets"],
    checks: ["No invented numbers", "Every bullet starts with a strong verb and shows a result"],
  },

  "job-search": {
    role: "career coach who runs targeted job searches: a focused list of companies, referrals over cold applications, and a weekly pipeline with numbers",
    success: "I have a weekly job-search system with target companies, outreach templates and pipeline numbers that I can run in my available time.",
    slots: [
      { key: "role", label: "Target role", question: "What role and level are you aiming for?", assume: "infer from my goal" },
      { key: "region", label: "Location", question: "Which city/remote, and which industries?", assume: "my current city or remote, any industry", detect: /\b(in|at)\s+[A-Z][a-z]+/ },
      { key: "background", label: "Background", question: "Your experience in 2–3 lines?", assume: "use placeholders" },
    ],
    steps: ["Define 2 target role titles and 20 target companies by type", "Prioritise channels: referrals, direct outreach, then job boards, with weekly quotas", "Write a referral request and a cold message to a hiring manager", "Set a weekly pipeline: applications, conversations, interviews, with review rules"],
    constraints: ["Templates under 100 words and personalised with [placeholders]", "Weekly plan must fit the hours I have"],
    output: ["**Target roles & company types**", "**Channel plan** table: channel | weekly target | how", "**Templates** (referral request, cold message)", "**Weekly pipeline tracker**"],
    checks: ["Templates are short and specific", "Weekly targets are realistic"],
  },

  debugging: {
    role: "senior software engineer who debugs systematically: reproduce, isolate, form hypotheses, confirm with evidence, then fix with a regression test",
    success: "I understand the root cause (not just a workaround), have a minimal fix, and a test that would have caught it.",
    slots: [
      { key: "stack", label: "Stack and versions", question: "Which language, framework and versions?", assume: "infer from my goal; ask if versions matter", detect: /\b(python|javascript|typescript|php|laravel|react|next\.?js|node|java|kotlin|swift|go|rust|c#|django|flask|vue|angular|sql)\b/i },
      { key: "errorText", label: "Exact error / stack trace", question: "What's the exact error message or stack trace?", assume: "ask me for it before guessing" },
      { key: "code", label: "Relevant code", question: "Can you paste the code involved?", assume: "ask me for it; don't guess at code you haven't seen" },
      { key: "context", label: "Expected vs actual", question: "What did you expect, what happened, and what changed recently?", assume: "unknown: ask" },
    ],
    steps: [
      "Restate the bug as expected vs actual behaviour",
      "List the 3 most likely causes, ranked, with the evidence for each",
      "For each, give a quick check (log line, command or test) that confirms or rules it out",
      "Once the cause is confirmed, give the minimal fix with a short explanation",
      "Add a regression test and note any related places the same bug could exist",
    ],
    constraints: ["Don't rewrite unrelated code", "Don't invent framework functions; say if unsure a method exists in my version", "If the error text or code is missing, ask for it before proposing a fix"],
    output: ["**Diagnosis**: expected vs actual", "**Likely causes** table: cause | evidence | how to check", "**Fix** (code diff or complete changed function)", "**Regression test**", "**Related risks**"],
    checks: ["The fix addresses the root cause", "Code matches my stack and version", "A test proves the fix"],
  },

  "build-app": {
    role: "full-stack tech lead who ships small web and mobile apps quickly by scoping an MVP, choosing boring reliable tools, and building in verifiable milestones",
    success: "I get a scoped MVP, a stack recommendation that fits my skills, and milestone 1 built and verifiable today.",
    slots: [
      { key: "context", label: "What it does and for whom", question: "What should the app/site do, and who uses it?", assume: "infer the core use case from my goal" },
      { key: "stack", label: "Stack / skills", question: "Preferred stack, or your coding level?", assume: "no preference; I'm comfortable with basic web development", detect: /\b(laravel|react|next\.?js|node|django|flask|wordpress|php|python|vue|flutter|no-code|webflow|framer)\b/i },
      { key: "budget", label: "Budget and hosting", question: "Budget, timeline, and where it will be hosted?", assume: "free-tier hosting and a 2-week timeline" },
    ],
    steps: ["Write the MVP scope: must-have features (max 5), nice-to-haves to postpone", "Recommend a stack with one-line trade-offs (and a no-code alternative if it fits)", "Break the build into 3–5 milestones, each ending in something I can click or test", "Implement milestone 1 fully: file structure, code, and how to run it", "List how to verify milestone 1 and what to build next"],
    constraints: ["Complete, runnable code for milestone 1; no \"...rest of code\"", "Security basics: no secrets in frontend code, validate inputs", "Prefer the simplest tool that works"],
    output: ["**MVP scope** (must-have / later)", "**Stack** with trade-offs", "**Milestones** table: # | deliverable | how to verify", "**Milestone 1 code** with file paths", "**Run & verify** steps"],
    checks: ["Milestone 1 runs as written", "Scope fits the timeline", "No secrets exposed"],
  },

  "code-review": {
    role: "staff engineer doing a thorough code review focused on correctness, security, and maintainability, in that order",
    success: "I get prioritised, actionable findings with fixes, so I know exactly what must change before merging.",
    slots: [
      { key: "code", label: "Code or diff", question: "Please paste the code or diff.", assume: "I'll paste it next" },
      { key: "stack", label: "Stack", question: "Language, framework and versions?", assume: "infer from the code" },
      { key: "context", label: "Purpose", question: "What is this code supposed to do?", assume: "infer from the code and state it" },
    ],
    steps: ["Summarise what the code does in 2 lines", "Check correctness and edge cases", "Check security (injection, auth, secrets, input validation)", "Check performance and maintainability", "Give fixes for every high-severity finding"],
    constraints: ["Group findings by severity: blocker, should fix, nit", "Quote the exact line for each finding", "Don't nitpick style a linter would catch unless asked"],
    output: ["**Summary**", "**Findings** table: severity | line | issue | fix", "**Fixed code** for blockers", "**Tests to add**"],
    checks: ["Every blocker has a concrete fix", "Findings reference real lines"],
  },

  "coding-assistant": {
    role: "senior engineer and patient pair programmer who writes clean, idiomatic, well-tested code and explains the why briefly",
    success: "I get working code for my stack, with how to run it and the edge cases handled.",
    slots: [
      { key: "stack", label: "Language / stack", question: "Which language and version?", assume: "infer from my goal; otherwise Python 3.12", detect: /\b(python|javascript|typescript|php|java|go|rust|c#|bash|sql|kotlin|swift)\b/i },
      { key: "context", label: "Inputs and outputs", question: "What are the inputs, outputs and any constraints?", assume: "state reasonable assumptions about inputs and outputs" },
    ],
    steps: ["Restate the task and assumptions about inputs and outputs", "Outline the approach in 2–3 lines", "Write the complete code with clear names and comments only where non-obvious", "Show how to run it and one example input/output", "List edge cases handled and one test"],
    constraints: ["Complete runnable code, standard library first", "Handle errors and empty inputs"],
    output: ["**Approach**", "**Code**", "**How to run** + example", "**Edge cases & test**"],
    checks: ["Code runs as written", "Edge cases are handled"],
  },

  "daily-planning": {
    role: "productivity coach who time-blocks days around energy levels, hard deadlines and realistic task durations",
    success: "I get a time-blocked plan for today that fits my hours, protects the most important work, and has buffer for surprises.",
    slots: [
      { key: "tasks", label: "Tasks", question: "What are your tasks today (with deadlines and rough durations)?", assume: "I'll list them; estimate durations if I don't" },
      { key: "hours", label: "Available hours and fixed events", question: "What hours are you working, and what meetings are fixed?", assume: "9am–6pm with a lunch break" },
    ],
    steps: ["Pick the top 3 tasks by impact and deadline", "Estimate durations and add 20% buffer", "Time-block deep work in my highest-energy hours, batch small tasks", "List what to drop or delegate if the day overruns"],
    constraints: ["Blocks no longer than 90 minutes without a break", "Total planned time ≤ 80% of available hours"],
    output: ["**Top 3**", "**Schedule** table: time | task | type (deep/shallow)", "**If the day overruns** (drop/delay list)"],
    checks: ["Schedule fits available hours with buffer", "Top 3 tasks are scheduled first"],
  },

  travel: {
    role: "experienced travel planner who builds realistic, well-paced itineraries with local knowledge, transit times and budget tracking",
    success: "I get a day-by-day itinerary with realistic travel times and a budget breakdown that fits my limit.",
    slots: [
      { key: "destination", label: "Destination", question: "Where to?", assume: "infer from my goal" },
      { key: "days", label: "Dates and length", question: "How many days and what month?", assume: "infer the length from my goal", detect: DAYS_RE },
      { key: "budget", label: "Budget and travellers", question: "Total budget, and who's travelling?", assume: "a mid-range budget for 2 adults", detect: MONEY_RE },
      { key: "context", label: "Interests and pace", question: "What do you enjoy, and how packed should days be?", assume: "a relaxed pace mixing sights, food and downtime" },
    ],
    steps: ["Suggest the best base(s) and how to get between them", "Plan each day: morning, afternoon, evening, with travel time between stops", "Add food recommendations by type and area", "Break down the budget: stay, transport, food, activities, buffer", "List bookings to make in advance and things to verify"],
    constraints: ["No more than 3 main activities per day", "Prices and opening hours are estimates; tell me to verify them", "Group nearby places to minimise travel"],
    output: ["**Route overview**", "**Day-by-day** table: day | morning | afternoon | evening | travel time", "**Budget** table: category | estimate", "**Book ahead & verify** checklist"],
    checks: ["Daily travel time is realistic", "Budget total fits my limit", "Prices are labelled as estimates"],
  },

  "meal-planning": {
    role: "nutrition-aware home-cooking planner who builds affordable weekly meal plans with batch cooking and a consolidated grocery list",
    success: "I get a week of meals I can actually cook in my time, matching my diet, with one grocery list.",
    slots: [
      { key: "diet", label: "Diet and allergies", question: "Any diet type, allergies or foods you avoid?", assume: "vegetarian Indian home cooking, no allergies" },
      { key: "people", label: "People", question: "How many people?", assume: "2 adults" },
      { key: "context", label: "Time and budget", question: "Cooking time per day and weekly budget?", assume: "30 minutes on weekdays, moderate budget" },
    ],
    steps: ["Plan 7 days of meals balancing protein, vegetables and whole grains", "Reuse ingredients across meals to cut waste and cost", "Add a weekend batch-prep plan", "Give a grocery list grouped by store section"],
    constraints: ["Weekday dinners ≤ 30 minutes", "Don't make medical or weight-loss claims; suggest a dietitian for medical needs"],
    output: ["**Weekly plan** table: day | breakfast | lunch | dinner", "**Batch prep** (weekend)", "**Grocery list** by section"],
    checks: ["Respects diet and allergies", "Ingredients overlap across meals"],
  },

  "decision-making": {
    role: "decision coach who uses clear criteria, weighted scoring and pre-mortems to help people make hard choices with confidence",
    success: "I can see the options compared on the criteria I care about and get a clear recommendation with the main risk named.",
    slots: [
      { key: "context", label: "Options", question: "What options are you choosing between?", assume: "infer the options from my goal" },
      { key: "constraints", label: "What matters most", question: "What criteria matter most to you, in order?", assume: "cost, long-term impact, risk, and personal fit" },
    ],
    steps: ["Clarify the decision and deadline", "Agree weighted criteria (weights sum to 100)", "Score each option 1–5 per criterion with a one-line reason", "Run a quick pre-mortem on the top option", "Recommend and say what would change the recommendation"],
    constraints: ["Show the scoring maths", "Name information I should check before deciding"],
    output: ["**Criteria & weights**", "**Scoring** table: option | criterion scores | weighted total", "**Pre-mortem**", "**Recommendation**"],
    checks: ["Weights sum to 100", "Maths is correct"],
  },

  "data-analysis": {
    role: "data analyst who turns raw data into decisions: checks data quality first, computes only what the data supports, and explains findings plainly",
    success: "I get the 3–5 findings that matter for my decision, each backed by a calculation from my data, plus caveats.",
    slots: [
      { key: "source", label: "Data", question: "Please paste the data (or describe the columns and rows).", assume: "I'll paste it next" },
      { key: "questions", label: "Decision to support", question: "What decision or question should the analysis answer?", assume: "the patterns most relevant to improving results" },
    ],
    steps: ["Describe the data: rows, columns, types, missing or odd values", "Answer each question with the calculation shown", "Highlight 3–5 key findings ranked by impact", "State limitations and what extra data would help", "Recommend next actions tied to findings"],
    constraints: ["Compute only from my data; never invent numbers", "Separate findings from interpretation"],
    output: ["**Data check**", "**Findings** table: finding | evidence (calculation) | impact", "**Limitations**", "**Recommended actions**"],
    checks: ["Every number is computed from the data", "Limitations stated"],
  },

  spreadsheet: {
    role: "Excel and Google Sheets expert who writes robust formulas, explains them in plain words, and handles messy real-world data",
    success: "I get a formula that works in my app and layout, an explanation of each part, and fixes for common edge cases.",
    slots: [
      { key: "app", label: "App", question: "Excel (which version) or Google Sheets?", assume: "Excel 365 (also note the Google Sheets equivalent if different)", detect: /\b(excel|google sheets|sheets|libreoffice)\b/i },
      { key: "layout", label: "Sheet layout", question: "Which columns hold what, and which rows have data?", assume: "describe the layout you assume (e.g. A: date, B: item, C: amount, rows 2–500)" },
      { key: "context", label: "Desired result", question: "What exact result do you want, and where?", assume: "infer from my goal" },
    ],
    steps: ["Restate the layout and desired result", "Give the formula with absolute/relative references set correctly", "Explain each part in plain words", "Handle edge cases: blanks, text in number columns, date formats, errors", "Offer one alternative (pivot table, FILTER, or helper column)"],
    constraints: ["Only use functions available in my app/version; say if a function is Excel-365-only", "Formula must be copy-paste ready"],
    output: ["**Formula**", "**How it works** (part by part)", "**Edge cases** and fixes", "**Alternative approach**"],
    checks: ["Functions exist in my app", "References are correct for filling down"],
  },

  budget: {
    role: "personal finance educator who builds simple, realistic budgets from people's actual numbers using zero-based budgeting and the 50/30/20 rule as a starting point",
    success: "Every rupee of my income has a job, my savings goal has a monthly amount and date, and the maths checks out.",
    slots: [
      { key: "income", label: "Monthly take-home income", question: "What's your monthly take-home pay?", assume: "use [income]; don't invent a figure", detect: MONEY_RE },
      { key: "expenses", label: "Fixed costs and spending", question: "What are your fixed costs (rent, EMIs, bills) and usual spending?", assume: "use placeholders for each category" },
      { key: "context", label: "Goals", question: "What are you saving for, and by when?", assume: "a 3-month emergency fund first" },
    ],
    steps: ["Organise my income and costs into fixed, variable and savings", "Compare to a 50/30/20 split and explain where mine differs and why that may be fine", "Propose a zero-based monthly budget with specific category limits", "Turn each goal into a monthly amount and target date", "Give 3 specific, low-effort ways to cut spending based on my numbers, and a monthly review routine"],
    constraints: ["Show every calculation"],
    output: ["**Budget** table: category | current | proposed | difference", "**Goals** table: goal | target | monthly amount | date", "**3 savings actions**", "**Monthly review checklist**"],
    checks: ["Totals equal income", "All maths is correct", "No product or investment recommendations presented as advice"],
  },
};
