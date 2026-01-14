'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export const WutheringWavesLauncher = () => {
    const [status, setStatus] = useState('Checking Updates...')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // 模拟加载过程
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    setStatus('Game Ready')
                    clearInterval(timer)
                    return 100
                }
                return prev + Math.random() * 5
            })
        }, 100)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative h-full w-full bg-black text-white overflow-hidden font-sans select-none">
            {/* Background */}
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop)' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full p-12">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <motion.h1 
                            initial={{ x: -50, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            className="text-5xl font-black tracking-tighter italic"
                        >
                            WUTHERING<br/>WAVES
                        </motion.h1>
                        <div className="text-yellow-400 font-bold tracking-widest text-sm">KURO GAMES</div>
                    </div>
                    <div className="text-xs text-gray-400 border border-white/20 px-3 py-1 rounded">v1.4.0</div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-300">
                            <span>{status}</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-yellow-400" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>

                    <button 
                        disabled={progress < 100}
                        className={`w-full py-4 text-xl font-bold uppercase tracking-widest transition-all
                            ${progress < 100 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                            }
                        `}
                    >
                        {progress < 100 ? 'Installing...' : 'Start Game'}
                    </button>
                </div>
            </div>
        </div>
    )
}