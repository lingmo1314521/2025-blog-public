// components/macos/apps/vscode.tsx
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { 
  Search, Files, Play, X, ChevronRight, ChevronDown, 
  LayoutTemplate, Plus, Upload, Download, Trash2, 
  FileCode, Settings, ToggleLeft, ToggleRight, GitBranch,
  Folder, FolderOpen, Archive, FilePlus, FolderPlus, 
  Briefcase, Edit3, FolderInput
} from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import JSZip from 'jszip'

// === 类型定义 ===
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

// === 预览模式 Props ===
interface VSCodeProps {
    previewFile?: {
        name: string
        content: string
        language?: string
    }
}

// === 初始文件系统 ===
const INITIAL_FS: FileSystemItem[] = [
  { id: 'root-readme', parentId: null, name: 'README.md', type: 'file', language: 'markdown', content: '# VS Code Web\n\nWelcome to LynxMuse Code Editor.' },
  { id: 'src', parentId: null, name: 'src', type: 'folder', isOpen: true },
  { id: 'index', parentId: 'src', name: 'index.ts', type: 'file', language: 'typescript', content: 'console.log("Hello World");' },
]

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
  const { t } = useI18n()
  
  // === State ===
  // 如果有 previewFile，使用临时文件系统，否则加载本地存储
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(INITIAL_FS)
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeFileId, setActiveFileId] = useState<string>('')
  
  // UI State
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'settings'>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [config, setConfig] = useState<EditorConfig>({ fontSize: 14, wordWrap: false, showLineNumbers: true, minimap: false })

  // Refs
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)

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

  // ... (保留之前的辅助函数，如 getFolderContents, toggleFolder 等，这里为了简洁省略重复逻辑，只展示关键渲染部分)
  // 为简化代码，预览模式下禁用大部分文件操作
  const isReadOnly = !!previewFile

  const getFolderContents = (parentId: string | null) => fileSystem.filter(f => f.parentId === parentId)

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans text-sm select-none overflow-hidden border border-[#333] rounded-lg relative">
      
      {/* 1. Activity Bar */}
      <div className="w-12 flex flex-col items-center py-3 gap-3 border-r border-[#2b2b2b] bg-[#18181b] shrink-0 z-20">
        <div onClick={() => {setSidebarView('explorer'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer", sidebarView === 'explorer' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Files size={24}/></div>
        <div onClick={() => {setSidebarView('settings'); setSidebarVisible(true)}} className={clsx("p-2 rounded cursor-pointer mt-auto mb-2", sidebarView === 'settings' ? "text-white border-l-2 border-white" : "text-[#858585]")}><Settings size={24}/></div>
      </div>

      {/* 2. Sidebar */}
      {sidebarVisible && (
      <div className="w-64 bg-[#252526] flex flex-col border-r border-[#2b2b2b] shrink-0 transition-all">
        {sidebarView === 'explorer' && (
            <>
                <div className="h-10 px-3 flex items-center justify-between border-b border-[#333] shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{isReadOnly ? 'PREVIEW MODE' : 'EXPLORER'}</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 relative">
                    {/* 简单渲染文件树 */}
                    {fileSystem.map(item => (
                         <div 
                            key={item.id}
                            onClick={() => setActiveFileId(item.id)}
                            className={clsx("flex items-center gap-1 py-1 px-2 cursor-pointer text-[13px]", activeFileId === item.id && "bg-[#37373d] text-white")}
                         >
                             <FileIcon name={item.name} type={item.type} />
                             <span>{item.name}</span>
                         </div>
                    ))}
                </div>
            </>
        )}
        
        {sidebarView === 'settings' && (
            <div className="p-4 space-y-6">
                 <div className="space-y-2">
                    <div className="text-xs text-gray-200 flex justify-between"><span>Font Size</span><span>{config.fontSize}px</span></div>
                    <input type="range" min="10" max="24" value={config.fontSize} onChange={(e)=>setConfig({...config, fontSize: parseInt(e.target.value)})} className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>
                <div className="flex justify-between cursor-pointer items-center" onClick={()=>setConfig({...config, showLineNumbers: !config.showLineNumbers})}><span className="text-xs text-gray-200">Line Numbers</span>{config.showLineNumbers ? <ToggleRight size={24} className="text-blue-500"/> : <ToggleLeft size={24} className="text-[#666]"/>}</div>
            </div>
        )}
      </div>
      )}

      {/* 3. Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {activeFile ? (
            <>
                {/* Tabs */}
                <div className="h-9 flex bg-[#252526] border-b border-[#2b2b2b] overflow-x-auto scrollbar-none">
                     <div className={clsx("group px-3 flex items-center gap-2 min-w-[120px] max-w-[200px] text-xs border-r border-[#2b2b2b] cursor-pointer select-none bg-[#1e1e1e] text-white border-t-2 border-t-blue-500")}>
                        <FileIcon name={activeFile.name} type="file" />
                        <span className="truncate flex-1">{activeFile.name} {isReadOnly && '(Preview)'}</span>
                        {!isReadOnly && <X size={14} className="opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded p-0.5" />}
                    </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden relative">
                    <div className="w-full flex">
                            {config.showLineNumbers && (
                                <div ref={lineNumRef} className="w-10 bg-[#1e1e1e] text-[#6e7681] text-right pr-2 pt-4 text-xs font-mono leading-[1.5rem] border-r border-[#2b2b2b] overflow-hidden" style={{ fontSize: config.fontSize }}>
                                    {Array.from({length: (activeFile.content||'').split('\n').length}).map((_,i)=><div key={i}>{i+1}</div>)}
                                </div>
                            )}
                            <textarea 
                                ref={textAreaRef}
                                value={activeFile.content || ''}
                                readOnly={isReadOnly}
                                onChange={(e) => !isReadOnly && setFileSystem(p => p.map(f => f.id === activeFileId ? { ...f, content: e.target.value } : f))}
                                onScroll={(e) => { if(lineNumRef.current) lineNumRef.current.scrollTop = e.currentTarget.scrollTop }}
                                spellCheck={false}
                                className="flex-1 h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono leading-[1.5rem] pt-4 px-2 resize-none outline-none border-none tab-4"
                                style={{ fontSize: config.fontSize, whiteSpace: config.wordWrap ? 'pre-wrap' : 'pre', fontFamily: "Menlo, Monaco, monospace" }}
                            />
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#555]"><Files size={64} className="mb-4 opacity-20"/><p>No file open</p></div>
        )}
        <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-[11px] justify-between shrink-0 select-none cursor-default">
            <div className="flex gap-3"><div className="flex items-center gap-1"><GitBranch size={10} /> main</div></div>
            <div className="uppercase">{activeFile?.language||'TXT'}</div>
        </div>
      </div>
    </div>
  )
}