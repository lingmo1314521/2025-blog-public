'use client'

import React, { useState } from 'react'
import { RotateCw, ExternalLink } from 'lucide-react'

interface WebFrameProps {
  url: string
  title?: string
}

export const WebFrame = ({ url, title }: WebFrameProps) => {
  const [loading, setLoading] = useState(true)
  const [iframeUrl, setIframeUrl] = useState(url)

  // 刷新功能
  const refresh = () => {
    setLoading(true)
    const current = iframeUrl
    setIframeUrl('')
    setTimeout(() => setIframeUrl(current), 10)
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e1e1e] overflow-hidden">
      {/* 1. 极简工具栏 (可选，如果不想要可以删掉这一块 div) */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#252525]/80 backdrop-blur-md">
        <div className="text-xs text-gray-500 font-medium truncate max-w-[200px]">
           {title || 'Document'}
        </div>
        <div className="flex gap-3 text-gray-400">
           <button onClick={refresh} title="Refresh" className="hover:text-black dark:hover:text-white transition-colors">
              <RotateCw size={14} />
           </button>
           <a href={url.split('?')[0]} target="_blank" rel="noopener noreferrer" title="Open in Browser" className="hover:text-black dark:hover:text-white transition-colors">
              <ExternalLink size={14} />
           </a>
        </div>
      </div>

      {/* 2. 内容区域 */}
      <div className="flex-1 relative bg-white dark:bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white dark:bg-[#1e1e1e]">
             <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        
        {iframeUrl && (
            <iframe 
                src={iframeUrl}
                className="w-full h-full border-none"
                onLoad={() => setLoading(false)}
                title={title}
                // 允许脚本运行，但限制一些高风险行为
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            />
        )}
      </div>
    </div>
  )
}