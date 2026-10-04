// Letter assembly: deterministic skeleton + (optional) AI-written paragraphs that may only use placeholders.

import type { EntitlementResult, Facts, Lang } from "../engine/types";
import { formatDate, formatINR } from "../engine/dates";
import { DOCS } from "../engine/documents";
import { extractAmounts, verifyDraft, type VerifierResult } from "../agents/verifier";

export interface LetterContext {
  lang: Lang;
  victimName: string;
  claimantName: string;
  relation: string;
  firNo: string | null;
  facts: Facts;
  today: string;
}

export interface Letter {
  id: string;
  to: string;
  subject: string;
  date: string;
  body: string[];
  enclosures: string[];
  signature: string[];
  verification: VerifierResult;
  source: "ai" | "template";
  model?: string | null;
}

const REL_HI: Record<string, string> = { wife: "पत्नी", husband: "पति", mother: "माँ", father: "पिता", son: "बेटा", daughter: "बेटी", self: "स्वयं", caseworker: "सहायक" };

export function placeholderValues(r: EntitlementResult, c: LetterContext): Record<string, string> {
  return {
    "{{DECEASED}}": c.victimName || (c.lang === "hi" ? "[नाम]" : "[Name]"),
    "{{CLAIMANT}}": c.claimantName || (c.lang === "hi" ? "[आपका नाम]" : "[Your name]"),
    "{{ACCIDENT_DATE}}": c.facts.accidentDate ? formatDate(c.facts.accidentDate, c.lang) : c.lang === "hi" ? "[तारीख]" : "[date]",
    "{{PLACE}}": c.facts.state ?? (c.lang === "hi" ? "[स्थान]" : "[place]"),
    "{{AMOUNT}}": r.amount.value ? formatINR(r.amount.value) : r.amount.label[c.lang],
    "{{FIR_NO}}": c.firNo ?? (c.lang === "hi" ? "[एफ़आईआर संख्या]" : "[FIR number]"),
  };
}

export function fill(text: string, vals: Record<string, string>): string {
  return Object.entries(vals).reduce((t, [k, v]) => t.split(k).join(v), text);
}

export function templateParagraphs(r: EntitlementResult, c: LetterContext): { factsParagraph: string; requestParagraph: string } {
  const died = c.facts.incidentType === "death";
  if (c.lang === "hi") {
    return {
      factsParagraph: `{{DECEASED}} ${died ? "की" : "के साथ"} {{ACCIDENT_DATE}} को एक सड़क दुर्घटना ${died ? "में मृत्यु हो गई" : "हुई जिसमें उन्हें गंभीर चोटें आईं"}। इस संबंध में एफ़आईआर संख्या {{FIR_NO}} दर्ज है।${c.facts.offendingVehicleIdentified === false ? " टक्कर मारने वाले वाहन की पहचान नहीं हो सकी।" : ""}`,
      requestParagraph: `मैं, {{CLAIMANT}}, ${r.name.hi} के अंतर्गत {{AMOUNT}} के दावे को स्वीकार कर भुगतान करने का अनुरोध करता/करती हूँ। आवश्यक दस्तावेज़ संलग्न हैं।`,
    };
  }
  return {
    factsParagraph: `{{DECEASED}} ${died ? "died" : "was seriously injured"} in a road accident on {{ACCIDENT_DATE}}. FIR No. {{FIR_NO}} has been registered.${c.facts.offendingVehicleIdentified === false ? " The vehicle that caused the accident could not be identified." : ""}`,
    requestParagraph: `I, {{CLAIMANT}}, request that the claim of {{AMOUNT}} under the ${r.name.en} be admitted and processed. The required documents are enclosed.`,
  };
}

export function assembleLetter(r: EntitlementResult, c: LetterContext, paras: { factsParagraph: string; requestParagraph: string }, source: "ai" | "template", model?: string | null): Letter {
  const vals = placeholderValues(r, c);
  const body = [fill(paras.factsParagraph, vals), fill(paras.requestParagraph, vals)];
  const hi = c.lang === "hi";
  const relation = hi ? REL_HI[c.relation] ?? c.relation : c.relation;
  const subject = hi
    ? `विषय: ${r.name.hi} के अंतर्गत दावा — ${vals["{{DECEASED}}"]} — दुर्घटना दिनांक ${vals["{{ACCIDENT_DATE}}"]}`
    : `Subject: Claim under the ${r.name.en} — ${vals["{{DECEASED}}"]} — accident on ${vals["{{ACCIDENT_DATE}}"]}`;

  // Allowed amounts: the computed value plus any figure in the rule's own amount label (e.g. "up to ₹10 lakh").
  const allowedAmounts = [r.amount.value, ...extractAmounts(r.amount.label.en).map((a) => a.value), ...extractAmounts(r.amount.label.hi).map((a) => a.value)].filter((x): x is number => typeof x === "number");
  const allowedDates = [c.facts.accidentDate, c.today, r.deadline.date].filter((x): x is string => !!x);
  const verification = verifyDraft(body.join("\n"), { amounts: allowedAmounts, dates: allowedDates });

  return {
    id: r.id,
    to: `${hi ? "सेवा में" : "To"},\n${r.office[c.lang]}`,
    subject,
    date: formatDate(c.today, c.lang),
    body,
    enclosures: r.documents.map((d) => DOCS[d].name[c.lang]),
    signature: [vals["{{CLAIMANT}}"], relation ? `(${relation}${hi ? "" : " of the " + (c.facts.incidentType === "death" ? "deceased" : "injured")})` : ""].filter(Boolean),
    verification,
    source,
    model,
  };
}

export function firNumber(lines: string[]): string | null {
  for (const l of lines) {
    const m = l.match(/FIR\s*No\.?\s*[:\-]?\s*([0-9]{1,5}\s*\/\s*[0-9]{4})/i);
    if (m) return m[1].replace(/\s/g, "");
  }
  return null;
}
