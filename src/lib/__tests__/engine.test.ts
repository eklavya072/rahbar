import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { evaluate } from "../engine/evaluate";
import { RULES } from "../engine/rules";
import { EMPTY_FACTS, type Facts } from "../engine/types";
import { rankQuestions } from "../engine/questions";
import { buildPlan } from "../engine/planner";
import { SAMPLE_CASES } from "../samples/cases";
import { runSampleCase } from "../samples/pipeline";
import { coverYearMatches, datesIn, nameMatches } from "../docs/parsers";

// ---------------- Golden sample cases ----------------
describe("golden sample cases", () => {
  for (const c of SAMPLE_CASES) {
    it(`${c.id}: statuses and confirmed total match expectations`, () => {
      const { summary } = runSampleCase(c);
      const byId = Object.fromEntries(summary.results.map((r) => [r.id, r.status]));
      for (const [id, expected] of Object.entries(c.expected)) {
        if (expected === "hidden") expect(byId[id], `${id} should be hidden`).toBeUndefined();
        else expect(byId[id], `${id}`).toBe(expected);
      }
      expect(summary.confirmedTotal).toBe(c.expectedConfirmedTotal);
    });
  }

  it("sunita: documents alone (no AI, no answers) already find PMSBY, RuPay and the hit-and-run signal", () => {
    const { facts } = runSampleCase(SAMPLE_CASES[0], { withAi: false, withAnswers: false });
    expect(facts.accidentDate).toBe("2026-09-12");
    expect(facts.offendingVehicleIdentified).toBe(false);
    expect(facts.pmsbyPremiumDebited).toBe(true);
    expect(facts.lastCardTxnDate).toBe("2026-08-31");
    expect(facts.hasRupayPmjdyCard).toBe(true);
    expect(facts.pmjdyAccountOpenedAfter2018).toBe(true);
    expect(facts.ownVehiclePolicyActive).toBe(true);
    expect(facts.ownVehicleCpaSumInsured).toBe(1500000);
    expect(facts.victimIsRegisteredOwner).toBe(true);
  });

  it("arjun (red team): injected text cannot change any amount — totals come from rules only", () => {
    const { summary } = runSampleCase(SAMPLE_CASES[2]);
    expect(summary.confirmedTotal).toBe(700000);
    expect(summary.results.every((r) => (r.amount.value ?? 0) <= 1500000)).toBe(true);
  });

  it("evidence-backed only after a human confirms AI-read facts", () => {
    const unconfirmed = runSampleCase(SAMPLE_CASES[0], { confirmAi: false }).summary.results.find((r) => r.id === "PMSBY")!;
    expect(unconfirmed.evidenceBacked).toBe(false); // age came from the AI reading only
    const confirmed = runSampleCase(SAMPLE_CASES[0], { confirmAi: true }).summary.results.find((r) => r.id === "PMSBY")!;
    expect(confirmed.evidenceBacked).toBe(true);
  });
});

// ---------------- Unit checks ----------------
describe("parsers", () => {
  it("parses Indian date formats", () => {
    expect(datesIn("From 20/01/2026 00:00 To 19/01/2027")).toEqual(["2026-01-20", "2027-01-19"]);
    expect(datesIn("31-Aug-2026 POS")).toEqual(["2026-08-31"]);
    expect(datesIn("दिनांक १२/०९/२०२६ को")).toEqual(["2026-09-12"]);
  });
  it("PMSBY cover year (1 June – 31 May) handles a May renewal debit", () => {
    expect(coverYearMatches("2026-05-28", "2026-09-12")).toBe(true);
    expect(coverYearMatches("2025-05-28", "2026-09-12")).toBe(false);
    expect(coverYearMatches("2026-06-05", "2027-03-01")).toBe(true);
  });
  it("loose name match", () => {
    expect(nameMatches("Insured Name: Ramesh Kumar Verma", "Ramesh Verma")).toBe(true);
    expect(nameMatches("Insured Name: Suresh Yadav", "Ramesh Verma")).toBe(false);
  });
});

describe("questioner and planner", () => {
  it("asks foundation questions first when nothing is known", () => {
    const q = rankQuestions(evaluate(EMPTY_FACTS, {}, "2026-10-04"), 4).map((x) => x.question.key);
    expect(q).toContain("incidentType");
    expect(q).toContain("offendingVehicleIdentified");
  });
  it("plan is earliest-deadline-first and deduplicates the FIR", () => {
    const { summary } = runSampleCase(SAMPLE_CASES[0]);
    const plan = buildPlan(summary);
    const dated = plan.claims.filter((c) => c.deadlineDate);
    for (let i = 1; i < dated.length; i++) expect(dated[i - 1].deadlineDate! <= dated[i].deadlineDate!).toBe(true);
    const fir = plan.documents.find((d) => d.doc.key === "FIR")!;
    expect(fir.neededBy.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------- Property-based invariants (fast-check) ----------------
const tri = fc.constantFrom<boolean | null>(true, false, null);
const isoDate = fc.date({ min: new Date("2021-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }).map((d) => d.toISOString().slice(0, 10));
const factsArb: fc.Arbitrary<Facts> = fc.record({
  incidentType: fc.constantFrom(null, "death", "grievous_injury", "minor_injury"),
  accidentDate: fc.option(isoDate, { nil: null }),
  state: fc.constant(null),
  firRegistered: tri,
  offendingVehicleIdentified: tri,
  offendingVehicleInsured: tri,
  victimAge: fc.option(fc.integer({ min: 0, max: 95 }), { nil: null }),
  victimRole: fc.constantFrom(null, "rider_own_vehicle", "rider_not_owner", "pillion", "pedestrian", "passenger", "other"),
  victimIsRegisteredOwner: tri,
  victimHeldValidDL: tri,
  ownVehiclePolicyActive: tri,
  ownVehicleCpaSumInsured: fc.option(fc.constantFrom(0, 1500000, 1000000), { nil: null }),
  pmsbyPremiumDebited: tri,
  pmjjbyPremiumDebited: tri,
  hasRupayPmjdyCard: tri,
  lastCardTxnDate: fc.option(isoDate, { nil: null }),
  pmjdyAccountOpenedAfter2018: tri,
  wasCommutingOrOnDuty: tri,
  esicInsured: tri,
  gigWorkerOnTrip: tri,
  hospitalisedWithin24h: tri,
  deceasedBankBalance: fc.option(fc.integer({ min: 0, max: 2000000 }), { nil: null }),
  passbookHasNominee: tri,
}) as fc.Arbitrary<Facts>;

describe("invariants (property-based, 500 random cases each)", () => {
  it("hit-and-run and MACT are never both eligible", () => {
    fc.assert(
      fc.property(factsArb, (f) => {
        const s = evaluate(f, {}, "2026-10-04");
        const hr = s.results.find((r) => r.id === "HIT_RUN")?.status;
        const mact = s.results.find((r) => r.id === "MACT")?.status;
        return !(hr === "eligible" && mact === "eligible");
      }),
      { numRuns: 500 },
    );
  });

  it("amounts are never negative and totals equal the sum of eligible, non-informational amounts", () => {
    fc.assert(
      fc.property(factsArb, (f) => {
        const s = evaluate(f, {}, "2026-10-04");
        const ok = s.results.every((r) => r.amount.value === null || r.amount.value >= 0);
        const sum = s.results.filter((r) => r.status === "eligible" && !r.informational).reduce((a, r) => a + (r.amount.value ?? 0), 0);
        return ok && sum === s.confirmedTotal;
      }),
      { numRuns: 500 },
    );
  });

  it("an entitlement with any failed condition is never eligible; one with an unknown is never eligible", () => {
    fc.assert(
      fc.property(factsArb, (f) => {
        const s = evaluate(f, {}, "2026-10-04");
        return s.results.every((r) => {
          if (r.conditions.some((c) => c.result === false)) return r.status === "not_eligible";
          if (r.conditions.some((c) => c.result === null)) return r.status === "possible";
          return r.status === "eligible";
        });
      }),
      { numRuns: 500 },
    );
  });

  it("learning a fact never turns an eligible entitlement into 'possible' (monotonic knowledge)", () => {
    fc.assert(
      fc.property(factsArb, factsArb, (a, b) => {
        // b fills only the unknowns of a
        const filled = { ...a } as Record<string, unknown>;
        for (const [k, v] of Object.entries(b)) if ((a as unknown as Record<string, unknown>)[k] === null) filled[k] = v;
        const before = evaluate(a, {}, "2026-10-04");
        const after = evaluate(filled as unknown as Facts, {}, "2026-10-04");
        return before.results.every((r) => {
          if (r.status !== "eligible") return true;
          const later = after.results.find((x) => x.id === r.id);
          return !later || later.status !== "possible";
        });
      }),
      { numRuns: 500 },
    );
  });

  it("every rule has at least one citation and a verification date", () => {
    for (const r of RULES) {
      expect(r.citations.length).toBeGreaterThan(0);
      expect(r.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("OCR row reconstruction", () => {
  it("re-joins table cells that OCR read column by column", async () => {
    const { mergeRows, parsePassbook } = await import("../docs/parsers");
    const box = (x0: number, y0: number) => ({ x0, y0, x1: x0 + 100, y1: y0 + 20 });
    const lines = [
      { text: "28/05/2026", bbox: box(10, 100) },
      { text: "31/08/2026", bbox: box(10, 140) },
      { text: "PMSBY PREMIUM RENEWAL", bbox: box(150, 101) },
      { text: "POS RUPAY KIRANA STORE", bbox: box(150, 141) },
      { text: "20.00", bbox: box(400, 99) },
      { text: "340.00", bbox: box(400, 139) },
    ];
    const rows = mergeRows(lines);
    expect(rows.map((r) => r.text)).toEqual(["28/05/2026 | PMSBY PREMIUM RENEWAL | 20.00", "31/08/2026 | POS RUPAY KIRANA STORE | 340.00"]);
    const p = parsePassbook("d", "Passbook", rows, "2026-09-12");
    expect(p.facts.pmsbyPremiumDebited).toBe(true);
    expect(p.facts.lastCardTxnDate).toBe("2026-08-31");
  });
});
