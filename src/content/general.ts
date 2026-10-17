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
    body: `## Task
Create a 4-week plan to learn [skill] from [current level].

## Context
I have [time per day]. My goal is [goal, e.g. build a small project / pass an exam].

## Output format
For each week: goal, daily tasks (30–60 min each), one free resource type to use, and a 5-question self-check. Finish with a mini-project idea.` }),
  G({ slug: "meeting-notes-summary", title: "Meeting notes → decisions and actions", category: "Productivity", targets: ["chatgpt", "claude", "gemini"], tags: ["meetings", "summary"],
    summary: "Clean summary with owners and deadlines.",
    body: `Summarise these meeting notes:
"""
[paste notes or transcript]
"""
Output:
1. Decisions made (bullets)
2. Action items as a table: task | owner | deadline (write "unassigned"/"no date" if missing)
3. Open questions
Only use what is in the notes.` }),
  G({ slug: "midjourney-product-hero", title: "Product hero image (Midjourney)", category: "Image", targets: ["midjourney"], tags: ["product", "midjourney"],
    summary: "Studio product shot with Midjourney parameters.",
    body: `[product] on a [material] pedestal, studio product photography, soft gradient background in [color], soft key light with subtle rim light, crisp reflections, minimal composition, high detail --ar 4:5 --no text, watermark` }),
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
