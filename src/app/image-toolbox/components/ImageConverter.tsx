'use client'

import { useState, useCallback } from 'react'
import { ImageFile, ConversionFormat } from '../types/image-tools'
import { convertImage } from '../utils/image-converter'

interface ImageConverterProps {
  images: ImageFile[]
  onUpdateImage: (id: string, updates: Partial<ImageFile>) => void
  onRemoveImage: (id: string) => void
}

export default function ImageConverter({ images, onUpdateImage, onRemoveImage }: ImageConverterProps) {
  const [options, setOptions] = useState({
    format: 'webp' as ConversionFormat,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    maintainAspect: true
  })
  const [batchConverting, setBatchConverting] = useState(false)

  const handleConvert = useCallback(async (image: ImageFile) => {
    onUpdateImage(image.id, { converting: true })
    
    try {
      const blob = await convertImage(image.file, {
        format: options.format,
        quality: options.quality,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight
      })
      
      const url = URL.createObjectURL(blob)
      
      // 清理之前的转换结果
      if (image.converted?.url) {
        URL.revokeObjectURL(image.converted.url)
      }
      
      onUpdateImage(image.id, {
        converting: false,
        converted: {
          url,
          size: blob.size,
          format: options.format
        }
      })
    } catch (error) {
      console.error('转换失败:', error)
      onUpdateImage(image.id, { converting: false })
      alert('转换失败，请稍后重试 (´•̥̥̥ω•̥̥̥`)')
    }
  }, [options, onUpdateImage])

  const handleBatchConvert = useCallback(async () => {
    setBatchConverting(true)
    try {
      for (const image of images) {
        if (!image.converting) {
          await handleConvert(image)
        }
      }
    } finally {
      setBatchConverting(false)
    }
  }, [images, handleConvert])

  const handleDownload = useCallback((image: ImageFile) => {
    if (!image.converted) return
    
    const link = document.createElement('a')
    const baseName = image.file.name.replace(/\.[^.]+$/, '')
    link.href = image.converted.url
    link.download = `${baseName}.${options.format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }, [options.format])

  const handleDownloadAll = useCallback(() => {
    images.forEach(image => {
      if (image.converted) {
        const link = document.createElement('a')
        const baseName = image.file.name.replace(/\.[^.]+$/, '')
        link.href = image.converted.url
        link.download = `${baseName}.${options.format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
    })
  }, [images, options.format])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const formatFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name
    const extIndex = name.lastIndexOf('.')
    if (extIndex === -1) return `${name.slice(0, maxLength - 3)}...`
    const ext = name.slice(extIndex)
    const base = name.slice(0, extIndex)
    const maxBaseLength = Math.max(1, maxLength - ext.length - 3)
    return `${base.slice(0, maxBaseLength)}...${ext}`
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              输出格式
            </label>
            <div className="flex gap-2">
              {(['webp', 'png', 'jpg', 'avif'] as ConversionFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setOptions(prev => ({ ...prev, format }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    options.format === format
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              图片质量: {Math.round(options.quality * 100)}%
            </label>
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
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              尺寸限制
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={options.maxWidth}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 1920 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="最大宽度"
                />
              </div>
              <span className="text-slate-400">×</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={options.maxHeight}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 1920 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="最大高度"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchConvert}
              disabled={batchConverting || images.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {batchConverting ? '批量转换中...' : '批量转换所有图片'}
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={!images.some(img => img.converted)}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下载全部
            </button>
          </div>
        </div>
      </div>

      {/* 图片列表 */}
      <div className="space-y-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            {/* 缩略图 */}
            <div className="flex-shrink-0 w-16 h-16">
              <img
                src={image.preview}
                alt=""
                className="w-full h-full object-cover rounded-lg border"
              />
            </div>
            
            {/* 文件信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">
                  {formatFileName(image.file.name)}
                </span>
                <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                  {image.width}×{image.height}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-x-4">
                <span>原图: {formatSize(image.file.size)}</span>
                {image.converted && (
                  <span className="text-green-600">
                    转换后: {formatSize(image.converted.size)} 
                    ({Math.round((image.converted.size / image.file.size) * 100)}%)
                  </span>
                )}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleConvert(image)}
                disabled={image.converting}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                  image.converted
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {image.converting ? '转换中...' : image.converted ? '重新转换' : '转换'}
              </button>
              
              {image.converted && (
                <button
                  onClick={() => handleDownload(image)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition"
                >
                  下载
                </button>
              )}
              
              <button
                onClick={() => onRemoveImage(image.id)}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 transition"
              >
                移除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}