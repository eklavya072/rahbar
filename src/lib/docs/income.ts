// Income Evidence Builder: reconstruct monthly earnings from the passbook's credit lines.
// Tribunals often fall back to minimum wage when there's no payslip; a regular salary/payout trail is evidence.

import type { OcrLine } from "./parsers";
import { datesIn } from "./parsers";
import { asciiDigits } from "../agents/verifier";

const INCOME = /\b(SALARY|SAL\b|SAL\s*CR|WAGES?|PAYROLL|STIPEND|PAYOUT|INCENTIVE|NEFT\s*CR|IMPS\s*CR|RTGS\s*CR|UPI\/CR|BY\s*TRANSFER)\b|वेतन|मज़दूरी/i;
const NOT_INCOME = /\b(REVERSAL|REFUND|REV\b|INTEREST|INT\.?\s*PD|CASHBACK|DIVIDEND)\b/i;
const MONEY = /\b\d{1,3}(?:,\d{2})*(?:,\d{3})\.\d{2}\b|\b\d{3,7}\.\d{2}\b/g;

export interface IncomeCredit {
  date: string;
  amount: number;
  payer: string;
  line: OcrLine;
}

export interface IncomeEvidence {
  credits: IncomeCredit[];
  months: { month: string; total: number }[];
  monthly: number | null; // median of monthly totals
  payers: string[];
  regular: boolean; // same payer in ≥ 2 months
  closingBalance: number | null;
}

function payerOf(text: string): string {
  const m = text.match(/(?:SALARY|SAL(?:\s*CR)?|NEFT\s*CR|IMPS\s*CR|UPI\/CR|PAYOUT)\s*[/|:-]?\s*([A-Z][A-Z .&]{2,40})/i);
  return (m?.[1] ?? "").replace(/\s*\|.*$/, "").replace(/^(?:CR|DR)\s+/i, "").replace(/\s+/g, " ").trim() || "-";
}

export function extractIncome(lines: OcrLine[], before: string | null): IncomeEvidence {
  const credits: IncomeCredit[] = [];
  let closingBalance: number | null = null;

  for (const line of lines) {
    const t = asciiDigits(line.text);
    const date = datesIn(t)[0];
    const amounts = [...t.matchAll(MONEY)].map((m) => Number(m[0].replace(/,/g, "")));
    if (date && amounts.length) closingBalance = amounts[amounts.length - 1]; // last column of the last dated row
    if (!date || !INCOME.test(t) || NOT_INCOME.test(t)) continue;
    if (before && date > before) continue;
    // Rows read as "date | particulars | withdrawal | deposit | balance": the credit is the first amount when a balance follows.
    const amount = amounts.length >= 2 ? amounts[0] : amounts[0];
    if (!amount || amount < 500) continue;
    credits.push({ date, amount, payer: payerOf(t), line });
  }

  const byMonth = new Map<string, number>();
  for (const c of credits) byMonth.set(c.date.slice(0, 7), (byMonth.get(c.date.slice(0, 7)) ?? 0) + c.amount);
  const months = [...byMonth.entries()].sort().map(([month, total]) => ({ month, total }));
  const sorted = months.map((m) => m.total).sort((a, b) => a - b);
  const monthly = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;

  const payerMonths = new Map<string, Set<string>>();
  for (const c of credits) payerMonths.set(c.payer, (payerMonths.get(c.payer) ?? new Set()).add(c.date.slice(0, 7)));
  const regular = [...payerMonths.values()].some((s) => s.size >= 2);

  return { credits, months, monthly, payers: [...payerMonths.keys()], regular, closingBalance };
}
