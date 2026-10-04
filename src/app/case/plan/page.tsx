"use client";
import { NeedsCase } from "@/components/case/CaseShell";
import { StepPlan } from "@/components/case/StepPlan";
export default function Page() {
  return (
    <NeedsCase>
      <StepPlan />
    </NeedsCase>
  );
}
