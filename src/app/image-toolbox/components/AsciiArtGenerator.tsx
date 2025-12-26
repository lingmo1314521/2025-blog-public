'use client'

import { useState, useCallback, useRef } from 'react'
import { ImageFile, AsciiStyle } from '../types/image-tools'
import { generateAsciiArt } from '../utils/ascii-generator'

interface AsciiArtGeneratorProps {
  images: ImageFile[]
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
}

export default function AsciiArtGenerator({ images, onUpdateImage }: AsciiArtGeneratorProps) {
  const [options, setOptions] = useState({
    style: 'detailed' as AsciiStyle,
    width: 100,
    invert: false,
    color: false,
    customChars: '@%#*+=-:. ',
    density: 2
  })
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const asciiOutputRef = useRef<HTMLPreElement>(null)

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0]

  const handleGenerateAscii = useCallback(async (image: ImageFile) => {
    setGenerating(image.id)
    try {
      const ascii = await generateAsciiArt(image.preview, {
        style: options.style,
        width: options.width,
        invert: options.invert,
        color: options.color,
        customChars: options.customChars,
        density: options.density
      })
      
      onUpdateImage(image.id, { asciiArt: ascii })
    } catch (error) {
      console.error('生成ASCII失败:', error)
      alert('生成失败，请稍后重试 (╥﹏╥)')
    } finally {
      setGenerating(null)
    }
  }, [options, onUpdateImage])

  const handleCopyAscii = useCallback(() => {
    if (!selectedImage?.asciiArt) return
    
    navigator.clipboard.writeText(selectedImage.asciiArt)
      .then(() => {
        alert('已复制到剪贴板 (•̀ᴗ•́)و ̑̑')
      })
      .catch(() => {
        // 备用复制方法
        const textArea = document.createElement('textarea')
        textArea.value = selectedImage.asciiArt!
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('已复制到剪贴板 (•̀ᴗ•́)و ̑̑')
      })
  }, [selectedImage])

  const handleDownloadAscii = useCallback(() => {
    if (!selectedImage?.asciiArt) return
    
    const blob = new Blob([selectedImage.asciiArt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedImage.file.name.replace(/\.[^.]+$/, '')}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [selectedImage])

  const styleOptions = [
    { id: 'simple' as AsciiStyle, label: '简约', chars: '@%#*+=-:. ' },
    { id: 'detailed' as AsciiStyle, label: '详细', chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ' },
    { id: 'block' as AsciiStyle, label: '方块', chars: '█▓▒░ ' },
    { id: 'braille' as AsciiStyle, label: '盲文', chars: '⣿⣷⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣤⣦⣮⣭⣩⣪⣫⣬⣭⣩⣪⣫⣬⣄⣆⣇⡧⡤⡢⡡⡣⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿' },
    { id: 'custom' as AsciiStyle, label: '自定义', chars: options.customChars }
  ]

  return (
    <div className="space-y-6">
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
                    }))
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
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating === selectedImage.id ? '生成中...' : '生成 ASCII 艺术'}
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
                />
                {image.asciiArt && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
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
            </div>
          </div>
          <div className="bg-black p-4 max-h-96 overflow-auto">
            <pre
              ref={asciiOutputRef}
              className={`text-sm leading-none font-mono whitespace-pre ${
                options.color ? '' : 'text-white'
              }`}
              style={{
                fontSize: `${12 / (options.width / 100)}px`
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
          <li>选择图片后，调整样式和参数，点击"生成 ASCII 艺术"</li>
          <li>彩色输出仅在某些终端和编辑器中有效</li>
          <li>输出宽度影响ASCII艺术的精细程度</li>
          <li>采样密度越小，细节越丰富，但生成时间越长</li>
          <li>可以复制文本到任何支持纯文本的编辑器或聊天窗口</li>
        </ul>
      </div>
    </div>
  )
}