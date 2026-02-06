import { memo } from 'react'
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck.js'

export const Card = memo(function Card({ card, faceDown = false, flipped = false, size = 'normal' }) {
  const sizeClasses = {
    small: 'w-12 h-18 text-sm',
    normal: 'w-16 h-24 text-lg',
    large: 'w-20 h-30 text-xl',
  }

  const baseClasses = `${sizeClasses[size]} rounded-lg border-2 flex flex-col items-center justify-center font-bold shadow-md`

  // Simple face-down card (no flip animation)
  if (faceDown) {
    return (
      <div className={`${baseClasses} bg-blue-800 border-blue-600 text-blue-400`}>
        <div className="text-2xl opacity-50">?</div>
      </div>
    )
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit]
  const colorClass = SUIT_COLORS[card.suit]

  // Card with flip animation support
  return (
    <div className={`card-container ${sizeClasses[size]}`}>
      <div className={`card-flipper ${flipped ? 'flipped' : ''}`}>
        {/* Back of card */}
        <div className={`card-back ${baseClasses} bg-blue-800 border-blue-600 text-blue-400`}>
          <div className="text-2xl opacity-50">?</div>
        </div>
        {/* Front of card */}
        <div className={`card-front ${baseClasses} bg-white border-slate-300`}>
          <div className={`${colorClass} leading-none`}>{card.rank}</div>
          <div className={`${colorClass} text-2xl leading-none`}>{suitSymbol}</div>
        </div>
      </div>
    </div>
  )
})

export function CardPlaceholder({ size = 'normal' }) {
  const sizeClasses = {
    small: 'w-12 h-18',
    normal: 'w-16 h-24',
    large: 'w-20 h-30',
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50`} />
  )
}
