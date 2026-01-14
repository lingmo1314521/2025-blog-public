// components/macos/apps/storage-manager.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { HardDrive, Trash2, Download, RefreshCw, Database, FileJson, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'

// 定义系统已知的存储 Key，方便显示友好的名称
const KNOWN_KEYS: Record<string, string> = {
  'macos-terminal-fs': 'Terminal File System',
  'macos-notes': 'Notes App Data',
  'vscode-fs-v8': 'VS Code Projects',
  'macos-calendar-events': 'Calendar Events',
  'macos-lang': 'System Language Preference',
  'macos-dock-layout': 'Dock Layout Config',
  'macos-wallpaper': 'Desktop Wallpaper Setting'
}

interface StorageItem {
  key: string
  name: string
  size: number // bytes
  preview: string
}

export const StorageManager = () => {
  const { t } = useI18n()
  const { addNotification } = useOs()
  
  const [items, setItems] = useState<StorageItem[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 格式化字节大小
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // 扫描 LocalStorage
  const scanStorage = () => {
    setRefreshing(true)
    const newItems: StorageItem[] = []
    let total = 0

    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        // 仅过滤本系统相关的 key
        if (key && (key.startsWith('macos-') || key.startsWith('vscode-'))) {
          const content = localStorage.getItem(key) || ''
          // 估算大小
          const size = new Blob([content]).size 
          total += size
          newItems.push({
            key,
            name: KNOWN_KEYS[key] || key,
            size,
            preview: content
          })
        }
      }
    }

    setItems(newItems)
    setTotalSize(total)
    setTimeout(() => setRefreshing(false), 500)
  }

  useEffect(() => {
    scanStorage()
  }, [])

  // 动作：删除
  const handleDelete = (key: string) => {
    if (confirm(t('confirm_delete'))) {
      localStorage.removeItem(key)
      addNotification({ title: t('storage_manager'), message: t('delete_success'), type: 'success', icon: <Trash2 size={18}/> })
      scanStorage()
      if (selectedKey === key) setSelectedKey(null)
    }
  }

  // 动作：下载
  const handleDownload = (item: StorageItem) => {
    const blob = new Blob([item.preview], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.key}_backup.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotification({ title: t('storage_manager'), message: t('download_success'), type: 'success', icon: <Download size={18}/> })
  }

  // 动作：恢复出厂设置
  const handleFactoryReset = () => {
    const confirmStr = prompt(t('factory_reset_confirm'))
    if (confirmStr === 'RESET') {
       localStorage.clear()
       window.location.reload()
    } else {
       alert(t('reset_cancel'))
    }
  }

  const selectedItem = items.find(i => i.key === selectedKey)

  return (
    <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] text-black dark:text-white font-sans select-none">
      
      {/* Sidebar */}
      <div className="w-56 bg-[#e8e8ea] dark:bg-[#252525] border-r border-gray-300 dark:border-white/10 flex flex-col pt-6 px-3">
         <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white shadow-lg mb-3">
                <HardDrive size={40} />
            </div>
            <div className="font-bold text-lg">{t('storage_manager')}</div>
            <div className="text-xs text-gray-500">{t('total_used')}: {formatBytes(totalSize)}</div>
         </div>

         <div className="flex-1 space-y-1">
             <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('locations')}</div>
             <div className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md text-sm">
                 <Database size={16} /> {t('local_storage')}
             </div>
         </div>

         <div className="mb-4">
             <button 
                onClick={handleFactoryReset}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-md text-xs font-bold transition-colors"
             >
                 <AlertTriangle size={14} /> {t('factory_reset')}
             </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
         {/* Toolbar */}
         <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4">
            <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <HardDrive size={16} /> Macintosh HD - Data
            </div>
            <button onClick={scanStorage} className={clsx("p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-all", refreshing && "animate-spin")}>
                <RefreshCw size={16} />
            </button>
         </div>

         {/* List Header */}
         <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 dark:bg-[#252525] text-xs font-bold text-gray-500 border-b border-gray-200 dark:border-white/10">
             <div className="col-span-6">{t('name')}</div>
             <div className="col-span-4">{t('key')}</div>
             <div className="col-span-2 text-right">{t('size')}</div>
         </div>

         {/* List Items */}
         <div className="flex-1 overflow-y-auto">
             {items.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                     <Database size={48} className="opacity-20" />
                     <div>{t('storage_empty')}</div>
                 </div>
             ) : (
                 items.map(item => (
                     <div 
                        key={item.key}
                        onClick={() => { setSelectedKey(item.key); setShowPreview(false) }}
                        className={clsx(
                            "grid grid-cols-12 px-4 py-3 text-sm border-b border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 items-center",
                            selectedKey === item.key && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                     >
                         <div className="col-span-6 flex items-center gap-3 font-medium truncate pr-2">
                             <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500">
                                 <FileJson size={18} />
                             </div>
                             {item.name}
                         </div>
                         <div className="col-span-4 text-xs text-gray-400 font-mono truncate pr-2">{item.key}</div>
                         <div className="col-span-2 text-right text-xs font-mono">{formatBytes(item.size)}</div>
                     </div>
                 ))
             )}
         </div>

         {/* Action Footer */}
         {selectedItem && (
             <div className="h-48 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#252525] p-4 flex flex-col gap-3 transition-all">
                 <div className="flex items-center justify-between">
                     <div className="font-bold flex items-center gap-2">
                         {selectedItem.name}
                         <span className="text-xs font-normal text-gray-400 bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded">{formatBytes(selectedItem.size)}</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-md text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/20 shadow-sm">
                             {showPreview ? <EyeOff size={14} /> : <Eye size={14} />} {showPreview ? t('hide_preview') : t('preview')}
                        </button>
                        <button onClick={() => handleDownload(selectedItem)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-md text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/20 shadow-sm">
                             <Download size={14} /> {t('download')}
                        </button>
                        <button onClick={() => handleDelete(selectedItem.key)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 shadow-sm">
                             <Trash2 size={14} /> {t('delete')}
                        </button>
                     </div>
                 </div>
                 
                 {/* Preview Area */}
                 <div className="flex-1 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-2 overflow-auto relative font-mono text-xs text-gray-600 dark:text-gray-300">
                     {showPreview ? (
                         <pre className="whitespace-pre-wrap break-all">{JSON.stringify(JSON.parse(selectedItem.preview || '{}'), null, 2)}</pre>
                     ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic">
                             {t('preview_hidden')}
                         </div>
                     )}
                 </div>
             </div>
         )}
      </div>
    </div>
  )
}