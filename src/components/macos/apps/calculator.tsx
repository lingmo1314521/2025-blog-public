// components/macos/apps/calculator.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { clsx } from '../utils'

// 辅助函数：格式化数字显示 (自动加逗号，限制长度)
const formatNumber = (num: string) => {
  if (!num) return '0'
  // 防止科学计数法过长
  const n = parseFloat(num)
  if (isNaN(n)) return 'Error'
  
  // 处理过长的数字
  if (num.length > 9) {
    return n.toExponential(4)
  }
  
  // 简单的千分位格式化
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(n)
}

export const Calculator = () => {
  const [current, setCurrent] = useState('0') // 当前输入的数字 (大字)
  const [prev, setPrev] = useState<string | null>(null) // 上一个数字
  const [operator, setOperator] = useState<string | null>(null) // 运算符
  const [isNewInput, setIsNewInput] = useState(false) // 是否刚点击了运算符，准备输入新数字
  const [history, setHistory] = useState('') // 用于显示的算式历史 (小字)

  // 处理数字输入
  const inputDigit = (digit: string) => {
    if (isNewInput) {
      setCurrent(digit)
      setIsNewInput(false)
    } else {
      setCurrent(current === '0' ? digit : current + digit)
    }
  }

  // 处理小数点
  const inputDot = () => {
    if (isNewInput) {
      setCurrent('0.')
      setIsNewInput(false)
    } else if (!current.includes('.')) {
      setCurrent(current + '.')
    }
  }

  // 处理运算符 (+ - × ÷)
  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(current)

    if (prev === null) {
      // 第一次输入运算符
      setPrev(current)
      setHistory(`${current} ${nextOperator}`)
    } else if (operator) {
      // 连续运算：先算出结果，再作为下一次的基数
      const prevValue = parseFloat(prev)
      if (isNewInput) {
        // 如果是连续点击运算符 (比如点了 + 又点 -)，只更新运算符
        setHistory(`${prev} ${nextOperator}`)
        setOperator(nextOperator)
        return
      }

      const newValue = calculate(prevValue, inputValue, operator)
      setPrev(String(newValue))
      setHistory(`${newValue} ${nextOperator}`)
      setCurrent(String(newValue))
    }

    setIsNewInput(true)
    setOperator(nextOperator)
  }

  // 核心计算逻辑
  const calculate = (left: number, right: number, op: string) => {
    switch (op) {
      case '+': return left + right
      case '-': return left - right
      case '×': return left * right
      case '÷': return left / right
      default: return right
    }
  }

  // 等号
  const handleEqual = () => {
    if (!operator || prev === null) return

    const inputValue = parseFloat(current)
    const prevValue = parseFloat(prev)
    const result = calculate(prevValue, inputValue, operator)

    // 更新显示
    setHistory(`${prev} ${operator} ${current} =`)
    setCurrent(String(result))
    
    // 重置状态，准备下一次全新计算
    setPrev(null)
    setOperator(null)
    setIsNewInput(true)
  }

  // 清除 (AC)
  const reset = () => {
    setCurrent('0')
    setPrev(null)
    setOperator(null)
    setHistory('')
    setIsNewInput(false)
  }

  // 退格 (模拟 macOS 侧滑或 C 键)
  const backspace = () => {
    if (isNewInput) return
    if (current.length === 1) {
      setCurrent('0')
    } else {
      setCurrent(current.slice(0, -1))
    }
  }

  // 正负号切换
  const toggleSign = () => {
    setCurrent(String(parseFloat(current) * -1))
  }

  // 百分比
  const percent = () => {
    setCurrent(String(parseFloat(current) / 100))
  }

  // 按钮组件
  const Button = ({ text, color = 'dark', onClick, wide = false, active = false }: any) => {
    // macOS 颜色规范
    const baseColor = color === 'orange' 
      ? (active ? 'bg-[#f39506] text-white' : 'bg-[#ff9f0a] text-white')
      : color === 'light' 
        ? 'bg-[#a5a5a5] active:bg-[#d4d4d2] text-black' 
        : 'bg-[#333333] active:bg-[#737373] text-white'

    // 选中状态 (比如按下了 + 号，+ 号应该保持高亮)
    const activeState = (active && color === 'orange') ? 'brightness-125 border border-black/10' : ''

    return (
      <button
        onClick={onClick}
        className={clsx(
          "h-14 text-2xl font-normal rounded-full transition-all duration-100 flex items-center justify-center select-none active:scale-95",
          baseColor,
          activeState,
          wide ? "col-span-2 items-center pl-7 justify-start aspect-[2.1/1]" : "aspect-square"
        )}
      >
        {text}
      </button>
    )
  }

  return (
    <div className="h-full w-full bg-black flex flex-col p-4 select-none">
      {/* 显示区域 */}
      <div className="flex-1 flex flex-col items-end justify-end px-2 pb-4 space-y-1">
        
        {/* Expression Display (算式过程: 1 + ) */}
        <div className="h-6 text-lg text-gray-400 font-medium tracking-wide opacity-80 min-h-[1.5rem]">
          {history}
        </div>
        
        {/* Result Display (当前输入/结果: 1) */}
        <div className="text-6xl font-light text-white tracking-tight overflow-hidden whitespace-nowrap w-full text-right">
          {formatNumber(current)}
        </div>
      </div>

      {/* 键盘区域 */}
      <div className="grid grid-cols-4 gap-3">
        <Button text={current === '0' ? 'AC' : 'C'} color="light" onClick={current === '0' ? reset : backspace} />
        <Button text="+/-" color="light" onClick={toggleSign} />
        <Button text="%" color="light" onClick={percent} />
        <Button text="÷" color="orange" active={operator === '÷'} onClick={() => performOperation('÷')} />

        <Button text="7" onClick={() => inputDigit('7')} />
        <Button text="8" onClick={() => inputDigit('8')} />
        <Button text="9" onClick={() => inputDigit('9')} />
        <Button text="×" color="orange" active={operator === '×'} onClick={() => performOperation('×')} />

        <Button text="4" onClick={() => inputDigit('4')} />
        <Button text="5" onClick={() => inputDigit('5')} />
        <Button text="6" onClick={() => inputDigit('6')} />
        <Button text="-" color="orange" active={operator === '-'} onClick={() => performOperation('-')} />

        <Button text="1" onClick={() => inputDigit('1')} />
        <Button text="2" onClick={() => inputDigit('2')} />
        <Button text="3" onClick={() => inputDigit('3')} />
        <Button text="+" color="orange" active={operator === '+'} onClick={() => performOperation('+')} />

        <Button text="0" wide onClick={() => inputDigit('0')} />
        <Button text="." onClick={inputDot} />
        <Button text="=" color="orange" onClick={handleEqual} />
      </div>
    </div>
  )
}