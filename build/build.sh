#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." &>/dev/null && pwd)"
OUT="$PROJECT_DIR/dist/clichatgpt"

mkdir -p "$PROJECT_DIR/dist"

{
cat <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
set +o histexpand

EOF

cat "$PROJECT_DIR/lib/app.deps.source.sh"
echo
cat "$PROJECT_DIR/lib/macos_gui.source.sh"
echo
cat "$PROJECT_DIR/lib/clichatgpt.source.sh"

echo
echo 'clichatgpt_talk "$@"'
} > "$OUT"

chmod +x "$OUT"

echo "built: $OUT"