"use client";

/**
 * Typographic primitives that carry importance: money, deadlines, and the one
 * phrase in a block that matters. Each effect has a job: the odometer is the
 * moment money is found, the highlighter points at the insight, the redaction
 * shows what privacy actually does.
 */
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";

const inr = (n: number) => Math.round(n).toLocaleString("en-IN");

/**
 * ₹ amount set as money: the rupee sign small and raised, lining tabular figures,
 * the Indian-grouping commas a shade lighter so the digits read first.
 */
export function Money({ value, className = "" }: { value: number; className?: string }) {
  const s = inr(value);
  return (
    <span className={`money ${className}`} aria-label={`₹${s}`}>
      <span className="money-sym" aria-hidden>₹</span>
      <span aria-hidden>
        {s.split("").map((ch, i) => (ch === "," ? <span key={i} className="money-sep">,</span> : <Fragment key={i}>{ch}</Fragment>))}
      </span>
    </span>
  );
}

/**
 * Odometer: every digit is a column that spins a full turn and lands on its
 * value, right-hand digits first, like a meter coming to rest. Commas stay put.
 * Starts from zero when `active` first turns true; later changes roll directly.
 */
export function Odometer({ value, active = true, className = "" }: { value: number; active?: boolean; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active || on) return;
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, [active, on]);
  const s = inr(value);
  const chars = s.split("");
  const digitsTotal = chars.filter((c) => c !== ",").length;
  let seen = 0;
  return (
    <span className={`money odo ${className}`} aria-label={`₹${s}`} role="img">
      <span className="money-sym" aria-hidden>₹</span>
      <span aria-hidden className="odo-row">
        {chars.map((ch, i) => {
          if (ch === ",") return <span key={`c${chars.length - i}`} className="money-sep">,</span>;
          const d = Number(ch);
          const fromRight = digitsTotal - 1 - seen++;
          return (
            <span key={`d${chars.length - i}`} className="odo-col">
              <span
                className="odo-strip"
                style={{ transform: `translate3d(0, ${on ? -(10 + d) * 5 : 0}%, 0)`, transitionDelay: `${fromRight * 70}ms` }}
              >
                {"01234567890123456789".split("").map((n, k) => <span key={k}>{n}</span>)}
              </span>
              <span className="odo-ghost">{ch}</span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** Days left as a number you can't miss: colour carries urgency, the word carries meaning. */
export function Deadline({ days, date, compact = false }: { days: number | null; date?: string | null; compact?: boolean }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  if (days === null) return null;
  const tone = days < 0 ? "is-late" : days <= 14 ? "is-urgent" : days <= 60 ? "is-soon" : "is-calm";
  if (days < 0)
    return (
      <span className={`deadline ${tone} ${compact ? "is-compact" : ""}`}>
        <span className="deadline-word">{hi ? "समय निकल गया" : "Overdue"}</span>
        {date && <span className="deadline-date">{date}</span>}
      </span>
    );
  return (
    <span className={`deadline ${tone} ${compact ? "is-compact" : ""}`}>
      <span className="deadline-n">{days}</span>
      <span className="deadline-rest">
        <span className="deadline-word">{hi ? "दिन बाकी" : days === 1 ? "day left" : "days left"}</span>
        {date && <span className="deadline-date">{date}</span>}
      </span>
    </span>
  );
}

/** The one phrase in a block that matters, swept with a brass highlighter when it arrives. */
export function Mark({ children }: { children: ReactNode }) {
  return <mark className="hl">{children}</mark>;
}

/**
 * Redaction: each identifier is struck through by a black bar, then the bar
 * lifts to show the token the AI actually receives.
 */
export function Redact({ parts, active }: { parts: (string | { real: string; token: string })[]; active: boolean }) {
  let n = 0;
  return (
    <span className={`rd-line${active ? " is-on" : ""}`}>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <Fragment key={i}>{p}</Fragment>
        ) : (
          <span key={i} className="rd" style={{ ["--i" as string]: n++ }}>
            <span className="rd-real">{p.real}</span>
            <span className="rd-tok">{p.token}</span>
          </span>
        ),
      )}
    </span>
  );
}

/**
 * A claim amount as a figure plus its qualifier: "₹15,00,000" set large,
 * "100% of the sum insured on death" set small beneath. Ranges, pensions and
 * other non-figure labels stay as words.
 */
const LEAD = /^₹\s?[\d,]+(?:\.\d+)?(?:\s?(?:lakh|लाख|crore|करोड़))?(?![\d-])\s*(.*)$/;
export function Amount({ value, label, size = "lg", struck = false }: { value: number | null; label: string; size?: "lg" | "md"; struck?: boolean }) {
  const m = value != null ? label.match(LEAD) : null;
  if (!m) return <span className={`amount-words ${size === "lg" ? "is-lg" : ""} ${struck ? "is-struck" : ""}`}>{label}</span>;
  let qual = m[1].trim();
  if (qual.startsWith("(") && qual.endsWith(")")) qual = qual.slice(1, -1);
  return (
    <span className={`amount ${struck ? "is-struck" : ""}`}>
      <Money value={value!} className={size === "lg" ? "money-lg" : "money-md"} />
      {qual && <span className="money-qual">{qual}</span>}
    </span>
  );
}
