"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Lenis from "lenis";
import { ArrowRight, Code2, FlaskConical, Phone, Play, Scale, ScrollText } from "lucide-react";
import { Footer, Header } from "@/components/ui";
import { HeroFilm, type HeroIntro } from "@/components/landing/HeroFilm";
import { Preloader } from "@/components/landing/Preloader";
import { CountUp, RollWords, useSeen, useSpotlight } from "@/components/landing/TextEffects";
import { Mark, Money, Redact } from "@/components/Type";
import { LetterFrame, OwedFrame, ScanFrame } from "@/components/landing/Frames";
import { useLang } from "@/lib/i18n";
import { SAMPLE_CASES } from "@/lib/samples/cases";
import "./landing.css";

let introPlayed = false;

function StepRow({ n, title, body, frame, flip }: { n: string; title: string; body: React.ReactNode; frame: (active: boolean) => React.ReactNode; flip?: boolean }) {
  const { ref, seen } = useSeen<HTMLDivElement>(0.78);
  return (
    <div ref={ref} className={`l-step${seen ? " is-in" : ""}${flip ? " is-flip" : ""}`}>
      <div className="l-step-copy">
        {/* The numeral is drawn in outline and fills with brass as you reach the step. */}
        <span className="l-step-n" aria-hidden>{n}</span>
        <RollWords as="h3" className="l-h3" text={title} />
        <p className="l-body">{body}</p>
      </div>
      <div className="l-step-frame">{frame(seen)}</div>
    </div>
  );
}

function Trust() {
  const { lang } = useLang();
  const hi = lang === "hi";
  const spot = useSpotlight<HTMLElement>();
  const { ref, seen } = useSeen<HTMLDivElement>(0.85);
  const { ref: slipRef, seen: slipSeen } = useSeen<HTMLDivElement>(0.8);
  const items = [
    { t: hi ? "फ़ोटो फ़ोन पर ही रहती हैं" : "Photos stay on the phone", b: hi ? "AI तक सिर्फ़ नाम-नंबर छिपा पाठ जाता है।" : "Only text with names and numbers hidden reaches the AI." },
    { t: hi ? "राशि क़ानून तय करता है" : "The law sets every amount", b: hi ? "हर रुपया एक लिखे नियम और उसके स्रोत से आता है, AI से नहीं।" : "Each rupee comes from a written rule and its source, never the AI." },
    { t: hi ? "हर पत्र दो बार जाँचा जाता है" : "Every letter is checked twice", b: hi ? "दूसरा AI तथ्य जाँचता है, फिर हर राशि और तारीख़ नियमों से मिलती है।" : "A second AI checks the facts, then each amount and date is matched to the rules." },
    { t: hi ? "फ़ैसला हमेशा आपका" : "You approve everything", b: hi ? "आपकी मंज़ूरी के बिना कुछ जमा या भेजा नहीं जाता।" : "Nothing is filed or sent without your yes." },
  ];
  const n = (to: number, prefix = "") => (
    <span className="l-proof-n">
      <CountUp to={to} active={seen} prefix={prefix} />
    </span>
  );
  return (
    <section ref={spot} data-surface="ink" className="l-sec l-trust">
      <div className="l-wrap">
        <RollWords as="h2" className="l-h2 l-h2-sm" text={hi ? "सबसे कठिन दिन पर भी भरोसेमंद" : "Safe to use on your hardest day"} />

        {/* What actually leaves the phone: a line from the sample FIR, redacted in front of you. */}
        <div ref={slipRef} className="l-slip">
          <div className="l-slip-cap">{hi ? "एक काल्पनिक सैंपल FIR की लाइन। AI तक बस इतना पहुँचता है:" : "A line from a fictional sample FIR. This is all the AI ever sees:"}</div>
          <p className="l-slip-line">
            <Redact
              active={slipSeen}
              parts={
                hi
                  ? ["सूचक ", { real: "सुनीता वर्मा", token: "[NAME_1]" }, ", पत्नी ", { real: "रमेश कुमार वर्मा", token: "[NAME_2]" }, "। खाता ", { real: "31245678901", token: "[ACCOUNT_1]" }, "। मोटरसाइकिल ", { real: "UP00 AB 4471", token: "[VEHICLE_1]" }, "।"]
                  : ["Informant ", { real: "Sunita Verma", token: "[NAME_1]" }, ", wife of ", { real: "Ramesh Kumar Verma", token: "[NAME_2]" }, ". Account ", { real: "31245678901", token: "[ACCOUNT_1]" }, ". Motorcycle ", { real: "UP00 AB 4471", token: "[VEHICLE_1]" }, "."]
              }
            />
          </p>
        </div>

        <ul className="l-trust-grid">
          {items.map((x) => (
            <li key={x.t} className="l-trust-item">
              <div className="l-trust-t">{x.t}</div>
              <p className="l-trust-b">{x.b}</p>
            </li>
          ))}
        </ul>

        {/* The proof, set as a sentence rather than a row of stat tiles. */}
        <div ref={ref}>
          {hi ? (
            <p className="l-proof">
              लाइव AI जाँच में {n(21)}/21 तथ्य सही पढ़े, हर बदलाव पर {n(40)} स्वचालित परीक्षण, और परिवार का ख़र्च {n(0, "₹")}।
            </p>
          ) : (
            <p className="l-proof">
              {n(21)}/21 facts read right in live AI tests, {n(40)} automated tests on every change, and {n(0, "₹")} cost to the family.
            </p>
          )}
        </div>
        <Link href="/evals" className="l-link link-swipe mt-5 inline-flex items-center gap-2">
          <FlaskConical size={15} /> {hi ? "जाँच ख़ुद चलाकर देखें" : "Run the tests yourself"} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { lang, b } = useLang();
  const hi = lang === "hi";
  const [showPre, setShowPre] = useState(() => !introPlayed);
  const [intro, setIntro] = useState<HeroIntro>(() => (introPlayed ? "none" : "wait"));
  const [reduced, setReduced] = useState(false);
  const [armed, setArmed] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
  useIso(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setArmed(true);
  }, []);

  // Lenis smooth scrolling, landing only; paused under the intro; off for reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.8, smoothWheel: true, anchors: true, autoRaf: true });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (showPre) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [showPre]);

  // Latched section reveals: a section gets .is-in-view the first time it is seen, and keeps it.
  useEffect(() => {
    const secs = Array.from(document.querySelectorAll<HTMLElement>(".landing .l-sec"));
    const check = () => {
      const vh = window.innerHeight || 0;
      for (const el of secs) {
        if (el.classList.contains("is-in-view")) continue;
        const r = el.getBoundingClientRect();
        if (!vh || (r.top < vh * 0.82 && r.bottom > 0)) el.classList.add("is-in-view");
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    const poll = setInterval(check, 320);
    return () => {
      window.removeEventListener("scroll", check);
      clearInterval(poll);
    };
  }, []);

  return (
    <div className={`landing${armed ? " is-armed" : ""}`}>
      <div className="l-dust" aria-hidden />
      {showPre && (
        <Preloader
          reduced={reduced}
          onReveal={() => {
            introPlayed = true;
            setIntro(reduced ? "none" : "play");
          }}
          onDone={() => setShowPre(false)}
        />
      )}
      <Header variant="film" />
      <HeroFilm intro={intro} />

      <section data-surface="paper" className="l-sec" id="how">
        <div className="l-wrap">
          <RollWords as="h2" className="l-h2" text={hi ? "काग़ज़ से भुगतान तक, तीन क़दम" : "Three steps from papers to payment"} />
          <p className="l-lead">{hi ? "न कोई फ़ॉर्म भरने की उलझन, न वकील की ज़रूरत पहले दिन। जो काग़ज़ आपके पास हैं, उन्हीं से शुरू।" : "No maze of forms, no lawyer needed on day one. Start with the papers you already have."}</p>
          <div className="l-steps">
            <StepRow
              n="1"
              title={hi ? "बताइए क्या हुआ, और फ़ोटो दीजिए" : "Tell us what happened, add photos"}
              body={hi ? <>FIR, पासबुक का पन्ना, गाड़ी की पॉलिसी। रहबर इन्हें आपके फ़ोन पर ही पढ़ता है और वह कवर ढूँढता है जिसकी आपको ख़बर नहीं थी, जैसे <Mark>₹20 की एक कटौती जो ₹2 लाख का बीमा है</Mark>।</> : <>The FIR, a passbook page, the vehicle policy. Rahbar reads them on your phone and finds cover you didn&apos;t know you had, like <Mark>a ₹20 debit that is ₹2 lakh of insurance</Mark>.</>}
              frame={(a) => <ScanFrame active={a} />}
            />
            <StepRow
              n="2"
              flip
              title={hi ? "देखिए आपका क्या हक़ है" : "See what you're owed"}
              body={hi ? <>हर दावा तीन हिस्सों में (पक्का, जाँचना है, नहीं मिलेगा), कारण, समय-सीमा और स्रोत के साथ। <Mark>सिर्फ़ वही सवाल पूछे जाते हैं जिनसे सबसे ज़्यादा पैसा खुलता है।</Mark></> : <>Every claim sorted into confirmed, to check or not available, each with its reason, deadline and source. <Mark>You&apos;re only asked the questions that unlock the most money.</Mark></>}
              frame={(a) => <OwedFrame active={a} />}
            />
            <StepRow
              n="3"
              title={hi ? "पत्र लीजिए, फिर आगे की कार्रवाई" : "Get the letters, then follow up"}
              body={hi ? <>समय-सीमा के क्रम में योजना, आपकी मंज़ूरी वाले पत्र, कैलेंडर याद-दिहानी। <Mark>देर होने पर अगला शिकायत पत्र अपने-आप तैयार</Mark>, टूटे नियम के साथ।</> : <>A plan in deadline order, letters you approve, calendar reminders. If an office is late, <Mark>the next complaint letter is ready</Mark> with the rule it broke.</>}
              frame={(a) => <LetterFrame active={a} />}
            />
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/case" className="l-btn l-btn-ink">{hi ? "अपना केस शुरू करें" : "Start your case"} <ArrowRight size={17} /></Link>
            <Link href="/case?sample=sunita" className="l-btn l-btn-line"><Play size={15} /> {hi ? "सैंपल केस देखें" : "Watch a sample case"}</Link>
          </div>
        </div>
      </section>

      <Trust />

      <section data-surface="paper" className="l-sec">
        <div className="l-wrap">
          <RollWords as="h2" className="l-h2" text={hi ? "तीन टेस्ट केस, ख़ुद चलाकर देखें" : "Three test cases you can play"} />
          <p className="l-lead">{hi ? "काल्पनिक परिवार और काग़ज़, हर रास्ते को परखने के लिए बने, FIR में छिपे हमले समेत। राशि नियम-इंजन तय करता है, AI नहीं। हर केस लगभग 20 सेकंड में चलता है।" : "Fictional families and papers, built to test every path, including an attack hidden in an FIR. The amounts come from the rules engine, not the AI. Each plays itself in about 20 seconds."}</p>
          <div className="l-samples">
            {SAMPLE_CASES.map((c, i) => (
              <Link key={c.id} href={`/case?sample=${c.id}`} className={`l-sample${i === 0 ? " is-lead" : ""}`}>
                <div className="l-sample-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/samples/${c.docs[0].id}.png`} alt="" />
                </div>
                <div className="l-sample-body">
                  <div className="l-sample-out">
                    <Money value={c.expectedConfirmedTotal} className="l-sample-money" />
                    <span className="l-sample-out-l">{c.redTeam ? (hi ? "नियमों से, ₹50 लाख नहीं" : "found by the rules, not ₹50 lakh") : hi ? "नियमों से मिला" : "found by the rules"}</span>
                  </div>
                  <div className="l-sample-t">{b(c.title)}</div>
                  <p className="l-sample-b">{b(c.blurb)}</p>
                  <span className="l-sample-go">{hi ? "केस खोलें" : "Open the case"} <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-surface="paper-2" className="l-sec l-sec-tight">
        <div className="l-wrap l-tools">
          <div>
            <RollWords as="h2" className="l-h2" text={hi ? "किसी और की मदद कर रहे हैं?" : "Helping someone else?"} />
            <p className="l-lead">{hi ? "पैरालीगल, अस्पताल हेल्पडेस्क, NGO और वकीलों के लिए।" : "For paralegals, hospital helpdesks, NGOs and lawyers."}</p>
          </div>
          <ul className="l-tool-list">
            {[
              { href: "/offer", icon: <Scale size={17} />, t: hi ? "बीमा कंपनी के प्रस्ताव की जाँच" : "Check an insurer's settlement offer", d: hi ? "सुप्रीम कोर्ट के सूत्रों से, हर मद अलग" : "Against Supreme Court formulas, line by line" },
              { href: "/rules", icon: <ScrollText size={17} />, t: hi ? "हर नियम और उसका स्रोत" : "Every rule and its source", d: hi ? "समय-सीमा, शिकायत का क्रम, बदलाव का इतिहास" : "Deadlines, escalation ladders, changelog" },
              { href: "/developers", icon: <Code2 size={17} />, t: hi ? "अपने सिस्टम से जोड़ें" : "Connect your own system", d: hi ? "पब्लिक API, बिना डेटा सेव किए" : "Public API that stores nothing" },
            ].map((x) => (
              <li key={x.href}>
                <Link href={x.href} className="l-tool">
                  <span className="l-tool-icon">{x.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="l-tool-t">{x.t}</span>
                    <span className="l-tool-d">{x.d}</span>
                  </span>
                  <ArrowRight size={16} className="l-tool-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-surface="void" className="l-sec l-close">
        <div className="l-wrap text-center">
          <h2 className="l-h2 l-close-h">
            {hi ? (
              <>आपको यह <em className="l-em">अकेले</em> नहीं करना है।</>
            ) : (
              <>You don&apos;t have to do this <em className="l-em">alone.</em></>
            )}
          </h2>
          <p className="l-lead mx-auto">{hi ? "उसी फ़ोन पर, दो मिनट में शुरू। कोई साइन-अप नहीं।" : "Start in two minutes, on the phone you already have. No sign-up."}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/case" className="l-btn l-btn-primary">{hi ? "अपना केस शुरू करें" : "Start your case"} <ArrowRight size={17} /></Link>
            <a href="tel:15100" className="l-btn l-btn-quiet"><Phone size={15} /> {hi ? "मुफ़्त कानूनी सहायता 15100" : "Free legal aid 15100"}</a>
          </div>
          <p className="l-fine">{hi ? "रहबर जानकारी देता है, कानूनी सलाह नहीं। मानसिक सहायता: Tele-MANAS 14416" : "Rahbar gives information, not legal advice. Emotional support: Tele-MANAS 14416"}</p>
        </div>
      </section>
      <Footer dark />
    </div>
  );
}
