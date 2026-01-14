'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useOs } from '../os-context'
import { useI18n } from '../i18n-context'

export const Siri = () => {
  const { launchApp, dockItems } = useOs()
  const { language, t } = useI18n()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState(t('siri_listening'))
  const [OrbColor, setOrbColor] = useState(['#F00', '#0F0', '#00F'])

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // 浏览器兼容性检查
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US'
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript(t('siri_listening'))
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase()
        setTranscript(`"${command}"`)
        processCommand(command)
      }

      recognitionRef.current = recognition
      // 自动开始监听
      recognition.start()
    } else {
      setTranscript(t('siri_not_supported'))
    }
  }, [language])

  const processCommand = (cmd: string) => {
    // 1. 鸣潮启动 (Wuthering Waves)
    if (cmd.includes('鸣潮') || cmd.includes('wuthering') || cmd.includes('waves') || cmd.includes('启动')) {
        const game = dockItems.find(a => a.id === 'wuthering_waves')
        if (game) {
            setTranscript(t('siri_launching_game'))
            setTimeout(() => launchApp(game), 1000)
            return
        }
    }

    // 2. 通用应用启动
    // 遍历所有 App，匹配名称
    const targetApp = dockItems.find(app => {
        const name = t(app.id).toLowerCase()
        // 简单匹配：比如 "打开终端" -> 包含 "终端"
        return cmd.includes(name) || cmd.includes(app.title.toLowerCase())
    })

    if (targetApp) {
        setTranscript(`${t('siri_opening')} ${t(targetApp.id)}...`)
        setTimeout(() => launchApp(targetApp), 800)
    } else {
        setTranscript(t('siri_sorry'))
    }
  }

  const toggleListen = () => {
    if (isListening) recognitionRef.current?.stop()
    else recognitionRef.current?.start()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-2xl text-white relative overflow-hidden">
        {/* Siri Orb Animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
            <motion.div 
                animate={{ 
                    scale: isListening ? [1, 1.2, 1] : 1,
                    rotate: isListening ? [0, 360] : 0,
                    filter: isListening ? "hue-rotate(0deg)" : "hue-rotate(90deg)"
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 h-48 rounded-full blur-3xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 opacity-60 mix-blend-screen"
            />
            <motion.div 
                animate={{ scale: isListening ? [1.2, 0.8, 1.2] : 1 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-32 h-32 rounded-full blur-2xl bg-gradient-to-bl from-blue-400 to-green-300 opacity-60 mix-blend-screen"
            />
        </div>

        <div className="z-10 flex flex-col items-center gap-6">
            <div className="text-2xl font-light tracking-wide text-center px-8 min-h-[40px] drop-shadow-lg">
                {transcript}
            </div>

            <button 
                onClick={toggleListen}
                className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
                {isListening ? <Mic size={32} className="text-white animate-pulse" /> : <MicOff size={32} className="text-white/50" />}
            </button>
        </div>
        
        <div className="absolute bottom-6 text-xs text-white/30 font-light">
            {t('siri_hint')}
        </div>
    </div>
  )
}