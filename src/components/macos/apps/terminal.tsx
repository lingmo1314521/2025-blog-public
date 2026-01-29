// src/components/macos/apps/terminal.tsx
'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useOs } from '../os-context'
import { useI18n } from '../i18n-context'
import { 
    QrCode, CheckCircle, Loader2, Terminal as TerminalIcon, Wifi, Smile,
    Cpu, Battery, Monitor
} from 'lucide-react'
import { clsx } from '../utils'

// ==================================================================================
// 1. 类型定义
// ==================================================================================

type HistoryType = 'text' | 'image' | 'video' | 'iframe' | 'component' | 'error' | 'success' | 'info' | 'warn' | 'json'

interface HistoryItem {
    id: string
    type: HistoryType
    content: any
    meta?: any
}

interface Theme {
    name: string
    bg: string
    text: string
    prompt: string
}

const THEMES: Record<string, Theme> = {
    'macos': { name: 'MacOS', bg: 'bg-[#1e1e1e]/95', text: 'text-[#cccccc]', prompt: 'text-blue-400' },
    'ubuntu': { name: 'Ubuntu', bg: 'bg-[#300a24]/95', text: 'text-white', prompt: 'text-[#87ff00]' },
    'matrix': { name: 'Matrix', bg: 'bg-black/95', text: 'text-[#00ff00]', prompt: 'text-[#008f11]' },
    'cyber': { name: 'Cyberpunk', bg: 'bg-[#0b1021]/95', text: 'text-[#00f0ff]', prompt: 'text-[#ff003c]' },
    'light': { name: 'Light', bg: 'bg-[#fafafa]/95', text: 'text-[#333333]', prompt: 'text-blue-600' },
}

// ==================================================================================
// 2. 辅助组件 (Login)
// ==================================================================================

const BiliLogin = ({ onSuccess, onClose }: { onSuccess: (c: string, csrf: string) => void, onClose: () => void }) => {
    const [qrUrl, setQrUrl] = useState(''); const [qrKey, setQrKey] = useState('')
    const [status, setStatus] = useState('初始化二维码...'); const [isSuccess, setIsSuccess] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // [cite: 2] Passport Login API
        fetch(`/api/proxy?url=${encodeURIComponent('https://passport.bilibili.com/x/passport-login/web/qrcode/generate')}`)
            .then(r=>r.json()).then(json => { if(json.code===0) { setQrUrl(json.data.url); setQrKey(json.data.qrcode_key); setStatus('请使用手机APP扫码') } else setStatus('API Error') })
            .catch(()=>setStatus('Network Error'))
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    useEffect(() => {
        if (!qrKey || isSuccess) return
        timerRef.current = setInterval(async () => {
            const json = await fetch(`/api/proxy?url=${encodeURIComponent(`https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrKey}`)}`).then(r=>r.json())
            if (json.data.code === 0) {
                setIsSuccess(true); setStatus('登录成功!')
                clearInterval(timerRef.current!)
                const url = json.data.url; const sess = url.match(/SESSDATA=([^&]+)/)?.[1]; const jct = url.match(/bili_jct=([^&]+)/)?.[1]
                if (sess && jct) setTimeout(() => { onSuccess(`SESSDATA=${sess}; bili_jct=${jct};`, jct); onClose() }, 1000)
            } else if (json.data.code === 86090) setStatus('已扫码，请确认')
        }, 3000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [qrKey, isSuccess, onSuccess, onClose])

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg max-w-xs mx-auto border border-white/20 my-2">
            <div className="bg-white p-2 rounded-lg mb-2">
                {isSuccess ? <CheckCircle className="text-green-500 w-32 h-32"/> : qrUrl ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`} className="w-32 h-32 rendering-pixelated"/> : <Loader2 className="animate-spin w-32 h-32 text-black"/>}
            </div>
            <div className={`text-sm font-bold ${isSuccess?'text-green-400':'text-white'}`}>{status}</div>
        </div>
    )
}

// ==================================================================================
// 3. 终端核心组件
// ==================================================================================

export const Terminal = () => {
  const { closeWindow } = useOs()
  const { t } = useI18n()
  
  // --- State Definitions (Must be top level to avoid ReferenceError) ---
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [isMatrix, setIsMatrix] = useState(false) // <--- Fixed: Defined here
  const [theme, setTheme] = useState<Theme>(THEMES['macos'])
  const [todos, setTodos] = useState<string[]>(() => {
      if (typeof localStorage !== 'undefined') {
          const s = localStorage.getItem('lynx-todos'); return s ? JSON.parse(s) : []
      } return []
  })

  // Auth
  const [biliCookie, setBiliCookie] = useState(''); const [biliCsrf, setBiliCsrf] = useState('')
  
  // Refs
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null)

  // --- Initialization ---
  useEffect(() => {
      const c = localStorage.getItem('bili-cookie'); if(c) setBiliCookie(c);
      const csrf = localStorage.getItem('bili-csrf'); if(csrf) setBiliCsrf(csrf);
      
      setHistory([
          { id: 'init-1', type: 'info', content: t('term_login') },
          { id: 'init-2', type: 'success', content: t('term_welcome') },
          { id: 'init-3', type: 'text', content: t('term_help_intro') },
          { id: 'init-4', type: 'text', content: '' }
      ])
  }, [t])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, loading])
  useEffect(() => { localStorage.setItem('lynx-todos', JSON.stringify(todos)) }, [todos])

  // --- Utils ---
  const addLog = (type: HistoryType, content: any) => setHistory(p => [...p, { id: Math.random().toString(36), type, content }])
  const clearLogs = () => setHistory([])
  const formatNum = (n: number) => n > 10000 ? (n/10000).toFixed(1)+'w' : n

  // --- Bili API Proxy ---
  const fetchBili = async (url: string, method='GET', data?: any) => {
      const headers: any = {}; if(biliCookie) headers['X-Bili-Cookie'] = biliCookie
      let opts: any = { method, headers }
      if (method === 'POST') {
          const fd = new URLSearchParams(); Object.keys(data).forEach(k=>fd.append(k,data[k]))
          if(biliCsrf) fd.append('csrf', biliCsrf); opts.body = fd.toString()
      }
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, opts)
      return res.json()
  }

  // --- Command Handlers ---
  const execute = async (raw: string) => {
      const trim = raw.trim(); if(!trim) return
      setCmdHistory(p=>[...p, trim]); setHistIdx(-1); addLog('text', `[${t('term_prompt_user')}@mac ~]$ ${raw}`)
      const [cmd, ...args] = trim.split(/\s+/)
      setLoading(true)

      try {
          switch (cmd.toLowerCase()) {
            // === System ===
            case 'clear': case 'cls': clearLogs(); break
            case 'matrix': setIsMatrix(true); setHistory([]); break
            case 'exit': closeWindow('terminal'); break
            case 'date': addLog('text', new Date().toString()); break
            case 'echo': addLog('text', args.join(' ')); break
            case 'history': cmdHistory.forEach((c,i)=>addLog('text', `${i+1} ${c}`)); break
            case 'neofetch': 
                addLog('info', `
       /\\        OS: LynxOS x86_64
      /  \\       Kernel: 5.0.1-generic
     / /\\ \\      Uptime: ${Math.floor(performance.now()/60000)} mins
    / /  \\ \\     Shell: bash 5.1.16
   / /    \\ \\    Resolution: ${window.innerWidth}x${window.innerHeight}
  / /      \\ \\   Theme: ${theme.name}
  \\/        \\/   CPU: Simulated Intel Core i9
`); break
            case 'theme': 
                if(THEMES[args[0]]) { setTheme(THEMES[args[0]]); addLog('success', `Theme set to ${args[0]}`) }
                else addLog('warn', `Available: ${Object.keys(THEMES).join(', ')}`)
                break

            // === Media ===
            case 'img': if(args[0]) addLog('image', args[0]); else addLog('error', 'Usage: img <url>'); break
            case 'video': if(args[0]) addLog('video', args[0]); else addLog('error', 'Usage: video <url>'); break
            case 'view': 
                if(args[0]) { let u=args[0]; if(!u.startsWith('http')) u='https://'+u; addLog('iframe', u) } 
                else addLog('error', 'Usage: view <url>'); break
            case 'qr': if(args[0]) addLog('image', `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(args[0])}`); break

            // === Dev Tools ===
            case 'base64': 
                if(args[0]==='enc') addLog('success', btoa(args.slice(1).join(' ')))
                else if(args[0]==='dec') addLog('success', atob(args.slice(1).join(' ')))
                else addLog('warn', 'Usage: base64 [enc|dec] <str>'); break
            case 'json': try{ addLog('json', JSON.stringify(JSON.parse(args.join(' ')),null,2)) }catch{addLog('error','Invalid JSON')} break
            case 'md5': addLog('info', 'Simulated_MD5_'+Math.random().toString(36)); break
            case 'uuid': addLog('success', crypto.randomUUID()); break
            case 'color': addLog('component', <div className="flex gap-2 items-center"><div className="w-8 h-8 rounded border" style={{backgroundColor:args[0]}}/><span>{args[0]}</span></div>); break
            
            // === Productivity ===
            case 'todo':
                if(args[0]==='add') { setTodos([...todos, args.slice(1).join(' ')]); addLog('success', 'Added.') }
                else if(args[0]==='rm') { const idx=parseInt(args[1])-1; setTodos(todos.filter((_,i)=>i!==idx)); addLog('success', 'Removed.') }
                else if(args[0]==='ls') { todos.length ? todos.forEach((t,i)=>addLog('text', `${i+1}. [ ] ${t}`)) : addLog('info', 'No tasks.') }
                else addLog('warn', 'Usage: todo [add|ls|rm]'); break
            
            // === Bilibili Suite  ===
            case 'bili':
                const sub = args[0]; const p = args[1]
                if(sub==='login') { addLog('component', <BiliLogin onSuccess={(c,csrf)=>{setBiliCookie(c);setBiliCsrf(csrf);localStorage.setItem('bili-cookie',c);localStorage.setItem('bili-csrf',csrf);addLog('success','Cookie Saved')}} onClose={()=>{}} />); break }
                if(sub==='logout') { setBiliCookie(''); localStorage.removeItem('bili-cookie'); addLog('success','Logged out'); break }
                
                if(sub==='user') { // [cite: 2]
                    if(!p) throw new Error('UID req'); const [i,s,u] = await Promise.all([fetchBili(`https://api.bilibili.com/x/space/acc/info?mid=${p}`), fetchBili(`https://api.bilibili.com/x/relation/stat?vmid=${p}`), fetchBili(`https://api.bilibili.com/x/space/upstat?mid=${p}`)])
                    if(i.code===0) { const d=i.data; addLog('image', d.face); addLog('success', `${d.name} (Lv${d.level})`); addLog('text', `${t('u_fans')}: ${formatNum(s.data.follower)} | Views: ${formatNum(u.data.archive.view)}`); addLog('text', d.sign) } else throw new Error(i.message)
                }
                else if(sub==='video') { // [cite: 2]
                    if(!p) throw new Error('BVID req'); const res = await fetchBili(`https://api.bilibili.com/x/web-interface/view?bvid=${p}`)
                    if(res.code===0) { const d=res.data; addLog('image', d.pic); addLog('success', d.title); addLog('text', `UP: ${d.owner.name}`); addLog('text', `Play: ${formatNum(d.stat.view)} | Like: ${formatNum(d.stat.like)}`) }
                }
                else if(sub==='search') { // [cite: 2]
                    const res = await fetchBili(`https://api.bilibili.com/x/web-interface/search/all/v2?page=1&keyword=${encodeURIComponent(p)}`)
                    const vids = res.data?.result?.find((r:any)=>r.result_type==='video')?.data
                    if(vids) vids.slice(0,5).forEach((v:any)=>addLog('text', `[${v.bvid}] ${v.title.replace(/<[^>]+>/g,'')} (@${v.author})`))
                }
                else if(sub==='rank') { // [cite: 2]
                    const res = await fetchBili(`https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1`)
                    res.data?.list?.forEach((v:any,i:number)=>addLog('text', `${i+1}. ${v.title} [${v.bvid}]`))
                }
                else if(sub==='like') { // [cite: 2]
                    if(!biliCookie) throw new Error('Login req'); const v = await fetchBili(`https://api.bilibili.com/x/web-interface/view?bvid=${p}`); 
                    const res = await fetchBili(`https://api.bilibili.com/x/web-interface/archive/like1`, 'POST', {aid: v.data.aid, like: 1}); addLog('info', res.message)
                }
                else addLog('warn', 'Bili: login, user, video, search, rank, like')
                break

            // === API & Fun ===
            case 'weather': 
                const w = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${args[0]||'Tokyo'}&count=1`).then(r=>r.json())
                if(w.results) { const l=w.results[0]; const d=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${l.latitude}&longitude=${l.longitude}&current=temperature_2m`).then(r=>r.json()); addLog('success', `${l.name}: ${d.current.temperature_2m}°C`) } else addLog('error','Not found')
                break
            case 'ip': const ip = await fetch('https://ipapi.co/json/').then(r=>r.json()); addLog('json', JSON.stringify(ip,null,2)); break
            case 'joke': const j = await fetch('https://official-joke-api.appspot.com/random_joke').then(r=>r.json()); addLog('text', `${j.setup}\n> ${j.punchline}`); break
            
            case 'help':
                addLog('info', '=== Lynx Terminal v5.0 ===')
                addLog('success', `[${t('cat_sys')}] clear, exit, date, echo, neofetch, theme`)
                addLog('success', `[${t('cat_media')}] view <url>, img <url>, video <url>, qr <str>`)
                addLog('success', `[${t('cat_dev')}] base64, json, md5, uuid, color`)
                addLog('success', `[${t('cat_prod')}] todo (add/ls/rm)`)
                addLog('success', `[${t('cat_net')}] weather, ip, joke`)
                addLog('success', `[${t('cat_bili')}] bili (login/user/video/search/rank/like)`)
                break
            default: addLog('error', `Command not found: ${cmd}`)
          }
      } catch (e: any) { addLog('error', e.message) }
      setLoading(false)
  }

  // --- Effects ---
  const onKeyDown = (e: React.KeyboardEvent) => {
      if(e.key==='Enter') { execute(input); setInput('') }
      if(e.key==='ArrowUp' && cmdHistory.length) { const i = histIdx===-1?cmdHistory.length-1:Math.max(0,histIdx-1); setHistIdx(i); setInput(cmdHistory[i]) }
      if(e.key==='ArrowDown' && histIdx!==-1) { const i=histIdx+1; if(i>=cmdHistory.length){setHistIdx(-1);setInput('')}else{setHistIdx(i);setInput(cmdHistory[i])} }
  }

  useEffect(() => {
      if(!isMatrix || !matrixCanvasRef.current) return
      const c = matrixCanvasRef.current; const ctx = c.getContext('2d')!; c.width=window.innerWidth; c.height=window.innerHeight
      const cols=Math.floor(c.width/20); const y=Array(cols).fill(0)
      const t = setInterval(()=>{ ctx.fillStyle='#0001';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#0f0';ctx.font='15pt monospace';y.forEach((v,i)=>{ctx.fillText(String.fromCharCode(Math.random()*128),i*20,v);y[i]=v>100+Math.random()*1e4?0:v+20}) }, 50)
      return () => clearInterval(t)
  }, [isMatrix])

  if (isMatrix) return <div className="fixed inset-0 z-50 bg-black cursor-pointer" onClick={()=>setIsMatrix(false)}><canvas ref={matrixCanvasRef} className="w-full h-full"/></div>

  // --- Render ---
  const renderItem = (item: HistoryItem) => {
      switch(item.type) {
          case 'image': return <img src={item.content} className="max-w-[80%] max-h-64 rounded border border-white/20 my-2" />
          case 'video': return <video src={item.content} controls className="max-w-[80%] max-h-64 rounded border border-white/20 my-2" />
          case 'iframe': return <iframe src={item.content} className="w-full h-80 rounded border border-white/20 my-2 bg-white" />
          case 'component': return <div className="my-2">{item.content}</div>
          case 'json': return <pre className="text-xs text-yellow-200 bg-white/5 p-2 rounded overflow-auto">{item.content}</pre>
          case 'error': return <div className="text-red-500 break-all">{item.content}</div>
          case 'success': return <div className="text-green-400 font-bold">{item.content}</div>
          case 'info': return <div className="text-blue-400 font-bold">{item.content}</div>
          default: return <div className="whitespace-pre-wrap break-all">{item.content}</div>
      }
  }

  return (
    <div className={clsx("flex flex-col h-full w-full font-mono text-sm transition-colors duration-300", theme.bg, theme.text)} onClick={()=>inputRef.current?.focus()}>
      <div className="h-8 border-b border-white/10 flex items-center px-3 justify-between bg-black/20 select-none">
          <div className="flex gap-4 opacity-70">
              <div className="flex items-center gap-1"><TerminalIcon size={12}/> <span>bash</span></div>
              <div className="flex items-center gap-1"><Cpu size={12}/> <span>{loading?'Busy':'Idle'}</span></div>
          </div>
          <div className="opacity-50 text-xs">{theme.name}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-1">
          {history.map(item => <div key={item.id}>{renderItem(item)}</div>)}
          {loading && <div className="flex items-center gap-2 text-yellow-400 animate-pulse"><Loader2 size={14} className="animate-spin"/> {t('term_loading')}</div>}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
              <span className={clsx("font-bold shrink-0", theme.prompt)}>[{t('term_prompt_user')}@mac ~]$</span>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKeyDown} className="flex-1 bg-transparent outline-none border-none placeholder-white/20 text-inherit" autoFocus spellCheck={false} placeholder="help" />
          </div>
          <div ref={endRef} />
      </div>
    </div>
  )
}