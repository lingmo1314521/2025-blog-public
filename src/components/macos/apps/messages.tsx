'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, Edit, Settings, X, ArrowUp, RefreshCw, MessageCircle, Shield, Copy, Heart, Reply, Trash2 } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { toast } from 'sonner' 

// ==================================================================================
// 1. 独立的 Twikoo 后台宿主组件 (用于新窗口)
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

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' && target.getAttribute('type') === 'password') {
                    e.preventDefault();
                    e.stopPropagation();
                    const loginBtn = containerRef.current?.querySelector('.tk-login button') as HTMLElement;
                    if (loginBtn) loginBtn.click();
                }
            }
        };

        containerRef.current?.addEventListener('keydown', handleKeyDown, true);

        return () => {
            containerRef.current?.removeEventListener('keydown', handleKeyDown, true);
            if (adminContainer) {
                const closeBtn = adminContainer.querySelector('.tk-admin-close') as HTMLElement;
                if (closeBtn) closeBtn.click();

                document.body.appendChild(adminContainer)
                adminContainer.style.display = 'none' 
                const adminInner = adminContainer.querySelector('.tk-admin')
                if (adminInner) adminInner.classList.remove('__show')
            }
        }
    }, [])

    return (
        <div ref={containerRef} className="w-full h-full bg-white dark:bg-[#1e1e1e] overflow-y-auto p-4 select-text">
            <style jsx global>{`
                .tk-admin-container .tk-admin { padding: 0 !important; max-width: 100% !important; }
                .tk-admin-container { background: transparent !important; }
                .tk-admin .el-input__inner { background-color: transparent !important; color: inherit !important; }
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
            <div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5" onClick={e => e.stopPropagation()}>
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
// 3. 右键菜单组件 (智能定位 + 功能实现)
// ==================================================================================
interface ContextMenuState {
    visible: boolean
    x: number
    y: number
    targetElement: HTMLElement | null
}

const MessageContextMenu = ({ 
    visible, x, y, targetElement, onClose 
}: ContextMenuState & { onClose: () => void }) => {
    const menuRef = useRef<HTMLDivElement>(null)
    const { t } = useI18n()
    const [pos, setPos] = useState({ x, y })

    // 智能调整位置，防止溢出屏幕
    useEffect(() => {
        if (visible && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            let newX = x
            let newY = y

            // 如果菜单超出右边界，向左弹出
            if (x + rect.width > window.innerWidth) {
                newX = window.innerWidth - rect.width - 10
            }
            // 如果菜单超出下边界，向上弹出
            if (y + rect.height > window.innerHeight) {
                newY = y - rect.height
            }

            setPos({ x: newX, y: newY })
        }
    }, [visible, x, y])

    // 点击外部关闭
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
    const handleAction = (type: 'reply' | 'copy' | 'like') => {
        const commentRow = targetElement.closest('.tk-comment')
        if (!commentRow) return onClose()

        if (type === 'reply') {
            // 查找 Twikoo 内部的回复按钮
            const replyBtn = commentRow.querySelector('.tk-action-link') as HTMLElement
            if (replyBtn) replyBtn.click()
            else toast.error("Reply button not found")
        }
        
        if (type === 'like') {
             // 通常第二个 link 是点赞，需要根据实际 DOM 确认
            const links = commentRow.querySelectorAll('.tk-action-link')
            // Twikoo 结构通常: [回复, 点赞] 或 [回复]
            if (links.length >= 2) (links[1] as HTMLElement).click()
            else if (links.length > 0) (links[0] as HTMLElement).click()
        }

        if (type === 'copy') {
            const content = targetElement.querySelector('.tk-content')?.textContent || targetElement.textContent || ''
            navigator.clipboard.writeText(content)
            toast.success('Copied')
        }

        onClose()
    }

    return (
        <div 
            ref={menuRef}
            className="fixed z-[99999] min-w-[160px] bg-white/95 dark:bg-[#2c2c2c]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl rounded-lg py-1.5 flex flex-col select-none animate-in fade-in zoom-in-95 duration-100 origin-top-left"
            style={{ top: pos.y, left: pos.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            <button onClick={() => handleAction('reply')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-800 dark:text-gray-200">
                <Reply size={14} /> {t('msg_reply') || 'Reply'}
            </button>
            <button onClick={() => handleAction('copy')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-800 dark:text-gray-200">
                <Copy size={14} /> Copy
            </button>
            <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1 mx-2"/>
            <button onClick={() => handleAction('like')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-800 dark:text-gray-200">
                <Heart size={14} /> Like
            </button>
        </div>
    )
}

// ==================================================================================
// 4. Messages 主应用
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
  
  const [stats, setStats] = useState({ total: 0, main: 0, replies: 0 })

  // 状态：右键菜单
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, targetElement: null })

  const headerIconsRef = useRef<HTMLDivElement>(null)
  
  const loadObserverRef = useRef<MutationObserver | null>(null)
  const adminClassObserverRef = useRef<MutationObserver | null>(null)
  const commentObserverRef = useRef<MutationObserver | null>(null)
  
  const isAdminOpeningRef = useRef(false)

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

  // --- 处理 Admin 弹窗 ---
  const handleAdminTrigger = useCallback((targetElement: HTMLElement) => {
      if (targetElement.classList.contains('__show')) {
          if (isAdminOpeningRef.current) return;
          if (windows.some(w => w.id === 'twikoo-admin')) return;

          isAdminOpeningRef.current = true;

          const container = document.querySelector('.tk-admin-container') as HTMLElement;
          if (container) container.style.display = 'none';

          launchApp({
            id: 'twikoo-admin',
            title: 'Comment Admin',
            icon: <Shield className="text-green-500" />,
            width: 400,
            height: 500,
            component: <TwikooAdminHost />,
            resizable: true,
          });

          setTimeout(() => { isAdminOpeningRef.current = false }, 1000);
      }
  }, [launchApp, windows]);

  // --- 引用跳转 ---
  const handleQuoteClick = useCallback((e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const parentId = target.dataset.parentId;
      let parentComment: HTMLElement | null = null;

      if (parentId) {
          parentComment = document.getElementById(parentId);
      } 
      
      if (!parentComment) {
          const quoteText = target.innerText;
          const colonIndex = quoteText.indexOf(':');
          if (colonIndex > -1) {
              const targetNick = quoteText.substring(0, colonIndex).trim();
              const targetContent = quoteText.substring(colonIndex + 1).trim().slice(0, 15);
              const allComments = Array.from(document.querySelectorAll('.imessage-mode .tk-comment'));
              parentComment = allComments.find(c => {
                  if (c.contains(target)) return false;
                  const nick = c.querySelector('.tk-nick')?.textContent || '';
                  const content = c.querySelector('.tk-content')?.textContent || '';
                  return nick === targetNick && content.includes(targetContent);
              }) as HTMLElement;
          }
      }

      if (parentComment) {
          parentComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const bubble = parentComment.querySelector('.tk-content') as HTMLElement;
          if (bubble) {
              bubble.style.transition = 'background-color 0.5s';
              const originalBg = bubble.style.backgroundColor;
              bubble.style.backgroundColor = 'rgba(255, 235, 59, 0.5)'; 
              setTimeout(() => {
                  bubble.style.backgroundColor = originalBg;
              }, 1200);
          }
      }
  }, []);

  // --- 布局核心逻辑 ---
  const processLayout = useCallback(() => {
    // 1. 搬运图标
    const originalHeader = document.querySelector('.imessage-mode .tk-comments-title');
    if (originalHeader) {
        const iconWrappers = originalHeader.querySelectorAll('.tk-icon');
        if (iconWrappers.length > 0 && headerIconsRef.current) {
            headerIconsRef.current.innerHTML = ''; 
            const siblings = Array.from(originalHeader.children).filter(child => !child.classList.contains('tk-comments-count'));
            siblings.forEach(sibling => {
                headerIconsRef.current?.appendChild(sibling);
            });
        }
    }

    const container = document.querySelector('.imessage-mode .tk-comments-container');
    if (!container) return;

    if (commentObserverRef.current) commentObserverRef.current.disconnect();

    // 2. 提取回复 & 智能引用
    const nestedReplies = Array.from(document.querySelectorAll('.imessage-mode .tk-replies .tk-comment'));
    if (nestedReplies.length > 0) {
        nestedReplies.forEach(reply => {
            const contentBox = reply.querySelector('.tk-content');
            if (contentBox && !contentBox.querySelector('.imessage-quote')) {
                const replyList = reply.closest('.tk-replies');
                const parentComment = replyList?.closest('.tk-comment') as HTMLElement;
                
                if (parentComment) {
                    const parentId = parentComment.getAttribute('id');
                    let parentNick = parentComment.querySelector('.tk-main > .tk-row .tk-nick')?.textContent || 'User';
                    const parentContentElem = parentComment.querySelector('.tk-main > .tk-content');
                    let parentText = parentContentElem?.textContent?.replace(/\s+/g, ' ').trim() || '';

                    const atUserLink = contentBox.querySelector('.tk-ruser');
                    if (atUserLink && atUserLink.textContent) {
                        parentNick = atUserLink.textContent.replace('@', '').trim();
                        parentText = `回复了 ${parentNick}`; 
                        const atUserSpan = atUserLink.closest('span');
                        if (atUserSpan) atUserSpan.style.display = 'none';
                    }

                    const existingQuote = parentContentElem?.querySelector('.imessage-quote');
                    if (existingQuote && existingQuote.textContent) {
                        parentText = parentText.replace(existingQuote.textContent, '').trim();
                    }
                    if (parentText.length > 30) parentText = parentText.slice(0, 30) + '...';

                    const quoteDiv = document.createElement('div');
                    quoteDiv.className = 'imessage-quote';
                    quoteDiv.innerHTML = `<span class="imessage-quote-name">${parentNick}:</span> ${parentText}`;
                    if (parentId) quoteDiv.setAttribute('data-parent-id', parentId);
                    
                    quoteDiv.addEventListener('click', handleQuoteClick);
                    contentBox.insertBefore(quoteDiv, contentBox.firstChild);
                }
            }
            container.appendChild(reply);
        });
    }

    // 3. 排序
    const comments = Array.from(container.children).filter(child => child.classList.contains('tk-comment'));
    if (comments.length > 1) {
        const needsSort = comments.some((c, i, arr) => {
            if (i === 0) return false;
            const prevT = new Date(arr[i-1].querySelector('time')?.getAttribute('datetime') || 0).getTime();
            const currT = new Date(c.querySelector('time')?.getAttribute('datetime') || 0).getTime();
            return prevT > currT;
        });
        
        if (needsSort) {
            const sorted = comments.sort((a, b) => {
                const tA = a.querySelector('time')?.getAttribute('datetime') || '1970-01-01';
                const tB = b.querySelector('time')?.getAttribute('datetime') || '1970-01-01';
                return new Date(tA).getTime() - new Date(tB).getTime(); 
            });
            sorted.forEach(c => container.appendChild(c));
        }
    }

    // 4. 统计
    const total = comments.length;
    const repliesCount = comments.filter(c => c.querySelector('.imessage-quote')).length;
    const mainCount = total - repliesCount;
    setStats({ total, main: mainCount, replies: repliesCount });

    if (commentObserverRef.current) {
        commentObserverRef.current.observe(container, { childList: true });
    }
  }, [handleQuoteClick]);

  // --- 主 Effect ---
  useEffect(() => {
    adminClassObserverRef.current = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                handleAdminTrigger(m.target as HTMLElement);
            }
        });
    });

    commentObserverRef.current = new MutationObserver(() => {
        requestAnimationFrame(processLayout);
    });

    loadObserverRef.current = new MutationObserver(() => {
        const adminInner = document.querySelector('.tk-admin');
        const commentsContainer = document.querySelector('.imessage-mode .tk-comments-container');

        if (adminInner) {
            adminClassObserverRef.current?.disconnect();
            adminClassObserverRef.current?.observe(adminInner, { attributes: true, attributeFilter: ['class'] });
        }

        if (commentsContainer) {
            processLayout(); 
            commentObserverRef.current?.disconnect();
            commentObserverRef.current?.observe(commentsContainer, { childList: true });
        }

        if (adminInner && commentsContainer) {
            loadObserverRef.current?.disconnect();
        }
    });

    loadObserverRef.current.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => {
        const adminInner = document.querySelector('.tk-admin');
        if (adminInner && adminClassObserverRef.current) {
            adminClassObserverRef.current.observe(adminInner, { attributes: true, attributeFilter: ['class'] });
        }
        processLayout();
    }, 1000);

    return () => {
        if (loadObserverRef.current) loadObserverRef.current.disconnect();
        if (adminClassObserverRef.current) adminClassObserverRef.current.disconnect();
        if (commentObserverRef.current) commentObserverRef.current.disconnect();
        clearTimeout(timer);
    }
  }, [handleAdminTrigger, processLayout, activeContactId]); 

  useEffect(() => {
      if (headerIconsRef.current) headerIconsRef.current.innerHTML = '';
  }, [activeContactId]);

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

  // --- Handlers ---
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
            const refreshTimes = [300, 800, 1500];
            refreshTimes.forEach(t => {
                setTimeout(() => {
                    const container = document.querySelector('.imessage-mode .tk-comments-container');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                        processLayout(); 
                    }
                }, t);
            });
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

  // --- 触发右键菜单 ---
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault()
      // 检查是否点击在消息气泡上
      const target = e.target as HTMLElement
      const bubble = target.closest('.tk-content')
      
      if (bubble) {
          setContextMenu({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              targetElement: bubble as HTMLElement
          })
      }
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}

      {/* 右键菜单挂载点 */}
      <MessageContextMenu 
         {...contextMenu} 
         onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))} 
      />

      <style jsx global>{`
         .imessage-mode .tk-admin-container {
             display: none; 
         }
         
         /* ========== 核心优化：Twikoo 消息展示优化 ========== */
         /* 1. 布局行：让元数据和操作按钮并排 */
         .imessage-mode .tk-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            margin-bottom: 2px !important;
            padding-right: 4px !important;
         }

         /* 2. 元数据区域 (昵称 + 时间) */
         .imessage-mode .tk-meta {
            display: flex !important;
            align-items: baseline !important;
            gap: 8px !important;
            margin-left: 12px !important; /* 对齐气泡圆角 */
         }
         
         /* 昵称样式 */
         .imessage-mode .tk-nick {
            font-size: 11px !important;
            font-weight: 500 !important;
            color: #8e8e93 !important; /* iOS 浅灰 */
         }
         .dark .imessage-mode .tk-nick {
            color: #98989d !important;
         }

         /* 时间样式 - 默认弱化 */
         .imessage-mode .tk-time {
            font-size: 9px !important;
            color: #c7c7cc !important;
            font-weight: 400 !important;
         }

         /* 3. 操作区域 (回复、点赞图标) - 默认隐藏，悬浮显示 */
         .imessage-mode .tk-action {
             opacity: 0 !important;
             transform: scale(0.9);
             transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
             display: flex !important;
             align-items: center !important;
             gap: 10px !important;
         }
         
         /* 悬浮整个消息行时显示操作按钮 */
         .imessage-mode .tk-comment:hover .tk-action {
             opacity: 1 !important;
             transform: scale(1);
         }

         /* 操作链接通用样式 */
         .imessage-mode .tk-action-link {
             display: flex !important;
             align-items: center !important;
             gap: 3px !important;
             text-decoration: none !important;
             color: #aeaeb2 !important;
             cursor: pointer !important;
         }
         .imessage-mode .tk-action-link:hover {
             color: #007aff !important; /* 悬浮变蓝 */
         }

         /* 强制 SVG 图标大小，防止过大 */
         .imessage-mode .tk-action-icon svg {
             width: 14px !important;
             height: 14px !important;
             fill: currentColor !important;
         }

         /* 隐藏文字计数，或者把它变小 */
         .imessage-mode .tk-action-count {
             font-size: 9px !important;
             min-width: 8px !important;
             text-align: center !important;
         }

         /* Master (自己发的) 消息的特殊布局：反向排列 */
         .imessage-mode .tk-master .tk-row {
             flex-direction: row-reverse !important;
             padding-right: 0 !important;
             padding-left: 4px !important;
         }
         .imessage-mode .tk-master .tk-meta {
             flex-direction: row-reverse !important;
             margin-left: 0 !important;
             margin-right: 12px !important;
         }
         .imessage-mode .tk-master .tk-action {
             flex-direction: row-reverse !important;
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

        {/* 绑定 Context Menu 事件到容器 
            注意：processLayout 会把 Twikoo DOM 注入到 CommentSystem 中，
            我们在最外层容器捕获冒泡上来的右键事件
        */}
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

        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30 relative group select-none">
            {/* 统计数据 */}
            <div className="absolute top-2 left-6 z-40 select-none pointer-events-none text-[10px] text-gray-400 font-medium">
                {stats.total > 0 && (
                    <span>共 {stats.total} 条信息 (主消息 {stats.main}, 回复 {stats.replies})</span>
                )}
            </div>
            
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