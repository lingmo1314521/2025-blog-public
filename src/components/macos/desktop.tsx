'use client'

import React, { useState } from 'react'
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
import { FileText, Edit3 } from 'lucide-react'

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