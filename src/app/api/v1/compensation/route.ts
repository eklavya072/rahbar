import { auditOffer, estimateDeath } from "@/lib/engine/mact";
import { todayISO } from "@/lib/engine/dates";
import { clientIp, rateLimited } from "@/lib/ai/router";
import { CompensationSchema, CORS, RULES_VERSION } from "@/lib/api/v1";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** POST MACT inputs (+ optional insurer offer) → just-compensation estimate and offer audit. */
export async function POST(req: Request) {
  if (rateLimited(clientIp(req), 60)) return Response.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  const parsed = CompensationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400, headers: CORS });
  const { offer, ...rest } = parsed.data;
  const input = { ...rest, asOf: rest.asOf ?? todayISO() };
  const estimate = estimateDeath(input);
  const audit = offer ? auditOffer(estimate, input, offer) : null;
  return Response.json({ rulesVersion: RULES_VERSION, input, estimate, audit }, { headers: CORS });
}
