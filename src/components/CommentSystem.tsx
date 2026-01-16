'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Server, RefreshCw } from 'lucide-react' 

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  compact?: boolean
  reloadKey?: number 
}

export default function CommentSystem({ slug, title, compact = false, reloadKey = 0 }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')
  const [giscusLoaded, setGiscusLoaded] = useState(false)
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  
  const giscusContainerRef = useRef<HTMLDivElement>(null)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  // Giscus 初始化 (保持不变)
  const initGiscus = () => {
    if (!giscusContainerRef.current) return
    try {
      giscusContainerRef.current.innerHTML = ''
      const script = document.createElement('script')
      script.src = 'https://giscus.app/client.js'
      script.async = true
      script.crossOrigin = 'anonymous'
      
      script.setAttribute('data-repo', 'lingmo1314521/my-blog-comments')
      script.setAttribute('data-repo-id', 'R_kgDOQmpfyg')
      script.setAttribute('data-category', 'General')
      script.setAttribute('data-category-id', 'DIC_kwDOQmpfys4Czpli')
      script.setAttribute('data-mapping', 'pathname') 
      script.setAttribute('data-term', slug)
      script.setAttribute('data-strict', '0')
      script.setAttribute('data-reactions-enabled', '1')
      script.setAttribute('data-emit-metadata', '0')
      script.setAttribute('data-input-position', 'top') 
      script.setAttribute('data-theme', compact ? 'noborder_light' : 'light') 
      script.setAttribute('data-lang', 'zh-CN')
      
      script.onload = () => {
        const checkIframe = () => {
          const iframe = giscusContainerRef.current?.querySelector('iframe.giscus-frame')
          if (iframe) setGiscusLoaded(true)
          else setTimeout(checkIframe, 500)
        }
        setTimeout(checkIframe, 1000)
      }
      
      script.onerror = () => setGiscusLoaded(false)
      giscusContainerRef.current.appendChild(script)
    } catch (error) {
      console.error('Giscus init failed:', error)
      setGiscusLoaded(false)
    }
  }

  // Twikoo 初始化
  const initTwikoo = () => {
    // ⚠️ 请确保这里替换成你自己的 EnvId
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID || 'https://your-twikoo.vercel.app' 

    // 彻底清理旧的脚本和 DOM
    const oldScripts = document.querySelectorAll('script[src*="twikoo"]')
    oldScripts.forEach(script => script.remove())
    
    if (twikooContainerRef.current) {
        twikooContainerRef.current.innerHTML = '<div id="twikoo"></div>'
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js'
    script.async = true
    
    script.onload = () => {
      // 延时一点点确保 DOM 准备好
      setTimeout(() => {
          if (window.twikoo && twikooContainerRef.current) {
            window.twikoo.init({
              envId: envId,
              el: '#twikoo', // 必须匹配上面的 innerHTML ID
              path: compact ? `/messages/${slug}` : `/blog/${slug}`,
              lang: 'zh-CN',
              onCommentLoaded: () => {
                  setTwikooLoaded(true)
              }
            })
          }
      }, 50)
    }
    document.body.appendChild(script)
  }

  const handleSystemSwitch = (system: CommentSystemType) => {
    if (system === currentSystem) return
    setCurrentSystem(system)
    if (system === 'giscus') setGiscusLoaded(false)
    else setTwikooLoaded(false)
    try { localStorage.setItem('preferred-comment-system', system) } catch (e) {}
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferred-comment-system') as CommentSystemType
      if (saved) setCurrentSystem(saved)
    } catch (e) {}
  }, [])
  
  useEffect(() => {
    setTwikooLoaded(false)
    setGiscusLoaded(false)
    
    // 增加一点防抖
    const timer = setTimeout(() => {
        if (currentSystem === 'giscus') initGiscus()
        else initTwikoo()
    }, 100)
    return () => clearTimeout(timer)
  }, [currentSystem, slug, reloadKey])

  declare global {
    interface Window { twikoo?: any }
  }

  const containerClass = compact 
    ? "w-full h-full flex flex-col imessage-mode bg-white dark:bg-[#1e1e1e]" 
    : "mx-auto w-full max-w-[1140px] px-6 pb-12 max-sm:px-0"

  const cardClass = compact
    ? "relative w-full h-full flex flex-col"
    : "relative w-full rounded-xl border border-gray-300/70 bg-white/95 p-8 shadow-sm backdrop-blur-sm max-sm:rounded-none max-sm:p-4"

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        
        {!compact && (
          <div className="mb-6 pb-4 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">💬 文章评论</h3>
              <p className="mt-1 text-sm text-gray-500">欢迎留下你的看法和见解</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">评论系统：</span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button onClick={() => handleSystemSwitch('giscus')} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${currentSystem === 'giscus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  Giscus
                </button>
                <button onClick={() => handleSystemSwitch('twikoo')} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${currentSystem === 'twikoo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  Twikoo
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className={`flex-1 min-h-0 relative ${compact ? 'overflow-y-auto scrollbar-none' : ''}`}>
            {currentSystem === 'giscus' && (
            <div className="h-full">
                {!giscusLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60 h-full">
                    <RefreshCw className="mb-2 h-6 w-6 animate-spin text-gray-400" />
                    <p className="text-xs text-gray-500">Connecting to GitHub...</p>
                </div>
                )}
                <div ref={giscusContainerRef} className="w-full min-h-[200px]" style={{ display: giscusLoaded ? 'block' : 'none' }} />
            </div>
            )}
            
            {currentSystem === 'twikoo' && (
            <div className="h-full">
                {!twikooLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60 h-full">
                    <RefreshCw className="mb-2 h-6 w-6 animate-spin text-gray-400" />
                    <p className="text-xs text-gray-500">Syncing Messages...</p>
                </div>
                )}
                <div ref={twikooContainerRef} className="w-full min-h-[200px] pb-4" />
            </div>
            )}
        </div>

        {compact && (
            <div className="shrink-0 h-6 flex items-center justify-center gap-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/5 z-20 select-none">
                <button onClick={() => handleSystemSwitch('twikoo')} className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'twikoo' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}>
                    <MessageSquare size={9} /> Twikoo
                </button>
                <div className="w-[1px] h-2 bg-gray-200 dark:bg-white/10"></div>
                <button onClick={() => handleSystemSwitch('giscus')} className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'giscus' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}>
                    <Server size={9} /> GitHub
                </button>
            </div>
        )}
      </div>
    </div>
  )
}