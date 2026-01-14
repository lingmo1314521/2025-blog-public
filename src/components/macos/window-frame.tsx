// components/macos/window-frame.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useDragControls, useMotionValue } from 'motion/react'
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'
import { WindowState } from './types'
import { clsx } from './utils'
import { MENU_BAR_HEIGHT } from './constants'

interface WindowFrameProps {
  windowState: WindowState
  children: React.ReactNode
}

export const WindowFrame = ({ windowState, children }: WindowFrameProps) => {
  const { id, title, position, size, zIndex, isMinimized, isMaximized } = windowState
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, resizeWindow, updateWindowPos, registry, dockItems } = useOs()
  const { t } = useI18n()
  
  const appConfig = (registry || dockItems).find(a => a.id === windowState.appId)
  const isResizable = appConfig?.resizable !== false
  const isMaximizable = appConfig?.maximizable !== false

  const dragControls = useDragControls()
  const x = useMotionValue(position.x)
  const y = useMotionValue(position.y)
  const width = useMotionValue(size.width)
  const height = useMotionValue(size.height)
  
  useEffect(() => {
    if (!isMaximized) {
      x.set(position.x)
      y.set(position.y)
      width.set(size.width)
      height.set(size.height)
    }
  }, [position, size, isMaximized, x, y, width, height])

  const [isResizing, setIsResizing] = useState(false)

  const handleResizeStart = (e: React.PointerEvent) => {
    if (!isResizable) return
    e.preventDefault(); e.stopPropagation(); setIsResizing(true); focusWindow(id)
    const startX = e.clientX; const startY = e.clientY
    const startWidth = width.get(); const startHeight = height.get()

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const newWidth = Math.max(appConfig?.minWidth || 300, startWidth + (moveEvent.clientX - startX))
      const newHeight = Math.max(appConfig?.minHeight || 200, startHeight + (moveEvent.clientY - startY))
      width.set(newWidth); height.set(newHeight)
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      resizeWindow(id, width.get(), height.get())
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handleTitleBarDown = (e: React.PointerEvent) => {
    focusWindow(id)
    if (!isMaximizable) { dragControls.start(e); return }

    if (isMaximized) {
      const screenW = window.innerWidth
      const ratioX = e.clientX / screenW

      const checkDragMove = (moveEvent: PointerEvent) => {
        if (Math.abs(moveEvent.clientX - e.clientX) > 5 || Math.abs(moveEvent.clientY - e.clientY) > 5) {
          window.removeEventListener('pointermove', checkDragMove)
          restoreWindow(id)
          const targetW = windowState.lastSize?.width || 800
          const targetX = moveEvent.clientX - (targetW * ratioX)
          const targetY = moveEvent.clientY - 20 
          x.set(targetX); y.set(targetY)
          updateWindowPos(id, targetX, targetY)
          dragControls.start(moveEvent as any)
        }
      }
      const cleanup = () => { window.removeEventListener('pointermove', checkDragMove); window.removeEventListener('pointerup', cleanup) }
      window.addEventListener('pointermove', checkDragMove); window.addEventListener('pointerup', cleanup)
    } else {
      dragControls.start(e)
    }
  }

  const handleDragEnd = () => {
    updateWindowPos(id, x.get(), y.get())
  }

  if (isMinimized) return null

  // 动态标题：如果是博客文章(post-xxx)，显示原标题；否则尝试翻译 AppName
  const displayTitle = windowState.id.startsWith('post-') ? title : t(windowState.appId)

  return (
    <motion.div
      drag={!isResizing}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={handleDragEnd}
      style={{ x, y, width, height, zIndex: isMaximized ? 99999 : zIndex, position: isMaximized ? 'fixed' : 'absolute' }}
      initial={false}
      animate={isMaximized ? { x: 0, y: MENU_BAR_HEIGHT, width: "100%", height: `calc(100vh - ${MENU_BAR_HEIGHT}px)`, borderRadius: 0, transition: { duration: 0.2, ease: "circOut" } } : { borderRadius: 12, transition: { duration: 0.2, ease: "circOut" } }}
      onPointerDown={() => focusWindow(id)}
      className={clsx("flex flex-col overflow-hidden shadow-2xl border border-white/20 will-change-transform bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-2xl", !isMaximized && "rounded-xl")}
    >
      <div className="h-10 flex items-center justify-between px-4 select-none shrink-0" onPointerDown={handleTitleBarDown} onDoubleClick={() => { if (!isMaximizable) return; isMaximized ? restoreWindow(id) : maximizeWindow(id) }}>
        <div className="flex items-center gap-2 group z-50">
          <button onClick={(e) => { e.stopPropagation(); closeWindow(id) }} className="w-3 h-3 rounded-full bg-[#FF5F57] flex items-center justify-center text-black/0 group-hover:text-black/60 border border-black/10 transition-all active:scale-90"><X size={8} strokeWidth={3} /></button>
          <button onClick={(e) => { e.stopPropagation(); minimizeWindow(id) }} className="w-3 h-3 rounded-full bg-[#FEBC2E] flex items-center justify-center text-black/0 group-hover:text-black/60 border border-black/10 transition-all active:scale-90"><Minus size={8} strokeWidth={3} /></button>
          <button onClick={(e) => { if (!isMaximizable) return; e.stopPropagation(); isMaximized ? restoreWindow(id) : maximizeWindow(id) }} className={clsx("w-3 h-3 rounded-full flex items-center justify-center border border-black/10 transition-all", isMaximizable ? "bg-[#28C840] text-black/0 group-hover:text-black/60 active:scale-90 cursor-pointer" : "bg-[#d1d1d1] cursor-default opacity-50")}>{isMaximizable && (isMaximized ? <Minimize2 size={8} strokeWidth={3} /> : <Maximize2 size={6} strokeWidth={3} />)}</button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-medium text-gray-700 dark:text-gray-200 opacity-90">{displayTitle}</div>
      </div>
      <div className={clsx("flex-1 relative overflow-hidden bg-white/50 dark:bg-black/20", isResizing && "pointer-events-none")}>
        {children}
        {windowState.id !== useOs().activeWindowId && <div className="absolute inset-0 z-40 bg-transparent" />}
      </div>
      {!isMaximized && isResizable && <div className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1" onPointerDown={handleResizeStart} />}
    </motion.div>
  )
}