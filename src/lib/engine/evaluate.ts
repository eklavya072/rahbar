import { daysBetween, isValidISO, todayISO } from "./dates";
import { RULES } from "./rules";
import type {
  ConditionResult,
  EntitlementResult,
  EvaluationSummary,
  FactKey,
  Facts,
  FactSource,
  ProvenanceMap,
  RuleDef,
  Status,
  Tri,
} from "./types";

const SOURCE_RANK: Record<FactSource, number> = { document: 3, answer: 2, ai: 1, default: 0 };

/** Tri-state AND across condition results. */
export function combine(results: Tri[]): Status {
  if (results.some((r) => r === false)) return "not_eligible";
  if (results.some((r) => r === null)) return "possible";
  return "eligible";
}

function factIsBacked(key: FactKey, prov: ProvenanceMap): boolean {
  const p = prov[key];
  if (!p) return false;
  return p.source === "document" || p.confirmed;
}

export function evaluateRule(rule: RuleDef, facts: Facts, prov: ProvenanceMap = {}, today = todayISO()): EntitlementResult {
  const conditions: ConditionResult[] = rule.conditions.map((c) => ({
    id: c.id,
    label: c.label,
    result: c.test(facts),
    facts: c.facts,
    // Strongest evidence first: document > human answer > AI reading > unknown.
    sources: c.facts
      .map((k) => (prov[k]?.source ?? "default") as FactSource)
      .sort((a, b) => SOURCE_RANK[b] - SOURCE_RANK[a]),
  }));

  const status = combine(conditions.map((c) => c.result));
  const missing = new Set<FactKey>();
  for (const c of conditions) if (c.result === null) c.facts.forEach((k) => facts[k] === null && missing.add(k));

  const deadline = rule.deadline(facts);
  const daysLeft = deadline.date && isValidISO(deadline.date) ? daysBetween(today, deadline.date) : null;

  const evidenceBacked = conditions.filter((c) => c.result === true).every((c) => c.facts.every((k) => factIsBacked(k, prov)));

  return {
    id: rule.id,
    name: rule.name,
    short: rule.short,
    payer: rule.payer,
    status,
    amount: rule.amount(facts),
    deadline,
    daysLeft,
    conditions,
    missingFacts: [...missing],
    failedConditions: conditions.filter((c) => c.result === false),
    documents: rule.documents,
    office: rule.office,
    steps: rule.steps,
    notes: rule.notes ? rule.notes(facts) : [],
    citations: rule.citations,
    lastVerified: rule.lastVerified,
    informational: !!rule.informational,
    evidenceBacked,
  };
}

const STATUS_ORDER: Record<Status, number> = { eligible: 0, possible: 1, not_eligible: 2 };

export function evaluate(facts: Facts, prov: ProvenanceMap = {}, today = todayISO()): EvaluationSummary {
  const results = RULES.filter((r) => r.relevant(facts))
    .map((r) => evaluateRule(r, facts, prov, today))
    .sort((a, b) => {
      const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (s !== 0) return s;
      if (a.informational !== b.informational) return a.informational ? 1 : -1;
      return (b.amount.value ?? 0) - (a.amount.value ?? 0);
    });

  const sum = (st: Status) =>
    results.filter((r) => r.status === st && !r.informational).reduce((acc, r) => acc + (r.amount.value ?? 0), 0);

  return {
    results,
    confirmedTotal: sum("eligible"),
    possibleTotal: sum("possible"),
    counts: {
      eligible: results.filter((r) => r.status === "eligible").length,
      possible: results.filter((r) => r.status === "possible").length,
      not_eligible: results.filter((r) => r.status === "not_eligible").length,
    },
  };
}
