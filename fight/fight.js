// Giresse — "website fight" edit. Every frame is a pure function of time: render(T).
// 0–5 s slowed-reverb intro (name falls from space into a search bar), 5–31.2 s fight rounds on the song, 31.2–33.7 s end card.
'use strict';
const DUR = 33.7;
const $ = id => document.getElementById(id);
const C = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => C((t - a) / (b - a));
const L = (a, b, p) => a + (b - a) * p;
const eo3 = p => 1 - Math.pow(1 - p, 3);
const ei3 = p => p * p * p;
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const back = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const st = (el, o) => Object.assign(el.style, o);
const show = (el, on) => { el.style.display = on ? '' : 'none'; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- time map: song time s -> edit time ----------
const ED = s => s < 3.75 ? s / .75 : s + 1.25;
const SONG_END = 29.95, END_T = ED(SONG_END);            // 31.2
const BEATS = [];
for (let k = 0; ; k++) { const s = .395 + .4598 * k; if (s > SONG_END) break; if (s >= 3.75) BEATS.push(ED(s)); }
const NONS = [6.9, 14.4, 21.86, 28.53].map(ED);          // the four K.O.s
const NON2 = ED(28.8);
const IMPACT = 4.4;                                      // meteor hits the search bar

// ---------- sites ----------
const chrome = (url, bg = 'rgba(0,0,0,.06)') => `<div class="top" style="background:${bg}"><i style="left:16px;background:#ff5f57"></i><i style="left:34px;background:#febc2e"></i><i style="left:52px;background:#28c840"></i><div class="url">${url}</div></div>`;
const SITES = {
  giresse: { name: 'GIRESSE', html: `${chrome('giresse.dev')}
    <div class="abs" style="left:-80px;top:40px;width:420px;height:300px;border-radius:50%;background:radial-gradient(circle,#bcd8ff,transparent 65%)"></div>
    <img src="../edit/assets/logo.jpg" style="position:absolute;right:26px;top:62px;width:84px;border-radius:50%;box-shadow:0 6px 20px rgba(0,0,0,.25)">
    <div class="abs" style="left:28px;top:70px;font-family:Anton;font-size:64px;color:#0d1426;line-height:1">Giresse.</div>
    <div class="abs" style="left:30px;top:146px;font-size:17px;color:#566;font-weight:600">Web · Apps · Motion · Edit</div>
    <div class="abs" style="left:28px;top:192px;padding:12px 24px;border-radius:24px;background:#1d8cff;color:#fff;font-size:18px;font-weight:600">Let's work together</div>
    <div class="abs" style="left:28px;top:262px;display:flex;gap:8px">${['#e3efff', '#fff3cc', '#dcffe4', '#ffe0ea'].map((c, i) => `<div style="padding:5px 12px;border-radius:12px;background:${c};font-size:13px;font-weight:600">${['Web', 'Apps', 'Motion', 'Edit'][i]}</div>`).join('')}</div>`, bg: '#fff' },
  old: { name: 'OLD-SITE.COM', html: `${chrome('old-site.com', '#d4d0c8')}
    <div class="abs" style="left:0;top:40px;width:420px;height:280px;background:#c0c0c0"></div>
    <div class="abs" style="left:18px;top:58px;font-family:'Liberation Serif',serif;font-size:30px;color:#0000ee;text-decoration:underline">Welcome to my HomePage!!!</div>
    <div class="abs" style="left:18px;top:120px;width:384px;height:40px;background:repeating-linear-gradient(45deg,#ffd400 0 22px,#111 22px 44px)"></div>
    <div class="abs" style="left:60px;top:126px;padding:2px 10px;background:#ffd400;font-family:'Liberation Serif';font-weight:700;font-size:20px">UNDER CONSTRUCTION</div>
    <div class="abs" style="left:18px;top:184px;font-family:'Liberation Serif';font-size:18px;color:#800080">Best viewed in Internet Explorer 6</div>
    <div class="abs" style="left:18px;top:224px;font-family:'Liberation Mono';font-size:22px;background:#000;color:#0f0;padding:2px 8px">Visitors: 000042</div>`, bg: '#c0c0c0' },
  shop: { name: 'MEGASHOP', html: `${chrome('megashop.store')}
    <div class="abs" style="left:0;top:40px;width:420px;height:52px;background:#ff7a1a;color:#fff;font-family:Anton;font-size:30px;line-height:52px;padding-left:20px">MEGASHOP</div>
    ${[0, 1, 2, 3].map(i => `<div class="abs" style="left:${20 + (i % 2) * 196}px;top:${106 + Math.floor(i / 2) * 104}px;width:184px;height:92px;border-radius:14px;background:${['#ffe2c7', '#d9ecff', '#e5ffd9', '#ffd9e8'][i]}"></div>`).join('')}
    <div class="abs" style="right:16px;top:52px;width:74px;height:74px;border-radius:50%;background:#ff2d55;color:#fff;font-family:Anton;font-size:26px;line-height:74px;text-align:center;transform:rotate(-12deg)">-70%</div>`, bg: '#fff' },
  blog: { name: 'MY-BLOG', html: `${chrome('my-thoughts.blog', '#efe5d4')}
    <div class="abs" style="left:0;top:40px;width:420px;height:280px;background:#f6efe3"></div>
    <div class="abs" style="left:26px;top:64px;font-family:'Instrument Serif';font-size:52px;color:#3b2f22">My Thoughts.</div>
    ${[0, 1, 2, 3, 4].map(i => `<div class="abs" style="left:26px;top:${140 + i * 30}px;width:${[360, 320, 350, 280, 200][i]}px;height:12px;border-radius:6px;background:#d9ccb6"></div>`).join('')}`, bg: '#f6efe3' },
  dash: { name: 'DASHBOARD', html: `${chrome('admin.panel', '#1a1e30')}
    <div class="abs" style="left:0;top:40px;width:420px;height:280px;background:#0f1220"></div>
    <div class="abs" style="left:0;top:40px;width:70px;height:280px;background:#161a2c"></div>
    <div class="abs" style="left:90px;top:56px;color:#fff;font-family:Anton;font-size:34px">+12% <span style="color:#28c840;font-size:22px">▲</span></div>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<div class="abs" style="left:${92 + i * 44}px;bottom:24px;width:28px;height:${[60, 110, 80, 150, 120, 170, 140][i]}px;border-radius:6px;background:linear-gradient(#5b6cff,#a64bff)"></div>`).join('')}`, bg: '#0f1220' },
  ai: { name: 'AI-GEN', html: `${chrome('ai-site-gen.io')}
    <div class="abs" style="left:0;top:40px;width:420px;height:280px;background:linear-gradient(135deg,#ff4ecd,#6b5bff)"></div>
    <div class="abs" style="left:24px;top:70px;font-family:Anton;font-size:40px;color:#fff;line-height:1.05">AI SITE<br>GENERATOR ✨</div>
    <div class="abs" style="left:24px;top:190px;width:372px;height:56px;border-radius:28px;background:rgba(255,255,255,.9);font-size:18px;line-height:56px;padding-left:22px;color:#777">make me a website pls…</div>`, bg: '#6b5bff' },
  boss: { name: 'TEMPLATE.PRO', html: `${chrome('template.pro', '#1a1a1a')}
    <div class="abs" style="left:0;top:40px;width:420px;height:280px;background:#0b0b0b"></div>
    <div class="abs" style="left:24px;top:62px;font-family:Anton;font-size:46px;color:#f5c542;line-height:1">TEMPLATE.PRO</div>
    <div class="abs" style="left:26px;top:122px;color:#f5c542;font-size:22px;letter-spacing:4px">★★★★★</div>
    <div class="abs" style="left:24px;top:170px;padding:14px 28px;border-radius:30px;background:#f5c542;color:#000;font-family:Anton;font-size:30px">BUY NOW $9</div>
    <div class="abs" style="left:24px;top:250px;color:#777;font-size:15px">same site as 10,000 others</div>`, bg: '#0b0b0b' },
};

// ---------- rounds ----------
const ROUNDS = [
  { opp: 'old', s: 6.45, ko: NONS[0], bg: 'light', label: 'ROUND 1' },
  { opp: 'shop', s: NONS[0], ko: ED(10.43), bg: 'light', label: 'ROUND 2' },
  { opp: 'blog', s: ED(10.43), ko: NONS[1], bg: 'sky', label: 'ROUND 3', orbit: .5 },
  { opp: 'dash', s: NONS[1], ko: ED(17.79), bg: 'dark', label: 'ROUND 4' },
  { opp: 'ai', s: ED(17.79), ko: NONS[2], bg: 'dark', label: 'ROUND 5', orbit: .7 },
  { opp: 'boss', s: NONS[2], ko: NONS[3], bg: 'purple', label: 'FINAL ROUND', orbit: .9 },
];
for (const R of ROUNDS) {
  R.hits = [];
  const first = R.s + .55;
  let k = 0;
  for (const b of BEATS) if (b > first && b < R.ko - .3) { if (k++ % 2 === 0) R.hits.push(b); }
  R.hits.push(R.ko);
}
const ALLHITS = ROUNDS.flatMap(R => R.hits.map((t, i) => ({ t, ko: i === R.hits.length - 1 })));
window.EVENTS = [{ t: IMPACT, type: 'meteor' }, ...ALLHITS.map(h => ({ t: h.t, type: h.ko ? 'ko' : 'hit' })), ...ROUNDS.map(R => ({ t: R.s, type: 'round' })), { t: END_T, type: 'end' }];

// build fighters + shards
const arena = $('arena');
function mkSite(key, extra = '') {
  const d = document.createElement('div');
  d.className = 'site';
  d.style.background = SITES[key].bg;
  d.innerHTML = SITES[key].html + extra;
  arena.appendChild(d);
  return d;
}
function cracksSVG(seed) {
  const r = rng(seed); let p = '';
  for (let k = 0; k < 9; k++) {
    let x = 210 + (r() - .5) * 60, y = 160 + (r() - .5) * 60, a = r() * Math.PI * 2;
    p += `M${x},${y}`;
    for (let s = 0; s < 5; s++) { a += (r() - .5) * .9; x += Math.cos(a) * 45; y += Math.sin(a) * 45; p += ` L${x.toFixed(0)},${y.toFixed(0)}`; }
  }
  return `<svg class="crk" width="420" height="320"><path d="${p}" fill="none" stroke="rgba(255,255,255,.95)" stroke-width="3"/><path d="${p}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1.2" transform="translate(1.5,1.5)"/></svg>`;
}
const HERO = mkSite('giresse');
const OPP = ROUNDS.map((R, i) => {
  const el = mkSite(R.opp, cracksSVG(i * 11 + 3));
  const shards = [];
  const r = rng(i * 77 + 5);
  for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 4; gx++) {
    const j = () => (r() - .5) * 30;
    const x0 = gx * 105, y0 = gy * 107, x1 = x0 + 105, y1 = y0 + 107;
    const poly = [[x0 + (gx ? j() : 0), y0 + (gy ? j() : 0)], [x1 + (gx < 3 ? j() : 0), y0 + (gy ? j() : 0)], [x1 + (gx < 3 ? j() : 0), y1 + (gy < 2 ? j() : 0)], [x0 + (gx ? j() : 0), y1 + (gy < 2 ? j() : 0)]];
    const sh = document.createElement('div');
    sh.className = 'shard';
    sh.innerHTML = `<div class="site" style="position:absolute;left:0;top:0;background:${SITES[R.opp].bg};clip-path:polygon(${poly.map(p => p[0].toFixed(0) + 'px ' + p[1].toFixed(0) + 'px').join(',')})">${SITES[R.opp].html}</div>`;
    arena.appendChild(sh);
    shards.push({ el: sh, cx: (x0 + x1) / 2 - 210, cy: (y0 + y1) / 2 - 160, vx: (r() - .2) * 1500, vy: (r() - .7) * 1400, vr: (r() - .5) * 900, vz: (r() - .5) * 600 });
  }
  return { el, crk: el.querySelector('.crk'), shards };
});

// ---------- canvases ----------
const fxB = $('fxBack').getContext('2d'), fxT = $('fxTop').getContext('2d');
const stars = (() => { const r = rng(9); return Array.from({ length: 260 }, () => ({ x: r() * 1080, y: r() * 1920, s: r() * 2.2 + .4, tw: r() * 6 })); })();
function drawStars(ctx, T, a) {
  ctx.clearRect(0, 0, 1080, 1920); if (a <= 0) return;
  for (const s of stars) { ctx.fillStyle = `rgba(200,220,255,${a * (.4 + .6 * Math.abs(Math.sin(T * 2 + s.tw)))})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
}
const gctx = $('grain').getContext('2d'), gimg = gctx.createImageData(360, 640);
function drawGrain(f) { const r = rng(f * 9973 + 1), d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

function speedLines(ctx, x, y, seed, col, bg) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  const r = rng(seed); ctx.fillStyle = col;
  for (let i = 0; i < 120; i++) {
    const a = r() * Math.PI * 2, w = .004 + r() * .02, r0 = 160 + r() * 380;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a - w) * 2600, y + Math.sin(a - w) * 2600);
    ctx.lineTo(x + Math.cos(a + w) * 2600, y + Math.sin(a + w) * 2600);
    ctx.fill();
  }
}
function burst(ctx, x, y, d, seed, big) {
  // shockwave rings + sparks after an impact (d = seconds since impact)
  const r = rng(seed);
  for (let k = 0; k < (big ? 2 : 1); k++) {
    const p = P(d, k * .06, .34 + k * .06); if (p <= 0 || p >= 1) continue;
    ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = (big ? 26 : 14) * (1 - p) + 1;
    ctx.beginPath(); ctx.ellipse(x, y, eo3(p) * (big ? 620 : 380), eo3(p) * (big ? 620 : 380) * .62, 0, 0, Math.PI * 2); ctx.stroke();
  }
  const sp = P(d, 0, .32);
  if (sp > 0 && sp < 1) for (let i = 0; i < (big ? 44 : 26); i++) {
    const a = r() * Math.PI * 2, v = (300 + r() * 700) * (big ? 1.4 : 1), l = 30 + r() * 90;
    const dist = eo3(sp) * v;
    ctx.strokeStyle = ['#ffffff', '#9fd0ff', '#ffe08a', '#ff8fd0'][i % 4]; ctx.globalAlpha = 1 - sp; ctx.lineWidth = 3 + r() * 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * dist, y + Math.sin(a) * dist); ctx.lineTo(x + Math.cos(a) * (dist + l * (1 - sp)), y + Math.sin(a) * (dist + l * (1 - sp))); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------- lyrics (song time; sizes S/M/L; 'g' = pink→violet gradient) ----------
const LYR = [
  { s: 0, e: 1.95, w: [[0, "M'A", 'M'], [.4, 'BAN', 'M'], [.8, 'BANDEUR', 'L', 'g'], '/', [1.35, "JE T'AIME", 'M']] },
  { s: 1.95, e: 3.75, w: [[1.95, "M'APPELLE", 'M'], '/', [2.4, 'MEN', 'S'], [2.9, 'HAN', 'L', 'g']] },
  { s: 3.75, e: 4.85, w: [[3.85, "M'APPELLE", 'M'], '/', [4.35, 'CHANTEUR', 'L', 'g', ' 🎤']] },
  { s: 4.85, e: 6.85, w: [[4.85, "J'POURRAIS", 'L'], '/', [5.35, 'LOVER', 'M', 'g'], [5.85, 'SANS', 'S'], '/', [6.3, 'PRESSION', 'M']] },
  { s: 7.75, e: 10.3, w: [[7.8, 'RACHEL', 'L', 'g'], '/', [8.3, 'TU', 'S'], [8.8, 'FAIS', 'M'], '/', [9.3, 'TOURNER', 'S'], [9.4, 'LA', 'S'], [9.6, 'TÊTE', 'L', 'g', ' 💫']] },
  { s: 10.3, e: 12.3, w: [[10.3, 'RÉPONDS', 'L', 'g'], '/', [10.8, 'QUAND', 'M'], [11.3, 'JE', 'S'], '/', [11.4, "T'APPELLE", 'M', 'g', ' 📞']] },
  { s: 12.3, e: 14.35, w: [[12.3, "J'POURRAIS", 'L'], '/', [12.8, "M'EN", 'S'], [13.2, 'LOVER', 'M', 'g', ' ❤️'], '/', [13.5, 'SANS', 'S'], [13.8, 'PRESSION', 'M'], [13.95, 'MAIS', 'S']] },
  { s: 15.2, e: 17.8, w: [[15.3, 'MANON', 'L', 'g', ' 💋'], '/', [15.8, 'ELLE', 'M'], [15.9, 'EST', 'S'], '/', [16.3, '3X', 'M', 'g'], [16.8, 'CANON', 'L', 'g', ' ✨']] },
  { s: 17.8, e: 19.8, w: [[17.8, "Y'A", 'L'], [17.9, 'TOUT', 'S'], '/', [18.3, 'DANS', 'S'], [18.8, "L'PANTALON", 'M', 'g']] },
  { s: 19.8, e: 21.8, w: [[19.8, "J'POURRAIS", 'L'], '/', [19.9, 'TOUT', 'S'], [20.3, 'DONNER', 'M', 'g'], '/', [20.8, 'SANS', 'S'], [20.9, 'PRESSION', 'M', 'g']] },
  { s: 22.3, e: 25.3, w: [[22.3, 'ZOÉ', 'L', 'g', ' 💎'], '/', [23.3, 'ELLE', 'S'], [23.4, 'FLAIRE', 'M'], '/', [23.9, 'ELLE', 'S'], [24.0, 'VEUT', 'M'], [24.4, 'JOUER', 'L', 'g']] },
  { s: 25.3, e: 26.85, w: [[25.3, 'ELLE', 'S'], [25.4, 'SAIT', 'L', 'g'], '/', [25.8, "QU'ELLE", 'M'], [25.9, 'EST', 'S'], '/', [26.3, 'DOUÉE', 'L', 'g', ' 💡']] },
  { s: 26.85, e: 28.5, w: [[26.85, "J'POURRAIS", 'L'], '/', [27.3, 'LA', 'S'], [27.8, 'DOTTER', 'L', 'g'], '/', [28.2, 'SANS', 'S'], [28.3, 'PRESSION', 'M', 'g']] },
];
const SZ = { S: 62, M: 96, L: 150 };
const GRAD = 'linear-gradient(90deg,#ff5fa2,#b14bff 55%,#5b6cff)';
function renderLyrics(T, dark) {
  const ph = LYR.find(p => T >= ED(p.s) && T < ED(p.e));
  if (!ph) { $('lyr').innerHTML = ''; return; }
  const intro = T < 5, k = intro ? .55 : 1;
  const col = dark ? '#f2f4fa' : '#141b2b';
  let h = `<div style="position:absolute;left:0;width:1080px;top:${intro ? 1500 : 1400}px;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:6px">`;
  let line = '', li = 0;
  const flush = () => { h += `<div style="display:flex;align-items:baseline;gap:18px;transform:translateX(${[-40, 50, -20, 30][li % 4] * k}px)">${line}</div>`; line = ''; li++; };
  for (const w of ph.w) {
    if (w === '/') { flush(); continue; }
    const [s, txt, sz, g, emo] = w, t = ED(s), fs = SZ[sz] * k;
    if (T < t) { line += `<span class="lw" style="font-size:${fs}px;visibility:hidden">${txt}</span>`; continue; }
    const e = eo3(P(T, t, t + .14));
    // letter wipe like the lyric video: letters fill in left→right
    const n = txt.length, shown = Math.ceil(n * eo3(P(T, t, t + .18)));
    const paint = g ? `background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent` : `color:${col}`;
    line += `<span class="lw" style="font-size:${fs}px;transform:translateY(${(1 - e) * 30}px) scale(${1 + .25 * (1 - e)});filter:blur(${(1 - e) * 6}px) drop-shadow(0 6px 14px rgba(0,0,0,${dark ? .5 : .15}))"><span style="${paint}">${txt.slice(0, shown)}</span><span style="opacity:.25;${paint}">${txt.slice(shown)}</span>${emo && e > .5 ? `<span style="font-size:${fs * .45}px;vertical-align:top">${emo}</span>` : ''}</span>`;
  }
  flush();
  $('lyr').innerHTML = h + '</div>';
}

// ---------- backgrounds ----------
const BG = { light: ['#eef1f7', '#bcd3ff', 0], sky: ['#dfeaff', '#9ec3ff', 0], dark: ['#070a14', '#4b2cff', 1], purple: ['#14062e', '#7b2cff', 1] };

// ---------- fight ----------
function hitStop(T, hits) { let s = 0; for (const c of hits) if (T > c) s += Math.min(.07, T - c); return T - s; }
function placeSite(el, x, y, z, ry, rz, sc, extra = '') {
  el.style.transform = `translate3d(${x - 210}px,${y - 160}px,${z}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc}) ${extra}`;
}
function renderFight(T, R, ri) {
  const hits = R.hits, te = hitStop(T, hits), t0 = R.s;
  const ent = eo3(P(T, t0, t0 + .4));
  const base = 640 + 26 * Math.sin(te * 3);
  let sep = base, spinH = 0, spinO = 0, tiltH = 0, tiltO = 0, lunge = 0;
  hits.forEach((c, i) => {
    const ce = hitStop(c, hits);
    const a = P(te, ce - .2, ce), r = P(te, ce, ce + .42);
    if (a > 0 && a < 1) { sep = L(base, 492, ei3(a)); lunge = a; }
    if (r > 0 && r < 1) { sep = L(492, base, back(r, 2.2)); }
    if (te >= ce) {
      const sp = eo3(P(te, ce, ce + .5));
      if (i % 2) spinH += 360 * sp; else spinO += 360 * sp;
      const dec = Math.exp(-(te - ce) / .18);
      tiltH += -16 * dec; tiltO += 16 * dec;
    }
  });
  const th = (R.orbit || .25) * (te - t0) + Math.sin(te * .8) * .15;
  const cx = 540, cy = 880;
  const dx = Math.cos(th) * sep / 2, dy = Math.sin(th) * sep / 2 * .3, dz = Math.sin(th) * 260;
  const bob = Math.sin(te * 2.6) * 14;
  const hx = cx - dx, hy = cy - dy + bob, ox = cx + dx, oy = cy + dy - bob;
  // hero
  st(HERO, { display: '', zIndex: dz > 0 ? 3 : 2, boxShadow: `0 30px 80px rgba(20,30,70,.35),0 0 ${40 + 60 * lunge}px rgba(29,140,255,${.45 + .4 * lunge})` });
  placeSite(HERO, hx, hy, -dz, 22 + spinH, tiltH, 1.2);
  // opponent
  const O = OPP[ri], ko = R.ko, koD = T - ko;
  const nHit = hits.filter(c => T >= c).length;
  O.crk.style.opacity = C((nHit - 1) / Math.max(1, hits.length - 2));
  if (T < ko + .03) {
    st(O.el, { display: '', zIndex: dz > 0 ? 2 : 3 });
    placeSite(O.el, L(1400, ox, ent), oy, dz, -22 + spinO + (1 - ent) * 360, tiltO, 1.2);
    O.shards.forEach(s => s.el.style.display = 'none');
  } else {
    O.el.style.display = 'none';
    const d = koD;
    O.shards.forEach(s => {
      s.el.style.display = '';
      const x = ox + s.cx + s.vx * d, y = oy + s.cy + s.vy * d + 1800 * d * d;
      s.el.style.transform = `translate3d(${x - 210}px,${y - 160}px,${s.vz * d}px) rotate(${s.vr * d}deg)`;
      s.el.style.opacity = 1 - P(d, .5, .9);
    });
  }
  // HUD
  st($('hpL'), { width: (100 - 6 * nHit) + '%' });
  st($('hpR'), { width: (100 * (1 - nHit / hits.length)) + '%' });
  $('nameR').textContent = SITES[R.opp].name;
  // impact fx
  let active = null;
  for (const c of hits) if (T >= c && T - c < .45) active = c;
  return { hx, hy, ox, oy, active, isKO: active === ko };
}

// ---------- main render ----------
function render(T) {
  const frame = Math.round(T * 30);
  const intro = T < 5.0, endCard = T >= END_T;
  show($('sIntro'), intro); show($('end'), endCard);
  show($('hud'), false); show(HERO, false); OPP.forEach(o => { o.el.style.display = 'none'; o.shards.forEach(s => s.el.style.display = 'none'); });
  fxB.clearRect(0, 0, 1080, 1920); fxT.clearRect(0, 0, 1080, 1920);
  let shake = 0, zoom = 1, flash = 0, dark = false, arenaFilter = 'none';
  $('roundTxt').innerHTML = '';

  if (intro) {
    // cold open text, then the name falls from space and crashes into the search bar
    drawStars($('stars').getContext('2d'), T, 1 - P(T, 4.5, 5));
    const so = P(T, .1, .45) * (1 - P(T, 1.15, 1.45));
    st($('still'), { opacity: so, filter: `blur(${(1 - P(T, .1, .45)) * 14 + P(T, 1.15, 1.45) * 20}px)`, transform: `translateY(${-P(T, 1.15, 1.45) * 120}px)` });
    const fall = P(T, 1.3, IMPACT), f = ei3(fall);
    const mx = L(820, 540, f), my = L(-300, 1000, f), msc = L(.18, 1, f);
    const ang = Math.atan2(1000 + 300, 540 - 820) * 180 / Math.PI - 90;
    st($('meteor'), { display: T < IMPACT ? '' : 'none', transform: `translate(${mx}px,${my}px) scale(${msc})` });
    st($('metTrail'), { transform: `rotate(${ang}deg) scaleY(${.4 + f * 1.6})`, opacity: P(T, 1.3, 1.8) });
    st($('metCore'), { opacity: .4 + .6 * f, transform: `scale(${.6 + f})` });
    st($('metName'), { textShadow: `0 0 ${20 + 60 * f}px rgba(255,170,80,.9),0 0 ${10 + 30 * f}px #fff` });
    // search bar waits, then gets hit
    const bi = P(T, 1.6, 2.1), hit = T >= IMPACT ? Math.exp(-(T - IMPACT) / .12) : 0;
    st($('bar'), { opacity: bi, transform: `translateY(${(1 - eo3(bi)) * 60 + hit * 40}px) scale(${1 - .06 * hit})` });
    const typed = 'giresse.dev';
    $('barTxt').innerHTML = T < IMPACT + .15 ? 'search...' : `<span style="color:#111">${typed.slice(0, Math.ceil(typed.length * P(T, IMPACT + .15, 4.85)))}</span><span style="color:#1d8cff">|</span>`;
    // landed name + cracks
    if (T >= IMPACT) {
      const d = T - IMPACT;
      $('cracks').innerHTML = crackPaths(P(d, 0, .12));
      st($('nameLandEl'), {});
    } else $('cracks').innerHTML = '';
    landName(T);
    if (T >= IMPACT) { const d = T - IMPACT; shake = 40 * Math.exp(-d / .12); zoom = 1 + .12 * Math.exp(-d / .2); flash = Math.exp(-d / .06); burst(fxT, 540, 1060, d, 4, true); if (d < .1) speedLines(fxB, 540, 1060, 12, 'rgba(255,255,255,.85)', 'rgba(0,0,0,0)'); }
    shake += 6 * P(T, 2.8, IMPACT) * (T < IMPACT ? 1 : 0);
    dark = true;
    $('stage').style.background = '#05070d'; $('sIntro').style.background = '#05070d';
  } else if (!endCard) {
    // fight world
    let ri = 0; ROUNDS.forEach((R, i) => { if (T >= R.s) ri = i; });
    const R = ROUNDS[Math.max(0, ri)];
    const bg = BG[T < 6.45 ? 'light' : R.bg];
    dark = !!bg[2];
    $('stage').style.background = bg[0];
    st($('blob'), { background: bg[1], opacity: .7, transform: `translate(${Math.sin(T * .7) * 120}px,${Math.cos(T * .5) * 160}px)` });
    if (T < 6.45) {
      // search bar → enter → hero site pops out, opponent drops in
      show($('sIntro'), true); drawStars($('stars').getContext('2d'), T, 0);
      $('sIntro').style.background = 'transparent'; $('still').style.opacity = 0; $('meteor').style.display = 'none'; $('cracks').innerHTML = '';
      const out = eo3(P(T, 5.9, 6.25));
      st($('bar'), { opacity: 1 - out, transform: `translateY(${-out * 200}px) scale(${1 - .3 * out})` });
      $('barTxt').innerHTML = `<span style="color:#111">giresse.dev</span><span style="color:#1d8cff">${T < 5.85 ? (frame % 16 < 8 ? '|' : '') : ' ⏎'}</span>`;
      landName(T);
      const hp = eo3(P(T, 5.95, 6.4));
      if (T > 5.95) { show(HERO, true); placeSite(HERO, 540 - 300 * hp, L(1120, 880, hp), 0, 22 * hp, 0, L(.3, 1, back(hp))); }
    } else {
      $('sIntro').style.background = '#05070d';
      show($('hud'), true);
      const res = renderFight(T, R, ROUNDS.indexOf(R));
      // round banner
      const rb = P(T, R.s + .02, R.s + .55);
      if (rb > 0 && rb < 1) {
        const a = Math.sin(rb * Math.PI);
        $('roundTxt').innerHTML = `<div style="font-size:${R.label.length > 7 ? 120 : 150}px;opacity:${a};transform:scale(${1.4 - .4 * eo3(rb)});background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 8px 20px rgba(0,0,0,.3))">${R.label}</div><div style="font-size:90px;color:${dark ? '#fff' : '#141b2b'};opacity:${P(rb, .35, .5) * a}">FIGHT!</div>`;
      }
      if (res.active !== null) {
        const d = T - res.active, ix = (res.hx + res.ox) / 2, iy = (res.hy + res.oy) / 2;
        const big = res.isKO;
        // anime impact frame: 2 frames white/black speed lines with high-contrast fighters
        if (d < .07) { speedLines(fxB, ix, iy, Math.round(res.active * 100), '#000', '#fff'); arenaFilter = 'grayscale(1) contrast(2.2) brightness(1.1)'; }
        else if (d < .13) { speedLines(fxB, ix, iy, Math.round(res.active * 100) + 1, '#fff', '#000'); arenaFilter = 'grayscale(1) contrast(2.4) invert(1)'; }
        burst(fxT, ix, iy, d, Math.round(res.active * 100), big);
        shake = (big ? 46 : 24) * Math.exp(-d / .12);
        zoom = 1 + (big ? .16 : .07) * Math.exp(-d / .18);
        flash = Math.max(flash, (big ? .9 : .4) * Math.exp(-(d - .13) / .05) * (d > .13 ? 1 : 0));
      }
    }
  } else {
    // end card
    $('stage').style.background = '#000';
    dark = true;
    const d = T - END_T;
    drawStars($('stars2').getContext('2d'), T, 1);
    const e = eo3(P(d, 0, .5));
    st($('endName'), { opacity: e, filter: `blur(${(1 - e) * 16}px) drop-shadow(0 0 30px rgba(255,255,255,.55)) drop-shadow(0 0 80px rgba(29,140,255,.5))`, transform: `scale(${1.3 - .3 * e + .03 * d})` });
    st($('endLogo'), { opacity: eo3(P(d, .2, .7)), transform: `scale(${.8 + .2 * eo3(P(d, .2, .7))})` });
    st($('endTag'), { opacity: P(d, .6, 1.0) });
    const b = P(d, .9, 1.3);
    st($('bubble'), { opacity: C(b * 3), transform: `translateX(-50%) scale(${back(b, 2.5)})` });
    flash = Math.exp(-d / .08);
    shake = 20 * Math.exp(-d / .12);
    if (d > 2.0) $('end').style.opacity = 1 - P(d, 2.0, 2.5); else $('end').style.opacity = 1;
  }
  // victory overlay
  const vic = P(T, NONS[3] + .9, NONS[3] + 1.2);
  if (!endCard && T > NONS[3] + .72) {
    show($('hud'), false);
    const v = eo3(P(T, NONS[3] + .72, NONS[3] + 1.05));
    st(HERO, { display: '', zIndex: 5 });
    placeSite(HERO, 540, L(880, 900, v), 0, 0, 0, L(1.2, 1.5, v));
    HERO.style.boxShadow = `0 30px 80px rgba(20,30,70,.4),0 0 ${80 + 40 * Math.sin(T * 6)}px rgba(29,140,255,.8)`;
    $('roundTxt').innerHTML = `<div style="margin-top:-120px;font-size:150px;opacity:${v};transform:scale(${1.3 - .3 * v});background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 8px 20px rgba(0,0,0,.4))">GIRESSE</div><div style="font-size:110px;color:#fff;opacity:${v};filter:drop-shadow(0 0 20px rgba(255,255,255,.6))">WINS</div>`;
  }
  $('arena').style.filter = arenaFilter;
  // NON screens
  let non = '';
  for (const n of [...NONS, NON2]) if (T >= n && T < n + (n === NONS[3] ? .27 : n === NON2 ? .42 : .55)) {
    const d = T - n;
    non = `<span style="font-size:520px;transform:scaleY(1.9) scale(${1.15 - .15 * eo3(P(d, 0, .15))});letter-spacing:-10px;color:${dark ? '#fff' : '#000'};filter:drop-shadow(0 0 40px rgba(0,0,0,.35))">NON</span>`;
  }
  $('non').innerHTML = non;
  renderLyrics(T, dark);
  // camera
  const r = rng(frame * 13 + 7);
  st($('cam'), { transform: `translate(${(r() - .5) * shake}px,${(r() - .5) * shake}px) scale(${zoom}) rotate(${(r() - .5) * shake * .05}deg)` });
  $('flash').style.opacity = C(flash);
  drawGrain(frame);
}

// cracks on the search bar
function crackPaths(p) {
  const r = rng(21); let d = '';
  for (let k = 0; k < 12; k++) {
    let x = 540, y = 1100, a = (k / 12) * Math.PI * 2 + r() * .3; d += `M${x},${y}`;
    const n = 6;
    for (let s = 0; s < n * p; s++) { a += (r() - .5) * .7; x += Math.cos(a) * 70; y += Math.sin(a) * 50; d += ` L${x.toFixed(0)},${y.toFixed(0)}`; }
  }
  return `<path d="${d}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="4"/><path d="${d}" fill="none" stroke="rgba(120,180,255,.6)" stroke-width="10" filter="blur(6px)"/>`;
}
// the name, embedded after the impact
const landEl = document.createElement('div');
landEl.id = 'nameLandEl'; landEl.className = 'abs'; landEl.textContent = 'GIRESSE';
st(landEl, { left: '0', width: '1080px', top: '860px', textAlign: 'center', fontFamily: 'Anton', fontSize: '190px', letterSpacing: '6px', lineHeight: '1' });
$('sIntro').appendChild(landEl);
function landName(T) {
  if (T < IMPACT) { landEl.style.opacity = 0; return; }
  const d = T - IMPACT, onLight = T >= 5;
  const bounce = Math.abs(Math.sin(d * 14)) * Math.exp(-d / .15) * 50;
  const out = P(T, 5.9, 6.25);
  st(landEl, { opacity: 1 - out, color: onLight ? '#0d1426' : '#fff', transform: `translateY(${-bounce - out * 300}px) scale(${1 - .3 * out})`,
    textShadow: onLight ? '0 10px 30px rgba(20,40,120,.25)' : `0 0 ${30 + 60 * Math.exp(-d / .3)}px rgba(255,170,80,.8),0 0 20px rgba(255,255,255,.8)` });
}

window.render = render;
window.DUR = DUR;
window.ready = Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = r; i.onerror = r; }))]);
