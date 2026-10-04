"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldAlert, Sparkles } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { FACT_LABELS, formatFact } from "@/lib/engine/factLabels";
import { rankQuestions, type Question } from "@/lib/engine/questions";
import { RULES_BY_ID } from "@/lib/engine/rules";
import { formatINRShort } from "@/lib/engine/dates";
import { rehydrate } from "@/lib/privacy/pii";
import type { Evidence, FactKey, Facts } from "@/lib/engine/types";
import { SourceBadge } from "../ui";
import { DocViewer } from "./DocViewer";

function FactEditor({ k, value, onChange }: { k: FactKey; value: Facts[FactKey]; onChange: (v: Facts[FactKey]) => void }) {
  const { lang } = useLang();
  if (typeof value === "boolean" || value === null) {
    return (
      <select className="input !w-auto !py-1 text-sm" value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "true")}>
        <option value="">{lang === "hi" ? "पता नहीं" : "Unknown"}</option>
        <option value="true">{lang === "hi" ? "हाँ" : "Yes"}</option>
        <option value="false">{lang === "hi" ? "नहीं" : "No"}</option>
      </select>
    );
  }
  if (k === "accidentDate" || k === "lastCardTxnDate") return <input type="date" className="input !w-auto !py-1 text-sm" value={String(value)} onChange={(e) => onChange(e.target.value || null)} />;
  if (typeof value === "number") return <input type="number" className="input !w-28 !py-1 text-sm" value={value} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
  return <span className="text-sm">{formatFact(k, value, lang)}</span>;
}

export function StepFacts() {
  const { state, dispatch, facts, provenance, confirmFacts } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [viewing, setViewing] = useState<Evidence | null>(null);
  const [editing, setEditing] = useState<FactKey | null>(null);
  const [lens, setLens] = useState(false);

  const known = (Object.keys(FACT_LABELS) as FactKey[]).filter((k) => facts[k] !== null && k !== "state");
  const docForEvidence = viewing ? state.docs.find((d) => d.id === viewing.docId) : null;
  const summary = state.extraction ? rehydrate(hi ? state.extraction.summaryHi : state.extraction.summaryEn, state.piiTokens) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">{hi ? "हमने यह पढ़ा — क्या यह सही है?" : "Here's what we read — is it right?"}</h2>
        <p className="mt-1 text-muted">{hi ? "हर तथ्य के आगे लिखा है कि वह कहाँ से आया। साक्ष्य देखने के लिए उद्धरण पर टैप करें।" : "Each fact shows where it came from. Tap a quote to see it on the document."}</p>
      </div>

      {state.guardFlags.length > 0 && (
        <div className="rounded-xl border border-rose/30 bg-rose-soft p-4 text-sm text-rose">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert size={16} /> {hi ? "दस्तावेज़ में AI के लिए छिपा निर्देश मिला — उसे अनदेखा किया गया" : "We found hidden instructions to the AI inside a document — they were ignored"}
          </div>
          <ul className="mt-2 space-y-1">
            {state.guardFlags.map((l) => (
              <li key={l} className="mono rounded bg-white/60 px-2 py-1 text-xs line-through decoration-rose/60">{rehydrate(l, state.piiTokens)}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">{hi ? "इन पंक्तियों को AI तक नहीं भेजा गया। पात्रता और राशि हमेशा नियमों से तय होती है, AI से नहीं।" : "These lines were quarantined before reaching the AI. Eligibility and amounts always come from the rules, never from the AI."}</p>
        </div>
      )}

      {summary && (
        <div className="flex gap-2 rounded-xl bg-surface-2 p-3 text-sm">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-amber" />
          <span>{summary}</span>
        </div>
      )}

      <div className="card divide-y divide-line">
        {known.length === 0 && <div className="p-4 text-sm text-muted">{hi ? "अभी कोई तथ्य नहीं — अगले चरण में कुछ सवाल पूछेंगे।" : "No facts yet — we'll ask a few questions next."}</div>}
        {known.map((k) => {
          const p = provenance[k];
          return (
            <div key={k} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
              <div className="min-w-[10rem] flex-1">
                <div className="text-xs text-muted">{b(FACT_LABELS[k])}</div>
                {editing === k ? (
                  <FactEditor k={k} value={facts[k]} onChange={(v) => dispatch({ type: "answer", key: k, value: v })} />
                ) : (
                  <div className="font-semibold">{formatFact(k, facts[k], lang)}</div>
                )}
              </div>
              {p && <SourceBadge source={p.source} confirmed={p.confirmed || state.aiConfirmed} />}
              {p?.evidence && (
                <button className="max-w-full truncate rounded-md bg-surface-2 px-2 py-1 text-left text-xs text-ink-2 underline decoration-dotted sm:max-w-[16rem]" onClick={() => setViewing(p.evidence!)} title={p.evidence.quote}>
                  “{rehydrate(p.evidence.quote, state.piiTokens)}”
                </button>
              )}
              <button className="text-xs font-medium text-accent underline" onClick={() => setEditing(editing === k ? null : k)}>
                {editing === k ? (hi ? "हो गया" : "Done") : hi ? "बदलें" : "Edit"}
              </button>
            </div>
          );
        })}
      </div>

      {state.anonymisedPreview && (
        <div className="card p-4">
          <button className="flex items-center gap-2 text-sm font-semibold" onClick={() => setLens(!lens)}>
            {lens ? <EyeOff size={16} /> : <Eye size={16} />} {hi ? "देखें AI को असल में क्या भेजा गया" : "See exactly what was sent to the AI"}
          </button>
          {lens && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(state.piiCounts).map(([k, v]) => (
                  <span key={k} className="chip bg-accent-soft text-accent">{v} {k.toLowerCase()} masked</span>
                ))}
              </div>
              <pre className="mono max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-relaxed">
                {state.anonymisedPreview.split(/(\[[A-Z]+_\d+\])/).map((part, i) =>
                  /^\[[A-Z]+_\d+\]$/.test(part) ? <mark key={i} className="rounded bg-amber-soft px-0.5 text-amber">{part}</mark> : <span key={i}>{part}</span>,
                )}
              </pre>
              <p className="text-xs text-muted">{hi ? "असली नाम और नंबर सिर्फ़ इस डिवाइस पर हैं; पत्र बनाते समय यहीं वापस भरे जाते हैं।" : "The real names and numbers stay on this device and are filled back in here when letters are made."}</p>
            </div>
          )}
        </div>
      )}

      {known.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {state.aiConfirmed ? (
            <span className="chip bg-accent-soft py-1.5 text-accent">{hi ? "आपने पुष्टि की" : "You confirmed these"}</span>
          ) : (
            <button className="btn btn-primary" onClick={confirmFacts}>{hi ? "हाँ, यह सही है" : "Yes, this is right"}</button>
          )}
          <span className="text-sm text-muted">{hi ? "कुछ ग़लत है? ऊपर 'बदलें' दबाएँ।" : "Something wrong? Use 'Edit' above."}</span>
        </div>
      )}

      {viewing && docForEvidence && <DocViewer doc={docForEvidence} evidence={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function QuestionCard({ q, unlocks, onAnswer, onSkip }: { q: Question; unlocks: string[]; onAnswer: (v: Facts[FactKey]) => void; onSkip: () => void }) {
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [val, setVal] = useState("");
  return (
    <div className="card rise p-4">
      <div className="font-semibold">{b(q.text)}</div>
      {q.help && <div className="mt-0.5 text-sm text-muted">{b(q.help)}</div>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {unlocks.map((id) => (
          <span key={id} className="chip bg-accent-soft text-accent">{hi ? "खोलता है:" : "unlocks:"} {b(RULES_BY_ID[id as keyof typeof RULES_BY_ID].short)}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {q.kind === "yesno" && (
          <>
            <button className="btn btn-primary !py-2" onClick={() => onAnswer(true)}>{hi ? "हाँ" : "Yes"}</button>
            <button className="btn btn-ghost !py-2" onClick={() => onAnswer(false)}>{hi ? "नहीं" : "No"}</button>
          </>
        )}
        {q.kind === "choice" &&
          q.choices!.map((c) => (
            <button key={c.value} className="btn btn-ghost !py-2" onClick={() => onAnswer(c.value as Facts[FactKey])}>{b(c.label)}</button>
          ))}
        {(q.kind === "date" || q.kind === "number") && (
          <>
            <input type={q.kind} className="input !w-auto" value={val} onChange={(e) => setVal(e.target.value)} />
            <button className="btn btn-primary !py-2" disabled={!val} onClick={() => onAnswer((q.kind === "number" ? Number(val) : val) as Facts[FactKey])}>OK</button>
          </>
        )}
        <button className="btn !py-2 text-muted underline" onClick={onSkip}>{hi ? "पता नहीं" : "I don't know"}</button>
      </div>
    </div>
  );
}

export function StepQuestions() {
  const { state, dispatch, summary, trace } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";

  const ranked = useMemo(() => rankQuestions(summary, 12).filter((r) => !state.skipped.includes(r.question.key)).slice(0, 3), [summary, state.skipped]);

  const answer = (k: FactKey, v: Facts[FactKey], unlocks: string[]) => {
    dispatch({ type: "answer", key: k, value: v });
    trace("Questioner", `Asked "${FACT_LABELS[k].en}" — highest value of information`, { status: "done", detail: `could unlock: ${unlocks.join(", ")}` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">{hi ? "बस कुछ सवाल" : "Just a few questions"}</h2>
        <p className="mt-1 text-muted">
          {hi ? "हम सिर्फ़ वही पूछते हैं जिससे सबसे ज़्यादा पैसा या सबसे नज़दीकी डेडलाइन खुलती है।" : "We only ask what unlocks the most money or the nearest deadline — not a 40-field form."}
        </p>
      </div>

      {summary.confirmedTotal > 0 && (
        <div className="rounded-xl bg-accent-soft p-3 text-sm text-accent">
          {hi ? "अब तक पक्का:" : "Confirmed so far:"} <b>{formatINRShort(summary.confirmedTotal, lang)}</b>
          {summary.possibleTotal > 0 && <> · {hi ? "और संभव:" : "possible:"} {formatINRShort(summary.possibleTotal, lang)}</>}
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="card p-4 text-sm">{hi ? "कोई ज़रूरी सवाल बाकी नहीं।" : "No important questions left."}</div>
      ) : (
        <div className="space-y-3">
          {ranked.map((r) => (
            <QuestionCard
              key={r.question.key}
              q={r.question}
              unlocks={r.unlocks}
              onAnswer={(v) => answer(r.question.key, v, r.unlocks)}
              onSkip={() => dispatch({ type: "patch", patch: { skipped: [...state.skipped, r.question.key] } })}
            />
          ))}
        </div>
      )}

    </div>
  );
}

/** One page: confirm what was read, then answer only the questions that matter. */
export function StepCheck() {
  const { state, summary, trace, confirmFacts, go } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <div className="space-y-10">
      {state.docs.length > 0 && <StepFacts />}
      <StepQuestions />
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <button className="btn btn-ghost" onClick={() => go("papers")}>{hi ? "पीछे" : "Back"}</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (state.docs.length && !state.aiConfirmed) confirmFacts();
            trace("Rules", `Evaluated ${summary.results.length} entitlements (rules-as-code)`, {
              status: "done",
              detail: `${summary.counts.eligible} confirmed · ${summary.counts.possible} possible · ${summary.counts.not_eligible} not eligible`,
            });
            go("owed");
          }}
        >
          {hi ? "मेरा हक़ दिखाएँ" : "Show what we're owed"}
        </button>
      </div>
    </div>
  );
}
