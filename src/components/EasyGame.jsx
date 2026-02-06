import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createDeck } from '../utils/deck.js'
import { findBestHand, compareHands, evaluatePartialHand } from '../utils/handEvaluator.js'
import { Card, CardPlaceholder } from './Card.jsx'
import { Hint, HintWrapper } from './Hint.jsx'

const NUX_STORAGE_KEY = 'easyNuxStep'
const NUX_COMPLETE = -1

function getHandStrength(cards) {
  if (cards.length === 0) return null
  return evaluatePartialHand(cards)
}

const GAME_PHASES = {
  DRAFTING: 'drafting',
  DEALING_SHOWDOWN: 'dealingShowdown',
  SHOWDOWN: 'showdown',
}

const PLAYER_HAND_SIZE = 5
const DEALER_HAND_SIZE = 8
const DEAL_DELAY = 200

function GameButton({ children, onClick, variant = 'primary', disabled = false }) {
  const baseClasses = 'py-3 px-6 text-lg font-serif rounded-lg transition-all duration-200 border-2'
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
      className={`${baseClasses} ${variants[variant]} ${disabled ? disabledClasses : ''}`}
    >
      {children}
    </button>
  )
}

function HandDisplay({ cards, title, faceDown = false, highlightCards = null, handStrength = null, animateIndex = -1 }) {
  const placeholders = Array(5).fill(null)

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-lg font-serif text-slate-300">{title}</h3>
      <div className="flex gap-2">
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
                <Card card={card} faceDown={faceDown} flipped={!faceDown} />
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

function DealerHandDisplay({ cards, faceDown, bestHandCards, handStrength = null, animateIndex = -1 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-lg font-serif text-slate-300">Dealer's Hand ({cards.length}/{DEALER_HAND_SIZE})</h3>
      <div className="flex gap-1 flex-wrap justify-center max-w-xs min-h-[2.5rem]">
        {cards.map((card, i) => {
          const isHighlighted = !faceDown && bestHandCards && bestHandCards.some(
            h => h.rank === card.rank && h.suit === card.suit
          )
          const shouldAnimate = i === animateIndex
          return (
            <div
              key={i}
              className={`${isHighlighted ? 'ring-2 ring-amber-400 rounded-lg' : 'opacity-60'} ${shouldAnimate ? 'animate-deal-to-dealer' : ''}`}
            >
              <Card card={card} faceDown={faceDown} flipped={!faceDown} size="small" />
            </div>
          )
        })}
      </div>
      {handStrength && (
        <p className="text-amber-200 text-sm font-serif">{handStrength}</p>
      )}
      {!handStrength && cards.length > 0 && cards.length < 5 && (
        <p className="text-slate-500 text-sm">({cards.length} cards)</p>
      )}
    </div>
  )
}

function CurrentCardDisplay({ card, animating }) {
  const [flipped, setFlipped] = useState(false)
  const cardKey = card ? `${card.rank}-${card.suit}` : null

  useEffect(() => {
    if (!card) return
    setFlipped(false)
    const timer = setTimeout(() => setFlipped(true), 150)
    return () => clearTimeout(timer)
  }, [cardKey])

  if (!card) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xl font-serif text-amber-100">Current Card</h3>
      <div className={animating ? 'animate-deal' : ''} key={cardKey}>
        <Card card={card} size="large" flipped={flipped} />
      </div>
    </div>
  )
}

function ShowdownResult({ playerEval, dealerEval, winner }) {
  const resultText = winner === 'player' ? 'You Win!' : winner === 'dealer' ? 'Dealer Wins' : 'Tie'
  const resultColor = winner === 'player' ? 'text-emerald-400' : winner === 'dealer' ? 'text-red-400' : 'text-amber-400'

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-600 animate-deal">
      <h2 className={`text-3xl font-serif ${resultColor}`}>{resultText}</h2>
      <div className="flex gap-8 text-center">
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

export function EasyGame({ onNavigate, backScreen }) {
  const [deck, setDeck] = useState(() => createDeck())
  const [deckIndex, setDeckIndex] = useState(0)
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [phase, setPhase] = useState(GAME_PHASES.DRAFTING)
  const [showdownResult, setShowdownResult] = useState(null)

  const [playerAnimateIndex, setPlayerAnimateIndex] = useState(-1)
  const [dealerAnimateIndex, setDealerAnimateIndex] = useState(-1)
  const [cardAnimating, setCardAnimating] = useState(true)

  const showdownDataRef = useRef(null)

  // NUX Tutorial State
  const [nuxStep, setNuxStep] = useState(() => {
    const stored = localStorage.getItem(NUX_STORAGE_KEY)
    return stored !== null ? parseInt(stored, 10) : 0
  })

  const advanceNux = useCallback((toStep) => {
    if (nuxStep === NUX_COMPLETE) return
    setNuxStep(toStep)
    if (toStep === NUX_COMPLETE) {
      localStorage.setItem(NUX_STORAGE_KEY, NUX_COMPLETE.toString())
    }
  }, [nuxStep])

  // Track if user has taken or passed for NUX progression
  const hasTakenRef = useRef(false)
  const hasPassedRef = useRef(false)

  const currentCard = phase === GAME_PHASES.DRAFTING && deckIndex < deck.length ? deck[deckIndex] : null
  const isDrafting = phase === GAME_PHASES.DRAFTING
  const playerNeedsCards = playerHand.length < PLAYER_HAND_SIZE

  const playerHandStrength = useMemo(() => getHandStrength(playerHand), [playerHand])
  const dealerHandStrength = useMemo(() => getHandStrength(dealerHand), [dealerHand])

  const handleTake = useCallback(() => {
    if (!currentCard || !playerNeedsCards) return

    setPlayerAnimateIndex(playerHand.length)
    setPlayerHand(prev => [...prev, currentCard])
    setDeckIndex(prev => prev + 1)
    setCardAnimating(true)

    setTimeout(() => setPlayerAnimateIndex(-1), 400)

    // NUX: After first take, show player hand hint
    if (!hasTakenRef.current && nuxStep === 0) {
      hasTakenRef.current = true
      setTimeout(() => advanceNux(1), 500)
    }
  }, [currentCard, playerNeedsCards, playerHand.length, nuxStep, advanceNux])

  const handlePass = useCallback(() => {
    if (!currentCard) return

    setDealerAnimateIndex(dealerHand.length)
    setDealerHand(prev => [...prev, currentCard])
    setDeckIndex(prev => prev + 1)
    setCardAnimating(true)

    setTimeout(() => setDealerAnimateIndex(-1), 400)

    // NUX: After first pass, show dealer hand hint
    if (!hasPassedRef.current && (nuxStep === 0 || nuxStep === 1)) {
      hasPassedRef.current = true
      setTimeout(() => advanceNux(2), 500)
    }
  }, [currentCard, dealerHand.length, nuxStep, advanceNux])

  const draftingComplete = playerHand.length === PLAYER_HAND_SIZE

  const handleShowdown = useCallback(() => {
    const cardsNeeded = DEALER_HAND_SIZE - dealerHand.length
    const cardsToAdd = []
    let idx = deckIndex

    for (let i = 0; i < cardsNeeded && idx < deck.length; i++) {
      cardsToAdd.push(deck[idx])
      idx++
    }

    showdownDataRef.current = {
      cardsToAdd,
      finalDeckIndex: idx,
      startDealerCount: dealerHand.length,
    }

    setPhase(GAME_PHASES.DEALING_SHOWDOWN)
  }, [dealerHand.length, deckIndex, deck])

  // Handle showdown dealing animation
  useEffect(() => {
    if (phase !== GAME_PHASES.DEALING_SHOWDOWN || !showdownDataRef.current) return

    const { cardsToAdd, finalDeckIndex, startDealerCount } = showdownDataRef.current
    const currentAddedCount = dealerHand.length - startDealerCount

    if (currentAddedCount < cardsToAdd.length) {
      const timer = setTimeout(() => {
        const nextCard = cardsToAdd[currentAddedCount]
        setDealerAnimateIndex(dealerHand.length)
        setDealerHand(prev => [...prev, nextCard])
        setTimeout(() => setDealerAnimateIndex(-1), 400)
      }, DEAL_DELAY)
      return () => clearTimeout(timer)
    } else {
      // All cards dealt, show result
      setDeckIndex(finalDeckIndex)

      const finalDealerHand = [...dealerHand]
      const playerBest = findBestHand(playerHand)
      const dealerBest = findBestHand(finalDealerHand)

      const comparison = compareHands(playerBest.evaluation, dealerBest.evaluation)
      const winner = comparison > 0 ? 'player' : comparison < 0 ? 'dealer' : 'tie'

      setShowdownResult({
        playerEval: playerBest.evaluation,
        dealerEval: dealerBest.evaluation,
        playerBestCards: playerBest.cards,
        dealerBestCards: dealerBest.cards,
        winner,
      })

      setPhase(GAME_PHASES.SHOWDOWN)
      showdownDataRef.current = null
    }
  }, [phase, dealerHand, playerHand])

  const handlePlayAgain = useCallback(() => {
    const newDeck = createDeck()
    setDeck(newDeck)
    setDeckIndex(0)
    setPlayerHand([])
    setDealerHand([])
    setPhase(GAME_PHASES.DRAFTING)
    setShowdownResult(null)
    setPlayerAnimateIndex(-1)
    setDealerAnimateIndex(-1)
    setCardAnimating(true)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 p-4 min-h-screen">
      <h1 className="text-3xl font-serif text-amber-100">Easy Mode</h1>

      {/* Dealer's Hand */}
      <HintWrapper show={nuxStep === 2} pulse>
        <div className="relative">
          <DealerHandDisplay
            cards={dealerHand}
            faceDown={false}
            bestHandCards={showdownResult?.dealerBestCards}
            handStrength={dealerHandStrength}
            animateIndex={dealerAnimateIndex}
          />
          <Hint
            show={nuxStep === 2}
            position="bottom"
            onDismiss={() => advanceNux(3)}
          >
            Passed cards go here. Dealer picks their best 5 from 8.
          </Hint>
        </div>
      </HintWrapper>

      {/* Current Card / Showdown Result */}
      <div className="min-h-40 flex items-center justify-center">
        {isDrafting && currentCard && (
          <HintWrapper show={nuxStep === 0} pulse>
            <CurrentCardDisplay card={currentCard} animating={cardAnimating} />
            <Hint
              show={nuxStep === 0}
              position="bottom"
              onDismiss={() => advanceNux(NUX_COMPLETE)}
            >
              Take cards for your hand (5 max) or pass them to the dealer (gets 8).
            </Hint>
          </HintWrapper>
        )}
        {isDrafting && draftingComplete && (
          <HintWrapper show={nuxStep === 3} pulse>
            <div className="text-center relative">
              <p className="text-amber-100 text-lg mb-4">Your hand is complete!</p>
              <GameButton onClick={() => {
                handleShowdown()
                if (nuxStep === 3) advanceNux(NUX_COMPLETE)
              }}>Showdown</GameButton>
              <Hint
                show={nuxStep === 3}
                position="top"
                onDismiss={() => advanceNux(NUX_COMPLETE)}
              >
                Ready? Compare your best hand against the dealer's.
              </Hint>
            </div>
          </HintWrapper>
        )}
        {phase === GAME_PHASES.DEALING_SHOWDOWN && (
          <div className="text-center">
            <p className="text-amber-100 text-lg">Dealing to dealer...</p>
          </div>
        )}
        {phase === GAME_PHASES.SHOWDOWN && showdownResult && (
          <ShowdownResult
            playerEval={showdownResult.playerEval}
            dealerEval={showdownResult.dealerEval}
            winner={showdownResult.winner}
          />
        )}
      </div>

      {/* Action Buttons */}
      {isDrafting && currentCard && playerNeedsCards && (
        <div className="flex gap-4">
          <GameButton onClick={handleTake} variant="primary">
            Take
          </GameButton>
          <GameButton onClick={handlePass} variant="secondary">
            Pass
          </GameButton>
        </div>
      )}

      {phase === GAME_PHASES.SHOWDOWN && (
        <div className="flex gap-4">
          <GameButton onClick={handlePlayAgain} variant="primary">
            Play Again
          </GameButton>
        </div>
      )}

      {/* Player's Hand */}
      <HintWrapper show={nuxStep === 1} pulse>
        <div className="relative">
          <HandDisplay
            cards={playerHand}
            title="Your Hand"
            highlightCards={showdownResult?.playerBestCards}
            handStrength={playerHandStrength}
            animateIndex={playerAnimateIndex}
          />
          <Hint
            show={nuxStep === 1}
            position="top"
            onDismiss={() => advanceNux(2)}
          >
            Your hand! Build the best 5-card poker hand you can.
          </Hint>
        </div>
      </HintWrapper>

      {/* Status */}
      <div className="text-slate-500 text-sm">
        {(isDrafting || phase === GAME_PHASES.DEALING_SHOWDOWN) && (
          <p>Cards in hand: {playerHand.length}/{PLAYER_HAND_SIZE} | Dealer: {dealerHand.length} cards</p>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-4">
        <GameButton onClick={() => onNavigate(backScreen)} variant="back">
          Back to Menu
        </GameButton>
      </div>
    </div>
  )
}
