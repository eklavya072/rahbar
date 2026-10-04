// Verifier agent (deterministic). Every rupee amount and date in an AI-drafted letter must
// match the facts and rules. Anything else blocks the draft until a human fixes it.

import { isValidISO } from "../engine/dates";

export type Severity = "block" | "warn";
export interface VerifierIssue {
  severity: Severity;
  code: string;
  message: string;
  excerpt?: string;
}
export interface VerifierResult {
  ok: boolean;
  issues: VerifierIssue[];
  checked: { amounts: number; dates: number };
}

export interface AllowedValues {
  amounts: number[];
  dates: string[]; // ISO
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  जनवरी: 1, फ़रवरी: 2, फरवरी: 2, मार्च: 3, अप्रैल: 4, मई: 5, जून: 6, जुलाई: 7, अगस्त: 8, सितंबर: 9, सितम्बर: 9, अक्टूबर: 10, नवंबर: 11, नवम्बर: 11, दिसंबर: 12, दिसम्बर: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Convert Devanagari digits to ASCII. */
export function asciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (c) => String(c.charCodeAt(0) - 0x0966));
}

export function extractAmounts(text: string): { value: number; raw: string }[] {
  const t = asciiDigits(text);
  const out: { value: number; raw: string }[] = [];
  // ₹2,00,000 / Rs. 200000 / INR 2,00,000
  for (const m of t.matchAll(/(?:₹|Rs\.?|INR)\s?([\d,]+(?:\.\d+)?)(?!\s*(?:lakh|लाख|crore|करोड़))/gi)) {
    out.push({ value: Number(m[1].replace(/,/g, "")), raw: m[0] });
  }
  // ₹2 lakh / 15 लाख / 1.5 lakh
  for (const m of t.matchAll(/(?:₹|Rs\.?)?\s?(\d+(?:\.\d+)?)\s*(lakh|lac|लाख|crore|करोड़)/gi)) {
    const mult = /crore|करोड़/i.test(m[2]) ? 1_00_00_000 : 1_00_000;
    out.push({ value: Math.round(Number(m[1]) * mult), raw: m[0] });
  }
  return out.filter((a) => a.value >= 100); // ignore tiny numbers like section numbers
}

export function extractDates(text: string): { iso: string; raw: string }[] {
  const t = asciiDigits(text);
  const out: { iso: string; raw: string }[] = [];
  for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) out.push({ iso: `${m[1]}-${m[2]}-${m[3]}`, raw: m[0] });
  for (const m of t.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g)) out.push({ iso: iso(+m[3], +m[2], +m[1]), raw: m[0] });
  for (const m of t.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+|[ऀ-ॿ]+)\.?,?\s+(\d{4})\b/g)) {
    const mon = MONTHS[m[2].toLowerCase()];
    if (mon) out.push({ iso: iso(+m[3], mon, +m[1]), raw: m[0] });
  }
  return out.filter((d) => isValidISO(d.iso));
}

const OVERPROMISE = /\b(guarantee[ds]?|definitely|certainly will|100%\s*sure|assured(?:ly)? (?:get|receive))\b|गारंटी|पक्का मिलेगा|निश्चित रूप से मिलेगा/i;
const INJECTION_ECHO = /ignore (?:all |the )?(?:previous|prior|above) instructions|system prompt|as an ai (?:model|language model)/i;
const RAW_PII = /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b|\b[6-9]\d{9}\b/;

export function verifyDraft(draft: string, allowed: AllowedValues): VerifierResult {
  const issues: VerifierIssue[] = [];
  const amounts = extractAmounts(draft);
  const dates = extractDates(draft);
  const allowedAmounts = new Set(allowed.amounts.map((a) => Math.round(a)));
  const allowedDates = new Set(allowed.dates);

  for (const a of amounts) {
    if (!allowedAmounts.has(a.value)) {
      issues.push({ severity: "block", code: "AMOUNT_MISMATCH", message: `Amount "${a.raw.trim()}" is not one the rules engine computed.`, excerpt: a.raw.trim() });
    }
  }
  for (const d of dates) {
    if (!allowedDates.has(d.iso)) {
      issues.push({ severity: "block", code: "DATE_MISMATCH", message: `Date "${d.raw}" doesn't match any date in the case facts or deadlines.`, excerpt: d.raw });
    }
  }
  const op = draft.match(OVERPROMISE);
  if (op) issues.push({ severity: "warn", code: "OVERPROMISE", message: `Avoid promising an outcome ("${op[0]}").`, excerpt: op[0] });
  const inj = draft.match(INJECTION_ECHO);
  if (inj) issues.push({ severity: "block", code: "INJECTION_ECHO", message: "The draft contains instruction-like text copied from a document.", excerpt: inj[0] });
  const pii = draft.match(RAW_PII);
  if (pii) issues.push({ severity: "block", code: "RAW_PII", message: "The draft contains an unmasked Aadhaar or phone number.", excerpt: pii[0] });

  return { ok: !issues.some((i) => i.severity === "block"), issues, checked: { amounts: amounts.length, dates: dates.length } };
}
