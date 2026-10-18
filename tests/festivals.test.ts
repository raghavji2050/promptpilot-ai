import { describe, expect, it } from "vitest";
import {
  FESTIVALS, FESTIVAL_GOALS, SOURCES, activeCampaign, addDays, applyOverrides, countdown, daysBetween, formatDate, formatRange,
  getFestival, isISODate, istToday, nextFestival, nextInstance, occurrencesFor, upcomingInstances, type Festival,
} from "@/lib/festivals";

const names = (list: { festival: Festival }[]) => list.map((i) => i.festival.slug);

describe("IST date utilities", () => {
  it("istToday uses +05:30 regardless of the host time zone", () => {
    expect(istToday(Date.parse("2026-10-17T18:29:59Z"))).toBe("2026-10-17");
    expect(istToday(Date.parse("2026-10-17T18:30:00Z"))).toBe("2026-10-18"); // IST midnight
    expect(istToday(new Date("2026-12-31T18:30:00Z"))).toBe("2027-01-01"); // year rollover in IST before UTC
    expect(istToday(new Date("2026-12-31T18:29:00Z"))).toBe("2026-12-31");
  });
  it("daysBetween / addDays across month, year and leap boundaries", () => {
    expect(daysBetween("2026-10-18", "2026-11-08")).toBe(21);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2027-01-01", "2026-12-25")).toBe(-7);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-01-05", -10)).toBe("2026-12-26");
  });
  it("validates dates strictly", () => {
    expect(isISODate("2026-11-08")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("8 Nov 2026")).toBe(false);
    expect(() => daysBetween("bad", "2026-01-01")).toThrow();
  });
  it("formats deterministically", () => {
    expect(formatDate("2026-11-08")).toBe("Sun, 8 Nov 2026");
    expect(formatRange("2026-11-06", "2026-11-11")).toBe("6–11 Nov 2026");
    expect(formatRange("2026-10-11", "2026-10-21")).toBe("11–21 Oct 2026");
    expect(formatRange("2027-09-30", "2027-10-09")).toBe("30 Sep – 9 Oct 2027");
    expect(formatRange("2026-12-31", "2027-01-01")).toBe("31 Dec 2026 – 1 Jan 2027");
    expect(formatRange("2026-11-15", "2026-11-15")).toBe("15 Nov 2026");
  });
});

describe("festival data integrity", () => {
  it("has unique slugs, valid dates, sources and goals", () => {
    const slugs = new Set<string>();
    const goalIds = new Set(FESTIVAL_GOALS.map((g) => g.id));
    for (const f of FESTIVALS) {
      expect(slugs.has(f.slug), f.slug).toBe(false);
      slugs.add(f.slug);
      expect(f.slug).toMatch(/^[a-z0-9-]+$/);
      expect(f.goals.length).toBeGreaterThan(2);
      f.goals.forEach((g) => expect(goalIds.has(g)).toBe(true));
      expect(f.care.length).toBeGreaterThan(0);
      expect(f.fixed || f.occurrences.length > 0, f.slug).toBeTruthy();
      for (const o of f.occurrences) {
        [o.start, o.end, o.primary, o.lastVerified].forEach((d) => expect(isISODate(d), `${f.slug} ${d}`).toBe(true));
        expect(o.start <= o.primary && o.primary <= o.end, f.slug).toBe(true);
        expect(Number(o.primary.slice(0, 4))).toBe(o.year);
        expect(o.sources.length).toBeGreaterThan(0);
        o.sources.forEach((s) => expect(SOURCES[s], s).toBeTruthy());
        if (o.status === "provisional") expect(o.note, `${f.slug} provisional needs a note`).toBeTruthy();
      }
    }
  });
  it("matches the researched key dates", () => {
    const d = (slug: string) => nextInstance(getFestival(slug)!, "2026-10-18")!.occurrence.primary;
    expect(d("dussehra")).toBe("2026-10-20");
    expect(d("karwa-chauth")).toBe("2026-10-29");
    expect(d("dhanteras")).toBe("2026-11-06");
    expect(d("diwali")).toBe("2026-11-08");
    expect(d("bhai-dooj")).toBe("2026-11-11");
    expect(d("chhath-puja")).toBe("2026-11-15");
    expect(d("guru-nanak-jayanti")).toBe("2026-11-24");
    expect(d("christmas")).toBe("2026-12-25");
    expect(d("republic-day")).toBe("2027-01-26");
    expect(d("holi")).toBe("2027-03-22");
    expect(getFestival("govardhan-puja")!.occurrences[0].status).toBe("provisional");
  });
});

describe("next festival, retirement and rollover", () => {
  it("on 18 Oct 2026 the ongoing Navratri/Durga Puja comes first, then Dussehra", () => {
    const up = upcomingInstances(FESTIVALS, "2026-10-18");
    expect(names(up).slice(0, 3)).toEqual(["durga-puja", "dussehra", "karwa-chauth"]);
    expect(countdown(up[0], "2026-10-18").phase).toBe("ongoing");
    expect(countdown(up[1], "2026-10-18")).toMatchObject({ phase: "upcoming", days: 2, label: "In 2 days" });
  });
  it("festival day itself is 'Today' and still listed", () => {
    const up = upcomingInstances(FESTIVALS, "2026-11-08");
    const diwali = up.find((i) => i.festival.slug === "diwali")!;
    expect(countdown(diwali, "2026-11-08")).toMatchObject({ phase: "today", days: 0, label: "Today" });
    const kc = upcomingInstances(FESTIVALS, "2026-10-29").find((i) => i.festival.slug === "karwa-chauth")!;
    expect(countdown(kc, "2026-10-29").label).toBe("Today");
  });
  it("the day after a one-day festival retires it", () => {
    const keys = upcomingInstances(FESTIVALS, "2026-10-30").map((i) => `${i.festival.slug}:${i.occurrence.year}`);
    expect(keys).not.toContain("karwa-chauth:2026");
    expect(keys).toContain("karwa-chauth:2027");
    expect(nextInstance(getFestival("karwa-chauth")!, "2026-10-30")!.occurrence.year).toBe(2027);
  });
  it("multi-day festival stays 'on now' after its main day until its end", () => {
    const diwali = upcomingInstances(FESTIVALS, "2026-11-10").find((i) => i.festival.slug === "diwali")!;
    expect(countdown(diwali, "2026-11-10")).toMatchObject({ phase: "ongoing", label: "On now · until 11 Nov" });
    expect(upcomingInstances(FESTIVALS, "2026-11-12").some((i) => i.festival.slug === "diwali" && i.occurrence.year === 2026)).toBe(false);
  });
  it("tomorrow label", () => {
    const i = upcomingInstances(FESTIVALS, "2026-11-23").find((x) => x.festival.slug === "guru-nanak-jayanti")!;
    expect(countdown(i, "2026-11-23").label).toBe("Tomorrow");
  });
  it("Dec to Jan rollover: fixed dates regenerate for the next year", () => {
    expect(nextFestival(FESTIVALS, "2026-12-26")!.festival.slug).toBe("new-year");
    expect(nextFestival(FESTIVALS, "2026-12-26")!.occurrence.primary).toBe("2027-01-01");
    const xmas = nextInstance(getFestival("christmas")!, "2026-12-26")!;
    expect(xmas.occurrence.primary).toBe("2027-12-25");
    expect(daysBetween("2026-12-31", nextFestival(FESTIVALS, "2026-12-31")!.occurrence.primary)).toBe(1);
    // Lohri and Makar Sankranti share 14 Jan 2027; the higher-priority Sankranti is listed first.
    expect(names(upcomingInstances(FESTIVALS, "2027-01-02")).slice(0, 2)).toEqual(["makar-sankranti", "lohri"]);
  });
  it("festivals with no known future date return null instead of a stale one", () => {
    expect(nextInstance(getFestival("lohri")!, "2027-01-15")).toBeNull();
  });
  it("fixed-date generation does not duplicate explicit data", () => {
    const f: Festival = { ...getFestival("christmas")!, occurrences: [{ year: 2026, start: "2026-12-24", end: "2026-12-25", primary: "2026-12-25", status: "verified", sources: ["DoPT26"], lastVerified: "2026-10-18" }] };
    const occ = occurrencesFor(f, 2026, 2027);
    expect(occ.map((o) => o.start)).toEqual(["2026-12-24", "2027-12-25"]);
  });
});

describe("campaign windows", () => {
  it("Diwali campaign opens leadDays before Dhanteras and closes after Bhai Dooj", () => {
    const d = nextInstance(getFestival("diwali")!, "2026-10-18")!;
    expect(d.campaignStart).toBe("2026-10-07");
    expect(d.campaignEnd).toBe("2026-11-11");
  });
  it("active campaign picks the soonest main day among overlapping windows", () => {
    expect(activeCampaign(FESTIVALS, "2026-10-18")!.festival.slug).toBe("durga-puja");
    expect(activeCampaign(FESTIVALS, "2026-10-21")!.festival.slug).toBe("durga-puja"); // Bijoya Dashami
    expect(activeCampaign(FESTIVALS, "2026-10-22")!.festival.slug).toBe("karwa-chauth");
    expect(activeCampaign(FESTIVALS, "2026-11-01")!.festival.slug).toBe("dhanteras");
    expect(activeCampaign(FESTIVALS, "2026-11-08")!.festival.slug).toBe("diwali");
    expect(activeCampaign(FESTIVALS, "2026-12-20")!.festival.slug).toBe("christmas");
  });
  it("no expired campaign is ever returned", () => {
    for (let i = 0; i < 200; i++) {
      const day = addDays("2026-10-01", i);
      const a = activeCampaign(FESTIVALS, day);
      if (a) expect(a.campaignEnd >= day && a.occurrence.end >= day, day).toBe(true);
    }
  });
});

describe("admin overrides", () => {
  it("replaces dates, status and campaign window for a known slug/year", () => {
    const out = applyOverrides(FESTIVALS, [{ slug: "govardhan-puja", year: 2026, primary_date: "2026-11-10", start_date: "2026-11-10", end_date: "2026-11-10", status: "verified", campaign_start: "2026-11-01" }]);
    const g = nextInstance(getFestival("govardhan-puja", out)!, "2026-10-18")!;
    expect(g.occurrence).toMatchObject({ primary: "2026-11-10", status: "verified" });
    expect(g.campaignStart).toBe("2026-11-01");
    expect(getFestival("govardhan-puja")!.occurrences[0].primary).toBe("2026-11-09"); // static data untouched
  });
  it("adds a new year's occurrence and can hide one", () => {
    const out = applyOverrides(FESTIVALS, [
      { slug: "lohri", year: 2028, primary_date: "2028-01-13", status: "provisional", note: "admin" },
      { slug: "karwa-chauth", year: 2026, hidden: true },
    ]);
    expect(nextInstance(getFestival("lohri", out)!, "2027-01-15")!.occurrence.primary).toBe("2028-01-13");
    expect(upcomingInstances(out, "2026-10-18").some((i) => i.festival.slug === "karwa-chauth" && i.occurrence.year === 2026)).toBe(false);
  });
  it("ignores unknown slugs, invalid dates and inconsistent ranges", () => {
    const out = applyOverrides(FESTIVALS, [
      { slug: "made-up", year: 2026, primary_date: "2026-11-01" },
      { slug: "diwali", year: 2026, primary_date: "2026-13-40" },
      { slug: "diwali", year: 2026, primary_date: "2026-12-01" }, // outside start..end
      "garbage",
    ]);
    expect(getFestival("diwali", out)!.occurrences[0].primary).toBe("2026-11-08");
    expect(out.length).toBe(FESTIVALS.length);
  });
});
