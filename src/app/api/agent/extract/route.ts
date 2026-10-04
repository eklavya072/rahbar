import { NoModelAvailableError, clientIp, rateLimited, structuredCall } from "@/lib/ai/router";
import { ExtractionSchema } from "@/lib/ai/schemas";
import { EXTRACT_SYSTEM, extractPrompt } from "@/lib/ai/prompts";
import { detectInjectionHeuristic, quarantine } from "@/lib/agents/guard";

export const maxDuration = 60;

// Receives ONLY anonymised text (the browser runs the PII Shield first).
export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { narrative?: string; story?: string } | null;
  if (!body || typeof body.narrative !== "string") return Response.json({ error: "bad_request" }, { status: 400 });

  // Defence in depth: quarantine injected lines server-side too, even if the client already did.
  const guard = detectInjectionHeuristic(body.narrative);
  const narrative = quarantine(body.narrative, guard.lines);

  try {
    const { data, trace } = await structuredCall({
      task: "extract",
      system: EXTRACT_SYSTEM,
      prompt: extractPrompt(narrative, body.story ?? ""),
      schema: ExtractionSchema,
    });
    return Response.json({ data: { ...data, suspiciousInstructions: data.suspiciousInstructions || guard.flagged }, trace, guard });
  } catch (e) {
    if (e instanceof NoModelAvailableError) return Response.json({ error: "no_ai", trace: e.trace, guard }, { status: 503 });
    return Response.json({ error: "failed", message: (e as Error).message }, { status: 500 });
  }
}
