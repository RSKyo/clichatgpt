#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." &>/dev/null && pwd)"
LIB_DIR="$PROJECT_DIR/lib"
INFRA_DIR="$PROJECT_DIR/lib/infra"
OUT="$PROJECT_DIR/dist/clichatgpt"

mkdir -p "$PROJECT_DIR/dist"

{
cat <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
set +o histexpand

EOF

cat "$INFRA_DIR/log.source.sh"
echo
cat "$INFRA_DIR/deps.source.sh"
echo
cat "$LIB_DIR/macos_gui.source.sh"
echo
cat "$LIB_DIR/clichatgpt.source.sh"

echo
echo 'clichatgpt_talk "$@"'
} > "$OUT"

chmod +x "$OUT"

echo "built: $OUT"