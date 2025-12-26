export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;  // 改用 previewUrl 避免 URL 管理冲突
  originalUrl: string; // 保持原始 URL 不被释放
  width: number;
  height: number;
  processed?: {
    url: string;
    size: number;
    format: string;
    type: 'converted' | 'filtered' | 'adjusted';
  };
  processing?: boolean;
  asciiArt?: {
    text: string;
    preview: string;
    style: string;
    generatedAt: number;
  };
}

export type ConversionFormat = 'webp' | 'png' | 'jpg' | 'avif';
export type AsciiStyle = 'simple' | 'detailed' | 'block' | 'braille' | 'custom';
export type FilterType = 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'blur' | 'sharpen';
export type AdjustType = 'brightness' | 'contrast' | 'saturation' | 'rotation' | 'flip';

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
  fontSize: number;
}

export interface AdjustOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface FilterOptions {
  type: FilterType;
  intensity: number;
}

export interface BatchOperation {
  type: 'convert' | 'filter' | 'adjust' | 'ascii';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
}

export interface ToolState {
  activeTab: 'converter' | 'ascii' | 'adjust' | 'filters' | 'preview';
  batchMode: boolean;
  selectedImageIds: string[];
}