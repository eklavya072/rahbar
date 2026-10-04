import "server-only";
// Multi-provider LLM router — free tiers only. Tries each model in order, records a trace,
// caches identical requests, and lets the caller degrade to no-AI mode if everything fails.

import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output, type LanguageModel } from "ai";
import { createHash } from "node:crypto";
import type { z } from "zod";

export interface ModelSlot {
  provider: "groq" | "gemini";
  id: string;
  model: LanguageModel;
  /** Gemini free tier may train on prompts: only ever send it anonymised text (we always do). */
  trainsOnFreeTier: boolean;
}

export interface CallTrace {
  task: string;
  provider: string | null;
  model: string | null;
  ms: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cached: boolean;
  attempts: { model: string; ok: boolean; error?: string }[];
}

function slots(): ModelSlot[] {
  const out: ModelSlot[] = [];
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    const ids = (process.env.GROQ_MODELS ?? "openai/gpt-oss-120b,openai/gpt-oss-20b").split(",").map((s) => s.trim()).filter(Boolean);
    for (const id of ids) out.push({ provider: "groq", id, model: groq(id), trainsOnFreeTier: false });
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    const id = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    out.push({ provider: "gemini", id, model: google(id), trainsOnFreeTier: true });
  }
  return out;
}

export function aiAvailable(): boolean {
  return slots().length > 0;
}

export function groqModel(id: string): LanguageModel | null {
  if (!process.env.GROQ_API_KEY) return null;
  return createGroq({ apiKey: process.env.GROQ_API_KEY })(id);
}

export function primarySlots(): ModelSlot[] {
  return slots();
}

// ---- tiny in-memory LRU cache (per serverless instance) ----
const CACHE = new Map<string, { value: unknown; at: number }>();
const CACHE_MAX = 200;
const CACHE_TTL = 1000 * 60 * 60 * 6;
function cacheGet(k: string) {
  const e = CACHE.get(k);
  if (!e || Date.now() - e.at > CACHE_TTL) return undefined;
  CACHE.delete(k);
  CACHE.set(k, e);
  return e.value;
}
function cacheSet(k: string, value: unknown) {
  CACHE.set(k, { value, at: Date.now() });
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
}

export class NoModelAvailableError extends Error {
  constructor(public trace: CallTrace) {
    super("No AI model available (no API key configured, or every free-tier model is rate-limited).");
  }
}

export async function structuredCall<T>(opts: {
  task: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  timeoutMs?: number;
  /** Try these model ids first (e.g. a different model for an independent critic). */
  prefer?: string[];
}): Promise<{ data: T; trace: CallTrace }> {
  const key = createHash("sha256").update(`${opts.task}\n${opts.system}\n${opts.prompt}`).digest("hex");
  const started = Date.now();
  const trace: CallTrace = { task: opts.task, provider: null, model: null, ms: 0, inputTokens: null, outputTokens: null, cached: false, attempts: [] };

  const hit = cacheGet(key) as { data: T; provider: string; model: string } | undefined;
  if (hit) return { data: hit.data, trace: { ...trace, provider: hit.provider, model: hit.model, cached: true, ms: Date.now() - started } };

  const ordered = opts.prefer?.length
    ? [...slots()].sort((a, b) => (opts.prefer!.includes(b.id) ? 1 : 0) - (opts.prefer!.includes(a.id) ? 1 : 0))
    : slots();
  for (const slot of ordered) {
    try {
      const res = await generateText({
        model: slot.model,
        system: opts.system,
        prompt: opts.prompt,
        output: Output.object({ schema: opts.schema }),
        maxRetries: 0,
        timeout: opts.timeoutMs ?? 25_000,
        temperature: 0,
        providerOptions: slot.provider === "groq" ? { groq: { structuredOutputs: true, reasoningEffort: "low" } } : undefined,
      });
      const data = res.output as T;
      trace.attempts.push({ model: slot.id, ok: true });
      trace.provider = slot.provider;
      trace.model = slot.id;
      trace.inputTokens = res.usage?.inputTokens ?? null;
      trace.outputTokens = res.usage?.outputTokens ?? null;
      trace.ms = Date.now() - started;
      cacheSet(key, { data, provider: slot.provider, model: slot.id });
      return { data, trace };
    } catch (e) {
      trace.attempts.push({ model: slot.id, ok: false, error: (e as Error).message?.slice(0, 160) });
    }
  }
  trace.ms = Date.now() - started;
  throw new NoModelAvailableError(trace);
}

// ---- per-IP rate limit (best effort, per instance) ----
const HITS = new Map<string, number[]>();
export function rateLimited(ip: string, limit = 20, windowMs = 60_000): boolean {
  if (process.env.NODE_ENV !== "production") return false; // only protect the deployed app
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "local";
}
