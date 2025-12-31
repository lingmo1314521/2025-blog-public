import { AsciiCharacterSet, ColorMode, AsciiResult } from '../types/ascii'

// 字符集定义
const CHARACTER_SETS: Record<AsciiCharacterSet, string> = {
  ascii: '@%#*+=-:. ',
  extended: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  boxonly: '█▓▒░ ',
  block: '█▉▊▋▌▍▎▏',
  outline: '◎○●◯◌◍◎',
  slash: '/\\|-_',
  oldskool: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  braille: '⣿⣷⣯⣟⡿⢿⣻⣽⣾',
  hebrew: 'אבגדהוזחטיכךלמםנןסעפףצץקרשת',
  greek: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
  hangul: '가나다라마바사아자차카타파하',
  sjis: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ',
  custom: '@%#*+=-:. '
}

// 尺寸预设
const SIZE_PRESETS = {
  signature: { width: 120, height: 4 },
  tag: { width: 80, height: 30 },
  post: { width: 100, height: 50 },
  letter: { width: 200, height: 100 },
  wallpaper: { width: 300, height: 78 },
  tshirt: { width: 412, height: 108 },
  poster: { width: 600, height: 310 }
}

// ANSI 16 色
const ANSI_COLORS = [
  '#000000', '#800000', '#008000', '#808000',
  '#000080', '#800080', '#008080', '#c0c0c0',
  '#808080', '#ff0000', '#00ff00', '#ffff00',
  '#0000ff', '#ff00ff', '#00ffff', '#ffffff'
]

export class AsciiArtGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布上下文')
    this.ctx = ctx
  }

  /**
   * 主要生成函数
   */
  async generate(
    imageSrc: string,
    options: {
      width: number
      height: number
      charset: AsciiCharacterSet | string
      colorMode: ColorMode
      contrast: number
      sharpness: number
      colorize: number
      blackPoint: number
      whitePoint: number
      transparentBg: boolean
    }
  ): Promise<AsciiResult> {
    const startTime = performance.now()

    // 加载图片
    const img = await this.loadImage(imageSrc)
    
    // 设置画布尺寸
    this.canvas.width = options.width
    this.canvas.height = options.height
    
    // 绘制并处理图片
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)
    
    // 获取像素数据
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    
    // 应用图像处理
    this.processImageData(imageData, options)
    
    // 生成ASCII文本
    const charset = typeof options.charset === 'string' 
      ? options.charset 
      : CHARACTER_SETS[options.charset]
    
    const asciiText = this.generateAsciiText(imageData, charset)
    const colorAscii = options.colorMode === 'color' || options.colorMode === 'c16'
      ? this.generateColorAscii(imageData, charset, options.colorMode)
      : undefined
    
    // 生成其他格式
    const bbCode = this.generateBBCode(asciiText, options.colorMode, options.transparentBg)
    const htmlCode = this.generateHTML(asciiText, options.colorMode, options.transparentBg)
    const markdown = this.generateMarkdown(asciiText)
    const imageUrl = await this.generateAsciiImage(imageData, charset, options)
    
    const processingTime = performance.now() - startTime

    return {
      asciiText,
      colorAscii,
      bbCode,
      htmlCode,
      markdown,
      imageUrl,
      width: options.width,
      height: options.height,
      originalSize: `${img.width}x${img.height}`,
      processingTime
    }
  }

  /**
   * 加载图片
   */
  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * 处理图像数据（应用对比度、锐度等）
   */
  private processImageData(
    imageData: ImageData,
    options: {
      contrast: number
      sharpness: number
      colorize: number
      blackPoint: number
      whitePoint: number
    }
  ): void {
    const data = imageData.data
    const length = data.length
    
    for (let i = 0; i < length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 计算亮度
      let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      
      // 应用对比度
      brightness = this.applyContrast(brightness, options.contrast)
      
      // 应用黑白点
      brightness = this.applyBlackWhitePoint(brightness, options.blackPoint, options.whitePoint)
      
      // 应用颜色化
      if (options.colorize < 255) {
        const gray = (r + g + b) / 3
        const colorFactor = options.colorize / 255
        const grayFactor = 1 - colorFactor
        
        data[i] = Math.round(r * colorFactor + gray * grayFactor)
        data[i + 1] = Math.round(g * colorFactor + gray * grayFactor)
        data[i + 2] = Math.round(b * colorFactor + gray * grayFactor)
      }
      
      // 存储处理后的亮度（用于alpha通道，方便后续使用）
      data[i + 3] = Math.round(brightness * 255)
    }
    
    // 应用锐度（简单的卷积处理）
    if (options.sharpness > 1) {
      this.applySharpness(imageData, options.sharpness)
    }
    
    // 写回处理后的数据
    this.ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用对比度
   */
  private applyContrast(brightness: number, contrast: number): number {
    return ((brightness - 0.5) * contrast) + 0.5
  }

  /**
   * 应用黑白点
   */
  private applyBlackWhitePoint(brightness: number, blackPoint: number, whitePoint: number): number {
    const normalizedBlack = blackPoint / 255
    const normalizedWhite = whitePoint / 255
    
    if (brightness <= normalizedBlack) return 0
    if (brightness >= normalizedWhite) return 1
    
    // 线性映射
    return (brightness - normalizedBlack) / (normalizedWhite - normalizedBlack)
  }

  /**
   * 应用锐度
   */
  private applySharpness(imageData: ImageData, sharpness: number): void {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // 简单的锐化卷积核
    const kernel = [
      [0, -1, 0],
      [-1, 4, -1],
      [0, -1, 0]
    ]
    
    const factor = sharpness / 10
    const tempData = new Uint8ClampedArray(data)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        
        let r = 0, g = 0, b = 0
        
        // 应用卷积核
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4
            const weight = kernel[ky + 1][kx + 1]
            
            r += tempData[kidx] * weight
            g += tempData[kidx + 1] * weight
            b += tempData[kidx + 2] * weight
          }
        }
        
        // 混合原始值
        const originalR = data[idx]
        const originalG = data[idx + 1]
        const originalB = data[idx + 2]
        
        data[idx] = Math.min(255, Math.max(0, originalR + r * factor))
        data[idx + 1] = Math.min(255, Math.max(0, originalG + g * factor))
        data[idx + 2] = Math.min(255, Math.max(0, originalB + b * factor))
      }
    }
  }

  /**
   * 生成ASCII文本
   */
  private generateAsciiText(imageData: ImageData, charset: string): string {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const charsetLength = charset.length
    
    let result = ''
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const brightness = data[idx + 3] / 255 // 从alpha通道获取处理后的亮度
        
        const charIndex = Math.floor(brightness * (charsetLength - 1))
        result += charset.charAt(charIndex)
      }
      result += '\n'
    }
    
    return result
  }

  /**
   * 生成彩色ASCII（HTML格式）
   */
  private generateColorAscii(
    imageData: ImageData, 
    charset: string, 
    colorMode: ColorMode
  ): string {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const charsetLength = charset.length
    
    let html = '<div style="font-family: monospace; line-height: 1; font-size: 12px; background: #000; padding: 10px;">'
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const brightness = data[idx + 3] / 255
        
        const charIndex = Math.floor(brightness * (charsetLength - 1))
        const char = charset.charAt(charIndex)
        
        let color: string
        
        if (colorMode === 'c16') {
          // 转换为16色
          const gray = (r + g + b) / 3
          const colorIndex = Math.floor(gray / 16)
          color = ANSI_COLORS[colorIndex]
        } else {
          // 全彩色
          color = `rgb(${r}, ${g}, ${b})`
        }
        
        html += `<span style="color: ${color}">${this.escapeHtml(char)}</span>`
      }
      html += '<br/>'
    }
    
    html += '</div>'
    return html
  }

  /**
   * 生成BBCode
   */
  private generateBBCode(asciiText: string, colorMode: ColorMode, transparentBg: boolean): string {
    // 简单实现，实际BBCode生成会更复杂
    let bbcode = '[code]\n'
    bbcode += asciiText
    bbcode += '\n[/code]'
    
    return bbcode
  }

  /**
   * 生成HTML
   */
  private generateHTML(asciiText: string, colorMode: ColorMode, transparentBg: boolean): string {
    const bgColor = transparentBg ? 'transparent' : (colorMode === 'wonb' ? '#000' : '#fff')
    const textColor = colorMode === 'wonb' ? '#fff' : '#000'
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ASCII Art</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: ${bgColor};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .ascii-container {
            background: ${bgColor};
            padding: 20px;
            border-radius: 8px;
            max-width: 90vw;
            overflow: auto;
        }
        pre {
            margin: 0;
            line-height: 1;
            letter-spacing: 0.5px;
            color: ${textColor};
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="ascii-container">
        <pre>${this.escapeHtml(asciiText)}</pre>
    </div>
</body>
</html>`
  }

  /**
   * 生成Markdown格式
   */
  private generateMarkdown(asciiText: string): string {
    return '```\n' + asciiText + '\n```'
  }

  /**
   * 生成ASCII图片
   */
  private async generateAsciiImage(
    imageData: ImageData,
    charset: string,
    options: {
      colorMode: ColorMode
      transparentBg: boolean
    }
  ): Promise<string> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布上下文')
    
    const width = imageData.width
    const height = imageData.height
    
    // 设置画布尺寸（每个字符用10x20像素）
    canvas.width = width * 10
    canvas.height = height * 20
    
    // 设置背景
    if (!options.transparentBg) {
      ctx.fillStyle = options.colorMode === 'wonb' ? '#000' : '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    // 设置字体
    ctx.font = '20px "Courier New", monospace'
    ctx.textBaseline = 'top'
    
    // 绘制字符
    const charsetLength = charset.length
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = imageData.data[idx]
        const g = imageData.data[idx + 1]
        const b = imageData.data[idx + 2]
        const brightness = imageData.data[idx + 3] / 255
        
        const charIndex = Math.floor(brightness * (charsetLength - 1))
        const char = charset.charAt(charIndex)
        
        // 设置颜色
        if (options.colorMode === 'color' || options.colorMode === 'c16') {
          if (options.colorMode === 'c16') {
            const gray = (r + g + b) / 3
            const colorIndex = Math.floor(gray / 16)
            ctx.fillStyle = ANSI_COLORS[colorIndex]
          } else {
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
          }
        } else {
          ctx.fillStyle = options.colorMode === 'wonb' ? '#fff' : '#000'
        }
        
        // 绘制字符
        ctx.fillText(char, x * 10, y * 20)
      }
    }
    
    return canvas.toDataURL('image/png')
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * 获取尺寸预设
   */
  static getSizePreset(preset: string): { width: number; height: number } {
    return SIZE_PRESETS[preset as keyof typeof SIZE_PRESETS] || { width: 80, height: 30 }
  }
}