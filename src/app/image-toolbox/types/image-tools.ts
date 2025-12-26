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
  // 添加错误处理状态
  error?: string;
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

// 添加图片处理结果类型
export interface ImageProcessResult {
  success: boolean;
  data?: string | Blob;
  error?: string;
}

// 添加事件处理类型
export interface ImageEventHandlers {
  onLoad?: (image: ImageFile) => void;
  onError?: (image: ImageFile, error: Error) => void;
  onProgress?: (progress: number) => void;
}