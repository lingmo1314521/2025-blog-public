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

  // 添加页面特定的类名，避免样式冲突
  useEffect(() => {
    document.body.classList.add('image-toolbox-page');
    return () => {
      document.body.classList.remove('image-toolbox-page');
      document.body.classList.remove('image-toolbox-active');
    };
  }, []);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'))
    if (!files.length) return

    const newImages = await Promise.all(
      files.map(async (file, index) => {
        const preview = URL.createObjectURL(file)
        const bitmap = await createImageBitmap(file)
        return {
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          width: bitmap.width,
          height: bitmap.height
        }
      })
    )

    setImages(prev => {
      const existingNames = new Set(prev.map(img => img.file.name + img.file.size + img.file.lastModified))
      const uniqueNewImages = newImages.filter(img => 
        !existingNames.has(img.file.name + img.file.size + img.file.lastModified)
      )
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            🛠️ 图片工具箱
          </h1>
          <p className="text-slate-600 text-lg">一站式图片处理解决方案，支持多种格式转换和特效处理</p>
        </motion.div>

        {/* 上传区域 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-10"
        >
          <label
            className={`file-dropzone ${isDragging ? 'active' : ''}`}
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
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-6 opacity-80">📁</div>
              <h3 className="text-2xl font-semibold mb-3">
                {isDragging ? '✨ 松开以上传' : '📤 拖放图片或点击选择'}
              </h3>
              <p className="text-slate-500 mb-2 max-w-md mx-auto">
                支持 JPG、PNG、WEBP、GIF、BMP、SVG 等多种图片格式
              </p>
              <p className="text-sm text-slate-400 mt-2">最多可同时处理 20 张图片，单张最大 10MB</p>
            </div>
          </label>
        </motion.div>

        {/* 图片列表概览 */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-semibold">已选择 {images.length} 张图片</h2>
                <p className="text-slate-500 text-sm mt-1">
                  总计大小：{(images.reduce((sum, img) => sum + img.file.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="tool-button tool-button-secondary"
                >
                  跳到底部
                </button>
                <button
                  onClick={() => setImages([])}
                  className="tool-button tool-button-danger"
                >
                  🗑️ 清空全部
                </button>
              </div>
            </div>
            <div className="image-grid">
              {images.slice(0, 12).map((img) => (
                <div key={img.id} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100">
                    <img
                      src={img.preview}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                      <div className="font-medium truncate">{img.file.name}</div>
                      <div className="flex justify-between mt-1">
                        <span>{img.width}×{img.height}</span>
                        <span>{(img.file.size / 1024).toFixed(1)}KB</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-sm shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    title="移除图片"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length > 12 && (
                <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-dashed border-slate-300">
                  <div className="text-3xl mb-2">📚</div>
                  <span className="text-slate-600 font-medium">+{images.length - 12}</span>
                  <span className="text-slate-500 text-sm mt-1">更多图片</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 工具选项卡 */}
        {images.length > 0 && (
          <>
            <div className="mb-8">
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-white shadow-md text-blue-600'
                        : 'text-slate-600 hover:text-blue-500 hover:bg-white/50'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 工具内容区域 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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

        {/* 功能说明 - 当没有图片时显示 */}
        {images.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold text-center mb-12">✨ 工具箱功能</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold mb-3">格式转换</h3>
                <p className="text-slate-600">
                  支持多种格式互转，批量处理，调整质量和尺寸，一键完成图片优化
                </p>
                <ul className="mt-4 text-sm text-slate-500 space-y-1">
                  <li>• JPG ↔ PNG ↔ WEBP ↔ AVIF</li>
                  <li>• 质量调整（1-100%）</li>
                  <li>• 尺寸限制和裁剪</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold mb-3">ASCII 艺术</h3>
                <p className="text-slate-600">
                  将图片转换为字符画，支持多种字符集和彩色输出，创造独特的文字艺术
                </p>
                <ul className="mt-4 text-sm text-slate-500 space-y-1">
                  <li>• 多种字符集选择</li>
                  <li>• 可调宽度和密度</li>
                  <li>• 彩色/反色输出</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-3">图片处理</h3>
                <p className="text-slate-600">
                  亮度、对比度、饱和度调整，旋转翻转，尺寸调整，实时预览效果
                </p>
                <ul className="mt-4 text-sm text-slate-500 space-y-1">
                  <li>• 色彩调整工具</li>
                  <li>• 旋转和翻转</li>
                  <li>• 预设尺寸模板</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl mb-4">🌈</div>
                <h3 className="text-xl font-semibold mb-3">滤镜效果</h3>
                <p className="text-slate-600">
                  应用多种滤镜效果，黑白、复古、反色、怀旧，一键美化你的图片
                </p>
                <ul className="mt-4 text-sm text-slate-500 space-y-1">
                  <li>• 黑白滤镜</li>
                  <li>• 复古/怀旧效果</li>
                  <li>• 反色处理</li>
                </ul>
              </div>
            </div>

            {/* 使用提示 */}
            <div className="mt-12 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                💡 使用提示
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/80 p-4 rounded-xl">
                  <h4 className="font-medium text-slate-700 mb-2">快速开始</h4>
                  <p className="text-sm text-slate-600">
                    1. 拖放或点击上传图片<br/>
                    2. 选择需要的功能标签<br/>
                    3. 调整参数并应用效果<br/>
                    4. 下载或分享处理结果
                  </p>
                </div>
                <div className="bg-white/80 p-4 rounded-xl">
                  <h4 className="font-medium text-slate-700 mb-2">注意事项</h4>
                  <p className="text-sm text-slate-600">
                    • 所有图片均在浏览器本地处理<br/>
                    • 支持批量处理，提升效率<br/>
                    • 处理结果可一键下载<br/>
                    • 不会上传到任何服务器
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 页脚信息 */}
        <footer className="mt-16 pt-8 border-t border-slate-200">
          <div className="text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} 图片工具箱 • 所有处理均在本地完成，保障隐私安全</p>
            <p className="mt-2">基于现代 Web API 构建，支持最新浏览器功能</p>
          </div>
        </footer>
      </div>
    </div>
  )
}