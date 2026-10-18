# Word-by-word karaoke lyric video (1080×1920 · 30 fps · 18.09 s, original audio)

Final file: `output/baddies_lyrics.mp4`

- Timing: Whisper models could not be downloaded in this environment (model hosts blocked by the network policy), so `align.py`
  detects syllable onsets in the vocal band and assigns each word of `segments.json` to an onset with a DP (syllable-count weighted).
- Style (after the "prosper" reference): black + soft green glow, floating flag tiles with depth of field (the sung country/name tile comes forward), clean white type revealed word by word (blur → sharp, dim → bright on the exact word), key words in the wide Syncopate wordmark font with glow, end wordmark.
  (countries, names) are bigger with flag stickers, screen shake, flash and confetti burst; ad-libs pop as tilted stickers.


Rebuild: `./build.sh <clip.mp4> <work-dir> [out.mp4]` — set `VW=1440 VH=1080` for the 4:3 version (`output/baddies_lyrics_4x3.mp4`).
