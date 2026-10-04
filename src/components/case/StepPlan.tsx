"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowRight, CalendarPlus, CheckCircle2, ChevronDown, FileCheck2, Fingerprint, Loader2, MessageCircle, PenLine, Printer, QrCode, ShieldX } from "lucide-react";
import { ActionBar, Extras, More, StepIntro } from "./Flow";
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
    <div className={`letter card step-enter p-5 sm:p-7 ${approved ? "ring-1 ring-accent/40" : "no-print"}`}>
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
      <label className={`no-print mt-5 flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm font-medium transition ${approved ? "border-accent/40 bg-accent-soft text-accent" : "border-line bg-surface-2"}`}>
        <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--accent)]" checked={approved} disabled={!l.verification.ok} onChange={(e) => onApprove(e.target.checked)} />
        {hi ? "मैंने यह पत्र पढ़ लिया है और यह सही है (प्रिंट पैकेट में जोड़ें)" : "I've read this letter and it's correct (add to the print packet)"}
      </label>
    </div>
  );
}

/** Tamper-evident manifest: SHA-256 of every document and approved letter, plus a packet fingerprint. */
function Manifest({ letters, bare = false }: { letters: Record<string, Letter>; bare?: boolean }) {
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
    <section className={bare ? "letter" : "card letter p-4"}>
      {!bare && <div className="flex items-center gap-2 font-semibold"><Fingerprint size={16} className="text-accent" /> {hi ? "छेड़छाड़-रोधी सूची (SHA-256)" : "Tamper-evident packet manifest (SHA-256)"}</div>}
      <p className={`${bare ? "" : "mt-1 "}text-xs text-muted`}>
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
  const [allDocs, setAllDocs] = useState(false);

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

  const canManifest = state.docs.some((d) => state.docHashes[d.id]) || state.approvedLetters.length > 0;
  const tile = "flex min-h-[64px] items-center gap-3 rounded-xl border border-line bg-surface p-3.5 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-line-strong disabled:pointer-events-none disabled:opacity-45";
  const tileIcon = "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-key-soft text-key";

  return (
    <div>
      <div className="no-print">
        <StepIntro
          title={hi ? "आपकी योजना, क्रम से" : "Your plan, in order"}
          lead={hi ? "सबसे नज़दीकी डेडलाइन पहले। पत्र बनवाएँ, पढ़ें, और जो सही हों उन पर निशान लगाएँ।" : "Nearest deadline first. Draft the letters, read them, and tick the ones that are right."}
        />
      </div>

      <section className="no-print">
        <h2 className="h-sec mb-5">{hi ? "क्या करना है" : "What to do"}</h2>
        <ol className="tl stagger">
          {plan.claims.map((c, i) => (
            <li key={c.id}>
              <span className="tl-n">{i + 1}</span>
              <div className="min-w-0 pt-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="font-semibold">{b(c.title)}</span>
                  <span className="num-serif text-lg text-ink-2">{b(c.amountLabel)}</span>
                  {c.status === "possible" && <span className="chip bg-amber-soft text-amber">{hi ? "पहले पुष्टि करें" : "confirm first"}</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                  {c.deadlineDate ? <b>{formatDate(c.deadlineDate, lang)}</b> : null}
                  <DaysLeft days={c.daysLeft} />
                  <span className="text-muted">{b(c.deadlineLabel)}</span>
                </div>
                <div className="mt-1 text-sm text-ink-2">{b(c.office)}</div>
                {c.deadlineDate && (
                  <a className="link-swipe mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-key" target="_blank" rel="noreferrer" href={googleCalendarLink(`Rahbar: ${c.title[lang]}`, c.deadlineDate, c.office[lang])}>
                    <CalendarPlus size={12} /> {hi ? "Google कैलेंडर में जोड़ें" : "Add to Google Calendar"}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="h-sec">{hi ? "दावा पत्र" : "Claim letters"}</h2>
            <p className="mt-1 text-sm text-muted">{hi ? "AI लिखता है, दूसरा AI तथ्य जाँचता है, फिर हर राशि और तारीख़ नियमों से मिलाई जाती है।" : "An AI writes, a second AI checks the facts, then every amount and date is matched to the rules."}</p>
          </div>
          <button className={`btn ${Object.keys(letters).length ? "btn-ghost" : "btn-primary"}`} onClick={draftAll} disabled={drafting || actionable.length === 0}>
            {drafting ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
            {drafting ? (hi ? "लिख रहे हैं…" : "Writing…") : Object.keys(letters).length ? (hi ? "फिर से लिखें" : "Redraft") : hi ? `${actionable.length} पत्र लिखें` : `Write ${actionable.length} letters`}
          </button>
        </div>
        {actionable.map((r) => letters[r.id] && <LetterView key={r.id} l={letters[r.id]} approved={state.approvedLetters.includes(r.id)} onApprove={(v) => approve(r.id, v)} />)}
      </section>

      <section className="no-print mt-10">
        <h2 className="h-sec">{hi ? "इकट्ठा करने वाले काग़ज़" : "Papers to collect"}</h2>
        <p className="mt-1 text-sm text-muted">{hi ? "हर काग़ज़ एक बार — कितनी प्रतियाँ, कहाँ से।" : "Each paper once — how many copies, and where to get it."}</p>
        <ul className="card mt-4 divide-y divide-line">
          {(allDocs ? plan.documents : plan.documents.slice(0, 5)).map((d) => (
            <li key={d.doc.key} className="flex items-start gap-3 px-4 py-3 text-sm">
              <FileCheck2 size={17} className="mt-0.5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{b(d.doc.name)} <span className="font-normal text-muted">× {d.copies}</span></div>
                <div className="text-xs text-muted">{b(d.doc.whereToGet)} · {b(d.doc.cost)}</div>
              </div>
              <span className="chip shrink-0 bg-slate-soft text-ink-2">{hi ? `${d.neededBy.length} दावे` : `${d.neededBy.length} claim${d.neededBy.length > 1 ? "s" : ""}`}</span>
            </li>
          ))}
          {plan.documents.length > 5 && (
            <li>
              <button className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-key hover:bg-key-soft/50" onClick={() => setAllDocs(!allDocs)} aria-expanded={allDocs}>
                {allDocs ? (hi ? "कम दिखाएँ" : "Show fewer") : hi ? `सभी ${plan.documents.length} काग़ज़ देखें` : `Show all ${plan.documents.length} papers`}
                <ChevronDown size={16} className={`transition-transform ${allDocs ? "rotate-180" : ""}`} />
              </button>
            </li>
          )}
        </ul>
      </section>

      <section className="no-print mt-10">
        <h2 className="h-sec">{hi ? "सेव करें और साझा करें" : "Save and share"}</h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <button className={tile} onClick={() => { trace("Human", "Printed the approved claim packet", { status: "done" }); window.print(); }} disabled={state.approvedLetters.length === 0}>
            <span className={tileIcon}><Printer size={18} /></span>
            <span>{hi ? "मंज़ूर पत्र प्रिंट / PDF" : "Print or save approved letters"}{state.approvedLetters.length === 0 && <span className="block text-xs font-normal text-muted">{hi ? "पहले किसी पत्र पर निशान लगाएँ" : "Tick a letter first"}</span>}</span>
          </button>
          <button className={tile} onClick={downloadIcs} disabled={!plan.claims.some((c) => c.deadlineDate)}>
            <span className={tileIcon}><CalendarPlus size={18} /></span>
            {hi ? "सारी डेडलाइन कैलेंडर में" : "All deadlines to my calendar"}
          </button>
          <a className={tile} href={`https://wa.me/?text=${encodeURIComponent(whatsappText(plan, lang))}`} target="_blank" rel="noreferrer" onClick={() => trace("Human", "Shared the plan on WhatsApp", { status: "done" })}>
            <span className={tileIcon}><MessageCircle size={18} /></span>
            {hi ? "परिवार को WhatsApp पर भेजें" : "Send the plan on WhatsApp"}
          </a>
          <button className={tile} onClick={showQr}>
            <span className={tileIcon}><QrCode size={18} /></span>
            {hi ? "केसवर्कर के लिए QR" : "QR code for a caseworker"}
          </button>
          {qr && (
            <div className="step-enter flex items-center gap-4 rounded-xl border border-line bg-surface p-4 sm:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Case handoff QR code" className="h-32 w-32 rounded-lg border border-line" />
              <p className="text-sm text-muted">
                {hi
                  ? "इसमें सिर्फ़ तथ्य हैं — कोई नाम, नंबर या काग़ज़ नहीं। डेटा लिंक के # हिस्से में है, जो किसी सर्वर पर नहीं जाता।"
                  : "Facts only — no names, numbers or papers. The data lives in the link's # part, which browsers never send to a server."}
              </p>
            </div>
          )}
        </div>
      </section>

      <ActionBar back="owed">
        <button className="btn btn-primary btn-lg" onClick={() => go("track")}>
          {hi ? "आगे: दावों पर नज़र" : "Next: follow up on claims"} <ArrowRight size={18} />
        </button>
      </ActionBar>

      {canManifest && (
        <div className="no-print">
          <Extras title={hi ? "अधिकारियों के लिए" : "For officials"}>
            <More icon={<Fingerprint size={18} />} title={hi ? "छेड़छाड़-रोधी फ़िंगरप्रिंट" : "Tamper-proof fingerprint"} hint={hi ? "कोई भी जाँच सकता है कि कुछ बदला नहीं गया" : "Anyone can check that nothing was changed"}>
              <Manifest letters={letters} bare />
            </More>
          </Extras>
        </div>
      )}
      {/* The printed packet always ends with its manifest. */}
      {state.approvedLetters.length > 0 && (
        <div className="print-only">
          <Manifest letters={letters} />
        </div>
      )}
    </div>
  );
}
