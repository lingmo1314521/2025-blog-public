'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useOs } from '../os-context'
import { useI18n } from '../i18n-context'

type FileType = 'file' | 'dir'

interface FileNode {
  name: string
  type: FileType
  content?: string
  children?: { [key: string]: FileNode }
}

export const Terminal = () => {
  const { launchApp, dockItems } = useOs()
  const { t } = useI18n()
  
  // 初始化文件系统，改为 LynxMuse 个人信息
  const [fileSystem, setFileSystem] = useState<FileNode>({
    name: 'root',
    type: 'dir',
    children: {
      'home': {
        name: 'home',
        type: 'dir',
        children: {
          'lynx': { // 用户名改为 lynx
            name: 'lynx',
            type: 'dir',
            children: {
              'projects': {
                name: 'projects',
                type: 'dir',
                children: {
                  'blog': { name: 'blog', type: 'file', content: 'This amazing macOS blog!' },
                  'wuthering-waves': { name: 'wuthering-waves', type: 'file', content: 'Game Launcher Project [WIP]' }
                }
              },
              'skills.txt': { name: 'skills.txt', type: 'file', content: 'Next.js, React, TypeScript, Tailwind CSS, Cybersecurity (SSRF)' },
              'contact.md': { name: 'contact.md', type: 'file', content: '# Contact\n- GitHub: @LynxMuse\n- Email: lynx@macos.web' },
              'flag.txt': { name: 'flag.txt', type: 'file', content: 'ctf{y0u_f0und_7h3_fl4g}' } // CTF 彩蛋
            }
          }
        }
      },
      'bin': {
        name: 'bin',
        type: 'dir',
        children: {
          'echo': { name: 'echo', type: 'file', content: 'Binary file' },
          'ls': { name: 'ls', type: 'file', content: 'Binary file' },
          'cd': { name: 'cd', type: 'file', content: 'Binary file' },
        }
      }
    }
  })

  // 路径改为 /home/lynx
  const [currentPath, setCurrentPath] = useState<string[]>(['home', 'lynx'])
  const [history, setHistory] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [input, setInput] = useState('')
  const [isMatrix, setIsMatrix] = useState(false)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (history.length === 0) {
      setHistory([t('term_login'), t('term_welcome'), ''])
    }
  }, [t])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const focusInput = () => inputRef.current?.focus()

  const getNode = (path: string[]): FileNode | null => {
    let current = fileSystem
    if (path.length === 0) return current
    for (const p of path) {
      if (current.children && current.children[p]) {
        current = current.children[p]
      } else {
        return null
      }
    }
    return current
  }

  const getCurrentNode = () => getNode(currentPath)

  const resolvePath = (target: string): string[] | null => {
    if (target === '/') return []
    if (target === '~') return ['home', 'lynx'] // ~ 指向 /home/lynx
    
    const parts = target.split('/').filter(p => p && p !== '.')
    let newPath = target.startsWith('/') ? [] : [...currentPath]

    for (const part of parts) {
      if (part === '..') {
        if (newPath.length > 0) newPath.pop()
      } else {
        newPath.push(part)
      }
    }
    return newPath
  }

  const handleCommand = (cmdRaw: string) => {
    const cmdTrim = cmdRaw.trim()
    if (cmdTrim) {
      setCommandHistory(prev => [...prev, cmdTrim])
      setHistoryIndex(-1)
    }

    const [cmd, ...args] = cmdTrim.split(/\s+/)
    const outputLines: string[] = []
    
    const promptUser = t('term_prompt_user') // lynx
    const promptPath = currentPath.length === 0 ? '/' : (currentPath.join('/') === `home/${promptUser}` ? '~' : currentPath[currentPath.length-1])
    outputLines.push(`[${promptUser}@mac ${promptPath}]$ ${cmdRaw}`)

    if (!cmdTrim) {
      setHistory(prev => [...prev, ...outputLines])
      return
    }

    switch (cmd) {
      case 'help':
        outputLines.push(t('term_help_header'))
        outputLines.push('  ls, cd, pwd, cat, mkdir, touch, rm, echo, clear')
        outputLines.push('  whoami, date, history, open, matrix')
        outputLines.push('  vi, vim, code (launches VS Code)')
        break

      case 'clear':
        setHistory([])
        return

      case 'pwd':
        outputLines.push('/' + currentPath.join('/'))
        break

      case 'ls':
        const node = getCurrentNode()
        if (node && node.children) {
          const files = Object.keys(node.children).sort()
          const formatted = files.map(name => {
            const isDir = node.children![name].type === 'dir'
            return isDir ? `${name}/` : name
          })
          outputLines.push(formatted.join('  '))
        }
        break

      case 'cd':
        if (!args[0]) {
          setCurrentPath(['home', 'lynx'])
        } else {
          const targetPath = resolvePath(args[0])
          const targetNode = targetPath ? getNode(targetPath) : null
          
          if (targetNode && targetNode.type === 'dir') {
            setCurrentPath(targetPath!)
          } else if (targetNode && targetNode.type === 'file') {
            outputLines.push(`cd: ${args[0]}: ${t('term_is_dir').replace('is', 'not')}`)
          } else {
            outputLines.push(`cd: ${args[0]}: ${t('term_no_such')}`)
          }
        }
        break

      case 'mkdir':
        if (!args[0]) outputLines.push('usage: mkdir <name>')
        else {
          const c = getCurrentNode()
          if (c && c.children) {
            if (c.children[args[0]]) outputLines.push(`mkdir: ${args[0]}: ${t('term_dir_exists')}`)
            else { c.children[args[0]] = { name: args[0], type: 'dir', children: {} }; setFileSystem({...fileSystem}) }
          }
        }
        break

      case 'touch':
        if (!args[0]) outputLines.push('usage: touch <name>')
        else {
          const c = getCurrentNode()
          if (c && c.children) {
             if (!c.children[args[0]]) { c.children[args[0]] = { name: args[0], type: 'file', content: '' }; setFileSystem({...fileSystem}) }
          }
        }
        break

      case 'rm':
        if (!args[0]) outputLines.push('usage: rm <name>')
        else if (args[0] === '/' && args.includes('-rf')) outputLines.push(t('term_rm_joke'))
        else {
          const c = getCurrentNode()
          if (c && c.children && c.children[args[0]]) {
             if (c.children[args[0]].type === 'dir' && !args.includes('-r')) outputLines.push(`rm: ${args[0]}: ${t('term_is_dir')}`)
             else { delete c.children[args[0]]; setFileSystem({...fileSystem}) }
          } else outputLines.push(`rm: ${args[0]}: ${t('term_no_such')}`)
        }
        break

      case 'cat':
        if (!args[0]) outputLines.push('usage: cat <file>')
        else {
          const f = getCurrentNode()?.children?.[args[0]]
          if (f) {
            if (f.type === 'dir') outputLines.push(`cat: ${args[0]}: ${t('term_is_dir')}`)
            else outputLines.push(f.content || '')
          } else outputLines.push(`cat: ${args[0]}: ${t('term_no_such')}`)
        }
        break

      case 'echo': outputLines.push(args.join(' ')); break

      case 'whoami': outputLines.push('lynx'); break // 改为 lynx

      case 'date': outputLines.push(new Date().toString()); break

      case 'history':
        commandHistory.forEach((h, i) => outputLines.push(`${i + 1}  ${h}`))
        outputLines.push(`${commandHistory.length + 1}  history`)
        break

      case 'sudo': outputLines.push(t('term_sudo_joke')); break

      case 'open':
        const appName = args.join(' ').toLowerCase()
        if (appName.startsWith('http')) {
             // 简单的安全检查
            try {
                const url = new URL(appName)
                if(['http:', 'https:'].includes(url.protocol)) window.open(appName, '_blank')
            } catch { outputLines.push(`open: invalid url`) }
        } else {
            const app = dockItems.find(a => a.id.toLowerCase() === appName || t(a.id).toLowerCase() === appName)
            if (app) {
                launchApp(app)
                outputLines.push(`Opening ${app.title}...`)
            } else outputLines.push(`open: application not found: ${args.join(' ')}`)
        }
        break
      
      case 'vi':
      case 'vim':
      case 'code':
        outputLines.push('Opening VS Code...')
        const vscode = dockItems.find(a => a.id === 'vscode')
        if (vscode) setTimeout(() => launchApp(vscode), 500)
        break

      case 'matrix': setIsMatrix(true); setHistory([]); return

      default: outputLines.push(`zsh: ${t('term_cmd_not_found')}: ${cmd}`)
    }

    setHistory(prev => [...prev, ...outputLines])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { handleCommand(input); setInput('') }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) { setHistoryIndex(-1); setInput('') }
        else { setHistoryIndex(newIndex); setInput(commandHistory[newIndex]) }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
        if (isMatrix) { setIsMatrix(false); setHistory(['^C']) }
        else { setHistory(prev => [...prev, `[lynx@mac] $ ${input}^C`]); setInput('') }
    } else if (e.key === 'Tab') {
        e.preventDefault()
        const parts = input.split(' '); const last = parts.pop() || ''
        const node = getCurrentNode()
        if (node && node.children) {
            const matches = Object.keys(node.children).filter(f => f.startsWith(last))
            if (matches.length === 1) setInput([...parts, matches[0]].join(' '))
        }
    }
  }

  // Matrix Effect (省略部分代码以节省空间，功能同原版，只需确保引用正确)
  useEffect(() => {
    if (!isMatrix || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const cols = Math.floor(canvas.width / 20); const ypos = Array(cols).fill(0)
    const interval = setInterval(() => {
      ctx.fillStyle = '#0001'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f0'; ctx.font = '15pt monospace'
      ypos.forEach((y, i) => {
        const text = String.fromCharCode(Math.random() * 128); const x = i * 20
        ctx.fillText(text, x, y)
        if (y > 100 + Math.random() * 10000) ypos[i] = 0; else ypos[i] = y + 20
      })
    }, 50)
    return () => clearInterval(interval)
  }, [isMatrix])

  if (isMatrix) return <div className="fixed inset-0 z-[99999] bg-black cursor-none" onClick={() => setIsMatrix(false)}><canvas ref={canvasRef} className="block" /></div>

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]/95 text-[#33ff00] font-mono text-sm shadow-inner" onClick={focusInput}>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {history.map((line, i) => (
            <div key={`${i}-${line.substring(0,5)}`} className={`whitespace-pre-wrap break-all mb-0.5 leading-tight ${(line.includes('not found')||line.includes('denied')) ? 'text-red-400' : ''}`}>
                {line.split('  ').map((part, idx) => <span key={idx} className={part.endsWith('/') ? 'text-blue-400 font-bold mr-4' : 'mr-4'}>{part}</span>)}
            </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-blue-400 font-bold shrink-0">
             [lynx@mac {currentPath.length === 0 ? '/' : (currentPath.length===2 && currentPath[1]==='lynx' ? '~' : currentPath[currentPath.length-1])}]$
          </span>
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 bg-transparent outline-none border-none text-[#33ff00] caret-[#33ff00]" autoFocus autoComplete="off" spellCheck={false} />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}