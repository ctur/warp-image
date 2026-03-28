mod decode;
mod encode;
mod transform;

use image::{DynamicImage, ImageFormat};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ImageProcessor {
    img: DynamicImage,
    input_format: ImageFormat,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer: &[u8]) -> Result<ImageProcessor, JsValue> {
        let input_format = image::guess_format(buffer)
            .map_err(|e| JsValue::from_str(&format!("Failed to detect image format: {e}")))?;
        let img = image::load_from_memory(buffer)
            .map_err(|e| JsValue::from_str(&format!("Failed to decode image: {e}")))?;
        Ok(ImageProcessor { img, input_format })
    }

    pub fn width(&self) -> u32 {
        self.img.width()
    }

    pub fn height(&self) -> u32 {
        self.img.height()
    }

    /// Returns the detected format of the input image (e.g. "jpeg", "png", "webp").
    pub fn format(&self) -> String {
        match self.input_format {
            ImageFormat::Jpeg => "jpeg".to_string(),
            ImageFormat::Png => "png".to_string(),
            ImageFormat::WebP => "webp".to_string(),
            ImageFormat::Gif => "gif".to_string(),
            ImageFormat::Bmp => "bmp".to_string(),
            ImageFormat::Tiff => "tiff".to_string(),
            ImageFormat::Ico => "ico".to_string(),
            _ => "unknown".to_string(),
        }
    }
}
