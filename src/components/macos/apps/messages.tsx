'use client'

import React, { useState, useMemo } from 'react'
import { Search, Settings, ArrowUp, ChevronLeft, Save, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CommentSystem, { CommentSystemType } from '@/components/CommentSystem'
import { useI18n } from '../i18n-context' // 保持你的引用

// --- 辅助类型 ---
type Contact = {
  id: string
  name: string
  slug: string // 用于评论系统的唯一标识
  avatar: string
  desc: string
  time: string
}

// --- 设置弹窗 (简化版，专注于功能) ---
const SettingsModal = ({ onClose }: { onClose: () => void }) => {
    const [nick, setNick] = useState(() => {
        try { return JSON.parse(localStorage.getItem('twikoo') || '{}').nick || '' } catch { return '' }
    })
    
    const handleSave = () => {
        try {
            const data = JSON.parse(localStorage.getItem('twikoo') || '{}')
            data.nick = nick
            localStorage.setItem('twikoo', JSON.stringify(data))
            // 触发一个自定义事件通知 Twikoo 更新（虽然 Twikoo 通常读取 DOM，但这里作为占位）
            onClose()
        } catch (e) { console.error(e) }
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-72 bg-white dark:bg-[#2c2c2c] rounded-2xl shadow-xl p-5 border border-white/20"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm dark:text-white">Settings</h3>
                    <button onClick={onClose}><X size={16} className="text-gray-500"/></button>
                </div>
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400">NICKNAME</label>
                    <input 
                        value={nick} onChange={e => setNick(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-black/20 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500/50 dark:text-white"
                        placeholder="Anonymous"
                    />
                </div>
                <button onClick={handleSave} className="mt-5 w-full bg-blue-500 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <Save size={14} /> Save
                </button>
            </motion.div>
        </div>
    )
}

export const Messages = () => {
  const { t } = useI18n()
  
  // 1. 数据源定义
  const CONTACTS: Contact[] = useMemo(() => [
    { id: 'guestbook', name: t('msg_guestbook') || 'Guestbook', slug: 'msg-guestbook', avatar: '🌍', desc: 'Leave a message...', time: 'Now' },
    { id: 'tech', name: 'Tech Talk', slug: 'msg-tech', avatar: '💻', desc: 'React, Next.js...', time: '1d' },
    { id: 'bug', name: 'Bug Report', slug: 'msg-bugs', avatar: '🐛', desc: 'Fix bugs...', time: 'Mon' },
  ], [t])

  // 2. 状态管理
  const [activeContactId, setActiveContactId] = useState<string>(CONTACTS[0].id)
  const [inputValue, setInputValue] = useState('')
  const [isMobileListOpen, setIsMobileListOpen] = useState(true) // 移动端控制：True=列表, False=聊天
  const [showSettings, setShowSettings] = useState(false)
  const [currentSystem, setCurrentSystem] = useState<CommentSystemType>('twikoo')

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]

  // 3. 核心功能：点击列表项
  const handleContactSelect = (id: string) => {
      setActiveContactId(id)
      setIsMobileListOpen(false) // 移动端：关闭列表，显示聊天
  }

  // 4. 核心功能：发送消息 (Hack Twikoo)
  const handleSend = () => {
      if (!inputValue.trim() || currentSystem !== 'twikoo') return

      // 获取 Twikoo 的输入框 (根据你的 DOM 结构，通常是 el-textarea__inner)
      const twikooTextarea = document.querySelector('.imessage-theme textarea') as HTMLTextAreaElement
      const twikooBtn = document.querySelector('.imessage-theme .tk-send') as HTMLButtonElement

      if (twikooTextarea && twikooBtn) {
          // 关键 Hack: 模拟 React/Vue 的原生输入事件
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          nativeInputValueSetter?.call(twikooTextarea, inputValue);
          
          twikooTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          
          // 触发点击
          setTimeout(() => {
              twikooBtn.click()
              setInputValue('') // 清空本地状态
          }, 50)
      } else {
          console.warn("Twikoo elements not found. DOM structure might have changed.")
      }
  }

  return (
    <div className="flex w-full h-[600px] max-w-4xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 font-sans relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* --- 左侧列表 (Mobile: Slide Out / Desktop: Static) --- */}
      <motion.div 
        initial={false}
        animate={{ 
            x: isMobileListOpen ? '0%' : '-100%',
            position: 'absolute', // 移动端是绝对定位
            width: '100%',
            zIndex: 20
        }}
        // 桌面端样式覆盖 (Tailwind md: breakpoint)
        className={`bg-[#f2f2f7] dark:bg-[#252525] h-full flex flex-col border-r border-gray-200 dark:border-white/5 md:!static md:!w-[280px] md:!transform-none md:!z-0`}
      >
        {/* Search Header */}
        <div className="h-14 flex items-center px-4 pt-2 shrink-0">
             <div className="relative w-full">
                 <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                 <input placeholder="Search" className="w-full bg-gray-200 dark:bg-black/20 rounded-lg py-1.5 pl-8 text-xs outline-none focus:bg-white dark:focus:bg-black/40 transition-colors" />
             </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CONTACTS.map(contact => (
                <div 
                    key={contact.id} 
                    onClick={() => handleContactSelect(contact.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${activeContactId === contact.id ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-white dark:hover:bg-white/5'}`}
                >
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-lg shadow-sm shrink-0">
                        {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-sm truncate">{contact.name}</span>
                            <span className={`text-[10px] ${activeContactId === contact.id ? 'text-blue-100' : 'text-gray-400'}`}>{contact.time}</span>
                        </div>
                        <div className={`text-xs truncate ${activeContactId === contact.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {contact.desc}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </motion.div>


      {/* --- 右侧聊天详情 (Desktop: Static / Mobile: Slide In) --- */}
      <div className="flex-1 flex flex-col h-full relative bg-white dark:bg-[#1e1e1e] min-w-0">
        
        {/* Header */}
        <div className="h-14 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/90 backdrop-blur shrink-0 z-10">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsMobileListOpen(true)} className="md:hidden p-1 -ml-2 text-blue-500">
                    <ChevronLeft size={24}/>
                </button>
                <div className="flex flex-col items-start">
                    <span className="text-xs text-gray-400">To:</span>
                    <span className="text-sm font-bold">{activeContact.name}</span>
                </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-white/10 p-2 rounded-full">
                <Settings size={18} />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            <CommentSystem 
                key={activeContact.slug} // 强制重新渲染当 slug 变化
                slug={activeContact.slug} 
                compact={true} 
                onSystemChange={setCurrentSystem}
            />
        </div>

        {/* Input Area */}
        <div className="shrink-0 bg-[#f5f5f5] dark:bg-[#2c2c2c] border-t border-gray-200 dark:border-white/5 p-3 pb-safe safe-area-bottom">
            {currentSystem === 'giscus' ? (
                // Giscus 模式：显示提示
                <div className="text-center text-xs text-gray-400 py-2">
                    Please comment using the GitHub box above 👆
                </div>
            ) : (
                // Twikoo 模式：自定义输入框
                <div className="relative flex items-center gap-2">
                    <input 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all dark:text-white"
                        placeholder="iMessage"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${inputValue.trim() ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500'}`}
                    >
                        <ArrowUp size={16} strokeWidth={3} />
                    </button>
                </div>
            )}
        </div>
      </div>

    </div>
  )
}