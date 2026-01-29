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

// [NEW] 动态壁纸组件：核心功能开发 + 交互体验优化
const DynamicWallpaper = ({ videoSrc, posterSrc }: { videoSrc: string, posterSrc: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isMuted, setIsMuted] = useState(true)
    const [hasInteracted, setHasInteracted] = useState(false)

    // 尝试自动播放逻辑
    useEffect(() => {
        if (videoRef.current) {
            // 浏览器策略通常要求静音才能自动播放
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => console.log("Autoplay blocked, waiting for interaction", e))
        }
    }, [])

    // 点击屏幕解锁声音
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
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto" 
            onClick={handleUnlockAudio}
        >
            {/* 1. 静态图层 (底图) */}
            {/* Z-Index: -20，确保在最底层，防止视频加载慢时黑屏 */}
            <div 
                className="absolute inset-0 bg-cover bg-center z-[-20]"
                style={{ backgroundImage: `url(${posterSrc})` }}
            />
            
            {/* 2. 视频层 (动态壁纸) */}
            {/* Z-Index: -10，在底图之上，但在桌面图标之下 */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover z-[-10]"
                src={videoSrc}
                poster={posterSrc}
                autoPlay
                loop
                muted={isMuted} // 初始必须静音以支持自动播放
                playsInline
            />

            {/* 声音提示 (仅在未交互前显示) */}
            {isMuted && !hasInteracted && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 text-white/80 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 animate-pulse pointer-events-none z-0 border border-white/10">
                    <VolumeX size={16} />
                    <span className="text-xs font-medium">Click to unmute</span>
                </div>
            )}
            
            {/* 黑色遮罩层：轻微压暗背景，让白色文字更清晰 */}
            <div className="absolute inset-0 bg-black/10 z-[-5] pointer-events-none" />
        </div>
    )
}

const DesktopContent = () => {
    const { windows, dockItems, registry, launchApp } = useOs() as any 
    
    const allApps: AppConfig[] = registry || dockItems
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: ContextMenuType; meta?: any } | null>(null)
    
    const handleContextMenu = (e: React.MouseEvent, type: ContextMenuType = 'desktop', meta?: any) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        setContextMenu({ x: e.clientX, y: e.clientY, type, meta }); 
    }

    const handleRefresh = () => { document.body.style.opacity = '0.5'; setTimeout(() => document.body.style.opacity = '1', 100); }
    // 壁纸切换功能保留用于刷新
    const handleChangeWallpaper = () => { handleRefresh() }

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
            className="relative w-full h-full overflow-hidden select-none bg-black" 
            onContextMenu={(e) => handleContextMenu(e, 'desktop')} 
            onClick={() => setContextMenu(null)}
        >
            {/* [核心修改] 引入动态壁纸组件 */}
            [cite_start]{/* 使用 public 目录下的 bg.mp4 和 kl.webp [cite: 1] */}
            <DynamicWallpaper videoSrc="/bg.mp4" posterSrc="/kl.webp" />

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

                    if (window.appId === 'settings') {
                        component = React.cloneElement(component as React.ReactElement, {})
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

export const Desktop = ({ apps }: { apps: AppConfig[] }) => {
  return (
    <I18nProvider>
        <OsProvider installedApps={apps}>
        <main className="fixed inset-0 w-screen h-screen overflow-hidden font-sans text-gray-900 dark:text-gray-100">
            <DesktopContent />
        </main>
        </OsProvider>
    </I18nProvider>
  )
}