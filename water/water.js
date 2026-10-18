// Underwater UI edit (4:3) after the mcvisuals reference: one motion-designed UI scene per lyric line,
// all under blurred crimson water with refraction; tracking camera; lyrics rising from the water in the lower third.
'use strict';
const DUR = 20.0;
const $ = id => document.getElementById(id);
const C = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => C((t - a) / (b - a));
const L = (a, b, p) => a + (b - a) * p;
const eo3 = p => 1 - Math.pow(1 - p, 3);
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const back = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const st = (el, o) => Object.assign(el.style, o);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const LINES = window.LINES, ALLW = LINES.flat();
const wt = (li, k) => LINES[li][k].t;

// ---------- scenes and camera keyframes [t, x, y, zoom] ----------
const SC = [['s1', 0, 4.85], ['s2', 4.85, 7.85], ['s3', 7.85, 10.35], ['s4', 10.35, 11.85], ['s5', 11.85, 16.35], ['s6', 16.35, 18.85], ['s7', 18.85, 20.5]];
const KEYS = [
  [0, 720, 430, 1.75], [.9, 720, 430, 1.3], [1.45, 705, 500, 1.02], [2.0, 660, 520, 1.45], [2.6, 690, 500, 1.3], [3.15, 775, 450, 1.55], [4.5, 720, 500, 1.08],
  [4.95, 540, 360, 1.45], [5.7, 900, 360, 1.45], [7.1, 900, 360, 1.6], [7.6, 720, 450, 1.0],
  [7.95, 470, 390, 1.55], [9.95, 1000, 390, 1.45], [10.25, 720, 500, 1.05],
  [10.4, 720, 495, 1.7], [11.0, 720, 495, 1.25], [11.8, 720, 495, 1.1],
  [11.95, 900, 250, 1.35], [13.2, 620, 360, 1.4], [14.4, 330, 470, 1.55], [14.9, 262, 482, 1.85], [16.2, 600, 470, 1.05],
  [16.45, 720, 290, 1.65], [17.3, 720, 420, 1.25], [18.1, 720, 620, 1.55], [18.75, 720, 430, 1.0],
  [18.95, 720, 450, 1.45], [20.5, 720, 460, 1.15],
];
function camAt(T) {
  let i = 0; while (i < KEYS.length - 1 && KEYS[i + 1][0] <= T) i++;
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const p = a === b ? 0 : eio(P(T, a[0], b[0]));
  return [L(a[1], b[1], p), L(a[2], b[2], p), L(a[3], b[3], p)];
}

// ---------- static builds ----------
// sugar cubes
$('s2cubes').innerHTML = [0, 1, 2, 3].map(i => `<div id="cube${i}" class="abs" style="left:${30 + i * 68}px;top:150px;width:56px;height:56px;border-radius:10px;background:linear-gradient(145deg,#fff,#e9d4d7);box-shadow:0 8px 20px rgba(0,0,0,.35),inset 0 -4px 0 rgba(0,0,0,.08)"></div>`).join('');
// search results
$('s3res').innerHTML = [['Spoon', 'Kitchen sink · just now'], ['Kitchen', '3 items found'], ['Recently found', 'Today']].map(([a, b], i) =>
  `<div class="abs s3row" style="left:24px;top:${20 + i * 66}px;width:852px;height:58px;border-radius:18px;${i === 0 ? 'background:rgba(255,77,94,.18);' : ''}">
    <div class="icon" style="left:10px;top:9px;width:40px;height:40px;border-radius:12px"></div>
    <div class="abs" style="left:66px;top:0;line-height:58px;font-size:24px;font-weight:600">${a}</div>
    <div class="abs" style="right:20px;top:0;line-height:58px;font-size:20px;opacity:.55">${b}</div></div>`).join('');
// dock icons
const DOCK_G = ['M12 2 C12 2 5 10 5 14.5 A7 7 0 0 0 19 14.5 C19 10 12 2 12 2 Z', 'M4 6 h16 v12 h-16 z', 'M12 3 l2.6 6 6.4.6-4.9 4.2 1.5 6.2-5.6-3.4-5.6 3.4 1.5-6.2-4.9-4.2 6.4-.6z', 'M5 12 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M9 10 h.01 M15 10 h.01 M8.5 14.5 q3.5 3 7 0', 'M6 4 h12 v16 l-6 -4 -6 4 z'];
$('s4dock').innerHTML = DOCK_G.map((g, i) => `<div id="dk${i}" class="icon" style="left:${36 + i * 146}px;top:28px;width:128px;height:128px;border-radius:34px"><svg width="64" height="64" viewBox="0 0 24 24"><path d="${g}" fill="${i === 3 ? 'none' : '#fff'}" stroke="#fff" stroke-width="${i === 3 ? 2 : 0}" stroke-linecap="round"/></svg></div>`).join('');
// chip grid (camera pans across it and lands on "Your smile")
const ROOMS = ['Kitchen', 'Window seat', 'Hallway', 'Staircase', 'Balcony', 'Doorway', 'Bookshelf', 'Old sofa', 'Garden', 'Bathroom', 'Mirror', 'Coat rack', 'Desk lamp', 'Bedroom', 'Fridge door', 'Your smile', 'Rooftop', 'Coffee table', 'Front porch', 'Record player', 'Attic', 'Hall closet', 'Laundry', 'Piano', 'Back door', 'Fireplace', 'Plant shelf', 'Corner chair', 'Rug', 'Wardrobe', 'Doorbell', 'Sink', 'Clock', 'Curtains', 'Driveway'];
$('s5grid').innerHTML = ROOMS.map((r, i) => {
  const c = i % 5, row = Math.floor(i / 5);
  const x = 40 + c * 300 + (row % 2) * 120, y = 120 + row * 110;
  return `<div id="chip${i}" class="chip" style="left:${x}px;top:${y}px"><i></i>${r}</div>`;
}).join('');
const SMILE = ROOMS.indexOf('Your smile');

// ---------- water ----------
const wctx = $('water').getContext('2d'), wimg = wctx.createImageData(288, 216);
const cctx = $('caust').getContext('2d'), cimg = cctx.createImageData(288, 216);
function drawWater(T) {
  const d = wimg.data, e = cimg.data;
  for (let y = 0; y < 216; y++) for (let x = 0; x < 288; x++) {
    const u = x / 288 * 7, v = y / 216 * 5.25;
    const a = Math.sin(u * 1.7 + T * .9 + Math.sin(v * 1.3 + T * .6)) + Math.sin(v * 2.1 - T * .7 + Math.sin(u * 1.1 - T * .5));
    const b = Math.sin((u + v) * 1.4 + T * .5) + Math.sin((u - v) * 1.9 - T * .8);
    const c0 = 1 - Math.abs(Math.sin((a + b) * 1.15)), c = Math.pow(c0, 3) * .6;
    const depth = y / 216, base = .07 + .2 * (1 - depth) * (1 - depth);
    const i = (y * 288 + x) * 4;
    d[i] = 255 * Math.min(1, base * .9 + c * (.75 - .4 * depth)); d[i + 1] = 255 * Math.min(1, base * .12 + c * (.28 - .15 * depth)); d[i + 2] = 255 * Math.min(1, base * .18 + c * (.32 - .18 * depth)); d[i + 3] = 255;
    const k = Math.pow(c0, 8);                                      // sharper caustic light for the overlay on the UI
    e[i] = 255 * k; e[i + 1] = 130 * k; e[i + 2] = 140 * k; e[i + 3] = 255;
  }
  wctx.putImageData(wimg, 0, 0); cctx.putImageData(cimg, 0, 0);
}
const mctx = $('motes').getContext('2d');
const MOTES = (() => { const r = rng(5); return Array.from({ length: 70 }, () => ({ x: r() * 1440, y: r() * 1080, s: 2 + r() * 9, sp: 8 + r() * 30, ph: r() * 6 })); })();
function drawMotes(T) {
  mctx.clearRect(0, 0, 1440, 1080);
  for (const m of MOTES) {
    const y = ((m.y - T * m.sp) % 1080 + 1080) % 1080, x = m.x + Math.sin(T * .6 + m.ph) * 20;
    const g = mctx.createRadialGradient(x, y, 0, x, y, m.s * 2);
    g.addColorStop(0, `rgba(255,190,200,${.35 * (m.s / 11)})`); g.addColorStop(1, 'rgba(255,190,200,0)');
    mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, m.s * 2, 0, Math.PI * 2); mctx.fill();
  }
}
const gctx = $('grain').getContext('2d'), gimg = gctx.createImageData(480, 360);
function drawGrain(f) { const r = rng(f * 9973 + 1), d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

// ---------- lyrics (lower third, rising from the water) ----------
function renderLyrics(T) {
  let li = 0; LINES.forEach((l, i) => { if (T >= l[0].t - .15) li = i; });
  const ws = LINES[li];
  let wi = 0; ws.forEach((w, k) => { if (T >= w.t - .05) wi = k; });
  $('lyr').innerHTML = ws.map((w, k) => {
    const a = eo3(P(T, w.t - .12, w.t + .3)), shown = T >= w.t - .12, cur = k === wi;
    const bob = Math.sin(T * 1.8 + k * .9) * 4;
    return `<span class="w" style="visibility:${shown ? 'visible' : 'hidden'};opacity:${a * (cur ? 1 : .75)};transform:translateY(${(1 - a) * 50 + bob}px);filter:blur(${(1 - a) * 10}px);text-shadow:${cur ? '0 0 26px rgba(255,200,205,.7)' : '0 0 10px rgba(0,0,0,.4)'}">${w.w}</span>`;
  }).join('');
}

// ---------- scenes ----------
function sceneFX(id, a, b, T) {
  const el = $(id), on = T >= a - .01 && T < b + .3;
  el.style.display = on ? 'block' : 'none';
  if (!on) return false;
  const pin = eo3(P(T, a, a + .4)), pout = P(T, b - .05, b + .3);
  st(el, { opacity: pin * (1 - pout), filter: `blur(${(1 - pin) * 18 + pout * 22}px)`, transform: `scale(${L(.86, 1, pin) * (1 + pout * .25)})`, transformOrigin: '720px 470px' });
  return true;
}
function render(T) {
  const frame = Math.round(T * 30);
  drawWater(T); drawMotes(T);
  st($('rays'), { transform: `translateX(${Math.sin(T * .3) * 60}px) skewX(${Math.sin(T * .2) * 4}deg)` });
  $('turb').setAttribute('baseFrequency', `${(.009 + .002 * Math.sin(T * .8)).toFixed(4)} ${(.04 + .012 * Math.sin(T * 1.1 + 1)).toFixed(4)}`);
  $('turbUI').setAttribute('baseFrequency', `${(.004 + .001 * Math.sin(T * .6)).toFixed(4)} ${(.012 + .003 * Math.sin(T * .9)).toFixed(4)}`);
  let flash = 0;
  for (const [, a] of SC) if (a > 0 && T >= a && T < a + .3) flash = Math.max(flash, .22 * Math.exp(-(T - a) / .08));

  // S1 — glowing icon, then the phone with the window-seat card
  if (sceneFX('s1', 0, 4.85, T)) {
    const ic = P(T, .05, .6), toPhone = eio(P(T, .95, 1.45));
    st($('s1icon'), { opacity: C(ic * 2) * (1 - toPhone), filter: `blur(${(1 - eo3(ic)) * 16}px)`, transform: `scale(${L(.7, 1, back(ic, 1.6)) * L(1, .3, toPhone)}) translateY(${toPhone * -40}px)` });
    const ph = eo3(P(T, 1.0, 1.6));
    st($('s1phone'), { opacity: ph, transform: `perspective(1600px) translateY(${(1 - ph) * 160}px) rotateX(${(1 - ph) * 25 + 6}deg) rotateY(${Math.sin(T * .7) * 6}deg)` });
    const ch = Math.exp(-Math.max(0, T - wt(0, 1)) / .25) * (T >= wt(0, 1) ? 1 : 0), wn = Math.exp(-Math.max(0, T - wt(0, 6)) / .3) * (T >= wt(0, 6) ? 1 : 0);
    $('s1chair').setAttribute('stroke-width', 3 + 5 * ch);
    $('s1win').style.filter = `drop-shadow(0 0 ${8 + 40 * wn}px rgba(255,180,190,${.4 + .5 * wn}))`;
    $('s1light').setAttribute('fill', `rgba(255,190,200,${.15 + .25 * (.5 + .5 * Math.sin(T * 2))})`);
  }
  // S2 — napkin folds, sugar cubes line up on the words
  if (sceneFX('s2', 4.85, 7.85, T)) {
    const n = eo3(P(T, wt(1, 0), wt(1, 1) + .2));
    st($('s2nap'), { transform: `perspective(600px) rotateX(${(1 - n) * 70}deg) scale(${.8 + .2 * back(n)})`, opacity: C(n * 2) });
    for (let i = 0; i < 4; i++) { const p = P(T, wt(1, 2 + i), wt(1, 2 + i) + .25); st($('cube' + i), { opacity: C(p * 3), transform: `translateY(${(1 - eo3(p)) * -120}px) rotate(${(1 - eo3(p)) * 40}deg) scale(${back(p, 2)})` }); }
    ['s2a', 's2b', 's2c'].forEach((id, i) => { const p = eo3(P(T, 4.9 + i * .12, 5.3 + i * .12)); st($(id), { transform: `translateY(${(1 - p) * 60}px)`, opacity: p }); });
  }
  // S3 — search bar typing the line, result on "sink"
  if (sceneFX('s3', 7.85, 10.35, T)) {
    let s = ''; LINES[2].forEach(w => { if (T >= w.t) s += (s ? ' ' : '') + w.w; });
    $('s3txt').innerHTML = (s ? s : '<span style="opacity:.4">Search…</span>') + `<span style="color:#ff5c6e">${frame % 14 < 7 ? '|' : ''}</span>`;
    const rp = eo3(P(T, wt(2, 6), wt(2, 6) + .35));
    st($('s3res'), { opacity: rp, transform: `translateY(${(1 - rp) * -40}px) scaleY(${.6 + .4 * rp})`, transformOrigin: '50% 0' });
  }
  // S4 — dock bounces on the laugh
  if (sceneFX('s4', 10.35, 11.85, T)) {
    DOCK_G.forEach((_, i) => {
      const t0 = wt(3, 2) + i * .06, d = T - t0;
      const j = d > 0 ? Math.abs(Math.sin(d * 14)) * Math.exp(-d / .25) * 60 : 0;
      st($('dk' + i), { transform: `translateY(${-j}px) scale(${i === 3 && d > 0 ? 1 + .15 * Math.exp(-d / .3) : 1})` });
    });
    const dp = eo3(P(T, 10.4, 10.8)); st($('s4dock'), { transform: `translateY(${(1 - dp) * 80}px)` });
  }
  // S5 — chip grid, glow lands on "Your smile"
  if (sceneFX('s5', 11.85, 16.35, T)) {
    ROOMS.forEach((_, i) => {
      const el = $('chip' + i), p = eo3(P(T, 11.9 + (i % 7) * .04 + Math.floor(i / 5) * .05, 12.4 + (i % 7) * .04 + Math.floor(i / 5) * .05));
      const smile = i === SMILE, g = smile ? eo3(P(T, wt(4, 5), wt(4, 5) + .3)) : 0;
      st(el, { opacity: p * (smile ? 1 : 1 - .5 * g), transform: `translateY(${(1 - p) * 30}px) scale(${1 + .25 * g})`, background: smile && g > 0 ? `rgba(255,77,94,${.3 + .5 * g})` : '',
        boxShadow: smile ? `0 0 ${60 * g}px rgba(255,77,94,${.8 * g})` : 'none', color: smile && g > .5 ? '#fff' : '' });
    });
  }
  // S6 — welcome screen, glowing button
  if (sceneFX('s6', 16.35, 18.85, T)) {
    const cp = eo3(P(T, 16.4, 16.9)); st($('s6card'), { transform: `perspective(1400px) rotateX(${(1 - cp) * 20}deg) translateY(${(1 - cp) * 80}px)` });
    const bg = Math.exp(-Math.max(0, T - wt(5, 5)) / .4) * (T >= wt(5, 5) ? 1 : 0);
    st($('s6btn'), { boxShadow: `0 0 ${30 + 90 * bg}px rgba(255,200,210,${.35 + .6 * bg})`, transform: `scale(${1 + .06 * bg})` });
  }
  // S7 — wordmark
  if (sceneFX('s7', 18.85, 20.5, T)) {
    const m = eo3(P(T, 18.95, 19.5));
    st($('s7mark'), { opacity: m, filter: `blur(${(1 - m) * 16}px) drop-shadow(0 0 30px rgba(255,200,210,.6)) drop-shadow(0 0 80px rgba(255,60,90,.5))`, letterSpacing: L(30, -3, m) + 'px' });
    st($('s7url'), { opacity: .55 * P(T, 19.4, 19.8) });
  }

  // tracking camera + micro push on every word
  let [cx, cy, z] = camAt(T);
  for (const w of ALLW) if (T >= w.t && T - w.t < .5) z *= 1 + .025 * Math.exp(-(T - w.t) / .12);
  cx += Math.sin(T * .5) * 8; cy += Math.cos(T * .4) * 6;
  st($('cam'), { transform: `translate(${720 - cx * z}px,${470 - cy * z}px) scale(${z})` });
  renderLyrics(T);
  $('flash').style.opacity = flash;
  $('stage').style.opacity = 1 - P(T, 19.75, 20) * .9;
  drawGrain(frame);
}
window.render = render;
window.DUR = DUR;
window.ready = document.fonts.ready;
