'use client'

import { useState, useCallback } from 'react'
import { ImageFile, FilterType } from '../types/image-tools'
import { applyFilter } from '../utils/image-converter'

interface ImageFiltersProps {
  images: ImageFile[]
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
}

export default function ImageFilters({ images, onUpdateImage }: ImageFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0]

  const filters = [
    { id: 'grayscale' as FilterType, label: '黑白', icon: '⚫', description: '经典黑白效果' },
    { id: 'sepia' as FilterType, label: '复古', icon: '📜', description: '老照片复古色调' },
    { id: 'invert' as FilterType, label: '反色', icon: '🔄', description: '颜色反转效果' },
    { id: 'vintage' as FilterType, label: '怀旧', icon: '📷', description: '复古滤镜效果' },
  ]

  const applyImageFilter = useCallback(async (image: ImageFile, filter: FilterType) => {
    setProcessing(image.id)
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('无法初始化画布')
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = image.preview
      
      await new Promise((resolve) => {
        img.onload = resolve
      })
      
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const filteredData = applyFilter(imageData, filter)
      ctx.putImageData(filteredData, 0, 0)
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
        }, 'image/jpeg', 0.9)
      })
      
      const url = URL.createObjectURL(blob)
      
      // 清理之前的预览
      URL.revokeObjectURL(image.preview)
      
      onUpdateImage(image.id, {
        preview: url
      })
      
    } catch (error) {
      console.error('应用滤镜失败:', error)
      alert('应用滤镜失败，请稍后重试 (；´Д｀)')
    } finally {
      setProcessing(null)
    }
  }, [onUpdateImage])

  const handleBatchApply = useCallback(async (filter: FilterType) => {
    setProcessing('batch')
    
    try {
      for (const image of images) {
        await applyImageFilter(image, filter)
      }
    } finally {
      setProcessing(null)
    }
  }, [images, applyImageFilter])

  return (
    <div className="space-y-6">
      {/* 图片选择 */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <h3 className="font-medium text-slate-700 mb-3">选择要应用滤镜的图片</h3>
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
            </button>
          ))}
        </div>
      </div>
      
      {selectedImage && (
        <>
          {/* 滤镜选择 */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-slate-700">滤镜效果</h3>
              <button
                onClick={() => handleBatchApply(selectedFilter || 'grayscale')}
                disabled={processing === 'batch'}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === 'batch' ? '批量处理中...' : '批量应用到所有图片'}
              </button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setSelectedFilter(filter.id)
                    applyImageFilter(selectedImage, filter.id)
                  }}
                  disabled={processing === selectedImage.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedFilter === filter.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-2xl mb-2">{filter.icon}</div>
                  <div className="font-medium text-slate-700">{filter.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{filter.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 预览区域 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-3 text-center">原始图片</h4>
              <div className="flex justify-center">
                <img
                  src={selectedImage.preview}
                  alt="原始"
                  className="max-h-64 rounded-lg border shadow-sm"
                />
              </div>
            </div>
            
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-3 text-center">
                {selectedFilter ? `${filters.find(f => f.id === selectedFilter)?.label} 效果` : '滤镜预览'}
              </h4>
              <div className="flex justify-center">
                {processing === selectedImage.id ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <img
                    src={selectedImage.preview}
                    alt="滤镜预览"
                    className="max-h-64 rounded-lg border shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 提示信息 */}
      <div className="text-sm text-slate-600 bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-700 mb-2">注意事项：</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>应用滤镜会替换原始图片，建议先备份原图</li>
          <li>可以点击"批量应用到所有图片"一次处理所有图片</li>
          <li>滤镜效果可以叠加，多次应用会产生不同的混合效果</li>
          <li>处理后的图片可以继续使用其他工具进行转换或调整</li>
        </ul>
      </div>
    </div>
  )
}