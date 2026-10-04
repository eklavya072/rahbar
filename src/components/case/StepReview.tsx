"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, EyeOff, Pencil, ShieldAlert } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { FACT_LABELS, formatFact } from "@/lib/engine/factLabels";
import { rankQuestions } from "@/lib/engine/questions";
import { RULES_BY_ID } from "@/lib/engine/rules";
import { formatINRShort } from "@/lib/engine/dates";
import { rehydrate } from "@/lib/privacy/pii";
import type { Evidence, FactKey, Facts } from "@/lib/engine/types";
import { SourceBadge } from "../ui";
import { DocViewer } from "./DocViewer";
import { ActionBar, Extras, More, StepIntro } from "./Flow";

function FactEditor({ k, value, onChange }: { k: FactKey; value: Facts[FactKey]; onChange: (v: Facts[FactKey]) => void }) {
  const { lang } = useLang();
  if (typeof value === "boolean" || value === null) {
    return (
      <select className="input mt-1 !w-auto !py-1.5 text-sm" value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "true")}>
        <option value="">{lang === "hi" ? "पता नहीं" : "Unknown"}</option>
        <option value="true">{lang === "hi" ? "हाँ" : "Yes"}</option>
        <option value="false">{lang === "hi" ? "नहीं" : "No"}</option>
      </select>
    );
  }
  if (k === "accidentDate" || k === "lastCardTxnDate") return <input type="date" className="input mt-1 !w-auto !py-1.5 text-sm" value={String(value)} onChange={(e) => onChange(e.target.value || null)} />;
  if (typeof value === "number") return <input type="number" className="input mt-1 !w-32 !py-1.5 text-sm" value={value} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
  return <span className="text-sm">{formatFact(k, value, lang)}</span>;
}

/** What we read, as a receipt: each fact, where it came from, and a way to fix it. */
function FactsRead() {
  const { state, dispatch, facts, provenance, confirmFacts } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [viewing, setViewing] = useState<Evidence | null>(null);
  const [editing, setEditing] = useState<FactKey | null>(null);
  const [all, setAll] = useState(false);

  const known = (Object.keys(FACT_LABELS) as FactKey[]).filter((k) => facts[k] !== null && k !== "state");
  const FIRST = 6;
  const shown = all ? known : known.slice(0, FIRST);
  const docForEvidence = viewing ? state.docs.find((d) => d.id === viewing.docId) : null;
  const summary = state.extraction ? rehydrate(hi ? state.extraction.summaryHi : state.extraction.summaryEn, state.piiTokens) : null;

  return (
    <section className="space-y-4">
      {state.guardFlags.length > 0 && (
        <div className="rounded-2xl border border-rose/30 bg-rose-soft p-4 text-sm text-rose">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert size={17} /> {hi ? "एक काग़ज़ में AI के लिए छिपा निर्देश मिला — उसे अनदेखा किया गया" : "One paper had a hidden instruction to the AI — it was ignored"}
          </div>
          <ul className="mt-2 space-y-1">
            {state.guardFlags.map((l) => (
              <li key={l} className="mono rounded bg-white/60 px-2 py-1 text-xs line-through decoration-rose/60">{rehydrate(l, state.piiTokens)}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">{hi ? "ये पंक्तियाँ AI तक नहीं भेजी गईं। पैसा हमेशा नियमों से तय होता है, AI से नहीं।" : "These lines never reached the AI. Money is always decided by the rules, never by the AI."}</p>
        </div>
      )}

      {summary && <p className="border-l-2 border-key-bright pl-4 font-display text-lg leading-relaxed text-ink-2">{summary}</p>}

      <div className="card overflow-hidden">
        {known.length === 0 && <div className="p-4 text-sm text-muted">{hi ? "काग़ज़ों से कोई तथ्य नहीं मिला — नीचे कुछ सवाल हैं।" : "Nothing could be read from the papers — a few questions below instead."}</div>}
        <ul className="divide-y divide-line">
          {shown.map((k) => {
            const p = provenance[k];
            const isEditing = editing === k;
            return (
              <li key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm text-muted">{b(FACT_LABELS[k])}</div>
                  {isEditing ? (
                    <FactEditor k={k} value={facts[k]} onChange={(v) => dispatch({ type: "answer", key: k, value: v })} />
                  ) : (
                    <div className="mt-0.5 text-[1.05rem] font-semibold">{formatFact(k, facts[k], lang)}</div>
                  )}
                </div>
                <button className="inline-flex h-9 items-center gap-1.5 self-start rounded-full px-3 text-sm font-medium text-key hover:bg-key-soft" onClick={() => setEditing(isEditing ? null : k)}>
                  {isEditing ? <Check size={14} /> : <Pencil size={13} />} {isEditing ? (hi ? "हो गया" : "Done") : hi ? "बदलें" : "Fix"}
                </button>
                {p && (
                  <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2">
                    <SourceBadge source={p.source} confirmed={p.confirmed || state.aiConfirmed} />
                    {p.evidence && (
                      <button className="min-w-0 max-w-full truncate rounded-md bg-surface-2 px-2 py-1 text-left text-xs text-ink-2 underline decoration-dotted underline-offset-2 sm:max-w-[22rem]" onClick={() => setViewing(p.evidence!)} title={hi ? "काग़ज़ पर देखें" : "See it on the paper"}>
                        “{rehydrate(p.evidence.quote, state.piiTokens)}”
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {known.length > FIRST && (
          <button className="flex w-full items-center justify-center gap-1.5 border-t border-line px-4 py-3 text-sm font-medium text-key hover:bg-key-soft/50" onClick={() => setAll(!all)} aria-expanded={all}>
            {all ? (hi ? "कम दिखाएँ" : "Show fewer") : hi ? `सभी ${known.length} बातें देखें` : `Show all ${known.length} things we read`}
            <ChevronDown size={16} className={`transition-transform ${all ? "rotate-180" : ""}`} />
          </button>
        )}
        {known.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface-2/60 px-4 py-3">
            {state.aiConfirmed ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent"><Check size={16} /> {hi ? "आपने पुष्टि की" : "You confirmed these"}</span>
            ) : (
              <>
                <button className="btn btn-ghost bg-surface !min-h-10" onClick={confirmFacts}><Check size={16} /> {hi ? "हाँ, यह सही है" : "Yes, this is right"}</button>
                <span className="text-sm text-muted">{hi ? "कुछ ग़लत है? 'बदलें' दबाएँ।" : "Something wrong? Press 'Fix'."}</span>
              </>
            )}
          </div>
        )}
      </div>

      {viewing && docForEvidence && <DocViewer doc={docForEvidence} evidence={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}

/** Exactly what left the device: the anonymised text with every mask highlighted. */
function SentToAI() {
  const { state } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  if (!state.anonymisedPreview) return null;
  return (
    <More icon={<EyeOff size={18} />} title={hi ? "AI को असल में क्या भेजा गया" : "What the AI actually saw"} hint={hi ? "नाम और नंबर छिपाकर — ख़ुद देखें" : "Names and numbers hidden — see for yourself"}>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(state.piiCounts).map(([k, v]) => (
            <span key={k} className="chip bg-accent-soft text-accent">{v} {k.toLowerCase()} {hi ? "छिपाए" : "hidden"}</span>
          ))}
        </div>
        <pre className="mono max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-relaxed">
          {state.anonymisedPreview.split(/(\[[A-Z]+_\d+\])/).map((part, i) =>
            /^\[[A-Z]+_\d+\]$/.test(part) ? <mark key={i} className="rounded bg-amber-soft px-0.5 text-amber">{part}</mark> : <span key={i}>{part}</span>,
          )}
        </pre>
        <p className="text-xs text-muted">{hi ? "असली नाम और नंबर सिर्फ़ इस फ़ोन पर हैं; पत्र बनाते समय यहीं वापस भरे जाते हैं।" : "The real names and numbers stay on this phone and are filled back in here when letters are made."}</p>
      </div>
    </More>
  );
}

/** One question at a time — the one that could unlock the most money or the nearest deadline. */
function Questions() {
  const { state, dispatch, summary, trace } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [val, setVal] = useState("");

  const ranked = useMemo(() => rankQuestions(summary, 12).filter((r) => !state.skipped.includes(r.question.key)), [summary, state.skipped]);
  const top = ranked[0];

  const answer = (k: FactKey, v: Facts[FactKey], unlocks: string[]) => {
    dispatch({ type: "answer", key: k, value: v });
    trace("Questioner", `Asked "${FACT_LABELS[k].en}" — highest value of information`, { status: "done", detail: `could unlock: ${unlocks.join(", ")}` });
    setVal("");
  };

  return (
    <section>
      {summary.confirmedTotal + summary.possibleTotal > 0 && (
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-accent-soft px-4 py-3 text-accent">
          <span className="text-sm">{hi ? "अब तक मिला" : "Found so far"}</span>
          <b className="num-serif text-2xl">{formatINRShort(summary.confirmedTotal, lang)}</b>
          {summary.possibleTotal > 0 && <span className="text-sm">+ {formatINRShort(summary.possibleTotal, lang)} {hi ? "और संभव" : "more possible"}</span>}
        </div>
      )}

      {!top ? (
        <div className="card flex items-center gap-3 p-5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-white"><Check size={18} /></span>
          <div>
            <div className="font-semibold">{hi ? "बस, सवाल ख़त्म" : "That's all the questions"}</div>
            <div className="text-sm text-muted">{hi ? "अब देखिए आपको क्या-क्या मिल सकता है।" : "Next, see everything you may be owed."}</div>
          </div>
        </div>
      ) : (
        <div key={top.question.key} className="card step-enter p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="step-label">{hi ? "सवाल" : "Question"}</span>
            <span className="text-xs text-muted">{hi ? `लगभग ${ranked.length} बाकी` : `about ${ranked.length} left`}</span>
          </div>
          <h3 className="mt-2 font-display text-[1.5rem] leading-snug">{b(top.question.text)}</h3>
          {top.question.help && <p className="mt-1.5 text-ink-2">{b(top.question.help)}</p>}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {top.question.kind === "yesno" && (
              <>
                <button className="choice" onClick={() => answer(top.question.key, true, top.unlocks)}>{hi ? "हाँ" : "Yes"}</button>
                <button className="choice" onClick={() => answer(top.question.key, false, top.unlocks)}>{hi ? "नहीं" : "No"}</button>
              </>
            )}
            {top.question.kind === "choice" &&
              top.question.choices!.map((c) => (
                <button key={c.value} className="choice" onClick={() => answer(top.question.key, c.value as Facts[FactKey], top.unlocks)}>{b(c.label)}</button>
              ))}
            {(top.question.kind === "date" || top.question.kind === "number") && (
              <form
                className="flex gap-2 sm:col-span-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (val) answer(top.question.key, (top.question.kind === "number" ? Number(val) : val) as Facts[FactKey], top.unlocks);
                }}
              >
                <input type={top.question.kind} className="input !w-auto flex-1 sm:flex-none" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
                <button className="btn btn-primary" disabled={!val}>{hi ? "ठीक है" : "OK"}</button>
              </form>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button className="text-sm font-medium text-muted underline underline-offset-4 hover:text-ink" onClick={() => dispatch({ type: "patch", patch: { skipped: [...state.skipped, top.question.key] } })}>
              {hi ? "पता नहीं — छोड़ें" : "I don't know — skip"}
            </button>
            {top.unlocks.length > 0 && (
              <span className="text-xs text-muted">
                {hi ? "इससे पता चलेगा: " : "Helps decide: "}
                {top.unlocks.slice(0, 3).map((id) => b(RULES_BY_ID[id as keyof typeof RULES_BY_ID].short)).join(", ")}
                {top.unlocks.length > 3 ? ` +${top.unlocks.length - 3}` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** One page: confirm what was read, then answer only the questions that matter. */
export function StepCheck() {
  const { state, summary, trace, confirmFacts, go } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const hasDocs = state.docs.length > 0;
  return (
    <div>
      <StepIntro
        title={hasDocs ? (hi ? "क्या यह सही है?" : "Is this right?") : hi ? "बस कुछ सवाल" : "Just a few questions"}
        lead={
          hasDocs
            ? hi ? "आपके काग़ज़ों से हमने यह पढ़ा। जो ग़लत हो, ठीक करें — फिर कुछ छोटे सवाल।" : "Here's what we read from your papers. Fix anything that's wrong — then a few quick questions."
            : hi ? "हम सिर्फ़ वही पूछते हैं जिससे पैसा या कोई डेडलाइन तय होती है। 'पता नहीं' भी ठीक है।" : "We only ask what decides money or a deadline. 'I don't know' is always fine."
        }
      />
      <div className="space-y-10">
        {hasDocs && <FactsRead />}
        <div>
          {hasDocs && <h2 className="h-sec mb-4">{hi ? "कुछ छोटे सवाल" : "A few quick questions"}</h2>}
          <Questions />
        </div>
      </div>

      <ActionBar back="papers">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            if (hasDocs && !state.aiConfirmed) confirmFacts();
            trace("Rules", `Evaluated ${summary.results.length} entitlements (rules-as-code)`, {
              status: "done",
              detail: `${summary.counts.eligible} confirmed · ${summary.counts.possible} possible · ${summary.counts.not_eligible} not eligible`,
            });
            go("owed");
          }}
        >
          {hi ? "देखें क्या-क्या मिल सकता है" : "See what you're owed"} <ArrowRight size={18} />
        </button>
      </ActionBar>

      {state.anonymisedPreview && (
        <Extras title={hi ? "भरोसे के लिए" : "For peace of mind"}>
          <SentToAI />
        </Extras>
      )}
    </div>
  );
}
