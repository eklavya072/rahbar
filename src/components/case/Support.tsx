"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Phone, Siren, Volume2, VolumeX } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** Shown when the accident is recent: the first-48-hours mistakes cost the most. */
export function FirstHours() {
  const { lang } = useLang();
  const hi = lang === "hi";
  const items = hi
    ? [
        "इलाज: नामित अस्पताल में पहले 7 दिन ₹1.5 लाख तक कैशलेस (पीएम राहत)। पैसे के लिए इलाज न रुकने दें।",
        "एफ़आईआर की मुफ़्त कॉपी लें (BNSS धारा 173(2))। परिवार को भी अधिकार है।",
        "पोस्टमार्टम रिपोर्ट और मृत्यु प्रमाण पत्र की कई प्रतियाँ माँगें।",
        "जगह, वाहन और चोटों की फ़ोटो; गवाहों के नाम-नंबर लिखें।",
        "किसी अनजान व्यक्ति के कोरे काग़ज़ या वकालतनामे पर हस्ताक्षर न करें; मुआवज़े का कोई प्रतिशत न लिखें।",
        "पुलिस को 10 दिन में 'पीड़ित के अधिकार' (फ़ॉर्म II) देना होता है। माँगें।",
        "मदद करने वाले राहगीर कानूनी रूप से सुरक्षित हैं (धारा 134A) और ₹25,000 इनाम (राह-वीर) के हक़दार हैं।",
      ]
    : [
        "Treatment: up to ₹1.5 lakh cashless for the first 7 days at a designated hospital (PM RAHAT). Don't let money delay care.",
        "Get a free copy of the FIR (BNSS s.173(2)). The family has this right too.",
        "Ask for several copies of the post-mortem report and death certificate.",
        "Photograph the spot, vehicles and injuries; note witnesses' names and numbers.",
        "Never sign blank papers or a vakalatnama from a stranger; never sign over a share of the compensation.",
        "Police must give you the 'rights of victims' notice (Form II) within 10 days. Ask for it.",
        "Bystanders who helped are legally protected (s.134A) and eligible for a ₹25,000 Rah-Veer reward.",
      ];
  return (
    <section className="rounded-2xl border border-amber/30 bg-amber-soft p-4">
      <div className="flex items-center gap-2 font-semibold text-amber"><Siren size={17} /> {hi ? "पहले 48 घंटे: सबसे ज़रूरी बातें" : "The first 48 hours: what matters most"}</div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">{items.map((x) => <li key={x}>{x}</li>)}</ol>
    </section>
  );
}

export function SupportCard() {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <section className="card flex flex-wrap items-start gap-3 p-4">
      <HeartHandshake className="mt-0.5 shrink-0 text-accent" size={20} />
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-semibold">{hi ? "आप अकेले नहीं हैं" : "You don't have to do this alone"}</div>
        <p className="mt-0.5 text-muted">
          {hi ? "हादसे के बाद लगभग हर तीसरे व्यक्ति को सदमे (PTSD) के लक्षण होते हैं। मुफ़्त, गोपनीय मदद:" : "About 1 in 3 crash survivors shows signs of trauma (PTSD). Free, confidential help:"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href="tel:14416" className="chip bg-accent-soft py-1 text-accent"><Phone size={12} /> Tele-MANAS 14416</a>
          <a href="tel:15100" className="chip bg-slate-soft py-1 text-ink-2"><Phone size={12} /> {hi ? "मुफ़्त कानूनी सहायता" : "Free legal aid"} NALSA 15100</a>
          <a href="tel:112" className="chip bg-rose-soft py-1 text-rose"><Phone size={12} /> {hi ? "आपातकाल" : "Emergency"} 112</a>
        </div>
      </div>
    </section>
  );
}

/** Reads text aloud in Hindi or English (browser speech synthesis — no server). */
export function ReadAloud({ text, className = "btn btn-ghost !px-3 !py-1.5 text-sm" }: { text: string; className?: string }) {
  const { lang } = useLang();
  const [speaking, setSpeaking] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const has = typeof window !== "undefined" && "speechSynthesis" in window;
    const t = setTimeout(() => setOk(has), 0);
    return () => clearTimeout(t);
  }, []);
  if (!ok) return null;
  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    u.rate = 0.95;
    const v = synth.getVoices().find((x) => x.lang.startsWith(lang === "hi" ? "hi" : "en-IN"));
    if (v) u.voice = v;
    u.onend = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };
  return (
    <button className={className} onClick={toggle} aria-pressed={speaking}>
      {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />} {speaking ? (lang === "hi" ? "रोकें" : "Stop") : lang === "hi" ? "सुनें" : "Listen"}
    </button>
  );
}
