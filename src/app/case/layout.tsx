import type { Metadata } from "next";
import { CaseShell } from "@/components/case/CaseShell";

export const metadata: Metadata = { title: "Your case — Rahbar" };

export default function CaseLayout({ children }: LayoutProps<"/case">) {
  return <CaseShell>{children}</CaseShell>;
}
