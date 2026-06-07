#!/usr/bin/env bash
# check-audio-assets.sh
#
# Compares the "⏳ 待生成" rows in docs/research/ai-audio-prompts.md against
# the actual files in assets/audio/. Prints a list of track ids whose .ogg
# is missing. Does not generate anything — this is a manual gate the user
# (or orchestrator) runs after generating the audio in Suno / Stable Audio.
#
# Usage:  ./scripts/check-audio-assets.sh
# Exit:   0 = all generated, 1 = some missing.
#
# This is a D2-2 deliverable. Existing scripts/postprocess-audio.sh is
# untouched — that script does the .mp3/.wav -> .ogg conversion.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$ROOT/docs/research/ai-audio-prompts.md"
BGM_DIR="$ROOT/assets/audio/bgm"
SFX_DIR="$ROOT/assets/audio/sfx"
UI_DIR="$ROOT/assets/audio/ui"

if [ ! -f "$PROMPTS" ]; then
  echo "ERROR: prompts file not found: $PROMPTS" >&2
  exit 2
fi

# Extract rows like:  | BGM | prologue_anomaly | ⏳ 待生成 | — | ...
# We pull the 3rd column (the id) when the 4th column is the "⏳" sentinel.
# awk's FS handles the pipes.
missing_bgm=()
missing_sfx=()
missing_ui=()

while IFS='|' read -r _col1 _col2 col3 col4 _rest; do
  # Trim leading/trailing whitespace.
  kind="$(echo "$_col1" | xargs)"
  id="$(echo "$col3" | xargs)"
  status="$(echo "$col4" | xargs)"
  if [ "$status" != "⏳" ] && [ "$status" != "⏳" ]; then
    continue
  fi
  if [ -z "$id" ] || [ "$id" = "ID" ]; then
    continue
  fi
  case "$kind" in
    BGM)  target="$BGM_DIR/$id.ogg" ; dir="bgm" ;;
    SFX)  target="$SFX_DIR/$id.ogg" ; dir="sfx" ;;
    UI)   target="$UI_DIR/$id.ogg"  ; dir="ui"  ;;
    *)    continue ;;
  esac
  if [ ! -f "$target" ]; then
    case "$dir" in
      bgm) missing_bgm+=("$id") ;;
      sfx) missing_sfx+=("$id") ;;
      ui)  missing_ui+=("$id")  ;;
    esac
  fi
done < <(grep -E '^\|\s*(BGM|SFX|UI)\s*\|' "$PROMPTS" || true)

if [ "${#missing_bgm[@]}" -eq 0 ] && [ "${#missing_sfx[@]}" -eq 0 ] && [ "${#missing_ui[@]}" -eq 0 ]; then
  echo "[ok] all ⏳ audio assets are generated."
  exit 0
fi

echo "[missing] the following audio ids have no .ogg on disk:"
[ "${#missing_bgm[@]}" -gt 0 ] && echo "  BGM: ${missing_bgm[*]}"
[ "${#missing_sfx[@]}" -gt 0 ] && echo "  SFX: ${missing_sfx[*]}"
[ "${#missing_ui[@]}"  -gt 0 ] && echo "  UI:  ${missing_ui[*]}"
echo
echo "Run Suno / Stable Audio for these, then ./scripts/postprocess-audio.sh <input> <name> <bgm|sfx|ui>."
echo "Re-run $0 to verify."
exit 1
