'use client'

import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react'
import { 
  // 基础图标
  Search, Files, Play, X, ChevronRight, ChevronDown, 
  Settings, ToggleLeft, ToggleRight, GitBranch,
  // 文件图标
  Folder, FolderOpen, Archive, FilePlus, FolderPlus, 
  Briefcase, Edit3, FolderInput, Terminal as TerminalIcon,
  // 功能图标
  Command, Search as SearchIcon, MoreHorizontal, 
  Download, Upload, FileCode, LayoutTemplate, 
  Trash2, Check // 确保所有图标都已导入
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import JSZip from 'jszip'

// ==========================================
// 1. 类型定义
// ==========================================

type FileType = 'file' | 'folder'
type Language = 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'plaintext' | 'markdown'

interface FileSystemItem {
  id: string
  parentId: string | null
  name: string
  type: FileType
  language?: Language
  content?: string
  isOpen?: boolean
  isUnsaved?: boolean
}

interface EditorConfig {
  fontSize: number
  wordWrap: boolean
  showLineNumbers: boolean
  minimap: boolean
}

interface VSCodeProps {
    previewFile?: { name: string; content: string; language?: string }
}

// ==========================================
// 2. Context 定义
// ==========================================

interface VSCodeContextType {
    fs: FileSystemItem[]
    selectedIds: string[]
    openFiles: string[]
    activeFileId: string | null
    dragOverId: string | null
    renamingId: string | null
    isReadOnly: boolean
    handleItemClick: (e: React.MouseEvent, id: string, type: FileType) => void
    handleDragStart: (e: React.DragEvent, id: string) => void
    handleDragOver: (e: React.DragEvent, id: string | null) => void
    handleDrop: (e: React.DragEvent, targetId: string | null) => void
    handleContextMenu: (e: React.MouseEvent, id: string | null) => void
    toggleFolder: (id: string) => void
    renameFile: (id: string, newName: string) => void
    setRenamingId: (id: string | null) => void
    closeTab: (id: string) => void
    setActiveFileId: (id: string) => void
}

const VSCodeContext = createContext<VSCodeContextType | null>(null)

// ==========================================
// 3. 初始数据
// ==========================================
const INITIAL_FS: FileSystemItem[] = [
  { id: 'root-readme', parentId: null, name: 'README.md', type: 'file', language: 'markdown', content: '# VS Code Web\n\nWelcome to LynxMuse Code Editor.\n\n### Features:\n- 📂 **Folder Upload**: Right click context menu supported.\n- 🔍 **Search**: Find text in all files.\n- ⌨️ **Command Palette**: `Cmd+Shift+P`' },
  { id: 'src', parentId: null, name: 'src', type: 'folder', isOpen: true },
  { id: 'index', parentId: 'src', name: 'index.html', type: 'file', language: 'html', content: '<h1>Hello World</h1>\n<script src="./app.js"></script>' },
  { id: 'css', parentId: 'src', name: 'style.css', type: 'file', language: 'css', content: 'body {\n  background: #1e1e1e;\n  color: #fff;\n  font-family: sans-serif;\n}' },
  { id: 'js', parentId: 'src', name: 'app.js', type: 'file', language: 'javascript', content: 'console.log("System Ready");' },
]

const TEMPLATES = {
  vanilla: [
    { id: '1', parentId: null, name: 'index.html', type: 'file', language: 'html', content: '<!DOCTYPE html>\n<h1>Vanilla JS</h1>' },
    { id: '2', parentId: null, name: 'style.css', type: 'file', language: 'css', content: 'body { background: #333; color: #fff; }' },
    { id: '3', parentId: null, name: 'app.js', type: 'file', language: 'javascript', content: 'console.log("Loaded");' }
  ],
  react: [
    { id: 'r1', parentId: null, name: 'App.tsx', type: 'file', language: 'typescript', content: 'export const App = () => <h1>React</h1>' },
    { id: 'r2', parentId: null, name: 'components', type: 'folder', isOpen: true },
    { id: 'r3', parentId: 'r2', name: 'Button.tsx', type: 'file', language: 'typescript', content: '<button>Click</button>' }
  ]
}

// ==========================================
// 4. 子组件
// ==========================================

const FileIcon = React.memo(({ name, type, isOpen }: { name: string, type: FileType, isOpen?: boolean }) => {
  if (type === 'folder') return isOpen ? <ChevronDown size={14} className="text-gray-400 shrink-0"/> : <ChevronRight size={14} className="text-gray-400 shrink-0"/>
  const ext = name.split('.').pop()?.toLowerCase()
  switch(ext) {
    case 'html': return <span className="text-[#e34c26] font-bold text-[10px] w-4 text-center select-none">&lt;&gt;</span>
    case 'css': return <span className="text-[#563d7c] font-bold text-[10px] w-4 text-center select-none">#</span>
    case 'js': return <span className="text-[#f1e05a] font-bold text-[10px] w-4 text-center select-none">JS</span>
    case 'ts':
    case 'tsx': return <span className="text-[#3178c6] font-bold text-[10px] w-4 text-center select-none">TS</span>
    case 'json': return <span className="text-yellow-400 font-bold text-[10px] w-4 text-center select-none">{}</span>
    case 'md': return <span className="text-blue-300 font-bold text-[10px] w-4 text-center select-none">MD</span>
    default: return <FileCode size={14} className="text-blue-400 shrink-0" />
  }
})
FileIcon.displayName = 'FileIcon'

const FileTreeItem = ({ item, depth }: { item: FileSystemItem, depth: number }) => {
    const ctx = useContext(VSCodeContext)!
    const children = ctx.fs.filter(f => f.parentId === item.id).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name)
        return a.type === 'folder' ? -1 : 1
    })
    const isSelected = ctx.selectedIds.includes(item.id)
    const isOver = ctx.dragOverId === item.id
    const isRenaming = ctx.renamingId === item.id

    return (
        <div className="select-none">
            <div
                data-file-id={item.id}
                draggable={!ctx.isReadOnly}
                onDragStart={(e) => ctx.handleDragStart(e, item.id)}
                onDragOver={(e) => ctx.handleDragOver(e, item.id)}
                onDrop={(e) => ctx.handleDrop(e, item.id)}
                onClick={(e) => ctx.handleItemClick(e, item.id, item.type)}
                onContextMenu={(e) => ctx.handleContextMenu(e, item.id)}
                className={clsx(
                    "file-item-row flex items-center gap-1 py-0.5 px-2 cursor-pointer border-l-2 text-[13px] relative transition-colors",
                    isSelected ? "bg-[#37373d] border-blue-400 text-white" : "border-transparent text-[#cccccc] hover:bg-[#2a2d2e]",
                    isOver && "bg-[#094771] outline outline-1 outline-blue-400"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <div className="w-4 shrink-0 flex justify-center" onClick={(e) => { e.stopPropagation(); ctx.toggleFolder(item.id) }}>
                    {item.type === 'folder' && (item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </div>
                <FileIcon name={item.name} type={item.type} isOpen={item.isOpen} />
                {isRenaming ? (
                    <input 
                        defaultValue={item.name}
                        className="bg-[#3c3c3c] text-white border border-blue-500 h-5 px-1 ml-1 w-full text-[13px] outline-none"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        onBlur={(e) => { ctx.renameFile(item.id, e.target.value); ctx.setRenamingId(null) }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                ) : (
                    <span className={clsx("truncate ml-1 flex-1", item.isUnsaved && "italic text-yellow-200")}>{item.name}</span>
                )}
            </div>
            {item.type === 'folder' && item.isOpen && children.map(child => <FileTreeItem key={child.id} item={child} depth={depth + 1} />)}
        </div>
    )
}

// ==========================================
// 5. 主组件
// ==========================================

export const VSCode = ({ previewFile }: VSCodeProps) => {
  const { t: translate } = useI18n()
  const t = (key: string) => translate(key) || key

  const isReadOnly = !!previewFile

  // --- State ---
  const [fs, setFs] = useState<FileSystemItem[]>(INITIAL_FS)
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  
  // UI
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'settings'>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [outputSrc, setOutputSrc] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [config, setConfig] = useState<EditorConfig>({ fontSize: 14, wordWrap: true, showLineNumbers: true, minimap: false })
  
  // Command Palette
  const [showPalette, setShowPalette] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const paletteInputRef = useRef<HTMLInputElement>(null)

  // Interaction
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean, x: number, y: number, itemId: string | null }>({ visible: false, x: 0, y: 0, itemId: null })
  const [draggedIds, setDraggedIds] = useState<string[]>([])
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  // Marquee Selection
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)
  const selectionStart = useRef<{ x: number, y: number } | null>(null)
  
  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const fileListRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  // Input Refs moved to persistent location
  const uploadFileRef = useRef<HTMLInputElement>(null)
  const uploadFolderRef = useRef<HTMLInputElement>(null)

  // === Effect: Initialization ===
  useEffect(() => {
    if (previewFile) {
        const tempId = 'preview-file'
        setFs([{
            id: tempId, parentId: null, name: previewFile.name, type: 'file',
            language: (previewFile.language as Language) || 'plaintext',
            content: previewFile.content, isUnsaved: false
        }])
        setOpenFiles([tempId])
        setActiveFileId(tempId)
    } else {
        const saved = localStorage.getItem('vscode-fs-v8')
        if (saved) {
            try { setFs(JSON.parse(saved)) } catch {}
        }
    }
  }, [previewFile])

  useEffect(() => {
    if (!previewFile && fs !== INITIAL_FS) {
        localStorage.setItem('vscode-fs-v8', JSON.stringify(fs))
    }
  }, [fs, previewFile])

  // === Command Palette Logic ===
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
              e.preventDefault()
              setShowPalette(p => !p)
          }
          if (e.key === 'Escape') setShowPalette(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
      if (showPalette) setTimeout(() => paletteInputRef.current?.focus(), 50)
      else setPaletteQuery('')
  }, [showPalette])

  // === Derived State ===
  const activeFile = useMemo(() => fs.find(f => f.id === activeFileId), [fs, activeFileId])
  
  const searchResults = useMemo(() => {
      if (!searchQuery) return []
      const res: any[] = []
      fs.filter(f => f.type === 'file').forEach(f => {
          const lines = (f.content || '').split('\n')
          lines.forEach((line, i) => {
              if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
                  res.push({ file: f, line: i + 1, match: line.trim() })
              }
          })
      })
      return res
  }, [fs, searchQuery])

  // === Actions Implementation ===

  const updateFileContent = (id: string, content: string) => {
      if (isReadOnly) return
      setFs(prev => prev.map(f => f.id === id ? { ...f, content, isUnsaved: true } : f))
  }

  const toggleFolder = (id: string) => {
      setFs(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f))
  }

  const handleItemClick = (e: React.MouseEvent, id: string, type: FileType) => {
      e.stopPropagation()
      if (type === 'folder' && !e.ctrlKey && !e.metaKey && !e.shiftKey) toggleFolder(id)
      if (type === 'file' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          if (!openFiles.includes(id)) setOpenFiles(p => [...p, id])
          setActiveFileId(id)
          setShowPreview(false)
      }
      if (e.ctrlKey || e.metaKey) {
          setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
      } else {
          setSelectedIds([id])
      }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
      if (isReadOnly) return
      e.stopPropagation()
      const ids = selectedIds.includes(id) ? selectedIds : [id]
      setDraggedIds(ids)
      e.dataTransfer.setData('application/json', JSON.stringify(ids))
      e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string | null) => {
      if (isReadOnly) return
      e.preventDefault()
      e.stopPropagation()
      if (id === null) { setDragOverId('root'); return }
      const item = fs.find(f => f.id === id)
      if (item?.type === 'folder' && !draggedIds.includes(id)) setDragOverId(id)
      else setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
      if (isReadOnly) return
      e.preventDefault(); e.stopPropagation(); setDragOverId(null)
      const data = e.dataTransfer.getData('application/json')
      if (data) {
          try {
              const ids = JSON.parse(data)
              const validMoves = ids.filter((dragId: string) => {
                  if (dragId === targetId) return false
                  let check = targetId
                  while (check) {
                      const p = fs.find(f => f.id === check)
                      if (p?.id === dragId) return false
                      check = p?.parentId || null
                  }
                  return true
              })
              setFs(prev => prev.map(f => validMoves.includes(f.id) ? { ...f, parentId: targetId === 'root' ? null : targetId } : f))
          } catch {}
      }
      setDraggedIds([])
  }

  const handleContextMenu = (e: React.MouseEvent, id: string | null) => {
      if (isReadOnly) return
      e.preventDefault(); e.stopPropagation()
      if (id && !selectedIds.includes(id)) setSelectedIds([id])
      
      if (editorContainerRef.current) {
          const rect = editorContainerRef.current.getBoundingClientRect()
          let x = e.clientX - rect.left
          let y = e.clientY - rect.top
          if (x + 160 > rect.width) x = rect.width - 170
          if (y + 200 > rect.height) y = rect.height - 210
          setCtxMenu({ visible: true, x, y, itemId: id })
      }
  }

  const createFile = (type: FileType, parentId: string | null = null, name?: string, content?: string) => {
      if (isReadOnly) return
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
      setFs(prev => [...prev, {
          id, parentId, name: name || (type === 'folder' ? 'New Folder' : 'untitled.txt'), type,
          language: 'plaintext', content: content || '', isOpen: true
      }])
      if (type === 'file') {
          setOpenFiles(p => [...p, id])
          setActiveFileId(id)
      }
      setRenamingId(id)
  }

  const deleteFiles = (ids: string[]) => {
      if (isReadOnly) return
      const findAllChildren = (pids: string[]): string[] => {
          const children = fs.filter(f => f.parentId && pids.includes(f.parentId)).map(f => f.id)
          if (children.length === 0) return []
          return [...children, ...findAllChildren(children)]
      }
      const toDelete = [...ids, ...findAllChildren(ids)]
      setFs(prev => prev.filter(f => !toDelete.includes(f.id)))
      setOpenFiles(prev => prev.filter(id => !toDelete.includes(id)))
      if (activeFileId && toDelete.includes(activeFileId)) setActiveFileId(null)
      setSelectedIds([])
  }

  const renameFile = (id: string, newName: string) => {
      if (isReadOnly || !newName.trim()) return
      setFs(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f))
  }

  const closeTab = (id: string) => {
      const newOpen = openFiles.filter(fid => fid !== id)
      setOpenFiles(newOpen)
      if (activeFileId === id) {
          setActiveFileId(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null)
      }
  }

  const handleRun = () => {
      if (!activeFile) return
      setShowPreview(true); setConsoleLogs([])
      if (activeFile.language === 'html') {
          setOutputSrc(activeFile.content || '')
      } else if (activeFile.language === 'javascript') {
          const script = `<script>
            const _log = console.log;
            console.log = (...args) => { window.parent.postMessage({ type: 'console', content: args.join(' ') }, '*'); _log(...args); };
            try { ${activeFile.content} } catch(e) { console.log('Error:', e.message); }
          </script>`
          setOutputSrc(`<html><body>${script}</body></html>`)
          setShowConsole(true)
      } else {
          setOutputSrc(`<html><body><pre>${activeFile.content}</pre></body></html>`)
      }
  }

  const handleZipExport = async () => {
      const zip = new JSZip()
      const add = (pid: string | null, folder: any) => {
          fs.filter(f => f.parentId === pid).forEach(f => {
              if (f.type === 'file') folder.file(f.name, f.content || '')
              else add(f.id, folder.folder(f.name))
          })
      }
      add(null, zip)
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'project.zip'; a.click()
  }

  // --- File/Folder Upload Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              const reader = new FileReader()
              reader.onload = (ev) => createFile('file', null, file.name, ev.target?.result as string)
              reader.readAsText(file)
          })
          e.target.value = '' // Reset
      }
  }

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newItems: FileSystemItem[] = []
          const folderMap = new Map<string, string>()

          Array.from(e.target.files).forEach(file => {
              const path = file.webkitRelativePath
              if (!path) return 

              const parts = path.split('/')
              const fileName = parts.pop()!
              
              let currentPid: string | null = null
              let currentPath = ''
              
              parts.forEach(part => {
                  currentPath = currentPath ? `${currentPath}/${part}` : part
                  if (!folderMap.has(currentPath)) {
                      const newFolderId = Date.now().toString() + Math.random().toString(36).substr(2, 5)
                      newItems.push({
                          id: newFolderId,
                          parentId: currentPid,
                          name: part,
                          type: 'folder',
                          isOpen: false
                      })
                      folderMap.set(currentPath, newFolderId)
                      currentPid = newFolderId
                  } else {
                      currentPid = folderMap.get(currentPath)!
                  }
              })

              const reader = new FileReader()
              reader.onload = (ev) => {
                  setFs(prev => [...prev, {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                      parentId: currentPid,
                      name: fileName,
                      type: 'file',
                      language: 'plaintext',
                      content: ev.target?.result as string || '',
                      isUnsaved: false
                  }])
              }
              reader.readAsText(file)
          })
          
          setFs(prev => [...prev, ...newItems])
          e.target.value = '' // Reset
      }
  }

  // --- Handlers: Marquee Selection ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (isReadOnly || e.button !== 0) return
      if (!e.ctrlKey && !e.metaKey) setSelectedIds([])
      setIsSelecting(true)
      if (fileListRef.current) {
          const rect = fileListRef.current.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top + fileListRef.current.scrollTop
          selectionStart.current = { x, y }
          setSelectionBox({ x, y, w: 0, h: 0 })
      }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isSelecting || !selectionStart.current || !fileListRef.current) return
      const rect = fileListRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top + fileListRef.current.scrollTop
      
      const newBox = {
          x: Math.min(x, selectionStart.current.x),
          y: Math.min(y, selectionStart.current.y),
          w: Math.abs(x - selectionStart.current.x),
          h: Math.abs(y - selectionStart.current.y)
      }
      setSelectionBox(newBox)

      const items = fileListRef.current.querySelectorAll('.file-item-row')
      const newSelected = new Set(e.ctrlKey || e.metaKey ? selectedIds : [])
      items.forEach((el) => {
          const htmlEl = el as HTMLElement
          const elTop = htmlEl.offsetTop
          const elHeight = htmlEl.offsetHeight
          if (elTop < newBox.y + newBox.h && elTop + elHeight > newBox.y) {
              const id = htmlEl.getAttribute('data-file-id')
              if (id) newSelected.add(id)
          }
      })
      if (newSelected.size > 0) setSelectedIds(Array.from(newSelected))
  }

  const handleMouseUp = () => {
      setIsSelecting(false)
      setSelectionBox(null)
      selectionStart.current = null
  }

  // --- Download Helper ---
  const handleDownloadFile = (id: string) => {
      const file = fs.find(f => f.id === id)
      if (file && file.type === 'file') {
          const blob = new Blob([file.content || ''], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          a.click()
          URL.revokeObjectURL(url)
      }
  }

  // --- Commands ---
  const commands = [
      { id: 'new_file', label: 'File: New File', action: () => createFile('file') },
      { id: 'new_folder', label: 'File: New Folder', action: () => createFile('folder') },
      { id: 'save', label: 'File: Save', action: () => activeFile && updateFileContent(activeFile.id, activeFile.content || '') },
      { id: 'close_tab', label: 'View: Close Tab', action: () => activeFileId && closeTab(activeFileId) },
      { id: 'toggle_wrap', label: 'View: Toggle Word Wrap', action: () => setConfig(c => ({...c, wordWrap: !c.wordWrap})) },
      { id: 'toggle_lines', label: 'View: Toggle Line Numbers', action: () => setConfig(c => ({...c, showLineNumbers: !c.showLineNumbers})) },
      { id: 'increase_font', label: 'View: Zoom In', action: () => setConfig(c => ({...c, fontSize: c.fontSize + 1})) },
      { id: 'decrease_font', label: 'View: Zoom Out', action: () => setConfig(c => ({...c, fontSize: Math.max(10, c.fontSize - 1)})) },
      { id: 'export_zip', label: 'File: Export Project to ZIP', action: handleZipExport },
  ]

  const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(paletteQuery.toLowerCase()))

  // === RENDER ===
  return (
    <VSCodeContext.Provider value={{
        fs, selectedIds, openFiles, activeFileId, dragOverId, renamingId, isReadOnly,
        handleItemClick, handleDragStart, handleDragOver, handleDrop, handleContextMenu,
        toggleFolder, renameFile, setRenamingId, closeTab, setActiveFileId
    }}>
        <div ref={editorContainerRef} className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans text-sm select-none overflow-hidden border border-[#333] rounded-lg relative" onClick={() => { setCtxMenu(prev => ({ ...prev, visible: false })); setShowTemplateMenu(false) }}>
            
            {/* 1. Activity Bar */}
            <div className="w-12 flex flex-col items-center py-3 gap-3 border-r border-[#2b2b2b] bg-[#18181b] shrink-0 z-20">
                <div onClick={() => {setSidebarView('explorer'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'explorer' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Files size={24}/></div>
                <div onClick={() => {setSidebarView('search'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'search' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Search size={24}/></div>
                <div className="mt-auto mb-2 p-2 rounded cursor-pointer text-[#858585] hover:text-white" onClick={() => {setSidebarView('settings'); setSidebarVisible(true)}}><Settings size={24}/></div>
            </div>

            {/* 2. Sidebar */}
            {sidebarVisible && (
            <div className="w-64 bg-[#252526] flex flex-col border-r border-[#2b2b2b] shrink-0 transition-all relative">
                {sidebarView === 'explorer' && (
                    <>
                        <div className="h-9 px-3 flex items-center justify-between bg-[#252526] text-[11px] font-bold uppercase tracking-wider text-[#bbbbbb] shrink-0 group">
                            <span>{isReadOnly ? t('preview') : t('explorer')}</span>
                            {!isReadOnly && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => createFile('file')} className="p-1 hover:bg-[#3c3c3c] rounded" title={t('new_file')}><FilePlus size={14}/></button>
                                <button onClick={() => createFile('folder')} className="p-1 hover:bg-[#3c3c3c] rounded" title={t('new_folder')}><FolderPlus size={14}/></button>
                                <button onClick={(e) => {e.stopPropagation(); setShowTemplateMenu(!showTemplateMenu)}} className="p-1 hover:bg-[#3c3c3c] rounded"><MoreHorizontal size={14}/></button>
                            </div>}
                        </div>
                        {showTemplateMenu && (
                            <div className="absolute top-9 right-2 w-48 bg-[#252526] border border-[#454545] shadow-xl rounded z-50 py-1">
                                <div onClick={handleZipExport} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer text-xs flex gap-2 items-center"><Archive size={12}/> {t('export_zip')}</div>
                                <div onClick={()=>uploadFileRef.current?.click()} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer text-xs flex gap-2 items-center"><Upload size={12}/> {t('import_file')}</div>
                                <div onClick={()=>uploadFolderRef.current?.click()} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer text-xs flex gap-2 items-center"><FolderInput size={12}/> Import Folder</div>
                            </div>
                        )}
                        <div 
                            ref={fileListRef}
                            className={clsx("flex-1 overflow-y-auto custom-scrollbar relative", dragOverId === 'root' && "bg-[#2a2d2e] outline outline-1 outline-blue-500")}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDragOver={(e) => !isReadOnly && handleDragOver(e, null)}
                            onDrop={(e) => !isReadOnly && handleDrop(e, 'root')}
                            onContextMenu={(e) => !isReadOnly && handleContextMenu(e, null)}
                        >
                            {fs.filter(f => f.parentId === null).map(item => <FileTreeItem key={item.id} item={item} depth={0} />)}
                            {isSelecting && selectionBox && (
                                <div className="absolute bg-blue-500/20 border border-blue-500 pointer-events-none z-50" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
                            )}
                        </div>
                    </>
                )}

                {sidebarView === 'search' && (
                    <div className="flex flex-col h-full">
                        <div className="p-3">
                            <div className="text-[11px] font-bold uppercase mb-2">{t('search')}</div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    placeholder={t('search_placeholder')} 
                                    className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-blue-500 outline-none text-white text-xs px-2 py-1 rounded pl-7" 
                                    autoFocus 
                                />
                                <SearchIcon size={12} className="absolute left-2 top-1.5 text-gray-400"/>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {searchResults.length === 0 && searchQuery && <div className="text-xs text-center mt-4 text-gray-500">No results found.</div>}
                            {searchResults.map((res, i) => (
                                <div key={i} onClick={() => {if(!openFiles.includes(res.file.id)) setOpenFiles(p=>[...p, res.file.id]); setActiveFileId(res.file.id)}} className="group flex flex-col px-3 py-1 cursor-pointer hover:bg-[#37373d]">
                                    <div className="flex items-center gap-2 text-xs font-bold text-[#e0e0e0] mb-0.5"><FileCode size={12}/> {res.file.name}</div>
                                    <div className="text-xs text-[#999] font-mono pl-4 line-clamp-1 bg-[#2a2d2e] p-0.5 rounded truncate"><span className="text-[#666] mr-2">{res.line}:</span>{res.match}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {sidebarView === 'settings' && (
                    <div className="p-4 space-y-6">
                        <div className="text-[11px] font-bold uppercase text-white mb-2 border-b border-[#333] pb-2">{t('user_settings')}</div>
                        
                        <div className="space-y-2">
                            <div className="text-xs text-gray-200 flex justify-between"><span>{t('font_size')}</span><span>{config.fontSize}px</span></div>
                            <input type="range" min="10" max="24" value={config.fontSize} onChange={(e)=>setConfig({...config, fontSize: parseInt(e.target.value)})} className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                        </div>

                        <div className="flex justify-between cursor-pointer items-center" onClick={()=>setConfig({...config, showLineNumbers: !config.showLineNumbers})}>
                            <span className="text-xs text-gray-200">{t('line_numbers')}</span>
                            {config.showLineNumbers ? <ToggleRight size={24} className="text-blue-500"/> : <ToggleLeft size={24} className="text-[#666]"/>}
                        </div>

                        <div className="flex justify-between cursor-pointer items-center" onClick={()=>setConfig({...config, wordWrap: !config.wordWrap})}>
                            <span className="text-xs text-gray-200">{t('word_wrap')}</span>
                            {config.wordWrap ? <ToggleRight size={24} className="text-blue-500"/> : <ToggleLeft size={24} className="text-[#666]"/>}
                        </div>
                        
                        <div className="flex justify-between cursor-pointer items-center" onClick={()=>setConfig({...config, minimap: !config.minimap})}>
                            <span className="text-xs text-gray-200">{t('minimap')}</span>
                            {config.minimap ? <ToggleRight size={24} className="text-blue-500"/> : <ToggleLeft size={24} className="text-[#666]"/>}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* 3. Editor */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                {/* Tabs */}
                <div className="h-9 flex bg-[#252526] border-b border-[#2b2b2b] overflow-x-auto scrollbar-none">
                    {openFiles.map(fid => {
                        const f = fs.find(x => x.id === fid); if (!f) return null
                        return (
                            <div 
                                key={f.id} 
                                onClick={() => setActiveFileId(f.id)} 
                                className={clsx(
                                    "group px-3 flex items-center gap-2 min-w-[120px] max-w-[200px] text-xs border-r border-[#2b2b2b] cursor-pointer select-none", 
                                    activeFileId===f.id ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500" : "text-[#969696] bg-[#2d2d2d]"
                                )}
                            >
                                <FileIcon name={f.name} type="file" />
                                <span className={clsx("truncate flex-1", f.isUnsaved && "italic")}>{f.name} {f.isUnsaved && '●'}</span>
                                <X size={14} className="opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded p-0.5" onClick={(e) => { e.stopPropagation(); closeTab(f.id) }} />
                            </div>
                        )
                    })}
                </div>
                
                {/* Active Editor */}
                {activeFile ? (
                    <>
                        <div className="h-6 flex items-center px-4 justify-between bg-[#1e1e1e] border-b border-[#2b2b2b] shrink-0">
                            <div className="flex items-center gap-1 text-xs text-[#858585]">
                                <span>src</span> <ChevronRight size={12}/> <span>{activeFile.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleRun} className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#333] rounded text-white text-[10px]"><Play size={10} className="text-green-500"/> {t('run')}</button>
                                <button onClick={() => setShowPreview(!showPreview)} className={clsx("p-1 rounded hover:bg-[#333]", showPreview && "text-white")}><LayoutTemplate size={12}/></button>
                            </div>
                        </div>
                        <div className="flex-1 flex overflow-hidden relative">
                            <div className={clsx("flex flex-col h-full transition-all duration-300", showPreview ? "w-1/2 border-r border-[#2b2b2b]" : "w-full")}>
                                <div className="flex-1 relative flex">
                                    {config.showLineNumbers && (
                                        <div ref={lineNumRef} className="w-10 bg-[#1e1e1e] text-[#6e7681] text-right pr-2 pt-4 text-xs font-mono leading-[1.5rem] border-r border-[#2b2b2b] select-none">
                                            {Array.from({length: (activeFile.content||'').split('\n').length}).map((_,i)=><div key={i}>{i+1}</div>)}
                                        </div>
                                    )}
                                    <textarea 
                                        ref={textAreaRef}
                                        value={activeFile.content || ''}
                                        readOnly={isReadOnly}
                                        onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Tab') { 
                                                e.preventDefault(); 
                                                const s=e.currentTarget.selectionStart; 
                                                updateFileContent(activeFile.id, e.currentTarget.value.substring(0,s)+'  '+e.currentTarget.value.substring(e.currentTarget.selectionEnd)); 
                                                setTimeout(()=>{if(textAreaRef.current)textAreaRef.current.selectionStart=textAreaRef.current.selectionEnd=s+2},0) 
                                            }
                                            if ((e.ctrlKey||e.metaKey) && e.key === 's') { 
                                                e.preventDefault(); 
                                                !isReadOnly && saveFile(activeFile.id) 
                                            }
                                        }}
                                        onScroll={(e) => { if(lineNumRef.current) lineNumRef.current.scrollTop = e.currentTarget.scrollTop }}
                                        spellCheck={false}
                                        className="flex-1 h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono leading-[1.5rem] pt-4 px-2 resize-none outline-none border-none"
                                        style={{ 
                                            fontSize: config.fontSize, 
                                            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                                            whiteSpace: config.wordWrap ? 'pre-wrap' : 'pre'
                                        }}
                                    />
                                    {config.minimap && <div className="w-16 h-full bg-[#1e1e1e] border-l border-[#2b2b2b] opacity-50 pointer-events-none"></div>}
                                </div>
                                {!isReadOnly && <div className={clsx("border-t border-[#2b2b2b] bg-[#18181b] flex flex-col transition-all", showConsole?"h-32":"h-6")}>
                                    <div className="h-6 px-3 flex items-center justify-between text-xs bg-[#2b2b2b] cursor-pointer hover:bg-[#333]" onClick={()=>setShowConsole(!showConsole)}>
                                        <span className="font-bold text-[#cccccc] flex items-center gap-2"><TerminalIcon size={12}/> TERMINAL</span><ChevronDown size={14} className={clsx("transition-transform", !showConsole&&"-rotate-90")}/>
                                    </div>
                                    {showConsole && (
                                        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-[#cccccc] space-y-1">
                                            {consoleLogs.map((l,i)=><div key={i} className="border-b border-[#333] pb-0.5">{l}</div>)}
                                            <div ref={terminalEndRef} />
                                        </div>
                                    )}
                                </div>}
                            </div>
                            {showPreview && (
                                <div className="flex-1 bg-white h-full relative flex flex-col">
                                    <div className="h-8 bg-[#f3f3f3] border-b border-[#ddd] flex items-center px-3 text-xs text-[#555] justify-between"><span>{t('preview')}</span><button onClick={()=>setShowPreview(false)}><X size={12}/></button></div>
                                    <iframe srcDoc={outputSrc} className="flex-1 w-full border-none bg-white" sandbox="allow-scripts"/>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#555]"><Files size={64} className="mb-4 opacity-20"/><p>{t('select_to_start')}</p></div>
                )}
                
                <div className="h-5 bg-[#007acc] text-white flex items-center px-3 text-[10px] justify-between shrink-0 select-none cursor-default">
                    <div className="flex gap-3"><div className="flex items-center gap-1"><GitBranch size={10} /> main</div></div>
                    <div className="flex gap-3">
                        {activeFile && <span>{t('ln')} {(activeFile.content||'').split('\n').length}, {t('col')} 1</span>}
                        <span>UTF-8</span>
                        <span className="uppercase">{activeFile?.language||'TXT'}</span>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {ctxMenu.visible && !isReadOnly && (
                <div className="absolute z-50 bg-[#252526] border border-[#454545] shadow-xl rounded py-1 min-w-[160px] text-xs text-[#cccccc]" style={{ top: ctxMenu.y, left: ctxMenu.x }} onClick={e => e.stopPropagation()}>
                    {ctxMenu.itemId ? (
                        <>
                            <div onClick={(e) => { e.stopPropagation(); setRenamingId(ctxMenu.itemId); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Edit3 size={12}/> {t('rename')}</div>
                            <div onClick={(e) => { e.stopPropagation(); deleteFiles(selectedIds.includes(ctxMenu.itemId!) ? selectedIds : [ctxMenu.itemId!]); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2 text-red-400"><Trash2 size={12}/> {t('delete')}</div>
                            <div className="h-[1px] bg-[#454545] my-1" />
                            <div onClick={(e) => { e.stopPropagation(); handleDownloadFile(ctxMenu.itemId!); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Download size={12}/> {t('download')}</div>
                        </>
                    ) : (
                        <>
                            <div onClick={(e) => { e.stopPropagation(); createFile('file'); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FilePlus size={12}/> {t('new_file')}</div>
                            <div onClick={(e) => { e.stopPropagation(); createFile('folder'); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FolderPlus size={12}/> {t('new_folder')}</div>
                            <div className="h-[1px] bg-[#454545] my-1" />
                            <div onClick={(e) => { e.stopPropagation(); uploadFileRef.current?.click(); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Upload size={12}/> {t('upload')}</div>
                            <div onClick={(e) => { e.stopPropagation(); uploadFolderRef.current?.click(); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FolderInput size={12}/> Import Folder</div>
                        </>
                    )}
                </div>
            )}

            {/* Global Hidden Inputs for Upload */}
            <input type="file" ref={uploadFileRef} hidden multiple onChange={handleFileUpload} />
            {/* @ts-ignore */}
            <input type="file" ref={uploadFolderRef} hidden webkitdirectory="" directory="" multiple onChange={handleFolderUpload} />

            {/* Command Palette Overlay */}
            {showPalette && (
                <div className="absolute inset-0 bg-black/20 z-[100] flex justify-center pt-2" onClick={() => setShowPalette(false)}>
                    <div className="w-[500px] bg-[#252526] border border-[#454545] shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[300px]" onClick={e => e.stopPropagation()}>
                        <div className="p-2 border-b border-[#454545]">
                            <input 
                                ref={paletteInputRef}
                                type="text" 
                                className="w-full bg-[#3c3c3c] border border-blue-500 rounded px-2 py-1 text-sm text-white outline-none" 
                                placeholder="Type a command..."
                                value={paletteQuery}
                                onChange={e => setPaletteQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredCommands.map(cmd => (
                                <div key={cmd.id} onClick={() => { cmd.action(); setShowPalette(false) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer text-xs flex items-center justify-between group">
                                    <span>{cmd.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </VSCodeContext.Provider>
  )
}