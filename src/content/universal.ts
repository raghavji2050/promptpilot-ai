import type { LibraryItem } from "./types";

/**
 * General-purpose prompts across all goal categories. Written for PromptPilot.
 * Example outputs are illustrative samples, not real results, and are labelled as such in the UI.
 */
const ADDED = "2026-10-17";
const CHAT = ["chatgpt", "claude", "gemini", "grok"];
const U = (x: Omit<LibraryItem, "kind" | "added"> & { added?: string }): LibraryItem => ({ kind: "general", added: ADDED, ...x });

export const UNIVERSAL_PROMPTS: LibraryItem[] = [
  // ---------------------------------------------------------------- A Social
  U({ slug: "instagram-growth-plan", title: "30-day Instagram growth plan", cat: "social", sub: "instagram-growth", category: "Instagram growth", targets: CHAT, tags: ["instagram", "reels", "growth", "strategy"],
    audience: "Creators and small brands on Instagram", useCase: "Grow an account with a clear plan", outputType: "Plan",
    summary: "Audience snapshot, content pillars, 10 Reel ideas with hooks, a weekly schedule and metrics to review.",
    body: `You are a social media strategist who has grown Instagram accounts in competitive niches.

My account: [niche / what you post]
Where I am now: [followers, posts per week, what has worked]
Time I can spend: [hours per week]
Goal for the next 30 days: [e.g. more saves and profile visits]

Create a 30-day growth plan:
1. Audience snapshot: who they are, what they want, what makes them stop scrolling.
2. 3–4 content pillars that fit my niche and strengths.
3. 10 specific Reel or carousel ideas, each with a one-line hook.
4. A weekly posting schedule I can realistically keep.
5. Metrics to track (saves, shares, profile visits, follower change) and what to change at the 2-week review.

Rules: don't promise follower numbers or virality; prefer ideas I can film with a phone.
Format: headings for each part; ideas as a table (idea · format · hook).`,
    exampleOutput: `Audience snapshot: Working parents (28–40) who want 15-minute home workouts…
Content pillars: 1) Quick routines 2) Myth-busting 3) Real-life progress…
| Idea | Format | Hook |
| 10-min no-equipment routine | Reel | "No gym, no time? Do this while the kettle boils." |
…` }),
  U({ slug: "reel-script-hook-first", title: "Reel script with a 3-second hook", cat: "social", sub: "instagram-growth", category: "Instagram growth", targets: CHAT, tags: ["reels", "script", "short video"],
    audience: "Anyone making short vertical videos", useCase: "Script one Reel", outputType: "Script",
    summary: "Beat-by-beat 30-second Reel script: hook, value, payoff, call to action, plus on-screen text.",
    body: `Write a 30-second Instagram Reel script about [topic] for [audience].

Structure:
- 0–3s Hook: one line that creates curiosity or names a pain point (give 3 options).
- 3–20s Value: 2–3 quick points or steps, one per shot.
- 20–27s Payoff: the result or key takeaway.
- 27–30s CTA: one simple action (save, comment a keyword, follow for part 2).

For each beat give: what I say, what's on screen, on-screen text.
Tone: [friendly / energetic / calm]. Keep spoken lines short enough to say naturally.` }),
  U({ slug: "caption-hook-hashtag-pack", title: "Caption, hooks & hashtags pack", cat: "social", sub: "captions-hooks", category: "Captions & hooks", targets: CHAT, tags: ["captions", "hashtags", "hooks", "carousel"],
    audience: "Creators and social media managers", useCase: "Write post copy", outputType: "List",
    summary: "Five hooks from different angles, two captions with CTAs and a relevant hashtag set.",
    body: `Post: [what the post or carousel is about]
Platform: [Instagram / LinkedIn / TikTok]
Audience: [who it's for]

Give me:
1. 5 hooks, each using a different angle: question, bold claim, mini-story, number/list, contrarian.
2. 2 captions (under 120 words) that expand the hook and end with one clear call to action.
3. 10–15 relevant hashtags split into broad and niche. No banned or irrelevant tags.
Avoid clickbait that the post doesn't deliver.` }),
  U({ slug: "youtube-video-plan", title: "YouTube video plan: titles, hook, outline", cat: "social", sub: "youtube", category: "YouTube", targets: CHAT, tags: ["youtube", "video", "script", "titles"],
    audience: "YouTubers and educators", useCase: "Plan a video", outputType: "Outline",
    summary: "Title options, thumbnail concepts, a 15-second hook and a timed outline that delivers on the title.",
    body: `Plan a YouTube video for my channel about [channel topic].
Video idea: [idea]
Viewer: [who watches and what they want]
Length: [e.g. 8–10 minutes]

Give me:
1. 5 title options (under 60 characters) and a thumbnail concept for each (subject, expression, 2–4 words of text).
2. A hook script for the first 15 seconds that previews the payoff.
3. A timed outline (section · time · key points · B-roll ideas).
4. A natural call to action near the end.
Make sure the video actually delivers what the title promises.` }),
  U({ slug: "content-calendar-30-days", title: "30-day multi-platform content calendar", cat: "social", sub: "content-calendar", category: "Content calendars", targets: CHAT, tags: ["content calendar", "planning", "social media"],
    audience: "Small businesses and creators", useCase: "Plan a month of posts", outputType: "Table",
    summary: "A month of posts mapped to content pillars, platforms and formats, with repurposing notes.",
    body: `Create a 30-day content calendar.
Business/creator: [what you do]
Platforms: [e.g. Instagram, YouTube Shorts, LinkedIn]
Posting frequency: [e.g. 4 per week]
Key dates this month: [launches, festivals, events]

Use 3–4 content pillars and balance formats (Reels, carousels, stories, text posts).
Output a table: date · platform · format · pillar · topic · hook · repurpose note.
Then list 5 posts that can be batch-created in one session.` }),
  U({ slug: "linkedin-insight-post", title: "LinkedIn post from a real lesson", cat: "social", sub: "linkedin", category: "LinkedIn", targets: CHAT, tags: ["linkedin", "personal brand", "writing"],
    audience: "Professionals and founders", useCase: "Share an insight", outputType: "Post",
    summary: "Turns a genuine experience into a specific, non-cringe LinkedIn post.",
    body: `Turn this experience into a LinkedIn post:
What happened: [the situation]
What I learned: [the lesson]
Who should read it: [audience]

Rules: open with a specific first line (no "I'm humbled to announce"); short paragraphs; one concrete example; end with a question or a takeaway; max 3 hashtags; don't exaggerate or invent details.
Give the post (150–250 words) plus 2 alternative opening lines.` }),
  // ---------------------------------------------------------------- B Business
  U({ slug: "validate-business-idea", title: "Validate a business idea before spending money", cat: "business", sub: "startup-validation", category: "Startup validation", targets: CHAT, tags: ["startup", "validation", "experiments"],
    audience: "First-time founders and side-hustlers", useCase: "Test an idea cheaply", outputType: "Plan",
    summary: "Assumption map, three cheap experiments with pass/fail criteria and a customer interview script.",
    body: `You are a lean startup coach. Help me validate this idea before I build anything.

Idea: [your idea]
Target customer: [who]
Budget for testing: [amount]
Location: [city/market]

1. List the key assumptions (customer, problem, willingness to pay, channel) and rank them by risk.
2. Design one cheap experiment for each of the top 3 (e.g. landing page, pre-orders, concierge test). For each: steps, cost, time, and the pass/fail threshold decided in advance.
3. Write a 10-question customer interview script that avoids leading questions.
Label anything that is your assumption rather than a fact.`,
    exampleOutput: `Riskiest assumption: office workers will pay ₹120/day for home-style tiffin.
Experiment 1 — WhatsApp pre-orders: share a menu in 3 office groups for 1 week. Pass if ≥15 paid orders…` }),
  U({ slug: "competitor-analysis-swot", title: "Competitor analysis with SWOT", cat: "business", sub: "competitor-analysis", category: "Competitor analysis", targets: [...CHAT, "perplexity"], tags: ["competitors", "swot", "strategy"],
    audience: "Small business owners and marketers", useCase: "Find a positioning gap", outputType: "Table",
    summary: "Fair comparison table, SWOT for your business and three realistic differentiation ideas.",
    body: `My business: [what you sell, to whom, where]
Competitors I know: [names or links]

1. Suggest other direct and indirect competitors I may have missed (mark ones I should verify).
2. Compare all of them in a table: offer, price range, target customer, channels, strengths, weaknesses.
3. Write a SWOT for my business.
4. Recommend 3 differentiation opportunities I could act on within a month.
Mark any detail you are not sure about as "verify". Don't invent prices or numbers.` }),
  U({ slug: "small-business-marketing-plan", title: "One-page marketing plan for a small business", cat: "business", sub: "marketing", category: "Marketing strategy", targets: CHAT, tags: ["marketing", "small business", "plan"],
    audience: "Small business owners", useCase: "Plan marketing for a month", outputType: "Plan",
    summary: "Ideal customer, core message, 2–3 channels that fit the budget, a 4-week plan and metrics.",
    body: `Create a one-page marketing plan.
Business: [what you sell]
Ideal customer: [who buys and why]
Monthly budget: [amount]
Current channels: [what you already use]

Include: the customer's buying trigger, a core message with 3 supporting angles, 2–3 channels (explain why they fit the budget), a week-by-week plan for 4 weeks, and 3 metrics to review weekly.
No guaranteed results or made-up benchmarks.` }),
  U({ slug: "sales-call-script", title: "Friendly sales call script with objections", cat: "business", sub: "sales-scripts", category: "Sales scripts", targets: CHAT, tags: ["sales", "script", "objections"],
    audience: "Freelancers, agencies and sales teams", useCase: "Prepare a sales call", outputType: "Script",
    summary: "Opening, discovery questions, offer, objection handling and a clear next step, without pressure tactics.",
    body: `Write a sales call script.
I sell: [offer]
To: [prospect type]
Their likely problem: [problem]

Stages: opening that shows relevance → 3 discovery questions → presenting the offer in their words → handling the 3 most likely objections (table: objection · response) → one clear next step.
Keep it conversational. No pressure tactics or false urgency.` }),
  U({ slug: "customer-complaint-reply", title: "Reply to an unhappy customer", cat: "business", sub: "customer-support", category: "Customer support", targets: CHAT, tags: ["support", "complaint", "customer service"],
    audience: "Shop owners and support teams", useCase: "Resolve a complaint", outputType: "Message",
    summary: "Empathetic, specific reply within your policy, plus a reusable template.",
    body: `Customer message:
"""
[paste the message]
"""
Our policy: [refund/replacement policy]
What I can offer: [options]

Write a reply that acknowledges the specific problem, apologises without blaming, explains what happens next, offers a solution within policy, and closes warmly. Under 150 words.
Then give a reusable template version with [placeholders].` }),
  U({ slug: "product-listing-copy", title: "Product listing for an online store", cat: "business", sub: "ecommerce", category: "E-commerce", targets: CHAT, tags: ["ecommerce", "product description", "amazon", "shopify"],
    audience: "Online sellers", useCase: "Write a product page", outputType: "Listing",
    summary: "Clear title, benefit-led bullets backed by real features, description and search keywords.",
    body: `Product: [name]
Features/specs (only use these): [list]
Buyer: [who buys it and why]
Marketplace: [Amazon / Shopify / Etsy / Flipkart]

Write: a title with key attributes, 5 benefit-led bullets (each tied to a real feature), a short description, care/size details, and 10 search keywords.
Never invent specifications, certifications or claims.` }),
  // ---------------------------------------------------------------- C Writing
  U({ slug: "professional-email-any-situation", title: "Professional email for any situation", cat: "writing", sub: "email", category: "Emails", targets: CHAT, tags: ["email", "professional", "communication"],
    audience: "Anyone writing work emails", useCase: "Write a clear email", outputType: "Email",
    summary: "Clear subject line, main point first, polite tone and one specific ask.",
    body: `You are a senior communications coach who writes clear, warm emails that get a yes on the first read.

To: [recipient and relationship, e.g. my manager]
What I need: [the one ask]
Key facts: [dates, reason, what's already done, what I'm offering]
Tone: [polite / warm / firm]

Success looks like: the reader knows what I need in the first two lines and can reply yes in one sentence.

Steps:
1. Subject line that states the ask (e.g. "Request: 2-day extension for the Q3 report")
2. First two lines: the ask and the date
3. One sentence of reason, then the plan that reduces their effort or risk
4. Close with one clear question

Rules: under 150 words; paragraphs of 1–3 sentences; no "I hope this email finds you well", over-apologising or "Please do the needful"; use [placeholders] for anything I haven't told you.

Output: subject line (+1 alternative), the email, and a WhatsApp/chat version under 50 words.`,
    exampleOutput: `Subject: Request for leave on 23–24 October
Hi Priya,
I'd like to request two days of leave on 23 and 24 October for a family function. My reports will be submitted by the 22nd, and Rohan has agreed to cover client calls…` }),
  U({ slug: "summarize-any-document", title: "Summarize any article or document", cat: "writing", sub: "summarization", category: "Summarization", targets: CHAT, tags: ["summary", "reading", "notes"],
    audience: "Students and professionals", useCase: "Get the key points fast", outputType: "Summary",
    summary: "Short summary, key points and action items using only the provided text.",
    body: `You are an analyst who writes accurate executive summaries for busy readers, using only the source.

Summarise for: [who will read it, and what they'll do with it]
"""
[paste text]
"""

Success looks like: the reader can make the right decision without opening the original.

Output:
1. Summary in 3 sentences, conclusion first
2. 5–7 key points (keep numbers, names and dates exact)
3. Decisions or action items, if any
4. What's unclear, missing or unsupported in the text

Rules: use only information in the text; quote briefly when exact wording matters; no opinions unless I ask.` }),
  U({ slug: "translate-naturally", title: "Natural translation that keeps the tone", cat: "writing", sub: "translation", category: "Translation", targets: CHAT, tags: ["translation", "language", "localization"],
    audience: "Anyone working across languages", useCase: "Translate text", outputType: "Translation",
    summary: "Meaning-first translation that preserves tone, names and formatting, with notes on tricky phrases.",
    body: `Translate the text below into [target language] for [audience, e.g. customers in Mumbai].
Tone: [formal / friendly / same as original]

"""
[paste text]
"""

Translate meaning, not word by word. Keep names, numbers, links and formatting intact. After the translation, list any phrases with no direct equivalent and how you handled them.` }),
  U({ slug: "presentation-outline", title: "Presentation outline with speaker notes", cat: "writing", sub: "presentations", category: "Presentations", targets: CHAT, tags: ["presentation", "slides", "public speaking"],
    audience: "Students and professionals", useCase: "Build a slide deck", outputType: "Table",
    summary: "Slide-by-slide structure, one idea per slide, visuals and speaker notes.",
    body: `You are a presentation coach who builds talks around one memorable message and slides with one idea each.

Topic: [topic]
Audience: [who, and what they already know]
Length: [number] slides, [minutes] minutes
The one thing they should remember: [key takeaway]
What I want them to do afterwards: [action]

Success looks like: someone who missed the talk can repeat the key takeaway after skimming the slides.

Steps:
1. Write the key takeaway as one sentence and build the story around it: hook → problem → insight → evidence → action
2. One idea per slide; slide titles are full-sentence claims, not labels ("Late deliveries cost us 12% of repeat orders", not "Deliveries")
3. For each slide, suggest a visual (chart type, photo, diagram) instead of text bullets
4. Write speaker notes I can say in the time available (about 130 words per minute)

Output: a table with slide # | headline claim | up to 3 bullets (≤8 words each) | visual | speaker notes (2–4 sentences). Then 3 likely audience questions with short answers.

Rules: no more than 3 bullets per slide; use [placeholder] for any data I haven't given; the timing must add up to my talk length.` }),
  U({ slug: "bedtime-story-for-kids", title: "Personalised bedtime story", cat: "writing", sub: "creative-writing", category: "Creative writing", targets: CHAT, tags: ["story", "kids", "creative"],
    audience: "Parents and teachers", useCase: "Write a story for a child", outputType: "Story",
    summary: "A gentle, age-appropriate story with the child's interests and a soft lesson.",
    body: `Write a bedtime story for a [age]-year-old named [name] who loves [interests].
Theme or lesson: [e.g. being brave, sharing]
Length: about [word count] words.

Use simple words, a calm rhythm, a small problem that gets solved kindly, and a peaceful ending. No scary content. Offer 2 alternative titles.` }),
  // ---------------------------------------------------------------- D Education
  U({ slug: "learn-anything-step-by-step", title: "Learn any topic step by step", cat: "education", sub: "learn-topic", category: "Learn any topic", targets: CHAT, tags: ["learning", "tutor", "beginner"],
    audience: "Students and self-learners", useCase: "Learn something new", outputType: "Lesson",
    summary: "An interactive teacher that maps the topic, teaches one block at a time and checks understanding.",
    body: `You are a patient expert teacher. I want to learn [topic].
My level: [complete beginner / some basics]
Why I'm learning: [goal]
Time: [e.g. 30 minutes a day]

1. Ask me 3 quick questions to check what I already know.
2. Break the topic into 5–7 building blocks and show me the map.
3. Teach block 1 with a simple everyday example, then give me one practice question.
4. Wait for my answer, correct it kindly, then continue.
Avoid jargon unless you define it.` }),
  U({ slug: "exam-revision-plan", title: "Exam revision plan to the exam date", cat: "education", sub: "exam-prep", category: "Exam preparation", targets: CHAT, tags: ["exam", "revision", "study plan"],
    audience: "Students preparing for exams", useCase: "Plan revision", outputType: "Plan",
    summary: "Prioritised syllabus, day-by-day schedule, practice tests and a mistake log routine.",
    body: `Help me prepare for [exam name] on [date].
Syllabus/subjects: [list or "use the official syllabus"]
Strong areas: [ ]
Weak areas: [ ]
Study time: [hours per day]

Create: a priority table (topic · weight · my confidence · priority), a day-by-day revision schedule up to the exam with buffer days, a practice-test plan, and a simple mistake-log routine.
Remind me to check the official syllabus and pattern; don't assume they're current.` }),
  U({ slug: "flashcards-from-notes", title: "Flashcards from your notes", cat: "education", sub: "quiz-flashcards", category: "Quizzes & flashcards", targets: CHAT, tags: ["flashcards", "anki", "revision"],
    audience: "Students", useCase: "Make revision cards", outputType: "Flashcards",
    summary: "Accurate question/answer cards from your own notes, ready to import into a flashcard app.",
    body: `You are a learning scientist who writes flashcards for active recall and spaced repetition.

Notes:
"""
[paste notes]
"""
Number of cards: [number]
Exam or goal: [e.g. biology class 12 board exam]

Success looks like: cards that test understanding, so I can tell what I actually know.

Rules:
- One idea per card; no "list everything about X" cards
- Mix types: definition, why/how, apply-to-an-example, compare two concepts
- Answers under 25 words; use only my notes
- Add a cloze card (fill-in-the-blank) for key formulas or terms

Output: one card per line as "Front | Back" so I can import it into Anki or Quizlet, then the 3 concepts from my notes most likely to be tested.` }),
  U({ slug: "explain-like-im-new", title: "Explain a difficult concept simply", cat: "education", sub: "explain-simply", category: "Explain concepts", targets: CHAT, tags: ["explain", "eli5", "learning"],
    audience: "Anyone curious", useCase: "Understand a concept", outputType: "Explanation",
    summary: "Plain answer, everyday analogy, deeper layer, a common misconception and a check question.",
    body: `You are a patient teacher who explains hard ideas with everyday analogies and checks understanding before going deeper.

Explain: [concept]
My background: [e.g. no science background, class 10 maths]
Why I'm asking: [e.g. a news article, an exam, work]

Success looks like: I can explain it back to a friend in two sentences and avoid the most common misunderstanding.

Structure:
1. One-sentence plain answer
2. An everyday analogy, and where the analogy breaks down
3. A slightly deeper explanation (under 150 words)
4. A common misconception and why it's wrong
5. One question to check I understood; wait for my answer

Rules: define every technical word the first time; no jargon without a definition; under 350 words before the check question.` }),
  // ---------------------------------------------------------------- E Design
  U({ slug: "product-photo-prompt", title: "Realistic product photo prompt", cat: "design", sub: "product-photo", category: "Product photography", targets: ["image-generic", "midjourney", "chatgpt", "gemini"], tags: ["product photo", "ecommerce", "image"],
    audience: "Online sellers and marketers", useCase: "Create product visuals", outputType: "Image prompt",
    summary: "Studio or lifestyle product shot with surface, lighting, angle and aspect ratio.",
    body: `A professional product photograph of [product, with colour/material], placed on [surface, e.g. light oak table], [setting: clean studio / cosy kitchen / outdoor café].
Lighting: soft diffused window light from the left, gentle shadow.
Camera: 45-degree angle, 50mm lens look, shallow depth of field, product in sharp focus.
Mood: [e.g. fresh, minimal, premium]. Colour palette: [colours].
Aspect ratio [1:1 / 4:5]. No text, no logos, no watermark. Keep the product's shape and label accurate.` }),
  U({ slug: "logo-concepts-brief", title: "Logo concepts with rationale", cat: "design", sub: "logo-branding", category: "Logos & branding", targets: CHAT, tags: ["logo", "branding", "identity"],
    audience: "Founders and designers", useCase: "Explore brand directions", outputType: "Concepts",
    summary: "Three distinct logo directions with palette, typography and an image prompt for each.",
    body: `You are a brand identity designer.
Brand: [name] — [what it does]
Audience: [who]
Personality: [3 words, e.g. calm, premium, eco]
Avoid: [styles/colours you dislike]

Propose 3 distinct concepts (one symbol, one wordmark, one combination). For each: idea and rationale, colour palette with hex codes, font style suggestions, and a prompt I can paste into an image generator to visualise it.
Don't imitate existing trademarks.` }),
  U({ slug: "video-shot-prompt", title: "Cinematic video shot prompt", cat: "design", sub: "video-generation", category: "Video generation", targets: ["video"], tags: ["video", "cinematic", "b-roll"],
    audience: "Creators and marketers", useCase: "Generate a video clip", outputType: "Video prompt",
    summary: "Shot type, subject action, camera move, setting, style, duration and audio cues.",
    body: `Shot: [medium shot / close-up / aerial]
Subject & action: [who/what does what, e.g. a potter shapes a clay bowl on a wheel]
Camera: [slow dolly in / orbit / static]
Setting: [place and time, e.g. sunlit workshop, late afternoon]
Style: cinematic, natural colours, shallow depth of field, consistent lighting
Duration: [6–8 seconds]
Audio (if supported): [ambient sounds]
Aspect ratio: [16:9 / 9:16]` }),
  U({ slug: "thumbnail-concepts", title: "Honest, clickable thumbnail concepts", cat: "design", sub: "thumbnails", category: "Thumbnails", targets: CHAT, tags: ["thumbnail", "youtube", "design"],
    audience: "YouTubers", useCase: "Design a thumbnail", outputType: "Concepts",
    summary: "Three phone-readable thumbnail concepts plus image prompts, true to the video's promise.",
    body: `Video title: [title]
What the viewer gets: [payoff]
Channel style: [colours, face/no face]

Give 3 thumbnail concepts: focal subject, facial expression (if any), 2–4 words of text, colour contrast, composition. Then an image-generator prompt for each (leave space for text; I'll add it in an editor).
It must be readable on a phone and honest to the video.` }),
  // ---------------------------------------------------------------- G Career
  U({ slug: "job-interview-coach", title: "Job interview coach with mock interview", cat: "career", sub: "interview-prep", category: "Interview preparation", targets: CHAT, tags: ["interview", "job", "career", "star"],
    audience: "Job seekers and students", useCase: "Prepare for an interview", outputType: "Practice session",
    summary: "Likely questions for your role, STAR answer structures from your real experience and a one-question-at-a-time mock interview.",
    body: `You are an experienced interviewer and interview coach.
Role: [job title]
Company: [company and what it does]
My background: [experience, key achievements]
Interview type: [HR / technical / case / panel]

1. List the 10 most likely questions (behavioural, role-specific, about the company).
2. For the 3 hardest, show how to structure a strong STAR answer using my real experience (use [placeholders] where you need my examples; never invent experience).
3. Run a mock interview: ask one question at a time, wait for my answer, then give specific feedback and a stronger version.
4. Suggest 3 smart questions I can ask the interviewer.`,
    exampleOutput: `Likely question 4: "Tell me about a time you handled a difficult stakeholder."
STAR structure: Situation — [project and stakeholder]; Task — [what you owned]; Action — 2–3 specific steps; Result — [outcome, with a number if you have one]…
Mock interview — Question 1: "Walk me through your resume in 90 seconds."` }),
  U({ slug: "resume-bullet-upgrade", title: "Upgrade resume bullets without exaggerating", cat: "career", sub: "resume", category: "Resume improvement", targets: CHAT, tags: ["resume", "cv", "ats"],
    audience: "Job seekers", useCase: "Improve a resume", outputType: "Rewrite",
    summary: "Action + result bullets tailored to a target role, asking for real numbers instead of inventing them.",
    body: `You are a recruiter who has screened thousands of resumes for [job title] roles and knows what ATS filters and 6-second scans look for.

Target role: [job title]
Job description (key parts): [paste]
My current bullets:
[paste bullets]

Success looks like: every bullet shows action + result, matches the job's keywords, and nothing is invented.

Steps:
1. Pull the 10 most important keywords from the job description
2. Rewrite each bullet as strong verb + what I did + result; where a number would help, write [add metric] instead of inventing one
3. Reorder bullets so the most relevant proof comes first
4. List gaps between my resume and the role, and honest ways to address them

Output: keyword table (keyword | in my resume? | where to add) · before → after bullets · gaps · 3 questions whose answers would make my weakest bullets stronger.
Rules: max 2 lines per bullet; no "responsible for"; never invent metrics, tools or titles.` }),
  U({ slug: "salary-raise-conversation", title: "Ask for a raise: talking points and script", cat: "career", sub: "workplace-comms", category: "Workplace communication", targets: CHAT, tags: ["salary", "negotiation", "raise"],
    audience: "Employees", useCase: "Prepare a tough conversation", outputType: "Script",
    summary: "Evidence-based talking points, an opening script, likely responses and a follow-up email.",
    body: `Help me ask my manager for a raise.
My role and time in role: [ ]
Achievements this year: [ ]
What I'm asking for: [amount or %]
Market info I have: [salary data and source, if any]

Give: 4 evidence-based talking points, a calm opening script, likely manager responses with how to reply (including "not now"), and a short follow-up email summarising the conversation.
Keep it professional; no ultimatums.` }),
  // ---------------------------------------------------------------- H Productivity
  U({ slug: "plan-my-day-time-blocks", title: "Plan my day with time blocks", cat: "productivity", sub: "daily-planning", category: "Daily planning", targets: CHAT, tags: ["planning", "time blocking", "to-do"],
    audience: "Anyone with a busy day", useCase: "Organise today", outputType: "Schedule",
    summary: "Prioritises your tasks and fits them into your real hours with breaks and buffers.",
    body: `Plan my day.
Available hours: [e.g. 9:00–18:00]
Fixed commitments: [meetings, calls, school pickup]
Tasks: [list everything]
Energy: [when I focus best]

1. Sort tasks into must / should / could.
2. Estimate time for each (ask if unclear).
3. Build a time-blocked schedule with breaks and a 30-minute buffer.
4. Tell me what to drop, delegate or move to tomorrow.` }),
  U({ slug: "trip-itinerary-budget", title: "Day-by-day trip itinerary on a budget", cat: "productivity", sub: "travel", category: "Travel planning", targets: [...CHAT, "perplexity"], tags: ["travel", "itinerary", "budget"],
    audience: "Travellers", useCase: "Plan a trip", outputType: "Itinerary",
    summary: "Itinerary with travel times, areas to stay, food ideas, a budget estimate and things to verify.",
    body: `Plan a [number]-day trip to [destination] in [month].
Travellers: [who]
Budget: [total or per day]
Interests: [food, nature, history, nightlife…]
Pace: [relaxed / packed]

Give: a day-by-day table (morning · afternoon · evening · travel time), areas to stay with reasons, local food to try, an estimated budget split, and a checklist of bookings.
Prices, opening hours and visa rules change, so mark what I should verify.` }),
  U({ slug: "weekly-meal-plan", title: "Weekly meal plan with grocery list", cat: "productivity", sub: "meal-planning", category: "Meal planning", targets: CHAT, tags: ["meal plan", "recipes", "grocery"],
    audience: "Families and busy people", useCase: "Plan meals for the week", outputType: "Table",
    summary: "Seven days of meals that fit your diet, budget and cooking time, plus a grouped grocery list.",
    body: `Create a 7-day meal plan.
People: [number, ages]
Diet/allergies: [e.g. vegetarian, no peanuts]
Cuisine preferences: [ ]
Cooking time: [e.g. 30 minutes on weekdays]
Budget: [weekly amount]

Give: a table (day · breakfast · lunch · dinner), a grocery list grouped by section, and 3 prep-ahead tips.
If any diet is for a medical condition, remind me to follow my doctor's or dietitian's advice.` }),
  U({ slug: "habit-system-design", title: "Build a habit that sticks", cat: "productivity", sub: "habits", category: "Habits", targets: CHAT, tags: ["habits", "routine", "behaviour"],
    audience: "Anyone building routines", useCase: "Start a new habit", outputType: "Plan",
    summary: "Tiny starting version, a trigger, a simple tracker and a plan for missed days.",
    body: `You are a behaviour-change coach who designs habits using tiny starting versions, existing routines as triggers, and simple tracking.

Habit I want: [habit]
Why it matters to me: [reason]
My typical day: [wake time, work hours, evenings]
What stopped me before: [obstacles]

Success looks like: a habit small enough to do on my worst day, attached to something I already do, with a plan for missed days.

Steps:
1. Define the 2-minute version I can do daily, and the full version I'm building towards
2. Pick an anchor: "After I [existing routine], I will [tiny habit]" (give 3 options from my day)
3. Remove friction for each obstacle I listed with one specific change
4. Give a copy-paste tracker (text table, 4 weeks)
5. Rules for missed days (never miss twice) and how to grow the habit every 2 weeks

Output: tiny version · 3 anchor options · obstacle → fix table · 4-week tracker · growth plan.
Rules: no motivation speeches; every suggestion is a concrete action with a time or place.` }),
  // ---------------------------------------------------------------- I Data
  U({ slug: "spreadsheet-formula-helper", title: "Spreadsheet formula with explanation", cat: "data", sub: "spreadsheet", category: "Spreadsheet formulas", targets: CHAT, tags: ["excel", "google sheets", "formula"],
    audience: "Office workers and students", useCase: "Write a formula", outputType: "Formula",
    summary: "A working Excel/Sheets formula for your layout, explained part by part with edge cases.",
    body: `App: [Excel / Google Sheets]
Sheet layout: [e.g. A: date, B: product, C: quantity, D: price; data in rows 2–500]
What I need: [e.g. total sales per month in a summary table]

Give the formula, explain each part in plain words, mention edge cases (blanks, text in number columns, different date formats), and offer one alternative approach (e.g. pivot table).`,
    exampleOutput: `Put the month you want in F2 as text, e.g. 2026-10, then:
=SUMPRODUCT((TEXT($A$2:$A$500,"yyyy-mm")=F2)*$C$2:$C$500*$D$2:$D$500)
How it works: TEXT turns each date into "year-month"; the comparison gives 1 for matching rows and 0 otherwise; SUMPRODUCT multiplies that by quantity × price and adds it up.
Edge case: blank dates become "1900-01" and simply don't match.` }),
  U({ slug: "analyze-data-insights", title: "Find insights in a dataset", cat: "data", sub: "data-analysis", category: "Data analysis", targets: ["chatgpt", "claude", "gemini"], tags: ["data", "analysis", "insights"],
    audience: "Analysts, founders and students", useCase: "Analyse data", outputType: "Report",
    summary: "Data quality check, answers to your questions, chart suggestions and limitations, without invented numbers.",
    body: `Analyse the data below (or the attached file).
Context: [what the data is, time period]
Questions I want answered: [1–3 questions]

"""
[paste data or describe the attached file]
"""

1. Describe the dataset and check quality (missing values, duplicates, outliers).
2. Answer each question, showing how you calculated it.
3. Suggest 2–3 charts that would make the findings clear.
4. State limitations and what extra data would help.
Compute only from the data provided; don't invent numbers.` }),
  U({ slug: "survey-results-themes", title: "Turn survey responses into themes", cat: "data", sub: "survey-analysis", category: "Survey analysis", targets: CHAT, tags: ["survey", "feedback", "research"],
    audience: "Product teams, teachers and researchers", useCase: "Understand feedback", outputType: "Table",
    summary: "Quantitative summary, coded themes with counts and quotes, and sample-size caveats.",
    body: `Here are survey responses from [who, how many people]:
"""
[paste responses]
"""

1. Summarise any rating/numeric questions.
2. Group open-ended answers into themes (table: theme · count · example quote).
3. Highlight differences between segments if the data shows them.
4. List 3 implications and the limits of this sample.
Don't over-claim from small samples.` }),
  U({ slug: "compare-options-table", title: "Compare options side by side", cat: "data", sub: "compare-alternatives", category: "Comparing alternatives", targets: [...CHAT, "perplexity"], tags: ["compare", "decision", "research"],
    audience: "Anyone choosing between options", useCase: "Choose between options", outputType: "Table",
    summary: "Criteria-based comparison table and a recommendation for your priorities.",
    body: `You are a neutral research analyst who compares options against the buyer's own priorities and is clear about what needs verifying.

Options: [option A], [option B], [option C]
My use case: [what I'll use it for]
What matters most (in order): [criteria, e.g. price, ease of use, privacy]
Budget: [amount]

Success looks like: I can see which option fits my priorities best, why, and what to double-check before buying.

Steps:
1. Assign weights to my criteria (summing to 100) based on my order
2. Score each option 1–5 per criterion with a one-line reason
3. Calculate weighted totals and show the maths
4. Recommend the best fit, plus one alternative for a different priority

Output: comparison table (option | each criterion score | weighted total) · recommendation · "verify before buying" list.
Rules: mark any price, spec or feature that may be outdated as [verify]; don't invent specs.` }),
  // ---------------------------------------------------------------- J Finance & knowledge
  U({ slug: "monthly-budget-builder", title: "Monthly budget from your numbers", cat: "finance", sub: "budget", category: "Budget planning", targets: CHAT, tags: ["budget", "saving", "personal finance"],
    audience: "Individuals and families", useCase: "Make a budget", outputType: "Table",
    summary: "Budget table, savings plan and review checklist, using only your numbers, with educational guardrails.",
    body: `You are a personal finance educator, not a financial advisor.
Monthly take-home income: [amount]
Fixed costs: [rent, EMIs, bills]
Variable spending: [food, transport, shopping…]
Goals: [emergency fund, trip, paying off a loan]

1. Organise my numbers into a budget table.
2. Suggest a realistic split and where I could save, explaining your reasoning.
3. Give a step-by-step savings plan for my goals.
4. Add a 10-minute monthly review checklist.
Use only my numbers and label any example figures as hypothetical. This is educational, not personalised financial advice; suggest when to talk to a licensed advisor.` }),
  U({ slug: "explain-investing-basics", title: "Understand an investment product before you invest", cat: "finance", sub: "financial-education", category: "Financial education", targets: [...CHAT, "perplexity"], tags: ["investing", "mutual funds", "education"],
    audience: "Beginner investors", useCase: "Learn before deciding", outputType: "Explanation",
    summary: "Plain-language explanation, risks and costs, a hypothetical example and questions for a licensed advisor.",
    body: `Explain [investment product, e.g. index mutual fund SIPs] to a beginner in [country].

Cover: how it works, costs and fees to look for, the main risks, how it's taxed in general terms (tell me to verify current rules on official sources), and a simple example with clearly hypothetical numbers.
End with 5 questions I should ask a licensed financial advisor.
This is education, not a recommendation; don't tell me what to buy and don't promise returns.` }),
  U({ slug: "health-question-safely", title: "Ask a health question responsibly", cat: "finance", sub: "health-info", category: "Health information", targets: [...CHAT, "perplexity"], tags: ["health", "wellness", "safety"],
    audience: "Anyone with a general health question", useCase: "Understand a health topic", outputType: "Explanation",
    summary: "General, sourced information with warning signs and questions for a doctor. Not a diagnosis.",
    body: `I have a general health question: [question]
Relevant context (optional): [age range, general situation]

Please give general, evidence-based information from reliable sources (e.g. WHO, national health services) and name them. Explain common causes or options in general terms, list warning signs that need prompt medical attention, and suggest questions I can ask a doctor.
This is not a diagnosis or treatment plan. Recommend that I consult a qualified healthcare professional.` }),
  U({ slug: "legal-situation-explainer", title: "Understand a legal situation (not advice)", cat: "finance", sub: "legal-info", category: "Legal information", targets: [...CHAT, "perplexity"], tags: ["legal", "rights", "tenant"],
    audience: "Tenants, consumers and employees", useCase: "Know your options", outputType: "Explanation",
    summary: "General legal position, typical options and when to consult a lawyer, for your jurisdiction.",
    body: `Jurisdiction: [country and state/city]
My situation: [describe briefly, without sharing private identifiers]
What I want: [outcome]

Explain the general legal position in plain language, cite the relevant law or official source where possible (say if unsure), list my typical options and steps (e.g. written notice, consumer forum), and tell me when I should consult a qualified lawyer.
This is general legal information, not legal advice.` }),
  U({ slug: "science-explainer-layers", title: "Science explained in layers", cat: "finance", sub: "science-tech", category: "Science explanations", targets: CHAT, tags: ["science", "explain", "curiosity"],
    audience: "Students and curious minds", useCase: "Understand how something works", outputType: "Explanation",
    summary: "From a one-line answer to the deeper mechanism, with an analogy and open questions.",
    body: `Explain [science or technology topic] in layers:
1. One-sentence answer a 10-year-old would get.
2. An everyday analogy.
3. The real mechanism for a high-school level.
4. One deeper detail for someone curious.
5. What scientists are still unsure about.
Keep it accurate; mention if something is a simplification.` }),
];
