import { NoModelAvailableError, clientIp, rateLimited, structuredCall, type CallTrace } from "@/lib/ai/router";
import { CriticSchema, DraftSchema, type Draft } from "@/lib/ai/schemas";
import { CRITIC_SYSTEM, DRAFT_SYSTEM, criticPrompt, draftPrompt } from "@/lib/ai/prompts";

export const maxDuration = 60;

// Reflection loop: draft → independent critic (different model) → at most one redraft with the critic's feedback.
export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const b = (await req.json().catch(() => null)) as { lang?: "en" | "hi"; scheme?: string; office?: string; relation?: string; summary?: string } | null;
  if (!b?.scheme || !b.office) return Response.json({ error: "bad_request" }, { status: 400 });
  const lang = b.lang === "hi" ? "hi" : "en";
  const summary = (b.summary ?? "").slice(0, 1500);
  const base = { lang, scheme: b.scheme, office: b.office, relation: b.relation ?? "family member", summary } as const;
  const traces: CallTrace[] = [];

  try {
    let draft: Draft = (await structuredCall({ task: "draft", system: DRAFT_SYSTEM, prompt: draftPrompt(base), schema: DraftSchema }).then((r) => (traces.push(r.trace), r.data)));
    let unsupported: string[] = [];
    let revised = false;
    try {
      const c = await structuredCall({ task: "critic", system: CRITIC_SYSTEM, prompt: criticPrompt(summary, draft), schema: CriticSchema, prefer: ["openai/gpt-oss-20b"] });
      traces.push(c.trace);
      unsupported = c.data.unsupported.filter((x) => x.trim().length > 3).slice(0, 5);
      if (unsupported.length) {
        const r2 = await structuredCall({ task: "draft", system: DRAFT_SYSTEM, prompt: draftPrompt({ ...base, feedback: unsupported }), schema: DraftSchema });
        traces.push(r2.trace);
        draft = r2.data;
        revised = true;
      }
    } catch {
      // critic unavailable: the deterministic verifier still runs on the client
    }
    const trace = traces[0];
    return Response.json({
      data: draft,
      trace: { ...trace, inputTokens: traces.reduce((a, t) => a + (t.inputTokens ?? 0), 0), outputTokens: traces.reduce((a, t) => a + (t.outputTokens ?? 0), 0), ms: traces.reduce((a, t) => a + t.ms, 0) },
      critic: { model: traces[1]?.model ?? null, unsupported, revised },
    });
  } catch (e) {
    if (e instanceof NoModelAvailableError) return Response.json({ error: "no_ai", trace: e.trace }, { status: 503 });
    return Response.json({ error: "failed", message: (e as Error).message }, { status: 500 });
  }
}
