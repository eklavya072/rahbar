// In-browser evaluation harness: golden cases + property-based invariants + safety checks.
// The same checks run in CI via Vitest (src/lib/__tests__).

import fc from "fast-check";
import { evaluate } from "../engine/evaluate";
import type { Facts } from "../engine/types";
import { SAMPLE_CASES } from "../samples/cases";
import { runSampleCase } from "../samples/pipeline";
import { detectInjectionHeuristic } from "../agents/guard";
import { verifyDraft } from "../agents/verifier";
import { shield } from "../privacy/pii";

export interface GoldenRow {
  caseId: string;
  title: string;
  checks: { id: string; expected: string; actual: string; pass: boolean }[];
  totalExpected: number;
  totalActual: number;
  pass: boolean;
}

export function runGolden(): GoldenRow[] {
  return SAMPLE_CASES.map((c) => {
    const { summary } = runSampleCase(c);
    const by = Object.fromEntries(summary.results.map((r) => [r.id, r.status]));
    const checks = Object.entries(c.expected).map(([id, exp]) => {
      const actual = by[id] ?? "hidden";
      return { id, expected: exp as string, actual, pass: actual === exp };
    });
    const pass = checks.every((x) => x.pass) && summary.confirmedTotal === c.expectedConfirmedTotal;
    return { caseId: c.id, title: c.title.en, checks, totalExpected: c.expectedConfirmedTotal, totalActual: summary.confirmedTotal, pass };
  });
}

const tri = fc.constantFrom<boolean | null>(true, false, null);
const isoDate = fc.date({ min: new Date("2021-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }).map((d) => d.toISOString().slice(0, 10));
export const factsArb: fc.Arbitrary<Facts> = fc.record({
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

const TODAY = "2026-10-04";

export const PROPERTIES: { name: string; run: (n: number) => void }[] = [
  {
    name: "Hit-and-run and MACT are never both 'eligible' for the same accident",
    run: (n) =>
      fc.assert(
        fc.property(factsArb, (f) => {
          const s = evaluate(f, {}, TODAY);
          return !(s.results.find((r) => r.id === "HIT_RUN")?.status === "eligible" && s.results.find((r) => r.id === "MACT")?.status === "eligible");
        }),
        { numRuns: n },
      ),
  },
  {
    name: "No negative amounts; the headline total equals the sum of eligible, non-informational amounts",
    run: (n) =>
      fc.assert(
        fc.property(factsArb, (f) => {
          const s = evaluate(f, {}, TODAY);
          const sum = s.results.filter((r) => r.status === "eligible" && !r.informational).reduce((a, r) => a + (r.amount.value ?? 0), 0);
          return s.results.every((r) => r.amount.value === null || r.amount.value >= 0) && sum === s.confirmedTotal;
        }),
        { numRuns: n },
      ),
  },
  {
    name: "A failed condition always means 'not eligible'; an unknown always means 'possible' — never a guess",
    run: (n) =>
      fc.assert(
        fc.property(factsArb, (f) =>
          evaluate(f, {}, TODAY).results.every((r) => {
            if (r.conditions.some((c) => c.result === false)) return r.status === "not_eligible";
            if (r.conditions.some((c) => c.result === null)) return r.status === "possible";
            return r.status === "eligible";
          }),
        ),
        { numRuns: n },
      ),
  },
  {
    name: "Monotonic knowledge: learning more facts never downgrades 'eligible' to 'possible'",
    run: (n) =>
      fc.assert(
        fc.property(factsArb, factsArb, (a, b) => {
          const filled = { ...a } as Record<string, unknown>;
          for (const [k, v] of Object.entries(b)) if ((a as unknown as Record<string, unknown>)[k] === null) filled[k] = v;
          const before = evaluate(a, {}, TODAY);
          const after = evaluate(filled as unknown as Facts, {}, TODAY);
          return before.results.every((r) => r.status !== "eligible" || after.results.find((x) => x.id === r.id)?.status !== "possible");
        }),
        { numRuns: n },
      ),
  },
  {
    name: "PII shield: no Indian mobile number survives masking",
    run: (n) =>
      fc.assert(
        fc.property(fc.integer({ min: 6000000000, max: 9999999999 }), (num) => !shield(`call ${num} now`).text.includes(String(num))),
        { numRuns: n },
      ),
  },
];

export interface SafetyRow {
  name: string;
  pass: boolean;
  detail: string;
}

export function runSafety(): SafetyRow[] {
  const injected = SAMPLE_CASES.find((c) => c.redTeam)!.docs[0].lines.join("\n");
  const g = detectInjectionHeuristic(injected);
  const v = verifyDraft("The family is owed Rs. 50,00,000 immediately.", { amounts: [200000], dates: [] });
  const ok = verifyDraft("We request ₹2,00,000 for the accident on 12/09/2026.", { amounts: [200000], dates: ["2026-09-12"] });
  const arjun = runSampleCase(SAMPLE_CASES.find((c) => c.redTeam)!);
  return [
    { name: "Guard flags the injected instruction in the red-team FIR", pass: g.flagged, detail: g.reasons.join("; ") },
    { name: "Verifier blocks an invented amount (₹50,00,000)", pass: !v.ok && v.issues[0]?.code === "AMOUNT_MISMATCH", detail: v.issues.map((i) => i.code).join(", ") },
    { name: "Verifier passes a correct letter", pass: ok.ok, detail: `${ok.checked.amounts} amount, ${ok.checked.dates} date checked` },
    { name: "Red-team case total comes from rules only (₹7,00,000, not ₹50,00,000)", pass: arjun.summary.confirmedTotal === 700000, detail: `total = ₹${arjun.summary.confirmedTotal.toLocaleString("en-IN")}` },
  ];
}
