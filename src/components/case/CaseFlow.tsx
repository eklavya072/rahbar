"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Workflow, X } from "lucide-react";
import { CaseProvider, useCase } from "@/lib/case/CaseProvider";
import { STEPS, type Step } from "@/lib/case/state";
import { decodeCase } from "@/lib/case/outputs";
import { useLang, type UIKey } from "@/lib/i18n";
import { Header } from "../ui";
import { StepDocs, StepTell } from "./StepIntake";
import { StepFacts, StepQuestions } from "./StepReview";
import { StepResults } from "./StepResults";
import { StepPlan } from "./StepPlan";
import { StepTrack } from "./StepTrack";
import { TracePanel } from "./TracePanel";

const LABEL: Record<Step, UIKey> = { tell: "steps_tell", docs: "steps_docs", facts: "steps_facts", questions: "steps_questions", results: "steps_results", plan: "steps_plan", track: "steps_track" };

function Stepper() {
  const { state, dispatch } = useCase();
  const { t } = useLang();
  const cur = STEPS.indexOf(state.step);
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cur]);
  return (
    <nav className="no-print -mx-1 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Progress">
      <ol className="flex min-w-max items-center gap-1 px-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-1">
            <button
              ref={i === cur ? active : undefined}
              onClick={() => i <= cur && dispatch({ type: "step", step: s })}
              disabled={i > cur}
              aria-current={i === cur ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${i === cur ? "bg-ink text-white" : i < cur ? "bg-accent-soft text-accent" : "text-muted"}`}
            >
              <span className="text-xs opacity-70">{i + 1}</span> {t(LABEL[s])}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-line" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Inner() {
  const { state, dispatch, loadSample, trace } = useCase();
  const params = useSearchParams();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const sample = params.get("sample");
    if (sample) {
      loadSample(sample);
      return;
    }
    const m = window.location.hash.match(/#c=(.+)$/);
    if (m) {
      const f = decodeCase(m[1]);
      if (f) {
        dispatch({ type: "reset", state: { answers: f, step: "results", aiConfirmed: true } });
        trace("Human", "Opened a shared case link — facts only, no names or documents", { status: "done" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header
        right={
          <button className="btn btn-ghost !px-3 !py-1.5 text-sm lg:hidden" onClick={() => setDrawer(true)}>
            <Workflow size={14} /> {state.trace.length}
          </button>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <Stepper />
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {state.step === "tell" && <StepTell />}
            {state.step === "docs" && <StepDocs />}
            {state.step === "facts" && <StepFacts />}
            {state.step === "questions" && <StepQuestions />}
            {state.step === "results" && <StepResults />}
            {state.step === "plan" && <StepPlan />}
            {state.step === "track" && <StepTrack />}
          </div>
          <div className="no-print hidden lg:block">
            <div className="sticky top-20">
              <TracePanel />
            </div>
          </div>
        </div>
      </main>
      {drawer && (
        <div className="no-print fixed inset-0 z-40 flex flex-col bg-black/40 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="mt-auto max-h-[85vh] rounded-t-2xl bg-bg p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button className="btn btn-ghost !p-2" onClick={() => setDrawer(false)} aria-label="Close trace"><X size={16} /></button>
            </div>
            <TracePanel />
          </div>
        </div>
      )}
    </>
  );
}

export function CaseFlow() {
  return (
    <CaseProvider>
      <Inner />
    </CaseProvider>
  );
}
