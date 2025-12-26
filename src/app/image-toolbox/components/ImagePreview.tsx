'use client'

import { useState, useCallback } from 'react'
import { ImageFile } from '../types/image-tools'

interface ImagePreviewProps {
  images: ImageFile[]
  onRemoveImage: (id: string) => void
}

export default function ImagePreview({ images, onRemoveImage }: ImagePreviewProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name')

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0]

  const sortedImages = [...images].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.file.name.localeCompare(b.file.name)
      case 'size':
        return b.file.size - a.file.size
      case 'date':
        return b.file.lastModified - a.file.lastModified
      default:
        return 0
    }
  })

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleDownloadAll = useCallback(() => {
    images.forEach((image) => {
      const link = document.createElement('a')
      link.href = image.preview
      link.download = image.file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
    })
  }, [images])

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            网格视图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            列表视图
          </button>
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="name">按名称排序</option>
            <option value="size">按大小排序</option>
            <option value="date">按时间排序</option>
          </select>
          
          <button
            onClick={handleDownloadAll}
            className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition"
          >
            下载全部
          </button>
        </div>
      </div>
      
      {/* 图片展示 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                selectedImageId === image.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onClick={() => setSelectedImageId(image.id)}
            >
              <img
                src={image.preview}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs">
                  <div className="font-medium truncate">{image.file.name}</div>
                  <div className="flex justify-between mt-1">
                    <span>{image.width}×{image.height}</span>
                    <span>{formatSize(image.file.size)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveImage(image.id)
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
                selectedImageId === image.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onClick={() => setSelectedImageId(image.id)}
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
                    {image.file.name}
                  </span>
                  {image.converted && (
                    <span className="text-xs text-green-600 px-1.5 py-0.5 bg-green-100 rounded">
                      已转换
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex gap-4">
                    <span>{image.width} × {image.height}</span>
                    <span>{formatSize(image.file.size)}</span>
                  </div>
                  <div>修改时间: {formatDate(image.file.lastModified)}</div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={image.preview}
                  download={image.file.name}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg font-medium hover:bg-blue-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  下载
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveImage(image.id)
                  }}
                  className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 transition"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 大图预览 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage.preview}
              alt="预览"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{selectedImage.file.name}</div>
                  <div className="text-sm opacity-80">
                    {selectedImage.width} × {selectedImage.height} • {formatSize(selectedImage.file.size)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={selectedImage.preview}
                    download={selectedImage.file.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    下载
                  </a>
                  <button
                    onClick={() => setSelectedImageId(null)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 统计信息 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{images.length}</div>
            <div className="text-sm text-slate-600">图片数量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatSize(images.reduce((sum, img) => sum + img.file.size, 0))}
            </div>
            <div className="text-sm text-slate-600">总大小</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {images.filter(img => img.converted).length}
            </div>
            <div className="text-sm text-slate-600">已转换</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {images.filter(img => img.asciiArt).length}
            </div>
            <div className="text-sm text-slate-600">ASCII 生成</div>
          </div>
        </div>
      </div>
    </div>
  )
}