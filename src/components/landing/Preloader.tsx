"use client";

/**
 * Entrance: on a black field the Rahbar mark rises and the wordmark sets letter
 * by letter, with a brass line drawn like a road to the horizon. Then two
 * headlights appear far down that road, grow as they approach, and flood the
 * screen with warm light that clears to reveal the film. Reduced motion skips
 * it; a CSS failsafe removes it after six seconds if scripts never run.
 */
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { RahbarMark } from "../ui";

const WORD = "Rahbar";
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
      animate={{ opacity: phase === "lift" || phase === "gone" ? 0 : 1 }}
      transition={{ duration: 0.85, ease: [0.33, 1, 0.68, 1] }}
      aria-hidden
    >
      <motion.div className="relative z-10 px-6 text-center text-[#f2f1ec]" animate={{ opacity: phase === "name" ? 1 : 0, scale: phase === "name" ? 1 : 0.96 }} transition={{ duration: 0.5, ease: EASE }}>
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
        <motion.div className="mt-5 font-display text-lg text-[#f2f1ec]/70" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.95 }}>
          <span lang="hi" className="font-display tracking-normal">रहबर</span> · the way forward
        </motion.div>
        {/* A brass road drawn to the horizon */}
        <motion.div className="mx-auto mt-8 h-px w-48 origin-center bg-[#cea850]" initial={{ scaleX: 0, opacity: 0.4 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 1.2, ease: EASE, delay: 0.45 }} />
      </motion.div>

      {/* Two headlights far down the road, approaching, then a flood of light */}
      {[-1, 1].map((side) => (
        <motion.span
          key={side}
          className="absolute z-20 block rounded-full"
          style={{ left: `calc(50% + ${side * 2.2}vw)`, top: "57%", width: 10, height: 10, marginLeft: -5, marginTop: -5, background: "radial-gradient(circle, #fff7e0 0%, #f0d48a 35%, rgba(206,168,80,0) 70%)" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={phase === "name" ? { scale: 0.6, opacity: 0.9 } : phase === "cover" ? { scale: 14, opacity: 1, x: side * 60 } : { scale: 60, opacity: 0, x: side * 140 }}
          transition={{ duration: phase === "cover" ? 0.9 : 0.8, ease: [0.55, 0, 0.75, 0.2], delay: phase === "name" ? 0.9 : 0 }}
        />
      ))}
      <motion.div
        className="absolute inset-0 z-30"
        style={{ background: "radial-gradient(circle at 50% 57%, #fff6dc 0%, #e8c879 40%, #0a0c10 100%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "cover" ? 0.85 : 0 }}
        transition={{ duration: 0.9, ease: [0.55, 0, 0.75, 0.2] }}
      />
    </motion.div>
  );
}
