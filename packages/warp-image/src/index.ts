import { WarpImage } from "./warp.js";

export function warpImage(input: Buffer | Uint8Array): WarpImage {
  return new WarpImage(input);
}

export { WarpImage };
export type {
  ResizeOptions,
  JpegOptions,
  PngOptions,
  WebpOptions,
  Metadata,
  OutputInfo,
} from "./types.js";
