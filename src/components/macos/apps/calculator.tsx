// components/macos/apps/calculator.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from '../utils'

// 辅助函数：格式化数字显示
const formatNumber = (num: string) => {
  if (!num) return '0'
  const n = parseFloat(num)
  if (isNaN(n)) return 'Error'
  if (num.length > 9 || n > 999999999) {
    return n.toExponential(4)
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(n)
}

export const Calculator = () => {
  const [current, setCurrent] = useState('0')
  const [prev, setPrev] = useState<string | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [isNewInput, setIsNewInput] = useState(false)
  const [history, setHistory] = useState('')

  const inputDigit = useCallback((digit: string) => {
    if (isNewInput) {
      setCurrent(digit)
      setIsNewInput(false)
    } else {
      setCurrent(current === '0' ? digit : current + digit)
    }
  }, [current, isNewInput])

  const inputDot = useCallback(() => {
    if (isNewInput) {
      setCurrent('0.')
      setIsNewInput(false)
    } else if (!current.includes('.')) {
      setCurrent(current + '.')
    }
  }, [current, isNewInput])

  const calculate = (left: number, right: number, op: string) => {
    switch (op) {
      case '+': return left + right
      case '-': return left - right
      case '×': 
      case '*': return left * right
      case '÷': 
      case '/': return left / right
      default: return right
    }
  }

  const performOperation = useCallback((nextOperator: string) => {
    const inputValue = parseFloat(current)

    if (prev === null) {
      setPrev(current)
      setHistory(`${current} ${nextOperator}`)
    } else if (operator) {
      const prevValue = parseFloat(prev)
      if (isNewInput) {
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
  }, [current, prev, operator, isNewInput])

  const handleEqual = useCallback(() => {
    if (!operator || prev === null) return
    const inputValue = parseFloat(current)
    const prevValue = parseFloat(prev)
    const result = calculate(prevValue, inputValue, operator)
    setHistory(`${prev} ${operator} ${current} =`)
    setCurrent(String(result))
    setPrev(null)
    setOperator(null)
    setIsNewInput(true)
  }, [current, operator, prev])

  const reset = useCallback(() => {
    setCurrent('0')
    setPrev(null)
    setOperator(null)
    setHistory('')
    setIsNewInput(false)
  }, [])

  const backspace = useCallback(() => {
    if (isNewInput) return
    if (current.length === 1) setCurrent('0')
    else setCurrent(current.slice(0, -1))
  }, [current, isNewInput])

  const toggleSign = () => setCurrent(String(parseFloat(current) * -1))
  const percent = () => setCurrent(String(parseFloat(current) / 100))

  // Keyboard Support
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (/[0-9]/.test(e.key)) inputDigit(e.key)
          if (e.key === '.') inputDot()
          if (['+', '-', '*', '/'].includes(e.key)) {
              let op = e.key
              if (op === '*') op = '×'
              if (op === '/') op = '÷'
              performOperation(op)
          }
          if (e.key === 'Enter' || e.key === '=') handleEqual()
          if (e.key === 'Backspace') backspace()
          if (e.key === 'Escape') reset()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputDigit, inputDot, performOperation, handleEqual, backspace, reset])

  const Button = ({ text, color = 'dark', onClick, wide = false, active = false }: any) => {
    const baseColor = color === 'orange' 
      ? (active ? 'bg-[#f39506] text-white' : 'bg-[#ff9f0a] text-white')
      : color === 'light' 
        ? 'bg-[#a5a5a5] active:bg-[#d4d4d2] text-black' 
        : 'bg-[#333333] active:bg-[#737373] text-white'

    return (
      <button
        onClick={onClick}
        className={clsx(
          "h-14 text-2xl font-normal rounded-full transition-all duration-100 flex items-center justify-center select-none active:scale-95",
          baseColor,
          (active && color === 'orange') ? 'brightness-125 border border-black/10' : '',
          wide ? "col-span-2 items-center pl-7 justify-start aspect-[2.1/1]" : "aspect-square"
        )}
      >
        {text}
      </button>
    )
  }

  return (
    <div className="h-full w-full bg-black flex flex-col p-4 select-none">
      <div className="flex-1 flex flex-col items-end justify-end px-2 pb-4 space-y-1">
        <div className="h-6 text-lg text-gray-400 font-medium tracking-wide opacity-80 min-h-[1.5rem]">{history}</div>
        <div className="text-6xl font-light text-white tracking-tight overflow-hidden whitespace-nowrap w-full text-right">{formatNumber(current)}</div>
      </div>
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