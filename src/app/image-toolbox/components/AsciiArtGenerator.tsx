'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ImageFile, AsciiStyle } from '../types/image-tools'
import { AsciiGenerator } from '../utils/ascii-generator'
import { formatBytes, copyToClipboard, downloadBlob } from '../utils/helpers'

interface AsciiArtGeneratorProps {
  images: ImageFile[]
  selectedIds: string[]
  batchMode: boolean
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
  onBatchUpdate?: (updates: Partial<ImageFile>) => void
  onToggleSelect?: (id: string) => void
}

export default function AsciiArtGenerator({
  images,
  selectedIds,
  batchMode,
  onUpdateImage,
  onBatchUpdate,
  onToggleSelect
}: AsciiArtGeneratorProps) {
  const [options, setOptions] = useState({
    style: 'detailed' as AsciiStyle,
    width: 80,
    invert: false,
    color: false,
    customChars: '@%#*+=-:. ',
    density: 2,
    fontSize: 12
  })
  
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<'text' | 'html' | 'image'>('text')
  const [asciiGenerator] = useState(() => new AsciiGenerator())

  const selectedImage = useMemo(() => 
    images.find(img => img.id === selectedImageId) || images[0],
    [images, selectedImageId]
  )

  const styleOptions = [
    { id: 'simple' as AsciiStyle, label: '简约', chars: '@%#*+=-:. ', desc: '基础字符集' },
    { id: 'detailed' as AsciiStyle, label: '详细', chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ', desc: '丰富细节' },
    { id: 'block' as AsciiStyle, label: '方块', chars: '█▓▒░ ', desc: '方块字符' },
    { id: 'braille' as AsciiStyle, label: '盲文', chars: '⣿⣷⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣯⣟⡿⢿⣻⣽⣾⣷⣶⣵⣳⣱⣰⣤⣦⣮⣭⣩⣪⣫⣬⣭⣩⣪⣫⣬⣄⣆⣇⡧⡤⡢⡡⡣⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿', desc: '盲文点阵' },
    { id: 'custom' as AsciiStyle, label: '自定义', chars: options.customChars, desc: '自定义字符' }
  ]

  const generateAscii = useCallback(async (image: ImageFile) => {
    if (generating) return
    
    setGenerating(image.id)
    
    try {
      const result = await asciiGenerator.generateAsciiArt(
        image.originalUrl, // 使用原始URL，确保每次都能加载
        {
          ...options,
          customChars: options.style === 'custom' ? options.customChars : undefined
        }
      )
      
      onUpdateImage(image.id, {
        asciiArt: {
          text: result.text,
          preview: result.preview,
          style: options.style,
          generatedAt: Date.now()
        }
      })
      
    } catch (error) {
      console.error('Failed to generate ASCII:', error)
      
      // 尝试使用预览URL作为备用方案
      try {
        const result = await asciiGenerator.generateAsciiArt(
          image.previewUrl,
          {
            ...options,
            customChars: options.style === 'custom' ? options.customChars : undefined
          }
        )
        
        onUpdateImage(image.id, {
          asciiArt: {
            text: result.text,
            preview: result.preview,
            style: options.style,
            generatedAt: Date.now()
          }
        })
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        alert('生成ASCII艺术失败，请确保图片可以正常加载 (；´Д｀)')
      }
      
    } finally {
      setGenerating(null)
    }
  }, [options, onUpdateImage, generating, asciiGenerator])

  const batchGenerateAscii = useCallback(async () => {
    if (batchGenerating || selectedIds.length === 0) return
    
    setBatchGenerating(true)
    const targets = images.filter(img => selectedIds.includes(img.id))
    
    for (let i = 0; i < targets.length; i++) {
      const image = targets[i]
      if (image && !image.asciiArt) {
        await generateAscii(image)
      }
    }
    
    setBatchGenerating(false)
  }, [selectedIds, images, generateAscii, batchGenerating])

  const handleCopyAscii = useCallback(async () => {
    if (!selectedImage?.asciiArt) return
    
    try {
      await copyToClipboard(selectedImage.asciiArt.text)
      alert('ASCII艺术已复制到剪贴板 (•̀ᴗ•́)و ̑̑')
    } catch (error) {
      alert('复制失败，请手动选择文本复制')
    }
  }, [selectedImage])

  const handleDownloadAscii = useCallback(() => {
    if (!selectedImage?.asciiArt) return
    
    const blob = new Blob([selectedImage.asciiArt.text], { type: 'text/plain' })
    const filename = `${selectedImage.file.name.replace(/\.[^.]+$/, '')}_ascii.txt`
    downloadBlob(blob, filename)
  }, [selectedImage])

  const handleDownloadImage = useCallback(() => {
    if (!selectedImage?.asciiArt?.preview) return
    
    const link = document.createElement('a')
    link.href = selectedImage.asciiArt.preview
    link.download = `${selectedImage.file.name.replace(/\.[^.]+$/, '')}_ascii.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [selectedImage])

  const resetOptions = useCallback(() => {
    setOptions({
      style: 'detailed',
      width: 80,
      invert: false,
      color: false,
      customChars: '@%#*+=-:. ',
      density: 2,
      fontSize: 12
    })
  }, [])

  // 自动选择第一张图片
  useEffect(() => {
    if (images.length > 0 && !selectedImageId) {
      setSelectedImageId(images[0].id)
    }
  }, [images, selectedImageId])

  // 清理生成器
  useEffect(() => {
    return () => {
      asciiGenerator.cleanup()
    }
  }, [asciiGenerator])

  return (
    <div className="p-6 space-y-6">
      {/* 控制面板 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：选项设置 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">样式设置</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      title={style.desc}
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
                      maxLength={100}
                      placeholder="输入字符，越靠前越暗，越靠后越亮"
                    />
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
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    字体大小: {options.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    step="1"
                    value={options.fontSize}
                    onChange={(e) => setOptions(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full range-track"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">输出选项</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={options.invert}
                      onChange={(e) => setOptions(prev => ({ ...prev, invert: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm text-slate-700">反色效果</div>
                      <div className="text-xs text-slate-500">反转明暗关系</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={options.color}
                      onChange={(e) => setOptions(prev => ({ ...prev, color: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm text-slate-700">彩色输出</div>
                      <div className="text-xs text-slate-500">保留原图颜色（部分终端支持）</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">预览模式</h3>
                <div className="flex gap-2">
                  {(['text', 'html', 'image'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode)}
                      className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                        previewMode === mode
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {mode === 'text' && '文本'}
                      {mode === 'html' && 'HTML'}
                      {mode === 'image' && '图片'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={resetOptions}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                >
                  重置选项
                </button>
              </div>
            </div>
          </div>
          
          {/* 批量操作 */}
          {batchMode && selectedIds.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-700">批量操作</div>
                  <div className="text-sm text-blue-600">
                    已选择 {selectedIds.length} 张图片
                  </div>
                </div>
                <button
                  onClick={batchGenerateAscii}
                  disabled={batchGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchGenerating ? '批量生成中...' : '批量生成 ASCII'}
                </button>
              </div>
            </div>
          )}
          
          {/* 生成按钮 */}
          {selectedImage && !batchMode && (
            <div className="flex gap-3">
              <button
                onClick={() => generateAscii(selectedImage)}
                disabled={generating === selectedImage.id}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === selectedImage.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    生成中...
                  </span>
                ) : (
                  '生成 ASCII 艺术'
                )}
              </button>
              
              {selectedImage.asciiArt && (
                <button
                  onClick={() => {
                    onUpdateImage(selectedImage.id, { asciiArt: undefined })
                  }}
                  className="px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  重新生成
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 右侧：图片选择 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">选择图片</h3>
            <span className="text-xs text-slate-500">
              {images.length} 张图片
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
            {images.map((image) => (
              <div key={image.id} className="relative">
                <button
                  onClick={() => setSelectedImageId(image.id)}
                  className={`aspect-square w-full relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageId === image.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={image.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 图片加载失败时使用备用方案
                      const target = e.target as HTMLImageElement
                      target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" dy=".3em" fill="%23999">图片</text></svg>`
                    }}
                  />
                  
                  {image.asciiArt && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                      ✓
                    </div>
                  )}
                  
                  {onToggleSelect && batchMode && (
                    <div 
                      className={`absolute top-1 left-1 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                        selectedIds.includes(image.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-slate-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelect(image.id)
                      }}
                    >
                      {selectedIds.includes(image.id) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  )}
                </button>
                
                <div className="mt-1 text-xs text-slate-500 truncate">
                  {formatBytes(image.file.size)}
                </div>
              </div>
            ))}
          </div>
          
          {/* 图片信息 */}
          {selectedImage && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium text-slate-700 mb-2">
                当前图片信息
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>名称:</span>
                  <span className="font-mono truncate" title={selectedImage.file.name}>
                    {selectedImage.file.name.length > 20 
                      ? selectedImage.file.name.substring(0, 20) + '...'
                      : selectedImage.file.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>尺寸:</span>
                  <span>{selectedImage.width} × {selectedImage.height}</span>
                </div>
                <div className="flex justify-between">
                  <span>大小:</span>
                  <span>{formatBytes(selectedImage.file.size)}</span>
                </div>
                {selectedImage.asciiArt && (
                  <div className="flex justify-between">
                    <span>ASCII生成:</span>
                    <span className="text-green-600">已生成</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ASCII 输出区域 */}
      {selectedImage?.asciiArt && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-700">ASCII 预览</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {options.style} 样式
                </span>
                {options.color && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    彩色输出
                  </span>
                )}
              </div>
              
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
                  下载文本
                </button>
                <button
                  onClick={handleDownloadImage}
                  className="px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-lg font-medium hover:bg-purple-100 transition"
                >
                  下载图片
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4">
            {previewMode === 'text' && (
              <div className="bg-black p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="ascii-output text-sm leading-none font-mono whitespace-pre text-white">
                  {selectedImage.asciiArt.text}
                </pre>
              </div>
            )}
            
            {previewMode === 'html' && (
              <div className="bg-white p-4 border border-slate-200 rounded-lg max-h-96 overflow-auto">
                <div 
                  className="ascii-output text-sm leading-none font-mono whitespace-pre"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedImage.asciiArt.text.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            )}
            
            {previewMode === 'image' && (
              <div className="flex justify-center">
                <img
                  src={selectedImage.asciiArt.preview}
                  alt="ASCII预览"
                  className="max-h-96 rounded-lg border shadow-sm"
                />
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
            <div className="text-xs text-slate-500 flex justify-between">
              <span>
                字符数: {selectedImage.asciiArt.text.replace(/\n/g, '').length}
              </span>
              <span>
                行数: {selectedImage.asciiArt.text.split('\n').length}
              </span>
              <span>
                生成时间: {new Date(selectedImage.asciiArt.generatedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 使用说明 */}
      <div className="text-sm text-slate-600 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          使用说明与提示
        </h4>
        <ul className="space-y-2 list-disc list-inside">
          <li>选择图片后调整参数，点击"生成 ASCII 艺术"</li>
          <li><strong>彩色输出</strong>仅在某些终端和编辑器中有效，大部分场景建议使用黑白</li>
          <li><strong>输出宽度</strong>影响ASCII艺术的精细程度和生成时间</li>
          <li><strong>采样密度</strong>越小，细节越丰富，但生成时间越长</li>
          <li>可以复制文本到任何支持纯文本的编辑器或聊天窗口</li>
          <li>下载的图片为PNG格式，可直接分享使用</li>
          <li>开启<strong>批量模式</strong>可同时处理多张图片</li>
        </ul>
      </div>
    </div>
  )
}