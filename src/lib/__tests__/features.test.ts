import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { auditOffer, conventionalFactor, deductionFor, estimateDeath, futureProspectsFor, multiplierFor, type MactInput } from "../engine/mact";
import { extractIncome } from "../docs/income";
import { CLOCKS, escalationLetter, trackStatus } from "../engine/tracker";
import { SAMPLE_CASES } from "../samples/cases";
import { RULES } from "../engine/rules";

const ramesh: MactInput = {
  age: 34, monthlyIncome: 14500, incomeSource: "bank", employment: "fixed_wage",
  married: true, spouse: true, children: 2, parents: 0, others: 0, asOf: "2026-10-04",
};

describe("MACT just-compensation engine", () => {
  it("Sarla Verma multipliers and Pranay Sethi future prospects", () => {
    expect([14, 20, 25, 26, 34, 40, 45, 50, 55, 60, 65, 70].map(multiplierFor)).toEqual([15, 18, 18, 17, 16, 15, 14, 13, 11, 9, 7, 5]);
    expect(futureProspectsFor("permanent", 35)).toBe(0.5);
    expect(futureProspectsFor("self_employed", 45)).toBe(0.25);
    expect(futureProspectsFor("fixed_wage", 55)).toBe(0.1);
    expect(futureProspectsFor("permanent", 61)).toBe(0);
  });

  it("personal-expense deduction follows family size", () => {
    expect(deductionFor({ married: false, spouse: false, children: 0, parents: 2, others: 0 })).toBe(1 / 2);
    expect(deductionFor({ married: true, spouse: true, children: 2, parents: 0, others: 0 })).toBe(1 / 3);
    expect(deductionFor({ married: true, spouse: true, children: 3, parents: 2, others: 0 })).toBe(1 / 4);
    expect(deductionFor({ married: true, spouse: true, children: 4, parents: 2, others: 1 })).toBe(1 / 5);
  });

  it("conventional heads rise 10% per completed 3-year block after 31 Oct 2017", () => {
    expect(conventionalFactor("2019-01-01")).toBeCloseTo(1);
    expect(conventionalFactor("2026-10-04")).toBeCloseTo(1.21);
    expect(conventionalFactor("2026-11-02")).toBeCloseTo(1.331);
  });

  it("worked example (hand-checked): Ramesh, 34, ₹14,500/month, wife + 2 children", () => {
    const e = estimateDeath(ramesh);
    // 1,74,000 × 1.4 × 2/3 × 16 = 25,98,400 ; + 18,150 + 18,150 + 48,400 × 3
    expect(e.heads.find((h) => h.id === "dependency")!.amount).toBe(2598400);
    expect(e.heads.find((h) => h.id === "estate")!.amount).toBe(18150);
    expect(e.heads.find((h) => h.id === "consortium")!.amount).toBe(145200);
    expect(e.total).toBe(2779900);
    expect(e.perThousandMonthly).toBe(179200);
  });

  it("offer auditor flags a minimum-wage, no-future-prospects, wrong-multiplier offer", () => {
    const e = estimateDeath(ramesh);
    const a = auditOffer(e, ramesh, { total: 900000, incomeConsidered: 7000, futureProspectsIncluded: false, multiplierUsed: 15, consortiumCount: 1 });
    expect(a.verdict).toBe("very_low");
    expect(a.flags.map((f) => f.severity)).toEqual(["high", "high", "high", "medium"]);
    expect(a.gap).toBe(1879900);
  });

  it("property: more proven income never lowers the estimate", () => {
    fc.assert(
      fc.property(fc.integer({ min: 15, max: 75 }), fc.integer({ min: 1000, max: 200000 }), fc.integer({ min: 0, max: 50000 }), (age, income, extra) => {
        const a = estimateDeath({ ...ramesh, age, monthlyIncome: income });
        const b = estimateDeath({ ...ramesh, age, monthlyIncome: income + extra });
        return b.total >= a.total;
      }),
      { numRuns: 300 },
    );
  });
});

describe("income evidence builder", () => {
  it("reconstructs ₹14,500/month from three salary credits and reads the closing balance", () => {
    const lines = SAMPLE_CASES[0].docs.find((d) => d.kind === "passbook")!.lines.map((text) => ({ text }));
    const inc = extractIncome(lines, "2026-09-12");
    expect(inc.credits.map((c) => c.amount)).toEqual([14500, 14500, 14500]);
    expect(inc.monthly).toBe(14500);
    expect(inc.regular).toBe(true);
    expect(inc.payers[0]).toMatch(/SHREE LOGISTICS/);
    expect(inc.closingBalance).toBe(44422);
  });
  it("ignores refunds and interest", () => {
    const inc = extractIncome([{ text: "05/08/2026 | NEFT CR REFUND AMAZON | | 2,500.00 | 9,000.00" }, { text: "30/09/2026 | INT.PD | | 512.00 | 9,512.00" }], null);
    expect(inc.credits).toHaveLength(0);
  });
});

describe("claim tracker and escalation", () => {
  it("every entitlement has a clock and an escalation ladder", () => {
    for (const r of RULES) {
      expect(CLOCKS[r.id], r.id).toBeDefined();
      expect(CLOCKS[r.id].ladder.length).toBeGreaterThan(0);
    }
  });
  it("an insurer claim filed on 1 Sep is overdue on 4 Oct and the next step is the Grievance Officer", () => {
    const s = trackStatus({ id: "CPA", stage: "filed", filedOn: "2026-09-01" }, "2026-10-04");
    expect(s.dueBy).toBe("2026-10-01");
    expect(s.overdueBy).toBe(3);
    expect(s.nextStep?.level).toBe(1);
  });
  it("after escalating, the next level unlocks only after the wait period", () => {
    const s = trackStatus({ id: "CPA", stage: "filed", filedOn: "2026-09-01", escalatedLevel: 1, escalatedOn: "2026-10-04" }, "2026-10-10");
    expect(s.nextStep?.level).toBe(2);
    expect(s.nextStepFrom).toBe("2026-10-18");
  });
  it("escalation letter cites the rule and the days of delay", () => {
    const step = CLOCKS.CPA.ladder[0];
    const txt = escalationLetter({ id: "CPA", stage: "filed", filedOn: "2026-09-01" }, step, { lang: "en", claimName: { en: "owner-driver PA cover", hi: "" }, claimant: "Sunita Verma", victim: "Ramesh Kumar Verma", today: "2026-10-04" });
    expect(txt).toContain("3 day(s) later");
    expect(txt).toContain("Bank Rate + 2%");
  });
});
