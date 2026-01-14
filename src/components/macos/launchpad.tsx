'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context' // 引入

export const Launchpad = () => {
  const { isLaunchpadOpen, toggleLaunchpad, dockItems, launchApp } = useOs()
  const { t } = useI18n() // 获取 t
  const [searchTerm, setSearchTerm] = useState('')

  // 过滤 App，同时在搜索时也使用翻译后的名字进行匹配
  const filteredApps = dockItems.filter(
    app => 
      app.id !== 'launchpad' && 
      (t(app.id).toLowerCase().includes(searchTerm.toLowerCase()) || app.title.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <AnimatePresence>
      {isLaunchpadOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center pt-[10vh]"
          onClick={() => toggleLaunchpad(false)} 
        >
          <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-3xl -z-10" />

          <div 
            className="w-80 relative mb-12"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/70">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder={t('search')} 
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/20 border border-white/20 rounded-md py-1.5 pl-10 pr-4 text-white placeholder-white/70 text-sm focus:outline-none focus:bg-white/30 transition-colors"
            />
          </div>

          <div 
            className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-8 gap-y-12 max-w-5xl px-8"
            onClick={(e) => e.stopPropagation()} 
          >
            {filteredApps.map((app) => (
              <div 
                key={app.id} 
                className="flex flex-col items-center gap-4 group cursor-pointer"
                onClick={() => launchApp(app)}
              >
                <div className="w-20 h-20 bg-white/10 rounded-2xl shadow-lg p-2 group-hover:bg-white/20 transition-all duration-200 group-active:scale-95">
                   <div className="w-full h-full [&>img]:object-contain [&>img]:w-full [&>img]:h-full [&>svg]:w-full [&>svg]:h-full text-white">
                      {app.icon}
                   </div>
                </div>
                {/* 使用 t(app.id) 显示翻译后的名称 */}
                <span className="text-white font-medium text-sm tracking-wide shadow-black drop-shadow-md">
                  {t(app.id)}
                </span>
              </div>
            ))}
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}