#!/usr/bin/env bash
# Word-by-word karaoke lyric video (1080x1920, 30fps, same length/audio as the source clip).
# usage: ./build.sh <clip.mp4> <work-dir> [out.mp4]
set -euo pipefail
SRC="$1"; WORK="$2"; OUT="${3:-$WORK/lyrics.mp4}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$WORK"
ffmpeg -v error -y -i "$SRC" -vn -ac 2 -ar 44100 "$WORK/clip.wav"
python3 "$HERE/align.py" "$WORK/clip.wav" "$HERE/words.json"
python3 -c "import json;w=json.load(open('$HERE/words.json'));open('$HERE/words.js','w').write('window.WORDS='+json.dumps(w,ensure_ascii=False)+';')"
node "$HERE/render.mjs" "$WORK/frames" 30 4
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f_%05d.jpg" -i "$SRC" -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 256k -t 18.089 "$OUT"
echo "wrote $OUT"
