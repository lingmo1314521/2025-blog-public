export type ImageFormat = 'webp' | 'png' | 'jpeg' | 'avif' | 'gif'

export interface ConvertOptions {
  format: ImageFormat
  quality: number        // 0-1，用于WEBP、JPEG
  maxWidth?: number      // 可选最大宽度
  keepTransparency: boolean  // 是否保持透明背景（PNG/WEBP）
  jpegProgressive: boolean   // JPEG渐进式加载
  pngCompressionLevel: number // PNG压缩级别 0-9
  gifDithering: boolean      // GIF抖动
}

export interface ConversionResult {
  blob: Blob
  url: string
  size: number
  format: ImageFormat
  originalSize: number
  compressionRatio: number
  width: number
  height: number
}

export interface FormatInfo {
  name: string
  description: string
  supportsQuality: boolean
  supportsTransparency: boolean
  mimeType: string
  defaultQuality: number
  fileExtension: string
  colorMode: 'lossy' | 'lossless' | 'both'
}