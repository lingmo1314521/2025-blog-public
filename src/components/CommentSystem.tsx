'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Server } from 'lucide-react' 

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  compact?: boolean
  reloadKey?: number
  onSystemChange?: (system: CommentSystemType) => void
}

export default function CommentSystem({ slug, title, compact = false, reloadKey = 0, onSystemChange }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')
  const [giscusLoaded, setGiscusLoaded] = useState(false)
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  
  const giscusContainerRef = useRef<HTMLDivElement>(null)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  // 同步状态到父组件
  useEffect(() => {
    onSystemChange?.(currentSystem)
  }, [currentSystem, onSystemChange])

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
      script.setAttribute('data-theme', compact ? 'noborder_light' : 'light') // 暗色模式需根据系统主题动态调整，这里暂时简化
      script.setAttribute('data-lang', 'zh-CN')
      script.setAttribute('data-loading', 'lazy')
      
      script.onload = () => {
        // Giscus iframe 加载需要时间，轮询检查
        const checkIframe = () => {
          // 在 Shadow DOM 或 iframe 内部
          // Giscus 实际上是插入了一个 iframe 并在旁边放样式
          // 只要 script 加载完，基本可以认为开始了
          setGiscusLoaded(true) 
        }
        setTimeout(checkIframe, 1500)
      }
      
      script.onerror = () => setGiscusLoaded(false)
      giscusContainerRef.current.appendChild(script)
    } catch (error) {
      console.error('Giscus init failed:', error)
      setGiscusLoaded(false)
    }
  }

  const initTwikoo = () => {
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID || 'https://twikoo.vercel.app' // 请确保有默认值或环境变量
    
    // 清理旧的脚本以防重复监听
    const oldScripts = document.querySelectorAll('script[src*="twikoo"]')
    // 注意：Twikoo 全局单例，通常不建议频繁删除 script，但在 SPA 切换时可能需要重新 init
    
    if (twikooContainerRef.current) {
        twikooContainerRef.current.innerHTML = ''
    }

    // 检查 window.twikoo 是否已存在
    if (window.twikoo) {
        window.twikoo.init({
            envId: envId,
            el: twikooContainerRef.current,
            path: compact ? `/messages/${slug}` : `/blog/${slug}`,
            lang: 'zh-CN',
            onCommentLoaded: () => setTwikooLoaded(true)
        })
        return
    }

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
          onCommentLoaded: () => {
              setTwikooLoaded(true)
          }
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
      if (saved) setCurrentSystem(saved)
    } catch (e) {}
  }, [])
  
  useEffect(() => {
    // 每次切换系统或 Slug 变化时重置加载状态
    setTwikooLoaded(false)
    setGiscusLoaded(false)
    
    let timer: NodeJS.Timeout
    if (currentSystem === 'giscus') {
        timer = setTimeout(() => initGiscus(), 100)
    } else {
        timer = setTimeout(() => initTwikoo(), 100)
    }
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSystem, slug, reloadKey])

  const containerClass = compact 
    ? "w-full h-full flex flex-col imessage-mode bg-slate-50 dark:bg-[#151515]" 
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
        
        <div className={`flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden ${compact ? 'px-4 py-2 scrollbar-thin' : ''}`}>
            {/* Giscus 容器 */}
            <div className={currentSystem === 'giscus' ? 'block' : 'hidden'}>
                {!giscusLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                    <p className="text-xs text-gray-500">Connecting to GitHub...</p>
                    <button onClick={initGiscus} className="mt-2 text-xs text-blue-500 hover:underline">Retry</button>
                </div>
                )}
                <div ref={giscusContainerRef} className="w-full min-h-[200px]" />
            </div>
            
            {/* Twikoo 容器 */}
            <div className={currentSystem === 'twikoo' ? 'block' : 'hidden'}>
                {!twikooLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                    <p className="text-xs text-gray-500">Loading Messages...</p>
                </div>
                )}
                {/* 必须始终渲染 ref div，因为 Twikoo init 需要 DOM 存在 */}
                <div ref={twikooContainerRef} className="w-full min-h-[200px]" />
            </div>
        </div>

        {compact && (
            <div className="shrink-0 h-8 flex items-center justify-center gap-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/5 z-20">
                <button 
                    onClick={() => handleSystemSwitch('twikoo')}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'twikoo' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MessageSquare size={10} /> Twikoo
                </button>
                <div className="w-[1px] h-3 bg-gray-300 dark:bg-white/10"></div>
                <button 
                    onClick={() => handleSystemSwitch('giscus')}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'giscus' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Server size={10} /> GitHub
                </button>
            </div>
        )}
      </div>
    </div>
  )
}