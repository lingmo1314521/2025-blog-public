'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Server } from 'lucide-react' 

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  compact?: boolean
  updateKey?: number // 用于强制刷新组件的 Key
}

export default function CommentSystem({ slug, title, compact = false, updateKey }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo') // 默认 Twikoo
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  const initTwikoo = () => {
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID
    if (!envId) return 

    // 清理旧脚本
    const oldScripts = document.querySelectorAll('script[src*="twikoo"]')
    oldScripts.forEach(script => script.remove())
    
    // 如果容器里有东西，先清空 (防止重复渲染)
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
          // iMessage 模式使用特殊路径前缀，避免污染正常文章评论
          path: compact ? `/messages/${slug}` : `/blog/${slug}`,
          lang: 'zh-CN',
          onCommentLoaded: () => setTwikooLoaded(true)
        })
      }
    }
    document.body.appendChild(script)
  }

  // 监听 updateKey 的变化来重新初始化
  useEffect(() => {
    setTwikooLoaded(false)
    setTimeout(() => initTwikoo(), 100)
  }, [slug, updateKey])

  declare global {
    interface Window { twikoo?: any }
  }

  // iMessage 模式：占满父容器，Flex 列布局
  const containerClass = compact 
    ? "w-full h-full flex flex-col imessage-mode overflow-hidden" 
    : "mx-auto w-full max-w-[1140px] px-6 pb-12 max-sm:px-0"

  const cardClass = compact
    ? "relative w-full h-full flex flex-col"
    : "relative w-full rounded-xl border border-gray-300/70 bg-white/95 p-8 shadow-sm backdrop-blur-sm max-sm:rounded-none max-sm:p-4"

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        
        {/* 标题栏 (非 compact 模式) */}
        {!compact && (
          <div className="mb-6 pb-4 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">💬 文章评论</h3>
            </div>
          </div>
        )}
        
        {/* 内容区 */}
        <div className={`flex-1 relative ${compact ? 'min-h-0' : ''}`}>
            {!twikooLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60 pointer-events-none">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                    <p className="text-xs text-gray-500">Loading Messages...</p>
                </div>
            )}
            
            {/* Twikoo 挂载点 
                重点：imessage-twikoo 类名对应 globals.css 中的 flex 布局规则
                h-full 确保它能撑开高度，把输入框挤到底部
            */}
            <div 
                ref={twikooContainerRef} 
                className={`w-full h-full ${compact ? 'imessage-twikoo' : ''}`} 
            />
        </div>
      </div>
    </div>
  )
}