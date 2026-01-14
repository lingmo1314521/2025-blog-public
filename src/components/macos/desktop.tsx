'use client'

import React, { useState, useEffect } from 'react'
import { OsProvider, useOs } from './os-context'
import { I18nProvider, useI18n } from './i18n-context'
import { WindowFrame } from './window-frame'
import { Dock } from './dock'
import { MenuBar } from './menu-bar'
import { Launchpad } from './launchpad'
import { ContextMenu, ContextMenuType } from './context-menu'
import { ControlCenter } from './control-center'
import { LoginScreen } from './login-screen'
import { Spotlight } from './spotlight'
import { Notifications } from './notifications'
import { AppConfig } from './types'
import { DocViewer } from './apps/doc-viewer'
import { FileText, Edit3, Mic } from 'lucide-react'

// --- 弹窗组件: 麦克风权限 ---
const MicPermissionModal = ({ onClose }: { onClose: () => void }) => {
    const handleAllow = () => {
        // 请求麦克风权限
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                localStorage.setItem('mic-permission', 'granted')
                onClose()
            })
            .catch(() => {
                alert('Permission denied. You can enable it in browser settings.')
                onClose()
            })
    }

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-[#e8e8e8] dark:bg-[#2c2c2c] w-80 rounded-xl shadow-2xl p-5 flex flex-col items-center gap-4 border border-white/20">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Mic size={24} />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-lg mb-1 dark:text-white">Siri (Beta)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300 leading-relaxed">
                        This website includes a voice assistant. Would you like to enable microphone access to use voice commands?
                    </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                    <button onClick={onClose} className="flex-1 py-1.5 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-sm font-medium transition-colors">
                        Don't Allow
                    </button>
                    <button onClick={handleAllow} className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow-md transition-all">
                        Allow
                    </button>
                </div>
            </div>
        </div>
    )
}

const DesktopContent = ({ wallpaper, setWallpaper }: { wallpaper: string, setWallpaper: (url: string) => void }) => {
    const { windows, dockItems, registry, launchApp, isLocked } = useOs() as any 
    
    const allApps: AppConfig[] = registry || dockItems
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: ContextMenuType; meta?: any } | null>(null)
    
    // --- 麦克风权限检测逻辑 ---
    const [showMicPrompt, setShowMicPrompt] = useState(false)

    useEffect(() => {
        if (!isLocked) {
            // 延迟一点检测，等待 UI 动画
            const timer = setTimeout(() => {
                const hasPermission = localStorage.getItem('mic-permission') === 'granted'
                if (!hasPermission) {
                    // 检查浏览器是否已经授权（避免重复弹窗）
                    navigator.permissions.query({ name: 'microphone' as any }).then((permissionStatus) => {
                        if (permissionStatus.state !== 'granted') {
                            setShowMicPrompt(true)
                        }
                    })
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [isLocked])

    const handleContextMenu = (e: React.MouseEvent, type: ContextMenuType = 'desktop', meta?: any) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        setContextMenu({ x: e.clientX, y: e.clientY, type, meta }); 
    }

    const handleRefresh = () => { document.body.style.opacity = '0.5'; setTimeout(() => document.body.style.opacity = '1', 100); }
    const handleChangeWallpaper = () => { const s = dockItems.find((a:any) => a.id === 'settings'); if(s) launchApp(s); }

    const handleOpenFile = (meta: any) => {
         launchApp({
            id: `post-${meta.slug}`,
            title: meta.title,
            icon: <FileText size={24} className="text-gray-500" />,
            width: 900,
            height: 700,
            component: <DocViewer slug={meta.slug} title={meta.title} />
         })
    }

    const handleEditFile = (meta: any) => {
        launchApp({
            id: `editor-${meta.slug}`,
            title: `编辑: ${meta.title}`,
            icon: <div className="w-5 h-5 text-blue-500"><Edit3 size={20} /></div>,
            width: 1200,
            height: 800,
            component: <DocViewer url={`/write/${meta.slug}?embedded=true`} title={`编辑: ${meta.title}`} />
        })
    }

    return (
        <div 
            className="relative w-full h-full overflow-hidden select-none" 
            onContextMenu={(e) => handleContextMenu(e, 'desktop')} 
            onClick={() => setContextMenu(null)}
        >
            <LoginScreen />
            <MenuBar />
            <Launchpad />
            <ControlCenter />
            <Spotlight />
            <Notifications />
            
            {/* 弹窗挂载点 */}
            {showMicPrompt && <MicPermissionModal onClose={() => setShowMicPrompt(false)} />}
            
            <div className="absolute inset-0">
                {windows.map((window: any) => {
                    const app = allApps.find((a: any) => a.id === window.appId)
                    let component = app?.component
                    
                    if (window.props && React.isValidElement(component)) {
                        component = React.cloneElement(component as React.ReactElement, { ...window.props })
                    }

                    if (window.appId === 'settings') {
                        component = React.cloneElement(component as React.ReactElement, { setWallpaper })
                    }
                    if (window.appId === 'finder') {
                        component = React.cloneElement(component as React.ReactElement, { onContextMenu: handleContextMenu })
                    }

                    return <WindowFrame key={window.id} windowState={window}>{component}</WindowFrame>
                })}
            </div>
            
            <Dock />
            
            {contextMenu && (
                <ContextMenu 
                    x={contextMenu.x} 
                    y={contextMenu.y} 
                    type={contextMenu.type}
                    meta={contextMenu.meta}
                    onClose={() => setContextMenu(null)} 
                    onRefresh={handleRefresh} 
                    onChangeWallpaper={handleChangeWallpaper}
                    onOpen={handleOpenFile}
                    onEdit={handleEditFile}
                />
            )}
        </div>
    )
}

export const Desktop = ({ apps, wallpaper: initialWallpaper }: { apps: AppConfig[], wallpaper?: string }) => {
  const [currentWallpaper, setCurrentWallpaper] = useState(initialWallpaper || "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3270&auto=format&fit=crop")

  return (
    <I18nProvider>
        <OsProvider installedApps={apps}>
        <main 
            className="fixed inset-0 w-screen h-screen overflow-hidden bg-cover bg-center font-sans text-gray-900 dark:text-gray-100 transition-all duration-700 ease-in-out"
            style={{ backgroundImage: `url(${currentWallpaper})` }}
            onContextMenu={(e) => e.preventDefault()} 
        >
            <DesktopContent wallpaper={currentWallpaper} setWallpaper={setCurrentWallpaper} />
        </main>
        </OsProvider>
    </I18nProvider>
  )
}