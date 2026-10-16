// "Baddies Airlines" — clean UI edit on the "Baddies" sound. Every frame is a pure function of time: render(T).
'use strict';
const DUR = 18.1;
const $ = id => document.getElementById(id);
const C = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => C((t - a) / (b - a));
const L = (a, b, p) => a + (b - a) * p;
const eo3 = p => 1 - Math.pow(1 - p, 3);
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const back = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const st = (el, o) => Object.assign(el.style, o);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const BEATS = []; for (let b = .47; b < DUR; b += .5) BEATS.push(b);   // 120 BPM
const lastBeat = T => { let b = -9; for (const x of BEATS) if (x <= T) b = x; return b; };

// ---------- lyrics: 4 s lines split in two 2 s halves, ad-libs at the end of each half ----------
function words(str, a, b) { const w = str.split(' '); return w.map((x, i) => [x, a + (b - a) * i / Math.max(1, w.length - 1)]); }
function line(t, A, ax, B, bx) {
  return { t, w: [...words(A, t + .05, t + 1.35), ...(ax ? [[ax, t + 1.6, 1]] : []), ...words(B, t + 2.05, t + 3.35), ...(bx ? [[bx, t + 3.6, 1]] : [])] };
}
const LINES = [
  { t: 0, w: [...words('Maakt niet uit, wil ze allemaal', 0, .8), ['(ah)', .95, 1]] },
  { t: 1.1, w: words("(M'n ladies zijn allemaal aan)", 1.15, 2.1).map(w => [...w, 1]) },
  line(2.4, 'Ik heb baddies in Bélgica', '(ey),', 'baddies in Holanda', '(ey)'),
  line(6.4, 'Baddies ook in França', '(ey),', 'baddies in España', ''),
  line(10.4, 'Keke is congolaise', "('laise),", 'Yasmina is marocaine', '(ey)'),
  line(14.4, 'Beyza is Turkiye', "('ye),", 'maar ik ben malaisien', ''),
  { t: 99, w: words('Eh, oh (ah)', 99, 99) },
  { t: 99, w: words("Waar zijn m'n baddies van Bélgica?", 99, 99) },
];
const lyr = $('lyr');
const lineEls = LINES.map(Lx => {
  const d = document.createElement('div'); d.className = 'ln';
  d.innerHTML = Lx.w.map(([w, , ad]) => `<span class="${ad ? 'ad' : ''}">${w}</span>`).join(' ');
  lyr.appendChild(d); return d;
});

// ---------- wallet passes ----------
const PASSES = [
  { t: 2.4, ey: 4.0, from: 'HOME', to: 'BRU', country: 'Bélgica', flag: '🇧🇪', grad: 'linear-gradient(135deg,#141414 0%,#3b2f05 45%,#c8102e 100%)', gate: 'B1' },
  { t: 4.4, ey: 6.0, from: 'BRU', to: 'AMS', country: 'Holanda', flag: '🇳🇱', grad: 'linear-gradient(135deg,#ae1c28 0%,#c9505b 40%,#21468b 100%)', gate: 'A7' },
  { t: 6.4, ey: 8.0, from: 'AMS', to: 'CDG', country: 'França', flag: '🇫🇷', grad: 'linear-gradient(135deg,#0055a4 0%,#3b6fd0 50%,#ef4135 100%)', gate: 'F2' },
  { t: 8.4, ey: 9.85, from: 'CDG', to: 'MAD', country: 'España', flag: '🇪🇸', grad: 'linear-gradient(135deg,#aa151b 0%,#d4452b 50%,#f1bf00 100%)', gate: 'E5' },
];
const passEls = PASSES.map((p, i) => {
  const d = document.createElement('div'); d.className = 'pass';
  d.style.background = p.grad;
  d.innerHTML = `<div class="gloss"></div><div class="air">BADDIES AIRLINES ✈</div><div class="gate">GATE ${p.gate}</div>
    <div class="route">${p.from}<span>✈</span>${p.to}</div><div class="country">${p.country}</div><div class="flag">${p.flag}</div>
    <div class="barcode"></div><div class="seat">SEAT 1A · 0${i + 1}:00</div>
    <div class="stamp"><div>BADDIE</div><b>EY</b><div>APPROVED</div></div>`;
  $('wallet').appendChild(d); return d;
});

// ---------- contacts ----------
const CONTACTS = [
  { t: 10.4, name: 'Keke', flag: '🇨🇩', sub: 'congolaise', chips: [['🇨🇩 Kinshasa', '#e3efff'], ["'laise", '#fff3cc'], ['baddie ✨', '#ffe0ea']] },
  { t: 12.4, name: 'Yasmina', flag: '🇲🇦', sub: 'marocaine', chips: [['🇲🇦 Casablanca', '#dcffe4'], ['ey', '#fff3cc'], ['baddie ✨', '#ffe0ea']] },
  { t: 14.4, name: 'Beyza', flag: '🇹🇷', sub: 'Türkiye', chips: [['🇹🇷 Istanbul', '#ffe3e3'], ["'ye", '#fff3cc'], ['baddie ✨', '#ffe0ea']] },
];
const contactEls = CONTACTS.map(c => {
  const d = document.createElement('div'); d.className = 'contact';
  d.innerHTML = `<div class="av">${c.flag}</div><div class="nm">${c.name}</div><div class="sub">${c.sub}</div>
    <div class="chips">${c.chips.map(([s, col]) => `<div class="chip" style="background:${col}">${s}</div>`).join('')}</div><div class="btn">✈ Book a flight</div>`;
  $('contacts').appendChild(d); return d;
});

const TYPED = 'baddies near me';
window.EVENTS = [
  ...[...TYPED].map((_, i) => ({ t: 1.15 + i * .055, type: 'key' })), { t: 2.2, type: 'enter' },
  ...PASSES.map(p => ({ t: p.t, type: 'swoosh' })), ...PASSES.map(p => ({ t: p.ey, type: 'stamp' })),
  ...PASSES.slice(1).map(p => ({ t: p.t - .35, type: 'plane' })),
  ...CONTACTS.map(c => ({ t: c.t, type: 'swoosh' })), ...CONTACTS.map(c => ({ t: c.t + 1.3, type: 'click' })),
  { t: 16.4, type: 'twist' }, { t: 17.65, type: 'pop' },
];

// ---------- grain ----------
const gctx = $('grain').getContext('2d'), gimg = gctx.createImageData(360, 640);
function drawGrain(f) { const r = rng(f * 9973 + 1), d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

// ---------- render ----------
function render(T) {
  const frame = Math.round(T * 30);
  const mode = T < 1.0 ? 'dark' : T < 16.4 ? 'light' : 'purple';
  let shake = 0, zoom = 1 + .012 * Math.exp(-(T - lastBeat(T)) / .1), flash = 0;

  // background
  const bgCol = mode === 'dark' ? '#05070d' : mode === 'light' ? (T < 10.3 ? '#eef1f7' : '#f1eefb') : '#2a0a78';
  $('stage').style.background = bgCol;
  const bc = mode === 'dark' ? ['#0b2a66', '#071a40'] : mode === 'light' ? (T < 10.3 ? ['#bcd3ff', '#ffd1e3'] : ['#d6c8ff', '#c8e6ff']) : ['#7b2cff', '#ff4fb8'];
  st($('b1'), { background: bc[0], left: 200 + Math.sin(T * .6) * 160 + 'px', top: 200 + Math.cos(T * .5) * 160 + 'px', opacity: .8 });
  st($('b2'), { background: bc[1], left: -100 + Math.cos(T * .7) * 140 + 'px', top: 900 + Math.sin(T * .4) * 180 + 'px', opacity: .7 });
  if (T >= 1.0 && T < 1.2) flash = Math.exp(-(T - 1.0) / .06);
  if (T >= 16.4 && T < 16.7) flash = Math.max(flash, .9 * Math.exp(-(T - 16.4) / .07));

  // hook: two blue shapes glide and merge into the search bar
  const m = eio(P(T, .15, .95));
  st($('shapeA'), { display: T < 1.0 ? '' : 'none', left: L(330, 120, m) + 'px', top: L(560, 640, m) + 'px', width: L(140, 840, m) + 'px', height: L(48, 120, m) + 'px', borderRadius: L(24, 60, m) + 'px', opacity: P(T, 0, .15) });
  st($('shapeB'), { display: T < 1.0 ? '' : 'none', left: L(620, 540, m) + 'px', top: L(700, 640, m) + 'px', width: L(110, 120, m) + 'px', height: L(110, 120, m) + 'px', borderRadius: L(30, 60, m) + 'px', opacity: P(T, .05, .2) * (1 - m) });
  const barOut = eio(P(T, 2.35, 2.75)), press = Math.exp(-Math.max(0, T - 2.2) / .08) * (T >= 2.2 ? 1 : 0);
  st($('bar'), { display: T >= 1.0 && T < 2.8 ? '' : 'none', transform: `translateY(${-barOut * 520}px) scale(${(1 - .04 * press) * (1 - .25 * barOut)})`, opacity: 1 - barOut });
  const n = Math.floor(P(T, 1.15, 1.15 + TYPED.length * .055) * TYPED.length);
  $('barTxt').innerHTML = n ? `<span style="color:#0d1220">${TYPED.slice(0, n)}</span><span style="color:#1d8cff">${frame % 14 < 7 || n < TYPED.length ? '|' : ''}</span>` : 'search...';
  const cap = P(T, .05, .3) * (1 - P(T, 2.2, 2.5));
  st($('caption'), { opacity: cap, transform: `translateX(-50%) translateY(${(1 - eo3(P(T, .05, .35))) * -40}px)` });

  // wallet stack
  const wOut = eio(P(T, 10.15, 10.6));
  st($('wallet'), { display: T >= 2.3 && T < 10.7 ? '' : 'none', transform: `translateY(${-wOut * 900}px)`, opacity: 1 - wOut });
  PASSES.forEach((p, i) => {
    const el = passEls[i];
    if (T < p.t - .05) { el.style.display = 'none'; return; }
    el.style.display = '';
    const ent = P(T, p.t - .05, p.t + .5);
    let newer = 0; for (let j = i + 1; j < PASSES.length; j++) newer += eo3(P(T, PASSES[j].t - .05, PASSES[j].t + .4));
    const y = L(1900, 560, back(ent, 1.1)) - newer * 118;
    const sc = Math.pow(.95, newer), sway = Math.sin(T * 1.2 + i) * 3;
    st(el, { top: y + 'px', zIndex: 10 + i, filter: `brightness(${1 - .1 * newer})`, opacity: C(1.6 - newer * .4),
      transform: `perspective(1800px) rotateX(${(1 - eo3(ent)) * 35 + 6}deg) rotateY(${sway}deg) scale(${sc})` });
    const sp = P(T, p.ey, p.ey + .12), stamp = el.querySelector('.stamp');
    st(stamp, { opacity: T >= p.ey ? 1 : 0, transform: `rotate(-16deg) scale(${L(2.4, 1, eo3(sp))})` });
    if (T >= p.ey && T - p.ey < .3) { shake = Math.max(shake, 14 * Math.exp(-(T - p.ey) / .07)); zoom += .025 * Math.exp(-(T - p.ey) / .1); }
  });
  // plane flying an arc between destinations
  let route = '';
  for (const p of PASSES.slice(1)) {
    const a = P(T, p.t - .45, p.t + .35); if (a <= 0 || a >= 1) continue;
    const e = eio(a), x0 = 60, y0 = 1120, cx = 360, cy = 120, x1 = 1030, y1 = 380;
    const pt = s => [L(L(x0, cx, s), L(cx, x1, s), s), L(L(y0, cy, s), L(cy, y1, s), s)];
    let d = ''; for (let s = 0; s <= e; s += .02) { const [x, y] = pt(s); d += (d ? ' L' : 'M') + x.toFixed(0) + ',' + y.toFixed(0); }
    const [px, py] = pt(e), [qx, qy] = pt(Math.max(0, e - .02));
    const ang = Math.atan2(py - qy, px - qx) * 180 / Math.PI;
    route += `<path d="${d}" fill="none" stroke="#1d8cff" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 18" opacity="${1 - P(a, .8, 1)}"/>
      <text x="${px}" y="${py}" font-size="74" text-anchor="middle" dominant-baseline="central" transform="rotate(${ang + 45} ${px} ${py})">✈️</text>`;
  }
  $('route').innerHTML = route;

  // contacts
  const showC = T >= 10.3 && T < 16.45;
  $('contacts').style.display = showC ? '' : 'none';
  let cur = null;
  CONTACTS.forEach((c, i) => {
    const el = contactEls[i];
    if (!showC || T < c.t - .1) { el.style.display = 'none'; return; }
    el.style.display = '';
    const ent = P(T, c.t - .1, c.t + .45);
    let newer = 0; for (let j = i + 1; j < CONTACTS.length; j++) newer += eo3(P(T, CONTACTS[j].t - .1, CONTACTS[j].t + .35));
    const x = L(1200, 150, back(ent, 1.2)) - newer * 40, y = 560 - newer * 150;
    st(el, { left: x + 'px', top: y + 'px', zIndex: 10 + i, opacity: C(1.5 - newer * .45), filter: `brightness(${1 - .06 * newer})`,
      transform: `rotate(${(1 - eo3(ent)) * 8 - newer * 3}deg) scale(${Math.pow(.92, newer)})` });
    const booked = T >= c.t + 1.3, bp = Math.exp(-Math.max(0, T - c.t - 1.3) / .1) * (booked ? 1 : 0);
    const btn = el.querySelector('.btn');
    btn.innerHTML = booked ? '✓ Flight booked' : '✈ Book a flight';
    st(btn, { background: booked ? '#22c55e' : '#1d8cff', transform: `scale(${1 - .08 * bp})` });
    if (newer < .5) cur = c;
  });
  // cursor clicks "book a flight" on the front card
  if (showC && cur) {
    const t0 = cur.t, mv = eo3(P(T, t0 + .7, t0 + 1.2)), out = eio(P(T, t0 + 1.45, t0 + 1.9));
    const cx = L(L(900, 300, mv), 980, out), cy = L(L(1240, 950, mv), 1300, out);
    const click = Math.exp(-Math.max(0, T - t0 - 1.3) / .08) * (T >= t0 + 1.3 ? 1 : 0);
    st($('cursor'), { display: '', left: cx + 'px', top: cy + 'px', opacity: P(T, t0 + .6, t0 + .75) * (1 - P(T, t0 + 1.8, t0 + 1.95)), transform: `scale(${1 - .18 * click})`, zIndex: 50 });
  } else $('cursor').style.display = 'none';

  // twist: "maar ik ben malaisien"
  const tw = T >= 16.4;
  $('twist').style.display = tw ? 'flex' : 'none';
  if (tw) {
    const fp = P(T, 16.4, 16.9), wp = P(T, 16.95, 17.3);
    st($('bigFlag'), { transform: `perspective(1200px) rotateY(${(1 - eo3(fp)) * 540}deg) scale(${.4 + .6 * back(fp, 1.6)})` });
    st($('bigWord'), { opacity: wp, filter: `blur(${(1 - wp) * 14}px) drop-shadow(0 0 30px rgba(255,255,255,.5))`, transform: `translateY(${(1 - eo3(wp)) * 40}px)` });
    shake = Math.max(shake, 18 * Math.exp(-(T - 16.4) / .1));
  }
  // closing bubble: next lyric as a message (loops back to the start)
  const bb = T >= 17.35;
  $('bubble').style.display = bb ? '' : 'none';
  if (bb) {
    const typing = T < 17.65, bp = P(T, 17.35, 17.55);
    $('bubble').innerHTML = typing ? `<span class="dots">${[0, 1, 2].map(i => `<i style="opacity:${.4 + .6 * Math.abs(Math.sin(T * 9 - i * .8))}"></i>`).join('')}</span>` : "Waar zijn m'n baddies van Bélgica? 🥺";
    st($('bubble'), { fontSize: '40px', transform: `scale(${typing ? back(bp, 2) : back(P(T, 17.65, 17.85), 2.2)})`, transformOrigin: '100% 100%' });
  }

  // lyrics: Apple-Music style scrolling with word-by-word highlight
  let li = 0; LINES.forEach((Lx, i) => { if (T >= Lx.t) li = i; });
  const prevTop = lineEls[Math.max(0, li - 1)].offsetTop, curTop = lineEls[li].offsetTop;
  const sc = eo3(P(T, LINES[li].t, LINES[li].t + .5));
  lyr.style.transform = `translateY(${-L(li ? prevTop : curTop, curTop, sc)}px)`;
  const light = mode === 'light';
  const on = light ? '13,18,32' : '255,255,255';
  lineEls.forEach((el, i) => {
    const d = i - li;
    el.style.filter = d === 0 ? 'none' : `blur(${Math.min(4, Math.abs(d) * 2)}px)`;
    el.style.transform = `scale(${d === 0 ? 1 : .97})`; el.style.transformOrigin = '0 50%';
    [...el.children].forEach((sp, k) => {
      const wt = LINES[i].w[k][1];
      const sung = d < 0 || (d === 0 && T >= wt);
      const a = d === 0 ? (sung ? 1 : .32) : .22;
      const glow = d === 0 && sung && !light ? 'drop-shadow(0 0 14px rgba(255,255,255,.45))' : 'none';
      st(sp, { color: `rgba(${on},${a})`, filter: glow });
    });
  });

  const r = rng(frame * 13 + 7);
  st($('cam'), { transform: `translate(${(r() - .5) * shake}px,${(r() - .5) * shake}px) scale(${zoom})` });
  $('flash').style.opacity = C(flash);
  drawGrain(frame);
}
window.render = render;
window.DUR = DUR;
window.ready = Promise.all([document.fonts.ready]);
