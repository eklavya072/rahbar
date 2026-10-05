// Outputs that need no API: calendar files, Google Calendar links, WhatsApp share, QR case handoff.

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Plan } from "../engine/planner";
import type { Facts, Lang } from "../engine/types";
import { addDays, formatDate } from "../engine/dates";

const ymd = (iso: string) => iso.replace(/-/g, "");
const escIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function buildIcs(plan: Plan, lang: Lang): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rahbar//Claim deadlines//EN", "CALSCALE:GREGORIAN"];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  for (const c of plan.claims) {
    if (!c.deadlineDate) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${c.id}-${c.deadlineDate}@rahbar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(c.deadlineDate)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(c.deadlineDate, 1))}`,
      `SUMMARY:${escIcs(`Rahbar: ${c.title[lang]}: deadline`)}`,
      `DESCRIPTION:${escIcs(`${c.deadlineLabel[lang]}\n${c.office[lang]}`)}`,
      "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${escIcs(c.title[lang])}: 7 days left`, "END:VALARM",
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${escIcs(c.title[lang])}: tomorrow`, "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function googleCalendarLink(title: string, date: string, details: string): string {
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${ymd(date)}/${ymd(addDays(date, 1))}`, details });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function whatsappText(plan: Plan, lang: Lang): string {
  const head = lang === "hi" ? "Rahbar योजना: दुर्घटना के बाद के दावे" : "Rahbar plan: claims after the accident";
  const items = plan.claims.map((c, i) => `${i + 1}. ${c.title[lang]}: ${c.amountLabel[lang]}${c.deadlineDate ? `, ${lang === "hi" ? "अंतिम तिथि" : "by"} ${formatDate(c.deadlineDate, lang)}` : ""}\n   ${c.office[lang]}`);
  const tail = lang === "hi" ? "मुफ़्त कानूनी सहायता: NALSA 15100" : "Free legal aid: NALSA 15100";
  return `${head}\n${items.join("\n")}\n${tail}`;
}

/** Caseworker handoff: only non-identifying facts go into the URL fragment (never sent to a server). */
const SHAREABLE: (keyof Facts)[] = [
  "incidentType", "accidentDate", "state", "firRegistered", "offendingVehicleIdentified", "offendingVehicleInsured", "victimAge", "victimRole",
  "victimIsRegisteredOwner", "victimHeldValidDL", "ownVehiclePolicyActive", "ownVehicleCpaSumInsured", "pmsbyPremiumDebited", "pmjjbyPremiumDebited",
  "hasRupayPmjdyCard", "lastCardTxnDate", "pmjdyAccountOpenedAfter2018", "wasCommutingOrOnDuty", "esicInsured", "gigWorkerOnTrip", "hospitalisedWithin24h",
];

export function encodeCase(facts: Facts): string {
  const slim: Partial<Facts> = {};
  for (const k of SHAREABLE) if (facts[k] !== null) (slim as Record<string, unknown>)[k] = facts[k];
  return compressToEncodedURIComponent(JSON.stringify({ v: 1, f: slim }));
}

export function decodeCase(s: string): Partial<Facts> | null {
  try {
    const j = JSON.parse(decompressFromEncodedURIComponent(s) ?? "null");
    if (j?.v !== 1 || typeof j.f !== "object") return null;
    const out: Partial<Facts> = {};
    for (const k of SHAREABLE) if (k in j.f) (out as Record<string, unknown>)[k] = j.f[k];
    return out;
  } catch {
    return null;
  }
}
