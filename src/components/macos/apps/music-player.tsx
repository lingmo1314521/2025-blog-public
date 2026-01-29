'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'

const PLAYLIST = [
  { id: 1, title: "Wuthering Waves Theme", artist: "Kuro Games", cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop", duration: 180 },
  { id: 2, title: "Cyberpunk City", artist: "Synthwave Boy", cover: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop", duration: 240 },
  { id: 3, title: "Coding Focus", artist: "Lofi Beats", cover: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop", duration: 150 },
  { id: 4, title: "Midnight Drive", artist: "Retro Future", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop", duration: 210 },
]

export const MusicPlayer = () => {
  const { t } = useI18n()
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [showPlaylist, setShowPlaylist] = useState(false)
  
  const currentSong = PLAYLIST[currentSongIndex]
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= currentSong.duration) {
            handleNext()
            return 0
          }
          return p + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, currentSong])

  useEffect(() => {
    setProgress(0)
    setIsPlaying(true)
  }, [currentSongIndex])

  const handleNext = () => setCurrentSongIndex(prev => (prev + 1) % PLAYLIST.length)
  const handlePrev = () => setCurrentSongIndex(prev => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] text-white overflow-hidden relative select-none">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 transition-all duration-1000 ease-in-out z-0"
        style={{ backgroundImage: `url(${currentSong.cover})` }}
      />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10 flex w-full h-full">
        <div className={clsx("flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500", showPlaylist ? "w-1/2" : "w-full")}>
            <div className="w-64 h-64 rounded-xl shadow-2xl overflow-hidden mb-8 border border-white/10 group">
                <img src={currentSong.cover} alt="Cover" className={clsx("w-full h-full object-cover transition-transform duration-700", isPlaying ? "scale-110" : "scale-100")} />
            </div>
            
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-1 drop-shadow-md">{currentSong.title}</h2>
                <p className="text-gray-300 font-medium">{currentSong.artist}</p>
            </div>

            <div className="w-full max-w-md mb-6 flex items-center gap-3 text-xs font-mono text-gray-300">
                <span>{formatTime(progress)}</span>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer group" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const ratio = (e.clientX - rect.left) / rect.width
                    setProgress(ratio * currentSong.duration)
                }}>
                    <div className="absolute top-0 left-0 h-full bg-pink-500 transition-all duration-100" style={{ width: `${(progress / currentSong.duration) * 100}%` }} />
                </div>
                <span>{formatTime(currentSong.duration)}</span>
            </div>

            <div className="flex items-center gap-8">
                <button onClick={() => setShowPlaylist(!showPlaylist)} className={clsx("p-2 rounded-full hover:bg-white/10 transition-colors", showPlaylist && "text-pink-400")}><ListMusic size={20}/></button>
                <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full transition-colors"><SkipBack size={28} fill="currentColor" /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full transition-colors"><SkipForward size={28} fill="currentColor" /></button>
                <div className="relative group">
                    <Volume2 size={20} className="cursor-pointer" />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-24 bg-[#2c2c2c] rounded-lg hidden group-hover:flex items-end justify-center p-2 shadow-xl border border-white/10">
                        <div className="w-1.5 bg-white/20 h-full rounded-full relative">
                            <div className="absolute bottom-0 left-0 w-full bg-white rounded-full" style={{ height: `${volume}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {showPlaylist && (
            <div className="w-72 bg-black/40 border-l border-white/10 backdrop-blur-md flex flex-col transition-all duration-300">
                <div className="p-4 border-b border-white/10 font-bold text-sm">{t('music_playing_next')}</div>
                <div className="flex-1 overflow-y-auto p-2">
                    {PLAYLIST.map((song, i) => (
                        <div 
                            key={song.id}
                            onClick={() => setCurrentSongIndex(i)}
                            className={clsx(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors mb-1",
                                i === currentSongIndex ? "bg-white/20" : "hover:bg-white/10"
                            )}
                        >
                            {i === currentSongIndex && <div className="w-1 h-8 bg-pink-500 rounded-full animate-pulse" />}
                            <img src={song.cover} className="w-10 h-10 rounded object-cover" alt="art" />
                            <div className="flex-1 min-w-0">
                                <div className={clsx("text-sm font-medium truncate", i === currentSongIndex && "text-pink-300")}>{song.title}</div>
                                <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                            </div>
                            <div className="text-xs text-gray-500">{formatTime(song.duration)}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}