// MACT "just compensation" engine for death cases + Settlement Offer Auditor.
// Sarla Verma v. DTC (2009) — multiplier and personal-expense deduction
// National Insurance v. Pranay Sethi (2017, Constitution Bench) — future prospects; conventional heads (+10% every 3 years)
// Magma General v. Nanu Ram (2018) — consortium for each claimant (spousal, parental, filial)

import { daysBetween, isValidISO } from "./dates";
import type { Bilingual, Citation } from "./types";

export type Employment = "permanent" | "self_employed" | "fixed_wage" | "not_earning";
export type IncomeSource = "payslip" | "bank" | "itr" | "declared" | "notional";

export interface MactInput {
  age: number;
  monthlyIncome: number;
  incomeSource: IncomeSource;
  employment: Employment;
  married: boolean;
  spouse: boolean;
  children: number;
  parents: number; // dependent parents
  others: number; // other dependants (e.g. siblings)
  asOf: string; // ISO date the award is computed for
}

export interface MactHead {
  id: "dependency" | "estate" | "funeral" | "consortium";
  label: Bilingual;
  amount: number;
  working: string;
  basis: Citation;
}

export interface MactEstimate {
  heads: MactHead[];
  total: number;
  annualIncome: number;
  futureProspects: number; // fraction
  deduction: number; // fraction
  multiplier: number;
  claimants: number;
  conventionalFactor: number;
  /** Extra award per ₹1,000/month of proven income — why income proof matters. */
  perThousandMonthly: number;
  notes: Bilingual[];
}

const SARLA: Citation = { title: "Sarla Verma v. DTC (2009) 6 SCC 121", url: "https://indiankanoon.org/doc/837924/" };
const PRANAY: Citation = { title: "National Insurance v. Pranay Sethi (2017) 16 SCC 680", url: "https://aphc.gov.in/docs/imp_judgements/PRANAY%20SETHI%20AND%20ORS.pdf" };
const MAGMA: Citation = { title: "Magma General v. Nanu Ram (2018) 18 SCC 130", url: "https://www.scconline.com/blog/post/2026/08/19/sc-on-spousal-and-parental-consortium-in-motor-accident-compensation/" };

/** Sarla Verma multiplier by age of the deceased. */
export function multiplierFor(age: number): number {
  if (age < 15) return 15;
  if (age <= 25) return 18;
  if (age <= 30) return 17;
  if (age <= 35) return 16;
  if (age <= 40) return 15;
  if (age <= 45) return 14;
  if (age <= 50) return 13;
  if (age <= 55) return 11;
  if (age <= 60) return 9;
  if (age <= 65) return 7;
  return 5;
}

/** Pranay Sethi future prospects. */
export function futureProspectsFor(employment: Employment, age: number): number {
  if (employment === "not_earning" || age > 60) return 0;
  const permanent = employment === "permanent";
  if (age < 40) return permanent ? 0.5 : 0.4;
  if (age < 50) return permanent ? 0.3 : 0.25;
  return permanent ? 0.15 : 0.1;
}

/** Sarla Verma personal-expense deduction. */
export function deductionFor(i: Pick<MactInput, "married" | "spouse" | "children" | "parents" | "others">): number {
  const dependants = (i.spouse ? 1 : 0) + i.children + i.parents + i.others;
  if (!i.married) return dependants >= 3 ? 1 / 3 : 1 / 2;
  if (dependants <= 3) return 1 / 3;
  if (dependants <= 6) return 1 / 4;
  return 1 / 5;
}

/** Pranay Sethi: conventional heads rise 10% for every completed 3-year block after 31 Oct 2017. */
export function conventionalFactor(asOf: string): number {
  if (!isValidISO(asOf)) return 1;
  const blocks = Math.max(0, Math.floor(daysBetween("2017-10-31", asOf) / (365.25 * 3)));
  return Math.pow(1.1, blocks);
}

const r = (n: number) => Math.round(n);
const inr = (n: number) => `₹${r(n).toLocaleString("en-IN")}`;

export function estimateDeath(i: MactInput): MactEstimate {
  const annual = i.monthlyIncome * 12;
  const fp = futureProspectsFor(i.employment, i.age);
  const ded = deductionFor(i);
  const mult = multiplierFor(i.age);
  const lod = annual * (1 + fp) * (1 - ded) * mult;
  const f = conventionalFactor(i.asOf);
  const estate = r(15000 * f);
  const funeral = r(15000 * f);
  const perConsortium = r(40000 * f);
  const claimants = Math.max(1, (i.spouse ? 1 : 0) + i.children + i.parents);
  const dedLabel = ded === 1 / 2 ? "1/2" : ded === 1 / 3 ? "1/3" : ded === 1 / 4 ? "1/4" : "1/5";

  const heads: MactHead[] = [
    {
      id: "dependency",
      label: { en: "Loss of dependency", hi: "आश्रितता की हानि" },
      amount: r(lod),
      working: `${inr(annual)}/yr × (1 + ${Math.round(fp * 100)}% future prospects) × (1 − ${dedLabel} personal expenses) × multiplier ${mult}`,
      basis: SARLA,
    },
    { id: "estate", label: { en: "Loss of estate", hi: "संपदा की हानि" }, amount: estate, working: `₹15,000 × ${f.toFixed(2)} (10% every 3 years since 2017)`, basis: PRANAY },
    { id: "funeral", label: { en: "Funeral expenses", hi: "अंतिम संस्कार ख़र्च" }, amount: funeral, working: `₹15,000 × ${f.toFixed(2)}`, basis: PRANAY },
    {
      id: "consortium",
      label: { en: "Loss of consortium (each family member)", hi: "साहचर्य की हानि (हर सदस्य)" },
      amount: perConsortium * claimants,
      working: `${inr(perConsortium)} × ${claimants} (each spouse, child and parent)`,
      basis: MAGMA,
    },
  ];

  const notes: Bilingual[] = [];
  if (i.incomeSource === "notional" || i.incomeSource === "declared") {
    notes.push({
      en: "Income without documents is often assessed at minimum wage. Bank credits, salary slips or ITRs can raise the award. See 'Income evidence'.",
      hi: "बिना दस्तावेज़ की आय अक्सर न्यूनतम मज़दूरी मानी जाती है। बैंक क्रेडिट, सैलरी स्लिप या ITR से मुआवज़ा बढ़ सकता है।",
    });
  }
  if (i.employment === "not_earning") {
    notes.push({
      en: "For homemakers, students and children, courts use a notional income (Kirti v. Oriental, 2021; Deepak Singh, 2025). Enter the amount your lawyer proposes.",
      hi: "गृहिणी, छात्र और बच्चों के लिए अदालतें काल्पनिक आय मानती हैं। वकील द्वारा सुझाई राशि डालें।",
    });
  }
  notes.push({
    en: "This is an estimate using Supreme Court formulas. Tribunals also add interest and may differ on facts. Use it to check an offer, not as a promise.",
    hi: "यह सुप्रीम कोर्ट के सूत्रों से अनुमान है। ट्रिब्यूनल ब्याज भी जोड़ते हैं और तथ्यों पर अलग राय रख सकते हैं। इसे प्रस्ताव जाँचने के लिए इस्तेमाल करें, वादे के रूप में नहीं।",
  });

  return {
    heads,
    total: heads.reduce((a, h) => a + h.amount, 0),
    annualIncome: annual,
    futureProspects: fp,
    deduction: ded,
    multiplier: mult,
    claimants,
    conventionalFactor: f,
    perThousandMonthly: r(12_000 * (1 + fp) * (1 - ded) * mult),
    notes,
  };
}

// ---------------- Offer auditor ----------------

export interface OfferInput {
  total: number;
  incomeConsidered?: number | null; // monthly
  multiplierUsed?: number | null;
  futureProspectsIncluded?: boolean | null;
  deductionUsed?: number | null; // fraction e.g. 0.5
  consortiumCount?: number | null;
}

export interface OfferFlag {
  severity: "high" | "medium";
  message: Bilingual;
  impact: number | null; // approx rupees the offer is missing because of this
}

export interface OfferAudit {
  gap: number;
  ratio: number;
  verdict: "fair" | "low" | "very_low";
  flags: OfferFlag[];
}

export function auditOffer(est: MactEstimate, input: MactInput, offer: OfferInput): OfferAudit {
  const flags: OfferFlag[] = [];
  const gap = est.total - offer.total;
  const ratio = est.total > 0 ? offer.total / est.total : 1;
  const base = (monthly: number, fp: number, ded: number, mult: number) => monthly * 12 * (1 + fp) * (1 - ded) * mult;

  if (offer.incomeConsidered != null && offer.incomeConsidered < input.monthlyIncome * 0.95) {
    const impact = base(input.monthlyIncome - offer.incomeConsidered, est.futureProspects, est.deduction, est.multiplier);
    flags.push({
      severity: "high",
      impact: r(impact),
      message: {
        en: `Income taken as ₹${offer.incomeConsidered.toLocaleString("en-IN")}/month, but the evidence shows ₹${input.monthlyIncome.toLocaleString("en-IN")}/month.`,
        hi: `आय ₹${offer.incomeConsidered.toLocaleString("en-IN")}/माह मानी गई, जबकि सबूत ₹${input.monthlyIncome.toLocaleString("en-IN")}/माह दिखाते हैं।`,
      },
    });
  }
  if (offer.futureProspectsIncluded === false && est.futureProspects > 0) {
    flags.push({
      severity: "high",
      impact: r(base(input.monthlyIncome, est.futureProspects, est.deduction, est.multiplier) - base(input.monthlyIncome, 0, est.deduction, est.multiplier)),
      message: {
        en: `Future prospects (${Math.round(est.futureProspects * 100)}%) are missing. The Constitution Bench in Pranay Sethi made them mandatory.`,
        hi: `भविष्य की संभावनाएँ (${Math.round(est.futureProspects * 100)}%) छूटी हैं। प्रणय सेठी फ़ैसले में यह अनिवार्य हैं।`,
      },
    });
  }
  if (offer.multiplierUsed != null && offer.multiplierUsed < est.multiplier) {
    flags.push({
      severity: "high",
      impact: r(base(input.monthlyIncome, est.futureProspects, est.deduction, est.multiplier - offer.multiplierUsed)),
      message: {
        en: `Multiplier ${offer.multiplierUsed} used; Sarla Verma gives ${est.multiplier} for age ${input.age}.`,
        hi: `गुणक ${offer.multiplierUsed} लगाया; सरला वर्मा के अनुसार उम्र ${input.age} के लिए ${est.multiplier} है।`,
      },
    });
  }
  if (offer.deductionUsed != null && offer.deductionUsed > est.deduction + 0.001) {
    flags.push({
      severity: "medium",
      impact: r(base(input.monthlyIncome, est.futureProspects, est.deduction, est.multiplier) - base(input.monthlyIncome, est.futureProspects, offer.deductionUsed, est.multiplier)),
      message: {
        en: `Personal-expense deduction of ${Math.round(offer.deductionUsed * 100)}% is higher than Sarla Verma's ${Math.round(est.deduction * 100)}% for this family size.`,
        hi: `निजी ख़र्च कटौती ${Math.round(offer.deductionUsed * 100)}% है, जबकि इस परिवार के लिए सरला वर्मा ${Math.round(est.deduction * 100)}% कहता है।`,
      },
    });
  }
  if (offer.consortiumCount != null && offer.consortiumCount < est.claimants) {
    const per = est.heads.find((h) => h.id === "consortium")!.amount / est.claimants;
    flags.push({
      severity: "medium",
      impact: r(per * (est.claimants - offer.consortiumCount)),
      message: {
        en: `Consortium given for ${offer.consortiumCount} person(s); Magma (2018) allows it for each of the ${est.claimants} family members.`,
        hi: `साहचर्य ${offer.consortiumCount} व्यक्ति को दिया; मैग्मा (2018) के अनुसार परिवार के सभी ${est.claimants} सदस्यों को मिलता है।`,
      },
    });
  }

  const verdict: OfferAudit["verdict"] = ratio >= 0.9 ? "fair" : ratio >= 0.7 ? "low" : "very_low";
  return { gap: r(gap), ratio, verdict, flags };
}

export function offerReply(est: MactEstimate, input: MactInput, offer: OfferInput, audit: OfferAudit, lang: "en" | "hi"): string {
  const lines: string[] = [];
  if (lang === "hi") {
    lines.push(`बीमा कंपनी का प्रस्ताव: ₹${offer.total.toLocaleString("en-IN")}। सुप्रीम कोर्ट के सूत्रों से अनुमानित उचित मुआवज़ा: ₹${est.total.toLocaleString("en-IN")} (अंतर ₹${audit.gap.toLocaleString("en-IN")})।`);
    if (audit.flags.length) lines.push("कमियाँ:");
    audit.flags.forEach((f, i) => lines.push(`${i + 1}. ${f.message.hi}${f.impact ? ` (लगभग ₹${f.impact.toLocaleString("en-IN")})` : ""}`));
    lines.push("हम धारा 149(3) के तहत इस प्रस्ताव पर ट्रिब्यूनल में सुनवाई चाहते हैं, या संशोधित प्रस्ताव का अनुरोध करते हैं।");
  } else {
    lines.push(`Insurer's offer: ₹${offer.total.toLocaleString("en-IN")}. Estimated just compensation using Supreme Court formulas: ₹${est.total.toLocaleString("en-IN")} (gap ₹${audit.gap.toLocaleString("en-IN")}).`);
    if (audit.flags.length) lines.push("Deficiencies:");
    audit.flags.forEach((f, i) => lines.push(`${i + 1}. ${f.message.en}${f.impact ? ` (≈ ₹${f.impact.toLocaleString("en-IN")})` : ""}`));
    lines.push("We request a revised offer, failing which we ask the Tribunal to fix a hearing under Section 149(3) of the Motor Vehicles Act.");
  }
  return lines.join("\n");
}
