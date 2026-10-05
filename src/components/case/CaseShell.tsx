"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Check, FileText, Play } from "lucide-react";
import { CaseProvider, useCase } from "@/lib/case/CaseProvider";
import { STEPS, stepPath, type Step } from "@/lib/case/state";
import { NewCaseButton, useCurrentStep } from "./Flow";
import { useLang } from "@/lib/i18n";
import type { Bilingual } from "@/lib/engine/types";
import { Header } from "../ui";
import { Saathi } from "../guide/Saathi";

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

function Shell({ children }: { children: ReactNode }) {
  const step = useCurrentStep();
  return (
    <>
      <Header right={<div className="md:hidden"><NewCaseButton variant="icon" /></div>} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-5 sm:px-5 md:pt-8">
        <div className="mb-3 hidden justify-end md:flex"><NewCaseButton /></div>
        <Progress />
        <div className="mt-7 md:mt-10">
          <div key={step} className="step-enter mx-auto min-w-0 max-w-3xl">{children}</div>
        </div>
      </main>
      <Saathi />
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
