"use client";

import { ExternalLink, GitCommitHorizontal } from "lucide-react";
import { Footer, Header } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { CHANGELOG, registry, RULES_VERSION } from "@/lib/api/v1";
import { FACT_LABELS } from "@/lib/engine/factLabels";
import { DOCS } from "@/lib/engine/documents";

export default function RulesPage() {
  const { b, lang } = useLang();
  const hi = lang === "hi";
  const rules = registry();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">{hi ? "हर नियम, उसका स्रोत और उसकी समय-सीमा" : "Every rule, its source, and its clock"}</h1>
          <p className="mt-2 max-w-3xl text-ink-2">
            {hi
              ? "AfterCrash में पात्रता और राशि यहीं के नियमों से तय होती है — AI से नहीं। हर नियम पर स्रोत और अंतिम जाँच की तारीख है। मशीन-पठनीय रूप:"
              : "Eligibility and amounts in AfterCrash come only from these rules — never from the AI. Each carries its legal source and the date it was last verified. Machine-readable:"}{" "}
            <a className="underline" href="/api/v1/rules">/api/v1/rules</a> · v{RULES_VERSION}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{hi ? "बदलाव का इतिहास" : "Changelog"}</h2>
          <ol className="card divide-y divide-line">
            {CHANGELOG.map((c) => (
              <li key={c.date + c.en} className="flex gap-3 p-3 text-sm">
                <GitCommitHorizontal size={16} className="mt-0.5 shrink-0 text-muted" />
                <span className="mono shrink-0 text-xs text-muted">{c.date}</span>
                <span className="flex-1">{c.en}</span>
                <span className="mono text-xs text-muted">{c.rules.join(", ")}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{hi ? `${rules.length} हक़` : `${rules.length} entitlements`}</h2>
          {rules.map((r) => (
            <article key={r.id} className="card p-4" id={r.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono chip bg-slate-soft text-ink-2">{r.id}</span>
                <h3 className="font-semibold">{b(r.name)}</h3>
                {r.informational && <span className="chip bg-slate-soft text-muted">{hi ? "सूचनात्मक" : "informational"}</span>}
              </div>
              <div className="mt-1 text-sm text-muted">{b(r.payer)}</div>
              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">{hi ? "शर्तें (सब सही = पात्र)" : "Conditions (all true = eligible)"}</div>
                  <ul className="mt-1 space-y-1">
                    {r.conditions.map((c) => (
                      <li key={c.id}>
                        {b(c.label)} <span className="text-xs text-muted">← {c.facts.map((f) => b(FACT_LABELS[f])).join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">{hi ? "कानूनी समय-सीमा और शिकायत क्रम" : "Statutory clock & escalation ladder"}</div>
                  <p className="mt-1">{b(r.clock.tatLabel)}{r.clock.interest ? ` · ${b(r.clock.interest)}` : ""}</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-ink-2">{r.clock.escalation.map((e) => <li key={e.level}>{b(e.to)}</li>)}</ol>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{r.documents.map((d) => <span key={d} className="chip bg-surface-2 text-ink-2 ring-1 ring-line">{b(DOCS[d].name)}</span>)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {[...r.citations, r.clock.basis].map((c) => (
                  <a key={c.url + c.title} href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">{c.title} <ExternalLink size={10} /></a>
                ))}
                <span>· {hi ? "अंतिम जाँच" : "last verified"} {r.lastVerified}</span>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
