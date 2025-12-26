export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not supported');
    this.ctx = ctx;
  }
  
  async loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      if (typeof source === 'string') {
        img.src = source;
      } else {
        const url = URL.createObjectURL(source);
        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
      }
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }
  
  async getImageData(source: File | string): Promise<ImageData> {
    const img = await this.loadImage(source);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    return this.ctx.getImageData(0, 0, img.width, img.height);
  }
  
  async convertFormat(
    imageData: ImageData,
    format: 'webp' | 'png' | 'jpg' | 'avif',
    quality: number = 0.8
  ): Promise<Blob> {
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`Failed to convert to ${format}`));
        },
        `image/${format}`,
        quality
      );
    });
  }
  
  async resize(
    imageData: ImageData,
    width: number,
    height: number,
    maintainAspect: boolean = true
  ): Promise<ImageData> {
    let targetWidth = width;
    let targetHeight = height;
    
    if (maintainAspect) {
      const aspect = imageData.width / imageData.height;
      if (width / height > aspect) {
        targetWidth = Math.round(height * aspect);
      } else {
        targetHeight = Math.round(width / aspect);
      }
    }
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) throw new Error('Failed to create temp canvas');
    
    // 使用高质量缩放
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    
    const img = await this.createImageFromData(imageData);
    tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    return tempCtx.getImageData(0, 0, targetWidth, targetHeight);
  }
  
  async applyAdjustments(
    imageData: ImageData,
    adjustments: {
      brightness: number;
      contrast: number;
      saturation: number;
      rotation: number;
    }
  ): Promise<ImageData> {
    const { brightness, contrast, saturation, rotation } = adjustments;
    const data = new Uint8ClampedArray(imageData.data);
    
    // 应用亮度、对比度、饱和度
    const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 亮度
      let newR = r * brightness;
      let newG = g * brightness;
      let newB = b * brightness;
      
      // 对比度
      newR = contrastFactor * (newR - 128) + 128;
      newG = contrastFactor * (newG - 128) + 128;
      newB = contrastFactor * (newB - 128) + 128;
      
      // 饱和度
      const gray = 0.299 * newR + 0.587 * newG + 0.114 * newB;
      newR = gray + saturation * (newR - gray);
      newG = gray + saturation * (newG - gray);
      newB = gray + saturation * (newB - gray);
      
      // 限制范围
      data[i] = Math.max(0, Math.min(255, newR));
      data[i + 1] = Math.max(0, Math.min(255, newG));
      data[i + 2] = Math.max(0, Math.min(255, newB));
    }
    
    const result = new ImageData(data, imageData.width, imageData.height);
    
    // 应用旋转
    if (rotation !== 0) {
      return this.rotate(result, rotation);
    }
    
    return result;
  }
  
  async applyFilter(
    imageData: ImageData,
    filter: 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'blur' | 'sharpen'
  ): Promise<ImageData> {
    const data = new Uint8ClampedArray(imageData.data);
    
    switch (filter) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = avg;
        }
        break;
        
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
        
      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        break;
        
      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 0.9 + 20);
          data[i + 1] = Math.min(255, data[i + 1] * 0.8 + 10);
          data[i + 2] = Math.min(255, data[i + 2] * 0.7);
        }
        break;
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }
  
  async rotate(imageData: ImageData, degrees: number): Promise<ImageData> {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算旋转后的尺寸
    const newWidth = Math.abs(width * cos) + Math.abs(height * sin);
    const newHeight = Math.abs(width * sin) + Math.abs(height * cos);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) throw new Error('Failed to create temp canvas');
    
    // 设置旋转中心
    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate(radians);
    tempCtx.translate(-width / 2, -height / 2);
    
    const img = await this.createImageFromData(imageData);
    tempCtx.drawImage(img, 0, 0);
    
    return tempCtx.getImageData(0, 0, newWidth, newHeight);
  }
  
  private async createImageFromData(imageData: ImageData): Promise<HTMLImageElement> {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) throw new Error('Failed to create temp canvas');
    
    tempCtx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = tempCanvas.toDataURL();
    });
  }
  
  cleanup() {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}