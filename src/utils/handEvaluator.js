import { rankValue } from './deck.js'

// Hand rankings (higher is better)
export const HAND_RANKS = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
}

export const HAND_NAMES = {
  1: 'High Card',
  2: 'One Pair',
  3: 'Two Pair',
  4: 'Three of a Kind',
  5: 'Straight',
  6: 'Flush',
  7: 'Full House',
  8: 'Four of a Kind',
  9: 'Straight Flush',
  10: 'Royal Flush',
}

// Evaluate a 5-card hand
// Returns { rank: number, tiebreakers: number[], name: string }
export function evaluateHand(cards) {
  if (cards.length !== 5) {
    throw new Error('Hand must have exactly 5 cards')
  }

  const suits = cards.map(c => c.suit)
  const values = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a)

  const isFlush = suits.every(s => s === suits[0])
  const isStraight = checkStraight(values)

  // Count ranks
  const rankCounts = {}
  for (const v of values) {
    rankCounts[v] = (rankCounts[v] || 0) + 1
  }
  const counts = Object.entries(rankCounts)
    .map(([v, c]) => ({ value: parseInt(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value)

  // Royal Flush: A-K-Q-J-10 all same suit
  if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
    return { rank: HAND_RANKS.ROYAL_FLUSH, tiebreakers: values, name: HAND_NAMES[10] }
  }

  // Straight Flush
  if (isFlush && isStraight) {
    const highCard = isStraight === 'wheel' ? 5 : values[0]
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, tiebreakers: [highCard], name: HAND_NAMES[9] }
  }

  // Four of a Kind
  if (counts[0].count === 4) {
    return {
      rank: HAND_RANKS.FOUR_OF_A_KIND,
      tiebreakers: [counts[0].value, counts[1].value],
      name: HAND_NAMES[8],
    }
  }

  // Full House
  if (counts[0].count === 3 && counts[1].count === 2) {
    return {
      rank: HAND_RANKS.FULL_HOUSE,
      tiebreakers: [counts[0].value, counts[1].value],
      name: HAND_NAMES[7],
    }
  }

  // Flush
  if (isFlush) {
    return { rank: HAND_RANKS.FLUSH, tiebreakers: values, name: HAND_NAMES[6] }
  }

  // Straight
  if (isStraight) {
    const highCard = isStraight === 'wheel' ? 5 : values[0]
    return { rank: HAND_RANKS.STRAIGHT, tiebreakers: [highCard], name: HAND_NAMES[5] }
  }

  // Three of a Kind
  if (counts[0].count === 3) {
    const kickers = counts.slice(1).map(c => c.value)
    return {
      rank: HAND_RANKS.THREE_OF_A_KIND,
      tiebreakers: [counts[0].value, ...kickers],
      name: HAND_NAMES[4],
    }
  }

  // Two Pair
  if (counts[0].count === 2 && counts[1].count === 2) {
    const pairs = [counts[0].value, counts[1].value].sort((a, b) => b - a)
    return {
      rank: HAND_RANKS.TWO_PAIR,
      tiebreakers: [...pairs, counts[2].value],
      name: HAND_NAMES[3],
    }
  }

  // One Pair
  if (counts[0].count === 2) {
    const kickers = counts.slice(1).map(c => c.value)
    return {
      rank: HAND_RANKS.ONE_PAIR,
      tiebreakers: [counts[0].value, ...kickers],
      name: HAND_NAMES[2],
    }
  }

  // High Card
  return { rank: HAND_RANKS.HIGH_CARD, tiebreakers: values, name: HAND_NAMES[1] }
}

// Check if sorted values form a straight
// Returns false, true, or 'wheel' for A-2-3-4-5
function checkStraight(sortedValues) {
  // Normal straight
  if (sortedValues[0] - sortedValues[4] === 4 && new Set(sortedValues).size === 5) {
    return true
  }
  // Wheel (A-2-3-4-5)
  if (sortedValues[0] === 14 && sortedValues[1] === 5 && sortedValues[2] === 4 &&
      sortedValues[3] === 3 && sortedValues[4] === 2) {
    return 'wheel'
  }
  return false
}

// Compare two evaluated hands
// Returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
export function compareHands(eval1, eval2) {
  if (eval1.rank !== eval2.rank) {
    return eval1.rank > eval2.rank ? 1 : -1
  }

  for (let i = 0; i < eval1.tiebreakers.length; i++) {
    if (eval1.tiebreakers[i] !== eval2.tiebreakers[i]) {
      return eval1.tiebreakers[i] > eval2.tiebreakers[i] ? 1 : -1
    }
  }

  return 0
}

const VALUE_NAMES = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10', 9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2' }

function rankName(v) {
  return VALUE_NAMES[v] || v
}

// Evaluate a partial hand (1-4 cards) - returns best made hand description
export function evaluatePartialHand(cards) {
  if (cards.length === 0) return null
  if (cards.length >= 5) return findBestHand(cards).evaluation.name

  const values = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a)

  // Count ranks
  const rankCounts = {}
  for (const v of values) {
    rankCounts[v] = (rankCounts[v] || 0) + 1
  }
  const counts = Object.entries(rankCounts)
    .map(([v, c]) => ({ value: parseInt(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value)

  // Four of a kind
  if (counts[0].count === 4) {
    return `Four ${rankName(counts[0].value)}s`
  }

  // Three of a kind
  if (counts[0].count === 3) {
    return `Three ${rankName(counts[0].value)}s`
  }

  // Two pair
  if (counts.length >= 2 && counts[0].count === 2 && counts[1].count === 2) {
    return `${rankName(counts[0].value)}s and ${rankName(counts[1].value)}s`
  }

  // One pair
  if (counts[0].count === 2) {
    return `Pair of ${rankName(counts[0].value)}s`
  }

  // High card
  return `${rankName(values[0])} High`
}

// Find best 5-card hand from n cards
export function findBestHand(cards) {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards')
  }
  if (cards.length === 5) {
    return { cards, evaluation: evaluateHand(cards) }
  }

  let bestHand = null
  let bestEval = null

  const combinations = getCombinations(cards, 5)
  for (const combo of combinations) {
    const evaluation = evaluateHand(combo)
    if (!bestEval || compareHands(evaluation, bestEval) > 0) {
      bestHand = combo
      bestEval = evaluation
    }
  }

  return { cards: bestHand, evaluation: bestEval }
}

// Generate all k-combinations of an array
function getCombinations(arr, k) {
  const result = []

  function backtrack(start, current) {
    if (current.length === k) {
      result.push([...current])
      return
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      backtrack(i + 1, current)
      current.pop()
    }
  }

  backtrack(0, [])
  return result
}
