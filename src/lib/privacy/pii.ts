// On-device PII Shield. Runs in the browser before any text is sent to an AI provider.
// Replaces identifiers with reversible tokens; the token map never leaves the device.

// ---- Verhoeff checksum (used by UIDAI for Aadhaar numbers) ----
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function verhoeffValid(num: string): boolean {
  if (!/^\d+$/.test(num)) return false;
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) c = D[c][P[i % 8][digits[i]]];
  return c === 0;
}

/** A real Aadhaar: 12 digits, first digit 2–9, valid Verhoeff checksum. */
export function isAadhaar(raw: string): boolean {
  const n = raw.replace(/[\s-]/g, "");
  return /^[2-9]\d{11}$/.test(n) && verhoeffValid(n);
}

export type PiiKind = "AADHAAR" | "PAN" | "PHONE" | "EMAIL" | "ACCOUNT" | "IFSC" | "VEHICLE" | "PERSON" | "CARD";

export interface ShieldResult {
  text: string;
  tokens: Record<string, string>; // token -> original
  counts: Partial<Record<PiiKind, number>>;
}

interface Pattern {
  kind: PiiKind;
  re: RegExp;
  accept?: (m: string) => boolean;
}

const PATTERNS: Pattern[] = [
  { kind: "EMAIL", re: /[\w.+-]+@[\w-]+\.[\w.]+/g },
  { kind: "AADHAAR", re: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g, accept: isAadhaar },
  { kind: "AADHAAR", re: /\b[Xx*]{4}[\s-]?[Xx*]{4}[\s-]?\d{4}\b/g }, // already-masked Aadhaar
  { kind: "CARD", re: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g },
  { kind: "PAN", re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { kind: "IFSC", re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
  { kind: "PHONE", re: /(?:\+91[\s-]?|\b0)?\b[6-9]\d{9}\b/g },
  // Vehicle numbers. OCR often reads the district digits "00"/"0x" as letter O, so accept O there — but only
  // when a separator follows, so ordinary words ("BOOK 2026") don't match.
  { kind: "VEHICLE", re: /\b[A-Z]{2}[\s-]?(?:\d{1,2}[\s-]?|(?:O\d|\dO|OO)[\s-]+)[A-Z]{1,3}[\s-]?\d{4}\b/g },
  // Labelled account numbers: "A/c No. 1234567890", "Account No: ...", "खाता संख्या ..."
  { kind: "ACCOUNT", re: /(?<=(?:A\/c|Account|Acct|खाता)\s*(?:No\.?|Number|संख्या|सं\.?)?\s*[:\-]?\s*)\d{9,18}\b/gi },
  { kind: "ACCOUNT", re: /\b\d{11,18}\b/g },
];

// Labelled names: "Name: Ramesh Kumar", "नाम: रमेश कुमार", "S/o Mahesh Prasad", "पुत्र श्री ..."
const NAME_LABEL =
  /(?:\b(?:Name|Insured Name|Name of (?:the )?(?:Insured|Informant|Deceased|Victim|Account Holder|Nominee)|Nominee|S\/o|W\/o|D\/o|C\/o)\s*[:\-.]?\s*|(?:नाम|पुत्र|पत्नी|पुत्री|सूचनाकर्ता|मृतक)\s*(?:श्री|श्रीमती)?\s*[:\-]?\s*)((?:[A-Z][a-z]+|[ऀ-ॿ]+)(?:\s+(?:[A-Z][a-z]+|[ऀ-ॿ]+)){0,2})/g;

const HONORIFIC = /^(?:Shri|Smt|Mr|Mrs|Ms|श्री|श्रीमती|स्व\.?)\s+/;

export function shield(input: string, knownNames: string[] = []): ShieldResult {
  const tokens: Record<string, string> = {};
  const reverse = new Map<string, string>();
  const counts: Partial<Record<PiiKind, number>> = {};
  let text = input;

  const tokenFor = (kind: PiiKind, original: string) => {
    const key = `${kind}:${original}`;
    const existing = reverse.get(key);
    if (existing) return existing;
    counts[kind] = (counts[kind] ?? 0) + 1;
    const tok = `[${kind}_${counts[kind]}]`;
    tokens[tok] = original;
    reverse.set(key, tok);
    return tok;
  };

  // 1. Known names first (longest first so "Ramesh Kumar" wins over "Ramesh").
  const names = [...new Set(knownNames.map((n) => n.trim()).filter((n) => n.length >= 3))].sort((a, b) => b.length - a.length);
  for (const n of names) {
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    text = text.replace(re, (m) => tokenFor("PERSON", m));
    // Also the first name alone, which documents often use.
    const first = n.split(/\s+/)[0];
    if (first && first.length >= 3 && first !== n) {
      text = text.replace(new RegExp(`(?<![\\w\\u0900-\\u097F])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w\\u0900-\\u097F])`, "g"), (m) => tokenFor("PERSON", m));
    }
  }

  // 2. Labelled names in documents.
  text = text.replace(NAME_LABEL, (full, name: string) => {
    const clean = name.replace(HONORIFIC, "").trim();
    if (!clean || clean.startsWith("[")) return full;
    return full.replace(name, tokenFor("PERSON", clean));
  });

  // 3. Structured identifiers.
  for (const p of PATTERNS) {
    text = text.replace(p.re, (m) => {
      if (m.startsWith("[")) return m;
      if (p.accept && !p.accept(m)) return m;
      return tokenFor(p.kind, m);
    });
  }

  return { text, tokens, counts };
}

/** Put the real values back — on the device, after the AI has responded. */
export function rehydrate(text: string, tokens: Record<string, string>): string {
  return text.replace(/\[(?:AADHAAR|PAN|PHONE|EMAIL|ACCOUNT|IFSC|VEHICLE|PERSON|CARD)_\d+\]/g, (t) => {
    const v = tokens[t];
    if (v === undefined) return t;
    // Never put a full Aadhaar or card number back into generated letters.
    if (t.startsWith("[AADHAAR")) return `XXXX XXXX ${v.replace(/\D/g, "").slice(-4)}`;
    if (t.startsWith("[CARD")) return `XXXX XXXX XXXX ${v.replace(/\D/g, "").slice(-4)}`;
    return v;
  });
}

/** For display: mask an Aadhaar the way UIDAI's masked Aadhaar does. */
export function maskAadhaar(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 12 ? `XXXX XXXX ${d.slice(-4)}` : raw;
}
