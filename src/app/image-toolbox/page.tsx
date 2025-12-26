'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ImageConverter from './components/ImageConverter'
import AsciiArtGenerator from './components/AsciiArtGenerator'
import ImageAdjuster from './components/ImageAdjuster'
import ImageFilters from './components/ImageFilters'
import ImagePreview from './components/ImagePreview'
import { ImageFile } from './types/image-tools'
import { generateId, formatBytes } from './utils/helpers'

type ToolTab = 'converter' | 'ascii' | 'adjust' | 'filters' | 'preview'

export default function ImageToolboxPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('converter')
  const [images, setImages] = useState<ImageFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const dragCounterRef = useRef(0)

  // 处理文件上传
  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return
    
    const files = Array.from(fileList).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 100 * 1024 * 1024 // 100MB限制
      return isImage && isValidSize
    })
    
    if (!files.length) {
      alert('请选择有效的图片文件（支持格式：JPG, PNG, GIF, WEBP, BMP），且大小不超过100MB')
      return
    }
    
    const newImages: ImageFile[] = []
    
    for (const file of files) {
      try {
        const previewUrl = URL.createObjectURL(file)
        const originalUrl = URL.createObjectURL(file) // 保留原始URL
        
        // 创建图片获取尺寸
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = () => {
            newImages.push({
              id: generateId(),
              file,
              previewUrl,
              originalUrl,
              width: img.width,
              height: img.height
            })
            resolve(null)
          }
          img.onerror = reject
          img.src = previewUrl
        })
      } catch (error) {
        console.error('Failed to process image:', file.name, error)
      }
    }
    
    if (newImages.length > 0) {
      setImages(prev => {
        // 去重
        const existingNames = new Set(prev.map(img => `${img.file.name}-${img.file.size}`))
        const uniqueNewImages = newImages.filter(img => 
          !existingNames.has(`${img.file.name}-${img.file.size}`)
        )
        return [...prev, ...uniqueNewImages]
      })
    }
  }, [])

  // 拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
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

  // 删除图片
  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.previewUrl)
        URL.revokeObjectURL(image.originalUrl)
        if (image.processed?.url) {
          URL.revokeObjectURL(image.processed.url)
        }
      }
      return prev.filter(img => img.id !== id)
    })
    setSelectedIds(prev => prev.filter(imgId => imgId !== id))
  }, [])

  // 批量删除
  const handleRemoveSelected = useCallback(() => {
    selectedIds.forEach(id => handleRemoveImage(id))
    setSelectedIds([])
  }, [selectedIds, handleRemoveImage])

  // 更新图片
  const handleUpdateImage = useCallback((id: string, updates: Partial<ImageFile>) => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img
      
      // 清理旧的processed URL
      if (updates.processed && img.processed?.url && img.processed.url !== updates.processed.url) {
        URL.revokeObjectURL(img.processed.url)
      }
      
      return { ...img, ...updates }
    }))
  }, [])

  // 批量更新
  const handleBatchUpdate = useCallback((updates: Partial<ImageFile>) => {
    setImages(prev => prev.map(img => {
      if (!selectedIds.includes(img.id)) return img
      
      // 清理旧的processed URL
      if (updates.processed && img.processed?.url && img.processed.url !== updates.processed.url) {
        URL.revokeObjectURL(img.processed.url)
      }
      
      return { ...img, ...updates }
    }))
  }, [selectedIds])

  // 切换选择
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(imgId => imgId !== id)
        : [...prev, id]
    )
  }, [])

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === images.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(images.map(img => img.id))
    }
  }, [images, selectedIds.length])

  // 计算统计信息
  const stats = {
    total: images.length,
    selected: selectedIds.length,
    totalSize: formatBytes(images.reduce((sum, img) => sum + img.file.size, 0)),
    processed: images.filter(img => img.processed).length,
    asciiGenerated: images.filter(img => img.asciiArt).length
  }

  // 清理URLs
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.previewUrl)
        URL.revokeObjectURL(img.originalUrl)
        if (img.processed?.url) {
          URL.revokeObjectURL(img.processed.url)
        }
      })
    }
  }, [images])

  const tabs = [
    { id: 'converter' as ToolTab, label: '格式转换', icon: '🔄', color: 'blue' },
    { id: 'ascii' as ToolTab, label: 'ASCII艺术', icon: '🎨', color: 'purple' },
    { id: 'adjust' as ToolTab, label: '图片调整', icon: '⚙️', color: 'green' },
    { id: 'filters' as ToolTab, label: '滤镜效果', icon: '🌈', color: 'pink' },
    { id: 'preview' as ToolTab, label: '预览管理', icon: '👁️', color: 'orange' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-3">
            图片工具箱
          </h1>
          <p className="text-slate-600 text-lg">
            一站式图片处理解决方案 • 支持多种格式转换和特效处理
          </p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              格式转换
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
              ASCII艺术
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              图片调整
            </span>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
              滤镜特效
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
              批量处理
            </span>
          </div>
        </motion.div>

        {/* 上传区域 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <label
            className={`block border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 shadow-lg'
                : 'border-slate-300 hover:border-blue-400 hover:bg-white/50 shadow-sm'
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
            <div className="text-6xl mb-6">📁</div>
            <h3 className="text-xl font-semibold mb-3">
              {isDragging ? '松开以上传图片' : '拖放图片或点击选择'}
            </h3>
            <p className="text-slate-500">
              支持 JPG, PNG, GIF, WEBP, BMP, SVG 等格式 • 单文件最大 100MB
            </p>
            <p className="text-sm text-slate-400 mt-2">
              图片处理均在浏览器本地完成，安全隐私
            </p>
          </label>
        </motion.div>

        {/* 统计信息和批量操作 */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-slate-500">图片总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
                  <div className="text-xs text-slate-500">已选择</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.processed}</div>
                  <div className="text-xs text-slate-500">已处理</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                >
                  {selectedIds.length === images.length ? '取消全选' : '全选'}
                </button>
                
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                  >
                    删除选中 ({selectedIds.length})
                  </button>
                )}
                
                <button
                  onClick={() => setBatchMode(!batchMode)}
                  className={`px-4 py-2 rounded-lg transition text-sm ${
                    batchMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {batchMode ? '退出批量模式' : '批量模式'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 工具选项卡 */}
        {images.length > 0 && (
          <>
            <div className="mb-6">
              <div className="flex flex-wrap gap-1 border-b border-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-t-lg text-sm font-medium transition-all relative group ${
                      activeTab === tab.id
                        ? `bg-white text-${tab.color}-600 border-t border-x border-slate-200`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${tab.color}-500`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 工具内容区域 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                {activeTab === 'converter' && (
                  <ImageConverter
                    images={images}
                    selectedIds={selectedIds}
                    batchMode={batchMode}
                    onUpdateImage={handleUpdateImage}
                    onBatchUpdate={handleBatchUpdate}
                    onToggleSelect={handleToggleSelect}
                    onRemoveImage={handleRemoveImage}
                  />
                )}
                
                {activeTab === 'ascii' && (
                  <AsciiArtGenerator
                    images={images}
                    selectedIds={selectedIds}
                    batchMode={batchMode}
                    onUpdateImage={handleUpdateImage}
                    onBatchUpdate={handleBatchUpdate}
                    onToggleSelect={handleToggleSelect}
                  />
                )}
                
                {activeTab === 'adjust' && (
                  <ImageAdjuster
                    images={images}
                    selectedIds={selectedIds}
                    batchMode={batchMode}
                    onUpdateImage={handleUpdateImage}
                    onBatchUpdate={handleBatchUpdate}
                    onToggleSelect={handleToggleSelect}
                  />
                )}
                
                {activeTab === 'filters' && (
                  <ImageFilters
                    images={images}
                    selectedIds={selectedIds}
                    batchMode={batchMode}
                    onUpdateImage={handleUpdateImage}
                    onBatchUpdate={handleBatchUpdate}
                    onToggleSelect={handleToggleSelect}
                  />
                )}
                
                {activeTab === 'preview' && (
                  <ImagePreview
                    images={images}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onRemoveImage={handleRemoveImage}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* 功能说明 */}
        {images.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-center mb-8 gradient-text">
              强大功能，触手可及
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: '🔄',
                  title: '格式转换',
                  desc: '支持多种格式互转，批量处理，质量可调',
                  features: ['WEBP/PNG/JPG/AVIF', '批量转换', '质量调整', '尺寸限制']
                },
                {
                  icon: '🎨',
                  title: 'ASCII艺术',
                  desc: '多种字符集选择，彩色/黑白输出，实时预览',
                  features: ['5种字符集', '彩色ASCII', '实时预览', '导出文本']
                },
                {
                  icon: '⚙️',
                  title: '图片调整',
                  desc: '亮度对比度调整，旋转翻转，尺寸裁剪',
                  features: ['亮度/对比度', '旋转/翻转', '尺寸调整', '批量处理']
                },
                {
                  icon: '🌈',
                  title: '滤镜特效',
                  desc: '多种滤镜效果，强度可调，批量应用',
                  features: ['黑白/复古', '反色/怀旧', '模糊/锐化', '批量应用']
                }
              ].map((tool, index) => (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="text-3xl mb-4">{tool.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{tool.desc}</p>
                  <ul className="space-y-1">
                    {tool.features.map((feature) => (
                      <li key={feature} className="text-xs text-slate-500 flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold mb-4">开始使用</h3>
              <p className="text-slate-600 mb-6">
                上传图片后即可体验所有功能，所有处理均在您的浏览器中完成
              </p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="text-sm font-medium">隐私安全</div>
                  <div className="text-xs text-slate-500">图片不上传服务器</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm font-medium">快速处理</div>
                  <div className="text-xs text-slate-500">本地GPU加速</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💾</div>
                  <div className="text-sm font-medium">离线可用</div>
                  <div className="text-xs text-slate-500">无需网络连接</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}