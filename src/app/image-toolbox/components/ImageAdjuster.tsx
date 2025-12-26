'use client'

import { useState, useCallback } from 'react'
import { ImageFile, AdjustOptions } from '../types/image-tools'
import { resizeImage } from '../utils/image-converter'

interface ImageAdjusterProps {
  images: ImageFile[]
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
}

export default function ImageAdjuster({ images, onUpdateImage }: ImageAdjusterProps) {
  const [options, setOptions] = useState<AdjustOptions>({
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
    maintainAspect: true
  })
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0]

  const applyAdjustments = useCallback(async (image: ImageFile) => {
    if (!image) return
    
    setProcessing(image.id)
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法初始化画布')
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = image.preview
      
      await new Promise((resolve) => {
        img.onload = resolve
      })
      
      canvas.width = img.width
      canvas.height = img.height
      
      // 应用变换
      ctx.save()
      
      // 翻转
      if (options.flipHorizontal) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      if (options.flipVertical) {
        ctx.translate(0, canvas.height)
        ctx.scale(1, -1)
      }
      
      // 旋转
      if (options.rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((options.rotation * Math.PI) / 180)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)
      }
      
      ctx.drawImage(img, 0, 0)
      ctx.restore()
      
      // 应用滤镜
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      const brightness = options.brightness / 100
      const contrast = options.contrast / 100
      const saturation = options.saturation / 100
      
      const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
      
      for (let i = 0; i < data.length; i += 4) {
        // 亮度
        data[i] = data[i] * brightness
        data[i + 1] = data[i + 1] * brightness
        data[i + 2] = data[i + 2] * brightness
        
        // 对比度
        data[i] = contrastFactor * (data[i] - 128) + 128
        data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128
        data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128
        
        // 饱和度
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        data[i] = gray + saturation * (data[i] - gray)
        data[i + 1] = gray + saturation * (data[i + 1] - gray)
        data[i + 2] = gray + saturation * (data[i + 2] - gray)
        
        // 确保值在范围内
        data[i] = Math.min(255, Math.max(0, data[i]))
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1]))
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2]))
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      // 转换为Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
        }, 'image/jpeg', 0.9)
      })
      
      const url = URL.createObjectURL(blob)
      
      // 更新图片
      onUpdateImage(image.id, {
        preview: url,
        width: canvas.width,
        height: canvas.height
      })
      
    } catch (error) {
      console.error('调整失败:', error)
      alert('调整失败，请稍后重试 (；´Д｀)')
    } finally {
      setProcessing(null)
    }
  }, [options, onUpdateImage])

  const handleResize = useCallback(async (image: ImageFile) => {
    setProcessing(image.id)
    
    try {
      const blob = await resizeImage(
        image.file,
        resizeOptions.width,
        resizeOptions.height,
        resizeOptions.maintainAspect
      )
      
      const url = URL.createObjectURL(blob)
      const bitmap = await createImageBitmap(blob)
      
      // 清理之前的预览
      URL.revokeObjectURL(image.preview)
      
      onUpdateImage(image.id, {
        preview: url,
        width: bitmap.width,
        height: bitmap.height
      })
      
    } catch (error) {
      console.error('调整大小失败:', error)
      alert('调整大小失败，请稍后重试 (；´Д｀)')
    } finally {
      setProcessing(null)
    }
  }, [resizeOptions, onUpdateImage])

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

  return (
    <div className="space-y-6">
      {/* 图片选择 */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <h3 className="font-medium text-slate-700 mb-3">选择要调整的图片</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                {image.width}×{image.height}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {selectedImage && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 左侧：调整选项 */}
            <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-slate-700">图片调整</h3>
                  <button
                    onClick={resetOptions}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    重置
                  </button>
                </div>
                
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
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.flipHorizontal}
                      onChange={(e) => setOptions(prev => ({ ...prev, flipHorizontal: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">水平翻转</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.flipVertical}
                      onChange={(e) => setOptions(prev => ({ ...prev, flipVertical: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">垂直翻转</span>
                  </label>
                </div>
              </div>
              
              <button
                onClick={() => applyAdjustments(selectedImage)}
                disabled={processing === selectedImage.id}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === selectedImage.id ? '处理中...' : '应用调整'}
              </button>
            </div>
            
            {/* 右侧：大小调整 */}
            <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-700">调整大小</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      宽度
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={resizeOptions.width}
                      onChange={(e) => setResizeOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <span className="text-slate-400 mt-6">×</span>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      高度
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={resizeOptions.height}
                      onChange={(e) => setResizeOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resizeOptions.maintainAspect}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, maintainAspect: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">保持宽高比</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setResizeOptions(prev => ({ ...prev, width: 800, height: 600 }))}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                  >
                    800×600
                  </button>
                  <button
                    onClick={() => setResizeOptions(prev => ({ ...prev, width: 1024, height: 768 }))}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                  >
                    1024×768
                  </button>
                  <button
                    onClick={() => setResizeOptions(prev => ({ ...prev, width: 1920, height: 1080 }))}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                  >
                    1920×1080
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => handleResize(selectedImage)}
                disabled={processing === selectedImage.id}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === selectedImage.id ? '处理中...' : '调整大小'}
              </button>
            </div>
          </div>
          
          {/* 预览区域 */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-700">预览</h3>
              <span className="text-sm text-slate-500">
                {selectedImage.width} × {selectedImage.height}
              </span>
            </div>
            <div className="flex justify-center">
              <img
                src={selectedImage.preview}
                alt="预览"
                className="max-h-64 rounded-lg border shadow-sm"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}