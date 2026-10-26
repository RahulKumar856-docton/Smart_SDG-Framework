#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

# Resolve repository root directory regardless of invocation location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo " Starting Smart SDG Framework Render Build Process"
echo " Working directory: $(pwd)"
echo "=================================================="

# 1. Python dependencies
echo "==> [1/3] Installing Python backend dependencies..."
python -m pip install --upgrade pip
pip install -r "$SCRIPT_DIR/requirements.txt"

# 2. Node & Frontend build
echo "==> [2/3] Installing client dependencies..."
cd "$SCRIPT_DIR/client"
if [ -f "package-lock.json" ]; then
    npm ci --prefer-offline --no-audit || npm install --no-audit
else
    npm install --no-audit
fi

echo "==> [3/3] Compiling React frontend with Vite..."
npm run build
cd "$SCRIPT_DIR"

# 3. Verification
if [ -f "$SCRIPT_DIR/client/dist/index.html" ]; then
    echo "=================================================="
    echo " SUCCESS: Frontend compiled to client/dist/index.html"
    echo " Ready for production deployment!"
    echo "=================================================="
else
    echo "ERROR: client/dist/index.html was not generated!"
    exit 1
fi

