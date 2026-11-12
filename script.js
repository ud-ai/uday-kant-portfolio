/* Uday Kant — portfolio
   Scroll-driven reel, pinned list, scroll story and canvas scenes. No dependencies. */
(() => {
  'use strict';

  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeIO = (t) => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mqFlat = matchMedia('(max-width: 760px), (max-height: 540px)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

  let still = html.classList.contains('still');
  const pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999, live: false };
  let lenis = null;
  function makeLenis() {
    if (still || !window.Lenis || lenis) return;
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
  }
  makeLenis();

  /* ---------- colour helpers ---------- */
  const INK = [242, 242, 239];
  const MUT = [154, 160, 170];
  const ACC = [251, 94, 40];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mono = (px, w = 500) => `${w} ${px}px "Geist Mono", ui-monospace, monospace`;
  const sans = (px, w = 500) => `${w} ${px}px Geist, system-ui, sans-serif`;

  function seeded(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function dotGrid(c, w, h, S, a = 0.06) {
    c.fillStyle = rgba(INK, a);
    const sp = Math.max(14, 26 * S);
    const d = Math.max(1, 1.4 * S);
    for (let x = sp / 2; x < w; x += sp) for (let y = sp / 2; y < h; y += sp) c.fillRect(x - d / 2, y - d / 2, d, d);
  }

  /* fade the whole frame in at the start of a loop and out at its end */
  const loopAlpha = (lt, period, fade = 0.5) => clamp(Math.min(lt / 0.35, (period - lt) / fade));

  /* ==========================================================
     Scenes. Each draws one frame: (ctx, w, h, t seconds, grade 0..1)
     grade fades the accent in from grey, like footage being graded.
     ========================================================== */
  const DRAW = {};

  /* 01 — a point that draws a path: AI, web, Android */
  DRAW.path = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    const P = 7.5, lt = t % P;
    dotGrid(c, w, h, S);
    const fx = (u) => -0.04 * w + u * 1.08 * w;
    const fy = (u) => h * (0.72 - 0.4 * u) + h * 0.075 * Math.sin(u * 7.4 + 0.3);
    const pr = fz ? 0.86 : easeIO(lt / 4.6) * 0.98;
    const A = fz ? 1 : loopAlpha(lt, P, 0.7);
    const N = 160;

    c.lineCap = 'round';
    c.lineWidth = Math.max(1, 1.2 * S);
    c.strokeStyle = rgba(INK, 0.08);
    c.setLineDash([2 * S, 6 * S]);
    c.beginPath();
    for (let i = 0; i <= N; i++) { const u = i / N; i ? c.lineTo(fx(u), fy(u)) : c.moveTo(fx(u), fy(u)); }
    c.stroke();
    c.setLineDash([]);

    c.globalAlpha = A;
    c.lineWidth = Math.max(1.2, 1.8 * S);
    c.strokeStyle = rgba(INK, 0.92);
    c.beginPath();
    const M = Math.max(1, Math.round(N * pr));
    for (let i = 0; i <= M; i++) { const u = (i / N); i ? c.lineTo(fx(u), fy(u)) : c.moveTo(fx(u), fy(u)); }
    c.stroke();

    const marks = [[0.27, 'AI'], [0.54, 'WEB'], [0.79, 'ANDROID']];
    c.font = mono(Math.max(10, 12 * S));
    c.textAlign = 'center';
    for (const [u, label] of marks) {
      const x = fx(u), y = fy(u), on = pr >= u;
      c.beginPath();
      c.arc(x, y, 5 * S + 1, 0, Math.PI * 2);
      c.fillStyle = on ? rgba(INK) : rgba([17, 21, 28]);
      c.fill();
      c.lineWidth = Math.max(1, 1.4 * S);
      c.strokeStyle = rgba(INK, on ? 1 : 0.35);
      c.stroke();
      if (on) {
        const k = fz ? 1 : ease((pr - u) * 8);
        c.fillStyle = rgba(INK, 0.85 * k);
        c.fillText(label, x, y - 18 * S - 4 * (1 - k));
      }
    }

    const hx = fx(pr), hy = fy(pr);
    const ph = (t * 0.8) % 1;
    c.beginPath();
    c.arc(hx, hy, 7 * S + ph * 26 * S, 0, Math.PI * 2);
    c.strokeStyle = rgba(acc, 0.7 * (1 - ph));
    c.lineWidth = Math.max(1, 1.2 * S);
    c.stroke();
    c.beginPath();
    c.arc(hx, hy, 7 * S, 0, Math.PI * 2);
    c.fillStyle = rgba(acc);
    c.shadowColor = rgba(acc, 0.8);
    c.shadowBlur = 16 * S;
    c.fill();
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  };
  DRAW.path.still = 0;

  /* 02 — retrieval: a query finds its nearest documents, then answers */
  const ragNodes = (() => {
    const r = seeded(11), out = [];
    for (let i = 0; i < 54; i++) out.push([0.06 + r() * 0.56, 0.12 + r() * 0.76, r()]);
    const Q = [0.33, 0.5];
    const d = out.map((n, i) => [Math.hypot((n[0] - Q[0]) * 1.78, n[1] - Q[1]), i]).sort((a, b) => a[0] - b[0]);
    return { out, Q, top: d.slice(0, 6).map((x) => x[1]), dist: d };
  })();

  DRAW.rag = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    const P = 7, lt = fz ? 5 : t % P;
    const A = fz ? 1 : loopAlpha(lt, P, 0.6);
    const { out, Q, top, dist } = ragNodes;
    const qx = Q[0] * w, qy = Q[1] * h;
    const kth = dist[top.length - 1][0];
    const reach = ease(lt / 1.7) * (kth + 0.012);
    const fs = Math.max(10, 11.5 * S);
    dotGrid(c, w, h, S, 0.04);
    c.globalAlpha = A;

    // search radius
    if (lt < 2.4) {
      c.beginPath();
      c.ellipse(qx, qy, (reach / 1.78) * w, reach * h, 0, 0, Math.PI * 2);
      c.strokeStyle = rgba(acc, 0.4 * (1 - clamp((lt - 1.7) / 0.7)));
      c.lineWidth = Math.max(1, S);
      c.setLineDash([3 * S, 5 * S]);
      c.stroke();
      c.setLineDash([]);
    }

    // documents
    out.forEach((n, i) => {
      const x = n[0] * w, y = n[1] * h;
      const isTop = top.includes(i);
      const hit = isTop && dist.find((d) => d[1] === i)[0] <= reach;
      if (hit) {
        c.strokeStyle = rgba(INK, 0.25);
        c.lineWidth = Math.max(1, S);
        c.beginPath(); c.moveTo(qx, qy); c.lineTo(x, y); c.stroke();
      }
      c.beginPath();
      c.arc(x, y, (hit ? 4.5 : 2 + n[2] * 1.6) * S + 0.5, 0, Math.PI * 2);
      c.fillStyle = hit ? rgba(acc) : rgba(INK, 0.22 + n[2] * 0.15);
      c.fill();
    });

    // context flowing into the answer
    const bx = 0.69 * w, by = 0.27 * h, bw = 0.25 * w, bh = 0.46 * h;
    const flow = ease((lt - 1.9) / 1.2);
    if (flow > 0) {
      top.forEach((i, k) => {
        const n = out[i], x = n[0] * w, y = n[1] * h;
        const ex = bx, ey = by + bh * (0.25 + k * 0.1);
        const f = clamp(flow * 1.25 - k * 0.05);
        c.strokeStyle = rgba(acc, 0.45);
        c.lineWidth = Math.max(1, S);
        c.beginPath();
        c.moveTo(x, y);
        const mx = lerp(x, ex, 0.6);
        c.bezierCurveTo(mx, y, mx, ey, lerp(x, ex, f), lerp(y, ey, f));
        c.stroke();
      });
    }

    // answer card
    const ans = ease((lt - 2.8) / 0.6);
    c.globalAlpha = A * Math.max(0.35, ans);
    rr(c, bx, by, bw, bh, 10 * S);
    c.fillStyle = rgba([17, 21, 28], 0.95);
    c.fill();
    c.strokeStyle = rgba(INK, 0.18);
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = rgba(MUT);
    c.font = mono(fs);
    c.textAlign = 'left';
    c.fillText('answer', bx + 14 * S, by + 22 * S + 4);
    const bars = [0.86, 0.7, 0.8, 0.52, 0.64];
    bars.forEach((b, k) => {
      const f = clamp((lt - 3.1 - k * 0.32) / 0.5);
      const yy = by + 44 * S + 8 + k * 18 * S;
      if (yy > by + bh - 20 * S) return;
      rr(c, bx + 14 * S, yy, (bw - 28 * S) * b, 5 * S + 1, 3 * S);
      c.fillStyle = rgba(INK, 0.08);
      c.fill();
      rr(c, bx + 14 * S, yy, (bw - 28 * S) * b * ease(f), 5 * S + 1, 3 * S);
      c.fillStyle = rgba(k === 0 ? acc : INK, k === 0 ? 0.9 : 0.6);
      c.fill();
    });
    c.globalAlpha = A;

    // query point
    c.beginPath();
    c.arc(qx, qy, 7 * S + 1, 0, Math.PI * 2);
    c.fillStyle = rgba(INK);
    c.fill();
    c.fillStyle = rgba(INK, 0.85);
    c.font = mono(fs);
    c.textAlign = 'center';
    c.fillText('query', qx, qy - 16 * S - 4);
    c.fillStyle = rgba(MUT);
    c.fillText(`top-k = ${top.length}`, qx, qy + 26 * S + 6);
    c.globalAlpha = 1;
  };
  DRAW.rag.still = 5;

  /* 03 — CodeBlitz: code types itself, then a hint arrives */
  const CODE = [
    'function twoSum(nums, target) {',
    '  const seen = new Map();',
    '  for (let i = 0; i < nums.length; i++) {',
    '    const need = target - nums[i];',
    '    if (seen.has(need)) return [seen.get(need), i];',
    '    seen.set(nums[i], i);',
    '  }',
    '}',
  ];
  const KW = /^(function|const|let|for|if|return|new)$/;
  const CODE_TOKENS = CODE.map((line) => {
    const out = [];
    line.replace(/([A-Za-z_]\w*|\d+|\s+|.)/g, (tok) => {
      let kind = 'p';
      if (KW.test(tok)) kind = 'k';
      else if (/^\d+$/.test(tok)) kind = 'n';
      else if (/^[A-Za-z_]/.test(tok)) kind = 'i';
      for (const ch of tok) out.push([ch, kind]);
      return tok;
    });
    return out;
  });
  const CODE_TOTAL = CODE_TOKENS.reduce((a, l) => a + l.length, 0);

  DRAW.code = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    const P = 10, lt = fz ? 8 : t % P;
    const A = fz ? 1 : loopAlpha(lt, P, 0.6);
    c.globalAlpha = A;
    const x0 = 0.07 * w, y0 = 0.1 * h, ww = 0.86 * w, wh = 0.72 * h;
    rr(c, x0, y0, ww, wh, 12 * S);
    c.fillStyle = 'rgba(255,255,255,0.025)';
    c.fill();
    c.strokeStyle = rgba(INK, 0.1);
    c.lineWidth = 1;
    c.stroke();
    [0, 1, 2].forEach((k) => {
      c.beginPath();
      c.arc(x0 + 18 * S + k * 14 * S, y0 + 17 * S, 4 * S, 0, Math.PI * 2);
      c.fillStyle = rgba(INK, 0.18);
      c.fill();
    });
    c.font = mono(Math.max(9, 11 * S));
    c.fillStyle = rgba(MUT);
    c.textAlign = 'center';
    c.fillText('interview.ts', x0 + ww / 2, y0 + 21 * S);
    c.strokeStyle = rgba(INK, 0.08);
    c.beginPath(); c.moveTo(x0, y0 + 34 * S); c.lineTo(x0 + ww, y0 + 34 * S); c.stroke();

    const fs = Math.max(8, 14.5 * S);
    c.font = mono(fs, 400);
    c.textAlign = 'left';
    const cw = c.measureText('M').width;
    const lh = fs * 1.75;
    const typed = Math.floor(ease(lt / 5.6) * CODE_TOTAL);
    let n = 0, cx = x0, cy = y0;
    const tx = x0 + 52 * S, ty = y0 + 34 * S + lh * 1.05;
    CODE_TOKENS.forEach((line, li) => {
      c.fillStyle = rgba(INK, 0.2);
      c.textAlign = 'right';
      c.fillText(String(li + 1), tx - 18 * S, ty + li * lh);
      c.textAlign = 'left';
      line.forEach(([ch, kind], ci) => {
        if (n >= typed) return;
        n++;
        c.fillStyle = kind === 'k' ? rgba(acc) : kind === 'i' ? rgba(INK, 0.92) : kind === 'n' ? rgba(mix(MUT, [255, 196, 160], g)) : rgba(MUT);
        c.fillText(ch, tx + ci * cw, ty + li * lh);
        cx = tx + (ci + 1) * cw; cy = ty + li * lh;
      });
    });
    if (typed === 0) { cx = tx; cy = ty; }
    if (Math.floor(t * 2) % 2 === 0 || typed < CODE_TOTAL) {
      c.fillStyle = rgba(acc);
      c.fillRect(cx + 1, cy - fs * 0.85, Math.max(1.5, 2 * S), fs * 1.05);
    }

    // hint bubble
    const hk = ease((lt - 6) / 0.7);
    if (hk > 0) {
      const text = 'Hint: a hash map gives O(1) lookups.';
      c.font = sans(Math.max(10, 13.5 * S), 500);
      const tw = c.measureText(text).width;
      const bw = tw + 30 * S, bh = 40 * S + 6;
      const bx = x0 + ww - bw - 20 * S, by = y0 + wh - bh - 18 * S + (1 - hk) * 10 * S;
      c.globalAlpha = A * hk;
      rr(c, bx, by, bw, bh, bh / 2);
      c.fillStyle = rgba(acc, 0.14);
      c.fill();
      c.strokeStyle = rgba(acc, 0.85);
      c.stroke();
      c.fillStyle = rgba(INK);
      c.textBaseline = 'middle';
      c.fillText(text, bx + 15 * S, by + bh / 2);
      c.textBaseline = 'alphabetic';
    }
    c.globalAlpha = 1;
  };
  DRAW.code.still = 8;

  /* 04 — 300 problems, filled in like a practice graph */
  const GRID = (() => {
    const r = seeded(5), cells = [];
    for (let i = 0; i < 300; i++) { const v = r(); cells.push(v < 0.5 ? 0 : v < 0.85 ? 1 : 2); }
    return cells;
  })();

  DRAW.grid = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    const P = 8, lt = fz ? 6 : t % P;
    const A = fz ? 1 : loopAlpha(lt, P, 0.6);
    const cols = 30, rows = 10;
    const cell = Math.min((w * 0.82) / cols, (h * 0.5) / rows);
    const gap = cell * 0.22, sz = cell - gap;
    const gx = (w - cols * cell + gap) / 2, gy = h * 0.2;
    const filled = Math.floor(ease(lt / 4) * 300);
    c.globalAlpha = A;
    for (let i = 0; i < 300; i++) {
      const col = Math.floor(i / rows), row = i % rows;
      const x = gx + col * cell, y = gy + row * cell;
      rr(c, x, y, sz, sz, sz * 0.22);
      if (i < filled) {
        const d = GRID[i];
        c.fillStyle = d === 2 ? rgba(acc) : rgba(INK, d === 1 ? 0.62 : 0.28);
      } else c.fillStyle = rgba(INK, 0.05);
      c.fill();
    }
    const by = gy + rows * cell + 34 * S + 4;
    c.font = sans(Math.max(18, 40 * S), 600);
    c.textAlign = 'left';
    c.fillStyle = rgba(INK);
    c.fillText(filled >= 300 ? '300+' : String(filled), gx, by + 10 * S);
    c.font = mono(Math.max(10, 11.5 * S));
    c.fillStyle = rgba(MUT);
    c.fillText('problems solved', gx, by + 32 * S + 6);
    // legend
    c.textAlign = 'right';
    const lx = gx + cols * cell - gap;
    [['hard', rgba(acc)], ['medium', rgba(INK, 0.62)], ['easy', rgba(INK, 0.28)]].forEach(([label, col], k) => {
      const x = lx - k * 92 * S;
      c.fillStyle = rgba(MUT);
      c.fillText(label, x, by + 10 * S);
      const tw = c.measureText(label).width;
      rr(c, x - tw - 16 * S, by + 10 * S - 9 * S, 9 * S, 9 * S, 2 * S);
      c.fillStyle = col;
      c.fill();
    });
    c.globalAlpha = 1;
  };
  DRAW.grid.still = 6;

  /* 05 — interfaces assemble, Lighthouse fills to 100 */
  DRAW.ui = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    const P = 8, lt = fz ? 6 : t % P;
    const A = fz ? 1 : loopAlpha(lt, P, 0.6);
    dotGrid(c, w, h, S, 0.04);
    c.globalAlpha = A;
    const x0 = 0.08 * w, y0 = 0.1 * h, ww = 0.6 * w, wh = 0.8 * h;
    rr(c, x0, y0, ww, wh, 12 * S);
    c.fillStyle = 'rgba(255,255,255,0.025)';
    c.fill();
    c.strokeStyle = rgba(INK, 0.1);
    c.stroke();
    const piece = (i, draw) => {
      const k = ease((lt - 0.2 - i * 0.22) / 0.6);
      if (k <= 0) return;
      c.save();
      c.globalAlpha = A * k;
      c.translate(0, (1 - k) * 12 * S);
      draw();
      c.restore();
    };
    const p = 22 * S;
    piece(0, () => {
      rr(c, x0 + p, y0 + p, 46 * S, 10 * S, 5 * S); c.fillStyle = rgba(INK, 0.9); c.fill();
      [0, 1, 2].forEach((k) => { rr(c, x0 + ww - p - 34 * S - k * 44 * S, y0 + p, 34 * S, 10 * S, 5 * S); c.fillStyle = rgba(INK, 0.25); c.fill(); });
    });
    piece(1, () => { rr(c, x0 + p, y0 + 62 * S, ww * 0.62, 20 * S, 6 * S); c.fillStyle = rgba(INK, 0.9); c.fill(); });
    piece(2, () => { rr(c, x0 + p, y0 + 90 * S, ww * 0.44, 20 * S, 6 * S); c.fillStyle = rgba(INK, 0.9); c.fill(); });
    piece(3, () => { rr(c, x0 + p, y0 + 124 * S, ww * 0.5, 8 * S, 4 * S); c.fillStyle = rgba(INK, 0.3); c.fill(); });
    piece(4, () => { rr(c, x0 + p, y0 + 150 * S, 96 * S, 26 * S, 13 * S); c.fillStyle = rgba(acc); c.fill(); });
    const cwid = (ww - p * 2 - 24 * S) / 3;
    [0, 1, 2].forEach((k) => piece(5 + k, () => {
      const cx = x0 + p + k * (cwid + 12 * S), cy = y0 + 200 * S;
      const ch = Math.max(20, y0 + wh - p - cy);
      rr(c, cx, cy, cwid, ch, 8 * S);
      c.fillStyle = rgba(INK, 0.06); c.fill();
      rr(c, cx + 10 * S, cy + 10 * S, cwid * 0.5, 7 * S, 3 * S); c.fillStyle = rgba(INK, 0.5); c.fill();
      rr(c, cx + 10 * S, cy + 24 * S, cwid * 0.7, 5 * S, 3 * S); c.fillStyle = rgba(INK, 0.18); c.fill();
    }));

    // lighthouse ring
    const rx = x0 + ww + (w - x0 - ww) / 2, ry = h * 0.45, R = Math.min(0.11 * w, 0.24 * h);
    const v = ease((lt - 2.2) / 1.8);
    c.lineWidth = Math.max(3, 7 * S);
    c.lineCap = 'round';
    c.strokeStyle = rgba(INK, 0.08);
    c.beginPath(); c.arc(rx, ry, R, 0, Math.PI * 2); c.stroke();
    if (v > 0) {
      c.strokeStyle = rgba(mix(MUT, [70, 201, 120], g));
      c.beginPath(); c.arc(rx, ry, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); c.stroke();
    }
    c.fillStyle = rgba(INK);
    c.font = sans(Math.max(14, R * 0.62), 600);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(Math.round(v * 100)), rx, ry + 1);
    c.textBaseline = 'alphabetic';
    c.font = mono(Math.max(10, 11.5 * S));
    c.fillStyle = rgba(MUT);
    c.fillText('performance', rx, ry + R + 26 * S + 4);
    c.globalAlpha = 1;
  };
  DRAW.ui.still = 6;

  /* 06 — Android: a Compose list scrolls in a phone */
  DRAW.android = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    dotGrid(c, w, h, S, 0.04);
    const ph = h * 0.84, pw = ph * 0.49;
    const px = w * 0.56 - pw / 2, py = (h - ph) / 2;
    rr(c, px, py, pw, ph, pw * 0.16);
    c.fillStyle = rgba([17, 21, 28]);
    c.fill();
    c.strokeStyle = rgba(INK, 0.3);
    c.lineWidth = Math.max(1.2, 2 * S);
    c.stroke();
    const ix = px + pw * 0.06, iy = py + pw * 0.06, iw = pw * 0.88, ih = ph - pw * 0.12;
    c.save();
    rr(c, ix, iy, iw, ih, pw * 0.11);
    c.clip();
    c.fillStyle = rgba(INK, 0.03);
    c.fillRect(ix, iy, iw, ih);
    const cardH = ih * 0.13, gap = ih * 0.03, step = cardH + gap;
    const off = fz ? 0 : (t * 22 * S) % step;
    const top = iy + ih * 0.16;
    for (let k = -1; k < 9; k++) {
      const y = top + k * step - off;
      const idx = (k + Math.floor(fz ? 0 : (t * 22 * S) / step)) % 9;
      rr(c, ix + iw * 0.07, y, iw * 0.86, cardH, cardH * 0.22);
      c.fillStyle = rgba(INK, 0.07);
      c.fill();
      c.beginPath();
      c.arc(ix + iw * 0.07 + cardH * 0.5, y + cardH / 2, cardH * 0.24, 0, Math.PI * 2);
      c.fillStyle = idx % 4 === 0 ? rgba(acc) : rgba(INK, 0.3);
      c.fill();
      rr(c, ix + iw * 0.07 + cardH, y + cardH * 0.3, iw * 0.42, cardH * 0.13, 3);
      c.fillStyle = rgba(INK, 0.6); c.fill();
      rr(c, ix + iw * 0.07 + cardH, y + cardH * 0.56, iw * 0.3, cardH * 0.1, 3);
      c.fillStyle = rgba(INK, 0.2); c.fill();
    }
    // app bar
    c.fillStyle = rgba([17, 21, 28]);
    c.fillRect(ix, iy, iw, ih * 0.14);
    rr(c, ix + iw * 0.08, iy + ih * 0.065, iw * 0.4, ih * 0.03, 4);
    c.fillStyle = rgba(INK, 0.9); c.fill();
    c.restore();
    // FAB
    const fr = pw * 0.11, fx = px + pw - pw * 0.22, fy = py + ph - pw * 0.24;
    c.beginPath(); c.arc(fx, fy, fr, 0, Math.PI * 2);
    c.fillStyle = rgba(acc); c.fill();
    c.strokeStyle = rgba([9, 12, 18]);
    c.lineWidth = Math.max(1.5, 2.2 * S);
    c.beginPath(); c.moveTo(fx - fr * 0.4, fy); c.lineTo(fx + fr * 0.4, fy); c.moveTo(fx, fy - fr * 0.4); c.lineTo(fx, fy + fr * 0.4); c.stroke();
    // labels
    c.font = mono(Math.max(10, 12 * S));
    c.textAlign = 'right';
    ['Kotlin', 'Jetpack Compose', 'Firebase'].forEach((label, k) => {
      const y = h * 0.36 + k * 34 * S;
      const lx = px - 30 * S;
      c.fillStyle = rgba(INK, 0.8);
      c.fillText(label, lx, y);
      c.strokeStyle = rgba(INK, 0.15);
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(lx + 8 * S, y - 4 * S); c.lineTo(px - 4 * S, y - 4 * S); c.stroke();
    });
  };
  DRAW.android.still = 0;

  /* 07 — systems: messages flow through a queue to cache and pods */
  DRAW.systems = (c, w, h, t, g, fz) => {
    const S = w / 800, acc = mix(MUT, ACC, g);
    dotGrid(c, w, h, S, 0.04);
    const fs = Math.max(10, 12 * S);
    const box = (x, y, bw, bh, label, hi) => {
      rr(c, x - bw / 2, y - bh / 2, bw, bh, 10 * S);
      c.fillStyle = rgba([17, 21, 28]);
      c.fill();
      c.strokeStyle = hi ? rgba(acc, 0.9) : rgba(INK, 0.22);
      c.lineWidth = Math.max(1, 1.2 * S);
      c.stroke();
      c.fillStyle = rgba(INK, 0.85);
      c.font = mono(fs);
      c.textAlign = 'center';
      c.fillText(label, x, y - bh / 2 - 10 * S);
    };
    const app = [0.14 * w, 0.5 * h], q = [0.43 * w, 0.5 * h], cache = [0.74 * w, 0.27 * h], pods = [0.74 * w, 0.7 * h];
    const lanes = [-1, 0, 1].map((k) => q[1] + k * 0.08 * h);
    const route = (a, b) => (u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    const links = [
      ...lanes.map((ly) => route([app[0] + 0.06 * w, app[1]], [q[0] - 0.1 * w, ly])),
      ...lanes.map((ly) => route([q[0] + 0.1 * w, ly], [cache[0] - 0.08 * w, cache[1]])),
      ...lanes.map((ly) => route([q[0] + 0.1 * w, ly], [pods[0] - 0.1 * w, pods[1]])),
    ];
    c.strokeStyle = rgba(INK, 0.1);
    c.lineWidth = 1;
    links.forEach((f) => { const a = f(0), b = f(1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });

    box(app[0], app[1], 0.12 * w, 0.2 * h, 'app');
    box(q[0], q[1], 0.2 * w, 0.32 * h, 'kafka');
    box(cache[0], cache[1], 0.16 * w, 0.16 * h, 'redis', true);
    box(pods[0], pods[1], 0.2 * w, 0.26 * h, 'k8s pods');

    // partitions
    lanes.forEach((ly, k) => {
      rr(c, q[0] - 0.085 * w, ly - 0.022 * h, 0.17 * w, 0.044 * h, 4 * S);
      c.fillStyle = rgba(INK, 0.05);
      c.fill();
      for (let m = 0; m < 6; m++) {
        const off = fz ? 0 : (t * 0.9 + k * 0.33) % 1;
        const x = q[0] - 0.075 * w + ((m / 6 + off / 6) % 1) * 0.15 * w;
        c.fillStyle = rgba(INK, 0.35);
        c.fillRect(x, ly - 0.012 * h, 0.012 * w, 0.024 * h);
      }
    });
    // pods
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) {
      const x = pods[0] - 0.072 * w + k * 0.052 * w, y = pods[1] - 0.06 * h + r * 0.12 * h;
      const pulse = fz ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.4 + r * 2 + k);
      rr(c, x - 0.02 * w, y - 0.035 * h, 0.04 * w, 0.07 * h, 4 * S);
      c.fillStyle = rgba(INK, 0.1 + pulse * 0.25);
      c.fill();
    }
    // cache bolt
    c.fillStyle = rgba(acc);
    c.beginPath();
    const bx = cache[0], by = cache[1], bs = 0.045 * h;
    c.moveTo(bx + bs * 0.2, by - bs); c.lineTo(bx - bs * 0.5, by + bs * 0.15); c.lineTo(bx, by + bs * 0.15);
    c.lineTo(bx - bs * 0.2, by + bs); c.lineTo(bx + bs * 0.5, by - bs * 0.15); c.lineTo(bx, by - bs * 0.15);
    c.closePath(); c.fill();
    // packets
    links.forEach((f, i) => {
      const u = fz ? (i * 0.17) % 1 : (t * 0.45 + i * 0.29) % 1;
      const [x, y] = f(u);
      c.beginPath();
      c.arc(x, y, 3.2 * S + 0.8, 0, Math.PI * 2);
      c.fillStyle = i >= 3 && i < 6 ? rgba(acc) : rgba(INK, 0.9);
      c.fill();
    });
  };
  DRAW.systems.still = 0;

  /* 00 — the hero's background: a dot field that breathes and parts around the cursor */
  DRAW.field = (c, w, h, t, g, fz) => {
    const sp = w < 700 ? 26 : 34;
    const R = Math.min(220, w * 0.22);
    const mx = fz ? -9999 : pointer.sx, my = fz ? -9999 : pointer.sy;
    const cols = Math.ceil(w / sp) + 1, rows = Math.ceil(h / sp) + 1;
    const ox0 = (w - (cols - 1) * sp) / 2, oy0 = (h - (rows - 1) * sp) / 2;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = ox0 + i * sp, y = oy0 + j * sp;
        const wave = fz ? 0 : Math.sin(x * 0.006 + t * 0.7) * Math.cos(y * 0.008 - t * 0.5);
        const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy);
        let k = clamp(1 - d / R);
        k *= k;
        if (d > 0) { x += (dx / d) * k * 22; y += (dy / d) * k * 22; }
        y += wave * 3;
        const a = 0.05 + (wave + 1) * 0.025 + k * 0.55;
        const s = 1.1 + k * 1.8 + (wave + 1) * 0.25;
        c.fillStyle = k > 0.25 ? rgba(mix(INK, ACC, clamp((k - 0.25) * 2)), a) : rgba(INK, a);
        c.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
  };
  DRAW.field.still = 0;

  /* ==========================================================
     Scene runtime
     ========================================================== */
  const scenes = [];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const s = e.target._scene;
    s.visible = e.isIntersecting;
    s.dirty = true;
  }), { rootMargin: '80px' });
  const ro = new ResizeObserver((entries) => entries.forEach((e) => e.target._scene.resize()));

  class Scene {
    constructor(cv) {
      this.cv = cv;
      this.ctx = cv.getContext('2d');
      this.fn = DRAW[cv.dataset.scene];
      this.auto = cv.hasAttribute('data-auto');
      this.active = this.auto;
      this.visible = false;
      this.grade = 0;
      this.t0 = performance.now();
      this.w = 0; this.h = 0;
      this.dirty = true;
      cv._scene = this;
      io.observe(cv);
      ro.observe(cv);
    }
    resize() {
      const r = this.cv.getBoundingClientRect();
      const d = Math.min(2, window.devicePixelRatio || 1);
      this.w = r.width; this.h = r.height;
      if (!this.w || !this.h) return;
      this.cv.width = Math.round(this.w * d);
      this.cv.height = Math.round(this.h * d);
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
      this.dirty = true;
    }
    setActive(on) {
      if (on === this.active) return;
      this.active = on;
      if (on) this.t0 = performance.now();
      this.dirty = true;
    }
    tick(now, dt) {
      if (!this.visible || !this.w || !this.fn) return;
      const target = this.active && (still || now - this.t0 > 420) ? 1 : 0;
      const settling = Math.abs(target - this.grade) > 0.005;
      if (still) this.grade = target;
      else if (settling) this.grade += (target - this.grade) * Math.min(1, dt * 2.6);
      const running = this.active && !still;
      if (!running && !this.dirty && !settling) return;
      const t = running ? Math.max(0, (now - this.t0) / 1000) : this.fn.still || 0;
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.fn(this.ctx, this.w, this.h, t, this.grade, !running);
      this.dirty = false;
    }
  }

  $$('canvas[data-scene]').forEach((cv) => scenes.push(new Scene(cv)));

  let last = performance.now();
  let fxReady = false;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (lenis) lenis.raf(now);
    if (typeof fxTick === 'function' && fxReady) fxTick(dt);
    for (const s of scenes) s.tick(now, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => scenes.forEach((s) => (s.dirty = true)));

  /* ==========================================================
     Scroll progress for a tall section with a sticky child
     ========================================================== */
  function progress(el) {
    const r = el.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }
  function scrollToY(y, immediate = false) {
    if (lenis) lenis.scrollTo(y, { duration: 1.3, immediate });
    else window.scrollTo({ top: y, behavior: immediate || still ? 'auto' : 'smooth' });
  }
  function scrollToProgress(el, p) {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(top + span * p);
  }

  /* ---------- hero reel ---------- */
  const hero = $('.hero');
  const cards = $$('.card', hero);
  const dots = $$('.dots__b', hero);
  const what = $('.hero__what', hero);
  let heroI = -1;

  function heroSet(i) {
    if (i === heroI) return;
    heroI = i;
    hero.style.setProperty('--i', i);
    cards.forEach((card, k) => {
      const on = k === i;
      card.classList.toggle('is-on', on);
      card.inert = !on;
      $('canvas', card)._scene.setActive(on);
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    what.textContent = what.dataset['w' + i] || '';
    what.classList.remove('is-in');
    void what.offsetWidth;
    what.classList.add('is-in');
    if (fxReady) { Media.sync(); Sound.blip(i); }
  }
  dots.forEach((d, k) => d.addEventListener('click', () => scrollToProgress(hero, (k + 0.5) / cards.length)));

  /* ---------- what I build ---------- */
  const make = $('.make');
  const makeItems = $$('.make__item', make);
  const makeWins = $$('.make__win', make);
  let makeI = -1;

  function makeSet(i) {
    if (i === makeI) return;
    makeI = i;
    makeItems.forEach((it, k) => it.classList.toggle('is-on', k === i));
    makeWins.forEach((win, k) => {
      win.classList.toggle('is-on', k === i);
      $('canvas', win)._scene.setActive(k === i);
    });
    if (fxReady) { Media.sync(); Sound.blip(i + 3); }
  }
  makeItems.forEach((it, k) => $('.make__b', it).addEventListener('click', () => {
    if (mqFlat.matches) return;
    scrollToProgress(make, (k + 0.5) / makeItems.length);
  }));

  /* ---------- about story ---------- */
  const story = (() => {
    const el = $('.story');
    const stage = $('.story__stage', el);
    const world = $('.story__world', el);
    const svg = $('.story__svg', el);
    const ghost = $('.story__ghost', el);
    const line = $('.story__line', el);
    const clip = $('.story__clip', el);
    const nodesG = $('.story__nodes', el);
    const head = $('.story__head', el);
    const pulse = $('.story__pulse', el);
    const planes = $$('.plane', el);
    const year = $('.story__year', el);
    const chapN = $('.story__n', el);
    const chapT = $('.story__ct', el);
    const final = $('.story__final', el);
    const NS = 'http://www.w3.org/2000/svg';
    const A = 0.06, B = 0.84;
    let L = null;
    let flat = false;
    let lastIdx = -2;

    function layout() {
      flat = mqFlat.matches || still;
      el.classList.toggle('is-flat', flat);
      if (flat) {
        planes.forEach((p) => p.classList.add('is-on'));
        final.style.cssText = '';
        final.classList.add('is-in');
        L = null;
        return;
      }
      const vw = stage.clientWidth, vh = stage.clientHeight;
      const k = clamp(vh / 880, 0.82, 1.1);
      stage.style.setProperty('--k', k.toFixed(3));
      const W = Math.round(vw * 3.1);
      const x0 = vw * 0.5, x1 = W - vw * 0.5;
      const mid = vh * 0.55;
      const f = (x) => mid + Math.sin((x - x0) / (vw * 0.42)) * vh * 0.06 + Math.sin((x - x0) / (vw * 0.16)) * vh * 0.022;

      world.style.width = W + 'px';
      svg.setAttribute('width', W);
      svg.setAttribute('height', vh);
      svg.setAttribute('viewBox', `0 0 ${W} ${vh}`);
      let d = '';
      for (let x = x0 - 2; x <= x1 + vw * 0.5; x += 8) d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + f(x).toFixed(1);
      ghost.setAttribute('d', d);
      line.setAttribute('d', d);

      nodesG.textContent = '';
      const xs = planes.map((_, i) => x0 + (x1 - x0) * (0.07 + i * (0.86 / (planes.length - 1))));
      const conn = 34 * k;
      planes.forEach((p, i) => {
        const x = xs[i], y = f(x), up = i % 2 === 0;
        p.classList.toggle('is-up', up);
        p.classList.toggle('is-down', !up);
        p.style.setProperty('--conn', conn + 'px');
        p.style.setProperty('--from', (up ? 14 : -14) + 'px');
        p.style.left = (x - 22) + 'px';
        const ph = p.offsetHeight;
        p.style.top = (up ? y - conn - ph : y + conn) + 'px';
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', x);
        c.setAttribute('cy', y);
        c.setAttribute('r', 5);
        nodesG.appendChild(c);
      });
      L = { vw, vh, W, x0, x1, f, xs, nodes: [...nodesG.children] };
      lastIdx = -2;
      update();
    }

    function update() {
      if (flat || !L) return;
      const p = progress(el);
      const q = clamp((p - A) / (B - A));
      const hx = L.x0 + (L.x1 - L.x0) * q;
      const hy = L.f(hx);
      world.style.transform = `translate3d(${(L.x0 - hx).toFixed(1)}px,0,0)`;
      clip.setAttribute('width', Math.max(0, hx));
      const born = ease(p / (A * 0.8));
      head.setAttribute('cx', hx); head.setAttribute('cy', hy);
      head.setAttribute('r', (7 * born).toFixed(2));
      pulse.setAttribute('cx', hx); pulse.setAttribute('cy', hy);

      let idx = -1;
      L.xs.forEach((x, i) => { if (x <= hx + L.vw * 0.3) idx = i; });
      if (idx !== lastIdx) {
        lastIdx = idx;
        planes.forEach((pl, i) => pl.classList.toggle('is-on', i <= idx));
        if (idx >= 0) {
          year.textContent = planes[idx].dataset.year;
          chapN.textContent = String(idx + 1).padStart(2, '0');
          chapT.textContent = $('.plane__t', planes[idx]).textContent;
        } else {
          year.textContent = '';
          chapN.textContent = '00';
          chapT.textContent = q > 0 ? 'A path' : 'A problem';
        }
      }
      L.nodes.forEach((n, i) => n.classList.toggle('on', L.xs[i] <= hx + 1));

      const fin = clamp((p - B - 0.02) / 0.1);
      world.style.opacity = (1 - fin * 1.4).toFixed(3);
      year.style.opacity = chapN.parentNode.style.opacity = (1 - fin * 1.6).toFixed(3);
      final.style.opacity = fin.toFixed(3);
      final.style.visibility = fin > 0.02 ? 'visible' : 'hidden';
      final.classList.toggle('is-in', fin > 0.3);
      final.style.transform = `translate(-50%, calc(-50% + ${(24 * (1 - ease(fin))).toFixed(1)}px))`;
    }

    $('.story__again', el).addEventListener('click', () => {
      if (flat) { scrollToY(el.getBoundingClientRect().top + window.scrollY); return; }
      const top = el.getBoundingClientRect().top + window.scrollY;
      scrollToY(top + 2, true);
    });

    return { layout, update };
  })();

  /* ---------- bar: current section ---------- */
  const navLinks = $$('.bar__nav a[data-sec]');
  const sections = navLinks.map((a) => document.getElementById(a.dataset.sec));
  function navUpdate() {
    const y = window.innerHeight * 0.4;
    let cur = null;
    sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) cur = i; });
    navLinks.forEach((a, i) => a.setAttribute('aria-current', String(i === cur)));
  }

  /* ---------- scroll loop ---------- */
  let ticking = false;
  let lastY = window.scrollY;
  const bar = $('.bar');
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      heroSet(Math.min(cards.length - 1, Math.floor(progress(hero) * cards.length)));
      if (!mqFlat.matches) makeSet(Math.min(makeItems.length - 1, Math.floor(progress(make) * makeItems.length)));
      story.update();
      navUpdate();
      const y = window.scrollY, v = y - lastY;
      lastY = y;
      if (v > 4 && y > 240 && menu.hidden) bar.classList.add('is-hidden');
      else if (v < -4 || y < 240) bar.classList.remove('is-hidden');
      if (fxReady && Math.abs(v) > 1) { mTarget = 1 + Math.min(7, Math.abs(v) / 10); mDir = v >= 0 ? 1 : -1; }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  let rzT;
  window.addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => { story.layout(); onScroll(); }, 120);
  });

  /* phones: every item open, previews play while on screen */
  function applyFlat() {
    if (mqFlat.matches) {
      makeItems.forEach((it) => it.classList.add('is-on'));
      makeWins.forEach((w) => $('canvas', w)._scene.setActive(false));
      makeI = -1;
    } else {
      makeItems.forEach((it) => it.classList.remove('is-on'));
      makeI = -1;
    }
    story.layout();
    onScroll();
  }
  mqFlat.addEventListener('change', applyFlat);

  /* ---------- motion switch ---------- */
  const motionBtns = $$('.motion-sw');
  function applyMotion() {
    html.classList.toggle('still', still);
    motionBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(!still));
      b.classList.toggle('is-on', !still);
    });
    scenes.forEach((s) => { s.dirty = true; if (s.active) s.t0 = performance.now(); });
    if (still && lenis) { lenis.destroy(); lenis = null; }
    if (!still) makeLenis();
    if (fxReady) Media.sync();
    story.layout();
    onScroll();
  }
  motionBtns.forEach((b) => b.addEventListener('click', () => {
    still = !still;
    try { localStorage.setItem('uk-motion', still ? '0' : '1'); } catch (e) { /* storage blocked */ }
    applyMotion();
  }));
  mqReduce.addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('uk-motion'); } catch (err) { /* storage blocked */ }
    if (saved === null) { still = e.matches; applyMotion(); }
  });

  /* ---------- menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('.bar__menu');
  function openMenu() {
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { menu.classList.add('is-open'); menu.focus(); });
  }
  function closeMenu(focusBack = true) {
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => { menu.hidden = true; }, still ? 0 : 200);
    if (focusBack) menuBtn.focus();
  }
  menuBtn.addEventListener('click', openMenu);
  $('.menu__x', menu).addEventListener('click', () => closeMenu());
  $$('a', menu).forEach((a) => a.addEventListener('click', () => closeMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });

  /* ==========================================================
     Sound: your own track (media/music.mp3) if present,
     otherwise an ambient score generated live with Web Audio.
     ========================================================== */
  const Sound = (() => {
    const btns = $$('.sound-sw');
    btns.forEach((b) => {
      const eq = document.createElement('span');
      eq.className = 'eq';
      eq.setAttribute('aria-hidden', 'true');
      eq.innerHTML = '<i></i><i></i><i></i>';
      b.prepend(eq);
    });
    const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const CHORDS = [[45, 52, 59, 64, 71], [41, 48, 55, 64, 69], [48, 55, 62, 64, 67], [43, 50, 57, 62, 66]];
    const PENT = [69, 72, 74, 76, 79, 81, 84, 86, 88];
    let on = false, ducked = false, ctx = null, master = null, bus = null, blipOut = null, timer = null;
    let nextChord = 0, chordI = 0, nextPluck = 0;
    let track = null, trackOk = true, mode = null;

    function init() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
      bus = ctx.createGain();
      bus.connect(master);
      // echo
      const dly = ctx.createDelay(1.5), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
      dly.delayTime.value = 0.42; fb.gain.value = 0.36; lp.type = 'lowpass'; lp.frequency.value = 2200;
      dly.connect(lp).connect(fb).connect(dly);
      lp.connect(master);
      bus.connect(dly);
      // room
      const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      const conv = ctx.createConvolver(), wet = ctx.createGain();
      conv.buffer = ir; wet.gain.value = 0.55;
      bus.connect(conv).connect(wet).connect(master);
      blipOut = ctx.createGain();
      blipOut.gain.value = 0.5;
      blipOut.connect(comp);
      blipOut.connect(conv);
    }

    function pad(t0, notes) {
      notes.forEach((n, k) => {
        const g = ctx.createGain(), f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(700, t0);
        f.frequency.linearRampToValueAtTime(1500, t0 + 4);
        f.frequency.linearRampToValueAtTime(800, t0 + 9);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(k === 0 ? 0.06 : 0.035, t0 + 2.8);
        g.gain.setValueAtTime(k === 0 ? 0.06 : 0.035, t0 + 6.5);
        g.gain.linearRampToValueAtTime(0.0001, t0 + 10.5);
        f.connect(g).connect(bus);
        [['triangle', 0], ['sine', 7], ['sine', -6]].forEach(([type, det]) => {
          const o = ctx.createOscillator();
          o.type = type; o.frequency.value = midi(n); o.detune.value = det;
          o.connect(f); o.start(t0); o.stop(t0 + 11);
        });
      });
    }

    function pluck(t0, n, out = bus, vol = 0.06) {
      const g = ctx.createGain(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o.type = 'sine'; o.frequency.value = midi(n);
      o2.type = 'triangle'; o2.frequency.value = midi(n + 12); g2.gain.value = 0.25;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4);
      o.connect(g); o2.connect(g2).connect(g); g.connect(out);
      o.start(t0); o2.start(t0); o.stop(t0 + 2.5); o2.stop(t0 + 2.5);
    }

    function schedule() {
      const ahead = ctx.currentTime + 1.2;
      while (nextChord < ahead) { pad(nextChord, CHORDS[chordI++ % CHORDS.length]); nextChord += 8; }
      while (nextPluck < ahead) {
        if (Math.random() < 0.62) pluck(nextPluck, PENT[Math.floor(Math.random() * PENT.length)]);
        nextPluck += [0.6, 0.9, 1.2, 1.8][Math.floor(Math.random() * 4)];
      }
    }

    function level() { return ducked ? 0 : 0.9; }

    function startGen() {
      mode = 'gen';
      if (!ctx) init();
      ctx.resume();
      const now = ctx.currentTime;
      nextChord = nextPluck = now + 0.1;
      schedule();
      clearInterval(timer);
      timer = setInterval(schedule, 250);
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(level(), now, 0.8);
    }

    function fadeTrack(to, done) {
      const from = track.volume, t0 = performance.now();
      const step = (now) => {
        const k = clamp((now - t0) / 900);
        track.volume = clamp(lerp(from, to, k));
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      };
      requestAnimationFrame(step);
    }

    function ui() {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(on)));
    }

    function start() {
      if (on) return;
      on = true;
      ui();
      if (trackOk) {
        if (!track) { track = new Audio('media/music.mp3'); track.loop = true; track.volume = 0; }
        track.play().then(() => { mode = 'file'; fadeTrack(ducked ? 0 : 0.55); }).catch(() => {
          trackOk = false; track = null;
          if (on) startGen();
        });
      } else startGen();
    }

    function stop() {
      if (!on) return;
      on = false;
      ui();
      if (mode === 'file' && track) fadeTrack(0, () => { if (!on) track.pause(); });
      if (ctx && mode === 'gen') {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        setTimeout(() => { if (!on) { clearInterval(timer); timer = null; ctx.suspend(); } }, 1400);
      }
    }

    function duck(b) {
      ducked = b;
      if (!on) return;
      if (mode === 'file' && track) fadeTrack(b ? 0 : 0.55);
      if (mode === 'gen' && ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.25);
    }

    /* a soft note when the reel or the list changes */
    function blip(i) {
      if (!on || ducked) return;
      if (!ctx) init();
      if (ctx.state !== 'running') ctx.resume();
      pluck(ctx.currentTime + 0.01, PENT[i % PENT.length] + 12, blipOut, 0.05);
    }

    btns.forEach((b) => b.addEventListener('click', () => (on ? stop() : start())));
    document.addEventListener('visibilitychange', () => {
      if (!on) return;
      if (document.hidden) { if (ctx) ctx.suspend(); if (track && mode === 'file') track.pause(); }
      else { if (ctx && mode === 'gen') ctx.resume(); if (track && mode === 'file') track.play().catch(() => {}); }
    });

    return { start, stop, duck, blip, get on() { return on; } };
  })();

  /* ==========================================================
     Media: looping previews (data-loop), full films (data-film),
     photos. Anything missing simply stays on the canvas.
     ========================================================== */
  const film = $('.film');
  const filmV = $('.film__v');
  const filmT = $('.film__t');

  function openFilm(src, title) {
    filmT.textContent = title || '';
    filmV.src = src;
    film.showModal();
    if (lenis) lenis.stop();
    Sound.duck(true);
    filmV.play().catch(() => {});
  }
  $('.film__x').addEventListener('click', () => film.close());
  film.addEventListener('click', (e) => { if (e.target === film) film.close(); });
  film.addEventListener('close', () => {
    filmV.pause();
    filmV.removeAttribute('src');
    filmV.load();
    if (lenis) lenis.start();
    Sound.duck(false);
  });

  const Media = (() => {
    const hosts = $$('[data-loop]');
    hosts.forEach((h) => {
      const v = document.createElement('video');
      v.className = 'loop-v';
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');
      v.preload = 'metadata';
      v.addEventListener('loadeddata', () => { h.classList.add('has-video'); sync(); }, { once: true });
      v.addEventListener('error', () => v.remove(), { once: true });
      v.src = h.dataset.loop;
      const cv = $('canvas', h);
      if (cv) cv.after(v); else h.prepend(v);
      h._v = v;
    });

    // full films: only add the button once the file is known to exist
    $$('[data-film]').forEach((card) => {
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.muted = true;
      probe.addEventListener('loadedmetadata', () => {
        const go = $('.go', card);
        const acts = document.createElement('span');
        acts.className = 'acts';
        go.replaceWith(acts);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'go go--play magnet';
        b.innerHTML = '<span class="go__l">Watch</span><svg class="go__ic" viewBox="0 0 58 58" aria-hidden="true"><path d="M23 19.5v19L39 29Z"/></svg>';
        b.setAttribute('aria-label', 'Watch ' + (card.dataset.title || 'video'));
        b.addEventListener('click', (e) => { e.stopPropagation(); openFilm(card.dataset.film, card.dataset.title); });
        acts.append(b, go);
        card._film = true;
        probe.removeAttribute('src');
      }, { once: true });
      probe.src = card.dataset.film;
    });

    function sync() {
      hosts.forEach((h) => {
        const v = h._v;
        if (!v || !v.isConnected || !h.classList.contains('has-video')) return;
        if (h.classList.contains('is-on') && !still) v.play().catch(() => {});
        else v.pause();
      });
    }
    return { sync };
  })();

  $$('img.avatar, img.portrait').forEach((img) => {
    const show = () => { img.hidden = false; };
    if (img.complete && img.naturalWidth) show();
    else img.addEventListener('load', show, { once: true });
  });

  /* clicking the active card plays its film or follows its link */
  cards.forEach((card) => card.addEventListener('click', (e) => {
    if (!card.classList.contains('is-on') || e.target.closest('a, button')) return;
    if (card._film) openFilm(card.dataset.film, card.dataset.title);
    else $('.go', card).click();
  }));

  /* ==========================================================
     Pointer effects: cursor ring, reel tilt, glare, magnets
     ========================================================== */
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);
  let cx = -100, cy = -100;

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (!pointer.live) { pointer.live = true; pointer.sx = cx = e.clientX; pointer.sy = cy = e.clientY; }
    if (e.pointerType === 'mouse') cursor.classList.add('is-live');
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-live'));
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const link = e.target.closest('a, button, [role="button"]');
    const card = e.target.closest('.card.is-on');
    cursor.classList.toggle('is-link', !!link && !card);
    cursor.classList.toggle('is-view', !!card && !link);
    if (card) cursor.dataset.label = card._film ? 'Play' : 'Open';
  });

  cards.forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--gx', ((e.clientX - r.left) / r.width) * 100 + '%');
    card.style.setProperty('--gy', ((e.clientY - r.top) / r.height) * 100 + '%');
  }));

  $$('.btn, .go, .bar__sound').forEach((el) => {
    el.classList.add('magnet');
    el.addEventListener('pointermove', (e) => {
      if (still || !fine.matches) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.32).toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });

  const reel = $('.reel');
  const makeFrame = $('.make__frame');
  const tilt = { rx: 0, ry: 0, fx: 0, fy: 0 };

  /* ==========================================================
     Marquee: drifts on its own, races with your scroll
     ========================================================== */
  const mTrack = $('.marquee__track');
  const marquee = mTrack.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 36000, iterations: Infinity });
  let mRate = 1, mTarget = 1, mDir = 1;

  /* per-frame effects, called from the main frame loop */
  function fxTick(dt) {
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 7);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 7);
    cx += (pointer.x - cx) * Math.min(1, dt * 14);
    cy += (pointer.y - cy) * Math.min(1, dt * 14);
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;

    const vw = window.innerWidth, vh = window.innerHeight;
    const move = !still && fine.matches && pointer.live;
    const trx = move ? (pointer.y / vh - 0.5) * -7 : 0;
    const tryy = move ? (pointer.x / vw - 0.5) * 10 : 0;
    tilt.rx += (trx - tilt.rx) * Math.min(1, dt * 4);
    tilt.ry += (tryy - tilt.ry) * Math.min(1, dt * 4);
    reel.style.transform = `perspective(1600px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`;

    if (makeFrame) {
      const r = makeFrame.getBoundingClientRect();
      const inside = move && pointer.x > r.left && pointer.x < r.right && pointer.y > r.top && pointer.y < r.bottom;
      const fx = inside ? ((pointer.y - r.top) / r.height - 0.5) * -6 : 0;
      const fy = inside ? ((pointer.x - r.left) / r.width - 0.5) * 8 : 0;
      tilt.fx += (fx - tilt.fx) * Math.min(1, dt * 5);
      tilt.fy += (fy - tilt.fy) * Math.min(1, dt * 5);
      makeFrame.style.transform = `perspective(1400px) rotateX(${tilt.fx.toFixed(2)}deg) rotateY(${tilt.fy.toFixed(2)}deg)`;
    }

    mTarget += (1 - mTarget) * Math.min(1, dt * 1.5);
    mRate += (mTarget * mDir - mRate) * Math.min(1, dt * 6);
    marquee.playbackRate = still ? 0 : mRate;
  }

  /* ==========================================================
     Scroll reveals
     ========================================================== */
  const rvIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    rvIO.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function reveal(el, d = 0, type = '') {
    if (!el) return;
    el.setAttribute('data-rv', type);
    el.style.setProperty('--d', d + 's');
    rvIO.observe(el);
  }
  function maskWrap(el) {
    el.innerHTML = `<span class="mask"><span class="mask__i">${el.innerHTML}</span></span>`;
  }
  function splitLetters(span, offset = 0) {
    const text = span.textContent;
    span.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      s.style.setProperty('--i', i + offset);
      span.appendChild(s);
    });
    return text.length;
  }

  ['.make__h', '.index__h', '.story__h'].forEach((sel) => { const h = $(sel); maskWrap(h); reveal(h, 0.05, 'mask'); });
  makeItems.forEach((it, i) => reveal(it, 0.12 + i * 0.08));
  reveal($('.make__tools'), 0.5);
  reveal(makeFrame, 0.15, 'clip');
  reveal($('.index__sum'), 0.15);
  $$('.group').forEach((grp) => {
    reveal($('.group__g', grp), 0);
    $$('.rows li', grp).forEach((li, k) => reveal(li, 0.08 + k * 0.07));
  });
  reveal($('.marquee'), 0);
  reveal($('.foot'), 0.1);
  (() => {
    const word = $('.story__word');
    const n = splitLetters($('.name__a', word));
    splitLetters($('.name__b', word), n + 1);
  })();

  /* in-page links glide with Lenis */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    const id = a.getAttribute('href').slice(1);
    const target = id === 'top' ? 0 : document.getElementById(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.6 });
  });

  /* ==========================================================
     Loader
     ========================================================== */
  const Loader = (() => {
    const el = $('.loader');
    const count = $('.loader__count b', el);
    const bar = $('.loader__bar i', el);
    const words = $('.loader__words', el);
    const list = words.dataset.words.split('|');
    let seen = false;
    try { seen = sessionStorage.getItem('uk-entered') === '1'; } catch (e) { /* storage blocked */ }
    const nameN = splitLetters($('.loader__name .name__a', el));
    splitLetters($('.loader__name .name__b', el), nameN + 1);

    let loaded = false, shown = 0, done = false, wi = 0;
    const t0 = performance.now();
    const minT = still ? 500 : seen ? 900 : 2200;
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }))),
    ]).then(() => { loaded = true; });
    setTimeout(() => { loaded = true; }, 6000);

    const wordTimer = setInterval(() => { words.textContent = list[++wi % list.length]; }, 150);

    function lock(b) {
      html.classList.toggle('loading', b);
      if (lenis) (b ? lenis.stop() : lenis.start());
    }

    function step(now) {
      const k = clamp((now - t0) / minT);
      const target = loaded ? k : Math.min(k, 0.86);
      shown += (target - shown) * (still ? 1 : 0.09);
      count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      bar.style.transform = `scaleX(${shown.toFixed(4)})`;
      if (loaded && k >= 1 && shown > 0.995) return ready();
      requestAnimationFrame(step);
    }

    function ready() {
      count.textContent = '100';
      bar.style.transform = 'scaleX(1)';
      clearInterval(wordTimer);
      words.textContent = 'Ready';
      if (seen) { exit(); return; }
      el.classList.add('is-ready');
      $('.loader__go', el).focus({ preventScroll: true });
      // a scroll or swipe also counts as "enter without sound"
      ['wheel', 'touchmove'].forEach((ev) => window.addEventListener(ev, () => exit(), { once: true, passive: true }));
    }

    function exit() {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('uk-entered', '1'); } catch (e) { /* storage blocked */ }
      el.classList.add('is-out');
      lock(false);
      html.classList.add('entered');
      // restart the first card so its story plays from the beginning
      scenes.forEach((s) => { if (s.active) s.t0 = performance.now() + 500; });
      setTimeout(() => el.remove(), 1300);
    }

    $('.loader__go', el).addEventListener('click', () => { Sound.start(); exit(); });
    $('.loader__mute', el).addEventListener('click', () => exit());

    function begin() {
      lock(true);
      requestAnimationFrame(() => el.classList.add('is-name'));
      requestAnimationFrame(step);
    }
    return { begin };
  })();

  fxReady = true;

  /* ---------- go ---------- */
  applyMotion();
  applyFlat();
  Media.sync();
  Loader.begin();
})();
