#!/usr/bin/env bash
# Underwater lyric video, 4:3 (1440x1080), first 20 s of the audio video.
# usage: ./build.sh <audio-video.mp4> <work-dir> [out.mp4]
set -euo pipefail
SRC="$1"; WORK="$2"; OUT="${3:-$WORK/underwater_lyrics_4x3.mp4}"
HERE="$(cd "$(dirname "$0")" && pwd)"
VW=1440 VH=1080 node "$HERE/render.mjs" "$WORK/frames" 30 4
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f_%05d.jpg" -i "$SRC" -map 0:v -map 1:a -af "atrim=0:20,afade=t=out:st=19.6:d=0.4" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 256k -t 20 "$OUT"
echo "wrote $OUT"
