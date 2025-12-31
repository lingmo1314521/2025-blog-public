'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ANIMATION_DELAY } from '@/consts'
import { AsciiOutputs } from './components/ascii-outputs'
import { Gallery } from './components/gallery'

type SelectedImage = {
  file: File
  preview: string
  width: number
  height: number
}

type AsciiResult = {
  asciiText: string
  bbCode?: string
  htmlCode?: string
  markdown?: string
  imageUrl?: string
  width: number
  height: number
  processingTime: number
}

type AsciiOptions = {
  width: number
  contrast: number
  sharpness: number
  colorize: number
  blackPoint: number
  whitePoint: number
  characterSet: string
  colorMode: string
  transparentBg: boolean
}

interface AsciiConverterProps {
  images: SelectedImage[]
  onClearAll: () => void
}

// ASCII字符集
const CHARACTER_SETS = {
  ascii: '@%#*+=-:. ',
  extended: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`. ',
  boxonly: '█▓▒░ ',
  block: '█▉▊▋▌▍▎▏',
  outline: '◎○●◯◌◍◎',
  slash: '/\\|-_',
  oldskool: ' .`^\'",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  braille: '⣿⣷⣯⣟⡿⢿⣻⣽⣾',
  custom: '@%#*+=-:. '
}

// 尺寸预设
const SIZE_PRESETS = [
  { label: '签名 (120×4)', width: 120, height: 4 },
  { label: '标签 (80×30)', width: 80, height: 30 },
  { label: '帖子 (100×50)', width: 100, height: 50 },
  { label: '信件 (200×100)', width: 200, height: 100 },
  { label: '高清壁纸 (300×78)', width: 300, height: 78 },
  { label: 'T恤图案 (412×108)', width: 412, height: 108 },
  { label: '海报 (600×310)', width: 600, height: 310 }
]

export function AsciiConverter({ images, onClearAll }: AsciiConverterProps) {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [asciiResult, setAsciiResult] = useState<AsciiResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate')
  
  // 参数状态
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(1) // 默认为标签尺寸
  const [customWidth, setCustomWidth] = useState(80)
  const [customHeight, setCustomHeight] = useState(30)
  const [useCustomSize, setUseCustomSize] = useState(false)
  
  const [selectedCharset, setSelectedCharset] = useState('extended')
  const [customCharset, setCustomCharset] = useState('@%#*+=-:. ')
  
  const [selectedColorMode, setSelectedColorMode] = useState('bonw')
  const [transparentBg, setTransparentBg] = useState(false)
  
  const [contrast, setContrast] = useState(1.0)
  const [sharpness, setSharpness] = useState(40)
  const [colorize, setColorize] = useState(215)
  const [blackPoint, setBlackPoint] = useState(40)
  const [whitePoint, setWhitePoint] = useState(240)
  
  const [imageTitle, setImageTitle] = useState('ASCII Art')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 自动选择第一张图片
  useEffect(() => {
    if (images.length > 0 && !selectedImage) {
      setSelectedImage(images[0])
    }
  }, [images, selectedImage])

  // 获取当前尺寸
  const getCurrentSize = useCallback(() => {
    if (useCustomSize) {
      return { width: Math.max(10, customWidth), height: Math.max(10, customHeight) }
    }
    const preset = SIZE_PRESETS[selectedSizeIndex]
    return { width: preset.width, height: preset.height }
  }, [useCustomSize, selectedSizeIndex, customWidth, customHeight])

  // 获取当前字符集
  const getCurrentCharset = useCallback(() => {
    if (selectedCharset === 'custom') {
      return customCharset || '@%#*+=-:. '
    }
    return CHARACTER_SETS[selectedCharset as keyof typeof CHARACTER_SETS] || CHARACTER_SETS.extended
  }, [selectedCharset, customCharset])

  // 生成ASCII艺术
  const handleGenerate = useCallback(async () => {
    if (!selectedImage) return
    
    setIsProcessing(true)
    try {
      const startTime = performance.now()
      const { width, height } = getCurrentSize()
      const charset = getCurrentCharset()
      
      // 创建图片元素
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = selectedImage.preview
      })

      // 创建canvas进行处理
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法创建画布上下文')
      
      // 设置canvas尺寸
      canvas.width = width
      canvas.height = height
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 获取像素数据
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      
      // 生成ASCII文本
      let asciiText = ''
      const charsetLength = charset.length
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          
          // 计算亮度
          let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          
          // 应用对比度
          brightness = ((brightness - 0.5) * contrast) + 0.5
          brightness = Math.max(0, Math.min(1, brightness))
          
          // 应用黑白点
          const normalizedBlack = blackPoint / 255
          const normalizedWhite = whitePoint / 255
          
          if (brightness <= normalizedBlack) brightness = 0
          else if (brightness >= normalizedWhite) brightness = 1
          else brightness = (brightness - normalizedBlack) / (normalizedWhite - normalizedBlack)
          
          // 映射到字符集
          const charIndex = Math.floor(brightness * (charsetLength - 1))
          asciiText += charset.charAt(charIndex)
        }
        asciiText += '\n'
      }
      
      // 生成其他格式
      const processingTime = performance.now() - startTime
      
      // BBCode
      const bbCode = `[code]\n${asciiText}\n[/code]`
      
      // HTML
      const htmlCode = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ASCII Art</title>
    <style>
        body { margin: 0; padding: 20px; background: ${transparentBg ? 'transparent' : (selectedColorMode === 'wonb' ? '#000' : '#fff')}; }
        pre { margin: 0; line-height: 1; color: ${selectedColorMode === 'wonb' ? '#fff' : '#000'}; font-family: monospace; }
    </style>
</head>
<body>
    <pre>${asciiText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`
      
      // Markdown
      const markdown = '```\n' + asciiText + '\n```'
      
      // 生成图片
      const outputCanvas = document.createElement('canvas')
      const outputCtx = outputCanvas.getContext('2d')
      if (!outputCtx) throw new Error('无法创建输出画布')
      
      // 计算图片尺寸（每个字符10x20像素）
      const charWidth = 10
      const charHeight = 20
      outputCanvas.width = width * charWidth
      outputCanvas.height = height * charHeight
      
      // 设置背景
      if (!transparentBg) {
        outputCtx.fillStyle = selectedColorMode === 'wonb' ? '#000' : '#fff'
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
      }
      
      // 设置字体
      outputCtx.font = `${charHeight}px "Courier New", monospace`
      outputCtx.textBaseline = 'top'
      
      // 绘制字符
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          
          // 计算亮度
          let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          const charIndex = Math.floor(brightness * (charsetLength - 1))
          const char = charset.charAt(charIndex)
          
          // 设置颜色
          if (selectedColorMode === 'color' || selectedColorMode === 'c16') {
            if (colorize < 255) {
              const gray = (r + g + b) / 3
              const colorFactor = colorize / 255
              const grayFactor = 1 - colorFactor
              const finalR = Math.round(r * colorFactor + gray * grayFactor)
              const finalG = Math.round(g * colorFactor + gray * grayFactor)
              const finalB = Math.round(b * colorFactor + gray * grayFactor)
              outputCtx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`
            } else {
              outputCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
            }
          } else {
            outputCtx.fillStyle = selectedColorMode === 'wonb' ? '#fff' : '#000'
          }
          
          // 绘制字符
          outputCtx.fillText(char, x * charWidth, y * charHeight)
        }
      }
      
      const imageUrl = outputCanvas.toDataURL('image/png')
      
      setAsciiResult({
        asciiText,
        bbCode,
        htmlCode,
        markdown,
        imageUrl,
        width,
        height,
        processingTime
      })
      
    } catch (error) {
      console.error('ASCII生成失败:', error)
      alert('ASCII生成失败，请稍后再试')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedImage, getCurrentSize, getCurrentCharset, contrast, blackPoint, whitePoint, colorize, selectedColorMode, transparentBg])

  // 分享到Imgur（模拟）
  const handleShareToImgur = useCallback(async (title: string) => {
    // 在实际应用中，这里会调用Imgur API
    await new Promise(resolve => setTimeout(resolve, 1500))
    alert(`"${title}" 已成功分享到画廊！`)
  }, [])

  return (
    <div className="space-y-6">
      {/* 功能标签页 */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'generate' ? 'text-brand border-b-2 border-brand' : 'text-secondary hover:text-primary'
          }`}
        >
          生成ASCII艺术
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'gallery' ? 'text-brand border-b-2 border-brand' : 'text-secondary hover:text-primary'
          }`}
        >
          作品画廊
        </button>
      </div>

      {/* 生成界面 */}
      {activeTab === 'generate' && (
        <>
          {images.length > 0 ? (
            <>
              {/* 图片选择器 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card relative"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="text-secondary flex items-center gap-3 text-xs tracking-[0.2em] uppercase">
                    <span>选择图片进行ASCII转换</span>
                  </div>
                  <button
                    onClick={onClearAll}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-50"
                  >
                    清空全部
                  </button>
                </div>
                
                <div className="py-4">
                  <p className="text-secondary mb-3 text-xs tracking-[0.2em] uppercase">选择图片</p>
                  <div className="flex flex-wrap gap-3">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(image)}
                        className={`flex flex-col items-center rounded-xl border p-2 transition-all ${
                          selectedImage?.preview === image.preview
                            ? 'border-brand bg-brand/5'
                            : 'border-slate-200 hover:border-brand/50'
                        }`}
                      >
                        <div className="h-16 w-16 overflow-hidden rounded-lg">
                          <img
                            src={image.preview}
                            alt={image.file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="mt-1 max-w-[80px] truncate text-xs">
                          {image.file.name.length > 12
                            ? `${image.file.name.slice(0, 9)}...`
                            : image.file.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 参数设置 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card relative space-y-6"
              >
                <h3 className="text-lg font-semibold">转换设置</h3>
                
                {/* 尺寸设置 */}
                <div>
                  <label className="mb-2 block text-sm font-medium">尺寸预设</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SIZE_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSizeIndex(index)
                          setUseCustomSize(false)
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          !useCustomSize && selectedSizeIndex === index
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setUseCustomSize(true)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        useCustomSize
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      自定义尺寸
                    </button>
                  </div>
                  
                  {useCustomSize && (
                    <div className="mt-3 flex gap-3">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs">宽度</label>
                        <input
                          type="number"
                          value={customWidth}
                          onChange={e => setCustomWidth(Math.max(10, parseInt(e.target.value) || 80))}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                          min="10"
                          max="1000"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs">高度</label>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={e => setCustomHeight(Math.max(10, parseInt(e.target.value) || 30))}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                          min="10"
                          max="1000"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 字符集设置 */}
                <div>
                  <label className="mb-2 block text-sm font-medium">字符集风格</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Object.entries(CHARACTER_SETS).map(([key]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedCharset(key)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          selectedCharset === key
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {key === 'ascii' ? 'ASCII字符集' :
                         key === 'extended' ? '扩展字符集' :
                         key === 'boxonly' ? '方块字符' :
                         key === 'block' ? '块状字符' :
                         key === 'outline' ? '轮廓字符' :
                         key === 'slash' ? '斜线字符' :
                         key === 'oldskool' ? '怀旧风格' :
                         key === 'braille' ? '盲文字符' :
                         '自定义字符'}
                      </button>
                    ))}
                  </div>
                  
                  {selectedCharset === 'custom' && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs">自定义字符（从暗到亮）</label>
                      <input
                        type="text"
                        value={customCharset}
                        onChange={e => setCustomCharset(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                        placeholder="例如: .:-=+*#%@"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        字符顺序表示从最暗到最亮，建议至少3个字符
                      </p>
                    </div>
                  )}
                </div>

                {/* 颜色设置 */}
                <div>
                  <label className="mb-2 block text-sm font-medium">颜色模式</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <button
                      onClick={() => setSelectedColorMode('bonw')}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selectedColorMode === 'bonw'
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      黑底白字
                    </button>
                    <button
                      onClick={() => setSelectedColorMode('wonb')}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selectedColorMode === 'wonb'
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      白底黑字
                    </button>
                    <button
                      onClick={() => setSelectedColorMode('c16')}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selectedColorMode === 'c16'
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      复古16色
                    </button>
                    <button
                      onClick={() => setSelectedColorMode('color')}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selectedColorMode === 'color'
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      全彩色
                    </button>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="transparent-bg"
                      checked={transparentBg}
                      onChange={e => setTransparentBg(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <label htmlFor="transparent-bg" className="text-sm">
                      透明背景
                    </label>
                  </div>
                </div>

                {/* 精细调整滑块 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">精细调整</h4>
                  
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>对比度</span>
                      <span>{contrast.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={contrast}
                      onChange={e => setContrast(parseFloat(e.target.value))}
                      className="range-track w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>锐度</span>
                      <span>{sharpness}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={sharpness}
                      onChange={e => setSharpness(parseInt(e.target.value))}
                      className="range-track w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>单色</span>
                      <span>彩色化</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      step="1"
                      value={colorize}
                      onChange={e => setColorize(parseInt(e.target.value))}
                      className="range-track w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0</span>
                      <span>127</span>
                      <span>255</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>黑点</span>
                      <span>白点</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="180"
                        step="1"
                        value={blackPoint}
                        onChange={e => setBlackPoint(parseInt(e.target.value))}
                        className="absolute top-0 h-2 w-full opacity-50"
                      />
                      <input
                        type="range"
                        min="181"
                        max="255"
                        step="1"
                        value={whitePoint}
                        onChange={e => setWhitePoint(parseInt(e.target.value))}
                        className="absolute top-0 h-2 w-full opacity-50"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{blackPoint}</span>
                      <span>阈值</span>
                      <span>{whitePoint}</span>
                    </div>
                  </div>
                </div>

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerate}
                  disabled={!selectedImage || isProcessing}
                  className="bg-brand hover:bg-brand/90 w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? '生成中...' : '生成ASCII艺术'}
                </button>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card relative"
            >
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="bg-brand/10 text-brand/60 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
                  📷
                </div>
                <div>
                  <p className="font-medium">还没有选择图片</p>
                  <p className="text-secondary text-sm">请在上方上传图片开始ASCII艺术转换</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 结果展示 */}
          {asciiResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card relative"
            >
              <h3 className="mb-4 text-lg font-semibold">转换结果</h3>
              <div className="mb-4 flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-500">尺寸: </span>
                  <span className="font-medium">{asciiResult.width}×{asciiResult.height}</span>
                </div>
                <div>
                  <span className="text-slate-500">处理时间: </span>
                  <span className="font-medium">{asciiResult.processingTime.toFixed(0)}ms</span>
                </div>
              </div>
              
              <AsciiOutputs 
                result={asciiResult} 
                imageTitle={imageTitle}
                onShareToImgur={handleShareToImgur}
              />
            </motion.div>
          )}
        </>
      )}

      {/* 画廊界面 */}
      {activeTab === 'gallery' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card relative"
        >
          <h3 className="mb-6 text-lg font-semibold">ASCII艺术画廊</h3>
          <Gallery category="all" />
        </motion.div>
      )}
    </div>
  )
}