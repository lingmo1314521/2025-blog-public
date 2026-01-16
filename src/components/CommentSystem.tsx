'use client'
// components/CommentSystem.tsx

import { useState, useEffect, useRef } from 'react'

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  // 新增：是否为紧凑模式（用于 Messages 应用）
  compact?: boolean 
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
      script.setAttribute('data-mapping', 'pathname') // 注意：在 Messages 应用中，路径可能需要特殊处理，这里暂时保持 pathname
      script.setAttribute('data-term', slug) // 显式强制使用 slug 作为标识符，确保 Messages 应用内能正确定位
      script.setAttribute('data-strict', '0')
      script.setAttribute('data-reactions-enabled', '1')
      script.setAttribute('data-emit-metadata', '0')
      script.setAttribute('data-input-position', 'top')
      script.setAttribute('data-theme', 'light')
      script.setAttribute('data-lang', 'zh-CN')
      
      script.onload = () => {
        const checkIframe = () => {
          const iframe = giscusContainerRef.current?.querySelector('iframe.giscus-frame')
          if (iframe) {
            setGiscusLoaded(true)
          } else {
            setTimeout(checkIframe, 500)
          }
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
    if (!envId) return // 安全检查

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
          // 如果是 compact 模式，手动构造一个独特的 path，避免和首页冲突
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

  // --- 根据 compact 属性决定样式 ---
  const containerClass = compact 
    ? "w-full" // Messages 应用内：无边距、无卡片
    : "mx-auto w-full max-w-[1140px] px-6 pb-12 max-sm:px-0" // 博客文章内：有容器

  const cardClass = compact
    ? "relative w-full" // Messages 应用内：透明背景
    : "relative w-full rounded-xl border border-gray-300/70 bg-white/95 p-8 shadow-sm backdrop-blur-sm max-sm:rounded-none max-sm:p-4" // 博客文章内：卡片样式

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        
        {/* 头部：仅在非 compact 模式或 compact 模式下为了切换系统时显示 */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${compact ? 'mb-4' : 'mb-6 pb-4 border-b border-gray-200/50'}`}>
          {!compact && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800">💬 文章评论</h3>
              <p className="mt-1 text-sm text-gray-500">欢迎留下你的看法和见解</p>
            </div>
          )}
          
          {/* 切换按钮 */}
          <div className={`flex items-center gap-2 ${compact ? 'w-full justify-center' : ''}`}>
            {!compact && <span className="text-sm text-gray-500">评论系统：</span>}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => handleSystemSwitch('giscus')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentSystem === 'giscus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Giscus {currentSystem === 'giscus' && !giscusLoaded && <span className="ml-1 h-1.5 w-1.5 animate-ping rounded-full bg-blue-500"></span>}
              </button>
              <button
                onClick={() => handleSystemSwitch('twikoo')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentSystem === 'twikoo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Twikoo {currentSystem === 'twikoo' && !twikooLoaded && <span className="ml-1 h-1.5 w-1.5 animate-ping rounded-full bg-blue-500"></span>}
              </button>
            </div>
          </div>
        </div>
        
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
            <div ref={twikooContainerRef} className="w-full min-h-[200px]" style={{ display: twikooLoaded ? 'block' : 'none' }} />
          </div>
        )}
        
        {!compact && (
          <div className="mt-8 border-t border-gray-200/50 pt-6 text-center text-sm text-gray-500">
            {currentSystem === 'giscus' ? <p>Giscus：基于 GitHub Discussions</p> : <p>Twikoo：支持游客评论</p>}
          </div>
        )}
      </div>
    </div>
  )
}