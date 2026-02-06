# Future Ideas

## Server-Stored High Score System

**Concept**: Global leaderboard tracking win streaks with nickname-based submissions.

**Tech approach**:
- Custom Node.js/Express backend with SQLite
- Simple API: `GET /api/leaderboard`, `POST /api/scores`
- Rate limiting + game hash to deter abuse

**Frontend changes needed**:
- Track win streak in App.jsx state (persist to localStorage)
- Leaderboard screen showing top 10 by mode
- Score submission modal when streak ends (nickname input)

**Score metric**: Consecutive wins before losing

**Complexity**: Medium - requires new backend directory, ~5 new files, modifications to App.jsx and both game components.
