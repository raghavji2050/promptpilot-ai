/**
 * Job Hunting pack: deterministic builder presets tuned for the Indian job market.
 * Each template is a fixed UniversalInput; the prompt text comes from buildUniversal (no network, no randomness).
 */
import type { UniversalInput } from "@/lib/engine/universal";

export const INDIA_JOB_RULES = [
  "Use Indian job-market conventions: CTC in LPA (lakhs per annum), fixed vs variable pay, notice period (e.g. 30/60/90 days) and possible notice-period buyout",
  "Assume the application goes through Naukri, LinkedIn, company career pages or referrals",
  "The candidate may write in Hinglish (Hindi in Latin script); understand it, but write the final output in clear professional English unless asked otherwise",
  "Never invent experience, employers, metrics or salary figures; use [placeholders] for anything missing",
].join("\n");

export interface PackTemplate {
  id: string;
  title: string;
  blurb: string;
  /** Example Hinglish goal the builder also understands. */
  hinglish: string;
  input: UniversalInput;
}

const base = (goal: string, subcategoryId: string, extra: Partial<UniversalInput> = {}): UniversalInput => ({
  goal, subcategoryId, targetId: "chatgpt", constraints: INDIA_JOB_RULES, ...extra,
});

export const JOB_HUNTING_PACK: PackTemplate[] = [
  { id: "resume-bullets", title: "Resume bullets (ATS-friendly)", blurb: "Rewrite bullets as action + result for Naukri and LinkedIn ATS filters.",
    hinglish: "Mera resume banana hai data analyst role ke liye",
    input: base("Rewrite my resume bullets for a [target role] job in India, ATS-friendly for Naukri and LinkedIn", "resume", { format: "Bullet points" }) },
  { id: "cover-letter", title: "Cover letter", blurb: "A one-page letter mapped to the job description, mentioning notice period honestly.",
    hinglish: "Is job ke liye cover letter likhna hai",
    input: base("Write a cover letter for a [target role] job at [company] in India; mention my notice period of [X] days", "cover-letter", { format: "Email" }) },
  { id: "interview-hr", title: "Interview prep: HR round", blurb: "Tell me about yourself, why are you leaving, expected CTC and notice period questions.",
    hinglish: "HR round ki interview ki taiyari karni hai",
    input: base("Prepare me for the HR round of a [target role] interview in India, including questions on current CTC, expected CTC and notice period", "interview-prep") },
  { id: "interview-technical", title: "Interview prep: technical round", blurb: "Likely technical questions with a one-at-a-time mock interview.",
    hinglish: "Technical round ke liye mock interview lo",
    input: base("Run a mock technical round for a [target role] interview at [company] in India", "interview-prep") },
  { id: "salary-negotiation", title: "Salary negotiation", blurb: "Counter an offer on CTC in LPA, fixed vs variable, joining bonus and notice buyout.",
    hinglish: "Offer mila hai 12 LPA, salary badhana hai",
    input: base("Help me negotiate my job offer in India: current offer [X] LPA fixed + [Y] LPA variable, notice period [N] days", "salary-negotiation", { format: "Table" }) },
  { id: "linkedin-summary", title: "LinkedIn summary", blurb: "Headline options and an About section recruiters can search.",
    hinglish: "Mera LinkedIn summary likh do",
    input: base("Write my LinkedIn headline and summary for a [target role] job search in India", "linkedin-summary") },
];
