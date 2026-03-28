use fast_image_resize::images::Image as FirImage;
use fast_image_resize::{PixelType, ResizeAlg, ResizeOptions, Resizer};
use image::imageops::FilterType;
use image::{DynamicImage, ImageBuffer};
use wasm_bindgen::prelude::*;

use crate::ImageProcessor;

/// Resize a `DynamicImage` using `fast_image_resize` (WASM SIMD128-accelerated).
///
/// `fast_image_resize` supports all U8/U8x2/U8x3/U8x4 pixel formats with Wasm32
/// SIMD128 intrinsics enabled at runtime, giving a ~10-15× speedup over the
/// scalar `image::imageops::resize` path.
///
/// The function converts through the pixel format best suited to the source image:
///  - JPEG (RGB8)   → resize as U8x3
///  - PNG/WebP RGBA → resize as U8x4
///  - Luma8         → resize as U8
///  - Everything else → fall back to `image` crate (scalar) to stay correct
fn fir_resize(img: &DynamicImage, dst_w: u32, dst_h: u32) -> DynamicImage {
    // fast_image_resize works on typed pixel buffers; we need to know the
    // concrete pixel type to pick the right FirImage variant.  Rather than
    // duplicating format detection, delegate to DynamicImage's pixel_type()
    // via the IntoImageView trait — the `image` feature of fast_image_resize
    // implements IntoImageView for DynamicImage automatically.
    //
    // If the pixel type isn't supported by fir (e.g. Rgb16, F32 variants) we
    // fall back to the scalar image-crate path so correctness is never lost.

    let src_w = img.width();
    let src_h = img.height();

    // Nothing to do if dimensions are already correct.
    if src_w == dst_w && src_h == dst_h {
        return img.clone();
    }

    // Check if the image type is supported by fast_image_resize via the
    // IntoImageView trait implementation.
    let pixel_type = match img {
        DynamicImage::ImageRgb8(_) => Some(PixelType::U8x3),
        DynamicImage::ImageRgba8(_) => Some(PixelType::U8x4),
        DynamicImage::ImageLuma8(_) => Some(PixelType::U8),
        DynamicImage::ImageLumaA8(_) => Some(PixelType::U8x2),
        // Formats not covered by Wasm32 SIMD128 paths or not implemented in
        // the IntoImageView impl fall back to the scalar image-crate path.
        _ => None,
    };

    let Some(pt) = pixel_type else {
        return img.resize(dst_w, dst_h, FilterType::Lanczos3);
    };

    let channels = pt.size() as usize; // bytes per pixel
    let mut dst_buf = vec![0u8; dst_w as usize * dst_h as usize * channels];

    let mut dst_image =
        FirImage::from_slice_u8(dst_w, dst_h, &mut dst_buf, pt).expect("valid fir destination");

    let mut resizer = Resizer::new();
    let opts = ResizeOptions::new().resize_alg(ResizeAlg::Convolution(
        fast_image_resize::FilterType::Lanczos3,
    ));

    // SAFETY: IntoImageView is implemented for &DynamicImage via the `image`
    // feature of fast_image_resize.  The resize call only reads src bytes and
    // writes into dst_buf which we own.
    resizer
        .resize(img, &mut dst_image, &opts)
        .expect("fir resize failed");

    // Convert the raw pixel buffer back into a DynamicImage of the same kind.
    match img {
        DynamicImage::ImageRgb8(_) => {
            let buf = ImageBuffer::from_raw(dst_w, dst_h, dst_buf)
                .expect("valid rgb8 buffer after fir resize");
            DynamicImage::ImageRgb8(buf)
        }
        DynamicImage::ImageRgba8(_) => {
            let buf = ImageBuffer::from_raw(dst_w, dst_h, dst_buf)
                .expect("valid rgba8 buffer after fir resize");
            DynamicImage::ImageRgba8(buf)
        }
        DynamicImage::ImageLuma8(_) => {
            let buf = ImageBuffer::from_raw(dst_w, dst_h, dst_buf)
                .expect("valid luma8 buffer after fir resize");
            DynamicImage::ImageLuma8(buf)
        }
        DynamicImage::ImageLumaA8(_) => {
            let buf = ImageBuffer::from_raw(dst_w, dst_h, dst_buf)
                .expect("valid lumaa8 buffer after fir resize");
            DynamicImage::ImageLumaA8(buf)
        }
        _ => unreachable!("handled by the None branch above"),
    }
}

#[wasm_bindgen]
impl ImageProcessor {
    /// Resize preserving aspect ratio (fits within width × height).
    /// Uses SIMD-accelerated fast_image_resize when the pixel format supports it.
    pub fn resize(&mut self, width: u32, height: u32) {
        // Compute the aspect-ratio-preserving target dimensions the same way
        // `image::DynamicImage::resize` does (fit within the bounding box).
        let (src_w, src_h) = (self.img.width(), self.img.height());
        let (dst_w, dst_h) = if src_w == 0 || src_h == 0 {
            (width, height)
        } else {
            let scale = (width as f64 / src_w as f64).min(height as f64 / src_h as f64);
            (
                ((src_w as f64 * scale).round() as u32).max(1),
                ((src_h as f64 * scale).round() as u32).max(1),
            )
        };
        self.img = fir_resize(&self.img, dst_w, dst_h);
    }

    /// Resize to exact dimensions (may distort aspect ratio).
    /// Uses SIMD-accelerated fast_image_resize when the pixel format supports it.
    pub fn resize_exact(&mut self, width: u32, height: u32) {
        self.img = fir_resize(&self.img, width, height);
    }

    pub fn crop(&mut self, x: u32, y: u32, width: u32, height: u32) {
        self.img = self.img.crop(x, y, width, height);
    }

    pub fn rotate90(&mut self) {
        self.img = self.img.rotate90();
    }

    pub fn rotate180(&mut self) {
        self.img = self.img.rotate180();
    }

    pub fn rotate270(&mut self) {
        self.img = self.img.rotate270();
    }

    pub fn flip_vertical(&mut self) {
        self.img = self.img.flipv();
    }

    pub fn flip_horizontal(&mut self) {
        self.img = self.img.fliph();
    }

    pub fn grayscale(&mut self) {
        self.img = self.img.grayscale();
    }
}
