#!/usr/bin/env bash
# Source-only library: macos/chrome

# --- Source Guard ------------------------------------------------------------

# Prevent multiple sourcing
[[ -n "${__MACOS_CHROME_SOURCED+x}" ]] && return 0
__MACOS_CHROME_SOURCED=1

# --- Config ---------------------------------------------------------------

# Configurable parameters (can be overridden via environment)
: "${CLICHATGPT_CHROME_TABS_STABLE_TIMEOUT:=5}"
: "${CLICHATGPT_CHROME_TABS_STABLE_POLL_INTERVAL:=0.1}"
: "${CLICHATGPT_CHROME_TABS_STABLE_THRESHOLD:=3}"
: "${CLICHATGPT_CHROME_TAB_LOAD_TIMEOUT:=10}"
: "${CLICHATGPT_CHROME_TAB_LOAD_POLL_INTERVAL:=0.1}"

# --- Public API --------------------------------------------------------------

chrome_tabs_count() {
  osascript <<EOF
if application "Google Chrome" is running then
  tell application "Google Chrome"
    if (count of windows) = 0 then return 0
    return count of tabs of front window
  end tell
else
  return 0
end if
EOF
}

chrome_tabs_wait_stable() {
  local timeout="$CLICHATGPT_CHROME_TABS_STABLE_TIMEOUT"
  local poll_interval="$CLICHATGPT_CHROME_TABS_STABLE_POLL_INTERVAL"
  local threshold="$CLICHATGPT_CHROME_TABS_STABLE_THRESHOLD"

  local count prev_count=-1 stable=0
  local deadline=$((SECONDS + timeout))

  while ((SECONDS < deadline)); do
    count="$(chrome_tabs_count)" || return 1

    if (( count == prev_count )); then
      (( stable++ ))
      (( stable >= threshold )) && {
        printf '%s\n' "$count"
        return 0
      }
    else
      stable=0
      prev_count="$count"
    fi

    sleep "$poll_interval"
  done

  loge "tabs stable timeout (${timeout}s)"
  return 1
}

chrome_tab_wait_loaded() {
  local idx="${1:?chrome_tab_wait_loaded: missing idx}"
  local timeout="$CLICHATGPT_CHROME_TAB_LOAD_TIMEOUT"
  local poll_interval="$CLICHATGPT_CHROME_TAB_LOAD_POLL_INTERVAL"
  local deadline=$((SECONDS + timeout))
  
  chrome_tab_is_loaded "$idx" && return 0

  while ((SECONDS < deadline)); do
    chrome_tab_is_loaded "$idx" && return 0
    sleep "$poll_interval"
  done

  loge "tab load timeout: idx=$idx timeout=${timeout}s"
  return 1
}

chrome_tab() {
  local idx="${1:?chrome_tab: missing idx}"
  local sep=$'\x1f'

  osascript <<EOF
tell application "Google Chrome"
  if not running then return

  set sep to "$sep"
  set t to tab $idx of front window
  set activeIdx to active tab index of front window

  set tabTitle to title of t
  set tabURL to URL of t
  set tabLoading to loading of t
  set tabActive to (activeIdx is $idx)

  return "$idx" & sep & tabTitle & sep & tabURL & sep & (tabLoading as text) & sep & (tabActive as text)
end tell
EOF
}

__chrome_tab_loading() {
  local idx="$1"

  osascript <<EOF
tell application "Google Chrome"
  if not running then return
  loading of tab $idx of front window
end tell
EOF
}

chrome_tab_is_loaded() {
  local idx="${1:?chrome_tab_is_loaded: missing idx}"
  local count loading

  loading="$(__chrome_tab_loading "$idx")" || return 1
  [[ "$loading" == "false" ]]
}

chrome_tab_active_index() {
  osascript <<'EOF'
tell application "Google Chrome"
  active tab index of front window
end tell
EOF
}

chrome_tab_activate() {
  local idx="${1:?chrome_tab_activate: missing idx}"

  osascript <<EOF
tell application "Google Chrome"
  activate
  set active tab index of front window to $idx
end tell
EOF
}

chrome_tab_open() {
  local url="${1:-}"

  if ! win_exists "Google Chrome"; then
    open -a "Google Chrome" "$url" || return 1

    local count
    count="$(chrome_tabs_wait_stable)" || return 1
    if chrome_tab_wait_loaded "$count"; then
      printf '%s\n' 'new'
      return 0
    else
      loge "chrome tab failed to load: idx=$count url=$url"
      return 1
    fi
  fi

  local url_idx 
  url_idx="$(chrome_tab_index_by_url "$url")"
  
  if [[ -n "$url_idx" ]]; then
    local active_idx
    active_idx="$(chrome_tab_active_index)"

    if [[ "$url_idx" != "$active_idx" ]]; then
      chrome_tab_activate "$url_idx" || return 1
    fi

    printf '%s\n' 'exist'
    return 0
  fi

    chrome_tab_new "$url" || return 1
    local count
    count="$(chrome_tabs_wait_stable)" || return 1
    if chrome_tab_wait_loaded "$count"; then
      return 0
    else
      loge "chrome tab failed to load: idx=$count url=$url"
      return 1
    fi
}

chrome_tab_new() {
  local url="${1:-about:blank}"
  osascript <<EOF
tell application "Google Chrome"
  if not running then return
  tell front window
    make new tab with properties {URL:"$url"}
  end tell
end tell
EOF
}

chrome_tab_close() {
  local input="${1:?chrome_tab_close: missing input}"
  local idx

  if [[ "$input" =~ ^[0-9]+$ ]]; then
    idx="$input"
  else
    idx="$(chrome_tab_index_by_url "$input")" || return 1
  fi

  osascript <<EOF
tell application "Google Chrome"
  if not running then return
  tell front window
    close tab $idx
  end tell
end tell
EOF
}

__chrome_tab_index_by_url() {
  local url="$1"

  osascript <<EOF
tell application "Google Chrome"
  if not running then return
  set i to 1
  repeat with t in tabs of front window
    if URL of t contains "$url" then return i
    set i to i + 1
  end repeat
  return
end tell
EOF
}

chrome_tab_index_by_url() {
  local url="${1:-about:blank}"
  local idx

  idx="$(__chrome_tab_index_by_url "$url")"

  [[ -n "$idx" ]] || return 1
  printf '%s\n' "$idx"
}
