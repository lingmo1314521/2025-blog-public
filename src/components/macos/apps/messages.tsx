'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Edit, Settings, X, Save, ArrowUp, RefreshCw } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'
import { toast } from 'sonner' 

// SettingsModal 保持不变
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
            
            // 同步设置到 DOM
            const twikooNameInput = document.querySelector('.imessage-mode input[name="nick"]') as HTMLInputElement
            const twikooMailInput = document.querySelector('.imessage-mode input[name="mail"]') as HTMLInputElement
            if(twikooNameInput) { twikooNameInput.value = nick; twikooNameInput.dispatchEvent(new Event('input')); }
            if(twikooMailInput) { twikooMailInput.value = mail; twikooMailInput.dispatchEvent(new Event('input')); }

            onSave()
            onClose()
            toast.success('Settings saved')
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
                    <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer">
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
  const [isReplying, setIsReplying] = useState(false)

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // --- 核心逻辑修复区 ---

  // 获取 Twikoo 的“根”容器 (即包含输入框和发送按钮的那个 div)
  const getTwikooSubmitArea = () => {
      // 必须加上 .imessage-mode 范围限制，防止选中页面其他部分的组件（虽然一般只有一个）
      return document.querySelector('.imessage-mode .tk-submit') as HTMLElement
  }

  // 检测是否处于回复模式
  useEffect(() => {
    const observer = new MutationObserver(() => {
        const submitArea = getTwikooSubmitArea()
        if (!submitArea) return

        // 查找“取消回复”按钮，如果存在，说明当前正处于回复状态
        // Twikoo 的取消按钮类名为 .tk-cancel
        const cancelBtn = submitArea.querySelector('.tk-cancel')
        
        // 只有当 cancelBtn 存在且不是 hidden 时，才算回复模式
        const isReplyingState = !!(cancelBtn && getComputedStyle(cancelBtn).display !== 'none')
        setIsReplying(isReplyingState)
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  // 强力同步函数：模拟 Vue 需要的所有事件
  const syncToTwikoo = (value: string) => {
      const submitArea = getTwikooSubmitArea()
      if (!submitArea) return

      const textarea = submitArea.querySelector('.el-textarea__inner') as HTMLTextAreaElement
      if (textarea) {
          textarea.value = value
          // 触发 Vue 的双向绑定
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.dispatchEvent(new Event('change', { bubbles: true }))
      }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      syncToTwikoo(val)
  }

  const handleSend = () => {
      if (!inputValue.trim()) return

      const submitArea = getTwikooSubmitArea()
      if (!submitArea) {
          toast.error("Message system not ready")
          return
      }

      // 1. 再次强制同步（防止最后一次输入没被捕获）
      syncToTwikoo(inputValue)

      // 2. 在当前活跃的区域内查找发送按钮
      // 这修复了“回复变成新消息”的 Bug，因为我们在正确的上下文点击了按钮
      const sendBtn = submitArea.querySelector('.tk-send') as HTMLButtonElement
      
      if (sendBtn) {
          sendBtn.click()
          setInputValue('')
          
          // 3. UI 反馈：清空后稍微滚动到底部
          setTimeout(() => {
              const scrollContainer = document.querySelector('.imessage-mode .tk-comments-container')
              if(scrollContainer) {
                  scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
              }
          }, 300)
      } else {
          toast.error("Could not find send button")
      }
  }

  const handleCancelReply = () => {
      const submitArea = getTwikooSubmitArea()
      if (submitArea) {
          const cancelBtn = submitArea.querySelector('.tk-cancel') as HTMLButtonElement
          if(cancelBtn) cancelBtn.click()
      }
      setIsReplying(false)
      setInputValue('')
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}

      {/* 侧边栏 */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl z-20">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2">
              <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('msg_search')} className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"/>
           </div>
           <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500 cursor-pointer"><Edit size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-none">
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

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative z-0">
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{t('msg_to')}</span>
                <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setReloadKey(k => k + 1)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer"><RefreshCw size={14} /></button>
                <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer" title={t('msg_settings_title')}><Settings size={16} /></button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col w-full">
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
            />
        </div>

        {/* 底部输入区 */}
        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30">
            <div className="relative max-w-4xl mx-auto w-full">
                {/* 回复状态提示栏 */}
                {isReplying && (
                    <div className="absolute -top-8 left-0 flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-t-lg text-xs text-gray-600 dark:text-gray-300 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <span className="font-bold text-blue-500">Replying...</span>
                        <button onClick={handleCancelReply} className="hover:text-red-500 cursor-pointer ml-2 bg-white/50 rounded-full p-0.5"><X size={10}/></button>
                    </div>
                )}

                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isReplying ? "Reply to this message..." : t('msg_imessage')}
                    className={clsx(
                        "w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-500 transition-all text-black dark:text-white",
                        isReplying && "rounded-tl-none border-l-4 border-l-blue-500 shadow-md"
                    )}
                />
                <button 
                    onClick={handleSend} 
                    disabled={!inputValue.trim()} 
                    className={`absolute right-1 top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${inputValue.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'}`}
                >
                    <ArrowUp size={16} strokeWidth={3} />
                </button>
            </div>
            <div className="text-[10px] text-center text-gray-400 mt-2 select-none">
                iMessage • Powered by Twikoo
            </div>
        </div>
      </div>
    </div>
  )
}