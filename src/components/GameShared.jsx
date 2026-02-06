import { Card, CardPlaceholder } from './Card.jsx'
import { findBestHand, compareHands, evaluatePartialHand } from '../utils/handEvaluator.js'

export const PLAYER_HAND_SIZE = 5
export const DEALER_HAND_SIZE = 8

export function getHandStrength(cards) {
  if (cards.length === 0) return null
  return evaluatePartialHand(cards)
}

export function computeShowdownResult(playerHand, dealerHand) {
  const playerBest = findBestHand(playerHand)
  const dealerBest = findBestHand(dealerHand)
  const comparison = compareHands(playerBest.evaluation, dealerBest.evaluation)
  const winner = comparison > 0 ? 'player' : comparison < 0 ? 'dealer' : 'tie'
  return {
    playerEval: playerBest.evaluation,
    dealerEval: dealerBest.evaluation,
    playerBestCards: playerBest.cards,
    dealerBestCards: dealerBest.cards,
    winner,
  }
}

export function GameButton({ children, onClick, variant = 'primary', disabled = false, size = 'normal' }) {
  const baseClasses = 'font-serif rounded-lg transition-all duration-200 border-2'
  const sizeClasses = {
    small: 'py-1 px-3 text-sm',
    normal: 'py-3 px-6 text-lg',
  }
  const variants = {
    primary: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-amber-100 hover:scale-105',
    secondary: 'bg-amber-700 hover:bg-amber-600 border-amber-500 text-amber-100 hover:scale-105',
    back: 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-200 hover:scale-105',
  }
  const disabledClasses = 'opacity-50 cursor-not-allowed hover:scale-100'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${disabled ? disabledClasses : ''}`}
    >
      {children}
    </button>
  )
}

export function HandDisplay({ cards, title, faceDown = false, highlightCards = null, handStrength = null, animateIndex = -1 }) {
  const placeholders = Array(5).fill(null)

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-lg font-serif text-slate-300">{title}</h3>
      <div className="flex gap-1 sm:gap-2">
        {placeholders.map((_, i) => {
          const card = cards[i]
          const isHighlighted = highlightCards && card && highlightCards.some(
            h => h.rank === card.rank && h.suit === card.suit
          )
          const shouldAnimate = i === animateIndex
          return (
            <div
              key={i}
              className={`${isHighlighted ? 'ring-2 ring-amber-400 rounded-lg' : ''} ${shouldAnimate ? 'animate-deal-to-player' : ''}`}
            >
              {card ? (
                <Card card={card} faceDown={faceDown} />
              ) : (
                <CardPlaceholder />
              )}
            </div>
          )
        })}
      </div>
      {handStrength && (
        <p className="text-amber-200 text-sm font-serif">{handStrength}</p>
      )}
    </div>
  )
}

export function DealerHandDisplay({ cards, faceDown = false, bestHandCards, handStrength = null, animateIndex = -1 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-lg font-serif text-slate-300">Dealer's Hand ({cards.length}/{DEALER_HAND_SIZE})</h3>
      <div className="flex gap-1 flex-wrap justify-center max-w-[280px] sm:max-w-xs min-h-[2.5rem]">
        {cards.map((card, i) => {
          const isHighlighted = bestHandCards && bestHandCards.some(
            h => h.rank === card.rank && h.suit === card.suit
          )
          const shouldAnimate = i === animateIndex
          return (
            <div
              key={i}
              className={`${isHighlighted ? 'ring-2 ring-amber-400 rounded-lg' : 'opacity-60'} ${shouldAnimate ? 'animate-deal-to-dealer' : ''}`}
            >
              <Card card={card} faceDown={faceDown} size="small" />
            </div>
          )
        })}
      </div>
      {handStrength && (
        <p className="text-amber-200 text-sm font-serif">{handStrength}</p>
      )}
    </div>
  )
}

export function ShowdownResult({ playerEval, dealerEval, winner }) {
  const resultText = winner === 'player' ? 'You Win!' : winner === 'dealer' ? 'Dealer Wins' : 'Tie'
  const resultColor = winner === 'player' ? 'text-emerald-400' : winner === 'dealer' ? 'text-red-400' : 'text-amber-400'

  return (
    <div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-slate-800/50 rounded-xl border border-slate-600 animate-deal">
      <h2 className={`text-3xl font-serif ${resultColor}`}>{resultText}</h2>
      <div className="flex gap-4 sm:gap-8 text-center">
        <div>
          <p className="text-slate-400 text-sm">Your Hand</p>
          <p className="text-amber-100 text-lg font-serif">{playerEval.name}</p>
        </div>
        <div className="border-l border-slate-600" />
        <div>
          <p className="text-slate-400 text-sm">Dealer's Hand</p>
          <p className="text-amber-100 text-lg font-serif">{dealerEval.name}</p>
        </div>
      </div>
    </div>
  )
}
