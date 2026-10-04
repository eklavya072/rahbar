// Rules-as-code: every entitlement is data + pure functions, with citations.
// The LLM never decides eligibility or amounts — this file does.

import { addDays, addMonths, daysBetween, isValidISO } from "./dates";
import type { Amount, Deadline, Facts, RuleDef, Tri } from "./types";

const VERIFIED = "2026-10-04";

// ---------- tri-state helpers ----------
export const not = (t: Tri): Tri => (t === null ? null : !t);

const isDeath = (f: Facts): Tri => (f.incidentType === null ? null : f.incidentType === "death");
const isDeathOrGrievous = (f: Facts): Tri =>
  f.incidentType === null ? null : f.incidentType === "death" || f.incidentType === "grievous_injury";
/** Death => true. Grievous injury => only if permanent disability is certified (unknown here) => null. Minor => false. */
const isDeathOrPermanentDisability = (f: Facts): Tri =>
  f.incidentType === null ? null : f.incidentType === "death" ? true : f.incidentType === "grievous_injury" ? null : false;

const ageBetween = (f: Facts, min: number, max: number): Tri =>
  f.victimAge === null ? null : f.victimAge >= min && f.victimAge <= max;

const wasRiding = (f: Facts): Tri => {
  if (f.victimRole === null) return null;
  return f.victimRole === "rider_own_vehicle" || f.victimRole === "rider_not_owner";
};

const ownerOfVehicle = (f: Facts): Tri => {
  if (f.victimRole === "rider_own_vehicle") return f.victimIsRegisteredOwner ?? true;
  if (f.victimRole === "rider_not_owner") return false;
  return f.victimIsRegisteredOwner;
};

const cpaPresent = (f: Facts): Tri => {
  if (f.ownVehicleCpaSumInsured !== null) return f.ownVehicleCpaSumInsured > 0;
  return null;
};

export const cardTxnWithin90Days = (f: Facts): Tri => {
  if (!isValidISO(f.lastCardTxnDate) || !isValidISO(f.accidentDate)) return null;
  const d = daysBetween(f.lastCardTxnDate, f.accidentDate);
  if (d < 0) return null; // transaction after the accident doesn't prove anything about before
  return d <= 90;
};

const deathOrInjury = (f: Facts, death: number, grievous: number, minor: number | null, labels: { death: string; grievous: string; minor?: string; deathHi: string; grievousHi: string; minorHi?: string }): Amount => {
  if (f.incidentType === "grievous_injury") return { value: grievous, label: { en: labels.grievous, hi: labels.grievousHi } };
  if (f.incidentType === "minor_injury") return { value: minor, label: { en: labels.minor ?? "—", hi: labels.minorHi ?? "—" } };
  return { value: death, label: { en: labels.death, hi: labels.deathHi } };
};

const noDate: Deadline = { date: null, kind: "none", label: { en: "Add the accident date to see deadlines", hi: "डेडलाइन देखने के लिए दुर्घटना की तारीख डालें" } };

// ---------- the rules ----------
export const RULES: RuleDef[] = [
  {
    id: "HIT_RUN",
    name: { en: "Hit-and-Run Compensation Scheme, 2022 (MV Act s.161)", hi: "हिट-एंड-रन मुआवज़ा योजना, 2022 (मोटर वाहन अधिनियम धारा 161)" },
    short: { en: "Hit-and-run compensation", hi: "हिट-एंड-रन मुआवज़ा" },
    payer: { en: "Motor Vehicle Accident Fund (Govt. of India), via the District Magistrate", hi: "मोटर वाहन दुर्घटना कोष (भारत सरकार), ज़िलाधिकारी के माध्यम से" },
    relevant: (f) => f.incidentType !== "minor_injury" && f.offendingVehicleIdentified !== true,
    conditions: [
      {
        id: "untraced",
        label: { en: "The vehicle that hit could not be identified", hi: "टक्कर मारने वाला वाहन पहचाना नहीं जा सका" },
        facts: ["offendingVehicleIdentified"],
        test: (f) => not(f.offendingVehicleIdentified),
      },
      {
        id: "severity",
        label: { en: "Death or grievous hurt", hi: "मृत्यु या गंभीर चोट" },
        facts: ["incidentType"],
        test: isDeathOrGrievous,
      },
    ],
    amount: (f) => {
      const old = isValidISO(f.accidentDate) && f.accidentDate < "2022-04-01";
      return old
        ? deathOrInjury(f, 25000, 12500, null, { death: "₹25,000 (Solatium Scheme, accidents before 1 Apr 2022)", grievous: "₹12,500 (Solatium Scheme)", deathHi: "₹25,000 (सोलेशियम योजना, 1 अप्रैल 2022 से पहले)", grievousHi: "₹12,500 (सोलेशियम योजना)" })
        : deathOrInjury(f, 200000, 50000, null, { death: "₹2,00,000 for death", grievous: "₹50,000 for grievous hurt", deathHi: "मृत्यु पर ₹2,00,000", grievousHi: "गंभीर चोट पर ₹50,000" });
    },
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: null, kind: "process", label: { en: "No time limit to apply. After you apply: enquiry report in 30 days → sanction in 15 days → payment in 15 days.", hi: "आवेदन की कोई समय-सीमा नहीं। आवेदन के बाद: 30 दिन में जाँच रिपोर्ट → 15 दिन में स्वीकृति → 15 दिन में भुगतान।" } }
        : noDate,
    documents: ["FIR", "POST_MORTEM", "DEATH_CERT", "CLAIMANT_ID", "BANK_DETAILS", "LEGAL_HEIR"],
    office: { en: "Claims Enquiry Officer (SDM / Tehsildar) of the area where the accident happened", hi: "जहाँ दुर्घटना हुई वहाँ के दावा जाँच अधिकारी (SDM / तहसीलदार)" },
    steps: [
      { en: "Fill Form I (application for compensation) and attach the documents.", hi: "फ़ॉर्म I (मुआवज़ा आवेदन) भरें और दस्तावेज़ लगाएँ।" },
      { en: "Submit it to the Claims Enquiry Officer (SDM/Tehsildar). Keep the receipt.", hi: "दावा जाँच अधिकारी (SDM/तहसीलदार) को जमा करें। रसीद रखें।" },
      { en: "The officer sends the report to the District Magistrate, who sanctions payment directly to your bank.", hi: "अधिकारी रिपोर्ट ज़िलाधिकारी को भेजते हैं, जो सीधे आपके बैंक खाते में भुगतान स्वीकृत करते हैं।" },
    ],
    notes: () => [
      { en: "If the vehicle is traced later and a Claims Tribunal awards compensation, this amount is adjusted (refunded) from that award.", hi: "अगर बाद में वाहन मिल जाए और ट्रिब्यूनल मुआवज़ा दे, तो यह राशि उस मुआवज़े में से समायोजित (वापस) होगी।" },
      { en: "Supreme Court (2024): if no claim is filed within a month, the officer must alert the District Legal Services Authority to help you — for free.", hi: "सुप्रीम कोर्ट (2024): एक महीने में दावा न हो तो अधिकारी को ज़िला विधिक सेवा प्राधिकरण को सूचित करना होगा — मुफ़्त मदद।" },
    ],
    citations: [
      { title: "MoRTH notification: Hit-and-Run Scheme 2022 (PIB)", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1801656" },
      { title: "S. Rajaseekaran v. Union of India, 2024 INSC 37", url: "https://www.verdictum.in/court-updates/supreme-court/s-rajaseekaran-v-union-of-india-ors-2024-insc-37-compensation-in-hit-run-accidents-1515043" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "CPA",
    name: { en: "Compulsory Personal Accident cover (owner-driver) on the vehicle policy", hi: "वाहन पॉलिसी पर अनिवार्य व्यक्तिगत दुर्घटना कवर (मालिक-चालक)" },
    short: { en: "Owner-driver accident cover", hi: "मालिक-चालक दुर्घटना कवर" },
    payer: { en: "The insurance company of the victim's own vehicle", hi: "मृतक के अपने वाहन की बीमा कंपनी" },
    relevant: (f) =>
      f.incidentType !== "minor_injury" && f.victimRole !== "pedestrian" && f.victimRole !== "passenger" && f.victimRole !== "pillion",
    conditions: [
      { id: "riding", label: { en: "Victim was driving/riding the vehicle", hi: "मृतक वाहन चला रहे थे" }, facts: ["victimRole"], test: wasRiding },
      { id: "owner", label: { en: "Victim was the registered owner of that vehicle", hi: "मृतक उस वाहन के पंजीकृत मालिक थे" }, facts: ["victimRole", "victimIsRegisteredOwner"], test: ownerOfVehicle },
      { id: "policy", label: { en: "Vehicle insurance was active on the accident date", hi: "दुर्घटना की तारीख पर वाहन बीमा चालू था" }, facts: ["ownVehiclePolicyActive"], test: (f) => f.ownVehiclePolicyActive },
      { id: "cpa", label: { en: "Policy includes owner-driver PA cover", hi: "पॉलिसी में मालिक-चालक PA कवर शामिल है" }, facts: ["ownVehicleCpaSumInsured"], test: cpaPresent },
      { id: "dl", label: { en: "Victim held a valid driving licence", hi: "मृतक के पास वैध ड्राइविंग लाइसेंस था" }, facts: ["victimHeldValidDL"], test: (f) => f.victimHeldValidDL },
      { id: "severity", label: { en: "Death or permanent disability", hi: "मृत्यु या स्थायी विकलांगता" }, facts: ["incidentType"], test: isDeathOrPermanentDisability },
    ],
    amount: (f) => {
      const si = f.ownVehicleCpaSumInsured ?? 1500000;
      if (f.incidentType === "grievous_injury") return { value: null, label: { en: `Up to ₹${(si / 100000).toFixed(0)} lakh, depending on the disability`, hi: `विकलांगता के अनुसार ₹${(si / 100000).toFixed(0)} लाख तक` } };
      return { value: si, label: { en: `₹${(si / 100000).toFixed(0)} lakh (100% of the sum insured on death)`, hi: `₹${(si / 100000).toFixed(0)} लाख (मृत्यु पर बीमा राशि का 100%)` } };
    },
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addDays(f.accidentDate, 30), kind: "soft", label: { en: "Inform the insurer immediately — most policies ask within 30 days", hi: "बीमा कंपनी को तुरंत सूचित करें — अधिकतर पॉलिसी 30 दिन के भीतर कहती हैं" } }
        : noDate,
    documents: ["POLICY", "FIR", "POST_MORTEM", "DEATH_CERT", "DL", "RC", "CLAIMANT_ID", "BANK_DETAILS", "LEGAL_HEIR"],
    office: { en: "Claims desk of the vehicle's insurer (toll-free number on the policy, or nearest branch)", hi: "वाहन की बीमा कंपनी का क्लेम डेस्क (पॉलिसी पर टोल-फ़्री नंबर, या नज़दीकी शाखा)" },
    steps: [
      { en: "Call the insurer's claim number and register a PA (personal accident) claim — note the claim number.", hi: "बीमा कंपनी के क्लेम नंबर पर कॉल करके PA (व्यक्तिगत दुर्घटना) क्लेम दर्ज करें — क्लेम नंबर नोट करें।" },
      { en: "Submit the claim form with the documents (the nominee on the policy, or legal heir, claims).", hi: "दस्तावेज़ों के साथ क्लेम फ़ॉर्म जमा करें (पॉलिसी का नॉमिनी या कानूनी वारिस दावा करता है)।" },
      { en: "If unpaid after 30 days, escalate to the insurer's Grievance Officer, then Bima Bharosa / Insurance Ombudsman.", hi: "30 दिन में भुगतान न हो तो शिकायत अधिकारी, फिर बीमा भरोसा / बीमा लोकपाल के पास जाएँ।" },
    ],
    notes: () => [
      { en: "This cover is mandatory on every vehicle policy unless the owner had another ₹15 lakh PA policy — families very often don't know it exists.", hi: "यह कवर हर वाहन पॉलिसी पर अनिवार्य है (जब तक मालिक के पास अलग ₹15 लाख PA पॉलिसी न हो) — परिवार अक्सर इसके बारे में नहीं जानते।" },
    ],
    citations: [
      { title: "IRDAI raises owner-driver PA cover to ₹15 lakh", url: "https://www.coverfox.com/news/irdai-raises-motor-insurance-personal-accident-cover-to-rs-15-lakh/" },
      { title: "CPA cover explained (insurer guide)", url: "https://www.zurichkotak.com/knowledge-center/two-wheeler-insurance/know-about-15-lakh-accident-cover" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "PMSBY",
    name: { en: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)", hi: "प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY)" },
    short: { en: "PMSBY accident insurance", hi: "PMSBY दुर्घटना बीमा" },
    payer: { en: "Insurer of the bank's PMSBY master policy", hi: "बैंक की PMSBY मास्टर पॉलिसी की बीमा कंपनी" },
    relevant: (f) => f.incidentType !== "minor_injury",
    conditions: [
      { id: "enrolled", label: { en: "₹20 PMSBY premium was debited from the account this cover year", hi: "इस वर्ष खाते से ₹20 PMSBY प्रीमियम कटा था" }, facts: ["pmsbyPremiumDebited"], test: (f) => f.pmsbyPremiumDebited },
      { id: "age", label: { en: "Victim was aged 18–70", hi: "मृतक की आयु 18–70 वर्ष थी" }, facts: ["victimAge"], test: (f) => ageBetween(f, 18, 70) },
      { id: "severity", label: { en: "Accidental death or permanent disability", hi: "दुर्घटना में मृत्यु या स्थायी विकलांगता" }, facts: ["incidentType"], test: isDeathOrPermanentDisability },
    ],
    amount: (f) =>
      f.incidentType === "grievous_injury"
        ? { value: null, label: { en: "₹2 lakh (total permanent disability) or ₹1 lakh (partial)", hi: "₹2 लाख (पूर्ण स्थायी विकलांगता) या ₹1 लाख (आंशिक)" } }
        : { value: 200000, label: { en: "₹2,00,000 for accidental death", hi: "दुर्घटना मृत्यु पर ₹2,00,000" } },
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addDays(f.accidentDate, 30), kind: "soft", label: { en: "Submit the claim at the bank, preferably within 30 days", hi: "बैंक में क्लेम, अच्छा हो 30 दिन के भीतर, जमा करें" } }
        : noDate,
    documents: ["FIR", "POST_MORTEM", "DEATH_CERT", "PASSBOOK", "CLAIMANT_ID", "BANK_DETAILS", "LEGAL_HEIR"],
    office: { en: "The bank branch where the ₹20 premium was debited", hi: "वह बैंक शाखा जहाँ से ₹20 प्रीमियम कटा" },
    steps: [
      { en: "Ask the branch for the PMSBY claim-cum-discharge form.", hi: "शाखा से PMSBY क्लेम-कम-डिस्चार्ज फ़ॉर्म माँगें।" },
      { en: "The nominee fills it and attaches the documents.", hi: "नॉमिनी फ़ॉर्म भरें और दस्तावेज़ लगाएँ।" },
      { en: "The bank must verify and forward to the insurer within 30 days; the insurer settles within 30 days.", hi: "बैंक 30 दिन में जाँच कर बीमा कंपनी को भेजता है; बीमा कंपनी 30 दिन में भुगतान करती है।" },
    ],
    citations: [
      { title: "PMSBY FAQ (Jan Suraksha portal)", url: "https://www.jansuraksha.gov.in/Files/PMSBY/ENGLISH/FAQ-old.pdf" },
      { title: "PMSBY claim procedure (bank circular)", url: "https://tmb.bank.in/doc/pmsby_procedure_01.pdf" },
      { title: "PIB: Jan Suraksha schemes complete 10 years", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2127981&reg=48&lang=2" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "PMJJBY",
    name: { en: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)", hi: "प्रधानमंत्री जीवन ज्योति बीमा योजना (PMJJBY)" },
    short: { en: "PMJJBY life cover", hi: "PMJJBY जीवन बीमा" },
    payer: { en: "LIC / insurer of the bank's PMJJBY master policy", hi: "बैंक की PMJJBY मास्टर पॉलिसी का बीमाकर्ता (LIC आदि)" },
    relevant: (f) => f.incidentType === "death" || f.incidentType === null,
    conditions: [
      { id: "enrolled", label: { en: "₹436 PMJJBY premium was debited this cover year", hi: "इस वर्ष ₹436 PMJJBY प्रीमियम कटा था" }, facts: ["pmjjbyPremiumDebited"], test: (f) => f.pmjjbyPremiumDebited },
      { id: "age", label: { en: "Victim was aged 18–55", hi: "मृतक की आयु 18–55 वर्ष थी" }, facts: ["victimAge"], test: (f) => ageBetween(f, 18, 55) },
      { id: "death", label: { en: "Death (any cause)", hi: "मृत्यु (किसी भी कारण से)" }, facts: ["incidentType"], test: isDeath },
    ],
    amount: () => ({ value: 200000, label: { en: "₹2,00,000 on death", hi: "मृत्यु पर ₹2,00,000" } }),
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addDays(f.accidentDate, 30), kind: "soft", label: { en: "Submit at the bank promptly (banks typically ask within 30 days)", hi: "बैंक में जल्द जमा करें (बैंक आमतौर पर 30 दिन कहते हैं)" } }
        : noDate,
    documents: ["DEATH_CERT", "PASSBOOK", "CLAIMANT_ID", "BANK_DETAILS", "LEGAL_HEIR"],
    office: { en: "The bank branch where the ₹436 premium was debited", hi: "वह बैंक शाखा जहाँ से ₹436 प्रीमियम कटा" },
    steps: [
      { en: "Ask the branch for the PMJJBY claim form and discharge receipt.", hi: "शाखा से PMJJBY क्लेम फ़ॉर्म और डिस्चार्ज रसीद माँगें।" },
      { en: "Submit with the death certificate and nominee's bank details.", hi: "मृत्यु प्रमाण पत्र और नॉमिनी के बैंक विवरण के साथ जमा करें।" },
    ],
    notes: () => [
      { en: "PMJJBY pays on death from any cause, so it can be claimed together with PMSBY.", hi: "PMJJBY किसी भी कारण से मृत्यु पर मिलता है, इसलिए PMSBY के साथ दोनों का दावा हो सकता है।" },
    ],
    citations: [
      { title: "PIB: Jan Suraksha schemes complete 10 years", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2127981&reg=48&lang=2" },
      { title: "PMJJBY & PMSBY claim procedure", url: "https://www.relakhs.com/pmjjby-pmsby-insurance-claim-procedure/" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "RUPAY",
    name: { en: "RuPay (Jan Dhan) debit card accident insurance", hi: "रुपे (जन धन) डेबिट कार्ड दुर्घटना बीमा" },
    short: { en: "RuPay card accident cover", hi: "रुपे कार्ड दुर्घटना कवर" },
    payer: { en: "Insurer appointed by NPCI (premium paid by NPCI)", hi: "NPCI द्वारा नियुक्त बीमा कंपनी (प्रीमियम NPCI देता है)" },
    relevant: (f) => f.incidentType !== "minor_injury",
    conditions: [
      { id: "card", label: { en: "Victim had a RuPay card on a Jan Dhan (PMJDY) account", hi: "मृतक के पास जन धन (PMJDY) खाते का रुपे कार्ड था" }, facts: ["hasRupayPmjdyCard"], test: (f) => f.hasRupayPmjdyCard },
      { id: "txn90", label: { en: "The card was used in the 90 days before the accident", hi: "दुर्घटना से पहले 90 दिनों में कार्ड इस्तेमाल हुआ" }, facts: ["lastCardTxnDate", "accidentDate"], test: cardTxnWithin90Days },
      { id: "severity", label: { en: "Accidental death or permanent total disability", hi: "दुर्घटना मृत्यु या पूर्ण स्थायी विकलांगता" }, facts: ["incidentType"], test: isDeathOrPermanentDisability },
    ],
    amount: (f) =>
      f.pmjdyAccountOpenedAfter2018 === true
        ? { value: 200000, label: { en: "₹2,00,000 (account opened after 28 Aug 2018)", hi: "₹2,00,000 (28 अगस्त 2018 के बाद खुला खाता)" } }
        : f.pmjdyAccountOpenedAfter2018 === false
          ? { value: 100000, label: { en: "₹1,00,000 (account opened before 28 Aug 2018)", hi: "₹1,00,000 (28 अगस्त 2018 से पहले खुला खाता)" } }
          : { value: 100000, label: { en: "₹1–2 lakh (₹2 lakh if the account was opened after 28 Aug 2018)", hi: "₹1–2 लाख (28 अगस्त 2018 के बाद खुले खाते पर ₹2 लाख)" } },
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addDays(f.accidentDate, 90), kind: "hard", label: { en: "Intimate the bank within 90 days of the accident; documents within 60 days after that", hi: "दुर्घटना के 90 दिन के भीतर बैंक को सूचना दें; उसके बाद 60 दिन में दस्तावेज़" } }
        : noDate,
    documents: ["FIR", "POST_MORTEM", "DEATH_CERT", "PASSBOOK", "CLAIMANT_ID", "BANK_DETAILS", "LEGAL_HEIR"],
    office: { en: "The bank branch that issued the RuPay card", hi: "वह बैंक शाखा जिसने रुपे कार्ड जारी किया" },
    steps: [
      { en: "Tell the branch in writing that the cardholder died in an accident — ask for the RuPay PMJDY accident claim form.", hi: "शाखा को लिखित में बताएँ कि कार्डधारक की दुर्घटना में मृत्यु हुई — रुपे PMJDY दुर्घटना क्लेम फ़ॉर्म माँगें।" },
      { en: "Ask the bank for the transaction log showing card use in the last 90 days.", hi: "बैंक से पिछले 90 दिनों के कार्ड इस्तेमाल का ट्रांज़ैक्शन लॉग माँगें।" },
      { en: "Submit the form with the documents; the bank forwards it to the insurer.", hi: "दस्तावेज़ों के साथ फ़ॉर्म जमा करें; बैंक बीमा कंपनी को भेजता है।" },
    ],
    citations: [
      { title: "RuPay card personal accident claim process (PMJDY)", url: "https://pmjdy.gov.in/files/QuickLinks/Accidental-Insurance.pdf" },
      { title: "Insurance claims under PMJDY", url: "https://www.drishtiias.com/daily-updates/daily-news-analysis/insurance-claims-under-pmjdy" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "MACT",
    name: { en: "Motor Accident Claims Tribunal (MACT) compensation (MV Act s.164 no-fault / s.166)", hi: "मोटर दुर्घटना दावा न्यायाधिकरण (MACT) मुआवज़ा (धारा 164 / 166)" },
    short: { en: "MACT compensation", hi: "MACT मुआवज़ा" },
    payer: { en: "Insurer of the vehicle at fault (or its owner)", hi: "दोषी वाहन की बीमा कंपनी (या उसका मालिक)" },
    relevant: () => true,
    conditions: [
      { id: "identified", label: { en: "The vehicle at fault has been identified", hi: "दोषी वाहन की पहचान हो गई है" }, facts: ["offendingVehicleIdentified"], test: (f) => f.offendingVehicleIdentified },
      { id: "incident", label: { en: "Death or injury in a motor vehicle accident", hi: "मोटर वाहन दुर्घटना में मृत्यु या चोट" }, facts: ["incidentType"], test: (f) => (f.incidentType === null ? null : true) },
    ],
    amount: (f) =>
      deathOrInjury(f, 500000, 250000, null, {
        death: "₹5,00,000 fixed (no-fault, s.164) — or more under s.166 based on income and dependants",
        grievous: "₹2,50,000 fixed (no-fault, s.164) — or more under s.166",
        minor: "Based on actual losses (s.166)",
        deathHi: "₹5,00,000 तय (नो-फ़ॉल्ट, धारा 164) — या आय और आश्रितों के आधार पर धारा 166 में अधिक",
        grievousHi: "₹2,50,000 तय (नो-फ़ॉल्ट, धारा 164) — या धारा 166 में अधिक",
        minorHi: "वास्तविक नुकसान के आधार पर (धारा 166)",
      }),
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addMonths(f.accidentDate, 6), kind: "hard", label: { en: "File within 6 months (MV Act s.166(3)). Supreme Court interim order (Nov 2025): late claims must not be dismissed while the limit is under challenge — but don't rely on it.", hi: "6 महीने में दाखिल करें (धारा 166(3))। सुप्रीम कोर्ट अंतरिम आदेश (नवंबर 2025): चुनौती के दौरान देर से आए दावे खारिज नहीं होंगे — फिर भी इस पर निर्भर न रहें।" } }
        : noDate,
    documents: ["FIR", "DAR", "POST_MORTEM", "DEATH_CERT", "CLAIMANT_ID", "LEGAL_HEIR", "EMPLOYER_PROOF", "HOSPITAL_RECORDS"],
    office: { en: "Motor Accident Claims Tribunal (district court). Free lawyer: District Legal Services Authority (NALSA 15100).", hi: "मोटर दुर्घटना दावा न्यायाधिकरण (ज़िला न्यायालय)। मुफ़्त वकील: ज़िला विधिक सेवा प्राधिकरण (NALSA 15100)।" },
    steps: [
      { en: "Ask the police whether the Detailed Accident Report (DAR) has been sent to the Tribunal — it can be treated as your claim.", hi: "पुलिस से पूछें कि विस्तृत दुर्घटना रिपोर्ट (DAR) ट्रिब्यूनल को भेजी गई या नहीं — इसे आपका दावा माना जा सकता है।" },
      { en: "Get a free legal-aid lawyer from the DLSA; never sign over a percentage of the award to anyone.", hi: "DLSA से मुफ़्त वकील लें; मुआवज़े का कोई प्रतिशत किसी को न लिखें।" },
      { en: "Many cases settle faster at a National Lok Adalat — but check the offer against the s.166 estimate first.", hi: "कई मामले राष्ट्रीय लोक अदालत में जल्दी निपटते हैं — पर पहले धारा 166 के अनुमान से प्रस्ताव मिलाएँ।" },
    ],
    notes: (f) =>
      f.offendingVehicleIdentified === false
        ? [{ en: "Becomes available if police trace the vehicle later — the hit-and-run payment is then adjusted.", hi: "पुलिस बाद में वाहन ढूँढ ले तो यह रास्ता खुल जाता है — तब हिट-एंड-रन राशि समायोजित होती है।" }]
        : f.offendingVehicleInsured === false
          ? [{ en: "The vehicle was uninsured: the owner is liable, and recovery can be slow. Ask the DLSA lawyer about the Motor Vehicle Accident Fund.", hi: "वाहन का बीमा नहीं था: मालिक ज़िम्मेदार है, वसूली धीमी हो सकती है। DLSA वकील से मोटर वाहन दुर्घटना कोष के बारे में पूछें।" }]
          : [],
    citations: [
      { title: "SC interim order on s.166(3) limitation (Nov 2025)", url: "https://www.livelaw.in/top-stories/no-motor-accident-claim-should-be-dismissed-as-time-barred-supreme-court-interim-order-s1663-mv-act-309095" },
      { title: "Crashfree India — compensation routes (Jan 2026)", url: "https://crashfreeindia.org/documents/justice-unserved-crashfree-india.pdf" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "RAHAT",
    name: { en: "PM RAHAT cashless treatment for road accident victims", hi: "पीएम राहत — सड़क दुर्घटना पीड़ितों का कैशलेस इलाज" },
    short: { en: "PM RAHAT cashless treatment", hi: "पीएम राहत कैशलेस इलाज" },
    payer: { en: "Motor Vehicle Accident Fund via NHA / State Health Agency (paid to the hospital)", hi: "NHA / राज्य स्वास्थ्य एजेंसी के ज़रिए मोटर वाहन दुर्घटना कोष (अस्पताल को भुगतान)" },
    relevant: () => true,
    informational: true,
    conditions: [
      { id: "within24", label: { en: "Admitted to hospital within 24 hours of the accident", hi: "दुर्घटना के 24 घंटे के भीतर अस्पताल में भर्ती" }, facts: ["hospitalisedWithin24h"], test: (f) => f.hospitalisedWithin24h },
    ],
    amount: () => ({ value: 150000, label: { en: "Treatment up to ₹1,50,000 for 7 days — paid to the hospital, not to you", hi: "7 दिन तक ₹1,50,000 तक का इलाज — अस्पताल को भुगतान, आपको नहीं" } }),
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addDays(f.accidentDate, 7), kind: "process", label: { en: "Covers the first 7 days of treatment", hi: "इलाज के पहले 7 दिन कवर" } }
        : noDate,
    documents: ["HOSPITAL_RECORDS", "FIR"],
    office: { en: "The treating hospital's billing desk / State Health Agency", hi: "इलाज करने वाले अस्पताल का बिलिंग डेस्क / राज्य स्वास्थ्य एजेंसी" },
    steps: [
      { en: "If a designated hospital charged you for the first 7 days, ask the billing desk to raise the claim under PM RAHAT instead.", hi: "अगर नामित अस्पताल ने पहले 7 दिनों का पैसा लिया, तो बिलिंग डेस्क से पीएम राहत के तहत क्लेम करने को कहें।" },
    ],
    citations: [
      { title: "PM RAHAT scheme (AIR News, 2026)", url: "https://www.newsonair.gov.in/government-announces-launch-of-pm-rahat-scheme-for-cashless-treatment-of-up-to-rs-1-lakh-50-thousand-for-road-accident-victims" },
      { title: "Cashless Treatment Scheme 2025", url: "https://www.angelone.in/news/government-notifies-cashless-scheme-for-road-accident-victims" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "EMPLOYER",
    name: { en: "Employer liability: ESIC dependants' benefit or Employees' Compensation (commuting/on duty)", hi: "नियोक्ता दायित्व: ESIC आश्रित लाभ या कर्मचारी मुआवज़ा (आते-जाते/ड्यूटी पर)" },
    short: { en: "ESIC / employee compensation", hi: "ESIC / कर्मचारी मुआवज़ा" },
    payer: { en: "ESIC (if insured) — otherwise the employer under the Employees' Compensation Act", hi: "ESIC (अगर बीमित) — नहीं तो कर्मचारी मुआवज़ा अधिनियम के तहत नियोक्ता" },
    relevant: (f) => f.incidentType !== "minor_injury" && f.wasCommutingOrOnDuty !== false,
    conditions: [
      { id: "commute", label: { en: "Victim was on duty or commuting between home and work", hi: "मृतक ड्यूटी पर थे या घर और काम के बीच आ-जा रहे थे" }, facts: ["wasCommutingOrOnDuty"], test: (f) => f.wasCommutingOrOnDuty },
      { id: "esic", label: { en: "Victim was insured under ESIC (else: Employees' Compensation Act route)", hi: "मृतक ESIC में बीमित थे (नहीं तो: कर्मचारी मुआवज़ा अधिनियम)" }, facts: ["esicInsured"], test: (f) => f.esicInsured },
    ],
    amount: (f) =>
      f.esicInsured === true
        ? { value: null, label: { en: "Monthly pension ≈ 90% of wages, shared among dependants (spouse for life)", hi: "मासिक पेंशन ≈ वेतन का 90%, आश्रितों में बँटती है (पत्नी/पति को आजीवन)" } }
        : { value: null, label: { en: "Lump sum by formula (wages × age factor) under the EC Act", hi: "EC अधिनियम के तहत सूत्र से एकमुश्त राशि (वेतन × आयु गुणांक)" } },
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addMonths(f.accidentDate, 24), kind: "soft", label: { en: "Tell the employer now; EC Act claims within 2 years", hi: "नियोक्ता को अभी बताएँ; EC अधिनियम दावा 2 साल में" } }
        : noDate,
    documents: ["EMPLOYER_PROOF", "FIR", "POST_MORTEM", "DEATH_CERT", "CLAIMANT_ID", "LEGAL_HEIR"],
    office: { en: "Employer's HR → ESIC branch office, or the Commissioner for Employees' Compensation (Labour Dept.)", hi: "नियोक्ता का HR → ESIC शाखा कार्यालय, या कर्मचारी मुआवज़ा आयुक्त (श्रम विभाग)" },
    steps: [
      { en: "Ask the employer to file the accident report (ESIC) or to admit the claim (EC Act).", hi: "नियोक्ता से दुर्घटना रिपोर्ट (ESIC) दाखिल करने या दावा स्वीकार करने को कहें।" },
      { en: "ESIC and the EC Act cannot both pay for the same injury — the ESIC route applies if he was ESIC-insured.", hi: "ESIC और EC अधिनियम दोनों एक ही चोट के लिए भुगतान नहीं करते — ESIC बीमित होने पर ESIC रास्ता लागू होगा।" },
    ],
    citations: [
      { title: "Supreme Court, 2025 INSC 904 (commuting accidents, EC Act)", url: "https://api.sci.gov.in/supremecourt/2012/11949/11949_2012_5_1501_62795_Judgement_29-Jul-2025.pdf" },
      { title: "ESIC benefits — dependants' benefit", url: "http://esic.gov.in/information-benefits" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "GIG",
    name: { en: "Gig-platform accident insurance (delivery / ride apps)", hi: "गिग प्लेटफ़ॉर्म दुर्घटना बीमा (डिलीवरी / राइड ऐप)" },
    short: { en: "Gig-platform cover", hi: "गिग प्लेटफ़ॉर्म कवर" },
    payer: { en: "The platform's group insurer", hi: "प्लेटफ़ॉर्म की समूह बीमा कंपनी" },
    relevant: (f) => f.incidentType !== "minor_injury" && f.gigWorkerOnTrip !== false,
    conditions: [
      { id: "ontrip", label: { en: "Victim was working on a delivery/ride app at the time", hi: "उस समय मृतक डिलीवरी/राइड ऐप पर काम कर रहे थे" }, facts: ["gigWorkerOnTrip"], test: (f) => f.gigWorkerOnTrip },
    ],
    amount: () => ({ value: null, label: { en: "Varies by platform (e.g., up to ₹10 lakh for accidental death)", hi: "प्लेटफ़ॉर्म के अनुसार (जैसे दुर्घटना मृत्यु पर ₹10 लाख तक)" } }),
    deadline: (f) =>
      isValidISO(f.accidentDate)
        ? { date: addDays(f.accidentDate, 30), kind: "soft", label: { en: "Report through the partner app's help section as soon as possible", hi: "पार्टनर ऐप के हेल्प सेक्शन से जल्द से जल्द रिपोर्ट करें" } }
        : noDate,
    documents: ["FIR", "POST_MORTEM", "DEATH_CERT", "APP_TRIP_PROOF", "BANK_DETAILS", "LEGAL_HEIR"],
    office: { en: "Partner app → Help → Insurance / Report an accident", hi: "पार्टनर ऐप → हेल्प → इंश्योरेंस / दुर्घटना रिपोर्ट करें" },
    steps: [{ en: "Open the partner app's insurance section and start a claim; upload the documents.", hi: "पार्टनर ऐप के इंश्योरेंस सेक्शन में क्लेम शुरू करें; दस्तावेज़ अपलोड करें।" }],
    citations: [
      { title: "Code on Social Security in force (gig workers)", url: "https://www.fisherphillips.com/en/insights/insights/indias-new-labor-codes-extend-social-security-coverage-to-gig-workers" },
      { title: "Gig worker insurance compared (2026)", url: "https://www.oneassure.in/insurance/health-insurance-guides/insurance-for-gig-workers-zomato-swiggy-plans" },
    ],
    lastVerified: VERIFIED,
  },
  {
    id: "BANK_BALANCE",
    name: { en: "The deceased's own bank balance (RBI 2025 deceased-claim rules)", hi: "मृतक का अपना बैंक बैलेंस (RBI 2025 नियम)" },
    short: { en: "Bank balance of the deceased", hi: "मृतक का बैंक बैलेंस" },
    payer: { en: "The deceased's bank — this is the family's own money, not compensation", hi: "मृतक का बैंक — यह परिवार का अपना पैसा है, मुआवज़ा नहीं" },
    relevant: (f) => f.incidentType === "death" && f.deceasedBankBalance !== null,
    informational: true,
    conditions: [
      { id: "death", label: { en: "Account holder has died", hi: "खाताधारक की मृत्यु हो गई" }, facts: ["incidentType"], test: isDeath },
      { id: "balance", label: { en: "Balance found in the passbook", hi: "पासबुक में बैलेंस मिला" }, facts: ["deceasedBankBalance"], test: (f) => (f.deceasedBankBalance === null ? null : f.deceasedBankBalance > 0) },
    ],
    amount: (f) => ({
      value: f.deceasedBankBalance,
      label: { en: `₹${(f.deceasedBankBalance ?? 0).toLocaleString("en-IN")} in the account (last passbook entry)`, hi: `खाते में ₹${(f.deceasedBankBalance ?? 0).toLocaleString("en-IN")} (पासबुक की आख़िरी एंट्री)` },
    }),
    deadline: () => ({ date: null, kind: "process", label: { en: "Bank must settle within 15 days of complete documents; if late, it pays compensation at Bank Rate + 4%", hi: "पूरे दस्तावेज़ मिलने के 15 दिन में बैंक को भुगतान करना होगा; देरी पर बैंक रेट + 4% मुआवज़ा" } }),
    documents: ["DEATH_CERT", "CLAIMANT_ID", "PASSBOOK", "LEGAL_HEIR"],
    office: { en: "The deceased's bank branch (standard RBI claim form)", hi: "मृतक की बैंक शाखा (RBI का मानक क्लेम फ़ॉर्म)" },
    steps: [
      { en: "Nominee fills the bank's standard deceased-claim form with the death certificate and ID.", hi: "नॉमिनी मृत्यु प्रमाण पत्र और पहचान पत्र के साथ बैंक का मानक क्लेम फ़ॉर्म भरें।" },
      { en: "No nominee? Up to ₹15 lakh, banks must use the simplified procedure (claim form, indemnity, no-objection from other heirs) — no succession certificate.", hi: "नॉमिनी नहीं? ₹15 लाख तक बैंक को सरल प्रक्रिया अपनानी होगी (क्लेम फ़ॉर्म, क्षतिपूर्ति बांड, बाकी वारिसों की NOC) — उत्तराधिकार प्रमाण पत्र नहीं।" },
    ],
    citations: [
      { title: "RBI (Settlement of Claims in respect of Deceased Customers) Directions, 2025", url: "https://taxguru.in/rbi/rbi-standardizes-deceased-customer-claim-settlement-banks.html" },
    ],
    lastVerified: VERIFIED,
  },
];

export const RULES_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r])) as Record<RuleDef["id"], RuleDef>;
