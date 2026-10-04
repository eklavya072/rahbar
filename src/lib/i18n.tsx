"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import type { Bilingual, Lang } from "./engine/types";

const UI = {
  appName: { en: "AfterCrash", hi: "AfterCrash" },
  tagline: { en: "After a road crash, what your family is owed.", hi: "सड़क हादसे के बाद, आपके परिवार का हक़।" },
  start: { en: "Start a case", hi: "केस शुरू करें" },
  trySample: { en: "Try a sample case", hi: "सैंपल केस देखें" },
  steps_tell: { en: "What happened", hi: "क्या हुआ" },
  steps_docs: { en: "Papers", hi: "काग़ज़ात" },
  steps_facts: { en: "Check facts", hi: "तथ्य जाँचें" },
  steps_questions: { en: "A few questions", hi: "कुछ सवाल" },
  steps_results: { en: "What you're owed", hi: "आपका हक़" },
  steps_plan: { en: "Plan & letters", hi: "योजना और पत्र" },
  steps_track: { en: "Track & escalate", hi: "ट्रैक और शिकायत" },
  next: { en: "Continue", hi: "आगे बढ़ें" },
  back: { en: "Back", hi: "पीछे" },
  confirmed: { en: "Confirmed from your papers", hi: "आपके काग़ज़ों से पक्का" },
  possible: { en: "Possible — needs checking", hi: "संभव — जाँच ज़रूरी" },
  notEligible: { en: "Not available — and why", hi: "नहीं मिलेगा — और क्यों" },
  totalFound: { en: "Found so far", hi: "अब तक मिला" },
  plusPossible: { en: "more possible", hi: "और संभव" },
  deadline: { en: "Deadline", hi: "अंतिम तिथि" },
  daysLeft: { en: "days left", hi: "दिन बाकी" },
  overdue: { en: "overdue", hi: "समय निकल गया" },
  whereToApply: { en: "Where to apply", hi: "कहाँ आवेदन करें" },
  documents: { en: "Documents", hi: "दस्तावेज़" },
  why: { en: "Why", hi: "क्यों" },
  sources: { en: "Sources", hi: "स्रोत" },
  lastVerified: { en: "Rule last verified", hi: "नियम अंतिम बार जाँचा गया" },
  notAdvice: {
    en: "AfterCrash gives information, not legal advice. Free legal aid: NALSA helpline 15100 / your District Legal Services Authority.",
    hi: "AfterCrash जानकारी देता है, कानूनी सलाह नहीं। मुफ़्त कानूनी सहायता: NALSA हेल्पलाइन 15100 / ज़िला विधिक सेवा प्राधिकरण।",
  },
  privacyPromise: {
    en: "Your papers are read on this device. Names, phone, Aadhaar and account numbers are masked before anything is sent to AI. Nothing is stored on our server.",
    hi: "आपके काग़ज़ इसी डिवाइस पर पढ़े जाते हैं। AI को कुछ भी भेजने से पहले नाम, फ़ोन, आधार और खाता नंबर छिपा दिए जाते हैं। हमारे सर्वर पर कुछ भी सेव नहीं होता।",
  },
  agentTrace: { en: "Agent trace", hi: "एजेंट ट्रेस" },
  askAgent: { en: "Ask about your case", hi: "अपने केस के बारे में पूछें" },
} satisfies Record<string, Bilingual>;

export type UIKey = keyof typeof UI;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: UIKey) => string;
  b: (x: Bilingual) => string;
}

const Ctx = createContext<LangCtx | null>(null);

// Tiny external store so the saved language is read without setState-in-effect or hydration mismatches.
const KEY = "aftercrash-lang";
let memLang: Lang | null = null;
const listeners = new Set<() => void>();
function readLang(): Lang {
  if (memLang) return memLang;
  try {
    memLang = localStorage.getItem(KEY) === "hi" ? "hi" : "en";
  } catch {
    memLang = "en";
  }
  return memLang;
}
function writeLang(l: Lang) {
  memLang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  listeners.forEach((f) => f());
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readLang,
    () => "en" as Lang,
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => writeLang(l), []);

  const t = useCallback((k: UIKey) => UI[k][lang], [lang]);
  const b = useCallback((x: Bilingual) => x[lang], [lang]);

  return <Ctx.Provider value={{ lang, setLang, t, b }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang outside LangProvider");
  return c;
}
