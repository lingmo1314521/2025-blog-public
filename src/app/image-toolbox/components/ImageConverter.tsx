'use client'

import { useState, useCallback, useMemo } from 'react'
import { ImageFile, ConversionFormat } from '../types/image-tools'
import { ImageProcessor } from '../utils/image-processor'
import { formatBytes, formatFileName, downloadBlob } from '../utils/helpers'

interface ImageConverterProps {
  images: ImageFile[]
  selectedIds: string[]
  batchMode: boolean
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
  onBatchUpdate?: (updates: Partial<ImageFile>) => void
  onToggleSelect?: (id: string) => void
  onRemoveImage?: (id: string) => void
}

export default function ImageConverter({
  images,
  selectedIds,
  batchMode,
  onUpdateImage,
  onBatchUpdate,
  onToggleSelect,
  onRemoveImage
}: ImageConverterProps) {
  const [options, setOptions] = useState({
    format: 'webp' as ConversionFormat,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    maintainAspect: true,
    compress: true
  })
  
  const [processing, setProcessing] = useState<string | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [processor] = useState(() => new ImageProcessor())

  const formats: { id: ConversionFormat; label: string; desc: string }[] = [
    { id: 'webp', label: 'WEBP', desc: '现代格式，高质量压缩' },
    { id: 'png', label: 'PNG', desc: '无损格式，支持透明' },
    { id: 'jpg', label: 'JPG', desc: '通用格式，体积小' },
    { id: 'avif', label: 'AVIF', desc: '最新格式，极致压缩' }
  ]

  const handleConvert = useCallback(async (image: ImageFile) => {
    if (processing || image.processing) return
    
    setProcessing(image.id)
    onUpdateImage(image.id, { processing: true })
    
    try {
      // 加载图片数据
      const imageData = await processor.getImageData(image.originalUrl)
      
      // 调整大小
      let processedData = imageData
      if (options.compress && (options.maxWidth || options.maxHeight)) {
        processedData = await processor.resize(
          imageData,
          options.maxWidth,
          options.maxHeight,
          options.maintainAspect
        )
      }
      
      // 转换格式
      const blob = await processor.convertFormat(
        processedData,
        options.format,
        options.quality
      )
      
      const url = URL.createObjectURL(blob)
      
      onUpdateImage(image.id, {
        processing: false,
        processed: {
          url,
          size: blob.size,
          format: options.format,
          type: 'converted'
        }
      })
      
    } catch (error) {
      console.error('Conversion failed:', error)
      onUpdateImage(image.id, { processing: false })
      alert('转换失败，请重试 (；´Д｀)')
    } finally {
      setProcessing(null)
    }
  }, [options, processor, processing, onUpdateImage])

  const handleBatchConvert = useCallback(async () => {
    if (batchProcessing || selectedIds.length === 0) return
    
    setBatchProcessing(true)
    const targets = images.filter(img => selectedIds.includes(img.id))
    
    for (let i = 0; i < targets.length; i++) {
      const image = targets[i]
      if (image && !image.processing) {
        await handleConvert(image)
      }
    }
    
    setBatchProcessing(false)
  }, [selectedIds, images, handleConvert, batchProcessing])

  const handleDownload = useCallback((image: ImageFile) => {
    if (!image.processed) return
    
    const baseName = image.file.name.replace(/\.[^.]+$/, '')
    const filename = `${baseName}.${options.format}`
    const blob = new Blob([image.processed.url], { type: `image/${options.format}` })
    downloadBlob(blob, filename)
  }, [options.format])

  const handleDownloadAll = useCallback(() => {
    const convertedImages = images.filter(img => img.processed)
    convertedImages.forEach(image => handleDownload(image))
  }, [images, handleDownload])

  const resetOptions = useCallback(() => {
    setOptions({
      format: 'webp',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      maintainAspect: true,
      compress: true
    })
  }, [])

  const compressionRatio = useCallback((original: number, converted: number) => {
    const ratio = ((original - converted) / original) * 100
    return ratio > 0 ? `节省 ${ratio.toFixed(1)}%` : `增加 ${Math.abs(ratio).toFixed(1)}%`
  }, [])

  // 计算统计信息
  const stats = useMemo(() => {
    const selected = images.filter(img => selectedIds.includes(img.id))
    const totalSize = selected.reduce((sum, img) => sum + img.file.size, 0)
    const processed = selected.filter(img => img.processed).length
    
    return { selected: selected.length, totalSize, processed }
  }, [images, selectedIds])

  return (
    <div className="p-6 space-y-6">
      {/* 控制面板 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 格式选择 */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">输出格式</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setOptions(prev => ({ ...prev, format: format.id }))}
                  className={`p-3 rounded-lg border text-center transition ${
                    options.format === format.id
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="font-medium text-sm">{format.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 质量设置 */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700">
                  图片质量: {Math.round(options.quality * 100)}%
                </label>
                <span className="text-xs text-slate-500">
                  {options.quality < 0.5 ? '低质量' : 
                   options.quality < 0.8 ? '中等质量' : 
                   options.quality < 0.9 ? '高质量' : '无损'}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={options.quality}
                onChange={(e) => setOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                className="w-full range-track"
              />
            </div>
            
            {/* 尺寸限制 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">
                  尺寸限制
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.compress}
                    onChange={(e) => setOptions(prev => ({ ...prev, compress: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">启用压缩</span>
                </label>
              </div>
              
              {options.compress && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">最大宽度</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        value={options.maxWidth}
                        onChange={(e) => setOptions(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 1920 }))}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <span className="text-xs text-slate-500">px</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">最大高度</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        value={options.maxHeight}
                        onChange={(e) => setOptions(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 1920 }))}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <span className="text-xs text-slate-500">px</span>
                    </div>
                  </div>
                </div>
              )}
              
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={options.maintainAspect}
                  onChange={(e) => setOptions(prev => ({ ...prev, maintainAspect: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">保持宽高比</span>
              </label>
            </div>
          </div>
          
          {/* 预设尺寸 */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">预设尺寸</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: '缩略图', width: 150, height: 150 },
                { label: '小图', width: 480, height: 320 },
                { label: '中图', width: 800, height: 600 },
                { label: '大图', width: 1200, height: 800 },
                { label: '高清', width: 1920, height: 1080 },
                { label: '4K', width: 3840, height: 2160 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setOptions(prev => ({ 
                    ...prev, 
                    maxWidth: preset.width, 
                    maxHeight: preset.height,
                    compress: true
                  }))}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs text-slate-500">{preset.width}×{preset.height}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 右侧：操作面板 */}
        <div className="space-y-6">
          {/* 统计信息 */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="text-sm font-medium text-slate-700 mb-3">转换统计</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">已选择图片:</span>
                <span className="font-medium">{stats.selected} 张</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">总大小:</span>
                <span className="font-medium">{formatBytes(stats.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">已转换:</span>
                <span className="font-medium text-green-600">{stats.processed} 张</span>
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={resetOptions}
              className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              重置选项
            </button>
            
            {batchMode && selectedIds.length > 0 ? (
              <button
                onClick={handleBatchConvert}
                disabled={batchProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {batchProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    批量转换中...
                  </span>
                ) : (
                  `批量转换 (${selectedIds.length}张)`
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => images[0] && handleConvert(images[0])}
                  disabled={!images.length || processing === images[0].id}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === images[0]?.id ? '转换中...' : '转换单张'}
                </button>
                
                <button
                  onClick={handleDownloadAll}
                  disabled={!images.some(img => img.processed)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下载全部转换结果
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 图片列表 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">图片列表</span>
            <span className="text-sm text-slate-500">
              共 {images.length} 张图片
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {images.map((image) => (
            <div
              key={image.id}
              className={`p-4 hover:bg-slate-50 transition ${
                selectedIds.includes(image.id) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* 选择框 */}
                {onToggleSelect && batchMode && (
                  <div 
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                      selectedIds.includes(image.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-slate-400'
                    }`}
                    onClick={() => onToggleSelect(image.id)}
                  >
                    {selectedIds.includes(image.id) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                )}
                
                {/* 缩略图 */}
                <div className="flex-shrink-0 w-16 h-16">
                  <img
                    src={image.previewUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-lg border"
                  />
                </div>
                
                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {formatFileName(image.file.name, 25)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {image.width}×{image.height}
                    </span>
                    {image.processed && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        已转换
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 space-x-4">
                    <span>原图: {formatBytes(image.file.size)}</span>
                    {image.processed && (
                      <span className="text-green-600">
                        转换后: {formatBytes(image.processed.size)} 
                        <span className="text-slate-400 ml-1">
                          ({compressionRatio(image.file.size, image.processed.size)})
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleConvert(image)}
                    disabled={image.processing}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                      image.processed
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {image.processing ? '转换中...' : image.processed ? '重新转换' : '转换'}
                  </button>
                  
                  {image.processed && (
                    <button
                      onClick={() => handleDownload(image)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition"
                    >
                      下载
                    </button>
                  )}
                  
                  {onRemoveImage && (
                    <button
                      onClick={() => onRemoveImage(image.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 transition"
                    >
                      移除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}