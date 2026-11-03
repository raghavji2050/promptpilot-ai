/** Students, Small business and Freelancer packs: deterministic builder presets tuned for India. */
import type { UniversalInput } from "@/lib/engine/universal";
import type { PackTemplate } from "./job-hunting-pack";

const NO_INVENT = "Never invent facts, numbers, prices, marks, reviews or client names; use [placeholders] for anything missing";
const HINGLISH = "The user may write in Hinglish (Hindi in Latin script); understand it, but reply in clear English unless asked otherwise";

export const STUDENT_RULES = ["Use Indian education context: CBSE/ICSE/state boards, JEE, NEET, CUET, UPSC and university semester exams", HINGLISH, NO_INVENT].join("\n");
export const SHOP_RULES = ["Use Indian small-business context: prices in ₹ (INR), GST where relevant, local shop or kirana customers, WhatsApp Business and Google Business Profile", HINGLISH, NO_INVENT].join("\n");
export const FREELANCE_RULES = ["Use Indian freelancer context: rates in ₹ or USD for overseas clients, GST invoices, TDS where relevant, Upwork, Fiverr, LinkedIn and referrals", HINGLISH, NO_INVENT].join("\n");

const mk = (rules: string) => (goal: string, subcategoryId: string, extra: Partial<UniversalInput> = {}): UniversalInput => ({ goal, subcategoryId, targetId: "chatgpt", constraints: rules, ...extra });
const s = mk(STUDENT_RULES), b = mk(SHOP_RULES), f = mk(FREELANCE_RULES);

export const STUDENT_PACK: PackTemplate[] = [
  { id: "study-plan", title: "Exam study plan", blurb: "A day-by-day timetable to your exam date, with revision slots.", hinglish: "Board exam ke liye study plan banao", input: s("Make a day-by-day study plan for my [exam] on [date], [hours] hours a day", "study-plan") },
  { id: "explain-topic", title: "Explain a topic simply", blurb: "Any chapter explained in simple words with an everyday Indian example.", hinglish: "Mujhe photosynthesis simple mein samjhao", input: s("Explain [topic] from [class/subject] simply with an everyday example", "explain-simply") },
  { id: "practice-quiz", title: "Practice quiz", blurb: "MCQs in your exam pattern, answers at the end.", hinglish: "Is chapter pe quiz banao MCQ wala", input: s("Make a 10-question MCQ practice quiz on [chapter] in [exam] pattern, answers at the end", "quiz-flashcards") },
  { id: "doubt-tutor", title: "Doubt-solving tutor", blurb: "Step-by-step hints, so you solve it yourself.", hinglish: "Mera tutor bano, maths ka doubt step by step samjhao", input: s("Act as my tutor for this [subject] question and guide me step by step with hints: [question]", "tutor") },
  { id: "summary-notes", title: "Chapter summary notes", blurb: "Short revision notes and key points from your text.", hinglish: "Is chapter ka summary bana do", input: s("Summarise this chapter into short revision notes with key points: [paste text]", "summarization", { format: "Bullet points" }) },
];

export const SHOP_PACK: PackTemplate[] = [
  { id: "whatsapp-offer", title: "WhatsApp offer message", blurb: "A short broadcast for an offer, with price in ₹ and a clear call to action.", hinglish: "Diwali sale ke liye WhatsApp message likho dukaan ke liye", input: b("Write a WhatsApp Business broadcast for my [shop type] announcing [offer] at ₹[price], valid till [date]", "sales-scripts") },
  { id: "customer-reply", title: "Customer reply", blurb: "Polite replies to price, delivery or complaint messages.", hinglish: "Customer complaint ka reply likhna hai", input: b("Write a polite WhatsApp reply to a customer about [issue] for my [shop type]", "customer-support") },
  { id: "instagram-caption", title: "Shop Instagram caption", blurb: "Caption plus hashtags for a product photo.", hinglish: "Meri dukaan ke product ke liye Instagram caption likho", input: b("Write an Instagram caption with 5 hashtags for [product] at my [shop type] in [city]", "captions-hooks") },
  { id: "product-listing", title: "Product listing", blurb: "Title, bullets and description for Meesho, Amazon or your catalogue.", hinglish: "Online bechne ke liye product description likho", input: b("Write an online product listing (title, 5 bullets, description) for [product] priced ₹[price]", "ecommerce") },
  { id: "poster-text", title: "Offer poster text", blurb: "Headline and short lines for a shop poster or banner.", hinglish: "Shop ke poster ke liye text chahiye", input: b("Write headline and short text for a shop poster announcing [offer] at my [shop type]", "posters-ads") },
];

export const FREELANCER_PACK: PackTemplate[] = [
  { id: "proposal", title: "Client proposal", blurb: "A clear proposal with scope, timeline and price, ready for Upwork or email.", hinglish: "Client ke liye proposal likhna hai website project ka", input: f("Write a proposal for [client] for a [project] with scope, timeline and price of [₹/USD amount]", "freelancing") },
  { id: "cold-pitch", title: "Cold pitch email", blurb: "A short first message to a potential client.", hinglish: "Naye client ko cold email bhejna hai", input: f("Write a short cold email pitching my [service] to [type of client]", "email", { format: "Email" }) },
  { id: "rate-negotiation", title: "Rate negotiation", blurb: "Hold your price politely when a client pushes back.", hinglish: "Client rate kam karwana chahta hai, freelance rate negotiate karna hai", input: f("Help me reply to a client who wants my [service] rate lowered from [amount]", "freelancing") },
  { id: "payment-reminder", title: "Payment reminder", blurb: "Firm, friendly reminders for overdue invoices.", hinglish: "Client ne payment nahi kiya, payment reminder email likho", input: f("Write a polite but firm payment reminder for invoice [number] of [amount], overdue by [days] days", "workplace-comms", { format: "Email" }) },
  { id: "portfolio-bio", title: "Portfolio bio", blurb: "A short bio for your Upwork, Fiverr or LinkedIn profile.", hinglish: "Upwork profile ke liye bio likho", input: f("Write a short freelancer bio for my [service] profile on [platform]", "personal-brand") },
];

export interface PackDef { slug: string; title: string; heading: string; lead: string; hinglishLine: string; items: PackTemplate[] }

export const MORE_PACKS: PackDef[] = [
  { slug: "students", title: "Students & Exams Prompt Pack for India | PromptPilot AI", heading: "Students & Exams pack for India", lead: "Five prompts for study plans, simple explanations, practice quizzes, doubt solving and revision notes. Tuned for boards, JEE, NEET, CUET and university exams.", hinglishLine: "Hinglish mein likho, jaise “exam ki taiyari karni hai”.", items: STUDENT_PACK },
  { slug: "small-business", title: "Small Business & WhatsApp Prompt Pack for India | PromptPilot AI", heading: "Small Business pack for India", lead: "Five prompts for shop owners: WhatsApp offers, customer replies, Instagram captions, product listings and poster text, with prices in ₹.", hinglishLine: "Hinglish mein likho, jaise “dukaan ke liye offer message chahiye”.", items: SHOP_PACK },
  { slug: "freelancers", title: "Freelancer Prompt Pack for India | PromptPilot AI", heading: "Freelancer pack for India", lead: "Five prompts for proposals, cold pitches, rate negotiation, payment reminders and your portfolio bio. Works for Indian and overseas clients.", hinglishLine: "Hinglish mein likho, jaise “client ko proposal bhejna hai”.", items: FREELANCER_PACK },
];
