/* tslint:disable */
/* eslint-disable */

export class ImageProcessor {
    free(): void;
    [Symbol.dispose](): void;
    crop(x: number, y: number, width: number, height: number): void;
    flip_horizontal(): void;
    flip_vertical(): void;
    /**
     * Returns the detected format of the input image (e.g. "jpeg", "png", "webp").
     */
    format(): string;
    grayscale(): void;
    height(): number;
    /**
     * Encode to JPEG using mozjpeg-rs (pure-Rust mozjpeg).
     *
     * `Preset::BaselineFastest` disables trellis quantization and Huffman
     * optimisation — encoding is 4-10× faster than `BaselineBalanced` with
     * files ~10-20% larger at equivalent quality.  For server-side image
     * pipelines where throughput matters, this is the right default.
     *
     * Zero-copy fast path: if the source image is already RGB8 (the common
     * case for decoded JPEGs) we borrow the pixel buffer directly instead of
     * calling `to_rgb8()` which would copy the entire frame (~17 MB for a
     * 2725×2225 image).
     */
    jpeg(quality: number): Uint8Array;
    constructor(buffer: Uint8Array);
    png(): Uint8Array;
    /**
     * Resize preserving aspect ratio (fits within width × height).
     * Uses SIMD-accelerated fast_image_resize when the pixel format supports it.
     */
    resize(width: number, height: number): void;
    /**
     * Resize to exact dimensions (may distort aspect ratio).
     * Uses SIMD-accelerated fast_image_resize when the pixel format supports it.
     */
    resize_exact(width: number, height: number): void;
    rotate180(): void;
    rotate270(): void;
    rotate90(): void;
    /**
     * Encodes the image as WebP.
     *
     * Note: `image-webp` only supports lossless VP8L encoding. The `quality`
     * parameter is accepted for API compatibility but is ignored — output is
     * always lossless.
     */
    webp(_quality: number): Uint8Array;
    width(): number;
}
