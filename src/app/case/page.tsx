import { Suspense } from "react";
import type { Metadata } from "next";
import { CaseFlow } from "@/components/case/CaseFlow";

export const metadata: Metadata = { title: "Your case — AfterCrash" };

export default function CasePage() {
  return (
    <Suspense>
      <CaseFlow />
    </Suspense>
  );
}
