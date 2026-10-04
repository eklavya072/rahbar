import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { clientIp, primarySlots, rateLimited } from "@/lib/ai/router";
import { AGENT_SYSTEM } from "@/lib/ai/prompts";
import { evaluate } from "@/lib/engine/evaluate";
import { buildPlan } from "@/lib/engine/planner";
import { formatINR } from "@/lib/engine/dates";
import { EMPTY_FACTS, type Facts } from "@/lib/engine/types";

export const maxDuration = 60;

// Only non-identifying facts are accepted (booleans, dates, age, state) — no names or numbers.
const ChangeSchema = z.object({
  offendingVehicleIdentified: z.boolean().optional(),
  offendingVehicleInsured: z.boolean().optional(),
  pmsbyPremiumDebited: z.boolean().optional(),
  pmjjbyPremiumDebited: z.boolean().optional(),
  hasRupayPmjdyCard: z.boolean().optional(),
  ownVehiclePolicyActive: z.boolean().optional(),
  victimHeldValidDL: z.boolean().optional(),
  wasCommutingOrOnDuty: z.boolean().optional(),
  esicInsured: z.boolean().optional(),
  gigWorkerOnTrip: z.boolean().optional(),
  incidentType: z.enum(["death", "grievous_injury", "minor_injury"]).optional(),
});

function digest(f: Facts, today: string) {
  const s = evaluate(f, {}, today);
  return {
    confirmedTotal: formatINR(s.confirmedTotal),
    entitlements: s.results.map((r) => ({
      id: r.id,
      name: r.name.en,
      legalBasis: r.citations.map((c) => c.title),
      status: r.status,
      amount: r.amount.label.en,
      deadline: r.deadline.date ?? r.deadline.label.en,
      blockedBy: r.failedConditions.map((c) => c.label.en),
      unknown: r.missingFacts,
    })),
  };
}

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const b = (await req.json().catch(() => null)) as { question?: string; facts?: Partial<Facts>; today?: string; lang?: "en" | "hi"; history?: { role: "user" | "assistant"; content: string }[] } | null;
  if (!b?.question) return Response.json({ error: "bad_request" }, { status: 400 });

  const facts: Facts = { ...EMPTY_FACTS, ...(b.facts ?? {}) };
  const today = b.today ?? new Date().toISOString().slice(0, 10);
  const toolCalls: { name: string; input: unknown; output: unknown }[] = [];

  const tools = {
    listEntitlements: tool({
      description: "List every entitlement for the current case with status, amount, deadline and what blocks it.",
      inputSchema: z.object({}),
      execute: async () => {
        const out = digest(facts, today);
        toolCalls.push({ name: "listEntitlements", input: {}, output: { total: out.confirmedTotal, count: out.entitlements.length } });
        return out;
      },
    }),
    getPlan: tool({
      description: "The family's action plan: claims ordered earliest-deadline-first with days left, office, and documents to collect. Use for 'what first / next' questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const plan = buildPlan(evaluate(facts, {}, today));
        const out = {
          today,
          claims: plan.claims.map((c, i) => ({ order: i + 1, claim: c.title.en, status: c.status, amount: c.amountLabel.en, deadline: c.deadlineDate, daysLeft: c.daysLeft, deadlineRule: c.deadlineLabel.en, office: c.office.en })),
          documents: plan.documents.map((d) => ({ doc: d.doc.name.en, copies: d.copies, whereToGet: d.doc.whereToGet.en })),
        };
        toolCalls.push({ name: "getPlan", input: {}, output: { claims: out.claims.length } });
        return out;
      },
    }),
    simulateWhatIf: tool({
      description: "Re-run the rules engine with some facts changed (e.g. the truck is found, the passbook shows PMJJBY) and report what changes.",
      inputSchema: z.object({ changes: ChangeSchema }),
      execute: async ({ changes }) => {
        const before = digest(facts, today);
        const after = digest({ ...facts, ...changes }, today);
        const diff = [
          ...after.entitlements.map((a) => ({ id: a.id, name: a.name, before: before.entitlements.find((x) => x.id === a.id)?.status ?? "not applicable", after: a.status, amount: a.amount })),
          ...before.entitlements.filter((x) => !after.entitlements.some((a) => a.id === x.id)).map((x) => ({ id: x.id, name: x.name, before: x.status, after: "no longer applies", amount: x.amount })),
        ].filter((d) => d.before !== d.after);
        const out = { changes, totalBefore: before.confirmedTotal, totalAfter: after.confirmedTotal, changed: diff };
        toolCalls.push({ name: "simulateWhatIf", input: changes, output: out });
        return out;
      },
    }),
  };

  const errors: string[] = [];
  for (const slot of primarySlots().filter((s) => s.provider === "groq")) {
    try {
      const res = await generateText({
        model: slot.model,
        system: `${AGENT_SYSTEM}\n- Reply in ${b.lang === "hi" || /[\u0900-\u097F]/.test(b.question) ? "simple Hindi (Devanagari)" : "English"}.`,
        messages: [...(b.history ?? []).slice(-6), { role: "user", content: b.question.slice(0, 800) }],
        tools,
        stopWhen: stepCountIs(4),
        maxRetries: 0,
        timeout: 30_000,
        temperature: 0.2,
      });
      return Response.json({ answer: res.text, toolCalls, model: slot.id, steps: res.steps.length, fallbacks: errors });
    } catch (e) {
      errors.push(`${slot.id}: ${(e as Error).message?.slice(0, 120)}`);
    }
  }

  // No-AI fallback: answer with the deterministic digest.
  const d = digest(facts, today);
  return Response.json({
    answer: `AI is unavailable right now, so here is the rules engine's answer directly. Confirmed so far: ${d.confirmedTotal}. ` +
      d.entitlements.map((e) => `${e.name}: ${e.status.replace("_", " ")}`).join("; ") + ".",
    toolCalls: [{ name: "listEntitlements", input: {}, output: { total: d.confirmedTotal } }],
    model: null,
    errors,
  });
}
