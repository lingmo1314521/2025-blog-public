'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Server } from 'lucide-react'

type CommentSystemType = 'giscus' | 'twikoo'

interface CommentSystemProps {
  slug: string
  title?: string
  compact?: boolean
  reloadKey?: number
  onTwikooReady?: (isReady: boolean) => void
  onMessageInput?: (value: string) => void
  onSendMessage?: () => void
}

export default function CommentSystem({ 
  slug, 
  title, 
  compact = false, 
  reloadKey = 0,
  onTwikooReady,
  onMessageInput,
  onSendMessage
}: CommentSystemProps) {
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')
  const [giscusLoaded, setGiscusLoaded] = useState(false)
  const [twikooLoaded, setTwikooLoaded] = useState(false)
  const [twikooInstance, setTwikooInstance] = useState<any>(null)
  
  const giscusContainerRef = useRef<HTMLDivElement>(null)
  const twikooContainerRef = useRef<HTMLDivElement>(null)

  // 监听自定义输入变化
  useEffect(() => {
    if (!compact || currentSystem !== 'twikoo') return

    const handleCustomInput = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      if (onMessageInput && customEvent.detail) {
        onMessageInput(customEvent.detail)
      }
    }

    const handleCustomSend = () => {
      if (onSendMessage) {
        onSendMessage()
      }
    }

    window.addEventListener('custom-message-input', handleCustomInput as EventListener)
    window.addEventListener('custom-send-message', handleCustomSend as EventListener)

    return () => {
      window.removeEventListener('custom-message-input', handleCustomInput as EventListener)
      window.removeEventListener('custom-send-message', handleCustomSend as EventListener)
    }
  }, [compact, currentSystem, onMessageInput, onSendMessage])

  const initGiscus = useCallback(() => {
    if (!giscusContainerRef.current) return
    
    // 清理旧的 giscus 实例
    const oldIframe = giscusContainerRef.current.querySelector('iframe.giscus-frame')
    if (oldIframe) oldIframe.remove()
    
    try {
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
          if (iframe) {
            setGiscusLoaded(true)
            // 通知父组件
            if (onTwikooReady) onTwikooReady(false)
          } else {
            setTimeout(checkIframe, 500)
          }
        }
        setTimeout(checkIframe, 1000)
      }
      
      script.onerror = () => {
        setGiscusLoaded(false)
        if (onTwikooReady) onTwikooReady(false)
      }
      
      giscusContainerRef.current.appendChild(script)
    } catch (error) {
      console.error('Giscus init failed:', error)
      setGiscusLoaded(false)
      if (onTwikooReady) onTwikooReady(false)
    }
  }, [slug, compact, onTwikooReady])

  const initTwikoo = useCallback(() => {
    const envId = process.env.NEXT_PUBLIC_TWIKOO_ENV_ID
    if (!envId) {
      console.error('Twikoo environment ID is not configured')
      return 
    }

    // 清理旧的 twikoo 实例
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
        const twikooInstance = window.twikoo.init({
          envId: envId,
          el: twikooContainerRef.current,
          path: compact ? `/messages/${slug}` : `/blog/${slug}`,
          lang: 'zh-CN',
          onCommentLoaded: () => {
            setTwikooLoaded(true)
            setTwikooInstance(twikooInstance)
            
            // 通知父组件 Twikoo 已就绪
            if (onTwikooReady) onTwikooReady(true)
            
            // 如果是紧凑模式，设置自定义输入框联动
            if (compact) {
              setTimeout(() => {
                const twikooTextarea = twikooContainerRef.current?.querySelector('.el-textarea__inner') as HTMLTextAreaElement
                if (twikooTextarea) {
                  // 监听自定义输入事件
                  window.addEventListener('update-twikoo-input', ((e: CustomEvent<string>) => {
                    twikooTextarea.value = e.detail
                    // 触发 input 事件让 Twikoo 更新
                    twikooTextarea.dispatchEvent(new Event('input', { bubbles: true }))
                  }) as EventListener)
                }
              }, 500)
            }
          }
        })
      }
    }
    
    script.onerror = () => {
      console.error('Failed to load Twikoo script')
      setTwikooLoaded(false)
      if (onTwikooReady) onTwikooReady(false)
    }
    
    document.body.appendChild(script)
  }, [slug, compact, onTwikooReady])

  const handleSystemSwitch = (system: CommentSystemType) => {
    if (system === currentSystem) return
    setCurrentSystem(system)
    if (system === 'giscus') {
      setGiscusLoaded(false)
      if (onTwikooReady) onTwikooReady(false)
    } else {
      setTwikooLoaded(false)
    }
    try { 
      localStorage.setItem('preferred-comment-system', system) 
    } catch (e) {}
  }

  // 处理发送消息
  const handleSendMessage = useCallback(() => {
    if (currentSystem === 'twikoo' && twikooInstance && twikooContainerRef.current) {
      const sendButton = twikooContainerRef.current.querySelector('.tk-send') as HTMLButtonElement
      if (sendButton && !sendButton.disabled) {
        sendButton.click()
        
        // 清空输入框
        const textarea = twikooContainerRef.current.querySelector('.el-textarea__inner') as HTMLTextAreaElement
        if (textarea) {
          textarea.value = ''
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }
        
        return true
      }
    }
    return false
  }, [currentSystem, twikooInstance])

  // 处理消息输入
  const handleMessageInput = useCallback((value: string) => {
    if (currentSystem === 'twikoo' && twikooContainerRef.current) {
      const textarea = twikooContainerRef.current.querySelector('.el-textarea__inner') as HTMLTextAreaElement
      if (textarea) {
        textarea.value = value
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  }, [currentSystem])

  // 暴露函数给父组件
  useEffect(() => {
    if (compact) {
      // 创建全局函数供父组件调用
      ;(window as any).__commentSystem = {
        sendMessage: handleSendMessage,
        setInputValue: handleMessageInput
      }
    }
  }, [compact, handleSendMessage, handleMessageInput])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferred-comment-system') as CommentSystemType
      if (saved) setCurrentSystem(saved)
    } catch (e) {}
  }, [])
  
  useEffect(() => {
    setTwikooLoaded(false)
    setGiscusLoaded(false)
    setTwikooInstance(null)
    
    const timeoutId = setTimeout(() => {
      if (currentSystem === 'giscus') initGiscus()
      else initTwikoo()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [currentSystem, slug, reloadKey, initGiscus, initTwikoo])

  declare global {
    interface Window { 
      twikoo?: any 
      __commentSystem?: {
        sendMessage: () => boolean
        setInputValue: (value: string) => void
      }
    }
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
        
        <div className={`flex-1 min-h-0 relative overflow-y-auto ${compact ? 'px-4 py-2' : ''}`}>
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