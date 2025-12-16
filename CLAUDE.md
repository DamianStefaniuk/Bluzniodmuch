# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Update this and other markdowns as needed to keep documentation accurate.

## Project Overview

Bluzniodmuch is a Polish web application gamifying a "swear jar" for a team called "Zespół Wentylacji". It tracks cursing incidents, awards points/penalties, and syncs data across devices via GitHub Gist.

**Language**: Polish (all UI text, comments, variable names in some places)

## Running the Application

No build process required - static HTML/CSS/JS application.

- **Local**: Open `index.html` directly in browser
- **Production**: Deployed via GitHub Pages

## Architecture

### Data Flow

```
localStorage ←→ JS modules ←→ GitHub Gist API (sync)
```

All data is stored in `localStorage` under keys prefixed with `bluzniodmuch_`. When sync is configured, data merges with GitHub Gist using conflict resolution strategies (max value wins for counters, newer date wins for timestamps, union for purchases).

### Core Modules (js/)

| File | Purpose |
|------|---------|
| `data.js` | Data persistence, player management, score calculations. Defines `PLAYERS` array and `calculatePlayerTotal()` |
| `sync.js` | GitHub Gist API integration, authentication, merge strategies. Defines `ALLOWED_USERS` mapping and `ADMIN_USERS` |
| `shop-items.js` | Reward/penalty definitions (`SHOP_ITEMS`), player status thresholds (`PLAYER_STATUSES`) |
| `achievements.js` | Achievement definitions with condition functions, auto-awarding logic |
| `app.js` | Main page logic (scoreboard, clickers) |
| `shop.js` | Shop page logic (purchase flow, monthly limits) |
| `trophies.js` | Trophies page rendering |
| `settings.js` | Settings page, sync configuration |

### Key Data Structures

**Player data** (in `data.players[name]`):
```javascript
{
    swearCount,           // Total swears (each = -1 point)
    spentOnRewards,       // Points spent on rewards
    earnedFromPenalties,  // Points earned from penalties
    bonusGained,          // Points from inactivity bonuses
    monthly: {},          // Monthly swear counts by "YYYY-MM" key
    yearly: {},           // Yearly swear counts by "YYYY" key
    lastActivity,         // ISO date of last swear
    rewardedInactiveDays, // Days without swearing (rewarded)
    rewardedInactiveWeeks // Weeks without swearing (rewarded)
}
```

**Balance formula**: `bonusGained + earnedFromPenalties - swearCount - spentOnRewards`

### Authorization Model

- Users authenticate via GitHub token (stored in localStorage)
- `ALLOWED_USERS` in `sync.js` maps GitHub usernames to player names
- `ADMIN_USERS` defines who can access data management features
- Each user selects their player profile after connecting

### Shop System

- **Rewards** (`type: 'reward'`): Positive cost, requires positive balance
- **Penalties** (`type: 'penalty'`): Negative cost, requires negative balance (executing improves status)
- Each item limited to once per month per player (checked via `hasUsedItemThisMonth()`)

### Achievement System

Achievements in `achievements.js` have `condition` functions that receive `(playerData, allPlayersData, playerName)` and return boolean. They're auto-checked after each action and stored in localStorage.

## Pages

- `index.html` - Scoreboard + clickers (main page)
- `shop.html` - Rewards and penalties shop
- `trophies.html` - Player and team achievements
- `settings.html` - Sync configuration, player selection

## Adding New Features

### New Shop Item
Add to `SHOP_ITEMS` in `shop-items.js`:
```javascript
{
    id: "unique_id",
    name: "Display Name",
    description: "Description",
    cost: 20,        // positive for reward, negative for penalty
    icon: "🎁",
    type: "reward",  // or "penalty"
    category: "team" // or "personal", "fun"
}
```

### New Achievement
Add to `INDIVIDUAL_ACHIEVEMENTS` or `TEAM_ACHIEVEMENTS` in `achievements.js`:
```javascript
{
    id: "unique_id",
    name: "Achievement Name",
    description: "How to earn it",
    icon: "🏆",
    condition: (player, allData, playerName) => /* boolean */
}
```

### New Player
Add to `PLAYERS` array in `data.js` and `ALLOWED_USERS` mapping in `sync.js`.

## Detailed Documentation

For in-depth information about specific systems, see:

| Document | Contents |
|----------|----------|
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | localStorage keys, data structures, CRUD functions, migration |
| [docs/SYNC-SYSTEM.md](docs/SYNC-SYSTEM.md) | GitHub Gist API, merge strategies, sync flow diagrams |
| [docs/SHOP-SYSTEM.md](docs/SHOP-SYSTEM.md) | Rewards/penalties, purchase flow, monthly limits, bonuses |
| [docs/ACHIEVEMENTS.md](docs/ACHIEVEMENTS.md) | Condition functions, auto-awarding, adding new achievements |
| [docs/AUTHORIZATION.md](docs/AUTHORIZATION.md) | User roles, permissions, login flow, UI access control |
