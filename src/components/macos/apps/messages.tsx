'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Search, Edit, Settings, X, Save, ArrowUp, ChevronLeft } from 'lucide-react'
import { clsx } from '../utils' // 假设你保留了这个工具函数
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context' // 假设保留
import { AnimatePresence, motion } from 'framer-motion'

// --- 类型定义 ---
type Contact = {
  id: string
  name: string
  slug: string
  avatar: string
  desc: string
  time: string
}

// --- 设置弹窗组件 (保持逻辑，优化样式) ---
const SettingsModal = ({ onClose, onSave }: { onClose: () => void, onSave: () => void }) => {
    const { t } = useI18n()
    const [nick, setNick] = useState('')
    const [mail, setMail] = useState('')
    const [link, setLink] = useState('')

    useEffect(() => {
        try {
            const stored = localStorage.getItem('twikoo')
            if (stored) {
                const data = JSON.parse(stored)
                setNick(data.nick || '')
                setMail(data.mail || '')
                setLink(data.link || '')
            }
        } catch (e) {}
    }, [])

    const handleSave = () => {
        try {
            const stored = localStorage.getItem('twikoo')
            let data = stored ? JSON.parse(stored) : {}
            data.nick = nick; data.mail = mail; data.link = link
            localStorage.setItem('twikoo', JSON.stringify(data))
            onSave()
            onClose()
        } catch (e) { console.error(e) }
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xs bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-2xl shadow-2xl border border-white/20 p-5"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm dark:text-white">{t('msg_settings_title') || 'Settings'}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"><X size={16}/></button>
                </div>
                <div className="space-y-4">
                    {[
                        { label: t('msg_nick') || 'Nickname', val: nick, set: setNick, ph: 'Your Name' },
                        { label: t('msg_email') || 'Email', val: mail, set: setMail, ph: 'email@example.com' },
                        { label: t('msg_link') || 'Website', val: link, set: setLink, ph: 'https://...' }
                    ].map((field, i) => (
                        <div key={i}>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{field.label}</label>
                            <input 
                                value={field.val} 
                                onChange={e=>field.set(e.target.value)} 
                                className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 text-black dark:text-white transition-all" 
                                placeholder={field.ph}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-transform active:scale-95">
                        <Save size={14}/> {t('msg_save') || 'Save'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export const Messages = () => {
  const { t } = useI18n()
  
  const CONTACTS = useMemo<Contact[]>(() => [
    { 
      id: 'guestbook', 
      name: t('msg_guestbook') || 'Guestbook', 
      slug: 'messages-guestbook', 
      avatar: '🌍', 
      desc: t('msg_guestbook_desc') || 'Leave a message for the world.',
      time: 'Now'
    },
    { 
      id: 'tech', 
      name: t('msg_tech') || 'Tech Talk', 
      slug: 'messages-tech', 
      avatar: '💻', 
      desc: t('msg_tech_desc') || 'Discuss technology stacks.',
      time: 'Yesterday'
    },
    { 
      id: 'feedback', 
      name: t('msg_bug') || 'Feedback', 
      slug: 'messages-bugs', 
      avatar: '🐛', 
      desc: t('msg_bug_desc') || 'Report bugs or suggestions.',
      time: 'Mon'
    }
  ], [t])

  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [inputValue, setInputValue] = useState('')
  // 移动端视图控制：true显示列表，false显示聊天详情
  const [isMobileListVisible, setIsMobileListVisible] = useState(true) 
  const [currentSystem, setCurrentSystem] = useState<'twikoo' | 'giscus'>('twikoo')

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // 处理输入框同步：仅适用于 Twikoo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      
      if (currentSystem === 'twikoo') {
          const twikooTextarea = document.querySelector('.imessage-mode .el-textarea__inner') as HTMLTextAreaElement
          if (twikooTextarea) {
              // 模拟真实输入
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
              nativeInputValueSetter?.call(twikooTextarea, val);
              
              twikooTextarea.dispatchEvent(new Event('input', { bubbles: true }));
              twikooTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          }
      }
  }

  const handleSend = () => {
      if (!inputValue.trim() || currentSystem !== 'twikoo') return
      
      const twikooSendBtn = document.querySelector('.imessage-mode .tk-send') as HTMLButtonElement
      if (twikooSendBtn) {
          twikooSendBtn.click()
          setInputValue('')
          // Twikoo 发送后清空逻辑可能由 DOM 自身处理，这里仅重置 React 状态
      }
  }

  const handleContactClick = (id: string) => {
      setActiveContactId(id)
      setIsMobileListVisible(false) // 移动端切到详情
  }

  return (
    <div className="flex h-[600px] w-full max-w-5xl mx-auto bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative rounded-2xl shadow-2xl border border-gray-200 dark:border-white/5">
      
      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}
      </AnimatePresence>

      {/* 左侧边栏 (Contact List) */}
      <motion.div 
        className={clsx(
            "flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl absolute inset-0 z-10 md:relative md:w-[280px] md:z-0 transition-transform duration-300",
        )}
        initial={false}
        animate={{ x: isMobileListVisible ? '0%' : '-100%' }}
        // 在桌面端强制显示，忽略 x 位移
        style={{ transform: undefined }} 
      >
         {/* 移动端处理逻辑：使用 CSS Media Query 覆盖 motion 的样式 is tricky, 
             这里我们简单处理：在 mobile 下依靠 animate 移走，desktop 下 flex 布局会覆盖 absolute */}
         <div className={clsx("h-full flex flex-col w-full md:w-auto", !isMobileListVisible && "hidden md:flex")}>
            <div className="h-14 flex items-center justify-between px-3 shrink-0 pt-3 mb-2">
            <div className="relative flex-1 mr-2">
                <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                <input 
                    type="text" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder={t('msg_search') || 'Search'} 
                    className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none transition-all placeholder-gray-500"
                />
            </div>
            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500 transition-colors"><Edit size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {filteredContacts.map(contact => (
                    <div 
                        key={contact.id} 
                        onClick={() => handleContactClick(contact.id)} 
                        className={clsx(
                            "group flex gap-3 p-3 rounded-xl cursor-pointer transition-all select-none border border-transparent",
                            activeContactId === contact.id 
                                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" 
                                : "hover:bg-gray-200 dark:hover:bg-white/5 hover:border-gray-300/50 dark:hover:border-white/5"
                        )}
                    >
                        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 bg-white shadow-sm overflow-hidden transition-transform", activeContactId === contact.id ? "scale-95 ring-2 ring-white/30 bg-white/20 backdrop-blur-md" : "")}>
                            {contact.avatar}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                            <div className="flex justify-between items-baseline">
                                <span className={clsx("font-bold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>{contact.name}</span>
                                <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>{contact.time}</span>
                            </div>
                            <div className={clsx("text-xs truncate opacity-90", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>{contact.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </motion.div>

      {/* 右侧主内容 (Chat Area) */}
      <div className={clsx("absolute inset-0 z-0 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] md:static md:flex-1 transition-all duration-300", isMobileListVisible ? "translate-x-full md:translate-x-0" : "translate-x-0")}>
        
        {/* Header */}
        <div className="h-14 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3">
                {/* 移动端返回按钮 */}
                <button 
                    onClick={() => setIsMobileListVisible(true)} 
                    className="md:hidden p-1 -ml-2 mr-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 rounded-full"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 hidden sm:inline">{t('msg_to') || 'To:'}</span>
                        <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all" title="Settings"><Settings size={18} /></button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 dark:bg-[#151515]">
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
                onSystemChange={setCurrentSystem} // 回调获取当前系统
            />
        </div>

        {/* Input Area - 条件渲染 */}
        <div className="shrink-0 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30">
            {currentSystem === 'giscus' ? (
                <div className="p-3 text-center text-xs text-gray-400 select-none flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    GitHub Giscus Active - Please type above
                </div>
            ) : (
                <div className="p-4 pt-3 pb-5">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('msg_imessage') || 'iMessage'}
                            className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-full py-2.5 pl-5 pr-12 text-sm outline-none focus:border-blue-500 transition-all text-black dark:text-white shadow-sm"
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={!inputValue.trim()} 
                            className={clsx(
                                "absolute right-1.5 top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                                inputValue.trim() 
                                    ? "bg-blue-500 text-white hover:bg-blue-600 scale-100" 
                                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed scale-90 opacity-70"
                            )}
                        >
                            <ArrowUp size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}