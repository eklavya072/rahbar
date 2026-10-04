// Shared helpers for the public, read-only v1 API (no PII, no storage).
import { z } from "zod";
import { RULES } from "../engine/rules";
import { CLOCKS } from "../engine/tracker";

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const tri = z.boolean().nullable().optional();
export const FactsSchema = z
  .object({
    incidentType: z.enum(["death", "grievous_injury", "minor_injury"]).nullable().optional(),
    accidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    state: z.string().max(40).nullable().optional(),
    firRegistered: tri,
    offendingVehicleIdentified: tri,
    offendingVehicleInsured: tri,
    victimAge: z.number().int().min(0).max(120).nullable().optional(),
    victimRole: z.enum(["rider_own_vehicle", "rider_not_owner", "pillion", "pedestrian", "passenger", "other"]).nullable().optional(),
    victimIsRegisteredOwner: tri,
    victimHeldValidDL: tri,
    ownVehiclePolicyActive: tri,
    ownVehicleCpaSumInsured: z.number().min(0).nullable().optional(),
    pmsbyPremiumDebited: tri,
    pmjjbyPremiumDebited: tri,
    hasRupayPmjdyCard: tri,
    lastCardTxnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    pmjdyAccountOpenedAfter2018: tri,
    wasCommutingOrOnDuty: tri,
    esicInsured: tri,
    gigWorkerOnTrip: tri,
    hospitalisedWithin24h: tri,
    deceasedBankBalance: z.number().min(0).nullable().optional(),
    passbookHasNominee: tri,
  })
  .strict();

export const CompensationSchema = z.object({
  age: z.number().int().min(0).max(110),
  monthlyIncome: z.number().min(0),
  incomeSource: z.enum(["payslip", "bank", "itr", "declared", "notional"]).default("declared"),
  employment: z.enum(["permanent", "self_employed", "fixed_wage", "not_earning"]),
  married: z.boolean(),
  spouse: z.boolean(),
  children: z.number().int().min(0).max(20),
  parents: z.number().int().min(0).max(4),
  others: z.number().int().min(0).max(20).default(0),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  offer: z
    .object({
      total: z.number().min(0),
      incomeConsidered: z.number().min(0).nullable().optional(),
      multiplierUsed: z.number().min(0).nullable().optional(),
      futureProspectsIncluded: z.boolean().nullable().optional(),
      deductionUsed: z.number().min(0).max(1).nullable().optional(),
      consortiumCount: z.number().int().min(0).nullable().optional(),
    })
    .optional(),
});

/** Rules as data (functions stripped) — the registry other systems can consume. */
export function registry() {
  return RULES.map((r) => ({
    id: r.id,
    name: r.name,
    payer: r.payer,
    informational: !!r.informational,
    conditions: r.conditions.map((c) => ({ id: c.id, label: c.label, facts: c.facts })),
    documents: r.documents,
    office: r.office,
    steps: r.steps,
    excludes: r.excludes ?? [],
    citations: r.citations,
    lastVerified: r.lastVerified,
    clock: { tatDays: CLOCKS[r.id].tatDays, tatLabel: CLOCKS[r.id].tatLabel, interest: CLOCKS[r.id].interest ?? null, basis: CLOCKS[r.id].basis, escalation: CLOCKS[r.id].ladder },
  }));
}

export const RULES_VERSION = "2026.10.04";

export const CHANGELOG: { date: string; rules: string[]; en: string }[] = [
  { date: "2026-10-04", rules: ["BANK_BALANCE"], en: "Added the deceased's bank balance under RBI's Settlement of Claims of Deceased Customers Directions, 2025 (15-day settlement, Bank Rate + 4% for delay)." },
  { date: "2026-10-04", rules: ["*"], en: "Added statutory clocks and escalation ladders for every entitlement (IRDAI 30/45 days + 14-day grievances; hit-and-run 30/15/15; DAR 90 days; RBI 15 days)." },
  { date: "2026-02-15", rules: ["RAHAT"], en: "PM RAHAT replaces the Cashless Treatment Scheme 2025 (₹1.5 lakh, 7 days, admission within 24 h)." },
  { date: "2025-11-04", rules: ["MACT"], en: "Supreme Court interim order (Bhagirathi Dash v. UoI): claims not to be dismissed under the 6-month limit of s.166(3) while it is under challenge." },
  { date: "2025-07-29", rules: ["EMPLOYER"], en: "Supreme Court (2025 INSC 904): commuting accidents covered under the Employees' Compensation Act." },
  { date: "2024-01-12", rules: ["HIT_RUN"], en: "S. Rajaseekaran v. UoI: police must inform hit-and-run victims; DLSA to assist if no claim within a month." },
];
