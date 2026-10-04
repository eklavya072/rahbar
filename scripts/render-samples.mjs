// Renders the synthetic sample documents in src/lib/samples/cases.ts to watermarked PNGs in public/samples/.
// Usage: PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/render-samples.mjs
// (Node 22.18+/26 runs the .ts import directly via type stripping.)

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { SAMPLE_CASES } = await import(pathToFileURL(path.join(root, "src/lib/samples/cases.ts")).href);
const { chromium } = await import(pathToFileURL(path.join(process.env.PLAYWRIGHT_PATH, "index.mjs")).href);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const base = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #e9e6df; font-family: "Kohinoor Devanagari", "Devanagari Sangam MN", "Noto Sans Devanagari", Arial, sans-serif; }
  .page { position: relative; width: 1000px; margin: 24px auto; background: #fffdf8; padding: 40px 48px 56px; box-shadow: 0 2px 10px rgba(0,0,0,.18); color: #1d1d1d; overflow: hidden; }
  .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .wm span { transform: rotate(-28deg); font-size: 64px; font-weight: 800; color: rgba(200, 30, 30, .07); white-space: nowrap; letter-spacing: 4px; }
  .banner { font: 600 12px/1.2 Arial, sans-serif; color: #a11; border: 1px dashed #c55; padding: 4px 8px; display: inline-block; margin-bottom: 14px; }
  .line { font-size: 19px; line-height: 1.55; padding: 3px 0; }
  h1 { font-size: 23px; margin: 0 0 6px; text-align: center; }
  .sub { text-align: center; font-size: 16px; color: #333; margin-bottom: 18px; }
  .box { border: 1.5px solid #333; padding: 12px 16px; margin-top: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 18px; }
  th, td { border: 1px solid #555; padding: 7px 8px; text-align: left; }
  th { background: #f1ede3; }
  .hdr { border-bottom: 3px double #333; padding-bottom: 10px; margin-bottom: 12px; }
  .ins { color: #0b3b6f; }
  .stamp { margin-top: 22px; font-size: 15px; color: #555; }
`;

function firHtml(doc) {
  const [title, sub, ...rest] = doc.lines;
  const narrIdx = rest.findIndex((l) => /Contents of FIR|घटना का विवरण/.test(l));
  const head = narrIdx >= 0 ? rest.slice(0, narrIdx) : rest;
  const narr = narrIdx >= 0 ? rest.slice(narrIdx) : [];
  const actIdx = narr.findIndex((l) => /^Action taken/.test(l));
  const story = actIdx >= 0 ? narr.slice(0, actIdx) : narr;
  const tail = actIdx >= 0 ? narr.slice(actIdx) : [];
  return `<div class="hdr"><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div></div>
    ${head.map((l) => `<div class="line">${esc(l)}</div>`).join("")}
    <div class="box">${story.map((l) => `<div class="line">${esc(l)}</div>`).join("")}</div>
    ${tail.map((l) => `<div class="line" style="margin-top:10px">${esc(l)}</div>`).join("")}
    <div class="stamp">CCTNS-style layout · fictional police station · for demonstration only</div>`;
}

function passbookHtml(doc) {
  const headerIdx = doc.lines.findIndex((l) => l.startsWith("Date |"));
  const head = doc.lines.slice(0, headerIdx);
  const cols = doc.lines[headerIdx].split("|").map((s) => s.trim());
  const rows = doc.lines.slice(headerIdx + 1).map((l) => l.split("|").map((s) => s.trim()));
  return `<div class="hdr"><h1>${esc(head[0])}</h1></div>
    ${head.slice(1).map((l) => `<div class="line">${esc(l)}</div>`).join("")}
    <table><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>
    ${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>
    <div class="stamp">Fictional bank · for demonstration only</div>`;
}

function policyHtml(doc) {
  const [insurer, kind, ...rest] = doc.lines;
  return `<div class="hdr"><h1 class="ins">${esc(insurer)}</h1><div class="sub">${esc(kind)}</div></div>
    ${rest.map((l) => `<div class="line">${esc(l)}</div>`).join("")}
    <div class="stamp">Fictional insurer · for demonstration only</div>`;
}

const outDir = path.join(root, "public/samples");
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1.5, viewport: { width: 1080, height: 800 } });
const manifest = [];

for (const c of SAMPLE_CASES) {
  for (const doc of c.docs) {
    const body = doc.kind === "fir" ? firHtml(doc) : doc.kind === "passbook" ? passbookHtml(doc) : policyHtml(doc);
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>
      <div class="page"><div class="wm"><span>SAMPLE · SYNTHETIC · NOT VALID</span></div>
      <div class="banner">SAMPLE — SYNTHETIC DOCUMENT — Rahbar demo — all names fictional</div>${body}</div></body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    const el = await page.$(".page");
    const file = `${doc.id}.png`;
    await el.screenshot({ path: path.join(outDir, file) });
    manifest.push({ caseId: c.id, docId: doc.id, label: doc.label, kind: doc.kind, file: `/samples/${file}` });
    console.log("rendered", file);
  }
}
writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
await browser.close();
