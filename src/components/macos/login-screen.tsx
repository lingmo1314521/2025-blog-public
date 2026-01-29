'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, Lock } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'

export const LoginScreen = () => {
  const { isLocked, setIsLocked } = useOs()
  const { t, language } = useI18n()
  const [password, setPassword] = useState('')
  const [date, setDate] = useState<Date | null>(null)

  useEffect(() => {
    // 修复 Hydration 问题：仅在客户端渲染时间
    setDate(new Date())
    const timer = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLocked(false)
  }

  // 安全地格式化日期
  const dateStr = date ? date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''
  const timeStr = date ? `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}` : ''

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100000] bg-cover bg-center flex flex-col items-center justify-between py-20 text-white overflow-hidden"
          style={{ 
             backgroundImage: "url(https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3270&auto=format&fit=crop)",
          }}
        >
          <div className="absolute inset-0 backdrop-blur-md bg-black/20" />

          {/* Time & Date */}
          <div className="relative z-10 flex flex-col items-center mt-10 min-h-[150px]">
             {date && (
               <>
                 <div className="text-2xl font-medium mb-2">{dateStr}</div>
                 <div className="text-8xl font-bold tracking-tight">{timeStr}</div>
               </>
             )}
          </div>

          {/* Login Form */}
          <div className="relative z-10 flex flex-col items-center mb-20 w-full max-w-sm">
             <div className="w-24 h-24 rounded-full bg-gray-300 mb-6 shadow-2xl overflow-hidden border-2 border-white/20">
                <img src="/icons/me.png" alt="LynxMuse" className="w-full h-full object-cover" />
             </div>
             {/* 使用翻译后的名字 */}
             <div className="text-xl font-medium mb-6 text-shadow">{t('login_user_name')}</div>
             
             <form onSubmit={handleLogin} className="relative w-48">
                <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder={t('login_placeholder')} // 使用翻译
                   className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 text-sm text-white placeholder-white/50 outline-none focus:bg-white/30 transition-all text-center"
                   autoFocus
                />
                <button 
                  type="submit"
                  className={`absolute right-1 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${password ? 'bg-white text-black opacity-100' : 'opacity-0 scale-75'}`}
                >
                    <ArrowRight size={14} />
                </button>
             </form>

             <div 
                className="mt-8 text-xs text-white/60 flex flex-col items-center gap-1 cursor-pointer hover:text-white/80 transition-colors"
                onClick={() => {
                    // 这里可以添加真正的休眠逻辑或黑屏效果
                }}
             >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                    <Lock size={14} />
                </div>
                <div>{t('click_to_sleep')}</div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}