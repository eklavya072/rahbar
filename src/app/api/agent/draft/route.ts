import { NoModelAvailableError, clientIp, rateLimited, structuredCall } from "@/lib/ai/router";
import { DraftSchema } from "@/lib/ai/schemas";
import { DRAFT_SYSTEM, draftPrompt } from "@/lib/ai/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const b = (await req.json().catch(() => null)) as { lang?: "en" | "hi"; scheme?: string; office?: string; relation?: string; summary?: string } | null;
  if (!b?.scheme || !b.office) return Response.json({ error: "bad_request" }, { status: 400 });

  try {
    const { data, trace } = await structuredCall({
      task: "draft",
      system: DRAFT_SYSTEM,
      prompt: draftPrompt({ lang: b.lang === "hi" ? "hi" : "en", scheme: b.scheme, office: b.office, relation: b.relation ?? "family member", summary: (b.summary ?? "").slice(0, 1500) }),
      schema: DraftSchema,
    });
    return Response.json({ data, trace });
  } catch (e) {
    if (e instanceof NoModelAvailableError) return Response.json({ error: "no_ai", trace: e.trace }, { status: 503 });
    return Response.json({ error: "failed", message: (e as Error).message }, { status: 500 });
  }
}
