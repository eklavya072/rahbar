"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCase } from "@/lib/case/CaseProvider";
import { decodeCase } from "@/lib/case/outputs";
import { stepPath } from "@/lib/case/state";

/** Entry point: ?sample=<id> opens a sample case, #c=<facts> opens a shared case, otherwise start the story. */
function Entry() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, dispatch, loadSample, trace } = useCase();

  useEffect(() => {
    if (!state.hydrated) return;
    const sample = params.get("sample");
    if (sample) {
      loadSample(sample);
      return;
    }
    const m = window.location.hash.match(/#c=(.+)$/);
    const shared = m ? decodeCase(m[1]) : null;
    if (shared) {
      dispatch({ type: "reset", state: { answers: shared, step: "owed", aiConfirmed: true } });
      trace("Human", "Opened a shared case link — facts only, no names or documents", { status: "done" });
      router.replace(stepPath("owed"));
      return;
    }
    router.replace(stepPath(state.step));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated]);
  return null;
}

export default function CasePage() {
  return (
    <Suspense>
      <Entry />
    </Suspense>
  );
}
