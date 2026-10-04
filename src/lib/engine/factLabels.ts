import { formatDate, formatINR } from "./dates";
import type { Bilingual, FactKey, Facts, Lang } from "./types";

export const FACT_LABELS: Record<FactKey, Bilingual> = {
  incidentType: { en: "What happened", hi: "क्या हुआ" },
  accidentDate: { en: "Accident date", hi: "दुर्घटना की तारीख" },
  state: { en: "State", hi: "राज्य" },
  firRegistered: { en: "FIR registered", hi: "एफ़आईआर दर्ज" },
  offendingVehicleIdentified: { en: "Vehicle at fault identified", hi: "दोषी वाहन की पहचान" },
  offendingVehicleInsured: { en: "Vehicle at fault insured", hi: "दोषी वाहन का बीमा" },
  victimAge: { en: "Age", hi: "उम्र" },
  victimRole: { en: "Where they were", hi: "वे कहाँ थे" },
  victimIsRegisteredOwner: { en: "Registered owner of own vehicle", hi: "अपने वाहन के पंजीकृत मालिक" },
  victimHeldValidDL: { en: "Valid driving licence", hi: "वैध ड्राइविंग लाइसेंस" },
  ownVehiclePolicyActive: { en: "Own vehicle insured on that date", hi: "उस दिन अपने वाहन का बीमा चालू" },
  ownVehicleCpaSumInsured: { en: "Owner-driver PA cover", hi: "मालिक-चालक PA कवर" },
  pmsbyPremiumDebited: { en: "PMSBY ₹20 premium debited", hi: "PMSBY ₹20 प्रीमियम कटा" },
  pmjjbyPremiumDebited: { en: "PMJJBY ₹436 premium debited", hi: "PMJJBY ₹436 प्रीमियम कटा" },
  hasRupayPmjdyCard: { en: "RuPay Jan Dhan card", hi: "रुपे जन धन कार्ड" },
  lastCardTxnDate: { en: "Last card use before accident", hi: "दुर्घटना से पहले आख़िरी कार्ड इस्तेमाल" },
  pmjdyAccountOpenedAfter2018: { en: "Jan Dhan account opened after 28-08-2018", hi: "जन धन खाता 28-08-2018 के बाद खुला" },
  wasCommutingOrOnDuty: { en: "On duty / commuting to work", hi: "ड्यूटी पर / काम पर आते-जाते" },
  esicInsured: { en: "ESIC insured", hi: "ESIC बीमित" },
  gigWorkerOnTrip: { en: "Working on a delivery/ride app", hi: "डिलीवरी/राइड ऐप पर काम" },
  hospitalisedWithin24h: { en: "In hospital within 24 hours", hi: "24 घंटे में अस्पताल" },
};

const ENUMS: Record<string, Bilingual> = {
  death: { en: "Death", hi: "मृत्यु" },
  grievous_injury: { en: "Serious injury", hi: "गंभीर चोट" },
  minor_injury: { en: "Minor injury", hi: "मामूली चोट" },
  rider_own_vehicle: { en: "Riding own vehicle", hi: "अपना वाहन चला रहे थे" },
  rider_not_owner: { en: "Riding someone else's vehicle", hi: "किसी और का वाहन चला रहे थे" },
  pillion: { en: "Pillion rider", hi: "पीछे बैठे थे" },
  pedestrian: { en: "Pedestrian", hi: "पैदल" },
  passenger: { en: "Passenger", hi: "सवारी" },
  other: { en: "Other", hi: "अन्य" },
};

export function formatFact(key: FactKey, v: Facts[FactKey], lang: Lang): string {
  if (v === null || v === undefined) return lang === "hi" ? "पता नहीं" : "Unknown";
  if (typeof v === "boolean") return v ? (lang === "hi" ? "हाँ" : "Yes") : lang === "hi" ? "नहीं" : "No";
  if (key === "accidentDate" || key === "lastCardTxnDate") return formatDate(v as string, lang);
  if (key === "ownVehicleCpaSumInsured") return (v as number) > 0 ? formatINR(v as number) : lang === "hi" ? "नहीं है" : "Not included";
  if (typeof v === "string" && ENUMS[v]) return ENUMS[v][lang];
  return String(v);
}
