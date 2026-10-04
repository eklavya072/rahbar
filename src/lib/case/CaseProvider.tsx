"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { INITIAL, reducer, type Action, type AgentName, type CaseDoc, type CaseState, type TraceEvent } from "./state";
import { mergeFacts, type FactLayer } from "../engine/merge";
import { evaluate } from "../engine/evaluate";
import { buildPlan, type Plan } from "../engine/planner";
import { todayISO } from "../engine/dates";
import type { EvaluationSummary, Facts, ProvenanceMap } from "../engine/types";
import { mergeRows, parseDocument, type ParsedDoc } from "../docs/parsers";
import { shield } from "../privacy/pii";
import { detectInjectionHeuristic, quarantine } from "../agents/guard";
import { SAMPLE_CASES } from "../samples/cases";
import type { Extraction } from "../ai/schemas";

interface Ctx {
  state: CaseState;
  dispatch: React.Dispatch<Action>;
  facts: Facts;
  provenance: ProvenanceMap;
  summary: EvaluationSummary;
  plan: Plan;
  today: string;
  loadSample: (id: string) => Promise<void>;
  addFiles: (files: FileList | File[]) => void;
  readDocuments: () => Promise<void>;
  confirmFacts: () => void;
  autoPlay: () => Promise<void>;
  trace: (agent: AgentName, title: string, patch?: Partial<TraceEvent>) => string;
  traceUpdate: (id: string, patch: Partial<TraceEvent>) => void;
}

const C = createContext<Ctx | null>(null);
let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function CaseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  const sample = state.sampleId ? SAMPLE_CASES.find((c) => c.id === state.sampleId) ?? null : null;
  const today = sample?.today ?? todayISO();

  const trace = useCallback((agent: AgentName, title: string, patch: Partial<TraceEvent> = {}) => {
    const id = uid("t");
    dispatch({ type: "trace", event: { id, agent, title, status: "running", at: Date.now(), ...patch } });
    return id;
  }, []);
  const traceUpdate = useCallback((id: string, patch: Partial<TraceEvent>) => dispatch({ type: "traceUpdate", id, patch }), []);

  // ---------- derived: merge → rules → plan ----------
  const { facts, provenance, summary, plan } = useMemo(() => {
    const layers: FactLayer[] = [{ facts: state.aiFacts, source: "ai", confirmed: state.aiConfirmed }];
    for (const d of state.docs) if (d.parsed) layers.push({ facts: d.parsed.facts, provenance: d.parsed.provenance, source: "document" });
    layers.push({ facts: state.answers, source: "answer", confirmed: true });
    const m = mergeFacts(layers);
    const s = evaluate(m.facts, m.provenance, today);
    return { facts: m.facts, provenance: m.provenance, summary: s, plan: buildPlan(s) };
  }, [state.aiFacts, state.aiConfirmed, state.docs, state.answers, today]);

  // ---------- documents ----------
  const addFiles = useCallback((files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      dispatch({
        type: "addDoc",
        doc: { id: uid("doc"), label: f.name.replace(/\.[^.]+$/, "").slice(0, 40), src: URL.createObjectURL(f), status: "queued", progress: 0, lines: [] },
      });
    }
  }, []);

  /** Re-parse every OCR'd document with the best-known context (accident date from the FIR, victim name). */
  const reparseAll = useCallback((docs: CaseDoc[], victimName: string): CaseDoc[] => {
    const firFirst = [...docs].sort((a, b) => (/fir/i.test(a.parsed?.kind ?? a.label) ? -1 : 0) - (/fir/i.test(b.parsed?.kind ?? b.label) ? -1 : 0));
    let accidentDate: string | null = stateRef.current.answers.accidentDate ?? null;
    const parsedById = new Map<string, ParsedDoc>();
    for (let pass = 0; pass < 2; pass++) {
      for (const d of firFirst) {
        if (!d.lines.length) continue;
        const p = parseDocument(d.id, d.label, d.lines, { accidentDate, victimName: victimName || null });
        parsedById.set(d.id, p);
        if (!accidentDate && p.facts.accidentDate) accidentDate = p.facts.accidentDate;
      }
    }
    return docs.map((d) => (parsedById.has(d.id) ? { ...d, parsed: parsedById.get(d.id), status: "parsed" as const } : d));
  }, []);

  const readDocuments = useCallback(async () => {
    const s0 = stateRef.current;
    const sampleCase = s0.sampleId ? SAMPLE_CASES.find((c) => c.id === s0.sampleId) : undefined;
    const { ocrImage } = await import("../docs/ocr");

    // 1. Reader: on-device OCR
    const docs = [...s0.docs];
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      if (d.lines.length) continue;
      const tid = trace("Reader", `Reading "${d.label}" on this device (Tesseract, eng+hin)`);
      dispatch({ type: "updateDoc", id: d.id, patch: { status: "reading", progress: 0 } });
      try {
        const r = await ocrImage(d.src, (p) => dispatch({ type: "updateDoc", id: d.id, patch: { progress: p } }));
        let lines = mergeRows(r.lines);
        if (process.env.NODE_ENV !== "production") (window as unknown as Record<string, unknown>)[`__ocr_${d.id}`] = { raw: r.lines, merged: lines, conf: r.confidence };
        let usedTextLayer = false;
        // Sample documents carry a text layer; use it if OCR quality is poor so the demo stays reliable.
        const sd = sampleCase?.docs.find((x) => x.id === d.id);
        if (sd && (r.confidence < 55 || lines.length < Math.floor(sd.lines.length * 0.6))) {
          lines = sd.lines.map((text) => ({ text }));
          usedTextLayer = true;
        }
        docs[i] = { ...d, lines, ocrConfidence: r.confidence, usedTextLayer, width: r.width, height: r.height, status: "parsed", progress: 1 };
        dispatch({ type: "updateDoc", id: d.id, patch: docs[i] });
        traceUpdate(tid, {
          status: usedTextLayer ? "warn" : "done",
          ms: r.ms,
          detail: `${r.lines.length} lines · confidence ${Math.round(r.confidence)}%${usedTextLayer ? " · low confidence → used the sample's embedded text layer" : ""} · image never left the device`,
        });
      } catch (e) {
        dispatch({ type: "updateDoc", id: d.id, patch: { status: "error" } });
        traceUpdate(tid, { status: "error", detail: (e as Error).message });
      }
    }

    // 2. Parser: deterministic extraction with evidence
    const tp = trace("Parser", "Extracting facts with deterministic parsers (no AI)");
    const parsedDocs = reparseAll(docs, s0.victimName);
    dispatch({ type: "patch", patch: { docs: parsedDocs } });
    const found = parsedDocs.flatMap((d) => Object.keys(d.parsed?.facts ?? {}));
    traceUpdate(tp, { status: "done", detail: `${found.length} facts with line-level evidence: ${[...new Set(found)].join(", ") || "none"}` });

    // 3. Shield: anonymise everything that might go to an AI
    const narrative = parsedDocs.filter((d) => d.parsed?.kind === "fir").map((d) => d.parsed!.narrative).join("\n\n");
    const names = [s0.victimName, s0.claimantName].filter(Boolean);
    const ts = trace("Shield", "Masking names, phone, Aadhaar, account and vehicle numbers on device");
    const sh = shield(`${narrative}\n<<STORY>>\n${s0.story}`, names);
    const [anonNarr, anonStory = ""] = sh.text.split("\n<<STORY>>\n");
    traceUpdate(ts, {
      status: "done",
      detail: Object.entries(sh.counts).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(" · ") || "nothing to mask",
    });

    // 4. Guard: prompt-injection check (device heuristic + server classifier)
    const tg = trace("Guard", "Checking document text for hidden instructions to the AI");
    const local = detectInjectionHeuristic(anonNarr);
    let flagged = local.flagged;
    let guardDetail = local.flagged ? `Heuristic: ${local.reasons.join("; ")}` : "Heuristic: clean";
    try {
      const g = await fetch("/api/agent/guard", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: anonNarr }) }).then((r) => r.json());
      if (g.classifier) {
        flagged = flagged || g.classifier.flagged;
        guardDetail += ` · Prompt Guard (${g.classifier.model.split("/").pop()}): max score ${g.classifier.maxScore.toFixed(2)}`;
      } else guardDetail += " · classifier offline (heuristic only)";
    } catch {
      guardDetail += " · classifier offline (heuristic only)";
    }
    const safeNarr = quarantine(anonNarr, local.lines);
    traceUpdate(tg, { status: flagged ? "warn" : "done", detail: flagged ? `⚠ Injection attempt quarantined. ${guardDetail}` : guardDetail });
    dispatch({ type: "patch", patch: { guardFlags: local.lines, anonymisedPreview: safeNarr + (anonStory ? `\n\n— family's words —\n${anonStory}` : ""), piiCounts: sh.counts as Record<string, number>, piiTokens: sh.tokens } });

    // 5. Extractor: AI reads the anonymised narrative into typed facts
    const tx = trace("Extractor", "AI reads the anonymised narrative into typed facts (zod schema)");
    let extraction: Extraction | null = null;
    try {
      const res = await fetch("/api/agent/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ narrative: safeNarr, story: anonStory }) });
      const j = await res.json();
      if (res.ok) {
        extraction = j.data as Extraction;
        const tok = (j.trace?.inputTokens ?? 0) + (j.trace?.outputTokens ?? 0);
        traceUpdate(tx, {
          status: "done",
          model: j.trace?.model,
          tokens: tok || null,
          cached: j.trace?.cached,
          ms: j.trace?.ms,
          detail: `${j.trace?.provider}/${j.trace?.model}${j.trace?.cached ? " (cache hit)" : ""} · ${j.trace?.attempts?.length ?? 1} attempt(s) · cost ₹0 (free tier)`,
        });
      } else throw new Error(j.error ?? "failed");
    } catch (e) {
      if (sampleCase) {
        traceUpdate(tx, { status: "warn", cached: true, detail: `AI offline (${(e as Error).message}) → using this sample's recorded AI reading. Real cases fall back to asking you.` });
      } else {
        traceUpdate(tx, { status: "skipped", detail: `AI unavailable (${(e as Error).message}) → no-AI mode: we'll ask you instead.` });
      }
    }

    const aiFacts: Partial<Facts> = {};
    if (extraction) {
      for (const k of ["incidentType", "accidentDate", "victimAge", "victimRole", "offendingVehicleIdentified", "offendingVehicleInsured", "wasCommutingOrOnDuty", "gigWorkerOnTrip", "hospitalisedWithin24h"] as const) {
        const v = extraction[k];
        if (v !== null && v !== undefined) (aiFacts as Record<string, unknown>)[k] = v;
      }
    } else if (sampleCase) {
      Object.assign(aiFacts, sampleCase.aiFacts);
    }
    dispatch({ type: "patch", patch: { aiFacts, extraction, step: "facts" } });
  }, [reparseAll, trace, traceUpdate]);

  const loadSample = useCallback(
    async (id: string) => {
      const c = SAMPLE_CASES.find((x) => x.id === id);
      if (!c) return;
      dispatch({
        type: "reset",
        state: {
          sampleId: id,
          victimName: c.victimName,
          claimantName: c.claimantName,
          relation: c.id === "sunita" ? "wife" : c.id === "arjun" ? "mother" : "self",
          story: "",
          step: "docs",
          docs: c.docs.map((d) => ({ id: d.id, label: d.label, src: `/samples/${d.id}.png`, sample: true, status: "queued", progress: 0, lines: [] })),
        },
      });
      const id0 = uid("t");
      dispatch({ type: "trace", event: { id: id0, agent: "Human", title: `Loaded sample case "${c.title.en}" (synthetic documents)`, status: "done", at: Date.now() } });
    },
    [],
  );

  const confirmFacts = useCallback(() => {
    dispatch({ type: "patch", patch: { aiConfirmed: true } });
    trace("Human", "Confirmed the facts read from the papers", { status: "done" });
  }, [trace]);

  /** Judge mode: run every agent, then answer the questioner with the sample family's scripted answers. */
  const autoPlay = useCallback(async () => {
    const c = SAMPLE_CASES.find((x) => x.id === stateRef.current.sampleId);
    if (!c) return;
    await readDocuments();
    await new Promise((r) => setTimeout(r, 600));
    confirmFacts();
    dispatch({ type: "step", step: "questions" });
    for (const [k, v] of Object.entries(c.answers)) {
      if (k === "state") {
        dispatch({ type: "answer", key: "state", value: v as string });
        continue;
      }
      await new Promise((r) => setTimeout(r, 450));
      dispatch({ type: "answer", key: k as keyof Facts, value: v as Facts[keyof Facts] });
      trace("Human", `Answered "${k}" = ${String(v)} (scripted sample answer)`, { status: "done" });
    }
    await new Promise((r) => setTimeout(r, 300));
    trace("Rules", "Evaluated all entitlements (rules-as-code)", { status: "done" });
    dispatch({ type: "step", step: "results" });
  }, [readDocuments, confirmFacts, trace]);

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, facts, provenance, summary, plan, today, loadSample, addFiles, readDocuments, confirmFacts, autoPlay, trace, traceUpdate }),
    [state, facts, provenance, summary, plan, today, loadSample, addFiles, readDocuments, confirmFacts, autoPlay, trace, traceUpdate],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useCase(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useCase outside CaseProvider");
  return c;
}
