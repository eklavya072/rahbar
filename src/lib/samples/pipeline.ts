// Runs a sample case through the deterministic parts of the pipeline (parsers → merge → rules).
// Used by the evals page and unit tests; the live app runs the same functions step by step.

import { evaluate } from "../engine/evaluate";
import { mergeFacts, type FactLayer } from "../engine/merge";
import { parseDocument, type ParsedDoc } from "../docs/parsers";
import type { EvaluationSummary, Facts, ProvenanceMap } from "../engine/types";
import type { SampleCase } from "./cases";

export interface PipelineResult {
  parsed: ParsedDoc[];
  facts: Facts;
  provenance: ProvenanceMap;
  summary: EvaluationSummary;
}

export function runSampleCase(c: SampleCase, opts: { withAnswers?: boolean; withAi?: boolean; confirmAi?: boolean } = {}): PipelineResult {
  // confirmAi simulates the "We read this — is it right?" screen where a human confirms AI-read facts.
  const { withAnswers = true, withAi = true, confirmAi = true } = opts;
  // Pass 1: FIR first to learn the accident date, then the rest with that context.
  const firDocs = c.docs.filter((d) => d.kind === "fir");
  const otherDocs = c.docs.filter((d) => d.kind !== "fir");
  const parsed: ParsedDoc[] = [];
  for (const d of firDocs) parsed.push(parseDocument(d.id, d.label, d.lines.map((text) => ({ text })), { accidentDate: null, victimName: c.victimName }));
  const accidentDate = parsed.find((p) => p.facts.accidentDate)?.facts.accidentDate ?? c.answers.accidentDate ?? null;
  for (const d of otherDocs) parsed.push(parseDocument(d.id, d.label, d.lines.map((text) => ({ text })), { accidentDate, victimName: c.victimName }));

  const layers: FactLayer[] = [];
  if (withAi) layers.push({ facts: c.aiFacts, source: "ai", confirmed: confirmAi });
  for (const p of parsed) layers.push({ facts: p.facts, provenance: p.provenance, source: "document" });
  if (withAnswers) layers.push({ facts: c.answers, source: "answer", confirmed: true });

  const { facts, provenance } = mergeFacts(layers);
  return { parsed, facts, provenance, summary: evaluate(facts, provenance, c.today) };
}
