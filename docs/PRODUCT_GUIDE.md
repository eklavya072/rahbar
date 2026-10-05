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

The **header** on every page has: the Rahbar logo (→ home), **Offer check / Rules / API / Tests** links (a ☰ menu on phones), and the **EN / हिं** language switch (one compact button on phones). On the home page the header floats over the film and changes from dark to paper as light sections slide under it. The whole app is bilingual.

**Design language** (after the Meridian project): a dark "night road" surface for the story, warm ivory paper for the work, one brass accent for "the way forward". Fonts: Newsreader (serif headings and money), Schibsted Grotesk (hero), Public Sans (body), IBM Plex Mono (labels), Unbounded (wordmark), Noto Sans / Tiro Devanagari for Hindi. Motion is calm and purposeful: words rise from behind a mask, numbers count up, the progress bar is a road. Everything respects *reduce motion*.

**How every case page reads, for someone who has never seen it:**
- A **road** across the top (six segments and "2 of 6" on phones) shows where you are.
- One big question as the title, then one plain sentence saying what to do.
- **Importance is typographic:** money is set as figures (small raised ₹, lining numerals, the total rolls into place like a meter), deadlines are large numbers coloured by urgency (red within 14 days, amber within 60), and the single key phrase in a block gets a brass highlighter.
- **One main button** at the bottom. On phones it stays pinned within thumb reach; **← Back** sits beside it.
- Anything optional (asking the agent, income proof, court formula, fingerprints, the vault) sits in a **drawer with a plain name and a one-line reason**, closed until wanted.

---

## 2. Page by page — every button

### Home (`/`)
| Element | What it does |
|---|---|
| Entrance | The mark rises and "Rahbar" sets letter by letter with a brass line drawn like a road. Then two headlights appear far down that road, approach and flood the screen with warm light that clears to the film (skipped with *reduce motion*; never shown twice in a visit) |
| **The film (hero)** | A night road drawn live on a canvas and *scrubbed by scrolling*: rain and red tail-lights at night; street lamps switch on one by one, lane dashes turn brass and dawn rises. Each caption is lit by a headlight beam sweeping across it and blurs out of focus as you drive past: **After an accident, the way forward** (with **Start your case** / **Watch a sample case**) → **The money exists. Families never reach it** (205 · 70% · 90%, sourced) → **A ₹20 debit in a passbook can be ₹2 lakh of insurance** → **From a phone photo to a signed letter** (the 5-step pipeline) → **Let Rahbar show the way**. On phones the captions stack over a still dawn frame |
| **Three steps from papers to payment** | Each step beside the product's own screen animating itself; outline numerals fill with brass as you arrive and a highlighter sweeps the key phrase |
| **Safe to use on your hardest day** (dark, fits one screen) | A line from a fictional sample FIR is redacted live (names, account and vehicle become tokens), four short promises, and one line of proof: 21/21 facts read right in live AI tests, 40 automated tests, ₹0 cost. **Run the tests yourself** → `/evals` |
| **Three test cases you can play** | Fictional families and papers (no real people): a hit-and-run (₹21,00,000 found by the rules), an injured passenger (smaller, honest result), and an attack hidden in an FIR (₹7,00,000, not ₹50 lakh). Totals come from the deterministic rules engine and are checked by the golden tests |
| **Helping someone else?** | For paralegals, hospital helpdesks, NGOs and lawyers: Offer check, Rules, API |
| Close | "You don't have to do this *alone*." **Start your case** and tap-to-call **free legal aid 15100** |
| Footer | Links + tap-to-call **NALSA 15100** (free legal aid) and **Tele-MANAS 14416** (mental health) |

### Step 1 — Your story (`/case/story`)
| Element | What it does |
|---|---|
| "Did this happen in the last few days?" | Expands the **First 48 hours** guide: PM RAHAT cashless treatment, free FIR copy (BNSS s.173(2)), post-mortem copies, photos and witnesses, *never sign blank papers or give away a share of compensation*, Form II rights notice, Good Samaritan protection and ₹25,000 Rah-Veer reward |
| **Who are you to them?** | Big buttons: Wife, Husband, Mother, Father, Son, Daughter, **It happened to me**, **I'm helping a family** (the app is built for helpers too) |
| Name of the person / Your name | Kept only on this device; used to mask names before AI and to fill letters back in on the device. If it happened to you, only one name is asked |
| What happened? + **Speak instead** | Free text, or speak in Hindi/English (browser speech recognition) |
| **Next: your papers** | Goes to step 2 |
| **Just looking?** sample cards | Open a synthetic family's case |

### Step 2 — Your papers (`/case/papers`)
| Element | What it does |
|---|---|
| **What helps most** | Three tiles naming the papers that matter and why: police report (FIR), bank passbook page ("can show insurance you didn't know about"), vehicle policy ("often includes ₹15 lakh owner-driver cover") |
| **Take a photo** (phones) / **Choose photos** / drag-and-drop | Adds photos. Nothing is uploaded |
| Trash icon | Removes a photo |
| **Read my N papers** | Runs the agent pipeline (below) and opens step 3. While it runs, a **"Rahbar is working"** checklist ticks through the same pipeline in plain words: reading the photos on this phone → hiding names and numbers → checking for hidden tricks → understanding the papers → matching against 10 kinds of claims |
| **Auto-play** (samples only, in the gold banner) | Runs the entire case in ~20 s: reads the papers, confirms facts, answers the questions with the sample family's scripted answers, and lands on "What you're owed". |
| No papers? **Answer questions instead** | Skips to step 3; the app works from answers alone |

**What happens under the hood when you press Read my papers** (watch it live in *Behind the scenes*):
1. **Reader** — Tesseract.js OCR runs *in the browser* (English + Hindi). It erases ruled table lines first and rebuilds table rows, so passbooks read correctly (92% confidence on the samples).
2. **Parser** (no AI) — finds the accident date, "unknown vehicle", death, ₹20 PMSBY / ₹436 PMJJBY debits, the last card swipe, account opening date, nominee and closing balance, plus policy period, ₹15 lakh owner-driver cover and the insured's name. Every fact keeps the exact line and its position on the image.
3. **Shield** — masks names, Aadhaar (only if it passes UIDAI's Verhoeff checksum), PAN, phone, account, IFSC and vehicle numbers *on the device*.
4. **Guard** — checks the text for hidden instructions to the AI, using on-device rules plus Meta's Llama Prompt Guard model. Suspicious lines are quarantined.
5. **Extractor** — the AI (Groq `gpt-oss-120b`) reads the anonymised FIR and the family's words into a fixed, typed form (zod schema). It cannot output money or eligibility. If the AI is down, the app falls back to asking you.

### Step 3 — Check & fill gaps (`/case/check`)
| Element | What it does |
|---|---|
| Title | "Is this right?" when papers were read; "Just a few questions" when not |
| AI summary | Two-line plain summary set as a quote; real names are filled back in on the device |
| Red warning box (if any) | "We found hidden instructions to the AI inside a document — they were ignored", showing the struck-out lines |
| Fact list (a receipt) | Every fact with its source badge: **From papers** / **AI read** / **Your answer**. The first six show; **Show all N things we read** opens the rest |
| Quote under a fact | Opens the document with that exact line **highlighted** |
| **Fix** | Change any fact; a human answer always wins over the AI and the documents |
| **What the AI actually saw** (drawer, "For peace of mind") | The privacy lens: shows the anonymised text with every masked token highlighted, plus counts |
| **Yes, this is right** | Human confirmation; until then AI-read facts don't count as evidence |
| **Found so far** | Running total that grows as you answer |
| One question at a time | The app asks only what unlocks the most money or the nearest deadline (value-of-information ranking). Big Yes/No or choice buttons, "about N left", and "Helps decide: …" naming the claims it affects |
| **I don't know — skip** | Skips a question; the claim stays "possible — needs checking" |
| **See what you're owed** | Runs the rules engine and opens step 4 |

### Step 4 — What you're owed (`/case/owed`)
| Element | What it does |
|---|---|
| Dark total panel | Money **confirmed** from the papers counts up in large serif figures, plus "more possible after one more check"; a brass rule draws beneath it |
| Counts | Ready to claim / To check / Not available |
| **Listen** | Reads the result aloud in Hindi or English |
| Claim cards | **Ready to claim**, **Needs one more check**, and a closed drawer **Not available — and why, so no one can mislead you**. Each card shows the amount, days left and "proved by your papers"; **Why & how** opens each condition ✓/✗/? with its source, the **deadline**, **where to apply**, **documents**, notes, **sources** and "rule last verified" |
| **Next: your plan & letters** | Opens step 5 |
| **More help (optional)** drawers | The four items below, closed until wanted |
| **Proof of income from the passbook** | Rebuilds monthly income from salary or payout credits in the passbook (tap a line to see it highlighted). Tribunals often assume minimum wage without payslips; this is proof |
| **Court compensation estimate & insurer offer check** (death cases) | Age, monthly income (pre-filled from the passbook), work type and family. Shows the head-by-head court formula (Sarla Verma, Pranay Sethi, Magma) with citations, and "every ₹1,000/month of proven income adds ≈ ₹X" |
| **Got an offer from the insurer?** | Enter the offer, the income they used, multiplier, future prospects and consortium count. You get a verdict (fair / low / far too low), each flaw with its rupee impact, and a **Copy**-able reply for a legal-aid lawyer |
| **Ask anything about your case** | Chat with the case agent. It calls the rules engine as tools (`listEntitlements`, `simulateWhatIf`, `getPlan`), so "What if police find the truck?" is answered by re-running the law, not guessing. Tool calls show as chips |
| Support card | Tap-to-call Tele-MANAS 14416, NALSA 15100, 112 |

### Step 5 — Plan & letters (`/case/plan`)
| Element | What it does |
|---|---|
| **What to do** (a vertical road) | Claims ordered **earliest deadline first**, the first stop in brass, with date, days left, the deadline rule, the office, and **Add to Google Calendar** per claim |
| Papers to collect | De-duplicated across claims ("FIR × 6, 5 claims"), with where to get each one free. The first five show; **Show all** opens the rest |
| **Write N letters** | For each confirmed claim: the AI drafts → a **second, independent model fact-checks it** against the case facts → one redraft if needed → the deterministic **verifier** checks every ₹ amount and date. Without AI, a fixed template is used |
| Letter chips | AI draft (model) or template · **Verified: N amounts, N dates** or **Blocked by verifier** · warnings (e.g. promising an outcome) |
| Approval checkbox | "I've read this letter and it's correct". Only approved letters go into the print packet; blocked letters can't be approved |
| **Save and share** tiles | Four large tiles: |
| **Print or save approved letters** | Prints the claim packet (correct Hindi rendering), ending with its fingerprint manifest |
| **All deadlines to my calendar** | Downloads a `.ics` file with 7-day and 1-day reminders |
| **Send the plan on WhatsApp** | Opens WhatsApp with the plan text |
| **QR code for a caseworker** | A QR code and link carrying the case *facts only* (no names or documents) in the link's `#fragment`, which browsers never send to a server |
| **Tamper-proof fingerprint** (drawer, "For officials") | SHA-256 fingerprint of every document and approved letter, a packet fingerprint, and its QR. Anyone can re-hash a file to prove nothing was altered |
| **Next: follow up on claims** | Opens step 6 |

### Step 6 — Follow up (`/case/track`)
| Element | What it does |
|---|---|
| **When the money is likely to arrive** | Timeline (weeks → years) of each claim's expected payout window, and how much could land within 90 days, so families can avoid high-interest loans |
| Status buttons per claim | Not filed yet / Filed / Paid / Rejected (one tap) |
| Filed on (date) | Starts that institution's **legal clock** (e.g. insurer 30 days; hit-and-run 30+15+15; bank 15 days) and shows "due …" or "N days overdue", plus late-payment interest where the law gives it |
| **Next escalation** + **Draft the escalation** | Unlocks when the deadline passes; drafts a letter to the next level (e.g. insurer's grievance officer → Bima Bharosa / Ombudsman; bank → RBI Ombudsman; DAR not filed → RTI to police; → free DLSA lawyer), citing the rule and days of delay |
| **Save this case safely** → **Save the case under lock** drawer | Name + passphrase → **Save on this device** or **Encrypted file** (AES-256-GCM, PBKDF2 310k). **Open a file** / **Unlock** restores a case on any device. Our server never sees it |

### Saathi (साथी), the guide (button bottom-right on every page)
A Hindi, English and Hinglish guide, by voice (mic) or text, that can read its replies aloud. Every message goes through layers, cheapest and safest first:
1. **Distress** words go straight to Tele-MANAS 14416 and 112, before any AI.
2. **Touts and scams** ("an agent wants 30%", blank papers, advance fees) get a clear warning and the free lawyer number, NALSA 15100.
3. **Glossary**: 13 legal and scheme terms (FIR, MACT, DAR, PMSBY, RuPay cover, owner-driver PA cover, PM RAHAT…) explained in plain language, instantly, without AI.
4. **Page help**: "What do I do here?" answers for the exact step.
5. **The AI** (Groq), with names and numbers masked on the phone first ("2 details hidden before sending"). Every amount comes from rules-engine tools (all claims, deadline plan, what-if, glossary), shown under the reply.

On a case, **"Ask me the questions by voice"** turns the intake into a conversation: Saathi asks the single most valuable next question, takes "haan" / "nahin" or a tap, saves it, and says what it unlocked ("That just confirmed ₹2,00,000 more").

### Agent log (internal)
Every agent step (Reader, Parser, Shield, Guard, Extractor, Rules, Questioner, Planner, Drafter, Verifier, Case Agent) is still recorded with its model, time and token count, but it is not shown to families: the screens stay focused on their task. The same pipeline is explained in plain words while papers are read ("Rahbar is working…").

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
2. Scroll the film once (night → dawn) → **Watch a sample case** → **Auto-play** and watch the "Rahbar is working" checklist.
3. **What you're owed** → ₹21,00,000 counts up; open the owner-driver card → **Why & how**; back on *Check*, tap the policy quote to show the highlight.
4. Open the **Court compensation estimate & insurer offer check** drawer → type ₹9,00,000 / ₹7,000 / multiplier 15 → "far too low, 32%" + reply.
5. **Ask anything about your case**: "What if the police find the truck?" → tool chip `simulateWhatIf`.
6. **Plan & letters** → **Write 5 letters** → show the fact-checker and verifier chips → tick one → **Tamper-proof fingerprint**.
7. **Follow up** → tap **Filed** on one claim → show its legal clock and escalation; **Save this case safely**.
8. End on the red-team sample: the hidden instruction struck out in red; the total stays ₹7 lakh, not ₹50 lakh.
