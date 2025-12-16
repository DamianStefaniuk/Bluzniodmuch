# Model Danych

## Klucze localStorage

| Klucz | Plik | Opis |
|-------|------|------|
| `bluzniodmuch_scores` | data.js | Główne dane aplikacji (gracze, zakupy, historia) |
| `bluzniodmuch_achievements` | achievements.js | Przyznane osiągnięcia |
| `bluzniodmuch_gist_id` | sync.js | ID Gista do synchronizacji |
| `bluzniodmuch_github_token` | sync.js | Personal Access Token GitHub |
| `bluzniodmuch_github_username` | sync.js | Nazwa użytkownika GitHub |
| `bluzniodmuch_last_sync` | sync.js | Timestamp ostatniej synchronizacji |
| `bluzniodmuch_selected_player` | sync.js | Wybrany profil gracza |

## Struktura głównych danych (`bluzniodmuch_scores`)

```javascript
{
    players: {
        "Jacek": { /* PlayerData */ },
        "Mateusz": { /* PlayerData */ },
        // ...
    },
    purchases: [ /* Purchase[] */ ],
    lastBonusCheck: "2025-01-15",       // Data ostatniego sprawdzenia bonusów
    lastMonthWinnerCheck: "2024-12",    // Ostatni sprawdzony miesiąc dla zwycięzcy
    lastYearWinnerCheck: "2024",        // Ostatni sprawdzony rok dla zwycięzcy
    forceResetTimestamp: 0,             // Timestamp wymuszenia resetu (dla sync)
    history: {}                          // Zarezerwowane na przyszłość
}
```

## PlayerData - dane gracza

```javascript
{
    // === Składniki bilansu ===
    swearCount: 15,              // Całkowita liczba przekleństw (każde = -1 pkt)
    spentOnRewards: 10,          // Punkty wydane na nagrody
    earnedFromPenalties: 20,     // Punkty zdobyte za wykonane kary
    bonusGained: 8,              // Punkty z bonusów za nieaktywność

    // === Liczniki okresowe ===
    monthly: {
        "2025-01": 5,            // Przekleństwa w styczniu 2025
        "2025-02": 10            // Przekleństwa w lutym 2025
    },
    yearly: {
        "2025": 15               // Przekleństwa w roku 2025
    },

    // === Tracking aktywności ===
    lastActivity: "2025-02-10T14:30:00.000Z",  // ISO date ostatniego przekleństwa
    rewardedInactiveDays: 3,     // Ile dni bez przekleństwa już nagrodzono
    rewardedInactiveWeeks: 0,    // Ile tygodni bez przekleństwa już nagrodzono
    lastMonthBonusCheck: "2025-01",  // Ostatni miesiąc sprawdzony pod kątem bonusu

    // === Wygrane okresy ===
    monthsWon: ["2024-11", "2024-12"],  // Lista wygranych miesięcy
    yearsWon: ["2024"]                   // Lista wygranych lat
}
```

## Purchase - zakup w sklepie

```javascript
{
    id: "lxyz123abc456",         // Unikalny ID (generowany przez generateId())
    player: "Damian",            // Nazwa gracza
    itemId: "pizza_time",        // ID przedmiotu z SHOP_ITEMS
    cost: -30,                   // Koszt (ujemny dla kar, dodatni dla nagród)
    type: "penalty",             // "reward" lub "penalty"
    date: "2025-02-10T14:30:00.000Z"  // ISO date zakupu
}
```

## Obliczanie bilansu punktów

Funkcja `calculatePlayerTotal(playerData)` w `data.js`:

```javascript
bilans = bonusGained + earnedFromPenalties - swearCount - spentOnRewards
```

| Składnik | Znak | Źródło |
|----------|------|--------|
| `bonusGained` | + | Automatyczne bonusy za dni/tygodnie/miesiące bez przekleństw |
| `earnedFromPenalties` | + | Wykonane kary (wartość absolutna kosztu kary) |
| `swearCount` | - | Każde przekleństwo |
| `spentOnRewards` | - | Odebrane nagrody |

## Struktura osiągnięć (`bluzniodmuch_achievements`)

```javascript
{
    individual: {
        "Damian": [
            { id: "first_swear", date: "2025-01-15T10:00:00.000Z" },
            { id: "ten_swears", date: "2025-02-01T12:30:00.000Z" }
        ],
        "Jacek": [
            { id: "first_swear", date: "2025-01-16T09:00:00.000Z" }
        ]
    },
    team: [
        { id: "team_first", date: "2025-01-15T10:00:00.000Z" },
        { id: "all_participated", date: "2025-01-20T15:00:00.000Z" }
    ]
}
```

## Klucze czasowe

### Klucz miesiąca (YYYY-MM)
```javascript
getCurrentMonthKey() // np. "2025-02"
```

### Klucz roku (YYYY)
```javascript
getCurrentYearKey() // np. "2025"
```

## Funkcje CRUD

### Odczyt
- `getData()` - pobiera wszystkie dane (z migracją)
- `getScores(period)` - pobiera ranking (period: 'month', 'year', 'all')
- `getPlayerMonthlyScore(playerName)` - przekleństwa gracza w bieżącym miesiącu
- `getPlayerPoints(playerName)` - bilans punktów gracza
- `getTeamTotal(period)` - suma przekleństw zespołu

### Sortowanie rankingu (`getScores`)

| Okres | Główne kryterium | Tie-breaker (przy remisie) |
|-------|------------------|---------------------------|
| `month` | Najwyższy bilans punktów | Mniej przekleństw w miesiącu wygrywa |
| `year` | Najmniej przekleństw w roku | Wyższy bilans wygrywa |
| `all` | Najmniej przekleństw ogółem | Wyższy bilans wygrywa |

### Zapis
- `saveData(data)` - zapisuje wszystkie dane
- `addSwear(playerName)` - dodaje przekleństwo (+1 do swearCount i monthly/yearly)

### Eksport/Import
- `exportData()` - eksportuje dane jako JSON string
- `importData(jsonString)` - importuje dane z JSON string

## Migracja danych

Funkcja `initializeData()` automatycznie migruje stare formaty:
- Dodaje brakujące pola do struktury gracza
- Konwertuje stare pole `total` na składniki bilansu
- Dodaje brakujące ID do zakupów
- Tworzy strukturę `purchases` jeśli nie istnieje

## Diagram relacji

```
┌─────────────────────────────────────────────────────────┐
│                    bluzniodmuch_scores                  │
├─────────────────────────────────────────────────────────┤
│  players: {                                             │
│    [playerName]: PlayerData ──────────────────────┐     │
│  }                                                │     │
│                                                   │     │
│  purchases: Purchase[] ───────────────────────────┼──┐  │
│                         │                         │  │  │
│                         │ player                  │  │  │
│                         └─────────────────────────┘  │  │
│                         │ itemId                     │  │
│                         └────────────────────────────┼──┤
└─────────────────────────────────────────────────────┼──┤
                                                      │  │
┌─────────────────────────────────────────────────────┼──┤
│                      SHOP_ITEMS                     │  │
│  (shop-items.js)                                    │  │
├─────────────────────────────────────────────────────┼──┤
│  [{ id, name, cost, type, ... }] ◄──────────────────┘  │
└────────────────────────────────────────────────────────┤
                                                         │
┌────────────────────────────────────────────────────────┤
│                bluzniodmuch_achievements               │
├────────────────────────────────────────────────────────┤
│  individual: {                                         │
│    [playerName]: [{ id, date }] ◄──────────────────────┘
│  }                                 │
│  team: [{ id, date }] ◄────────────┘
└────────────────────────────────────┘
```
