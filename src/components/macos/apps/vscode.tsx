'use client'

import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react'
import { 
  Files, Search, Settings, FilePlus, FolderPlus, 
  ChevronRight, ChevronDown, Play, X, LayoutTemplate, 
  Terminal as TerminalIcon, Download, Upload, Archive, Edit3, Trash2, FileCode
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import JSZip from 'jszip'

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

const INITIAL_FS: FileSystemItem[] = [
  { id: 'root-readme', parentId: null, name: 'README.md', type: 'file', language: 'markdown', content: '# VS Code Web\n\nWelcome to LynxMuse Code Editor.\n\n### Features:\n- 📂 **Folder Upload**: Right click context menu supported.\n- 🔍 **Search**: Find text in all files.\n- ⌨️ **Command Palette**: `Cmd+Shift+P`' },
  { id: 'src', parentId: null, name: 'src', type: 'folder', isOpen: true },
  { id: 'index', parentId: 'src', name: 'index.html', type: 'file', language: 'html', content: '<h1>Hello World</h1>\n<script src="./app.js"></script>' },
  { id: 'css', parentId: 'src', name: 'style.css', type: 'file', language: 'css', content: 'body {\n  background: #1e1e1e;\n  color: #fff;\n  font-family: sans-serif;\n}' },
  { id: 'js', parentId: 'src', name: 'app.js', type: 'file', language: 'javascript', content: 'console.log("System Ready");' },
]

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

export const VSCode = ({ previewFile }: VSCodeProps) => {
  const { t } = useI18n()
  const isReadOnly = !!previewFile
  const [fs, setFs] = useState<FileSystemItem[]>(INITIAL_FS)
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'settings'>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [outputSrc, setOutputSrc] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [config, setConfig] = useState<EditorConfig>({ fontSize: 14, wordWrap: true, showLineNumbers: true, minimap: false })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean, x: number, y: number, itemId: string | null }>({ visible: false, x: 0, y: 0, itemId: null })
  const [draggedIds, setDraggedIds] = useState<string[]>([])
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)
  const uploadFileRef = useRef<HTMLInputElement>(null)
  const uploadFolderRef = useRef<HTMLInputElement>(null)

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

  const activeFile = useMemo(() => fs.find(f => f.id === activeFileId), [fs, activeFileId])

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              const reader = new FileReader()
              reader.onload = (ev) => createFile('file', null, file.name, ev.target?.result as string)
              reader.readAsText(file)
          })
          e.target.value = '' 
      }
  }

  return (
    <VSCodeContext.Provider value={{
        fs, selectedIds, openFiles, activeFileId, dragOverId, renamingId, isReadOnly,
        handleItemClick, handleDragStart, handleDragOver, handleDrop, handleContextMenu,
        toggleFolder, renameFile, setRenamingId, closeTab, setActiveFileId
    }}>
        <div ref={editorContainerRef} className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans text-sm select-none overflow-hidden border border-[#333] rounded-lg relative" onClick={() => { setCtxMenu(prev => ({ ...prev, visible: false })) }}>
            
            <div className="w-12 flex flex-col items-center py-3 gap-3 border-r border-[#2b2b2b] bg-[#18181b] shrink-0 z-20">
                <div onClick={() => {setSidebarView('explorer'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'explorer' ? "text-white border-l-2 border-white" : "text-[#858585]")} title={t('explorer')}><Files size={24}/></div>
                <div onClick={() => {setSidebarView('search'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'search' ? "text-white border-l-2 border-white" : "text-[#858585]")} title={t('search_files')}><Search size={24}/></div>
                <div className="mt-auto mb-2 p-2 rounded cursor-pointer text-[#858585] hover:text-white" onClick={() => {setSidebarView('settings'); setSidebarVisible(true)}} title={t('settings')}><Settings size={24}/></div>
            </div>

            {sidebarVisible && (
            <div className="w-64 bg-[#252526] flex flex-col border-r border-[#2b2b2b] shrink-0 transition-all relative">
                {sidebarView === 'explorer' && (
                    <>
                        <div className="h-9 px-3 flex items-center justify-between bg-[#252526] text-[11px] font-bold uppercase tracking-wider text-[#bbbbbb] shrink-0 group">
                            <span>{t('explorer')}</span>
                            {!isReadOnly && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => createFile('file')} className="p-1 hover:bg-[#3c3c3c] rounded" title={t('new_file')}><FilePlus size={14}/></button>
                                <button onClick={() => createFile('folder')} className="p-1 hover:bg-[#3c3c3c] rounded" title={t('new_folder')}><FolderPlus size={14}/></button>
                            </div>}
                        </div>
                        <div className={clsx("flex-1 overflow-y-auto custom-scrollbar relative", dragOverId === 'root' && "bg-[#2a2d2e] outline outline-1 outline-blue-500")}
                            onMouseDown={(e)=> !e.ctrlKey && !e.metaKey && setSelectedIds([])}
                            onDragOver={(e) => !isReadOnly && handleDragOver(e, null)}
                            onDrop={(e) => !isReadOnly && handleDrop(e, 'root')}
                            onContextMenu={(e) => !isReadOnly && handleContextMenu(e, null)}
                        >
                            {fs.filter(f => f.parentId === null).map(item => <FileTreeItem key={item.id} item={item} depth={0} />)}
                        </div>
                    </>
                )}
                {/* Simplified Search & Settings for brevity */}
            </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                <div className="h-9 flex bg-[#252526] border-b border-[#2b2b2b] overflow-x-auto scrollbar-none">
                    {openFiles.map(fid => {
                        const f = fs.find(x => x.id === fid); if (!f) return null
                        return (
                            <div key={f.id} onClick={() => setActiveFileId(f.id)} className={clsx("group px-3 flex items-center gap-2 min-w-[120px] max-w-[200px] text-xs border-r border-[#2b2b2b] cursor-pointer select-none", activeFileId===f.id ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500" : "text-[#969696] bg-[#2d2d2d]")}>
                                <FileIcon name={f.name} type="file" />
                                <span className={clsx("truncate flex-1", f.isUnsaved && "italic")}>{f.name} {f.isUnsaved && '●'}</span>
                                <X size={14} className="opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded p-0.5" onClick={(e) => { e.stopPropagation(); closeTab(f.id) }} />
                            </div>
                        )
                    })}
                </div>
                
                {activeFile ? (
                    <>
                        <div className="h-6 flex items-center px-4 justify-between bg-[#1e1e1e] border-b border-[#2b2b2b] shrink-0">
                            <div className="flex items-center gap-1 text-xs text-[#858585]">{activeFile.name}</div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleRun} className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#333] rounded text-white text-[10px]"><Play size={10} className="text-green-500"/> {t('editor_run')}</button>
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
                                    <textarea ref={textAreaRef} value={activeFile.content || ''} readOnly={isReadOnly} onChange={(e) => updateFileContent(activeFile.id, e.target.value)} spellCheck={false} className="flex-1 h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono leading-[1.5rem] pt-4 px-2 resize-none outline-none border-none" style={{ fontSize: config.fontSize, whiteSpace: config.wordWrap ? 'pre-wrap' : 'pre' }} />
                                </div>
                            </div>
                            {showPreview && <div className="flex-1 bg-white h-full relative flex flex-col"><div className="h-8 bg-[#f3f3f3] border-b border-[#ddd] flex items-center px-3 text-xs text-[#555] justify-between"><span>{t('editor_preview')}</span><button onClick={()=>setShowPreview(false)}><X size={12}/></button></div><iframe srcDoc={outputSrc} className="flex-1 w-full border-none bg-white" sandbox="allow-scripts"/></div>}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#555]"><Files size={64} className="mb-4 opacity-20"/><p>{t('select_to_start')}</p></div>
                )}
                
                <div className="h-5 bg-[#007acc] text-white flex items-center px-3 text-[10px] justify-between shrink-0 select-none cursor-default">
                    <div>main</div>
                    <div className="flex gap-3">{activeFile && <span>{t('editor_ln')} {(activeFile.content||'').split('\n').length}, {t('editor_col')} 1</span>}<span>UTF-8</span><span className="uppercase">{activeFile?.language||'TXT'}</span></div>
                </div>
            </div>

            {ctxMenu.visible && !isReadOnly && (
                <div className="absolute z-50 bg-[#252526] border border-[#454545] shadow-xl rounded py-1 min-w-[160px] text-xs text-[#cccccc]" style={{ top: ctxMenu.y, left: ctxMenu.x }} onClick={e => e.stopPropagation()}>
                    {ctxMenu.itemId ? (
                        <>
                            <div onClick={(e) => { e.stopPropagation(); setRenamingId(ctxMenu.itemId); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Edit3 size={12}/> {t('rename')}</div>
                            <div onClick={(e) => { e.stopPropagation(); deleteFiles(selectedIds.includes(ctxMenu.itemId!) ? selectedIds : [ctxMenu.itemId!]); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2 text-red-400"><Trash2 size={12}/> {t('delete')}</div>
                            <div className="h-[1px] bg-[#454545] my-1" />
                            <div onClick={(e) => { e.stopPropagation(); handleZipExport(); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Download size={12}/> {t('export_zip')}</div>
                        </>
                    ) : (
                        <>
                            <div onClick={(e) => { e.stopPropagation(); createFile('file'); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FilePlus size={12}/> {t('new_file')}</div>
                            <div onClick={(e) => { e.stopPropagation(); createFile('folder'); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><FolderPlus size={12}/> {t('new_folder')}</div>
                            <div className="h-[1px] bg-[#454545] my-1" />
                            <div onClick={(e) => { e.stopPropagation(); uploadFileRef.current?.click(); setCtxMenu(p=>({...p,visible:false})) }} className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex gap-2"><Upload size={12}/> {t('import_file')}</div>
                        </>
                    )}
                </div>
            )}
            <input type="file" ref={uploadFileRef} hidden multiple onChange={handleFileUpload} />
        </div>
    </VSCodeContext.Provider>
  )
}