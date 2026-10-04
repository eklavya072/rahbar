"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleX, FlaskConical, Loader2, Play, ShieldCheck } from "lucide-react";
import { Header } from "@/components/ui";
import { PROPERTIES, runGolden, runSafety, type GoldenRow, type SafetyRow } from "@/lib/evals/run";
import { shield } from "@/lib/privacy/pii";
import { RULES } from "@/lib/engine/rules";

function Pass({ ok }: { ok: boolean }) {
  return ok ? <CheckCircle2 size={16} className="text-accent" aria-label="pass" /> : <CircleX size={16} className="text-rose" aria-label="fail" />;
}

export default function EvalsPage() {
  const [golden, setGolden] = useState<GoldenRow[]>([]);
  const [safety, setSafety] = useState<SafetyRow[]>([]);
  const [props, setProps] = useState<{ name: string; ok: boolean | null; ms: number; err?: string }[]>(PROPERTIES.map((p) => ({ name: p.name, ok: null, ms: 0 })));
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(500);
  const [pii, setPii] = useState("Informant Name: Sunita Verma W/o Ramesh Kumar Verma, Mobile 9876543210, PAN ABCDE1234F, A/c No: 31245678901, bike UP00 AB 4471");

  useEffect(() => {
    setGolden(runGolden());
    setSafety(runSafety());
  }, []);

  const runProps = async () => {
    setRunning(true);
    for (let i = 0; i < PROPERTIES.length; i++) {
      await new Promise((r) => setTimeout(r, 30));
      const t0 = performance.now();
      try {
        PROPERTIES[i].run(runs);
        setProps((p) => p.map((x, j) => (j === i ? { ...x, ok: true, ms: Math.round(performance.now() - t0) } : x)));
      } catch (e) {
        setProps((p) => p.map((x, j) => (j === i ? { ...x, ok: false, ms: Math.round(performance.now() - t0), err: (e as Error).message.slice(0, 300) } : x)));
      }
    }
    setRunning(false);
  };

  const masked = shield(pii, ["Sunita Verma", "Ramesh Kumar Verma"]);
  const goldenPass = golden.filter((g) => g.pass).length;
  const safetyPass = safety.filter((s) => s.pass).length;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8">
        <div>
          <span className="chip bg-accent-soft text-accent"><FlaskConical size={12} /> Evaluation harness</span>
          <h1 className="mt-3 font-display text-3xl font-semibold">Does it work consistently? Check it yourself.</h1>
          <p className="mt-2 max-w-3xl text-ink-2">
            Every rupee in AfterCrash comes from {RULES.length} rules-as-code entitlements with citations — never from the language model. These checks run live in your browser; the same suite runs in CI with Vitest.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="chip bg-slate-soft text-ink-2">Golden cases: {goldenPass}/{golden.length}</span>
            <span className="chip bg-slate-soft text-ink-2">Safety checks: {safetyPass}/{safety.length}</span>
            <span className="chip bg-slate-soft text-ink-2">Property invariants: {props.filter((p) => p.ok).length}/{props.length}</span>
            <span className="chip bg-slate-soft text-ink-2">27 unit tests (Vitest)</span>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1 · Golden cases (synthetic documents → parsers → rules)</h2>
          {golden.map((g) => (
            <div key={g.caseId} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pass ok={g.pass} />
                <span className="font-semibold">{g.title}</span>
                <span className="text-sm text-muted">· total ₹{g.totalActual.toLocaleString("en-IN")} (expected ₹{g.totalExpected.toLocaleString("en-IN")})</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.checks.map((c) => (
                  <span key={c.id} className={`chip ${c.pass ? "bg-accent-soft text-accent" : "bg-rose-soft text-rose"}`} title={`expected ${c.expected}`}>
                    {c.id}: {c.actual.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">2 · Property-based invariants (fast-check, random cases)</h2>
            <div className="flex items-center gap-2">
              <select className="input !w-auto !py-1.5 text-sm" value={runs} onChange={(e) => setRuns(Number(e.target.value))} aria-label="Random cases per property">
                {[200, 500, 2000, 5000].map((n) => <option key={n} value={n}>{n.toLocaleString()} cases each</option>)}
              </select>
              <button className="btn btn-primary" onClick={runProps} disabled={running}>
                {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Run now
              </button>
            </div>
          </div>
          <div className="card divide-y divide-line">
            {props.map((p) => (
              <div key={p.name} className="flex items-start gap-3 px-4 py-3 text-sm">
                {p.ok === null ? <span className="mt-0.5 h-4 w-4 rounded-full border border-line" /> : <Pass ok={p.ok} />}
                <div className="flex-1">
                  <div>{p.name}</div>
                  {p.err && <pre className="mono mt-1 whitespace-pre-wrap text-xs text-rose">{p.err}</pre>}
                </div>
                {p.ok !== null && <span className="text-xs text-muted">{runs.toLocaleString()} cases · {p.ms} ms</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3 · Safety: prompt injection and the verifier</h2>
          <div className="card divide-y divide-line">
            {safety.map((s) => (
              <div key={s.name} className="flex items-start gap-3 px-4 py-3 text-sm">
                <Pass ok={s.pass} />
                <div className="flex-1">{s.name}</div>
                <span className="text-xs text-muted">{s.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} /> 4 · Try the on-device PII shield</h2>
          <p className="text-sm text-muted">Type anything with names, phone numbers, PAN, account or vehicle numbers. Aadhaar numbers are only masked if they pass the UIDAI Verhoeff checksum. This runs entirely in your browser.</p>
          <textarea className="input mono min-h-24 text-sm" value={pii} onChange={(e) => setPii(e.target.value)} />
          <pre className="mono whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm">
            {masked.text.split(/(\[[A-Z]+_\d+\])/).map((part, i) =>
              /^\[[A-Z]+_\d+\]$/.test(part) ? <mark key={i} className="rounded bg-amber-soft px-0.5 text-amber">{part}</mark> : <span key={i}>{part}</span>,
            )}
          </pre>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(masked.counts).map(([k, v]) => <span key={k} className="chip bg-accent-soft text-accent">{v} {k.toLowerCase()}</span>)}
          </div>
        </section>
      </main>
    </>
  );
}
