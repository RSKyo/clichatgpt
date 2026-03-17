#!/usr/bin/env bash
# Source-only library: macos/gui

# --- Source Guard ------------------------------------------------------------

# Prevent multiple sourcing
[[ -n "${__MACOS_GUI_SOURCED+x}" ]] && return 0
__MACOS_GUI_SOURCED=1

# --- Script Templates --------------------------------------------------------

readonly __SCRIPT_SCREEN_WORKAREA_JXA=\
'ObjC.import("AppKit")

function run() {
  const screen = $.NSScreen.mainScreen
  const frame = screen.frame
  const visible = screen.visibleFrame

  const x = Math.round(visible.origin.x)
  const y = Math.round(frame.size.height - visible.origin.y - visible.size.height)
  const w = Math.round(visible.size.width)
  const h = Math.round(visible.size.height)

  return [x, y, w, h].join(" ")
}'

readonly __SCRIPT_FRONT_APP=\
'tell application "System Events"
  name of first process whose frontmost is true
end tell'

# args: $1=app
readonly __SCRIPT_APP_FOCUS=\
'tell application "%s" to activate'

# args: $1=app
readonly __SCRIPT_WIN_UNMINIMIZE=\
'tell application "System Events" to tell process "%s"
  try
    if (count of windows) > 0 then
      tell window 1
        if value of attribute "AXMinimized" then
          set value of attribute "AXMinimized" to false
        end if
      end tell
    end if
  end try
end tell'

# args: $1=app
readonly __SCRIPT_WIN_FOCUS=\
'tell application "System Events" to tell process "%s"
  if (count of windows) is 0 then return
  set frontmost to true
end tell'

# args: $1=app
readonly __SCRIPT_WIN_COUNT=\
'tell application "System Events" to tell process "%s"
  if it is running then
    return (count of windows)
  else
    return 0
  end if
end tell'

# args: $1=app $2=w $3=h
readonly __SCRIPT_WIN_RESIZE=\
'tell application "System Events" to tell process "%s"
  if (count of windows) is 0 then return
  set size of front window to {%s, %s}
end tell'

# args: $1=app $2=l $3=t
readonly __SCRIPT_WIN_MOVE=\
'tell application "System Events" to tell process "%s"
  if (count of windows) is 0 then return
  set position of front window to {%s, %s}
end tell'

# args: $1=app
readonly __SCRIPT_WIN_FRAME=\
'tell application "System Events" to tell process "%s"
  if (count of windows) is 0 then return ""
  set {x, y} to position of front window
  set {w, h} to size of front window
  set AppleScript'\''s text item delimiters to " "
  return {x, y, w, h} as text
end tell'

# args: $1=app $2=l $3=t $4=r $5=b
readonly __SCRIPT_WIN_FRAME_SET=\
'tell application "System Events" to tell process "%s"
  if (count of windows) = 0 then return
  set position of front window to {%s, %s}
  set size of front window to {%s, %s}
end tell'

# --- Internal API --------------------------------------------------------------

__fmt() {
  # shellcheck disable=SC2059
  printf "$1\n" "${@:2}"
}

# --- Public API --------------------------------------------------------------

screen_workarea() {
  osascript -l JavaScript <<<"$__SCRIPT_SCREEN_WORKAREA_JXA"
}

front_app() {
  local delay="${1:-0}"
  ((delay > 0)) && sleep "$delay"

  __fmt "$__SCRIPT_FRONT_APP" | osascript
}

app_focus() {
  local app="${1:?app_focus: missing app name}"

  __fmt "$__SCRIPT_APP_FOCUS" "$app" | osascript
}

app_activate() {
  local app="${1:?app_activate: missing app name}"

  {
    __fmt "$__SCRIPT_APP_FOCUS" "$app"
    __fmt "$__SCRIPT_WIN_UNMINIMIZE" "$app"
    __fmt "$__SCRIPT_WIN_FOCUS" "$app"
  } | osascript
}

win_unminimize() {
  local app="${1:?win_unminimize: missing app name}"

  __fmt "$__SCRIPT_WIN_UNMINIMIZE" "$app" | osascript
}

win_focus() {
  local app="${1:?win_focus: missing app}"

  __fmt "$__SCRIPT_WIN_FOCUS" "$app" | osascript
}

win_count() {
  local app="${1:?win_count: missing app}"

  __fmt "$__SCRIPT_WIN_COUNT" "$app" | osascript
}

win_exists() {
  local app="${1:?win_exists: missing app}"

  (( $(win_count "$app") > 0 ))
}

win_resize() {
  local app="${1:?missing app}"
  local w="${2:-1200}"
  local h="${3:-800}"

  __fmt "$__SCRIPT_WIN_RESIZE" "$app" "$w" "$h" | osascript
}

win_move() {
  local app="${1:?missing app}"
  local l="${2:-0}"
  local t="${3:-0}"

  __fmt "$__SCRIPT_WIN_MOVE" "$app" "$l" "$t" | osascript
}

win_frame() {
  local app="${1:?win_frame: missing app}"

  __fmt "$__SCRIPT_WIN_FRAME" "$app" | osascript
}

win_frame_set() {
  local app="${1:?win_frame_set: missing app}"
  local l="${2:-0}"
  local t="${3:-0}"
  local w="${4:-1200}"
  local h="${5:-800}"

  __fmt "$__SCRIPT_WIN_FRAME_SET" "$app" "$l" "$t" "$w" "$h" | osascript
}

win_place() {
  local app="${1:?missing app}"
  local pos="${2:?missing position}"

  local sl st sw sh
  read -r sl st sw sh <<< "$(screen_workarea)"

  local l t w h
  read -r l t w h <<< "$(win_frame "$app")"

  case "$pos" in
    center)
      l=$((sl + (sw - w) / 2))
      t=$((st + (sh - h) / 2))
      ;;

    left)
      l="$sl"
      t=$((st + (sh - h) / 2))
      ;;

    right)
      l=$((sl + sw - w))
      t=$((st + (sh - h) / 2))
      ;;

    top)
      l=$((sl + (sw - w) / 2))
      t="$st"
      ;;

    bottom)
      l=$((sl + (sw - w) / 2))
      t=$((st + sh - h))
      ;;

    topleft)
      l="$sl"
      t="$st"
      ;;

    topright)
      l=$((sl + sw - w))
      t="$st"
      ;;

    bottomleft)
      l="$sl"
      t=$((st + sh - h))
      ;;

    bottomright)
      l=$((sl + sw - w))
      t=$((st + sh - h))
      ;;

    left-half)
      l="$sl"
      t="$st"
      w=$((sw / 2))
      h="$sh"
      ;;

    right-half)
      l=$((sl + sw / 2))
      t="$st"
      w=$((sw / 2))
      h="$sh"
      ;;

    top-half)
      l="$sl"
      t="$st"
      w="$sw"
      h=$((sh / 2))
      ;;

    bottom-half)
      l="$sl"
      t=$((st + sh / 2))
      w="$sw"
      h=$((sh / 2))
      ;;

    fullscreen)
      l="$sl"
      t="$st"
      w="$sw"
      h="$sh"
      ;;

    *)
      printf 'invalid position: %s\n' "$pos" >&2
      return 1
      ;;
  esac

  win_frame_set "$app" "$l" "$t" "$w" "$h"
}
