'use client'

import React, { useState, useEffect } from 'react'
import { 
  HardDrive, Trash2, Download, Folder, FileText, 
  LayoutGrid, List as ListIcon, Code, StickyNote, 
  ArrowLeft, ArrowRight, Search, Clock, Cloud, 
  Airplay, Monitor, AppWindow, Image as ImageIcon
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { VSCode } from './vscode'
import { Preview } from './preview'

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

const SIDEBAR = [
  { section: 'fd_favorites', items: [
    { id: 'airdrop', icon: Airplay, label: 'fd_airdrop', color: 'text-blue-500' },
    { id: 'recents', icon: Clock, label: 'fd_recents', color: 'text-blue-500' },
    { id: 'applications', icon: AppWindow, label: 'fd_applications', color: 'text-blue-500' },
    { id: 'desktop', icon: Monitor, label: 'fd_desktop', color: 'text-blue-500' },
    { id: 'documents', icon: FileText, label: 'fd_documents', color: 'text-blue-500' },
    { id: 'downloads', icon: Download, label: 'fd_downloads', color: 'text-blue-500' },
  ]},
  { section: 'fd_icloud', items: [
    { id: 'icloud', icon: Cloud, label: 'fd_icloud', color: 'text-blue-500' },
  ]},
  { section: 'fd_locations', items: [
    { id: 'macintosh', icon: HardDrive, label: 'fd_macintosh_hd', color: 'text-gray-500' },
    { id: 'network', icon: GlobeIcon, label: 'fd_network', color: 'text-blue-500' },
  ]}
]

function GlobeIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
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
      kind: isDir ? 'Folder' : 'Unix Executable File',
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
      kind: 'Source Code',
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
      kind: 'Text Document',
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
  
  const [fileSystem, setFileSystem] = useState<{
    terminalRoot: FinderItem[],
    vscodeFiles: FinderItem[],
    notesFiles: FinderItem[],
    apps: FinderItem[]
  }>({ terminalRoot: [], vscodeFiles: [], notesFiles: [], apps: [] })

  useEffect(() => {
    const scan = () => {
      let termRoot: FinderItem[] = []
      let vsFiles: FinderItem[] = []
      let ntFiles: FinderItem[] = []

      const termFS = localStorage.getItem('macos-terminal-fs')
      if (termFS) {
          try { termRoot = parseTerminalFS(JSON.parse(termFS)) } catch {}
      }

      const vscode = localStorage.getItem('vscode-fs-v8')
      if (vscode) vsFiles = parseVSCode(vscode)

      const notes = localStorage.getItem('macos-notes')
      if (notes) ntFiles = parseNotes(notes)

      const appFiles = dockItems.map(app => ({
          id: `app-${app.id}`,
          name: app.title,
          kind: 'Application',
          date: '2024/5/20',
          size: 0,
          type: 'file' as const,
          source: 'system' as const,
          icon: <div className="w-full h-full scale-75">{app.icon}</div>
      }))

      setFileSystem({ 
          terminalRoot: termRoot, 
          vscodeFiles: vsFiles, 
          notesFiles: ntFiles, 
          apps: appFiles
      })
    }
    scan()
    const interval = setInterval(scan, 2000)
    return () => clearInterval(interval)
  }, [dockItems])

  const getCurrentItems = (): FinderItem[] => {
      if (currentPath === 'recents') {
          return [
              ...findDeepFiles(fileSystem.terminalRoot).slice(0, 5),
              ...fileSystem.notesFiles,
              ...fileSystem.vscodeFiles
          ].sort(() => 0.5 - Math.random())
      }
      if (currentPath === 'applications') return fileSystem.apps
      if (currentPath === 'documents') return [...fileSystem.vscodeFiles, ...fileSystem.notesFiles]
      if (currentPath === 'downloads') return []
      if (currentPath === 'desktop') {
          const home = fileSystem.terminalRoot.find(f => f.name === 'home')
          const user = home?.children?.find(f => f.name === 'user' || f.name === 'lynx')
          const desktop = user?.children?.find(f => f.name === 'desktop' || f.name === 'Desktop')
          return desktop?.children || []
      }
      if (currentPath === 'macintosh') {
          return [
              { id: 'dir-apps', name: 'Applications', kind: 'Folder', date: '--', type: 'folder', source: 'system', children: fileSystem.apps },
              { id: 'dir-users', name: 'Users', kind: 'Folder', date: '--', type: 'folder', source: 'system', children: fileSystem.terminalRoot },
              { id: 'dir-sys', name: 'System', kind: 'Folder', date: '--', type: 'folder', source: 'system', children: [] },
          ]
      }

      if (currentPath.startsWith('term-') || currentPath.startsWith('dir-')) {
          const target = findItemById(currentPath, getAllRootItems())
          return target?.children || []
      }

      return []
  }

  const getAllRootItems = () => [
      ...fileSystem.terminalRoot,
      { id: 'dir-apps', children: fileSystem.apps } as FinderItem,
      { id: 'dir-users', children: fileSystem.terminalRoot } as FinderItem
  ]

  const findDeepFiles = (items: FinderItem[]): FinderItem[] => {
      let res: FinderItem[] = []
      items.forEach(item => {
          if (item.type === 'file') res.push(item)
          if (item.children) res = [...res, ...findDeepFiles(item.children)]
      })
      return res
  }

  const findItemById = (id: string, scope: FinderItem[]): FinderItem | undefined => {
      for (const item of scope) {
          if (item.id === id) return item
          if (item.children) {
              const found = findItemById(id, item.children)
              if (found) return found
          }
      }
      return undefined
  }

  const navigate = (path: string) => {
      const newHistory = navHistory.slice(0, navIndex + 1)
      newHistory.push(path)
      setNavHistory(newHistory)
      setNavIndex(newHistory.length - 1)
      setCurrentPath(path)
      setSelectedItems([])
  }

  const goBack = () => {
      if (navIndex > 0) {
          setNavIndex(navIndex - 1)
          setCurrentPath(navHistory[navIndex - 1])
      }
  }

  const goForward = () => {
      if (navIndex < navHistory.length - 1) {
          setNavIndex(navIndex + 1)
          setCurrentPath(navHistory[navIndex + 1])
      }
  }

  const handleDoubleClick = (item: FinderItem) => {
      if (item.type === 'folder') {
          navigate(item.id)
      } else {
          // 1. VS Code / Text Files
          if (item.source === 'vscode' || item.name.endsWith('.txt') || item.name.endsWith('.md') || item.name.endsWith('.js') || item.name.endsWith('.ts') || item.name.endsWith('.css') || item.name.endsWith('.html')) {
              launchApp({
                  id: `edit-${item.id}`,
                  title: item.name,
                  icon: <Code />,
                  width: 800, 
                  height: 600,
                  component: <VSCode previewFile={{ name: item.name, content: item.content || '', language: item.name.split('.').pop() }} />
              })
          } 
          // 2. Images / Videos (Preview)
          else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4'].some(ext => item.name.toLowerCase().endsWith(ext))) {
              launchApp({
                  id: `preview-${item.id}`,
                  title: item.name,
                  icon: <ImageIcon className="text-blue-500"/>,
                  width: 800,
                  height: 600,
                  component: <Preview file={{ 
                      name: item.name, 
                      content: item.content || 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3270&auto=format&fit=crop', 
                      type: item.name.endsWith('.mp4') ? 'video' : 'image'
                  }} />
              })
          }
          // 3. Applications
          else if (item.kind === 'Application') {
              const appId = item.id.replace('app-', '')
              const appConfig = dockItems.find(a => a.id === appId)
              if (appConfig) launchApp(appConfig)
          } else {
              alert(`Opening ${item.name}... (No handler for this file type)`)
          }
      }
  }

  const handleDeleteAll = () => {
      if (confirm(t('fd_format_disk'))) {
          localStorage.clear()
          window.location.reload()
      }
  }

  const currentItems = getCurrentItems()
  const displayItems = searchQuery 
      ? currentItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : currentItems

  const renderIcon = (item: FinderItem) => {
      if (item.icon) return item.icon
      if (item.type === 'folder') return <div className="w-full h-full text-blue-400 drop-shadow-sm"><Folder size={viewMode==='grid'?64:20} fill="currentColor" strokeWidth={1} /></div>
      if (item.name.endsWith('.png') || item.name.endsWith('.jpg')) return <ImageIcon size={viewMode==='grid'?48:20} className="text-purple-500" />
      return <FileText size={viewMode==='grid'?48:20} className="text-gray-400" strokeWidth={1} />
  }

  return (
    <div className="flex h-full w-full bg-[#f6f6f6] dark:bg-[#1e1e1e] text-black dark:text-white font-sans select-none rounded-b-xl overflow-hidden transition-colors duration-300">
        
        {/* Left Sidebar */}
        <div className="w-48 bg-[#e8e8ea]/80 dark:bg-[#2b2b2b]/80 backdrop-blur-xl border-r border-gray-300/50 dark:border-white/10 flex flex-col pt-4 overflow-y-auto">
            {SIDEBAR.map((group, idx) => (
                <div key={idx} className="mb-4">
                    <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t(group.section)}</div>
                    <div className="flex flex-col gap-0.5 px-2">
                        {group.items.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => navigate(item.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                                    currentPath === item.id ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                            >
                                <item.icon size={16} className={item.color} />
                                <span className="truncate">{t(item.label) || item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            <div className="mt-auto p-4">
                <button onClick={handleDeleteAll} className="flex items-center gap-2 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 px-2 py-1 rounded transition-colors w-full">
                    <Trash2 size={12} /> {t('fd_format_disk')}
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
            
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 bg-[#f6f6f6] dark:bg-[#252525] transition-colors">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 text-gray-500">
                        <button onClick={goBack} disabled={navIndex <= 0} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-all"><ArrowLeft size={16}/></button>
                        <button onClick={goForward} disabled={navIndex >= navHistory.length-1} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-all"><ArrowRight size={16}/></button>
                    </div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                        <Folder size={16} className="text-blue-400" fill="currentColor"/>
                        {currentPath.startsWith('term-') ? currentPath.split('/').pop() : t(`fd_${currentPath}`) || currentPath}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-200 dark:bg-white/10 rounded-md p-0.5 border border-gray-300 dark:border-white/5">
                        <button onClick={() => setViewMode('grid')} className={clsx("p-1 rounded transition-all", viewMode === 'grid' && "bg-white dark:bg-[#3e3e3e] shadow-sm")}><LayoutGrid size={14}/></button>
                        <button onClick={() => setViewMode('list')} className={clsx("p-1 rounded transition-all", viewMode === 'list' && "bg-white dark:bg-[#3e3e3e] shadow-sm")}><ListIcon size={14}/></button>
                    </div>
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1.5 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search')} 
                            className="w-32 focus:w-48 transition-all bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md py-1 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                        />
                    </div>
                </div>
            </div>

            {/* File Area */}
            <div 
                className="flex-1 overflow-y-auto"
                onClick={() => setSelectedItems([])}
            >
                {displayItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2 opacity-20">📂</span>
                        <span className="text-sm">{t('fm_no_files')}</span>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4 p-4 content-start">
                            {displayItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItems([item.id]) }}
                                    onDoubleClick={() => handleDoubleClick(item)}
                                    className={clsx(
                                        "group flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent transition-all",
                                        selectedItems.includes(item.id) 
                                            ? "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-500/30" 
                                            : "hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="w-16 h-16 flex items-center justify-center transition-transform group-active:scale-95">
                                        {renderIcon(item)}
                                    </div>
                                    <div className={clsx(
                                        "text-xs text-center w-full break-words line-clamp-2 px-1 rounded leading-tight",
                                        selectedItems.includes(item.id) ? "text-blue-600 dark:text-blue-100 font-medium" : "text-gray-700 dark:text-gray-300"
                                    )}>
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col w-full min-w-full">
                            {/* Table Header */}
                            <div className="flex items-center px-4 py-1.5 text-[11px] font-semibold text-gray-500 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#252525]">
                                <div className="flex-1">{t('fd_name')}</div>
                                <div className="w-32">{t('fd_date_modified')}</div>
                                <div className="w-24">{t('fd_size')}</div>
                                <div className="w-32">{t('fd_kind')}</div>
                            </div>
                            {/* Table Body */}
                            {displayItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItems([item.id]) }}
                                    onDoubleClick={() => handleDoubleClick(item)}
                                    className={clsx(
                                        "flex items-center px-4 py-1.5 text-xs border-b border-gray-100 dark:border-white/5 cursor-default transition-colors",
                                        selectedItems.includes(item.id) 
                                            ? "bg-blue-500 text-white" 
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 even:bg-gray-50/30 dark:even:bg-white/2"
                                    )}
                                >
                                    <div className="flex-1 flex items-center gap-2 truncate pr-4">
                                        <div className={clsx("w-4 h-4", selectedItems.includes(item.id) ? "text-white" : "")}>
                                            {item.icon || (item.type === 'folder' ? <Folder size={14} fill="currentColor" className={selectedItems.includes(item.id) ? "" : "text-blue-400"} /> : <FileText size={14} />)}
                                        </div>
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                    <div className="w-32 opacity-70">{item.date}</div>
                                    <div className="w-24 opacity-70 font-mono">{item.size ? (item.size > 1024 ? `${(item.size/1024).toFixed(1)} KB` : `${item.size} B`) : '--'}</div>
                                    <div className="w-32 opacity-70 truncate">{t(item.kind) || item.kind}</div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#f6f6f6] dark:bg-[#252525] border-t border-gray-200 dark:border-white/10 flex items-center justify-center text-[10px] text-gray-500 select-none">
                {displayItems.length} {t('fd_items')}, {Math.floor(Math.random() * 50 + 20)} GB available
            </div>
        </div>
    </div>
  )
}