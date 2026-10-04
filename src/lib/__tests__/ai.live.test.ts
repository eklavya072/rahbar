// Live AI evaluation against the running dev server (uses the real Groq free tier).
// Run: AI_LIVE=1 npx vitest run src/lib/__tests__/ai.live.test.ts
import { describe, expect, it } from "vitest";
import { SAMPLE_CASES } from "../samples/cases";
import { detectInjectionHeuristic, quarantine } from "../agents/guard";
import { shield, rehydrate } from "../privacy/pii";
import { runSampleCase } from "../samples/pipeline";
import { assembleLetter, caseFactsSentence, templateParagraphs, type LetterContext } from "../case/letters";
import { RULES_BY_ID } from "../engine/rules";

const BASE = process.env.AI_BASE ?? "http://localhost:3000";
const live = !!process.env.AI_LIVE;
const FIELDS = ["incidentType", "victimAge", "victimRole", "offendingVehicleIdentified", "wasCommutingOrOnDuty", "gigWorkerOnTrip", "hospitalisedWithin24h"] as const;

async function post(path: string, body: unknown) {
  const t0 = Date.now();
  const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, ms: Date.now() - t0, json: await r.json() };
}

describe.skipIf(!live)("live AI evaluation (Groq free tier)", () => {
  const report: string[] = [];

  for (const c of SAMPLE_CASES) {
    it(`extractor reads the ${c.id} FIR correctly`, async () => {
      const fir = c.docs.find((d) => d.kind === "fir")!;
      const narrative = fir.lines.join("\n"); // the app sends the whole anonymised FIR
      const sh = shield(narrative, [c.victimName, c.claimantName]);
      const safe = quarantine(sh.text, detectInjectionHeuristic(sh.text).lines);
      const r = await post("/api/agent/extract", { narrative: safe, story: "" });
      expect(r.status).toBe(200);
      const d = r.json.data;
      const scored = FIELDS.filter((f) => c.aiFacts[f] !== undefined).map((f) => ({ f, exp: c.aiFacts[f], got: d[f], ok: d[f] === c.aiFacts[f] }));
      const correct = scored.filter((s) => s.ok).length;
      report.push(
        `${c.id}: ${correct}/${scored.length} fields · ${r.json.trace.model} · ${r.ms} ms · ${(r.json.trace.inputTokens ?? 0) + (r.json.trace.outputTokens ?? 0)} tok` +
          (scored.some((s) => !s.ok) ? ` · misses: ${scored.filter((s) => !s.ok).map((s) => `${s.f}=${s.got} (exp ${s.exp})`).join(", ")}` : "") +
          ` · injection flag: ${d.suspiciousInstructions}\n   summary: ${rehydrate(d.summaryEn, sh.tokens)}`,
      );
      // No PII may come back in raw form and no amounts may be produced.
      expect(JSON.stringify(d)).not.toMatch(/₹|Rs\.?\s?\d/);
      expect(correct / scored.length).toBeGreaterThanOrEqual(0.8);
    }, 60_000);
  }

  it("extractor handles a family's own words in Hinglish (no documents)", async () => {
    const story = "Mere papa [PERSON_1] 52 saal ke the, factory se ghar aa rahe the scooter pe, ek tempo ne takkar maar di, tempo ka number police ne note kar liya. Hospital le gaye par 2 din baad expire ho gaye.";
    const r = await post("/api/agent/extract", { narrative: "", story });
    const d = r.json.data;
    report.push(`hinglish story: incident=${d.incidentType} age=${d.victimAge} role=${d.victimRole} identified=${d.offendingVehicleIdentified} commuting=${d.wasCommutingOrOnDuty} hospital24h=${d.hospitalisedWithin24h} · ${r.ms} ms`);
    expect(d.incidentType).toBe("death");
    expect(d.victimAge).toBe(52);
    expect(d.offendingVehicleIdentified).toBe(true);
    expect(d.wasCommutingOrOnDuty).toBe(true);
  }, 60_000);

  it("guard: Prompt Guard flags the red-team FIR and passes a normal one", async () => {
    const bad = SAMPLE_CASES.find((c) => c.redTeam)!.docs[0].lines.join("\n");
    const good = SAMPLE_CASES[0].docs[0].lines.join("\n");
    const rb = await post("/api/agent/guard", { text: bad });
    const rg = await post("/api/agent/guard", { text: good });
    report.push(`guard: red-team flagged=${rb.json.flagged} (classifier ${rb.json.classifier?.maxScore?.toFixed(3) ?? "n/a"}) · normal flagged=${rg.json.flagged} (classifier ${rg.json.classifier?.maxScore?.toFixed(3) ?? "n/a"})`);
    expect(rb.json.flagged).toBe(true);
    expect(rg.json.flagged).toBe(false);
  }, 60_000);

  for (const lang of ["en", "hi"] as const) {
    it(`drafter writes a ${lang} PMSBY letter that passes the verifier`, async () => {
      const c = SAMPLE_CASES[0];
      const { facts, summary } = runSampleCase(c);
      const r = summary.results.find((x) => x.id === "PMSBY")!;
      const res = await post("/api/agent/draft", { lang, scheme: RULES_BY_ID.PMSBY.name[lang], office: RULES_BY_ID.PMSBY.office[lang], relation: "wife", summary: caseFactsSentence(facts) });
      expect(res.status).toBe(200);
      const ctx: LetterContext = { lang, victimName: c.victimName, claimantName: c.claimantName, relation: "wife", firNo: "0412/2026", facts, today: c.today };
      const letter = assembleLetter(r, ctx, res.json.data, "ai", res.json.trace.model);
      const tpl = assembleLetter(r, ctx, templateParagraphs(r, ctx), "template");
      report.push(`draft ${lang}: verifier ${letter.verification.ok ? "PASS" : "BLOCK " + letter.verification.issues.map((i) => i.code).join(",")} · critic ${res.json.critic?.model ?? "n/a"} unsupported=${JSON.stringify(res.json.critic?.unsupported ?? [])} revised=${res.json.critic?.revised} · ${res.ms} ms\n   ${letter.body.join(" ")}`);
      expect(tpl.verification.ok).toBe(true);
      expect(letter.verification.ok).toBe(true);
    }, 60_000);
  }

  it("case agent uses the rules engine as a tool for a what-if question", async () => {
    const { facts } = runSampleCase(SAMPLE_CASES[0]);
    const r = await post("/api/agent/ask", { question: "What changes if the police find the truck?", facts, today: "2026-10-04", lang: "en" });
    const tools = (r.json.toolCalls ?? []).map((t: { name: string }) => t.name);
    report.push(`agent: model=${r.json.model} steps=${r.json.steps} tools=${tools.join(",")} · ${r.ms} ms\n   ${String(r.json.answer).slice(0, 400)}`);
    expect(tools).toContain("simulateWhatIf");
    expect(/[\u0900-\u097F]/.test(r.json.answer)).toBe(false); // English question → English answer
    expect(String(r.json.answer).toLowerCase()).toMatch(/hit.and.run/); // must mention the hit-and-run payment stops applying
  }, 90_000);

  it("agent answers in Hindi when asked in Hindi", async () => {
    const { facts } = runSampleCase(SAMPLE_CASES[0]);
    const r = await post("/api/agent/ask", { question: "मुझे सबसे पहले कौन सा दावा करना चाहिए?", facts, today: "2026-10-04" });
    report.push(`agent hi: model=${r.json.model} tools=${(r.json.toolCalls ?? []).map((t: { name: string }) => t.name).join(",")} · ${r.ms} ms\n   ${String(r.json.answer).slice(0, 300)}`);
    expect(/[ऀ-ॿ]/.test(r.json.answer)).toBe(true);
  }, 90_000);

  it("prints the report", () => {
    console.log("\n==== LIVE AI REPORT ====\n" + report.join("\n") + "\n========================");
  });
});
