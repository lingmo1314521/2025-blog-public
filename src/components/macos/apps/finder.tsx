'use client'

import React, { useState, useMemo } from 'react'
import { Folder, FileText, ChevronRight, Home, Clock, Cloud, Download, Gamepad2 } from 'lucide-react'
import { clsx } from '../utils'
import { useOs } from '../os-context'
import { useI18n } from '../i18n-context'
import { WutheringWavesLauncher } from './wuthering-waves'

interface FinderProps {
    onContextMenu?: (e: React.MouseEvent, type: 'file', meta: any) => void
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <div onClick={onClick} className={clsx("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-default select-none transition-colors", active ? "bg-black/10 dark:bg-white/10 text-black dark:text-white" : "text-gray-500 hover:bg-black/5 dark:hover:bg-white/5")}>
    <Icon size={16} /><span>{label}</span>
  </div>
)

export const Finder = ({ onContextMenu }: FinderProps) => {
  const { t } = useI18n()
  const { launchApp } = useOs()
  const [activeSidebar, setActiveSidebar] = useState('all_posts')
  
  // [MODIFIED] 硬编码一些模拟文件，移除博客 Fetch
  const files = [
      { id: 'ww_launcher', title: 'Wuthering Waves.exe', type: 'app', icon: <Gamepad2 size={48} className="text-yellow-500"/> },
      { id: 'readme', title: 'README.txt', type: 'file', icon: <FileText size={48} className="text-gray-400"/> },
      { id: 'screenshot', title: 'Screenshot_01.png', type: 'image', icon: <div className="w-12 h-12 bg-blue-200 rounded flex items-center justify-center">IMG</div> }
  ]

  const handleOpen = (item: any) => {
    if (item.id === 'ww_launcher') {
        launchApp({
            id: 'wuthering_waves',
            title: 'Wuthering Waves',
            icon: item.icon,
            width: 1280, height: 760,
            component: <WutheringWavesLauncher />
        })
    } else {
        alert("File preview not implemented for this demo.")
    }
  }

  const sidebarGroups = useMemo(() => [
      {
          title: t('fd_favorites'),
          items: [
              { id: 'all_posts', icon: Home, label: 'Home' },
              { id: 'recent', icon: Clock, label: t('recent') },
          ]
      },
      {
          title: t('fd_locations'),
          items: [
              { id: 'icloud', icon: Cloud, label: t('fd_icloud') },
              { id: 'downloads', icon: Download, label: t('fd_downloads') },
          ]
      }
  ], [t])

  return (
    <div className="flex h-full w-full bg-[#f6f6f6] dark:bg-[#1e1e1e] text-black dark:text-white rounded-b-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="w-48 bg-black/5 dark:bg-white/5 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col pt-4 px-2 gap-6">
        {sidebarGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-1">
                <div className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{group.title}</div>
                {group.items.map(item => (
                    <SidebarItem 
                        key={item.id} 
                        icon={item.icon} 
                        label={item.label} 
                        active={activeSidebar === item.id} 
                        onClick={() => setActiveSidebar(item.id)} 
                    />
                ))}
            </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
        <div className="h-8 border-b border-black/5 dark:border-white/10 flex items-center px-4 gap-2 text-xs text-gray-500">
          <Home size={14} /><ChevronRight size={14} /><span>{t('finder')}</span><ChevronRight size={14} /><span className="text-black dark:text-white font-medium">{t(activeSidebar)}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4 content-start">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="group flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/20 active:bg-blue-500/20 cursor-default transition-colors" 
                onDoubleClick={() => handleOpen(file)}
                onContextMenu={(e) => {
                    e.preventDefault(); e.stopPropagation()
                    if (onContextMenu) onContextMenu(e, 'file', file)
                }}
              >
                <div className="w-16 h-16 flex items-center justify-center">{file.icon}</div>
                <div className="text-xs text-center line-clamp-2 px-1 w-full break-words group-hover:text-blue-600 dark:group-hover:text-blue-300">{file.title}</div>
              </div>
            ))}
        </div>
        <div className="h-6 border-t border-black/5 dark:border-white/10 flex items-center justify-center text-[10px] text-gray-400 select-none">{files.length} {t('fd_items')}</div>
      </div>
    </div>
  )
}