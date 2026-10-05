"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, BookOpen, Camera, FileText, ImagePlus, Loader2, Lock, Mic, MicOff, Play, ShieldCheck, Siren, Trash2 } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { SAMPLE_CASES } from "@/lib/samples/cases";
import { ActionBar, More, StepIntro, WorkingSteps } from "./Flow";
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

const RELATIONS: [string, string, string][] = [
  ["wife", "Wife", "पत्नी"], ["husband", "Husband", "पति"], ["mother", "Mother", "माँ"], ["father", "Father", "पिता"],
  ["son", "Son", "बेटा"], ["daughter", "Daughter", "बेटी"], ["self", "It happened to me", "मेरे साथ हुआ"], ["caseworker", "I'm helping a family", "मैं परिवार की मदद कर रहा/रही हूँ"],
];

export function StepTell() {
  const { state, dispatch, loadSample, go } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const dict = useDictation((t) => dispatch({ type: "patch", patch: { story: (state.story ? state.story + " " : "") + t } }));
  const self = state.relation === "self";

  return (
    <div>
      <StepIntro
        title={hi ? "हमें बताइए क्या हुआ" : "Tell us what happened"}
        lead={hi ? "जितना पता है, बस उतना। कुछ भी छोड़ सकते हैं और बाद में बदल सकते हैं।" : "Only what you know. You can skip anything, and change it later."}
      />

      <More icon={<Siren size={18} />} title={hi ? "क्या हादसा पिछले कुछ दिनों में हुआ?" : "Did this happen in the last few days?"} hint={hi ? "पहले 48 घंटों में सबसे ज़रूरी 7 बातें" : "Seven things that matter most in the first 48 hours"}>
        <FirstHours />
      </More>

      <div className="stagger mt-8 space-y-8">
        <fieldset>
          <legend className="h-sec">{hi ? "आप उनके क्या लगते हैं?" : "Who are you to them?"}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RELATIONS.map(([v, en, h]) => (
              <button
                key={v}
                type="button"
                className="choice justify-center text-center"
                aria-pressed={state.relation === v}
                onClick={() => dispatch({ type: "patch", patch: { relation: v } })}
              >
                {hi ? h : en}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-medium">{self ? (hi ? "आपका नाम" : "Your name") : hi ? "जिनके साथ हादसा हुआ, उनका नाम" : "Name of the person in the accident"}</span>
            <input className="input mt-1.5" value={state.victimName} onChange={(e) => dispatch({ type: "patch", patch: { victimName: e.target.value } })} placeholder={hi ? "जैसे रमेश कुमार" : "e.g. Ramesh Kumar"} />
          </label>
          {!self && (
            <label className="block">
              <span className="font-medium">{hi ? "आपका नाम" : "Your name"}</span>
              <input className="input mt-1.5" value={state.claimantName} onChange={(e) => dispatch({ type: "patch", patch: { claimantName: e.target.value } })} placeholder={hi ? "पत्रों पर यही नाम आएगा" : "Used on the letters"} />
            </label>
          )}
        </div>

        <label className="block">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{hi ? "क्या हुआ था?" : "What happened?"} <span className="font-normal text-muted">{hi ? "(वैकल्पिक)" : "(optional)"}</span></span>
            {dict.supported && (
              <button type="button" onClick={() => dict.toggle(hi ? "hi-IN" : "en-IN")} className={`btn !min-h-9 !px-3.5 !py-1.5 text-sm ${dict.on ? "btn-primary" : "btn-ghost"}`}>
                {dict.on ? <MicOff size={15} /> : <Mic size={15} />} {dict.on ? (hi ? "रोकें" : "Stop") : hi ? "बोलकर बताएँ" : "Speak instead"}
              </button>
            )}
          </span>
          <textarea
            className="input mt-1.5 min-h-32"
            value={state.story}
            onChange={(e) => dispatch({ type: "patch", patch: { story: e.target.value } })}
            placeholder={hi ? "जैसे: वे काम से बाइक पर घर लौट रहे थे, एक ट्रक ने टक्कर मारी और भाग गया…" : "e.g. He was riding home from work when a truck hit him and drove off…"}
          />
        </label>

        <p className="flex items-start gap-2.5 text-sm text-ink-2">
          <Lock size={16} className="mt-0.5 shrink-0 text-accent" />
          {b({ en: "Everything stays on this phone. Names, phone, Aadhaar and account numbers are hidden before anything reaches the AI.", hi: "सब कुछ इसी फ़ोन पर रहता है। AI तक कुछ भी पहुँचने से पहले नाम, फ़ोन, आधार और खाता नंबर छिपा दिए जाते हैं।" })}
        </p>
      </div>

      <ActionBar>
        <button className="btn btn-primary btn-lg" onClick={() => go("papers")}>
          {hi ? "आगे: काग़ज़" : "Next: your papers"} <ArrowRight size={18} />
        </button>
      </ActionBar>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="h-sec">{hi ? "बस देख रहे हैं?" : "Just looking?"}</h2>
        <p className="mt-1.5 text-ink-2">{hi ? "एक सैंपल परिवार का केस खोलें। सारे नाम और काग़ज़ काल्पनिक हैं।" : "Open a sample family's case. All names and papers are made up."}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SAMPLE_CASES.map((c) => (
            <button key={c.id} onClick={() => loadSample(c.id)} className="card group p-4 text-left transition hover:-translate-y-0.5 hover:border-line-strong">
              <div className="font-semibold">{b(c.title)}</div>
              <div className="mt-1 line-clamp-3 text-sm text-muted">{b(c.blurb)}</div>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-key">
                {c.redTeam && <span className="chip bg-rose-soft text-rose">{hi ? "सुरक्षा जाँच" : "red-team"}</span>}
                {hi ? "खोलें" : "Open"} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function StepDocs() {
  const { state, dispatch, addFiles, readDocuments, autoPlay, go } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const [busy, setBusy] = useState(false);
  const [since, setSince] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const run = async (auto: boolean) => {
    setSince(Date.now());
    setBusy(true);
    try {
      await (auto ? autoPlay() : readDocuments());
    } finally {
      setBusy(false);
    }
  };

  const kinds = [
    { icon: <FileText size={18} />, en: "Police report (FIR)", hi: "पुलिस रिपोर्ट (FIR)", whyEn: "Who was involved, and when", whyHi: "कौन शामिल था, और कब" },
    { icon: <BookOpen size={18} />, en: "Bank passbook page", hi: "बैंक पासबुक का पन्ना", whyEn: "Can show insurance you didn't know about", whyHi: "ऐसा बीमा दिखा सकता है जिसका पता नहीं था" },
    { icon: <ShieldCheck size={18} />, en: "Vehicle insurance policy", hi: "गाड़ी की बीमा पॉलिसी", whyEn: "Often includes ₹15 lakh owner-driver cover", whyHi: "अक्सर ₹15 लाख का मालिक-चालक कवर होता है" },
  ];

  return (
    <div>
      <StepIntro
        title={hi ? "अपने काग़ज़ों की फ़ोटो दें" : "Add photos of your papers"}
        lead={hi ? "जो है, बस वही। जो नहीं है, छोड़ दें, उसकी जगह हम एक सवाल पूछ लेंगे।" : "Whatever you have. Skip what you don't and we'll ask a question instead."}
      />

      {busy ? (
        <WorkingSteps since={since} />
      ) : (
        <div className="stagger space-y-6">
          {state.sampleId && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-key/30 bg-key-soft p-4">
              <Play size={18} className="shrink-0 text-key" />
              <p className="min-w-0 flex-1 text-sm text-ink-2">
                {hi ? "यह एक सैंपल परिवार के काल्पनिक काग़ज़ हैं। ख़ुद आगे बढ़ें, या पूरा केस अपने-आप चलने दें।" : "These are a sample family's made-up papers. Go step by step, or let the whole case play by itself."}
              </p>
              <button className="btn btn-ghost !min-h-10 bg-surface text-sm" onClick={() => run(true)}>
                <Play size={14} /> {hi ? "अपने-आप चलाएँ" : "Auto-play"}
              </button>
            </div>
          )}

          <div>
            <h2 className="t-label">{hi ? "सबसे काम के काग़ज़" : "The papers that help most"}</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {kinds.map((k) => (
                <li key={k.en} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-2">{k.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{hi ? k.hi : k.en}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">{hi ? k.whyHi : k.whyEn}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line-strong bg-surface/60 px-5 py-8 text-center transition hover:border-key hover:bg-surface"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-key-soft text-key transition group-hover:scale-105"><ImagePlus size={24} /></span>
            <div>
              <div className="font-semibold">{hi ? "फ़ोटो लें या गैलरी से चुनें" : "Take a photo or choose from your gallery"}</div>
              <div className="mt-1 text-sm text-muted">{hi ? "फ़ोटो इसी फ़ोन पर पढ़ी जाती हैं। कहीं अपलोड नहीं होतीं।" : "Photos are read on this phone. They are never uploaded."}</div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button className="btn btn-primary sm:hidden" onClick={() => camRef.current?.click()}>
                <Camera size={17} /> {hi ? "फ़ोटो लें" : "Take a photo"}
              </button>
              <button className="btn btn-ghost bg-surface" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={17} /> {hi ? "गैलरी से चुनें" : "Choose photos"}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          {state.docs.length > 0 && (
            <div>
              <h2 className="t-label">{hi ? `${state.docs.length} काग़ज़ जोड़े गए` : `${state.docs.length} paper${state.docs.length > 1 ? "s" : ""} added`}</h2>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {state.docs.map((d) => (
                  <li key={d.id} className="card overflow-hidden">
                    {d.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.src} alt={d.label} className="h-28 w-full border-b border-line object-cover object-top sm:h-36" />
                    ) : (
                      <div className="grid h-28 place-items-center border-b border-line bg-surface-2 px-2 text-center text-[11px] text-muted sm:h-36">{hi ? "फ़ोटो सेव नहीं होती; पढ़े गए तथ्य सुरक्षित हैं" : "Photo not kept; the facts read from it are"}</div>
                    )}
                    <div className="flex items-center gap-1 p-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{d.label}</div>
                        <div className="truncate text-xs text-muted">
                          {d.status === "queued" && (hi ? "पढ़ने के लिए तैयार" : "Ready to read")}
                          {d.status === "reading" && `${hi ? "पढ़ रहे हैं" : "Reading"} ${Math.round(d.progress * 100)}%`}
                          {d.status === "parsed" && `${hi ? "पढ़ लिया" : "Read"} · ${Object.keys(d.parsed?.facts ?? {}).length} ${hi ? "तथ्य" : "facts"}`}
                          {d.status === "error" && (hi ? "नहीं पढ़ पाए" : "Couldn't read")}
                        </div>
                      </div>
                      <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-rose" aria-label={`${hi ? "हटाएँ" : "Remove"} ${d.label}`} onClick={() => dispatch({ type: "removeDoc", id: d.id })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ActionBar back="story">
        {state.docs.length > 0 ? (
          <button className="btn btn-primary btn-lg" onClick={() => run(false)} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            {busy ? (hi ? "पढ़ रहे हैं…" : "Reading…") : hi ? `${state.docs.length} काग़ज़ पढ़ें` : `Read my ${state.docs.length} paper${state.docs.length > 1 ? "s" : ""}`}
            {!busy && <ArrowRight size={18} />}
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => go("check")}>
            {hi ? "काग़ज़ नहीं हैं? सवालों से आगे" : "No papers? Answer questions instead"} <ArrowRight size={18} />
          </button>
        )}
      </ActionBar>
    </div>
  );
}
