#!/usr/bin/env bash
# Builds the "Baddies Airlines" edit (1080x1920, 30fps, 18.1s).
# usage: ./build.sh <sound-video.mp4> <work-dir> [out.mp4]
set -euo pipefail
SRC="$1"; WORK="$2"; OUT="${3:-$WORK/baddies_airlines.mp4}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$WORK"
node "$HERE/render.mjs" "$WORK/tmp" --events "$WORK/events.json"
python3 "$HERE/sfx.py" "$WORK/events.json" "$WORK/sfx.wav"
ffmpeg -v error -y -i "$SRC" -i "$WORK/sfx.wav" -filter_complex "
 [0:a]aresample=44100,atrim=0:18.1[song];
 [1:a]lowpass=f=4000,volume=0.45[fx];
 [song][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95:level=disabled,afade=t=in:d=0.05[a]" -map "[a]" -ac 2 "$WORK/mix.wav"
node "$HERE/render.mjs" "$WORK/frames" 30 4
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f_%05d.jpg" -i "$WORK/mix.wav" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 256k -shortest "$OUT"
echo "wrote $OUT"
