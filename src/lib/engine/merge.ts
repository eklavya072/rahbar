// Fact merging with provenance. Priority (lowest → highest): AI reading < document parsers < human answers.
// A human is always the final authority.

import { EMPTY_FACTS, type FactKey, type Facts, type Provenance, type ProvenanceMap } from "./types";

export interface FactLayer {
  facts: Partial<Facts>;
  provenance?: ProvenanceMap;
  source: Provenance["source"];
  confirmed?: boolean;
}

export function mergeFacts(layers: FactLayer[]): { facts: Facts; provenance: ProvenanceMap } {
  const facts: Facts = { ...EMPTY_FACTS };
  const provenance: ProvenanceMap = {};
  const rank = { default: 0, ai: 1, document: 2, answer: 3 } as const;

  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer.facts) as [FactKey, Facts[FactKey]][]) {
      if (v === undefined || v === null) continue;
      const existing = provenance[k];
      const incoming: Provenance = layer.provenance?.[k] ?? { source: layer.source, confirmed: !!layer.confirmed };
      if (existing && rank[existing.source] > rank[incoming.source]) continue;
      (facts as unknown as Record<string, unknown>)[k] = v;
      provenance[k] = { ...incoming, confirmed: incoming.confirmed || !!layer.confirmed };
    }
  }
  return { facts, provenance };
}
