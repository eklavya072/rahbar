"use client";

/**
 * Entrance (after Meridian's Preloader): on a black field the Rahbar mark rises,
 * the wordmark sets letter by letter, "रहबर · the way forward" follows, and a brass
 * hairline draws like a road to the horizon. Seven slabs sweep up over it like
 * stairs, hold, then drop away in the same stepped order — revealing the film
 * as the hero line assembles beneath them. Reduced motion skips it; a CSS
 * failsafe removes it after six seconds if scripts never run.
 */
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { RahbarMark } from "../ui";

const WORD = "Rahbar";
const STAIRS = 7;
const EASE = [0.16, 1, 0.3, 1] as const;
type Phase = "name" | "cover" | "lift" | "gone";

export function Preloader({ reduced, onReveal, onDone }: { reduced: boolean; onReveal: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("name");

  useEffect(() => {
    if (reduced) {
      onReveal();
      onDone();
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    at(1650, () => setPhase("cover"));
    at(2550, () => {
      onReveal();
      setPhase("lift");
    });
    at(3400, () => setPhase("gone"));
    at(3800, () => onDone());
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      className="l-preloader fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-void"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "gone" ? 0 : 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      aria-hidden
    >
      <div className="relative z-10 px-6 text-center text-[#f2f1ec]">
        <motion.div initial={{ opacity: 0, y: 10, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} className="mb-6 flex justify-center">
          <RahbarMark size={64} tone="void" />
        </motion.div>
        <div className="flex justify-center">
          {WORD.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="font-brand text-[clamp(2.6rem,9vw,5.2rem)] font-semibold leading-none tracking-tight"
              initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.06 }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <motion.div className="mt-5 text-sm tracking-[0.3em] text-[#f2f1ec]/70" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.95 }}>
          <span lang="hi" className="font-display tracking-normal">रहबर</span> · THE WAY FORWARD
        </motion.div>
        {/* A brass road drawn to the horizon */}
        <motion.div className="mx-auto mt-8 h-px w-48 origin-center bg-[#cea850]" initial={{ scaleX: 0, opacity: 0.4 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 1.2, ease: EASE, delay: 0.45 }} />
      </div>

      {Array.from({ length: STAIRS }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 z-20 h-full bg-[#06080b]"
          style={{ left: `${(i / STAIRS) * 100}%`, width: `${100 / STAIRS + 0.2}%` }}
          initial={{ y: "100%" }}
          animate={{ y: phase === "name" ? "100%" : phase === "cover" ? "0%" : "-100%" }}
          transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1], delay: i * 0.05 }}
        />
      ))}
    </motion.div>
  );
}
