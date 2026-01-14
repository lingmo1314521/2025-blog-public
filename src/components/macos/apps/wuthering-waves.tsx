'use client'

import React, { useState, useRef, useEffect } from 'react'
import { RotateCw, ExternalLink, Maximize, Minimize, MousePointerClick } from 'lucide-react'
import { clsx } from '../utils'

export const WutheringWavesLauncher = () => {
  const [key, setKey] = useState(0) // 用于刷新 Iframe
  const [isImmersive, setIsImmersive] = useState(false) // 沉浸模式状态
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 尝试自动聚焦 iframe 以激活键盘控制
  useEffect(() => {
    const timer = setTimeout(() => {
        iframeRef.current?.focus()
    }, 2000)
    return () => clearTimeout(timer)
  }, [key])

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive)
  }

  return (
    <div className="flex flex-col h-full w-full bg-black text-white relative group">
      
      {/* 顶部工具栏：沉浸模式下隐藏，但保留占位防止布局跳动，或完全移除 */}
      {!isImmersive && (
        <div className="h-8 shrink-0 flex items-center justify-between px-3 bg-[#1a1a1a] border-b border-white/10 select-none">
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Wuthering Waves Cloud</span>
                <span className="text-[10px] bg-yellow-600/30 text-yellow-500 px-1.5 rounded border border-yellow-600/50">BETA</span>
            </div>
            <div className="flex gap-3 text-gray-400">
            <button 
                onClick={() => { setKey(k => k + 1); setIsImmersive(false); }} 
                title="Refresh Game" 
                className="hover:text-white transition-colors"
            >
                <RotateCw size={14} />
            </button>
            <a 
                href="https://mc.kurogames.com/cloud/index.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Open in Browser (Best Performance)" 
                className="hover:text-white transition-colors"
            >
                <ExternalLink size={14} />
            </a>
            <div className="w-[1px] h-3 bg-white/20 self-center mx-1" />
            <button 
                onClick={toggleImmersive} 
                title="Enter Immersive Mode" 
                className="hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
                <Maximize size={14} />
                <span>Full Screen</span>
            </button>
            </div>
        </div>
      )}

      {/* 沉浸模式下的悬浮退出按钮 (鼠标悬停在顶部时显示) */}
      {isImmersive && (
        <div className="absolute top-0 left-0 w-full h-8 z-50 opacity-0 hover:opacity-100 transition-opacity flex justify-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <button 
                onClick={toggleImmersive}
                className="mt-1 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 pointer-events-auto transition-all shadow-lg"
            >
                <Minimize size={12} />
                Exit Full Screen
            </button>
        </div>
      )}

      {/* 游戏主体 */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <iframe
            ref={iframeRef}
            key={key}
            src="https://mc.kurogames.com/cloud/index.html"
            className="w-full h-full border-none block"
            // === 关键修复 ===
            // 1. 移除了 sandbox 属性：这解决了大多数云游戏无法捕获鼠标/键盘的问题
            // 2. 增加了 gamepad 权限：允许使用手柄
            // 3. 保留了其他必要的全屏和媒体权限
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera; midi; geolocation; gamepad; display-capture"
            title="Wuthering Waves Cloud"
        />
        
        {/* 点击遮罩：如果 iframe 失去焦点，提示用户点击 */}
        {/* 注意：由于跨域限制，很难精确检测 iframe 内部焦点，这里仅做初始化时的引导，或者你可以根据需求移除 */}
      </div>
    </div>
  )
}