// components/macos/control-center.tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wifi, Bluetooth, Sun, Volume2, Moon, Cast, Music } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'
import { clsx } from './utils'

export const ControlCenter = () => {
  const { isControlCenterOpen, toggleControlCenter, brightness, setBrightness, volume, setVolume } = useOs()
  const { t } = useI18n()
  
  // Local States for toggles
  const [wifi, setWifi] = useState(true)
  const [bt, setBt] = useState(true)
  const [dnd, setDnd] = useState(false)
  const [mirror, setMirror] = useState(false)

  return (
    <AnimatePresence>
      {isControlCenterOpen && (
        <>
          <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => toggleControlCenter(false)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-9 right-2 z-[9999] w-80 bg-white/70 dark:bg-[#1e1e1e]/70 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl p-3 flex flex-col gap-3 text-black dark:text-white select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Grid */}
            <div className="grid grid-cols-2 gap-3 h-24">
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-2.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setWifi(!wifi)}
                    className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer text-white", wifi ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600")}
                  >
                    <Wifi size={16} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-xs font-medium">{t('wifi')}</span>
                     <span className="text-[10px] text-gray-500 dark:text-gray-400">{wifi ? 'Home' : 'Off'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setBt(!bt)}
                    className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer text-white", bt ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600")}
                  >
                    <Bluetooth size={16} />
                  </div>
                   <div className="flex flex-col">
                     <span className="text-xs font-medium">{t('bluetooth')}</span>
                     <span className="text-[10px] text-gray-500 dark:text-gray-400">{bt ? 'On' : 'Off'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div 
                    onClick={() => setDnd(!dnd)}
                    className={clsx("rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all cursor-pointer", dnd ? "bg-indigo-500 text-white" : "bg-white/50 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30")}
                 >
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", dnd ? "text-white bg-white/20" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>
                        <Moon size={16} fill={dnd ? "currentColor" : "none"} />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{t('dnd')}</span>
                 </div>
                 <div 
                    onClick={() => setMirror(!mirror)}
                    className={clsx("rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all cursor-pointer", mirror ? "bg-green-500 text-white" : "bg-white/50 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30")}
                 >
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", mirror ? "text-white bg-white/20" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>
                        <Cast size={16} />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{t('display')}</span>
                 </div>
              </div>
            </div>

            {/* Sliders with Real Functionality */}
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 shadow-sm">
              <div className="text-[10px] font-medium mb-2 pl-1">{t('display')}</div>
              <div className="relative h-7 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex items-center group cursor-ew-resize">
                 <div className="absolute left-2 text-gray-500 z-10 pointer-events-none"><Sun size={14} /></div>
                 <input 
                    type="range" 
                    min="30" max="100" 
                    value={brightness} 
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 />
                 <div className="h-full bg-white w-full shadow-sm rounded-full pointer-events-none transition-all origin-left" style={{ transform: `scaleX(${brightness / 100})` }} />
              </div>
            </div>

            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 shadow-sm">
              <div className="text-[10px] font-medium mb-2 pl-1">{t('sound')}</div>
               <div className="relative h-7 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex items-center group cursor-ew-resize">
                 <div className="absolute left-2 text-gray-500 z-10 pointer-events-none"><Volume2 size={14} /></div>
                 <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume} 
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 />
                 <div className="h-full bg-white w-full shadow-sm rounded-full pointer-events-none transition-all origin-left" style={{ transform: `scaleX(${volume / 100})` }} />
              </div>
            </div>

            {/* Music */}
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 shadow-sm flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
                    <Music size={20} />
                 </div>
                 <div className="flex-1">
                    <div className="text-xs font-medium">{t('not_playing')}</div>
                    <div className="text-[10px] text-gray-500">{t('music_playing')}</div>
                 </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}