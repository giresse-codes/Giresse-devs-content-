// Cinematic lyric video (style of the "prosper" reference): black + soft green glow, floating tiles with depth of field,
// clean white type revealed word by word (blur → sharp, dim → bright = karaoke), key words in a wide wordmark font.
'use strict';
const DUR = 18.089;
const QS = new URLSearchParams(location.search), VW = +(QS.get('w') || 1080), VH = +(QS.get('h') || 1920);
const TY = VH > VW ? 1080 : Math.round(VH * .56);           // lyric centre line
{
  const css = document.createElement('style');
  css.textContent = `html,body,#stage,.layer{width:${VW}px!important;height:${VH}px!important}#lines{left:60px!important;width:${VW - 120}px!important;top:${TY}px!important}#mark{width:${VW}px!important;top:${TY - 100}px!important}#space{perspective-origin:${VW / 2}px ${VH / 2}px!important}#cam{transform-origin:${VW / 2}px ${TY}px}`;
  document.head.appendChild(css);
}
const $ = id => document.getElementById(id);
const C = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => C((t - a) / (b - a));
const L = (a, b, p) => a + (b - a) * p;
const eo3 = p => 1 - Math.pow(1 - p, 3);
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const st = (el, o) => Object.assign(el.style, o);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const norm = w => w.toLowerCase().replace(/[(),.?']/g, '');
const FLAG = { bélgica: '🇧🇪', holanda: '🇳🇱', frança: '🇫🇷', españa: '🇪🇸', keke: '🇨🇩', yasmina: '🇲🇦', beyza: '🇹🇷', malaisien: '🇲🇾' };
const KEYS = new Set([...Object.keys(FLAG), 'baddies', 'congolaise', 'marocaine', 'turkiye']);
const W = window.WORDS.map((w, i) => ({ ...w, i, key: KEYS.has(norm(w.w)), flag: FLAG[norm(w.w)] || null }));
const segs = [...new Set(W.map(w => w.seg))];
// display groups: a main segment plus the ad-lib that follows it
const GROUPS = [];
for (const s of segs) {
  const ws = W.filter(w => w.seg === s);
  if (ws[0].ad && GROUPS.length && s !== 2) GROUPS[GROUPS.length - 1].push(...ws); else GROUPS.push([...ws]);
}
const gStart = g => g[0].t - .08;

// floating tiles: flags of the song + plain glass covers, placed in depth
const space = $('space');
const TILE_EM = ['🇧🇪', '🇳🇱', '🇫🇷', '🇪🇸', '🇨🇩', '🇲🇦', '🇹🇷', '🇲🇾', '', '', '', '', '', ''];
const TILES = TILE_EM.map((em, i) => {
  const r = rng(i * 101 + 9);
  const d = document.createElement('div'); d.className = 'tile';
  const s = 170 + r() * 120;
  const hue = [140, 150, 160, 120, 0, 0][i % 6];
  d.style.width = d.style.height = s + 'px';
  d.style.background = em ? '#131815' : `linear-gradient(${r() * 360}deg,hsl(${hue},45%,${14 + r() * 12}%),hsl(${hue + 20},35%,${6 + r() * 8}%))`;
  d.innerHTML = (em ? `<div class="em">${em}</div>` : '') + '<div class="sh"></div>';
  space.appendChild(d);
  // positions around the text block, avoiding the centre band
  const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
  const portrait = VH > VW, band = portrait ? 220 : 150;
  let y = portrait ? 260 + row * 230 + r() * 90 : 90 + row * (VH - 180) / 6 + r() * 50;
  if (Math.abs(y - TY) < band) y = y < TY ? TY - band - r() * 100 : TY + band + r() * 100;   // keep the lyric band clear
  const x = VW / 2 + side * (portrait ? 250 + r() * 230 : 330 + r() * (VW / 2 - 380));
  return { el: d, em, s: portrait ? s : s * .8, x, y, z: -200 - r() * 900, ph: r() * 6, sp: .3 + r() * .4 };
});

const gctx = $('grain').getContext('2d'), gimg = gctx.createImageData(360, 640);
function drawGrain(f) { const r = rng(f * 9973 + 1), d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

function render(T) {
  const frame = Math.round(T * 30);
  // ---- hook: grey haze flashes into the scene, tiles rush in from depth ----
  const open = eio(P(T, 0, 1.1));
  st($('glow'), { opacity: .5 + .5 * open + .08 * Math.sin(T * 2) });
  // current flagged word pulls its tile forward
  let focusFlag = null, fd = 9;
  for (const w of W) if (w.flag && T >= w.t && T - w.t < 1.6) { focusFlag = w.flag; fd = T - w.t; }
  const end = P(T, 16.3, 16.9);                       // finale: tiles drift away, wordmark
  TILES.forEach((t, i) => {
    const drift = Math.sin(T * t.sp + t.ph);
    let z = L(-2600, t.z, open) + T * 22, x = t.x + drift * 26, y = t.y + Math.cos(T * t.sp * .8 + t.ph) * 22;
    let focus = 0;
    if (focusFlag && t.em === focusFlag) { focus = eo3(P(fd, 0, .45)) * (1 - P(fd, 1.2, 1.6)); }
    z = L(z, 260, focus); x = L(x, VW / 2, focus * .55); y = L(y, TY - (VH > VW ? 440 : 290), focus * .7);
    z -= end * 1600;
    const blur = Math.min(14, Math.abs(z - 0) / 70) * (1 - focus);
    st(t.el, { transform: `translate3d(${x - t.s / 2}px,${y - t.s / 2}px,${z}px) rotateY(${(VW / 2 - x) / 30}deg) rotateX(${drift * 6}deg)`,
      filter: `blur(${blur}px) brightness(${.55 + .45 * focus + .15 * (1 + z / 1100)})`, opacity: C(open * 1.4) * (1 - end * .8), zIndex: Math.round(z + 3000),
      boxShadow: focus > .1 ? `0 30px 70px rgba(0,0,0,.6),0 0 ${80 * focus}px rgba(30,215,96,${.5 * focus})` : '0 30px 70px rgba(0,0,0,.6)' });
  });

  // ---- lyrics: one group at a time, word by word ----
  let gi = 0; GROUPS.forEach((g, i) => { if (T >= gStart(g)) gi = i; });
  const g = GROUPS[gi], next = GROUPS[gi + 1];
  const out = next ? P(T, gStart(next) - .16, gStart(next)) : 0;
  let h = '<div class="ln">';
  for (const w of g) {
    const fs = w.ad ? 40 : w.key ? Math.min(92, (VW - 200) / (w.w.length * .95)) : 84;
    const cls = w.ad ? 'w ad' : w.key ? 'w k' : 'w';
    if (T < w.t - .12) { h += `<span class="${cls}" style="font-size:${fs}px;visibility:hidden">${w.w}</span>`; continue; }
    // appear slightly before it is sung (dim, blurred), turn bright exactly on the word
    const a = eo3(P(T, w.t - .12, w.t + .05)), sung = eo3(P(T, w.t, w.t + .14));
    const col = w.ad ? `rgba(255,255,255,${.35 + .2 * sung})` : `rgba(255,255,255,${.28 + .72 * sung})`;
    const glow = w.ad ? '' : w.key ? `drop-shadow(0 0 ${18 * sung}px rgba(255,255,255,.55)) drop-shadow(0 0 ${46 * sung}px rgba(30,215,96,.65))` : `drop-shadow(0 0 ${10 * sung}px rgba(255,255,255,.35))`;
    const pulse = w.key ? 1 + .08 * Math.exp(-Math.max(0, T - w.t) / .12) * (T >= w.t ? 1 : 0) : 1;
    h += `<span class="${cls}" style="font-size:${fs}px;color:${col};opacity:${a};filter:blur(${(1 - a) * 10}px) ${glow};transform:translateY(${(1 - a) * 22}px) scale(${pulse})">${w.w}</span>`;
  }
  h += '</div>';
  $('lines').innerHTML = h;
  st($('lines'), { opacity: 1 - out, filter: `blur(${out * 12}px)`, transform: `translateY(calc(-50% - ${out * 40}px))` });

  // ---- finale wordmark (like the reference's end card) ----
  const mk = P(T, 17.35, 17.8);
  $('mark').textContent = mk > 0 ? 'BADDIES' : '';
  st($('mark'), { opacity: mk, filter: `blur(${(1 - mk) * 16}px) drop-shadow(0 0 30px rgba(255,255,255,.55)) drop-shadow(0 0 80px rgba(30,215,96,.5))`, letterSpacing: L(40, 12, eo3(mk)) + 'px' });
  if (T >= 17.1) { const lo = P(T, 17.1, 17.32); st($('lines'), { opacity: 1 - lo, filter: `blur(${lo * 14}px)` }); }

  // ---- camera: slow dolly + tiny beat breath; soft flash on the hook ----
  const beat = Math.exp(-(((T - .47) % .5 + .5) % .5) / .12);
  st($('cam'), { transform: `scale(${1 + .006 * beat + .02 * (1 - open)})` });
  $('flash').style.opacity = T < .5 ? .55 * (1 - P(T, .15, .5)) : 0;
  st($('stage'), { background: T < .3 ? `rgb(${L(120, 0, P(T, 0, .3))},${L(120, 0, P(T, 0, .3))},${L(120, 0, P(T, 0, .3))})` : '#000' });
  drawGrain(frame);
}
window.render = render;
window.DUR = DUR;
window.ready = document.fonts.ready;
