'use client'

import React, { useState, useRef, useEffect } from 'react'
import { OsProvider, useOs } from './os-context'
import { I18nProvider } from './i18n-context'
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
import { FileText, Edit3, Volume2, VolumeX } from 'lucide-react'

// [修复] 动态壁纸组件：去除了负数 z-index，防止被背景遮挡
const DynamicWallpaper = ({ videoSrc, posterSrc }: { videoSrc: string, posterSrc: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isMuted, setIsMuted] = useState(true)
    const [hasInteracted, setHasInteracted] = useState(false)

    // 自动播放尝试
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true // 必须静音才能自动播放
            videoRef.current.play().catch(e => console.log("Autoplay blocked:", e))
        }
    }, [])

    // 点击解锁声音
    const handleUnlockAudio = () => {
        if (!hasInteracted) {
            setHasInteracted(true)
            setIsMuted(false)
            if (videoRef.current) {
                videoRef.current.muted = false
                videoRef.current.play().catch(console.error)
            }
        }
    }

    return (
        <div 
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto bg-black" 
            onClick={handleUnlockAudio}
        >
            {/* 1. 静态底图 */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: `url(${posterSrc})` }}
            />
            
            {/* 2. 视频层 */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover fade-in"
                src={videoSrc}
                poster={posterSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
            />

            {/* 声音提示 */}
            {isMuted && !hasInteracted && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 text-white/90 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 animate-pulse pointer-events-none z-10 border border-white/20 shadow-lg">
                    <VolumeX size={16} />
                    <span className="text-xs font-medium">Click screen to unmute</span>
                </div>
            )}
            
            {/* 遮罩层，让文字更清晰 */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        </div>
    )
}

const DesktopContent = ({ wallpaper, setWallpaper }: { wallpaper: string, setWallpaper: (url: string) => void }) => {
    const { windows, dockItems, registry, launchApp } = useOs() as any 
    
    const allApps: AppConfig[] = registry || dockItems
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: ContextMenuType; meta?: any } | null>(null)
    
    const handleContextMenu = (e: React.MouseEvent, type: ContextMenuType = 'desktop', meta?: any) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        setContextMenu({ x: e.clientX, y: e.clientY, type, meta }); 
    }

    const handleRefresh = () => { document.body.style.opacity = '0.5'; setTimeout(() => document.body.style.opacity = '1', 100); }
    // [修复] 现在可以真正打开设置去换壁纸了
    const handleChangeWallpaper = () => { 
        const s = dockItems.find((a:any) => a.id === 'settings'); 
        if(s) launchApp(s); 
    }

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

    const isLiveWallpaper = wallpaper === 'live'

    return (
        <div 
            className="relative w-full h-full overflow-hidden select-none bg-black" 
            onContextMenu={(e) => handleContextMenu(e, 'desktop')} 
            onClick={() => setContextMenu(null)}
        >
            {/* [修复] 壁纸层：直接作为第一个子元素渲染，不做 z-index hack */}
            {isLiveWallpaper ? (
                <DynamicWallpaper videoSrc="/bg.mp4" posterSrc="/kl.webp" />
            ) : (
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
                    style={{ backgroundImage: `url(${wallpaper})` }}
                />
            )}

            <LoginScreen />
            <MenuBar />
            <Launchpad />
            <ControlCenter />
            <Spotlight />
            <Notifications />
            
            <div className="absolute inset-0 z-10 pointer-events-none">
                {windows.map((window: any) => {
                    const app = allApps.find((a: any) => a.id === window.appId)
                    let component = app?.component
                    
                    if (window.props && React.isValidElement(component)) {
                        component = React.cloneElement(component as React.ReactElement, { ...window.props })
                    }

                    // [修复] 将 setWallpaper 传递给设置应用
                    if (window.appId === 'settings') {
                        component = React.cloneElement(component as React.ReactElement, { setWallpaper })
                    }
                    if (window.appId === 'finder') {
                        component = React.cloneElement(component as React.ReactElement, { onContextMenu: handleContextMenu })
                    }

                    return (
                        <div key={window.id} className="pointer-events-auto">
                            <WindowFrame windowState={window}>{component}</WindowFrame>
                        </div>
                    )
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

// [修复] 恢复 Desktop 组件的状态提升逻辑
export const Desktop = ({ apps }: { apps: AppConfig[] }) => {
  // 默认为 'live'，即显示鸣潮视频
  const [currentWallpaper, setCurrentWallpaper] = useState('live')

  return (
    <I18nProvider>
        <OsProvider installedApps={apps}>
        <main className="fixed inset-0 w-screen h-screen overflow-hidden font-sans text-gray-900 dark:text-gray-100">
            <DesktopContent wallpaper={currentWallpaper} setWallpaper={setCurrentWallpaper} />
        </main>
        </OsProvider>
    </I18nProvider>
  )
}