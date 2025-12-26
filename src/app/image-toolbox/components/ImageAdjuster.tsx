'use client'

import { useState, useCallback, useMemo } from 'react'
import { ImageFile } from '../types/image-tools'
import { ImageProcessor } from '../utils/image-processor'
import { formatBytes } from '../utils/helpers'

interface ImageAdjusterProps {
  images: ImageFile[]
  selectedIds: string[]
  batchMode: boolean
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
  onBatchUpdate?: (updates: Partial<ImageFile>) => void
  onToggleSelect?: (id: string) => void
}

export default function ImageAdjuster({
  images,
  selectedIds,
  batchMode,
  onUpdateImage,
  onBatchUpdate,
  onToggleSelect
}: ImageAdjusterProps) {
  const [options, setOptions] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false
  })
  
  const [resizeOptions, setResizeOptions] = useState({
    width: 800,
    height: 600,
    maintainAspect: true,
    crop: false
  })
  
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [activeTool, setActiveTool] = useState<'adjust' | 'resize' | 'crop'>('adjust')
  const [processor] = useState(() => new ImageProcessor())

  const selectedImage = useMemo(() => 
    images.find(img => img.id === selectedImageId) || images[0],
    [images, selectedImageId]
  )

  const applyAdjustments = useCallback(async (image: ImageFile) => {
    if (processing || image.processing) return
    
    setProcessing(image.id)
    onUpdateImage(image.id, { processing: true })
    
    try {
      // 加载图片数据
      const imageData = await processor.getImageData(image.originalUrl)
      
      // 应用调整
      const adjustedData = await processor.applyAdjustments(imageData, {
        brightness: options.brightness / 100,
        contrast: options.contrast / 100,
        saturation: options.saturation / 100,
        rotation: options.rotation
      })
      
      // 转换为Blob
      const blob = await processor.convertFormat(adjustedData, 'webp', 0.9)
      const url = URL.createObjectURL(blob)
      
      // 创建新的图片对象获取尺寸
      const img = new Image()
      await new Promise((resolve) => {
        img.onload = resolve
        img.src = url
      })
      
      onUpdateImage(image.id, {
        processing: false,
        previewUrl: url,
        width: img.width,
        height: img.height,
        processed: {
          url,
          size: blob.size,
          format: 'webp',
          type: 'adjusted'
        }
      })
      
    } catch (error) {
      console.error('Adjustment failed:', error)
      onUpdateImage(image.id, { processing: false })
      alert('调整失败，请重试 (；´Д｀)')
    } finally {
      setProcessing(null)
    }
  }, [options, processor, processing, onUpdateImage])

  const handleResize = useCallback(async (image: ImageFile) => {
    if (processing || image.processing) return
    
    setProcessing(image.id)
    onUpdateImage(image.id, { processing: true })
    
    try {
      // 加载图片数据
      const imageData = await processor.getImageData(image.originalUrl)
      
      // 调整大小
      const resizedData = await processor.resize(
        imageData,
        resizeOptions.width,
        resizeOptions.height,
        resizeOptions.maintainAspect
      )
      
      // 转换为Blob
      const blob = await processor.convertFormat(resizedData, 'webp', 0.9)
      const url = URL.createObjectURL(blob)
      
      onUpdateImage(image.id, {
        processing: false,
        previewUrl: url,
        width: resizedData.width,
        height: resizedData.height,
        processed: {
          url,
          size: blob.size,
          format: 'webp',
          type: 'adjusted'
        }
      })
      
    } catch (error) {
      console.error('Resize failed:', error)
      onUpdateImage(image.id, { processing: false })
      alert('调整大小失败，请重试 (；´Д｀)')
    } finally {
      setProcessing(null)
    }
  }, [resizeOptions, processor, processing, onUpdateImage])

  const batchApplyAdjustments = useCallback(async () => {
    if (batchProcessing || selectedIds.length === 0) return
    
    setBatchProcessing(true)
    const targets = images.filter(img => selectedIds.includes(img.id))
    
    for (let i = 0; i < targets.length; i++) {
      const image = targets[i]
      if (image && !image.processing) {
        await applyAdjustments(image)
      }
    }
    
    setBatchProcessing(false)
  }, [selectedIds, images, applyAdjustments, batchProcessing])

  const resetOptions = useCallback(() => {
    setOptions({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false
    })
  }, [])

  const resetResizeOptions = useCallback(() => {
    setResizeOptions({
      width: 800,
      height: 600,
      maintainAspect: true,
      crop: false
    })
  }, [])

  const presetSizes = [
    { label: '缩略图', width: 150, height: 150 },
    { label: '小图', width: 480, height: 320 },
    { label: '中图', width: 800, height: 600 },
    { label: '大图', width: 1200, height: 800 },
    { label: '高清', width: 1920, height: 1080 },
    { label: '4K', width: 3840, height: 2160 }
  ]

  // 自动选择第一张图片
  useMemo(() => {
    if (images.length > 0 && !selectedImageId) {
      setSelectedImageId(images[0].id)
    }
  }, [images, selectedImageId])

  return (
    <div className="p-6 space-y-6">
      {/* 工具选择 */}
      <div className="flex border-b border-slate-200">
        {(['adjust', 'resize'] as const).map((tool) => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            className={`px-6 py-3 text-sm font-medium relative ${
              activeTool === tool
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tool === 'adjust' && '图片调整'}
            {tool === 'resize' && '尺寸调整'}
            {activeTool === tool && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：调整选项 */}
        <div className="lg:col-span-2 space-y-6">
          {activeTool === 'adjust' ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      亮度: {options.brightness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={options.brightness}
                      onChange={(e) => setOptions(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                      className="w-full range-track"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      对比度: {options.contrast}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={options.contrast}
                      onChange={(e) => setOptions(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                      className="w-full range-track"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      饱和度: {options.saturation}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={options.saturation}
                      onChange={(e) => setOptions(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                      className="w-full range-track"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      旋转: {options.rotation}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={options.rotation}
                      onChange={(e) => setOptions(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                      className="w-full range-track"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      {[0, 90, 180, 270, 360].map((angle) => (
                        <button
                          key={angle}
                          onClick={() => setOptions(prev => ({ ...prev, rotation: angle }))}
                          className="px-2 py-1 hover:bg-slate-100 rounded"
                        >
                          {angle}°
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={options.flipHorizontal}
                        onChange={(e) => setOptions(prev => ({ ...prev, flipHorizontal: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm text-slate-700">水平翻转</div>
                        <div className="text-xs text-slate-500">左右镜像</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={options.flipVertical}
                        onChange={(e) => setOptions(prev => ({ ...prev, flipVertical: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm text-slate-700">垂直翻转</div>
                        <div className="text-xs text-slate-500">上下镜像</div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={resetOptions}
                      className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                    >
                      重置调整
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      宽度
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={resizeOptions.width}
                        onChange={(e) => setResizeOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <span className="text-xs text-slate-500">px</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      高度
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={resizeOptions.height}
                        onChange={(e) => setResizeOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <span className="text-xs text-slate-500">px</span>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resizeOptions.maintainAspect}
                      onChange={(e) => setResizeOptions(prev => ({ ...prev, maintainAspect: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm text-slate-700">保持宽高比</div>
                      <div className="text-xs text-slate-500">防止图片变形</div>
                    </div>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">预设尺寸</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {presetSizes.map((size) => (
                        <button
                          key={size.label}
                          onClick={() => setResizeOptions(prev => ({ 
                            ...prev, 
                            width: size.width, 
                            height: size.height 
                          }))}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm text-left"
                        >
                          <div className="font-medium">{size.label}</div>
                          <div className="text-xs text-slate-500">{size.width}×{size.height}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={resetResizeOptions}
                      className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                    >
                      重置尺寸
                    </button>
                  </div>
                </div>
              </div>
              
              {selectedImage && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700">
                    当前图片尺寸: {selectedImage.width} × {selectedImage.height}
                    {resizeOptions.maintainAspect && selectedImage && (
                      <span className="text-slate-600 ml-2">
                        (调整后: {Math.round(resizeOptions.width * selectedImage.height / selectedImage.width)} × {resizeOptions.height})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
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
                  onClick={batchApplyAdjustments}
                  disabled={batchProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      处理中...
                    </span>
                  ) : (
                    `批量应用 (${selectedIds.length}张)`
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* 应用按钮 */}
          {selectedImage && !batchMode && (
            <div className="flex gap-3">
              <button
                onClick={() => activeTool === 'adjust' ? applyAdjustments(selectedImage) : handleResize(selectedImage)}
                disabled={processing === selectedImage.id}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === selectedImage.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    处理中...
                  </span>
                ) : (
                  `应用${activeTool === 'adjust' ? '调整' : '尺寸调整'}`
                )}
              </button>
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
                  />
                  
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
                
                <div className="mt-1 text-xs text-slate-500 truncate text-center">
                  {image.width}×{image.height}
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
                  <span className="truncate max-w-[120px]" title={selectedImage.file.name}>
                    {selectedImage.file.name}
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
                {selectedImage.processed && (
                  <div className="flex justify-between">
                    <span>已处理:</span>
                    <span className="text-green-600">{selectedImage.processed.type}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}