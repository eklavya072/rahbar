"use client";

import { useCase } from "@/lib/case/CaseProvider";
import type { AgentName, TraceEvent } from "@/lib/case/state";
import { useLang } from "@/lib/i18n";
import {
  Bot, CalendarClock, CheckCircle2, CircleAlert, CircleDashed, FileSearch, Gavel, ListChecks, Loader2, MessagesSquare, PenLine, ScanText, ShieldAlert, ShieldCheck, UserCheck, Workflow,
} from "lucide-react";

const ICON: Record<AgentName, React.ReactNode> = {
  Reader: <ScanText size={15} />,
  Parser: <FileSearch size={15} />,
  Shield: <ShieldCheck size={15} />,
  Guard: <ShieldAlert size={15} />,
  Extractor: <Bot size={15} />,
  Rules: <Gavel size={15} />,
  Questioner: <ListChecks size={15} />,
  Planner: <CalendarClock size={15} />,
  Drafter: <PenLine size={15} />,
  Verifier: <CheckCircle2 size={15} />,
  Human: <UserCheck size={15} />,
  "Case Agent": <MessagesSquare size={15} />,
};

const ROLE: Record<AgentName, string> = {
  Reader: "OCR on device",
  Parser: "deterministic",
  Shield: "PII masking on device",
  Guard: "prompt-injection check",
  Extractor: "LLM · typed output",
  Rules: "rules-as-code",
  Questioner: "value of information",
  Planner: "deadline DAG",
  Drafter: "LLM · placeholders only",
  Verifier: "deterministic check",
  Human: "approval",
  "Case Agent": "LLM + tools",
};

function StatusIcon({ e }: { e: TraceEvent }) {
  if (e.status === "running") return <Loader2 size={14} className="animate-spin text-muted" />;
  if (e.status === "warn") return <CircleAlert size={14} className="text-amber" />;
  if (e.status === "error") return <CircleAlert size={14} className="text-rose" />;
  if (e.status === "skipped") return <CircleDashed size={14} className="text-muted" />;
  return <CheckCircle2 size={14} className="text-accent" />;
}

export function TracePanel() {
  const { state, summary } = useCase();
  const { t } = useLang();
  const llmCalls = state.trace.filter((e) => (e.agent === "Extractor" || e.agent === "Drafter" || e.agent === "Case Agent") && e.status === "done").length;
  const tokens = state.trace.reduce((a, e) => a + (e.tokens ?? 0), 0);

  return (
    <aside className="card flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden" aria-label={t("agentTrace")}>
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <Workflow size={16} /> {t("agentTrace")}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
          <span className="chip bg-slate-soft">{state.trace.length} steps</span>
          <span className="chip bg-slate-soft">{llmCalls} LLM calls</span>
          <span className="chip bg-slate-soft">{tokens.toLocaleString("en-IN")} tokens</span>
          <span className="chip bg-accent-soft text-accent">cost ₹0</span>
          <span className="chip bg-slate-soft">{summary.results.length} rules evaluated</span>
        </div>
      </div>
      <ol className="flex-1 space-y-0 overflow-y-auto px-4 py-3">
        {state.trace.length === 0 && <li className="text-sm text-muted">Agents will report each step here as they work.</li>}
        {state.trace.map((e, i) => (
          <li key={e.id} className="rise relative flex gap-3 pb-4">
            {i < state.trace.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-line" aria-hidden />}
            <span className="z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2">{ICON[e.agent]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-ink">{e.agent}</span>
                <span className="text-muted">· {ROLE[e.agent]}</span>
                <span className="ml-auto"><StatusIcon e={e} /></span>
              </div>
              <div className="text-sm text-ink-2">{e.title}</div>
              {e.detail && <div className="mt-0.5 break-words text-xs text-muted">{e.detail}</div>}
              {(e.ms || e.model) && (
                <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted">
                  {e.model && <span className="mono">{e.model}</span>}
                  {e.ms ? <span>· {e.ms} ms</span> : null}
                  {e.tokens ? <span>· {e.tokens} tok</span> : null}
                  {e.cached ? <span>· cached</span> : null}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
