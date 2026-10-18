import type { ExpertBlock } from "./expert";

/** Hand-written blocks: social, business, writing. */
export const BLOCKS_1: Record<string, ExpertBlock> = {
  "instagram-growth": {
    role: "Instagram growth strategist who has grown creator and small-business accounts with Reels, carousels and community engagement, and who decides what to post next from Insights data (reach, saves, shares, profile visits)",
    success: "I end up with a 30-day plan I can start today: Reel ideas with hooks I can film on a phone, a schedule that fits my time, and 3 metrics with targets to review weekly.",
    slots: [
      { key: "niche", label: "Niche and ideal follower", question: "What's your niche, and who exactly do you want to reach?", assume: "infer the niche from my goal; name the ideal follower" },
      { key: "current", label: "Current stats", question: "How many followers do you have, how often do you post, and which posts did best?", assume: "under 1,000 followers, posting 1–2 times a week with no clear format" },
      { key: "timePerWeek", label: "Time and tools", question: "How many hours a week can you spend, and do you film on a phone?", assume: "about 4 hours a week, phone only, no editor" },
      { key: "context", label: "What growth is for", question: "What should growth lead to: sales, clients, brand deals or community?", assume: "followers who become customers or clients" },
    ],
    steps: [
      "Audience snapshot: my ideal follower in 3 lines: who they are, what they want from my niche, and what makes them stop scrolling",
      "Pick 3 content pillars that serve that follower and my strengths; for each, say whether it earns saves, shares or follows, and why",
      "Write 10 Reel ideas mixing formats (tutorial, myth vs fact, before/after, behind the scenes, POV). For each: on-screen hook for the first 2 seconds, 3–5 beat shot list, caption CTA",
      "Build a 4-week calendar that fits my weekly time, with filming batched into 1–2 sessions",
      "Give a 15-minute daily engagement routine with specific actions (reply to comments within the hour, 5 thoughtful comments on niche accounts, DM replies)",
      "Set baseline and 30-day targets for reach, saves, shares and profile visits, and what to change if each one stalls",
    ],
    constraints: [
      "Hooks: under 10 words, specific to my niche; no \"You won't believe…\", \"Wait for it\" or \"Nobody talks about this\"",
      "Every Reel can be filmed on a phone in under 30 minutes",
      "No buying followers, engagement pods, follow/unfollow or hashtag-stuffing tactics",
      "Targets are goals to track, not promises",
    ],
    output: [
      "**Assumptions** (one line I can correct)",
      "**Audience snapshot** (3 bullets)",
      "**Content pillars** table: pillar | earns (saves/shares/follows) | example post",
      "**10 Reel ideas** table: # | hook (on-screen text) | beats | format | CTA",
      "**4-week calendar** table: week | posts by day | filming session",
      "**Daily engagement routine** (checklist, 15 min)",
      "**Metrics** table: metric | baseline | 30-day target | if it stalls",
    ],
    checks: ["Every hook is niche-specific and under 10 words", "The calendar fits my weekly hours", "No vague advice (\"be consistent\", \"post quality content\") without a concrete action", "Nothing promises follower numbers"],
  },

  "captions-hooks": {
    role: "direct-response copywriter specialising in short-form social captions, who writes hooks that earn the second line and CTAs that get comments and saves",
    success: "I get several distinct, ready-to-post options I can pick from, each with a hook that would stop my audience mid-scroll.",
    slots: [
      { key: "post", label: "What the post shows", question: "What does the post or Reel show, and what's the one takeaway?", assume: "infer it from my goal" },
      { key: "platform", label: "Platform", question: "Which platform?", assume: "Instagram" },
      { key: "audience", label: "Audience", question: "Who is the post for?", assume: "people interested in my niche who don't know me yet" },
      { key: "tone", label: "Voice", question: "What's your brand voice?", assume: "friendly, direct and confident" },
    ],
    steps: [
      "Identify the one takeaway and the audience's main desire or pain behind it",
      "Write 5 hooks using different angles: specific number, mistake to avoid, contrarian take, mini-story, direct question",
      "Write 3 full captions (short / medium / story-led) built on the best hooks, each ending with one clear CTA",
      "Add a focused hashtag set: 3 broad, 5 niche, 2 branded or local",
    ],
    constraints: ["Hooks under 12 words; first line must make sense without the video", "No clichés (\"game-changer\", \"level up\", \"Here's the thing\") and no more than 2 emojis per caption", "One CTA per caption (comment, save, share or DM), not several"],
    output: ["**5 hooks** table: angle | hook", "**3 captions** (short ≤40 words, medium ≤90, story ≤150)", "**Hashtags** (10, grouped)"],
    checks: ["Each hook uses a different angle", "Word limits are respected", "Captions sound like a person, not an ad"],
  },

  youtube: {
    role: "YouTube strategist and scriptwriter who plans videos around search and browse demand, packages them with titles and thumbnails that earn clicks honestly, and writes for audience retention",
    success: "I get a video I can film this week: a validated angle, a title and thumbnail concept, and a retention-focused outline with the first 30 seconds fully scripted.",
    slots: [
      { key: "niche", label: "Channel niche", question: "What's your channel about and who watches it?", assume: "infer the niche from my goal" },
      { key: "length", label: "Video length", question: "Long-form or Shorts, and roughly how long?", assume: "an 8–10 minute long-form video" },
      { key: "current", label: "Channel size", question: "How many subscribers and typical views do you have?", assume: "a small channel (under 1,000 subscribers)" },
    ],
    steps: [
      "Give 5 angles for the topic and pick the strongest, saying what search or curiosity it answers",
      "Write 5 title options (under 60 characters) and 2 thumbnail concepts (focal image, 3-word max text, emotion)",
      "Script the hook (first 30 seconds) word for word: promise, stakes, and why to keep watching",
      "Outline the body as chapters with a re-hook every 60–90 seconds",
      "End with a CTA tied to the next video, not a generic \"like and subscribe\"",
    ],
    constraints: ["The title and thumbnail must promise only what the video delivers", "No filler intros (\"Hey guys, welcome back\"); the value starts in the first 5 seconds", "Thumbnail text: 3 words max"],
    output: ["**Chosen angle** (with 4 alternatives, one line each)", "**Titles** (5) and **thumbnail concepts** (2)", "**Hook script** (first 30 s, word for word)", "**Outline** table: timestamp | chapter | key point | re-hook", "**End screen CTA**"],
    checks: ["The hook delivers on the title within 30 seconds", "Every chapter has a reason to keep watching", "Titles are under 60 characters"],
  },

  linkedin: {
    role: "LinkedIn ghostwriter for professionals and founders, who writes posts that earn dwell time and meaningful comments from the right audience, not engagement bait",
    success: "I get a post that sounds like me, delivers one clear insight from my experience, and invites thoughtful comments from people I want to reach.",
    slots: [
      { key: "context", label: "Your experience or story", question: "What specific experience, result or lesson is this post based on?", assume: "use [placeholders] where my real story, numbers or names should go" },
      { key: "audience", label: "Who you want to reach", question: "Who should read this (recruiters, clients, peers)?", assume: "peers and potential clients in my industry" },
      { key: "tone", label: "Voice", question: "How do you usually sound?", assume: "warm, specific, and modest" },
    ],
    steps: ["Pull out the one insight worth sharing and who it helps", "Write 3 opening lines (under 15 words) that create curiosity without clickbait", "Write the post: hook, short story or context, the insight, 2–3 practical takeaways, a question that invites real replies", "Give a shorter variant under 600 characters"],
    constraints: ["Short paragraphs (1–2 lines); no walls of text", "No \"Agree?\", \"I'm humbled to announce\", or broetry one-word lines", "Never invent results, clients or numbers; use [placeholders]"],
    output: ["**3 opening lines**", "**Full post** (900–1,300 characters)", "**Short variant** (under 600 characters)", "**First comment** to add context or a link"],
    checks: ["One clear insight, not three", "The closing question is specific enough to answer", "Nothing about me is invented"],
  },

  "blog-newsletter": {
    role: "editor and SEO content strategist who writes articles that answer the reader's real question better than the current top results, with original structure and examples",
    success: "I get an article that fully answers the reader's question, is easy to skim, and is ready to publish after I add my own examples.",
    slots: [
      { key: "keyword", label: "Topic / keyword", question: "What's the main topic or search phrase?", assume: "derive the main search phrase from my goal" },
      { key: "audience", label: "Reader", question: "Who's reading and what do they already know?", assume: "a curious beginner" },
      { key: "length", label: "Length", question: "How long should it be?", assume: "about 1,200 words" },
    ],
    steps: ["State the reader's real question and what would make them stop searching", "Propose 3 headlines and pick one", "Outline with H2/H3 headings that follow the reader's questions in order", "Write the article with a concrete example, step or checklist in every section", "Add a meta description (under 155 characters) and 3 internal-link ideas"],
    constraints: ["Open with the answer, not background; no \"In today's world…\" intros", "Every section includes something concrete: a step, example, number I provided, or checklist", "Mark any fact that needs a source as [verify]"],
    output: ["**Headline** (+2 alternatives)", "**Outline** (H2/H3)", "**Article** in markdown", "**Meta description** and **internal-link ideas**"],
    checks: ["The first paragraph answers the question", "No section is generic filler", "Length is within ±10% of the target"],
  },

  "startup-validation": {
    role: "lean startup coach who has run hundreds of customer-discovery interviews and cheap validation experiments, and who cares about evidence (pre-orders, deposits, repeat use) over opinions",
    success: "Within two weeks and a small budget, I'll know whether real customers want this, based on pass/fail criteria I set before running each test.",
    slots: [
      { key: "product", label: "The idea", question: "What exactly would you sell, to whom, and at what price?", assume: "infer the offer from my goal and state a likely price point" },
      { key: "region", label: "Market", question: "Where will you sell (city, online, both)?", assume: "one city in India, starting locally", detect: /\b(in|at)\s+[A-Z][a-z]+/ },
      { key: "budget", label: "Validation budget", question: "How much money and time can you spend testing?", assume: "under ₹10,000 and 10 hours a week for 2 weeks", detect: /(₹|\$|rs\.?\s?\d|\d+\s?(k|lakh))/i },
    ],
    steps: [
      "Write the idea as a one-line hypothesis: [customer] has [problem] and will pay [price] for [solution]",
      "List the assumptions behind it (customer, problem, willingness to pay, channel, delivery cost) and rank them by risk × uncertainty",
      "For the top 3 risks, design one experiment each (e.g. landing page with pre-orders, WhatsApp group with a deposit, 10-customer concierge trial), with cost, time, and pass/fail thresholds set in advance",
      "Write a 10-question customer interview script about past behaviour, not hypotheticals (Mom Test style)",
      "Give a decision rule: what results mean go, pivot or stop",
    ],
    constraints: ["Count commitments (money, deposits, sign-ups with phone numbers), not compliments", "Interview questions ask about past behaviour and current spending, never \"Would you buy…?\"", "Thresholds must be numbers decided before the test"],
    output: ["**Hypothesis** (1 line)", "**Assumption map** table: assumption | risk (H/M/L) | evidence I have", "**3 experiments** table: test | cost | duration | pass threshold | fail threshold", "**Interview script** (10 questions)", "**Decision rule** (go / pivot / stop)"],
    checks: ["Every experiment has a numeric pass/fail threshold", "No interview question is hypothetical or leading", "Total cost fits my budget"],
  },

  marketing: {
    role: "growth marketer for small businesses with limited budgets, who picks 1–2 channels, sets measurable targets, and kills what doesn't work after a fixed test window",
    success: "I get a focused 30-day marketing plan with specific actions, budget split, and numbers to judge success.",
    slots: [
      { key: "product", label: "Product and price", question: "What do you sell and at what price?", assume: "infer from my goal" },
      AUDIENCE_SLOT("Ideal customer", "Who buys it, and why do they choose you?", "local customers aged 25–45 who value convenience"),
      { key: "budget", label: "Budget", question: "What's your monthly marketing budget?", assume: "under ₹15,000 a month", detect: /(₹|\$|rs\.?\s?\d|\d+\s?(k|lakh))/i },
    ],
    steps: ["Define the ideal customer and the one message that matters most to them", "Pick the 2 best channels for this customer and budget, with reasons (and 2 to ignore for now)", "Plan a 30-day calendar of specific actions per channel", "Split the budget with expected cost per lead or sale as a labelled estimate", "Define weekly metrics and a stop/scale rule"],
    constraints: ["No invented benchmarks; label every estimate", "Each action is specific (what, where, how often), not \"post regularly\""],
    output: ["**Positioning** (customer, problem, message)", "**Channels** table: channel | why | weekly actions", "**30-day calendar**", "**Budget split** table", "**Metrics & stop/scale rules**"],
    checks: ["Budget adds up", "Every action can be done by one person", "Targets are measurable"],
  },

  email: {
    role: "senior communications coach who writes clear, warm, persuasive emails that get a yes on the first read",
    success: "The reader understands what I need in the first two lines and can reply yes with one sentence.",
    slots: [
      { key: "recipient", label: "Recipient and relationship", question: "Who's it to, and what's your relationship (manager, client, professor)?", assume: "my manager, a professional but friendly relationship" },
      { key: "context", label: "Key facts", question: "What are the facts: dates, reason, what's already done, what you're offering?", assume: "use [placeholders] for dates, reasons and specifics" },
      { key: "tone", label: "Tone", question: "What tone fits (polite, warm, firm)?", assume: "polite and confident, not apologetic" },
    ],
    steps: ["Identify the single ask and what the reader needs to say yes (reason, impact, plan)", "Write a specific subject line that states the ask", "Open with the ask in the first two lines, then the reason in one sentence", "Show the plan or offer that reduces the reader's effort or risk", "Close with one clear question or next step and a date"],
    constraints: ["Under 150 words; paragraphs of 1–3 sentences", "No \"I hope this email finds you well\", over-apologising, or \"Please do the needful\"", "Use [placeholders] for any fact I haven't given"],
    output: ["**Subject line** (+1 alternative)", "**Email**", "**Short chat/WhatsApp version** (under 50 words)"],
    checks: ["The ask is in the first two lines", "Under 150 words", "Reader can reply with one sentence"],
  },

  "cover-letter": {
    role: "recruiter turned career writer who has screened thousands of applications and knows what makes a hiring manager keep reading",
    success: "The letter connects my 2–3 most relevant achievements to the job's top requirements in under 300 words, and sounds like a person.",
    slots: [
      { key: "job", label: "Job description", question: "Can you paste the job description (or its key requirements)?", assume: "I'll paste it; until then, use [requirement] placeholders" },
      { key: "experience", label: "Your relevant experience", question: "What are your 2–3 most relevant achievements, with numbers if you have them?", assume: "use [achievement + result] placeholders; never invent" },
      { key: "context", label: "Why this company", question: "Why do you want this company specifically?", assume: "use a [specific reason] placeholder" },
    ],
    steps: ["Extract the top 3 requirements from the job description", "Match each to one of my achievements (or flag a gap)", "Write an opening that names the role and a specific reason for this company", "Write 2 short proof paragraphs: requirement → what I did → result", "Close with a confident, specific next step"],
    constraints: ["Under 300 words", "No \"I am writing to express my interest\" or \"I believe I would be a great fit\"", "Never invent experience, employers or metrics"],
    output: ["**Requirement match** table: requirement | my evidence | gap?", "**Cover letter**", "**3 questions** whose answers would make it stronger"],
    checks: ["Each paragraph proves a requirement", "Under 300 words", "Nothing invented"],
  },

  summarization: {
    role: "analyst who writes executive summaries for busy decision-makers: accurate, neutral, and only from the source",
    success: "Someone who never reads the original can make the right decision from my summary.",
    slots: [
      { key: "source", label: "Text to summarise", question: "Please paste the text.", assume: "I'll paste it next" },
      { key: "audience", label: "Who it's for and why", question: "Who will read the summary, and what will they do with it?", assume: "a busy reader deciding what to do next" },
      { key: "length", label: "Length", question: "How long?", assume: "3 sentences plus key points" },
    ],
    steps: ["Identify the main point and the decisions or actions the text implies", "Write the summary leading with the conclusion", "List key points with numbers and names kept exact", "Flag gaps, contradictions or claims the text doesn't support"],
    constraints: ["Only use information in the text; quote when wording matters", "Keep all numbers, names and dates exactly as written"],
    output: ["**Summary** (3 sentences, conclusion first)", "**Key points** (5–7 bullets)", "**Decisions / action items** table: item | owner | due", "**Gaps or unclear points**"],
    checks: ["Nothing added that isn't in the text", "Numbers match the source"],
  },
};

function AUDIENCE_SLOT(label: string, question: string, assume: string) {
  return { key: "audience", label, question, assume };
}
