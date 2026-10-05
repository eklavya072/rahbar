"use client";

/**
 * Saathi (साथी): Rahbar's guide, in Hindi, English or Hinglish, by voice or text.
 *
 * Order of work for every message, cheapest and safest first:
 *   1. distress  → Tele-MANAS 14416, before anything else
 *   2. touts     → "nobody needs a cut", free lawyer 15100
 *   3. glossary  → plain-language legal terms, no AI needed
 *   4. the page  → "what do I do here?" for the exact step
 *   5. the AI    → names/numbers masked on the phone first; every rupee comes
 *                  from rules-engine tools, shown as chips under the reply
 * On case pages Saathi can also run the intake as a conversation: it asks the
 * single most valuable next question and says what each answer unlocked.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, Lock, Mic, MicOff, Phone, Volume2, VolumeX, X } from "lucide-react";
import { useMaybeCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { rankQuestions, type Question } from "@/lib/engine/questions";
import { formatINR } from "@/lib/engine/dates";
import { FACT_LABELS } from "@/lib/engine/factLabels";
import { rehydrate, shield } from "@/lib/privacy/pii";
import type { FactKey, Facts } from "@/lib/engine/types";
import type { Step } from "@/lib/case/state";
import { CRISIS_REPLY, TOUT_REPLY, detectScript, findTerm, isCrisis, isTout, navIntent, pageHelp, type Lang, type Script } from "@/lib/guide/knowledge";

type Act = { label: string; href?: string; tel?: string; step?: Step; say?: string; answer?: { key: FactKey; value: Facts[FactKey]; label: string }; skip?: FactKey; interview?: boolean; primary?: boolean };
type Msg = { id: number; role: "user" | "bot"; text: string; tone?: "crisis" | "tout" | "saved" | "question"; tools?: string[]; masked?: number; offline?: boolean; acts?: Act[] };

const TOOL_NAMES: Record<string, { en: string; hi: string }> = {
  listEntitlements: { en: "all claims checked", hi: "सभी दावे जाँचे" },
  getPlan: { en: "deadline plan", hi: "समय-सीमा योजना" },
  simulateWhatIf: { en: "what-if re-run", hi: "अगर-तो जाँच" },
  explainTerm: { en: "glossary", hi: "शब्दकोश" },
};

type Rec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: (e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void; onend: () => void; onerror: () => void };
const hasSpeechIn = () => typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

let seq = 1;
const YES = /^(yes|yeah|haan|han|ha|haa|ji|ji haan|sahi|हाँ|हां|हा|जी|जी हाँ|सही)\b/i;
const NO = /^(no|nope|nahi|nahin|na|नहीं|नही|ना)\b/i;
const DONT_KNOW = /pata nahi|pata nahin|don'?t know|not sure|पता नहीं|मालूम नहीं|maloom nahi/i;

export function Saathi() {
  const ctx = useMaybeCase();
  const path = usePathname() ?? "/";
  const router = useRouter();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [listening, setListening] = useState(false);
  const canListen = useSyncExternalStore(() => () => {}, hasSpeechIn, () => false);
  const listRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<Rec | null>(null);
  const pendingQ = useRef<Question | null>(null);
  const savedFrom = useRef<number | null>(null);
  const history = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const onCase = !!ctx && path.startsWith("/case/");

  const speak = useCallback(
    (t: string) => {
      if (!speakOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(t);
      const deva = /[ऀ-ॿ]/.test(t);
      u.lang = deva ? "hi-IN" : "en-IN";
      u.rate = 0.95;
      const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith(deva ? "hi" : "en-IN"));
      if (v) u.voice = v;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [speakOn],
  );

  const push = useCallback(
    (m: Omit<Msg, "id">) => {
      setMsgs((xs) => [...xs, { ...m, id: seq++ }]);
      if (m.role === "bot") speak(m.text);
    },
    [speak],
  );

  // Greeting tuned to where the person is.
  useEffect(() => {
    if (!open || msgs.length) return;
    const t = setTimeout(() => {
      const acts: Act[] = onCase
        ? [
            { label: hi ? "इस पन्ने पर क्या करूँ?" : "What do I do on this page?", say: hi ? "यहाँ क्या करना है?" : "What do I do here?" },
            { label: hi ? "सवाल बोलकर पूछिए" : "Ask me the questions by voice", interview: true, primary: true },
            { label: hi ? "सबसे पहले क्या करूँ?" : "What should I do first?", say: hi ? "सबसे पहले क्या करना चाहिए?" : "What should I do first?" },
            { label: hi ? "एजेंट पैसे में हिस्सा माँग रहा है" : "An agent wants a cut of the money", say: hi ? "एक एजेंट कह रहा है कि मुआवज़े का 30% उसे दूँ" : "An agent says I must give him 30% of the compensation" },
          ]
        : [
            { label: hi ? "मेरे परिवार को क्या मिल सकता है?" : "What can my family claim?", say: hi ? "हादसे के बाद मेरे परिवार को क्या-क्या मिल सकता है?" : "What can my family claim after a road accident?" },
            { label: hi ? "अपना केस शुरू करें" : "Start my case", href: "/case", primary: true },
            { label: hi ? "FIR क्या होती है?" : "What is an FIR?", say: hi ? "FIR क्या होती है?" : "What is an FIR?" },
            { label: hi ? "एजेंट पैसे में हिस्सा माँग रहा है" : "An agent wants a cut of the money", say: hi ? "एक एजेंट कह रहा है कि मुआवज़े का 30% उसे दूँ" : "An agent says I must give him 30% of the compensation" },
          ];
      push({
        role: "bot",
        text: hi
          ? "नमस्ते। मैं साथी हूँ। हादसे के बाद के हक़ के बारे में कुछ भी पूछिए, हिंदी या अंग्रेज़ी में। माइक दबाकर बोल भी सकते हैं।"
          : "Namaste. I'm Saathi. Ask me anything about claims after an accident, in Hindi or English. You can also press the mic and speak.",
        acts,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [open, msgs.length, onCase, hi, push]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // ── Conversational intake ──────────────────────────────────────────────
  const askNext = useCallback(() => {
    if (!ctx) return;
    const ranked = rankQuestions(ctx.summary, 12).filter((r) => !ctx.state.skipped.includes(r.question.key) && ctx.facts[r.question.key] === null);
    const top = ranked[0];
    pendingQ.current = top?.question ?? null;
    if (!top) {
      push({
        role: "bot",
        tone: "saved",
        text: hi ? `बस, सवाल ख़त्म। अब तक पक्का: ${formatINR(ctx.summary.confirmedTotal)}।` : `That's all the questions. Confirmed so far: ${formatINR(ctx.summary.confirmedTotal)}.`,
        acts: [{ label: hi ? "देखें क्या-क्या मिल सकता है" : "See what you're owed", step: "owed", primary: true }],
      });
      return;
    }
    const q = top.question;
    const acts: Act[] =
      q.kind === "yesno"
        ? [
            { label: hi ? "हाँ" : "Yes", answer: { key: q.key, value: true as Facts[FactKey], label: hi ? "हाँ" : "Yes" }, primary: true },
            { label: hi ? "नहीं" : "No", answer: { key: q.key, value: false as Facts[FactKey], label: hi ? "नहीं" : "No" } },
          ]
        : q.kind === "choice"
          ? q.choices!.map((c) => ({ label: b(c.label), answer: { key: q.key, value: c.value as Facts[FactKey], label: b(c.label) } }))
          : [];
    acts.push({ label: hi ? "पता नहीं" : "I don't know", skip: q.key });
    push({
      role: "bot",
      tone: "question",
      text: b(q.text) + (q.help ? `\n${b(q.help)}` : "") + (q.kind === "date" || q.kind === "number" ? (hi ? "\n(नीचे लिखकर जवाब दें)" : "\n(Type your answer below)") : ""),
      acts,
    });
  }, [ctx, hi, b, push]);

  const record = useCallback(
    (key: FactKey, value: Facts[FactKey]) => {
      if (!ctx) return;
      savedFrom.current = ctx.summary.confirmedTotal;
      ctx.dispatch({ type: "answer", key, value });
      ctx.trace("Questioner", `Saathi asked "${FACT_LABELS[key].en}" by conversation`, { status: "done" });
      pendingQ.current = null;
    },
    [ctx],
  );

  // After an answer lands, say what it unlocked, then ask the next one.
  const answers = ctx?.state.answers;
  useEffect(() => {
    if (savedFrom.current === null || !ctx) return;
    const before = savedFrom.current;
    savedFrom.current = null;
    const now = ctx.summary.confirmedTotal;
    const t = setTimeout(() => {
      push({
        role: "bot",
        tone: "saved",
        text:
          now > before
            ? hi
              ? `सेव हो गया। इससे ${formatINR(now - before)} और पक्का हुआ। अब तक: ${formatINR(now)}।`
              : `Saved. That just confirmed ${formatINR(now - before)} more. Total so far: ${formatINR(now)}.`
            : hi
              ? `सेव हो गया। अब तक पक्का: ${formatINR(now)}।`
              : `Saved. Confirmed so far: ${formatINR(now)}.`,
      });
      askNext();
    }, 250);
    return () => clearTimeout(t);
  }, [answers, ctx, hi, push, askNext]);

  // ── One message, through the layers ────────────────────────────────────
  const send = useCallback(
    async (raw: string) => {
      const t = raw.trim();
      if (!t || busy) return;
      setText("");
      push({ role: "user", text: t });
      const script: Script = detectScript(t, lang);
      const rl: Lang = script === "en" ? "en" : "hi";

      // A pending interview question answered in words.
      const q = pendingQ.current;
      if (q && ctx) {
        if (DONT_KNOW.test(t)) {
          ctx.dispatch({ type: "patch", patch: { skipped: [...ctx.state.skipped, q.key] } });
          pendingQ.current = null;
          setTimeout(askNext, 200);
          return;
        }
        if (q.kind === "yesno" && (YES.test(t) || NO.test(t))) return record(q.key, YES.test(t) as Facts[FactKey]);
        if (q.kind === "choice") {
          const c = q.choices!.find((c) => [c.label.en, c.label.hi].some((l) => l.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(l.toLowerCase().split(" ")[0])));
          if (c) return record(q.key, c.value as Facts[FactKey]);
        }
        if (q.kind === "number" && /\d/.test(t)) return record(q.key, Number(t.replace(/[^\d]/g, "")) as Facts[FactKey]);
        if (q.kind === "choice" && t.split(/\s+/).length <= 4) {
          return push({ role: "bot", text: rl === "hi" ? "कृपया ऊपर दिए जवाबों में से एक चुनें, या अपने शब्दों में थोड़ा और बताइए।" : "Please tap one of the answers above, or say a little more in your own words." });
        }
        if (q.kind === "date") {
          const m = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/) ?? t.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (m) {
            const iso = m[1].length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
            return record(q.key, iso as Facts[FactKey]);
          }
        }
      }

      if (isCrisis(t)) {
        return push({ role: "bot", tone: "crisis", text: CRISIS_REPLY[rl], acts: [{ label: "Tele-MANAS 14416", tel: "14416", primary: true }, { label: hi ? "आपातकाल 112" : "Emergency 112", tel: "112" }] });
      }
      if (isTout(t)) {
        return push({ role: "bot", tone: "tout", text: TOUT_REPLY[rl], acts: [{ label: hi ? "मुफ़्त वकील 15100" : "Free lawyer 15100", tel: "15100", primary: true }, { label: rl === "hi" ? "मेरा हक़ क्या है?" : "What am I entitled to?", say: rl === "hi" ? "मेरे परिवार को क्या मिल सकता है?" : "What can my family claim?" }] });
      }
      const term = findTerm(t);
      if (term) return push({ role: "bot", text: `${term[rl].name}: ${term[rl].body}`, tools: ["explainTerm"] });

      const intent = navIntent(t);
      if (intent === "help") return push({ role: "bot", text: pageHelp(path, rl), acts: onCase && path.endsWith("/check") ? [{ label: rl === "hi" ? "सवाल यहीं पूछिए" : "Ask me the questions here", interview: true, primary: true }] : undefined });
      if (intent === "start" && !onCase) return push({ role: "bot", text: rl === "hi" ? "चलिए शुरू करते हैं। पहले बताइए क्या हुआ, फिर काग़ज़ों की फ़ोटो दीजिए। सब कुछ इसी फ़ोन पर रहता है।" : "Let's begin. First tell us what happened, then add photos of your papers. Everything stays on this phone.", acts: [{ label: rl === "hi" ? "अपना केस शुरू करें" : "Start your case", href: "/case", primary: true }] });
      if (intent === "sample") return push({ role: "bot", text: rl === "hi" ? "सैंपल केस में एक काल्पनिक परिवार के काग़ज़ हैं। 'अपने-आप चलाएँ' दबाने पर पूरा केस 20 सेकंड में चलता है।" : "The sample case uses a made-up family's papers. Press 'Auto-play' and the whole case runs in about 20 seconds.", acts: [{ label: rl === "hi" ? "सैंपल केस खोलें" : "Open the sample case", href: "/case?sample=sunita", primary: true }] });
      if (intent === "offer") return push({ role: "bot", text: rl === "hi" ? "बीमा कंपनी का प्रस्ताव मानने से पहले उसे जाँच लें, मानते ही दावा बंद हो जाता है।" : "Check an insurer's offer before you accept it. Once accepted, the claim is closed.", acts: [{ label: rl === "hi" ? "प्रस्ताव जाँचें" : "Check the offer", href: "/offer", primary: true }] });
      if (intent === "papers" && onCase && !path.endsWith("/papers")) return push({ role: "bot", text: pageHelp("/case/papers", rl), acts: [{ label: rl === "hi" ? "काग़ज़ वाले पन्ने पर जाएँ" : "Go to your papers", step: "papers", primary: true }] });
      if (intent === "letters" && onCase) return push({ role: "bot", text: pageHelp("/case/plan", rl), acts: [{ label: rl === "hi" ? "योजना और पत्र" : "Plan & letters", step: "plan", primary: true }] });

      // The AI, with names and numbers masked on this phone first.
      const names = ctx ? [ctx.state.victimName, ctx.state.claimantName].filter(Boolean) : [];
      const sh = shield(t, names);
      const masked = Object.keys(sh.tokens).length;
      const context = ctx
        ? `page ${path}; ${ctx.summary.counts.eligible} claims confirmed, ${ctx.summary.counts.possible} possible; confirmed total ${formatINR(ctx.summary.confirmedTotal)}`
        : `page ${path}; no case started yet (general questions)`;
      setBusy(true);
      try {
        const r = await fetch("/api/agent/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question: sh.text, facts: ctx ? ctx.facts : {}, today: ctx?.today, history: history.current.slice(-6), lang: rl, style: script, context }),
        }).then((x) => x.json());
        const answer = rehydrate(String(r.answer ?? r.error ?? ""), sh.tokens)
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/^#+\s*/gm, "")
          .replace(/\n{3,}/g, "\n\n");
        history.current.push({ role: "user", content: sh.text }, { role: "assistant", content: String(r.answer ?? "") });
        push({ role: "bot", text: answer, tools: (r.toolCalls ?? []).map((x: { name: string }) => x.name), masked, offline: !r.model });
        ctx?.trace("Case Agent", `Saathi: "${sh.text.slice(0, 60)}"`, { status: r.model ? "done" : "warn", model: r.model, detail: r.toolCalls?.length ? `tools: ${r.toolCalls.map((x: { name: string }) => x.name).join(", ")}` : "answered" });
      } catch {
        push({ role: "bot", offline: true, text: (rl === "hi" ? "अभी AI से जुड़ नहीं पा रहे। तब तक: " : "I can't reach the AI right now. Meanwhile: ") + pageHelp(path, rl) });
      } finally {
        setBusy(false);
      }
    },
    [busy, push, lang, ctx, askNext, record, hi, path, onCase],
  );

  const act = (a: Act) => {
    if (a.href) router.push(a.href);
    else if (a.step && ctx) ctx.go(a.step);
    else if (a.say) send(a.say);
    else if (a.interview) askNext();
    else if (a.answer) {
      push({ role: "user", text: a.answer.label });
      record(a.answer.key, a.answer.value);
    } else if (a.skip && ctx) {
      push({ role: "user", text: a.label });
      ctx.dispatch({ type: "patch", patch: { skipped: [...ctx.state.skipped, a.skip] } });
      pendingQ.current = null;
      setTimeout(askNext, 200);
    }
  };

  const listen = () => {
    if (listening) return recRef.current?.stop();
    const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = hi ? "hi-IN" : "en-IN";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const said = Array.from(e.results).map((x) => x[0].transcript).join(" ");
      if (said.trim()) send(said);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <>
      {!open && (
        <button className={`saathi-launch no-print${onCase ? " is-case" : ""}`} onClick={() => setOpen(true)} aria-label={hi ? "साथी से पूछें" : "Ask Saathi, the guide"}>
          <span className="saathi-launch-mic" aria-hidden><Mic size={16} /></span>
          <span>{hi ? "साथी से पूछें" : "Ask Saathi"}</span>
          <span className="saathi-launch-sub" lang="hi" aria-hidden>{hi ? "Ask" : "साथी"}</span>
        </button>
      )}
      {open && (
        <section className={`saathi no-print${onCase ? " is-case" : ""}`} role="dialog" aria-label={hi ? "साथी, आपका गाइड" : "Saathi, your guide"}>
          <header className="saathi-head">
            <div className="min-w-0">
              <div className="saathi-title">Saathi <span lang="hi">साथी</span></div>
              <div className="saathi-sub">{hi ? "हिंदी या अंग्रेज़ी में, बोलकर या लिखकर" : "Hindi or English, by voice or text"}</div>
            </div>
            <button className="saathi-icon" onClick={() => { setSpeakOn(!speakOn); if (speakOn) window.speechSynthesis?.cancel(); }} aria-pressed={speakOn} aria-label={speakOn ? (hi ? "आवाज़ बंद" : "Stop reading aloud") : hi ? "जवाब पढ़कर सुनाएँ" : "Read replies aloud"}>
              {speakOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button className="saathi-icon" onClick={() => setOpen(false)} aria-label={hi ? "बंद करें" : "Close"}><X size={18} /></button>
          </header>

          <div ref={listRef} className="saathi-list" data-lenis-prevent aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`saathi-msg is-${m.role}${m.tone ? ` is-${m.tone}` : ""}`}>
                <p className="saathi-text">{m.text}</p>
                {(m.tools?.length || m.masked || m.offline) && (
                  <div className="saathi-meta">
                    {m.masked ? <span><Lock size={11} /> {hi ? `${m.masked} जानकारी भेजने से पहले छिपाई` : `${m.masked} detail${m.masked > 1 ? "s" : ""} hidden before sending`}</span> : null}
                    {m.tools?.map((t, i) => <span key={i}>{hi ? "जाँचा: " : "Checked: "}{TOOL_NAMES[t] ? TOOL_NAMES[t][lang] : t}</span>)}
                    {m.offline ? <span>{hi ? "बिना AI के जवाब" : "answered without AI"}</span> : null}
                  </div>
                )}
                {m.acts && (
                  <div className="saathi-acts">
                    {m.acts.map((a) =>
                      a.tel ? (
                        <a key={a.label} href={`tel:${a.tel}`} className={`saathi-act${a.primary ? " is-primary" : ""}`}>
                          <Phone size={13} /> {a.label}
                        </a>
                      ) : (
                        <button key={a.label} className={`saathi-act${a.primary ? " is-primary" : ""}`} onClick={() => act(a)}>
                          {a.label}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="saathi-msg is-bot"><span className="saathi-typing" aria-label={hi ? "सोच रहा है" : "Thinking"}><i /><i /><i /></span></div>}
          </div>

          <form className="saathi-compose" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            {canListen && (
              <button type="button" className={`saathi-mic${listening ? " is-on" : ""}`} onClick={listen} aria-pressed={listening} aria-label={listening ? (hi ? "रोकें" : "Stop listening") : hi ? "बोलिए" : "Speak"}>
                {listening ? <MicOff size={19} /> : <Mic size={19} />}
              </button>
            )}
            <input className="saathi-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? (hi ? "सुन रहा हूँ…" : "Listening…") : hi ? "लिखें या माइक दबाकर बोलें" : "Type, or press the mic and speak"} aria-label={hi ? "आपका सवाल" : "Your question"} />
            <button className="saathi-send" disabled={!text.trim() || busy} aria-label={hi ? "भेजें" : "Send"}><ArrowUp size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}

/** Saathi on every page that has no case of its own (the case pages mount it inside their provider). */
export function SaathiOutsideCase() {
  const path = usePathname() ?? "/";
  if (path.startsWith("/case")) return null;
  return <Saathi />;
}
