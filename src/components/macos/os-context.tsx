// components/macos/os-context.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { AppConfig, OsContextState, WindowState, Notification, WWLaunchMode } from './types'

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

  const [brightness, setBrightness] = useState(100)
  const [volume, setVolume] = useState(80)

  // 新增：鸣潮相关状态
  const [wwLaunchMode, setWwLaunchModeState] = useState<WWLaunchMode>(null)
  const [isGameModeSelectorOpen, setIsGameModeSelectorOpen] = useState(false)

  // 初始化加载设置
  useEffect(() => {
    const savedMode = localStorage.getItem('ww-launch-mode') as WWLaunchMode
    if (savedMode === 'cloud' || savedMode === 'local') {
      setWwLaunchModeState(savedMode)
    }
  }, [])

  const setWwLaunchMode = (mode: WWLaunchMode) => {
    setWwLaunchModeState(mode)
    if (mode) localStorage.setItem('ww-launch-mode', mode)
    else localStorage.removeItem('ww-launch-mode')
  }

  const openGameModeSelector = useCallback(() => setIsGameModeSelectorOpen(true), [])
  const closeGameModeSelector = useCallback(() => setIsGameModeSelectorOpen(false), [])

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

  // 修改：launchApp 支持 props
  const launchApp = useCallback((app: AppConfig, props?: any) => {
    setIsLaunchpadOpen(false)
    setIsControlCenterOpen(false)
    setIsSpotlightOpen(false)
    setRegistry((prev) => { if (prev.find(a => a.id === app.id)) return prev; return [...prev, app] })
    setWindows((prev) => {
      // 如果已存在，更新 props 并前置
      const existing = prev.find((w) => w.appId === app.id)
      if (existing) {
        return prev.map(w => w.id === existing.id ? { 
            ...w, 
            isMinimized: false, 
            zIndex: getTopZIndex() + 1,
            props: props || w.props // 更新 props
        } : w)
      }
      return [...prev, {
        id: app.id, appId: app.id, title: app.title, isMinimized: false, isMaximized: false,
        zIndex: getTopZIndex() + 1,
        position: { x: 100 + (prev.length % 5) * 30, y: 80 + (prev.length % 5) * 30 }, 
        size: { width: app.width || 800, height: app.height || 600 },
        props: props
      }]
    })
    setTimeout(() => setActiveWindowId(app.id), 0)
  }, [getTopZIndex])

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

  const bringToFront = useCallback((id: string) => focusWindow(id), [focusWindow])
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
        isMenuOpen: false, isLaunchpadOpen, isControlCenterOpen, isLocked, isSpotlightOpen, notifications,
        brightness, volume, setBrightness, setVolume,
        
        // 传递新状态
        wwLaunchMode, setWwLaunchMode, 
        isGameModeSelectorOpen, openGameModeSelector, closeGameModeSelector,

        launchApp, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, bringToFront, resizeWindow, updateWindowPos,
        toggleLaunchpad, toggleControlCenter, setIsLocked, toggleSpotlight, addNotification, removeNotification
    }}>
      {children}
    </OsContext.Provider>
  )
}