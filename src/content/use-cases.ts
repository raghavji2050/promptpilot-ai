import type { CategoryId } from "@/lib/categories/types";

export interface UseCase {
  slug: string;
  short: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string[];
  tips: { title: string; body: string }[];
  /** Ready goals that open the builder pre-filled. */
  starters: { goal: string; sub?: string; platform?: string }[];
  /** Library slugs to feature. */
  prompts: string[];
  faqs: { q: string; a: string }[];
  categories: CategoryId[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: "content-creators", short: "Content creators", title: "AI prompts for content creators",
    metaTitle: "AI Prompts for Content Creators: Reels, YouTube, Captions & Calendars",
    description: "Free prompts and a builder for Instagram Reels, YouTube videos, captions, hooks and content calendars. Works with ChatGPT, Claude, Gemini and Grok.",
    intro: [
      "Most creators ask AI for “10 viral ideas” and get generic lists. The fix is context: your niche, who watches you, what you can realistically film, and how you'll measure progress. The prompts below bake that in.",
      "Use them to plan a month of content, script a single Reel, write hooks and captions, or turn one long video into several short ones. None of them promise virality; they help you publish consistently and learn from your own numbers.",
    ],
    tips: [
      { title: "Give the AI your audience, not just your topic", body: "“Fitness” is a topic. “Working mums who have 15 minutes at home” is an audience. The second gets ideas people actually save." },
      { title: "Ask for hooks in different angles", body: "Request a question, a bold claim, a mini-story and a number-led hook for the same idea, then test them against each other." },
      { title: "Make it filmable", body: "Tell the AI your constraints (phone only, no face, 30 minutes a day). Ideas you can't produce are useless." },
      { title: "Review with your own metrics", body: "Ask for a 2-week review step based on saves, shares and profile visits from your analytics, not made-up benchmarks." },
    ],
    starters: [
      { goal: "Help me grow my Instagram account", sub: "instagram-growth" },
      { goal: "Plan a YouTube video about my morning routine", sub: "youtube" },
      { goal: "Create a 30-day content calendar for my bakery", sub: "content-calendar" },
    ],
    prompts: ["instagram-growth-plan", "reel-script-hook-first", "caption-hook-hashtag-pack", "youtube-video-plan", "content-calendar-30-days", "thumbnail-concepts"],
    faqs: [
      { q: "Will these prompts make my content go viral?", a: "No prompt can guarantee that. These prompts help you plan consistent, audience-focused content and review what works using your own analytics." },
      { q: "Which AI is best for content ideas?", a: "Any capable chat assistant works. Pick the one you already use; the builder formats the same inputs for ChatGPT, Claude, Gemini or Grok." },
      { q: "Can I use them in Hindi or Hinglish?", a: "Yes. In the builder, open More options and choose a response language." },
    ],
    categories: ["social", "design"],
  },
  {
    slug: "small-businesses", short: "Small businesses", title: "AI prompts for small businesses",
    metaTitle: "AI Prompts for Small Businesses: Marketing, Sales, Support & Planning",
    description: "Practical AI prompts for small business owners: validate ideas, analyse competitors, plan marketing, write sales scripts, reply to customers and write product listings.",
    intro: [
      "Small business owners wear every hat. AI can take the first draft off your plate for marketing plans, customer replies, product listings and competitor research, as long as you give it your real numbers and constraints.",
      "These prompts are built to avoid the usual AI problems: invented statistics, promises you can't keep and copy that sounds like everyone else. Each one asks the AI to label assumptions and stick to the facts you provide.",
    ],
    tips: [
      { title: "Share your budget and location", body: "A marketing plan for ₹10,000 a month in Indore looks very different from one with no budget stated." },
      { title: "Ask the AI to separate facts from assumptions", body: "Especially for market research. Anything it estimates should be labelled so you can verify it." },
      { title: "Keep your policy in the prompt", body: "For customer support replies, paste your refund or replacement policy so the AI doesn't promise something you don't offer." },
      { title: "Never let it invent product specs", body: "For listings, give the real features and tell it to use only those." },
    ],
    starters: [
      { goal: "Create a marketing plan for my home bakery with a small budget", sub: "marketing" },
      { goal: "Validate my business idea before I spend money", sub: "startup-validation" },
      { goal: "Reply to a customer whose order arrived damaged", sub: "customer-support" },
    ],
    prompts: ["validate-business-idea", "competitor-analysis-swot", "small-business-marketing-plan", "sales-call-script", "customer-complaint-reply", "product-listing-copy"],
    faqs: [
      { q: "Is this a replacement for an accountant or lawyer?", a: "No. Business plan and finance prompts include a reminder to verify numbers and consult qualified professionals for legal, tax or financial decisions." },
      { q: "Do I need a paid AI plan?", a: "No. The builder creates the prompt for free; paste it into the free tier of any AI assistant." },
      { q: "Can I save prompts I reuse every week?", a: "Yes. Save prompts in your browser without an account, or sign in to sync them." },
    ],
    categories: ["business", "writing"],
  },
  {
    slug: "students", short: "Students", title: "AI prompts for students",
    metaTitle: "AI Prompts for Students: Study Plans, Exam Prep, Flashcards & Explanations",
    description: "Learn faster with AI prompts for study plans, exam revision, flashcards, quizzes and simple explanations. Designed to help you understand, not just copy answers.",
    intro: [
      "AI is most useful for learning when it acts like a tutor: it checks what you know, explains one step at a time and makes you practise. These prompts are set up that way.",
      "Use them to build a revision timetable up to your exam date, turn notes into flashcards, get a concept explained with an analogy, or practise with a Socratic tutor that gives hints instead of answers.",
    ],
    tips: [
      { title: "Tell it your level and deadline", body: "“Beginner, exam in 3 weeks, 2 hours a day” produces a plan you can follow." },
      { title: "Ask it to quiz you", body: "Retrieval practice works better than re-reading. Ask for questions one at a time and wait before seeing the answer." },
      { title: "Use your own notes", body: "Paste your class notes and ask for flashcards using only them, so you study what your exam covers." },
      { title: "Check facts and citations", body: "AI can be wrong or invent sources. Verify important facts with your textbook or teacher." },
    ],
    starters: [
      { goal: "Make a study plan for my board exams in 6 weeks", sub: "exam-prep" },
      { goal: "Explain photosynthesis in simple words", sub: "explain-simply" },
      { goal: "Make 20 flashcards from my history notes", sub: "quiz-flashcards" },
    ],
    prompts: ["learn-anything-step-by-step", "exam-revision-plan", "flashcards-from-notes", "explain-like-im-new", "gemini-study-plan", "science-explainer-layers"],
    faqs: [
      { q: "Is using AI for studying cheating?", a: "It depends on your school's rules. These prompts focus on understanding and practice, not on producing work to submit as your own. Check your institution's policy." },
      { q: "Which exams does this support?", a: "Any. Name your exam and the prompt asks the AI to work from the official syllabus, which you should confirm." },
      { q: "Can it explain in Hindi?", a: "Yes, choose Hindi or Hinglish as the response language in the builder." },
    ],
    categories: ["education", "data"],
  },
  {
    slug: "job-interviews", short: "Job interviews", title: "AI prompts for job interviews",
    metaTitle: "AI Prompts for Job Interviews: Mock Interviews, STAR Answers & Questions",
    description: "Prepare for interviews with AI: likely questions for your role, STAR answer structures from your real experience, mock interviews with feedback and questions to ask.",
    intro: [
      "Good interview preparation is specific: the role, the company and your actual experience. Generic “top 50 interview questions” lists don't help much. These prompts make the AI act as an interviewer for your situation.",
      "The interview coach prompt runs a mock interview one question at a time and gives feedback on your answers. It never invents experience for you; it asks for your real examples and helps you structure them.",
    ],
    tips: [
      { title: "Paste the job description", body: "The AI can then predict role-specific questions and the skills to emphasise." },
      { title: "Practise out loud", body: "Type or speak your answer to each mock question, then ask for a stronger version and practise again." },
      { title: "Prepare 5 STAR stories", body: "Most behavioural questions can be answered with a handful of well-structured stories from your experience." },
      { title: "Prepare your own questions", body: "Ask the AI for thoughtful questions about the team and role, not ones answered on the company website." },
    ],
    starters: [
      { goal: "Help me prepare for an interview", sub: "interview-prep" },
      { goal: "Improve my resume for a customer success role", sub: "resume" },
      { goal: "Help me negotiate my salary offer", sub: "workplace-comms" },
    ],
    prompts: ["job-interview-coach", "resume-bullet-upgrade", "resume-bullets", "salary-raise-conversation", "professional-email-any-situation"],
    faqs: [
      { q: "Does this work for non-technical roles?", a: "Yes. The interview prompt is general. Name your role, whether sales, HR, teaching or design, and the questions adapt." },
      { q: "Will the AI make up achievements for me?", a: "The prompts tell it not to. Where it needs your examples it inserts placeholders for you to fill in." },
      { q: "Can I practise a technical interview?", a: "Yes. Set the interview type to technical. For coding practice, the Coding category has dedicated prompts." },
    ],
    categories: ["career", "writing"],
  },
  {
    slug: "image-generation", short: "Image generation", title: "AI prompts for image generation",
    metaTitle: "AI Image Prompts: Midjourney, ChatGPT Images, Gemini, FLUX & Video Tools",
    description: "Build detailed image and video prompts with subject, style, lighting, composition and aspect ratio. Formats for Midjourney, natural-language image tools and text-to-video.",
    intro: [
      "Image models respond to concrete visual details: what the subject is doing, the style or medium, the lighting, the camera framing, the mood and the aspect ratio. Vague prompts like “a beautiful sunset” leave all of that to chance.",
      "Pick Midjourney and the builder outputs comma-separated descriptors with parameters such as --ar. Pick a natural-language tool and it writes clear sentences instead. Video prompts add shot type, camera movement and duration.",
    ],
    tips: [
      { title: "Lighting changes everything", body: "“Soft golden-hour light from the left” does more than five adjectives about beauty." },
      { title: "Say what to avoid", body: "List unwanted elements such as text, watermarks or extra fingers." },
      { title: "Match the aspect ratio to where it's used", body: "4:5 for Instagram feed, 9:16 for Stories and Reels, 16:9 for YouTube thumbnails." },
      { title: "Edit photos only with consent", body: "Photo-edit prompts keep the person's identity, but only edit photos of yourself or people who agreed." },
    ],
    starters: [
      { goal: "A cozy reading nook on a rainy evening", sub: "image-generation", platform: "midjourney" },
      { goal: "Product photo of a handmade soap bar on marble", sub: "product-photo", platform: "image-generic" },
      { goal: "A barista pouring latte art in slow motion", sub: "video-generation", platform: "video" },
    ],
    prompts: ["product-photo-prompt", "logo-concepts-brief", "video-shot-prompt", "thumbnail-concepts", "midjourney-product-hero", "linkedin-headshot"],
    faqs: [
      { q: "Can ChatGPT, Gemini or Grok create images?", a: "Some plans and apps include image generation; it depends on the product and your plan. The builder writes the prompt; check your tool for what it supports." },
      { q: "Why do Midjourney prompts look different?", a: "Midjourney documents parameters such as --ar and --no. Other tools expect natural-language descriptions, so the builder formats each differently." },
      { q: "Do you generate the images?", a: "No. PromptPilot only writes prompts. You paste them into the image or video tool you use." },
    ],
    categories: ["design", "social"],
  },
  {
    slug: "marketing", short: "Marketing", title: "AI prompts for marketing",
    metaTitle: "AI Prompts for Marketing: Plans, Copy, Campaigns, SEO Articles & Ads",
    description: "Marketing prompts for strategy, messaging, campaigns, blog posts, ad concepts and competitor research, built to avoid invented stats and empty hype.",
    intro: [
      "AI writes marketing copy quickly, but without direction it produces the same hype-filled sentences as everyone else. Good marketing prompts start with the customer: their problem, their buying trigger and the words they use.",
      "These prompts cover the full loop: understand the customer and competitors, choose channels that fit your budget, write the copy and plan how to measure results. Each one tells the AI not to invent statistics or promise results.",
    ],
    tips: [
      { title: "Start with the buying trigger", body: "What happens in a customer's life right before they look for you? Build the message around that moment." },
      { title: "Constrain the channels", body: "Ask for 2–3 channels that fit your budget and explain why, instead of a list of every channel." },
      { title: "Mark numbers that need sources", body: "For articles and reports, ask the AI to flag any figure as [source needed] instead of inventing one." },
      { title: "Plan the measurement up front", body: "Decide which metric each activity should move before you start." },
    ],
    starters: [
      { goal: "Create a marketing plan for my handmade candle business", sub: "marketing" },
      { goal: "Write a blog post about choosing a first electric scooter", sub: "blog-newsletter" },
      { goal: "Create a poster concept for our festive sale", sub: "posters-ads" },
    ],
    prompts: ["small-business-marketing-plan", "competitor-analysis-swot", "caption-hook-hashtag-pack", "linkedin-insight-post", "chatgpt-cold-email", "content-calendar-30-days"],
    faqs: [
      { q: "Can AI write my ads?", a: "It can draft headlines and concepts. Review claims for accuracy and check each ad platform's policies before publishing." },
      { q: "Are the SEO article prompts safe from fake stats?", a: "They tell the AI to mark unsupported numbers as [source needed]. Always verify before publishing." },
      { q: "Which platform should I use?", a: "For research with citations, Perplexity-style search assistants help. For drafting copy, any chat assistant works." },
    ],
    categories: ["business", "social", "writing"],
  },
  {
    slug: "personal-productivity", short: "Personal productivity", title: "AI prompts for personal productivity",
    metaTitle: "AI Prompts for Productivity: Daily Planning, Habits, Goals, Travel & Meals",
    description: "Use AI to plan your day, set goals, build habits, beat procrastination, plan trips and organise weekly meals with prompts that fit your real schedule.",
    intro: [
      "Productivity advice fails when it ignores your actual life. These prompts start from your real hours, commitments, energy levels and constraints, then build plans you can follow.",
      "Plan today with time blocks, turn a vague resolution into measurable milestones, design a habit that survives missed days, or get a day-by-day itinerary and a weekly meal plan with a grocery list.",
    ],
    tips: [
      { title: "List everything, then let the AI prioritise", body: "Dump all tasks and ask for must / should / could, with what to drop." },
      { title: "Include your energy pattern", body: "Tell it when you focus best so deep work lands in the right hours." },
      { title: "Start habits tiny", body: "Ask for the smallest version you can do daily, attached to something you already do." },
      { title: "Verify travel details", body: "Prices, opening hours and visa rules change. The travel prompt marks what to check." },
    ],
    starters: [
      { goal: "Plan my day: I have 8 tasks and two meetings", sub: "daily-planning" },
      { goal: "Plan a 5-day trip to Kerala on a budget", sub: "travel" },
      { goal: "Make a vegetarian meal plan for a family of four", sub: "meal-planning" },
    ],
    prompts: ["plan-my-day-time-blocks", "habit-system-design", "trip-itinerary-budget", "weekly-meal-plan", "meeting-notes-summary", "monthly-budget-builder"],
    faqs: [
      { q: "Do I need to share personal data?", a: "Only what's useful for the plan. Avoid pasting sensitive information such as ID numbers or passwords into any AI tool." },
      { q: "Can it account for a medical diet?", a: "The meal plan prompt reminds you to follow your doctor's or dietitian's advice for medical diets." },
      { q: "Is anything stored?", a: "Prompts are built in your browser. Nothing is saved unless you press Save." },
    ],
    categories: ["productivity", "finance"],
  },
  {
    slug: "research-and-analysis", short: "Research & analysis", title: "AI prompts for research and data analysis",
    metaTitle: "AI Prompts for Research & Data Analysis: Sources, Spreadsheets, Surveys",
    description: "Prompts for sourced research, spreadsheet formulas, data analysis, survey themes, document Q&A and side-by-side comparisons, with guardrails against invented numbers.",
    intro: [
      "The biggest risk when using AI for research is confident, invented detail. These prompts ask for cited and dated sources, quotes from your documents, calculations shown step by step, and clear labels for anything uncertain.",
      "Use them to get a working Excel or Google Sheets formula, find patterns in a dataset, code open-ended survey answers into themes, compare alternatives against your criteria, or answer questions from a long document.",
    ],
    tips: [
      { title: "Use a search assistant for current facts", body: "Perplexity-style tools can search the web and cite sources; chat assistants without browsing may be out of date." },
      { title: "Describe your sheet layout", body: "Column letters, header rows and ranges make formulas work the first time." },
      { title: "Ask for quotes", body: "For document questions, require a supporting quote for each answer, or “Not in document”." },
      { title: "Respect sample sizes", body: "Ask the AI to note when a survey sample is too small to generalise." },
    ],
    starters: [
      { goal: "Excel formula to sum sales by month", sub: "spreadsheet" },
      { goal: "Analyze these customer survey responses", sub: "survey-analysis" },
      { goal: "Research the latest trends in electric vehicle adoption in India", sub: "research-workflow", platform: "perplexity" },
    ],
    prompts: ["spreadsheet-formula-helper", "analyze-data-insights", "survey-results-themes", "compare-options-table", "perplexity-sourced-research", "claude-document-analysis"],
    faqs: [
      { q: "Can AI analyse my spreadsheet file?", a: "Some assistants accept file uploads, depending on the product and plan. Otherwise paste a sample of rows. The prompt works either way." },
      { q: "How do I avoid fake citations?", a: "Ask for links and dates, then open them. The research prompts instruct the AI to say when it cannot find a source." },
      { q: "Is my data sent anywhere by PromptPilot?", a: "No. The builder runs in your browser. Data only goes to the AI tool you paste the prompt into." },
    ],
    categories: ["data", "education"],
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
