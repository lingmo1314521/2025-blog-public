'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, MotionValue, AnimatePresence } from 'motion/react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'
import { AppConfig } from './types'

// 基础尺寸配置
const BASE_WIDTH = 50
const DISTANCE_LIMIT = 200
const MAGNIFICATION = 1.6

function DockItem({ app, mouseX }: { app: AppConfig; mouseX: MotionValue }) {
  const { launchApp, toggleLaunchpad, windows, activeWindowId, minimizeWindow, focusWindow } = useOs()
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-DISTANCE_LIMIT, 0, DISTANCE_LIMIT], [BASE_WIDTH, BASE_WIDTH * MAGNIFICATION, BASE_WIDTH])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  const isOpen = windows.some((w) => w.appId === app.id)
  const isMinimized = windows.find(w => w.appId === app.id)?.isMinimized

  const handleClick = () => {
    if (app.id === 'launchpad') { toggleLaunchpad(); return }
    if (isOpen) {
      if (isMinimized) { const win = windows.find(w => w.appId === app.id); if (win) launchApp(app) } 
      else { const win = windows.find(w => w.appId === app.id); if (win) focusWindow(win.id) }
    } else { launchApp(app) }
  }

  return (
    <div className="flex flex-col items-center gap-1 group/item relative pb-2">
        <div className="absolute -top-14 px-3 py-1.5 bg-gray-900/80 dark:bg-gray-100/90 backdrop-blur-xl rounded-lg text-white dark:text-black text-xs font-semibold opacity-0 group-hover/item:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-white/10 scale-95 group-hover/item:scale-100 translate-y-2 group-hover/item:translate-y-0 z-50">
            {t(app.id)}
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900/80 dark:border-t-gray-100/90"></div>
        </div>
        
        <motion.button 
          ref={ref} 
          style={{ width, height: width }} 
          onClick={handleClick} 
          whileTap={{ scale: 0.85, translateY: 10 }} 
          className="rounded-2xl flex items-center justify-center relative transition-all duration-200 ease-out"
        >
          <div className="w-full h-full p-[2px] pointer-events-none filter drop-shadow-xl group-hover/item:brightness-110 transition-all">
             {app.icon}
          </div>
        </motion.button>

        <div className={`w-1 h-1 rounded-full bg-gray-800/80 dark:bg-white/90 shadow-sm transition-all duration-300 absolute bottom-1 ${ (isOpen && app.id !== 'launchpad') ? 'opacity-100 scale-100' : 'opacity-0 scale-0' }`} />
    </div>
  )
}

export const Dock = () => {
  const { dockItems } = useOs()
  const mouseX = useMotionValue(Infinity)

  return (
    <div className="fixed bottom-2 left-0 w-full h-auto flex items-end justify-center z-[9999] pointer-events-none">
      {/* [优化] Dock 容器：高透背景 + 强模糊 + 悬浮阴影 */}
      <div 
        className="px-3 pb-2 pt-3 rounded-3xl bg-white/20 dark:bg-black/20 backdrop-blur-3xl border border-white/10 shadow-2xl flex items-end gap-2 transition-all duration-300 pointer-events-auto hover:bg-white/30 dark:hover:bg-black/30"
        onMouseMove={(e) => mouseX.set(e.pageX)} 
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {dockItems.map((app) => (
          <DockItem key={app.id} app={app} mouseX={mouseX} />
        ))}
      </div>
    </div>
  )
}