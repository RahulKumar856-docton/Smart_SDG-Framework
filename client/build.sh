#!/usr/bin/env bash
set -e
# Forward build execution to root build.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
exec bash "$ROOT_DIR/build.sh"
