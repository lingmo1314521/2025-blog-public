'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Wifi, Battery, Search, Apple, Volume2, ShieldCheck, PlayCircle } from 'lucide-react' // [MODIFIED] Added icons
import { useOs } from './os-context'
import { useI18n } from './i18n-context'
import { formatTime, clsx } from './utils'

// ... MenuItemConfig, MenuDropdown 组件代码保持不变，省略 ...
// 确保只替换 MenuBar 组件部分

// 辅助组件 MenuDropdown 保持不变...
// 辅助函数 formatShortcut 保持不变...

// [NEW] 顶部地址栏组件
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
                // 如果已打开，更新 props
                updateWindowProps(safariId, { initialUrl: url })
            } else {
                // 如果没打开，启动并传入 url
                launchApp(safariConfig, { initialUrl: url })
            }
        }
    }

    return (
        <div className="hidden md:flex items-center bg-white/20 dark:bg-black/20 rounded px-2 py-0.5 ml-4 w-64 border border-black/5 focus-within:bg-white/40 focus-within:w-80 transition-all">
            <ShieldCheck size={12} className="text-gray-600 dark:text-gray-300 mr-2 opacity-70" />
            <input 
                className="bg-transparent border-none outline-none text-xs w-full text-black dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
                placeholder="Search or enter website..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    )
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

  const activeApp = dockItems.find(app => app.id === activeWindowId) || dockItems.find(app => app.id === 'finder')
  const appTitle = activeApp ? t(activeApp.id) : t('finder')

  useEffect(() => {
    setDate(new Date())
    const timer = setInterval(() => setDate(new Date()), 1000)
    // Battery logic...
    return () => clearInterval(timer)
  }, [])

  // ... toggleFullScreen, MENUS 定义保持不变 ...
  // 为节省空间，省略 MENUS 数组定义，请保留你原有的 MENUS 代码

  return (
    <div className="h-8 w-full bg-white/40 dark:bg-[#1e1e1e]/50 backdrop-blur-xl border-b border-black/5 dark:border-white/5 absolute top-0 left-0 z-[9999] flex items-center justify-between px-2 text-black dark:text-white select-none transition-colors">
      
      {/* 左侧菜单 */}
      <div className="flex items-center h-full px-1">
        {/* ... 这里放置 MenuDropdown 遍历代码 ... */}
        {/* 在这里插入地址栏 */}
        <TopAddressBar />
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