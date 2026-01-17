'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, Edit, Settings, X, ArrowUp, RefreshCw, MessageCircle, Shield } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { toast } from 'sonner' 

// ==================================================================================
// 1. 独立的 Twikoo 后台宿主组件 (修复归还逻辑)
// ==================================================================================
const TwikooAdminHost = () => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const adminEl = document.querySelector('.tk-admin-container') as HTMLElement
        const originalParent = adminEl?.parentElement || document.body

        if (adminEl && containerRef.current) {
            // 搬运
            containerRef.current.appendChild(adminEl)
            
            // 强制显示
            adminEl.style.display = 'block'
            adminEl.style.opacity = '1'
            adminEl.style.position = 'static'
            adminEl.style.width = '100%'
            adminEl.style.zIndex = '10'
            adminEl.style.pointerEvents = 'auto'
            
            // 隐藏内部关闭按钮
            const closeBtn = adminEl.querySelector('.tk-admin-close') as HTMLElement
            if (closeBtn) closeBtn.style.display = 'none' 
        }

        return () => {
            // 窗口关闭时：归还 DOM 并隐藏
            if (adminEl) {
                originalParent.appendChild(adminEl)
                adminEl.style.display = 'none' // 关键：还回去时必须隐藏，等待下次 Twikoo 唤醒
                
                // 恢复关闭按钮显示，以防万一
                const closeBtn = adminEl.querySelector('.tk-admin-close') as HTMLElement
                if (closeBtn) closeBtn.style.display = '' 
            }
        }
    }, [])

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full bg-white dark:bg-[#1e1e1e] overflow-y-auto p-4 select-text"
        >
            <style jsx global>{`
                .tk-admin-container .tk-admin {
                    position: static !important;
                    box-shadow: none !important;
                    width: 100% !important;
                    transform: none !important;
                    padding: 0 !important;
                    background: transparent !important;
                }
                .tk-admin-container {
                    background: transparent !important;
                    padding: 0 !important;
                }
            `}</style>
        </div>
    )
}

// ==================================================================================
// 2. 设置弹窗
// ==================================================================================
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
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
                        {t('msg_save')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==================================================================================
// 3. Messages 主应用
// ==================================================================================
export const Messages = () => {
  const { t } = useI18n()
  const { launchApp, windows } = useOs()
  
  const CONTACTS = useMemo(() => [
    { id: 'guestbook', name: t('msg_guestbook'), slug: 'messages-guestbook', avatar: '🌍', desc: t('msg_guestbook_desc'), time: t('msg_now') },
    { id: 'tech', name: t('msg_tech'), slug: 'messages-tech', avatar: '💻', desc: t('msg_tech_desc'), time: t('msg_yesterday') },
    { id: 'feedback', name: t('msg_bug'), slug: 'messages-bugs', avatar: '🐛', desc: t('msg_bug_desc'), time: t('msg_mon') }
  ], [t])

  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [replyTargetText, setReplyTargetText] = useState('') 

  const headerCountRef = useRef<HTMLDivElement>(null)
  const headerIconsRef = useRef<HTMLDivElement>(null)
  
  // 性能优化 Ref
  const isProcessingRef = useRef(false)
  const observerRef = useRef<MutationObserver | null>(null)
  
  // 关键：用户意图锁，防止自动弹窗
  const userIntentRef = useRef(false) 

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

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

      return { input: mainInput, btn: mainBtn, cancelBtn: null, isReplyMode: false }
  }, [])

  // --- 处理点击齿轮事件 ---
  // 我们将这个函数绑定到 headerIconsRef 的容器上，利用事件冒泡捕获齿轮点击
  const handleHeaderIconClick = (e: React.MouseEvent) => {
      // 检查是否点击了 SVG 或其父级 (Twikoo 的齿轮通常是 svg)
      const target = e.target as HTMLElement;
      if (target.closest('svg') || target.tagName === 'svg' || target.classList.contains('tk-icon')) {
          userIntentRef.current = true; // 标记：用户确实点击了
      }
  }

  // --- 核心 DOM 操作 (已大幅优化性能) ---
  const processDomChanges = useCallback(() => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        // ----------------------------------------------------------------
        // 1. Admin 弹窗逻辑 (只有在用户点击后才触发)
        // ----------------------------------------------------------------
        const adminContainer = document.querySelector('.tk-admin-container') as HTMLElement;
        const isAdminWindowOpen = windows.some(w => w.id === 'twikoo-admin');

        if (adminContainer && !isAdminWindowOpen) {
             const style = window.getComputedStyle(adminContainer);
             
             // 必须满足三个条件：
             // 1. 容器不是隐藏的 (display != none)
             // 2. 用户刚才点击了齿轮 (userIntentRef.current == true)
             // 3. 窗口还没打开
             if (style.display !== 'none' && userIntentRef.current) {
                
                // 立即隐藏原 DOM，把意图锁重置
                adminContainer.style.display = 'none';
                userIntentRef.current = false; 
                
                launchApp({
                    id: 'twikoo-admin',
                    title: 'Comment Admin',
                    icon: <Shield className="text-green-500" />,
                    width: 400,
                    height: 500,
                    component: <TwikooAdminHost />,
                    resizable: true,
                });
             }
        }

        // ----------------------------------------------------------------
        // 2. 搬运 Header (只做一次)
        // ----------------------------------------------------------------
        const originalHeader = document.querySelector('.imessage-mode .tk-comments-title');
        if (originalHeader) {
            const countEl = originalHeader.querySelector('.tk-comments-count');
            // 只在 headerCountRef 为空时搬运，防止反复操作 DOM
            if (countEl && headerCountRef.current && headerCountRef.current.children.length === 0) {
                headerCountRef.current.appendChild(countEl);
            }
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

        // ----------------------------------------------------------------
        // 3. 评论嵌套处理 (轻量化)
        // ----------------------------------------------------------------
        const container = document.querySelector('.imessage-mode .tk-comments-container');
        if (container) {
            const nestedReplies = Array.from(document.querySelectorAll('.imessage-mode .tk-replies .tk-comment'));
            if (nestedReplies.length > 0) {
                // 只有发现嵌套回复时才操作，并且操作前暂停观察
                observerRef.current?.disconnect();
                
                nestedReplies.forEach(reply => {
                    const contentBox = reply.querySelector('.tk-content');
                    if (contentBox && !contentBox.querySelector('.imessage-quote')) {
                        const replyList = reply.closest('.tk-replies');
                        const parentComment = replyList?.closest('.tk-comment') as HTMLElement;
                        if (parentComment) {
                            const parentNick = parentComment.querySelector('.tk-main > .tk-row .tk-nick')?.textContent || 'User';
                            const parentContentElem = parentComment.querySelector('.tk-main > .tk-content');
                            let parentText = parentContentElem?.textContent?.replace(/\s+/g, ' ').trim() || '';
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
        }

      } catch (e) {
          console.error(e);
      } finally {
          isProcessingRef.current = false;
          // 操作完成后重新挂载观察者
          if (observerRef.current) {
               observerRef.current.observe(document.body, { childList: true, subtree: true });
          }
      }
  }, [launchApp, windows])

  // --- 初始化观察者 ---
  useEffect(() => {
    // 初始延迟，防止页面加载时阻塞
    const initTimer = setTimeout(processDomChanges, 1000);

    observerRef.current = new MutationObserver((mutations) => {
        // 只有当 mutation 涉及我们关心的区域时才处理，进一步优化性能
        const relevantChange = mutations.some(m => {
            const target = m.target as HTMLElement;
            return target.classList?.contains('tk-comments-container') || 
                   target.closest('.tk-comments-container') ||
                   target.classList?.contains('tk-admin-container');
        });

        if (relevantChange) {
            processDomChanges();
        }
    });

    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
        clearTimeout(initTimer);
        if (observerRef.current) observerRef.current.disconnect();
    }
  }, [processDomChanges]);

  // --- 回复状态检测 (保留) ---
  useEffect(() => {
      const interval = setInterval(() => {
        const { isReplyMode, cancelBtn } = getTwikooElements()
        if (isReplyMode !== isReplying) setIsReplying(isReplyMode)
        
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
      }, 500); // 降低频率到 500ms，减轻 CPU 负担
      return () => clearInterval(interval);
  }, [isReplying, replyTargetText, getTwikooElements])

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
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}
      
      {/* 默认隐藏 Admin 容器，只在搬运后显示 */}
      <style jsx global>{`
         .imessage-mode .tk-admin-container {
             display: none; 
         }
      `}</style>

      {/* 左侧边栏 */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl z-20 select-none">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2">
              <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('msg_search')} className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"/>
           </div>
           <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500 cursor-pointer"><Edit size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-none">
            {filteredContacts.map(contact => (
                <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={clsx("group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5", activeContactId === contact.id ? "bg-blue-500 text-white shadow-sm" : "hover:bg-gray-200 dark:hover:bg-white/5")}>
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
        {/* Header */}
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0 select-none">
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

        {/* 消息区域 - 添加 select-text 以允许复制 */}
        <div className="flex-1 overflow-hidden relative flex flex-col w-full select-text">
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
            />
        </div>

        {/* 底部输入框区域 */}
        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30 relative group select-none">
            
            <div id="twikoo-moved-count" ref={headerCountRef} className="absolute top-2 left-6 z-40 select-none pointer-events-none"></div>
            
            {/* 关键：给图标容器添加点击事件监听，用于捕获齿轮点击 */}
            <div 
                id="twikoo-moved-icons" 
                ref={headerIconsRef} 
                onClick={handleHeaderIconClick}
                className="absolute top-2 right-6 z-40 flex items-center gap-2 cursor-pointer"
            ></div>

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