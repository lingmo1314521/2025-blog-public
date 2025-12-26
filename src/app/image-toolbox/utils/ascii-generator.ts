export async function generateAsciiArt(
  file: File,  // 改为接收 File 对象而不是 URL
  options: {
    style: 'simple' | 'detailed' | 'block' | 'braille' | 'custom';
    width: number;
    invert: boolean;
    color: boolean;
    customChars?: string;
    density: number;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // 创建临时 URL
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('无法初始化画布');
        
        // 计算高度以保持宽高比
        const aspectRatio = img.height / img.width;
        const height = Math.round(options.width * aspectRatio * 0.5);
        
        canvas.width = options.width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, options.width, height);
        
        const imageData = ctx.getImageData(0, 0, options.width, height);
        const data = imageData.data;
        
        let chars = options.customChars || ASCII_CHAR_SETS[options.style];
        if (options.invert) {
          chars = chars.split('').reverse().join('');
        }
        
        const charLength = chars.length;
        let result = '';
        
        // 生成 ASCII
        for (let y = 0; y < height; y += options.density) {
          for (let x = 0; x < options.width; x += options.density) {
            const index = (y * options.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            
            const charIndex = Math.floor((1 - brightness) * (charLength - 1));
            result += chars[charIndex] || ' ';
          }
          result += '\n';
        }
        
        // 清理临时 URL
        URL.revokeObjectURL(url);
        resolve(result);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法加载图片'));
    };
  });
}