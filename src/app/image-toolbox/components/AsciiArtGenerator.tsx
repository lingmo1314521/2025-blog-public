'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ImageFile, AsciiStyle } from '../types/image-tools'

// 分离ASCII生成逻辑到单独函数，避免闭包问题
async function generateAsciiArtInternal(
  imageUrl: string,
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
    
    // 设置加载超时
    const timeoutId = setTimeout(() => {
      reject(new Error('图片加载超时'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeoutId);
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
        
        const ASCII_CHAR_SETS = {
          simple: '@%#*+=-:. ',
          detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
          block: '█▓▒░ ',
          braille: '⣿⣷⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣤⣦⣮⣭⣩⣪⣫⣬⣭⣩⣪⣫⣬⣄⣆⣇⡧⡤⡢⡡⡣⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿',
          custom: options.customChars || '@%#*+=-:. '
        };
        
        let chars = ASCII_CHAR_SETS[options.style];
        if (options.invert) {
          chars = chars.split('').reverse().join('');
        }
        
        const charLength = chars.length;
        let result = '';
        
        // 生成ASCII
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
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('无法加载图片'));
    };
    
    // 开始加载图片
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
}

interface AsciiArtGeneratorProps {
  images: ImageFile[];
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void;
}

export default function AsciiArtGenerator({ images, onUpdateImage }: AsciiArtGeneratorProps) {
  const [options, setOptions] = useState({
    style: 'detailed' as AsciiStyle,
    width: 100,
    invert: false,
    color: false,
    customChars: '@%#*+=-:. ',
    density: 2
  });
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const asciiOutputRef = useRef<HTMLPreElement>(null);

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0];

  // 重置选择如果当前选择的图片不存在
  useEffect(() => {
    if (selectedImageId && !images.find(img => img.id === selectedImageId)) {
      setSelectedImageId(images[0]?.id || null);
    }
  }, [images, selectedImageId]);

  const handleGenerateAscii = useCallback(async (image: ImageFile) => {
    if (!image) return;
    
    setGenerating(image.id);
    setError(null);
    
    try {
      // 验证图片URL是否有效
      if (!image.preview || image.preview.startsWith('blob:')) {
        // 对于blob URL，需要等待图片加载
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('图片加载失败'));
          img.src = image.preview;
        });
      }
      
      const ascii = await generateAsciiArtInternal(image.preview, {
        style: options.style,
        width: options.width,
        invert: options.invert,
        color: options.color,
        customChars: options.customChars,
        density: options.density
      });
      
      onUpdateImage(image.id, { asciiArt: ascii });
    } catch (error) {
      console.error('生成ASCII失败:', error);
      setError(error instanceof Error ? error.message : '生成失败，请稍后重试');
      // 不保存失败的结果
    } finally {
      setGenerating(null);
    }
  }, [options, onUpdateImage]);

  const handleCopyAscii = useCallback(() => {
    if (!selectedImage?.asciiArt) return;
    
    navigator.clipboard.writeText(selectedImage.asciiArt)
      .then(() => {
        alert('已复制到剪贴板 (•̀ᴗ•́)و ̑̑');
      })
      .catch(() => {
        // 备用复制方法
        const textArea = document.createElement('textarea');
        textArea.value = selectedImage.asciiArt!;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('已复制到剪贴板 (•̀ᴗ•́)و ̑̑');
      });
  }, [selectedImage]);

  const handleDownloadAscii = useCallback(() => {
    if (!selectedImage?.asciiArt) return;
    
    const blob = new Blob([selectedImage.asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedImage.file.name.replace(/\.[^.]+$/, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [selectedImage]);

  const styleOptions = [
    { id: 'simple' as AsciiStyle, label: '简约', chars: '@%#*+=-:. ' },
    { id: 'detailed' as AsciiStyle, label: '详细', chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ' },
    { id: 'block' as AsciiStyle, label: '方块', chars: '█▓▒░ ' },
    { id: 'braille' as AsciiStyle, label: '盲文', chars: '⣿⣷⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣤⣦⣮⣭⣩⣪⣫⣬⣭⣩⣪⣫⣬⣄⣆⣇⡧⡤⡢⡡⡣⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿' },
    { id: 'custom' as AsciiStyle, label: '自定义', chars: options.customChars }
  ];

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 控制面板 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左侧：选项设置 */}
        <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-700 mb-3">样式设置</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setOptions(prev => ({ 
                      ...prev, 
                      style: style.id,
                      ...(style.id === 'custom' ? {} : { customChars: style.chars })
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm text-center transition ${
                    options.style === style.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
            
            {options.style === 'custom' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  自定义字符集（从暗到亮）
                </label>
                <input
                  type="text"
                  value={options.customChars}
                  onChange={(e) => setOptions(prev => ({ ...prev, customChars: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  maxLength={50}
                  placeholder="例如: @%#*+=-:. "
                />
                <p className="text-xs text-slate-500 mt-1">
                  提示：字符越靠前代表越暗，越靠后代表越亮
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                输出宽度: {options.width} 字符
              </label>
              <input
                type="range"
                min="20"
                max="200"
                step="10"
                value={options.width}
                onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                className="w-full range-track"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                采样密度: {options.density}px
              </label>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={options.density}
                onChange={(e) => setOptions(prev => ({ ...prev, density: parseInt(e.target.value) }))}
                className="w-full range-track"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.invert}
                onChange={(e) => setOptions(prev => ({ ...prev, invert: e.target.checked }))}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">反色</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.color}
                onChange={(e) => setOptions(prev => ({ ...prev, color: e.target.checked }))}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">彩色输出</span>
            </label>
          </div>
          
          {selectedImage && (
            <button
              onClick={() => handleGenerateAscii(selectedImage)}
              disabled={generating === selectedImage.id}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generating === selectedImage.id ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  生成中...
                </>
              ) : (
                '生成 ASCII 艺术'
              )}
            </button>
          )}
        </div>
        
        {/* 右侧：图片选择 */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium text-slate-700 mb-3">选择图片</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageId(image.id)}
                className={`aspect-square relative rounded-lg overflow-hidden border-2 transition ${
                  selectedImageId === image.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <img
                  src={image.preview}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 图片加载失败时显示占位符
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMmUyZTIiLz48cGF0aCBkPSJNNjAgNDBMNDAgNjBNNjAgNjBMNDAgNDAiIHN0cm9rZT0iIzk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
                  }}
                />
                {image.asciiArt && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {selectedImage && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-700 truncate">
                {selectedImage.file.name}
              </div>
              <div className="text-xs text-slate-500">
                {selectedImage.width} × {selectedImage.height}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ASCII 输出区域 */}
      {selectedImage?.asciiArt && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <span className="font-medium text-slate-700">ASCII 预览</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyAscii}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg font-medium hover:bg-blue-100 transition"
              >
                复制文本
              </button>
              <button
                onClick={handleDownloadAscii}
                className="px-3 py-1.5 bg-green-50 text-green-600 text-sm rounded-lg font-medium hover:bg-green-100 transition"
              >
                下载文件
              </button>
              <button
                onClick={() => handleGenerateAscii(selectedImage)}
                className="px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-lg font-medium hover:bg-purple-100 transition"
              >
                重新生成
              </button>
            </div>
          </div>
          <div className="bg-black p-4 max-h-96 overflow-auto">
            <pre
              ref={asciiOutputRef}
              className="text-sm leading-4 font-mono whitespace-pre text-white"
              style={{
                fontSize: `${Math.max(8, 12 / (options.width / 100))}px`,
                lineHeight: '1'
              }}
            >
              {selectedImage.asciiArt}
            </pre>
          </div>
        </div>
      )}
      
      {/* 使用说明 */}
      <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-700 mb-2">使用说明：</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>先选择图片，然后调整样式和参数，点击"生成 ASCII 艺术"</li>
          <li>如果生成失败，请检查图片URL是否有效，或重新选择图片</li>
          <li>输出宽度影响ASCII艺术的精细程度，宽度越大细节越多</li>
          <li>采样密度越小，细节越丰富，但生成时间越长</li>
          <li>可以复制文本到任何支持纯文本的编辑器或聊天窗口</li>
          <li>如果遇到问题，可以尝试刷新页面后重新操作</li>
        </ul>
      </div>
    </div>
  )
}