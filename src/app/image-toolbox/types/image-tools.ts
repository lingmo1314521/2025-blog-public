export type ImageFile = {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
  converted?: {
    url: string;
    size: number;
    format: string;
  };
  converting?: boolean;
  asciiArt?: string;
};

export type ConversionFormat = 'webp' | 'png' | 'jpg' | 'avif';
export type AsciiStyle = 'simple' | 'detailed' | 'block' | 'braille' | 'custom';
export type FilterType = 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'blur';

export interface ConversionOptions {
  format: ConversionFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspect: boolean;
}

export interface AsciiOptions {
  style: AsciiStyle;
  width: number;
  invert: boolean;
  color: boolean;
  customChars?: string;
  density: number;
}

export interface AdjustOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}