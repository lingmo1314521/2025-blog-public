'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, Edit, Settings, X, Save, ArrowUp, RefreshCw, MessageCircle } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'
import { toast } from 'sonner' 

// --- SettingsModal (你的自定义设置) ---
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
            
            const inputs = document.querySelectorAll('.imessage-mode input')
            inputs.forEach((input: any) => {
                if(input.name === 'nick') { input.value = nick; input.dispatchEvent(new Event('input')); }
                if(input.name === 'mail') { input.value = mail; input.dispatchEvent(new Event('input')); }
                if(input.name === 'link') { input.value = link; input.dispatchEvent(new Event('input')); }
            })

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
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full cursor-pointer"><X size={14}/></button>
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
  const [replyTargetText, setReplyTargetText] = useState('') 

  const containerRef = useRef<HTMLDivElement>(null)
  
  const headerCountRef = useRef<HTMLDivElement>(null)
  const headerIconsRef = useRef<HTMLDivElement>(null)

  const observerRef = useRef<MutationObserver | null>(null);
  const isProcessingRef = useRef(false);

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // --- 获取 Twikoo 输入框 ---
  const getTwikooElements = useCallback(() => {
      const cancelBtn = document.querySelector('.imessage-mode .tk-cancel') as HTMLButtonElement
      if (cancelBtn) {
          const formContainer = cancelBtn.closest('.tk-submit')
          if (formContainer) {
              return {
                  input: formContainer.querySelector('textarea') as HTMLTextAreaElement,
                  btn: formContainer.querySelector('.tk-send') as HTMLButtonElement,
                  cancelBtn: cancelBtn,
                  isReplyMode: true
              }
          }
      }

      const allTextareas = Array.from(document.querySelectorAll('.imessage-mode textarea'))
      const mainInput = allTextareas[allTextareas.length - 1] as HTMLTextAreaElement
      let mainBtn = null
      if (mainInput) {
          const wrapper = mainInput.closest('.tk-submit')
          if (wrapper) mainBtn = wrapper.querySelector('.tk-send') as HTMLButtonElement
      }
      if (!mainBtn) mainBtn = document.querySelector('.imessage-mode .tk-send') as HTMLButtonElement

      return {
          input: mainInput,
          btn: mainBtn,
          cancelBtn: null,
          isReplyMode: false
      }
  }, [])

  // --- 核心：DOM 操作 (搬运头元素 + 平铺排序) ---
  const processDomChanges = useCallback(() => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        // --- 1. 搬运头部元素 ---
        const originalHeader = document.querySelector('.imessage-mode .tk-comments-title');
        
        if (originalHeader) {
            // A. 评论数 -> 左上角
            const countEl = originalHeader.querySelector('.tk-comments-count');
            if (countEl && headerCountRef.current && !headerCountRef.current.contains(countEl)) {
                headerCountRef.current.innerHTML = ''; 
                headerCountRef.current.appendChild(countEl);
            }

            // B. 图标 -> 右上角
            const iconWrappers = originalHeader.querySelectorAll('.tk-icon');
            if (iconWrappers.length > 0 && headerIconsRef.current) {
                const siblings = Array.from(originalHeader.children).filter(child => !child.classList.contains('tk-comments-count'));
                siblings.forEach(sibling => {
                    if (!headerIconsRef.current?.contains(sibling)) {
                        headerIconsRef.current?.appendChild(sibling);
                    }
                });
            }
        }

        const container = document.querySelector('.imessage-mode .tk-comments-container');
        if (!container) return;

        // --- 2. 嵌套回复处理 ---
        const nestedReplies = Array.from(document.querySelectorAll('.imessage-mode .tk-replies .tk-comment'));
        
        if (nestedReplies.length > 0) {
            nestedReplies.forEach(reply => {
                const contentBox = reply.querySelector('.tk-content');
                if (contentBox && !contentBox.querySelector('.imessage-quote')) {
                    const replyList = reply.closest('.tk-replies');
                    const parentComment = replyList?.closest('.tk-comment') as HTMLElement;
                    if (parentComment) {
                        const parentNick = parentComment.querySelector('.tk-main > .tk-row .tk-nick')?.textContent || 'User';
                        const parentContentElem = parentComment.querySelector('.tk-main > .tk-content');
                        let parentText = parentContentElem?.textContent?.replace(/\s+/g, ' ').trim() || '';
                        
                        const existingQuote = parentContentElem?.querySelector('.imessage-quote');
                        if (existingQuote && existingQuote.textContent) {
                            parentText = parentText.replace(existingQuote.textContent, '').trim();
                        }
                        const replyPrefix = parentContentElem?.querySelector('span:first-child');
                        if (replyPrefix && replyPrefix.textContent?.includes('回复')) {
                             parentText = parentText.replace(replyPrefix.textContent, '').trim();
                        }

                        if (parentText.length > 30) parentText = parentText.slice(0, 30) + '...';

                        const quoteDiv = document.createElement('div');
                        quoteDiv.className = 'imessage-quote';
                        quoteDiv.innerHTML = `<span class="imessage-quote-name">${parentNick}:</span> ${parentText}`;
                        contentBox.insertBefore(quoteDiv, contentBox.firstChild);
                    }
                }
                container.appendChild(reply);
            });
        }

        // --- 3. 排序 ---
        const comments = Array.from(container.children).filter(child => child.classList.contains('tk-comment'));
        if (comments.length > 1) {
             const sorted = comments.sort((a, b) => {
                const tA = a.querySelector('time')?.getAttribute('datetime') || '1970-01-01';
                const tB = b.querySelector('time')?.getAttribute('datetime') || '1970-01-01';
                return new Date(tA).getTime() - new Date(tB).getTime(); 
            });
            sorted.forEach(c => container.appendChild(c));
        }

      } catch (e) {
          console.error("DOM processing error:", e);
      } finally {
          isProcessingRef.current = false;
      }
  }, [])

  // 监听 DOM
  useEffect(() => {
    const handleMutation = () => {
        if (observerRef.current) observerRef.current.disconnect();

        try {
            const { isReplyMode, cancelBtn } = getTwikooElements()
            
            if (isReplyMode !== isReplying) {
                setIsReplying(isReplyMode)
            }
            
            if (isReplyMode && cancelBtn) {
                const form = cancelBtn.closest('.tk-submit')
                if(form) {
                    const parentContainer = form.parentElement?.closest('.tk-comment')
                    if (parentContainer) {
                        const nick = parentContainer.querySelector('.tk-nick')?.textContent
                        const newText = nick ? `Replying to ${nick}` : 'Replying...';
                        if (newText !== replyTargetText) setReplyTargetText(newText);
                    }
                }
            } else {
                setReplyTargetText('')
            }

            processDomChanges();

        } finally {
            if (observerRef.current) {
                observerRef.current.observe(document.body, { childList: true, subtree: true });
            }
        }
    };

    observerRef.current = new MutationObserver(handleMutation);
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
        if (observerRef.current) observerRef.current.disconnect();
    }
  }, [isReplying, replyTargetText, getTwikooElements, processDomChanges])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      const { input } = getTwikooElements()
      if (input) {
          input.value = val
          input.dispatchEvent(new Event('input', { bubbles: true }))
      }
  }

  const handleSend = () => {
      if (!inputValue.trim()) return
      const { input, btn } = getTwikooElements()
      if(input) {
        input.value = inputValue
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      setTimeout(() => {
        if (btn) {
            btn.click()
            setInputValue('')
            setTimeout(() => {
                const container = document.querySelector('.imessage-mode .tk-comments-container')
                if (container) container.scrollTop = container.scrollHeight
            }, 300)
        } else {
            toast.error("Send button not found")
        }
      }, 50)
  }

  const handleCancelReply = () => {
      const { cancelBtn } = getTwikooElements()
      if(cancelBtn) cancelBtn.click()
      setIsReplying(false)
      setInputValue('')
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative" ref={containerRef}>
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}

      {/* 左侧边栏 (保持不变) */}
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

      {/* 右侧主内容 */}
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

        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30 relative group">
            
            {/* 左上角：评论数搬运点 */}
            <div id="twikoo-moved-count" ref={headerCountRef} className="absolute top-2 left-6 z-40 select-none pointer-events-none"></div>
            
            {/* 右上角：管理图标搬运点 */}
            <div id="twikoo-moved-icons" ref={headerIconsRef} className="absolute top-2 right-6 z-40 flex items-center gap-2"></div>

            <div className="relative max-w-4xl mx-auto w-full pt-3">
                {isReplying && (
                    <div className="absolute -top-7 left-0 right-0 flex items-center justify-between bg-gray-200/90 dark:bg-[#333]/90 backdrop-blur-sm px-4 py-2 rounded-lg text-xs border border-gray-300 dark:border-white/10 shadow-sm animate-in slide-in-from-bottom-2 z-10">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate">
                            <MessageCircle size={12} className="text-blue-500"/>
                            <span className="font-medium truncate max-w-[200px]">{replyTargetText || 'Replying...'}</span>
                        </div>
                        <button onClick={handleCancelReply} className="ml-2 p-1 hover:bg-gray-300 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                            <X size={12} className="text-gray-500"/>
                        </button>
                    </div>
                )}

                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isReplying ? "Reply to message..." : t('msg_imessage')}
                    className={clsx(
                        "w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-500 transition-all text-black dark:text-white",
                        isReplying && "border-blue-400 ring-2 ring-blue-500/20"
                    )}
                />
                <button 
                    onClick={handleSend} 
                    disabled={!inputValue.trim()} 
                    className={`absolute right-1 top-4 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${inputValue.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'}`}
                >
                    <ArrowUp size={16} strokeWidth={3} />
                </button>
            </div>
            
            <div className="text-[10px] text-center text-gray-400 mt-2 select-none flex justify-center gap-1">
                <span>iMessage</span>
                <span>•</span>
                <span>Powered by Twikoo</span>
            </div>
        </div>
      </div>
    </div>
  )
}