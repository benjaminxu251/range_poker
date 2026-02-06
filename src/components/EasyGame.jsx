import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createDeck } from '../utils/deck.js'
import { playCardSound } from '../utils/sound.js'
import { Card } from './Card.jsx'
import { Hint, HintWrapper } from './Hint.jsx'
import {
  PLAYER_HAND_SIZE, DEALER_HAND_SIZE,
  getHandStrength, computeShowdownResult,
  GameButton, HandDisplay, DealerHandDisplay, ShowdownResult,
} from './GameShared.jsx'

const NUX_STORAGE_KEY = 'easyNuxStep'
const NUX_COMPLETE = -1

const GAME_PHASES = {
  DRAFTING: 'drafting',
  DEALING_SHOWDOWN: 'dealingShowdown',
  SHOWDOWN: 'showdown',
}

const DEAL_DELAY = 200

function CurrentCardDisplay({ card }) {
  if (!card) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xl font-serif text-amber-100">Current Card</h3>
      <div className="animate-deal" key={`${card.rank}-${card.suit}`}>
        <Card card={card} size="large" />
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

  const hasTakenRef = useRef(false)
  const hasPassedRef = useRef(false)

  const currentCard = phase === GAME_PHASES.DRAFTING && deckIndex < deck.length ? deck[deckIndex] : null
  const isDrafting = phase === GAME_PHASES.DRAFTING
  const playerNeedsCards = playerHand.length < PLAYER_HAND_SIZE

  const playerHandStrength = useMemo(() => getHandStrength(playerHand), [playerHand])
  const dealerHandStrength = useMemo(() => getHandStrength(dealerHand), [dealerHand])

  const handleTake = useCallback(() => {
    if (!currentCard || !playerNeedsCards) return

    playCardSound()
    setPlayerAnimateIndex(playerHand.length)
    setPlayerHand(prev => [...prev, currentCard])
    setDeckIndex(prev => prev + 1)

    setTimeout(() => setPlayerAnimateIndex(-1), 400)

    if (!hasTakenRef.current && nuxStep === 0) {
      hasTakenRef.current = true
      setTimeout(() => advanceNux(1), 500)
    }
  }, [currentCard, playerNeedsCards, playerHand.length, nuxStep, advanceNux])

  const handlePass = useCallback(() => {
    if (!currentCard) return

    playCardSound()
    setDealerAnimateIndex(dealerHand.length)
    setDealerHand(prev => [...prev, currentCard])
    setDeckIndex(prev => prev + 1)

    setTimeout(() => setDealerAnimateIndex(-1), 400)

    if (!hasPassedRef.current && (nuxStep === 0 || nuxStep === 1)) {
      hasPassedRef.current = true
      setTimeout(() => advanceNux(2), 500)
    }
  }, [currentCard, dealerHand.length, nuxStep, advanceNux])

  const draftingComplete = playerHand.length === PLAYER_HAND_SIZE

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
    setPhase(GAME_PHASES.DRAFTING)
    setShowdownResult(null)
    setPlayerAnimateIndex(-1)
    setDealerAnimateIndex(-1)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-6 p-3 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-serif text-amber-100">Easy Mode</h1>

      {/* Dealer's Hand */}
      <HintWrapper show={nuxStep === 2} pulse>
        <div className="relative">
          <DealerHandDisplay
            cards={dealerHand}
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
      <div className="min-h-28 sm:min-h-40 flex items-center justify-center">
        {isDrafting && currentCard && (
          <HintWrapper show={nuxStep === 0} pulse>
            <CurrentCardDisplay card={currentCard} />
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
      <div className="mt-2 sm:mt-4">
        <GameButton onClick={() => onNavigate(backScreen)} variant="back">
          Back to Menu
        </GameButton>
      </div>
    </div>
  )
}
