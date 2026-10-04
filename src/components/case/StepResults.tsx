"use client";

import { useState } from "react";
import { Check, ChevronDown, ExternalLink, HelpCircle, Landmark, Loader2, Send, Wrench, X } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { formatDate, formatINR, formatINRShort } from "@/lib/engine/dates";
import { DOCS } from "@/lib/engine/documents";
import type { EntitlementResult, Facts, Status } from "@/lib/engine/types";
import { DaysLeft, SourceBadge, StatusChip } from "../ui";
import { IncomeEvidenceCard, MactPanel } from "./Money";
import { ReadAloud, SupportCard } from "./Support";

function CondIcon({ r }: { r: boolean | null }) {
  if (r === true) return <Check size={14} className="text-accent" />;
  if (r === false) return <X size={14} className="text-rose" />;
  return <HelpCircle size={14} className="text-amber" />;
}

export function EntitlementCard({ r }: { r: EntitlementResult }) {
  const { lang, b, t } = useLang();
  const [open, setOpen] = useState(r.status !== "not_eligible");
  const hi = lang === "hi";
  const tone = r.status === "eligible" ? "border-l-accent" : r.status === "possible" ? "border-l-amber" : "border-l-slate";

  return (
    <article className={`card rise border-l-4 ${tone} overflow-hidden`}>
      <button className="flex w-full items-start gap-3 p-4 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{b(r.name)}</h3>
            {r.informational && <span className="chip bg-slate-soft text-ink-2">{hi ? "इलाज · कुल में नहीं जोड़ा" : "treatment · not in total"}</span>}
          </div>
          <div className="mt-0.5 text-sm text-muted">{b(r.payer)}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`font-display text-lg font-semibold ${r.status === "not_eligible" ? "text-muted line-through decoration-1" : ""}`}>{b(r.amount.label)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusChip status={r.status} />
            {r.status !== "not_eligible" && <DaysLeft days={r.daysLeft} />}
            {r.status === "eligible" && r.evidenceBacked && <span className="chip bg-accent-soft text-accent">{hi ? "साक्ष्य सहित" : "evidence-backed"}</span>}
          </div>
        </div>
        <ChevronDown size={18} className={`mt-1 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-line bg-surface-2 p-4 text-sm">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{t("why")}</div>
            <ul className="space-y-1.5">
              {r.conditions.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="mt-0.5"><CondIcon r={c.result} /></span>
                  <span className="flex-1">{b(c.label)}</span>
                  {c.result !== null && <SourceBadge source={c.sources[0]} confirmed />}
                </li>
              ))}
            </ul>
          </div>
          {r.status !== "not_eligible" && (
            <>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("deadline")}</div>
                <div>{r.deadline.date ? <b>{formatDate(r.deadline.date, lang)} — </b> : null}{b(r.deadline.label)}</div>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><Landmark size={13} /> {t("whereToApply")}</div>
                <div>{b(r.office)}</div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("documents")}</div>
                <div className="flex flex-wrap gap-1.5">{r.documents.map((d) => <span key={d} className="chip bg-surface text-ink-2 ring-1 ring-line">{b(DOCS[d].name)}</span>)}</div>
              </div>
            </>
          )}
          {r.notes.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-ink-2">{r.notes.map((n, i) => <li key={i}>{b(n)}</li>)}</ul>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{t("sources")}:</span>
            {r.citations.map((c) => (
              <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                {c.title} <ExternalLink size={11} />
              </a>
            ))}
            <span>· {t("lastVerified")}: {r.lastVerified}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function Bucket({ status, items }: { status: Status; items: EntitlementResult[] }) {
  const { t } = useLang();
  if (!items.length) return null;
  const title = status === "eligible" ? t("confirmed") : status === "possible" ? t("possible") : t("notEligible");
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{title} · {items.length}</h3>
      {items.map((r) => <EntitlementCard key={r.id} r={r} />)}
    </section>
  );
}

interface ChatMsg { role: "user" | "assistant"; content: string; tools?: { name: string; input: unknown; output: unknown }[]; model?: string | null }

export function AskAgent() {
  const { facts, today, trace, traceUpdate } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const nonIdentifying: Partial<Facts> = { ...facts, state: facts.state };
  const suggestions = hi
    ? ["अगर पुलिस ट्रक ढूँढ ले तो क्या बदलेगा?", "सबसे पहले मुझे क्या करना चाहिए?", "क्या मुझे वकील की ज़रूरत है?"]
    : ["What changes if the police find the truck?", "What should I do first?", "What if his passbook shows PMJJBY too?"];

  const ask = async (text: string) => {
    if (!text.trim() || busy) return;
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setQ("");
    setBusy(true);
    const tid = trace("Case Agent", `Question: "${text.slice(0, 60)}"`);
    try {
      const r = await fetch("/api/agent/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: text, facts: nonIdentifying, today, history }) }).then((x) => x.json());
      setMsgs((m) => [...m, { role: "assistant", content: r.answer ?? r.error, tools: r.toolCalls, model: r.model }]);
      traceUpdate(tid, { status: r.model ? "done" : "warn", model: r.model, detail: r.toolCalls?.length ? `tools: ${r.toolCalls.map((t: { name: string }) => t.name).join(", ")}` : r.model ? "answered" : "AI offline → rules-engine answer" });
    } catch (e) {
      traceUpdate(tid, { status: "error", detail: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-4">
      <h3 className="font-semibold">{hi ? "अपने केस के बारे में पूछें" : "Ask about your case"}</h3>
      <p className="mt-0.5 text-xs text-muted">{hi ? "एजेंट पैसे का हिसाब ख़ुद नहीं लगाता — वह नियम-इंजन को टूल की तरह चलाता है।" : "The agent never does the money maths itself — it calls the rules engine as a tool."}</p>
      <div className="mt-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 rounded-xl bg-ink px-3 py-2 text-sm text-white" : "mr-4 space-y-1.5"}>
            {m.role === "assistant" && m.tools && m.tools.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {m.tools.map((tc, j) => (
                  <span key={j} className="chip mono bg-slate-soft text-ink-2" title={JSON.stringify(tc.output)}>
                    <Wrench size={11} /> {tc.name}({Object.keys(tc.input as object).length ? JSON.stringify(tc.input) : ""})
                  </span>
                ))}
              </div>
            )}
            <div className={m.role === "assistant" ? "rounded-xl bg-surface-2 px-3 py-2 text-sm whitespace-pre-wrap" : ""}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" /> {hi ? "सोच रहा है…" : "Thinking…"}</div>}
      </div>
      {msgs.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => <button key={s} className="btn btn-ghost !px-3 !py-1.5 text-xs" onClick={() => ask(s)}>{s}</button>)}
        </div>
      )}
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={hi ? "अपना सवाल लिखें…" : "Type your question…"} />
        <button className="btn btn-primary !px-3" disabled={busy || !q.trim()} aria-label="Send"><Send size={16} /></button>
      </form>
    </section>
  );
}

export function StepResults() {
  const { summary, state, dispatch, trace, plan, facts } = useCase();
  const { lang, t, b } = useLang();
  const hi = lang === "hi";
  const by = (s: Status) => summary.results.filter((r) => r.status === s);
  const docsRead = state.docs.filter((d) => d.parsed).length;
  const answered = Object.keys(state.answers).length;

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="bg-accent p-5 text-white">
          <div className="text-sm opacity-90">{t("totalFound")}</div>
          <div className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{formatINR(summary.confirmedTotal)}</div>
          <div className="mt-1 text-sm opacity-90">
            {summary.possibleTotal > 0 && <>+ {formatINRShort(summary.possibleTotal, lang)} {t("plusPossible")} · </>}
            {hi ? `${docsRead} काग़ज़ और ${answered} जवाबों से` : `from ${docsRead} papers and ${answered} answers`}
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line text-center text-sm">
          <div className="p-3"><div className="font-semibold text-accent">{summary.counts.eligible}</div><div className="text-xs text-muted">{hi ? "पक्का" : "confirmed"}</div></div>
          <div className="p-3"><div className="font-semibold text-amber">{summary.counts.possible}</div><div className="text-xs text-muted">{hi ? "जाँचना है" : "to check"}</div></div>
          <div className="p-3"><div className="font-semibold text-slate">{summary.counts.not_eligible}</div><div className="text-xs text-muted">{hi ? "नहीं मिलेगा" : "not available"}</div></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{hi ? "हर दावे में 'क्यों' खोलकर देखें कि कौन-सी शर्त किस काग़ज़ से साबित हुई।" : "Open 'Why' on any claim to see which paper proves each condition."}</p>
        <ReadAloud
          text={
            (hi ? `अब तक पक्का: ${formatINR(summary.confirmedTotal)}। ` : `Confirmed so far: ${formatINR(summary.confirmedTotal)}. `) +
            by("eligible").filter((r) => !r.informational).map((r) => `${b(r.short)}: ${b(r.amount.label)}.`).join(" ")
          }
        />
      </div>

      <Bucket status="eligible" items={by("eligible")} />
      <Bucket status="possible" items={by("possible")} />
      <Bucket status="not_eligible" items={by("not_eligible")} />

      <IncomeEvidenceCard />
      {facts.incidentType === "death" && <MactPanel />}

      <AskAgent />
      <SupportCard />

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={() => dispatch({ type: "step", step: "questions" })}>{hi ? "पीछे" : "Back"}</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            trace("Planner", "Built a deadline-first plan and de-duplicated documents", {
              status: "done",
              detail: `${plan.claims.length} claims ordered by deadline · ${plan.documents.length} distinct documents`,
            });
            dispatch({ type: "step", step: "plan" });
          }}
        >
          {hi ? "योजना और पत्र बनाएँ" : "Make the plan & letters"}
        </button>
      </div>
      <p className="text-xs text-muted">{t("notAdvice")}</p>
    </div>
  );
}
