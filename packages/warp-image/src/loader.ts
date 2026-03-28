import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface WasmModule {
  ImageProcessor: new (buffer: Uint8Array) => WasmImageProcessor;
}

export interface WasmImageProcessor {
  width(): number;
  height(): number;
  format(): string;
  resize(width: number, height: number): void;
  resize_exact(width: number, height: number): void;
  crop(x: number, y: number, width: number, height: number): void;
  rotate90(): void;
  rotate180(): void;
  rotate270(): void;
  flip_vertical(): void;
  flip_horizontal(): void;
  grayscale(): void;
  jpeg(quality: number): Uint8Array;
  png(): Uint8Array;
  webp(quality: number): Uint8Array;
  free(): void;
}

let wasmModule: WasmModule | null = null;

export function getWasmModule(): WasmModule {
  if (wasmModule) return wasmModule;

  const dir =
    typeof __filename !== "undefined"
      ? dirname(__filename)
      : dirname(fileURLToPath(import.meta.url));

  const wasmJsPath = join(dir, "..", "wasm", "warp_core.js");

  // wasm-pack nodejs target auto-loads WASM synchronously via require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  wasmModule = require(wasmJsPath) as WasmModule;
  return wasmModule;
}
