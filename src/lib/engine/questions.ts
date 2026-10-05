// Value-of-information questioner: ask the family only what unlocks the most money
// (weighted by deadline urgency) — never a 40-field form.

import type { Bilingual, EvaluationSummary, FactKey } from "./types";

export type QuestionKind = "yesno" | "date" | "number" | "choice";

export interface Question {
  key: FactKey;
  kind: QuestionKind;
  text: Bilingual;
  help?: Bilingual;
  choices?: { value: string; label: Bilingual }[];
}

export const QUESTIONS: Partial<Record<FactKey, Question>> = {
  incidentType: {
    key: "incidentType",
    kind: "choice",
    text: { en: "What happened to the person?", hi: "व्यक्ति के साथ क्या हुआ?" },
    choices: [
      { value: "death", label: { en: "They died", hi: "उनकी मृत्यु हो गई" } },
      { value: "grievous_injury", label: { en: "Serious injury (fracture, hospital stay, lasting harm)", hi: "गंभीर चोट (फ्रैक्चर, अस्पताल में भर्ती, स्थायी नुकसान)" } },
      { value: "minor_injury", label: { en: "Minor injury", hi: "मामूली चोट" } },
    ],
  },
  accidentDate: { key: "accidentDate", kind: "date", text: { en: "On what date did the accident happen?", hi: "दुर्घटना किस तारीख को हुई?" } },
  offendingVehicleIdentified: {
    key: "offendingVehicleIdentified",
    kind: "yesno",
    text: { en: "Do the police know which vehicle hit them (number plate found)?", hi: "क्या पुलिस को पता है कि किस वाहन ने टक्कर मारी (नंबर प्लेट मिली)?" },
    help: { en: "If the vehicle ran away and wasn't found, answer No.", hi: "अगर वाहन भाग गया और नहीं मिला, तो 'नहीं' चुनें।" },
  },
  victimRole: {
    key: "victimRole",
    kind: "choice",
    text: { en: "Where were they at the time?", hi: "उस समय वे कहाँ थे?" },
    choices: [
      { value: "rider_own_vehicle", label: { en: "Driving / riding their own vehicle", hi: "अपना वाहन चला रहे थे" } },
      { value: "rider_not_owner", label: { en: "Driving someone else's vehicle", hi: "किसी और का वाहन चला रहे थे" } },
      { value: "pillion", label: { en: "Pillion rider", hi: "पीछे बैठे थे" } },
      { value: "passenger", label: { en: "Passenger in a car/bus/auto", hi: "कार/बस/ऑटो में सवारी" } },
      { value: "pedestrian", label: { en: "Walking / pedestrian", hi: "पैदल" } },
    ],
  },
  ownVehiclePolicyActive: {
    key: "ownVehiclePolicyActive",
    kind: "yesno",
    text: { en: "Was their own vehicle insured on that date?", hi: "क्या उस तारीख पर उनके अपने वाहन का बीमा चालू था?" },
    help: { en: "Not sure? Check mParivahan with the vehicle number, or upload the policy.", hi: "पक्का नहीं? mParivahan पर गाड़ी नंबर से देखें, या पॉलिसी अपलोड करें।" },
  },
  ownVehicleCpaSumInsured: {
    key: "ownVehicleCpaSumInsured",
    kind: "number",
    text: { en: "Owner-driver PA cover amount on the policy (₹)?", hi: "पॉलिसी पर मालिक-चालक PA कवर राशि (₹)?" },
    help: { en: "Usually ₹15,00,000. Upload the policy and we'll read it.", hi: "आमतौर पर ₹15,00,000। पॉलिसी अपलोड करें, हम पढ़ लेंगे।" },
  },
  victimHeldValidDL: { key: "victimHeldValidDL", kind: "yesno", text: { en: "Did they have a valid driving licence?", hi: "क्या उनके पास वैध ड्राइविंग लाइसेंस था?" } },
  victimIsRegisteredOwner: { key: "victimIsRegisteredOwner", kind: "yesno", text: { en: "Was the vehicle registered in their name?", hi: "क्या वाहन उनके नाम पर पंजीकृत था?" } },
  pmsbyPremiumDebited: {
    key: "pmsbyPremiumDebited",
    kind: "yesno",
    text: { en: "Does their passbook show a ₹20 'PMSBY' debit (usually May-June)?", hi: "क्या उनकी पासबुक में ₹20 'PMSBY' कटौती दिखती है (आमतौर पर मई-जून)?" },
    help: { en: "Upload a photo of the passbook and we'll look for it.", hi: "पासबुक की फ़ोटो अपलोड करें, हम ढूँढ लेंगे।" },
  },
  pmjjbyPremiumDebited: {
    key: "pmjjbyPremiumDebited",
    kind: "yesno",
    text: { en: "Does the passbook show a ₹436 'PMJJBY' debit?", hi: "क्या पासबुक में ₹436 'PMJJBY' कटौती दिखती है?" },
  },
  hasRupayPmjdyCard: {
    key: "hasRupayPmjdyCard",
    kind: "yesno",
    text: { en: "Did they have a RuPay debit card from a Jan Dhan account?", hi: "क्या उनके पास जन धन खाते का रुपे डेबिट कार्ड था?" },
  },
  lastCardTxnDate: {
    key: "lastCardTxnDate",
    kind: "date",
    text: { en: "When did they last use that card (ATM, shop, POS)?", hi: "उन्होंने वह कार्ड आख़िरी बार कब इस्तेमाल किया (ATM, दुकान, POS)?" },
  },
  pmjdyAccountOpenedAfter2018: {
    key: "pmjdyAccountOpenedAfter2018",
    kind: "yesno",
    text: { en: "Was the Jan Dhan account opened after 28 August 2018?", hi: "क्या जन धन खाता 28 अगस्त 2018 के बाद खुला था?" },
  },
  victimAge: { key: "victimAge", kind: "number", text: { en: "Their age at the time?", hi: "उस समय उनकी उम्र?" } },
  wasCommutingOrOnDuty: {
    key: "wasCommutingOrOnDuty",
    kind: "yesno",
    text: { en: "Were they going to or from work, or on duty?", hi: "क्या वे काम पर जा/आ रहे थे, या ड्यूटी पर थे?" },
  },
  esicInsured: { key: "esicInsured", kind: "yesno", text: { en: "Did they have an ESIC card through their employer?", hi: "क्या नियोक्ता के ज़रिए उनका ESIC कार्ड था?" } },
  gigWorkerOnTrip: {
    key: "gigWorkerOnTrip",
    kind: "yesno",
    text: { en: "Were they working for a delivery or ride app at the time?", hi: "क्या वे उस समय किसी डिलीवरी या राइड ऐप के लिए काम कर रहे थे?" },
  },
  hospitalisedWithin24h: {
    key: "hospitalisedWithin24h",
    kind: "yesno",
    text: { en: "Were they taken to a hospital within 24 hours?", hi: "क्या उन्हें 24 घंटे के भीतर अस्पताल ले जाया गया?" },
  },
};

/** Fallback weight for entitlements whose amount can't be computed (e.g. ESIC pension). */
const UNKNOWN_AMOUNT_WEIGHT = 150000;
/** Facts every case needs before anything else is meaningful. */
const FOUNDATION: FactKey[] = ["incidentType", "accidentDate", "offendingVehicleIdentified", "victimRole"];

export interface RankedQuestion {
  question: Question;
  score: number;
  unlocks: string[]; // entitlement ids
}

export function rankQuestions(summary: EvaluationSummary, limit = 4): RankedQuestion[] {
  const scores = new Map<FactKey, { score: number; unlocks: Set<string> }>();

  for (const r of summary.results) {
    if (r.status !== "possible") continue;
    const value = r.informational ? 30000 : (r.amount.value ?? UNKNOWN_AMOUNT_WEIGHT);
    // Urgency: deadlines in the next 90 days weigh up to 2x.
    const urgency = r.daysLeft === null ? 1 : 1 + Math.max(0, Math.min(90, 90 - r.daysLeft)) / 90;
    for (const k of r.missingFacts) {
      const e = scores.get(k) ?? { score: 0, unlocks: new Set<string>() };
      e.score += value * urgency;
      e.unlocks.add(r.id);
      scores.set(k, e);
    }
  }

  for (const k of FOUNDATION) {
    const e = scores.get(k);
    if (e) e.score += 10_000_000; // always ask foundation facts first
  }

  return [...scores.entries()]
    .filter(([k]) => QUESTIONS[k])
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([k, v]) => ({ question: QUESTIONS[k]!, score: Math.round(v.score), unlocks: [...v.unlocks] }));
}
