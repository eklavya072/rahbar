"use client";

import { Footer, Header } from "@/components/ui";
import { CaseProvider } from "@/lib/case/CaseProvider";
import { MactPanel } from "@/components/case/Money";
import { SupportCard } from "@/components/case/Support";
import { useLang } from "@/lib/i18n";

export default function OfferPage() {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <CaseProvider>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">{hi ? "बीमा कंपनी का प्रस्ताव मिला? पहले जाँचें।" : "Got a settlement offer? Check it before you sign."}</h1>
          <p className="mt-2 text-ink-2">
            {hi
              ? "धारा 149 के तहत बीमा कंपनी 30 दिन में प्रस्ताव देती है। मानते ही दावा बंद हो जाता है। सुप्रीम कोर्ट के सूत्रों से उचित मुआवज़ा देखें और कमियाँ पहचानें — परिवार, वकील और DLSA पैरालीगल के लिए।"
              : "Under Section 149 the insurer makes an offer within 30 days — and once you accept, the claim is closed. Compare it with the Supreme Court formulas and see exactly what's missing. For families, lawyers and DLSA paralegals."}
          </p>
        </div>
        <MactPanel standalone />
        <SupportCard />
      </main>
      <Footer />
    </CaseProvider>
  );
}
