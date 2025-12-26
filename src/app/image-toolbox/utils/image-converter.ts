export async function convertImage(
  file: File,
  options: {
    format: 'webp' | 'png' | 'jpg' | 'avif';
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('无法初始化画布');

  let { width, height } = bitmap;
  
  // 调整大小
  if (options.maxWidth && width > options.maxWidth) {
    const ratio = options.maxWidth / width;
    width = options.maxWidth;
    height = Math.round(height * ratio);
  }
  
  if (options.maxHeight && height > options.maxHeight) {
    const ratio = options.maxHeight / height;
    height = options.maxHeight;
    width = Math.round(width * ratio);
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const mimeType = {
    webp: 'image/webp',
    png: 'image/png',
    jpg: 'image/jpeg',
    avif: 'image/avif'
  }[options.format];

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`无法生成 ${options.format.toUpperCase()} 文件`));
      },
      mimeType,
      options.quality
    );
  });
}

export async function compressImage(file: File, quality: number): Promise<Blob> {
  return convertImage(file, { format: 'webp', quality, maxWidth: 1920 });
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  maintainAspect: boolean = true
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('无法初始化画布');
  
  let targetWidth = width;
  let targetHeight = height;
  
  if (maintainAspect) {
    const aspect = bitmap.width / bitmap.height;
    if (width / height > aspect) {
      targetWidth = Math.round(height * aspect);
    } else {
      targetHeight = Math.round(width / aspect);
    }
  }
  
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('无法调整图片大小'));
      },
      file.type || 'image/jpeg',
      0.92
    );
  });
}

export function applyFilter(
  imageData: ImageData,
  filter: 'grayscale' | 'sepia' | 'invert' | 'vintage'
): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(data), width, height);
  const resultData = result.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    switch (filter) {
      case 'grayscale': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        resultData[i] = resultData[i + 1] = resultData[i + 2] = gray;
        break;
      }
      case 'sepia': {
        resultData[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        resultData[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        resultData[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        break;
      }
      case 'invert': {
        resultData[i] = 255 - r;
        resultData[i + 1] = 255 - g;
        resultData[i + 2] = 255 - b;
        break;
      }
      case 'vintage': {
        resultData[i] = Math.min(255, r * 0.9 + 20);
        resultData[i + 1] = Math.min(255, g * 0.8 + 10);
        resultData[i + 2] = Math.min(255, b * 0.7);
        break;
      }
    }
    resultData[i + 3] = data[i + 3];
  }
  
  return result;
}