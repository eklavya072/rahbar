import { generateText } from "ai";
import { clientIp, groqModel, rateLimited } from "@/lib/ai/router";
import { detectInjectionHeuristic } from "@/lib/agents/guard";

export const maxDuration = 30;

const PROMPT_GUARD = process.env.GROQ_GUARD_MODEL ?? "meta-llama/llama-prompt-guard-2-86m";

/** Splits text into ~1,200-character chunks (Prompt Guard has a short context window). */
function chunks(text: string, size = 1200, max = 4): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length && out.length < max; i += size) out.push(text.slice(i, i + size));
  return out;
}

export async function POST(req: Request) {
  if (rateLimited(clientIp(req), 40)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  if (!body?.text) return Response.json({ error: "bad_request" }, { status: 400 });

  const heuristic = detectInjectionHeuristic(body.text);
  const model = groqModel(PROMPT_GUARD);
  let classifier: { model: string; maxScore: number; flagged: boolean } | null = null;
  const started = Date.now();

  if (model) {
    try {
      let maxScore = 0;
      for (const c of chunks(body.text)) {
        const r = await generateText({ model, prompt: c, maxRetries: 0, timeout: 8000 });
        const score = parseFloat(r.text.trim());
        if (!Number.isNaN(score)) maxScore = Math.max(maxScore, score);
      }
      classifier = { model: PROMPT_GUARD, maxScore, flagged: maxScore >= 0.5 };
    } catch {
      classifier = null; // classifier unavailable — heuristic layer still applies
    }
  }

  return Response.json({
    flagged: heuristic.flagged || !!classifier?.flagged,
    heuristic,
    classifier,
    ms: Date.now() - started,
  });
}
