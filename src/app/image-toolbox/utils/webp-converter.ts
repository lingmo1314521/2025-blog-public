/**
 * WEBP图片转换工具（向后兼容）
 */
import { convertImage } from './image-converter'

/**
 * 转换文件为WEBP格式（兼容旧代码）
 */
export async function fileToWebp(file: File, quality: number, maxWidth?: number): Promise<Blob> {
  const result = await convertImage(file, {
    format: 'webp',
    quality,
    maxWidth,
    keepTransparency: true,
    jpegProgressive: true,
    pngCompressionLevel: 6,
    gifDithering: true
  })
  
  return result.blob
}

/**
 * 批量转换图片为WEBP（兼容旧代码）
 */
export async function batchConvertToWebp(
  files: File[],
  quality: number,
  maxWidth?: number,
  progressCallback?: (progress: number) => void
): Promise<Blob[]> {
  const results = await Promise.all(
    files.map(async (file, index) => {
      try {
        const result = await fileToWebp(file, quality, maxWidth)
        if (progressCallback) {
          progressCallback(((index + 1) / files.length) * 100)
        }
        return result
      } catch (error) {
        console.error(`转换失败 ${file.name}:`, error)
        throw error
      }
    })
  )
  
  return results
}

/**
 * 计算图片压缩率
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return ((originalSize - compressedSize) / originalSize) * 100
}