# WCC Launchpad 30 — Research Brief & Decision

Prepared Sun 4 Oct 2026, ~17:00 IST. **Submissions close Mon 5 Oct, 14:00 IST** (wecodecoders.in timeline; Unstop lists 16:00 — treat 14:00 as the hard deadline).

---

## 1. What this hackathon actually rewards

### Facts about the event
- Organiser: **We Code Coders** (est. 2026). Launchpad 30 is effectively its first flagship; **no past winners, judges, or showcased projects are published anywhere** (checked wecodecoders.in, Unstop, LinkedIn/Reddit/GitHub searches). Forge 48 runs *after* this event.
- Title sponsor **Inkloom** (AI logo/brand models). Tooling partners **Miro, n8n**; domain partner **.xyz**. "Sponsor challenges with surprise rewards" + mini-challenges run during the event — watch Unstop/Discord.
- Judging spans: main leaderboard, **track awards**, sponsor challenges, mini-challenges.
- Must submit: working prototype (core workflow functional), source repo, demo (video), short explanation of problem/solution/tech/future plan, **evidence of the real problem**. Deployment "strongly recommended". AI tools allowed **with disclosure**. Judges may ask for proof of development (commit history matters).

### The official rubric (this is the real "x-factor")
| Criterion | Pts | What the organisers literally ask |
|---|---|---|
| User insight & problem evidence | 15 | "How well do you understand the person you are building for? **Research, observation, interviews or survey data**" |
| Strength of core solution | 24 | "Does the product solve the problem you named, **directly**?" |
| Technical depth & reliability | 24 | "How well have you used what you chose? **Does it work consistently?**" |
| Originality & differentiation | 15 | "What makes this **different from the tools that exist**" |
| Real-world usability | 12 | "Could the intended user work it out **without a walkthrough**?" |
| Responsible design & trust | 10 | Privacy, security, bias, transparency, accessibility |

Agentic AI track note: evaluated on **agent usefulness, orchestration quality, reliability, and human control**.

### What this tells us (synthesised with judge interviews from Devpost, winner write-ups, Microsoft Agents League / Indian agentic hackathon recaps)
1. **48% of marks are "it works, directly and consistently."** Over-scoped agent demos that break lose. Narrow scope, deterministic core, tests.
2. **Primary evidence is explicitly asked for.** Most teams will paste two news stats. A small real survey + 2–3 interviews is a cheap 15-point differentiator.
3. **"Different from tools that exist"** → we must show a competitor table and pick a space where nothing exists.
4. **Recent agentic winners** won on *decomposition into specialised agents with narrow contracts, tool budgets and test harnesses* (e.g., a student winner "backed by 611 tests"), not clever prompts.
5. **Judges' turn-offs** (Devpost panel): rehashed ideas, slick UI over a shallow codebase, over-indexing on one criterion, ignoring requirements. Turn-ons: storytelling, demo video with voice-over, polished end-user UX, using sponsor tools.
6. The video is the primary touchpoint when judges review many submissions.

---

## 2. Ideas investigated — and why most were rejected

Every candidate was checked for (a) hard problem evidence, (b) existing products, (c) existing hackathon projects, (d) buildability in ~20 h.

| Idea | Evidence | Already exists? | Verdict |
|---|---|---|---|
| Health-insurance claim/bill auditor | Strong (₹30,000 cr rejected FY25; 43% struggle — LocalCircles) | **ClaimShield (Hack-A-Throne 2026)**, MedAudit, Oquilia, Insurance Samadhan, Adjudo | Rejected — originality |
| Deceased-family asset recovery (unclaimed deposits etc.) | Strong (₹1.84 lakh cr unclaimed) | **Anvaya (hackathon)**, UnClaimedX, EasyInherit, Kustodian | Rejected — originality |
| Undertrial bail eligibility (S.479 BNSS) | Strong (~75% of prisoners undertrial) | **SIH 2024 problem statement**; NyayaSetu, Justify-Sync, Bail-Reckoner, Judicio, JusticeFlow | Rejected — heavily done |
| MSME delayed-payment enforcer (MSMED s.16, 43B(h)) | Strong | Many calculators, CredFlow-style reminders, ODR portal | Weak originality |
| Dark-pattern auditor (CCPA 2023) | Good | Govt Dark Patterns Buster Hackathon 2023 | Weak originality |
| ADR (side-effect) reporting agent | Moderate | PvPI "ADR PvPI" app; pharmacovigilance agents on GitHub | Judges less likely to relate |
| Generic govt-scheme finder | — | myScheme, Haqdarshak (7,500 schemes) | Rejected — the most common hackathon idea |
| **Road-crash entitlement agent** | **Very strong, Supreme Court–certified** | **Partial overlap (found in round 2):** Crashfree India's **AASHA** (CARS24-backed NGO) — a bilingual web chatbot giving legal-rights guidance + a MACT compensation calculator. Nothing found that reads the family's documents to discover insurance cover, or prepares and tracks the paperwork | **Selected — repositioned (see §7)** |

Estimated rubric fit (my judgement, /90): Road-crash agent ≈ 83 · Insurance auditor ≈ 75 · MSME ≈ 72 · Deceased assets ≈ 70 · Undertrial ≈ 68 · Dark patterns ≈ 69 · ADR ≈ 69 · Scheme finder ≈ 55. The gap is mostly **originality** and **problem evidence**.

---

## 3. The selected problem

### One-line problem
A single road crash in India legally triggers **up to ~10 separate entitlements** (insurance, statutory compensation, government schemes, employer liability), each held by a different institution, with different forms, documents and deadlines. **Families almost never claim them** — not because they're ineligible, but because nobody tells them, and the paperwork defeats them.

### Evidence (secondary)
- **1,72,890 deaths and 4,62,825 injuries** from 4,80,583 road crashes in 2023 — the highest ever; 66% of victims aged 18–45 (MoRTH *Road Accidents in India 2023*).
- **Hit-and-run:** only **205 claims** were filed under the ₹2 lakh compensation scheme in FY 2022-23 (95 settled) against **~25,000 eligible hit-and-run crashes a year** (General Insurance Council) — under 1%. After the Supreme Court (S. Rajaseekaran v. UoI, 2024 INSC 37) called uptake "very negligible" and ordered police to inform victims and DLSAs to help, claims rose to ~3,000 in FY 2023-24 — **still only ~12%**, from just 10 states + 1 UT (Crashfree India, *Justice Unserved*, Jan 2026). *(Correction: round 1 said "~0.3%" by dividing by all 67,387 hit-and-run accidents; the eligible-crash base is the fairer one.)*
- **90% of stuck hit-and-run claims** (921 of 1,026, July 2024) were stuck on **missing documents** — FIR, hospital records, insurance papers. → The blocker is paperwork, not eligibility.
- **70% of low-income and 63% of higher-income crash households were unaware** of compensation schemes (World Bank & SaveLIFE Foundation, 2021). None of the truck drivers surveyed had ever used cashless treatment, the Solatium Fund or ex-gratia schemes.
- **Crash costs poor households 7+ months of income**; 75% of poor households saw income fall (World Bank 2021).
- **MACT backlog:** ~10.5 lakh motor-accident claims worth ₹80,455 cr pending (May 2024); average 3.6 years to resolve.
- **RuPay/Jan Dhan cards carry free ₹1–2 lakh accident insurance — 41.29 crore cards issued (Aug 2026)**, yet only ~11,024 claims had ever been received by June 2021 (PMJDY data). Condition: one card transaction in the 90 days before the accident; intimation within 90 days.
- **Every motor policy includes mandatory ₹15 lakh Compulsory Personal Accident (CPA) cover for the owner-driver** — families of two-wheeler riders killed on their own bikes routinely don't know.
- **Commuting accidents:** ESI Act s.51E deems commuting injuries employment injuries (dependants' benefit = 90% of wage, monthly). The Supreme Court (July 2025, 2025 INSC 904) extended the commuting logic to the Employees' Compensation Act.
- **Limitation trap:** MV Act s.166(3) (6-month limit for MACT claims, in force since 1 Apr 2022) — under constitutional challenge; SC interim order (4 Nov 2025, *Bhagirathi Dash v. UoI*) says don't dismiss as time-barred meanwhile. Families and even some lawyers are confused about this.
- **New schemes families don't know about yet:** Cashless Treatment Scheme 2025 → **PM RAHAT (Feb 2026)**: ₹1.5 lakh cashless treatment for 7 days if hospitalised within 24 h.

### Why nobody has solved it (the "too complicated" part)
Entitlements are split across **MoRTH, NHA, GIC/insurers, NPCI, banks, ESIC, Labour Commissioners, MACT courts, SDMs, DLSAs and state governments**. Each has its own rules, **mutual exclusions** (ESI vs. EC Act), **set-offs** (hit-and-run payout is refundable if the vehicle is later traced and a MACT award is made), proofs (passbook debits, card-transaction logs, DL validity) and deadlines (90 days, 6 months…). Doing this well needs deep legal + financial research — which is exactly the moat.

### The academic framing (for the pitch)
- **Administrative burden** (Moynihan, Herd & Harvey, 2015; *Administrative Burden*, 2018): people forgo benefits because of **learning costs** (not knowing), **compliance costs** (documents/forms) and **psychological costs** (grief, stigma). Our agent attacks all three: discovery, paperwork, and a calm guided flow.
- **Why not "just ask an LLM"**: Stanford RegLab (2024) found leading legal AI tools hallucinate **17–33%** of the time (GPT-4: 43%). Georgetown Beeck Center's *AI-Powered Rules as Code* (Mar 2025) found LLMs can help translate benefit policy but **need structure and human oversight** for complex logic. → Our design: **LLMs for language and documents, deterministic rules-as-code for eligibility and money, a human approves every action.** That is our reliability + responsible-AI story.

### Existing alternatives (the differentiation table)
| Option | What it does | Gap |
|---|---|---|
| Lawyers / claim touts | MACT filing | Paid, often a cut of the award; ignore insurance/scheme entitlements; slow |
| **Crashfree India — AASHA + MACT calculator** | Bilingual (EN/HI) web chatbot: legal rights, compensation routes (hit-and-run, MACT), PM RAHAT hospital finder, callback; plus Sarla Verma/Pranay Sethi calculator; hospital legal helpdesks | Guidance via Q&A; no evidence it reads documents, finds insurance/scheme cover (PMSBY, PMJJBY, RuPay, CPA, gig-platform), prepares forms, or tracks deadlines. **Complementary — a potential partner, not a blocker** |
| Haqdarshak, myScheme | General scheme discovery (human agents / portal) | Not event-triggered, no legal claims, doesn't read your documents, doesn't execute claims |
| iRAD / eDAR, NHA TMS | Police/hospital back-office | Not built for the family |
| Insurer apps / blogs | One product each, generic how-tos | Fragmented; no cross-institution plan or deadlines |
| **Ours** | **One crash → every entitlement found from the family's own documents → plan with deadlines → pre-filled forms → follow-ups, with a human approving each step** | — |

---

## 4. Track decision: **Agentic AI**

- The product *is* an agent: it reasons over a situation, plans a multi-step, multi-institution workflow, uses tools (document vision, rules engine, compensation calculator, PDF form filler, scheduler) and completes real work — with explicit human approval gates. That is word-for-word the track's evaluation focus (usefulness, orchestration, reliability, human control).
- Most Agentic AI entries will be generic (research/email/coding/support bots, brand builders for the title sponsor). A high-stakes, research-grounded agent with deterministic guardrails stands out in that field, both for the track award and the overall leaderboard.
- Fallback: the FAQ allows changing tracks before submission. **Open Innovation** (Safety & trust / Civic tech / Finance) fits naturally if needed.

---

## 5. Product concept (working name: **AfterCrash**)

**User:** the family of a road-crash victim (death or serious injury) — often low-income, Hindi-speaking, grieving. **Secondary:** DLSA paralegal volunteers, hospital social workers, NGOs (the SC already makes DLSAs responsible for helping unclaimed hit-and-run victims → a real institutional channel).

**Promise:** "Tell us what happened. Show us whatever papers you have. We'll tell you everything your family is legally owed, prove it from your own documents, and prepare every form — you approve every step."

### Agent pipeline (shown live in an "agent trace" panel)
1. **Intake agent** — chat or voice (Hindi/English). Adaptive: it asks only what the rules engine is missing ("Was he riding his own vehicle?").
2. **Document agent (vision)** — reads FIR/DAR, bank passbook/statement, motor policy, death certificate, hospital bill → typed facts with confidence + the exact source snippet.
   *Hidden-coverage discovery:* ₹20/yr debit = PMSBY; ₹436 = PMJJBY; a card/UPI transaction within 90 days = RuPay cover live; "Owner-Driver PA ₹15,00,000" on the bike policy = CPA.
3. **Entitlement engine (deterministic tool, rules-as-code)** — each rule has a citation, an amount, a deadline, the required documents and exclusions. Output: Eligible / Likely / Needs info / Not eligible.
4. **Planner agent** — builds a dependency-ordered claim plan sorted by deadline, deduplicates documents ("get 6 attested FIR copies — 5 claims need it"), and names the office for each claim.
5. **Drafting agent** — fills official PDFs (PMSBY claim form, RuPay claim form, hit-and-run Form I) and drafts letters (DLSA free legal-aid request, insurer intimation).
6. **Verifier agent** — re-checks every rupee and date in drafts against facts and rules; blocks on mismatch; flags low-confidence fields.
7. **Human approval gate + audit log** — nothing is sent or submitted automatically.
8. **Follow-up automation (n8n)** — deadline reminders and escalation drafts (insurer → Bima Bharosa/Ombudsman; DLSA).

### MVP scope (for ~18 build hours)
- 7 national entitlements: hit-and-run scheme · PM RAHAT cashless · MACT (no-fault s.164 + estimator) · CPA ₹15 lakh · PMSBY · PMJJBY · RuPay/PMJDY. ESIC/EC commuting as "likely — verify".
- 3 document types: FIR, bank passbook/statement, motor policy.
- 3 pre-filled forms + 1 letter.
- Hindi + English UI. Deployed on Vercel.
- Unit tests on the rules engine (reliability evidence).

### Demo story (3 min)
Sunita, 31, Lucknow. Her husband Ramesh, 34, was killed by an unidentified truck while riding his own bike to work. The family's belief: "The truck ran away — nothing can be done." She uploads the Hindi FIR, a passbook photo and the bike policy (or a Parivahan screenshot). The agent sorts results into three honest buckets:
- **Confirmed from documents:** hit-and-run ₹2 L · CPA ₹15 L (policy active on the date + he was the owner-driver; DL validity to confirm) · PMSBY ₹2 L ("PMSBY premium" ₹20 debit) · RuPay ₹2 L (card spend 12 days before the crash).
- **Possible — verify:** ESIC/EC commuting claim (needs employer details).
- **Not eligible (and why):** MACT against an insurer (vehicle untraced; hit-and-run payout is refundable if it's traced later).
Up to ~₹21 lakh the family thought didn't exist, with a deadline-ordered plan, pre-filled forms, and a citation for every figure. Sunita approves; reminders get scheduled. A second sample case (uninsured bike, no PMSBY) must show a *small* result. That honesty is the credibility moment.
(All demo documents must be synthetic and clearly marked SAMPLE.)

### Responsible design (10 pts — earn every one)
- Eligibility and money come from deterministic rules with citations; the LLM never invents amounts.
- Human approval for every outbound action; full audit trail; "information, not legal advice" with a one-tap handoff to **NALSA legal aid (15100)**.
- Privacy: process documents in-session, no storage by default, **mask Aadhaar numbers** automatically, explicit consent screen.
- Accessibility: Hindi, voice input, large-type, low-bandwidth mode.
- Anti-exploitation: warns families they never need to sign over a share of their compensation to anyone to get these benefits.

### Primary evidence to collect tonight (User insight — 15 pts)
- A 6-question Google Form to family/college/WhatsApp groups: "Has anyone in your family been in a road crash in the last 5 years? Did you claim from: insurance / PMSBY / RuPay / MACT / hit-and-run? Did you know these existed? What stopped you? Did anyone ask for a commission?" Even 30–50 **real** responses beats every team citing only news.
- 2–3 short calls (someone who went through MACT, an insurance agent/bank staff, a lawyer or DLSA volunteer). Report honestly — no fabricated data.

---

## 7. Round 2 — stress test (API, users, market, judge critique, documents, alternatives)

### 7.1 Zero-cost stack (₹0, no credit card anywhere) — supersedes the round-2 "paid tier" advice
Hard constraint from the team: **no spending at all, including deployment.** Everything below is free and needs no card.

| Need | Free choice | Free limits (verify on signup) | Why |
|---|---|---|---|
| Hosting + API routes | **Vercel Hobby** (`*.vercel.app`) | 1M function invocations, 100 GB bandwidth, functions up to 300 s; non-commercial use only (a hackathon project qualifies) | No card; holds the AI key server-side |
| Main LLM (text) | **Groq free tier** — `openai/gpt-oss-120b`, fallback `gpt-oss-20b` / `qwen3` | ~30 req/min, 1,000 req/day, ~8k tokens/min, ~200k tokens/day *per model* | No card; **contractually doesn't train on inputs/outputs, no retention by default** |
| Backup LLM | Gemini free tier (AI Studio) / OpenRouter free models | Gemini: Flash-only, ~10 req/min; OpenRouter: 50 req/day | No card. Gemini free **may train on prompts**, so it only ever receives anonymised text, never images |
| Document reading (OCR) | **Tesseract.js in the browser** (`eng` + `hin`) | Unlimited (runs on the user's device) | Documents never leave the phone |
| Passbook / policy parsing | Our own deterministic parsers (regex + rules) | — | "PMSBY premium ₹20", card/UPI dates, "CPA ₹15,00,000" need no AI |
| Voice input (Hindi) | Browser Web Speech API, or Groq-hosted Whisper (free tier) | — | Free |
| PDFs (filled forms, letters) | `pdf-lib` in the browser | — | Free |
| Reminders / sharing | `.ics` calendar file + Google Calendar "add event" link + WhatsApp `wa.me` share link | — | No calendar or WhatsApp API needed |
| Storage | None — browser IndexedDB only | — | Free, and a privacy feature |
| Repo / video / survey | GitHub · QuickTime or OBS · Google Forms | — | Free |
| Domain | `aftercrash.vercel.app` (the .xyz partner domain is optional) | — | Free |

Dropped: paid Gemini tier and the AI Pro cloud credit (both need billing/card setup), Cerebras (now needs a card), n8n cloud (paid), GitHub Models (reportedly retired Jul 2026).

**Why this is *better* for the rubric, not just cheaper (responsible design):** "Your documents never leave your phone. Reading happens on your device; names, phone, Aadhaar and account numbers are masked on the device; only anonymised text reaches an AI provider that is contractually barred from training on it." That's a stronger privacy story than "we pay for an API".

**Staying inside free limits:**
- Use the LLM for only ~2 calls per case: (1) turn the anonymised FIR narrative + the family's answers into structured facts (JSON schema), (2) draft letters / plain-Hindi explanations. Eligibility, amounts and deadlines are pure code. That's ~5–7k tokens per case, roughly 30 cases/day per Groq model and ~100/day across three models — plenty for judging.
- A provider router: Groq model A → Groq model B → Gemini (anonymised text only) → **no-AI mode** (the family confirms the extracted facts by hand; rules still run).
- Cache by input hash: re-running the sample documents costs 0 tokens and is instant (labelled "cached result").
- Per-IP rate limit on the API route.
- Every OCR'd fact goes on a **"We read this — is it right?" confirmation screen**. That fixes Tesseract's weak Hindi accuracy and is also human control.

### 7.2 "Normal people don't have API keys"
They never need one. Our free Groq key lives in a Vercel environment variable on the server, never in the browser — the same way every AI app works. If quotas run out, the app degrades to no-AI mode instead of breaking.
At scale (pitch "future plan"): free to families, never a percentage of compensation. Funded by CSR/grants (road-safety CSR, the way CARS24 funds Crashfree India), B2G (State Legal Services Authorities, State Road Safety Councils that run PM RAHAT), or gig platforms (Code on Social Security in force since 21 Nov 2025; e.g., Zomato's ₹10 L accident cover needs FIR + documents too).

### 7.3 Is the niche large enough?
- **Every year (official):** 4.8 L crashes · 1.73 L deaths · 4.63 L injured (MoRTH 2023). Real numbers are higher: deaths under-reported ~40–80% (GBD / national burden estimates) and injury crashes **15–20× under-reported** (IIT Delhi TRIPP). Each death hits a household of 4–5 people.
- **Stuck right now:** ~10.46 L families in pending MACT cases (₹80,455 cr). Money **already awarded but sitting unclaimed** in tribunals: ₹282 cr (Gujarat), ₹459 cr (Bombay), ₹361 cr (Goa).
- **Insurance side:** PMSBY has paid **1.57 L claims in 10 years (~16k/yr)** against 51 cr cumulative enrolments, while India records **4.44 L accidental deaths a year** (NCRB ADSI 2023). Only **14% of low-income crash households got any insurance compensation** (World Bank).
- Over five years that's **tens of lakhs of households**: niche (nobody serves them well) but not small.
- **The real weakness isn't market size, it's frequency and discovery:** a crash is a once-in-a-lifetime event, and grieving low-income families don't search the app store. **Fix:** distribute through first-contact institutions — police (the Form II rights notice every victim must get within 10 days could carry a QR code), PM RAHAT hospitals, DLSA paralegals, Crashfree-style trauma-centre helpdesks, gig platforms. For those caseworkers it's a **daily** tool. Build the family flow; show a simple caseworker case list as a stretch goal or a slide.
- The rubric gives **0 points to business model**. Sellability matters only for the "future plan" and judge Q&A.

### 7.4 Judge critique — contradictions and fixes
| # | What a judge will say | Fix |
|---|---|---|
| 1 | "Crashfree India's AASHA already does this." | Show AASHA in our comparison table. Position: *AASHA tells you your rights; AfterCrash finds the money in your own papers and does the paperwork.* Their own report says victims need "a functional support system" to replace commission-based middlemen — that's us. |
| 2 | "Your 0.3% stat is cherry-picked." | Use the fair base: <1% (FY23) → ~12% (FY24) even after Supreme Court orders. |
| 3 | "₹21 lakh is an inflated demo." | Three buckets (Confirmed / Verify / Not eligible + reason). ~54% of vehicles are uninsured; CPA needs owner-driver + valid DL + active policy; PMSBY needs active enrolment; hit-and-run payout is refundable if the vehicle is traced; ESIC and EC Act are mutually exclusive. Show a second case with a small result. |
| 4 | "This is a form wizard, not an agent." | Visible trace: documents → facts with source snippets → adaptive questions → plan with dependencies and deadlines → verifier blocks bad drafts → human approval → follow-ups. The LLM is needed for messy Hindi FIRs, passbook photos and free-text accounts. |
| 5 | "LLMs hallucinate legal facts." | Rules-as-code with citations; the LLM never computes money. An **eval harness of ~20 synthetic cases with expected outputs**, pass rate shown in README and video. |
| 6 | "Families won't upload FIRs and passbooks to a random site." | On-device OCR, documents never uploaded, on-device masking of names/Aadhaar/account numbers, only anonymised text to a no-training provider (Groq), nothing stored, caseworker-assisted mode, open source. |
| 7 | "How will a grieving family find this?" | Institution-led distribution (§7.3). |
| 8 | "Laws change." | Every rule has a source and a "last verified" date in versioned JSON. Roadmap: an n8n job watches PIB/Gazette feeds and flags rules for human review. |
| 9 | "States differ." | MVP covers national entitlements only, and we say so. |
| 10 | "Your user insight is all secondary." | An **awareness survey** doesn't need crash victims ("Did you know your Jan Dhan RuPay card has ₹2 L accident cover?"). Plus 2–3 interviews. Crashfree notes no victim-side study exists yet, so even a small real survey is a contribution. |
| 11 | "Too much for 20 hours." | Cut to 5 entitlements, 3 document types, 2 forms, 1 letter. |
| 12 | "Is this legal advice?" | "Information, not legal advice"; one-tap handoff to NALSA 15100 / DLSA; a human approves and submits everything. |
| 13 | "Free API tier = training on victims' data + rate limits." | Only anonymised text leaves the device; primary provider (Groq) contractually doesn't train; fallback router + cache + no-AI mode (§7.1). |
| 14 | "Low-literacy users can't use a web app." | Hindi, voice input, a WhatsApp-shareable plan, caseworker mode. |

### 7.5 How it works with no bank, insurance or police APIs
No integrations are needed. Families already have, or can get free, every input:
- **FIR:** a free copy is a legal right for the informant or victim, including legal heirs (BNSS s.173(2)). Police must also give the **Form II rights notice within 10 days** and a **copy of the DAR (Form VII)** (CMV Rules 2022).
- **Bank passbook/statement:** a phone photo or net-banking download. PMSBY shows as a "PMSBY premium" ₹20 debit; card/UPI lines prove the 90-day RuPay condition.
- **Vehicle insurance:** if the policy is lost, **mParivahan / Parivahan "Know your vehicle details" or IIB V-Seva** shows insurer + policy number free from the registration number — the family uploads a screenshot.
- **Gig-platform cover:** screenshot of the partner app's insurance section.

Flow: answer 5–6 questions → upload what you have (optional) → entitlements in three buckets → plan with deadlines → download pre-filled forms and letters → the family prints, signs and submits at the bank, insurer, SDM or DLSA → reminders.
Roadmap only (needs registration or licences): DigiLocker requester API, Account Aggregator for consented bank statements, eDAR victim access.

**Demo documents:** we make synthetic ones — an FIR in CCTNS-style layout (Hindi + English), a passbook page, a two-wheeler policy schedule, a gig-app screenshot. Fictional names, a "SAMPLE — SYNTHETIC" watermark, no real government emblems or seals, no real Aadhaar/PAN numbers. Generate them as HTML → PNG/PDF, with 2–3 variants (hit-and-run vs traced vehicle; insured vs uninsured; enrolled vs not).

### 7.6 Alternatives checked in round 2 (because AASHA was missed in round 1)
| Alternative | Why it's not better |
|---|---|
| Cyber-fraud money-recovery navigator (₹22,495 cr lost, 24 L+ complaints in 2025) | The government is actively building it (MHA Money Restoration Module, SOP refunds up to ₹50k without a court order, Supreme Court directions to RBI). "Scam" projects are among the most common hackathon themes. Most frauds are customer-authorised payments, so bank zero-liability rules rarely apply. |
| Airline delay/cancellation compensation (DGCA CAR; IndiGo Dec 2025: ~4,500 cancellations, 10 L+ passengers) | "AirHelp for India" — low originality, lower social impact, needs flight-status data. |
| Worker salary / minimum-wage checker (new labour codes) | Big population, but state-by-state wage tables and still-settling code rules make it unreliable in 20 hours; employer-side tools already exist. |
**Verdict:** the repositioned AfterCrash still scores highest. It has the strongest evidence and the clearest demo, runs at **₹0 with no credit card** (§7.1), and needs no bank, insurance or police APIs.

---

## 8. Sources
- WCC Launchpad 30 official page — https://wecodecoders.in/events/wcc-launchpad-30
- Unstop listing — https://unstop.com/hackathons/wcc-launchpad-30-wecodecoders-1751873
- StartupGrantsIndia summary — https://www.startupgrantsindia.com/competitions/wcc-launchpad-30
- Devpost, "How to win a hackathon: advice from 5 judges" — https://info.devpost.com/blog/hackathon-judging-tips
- Agentic AI hackathon 2026 winner patterns — https://dev.to/shaam_ai/agentic-ai-hackathon-2026-code-for-a-billion-wins-18ma
- Ray Deck, "Lessons from winning five hackathons" — https://sustained.substack.com/p/lessons-from-winning-five-hackathons
- MoRTH Road Accidents in India 2023 (via Business Standard) — https://www.business-standard.com/india-news/india-road-accidents-deaths-injuries-report-road-highway-ministry-nitin-gadkari-125082801527_1.html
- SC hit-and-run directions, S. Rajaseekaran v UoI — https://www.verdictum.in/court-updates/supreme-court/s-rajaseekaran-v-union-of-india-ors-2024-insc-37-compensation-in-hit-run-accidents-1515043
- The Wire, "For India's road accident survivors, legal compensation is elusive" (2026) — https://m.thewire.in/article/government/for-indias-road-accident-survivors-legal-compensation-is-elusive
- World Bank & SaveLIFE, *Traffic Crash Injuries and Disabilities: The Burden on Indian Society* (2021) — https://www.worldbank.org/en/country/india/publication/traffic-crash-injuries-and-disabilities-the-burden-on-indian-society
- World Bank blog, "How do the poor cope with road crashes in India?" — https://blogs.worldbank.org/en/endpovertyinsouthasia/how-do-poor-cope-road-crashes-india
- PM RAHAT (2026) — https://www.newsonair.gov.in/government-announces-launch-of-pm-rahat-scheme-for-cashless-treatment-of-up-to-rs-1-lakh-50-thousand-for-road-accident-victims
- Cashless Treatment Scheme 2025 — https://www.angelone.in/news/government-notifies-cashless-scheme-for-road-accident-victims
- SC interim order on s.166(3) limitation (Nov 2025) — https://www.livelaw.in/top-stories/no-motor-accident-claim-should-be-dismissed-as-time-barred-supreme-court-interim-order-s1663-mv-act-309095
- RuPay/PMJDY claim rules — https://www.drishtiias.com/daily-updates/daily-news-analysis/insurance-claims-under-pmjdy · https://pmjdy.gov.in/files/QuickLinks/Accidental-Insurance.pdf
- PMJDY 2025–26 figures (PIB) — https://www.pib.gov.in/PressReleasePage.aspx?PRID=2161401&reg=48&lang=2
- CPA ₹15 lakh owner-driver cover — https://www.zurichkotak.com/knowledge-center/two-wheeler-insurance/know-about-15-lakh-accident-cover
- ESIC commuting (s.51E) & SC 2025 EC Act ruling — https://api.sci.gov.in/supremecourt/2012/11949/11949_2012_5_1501_62795_Judgement_29-Jul-2025.pdf
- iRAD/eDAR — https://www.etvbharat.com/en/!bharat/india-digital-push-to-save-lives-how-irad-and-edar-aim-to-transform-road-safety-enn25090604994
- Moynihan, Herd & Harvey (2015), Administrative Burden — https://www.researchgate.net/publication/273039815_Administrative_Burden_Learning_Psychological_and_Compliance_Costs_in_Citizen-State_Interactions
- Stanford RegLab, "Hallucination-Free?" (2024) — https://arxiv.org/pdf/2405.20362
- Beeck Center, AI-Powered Rules as Code (2025) — https://beeckcenter.georgetown.edu/report/ai-powered-rules-as-code-experiments-with-public-benefits-policy/
- Haqdarshak (adjacent incumbent) — https://acumen.org/case-studies/haqdarshak/
- Rejected-idea prior art: ClaimShield — https://github.com/rgokulkrishna44-debug/claimshield · Anvaya — https://github.com/Vedansh-Gupta-VG/Anvaya · NyayaSetu — https://github.com/rajukumar-tech/nyayasetu · UnClaimedX — https://unclaimedx.com/
- Crashfree India, *Justice Unserved* research brief (Jan 2026) — https://crashfreeindia.org/documents/justice-unserved-crashfree-india.pdf · AASHA — https://crashfreeindia.org/aasha · Calculator — https://crashfreeindia.org/compensation-calculator
- PMSBY/PMJJBY 10-year figures (PIB) — https://www.pib.gov.in/PressReleasePage.aspx?PRID=2127981&reg=48&lang=2
- NCRB ADSI 2023 (4,44,104 accidental deaths) — https://www.policyedge.in/p/ncrb-report-accidental-deaths-and
- Under-reporting of road deaths and injuries — https://www.indiaspend.com/data-gaps/with-single-data-source-india-tends-to-underreport-road-crash-deaths-781261 · https://tripc.iitd.ac.in/assets/publication/RSI_2023_web.pdf
- Uninsured vehicles (~54%) — https://thenewsmill.com/2026/08/nearly-50-cars-and-two-wheelers-on-road-lack-insurance-in-india/
- Free FIR copy, BNSS s.173(2) — https://www.livelaw.in/know-the-law/victim-right-to-free-fir-copy-under-bnss-280641 · Victim rights Form II / DAR Form VII — https://advocatetanmoy.com/procedure-for-investigation-of-road-accident-cases-by-the-police-01-04-2022/
- Insurance lookup by vehicle number (Parivahan / IIB) — https://www.insurancedekho.com/car-insurance/news/check-car-insurance-policy-status-easily.htm
- PMSBY passbook debit — https://www.jansuraksha.gov.in/Files/PMSBY/ENGLISH/FAQ-old.pdf
- Vercel Hobby limits — https://vercel.com/docs/limits · Fluid compute durations — https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute
- Groq free tier models/limits — https://klymentiev.com/blog/groq-pricing · Groq data policy — https://console.groq.com/docs/your-data · Free LLM APIs compared (OpenRouter, Sep 2026) — https://openrouter.ai/blog/tutorials/free-llm-apis-compared/ · Cerebras now needs a card — https://toolfreebie.com/cerebras-free-api/
- Gemini API free tier vs paid, data use — https://ampm-aiops.com/en/guides/gemini-free-tier-data-tradeoff-2026/ · Limits — https://pecollective.com/tools/gemini-free-tier-guide/ · Pricing — https://costgoat.com/pricing/gemini-api · AI Pro $10 Cloud credit — https://blog.google/innovation-and-ai/technology/developers-tools/gdp-premium-ai-pro-ultra/
- Code on Social Security in force (gig workers) — https://www.fisherphillips.com/en/insights/insights/indias-new-labor-codes-extend-social-security-coverage-to-gig-workers · Zomato partner cover — https://www.oneassure.in/insurance/health-insurance-guides/insurance-for-gig-workers-zomato-swiggy-plans
- Round-2 alternatives: cyber fraud 2025 — https://newskarnataka.com/india/over-24-lakh-cyber-fraud-complaints-reported-in-2025/21022026 · SC mule-account directions — https://www.thestatesman.com/india/freeze-faster-restore-money-sooner-sc-tightens-digital-arrest-scam-response-gives-rbi-4-weeks-for-mule-account-sop-1503624478.html · IndiGo 2025 crisis — https://en.wikipedia.org/wiki/2025_IndiGo_scheduling_crisis
- Health-insurance context: IRDAI FY25 rejections — https://www.businessupturn.com/sectors/health/indias-health-insurance-claim-rejection-crisis-rs-30000-crore-denied-in-one-year-and-irdai-is-finally-cracking-down · LocalCircles — https://www.businesstoday.in/personal-finance/insurance/story/insurance-claims-over-50-health-cover-claims-faced-rejection-or-partial-approval-says-survey-459394-2025-01-02
- Unclaimed assets context — https://the420.in/rbi-udgam-unclaimed-deposits-72454-crore-dea-fund-india/
