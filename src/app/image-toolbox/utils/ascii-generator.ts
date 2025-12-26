export class AsciiGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not supported');
    this.ctx = ctx;
  }
  
  // 字符集定义
  private charsets = {
    simple: '@%#*+=-:. ',
    detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    block: '█▓▒░ ',
    braille: '⣿⣷⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣤⣦⣮⣭⣩⣪⣫⣬⣭⣩⣪⣫⣬⣄⣆⣇⡧⡤⡢⡡⡣⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿',
    custom: '@%#*+=-:. '
  };
  
  async generateAsciiArt(
    imageSource: File | string,
    options: {
      style: 'simple' | 'detailed' | 'block' | 'braille' | 'custom';
      width: number;
      invert: boolean;
      color: boolean;
      customChars?: string;
      density: number;
      fontSize: number;
    }
  ): Promise<{
    text: string;
    html: string;
    preview: string;
  }> {
    try {
      // 创建临时Image对象
      const img = await this.loadImage(imageSource);
      
      // 计算ASCII画布大小
      const aspectRatio = img.height / img.width;
      const asciiWidth = Math.min(options.width, 200); // 限制最大宽度
      const asciiHeight = Math.round(asciiWidth * aspectRatio * 0.5);
      
      // 设置画布大小
      this.canvas.width = asciiWidth * options.density;
      this.canvas.height = asciiHeight * options.density;
      
      // 绘制图片
      this.ctx.drawImage(
        img, 
        0, 0, 
        this.canvas.width, 
        this.canvas.height
      );
      
      // 获取像素数据
      const imageData = this.ctx.getImageData(
        0, 0, 
        this.canvas.width, 
        this.canvas.height
      );
      
      // 生成ASCII
      const result = this.generateAsciiFromData(imageData, options);
      
      // 创建预览
      const preview = this.createAsciiPreview(result.text, options);
      
      return {
        text: result.text,
        html: result.html,
        preview
      };
      
    } catch (error) {
      console.error('ASCII generation error:', error);
      throw new Error(`Failed to generate ASCII art: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      if (typeof source === 'string') {
        img.src = source;
      } else {
        const url = URL.createObjectURL(source);
        img.src = url;
        img.onload = () => {
          setTimeout(() => URL.revokeObjectURL(url), 1000); // 延迟释放URL
        };
      }
      
      img.onload = () => {
        // 确保图片完全加载
        if (img.complete && img.naturalWidth > 0) {
          resolve(img);
        } else {
          reject(new Error('Image not properly loaded'));
        }
      };
      
      img.onerror = (e) => {
        console.error('Image load error:', e);
        reject(new Error('Failed to load image'));
      };
      
      // 设置超时
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image load timeout'));
        }
      }, 10000);
    });
  }
  
  private generateAsciiFromData(
    imageData: ImageData,
    options: {
      style: 'simple' | 'detailed' | 'block' | 'braille' | 'custom';
      invert: boolean;
      color: boolean;
      customChars?: string;
      density: number;
    }
  ): { text: string; html: string } {
    const { data, width, height } = imageData;
    const { style, invert, color, customChars, density } = options;
    
    let chars = customChars || this.charsets[style];
    if (invert) {
      chars = chars.split('').reverse().join('');
    }
    
    const charLength = chars.length;
    let textResult = '';
    let htmlResult = '';
    
    // 采样密度调整
    const xStep = density;
    const yStep = density * 2; // 字符高度比宽度大
    
    for (let y = 0; y < height; y += yStep) {
      for (let x = 0; x < width; x += xStep) {
        const pixelIndex = (y * width + x) * 4;
        
        if (pixelIndex >= data.length - 4) continue;
        
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // 计算亮度 (0-1)
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // 选择字符
        const charIndex = Math.floor((invert ? brightness : 1 - brightness) * (charLength - 1));
        const char = chars[Math.min(charIndex, charLength - 1)] || ' ';
        
        if (color) {
          // 生成彩色ASCII (HTML格式)
          htmlResult += `<span style="color: rgb(${r},${g},${b})">${char}</span>`;
          // 文本格式添加ANSI颜色代码
          textResult += this.getAnsiColor(r, g, b) + char + '\x1b[0m';
        } else {
          // 黑白ASCII
          textResult += char;
          htmlResult += char;
        }
      }
      textResult += '\n';
      htmlResult += '<br>';
    }
    
    // 添加ANSI重置代码
    if (color) {
      textResult += '\x1b[0m';
    }
    
    return { text: textResult, html: htmlResult };
  }
  
  private getAnsiColor(r: number, g: number, b: number): string {
    // 转换为256色
    const colorIndex = this.rgbToAnsi256(r, g, b);
    return `\x1b[38;5;${colorIndex}m`;
  }
  
  private rgbToAnsi256(r: number, g: number, b: number): number {
    if (r === g && g === b) {
      if (r < 8) return 16;
      if (r > 248) return 231;
      return Math.round(((r - 8) / 247) * 24) + 232;
    }
    
    return 16 +
      (36 * Math.round(r / 255 * 5)) +
      (6 * Math.round(g / 255 * 5)) +
      Math.round(b / 255 * 5);
  }
  
  private createAsciiPreview(asciiText: string, options: { fontSize: number }): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    // 计算预览大小
    const lines = asciiText.split('\n');
    const lineCount = lines.length;
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    canvas.width = maxLineLength * options.fontSize * 0.6;
    canvas.height = lineCount * options.fontSize * 1.2;
    
    // 设置样式
    ctx.fillStyle = 'black';
    ctx.font = `${options.fontSize}px 'Courier New', monospace`;
    ctx.textBaseline = 'top';
    
    // 绘制ASCII
    lines.forEach((line, index) => {
      ctx.fillText(line, 10, index * options.fontSize * 1.2);
    });
    
    return canvas.toDataURL('image/png');
  }
  
  cleanup() {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}