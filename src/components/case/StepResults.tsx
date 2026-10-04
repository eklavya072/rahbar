"use client";

import { useState } from "react";
import { ArrowRight, Calculator, Check, ChevronDown, ExternalLink, HelpCircle, Landmark, Loader2, MessageCircle, Send, TrendingUp, Wrench, X } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { formatDate, formatINR, formatINRShort } from "@/lib/engine/dates";
import { DOCS } from "@/lib/engine/documents";
import type { EntitlementResult, Facts, Status } from "@/lib/engine/types";
import { DaysLeft, SourceBadge } from "../ui";
import { CountUp } from "../landing/TextEffects";
import { ActionBar, Extras, More, StepIntro } from "./Flow";
import { IncomeEvidenceCard, MactPanel } from "./Money";
import { ReadAloud, SupportCard } from "./Support";

function CondIcon({ r }: { r: boolean | null }) {
  if (r === true) return <Check size={14} className="text-accent" />;
  if (r === false) return <X size={14} className="text-rose" />;
  return <HelpCircle size={14} className="text-amber" />;
}

export function EntitlementCard({ r }: { r: EntitlementResult }) {
  const { lang, b, t } = useLang();
  const [open, setOpen] = useState(false);
  const hi = lang === "hi";
  const tone = r.status === "eligible" ? "bg-accent text-white" : r.status === "possible" ? "bg-amber-soft text-amber" : "bg-slate-soft text-slate";

  return (
    <article className={`card overflow-hidden transition-shadow ${open ? "shadow-[0_18px_40px_-28px_rgba(21,23,28,.45)]" : ""}`}>
      <button className="flex w-full items-start gap-3.5 p-4 text-left sm:p-5" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone}`} aria-hidden>
          {r.status === "eligible" ? <Check size={16} /> : r.status === "possible" ? <HelpCircle size={16} /> : <X size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.05rem] font-semibold leading-snug">{b(r.name)}</h3>
          <div className="mt-0.5 text-sm text-muted">{b(r.payer)}</div>
          <div className={`num-serif mt-2 text-2xl ${r.status === "not_eligible" ? "text-muted line-through decoration-1" : ""}`}>{b(r.amount.label)}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {r.status !== "not_eligible" && <DaysLeft days={r.daysLeft} />}
            {r.status === "eligible" && r.evidenceBacked && <span className="chip bg-accent-soft text-accent">{hi ? "काग़ज़ से साबित" : "proved by your papers"}</span>}
            {r.informational && <span className="chip bg-slate-soft text-ink-2">{hi ? "इलाज · कुल में नहीं" : "treatment · not in total"}</span>}
          </div>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-key">
          <span className="hidden sm:inline">{open ? (hi ? "बंद करें" : "Close") : hi ? "क्यों और कैसे" : "Why & how"}</span>
          <ChevronDown size={18} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="step-enter space-y-4 border-t border-line bg-surface-2/70 p-4 text-sm sm:px-5">
          <div>
            <div className="step-label mb-2 !text-muted">{t("why")}</div>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="step-label mb-1 !text-muted">{t("deadline")}</div>
                <div>{r.deadline.date ? <b>{formatDate(r.deadline.date, lang)} — </b> : null}{b(r.deadline.label)}</div>
              </div>
              <div>
                <div className="step-label mb-1 flex items-center gap-1.5 !text-muted"><Landmark size={12} /> {t("whereToApply")}</div>
                <div>{b(r.office)}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="step-label mb-1.5 !text-muted">{t("documents")}</div>
                <div className="flex flex-wrap gap-1.5">{r.documents.map((d) => <span key={d} className="chip bg-surface text-ink-2 ring-1 ring-line">{b(DOCS[d].name)}</span>)}</div>
              </div>
            </div>
          )}
          {r.notes.length > 0 && <ul className="list-disc space-y-1 pl-5 text-ink-2">{r.notes.map((n, i) => <li key={i}>{b(n)}</li>)}</ul>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
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

function Bucket({ title, hint, items }: { title: string; hint: string; items: EntitlementResult[] }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="h-sec">{title} <span className="num-serif text-muted">· {items.length}</span></h2>
        <span className="text-sm text-muted">{hint}</span>
      </div>
      <div className="stagger space-y-3">{items.map((r) => <EntitlementCard key={r.id} r={r} />)}</div>
    </section>
  );
}

interface ChatMsg { role: "user" | "assistant"; content: string; tools?: { name: string; input: unknown; output: unknown }[]; model?: string | null }

export function AskAgent({ bare = false }: { bare?: boolean }) {
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
      const r = await fetch("/api/agent/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: text, facts: nonIdentifying, today, history, lang }) }).then((x) => x.json());
      setMsgs((m) => [...m, { role: "assistant", content: r.answer ?? r.error, tools: r.toolCalls, model: r.model }]);
      traceUpdate(tid, { status: r.model ? "done" : "warn", model: r.model, detail: r.toolCalls?.length ? `tools: ${r.toolCalls.map((t: { name: string }) => t.name).join(", ")}` : r.model ? "answered" : "AI offline → rules-engine answer" });
    } catch (e) {
      traceUpdate(tid, { status: "error", detail: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={bare ? "" : "card p-4"}>
      {!bare && <h3 className="font-semibold">{hi ? "अपने केस के बारे में पूछें" : "Ask about your case"}</h3>}
      <p className={`${bare ? "" : "mt-0.5 "}text-xs text-muted`}>{hi ? "एजेंट पैसे का हिसाब ख़ुद नहीं लगाता — वह नियम-इंजन को टूल की तरह चलाता है।" : "The agent never does the money maths itself — it calls the rules engine as a tool."}</p>
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
  const { summary, state, trace, plan, facts, income, go } = useCase();
  const { lang, t, b } = useLang();
  const hi = lang === "hi";
  const by = (s: Status) => summary.results.filter((r) => r.status === s);
  const docsRead = state.docs.filter((d) => d.parsed).length;
  const answered = Object.keys(state.answers).length;
  const notAvail = by("not_eligible");

  return (
    <div>
      <StepIntro
        title={hi ? "आपके परिवार को क्या मिल सकता है" : "What your family may be owed"}
        lead={hi ? "हर दावे के साथ उसका कारण, डेडलाइन और कहाँ जमा करना है। किसी पर भी टैप करके 'क्यों' देखें।" : "Each claim comes with its reason, deadline and where to apply. Tap any one to see why."}
      />

      <section className="panel-ink step-enter p-6 sm:p-8" aria-label={t("totalFound")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="step-label !text-[#cea850]">{hi ? "काग़ज़ों और जवाबों से पक्का" : "Confirmed from your papers and answers"}</div>
          <ReadAloud
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 px-3 text-sm text-white/80 hover:bg-white/10"
            text={(hi ? `अब तक पक्का: ${formatINR(summary.confirmedTotal)}। ` : `Confirmed so far: ${formatINR(summary.confirmedTotal)}. `) + by("eligible").filter((r) => !r.informational).map((r) => `${b(r.short)}: ${b(r.amount.label)}.`).join(" ")}
          />
        </div>
        <div className="num-serif mt-3 text-[clamp(2.9rem,9vw,4.8rem)] leading-none text-[#f2f1ec]">
          <CountUp to={summary.confirmedTotal} active prefix="₹" ms={1600} />
        </div>
        {summary.possibleTotal > 0 && (
          <div className="mt-2 text-white/75">+ {formatINRShort(summary.possibleTotal, lang)} {hi ? "और मिल सकता है — एक जाँच के बाद" : "more possible, after one more check"}</div>
        )}
        <div className="rule-brass mt-6" />
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-white/60">{hi ? "दावा करें" : "Ready to claim"}</dt><dd className="num-serif text-3xl text-[#f2f1ec]">{summary.counts.eligible}</dd></div>
          <div><dt className="text-white/60">{hi ? "जाँच बाकी" : "To check"}</dt><dd className="num-serif text-3xl text-[#cea850]">{summary.counts.possible}</dd></div>
          <div><dt className="text-white/60">{hi ? "नहीं मिलेगा" : "Not available"}</dt><dd className="num-serif text-3xl text-white/50">{summary.counts.not_eligible}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-white/50">{hi ? `${docsRead} काग़ज़ और ${answered} जवाबों से · पैसा नियम तय करते हैं, AI नहीं` : `From ${docsRead} papers and ${answered} answers · amounts come from the rules, never the AI`}</p>
      </section>

      <div className="mt-10 space-y-10">
        <Bucket title={hi ? "दावा करने के लिए तैयार" : "Ready to claim"} hint={hi ? "सबसे नज़दीकी डेडलाइन पहले देखें" : "Watch the nearest deadline first"} items={by("eligible")} />
        <Bucket title={hi ? "एक और जाँच चाहिए" : "Needs one more check"} hint={hi ? "'क्यों' में देखें क्या बाकी है" : "Open 'Why' to see what's missing"} items={by("possible")} />
        {notAvail.length > 0 && (
          <More icon={<X size={18} />} title={hi ? `नहीं मिलेगा · ${notAvail.length}` : `Not available · ${notAvail.length}`} hint={hi ? "और क्यों — ताकि कोई आपको गुमराह न कर सके" : "And why — so no one can mislead you"}>
            <div className="space-y-3">{notAvail.map((r) => <EntitlementCard key={r.id} r={r} />)}</div>
          </More>
        )}
      </div>

      <ActionBar back="check">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            trace("Planner", "Built a deadline-first plan and de-duplicated documents", {
              status: "done",
              detail: `${plan.claims.length} claims ordered by deadline · ${plan.documents.length} distinct documents`,
            });
            go("plan");
          }}
        >
          {hi ? "आगे: योजना और पत्र" : "Next: your plan & letters"} <ArrowRight size={18} />
        </button>
      </ActionBar>

      <Extras title={hi ? "और मदद (वैकल्पिक)" : "More help (optional)"}>
        <More icon={<MessageCircle size={18} />} title={hi ? "अपने केस के बारे में कुछ भी पूछें" : "Ask anything about your case"} hint={hi ? "जवाब नियमों से आते हैं, अंदाज़े से नहीं" : "Answers come from the rules, not guesses"}>
          <AskAgent bare />
        </More>
        {income?.monthly ? (
          <More icon={<TrendingUp size={18} />} title={hi ? "पासबुक से आय का सबूत" : "Proof of income from the passbook"} hint={hi ? "इससे अदालत का मुआवज़ा बढ़ सकता है" : "Can raise court compensation"}>
            <IncomeEvidenceCard bare />
          </More>
        ) : null}
        {facts.incidentType === "death" && (
          <More icon={<Calculator size={18} />} title={hi ? "अदालत का उचित मुआवज़ा और बीमा प्रस्ताव जाँच" : "Court compensation estimate & insurer offer check"} hint={hi ? "सुप्रीम कोर्ट के सूत्र, हर लाइन के साथ" : "Supreme Court formulas, line by line"}>
            <MactPanel bare />
          </More>
        )}
        <SupportCard />
        <p className="pt-2 text-xs text-muted">{t("notAdvice")}</p>
      </Extras>
    </div>
  );
}
