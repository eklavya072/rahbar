"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { FactSource, Status } from "@/lib/engine/types";
import { Bot, FileText, Menu, MessageCircle } from "lucide-react";

/** The Rahbar mark: a road converging on a brass sunrise — the way forward. */
export function RahbarMark({ size = 32, tone = "paper" }: { size?: number; tone?: "paper" | "void" }) {
  const stroke = tone === "void" ? "#f2f1ec" : "#15171c";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="11" r="4.2" fill="#cea850" />
      <path d="M17.6 19.5 L6 35 M22.4 19.5 L34 35" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 23 v2.6 M20 29 v3.4" stroke="#cea850" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang();
  const ring = dark ? "border-white/25 bg-white/5 text-[#f2f1ec]" : "border-line bg-surface";
  return (
    <>
      {/* Phones: one compact button that switches to the other language */}
      <button
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        className={`grid h-10 min-w-10 place-items-center rounded-full border px-2.5 text-sm font-semibold sm:hidden ${ring}`}
        aria-label={lang === "en" ? "हिंदी में देखें" : "View in English"}
      >
        {lang === "en" ? "हिं" : "EN"}
      </button>
      <div className={`hidden rounded-full border p-0.5 text-sm sm:inline-flex ${ring}`} role="group" aria-label="Language">
        {(["en", "hi"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`min-h-9 min-w-11 rounded-full px-3 font-semibold transition-colors ${
              lang === l ? (dark ? "bg-[#f2f1ec] text-[#0a0c10]" : "bg-ink text-white") : dark ? "text-white/60 hover:text-white" : "text-muted hover:text-ink"
            }`}
          >
            {l === "en" ? "EN" : "हिं"}
          </button>
        ))}
      </div>
    </>
  );
}

const NAV = [
  { href: "/offer", en: "Offer check", hi: "प्रस्ताव जाँच" },
  { href: "/rules", en: "Rules", hi: "नियम" },
  { href: "/developers", en: "API", hi: "API" },
  { href: "/evals", en: "Tests", hi: "जाँच" },
];

export function Footer({ dark = false }: { dark?: boolean }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <footer className={`no-print relative z-10 border-t ${dark ? "border-white/10 bg-[#06080b] text-white/60" : "border-line text-muted"}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-7 text-sm">
        <span className="flex items-center gap-2">
          <RahbarMark size={20} tone={dark ? "void" : "paper"} /> Rahbar · {hi ? "जानकारी, कानूनी सलाह नहीं" : "information, not legal advice"}
        </span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          {NAV.map((n) => <Link key={n.href} href={n.href} className={dark ? "hover:text-white" : "hover:text-ink"}>{hi ? n.hi : n.en}</Link>)}
          <a href="tel:15100" className={dark ? "hover:text-white" : "hover:text-ink"}>NALSA 15100</a>
          <a href="tel:14416" className={dark ? "hover:text-white" : "hover:text-ink"}>Tele-MANAS 14416</a>
        </nav>
      </div>
    </footer>
  );
}

/** Header: "film" floats over the landing's dark film; "paper" is the calm working header. */
/**
 * Over the film the header is a dark veil; once paper slides under it, it turns
 * to paper too. The tone comes from whichever [data-surface] section sits under
 * the bar, checked on scroll and on a slow poll (smooth-scroll safe).
 */
function useSurfaceUnderHeader(enabled: boolean) {
  const [tone, setTone] = useState<"film" | "dark" | "light">("film");
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      const y = 36;
      let under: HTMLElement | null = null;
      for (const el of document.querySelectorAll<HTMLElement>("[data-surface]")) {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) under = el;
      }
      const surface = under?.dataset.surface ?? "void";
      const next = surface.startsWith("paper") ? "light" : !under || under.classList.contains("l-scrub") ? "film" : "dark";
      setTone((t) => (t === next ? t : next));
    };
    const first = setTimeout(check, 0);
    window.addEventListener("scroll", check, { passive: true });
    const poll = setInterval(check, 300);
    return () => {
      clearTimeout(first);
      window.removeEventListener("scroll", check);
      clearInterval(poll);
    };
  }, [enabled]);
  return tone;
}

export function Header({ right, variant = "paper" }: { right?: React.ReactNode; variant?: "paper" | "film" }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const film = variant === "film";
  const tone = useSurfaceUnderHeader(film);
  const dark = film && tone !== "light";
  const shell = !film
    ? "sticky top-0 border-b border-line bg-bg/85 backdrop-blur-md"
    : tone === "light"
      ? "fixed inset-x-0 top-0 border-b border-line bg-bg/88 text-ink backdrop-blur-md"
      : tone === "dark"
        ? "fixed inset-x-0 top-0 border-b border-white/10 bg-[#0a0c10]/80 text-[#f2f1ec] backdrop-blur-md"
        : "fixed inset-x-0 top-0 border-b border-transparent bg-gradient-to-b from-[#06080b]/85 to-transparent text-[#f2f1ec]";
  return (
    <header className={`no-print z-40 transition-[background-color,border-color,color] duration-300 ${shell}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Rahbar home">
          <RahbarMark size={30} tone={dark ? "void" : "paper"} />
          <span className="font-brand text-lg font-semibold tracking-tight">Rahbar</span>
          <span className={`hidden font-display text-base sm:inline ${dark ? "text-white/55" : "text-muted"}`} lang="hi">रहबर</span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {right}
          <nav className={`hidden items-center gap-6 text-sm font-medium md:flex ${dark ? "text-white/70" : "text-muted"}`} aria-label="Main">
            {NAV.map((n) => <Link key={n.href} href={n.href} className={`link-swipe ${dark ? "hover:text-white" : "hover:text-ink"}`}>{hi ? n.hi : n.en}</Link>)}
          </nav>
          <LangToggle dark={dark} />
          <details className="relative md:hidden">
            <summary className={`grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border ${dark ? "border-white/25 bg-white/5" : "border-line bg-surface"}`} aria-label="Menu">
              <Menu size={16} />
            </summary>
            <nav className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-[0_16px_34px_-14px_rgba(21,23,28,.35)]" aria-label="Main">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-surface-2">{hi ? n.hi : n.en}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function StatusChip({ status }: { status: Status }) {
  const { t } = useLang();
  const map = {
    eligible: { cls: "bg-accent-soft text-accent", label: t("confirmed") },
    possible: { cls: "bg-amber-soft text-amber", label: t("possible") },
    not_eligible: { cls: "bg-slate-soft text-slate", label: t("notEligible") },
  }[status];
  return <span className={`chip ${map.cls}`}>{map.label}</span>;
}

export function SourceBadge({ source, confirmed }: { source: FactSource; confirmed?: boolean }) {
  const { lang } = useLang();
  const map = {
    document: { icon: <FileText size={12} />, cls: "bg-accent-soft text-accent", en: "From papers", hi: "काग़ज़ों से" },
    ai: { icon: <Bot size={12} />, cls: "bg-amber-soft text-amber", en: confirmed ? "AI read · you confirmed" : "AI read · confirm", hi: confirmed ? "AI ने पढ़ा · आपने पुष्टि की" : "AI ने पढ़ा · पुष्टि करें" },
    answer: { icon: <MessageCircle size={12} />, cls: "bg-slate-soft text-ink-2", en: "Your answer", hi: "आपका जवाब" },
    default: { icon: null, cls: "bg-slate-soft text-muted", en: "Unknown", hi: "अज्ञात" },
  }[source];
  return (
    <span className={`chip ${map.cls}`}>
      {map.icon}
      {lang === "hi" ? map.hi : map.en}
    </span>
  );
}

export function DaysLeft({ days }: { days: number | null }) {
  const { t } = useLang();
  if (days === null) return null;
  const cls = days < 0 ? "bg-rose-soft text-rose" : days <= 14 ? "bg-rose-soft text-rose" : days <= 45 ? "bg-amber-soft text-amber" : "bg-slate-soft text-ink-2";
  return <span className={`chip ${cls}`}>{days < 0 ? t("overdue") : `${days} ${t("daysLeft")}`}</span>;
}
