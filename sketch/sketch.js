/* Uday Kant — sketchbook edition.
   Every drawing here is generated at load time with rough.js, then used as a
   flat 2D scene (outside) or as textures in a three.js corridor (inside). */
import * as THREE from 'three';
import rough from 'roughjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeIO = (t) => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const C = {
  paper: '#f1f0ec', paper2: '#e7e5df', white: '#fbfaf7', ink: '#2a2a2a', soft: '#6b6b6b',
  faint: '#a9a7a1', acc: '#f0632a', blue: '#2f6fd6', note: '#fbf1b8', cork: '#d8b98b', leaf: '#86a77c',
};
const F = {
  hand: '"Gochi Hand", "Kalam", cursive',
  body: '"Kalam", "Gochi Hand", cursive',
  logo: '"Rubik Doodle Shadow", "Gochi Hand", cursive',
};

let seedN = 11;
const seed = () => (seedN = (seedN * 9301 + 49297) % 233280) || 7;
function rand(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* ==========================================================
   Torn paper edges for UI pieces
   ========================================================== */
function tear(el) {
  const r = rand(Math.floor(Math.random() * 1e6) + 1);
  const pts = [];
  const n = 18;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${r() * 2.4}%`);
  for (let i = 0; i <= 8; i++) pts.push(`${100 - r() * 1.6}% ${(i / 8) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - r() * (el.classList.contains('tile') ? 9 : 4)}%`);
  for (let i = 8; i >= 0; i--) pts.push(`${r() * 1.6}% ${(i / 8) * 100}%`);
  el.style.clipPath = `polygon(${pts.join(',')})`;
}
$$('.torn').forEach(tear);

/* ==========================================================
   Canvas helpers
   ========================================================== */
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  return { c, ctx, r: rough.canvas(c) };
}
function paper(ctx, w, h, base = C.paper, specks = 0.5) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const n = Math.floor((w * h) / 110 * specks);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(0,0,0,${(Math.random() * 0.035).toFixed(3)})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.4, 1 + Math.random() * 1.4);
  }
}
function txt(ctx, s, x, y, { size = 40, font = F.hand, color = C.ink, align = 'center', base = 'alphabetic', weight = 400 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(s, x, y);
}
function wrap(ctx, s, x, y, maxW, lh, opts = {}) {
  const { size = 30, font = F.body, color = C.ink, align = 'left', weight = 400 } = opts;
  ctx.font = `${weight} ${size}px ${font}`;
  const words = s.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      txt(ctx, line, x, y, { size, font, color, align, weight });
      line = w; y += lh;
    } else line = test;
  }
  if (line) txt(ctx, line, x, y, { size, font, color, align, weight });
  return y + lh;
}
const S = (o = {}) => ({ roughness: 1.1, bowing: 1, stroke: C.ink, strokeWidth: 2.2, seed: seed(), ...o });

/* ==========================================================
   Drawings (each returns a canvas)
   ========================================================== */
function drawFloor() {
  const { c, ctx, r } = canvas(1024, 1024);
  paper(ctx, 1024, 1024, '#eeece6', 0.7);
  const cols = 5, pw = 1024 / cols, g = rand(4);
  for (let i = 0; i < cols; i++) {
    const x0 = i * pw;
    ctx.strokeStyle = 'rgba(40,40,40,0.28)';
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 8; k++) {
      const gx = x0 + 14 + g() * (pw - 28);
      ctx.beginPath();
      for (let y = 0; y <= 1024; y += 16) {
        const xx = gx + Math.sin(y / (60 + k * 9) + i * 3 + k) * (6 + g() * 3);
        y ? ctx.lineTo(xx, y) : ctx.moveTo(xx, y);
      }
      ctx.stroke();
    }
    if (g() > 0.4) r.ellipse(x0 + 30 + g() * (pw - 60), g() * 1024, 26, 44, S({ strokeWidth: 1.3, roughness: 1.4 }));
    r.line(x0 + 2, 0, x0 + 2, 1024, S({ strokeWidth: 3.2, roughness: 0.6 }));
    const joints = [g() * 512, 512 + g() * 512];
    joints.forEach((jy) => r.line(x0, jy, x0 + pw, jy, S({ strokeWidth: 2.6, roughness: 0.7 })));
  }
  return c;
}
function drawWall(base = '#f3f2ee') {
  const { c, ctx, r } = canvas(1024, 512);
  paper(ctx, 1024, 512, base, 0.6);
  r.line(0, 470, 1024, 470, S({ strokeWidth: 2.4, roughness: 0.6 }));
  r.line(0, 500, 1024, 500, S({ strokeWidth: 1.6, roughness: 0.6 }));
  r.rectangle(0, 471, 1024, 41, S({ stroke: 'transparent', fill: 'rgba(0,0,0,0.25)', fillStyle: 'hachure', hachureGap: 9, fillWeight: 0.8 }));
  r.line(0, 12, 1024, 12, S({ strokeWidth: 1.4, roughness: 0.5, stroke: C.soft }));
  const g = rand(9);
  for (let k = 0; k < 5; k++) {
    const x = g() * 980, y = 60 + g() * 340;
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.moveTo(x + j * 6, y); ctx.lineTo(x + j * 6 + 30, y + 46); ctx.stroke(); }
  }
  return c;
}
function drawCeiling() {
  const { c, ctx, r } = canvas(512, 512);
  paper(ctx, 512, 512, '#f5f4f0', 0.4);
  for (let i = 0; i <= 2; i++) {
    r.line(i * 256, 0, i * 256, 512, S({ stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1.2, roughness: 0.8 }));
    r.line(0, i * 256, 512, i * 256, S({ stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1.2, roughness: 0.8 }));
  }
  return c;
}
function drawLamp() {
  const { c, r } = canvas(512, 140);
  r.rectangle(10, 10, 492, 120, S({ fill: '#ffffff', fillStyle: 'solid', roughness: 0.7 }));
  for (let i = 1; i < 6; i++) r.line(10 + i * 82, 22, 10 + i * 82, 118, S({ strokeWidth: 1.2, stroke: C.faint }));
  return c;
}
function drawLogo() {
  const { c, ctx, r } = canvas(1700, 420);
  txt(ctx, 'UDAY KANT', 850, 300, { size: 230, font: F.logo });
  [[120, 120], [1590, 90], [1520, 330], [180, 340]].forEach(([x, y], i) => {
    const s = i % 2 ? 22 : 30;
    r.line(x - s, y, x + s, y, S({ strokeWidth: 3 }));
    r.line(x, y - s, x, y + s, S({ strokeWidth: 3 }));
    r.line(x - s * 0.7, y - s * 0.7, x + s * 0.7, y + s * 0.7, S({ strokeWidth: 2 }));
  });
  return c;
}
function drawSub() {
  const { c, ctx, r } = canvas(1500, 170);
  txt(ctx, '< software developer />', 750, 110, { size: 96, color: C.soft });
  r.line(140, 150, 600, 146, S({ stroke: C.faint, strokeWidth: 2 }));
  r.line(900, 146, 1360, 150, S({ stroke: C.faint, strokeWidth: 2 }));
  return c;
}
function drawSign(label) {
  const { c, ctx, r } = canvas(800, 290);
  [220, 580].forEach((x) => {
    r.line(x, 0, x, 78, S({ strokeWidth: 2 }));
    for (let y = 8; y < 74; y += 18) r.ellipse(x, y, 10, 16, S({ strokeWidth: 1.6, roughness: 0.6 }));
  });
  r.rectangle(40, 74, 720, 190, S({ fill: '#ece5d6', fillStyle: 'solid', strokeWidth: 3 }));
  r.rectangle(40, 74, 720, 190, S({ stroke: 'transparent', fill: 'rgba(90,70,40,0.35)', fillStyle: 'hachure', hachureGap: 11, hachureAngle: -8, fillWeight: 0.7 }));
  [215, 600].forEach((x) => r.circle(x, 98, 12, S({ fill: C.ink, fillStyle: 'solid' })));
  txt(ctx, label, 400, 215, { size: 112 });
  return c;
}
function drawFrame(kind, title) {
  const { c, ctx, r } = canvas(1000, 860);
  r.rectangle(40, 30, 920, 660, S({ fill: '#e1d9c6', fillStyle: 'solid', strokeWidth: 3.4 }));
  r.rectangle(40, 30, 920, 660, S({ stroke: 'transparent', fill: 'rgba(80,60,30,0.4)', fillStyle: 'hachure', hachureGap: 8, fillWeight: 0.8 }));
  r.rectangle(96, 86, 808, 548, S({ fill: '#fdfcf9', fillStyle: 'solid', strokeWidth: 2.4 }));
  [[40, 30, 96, 86], [960, 30, 904, 86], [40, 690, 96, 634], [960, 690, 904, 634]].forEach(([a, b, x, y]) => r.line(a, b, x, y, S({ strokeWidth: 1.8 })));
  ILLO[kind](ctx, r, 110, 100, 780, 520);
  r.rectangle(250, 724, 500, 116, S({ fill: C.note, fillStyle: 'solid', strokeWidth: 2 }));
  r.line(500, 690, 500, 724, S({ strokeWidth: 1.6 }));
  txt(ctx, title, 500, 778, { size: 46 });
  txt(ctx, 'click to inspect', 500, 820, { size: 26, font: F.body, color: C.soft });
  return c;
}
const ILLO = {
  rag(ctx, r, x, y, w, h) {
    const g = rand(21), nodes = [];
    for (let i = 0; i < 16; i++) nodes.push([x + 40 + g() * w * 0.52, y + 70 + g() * (h - 130)]);
    const q = [x + w * 0.3, y + h * 0.52];
    const near = nodes.map((n, i) => [Math.hypot(n[0] - q[0], n[1] - q[1]), i]).sort((a, b) => a[0] - b[0]).slice(0, 4).map((d) => d[1]);
    nodes.forEach((n, i) => {
      const hit = near.includes(i);
      if (hit) r.line(q[0], q[1], n[0], n[1], S({ stroke: C.acc, strokeWidth: 2 }));
      r.circle(n[0], n[1], hit ? 26 : 16, S({ strokeWidth: 1.8, fill: hit ? C.acc : 'transparent', fillStyle: 'hachure', hachureGap: 4 }));
    });
    r.circle(q[0], q[1], 70, S({ strokeWidth: 3 }));
    r.line(q[0] + 25, q[1] + 25, q[0] + 70, q[1] + 70, S({ strokeWidth: 6 }));
    const bx = x + w * 0.66, by = y + 110;
    r.rectangle(bx, by, w * 0.3, h * 0.48, S({ fill: '#fff', fillStyle: 'solid', strokeWidth: 2.4 }));
    r.polygon([[bx + 20, by + h * 0.48], [bx - 14, by + h * 0.48 + 40], [bx + 60, by + h * 0.48]], S({ fill: '#fff', fillStyle: 'solid', strokeWidth: 2.2 }));
    [0.8, 0.62, 0.74, 0.5].forEach((k, i) => r.line(bx + 20, by + 50 + i * 40, bx + 20 + (w * 0.3 - 40) * k, by + 50 + i * 40, S({ strokeWidth: 3, stroke: i ? C.soft : C.acc })));
    txt(ctx, 'retrieve → reason → respond', x + w / 2, y + 44, { size: 34, font: F.body, color: C.soft });
  },
  code(ctx, r, x, y, w, h) {
    r.rectangle(x + 30, y + 30, w - 60, h - 60, S({ fill: '#fff', fillStyle: 'solid' }));
    r.line(x + 30, y + 86, x + w - 30, y + 86, S({ strokeWidth: 1.8 }));
    [0, 1, 2].forEach((k) => r.circle(x + 62 + k * 34, y + 58, 18, S({ strokeWidth: 1.6 })));
    txt(ctx, 'interview.ts', x + w / 2, y + 68, { size: 26, font: F.body, color: C.soft });
    const lines = ['function twoSum(nums, t) {', '  const seen = new Map();', '  for (let i = 0; i < n; i++) {', '    // hint: try a hash map!', '  }', '}'];
    lines.forEach((l, i) => txt(ctx, l, x + 70, y + 140 + i * 50, { size: 32, font: F.body, align: 'left', color: i === 3 ? C.acc : C.ink }));
    const lx = x + w - 130, ly = y + 170;
    r.circle(lx, ly, 90, S({ strokeWidth: 2.6, fill: '#fff6c9', fillStyle: 'solid' }));
    r.line(lx - 18, ly + 46, lx + 18, ly + 46, S({ strokeWidth: 2.4 }));
    r.line(lx - 14, ly + 60, lx + 14, ly + 60, S({ strokeWidth: 2.4 }));
    [[-70, -40], [70, -40], [0, -80], [-80, 10], [80, 10]].forEach(([dx, dy]) => r.line(lx + dx * 0.78, ly + dy * 0.78, lx + dx, ly + dy, S({ stroke: C.acc, strokeWidth: 2.6 })));
  },
  grid(ctx, r, x, y, w, h) {
    const g = rand(5), cols = 16, rows = 6, s = 34, gap = 10;
    const gx = x + (w - cols * (s + gap)) / 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const v = g();
      r.rectangle(gx + i * (s + gap), y + 40 + j * (s + gap), s, s, S({
        strokeWidth: 1.4, roughness: 0.8,
        fill: v < 0.15 ? C.acc : v < 0.6 ? C.ink : 'transparent', fillStyle: 'hachure', hachureGap: v < 0.15 ? 3 : 5,
      }));
    }
    txt(ctx, '300+', x + w / 2 - 90, y + h - 40, { size: 130 });
    txt(ctx, 'problems solved', x + w / 2 + 170, y + h - 60, { size: 40, font: F.body, color: C.soft });
  },
};
function drawResume() {
  const { c, ctx, r } = canvas(600, 800);
  r.rectangle(30, 30, 540, 740, S({ fill: '#fff', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.polygon([[470, 30], [570, 30], [570, 130]], S({ fill: C.paper2, fillStyle: 'solid', strokeWidth: 2 }));
  txt(ctx, 'RESUME', 300, 140, { size: 84 });
  r.line(90, 170, 510, 166, S({ stroke: C.acc, strokeWidth: 3 }));
  for (let i = 0; i < 9; i++) r.line(90, 230 + i * 50, 90 + (i % 3 === 0 ? 260 : 400 - (i % 4) * 30), 230 + i * 50, S({ strokeWidth: 2, stroke: i % 3 === 0 ? C.ink : C.faint }));
  txt(ctx, 'open me ↗', 300, 730, { size: 40, color: C.acc });
  return c;
}
function drawNote(n, d) {
  const { c, ctx, r } = canvas(600, 640);
  r.rectangle(30, 50, 540, 560, S({ fill: C.note, fillStyle: 'solid', strokeWidth: 2, roughness: 1.3 }));
  r.rectangle(30, 50, 540, 560, S({ stroke: 'transparent', fill: 'rgba(200,170,40,0.22)', fillStyle: 'hachure', hachureGap: 14, fillWeight: 0.6 }));
  ctx.save();
  ctx.translate(300, 50);
  ctx.rotate(-0.05 + (n % 2) * 0.1);
  r.rectangle(-90, -26, 180, 52, S({ fill: 'rgba(255,255,255,0.65)', fillStyle: 'solid', stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1.2 }));
  ctx.restore();
  txt(ctx, d.year, 70, 160, { size: 88, align: 'left', color: C.acc });
  const ny = wrap(ctx, d.title, 70, 236, 460, 56, { size: 52, font: F.hand });
  wrap(ctx, d.body, 70, ny + 8, 460, 42, { size: 32, color: '#444' });
  DOODLE[n % DOODLE.length](r, 480, 540);
  return c;
}
const DOODLE = [
  (r, x, y) => { r.polygon([[x, y - 40], [x + 12, y - 12], [x + 42, y - 12], [x + 18, y + 6], [x + 28, y + 36], [x, y + 18], [x - 28, y + 36], [x - 18, y + 6], [x - 42, y - 12], [x - 12, y - 12]], S({ stroke: C.acc, strokeWidth: 2.4 })); },
  (r, x, y) => { r.rectangle(x - 40, y - 26, 80, 54, S({ strokeWidth: 2 })); r.line(x, y - 26, x, y + 28, S({ strokeWidth: 2 })); },
  (r, x, y) => { r.circle(x, y - 10, 50, S({ stroke: C.acc, strokeWidth: 2.4 })); r.line(x - 12, y + 12, x - 20, y + 42, S({ stroke: C.acc })); r.line(x + 12, y + 12, x + 20, y + 42, S({ stroke: C.acc })); },
  (r, x, y) => { r.circle(x - 30, y + 20, 18, S()); r.circle(x + 30, y - 20, 18, S()); r.circle(x - 30, y - 30, 18, S()); r.line(x - 30, y - 21, x - 30, y + 11, S()); r.curve([[x - 30, y + 4], [x, y - 2], [x + 30, y - 11]], S()); },
  (r, x, y) => { r.polygon([[x, y - 46], [x + 18, y], [x + 8, y + 30], [x - 8, y + 30], [x - 18, y]], S({ strokeWidth: 2.2 })); r.line(x - 6, y + 30, x - 10, y + 48, S({ stroke: C.acc, strokeWidth: 3 })); r.line(x + 6, y + 30, x + 10, y + 48, S({ stroke: C.acc, strokeWidth: 3 })); },
  (r, x, y) => { r.circle(x, y, 60, S({ fill: C.acc, fillStyle: 'hachure', hachureGap: 5, stroke: C.acc })); },
];
function drawDoor(label, stickers = []) {
  const { c, ctx, r } = canvas(620, 1140);
  r.rectangle(70, 14, 480, 130, S({ fill: '#ece5d6', fillStyle: 'solid', strokeWidth: 2.6 }));
  txt(ctx, label, 310, 106, { size: 76 });
  r.rectangle(40, 170, 540, 960, S({ strokeWidth: 3.4, fill: '#e9e4d8', fillStyle: 'solid' }));
  r.rectangle(78, 206, 464, 924, S({ strokeWidth: 2.6, fill: C.white, fillStyle: 'solid' }));
  r.rectangle(118, 250, 384, 360, S({ strokeWidth: 2 }));
  r.rectangle(118, 680, 384, 390, S({ strokeWidth: 2 }));
  r.circle(492, 650, 34, S({ strokeWidth: 2.4, fill: C.ink, fillStyle: 'hachure', hachureGap: 4 }));
  r.line(492, 650, 452, 650, S({ strokeWidth: 5 }));
  stickers.forEach((s, i) => sticker(ctx, r, s, 170 + (i % 2) * 190 + (i % 3) * 18, 320 + Math.floor(i / 2) * 120, (i % 3 - 1) * 0.12, 1));
  return c;
}
const STICKERS = {
  Python: ['#3d72b4', '#ffd43b'], React: ['#20232a', '#61dafb'], Kotlin: ['#7f52ff', '#ffffff'], TS: ['#3178c6', '#ffffff'],
  Java: ['#e76f00', '#ffffff'], 'C++': ['#00599c', '#ffffff'], Git: ['#f05033', '#ffffff'], Docker: ['#2496ed', '#ffffff'],
  'Next.js': ['#111111', '#ffffff'], AI: ['#f0632a', '#ffffff'], Firebase: ['#ffca28', '#5a3e00'], Redis: ['#d82c20', '#ffffff'],
};
function sticker(ctx, r, label, x, y, rot, k, mono = false) {
  const [bg, fg] = mono ? ['#f3f2ee', C.ink] : STICKERS[label] || ['#333', '#fff'];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `700 ${38 * k}px ${F.body}`;
  const w = ctx.measureText(label).width + 34 * k, h = 64 * k;
  if (label.length <= 2) r.circle(0, 0, 84 * k, S({ fill: bg, fillStyle: 'solid', strokeWidth: 2.4, roughness: 0.8 }));
  else r.rectangle(-w / 2, -h / 2, w, h, S({ fill: bg, fillStyle: 'solid', strokeWidth: 2.2, roughness: 0.8 }));
  txt(ctx, label, 0, 13 * k, { size: 38 * k, font: F.body, weight: 700, color: fg });
  ctx.restore();
}
function drawCork() {
  const { c, ctx, r } = canvas(1000, 720);
  r.rectangle(30, 30, 940, 660, S({ fill: '#b8956a', fillStyle: 'solid', strokeWidth: 3.4 }));
  r.rectangle(66, 66, 868, 588, S({ fill: C.cork, fillStyle: 'solid', strokeWidth: 2 }));
  const g = rand(31);
  for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(90,60,20,${(g() * 0.25).toFixed(2)})`; ctx.fillRect(70 + g() * 860, 70 + g() * 580, 3, 3); }
  const certs = [['Generative AI', 'LLM training, 30 hrs'], ['SAP S/4HANA', 'App development'], ['NPTEL Java', 'Elite · 87%']];
  certs.forEach(([a, b], i) => {
    const x = i < 2 ? 120 + i * 420 : 330, y = i < 2 ? 110 : 370;
    ctx.save();
    ctx.translate(x + 170, y + 100);
    ctx.rotate([-0.05, 0.04, 0.03, -0.04][i]);
    r.rectangle(-170, -100, 340, 210, S({ fill: '#fffdf6', fillStyle: 'solid', strokeWidth: 2 }));
    txt(ctx, a, 0, -14, { size: 44 });
    txt(ctx, b, 0, 34, { size: 30, font: F.body, color: C.soft });
    r.circle(110, 66, 40, S({ stroke: C.acc, strokeWidth: 2 }));
    r.circle(0, -92, 24, S({ fill: [C.acc, C.blue, '#3aa35b', '#d6402b'][i], fillStyle: 'solid', strokeWidth: 1.4 }));
    ctx.restore();
  });
  r.rectangle(330, 0, 340, 70, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 2 }));
  txt(ctx, 'CERTIFICATES', 500, 50, { size: 40 });
  return c;
}
function drawPlant() {
  const { c, ctx, r } = canvas(520, 900);
  r.polygon([[140, 640], [380, 640], [350, 880], [170, 880]], S({ fill: '#e6dccb', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.polygon([[140, 640], [380, 640], [350, 880], [170, 880]], S({ stroke: 'transparent', fill: 'rgba(80,60,40,0.4)', fillStyle: 'hachure', hachureGap: 10 }));
  r.curve([[260, 640], [250, 480], [270, 300]], S({ strokeWidth: 3.4 }));
  r.curve([[258, 520], [200, 420], [140, 360]], S({ strokeWidth: 2.4 }));
  r.curve([[262, 450], [330, 380], [380, 300]], S({ strokeWidth: 2.4 }));
  const leaves = [[270, 230, 0.1], [180, 300, -0.6], [350, 260, 0.6], [130, 380, -0.9], [400, 330, 0.9], [220, 400, -0.3], [320, 420, 0.4], [270, 330, 0], [150, 470, -1.1], [380, 470, 1.1]];
  leaves.forEach(([x, y, a]) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    r.ellipse(0, 0, 90, 130, S({ fill: C.leaf, fillStyle: 'hachure', hachureGap: 7, strokeWidth: 2, fillWeight: 1.2 }));
    r.line(0, -55, 0, 55, S({ strokeWidth: 1.3 }));
    ctx.restore();
  });
  return c;
}
function drawBall() {
  const { c, r } = canvas(220, 200);
  r.circle(110, 110, 160, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 2, roughness: 2.2 }));
  for (let i = 0; i < 6; i++) r.line(60 + i * 18, 70 + (i % 3) * 30, 90 + i * 12, 120 + (i % 2) * 30, S({ strokeWidth: 1.2, stroke: C.soft, roughness: 2 }));
  return c;
}
function drawBooks() {
  const { c, ctx, r } = canvas(560, 420);
  const books = [[60, 330, 440, 70, '#7aa0d4', 'ALGORITHMS'], [90, 260, 380, 70, '#e8a46b', 'OPERATING SYS'], [50, 190, 420, 70, '#9ac28f', 'MACHINE LEARNING'], [110, 120, 340, 70, '#d98a8a', 'DBMS']];
  books.forEach(([x, y, w, h, col, t]) => {
    r.rectangle(x, y, w, h, S({ fill: col, fillStyle: 'hachure', hachureGap: 6, strokeWidth: 2.4 }));
    txt(ctx, t, x + w / 2, y + 47, { size: 32, font: F.hand });
  });
  r.ellipse(270, 70, 120, 40, S({ strokeWidth: 2 }));
  r.line(212, 70, 220, 112, S({ strokeWidth: 2 }));
  r.line(328, 70, 320, 112, S({ strokeWidth: 2 }));
  r.ellipse(270, 112, 100, 24, S({ strokeWidth: 1.6 }));
  r.curve([[330, 80], [370, 88], [326, 104]], S({ strokeWidth: 2 }));
  return c;
}
function drawEndDoodle() {
  const { c, ctx, r } = canvas(800, 520);
  txt(ctx, "let's build", 360, 150, { size: 96 });
  txt(ctx, 'something!', 380, 260, { size: 96, color: C.acc });
  r.curve([[180, 330], [300, 420], [520, 380], [640, 300]], S({ strokeWidth: 3 }));
  r.line(640, 300, 600, 300, S({ strokeWidth: 3 }));
  r.line(640, 300, 626, 338, S({ strokeWidth: 3 }));
  r.polygon([[690, 120], [740, 60], [760, 140]], S({ strokeWidth: 2.4, fill: C.acc, fillStyle: 'hachure', hachureGap: 5 }));
  r.line(700, 140, 670, 190, S({ stroke: C.acc }));
  r.line(724, 150, 712, 200, S({ stroke: C.acc }));
  return c;
}
function drawBot() {
  const { c, ctx, r } = canvas(640, 1000);
  r.line(320, 40, 320, 110, S({ strokeWidth: 3 }));
  r.circle(320, 36, 40, S({ fill: C.acc, fillStyle: 'solid', strokeWidth: 2 }));
  r.rectangle(150, 110, 340, 270, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 3.4 }));
  r.rectangle(190, 150, 260, 150, S({ fill: '#e9eef6', fillStyle: 'solid', strokeWidth: 2 }));
  r.circle(260, 220, 44, S({ fill: C.ink, fillStyle: 'solid' }));
  r.circle(380, 220, 44, S({ fill: C.ink, fillStyle: 'solid' }));
  r.circle(270, 210, 12, S({ fill: '#fff', fillStyle: 'solid', stroke: 'transparent' }));
  r.circle(390, 210, 12, S({ fill: '#fff', fillStyle: 'solid', stroke: 'transparent' }));
  r.arc(320, 260, 90, 56, 0.2, Math.PI - 0.2, false, S({ strokeWidth: 3 }));
  r.circle(215, 280, 30, S({ stroke: 'transparent', fill: 'rgba(240,99,42,0.45)', fillStyle: 'solid' }));
  r.circle(425, 280, 30, S({ stroke: 'transparent', fill: 'rgba(240,99,42,0.45)', fillStyle: 'solid' }));
  r.rectangle(290, 380, 60, 40, S({ strokeWidth: 2.4 }));
  r.rectangle(170, 420, 300, 300, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 3.4 }));
  r.rectangle(240, 470, 160, 110, S({ fill: C.note, fillStyle: 'solid', strokeWidth: 2 }));
  txt(ctx, 'UK', 320, 552, { size: 76 });
  [[230, 640], [280, 640], [330, 640]].forEach(([x, y], i) => r.circle(x + 40, y, 22, S({ fill: [C.acc, C.blue, '#3aa35b'][i], fillStyle: 'solid', strokeWidth: 1.6 })));
  r.curve([[172, 450], [120, 560], [140, 680]], S({ strokeWidth: 3.2 }));
  r.circle(140, 690, 44, S({ strokeWidth: 2.6, fill: C.white, fillStyle: 'solid' }));
  r.rectangle(210, 720, 70, 200, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 3 }));
  r.rectangle(360, 720, 70, 200, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 3 }));
  r.rectangle(180, 920, 120, 56, S({ fill: C.ink, fillStyle: 'hachure', hachureGap: 5, strokeWidth: 2.6 }));
  r.rectangle(340, 920, 120, 56, S({ fill: C.ink, fillStyle: 'hachure', hachureGap: 5, strokeWidth: 2.6 }));
  return c;
}
function drawArm() {
  const { c, r } = canvas(180, 460);
  r.curve([[90, 440], [80, 300], [96, 110]], S({ strokeWidth: 4 }));
  r.circle(96, 74, 80, S({ strokeWidth: 2.8, fill: C.white, fillStyle: 'solid' }));
  [[-26, -40], [-6, -50], [14, -48], [32, -34]].forEach(([dx, dy]) => r.line(96 + dx * 0.5, 74 + dy * 0.5, 96 + dx, 74 + dy - 14, S({ strokeWidth: 2.4 })));
  return c;
}
function drawBubble(s) {
  const { c, ctx, r } = canvas(700, 260);
  r.rectangle(20, 20, 660, 170, S({ fill: '#fff', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.polygon([[110, 190], [80, 250], [170, 190]], S({ fill: '#fff', fillStyle: 'solid', strokeWidth: 2.6 }));
  ctx.fillStyle = '#fff'; ctx.fillRect(112, 184, 54, 10);
  let size = 58;
  ctx.font = `400 ${size}px ${F.hand}`;
  while (ctx.measureText(s).width > 620 && size > 26) { size -= 2; ctx.font = `400 ${size}px ${F.hand}`; }
  txt(ctx, s, 350, 105 + size * 0.35, { size });
  return c;
}

/* ---------- doors: a fixed frame on the wall plus a hinged leaf ---------- */
function drawDoorFrame(label, tint) {
  const { c, ctx, r } = canvas(700, 1240);
  const g = ctx.createLinearGradient(0, 200, 0, 1240);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, tint);
  ctx.fillStyle = g;
  ctx.fillRect(90, 200, 520, 1040);
  r.line(90, 1010, 610, 1010, S({ stroke: C.faint, strokeWidth: 1.6 }));
  r.line(90, 1010, 250, 860, S({ stroke: C.faint, strokeWidth: 1.4 }));
  r.line(610, 1010, 450, 860, S({ stroke: C.faint, strokeWidth: 1.4 }));
  r.line(250, 860, 450, 860, S({ stroke: C.faint, strokeWidth: 1.4 }));
  [[40, 170, 50, 1070], [610, 170, 50, 1070], [40, 170, 620, 30]].forEach(([x, y, w, h]) => r.rectangle(x, y, w, h, S({ fill: '#e9e4d8', fillStyle: 'solid', strokeWidth: 2.6 })));
  r.rectangle(110, 12, 480, 134, S({ fill: '#ece5d6', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.rectangle(110, 12, 480, 134, S({ stroke: 'transparent', fill: 'rgba(90,70,40,0.3)', fillStyle: 'hachure', hachureGap: 10, fillWeight: 0.7 }));
  [170, 530].forEach((x) => r.circle(x, 34, 12, S({ fill: C.ink, fillStyle: 'solid' })));
  txt(ctx, label, 350, 108, { size: 70 });
  return c;
}
function drawLeaf(stickers, painted, tint) {
  const { c, ctx, r } = canvas(520, 1040);
  seedN = 77;
  r.rectangle(5, 5, 510, 1030, S({ fill: painted ? tint : C.white, fillStyle: 'solid', strokeWidth: 3 }));
  r.rectangle(60, 60, 400, 400, S({ strokeWidth: 2 }));
  r.rectangle(60, 520, 400, 460, S({ strokeWidth: 2 }));
  r.circle(452, 505, 40, S({ strokeWidth: 2.4, fill: painted ? '#c9a24a' : C.ink, fillStyle: painted ? 'solid' : 'hachure', hachureGap: 4 }));
  r.line(452, 505, 404, 505, S({ strokeWidth: 6 }));
  stickers.forEach((s, i) => sticker(ctx, r, s, 165 + (i % 2) * 190, 170 + Math.floor(i / 2) * 175, (((i * 37) % 7) - 3) * 0.05, 0.95, !painted));
  if (painted) r.rectangle(5, 5, 510, 1030, { stroke: 'transparent', fill: 'rgba(0,0,0,0.1)', fillStyle: 'hachure', hachureGap: 13, fillWeight: 0.8, seed: 5 });
  return c;
}

/* ---------- corridor decorations ---------- */
function drawDeco(kind) {
  const { c, ctx, r } = canvas(700, 560);
  r.rectangle(20, 20, 660, 520, S({ fill: '#e1d9c6', fillStyle: 'solid', strokeWidth: 3 }));
  r.rectangle(54, 54, 592, 452, S({ fill: '#fdfcf9', fillStyle: 'solid', strokeWidth: 2 }));
  if (kind === 'loop') {
    ['while (awake) {', '  learn();', '  build();', '  ship();', '}'].forEach((l, i) => txt(ctx, l, 110, 150 + i * 72, { size: 50, font: F.body, align: 'left', color: i === 2 ? C.acc : C.ink }));
  } else if (kind === 'coffee') {
    r.rectangle(190, 230, 200, 210, S({ fill: '#efe3cf', fillStyle: 'hachure', hachureGap: 7, strokeWidth: 2.6 }));
    r.arc(390, 320, 110, 110, -Math.PI / 2, Math.PI / 2, false, S({ strokeWidth: 2.6 }));
    [230, 290, 350].forEach((x, i) => r.curve([[x, 210], [x - 18, 170], [x + 12, 130], [x - 6, 96 - i * 6]], S({ strokeWidth: 2, stroke: C.soft })));
    txt(ctx, 'coffee', 520, 260, { size: 50 });
    txt(ctx, '→ code', 520, 330, { size: 50, color: C.acc });
  } else {
    r.circle(160, 230, 120, S({ strokeWidth: 2.6, fill: '#fff6c9', fillStyle: 'solid' }));
    r.rectangle(135, 290, 50, 40, S({ strokeWidth: 2 }));
    r.line(230, 240, 290, 240, S({ strokeWidth: 2.4 })); r.line(290, 240, 274, 228, S({ strokeWidth: 2.4 })); r.line(290, 240, 274, 252, S({ strokeWidth: 2.4 }));
    r.circle(360, 240, 90, S({ strokeWidth: 2.4 }));
    for (let a = 0; a < 8; a++) r.line(360 + Math.cos(a * 0.785) * 45, 240 + Math.sin(a * 0.785) * 45, 360 + Math.cos(a * 0.785) * 62, 240 + Math.sin(a * 0.785) * 62, S({ strokeWidth: 3 }));
    r.line(430, 240, 490, 240, S({ strokeWidth: 2.4 })); r.line(490, 240, 474, 228, S({ strokeWidth: 2.4 })); r.line(490, 240, 474, 252, S({ strokeWidth: 2.4 }));
    r.polygon([[560, 160], [590, 230], [580, 300], [540, 300], [530, 230]], S({ strokeWidth: 2.4, fill: C.white, fillStyle: 'solid' }));
    r.line(545, 300, 535, 340, S({ stroke: C.acc, strokeWidth: 3 })); r.line(575, 300, 585, 340, S({ stroke: C.acc, strokeWidth: 3 }));
    txt(ctx, 'idea → build → ship', 350, 440, { size: 46, font: F.body, color: C.soft });
  }
  return c;
}

/* ---------- room pieces ---------- */
function drawAboutCard() {
  const { c, ctx, r } = canvas(900, 1100);
  r.rectangle(30, 40, 840, 1030, S({ fill: '#fffdf6', fillStyle: 'solid', strokeWidth: 2.6 }));
  ctx.save(); ctx.translate(450, 42); ctx.rotate(-0.04);
  r.rectangle(-110, -28, 220, 56, S({ fill: 'rgba(255,255,255,0.7)', fillStyle: 'solid', stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1.2 }));
  ctx.restore();
  const px = 220, py = 300;
  r.curve([[px - 170, py + 300], [px - 130, py + 170], [px, py + 150], [px + 130, py + 170], [px + 170, py + 300]], S({ strokeWidth: 2.6 }));
  r.circle(px, py, 250, S({ fill: '#fdf6e3', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.arc(px, py - 22, 262, 232, Math.PI, Math.PI * 2, true, S({ fill: C.ink, fillStyle: 'hachure', hachureGap: 6, strokeWidth: 2.4 }));
  r.circle(px - 46, py + 14, 62, S({ strokeWidth: 2.6 }));
  r.circle(px + 46, py + 14, 62, S({ strokeWidth: 2.6 }));
  r.line(px - 15, py + 12, px + 15, py + 12, S({ strokeWidth: 2.2 }));
  r.circle(px - 46, py + 16, 12, S({ fill: C.ink, fillStyle: 'solid' }));
  r.circle(px + 46, py + 16, 12, S({ fill: C.ink, fillStyle: 'solid' }));
  r.arc(px, py + 58, 84, 44, 0.25, Math.PI - 0.25, false, S({ strokeWidth: 2.6 }));
  txt(ctx, "Hi, I'm Uday!", 620, 240, { size: 70 });
  txt(ctx, 'software developer', 620, 312, { size: 44, color: C.acc });
  r.line(450, 340, 790, 336, S({ stroke: C.acc, strokeWidth: 2 }));
  const facts = ['B.Tech CSE, Narula Institute of Technology', 'Full stack intern at GoDatabase LLP', 'CGPA 9.05, top 5% of my batch', '300+ DSA problems solved', 'GSSoC 2025 contributor'];
  let y = 680;
  facts.forEach((f) => {
    r.circle(100, y - 12, 16, S({ fill: C.acc, fillStyle: 'solid', strokeWidth: 1.4 }));
    y = wrap(ctx, f, 130, y, 690, 48, { size: 38 }) + 26;
  });
  return c;
}
function drawString(xs) {
  const { c, r } = canvas(2400, 180);
  const yAt = (x) => 30 + Math.sin((Math.PI * x) / 2400) * 50;
  const pts = [];
  for (let x = 0; x <= 2400; x += 150) pts.push([x, yAt(x)]);
  r.curve(pts, S({ strokeWidth: 2.4, roughness: 0.6 }));
  [12, 2388].forEach((x) => r.circle(x, 30, 18, S({ fill: C.ink, fillStyle: 'solid' })));
  xs.forEach((x) => { const y = yAt(x); r.rectangle(x - 13, y - 14, 26, 192 - y, S({ fill: '#d9c3a0', fillStyle: 'solid', strokeWidth: 1.8 })); });
  return c;
}
function drawSpot() {
  const { c, ctx, r } = canvas(600, 520);
  ctx.fillStyle = 'rgba(255,236,170,0.32)';
  ctx.beginPath(); ctx.moveTo(262, 40); ctx.lineTo(338, 40); ctx.lineTo(580, 520); ctx.lineTo(20, 520); ctx.closePath(); ctx.fill();
  r.polygon([[262, 40], [338, 40], [580, 520], [20, 520]], S({ stroke: 'transparent', fill: 'rgba(200,160,60,0.25)', fillStyle: 'hachure', hachureGap: 16, fillWeight: 0.7 }));
  r.rectangle(236, 4, 128, 40, S({ fill: C.ink, fillStyle: 'hachure', hachureGap: 4, strokeWidth: 2.2 }));
  return c;
}
function drawBench() {
  const { c, r } = canvas(900, 330);
  r.rectangle(20, 90, 860, 60, S({ fill: '#e3d8c3', fillStyle: 'hachure', hachureGap: 8, strokeWidth: 2.6 }));
  r.rectangle(40, 20, 820, 40, S({ fill: '#e3d8c3', fillStyle: 'hachure', hachureGap: 8, strokeWidth: 2.2 }));
  [[90, 150], [780, 150]].forEach(([x, y]) => r.rectangle(x, y, 34, 170, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 2.4 })));
  [[110, 60], [790, 60]].forEach(([x, y]) => r.line(x, y, x, y + 30, S({ strokeWidth: 2.4 })));
  return c;
}
function drawGitNote() {
  const { c, ctx, r } = canvas(500, 520);
  r.rectangle(25, 40, 450, 460, S({ fill: C.note, fillStyle: 'solid', strokeWidth: 2 }));
  r.circle(250, 44, 26, S({ fill: '#d6402b', fillStyle: 'solid', strokeWidth: 1.4 }));
  txt(ctx, '</>', 250, 200, { size: 110, color: C.acc });
  txt(ctx, 'more on', 250, 310, { size: 60 });
  txt(ctx, 'GitHub ↗', 250, 390, { size: 64 });
  return c;
}
function drawBalloon(label, col) {
  const { c, ctx, r } = canvas(300, 470);
  r.curve([[150, 300], [132, 350], [166, 410], [148, 466]], S({ strokeWidth: 1.8 }));
  r.ellipse(150, 152, 250, 285, S({ fill: col, fillStyle: 'solid', strokeWidth: 2.6 }));
  r.ellipse(150, 152, 250, 285, S({ stroke: 'transparent', fill: 'rgba(0,0,0,0.12)', fillStyle: 'hachure', hachureGap: 10, fillWeight: 0.8 }));
  r.ellipse(96, 86, 38, 70, S({ stroke: 'transparent', fill: 'rgba(255,255,255,0.75)', fillStyle: 'solid' }));
  r.polygon([[138, 296], [162, 296], [150, 312]], S({ fill: col, fillStyle: 'solid', strokeWidth: 2 }));
  let size = 64;
  ctx.font = `400 ${size}px ${F.hand}`;
  while (ctx.measureText(label).width > 205 && size > 30) { size -= 3; ctx.font = `400 ${size}px ${F.hand}`; }
  txt(ctx, label, 150, 172, { size });
  return c;
}
// one chalkboard per skill category (from the resume)
const SKILLS = [
  ['Languages', ['Python', 'Java', 'Kotlin', 'JavaScript', 'TypeScript', 'C++', 'SQL', 'HTML', 'CSS']],
  ['Frameworks', ['React.js', 'Next.js', 'Node.js', 'Express.js', 'Tailwind CSS', 'Jetpack Compose', 'LangChain', 'LangGraph', 'Gradio']],
  ['AI', ['LLMs', 'RAG', 'Generative AI', 'AI Agents', 'Vector Embeddings', 'Semantic Search', 'Prompt Engineering', 'NLP', 'FAISS', 'Sentence Transformers', 'Gemini API']],
  ['Backend & APIs', ['REST APIs', 'WebSockets', 'JWT', 'OAuth', 'Passport.js', 'Sequelize ORM']],
  ['Cloud & DevOps', ['Docker', 'Kubernetes', 'Apache Kafka', 'CI/CD', 'Git', 'GitHub', 'Vercel', 'Netlify']],
  ['Databases', ['PostgreSQL', 'MongoDB', 'MySQL', 'Firebase', 'Redis']],
  ['CS Fundamentals', ['Data Structures & Algorithms', 'OOP', 'DBMS']],
];
function drawBoard(title, items, hue) {
  const { c, ctx, r } = canvas(1000, 760);
  r.rectangle(20, 20, 960, 720, S({ fill: '#b8956a', fillStyle: 'solid', strokeWidth: 3.2 }));
  r.rectangle(54, 54, 892, 652, S({ fill: '#33493c', fillStyle: 'solid', strokeWidth: 2 }));
  const chalk = '#f1efe6';
  txt(ctx, title, 500, 140, { size: 74, color: hue });
  r.line(260, 166, 740, 160, S({ stroke: chalk, strokeWidth: 2 }));
  const cols = items.length > 5 ? 2 : 1, rows = Math.ceil(items.length / cols);
  const gap = Math.min(80, 420 / rows);
  items.forEach((s, i) => {
    const col = cols === 2 ? Math.floor(i / rows) : 0, row = cols === 2 ? i % rows : i;
    const x = cols === 2 ? 110 + col * 430 : 180, y = 240 + row * gap + (cols === 1 ? 30 : 0);
    r.circle(x - 26, y - 12, 12, S({ stroke: hue, strokeWidth: 2 }));
    txt(ctx, s, x, y, { size: cols === 2 ? 38 : 46, color: chalk, align: 'left', font: F.body });
  });
  txt(ctx, 'click to read', 500, 690, { size: 30, color: 'rgba(241,239,230,0.6)', font: F.body });
  return c;
}
function drawLetter() {
  const { c, ctx, r } = canvas(900, 1000);
  r.rectangle(30, 30, 840, 940, S({ fill: '#fffdf6', fillStyle: 'solid', strokeWidth: 2.6 }));
  for (let y = 210; y < 800; y += 64) r.line(70, y, 830, y, S({ stroke: 'rgba(47,111,214,0.3)', strokeWidth: 1.4, roughness: 0.5 }));
  r.line(120, 40, 120, 960, S({ stroke: 'rgba(240,99,42,0.4)', strokeWidth: 1.4 }));
  r.rectangle(700, 60, 130, 150, S({ fill: '#f7d9a8', fillStyle: 'solid', strokeWidth: 2 }));
  r.circle(765, 135, 70, S({ stroke: C.acc, strokeWidth: 2 }));
  txt(ctx, 'UK', 765, 152, { size: 44 });
  txt(ctx, 'Dear Uday,', 150, 190, { size: 64, align: 'left' });
  [[150, 330, 560], [150, 394, 620], [150, 458, 470], [150, 522, 600], [150, 586, 380]].forEach(([x, y, w]) => r.curve([[x, y], [x + w * 0.3, y - 10], [x + w * 0.6, y + 6], [x + w, y - 4]], S({ stroke: C.faint, strokeWidth: 2 })));
  txt(ctx, "let's build something together!", 150, 268, { size: 44, align: 'left', color: C.soft });
  txt(ctx, '— you', 640, 690, { size: 52 });
  r.rectangle(300, 790, 300, 110, S({ fill: C.acc, fillStyle: 'solid', strokeWidth: 2.6 }));
  txt(ctx, 'write me ✉', 450, 864, { size: 54, color: '#fff' });
  return c;
}
function drawLinkCard(name, col, icon, sub) {
  const { c, ctx, r } = canvas(600, 480);
  r.rectangle(30, 50, 540, 400, S({ fill: '#fffdf6', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.circle(300, 54, 26, S({ fill: col, fillStyle: 'solid', strokeWidth: 1.4 }));
  r.rectangle(220, 110, 160, 140, S({ fill: col, fillStyle: 'solid', strokeWidth: 2.4 }));
  txt(ctx, icon, 300, 210, { size: icon.length > 2 ? 64 : 92, color: '#fff', font: F.body, weight: 700 });
  txt(ctx, name, 300, 340, { size: 70 });
  txt(ctx, sub, 300, 400, { size: 34, font: F.body, color: C.soft });
  return c;
}

/* ---------- the pistol for the shooting range, barrel pointing left ---------- */
function drawGun() {
  // first-person view: a pistol seen from behind and a little above, held in a right hand
  const { c, ctx, r } = canvas(560, 620);
  const P = (o = {}) => S({ roughness: 0.5, bowing: 0.3, strokeWidth: 2.4, ...o });
  const skin = '#ecc9a6', skinD = '#d9ab83';
  // forearm and wrist coming up from the bottom edge
  r.polygon([[170, 620], [196, 470], [356, 470], [402, 620]], P({ fill: skin, fillStyle: 'solid' }));
  r.polygon([[170, 620], [196, 470], [356, 470], [402, 620]], P({ stroke: 'transparent', fill: 'rgba(150,100,60,0.25)', fillStyle: 'hachure', hachureGap: 10, fillWeight: 0.7 }));
  // grip (back strap) going down into the hand
  r.polygon([[226, 300], [334, 300], [344, 470], [216, 470]], P({ fill: '#232427', fillStyle: 'solid' }));
  r.polygon([[236, 316], [324, 316], [330, 452], [230, 452]], P({ stroke: 'transparent', fill: 'rgba(255,255,255,0.13)', fillStyle: 'cross-hatch', hachureGap: 6, fillWeight: 0.6 }));
  // beaver tail and frame
  r.polygon([[206, 284], [354, 284], [340, 306], [220, 306]], P({ fill: '#2d2f33', fillStyle: 'solid' }));
  // slide top, receding toward the front sight
  r.polygon([[200, 196], [360, 196], [300, 70], [260, 70]], P({ fill: '#50555c', fillStyle: 'solid', strokeWidth: 2.6 }));
  r.line(280, 196, 280, 72, P({ stroke: 'rgba(255,255,255,0.28)', strokeWidth: 1.4 }));
  r.polygon([[322, 150], [346, 168], [338, 192], [314, 172]], P({ fill: '#1b1c1e', fillStyle: 'solid', strokeWidth: 1.4 }));
  // front sight post
  r.rectangle(274, 52, 12, 22, P({ fill: '#1b1c1e', fillStyle: 'solid', strokeWidth: 1.6 }));
  r.circle(280, 56, 5, P({ fill: '#f2f2ef', fillStyle: 'solid', strokeWidth: 0.8 }));
  // slide rear face with serrations
  r.rectangle(200, 196, 160, 90, P({ fill: '#3d4147', fillStyle: 'solid', strokeWidth: 2.6 }));
  for (let x = 210; x < 352; x += 10) { if (x > 236 && x < 324) continue; r.line(x, 202, x, 280, P({ strokeWidth: 1.5, stroke: '#1d1f22' })); }
  // rear sight with notch
  r.polygon([[236, 182], [324, 182], [324, 204], [292, 204], [292, 192], [268, 192], [268, 204], [236, 204]], P({ fill: '#1b1c1e', fillStyle: 'solid', strokeWidth: 1.6 }));
  [[250, 196], [310, 196]].forEach(([x, y]) => r.circle(x, y, 5, P({ fill: '#f2f2ef', fillStyle: 'solid', strokeWidth: 0.8 })));
  // firing pin plate and hammer
  r.rectangle(262, 222, 36, 46, P({ fill: '#2a2c30', fillStyle: 'solid', strokeWidth: 1.6 }));
  r.circle(280, 244, 10, P({ fill: '#8a8f96', fillStyle: 'solid', strokeWidth: 1 }));
  // hand: thumb along the left of the frame, knuckles wrapping the front of the grip
  r.curve([[200, 470], [170, 400], [178, 330], [214, 290], [236, 276]], P({ strokeWidth: 3 }));
  r.polygon([[200, 470], [176, 402], [182, 334], [214, 296], [236, 280], [228, 330], [222, 410], [226, 470]], P({ fill: skin, fillStyle: 'solid', strokeWidth: 2.4 }));
  r.ellipse(232, 284, 26, 18, P({ fill: skinD, fillStyle: 'solid', strokeWidth: 1.6 }));
  r.polygon([[334, 330], [372, 336], [388, 380], [380, 470], [334, 470]], P({ fill: skin, fillStyle: 'solid', strokeWidth: 2.4 }));
  [[346, 352, 380, 360], [344, 392, 384, 398], [344, 430, 382, 436]].forEach(([x1, y1, x2, y2]) => r.line(x1, y1, x2, y2, P({ strokeWidth: 1.6, stroke: '#9a6c48' })));
  r.curve([[226, 470], [280, 486], [334, 470]], P({ strokeWidth: 2.2, stroke: '#9a6c48' }));
  return c;
}

/* ---------- experience room ---------- */
function drawJobCard() {
  const { c, ctx, r } = canvas(1400, 1000);
  r.rectangle(30, 40, 1340, 930, S({ fill: '#fffdf6', fillStyle: 'solid', strokeWidth: 2.8 }));
  ctx.save(); ctx.translate(700, 42); ctx.rotate(0.02);
  r.rectangle(-120, -28, 240, 56, S({ fill: 'rgba(255,255,255,0.7)', fillStyle: 'solid', stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1.2 }));
  ctx.restore();
  txt(ctx, 'EXPERIENCE', 110, 150, { size: 40, align: 'left', color: C.acc });
  txt(ctx, 'Full Stack Developer Intern', 110, 230, { size: 74, align: 'left' });
  txt(ctx, 'GoDatabase LLP · Pune, Maharashtra (remote)', 110, 292, { size: 40, align: 'left', font: F.body, color: C.soft });
  ctx.save(); ctx.translate(1150, 170); ctx.rotate(-0.08);
  r.rectangle(-150, -50, 300, 100, S({ stroke: '#3aa35b', strokeWidth: 3 }));
  txt(ctx, 'June 2026 – now', 0, 14, { size: 40, color: '#3aa35b' });
  ctx.restore();
  r.line(110, 330, 1290, 324, S({ stroke: C.faint }));
  const pts = ['Hiring platform: 161 API routes, 33 models, 61 pages', 'Auth flows: signup, login, email + OTP, reset', 'REST APIs in Node/Express, MongoDB → PostgreSQL', 'JWT + OAuth (Google, GitHub, LinkedIn) via Passport', '14-table schemas: RBAC, profiles, sessions, audit', 'Fixed stored XSS + signup token bypass'];
  pts.forEach((t, i) => {
    const y = 410 + i * 82;
    r.circle(130, y - 14, 18, S({ fill: C.acc, fillStyle: 'solid', strokeWidth: 1.2 }));
    txt(ctx, t, 168, y, { size: 42, align: 'left', font: F.body });
  });
  txt(ctx, 'click to read more', 700, 935, { size: 30, font: F.body, color: C.soft });
  return c;
}
function drawStat(num, label, col) {
  const { c, ctx, r } = canvas(500, 460);
  r.rectangle(25, 40, 450, 400, S({ fill: col, fillStyle: 'solid', strokeWidth: 2 }));
  r.rectangle(25, 40, 450, 400, S({ stroke: 'transparent', fill: 'rgba(0,0,0,0.06)', fillStyle: 'hachure', hachureGap: 14 }));
  r.circle(250, 44, 26, S({ fill: '#d6402b', fillStyle: 'solid', strokeWidth: 1.2 }));
  txt(ctx, num, 250, 250, { size: 150, color: C.ink });
  wrap(ctx, label, 250, 340, 400, 46, { size: 42, align: 'center', font: F.hand, color: '#444' });
  return c;
}
function drawBadge() {
  const { c, ctx, r } = canvas(520, 900);
  r.line(180, 0, 250, 330, S({ stroke: C.blue, strokeWidth: 10 }));
  r.line(340, 0, 270, 330, S({ stroke: C.blue, strokeWidth: 10 }));
  r.rectangle(220, 310, 80, 60, S({ fill: '#c9ccd1', fillStyle: 'solid', strokeWidth: 2 }));
  r.rectangle(60, 360, 400, 520, S({ fill: '#fbfaf7', fillStyle: 'solid', strokeWidth: 2.8 }));
  r.rectangle(60, 360, 400, 110, S({ fill: C.acc, fillStyle: 'solid', strokeWidth: 2.4 }));
  txt(ctx, 'GoDatabase', 260, 432, { size: 52, color: '#fff' });
  r.circle(260, 580, 150, S({ fill: '#fdf6e3', fillStyle: 'solid', strokeWidth: 2.4 }));
  r.arc(260, 566, 156, 140, Math.PI, Math.PI * 2, true, S({ fill: C.ink, fillStyle: 'hachure', hachureGap: 5, strokeWidth: 2 }));
  r.arc(260, 610, 50, 26, 0.3, Math.PI - 0.3, false, S({ strokeWidth: 2.2 }));
  txt(ctx, 'Uday Kant', 260, 740, { size: 50 });
  txt(ctx, 'INTERN · FULL STACK', 260, 800, { size: 30, font: F.body, color: C.soft });
  return c;
}
/* ---------- achievements room: plaques ---------- */
function drawPlaque(title, sub, icon) {
  const { c, ctx, r } = canvas(600, 820);
  r.rectangle(30, 30, 540, 760, S({ fill: '#b8895a', fillStyle: 'solid', strokeWidth: 3 }));
  r.rectangle(30, 30, 540, 760, S({ stroke: 'transparent', fill: 'rgba(60,30,10,0.25)', fillStyle: 'hachure', hachureGap: 12, hachureAngle: 80 }));
  r.rectangle(70, 70, 460, 680, S({ fill: '#f7f1e3', fillStyle: 'solid', strokeWidth: 2 }));
  [[90, 90], [510, 90], [90, 730], [510, 730]].forEach(([x, y]) => r.circle(x, y, 12, S({ fill: '#c9a24a', fillStyle: 'solid', strokeWidth: 1 })));
  r.line(250, 70, 230, 190, S({ stroke: '#d6402b', strokeWidth: 8 }));
  r.line(350, 70, 370, 190, S({ stroke: C.blue, strokeWidth: 8 }));
  r.circle(300, 260, 170, S({ fill: '#f2c94c', fillStyle: 'solid', strokeWidth: 3 }));
  r.circle(300, 260, 130, S({ stroke: '#b8901f', strokeWidth: 2 }));
  const cx = 300, cy = 260;
  if (icon === 'top') txt(ctx, '5%', cx, cy + 22, { size: 70, color: '#7a5a14' });
  else if (icon === 'dsa') txt(ctx, '300+', cx, cy + 20, { size: 56, color: '#7a5a14' });
  else if (icon === 'oss') { r.circle(cx - 30, cy - 34, 22, S({ stroke: '#7a5a14', strokeWidth: 3 })); r.circle(cx - 30, cy + 40, 22, S({ stroke: '#7a5a14', strokeWidth: 3 })); r.circle(cx + 34, cy - 10, 22, S({ stroke: '#7a5a14', strokeWidth: 3 })); r.line(cx - 30, cy - 22, cx - 30, cy + 28, S({ stroke: '#7a5a14', strokeWidth: 3 })); r.curve([[cx - 30, cy + 20], [cx + 30, cy + 14], [cx + 34, cy + 2]], S({ stroke: '#7a5a14', strokeWidth: 3 })); }
  else if (icon === 'sih') { r.rectangle(cx - 50, cy - 40, 100, 66, S({ stroke: '#7a5a14', strokeWidth: 3 })); r.line(cx - 70, cy + 40, cx + 70, cy + 40, S({ stroke: '#7a5a14', strokeWidth: 4 })); txt(ctx, 'ERP', cx, cy + 6, { size: 30, color: '#7a5a14' }); }
  else txt(ctx, '?', cx, cy + 30, { size: 90, color: '#7a5a14' });
  let y = 520;
  y = wrap(ctx, title, 300, y, 420, 58, { size: 52, align: 'center', font: F.hand });
  wrap(ctx, sub, 300, y + 4, 420, 40, { size: 32, align: 'center', color: C.soft });
  return c;
}

/* ---------- easter-egg drawings ---------- */
function drawSwitch(on) {
  const { c, ctx, r } = canvas(200, 300);
  seedN = 33;
  r.rectangle(20, 20, 160, 260, S({ fill: '#fbfaf7', fillStyle: 'solid', strokeWidth: 2.6 }));
  [[100, 46], [100, 254]].forEach(([x, y]) => r.circle(x, y, 12, S({ strokeWidth: 1.4 })));
  r.rectangle(70, 84, 60, 128, S({ fill: '#e7e5df', fillStyle: 'solid', strokeWidth: 2 }));
  r.rectangle(78, on ? 92 : 150, 44, 54, S({ fill: on ? C.acc : C.ink, fillStyle: 'solid', strokeWidth: 2 }));
  txt(ctx, on ? 'ON' : 'OFF', 100, 240, { size: 30, color: C.soft });
  return c;
}
const EGGS = [
  ['Squash the bug', 'outside, on the bricks'], ['Knock knock', 'the door has a knocker'], ['Push the swing', 'push it in rhythm'],
  ['Debugging tips', 'click the window'], ['Lights out', 'a switch near the start'], ['Triple coffee', 'three sips, double speed'],
  ['Chat with the bot', 'just start typing'], ['Paper plane', 'throw it'], ['Konami code', '↑↑↓↓←→←→ B A'],
  ['Golden balloon', 'during a shooting round'], ['Typing test', 'press T in Skills'], ['Pluck the string', 'in About me'],
  ['Console note', 'open the dev tools'], ['Take a nap', 'sit still for a minute'], ['Certificate', 'find every achievement'],
];
function drawEggBoard() {
  const { c, ctx, r } = canvas(1600, 1000);
  r.rectangle(20, 40, 1560, 940, S({ fill: '#b8956a', fillStyle: 'solid', strokeWidth: 3.4 }));
  r.rectangle(56, 76, 1488, 868, S({ fill: C.cork, fillStyle: 'solid', strokeWidth: 2 }));
  const g = rand(51);
  for (let i = 0; i < 1500; i++) { ctx.fillStyle = `rgba(90,60,20,${(g() * 0.25).toFixed(2)})`; ctx.fillRect(60 + g() * 1480, 80 + g() * 860, 3, 3); }
  const cols = ['#f6b8a8', '#a9cdf2', '#bfe3b4', '#f7e19a', '#d6c1f0', '#f5c6dd'];
  EGGS.forEach(([t, h], i) => {
    const col = i % 5, row = Math.floor(i / 5), x = 110 + col * 284, y = 150 + row * 262;
    ctx.save();
    ctx.translate(x + 125, y + 105);
    ctx.rotate((((i * 7) % 5) - 2) * 0.025);
    r.rectangle(-125, -100, 250, 210, S({ fill: '#fffdf6', fillStyle: 'solid', strokeWidth: 2 }));
    r.circle(0, -98, 20, S({ fill: ['#d6402b', C.blue, '#3aa35b'][i % 3], fillStyle: 'solid', strokeWidth: 1.2 }));
    r.ellipse(-78, -38, 46, 60, S({ fill: cols[i % cols.length], fillStyle: 'solid', strokeWidth: 1.8 }));
    r.line(-98, -42, -58, -48, S({ strokeWidth: 1.4, stroke: 'rgba(0,0,0,0.4)' }));
    txt(ctx, String(i + 1).padStart(2, '0'), 60, -30, { size: 34, color: C.faint });
    const ny = wrap(ctx, t, 0, 22, 236, 32, { size: 32, align: 'center', font: F.hand });
    wrap(ctx, h, 0, ny + 2, 236, 25, { size: 22, align: 'center', color: C.soft });
    ctx.restore();
  });
  r.rectangle(600, 6, 400, 78, S({ fill: C.white, fillStyle: 'solid', strokeWidth: 2.2 }));
  txt(ctx, 'EASTER EGGS', 800, 62, { size: 48 });
  return c;
}
function drawBox() {
  const { c, ctx, r } = canvas(600, 480);
  r.polygon([[60, 150], [540, 150], [520, 460], [80, 460]], S({ fill: '#d6b27a', fillStyle: 'solid', strokeWidth: 3 }));
  r.polygon([[60, 150], [120, 80], [480, 80], [540, 150]], S({ fill: '#e5c58f', fillStyle: 'solid', strokeWidth: 2.4 }));
  r.line(300, 80, 300, 150, S({ strokeWidth: 2 }));
  ctx.save(); ctx.translate(300, 310); ctx.rotate(-0.12);
  r.rectangle(-190, -52, 380, 104, S({ stroke: '#c0392b', strokeWidth: 4 }));
  txt(ctx, 'TOP SECRET', 0, 24, { size: 66, color: '#c0392b' });
  ctx.restore();
  return c;
}
// the loader's signature, reused on the certificate
const SIG = ['M40 40 C38 80 34 120 48 140 C62 162 98 160 108 132 C116 110 112 72 110 40', 'M160 36 C162 80 160 130 158 176', 'M232 40 C210 70 186 96 162 116 C190 130 214 156 240 184', 'M28 198 C90 186 170 190 270 178'];
function drawCertificate() {
  const { c, ctx, r } = canvas(1400, 990);
  paper(ctx, 1400, 990, '#fbfaf5', 0.4);
  r.rectangle(40, 40, 1320, 910, S({ strokeWidth: 4 }));
  r.rectangle(66, 66, 1268, 858, S({ strokeWidth: 1.6, stroke: C.acc }));
  txt(ctx, 'Certificate of Exploration', 700, 210, { size: 88, font: F.logo });
  txt(ctx, 'this certifies that', 700, 300, { size: 40, font: F.body, color: C.soft });
  txt(ctx, 'a very curious visitor', 700, 400, { size: 84 });
  r.line(380, 428, 1020, 422, S({ stroke: C.faint }));
  txt(ctx, `found all ${ACH.length} achievements in Uday Kant's sketchbook`, 700, 500, { size: 40, font: F.body });
  const names = ACH.map((a) => a[1]), half = Math.ceil(names.length / 2);
  txt(ctx, names.slice(0, half).join(' · '), 700, 565, { size: 28, font: F.body, color: C.soft });
  txt(ctx, names.slice(half).join(' · '), 700, 605, { size: 28, font: F.body, color: C.soft });
  txt(ctx, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 330, 800, { size: 40 });
  r.line(180, 822, 480, 818, S({ strokeWidth: 1.6 }));
  txt(ctx, 'date', 330, 862, { size: 28, font: F.body, color: C.soft });
  r.circle(700, 790, 170, S({ stroke: C.acc, strokeWidth: 3 }));
  r.circle(700, 790, 136, S({ stroke: C.acc, strokeWidth: 1.6 }));
  txt(ctx, '100%', 700, 808, { size: 56, color: C.acc });
  ctx.save();
  ctx.translate(905, 650);
  ctx.scale(0.75, 0.75);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6;
  SIG.forEach((d, i) => { ctx.strokeStyle = i === 3 ? C.acc : C.ink; ctx.stroke(new Path2D(d)); });
  ctx.restore();
  r.line(880, 822, 1200, 818, S({ strokeWidth: 1.6 }));
  txt(ctx, 'Uday Kant', 1040, 862, { size: 28, font: F.body, color: C.soft });
  return c;
}

/* ---------- the bug on the front wall ---------- */
function drawBug(px, ph) {
  const n = Math.max(32, Math.round(px * 2)), { c, r } = canvas(n, n), u = n / 100;
  const st = (o = {}) => ({ roughness: 0.9, stroke: C.ink, strokeWidth: 1.9 * u, seed: 900 + ph * 10 + (o.k || 0), ...o });
  [-1, 1].forEach((sd) => [-16, 0, 16].forEach((dy, i) => {
    const sw = (i + (sd > 0 ? 1 : 0) + ph) % 2 ? 6 : -6;
    const kx = 50 + sd * 30, ky = 56 + dy + sw - 6;
    r.line((50 + sd * 14) * u, (58 + dy) * u, kx * u, ky * u, st({ k: i }));
    r.line(kx * u, ky * u, (50 + sd * 42) * u, (ky + 12 + (i - 1) * 4) * u, st({ k: i + 3 }));
  }));
  r.curve([[46 * u, 22 * u], [40 * u, 12 * u], [30 * u, 6 * u]], st({ k: 7 }));
  r.curve([[54 * u, 22 * u], [60 * u, 12 * u], [70 * u, 6 * u]], st({ k: 8 }));
  r.ellipse(50 * u, 60 * u, 40 * u, 52 * u, st({ fill: '#3b3b3b', fillStyle: 'hachure', hachureGap: 3 * u, fillWeight: 1.1 * u, k: 9 }));
  r.line(50 * u, 38 * u, 50 * u, 84 * u, st({ k: 10 }));
  r.circle(50 * u, 32 * u, 20 * u, st({ fill: C.ink, fillStyle: 'solid', k: 11 }));
  [[41, 54], [59, 64], [42, 74]].forEach(([x, y], i) => r.circle(x * u, y * u, 8 * u, st({ fill: C.acc, fillStyle: 'solid', strokeWidth: 1 * u, k: 12 + i })));
  return c;
}
function drawSplash(px) {
  const n = Math.round(px * 2), { c, ctx } = canvas(n, n), R = n * 0.3, cx = n / 2, g = rand(Math.floor(Math.random() * 1e5) + 1);
  ctx.fillStyle = '#1d1d1d';
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, rr = R * (0.6 + g() * 0.4) * (i % 4 === 0 ? 1.18 : 1);
    pts.push([cx + Math.cos(a) * rr, cx + Math.sin(a) * rr]);
  }
  ctx.beginPath();
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? ctx.quadraticCurveTo(p[0], p[1], mx, my) : ctx.moveTo(mx, my); });
  ctx.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  ctx.fill();
  for (let i = 0; i < 14; i++) {
    const a = g() * Math.PI * 2, d = R * (1.05 + g() * 0.5), s = R * (0.03 + g() * 0.08);
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, s, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    const a = g() * Math.PI * 2, d = R * 0.95;
    ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cx + Math.sin(a) * d, R * 0.28, R * 0.07, a, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}
function drawTip(s, w) {
  const k = 2, fs = Math.max(16, Math.min(24, w * 0.08));
  const m = document.createElement('canvas').getContext('2d');
  m.font = `400 ${fs}px ${F.hand}`;
  const lines = [];
  let line = '';
  s.split(' ').forEach((wd) => { const tt = line ? line + ' ' + wd : wd; if (m.measureText(tt).width > w - 40 && line) { lines.push(line); line = wd; } else line = tt; });
  lines.push(line);
  const h = lines.length * fs * 1.3 + 30, H2 = h + 24;
  const { c, ctx, r } = canvas(Math.round(w * k), Math.round(H2 * k));
  ctx.scale(k, k);
  r.rectangle(3, 3, w - 6, h, { roughness: 1, stroke: C.ink, strokeWidth: 2, fill: '#fff', fillStyle: 'solid', seed: 3 });
  r.polygon([[w * 0.5 - 14, h + 1], [w * 0.5 + 2, h + 22], [w * 0.5 + 10, h + 1]], { roughness: 0.8, stroke: C.ink, strokeWidth: 2, fill: '#fff', fillStyle: 'solid', seed: 4 });
  ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.5 - 12, h - 3, 20, 7);
  lines.forEach((ln, i) => txt(ctx, ln, w / 2, 15 + fs + i * fs * 1.3, { size: fs }));
  return { c, w, h: H2 };
}

/* ==========================================================
   Sound: pencil-and-paper effects plus a quiet pad
   ========================================================== */
const Sound = (() => {
  let ctx = null, out = null, on = true, padT = null, noise = null;
  try { const v = localStorage.getItem('uk-sketch-sound'); if (v) on = v === '1'; } catch (e) { /* storage blocked */ }
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain();
    out.gain.value = on ? 1 : 0;
    out.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function burst(freq, q, dur, vol, type = 'bandpass') {
    if (!ctx || !on) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function tone(f0, dur, vol, type = 'sine', at = 0) {
    if (!ctx || !on) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function pad() {
    if (!ctx) return;
    const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 196, 246.9]];
    let i = 0;
    const play = () => {
      if (on) {
        const t = ctx.currentTime;
        chords[i++ % chords.length].forEach((f) => {
          const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
          o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 900;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.018, t + 2.5);
          g.gain.linearRampToValueAtTime(0.0001, t + 7.8);
          o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + 8);
        });
        if (Math.random() < 0.7) tone([523, 587, 659, 784, 880][Math.floor(Math.random() * 5)], 1.6, 0.025, 'sine', 1 + Math.random() * 3);
      }
      padT = setTimeout(play, 7000);
    };
    play();
  }
  return {
    wake() { init(); if (ctx.state !== 'running') ctx.resume(); if (!padT) pad(); },
    get on() { return on; },
    toggle() {
      on = !on;
      try { localStorage.setItem('uk-sketch-sound', on ? '1' : '0'); } catch (e) { /* storage blocked */ }
      if (ctx) out.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1);
      return on;
    },
    rustle() { burst(3200, 0.8, 0.14, 0.18); },
    step() { burst(180, 0.9, 0.09, 0.22, 'lowpass'); },
    scribble() { for (let i = 0; i < 4; i++) setTimeout(() => burst(4200 + Math.random() * 1500, 2, 0.05, 0.06), i * 55); },
    creak() {
      if (!ctx || !on) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.9);
      f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 6;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + 1.05);
    },
    chime() { tone(1318.5, 0.9, 0.06); tone(1975.5, 1.2, 0.05, 'sine', 0.12); },
    knock() { burst(150, 0.8, 0.14, 0.8, 'lowpass'); tone(92, 0.12, 0.14, 'sine'); },
    whoosh() { burst(650, 0.5, 0.4, 0.2); },
    click() { tone(1900, 0.03, 0.05, 'square'); burst(2600, 2, 0.03, 0.12); },
    tick() { burst(4800, 3, 0.02, 0.06); },
    ding() { tone(1046.5, 0.3, 0.05); tone(1568, 0.35, 0.035, 'sine', 0.06); },
    twang() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      [[196, 0.09], [392, 0.04], [588, 0.02]].forEach(([f, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.15);
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        o.connect(g).connect(out); o.start(t); o.stop(t + 1.35);
      });
    },
    tink() { tone(3600 + Math.random() * 1400, 0.06, 0.025, 'sine'); tone(6100 + Math.random() * 900, 0.04, 0.012, 'sine', 0.01); },
    pop() { burst(1500, 0.7, 0.09, 0.4); tone(640, 0.12, 0.05, 'triangle'); },
    shot() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      const layer = (type, freq, q, vol, dur, at = 0) => {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
        g.gain.setValueAtTime(0.0001, t + at);
        g.gain.exponentialRampToValueAtTime(vol, t + at + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
        s.connect(f).connect(g).connect(out);
        s.start(t + at, Math.random() * 0.5); s.stop(t + at + dur + 0.05);
      };
      layer('highpass', 1800, 0.7, 0.9, 0.09);
      layer('lowpass', 900, 0.8, 1.0, 0.22);
      layer('bandpass', 260, 0.6, 0.35, 0.75, 0.02);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.2);
      layer('bandpass', 3200, 4, 0.18, 0.025, 0.07);
      layer('bandpass', 2400, 5, 0.12, 0.03, 0.1);
    },
    splat() { burst(240, 0.7, 0.3, 0.6, 'lowpass'); burst(1100, 1, 0.12, 0.2); },
  };
})();

/* ==========================================================
   UI: toast, tooltip, panels, modal, achievements
   ========================================================== */
const toastEl = $('.toast');
let toastTimer = null;
function toast(title, desc, { done = false, stay = false } = {}) {
  $('.toast__t').textContent = title;
  $('.toast__d').innerHTML = desc;
  toastEl.classList.toggle('is-done', done);
  toastEl.classList.remove('is-hidden');
  tear(toastEl);
  clearTimeout(toastTimer);
  if (!stay) toastTimer = setTimeout(() => toastEl.classList.add('is-hidden'), 4200);
  const snd = $('.snd', toastEl);
  if (snd) snd.addEventListener('click', toggleSound);
}
const soundLabel = () => `[🔊 ${Sound.on ? 'ON' : 'OFF'}]`;
function toggleSound() {
  Sound.wake();
  const on = Sound.toggle();
  $('.sound-btn').setAttribute('aria-pressed', String(on));
  const snd = $('.snd');
  if (snd) snd.textContent = soundLabel();
}
$('.sound-btn').setAttribute('aria-pressed', String(Sound.on));
$('.sound-btn').addEventListener('click', toggleSound);

const tip = $('.tip');
function showTip(label, x, y) {
  if (!label) { tip.classList.remove('is-on'); return; }
  tip.textContent = label;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
  tip.classList.add('is-on');
}

const ACH = [
  ['explorer', 'Explorer', 'Open the front door'],
  ['debugger', 'Bug hunter', 'Squash the bug outside'],
  ['wanderer', 'Wanderer', 'Scroll into the corridor'],
  ['historian', 'Historian', 'Read my whole story'],
  ['critic', 'Art critic', 'Inspect a project'],
  ['polyglot', 'Polyglot', 'Pop a skill balloon'],
  ['sharp', 'Sharpshooter', 'Pop 10 balloons in one pop-gun round'],
  ['social', 'Sociable', 'Find a way to say hi'],
  ['hacker', 'Hacker', 'Enter the Konami code'],
  ['exterminator', 'Exterminator', 'Squash 5 bugs'],
  ['labrat', 'Egg hunter', 'Find the easter-egg room'],
  ['golden', 'Golden ticket', 'Hit the golden balloon'],
];
const STORY = [
  { year: '2022', title: 'School, with a head for maths', body: 'CBSE at BNS DAV Public School, Jharkhand. Scored 86.8%.' },
  { year: '2023', title: 'Computer science', body: 'Started B.Tech CSE at Narula Institute of Technology. Class of 2027.' },
  { year: 'Training', title: 'Three certificates', body: 'Generative AI & LLMs, SAP S/4HANA, NPTEL Java (Elite, 87%).' },
  { year: '2025', title: 'Open source', body: 'GSSoC 2025 contributor, Smart India Hackathon, led 5 volunteers.' },
  { year: 'Projects', title: 'Building with AI', body: 'A medical RAG chatbot and CodeBlitz, a tutor that teaches.' },
  { year: '2026', title: 'Full stack intern', body: 'GoDatabase LLP: auth, REST APIs and PostgreSQL for a hiring platform.' },
];
const TIPS = [
  'Rubber duck says: explain it line by line.',
  'Read the error message. Then read it again.',
  "It's always the cache. Or a typo.",
  'Off by one? Check your loop bounds.',
  'git blame says… oh. It was me.',
  'Print the input before blaming the logic.',
  'Sleep on it. Bugs fear rested eyes.',
  'Works on my machine. Ship the machine?',
];
let got = new Set();
try { got = new Set(JSON.parse(localStorage.getItem('uk-sketch-ach') || '[]')); } catch (e) { /* storage blocked */ }
function renderAch() {
  $('.ach').innerHTML = ACH.map(([id, t, d]) => `<li class="${got.has(id) ? 'is-done' : ''}"><i></i><b>${t}</b><span>${d}</span></li>`).join('');
  $('.ach__count').innerHTML = `${got.size} / ${ACH.length} found${got.size >= ACH.length ? ' <button class="cert-btn" type="button">certificate ↓</button>' : ''}`;
  $('.tile__badge').textContent = got.size;
}
function unlock(id) {
  if (got.has(id)) return;
  got.add(id);
  try { localStorage.setItem('uk-sketch-ach', JSON.stringify([...got])); } catch (e) { /* storage blocked */ }
  renderAch();
  const a = ACH.find((x) => x[0] === id);
  Sound.chime();
  toast(a[1], `${a[2]} · ${got.size}/${ACH.length}`, { done: true });
  if (got.size === ACH.length) setTimeout(showCert, 3800);
}
renderAch();

function openPanel(name) {
  const p = $(`.panel--${name}`);
  const open = p.hidden;
  $$('.panel').forEach((x) => (x.hidden = true));
  if (open) { p.hidden = false; tear(p); Sound.rustle(); }
}
$$('[data-open]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); Sound.wake(); openPanel(b.dataset.open); }));
document.addEventListener('click', (e) => { if (!e.target.closest('.panel, [data-open]')) $$('.panel').forEach((x) => (x.hidden = true)); });

const modal = $('.modal');
let lastFocus = null;
function openModal(htmlStr) {
  lastFocus = document.activeElement;
  $('.modal__body').innerHTML = htmlStr;
  modal.hidden = false;
  tear($('.modal__paper'));
  $$('.tags li', modal).forEach((li, i) => li.style.setProperty('--r', `${(i % 3 - 1) * 1.5}deg`));
  $('.modal__x').focus();
  Sound.rustle();
}
let afterModal = null;
function closeModal() {
  if (modal.hidden) return;
  modal.hidden = true;
  Sound.rustle();
  if (lastFocus) lastFocus.focus();
  if (afterModal) { const f = afterModal; afterModal = null; f(); }
}
$('.modal__x').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); $$('.panel').forEach((x) => (x.hidden = true)); }
});

const tags = (a) => `<ul class="tags">${a.map((t) => `<li>${t}</li>`).join('')}</ul>`;
const PAGES = {
  rag: `<p class="kick">AI · knowledge system · Mar – Jun 2026</p><h2 id="modal-title">Medical RAG Chatbot</h2>
    <p>A retrieval-augmented chatbot over 2,000 MedQuAD medical Q&amp;A pairs. It finds the top 4 relevant passages with FAISS vector search and MiniLM embeddings, then answers from them with source references.</p>
    <p>It fails over across 4 Gemini models on rate limits and caches responses to avoid repeat API calls.</p>
    ${tags(['Python', 'LangChain', 'FAISS', 'Gemini API', 'Gradio'])}
    <a class="btn" href="https://github.com/ud-ai/Medical_RAG_Chatbot" target="_blank" rel="noopener">View repo ↗</a>`,
  code: `<p class="kick">Chrome extension · AI · Jul 2025 – Mar 2026</p><h2 id="modal-title">CodeBlitz</h2>
    <p>A Manifest V3 Chrome extension that adds an AI mock interviewer to LeetCode, using the problem on the page as context. Interview and mentor modes favor hints over solutions.</p>
    <p>It also has a session timer, voice input and per-problem chat history.</p>
    ${tags(['React', 'TypeScript', 'Manifest V3', 'Gemini API', 'Vite'])}
    <a class="btn" href="https://github.com/ud-ai/CodeBlitz" target="_blank" rel="noopener">View repo ↗</a>`,
  experience: `<p class="kick">Experience · June 2026 – present</p><h2 id="modal-title">Full Stack Developer Intern</h2>
    <p><b>GoDatabase LLP</b>, Pune, Maharashtra (remote)</p>
    <ul class="list">
      <li>Primary contributor to a hiring platform with 161 REST API routes, 33 data models and 61 Next.js pages, authoring 194 commits across the frontend and backend.</li>
      <li>Built authentication flows (signup, login, email verification, OTP, password reset) with Next.js, TypeScript and Tailwind CSS.</li>
      <li>Developed RESTful APIs with Node.js and Express.js, migrating MongoDB/Mongoose logic to PostgreSQL/Sequelize while preserving business logic.</li>
      <li>Implemented JWT authentication and OAuth (Google, GitHub, LinkedIn) via Passport.js, fixing token-generation and callback issues that affected session integrity.</li>
      <li>Designed 14-table relational schemas covering role-based access control, profiles, sessions and audit logs.</li>
      <li>Fixed security issues including a stored XSS vulnerability and a signup token bypass, and replaced section-level admin scopes with per-action permissions.</li>
    </ul>
    ${tags(['Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express.js', 'PostgreSQL', 'Sequelize', 'MongoDB', 'JWT', 'OAuth', 'Passport.js'])}`,
  'ach:top5': `<p class="kick">Achievements</p><h2 id="modal-title">Top 5% of the cohort</h2>
    <p>Top 5% of the B.Tech CSE cohort at Narula Institute of Technology, with a CGPA of 9.05/10.</p>`,
  'ach:dsa': `<p class="kick">Achievements</p><h2 id="modal-title">300+ DSA problems</h2>
    <p>Solved 300+ data structures and algorithms problems across LeetCode, Codeforces and GeeksforGeeks, and improved my rank by 20% in 3 months.</p>
    ${tags(['LeetCode', 'Codeforces', 'GeeksforGeeks'])}`,
  'ach:gssoc': `<p class="kick">Achievements · open source</p><h2 id="modal-title">GSSoC 2025 contributor</h2>
    <p>Merged 3 pull requests across 3 open-source repositories during GirlScript Summer of Code 2025, including NotesVault and Canvas.</p>`,
  'ach:sih': `<p class="kick">Achievements · hackathon</p><h2 id="modal-title">Smart India Hackathon</h2>
    <p>Built a working College ERP system for SIH, a national hackathon with over a million students taking part.</p>`,
  'ach:quiz': `<p class="kick">Leadership</p><h2 id="modal-title">Quiz Competition Lead Coordinator</h2>
    <p>Led 5 volunteers to run an inter-department quiz for 100+ participants.</p>`,
  skills: `<p class="kick">The toolbox</p><h2 id="modal-title">Skills</h2>
    <div class="grid">${SKILLS.map(([t, a]) => `<div><h3>${t}</h3><p>${a.join(', ')}</p></div>`).join('')}</div>`,
  ...Object.fromEntries(SKILLS.map(([t, a]) => [`skill:${t}`, `<p class="kick">Skills</p><h2 id="modal-title">${t}</h2>${tags(a)}`])),
  certs: `<p class="kick">Pinned on the board</p><h2 id="modal-title">Certificates</h2>
    <div class="grid">
      <div><h3>Generative AI &amp; LLMs</h3><p>30 hours of training, Narula Institute of Technology, Feb 2026.</p></div>
      <div><h3>SAP S/4HANA</h3><p>Application development, SAP University Alliances, 2025.</p></div>
      <div><h3>NPTEL Java</h3><p>Programming in Java, Elite (87%), IIT Kharagpur, 2025.</p></div>
    </div>`,
  contact: `<p class="kick">Say hello</p><h2 id="modal-title">Let's talk</h2>
    <p>I'm a software engineer and B.Tech CSE student (CGPA 9.05, top 5% of my batch), currently a full stack intern at GoDatabase LLP.</p>
    <p><a class="btn" href="mailto:udaykant180@gmail.com?subject=Hello%20Uday">udaykant180@gmail.com</a></p>
    <p><a class="btn btn--ghost" href="https://www.linkedin.com/in/uday-kant-61a242298/" target="_blank" rel="noopener">LinkedIn ↗</a><a class="btn btn--ghost" href="https://github.com/ud-ai" target="_blank" rel="noopener">GitHub ↗</a><a class="btn btn--ghost" href="../UdayResume.pdf?v=2026-11" target="_blank" rel="noopener">Resume ↗</a></p>`,
};
PAGES.eggs = `<p class="kick">The easter-egg room</p><h2 id="modal-title">Every secret, with hints</h2>
    <ul class="list">${EGGS.map(([t, h]) => `<li><b>${t}</b>: ${h}.</li>`).join('')}</ul>
    <p>Found them all? Collect every achievement for a certificate.</p>`;
function page(id) {
  openModal(PAGES[id]);
  if (['rag', 'code'].includes(id)) unlock('critic');
  if (id === 'skills' || id.startsWith('skill:')) unlock('polyglot');
  if (id === 'contact') unlock('social');
}

/* ==========================================================
   Easter eggs shared by every scene
   ========================================================== */
// Konami code: the sketchbook turns into a blueprint
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konami = 0;
window.addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  konami = k === KONAMI[konami] ? konami + 1 : k === KONAMI[0] ? 1 : 0;
  if (konami < KONAMI.length) return;
  konami = 0;
  const on = document.documentElement.classList.toggle('blueprint');
  Sound.wake();
  Sound.chime();
  toast(on ? 'Blueprint mode' : 'Back to paper', on ? 'Up, up, down, down… you know your classics.' : 'Pencil and paper again.');
  unlock('hacker');
}, true);

// every achievement found: a certificate to keep
function showCert() {
  const url = drawCertificate().toDataURL('image/png');
  openModal(`<p class="kick">100% complete</p><h2 id="modal-title">You found everything!</h2>
    <img class="cert" src="${url}" alt="Certificate of Exploration: found all ${ACH.length} achievements in Uday Kant's sketchbook" />
    <p><a class="btn" href="${url}" download="uday-kant-certificate.png">Download certificate ↓</a></p>`);
}
document.addEventListener('click', (e) => { if (e.target.closest('.cert-btn')) { e.stopPropagation(); showCert(); } });

/* ==========================================================
   Outside: the front of the building (2D canvas)
   ========================================================== */
const Outside = (() => {
  const cv = $('.outside');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, base = null, L = null, hover = null, opening = -1, raf = 0, mx = 0.5, my = 0.5, pmx = 0.5, pmy = 0.5, hk = 0;
  let bugSpr = [], splash = null, bugSize = 40, tipB = null, tipN = 0;
  const bug = { fixed: -1, back: 0, x: -99, y: -99, lx: 0, ly: 0, fx: 0, fy: 0, rot: 0, kills: 0, ver: 1 };
  const tire = { a: 0, w: 0, x: -99, y: -99, r: 0 };
  let knocks = [], kT = 0, lastF = 0;
  const backOut = (k) => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const dw = clamp(Math.min(W * 0.19, H * 0.26), 150, 320);
    const dh = dw * 1.42;
    const G = H * (W < 640 ? 0.74 : 0.8);
    L = { dw, dh, G, door: { x: W / 2 - dw / 2, y: G - dh, w: dw, h: dh } };
    L.sign = { x: W / 2 - dw * 0.78, y: L.door.y - dw * 0.62, w: dw * 1.56, h: dw * 0.4 };
    L.win = { x: W / 2 + dw * 1.05, y: G - dh * 0.95, w: dw * 0.95, h: dw * 0.8 };
    L.mail = { x: W / 2 + dw * 0.66, y: G - dw * 0.62, w: dw * 0.3, h: dw * 0.24 };
    L.tree = { x: W / 2 - dw * 2.05 };
    const bx = W / 2 + dw * 1.6;
    L.bug = bx + dw * 0.6 < W ? { x: bx, y: L.door.y - dw * 0.45, a: dw * 0.42 } : { x: W / 2 - dw * 0.95, y: L.door.y + dh * 0.32, a: dw * 0.2 };
    bugSize = Math.max(30, dw * 0.27);
    bugSpr = [drawBug(bugSize * dpr / 2, 0), drawBug(bugSize * dpr / 2, 1)];
    splash = drawSplash(dw * 1.3 * dpr / 2);
    draw();
  }

  function draw() {
    const { dw, dh, G, door } = L;
    const off = document.createElement('canvas');
    off.width = cv.width + 40 * dpr; off.height = cv.height + 40 * dpr;
    const o = off.getContext('2d');
    o.scale(dpr, dpr);
    o.translate(20, 20);
    const r = rough.canvas(off);
    seedN = 99;
    // paper and ground
    o.fillStyle = '#efeee9'; o.fillRect(-20, -20, W + 40, H + 40);
    o.fillStyle = '#e8e6e0'; o.fillRect(-20, G, W + 40, H - G + 20);
    // bricks
    const bh = dw * 0.115, bw = bh * 2.7;
    const holes = [
      { x: door.x - 10, y: door.y - 10, w: door.w + 20, h: door.h + 10 },
      { x: L.win.x - 8, y: L.win.y - 8, w: L.win.w + 16, h: L.win.h + 16 },
    ];
    const inHole = (x, y, w, h) => holes.some((q) => x < q.x + q.w && x + w > q.x && y < q.y + q.h && y + h > q.y);
    for (let row = 0, y = G - bh; y > -bh; y -= bh, row++) {
      for (let x = -(row % 2) * bw / 2 - 10; x < W + 10; x += bw) {
        if (inHole(x + 3, y + 3, bw - 6, bh - 6)) continue;
        r.rectangle(x + 3, y + 3, bw - 6, bh - 6, { roughness: 1.3, bowing: 1.2, stroke: 'rgba(40,40,40,0.55)', strokeWidth: 1.1, seed: seed() });
      }
    }
    // ground lines and stone path
    r.line(-10, G, W + 10, G, S({ strokeWidth: 2.4 }));
    const g = rand(17);
    for (let i = 0; i < 70; i++) { const x = g() * W, y = G + 8 + g() * (H - G); r.line(x, y, x + 6 + g() * 10, y - 4 - g() * 8, S({ strokeWidth: 1, stroke: C.faint })); }
    const pathTop = door.w * 0.9, pathBot = Math.min(W * 0.62, door.w * 2.6);
    for (let j = 0; j < 6; j++) {
      const t0 = j / 6, y = G + 10 + (H - G) * Math.pow(t0, 1.2) * 0.95, w = lerp(pathTop, pathBot, t0) / 3;
      for (let k = -1; k <= 1; k++) r.ellipse(W / 2 + k * w * 1.05 + (j % 2) * w * 0.3, y + w * 0.18, w * 0.95, w * 0.34, S({ strokeWidth: 1.6, fill: '#e2dfd6', fillStyle: 'solid', roughness: 1.6 }));
    }
    // window and planter
    const wn = L.win;
    r.rectangle(wn.x, wn.y, wn.w, wn.h, S({ strokeWidth: 3.2, fill: '#f7f6f2', fillStyle: 'solid' }));
    r.line(wn.x + wn.w / 2, wn.y, wn.x + wn.w / 2, wn.y + wn.h, S({ strokeWidth: 2.4 }));
    r.line(wn.x, wn.y + wn.h / 2, wn.x + wn.w, wn.y + wn.h / 2, S({ strokeWidth: 2.4 }));
    [[0.15, 0.2], [0.65, 0.25]].forEach(([a, b]) => r.line(wn.x + wn.w * a, wn.y + wn.h * b, wn.x + wn.w * (a + 0.16), wn.y + wn.h * (b - 0.1), S({ strokeWidth: 1.4, stroke: C.faint })));
    const px = wn.x - dw * 0.1, py = wn.y + wn.h + dw * 0.32, pw = wn.w + dw * 0.2;
    for (let k = 0; k < 6; k++) {
      const sx = px + 20 + k * (pw - 40) / 5, h = dw * (0.18 + (k % 3) * 0.07);
      if (k % 2) { r.ellipse(sx, py - h / 2, dw * 0.12, h, S({ fill: C.leaf, fillStyle: 'hachure', hachureGap: 5, strokeWidth: 1.6 })); }
      else for (let l = -2; l <= 2; l++) r.line(sx, py, sx + l * dw * 0.035, py - h + Math.abs(l) * 6, S({ strokeWidth: 1.8, stroke: '#4f6e48' }));
    }
    r.rectangle(px, py, pw, dw * 0.2, S({ fill: '#e3d8c3', fillStyle: 'hachure', hachureGap: 8, strokeWidth: 2.6 }));
    // tree with canopy (the swing is drawn live)
    const tx = L.tree.x, crown = dw * 1.5;
    r.curve([[tx - dw * 0.12, G], [tx - dw * 0.05, G - dh * 0.6], [tx - dw * 0.02, G - dh * 1.25]], S({ strokeWidth: 3 }));
    r.curve([[tx + dw * 0.12, G], [tx + dw * 0.07, G - dh * 0.6], [tx + dw * 0.05, G - dh * 1.25]], S({ strokeWidth: 3 }));
    r.curve([[tx, G - dh * 0.9], [tx + dw * 0.45, G - dh * 1.05], [tx + dw * 0.9, G - dh * 1.05]], S({ strokeWidth: 3 }));
    for (let k = 0; k < 9; k++) r.line(tx - dw * 0.06 + (k % 3) * 5, G - k * dh * 0.12, tx + (k % 2) * 6, G - k * dh * 0.12 - 18, S({ strokeWidth: 1, stroke: C.faint }));
    const blobs = [[0, -1.55, 1.1], [-0.55, -1.35, 0.9], [0.55, -1.38, 0.95], [-0.3, -1.75, 0.85], [0.35, -1.78, 0.8], [0.9, -1.25, 0.6]];
    blobs.forEach(([bx, by, s]) => r.ellipse(tx + bx * crown * 0.55, G + by * dh, crown * 0.75 * s, crown * 0.55 * s, S({ fill: '#f2f1ec', fillStyle: 'solid', strokeWidth: 2.2, roughness: 2 })));
    blobs.forEach(([bx, by, s]) => r.ellipse(tx + bx * crown * 0.55, G + by * dh, crown * 0.6 * s, crown * 0.42 * s, S({ stroke: 'transparent', fill: 'rgba(110,140,100,0.35)', fillStyle: 'hachure', hachureGap: 9, roughness: 2 })));
    // mailbox
    const m = L.mail;
    r.line(m.x + m.w / 2, m.y + m.h, m.x + m.w / 2, G, S({ strokeWidth: 3 }));
    r.rectangle(m.x, m.y, m.w, m.h, S({ fill: '#f7f6f2', fillStyle: 'solid', strokeWidth: 2.4 }));
    r.line(m.x + m.w * 0.15, m.y + m.h * 0.35, m.x + m.w * 0.85, m.y + m.h * 0.35, S({ strokeWidth: 1.6 }));
    r.rectangle(m.x + m.w, m.y - m.h * 0.5, m.w * 0.12, m.h * 0.8, S({ fill: C.acc, fillStyle: 'solid', strokeWidth: 1.6 }));
    txt(o, 'contact', m.x + m.w / 2, m.y + m.h * 0.78, { size: Math.max(11, dw * 0.06), font: F.hand });
    // door frame, the leaves are drawn live
    r.rectangle(door.x - 12, door.y - 14, door.w + 24, door.h + 14, S({ strokeWidth: 3.4, fill: '#e9e4d8', fillStyle: 'solid' }));
    // sign with chains
    const s = L.sign;
    r.rectangle(s.x - dw * 0.15, s.y - dw * 0.5, s.w + dw * 0.3, dw * 0.13, S({ fill: '#e3d8c3', fillStyle: 'hachure', hachureGap: 7, strokeWidth: 2.4 }));
    [s.x + s.w * 0.12, s.x + s.w * 0.88].forEach((x) => { for (let y = s.y - dw * 0.37; y < s.y; y += dw * 0.07) r.ellipse(x, y + dw * 0.035, dw * 0.035, dw * 0.06, S({ strokeWidth: 1.4, roughness: 0.6 })); });
    r.rectangle(s.x, s.y, s.w, s.h, S({ fill: '#ece5d6', fillStyle: 'solid', strokeWidth: 3 }));
    r.rectangle(s.x, s.y, s.w, s.h, S({ stroke: 'transparent', fill: 'rgba(90,70,40,0.35)', fillStyle: 'hachure', hachureGap: 9, fillWeight: 0.7 }));
    txt(o, 'UDAY KANT', W / 2, s.y + s.h * 0.7, { size: s.h * 0.62, font: F.logo });
    base = off;
  }

  function leaves(o, r, k) {
    const { door } = L;
    // interior light behind the doors
    const gr = o.createLinearGradient(0, door.y, 0, door.y + door.h);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#f3efe4');
    o.fillStyle = gr;
    o.fillRect(door.x, door.y, door.w, door.h);
    const half = door.w / 2;
    seedN = 501;
    [[door.x, 1], [door.x + door.w, -1]].forEach(([hx, dir], side) => {
      const w = half * (1 - easeIO(k));
      if (w < 2) return;
      const x = dir > 0 ? hx : hx - w;
      r.rectangle(x, door.y, w, door.h, S({ fill: hover === 'door' ? '#fffaf0' : C.white, fillStyle: 'solid', strokeWidth: 2.6, seed: 300 + side }));
      const pw = w * 0.7, ppx = x + (w - pw) / 2;
      r.rectangle(ppx, door.y + door.h * 0.08, pw, door.h * 0.36, S({ strokeWidth: 1.8, seed: 310 + side }));
      r.rectangle(ppx, door.y + door.h * 0.52, pw, door.h * 0.4, S({ strokeWidth: 1.8, seed: 320 + side }));
      const hy = door.y + door.h * 0.48, hxx = dir > 0 ? x + w - 12 : x + 12;
      r.line(hxx, hy, hxx - dir * 16, hy, S({ strokeWidth: 4, seed: 330 + side }));
      if (k < 0.15) {
        const list = side ? ['React', 'TS', 'Kotlin', 'Docker'] : ['Python', 'AI', 'Java', 'Git'];
        list.forEach((lab, i) => sticker(o, r, lab, x + w * (i % 2 ? 0.58 : 0.44), door.y + door.h * [0.16, 0.3, 0.62, 0.76][i], ((i * 37 + side * 13) % 7 - 3) * 0.05, w / 290));
        if (side === 0) {
          // a brass knocker: knock three times, or five
          const kx = x + w * 0.42, ky = door.y + door.h * 0.45, rr = door.w * 0.075, e = performance.now() - kT;
          const sw = e < 300 ? Math.sin(e / 30) * 0.4 * (1 - e / 300) : 0;
          r.circle(kx, ky, rr * 0.7, { stroke: C.ink, strokeWidth: 1.6, fill: '#c9a24a', fillStyle: 'solid', roughness: 0.6, seed: 61 });
          r.ellipse(kx + Math.sin(sw) * rr * 0.9, ky + Math.cos(sw) * rr * 0.9, rr * 1.4, rr * 1.5, { stroke: '#7a5a14', strokeWidth: 3, roughness: 0.5, seed: 62 });
          L.knock = { x: kx, y: ky + rr * 0.6, r: rr * 1.4 };
        }
      }
    });
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    pmx += (mx - pmx) * 0.06; pmy += (my - pmy) * 0.06;
    const t = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ox = (pmx - 0.5) * -14 - 20, oy = (pmy - 0.5) * -8 - 20;
    ctx.drawImage(base, 0, 0, base.width, base.height, ox, oy, base.width / dpr, base.height / dpr);
    ctx.save();
    ctx.translate(ox + 20, oy + 20);
    const r = rough.canvas(cv);
    // tire swing swaying from the branch
    const { dw, dh, G } = L;
    const bx = L.tree.x + dw * 0.62, by = G - dh * 1.02;
    // the swing is a damped pendulum on top of the idle sway; push it hard enough and it loops over the branch
    const dtS = Math.min(0.033, (now - (lastF || now)) / 1000);
    lastF = now;
    tire.w += (-9 * Math.sin(tire.a) - 0.32 * tire.w) * dtS;
    tire.a += tire.w * dtS;
    const ang = (reduce ? 0 : Math.sin(t * 1.3) * 0.16) + tire.a;
    const len = dh * 0.62;
    const ex = bx + Math.sin(ang) * len, ey = by + Math.cos(ang) * len;
    r.line(bx - dw * 0.08, by, ex - dw * 0.08, ey, { stroke: C.ink, strokeWidth: 1.6, roughness: 0.4, seed: 41 });
    r.line(bx + dw * 0.08, by, ex + dw * 0.08, ey, { stroke: C.ink, strokeWidth: 1.6, roughness: 0.4, seed: 42 });
    r.ellipse(ex, ey + dw * 0.12, dw * 0.42, dw * 0.3, { stroke: C.ink, strokeWidth: 3, roughness: 0.8, fill: '#3a3a3a', fillStyle: 'hachure', hachureGap: 5, seed: 43 });
    r.ellipse(ex, ey + dw * 0.12, dw * 0.2, dw * 0.13, { stroke: C.ink, strokeWidth: 2, roughness: 0.6, fill: '#efeee9', fillStyle: 'solid', seed: 44 });
    tire.x = ex + ox + 20; tire.y = ey + dw * 0.12 + oy + 20; tire.r = dw * 0.26;
    // the doors
    const k = opening < 0 ? 0 : clamp((now - opening) / 900);
    hk += ((hover === 'door' && opening < 0 ? 1 : 0) - hk) * 0.15;
    if (hover === 'door' && k === 0) {
      ctx.fillStyle = 'rgba(240,99,42,0.08)';
      ctx.fillRect(L.door.x - 6, L.door.y - 6, L.door.w + 12, L.door.h + 6);
    }
    leaves(ctx, r, Math.max(k, hk * 0.12));
    drawBugLayer(now, t, ox, oy);
    ctx.restore();
  }

  // the bug crawls over the bricks; click it and it splats into ink
  function drawBugLayer(now, t, ox, oy) {
    const B = L.bug;
    const sp = 1 + 0.22 * bug.kills;
    const at = (tt) => [B.x + (Math.sin(tt * 0.8) * 0.75 + Math.sin(tt * 1.5) * 0.25) * B.a, B.y + (Math.cos(tt * 0.6) * 0.7 + Math.cos(tt * 1.1) * 0.3) * B.a * 0.7];
    if (bug.fixed < 0) {
      const tb = reduce ? 0 : t * sp;
      const [x, y] = at(tb), [x2, y2] = at(tb + 0.06);
      const ang = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
      ctx.save();
      ctx.globalAlpha = bug.back ? clamp((now - bug.back) / 700) : 1;
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.drawImage(bugSpr[reduce ? 0 : Math.floor(now / 110 * sp) % 2], -bugSize / 2, -bugSize / 2, bugSize, bugSize);
      ctx.restore();
      if (bug.ver > 1) {
        ctx.save();
        ctx.font = `400 ${Math.max(14, bugSize * 0.42)}px ${F.hand}`;
        ctx.textAlign = 'left'; ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.fillStyle = C.acc;
        ctx.strokeText(`v${bug.ver}`, x + bugSize * 0.45, y - bugSize * 0.4);
        ctx.fillText(`v${bug.ver}`, x + bugSize * 0.45, y - bugSize * 0.4);
        ctx.restore();
      }
      bug.lx = x; bug.ly = y; bug.x = x + ox + 20; bug.y = y + oy + 20;
    } else {
      const e = now - bug.fixed, a = 1 - clamp((e - 2400) / 900);
      if (a > 0) {
        const sc = backOut(clamp(e / 420)), sz = L.dw * 1.3;
        ctx.save();
        ctx.globalAlpha = a * 0.92;
        ctx.translate(bug.fx, bug.fy);
        ctx.rotate(bug.rot);
        ctx.scale(sc, sc);
        ctx.drawImage(splash, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
        const fs = Math.max(26, L.dw * 0.22), wd = bug.ver > 1 ? `v${bug.ver} FIXED!` : 'BUG FIXED!';
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `400 ${fs}px ${F.logo}`;
        const tw = ctx.measureText(wd).width, tx = clamp(bug.fx, tw / 2 + 12, W - tw / 2 - 12);
        ctx.beginPath();
        ctx.rect(tx - tw / 2 - 12, bug.fy - fs, (tw + 24) * easeIO(clamp((e - 150) / 800)), fs * 2);
        ctx.clip();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        ctx.lineWidth = fs * 0.18; ctx.strokeStyle = '#fff';
        ctx.strokeText(wd, tx, bug.fy);
        ctx.fillStyle = C.ink;
        ctx.fillText(wd, tx, bug.fy);
        ctx.restore();
      }
      if (e > (bug.kills > 1 ? 4500 : 7000)) { bug.fixed = -1; bug.back = now; bug.ver = bug.kills + 1; }
    }
    // a debugging tip from the window
    if (tipB) {
      const e = now - tipB.t0;
      if (e > 3600) tipB = null;
      else {
        const sc = backOut(clamp(e / 300)) * (1 - clamp((e - 3300) / 300));
        const cx = clamp(tipB.ax ?? L.win.x + L.win.w / 2, tipB.w / 2 + 8, W - tipB.w / 2 - 8), cy = tipB.ay ?? L.win.y - 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.drawImage(tipB.c, -tipB.w / 2, -tipB.h, tipB.w, tipB.h);
        ctx.restore();
      }
    }
  }
  function squash() {
    bug.fixed = performance.now();
    bug.fx = bug.lx; bug.fy = bug.ly; bug.rot = Math.random() * Math.PI * 2;
    bug.x = bug.y = -99;
    splash = drawSplash(L.dw * 1.3 * dpr / 2);
    Sound.splat();
    showTip('');
    cv.classList.remove('is-hover');
    bug.kills++;
    setTimeout(() => unlock('debugger'), 900);
    if (bug.kills === 2) setTimeout(() => toast('It’s back…', 'Every fix ships a new version. Squash 5.'), 2600);
    if (bug.kills >= 5) setTimeout(() => unlock('exterminator'), 1400);
  }
  function say(text, ax, ay) {
    Sound.scribble();
    tipB = { ...drawTip(text, Math.min(L.dw * 1.9, W - 24)), t0: performance.now(), ax, ay };
  }
  function hint() { say(TIPS[tipN++ % TIPS.length]); }
  function knock() {
    const n = performance.now();
    kT = n;
    Sound.knock();
    knocks = knocks.filter((x) => n - x < 2500);
    knocks.push(n);
    const ax = L.door.x + L.door.w / 2, ay = L.door.y - 4;
    if (knocks.length === 3) say('Who’s there?', ax, ay);
    if (knocks.length >= 5) { knocks = []; say('It’s open, come in!', ax, ay); setTimeout(enter, 900); }
  }
  function push(cx) {
    tire.w = clamp(tire.w + (cx < tire.x ? 1 : -1) * 2.6, -14, 14);
    Sound.whoosh();
  }

  function hit(x, y) {
    const pad = (q, p = 0) => x > q.x - p && x < q.x + q.w + p && y > q.y - p && y < q.y + q.h + p;
    if (bug.fixed < 0 && Math.hypot(x - bug.x, y - bug.y) < bugSize * 0.75) return 'bug';
    if (L.knock && Math.hypot(x - L.knock.x, y - L.knock.y) < L.knock.r) return 'knock';
    if (pad(L.door, 4)) return 'door';
    if (pad(L.win, 2)) return 'win';
    if (Math.hypot(x - tire.x, y - tire.y) < tire.r) return 'tire';
    if (pad({ x: L.mail.x, y: L.mail.y, w: L.mail.w * 1.15, h: L.G - L.mail.y }, 6)) return 'mail';
    if (pad(L.sign, 4)) return 'sign';
    return null;
  }

  let entered = null;
  const done = new Promise((res) => (entered = res));

  cv.addEventListener('pointermove', (e) => {
    mx = e.clientX / W; my = e.clientY / H;
    if (opening >= 0) return;
    hover = hit(e.clientX, e.clientY);
    cv.classList.toggle('is-hover', !!hover);
    showTip({ door: 'Come in', mail: 'Say hi', sign: 'That’s me', bug: bug.ver > 1 ? `Bug v${bug.ver}! Squash it` : 'A bug! Squash it', win: 'Need a debugging tip?', knock: 'Knock knock', tire: 'Give it a push' }[hover] || '', e.clientX, e.clientY);
  });
  cv.addEventListener('pointerleave', () => showTip(''));
  cv.addEventListener('click', (e) => {
    Sound.wake();
    const h = hit(e.clientX, e.clientY);
    if (h === 'bug') squash();
    else if (h === 'knock') knock();
    else if (h === 'tire') push(e.clientX);
    else if (h === 'door') enter();
    else if (h === 'win') hint();
    else if (h === 'mail') page('contact');
    else if (h === 'sign') { Sound.scribble(); toast('Hello', 'I’m Uday, a software developer and CS student.'); }
  });
  window.addEventListener('keydown', (e) => {
    if (L && !cv.hidden && opening < 0 && !cv.classList.contains('is-gone') && (e.key === 'Enter' || e.key === ' ') && modal.hidden && document.activeElement === document.body) enter();
  });

  async function enter() {
    if (opening >= 0) return;
    opening = performance.now();
    showTip('');
    cv.classList.remove('is-hover');
    Sound.creak();
    unlock('explorer');
    await sleep(reduce ? 50 : 750);
    const cx = (L.door.x + L.door.w / 2) / W * 100, cy = (L.door.y + L.door.h * 0.5) / H * 100;
    cv.style.transformOrigin = `${cx}% ${cy}%`;
    cv.style.transform = `scale(${reduce ? 1 : 7})`;
    cv.classList.add('is-gone');
    entered();
    await sleep(1400);
    cancelAnimationFrame(raf);
    cv.hidden = true;
  }

  return {
    start() { layout(); raf = requestAnimationFrame(frame); window.addEventListener('resize', () => { if (!cv.hidden) layout(); }); },
    done,
    skip() { cv.hidden = true; entered(); },
  };
})();

/* ==========================================================
   Inside: a corridor of doors, each one opening into a room (three.js)
   ========================================================== */
const World = (() => {
  const cv = $('.world');
  const LEN = 40, WID = 6, HEI = 4, Z0 = 2.4, Z1 = -31.5, START = 4, ZEND = START - LEN;
  const FW = 1.6, FH = (FW * 1240) / 700, OW = (FW * 520) / 700, OH = (FH * 1040) / 1240;
  const RD = 5, RH = 4.5, CAMZ = 0.6;
  let renderer, camera, scene, corridor, view, bot, arm, plane, bubble;
  let hovered = null, mode = 'off', here = null, roomHint = false;
  let target = 0, prog = 0, rt = 0, rp = 0, lastStep = 0, yaw = 0, pitch = 0, mx = 0, my = 0, touch = null;
  const tweens = [], doors = {}, balloons = [];
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  const backBtn = $('.back-btn');
  const fadeEl = $('.fade');
  const hint = $('.scroll-hint');

  const link = (url) => { unlock('social'); window.open(url, '_blank', 'noopener'); };
  const ROOMS = {
    about: { name: 'About me', label: 'ABOUT ME', side: 'left', z: -9.5, tint: '#f6d7a7', wall: '#f6f1e7', stickers: ['AI', 'Python', 'Java', 'Git'], hint: 'Scroll to read my story, left to right.' },
    experience: { name: 'Experience', label: 'EXPERIENCE', side: 'right', z: -13, tint: '#f2d48a', wall: '#f6f2e8', stickers: ['Next.js', 'TS', 'Git', 'Redis'], hint: 'Click the card to read the details.' },
    projects: { name: 'Projects', label: 'PROJECTS', side: 'left', z: -16.5, tint: '#b9d6f2', wall: '#eef1f4', stickers: ['React', 'TS', 'Next.js', 'Python'], hint: 'Click a frame to inspect it.' },
    skills: { name: 'Skills', label: 'SKILLS', side: 'right', z: -20, tint: '#c7e6bd', wall: '#edf3f5', stickers: ['Kotlin', 'Docker', 'Redis', 'C++'], hint: 'Pop a balloon, press PLAY for the shooting range, or T for a typing test.' },
    achievements: { name: 'Achievements', label: 'AWARDS', side: 'left', z: -23.5, tint: '#f6e08a', wall: '#f7f3e6', stickers: ['C++', 'Java', 'Git', 'AI'], hint: 'Click a plaque to read it.' },
    lab: { name: 'Easter eggs', label: 'EASTER EGGS', side: 'right', z: -27.5, tint: '#d9d2f0', wall: '#efedf6', stickers: ['AI', 'Git', 'Python', 'React'], hint: 'Every secret in this sketchbook, with hints. 🥚' },
    contact: { name: 'Contact', label: 'CONTACT', side: 'end', z: ZEND, tint: '#f4b9a4', wall: '#f6efea', stickers: ['AI', 'Git', 'Firebase', 'React'], hint: 'Pick a way to say hi.' },
  };

  function tex(c, repeat) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  function decal(c, width, { x = 0, y = 1.6, z = 0, ry = 0, rz = 0, opaque = false } = {}) {
    const h = (width * c.height) / c.width;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: tex(c), transparent: !opaque, alphaTest: 0.02 }));
    m.position.set(x, y, z);
    m.rotation.set(0, ry, rz);
    scene.add(m);
    return m;
  }
  const onLeft = (z, y, w, c, rz = 0) => decal(c, w, { x: -WID / 2 + 0.02, y, z, ry: Math.PI / 2, rz });
  const onRight = (z, y, w, c, rz = 0) => decal(c, w, { x: WID / 2 - 0.02, y, z, ry: -Math.PI / 2, rz });
  const onBack = (x, y, w, c, dz = 0, rz = 0) => decal(c, w, { x, y, z: -RD + 0.02 + dz, rz });
  // a prop that throws a real shadow in torchlight (alpha-tested, so the drawing's outline is the shadow)
  const ink = (m) => { m.userData.ink = true; return m; };
  function lightInk(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { d[i] = 215 + d[i] * 0.16; d[i + 1] = 205 + d[i + 1] * 0.18; d[i + 2] = 185 + d[i + 2] * 0.2; }
    x.putImageData(im, 0, 0);
    return c;
  }
  function caster(m) {
    m.castShadow = true;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: m.material.map, alphaTest: 0.5, side: THREE.DoubleSide });
    return m;
  }
  function clickable(mesh, label, fn) {
    mesh.userData = { ...mesh.userData, label, fn, s: 1 };
    scene.userData.hits.push(mesh);
    return mesh;
  }
  // inside a room, clicking a board walks you up to it before it opens
  const board = (mesh, label, fn) => clickable(mesh, label, () => focusOn(mesh, fn));
  function makeScene(col, near, far) {
    const s = new THREE.Scene();
    const c = new THREE.Color(col);
    s.background = c;
    s.fog = new THREE.Fog(c, near, far);
    s.userData.hits = [];
    return s;
  }

  // a door is a frame on the wall plus a leaf on a hinge that swings into the corridor
  function makeDoor(id) {
    const R = ROOMS[id];
    const frameC = drawDoorFrame(R.label, R.tint);
    const sketchT = tex(drawLeaf(R.stickers, false, R.tint)), paintT = tex(drawLeaf(R.stickers, true, R.tint));
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(OW, OH).translate(OW / 2, OH / 2, 0), new THREE.MeshBasicMaterial({ map: sketchT, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide }));
    const hinge = new THREE.Group();
    hinge.add(leaf);
    let frame, base;
    if (R.side === 'left') {
      frame = decal(frameC, FW, { x: -WID / 2 + 0.02, y: FH / 2, z: R.z, ry: Math.PI / 2 });
      base = Math.PI / 2; hinge.position.set(-WID / 2 + 0.045, 0, R.z + OW / 2);
    } else if (R.side === 'right') {
      frame = decal(frameC, FW, { x: WID / 2 - 0.02, y: FH / 2, z: R.z, ry: -Math.PI / 2 });
      base = -Math.PI / 2; hinge.position.set(WID / 2 - 0.045, 0, R.z - OW / 2);
    } else {
      frame = decal(frameC, FW, { y: FH / 2, z: ZEND + 0.02 });
      base = 0; hinge.position.set(-OW / 2, 0, ZEND + 0.045);
    }
    hinge.rotation.y = base;
    scene.add(hinge);
    const d = { id, hinge, leaf, frame, base, ang: 0, open: false, painted: false, sketchT, paintT };
    [frame, leaf].forEach((m) => { m.userData = { door: d, noScale: true }; clickable(m, R.hidden ? '???' : `Enter: ${R.name}`, () => enterRoom(id)); });
    doors[id] = d;
  }
  function approach(id) {
    const R = ROOMS[id];
    if (R.side === 'left') return { x: -0.5, z: R.z, yaw: Math.PI / 2, ix: -WID / 2 + 0.35, iz: R.z };
    if (R.side === 'right') return { x: 0.5, z: R.z, yaw: -Math.PI / 2, ix: WID / 2 - 0.35, iz: R.z };
    return { x: 0, z: ZEND + 3.4, yaw: 0, ix: 0, iz: ZEND + 0.45 };
  }

  function buildCorridor() {
    scene = corridor = makeScene('#efeee9', 7, 31);
    const zc = START - LEN / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WID, LEN), new THREE.MeshBasicMaterial({ map: tex(drawFloor(), [1, LEN / 6]) }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, zc); scene.add(floor);
    floor.receiveShadow = true;
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(LEN, HEI), new THREE.MeshBasicMaterial({ map: tex(drawWall(), [LEN / 8, 1]) }));
    lw.rotation.y = Math.PI / 2; lw.position.set(-WID / 2, HEI / 2, zc); scene.add(lw);
    const rw = lw.clone(); rw.rotation.y = -Math.PI / 2; rw.position.x = WID / 2; scene.add(rw);
    lw.receiveShadow = rw.receiveShadow = true;
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(WID, LEN), new THREE.MeshBasicMaterial({ map: tex(drawCeiling(), [WID / 4, LEN / 4]) }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HEI, zc); scene.add(ceil);
    const end = new THREE.Mesh(new THREE.PlaneGeometry(WID, HEI), new THREE.MeshBasicMaterial({ map: tex(drawWall(), [1, 1]) }));
    end.position.set(0, HEI / 2, ZEND); scene.add(end);
    end.receiveShadow = true;
    const lamp = drawLamp();
    for (let z = 0; z > ZEND + 4; z -= 8) { const l = decal(lamp, 1.6, { y: HEI - 0.01, z }); l.rotation.x = Math.PI / 2; }

    // hello
    ink(caster(decal(drawLogo(), 4.6, { y: 2.55, z: -4.6 })));
    ink(decal(drawSub(), 3.2, { y: 1.72, z: -4.55 }));
    bot = new THREE.Group();
    const body = caster(decal(drawBot(), 0.95, { y: 0.74, z: 0 }));
    scene.remove(body); bot.add(body);
    const armM = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.69).translate(0, 0.33, 0), new THREE.MeshBasicMaterial({ map: tex(drawArm()), transparent: true, alphaTest: 0.02 }));
    caster(armM);
    arm = new THREE.Group(); arm.add(armM); arm.position.set(0.24, 0.92, 0.01); bot.add(arm);
    bot.position.set(1.55, 0, -3.6);
    scene.add(bot);
    clickable(body, 'Say hi (or type to chat)', () => { Sound.scribble(); setBubble('hi! pick a door ↓', 2600); });
    bubble = decal(drawBubble('hi! pick a door ↓'), 1.4, { x: 2.15, y: 1.85, z: -3.55 });
    bubble.visible = false;
    caster(decal(drawBall(), 0.38, { x: -1.9, y: 0.16, z: -2.4 }));
    decal(drawSign('PICK A DOOR'), 1.7, { y: HEI - 0.31, z: -8.2 });

    // the torch: a spotlight carried by the visitor, plus a faint moonlight ambient; only on when the lights are out
    torchL = new THREE.SpotLight(0xfff1d6, 42, 0, 0.17, 0.55, 2);
    torchL.castShadow = true;
    torchL.shadow.mapSize.set(1024, 1024);
    torchL.shadow.bias = -0.0015;
    torchL.shadow.camera.near = 0.1;
    spillL = new THREE.SpotLight(0xffe0ad, 7, 0, 0.45, 1, 2);
    spillL.target = torchL.target;
    moon = new THREE.AmbientLight(0x9fb0ff, 0.07);
    fillL = new THREE.PointLight(0xfff0dc, 1.4, 2, 2);
    torchL.visible = spillL.visible = moon.visible = fillL.visible = false;
    scene.add(torchL, spillL, torchL.target, moon, fillL);
    buildTorch();

    // the doors, with little things between them
    Object.keys(ROOMS).forEach(makeDoor);
    onRight(-9.5, 1.8, 1.4, drawDeco('loop'), 0.02);
    clickable(onLeft(-13, 1.8, 1.4, drawDeco('coffee'), -0.02), 'Coffee?', coffee);
    onRight(-16.5, 1.8, 1.4, drawDeco('idea'), 0.015);
    caster(decal(drawPlant(), 0.9, { x: 2.35, y: 0.78, z: -11.4 }));
    caster(decal(drawBooks(), 1.0, { x: -2.3, y: 0.38, z: -18.6 }));
    caster(decal(drawBall(), 0.32, { x: 1.2, y: 0.14, z: -19.2 }));
    caster(decal(drawPlant(), 0.85, { x: 2.4, y: 0.74, z: -27.5 }));
    caster(decal(drawBall(), 0.34, { x: 1.6, y: 0.15, z: -29.5 }));
    plane = buildPlane();
    plane.position.set(0.5, 3.0, -14);
    scene.add(plane);
    clickable(plane.userData.body, 'Throw it', fly);
    swOnT = tex(drawSwitch(true)); swOffT = tex(drawSwitch(false));
    sw = onLeft(-1.5, 1.35, 0.3, drawSwitch(true));
    sw.material.map = swOnT;
    clickable(sw, 'Lights', lights);
    clickable(decal(drawResume(), 0.95, { x: -1.95, y: 1.65, z: ZEND + 0.03 }), 'Open resume', () => window.open('../UdayResume.pdf?v=2026-11', '_blank', 'noopener'));
    ink(decal(drawEndDoodle(), 1.6, { x: 1.95, y: 2.0, z: ZEND + 0.03 }));
  }

  function buildRoom(id) {
    const R = ROOMS[id], RW = R.w || 16;
    scene = R.scene = makeScene(R.wall, 7, 24);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD + 3), new THREE.MeshBasicMaterial({ map: tex(drawFloor(), [RW / 6, (RD + 3) / 6]) }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (3 - RD) / 2); scene.add(floor);
    const wt = drawWall(R.wall);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), new THREE.MeshBasicMaterial({ map: tex(wt, [RW / 8, 1]) }));
    back.position.set(0, RH / 2, -RD); scene.add(back);
    [-1, 1].forEach((sd) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(RD + 3, RH), new THREE.MeshBasicMaterial({ map: tex(wt, [(RD + 3) / 8, 1]) }));
      w.rotation.y = -sd * Math.PI / 2; w.position.set(sd * RW / 2, RH / 2, (3 - RD) / 2); scene.add(w);
    });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD + 3), new THREE.MeshBasicMaterial({ map: tex(drawCeiling(), [RW / 4, (RD + 3) / 4]) }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, RH, (3 - RD) / 2); scene.add(ceil);
    const lamp = drawLamp();
    for (let x = -RW / 2 + 3.5; x < RW / 2 - 2; x += 4.5) { const l = decal(lamp, 1.6, { x, y: RH - 0.01, z: -1.6 }); l.rotation.x = Math.PI / 2; }
    ROOM_BUILD[id]();
  }

  const ROOM_BUILD = {
    about() {
      onBack(-5.3, 1.95, 2.3, drawAboutCard());
      const xs = STORY.map((_, i) => -2.5 + i * 1.75), sx0 = -3.3, sw = 10.6;
      const str = onBack(sx0 + sw / 2, 3.08, sw, drawString(xs.map((x) => ((x - sx0) / sw) * 2400)));
      str.userData.noScale = true;
      clickable(str, 'Pluck the string', () => pluck(-1));
      STORY.forEach((d, i) => {
        const m = onBack(xs[i], 1.95, 1.4, drawNote(i, d), 0.01, (((i * 7) % 5) - 2) * 0.02);
        const h = m.geometry.parameters.height;
        m.geometry.translate(0, -h / 2 + 0.04, 0);
        m.position.y += h / 2 - 0.04;
        m.userData.noScale = true;
        clickable(m, 'Pluck', () => pluck(i));
        notes.push({ m, rz: m.rotation.z, a: 0, w: 0 });
      });
      decal(drawBooks(), 1.0, { x: -3.2, y: 0.38, z: -3.4 });
      decal(drawPlant(), 0.9, { x: 7.1, y: 0.78, z: -4.0 });
      decal(drawBall(), 0.34, { x: 2.4, y: 0.15, z: -2.2 });
    },
    experience() {
      board(onBack(-1.6, 1.95, 4.2, drawJobCard()), 'Read', () => page('experience'));
      onBack(-6.2, 2.15, 1.25, drawBadge(), 0, 0.05);
      [['161', 'REST API routes', C.note], ['33', 'data models', '#d8ecf9'], ['61', 'Next.js pages', '#dff1d5'], ['194', 'commits', '#f9dbd3']].forEach(([n, l, col], i) => {
        onBack(3.4 + (i % 2) * 1.75, 2.75 - Math.floor(i / 2) * 1.6, 1.45, drawStat(n, l, col), 0, (((i * 5) % 3) - 1) * 0.05);
      });
      decal(drawPlant(), 0.9, { x: 7.3, y: 0.78, z: -4.2 });
      decal(drawBooks(), 1.0, { x: -4.2, y: 0.38, z: -3.4 });
    },
    achievements() {
      const A = [['Top 5% of the cohort', 'B.Tech CSE, CGPA 9.05', 'top', 'ach:top5'], ['300+ DSA problems', 'LeetCode, Codeforces, GfG', 'dsa', 'ach:dsa'], ['GSSoC 2025', '3 merged PRs', 'oss', 'ach:gssoc'], ['Smart India Hackathon', 'built a College ERP', 'sih', 'ach:sih'], ['Quiz lead coordinator', 'led 5 volunteers', 'quiz', 'ach:quiz']];
      A.forEach(([t, sub, ic, pg], i) => {
        const x = -5.8 + i * 2.9;
        onBack(x, 3.75, 1.7, drawSpot(), 0.005);
        board(onBack(x, 1.85, 2.0, drawPlaque(t, sub, ic), 0.015), 'Read', () => page(pg));
      });
      decal(drawPlant(), 0.9, { x: -7.4, y: 0.78, z: -4.2 });
    },
    projects() {
      const P = [['rag', 'Medical RAG Chatbot', 'rag'], ['code', 'CodeBlitz', 'code']];
      P.forEach(([k, t, pg], i) => {
        const x = -2.9 + i * 5.8;
        onBack(x, 3.6, 2.0, drawSpot(), 0.005);
        board(onBack(x, 1.75, 2.6, drawFrame(k, t), 0.015), 'Inspect', () => page(pg));
      });
      board(onBack(7.2, 1.9, 0.95, drawGitNote(), 0.015, 0.06), 'Open GitHub', () => window.open('https://github.com/ud-ai', '_blank', 'noopener'));
      decal(drawPlant(), 0.9, { x: -7.2, y: 0.78, z: -4.2 });
    },
    skills() {
      const HUES = ['#ffd28a', '#9fd3ff', '#ffb3a1', '#c7f0a8', '#e4c3ff', '#ffe58a', '#a8f0e0'];
      // a compact 4 x 2 wall: seven category boards plus the certificates
      const cell = (i) => [-3.4 + (i % 4) * 2.27, i < 4 ? 3.02 : 1.24];
      SKILLS.forEach(([t, items], i) => { const [x, y] = cell(i); board(onBack(x, y, 2.05, drawBoard(t, items, HUES[i])), `Read: ${t}`, () => page(`skill:${t}`)); });
      { const [x, y] = cell(7); board(onBack(x, y, 2.05, drawCork()), 'Read', () => page('certs')); }
      const LIST = ['Python', 'Java', 'Kotlin', 'TypeScript', 'C++', 'SQL', 'React', 'Next.js', 'Node.js', 'LangChain', 'LLMs', 'RAG', 'FAISS', 'Gemini API', 'Docker', 'Kubernetes', 'Kafka', 'PostgreSQL', 'MongoDB', 'Redis'];
      const catOf = (l) => (SKILLS.find(([, a]) => a.some((x) => x === l || x.startsWith(l) || x.endsWith(l))) || ['Skills'])[0];
      const COLS = ['#f6b8a8', '#a9cdf2', '#bfe3b4', '#f7e19a', '#d6c1f0', '#f5c6dd'];
      const g = rand(77);
      LIST.forEach((label, i) => {
        const cat = catOf(label);
        // balloons float in two clusters either side of the boards
        const side = i % 2 ? 1 : -1, col = Math.floor(i / 2) % 3, row = Math.floor(i / 6);
        const x = side * (5.35 + col * 0.85) + (g() - 0.5) * 0.25;
        const y = 1.35 + row * 0.72 + (col % 2) * 0.32 + (g() - 0.5) * 0.15;
        const m = decal(drawBalloon(label, COLS[i % COLS.length]), 0.6, { x, y, z: -2.9 - g() * 1.4 });
        const b = { m, x, y, label, cat, col: COLS[i % COLS.length], ph: g() * 6.28, popped: 0, rise: 0, s: 1 };
        m.userData.noScale = true;
        clickable(m, `Pop: ${label}`, () => popBalloon(b));
        balloons.push(b);
      });
      const gm = decal(drawBalloon('Hire me', '#f2c94c'), 0.78, { x: -13, y: 3.0, z: -2.3 });
      gm.visible = false;
      gm.userData.noScale = true;
      clickable(gm, '★', () => {});
      gold.m = gm;
    },
    lab() {
      board(onBack(0, 2.0, 5.4, drawEggBoard()), 'Read the hints', () => page('eggs'));
      onBack(-5.6, 2.1, 1.5, drawNote(2, { year: 'shh…', title: 'You found the egg room', body: 'Some secrets hide outside, some in the corridor, some in the rooms.' }), 0, 0.04);
      decal(drawBox(), 1.2, { x: 5.9, y: 0.48, z: -3.6 });
      decal(drawPlant(), 0.9, { x: -7.3, y: 0.78, z: -4.2 });
      decal(drawBall(), 0.34, { x: 2.6, y: 0.15, z: -2.0 });
    },
    contact() {
      board(onBack(0, 1.75, 2.4, drawLetter()), 'Write to me', () => page('contact'));
      onBack(0, 3.78, 1.5, drawEndDoodle());
      board(onBack(-3.6, 1.9, 1.6, drawLinkCard('LinkedIn', '#0a66c2', 'in', '/in/uday-kant')), 'Open LinkedIn', () => link('https://www.linkedin.com/in/uday-kant-61a242298/'));
      board(onBack(-6.1, 1.9, 1.6, drawLinkCard('GitHub', '#24292f', '</>', '@ud-ai')), 'Open GitHub', () => link('https://github.com/ud-ai'));
      board(onBack(3.6, 1.9, 1.6, drawLinkCard('Email', '#f0632a', '@', 'udaykant180@gmail.com')), 'Send an email', () => { unlock('social'); location.href = 'mailto:udaykant180@gmail.com?subject=Hello%20Uday'; });
      board(onBack(6.1, 1.85, 1.15, drawResume()), 'Open resume', () => link('../UdayResume.pdf?v=2026-11'));
      decal(drawPlant(), 0.9, { x: -7.3, y: 0.78, z: -4.2 });
    },
  };

  function build() {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    camera = new THREE.PerspectiveCamera(innerWidth < 640 ? 74 : 62, innerWidth / innerHeight, 0.05, 120);
    camera.position.set(0, 1.6, Z0);
    buildCorridor();
    Object.keys(ROOMS).forEach(buildRoom);
    view = corridor;
  }

  /* ---------- moving between the corridor and the rooms ---------- */
  const tween = (dur, fn) => new Promise((res) => tweens.push({ t0: performance.now(), dur: reduce ? 1 : dur, fn, res }));
  const fade = (on) => { fadeEl.classList.toggle('is-on', on); return sleep(reduce ? 30 : 460); };
  const panMax = () => Math.max(0, ((here && ROOMS[here].w) || 16) / 2 - 0.35 - Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * (RD + CAMZ));
  const quiet = () => { hovered = null; cv.classList.remove('is-hover'); showTip(''); $$('.panel').forEach((x) => (x.hidden = true)); };

  async function enterRoom(id, walk = true) {
    if (mode === 'trans' || mode === 'off' || (mode === 'room' && here === id)) return;
    const R = ROOMS[id], d = doors[id];
    mode = 'trans';
    quiet();
    if (walk && view === corridor) {
      const a = approach(id), from = { x: camera.position.x, z: camera.position.z, yaw, pitch };
      d.open = true;
      Sound.creak();
      await tween(950, (k) => {
        const e = easeIO(k);
        camera.position.x = lerp(from.x, a.x, e);
        camera.position.z = lerp(from.z, a.z, e);
        yaw = lerp(from.yaw, a.yaw, e);
        pitch = lerp(from.pitch, 0, e);
      });
      Sound.step();
      fade(true);
      await tween(650, (k) => { const e = easeIO(k); camera.position.x = lerp(a.x, a.ix, e); camera.position.z = lerp(a.z, a.iz, e); });
    } else await fade(true);
    Object.values(doors).forEach((x) => { x.open = false; x.ang = 0; });
    view = R.scene; here = id; rt = rp = 0; yaw = pitch = 0;
    camera.position.set(-panMax(), 1.6, CAMZ);
    mode = 'room';
    backBtn.hidden = false;
    tear(backBtn);
    playBtn.hidden = id !== 'skills';
    if (id === 'skills') tear(playBtn);
    if (!roomHint && panMax() > 0.3) { roomHint = true; hint.innerHTML = 'scroll to look around <span>→</span>'; hint.hidden = false; }
    fade(false);
    torch.hidden = true;
    toast(R.name, R.hint);
    if (id === 'lab') setTimeout(() => unlock('labrat'), 1600);
  }

  async function focusOn(mesh, fn) {
    if (mode !== 'room') return;
    mode = 'trans';
    quiet();
    const p = mesh.position, { width: w, height: h } = mesh.geometry.parameters;
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((h * 0.62) / tv, (w * 0.62) / (tv * camera.aspect), 0.9);
    const from = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw, pitch };
    Sound.step();
    setTimeout(() => Sound.step(), 380);
    await tween(950, (k) => {
      const e = easeIO(k);
      camera.position.set(lerp(from.x, p.x, e), lerp(from.y, p.y, e) + (reduce ? 0 : Math.sin(e * Math.PI * 3) * 0.02), lerp(from.z, p.z + dist, e));
      yaw = lerp(from.yaw, 0, e);
      pitch = lerp(from.pitch, 0, e);
    });
    mode = 'focus';
    afterModal = unfocus;
    fn();
    if (modal.hidden) { afterModal = null; await sleep(700); unfocus(); }
  }
  async function unfocus() {
    if (mode !== 'focus') return;
    mode = 'trans';
    const from = { x: camera.position.x, y: camera.position.y, z: camera.position.z }, pm = panMax(), x = lerp(-pm, pm, rp);
    await tween(800, (k) => { const e = easeIO(k); camera.position.set(lerp(from.x, x, e), lerp(from.y, 1.6, e), lerp(from.z, CAMZ, e)); });
    mode = 'room';
  }

  async function leave(toStart = false) {
    if (mode !== 'room') return;
    endGame(false);
    if (tt) endType(false);
    torch.hidden = !dark;
    playBtn.hidden = true;
    mode = 'trans';
    quiet();
    await fade(true);
    const id = here;
    here = null; view = corridor; backBtn.hidden = true; hint.hidden = true;
    if (toStart) {
      prog = target = 0; yaw = pitch = 0;
      camera.position.set(0, 1.6, Z0);
      fade(false);
      mode = 'corridor';
      return;
    }
    const a = approach(id), d = doors[id], zc = clamp(a.z, Z1, Z0);
    d.open = true; d.ang = 1.35;
    camera.position.set(a.x, 1.6, a.z);
    yaw = a.yaw; pitch = 0;
    prog = target = (Z0 - zc) / (Z0 - Z1);
    fade(false);
    await sleep(reduce ? 0 : 300);
    d.open = false;
    Sound.creak();
    await tween(900, (k) => { const e = easeIO(k); camera.position.x = lerp(a.x, 0, e); camera.position.z = lerp(a.z, zc, e); yaw = lerp(a.yaw, 0, e); });
    mode = 'corridor';
  }

  /* ---------- input ---------- */
  function nudge(d) {
    if (!modal.hidden) return;
    if (mode === 'corridor') target = clamp(target + d * (caff() ? 2 : 1));
    else if (mode === 'room') rt = clamp(rt + d * 1.6);
  }
  window.addEventListener('wheel', (e) => { const k = e.deltaMode === 1 ? 32 : 1; nudge((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * k * 0.00042); }, { passive: true });
  window.addEventListener('touchstart', (e) => { touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!touch) return;
    const x = e.touches[0].clientX, y = e.touches[0].clientY, dx = touch[0] - x, dy = touch[1] - y;
    nudge((mode === 'room' && Math.abs(dx) > Math.abs(dy) ? dx : dy) * 0.0007);
    touch = [x, y];
  }, { passive: true });
  window.addEventListener('touchend', () => (touch = null));
  window.addEventListener('keydown', (e) => {
    if (mode === 'off' || !modal.hidden) return;
    if (tt) { if (typeKey(e)) e.preventDefault(); return; }
    if (botKey(e)) { e.preventDefault(); return; }
    if (mode === 'room' && here === 'skills' && !game && (e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); startType(); return; }
    if (e.key === 'Escape' && game) { endGame(); return; }
    if (e.key === 'Escape' && mode === 'room') { leave(); return; }
    const k = { ArrowDown: 0.04, ArrowRight: 0.04, PageDown: 0.12, ' ': 0.08, ArrowUp: -0.04, ArrowLeft: -0.04, PageUp: -0.12, Home: -1, End: 1 }[e.key];
    if (k !== undefined && document.activeElement === document.body) { e.preventDefault(); nudge(k); }
  }, true);
  let tipAt = [0, 0];
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    tipAt = [e.clientX, e.clientY];
  });
  cv.addEventListener('click', (e) => {
    if (game && mode === 'room') { Sound.wake(); shoot(e.clientX, e.clientY); return; }
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const h = pick();
    if (h && (mode === 'corridor' || mode === 'room')) { Sound.wake(); h.userData.fn(); }
  });
  backBtn.addEventListener('click', () => { Sound.wake(); leave(); });

  /* ---------- pop-gun mini game in the skills room ---------- */
  const playBtn = $('.play-btn'), bar = $('.gamebar'), gunEl = $('.gun'), gunImg = $('.gun img');
  const ROUND = 30000;
  let game = null, best = 0, lastSec = -1, lastT = 0;
  try { best = +localStorage.getItem('uk-sketch-best') || 0; } catch (e) { /* storage blocked */ }
  function popBalloon(b) {
    if (b.popped) return false;
    b.popped = performance.now();
    Sound.pop();
    unlock('polyglot');
    if (game) game.score++;
    else toast(b.label, `${b.cat}. Pop!`);
    return true;
  }
  function startGame() {
    if (mode !== 'room' || here !== 'skills' || game) return;
    if (!gunImg.src) gunImg.src = drawGun().toDataURL();
    game = { t0: performance.now(), score: 0, shots: 0, golden: false };
    gold.next = performance.now() + 5000 + Math.random() * 4000;
    lastSec = -1;
    playBtn.querySelector('span').textContent = 'STOP';
    $('.gb-best', bar).textContent = best;
    bar.hidden = false; tear(bar);
    gunEl.hidden = false;
    cv.classList.add('is-aim');
    hint.hidden = true;
    quiet();
    Sound.chime();
    toast('Shooting range', 'Click (or tap) to fire. Hit as many skill balloons as you can in 30 seconds.');
  }
  function endGame(show = true) {
    if (!game) return;
    const g = game;
    game = null;
    playBtn.querySelector('span').textContent = 'PLAY';
    bar.hidden = true;
    gunEl.hidden = true;
    cv.classList.remove('is-aim');
    if (!show) return;
    const rec = g.score > best;
    if (rec) { best = g.score; try { localStorage.setItem('uk-sketch-best', String(best)); } catch (e) { /* storage blocked */ } }
    Sound.chime();
    toast(rec ? 'New best!' : 'Round over', `${g.score} hits from ${g.shots} shots · best ${best}`, { done: rec });
    if (g.score >= 10) setTimeout(() => unlock('sharp'), 3000);
    if (g.golden) setTimeout(() => { toast('Golden ticket!', 'You hit the hire-me balloon. Let’s talk!'); page('contact'); }, 1800);
  }
  // the gun is a small rigid body on springs: it swings to the aim with a little overshoot,
  // takes a kick back and a muzzle climb when fired, and sways while idle
  const G = { tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, tt: 0, t: 0, vt: 0, kick: 0, kv: 0, pitch: 0, pv: 0 };
  const parts = [];
  function aim(x, y) {
    G.tx = clamp((x - innerWidth / 2) * 0.32, -innerWidth * 0.3, innerWidth * 0.3);
    G.ty = clamp((y - innerHeight * 0.45) * 0.14, -50, 40);
    G.tt = clamp((x - innerWidth / 2) / innerWidth, -0.5, 0.5) * 0.3;
  }
  function gunBox() { return gunImg.getBoundingClientRect(); }
  function muzzle() { const r = gunBox(); return [r.left + r.width * 0.5, r.top + r.height * 0.09]; }
  function gunStep(dt, t) {
    const sp = (pos, vel, goal, k, d) => vel + (k * (goal - pos) - d * vel) * dt;
    G.vx = sp(G.x, G.vx, G.tx, 90, 15); G.x += G.vx * dt;
    G.vy = sp(G.y, G.vy, G.ty, 90, 15); G.y += G.vy * dt;
    G.vt = sp(G.t, G.vt, G.tt, 110, 16); G.t += G.vt * dt;
    G.kv = sp(G.kick, G.kv, 0, 260, 22); G.kick += G.kv * dt;
    G.pv = sp(G.pitch, G.pv, 0, 170, 17); G.pitch += G.pv * dt;
    const sway = reduce ? 0 : Math.sin(t * 1.3) * 3;
    const bob = reduce ? 0 : Math.sin(t * 2.1) * 2;
    gunImg.style.transform = `translate(${(G.x + sway).toFixed(1)}px, ${(G.y + bob + G.kick * 0.55).toFixed(1)}px) rotate(${(G.t + G.vx * 0.00012).toFixed(4)}rad) rotateX(${(-G.pitch).toFixed(2)}deg) scale(${(1 - G.kick * 0.0016).toFixed(4)})`;
  }
  // free particles: brass casings bounce and roll on the floor, balloon shreds tumble and fall
  function spawn(cls, x, y, vx, vy, va, o = {}) {
    const el = document.createElement('i');
    el.className = cls;
    if (o.color) el.style.background = o.color;
    document.body.appendChild(el);
    parts.push({ el, x, y, vx, vy, a: Math.random() * 6.28, va, life: 0, max: o.max || 2.4, drag: o.drag || 0.2, bounce: o.bounce ?? 0.42, floor: o.floor !== false, rest: false });
  }
  function partStep(dt) {
    const floorY = innerHeight - 22;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      p.vy += 2300 * dt;
      p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      if (p.floor && p.y > floorY) {
        p.y = floorY;
        if (Math.abs(p.vy) > 120) {
          p.vy = -p.vy * p.bounce; p.vx *= 0.72; p.va = p.va * -0.5 + p.vx * 0.02;
          if (p.el.className === 'shell') tinkle();
        } else { p.vy = 0; p.vx *= 1 - 3.2 * dt; p.va = p.vx / 5; }
      }
      const fade = clamp((p.max - p.life) / 0.5);
      p.el.style.opacity = fade;
      p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.a.toFixed(3)}rad)`;
      if (p.life > p.max || p.x < -60 || p.x > innerWidth + 60 || (!p.floor && p.y > innerHeight + 60)) { p.el.remove(); parts.splice(i, 1); }
    }
  }
  let lastTink = 0;
  function tinkle() {
    const n = performance.now();
    if (n - lastTink < 60) return;
    lastTink = n;
    Sound.tink();
  }
  function mark(x, y, text, hit) {
    const el = document.createElement('b');
    el.className = `mark${hit ? ' is-hit' : ''}`;
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
  function shoot(x, y) {
    game.shots++;
    aim(x, y);
    Sound.shot();
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    const h = pick(), b = h && balloons.find((q) => q.m === h);
    const [sx, sy] = muzzle();
    fx('flash', sx, sy, 90, `rotate(${Math.PI / 2 + G.t}rad) scale(${0.9 + Math.random() * 0.4})`);
    const len = Math.hypot(x - sx, y - sy), ang = Math.atan2(y - sy, x - sx);
    const tr = fx('tracer', sx, sy, 90, `rotate(${ang}rad)`);
    tr.style.width = len + 'px';
    // recoil impulse: back along the barrel, muzzle climbs
    if (!reduce) { G.kv += 420; G.pv += 260 + Math.random() * 60; G.vx += (Math.random() - 0.5) * 160; G.vy -= 380; }
    // casing leaves the ejection port, up and away from the barrel
    if (!reduce) {
      const r = gunBox(), ex = r.left + r.width * 0.6, ey = r.top + r.height * 0.28;
      spawn('shell', ex, ey, 260 + Math.random() * 200, -(520 + Math.random() * 220), (Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 10), { max: 2.6, drag: 0.1 });
    }
    if (h && gold.on && h === gold.m) goldHit(x, y);
    else if (b && popBalloon(b)) {
      mark(x, y, '+1', true);
      if (!reduce) for (let i = 0; i < 9; i++) {
        const a = Math.random() * 6.28, sp = 180 + Math.random() * 380;
        spawn('shred', x, y, Math.cos(a) * sp, Math.sin(a) * sp - 220, (Math.random() - 0.5) * 30, { color: b.col, max: 1.1, drag: 2.4, floor: false });
      }
    } else fx('hole', x, y, 1400, `rotate(${Math.random() * 360}deg)`);
  }
  function fx(cls, x, y, ms, extra = '') {
    const el = document.createElement('i');
    el.className = cls;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    if (extra) el.style.transform = extra;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
    return el;
  }
  playBtn.addEventListener('click', () => { Sound.wake(); game ? endGame() : startGame(); });
  window.addEventListener('pointermove', (e) => { if (game) aim(e.clientX, e.clientY); });

  // menu jumps walk the real route: out through the door, along the corridor, in through the next door
  async function walk(to) {
    const from = prog, dz = Math.abs(to - from) * (Z0 - Z1), fy = yaw, fp = pitch;
    if (dz < 0.05) return;
    mode = 'trans';
    await tween(500 + dz * 75, (k) => {
      const e = easeIO(k);
      prog = lerp(from, to, e);
      const z = lerp(Z0, Z1, prog);
      lastStep += Math.abs(z - camera.position.z);
      if (lastStep > 1.1) { lastStep = 0; Sound.step(); }
      camera.position.set(0, 1.6 + (reduce ? 0 : Math.sin(z * 2.4) * 0.025), z);
      yaw = lerp(fy, 0, Math.min(1, e * 3));
      pitch = lerp(fp, 0, Math.min(1, e * 3));
    });
    target = prog = to;
    mode = 'corridor';
  }
  async function go(id) {
    $$('.panel').forEach((x) => (x.hidden = true));
    if (mode === 'off' || mode === 'trans' || mode === 'focus') return;
    if (mode === 'room') { if (here === id) return; await leave(); }
    if (mode !== 'corridor') return;
    hint.hidden = true;
    if (id === 'hello') { await walk(0); return; }
    const a = approach(id), zc = clamp(a.z, Z1, Z0);
    await walk((Z0 - zc) / (Z0 - Z1));
    enterRoom(id);
  }
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

  function pick() {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(view.userData.hits, false).filter((x) => x.object.visible);
    return hits.length && hits[0].distance < 11 ? hits[0].object : null;
  }

  /* ---------- the frame loop ---------- */
  function loop(now) {
    requestAnimationFrame(loop);
    if (mode === 'off') return;
    const t = now / 1000;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i], k = clamp((now - w.t0) / w.dur);
      w.fn(k);
      if (k >= 1) { tweens.splice(i, 1); w.res(); }
    }
    if (mode === 'corridor') {
      prog += (target - prog) * (reduce ? 1 : 0.075);
      const z = lerp(Z0, Z1, prog);
      lastStep += Math.abs(z - camera.position.z);
      camera.position.set(0, 1.6 + (reduce ? 0 : Math.sin(z * 2.4) * 0.025), z);
      if (prog > 0.06) { unlock('wanderer'); hint.hidden = true; }
    } else if (mode === 'room') {
      rp += (rt - rp) * (reduce ? 1 : 0.075);
      const pm = panMax(), x = lerp(-pm, pm, rp);
      lastStep += Math.abs(x - camera.position.x);
      camera.position.set(x, 1.6 + (reduce ? 0 : Math.sin(x * 2.4) * 0.02), CAMZ);
      if (rt > 0.05) hint.hidden = true;
      if (here === 'about' && (rp > 0.9 || pm < 0.3)) unlock('historian');
    }
    if (mode === 'corridor' || mode === 'room') {
      yaw += (-mx * 0.32 - yaw) * 0.05;
      pitch += (-my * 0.14 - pitch) * 0.05;
    }
    if (lastStep > (caff() ? 0.6 : 1.1)) { lastStep = 0; Sound.step(); }
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    // hover
    const h = mode === 'corridor' || mode === 'room' ? pick() : null;
    if (h !== hovered) {
      hovered = h;
      cv.classList.toggle('is-hover', !!h);
      if (h) Sound.scribble();
    }
    showTip(hovered && modal.hidden && !game ? hovered.userData.label : '', tipAt[0], tipAt[1]);
    if (game) {
      const left = Math.max(0, ROUND - (now - game.t0)), sec = Math.ceil(left / 1000);
      if (sec !== lastSec) { lastSec = sec; $('.gb-time', bar).textContent = sec; bar.classList.toggle('is-low', sec <= 5); if (sec <= 5 && sec > 0) Sound.scribble(); }
      $('.gb-score', bar).textContent = game.score;
      if (left <= 0) endGame();
    }
    view.userData.hits.forEach((m) => {
      if (m.userData.noScale) return;
      m.userData.s += ((m === hovered ? 1.05 : 1) - m.userData.s) * 0.15;
      m.scale.setScalar(m.userData.s);
    });

    const dt = Math.min(0.033, (now - (lastT || now)) / 1000);
    lastT = now;
    if (view === corridor) {
      arm.rotation.z = reduce ? -0.4 : -0.4 + Math.sin(t * 5) * 0.35;
      bot.position.y = reduce ? 0 : Math.sin(t * 1.8) * 0.02;
      planeStep(t, dt);
      if (bubble.visible && now > bubble.userData.until) bubble.visible = false;
      Object.values(doors).forEach((d) => {
        const hov = hovered && hovered.userData.door === d;
        d.ang += ((d.open ? 1.35 : hov ? 0.2 : 0) - d.ang) * (reduce ? 1 : 0.1);
        d.hinge.rotation.y = d.base - d.ang;
        const paint = d.open || hov;
        if (paint !== d.painted) {
          d.painted = paint;
          const t = paint ? d.paintT : d.sketchT;
          [d.leaf.material, d.leaf.userData.basic, d.leaf.userData.lit].forEach((m) => { if (!m) return; m.map = t; if (m.emissiveMap) m.emissiveMap = t; });
        }
      });
    } else if (here === 'skills') {
      balloons.forEach((b) => {
        const m = b.m;
        if (b.popped) {
          const k = (now - b.popped) / 200;
          if (k < 1) { m.scale.setScalar(1 + k * 0.5); m.material.opacity = 1 - k; }
          else if (now - b.popped > (game ? 900 : 4000)) { b.popped = 0; b.rise = now; m.visible = true; m.material.opacity = 1; m.scale.setScalar(1); }
          else m.visible = false;
          return;
        }
        const r = b.rise ? clamp((now - b.rise) / 1600) : 1;
        const amp = game && !reduce ? 0.9 : 0.06, sp = game ? 1.1 : 0.5;
        m.position.set(b.x + Math.sin(t * sp + b.ph) * amp, b.y - (1 - ease(r)) * 3.4 + (reduce ? 0 : Math.sin(t * (game ? 1.7 : 0.9) + b.ph) * (game ? 0.3 : 0.1)), m.position.z);
        m.rotation.z = reduce ? 0 : Math.sin(t * 0.7 + b.ph) * 0.07;
        b.s += ((m === hovered ? 1.1 : 1) - b.s) * 0.15;
        m.scale.setScalar(b.s);
      });
    }

    if (game) gunStep(dt, t);
    eggStep(now, t, dt);
    if (parts.length) partStep(dt);
    renderer.render(view, camera);
  }

  /* ---------- easter eggs inside ---------- */
  // coffee: three sips and you walk twice as fast for a while
  let cups = [], caffT = 0;
  const caff = () => performance.now() < caffT;
  function coffee() {
    const n = performance.now();
    cups = cups.filter((x) => n - x < 2200);
    cups.push(n);
    Sound.tick();
    if (cups.length >= 3) { cups = []; caffT = n + 20000; Sound.chime(); toast('Caffeinated!', 'You walk twice as fast for 20 seconds. ☕'); }
    else toast('Coffee?', cups.length === 1 ? 'One sip…' : 'Two sips… one more.');
  }

  // the paper plane is a little glider: gravity, lift that grows with speed and angle of attack, drag,
  // and a nose that pitches toward its trim angle (which gives the gentle rise-and-dip of a real paper plane).
  // It bounces off the walls and ceiling and comes to rest on the corridor floor, where you can pick it up again.
  function buildPlane() {
    const g = new THREE.Group();
    // folded dart: nose along +z, two wings and a keel
    const N = [0, 0, 0.26], L = [-0.17, 0.02, -0.16], R = [0.17, 0.02, -0.16], T = [0, 0, -0.16], K = [0, -0.06, -0.16];
    const pos = new Float32Array([...N, ...L, ...T, ...N, ...T, ...R, ...N, ...T, ...K, ...N, ...K, ...T]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#fbfaf5', side: THREE.DoubleSide }));
    body.castShadow = true;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: '#2a2a2a' }));
    const crease = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...N), new THREE.Vector3(...T)]), new THREE.LineBasicMaterial({ color: '#6b6b6b' }));
    // an invisible, generous hit area so the thin paper is easy to click
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.userData.torch = true;
    g.add(body, edges, crease, hit);
    g.scale.setScalar(1.5);
    g.userData.body = hit;
    return g;
  }
  const PL = { state: 'idle', v: new THREE.Vector3(), th: 0, q: 0, bank: 0, bv: 0, heading: Math.PI, rest: 0 };
  const pdir = new THREE.Vector3(), plook = new THREE.Vector3();
  function fly() {
    if (PL.state === 'fly') return;
    Sound.whoosh();
    // picked up from the floor? lift it back to hand height first
    if (PL.state === 'landed') plane.position.y = 1.5;
    const aimX = clamp(ndc.x, -1, 1) * 0.8;
    PL.v.set(aimX + (Math.random() - 0.5) * 0.4, 0.7 + Math.random() * 0.5, -(5.4 + Math.random() * 1.4));
    PL.th = 0.12; PL.q = 0; PL.bank = 0; PL.bv = (Math.random() - 0.5) * 0.6;
    PL.state = 'fly';
  }
  function planeStep(t, dt) {
    const P = plane.position;
    if (PL.state === 'idle') {
      // circling lazily under the ceiling, waiting to be thrown
      const a = reduce ? 0 : t * 0.45;
      P.set(0.5 + Math.sin(a) * 0.8, 3.0 + (reduce ? 0 : Math.sin(t * 1.2) * 0.08), -14 + Math.cos(a) * 0.8);
      plook.set(P.x + Math.cos(a), P.y, P.z - Math.sin(a));
      plane.lookAt(plook);
      plane.rotateZ(0.25);
      return;
    }
    if (PL.state === 'landed') return;
    const steps = 3, h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const v = PL.v, sp = Math.max(0.01, v.length());
      const horiz = Math.hypot(v.x, v.z), gam = Math.atan2(v.y, horiz);
      const alpha = clamp(PL.th - gam, -0.6, 0.6);
      // lift acts perpendicular to the flight path, in the vertical plane of travel
      const lift = 3.0 * sp * sp * alpha, drag = 0.3 * sp * sp * (0.05 + alpha * alpha * 1.3);
      const hx = horiz > 1e-4 ? v.x / horiz : 0, hz = horiz > 1e-4 ? v.z / horiz : -1;
      const ux = -Math.sin(gam) * hx, uy = Math.cos(gam), uz = -Math.sin(gam) * hz;
      // a banked wing turns the plane sideways
      const sideX = -hz, sideZ = hx;
      v.x += (lift * (ux * Math.cos(PL.bank)) + lift * Math.sin(PL.bank) * sideX * 0.6 - drag * v.x / sp) * h;
      v.y += (lift * uy * Math.cos(PL.bank) - 9.8 - drag * v.y / sp) * h;
      v.z += (lift * (uz * Math.cos(PL.bank)) + lift * Math.sin(PL.bank) * sideZ * 0.6 - drag * v.z / sp) * h;
      // pitch: the nose weathervanes toward a small trim angle of attack, lightly damped
      PL.q += (-40 * (alpha - 0.07) - 5 * PL.q) * h;
      PL.th += PL.q * h;
      PL.bv += (-6 * PL.bank - 1.5 * PL.bv) * h;
      PL.bank += PL.bv * h;
      P.addScaledVector(v, h);
      // walls, ceiling and the far wall
      const wx = WID / 2 - 0.25;
      if (Math.abs(P.x) > wx) { P.x = Math.sign(P.x) * wx; v.x *= -0.3; v.z *= 0.7; PL.bv += -Math.sign(P.x) * 2.5; Sound.tick(); }
      if (P.y > HEI - 0.12) { P.y = HEI - 0.12; v.y = -Math.abs(v.y) * 0.3; PL.th = -0.2; Sound.tick(); }
      if (P.z < ZEND + 0.3) { P.z = ZEND + 0.3; v.z = Math.abs(v.z) * 0.2; v.x *= 0.5; PL.th = -0.6; Sound.tick(); }
      if (P.z > START - 0.3) { P.z = START - 0.3; v.z = -Math.abs(v.z) * 0.2; }
      // touchdown: skid along the floor, nose settles flat
      if (P.y < 0.035) {
        P.y = 0.035;
        if (v.y < -0.3) Sound.tick();
        v.y = 0;
        const f = Math.max(0, 1 - 4.5 * h);
        v.x *= f; v.z *= f;
        PL.th += (0 - PL.th) * Math.min(1, 10 * h); PL.q = 0;
        PL.bank += (0 - PL.bank) * Math.min(1, 10 * h); PL.bv = 0;
        if (Math.hypot(v.x, v.z) < 0.05) { PL.state = 'landed'; Sound.rustle(); break; }
      }
    }
    // point the nose along its heading, pitched by its own attitude (not just the velocity), and roll by the bank
    const v = PL.v, horiz = Math.hypot(v.x, v.z);
    if (horiz > 0.02) PL.heading = Math.atan2(v.x, v.z);
    pdir.set(Math.sin(PL.heading) * Math.cos(PL.th), Math.sin(PL.th), Math.cos(PL.heading) * Math.cos(PL.th));
    plook.copy(P).add(pdir);
    plane.lookAt(plook);
    plane.rotateZ(PL.bank);
  }


  // light switch: the corridor goes dark and you carry a torch. Lit materials only exist while it's dark.
  let dark = false, sw = null, swOnT = null, swOffT = null, torchL = null, spillL = null, moon = null, fillL = null, torchG = null, lens = null, beam = null;
  const torch = $('.torch');
  const TA = { lean: 0, lv: 0, dazzleT: 0, flick: 1, roll: 0, rv: 0, init: false };
  const tv = new THREE.Vector3(), tdir = new THREE.Vector3(), tob = new THREE.Vector3();
  const AP = new THREE.Vector3(), AV = new THREE.Vector3(), AT = new THREE.Vector3();
  const GP = new THREE.Vector3(), GV = new THREE.Vector3(), GT = new THREE.Vector3();
  const aimRay = new THREE.Raycaster(), aimNdc = new THREE.Vector2();
  let aimables = [];
  // a real 3D torch: lathe-turned aluminium body, knurled grip, flared head, glowing lens
  function buildTorch() {
    torchG = new THREE.Group();
    const knurl = canvas(64, 256);
    knurl.ctx.fillStyle = '#9aa1aa'; knurl.ctx.fillRect(0, 0, 64, 256);
    knurl.ctx.strokeStyle = 'rgba(20,22,26,0.75)'; knurl.ctx.lineWidth = 1;
    for (let k = -256; k < 320; k += 6) { knurl.ctx.beginPath(); knurl.ctx.moveTo(k, 70); knurl.ctx.lineTo(k + 120, 190); knurl.ctx.stroke(); knurl.ctx.beginPath(); knurl.ctx.moveTo(k + 120, 70); knurl.ctx.lineTo(k, 190); knurl.ctx.stroke(); }
    knurl.ctx.fillStyle = '#5a6068'; knurl.ctx.fillRect(0, 66, 64, 3); knurl.ctx.fillRect(0, 190, 64, 3);
    const kt = new THREE.CanvasTexture(knurl.c);
    kt.wrapS = THREE.RepeatWrapping; kt.repeat.set(4, 1); kt.colorSpace = THREE.SRGBColorSpace;
    const metal = new THREE.MeshStandardMaterial({ color: '#b4bac2', map: kt, metalness: 0.45, roughness: 0.42 });
    // profile from the tail cap (y = 0) to the bezel (y = 0.27), turned around the axis
    const prof = [[0, 0], [0.013, 0], [0.0155, 0.004], [0.0155, 0.03], [0.0145, 0.034], [0.0148, 0.17], [0.017, 0.185], [0.026, 0.235], [0.0275, 0.24], [0.0275, 0.268], [0.024, 0.27]].map(([r, y]) => new THREE.Vector2(r, y));
    const bodyGeo = new THREE.LatheGeometry(prof, 40).rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, metal);
    const lc = canvas(128, 128), lg = lc.ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    [[0, '#ffffff'], [0.18, '#fffbe8'], [0.45, '#ffe6a6'], [0.7, '#d9c9a0'], [0.86, '#9b927f'], [1, '#55524c']].forEach(([o, col]) => lg.addColorStop(o, col));
    lc.ctx.fillStyle = lg; lc.ctx.fillRect(0, 0, 128, 128);
    lc.ctx.strokeStyle = 'rgba(120,100,70,0.35)';
    [40, 28, 17].forEach((rr) => { lc.ctx.beginPath(); lc.ctx.arc(64, 64, rr, 0, Math.PI * 2); lc.ctx.stroke(); });
    const lt = new THREE.CanvasTexture(lc.c); lt.colorSpace = THREE.SRGBColorSpace;
    lens = new THREE.Mesh(new THREE.CircleGeometry(0.024, 32), new THREE.MeshBasicMaterial({ map: lt }));
    lens.position.z = 0.2685;
    const gc = canvas(128, 128), gg = gc.ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gg.addColorStop(0, 'rgba(255,240,205,0.9)'); gg.addColorStop(0.4, 'rgba(255,225,160,0.25)'); gg.addColorStop(1, 'rgba(255,220,150,0)');
    gc.ctx.fillStyle = gg; gc.ctx.fillRect(0, 0, 128, 128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.set(0.14, 0.14, 1); halo.position.z = 0.272;
    torchG.add(body, lens, halo);
    // a faint visible beam from the lens to wherever the light lands
    const bc = canvas(8, 256), bg = bc.ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.35, '#555555'); bg.addColorStop(1, '#000000');
    bc.ctx.fillStyle = bg; bc.ctx.fillRect(0, 0, 8, 256);
    const coneGeo = new THREE.ConeGeometry(Math.tan(0.2), 1, 32, 1, true).translate(0, -0.5, 0).rotateX(-Math.PI / 2);
    beam = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: '#ffe7b8', alphaMap: new THREE.CanvasTexture(bc.c), transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    torchG.traverse((o) => (o.userData.torch = true));
    beam.userData.torch = true;
    torchG.visible = beam.visible = false;
    corridor.add(torchG, beam);
  }
  function lights() {
    dark = !dark;
    Sound.click();
    sw.material.map = dark ? swOffT : swOnT;
    const keep = new Set([sw, bubble]);
    const glow = new Set(Object.values(doors).flatMap((d) => [d.frame, d.leaf]));
    corridor.traverse((o) => {
      if (!o.isMesh || keep.has(o) || o.userData.torch) return;
      if (dark) {
        const m = o.material;
        o.userData.basic = m;
        if (!o.userData.lit) {
          // ink drawn on a transparent sheet gets a light-ink copy, so the beam picks the words out of the dark
          const map = o.userData.ink ? tex(lightInk(m.map.image)) : m.map;
          o.userData.lit = new THREE.MeshLambertMaterial({ map, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side });
          // doors keep a faint glow so you can always find them, and brighten fully in the beam
          if (glow.has(o)) { o.userData.lit.emissive = new THREE.Color(0.2, 0.19, 0.17); o.userData.lit.emissiveMap = m.map; }
        }
        o.material = o.userData.lit;
      } else if (o.userData.basic) o.material = o.userData.basic;
    });
    torchL.visible = spillL.visible = moon.visible = fillL.visible = torchG.visible = beam.visible = dark;
    aimables = [];
    corridor.traverse((o) => { if (o.isMesh && !o.userData.torch && o !== bubble) aimables.push(o); });
    TA.init = false;
    if (!dark) { TA.lean = TA.lv = 0; bot.rotation.z = 0; }
    const col = new THREE.Color(dark ? '#07080b' : '#efeee9');
    corridor.background = col;
    corridor.fog.color = col;
    if (dark) { TA.flick = 0; setTimeout(() => (TA.flick = 0.3), 70); setTimeout(() => (TA.flick = 1), 160); }
    toast(dark ? 'Lights out' : 'Lights on', dark ? 'You’re carrying a torch. Point it with your cursor.' : 'Much better.');
  }
  // the torch is a body on springs: the light lands exactly where the cursor ray meets the corridor,
  // the aim point chases that spot, and the torch itself lags behind the camera and settles as you walk
  function torchStep(now, dt) {
    const on = dark && view === corridor && !game;
    torch.hidden = true;
    torchG.visible = beam.visible = on;
    if (!on) return;
    camera.updateMatrixWorld();
    // where is the cursor pointing?
    aimNdc.set(clamp(ndc.x, -1, 1), clamp(ndc.y, -1, 1));
    aimRay.setFromCamera(aimNdc, camera);
    const hit = aimRay.intersectObjects(aimables, false).find((h) => h.object.visible);
    AT.copy(hit ? hit.point : aimRay.ray.at(14, AT));
    // where should the hand be? a little right of centre and below the eye, bobbing with each step
    const bob = reduce ? 0 : Math.sin(camera.position.z * 2.4) * 0.012;
    GT.set(0.11 + aimNdc.x * 0.04, -0.17 + aimNdc.y * 0.03 + bob, -0.34);
    camera.localToWorld(GT);
    if (!TA.init) { AP.copy(AT); GP.copy(GT); AV.set(0, 0, 0); GV.set(0, 0, 0); TA.init = true; }
    // springs: the aim is quick but has weight; the hand is stiffer
    AV.addScaledVector(tv.copy(AT).sub(AP), 70 * dt).multiplyScalar(Math.max(0, 1 - 13 * dt));
    AP.addScaledVector(AV, dt);
    GV.addScaledVector(tv.copy(GT).sub(GP), 260 * dt).multiplyScalar(Math.max(0, 1 - 24 * dt));
    GP.addScaledVector(GV, dt);
    torchG.position.copy(GP);
    torchG.lookAt(AP);
    // a little roll when you swing it, a little tremor when you hold it still
    TA.rv += (-120 * TA.roll - 12 * TA.rv - AV.x * 0.35) * dt;
    TA.roll += TA.rv * dt;
    torchG.rotateZ(TA.roll + (reduce ? 0 : Math.sin(now / 430) * 0.01));
    if (!reduce) torchG.rotateX(Math.sin(now / 610) * 0.004);
    torchG.updateMatrixWorld();
    lens.getWorldPosition(tv);
    tdir.copy(AP).sub(tv).normalize();
    torchL.position.copy(tv).addScaledVector(tdir, 0.02);
    spillL.position.copy(torchL.position);
    torchL.target.position.copy(AP);
    torchL.target.updateMatrixWorld();
    fillL.position.set(0.02, 0.1, -0.12);
    camera.localToWorld(fillL.position);
    torchL.intensity = 42 * TA.flick;
    spillL.intensity = 10 * TA.flick;
    // the visible beam stretches from the lens to the spot
    const dist = clamp(tv.distanceTo(AP), 0.3, 16);
    beam.position.copy(tv);
    beam.lookAt(AP);
    beam.scale.setScalar(dist);
    beam.material.opacity = 0.11 * TA.flick;
    // shine it in the bot's face and it leans away
    bot.getWorldPosition(tob);
    tob.y += 1.05;
    const d = tob.distanceTo(tv);
    tob.sub(tv).normalize();
    const dazzled = d < 10 && tdir.dot(tob) > 0.988;
    TA.lv += (110 * ((dazzled ? -0.24 : 0) - TA.lean) - 8 * TA.lv) * dt;
    TA.lean += TA.lv * dt;
    bot.rotation.z = TA.lean;
    if (dazzled && now > TA.dazzleT) { TA.dazzleT = now + 6000; setBubble('too bright! 😵', 2200); Sound.tick(); }
  }


  // talk to the bot: type anywhere in the corridor
  const typedEl = $('.typed');
  let said = '', sayT = 0;
  const JOKES = ['why do programmers prefer dark mode? light attracts bugs.', 'I would tell a UDP joke, but you might not get it.', 'it works. nobody touch it.', '99 bugs in the code… fix one… 127 bugs in the code.'];
  const REPLIES = [
    [/sudo make me a sandwich/, 'okay. 🥪'],
    [/^sudo/, 'nice try. root access denied.'],
    [/\b(hi|hello|hey|yo|namaste)\b/, 'hi! pick a door ↓'],
    [/\b(hire|job|intern|recruit)/, 'great idea! contact door is at the end →'],
    [/\brag\b/, 'retrieve → reason → respond 🤓'],
    [/\b(experience|internship)/, 'experience: 2nd door, on the right'],
    [/\b(skill|stack|tech)/, 'skills: 4th door, on the right'],
    [/\bproject/, 'projects: 3rd door, on the left'],
    [/\b(award|achiev|dsa)/, 'awards: 5th door, on the left'],
    [/\b(joke|funny|lol)/, null],
    [/\b(egg|secret|hidden|easter)/, 'easter eggs: 6th door, on the right 🥚'],
    [/\b(who|name)\b/, "I'm UK-bot, Uday's sidekick"],
    [/\b(help|\?)/, 'try: hi, hire, rag, skills, joke, sudo'],
  ];
  function setBubble(text, ms) {
    bubble.material.map.dispose();
    bubble.material.map = tex(drawBubble(text));
    bubble.visible = true;
    bubble.userData.until = performance.now() + ms;
  }
  function showTyped() { typedEl.hidden = !said; typedEl.textContent = '> ' + said; }
  function answer() {
    clearTimeout(sayT);
    const q = said.toLowerCase().trim();
    said = '';
    showTyped();
    if (!q) return;
    const m = REPLIES.find(([re]) => re.test(q));
    const text = m ? m[1] || JOKES[Math.floor(Math.random() * JOKES.length)] : '¯\\_(ツ)_/¯';
    Sound.scribble();
    setBubble(text, 4500);
    if (camera.position.z < -7) toast('UK-bot', text);
  }
  function botKey(e) {
    if (mode !== 'corridor' || e.ctrlKey || e.metaKey || e.altKey) return false;
    if (e.key === 'Enter' && said) { answer(); return true; }
    if (e.key === 'Backspace' && said) { said = said.slice(0, -1); showTyped(); return true; }
    if (e.key === 'Escape' && said) { said = ''; showTyped(); return true; }
    if (e.key.length !== 1 || (e.key === ' ' && !said)) return false;
    said = (said + e.key).slice(-40);
    showTyped();
    Sound.tick();
    clearTimeout(sayT);
    sayT = setTimeout(answer, 2200);
    return true;
  }

  // typing test on the chalkboard (press T in the skills room)
  const ttEl = $('.typetest');
  let tt = null;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function startType() {
    const pool = SKILLS.flatMap(([, a]) => a).filter((w) => w.length <= 14);
    const words = [];
    while (words.length < 5) { const w = pool[Math.floor(Math.random() * pool.length)]; if (!words.includes(w)) words.push(w); }
    tt = { words, i: 0, typed: '', t0: 0, chars: 0, errors: 0 };
    quiet();
    ttEl.hidden = false;
    renderType();
    Sound.scribble();
  }
  function renderType() {
    const w = tt.words[tt.i], ok = w.startsWith(tt.typed);
    const word = [...w].map((ch, j) => `<span class="${j < tt.typed.length ? (tt.typed[j] === ch ? 'ok' : 'bad') : ''}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
    ttEl.innerHTML = `<p class="tt__h">typing test · ${tt.i + 1} / ${tt.words.length}</p><p class="tt__w">${word}</p><p class="tt__in${ok ? '' : ' is-bad'}">${esc(tt.typed)}<i></i></p><p class="tt__f">type the word · Esc to quit</p>`;
  }
  function typeKey(e) {
    if (e.key === 'Escape') { endType(false); return true; }
    if (e.key === 'Backspace') { tt.typed = tt.typed.slice(0, -1); renderType(); return true; }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return true;
    if (!tt.t0) tt.t0 = performance.now();
    tt.typed += e.key;
    Sound.tick();
    const w = tt.words[tt.i];
    if (!w.startsWith(tt.typed)) tt.errors++;
    if (tt.typed === w) {
      tt.chars += w.length + 1;
      tt.i++;
      tt.typed = '';
      Sound.ding();
      if (tt.i >= tt.words.length) { endType(true); return true; }
    }
    renderType();
    return true;
  }
  function endType(done) {
    const r = tt;
    tt = null;
    ttEl.hidden = true;
    if (!done || !r) return;
    const min = (performance.now() - r.t0) / 60000, wpm = Math.round(r.chars / 5 / Math.max(min, 0.01));
    let bestW = 0;
    try { bestW = +localStorage.getItem('uk-sketch-wpm') || 0; } catch (e) { /* storage blocked */ }
    if (wpm > bestW) try { localStorage.setItem('uk-sketch-wpm', String(wpm)); } catch (e) { /* storage blocked */ }
    Sound.chime();
    toast(`${wpm} WPM`, `${r.errors} typo${r.errors === 1 ? '' : 's'} · best ${Math.max(wpm, bestW)} WPM`, { done: wpm > bestW });
  }

  // golden "hire me" balloon in the shooting range
  const gold = { m: null, on: false, t0: 0, next: 0, dir: 1 };
  function goldHit(x, y) {
    gold.on = false;
    gold.m.visible = false;
    gold.next = performance.now() + 9000;
    game.score += 5;
    game.golden = true;
    mark(x, y, '+5 ★', true);
    Sound.pop();
    Sound.chime();
    if (!reduce) {
      const cols = ['#f2c94c', '#f0632a', '#2f6fd6', '#3aa35b', '#d6c1f0', '#f5c6dd'];
      for (let i = 0; i < 28; i++) {
        const a = Math.random() * 6.28, sp = 200 + Math.random() * 520;
        spawn('shred', x, y, Math.cos(a) * sp, Math.sin(a) * sp - 300, (Math.random() - 0.5) * 30, { color: cols[i % cols.length], max: 1.6, drag: 2, floor: false });
      }
    }
    unlock('golden');
  }

  // story notes hang from their pins and swing when the string is plucked
  const notes = [];
  function pluck(src) {
    Sound.twang();
    notes.forEach((n, j) => {
      const d = src < 0 ? j : Math.abs(j - src);
      setTimeout(() => { n.w += (src < 0 ? 1.8 : d === 0 ? 2.6 : 1.2 / (1 + d)) * (j % 2 ? 1 : -1); }, d * (src < 0 ? 70 : 90));
    });
  }

  // idle: after a minute the bot dozes off and the corridor dims
  let lastInput = performance.now(), asleep = false;
  const dimEl = $('.dim');
  function wake() {
    asleep = false;
    dimEl.classList.remove('is-on');
    bot.rotation.z = 0;
    if (view === corridor) setBubble('oh! hi again 👋', 2500);
  }
  ['pointermove', 'keydown', 'wheel', 'touchstart', 'pointerdown'].forEach((ev) => window.addEventListener(ev, () => { lastInput = performance.now(); if (asleep) wake(); }, { passive: true }));

  function eggStep(now, t, dt) {
    if (here === 'skills' && gold.m) {
      if (game && !gold.on && now > gold.next) { gold.on = true; gold.t0 = now; gold.dir = Math.random() > 0.5 ? 1 : -1; gold.m.visible = true; Sound.chime(); }
      if (gold.on) {
        const k = (now - gold.t0) / 5200;
        if (k >= 1 || !game) { gold.on = false; gold.m.visible = false; gold.next = now + 7000 + Math.random() * 5000; }
        else { gold.m.position.set(lerp(-12.5, 12.5, gold.dir > 0 ? k : 1 - k), 2.35 + Math.sin(k * Math.PI * 4) * 0.22, -1.9); gold.m.rotation.z = Math.sin(t * 3) * 0.1; }
      }
    }
    if (here === 'about') notes.forEach((n) => { n.w += (-26 * n.a - 1.3 * n.w) * dt; n.a += n.w * dt; n.m.rotation.z = n.rz + n.a; });
    if (!asleep && mode === 'corridor' && !game && !said && now - lastInput > 60000) {
      asleep = true;
      dimEl.classList.add('is-on');
      setBubble('zzz…', 1e9);
    }
    if (asleep && view === corridor) { arm.rotation.z = -0.05; bot.rotation.z = 0.12; bot.position.y = -0.02; }
    torchStep(now, dt);
  }

  window.addEventListener('resize', () => {
    if (!renderer) return;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = innerWidth < 640 ? 74 : 62;
    camera.updateProjectionMatrix();
  });

  return {
    build,
    start() {
      mode = 'corridor';
      cv.classList.add('is-on');
      $('.hud').hidden = false;
      $$('.hud .torn').forEach(tear);
      hint.hidden = false;
      requestAnimationFrame(loop);
      setTimeout(() => toast('Wanderer', 'Scroll (or swipe) to walk. Click a door to go in.'), 900);
    },
  };
})();

/* ==========================================================
   Loader → outside → inside
   ========================================================== */
async function boot() {
  console.log('%c\n  _   _ _  __\n | | | | |/ /\n | | | | \' /\n | |_| | . \\\n  \\___/|_|\\_\\\n', 'font: 700 14px monospace; color: #f0632a');
  console.log('%cCurious? I like that.%c\nEmail me with the subject "console" and say hi: udaykant180@gmail.com 👀\n(psst: there is a whole room of easter eggs near the end of the corridor.)', 'font: 700 16px sans-serif', 'font: 13px sans-serif');
  const sigs = $$('.sig');
  const pct = $('.loader__pct b');
  const hint = $('.loader__hint');
  const hints = ['sharpening pencils…', 'drawing bricks…', 'hanging the sign…', 'sweeping the corridor…', 'pinning the notes…'];
  let shown = 0, goal = 0;
  const t0 = performance.now();
  const tick = () => {
    shown += (goal - shown) * 0.08;
    const k = Math.min(shown, (performance.now() - t0) / 2200);
    sigs.forEach((p, i) => { const a = i / sigs.length, b = (i + 1) / sigs.length; p.style.strokeDashoffset = String(1 - clamp((k - a) / (b - a))); });
    pct.textContent = Math.round(k * 100) + '%';
    hint.textContent = hints[Math.min(hints.length - 1, Math.floor(k * hints.length))];
    if (k < 0.999) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  await Promise.all([
    document.fonts.load('400 60px "Gochi Hand"'),
    document.fonts.load('400 40px "Kalam"'),
    document.fonts.load('700 40px "Kalam"'),
    document.fonts.load('400 80px "Rubik Doodle Shadow"'),
  ]).catch(() => {});
  goal = 0.35;
  await sleep(30);

  let gl = true;
  try { World.build(); } catch (err) { gl = false; console.error(err); }
  goal = 1;
  await new Promise((r) => { const w = () => (performance.now() - t0 > 2300 ? r() : requestAnimationFrame(w)); w(); });
  await sleep(250);

  const skip = location.hash === '#inside';
  if (!skip) Outside.start();
  $('.loader').classList.add('is-out');
  setTimeout(() => $('.loader').remove(), 1000);

  if (!gl) {
    $('.nogl').hidden = false;
    return;
  }
  if (skip) Outside.skip();
  else toast('Explorer', `Click the door to enter. Sound is <button class="snd" type="button">${soundLabel()}</button>`, { stay: true });

  await Outside.done;
  World.start();
}
boot();
