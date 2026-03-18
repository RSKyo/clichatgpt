#!/usr/bin/env bash
# Source-only library: config

readonly CLICHATGPT_CONFIG_DIR="${HOME}/.config/clichatgpt"
readonly CLICHATGPT_CONFIG_FILE="$CLICHATGPT_CONFIG_DIR/config"

clichatgpt_config_ensure() {
  mkdir -p "$CLICHATGPT_CONFIG_DIR" || return 1

  [[ -f "$CLICHATGPT_CONFIG_FILE" ]] && return 0

  cat >"$CLICHATGPT_CONFIG_FILE" <<EOF
# clichatgpt config

CLICHATGPT_URL='https://chatgpt.com/?temporary-chat=true'

CLICHATGPT_REPLY_DIR="${HOME}/.local/share/clichatgpt"
CLICHATGPT_REPLY_FILE_NAME="$(date '+%Y%m%d_%H%M%S')_reply"
EOF
}

clichatgpt_config_load() {
  [[ -f "$CLICHATGPT_CONFIG_FILE" ]] && source "$CLICHATGPT_CONFIG_FILE"
}

clichatgpt_config_read() {
  local key="${1:?clichatgpt_config_read: missing key}"
  local file="$CLICHATGPT_CONFIG_FILE"

  [[ -f "$file" ]] || return 1

  local line value

  while IFS= read -r line; do
    [[ -z "$line" || "$line" == \#* ]] && continue

    case "$line" in
      "$key="*)
        value="${line#*=}"
        printf '%s\n' "$value"
        return 0
        ;;
    esac
  done < "$file"

  return 1
}

clichatgpt_config_write() {
  local key="${1:?clichatgpt_config_write: missing key}"
  local value="${2:?clichatgpt_config_write: missing value}"

  local file="$CLICHATGPT_CONFIG_FILE"
  local dir
  dir="$(dirname "$file")"

  mkdir -p "$dir" || return 1

  local tmp
  tmp="$(mktemp "${TMPDIR}/clichatgpt.XXXXXX")" || return 1
  trap 'rm -f "$tmp"' RETURN

  local found=0 line

  if [[ -f "$file" ]]; then
    while IFS= read -r line; do
      if [[ "$line" == "$key="* ]]; then
        printf '%s=%s\n' "$key" "$value" >>"$tmp"
        found=1
      else
        printf '%s\n' "$line" >>"$tmp"
      fi
    done < "$file"
  fi

  if (( ! found )); then
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
  fi

  mv "$tmp" "$file" || return 1

  # 重新加载
  clichatgpt_config_load
}