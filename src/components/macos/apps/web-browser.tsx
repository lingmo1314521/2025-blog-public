'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Plus, X, Search, Globe, ShieldCheck } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'

// ... BROWSER_TEXT 和 FAVORITES 常量保持不变，此处省略以节省篇幅 ...
const BROWSER_TEXT = { /* ... 保持原样 ... */ } as any
const FAVORITES = [ /* ... 保持原样 ... */ ]

interface Tab {
  id: string
  title: string
  url: string
  loading: boolean
}

// [MODIFIED] 接收 initialUrl
export const WebBrowser = ({ initialUrl }: { initialUrl?: string }) => {
  const { language } = useI18n()
  const vt = BROWSER_TEXT[language] || BROWSER_TEXT['en']
  
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: vt.new_tab, url: initialUrl || '', loading: !!initialUrl }
  ])
  const [activeTabId, setActiveTabId] = useState<string>('1')
  const [inputUrl, setInputUrl] = useState(initialUrl || '')
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // [NEW] 监听 props 变化，实现外部跳转控制
  useEffect(() => {
    if (initialUrl && initialUrl !== activeTab.url) {
       navigate(initialUrl)
    }
  }, [initialUrl])

  const createTab = () => {
    const newId = Date.now().toString()
    setTabs([...tabs, { id: newId, title: vt.new_tab, url: '', loading: false }])
    setActiveTabId(newId)
    setInputUrl('')
  }

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (tabs.length === 1) return 
    const newTabs = tabs.filter(t => t.id !== id)
    setTabs(newTabs)
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
      setInputUrl(newTabs[newTabs.length - 1].url)
    }
  }

  const navigate = (url: string) => {
    if (!url) return
    let target = url
    if (!url.startsWith('http') && !url.startsWith('/')) {
        target = `https://${url}`
    }
    
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: target, title: target, loading: true } : t))
    setInputUrl(target)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') navigate(inputUrl)
  }

  const handleIframeLoad = () => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, loading: false, title: t.url.replace('https://', '').split('/')[0] || vt.new_tab } : t))
  }

  // ... Render 部分保持大部分不变，除了 navigate 调用 ...
  return (
    <div className="flex flex-col h-full w-full bg-[#f1f1f1] dark:bg-[#252525] text-black dark:text-white">
      {/* Tab Bar */}
      <div className="h-9 flex items-end px-2 gap-1 bg-[#dcdcdc] dark:bg-[#1c1c1c] pt-2 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
            <div 
                key={tab.id}
                onClick={() => { setActiveTabId(tab.id); setInputUrl(tab.url) }}
                className={clsx(
                    "flex-1 min-w-[120px] max-w-[240px] h-full rounded-t-lg flex items-center px-3 gap-2 text-xs select-none cursor-default relative group transition-colors",
                    activeTabId === tab.id 
                        ? "bg-[#f1f1f1] dark:bg-[#252525] shadow-sm z-10" 
                        : "bg-[#cfcfcf] dark:bg-[#1a1a1a] hover:bg-[#e0e0e0] dark:hover:bg-[#333] text-gray-500"
                )}
            >
                <Globe size={12} className={activeTabId === tab.id ? "text-blue-500" : "opacity-50"} />
                <span className="truncate flex-1 font-medium">{tab.url ? tab.title : vt.new_tab}</span>
                <div onClick={(e) => closeTab(e, tab.id)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 opacity-0 group-hover:opacity-100">
                    <X size={10} />
                </div>
            </div>
        ))}
        <button onClick={createTab} className="w-8 h-7 flex items-center justify-center hover:bg-black/5 rounded-md text-gray-500 mb-0.5"><Plus size={16} /></button>
      </div>

      {/* Toolbar */}
      <div className="h-12 bg-[#f1f1f1] dark:bg-[#252525] flex items-center px-4 gap-4 border-b border-gray-200 dark:border-black/20 shrink-0">
        <div className="flex gap-4 text-gray-500">
            <ArrowLeft size={18} className="hover:text-black dark:hover:text-white cursor-pointer" />
            <ArrowRight size={18} className="hover:text-black dark:hover:text-white cursor-pointer opacity-50" />
            <RotateCw size={16} className="hover:text-black dark:hover:text-white cursor-pointer mt-0.5" onClick={() => navigate(inputUrl)} />
        </div>
        <div className="flex-1 h-8 bg-[#e3e3e3] dark:bg-[#1a1a1a] rounded-lg flex items-center px-3 gap-2 group focus-within:ring-2 focus-within:ring-blue-500/50 transition-all border border-transparent dark:border-white/5">
            <ShieldCheck size={12} className="text-gray-500 dark:text-gray-400" />
            <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-sm text-center group-focus-within:text-left transition-all"
                placeholder={vt.search_placeholder}
            />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white dark:bg-[#1e1e1e] overflow-hidden">
        {activeTab.loading && <div className="absolute top-0 left-0 w-full h-1 bg-blue-100"><div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]" style={{width: '30%'}} /></div>}
        
        {activeTab.url ? (
            <iframe 
                ref={iframeRef}
                src={activeTab.url} 
                className="w-full h-full border-none bg-white"
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title="Browser View"
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-10 pb-20 animate-in fade-in zoom-in duration-300">
                <div className="text-5xl font-bold text-gray-300 dark:text-white/20 select-none tracking-tight">Safari</div>
                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                    {FAVORITES.map(fav => (
                        <div key={fav.name} onClick={() => navigate(fav.url)} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-16 h-16 bg-white dark:bg-[#333] rounded-xl shadow-sm group-hover:shadow-md flex items-center justify-center text-3xl select-none text-gray-700 dark:text-gray-200">
                                {fav.icon}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium group-hover:text-blue-500">{fav.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}