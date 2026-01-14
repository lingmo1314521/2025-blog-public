'use client'

import React, { useState } from 'react'
import { RotateCw, ExternalLink } from 'lucide-react'

export const WutheringWavesLauncher = () => {
  const [key, setKey] = useState(0) // 用于刷新 Iframe

  return (
    <div className="flex flex-col h-full w-full bg-black text-white">
      {/* 顶部极简工具栏：提供刷新和外链打开功能，防止卡死 */}
      <div className="h-8 shrink-0 flex items-center justify-between px-3 bg-[#1a1a1a] border-b border-white/10">
        <span className="text-xs font-medium text-gray-400">Wuthering Waves Cloud</span>
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
        </div>
      </div>

      {/* 游戏主体 */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
            key={key}
            src="https://mc.kurogames.com/cloud/index.html"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera; midi; geolocation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
            title="Wuthering Waves Cloud"
        />
      </div>
    </div>
  )
}