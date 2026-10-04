"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Camera, FileImage, Loader2, Lock, Mic, MicOff, Play, Trash2, Upload } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { SAMPLE_CASES } from "@/lib/samples/cases";
import { FirstHours } from "./Support";

type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: (e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void; onend: () => void };

function useDictation(onText: (t: string) => void) {
  const [on, setOn] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  // Server renders "unsupported"; the client reads the real capability without a hydration mismatch.
  const supported = useSyncExternalStore(
    () => () => {},
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
    () => false,
  );
  const toggle = (lang: string) => {
    if (on) return rec.current?.stop();
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = false;
    r.continuous = true;
    r.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) if (e.results[i].isFinal) onText(e.results[i][0].transcript);
    };
    r.onend = () => setOn(false);
    rec.current = r;
    r.start();
    setOn(true);
  };
  return { on, toggle, supported };
}

export function StepTell() {
  const { state, dispatch, loadSample } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const dict = useDictation((t) => dispatch({ type: "patch", patch: { story: (state.story ? state.story + " " : "") + t } }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">{hi ? "हमें बताइए क्या हुआ" : "Tell us what happened"}</h2>
        <p className="mt-1 text-muted">{hi ? "अपने शब्दों में, जितना याद हो। नाम सिर्फ़ इस डिवाइस पर रहते हैं।" : "In your own words, as much as you remember. Names stay on this device."}</p>
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-amber underline decoration-dotted">
          {hi ? "क्या यह पिछले कुछ दिनों में हुआ? पहले ये ज़रूरी काम देखें →" : "Did this happen in the last few days? See what to do first →"}
        </summary>
        <div className="mt-3"><FirstHours /></div>
      </details>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">{hi ? "जिनके साथ दुर्घटना हुई, उनका नाम" : "Name of the person in the accident"}</span>
          <input className="input mt-1" value={state.victimName} onChange={(e) => dispatch({ type: "patch", patch: { victimName: e.target.value } })} placeholder={hi ? "जैसे रमेश कुमार" : "e.g. Ramesh Kumar"} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{hi ? "आपका नाम" : "Your name"}</span>
          <input className="input mt-1" value={state.claimantName} onChange={(e) => dispatch({ type: "patch", patch: { claimantName: e.target.value } })} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">{hi ? "आपका उनसे रिश्ता" : "Your relation to them"}</span>
          <select className="input mt-1" value={state.relation} onChange={(e) => dispatch({ type: "patch", patch: { relation: e.target.value } })}>
            <option value="">{hi ? "चुनें" : "Choose"}</option>
            {[
              ["wife", "Wife", "पत्नी"], ["husband", "Husband", "पति"], ["mother", "Mother", "माँ"], ["father", "Father", "पिता"],
              ["son", "Son", "बेटा"], ["daughter", "Daughter", "बेटी"], ["self", "It happened to me", "मेरे साथ हुआ"], ["caseworker", "Caseworker / paralegal helping a family", "परिवार की मदद कर रहे केसवर्कर / पैरालीगल"],
            ].map(([v, en, h]) => (
              <option key={v} value={v}>{hi ? h : en}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="flex items-center justify-between text-sm font-medium">
          {hi ? "क्या हुआ था? (वैकल्पिक)" : "What happened? (optional)"}
          {dict.supported && (
            <button type="button" onClick={() => dict.toggle(hi ? "hi-IN" : "en-IN")} className={`btn !px-3 !py-1 text-xs ${dict.on ? "btn-primary" : "btn-ghost"}`}>
              {dict.on ? <MicOff size={14} /> : <Mic size={14} />} {dict.on ? (hi ? "रोकें" : "Stop") : hi ? "बोलकर बताएँ" : "Speak"}
            </button>
          )}
        </span>
        <textarea
          className="input mt-1 min-h-28"
          value={state.story}
          onChange={(e) => dispatch({ type: "patch", patch: { story: e.target.value } })}
          placeholder={hi ? "जैसे: वे काम से बाइक पर घर लौट रहे थे, एक ट्रक ने टक्कर मारी और भाग गया…" : "e.g. He was riding home from work when a truck hit him and drove off…"}
        />
      </label>

      <p className="flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-sm text-accent">
        <Lock size={16} className="mt-0.5 shrink-0" /> {b({ en: "Your papers are read on this device. Names, phone, Aadhaar and account numbers are masked before anything is sent to AI. Nothing is stored on our server.", hi: "आपके काग़ज़ इसी डिवाइस पर पढ़े जाते हैं। AI को भेजने से पहले नाम, फ़ोन, आधार और खाता नंबर छिपा दिए जाते हैं। सर्वर पर कुछ सेव नहीं होता।" })}
      </p>

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" onClick={() => dispatch({ type: "step", step: "docs" })}>
          {hi ? "आगे: काग़ज़ात" : "Next: add papers"}
        </button>
      </div>

      <div className="border-t border-line pt-5">
        <div className="mb-2 text-sm font-semibold text-muted">{hi ? "या एक सैंपल केस आज़माएँ (काल्पनिक दस्तावेज़)" : "Or try a sample case (synthetic documents)"}</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLE_CASES.map((c) => (
            <button key={c.id} onClick={() => loadSample(c.id)} className="card p-3 text-left transition hover:border-accent">
              <div className="text-sm font-semibold">{b(c.title)}</div>
              <div className="mt-1 line-clamp-3 text-xs text-muted">{b(c.blurb)}</div>
              {c.redTeam && <span className="chip mt-2 bg-rose-soft text-rose">red-team</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepDocs() {
  const { state, dispatch, addFiles, readDocuments, autoPlay } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const [busy, setBusy] = useState(false);
  const play = async () => {
    setBusy(true);
    try {
      await autoPlay();
    } finally {
      setBusy(false);
    }
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const run = async () => {
    setBusy(true);
    try {
      await readDocuments();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">{hi ? "जो काग़ज़ हैं, उनकी फ़ोटो दें" : "Add photos of the papers you have"}</h2>
        <p className="mt-1 text-muted">
          {hi
            ? "एफ़आईआर, पासबुक का पन्ना, गाड़ी की बीमा पॉलिसी। जो नहीं है, छोड़ दें — हम सवाल पूछ लेंगे।"
            : "FIR, a passbook page, the vehicle insurance policy. Skip what you don't have — we'll ask instead."}
        </p>
      </div>

      <div
        className="card flex flex-col items-center gap-3 border-dashed p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="text-muted" />
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <FileImage size={16} /> {hi ? "फ़ोटो चुनें" : "Choose photos"}
          </button>
          <button className="btn btn-ghost sm:hidden" onClick={() => camRef.current?.click()}>
            <Camera size={16} /> {hi ? "कैमरा" : "Camera"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <p className="text-xs text-muted">{hi ? "फ़ोटो इसी डिवाइस पर पढ़ी जाती हैं, अपलोड नहीं होतीं।" : "Photos are read on this device. They are not uploaded."}</p>
      </div>


      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto">
        <button className="btn btn-ghost" onClick={() => dispatch({ type: "step", step: "tell" })} disabled={busy}>
          {hi ? "पीछे" : "Back"}
        </button>
        {state.sampleId && !busy && (
          <button className="btn btn-ghost" onClick={play}>
            <Play size={15} /> {hi ? "अपने-आप चलाएँ (जज मोड)" : "Auto-play (judge mode)"}
          </button>
        )}
        {state.docs.length > 0 ? (
          <button className="btn btn-primary" onClick={run} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? (hi ? "एजेंट काम कर रहे हैं…" : "Agents at work…") : hi ? "मेरे काग़ज़ पढ़ें" : "Read my papers"}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => dispatch({ type: "step", step: "questions" })}>
            {hi ? "काग़ज़ नहीं हैं — सवालों से आगे बढ़ें" : "No papers — continue with questions"}
          </button>
        )}
      </div>

      {state.docs.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:gap-3">
          {state.docs.map((d) => (
            <li key={d.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.src} alt={d.label} className="h-24 w-full border-b border-line object-cover object-top sm:h-36" />
              <div className="flex items-center gap-1 p-2 sm:gap-2 sm:p-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium sm:text-sm">{d.label}</div>
                  <div className="truncate text-[11px] text-muted sm:text-xs">
                    {d.status === "queued" && (hi ? "पढ़ने के लिए तैयार" : "Ready to read")}
                    {d.status === "reading" && `${hi ? "पढ़ रहे हैं" : "Reading"} ${Math.round(d.progress * 100)}%`}
                    {d.status === "parsed" && `${d.parsed?.kind ?? "read"} · ${Object.keys(d.parsed?.facts ?? {}).length} ${hi ? "तथ्य" : "facts"}`}
                    {d.status === "error" && (hi ? "नहीं पढ़ पाए" : "Couldn't read")}
                  </div>
                  {d.status === "reading" && (
                    <div className="mt-1 h-1 overflow-hidden rounded bg-line">
                      <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(d.progress * 100)}%` }} />
                    </div>
                  )}
                </div>
                {!busy && (
                  <button className="btn btn-ghost hidden !p-1.5 sm:inline-flex" aria-label={`Remove ${d.label}`} onClick={() => dispatch({ type: "removeDoc", id: d.id })}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
