use image::{DynamicImage, ImageFormat};
use mozjpeg_rs::{Encoder, Preset, Subsampling};
use std::io::Cursor;
use wasm_bindgen::prelude::*;

use crate::ImageProcessor;

#[wasm_bindgen]
impl ImageProcessor {
    /// Encode to JPEG using mozjpeg-rs (pure-Rust mozjpeg).
    ///
    /// `Preset::BaselineFastest` disables trellis quantization and Huffman
    /// optimisation — encoding is 4-10× faster than `BaselineBalanced` with
    /// files ~10-20% larger at equivalent quality.  For server-side image
    /// pipelines where throughput matters, this is the right default.
    ///
    /// Zero-copy fast path: if the source image is already RGB8 (the common
    /// case for decoded JPEGs) we borrow the pixel buffer directly instead of
    /// calling `to_rgb8()` which would copy the entire frame (~17 MB for a
    /// 2725×2225 image).
    pub fn jpeg(&self, quality: u8) -> Result<Vec<u8>, JsValue> {
        let (width, height) = (self.img.width(), self.img.height());

        // Zero-copy path for RGB8 (most common after JPEG decode).
        // For any other pixel format (RGBA, Luma, etc.) we must convert to
        // drop the alpha channel or up/down-sample components before encoding.
        let owned;
        let pixels: &[u8] = if let DynamicImage::ImageRgb8(ref rgb) = self.img {
            rgb.as_raw()
        } else {
            owned = self.img.to_rgb8();
            owned.as_raw()
        };

        Encoder::new(Preset::BaselineFastest)
            .quality(quality)
            // Explicit 4:2:0 chroma subsampling matches sharp/libjpeg-turbo
            // defaults and avoids a potential 4:4:4 default that would both
            // slow encoding and inflate file sizes.
            .subsampling(Subsampling::S420)
            .encode_rgb(pixels, width, height)
            .map_err(|e| JsValue::from_str(&format!("JPEG encode failed: {e}")))
    }

    pub fn png(&self) -> Result<Vec<u8>, JsValue> {
        let mut buf = Cursor::new(Vec::new());
        self.img
            .write_to(&mut buf, ImageFormat::Png)
            .map_err(|e| JsValue::from_str(&format!("PNG encode failed: {e}")))?;
        Ok(buf.into_inner())
    }

    /// Encodes the image as WebP.
    ///
    /// Note: `image-webp` only supports lossless VP8L encoding. The `quality`
    /// parameter is accepted for API compatibility but is ignored — output is
    /// always lossless.
    pub fn webp(&self, _quality: u8) -> Result<Vec<u8>, JsValue> {
        let mut buf = Cursor::new(Vec::new());
        self.img
            .write_to(&mut buf, ImageFormat::WebP)
            .map_err(|e| JsValue::from_str(&format!("WebP encode failed: {e}")))?;
        Ok(buf.into_inner())
    }
}
