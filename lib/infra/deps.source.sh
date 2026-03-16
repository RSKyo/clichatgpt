#!/usr/bin/env bash
# Source-only library: deps

# --- Source Guard ------------------------------------------------------------

[[ -n "${__DEPS_SOURCED+x}" ]] && return
__DEPS_SOURCED=1

# --- Platform Check ----------------------------------------------------------

if [[ "$OSTYPE" != darwin* ]]; then
  printf '\nerror: this tool only supports macOS\n\n' >&2
  exit 1
fi

# --- Dependency Check --------------------------------------------------------

require_cmd() {
  local cmd="$1"

  command -v "$cmd" >/dev/null 2>&1 && return 0

  printf '\nerror: missing required command: %s\n' "$cmd" >&2

  if command -v brew >/dev/null 2>&1; then
    printf 'install with:\n  brew install %s\n\n' "$cmd" >&2
  else
    printf 'please install Homebrew first:\n'
    printf '  https://brew.sh\n\n'
  fi

  exit 1
}

require_cmds() {
  local cmd
  for cmd in "$@"; do
    require_cmd "$cmd"
  done
}
