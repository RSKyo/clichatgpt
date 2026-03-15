#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Config
# -------------------------------------------------------------------

REPO="zzz/clichatgpt"
BIN_NAME="clichatgpt"
INSTALL_DIR="/usr/local/bin"
URL="https://raw.githubusercontent.com/${REPO}/main/dist/${BIN_NAME}"

# -------------------------------------------------------------------
# Check dependencies
# -------------------------------------------------------------------

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl is required to install ${BIN_NAME}" >&2
  exit 1
fi

# -------------------------------------------------------------------
# Prepare temp dir
# -------------------------------------------------------------------

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

TMP_FILE="$TMP_DIR/$BIN_NAME"

echo "Installing ${BIN_NAME}..."

# -------------------------------------------------------------------
# Download
# -------------------------------------------------------------------

echo "Downloading binary..."
curl -fsSL "$URL" -o "$TMP_FILE"

# -------------------------------------------------------------------
# Install
# -------------------------------------------------------------------

chmod +x "$TMP_FILE"

echo "Installing to ${INSTALL_DIR}..."

sudo mv "$TMP_FILE" "${INSTALL_DIR}/${BIN_NAME}"

# -------------------------------------------------------------------
# Done
# -------------------------------------------------------------------

echo
echo "✔ Installed ${BIN_NAME}"
echo