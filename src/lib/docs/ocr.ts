"use client";
// On-device OCR with Tesseract.js (English + Hindi). The image never leaves the browser.

import type { OcrLine } from "./parsers";

type TWorker = Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>;
let workerPromise: Promise<TWorker> | null = null;
let progressCb: ((p: number) => void) | null = null;

async function getWorker(): Promise<TWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const w = await createWorker(["eng", "hin"], 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text" && progressCb) progressCb(m.progress);
        },
      });
      // PSM 6 = "assume a uniform block of text": far more robust than auto layout on ruled tables (passbooks).
      await w.setParameters({ tessedit_pageseg_mode: "6" as never, preserve_interword_spaces: "1" });
      return w;
    })();
  }
  return workerPromise;
}

/** Light pre-processing: upscale small images and convert to greyscale for better OCR. */
async function preprocess(src: string): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const scale = img.naturalWidth < 1200 ? 1200 / img.naturalWidth : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.15)";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";
  removeRuledLines(ctx, canvas.width, canvas.height);
  return { canvas, width: canvas.width, height: canvas.height };
}

/**
 * Table-rule removal: passbooks and forms are ruled with long horizontal/vertical lines that make OCR
 * read rows as "—". Any pixel row/column that is mostly dark is a rule, not text — paint it white.
 */
function removeRuledLines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const dark = (i: number) => d[i] < 150;
  const rowCount = new Uint32Array(h);
  const colCount = new Uint32Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (dark((y * w + x) * 4)) {
        rowCount[y]++;
        colCount[x]++;
      }
    }
  }
  const whiten = (i: number) => {
    d[i] = d[i + 1] = d[i + 2] = 255;
  };
  for (let y = 0; y < h; y++) if (rowCount[y] > w * 0.45) for (let x = 0; x < w; x++) whiten((y * w + x) * 4);
  for (let x = 0; x < w; x++) {
    if (colCount[x] < h * 0.25) continue;
    // Only erase long vertical runs (rules), not text strokes.
    let run = 0;
    for (let y = 0; y <= h; y++) {
      const isDark = y < h && dark((y * w + x) * 4);
      if (isDark) run++;
      if (!isDark || y === h) {
        if (run > h * 0.08) for (let k = y - run; k < y; k++) whiten((k * w + x) * 4);
        run = 0;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export interface OcrResult {
  lines: OcrLine[];
  confidence: number;
  width: number;
  height: number;
  ms: number;
}

export async function ocrImage(src: string, onProgress?: (p: number) => void): Promise<OcrResult> {
  const started = performance.now();
  const { canvas, width, height } = await preprocess(src);
  const worker = await getWorker();
  progressCb = onProgress ?? null;
  const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
  progressCb = null;
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        const text = line.text.replace(/\s+/g, " ").trim();
        if (text) lines.push({ text, bbox: line.bbox });
      }
    }
  }
  return { lines, confidence: data.confidence ?? 0, width, height, ms: Math.round(performance.now() - started) };
}
