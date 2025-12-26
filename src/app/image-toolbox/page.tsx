'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import ImageConverter from './components/ImageConverter'
import AsciiArtGenerator from './components/AsciiArtGenerator'
import ImageAdjuster from './components/ImageAdjuster'
import ImageFilters from './components/ImageFilters'
import ImagePreview from './components/ImagePreview'
import { ImageFile } from './types/image-tools'

type ToolTab = 'converter' | 'ascii' | 'adjust' | 'filters' | 'preview'

export default function ImageToolboxPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('converter')
  const [images, setImages] = useState<ImageFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'))
    if (!files.length) return

    const newImages = await Promise.all(
      files.map(async (file, index) => {
        const preview = URL.createObjectURL(file)
        const bitmap = await createImageBitmap(file)
        return {
          id: `${Date.now()}-${index}`,
          file,
          preview,
          width: bitmap.width,
          height: bitmap.height
        }
      })
    )

    setImages(prev => {
      const existingNames = new Set(prev.map(img => img.file.name))
      const uniqueNewImages = newImages.filter(img => !existingNames.has(img.file.name))
      return [...prev, ...uniqueNewImages]
    })
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.preview)
        if (removed.converted?.url) URL.revokeObjectURL(removed.converted.url)
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const handleUpdateImage = useCallback((id: string, updates: Partial<ImageFile>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ))
  }, [])

  // 清理URL对象
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.preview)
        if (img.converted?.url) URL.revokeObjectURL(img.converted.url)
      })
    }
  }, [images])

  const tabs: { id: ToolTab; label: string; icon: string }[] = [
    { id: 'converter', label: '格式转换', icon: '🔄' },
    { id: 'ascii', label: 'ASCII艺术', icon: '🎨' },
    { id: 'adjust', label: '图片调整', icon: '⚙️' },
    { id: 'filters', label: '滤镜效果', icon: '🌈' },
    { id: 'preview', label: '预览管理', icon: '👁️' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            图片工具箱
          </h1>
          <p className="text-slate-600">一站式图片处理解决方案，支持多种格式转换和特效处理</p>
        </motion.div>

        {/* 上传区域 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <label
            className={`block border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? '松开以上传' : '拖放图片或点击选择'}
            </h3>
            <p className="text-slate-500 text-sm">
              支持 JPG、PNG、WEBP、GIF、BMP、SVG 等格式
            </p>
            <p className="text-xs text-slate-400 mt-2">最多可同时处理 20 张图片</p>
          </label>
        </motion.div>

        {/* 图片列表概览 */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">已选择 {images.length} 张图片</h2>
              <button
                onClick={() => setImages([])}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition"
              >
                清空全部
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.slice(0, 12).map((img) => (
                <div key={img.id} className="group relative">
                  <img
                    src={img.preview}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg border shadow-sm"
                  />
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length > 12 && (
                <div className="flex items-center justify-center bg-slate-100 rounded-lg border">
                  <span className="text-slate-500">+{images.length - 12} 更多</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 工具选项卡 */}
        {images.length > 0 && (
          <>
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 border-b border-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white border-t border-x border-slate-200 text-blue-600'
                        : 'text-slate-600 hover:text-blue-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 工具内容区域 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              {activeTab === 'converter' && (
                <ImageConverter
                  images={images}
                  onUpdateImage={handleUpdateImage}
                  onRemoveImage={handleRemoveImage}
                />
              )}
              
              {activeTab === 'ascii' && (
                <AsciiArtGenerator
                  images={images}
                  onUpdateImage={handleUpdateImage}
                />
              )}
              
              {activeTab === 'adjust' && (
                <ImageAdjuster
                  images={images}
                  onUpdateImage={handleUpdateImage}
                />
              )}
              
              {activeTab === 'filters' && (
                <ImageFilters
                  images={images}
                  onUpdateImage={handleUpdateImage}
                />
              )}
              
              {activeTab === 'preview' && (
                <ImagePreview
                  images={images}
                  onRemoveImage={handleRemoveImage}
                />
              )}
            </div>
          </>
        )}

        {/* 功能说明 */}
        {images.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
              <div className="text-2xl mb-3">🔧</div>
              <h3 className="font-semibold mb-2">格式转换</h3>
              <p className="text-sm text-slate-600">
                支持 JPG、PNG、WEBP、AVIF 等多种格式互转，可调整质量和尺寸
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
              <div className="text-2xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">ASCII 艺术</h3>
              <p className="text-sm text-slate-600">
                将图片转换为字符画，支持多种字符集和彩色 ASCII 输出
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100">
              <div className="text-2xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">图片处理</h3>
              <p className="text-sm text-slate-600">
                调整亮度、对比度，应用滤镜效果，批量处理多张图片
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}