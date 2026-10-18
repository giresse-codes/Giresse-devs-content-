// Underwater lyric video (4:3): crimson caustic water background (blurred), text refracted by moving water,
// words rising out of the water one by one, tracking zoom that follows the sung word.
'use strict';
const DUR = 20.0;
const $ = id => document.getElementById(id);
const C = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => C((t - a) / (b - a));
const L = (a, b, p) => a + (b - a) * p;
const eo3 = p => 1 - Math.pow(1 - p, 3);
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const st = (el, o) => Object.assign(el.style, o);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const LINES = window.LINES;
const lineStart = i => LINES[i][0].t - .15;

// one DOM block per line (+ its reflection), words laid out once so positions can be measured
const text = $('text');
const blocks = LINES.map(ws => {
  const ln = document.createElement('div'); ln.className = 'ln';
  ln.innerHTML = ws.map(w => `<span class="w">${w.w}</span>`).join('');
  const rf = document.createElement('div'); rf.className = 'ln refl';
  rf.innerHTML = ln.innerHTML;
  text.appendChild(rf); text.appendChild(ln);
  return { ln, rf, spans: [...ln.children], rspans: [...rf.children] };
});

// ---------- water background: procedural caustics on a small canvas, blurred up ----------
const wctx = $('water').getContext('2d'), wimg = wctx.createImageData(288, 216);
function drawWater(T) {
  const d = wimg.data;
  for (let y = 0; y < 216; y++) for (let x = 0; x < 288; x++) {
    const u = x / 288 * 7, v = y / 216 * 5.25;
    // two drifting interference layers → caustic network
    const a = Math.sin(u * 1.7 + T * .9 + Math.sin(v * 1.3 + T * .6)) + Math.sin(v * 2.1 - T * .7 + Math.sin(u * 1.1 - T * .5));
    const b = Math.sin((u + v) * 1.4 + T * .5) + Math.sin((u - v) * 1.9 - T * .8);
    let c = 1 - Math.abs(Math.sin((a + b) * 1.15));
    c = Math.pow(c, 3) * .6;
    const depth = y / 216;                                      // lighter near the surface
    const base = .07 + .2 * (1 - depth) * (1 - depth);
    const r = 255 * Math.min(1, base * .9 + c * (.75 - .4 * depth));
    const g = 255 * Math.min(1, base * .12 + c * (.28 - .15 * depth));
    const bl = 255 * Math.min(1, base * .18 + c * (.32 - .18 * depth));
    const i = (y * 288 + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = 255;
  }
  wctx.putImageData(wimg, 0, 0);
}
// floating particles (out of focus)
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

// ---------- camera target for word k of line i (stage coordinates) ----------
function wordCenter(i, k) {
  const b = blocks[i], s = b.spans[k];
  const lb = b.ln.offsetLeft, lt = b.ln.offsetTop - b.ln.offsetHeight / 2;   // .ln is translateY(-50%)
  return [lb + s.offsetLeft + s.offsetWidth / 2, lt + s.offsetTop + s.offsetHeight / 2];
}
function camTarget(i, k) {
  const [wx, wy] = wordCenter(i, k), n = LINES[i].length;
  const prog = n > 1 ? k / (n - 1) : 1;
  const z = L(1.38, 1.08, eo3(prog));                       // pushed in on the first word, pulls back as the line fills
  return [L(wx, 720, .5 + .4 * prog), L(wy, 540, .35 + .5 * prog), z];
}

function render(T) {
  const frame = Math.round(T * 30);
  drawWater(T); drawMotes(T);
  st($('rays'), { transform: `translateX(${Math.sin(T * .3) * 60}px) skewX(${Math.sin(T * .2) * 4}deg)`, opacity: .8 + .2 * Math.sin(T * 1.3) });

  // water refraction on the text: smoothly morphing turbulence
  $('turb').setAttribute('baseFrequency', `${(.009 + .002 * Math.sin(T * .8)).toFixed(4)} ${(.04 + .012 * Math.sin(T * 1.1 + 1)).toFixed(4)}`);
  $('turb2').setAttribute('baseFrequency', `${(.007 + .002 * Math.sin(T * .9)).toFixed(4)} ${(.08 + .02 * Math.sin(T * 1.3)).toFixed(4)}`);

  // current line / word
  let li = 0; LINES.forEach((_, i) => { if (T >= lineStart(i)) li = i; });
  let wi = 0; LINES[li].forEach((w, k) => { if (T >= w.t - .05) wi = k; });
  blocks.forEach((b, i) => {
    const on = i === li, prev = i === li - 1;
    const sink = prev ? P(T, lineStart(li) - .05, lineStart(li) + .28) : 0;
    const vis = on || (prev && sink < 1);
    b.ln.style.display = b.rf.style.display = vis ? '' : 'none';
    if (!vis) return;
    // previous line sinks and blurs away; new words rise out of the water
    st(b.ln, { opacity: (1 - sink) * (1 - sink), filter: `url(#wave) blur(${sink * 14}px) drop-shadow(0 0 18px rgba(255,170,180,.45))`, transform: `translateY(calc(-50% + ${sink * 90}px))` });
    st(b.rf, { opacity: .12 * (1 - sink), filter: 'url(#wave2)', top: (540 + b.ln.offsetHeight + 12 + sink * 90) + 'px' });
    LINES[i].forEach((w, k) => {
      const a = eo3(P(T, w.t - .12, w.t + .3));
      const shown = T >= w.t - .12;
      const cur = on && k === wi;
      const bob = Math.sin(T * 1.8 + k * .9) * 6;
      const lum = on ? (cur ? 1 : k < wi ? .78 : 1) : 1;
      const sty = { visibility: shown ? 'visible' : 'hidden', opacity: a * lum, transform: `translateY(${(1 - a) * 70 + bob}px) scale(${1 + (1 - a) * .08})`,
        filter: `blur(${(1 - a) * 12}px)`, textShadow: cur ? '0 0 30px rgba(255,200,205,.65)' : 'none' };
      st(b.spans[k], sty); st(b.rspans[k], { visibility: sty.visibility, opacity: a, transform: `translateY(${-(1 - a) * 70 - bob}px)` });
    });
  });

  // tracking zoom: ease from the previous word's framing to the current one
  const prevTarget = wi > 0 ? camTarget(li, wi - 1) : (li > 0 ? camTarget(li - 1, LINES[li - 1].length - 1) : [720, 540, 1.0]);
  const curTarget = camTarget(li, wi);
  const tw = LINES[li][wi].t - .05, e = eio(P(T, tw, tw + .45));
  let [cx, cy, z] = [0, 1, 2].map(j => L(prevTarget[j], curTarget[j], e));
  // gentle float + intro push from wide
  const intro = eio(P(T, 0, .9));
  z = L(.92, z, intro); cx = L(720, cx, intro); cy = L(540, cy, intro);
  cx += Math.sin(T * .5) * 8; cy += Math.cos(T * .4) * 6;
  const outro = P(T, 19.4, 20);
  st($('cam'), { transform: `translate(${720 - cx * z}px,${540 - cy * z}px) scale(${z})`, opacity: 1 - outro * .6 });
  $('stage').style.opacity = 1 - P(T, 19.75, 20) * .9;
  drawGrain(frame);
}
window.render = render;
window.DUR = DUR;
window.ready = document.fonts.ready;
