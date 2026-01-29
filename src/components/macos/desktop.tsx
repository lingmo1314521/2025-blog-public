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

// [优化版] 动态壁纸组件
const DynamicWallpaper = ({ videoSrc, posterSrc }: { videoSrc: string, posterSrc: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [hasInteracted, setHasInteracted] = useState(false)

    // 自动播放尝试 (静音启动)
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.play().catch(e => console.log("Autoplay blocked:", e))
        }
    }, [])

    // 点击屏幕解锁声音 (隐形逻辑)
    const handleUnlockAudio = () => {
        if (!hasInteracted) {
            setHasInteracted(true)
            if (videoRef.current) {
                videoRef.current.muted = false
                videoRef.current.play().catch(console.error)
            }
        }
    }

    // [关键修改] 垂直对齐位置：'center 15%' 意味着重心上移，优先显示顶部内容（防削头）
    const positionStyle = { objectPosition: 'center 15%' }
    const bgPositionStyle = { backgroundPosition: 'center 15%' }

    return (
        <div 
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto bg-black" 
            onClick={handleUnlockAudio}
        >
            {/* 1. 静态底图 */}
            <div 
                className="absolute inset-0 bg-cover transition-opacity duration-1000"
                style={{ 
                    backgroundImage: `url(${posterSrc})`,
                    ...bgPositionStyle // 同步调整底图位置
                }}
            />
            
            {/* 2. 视频层 */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover fade-in"
                src={videoSrc}
                poster={posterSrc}
                autoPlay
                loop
                muted={true}
                playsInline
                style={positionStyle} // 应用对齐样式
            />
            
            {/* 视觉遮罩层：轻微压暗 */}
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
            {/* 壁纸渲染区 */}
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

export const Desktop = ({ apps }: { apps: AppConfig[] }) => {
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