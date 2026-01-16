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

  // ... (Giscus init logic omitted for brevity, keeping existing) ...
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

  // --- 智能代理监听逻辑 ---
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
        // 逻辑：Twikoo 在回复时会将输入框移动到评论下方，并修改 placeholder
        // 我们需要找到当前页面上 *唯一* 的输入框 (class: el-textarea__inner)
        const textarea = document.querySelector('#twikoo .el-textarea__inner')
        if (textarea && onReplyChange) {
            const placeholder = textarea.getAttribute('placeholder')
            if (placeholder && placeholder.includes('@')) {
                // 格式通常为 "回复 @Nick"
                const match = placeholder.match(/@(.+)/)
                if (match) {
                    onReplyChange(match[1]) // 提取名字
                } else {
                    onReplyChange(placeholder)
                }
            } else {
                onReplyChange(null) // 没有 @，说明是普通评论
            }
        }
    })

    // 监听 body 的子树变化，因为 Twikoo 会在大范围移动 DOM 节点
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['placeholder', 'value'] })

    return () => observer.disconnect()
  }, [twikooLoaded, compact, onCountChange, onReplyChange])

  // System Switch Logic
  const handleSystemSwitch = (system: CommentSystemType) => {
    if (system === currentSystem) return
    setCurrentSystem(system)
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
        {/* Top Bar (Hidden in compact) */}
        {!compact && (
          <div className="mb-6 pb-4 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             {/* ... content ... */}
          </div>
        )}
        
        <div className={`flex-1 min-h-0 relative overflow-y-auto ${compact ? 'px-4 py-2' : ''}`}>
            {currentSystem === 'twikoo' && (
                // 确保 ID 为 twikoo，配合 CSS 选择器
                <div id="twikoo" ref={twikooContainerRef} className="w-full min-h-[200px]" style={{ display: twikooLoaded ? 'block' : 'none' }} />
            )}
            {/* Giscus block ... */}
        </div>
      </div>
    </div>
  )
}