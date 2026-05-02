#!/bin/bash
# Assemble final 2-min Lemma demo video.
# Source: 4 Seedance intro shots + 2 xiya talking-head clips + 1 Seedance close + logo card.
set -e

cd "$(dirname "$0")/../public/demo-videos"
mkdir -p _build
W=1920
H=1080
FPS=30

# Normalize each clip to 1920x1080 @ 30fps with stereo 48kHz AAC audio so we can concat with -c copy.
norm() {
  local IN=$1 DUR=$2 OUT=$3
  ffmpeg -y -loglevel error \
    -i "$IN" -t "$DUR" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=${FPS}" \
    -af "aresample=48000,aformat=channel_layouts=stereo" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    "$OUT"
  echo "  ✓ $OUT"
}

# Variant: same as norm() but mixes a VO mp3 over the ambient audio.
# Ambient is ducked to 25%, VO sits prominently on top.
normWithVO() {
  local IN=$1 DUR=$2 VO=$3 OUT=$4
  ffmpeg -y -loglevel error \
    -i "$IN" -i "$VO" -t "$DUR" \
    -filter_complex "
      [0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=${FPS}[v];
      [0:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.25[ambient];
      [1:a]aresample=48000,aformat=channel_layouts=stereo,volume=1.4,adelay=300|300[vo];
      [ambient][vo]amix=inputs=2:duration=first:dropout_transition=0[a]
    " \
    -map "[v]" -map "[a]" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    "$OUT"
  echo "  ✓ $OUT (with VO)"
}

echo "Normalizing clips…"
# Compressed intro: shot1 needs 6s (long VO), shots 2-4 are 3s each.
normWithVO shots/01-couple.mp4   6 vo/01-couple.mp3   _build/01-intro-couple.mp4
normWithVO shots/02-family.mp4   3 vo/02-family.mp3   _build/02-intro-family.mp4
normWithVO shots/03-writer.mp4   3 vo/03-writer.mp3   _build/03-intro-writer.mp4
normWithVO shots/04-business.mp4 3 vo/04-business.mp3 _build/04-intro-business.mp4
norm _raw/xiya-overview-of-project.mp4 40 _build/05-overview.mp4
norm _raw/xiya-agentic-workflow.mp4    30 _build/06-agentic.mp4
norm _raw/member-business.mp4          25 _build/07-member.mp4
normWithVO shots/05-close.mp4    5 vo/05-close.mp3    _build/08-close.mp4

echo "Generating logo card…"
python3 <<'PY'
from PIL import Image, ImageDraw, ImageFont
W, H = 1920, 1080
img = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(img)
def find(paths, sz):
    from os.path import isfile
    for p in paths:
        if isfile(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
title_font = find([
    "/Library/Fonts/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Times.ttc",
], 130)
sub_font = find([
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
], 32)
title = "lemma.app"
sub = "ADAPTIVE LISTING VIDEOS"
tb = d.textbbox((0,0), title, font=title_font)
sb = d.textbbox((0,0), sub, font=sub_font, spacing=8)
tw, th = tb[2]-tb[0], tb[3]-tb[1]
sw, sh = sb[2]-sb[0], sb[3]-sb[1]
d.text(((W-tw)/2, (H-th)/2 - 50 - tb[1]), title, font=title_font, fill=(244, 239, 230))
d.text(((W-sw)/2, (H-th)/2 + 100), sub, font=sub_font, fill=(138, 130, 117))
img.save("_build/logo.png")
PY
ffmpeg -y -loglevel error \
  -loop 1 -t 5 -i _build/logo.png \
  -f lavfi -t 5 -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
  -vf "fps=${FPS}" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest \
  _build/09-logo.mp4
echo "  ✓ _build/09-logo.mp4"

echo "Concatenating…"
cat > _build/concat.txt <<EOF
file '01-intro-couple.mp4'
file '02-intro-family.mp4'
file '03-intro-writer.mp4'
file '04-intro-business.mp4'
file '05-overview.mp4'
file '06-agentic.mp4'
file '07-member.mp4'
file '08-close.mp4'
file '09-logo.mp4'
EOF

ffmpeg -y -loglevel error \
  -f concat -safe 0 -i _build/concat.txt \
  -c copy \
  final-2min.mp4

echo
echo "✓ Done → public/demo-videos/final-2min.mp4"
ffprobe -v error -show_entries format=duration:stream=width,height -of default=noprint_wrappers=1 final-2min.mp4
ls -lh final-2min.mp4
