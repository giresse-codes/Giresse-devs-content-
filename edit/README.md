# Giresse — Portfolio edit (TikTok 1080×1920 · 30 fps · 26 s)

Final file: `output/giresse_portfolio_edit.mp4`

| Time | Scene |
|---|---|
| 0–3 s | **Intro**: forward camera move into the SLSD logo + "GIRESSE", audio *slowed + reverb* (0.75×), star streaks, flare, white flash → drop |
| 3–6.5 s | Hook: aria-style lyrics (flashing black/white backgrounds) + "→ Web Dev / Apps / Motion / Code / Edit / Build Something **Now**" |
| 6.5–10.25 s | 01 Web Dev: 3D browser in purple glow, site building itself, cursor click, tech stickers |
| 10.25–13.5 s | 02 Code: live-typed editor + build terminal, then rolling skills list "Build it all" |
| 13.5–14.5 s | "→ Build Something Now" / "i miss you" |
| 14.5–18.25 s | 03 App Dev: phone with calendar, cards and to-do, feature stickers, splash screen with the logo |
| 18.25–20 s | 04 Motion (icons → letters "MOTION") · 05 Video Edit (timeline + preview) |
| 20–22 s | Flash recap + "Rends ton projet *inoubliable*" |
| 22–26 s | **Outro**: logo + name, slowed + reverb, "Ton projet ? → DM" |

## Rebuild
```
./build.sh <audio-video.mp4> <work-dir> [out.mp4]
```
Typography: chrome Anton (glow, RGB split on impacts, outline echoes) + Instrument Serif italic + JetBrains Mono; giant outline section titles.

`index.html` + `edit.js` = the animation (each frame = `render(t)`), `render.mjs` = capture via headless Chromium (Playwright), `sfx.py` = synthesized whooshes/impacts/pad, `build.sh` = audio mix (slowed reverb) + encode.
