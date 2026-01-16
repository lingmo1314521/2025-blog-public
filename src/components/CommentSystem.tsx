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
  // 新增：当用户点击回复时的回调，传回被回复者的名字
  onReply?: (nick: string | null) => void 
}

export default function CommentSystem({ slug, title, compact = false, reloadKey = 0, onCountChange, onReply }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  const giscusContainerRef = useRef<HTMLDivElement>(null)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  // ... (Giscus 初始化代码省略，保持不变) ...
  const initGiscus = () => { /* ...保持原样... */ }

  const initTwikoo = () => {
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID
    if (!envId) return 

    const oldScripts = document.querySelectorAll('script[src*="twikoo"]')
    oldScripts.forEach(script => script.remove())
    if (twikooContainerRef.current) twikooContainerRef.current.innerHTML = ''

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

  // --- 监听逻辑：评论数 & 回复动作 ---
  useEffect(() => {
    if (!compact || !twikooLoaded || !twikooContainerRef.current) return;

    // 1. 点击拦截 (用于检测回复)
    const container = twikooContainerRef.current
    const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        // 查找是否点击了回复按钮 (tk-action-link 或其子元素)
        const replyBtn = target.closest('.tk-action-link')
        if (replyBtn) {
            // 找到被回复的评论的昵称
            const commentNode = replyBtn.closest('.tk-comment')
            const nickNode = commentNode?.querySelector('.tk-nick')
            if (nickNode && onReply) {
                onReply(nickNode.textContent)
            }
        }
    }
    container.addEventListener('click', handleClick)

    // 2. DOM 变化监听 (用于检测评论数 & 取消回复)
    const observer = new MutationObserver(() => {
        // 更新评论数
        const countEl = container.querySelector('.tk-comments-count span:first-child')
        if (countEl && countEl.textContent && onCountChange) {
            onCountChange(parseInt(countEl.textContent.trim(), 10))
        }

        // 检测是否退出了回复模式 (Twikoo 取消回复时会移除 .tk-submit 下的 reply-id input，或者重置位置)
        // 我们简单一点：如果用户点击了隐藏区域的"取消回复"，我们需要感知
        // 但因为隐藏了，用户点不到。我们依靠父组件的"X"按钮来触发取消。
    })
    observer.observe(container, { childList: true, subtree: true })

    return () => {
        observer.disconnect()
        container.removeEventListener('click', handleClick)
    }
  }, [twikooLoaded, compact, onCountChange, onReply])

  const handleSystemSwitch = (s: CommentSystemType) => setCurrentSystem(s)

  useEffect(() => { 
      setTwikooLoaded(false)
      if (currentSystem === 'giscus') setTimeout(initGiscus, 100)
      else setTimeout(initTwikoo, 100)
  }, [currentSystem, slug, reloadKey])

  const containerClass = compact 
    ? "w-full h-full flex flex-col imessage-mode bg-white dark:bg-[#1e1e1e]" 
    : "mx-auto w-full max-w-[1140px] px-6 pb-12 max-sm:px-0"

  return (
    <div className={containerClass}>
      <div className="relative w-full h-full flex flex-col">
        {!compact && (/* ... 普通模式标题 ... */ <div/>)} 
        
        <div className={`flex-1 min-h-0 relative overflow-y-auto ${compact ? 'px-4 py-2' : ''}`}>
            {currentSystem === 'twikoo' && (
                <div ref={twikooContainerRef} className="w-full min-h-[200px]" style={{ display: twikooLoaded ? 'block' : 'none' }} />
            )}
            {/* Giscus 部分省略，保持原样 */}
        </div>
        
        {compact && (/* ... 底部切换器 ... */ <div/>)}
      </div>
    </div>
  )
}