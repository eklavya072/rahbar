"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Check, EyeOff, FileText, Play, Workflow, X } from "lucide-react";
import { CaseProvider, useCase } from "@/lib/case/CaseProvider";
import { STEPS, stepPath, type Step } from "@/lib/case/state";
import { useCurrentStep } from "./Flow";
import { useLang } from "@/lib/i18n";
import type { Bilingual } from "@/lib/engine/types";
import { Header } from "../ui";
import { TracePanel } from "./TracePanel";

export const STEP_META: Record<Step, { title: Bilingual; hint: Bilingual }> = {
  story: { title: { en: "Your story", hi: "आपकी बात" }, hint: { en: "What happened", hi: "क्या हुआ" } },
  papers: { title: { en: "Your papers", hi: "आपके काग़ज़" }, hint: { en: "FIR, passbook, policy", hi: "FIR, पासबुक, पॉलिसी" } },
  check: { title: { en: "Check & fill gaps", hi: "जाँचें और पूरा करें" }, hint: { en: "Confirm what we read", hi: "पढ़ा हुआ जाँचें" } },
  owed: { title: { en: "What you're owed", hi: "आपका हक़" }, hint: { en: "Every claim, with reasons", hi: "हर दावा, कारण सहित" } },
  plan: { title: { en: "Plan & letters", hi: "योजना और पत्र" }, hint: { en: "What to do, in order", hi: "क्या करना है, क्रम से" } },
  track: { title: { en: "Follow up", hi: "आगे की कार्रवाई" }, hint: { en: "Deadlines & escalation", hi: "समय-सीमा और शिकायत" } },
};

function Progress() {
  const { state } = useCase();
  const { b, lang } = useLang();
  const current = useCurrentStep();
  const reached = STEPS.indexOf(state.step);
  const curIdx = STEPS.indexOf(current);
  const furthest = Math.max(reached, curIdx);
  const fill = curIdx / (STEPS.length - 1);

  return (
    <nav className="no-print" aria-label={lang === "hi" ? "प्रगति" : "Progress"}>
      {/* Phones: six segments (the page title says where you are) */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="segs flex-1" aria-hidden>
          {STEPS.map((s, i) => <span key={s} className={`seg ${i === curIdx ? "is-cur" : i <= furthest ? "is-done" : ""}`} />)}
        </div>
        <span className="t-meta shrink-0">{lang === "hi" ? `${curIdx + 1} / ${STEPS.length}` : `${curIdx + 1} of ${STEPS.length}`}</span>
      </div>
      {/* Larger screens: the road */}
      <div className="road hidden md:grid" role="list">
        <span className="road-track" aria-hidden />
        <span className="road-fill" style={{ transform: `scaleX(${fill})` }} aria-hidden />
        {STEPS.map((s, i) => {
          const isCur = i === curIdx;
          const done = !isCur && i <= furthest;
          const cls = `road-stop ${isCur ? "is-cur" : done ? "is-done" : ""}`;
          const inner = (
            <>
              <span className="road-dot">{done ? <Check size={14} /> : i + 1}</span>
              <span className="road-label">{b(STEP_META[s].title)}</span>
            </>
          );
          return (
            <div key={s} role="listitem" className="contents">
              {i <= furthest && !isCur ? (
                <Link href={stepPath(s)} className={cls}>{inner}</Link>
              ) : (
                <span className={cls} aria-current={isCur ? "step" : undefined}>{inner}</span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

// "Behind the scenes" preference, remembered per browser. Hidden by default so a
// family sees only their task; judges and caseworkers open it from the pill.
const TRACE_KEY = "rahbar-trace";
const traceListeners = new Set<() => void>();
function readTracePref(): boolean {
  try {
    return localStorage.getItem(TRACE_KEY) === "shown";
  } catch {
    return false;
  }
}
export function writeTracePref(show: boolean) {
  try {
    localStorage.setItem(TRACE_KEY, show ? "shown" : "hidden");
  } catch {}
  traceListeners.forEach((f) => f());
}

function Shell({ children }: { children: ReactNode }) {
  const { state } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const step = useCurrentStep();
  const showTrace = useSyncExternalStore(
    (cb) => {
      traceListeners.add(cb);
      return () => traceListeners.delete(cb);
    },
    readTracePref,
    () => false,
  );
  const [drawer, setDrawer] = useState(false);
  const working = state.trace.some((e) => e.status === "running");

  return (
    <>
      <Header
        right={
          <button
            className="no-print grid h-10 min-w-10 grid-flow-col place-items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs md:hidden"
            onClick={() => setDrawer(true)}
            aria-label={hi ? "पर्दे के पीछे" : "Behind the scenes"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${working ? "pulse bg-key-bright" : "bg-accent"}`} aria-hidden />
            <Workflow size={14} />
            <span className="mono text-muted">{state.trace.length}</span>
          </button>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-5 sm:px-5 md:pt-8">
        <Progress />
        <div className={`mt-7 md:mt-10 ${showTrace ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
          <div key={step} className={`step-enter min-w-0 ${showTrace ? "" : "mx-auto max-w-3xl"}`}>{children}</div>
          {showTrace && (
            <div className="no-print hidden lg:block">
              <div className="sticky top-20 space-y-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink" onClick={() => writeTracePref(false)}>
                  <EyeOff size={13} /> {hi ? "पर्दे के पीछे: छिपाएँ" : "Hide behind the scenes"}
                </button>
                <TracePanel />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* The pill: how many agent steps ran, pulsing while they work. */}
      <button
        className={`no-print fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full border border-line bg-surface/95 px-3.5 py-2 text-sm font-medium shadow-[0_12px_28px_-16px_rgba(21,23,28,.55)] backdrop-blur md:flex ${showTrace ? "lg:hidden" : ""}`}
        onClick={() => (window.innerWidth >= 1024 ? writeTracePref(true) : setDrawer(true))}
      >
        <span className={`h-2 w-2 rounded-full ${working ? "pulse bg-key-bright" : "bg-accent"}`} aria-hidden />
        <Workflow size={14} />
        <span>{hi ? "पर्दे के पीछे" : "Behind the scenes"}</span>
        <span className="mono text-xs text-muted">{state.trace.length}</span>
      </button>
      {drawer && (
        <div className="no-print fixed inset-0 z-50 flex flex-col bg-black/40 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="rise mt-auto max-h-[85vh] rounded-t-2xl bg-bg p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{hi ? "पर्दे के पीछे: हर एजेंट का काम" : "Behind the scenes: every agent step"}</span>
              <button className="btn btn-ghost !p-2" onClick={() => setDrawer(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <TracePanel />
          </div>
        </div>
      )}
    </>
  );
}

export function CaseShell({ children }: { children: ReactNode }) {
  return (
    <CaseProvider>
      <Shell>{children}</Shell>
    </CaseProvider>
  );
}

/** Shown on later pages when the tab has no case yet (e.g. a direct link). */
export function NeedsCase({ children }: { children: ReactNode }) {
  const { state, facts, loadSample } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  if (!state.hydrated) return null;
  const empty = !state.docs.length && !Object.keys(state.answers).length && !Object.values(facts).some((v) => v !== null);
  if (!empty) return <>{children}</>;
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-key-soft text-key"><FileText /></span>
      <h2 className="h-sec mt-4">{hi ? "अभी यहाँ कुछ नहीं है" : "Nothing here yet"}</h2>
      <p className="lead mx-auto mt-2">{hi ? "यह पन्ना आपके केस से भरता है। पहले बताइए क्या हुआ, या एक सैंपल केस देखें।" : "This page fills in from your case. Start by telling us what happened, or open a sample case."}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={stepPath("story")} className="btn btn-primary btn-lg">{hi ? "शुरू करें" : "Start"}</Link>
        <button className="btn btn-ghost" onClick={() => loadSample("sunita")}><Play size={15} /> {hi ? "सैंपल केस" : "Sample case"}</button>
      </div>
    </div>
  );
}
