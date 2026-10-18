/**
 * Curated before/after pairs. "Before" is the kind of one-line request people usually type.
 * The "after" prompt is generated live by the engine from `after`, so it always matches what the builder produces.
 * Both sample responses are written by us for illustration. They are NOT live AI responses.
 */
import type { UniversalInput } from "@/lib/engine";

export interface BeforeAfterPair {
  id: string;
  label: string;
  /** Library prompt this pair illustrates (shown on that prompt's detail page). */
  librarySlug?: string;
  before: { prompt: string; response: string };
  after: { input: Omit<UniversalInput, "mode"> & { mode?: UniversalInput["mode"] }; response: string };
  changes: string[];
}

export const ILLUSTRATION_NOTE = "Example output, written by us for illustration, not a live AI response.";

export const BEFORE_AFTER: BeforeAfterPair[] = [
  {
    id: "instagram", label: "Grow on Instagram", librarySlug: "instagram-growth-plan",
    before: {
      prompt: "how to grow my instagram",
      response: `Here are some tips to grow your Instagram:
1. Post consistently
2. Use relevant hashtags
3. Engage with your audience
4. Post high-quality content
5. Use Reels and trending audio
6. Collaborate with other creators
Consistency is key. Good luck!`,
    },
    after: {
      input: { goal: "Help me grow my Instagram account", targetId: "chatgpt", extra: { niche: "home baking for working parents", current: "640 followers, 2 posts a week", timePerWeek: "4 hours" } },
      response: `Assumptions: 640 followers, 4 hrs/week, phone only, goal = cake orders.

Content pillars
| Pillar | Earns | Example |
| 15-minute bakes | saves | "3-ingredient mug cake before school run" |
| Mistakes fixed | shares | "Why your sponge sinks (and the 1 fix)" |
| Order stories | follows | Packing a birthday order, start to finish |

Reel ideas (first 3 of 10)
| Hook (on-screen) | Beats | CTA |
| "Cake in the time it takes to make chai" | ingredients → mix → microwave → first bite | Save for tomorrow |
| "Stop opening the oven at minute 10" | sunken cake → why → fix → perfect rise | Share with a baker friend |
…
Metrics: saves/post 12 → 30 · profile visits/week 80 → 200. If saves stall, test shorter tutorials.`,
    },
    changes: ["Named the niche, current stats and weekly time", "Expert role and a 30-day success criterion", "Asked for hooks under 10 words, filmable on a phone", "Tables for pillars, Reel ideas, calendar and metrics", "Banned clichés and fake-growth tactics"],
  },
  {
    id: "interview", label: "Prepare for an interview", librarySlug: "job-interview-coach",
    before: {
      prompt: "give me interview questions",
      response: `Common interview questions:
1. Tell me about yourself.
2. What are your strengths and weaknesses?
3. Why do you want this job?
4. Where do you see yourself in 5 years?
5. Why should we hire you?
Prepare answers in advance and be confident.`,
    },
    after: {
      input: { goal: "Help me prepare for a job interview", targetId: "claude", extra: { role: "Data analyst (2 years' experience)", company: "a fintech startup, technical round", background: "SQL and Excel reporting at a logistics firm; built a dashboard that cut weekly reporting time" } },
      response: `Assumption: technical round, 45 minutes.

| # | Question | What they're testing |
| 1 | Walk me through a dashboard you built end to end. | Ownership, stakeholder sense |
| 2 | Write SQL for 7-day retention by signup week. | Window functions, cohort logic |
| 3 | A metric dropped 20% overnight. What do you check first? | Structured debugging |
…
STAR outline for Q1: Situation: weekly reports took [X hours]. Action: built [tool] dashboard with automated refresh. Result: [add metric]. …

Mock interview: Question 1. Walk me through a dashboard you built. (I'll wait for your answer, then score it.)`,
    },
    changes: ["Added the role, company, round and your real background", "Questions explain what the interviewer is testing", "STAR outlines with placeholders, never invented experience", "A live mock interview, one question at a time"],
  },
  {
    id: "validate", label: "Validate a business idea", librarySlug: "validate-business-idea",
    before: {
      prompt: "is a tiffin service a good business idea",
      response: `A tiffin service can be a great business idea! There is high demand for home-cooked food among students and working professionals. Low startup costs make it accessible. However, competition can be high. Focus on quality, hygiene, and timely delivery to succeed. Consider starting small and growing through word of mouth.`,
    },
    after: {
      input: { goal: "Validate my tiffin service idea", targetId: "chatgpt", extra: { product: "home-style veg lunch tiffins, ₹120 per meal", region: "Pune, near IT parks", budget: "₹10,000 and 2 weeks" } },
      response: `Hypothesis: IT employees near Hinjewadi want home-style veg lunch and will pay ₹120/meal.

| Assumption | Risk | Evidence |
| They'll pay ₹120 (canteen is ₹90) | High | None yet |
| I can deliver by 1pm to 3 campuses | Medium | Untested |

| Test | Cost | Duration | Pass | Fail |
| WhatsApp pre-order, 5-day trial at ₹550 | ₹1,500 | 1 week | ≥15 paid sign-ups | <8 |
| Free tasting at 2 office gates | ₹3,000 | 2 days | ≥40 phone numbers | <15 |

Interview (sample): "What did you eat for lunch yesterday, and what did it cost?"
Decision rule: go if both tests pass; pivot on price if tasting passes but pre-orders fail.`,
    },
    changes: ["Stated the offer, price, location and test budget", "Asked for risky assumptions ranked first", "Experiments with pass/fail numbers set in advance", "Interview questions about past behaviour, not opinions"],
  },
  {
    id: "study", label: "Study plan", librarySlug: "gemini-study-plan",
    before: {
      prompt: "teach me excel",
      response: `Excel is a spreadsheet program by Microsoft. To learn Excel, start with the basics like entering data and formatting cells. Then learn formulas such as SUM, AVERAGE and IF. After that, explore charts, pivot tables and VLOOKUP. Practice regularly and watch tutorials on YouTube to improve your skills.`,
    },
    after: {
      input: { goal: "Make a 4-week study plan to learn Excel", targetId: "gemini", extra: { level: "complete beginner", time: "40 minutes a day, 5 days a week" }, context: "to build monthly sales reports at work" },
      response: `End goal: by week 4, build a monthly sales report with SUMIFS, a pivot table and a chart, from raw data.

| Week | Milestone | Proof |
| 1 | Clean data, basic formulas | Fix a messy 200-row sheet |
| 2 | SUMIFS, XLOOKUP | Answer 5 questions from sales data |
| 3 | Pivot tables, charts | One-page summary |
| 4 | Final report | Rebuild last month's report in 40 min |

Day 1 (40 min): learn 15 · practise 20 (format a sample sheet) · review 5
…
Week 1 self-test: 1) What does $A$2 do differently from A2? …`,
    },
    changes: ["Added current level, daily time and the real purpose", "A final project that proves the skill", "Daily learn + practise blocks sized to 40 minutes", "Spaced review and weekly self-tests"],
  },
  {
    id: "email", label: "Professional email", librarySlug: "professional-email-any-situation",
    before: {
      prompt: "write email for deadline extension",
      response: `Subject: Request for Deadline Extension

Dear Sir/Madam,

I hope this email finds you well. I am writing to kindly request an extension for the deadline of my project. Due to some unforeseen circumstances, I was unable to complete it on time. I would be very grateful if you could grant me some additional time. I apologize for any inconvenience caused.

Thank you for your understanding.
Best regards`,
    },
    after: {
      input: { goal: "Write a polite email asking for a deadline extension", targetId: "chatgpt", extra: { recipient: "my manager, Priya" }, context: "Q3 sales report due Friday; client data arrived 3 days late; analysis is 70% done; can deliver Tuesday 10am; can send a draft summary Friday" },
      response: `Subject: Q3 report: can I deliver Tuesday 10am?

Hi Priya,

Could I move the Q3 sales report from Friday to Tuesday 10am? The client data arrived three days late, and the analysis is about 70% done.

To keep things moving, I'll send a one-page draft summary by Friday 5pm so you can preview the key numbers.

Does Tuesday work for you?

Thanks,
Rahul`,
    },
    changes: ["Named the reader and the real facts", "The ask and a new date in the first two lines", "Offered a plan that reduces the reader's risk", "Under 150 words, no clichés or over-apologising"],
  },
  {
    id: "image", label: "Product photo (image AI)", librarySlug: "product-photo-prompt",
    before: {
      prompt: "photo of my water bottle",
      response: `[Illustrative description of a typical result] A generic stock-style image: a plain blue bottle floating on a white background, flat lighting, the label text garbled, slightly cartoonish, square crop that cuts off the cap.`,
    },
    after: {
      input: { goal: "Product photo of a matte black steel water bottle on a stone surface", targetId: "midjourney" },
      response: `[Illustrative description of a typical result] A clean 4:5 e-commerce shot: the matte black bottle at a 45° angle on grey stone, soft studio light from the left with a thin rim highlight along the edge, shallow depth of field, no stray objects or garbled text.`,
    },
    changes: ["Described the product's colour, material and surface", "Added style, lighting and lens/angle", "Aspect ratio 4:5 for product listings", "Negative prompt for warped labels and clutter"],
  },
  {
    id: "debug", label: "Fix a coding bug", librarySlug: "bug-fix-with-root-cause",
    before: {
      prompt: "my laravel login not working fix it",
      response: `Here are some common reasons Laravel login may not work:
1. Check your .env database settings
2. Clear cache with php artisan config:clear
3. Make sure passwords are hashed
4. Check your routes
5. Verify the session driver
Try these steps and it should work.`,
    },
    after: {
      input: { goal: "Fix a bug in my Laravel login controller", targetId: "chatgpt", extra: { stack: "Laravel 11, PHP 8.3, MySQL", errorText: "Login always redirects back to /login with no error message", code: "[LoginController@store pasted here]" }, context: "Started after moving to a new server last week" },
      response: `Expected: valid credentials → /dashboard. Actual: redirect to /login, no error.

| Likely cause | Evidence | How to check |
| Session cookie not persisting after the server move | Started after migration | Check SESSION_DOMAIN and SESSION_SECURE_COOKIE vs https |
| Session driver can't write | New server permissions | ls -la storage/framework/sessions |
| Auth::attempt fails silently | No error shown | Log the attempt() result |

Fix (once confirmed): set SESSION_DOMAIN to the new domain, run php artisan config:clear.
Regression test: a feature test that posts valid credentials and asserts redirect('/dashboard') and assertAuthenticated().`,
    },
    changes: ["Added stack versions, the exact symptom and what changed", "Ranked causes with evidence and a check for each", "Root-cause fix plus a regression test", "No guessing at code it hasn't seen"],
  },
  {
    id: "budget", label: "Monthly budget", librarySlug: "monthly-budget-builder",
    before: {
      prompt: "how to save money",
      response: `Here are some ways to save money:
- Make a budget
- Cut unnecessary expenses
- Cook at home
- Avoid impulse purchases
- Save at least 20% of your income
- Invest wisely
Small changes add up over time!`,
    },
    after: {
      input: { goal: "Help me make a monthly budget", targetId: "chatgpt", extra: { income: "₹55,000 take-home", expenses: "rent ₹16,000, EMI ₹6,500, bills ₹3,000, food ₹9,000, transport ₹3,500, shopping & eating out ₹8,000" }, context: "Goal: ₹1,20,000 emergency fund in 12 months" },
      response: `| Category | Current | Proposed | Difference |
| Rent | 16,000 | 16,000 | 0 |
| EMI | 6,500 | 6,500 | 0 |
| Bills | 3,000 | 3,000 | 0 |
| Food | 9,000 | 8,000 | −1,000 |
| Transport | 3,500 | 3,500 | 0 |
| Shopping & eating out | 8,000 | 6,000 | −2,000 |
| Emergency fund | (9,000 unassigned) | 10,000 | +10,000 |
| Buffer | | 2,000 | |
| Total | 55,000 | 55,000 | |

Goal: ₹1,20,000 ÷ 12 = ₹10,000/month → done in 12 months.
(Educational example; not personalised financial advice.)`,
    },
    changes: ["Used your real income and costs", "Every rupee assigned, with the maths shown", "Goal turned into a monthly amount and date", "Educational guardrails, no product pitches"],
  },
];

export function pairForSlug(slug: string): BeforeAfterPair | undefined {
  return BEFORE_AFTER.find((p) => p.librarySlug === slug);
}
