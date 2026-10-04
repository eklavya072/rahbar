"use client";

import Link from "next/link";
import { ArrowRight, Bot, FileSearch, Gavel, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Header } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { SAMPLE_CASES } from "@/lib/samples/cases";

const STATS = [
  { v: "205", en: "hit-and-run compensation claims in FY 2022-23 — against ~25,000 eligible crashes a year", hi: "वित्त वर्ष 2022-23 में हिट-एंड-रन मुआवज़े के दावे — हर साल ~25,000 पात्र हादसों के मुक़ाबले", src: "Supreme Court, S. Rajaseekaran v. UoI (2024); GI Council", url: "https://www.verdictum.in/court-updates/supreme-court/s-rajaseekaran-v-union-of-india-ors-2024-insc-37-compensation-in-hit-run-accidents-1515043" },
  { v: "70%", en: "of low-income crash households didn't know compensation schemes exist", hi: "कम आय वाले दुर्घटना-प्रभावित परिवारों को मुआवज़ा योजनाओं की जानकारी नहीं थी", src: "World Bank & SaveLIFE Foundation (2021)", url: "https://www.worldbank.org/en/country/india/publication/traffic-crash-injuries-and-disabilities-the-burden-on-indian-society" },
  { v: "90%", en: "of stuck hit-and-run claims were stuck on missing documents", hi: "अटके हिट-एंड-रन दावे काग़ज़ों की कमी से अटके थे", src: "Crashfree India, Justice Unserved (2026)", url: "https://crashfreeindia.org/documents/justice-unserved-crashfree-india.pdf" },
  { v: "1.73 lakh", en: "people killed on Indian roads in 2023 — most aged 18–45", hi: "लोगों की 2023 में भारतीय सड़कों पर मौत — ज़्यादातर 18–45 वर्ष", src: "MoRTH, Road Accidents in India 2023", url: "https://www.business-standard.com/india-news/india-road-accidents-deaths-injuries-report-road-highway-ministry-nitin-gadkari-125082801527_1.html" },
];

const PIPE = [
  { icon: <FileSearch size={18} />, en: "Reads your papers on your phone", hi: "आपके काग़ज़ आपके फ़ोन पर पढ़ता है" },
  { icon: <Lock size={18} />, en: "Masks names & numbers before any AI sees them", hi: "AI को दिखाने से पहले नाम और नंबर छिपाता है" },
  { icon: <Gavel size={18} />, en: "Checks 9 entitlements with cited rules", hi: "9 हक़ों को स्रोत-सहित नियमों से जाँचता है" },
  { icon: <Bot size={18} />, en: "Drafts letters — a verifier checks every rupee", hi: "पत्र बनाता है — हर रुपये की जाँच होती है" },
  { icon: <UserCheck size={18} />, en: "You approve every step", hi: "हर क़दम आप मंज़ूर करते हैं" },
];

export default function Home() {
  const { lang, b, t } = useLang();
  const hi = lang === "hi";
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:pt-16">
          <div className="max-w-3xl">
            <span className="chip bg-accent-soft text-accent"><ShieldCheck size={12} /> {hi ? "मुफ़्त · निजी · सड़क दुर्घटना पीड़ित परिवारों के लिए" : "Free · private · for families after a road crash in India"}</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              {hi ? "सड़क हादसे के बाद, आपके परिवार का जो हक़ है — वह सब।" : "After a road crash, everything your family is owed."}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              {hi
                ? "एक हादसे से 9 तक अलग-अलग दावे बनते हैं — बीमा, सरकारी योजनाएँ, मुआवज़ा। ज़्यादातर परिवार एक भी नहीं माँगते। AfterCrash आपके अपने काग़ज़ों से छिपा कवर ढूँढता है और सारे काग़ज़ी काम तैयार करता है।"
                : "One accident can trigger up to 9 separate claims — insurance, government schemes, compensation. Most families claim none. AfterCrash finds hidden cover in your own papers and prepares all the paperwork."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/case" className="btn btn-primary !px-5 !py-3 text-base">{t("start")} <ArrowRight size={18} /></Link>
              <Link href={`/case?sample=sunita`} className="btn btn-ghost !px-5 !py-3 text-base">{t("trySample")}</Link>
            </div>
            <p className="mt-3 text-sm text-muted">{t("notAdvice")}</p>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <a key={s.v} href={s.url} target="_blank" rel="noreferrer" className="bg-surface p-5 hover:bg-surface-2">
                <div className="font-display text-3xl font-semibold text-accent">{s.v}</div>
                <div className="mt-1 text-sm text-ink-2">{hi ? s.hi : s.en}</div>
                <div className="mt-2 text-xs text-muted underline decoration-dotted">{s.src}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-semibold">{hi ? "कैसे काम करता है" : "How it works"}</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-5">
            {PIPE.map((p, i) => (
              <li key={i} className="card p-4">
                <div className="flex items-center gap-2 text-accent">{p.icon}<span className="text-xs font-semibold text-muted">{i + 1}</span></div>
                <div className="mt-2 text-sm font-medium">{hi ? p.hi : p.en}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="font-display text-2xl font-semibold">{hi ? "सैंपल केस आज़माएँ" : "Try a sample case"}</h2>
          <p className="mt-1 text-sm text-muted">{hi ? "सभी नाम और दस्तावेज़ काल्पनिक हैं।" : "All names and documents are synthetic."}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SAMPLE_CASES.map((c) => (
              <Link key={c.id} href={`/case?sample=${c.id}`} className="card p-4 transition hover:border-accent">
                <div className="font-semibold">{b(c.title)}</div>
                <p className="mt-1 text-sm text-muted">{b(c.blurb)}</p>
                {c.redTeam && <span className="chip mt-2 bg-rose-soft text-rose">red-team</span>}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        AfterCrash · WCC Launchpad 30 · {hi ? "जानकारी, कानूनी सलाह नहीं" : "information, not legal advice"} · NALSA 15100
      </footer>
    </>
  );
}
