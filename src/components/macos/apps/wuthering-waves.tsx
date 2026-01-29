'use client'

import React, { useState, useRef } from 'react'
import { RotateCw, ExternalLink, Maximize } from 'lucide-react'

export const WutheringWavesLauncher = () => {
  const [key, setKey] = useState(0) // 用于刷新 Iframe
  const containerRef = useRef<HTMLDivElement>(null) // 引用游戏容器

  // 调用浏览器原生全屏 API
  const handleRealFullScreen = () => {
    if (containerRef.current) {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-black text-white group">
      
      {/* 顶部工具栏：全屏时会自动被浏览器遮挡，因为我们全屏的是下方的 container */}
      <div className="h-8 shrink-0 flex items-center justify-between px-3 bg-[#1a1a1a] border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Wuthering Waves Cloud</span>
            <span className="text-[10px] bg-yellow-600/30 text-yellow-500 px-1.5 rounded border border-yellow-600/50">BETA</span>
        </div>
        <div className="flex gap-3 text-gray-400">
           <button 
             onClick={() => setKey(k => k + 1)} 
             title="Refresh Game" 
             className="hover:text-white transition-colors"
           >
              <RotateCw size={14} />
           </button>
           <a 
             href="https://mc.kurogames.com/cloud/index.html" 
             target="_blank" 
             rel="noopener noreferrer" 
             title="Open in Browser" 
             className="hover:text-white transition-colors"
           >
              <ExternalLink size={14} />
           </a>
           <div className="w-[1px] h-3 bg-white/20 self-center mx-1" />
           <button 
             onClick={handleRealFullScreen} 
             title="Enter Real Full Screen (Press Esc to exit)" 
             className="hover:text-white transition-colors flex items-center gap-1 text-xs font-bold text-blue-400"
           >
              <Maximize size={14} />
              <span>FULL SCREEN</span>
           </button>
        </div>
      </div>

      {/* 游戏主体容器：全屏 API 将作用于此元素 */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black w-full h-full">
        <iframe
            key={key}
            src="https://mc.kurogames.com/cloud/index.html"
            className="w-full h-full border-none block"
            // 允许全屏、手柄、音频等关键权限
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera; midi; geolocation; gamepad; display-capture"
            title="Wuthering Waves Cloud"
        />
      </div>
    </div>
  )
}