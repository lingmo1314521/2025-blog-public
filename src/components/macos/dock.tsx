'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'motion/react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context' // 引入
import { AppConfig } from './types'

function DockItem({ app, mouseX }: { app: AppConfig; mouseX: MotionValue }) {
  const { launchApp, toggleLaunchpad, windows } = useOs()
  const { t } = useI18n() // 获取 t
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 80, 48])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })
  const isOpen = windows.some((w) => w.appId === app.id)
  
  const handleClick = () => { app.id === 'launchpad' ? toggleLaunchpad() : launchApp(app) }

  return (
    <div className="flex flex-col items-center gap-1 group/item relative">
        {/* Tooltip: 使用 t(app.id) 翻译 */}
        <div className="absolute -top-10 px-3 py-1 bg-gray-500/50 backdrop-blur-md rounded-md text-white text-xs opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t(app.id)}
        </div>
        
        <motion.button ref={ref} style={{ width, height: width }} onClick={handleClick} whileTap={{ scale: 0.85 }} className="rounded-xl bg-white/10 shadow-lg flex items-center justify-center overflow-hidden relative transition-all duration-200 ease-out border border-white/10 hover:bg-white/20">
          <div className="w-full h-full p-1.5 pointer-events-none">{app.icon}</div>
        </motion.button>
        <div className={`w-1 h-1 rounded-full bg-white transition-opacity duration-300 ${(isOpen && app.id !== 'launchpad') ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

export const Dock = () => {
  const { dockItems, windows } = useOs()
  const mouseX = useMotionValue(Infinity)
  const hasMaximizedWindow = windows.some(w => w.isMaximized)

  return (
    <div className={`fixed bottom-0 left-0 w-full h-24 flex items-end justify-center pb-4 transition-all duration-300 group/dock ${hasMaximizedWindow ? 'z-0 hover:z-[100000]' : 'z-[9999]'}`}>
      <div className="px-4 pb-2 pt-3 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl border border-white/10 flex items-end gap-3 shadow-2xl transition-transform duration-300 will-change-transform" onMouseMove={(e) => mouseX.set(e.pageX)} onMouseLeave={() => mouseX.set(Infinity)}>
        {dockItems.map((app) => <DockItem key={app.id} app={app} mouseX={mouseX} />)}
      </div>
    </div>
  )
}