# Underwater lyric video (4:3 · 1440×1080 · 30 fps · 20 s)

Final file: `output/underwater_lyrics_4x3.mp4`

- Style after the mcvisuals reference: dark crimson ambience, soft depth blur, smooth tracking camera.
- Background: procedural crimson water caustics (heavily blurred), light rays from the surface, out-of-focus particles.
- Lyrics: words rise out of the water when sung (timings measured from the on-screen lyrics of the audio video),
  moving water refraction on the text (animated SVG turbulence displacement), wavy reflection, previous line sinks away.
- Camera: tracking zoom that follows the sung word, pushed in on the first word and pulling back as the line fills.
- Audio: first 20 s of the audio video.

Rebuild: `./build.sh <audio-video.mp4> <work-dir> [out.mp4]`
