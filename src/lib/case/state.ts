// Client-side case state. Lives only in this browser tab (privacy by default).

import { EMPTY_FACTS, type Facts, type FactKey, type ProvenanceMap } from "../engine/types";
import type { ParsedDoc, OcrLine } from "../docs/parsers";
import type { Extraction } from "../ai/schemas";

export type AgentName =
  | "Reader"
  | "Parser"
  | "Shield"
  | "Guard"
  | "Extractor"
  | "Rules"
  | "Questioner"
  | "Planner"
  | "Drafter"
  | "Verifier"
  | "Human"
  | "Case Agent";

export interface TraceEvent {
  id: string;
  agent: AgentName;
  status: "running" | "done" | "warn" | "error" | "skipped";
  title: string;
  detail?: string;
  ms?: number;
  model?: string | null;
  tokens?: number | null;
  cached?: boolean;
  at: number;
}

export interface CaseDoc {
  id: string;
  label: string;
  src: string; // object URL or /samples/... path
  sample?: boolean;
  status: "queued" | "reading" | "parsed" | "error";
  progress: number;
  lines: OcrLine[];
  ocrConfidence?: number;
  usedTextLayer?: boolean;
  parsed?: ParsedDoc;
  width?: number;
  height?: number;
}

export type Step = "tell" | "docs" | "facts" | "questions" | "results" | "plan";
export const STEPS: Step[] = ["tell", "docs", "facts", "questions", "results", "plan"];

export interface CaseState {
  step: Step;
  sampleId: string | null;
  victimName: string;
  claimantName: string;
  relation: string;
  story: string;
  docs: CaseDoc[];
  /** Layers: ai (unconfirmed until human confirms), document, answer */
  aiFacts: Partial<Facts>;
  aiConfirmed: boolean;
  extraction: Extraction | null;
  answers: Partial<Facts>;
  trace: TraceEvent[];
  guardFlags: string[];
  anonymisedPreview: string;
  piiCounts: Record<string, number>;
  /** token -> original, in memory on this device only (never sent anywhere) */
  piiTokens: Record<string, string>;
  skipped: FactKey[];
  approvedLetters: string[];
}

export const INITIAL: CaseState = {
  step: "tell",
  sampleId: null,
  victimName: "",
  claimantName: "",
  relation: "",
  story: "",
  docs: [],
  aiFacts: {},
  aiConfirmed: false,
  extraction: null,
  answers: {},
  trace: [],
  guardFlags: [],
  anonymisedPreview: "",
  piiCounts: {},
  piiTokens: {},
  skipped: [],
  approvedLetters: [],
};

export type Action =
  | { type: "reset"; state?: Partial<CaseState> }
  | { type: "patch"; patch: Partial<CaseState> }
  | { type: "step"; step: Step }
  | { type: "addDoc"; doc: CaseDoc }
  | { type: "updateDoc"; id: string; patch: Partial<CaseDoc> }
  | { type: "removeDoc"; id: string }
  | { type: "answer"; key: FactKey; value: Facts[FactKey] }
  | { type: "trace"; event: TraceEvent }
  | { type: "traceUpdate"; id: string; patch: Partial<TraceEvent> };

export function reducer(s: CaseState, a: Action): CaseState {
  switch (a.type) {
    case "reset":
      return { ...INITIAL, ...(a.state ?? {}) };
    case "patch":
      return { ...s, ...a.patch };
    case "step":
      return { ...s, step: a.step };
    case "addDoc":
      return { ...s, docs: [...s.docs.filter((d) => d.id !== a.doc.id), a.doc] };
    case "updateDoc":
      return { ...s, docs: s.docs.map((d) => (d.id === a.id ? { ...d, ...a.patch } : d)) };
    case "removeDoc":
      return { ...s, docs: s.docs.filter((d) => d.id !== a.id) };
    case "answer":
      return { ...s, answers: { ...s.answers, [a.key]: a.value } };
    case "trace":
      return { ...s, trace: [...s.trace, a.event] };
    case "traceUpdate":
      return { ...s, trace: s.trace.map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)) };
  }
}

export function emptyFacts(): Facts {
  return { ...EMPTY_FACTS };
}

export type { ProvenanceMap };
