# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build everything (WASM then TypeScript)
pnpm build

# Build only the Rust/WASM module
pnpm build:wasm

# Build only the TypeScript layer
pnpm build:ts

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run a single test file or pattern
pnpm test -- <test-file-path-or-pattern>

# Type-check TypeScript
pnpm lint

# Clean all build artifacts
pnpm clean
```

**Prerequisites:** Rust with `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`), `wasm-pack`, Node.js 18+, pnpm 9+.

## Architecture

This is a monorepo with two layers:

**`crates/warp-core/`** — Rust image processing core compiled to WebAssembly via wasm-pack. Uses the `image` crate (plus `fast_image_resize` for SIMD-accelerated resize, `mozjpeg-rs` for JPEG encoding). All public functions are exposed via `#[wasm_bindgen]`. The WASM output lands in `packages/warp-image/wasm/` and is committed so npm consumers never need Rust.

**`packages/warp-image/`** — TypeScript API layer. `src/loader.ts` lazy-initializes the WASM module on first use (works in both CJS and ESM). `src/warp.ts` is the `WarpImage` fluent pipeline class. `src/types.ts` defines all option interfaces. `src/index.ts` is the public entry point exporting `warpImage()` factory and all types. Built to dual ESM + CJS output via `tsup`.

The build pipeline: `scripts/build-wasm.sh` runs `wasm-pack build` with `RUSTFLAGS="-C target-feature=+simd128"` and then `wasm-opt -O4 --converge --enable-simd` on the output. The WASM binary target is under 3MB (actual: ~0.97MB).

## Rust/WASM Conventions

- Input buffers are `&[u8]` (borrowed from JS); output is `Vec<u8>` (ownership transferred to JS)
- All public functions return `Result<T, JsValue>` — never panic, convert errors via `.map_err(|e| JsValue::from_str(&e.to_string()))`
- Drop large intermediates as early as possible; WASM linear memory means large images can OOM
- Avoid adding heavy crates — every dependency increases binary size
- Current opt-level is `3` (speed over size); current binary is well under the 3MB budget

## TypeScript Conventions

- Strict mode — no `any`, no `@ts-ignore`
- All transform methods return `this` for chaining; `toBuffer()` / `toFile()` / `metadata()` are async terminals
- API is designed to be Sharp-compatible: same method names and option shapes where possible
- `grayscale()` and `greyscale()` both work (support both spellings)
- All option interfaces live in `src/types.ts` and are exported from the package entry point

## Testing

Tests live in `packages/warp-image/__tests__/`. Fixture images (JPEG + PNG) are in `__tests__/fixtures/`; WebP fixtures are generated in `beforeAll`. Every public API method must have at least one test validating output dimensions, format correctness, or file size impact.
