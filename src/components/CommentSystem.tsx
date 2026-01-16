'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Server } from 'lucide-react' 

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  compact?: boolean
  reloadKey?: number
  onCountChange?: (count: number) => void
  onReplyChange?: (replyingTo: string | null) => void 
}

export default function CommentSystem({ slug, title, compact = false, reloadKey = 0, onCountChange, onReplyChange }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')
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

  const initTwikoo = () => {
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID
    if (!envId) return 

    const oldScripts = document.querySelectorAll('script[src*="twikoo"]')
    oldScripts.forEach(script => script.remove())
    
    if (twikooContainerRef.current) {
        twikooContainerRef.current.innerHTML = ''
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

  // --- 深度监听 Twikoo DOM 变化 ---
  useEffect(() => {
    if (!compact || !twikooLoaded || !twikooContainerRef.current) return;

    const observer = new MutationObserver(() => {
        // 1. 抓取评论数量
        const countEl = twikooContainerRef.current?.querySelector('.tk-comments-count span:first-child')
        if (countEl && countEl.textContent && onCountChange) {
            const count = parseInt(countEl.textContent.trim(), 10)
            if (!isNaN(count)) onCountChange(count)
        }

        // 2. 抓取回复状态
        // 逻辑：查找 .imessage-mode 下的 .tk-submit 元素
        // 如果 .tk-submit 的父元素是 .tk-comments (根容器)，说明是发新评论
        // 如果 .tk-submit 的父元素是 .tk-comment (具体的评论)，说明是回复
        const submitEl = document.querySelector('.imessage-mode .tk-submit')
        
        if (submitEl && onReplyChange) {
            const parentComment = submitEl.closest('.tk-comment')
            if (parentComment) {
                // 正在回复某人，尝试获取他的名字
                const nickEl = parentComment.querySelector('.tk-nick')
                const replyName = nickEl ? nickEl.textContent : 'Someone'
                onReplyChange(replyName)
            } else {
                // 没有在评论内，说明是根回复
                onReplyChange(null)
            }
        }
    })

    // 监听 body，因为 Twikoo 可能把元素到处移
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    return () => observer.disconnect()
  }, [twikooLoaded, compact, onCountChange, onReplyChange])

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
    
    if (currentSystem === 'giscus') setTimeout(() => initGiscus(), 100)
    else setTimeout(() => initTwikoo(), 100)
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
        
        {/* 顶部栏只在非 compact 模式显示，iMessage 模式不需要这个 */}
        {!compact && (
          <div className="mb-6 pb-4 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             {/* ... */}
          </div>
        )}
        
        <div className={`flex-1 min-h-0 relative overflow-y-auto ${compact ? 'px-4 py-2' : ''}`}>
            {/* Giscus ... */}
            
            {currentSystem === 'twikoo' && (
            <div className="h-full flex flex-col">
                {!twikooLoaded && (
                <div className="flex flex-col items-center justify-center p-8 opacity-60 absolute inset-0">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                    <p className="text-xs text-gray-500">Loading Messages...</p>
                </div>
                )}
                <div ref={twikooContainerRef} className="w-full min-h-[200px]" style={{ display: twikooLoaded ? 'block' : 'none' }} />
            </div>
            )}
        </div>

        {compact && (
            <div className="shrink-0 h-6 flex items-center justify-center gap-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/5 z-20">
                <button 
                    onClick={() => handleSystemSwitch('twikoo')}
                    className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'twikoo' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
                >
                    <MessageSquare size={9} /> Twikoo
                </button>
                <div className="w-[1px] h-2 bg-gray-200 dark:bg-white/10"></div>
                <button 
                    onClick={() => handleSystemSwitch('giscus')}
                    className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'giscus' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
                >
                    <Server size={9} /> GitHub
                </button>
            </div>
        )}
      </div>
    </div>
  )
}