// components/macos/apps/about.tsx
'use client'
import React from 'react'
import { useI18n } from '../i18n-context'

export const About = () => {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-[#1e1e1e] text-center select-none">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-xl mb-6 flex items-center justify-center text-4xl text-white font-bold overflow-hidden border-4 border-white/10">
        {/* 可以换成你的头像图片 */}
        <img src="/icons/me.png" alt="Lynx" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('about_title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('about_version')}</p>
      
      <div className="flex flex-col gap-2 w-full max-w-xs text-xs text-gray-600 dark:text-gray-300">
        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
          <span>{t('processor')}</span>
          <span className="font-medium">{t('processor_desc')}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
          <span>{t('memory')}</span>
          <span className="font-medium">{t('memory_desc')}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
          <span>{t('graphics')}</span>
          <span className="font-medium">{t('graphics_desc')}</span>
        </div>
      </div>

      <div className="mt-8 text-[10px] text-gray-400">
        {t('rights')}
      </div>
    </div>
  )
}