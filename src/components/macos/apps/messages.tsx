'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Edit, Settings, X, Save, ArrowUp, Loader2 } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'

// 设置弹窗 (保持原有逻辑，UI 微调)
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="w-80 bg-[#f2f2f7] dark:bg-[#1c1c1e] rounded-2xl shadow-2xl border border-white/20 p-5 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-base dark:text-white">{t('msg_settings_title')}</h3>
                    <button onClick={onClose} className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-full transition-colors"><X size={14} className="text-gray-600 dark:text-gray-300"/></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-white dark:bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                        <div className="flex items-center px-4 py-3">
                            <label className="w-16 text-xs font-medium text-gray-500">{t('msg_nick')}</label>
                            <input value={nick} onChange={e=>setNick(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-black dark:text-white placeholder-gray-400" placeholder={t('msg_nick_ph')}/>
                        </div>
                        <div className="flex items-center px-4 py-3">
                            <label className="w-16 text-xs font-medium text-gray-500">{t('msg_email')}</label>
                            <input value={mail} onChange={e=>setMail(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-black dark:text-white placeholder-gray-400" placeholder={t('msg_email_ph')}/>
                        </div>
                        <div className="flex items-center px-4 py-3">
                            <label className="w-16 text-xs font-medium text-gray-500">{t('msg_link')}</label>
                            <input value={link} onChange={e=>setLink(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-black dark:text-white placeholder-gray-400" placeholder="https://..."/>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2">
                        {t('msg_save')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export const Messages = () => {
  const { t } = useI18n()
  
  const CONTACTS = useMemo(() => [
    { 
      id: 'guestbook', 
      name: t('msg_guestbook'), 
      slug: 'messages-guestbook', 
      avatar: '🌍', 
      desc: t('msg_guestbook_desc'),
      time: t('msg_now')
    },
    { 
      id: 'tech', 
      name: t('msg_tech'), 
      slug: 'messages-tech', 
      avatar: '💻', 
      desc: t('msg_tech_desc'),
      time: t('msg_yesterday')
    },
    { 
      id: 'feedback', 
      name: t('msg_bug'), 
      slug: 'messages-bugs', 
      avatar: '🐛', 
      desc: t('msg_bug_desc'),
      time: t('msg_mon')
    }
  ], [t])

  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  
  // Input State
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Refs
  const messageListRef = useRef<HTMLDivElement>(null)

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // ----------------------------------------------------------------
  // Twikoo Interaction Logic (The "Magic" Bridge)
  // ----------------------------------------------------------------

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messageListRef.current) {
        // 找到内部的滚动容器
        const scrollContainer = messageListRef.current.querySelector('.tk-comments-container') || messageListRef.current.querySelector('.tk-comments')
        if (scrollContainer) {
            scrollContainer.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
        }
    }
  }

  // 监听 Twikoo 加载完成
  useEffect(() => {
    const handleLoaded = () => setTimeout(scrollToBottom, 500)
    window.addEventListener('twikoo-loaded', handleLoaded)
    return () => window.removeEventListener('twikoo-loaded', handleLoaded)
  }, [])

  const handleSend = async () => {
      if (!inputValue.trim() || isSending) return

      setIsSending(true)

      // 1. 查找 Twikoo 原生的输入框和按钮
      // 注意：Twikoo 在 imessage-mode 下被 CSS 隐藏了，但 DOM 还在
      const twikooTextarea = document.querySelector('.imessage-mode textarea.el-textarea__inner') as HTMLTextAreaElement
      const twikooSendBtn = document.querySelector('.imessage-mode .tk-send') as HTMLButtonElement

      if (twikooTextarea && twikooSendBtn) {
          // 2. 填入值
          twikooTextarea.value = inputValue
          
          // 3. 触发 Input 事件 (React/Vue 依赖此更新内部状态)
          twikooTextarea.dispatchEvent(new Event('input', { bubbles: true }))
          
          // 4. 短暂延迟后点击发送 (给框架一点反应时间)
          setTimeout(() => {
              twikooSendBtn.click()
              
              // 5. 清理状态
              setInputValue('')
              setIsSending(false)
              
              // 6. 预测性滚动：发送后通常会有新消息，延迟滚动
              setTimeout(scrollToBottom, 1000)
          }, 100)
      } else {
          console.error("Twikoo DOM elements not found. Is Twikoo loaded?")
          setIsSending(false)
      }
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}

      {/* --- 左侧边栏 (Sidebar) --- */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/95 dark:bg-[#252525]/95 backdrop-blur-xl z-20">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-3 shrink-0 pt-2 mb-1">
           <div className="relative flex-1 mr-2 group">
              <Search size={14} className="absolute left-2.5 top-2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={t('msg_search')} 
                className="w-full bg-gray-200/60 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-black/40 focus:border-blue-500/30 rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none transition-all placeholder-gray-500"
              />
           </div>
           <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-blue-500 transition-colors">
               <Edit size={18} strokeWidth={2.5} />
           </button>
        </div>
        
        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-none">
            {filteredContacts.map(contact => (
                <div key={contact.id} onClick={() => { setActiveContactId(contact.id); setReloadKey(k => k + 1) }} className={clsx("group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5 select-none relative overflow-hidden", activeContactId === contact.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-200 dark:hover:bg-white/5 active:scale-[0.98]")}>
                    <div className={clsx("w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm overflow-hidden border transition-colors", activeContactId === contact.id ? "bg-white/20 border-transparent text-white backdrop-blur-sm" : "border-gray-100 dark:border-white/5 text-gray-600 dark:bg-white/5")}>
                        {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <div className="flex justify-between items-baseline">
                            <span className={clsx("font-semibold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>{contact.name}</span>
                            <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>{contact.time}</span>
                        </div>
                        <div className={clsx("text-xs truncate opacity-90 pr-2", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>{contact.desc}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- 右侧主内容 (Main Chat) --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-6 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">{t('msg_to')}:</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{activeContact.name}</span>
                </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all" title={t('msg_settings_title')}>
                <Settings size={18} />
            </button>
        </div>

        {/* Chat Area (Twikoo Rendered Here) */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#fff] dark:bg-[#000]" ref={messageListRef}>
            {/* 这里使用 absolute inset-0 确保滚动区域正确 */}
            <div className="absolute inset-0 overflow-y-auto scrollbar-none pb-4">
                <CommentSystem 
                    key={`${activeContact.slug}-${reloadKey}`} 
                    slug={activeContact.slug} 
                    title={activeContact.name}
                    compact={true} 
                    reloadKey={reloadKey}
                />
            </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-[#f5f5f5]/90 dark:bg-[#1e1e1e]/90 border-t border-gray-200 dark:border-white/10 z-30 backdrop-blur-md">
            <div className="relative max-w-4xl mx-auto flex items-end gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
                        placeholder={t('msg_imessage')}
                        disabled={isSending}
                        className="w-full bg-white dark:bg-[#2c2c2e] border border-gray-300 dark:border-gray-700 rounded-2xl py-2.5 pl-4 pr-10 text-sm outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-black dark:text-white disabled:opacity-50"
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={!inputValue.trim() || isSending} 
                        className={`absolute right-1.5 top-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                            inputValue.trim() && !isSending
                                ? 'bg-blue-500 text-white hover:bg-blue-600 scale-100' 
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 scale-90 opacity-0'
                        }`}
                    >
                        {isSending ? <Loader2 size={14} className="animate-spin"/> : <ArrowUp size={16} strokeWidth={3} />}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}