"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Latched reveal (Meridian's useSeen): once a block has been seen it stays shown,
 * so scrolling back finds content where it was left. A poll covers environments
 * where scroll events aren't delivered; no measurable viewport fails open.
 */
export function useSeen<T extends HTMLElement>(margin = 0.84) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (!vh || (r.top < vh * margin && r.bottom > 0)) setSeen(true);
    };
    const first = setTimeout(check, 0);
    window.addEventListener("scroll", check, { passive: true });
    const poll = setInterval(check, 320);
    return () => {
      clearTimeout(first);
      window.removeEventListener("scroll", check);
      clearInterval(poll);
    };
  }, [seen, margin]);
  return { ref, seen };
}

/**
 * Inline emphasis markup for display lines: *word* is italic serif in brass,
 * ~word~ italic in vermilion, ^word^ the heavy condensed impact face. Marks may
 * span several words. Returns each word with its class, and the plain text.
 */
export function parseMarks(text: string): { words: { w: string; cls: string }[]; plain: string } {
  const out: { w: string; cls: string }[] = [];
  let open: string | null = null;
  const CLS: Record<string, string> = { "*": "t-it", "~": "t-it is-red", "^": "t-imp" };
  for (const raw of text.split(" ")) {
    let w = raw;
    let cls = open ? CLS[open] : "";
    const start = w[0];
    if (!open && CLS[start]) {
      open = start;
      cls = CLS[start];
      w = w.slice(1);
    }
    if (open && w.includes(open)) {
      w = w.replace(open, "");
      open = null;
    }
    out.push({ w, cls });
  }
  return { words: out, plain: out.map((x) => x.w).join(" ") };
}

/** Words come into focus in reading order; marked words take their own face. */
export function RollWords({ text, className = "", as: Tag = "span", stagger = 55 }: { text: string; className?: string; as?: "span" | "h2" | "h3" | "p"; stagger?: number }) {
  const { words, plain } = parseMarks(text);
  return (
    <Tag className={className}>
      <span className="l-sr">{plain}</span>
      <span aria-hidden="true">
        {words.map(({ w, cls }, i) => (
          <Fragment key={`${w}-${i}`}>
            <span className="l-roll">
              <span className={`l-roll-in ${cls}`} style={{ transitionDelay: `${i * stagger}ms` }}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}

/** A section that arms its reveals when first seen. */
export function Reveal({ children, className = "", as: Tag = "section", ...rest }: { children: ReactNode; className?: string; as?: "section" | "div" } & Record<string, unknown>) {
  const { ref, seen } = useSeen<HTMLElement>();
  return (
    <Tag ref={ref as never} className={`${className} l-reveal${seen ? " is-in" : ""}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Counts up to `to` once `active`; settles on the exact value even if frames are throttled. */
export function CountUp({ to, active, prefix = "", format = (n: number) => Math.round(n).toLocaleString("en-IN"), ms = 1400 }: { to: number; active: boolean; prefix?: string; format?: (n: number) => string; ms?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setV(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const settle = setTimeout(() => setV(to), ms + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [active, to, ms]);
  return (
    <span className="tabular-nums">
      {prefix}
      {format(v)}
    </span>
  );
}

/** Spotlight that follows the cursor across a dark surface (our addition to the Meridian set). */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  return ref;
}
