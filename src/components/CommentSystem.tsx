'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Server, Loader2 } from 'lucide-react' 

export type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  compact?: boolean // 是否为紧凑模式（iMessage模式）
  onSystemChange?: (system: CommentSystemType) => void
}

export default function CommentSystem({ slug, compact = false, onSystemChange }: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')
  const [loading, setLoading] = useState(true)
  
  const containerRef = useRef<HTMLDivElement>(null)

  // 通知父组件当前使用的系统
  useEffect(() => {
    onSystemChange?.(currentSystem)
  }, [currentSystem, onSystemChange])

  // 初始化 Twikoo
  const initTwikoo = () => {
    // 环境变量检查
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID || 'https://twikoo.vercel.app' // 替换你的默认EnvID
    
    if (!containerRef.current) return

    containerRef.current.innerHTML = '' // 清空容器
    setLoading(true)

    // 定义加载完成的回调
    const loadTwikooScript = () => {
       if (window.twikoo) {
           window.twikoo.init({
               envId: envId,
               el: containerRef.current,
               path: `/messages/${slug}`, // 确保路径唯一
               lang: 'zh-CN',
               onCommentLoaded: () => setLoading(false)
           })
       }
    }

    // 检查是否已经加载过脚本
    if (document.querySelector('script[id="twikoo-script"]')) {
        loadTwikooScript()
    } else {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js'
        script.id = 'twikoo-script'
        script.async = true
        script.onload = loadTwikooScript
        document.body.appendChild(script)
    }
  }

  // 初始化 Giscus
  const initGiscus = () => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''
    setLoading(true)

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'lingmo1314521/my-blog-comments')
    script.setAttribute('data-repo-id', 'R_kgDOQmpfyg')
    script.setAttribute('data-category', 'General')
    script.setAttribute('data-category-id', 'DIC_kwDOQmpfys4Czpli')
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', slug)
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', 'light') // 可以根据系统主题动态设置
    script.setAttribute('data-lang', 'zh-CN')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    // Giscus 是 iframe，很难准确判断加载完成，用延时模拟
    script.onload = () => setTimeout(() => setLoading(false), 1000)
    
    containerRef.current.appendChild(script)
  }

  // 监听 slug 和 系统切换
  useEffect(() => {
    let cleanup = false

    if (currentSystem === 'twikoo') {
        initTwikoo()
    } else {
        initGiscus()
    }

    return () => { cleanup = true }
  }, [slug, currentSystem])


  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-[#0f0f0f] relative overflow-hidden">
        
        {/* 加载遮罩 */}
        {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Connecting...</span>
            </div>
        )}

        {/* 评论内容容器 */}
        <div 
            ref={containerRef} 
            className={`flex-1 overflow-y-auto scrollbar-thin p-4 ${compact ? 'imessage-theme' : ''}`}
        >
            {/* 脚本内容将注入到这里 */}
        </div>

        {/* 底部切换开关 (仅在 compact 模式显示) */}
        {compact && (
            <div className="shrink-0 h-8 flex items-center justify-center gap-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/5 z-20 select-none">
                <button 
                    onClick={() => setCurrentSystem('twikoo')}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'twikoo' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MessageSquare size={10} /> Twikoo
                </button>
                <div className="w-[1px] h-3 bg-gray-300 dark:bg-white/10"></div>
                <button 
                    onClick={() => setCurrentSystem('giscus')}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${currentSystem === 'giscus' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Server size={10} /> GitHub
                </button>
            </div>
        )}
    </div>
  )
}