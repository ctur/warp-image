#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CRATE_DIR="$ROOT_DIR/crates/warp-core"
OUT_DIR="$ROOT_DIR/packages/warp-image/wasm"

echo "Building warp-core WASM module..."

if ! command -v wasm-pack &> /dev/null; then
  echo "Error: wasm-pack is not installed."
  echo "Install it with: cargo install wasm-pack"
  exit 1
fi

# Enable WASM SIMD128 intrinsics.
#
# Without this flag fast_image_resize falls back to scalar paths even though it
# advertises "Wasm32 SIMD128 auto-detection" — detection only works when the
# binary actually contains SIMD instructions.  With +simd128:
#   - fast_image_resize uses 4-wide SIMD for Lanczos3 convolution (~2-4× faster)
#   - mozjpeg-rs DCT paths can use 128-bit wide ops via the `wide` crate
#
# The corresponding wasm-opt flags (--enable-simd, -O3) are set in Cargo.toml
# under [package.metadata.wasm-pack.profile.release] so wasm-pack will pass
# them to wasm-opt automatically after the Rust compile step.
export RUSTFLAGS="${RUSTFLAGS:-} -C target-feature=+simd128"

wasm-pack build "$CRATE_DIR" \
  --target nodejs \
  --release \
  --out-dir "$OUT_DIR" \
  --out-name warp_core

rm -f "$OUT_DIR/.gitignore" "$OUT_DIR/README.md"

# Ensure CJS interpretation (parent package.json uses "type": "module")
echo '{ "type": "commonjs" }' > "$OUT_DIR/package.json"

WASM_SIZE=$(wc -c < "$OUT_DIR/warp_core_bg.wasm" | tr -d ' ')
WASM_SIZE_MB=$(echo "scale=2; $WASM_SIZE / 1048576" | bc)
echo "WASM binary size: ${WASM_SIZE_MB}MB"

if [ "$WASM_SIZE" -gt 3145728 ]; then
  echo "Warning: WASM binary exceeds 3MB budget!"
fi

echo "Build complete: $OUT_DIR"
