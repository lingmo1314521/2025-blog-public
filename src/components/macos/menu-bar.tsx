'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Wifi, Battery, Search, Apple, Command, Power, Lock, LogOut } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'
import { formatTime, clsx } from './utils'

// === 类型定义 ===
interface MenuItemConfig {
  label: string
  shortcut?: string // 例如 "Cmd+Q"
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  danger?: boolean
}

interface MenuColumn {
  id: string
  label: React.ReactNode // 支持文字或图标
  items: MenuItemConfig[]
  bold?: boolean
}

// === 子组件：下拉菜单 ===
const MenuDropdown = ({ label, items, isOpen, onOpen, onClose, bold }: { 
  label: React.ReactNode
  items: MenuItemConfig[]
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  bold?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <div ref={ref} className="relative h-full flex items-center">
      <div 
        className={clsx(
          "px-3 h-7 flex items-center rounded transition-colors cursor-default select-none mx-0.5",
          isOpen ? "bg-white/20 text-white" : "hover:bg-white/10",
          bold && "font-bold"
        )}
        onMouseDown={(e) => { e.stopPropagation(); isOpen ? onClose() : onOpen() }}
        onMouseEnter={() => { if (isOpen) onOpen() }} 
      >
        <span className="text-[13px] leading-none tracking-wide flex items-center">{label}</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white/95 dark:bg-[#2c2c2c]/95 backdrop-blur-xl rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-black/5 dark:border-white/10 py-1.5 z-[99999] flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {items.map((item, i) => {
            if (item.divider) return <div key={i} className="h-[1px] bg-black/10 dark:bg-white/10 my-1 mx-2" />
            
            return (
              <div 
                key={i} 
                onClick={(e) => {
                  e.stopPropagation()
                  if (!item.disabled) {
                    item.onClick?.()
                    onClose()
                  }
                }}
                className={clsx(
                  "px-3 py-1 mx-1 rounded flex items-center justify-between group transition-colors",
                  item.disabled 
                    ? "opacity-40 cursor-default" 
                    : "cursor-pointer hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100"
                )}
              >
                <span className={clsx("text-[13px] truncate pr-4", item.danger && !item.disabled && "text-red-500 group-hover:text-white")}>
                    {item.label}
                </span>
                {item.shortcut && (
                   <span className="text-[10px] opacity-50 font-sans tracking-widest flex items-center gap-0.5 min-w-[40px] justify-end">
                      {formatShortcut(item.shortcut)}
                   </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 辅助：美化快捷键显示
const formatShortcut = (s: string) => {
    return s.replace('Cmd', '⌘')
            .replace('Shift', '⇧')
            .replace('Ctrl', '⌃')
            .replace('Opt', '⌥')
            .replace('Fn', 'fn')
            .replace('+', '')
}

export const MenuBar = () => {
  const { 
    activeWindowId, dockItems, 
    toggleControlCenter, setIsLocked, toggleSpotlight, launchApp,
    closeWindow, minimizeWindow, maximizeWindow
  } = useOs()
  
  const { t } = useI18n()
  
  const [date, setDate] = useState<Date | null>(null)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // 获取当前激活 APP 信息
  const activeApp = dockItems.find(app => app.id === activeWindowId) || dockItems.find(app => app.id === 'finder')
  const appTitle = activeApp ? t(activeApp.id) : t('finder') // 使用翻译后的名字

  useEffect(() => {
    setDate(new Date())
    const timer = setInterval(() => setDate(new Date()), 1000)

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then(batt => {
        setBatteryLevel(Math.round(batt.level * 100))
        batt.addEventListener('levelchange', () => setBatteryLevel(Math.round(batt.level * 100)))
      })
    }
    return () => clearInterval(timer)
  }, [])

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e))
      setIsFullScreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  // === 动态生成菜单结构 (useMemo 确保语言切换时更新) ===
  const MENUS: MenuColumn[] = useMemo(() => [
    {
      id: 'apple',
      label: <Apple size={15} fill="currentColor" className="-mt-0.5" />, 
      items: [
        { label: t('about_mac'), onClick: () => launchApp(dockItems.find(a => a.id === 'about')!) },
        { divider: true, label: '' },
        { label: t('sys_settings'), onClick: () => launchApp(dockItems.find(a => a.id === 'settings')!) },
        { divider: true, label: '' },
        { label: t('sleep'), onClick: () => setIsLocked(true) },
        { label: t('restart'), onClick: () => window.location.reload() },
        { label: t('shutdown'), onClick: () => window.location.reload() },
        { divider: true, label: '' },
        { label: t('lock_screen'), shortcut: 'Cmd+Ctrl+Q', onClick: () => setIsLocked(true) },
        { label: t('log_out'), shortcut: 'Cmd+Shift+Q', onClick: () => window.location.reload(), danger: true },
      ]
    },
    {
      id: 'app',
      label: appTitle,
      bold: true,
      items: [
        { label: `${t('about_app')} ${appTitle}`, onClick: () => alert(`${appTitle} v1.0`) },
        { divider: true, label: '' },
        { label: t('settings'), shortcut: 'Cmd+,', onClick: () => launchApp(dockItems.find(a => a.id === 'settings')!) },
        { divider: true, label: '' },
        { label: `${t('hide_app')} ${appTitle}`, shortcut: 'Cmd+H', onClick: () => activeWindowId && minimizeWindow(activeWindowId) },
        { label: t('hide_others'), shortcut: 'Opt+Cmd+H', disabled: true },
        { label: t('show_all'), disabled: true },
        { divider: true, label: '' },
        { label: `${t('quit_app')} ${appTitle}`, shortcut: 'Cmd+Q', onClick: () => activeWindowId && closeWindow(activeWindowId), danger: true },
      ]
    },
    {
      id: 'file',
      label: t('file'),
      items: [
        { label: t('new_window'), shortcut: 'Cmd+N', onClick: () => activeWindowId && launchApp(dockItems.find(a => a.id === activeWindowId)!) },
        { label: t('new_folder'), shortcut: 'Shift+Cmd+N', disabled: true },
        { label: t('open'), shortcut: 'Cmd+O', disabled: true },
        { divider: true, label: '' },
        { label: t('close_window'), shortcut: 'Cmd+W', onClick: () => activeWindowId && closeWindow(activeWindowId) },
      ]
    },
    {
      id: 'edit',
      label: t('edit'),
      items: [
        { label: t('undo'), shortcut: 'Cmd+Z', disabled: true },
        { label: t('redo'), shortcut: 'Shift+Cmd+Z', disabled: true },
        { divider: true, label: '' },
        { label: t('cut'), shortcut: 'Cmd+X', disabled: true },
        { label: t('copy'), shortcut: 'Cmd+C', disabled: true },
        { label: t('paste'), shortcut: 'Cmd+V', disabled: true },
        { label: t('select_all'), shortcut: 'Cmd+A', disabled: true },
      ]
    },
    {
      id: 'view',
      label: t('view'),
      items: [
        { label: isFullScreen ? t('exit_fullscreen') : t('enter_fullscreen'), shortcut: 'Fn+F', onClick: toggleFullScreen },
        { divider: true, label: '' },
        { label: t('actual_size'), disabled: true },
        { label: t('zoom_in'), disabled: true },
        { label: t('zoom_out'), disabled: true },
      ]
    },
    {
      id: 'window',
      label: t('window'),
      items: [
        { label: t('minimize'), shortcut: 'Cmd+M', onClick: () => activeWindowId && minimizeWindow(activeWindowId) },
        { label: t('zoom'), onClick: () => activeWindowId && maximizeWindow(activeWindowId) },
        { divider: true, label: '' },
        { label: t('bring_all_front'), disabled: true },
      ]
    },
    {
      id: 'help',
      label: t('help'),
      items: [
        { label: t('search_help'), shortcut: 'Cmd+?', onClick: () => toggleSpotlight() },
        { divider: true, label: '' },
        { label: t('get_help'), disabled: true },
      ]
    }
  ], [t, appTitle, activeWindowId, activeApp, dockItems, isFullScreen, launchApp, setIsLocked, minimizeWindow, closeWindow, maximizeWindow, toggleSpotlight])

  return (
    <div className="h-8 w-full bg-white/40 dark:bg-[#1e1e1e]/50 backdrop-blur-xl border-b border-black/5 dark:border-white/5 absolute top-0 left-0 z-[9999] flex items-center justify-between px-2 text-black dark:text-white select-none transition-colors">
      
      {/* 左侧菜单 */}
      <div className="flex items-center h-full px-1">
        {MENUS.map((menu, idx) => (
          <MenuDropdown 
            key={menu.id}
            label={menu.label} 
            items={menu.items} 
            bold={menu.bold}
            isOpen={openMenuIndex === idx}
            onOpen={() => setOpenMenuIndex(idx)}
            onClose={() => setOpenMenuIndex(null)}
          />
        ))}
      </div>

      {/* 右侧状态栏 */}
      <div className="flex items-center gap-2 text-xs font-medium px-2">
        <div className="hidden sm:flex items-center gap-2 opacity-90">
             <div className="hover:bg-white/20 p-1.5 rounded transition-colors cursor-default" title={`Battery: ${batteryLevel}%`}>
                <Battery size={18} className={batteryLevel < 20 ? "text-red-500" : ""} />
             </div>
             <div className="hover:bg-white/20 p-1.5 rounded transition-colors cursor-default" title={t('wifi')}>
                <Wifi size={16} />
             </div>
             <div className="hover:bg-white/20 p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSpotlight()} title={t('search')}>
                <Search size={15} />
             </div>
        </div>
        
        {/* 控制中心 Toggle */}
        <div 
            className="hover:bg-white/20 px-2 py-1 rounded transition-colors cursor-default flex items-center gap-2"
            title={t('control_center')}
            onClick={(e) => {
                e.stopPropagation()
                toggleControlCenter()
            }}
        >
            <div className="flex gap-[2px] pointer-events-none opacity-80">
                <div className="w-3.5 h-1.5 border-[1.5px] border-current rounded-sm"></div>
                <div className="w-3.5 h-1.5 border-[1.5px] border-current rounded-sm bg-current"></div>
            </div>
        </div>

        {/* 日期时间 */}
        <div 
          className="hover:bg-white/20 px-3 py-1 rounded transition-colors cursor-default whitespace-nowrap min-w-[70px] text-center font-semibold" 
          onClick={() => launchApp(dockItems.find(a => a.id === 'calendar')!)}
        >
          {date ? formatTime(date) : ''}
        </div>
      </div>
    </div>
  )
}