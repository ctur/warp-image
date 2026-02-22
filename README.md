# warp-image

Fast, portable image processing for Node.js — powered by WebAssembly.

**Zero native dependencies. No node-gyp. No platform-specific builds.**

## Why?

Sharp is excellent, but its native dependency (libvips) causes real problems:

- Docker multi-stage builds fail with architecture mismatches
- Serverless platforms (Lambda, Cloud Functions) need platform-specific layers
- CI pipelines break when native compilation fails
- `npm install` takes 30+ seconds downloading platform binaries

warp-image solves this by compiling image processing codecs to WebAssembly. One binary works everywhere Node.js runs.

## Quick Start

```bash
npm install warp-image
```

```typescript
import { warpImage } from "warp-image";

// Resize and compress
const output = await warpImage(inputBuffer)
  .resize(800, 600)
  .jpeg({ quality: 80 })
  .toBuffer();

// Convert format
const webp = await warpImage(jpegBuffer).webp({ quality: 75 }).toBuffer();

// Get metadata
const { width, height } = await warpImage(buffer).metadata();
```

## Migrating from Sharp

```typescript
// Before (Sharp)
import sharp from "sharp";
await sharp(input).resize(300, 200).jpeg({ quality: 80 }).toBuffer();

// After (warp-image) — same API
import { warpImage } from "warp-image";
await warpImage(input).resize(300, 200).jpeg({ quality: 80 }).toBuffer();
```

## Supported Operations

- **Resize** — with Lanczos3 downscaling
- **Format** — JPEG, PNG, WebP (AVIF planned)
- **Transform** — rotate, flip, flop, crop
- **Color** — grayscale
- **Metadata** — width, height, format

## Platform Support

Works everywhere Node.js 18+ runs:

- Linux (x64, arm64, musl, glibc)
- macOS (x64, Apple Silicon)
- Windows (x64, arm64)
- Docker (any base image)
- AWS Lambda / GCP Cloud Functions / Azure Functions

## Development

### Prerequisites

- [Rust](https://rustup.rs/) with `wasm32-unknown-unknown` target
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+

### Setup

```bash
# Install Rust WASM target
rustup target add wasm32-unknown-unknown

# Install dependencies
pnpm install

# Build WASM module
pnpm build:wasm

# Build TypeScript
pnpm build:ts

# Run tests
pnpm test
```

## License

MIT
