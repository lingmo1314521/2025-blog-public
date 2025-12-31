'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import { DialogModal } from '@/components/dialog-modal'
import { AsciiConverter } from './ascii-converter'
import { convertImage, FORMATS, type ImageFormat, type ConvertOptions, detectSupportedFormats, getRecommendedSettings } from './utils/image-converter'

type ConvertedMeta = {
  url: string
  size: number
  format: ImageFormat
  compressionRatio: number
  width: number
  height: number
}

type SelectedImage = {
  file: File
  preview: string
  width: number
  height: number
  converted?: ConvertedMeta
  converting?: boolean
  error?: string
}

const MAX_NAME_LENGTH = 32

function getFileExtension(name: string) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx) : ''
}

function formatFileName(name: string) {
  if (name.length <= MAX_NAME_LENGTH) return name
  const ext = getFileExtension(name)
  if (!ext) {
    return `${name.slice(0, MAX_NAME_LENGTH - 3)}...`
  }
  const maxBaseLength = Math.max(1, MAX_NAME_LENGTH - ext.length - 3)
  return `${name.slice(0, maxBaseLength)}...${ext}`
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function Page() {
  const [images, setImages] = useState<SelectedImage[]>([])
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp')
  const [quality, setQuality] = useState(0.8)
  const [limitMaxWidth, setLimitMaxWidth] = useState(false)
  const [maxWidth, setMaxWidth] = useState(1200)
  const [keepTransparency, setKeepTransparency] = useState(true)
  const [batchConverting, setBatchConverting] = useState(false)
  const [compareIndex, setCompareIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'convert' | 'ascii'>('convert')
  const [supportedFormats, setSupportedFormats] = useState<ImageFormat[]>(['webp', 'png', 'jpeg'])
  const [useCase, setUseCase] = useState<'web' | 'print' | 'storage' | 'social' | 'custom'>('web')
  
  const hasImages = images.length > 0
  const hasConvertible = images.length > 0
  const hasConverted = images.some(item => !!item.converted)
  const imagesRef = useRef<SelectedImage[]>([])
  const dragCounterRef = useRef(0)

  // 检测支持的格式
  useEffect(() => {
    detectSupportedFormats().then(formats => {
      setSupportedFormats(formats)
    })
  }, [])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // 根据用途自动设置推荐格式
  useEffect(() => {
    if (useCase !== 'custom') {
      let recommendedFormat: ImageFormat = 'webp'
      
      switch (useCase) {
        case 'web':
          recommendedFormat = supportedFormats.includes('webp') ? 'webp' : 'jpeg'
          setKeepTransparency(true)
          setQuality(0.8)
          break
        case 'print':
          recommendedFormat = 'png'
          setKeepTransparency(true)
          setQuality(1)
          break
        case 'storage':
          recommendedFormat = supportedFormats.includes('avif') ? 'avif' : 'webp'
          setKeepTransparency(false)
          setQuality(0.6)
          break
        case 'social':
          recommendedFormat = 'jpeg'
          setKeepTransparency(false)
          setQuality(0.85)
          break
      }
      
      if (supportedFormats.includes(recommendedFormat)) {
        setTargetFormat(recommendedFormat)
      }
    }
  }, [useCase, supportedFormats])

  // 当格式改变时，更新相关选项
  useEffect(() => {
    const formatInfo = FORMATS[targetFormat]
    if (!formatInfo.supportsTransparency) {
      setKeepTransparency(false)
    }
  }, [targetFormat])

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'))
    if (!files.length) return

    const nextItems = await Promise.all(
      files.map(async file => {
        const preview = URL.createObjectURL(file)
        const bitmap = await createImageBitmap(file)
        return {
          file,
          preview,
          width: bitmap.width,
          height: bitmap.height
        }
      })
    )

    setImages(prev => {
      const deduped = [...prev]
      nextItems.forEach(item => {
        const exists = deduped.some(existing => {
          return existing.file.name === item.file.name && existing.file.size === item.file.size && existing.file.lastModified === item.file.lastModified
        })

        if (!exists) {
          deduped.push(item)
        } else {
          URL.revokeObjectURL(item.preview)
        }
      })
      return deduped
    })
  }, [])

  const handleDragEnter = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current += 1
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0
      handleFiles(event.dataTransfer?.files ?? null)
    },
    [handleFiles]
  )

  const totalSize = useMemo(() => {
    const bytes = images.reduce((acc, item) => acc + item.file.size, 0)
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }, [images])

  const handleConvertImage = useCallback(
    async (index: number) => {
      const target = images[index]
      if (!target || target.converting) return
      
      setImages(prev => prev.map((item, idx) => (idx === index ? { ...item, converting: true, error: undefined } : item)))
      
      try {
        const options: ConvertOptions = {
          format: targetFormat,
          quality,
          maxWidth: limitMaxWidth ? maxWidth : undefined,
          keepTransparency: keepTransparency && FORMATS[targetFormat].supportsTransparency,
          jpegProgressive: true,
          pngCompressionLevel: 6,
          gifDithering: true
        }
        
        const result = await convertImage(target.file, options)
        
        setImages(prev =>
          prev.map((item, idx) => {
            if (idx !== index) return item
            if (item.converted?.url) {
              URL.revokeObjectURL(item.converted.url)
            }
            return {
              ...item,
              converting: false,
              converted: {
                url: result.url,
                size: result.size,
                format: result.format,
                compressionRatio: result.compressionRatio,
                width: result.width,
                height: result.height
              }
            }
          })
        )
      } catch (error) {
        console.error(error)
        setImages(prev => prev.map((item, idx) => 
          idx === index ? { 
            ...item, 
            converting: false, 
            error: error instanceof Error ? error.message : '转换失败' 
          } : item
        ))
      }
    },
    [images, targetFormat, quality, limitMaxWidth, maxWidth, keepTransparency]
  )

  const handleDownloadImage = useCallback(
    (index: number) => {
      const target = images[index]
      if (!target?.converted) return
      const link = document.createElement('a')
      const baseName = target.file.name.replace(/\.[^.]+$/, '')
      link.href = target.converted.url
      link.download = `${baseName}${FORMATS[target.converted.format].fileExtension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    [images]
  )

  const handleConvertAll = useCallback(async () => {
    if (!hasImages || batchConverting) return
    setBatchConverting(true)
    
    try {
      for (let i = 0; i < imagesRef.current.length; i += 1) {
        const current = imagesRef.current[i]
        if (!current) continue
        
        setImages(prev => prev.map((item, idx) => (idx === i ? { ...item, converting: true, error: undefined } : item)))
        
        try {
          const options: ConvertOptions = {
            format: targetFormat,
            quality,
            maxWidth: limitMaxWidth ? maxWidth : undefined,
            keepTransparency: keepTransparency && FORMATS[targetFormat].supportsTransparency,
            jpegProgressive: true,
            pngCompressionLevel: 6,
            gifDithering: true
          }
          
          const result = await convertImage(current.file, options)
          
          setImages(prev =>
            prev.map((item, idx) => {
              if (idx !== i) return item
              if (item.converted?.url) {
                URL.revokeObjectURL(item.converted.url)
              }
              return {
                ...item,
                converting: false,
                converted: {
                  url: result.url,
                  size: result.size,
                  format: result.format,
                  compressionRatio: result.compressionRatio,
                  width: result.width,
                  height: result.height
                }
              }
            })
          )
        } catch (error) {
          console.error(`转换失败 ${current.file.name}:`, error)
          setImages(prev => prev.map((item, idx) => 
            idx === i ? { 
              ...item, 
              converting: false, 
              error: error instanceof Error ? error.message : '转换失败' 
            } : item
          ))
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setBatchConverting(false)
    }
  }, [batchConverting, hasImages, targetFormat, quality, limitMaxWidth, maxWidth, keepTransparency])

  const handleDownloadAll = useCallback(() => {
    if (!hasConverted) return
    images.forEach(item => {
      if (!item.converted) return
      const link = document.createElement('a')
      const baseName = item.file.name.replace(/\.[^.]+$/, '')
      link.href = item.converted.url
      link.download = `${baseName}${FORMATS[item.converted.format].fileExtension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
    })
  }, [images, hasConverted])

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => {
      const next = [...prev]
      const removed = next.splice(index, 1)[0]
      if (removed) {
        URL.revokeObjectURL(removed.preview)
        if (removed.converted?.url) {
          URL.revokeObjectURL(removed.converted.url)
        }
      }
      return next
    })
  }, [])

  const handleCompareImage = useCallback((index: number) => {
    setCompareIndex(index)
  }, [])

  const handleCloseCompare = useCallback(() => {
    setCompareIndex(null)
  }, [])

  const handleClearAll = useCallback(() => {
    setImages(prev => {
      prev.forEach(item => {
        URL.revokeObjectURL(item.preview)
        if (item.converted?.url) {
          URL.revokeObjectURL(item.converted.url)
        }
      })
      return []
    })
  }, [])

  const handleApplyRecommended = useCallback(() => {
    if (images.length > 0) {
      const sampleSize = images[0].file.size
      const recommended = getRecommendedSettings(sampleSize, targetFormat)
      
      if (recommended.quality !== undefined) {
        setQuality(recommended.quality)
      }
      if (recommended.maxWidth !== undefined) {
        setLimitMaxWidth(true)
        setMaxWidth(recommended.maxWidth)
      }
    }
  }, [images, targetFormat])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(item => {
        URL.revokeObjectURL(item.preview)
        if (item.converted?.url) {
          URL.revokeObjectURL(item.converted.url)
        }
      })
    }
  }, [])

  const formatInfo = FORMATS[targetFormat]
  const totalSavedBytes = useMemo(() => {
    return images.reduce((acc, item) => {
      if (item.converted) {
        return acc + (item.file.size - item.converted.size)
      }
      return acc
    }, 0)
  }, [images])

  return (
    <div className="relative px-6 pt-32 pb-12 text-sm max-sm:pt-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: INIT_DELAY }}
          className="space-y-2 text-center"
        >
          <p className="text-secondary text-xs tracking-[0.2em] uppercase">Image Toolbox</p>
          <h1 className="text-2xl font-semibold">多功能图片转换工具箱</h1>
          <p className="text-secondary">上传图片 → 选择格式 → 调整参数 → 一键转换下载</p>
        </motion.div>

        {/* 功能切换标签页 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: INIT_DELAY + ANIMATION_DELAY }}
          className="card relative"
        >
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('convert')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === 'convert' ? 'text-brand border-b-2 border-brand' : 'text-secondary hover:text-primary'
              }`}
            >
              🖼️ 图片格式转换
            </button>
            <button
              onClick={() => setActiveTab('ascii')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === 'ascii' ? 'text-brand border-b-2 border-brand' : 'text-secondary hover:text-primary'
              }`}
            >
              ✨ 图片转 ASCII 艺术
            </button>
          </div>
          
          <div className="mt-4 text-sm text-slate-600">
            {activeTab === 'convert' ? (
              <p>支持多种图片格式转换：WEBP、PNG、JPEG、AVIF、GIF。优化压缩，减小文件大小。</p>
            ) : (
              <p>将图片转换为ASCII字符艺术，支持多种字符集和颜色模式，可用于签名、论坛和创意项目。</p>
            )}
          </div>
        </motion.div>

        {/* 上传区域 */}
        <motion.label
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: INIT_DELAY + ANIMATION_DELAY }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group hover:border-brand/20 card relative flex cursor-pointer flex-col items-center justify-center gap-3 text-center transition-colors hover:bg-white/80 ${
            isDragging ? 'border-brand bg-white' : ''
          }`}
        >
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={event => handleFiles(event.target.files)} 
          />
          <div className="bg-brand/10 text-brand/60 group-hover:bg-brand/10 flex h-20 w-20 items-center justify-center rounded-full text-3xl transition">
            📷
          </div>
          <div>
            <p className="text-base font-medium">点击或拖拽图片上传</p>
            <p className="text-secondary text-xs">支持 PNG、JPG、JPEG、WEBP、GIF、AVIF、HEIC 等格式</p>
            {images.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                已上传 {images.length} 张图片，总计 {totalSize}
                {totalSavedBytes > 0 && `，已节省 ${formatBytes(totalSavedBytes)}`}
              </p>
            )}
          </div>
        </motion.label>

        {/* 图片格式转换区域 */}
        {activeTab === 'convert' && (
          <>
            {/* 转换设置 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: INIT_DELAY + 2 * ANIMATION_DELAY }}
              className="card relative"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-secondary mb-3 text-xs tracking-[0.2em] uppercase">转换设置</p>
                  
                  {/* 用途选择 */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">预设用途</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        { value: 'web', label: '网页使用', icon: '🌐' },
                        { value: 'print', label: '印刷输出', icon: '🖨️' },
                        { value: 'storage', label: '节省空间', icon: '💾' },
                        { value: 'social', label: '社交媒体', icon: '📱' },
                        { value: 'custom', label: '自定义', icon: '⚙️' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setUseCase(option.value as any)}
                          className={`flex flex-col items-center rounded-lg border p-3 transition ${
                            useCase === option.value
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-1">{option.icon}</span>
                          <span className="text-xs">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 格式选择 */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">输出格式</label>
                      <div className="space-y-2">
                        {Object.entries(FORMATS)
                          .filter(([format]) => supportedFormats.includes(format as ImageFormat))
                          .map(([format, info]) => (
                            <button
                              key={format}
                              onClick={() => {
                                setTargetFormat(format as ImageFormat)
                                setUseCase('custom')
                              }}
                              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                                targetFormat === format
                                  ? 'border-brand bg-brand/5 text-brand'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="font-medium">{info.name}</div>
                                <div className="text-xs text-slate-500">{info.description}</div>
                              </div>
                              <div className={`px-2 py-1 text-xs font-medium rounded ${
                                targetFormat === format
                                  ? 'bg-brand text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {info.fileExtension}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* 质量设置 */}
                      {formatInfo.supportsQuality && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">质量 {Math.round(quality * 100)}%</label>
                            <button
                              onClick={handleApplyRecommended}
                              className="text-xs text-brand hover:text-brand/80"
                            >
                              应用推荐设置
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0.1}
                              max={1}
                              step={0.05}
                              value={quality}
                              onChange={event => {
                                setQuality(parseFloat(event.target.value))
                                setUseCase('custom')
                              }}
                              className="range-track flex-1"
                            />
                            <span className="w-12 text-right text-sm font-medium">{Math.round(quality * 100)}%</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            质量越高，文件越大，图片越清晰
                          </p>
                        </div>
                      )}
                      
                      {/* 透明背景选项 */}
                      {formatInfo.supportsTransparency && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="keep-transparency"
                            checked={keepTransparency}
                            onChange={event => {
                              setKeepTransparency(event.target.checked)
                              setUseCase('custom')
                            }}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <label htmlFor="keep-transparency" className="text-sm">
                            保持透明背景
                          </label>
                        </div>
                      )}
                      
                      {/* 尺寸限制 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="limit-max-width"
                            checked={limitMaxWidth}
                            onChange={event => {
                              setLimitMaxWidth(event.target.checked)
                              setUseCase('custom')
                            }}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <label htmlFor="limit-max-width" className="text-sm">
                            限制最大宽度
                          </label>
                        </div>
                        {limitMaxWidth && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={100}
                              max={10000}
                              step={100}
                              value={maxWidth}
                              onChange={event => {
                                setMaxWidth(Math.max(100, parseInt(event.target.value) || 1200))
                                setUseCase('custom')
                              }}
                              className="w-32 rounded border border-slate-200 px-3 py-2 text-sm"
                            />
                            <span className="text-sm text-slate-500">像素</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 批量操作按钮 */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleConvertAll}
                    disabled={!hasConvertible || batchConverting}
                    className={`rounded-full border px-4 py-2 font-medium transition ${
                      batchConverting 
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {batchConverting ? '全部转换中…' : `全部转换为 ${formatInfo.name}`}
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    disabled={!hasConverted}
                    className={`rounded-full border px-4 py-2 font-semibold transition ${
                      hasConverted 
                        ? 'border-brand text-brand hover:bg-brand/10' 
                        : 'border-slate-200 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    全部下载
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 图片列表 */}
            {hasImages && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="card relative"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="text-secondary flex items-center gap-3 text-xs tracking-[0.2em] uppercase">
                    <span>已选择 {images.length} 张图片</span>
                    <span>{totalSize}</span>
                    {totalSavedBytes > 0 && (
                      <span className="text-green-600">节省 {formatBytes(totalSavedBytes)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.multiple = true
                        input.onchange = (e: any) => handleFiles(e.target.files)
                        input.click()
                      }}
                      className="border-brand text-brand hover:bg-brand/10 rounded-full border px-3 py-1 text-xs font-medium transition"
                    >
                      添加更多
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-50"
                    >
                      清空全部
                    </button>
                  </div>
                </div>
                <ul className="divide-y divide-slate-200">
                  {images.map((item, index) => {
                    const { file, preview, converted, converting, error } = item
                    return (
                      <li key={`${file.name}-${index}`} className="flex items-center gap-4 py-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img src={preview} alt={file.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <p className="font-medium">{formatFileName(file.name)}</p>
                          <p className="text-secondary text-xs">
                            {item.width} × {item.height} · {formatBytes(file.size)}
                            {converted && (
                              <span className={`ml-2 ${
                                converted.compressionRatio > 0 ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {converted.format.toUpperCase()} {formatBytes(converted.size)} 
                                ({converted.compressionRatio > 0 ? '-' : '+'}{Math.abs(converted.compressionRatio).toFixed(1)}%)
                              </span>
                            )}
                          </p>
                          {error && (
                            <p className="text-xs text-rose-500 mt-1">{error}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 text-xs">
                          <button
                            onClick={() => handleConvertImage(index)}
                            disabled={!!converting}
                            className={`rounded-full px-3 py-1 font-medium transition disabled:cursor-not-allowed ${
                              converting 
                                ? 'bg-slate-100 text-slate-400' 
                                : converted 
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                  : 'bg-brand/10 text-brand hover:bg-brand/20'
                            }`}
                          >
                            {converting ? '转换中...' : converted ? '重新转换' : '转换'}
                          </button>
                          {converted ? (
                            <>
                              <button
                                onClick={() => handleCompareImage(index)}
                                className="border-brand text-brand hover:bg-brand/10 rounded-full border px-3 py-1 font-semibold transition"
                              >
                                对比
                              </button>
                              <button
                                onClick={() => handleDownloadImage(index)}
                                className="bg-brand hover:bg-brand/90 rounded-full px-3 py-1 font-semibold text-white transition"
                              >
                                下载
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="rounded-full border border-red-200 px-3 py-1 font-medium text-rose-400 transition hover:bg-rose-50"
                          >
                            移除
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )}

            {/* 没有图片时的提示 */}
            {!hasImages && activeTab === 'convert' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card relative"
              >
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <div className="bg-brand/10 text-brand/60 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
                    🖼️
                  </div>
                  <div>
                    <p className="font-medium">等待图片上传</p>
                    <p className="text-secondary text-sm">请在上方上传图片开始格式转换</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ASCII转换区域 */}
        {activeTab === 'ascii' && (
          <AsciiConverter images={images} onClearAll={handleClearAll} />
        )}

        {/* 功能说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: INIT_DELAY + 3 * ANIMATION_DELAY }}
          className="card relative"
        >
          <h3 className="mb-4 text-lg font-semibold">✨ 功能特点</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-brand">图片格式转换</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• 支持 WEBP、PNG、JPEG、AVIF、GIF 格式互转</li>
                <li>• 智能压缩，根据用途自动优化设置</li>
                <li>• 保持透明背景（支持格式）</li>
                <li>• 批量转换，节省时间</li>
                <li>• 转换前后对比，直观查看效果</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-brand">ASCII 艺术</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• 12种字符集风格（ASCII、方块、盲文等）</li>
                <li>• 7种尺寸预设（签名、标签、海报等）</li>
                <li>• 4种颜色模式（黑白、复古16色、全彩）</li>
                <li>• 实时参数调整（对比度、锐度等）</li>
                <li>• 多种输出格式（图片、BBCode、HTML、纯文本）</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              💡 <strong>提示：</strong>所有图片处理都在您的浏览器中完成，不会上传到服务器，保护您的隐私。
              某些高级格式（如AVIF）可能需要浏览器支持。
            </p>
          </div>
        </motion.div>
      </div>

      {/* 图片对比模态框 */}
      {compareIndex !== null && images[compareIndex]?.converted && (
        <DialogModal open={true} onClose={handleCloseCompare} className="w-full max-w-4xl">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col p-4">
              <div className="text-secondary mb-2 text-center text-sm font-medium">
                原图 ({formatBytes(images[compareIndex].file.size)})
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <img 
                  src={images[compareIndex].preview} 
                  alt="Original" 
                  className="h-full w-full object-contain" 
                />
              </div>
              <div className="mt-3 text-center text-xs text-slate-500">
                {images[compareIndex].width} × {images[compareIndex].height} 像素
              </div>
            </div>
            <div className="flex flex-col p-4">
              <div className="text-secondary mb-2 text-center text-sm font-medium">
                {FORMATS[images[compareIndex].converted!.format].name} ({formatBytes(images[compareIndex].converted!.size)})
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <img 
                  src={images[compareIndex].converted!.url} 
                  alt="Converted" 
                  className="h-full w-full object-contain" 
                />
              </div>
              <div className="mt-3 text-center text-xs text-slate-500">
                压缩率: {images[compareIndex].converted!.compressionRatio.toFixed(1)}% · 
                尺寸: {images[compareIndex].converted!.width}×{images[compareIndex].converted!.height}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleCloseCompare}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              关闭对比
            </button>
          </div>
        </DialogModal>
      )}

      {/* 页脚信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: INIT_DELAY + 4 * ANIMATION_DELAY }}
        className="mt-12 text-center"
      >
        <p className="text-xs text-slate-400">
          Image Toolbox v2.0 • 支持多种图片格式转换 • 所有处理均在浏览器本地完成
        </p>
        <p className="mt-2 text-xs text-slate-400">
          使用此工具表示您同意我们的{' '}
          <a href="#" className="text-brand hover:underline">使用条款</a>
          {' '}和{' '}
          <a href="#" className="text-brand hover:underline">隐私政策</a>
        </p>
      </motion.div>
    </div>
  )
}