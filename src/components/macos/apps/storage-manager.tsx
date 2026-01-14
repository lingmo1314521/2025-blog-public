// components/macos/apps/storage-manager.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { HardDrive, Trash2, Download, RefreshCw, Folder, FileText, ChevronRight, LayoutGrid, List as ListIcon, Code, StickyNote, Calendar, Terminal, Settings } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { VSCode } from './vscode' // 引入 VS Code 用于预览

// === 类型定义 ===
interface VirtualFile {
  id: string
  name: string
  appName: string // 所属 App (Folder Name)
  content: string
  size: number
  type: 'file' | 'folder'
  originalKey: string // 对应的 localStorage key
  originalId?: string // 对应 App 内部的 ID (如 Note ID)
}

// === 解析器逻辑 ===

// 1. 解析 Terminal 文件系统 (递归)
const parseTerminalFS = (fs: any, path = ''): VirtualFile[] => {
  let files: VirtualFile[] = []
  if (!fs || !fs.children) return files

  Object.values(fs.children).forEach((node: any) => {
    if (node.type === 'file') {
      files.push({
        id: `term-${path}-${node.name}`,
        name: node.name,
        appName: 'Terminal',
        content: node.content || '',
        size: (node.content || '').length,
        type: 'file',
        originalKey: 'macos-terminal-fs'
      })
    } else if (node.type === 'dir') {
      files = [...files, ...parseTerminalFS(node, `${path}/${node.name}`)]
    }
  })
  return files
}

// 2. 解析 Notes
const parseNotes = (notesJson: string): VirtualFile[] => {
  try {
    const notes = JSON.parse(notesJson)
    return notes.map((note: any) => ({
      id: `note-${note.id}`,
      name: `${note.title || 'Untitled'}.txt`,
      appName: 'Notes',
      content: note.content || '',
      size: (note.content || '').length,
      type: 'file',
      originalKey: 'macos-notes',
      originalId: note.id
    }))
  } catch { return [] }
}

// 3. 解析 VS Code
const parseVSCode = (fsJson: string): VirtualFile[] => {
  try {
    const fs = JSON.parse(fsJson)
    return fs.filter((f: any) => f.type === 'file').map((f: any) => ({
      id: `vscode-${f.id}`,
      name: f.name,
      appName: 'VS Code',
      content: f.content || '',
      size: (f.content || '').length,
      type: 'file',
      originalKey: 'vscode-fs-v8'
    }))
  } catch { return [] }
}

// 4. 解析 Calendar
const parseCalendar = (eventsJson: string): VirtualFile[] => {
  try {
    const events = JSON.parse(eventsJson)
    return events.map((ev: any) => ({
      id: `cal-${ev.id}`,
      name: `${ev.dateStr}-${ev.title}.json`,
      appName: 'Calendar',
      content: JSON.stringify(ev, null, 2),
      size: JSON.stringify(ev).length,
      type: 'file',
      originalKey: 'macos-calendar-events'
    }))
  } catch { return [] }
}

export const StorageManager = () => {
  const { t } = useI18n()
  const { addNotification, launchApp } = useOs()
  
  // State
  const [files, setFiles] = useState<VirtualFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('All')
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 核心：实时轮询 (模拟文件系统监听)
  useEffect(() => {
    const scan = () => {
      let allFiles: VirtualFile[] = []
      
      // Terminal
      const termFS = localStorage.getItem('macos-terminal-fs')
      if (termFS) {
          try { allFiles = [...allFiles, ...parseTerminalFS(JSON.parse(termFS))] } catch {}
      }

      // Notes
      const notes = localStorage.getItem('macos-notes')
      if (notes) allFiles = [...allFiles, ...parseNotes(notes)]

      // VS Code
      const vscode = localStorage.getItem('vscode-fs-v8')
      if (vscode) allFiles = [...allFiles, ...parseVSCode(vscode)]

      // Calendar
      const cal = localStorage.getItem('macos-calendar-events')
      if (cal) allFiles = [...allFiles, ...parseCalendar(cal)]

      // Diff check to avoid re-render loop if identical? (Simplified: just set)
      // 在实际生产中应做深度比较，这里直接更新
      setFiles(allFiles)
    }

    scan()
    const interval = setInterval(scan, 2000) // 2秒轮询一次，保证"其他App修改后实时更新"
    return () => clearInterval(interval)
  }, [refreshTrigger])

  const folders = ['All', ...Array.from(new Set(files.map(f => f.appName)))]
  const displayFiles = selectedFolder === 'All' ? files : files.filter(f => f.appName === selectedFolder)

  // Actions
  const handleOpen = (file: VirtualFile) => {
      // 在 VS Code 预览 (使用我们新改的 VS Code 组件)
      launchApp({
          id: `preview-${file.id}`,
          title: `Preview: ${file.name}`,
          icon: <Code />, // 简单图标
          width: 800,
          height: 600,
          component: <VSCode previewFile={{ name: file.name, content: file.content, language: file.name.split('.').pop() }} />
      })
  }

  const handleDeleteAll = () => {
      if (confirm(t('fm_delete_confirm'))) {
          localStorage.clear()
          window.location.reload()
      }
  }

  // Icons Helper
  const getAppIcon = (appName: string) => {
      switch(appName) {
          case 'Terminal': return <Terminal size={18} />
          case 'Notes': return <StickyNote size={18} />
          case 'Calendar': return <Calendar size={18} />
          case 'VS Code': return <Code size={18} />
          default: return <Folder size={18} />
      }
  }

  return (
    <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] text-black dark:text-white font-sans select-none rounded-b-xl overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-48 bg-[#e8e8ea] dark:bg-[#252525]/90 backdrop-blur-xl border-r border-gray-300 dark:border-white/10 flex flex-col pt-4 px-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">{t('fm_applications')}</div>
            <div className="flex flex-col gap-0.5">
                {folders.map(folder => (
                    <div 
                        key={folder}
                        onClick={() => { setSelectedFolder(folder); setSelectedFile(null) }}
                        className={clsx(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                            selectedFolder === folder ? "bg-blue-500 text-white" : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                        )}
                    >
                        {folder === '