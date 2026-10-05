"use client";

/**
 * The scroll-scrubbed hero (after Meridian's HeroScrub), with a film drawn live:
 * a tall pinned region holds a sticky full-viewport stage. Progress through it (0..1)
 * drives the road scene AND five caption bands, through one critically damped spring,
 * so footage and words move as one surface.
 *
 * Nothing readable depends on the frame loop: the real sentences are in the DOM for
 * screen readers, a 320 ms poll writes the captions from raw scroll if frames stall,
 * and phones / reduced motion get a composed static hero with every band stacked.
 */

import { Fragment, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { drawScene, makeScene, smoothstep } from "./roadScene";

const HERO_VH = 620;
const BANDS = [
  { a: 0.0, b: 0.2, ka: 0.0, kb: 0.05 },
  { a: 0.2, b: 0.4, ka: 0.205, kb: 0.26 },
  { a: 0.4, b: 0.6, ka: 0.405, kb: 0.46 },
  { a: 0.6, b: 0.8, ka: 0.605, kb: 0.66 },
  { a: 0.8, b: 1.0, ka: 0.805, kb: 0.86 },
];
const GATES = ["(max-width: 720px)", "(orientation: portrait) and (pointer: coarse)", "(prefers-reduced-motion: reduce)"];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Splits a line into masked words, each with its own assembly threshold (--th). */
function ScrubWords({ text, seed, spread = 0.5, className = "", indexFrom = 0 }: { text: string; seed: number; spread?: number; className?: string; indexFrom?: number }) {
  const words = text.split(" ");
  const rand = rng(seed);
  return (
    <span className={className}>
      <span className="l-sr">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={`${w}-${i}`}>
            <span className="l-sw">
              <span className="l-sw-in" style={{ ["--th" as string]: ((i / Math.max(1, words.length - 1)) * spread + rand() * 0.05).toFixed(3), ["--wi" as string]: indexFrom + i }}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </span>
  );
}

export type HeroIntro = "wait" | "play" | "none";

export function HeroFilm({ intro = "none" }: { intro?: HeroIntro }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!root || !stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = makeScene();
    const mqs = GATES.map((q) => window.matchMedia(q));
    let isStatic = mqs.some((m) => m.matches);

    let W = 0;
    let H = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = stage.clientWidth;
      H = stage.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let rootTop = 0;
    let span = 1;
    const measure = () => {
      rootTop = root.getBoundingClientRect().top + window.scrollY;
      span = Math.max(1, root.offsetHeight - window.innerHeight);
      size();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const progress = () => clamp((window.scrollY - rootTop) / span, 0, 1);

    const cache = BANDS.map(() => ({ op: -1, k: -1, x: -1 }));
    const writeBands = (p: number) => {
      BANDS.forEach((band, i) => {
        const el = bandRefs.current[i];
        if (!el) return;
        const inEdge = i === 0 ? 1 : smoothstep(p, band.a, band.a + 0.02);
        const outEdge = i === BANDS.length - 1 ? 1 : 1 - smoothstep(p, band.b - 0.05, band.b);
        const op = Math.round(inEdge * outEdge * 1000) / 1000;
        const x = i === BANDS.length - 1 ? 0 : Math.round(smoothstep(p, band.b - 0.05, band.b) * 1000) / 1000;
        const k = i === 0 ? 1 : Math.round(clamp((p - band.ka) / (band.kb - band.ka), 0, 1) * 1000) / 1000;
        const c = cache[i];
        if (Math.abs(op - c.op) > 0.001) {
          c.op = op;
          el.style.opacity = String(op);
          el.style.visibility = op < 0.004 ? "hidden" : "visible";
        }
        if (Math.abs(k - c.k) > 0.002) {
          c.k = k;
          el.style.setProperty("--k", String(k));
        }
        if (Math.abs(x - c.x) > 0.002) {
          c.x = x;
          el.style.setProperty("--x", String(x));
        }
      });
    };
    const pinStatic = () =>
      bandRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = "1";
        el.style.visibility = "visible";
        el.style.setProperty("--k", "1");
        el.style.setProperty("--x", "0");
      });

    // Critically damped spring between the scroll target and what is shown.
    let target = progress();
    let shown = target;
    let vel = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    let lastFrameAt = Date.now();
    const OMEGA = 14;
    const t0 = performance.now();

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      lastFrameAt = Date.now();
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      if (!isStatic) {
        const off = shown - target;
        const decay = Math.exp(-OMEGA * dt);
        const next = (off + (vel + OMEGA * off) * dt) * decay;
        vel = (vel - OMEGA * (vel + OMEGA * off) * dt) * decay;
        shown = target + next;
        writeBands(shown);
      }
      drawScene(ctx, W, H, isStatic ? 0.93 : shown, (now - t0) / 1000, data);
      raf = requestAnimationFrame(frame);
    };
    const onScroll = () => {
      target = progress();
    };
    const applyMode = () => {
      isStatic = mqs.some((m) => m.matches);
      stage.classList.toggle("is-static", isStatic);
      root.style.height = isStatic ? "auto" : `${HERO_VH}vh`;
      measure();
      if (isStatic) pinStatic();
      else writeBands(progress());
    };
    applyMode();
    mqs.forEach((m) => m.addEventListener("change", applyMode));

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(stage);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(frame);
    // Fail-open: if frames stop (throttled tab), write captions straight from scroll.
    const poll = setInterval(() => {
      if (!isStatic && Date.now() - lastFrameAt > 320) writeBands(progress());
    }, 320);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      mqs.forEach((m) => m.removeEventListener("change", applyMode));
    };
  }, []);

  const introCls = intro === "wait" ? " is-intro-pending" : intro === "play" ? " is-intro-play" : "";

  return (
    <section ref={rootRef} className="l-scrub" data-surface="void" aria-label={hi ? "रहबर का परिचय" : "Introducing Rahbar"}>
      <div ref={stageRef} className="l-stage">
        <canvas ref={canvasRef} className="l-film" aria-hidden />
        <div className="l-stage-scrim" aria-hidden />

        {/* 1 — the promise */}
        <div className={`l-band l-band-a${introCls}`} ref={(el) => { bandRefs.current[0] = el; }}>
          <h1 className="l-h1">
            <ScrubWords text={hi ? "हादसे के बाद," : "After an accident,"} seed={11} spread={0.4} />{" "}
            <span className="l-key l-promise">
              <ScrubWords text={hi ? "आगे का रास्ता।" : "the way forward."} seed={17} spread={0.35} indexFrom={4} />
            </span>
          </h1>
          <p className="l-h1-sub">
            {hi
              ? "रहबर आपके परिवार का हर हक़ ढूँढता है (बीमा, सरकारी योजनाएँ, मुआवज़ा) और काग़ज़ी काम आपके साथ पूरा करता है।"
              : "Rahbar finds every rupee your family is owed and does the paperwork with you, on your phone."}
          </p>
          <div className="l-cta l-cta-a">
            <Link href="/case" className="l-btn l-btn-primary">
              {hi ? "अपना केस शुरू करें" : "Start your case"} <ArrowRight size={17} />
            </Link>
            <Link href="/case?sample=sunita" className="l-btn l-btn-quiet">
              <Play size={15} /> {hi ? "सैंपल केस देखें" : "Watch a sample case"}
            </Link>
          </div>
        </div>

        {/* 2 — the finding */}
        <div className="l-band l-band-b" ref={(el) => { bandRefs.current[1] = el; }}>
          <p className="l-lede">
            <ScrubWords text={hi ? "पैसा मौजूद है। परिवार उस तक नहीं पहुँचते।" : "The money exists. Families never reach it."} seed={29} spread={0.5} />
          </p>
          <ul className="l-find">
            {[
              ["205", hi ? "हिट-एंड-रन दावे एक साल में, लगभग 25,000 पात्र हादसों में से" : "hit-and-run claims filed in a year, out of about 25,000 eligible accidents"],
              ["70%", hi ? "ग़रीब परिवारों ने इन योजनाओं के बारे में सुना ही नहीं" : "of low-income families had never heard of the schemes"],
              ["90%", hi ? "अटके दावे पात्रता से नहीं, काग़ज़ों से अटके" : "of stuck claims were stuck on paperwork, not eligibility"],
            ].map(([q, t], i) => (
              <li key={q} className={`l-find-row${i === 2 ? " is-gap" : ""}`} style={{ ["--th" as string]: (0.08 + i * 0.17).toFixed(2) }}>
                <span className="l-find-qty">{q}</span>
                <span className="l-find-text">{t}</span>
              </li>
            ))}
          </ul>
          <p className="l-src">{hi ? "स्रोत: सुप्रीम कोर्ट, विश्व बैंक, Crashfree India" : "Sources: Supreme Court of India, World Bank, Crashfree India"}</p>
        </div>

        {/* 3 — the scale */}
        <div className="l-band l-band-c" ref={(el) => { bandRefs.current[2] = el; }}>
          <p className="l-stmt">
            <ScrubWords className="l-stmt-line" text={hi ? "एक हादसा।" : "One accident."} seed={53} spread={0.3} />
            <ScrubWords className="l-stmt-line l-key" text={hi ? "दस तक हक़।" : "Up to ten claims."} seed={59} spread={0.3} />
          </p>
          <p className="l-note">
            {hi
              ? "बीमा, सरकारी योजनाएँ, मुआवज़ा, नियोक्ता का कवर, यहाँ तक कि खाते की बचत: हर एक का अलग दफ़्तर, अलग फ़ॉर्म, अलग समय-सीमा।"
              : "Insurance, government schemes, compensation, employer cover, even the savings in their account. Each has its own office, form and deadline."}
          </p>
        </div>

        {/* 4 — how it is different */}
        <div className="l-band l-band-d" ref={(el) => { bandRefs.current[3] = el; }}>
          <p className="l-stmt">
            <ScrubWords text={hi ? "हर रुपये के साथ उसकी वजह।" : "Every rupee comes with a reason."} seed={71} spread={0.5} />
          </p>
          <ol className="l-ladder">
            {(hi
              ? ["फ़ोन पर काग़ज़ पढ़े", "नाम-नंबर छिपाए", "क़ानून से जाँचा", "पत्र तैयार", "आप मंज़ूर करें"]
              : ["Papers read on your phone", "Names & numbers hidden", "Checked against the law", "Letters drafted", "You approve"]
            ).map((r, i) => (
              <li key={r} className={`l-rung${i === 4 ? " is-top" : ""}`} style={{ ["--th" as string]: (0.05 + i * 0.12).toFixed(2) }}>
                <span className="l-rung-n">0{i + 1}</span>
                <span className="l-rung-name">{r}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 5 — the close */}
        <div className="l-band l-band-e" ref={(el) => { bandRefs.current[4] = el; }}>
          <p className="l-stmt l-close-head">
            <ScrubWords text={hi ? "रहबर को" : "Let Rahbar"} seed={83} spread={0.3} />{" "}
            <span className="l-key">
              <ScrubWords text={hi ? "रास्ता दिखाने दें।" : "show the way."} seed={89} spread={0.25} />
            </span>
          </p>
          <p className="l-note">{hi ? "कोई साइन-अप नहीं। मुफ़्त। आपके काग़ज़ आपके फ़ोन से बाहर नहीं जाते।" : "No sign-up. Free. Your papers never leave your phone."}</p>
          <div className="l-cta">
            <Link href="/case" className="l-btn l-btn-primary">
              {hi ? "अपना केस शुरू करें" : "Start your case"} <ArrowRight size={17} />
            </Link>
            <Link href="/case?sample=sunita" className="l-btn l-btn-quiet">
              <Play size={15} /> {hi ? "सैंपल केस देखें" : "Watch a sample case"}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
