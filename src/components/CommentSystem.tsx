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
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  // ... (Giscus init logic omitted for brevity) ...
  const initGiscus = () => { /* ...保持原样... */ }

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

        // 2. 抓取回复状态 (核心)
        // 只要发现页面上有 placeholder 含 "@" 的 textarea，就说明进入了回复模式
        const textarea = document.querySelector('#twikoo .el-textarea__inner')
        if (textarea && onReplyChange) {
            const placeholder = textarea.getAttribute('placeholder')
            if (placeholder && placeholder.includes('@')) {
                const match = placeholder.match(/@(.+)/)
                if (match) {
                    onReplyChange(match[1])
                } else {
                    onReplyChange(placeholder)
                }
            } else {
                onReplyChange(null)
            }
        }
    })

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['placeholder'] })

    return () => observer.disconnect()
  }, [twikooLoaded, compact, onCountChange, onReplyChange])

  // ... (handleSwitch & effects omitted) ...
  const handleSystemSwitch = (system: CommentSystemType) => { /* ... */ }
  useEffect(() => { /* ... */ }, [])
  useEffect(() => {
    setTwikooLoaded(false)
    setTimeout(() => initTwikoo(), 100)
  }, [currentSystem, slug, reloadKey])

  // ... (render logic) ...
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
             {/* ... */}
          </div>
        )}
        
        <div className={`flex-1 min-h-0 relative overflow-y-auto ${compact ? 'px-4 py-2' : ''}`}>
            {/* 只渲染 Twikoo 容器，ID 很重要 */}
            <div id="twikoo" ref={twikooContainerRef} className="w-full min-h-[200px]" style={{ display: twikooLoaded ? 'block' : 'none' }} />
        </div>
      </div>
    </div>
  )
}