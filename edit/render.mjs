// Frame renderer: drives index.html in headless Chromium and writes one JPEG per frame.
// usage: node render.mjs <outDir> [fps=30] [workers=4]            -> full sequence
//        node render.mjs <outDir> --times 0.5,3.2,7.9              -> stills for preview
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const ti = process.argv.indexOf('--times');
const fps = ti < 0 ? +(process.argv[3] || 30) : 30;
const workers = ti < 0 ? +(process.argv[4] || 4) : 1;

const browser = await pw.chromium.launch({ args: ['--disable-web-security', '--allow-file-access-from-files'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto(pathToFileURL(path.join(here, 'index.html')).href);
  await page.evaluate(async () => {
    const fams = ['900 100px Nunito', '800 100px Nunito', 'italic 100px "Instrument Serif"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"',
      '500 40px "Space Grotesk"', '700 40px "Space Grotesk"', '100px Anton', '500 40px Inter', '700 100px UnifrakturCook', '700 100px "Grenze Gotisch"', '30px IPAGothic'];
    await Promise.all(fams.map(f => document.fonts.load(f, 'AaZz09→✓•')));
    await window.ready;
  });
  return page;
}

if (ti >= 0) {
  const page = await openPage();
  for (const t of process.argv[ti + 1].split(',').map(Number)) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: path.join(out, `t_${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 85 });
  }
} else {
  const dur = await (await openPage()).evaluate(() => window.DUR);
  const n = Math.round(dur * fps);
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await openPage();
    while (next < n) {
      const f = next++;
      await page.evaluate(t => window.render(t), f / fps);
      await page.screenshot({ path: path.join(out, `f_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
      if (++done % 60 === 0) console.log(`${done}/${n} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  console.log(`done ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
