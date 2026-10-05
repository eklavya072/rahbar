"use client";

/**
 * The building blocks every case page shares, so each screen reads the same way:
 * where you are (StepIntro), the one thing to do (ActionBar), and anything
 * optional tucked into a plainly named drawer (More).
 */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Lock, Plus, RotateCcw } from "lucide-react";
import { STEPS, stepPath, type Step } from "@/lib/case/state";
import { useCase } from "@/lib/case/CaseProvider";
import { useLang } from "@/lib/i18n";
import type { AgentName } from "@/lib/case/state";

/** Words rise from behind a mask in reading order (keyed by text, so it replays per step). */
export function Words({ text, delay = 0, stagger = 45 }: { text: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={`${text}-${i}`}>
            <span className="w-mask">
              <span className="w-in" style={{ animationDelay: `${delay + i * stagger}ms` }}>{w}</span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}

export function useCurrentStep(): Step {
  const path = usePathname();
  return STEPS.find((s) => path?.startsWith(stepPath(s))) ?? "story";
}

/** The page's one question as a big serif title, and one plain sentence. Position lives in the road above. */
export function StepIntro({ title, lead, aside }: { title: string; lead?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h1 className="h-step">
          <Words text={title} delay={80} />
        </h1>
        {lead && <p className="lead step-enter mt-3" style={{ animationDelay: "260ms" }}>{lead}</p>}
      </div>
      {aside}
    </header>
  );
}

/**
 * The step's main action. On phones it sticks to the bottom of the screen
 * within thumb reach; on larger screens it sits under the content.
 */
export function ActionBar({ back, children }: { back?: Step; children: ReactNode }) {
  const { go } = useCase();
  const { lang } = useLang();
  return (
    <div className="action-bar no-print">
      {back && (
        <button className="btn btn-ghost btn-lg btn-icon md:w-auto md:px-5" onClick={() => go(back)} aria-label={lang === "hi" ? "पीछे" : "Back"}>
          <ArrowLeft size={18} />
          <span className="hidden md:inline">{lang === "hi" ? "पीछे" : "Back"}</span>
        </button>
      )}
      {children}
    </div>
  );
}

/** An optional tool, closed until wanted: icon, plain name, one-line why. */
export function More({ icon, title, hint, children, open = false, id }: { icon: ReactNode; title: string; hint?: string; children: ReactNode; open?: boolean; id?: string }) {
  return (
    <details className="more" open={open} id={id}>
      <summary>
        <span className="more-icon" aria-hidden>{icon}</span>
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
        </span>
        <Plus size={20} className="more-plus" aria-hidden />
      </summary>
      <div className="more-body">{children}</div>
    </details>
  );
}

/** A labelled group of optional drawers. */
export function Extras({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 space-y-3">
      <h2 className="t-label">{title}</h2>
      {children}
    </section>
  );
}

const PHASES: { agents: AgentName[]; en: string; hi: string }[] = [
  { agents: ["Reader", "Parser"], en: "Reading the photos on this phone", hi: "इसी फ़ोन पर फ़ोटो पढ़ रहे हैं" },
  { agents: ["Shield"], en: "Hiding names and numbers before any AI sees them", hi: "AI से पहले नाम और नंबर छिपा रहे हैं" },
  { agents: ["Guard"], en: "Checking the papers for hidden tricks", hi: "काग़ज़ों में छिपी चालें जाँच रहे हैं" },
  { agents: ["Extractor"], en: "Understanding what the papers say", hi: "काग़ज़ों की बात समझ रहे हैं" },
  { agents: ["Rules"], en: "Matching against 10 kinds of claims", hi: "10 तरह के दावों से मिला रहे हैं" },
];

/** While the agents work: the same pipeline, in words a family understands. */
export function WorkingSteps({ since }: { since: number }) {
  const { state } = useCase();
  const { lang } = useLang();
  const events = state.trace.filter((e) => e.at >= since);
  const phaseState = PHASES.map((p) => {
    const ev = events.filter((e) => p.agents.includes(e.agent));
    if (!ev.length) return "wait" as const;
    return ev.some((e) => e.status === "running") ? ("on" as const) : ("done" as const);
  });
  const firstWaiting = phaseState.indexOf("wait");
  return (
    <div className="card step-enter p-5" role="status" aria-live="polite">
      <div className="h-sec">{lang === "hi" ? "रहबर काम कर रहा है…" : "Rahbar is working…"}</div>
      <ul className="mt-3">
        {PHASES.map((p, i) => {
          const st = phaseState[i] === "wait" && i === firstWaiting && !phaseState.includes("on") ? "on" : phaseState[i];
          return (
            <li key={p.en} className={`work-row ${st === "done" ? "is-done" : st === "on" ? "is-on" : ""}`}>
              <span className="work-dot">{st === "done" ? <Check size={13} /> : st === "on" ? <Loader2 size={13} className="animate-spin text-key" /> : null}</span>
              {lang === "hi" ? p.hi : p.en}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The same intro on the standalone tool pages: what this page is for, in one line. */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="max-w-3xl">
      <h1 className="h-step">
        <Words text={title} delay={60} />
      </h1>
      {children && <div className="lead step-enter mt-3" style={{ animationDelay: "240ms" }}>{children}</div>}
    </header>
  );
}

/**
 * Start a new case. Clearing wipes this case from the phone, so it asks first
 * and offers to save the current one under lock before starting over.
 */
export function NewCaseButton({ variant = "link" }: { variant?: "link" | "icon" | "bar" }) {
  const { newCase, state } = useCase();
  const { lang } = useLang();
  const hi = lang === "hi";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const label = hi ? "नया केस" : "New case";
  const trigger =
    variant === "icon" ? (
      <button className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={hi ? "नया केस शुरू करें" : "Start a new case"}>
        <RotateCcw size={16} />
      </button>
    ) : variant === "bar" ? (
      <button className="btn btn-ghost btn-lg" onClick={() => setOpen(!open)} aria-expanded={open}>
        <RotateCcw size={17} /> {hi ? "नया केस शुरू करें" : "Start a new case"}
      </button>
    ) : (
      <button className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink" onClick={() => setOpen(!open)} aria-expanded={open}>
        <RotateCcw size={14} /> {label}
      </button>
    );
  return (
    <div ref={box} className="relative">
      {trigger}
      {open && (
        <div role="dialog" aria-label={hi ? "नया केस" : "New case"} className={`newcase-pop ${variant === "bar" ? "is-up" : ""}`}>
          <div className="font-semibold">{hi ? "नया केस शुरू करें?" : "Start a new case?"}</div>
          <p className="mt-1 text-sm text-muted">
            {hi ? "इससे यह केस इस फ़ोन से हट जाएगा। चाहें तो पहले इसे ताले में सेव कर लें।" : "This clears the current case from this phone. You can save it under lock first."}
          </p>
          <div className="mt-3 grid gap-2">
            {!state.sampleId && (
              <button
                className="btn btn-ghost !min-h-10 justify-start"
                onClick={() => {
                  setOpen(false);
                  router.push("/case/track#vault");
                }}
              >
                <Lock size={15} /> {hi ? "पहले सेव करें" : "Save it first"}
              </button>
            )}
            <button
              className="btn !min-h-10 justify-start bg-rose text-white hover:opacity-90"
              onClick={() => {
                setOpen(false);
                newCase();
              }}
            >
              <RotateCcw size={15} /> {hi ? "हटाएँ और नया शुरू करें" : "Clear and start new"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
