import { ConvertOptions, ConversionResult, FormatInfo, ImageFormat } from '../types/image-converter'

/**
 * 图片格式信息配置
 */
export const FORMATS: Record<ImageFormat, FormatInfo> = {
  webp: {
    name: 'WEBP',
    description: '现代图片格式，压缩率高，支持透明和动画',
    supportsQuality: true,
    supportsTransparency: true,
    mimeType: 'image/webp',
    defaultQuality: 0.8,
    fileExtension: '.webp',
    colorMode: 'both'
  },
  png: {
    name: 'PNG',
    description: '无损压缩，支持透明背景',
    supportsQuality: false,
    supportsTransparency: true,
    mimeType: 'image/png',
    defaultQuality: 1,
    fileExtension: '.png',
    colorMode: 'lossless'
  },
  jpeg: {
    name: 'JPEG',
    description: '适合照片，压缩率高',
    supportsQuality: true,
    supportsTransparency: false,
    mimeType: 'image/jpeg',
    defaultQuality: 0.85,
    fileExtension: '.jpg',
    colorMode: 'lossy'
  },
  avif: {
    name: 'AVIF',
    description: '下一代图片格式，压缩率极高',
    supportsQuality: true,
    supportsTransparency: true,
    mimeType: 'image/avif',
    defaultQuality: 0.7,
    fileExtension: '.avif',
    colorMode: 'both'
  },
  gif: {
    name: 'GIF',
    description: '支持简单动画，256色限制',
    supportsQuality: false,
    supportsTransparency: true,
    mimeType: 'image/gif',
    defaultQuality: 1,
    fileExtension: '.gif',
    colorMode: 'lossless'
  }
}

/**
 * 检测浏览器支持的图片格式
 */
export async function detectSupportedFormats(): Promise<ImageFormat[]> {
  const supportedFormats: ImageFormat[] = ['png', 'jpeg', 'gif'] // 这些格式基本都支持
  
  const testCanvas = document.createElement('canvas')
  testCanvas.width = 1
  testCanvas.height = 1
  const ctx = testCanvas.getContext('2d')
  
  if (!ctx) return supportedFormats
  
  // 测试WEBP支持
  try {
    const webpData = testCanvas.toDataURL('image/webp')
    if (webpData && webpData.length > 0) {
      supportedFormats.push('webp')
    }
  } catch (e) {
    console.log('WEBP not supported')
  }
  
  // 测试AVIF支持（异步检测）
  try {
    const avifBlob = await new Promise<Blob | null>((resolve) => {
      testCanvas.toBlob(resolve, 'image/avif')
    })
    if (avifBlob) {
      supportedFormats.push('avif')
    }
  } catch (e) {
    console.log('AVIF not supported')
  }
  
  return supportedFormats
}

/**
 * 主转换函数 - 支持多种格式
 */
export async function convertImage(
  file: File,
  options: ConvertOptions
): Promise<ConversionResult> {
  const startTime = performance.now()
  
  // 加载图片
  const bitmap = await createImageBitmap(file)
  
  // 创建画布
  const canvas = document.createElement('canvas')
  let width = bitmap.width
  let height = bitmap.height
  
  // 限制最大宽度
  if (options.maxWidth && width > options.maxWidth) {
    const ratio = options.maxWidth / width
    width = options.maxWidth
    height = Math.round(height * ratio)
  }
  
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  
  // 设置背景
  if (options.keepTransparency && FORMATS[options.format].supportsTransparency) {
    // 透明背景
    ctx.clearRect(0, 0, width, height)
  } else {
    // 白色背景（用于不支持透明的格式）
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
  }
  
  // 绘制图片
  ctx.drawImage(bitmap, 0, 0, width, height)
  
  // 转换为目标格式
  const blob = await canvasToBlob(canvas, options)
  
  // 创建URL
  const url = URL.createObjectURL(blob)
  
  const processingTime = performance.now() - startTime
  const compressionRatio = ((file.size - blob.size) / file.size) * 100
  
  return {
    blob,
    url,
    size: blob.size,
    format: options.format,
    originalSize: file.size,
    compressionRatio,
    width,
    height,
    processingTime
  }
}

/**
 * 将Canvas转换为指定格式的Blob
 */
async function canvasToBlob(canvas: HTMLCanvasElement, options: ConvertOptions): Promise<Blob> {
  const formatInfo = FORMATS[options.format]
  
  switch (options.format) {
    case 'webp':
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('WEBP转换失败')),
          formatInfo.mimeType,
          options.quality
        )
      })
      
    case 'jpeg':
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('JPEG转换失败')),
          formatInfo.mimeType,
          options.quality
        )
      })
      
    case 'png':
      return new Promise((resolve, reject) => {
        // PNG不支持quality参数，但我们可以通过压缩级别控制大小
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('PNG转换失败')),
          formatInfo.mimeType
        )
      })
      
    case 'avif':
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('AVIF转换失败')),
          formatInfo.mimeType,
          options.quality
        )
      })
      
    case 'gif':
      // GIF转换比较复杂，这里使用PNG转GIF的简化方法
      // 实际项目中可能需要使用专门的GIF库
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('GIF转换失败')),
          formatInfo.mimeType
        )
      })
      
    default:
      throw new Error(`不支持的格式: ${options.format}`)
  }
}

/**
 * 批量转换图片
 */
export async function batchConvertImages(
  files: File[],
  options: ConvertOptions,
  progressCallback?: (progress: number, currentFile: string) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const total = files.length
  
  for (let i = 0; i < total; i++) {
    try {
      const result = await convertImage(files[i], options)
      results.push(result)
      
      if (progressCallback) {
        progressCallback(((i + 1) / total) * 100, files[i].name)
      }
    } catch (error) {
      console.error(`转换失败 ${files[i].name}:`, error)
      // 跳过失败的文件，继续处理其他
    }
  }
  
  return results
}

/**
 * 根据文件大小和格式推荐最佳设置
 */
export function getRecommendedSettings(fileSize: number, format: ImageFormat): Partial<ConvertOptions> {
  const formatInfo = FORMATS[format]
  
  const settings: Partial<ConvertOptions> = {
    format,
    keepTransparency: formatInfo.supportsTransparency
  }
  
  // 根据文件大小推荐质量
  if (formatInfo.supportsQuality) {
    if (fileSize > 5 * 1024 * 1024) { // >5MB
      settings.quality = 0.6
    } else if (fileSize > 1 * 1024 * 1024) { // >1MB
      settings.quality = 0.75
    } else {
      settings.quality = formatInfo.defaultQuality
    }
  }
  
  // 根据文件大小推荐最大宽度
  if (fileSize > 10 * 1024 * 1024) { // >10MB
    settings.maxWidth = 1920
  } else if (fileSize > 5 * 1024 * 1024) { // >5MB
    settings.maxWidth = 2560
  }
  
  return settings
}

/**
 * 获取格式建议（根据用途）
 */
export function getFormatSuggestions(useCase: 'web' | 'print' | 'storage' | 'social'): ImageFormat[] {
  switch (useCase) {
    case 'web':
      return ['webp', 'avif', 'jpeg', 'png']
    case 'print':
      return ['png', 'jpeg', 'tiff']
    case 'storage':
      return ['webp', 'avif', 'jpeg']
    case 'social':
      return ['jpeg', 'png', 'webp']
    default:
      return ['webp', 'png', 'jpeg']
  }
}

/**
 * 计算文件大小节省
 */
export function calculateSavings(originalSize: number, convertedSize: number): {
  savedBytes: number
  savedPercentage: number
  savedReadable: string
} {
  const savedBytes = originalSize - convertedSize
  const savedPercentage = (savedBytes / originalSize) * 100
  
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes.toFixed(0)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
  
  return {
    savedBytes,
    savedPercentage,
    savedReadable: formatBytes(savedBytes)
  }
}