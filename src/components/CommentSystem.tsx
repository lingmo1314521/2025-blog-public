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
  
  // 生成唯一的 DOM ID，防止切换联系人时 Twikoo 找不到挂载点
  // 简单的哈希替代方案：替换掉特殊字符
  const uniqueId = `twikoo-${slug.replace(/[^a-zA-Z0-9-_]/g, '')}`
  
  const giscusContainerRef = useRef<HTMLDivElement>(null)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  // Giscus 初始化逻辑
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

  // Twikoo 初始化逻辑
  const initTwikoo = () => {
    // [重要] 使用环境变量，或者回退到你的真实地址
    // 如果没有配置 EnvID，请确保这里是一个有效的地址，否则 onCommentLoaded 永远不会触发
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID || 'https://your-twikoo-instance.vercel.app' 

    // 清理旧内容，确保 ID 存在
    if (twikooContainerRef.current) {
        twikooContainerRef.current.innerHTML = `<div id="${uniqueId}"></div>`
    }

    // 只有当 window.twikoo 不存在时才加载脚本
    if (!window.twikoo) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js'
        script.async = true
        script.onload = () => {
            loadTwikooInstance(envId)
        }
        document.body.appendChild(script)
    } else {
        loadTwikooInstance(envId)
    }
  }

  const loadTwikooInstance = (envId: string) => {
      if (window.twikoo && document.getElementById(uniqueId)) {
        window.twikoo.init({
          envId: envId,
          el: `#${uniqueId}`, // 使用唯一 ID
          path: compact ? `/messages/${slug}` : `/blog/${slug}`,
          lang: 'zh-CN',
          onCommentLoaded: () => {
              console.log('Twikoo Loaded!')
              setTwikooLoaded(true)
          }
        })
      }
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
    
    // [关键修复] 设置一个安全超时：如果 3 秒后 Twikoo 还没回调，强制显示内容
    // 这能防止网络慢或配置错时页面一直卡在 Loading 
    const safetyTimer = setTimeout(() => {
        setTwikooLoaded(true)
    }, 3000)

    if (currentSystem === 'giscus') setTimeout(() => initGiscus(), 100)
    else setTimeout(() => initTwikoo(), 100)

    return () => clearTimeout(safetyTimer)
  }, [currentSystem, slug, reloadKey])

  declare global {
    interface Window { twikoo?: any }
  }

  const containerClass = compact 
    ? "w-full h-full flex flex-col bg-white dark:bg-[#1e1e1e] imessage-mode" 
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
                <button onClick={() => handleSystemSwitch('giscus')} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${currentSystem === 'giscus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Giscus</button>
                <button onClick={() => handleSystemSwitch('twikoo')} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${currentSystem === 'twikoo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Twikoo</button>
              </div>
            </div>
          </div>
        )}
        
        <div className={`flex-1 min-h-0 relative ${compact ? 'overflow-y-auto scrollbar-none' : ''}`}>
            {currentSystem === 'giscus' && (
            <div>
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
            <div className="h-full relative">
                {/* 这里的 ID 将被脚本填充 */}
                <div ref={twikooContainerRef} className="w-full min-h-[100px] pb-4" />
                
                {!twikooLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#1e1e1e] z-10">
                    <RefreshCw className="mb-2 h-6 w-6 animate-spin text-gray-400" />
                    <p className="text-xs text-gray-500">Syncing Messages...</p>
                </div>
                )}
            </div>
            )}
        </div>

        {compact && (
            <div className="shrink-0 h-6 flex items-center justify-center gap-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/5 z-20 select-none">
                <button onClick={() => handleSystemSwitch('twikoo')} className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'twikoo' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}><MessageSquare size={9} /> Twikoo</button>
                <div className="w-[1px] h-2 bg-gray-200 dark:bg-white/10"></div>
                <button onClick={() => handleSystemSwitch('giscus')} className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'giscus' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}><Server size={9} /> GitHub</button>
            </div>
        )}
      </div>
    </div>
  )
}