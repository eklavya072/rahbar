// Planner: turns entitlements into a dependency-ordered, earliest-deadline-first action plan,
// and de-duplicates documents shared across claims ("get 5 attested copies of the FIR").

import { DOCS, type DocMeta } from "./documents";
import type { Bilingual, DocKey, EntitlementId, EntitlementResult, EvaluationSummary } from "./types";

export interface DocumentTask {
  doc: DocMeta;
  neededBy: EntitlementId[];
  copies: number;
}

export interface ClaimTask {
  id: EntitlementId;
  title: Bilingual;
  office: Bilingual;
  deadlineDate: string | null;
  deadlineLabel: Bilingual;
  daysLeft: number | null;
  urgency: "overdue" | "urgent" | "soon" | "later" | "none";
  amountLabel: Bilingual;
  amountValue: number | null;
  status: EntitlementResult["status"];
  dependsOn: DocKey[];
  steps: Bilingual[];
}

export interface Plan {
  documents: DocumentTask[];
  claims: ClaimTask[];
}

function urgencyOf(daysLeft: number | null): ClaimTask["urgency"] {
  if (daysLeft === null) return "none";
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 14) return "urgent";
  if (daysLeft <= 45) return "soon";
  return "later";
}

export function buildPlan(summary: EvaluationSummary): Plan {
  const actionable = summary.results.filter((r) => r.status !== "not_eligible" && !r.informational);

  const docMap = new Map<DocKey, Set<EntitlementId>>();
  for (const r of actionable) for (const d of r.documents) docMap.set(d, (docMap.get(d) ?? new Set()).add(r.id));

  const documents: DocumentTask[] = [...docMap.entries()]
    .map(([k, ids]) => ({ doc: DOCS[k], neededBy: [...ids], copies: ids.size + 1 /* one spare */ }))
    .sort((a, b) => b.neededBy.length - a.neededBy.length);

  const claims: ClaimTask[] = actionable
    .map((r) => ({
      id: r.id,
      title: r.short,
      office: r.office,
      deadlineDate: r.deadline.date,
      deadlineLabel: r.deadline.label,
      daysLeft: r.daysLeft,
      urgency: urgencyOf(r.daysLeft),
      amountLabel: r.amount.label,
      amountValue: r.amount.value,
      status: r.status,
      dependsOn: r.documents,
      steps: r.steps,
    }))
    // Earliest deadline first; undated last; then confirmed before possible; then bigger amounts first.
    .sort((a, b) => {
      const da = a.deadlineDate ?? "9999-12-31";
      const db = b.deadlineDate ?? "9999-12-31";
      if (da !== db) return da < db ? -1 : 1;
      if (a.status !== b.status) return a.status === "eligible" ? -1 : 1;
      return (b.amountValue ?? 0) - (a.amountValue ?? 0);
    });

  return { documents, claims };
}
