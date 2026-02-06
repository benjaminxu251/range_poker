import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createDeck, RANKS, SUITS, SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck.js'
import { playCardSound } from '../utils/sound.js'
import { Card } from './Card.jsx'
import { Hint, HintWrapper } from './Hint.jsx'
import {
  PLAYER_HAND_SIZE, DEALER_HAND_SIZE,
  getHandStrength, computeShowdownResult,
  GameButton, HandDisplay, DealerHandDisplay, ShowdownResult,
} from './GameShared.jsx'

const NUX_STORAGE_KEY = 'hardNuxStep'
const NUX_COMPLETE = -1

const GAME_PHASES = {
  SELECTING: 'selecting',
  DEALING: 'dealing',
  DEALING_SHOWDOWN: 'dealingShowdown',
  SHOWDOWN: 'showdown',
}

const DEAL_DELAY = 150

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
    <div className="flex flex-col gap-2 p-1.5 sm:p-3 bg-slate-800/50 rounded-xl border border-slate-600">
      <div className="overflow-x-auto">
        <div className="flex gap-0.5 ml-6 sm:ml-10">
          {RANKS.map(rank => (
            <button
              key={rank}
              onClick={() => toggleRank(rank)}
              className="w-6 h-5 sm:w-7 sm:h-6 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-amber-200 hover:bg-slate-700 rounded transition-colors"
            >
              {rank}
            </button>
          ))}
        </div>

        {SUITS.map(suit => (
          <div key={suit} className="flex gap-0.5 items-center">
            <button
              onClick={() => toggleSuit(suit)}
              className={`w-6 h-7 sm:w-9 sm:h-8 text-base sm:text-lg rounded hover:bg-slate-700 transition-colors shrink-0 ${SUIT_COLORS[suit]}`}
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
                  className={`w-6 h-7 sm:w-7 sm:h-8 text-[10px] sm:text-xs font-bold rounded border transition-all ${
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
      </div>

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

function DealingDisplay({ revealedCards, currentCard, matchedCard }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-lg font-serif text-slate-300">Dealing...</h3>
      <div className="flex gap-1 flex-wrap justify-center max-w-md min-h-[2.5rem]">
        {revealedCards.map((card, i) => (
          <div
            key={i}
            className="opacity-50"
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

  const handleDeal = useCallback(() => {
    if (selectedCards.size === 0) return

    let idx = deckIndex
    const revealed = []
    let matched = null

    while (idx < deck.length) {
      const card = deck[idx]
      idx++
      if (selectedCards.has(`${card.rank}-${card.suit}`)) {
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
  }, [selectedCards, deck, deckIndex])

  // Animate dealing one card at a time
  useEffect(() => {
    if (phase !== GAME_PHASES.DEALING || !dealingRef.current) return

    const dealing = dealingRef.current
    const { cardsToReveal, matchedCard: matched, finalDeckIndex, revealedCount } = dealing

    if (revealedCount < cardsToReveal.length) {
      const timer = setTimeout(() => {
        playCardSound()
        const nextCard = cardsToReveal[revealedCount]
        setCurrentDealCard(nextCard)

        setTimeout(() => {
          setRevealedCards(prev => [...prev, nextCard])
          setCurrentDealCard(null)
          dealing.revealedCount++
        }, 150)
      }, DEAL_DELAY)
      return () => clearTimeout(timer)
    } else if (dealing.processed) {
      return
    } else if (matched) {
      dealing.processed = true
      const timer = setTimeout(() => {
        setMatchedCard(matched)

        setTimeout(() => {
          setPlayerAnimateIndex(playerHand.length)
          setPlayerHand(prev => [...prev, matched])

          setDealerHand(prev => [...prev, ...cardsToReveal])
          setDealerAnimateIndex(dealerHand.length + cardsToReveal.length - 1)

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
      dealing.processed = true
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
  const cardsPlayerNeeds = PLAYER_HAND_SIZE - playerHand.length
  const remainingDeck = deck.length - deckIndex
  const canDeal = selectedCards.size > 0 && playerNeedsCards && deckIndex < deck.length
  const draftingComplete = playerHand.length === PLAYER_HAND_SIZE

  // Auto-complete player hand and go to showdown if deck is too small to continue
  useEffect(() => {
    if (phase !== GAME_PHASES.SELECTING || !playerNeedsCards) return
    if (remainingDeck > cardsPlayerNeeds) return

    const playerCardsToAdd = deck.slice(deckIndex, deckIndex + Math.min(remainingDeck, cardsPlayerNeeds))
    const newDeckIndex = deckIndex + playerCardsToAdd.length

    const dealerCardsNeeded = DEALER_HAND_SIZE - dealerHand.length
    const dealerCardsToAdd = deck.slice(newDeckIndex, newDeckIndex + dealerCardsNeeded)

    showdownDataRef.current = {
      cardsToAdd: dealerCardsToAdd,
      finalDeckIndex: newDeckIndex + dealerCardsToAdd.length,
      startDealerCount: dealerHand.length,
    }

    setPlayerHand(prev => [...prev, ...playerCardsToAdd])
    setDeckIndex(newDeckIndex + dealerCardsToAdd.length)
    setPhase(GAME_PHASES.DEALING_SHOWDOWN)
  }, [phase, playerNeedsCards, remainingDeck, cardsPlayerNeeds, deck, deckIndex, dealerHand.length])

  const handleShowdown = useCallback(() => {
    const cardsNeeded = DEALER_HAND_SIZE - dealerHand.length
    const cardsToAdd = deck.slice(deckIndex, deckIndex + cardsNeeded)

    showdownDataRef.current = {
      cardsToAdd,
      finalDeckIndex: deckIndex + cardsToAdd.length,
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
        playCardSound()
        const nextCard = cardsToAdd[currentAddedCount]
        setDealerAnimateIndex(dealerHand.length)
        setDealerHand(prev => [...prev, nextCard])
        setTimeout(() => setDealerAnimateIndex(-1), 400)
      }, DEAL_DELAY)
      return () => clearTimeout(timer)
    } else {
      setDeckIndex(finalDeckIndex)
      setShowdownResult(computeShowdownResult(playerHand, dealerHand))
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
    <div className="flex flex-col items-center gap-3 sm:gap-4 p-3 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-serif text-amber-100">Hard Mode</h1>

      <DealerHandDisplay
        cards={dealerHand}
        bestHandCards={showdownResult?.dealerBestCards}
        handStrength={dealerHandStrength}
        animateIndex={dealerAnimateIndex}
      />

      <div className="min-h-32 sm:min-h-48 flex items-center justify-center">
        {phase === GAME_PHASES.SELECTING && !draftingComplete && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-amber-100 text-lg">Select cards to stop on:</p>
            <HintWrapper show={nuxStep === 0} pulse>
              <div className="relative">
                <RangeSelector
                  selectedCards={selectedCards}
                  onSelectionChange={(cards) => {
                    setSelectedCards(cards)
                    if (nuxStep === 0 && cards.size > 0) {
                      setTimeout(() => advanceNux(1), 300)
                    }
                  }}
                  usedCards={usedCards}
                />
                <Hint
                  show={nuxStep === 0}
                  position="bottom"
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
