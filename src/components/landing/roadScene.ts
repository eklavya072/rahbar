// The hero film, drawn live: a night road that turns to dawn as the reader scrolls.
// p (0..1) is scroll progress — it drives travel, the lamps lighting one by one,
// the lane markings turning brass and the sunrise. `time` (seconds) only animates
// rain and starlight, so the scene is alive even when the reader is still.

export interface SceneData {
  stars: { x: number; y: number; r: number; phase: number; rate: number }[];
  rain: { x: number; y: number; len: number; speed: number }[];
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export function makeScene(): SceneData {
  const r = rng(20261005);
  return {
    stars: Array.from({ length: 150 }, () => ({ x: r(), y: r() * 0.55, r: 0.4 + r() * 1.1, phase: r() * 6.28, rate: 0.6 + r() * 1.6 })),
    rain: Array.from({ length: 110 }, () => ({ x: r(), y: r(), len: 14 + r() * 22, speed: 0.55 + r() * 0.5 })),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const smoothstep = (p: number, a: number, b: number) => {
  const t = clamp((p - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rgb = (c1: number[], c2: number[], t: number, a = 1) =>
  `rgba(${Math.round(mix(c1[0], c2[0], t))},${Math.round(mix(c1[1], c2[1], t))},${Math.round(mix(c1[2], c2[2], t))},${a})`;

const BRASS = [206, 168, 80];
const IVORY = [242, 241, 236];

export function drawScene(ctx: CanvasRenderingContext2D, W: number, H: number, p: number, time: number, data: SceneData) {
  const hy = H * 0.57; // horizon
  const vx = W / 2;
  const dawn = smoothstep(p, 0.58, 1);
  const lit = smoothstep(p, 0.4, 0.78);
  const travel = p * 34;

  // ── Sky: night navy → dawn brass at the horizon
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, rgb([5, 7, 11], [14, 18, 27], dawn));
  sky.addColorStop(0.55, rgb([9, 12, 18], [40, 33, 26], dawn));
  sky.addColorStop(1, rgb([18, 24, 35], [128, 94, 42], dawn));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, hy + 1);

  // Sun glow rising behind the horizon
  if (dawn > 0.01) {
    const gr = ctx.createRadialGradient(vx, hy + 8, 0, vx, hy + 8, W * (0.25 + 0.5 * dawn));
    gr.addColorStop(0, `rgba(240,200,120,${0.42 * dawn})`);
    gr.addColorStop(0.35, `rgba(206,168,80,${0.2 * dawn})`);
    gr.addColorStop(1, "rgba(206,168,80,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // Stars fade as the light comes
  const starA = 1 - smoothstep(p, 0.5, 0.86);
  if (starA > 0.01) {
    for (const s of data.stars) {
      const tw = 0.55 + 0.45 * Math.sin(time * s.rate + s.phase);
      ctx.fillStyle = `rgba(242,241,236,${0.75 * tw * starA})`;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Ground
  const ground = ctx.createLinearGradient(0, hy, 0, H);
  ground.addColorStop(0, rgb([16, 20, 27], [58, 46, 32], dawn));
  ground.addColorStop(1, rgb([5, 6, 9], [16, 14, 12], dawn));
  ctx.fillStyle = ground;
  ctx.fillRect(0, hy, W, H - hy);

  // Perspective helpers: world distance d (1 = at the viewer) → screen t (1 bottom … 0 horizon)
  const tOf = (d: number) => 1 / Math.max(d, 0.0001);
  const yOf = (t: number) => hy + (H - hy) * t;
  const half = (t: number) => mix(W * 0.006, W * 0.72, t);

  // Road surface
  ctx.beginPath();
  ctx.moveTo(vx - half(0), hy);
  ctx.lineTo(vx + half(0), hy);
  ctx.lineTo(vx + half(1), H);
  ctx.lineTo(vx - half(1), H);
  ctx.closePath();
  const road = ctx.createLinearGradient(0, hy, 0, H);
  road.addColorStop(0, rgb([22, 26, 34], [70, 56, 38], dawn));
  road.addColorStop(1, rgb([10, 12, 16], [22, 20, 18], dawn));
  ctx.fillStyle = road;
  ctx.fill();

  // Road edges
  ctx.strokeStyle = `rgba(242,241,236,${0.16 + 0.12 * dawn})`;
  ctx.lineWidth = 1.2;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(vx + sgn * half(0), hy);
    ctx.lineTo(vx + sgn * half(1), H);
    ctx.stroke();
  }

  // Centre dashes travel toward the viewer and turn brass as the claims are found
  const dashCol = rgb(IVORY, BRASS, lit, 1);
  for (let k = 0; k < 18; k++) {
    let d = 1 + ((k * 3.2 - travel) % 57.6);
    if (d < 1) d += 57.6;
    const d2 = d + 1.5;
    const t1 = tOf(d) * 1.0;
    const t2 = tOf(d2);
    if (t1 > 1.6) continue;
    const y1 = yOf(Math.min(t1, 1.4));
    const y2 = yOf(t2);
    const w1 = Math.max(0.6, 7 * t1);
    const w2 = Math.max(0.4, 7 * t2);
    ctx.globalAlpha = Math.min(1, 0.25 + t1) * (0.55 + 0.45 * lit);
    ctx.fillStyle = dashCol;
    ctx.beginPath();
    ctx.moveTo(vx - w1 / 2, y1);
    ctx.lineTo(vx + w1 / 2, y1);
    ctx.lineTo(vx + w2 / 2, y2);
    ctx.lineTo(vx - w2 / 2, y2);
    ctx.closePath();
    ctx.fill();
    if (lit > 0.05) {
      ctx.shadowColor = `rgba(206,168,80,${0.8 * lit})`;
      ctx.shadowBlur = 12 * t1;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;

  // Street lamps: the path ahead lights up lamp by lamp, near to far — each one a claim found
  const reach = 2 + lit * 70;
  for (let i = 0; i < 26; i++) {
    // Lamps are evenly spaced in the world and stream past the viewer as we travel.
    const span = 26 * 4.4;
    const dd = ((((2.4 + i * 4.4 - travel - 1.2) % span) + span) % span) + 1.2;
    const t = tOf(dd);
    if (t < 0.012) continue;
    const on = dd < reach;
    for (const sgn of [-1, 1]) {
      const baseX = vx + sgn * (half(Math.min(t, 1.3)) + 26 * t);
      const baseY = yOf(Math.min(t, 1.3));
      const h = 230 * t;
      ctx.strokeStyle = `rgba(160,160,165,${Math.min(0.6, 0.15 + t)})`;
      ctx.lineWidth = Math.max(0.6, 3 * t);
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(baseX, baseY - h);
      ctx.lineTo(baseX - sgn * 22 * t, baseY - h);
      ctx.stroke();
      if (on) {
        const lx = baseX - sgn * 22 * t;
        const ly = baseY - h;
        const r = 70 * t + 6;
        const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
        glow.addColorStop(0, `rgba(255,226,160,${0.95})`);
        glow.addColorStop(0.2, `rgba(206,168,80,0.55)`);
        glow.addColorStop(1, "rgba(206,168,80,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0, Math.PI * 2);
        ctx.fill();
        // pool of light on the road
        ctx.fillStyle = `rgba(206,168,80,${0.09 * Math.min(1, t * 2)})`;
        ctx.beginPath();
        ctx.ellipse(lx + sgn * 10 * t, baseY + 4 * t, 110 * t, 22 * t, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // The vehicle that drove away: tail-lights receding into the dark, gone by the second beat
  const tail = 1 - smoothstep(p, 0.02, 0.17);
  if (tail > 0.01) {
    const d = 3.2 + p * 140;
    const t = tOf(d);
    const y = yOf(t) - 10 * t;
    for (const off of [-1, 1]) {
      const x = vx + off * 26 * t + 0.18 * half(t);
      const r = 26 * t + 3;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,90,70,${0.9 * tail})`);
      g.addColorStop(1, "rgba(200,40,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Mist on the horizon
  const mist = ctx.createLinearGradient(0, hy - H * 0.08, 0, hy + H * 0.1);
  mist.addColorStop(0, "rgba(242,241,236,0)");
  mist.addColorStop(0.5, `rgba(${dawn > 0.3 ? "230,200,140" : "170,180,195"},${0.07 + 0.1 * dawn})`);
  mist.addColorStop(1, "rgba(242,241,236,0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, hy - H * 0.08, W, H * 0.18);

  // Rain, which eases off as the night ends
  const rainA = 0.22 * (1 - smoothstep(p, 0.28, 0.66));
  if (rainA > 0.005) {
    ctx.strokeStyle = `rgba(200,210,225,${rainA})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of data.rain) {
      const y = ((d.y + time * d.speed) % 1) * H;
      const x = ((d.x + time * 0.04) % 1) * W;
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.len * 0.28, y + d.len);
    }
    ctx.stroke();
  }

  // Vignette
  const vg = ctx.createRadialGradient(vx, H * 0.55, Math.min(W, H) * 0.3, vx, H * 0.55, Math.max(W, H) * 0.85);
  vg.addColorStop(0, "rgba(6,8,12,0)");
  vg.addColorStop(1, "rgba(6,8,12,0.62)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}
