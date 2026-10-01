#!/usr/bin/env bash
# Small, semantic ADB helpers for inspecting and driving an Android app.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/android-ui.sh [--device SERIAL] COMMAND [ARGS]

Selects the only connected device automatically, or use --device SERIAL / set
ANDROID_SERIAL when multiple phones or emulators are connected.

Commands:
  devices                 List authorized devices
  size                    Show the selected device's screen size
  dump                    Dump the current accessibility tree to stdout
  find NEEDLE             Find text, content description, or resource ID
  tap NEEDLE              Tap the center of one unique clickable match
  text VALUE              Type text into the focused field
  swipe X1 Y1 X2 Y2 MS    Swipe between screen coordinates
  back                    Press Android Back
  screenshot [PATH]       Save a screenshot (default /tmp/android-screen.png)
  logs [LINES]            Show recent React Native JS log lines
USAGE
}

serial="${ANDROID_SERIAL:-}"
if [[ "${1:-}" == "--device" ]]; then
  [[ $# -ge 2 ]] || { usage >&2; exit 2; }
  serial="$2"
  shift 2
fi
command_name="${1:-}"
if [[ -z "$command_name" || "$command_name" == "-h" || "$command_name" == "--help" ]]; then
  usage
  exit 0
fi
shift

if [[ "$command_name" == "devices" ]]; then
  adb devices -l
  exit
fi

if [[ -z "$serial" ]]; then
  mapfile -t connected < <(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')
  if [[ ${#connected[@]} -ne 1 ]]; then
    printf 'Expected one authorized device, found %s. Pass --device SERIAL or set ANDROID_SERIAL.\n' "${#connected[@]}" >&2
    adb devices -l >&2
    exit 2
  fi
  serial="${connected[0]}"
fi

adb_selected() { adb -s "$serial" "$@"; }

dump_tree() {
  local remote="/sdcard/android-ui-${serial//[^[:alnum:]_-]/_}.xml"
  adb_selected shell uiautomator dump "$remote" >/dev/null
  adb_selected shell cat "$remote" | tr -d '\r'
}

case "$command_name" in
  size)
    adb_selected shell wm size
    ;;
  dump)
    dump_tree
    ;;
  find|tap)
    [[ $# -ge 1 ]] || { usage >&2; exit 2; }
    needle="$1"
    tree="$(dump_tree)"
    python3 -c '
import sys
import xml.etree.ElementTree as ET

mode, needle = sys.argv[1:]
root = ET.fromstring(sys.stdin.read())
needle = needle.casefold()
matches = []
for node in root.iter("node"):
    attrs = node.attrib
    searchable = (attrs.get("text", ""), attrs.get("content-desc", ""), attrs.get("resource-id", ""))
    if any(needle in value.casefold() for value in searchable if value):
        bounds = attrs.get("bounds", "")
        if mode == "find":
            matches.append((attrs.get("clickable") == "true", attrs.get("text", ""), attrs.get("content-desc", ""), attrs.get("resource-id", ""), bounds))
        elif attrs.get("clickable") == "true" and bounds:
            matches.append((True, attrs.get("text", ""), attrs.get("content-desc", ""), attrs.get("resource-id", ""), bounds))

unique = {}
for item in matches:
    unique[(item[0], item[4])] = item
matches = list(unique.values())
if mode == "find":
    for clickable, text, desc, resource, bounds in matches:
        print(f"clickable={clickable} text={text!r} content-desc={desc!r} resource-id={resource!r} bounds={bounds}")
    if not matches:
        print(f"No match for {needle!r}")
    sys.exit(0)
if len(matches) != 1:
    for clickable, text, desc, resource, bounds in matches:
        print(f"clickable={clickable} text={text!r} content-desc={desc!r} resource-id={resource!r} bounds={bounds}", file=sys.stderr)
    print(f"Expected one clickable match for {needle!r}, found {len(matches)}", file=sys.stderr)
    sys.exit(2)
bounds = matches[0][4]
import re
coords = [int(value) for value in re.findall(r"\d+", bounds)]
if len(coords) != 4:
    print(f"Invalid bounds: {bounds}", file=sys.stderr)
    sys.exit(2)
print((coords[0] + coords[2]) // 2, (coords[1] + coords[3]) // 2)
' "$command_name" "$needle" <<< "$tree" | {
      if [[ "$command_name" == "tap" ]]; then
        read -r x y
        printf 'Tapping %s at %s,%s on %s\n' "$needle" "$x" "$y" "$serial"
        adb_selected shell input tap "$x" "$y"
      else
        cat
      fi
    }
    ;;
  text)
    [[ $# -ge 1 ]] || { usage >&2; exit 2; }
    value="$1"
    value="${value// /%s}"
    adb_selected shell input text "$value"
    ;;
  swipe)
    [[ $# -eq 5 ]] || { usage >&2; exit 2; }
    adb_selected shell input swipe "$1" "$2" "$3" "$4" "$5"
    ;;
  back)
    adb_selected shell input keyevent 4
    ;;
  screenshot)
    path="${1:-/tmp/android-screen.png}"
    adb_selected exec-out screencap -p > "$path"
    printf '%s\n' "$path"
    ;;
  logs)
    count="${1:-120}"
    adb_selected logcat -d -t "$count" | rg 'ReactNativeJS|ExpoModulesCore|AndroidRuntime' || true
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
