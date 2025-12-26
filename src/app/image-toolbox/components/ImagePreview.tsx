'use client'

import { useState, useCallback, useEffect } from 'react'
import { ImageFile } from '../types/image-tools'
import { formatBytes, formatFileName } from '../utils/helpers'

interface ImagePreviewProps {
  images: ImageFile[]
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onRemoveImage: (id: string) => void
}

export default function ImagePreview({
  images,
  selectedIds,
  onToggleSelect,
  onRemoveImage
}: ImagePreviewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name')
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

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

  const handleDownload = useCallback((image: ImageFile) => {
    const link = document.createElement('a')
    link.href = image.previewUrl
    link.download = image.file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const handleDownloadAll = useCallback(() => {
    images.forEach(image => handleDownload(image))
  }, [images, handleDownload])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === images.length) {
      images.forEach(img => onToggleSelect(img.id))
    } else {
      images.forEach(img => !selectedIds.includes(img.id) && onToggleSelect(img.id))
    }
  }, [images, selectedIds, onToggleSelect])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const resetPreview = useCallback(() => {
    setZoom(1)
    setRotation(0)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewImage) return
      
      switch (e.key) {
        case 'Escape':
          setPreviewImage(null)
          break
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) handleZoomIn()
          break
        case '-':
          if (e.ctrlKey || e.metaKey) handleZoomOut()
          break
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) handleRotate()
          break
        case '0':
          if (e.ctrlKey || e.metaKey) resetPreview()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImage, handleZoomIn, handleZoomOut, handleRotate, resetPreview])

  const stats = {
    total: images.length,
    selected: selectedIds.length,
    totalSize: formatBytes(images.reduce((sum, img) => sum + img.file.size, 0)),
    processed: images.filter(img => img.processed).length,
    asciiGenerated: images.filter(img => img.asciiArt).length
  }

  return (
    <div className="p-6 space-y-6">
      {/* 控制栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            网格视图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            列表视图
          </button>
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="name">按名称排序</option>
            <option value="size">按大小排序</option>
            <option value="date">按时间排序</option>
          </select>
          
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
          >
            {selectedIds.length === images.length ? '取消全选' : '全选'}
          </button>
          
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition text-sm"
          >
            下载全部
          </button>
        </div>
      </div>

      {/* 图片展示 */}
      {viewMode === 'grid' ? (
        <div className="image-grid gap-4">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-300 image-preview-hover ${
                selectedIds.includes(image.id)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-300'
              }`}
              onClick={() => setPreviewImage(image)}
            >
              <div className="aspect-square">
                <img
                  src={image.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 覆盖层 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute top-2 right-2 flex gap-2">
                  {image.processed && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      {image.processed.type}
                    </span>
                  )}
                  {image.asciiArt && (
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded">
                      ASCII
                    </span>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="font-medium text-sm truncate">{image.file.name}</div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>{image.width}×{image.height}</span>
                    <span>{formatBytes(image.file.size)}</span>
                  </div>
                </div>
              </div>
              
              {/* 选择按钮 */}
              <div 
                className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
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
              
              {/* 操作按钮 */}
              <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(image)
                  }}
                  className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                  title="下载"
                >
                  ↓
                </button>
              </div>
              
              {/* 删除按钮 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveImage(image.id)
                  }}
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
                selectedIds.includes(image.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onClick={() => setPreviewImage(image)}
            >
              {/* 选择框 */}
              <div 
                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
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
                    {formatFileName(image.file.name, 30)}
                  </span>
                  {image.processed && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                      {image.processed.type}
                    </span>
                  )}
                  {image.asciiArt && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                      ASCII
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex gap-4">
                    <span>{image.width} × {image.height}</span>
                    <span>{formatBytes(image.file.size)}</span>
                  </div>
                  <div>修改时间: {new Date(image.file.lastModified).toLocaleString()}</div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(image)
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg font-medium hover:bg-blue-100 transition"
                >
                  下载
                </button>
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

      {/* 大图预览模态框 */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-slate-700">{previewImage.file.name}</h3>
                <div className="text-sm text-slate-500">
                  {previewImage.width} × {previewImage.height} • {formatBytes(previewImage.file.size)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center"
                  title="缩小"
                >
                  -
                </button>
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center"
                  title="放大"
                >
                  +
                </button>
                <button
                  onClick={handleRotate}
                  className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center"
                  title="旋转"
                >
                  ↻
                </button>
                <button
                  onClick={resetPreview}
                  className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center"
                  title="重置"
                >
                  ⟲
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center"
                  title="关闭"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-8 flex items-center justify-center overflow-auto">
              <img
                src={previewImage.previewUrl}
                alt="预览"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-between text-sm text-slate-600">
                <span>缩放: {zoom.toFixed(2)}x</span>
                <span>旋转: {rotation}°</span>
                <span>按住 Ctrl/Cmd + 滚轮可缩放</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-slate-600">图片总数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
            <div className="text-sm text-slate-600">已选择</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.processed}</div>
            <div className="text-sm text-slate-600">已处理</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.asciiGenerated}</div>
            <div className="text-sm text-slate-600">ASCII生成</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700">{stats.totalSize}</div>
            <div className="text-sm text-slate-600">总大小</div>
          </div>
        </div>
      </div>
    </div>
  )
}