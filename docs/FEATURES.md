# From research to features (round 3)

How each new feature answers a documented gap after road crashes in India, and what a product-minded judge would ask.

## What the research says happens after a crash
| Finding | Source |
|---|---|
| **69% of road-injury households resort to distress financing** (borrowing, selling assets); 46% face catastrophic total expenditure | BMC Health Services Research, Hyderabad (PMC3475104) |
| 49.3% of injury-affected households face catastrophic health expenditure; **17.8% fall into poverty** | NSS 2017–18 analysis (Humanities & Social Sciences Communications, 2022) |
| Insurer must make a **settlement offer within 30 days**; if the family accepts, it's final; payment within 30 days of the settlement record | MV Act s.149 (2019 amendment) |
| Families can't judge offers. Courts keep correcting undervalued awards (one High Court raised ₹33,666 to ₹8.9 lakh after a tribunal omitted future prospects and consortium) | High Court reports; Crashfree India (2026) on discounted Lok Adalat settlements |
| Compensation follows a formula: **Sarla Verma** multipliers and deductions + **Pranay Sethi** future prospects + conventional heads (₹15k/₹40k/₹15k, +10% every 3 years) + **Magma (2018)** consortium per dependant | SC: Sarla Verma (2009), Pranay Sethi (2017), Magma (2018) |
| **Informal workers lack payslips → tribunals default to minimum wage → undervaluation**. Delhi HC (2026): minimum wage is "only a guiding benchmark"; tribunals must assess actual earnings | Crashfree India (2026); *Savita v. National Insurance*, 2026 DHC 3626 |
| Police must file FAR in **48 h**, IAR in **50 days**, DAR in **90 days**; SC ordered compliance | CMV (5th Amendment) Rules 2022; *Gohar Mohammed v. UPSRTC* (SC, 2022) |
| Insurers must settle within **30 days of the last document** (45 if investigated), else pay **interest at Bank Rate + 2%**; grievances resolved in **14 days**, then Ombudsman | IRDAI PPHI Regulations / Master Circular 2024 |
| Banks must settle a deceased customer's claim within **15 days**, else pay **Bank Rate + 4%**; simplified procedure up to ₹15 lakh without a nominee | RBI Directions, 26 Sep 2025 |
| Fake-claim syndicates: SC ordered every State to form SITs; UP SIT registered 231 FIRs against 533 accused | SC order (2025); LiveLaw, Bar & Bench |
| **32.4% of crash survivors had PTSD**; 20.8% depression | Uttarakhand study (PubMed 34211218) |
| Good Samaritans are protected (s.134A) and rewarded ₹25,000 (Rah-Veer) | MoRTH / PIB (2025) |

## Features built from these findings
| # | Feature | Gap it closes | Why nobody else does it |
|---|---|---|---|
| 1 | **Settlement Offer Auditor**: computes just compensation (Sarla Verma + Pranay Sethi + Magma) and audits the insurer's offer head by head, then drafts a reply for the family's legal-aid lawyer | s.149 offers are final once accepted; families can't judge them | Calculators estimate; none audit a specific offer with red flags and a reply |
| 2 | **Income Evidence Builder**: reconstructs monthly income from salary/payout credits in the passbook, with highlighted lines, as a tribunal-ready annexure | Informal workers get minimum wage by default | Uses the family's own bank trail; shows the rupee difference proof makes |
| 3 | **Claim Tracker + Escalation Engine**: each claim has a statutory clock; when it's overdue the app drafts the next escalation with the legal basis (IRDAI interest, RBI 15-day rule, hit-and-run 30/15/15, DAR 90 days → RTI) | Claims stall silently; families don't know who is next in line | Statutory TATs encoded per institution |
| 4 | **"When the money arrives" cash-flow timeline** | 69% distress borrowing | Shows which money lands in weeks vs years, so families can avoid predatory loans |
| 5 | **Encrypted case vault** (AES-256-GCM, PBKDF2) + encrypted export/import | Real cases take months; caseworkers juggle many | Zero-knowledge: no server ever sees case data |
| 6 | **Tamper-evident claim packet** (SHA-256 of every document and letter + packet fingerprint QR) | SC-ordered SITs on fake claims; insurers distrust genuine families | Genuine claims become verifiable |
| 7 | **First 48 hours mode** (PM RAHAT, free FIR copy, post-mortem, don't sign blank papers, Good Samaritan protection) | The earliest mistakes cost the most | Event-timed guidance |
| 8 | **Deceased's bank balance** rule (RBI 2025, 15-day TAT) using the passbook's closing balance | Savings also get stuck | Read straight from the passbook |
| 9 | **Rules registry + changelog** (`/rules`) and a **public API** (`/api/v1`, OpenAPI) | Production use needs governance and integration (DLSA, hospitals, NGOs) | Policy-as-code that others can build on |
| 10 | **Read-aloud** (Hindi/English) and **support lines** (Tele-MANAS 14416, NALSA 15100, 112) | Low literacy; trauma | Compassionate design |
| 11 | **Offline-capable PWA** | Rural connectivity | Rules engine and OCR work offline after first load |
