#!/usr/bin/env bash
# Source-only library: app.deps

# --- Source Guard ------------------------------------------------------------

[[ -n "${__APP_DEPS_SOURCED+x}" ]] && return
__APP_DEPS_SOURCED=1

# --- Public API --------------------------------------------------------------

require_cmd() {
  local cmd="$1"

  command -v "$cmd" >/dev/null 2>&1 && return

  printf '\nerror: required command not found: %s\n' "$cmd" >&2
  printf 'please install it first\n\n' >&2

  local install_cmd=""

  if command -v brew >/dev/null 2>&1; then
    case "$cmd" in
      jq) install_cmd="brew install jq" ;;
      yt-dlp) install_cmd="brew install yt-dlp" ;;
      ffmpeg|ffprobe) install_cmd="brew install ffmpeg" ;;
      cliclick) install_cmd="brew install cliclick" ;;
      curl) install_cmd="brew install curl" ;;
      wget) install_cmd="brew install wget" ;;
      gawk) install_cmd="brew install gawk" ;;
      sed) install_cmd="brew install gnu-sed" ;;
      perl) install_cmd="brew install perl" ;;
      node) install_cmd="brew install node" ;;
      python3) install_cmd="brew install python" ;;
      git) install_cmd="brew install git" ;;
    esac

  elif command -v apt >/dev/null 2>&1; then
    case "$cmd" in
      jq) install_cmd="sudo apt install jq" ;;
      yt-dlp) install_cmd="sudo apt install yt-dlp" ;;
      ffmpeg|ffprobe) install_cmd="sudo apt install ffmpeg" ;;
      curl) install_cmd="sudo apt install curl" ;;
      wget) install_cmd="sudo apt install wget" ;;
      gawk) install_cmd="sudo apt install gawk" ;;
      perl) install_cmd="sudo apt install perl" ;;
      node) install_cmd="sudo apt install nodejs" ;;
      python3) install_cmd="sudo apt install python3" ;;
      git) install_cmd="sudo apt install git" ;;
    esac

  elif command -v pacman >/dev/null 2>&1; then
    case "$cmd" in
      jq) install_cmd="sudo pacman -S jq" ;;
      yt-dlp) install_cmd="sudo pacman -S yt-dlp" ;;
      ffmpeg|ffprobe) install_cmd="sudo pacman -S ffmpeg" ;;
      curl) install_cmd="sudo pacman -S curl" ;;
      wget) install_cmd="sudo pacman -S wget" ;;
      gawk) install_cmd="sudo pacman -S gawk" ;;
      perl) install_cmd="sudo pacman -S perl" ;;
      node) install_cmd="sudo pacman -S nodejs" ;;
      python3) install_cmd="sudo pacman -S python" ;;
      git) install_cmd="sudo pacman -S git" ;;
    esac
  fi

  if [[ -n "$install_cmd" ]]; then
    printf 'install with:\n  %s\n\n' "$install_cmd" >&2
  else
    printf 'install "%s" using your system package manager\n\n' "$cmd" >&2
  fi

  exit 1
}

require_cmds() {
  local cmd
  for cmd in "$@"; do
    require_cmd "$cmd"
  done
}
