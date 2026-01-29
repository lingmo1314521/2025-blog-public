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

// [NEW] 动态壁纸组件
const DynamicWallpaper = ({ videoSrc, posterSrc }: { videoSrc: string, posterSrc: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isMuted, setIsMuted] = useState(true)
    const [hasInteracted, setHasInteracted] = useState(false)

    // 尝试自动播放逻辑
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.log("Autoplay blocked, waiting for interaction", e))
        }
    }, [])

    const handleUnlockAudio = () => {
        if (!hasInteracted) {
            setHasInteracted(true)
            setIsMuted(false)
            if (videoRef.current) {
                videoRef.current.muted = false
                videoRef.current.play()
            }
        }
    }

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto" onClick={handleUnlockAudio}>
            {/* 底层静态图 (Z-Index: -20) */}
            <div 
                className="absolute inset-0 bg-cover bg-center z-[-20]"
                style={{ backgroundImage: `url(${posterSrc})` }}
            />
            
            {/* 视频层 (Z-Index: -10) */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover z-[-10]"
                src={videoSrc}
                poster={posterSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
            />

            {/* 声音提示 (可选) */}
            {isMuted && !hasInteracted && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 animate-pulse pointer-events-none z-0">
                    <VolumeX size={16} />
                    <span className="text-xs">Click anywhere to unmute</span>
                </div>
            )}
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
    // 壁纸更换现在只做刷新用，因为我们锁定了鸣潮主题
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
            {/* [NEW] 引入动态壁纸 */}
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