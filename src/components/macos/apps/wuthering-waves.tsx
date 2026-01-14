'use client'

import React, { useState } from 'react'
import { RotateCw, ExternalLink, HardDrive, Gamepad2 } from 'lucide-react'
import { useOs } from '../os-context'
import { WWLaunchMode } from '../types'

export const WutheringWavesLauncher = ({ mode }: { mode?: WWLaunchMode }) => {
  const { wwLaunchMode } = useOs()
  const currentMode = mode || wwLaunchMode || 'cloud' // 优先使用传入的 props，否则使用全局设置
  const [key, setKey] = useState(0)

  // --- 本地启动模式（模拟） ---
  if (currentMode === 'local') {
      return (
          <div className="flex flex-col h-full w-full bg-black text-white items-center justify-center relative overflow-hidden font-mono">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1627856014759-0852292467c9?q=80&w=2670')] bg-cover opacity-20" />
              <div className="z-10 flex flex-col items-center gap-4 p-8 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                  <div className="w-16 h-16 bg-yellow-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-yellow-400/20">
                      <Gamepad2 size={32} />
                  </div>
                  <div className="text-center space-y-1">
                      <h2 className="text-xl font-bold">Starting Local Game...</h2>
                      <p className="text-xs text-gray-400">Executing "Wuthering Waves.exe"</p>
                  </div>
                  <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden mt-4">
                      <div className="h-full bg-yellow-400 animate-[progress_2s_ease-in-out_infinite]" style={{width: '50%'}} />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2">
                      (Simulation: Browsers cannot run local EXEs directly)
                  </div>
              </div>
          </div>
      )
  }

  // --- 云端启动模式 ---
  return (
    <div className="flex flex-col h-full w-full bg-black text-white">
      <div className="h-8 shrink-0 flex items-center justify-between px-3 bg-[#1a1a1a] border-b border-white/10">
        <span className="text-xs font-medium text-gray-400">Wuthering Waves Cloud</span>
        <div className="flex gap-3 text-gray-400">
           <button onClick={() => setKey(k => k + 1)} title="Refresh Game" className="hover:text-white transition-colors">
              <RotateCw size={14} />
           </button>
           <a href="https://mc.kurogames.com/cloud/index.html" target="_blank" rel="noopener noreferrer" title="Open in Browser" className="hover:text-white transition-colors">
              <ExternalLink size={14} />
           </a>
        </div>
      </div>
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