"use client";

/** The product's own screens, animating themselves (after Meridian's ProductFrames). */
import { Check, CircleHelp, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Money, Odometer } from "../Type";

export function ScanFrame({ active }: { active: boolean }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <div className={`f-frame f-scan${active ? " is-on" : ""}`}>
      <div className="f-bar"><span /><span /><span /><b>{hi ? "पासबुक · इसी फ़ोन पर पढ़ी जा रही है" : "Passbook · read on this phone"}</b></div>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/samples/sunita-passbook.png" alt="" className="block w-full" />
        <span className="f-scanline" aria-hidden />
        <span className="f-hit f-hit-a" aria-hidden style={{ left: "4.8%", top: "43.7%", width: "90.4%", height: "6%" }} />
        <span className="f-hit f-hit-b" aria-hidden style={{ left: "4.8%", top: "73.6%", width: "90.4%", height: "6%" }} />
      </div>
      <div className="f-found">
        <div className="f-found-row f-d1"><span className="f-dot bg-accent" />{hi ? "₹20 'PMSBY' कटौती" : "₹20 'PMSBY' debit"}<b>→ <Money value={200000} /></b></div>
        <div className="f-found-row f-d2"><span className="f-dot bg-key" />{hi ? "हादसे से 12 दिन पहले कार्ड इस्तेमाल" : "Card used 12 days before"}<b>→ <Money value={200000} /></b></div>
      </div>
    </div>
  );
}

export function OwedFrame({ active }: { active: boolean }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const rows = hi
    ? [["मालिक-चालक दुर्घटना कवर", "₹15,00,000", "ok"], ["हिट-एंड-रन मुआवज़ा", "₹2,00,000", "ok"], ["PMSBY दुर्घटना बीमा", "₹2,00,000", "ok"], ["रुपे कार्ड कवर", "₹2,00,000", "ok"], ["ESIC पेंशन", hi ? "जाँचें" : "check", "q"]]
    : [["Owner-driver accident cover", "₹15,00,000", "ok"], ["Hit-and-run compensation", "₹2,00,000", "ok"], ["PMSBY accident insurance", "₹2,00,000", "ok"], ["RuPay card cover", "₹2,00,000", "ok"], ["ESIC pension", "check", "q"]];
  return (
    <div className={`f-frame f-owed${active ? " is-on" : ""}`}>
      <div className="f-bar"><span /><span /><span /><b>{hi ? "आपका हक़" : "What you're owed"}</b></div>
      <div className="f-total">
        <div className="f-total-label">{hi ? "काग़ज़ों से पक्का" : "Confirmed from your papers"}</div>
        <div className="f-total-num"><Odometer value={2100000} active={active} /></div>
      </div>
      <ul className="f-rows">
        {rows.map(([n, a, s], i) => (
          <li key={n} style={{ transitionDelay: `${500 + i * 140}ms` }}>
            <span className={`f-stat ${s === "ok" ? "is-ok" : "is-q"}`}>{s === "ok" ? <Check size={12} /> : <CircleHelp size={12} />}</span>
            <span className="flex-1 truncate">{n}</span>
            <span className="mono">{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LetterFrame({ active }: { active: boolean }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <div className={`f-frame f-letter${active ? " is-on" : ""}`}>
      <div className="f-bar"><span /><span /><span /><b>{hi ? "दावा पत्र" : "Claim letter"}</b></div>
      <div className="f-paper">
        <div className="f-line w-[40%]" />
        <div className="f-line w-[70%]" />
        <div className="f-line w-[92%]" />
        <div className="f-line w-[86%]" />
        <div className="f-line w-[60%]" />
        <div className="f-checks">
          <span className="f-check f-c1"><ShieldCheck size={13} /> {hi ? "तथ्य जाँचे (दूसरा AI)" : "Facts checked by a second AI"}</span>
          <span className="f-check f-c2"><Check size={13} /> {hi ? "हर राशि और तारीख़ सही" : "Every amount & date verified"}</span>
          <span className="f-check f-c3 is-key">{hi ? "8 दिन बाकी · 12 अक्टूबर" : "8 days left · 12 Oct"}</span>
        </div>
      </div>
    </div>
  );
}
