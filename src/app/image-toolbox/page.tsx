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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return
    
    const files = Array.from(fileList).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/avif', 'image/heic']
      return validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg|avif|heic)$/i)
    })
    
    if (!files.length) {
      alert('请选择有效的图片文件 (；´Д｀)')
      return
    }

    const newImages: ImageFile[] = []
    const existingNames = new Set(images.map(img => img.file.name + img.file.size))

    for (const file of files) {
      if (existingNames.has(file.name + file.size)) {
        continue // 跳过重复文件
      }

      try {
        const preview = URL.createObjectURL(file)
        const bitmap = await createImageBitmap(file)
        
        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          width: bitmap.width,
          height: bitmap.height
        })
        
        bitmap.close() // 清理 ImageBitmap
      } catch (error) {
        console.error('处理图片失败:', error)
        alert(`处理文件 ${file.name} 时出错，已跳过`)
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
    } else if (files.length > 0 && newImages.length === 0) {
      alert('所有文件都已添加过或格式不支持')
    }
  }, [images])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        // 清理所有创建的 URL
        URL.revokeObjectURL(imageToRemove.preview)
        if (imageToRemove.converted?.url) {
          URL.revokeObjectURL(imageToRemove.converted.url)
        }
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const handleUpdateImage = useCallback((id: string, updates: Partial<ImageFile>) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        // 如果需要更新预览URL，先清理旧的
        if (updates.preview && updates.preview !== img.preview) {
          URL.revokeObjectURL(img.preview)
        }
        return { ...img, ...updates }
      }
      return img
    }))
  }, [])

  const handleClearAll = useCallback(() => {
    // 清理所有URL对象
    images.forEach(img => {
      URL.revokeObjectURL(img.preview)
      if (img.converted?.url) {
        URL.revokeObjectURL(img.converted.url)
      }
    })
    setImages([])
  }, [images])

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 清理URL对象
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.preview)
        if (img.converted?.url) {
          URL.revokeObjectURL(img.converted.url)
        }
      })
    }
  }, [images])

  const tabs = [
    { id: 'converter' as ToolTab, label: '格式转换', icon: '🔄' },
    { id: 'ascii' as ToolTab, label: 'ASCII艺术', icon: '🎨' },
    { id: 'adjust' as ToolTab, label: '图片调整', icon: '⚙️' },
    { id: 'filters' as ToolTab, label: '滤镜效果', icon: '🌈' },
    { id: 'preview' as ToolTab, label: '预览管理', icon: '👁️' }
  ]

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            图片工具箱
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            一站式图片处理解决方案，支持格式转换、ASCII艺术生成、图片调整和滤镜效果
          </p>
        </motion.div>

        {/* 上传区域 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-10"
        >
          <div
            className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileInputClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl">
                📁
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-800">
                  {isDragging ? '松开以上传图片' : '点击或拖拽图片到此处'}
                </h3>
                <p className="text-slate-500 text-sm">
                  支持 JPG、PNG、WEBP、GIF、BMP、SVG、AVIF、HEIC 等格式
                </p>
                <p className="text-xs text-slate-400">
                  单次最多可上传 20 张图片，单张图片最大 10MB
                </p>
              </div>
              
              <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition">
                选择文件
              </button>
            </div>
          </div>
        </motion.div>

        {/* 图片概览 */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  已选择 {images.length} 张图片
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  总大小: {formatSize(images.reduce((sum, img) => sum + img.file.size, 0))}
                </p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition"
                >
                  查看全部
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
                >
                  清空全部
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.slice(0, 12).map((img) => (
                <div key={img.id} className="group relative aspect-square">
                  <img
                    src={img.preview}
                    alt=""
                    className="w-full h-full object-cover rounded-lg border shadow-sm group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveImage(img.id)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="font-medium truncate">{img.file.name}</div>
                    <div className="text-xs opacity-80">{img.width}×{img.height}</div>
                  </div>
                </div>
              ))}
              {images.length > 12 && (
                <div 
                  className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition"
                  onClick={() => setActiveTab('preview')}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">+</div>
                    <div className="text-sm text-slate-600">
                      {images.length - 12} 更多
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 工具区域 */}
        {images.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* 选项卡导航 */}
            <div className="border-b border-slate-200">
              <div className="flex flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium transition-all relative ${
                      activeTab === tab.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 工具内容 */}
            <div className="p-6">
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
          </div>
        ) : (
          // 空状态 - 功能介绍
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
              强大功能，一站搞定
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl mb-4">🔄</div>
                <h3 className="font-semibold text-lg mb-2 text-blue-800">格式转换</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• JPG、PNG、WEBP、AVIF互转</li>
                  <li>• 批量处理多张图片</li>
                  <li>• 自定义输出质量和尺寸</li>
                  <li>• 支持最高 4K 分辨率</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl mb-4">🎨</div>
                <h3 className="font-semibold text-lg mb-2 text-purple-800">ASCII 艺术</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 多种字符集和样式</li>
                  <li>• 彩色 ASCII 输出</li>
                  <li>• 可调整密度和大小</li>
                  <li>• 一键复制和下载</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl mb-4">✨</div>
                <h3 className="font-semibold text-lg mb-2 text-green-800">图片处理</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 亮度、对比度、饱和度调整</li>
                  <li>• 多种滤镜效果</li>
                  <li>• 旋转、翻转、裁剪</li>
                  <li>• 批量处理和实时预览</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-10 text-center text-slate-500 text-sm">
              <p>上传图片即可开始使用所有功能 (•̀ᴗ•́)و ̑̑</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}