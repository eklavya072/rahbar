// Guard agent: prompt-injection detection on document text BEFORE it reaches any LLM.
// Layer 1 (here, on device): fast heuristics. Layer 2 (server): Llama Prompt Guard on Groq.
// Either layer flagging => the suspicious lines are quarantined from the AI prompt and shown to the human.

export interface GuardResult {
  flagged: boolean;
  lines: string[];
  reasons: string[];
}

const RULES: { re: RegExp; reason: string }[] = [
  { re: /ignore (?:all |any |the )?(?:previous|prior|above|earlier) (?:instructions|rules|prompts?)/i, reason: "asks the AI to ignore its instructions" },
  { re: /\b(?:note|message|instruction)s? (?:to|for) (?:the )?(?:ai|assistant|model|chatbot|llm)\b/i, reason: "addresses the AI directly" },
  { re: /\b(?:system prompt|developer message|you are (?:now )?(?:an?|the) (?:ai|assistant))\b/i, reason: "tries to change the AI's role" },
  { re: /\bmark (?:every|all|each) (?:scheme|claim|entitlement)s? as (?:confirmed|eligible|approved)\b/i, reason: "tries to force an eligibility result" },
  { re: /(?:पिछले|सभी) निर्देश(?:ों)? (?:को )?(?:अनदेखा|नज़रअंदाज़|भूल)/, reason: "asks the AI to ignore instructions (Hindi)" },
  { re: /\b(?:disregard|override) (?:the )?(?:rules|policy|instructions)\b/i, reason: "asks to override rules" },
];

export function detectInjectionHeuristic(text: string): GuardResult {
  const lines: string[] = [];
  const reasons = new Set<string>();
  const all = text.split(/\n/);
  for (let i = 0; i < all.length; i++) {
    // Look at each line and each pair of lines (instructions are often split across OCR lines).
    const window = all[i] + " " + (all[i + 1] ?? "");
    for (const r of RULES) {
      if (r.re.test(all[i]) || r.re.test(window)) {
        lines.push(all[i]);
        reasons.add(r.reason);
        break;
      }
    }
  }
  return { flagged: lines.length > 0, lines, reasons: [...reasons] };
}

/** Remove flagged lines (and the line right after, which often continues the instruction). */
export function quarantine(text: string, flaggedLines: string[]): string {
  if (!flaggedLines.length) return text;
  const all = text.split(/\n/);
  const drop = new Set<number>();
  all.forEach((l, i) => {
    if (flaggedLines.includes(l)) {
      drop.add(i);
      if (all[i + 1] && !/[।.]$/.test(l.trim())) drop.add(i + 1);
    }
  });
  return all.filter((_, i) => !drop.has(i)).join("\n");
}
