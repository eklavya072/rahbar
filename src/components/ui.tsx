"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import type { FactSource, Status } from "@/lib/engine/types";
import { Bot, FileText, Menu, MessageCircle, ShieldCheck } from "lucide-react";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-sm" role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-9 min-w-11 rounded-full px-3 font-semibold transition-colors ${lang === l ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}

const NAV = [
  { href: "/offer", label: "Offer check" },
  { href: "/rules", label: "Rules" },
  { href: "/developers", label: "API" },
  { href: "/evals", label: "Evals" },
];

export function Footer() {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted">
        <span>AfterCrash · {hi ? "जानकारी, कानूनी सलाह नहीं" : "information, not legal advice"}</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>)}
          <a href="tel:15100" className="hover:text-ink">NALSA 15100</a>
          <a href="tel:14416" className="hover:text-ink">Tele-MANAS 14416</a>
        </nav>
      </div>
    </footer>
  );
}

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            <ShieldCheck size={18} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">AfterCrash</span>
        </Link>
        <div className="flex items-center gap-2">
          {right}
          <nav className="hidden items-center gap-5 text-sm font-medium text-muted md:flex" aria-label="Main">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>)}
          </nav>
          <LangToggle />
          <details className="relative md:hidden">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-line bg-surface" aria-label="Menu">
              <Menu size={16} />
            </summary>
            <nav className="absolute right-0 top-11 z-40 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_-12px_rgba(29,27,22,.3)]" aria-label="Main">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-2">{n.label}</Link>)}
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
