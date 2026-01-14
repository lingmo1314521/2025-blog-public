'use client'

import React from 'react'

interface PreviewProps {
    file?: {
        name: string
        content?: string // Base64 URL or standard URL
        type: 'image' | 'video' | 'text'
    }
}

export const Preview = ({ file }: PreviewProps) => {
    if (!file) return <div className="flex items-center justify-center h-full text-gray-500">No file selected</div>

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white">
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
                {/* 棋盘格背景 (透明图片) */}
                <div className="absolute inset-0 z-0 opacity-20" 
                     style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }} 
                />
                
                <div className="z-10 relative max-w-full max-h-full shadow-2xl">
                    {file.type === 'video' ? (
                        <video src={file.content} controls autoPlay className="max-w-full max-h-full rounded-lg" />
                    ) : (
                        <img src={file.content} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg" />
                    )}
                </div>
            </div>
            <div className="h-10 bg-[#2c2c2c] border-t border-white/10 flex items-center justify-center text-xs font-medium text-gray-300">
                {file.name}
            </div>
        </div>
    )
}