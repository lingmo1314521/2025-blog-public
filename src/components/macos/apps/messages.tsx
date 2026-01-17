'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, Edit, Settings, X, ArrowUp, RefreshCw, MessageCircle, Shield, Copy, Heart, Reply, Trash2 } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'
import { toast } from 'sonner' 

// ==================================================================================
// 1. Settings Modal (用户偏好设置，保留)
// ==================================================================================
const SettingsModal = ({ onClose, onSave }: { onClose: () => void, onSave: () => void }) => {
    const { t } = useI18n(); const [nick, setNick] = useState(''); const [mail, setMail] = useState(''); const [link, setLink] = useState('');
    useEffect(() => { try { const stored = localStorage.getItem('twikoo'); if (stored) { const data = JSON.parse(stored); setNick(data.nick || ''); setMail(data.mail || ''); setLink(data.link || ''); } } catch (e) {} }, [])
    const handleSave = () => { try { const stored = localStorage.getItem('twikoo'); let data = stored ? JSON.parse(stored) : {}; data.nick = nick; data.mail = mail; data.link = link; localStorage.setItem('twikoo', JSON.stringify(data)); const inputs = document.querySelectorAll('.imessage-mode input'); inputs.forEach((input: any) => { if(input.name === 'nick') { input.value = nick; input.dispatchEvent(new Event('input')); } if(input.name === 'mail') { input.value = mail; input.dispatchEvent(new Event('input')); } if(input.name === 'link') { input.value = link; input.dispatchEvent(new Event('input')); } }); onSave(); onClose(); toast.success('Settings saved'); } catch (e) { console.error(e) } }
    return (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}><div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm dark:text-white">{t('msg_settings_title')}</h3><button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full cursor-pointer"><X size={14}/></button></div><div className="space-y-3"><div><label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('msg_nick')}</label><input value={nick} onChange={e=>setNick(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder={t('msg_nick_ph')}/></div><div><label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('msg_email')}</label><input value={mail} onChange={e=>setMail(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder={t('msg_email_ph')}/></div><div><label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('msg_link')}</label><input value={link} onChange={e=>setLink(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" placeholder="https://..."/></div></div><div className="mt-5 flex justify-end"><button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer">{t('msg_save')}</button></div></div></div>)
}

// ==================================================================================
// 3. Right Click Context Menu
// ==================================================================================
const MessageContextMenu = ({ visible, x, y, targetElement, onClose }: any) => {
    const menuRef = useRef<HTMLDivElement>(null); const { t } = useI18n(); const [adjustedPos, setAdjustedPos] = useState({ x, y });
    useEffect(() => { if (visible && menuRef.current) { const rect = menuRef.current.getBoundingClientRect(); let newX = x; let newY = y; if (x + rect.width > window.innerWidth) newX = x - rect.width; if (y + rect.height > window.innerHeight) newY = y - rect.height; setAdjustedPos({ x: newX, y: newY }) } else { setAdjustedPos({ x, y }) } }, [visible, x, y]);
    useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) { onClose() } }; if (visible) window.addEventListener('mousedown', handleClickOutside); return () => window.removeEventListener('mousedown', handleClickOutside); }, [visible, onClose]);
    if (!visible || !targetElement) return null;
    const handleAction = (action: 'reply' | 'copy' | 'like') => { const commentRow = targetElement.closest('.tk-comment'); if (action === 'reply' && commentRow) { const replyBtn = commentRow.querySelector('.tk-action-link') as HTMLElement; if (replyBtn) replyBtn.click(); } if (action === 'like' && commentRow) { const links = Array.from(commentRow.querySelectorAll('.tk-action-link')); if (links.length > 1) (links[1] as HTMLElement).click(); else if (links.length > 0) (links[0] as HTMLElement).click(); } if (action === 'copy') { const content = targetElement.textContent; if (content) { navigator.clipboard.writeText(content); toast.success('Copied'); } } onClose(); };
    return createPortal(<div ref={menuRef} className="fixed z-[99999] min-w-[140px] bg-white/95 dark:bg-[#2c2c2c]/95 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-xl rounded-lg overflow-hidden py-1 flex flex-col select-none animate-in fade-in zoom-in-95 duration-100" style={{ top: adjustedPos.y, left: adjustedPos.x }} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}><button onClick={() => handleAction('reply')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-700 dark:text-gray-200 cursor-pointer"><Reply size={14} /> {t('msg_reply') || 'Reply'}</button><button onClick={() => handleAction('copy')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-700 dark:text-gray-200 cursor-pointer"><Copy size={14} /> Copy</button><div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1 mx-2"/><button onClick={() => handleAction('like')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors text-gray-700 dark:text-gray-200 cursor-pointer"><Heart size={14} /> Like</button></div>, document.body);
}

// ==================================================================================
// 4. Messages Application (还原版)
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
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, targetElement: null })

  // Refs
  const headerIconsRef = useRef<HTMLDivElement>(null)
  const commentObserverRef = useRef<MutationObserver | null>(null)
  const isProcessingRef = useRef(false)
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // [还原] 触发 Twikoo 原生后台
  // 因为我们 CSS 隐藏了 .tk-footer (包含原生齿轮)，所以这里需要手动代理点击
  const handleOpenNativeAdmin = () => {
      const settingIcon = document.querySelector('.tk-icon.__setting') as HTMLElement;
      if (settingIcon) {
          settingIcon.click();
      } else {
          toast.error("Admin button not found yet. Please wait for load.");
      }
  }

  const handleQuoteClick = useCallback((e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const parentId = target.dataset.parentId;
      let parentComment: HTMLElement | null = null;
      if (parentId) parentComment = document.getElementById(parentId);
      if (parentComment) {
          parentComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const bubble = parentComment.querySelector('.tk-content') as HTMLElement;
          if (bubble) {
              bubble.style.transition = 'background-color 0.5s';
              const originalBg = bubble.style.backgroundColor;
              bubble.style.backgroundColor = 'rgba(255, 235, 59, 0.5)'; 
              setTimeout(() => { bubble.style.backgroundColor = originalBg }, 1200);
          }
      }
  }, []);

  const extractParentInfo = (replyElement: Element) => {
      const contentBox = replyElement.querySelector('.tk-content');
      if (!contentBox) return null;

      const atUser = contentBox.querySelector('.tk-ruser');
      if (atUser) {
          const href = atUser.getAttribute('href'); 
          if (href && href.startsWith('#')) {
              const targetId = href.substring(1);
              const targetEl = document.getElementById(targetId);
              if (targetEl) {
                  const targetNick = targetEl.querySelector('.tk-nick')?.textContent || 'User';
                  const clone = targetEl.querySelector('.tk-content')?.cloneNode(true) as HTMLElement;
                  clone.querySelectorAll('.imessage-quote').forEach(el => el.remove());
                  clone.querySelectorAll('.tk-ruser').forEach(el => el.remove());
                  let targetText = clone.textContent?.replace(/\s+/g, ' ').trim() || '...';
                  targetText = targetText.replace(/^(回复|Reply)\s*[:：]?\s*/i, '');
                  return { id: targetId, nick: targetNick, text: targetText };
              }
          }
      }

      const replyList = replyElement.closest('.tk-replies');
      const parentComment = replyList?.closest('.tk-comment') as HTMLElement;
      if (parentComment) {
          const parentId = parentComment.getAttribute('id') || '';
          const parentNick = parentComment.querySelector('.tk-main > .tk-row .tk-nick')?.textContent || 'User';
          const clone = parentComment.querySelector('.tk-main > .tk-content')?.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('.imessage-quote').forEach(el => el.remove());
          let parentText = clone.textContent?.replace(/\s+/g, ' ').trim() || '...';
          parentText = parentText.replace(/^(回复|Reply)\s*[:：]?\s*/i, '');
          return { id: parentId, nick: parentNick, text: parentText };
      }
      return null;
  }

  // [布局处理]
  const processLayout = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const container = document.querySelector('.imessage-mode .tk-comments-container') as HTMLElement;
    if (!container) { isProcessingRef.current = false; return; }

    if (commentObserverRef.current) commentObserverRef.current.disconnect();

    if (headerIconsRef.current && headerIconsRef.current.childNodes.length === 0) {
        const originalHeader = document.querySelector('.imessage-mode .tk-comments-title');
        if (originalHeader) {
            const sourceIcons = Array.from(originalHeader.children).filter(child => !child.classList.contains('tk-comments-count'));
            if (sourceIcons.length > 0 && headerIconsRef.current) {
                headerIconsRef.current.innerHTML = '';
                sourceIcons.forEach(icon => {
                    headerIconsRef.current?.appendChild(icon);
                    (icon as HTMLElement).style.pointerEvents = 'auto';
                    (icon as HTMLElement).style.cursor = 'pointer';
                });
            }
        }
    }

    const nestedReplies = Array.from(document.querySelectorAll('.imessage-mode .tk-replies .tk-comment'));
    nestedReplies.forEach(reply => {
        const contentBox = reply.querySelector('.tk-content');
        if (contentBox && !contentBox.querySelector('.imessage-quote')) {
            const parentInfo = extractParentInfo(reply);
            if (parentInfo) {
                let parentText = parentInfo.text;
                if (parentText.length > 30) parentText = parentText.slice(0, 30) + '...';
                const quoteDiv = document.createElement('div');
                quoteDiv.className = 'imessage-quote';
                quoteDiv.innerHTML = `回复: <span class="imessage-quote-name">${parentInfo.nick}</span> : ${parentText}`;
                if (parentInfo.id) quoteDiv.setAttribute('data-parent-id', parentInfo.id);
                quoteDiv.addEventListener('click', handleQuoteClick);
                contentBox.insertBefore(quoteDiv, contentBox.firstChild);
            }
        }
        container.appendChild(reply); 
    });

    const allComments = Array.from(container.children).filter(el => el.classList.contains('tk-comment')) as HTMLElement[];
    allComments.forEach(comment => {
        const timeEl = comment.querySelector('time');
        if (timeEl) {
            const dateStr = timeEl.getAttribute('datetime');
            if (dateStr) {
                const timestamp = new Date(dateStr).getTime();
                comment.style.order = String(Math.floor(timestamp / 1000));
            }
        } else {
            comment.style.order = '9999999999';
        }
    });

    const total = allComments.length;
    let repliesCount = 0;
    allComments.forEach(c => { if(c.querySelector('.imessage-quote')) repliesCount++; });
    setStats({ total, main: total - repliesCount, replies: repliesCount });

    if (commentObserverRef.current) {
        commentObserverRef.current.observe(container, { childList: true, subtree: true, attributes: false });
    }
    isProcessingRef.current = false;
  }, [handleQuoteClick]);

  // --- Effects ---
  useEffect(() => {
    if (!commentObserverRef.current) {
        commentObserverRef.current = new MutationObserver(() => {
            if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
            layoutTimeoutRef.current = setTimeout(() => {
                processLayout();
            }, 100);
        });
    }

    const checkTimer = setInterval(() => {
        const commentsContainer = document.querySelector('.imessage-mode .tk-comments-container');
        if (commentsContainer) {
            processLayout();
            if (commentObserverRef.current) {
                commentObserverRef.current.observe(commentsContainer, { childList: true, subtree: true, attributes: false });
            }
            setTimeout(() => { commentsContainer.scrollTop = commentsContainer.scrollHeight; }, 500);
            clearInterval(checkTimer);
        }
    }, 500);

    return () => {
        if (commentObserverRef.current) commentObserverRef.current.disconnect();
        if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
        clearInterval(checkTimer);
    }
  }, [processLayout, activeContactId]);

  useEffect(() => { if (headerIconsRef.current) headerIconsRef.current.innerHTML = ''; }, [activeContactId]);

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
            
            processLayout();
            
            let checkCount = 0;
            const refreshInterval = setInterval(() => {
                const container = document.querySelector('.imessage-mode .tk-comments-container');
                if (container) {
                    processLayout(); 
                    if(container.scrollHeight - container.scrollTop - container.clientHeight < 300) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
                checkCount++;
                if (checkCount > 10) clearInterval(refreshInterval); 
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

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation() 
      const target = e.target as HTMLElement
      const bubble = target.closest('.tk-content')
      if (bubble) {
          setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetElement: bubble as HTMLElement })
      }
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => setReloadKey(k => k + 1)} />}
      <MessageContextMenu {...contextMenu} onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))} />

      <style jsx global>{`
         .imessage-mode .tk-admin-container { 
             /* 还原：不再强制隐藏，交还给 Twikoo 控制 */
             /* display: none;  <-- 删除这行 */
         }
         
         .imessage-mode .tk-row { margin-bottom: 2px !important; display: flex !important; justify-content: flex-start !important; align-items: center !important; width: 100% !important; gap: 10px !important; }
         .imessage-mode .tk-meta { display: flex !important; align-items: center !important; gap: 6px !important; font-size: 10px !important; color: #8e8e93 !important; margin-left: 12px !important; margin-right: 0 !important; }
         .imessage-mode .tk-nick { font-weight: 500 !important; font-size: 11px !important; color: #666 !important; }
         .dark .imessage-mode .tk-nick { color: #aaa !important; }
         .imessage-mode .tk-time { font-size: 9px !important; opacity: 0.7 !important; }
         .imessage-mode .tk-action { opacity: 0 !important; transition: opacity 0.2s ease !important; display: flex !important; gap: 8px !important; margin-right: 0 !important; margin-left: 0 !important; }
         .imessage-mode .tk-comment:hover .tk-action { opacity: 1 !important; }
         .imessage-mode .tk-action-link { color: #999 !important; display: flex !important; align-items: center !important; gap: 2px !important; text-decoration: none !important; }
         .imessage-mode .tk-action-link:hover { color: #007aff !important; }
         .imessage-mode .tk-action-icon svg { width: 14px !important; height: 14px !important; fill: currentColor !important; }
         .imessage-mode .tk-action-count { font-size: 10px !important; min-width: 10px !important; }
         .imessage-mode .tk-master .tk-row { justify-content: flex-end !important; }
         .imessage-mode .tk-master .tk-meta { flex-direction: row-reverse !important; margin-left: 0 !important; margin-right: 12px !important; }
         .imessage-mode .tk-master .tk-action { flex-direction: row-reverse !important; margin-right: 8px !important; margin-left: 0 !important; }
      `}</style>

      {/* Left Sidebar */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl z-20 select-none">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2"><Search size={12} className="absolute left-2 top-1.5 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('msg_search')} className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"/></div>
           <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500 cursor-pointer"><Edit size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-none">
            {filteredContacts.map(contact => (
                <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={clsx("group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5 select-none", activeContactId === contact.id ? "bg-blue-500 text-white shadow-sm" : "hover:bg-gray-200 dark:hover:bg-white/5")}>
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm overflow-hidden", activeContactId === contact.id ? "bg-white/20 text-white backdrop-blur-sm" : "text-gray-600")}>{contact.avatar}</div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center"><div className="flex justify-between items-baseline"><span className={clsx("font-semibold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>{contact.name}</span><span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>{contact.time}</span></div><div className={clsx("text-xs truncate opacity-90", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>{contact.desc}</div></div>
                </div>
            ))}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative z-0">
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3"><span className="text-xs text-gray-400">{t('msg_to')}</span><div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20"><span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span></div></div>
            <div className="flex gap-2">
                <button onClick={() => setReloadKey(k => k + 1)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer"><RefreshCw size={14} /></button>
                {/* [还原] 这个按钮现在打开 Twikoo 原生后台 */}
                <button onClick={handleOpenNativeAdmin} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer" title="Admin Panel"><Shield size={16} /></button>
                {/* 这个按钮打开你的个性化设置 */}
                <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all cursor-pointer" title={t('msg_settings_title')}><Settings size={16} /></button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col w-full select-text" onContextMenu={handleContextMenu}>
            <CommentSystem key={`${activeContact.slug}-${reloadKey}`} slug={activeContact.slug} title={activeContact.name} compact={true} reloadKey={reloadKey} />
        </div>

        <div className="shrink-0 p-4 bg-[#f5f5f5] dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-white/10 z-30 relative group select-none">
            {!isReplying && stats.total > 0 && (
                <div className="absolute top-2 left-6 z-40 select-none pointer-events-none text-[10px] text-gray-400 font-medium"><span>共 {stats.total} 条信息 (主消息 {stats.main}, 回复 {stats.replies})</span></div>
            )}
            <div id="twikoo-moved-icons" ref={headerIconsRef} className={`absolute top-2 right-6 z-40 flex items-center gap-2 ${isReplying ? 'opacity-0' : 'opacity-100'} transition-opacity`}></div>
            <div className="relative max-w-4xl mx-auto w-full pt-3">
                {isReplying && (
                    <div className="absolute -top-10 left-0 right-0 flex items-center justify-between bg-gray-200/95 dark:bg-[#333]/95 backdrop-blur-md px-3 py-2 rounded-xl text-xs border border-gray-300 dark:border-white/10 shadow-lg animate-in slide-in-from-bottom-2 z-50">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate"><MessageCircle size={14} className="text-blue-500 fill-blue-500/20"/><span className="font-medium truncate max-w-[240px]">{replyTargetText || 'Replying...'}</span></div>
                        <button onClick={handleCancelReply} className="ml-2 p-1 hover:bg-gray-300 dark:hover:bg-white/20 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-red-500"><X size={14}/></button>
                    </div>
                )}
                <input type="text" value={inputValue} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={isReplying ? "Reply to message..." : t('msg_imessage')} className={clsx("w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-500 transition-all text-black dark:text-white z-20 relative", isReplying && "border-blue-400 ring-2 ring-blue-500/20")} />
                <button onClick={handleSend} disabled={!inputValue.trim()} className={`absolute right-1 top-4 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-30 ${inputValue.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'}`}><ArrowUp size={16} strokeWidth={3} /></button>
            </div>
            <div className="text-[10px] text-center text-gray-400 mt-2 select-none flex justify-center gap-1"><span>iMessage</span><span>•</span><span>Powered by Twikoo</span></div>
        </div>
      </div>
    </div>
  )
}