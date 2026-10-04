"use client";

import { useState } from "react";
import { Calculator, ClipboardCopy, ExternalLink, Landmark, Scale, TrendingUp } from "lucide-react";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import { auditOffer, estimateDeath, offerReply, type Employment, type MactInput, type OfferInput } from "@/lib/engine/mact";
import { formatDate, formatINR } from "@/lib/engine/dates";
import type { Evidence } from "@/lib/engine/types";
import { DocViewer } from "./DocViewer";

const EMP: { v: Employment; en: string; hi: string }[] = [
  { v: "permanent", en: "Permanent job", hi: "स्थायी नौकरी" },
  { v: "fixed_wage", en: "Fixed salary (private)", hi: "निश्चित वेतन (निजी)" },
  { v: "self_employed", en: "Self-employed / gig / daily wage", hi: "स्वरोज़गार / गिग / दिहाड़ी" },
  { v: "not_earning", en: "Homemaker / student / child", hi: "गृहिणी / छात्र / बच्चा" },
];

/** Reconstructed income from passbook credits — evidence against a minimum-wage assumption. */
export function IncomeEvidenceCard({ bare = false }: { bare?: boolean }) {
  const { income, state, facts } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const [view, setView] = useState<Evidence | null>(null);
  if (!income || !income.monthly) return null;
  const docId = (income.credits[0].line as unknown as { docId?: string }).docId;
  const doc = state.docs.find((d) => d.id === docId);

  return (
    <section className={bare ? "" : "card p-4"}>
      {!bare && <div className="flex items-center gap-2 font-semibold"><TrendingUp size={17} className="text-accent" /> {hi ? "आय का सबूत — पासबुक से" : "Income evidence — from the passbook"}</div>}
      <p className={`${bare ? "" : "mt-1 "}text-sm text-muted`}>
        {hi
          ? "बिना सैलरी स्लिप के ट्रिब्यूनल अक्सर न्यूनतम मज़दूरी मान लेते हैं। नियमित क्रेडिट असली कमाई का सबूत हैं (दिल्ली HC, 2026: न्यूनतम मज़दूरी सिर्फ़ एक पैमाना है)।"
          : "Without payslips, tribunals often assume minimum wage. Regular credits are evidence of real earnings (Delhi HC, 2026: minimum wage is only a guiding benchmark)."}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <div className="text-xs text-muted">{hi ? "औसत मासिक आय" : "Monthly income shown"}</div>
          <div className="num-serif text-3xl">{formatINR(income.monthly)}</div>
        </div>
        <div className="text-sm text-ink-2">
          {income.credits.length} {hi ? "क्रेडिट" : "credits"} · {income.months.length} {hi ? "महीने" : "months"} · {income.payers.join(", ")}
          {income.regular && <span className="chip ml-2 bg-accent-soft text-accent">{hi ? "नियमित" : "regular"}</span>}
        </div>
      </div>
      <ul className="mt-3 space-y-1">
        {income.credits.map((c, i) => (
          <li key={i}>
            <button className="w-full truncate rounded-md bg-surface-2 px-2 py-1 text-left text-xs underline decoration-dotted" onClick={() => setView({ docId: docId ?? "", docLabel: doc?.label ?? "", quote: c.line.text, bbox: c.line.bbox })}>
              {formatDate(c.date, lang)} · {formatINR(c.amount)} · “{c.line.text}”
            </button>
          </li>
        ))}
      </ul>
      {facts.accidentDate && <p className="mt-2 text-xs text-muted">{hi ? "सिर्फ़ दुर्घटना से पहले के क्रेडिट गिने गए।" : "Only credits before the accident are counted."}</p>}
      {view && doc && <DocViewer doc={doc} evidence={view} onClose={() => setView(null)} />}
    </section>
  );
}

function Num({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <label className="block text-sm">
      <span className="text-xs text-muted">{label}</span>
      <input type="number" min={min} className="input mt-0.5 !py-1.5" value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
    </label>
  );
}

/** Just-compensation estimate (death) + Settlement Offer Auditor. Usable inside a case or standalone. */
export function MactPanel({ standalone = false, bare = false }: { standalone?: boolean; bare?: boolean }) {
  const ctx = useCase();
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const fam = ctx.state.family;
  const setFam = (p: Partial<typeof fam>) => ctx.dispatch({ type: "patch", patch: { family: { ...fam, ...p } } });

  const [age, setAge] = useState<number>(ctx.facts.victimAge ?? 35);
  const proven = ctx.income?.monthly ?? null;
  const monthly = fam.monthlyIncomeOverride ?? proven ?? 12000;
  const input: MactInput = {
    age,
    monthlyIncome: monthly,
    incomeSource: proven && fam.monthlyIncomeOverride === null ? "bank" : "declared",
    employment: fam.employment,
    married: fam.married,
    spouse: fam.spouse,
    children: fam.children,
    parents: fam.parents,
    others: fam.others,
    asOf: ctx.today,
  };
  const est = estimateDeath(input); // pure and cheap — no memo needed

  const offer = ctx.state.offer;
  const setOffer = (p: Partial<OfferInput>) => ctx.dispatch({ type: "patch", patch: { offer: { total: 0, ...(offer ?? {}), ...p } } });
  const audit = offer && offer.total > 0 ? auditOffer(est, input, offer) : null;
  const reply = audit && offer ? offerReply(est, input, offer, audit, lang) : "";
  const [copied, setCopied] = useState(false);

  return (
    <section className={bare ? "-mx-[1.1rem] -mb-[1.15rem] overflow-hidden rounded-b-[14px] border-t border-line" : "card overflow-hidden"}>
      <div className="border-b border-line p-4">
        {!bare && <div className="flex items-center gap-2 font-semibold"><Calculator size={17} className="text-accent" /> {hi ? "उचित मुआवज़ा (MACT) और बीमा प्रस्ताव की जाँच" : "Just compensation (MACT) & insurer offer check"}</div>}
        <p className={`${bare ? "" : "mt-1 "}text-sm text-muted`}>
          {hi
            ? "बीमा कंपनी को 30 दिन में प्रस्ताव देना होता है (धारा 149)। मानने के बाद मामला बंद। पहले सुप्रीम कोर्ट के सूत्रों से जाँचें।"
            : "The insurer must make an offer within 30 days (s.149). Once accepted, the claim is closed. Check it against Supreme Court formulas first."}
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <Num label={hi ? "मृतक की उम्र" : "Age of the deceased"} value={age} onChange={setAge} />
        <Num label={hi ? `मासिक आय ₹${proven ? " (पासबुक से)" : ""}` : `Monthly income ₹${proven ? " (from passbook)" : ""}`} value={monthly} onChange={(n) => setFam({ monthlyIncomeOverride: n })} />
        <label className="block text-sm">
          <span className="text-xs text-muted">{hi ? "काम" : "Work"}</span>
          <select className="input mt-0.5 !py-1.5" value={fam.employment} onChange={(e) => setFam({ employment: e.target.value as Employment })}>
            {EMP.map((x) => <option key={x.v} value={x.v}>{hi ? x.hi : x.en}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={fam.married} onChange={(e) => setFam({ married: e.target.checked, spouse: e.target.checked })} /> {hi ? "विवाहित (जीवनसाथी आश्रित)" : "Married (spouse dependent)"}
        </label>
        <Num label={hi ? "आश्रित बच्चे" : "Dependent children"} value={fam.children} onChange={(n) => setFam({ children: n })} />
        <Num label={hi ? "आश्रित माता-पिता" : "Dependent parents"} value={fam.parents} onChange={(n) => setFam({ parents: n })} />
      </div>

      <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {est.heads.map((h) => (
              <tr key={h.id} className="align-top">
                <td className="p-3">
                  <div className="font-medium">{b(h.label)}</div>
                  <div className="mono mt-0.5 text-[11px] text-muted">{h.working}</div>
                  <a href={h.basis.url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted underline">{h.basis.title} <ExternalLink size={10} /></a>
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">{formatINR(h.amount)}</td>
              </tr>
            ))}
            <tr className="bg-accent-soft">
              <td className="p-3 font-semibold text-accent">{hi ? "अनुमानित उचित मुआवज़ा" : "Estimated just compensation"}</td>
              <td className="num-serif p-3 text-right text-xl text-accent">{formatINR(est.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mx-4 mb-4 rounded-lg bg-surface-2 p-3 text-sm">
        <Landmark size={14} className="mr-1 inline text-accent" />
        {hi ? `हर ₹1,000/माह की साबित आय से मुआवज़ा लगभग ${formatINR(est.perThousandMonthly)} बढ़ता है।` : `Every ₹1,000/month of proven income adds about ${formatINR(est.perThousandMonthly)} to the award.`}
      </p>

      <div className="border-t border-line bg-surface-2 p-4">
        <div className="flex items-center gap-2 font-semibold"><Scale size={16} /> {hi ? "बीमा कंपनी का प्रस्ताव मिला है?" : "Got an offer from the insurer?"}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Num label={hi ? "प्रस्तावित कुल राशि ₹" : "Offered total ₹"} value={offer?.total ?? 0} onChange={(n) => setOffer({ total: n })} />
          <Num label={hi ? "उन्होंने कितनी मासिक आय मानी ₹" : "Monthly income they used ₹"} value={offer?.incomeConsidered ?? 0} onChange={(n) => setOffer({ incomeConsidered: n || null })} />
          <Num label={hi ? "गुणक (मल्टीप्लायर)" : "Multiplier they used"} value={offer?.multiplierUsed ?? 0} onChange={(n) => setOffer({ multiplierUsed: n || null })} />
          <label className="block text-sm">
            <span className="text-xs text-muted">{hi ? "भविष्य की संभावनाएँ जोड़ीं?" : "Future prospects added?"}</span>
            <select className="input mt-0.5 !py-1.5" value={offer?.futureProspectsIncluded == null ? "" : String(offer.futureProspectsIncluded)} onChange={(e) => setOffer({ futureProspectsIncluded: e.target.value === "" ? null : e.target.value === "true" })}>
              <option value="">{hi ? "पता नहीं" : "Not stated"}</option>
              <option value="true">{hi ? "हाँ" : "Yes"}</option>
              <option value="false">{hi ? "नहीं" : "No"}</option>
            </select>
          </label>
          <Num label={hi ? "कितने लोगों को साहचर्य राशि" : "Consortium given to (people)"} value={offer?.consortiumCount ?? 0} onChange={(n) => setOffer({ consortiumCount: n || null })} />
        </div>

        {audit && (
          <div className="mt-4 space-y-3">
            <div className={`rounded-xl p-3 text-sm ${audit.verdict === "fair" ? "bg-accent-soft text-accent" : audit.verdict === "low" ? "bg-amber-soft text-amber" : "bg-rose-soft text-rose"}`}>
              <b>
                {audit.verdict === "fair" ? (hi ? "प्रस्ताव अनुमान के क़रीब है" : "The offer is close to the estimate") : audit.verdict === "low" ? (hi ? "प्रस्ताव कम है" : "The offer looks low") : hi ? "प्रस्ताव बहुत कम है — जल्दबाज़ी में न मानें" : "The offer is far too low — don't accept under pressure"}
              </b>{" "}
              · {Math.round(audit.ratio * 100)}% {hi ? "अनुमान का" : "of the estimate"} · {hi ? "अंतर" : "gap"} {formatINR(Math.max(0, audit.gap))}
            </div>
            {audit.flags.length > 0 && (
              <ul className="space-y-1.5 text-sm">
                {audit.flags.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`chip ${f.severity === "high" ? "bg-rose-soft text-rose" : "bg-amber-soft text-amber"}`}>{f.severity}</span>
                    <span className="flex-1">{b(f.message)}</span>
                    {f.impact ? <span className="tabular-nums text-muted">≈ {formatINR(f.impact)}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                {hi ? "वकील / बीमा कंपनी के लिए जवाब" : "Reply for your legal-aid lawyer / the insurer"}
                <button className="btn btn-ghost !px-2 !py-1 text-xs normal-case" onClick={() => { navigator.clipboard?.writeText(reply).catch(() => {}); setCopied(true); }}>
                  <ClipboardCopy size={12} /> {copied ? (hi ? "कॉपी हुआ" : "Copied") : hi ? "कॉपी" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm">{reply}</pre>
            </div>
            <p className="text-xs text-muted">{hi ? "मानने पर दावा सहमति से निपटा माना जाता है (धारा 149(2))। न मानें तो ट्रिब्यूनल सुनवाई तय करता है (149(3))। मुफ़्त वकील: NALSA 15100।" : "If accepted, the claim is deemed settled by consent (s.149(2)). If rejected, the Tribunal fixes a hearing (s.149(3)). Free lawyer: NALSA 15100."}</p>
          </div>
        )}
      </div>
      {!standalone && est.notes.length > 0 && (
        <ul className="list-disc space-y-1 border-t border-line p-4 pl-8 text-xs text-muted">{est.notes.map((n, i) => <li key={i}>{b(n)}</li>)}</ul>
      )}
    </section>
  );
}
