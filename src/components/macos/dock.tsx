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

  // 计算鼠标距离图标中心的距离
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  // 抛物线放大效果
  const widthSync = useTransform(distance, [-DISTANCE_LIMIT, 0, DISTANCE_LIMIT], [BASE_WIDTH, BASE_WIDTH * MAGNIFICATION, BASE_WIDTH])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  // 判断 App 状态
  const isOpen = windows.some((w) => w.appId === app.id)
  const isActive = activeWindowId && windows.find(w => w.id === activeWindowId)?.appId === app.id
  const isMinimized = windows.find(w => w.appId === app.id)?.isMinimized

  const handleClick = () => {
    if (app.id === 'launchpad') {
      toggleLaunchpad()
      return
    }

    if (isOpen) {
      if (isMinimized) {
        // 如果最小化了，还原
        const win = windows.find(w => w.appId === app.id)
        if (win) launchApp(app) // launchApp 内部处理了 restore
      } else if (isActive) {
        // 如果当前已激活，通常 macOS 行为是什么都不做，或者可以做最小化（这里选择不做操作，保持聚焦）
        // 可选：minimizeWindow(activeWindowId)
      } else {
        // 如果在后台，置顶
        const win = windows.find(w => w.appId === app.id)
        if (win) focusWindow(win.id)
      }
    } else {
      // 没打开，则启动
      launchApp(app)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 group/item relative pb-2">
        {/* Tooltip: 鼠标悬停显示名称 */}
        <div className="absolute -top-12 px-3 py-1 bg-gray-800/80 dark:bg-gray-200/80 backdrop-blur-md rounded-md text-white dark:text-black text-xs font-medium opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-20 border border-white/10">
            {t(app.id)}
            {/* 小三角 */}
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-800/80 dark:border-t-gray-200/80"></div>
        </div>
        
        <motion.button 
          ref={ref} 
          style={{ width, height: width }} 
          onClick={handleClick} 
          whileTap={{ scale: 0.85, translateY: 5 }} // 点击下沉效果
          className="rounded-2xl flex items-center justify-center relative transition-all duration-200 ease-out"
        >
          {/* 图标容器 */}
          <div className="w-full h-full p-0.5 pointer-events-none filter drop-shadow-lg group-hover/item:brightness-110 transition-all">
             {app.icon}
          </div>
        </motion.button>

        {/* 活跃状态指示灯 (小白点) */}
        <div 
           className={`w-1 h-1 rounded-full bg-black/60 dark:bg-white/80 transition-all duration-300 absolute bottom-0.5 ${
             (isOpen && app.id !== 'launchpad') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
           }`} 
        />
    </div>
  )
}

export const Dock = () => {
  const { dockItems } = useOs()
  const mouseX = useMotionValue(Infinity)

  return (
    <div className="fixed bottom-0 left-0 w-full h-auto flex items-end justify-center pb-2 z-[9999] pointer-events-none">
      {/* Dock Container */}
      <div 
        className="px-3 pb-1 pt-3 rounded-2xl bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex items-end gap-2 shadow-2xl transition-all duration-300 pointer-events-auto hover:bg-white/50 dark:hover:bg-black/40"
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