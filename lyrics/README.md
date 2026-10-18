# Word-by-word karaoke lyric video (1080×1920 · 30 fps · 18.09 s, original audio)

Final file: `output/baddies_lyrics.mp4`

- Timing: Whisper models could not be downloaded in this environment (model hosts blocked by the network policy), so `align.py`
  detects syllable onsets in the vocal band and assigns each word of `segments.json` to an onset with a DP (syllable-count weighted).
- Animation: each word pops in (bounce/zoom) when sung; karaoke colour sweep (fuchsia / yellow / orange) during the word; punchlines
  (countries, names) are bigger with flag stickers, screen shake, flash and confetti burst; ad-libs pop as tilted stickers.
- Thick black outline (Nunito Black) for legibility; text slightly below centre; strong flash/zoom hook in the first second.

Rebuild: `./build.sh <clip.mp4> <work-dir> [out.mp4]`
