'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { AppConfig, OsContextState, WindowState, Notification } from './types'

const OsContext = createContext<OsContextState | null>(null)

export const useOs = () => {
  const context = useContext(OsContext)
  if (!context) throw new Error('useOs must be used within an OsProvider')
  return context
}

interface OsProviderProps {
  children: ReactNode
  installedApps: AppConfig[]
}

export const OsProvider = ({ children, installedApps }: OsProviderProps) => {
  const [windows, setWindows] = useState<WindowState[]>([])
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [registry, setRegistry] = useState<AppConfig[]>(installedApps)
  
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false)
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // 全局系统设置
  const [brightness, setBrightness] = useState(100)
  const [volume, setVolume] = useState(80)

  // 亮度效果实现
  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`
  }, [brightness])

  const getTopZIndex = useCallback(() => {
    if (windows.length === 0) return 10
    return Math.max(...windows.map((w) => w.zIndex))
  }, [windows])

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id)
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, zIndex: getTopZIndex() + 1, isMinimized: false } : w))
    setIsControlCenterOpen(false)
    setIsSpotlightOpen(false)
  }, [getTopZIndex])

  const launchApp = useCallback((appPayload: AppConfig | Partial<AppConfig>) => {
    setIsLaunchpadOpen(false)
    setIsControlCenterOpen(false)
    setIsSpotlightOpen(false)

    // 查找是否是已安装 App
    const baseApp = registry.find(a => a.id === appPayload.id) || installedApps.find(a => a.id === appPayload.id)
    
    // 如果没有找到 baseApp，但 payload 里有 component (例如打开文件)，则视为临时 App
    if (!baseApp && !appPayload.component) {
        console.warn('App not found:', appPayload.id)
        return
    }

    const finalApp = { ...baseApp, ...appPayload } as AppConfig

    setRegistry((prev) => { if (prev.find(a => a.id === finalApp.id)) return prev; return [...prev, finalApp] })
    
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === finalApp.id)
      if (existing) {
        return prev.map(w => w.id === existing.id ? { ...w, isMinimized: false, zIndex: getTopZIndex() + 1 } : w)
      }
      return [...prev, {
        id: finalApp.id, 
        appId: finalApp.id, 
        title: finalApp.title, 
        isMinimized: false, 
        isMaximized: false,
        zIndex: getTopZIndex() + 1,
        position: { x: 100 + (prev.length % 5) * 30, y: 80 + (prev.length % 5) * 30 }, 
        size: { width: finalApp.width || 800, height: finalApp.height || 600 },
      }]
    })
    setTimeout(() => setActiveWindowId(finalApp.id), 0)
  }, [getTopZIndex, registry, installedApps])

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
    if (activeWindowId === id) setActiveWindowId(null)
  }, [activeWindowId])

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)))
    if (activeWindowId === id) setActiveWindowId(null)
  }, [activeWindowId])

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMaximized: true, lastPosition: w.position, lastSize: w.size, position: { x: 0, y: 0 } } : w))
    focusWindow(id)
  }, [focusWindow])

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMaximized: false, position: w.lastPosition || { x: 100, y: 100 }, size: w.lastSize || { width: 800, height: 600 } } : w))
    focusWindow(id)
  }, [focusWindow])

  const resizeWindow = useCallback((id: string, w: number, h: number) => {
    setWindows((prev) => prev.map((win) => win.id === id ? { ...win, size: { width: Math.max(300, w), height: Math.max(200, h) } } : win))
  }, [])

  const updateWindowPos = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, position: { x, y } } : w))
  }, [])

  const toggleLaunchpad = useCallback((v?: boolean) => setIsLaunchpadOpen(p => v ?? !p), [])
  const toggleControlCenter = useCallback((v?: boolean) => setIsControlCenterOpen(p => v ?? !p), [])
  const toggleSpotlight = useCallback((v?: boolean) => setIsSpotlightOpen(p => v ?? !p), [])
  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Date.now().toString(); setNotifications(p => [...p, { ...n, id }])
    setTimeout(() => setNotifications(p => p.filter(x => x.id !== id)), 4000)
  }, [])
  const removeNotification = useCallback((id: string) => setNotifications(p => p.filter(n => n.id !== id)), [])

  useEffect(() => {
    const hk = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggleSpotlight() } }
    window.addEventListener('keydown', hk); return () => window.removeEventListener('keydown', hk)
  }, [toggleSpotlight])

  return (
    <OsContext.Provider value={{
        windows, activeWindowId, 
        dockItems: installedApps,
        registry,
        isLaunchpadOpen, isControlCenterOpen, isLocked, isSpotlightOpen, notifications,
        brightness, volume, setBrightness, setVolume,
        launchApp, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, resizeWindow, updateWindowPos,
        toggleLaunchpad, toggleControlCenter, setIsLocked, toggleSpotlight, addNotification, removeNotification
    }}>
      {children}
    </OsContext.Provider>
  )
}