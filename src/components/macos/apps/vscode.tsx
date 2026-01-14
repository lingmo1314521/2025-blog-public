'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { 
  Search, Files, Play, X, ChevronRight, ChevronDown, 
  LayoutTemplate, Plus, Upload, Download, Trash2, 
  FileCode, Settings, ToggleLeft, ToggleRight, GitBranch,
  Folder, FolderOpen, Archive, FilePlus, FolderPlus, 
  Briefcase, Edit3, FolderInput, LogOut
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import JSZip from 'jszip'

// === 1. 类型定义 ===
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

// === 新增：VSCode Props 用于接收预览文件 ===
interface VSCodeProps {
    previewFile?: {
        name: string
        content: string
        language?: string
    }
}

// === 2. 初始文件系统 ===
const INITIAL_FS: FileSystemItem[] = [
  { id: 'root-readme', parentId: null, name: 'README.md', type: 'file', language: 'markdown', content: '# VS Code Web\n\n## Marquee Selection Fixed!\n\n1. Click on empty space.\n2. Drag your mouse.\n3. Items inside the blue box will be selected!\n\nAlso supports Ctrl+Click and Shift+Click.' },
  { id: 'src', parentId: null, name: 'src', type: 'folder', isOpen: true },
  { id: 'index', parentId: 'src', name: 'index.html', type: 'file', language: 'html', content: '<h1>Hello World</h1>' },
  { id: 'css', parentId: 'src', name: 'style.css', type: 'file', language: 'css', content: 'body { color: #fff; }' },
  { id: 'utils', parentId: 'src', name: 'utils', type: 'folder', isOpen: false },
  { id: 'u1', parentId: 'utils', name: 'api.js', type: 'file', language: 'javascript', content: '' },
  { id: 'u2', parentId: 'utils', name: 'helpers.js', type: 'file', language: 'javascript', content: '' },
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

// === 3. 翻译字典 ===
const VSCODE_TEXT = {
  en: {
    explorer: 'Explorer', search: 'Search', settings: 'Settings',
    new_file: 'New File', new_folder: 'New Folder', new_project: 'New Project',
    import_file: 'Import File', import_folder: 'Import Folder',
    delete: 'Delete', rename: 'Rename', download: 'Download', export_zip: 'Export ZIP',
    run: 'Run', preview: 'Preview', terminal: 'Terminal',
    console_ready: 'Console Ready',
    del_confirm: 'Delete selected items?',
    search_ph: 'Search files...', no_res: 'No results.',
    projects: 'PROJECTS',
    tpl_vanilla: 'Vanilla HTML/JS', tpl_react: 'React App',
    editor_config: 'EDITOR CONFIGURATION',
    font_size: 'Font Size', word_wrap: 'Word Wrap', line_numbers: 'Line Numbers'
  },
  zh: {
    explorer: '资源管理器', search: '搜索', settings: '设置',
    new_file: '新建文件', new_folder: '新建文件夹', new_project: '新建项目',
    import_file: '导入文件', import_folder: '导入文件夹',
    delete: '删除', rename: '重命名', download: '下载', export_zip: '导出项目 (ZIP)',
    run: '运行', preview: '预览', terminal: '终端',
    console_ready: '控制台就绪',
    del_confirm: '确定删除选中的项目吗？',
    search_ph: '搜索文件...', no_res: '无结果',
    projects: '项目列表',
    tpl_vanilla: 'HTML/JS 基础模版', tpl_react: 'React 组件模版',
    editor_config: '编辑器配置',
    font_size: '字体大小', word_wrap: '自动换行', line_numbers: '显示行号'
  },
  mix: {
    explorer: 'Explorer 资源', search: 'Search 搜索', settings: 'Settings 设置',
    new_file: 'New File 新建', new_folder: 'New Folder 文件夹', new_project: 'New Project 项目',
    import_file: 'Import File 导入文件', import_folder: 'Import Folder 导入文件夹',
    delete: 'Delete 删除', rename: 'Rename 重命名', download: 'Download 下载', export_zip: 'Export 导出',
    run: 'Run 运行', preview: 'Preview 预览', terminal: 'Terminal 终端',
    console_ready: 'Ready 就绪',
    del_confirm: 'Delete? 确认删除?',
    search_ph: 'Search 搜索...', no_res: 'No results 无结果',
    projects: 'PROJECTS 项目',
    tpl_vanilla: 'Vanilla HTML/JS', tpl_react: 'React App',
    editor_config: 'EDITOR CONFIG 配置',
    font_size: 'Font Size 字体', word_wrap: 'Word Wrap 换行', line_numbers: 'Line Num 行号'
  }
}

// === 图标组件 ===
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

export const VSCode = ({ previewFile }: VSCodeProps) => {
  const { language } = useI18n()
  const vt = VSCODE_TEXT[language as keyof typeof VSCODE_TEXT] || VSCODE_TEXT['en']
  
  // === State ===
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(INITIAL_FS)
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeFileId, setActiveFileId] = useState<string>('')
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]) 
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  
  // UI State
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'settings'>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [outputSrc, setOutputSrc] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  
  // Menus
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean, x: number, y: number, itemId: string | null }>({ visible: false, x: 0, y: 0, itemId: null })
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  // Drag & Drop
  const [draggedIds, setDraggedIds] = useState<string[]>([])
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Box Selection (Marquee)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)
  const selectionStart = useRef<{ x: number, y: number } | null>(null)
  const fileListRef = useRef<HTMLDivElement>(null)
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([]) 

  // Config
  const [config, setConfig] = useState<EditorConfig>({ fontSize: 14, wordWrap: false, showLineNumbers: true, minimap: false })

  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)
  const uploadFileRef = useRef<HTMLInputElement>(null)
  const uploadFolderRef = useRef<HTMLInputElement>(null)

  // 判断是否为预览模式
  const isReadOnly = !!previewFile

  // === Effect: 处理预览模式或正常模式 ===
  useEffect(() => {
    if (previewFile) {
        // 预览模式：构造一个只包含该文件的临时文件系统
        const tempId = 'preview-file'
        setFileSystem([{
            id: tempId,
            parentId: null,
            name: previewFile.name,
            type: 'file',
            language: (previewFile.language as Language) || 'plaintext',
            content: previewFile.content,
            isUnsaved: false
        }])
        setOpenFiles([tempId])
        setActiveFileId(tempId)
    } else {
        // 正常模式：加载本地存储
        const saved = localStorage.getItem('vscode-fs-v8')
        if (saved) {
            try { setFileSystem(JSON.parse(saved)) } catch {}
        }
    }
  }, [previewFile])

  // Persistence (只在非预览模式下保存)
  useEffect(() => {
    if (!previewFile) {
        localStorage.setItem('vscode-fs-v8', JSON.stringify(fileSystem))
    }
  }, [fileSystem, previewFile])

  const activeFile = useMemo(() => fileSystem.find(f => f.id === activeFileId), [fileSystem, activeFileId])

  // === Logic ===

  const getFolderContents = (parentId: string | null) => {
    return fileSystem.filter(f => f.parentId === parentId).sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
  }

  const toggleFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setFileSystem(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f))
  }

  const openFile = (id: string) => {
    if (!openFiles.includes(id)) setOpenFiles([...openFiles, id])
    setActiveFileId(id)
    setShowPreview(false)
  }

  // --- Click Selection ---
  const handleItemClick = (e: React.MouseEvent, id: string, type: FileType) => {
    e.stopPropagation()
    if (type === 'folder' && !e.ctrlKey && !e.metaKey && !e.shiftKey) toggleFolder(e, id)
    if (type === 'file' && !e.ctrlKey && !e.metaKey && !e.shiftKey) openFile(id)

    if (e.ctrlKey || e.metaKey) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
        setLastSelectedId(id)
    } else if (e.shiftKey && lastSelectedId) {
        setSelectedIds(prev => [...prev, id]) 
    } else {
        setSelectedIds([id])
        setLastSelectedId(id)
    }
  }

  // --- Box Selection Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReadOnly) return // 预览模式禁用
    if (e.button !== 0) return 
    if (!e.ctrlKey && !e.metaKey) setSelectedIds([]) 
    
    setIsSelecting(true)
    setInitialSelectedIds(e.ctrlKey || e.metaKey ? selectedIds : [])
    
    if (fileListRef.current) {
        const rect = fileListRef.current.getBoundingClientRect()
        const startX = e.clientX - rect.left
        const startY = e.clientY - rect.top + fileListRef.current.scrollTop
        selectionStart.current = { x: startX, y: startY }
        setSelectionBox({ x: startX, y: startY, w: 0, h: 0 })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart.current || !fileListRef.current) return
    
    const rect = fileListRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top + fileListRef.current.scrollTop
    
    const newBox = {
        x: Math.min(currentX, selectionStart.current.x),
        y: Math.min(currentY, selectionStart.current.y),
        w: Math.abs(currentX - selectionStart.current.x),
        h: Math.abs(currentY - selectionStart.current.y)
    }
    setSelectionBox(newBox)

    const fileItems = fileListRef.current.querySelectorAll('.file-item-row')
    const newSelected = new Set(initialSelectedIds)

    fileItems.forEach((el) => {
        const htmlEl = el as HTMLElement
        const elTop = htmlEl.offsetTop
        const elLeft = htmlEl.offsetLeft
        const elWidth = htmlEl.offsetWidth
        const elHeight = htmlEl.offsetHeight
        
        const isOverlapping = !(
            elLeft > newBox.x + newBox.w ||
            elLeft + elWidth < newBox.x ||
            elTop > newBox.y + newBox.h ||
            elTop + elHeight < newBox.y
        )

        if (isOverlapping) {
            const id = htmlEl.getAttribute('data-id')
            if (id) newSelected.add(id)
        }
    })

    setSelectedIds(Array.from(newSelected))
  }

  const handleMouseUp = () => {
    setSelectionBox(null)
    setIsSelecting(false)
    selectionStart.current = null
  }

  // --- CRUD (ReadOnly check) ---
  const createItem = (type: FileType) => {
    if (isReadOnly) return
    let parentId: string | null = null
    if (selectedIds.length > 0) {
      const sel = fileSystem.find(f => f.id === selectedIds[0])
      if (sel) parentId = sel.type === 'folder' ? sel.id : sel.parentId
    }

    const id = Date.now().toString()
    const newItem: FileSystemItem = {
      id, parentId, name: type === 'folder' ? 'NewFolder' : 'untitled.js', type,
      language: 'javascript', content: type === 'file' ? '' : undefined, isOpen: true
    }

    setFileSystem(prev => {
      const next = [...prev, newItem]
      return parentId ? next.map(f => f.id === parentId ? { ...f, isOpen: true } : f) : next
    })

    if (type === 'file') { setOpenFiles(prev => [...prev, id]); setActiveFileId(id) }
    setSelectedIds([id])
    setRenamingId(id)
    setTimeout(() => renameInputRef.current?.focus(), 50)
  }

  const deleteSelected = () => {
    if (isReadOnly) return
    if (selectedIds.length === 0) return
    if (!confirm(vt.del_confirm)) return
    
    let idsToDelete = [...selectedIds]
    const getChildrenIds = (pid: string): string[] => {
        const kids = fileSystem.filter(f => f.parentId === pid)
        return [...kids.map(k => k.id), ...kids.flatMap(k => getChildrenIds(k.id))]
    }
    selectedIds.forEach(id => { idsToDelete = [...idsToDelete, ...getChildrenIds(id)] })

    setFileSystem(prev => prev.filter(f => !idsToDelete.includes(f.id)))
    setOpenFiles(prev => prev.filter(fid => !idsToDelete.includes(fid)))
    setSelectedIds([])
    if (idsToDelete.includes(activeFileId)) setActiveFileId('')
  }

  const handleRename = (id: string, newName: string) => {
    if (isReadOnly) return
    if (newName.trim()) setFileSystem(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f))
    setRenamingId(null)
  }

  // --- Uploads ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return
    const files = e.target.files; if (!files) return
    Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (ev) => {
            const id = Date.now().toString() + Math.random()
            setFileSystem(prev => [...prev, { 
                id, parentId: null, name: file.name, type: 'file', 
                language: 'javascript', content: ev.target?.result as string || '' 
            }])
        }
        reader.readAsText(file)
    })
    e.target.value = ''
  }

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return
    const files = e.target.files; if (!files) return
    const newItems: FileSystemItem[] = []
    const folderMap = new Map<string, string>()

    Array.from(files).forEach(file => {
        const path = file.webkitRelativePath
        const parts = path.split('/')
        let currentParentId: string | null = null

        for (let i = 0; i < parts.length - 1; i++) {
            const folderPath = parts.slice(0, i + 1).join('/')
            if (!folderMap.has(folderPath)) {
                const folderId = Date.now().toString() + Math.random()
                newItems.push({ id: folderId, parentId: currentParentId, name: parts[i], type: 'folder', isOpen: false })
                folderMap.set(folderPath, folderId)
                currentParentId = folderId
            } else {
                currentParentId = folderMap.get(folderPath)!
            }
        }

        const reader = new FileReader()
        reader.onload = (ev) => {
            const fileId = Date.now().toString() + Math.random()
            setFileSystem(prev => [...prev, {
                id: fileId, parentId: currentParentId, name: file.name, type: 'file',
                language: 'javascript', content: ev.target?.result as string || ''
            }])
        }
        reader.readAsText(file)
    })
    setFileSystem(prev => [...prev, ...newItems])
    e.target.value = ''
  }

  const exportZip = async () => {
    const zip = new JSZip()
    const add = (pid: string | null, folder: any) => {
      fileSystem.filter(f => f.parentId === pid).forEach(f => {
        if (f.type === 'file') folder.file(f.name, f.content || '')
        else add(f.id, folder.folder(f.name))
      })
    }
    add(null, zip)
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'project.zip'; a.click()
  }

  const loadTemplate = (key: 'vanilla' | 'react') => {
    if (isReadOnly) return
    if (confirm('Overwrite current files?')) {
        // @ts-ignore
        setFileSystem(TEMPLATES[key]); setOpenFiles([]); setActiveFileId(''); setShowTemplateMenu(false)
    }
  }

  const runCode = () => {
    if (!activeFile || activeFile.type !== 'file') return
    setShowPreview(true); setConsoleLogs([])
    let html = ''
    if (activeFile.language === 'html') html = activeFile.content || ''
    else if (activeFile.language === 'javascript') {
      html = `<html><body><script>
        const _log=console.log; console.log=(...a)=>{window.parent.postMessage({t:'log',m:a.join(' ')},'*');_log(...a)};
        try{${activeFile.content}}catch(e){console.log('Error:',e.message)}
      </script></body></html>`
      setShowConsole(true)
    } else {
      html = `<html><style>${activeFile.content}</style><body><h1>CSS Preview</h1></body></html>`
    }
    setOutputSrc(html)
  }

  // --- Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isReadOnly) return
    e.stopPropagation()
    const idsToDrag = selectedIds.includes(id) ? selectedIds : [id]
    setDraggedIds(idsToDrag)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent, id: string | null) => {
    if (isReadOnly) return
    e.preventDefault(); e.stopPropagation()
    if (id === null) { setDragOverId('root'); return }
    const target = fileSystem.find(f => f.id === id)
    if (target?.type === 'folder' && !draggedIds.includes(id)) setDragOverId(id)
  }
  const handleDrop = (e: React.DragEvent, targetPid: string | null) => {
    if (isReadOnly) return
    e.preventDefault(); e.stopPropagation(); setDragOverId(null)
    
    // External
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const id = Date.now().toString() + Math.random()
                setFileSystem(prev => [...prev, { 
                    id, parentId: targetPid, name: file.name, type: 'file', 
                    language: 'javascript', content: ev.target?.result as string || '' 
                }])
            }
            reader.readAsText(file)
        })
        return
    }

    // Internal
    if (draggedIds.length === 0) return
    const validMoves = draggedIds.filter(dragId => {
        if (dragId === targetPid) return false
        let check = targetPid
        while (check) { if (check === dragId) return false; check = fileSystem.find(f => f.id === check)?.parentId || null }
        return true
    })
    setFileSystem(prev => prev.map(f => validMoves.includes(f.id) ? { ...f, parentId: targetPid } : f))
    setDraggedIds([])
  }

  // --- Context Menu ---
  const handleContextMenu = (e: React.MouseEvent, id: string | null) => {
    if (isReadOnly) return
    e.preventDefault(); e.stopPropagation()
    if (id && !selectedIds.includes(id)) setSelectedIds([id])
    if (editorContainerRef.current) {
        const rect = editorContainerRef.current.getBoundingClientRect()
        setCtxMenu({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, itemId: id })
    }
  }

  const FileTreeItem = ({ item, depth }: { item: FileSystemItem, depth: number }) => {
    const children = getFolderContents(item.id)
    const isSelected = selectedIds.includes(item.id)
    const isOver = dragOverId === item.id
    
    return (
      <div className="select-none">
        <div 
          draggable={!isReadOnly}
          data-id={item.id}
          className={clsx(
            "file-item-row flex items-center gap-1 py-1 px-2 cursor-pointer border-l-2 text-[13px] relative",
            isSelected ? "bg-[#37373d] border-blue-400 text-white" : "border-transparent text-[#cccccc] hover:bg-[#2a2d2e]",
            isOver && "bg-[#2a2d2e] outline outline-1 outline-blue-500"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={(e) => handleDrop(e, item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id)}
          onClick={(e) => handleItemClick(e, item.id, item.type)}
        >
          <div className="w-4 shrink-0 flex justify-center" onClick={(e) => { e.stopPropagation(); toggleFolder(e, item.id) }}>
             {item.type === 'folder' && (item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </div>
          {item.type === 'folder' ? 
            (item.isOpen ? <FolderOpen size={14} className="text-blue-300 shrink-0"/> : <Folder size={14} className="text-blue-300 shrink-0"/>) 
            : <FileIcon name={item.name} type="file" isOpen={false} />
          }
          {renamingId === item.id ? (
            <input 
              ref={renameInputRef}
              defaultValue={item.name}
              className="bg-[#3c3c3c] text-white border border-blue-500 h-5 px-1 ml-1 w-full text-[13px] outline-none"
              onClick={e => e.stopPropagation()}
              onBlur={(e) => handleRename(item.id, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id, e.currentTarget.value)}
            />
          ) : (
            <span className={clsx("truncate ml-1 flex-1", item.isUnsaved && "italic text-yellow-200")}>{item.name}</span>
          )}
        </div>
        {item.type === 'folder' && item.isOpen && children.map(child => <FileTreeItem key={child.id} item={child} depth={depth + 1} />)}
      </div>
    )
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isReadOnly) return
    if (e.key === 'Tab') {
        e.preventDefault(); const t = e.target as HTMLTextAreaElement; const s = t.selectionStart; 
        const val = t.value.substring(0, s) + '  ' + t.value.substring(t.selectionEnd);
        setFileSystem(p => p.map(f => f.id === activeFileId ? { ...f, content: val, isUnsaved: true } : f))
        requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2 })
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); setFileSystem(p => p.map(f => f.id === activeFileId ? { ...f, isUnsaved: false } : f))
    }
  }

  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data?.t === 'log') setConsoleLogs(p => [...p, `> ${e.data.m}`]) }
    window.addEventListener('message', h); return () => window.removeEventListener('message', h)
  }, [])

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return []
    const res: any[] = []
    fileSystem.filter(f => f.type === 'file').forEach(f => {
        (f.content || '').split('\n').forEach((line, i) => {
            if (line.toLowerCase().includes(searchQuery.toLowerCase())) res.push({ ...f, line: i + 1, match: line.trim() })
        })
    })
    return res
  }, [fileSystem, searchQuery])

  return (
    <div ref={editorContainerRef} className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans text-sm select-none overflow-hidden border border-[#333] rounded-lg relative" onClick={() => { setCtxMenu({...ctxMenu, visible: false}); setShowTemplateMenu(false) }}>
      
      {/* 1. Activity Bar */}
      <div className="w-12 flex flex-col items-center py-3 gap-3 border-r border-[#2b2b2b] bg-[#18181b] shrink-0 z-20">
        <div onClick={() => {setSidebarView('explorer'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'explorer' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Files size={24}/></div>
        <div onClick={() => {setSidebarView('search'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'search' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Search size={24}/></div>
        <div onClick={() => {setSidebarView('settings'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer mt-auto mb-2", sidebarView === 'settings' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Settings size={24}/></div>
      </div>

      {/* 2. Sidebar */}
      {sidebarVisible && (
      <div className="w-64 bg-[#252526] flex flex-col border-r border-[#2b2b2b] shrink-0 transition-all">
        {sidebarView === 'explorer' && (
            <>
                <div className="h-10 px-3 flex items-center justify-between border-b border-[#333] shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{isReadOnly ? 'PREVIEW MODE' : vt.explorer}</span>
                    {!isReadOnly && <div className="flex gap-1 relative">
                        <button onClick={(e)=>{e.stopPropagation(); setShowTemplateMenu(!showTemplateMenu)}} className="p-1 hover:bg-[#3c3c3c] rounded" title={vt.new_project}><Briefcase size={14}/></button>
                        <button onClick={()=>createItem('file')} className="p-1 hover:bg-[#3c3c3c] rounded" title={vt.new_file}><FilePlus size={14}/></button>
                        <button onClick={()=>createItem('folder')} className="p-1 hover:bg-[#3c3c3c] rounded" title={vt.new_folder}><FolderPlus size={14}/></button>
                        <button onClick={exportZip} className="p-1 hover:bg-[#3c3c3c] rounded" title={vt.export_zip}><Archive size={14}/></button>
                        <button onClick={()=>uploadFileRef.current?.click()} className="p-1 hover:bg-[#3c3c3c] rounded" title={vt.import_file}><Upload size={14}/></button>
                        <button onClick={()=>uploadFolderRef.current?.click()} className="p-1 hover:bg-[#3c3c3c] rounded" title={vt.import_folder}><FolderInput size={14}/></button>
                        <input type="file" ref={uploadFileRef} hidden multiple onChange={handleFileUpload} />
                        {/* @ts-ignore */}
                        <input type="file" ref={uploadFolderRef} hidden webkitdirectory="" directory="" multiple onChange={handleFolderUpload} />

                        {showTemplateMenu && (
                            <div className="absolute top-7 right-0 w-40 bg-[#252526] border border-[#454545] shadow-xl rounded z-50 py-1">
                                <div className="px-3 py-1 text-xs font-bold text-gray-500 border-b border-[#333] mb-1">{vt.projects}</div>
                                <div onClick={()=>loadTemplate('vanilla')} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer text-xs">{vt.tpl_vanilla}</div>
                                <div onClick={()=>loadTemplate('react')} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer text-xs">{vt.tpl_react}</div>
                            </div>
                        )}
                    </div>}
                </div>
                {/* File Tree Root + Marquee */}
                <div 
                    ref={fileListRef}
                    className={clsx("flex-1 overflow-y-auto custom-scrollbar p-1 relative", dragOverId === 'root' && "bg-[#2a2d2e] outline outline-1 outline-blue-500")}
                    onContextMenu={(e) => handleContextMenu(e, null)}
                    onDragOver={(e) => handleDragOver(e, null)}
                    onDrop={(e) => handleDrop(e, null)}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {getFolderContents(null).map(item => <FileTreeItem key={item.id} item={item} depth={0} />)}
                    {isSelecting && selectionBox && (
                        <div className="absolute bg-blue-500/20 border border-blue-500 pointer-events-none z-50" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
                    )}
                </div>
            </>
        )}
        
        {sidebarView === 'search' && (
            <div className="p-3">
                <div className="text-[11px] font-bold uppercase mb-2">{vt.search}</div>
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={vt.search_ph} className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-blue-500 outline-none text-white text-xs px-2 py-1.5 rounded" autoFocus />
                <div className="flex-1 overflow-y-auto mt-2">
                    {filteredFiles.map((res, i) => (
                        <div key={i} onClick={() => openFile(res.id)} className="px-3 py-2 hover:bg-[#37373d] cursor-pointer border-b border-[#333]">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#e0e0e0] mb-1"><FileIcon name={res.name} type="file"/> {res.name}</div>
                            <div className="text-xs text-[#999] font-mono pl-4 line-clamp-2 bg-[#2a2d2e] p-1 rounded"><span className="text-[#666] mr-2">{res.line}:</span>{res.match}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {sidebarView === 'settings' && (
            <div className="p-4 space-y-6">
                <div className="text-[11px] font-bold uppercase text-white mb-2 border-b border-[#333] pb-2">{vt.editor_config}</div>
                <div className="space-y-2">
                    <div className="text-xs text-gray-200 flex justify-between"><span>{vt.font_size}</span><span>{config.fontSize}px</span></div>
                    <input type="range" min="10" max="24" value={config.fontSize} onChange={(e)=>setConfig({...config, fontSize: parseInt(e.target.value)})} className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>
                <div className="flex justify-between cursor-pointer items-center" onClick={()=>setConfig({...config, showLineNumbers: !config.showLineNumbers})}><span className="text-xs text-gray-200">{vt.line_numbers}</span>{config.showLineNumbers ? <ToggleRight size={24} className="text-blue-500"/> : <ToggleLeft size={24} className="text-[#666]"/>}</div>
                <div className="flex justify-between cursor-pointer items-center" onClick={()=>setConfig({...config, wordWrap: !config.wordWrap})}><span className="text-xs text-gray-200">{vt.word_wrap}</span>{config.wordWrap ? <ToggleRight size={24} className="text-blue-500"/> : <ToggleLeft size={24} className="text-[#666]"/>}</div>
            </div>
        )}
      </div>
      )}

      {/* 3. Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {activeFile ? (
            <>
                <div className="h-9 flex bg-[#252526] border-b border-[#2b2b2b] overflow-x-auto scrollbar-none">
                    {openFiles.map(fid => {
                        const f = fileSystem.find(x => x.id === fid); if (!f) return null
                        return (
                            <div key={f.id} onClick={(e)=>{e.stopPropagation(); setActiveFileId(f.id)}} className={clsx("group px-3 flex items-center gap-2 min-w-[120px] max-w-[200px] text-xs border-r border-[#2b2b2b] cursor-pointer select-none", activeFileId===f.id ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500" : "text-[#969696]")}>
                                <FileIcon name={f.name} type="file" />
                                <span className="truncate flex-1">{f.name} {isReadOnly && '(Preview)'}</span>
                                {!isReadOnly && <X size={14} className={clsx("opacity-0 hover:bg-[#444] rounded p-0.5", activeFileId===f.id ? "opacity-100" : "group-hover:opacity-100")} onClick={(e) => {
                                    e.stopPropagation()
                                    const nextOpen = openFiles.filter(id => id !== f.id)
                                    setOpenFiles(nextOpen)
                                    if(activeFileId === f.id) setActiveFileId(nextOpen[nextOpen.length-1] || '')
                                }} />}
                            </div>
                        )
                    })}
                </div>
                
                <div className="h-8 flex items-center px-4 justify-between bg-[#1e1e1e] border-b border-[#2b2b2b] shrink-0">
                    <div className="flex items-center gap-2 text-xs text-[#858585]"><span>src</span> <ChevronRight size={12}/> <span>{activeFile.name}</span></div>
                    <div className="flex items-center gap-2">
                        <button onClick={runCode} className="flex items-center gap-1 px-2 py-0.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs"><Play size={10} fill="currentColor"/> {vt.run}</button>
                        <button onClick={()=>setShowPreview(!showPreview)} className={clsx("p-1 rounded hover:bg-[#333]", showPreview?"text-white":"text-[#858585]")}><LayoutTemplate size={14}/></button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    <div className={clsx("flex flex-col h-full transition-all duration-300", showPreview ? "w-1/2 border-r border-[#2b2b2b]" : "w-full")}>
                        <div className="flex-1 relative flex">
                            {config.showLineNumbers && (
                                <div ref={lineNumRef} className="w-10 bg-[#1e1e1e] text-[#6e7681] text-right pr-2 pt-4 text-xs font-mono leading-[1.5rem] border-r border-[#2b2b2b] overflow-hidden" style={{ fontSize: config.fontSize }}>
                                    {Array.from({length: (activeFile.content||'').split('\n').length}).map((_,i)=><div key={i}>{i+1}</div>)}
                                </div>
                            )}
                            <textarea 
                                ref={textAreaRef}
                                value={activeFile.content || ''}
                                readOnly={isReadOnly}
                                onChange={(e) => !isReadOnly && setFileSystem(p => p.map(f => f.id === activeFileId ? { ...f, content: e.target.value, isUnsaved: true } : f))}
                                onKeyDown={handleEditorKeyDown}
                                onScroll={(e) => { if(lineNumRef.current) lineNumRef.current.scrollTop = e.currentTarget.scrollTop }}
                                spellCheck={false}
                                className="flex-1 h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono leading-[1.5rem] pt-4 px-2 resize-none outline-none border-none tab-4"
                                style={{ fontSize: config.fontSize, whiteSpace: config.wordWrap ? 'pre-wrap' : 'pre', fontFamily: "Menlo, Monaco, monospace" }}
                            />
                        </div>
                        {!isReadOnly && <div className={clsx("border-t border-[#2b2b2b] bg-[#18181b] flex flex-col transition-all", showConsole?"h-32":"h-6")}>
                            <div className="h-6 px-3 flex items-center justify-between text-xs bg-[#2b2b2b] cursor-pointer hover:bg-[#333]" onClick={()=>setShowConsole(!showConsole)}>
                                <span className="font-bold text-[#cccccc]">{vt.terminal}</span><ChevronDown size={14} className={clsx("transition-transform", !showConsole&&"-rotate-90")}/>
                            </div>
                            {showConsole && <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 text-[#cccccc]">{consoleLogs.length===0?<div className="text-[#666]">{vt.console_ready}</div>:consoleLogs.map((l,i)=><div key={i} className="border-b border-[#333] pb-1">{l}</div>)}</div>}
                        </div>}
                    </div>
                    {showPreview && <div className="flex-1 bg-white h-full relative flex flex-col"><div className="h-8 bg-[#f3f3f3] border-b border-[#ddd] flex items-center px-3 text-xs text-[#555] justify-between"><span>{vt.preview}</span><button onClick={()=>setShowPreview(false)} className="hover:bg-[#ddd] p-1 rounded"><X size={12}/></button></div><iframe srcDoc={outputSrc} className="flex-1 w-full border-none bg-white"/></div>}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#555]"><Files size={64} className="mb-4 opacity-20"/><p>Select a file to edit</p></div>
        )}
        <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-[11px] justify-between shrink-0 select-none cursor-default"><div className="flex gap-3"><div className="flex items-center gap-1"><GitBranch size={10} /> main</div></div><div className="flex gap-3"><div>Ln {(activeFile?.content||'').split('\n').length}</div><div>UTF-8</div><div className="uppercase">{activeFile?.language||'TXT'}</div></div></div>
      </div>

      {/* 4. Full Featured Context Menu */}
      {ctxMenu.visible && !isReadOnly && (
        <div className="absolute z-50 bg-[#252526] border border-[#454545] shadow-xl rounded py-1 min-w-[160px] text-xs text-[#cccccc]" style={{ top: ctxMenu.y, left: ctxMenu.x }}>
            {ctxMenu.itemId ? (
                <>
                    <div onClick={(e)=>{e.stopPropagation(); setRenamingId(ctxMenu.itemId); setCtxMenu({...ctxMenu,visible:false}); setTimeout(()=>renameInputRef.current?.focus(),50) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Edit3 size={12}/> {vt.rename}</div>
                    <div onClick={(e)=>{e.stopPropagation(); deleteSelected(); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2 text-red-400"><Trash2 size={12}/> {vt.delete}</div>
                    <div className="h-[1px] bg-[#454545] my-1" />
                    <div onClick={(e)=>{e.stopPropagation(); const f=fileSystem.find(x=>x.id===ctxMenu.itemId); if(f && f.type==='file'){const blob=new Blob([f.content||''],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=f.name;a.click();} setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Download size={12}/> {vt.download}</div>
                </>
            ) : (
                <>
                    <div onClick={()=>{e.stopPropagation(); setShowTemplateMenu(true); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Briefcase size={12}/> {vt.new_project}</div>
                    <div className="h-[1px] bg-[#454545] my-1" />
                    <div onClick={()=>{createItem('file'); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FilePlus size={12}/> {vt.new_file}</div>
                    <div onClick={()=>{createItem('folder'); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FolderPlus size={12}/> {vt.new_folder}</div>
                    <div className="h-[1px] bg-[#454545] my-1" />
                    <div onClick={()=>{uploadFileRef.current?.click(); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Upload size={12}/> {vt.import_file}</div>
                    <div onClick={()=>{uploadFolderRef.current?.click(); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FolderInput size={12}/> {vt.import_folder}</div>
                    <div className="h-[1px] bg-[#454545] my-1" />
                    <div onClick={()=>{exportZip(); setCtxMenu({...ctxMenu,visible:false})}} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Archive size={12}/> {vt.export_zip}</div>
                </>
            )}
        </div>
      )}
    </div>
  )
}