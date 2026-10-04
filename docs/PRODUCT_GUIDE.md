# Rahbar (रहबर) — Product guide

**Rahbar** means "the one who shows the way." After a road accident in India, Rahbar reads the family's own papers on their phone, finds every rupee they are legally owed (insurance, government schemes, compensation, even the deceased's own savings), plans the claims by deadline, writes the letters, and follows up when institutions are late. The family approves every step.

**Who it's for:** families (often grieving, often Hindi-speaking, often low-income), and the people who help them: legal-aid paralegals (DLSA), hospital helpdesks, NGOs, gig-worker unions.

**One principle runs through everything:** *AI handles language. Code handles law and money. People approve actions.*

---

## 1. Site map

| Page | What it's for |
|---|---|
| `/` Home | Explains the problem and shows the product working on a real (synthetic) passbook |
| `/case/story` → `/case/papers` → `/case/check` → `/case/owed` → `/case/plan` → `/case/track` | The six-step case journey (each is its own page; Back and refresh work) |
| `/offer` | Standalone settlement-offer checker for anyone holding an insurer's offer |
| `/rules` | Every rule, its legal source, statutory clock, escalation ladder, and the changelog |
| `/developers` | Public API (evaluate, compensation, rules) with live "Try it" |
| `/evals` | Live test harness judges can run in the browser |

The **header** on every page has: the Rahbar logo (→ home), **Offer check / Rules / API / Evals** links (a ☰ menu on phones), and the **EN / हिं** language switch (one compact button on phones). The whole app is bilingual.

---

## 2. Page by page — every button

### Home (`/`)
| Element | What it does |
|---|---|
| **Start a case** | Opens `/case/story` |
| **Try a sample case** | Loads the "Sunita" sample (hit-and-run, synthetic papers) and opens `/case/papers` |
| Hero passbook image | A real sample passbook with two lines highlighted: a ₹20 "PMSBY" debit → ₹2 lakh accident cover; a RuPay card swipe 12 days before the accident → ₹2 lakh card cover. This is the product's core idea in one picture |
| Evidence list (205 · 70% · 90% · 69%) | Each number links to its source (Supreme Court, World Bank, Crashfree India, BMC) |
| How it works | The 5-stage pipeline: read papers → hide identity → apply the law → draft letters → you approve |
| "Claims take months" list | Links to Offer check, Track & escalate, Encrypted vault, API |
| Sample case cards (3) | Open each sample: **hit-and-run** (₹21 lakh found), **injured pillion rider** (small, honest result), **red-team** (an FIR with a hidden attack on the AI) |
| Footer | Links + tap-to-call **NALSA 15100** (free legal aid) and **Tele-MANAS 14416** (mental health) |

### Step 1 — Your story (`/case/story`)
| Element | What it does |
|---|---|
| "Did this happen in the last few days?" | Expands the **First 48 hours** guide: PM RAHAT cashless treatment, free FIR copy (BNSS s.173(2)), post-mortem copies, photos and witnesses, *never sign blank papers or give away a share of compensation*, Form II rights notice, Good Samaritan protection and ₹25,000 Rah-Veer reward |
| Name of the person / Your name | Kept only on this device; used to mask names before AI and to fill letters back in on the device |
| Relation | Wife, husband, mother… or **caseworker/paralegal** (the app is built for helpers too) |
| What happened? + **Speak** | Free text, or speak in Hindi/English (browser speech recognition) |
| **Next: add papers** | Goes to step 2 |
| Sample cards | Load a synthetic case |

### Step 2 — Your papers (`/case/papers`)
| Element | What it does |
|---|---|
| **Choose photos** / **Camera** / drag-and-drop | Adds photos of the FIR, passbook or statement, and vehicle policy. Nothing is uploaded |
| Trash icon | Removes a photo |
| **Read my papers** | Runs the agent pipeline (below) and opens step 3 |
| **Auto-play (judge mode)** (samples only) | Runs the entire case in ~20 s: reads the papers, confirms facts, answers the questions with the sample family's scripted answers, and lands on "What you're owed" |
| No papers? **Continue with questions** | Skips to step 3; the app works from answers alone |

**What happens under the hood when you press Read my papers** (watch it live in *Behind the scenes*):
1. **Reader** — Tesseract.js OCR runs *in the browser* (English + Hindi). It erases ruled table lines first and rebuilds table rows, so passbooks read correctly (92% confidence on the samples).
2. **Parser** (no AI) — finds the accident date, "unknown vehicle", death, ₹20 PMSBY / ₹436 PMJJBY debits, the last card swipe, account opening date, nominee and closing balance, plus policy period, ₹15 lakh owner-driver cover and the insured's name. Every fact keeps the exact line and its position on the image.
3. **Shield** — masks names, Aadhaar (only if it passes UIDAI's Verhoeff checksum), PAN, phone, account, IFSC and vehicle numbers *on the device*.
4. **Guard** — checks the text for hidden instructions to the AI, using on-device rules plus Meta's Llama Prompt Guard model. Suspicious lines are quarantined.
5. **Extractor** — the AI (Groq `gpt-oss-120b`) reads the anonymised FIR and the family's words into a fixed, typed form (zod schema). It cannot output money or eligibility. If the AI is down, the app falls back to asking you.

### Step 3 — Check & fill gaps (`/case/check`)
| Element | What it does |
|---|---|
| AI summary | Two-line plain summary; real names are filled back in on the device |
| Red warning box (if any) | "We found hidden instructions to the AI inside a document — they were ignored", showing the struck-out lines |
| Fact list | Every fact with its source badge: **From papers** / **AI read** / **Your answer** |
| Quote under a fact | Opens the document with that exact line **highlighted** |
| **Edit** | Change any fact; a human answer always wins over the AI and the documents |
| **See exactly what was sent to the AI** | The privacy lens: shows the anonymised text with every masked token highlighted, plus counts |
| **Yes, this is right** | Human confirmation; until then AI-read facts don't count as evidence |
| Questions with **unlocks: …** chips | The app asks only what unlocks the most money or the nearest deadline (value-of-information ranking), and says what each answer unlocks |
| **I don't know** | Skips a question; the claim stays "possible — needs checking" |
| **Show what we're owed** | Runs the rules engine and opens step 4 |

### Step 4 — What you're owed (`/case/owed`)
| Element | What it does |
|---|---|
| Green total | Money **confirmed** from the papers, plus "more possible" |
| Counts | confirmed / to check / not available |
| **Listen** | Reads the result aloud in Hindi or English |
| Claim cards (3 buckets) | **Confirmed from your papers**, **Possible — needs checking**, **Not available — and why**. Tap a card to see **Why** (each condition ✓/✗/? with its source), the **deadline** and days left, **where to apply**, **documents**, notes, **sources** and "rule last verified" |
| **Income evidence** card | Rebuilds monthly income from salary or payout credits in the passbook (tap a line to see it highlighted). Tribunals often assume minimum wage without payslips; this is proof |
| **Just compensation & offer check** (death cases) | Age, monthly income (pre-filled from the passbook), work type and family. Shows the head-by-head court formula (Sarla Verma, Pranay Sethi, Magma) with citations, and "every ₹1,000/month of proven income adds ≈ ₹X" |
| **Got an offer from the insurer?** | Enter the offer, the income they used, multiplier, future prospects and consortium count. You get a verdict (fair / low / far too low), each flaw with its rupee impact, and a **Copy**-able reply for a legal-aid lawyer |
| **Ask about your case** | Chat with the case agent. It calls the rules engine as tools (`listEntitlements`, `simulateWhatIf`, `getPlan`), so "What if police find the truck?" is answered by re-running the law, not guessing. Tool calls show as chips |
| Support card | Tap-to-call Tele-MANAS 14416, NALSA 15100, 112 |
| **Make the plan & letters** | Opens step 5 |

### Step 5 — Plan & letters (`/case/plan`)
| Element | What it does |
|---|---|
| Numbered claim list | Ordered **earliest deadline first**, with date, days left, the deadline rule, the office, and a **Google Calendar** link per claim |
| Papers to collect | De-duplicated across claims ("FIR × 6 copies, needed for 5 claims"), with where to get each one free |
| **Draft N letters** | For each confirmed claim: the AI drafts → a **second, independent model fact-checks it** against the case facts → one redraft if needed → the deterministic **verifier** checks every ₹ amount and date. Without AI, a fixed template is used |
| Letter chips | AI draft (model) or template · **Verified: N amounts, N dates** or **Blocked by verifier** · warnings (e.g. promising an outcome) |
| Approval checkbox | "I've read this letter and it's correct". Only approved letters go into the print packet; blocked letters can't be approved |
| **Print / save approved letters as PDF** | Prints the claim packet (correct Hindi rendering) |
| **Add all deadlines to my calendar** | Downloads a `.ics` file with 7-day and 1-day reminders |
| **Share the plan on WhatsApp** | Opens WhatsApp with the plan text |
| **QR handoff for a caseworker** | A QR code and link carrying the case *facts only* (no names or documents) in the link's `#fragment`, which browsers never send to a server |
| **Tamper-evident manifest** | SHA-256 fingerprint of every document and approved letter, a packet fingerprint, and its QR. Anyone can re-hash a file to prove nothing was altered |
| **Track the claims** | Opens step 6 |

### Step 6 — Follow up (`/case/track`)
| Element | What it does |
|---|---|
| **When the money is likely to arrive** | Timeline (weeks → years) of each claim's expected payout window, and how much could land within 90 days, so families can avoid high-interest loans |
| Stage menu per claim | Not filed yet / Filed / Paid / Rejected |
| Filed on (date) | Starts that institution's **legal clock** (e.g. insurer 30 days; hit-and-run 30+15+15; bank 15 days) and shows "due …" or "N days overdue", plus late-payment interest where the law gives it |
| **Next escalation** + **Draft the escalation** | Unlocks when the deadline passes; drafts a letter to the next level (e.g. insurer's grievance officer → Bima Bharosa / Ombudsman; bank → RBI Ombudsman; DAR not filed → RTI to police; → free DLSA lawyer), citing the rule and days of delay |
| **Encrypted case vault** | Name + passphrase → **Save on this device** or **Encrypted file** (AES-256-GCM, PBKDF2 310k). **Open a file** / **Unlock** restores a case on any device. Our server never sees it |

### Behind the scenes (right panel on desktop; the trace button with a step count on phones)
A live trace of every agent step: who ran (Reader, Parser, Shield, Guard, Extractor, Rules, Questioner, Planner, Drafter, Verifier, Human, Case Agent), what it did, the model used, time, tokens, and **cost ₹0**. **Hide / Show** remembers your choice.

### Other pages
- **`/offer`** — the compensation and offer checker on its own, for families, lawyers and paralegals who already have an offer.
- **`/rules`** — the rules registry: conditions (and which facts they read), statutory clock, escalation ladder, documents, citations, last-verified date, plus a **changelog** (e.g. "PM RAHAT replaces the 2025 scheme"). Machine-readable at `/api/v1/rules`.
- **`/developers`** — `POST /api/v1/evaluate` (facts → entitlements + plan), `POST /api/v1/compensation` (inputs → estimate + offer audit), `GET /api/v1/rules`, OpenAPI 3.1 spec, and **Try it live**. CORS on, rate-limited, stores nothing.
- **`/evals`** — 3 golden cases, 4 safety checks, 5 property-based invariants (**Run now** with 200–5,000 random cases each), and a **PII shield playground** to type into.

---

## 3. The x-factor — where it lives

### a. Workflow (agentic design)
- **A workflow of specialised agents with narrow contracts**, not one giant prompt: Reader → Parser → Shield → Guard → Extractor → (human confirms) → Questioner → Rules → Planner → Drafter → Critic → Verifier → (human approves) → Tracker. Each has typed inputs and outputs and reports to the trace.
- **Bounded agent loops where judgement is needed:** the case agent reasons with tools (`listEntitlements`, `simulateWhatIf`, `getPlan`, max 4 steps). The drafter runs a **reflection loop**: an independent model critiques, then one redraft.
- **Humans at the decision points:** confirming facts, answering questions, approving letters, sending anything. Nothing is filed automatically.
- **Value-of-information questioning:** the agent ranks unknown facts by rupees unlocked × deadline urgency, and asks 3 questions, not 40.
- **Graceful degradation:** model router (`gpt-oss-120b` → `gpt-oss-20b` → no-AI mode) plus response caching, so it never breaks on a free tier.

### b. Tools (free, no credit card)
On-device OCR (Tesseract.js + table-line removal + row rebuild) · deterministic document parsers · PII Shield with Verhoeff Aadhaar validation · Llama Prompt Guard · Vercel AI SDK with zod-typed outputs · Groq `gpt-oss-120b/20b` · rules engine · MACT formula engine · income-evidence builder · deadline planner · amount-and-date verifier · statutory clock and escalation engine · Web Crypto (AES-GCM vault, SHA-256 manifest) · RFC 5545 calendar · QR + lz-string · Web Speech (voice in, read-aloud out) · service worker (works offline) · public REST API + OpenAPI.

### c. Logic (why it's trustworthy)
- **Rules-as-code:** 10 entitlements, each with conditions, amount, deadline, documents, office, exclusions, citations and a verification date. True / false / unknown logic: a failed condition always means "not available", an unknown always means "possible" — **never a guess**.
- **Evidence-backed:** a claim is "confirmed" only when every fact behind it comes from a document or a human confirmation.
- **Court formulas implemented exactly:** Sarla Verma multipliers and deductions, Pranay Sethi future prospects and +10%/3-year conventional heads, Magma consortium per family member (hand-checked worked example in tests).
- **Statutory clocks:** IRDAI 30/45 days with interest at Bank Rate + 2%, 14-day grievances; RBI 15 days with Bank Rate + 4%; hit-and-run 30/15/15; police DAR 90 days; MV Act s.149 offer within 30 days.
- **Proven, not claimed:** 40 unit tests including property-based invariants over thousands of random cases (e.g. hit-and-run and MACT can never both be eligible; learning a fact never downgrades a confirmed claim), plus a 10-check **live AI evaluation**: 21/21 facts extracted correctly across Hindi, English, Hinglish and the red-team FIR.

### d. Creativity (what nobody else does)
- **Hidden cover in your own papers:** a ₹20 passbook debit, a card swipe 90 days back, a line in a bike policy become ₹2 lakh, ₹2 lakh and ₹15 lakh.
- **Evidence you can see:** tap a fact → the exact line lights up on the photo.
- **A live red-team demo:** an FIR that tries to hijack the AI, caught and shown to the user.
- **Settlement offer auditor:** turns a take-it-or-leave-it insurer offer into a line-by-line rebuttal.
- **Income from the passbook:** fights the minimum-wage default with the family's own bank trail.
- **Cash-flow timeline:** designed around the finding that 69% of families borrow while they wait.
- **Zero-database design:** OCR on device, case in the tab, encrypted vault, handoff in a URL fragment.
- **Tamper-evident packet:** genuine families can prove their papers weren't altered, at a time when courts have ordered police teams to investigate fake claims.
- **Judge mode:** a whole case end to end in 20 seconds.

---

## 4. Three-minute demo path
1. Home → point at the highlighted passbook (5 s).
2. **Try a sample case** → **Auto-play (judge mode)**; keep *Behind the scenes* visible: OCR, masking, Prompt Guard, AI extraction, ₹0 cost.
3. **What you're owed** → ₹21,00,000; open the owner-driver card → **Why** → tap the policy quote to show the highlight.
4. Scroll to the **offer check** → type ₹9,00,000 / ₹7,000 / multiplier 15 → "far too low, 32%" + reply.
5. **Ask**: "What if the police find the truck?" → tool chip `simulateWhatIf`.
6. **Plan & letters** → Draft → show the fact-checker and verifier chips → approve → manifest fingerprint.
7. **Follow up** → mark one claim Filed → show its legal clock and escalation; save to the encrypted vault.
8. End on the red-team sample: the hidden instruction struck out in red; the total stays ₹7 lakh, not ₹50 lakh.
