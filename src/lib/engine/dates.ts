// Small, dependency-free date helpers working on ISO yyyy-mm-dd strings (UTC, date-only).

export function parseISO(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isValidISO(d: string | null | undefined): d is string {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const p = parseISO(d);
  return !Number.isNaN(p.getTime()) && toISO(p) === d;
}

export function addDays(d: string, n: number): string {
  const p = parseISO(d);
  p.setUTCDate(p.getUTCDate() + n);
  return toISO(p);
}

export function addMonths(d: string, n: number): string {
  const p = parseISO(d);
  const day = p.getUTCDate();
  p.setUTCDate(1);
  p.setUTCMonth(p.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth() + 1, 0)).getUTCDate();
  p.setUTCDate(Math.min(day, lastDay));
  return toISO(p);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

export function todayISO(): string {
  const now = new Date();
  // Use IST calendar date: the product serves Indian families.
  const ist = new Date(now.getTime() + 330 * 60_000);
  return ist.toISOString().slice(0, 10);
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(d: string | null, lang: "en" | "hi" = "en"): string {
  if (!d || !isValidISO(d)) return lang === "hi" ? "तारीख अज्ञात" : "date unknown";
  const p = parseISO(d);
  if (lang === "hi") {
    return p.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }
  return `${p.getUTCDate()} ${MONTHS_EN[p.getUTCMonth()]} ${p.getUTCFullYear()}`;
}

/** ₹ in Indian digit grouping, e.g. 1500000 -> ₹15,00,000 */
export function formatINR(n: number): string {
  const s = Math.round(n).toString();
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `₹${rest},${last3}`;
}

/** Short words, e.g. 1500000 -> "₹15 lakh" */
export function formatINRShort(n: number, lang: "en" | "hi" = "en"): string {
  if (n >= 1_00_00_000) {
    const v = +(n / 1_00_00_000).toFixed(2);
    return lang === "hi" ? `₹${v} करोड़` : `₹${v} crore`;
  }
  if (n >= 1_00_000) {
    const v = +(n / 1_00_000).toFixed(2);
    return lang === "hi" ? `₹${v} लाख` : `₹${v} lakh`;
  }
  return formatINR(n);
}
