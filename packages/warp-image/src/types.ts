export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?: "center" | "top" | "right" | "bottom" | "left";
  withoutEnlargement?: boolean;
}

export interface JpegOptions {
  quality?: number;
  progressive?: boolean;
}

export interface PngOptions {
  compressionLevel?: number;
}

export interface WebpOptions {
  quality?: number;
}

export interface Metadata {
  width: number;
  height: number;
  format: string;
  channels?: number;
}

export interface OutputInfo {
  format: string;
  size: number;
  width: number;
  height: number;
}
