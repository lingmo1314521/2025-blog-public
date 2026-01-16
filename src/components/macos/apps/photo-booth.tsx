'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, Download, Trash2, Sparkles, Aperture } from 'lucide-react'
import { clsx } from '../utils'
import { motion, AnimatePresence } from 'motion/react'

// 定义滤镜列表
const FILTERS = [
  { name: 'Normal', class: '', style: {} },
  { name: 'B&W', class: 'grayscale', style: { filter: 'grayscale(100%)' } },
  { name: 'Sepia', class: 'sepia', style: { filter: 'sepia(100%)' } },
  { name: 'Comic', class: 'contrast-200 saturate-200', style: { filter: 'contrast(200%) saturate(200%)' } },
  { name: 'Invert', class: 'invert', style: { filter: 'invert(100%)' } },
  { name: 'Thermal', class: '', style: { filter: 'hue-rotate(180deg) invert(100%) contrast(150%)' } },
  { name: 'X-Ray', class: 'grayscale invert contrast-150', style: { filter: 'grayscale(100%) invert(100%) contrast(150%)' } },
  { name: 'Pop Art', class: 'saturate-200 hue-rotate-90', style: { filter: 'saturate(200%) hue-rotate(90deg)' } },
]

export const PhotoBooth = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedFilterIdx, setSelectedFilterIdx] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [flash, setFlash] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const currentFilter = FILTERS[selectedFilterIdx]

  // 启动摄像头
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'user' }, 
          audio: false 
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        setError('')
      } catch (err) {
        console.error("Camera access error:", err)
        setError('Camera access denied or not found. Please check permissions.')
      }
    }

    startCamera()

    // 清理函数：关闭摄像头流
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 拍照逻辑
  const takePhoto = useCallback(() => {
    if (countdown > 0) return // 防止重复点击

    let count = 3
    setCountdown(count)

    const timer = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(timer)
        capture()
      }
    }, 1000)
  }, [countdown, selectedFilterIdx])

  // 捕获帧并保存
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    // 设置画布尺寸与视频一致
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 镜像处理 (水平翻转画布)
    context.translate(canvas.width, 0)
    context.scale(-1, 1)

    // 应用当前的滤镜 (核心步骤)
    // 我们需要手动将 CSS filter 字符串应用到 canvas context 上
    const filterStyle = FILTERS[selectedFilterIdx].style.filter
    if (filterStyle) {
        context.filter = filterStyle
    }

    // 将视频帧绘制到画布上
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 获取图片数据 URL
    const dataUrl = canvas.toDataURL('image/png')
    
    // 闪光灯效果
    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    // 保存照片到开头
    setPhotos(prev => [dataUrl, ...prev])
    setSelectedPhoto(dataUrl) // 自动选中最新照片以预览
  }

  const downloadPhoto = (dataUrl: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `photobooth_${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const deletePhoto = (photoToDelete: string) => {
    setPhotos(prev => prev.filter(p => p !== photoToDelete))
    if (selectedPhoto === photoToDelete) {
      setSelectedPhoto(null)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#2c2c2c] text-white overflow-hidden relative">
      
      {/* 主取景区 */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden group">
        {error ? (
          <div className="text-center px-8 py-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
             <Camera size={48} className="mx-auto mb-4 opacity-50"/>
             {error}
          </div>
        ) : (
          <>
             {/* 视频流：应用 CSS 滤镜和镜像翻转 */}
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted
               className={clsx("h-full w-auto object-cover scale-x-[-1] transition-all duration-300", currentFilter.class)}
               style={currentFilter.style}
             />
             {/* 用于拍照的隐藏 Canvas */}
             <canvas ref={canvasRef} className="hidden" />
             
             {/* 倒计时遮罩 */}
             <AnimatePresence>
                {countdown > 0 && (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        key={countdown}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 z-20"
                    >
                        <span className="text-[120px] font-bold text-white drop-shadow-lg">{countdown}</span>
                    </motion.div>
                )}
             </AnimatePresence>
             
             {/* 闪光灯层 */}
             {flash && <div className="absolute inset-0 bg-white z-30 animate-flash pointer-events-none" />}

             {/* 拍照按钮 (悬浮) */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={takePhoto}
                 disabled={countdown > 0}
                 className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Camera size={32} fill="white" />
               </button>
             </div>
          </>
        )}
      </div>

      {/* 底部控制栏和照片栏 */}
      <div className="h-36 bg-[#3a3a3a]/90 backdrop-blur-md border-t border-white/10 flex flex-col">
        
        {/* 滤镜选择栏 */}
        <div className="h-10 flex items-center justify-center gap-2 border-b border-white/5 px-2 overflow-x-auto no-scrollbar">
            <Aperture size={16} className="text-gray-400 mr-2 shrink-0" />
            {FILTERS.map((filter, idx) => (
                <button 
                    key={filter.name}
                    onClick={() => setSelectedFilterIdx(idx)}
                    className={clsx(
                        "text-xs px-2 py-0.5 rounded-full whitespace-nowrap transition-colors",
                        selectedFilterIdx === idx ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-white/10"
                    )}
                >
                    {filter.name}
                </button>
            ))}
        </div>

        {/* 照片胶卷栏 */}
        <div className="flex-1 flex items-center gap-3 px-4 overflow-x-auto py-3 bg-[#333]">
            {photos.length === 0 ? (
                <div className="text-gray-500 text-sm flex items-center gap-2 ml-4">
                    <Sparkles size={16}/> Photos will appear here
                </div>
            ) : (
                photos.map((photo, idx) => (
                    <div key={idx} className="relative group shrink-0">
                        <img 
                            src={photo} 
                            alt={`snap-${idx}`} 
                            onClick={() => setSelectedPhoto(photo)}
                            className={clsx(
                                "h-16 w-24 object-cover rounded-md border-2 cursor-pointer transition-all hover:scale-105",
                                selectedPhoto === photo ? "border-blue-500" : "border-white/20"
                            )}
                        />
                        {/* 悬浮操作按钮 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); downloadPhoto(photo) }} className="p-1 bg-black/50 hover:bg-blue-500 rounded-full"><Download size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deletePhoto(photo) }} className="p-1 bg-black/50 hover:bg-red-500 rounded-full"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* 大图预览浮层 */}
      <AnimatePresence>
        {selectedPhoto && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
                onClick={() => setSelectedPhoto(null)}
            >
                <img src={selectedPhoto} className="max-h-full max-w-full rounded-lg shadow-2xl object-contain border-4 border-white" />
                 <div className="absolute bottom-4 flex gap-4">
                    <button onClick={(e) => { e.stopPropagation(); downloadPhoto(selectedPhoto) }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 font-medium"><Download size={18}/> Save Photo</button>
                    <button onClick={(e) => { e.stopPropagation(); deletePhoto(selectedPhoto) }} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 font-medium"><Trash2 size={18}/> Delete</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}