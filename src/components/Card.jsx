import { memo } from 'react'
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck.js'

export const Card = memo(function Card({ card, faceDown = false, size = 'normal' }) {
  const sizeClasses = {
    small: 'w-8 h-12 text-[10px] sm:w-12 sm:h-18 sm:text-sm',
    normal: 'w-12 h-18 text-sm sm:w-16 sm:h-24 sm:text-lg',
    large: 'w-16 h-24 text-lg sm:w-20 sm:h-30 sm:text-xl',
  }

  const suitSizeClasses = {
    small: 'text-base sm:text-2xl',
    normal: 'text-xl sm:text-2xl',
    large: 'text-2xl sm:text-2xl',
  }

  const baseClasses = `${sizeClasses[size]} rounded-lg border-2 flex flex-col items-center justify-center font-bold shadow-md`

  if (faceDown) {
    return (
      <div className={`${baseClasses} bg-blue-800 border-blue-600 text-blue-400`}>
        <div className="text-xl sm:text-2xl opacity-50">?</div>
      </div>
    )
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit]
  const colorClass = SUIT_COLORS[card.suit]

  return (
    <div className={`${baseClasses} bg-white border-slate-300`}>
      <div className={`${colorClass} leading-none`}>{card.rank}</div>
      <div className={`${colorClass} ${suitSizeClasses[size]} leading-none`}>{suitSymbol}</div>
    </div>
  )
})

export function CardPlaceholder({ size = 'normal' }) {
  const sizeClasses = {
    small: 'w-8 h-12 sm:w-12 sm:h-18',
    normal: 'w-12 h-18 sm:w-16 sm:h-24',
    large: 'w-16 h-24 sm:w-20 sm:h-30',
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50`} />
  )
}
