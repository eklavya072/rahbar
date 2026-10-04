// Deterministic document parsers. No AI: these read OCR lines and pull out facts with evidence
// (the exact line and its bounding box), so every fact can be shown on the document.

import { addDays, daysBetween, isValidISO } from "../engine/dates";
import type { Evidence, Facts, FactKey, Provenance } from "../engine/types";
import { asciiDigits } from "../agents/verifier";

export type DocKind = "fir" | "passbook" | "policy" | "other";

export interface OcrLine {
  text: string;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface ParsedDoc {
  docId: string;
  kind: DocKind;
  label: string;
  facts: Partial<Facts>;
  provenance: Partial<Record<FactKey, Provenance>>;
  /** Free-text parts worth sending (anonymised) to the AI extractor, e.g. the FIR narrative. */
  narrative: string;
  notes: string[];
}

const MON: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, "0");

/** All dates in a line, in order. Handles 12/09/2026, 12-09-2026, 12.09.2026, 12-Sep-2026, 2026-09-12. */
export function datesIn(line: string): string[] {
  const t = asciiDigits(line);
  const out: { i: number; iso: string }[] = [];
  for (const m of t.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g)) out.push({ i: m.index ?? 0, iso: `${m[3]}-${pad(+m[2])}-${pad(+m[1])}` });
  for (const m of t.matchAll(/\b(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-](\d{4})\b/g)) {
    const mo = MON[m[2].toLowerCase()];
    if (mo) out.push({ i: m.index ?? 0, iso: `${m[3]}-${pad(mo)}-${pad(+m[1])}` });
  }
  for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) out.push({ i: m.index ?? 0, iso: `${m[1]}-${m[2]}-${m[3]}` });
  return out.sort((a, b) => a.i - b.i).map((d) => d.iso).filter(isValidISO);
}

/**
 * OCR engines often read table cells column by column, splitting one passbook row into several "lines".
 * Rebuild visual rows: group lines whose vertical centres align, order each row left→right, join with " | ".
 */
export function mergeRows(lines: OcrLine[]): OcrLine[] {
  const withBox = lines.filter((l) => l.bbox);
  if (withBox.length !== lines.length || lines.length < 2) return lines;
  const items = [...withBox].sort((a, b) => a.bbox!.y0 - b.bbox!.y0);
  const rows: OcrLine[][] = [];
  for (const l of items) {
    const cy = (l.bbox!.y0 + l.bbox!.y1) / 2;
    const h = l.bbox!.y1 - l.bbox!.y0;
    const row = rows.find((r) => {
      const rb = r[0].bbox!;
      const rcy = (rb.y0 + rb.y1) / 2;
      return Math.abs(rcy - cy) < 0.5 * Math.min(h, rb.y1 - rb.y0);
    });
    if (row) row.push(l);
    else rows.push([l]);
  }
  return rows
    .map((r) => r.sort((a, b) => a.bbox!.x0 - b.bbox!.x0))
    .map((r) => ({
      text: r.map((l) => l.text).join(" | "),
      bbox: {
        x0: Math.min(...r.map((l) => l.bbox!.x0)),
        y0: Math.min(...r.map((l) => l.bbox!.y0)),
        x1: Math.max(...r.map((l) => l.bbox!.x1)),
        y1: Math.max(...r.map((l) => l.bbox!.y1)),
      },
    }))
    .sort((a, b) => a.bbox.y0 - b.bbox.y0);
}

export function classifyDoc(lines: OcrLine[]): DocKind {
  const all = lines.map((l) => l.text).join("\n");
  if (/FIRST INFORMATION REPORT|प्रथम सूचना रिपोर्ट|\bF\.?I\.?R\.?\s*No/i.test(all)) return "fir";
  if (/Policy Schedule|Certificate of Insurance|Period of Insurance|Package Policy|Liability Only Policy/i.test(all)) return "policy";
  if (/Passbook|Statement of Account|Account Statement|पासबुक|Withdrawal|Balance/i.test(all)) return "passbook";
  return "other";
}

const ev = (docId: string, docLabel: string, line: OcrLine): Evidence => ({ docId, docLabel, quote: line.text.trim(), bbox: line.bbox });
const prov = (e: Evidence, confidence = 0.95): Provenance => ({ source: "document", confirmed: false, evidence: e, confidence });

// ---------------- Passbook ----------------
export function parsePassbook(docId: string, label: string, lines: OcrLine[], accidentDate: string | null): ParsedDoc {
  const facts: Partial<Facts> = {};
  const provenance: ParsedDoc["provenance"] = {};
  const notes: string[] = [];

  for (const line of lines) {
    const t = asciiDigits(line.text);
    if (/PMSBY|SURAKSHA\s*BIMA|सुरक्षा\s*बीमा/i.test(t) && /\b20(?:\.00)?\b/.test(t)) {
      const d = datesIn(t)[0];
      // PMSBY cover year runs 1 June – 31 May. The debit must fall in the year covering the accident.
      const relevant = !accidentDate || !d || coverYearMatches(d, accidentDate);
      if (relevant) {
        facts.pmsbyPremiumDebited = true;
        provenance.pmsbyPremiumDebited = prov(ev(docId, label, line));
      } else notes.push(`PMSBY debit on ${d} is for a different cover year than the accident.`);
    }
    if (/PMJJBY|JEEVAN\s*JYOTI|जीवन\s*ज्योति/i.test(t) && /\b436(?:\.00)?\b/.test(t)) {
      const d = datesIn(t)[0];
      if (!accidentDate || !d || coverYearMatches(d, accidentDate)) {
        facts.pmjjbyPremiumDebited = true;
        provenance.pmjjbyPremiumDebited = prov(ev(docId, label, line));
      }
    }
    if (/PMJDY|JAN\s*DHAN|जन\s*धन|BSBD/i.test(t) && /RUPAY|CARD|PMJDY/i.test(t)) {
      facts.hasRupayPmjdyCard = true;
      provenance.hasRupayPmjdyCard = prov(ev(docId, label, line), 0.85);
    }
    if (/(Date of Opening|A\/c Open(?:ing|ed)? (?:Date|On)|Opened On|खाता खोलने की तिथि)/i.test(t)) {
      const d = datesIn(t)[0];
      if (d) {
        facts.pmjdyAccountOpenedAfter2018 = d > "2018-08-28";
        provenance.pmjdyAccountOpenedAfter2018 = prov(ev(docId, label, line));
      }
    }
  }

  // Card transactions (POS / ATM / e-com on the RuPay card) before the accident: take the latest.
  const cardLines = lines
    .map((l) => ({ l, d: datesIn(l.text)[0] }))
    .filter(({ l, d }) => d && /\b(POS|ATM|RUPAY|ECOM|CARD\s*TXN|DEBIT\s*CARD)\b/i.test(l.text) && !/PMSBY|PMJJBY/i.test(l.text))
    .filter(({ d }) => !accidentDate || d! <= accidentDate)
    .sort((a, b) => (a.d! < b.d! ? 1 : -1));
  if (cardLines.length) {
    const { l, d } = cardLines[0];
    facts.lastCardTxnDate = d!;
    provenance.lastCardTxnDate = prov(ev(docId, label, l));
    if (facts.hasRupayPmjdyCard === undefined && /RUPAY/i.test(l.text)) {
      facts.hasRupayPmjdyCard = true;
      provenance.hasRupayPmjdyCard = prov(ev(docId, label, l), 0.75);
    }
  }

  // If the passbook covers the right period and shows no PMSBY debit, say so — but don't conclude "false"
  // (the debit may be on another account). Leave it unknown and ask.
  if (facts.pmsbyPremiumDebited === undefined) notes.push("No ₹20 PMSBY debit found on these pages.");

  return { docId, kind: "passbook", label, facts, provenance, narrative: "", notes };
}

/** PMSBY/PMJJBY cover year: 1 June to 31 May. */
export function coverYearMatches(debitDate: string, accidentDate: string): boolean {
  const start = (d: string) => {
    const y = Number(d.slice(0, 4));
    return d.slice(5) >= "06-01" ? `${y}-06-01` : `${y - 1}-06-01`;
  };
  // Premiums are debited up to ~31 May for the year starting 1 June; allow a debit in May for the next year.
  const debitYear = debitDate.slice(5, 7) === "05" ? start(addDays(debitDate, 31)) : start(debitDate);
  return debitYear === start(accidentDate);
}

// ---------------- Motor policy ----------------
export function parsePolicy(docId: string, label: string, lines: OcrLine[], accidentDate: string | null, victimName: string | null): ParsedDoc {
  const facts: Partial<Facts> = {};
  const provenance: ParsedDoc["provenance"] = {};
  const notes: string[] = [];

  for (const line of lines) {
    const t = asciiDigits(line.text);
    if (/Period of Insurance|Policy Period|Valid From|बीमा अवधि/i.test(t)) {
      const ds = datesIn(t);
      if (ds.length >= 2 && accidentDate) {
        facts.ownVehiclePolicyActive = accidentDate >= ds[0] && accidentDate <= ds[1];
        provenance.ownVehiclePolicyActive = prov(ev(docId, label, line));
      } else if (ds.length >= 2) {
        notes.push(`Policy period ${ds[0]} to ${ds[1]} — add the accident date to check it.`);
      }
    }
    if (/(Compulsory\s*)?P\.?A\.?\s*(Cover)?.*Owner[\s-]*Driver|Owner[\s-]*Driver.*P\.?A\.?|मालिक.?चालक/i.test(t)) {
      const amt = t.match(/(?:₹|Rs\.?|INR)?\s?(\d{1,2},\d{2},\d{3}|\d{6,8})/);
      if (amt) {
        facts.ownVehicleCpaSumInsured = Number(amt[1].replace(/,/g, ""));
        provenance.ownVehicleCpaSumInsured = prov(ev(docId, label, line));
      } else if (/Not\s*(Opted|Covered|Applicable)|Excluded|NIL/i.test(t)) {
        facts.ownVehicleCpaSumInsured = 0;
        provenance.ownVehicleCpaSumInsured = prov(ev(docId, label, line));
      }
    }
    if (victimName && /(Insured Name|Name of (?:the )?Insured|Insured\s*:|बीमित का नाम)/i.test(t)) {
      const match = nameMatches(t, victimName);
      facts.victimIsRegisteredOwner = match;
      provenance.victimIsRegisteredOwner = prov(ev(docId, label, line), match ? 0.9 : 0.7);
    }
  }
  return { docId, kind: "policy", label, facts, provenance, narrative: "", notes };
}

/** Loose name match: every token of the shorter name appears in the other (handles middle names, case). */
export function nameMatches(haystack: string, name: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-zऀ-ॿ\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const h = new Set(norm(haystack));
  const n = norm(name).filter((w) => !["shri", "smt", "mr", "mrs", "late"].includes(w));
  return n.length > 0 && n.filter((w) => h.has(w)).length >= Math.min(2, n.length);
}

// ---------------- FIR ----------------
export function parseFir(docId: string, label: string, lines: OcrLine[]): ParsedDoc {
  const facts: Partial<Facts> = { firRegistered: true };
  const provenance: ParsedDoc["provenance"] = {};
  const notes: string[] = [];
  const narrativeLines: string[] = [];
  let inNarrative = false;

  const firstLine = lines.find((l) => /FIR\s*No|प्रथम सूचना/i.test(l.text)) ?? lines[0];
  if (firstLine) provenance.firRegistered = prov(ev(docId, label, firstLine));

  for (const line of lines) {
    const t = asciiDigits(line.text);
    if (/(Date of occurrence|Occurrence of offence|Date from|घटना की (?:तारीख|तिथि|दिनांक)|घटना दिनांक)/i.test(t)) {
      const d = datesIn(t)[0];
      if (d && !facts.accidentDate) {
        facts.accidentDate = d;
        provenance.accidentDate = prov(ev(docId, label, line));
      }
    }
    if (/(unknown|unidentified|untraced)\s*(vehicle|truck|car|driver|accused)|vehicle (?:number )?(?:not known|unknown)|अज्ञात\s*(वाहन|ट्रक|चालक|गाड़ी)|नंबर (?:नहीं|ज्ञात नहीं)/i.test(t)) {
      facts.offendingVehicleIdentified = false;
      provenance.offendingVehicleIdentified = prov(ev(docId, label, line), 0.9);
    }
    if (facts.offendingVehicleIdentified === undefined && /(accused vehicle|offending vehicle|vehicle no\.? of accused|आरोपी वाहन)/i.test(t) && /[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}/.test(t)) {
      facts.offendingVehicleIdentified = true;
      provenance.offendingVehicleIdentified = prov(ev(docId, label, line), 0.9);
    }
    if (/(died|dead|declared dead|death|मृत्यु|मृत घोषित|की मौत)/i.test(t) && !facts.incidentType) {
      facts.incidentType = "death";
      provenance.incidentType = prov(ev(docId, label, line), 0.85);
    }
    if (/(Contents of FIR|First Information contents|घटना का विवरण|प्रथम सूचना का विवरण|Brief facts)/i.test(t)) {
      inNarrative = true;
      continue;
    }
    if (inNarrative && /(Action taken|की गई कार्यवाही|Signature|हस्ताक्षर|R\.?O\.?A\.?C)/i.test(t)) inNarrative = false;
    if (inNarrative) narrativeLines.push(line.text);
  }

  // If no explicit narrative block was found, send the whole text (it will be anonymised first).
  const narrative = narrativeLines.length ? narrativeLines.join("\n") : lines.map((l) => l.text).join("\n");
  return { docId, kind: "fir", label, facts, provenance, narrative, notes };
}

export function parseDocument(docId: string, label: string, lines: OcrLine[], ctx: { accidentDate: string | null; victimName: string | null }): ParsedDoc {
  const kind = classifyDoc(lines);
  if (kind === "fir") return parseFir(docId, label, lines);
  if (kind === "passbook") return parsePassbook(docId, label, lines, ctx.accidentDate);
  if (kind === "policy") return parsePolicy(docId, label, lines, ctx.accidentDate, ctx.victimName);
  return { docId, kind: "other", label, facts: {}, provenance: {}, narrative: lines.map((l) => l.text).join("\n"), notes: ["Unrecognised document — text kept for the AI reader."] };
}

/** Days between the last card use and the accident, for display. */
export function cardGapDays(f: Pick<Facts, "lastCardTxnDate" | "accidentDate">): number | null {
  return isValidISO(f.lastCardTxnDate) && isValidISO(f.accidentDate) ? daysBetween(f.lastCardTxnDate, f.accidentDate) : null;
}
