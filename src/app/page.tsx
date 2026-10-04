"use client";

import Link from "next/link";
import { ArrowRight, Bot, CalendarClock, Code2, FileSearch, Gavel, KeyRound, Lock, Scale, UserCheck } from "lucide-react";
import { Footer, Header } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { SAMPLE_CASES } from "@/lib/samples/cases";

const EVIDENCE = [
  { v: "205", en: "hit-and-run compensation claims were filed in FY 2022-23 — against about 25,000 eligible hit-and-run accidents a year.", hi: "हिट-एंड-रन मुआवज़े के दावे वित्त वर्ष 2022-23 में हुए — जबकि हर साल लगभग 25,000 पात्र हादसे होते हैं।", src: "Supreme Court, S. Rajaseekaran v. UoI (2024); GI Council", url: "https://www.verdictum.in/court-updates/supreme-court/s-rajaseekaran-v-union-of-india-ors-2024-insc-37-compensation-in-hit-run-accidents-1515043" },
  { v: "70%", en: "of low-income families hit by a road accident didn't know any compensation scheme existed.", hi: "कम आय वाले दुर्घटना-प्रभावित परिवारों को किसी मुआवज़ा योजना की जानकारी नहीं थी।", src: "World Bank & SaveLIFE Foundation (2021)", url: "https://www.worldbank.org/en/country/india/publication/traffic-crash-injuries-and-disabilities-the-burden-on-indian-society" },
  { v: "90%", en: "of stuck hit-and-run claims were stuck on missing documents, not on eligibility.", hi: "अटके हिट-एंड-रन दावे पात्रता से नहीं, काग़ज़ों की कमी से अटके थे।", src: "Crashfree India, Justice Unserved (2026)", url: "https://crashfreeindia.org/documents/justice-unserved-crashfree-india.pdf" },
  { v: "69%", en: "of road-injury households borrow or sell assets to pay for care while they wait.", hi: "सड़क-दुर्घटना पीड़ित परिवार इलाज के लिए उधार लेते हैं या संपत्ति बेचते हैं।", src: "BMC Health Services Research (2012)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3475104/" },
];

const PIPE = [
  { icon: <FileSearch size={18} />, en: ["Reads your papers", "On your phone, with OCR in English and Hindi."], hi: ["आपके काग़ज़ पढ़ता है", "आपके फ़ोन पर, हिंदी और अंग्रेज़ी OCR से।"] },
  { icon: <Lock size={18} />, en: ["Hides your identity", "Names and numbers are masked before any AI sees text."], hi: ["आपकी पहचान छिपाता है", "AI को कुछ दिखाने से पहले नाम-नंबर छिपते हैं।"] },
  { icon: <Gavel size={18} />, en: ["Applies the law", "10 entitlements as cited, tested rules — never AI guesses."], hi: ["कानून लागू करता है", "10 हक़ स्रोत-सहित, परखे नियमों से — AI के अनुमान से नहीं।"] },
  { icon: <Bot size={18} />, en: ["Drafts the letters", "A verifier blocks any amount or date the rules didn't produce."], hi: ["पत्र बनाता है", "नियमों से बाहर की कोई राशि या तारीख़ जाँचकर्ता रोक देता है।"] },
  { icon: <UserCheck size={18} />, en: ["You approve", "Nothing is sent or filed without you."], hi: ["आप मंज़ूर करते हैं", "आपके बिना कुछ भेजा या जमा नहीं होता।"] },
];

const LONG_ROAD = [
  { icon: <Scale size={17} />, href: "/offer", en: ["Check an insurer's offer", "Sarla Verma, Pranay Sethi and Magma formulas, head by head, with a reply for your lawyer."], hi: ["बीमा प्रस्ताव जाँचें", "सरला वर्मा, प्रणय सेठी और मैग्मा के सूत्रों से, हर मद अलग, वकील के लिए जवाब सहित।"] },
  { icon: <CalendarClock size={17} />, href: "/case?sample=sunita", en: ["Track and escalate", "Each institution's legal deadline is built in; late claims get the next escalation letter."], hi: ["ट्रैक करें और शिकायत करें", "हर संस्था की कानूनी समय-सीमा दर्ज; देरी पर अगला शिकायत पत्र।"] },
  { icon: <KeyRound size={17} />, href: "/case", en: ["Keep it private for months", "AES-256 encrypted case vault on your device, or as a file for your caseworker."], hi: ["महीनों तक निजी रखें", "आपके डिवाइस पर AES-256 एन्क्रिप्टेड केस, या केसवर्कर के लिए फ़ाइल।"] },
  { icon: <Code2 size={17} />, href: "/developers", en: ["Build on it", "Public API and rules registry for hospitals, legal aid and NGOs."], hi: ["इस पर बनाएँ", "अस्पतालों, कानूनी सहायता और NGO के लिए पब्लिक API और नियम रजिस्टर।"] },
];

/** The product's core move, shown on a real (synthetic) passbook: a ₹20 debit becomes ₹2 lakh of cover. */
function HeroProof() {
  const { lang } = useLang();
  const hi = lang === "hi";
  const found = [
    { tone: "accent", line: hi ? "₹20 'PMSBY' कटौती, 28 मई" : "₹20 'PMSBY' debit, 28 May", gets: hi ? "PMSBY दुर्घटना बीमा" : "PMSBY accident cover", amt: "₹2,00,000" },
    { tone: "amber", line: hi ? "रुपे कार्ड इस्तेमाल, हादसे से 12 दिन पहले" : "RuPay card used 12 days before the accident", gets: hi ? "रुपे कार्ड दुर्घटना कवर" : "RuPay card accident cover", amt: "₹2,00,000" },
  ];
  return (
    <figure className="relative mx-auto w-full min-w-0 max-w-xl">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_40px_-24px_rgba(29,27,22,.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/samples/sunita-passbook.png" alt={hi ? "सैंपल पासबुक, दो पंक्तियाँ हाइलाइट" : "Sample passbook with two lines highlighted"} width={1500} height={1053} className="block h-auto w-full max-w-full" />
        <span aria-hidden className="absolute rounded-[3px] ring-2 ring-accent" style={{ left: "4.8%", top: "43.7%", width: "90.4%", height: "6%", background: "rgba(15,92,77,.12)" }} />
        <span aria-hidden className="absolute rounded-[3px] ring-2 ring-amber" style={{ left: "4.8%", top: "73.6%", width: "90.4%", height: "6%", background: "rgba(138,83,0,.10)" }} />
      </div>
      <figcaption className="relative z-10 -mt-10 ml-auto w-[88%] space-y-2 rounded-2xl border border-line bg-surface p-4 shadow-[0_18px_40px_-20px_rgba(29,27,22,.35)] sm:-mt-14">
        {found.map((f) => (
          <div key={f.gets} className="flex items-center gap-3 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${f.tone === "accent" ? "bg-accent" : "bg-amber"}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate text-muted">{f.line}</div>
              <div className="font-medium">{f.gets}</div>
            </div>
            <div className="font-display text-lg font-semibold tabular-nums">{f.amt}</div>
          </div>
        ))}
        <div className="border-t border-line pt-2 text-xs text-muted">{hi ? "उसी केस में बाइक पॉलिसी से ₹15 लाख और — कुल ₹21 लाख, परिवार को पता नहीं था।" : "The bike policy in the same case adds ₹15 lakh more — ₹21 lakh the family didn't know about."}</div>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  const { lang, b, t } = useLang();
  const hi = lang === "hi";
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_1fr] [&>*]:min-w-0">
          <div>
            <h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              {hi ? "हादसे के बाद, आगे का रास्ता।" : "After an accident, the way forward."}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-ink-2">
              {hi
                ? "एक हादसे से परिवार के 10 तक अलग-अलग हक़ बनते हैं — बीमा, सरकारी योजनाएँ, मुआवज़ा। ज़्यादातर परिवार एक भी नहीं माँग पाते। रहबर आपके अपने काग़ज़ों से वह सब ढूँढता है, और हर फ़ॉर्म और पत्र तैयार करता है — आप बस मंज़ूरी दें।"
                : "One accident can give a family up to 10 separate rights to money — insurance, government schemes, compensation. Most families never claim them. Rahbar finds them in your own papers and prepares every form and letter. You just approve."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/case" className="btn btn-primary !px-5 !py-3 text-base">{t("start")} <ArrowRight size={18} /></Link>
              <Link href="/case?sample=sunita" className="btn btn-ghost !px-5 !py-3 text-base">{t("trySample")}</Link>
            </div>
            <p className="mt-4 max-w-xl text-sm text-muted">
              {hi ? "मुफ़्त और निजी। " : "Free and private. "}
              {t("notAdvice")}
            </p>
          </div>
          <HeroProof />
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1.6fr] [&>*]:min-w-0">
            <div>
              <h2 className="text-balance font-display text-3xl font-semibold leading-tight">{hi ? "हक़ काग़ज़ पर है। परिवारों तक नहीं पहुँचता।" : "The rights exist on paper. They don't reach families."}</h2>
              <p className="mt-3 max-w-md text-ink-2">
                {hi
                  ? "हर दावा अलग संस्था के पास है — बीमा कंपनी, बैंक, SDM, ट्रिब्यूनल, ESIC — हर एक के अपने फ़ॉर्म और समय-सीमा। रुकावट पात्रता नहीं, काग़ज़ी काम है।"
                  : "Each claim sits with a different institution — insurer, bank, SDM, tribunal, ESIC — each with its own forms and deadlines. The barrier isn't eligibility. It's paperwork."}
              </p>
            </div>
            <dl className="divide-y divide-line border-y border-line">
              {EVIDENCE.map((s) => (
                <div key={s.v} className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 sm:grid-cols-[7rem_1fr]">
                  <dt className="font-display text-3xl font-semibold tabular-nums text-accent">{s.v}</dt>
                  <dd>
                    <p className="text-ink">{hi ? s.hi : s.en}</p>
                    <a href={s.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-muted underline underline-offset-2">{s.src}</a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-3xl font-semibold">{hi ? "कैसे काम करता है" : "How it works"}</h2>
          <p className="mt-2 max-w-2xl text-ink-2">{hi ? "AI भाषा संभालता है। कानून और पैसे का हिसाब कोड करता है। हर क़दम आप मंज़ूर करते हैं।" : "AI handles language. Code handles law and money. You approve every action."}</p>
          <ol className="relative mt-8 grid gap-6 sm:grid-cols-5 sm:gap-4">
            <span aria-hidden className="absolute left-[18px] top-2 h-[calc(100%-1rem)] w-px bg-line sm:left-0 sm:top-[18px] sm:h-px sm:w-full" />
            {PIPE.map((p) => (
              <li key={p.en[0]} className="relative flex gap-4 sm:block">
                <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-bg text-accent">{p.icon}</span>
                <div className="sm:mt-4">
                  <div className="font-semibold">{hi ? p.hi[0] : p.en[0]}</div>
                  <p className="mt-1 text-sm text-muted">{hi ? p.hi[1] : p.en[1]}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-line bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
            <div>
              <h2 className="text-balance font-display text-3xl font-semibold">{hi ? "दावे महीनों चलते हैं। साथ भी उतना ही रहे।" : "Claims take months. So does the help."}</h2>
              <p className="mt-3 max-w-md text-ink-2">
                {hi ? "पहला पत्र भेजने के बाद असली मुश्किल शुरू होती है: कम प्रस्ताव, चुप्पी, देरी। Rahbar उसके लिए भी बना है।" : "The hard part starts after the first letter: low offers, silence, delay. Rahbar is built for that part too."}
              </p>
              <Link href="/offer" className="btn btn-primary mt-6">{hi ? "प्रस्ताव जाँचें" : "Check a settlement offer"} <ArrowRight size={16} /></Link>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {LONG_ROAD.map((x) => (
                <li key={x.en[0]}>
                  <Link href={x.href} className="group flex gap-4 py-4">
                    <span className="mt-0.5 text-accent">{x.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold group-hover:underline group-hover:underline-offset-2">{hi ? x.hi[0] : x.en[0]}</span>
                      <span className="mt-0.5 block text-sm text-muted">{hi ? x.hi[1] : x.en[1]}</span>
                    </span>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-3xl font-semibold">{hi ? "सैंपल केस आज़माएँ" : "Try a sample case"}</h2>
          <p className="mt-2 text-sm text-muted">{hi ? "सभी नाम और दस्तावेज़ काल्पनिक हैं। जज मोड पूरा केस 20 सेकंड में चला देता है।" : "All names and documents are synthetic. Judge mode plays a whole case in about 20 seconds."}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SAMPLE_CASES.map((c) => (
              <Link key={c.id} href={`/case?sample=${c.id}`} className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/samples/${c.docs[0].id}.png`} alt="" className="h-32 w-full border-b border-line object-cover object-top" />
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold group-hover:underline group-hover:underline-offset-2">{b(c.title)}</span>
                    {c.redTeam && <span className="chip bg-rose-soft text-rose">red-team</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{b(c.blurb)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
