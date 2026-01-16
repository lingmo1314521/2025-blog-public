'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Edit, Settings, X, Save, ArrowUp } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'

// 设置弹窗
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm dark:text-white">{t('msg_settings_title')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><X size={14}/></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('msg_nick')}</label>
                        <input value={nick} onChange={e=>setNick(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder={t('msg_nick_ph')}/>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('msg_email')}</label>
                        <input value={mail} onChange={e=>setMail(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder={t('msg_email_ph')}/>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('msg_link')}</label>
                        <input value={link} onChange={e=>setLink(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder="https://..."/>
                    </div>
                </div>
                <div className="mt-5 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                        <Save size={12}/> {t('msg_save')}
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
      id: 'design', 
      name: t('msg_design'), 
      slug: 'messages-design', 
      avatar: '🎨', 
      desc: t('msg_design_desc'),
      time: t('msg_last_week')
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
  const [inputValue, setInputValue] = useState('')
  const [twikooReady, setTwikooReady] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // 检查是否可以发送消息
  const canSend = inputValue.trim() !== '' && twikooReady && !isSending

  // 处理 Twikoo 准备就绪
  const handleTwikooReady = useCallback((isReady: boolean) => {
    if (!isMounted) return
    setTwikooReady(isReady)
  }, [isMounted])

  // 处理消息输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    
    // 通知 Twikoo 输入框更新
    if (twikooReady && window.__commentSystem) {
      try {
        window.__commentSystem.setInputValue(val)
      } catch (error) {
        console.error('Error setting input value:', error)
      }
    }
  }

  // 处理发送消息
  const handleSend = async () => {
    if (!canSend || !isMounted) return
    
    setIsSending(true)
    
    try {
      // 使用全局函数发送消息
      if (window.__commentSystem) {
        const success = window.__commentSystem.sendMessage()
        if (success) {
          setInputValue('')
          // 等待评论刷新
          setTimeout(() => {
            if (!isMounted) return
            // 滚动到底部查看新消息
            const commentsContainer = document.querySelector('.tk-comments-container')
            if (commentsContainer) {
              commentsContainer.scrollTop = commentsContainer.scrollHeight
            }
          }, 500)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      if (isMounted) {
        setIsSending(false)
      }
    }
  }

  // 处理键盘事件
  useEffect(() => {
    if (!isMounted) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canSend) {
        e.preventDefault()
        handleSend()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canSend, isMounted])

  // 监听联系人的切换
  useEffect(() => {
    if (!isMounted) return
    
    setInputValue('')
    setTwikooReady(false)
  }, [activeContactId, isMounted])

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时清理全局变量
      if (window.__commentSystem) {
        try {
          delete window.__commentSystem
        } catch (e) {}
      }
    }
  }, [])

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}

      {/* 左侧边栏 */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2">
              <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('msg_search')} className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"/>
           </div>
           <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500"><Edit size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredContacts.map(contact => (
                <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={clsx("group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5 select-none", activeContactId === contact.id ? "bg-blue-500 text-white shadow-sm" : "hover:bg-gray-200 dark:hover:bg-white/5")}>
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm overflow-hidden", activeContactId === contact.id ? "bg-white/20 text-white backdrop-blur-sm" : "text-gray-600")}>{contact.avatar}</div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline">
                            <span className={clsx("font-semibold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>{contact.name}</span>
                            <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>{contact.time}</span>
                        </div>
                        <div className={clsx("text-xs truncate opacity-90", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>{contact.desc}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{t('msg_to')}</span>
                <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span>
                    {!twikooReady && (
                      <span className="ml-1 h-1.5 w-1.5 animate-ping rounded-full bg-yellow-500"></span>
                    )}
                </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all" title={t('msg_settings_title')}><Settings size={16} /></button>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col">
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
                onTwikooReady={handleTwikooReady}
            />
        </div>

        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30">
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={twikooReady ? t('msg_imessage') : t('msg_loading')}
                    disabled={!twikooReady || isSending}
                    className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-500 transition-all text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={handleSend} 
                  disabled={!canSend}
                  className={`absolute right-1 top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all ${canSend ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'}`}
                >
                  {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <ArrowUp size={16} strokeWidth={3} />
                  )}
                </button>
            </div>
            <div className="mt-2 text-[10px] text-gray-400 text-center">
              {t('msg_tip')} {twikooReady ? t('msg_tip_ready') : t('msg_tip_loading')}
            </div>
        </div>
      </div>
    </div>
  )
}