'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  HardDrive, Trash2, Download, Folder, FileText, 
  LayoutGrid, List as ListIcon, Clock, Cloud, Airplay, Monitor, AppWindow, Image as ImageIcon, Code, StickyNote, ArrowLeft, ArrowRight, Search
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { VSCode } from './vscode'

interface FinderItem {
  id: string
  name: string
  kind: string 
  date: string
  size?: number
  type: 'file' | 'folder'
  icon?: React.ReactNode
  source: 'terminal' | 'vscode' | 'notes' | 'calendar' | 'system'
  originalPath?: string 
  content?: string      
  children?: FinderItem[]
}

const parseTerminalFS = (fs: any, path = ''): FinderItem[] => {
  let items: FinderItem[] = []
  if (!fs || !fs.children) return items
  Object.values(fs.children).forEach((node: any) => {
    const fullPath = `${path}/${node.name}`
    const isDir = node.type === 'dir'
    items.push({
      id: `term-${fullPath}`,
      name: node.name,
      kind: isDir ? 'folder' : 'file',
      date: 'Today',
      size: isDir ? undefined : (node.content?.length || 0),
      type: isDir ? 'folder' : 'file',
      source: 'terminal',
      originalPath: fullPath,
      content: node.content,
      children: isDir ? parseTerminalFS(node, fullPath) : undefined
    })
  })
  return items
}

const parseVSCode = (fsJson: string): FinderItem[] => {
  try {
    const fs = JSON.parse(fsJson)
    const items = fs.filter((f: any) => f.type === 'file').map((f: any) => ({
      id: `vscode-${f.id}`,
      name: f.name,
      kind: 'file',
      date: 'Yesterday',
      size: f.content?.length,
      type: 'file' as const,
      source: 'vscode' as const,
      content: f.content,
      icon: <Code size={32} className="text-blue-500" />
    }))
    return items
  } catch { return [] }
}

const parseNotes = (notesJson: string): FinderItem[] => {
  try {
    const notes = JSON.parse(notesJson)
    return notes.map((note: any) => ({
      id: `note-${note.id}`,
      name: `${note.title}.txt`,
      kind: 'file',
      date: note.date,
      size: note.content?.length,
      type: 'file' as const,
      source: 'notes' as const,
      content: note.content,
      icon: <StickyNote size={32} className="text-yellow-500" />
    }))
  } catch { return [] }
}

export const StorageManager = () => {
  const { t } = useI18n()
  const { launchApp, dockItems } = useOs()
  
  const [currentPath, setCurrentPath] = useState<string>('recents')
  const [navHistory, setNavHistory] = useState<string[]>(['recents'])
  const [navIndex, setNavIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [fileSystem, setFileSystem] = useState<{terminalRoot: FinderItem[], vscodeFiles: FinderItem[], notesFiles: FinderItem[], apps: FinderItem[]}>({ terminalRoot: [], vscodeFiles: [], notesFiles: [], apps: [] })

  useEffect(() => {
    const scan = () => {
      let termRoot: FinderItem[] = []
      let vsFiles: FinderItem[] = []
      let ntFiles: FinderItem[] = []
      const termFS = localStorage.getItem('macos-terminal-fs')
      if (termFS) { try { termRoot = parseTerminalFS(JSON.parse(termFS)) } catch {} }
      const vscode = localStorage.getItem('vscode-fs-v8')
      if (vscode) vsFiles = parseVSCode(vscode)
      const notes = localStorage.getItem('macos-notes')
      if (notes) ntFiles = parseNotes(notes)
      const appFiles = dockItems.map(app => ({
          id: `app-${app.id}`, name: app.title, kind: 'app', date: '2024/5/20', size: 0,
          type: 'file' as const, source: 'system' as const, icon: <div className="w-full h-full scale-75">{app.icon}</div>
      }))
      setFileSystem({ terminalRoot: termRoot, vscodeFiles: vsFiles, notesFiles: ntFiles, apps: appFiles })
    }
    scan()
    const interval = setInterval(scan, 2000)
    return () => clearInterval(interval)
  }, [dockItems])

  const getCurrentItems = (): FinderItem[] => {
      if (currentPath === 'recents') return [...fileSystem.notesFiles, ...fileSystem.vscodeFiles].sort(() => 0.5 - Math.random())
      if (currentPath === 'applications') return fileSystem.apps
      if (currentPath === 'documents') return [...fileSystem.vscodeFiles, ...fileSystem.notesFiles]
      if (currentPath === 'desktop') {
          const home = fileSystem.terminalRoot.find(f => f.name === 'home')
          const user = home?.children?.find(f => f.name === 'user' || f.name === 'lynx')
          const desktop = user?.children?.find(f => f.name === 'desktop' || f.name === 'Desktop')
          return desktop?.children || []
      }
      if (currentPath === 'macintosh') return [
          { id: 'dir-apps', name: 'Applications', kind: 'folder', date: '--', type: 'folder', source: 'system', children: fileSystem.apps },
          { id: 'dir-users', name: 'Users', kind: 'folder', date: '--', type: 'folder', source: 'system', children: fileSystem.terminalRoot },
      ]
      return []
  }

  const navigate = (path: string) => {
      const newHistory = navHistory.slice(0, navIndex + 1); newHistory.push(path)
      setNavHistory(newHistory); setNavIndex(newHistory.length - 1); setCurrentPath(path); setSelectedItems([])
  }
  const goBack = () => { if (navIndex > 0) { setNavIndex(navIndex - 1); setCurrentPath(navHistory[navIndex - 1]) } }
  const goForward = () => { if (navIndex < navHistory.length - 1) { setNavIndex(navIndex + 1); setCurrentPath(navHistory[navIndex + 1]) } }

  const handleDoubleClick = (item: FinderItem) => {
      if (item.type === 'folder') { navigate(item.id) } 
      else if (item.source === 'vscode' || item.name.endsWith('.txt')) {
          launchApp({ id: `edit-${item.id}`, title: item.name, icon: <Code />, width: 800, height: 600, component: <VSCode previewFile={{ name: item.name, content: item.content || '', language: 'plaintext' }} /> })
      }
  }

  const sidebarGroups = useMemo(() => [
    { section: 'fd_favorites', items: [{ id: 'recents', icon: Clock, label: 'fd_recents', color: 'text-blue-500' }, { id: 'applications', icon: AppWindow, label: 'fd_applications', color: 'text-blue-500' }, { id: 'desktop', icon: Monitor, label: 'fd_desktop', color: 'text-blue-500' }, { id: 'documents', icon: FileText, label: 'fd_documents', color: 'text-blue-500' }, { id: 'downloads', icon: Download, label: 'fd_downloads', color: 'text-blue-500' }]},
    { section: 'fd_locations', items: [{ id: 'macintosh', icon: HardDrive, label: 'fd_macintosh_hd', color: 'text-gray-500' }]}
  ], [])

  const currentItems = getCurrentItems()
  const displayItems = searchQuery ? currentItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) : currentItems

  const renderIcon = (item: FinderItem) => {
      if (item.icon) return item.icon
      if (item.type === 'folder') return <div className="w-full h-full text-blue-400 drop-shadow-sm"><Folder size={viewMode==='grid'?64:20} fill="currentColor" strokeWidth={1} /></div>
      return <FileText size={viewMode==='grid'?48:20} className="text-gray-400" strokeWidth={1} />
  }

  return (
    <div className="flex h-full w-full bg-[#f6f6f6] dark:bg-[#1e1e1e] text-black dark:text-white font-sans select-none rounded-b-xl overflow-hidden transition-colors duration-300">
        <div className="w-48 bg-[#e8e8ea]/80 dark:bg-[#2b2b2b]/80 backdrop-blur-xl border-r border-gray-300/50 dark:border-white/10 flex flex-col pt-4 overflow-y-auto">
            {sidebarGroups.map((group, idx) => (
                <div key={idx} className="mb-4">
                    <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t(group.section)}</div>
                    <div className="flex flex-col gap-0.5 px-2">
                        {group.items.map(item => (
                            <div key={item.id} onClick={() => navigate(item.id)} className={clsx("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors", currentPath === item.id ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5")}>
                                <item.icon size={16} className={item.color} />
                                <span className="truncate">{t(item.label)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
            <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 bg-[#f6f6f6] dark:bg-[#252525]">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 text-gray-500"><button onClick={goBack} disabled={navIndex <= 0} className="p-1 rounded hover:bg-black/10"><ArrowLeft size={16}/></button><button onClick={goForward} disabled={navIndex >= navHistory.length-1} className="p-1 rounded hover:bg-black/10"><ArrowRight size={16}/></button></div>
                    <div className="font-semibold text-sm flex items-center gap-2"><Folder size={16} className="text-blue-400" fill="currentColor"/>{t(`fd_${currentPath}`) || currentPath}</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-200 dark:bg-white/10 rounded-md p-0.5"><button onClick={() => setViewMode('grid')} className={clsx("p-1 rounded", viewMode === 'grid' && "bg-white dark:bg-[#3e3e3e] shadow-sm")}><LayoutGrid size={14}/></button><button onClick={() => setViewMode('list')} className={clsx("p-1 rounded", viewMode === 'list' && "bg-white dark:bg-[#3e3e3e] shadow-sm")}><ListIcon size={14}/></button></div>
                    <div className="relative"><Search size={12} className="absolute left-2.5 top-1.5 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search')} className="w-32 focus:w-48 transition-all bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md py-1 pl-7 pr-2 text-xs outline-none" /></div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={() => setSelectedItems([])}>
                {displayItems.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400"><span className="text-4xl mb-2 opacity-20">📂</span><span className="text-sm">{t('fm_no_files')}</span></div> : 
                    (viewMode === 'grid' ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4 p-4 content-start">
                            {displayItems.map(item => (
                                <div key={item.id} onClick={(e) => { e.stopPropagation(); setSelectedItems([item.id]) }} onDoubleClick={() => handleDoubleClick(item)} className={clsx("group flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent", selectedItems.includes(item.id) ? "bg-blue-100 dark:bg-blue-900/40 border-blue-200" : "hover:bg-gray-100 dark:hover:bg-white/5")}>
                                    <div className="w-16 h-16 flex items-center justify-center">{renderIcon(item)}</div>
                                    <div className={clsx("text-xs text-center line-clamp-2 px-1 rounded", selectedItems.includes(item.id) ? "text-blue-600 dark:text-blue-100 font-medium" : "text-gray-700 dark:text-gray-300")}>{item.name}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col w-full min-w-full">
                            <div className="flex items-center px-4 py-1.5 text-[11px] font-semibold text-gray-500 border-b border-gray-200 bg-gray-50/50"><div className="flex-1">{t('fd_name')}</div><div className="w-32">{t('fd_date')}</div><div className="w-24">{t('fd_size')}</div><div className="w-32">{t('fd_kind')}</div></div>
                            {displayItems.map((item) => (
                                <div key={item.id} onClick={(e) => { e.stopPropagation(); setSelectedItems([item.id]) }} onDoubleClick={() => handleDoubleClick(item)} className={clsx("flex items-center px-4 py-1.5 text-xs border-b border-gray-100 cursor-default", selectedItems.includes(item.id) ? "bg-blue-500 text-white" : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700")}>
                                    <div className="flex-1 flex items-center gap-2 truncate pr-4"><div className={clsx("w-4 h-4", selectedItems.includes(item.id) ? "text-white" : "")}>{item.icon || (item.type === 'folder' ? <Folder size={14} fill="currentColor" /> : <FileText size={14} />)}</div><span className="truncate">{item.name}</span></div>
                                    <div className="w-32 opacity-70">{item.date}</div><div className="w-24 opacity-70 font-mono">{item.size ? `${item.size} B` : '--'}</div><div className="w-32 opacity-70 truncate">{t(item.kind)}</div>
                                </div>
                            ))}
                        </div>
                    ))
                }
            </div>
        </div>
    </div>
  )
}