"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowRight, CalendarPlus, CheckCircle2, FileCheck2, Fingerprint, Loader2, MessageCircle, PenLine, Printer, QrCode, ShieldX } from "lucide-react";
import { sha256Hex } from "@/lib/vault";
import { rehydrate } from "@/lib/privacy/pii";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/engine/dates";
import { assembleLetter, caseFactsSentence, firNumber, templateParagraphs, type Letter, type LetterContext } from "@/lib/case/letters";
import { buildIcs, encodeCase, googleCalendarLink, whatsappText } from "@/lib/case/outputs";
import { DaysLeft } from "../ui";

function LetterView({ l, approved, onApprove }: { l: Letter; approved: boolean; onApprove: (v: boolean) => void }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const blocks = l.verification.issues.filter((i) => i.severity === "block");
  return (
    <div className={`letter card p-5 ${approved ? "" : "no-print"}`}>
      <div className="no-print mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`chip ${l.source === "ai" ? "bg-amber-soft text-amber" : "bg-slate-soft text-ink-2"}`}>
          <PenLine size={11} /> {l.source === "ai" ? `AI draft${l.model ? ` · ${l.model}` : ""}` : hi ? "टेम्पलेट (AI ऑफ़लाइन)" : "template (no AI)"}
        </span>
        {l.verification.ok ? (
          <span className="chip bg-accent-soft text-accent">
            <CheckCircle2 size={11} /> {hi ? "जाँचा गया" : "Verified"}: {l.verification.checked.amounts} {hi ? "राशि" : "amounts"}, {l.verification.checked.dates} {hi ? "तारीख" : "dates"}
          </span>
        ) : (
          <span className="chip bg-rose-soft text-rose"><ShieldX size={11} /> {hi ? "रोका गया" : "Blocked by verifier"}</span>
        )}
        {l.verification.issues.filter((i) => i.severity === "warn").map((i) => <span key={i.code} className="chip bg-amber-soft text-amber">{i.message}</span>)}
      </div>
      {blocks.length > 0 && (
        <ul className="no-print mb-3 space-y-1 rounded-lg bg-rose-soft p-3 text-xs text-rose">{blocks.map((i, k) => <li key={k}>{i.message}</li>)}</ul>
      )}
      <div className="space-y-3 text-[15px] leading-relaxed">
        <div className="whitespace-pre-line">{l.to}</div>
        <div className="text-right text-sm">{hi ? "दिनांक" : "Date"}: {l.date}</div>
        <div className="font-semibold">{l.subject}</div>
        <div>{hi ? "महोदय/महोदया," : "Respected Sir/Madam,"}</div>
        {l.body.map((p, i) => <p key={i}>{p}</p>)}
        <div>
          <div className="font-semibold">{hi ? "संलग्नक:" : "Enclosures:"}</div>
          <ol className="list-decimal pl-5">{l.enclosures.map((e) => <li key={e}>{e}</li>)}</ol>
        </div>
        <div className="pt-6">
          <div>{hi ? "भवदीय/भवदीया," : "Yours faithfully,"}</div>
          <div className="mt-8 border-t border-dashed border-line pt-1 text-sm">{hi ? "हस्ताक्षर" : "Signature"}</div>
          {l.signature.map((s) => <div key={s}>{s}</div>)}
        </div>
      </div>
      <label className="no-print mt-4 flex items-center gap-2 rounded-lg bg-surface-2 p-3 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={approved} disabled={!l.verification.ok} onChange={(e) => onApprove(e.target.checked)} />
        {hi ? "मैंने यह पत्र पढ़ लिया है और यह सही है (प्रिंट पैकेट में जोड़ें)" : "I've read this letter and it's correct (add to the print packet)"}
      </label>
    </div>
  );
}

/** Tamper-evident manifest: SHA-256 of every document and approved letter, plus a packet fingerprint. */
function Manifest({ letters }: { letters: Record<string, Letter> }) {
  const { state, trace } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const [rows, setRows] = useState<{ name: string; hash: string }[]>([]);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [qr, setQr] = useState<string | null>(null);
  const approved = state.approvedLetters.filter((id) => letters[id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: { name: string; hash: string }[] = [];
      for (const d of state.docs) if (state.docHashes[d.id]) out.push({ name: `${hi ? "दस्तावेज़" : "Document"}: ${d.label}`, hash: state.docHashes[d.id] });
      for (const id of approved) {
        const l = letters[id];
        out.push({ name: `${hi ? "पत्र" : "Letter"}: ${l.subject.slice(0, 70)}`, hash: await sha256Hex([l.to, l.subject, ...l.body, ...l.enclosures, ...l.signature].join("\n")) });
      }
      const fp = out.length ? await sha256Hex(out.map((r) => r.hash).join("")) : "";
      const q = fp ? await QRCode.toDataURL(`rahbar:packet:sha256:${fp}`, { margin: 1, width: 140 }) : null;
      if (!cancelled) {
        setRows(out);
        setFingerprint(fp);
        setQr(q);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.docs, state.docHashes, approved.join(","), letters, hi]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows.length) return null;
  return (
    <section className="card letter p-4">
      <div className="flex items-center gap-2 font-semibold"><Fingerprint size={16} className="text-accent" /> {hi ? "छेड़छाड़-रोधी सूची (SHA-256)" : "Tamper-evident packet manifest (SHA-256)"}</div>
      <p className="mt-1 text-xs text-muted">
        {hi
          ? "हर दस्तावेज़ और पत्र का डिजिटल फ़िंगरप्रिंट। कोई भी फ़ाइल दोबारा हैश करके पुष्टि कर सकता है कि कुछ बदला नहीं गया — असली दावों को फ़र्ज़ी दावों से अलग दिखाने में मदद।"
          : "A digital fingerprint of every document and letter. Anyone can re-hash a file to confirm nothing was altered — helping genuine claims stand apart from fabricated ones."}
      </p>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        <ul className="min-w-0 flex-1 space-y-1">
          {rows.map((r) => (
            <li key={r.name} className="text-xs">
              <div className="truncate font-medium">{r.name}</div>
              <div className="mono break-all text-muted">{r.hash}</div>
            </li>
          ))}
          <li className="pt-1 text-xs">
            <div className="font-semibold">{hi ? "पैकेट फ़िंगरप्रिंट" : "Packet fingerprint"}</div>
            <div className="mono break-all text-accent">{fingerprint}</div>
          </li>
        </ul>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="Packet fingerprint QR" className="h-28 w-28 rounded border border-line" />}
      </div>
      <button className="no-print mt-2 text-xs text-muted underline" onClick={() => trace("Verifier", "Computed SHA-256 manifest for the claim packet", { status: "done", detail: `${rows.length} items · fingerprint ${fingerprint.slice(0, 16)}…` })}>
        {hi ? "ट्रेस में दर्ज करें" : "Log to trace"}
      </button>
    </section>
  );
}

export function StepPlan() {
  const { plan, summary, state, dispatch, facts, today, trace, traceUpdate, go } = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [letters, setLetters] = useState<Record<string, Letter>>({});
  const [drafting, setDrafting] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const actionable = summary.results.filter((r) => r.status === "eligible" && !r.informational);
  const firLines = state.docs.filter((d) => d.parsed?.kind === "fir").flatMap((d) => d.lines.map((l) => l.text));
  const ctx: LetterContext = { lang, victimName: state.victimName, claimantName: state.claimantName, relation: state.relation, firNo: firNumber(firLines), facts, today };

  const draftAll = async () => {
    setDrafting(true);
    const out: Record<string, Letter> = {};
    for (const r of actionable) {
      const tid = trace("Drafter", `Drafting the ${r.short.en} letter (${lang === "hi" ? "Hindi" : "English"})`);
      let letter: Letter;
      try {
        const res = await fetch("/api/agent/draft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lang, scheme: r.name[lang], office: r.office[lang], relation: state.relation || "family member", summary: caseFactsSentence(facts) }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error);
        const paras = { factsParagraph: rehydrate(j.data.factsParagraph, state.piiTokens), requestParagraph: rehydrate(j.data.requestParagraph, state.piiTokens) };
        letter = assembleLetter(r, ctx, paras, "ai", j.trace?.model);
        traceUpdate(tid, {
          status: "done",
          model: j.trace?.model,
          tokens: (j.trace?.inputTokens ?? 0) + (j.trace?.outputTokens ?? 0) || null,
          cached: j.trace?.cached,
          ms: j.trace?.ms,
          detail: j.critic?.model
            ? j.critic.revised
              ? `critic (${j.critic.model}) found ${j.critic.unsupported.length} unsupported claim(s) → redrafted · placeholders only`
              : `critic (${j.critic.model}) found no unsupported claims · placeholders only`
            : "placeholders only — real names filled in on this device",
        });
      } catch (e) {
        letter = assembleLetter(r, ctx, templateParagraphs(r, ctx), "template");
        traceUpdate(tid, { status: "skipped", detail: `AI unavailable (${(e as Error).message}) → deterministic template` });
      }
      const tv = trace("Verifier", `Checking every amount and date in the ${r.short.en} letter`);
      traceUpdate(tv, {
        status: letter.verification.ok ? "done" : "warn",
        detail: letter.verification.ok
          ? `${letter.verification.checked.amounts} amount(s) and ${letter.verification.checked.dates} date(s) match the rules`
          : `Blocked: ${letter.verification.issues.filter((i) => i.severity === "block").map((i) => i.code).join(", ")}`,
      });
      out[r.id] = letter;
      setLetters((prev) => ({ ...prev, [r.id]: letter }));
    }
    setDrafting(false);
  };

  const approve = (id: string, v: boolean) => {
    dispatch({ type: "patch", patch: { approvedLetters: v ? [...state.approvedLetters, id] : state.approvedLetters.filter((x) => x !== id) } });
    if (v) trace("Human", `Approved the ${id} letter for the print packet`, { status: "done" });
  };

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(plan, lang)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rahbar-deadlines.ics";
    a.click();
    trace("Human", "Added claim deadlines to the calendar (.ics with 7-day and 1-day reminders)", { status: "done" });
  };

  const showQr = async () => {
    const shareUrl = `${window.location.origin}/case#c=${encodeCase(facts)}`;
    setQr(await QRCode.toDataURL(shareUrl, { margin: 1, width: 220 }));
    trace("Human", "Created a caseworker handoff QR — facts only, no names or documents, nothing stored on a server", { status: "done" });
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="font-display text-2xl font-semibold">{hi ? "क्या करना है, किस क्रम में" : "What to do, in what order"}</h2>
        <p className="mt-1 text-muted">{hi ? "सबसे नज़दीकी डेडलाइन पहले।" : "Nearest deadline first."}</p>
      </div>

      <ol className="no-print space-y-3">
        {plan.claims.map((c, i) => (
          <li key={c.id} className="card flex gap-3 p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{b(c.title)}</span>
                <span className="text-sm text-muted">· {b(c.amountLabel)}</span>
                {c.status === "possible" && <span className="chip bg-amber-soft text-amber">{hi ? "पहले पुष्टि करें" : "confirm first"}</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                {c.deadlineDate ? <b>{formatDate(c.deadlineDate, lang)}</b> : null}
                <DaysLeft days={c.daysLeft} />
                <span className="text-muted">{b(c.deadlineLabel)}</span>
              </div>
              <div className="mt-1 text-sm text-ink-2">{b(c.office)}</div>
              {c.deadlineDate && (
                <a className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent underline" target="_blank" rel="noreferrer" href={googleCalendarLink(`Rahbar: ${c.title[lang]}`, c.deadlineDate, c.office[lang])}>
                  <CalendarPlus size={12} /> Google Calendar
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <section className="card p-4">
        <h3 className="font-semibold">{hi ? "इकट्ठा करने वाले काग़ज़" : "Papers to collect"}</h3>
        <ul className="mt-2 divide-y divide-line">
          {plan.documents.map((d) => (
            <li key={d.doc.key} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 text-sm">
              <FileCheck2 size={16} className="mt-0.5 text-accent" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{b(d.doc.name)} <span className="text-muted">× {d.copies} {hi ? "प्रतियाँ" : "copies"}</span></div>
                <div className="text-xs text-muted">{b(d.doc.whereToGet)} · {b(d.doc.cost)}</div>
              </div>
              <span className="chip bg-slate-soft text-ink-2">{hi ? `${d.neededBy.length} दावों के लिए` : `for ${d.neededBy.length} claims`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="no-print flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{hi ? "दावा पत्र" : "Claim letters"}</h3>
          <button className="btn btn-primary" onClick={draftAll} disabled={drafting || actionable.length === 0}>
            {drafting ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
            {Object.keys(letters).length ? (hi ? "फिर से बनाएँ" : "Redraft") : hi ? `${actionable.length} पत्र बनाएँ` : `Draft ${actionable.length} letters`}
          </button>
        </div>
        {actionable.map((r) => letters[r.id] && <LetterView key={r.id} l={letters[r.id]} approved={state.approvedLetters.includes(r.id)} onApprove={(v) => approve(r.id, v)} />)}
      </section>

      <section className="no-print card grid gap-3 p-4 sm:grid-cols-2">
        <button className="btn btn-ghost" onClick={() => { trace("Human", "Printed the approved claim packet", { status: "done" }); window.print(); }} disabled={state.approvedLetters.length === 0}>
          <Printer size={16} /> {hi ? "मंज़ूर पत्र प्रिंट / PDF" : "Print / save approved letters as PDF"}
        </button>
        <button className="btn btn-ghost" onClick={downloadIcs} disabled={!plan.claims.some((c) => c.deadlineDate)}>
          <CalendarPlus size={16} /> {hi ? "डेडलाइन कैलेंडर में जोड़ें" : "Add all deadlines to my calendar"}
        </button>
        <a className="btn btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(whatsappText(plan, lang))}`} target="_blank" rel="noreferrer" onClick={() => trace("Human", "Shared the plan on WhatsApp", { status: "done" })}>
          <MessageCircle size={16} /> {hi ? "परिवार से WhatsApp पर साझा करें" : "Share the plan on WhatsApp"}
        </a>
        <button className="btn btn-ghost" onClick={showQr}>
          <QrCode size={16} /> {hi ? "केसवर्कर के लिए QR" : "QR handoff for a caseworker"}
        </button>
        {qr && (
          <div className="flex items-center gap-3 sm:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Case handoff QR code" className="h-36 w-36 rounded-lg border border-line" />
            <p className="text-xs text-muted">
              {hi
                ? "इसमें सिर्फ़ तथ्य हैं — कोई नाम, नंबर या दस्तावेज़ नहीं। डेटा लिंक के # हिस्से में है, जो किसी सर्वर पर नहीं जाता।"
                : "Contains facts only — no names, numbers or documents. The data lives in the link's # fragment, which browsers never send to a server."}
            </p>
          </div>
        )}
      </section>

      <Manifest letters={letters} />

      <div className="no-print flex flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={() => go("owed")}>{hi ? "पीछे" : "Back"}</button>
        <button className="btn btn-primary" onClick={() => go("track")}>
          {hi ? "दावों पर नज़र रखें" : "Track the claims"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
