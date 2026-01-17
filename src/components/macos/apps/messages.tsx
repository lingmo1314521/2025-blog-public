{
type: uploaded file
fileName: messages.tsx
fullContent:
'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Edit, Settings, X, ArrowUp, RefreshCw, MessageCircle, Shield, Copy, Heart, Reply, Trash2, CheckCheck } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { toast } from 'sonner' 

// ==================================================================================
// 1. 独立的 Twikoo 后台宿主 (保持不变，用于新窗口管理)
// ==================================================================================
const TwikooAdminHost = () => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const adminContainer = document.querySelector('.tk-admin-container') as HTMLElement
        if (adminContainer && containerRef.current) {
            containerRef.current.appendChild(adminContainer)
            adminContainer.style.display = 'block'
            adminContainer.style.position = 'static'
            adminContainer.style.width = '100%'
            adminContainer.style.height = '100%'
            adminContainer.style.zIndex = '1'
            adminContainer.style.opacity = '1'
            adminContainer.style.pointerEvents = 'auto'
            const adminInner = adminContainer.querySelector('.tk-admin') as HTMLElement
            if (adminInner) {
                adminInner.style.position = 'static'
                adminInner.style.boxShadow = 'none'
                adminInner.style.transform = 'none'
                adminInner.style.width = '100%'
            }
            const closeBtn = adminContainer.querySelector('.tk-admin-close') as HTMLElement
            if (closeBtn) closeBtn.style.display = 'none' 
        }
        return () => {
            if (adminContainer) {
                document.body.appendChild(adminContainer)
                adminContainer.style.display = 'none' 
            }
        }
    }, [])

    return <div ref={containerRef} className="w-full h-full bg-white dark:bg-[#1e1e1e] overflow-y-auto p-4 select-text" />
}

// ==================================================================================
// 2. 设置弹窗 (保持不变)
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
            <div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm dark:text-white">{t('msg_settings_title')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full cursor-pointer"><X size={14}/></button>
                </div>
                <div className="space-y-3">
                    <input value={nick} onChange={e=>setNick(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder={t('msg_nick_ph')}/>
                    <input value={mail} onChange={e=>setMail(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder={t('msg_email_ph')}/>
                    <input value={link} onChange={e=>setLink(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder="https://..."/>
                </div>
                <div className="mt-5 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">{t('msg_save')}</button>
                </div>
            </div>
        </div>
    )
}

// ==================================================================================
// 3. 全局右键菜单 (使用 Portal 挂载到 Body，杜绝位置偏移)
// ==================================================================================
interface ContextMenuProps {
    visible: boolean
    x: number
    y: number
    targetElement: HTMLElement | null
    onClose: () => void
}

const GlobalContextMenu = ({ visible, x, y, targetElement, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ x, y })
    const { t } = useI18n()

    // 智能位置计算：确保菜单不会超出屏幕边界
    useLayoutEffect(() => {
        if (visible && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const { innerWidth, innerHeight } = window
            
            let newX = x
            let newY = y

            // 如果右侧空间不足，向左弹出
            if (x + rect.width > innerWidth) {
                newX = x - rect.width
            }
            // 如果底部空间不足，向上弹出
            if (y + rect.height > innerHeight) {
                newY = y - rect.height
            }

            setPos({ x: newX, y: newY })
        }
    }, [visible, x, y])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        if (visible) window.addEventListener('mousedown', handleClickOutside)
        return () => window.removeEventListener('mousedown', handleClickOutside)
    }, [visible, onClose])

    if (!visible || !targetElement) return null

    // 执行 Twikoo 原生动作
    const executeAction = (selector: string, index = 0) => {
        const commentRow = targetElement.closest('.tk-comment')
        if (!commentRow) return
        const links = Array.from(commentRow.querySelectorAll(selector))
        if (links[index]) (links[index] as HTMLElement).click()
    }

    const handleCopy = () => {
        const text = targetElement.innerText || ''
        navigator.clipboard.writeText(text)
        toast.success('Copied')
        onClose()
    }

    const handleReply = () => {
        // Twikoo 的回复按钮通常是第一个 .tk-action-link
        executeAction('.tk-action-link', 0)
        onClose()
    }

    const handleLike = () => {
        // Twikoo 的点赞通常是第二个 .tk-action-link (图标判断比较复杂，按顺序一般是回复、点赞)
        executeAction('.tk-action-link', 1)
        onClose()
    }

    // 使用 Portal 渲染到 body，避开所有 overflow: hidden
    return createPortal(
        <div 
            ref={menuRef}
            className="fixed z-[999999] w-40 bg-white/90 dark:bg-[#333]/90 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-lg overflow-hidden py-1.5 flex flex-col animate-in fade-in zoom-in-95 duration-100 select-none"
            style={{ top: pos.y, left: pos.x }}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={handleReply} className="flex items-center gap-3 px-3 py-1.5 text-[13px] text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-700 dark:text-gray-200 group">
                <Reply size={14} className="text-gray-400 group-hover:text-white"/> {t('msg_reply') || 'Reply'}
            </button>
            <button onClick={handleCopy} className="flex items-center gap-3 px-3 py-1.5 text-[13px] text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-700 dark:text-gray-200 group">
                <Copy size={14} className="text-gray-400 group-hover:text-white"/> Copy
            </button>
            <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1 mx-3"/>
            <button onClick={handleLike} className="flex items-center gap-3 px-3 py-1.5 text-[13px] text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-700 dark:text-gray-200 group">
                <Heart size={14} className="text-gray-400 group-hover:text-white"/> Like
            </button>
        </div>,
        document.body
    )
}

// ==================================================================================
// 4. Messages 主程序
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
  
  // 右键菜单状态
  const [menuState, setMenuState] = useState<{ visible: boolean, x: number, y: number, target: HTMLElement | null }>({
      visible: false, x: 0, y: 0, target: null
  })

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // --- 右键处理函数 ---
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      const target = e.target as HTMLElement
      // 只有在消息气泡 (.tk-content) 上点击才触发
      const bubble = target.closest('.tk-content')
      if (bubble) {
          setMenuState({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              target: bubble as HTMLElement
          })
      }
  }, [])

  // --- Twikoo DOM 辅助 ---
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

  // --- 监控回复状态 ---
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
      }, 500); 
      return () => clearInterval(interval);
  }, [isReplying, replyTargetText, getTwikooElements])

  // --- 发送逻辑 ---
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
            // 滚动到底部
            setTimeout(() => {
                const container = document.querySelector('.imessage-mode .tk-comments-container');
                if (container) container.scrollTop = container.scrollHeight;
            }, 500);
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
      
      {/* 全局右键菜单 (Portal) */}
      <GlobalContextMenu 
        visible={menuState.visible}
        x={menuState.x}
        y={menuState.y}
        targetElement={menuState.target}
        onClose={() => setMenuState(prev => ({ ...prev, visible: false }))}
      />

      <style jsx global>{`
         /* 隐藏默认的管理面板，防止冲突 */
         .imessage-mode .tk-admin-container { display: none; }

         /* =========================================
            核心样式优化：极简主义信息栏
            ========================================= */
         
         /* 1. 重新布局 tk-row (包含 meta 和 action) */
         .imessage-mode .tk-row {
            margin-bottom: 2px !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            min-height: 16px !important;
         }
         
         /* 2. Meta 信息 (昵称 & 时间) */
         .imessage-mode .tk-meta {
            display: flex !important;
            align-items: baseline !important;
            gap: 6px !important;
            margin-left: 14px !important; /* 对齐气泡圆角 */
         }
         
         .imessage-mode .tk-nick {
             font-size: 11px !important;
             font-weight: 600 !important;
             color: #8e8e93 !important; /* iOS 灰色 */
             line-height: 1 !important;
         }
         .dark .imessage-mode .tk-nick { color: #98989d !important; }

         .imessage-mode .tk-time {
             font-size: 9px !important;
             color: #c7c7cc !important;
             font-weight: 400 !important;
         }

         /* 3. Action 操作区 (默认隐藏，悬浮显示) */
         .imessage-mode .tk-action {
             display: flex !important;
             gap: 12px !important;
             margin-right: 8px !important;
             opacity: 0 !important;
             transform: translateX(-5px);
             transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
             pointer-events: none; /* 防止误触 */
         }
         
         /* 鼠标悬停在整个消息行时显示操作按钮 */
         .imessage-mode .tk-comment:hover .tk-action {
             opacity: 1 !important;
             transform: translateX(0);
             pointer-events: auto;
         }

         /* 4. Action 链接与图标样式 */
         .imessage-mode .tk-action-link {
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
             color: #c7c7cc !important;
             text-decoration: none !important;
             transition: color 0.2s !important;
         }
         
         .imessage-mode .tk-action-link:hover {
             color: #007aff !important; /* 悬浮变蓝 */
         }

         /* 强制重置 SVG 尺寸，防止过大 */
         .imessage-mode .tk-action-icon svg {
             width: 13px !important;
             height: 13px !important;
             fill: currentColor !important;
             display: block !important;
         }
         
         /* 隐藏数字统计，保持干净 (除非你想显示点赞数) */
         .imessage-mode .tk-action-count {
             font-size: 9px !important;
             margin-left: 2px !important;
             font-variant-numeric: tabular-nums;
         }

         /* 5. Master (自己发的) 模式下的镜像翻转 */
         .imessage-mode .tk-master .tk-row {
             flex-direction: row-reverse !important;
         }
         .imessage-mode .tk-master .tk-meta {
             margin-left: 0 !important;
             margin-right: 14px !important;
             flex-direction: row-reverse !important;
         }
         .imessage-mode .tk-master .tk-action {
             margin-right: 0 !important;
             margin-left: 8px !important;
             flex-direction: row-reverse !important;
             transform: translateX(5px);
         }
         .imessage-mode .tk-master .tk-comment:hover .tk-action {
             transform: translateX(0);
         }
      `}</style>

      {/* 左侧边栏：联系人列表 */}
      <div className="w-[260px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl z-20 select-none transition-all duration-300">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2 group">
              <Search size={13} className="absolute left-2.5 top-2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('msg_search')} className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-black/40 rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none transition-all placeholder-gray-500"/>
           </div>
           <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-blue-500 cursor-pointer active:scale-95 transition-transform"><Edit size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-none space-y-0.5">
            {filteredContacts.map(contact => (
                <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={clsx("group flex gap-3 p-2.5 rounded-lg cursor-pointer transition-all relative overflow-hidden", activeContactId === contact.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-200/80 dark:hover:bg-white/5")}>
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm overflow-hidden border border-black/5", activeContactId === contact.id ? "bg-white/20 text-white backdrop-blur-sm border-transparent" : "text-gray-600")}>{contact.avatar}</div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <div className="flex justify-between items-baseline">
                            <span className={clsx("font-semibold text-[13px] truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>{contact.name}</span>
                            <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>{contact.time}</span>
                        </div>
                        <div className={clsx("text-xs truncate leading-tight", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>{contact.desc}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative z-0">
        {/* Header */}
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{t('msg_to')}</span>
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs font-medium text-black dark:text-white border border-transparent hover:border-blue-500/30 transition-colors cursor-default">
                    {activeContact.name} <CheckCheck size={12} className="text-blue-500"/>
                </div>
            </div>
            <div className="flex gap-1">
                <button onClick={() => setReloadKey(k => k + 1)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer"><RefreshCw size={14} /></button>
                <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer"><Settings size={15} /></button>
            </div>
        </div>

        {/* 聊天内容区 (绑定右键事件) */}
        <div 
            className="flex-1 overflow-hidden relative flex flex-col w-full select-text"
            onContextMenu={handleContextMenu}
        >
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
            />
        </div>

        {/* 底部输入区 */}
        <div className="shrink-0 px-4 pb-4 pt-3 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30 relative group select-none">
            <div className="relative max-w-4xl mx-auto w-full">
                {isReplying && (
                    <div className="absolute -top-10 left-0 right-0 flex items-center justify-between bg-white/80 dark:bg-[#333]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 shadow-sm animate-in slide-in-from-bottom-2 z-10 mx-2">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate">
                            <div className="w-0.5 h-3 bg-blue-500 rounded-full"/>
                            <span className="font-medium truncate max-w-[200px]">{replyTargetText || 'Replying...'}</span>
                        </div>
                        <button onClick={handleCancelReply} className="p-0.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                            <X size={12} className="text-gray-500"/>
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2 bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-[20px] p-1 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shadow-sm">
                    <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5 shrink-0">
                         <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">+</div>
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            const { input } = getTwikooElements()
                            if(input) { input.value = e.target.value; input.dispatchEvent(new Event('input', { bubbles: true })) }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isReplying ? "Type a reply..." : t('msg_imessage')}
                        className="flex-1 bg-transparent py-2 text-sm outline-none text-black dark:text-white min-w-0"
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={!inputValue.trim()} 
                        className={clsx(
                            "p-1.5 rounded-full transition-all shrink-0 mb-0.5 mr-0.5",
                            inputValue.trim() ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm cursor-pointer scale-100" : "bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed scale-90"
                        )}
                    >
                        <ArrowUp size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
            
            <div className="text-[9px] text-center text-gray-400/60 mt-2 select-none flex justify-center gap-1 font-medium tracking-wide">
                <span>iMessage</span>
            </div>
        </div>
      </div>
    </div>
  )
}
}