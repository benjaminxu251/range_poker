import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createDeck, RANKS, SUITS, SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck.js'
import { findBestHand, compareHands, evaluatePartialHand } from '../utils/handEvaluator.js'
import { Card, CardPlaceholder } from './Card.jsx'
import { Hint, HintWrapper } from './Hint.jsx'

const NUX_STORAGE_KEY = 'hardNuxStep'
const NUX_COMPLETE = -1

const GAME_PHASES = {
  SELECTING: 'selecting',
  DEALING: 'dealing',
  DEALING_SHOWDOWN: 'dealingShowdown',
  SHOWDOWN: 'showdown',
}

const PLAYER_HAND_SIZE = 5
const DEALER_HAND_SIZE = 8
const DEAL_DELAY = 150

function getHandStrength(cards) {
  if (cards.length === 0) return null
  return evaluatePartialHand(cards)
}

function GameButton({ children, onClick, variant = 'primary', disabled = false, size = 'normal' }) {
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

function RangeSelector({ selectedCards, onSelectionChange, usedCards }) {
  const cardKey = (rank, suit) => `${rank}-${suit}`
  const isSelected = (rank, suit) => selectedCards.has(cardKey(rank, suit))
  const isUsed = (rank, suit) => usedCards.has(cardKey(rank, suit))

  const toggleCard = (rank, suit) => {
    if (isUsed(rank, suit)) return
    const key = cardKey(rank, suit)
    const newSelection = new Set(selectedCards)
    if (newSelection.has(key)) {
      newSelection.delete(key)
    } else {
      newSelection.add(key)
    }
    onSelectionChange(newSelection)
  }

  const toggleRank = (rank) => {
    const newSelection = new Set(selectedCards)
    const allSelected = SUITS.every(suit => isUsed(rank, suit) || isSelected(rank, suit))
    SUITS.forEach(suit => {
      if (isUsed(rank, suit)) return
      const key = cardKey(rank, suit)
      if (allSelected) {
        newSelection.delete(key)
      } else {
        newSelection.add(key)
      }
    })
    onSelectionChange(newSelection)
  }

  const toggleSuit = (suit) => {
    const newSelection = new Set(selectedCards)
    const allSelected = RANKS.every(rank => isUsed(rank, suit) || isSelected(rank, suit))
    RANKS.forEach(rank => {
      if (isUsed(rank, suit)) return
      const key = cardKey(rank, suit)
      if (allSelected) {
        newSelection.delete(key)
      } else {
        newSelection.add(key)
      }
    })
    onSelectionChange(newSelection)
  }

  const clearAll = () => onSelectionChange(new Set())

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-600">
      <div className="flex gap-0.5 ml-10">
        {RANKS.map(rank => (
          <button
            key={rank}
            onClick={() => toggleRank(rank)}
            className="w-7 h-6 text-xs font-bold text-slate-400 hover:text-amber-200 hover:bg-slate-700 rounded transition-colors"
          >
            {rank}
          </button>
        ))}
      </div>

      {SUITS.map(suit => (
        <div key={suit} className="flex gap-0.5 items-center">
          <button
            onClick={() => toggleSuit(suit)}
            className={`w-9 h-8 text-lg rounded hover:bg-slate-700 transition-colors ${SUIT_COLORS[suit]}`}
          >
            {SUIT_SYMBOLS[suit]}
          </button>
          {RANKS.map(rank => {
            const used = isUsed(rank, suit)
            const selected = isSelected(rank, suit)
            return (
              <button
                key={`${rank}-${suit}`}
                onClick={() => toggleCard(rank, suit)}
                disabled={used}
                className={`w-7 h-8 text-xs font-bold rounded border transition-all ${
                  used
                    ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'
                    : selected
                      ? 'bg-amber-600 border-amber-400 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {rank}
              </button>
            )
          })}
        </div>
      ))}

      <div className="flex justify-between items-center mt-1">
        <button
          onClick={clearAll}
          className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-slate-400"
        >
          Clear
        </button>
        <div className="text-right">
          <p className="text-slate-400 text-xs">
            Selected: <span className="text-amber-200 font-bold">{selectedCards.size}</span>
          </p>
          {selectedCards.size > 0 && (
            <p className="text-slate-500 text-xs">
              ~{((52 - usedCards.size) / selectedCards.size).toFixed(1)} cards/match
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DealingDisplay({ revealedCards, currentCard, matchedCard, animatingIndex }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-lg font-serif text-slate-300">Dealing...</h3>
      <div className="flex gap-1 flex-wrap justify-center max-w-md min-h-[2.5rem]">
        {revealedCards.map((card, i) => (
          <div
            key={i}
            className={`opacity-50 ${i === animatingIndex ? 'animate-deal' : ''}`}
          >
            <Card card={card} size="small" />
          </div>
        ))}
        {currentCard && !matchedCard && (
          <div className="animate-deal">
            <Card card={currentCard} size="small" />
          </div>
        )}
        {matchedCard && (
          <div className="ring-2 ring-emerald-400 rounded-lg animate-deal">
            <Card card={matchedCard} size="small" />
          </div>
        )}
      </div>
    </div>
  )
}

function HandDisplay({ cards, title, highlightCards = null, handStrength = null, animateIndex = -1 }) {
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
              {card ? <Card card={card} /> : <CardPlaceholder />}
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

function DealerHandDisplay({ cards, bestHandCards, handStrength = null, animateIndex = -1 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-lg font-serif text-slate-300">Dealer's Hand ({cards.length}/{DEALER_HAND_SIZE})</h3>
      <div className="flex gap-1 flex-wrap justify-center max-w-xs min-h-[2.5rem]">
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
              <Card card={card} size="small" />
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

export function HardGame({ onNavigate, backScreen }) {
  const [deck, setDeck] = useState(() => createDeck())
  const [deckIndex, setDeckIndex] = useState(0)
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [phase, setPhase] = useState(GAME_PHASES.SELECTING)
  const [showdownResult, setShowdownResult] = useState(null)

  const [selectedCards, setSelectedCards] = useState(new Set())
  const [revealedCards, setRevealedCards] = useState([])
  const [currentDealCard, setCurrentDealCard] = useState(null)
  const [matchedCard, setMatchedCard] = useState(null)
  const [dealAnimatingIndex, setDealAnimatingIndex] = useState(-1)

  const [playerAnimateIndex, setPlayerAnimateIndex] = useState(-1)
  const [dealerAnimateIndex, setDealerAnimateIndex] = useState(-1)

  const dealingRef = useRef(null)
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

  const hasDealtRef = useRef(false)

  const usedCards = useMemo(() => {
    const used = new Set()
    for (let i = 0; i < deckIndex; i++) {
      const card = deck[i]
      used.add(`${card.rank}-${card.suit}`)
    }
    return used
  }, [deck, deckIndex])

  const playerHandStrength = useMemo(() => getHandStrength(playerHand), [playerHand])
  const dealerHandStrength = useMemo(() => getHandStrength(dealerHand), [dealerHand])

  const cardMatches = useCallback((card) => {
    return selectedCards.has(`${card.rank}-${card.suit}`)
  }, [selectedCards])

  const handleDeal = useCallback(() => {
    if (selectedCards.size === 0) return

    // Find all cards until match
    let idx = deckIndex
    const revealed = []
    let matched = null

    while (idx < deck.length) {
      const card = deck[idx]
      idx++
      if (cardMatches(card)) {
        matched = card
        break
      } else {
        revealed.push(card)
      }
    }

    dealingRef.current = {
      cardsToReveal: revealed,
      matchedCard: matched,
      finalDeckIndex: idx,
      revealedCount: 0,
    }

    setPhase(GAME_PHASES.DEALING)
    setRevealedCards([])
    setCurrentDealCard(null)
    setMatchedCard(null)
    setSelectedCards(new Set())
  }, [selectedCards, deck, deckIndex, cardMatches])

  // Animate dealing one card at a time
  useEffect(() => {
    if (phase !== GAME_PHASES.DEALING || !dealingRef.current) return

    const dealing = dealingRef.current
    const { cardsToReveal, matchedCard: matched, finalDeckIndex, revealedCount } = dealing

    if (revealedCount < cardsToReveal.length) {
      // Reveal next card to dealer
      const timer = setTimeout(() => {
        const nextCard = cardsToReveal[revealedCount]
        setCurrentDealCard(nextCard)

        setTimeout(() => {
          setRevealedCards(prev => [...prev, nextCard])
          setCurrentDealCard(null)
          setDealAnimatingIndex(revealedCount)
          setTimeout(() => setDealAnimatingIndex(-1), 300)
          dealing.revealedCount++
        }, 150)
      }, DEAL_DELAY)
      return () => clearTimeout(timer)
    } else if (matched && !dealing.processed) {
      dealing.processed = true
      // Show matched card
      const timer = setTimeout(() => {
        setMatchedCard(matched)

        setTimeout(() => {
          // Move cards to hands
          setPlayerAnimateIndex(playerHand.length)
          setPlayerHand(prev => [...prev, matched])

          const newDealerCards = [...cardsToReveal]
          setDealerHand(prev => [...prev, ...newDealerCards])
          setDealerAnimateIndex(dealerHand.length + newDealerCards.length - 1)

          setDeckIndex(finalDeckIndex)

          setTimeout(() => {
            setPlayerAnimateIndex(-1)
            setDealerAnimateIndex(-1)
            setPhase(GAME_PHASES.SELECTING)
            setRevealedCards([])
            setMatchedCard(null)
            dealingRef.current = null
          }, 400)
        }, 500)
      }, DEAL_DELAY)
      return () => clearTimeout(timer)
    } else {
      // No match - deck exhausted
      const timer = setTimeout(() => {
        setDealerHand(prev => [...prev, ...cardsToReveal])
        setDeckIndex(finalDeckIndex)

        setTimeout(() => {
          setPhase(GAME_PHASES.SELECTING)
          setRevealedCards([])
          dealingRef.current = null
        }, 500)
      }, DEAL_DELAY)
      return () => clearTimeout(timer)
    }
  }, [phase, revealedCards, playerHand.length, dealerHand.length])

  const playerNeedsCards = playerHand.length < PLAYER_HAND_SIZE
  const canDeal = selectedCards.size > 0 && playerNeedsCards && deckIndex < deck.length
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
    setPhase(GAME_PHASES.SELECTING)
    setShowdownResult(null)
    setSelectedCards(new Set())
    setRevealedCards([])
    setCurrentDealCard(null)
    setMatchedCard(null)
    setPlayerAnimateIndex(-1)
    setDealerAnimateIndex(-1)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-screen">
      <h1 className="text-3xl font-serif text-amber-100">Hard Mode</h1>

      <DealerHandDisplay
        cards={dealerHand}
        bestHandCards={showdownResult?.dealerBestCards}
        handStrength={dealerHandStrength}
        animateIndex={dealerAnimateIndex}
      />

      <div className="min-h-48 flex items-center justify-center">
        {phase === GAME_PHASES.SELECTING && !draftingComplete && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-amber-100 text-lg">Select cards to stop on:</p>
            <HintWrapper show={nuxStep === 0} pulse>
              <div className="relative">
                <RangeSelector
                  selectedCards={selectedCards}
                  onSelectionChange={(cards) => {
                    setSelectedCards(cards)
                    // NUX: After first selection, show stats hint
                    if (nuxStep === 0 && cards.size > 0) {
                      setTimeout(() => advanceNux(1), 300)
                    }
                  }}
                  usedCards={usedCards}
                />
                <Hint
                  show={nuxStep === 0}
                  position="right"
                  onDismiss={() => advanceNux(NUX_COMPLETE)}
                >
                  Select which cards you want. Cards deal until one matches.
                </Hint>
                <Hint
                  show={nuxStep === 1}
                  position="bottom"
                  onDismiss={() => advanceNux(2)}
                >
                  Narrow selections = more cards to the dealer per match.
                </Hint>
              </div>
            </HintWrapper>
            <HintWrapper show={nuxStep === 2} pulse>
              <div className="relative">
                <GameButton onClick={() => {
                  handleDeal()
                  if (nuxStep === 2 && !hasDealtRef.current) {
                    hasDealtRef.current = true
                    setTimeout(() => advanceNux(3), 1500)
                  }
                }} disabled={!canDeal}>
                  Deal
                </GameButton>
                <Hint
                  show={nuxStep === 2}
                  position="bottom"
                  onDismiss={() => advanceNux(NUX_COMPLETE)}
                >
                  Hit Deal to start. You get the match, dealer gets the rest.
                </Hint>
              </div>
            </HintWrapper>
          </div>
        )}

        {phase === GAME_PHASES.DEALING && (
          <DealingDisplay
            revealedCards={revealedCards}
            currentCard={currentDealCard}
            matchedCard={matchedCard}
            animatingIndex={dealAnimatingIndex}
          />
        )}

        {phase === GAME_PHASES.SELECTING && draftingComplete && (
          <div className="text-center">
            <p className="text-amber-100 text-lg mb-4">Your hand is complete!</p>
            <GameButton onClick={handleShowdown}>Showdown</GameButton>
          </div>
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

      {phase === GAME_PHASES.SHOWDOWN && (
        <GameButton onClick={handlePlayAgain}>Play Again</GameButton>
      )}

      <HintWrapper show={nuxStep === 3} pulse>
        <div className="relative">
          <HandDisplay
            cards={playerHand}
            title="Your Hand"
            highlightCards={showdownResult?.playerBestCards}
            handStrength={playerHandStrength}
            animateIndex={playerAnimateIndex}
          />
          <Hint
            show={nuxStep === 3}
            position="top"
            onDismiss={() => advanceNux(NUX_COMPLETE)}
          >
            You got your card! Repeat until you have 5.
          </Hint>
        </div>
      </HintWrapper>

      <div className="text-slate-500 text-sm">
        {phase !== GAME_PHASES.SHOWDOWN && (
          <p>Cards: {playerHand.length}/{PLAYER_HAND_SIZE} | Deck: {52 - deckIndex} remaining</p>
        )}
      </div>

      <div className="mt-2">
        <GameButton onClick={() => onNavigate(backScreen)} variant="back">
          Back to Menu
        </GameButton>
      </div>
    </div>
  )
}
