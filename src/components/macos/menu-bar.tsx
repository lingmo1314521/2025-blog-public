'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Wifi, Battery, Search, Apple, Volume2, ShieldCheck, PlayCircle } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'
import { formatTime, clsx } from './utils'

// === 类型定义 ===
interface MenuItemConfig {
  label: string
  shortcut?: string 
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  danger?: boolean
}

interface MenuColumn {
  id: string
  label: React.ReactNode 
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
          "px-3 h-7 flex items-center rounded transition-all cursor-default select-none mx-0.5",
          isOpen ? "bg-white/20 text-white shadow-sm" : "hover:bg-white/10",
          bold && "font-bold"
        )}
        onMouseDown={(e) => { e.stopPropagation(); isOpen ? onClose() : onOpen() }}
        onMouseEnter={() => { if (isOpen) onOpen() }} 
      >
        <span className="text-[13px] leading-none tracking-wide flex items-center shadow-black/10 drop-shadow-sm">{label}</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white/70 dark:bg-[#1e1e1e]/70 backdrop-blur-2xl rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/20 py-1.5 z-[99999] flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {items.map((item, i) => {
            if (item.divider) return <div key={i} className="h-[1px] bg-black/5 dark:bg-white/10 my-1 mx-2" />
            
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

const formatShortcut = (s: string) => {
    return s.replace('Cmd', '⌘').replace('Shift', '⇧').replace('Ctrl', '⌃').replace('Opt', '⌥').replace('Fn', 'fn').replace('+', '')
}

const TopAddressBar = () => {
    const { launchApp, windows, updateWindowProps, dockItems } = useOs()
    const [url, setUrl] = useState('')

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && url.trim()) {
            const safariId = 'safari'
            const isOpen = windows.some(w => w.appId === safariId)
            const safariConfig = dockItems.find(a => a.id === safariId)

            if (!safariConfig) return

            if (isOpen) {
                updateWindowProps(safariId, { initialUrl: url })
            } else {
                launchApp(safariConfig, { initialUrl: url })
            }
        }
    }

    return (
        <div className="hidden md:flex items-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded px-3 py-0.5 ml-4 w-64 border border-white/5 focus-within:bg-white/20 focus-within:w-80 transition-all shadow-inner">
            <ShieldCheck size={12} className="text-gray-600 dark:text-gray-300 mr-2 opacity-70" />
            <input 
                className="bg-transparent border-none outline-none text-xs w-full text-black dark:text-white placeholder-gray-500/70 dark:placeholder-gray-400/70 font-medium"
                placeholder="Search"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    )
}

export const MenuBar = () => {
  const { activeWindowId, dockItems, toggleControlCenter, setIsLocked, toggleSpotlight, launchApp, closeWindow, minimizeWindow, maximizeWindow } = useOs()
  const { t } = useI18n()
  const [date, setDate] = useState<Date | null>(null)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const activeApp = dockItems.find(app => app.id === activeWindowId) || dockItems.find(app => app.id === 'finder')
  const appTitle = activeApp ? t(activeApp.id) : t('finder')

  useEffect(() => {
    setDate(new Date())
    const timer = setInterval(() => setDate(new Date()), 1000)
    // Battery logic omitted for brevity
    return () => clearInterval(timer)
  }, [])

  const toggleFullScreen = () => { /* ... */ }

  const MENUS: MenuColumn[] = useMemo(() => [
    {
      id: 'apple',
      label: <Apple size={16} fill="currentColor" className="-mt-0.5 drop-shadow-sm" />, 
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
    // ... File, Edit, View, Window, Help menus (Same as before)
    { id: 'file', label: t('file'), items: [{ label: t('new_window'), shortcut: 'Cmd+N', onClick: () => activeWindowId && launchApp(dockItems.find(a => a.id === activeWindowId)!) }, { divider: true, label: '' }, { label: t('close_window'), shortcut: 'Cmd+W', onClick: () => activeWindowId && closeWindow(activeWindowId) }] },
    { id: 'edit', label: t('edit'), items: [{ label: t('undo'), shortcut: 'Cmd+Z', disabled: true }, { label: t('redo'), shortcut: 'Shift+Cmd+Z', disabled: true }, { divider: true, label: '' }, { label: t('cut'), shortcut: 'Cmd+X', disabled: true }, { label: t('copy'), shortcut: 'Cmd+C', disabled: true }, { label: t('paste'), shortcut: 'Cmd+V', disabled: true }, { label: t('select_all'), shortcut: 'Cmd+A', disabled: true }] },
    { id: 'view', label: t('view'), items: [{ label: t('enter_fullscreen'), shortcut: 'Fn+F', onClick: toggleFullScreen }] },
    { id: 'window', label: t('window'), items: [{ label: t('minimize'), shortcut: 'Cmd+M', onClick: () => activeWindowId && minimizeWindow(activeWindowId) }, { label: t('zoom'), onClick: () => activeWindowId && maximizeWindow(activeWindowId) }] },
    { id: 'help', label: t('help'), items: [{ label: t('search_help'), shortcut: 'Cmd+?', onClick: () => toggleSpotlight() }] }
  ], [t, appTitle, activeWindowId, launchApp, setIsLocked, minimizeWindow, closeWindow, maximizeWindow, toggleSpotlight, dockItems])

  return (
    // [优化] 顶部栏：超高透明度 + 强力模糊 + 极细边框
    <div className="h-8 w-full bg-gray-100/30 dark:bg-black/20 backdrop-blur-2xl border-b border-white/5 shadow-sm absolute top-0 left-0 z-[9999] flex items-center justify-between px-2 text-black dark:text-white select-none transition-all duration-300">
      
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
        <TopAddressBar />
      </div>

      <div className="flex items-center gap-3 text-xs font-medium px-2 text-black/80 dark:text-white/90">
        <div className="hidden sm:flex items-center gap-3">
             <div className="hover:bg-white/20 p-1.5 rounded transition-colors cursor-default" title={`Battery: ${batteryLevel}%`}><Battery size={18} /></div>
             <div className="hover:bg-white/20 p-1.5 rounded transition-colors cursor-default" title={t('wifi')}><Wifi size={16} /></div>
             <div className="hover:bg-white/20 p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSpotlight()} title={t('search')}><Search size={15} /></div>
        </div>
        
        <div className="hover:bg-white/20 px-2 py-1 rounded transition-colors cursor-default flex items-center gap-2" onClick={(e) => { e.stopPropagation(); toggleControlCenter() }}>
            <div className="flex gap-[2px] pointer-events-none opacity-80">
                <div className="w-3.5 h-1.5 border-[1.5px] border-current rounded-sm"></div>
                <div className="w-3.5 h-1.5 border-[1.5px] border-current rounded-sm bg-current"></div>
            </div>
        </div>

        <div className="hover:bg-white/20 px-3 py-1 rounded transition-colors cursor-default whitespace-nowrap min-w-[70px] text-center font-semibold text-shadow-sm" onClick={() => launchApp(dockItems.find(a => a.id === 'calendar')!)}>
          {date ? formatTime(date) : ''}
        </div>
      </div>
    </div>
  )
}