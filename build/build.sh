#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." &>/dev/null && pwd)"
LIB_DIR="$PROJECT_DIR/lib"
INFRA_DIR="$PROJECT_DIR/lib/infra"

OUT="$PROJECT_DIR/dist/clichatgpt"
mkdir -p "$(dirname "$OUT")"

{
cat <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
set +o histexpand

EOF

cat "$INFRA_DIR/log.source.sh"
printf '\n'

cat "$INFRA_DIR/deps.source.sh"
printf '\n'

cat "$LIB_DIR/macos_gui.source.sh"
printf '\n'

cat "$LIB_DIR/clichatgpt.source.sh"

echo 'require_cmds jq cliclick pbcopy pbpaste'
echo
echo 'clichatgpt_talk "$@"'

} > "$OUT"

chmod +x "$OUT"

echo "built: $OUT"