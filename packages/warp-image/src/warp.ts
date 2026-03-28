import { writeFile } from "node:fs/promises";
import { getWasmModule } from "./loader.js";
import type {
  ResizeOptions,
  JpegOptions,
  PngOptions,
  WebpOptions,
  Metadata,
  OutputInfo,
} from "./types.js";

interface PipelineStep {
  type: string;
  options: Record<string, number | string | boolean | undefined>;
}

export class WarpImage {
  private inputBuffer: Buffer | Uint8Array;
  private steps: PipelineStep[] = [];
  private outputFormat: "jpeg" | "png" | "webp" = "jpeg";
  private outputOptions: Record<string, number | string | boolean | undefined> =
    {};
  // Tracks the output dimensions after toBuffer() so toFile() does not need
  // to re-decode the encoded result just to read width/height.
  private _lastWidth: number | undefined;
  private _lastHeight: number | undefined;

  constructor(input: Buffer | Uint8Array) {
    if (!input || input.length === 0) {
      throw new Error("Input buffer is empty or missing");
    }
    this.inputBuffer = input;
  }

  resize(widthOrOptions?: number | ResizeOptions, height?: number): this {
    if (typeof widthOrOptions === "object") {
      this.steps.push({
        type: "resize",
        options: {
          width: widthOrOptions.width,
          height: widthOrOptions.height,
          fit: widthOrOptions.fit,
          withoutEnlargement: widthOrOptions.withoutEnlargement,
        },
      });
    } else {
      this.steps.push({
        type: "resize",
        options: { width: widthOrOptions, height },
      });
    }
    return this;
  }

  crop(x: number, y: number, width: number, height: number): this {
    if (width <= 0 || height <= 0) {
      throw new Error(
        `Invalid crop dimensions: width and height must be greater than zero (got ${width}x${height})`
      );
    }
    this.steps.push({ type: "crop", options: { x, y, width, height } });
    return this;
  }

  rotate(angle?: number): this {
    this.steps.push({ type: "rotate", options: { angle: angle ?? 0 } });
    return this;
  }

  flip(): this {
    this.steps.push({ type: "flip", options: {} });
    return this;
  }

  flop(): this {
    this.steps.push({ type: "flop", options: {} });
    return this;
  }

  grayscale(): this {
    this.steps.push({ type: "grayscale", options: {} });
    return this;
  }

  greyscale(): this {
    return this.grayscale();
  }

  jpeg(options: JpegOptions = {}): this {
    this.outputFormat = "jpeg";
    this.outputOptions = { quality: 80, ...options };
    return this;
  }

  png(options: PngOptions = {}): this {
    this.outputFormat = "png";
    this.outputOptions = {
      compressionLevel: options.compressionLevel,
    };
    return this;
  }

  webp(options: WebpOptions = {}): this {
    this.outputFormat = "webp";
    this.outputOptions = { quality: 80, ...options };
    return this;
  }

  async toBuffer(): Promise<Buffer> {
    const wasm = getWasmModule();

    // Opt 5: Buffer is already a Uint8Array subclass — pass it directly to
    // avoid an extra full-image copy in the common case where the caller
    // passes a Node.js Buffer.
    const inputU8 =
      this.inputBuffer instanceof Uint8Array
        ? this.inputBuffer
        : new Uint8Array(this.inputBuffer);

    const processor = new wasm.ImageProcessor(inputU8);

    try {
      for (const step of this.steps) {
        switch (step.type) {
          case "resize": {
            const w = step.options["width"] as number | undefined;
            const h = step.options["height"] as number | undefined;
            const noEnlarge = step.options["withoutEnlargement"] as
              | boolean
              | undefined;

            if (w !== undefined || h !== undefined) {
              const origW = processor.width();
              const origH = processor.height();

              let targetW = w ?? origW;
              let targetH = h ?? origH;

              if (noEnlarge) {
                // Compute what resize() would produce (aspect-ratio preserving)
                // and clamp so we never exceed original dimensions
                if (targetW > origW || targetH > origH) {
                  const scaleW = targetW / origW;
                  const scaleH = targetH / origH;
                  const scale = Math.min(scaleW, scaleH);
                  if (scale > 1) {
                    // requested size is larger — keep original
                    break;
                  }
                }
              }

              processor.resize(targetW, targetH);
            }
            break;
          }
          case "crop": {
            const x = (step.options["x"] as number) ?? 0;
            const y = (step.options["y"] as number) ?? 0;
            const w = step.options["width"] as number;
            const h = step.options["height"] as number;
            processor.crop(x, y, w, h);
            break;
          }
          case "rotate": {
            const angle =
              (((step.options["angle"] as number) % 360) + 360) % 360;
            if (angle === 90) processor.rotate90();
            else if (angle === 180) processor.rotate180();
            else if (angle === 270) processor.rotate270();
            break;
          }
          case "flip":
            processor.flip_vertical();
            break;
          case "flop":
            processor.flip_horizontal();
            break;
          case "grayscale":
            processor.grayscale();
            break;
        }
      }

      // Opt 4: capture final dimensions here before free() so toFile() doesn't
      // need to re-decode the encoded output just to read width/height.
      this._lastWidth = processor.width();
      this._lastHeight = processor.height();

      const quality = (this.outputOptions["quality"] as number) ?? 80;
      let result: Uint8Array;

      switch (this.outputFormat) {
        case "jpeg":
          result = processor.jpeg(quality);
          break;
        case "png":
          result = processor.png();
          break;
        case "webp":
          result = processor.webp(quality);
          break;
      }

      return Buffer.from(result);
    } finally {
      processor.free();
    }
  }

  async toFile(path: string): Promise<OutputInfo> {
    const buf = await this.toBuffer();

    // Opt 4: toBuffer() now tracks the final dimensions via _lastWidth/_lastHeight,
    // so we no longer need to re-decode the encoded output into a second
    // ImageProcessor just to read back width/height.
    const width = this._lastWidth!;
    const height = this._lastHeight!;

    await writeFile(path, buf);

    return {
      format: this.outputFormat,
      size: buf.length,
      width,
      height,
    };
  }

  async metadata(): Promise<Metadata> {
    const wasm = getWasmModule();
    const processor = new wasm.ImageProcessor(new Uint8Array(this.inputBuffer));
    try {
      return {
        width: processor.width(),
        height: processor.height(),
        format: processor.format(),
        channels: colorTypeToChannels(processor.format()),
      };
    } finally {
      processor.free();
    }
  }
}

function colorTypeToChannels(format: string): number {
  // Conservative defaults per format — actual channel count depends on the
  // specific image but these cover the common cases.
  switch (format) {
    case "jpeg":
      return 3;
    case "png":
      return 4;
    case "webp":
      return 4;
    case "gif":
      return 4;
    case "bmp":
      return 3;
    default:
      return 3;
  }
}
