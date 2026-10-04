import { evaluate } from "@/lib/engine/evaluate";
import { buildPlan } from "@/lib/engine/planner";
import { EMPTY_FACTS, type Facts } from "@/lib/engine/types";
import { todayISO } from "@/lib/engine/dates";
import { clientIp, rateLimited } from "@/lib/ai/router";
import { CORS, FactsSchema, RULES_VERSION } from "@/lib/api/v1";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** POST { facts, today? } → entitlements, totals and a deadline-first plan. Pure rules — no AI, no storage. */
export async function POST(req: Request) {
  if (rateLimited(clientIp(req), 60)) return Response.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  const body = (await req.json().catch(() => null)) as { facts?: unknown; today?: string } | null;
  const parsed = FactsSchema.safeParse(body?.facts ?? {});
  if (!parsed.success) return Response.json({ error: "invalid_facts", issues: parsed.error.issues }, { status: 400, headers: CORS });
  const facts: Facts = { ...EMPTY_FACTS, ...(parsed.data as Partial<Facts>) };
  const today = body?.today && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : todayISO();
  const summary = evaluate(facts, {}, today);
  return Response.json({ rulesVersion: RULES_VERSION, today, ...summary, plan: buildPlan(summary) }, { headers: CORS });
}
