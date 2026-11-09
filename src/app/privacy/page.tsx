import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SITE, OWNER } from "@/lib/site";

export const metadata = pageMeta({ title: "Privacy Policy", description: "How PromptPilot handles your data.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <div className="prose-simple mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Draft, last updated {SITE.lastReviewed}. This draft needs legal review before commercial launch.</p>
      <h2>What runs in your browser</h2>
      <p>The Prompt Builder, coding agent kit generator, Instagram Studio composer and Enhancer analysis run in your browser. Text you type into those forms is not sent to our servers.</p>
      <p>Share links made by the builder keep your goal after the # in the link, which browsers do not send to our servers, logs or other sites. Short links (/s/…) store only the builder settings you chose to share, so anyone with the link can open them. Exception: older links and category starter links that put the goal in the page URL (?goal=…) reach our hosting provider like any web request and may appear in its standard request logs. Don&apos;t put sensitive personal information in prompts or share links.</p>
      <h2>Saved prompts</h2>
      <ul>
        <li>If you are not signed in, saved prompts are stored in your browser&apos;s localStorage on your device.</li>
        <li>If sign-in is enabled and you sign in, saved prompts are stored in our database (Supabase), protected by row-level security so only your account can read them unless you choose to share.</li>
      </ul>
      <h2>Optional LLM enhancement</h2>
      <p>When you use &ldquo;Enhance with LLM&rdquo;, your prompt and API key are sent to our server for that single request and forwarded to the provider you chose (OpenAI, Anthropic, xAI or the URL you entered). We do not store or log the key or the prompt. The provider&apos;s own privacy policy applies to what they receive. If you tick &ldquo;Remember in this browser&rdquo;, the key is stored in your browser&apos;s localStorage on your device.</p>
      <h2>Accounts</h2>
      <p>If you sign in, we store your email address and the data you save. You can delete saved prompts at any time from the dashboard. Contact us to delete your account.</p>
      <h2 id="run">Run button (free AI run)</h2>
      <p>When the Run button is switched on and you press it, the prompt text you run is sent to our server and forwarded to one free AI provider for that single request: Groq first, then Cloudflare Workers AI if Groq is unavailable (and Google Gemini only if we turn it on; it is off by default and never used in regions where its free tier is not offered). The provider&apos;s own privacy policy applies to what they receive. We do not save the prompt or the reply on our servers. If a bot check is shown, it is Cloudflare Turnstile, which receives the check token and your IP address from Cloudflare&apos;s widget.</p>
      <p>To enforce fair-use limits we store a daily counter per visitor. The key is a one-way hash of your IP address mixed with a salt that changes every day (or your account id if you are signed in), so we do not store raw IP addresses and the hashes cannot be linked across days. The same hashed counters limit &ldquo;Enhance with LLM&rdquo; and share-card requests.</p>
      <h2>Server logs</h2>
      <p>Our API routes write one line per request to our hosting provider&apos;s logs (Vercel): method, path, status, duration and a random request id. Fields that look like keys, tokens or passwords are redacted. Prompt text is not written to these logs. Like any website, our host also keeps standard request logs (which include IP addresses) under its own policy.</p>
      <h2>Analytics and cookies</h2>
      <p>We use Vercel Web Analytics to count page views. According to <a className="link" href="https://vercel.com/docs/analytics/privacy-policy" rel="noopener noreferrer">Vercel&apos;s analytics privacy notes</a>, it does not use third-party cookies, identifies visitors by a hash created from the incoming request, and discards visitor sessions after 24 hours. Each page view records the page path, referrer, approximate location (country/region/city), browser, OS and device type. There is no advertising or third-party tracking. Sign-in (if enabled) uses browser storage needed to keep you logged in. Your theme choice, prompts you save while signed out, and an API key only if you tick &ldquo;Remember in this browser&rdquo;, stay in your browser&apos;s localStorage.</p>
      <h2>Photos</h2>
      <p>We never receive your photos. Instagram Studio prompts are pasted into third-party tools (e.g. Gemini, ChatGPT) where you upload photos under their terms. Only edit images of people who consented.</p>
      <h2 id="dpdp">Your rights in India (DPDP Act, 2023)</h2>
      <p>This section describes how we handle personal data under India&apos;s Digital Personal Data Protection Act, 2023. It is a draft pending legal review.</p>
      <h3>What we store</h3>
      <ul>
        <li><strong>Account (only if you sign in):</strong> your email address and sign-in records, kept by Supabase Auth.</li>
        <li><strong>Saved prompts (signed in):</strong> the title, prompt text, builder settings and share settings you save.</li>
        <li><strong>Short share links:</strong> the builder settings you chose to share. They aren&apos;t linked to your account.</li>
        <li><strong>Pro waitlist:</strong> your email, your consent, and the date you joined. We use it only to tell you when Pro launches.</li>
        <li><strong>Fair-use counters:</strong> a daily, salted hash of your IP address (or your account id) with a count per feature. Old days are not needed for limits.</li>
        <li><strong>Not stored by us:</strong> text in the builder while you are signed out, prompts you Run or Enhance, prompts saved in your browser (localStorage), photos, and API keys.</li>
      </ul>
      <h3>Where it is stored</h3>
      <p>Our database runs on Supabase in the <strong>South Asia (Mumbai)</strong> region. The website is hosted on Vercel.</p>
      <h3>Delete or correct your data</h3>
      <ul>
        <li>You can delete saved prompts yourself from <Link href="/dashboard">My saved prompts</Link>. To clear browser-saved prompts, clear this site&apos;s data in your browser.</li>
        <li>To delete your account, remove yourself from the waitlist, or get a copy of your data, email <strong>{OWNER.contactEmail}</strong> from the address involved. See the <Link href="/contact">contact page</Link>. We aim to reply within 30 days.</li>
        <li>You can withdraw consent for the waitlist at any time. It is as easy as giving it.</li>
        <li>Grievance officer: <strong>Raghav</strong>, {OWNER.contactEmail}.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions: see the <Link href="/contact">contact page</Link>. More about us on the <Link href="/about">About page</Link>.</p>
    </div>
  );
}
