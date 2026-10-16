// Giresse — portfolio edit. Every frame is a pure function of time: render(T) in seconds.
// Timeline: 0–3 slowed-reverb intro (logo + name), 3–22 main edit on the song, 22–26 outro (logo + name).
'use strict';
const DUR = 26.0;
const $ = id => document.getElementById(id);
const C = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => C((t - a) / (b - a));
const L = (a, b, p) => a + (b - a) * p;
const eo3 = p => 1 - Math.pow(1 - p, 3);
const eo5 = p => 1 - Math.pow(1 - p, 5);
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const eoExpo = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
const eiExpo = p => p <= 0 ? 0 : Math.pow(2, 10 * p - 10);
const back = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const st = (el, o) => Object.assign(el.style, o);
const show = (el, on) => { el.style.display = on ? '' : 'none'; };
const RED = '214,28,46';
const GOTH = new Set(['B']);
const tcase = s => s.length > 1 ? s[0] + s.slice(1).toLowerCase() : s;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- music grid (song is 123.2 BPM; edit time = song time + 0.75 after the slowed intro) ----------
const BEATS = [];
for (let k = 0; ; k++) { const s = 0.315 + 0.487 * k; if (s > 22.5) break; if (s >= 2.25) BEATS.push(s + 0.75); }
const lastBeat = T => { let b = -9; for (const x of BEATS) { if (x <= T) b = x; else break; } return b; };
const CUTS = [[3.0, 1], [6.5, .7], [10.25, .7], [12.0, .55], [13.5, .8], [14.5, .7], [18.25, .7], [19.15, .55], [20.0, .6], [21.0, .5], [22.0, 1]];

// ---------- lyrics (timed from the reference lyric video) ----------
// word = [text, time, role, size, extra]  role: s serif-italic · B chrome condensed · O outline condensed · m mono
const STACK = t => [[['COME', t, 'B', 2.3]], [['back', t + .25, 's', 1.15], ['and', t + .5, 'm', .42]], [['BACK', t + .75, 'O', 2.1]]];
const SWEETIE = (t0, t1, t2, sz = 2.7) => [[['my', t0, 's', 1.2]], [['SWEET', t1, 'B', sz, { alt: [t2, 'SWEETIE'] }]]];
const PHRASES = [
  { s: 0.0, e: 1.62, mode: 'intro', lines: [[['close', 0.05, 's', 1], ['to', .33, 's', 1], ['my', .67, 's', 1]], [['HEART', 1.0, 'B', 1.7], ['is', 1.33, 's', 1]]] },
  { s: 1.67, e: 2.98, mode: 'intro', lines: [[['WHERE', 1.67, 'B', 1.8, { stretch: 1 }], ['you', 2.0, 's', 1.1], ['at', 2.6, 's', 1.1]]] },
  { s: 3.0, e: 4.5, mode: 'center', lines: SWEETIE(3.0, 3.5, 4.0) },
  { s: 4.5, e: 6.0, mode: 'center', lines: [[['close', 4.5, 's', 1.1], ['to', 4.75, 's', 1.1], ['my', 5.0, 's', 1.1]], [['HEART', 5.25, 'B', 2.6], ['is', 5.5, 's', 1.1]]] },
  { s: 6.0, e: 6.5, mode: 'center', lines: [[['WHERE', 6.0, 'B', 2.4, { stretch: 1 }]], [['you', 6.2, 's', 1.4]]] },
  { s: 6.5, e: 8.25, mode: 'lower', lines: STACK(6.5) },
  { s: 8.25, e: 10.25, mode: 'lower', ghost: ['WHERE YOU AT', 9.0], lines: SWEETIE(8.25, 8.75, 9.0) },
  { s: 10.25, e: 12.0, mode: 'lower', lines: STACK(10.25) },
  { s: 12.0, e: 13.5, mode: 'lower', ghost: ['WHERE YOU AT', 12.75], lines: SWEETIE(12.0, 12.5, 12.75) },
  { s: 13.5, e: 14.5, mode: 'center', lines: [[['i', 13.5, 's', 1.4], ['MISS', 13.75, 'B', 2.8], ['you', 14.0, 's', 1.4]]] },
  { s: 14.5, e: 16.25, mode: 'lower', lines: STACK(14.5) },
  { s: 16.25, e: 18.25, mode: 'lower', ghost: ['WHERE YOU AT', 16.75], lines: SWEETIE(16.25, 16.5, 16.75) },
  { s: 18.25, e: 20.0, mode: 'lower', lines: STACK(18.25) },
  { s: 20.0, e: 22.0, mode: 'center', y: 760, ghost: ['HALF DRUNK', 21.0], lines: SWEETIE(20.0, 20.25, 20.75, 2.4) },
];
const MODES = { intro: { y: 1470, fs: 50 }, center: { y: 900, fs: 100 }, lower: { y: 1440, fs: 56 } };

// ---------- static DOM ----------
const NAME = 'GIRESSE';
$('name').innerHTML = [...'Giresse'].map(c => `<span>${c}</span>`).join('');
const NAME_FONTS = [["'UnifrakturCook'", 700, 'normal', .95]];
$('nameEcho').innerHTML = [0, 1, 2].map(() => `<div class="abs" style="left:0;width:1080px;top:0">Giresse</div>`).join('');
const nameSpans = [...$('name').children];

function mkStickers(host, defs) {
  return defs.map(([g, label, grad, x, y, r]) => {
    const d = document.createElement('div');
    d.className = 'stk';
    d.innerHTML = `<div class="tile" style="background:linear-gradient(135deg,${grad})">${g}</div><div class="lbl">${label}</div>`;
    st(d, { left: x + 'px', top: y + 'px' });
    host.appendChild(d);
    return { el: d, r };
  });
}
const STK_B = mkStickers($('stkB'), [
  ['&lt;/&gt;', 'HTML', '#ff7a3d,#ff3d6e', 50, 300, -12], ['{ }', 'CSS', '#3d7bff,#2fd2ff', 870, 330, 10],
  ['TS', 'TypeScript', '#3178c6,#5aa0ff', 40, 690, -6], ['🌊', 'Tailwind', '#06b6d4,#3b82f6', 880, 700, 12],
  ['⚛️', 'React', '#1fd1f9,#5b6cff', 60, 1060, 8], ['▲', 'Next.js', '#1a1a1a,#4a4a4a', 860, 1050, -10]]);
const STK_B_T = [8.95, 9.1, 9.36, 9.5, 9.84, 9.98];
const STK_D = mkStickers($('stkD'), [
  ['🔐', 'Auth', '#7b2cff,#c04dff', 60, 360, -10], ['💬', 'Chat', '#ff3cc8,#ff7a9c', 860, 400, 12],
  ['💳', 'Payments', '#d61c2e,#ff7a3d', 50, 740, 8], ['🔔', 'Push', '#3d7bff,#2fd2ff', 870, 780, -8],
  ['📊', 'Dashboard', '#28c840,#7be495', 70, 1090, -6], ['🚀', 'Deploy', '#ff5f57,#ff9a3d', 860, 1120, 10]]);
const STK_D_T = [15.2, 15.45, 15.7, 15.94, 16.2, 16.43];

// code
const CODE = [
  [['k', 'const '], ['f', 'giresse'], ['p', ' = {']],
  [['', '  role: '], ['s', '"Creative Dev"'], ['p', ',']],
  [['', '  stack: ['], ['s', '"React"'], ['p', ', '], ['s', '"Next"'], ['p', ', '], ['s', '"Node"'], ['p', '],']],
  [['', '  skills: ['], ['s', '"Web"'], ['p', ', '], ['s', '"Apps"'], ['p', ',']],
  [['', '           '], ['s', '"Motion"'], ['p', ', '], ['s', '"Edit"'], ['p', '],']],
  [['', '  level: '], ['n', 'Infinity'], ['p', ',']],
  [['p', '};']],
  [['', '']],
  [['k', 'export default function '], ['f', 'Portfolio'], ['p', '() {']],
  [['k', '  return '], ['c', '<World'], ['', ' vibe='], ['s', '"next"'], ['c', ' />'], ['p', ';']],
  [['p', '}']],
];
const CODE_LEN = CODE.reduce((a, l) => a + l.reduce((b, [, s]) => b + s.length, 0) + 1, 0);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function codeHTML(n, caretOn) {
  let out = '', left = n;
  for (let i = 0; i < CODE.length; i++) {
    if (left <= 0 && i > 0) break;
    let line = `<span class="ln">${i + 1}</span>`;
    for (const [cls, s] of CODE[i]) {
      if (left <= 0) break;
      const part = s.slice(0, left); left -= part.length;
      line += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
    }
    const lineDone = left > 0; left -= 1;
    if (!lineDone || i === CODE.length - 1) { if (caretOn) line += '<span id="caret"></span>'; out += line + '\n'; break; }
    out += line + '\n';
  }
  return out;
}

// rolling list
const LIST = ['Landing Pages', 'Sites Vitrines', 'Web Apps', 'Mobile Apps', 'APIs & Backends', 'Authentication', 'Databases', 'UI / UX Design', 'Motion Design', 'Video Editing', 'Build it all'];
$('list').innerHTML = LIST.map(s => `<div>${s}</div>`).join('');
const listEls = [...$('list').children];

// calendar (Oct 2026 starts on a Thursday, Monday-first grid)
{
  let h = '';
  'MTWTFSS'.split('').forEach((c, i) => h += `<div class="cal" style="left:${i * 50}px;top:0;color:#9aa0b5;font-size:18px">${c}</div>`);
  h += `<div id="selBar" style="left:0;top:${40 + 2 * 50}px;width:0"></div>`;
  for (let d = 1; d <= 31; d++) { const k = 3 + d - 1; h += `<div class="cal" id="cd${d}" style="left:${(k % 7) * 50}px;top:${40 + Math.floor(k / 7) * 50}px">${d}</div>`; }
  $('calGrid').innerHTML = h;
}
$('ac1').innerHTML = `<div style="display:flex;align-items:center;gap:14px"><div style="font-size:30px">🗓️</div><div><div style="font-weight:700;font-size:24px">Fri 16 · Ship v1.0</div><div style="font-size:18px;color:#28a745;font-weight:700">at 9:00 AM</div></div></div>`;
const TODO = [['Design system', '#7b2cff'], ['API routes', '#3d7bff'], ['Launch 🚀', '#ff3cc8']];
$('ac2').innerHTML = `<div style="font-weight:700;font-size:22px;margin-bottom:8px">Today's to-do</div>` +
  TODO.map(([s, c], i) => `<div style="display:flex;align-items:center;gap:12px;height:40px;font-size:21px;font-weight:600"><div id="chk${i}" style="width:26px;height:26px;border-radius:8px;border:3px solid ${c};display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px"></div>${s}</div>`).join('');

// motion row
const CIRC = [['#6c63ff', '‹'], ['#8a3ffc', '#'], ['#3fc9e6', '∿'], ['#2fbf55', '✦'], ['#e05ad8', '◈'], ['#f07a5a', '⬡'], ['#e8506a', '⊖'], ['#d61c2e', '›']];
const MOTION = 'MOTION';
{
  let h = '';
  CIRC.forEach(([c, g], i) => {
    h += `<div class="circ" id="ci${i}" style="left:${63 + i * 118}px;background:${c}">${g}</div>`;
    if (i > 0 && i < 7) h += `<div class="let" id="le${i}" style="left:${63 + i * 118}px">${MOTION[i - 1]}</div>`;
  });
  $('row').innerHTML = h;
}
const LET_ORDER = [2, 5, 1, 4, 6, 3];

// timeline
const TRACKS = [
  ['V2', [[40, 200, '#b388ff', 'title.mov'], [300, 260, '#d61c2e', 'logo_fx']]],
  ['V1', [[0, 230, '#7be495', 'shot_01'], [236, 170, '#2fd2ff', 'shot_02'], [412, 300, '#ff7a9c', 'shot_03']]],
  ['A1', [[0, 760, '#3d7bff', '♪ song.wav']]],
  ['A2', [[120, 160, '#ff9a3d', 'whoosh'], [420, 140, '#ff9a3d', 'impact']]],
];
{
  let h = '';
  TRACKS.forEach(([lab, clips], i) => {
    h += `<div class="tlab" style="top:${30 + i * 88}px">${lab}</div><div class="trk" style="top:${30 + i * 88}px">`;
    clips.forEach(([x, w, c, s], j) => {
      const wave = lab[0] === 'A' ? `background:repeating-linear-gradient(90deg,${c} 0 4px,${c}aa 4px 7px)` : `background:${c}`;
      h += `<div class="clip" data-x="${x}" data-k="${i * 3 + j}" style="left:${x}px;width:${w}px;${wave}">${s}</div>`;
    });
    h += `</div>`;
  });
  [140, 260, 420, 560].forEach((x, i) => h += `<div class="kf" data-k="${i}" style="left:${100 + x}px;top:${30 + 88 + 24}px"></div>`);
  h += `<div id="playhead" class="abs"></div>`;
  $('tl').innerHTML = h;
}
const clipEls = [...$('tl').querySelectorAll('.clip')];
const kfEls = [...$('tl').querySelectorAll('.kf')];

// stars
const starCtx = $('stars').getContext('2d');
const STARS = (() => { const r = rng(7); return Array.from({ length: 320 }, () => ({ a: r() * Math.PI * 2, d: .08 + r() * .95, z: r(), gold: r() < .3 })); })();
function drawStars(S, speed, cx, cy, alpha) {
  const g = starCtx; g.clearRect(0, 0, 1080, 1920);
  if (alpha <= 0) return;
  for (const s of STARS) {
    const z = ((s.z - S) % 1 + 1) % 1; if (z < .015) continue;
    const z2 = z + Math.min(.25, .006 + speed * .05);
    const k = 260 * s.d;
    const x = cx + Math.cos(s.a) * k / z, y = cy + Math.sin(s.a) * k / z;
    const x2 = cx + Math.cos(s.a) * k / z2, y2 = cy + Math.sin(s.a) * k / z2;
    const a = C((1 - z) * 1.6) * alpha;
    g.strokeStyle = s.gold ? `rgba(255,255,255,${a})` : `rgba(255,255,255,${a})`;
    g.lineWidth = .8 + (1 - z) * 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
  }
}

// grain
const gctx = $('grain').getContext('2d');
const gimg = gctx.createImageData(360, 640);
function drawGrain(frame) {
  const r = rng(frame * 9973 + 1), d = gimg.data;
  for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  gctx.putImageData(gimg, 0, 0);
}

// ---------- helpers ----------
function lumOf(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; }
function mixHex(a, b, p) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(L(A >> s & 255, B >> s & 255, p)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function keyColor(keys, t) {
  let col = keys[0][1];
  for (let i = 0; i < keys.length; i++) {
    if (t >= keys[i][0]) {
      const prev = i ? keys[i - 1][1] : keys[i][1];
      col = mixHex(prev, keys[i][1], P(t, keys[i][0], keys[i][0] + (keys[i][2] || .05)));
    }
  }
  return col;
}
function pillAt(el, t0, T, y, lum) {
  const p = P(T, t0, t0 + .35);
  st(el, { left: '540px', top: y + 'px', opacity: C(p * 3), transform: `translateX(-50%) scale(${.6 + .4 * back(p)})`,
    background: lum > .5 ? 'rgba(255,255,255,.9)' : 'rgba(20,16,30,.85)', color: lum > .5 ? '#111' : '#fff',
    borderColor: lum > .5 ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.14)' });
}
function stickers(list, times, T, out) {
  list.forEach(({ el, r }, i) => {
    const t0 = times[i], p = P(T, t0, t0 + .38);
    if (T < t0) { el.style.opacity = 0; return; }
    const s = back(p, 2.6), fl = Math.sin((T - t0) * 3 + i) * 10;
    const ox = out ? (parseFloat(el.style.left) < 540 ? -1 : 1) * out * 160 : 0;
    st(el, { opacity: C(p * 4) * (1 - (out || 0) * .6), transform: `translate(${ox}px,${fl}px) rotate(${L(r - 40, r, eo3(p))}deg) scale(${s})` });
  });
}

// ---------- scenes ----------
const SCENES = ['sIntro', 'sA', 'sB', 'sC', 'sL', 'sI', 'sD', 'sE', 'sT', 'sEnd'].map($);
function sceneFor(V) {
  if (V < 3) return 'sIntro'; if (V < 6.5) return 'sA'; if (V < 10.25) return 'sB'; if (V < 12) return 'sC';
  if (V < 13.5) return 'sL'; if (V < 14.5) return 'sI'; if (V < 18.25) return 'sD'; if (V < 19.15) return 'sE';
  if (V < 20) return 'sT'; if (V < 22) return 'sEnd'; return 'sIntro';
}
const BIGT = { sB: 'WEB', sC: 'CODE', sL: 'STACK', sD: 'APPS', sE: 'MOTION', sT: 'EDIT' };
for (const [id, w] of Object.entries(BIGT)) {
  const d = document.createElement('div'); d.className = 'bigT'; d.id = 'big_' + id; d.textContent = tcase(w) + ' ' + tcase(w);
  const sc = $(id); sc.insertBefore(d, sc.children[1]);
}
const HUDR = { sA: "PORTFOLIO '26", sB: '01 / WEB', sC: '02 / CODE', sL: '02 / STACK', sI: '→ BUILD', sD: '03 / APPS', sE: '04 / MOTION', sT: '05 / EDIT', sEnd: '→ DM' };

function logoScene(T, outro) {
  const t = outro ? T - 22 : T;
  let scale, blur, op;
  if (!outro) {
    scale = .6 + .45 * eo3(P(t, 0, 2.45));
    const r = P(t, 2.45, 3.0); scale *= 1 + 7 * eiExpo(r);
    blur = 16 * (1 - eo3(P(t, 0, 1.3))) + 14 * r * r;
    op = P(t, .05, .8) * (1 - P(t, 2.88, 3.0));
    const S = .1 * t + 1.4 * Math.pow(r, 2.2);
    drawStars(S, .1 + 3 * r, 540, 760, P(t, 0, .6));
  } else {
    scale = .3 + .7 * eoExpo(P(t, 0, 1.3)) + .07 * eio(P(t, 1.3, 4));
    blur = 26 * (1 - eo3(P(t, 0, .9)));
    op = 1 - P(t, 3.45, 3.95);
    const S = .9 * eo3(P(t, 0, 1.2)) + .08 * t;
    drawStars(S, 1.2 * (1 - P(t, 0, 1.3)) + .1, 540, 760, op);
  }
  st($('introCam'), { transform: `scale(${scale}) rotate(${outro ? 0 : -3 * (1 - eo3(P(t, 0, 2.4)))}deg)`, transformOrigin: '540px 760px', filter: blur > .3 ? `blur(${blur}px)` : 'none', opacity: op });
  const lp = outro ? P(t, 0, .5) : P(t, .1, 1.1);
  st($('logo'), { opacity: lp, transform: `scale(${1 + .03 * Math.exp(-(T - lastBeat(T)) * 8) * (outro ? 1 : 0)})` });
  st($('logoGlow'), { opacity: lp * (.7 + .3 * Math.sin(t * 3)) });
  $('orbA').setAttribute('transform', `rotate(${t * 46 - 40} 420 420)`);
  $('orbB').setAttribute('transform', `rotate(${-t * 64 + 120} 420 420)`);
  $('orbC').setAttribute('transform', `rotate(${t * 14} 420 420)`);
  st($('orbits'), { opacity: outro ? P(t, .1, .7) : P(t, .5, 1.3) });
  const n0 = outro ? .55 : 1.0, nd = outro ? .08 : .11;
  const nbi = BEATS.filter(b => b <= T).length + Math.floor(T * 2);
  nameSpans.forEach((sp, i) => {
    const [nf, nw, ns, nk] = NAME_FONTS[0];
    const ch = 'Giresse'[i]; sp.textContent = ch;
    st(sp, { fontFamily: nf, fontWeight: nw, fontStyle: ns, fontSize: 200 * nk + 'px', background: `linear-gradient(100deg,transparent 42%,rgba(255,255,255,.95) 50%,transparent 58%) ${sweep(T, 40) - i * 4}% 0/260% 100% no-repeat,${CHROME_A}`, WebkitBackgroundClip: 'text', backgroundClip: 'text' });
    const p = P(t, n0 + i * nd, n0 + i * nd + .45), e = eo3(p);
    st(sp, { opacity: e, filter: p < 1 ? `blur(${(1 - e) * 22}px)` : 'none', transform: `translateY(${(1 - e) * 70}px) scale(${1.5 - .5 * e})` });
  });
  const sh = 3 + 4 * Math.sin(t * 2.4);
  st($('name'), { letterSpacing: L(30, 2, eo3(P(t, n0, n0 + 1.4))) + 'px', filter: `drop-shadow(0 0 ${16 + sh * 3}px rgba(255,255,255,.45)) drop-shadow(0 0 70px rgba(214,28,46,.55))` });
  const ne = eo3(P(t, n0 + .5, n0 + 1.3)) + .2 * Math.exp(-(T - lastBeat(T)) / .12) * (outro ? 1 : 0);
  [...$('nameEcho').children].forEach((el, k) => st(el, { opacity: (.45 / (k + 1)) * P(t, n0 + .4, n0 + .9) * (1 - P(t, outro ? 9 : 2.7, outro ? 9.1 : 3)), transform: `translateY(${(k + 1) * 34 * ne}px) scale(${1 + (k + 1) * .04 * ne})`, letterSpacing: $('name').style.letterSpacing }));
  const tg = outro ? P(t, 1.4, 1.9) : P(t, 1.9, 2.35);
  st($('tagline'), { opacity: tg, letterSpacing: L(16, 6, eo3(tg)) + 'px' });
  const fl = Math.max(Math.exp(-Math.pow((t - (outro ? .45 : 1.05)) / .18, 2)), .8 * Math.exp(-Math.pow((t - (outro ? 2.6 : 2.3)) / .2, 2)));
  st($('flare'), { opacity: fl, transform: `scaleX(${.4 + fl})` });
  const ct = outro ? P(t, 2.1, 2.5) : 0;
  st($('cta'), { opacity: ct, transform: `translateY(${(1 - eo3(ct)) * 30}px)` });
  return 0;
}

const GLOWA = [[3.0, '214,28,46'], [3.5, '255,255,255'], [3.99, '214,28,46'], [4.48, '255,255,255'], [4.96, '214,28,46'], [5.45, '255,255,255'], [5.94, '214,28,46']];
const TAGS = [[3.01, '00', 'giresse'], [3.5, '01', 'web dev'], [3.99, '02', 'apps'], [4.48, '03', 'motion'], [4.96, '04', 'code'], [5.45, '05', 'edit'], [5.94, '→', 'build something', 'NOW']];
function sceneA(V) {
  let g = GLOWA[0][1]; for (const x of GLOWA) if (V >= x[0]) g = x[1];
  const b = Math.exp(-(V - lastBeat(V)) / .25);
  $('bgSolid').style.background = `radial-gradient(circle at 50% 46%, rgba(${g},${.22 + .18 * b}) 0%, rgba(${g},.05) 38%, #000 70%)`;
  let cur = TAGS[0]; for (const tg of TAGS) if (V >= tg[0]) cur = tg;
  const e = eo3(P(V, cur[0], cur[0] + .18));
  const now = cur[3] ? auraWord(V, [cur[3], cur[0] + .2, 'B', 1.25], 100, false, V < cur[0] + .2) : '';
  $('arrowTag').innerHTML = `<div style="opacity:${e};filter:blur(${(1 - e) * 10}px);transform:translateY(${(1 - e) * 30}px)">
    <span class="mono" style="font-size:26px;letter-spacing:6px;color:#d61c2e;vertical-align:middle">${cur[1]}&nbsp;&nbsp;</span><span class="serif" style="font-size:84px;color:#fff;filter:drop-shadow(0 0 12px rgba(255,255,255,.4))">${cur[2]}</span>${now ? `&nbsp;<span style="display:inline-block;filter:drop-shadow(0 0 24px rgba(214,28,46,.7))">${now.replaceAll(CHROME_A, CRIMSON)}</span>` : ''}</div>`;
  return 0;
}

function haze(ids, V, seed) {
  ids.forEach((id, i) => {
    const a = V * .6 + i * 2.1 + seed;
    const base = [[-200, 150], [500, 700], [100, 1100]][i];
    st($(id), { left: base[0] + Math.sin(a) * 120 + 'px', top: base[1] + Math.cos(a * .8) * 140 + 'px', opacity: i === 1 ? .55 : .8 });
  });
}

function sceneB(V) {
  $('bgSolid').style.background = '#07040d';
  haze(['hb1', 'hb2', 'hb3'], V, 0);
  const pe = P(V, 6.5, 7.1), e = back(pe, 1.3);
  const out = eio(P(V, 8.95, 9.4));
  const sway = Math.sin((V - 6.5) * 1.3);
  st($('browser'), { opacity: C(pe * 3), transform: `translateY(${(1 - e) * 600}px) rotateX(${(1 - e) * 60 + 4 * sway}deg) rotateY(${-6 * sway - 14 * out}deg) scale(${(.72 + .28 * e) * (1 - .18 * out)})` });
  const url = 'giresse.dev'; $('url').textContent = url.slice(0, Math.round(url.length * P(V, 6.75, 7.2))) + (V % .5 < .25 ? '|' : ' ');
  const h = eo3(P(V, 6.92, 7.2));
  st($('heroH'), { opacity: h, transform: `translateY(${(1 - h) * 50}px)`, filter: `blur(${(1 - h) * 10}px)` });
  [['sk1', 620], ['sk2', 480]].forEach(([id, w], i) => { const p = eo3(P(V, 7.41 + i * .08, 7.75 + i * .08)); st($(id), { width: w * p + 'px', opacity: p }); });
  const b = P(V, 7.89, 8.2), click = Math.exp(-Math.max(0, V - 8.38) * 10) * (V >= 8.38 ? 1 : 0);
  st($('btn1'), { opacity: C(b * 3), transform: `scale(${back(b, 2.2) * (1 - .08 * click)})` });
  st($('btn2'), { opacity: C((b - .15) * 3), transform: `scale(${back(C(b * 1.2 - .1), 2.2)})`, });
  ['f1', 'f2', 'f3'].forEach((id, i) => { const p = P(V, 8.38 + i * .08, 8.7 + i * .08); st($(id), { opacity: C(p * 3), transform: `translateY(${(1 - eo3(p)) * 80}px) scale(${.8 + .2 * back(p)})` }); });
  // cursor
  const c1 = eo3(P(V, 7.95, 8.33)), c2 = eio(P(V, 8.5, 8.95));
  const cx = L(L(880, 300, c1), 720, c2), cy = L(L(1380, 880, c1), 1140, c2);
  st($('cursor'), { left: cx + 'px', top: cy + 'px', opacity: P(V, 7.9, 8.0) * (1 - P(V, 8.9, 9.0)), transform: `scale(${1 - .15 * click})` });
  const rp = P(V, 8.38, 8.75);
  st($('ripple'), { left: '-60px', top: '-60px', opacity: V >= 8.38 ? 1 - rp : 0, transform: `scale(${.2 + 1.3 * eo3(rp)})` });
  pillAt($('pillB'), 6.6, V, 228, 0);
  stickers(STK_B, STK_B_T, V, 0);
  return 0;
}

function sceneC(V) {
  $('bgSolid').style.background = '#07070b';
  const pe = eo3(P(V, 10.25, 10.6));
  st($('editor'), { transform: `translateZ(${(1 - pe) * 500}px) rotateX(${(1 - pe) * -25}deg) rotateY(${-10 + 7 * P(V, 10.25, 12)}deg)`, filter: pe < 1 ? `blur(${(1 - pe) * 12}px)` : 'none', opacity: C(pe * 2) });
  const n = Math.floor(CODE_LEN * eio(P(V, 10.38, 11.7)));
  $('code').innerHTML = codeHTML(Math.max(1, n), (V * 4 | 0) % 2 === 0 || n < CODE_LEN);
  const tp = P(V, 11.5, 11.7);
  st($('term'), { opacity: C(tp * 3), transform: `translateY(${(1 - back(tp, 2)) * 120}px) scale(${.9 + .1 * eo3(tp)})` });
  $('term').innerHTML = `<span style="color:#7be495">$</span> npm run build<br>` + (V > 11.72 ? `<span style="color:#7be495">✓ compiled in 0.8s ⚡ ready</span>` : '');
  pillAt($('pillC'), 10.3, V, 228, 0);
  return 0;
}

function sceneL(V) {
  $('bgSolid').style.background = '#0b0a09';
  const start = 4; let idx = start;
  for (let k = 0; k < 6; k++) idx += eo5(P(V, 12.0 + k * .243, 12.0 + k * .243 + .2));
  st($('list'), { transform: `translateY(${480 - idx * 96 - 48}px)` });
  listEls.forEach((el, i) => {
    const d = Math.abs(i - idx), f = C(1 - d);
    const last = i === LIST.length - 1;
    st(el, { color: `rgba(255,255,255,${.38 + .62 * f})`, transform: `scale(${1 + .18 * f})`, filter: d > 1.2 ? `blur(${Math.min(3, (d - 1) * 1.2)}px)` : 'none' });
    el.innerHTML = f > .6 ? `<span style="color:#ff4b3e">•</span> ${LIST[i]} <span style="color:#ff4b3e">•</span>` : LIST[i];
    if (last && f > .6) el.style.color = '#fff';
  });
  return 0;
}

function sceneI(V) {
  $('bgSolid').style.background = `radial-gradient(circle at 50% 45%, rgba(214,28,46,${.1 + .12 * Math.exp(-(V - lastBeat(V)) / .25)}), #000 62%)`;
  const e = eo3(P(V, 13.5, 13.7)), e2 = eo3(P(V, 13.75, 13.95));
  const now = auraWord(V, ['NOW', 14.0, 'B', 1.25], 100, false, V < 14.0).replaceAll(CHROME_A, CRIMSON);
  $('buildTag').innerHTML = `<span class="mono" style="font-size:26px;letter-spacing:6px;color:#d61c2e;vertical-align:middle;opacity:${e}">→&nbsp;&nbsp;</span><span class="serif" style="font-size:84px;white-space:pre;opacity:${e};filter:blur(${(1 - e) * 8}px)">build <span style="opacity:${e2}">something</span> </span>&nbsp;<span style="display:inline-block;filter:drop-shadow(0 0 24px rgba(214,28,46,.7))">${now}</span>`;
  return 0;
}

function sceneD(V) {
  $('bgSolid').style.background = '#08030f';
  haze(['hd1', 'hd2', 'hd3'], V, 1.3);
  const pe = P(V, 14.5, 15.05), e = back(pe, 1.4);
  const zoom = eio(P(V, 16.75, 17.5));
  const sway = Math.sin((V - 14.5) * 1.4);
  st($('dPersp'), { transform: `scale(${1 + .22 * zoom})`, transformOrigin: '540px 760px' });
  st($('phone'), { opacity: C(pe * 3), transform: `translateY(${(1 - e) * 900}px) rotateX(${(1 - e) * 40 + 3 * sway}deg) rotateZ(${(1 - e) * -14}deg) rotateY(${8 * sway * (1 - zoom)}deg)` });
  const sb = eio(P(V, 15.05, 15.6));
  $('selBar').style.width = (50 * 7 * sb) + 'px';
  for (let d = 12; d <= 18; d++) { const on = 50 * ((3 + d - 1) % 7) + 25 < 350 * sb; $('cd' + d).style.color = on ? '#fff' : '#2a2d3a'; }
  const a1 = P(V, 15.65, 15.95), a2 = P(V, 15.94, 16.24);
  st($('ac1'), { opacity: C(a1 * 3), transform: `translateX(${(1 - eo3(a1)) * 380}px) rotate(${(1 - eo3(a1)) * 8}deg)` });
  st($('ac2'), { opacity: C(a2 * 3), transform: `translateX(${(1 - eo3(a2)) * 380}px) rotate(${(1 - eo3(a2)) * 8}deg)` });
  TODO.forEach(([, c], i) => { const on = V >= 16.2 + i * .24; const el = $('chk' + i); el.style.background = on ? c : 'transparent'; el.textContent = on ? '✓' : ''; el.style.transform = `scale(${on ? 1 + .4 * Math.exp(-(V - 16.2 - i * .24) * 12) : 1})`; });
  const sp = P(V, 17.15, 17.35);
  st($('splash'), { opacity: sp });
  $('load').style.width = 200 * eio(P(V, 17.4, 18.1)) + 'px';
  pillAt($('pillD'), 14.6, V, 228, 0);
  stickers(STK_D, STK_D_T, V, zoom);
  return 0;
}

function sceneE(V) {
  $('bgSolid').style.background = '#ebebee';
  const punch = Math.exp(-Math.max(0, V - 18.95) * 9) * (V >= 18.95 ? 1 : 0);
  st($('row'), { transform: `scale(${1 + .08 * punch})` });
  CIRC.forEach((_, i) => {
    const p = eo3(P(V, 18.25 + i * .025, 18.55 + i * .025));
    let s = 1, ls = 0;
    if (i > 0 && i < 7) {
      const t0 = 18.56 + LET_ORDER.indexOf(i) * .065;
      s = 1 - eo3(P(V, t0, t0 + .08));
      ls = back(P(V, t0 + .02, t0 + .2), 2.4);
      st($('le' + i), { opacity: V > t0 ? 1 : 0, transform: `translateX(${(1 - p) * 760}px) scale(${ls})` });
    }
    st($('ci' + i), { transform: `translateX(${(1 - p) * 760}px) scale(${s})`, opacity: s > .02 ? 1 : 0 });
  });
  const sp = P(V, 18.7, 18.95);
  st($('eSub'), { opacity: sp, transform: `translateY(${(1 - eo3(sp)) * 30}px)`, filter: `blur(${(1 - sp) * 8}px)` });
  pillAt($('pillE'), 18.3, V, 600, 1);
  return 1;
}

function sceneT(V) {
  $('bgSolid').style.background = '#060607';
  const pe = eo3(P(V, 19.15, 19.4));
  st($('preview'), { opacity: pe, transform: `translateY(${(1 - pe) * -80}px) scale(${.9 + .1 * pe})` });
  st($('tl'), { opacity: pe, transform: `translateY(${(1 - pe) * 120}px)` });
  const hue = (V - 19.15) * 220;
  $('pvBg').style.background = `linear-gradient(${120 + hue}deg,#2a0b5e,#7b2cff 45%,#d61c2e)`;
  const bp = Math.exp(-(V - lastBeat(V)) * 9);
  st($('pvLogo'), { transform: `scale(${1 + .1 * bp}) rotate(${Math.sin(V * 5) * 4}deg)` });
  st($('pvTxt'), { letterSpacing: L(30, 4, eo3(P(V, 19.2, 19.7))) + 'px', textShadow: `${4 * bp}px 0 #ff3b5c,${-4 * bp}px 0 #2fd2ff` });
  const f = Math.floor((V - 19.15) * 30); $('pvTc').textContent = `00:00:${String(19 + Math.floor((V - 19.15))).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`;
  clipEls.forEach(el => { const k = +el.dataset.k, p = eo3(P(V, 19.2 + k * .03, 19.45 + k * .03)); st(el, { transform: `translateX(${(1 - p) * 900}px)`, opacity: p }); });
  kfEls.forEach(el => { const k = +el.dataset.k, p = back(P(V, 19.5 + k * .06, 19.65 + k * .06), 3); el.style.transform = `rotate(45deg) scale(${p})`; });
  st($('playhead'), { left: L(100, 940, P(V, 19.2, 20.0)) + 'px' });
  pillAt($('pillT'), 19.2, V, 228, 0);
  return 0;
}

function sceneEnd(V) {
  $('bgSolid').style.background = 'radial-gradient(circle at 50% 62%, rgba(255,190,80,.16), #000 60%)';
  const a = eo3(P(V, 21.05, 21.25)), c = P(V, 21.55, 21.8);
  $('endTxt').innerHTML = `<div style="font-family:Anton;font-size:84px;letter-spacing:${L(30, 8, a)}px;opacity:${a};filter:blur(${(1 - a) * 8}px)">RENDS TON PROJET</div>` +
    `<div style="margin-top:-6px">${auraWord(V, ['inoubliable', 21.3, 'B', 1.7], 100, false, V < 21.3)}</div>`;
  st($('endSub'), { opacity: c });
  return 0;
}

// ---------- lyrics / aura typography ----------
// ---------- "chrome gothic noir" typography ----------
// one system: hero words = chrome fraktur with a moving light sweep · support words = serif italic · labels = mono · accent = crimson
let MODE = 'noir', ACC = '214,28,46';
function palette() { return 'noir'; }
const CHROME_A = 'linear-gradient(180deg,#ffffff 0%,#f1f1f1 30%,#8c8c8c 48%,#ffffff 56%,#cfcfcf 78%,#ffffff 100%)';
const CHROME_P = CHROME_A, CHROME = CHROME_A;
const CRIMSON = 'linear-gradient(180deg,#ffd9dc 0%,#ff4d5e 40%,#c1121f 62%,#5c0710 100%)';
const FRAK = "font-family:'UnifrakturCook';font-weight:700";
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h >>> 0; };
function rgbSplit(T, t) { return 14 * Math.exp(-Math.max(0, T - t) / .07) * (T >= t ? 1 : 0); }
function sweep(T, seed) { return (((T * .55 + (seed % 100) / 100) % 1.6) * 100 - 30).toFixed(1); }
function chromeFill(T, seed, base = CHROME_A) {
  return `background:linear-gradient(100deg,transparent 42%,rgba(255,255,255,.95) 50%,transparent 58%) ${sweep(T, seed)}% 0/260% 100% no-repeat,${base};-webkit-background-clip:text;background-clip:text;color:transparent`;
}
function letters(txt, T, fs, paint) { return `<span style="${FRAK};font-size:${fs}px;line-height:1;${paint}">${txt}</span>`; }
function auraWord(T, [text, t, role, size, x = {}], u, light, future) {
  const hero = role === 'B';
  const fs = u * size * (hero ? .82 : role === 'O' ? 1.05 : 1);
  let txt = text, tHit = t;
  if (x.alt && T >= x.alt[0]) { txt = x.alt[1]; tHit = x.alt[0]; }
  if (hero) txt = tcase(txt); else if (role !== 'm') txt = txt.toLowerCase();
  const seed = hash(text);
  const fontCss = hero ? FRAK : role === 'm' ? "font-family:'JetBrains Mono'" : "font-family:'Instrument Serif';font-style:italic";
  if (future) return `<span style="visibility:hidden;${fontCss};font-size:${fs}px;line-height:1">${hero ? tcase(text) : text.toLowerCase()}</span>`;
  const e = eo3(P(T, t, t + .28)), d = hero ? rgbSplit(T, tHit) : 0;
  let tf = `translateY(${(1 - e) * fs * .12}px) scale(${1 + .12 * (1 - e)})`;
  if (x.stretch) tf += ` scaleX(${1 + 2.5 * (1 - eo3(P(T, t, t + .35)))})`;
  const col = light ? '#0b0b0b' : '#fff';
  const split = d > .4 ? `drop-shadow(${d}px 0 rgba(${ACC},.8)) drop-shadow(${-d * .5}px 0 rgba(255,255,255,.6)) ` : '';
  const glow = light ? '' : hero ? `drop-shadow(0 0 8px rgba(255,255,255,.45)) drop-shadow(0 0 40px rgba(${ACC},.55))` : role === 'O' ? `drop-shadow(0 0 22px rgba(${ACC},.7))` : 'drop-shadow(0 0 10px rgba(255,255,255,.35))';
  let body;
  if (hero) {
    // letter-by-letter reveal; the extra letters of an alt ("Sweet" → "Sweetie") reveal at the alt time
    const base = tcase(text).length;
    body = [...txt].map((ch, i) => {
      const lt = i < base ? t + i * .035 : x.alt[0] + (i - base) * .04;
      const le = eo3(P(T, lt, lt + .22));
      const fill = light ? `color:${col}` : chromeFill(T - i * .05, seed);
      return `<span style="display:inline-block;opacity:${le};filter:blur(${(1 - le) * 10}px);transform:translateY(${(1 - le) * fs * .18}px);${fill}">${ch}</span>`;
    }).join('');
    body = `<span style="${FRAK};font-size:${fs}px;line-height:1.02">${body}</span>`;
    // soft bloom copy behind instead of hard echoes
    if (!light) body = `<span style="position:absolute;left:0;top:0;width:100%;text-align:center;white-space:nowrap;${FRAK};font-size:${fs}px;line-height:1.02;color:rgba(${ACC},.55);filter:blur(${18 + 10 * Math.exp(-Math.max(0, T - lastBeat(T)) / .12)}px);opacity:${e}">${txt}</span><span style="position:relative">${body}</span>`;
  } else if (role === 'O') {
    body = `<span style="font-family:'Instrument Serif';font-style:italic;font-size:${fs}px;line-height:1;${light ? `color:${col}` : `background:${CRIMSON};-webkit-background-clip:text;background-clip:text;color:transparent`}">${txt}</span>`;
  } else if (role === 'm') {
    body = `<span style="font-family:'JetBrains Mono';font-size:${fs}px;letter-spacing:${fs * .3}px;text-transform:uppercase;color:rgb(${ACC})">${txt}</span>`;
  } else {
    body = `<span style="font-family:'Instrument Serif';font-style:italic;font-size:${fs * 1.08}px;line-height:1;color:${col};letter-spacing:.5px">${txt}</span>`;
  }
  return `<span style="position:relative;display:inline-block;white-space:nowrap;opacity:${hero ? 1 : e};transform:${tf};filter:${split}${glow}${!hero && e < 1 ? ` blur(${(1 - e) * 8}px)` : ''}">${body}</span>`;
}
function applyPalette(sc) {
  SCENES.forEach(el => { el.style.filter = el.id !== 'sIntro' && el.id !== 'sEnd' && el.id !== 'sE' ? 'saturate(.5) contrast(1.12)' : 'none'; });
  ['hb1', 'hb2', 'hb3'].forEach((id, i) => $(id).style.background = ['#5a0710', '#9b0f1a', '#0c0003'][i]);
  ['hd1', 'hd2', 'hd3'].forEach((id, i) => $(id).style.background = ['#6a0812', '#b3121f', '#0c0003'][i]);
  $('logoGlow').style.background = 'radial-gradient(circle,rgba(214,28,46,.32) 0%,rgba(255,255,255,.06) 40%,transparent 66%)';
  $('flare').style.background = 'linear-gradient(90deg,transparent,rgba(255,255,255,0) 20%,rgba(255,255,255,.95) 50%,rgba(255,255,255,0) 80%,transparent)';
  $('orbA').firstElementChild.setAttribute('stroke', '#e6e6e6');
  $('orbB').firstElementChild.setAttribute('stroke', '#d61c2e');
  $('orbC').firstElementChild.setAttribute('stroke', '#ffffff');
  $('tagline').style.color = 'rgba(255,255,255,.75)';
  $('hudFill').style.background = `rgb(${ACC})`;
  ['jp', 'jp2'].forEach(id => st($(id), { color: 'rgba(255,255,255,.45)', textShadow: 'none' }));
  $('redTint').style.background = 'radial-gradient(ellipse at 50% 115%,rgba(214,28,46,.22),transparent 60%)';
  $('scan').style.opacity = .22;
}
function renderLyrics(T, lum, recap) {
  const ph = PHRASES.find(p => T >= p.s && T < p.e);
  const host = $('lyr');
  if (!ph) { host.innerHTML = ''; return; }
  const m = MODES[ph.mode], u = m.fs, y0 = ph.y || m.y, light = lum > .55;
  let h = '';
  if (recap) h += `<div class="layer" style="background:rgba(0,0,0,.5)"></div>`;
  if (ph.ghost && T >= ph.ghost[1]) {
    const g = eo3(P(T, ph.ghost[1], ph.ghost[1] + .5)), gt = ph.ghost[0].toLowerCase(), gfs = 1000 / (gt.length * .42);
    h += `<div style="position:absolute;left:0;width:1080px;text-align:center;white-space:nowrap;top:${y0 - gfs * .6}px;font-family:'Instrument Serif';font-style:italic;font-size:${gfs}px;line-height:1;color:${light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)'};filter:blur(1px);opacity:${g};transform:scale(${1.08 - .08 * g + .02 * (T - ph.ghost[1])})">${gt}</div>`;
  }
  let blk = `<div style="position:absolute;left:0;width:1080px;top:${y0}px;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:${u * .06}px">`;
  for (const line of ph.lines) {
    blk += `<div style="display:flex;align-items:baseline;justify-content:center;gap:${u * .26}px;white-space:nowrap">`;
    for (const w of line) blk += auraWord(T, w, u, light, T < w[1]);
    blk += `</div>`;
  }
  blk += `</div>`;
  h += blk;
  // glitch slices right after each hit
  let th = -9;
  for (const line of ph.lines) for (const w of line) { if (w[1] <= T) th = Math.max(th, w[1]); if (w[4] && w[4].alt && w[4].alt[0] <= T) th = Math.max(th, w[4].alt[0]); }
  if (T - th < .1 && th === ph.lines[0][0][1] && ph.mode !== 'intro') {
    const r = rng(Math.round(T * 30) * 7 + 3);
    for (let k = 0; k < 3; k++) {
      const a = r() * 80, hh = 4 + r() * 14, off = (r() - .5) * 120;
      h += `<div class="layer" style="clip-path:inset(${y0 / 19.2 - 8 + a * .2}% 0 ${100 - (y0 / 19.2 - 8 + a * .2) - hh}% 0);transform:translateX(${off}px);opacity:.9;mix-blend-mode:screen">${blk}</div>`;
    }
  }
  host.innerHTML = h;
}

// ---------- main ----------
const RECAP = [8.6, 11.3, 12.85, 16.4, 18.9, 19.6, 9.7, 15.9];
function render(T) {
  const frame = Math.round(T * 30);
  let V = T, recap = false;
  if (T >= 20 && T < 21) { V = RECAP[Math.min(RECAP.length - 1, Math.floor((T - 20) / .125))]; recap = true; }
  const sc = sceneFor(V);
  MODE = palette(T, V, sc); applyPalette(sc);
  SCENES.forEach(el => show(el, el.id === sc));
  let lum = 0;
  if (sc === 'sIntro') { $('bgSolid').style.background = '#000'; lum = logoScene(T, T >= 22); }
  else if (sc === 'sA') lum = sceneA(V);
  else if (sc === 'sB') lum = sceneB(V);
  else if (sc === 'sC') lum = sceneC(V);
  else if (sc === 'sL') lum = sceneL(V);
  else if (sc === 'sI') lum = sceneI(V);
  else if (sc === 'sD') lum = sceneD(V);
  else if (sc === 'sE') lum = sceneE(V);
  else if (sc === 'sT') lum = sceneT(V);
  else if (sc === 'sEnd') lum = sceneEnd(V);
  if (recap) lum = 0;
  if (BIGT[sc]) { const el = $('big_' + sc); st(el, { transform: `translate(${-200 - (V % 10) * 60}px,0) rotate(0deg)`, WebkitTextStroke: `2px ${lum > .55 ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.13)'}` }); }
  renderLyrics(T, lum, recap);

  // camera: cut punches, beat pulses, shake
  let z = 1, rot = 0, blur = 0, fl = 0, sx = 0, sy = 0;
  for (const [c, s] of CUTS) {
    if (T >= c) { const d = T - c; z += .12 * s * Math.exp(-d / .12); blur += 9 * s * Math.exp(-d / .05); fl = Math.max(fl, s * Math.exp(-d / .07)); rot += 2.2 * s * Math.sin(d * 40) * Math.exp(-d / .1); }
  }
  if (T >= 2.82 && T < 3) fl = Math.max(fl, P(T, 2.82, 3.0));
  if (recap) { const k = Math.floor((T - 20) / .125), d = (T - 20) % .125; fl = Math.max(fl, .35 * Math.exp(-d / .03)); rot += (k % 2 ? 2 : -2); z += .05; }
  if (T >= 3 && T < 22) {
    const lb = lastBeat(T), d = T - lb, amp = sc === 'sA' ? .045 : .02;
    z += amp * Math.exp(-d / .09);
    const r = rng(Math.round(lb * 1000)); sx = (r() - .5) * 12 * Math.exp(-d / .08); sy = (r() - .5) * 12 * Math.exp(-d / .08);
  }
  st($('cam'), { transform: `translate(${sx}px,${sy}px) scale(${z}) rotate(${rot}deg)`, filter: blur > .4 ? `blur(${blur}px)` : 'none' });
  $('flash').style.opacity = fl;
  $('vig').style.opacity = 1 - .75 * lum;

  // HUD
  const hudOn = T >= 3 && T < 22;
  show($('hud'), hudOn);
  if (hudOn) {
    const hc = lum > .55 ? '#0b0b0b' : '#ffffff';
    st($('hud'), { color: hc, opacity: P(T, 3, 3.3) });
    $('hudR').textContent = recap ? 'REPLAY' : HUDR[sc] || '';
    $('hudFill').style.width = (100 * P(T, 3, 22)) + '%';
  }
  const inv = INV.some(x => T >= x && T - x < .067);
  $('stage').style.filter = inv ? 'invert(1) contrast(1.3)' : 'none';
  $('scan').style.backgroundPosition = `0 ${(frame * 3) % 8}px`;
  $('band').style.top = ((frame * 37) % 2200 - 200) + 'px';
  show($('jp'), hudOn); show($('jp2'), hudOn);
  drawGrain(frame);
}
const INV = [3.0, 6.5, 14.5, 18.25, 22.0];
window.render = render;
window.DUR = DUR;
window.ready = Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = r; i.onerror = r; }))]);
