#!/usr/bin/env bash
# Builds the TikTok edit (1080x1920, 30fps, 26s).
# usage: ./build.sh <song-source.mp4> <work-dir> [out.mp4]
set -euo pipefail
SRC="$1"; WORK="$2"; OUT="${3:-$WORK/giresse_portfolio_edit.mp4}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$WORK"

# 1) audio: slowed+reverb intro (song 0–2.25s at 0.75x = 3s), song from 2.25s, slowed+reverb outro from song 21.25s
ffmpeg -v error -y -i "$SRC" -vn -ar 44100 -ac 2 "$WORK/song.wav"
python3 "$HERE/sfx.py" "$WORK/sfx.wav"
ffmpeg -v error -y -i "$WORK/song.wav" -i "$WORK/sfx.wav" -filter_complex "
 [0:a]atrim=0:2.25,asetpts=N/SR/TB,asetrate=33075,aresample=44100,lowpass=f=6000,
   aecho=0.8:0.82:70|140|230|340:0.42|0.34|0.26|0.18,afade=t=in:d=0.25,volume=1.15,apad=pad_dur=1[intro];
 [0:a]atrim=2.25:21.28,asetpts=N/SR/TB,afade=t=out:st=18.98:d=0.05,adelay=3000|3000[main];
 [0:a]atrim=21.25:22.95,asetpts=N/SR/TB,asetrate=33075,aresample=44100,lowpass=f=5000,
   aecho=0.8:0.88:90|180|300|450|650:0.45|0.38|0.3|0.22|0.15,apad=pad_dur=2.2,afade=t=out:st=2.6:d=1.6,adelay=22000|22000[outro];
 [intro][main][outro][1:a]amix=inputs=4:normalize=0:duration=longest,atrim=0:26,
   alimiter=limit=0.95:level=disabled,afade=t=out:st=25.4:d=0.6[a]" -map "[a]" "$WORK/mix.wav"

# 2) frames
node "$HERE/render.mjs" "$WORK/frames" 30 4

# 3) encode
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f_%05d.jpg" -i "$WORK/mix.wav" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -c:a aac -b:a 256k -shortest "$OUT"
echo "wrote $OUT"
