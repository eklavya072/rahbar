"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Eye, EyeOff, FileText, Play, Workflow, X } from "lucide-react";
import { CaseProvider, useCase } from "@/lib/case/CaseProvider";
import { STEPS, stepPath, type Step } from "@/lib/case/state";
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
  const { b } = useLang();
  const path = usePathname();
  const current = STEPS.find((s) => path?.startsWith(stepPath(s))) ?? "story";
  const reached = STEPS.indexOf(state.step);
  const curIdx = STEPS.indexOf(current);
  const active = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [curIdx]);

  return (
    <nav className="no-print" aria-label="Progress">
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((curIdx + 1) / STEPS.length) * 100}%` }} />
      </div>
      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <ol className="flex min-w-max gap-1 lg:min-w-0">
        {STEPS.map((s, i) => {
          const done = i < curIdx || (i <= reached && i !== curIdx);
          const isCur = i === curIdx;
          const open = i <= Math.max(reached, curIdx);
          const inner = (
            <>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${isCur ? "bg-ink text-white" : done ? "bg-accent text-white" : "bg-slate-soft text-muted"}`}>
                {done && !isCur ? <Check size={12} /> : i + 1}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium">{b(STEP_META[s].title)}</span>
                <span className="hidden text-[11px] text-muted lg:block">{b(STEP_META[s].hint)}</span>
              </span>
            </>
          );
          return (
            <li key={s} className="shrink-0 lg:flex-1">
              {open ? (
                <Link
                  ref={isCur ? active : undefined}
                  href={stepPath(s)}
                  aria-current={isCur ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${isCur ? "bg-surface ring-1 ring-line" : "hover:bg-surface"}`}
                >
                  {inner}
                </Link>
              ) : (
                <span className="flex cursor-not-allowed items-center gap-2 rounded-xl px-2.5 py-2 opacity-60">{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
      </div>
    </nav>
  );
}

// "Behind the scenes" preference, remembered per browser.
const TRACE_KEY = "rahbar-trace";
const traceListeners = new Set<() => void>();
function readTracePref(): boolean {
  try {
    return localStorage.getItem(TRACE_KEY) !== "hidden";
  } catch {
    return true;
  }
}
function writeTracePref(show: boolean) {
  try {
    localStorage.setItem(TRACE_KEY, show ? "shown" : "hidden");
  } catch {}
  traceListeners.forEach((f) => f());
}

function Shell({ children }: { children: ReactNode }) {
  const { state } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const showTrace = useSyncExternalStore(
    (cb) => {
      traceListeners.add(cb);
      return () => traceListeners.delete(cb);
    },
    readTracePref,
    () => true,
  );
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <Header
        right={
          <button className="btn btn-ghost !px-3 !py-1.5 text-sm lg:hidden" onClick={() => setDrawer(true)} aria-label={hi ? "पर्दे के पीछे" : "Behind the scenes"}>
            <Workflow size={14} /> {state.trace.length}
          </button>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <Progress />
        <div className={`mt-5 grid gap-6 ${showTrace ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
          <div className="min-w-0">{children}</div>
          {showTrace ? (
            <div className="no-print hidden lg:block">
              <div className="sticky top-20 space-y-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink" onClick={() => writeTracePref(false)}>
                  <EyeOff size={13} /> {hi ? "पर्दे के पीछे — छिपाएँ" : "Hide behind the scenes"}
                </button>
                <TracePanel />
              </div>
            </div>
          ) : (
            <button className="no-print fixed bottom-5 right-5 hidden items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium shadow-[0_10px_24px_-14px_rgba(29,27,22,.45)] lg:flex" onClick={() => writeTracePref(true)}>
              <Eye size={14} /> {hi ? "पर्दे के पीछे देखें" : "Show behind the scenes"} · {state.trace.length}
            </button>
          )}
        </div>
      </main>
      {drawer && (
        <div className="no-print fixed inset-0 z-40 flex flex-col bg-black/40 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="mt-auto max-h-[85vh] rounded-t-2xl bg-bg p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{hi ? "पर्दे के पीछे" : "Behind the scenes"}</span>
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
    <div className="card mx-auto max-w-xl p-6 text-center">
      <FileText className="mx-auto text-muted" />
      <h2 className="mt-3 font-display text-2xl font-semibold">{hi ? "अभी यहाँ कुछ नहीं है" : "Nothing here yet"}</h2>
      <p className="mt-2 text-muted">{hi ? "पहले बताइए क्या हुआ, या एक सैंपल केस देखें।" : "Start by telling us what happened, or open a sample case."}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href={stepPath("story")} className="btn btn-primary">{hi ? "शुरू करें" : "Start"}</Link>
        <button className="btn btn-ghost" onClick={() => loadSample("sunita")}><Play size={15} /> {hi ? "सैंपल केस" : "Sample case"}</button>
      </div>
    </div>
  );
}
