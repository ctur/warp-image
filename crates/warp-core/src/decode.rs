#![allow(dead_code)]

use image::{DynamicImage, ImageFormat};
use std::io::Cursor;

pub fn detect_format(buffer: &[u8]) -> Result<ImageFormat, String> {
    image::guess_format(buffer).map_err(|e| format!("Unable to detect image format: {e}"))
}

pub fn decode(buffer: &[u8]) -> Result<DynamicImage, String> {
    image::load_from_memory(buffer).map_err(|e| format!("Failed to decode image: {e}"))
}

pub fn decode_with_format(buffer: &[u8], format: ImageFormat) -> Result<DynamicImage, String> {
    let cursor = Cursor::new(buffer);
    image::load(cursor, format).map_err(|e| format!("Failed to decode {format:?} image: {e}"))
}
