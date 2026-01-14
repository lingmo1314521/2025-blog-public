// components/macos/types.ts
import { ReactNode } from 'react'

export type AppID = 'finder' | 'launchpad' | 'blog' | 'settings' | 'about' | 'github' | 'mail' | 'terminal' | 'calculator' | 'calendar' | 'music' | 'notes' | 'vscode' | 'safari' | string

export interface AppConfig {
  id: AppID
  title: string
  icon: ReactNode
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  component: ReactNode
  resizable?: boolean
  maximizable?: boolean
}

export interface WindowState {
  id: string
  appId: AppID
  title: string
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  lastSize?: { width: number; height: number }
  lastPosition?: { x: number; y: number }
}

export interface Notification {
  id: string
  title: string
  message: string
  icon?: ReactNode
  type?: 'info' | 'success' | 'warning'
}

export interface OsContextState {
  windows: WindowState[]
  activeWindowId: string | null
  dockItems: AppConfig[]
  registry: AppConfig[]
  
  // 系统状态
  isMenuOpen: boolean
  isLaunchpadOpen: boolean
  isControlCenterOpen: boolean
  isLocked: boolean
  isSpotlightOpen: boolean
  
  // 新增：全局系统设置状态
  brightness: number
  volume: number
  setBrightness: (val: number) => void
  setVolume: (val: number) => void

  notifications: Notification[]

  launchApp: (app: AppConfig) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  focusWindow: (id: string) => void
  bringToFront: (id: string) => void
  resizeWindow: (id: string, width: number, height: number) => void
  updateWindowPos: (id: string, x: number, y: number) => void
  
  toggleLaunchpad: (isOpen?: boolean) => void
  toggleControlCenter: (isOpen?: boolean) => void
  setIsLocked: (isLocked: boolean) => void
  toggleSpotlight: (isOpen?: boolean) => void
  
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}