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
| `calendar.js` | Calendar page, vacation management |

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

### Workday System

The application only tracks activity on workdays (Monday-Friday). On weekends:
- Swear counts cannot be added (`isWeekend()` blocks `addSwear()`)
- No bonus points are awarded
- Achievements are not awarded

Key functions in `data.js`:
- `isWorkday(date?)` - checks if date is Mon-Fri
- `isWeekend(date?)` - checks if date is Sat-Sun
- `countWorkdaysSince(fromDate, playerName?)` - counts workdays since a date (excludes vacation days if playerName provided)
- `countWorkdaysBetween(start, end)` - counts workdays in range

Bonus calculation:
- **Daily bonus**: +1 point per workday without swearing
- **Weekly bonus**: +5 points per 5 workdays without swearing
- **Monthly bonus**: +10 points for entire month without swearing

### Vacation System

Players can mark vacation periods in the calendar. During vacation:
- No bonus points for inactivity are awarded
- Swear counts cannot be added
- Achievements are not awarded

**Vacation data** (in `data.vacations[playerName]`):
```javascript
[{
    id: "uniqueId",
    startDate: "YYYY-MM-DD",
    endDate: "YYYY-MM-DD",
    createdAt: "ISO date"
}]
```

Key functions in `data.js`:
- `isPlayerOnVacation(playerName, date?)` - checks if player is on vacation
- `addVacation(playerName, startDate, endDate)` - adds vacation (auto-merges overlapping)
- `removeVacation(playerName, vacationId)` - removes vacation

### Holiday System (Dni Wolne od Pracy)

Holidays are company-wide days off that automatically create vacations for all players. Used for statutory holidays when no one is working.

**Holiday data** (in `data.holidays`):
```javascript
[{
    id: "uniqueId",
    startDate: "YYYY-MM-DD",
    endDate: "YYYY-MM-DD",
    createdAt: "ISO date"
}]
```

Key functions in `data.js`:
- `addHoliday(startDate, endDate)` - adds holiday for all players (creates vacation for each)
- `getHolidays()` - returns list of holidays
- `removeHoliday(holidayId)` - removes holiday and associated vacations for all players

## Pages

- `index.html` - Scoreboard + clickers (main page)
- `shop.html` - Rewards and penalties shop
- `trophies.html` - Player and team achievements
- `calendar.html` - Vacation calendar (view all players, manage own vacations)
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
