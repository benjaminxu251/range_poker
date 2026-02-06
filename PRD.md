# Range Poker - Product Requirements Document

## Overview

Range Poker is a single-player card drafting game where the player competes against a dealer. The core mechanic involves strategically choosing which revealed cards to keep versus give to the dealer, then comparing best 5-card poker hands at showdown.

## Game Modes

### Easy Mode

1. **Card Reveal**: Dealer flips one card face-up from the deck
2. **Player Decision**: Player chooses to either:
   - **Take** the card (add to player's hand)
   - **Pass** the card (give to dealer's hand)
3. **Repeat** steps 1-2 until player has exactly 5 cards
4. **Dealer Draw**: If dealer has fewer than 8 cards, draw from deck until dealer has 8
5. **Showdown**: Compare best 5-card poker hand from each player's cards
   - Player uses their 5 cards
   - Dealer selects best 5 from their 8 cards
   - Player must have the stronger hand to win; equal hands = dealer wins

### Hard Mode

1. **Define Stopping Condition**: Player specifies a range of cards they want (must resolve to explicit set)
   - Examples: "9+", "any spade", "face cards", "2-5 of hearts"
   - The condition must be unambiguous and map to specific cards
2. **Dealer Deals**: Cards dealt from deck one at a time until a card matches the stopping condition
3. **Distribution**: Player takes the matching card; dealer takes all cards dealt before it
4. **Repeat** steps 1-3 until player has 5 cards
5. **Showdown**: Same as Easy Mode - player must have a stronger hand to win

#### Stopping Condition UX

Need intuitive input for defining ranges:
- Rank selectors (2-A, with range/multi-select)
- Suit selectors (optional filter)
- Preset shortcuts ("broadway", "suited connectors", etc.)
- Visual preview of which cards match the condition

#### Balance Considerations

**Problem**: Player could specify only premium cards (e.g., royal flush components) and always win.

**Natural Deterrent**: Narrow ranges = more cards to dealer before each hit. If you specify only 4 cards in the deck, dealer accumulates ~12 cards per hit on average, giving them massive hand selection advantage.

**Additional Mechanics to Consider**:
- Deck exhaustion: If stopping condition not found, player busts?
- Round limit: Max N cards dealt per stopping condition before forced take?
- Scoring system: Win margin affects points, incentivizing efficient wins?

*Balance TBD after playtesting*

## Technical Requirements

- Web-based single-page application
- Standard 52-card deck
- Poker hand evaluation (high card through royal flush)
- Visual card display and selection interface
- Win/loss tracking

## User Experience

- Clear card visuals
- Dealer's hand always visible (face-up) in both modes
- Current hand strength displayed under each hand (updates live as cards are added)
- Obvious take/pass controls
- Showdown comparison display
- Background music (Balatro soundtrack)

---

*Document maintained for Claude Code context. See CLAUDE.md for development guidance.*
