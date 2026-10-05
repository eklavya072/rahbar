// Claim tracker: statutory clocks + escalation ladders per institution, and the "when the money arrives" timeline.

import { addDays, daysBetween, formatDate, isValidISO } from "./dates";
import type { Bilingual, Citation, EntitlementId } from "./types";

export type Stage = "not_started" | "filed" | "paid" | "rejected";

export interface ClaimTrack {
  id: EntitlementId;
  stage: Stage;
  filedOn?: string;
  paidOn?: string;
  paidAmount?: number;
  rejectedOn?: string;
  escalatedLevel?: number; // highest escalation level already sent
  escalatedOn?: string;
}

export interface EscalationStep {
  level: number;
  to: Bilingual;
  how: Bilingual;
  waitDays: number; // days to wait for this level to respond before going to the next
}

export interface ClaimClock {
  /** Statutory/target days from filing to payment. */
  tatDays: number;
  tatLabel: Bilingual;
  /** Typical window from filing to money in hand, for the cash-flow timeline. */
  payout: [number, number];
  interest?: Bilingual;
  basis: Citation;
  ladder: EscalationStep[];
}

const IRDAI: Citation = { title: "IRDAI (Protection of Policyholders' Interests) Regulations & Master Circular 2024", url: "https://www.oquilia.com/news/irdai-protection-policyholders-interests-master-circular-2024-grievance" };
const BIMA_BHAROSA = { en: "Bima Bharosa portal (bimabharosa.irdai.gov.in) / Insurance Ombudsman (free)", hi: "बीमा भरोसा पोर्टल (bimabharosa.irdai.gov.in) / बीमा लोकपाल (मुफ़्त)" };
const RBI_OMB = { en: "RBI Integrated Ombudsman (cms.rbi.org.in) (free)", hi: "RBI एकीकृत लोकपाल (cms.rbi.org.in) (मुफ़्त)" };
const DLSA = { en: "District Legal Services Authority: free lawyer (NALSA 15100)", hi: "ज़िला विधिक सेवा प्राधिकरण: मुफ़्त वकील (NALSA 15100)" };

export const CLOCKS: Record<EntitlementId, ClaimClock> = {
  CPA: {
    tatDays: 30,
    tatLabel: { en: "Insurer must settle within 30 days of the last document (45 if it investigates)", hi: "आख़िरी दस्तावेज़ के 30 दिन में बीमा कंपनी को भुगतान करना है (जाँच हो तो 45)" },
    payout: [20, 50],
    interest: { en: "Late payment carries interest at Bank Rate + 2%", hi: "देरी पर बैंक रेट + 2% ब्याज" },
    basis: IRDAI,
    ladder: [
      { level: 1, to: { en: "Insurer's Grievance Redressal Officer", hi: "बीमा कंपनी के शिकायत निवारण अधिकारी" }, how: { en: "Email/letter citing the claim number; insurers must resolve grievances in 14 days", hi: "क्लेम नंबर के साथ ईमेल/पत्र; 14 दिन में समाधान ज़रूरी" }, waitDays: 14 },
      { level: 2, to: BIMA_BHAROSA, how: { en: "File online with the claim and grievance numbers (within 1 year)", hi: "क्लेम और शिकायत नंबर के साथ ऑनलाइन दर्ज करें (1 साल के भीतर)" }, waitDays: 30 },
      { level: 3, to: DLSA, how: { en: "Ask for a free lawyer to file before the Consumer Commission", hi: "उपभोक्ता आयोग में केस के लिए मुफ़्त वकील माँगें" }, waitDays: 30 },
    ],
  },
  PMSBY: {
    tatDays: 60,
    tatLabel: { en: "Bank forwards within 30 days; insurer settles within 30 days", hi: "बैंक 30 दिन में आगे भेजता है; बीमा कंपनी 30 दिन में भुगतान" },
    payout: [30, 75],
    basis: { title: "PMSBY claim procedure", url: "https://tmb.bank.in/doc/pmsby_procedure_01.pdf" },
    ladder: [
      { level: 1, to: { en: "Branch Manager, then the bank's Principal Nodal Officer", hi: "शाखा प्रबंधक, फिर बैंक के प्रधान नोडल अधिकारी" }, how: { en: "Written complaint with the claim acknowledgement", hi: "क्लेम रसीद के साथ लिखित शिकायत" }, waitDays: 15 },
      { level: 2, to: { en: "CPGRAMS (pgportal.gov.in) → Department of Financial Services", hi: "CPGRAMS (pgportal.gov.in) → वित्तीय सेवा विभाग" }, how: { en: "Public grievance against the bank/insurer", hi: "बैंक/बीमा कंपनी के ख़िलाफ़ लोक शिकायत" }, waitDays: 30 },
      { level: 3, to: BIMA_BHAROSA, how: { en: "If the insurer delays or rejects", hi: "अगर बीमा कंपनी देरी करे या खारिज करे" }, waitDays: 30 },
    ],
  },
  PMJJBY: {
    tatDays: 60,
    tatLabel: { en: "Bank forwards within 30 days; insurer settles within 30 days", hi: "बैंक 30 दिन में आगे भेजता है; बीमा कंपनी 30 दिन में भुगतान" },
    payout: [30, 75],
    basis: { title: "PMJJBY & PMSBY claim procedure", url: "https://www.relakhs.com/pmjjby-pmsby-insurance-claim-procedure/" },
    ladder: [
      { level: 1, to: { en: "Branch Manager, then the bank's Principal Nodal Officer", hi: "शाखा प्रबंधक, फिर बैंक के प्रधान नोडल अधिकारी" }, how: { en: "Written complaint with the claim acknowledgement", hi: "क्लेम रसीद के साथ लिखित शिकायत" }, waitDays: 15 },
      { level: 2, to: { en: "CPGRAMS (pgportal.gov.in) → Department of Financial Services", hi: "CPGRAMS (pgportal.gov.in) → वित्तीय सेवा विभाग" }, how: { en: "Public grievance", hi: "लोक शिकायत" }, waitDays: 30 },
      { level: 3, to: BIMA_BHAROSA, how: { en: "If the insurer delays or rejects", hi: "अगर बीमा कंपनी देरी करे या खारिज करे" }, waitDays: 30 },
    ],
  },
  RUPAY: {
    tatDays: 60,
    tatLabel: { en: "Target: settled within ~60 days of complete documents", hi: "लक्ष्य: पूरे दस्तावेज़ों के ~60 दिन में भुगतान" },
    payout: [30, 90],
    basis: { title: "RuPay PMJDY accident claim process", url: "https://pmjdy.gov.in/files/QuickLinks/Accidental-Insurance.pdf" },
    ladder: [
      { level: 1, to: { en: "Branch Manager / bank grievance cell", hi: "शाखा प्रबंधक / बैंक शिकायत प्रकोष्ठ" }, how: { en: "Written complaint with the claim acknowledgement", hi: "क्लेम रसीद के साथ लिखित शिकायत" }, waitDays: 30 },
      { level: 2, to: RBI_OMB, how: { en: "After 30 days without a reply from the bank", hi: "बैंक से 30 दिन में जवाब न मिलने पर" }, waitDays: 30 },
    ],
  },
  HIT_RUN: {
    tatDays: 60,
    tatLabel: { en: "Enquiry report 30 days → sanction 15 days → payment 15 days", hi: "जाँच रिपोर्ट 30 दिन → स्वीकृति 15 दिन → भुगतान 15 दिन" },
    payout: [45, 90],
    basis: { title: "Hit-and-Run Scheme 2022; S. Rajaseekaran v. UoI (2024)", url: "https://www.verdictum.in/court-updates/supreme-court/s-rajaseekaran-v-union-of-india-ors-2024-insc-37-compensation-in-hit-run-accidents-1515043" },
    ladder: [
      { level: 1, to: { en: "Claims Settlement Commissioner (District Magistrate)", hi: "दावा निपटान आयुक्त (ज़िलाधिकारी)" }, how: { en: "Letter noting the scheme's 30/15/15-day timeline", hi: "योजना की 30/15/15 दिन की समय-सीमा का हवाला देते हुए पत्र" }, waitDays: 15 },
      { level: 2, to: DLSA, how: { en: "The Supreme Court (2024) made DLSAs responsible for helping hit-and-run claimants", hi: "सुप्रीम कोर्ट (2024) ने हिट-एंड-रन दावेदारों की मदद की ज़िम्मेदारी DLSA को दी" }, waitDays: 30 },
    ],
  },
  MACT: {
    tatDays: 120,
    tatLabel: { en: "Police DAR within 90 days of the accident → insurer's offer within 30 days → payment within 30 days of settlement", hi: "दुर्घटना के 90 दिन में पुलिस DAR → 30 दिन में बीमा कंपनी का प्रस्ताव → समझौते के 30 दिन में भुगतान" },
    payout: [150, 1300],
    basis: { title: "MV Act s.149; CMV Rules 2022; Gohar Mohammed v. UPSRTC (SC 2022)", url: "https://www.livelaw.in/top-stories/motor-accident-claims-supreme-court-issues-directions-for-timely-registration-of-first-accident-report-by-police-directs-forming-of-special-police-units-217732" },
    ladder: [
      { level: 1, to: { en: "Investigating Officer / SHO: ask whether the DAR was filed (RTI if no answer)", hi: "जाँच अधिकारी / थानाध्यक्ष: DAR दाखिल हुई या नहीं (जवाब न मिले तो RTI)" }, how: { en: "Written request; RTI to the police PIO (₹10 fee, reply in 30 days)", hi: "लिखित अनुरोध; पुलिस PIO को RTI (₹10 शुल्क, 30 दिन में जवाब)" }, waitDays: 30 },
      { level: 2, to: DLSA, how: { en: "Free lawyer to move the Tribunal", hi: "ट्रिब्यूनल में आवेदन के लिए मुफ़्त वकील" }, waitDays: 30 },
    ],
  },
  EMPLOYER: {
    tatDays: 90,
    tatLabel: { en: "ESIC dependants' benefit / EC Act compensation, target 90 days", hi: "ESIC आश्रित लाभ / EC अधिनियम मुआवज़ा, लक्ष्य 90 दिन" },
    payout: [45, 120],
    basis: { title: "ESIC benefits; Employees' Compensation Act", url: "http://esic.gov.in/information-benefits" },
    ladder: [
      { level: 1, to: { en: "ESIC Branch Office manager", hi: "ESIC शाखा कार्यालय प्रबंधक" }, how: { en: "Written complaint with the accident report number", hi: "दुर्घटना रिपोर्ट नंबर के साथ लिखित शिकायत" }, waitDays: 30 },
      { level: 2, to: { en: "Commissioner for Employees' Compensation (Labour Dept.)", hi: "कर्मचारी मुआवज़ा आयुक्त (श्रम विभाग)" }, how: { en: "Claim application (within 2 years)", hi: "दावा आवेदन (2 साल के भीतर)" }, waitDays: 60 },
    ],
  },
  GIG: {
    tatDays: 15,
    tatLabel: { en: "Platforms state 7-15 working days after documents", hi: "प्लेटफ़ॉर्म दस्तावेज़ों के बाद 7-15 कार्य दिवस बताते हैं" },
    payout: [10, 30],
    basis: { title: "Gig worker insurance (2026)", url: "https://www.oneassure.in/insurance/health-insurance-guides/insurance-for-gig-workers-zomato-swiggy-plans" },
    ladder: [
      { level: 1, to: { en: "Platform's Grievance Officer (listed in the app / website)", hi: "प्लेटफ़ॉर्म के शिकायत अधिकारी (ऐप / वेबसाइट पर)" }, how: { en: "Email with trip proof and claim ID", hi: "ट्रिप सबूत और क्लेम ID के साथ ईमेल" }, waitDays: 15 },
      { level: 2, to: BIMA_BHAROSA, how: { en: "Complaint against the platform's insurer", hi: "प्लेटफ़ॉर्म की बीमा कंपनी के ख़िलाफ़ शिकायत" }, waitDays: 30 },
    ],
  },
  BANK_BALANCE: {
    tatDays: 15,
    tatLabel: { en: "Bank must settle within 15 days of complete documents", hi: "पूरे दस्तावेज़ों के 15 दिन में बैंक भुगतान करे" },
    payout: [15, 30],
    interest: { en: "Late settlement carries compensation at Bank Rate + 4%", hi: "देरी पर बैंक रेट + 4% मुआवज़ा" },
    basis: { title: "RBI Deceased Customers Directions, 2025", url: "https://taxguru.in/rbi/rbi-standardizes-deceased-customer-claim-settlement-banks.html" },
    ladder: [
      { level: 1, to: { en: "Branch Manager / bank's grievance officer", hi: "शाखा प्रबंधक / बैंक शिकायत अधिकारी" }, how: { en: "Letter citing the RBI 2025 directions", hi: "RBI 2025 निर्देशों का हवाला देते हुए पत्र" }, waitDays: 30 },
      { level: 2, to: RBI_OMB, how: { en: "After 30 days without resolution", hi: "30 दिन में समाधान न होने पर" }, waitDays: 30 },
    ],
  },
  RAHAT: {
    tatDays: 7,
    tatLabel: { en: "Covers the first 7 days of treatment", hi: "इलाज के पहले 7 दिन कवर" },
    payout: [0, 7],
    basis: { title: "PM RAHAT (2026)", url: "https://www.newsonair.gov.in/government-announces-launch-of-pm-rahat-scheme-for-cashless-treatment-of-up-to-rs-1-lakh-50-thousand-for-road-accident-victims" },
    ladder: [{ level: 1, to: { en: "State Health Agency grievance line", hi: "राज्य स्वास्थ्य एजेंसी शिकायत लाइन" }, how: { en: "If a designated hospital billed you", hi: "अगर नामित अस्पताल ने बिल लिया" }, waitDays: 30 }],
  },
};

export interface TrackStatus {
  dueBy: string | null;
  daysLeft: number | null;
  overdueBy: number;
  nextStep: EscalationStep | null;
  /** When the next escalation may be sent (after the previous level's wait). */
  nextStepFrom: string | null;
}

export function trackStatus(t: ClaimTrack, today: string): TrackStatus {
  const clock = CLOCKS[t.id];
  if (t.stage !== "filed" || !isValidISO(t.filedOn)) return { dueBy: null, daysLeft: null, overdueBy: 0, nextStep: null, nextStepFrom: null };
  const dueBy = addDays(t.filedOn, clock.tatDays);
  const daysLeft = daysBetween(today, dueBy);
  const overdueBy = Math.max(0, -daysLeft);
  const level = t.escalatedLevel ?? 0;
  const next = clock.ladder.find((s) => s.level === level + 1) ?? null;
  const prev = clock.ladder.find((s) => s.level === level);
  const nextStepFrom = level === 0 ? dueBy : prev && t.escalatedOn ? addDays(t.escalatedOn, prev.waitDays) : dueBy;
  return { dueBy, daysLeft, overdueBy, nextStep: next, nextStepFrom };
}

export function escalationLetter(
  t: ClaimTrack,
  step: EscalationStep,
  ctx: { lang: "en" | "hi"; claimName: Bilingual; claimant: string; victim: string; today: string },
): string {
  const c = CLOCKS[t.id];
  const due = t.filedOn ? addDays(t.filedOn, c.tatDays) : null;
  const late = due ? Math.max(0, daysBetween(due, ctx.today)) : 0;
  if (ctx.lang === "hi") {
    return [
      `सेवा में,\n${step.to.hi}`,
      `विषय: ${ctx.claimName.hi} दावे में देरी: ${ctx.victim}`,
      `महोदय/महोदया,`,
      `मैंने ${t.filedOn ? formatDate(t.filedOn, "hi") : "[तारीख]"} को ${ctx.claimName.hi} के तहत दावा जमा किया था। नियम के अनुसार (${c.tatLabel.hi}) इसका निपटारा ${due ? formatDate(due, "hi") : "[तारीख]"} तक हो जाना चाहिए था, पर ${late} दिन बाद भी भुगतान नहीं हुआ है।${c.interest ? ` ${c.interest.hi}।` : ""}`,
      `कृपया दावे का शीघ्र निपटारा करें और लिखित जवाब दें। आधार: ${c.basis.title}।`,
      `भवदीय/भवदीया,\n${ctx.claimant}`,
    ].join("\n\n");
  }
  return [
    `To,\n${step.to.en}`,
    `Subject: Delay in settling the ${ctx.claimName.en} claim: ${ctx.victim}`,
    `Respected Sir/Madam,`,
    `I submitted a claim under the ${ctx.claimName.en} on ${t.filedOn ? formatDate(t.filedOn, "en") : "[date]"}. Under the applicable rule (${c.tatLabel.en}) it should have been settled by ${due ? formatDate(due, "en") : "[date]"}, but it remains unpaid ${late} day(s) later.${c.interest ? ` ${c.interest.en}.` : ""}`,
    `I request that the claim be settled without further delay and that I be informed in writing. Basis: ${c.basis.title}.`,
    `Yours faithfully,\n${ctx.claimant}`,
  ].join("\n\n");
}

/** Expected payout window (days from today) assuming ~10 days to gather documents and file. */
export function payoutWindow(id: EntitlementId, t: ClaimTrack | undefined, today: string): [number, number] {
  const [a, b] = CLOCKS[id].payout;
  if (t?.stage === "paid") return [0, 0];
  if (t?.stage === "filed" && isValidISO(t.filedOn)) {
    const elapsed = daysBetween(t.filedOn, today);
    return [Math.max(0, a - elapsed), Math.max(1, b - elapsed)];
  }
  const prep = 10;
  return [a + prep, b + prep];
}
