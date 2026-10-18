import type { LibraryItem } from "./types";

const G = (x: Omit<LibraryItem, "kind">): LibraryItem => ({ kind: "general", ...x });

export const GENERAL_PROMPTS: LibraryItem[] = [
  G({ slug: "perplexity-sourced-research", title: "Sourced research brief (Perplexity)", category: "Research", targets: ["perplexity"], tags: ["research", "citations"],
    summary: "Answer with citations, dates and disagreements called out.",
    body: `Research question: [your question]
Time range: [e.g. last 12 months]  Region: [e.g. India]

Give:
1. A 3-sentence direct answer.
2. Evidence: bullet points, each with the source name, URL and publication date.
3. Where sources disagree, say so and explain why.
4. What is unknown or not publicly available.
Do not state numbers without a cited source.` }),
  G({ slug: "claude-document-analysis", title: "Analyse a long document (Claude)", category: "Analysis", targets: ["claude"], tags: ["documents", "xml"],
    summary: "XML-structured document analysis with quotes.",
    body: `<document>
[paste document]
</document>

<task>
Answer the questions below using only the document. For each answer, include a short supporting quote.
</task>

<questions>
1. [question]
2. [question]
</questions>

<format>
Numbered answers. If the document doesn't answer a question, write "Not in document".
</format>` }),
  G({ slug: "chatgpt-cold-email", title: "Cold email that doesn't sound like spam", category: "Writing", targets: ["chatgpt", "claude", "gemini", "grok"], tags: ["email", "sales"],
    summary: "Short, specific outreach email.",
    body: `## Context
I am [who you are / your business]. I'm emailing [recipient role] at [company type] because [specific reason relevant to them].

## Task
Write a cold email offering [offer].

## Constraints
- Under 120 words
- First line about them, not me
- One clear call to action: [CTA]
- No buzzwords, no exaggerated claims

## Output format
Subject line + email body. Then give one alternative subject line.` }),
  G({ slug: "grok-x-thread", title: "Turn notes into an X thread (Grok)", category: "Social", targets: ["grok", "chatgpt"], tags: ["x", "thread", "social"],
    summary: "Clear thread from your raw notes.",
    body: `## Task
Turn my notes below into an X thread of 5–7 posts.

## Notes
[paste notes]

## Constraints
- Post 1 states the main insight plainly (no clickbait)
- Each post under 270 characters
- Only use facts from my notes; don't add statistics
- End with a simple question to invite replies

## Output format
Numbered posts.` }),
  G({ slug: "gemini-study-plan", title: "4-week study plan (Gemini)", category: "Learning", targets: ["gemini", "chatgpt"], tags: ["learning", "study"],
    summary: "Week-by-week plan with self-checks.",
    body: `## Role
You are a learning coach who uses spaced repetition and hands-on practice, and sizes every task to my real schedule.

## Task
Create a 4-week plan to learn [skill], starting from [current level, e.g. complete beginner].
Success looks like: by week 4 I can [concrete outcome, e.g. build a monthly sales report on my own], proven by a final mini-project.

## My situation
- Time: [minutes per day] on [days per week]
- Why I'm learning: [job task / exam / project]

## Steps
1. Turn the goal into 3 things I'll be able to do, plus a final mini-project
2. Order topics by dependency into 4 weekly milestones
3. Each day: one learn task + one practice task, within my daily time
4. Spaced review on days 1, 3 and 7 after each topic; a 5-question self-test each week
5. A weekly catch-up slot, and what to cut if I fall behind

## Output format
- Weekly milestones table: week | milestone | proof I can do it
- Daily plan table: day | learn (min) | practise (min) | review
- Weekly self-test (5 questions)
- Final mini-project brief

## Rules
- Every day includes doing, not just watching or reading
- Name resource types (official docs, practice datasets), not invented course titles or links
- If anything in [brackets] is missing, ask me before planning` }),
  G({ slug: "meeting-notes-summary", title: "Meeting notes → decisions and actions", category: "Productivity", targets: ["chatgpt", "claude", "gemini"], tags: ["meetings", "summary"],
    summary: "Clean summary with owners and deadlines.",
    body: `You are a chief of staff who turns messy meeting notes into clear decisions and owned action items.

Meeting: [name / purpose], attendees: [names]
Notes or transcript:
"""
[paste notes or transcript]
"""

Success looks like: anyone who missed the meeting knows what was decided, who does what by when, and what's still open.

Output:
1. Summary (2 sentences, outcome first)
2. Decisions made (bullets, with who decided if stated)
3. Action items table: task | owner | deadline | status. Write "unassigned" or "no date" when missing; never guess an owner
4. Open questions and risks
5. A 5-line follow-up message I can send to attendees

Rules: use only what is in the notes; keep names, numbers and dates exactly as written; flag contradictions.` }),
  G({ slug: "midjourney-product-hero", title: "Product hero image (Midjourney)", category: "Image", targets: ["midjourney"], tags: ["product", "midjourney"],
    summary: "Studio product shot with Midjourney parameters.",
    body: `[product, with colour and material], on a [material, e.g. travertine] pedestal, commercial product photography, soft gradient background in [colour], large softbox key light from the left with subtle rim light, soft shadow, 45-degree angle, 100mm macro lens, product centred and in sharp focus, shallow depth of field, true-to-life colours, minimal composition --ar 4:5 --no text, watermark, warped label, extra objects, harsh reflections` }),
  G({ slug: "resume-bullets", title: "Rewrite resume bullets with impact", category: "Career", targets: ["chatgpt", "claude", "gemini"], tags: ["resume", "career"],
    summary: "Action + result bullets without invented numbers.",
    body: `Rewrite these resume bullets for a [target role] application:
"""
[paste bullets]
"""
Rules:
- Start each with a strong verb; show the result or impact
- Use numbers ONLY if they appear in my original text; otherwise write [add metric] as a placeholder
- Max 2 lines each
Return the rewritten bullets, then 3 questions whose answers would make them stronger.` }),
];
