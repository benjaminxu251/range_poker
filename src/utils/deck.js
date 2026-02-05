// Card constants
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export const SUIT_SYMBOLS = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
}

export const SUIT_COLORS = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-slate-900',
  spades: 'text-slate-900',
}

// Create a new shuffled deck
export function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return shuffle(deck)
}

// Fisher-Yates shuffle
function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Get numerical value of a rank (for comparison)
export function rankValue(rank) {
  const values = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  }
  return values[rank]
}

// Format card for display
export function cardToString(card) {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`
}
