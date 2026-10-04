"use client";

import { X } from "lucide-react";
import type { CaseDoc } from "@/lib/case/state";
import type { Evidence } from "@/lib/engine/types";

/** Shows a document image with the evidence line highlighted. */
export function DocViewer({ doc, evidence, onClose }: { doc: CaseDoc; evidence: Evidence; onClose: () => void }) {
  const box = evidence.bbox && doc.width && doc.height ? evidence.bbox : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" role="dialog" aria-modal="true" aria-label={`Evidence in ${doc.label}`} onClick={onClose}>
      <div className="card max-h-[92vh] w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{doc.label}</div>
            <div className="truncate text-xs text-muted">“{evidence.quote}”</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost !p-2" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto bg-surface-2 p-3">
          <div className="relative mx-auto w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={doc.src} alt={doc.label} className="block w-full rounded-md" />
            {box && (
              <div
                className="pointer-events-none absolute rounded-sm ring-4 ring-amber/70"
                style={{
                  left: `${(box.x0 / doc.width!) * 100}%`,
                  top: `${(box.y0 / doc.height!) * 100}%`,
                  width: `${((box.x1 - box.x0) / doc.width!) * 100}%`,
                  height: `${((box.y1 - box.y0) / doc.height!) * 100}%`,
                  background: "rgba(251, 191, 36, .28)",
                }}
              />
            )}
          </div>
          {!box && <p className="mt-2 text-xs text-muted">This line came from the document&apos;s text layer, so there is no box to highlight.</p>}
        </div>
      </div>
    </div>
  );
}
