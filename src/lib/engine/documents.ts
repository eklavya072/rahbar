import type { Bilingual, DocKey } from "./types";

export interface DocMeta {
  key: DocKey;
  name: Bilingual;
  whereToGet: Bilingual;
  cost: Bilingual;
}

export const DOCS: Record<DocKey, DocMeta> = {
  FIR: {
    key: "FIR",
    name: { en: "FIR copy", hi: "एफ़आईआर की कॉपी" },
    whereToGet: {
      en: "Police station that registered the case. The victim or legal heir has a legal right to a free copy (BNSS s.173(2)).",
      hi: "जिस थाने में केस दर्ज है। पीड़ित या कानूनी वारिस को मुफ़्त कॉपी का कानूनी अधिकार है (BNSS धारा 173(2))।",
    },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  DAR: {
    key: "DAR",
    name: { en: "Detailed Accident Report (Form VII) + Form II rights notice", hi: "विस्तृत दुर्घटना रिपोर्ट (फ़ॉर्म VII) + फ़ॉर्म II अधिकार सूचना" },
    whereToGet: {
      en: "Investigating officer. Police must give victims the Form II rights notice within 10 days and file the DAR with the Claims Tribunal.",
      hi: "जाँच अधिकारी। पुलिस को 10 दिन में फ़ॉर्म II देना और ट्रिब्यूनल में DAR दाखिल करना होता है।",
    },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  DEATH_CERT: {
    key: "DEATH_CERT",
    name: { en: "Death certificate", hi: "मृत्यु प्रमाण पत्र" },
    whereToGet: { en: "Municipal office / Registrar of Births & Deaths (CRS portal).", hi: "नगर निगम / जन्म-मृत्यु रजिस्ट्रार (CRS पोर्टल)।" },
    cost: { en: "Free or nominal", hi: "मुफ़्त या मामूली शुल्क" },
  },
  POST_MORTEM: {
    key: "POST_MORTEM",
    name: { en: "Post-mortem report", hi: "पोस्टमार्टम रिपोर्ट" },
    whereToGet: { en: "Hospital that did the post-mortem, or via the police station.", hi: "जिस अस्पताल में पोस्टमार्टम हुआ, या थाने के ज़रिए।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  CLAIMANT_ID: {
    key: "CLAIMANT_ID",
    name: { en: "Claimant's ID proof (masked Aadhaar is fine)", hi: "दावेदार का पहचान पत्र (मास्क्ड आधार चलेगा)" },
    whereToGet: { en: "Download masked Aadhaar from myAadhaar, or use voter ID / PAN.", hi: "myAadhaar से मास्क्ड आधार डाउनलोड करें, या वोटर आईडी / पैन।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  BANK_DETAILS: {
    key: "BANK_DETAILS",
    name: { en: "Claimant's bank passbook front page / cancelled cheque", hi: "दावेदार की पासबुक का पहला पन्ना / कैंसिल चेक" },
    whereToGet: { en: "Your own bank.", hi: "आपका अपना बैंक।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  PASSBOOK: {
    key: "PASSBOOK",
    name: { en: "Deceased's passbook / statement (shows premium debits and card use)", hi: "मृतक की पासबुक / स्टेटमेंट (प्रीमियम कटौती और कार्ड इस्तेमाल दिखाता है)" },
    whereToGet: { en: "Deceased's bank branch, or the passbook at home.", hi: "मृतक की बैंक शाखा, या घर में रखी पासबुक।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  POLICY: {
    key: "POLICY",
    name: { en: "Vehicle insurance policy schedule", hi: "वाहन बीमा पॉलिसी शेड्यूल" },
    whereToGet: {
      en: "Lost it? mParivahan / Parivahan 'Know your vehicle details' or IIB V-Seva show the insurer and policy number from the registration number, free.",
      hi: "खो गई? mParivahan / परिवहन 'Know your vehicle details' या IIB V-Seva पर गाड़ी नंबर से बीमा कंपनी और पॉलिसी नंबर मुफ़्त मिलता है।",
    },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  DL: {
    key: "DL",
    name: { en: "Deceased's driving licence", hi: "मृतक का ड्राइविंग लाइसेंस" },
    whereToGet: { en: "At home, or details on Parivahan / DigiLocker.", hi: "घर पर, या परिवहन / डिजीलॉकर पर।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  RC: {
    key: "RC",
    name: { en: "Vehicle registration certificate (RC)", hi: "वाहन पंजीकरण प्रमाण पत्र (RC)" },
    whereToGet: { en: "At home, or DigiLocker / mParivahan.", hi: "घर पर, या डिजीलॉकर / mParivahan।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  HOSPITAL_RECORDS: {
    key: "HOSPITAL_RECORDS",
    name: { en: "Hospital records, bills and discharge summary", hi: "अस्पताल के रिकॉर्ड, बिल और डिस्चार्ज समरी" },
    whereToGet: { en: "Treating hospital's records desk.", hi: "इलाज करने वाले अस्पताल का रिकॉर्ड डेस्क।" },
    cost: { en: "Free / nominal", hi: "मुफ़्त / मामूली" },
  },
  DISABILITY_CERT: {
    key: "DISABILITY_CERT",
    name: { en: "Disability certificate", hi: "विकलांगता प्रमाण पत्र" },
    whereToGet: { en: "Civil Surgeon / district medical board (UDID portal).", hi: "सिविल सर्जन / ज़िला मेडिकल बोर्ड (UDID पोर्टल)।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  LEGAL_HEIR: {
    key: "LEGAL_HEIR",
    name: { en: "Proof of relationship / legal heir or nominee", hi: "रिश्ते / कानूनी वारिस या नॉमिनी का प्रमाण" },
    whereToGet: { en: "Nominee name in passbook or policy; otherwise legal heir certificate from Tehsil.", hi: "पासबुक या पॉलिसी में नॉमिनी; नहीं तो तहसील से वारिस प्रमाण पत्र।" },
    cost: { en: "Free / nominal", hi: "मुफ़्त / मामूली" },
  },
  EMPLOYER_PROOF: {
    key: "EMPLOYER_PROOF",
    name: { en: "Employer letter / salary slip / ESIC number", hi: "नियोक्ता का पत्र / सैलरी स्लिप / ESIC नंबर" },
    whereToGet: { en: "Employer's HR or ESIC e-Pehchan card.", hi: "नियोक्ता का HR या ESIC ई-पहचान कार्ड।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
  APP_TRIP_PROOF: {
    key: "APP_TRIP_PROOF",
    name: { en: "Screenshot showing the trip / login at the time", hi: "उस समय की ट्रिप / लॉगिन का स्क्रीनशॉट" },
    whereToGet: { en: "Partner app trip history.", hi: "पार्टनर ऐप की ट्रिप हिस्ट्री।" },
    cost: { en: "Free", hi: "मुफ़्त" },
  },
};
