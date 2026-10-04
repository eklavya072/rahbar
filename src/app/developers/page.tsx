"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Footer, Header } from "@/components/ui";

const EXAMPLES = {
  evaluate: {
    path: "/api/v1/evaluate",
    body: { facts: { incidentType: "death", accidentDate: "2026-09-12", offendingVehicleIdentified: false, victimAge: 34, victimRole: "rider_own_vehicle", victimIsRegisteredOwner: true, victimHeldValidDL: true, ownVehiclePolicyActive: true, ownVehicleCpaSumInsured: 1500000, pmsbyPremiumDebited: true, hasRupayPmjdyCard: true, lastCardTxnDate: "2026-08-31", pmjdyAccountOpenedAfter2018: true }, today: "2026-10-04" },
  },
  compensation: {
    path: "/api/v1/compensation",
    body: { age: 34, monthlyIncome: 14500, incomeSource: "bank", employment: "fixed_wage", married: true, spouse: true, children: 2, parents: 0, offer: { total: 900000, incomeConsidered: 7000, futureProspectsIncluded: false, multiplierUsed: 15, consortiumCount: 1 } },
  },
};

export default function Developers() {
  const [which, setWhich] = useState<keyof typeof EXAMPLES>("evaluate");
  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const ex = EXAMPLES[which];
  const curl = `curl -X POST "$HOST${ex.path}" \\\n  -H "content-type: application/json" \\\n  -d '${JSON.stringify(ex.body)}'`;

  const run = async () => {
    setBusy(true);
    try {
      const r = await fetch(ex.path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ex.body) });
      const j = await r.json();
      setOut(JSON.stringify(which === "evaluate" ? { confirmedTotal: j.confirmedTotal, counts: j.counts, results: j.results?.map((x: { id: string; status: string; amount: { value: number | null }; deadline: { date: string | null } }) => ({ id: x.id, status: x.status, amount: x.amount.value, deadline: x.deadline.date })) } : j, null, 2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">Build on Rahbar</h1>
          <p className="mt-2 text-ink-2">
            Hospital helpdesks, DLSA case-management tools, NGOs and gig platforms can call the same rules engine the app uses. Deterministic, cited, CORS-enabled, rate-limited, and it stores nothing. Send non-identifying facts only.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a className="chip bg-slate-soft text-ink-2" href="/api/v1/openapi.json">OpenAPI 3.1 spec</a>
            <a className="chip bg-slate-soft text-ink-2" href="/api/v1/rules">GET /api/v1/rules</a>
            <a className="chip bg-slate-soft text-ink-2" href="/rules">Human-readable registry</a>
          </div>
        </div>
        <div className="flex gap-2">
          {(Object.keys(EXAMPLES) as (keyof typeof EXAMPLES)[]).map((k) => (
            <button key={k} className={`btn !py-1.5 ${which === k ? "btn-primary" : "btn-ghost"}`} onClick={() => { setWhich(k); setOut(""); }}>POST {EXAMPLES[k].path}</button>
          ))}
        </div>
        <pre className="mono overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white">{curl}</pre>
        <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Try it live</button>
        {out && <pre className="mono max-h-[28rem] overflow-auto rounded-xl border border-line bg-surface p-4 text-xs">{out}</pre>}
      </main>
      <Footer />
    </>
  );
}
