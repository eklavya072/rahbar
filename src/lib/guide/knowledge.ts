// Saathi's deterministic layer: everything here answers without any AI, so the
// guide still helps offline, and safety checks run before a message can reach a model.

export type Lang = "en" | "hi";
export type Script = "en" | "hi" | "hinglish";

export interface Term {
  id: string;
  match: RegExp;
  en: { name: string; body: string };
  hi: { name: string; body: string };
  source?: { title: string; url: string };
}

export const GLOSSARY: Term[] = [
  {
    id: "fir",
    match: /\bfir\b|एफ़?आईआर|first information report/i,
    en: { name: "FIR", body: "The First Information Report: the police record of the accident. The family has a right to a free copy (BNSS s.173(2)). Almost every claim needs it." },
    hi: { name: "एफ़आईआर (FIR)", body: "प्रथम सूचना रिपोर्ट: हादसे का पुलिस रिकॉर्ड। परिवार को इसकी मुफ़्त कॉपी का अधिकार है (BNSS धारा 173(2))। लगभग हर दावे में इसकी ज़रूरत होती है।" },
  },
  {
    id: "mact",
    match: /\bmact\b|tribunal|ट्रिब्यूनल|न्यायाधिकरण/i,
    en: { name: "MACT", body: "The Motor Accident Claims Tribunal decides compensation from the insurer of the vehicle that caused the accident (MV Act s.166). Free legal aid can file it for you." },
    hi: { name: "एमएसीटी (MACT)", body: "मोटर दुर्घटना दावा न्यायाधिकरण, जो टक्कर मारने वाले वाहन की बीमा कंपनी से मुआवज़ा तय करता है (MV Act धारा 166)। मुफ़्त कानूनी सहायता यह दावा आपके लिए दायर कर सकती है।" },
  },
  {
    id: "dar",
    match: /\bdar\b|detailed accident report|विस्तृत दुर्घटना/i,
    en: { name: "DAR", body: "The Detailed Accident Report the police must send to the Tribunal. It can be treated as your compensation claim, so ask the police whether it was filed." },
    hi: { name: "डीएआर (DAR)", body: "विस्तृत दुर्घटना रिपोर्ट, जो पुलिस को ट्रिब्यूनल भेजनी होती है। इसे आपका मुआवज़ा दावा माना जा सकता है, इसलिए पुलिस से पूछें कि यह भेजी गई या नहीं।" },
  },
  {
    id: "hitrun",
    match: /hit.?(and|&|n).?run|हिट.?एंड.?रन|गाड़ी भाग|truck bhag|bhaag gay/i,
    en: { name: "Hit-and-run compensation", body: "When the vehicle is never identified, the government pays fixed compensation: ₹2,00,000 for a death, ₹50,000 for grievous injury (MV Act s.161, 2022 scheme). Apply to the Claims Enquiry Officer (SDM/Tehsildar)." },
    hi: { name: "हिट-एंड-रन मुआवज़ा", body: "जब वाहन की पहचान न हो, तो सरकार तय मुआवज़ा देती है: मृत्यु पर ₹2,00,000, गंभीर चोट पर ₹50,000 (MV Act धारा 161, 2022 योजना)। आवेदन दावा जाँच अधिकारी (SDM/तहसीलदार) को दें।" },
  },
  {
    id: "pmsby",
    match: /pmsby|suraksha bima|सुरक्षा बीमा|₹?20 ?(rs|रुपये)?.*(debit|katauti|कटौती)/i,
    en: { name: "PMSBY", body: "A government accident insurance that costs ₹20 a year, auto-debited from a bank account. It pays ₹2,00,000 if the account holder dies in an accident. Look for a ₹20 'PMSBY' debit in the passbook." },
    hi: { name: "पीएमएसबीवाई (PMSBY)", body: "सरकारी दुर्घटना बीमा, ₹20 साल का, बैंक खाते से अपने-आप कटता है। खाताधारक की दुर्घटना में मृत्यु पर ₹2,00,000 मिलते हैं। पासबुक में ₹20 की 'PMSBY' कटौती देखें।" },
  },
  {
    id: "pmjjby",
    match: /pmjjby|jeevan jyoti|जीवन ज्योति|436/i,
    en: { name: "PMJJBY", body: "Life cover that costs ₹436 a year, auto-debited from the bank. It pays ₹2,00,000 on death from any cause, accident or not." },
    hi: { name: "पीएमजेजेबीवाई (PMJJBY)", body: "जीवन बीमा, ₹436 साल का, बैंक से अपने-आप कटता है। किसी भी कारण से मृत्यु पर ₹2,00,000 मिलते हैं।" },
  },
  {
    id: "rupay",
    match: /rupay|रुपे|jan ?dhan|जन ?धन/i,
    en: { name: "RuPay card cover", body: "A Jan Dhan RuPay debit card carries free accident insurance of up to ₹2,00,000, if the card was used in the 90 days before the accident. Tell the bank in writing." },
    hi: { name: "रुपे कार्ड बीमा", body: "जन धन रुपे डेबिट कार्ड पर ₹2,00,000 तक का मुफ़्त दुर्घटना बीमा होता है, अगर हादसे से पहले 90 दिनों में कार्ड इस्तेमाल हुआ हो। बैंक को लिखित में बताएँ।" },
  },
  {
    id: "pa",
    match: /owner.?driver|personal accident|\bpa cover|मालिक.?चालक|व्यक्तिगत दुर्घटना/i,
    en: { name: "Owner-driver PA cover", body: "Every vehicle insurance policy includes compulsory personal accident cover for the owner-driver: ₹15,00,000 on death. Families very often don't know it exists. Call the insurer and register a claim." },
    hi: { name: "मालिक-चालक दुर्घटना कवर", body: "हर वाहन बीमा पॉलिसी में मालिक-चालक के लिए अनिवार्य दुर्घटना कवर होता है: मृत्यु पर ₹15,00,000। अक्सर परिवारों को इसका पता नहीं होता। बीमा कंपनी को फ़ोन करके दावा दर्ज करें।" },
  },
  {
    id: "rahat",
    match: /rahat|राहत|cashless|कैशलेस|treatment|इलाज/i,
    en: { name: "PM RAHAT (cashless treatment)", body: "Road accident victims get cashless treatment of up to ₹1,50,000 for the first 7 days at a designated hospital. The money goes to the hospital, so don't let payment delay care." },
    hi: { name: "पीएम राहत (कैशलेस इलाज)", body: "सड़क दुर्घटना पीड़ितों को नामित अस्पताल में पहले 7 दिन ₹1,50,000 तक कैशलेस इलाज मिलता है। पैसा अस्पताल को जाता है, इसलिए पैसे के लिए इलाज न रुकने दें।" },
  },
  {
    id: "nominee",
    match: /nominee|नॉमिनी|नामांकित|succession|उत्तराधिकार/i,
    en: { name: "Nominee", body: "The person named on a bank account or policy to receive the money. If there is no nominee, banks must still settle up to ₹15 lakh with a simple claim form, without a succession certificate." },
    hi: { name: "नॉमिनी", body: "खाते या पॉलिसी पर लिखा वह व्यक्ति जिसे पैसा मिलता है। नॉमिनी न हो तब भी ₹15 लाख तक बैंक को सरल क्लेम फ़ॉर्म से भुगतान करना होता है, उत्तराधिकार प्रमाण पत्र के बिना।" },
  },
  {
    id: "legalaid",
    match: /nalsa|dlsa|legal aid|free lawyer|वकील|कानूनी सहायता|15100/i,
    en: { name: "Free legal aid", body: "Road accident families can get a free lawyer from the District Legal Services Authority. Call NALSA on 15100. You never need to pay an agent or give a share of compensation." },
    hi: { name: "मुफ़्त कानूनी सहायता", body: "सड़क दुर्घटना से प्रभावित परिवारों को ज़िला विधिक सेवा प्राधिकरण से मुफ़्त वकील मिलता है। NALSA को 15100 पर फ़ोन करें। किसी एजेंट को पैसा या मुआवज़े का हिस्सा देने की ज़रूरत नहीं।" },
  },
  {
    id: "lokadalat",
    match: /lok ?adalat|लोक ?अदालत/i,
    en: { name: "Lok Adalat", body: "A settlement court that can close compensation cases faster. Check any offer against the court formula first; once you accept, the case is closed." },
    hi: { name: "लोक अदालत", body: "समझौता अदालत, जहाँ मुआवज़े के मामले जल्दी निपट सकते हैं। पहले हर प्रस्ताव को अदालत के सूत्र से मिलाएँ; मान लेने पर मामला बंद हो जाता है।" },
  },
  {
    id: "postmortem",
    match: /post.?mortem|पोस्टमार्टम|death certificate|मृत्यु प्रमाण/i,
    en: { name: "Post-mortem report and death certificate", body: "Most claims need both. Ask the hospital or police for several copies of the post-mortem report, and get the death certificate from the municipal office. Both are free or nominal." },
    hi: { name: "पोस्टमार्टम रिपोर्ट और मृत्यु प्रमाण पत्र", body: "ज़्यादातर दावों में दोनों चाहिए। अस्पताल या पुलिस से पोस्टमार्टम रिपोर्ट की कई कॉपी माँगें, और मृत्यु प्रमाण पत्र नगर निगम से लें। दोनों मुफ़्त या नाममात्र शुल्क पर मिलते हैं।" },
  },
];

const CRISIS = /suicid|kill myself|end (my|it all)|don'?t want to live|want to die|no reason to live|आत्महत्या|ख़ुदकुशी|खुदकुशी|जीना नहीं|मर जाना|मरना चाहत|jeena nahi|jina nahi|marna chaht|mar jana|khudkushi/i;
const TOUT = /commission|percent|%|\bcut\b|share of (the )?(money|compensation)|dalal|दलाल|agent (is |has )?(ask|want|say)|एजेंट|blank (paper|page)|khali kagaz|ख़ाली काग़ज़|कोरे काग़ज़|advance (fee|money)|pehle paise|पहले पैसे|fees? (to|for) (get|claim)|रिश्वत|bribe|ghoos|घूस/i;

export function detectScript(text: string, uiLang: Lang): Script {
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  if (/\b(kya|hai|hain|mera|meri|mere|kaise|kitna|kitne|paisa|paise|nahi|nahin|haan|hua|hui|karna|karein|chahiye|kab|kahan|kaun|batao|bataiye|unka|unki|pati|beta|madad)\b/i.test(text)) return "hinglish";
  return uiLang === "hi" && !/[a-z]{4,}/i.test(text) ? "hi" : "en";
}

export function isCrisis(text: string) {
  return CRISIS.test(text);
}
export function isTout(text: string) {
  return TOUT.test(text);
}
export function findTerm(text: string): Term | null {
  const asking = /what|meaning|mean|explain|kya hai|kya hota|matlab|मतलब|क्या है|क्या होता|बताइए|बताओ|samjha/i.test(text) || text.trim().split(/\s+/).length <= 3;
  if (!asking) return null;
  return GLOSSARY.find((t) => t.match.test(text)) ?? null;
}

export type NavIntent = "start" | "sample" | "papers" | "offer" | "letters" | "owed" | "help" | null;
export function navIntent(text: string): NavIntent {
  const t = text.toLowerCase();
  if (/what (do|should) i do (here|now)|where (do|should) i (start|begin)|yahan kya|ab kya kar|यहाँ क्या|अब क्या कर|कहाँ से शुरू|how (does|do) (this|it) work|kaise kaam/.test(t)) return "help";
  if (/sample|demo|example|उदाहरण|सैंपल/.test(t)) return "sample";
  if (/upload|photo|papers|documents?\b|kagaz|काग़ज़|कागज|फ़ोटो|फोटो/.test(t)) return "papers";
  if (/offer|settlement|insurer (is )?offer|प्रस्ताव|समझौता/.test(t)) return "offer";
  if (/letter|application|patra|पत्र|आवेदन/.test(t)) return "letters";
  if (/how much|what can (i|we|my family) (get|claim)|kitna (paisa|milega)|कितना (पैसा|मिलेगा)|क्या मिलेगा|हक़/.test(t)) return "owed";
  if (/\b(start|begin|shuru)\b|शुरू/.test(t)) return "start";
  return null;
}

/** What to do on each page, in one breath. */
export function pageHelp(path: string, lang: Lang): string {
  const hi = lang === "hi";
  const step = path.split("/")[2] ?? "";
  const map: Record<string, [string, string]> = {
    story: ["Tell us who you are to the person in the accident and, if you like, what happened. Everything stays on this phone. Then press 'Next: your papers'.", "बताइए आप उनके क्या लगते हैं और चाहें तो क्या हुआ। सब कुछ इसी फ़ोन पर रहता है। फिर 'आगे: काग़ज़' दबाएँ।"],
    papers: ["Take photos of the FIR, a bank passbook page and the vehicle insurance policy, whatever you have. Then press 'Read my papers'. No papers? You can answer questions instead.", "FIR, बैंक पासबुक का पन्ना और गाड़ी की बीमा पॉलिसी की फ़ोटो लें, जो भी है। फिर 'काग़ज़ पढ़ें' दबाएँ। काग़ज़ नहीं हैं? सवालों से आगे बढ़ सकते हैं।"],
    check: ["Check what we read from your papers and press 'Fix' if anything is wrong. Then answer a few questions. 'I don't know' is fine. I can also ask them for you here.", "काग़ज़ों से जो पढ़ा, उसे जाँचें और कुछ ग़लत हो तो 'बदलें' दबाएँ। फिर कुछ सवालों के जवाब दें। 'पता नहीं' भी ठीक है। मैं ये सवाल यहीं भी पूछ सकता हूँ।"],
    owed: ["This page lists every claim your family may have, with the amount, the deadline and where to apply. Tap 'Why & how' on any claim. Then make the plan and letters.", "इस पन्ने पर हर दावा है: राशि, अंतिम तिथि और कहाँ जमा करना है। किसी भी दावे पर 'क्यों और कैसे' दबाएँ। फिर योजना और पत्र बनाएँ।"],
    plan: ["Do the claims in this order, nearest deadline first. Press 'Write letters', read each one, and tick the ones that are correct. Then print them or send the plan on WhatsApp.", "दावे इसी क्रम में करें, सबसे नज़दीकी तिथि पहले। 'पत्र लिखें' दबाएँ, हर पत्र पढ़ें और सही वालों पर निशान लगाएँ। फिर प्रिंट करें या WhatsApp पर भेजें।"],
    track: ["After you file a claim, tap 'Filed'. If an office misses its legal deadline, Rahbar writes the next complaint for you. Save the case under lock so you can come back.", "दावा जमा करने के बाद 'जमा किया' दबाएँ। कोई दफ़्तर कानूनी समय-सीमा चूके तो रहबर अगला शिकायत पत्र लिख देता है। केस को ताले में सेव करें ताकि बाद में लौट सकें।"],
  };
  if (path.startsWith("/case") && map[step]) return hi ? map[step][1] : map[step][0];
  if (path.startsWith("/offer")) return hi ? "बीमा कंपनी का प्रस्ताव मिला है? उसकी राशि और उन्होंने जो आय मानी, वह भरें। रहबर उसे सुप्रीम कोर्ट के सूत्र से मिलाकर बताएगा कि क्या छूटा है।" : "Got an offer from the insurer? Enter the amount and the income they used. Rahbar compares it with the Supreme Court formula and shows what is missing.";
  return hi
    ? "रहबर हादसे के बाद आपके परिवार का हर हक़ ढूँढता है। 'अपना केस शुरू करें' दबाएँ, या पहले एक सैंपल केस देखें। मुझसे हिंदी या अंग्रेज़ी में कुछ भी पूछें।"
    : "Rahbar finds everything your family is owed after an accident. Press 'Start your case', or watch a sample case first. Ask me anything, in Hindi or English.";
}

export const CRISIS_REPLY = {
  en: "I'm so sorry. What you are carrying is very heavy, and you don't have to carry it alone. Please talk to someone right now: Tele-MANAS on 14416 is free, confidential and answers in Hindi, day and night. If anyone is in danger, call 112.",
  hi: "मुझे बहुत दुख है। आप जो सह रहे हैं वह बहुत भारी है, और आपको यह अकेले नहीं सहना है। कृपया अभी किसी से बात करें: Tele-MANAS 14416 मुफ़्त और गोपनीय है, हिंदी में, दिन-रात। किसी की जान को ख़तरा हो तो 112 पर कॉल करें।",
};
export const TOUT_REPLY = {
  en: "Please be careful. None of these claims needs an agent, a fee or a share of the money. Never sign blank papers or a vakalatnama for a stranger, and never agree to give a percentage of compensation. A free lawyer is available: call NALSA on 15100.",
  hi: "कृपया सावधान रहें। इनमें से किसी दावे के लिए एजेंट, फ़ीस या पैसे में हिस्से की ज़रूरत नहीं है। किसी अनजान के कोरे काग़ज़ या वकालतनामे पर हस्ताक्षर न करें, और मुआवज़े का कोई प्रतिशत देने को राज़ी न हों। मुफ़्त वकील मिलता है: NALSA 15100 पर कॉल करें।",
};
