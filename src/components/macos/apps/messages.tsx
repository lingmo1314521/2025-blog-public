'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Edit, Settings, X, Save, ArrowUp, MessageCircle, Reply } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'

// ... (SettingsModal 代码保持不变，请直接复制之前的) ...
const SettingsModal = ({ onClose, onSave }: { onClose: () => void, onSave: () => void }) => {
    // ... 代码同上一次回答 ...
    const { t } = useI18n()
    const [nick, setNick] = useState('')
    const [mail, setMail] = useState('')
    const [link, setLink] = useState('')
    useEffect(() => { try { const s = localStorage.getItem('twikoo'); if(s) { const d = JSON.parse(s); setNick(d.nick||''); setMail(d.mail||''); setLink(d.link||'') } } catch{} }, [])
    const handleSave = () => { try { const s = localStorage.getItem('twikoo'); const d = s ? JSON.parse(s) : {}; d.nick=nick; d.mail=mail; d.link=link; localStorage.setItem('twikoo', JSON.stringify(d)); onSave(); onClose() } catch{} }
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm dark:text-white">{t('msg_settings_title')}</h3><button onClick={onClose}><X size={14}/></button></div>
                <div className="space-y-3">
                    <input value={nick} onChange={e=>setNick(e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-xs" placeholder={t('msg_nick_ph')}/>
                    <input value={mail} onChange={e=>setMail(e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-xs" placeholder={t('msg_email_ph')}/>
                    <input value={link} onChange={e=>setLink(e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-xs" placeholder="Website"/>
                </div>
                <div className="mt-5 flex justify-end"><button onClick={handleSave} className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex gap-1"><Save size={12}/> {t('msg_save')}</button></div>
            </div>
        </div>
    )
}

export const Messages = () => {
  const { t } = useI18n()
  
  const CONTACTS = useMemo(() => [
    { id: 'guestbook', name: t('msg_guestbook'), slug: 'messages-guestbook', avatar: '🌍', desc: t('msg_guestbook_desc'), time: t('msg_now') },
    // ... 其他联系人 ...
  ], [t])

  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [msgCount, setMsgCount] = useState(0)
  
  // 新增：回复状态
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      const twikooTextarea = document.querySelector('.imessage-mode .el-textarea__inner') as HTMLTextAreaElement
      if (twikooTextarea) {
          twikooTextarea.value = val
          twikooTextarea.dispatchEvent(new Event('input', { bubbles: true }))
      }
  }

  const handleSend = () => {
      if (!inputValue.trim()) return
      const twikooSendBtn = document.querySelector('.imessage-mode .tk-send') as HTMLButtonElement
      if (twikooSendBtn) {
          twikooSendBtn.click()
          setInputValue('')
          // 发送后重置回复状态
          setReplyingTo(null)
      }
  }

  // 取消回复
  const cancelReply = () => {
      setReplyingTo(null)
      // 模拟点击 Twikoo 隐藏的“取消”按钮，以恢复表单位置
      const cancelBtn = document.querySelector('.imessage-mode .tk-cancel') as HTMLElement
      if (cancelBtn) cancelBtn.click()
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}

      {/* 左侧边栏 (代码省略，保持不变) */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl">
         {/* ... Search & List ... */}
         <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredContacts.map(contact => (
                <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={clsx("group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5 select-none", activeContactId === contact.id ? "bg-blue-500 text-white shadow-sm" : "hover:bg-gray-200 dark:hover:bg-white/5")}>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">{contact.avatar}</div>
                    <div className="flex-1"><div className="font-bold text-sm">{contact.name}</div><div className="text-xs opacity-70">{contact.desc}</div></div>
                </div>
            ))}
         </div>
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
        {/* Top Bar */}
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{t('msg_to')}</span><span className="text-xs font-bold text-blue-500 bg-blue-100/50 px-2 py-0.5 rounded-full">{activeContact.name}</span></div>
            <button onClick={() => setShowSettings(true)}><Settings size={16} className="text-gray-400 hover:text-blue-500"/></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
                onCountChange={setMsgCount}
                onReply={(nick) => setReplyingTo(nick)} // 接收回复事件
            />
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30 flex flex-col gap-2">
            
            {/* 状态栏：显示评论数 或 正在回复 */}
            <div className="flex items-center justify-between px-2">
                {replyingTo ? (
                    <div className="flex items-center gap-2 text-xs text-blue-500 font-bold animate-in slide-in-from-bottom-2">
                        <Reply size={12} className="rotate-180"/>
                        <span>Replying to @{replyingTo}</span>
                        <button onClick={cancelReply} className="hover:bg-gray-200 rounded-full p-0.5"><X size={12}/></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium select-none">
                        <MessageCircle size={10} />
                        <span>{msgCount} Messages</span>
                    </div>
                )}
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={replyingTo ? `Reply to ${replyingTo}...` : t('msg_imessage')}
                    className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-500 transition-all text-black dark:text-white"
                />
                <button onClick={handleSend} disabled={!inputValue.trim()} className={`absolute right-1 top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all ${inputValue.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'}`}>
                    <ArrowUp size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}