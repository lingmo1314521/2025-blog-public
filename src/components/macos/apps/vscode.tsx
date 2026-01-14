'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { 
  Search, Files, Play, X, ChevronRight, ChevronDown, 
  LayoutTemplate, Plus, Upload, Download, Trash2, 
  FileCode, Settings, ToggleLeft, ToggleRight, GitBranch,
  Folder, FolderOpen, Archive, FilePlus, FolderPlus, 
  Briefcase, Edit3, FolderInput, LogOut, Terminal as TerminalIcon,
  MoreVertical, RefreshCw
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import JSZip from 'jszip'

// ==========================================
// 1. 类型定义 (Types)
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
  isOpen?: boolean // 文件夹是否展开
  isUnsaved?: boolean
}

interface EditorConfig {
  fontSize: number
  wordWrap: boolean
  showLineNumbers: boolean
  minimap: boolean
}

interface VSCodeProps {
    previewFile?: {
        name: string
        content: string
        language?: string
    }
}

// 初始文件系统数据
const INITIAL_FS: FileSystemItem[] = [
  { id: 'root-readme', parentId: null, name: 'README.md', type: 'file', language: 'markdown', content: '# VS Code Web\n\nWelcome to LynxMuse Code Editor.\n\nFeatures:\n- Drag & Drop files\n- Marquee Selection (Box Select)\n- Import/Export Projects\n- JavaScript Console execution' },
  { id: 'src', parentId: null, name: 'src', type: 'folder', isOpen: true },
  { id: 'index', parentId: 'src', name: 'index.html', type: 'file', language: 'html', content: '<h1>Hello World</h1>\n<script src="./app.js"></script>' },
  { id: 'css', parentId: 'src', name: 'style.css', type: 'file', language: 'css', content: 'body { background: #1e1e1e; color: #fff; }' },
  { id: 'js', parentId: 'src', name: 'app.js', type: 'file', language: 'javascript', content: 'console.log("System Ready");\nconsole.log("Try editing this file!");' },
]

// ==========================================
// 2. 逻辑 Hook (FileSystem Logic)
// ==========================================

const useVirtualFileSystem = (initialData: FileSystemItem[], isReadOnly: boolean) => {
    const [fs, setFs] = useState<FileSystemItem[]>(initialData)
    const [openFiles, setOpenFiles] = useState<string[]>([])
    const [activeFileId, setActiveFileId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    
    // 初始化/持久化
    useEffect(() => {
        if (!isReadOnly) {
            const saved = localStorage.getItem('vscode-fs-v8')
            if (saved) {
                try { setFs(JSON.parse(saved)) } catch {}
            }
        } else {
            setFs(initialData) // 预览模式直接使用传入数据
            if (initialData.length > 0 && initialData[0].type === 'file') {
                setOpenFiles([initialData[0].id])
                setActiveFileId(initialData[0].id)
            }
        }
    }, [isReadOnly]) // 仅挂载时执行，或 preview 模式切换时

    useEffect(() => {
        if (!isReadOnly && fs !== initialData) {
            localStorage.setItem('vscode-fs-v8', JSON.stringify(fs))
        }
    }, [fs, isReadOnly])

    // --- CRUD ---
    const updateFileContent = (id: string, content: string) => {
        if (isReadOnly) return
        setFs(prev => prev.map(f => f.id === id ? { ...f, content, isUnsaved: true } : f))
    }

    const saveFile = (id: string) => {
        if (isReadOnly) return
        setFs(prev => prev.map(f => f.id === id ? { ...f, isUnsaved: false } : f))
    }

    const createFile = (type: FileType, parentId: string | null = null, name?: string, content?: string) => {
        if (isReadOnly) return
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
        const newItem: FileSystemItem = {
            id,
            parentId,
            name: name || (type === 'folder' ? 'New Folder' : 'untitled.txt'),
            type,
            language: 'plaintext',
            content: content || '',
            isOpen: true
        }
        setFs(prev => [...prev, newItem])
        return id
    }

    const deleteFiles = (ids: string[]) => {
        if (isReadOnly) return
        // 递归查找所有子文件 ID
        const findAllChildren = (pids: string[]): string[] => {
            const children = fs.filter(f => f.parentId && pids.includes(f.parentId)).map(f => f.id)
            if (children.length === 0) return []
            return [...children, ...findAllChildren(children)]
        }
        const allIdsToDelete = [...ids, ...findAllChildren(ids)]
        
        setFs(prev => prev.filter(f => !allIdsToDelete.includes(f.id)))
        setOpenFiles(prev => prev.filter(id => !allIdsToDelete.includes(id)))
        if (activeFileId && allIdsToDelete.includes(activeFileId)) setActiveFileId(null)
        setSelectedIds([])
    }

    const renameFile = (id: string, newName: string) => {
        if (isReadOnly || !newName.trim()) return
        setFs(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f))
    }

    const moveFiles = (ids: string[], targetParentId: string | null) => {
        if (isReadOnly) return
        // 防止移动到自己或自己的子文件夹中
        const isInvalidMove = (dragId: string, targetId: string | null) => {
            if (dragId === targetId) return true
            let current = targetId
            while (current) {
                const parent = fs.find(f => f.id === current)
                if (parent?.id === dragId) return true
                current = parent?.parentId || null
            }
            return false
        }

        const validIds = ids.filter(id => !isInvalidMove(id, targetParentId))
        setFs(prev => prev.map(f => validIds.includes(f.id) ? { ...f, parentId: targetParentId } : f))
    }

    const toggleFolder = (id: string) => {
        setFs(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f))
    }

    // --- Tab Management ---
    const closeTab = (id: string) => {
        const newOpen = openFiles.filter(fid => fid !== id)
        setOpenFiles(newOpen)
        if (activeFileId === id) {
            setActiveFileId(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null)
        }
    }

    const activateTab = (id: string) => {
        if (!openFiles.includes(id)) setOpenFiles(prev => [...prev, id])
        setActiveFileId(id)
    }

    return {
        fs, setFs,
        openFiles, activeFileId, setActiveFileId,
        selectedIds, setSelectedIds,
        updateFileContent, saveFile, createFile, deleteFiles, renameFile, moveFiles, toggleFolder,
        closeTab, activateTab
    }
}

// ==========================================
// 3. 子组件 (Sub Components)
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

// ==========================================
// 4. 主组件 (Main Component)
// ==========================================

export const VSCode = ({ previewFile }: VSCodeProps) => {
  const { t } = useI18n()
  const isReadOnly = !!previewFile

  // --- Logic Hooks ---
  const { 
      fs, setFs, 
      openFiles, activeFileId, setActiveFileId, 
      selectedIds, setSelectedIds, 
      updateFileContent, saveFile, createFile, deleteFiles, renameFile, moveFiles, toggleFolder, 
      closeTab, activateTab 
  } = useVirtualFileSystem(INITIAL_FS, isReadOnly)

  // --- UI State ---
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'settings'>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [outputSrc, setOutputSrc] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [config, setConfig] = useState<EditorConfig>({ fontSize: 14, wordWrap: false, showLineNumbers: true, minimap: false })

  // --- Interaction State ---
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean, x: number, y: number, itemId: string | null }>({ visible: false, x: 0, y: 0, itemId: null })
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  
  // Marquee Selection State
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)
  const selectionStart = useRef<{ x: number, y: number } | null>(null)
  
  // Refs
  const fileListRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const uploadFileRef = useRef<HTMLInputElement>(null)
  const uploadFolderRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Derived
  const activeFile = useMemo(() => fs.find(f => f.id === activeFileId), [fs, activeFileId])
  const filteredFiles = useMemo(() => {
      if (!searchQuery) return []
      const res: any[] = []
      fs.filter(f => f.type === 'file').forEach(f => {
          (f.content || '').split('\n').forEach((line, i) => {
              if (line.toLowerCase().includes(searchQuery.toLowerCase())) res.push({ ...f, line: i + 1, match: line.trim() })
          })
      })
      return res
  }, [fs, searchQuery])

  // --- Handlers: File System UI ---
  const getFolderContents = (parentId: string | null) => {
      return fs.filter(f => f.parentId === parentId).sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name)
          return a.type === 'folder' ? -1 : 1
      })
  }

  const handleItemClick = (e: React.MouseEvent, id: string, type: FileType) => {
      e.stopPropagation()
      // Normal click
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          if (type === 'folder') toggleFolder(id)
          else activateTab(id)
          setSelectedIds([id])
          return
      }
      // Multi select
      if (e.ctrlKey || e.metaKey) {
          setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
      } else if (e.shiftKey) {
          setSelectedIds(prev => [...prev, id]) // Simplified shift select
      }
  }

  // --- Handlers: Marquee Selection ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (isReadOnly || e.button !== 0) return
      // Clicked on empty space
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

      // Collision Detection
      const items = fileListRef.current.querySelectorAll('[data-file-id]')
      const newSelected: string[] = []
      items.forEach((el) => {
          const htmlEl = el as HTMLElement
          const elTop = htmlEl.offsetTop
          const elHeight = htmlEl.offsetHeight
          // Simple vertical intersection check for list items
          if (elTop < newBox.y + newBox.h && elTop + elHeight > newBox.y) {
              newSelected.push(htmlEl.getAttribute('data-file-id')!)
          }
      })
      if (newSelected.length > 0) setSelectedIds(newSelected)
  }

  const handleMouseUp = () => { setIsSelecting(false); setSelectionBox(null) }

  // --- Handlers: Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      if (isReadOnly) return
      e.stopPropagation()
      e.dataTransfer.setData('text/plain', JSON.stringify(selectedIds.includes(id) ? selectedIds : [id]))
      e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string | null) => {
      if (isReadOnly) return
      e.preventDefault(); e.stopPropagation()
      
      if (id === null) {
          setDragOverId('root') // Root
      } else {
          const target = fs.find(f => f.id === id)
          if (target?.type === 'folder') setDragOverId(id)
          else setDragOverId(null)
      }
  }

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
      if (isReadOnly) return
      e.preventDefault(); e.stopPropagation(); setDragOverId(null)

      // 1. Internal Move
      const data = e.dataTransfer.getData('text/plain')
      if (data) {
          try {
              const ids = JSON.parse(data)
              moveFiles(ids, targetId === 'root' ? null : targetId)
          } catch {}
          return
      }

      // 2. External File Drop
      if (e.dataTransfer.files?.length) {
          Array.from(e.dataTransfer.files).forEach(file => {
              const reader = new FileReader()
              reader.onload = (ev) => {
                  createFile('file', targetId === 'root' ? null : targetId, file.name, ev.target?.result as string)
              }
              reader.readAsText(file)
          })
      }
  }

  // --- Handlers: Editor Actions ---
  const handleRun = () => {
      if (!activeFile) return
      setShowPreview(true); setConsoleLogs([])
      if (activeFile.language === 'html') {
          setOutputSrc(activeFile.content || '')
      } else if (activeFile.language === 'javascript') {
          // Sandboxed console interception
          const script = `
            <script>
                const _log = console.log;
                console.log = (...args) => {
                    window.parent.postMessage({ type: 'console', content: args.join(' ') }, '*');
                    _log(...args);
                };
                try { ${activeFile.content} } catch(e) { console.log('Error:', e.message); }
            </script>
          `
          setOutputSrc(`<html><body>${script}</body></html>`)
          setShowConsole(true)
      } else {
          setOutputSrc(`<html><body><pre>${activeFile.content}</pre></body></html>`)
      }
  }

  useEffect(() => {
      const handler = (e: MessageEvent) => {
          if (e.data?.type === 'console') {
              setConsoleLogs(prev => [...prev, `> ${e.data.content}`])
          }
      }
      window.addEventListener('message', handler)
      return () => window.removeEventListener('message', handler)
  }, [])

  // --- Handlers: File Import/Export ---
  const handleZipExport = async () => {
      const zip = new JSZip()
      const addToZip = (pid: string | null, folder: any) => {
          fs.filter(f => f.parentId === pid).forEach(f => {
              if (f.type === 'file') folder.file(f.name, f.content || '')
              else addToZip(f.id, folder.folder(f.name))
          })
      }
      addToZip(null, zip)
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'project.zip'; a.click()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              const reader = new FileReader()
              reader.onload = (ev) => createFile('file', null, file.name, ev.target?.result as string)
              reader.readAsText(file)
          })
          e.target.value = '' // Allow re-upload
      }
  }

  // --- Context Menu ---
  const handleContextMenu = (e: React.MouseEvent, id: string | null) => {
      if (isReadOnly) return
      e.preventDefault(); e.stopPropagation()
      if (id && !selectedIds.includes(id)) setSelectedIds([id])
      
      const containerRect = editorContainerRef.current?.getBoundingClientRect()
      if (containerRect) {
          let x = e.clientX - containerRect.left
          let y = e.clientY - containerRect.top
          // Boundary check
          if (x + 150 > containerRect.width) x -= 150
          if (y + 200 > containerRect.height) y -= 200
          setCtxMenu({ visible: true, x, y, itemId: id })
      }
  }

  // --- Render Components ---
  const FileTreeItem = ({ item, depth }: { item: FileSystemItem, depth: number }) => {
      const children = getFolderContents(item.id)
      const isSelected = selectedIds.includes(item.id)
      const isOver = dragOverId === item.id

      return (
          <div className="select-none">
              <div
                  data-file-id={item.id}
                  draggable={!isReadOnly}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onClick={(e) => handleItemClick(e, item.id, item.type)}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                  className={clsx(
                      "file-item-row flex items-center gap-1 py-0.5 px-2 cursor-pointer border-l-2 text-[13px] relative transition-colors",
                      isSelected ? "bg-[#37373d] border-blue-400 text-white" : "border-transparent text-[#cccccc] hover:bg-[#2a2d2e]",
                      isOver && "bg-[#094771] outline outline-1 outline-blue-400"
                  )}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                  <div className="w-4 shrink-0 flex justify-center" onClick={(e) => { e.stopPropagation(); toggleFolder(item.id) }}>
                      {item.type === 'folder' && (item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                  </div>
                  <FileIcon name={item.name} type={item.type} isOpen={item.isOpen} />
                  
                  {renamingId === item.id ? (
                      <input 
                          ref={renameInputRef}
                          defaultValue={item.name}
                          className="bg-[#3c3c3c] text-white border border-blue-500 h-5 px-1 ml-1 w-full text-[13px] outline-none"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          onBlur={(e) => { renameFile(item.id, e.target.value); setRenamingId(null) }}
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

  // --- Main Render ---
  return (
    <div ref={editorContainerRef} className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans text-sm select-none overflow-hidden border border-[#333] rounded-lg relative" onClick={() => { setCtxMenu({...ctxMenu, visible: false}); setShowTemplateMenu(false) }}>
      
      {/* Activity Bar */}
      <div className="w-12 flex flex-col items-center py-3 gap-3 border-r border-[#2b2b2b] bg-[#18181b] shrink-0 z-20">
        <div onClick={() => {setSidebarView('explorer'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'explorer' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Files size={24}/></div>
        <div onClick={() => {setSidebarView('search'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'search' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Search size={24}/></div>
        <div className="mt-auto mb-2 p-2 rounded cursor-pointer text-[#858585] hover:text-white" onClick={() => setSidebarView('settings')}><Settings size={24}/></div>
      </div>

      {/* Sidebar */}
      {sidebarVisible && (
      <div className="w-64 bg-[#252526] flex flex-col border-r border-[#2b2b2b] shrink-0 transition-all">
        {sidebarView === 'explorer' && (
            <>
                <div className="h-9 px-3 flex items-center justify-between bg-[#252526] text-[11px] font-bold uppercase tracking-wider text-[#bbbbbb] shrink-0">
                    <span>{isReadOnly ? 'PREVIEW MODE' : 'EXPLORER'}</span>
                    {!isReadOnly && <div className="flex gap-1">
                        <button onClick={() => createFile('file')} className="p-1 hover:bg-[#3c3c3c] rounded" title="New File"><FilePlus size={14}/></button>
                        <button onClick={() => createFile('folder')} className="p-1 hover:bg-[#3c3c3c] rounded" title="New Folder"><FolderPlus size={14}/></button>
                        <button onClick={() => exportZip()} className="p-1 hover:bg-[#3c3c3c] rounded" title="Download Zip"><Archive size={14}/></button>
                        <button onClick={() => uploadFileRef.current?.click()} className="p-1 hover:bg-[#3c3c3c] rounded" title="Upload File"><Upload size={14}/></button>
                        <input type="file" ref={uploadFileRef} hidden multiple onChange={handleFileUpload} />
                    </div>}
                </div>
                
                {/* File Tree Area */}
                <div 
                    ref={fileListRef}
                    className={clsx("flex-1 overflow-y-auto custom-scrollbar relative", dragOverId === 'root' && "bg-[#2a2d2e] outline outline-1 outline-blue-500")}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDragOver={(e) => handleDragOver(e, null)}
                    onDrop={(e) => handleDrop(e, 'root')}
                    onContextMenu={(e) => handleContextMenu(e, null)}
                >
                    {getFolderContents(null).map(item => <FileTreeItem key={item.id} item={item} depth={0} />)}
                    
                    {/* Marquee Box */}
                    {isSelecting && selectionBox && (
                        <div 
                            className="absolute bg-blue-500/20 border border-blue-500 pointer-events-none z-50" 
                            style={{ 
                                left: selectionBox.x, top: selectionBox.y, 
                                width: selectionBox.w, height: selectionBox.h 
                            }} 
                        />
                    )}
                </div>
            </>
        )}

        {sidebarView === 'search' && (
            <div className="p-3">
                <div className="text-[11px] font-bold uppercase mb-2">SEARCH</div>
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search files..." 
                    className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-blue-500 outline-none text-white text-xs px-2 py-1 rounded" 
                    autoFocus 
                />
                <div className="mt-2 text-xs text-[#ccc]">
                    {filteredFiles.map(f => (
                        <div key={f.id} onClick={() => activateTab(f.id)} className="p-1 hover:bg-[#37373d] cursor-pointer flex items-center gap-2">
                            <FileCode size={12}/> {f.name} <span className="opacity-50 text-[10px]">Ln {f.line}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {activeFile ? (
            <>
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
                
                {/* Breadcrumbs & Actions */}
                <div className="h-6 flex items-center px-4 justify-between bg-[#1e1e1e] border-b border-[#2b2b2b] shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[#858585]">
                        <span>src</span> <ChevronRight size={12}/> <span>{activeFile.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRun} className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#333] rounded text-white text-[10px]"><Play size={10} className="text-green-500"/> Run</button>
                        <button onClick={() => setShowPreview(!showPreview)} className={clsx("p-1 rounded hover:bg-[#333]", showPreview && "text-white")}><LayoutTemplate size={12}/></button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Code Editor */}
                    <div className={clsx("flex flex-col h-full transition-all duration-300", showPreview ? "w-1/2 border-r border-[#2b2b2b]" : "w-full")}>
                        <div className="flex-1 relative flex">
                            {config.showLineNumbers && (
                                <div className="w-10 bg-[#1e1e1e] text-[#6e7681] text-right pr-2 pt-4 text-xs font-mono leading-[1.5rem] border-r border-[#2b2b2b] select-none">
                                    {Array.from({length: (activeFile.content||'').split('\n').length}).map((_,i)=><div key={i}>{i+1}</div>)}
                                </div>
                            )}
                            <textarea 
                                ref={editorRef}
                                value={activeFile.content || ''}
                                readOnly={isReadOnly}
                                onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Tab') {
                                        e.preventDefault();
                                        const start = e.currentTarget.selectionStart;
                                        const end = e.currentTarget.selectionEnd;
                                        const value = e.currentTarget.value;
                                        updateFileContent(activeFile.id, value.substring(0, start) + '  ' + value.substring(end));
                                        requestAnimationFrame(() => {
                                            if (editorRef.current) {
                                                editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
                                            }
                                        });
                                    }
                                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                                        e.preventDefault();
                                        saveFile(activeFile.id);
                                    }
                                }}
                                spellCheck={false}
                                className="flex-1 h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono leading-[1.5rem] pt-4 px-2 resize-none outline-none border-none whitespace-pre"
                                style={{ fontSize: config.fontSize, fontFamily: "Menlo, Monaco, 'Courier New', monospace" }}
                            />
                        </div>
                        
                        {/* Terminal Panel */}
                        <div className={clsx("border-t border-[#2b2b2b] bg-[#18181b] flex flex-col transition-all", showConsole ? "h-32" : "h-6")}>
                            <div className="h-6 px-3 flex items-center justify-between text-xs bg-[#2b2b2b] cursor-pointer hover:bg-[#333] border-t border-[#2b2b2b]" onClick={() => setShowConsole(!showConsole)}>
                                <div className="flex items-center gap-2 font-bold text-[#cccccc]"><TerminalIcon size={12}/> TERMINAL / CONSOLE</div>
                                <ChevronDown size={14} className={clsx("transition-transform", !showConsole && "-rotate-90")}/>
                            </div>
                            {showConsole && (
                                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-[#cccccc] space-y-1">
                                    {consoleLogs.length === 0 && <div className="text-[#666]">Console ready. Run code to see output.</div>}
                                    {consoleLogs.map((log, i) => (
                                        <div key={i} className="border-b border-[#333] pb-0.5">{log}</div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Panel */}
                    {showPreview && (
                        <div className="flex-1 bg-white h-full relative flex flex-col">
                            <div className="h-8 bg-[#f3f3f3] border-b border-[#ddd] flex items-center px-3 text-xs text-[#555] justify-between">
                                <span>Preview</span>
                                <button onClick={() => setShowPreview(false)} className="hover:bg-[#ddd] p-1 rounded"><X size={12}/></button>
                            </div>
                            <iframe srcDoc={outputSrc} className="flex-1 w-full border-none bg-white" sandbox="allow-scripts" />
                        </div>
                    )}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#555]">
                <Files size={64} className="mb-4 opacity-20"/>
                <p>Select a file to start editing</p>
                <div className="text-xs mt-2 opacity-50">Cmd+S to save • Drag & Drop supported</div>
            </div>
        )}
        
        {/* Footer */}
        <div className="h-5 bg-[#007acc] text-white flex items-center px-3 text-[10px] justify-between shrink-0 select-none cursor-default">
            <div className="flex gap-3"><div className="flex items-center gap-1"><GitBranch size={10} /> main</div></div>
            <div className="flex gap-3">
                {activeFile && <span>Ln {(activeFile.content||'').split('\n').length}</span>}
                <span>UTF-8</span>
                <span className="uppercase">{activeFile?.language || 'TXT'}</span>
            </div>
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu.visible && (
        <div 
            className="absolute z-50 bg-[#252526] border border-[#454545] shadow-xl rounded py-1 min-w-[160px] text-xs text-[#cccccc]" 
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
            onClick={(e) => e.stopPropagation()} // Prevent closing immediately
        >
            {ctxMenu.itemId ? (
                <>
                    <div onClick={() => { setRenamingId(ctxMenu.itemId); setCtxMenu({...ctxMenu, visible:false}); setTimeout(() => renameInputRef.current?.focus(), 50) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Edit3 size={12}/> Rename</div>
                    <div onClick={() => { deleteFiles(selectedIds.includes(ctxMenu.itemId!) ? selectedIds : [ctxMenu.itemId!]); setCtxMenu({...ctxMenu, visible:false}) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2 text-red-400"><Trash2 size={12}/> Delete</div>
                    <div className="h-[1px] bg-[#454545] my-1" />
                    <div className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Download size={12}/> Download</div>
                </>
            ) : (
                <>
                    <div onClick={() => { createFile('file'); setCtxMenu({...ctxMenu, visible:false}) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FilePlus size={12}/> New File</div>
                    <div onClick={() => { createFile('folder'); setCtxMenu({...ctxMenu, visible:false}) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FolderPlus size={12}/> New Folder</div>
                    <div className="h-[1px] bg-[#454545] my-1" />
                    <div onClick={() => { uploadFileRef.current?.click(); setCtxMenu({...ctxMenu, visible:false}) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Upload size={12}/> Upload Files</div>
                </>
            )}
        </div>
      )}
    </div>
  )
}