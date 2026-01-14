'use client'

import React, { useState } from 'react'
import { RotateCw, ExternalLink } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context' // 引入

interface DocViewerProps {
  url?: string
  title?: string
  slug?: string
}

export const DocViewer = ({ url, title, slug }: DocViewerProps) => {
  const { t } = useI18n() // 获取 t
  const targetUrl = url || (slug ? `/blog/${slug}?embedded=true` : '')
  const isEditing = targetUrl.includes('/write/')
  
  const [loading, setLoading] = useState(true)
  const [iframeUrl, setIframeUrl] = useState(targetUrl)

  const refresh = () => {
    setLoading(true)
    setIframeUrl('')
    setTimeout(() => setIframeUrl(targetUrl), 10)
  }

  if (!targetUrl) return <div className="flex items-center justify-center h-full text-gray-400">{t('invalid_link')}</div>

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e1e1e] overflow-hidden select-none">
      <div className="h-9 shrink-0 flex items-center justify-between px-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-[#2c2c2c]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium truncate max-w-[400px]">
           <div className={clsx("w-2 h-2 rounded-full", isEditing ? "bg-amber-500" : "bg-green-500")} />
           
           {/* 使用翻译 */}
           <span className="opacity-60">{isEditing ? t('edit_mode') : t('read_mode')}</span>
           
           <span className="opacity-30">/</span>
           <span className="text-black dark:text-gray-200 truncate">{title || 'Document'}</span>
        </div>
        <div className="flex gap-3 text-gray-400">
           <button onClick={refresh} title={t('ctx_refresh')} className="hover:text-black dark:hover:text-white transition-colors">
              <RotateCw size={12} />
           </button>
           <a 
             href={targetUrl.split('?')[0]} 
             target="_blank" 
             rel="noopener noreferrer" 
             title="Open in Browser" 
             className="hover:text-black dark:hover:text-white transition-colors"
           >
              <ExternalLink size={12} />
           </a>
        </div>
      </div>

      <div className="flex-1 relative bg-white dark:bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white dark:bg-[#1e1e1e]">
             <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
                 <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                 {t('loading_doc')}
             </div>
          </div>
        )}
        
        <iframe 
            src={iframeUrl}
            className="w-full h-full border-none block"
            onLoad={() => setLoading(false)}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
        />
      </div>
    </div>
  )
}