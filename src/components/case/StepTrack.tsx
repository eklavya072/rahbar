"use client";

import { useEffect, useRef, useState } from "react";
import { AlarmClock, Download, KeyRound, Lock, Save, Trash2, Upload } from "lucide-react";
import { ActionBar, Extras, More, StepIntro } from "./Flow";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { CLOCKS, escalationLetter, payoutWindow, trackStatus, type Stage } from "@/lib/engine/tracker";
import { formatDate, formatINR, formatINRShort } from "@/lib/engine/dates";
import { downloadSealed, listSaved, removeSealed, seal, storeSealed, unseal, type SealedCase } from "@/lib/vault";
import type { EntitlementResult } from "@/lib/engine/types";
import type { CaseState } from "@/lib/case/state";
import { SupportCard } from "./Support";

const STAGES: { v: Stage; en: string; hi: string }[] = [
  { v: "not_started", en: "Not filed yet", hi: "अभी जमा नहीं" },
  { v: "filed", en: "Filed", hi: "जमा किया" },
  { v: "paid", en: "Paid", hi: "भुगतान मिला" },
  { v: "rejected", en: "Rejected", hi: "खारिज" },
];

/** "When does the money arrive?" — horizontal timeline on a compressed time axis. */
function CashFlow({ items }: { items: EntitlementResult[] }) {
  const { state, today } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const ticks = [0, 30, 90, 180, 365, 1095];
  const pos = (d: number) => {
    // piecewise-linear compression so weeks and years both fit
    for (let i = 1; i < ticks.length; i++) if (d <= ticks[i]) return ((i - 1) + (d - ticks[i - 1]) / (ticks[i] - ticks[i - 1])) / (ticks.length - 1);
    return 1;
  };
  const rows = items.map((r) => ({ r, w: payoutWindow(r.id, state.tracks[r.id], today) }));
  const within90 = rows.filter(({ r, w }) => w[1] <= 90 && r.amount.value && r.id !== "RAHAT").reduce((a, { r }) => a + (r.amount.value ?? 0), 0);

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="h-sec">{hi ? "पैसा कब आ सकता है" : "When the money may arrive"}</h2>
      <p className="mt-1 text-sm text-muted">
        {hi
          ? `लगभग ${formatINRShort(within90, lang)} 90 दिनों में आ सकता है। 69% परिवार इलाज के लिए ऊँचे ब्याज पर उधार लेते हैं। इन दावों को पहले जमा करें।`
          : `About ${formatINRShort(within90, lang)} could arrive within 90 days. 69% of families hit by a road accident borrow at high interest. File these first.`}
      </p>
      <div className="mt-4 space-y-2.5">
        {rows.map(({ r, w }) => {
          const left = pos(w[0]) * 100;
          const width = Math.max(2, (pos(w[1]) - pos(w[0])) * 100);
          const fast = w[1] <= 90;
          return (
            <div key={r.id} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-xs sm:grid-cols-[minmax(0,12rem)_1fr]">
              <div className="truncate font-medium text-ink-2" title={b(r.short)}>{b(r.short)}</div>
              <div className="relative h-5 rounded-full bg-surface-2">
                <div className={`absolute top-0 h-5 rounded-full ${state.tracks[r.id]?.stage === "paid" ? "bg-accent" : fast ? "bg-key-bright" : "bg-line-strong"}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${w[0]}-${w[1]} days`} />
              </div>
            </div>
          );
        })}
        <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 text-[10px] text-muted sm:grid-cols-[minmax(0,12rem)_1fr]">
          <div />
          <div className="relative h-4">
            {ticks.map((t, i) => (
              <span key={t} className="absolute -translate-x-1/2" style={{ left: `${(i / (ticks.length - 1)) * 100}%` }}>
                {t === 0 ? (hi ? "आज" : "today") : t < 365 ? `${Math.round(t / 30)}${hi ? " माह" : "m"}` : `${t / 365}${hi ? " वर्ष" : "y"}`}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted">{hi ? "अवधियाँ नियमों की समय-सीमा पर आधारित हैं; MACT मामलों में औसतन 3.6 साल लगते हैं।" : "Windows are based on statutory timelines; contested MACT cases average 3.6 years."}</p>
    </section>
  );
}

function Tracker({ r }: { r: EntitlementResult }) {
  const { state, dispatch, today, trace } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const t = state.tracks[r.id] ?? { id: r.id, stage: "not_started" as Stage };
  const st = trackStatus(t, today);
  const clock = CLOCKS[r.id];
  const [letter, setLetter] = useState<string | null>(null);
  const canEscalate = st.nextStep && st.nextStepFrom && st.nextStepFrom <= today;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{b(r.short)}</div>
          <div className="text-xs text-muted">{b(clock.tatLabel)}</div>
        </div>
      </div>
      <div role="radiogroup" aria-label={hi ? "स्थिति" : "Status"} className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1">
        {STAGES.map((s) => {
          const on = t.stage === s.v;
          return (
            <button
              key={s.v}
              role="radio"
              aria-checked={on}
              className={`min-h-10 rounded-lg px-1.5 text-xs font-medium transition sm:text-sm ${on ? (s.v === "paid" ? "bg-accent text-white" : s.v === "rejected" ? "bg-rose text-white" : "bg-surface text-ink shadow-sm ring-1 ring-line") : "text-muted hover:text-ink"}`}
              onClick={() => {
                const stage = s.v;
                dispatch({ type: "track", id: r.id, patch: { stage, ...(stage === "filed" && !t.filedOn ? { filedOn: today } : {}), ...(stage === "paid" ? { paidOn: today } : {}) } });
                trace("Human", `Marked ${r.id} as ${stage}`, { status: "done" });
              }}
            >
              {hi ? s.hi : s.en}
            </button>
          );
        })}
      </div>

      {t.stage === "filed" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5">
            {hi ? "जमा किया" : "Filed on"}
            <input type="date" className="input !w-auto !py-1" value={t.filedOn ?? ""} max={today} onChange={(e) => dispatch({ type: "track", id: r.id, patch: { filedOn: e.target.value } })} />
          </label>
          {st.dueBy && (
            <span className={`chip ${st.overdueBy > 0 ? "bg-rose-soft text-rose" : "bg-slate-soft text-ink-2"}`}>
              <AlarmClock size={11} />
              {st.overdueBy > 0 ? (hi ? `${st.overdueBy} दिन देर` : `${st.overdueBy} days overdue`) : hi ? `${formatDate(st.dueBy, lang)} तक` : `due ${formatDate(st.dueBy, lang)}`}
            </span>
          )}
          {clock.interest && st.overdueBy > 0 && <span className="text-xs text-rose">{b(clock.interest)}</span>}
        </div>
      )}

      {t.stage === "filed" && st.nextStep && (
        <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{hi ? "अगला क़दम" : "Next escalation"} · {hi ? "स्तर" : "level"} {st.nextStep.level}</div>
          <div className="mt-0.5 font-medium">{b(st.nextStep.to)}</div>
          <div className="text-xs text-muted">{b(st.nextStep.how)}</div>
          <button
            className="btn btn-primary mt-2 !px-3 !py-1.5 text-sm"
            disabled={!canEscalate}
            onClick={() => {
              setLetter(escalationLetter(t, st.nextStep!, { lang, claimName: r.name, claimant: state.claimantName || (hi ? "[आपका नाम]" : "[Your name]"), victim: state.victimName || "[name]", today }));
              dispatch({ type: "track", id: r.id, patch: { escalatedLevel: st.nextStep!.level, escalatedOn: today } });
              trace("Planner", `Escalation drafted for ${r.id} → level ${st.nextStep!.level}`, { status: "done", detail: st.nextStep!.to.en });
            }}
          >
            {canEscalate ? (hi ? "शिकायत पत्र बनाएँ" : "Draft the escalation") : hi ? `${formatDate(st.nextStepFrom!, lang)} से उपलब्ध` : `Available from ${formatDate(st.nextStepFrom!, lang)}`}
          </button>
        </div>
      )}
      {letter && <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 text-sm">{letter}</pre>}
      {t.stage === "paid" && <div className="mt-2 text-sm text-accent">{hi ? "भुगतान दर्ज हुआ" : "Payment recorded"} · {t.paidOn && formatDate(t.paidOn, lang)}</div>}
    </div>
  );
}

type VaultPayload = Pick<CaseState, "victimName" | "claimantName" | "relation" | "story" | "answers" | "aiFacts" | "aiConfirmed" | "tracks" | "family" | "offer" | "approvedLetters" | "sampleId"> & {
  docs: { id: string; label: string; parsed: CaseState["docs"][number]["parsed"]; lines: CaseState["docs"][number]["lines"] }[];
};

function Vault({ bare = false }: { bare?: boolean }) {
  const { state, dispatch, trace } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const [pass, setPass] = useState("");
  const [label, setLabel] = useState("");
  const [saved, setSaved] = useState<SealedCase[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setSaved(listSaved()), 0);
    return () => clearTimeout(t);
  }, []);

  const payload = (): VaultPayload => ({
    victimName: state.victimName, claimantName: state.claimantName, relation: state.relation, story: state.story, answers: state.answers,
    aiFacts: state.aiFacts, aiConfirmed: state.aiConfirmed, tracks: state.tracks, family: state.family, offer: state.offer,
    approvedLetters: state.approvedLetters, sampleId: state.sampleId,
    docs: state.docs.map((d) => ({ id: d.id, label: d.label, parsed: d.parsed, lines: d.lines })),
  });

  const restore = (p: VaultPayload) => {
    dispatch({
      type: "reset",
      state: {
        ...p,
        step: "track",
        docs: p.docs.map((d) => ({ id: d.id, label: d.label, src: "", status: "parsed", progress: 1, lines: d.lines, parsed: d.parsed })),
      },
    });
    trace("Human", "Unlocked a saved case from the encrypted vault", { status: "done" });
  };

  const doSave = async (download: boolean) => {
    if (pass.length < 6) return setMsg(hi ? "कम से कम 6 अक्षरों का पासफ़्रेज़" : "Use a passphrase of at least 6 characters");
    const s = await seal(payload(), pass, label || `Case ${new Date().toLocaleDateString("en-IN")}`);
    if (download) downloadSealed(s);
    else if (!storeSealed(s)) return setMsg(hi ? "इस ब्राउज़र में सेव नहीं हो सका। फ़ाइल डाउनलोड करें" : "Couldn't save in this browser. Download the file instead");
    setSaved(listSaved());
    setMsg(hi ? "AES-256 से एन्क्रिप्ट कर सेव किया गया" : "Encrypted with AES-256 and saved");
    trace("Human", download ? "Exported the case as an encrypted .rahbar file" : "Saved the case to this device's encrypted vault", { status: "done", detail: "AES-256-GCM · PBKDF2-SHA-256 310k · key never leaves the device" });
  };

  const open = async (s: SealedCase) => {
    try {
      restore(await unseal<VaultPayload>(s, pass));
      setMsg(null);
    } catch {
      setMsg(hi ? "पासफ़्रेज़ ग़लत है" : "Wrong passphrase");
    }
  };

  return (
    <section className={bare ? "" : "card p-4"}>
      {!bare && <div className="flex items-center gap-2 font-semibold"><Lock size={16} className="text-accent" /> {hi ? "एन्क्रिप्टेड केस तिजोरी" : "Encrypted case vault"}</div>}
      <p className={`${bare ? "" : "mt-1 "}text-sm text-muted`}>
        {hi
          ? "केस महीनों चलते हैं। पासफ़्रेज़ से एन्क्रिप्ट करके इसी डिवाइस पर सेव करें या फ़ाइल के रूप में केसवर्कर को दें। हमारा सर्वर कभी नहीं देखता।"
          : "Claims take months. Encrypt the case with a passphrase and keep it on this device, or hand the file to a caseworker. Our server never sees it."}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder={hi ? "केस का नाम (वैकल्पिक)" : "Case name (optional)"} value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className="input" type="password" placeholder={hi ? "पासफ़्रेज़" : "Passphrase"} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="btn btn-primary !py-2" onClick={() => doSave(false)}><Save size={15} /> {hi ? "इस डिवाइस पर सेव" : "Save on this device"}</button>
        <button className="btn btn-ghost !py-2" onClick={() => doSave(true)}><Download size={15} /> {hi ? "एन्क्रिप्टेड फ़ाइल" : "Encrypted file"}</button>
        <button className="btn btn-ghost !py-2" onClick={() => fileRef.current?.click()}><Upload size={15} /> {hi ? "फ़ाइल खोलें" : "Open a file"}</button>
        <input
          ref={fileRef}
          type="file"
          accept=".rahbar,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              await open(JSON.parse(await f.text()) as SealedCase);
            } catch {
              setMsg(hi ? "फ़ाइल नहीं खुली" : "Couldn't open that file");
            }
          }}
        />
      </div>
      {msg && <p className="mt-2 text-sm text-ink-2">{msg}</p>}
      {saved.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {saved.map((s) => (
            <li key={s.label} className="flex items-center gap-2 px-3 py-2 text-sm">
              <KeyRound size={14} className="text-muted" />
              <span className="flex-1 truncate">{s.label}</span>
              <span className="text-xs text-muted">{new Date(s.savedAt).toLocaleString("en-IN")}</span>
              <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => open(s)}>{hi ? "खोलें" : "Unlock"}</button>
              <button className="btn btn-ghost !p-1.5" aria-label="Delete saved case" onClick={() => { removeSealed(s.label); setSaved(listSaved()); }}><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StepTrack() {
  const { summary } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const items = summary.results.filter((r) => r.status !== "not_eligible" && (r.id === "BANK_BALANCE" || !r.informational));
  const total = summary.confirmedTotal;
  const openVault = () => {
    const el = document.getElementById("vault") as HTMLDetailsElement | null;
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <StepIntro
        title={hi ? "हर दावे पर नज़र रखें" : "Follow up on every claim"}
        lead={
          hi
            ? `जमा करने पर निशान लगाएँ। कोई दफ़्तर देर करे, तो रहबर अगला शिकायत पत्र लिख देता है, टूटे नियम के साथ। कुल पक्का: ${formatINR(total)}।`
            : `Mark each claim when you file it. If an office is late, Rahbar writes the next complaint, with the rule it broke. Confirmed total: ${formatINR(total)}.`
        }
      />
      <CashFlow items={items} />
      <section className="mt-10">
        <h2 className="h-sec mb-4">{hi ? "आपके दावे" : "Your claims"}</h2>
        <div className="stagger space-y-3">{items.map((r) => <Tracker key={r.id} r={r} />)}</div>
      </section>

      <ActionBar back="plan">
        <button className="btn btn-primary btn-lg" onClick={openVault}>
          <Lock size={17} /> {hi ? "केस सुरक्षित सेव करें" : "Save this case safely"}
        </button>
      </ActionBar>

      <Extras title={hi ? "बाद के लिए" : "For later"}>
        <More id="vault" icon={<Lock size={18} />} title={hi ? "केस को ताले में सेव करें" : "Save the case under lock"} hint={hi ? "पासफ़्रेज़ से एन्क्रिप्टेड। सिर्फ़ आप खोल सकते हैं" : "Encrypted with your passphrase. Only you can open it"}>
          <Vault bare />
        </More>
        <SupportCard />
      </Extras>
    </div>
  );
}
