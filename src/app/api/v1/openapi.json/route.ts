import { CORS, RULES_VERSION } from "@/lib/api/v1";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "AfterCrash Entitlements API",
    version: RULES_VERSION,
    description:
      "Rules-as-code for road-accident entitlements in India. Deterministic, cited, no AI and no storage. Send non-identifying facts only (no names, phone, Aadhaar or account numbers). Information, not legal advice.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/evaluate": {
      post: {
        summary: "Evaluate all entitlements for a case",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { facts: { incidentType: "death", accidentDate: "2026-09-12", offendingVehicleIdentified: false, victimAge: 34, victimRole: "rider_own_vehicle", victimIsRegisteredOwner: true, victimHeldValidDL: true, ownVehiclePolicyActive: true, ownVehicleCpaSumInsured: 1500000, pmsbyPremiumDebited: true }, today: "2026-10-04" },
            },
          },
        },
        responses: { "200": { description: "Entitlements with status (eligible / possible / not_eligible), amounts, deadlines, documents, offices, citations, and a deadline-first plan" }, "400": { description: "Invalid facts" }, "429": { description: "Rate limited" } },
      },
    },
    "/compensation": {
      post: {
        summary: "Estimate MACT just compensation (death) and audit an insurer's offer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { age: 34, monthlyIncome: 14500, incomeSource: "bank", employment: "fixed_wage", married: true, spouse: true, children: 2, parents: 0, offer: { total: 900000, incomeConsidered: 7000, futureProspectsIncluded: false, multiplierUsed: 15, consortiumCount: 1 } },
            },
          },
        },
        responses: { "200": { description: "Head-by-head estimate (Sarla Verma, Pranay Sethi, Magma) and, if an offer is sent, a verdict with flags and their rupee impact" } },
      },
    },
    "/rules": { get: { summary: "The rules registry: conditions, documents, offices, statutory clocks, escalation ladders, citations, changelog", responses: { "200": { description: "Registry" } } } },
  },
};

export function GET() {
  return Response.json(spec, { headers: CORS });
}
