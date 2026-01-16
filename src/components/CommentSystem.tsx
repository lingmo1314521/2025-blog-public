'use client'

import { useState, useEffect, useRef } from 'react'
// 引入图标用于美化切换器
import { MessageSquare, Server } from 'lucide-react' 

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  compact?: boolean // 是否为 iMessage 紧凑模式
}

export default function CommentSystem({ slug, title, compact = false }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('giscus')
  const [giscusLoaded, setGiscusLoaded] = useState(false)
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  
  const giscusContainerRef = useRef<HTMLDivElement>(null)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

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
      // iMessage 模式下输入框在底部，普通模式在顶部
      script.setAttribute('data-input-position', compact ? 'bottom' : 'top') 
      // iMessage 模式使用无边框主题，融合度更高
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

  const initTwikoo = () => {
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID
    if (!envId) return 

    const oldScripts = document.querySelectorAll('script[src*="twikoo"]')
    oldScripts.forEach(script => script.remove())
    
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js'
    script.async = true
    
    script.onload = () => {
      if (window.twikoo && twikooContainerRef.current) {
        window.twikoo.init({
          envId: envId,
          el: twikooContainerRef.current,
          path: compact ? `/messages/${slug}` : `/blog/${slug}`,
          lang: 'zh-CN',
          onCommentLoaded: () => setTwikooLoaded(true)
        })
      }
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
      if (saved === 'giscus' || saved === 'twikoo') setCurrentSystem(saved)
    } catch (e) {}
  }, [])
  
  useEffect(() => {
    if (currentSystem === 'giscus') setTimeout(() => initGiscus(), 100)
    else setTimeout(() => initTwikoo(), 100)
  }, [currentSystem, slug])

  declare global {
    interface Window { twikoo?: any }
  }

  // --- 样式逻辑 ---
  // iMessage 模式：无外边距，添加特殊类名用于 CSS 魔改
  const containerClass = compact 
    ? "w-full h-full flex flex-col imessage-mode" 
    : "mx-auto w-full max-w-[1140px] px-6 pb-12 max-sm:px-0"

  // iMessage 模式：透明背景；普通模式：白底卡片
  const cardClass = compact
    ? "relative w-full flex-1 flex flex-col"
    : "relative w-full rounded-xl border border-gray-300/70 bg-white/95 p-8 shadow-sm backdrop-blur-sm max-sm:rounded-none max-sm:p-4"

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        
        {/* 1. 顶部标题栏：仅在博客普通模式下显示 */}
        {!compact && (
          <div className="mb-6 pb-4 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">💬 文章评论</h3>
              <p className="mt-1 text-sm text-gray-500">欢迎留下你的看法和见解</p>
            </div>
            
            {/* 普通模式切换器 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">评论系统：</span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => handleSystemSwitch('giscus')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentSystem === 'giscus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Giscus {currentSystem === 'giscus' && !giscusLoaded && <span className="ml-1 h-1.5 w-1.5 animate-ping rounded-full bg-blue-500"></span>}
                </button>
                <button
                  onClick={() => handleSystemSwitch('twikoo')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentSystem === 'twikoo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Twikoo {currentSystem === 'twikoo' && !twikooLoaded && <span className="ml-1 h-1.5 w-1.5 animate-ping rounded-full bg-blue-500"></span>}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 2. 评论内容区 */}
        <div className={`flex-1 ${compact ? 'overflow-y-auto px-4 py-2' : ''}`}>
            {currentSystem === 'giscus' && (
            <div>
                {!giscusLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                    <p className="text-xs text-gray-500">Connecting to GitHub...</p>
                    <button onClick={initGiscus} className="mt-2 text-xs text-blue-500 hover:underline">Retry</button>
                </div>
                )}
                <div ref={giscusContainerRef} className="w-full min-h-[200px]" style={{ display: giscusLoaded ? 'block' : 'none' }} />
            </div>
            )}
            
            {currentSystem === 'twikoo' && (
            <div>
                {!twikooLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                    <p className="text-xs text-gray-500">Loading Cloud Comments...</p>
                </div>
                )}
                {/* Twikoo 容器：imessage-twikoo 类名用于 CSS 深度定制 */}
                <div ref={twikooContainerRef} className={`w-full min-h-[200px] ${compact ? 'imessage-twikoo' : ''}`} style={{ display: twikooLoaded ? 'block' : 'none' }} />
            </div>
            )}
        </div>

        {/* 3. 底部切换器 (iMessage 模式专用) */}
        {compact && (
            <div className="shrink-0 h-8 flex items-center justify-center gap-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 backdrop-blur">
                <button 
                    onClick={() => handleSystemSwitch('giscus')}
                    className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'giscus' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Server size={10} /> GitHub
                </button>
                <div className="w-[1px] h-3 bg-gray-300 dark:bg-white/20"></div>
                <button 
                    onClick={() => handleSystemSwitch('twikoo')}
                    className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'twikoo' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MessageSquare size={10} /> Twikoo
                </button>
            </div>
        )}
      </div>
    </div>
  )
}