#!/usr/bin/env bash
# Builds the website-fight edit (1080x1920, 30fps, 33.7s).
# usage: ./build.sh <song-source.mp4> <work-dir> [out.mp4]
set -euo pipefail
SRC="$1"; WORK="$2"; OUT="${3:-$WORK/giresse_website_fight.mp4}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$WORK"
ffmpeg -v error -y -i "$SRC" -vn -ar 44100 -ac 2 "$WORK/song.wav"
node "$HERE/render.mjs" "$WORK/tmp" --events "$WORK/events.json"
python3 "$HERE/sfx.py" "$WORK/events.json" "$WORK/sfx.wav"
# slowed+reverb intro (song 0–3.75 s at 0.75x = 5 s), song from 3.75 s to 29.95 s, reverb tail into the end card
ffmpeg -v error -y -i "$WORK/song.wav" -i "$WORK/sfx.wav" -filter_complex "
 [0:a]atrim=0:3.75,asetpts=N/SR/TB,asetrate=33075,aresample=44100,lowpass=f=5500,
   aecho=0.8:0.85:70|140|230|340:0.42|0.34|0.26|0.18,afade=t=in:d=0.3,volume=0.95,apad=pad_dur=1[intro];
 [0:a]atrim=3.75:29.95,asetpts=N/SR/TB,afade=t=out:st=26.12:d=0.08,adelay=5000|5000,volume=0.9[main];
 [0:a]atrim=29.3:29.95,asetpts=N/SR/TB,asetrate=33075,aresample=44100,lowpass=f=4000,
   aecho=0.8:0.9:120|260|420|640:0.45|0.35|0.25|0.15,apad=pad_dur=2.5,afade=t=out:st=0.6:d=2.4,adelay=31200|31200,volume=0.6[tail];
 [intro][main][tail][1:a]amix=inputs=4:normalize=0:duration=longest,atrim=0:33.7,
   alimiter=limit=0.95:level=disabled,afade=t=out:st=33.1:d=0.6[a]" -map "[a]" "$WORK/mix.wav"
node "$HERE/render.mjs" "$WORK/frames" 30 4
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f_%05d.jpg" -i "$WORK/mix.wav" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 256k -shortest "$OUT"
echo "wrote $OUT"
