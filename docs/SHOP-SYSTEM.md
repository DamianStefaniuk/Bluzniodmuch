# System Sklepu

## Przegląd

Sklep pozwala graczom:
- **Nagrody**: Wydawać punkty dodatnie na nagrody
- **Kary**: Wykonywać kary aby poprawić ujemny bilans

## Struktura przedmiotu (SHOP_ITEMS)

```javascript
{
    id: "pizza_time",           // Unikalny identyfikator
    name: "Pizza time!",        // Nazwa wyświetlana
    description: "Stawiasz pizzę dla całego zespołu!",
    cost: -30,                  // Koszt (+ dla nagród, - dla kar)
    icon: "🍕",                 // Emoji
    type: "penalty",            // "reward" lub "penalty"
    category: "team"            // "team", "personal", "fun"
}
```

## Różnica między nagrodami a karami

| Aspekt | Nagroda (reward) | Kara (penalty) |
|--------|------------------|----------------|
| `cost` | Dodatni (np. 20) | Ujemny (np. -30) |
| Wymagany bilans | `balance >= cost` | `balance <= cost` |
| Efekt na bilans | `-cost` (zmniejsza) | `+|cost|` (zwiększa) |
| Pole gracza | `spentOnRewards += cost` | `earnedFromPenalties += |cost|` |

## Przepływ zakupu

```
┌─────────────────────────────────────────────────────────────┐
│                     shop.js - completePurchase()            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Weryfikacje:                                            │
│     ├─ hasUsedItemThisMonth(player, itemId) → blokada       │
│     ├─ isReward && balance < cost → "Za mało punktów!"      │
│     └─ !isReward && balance > cost → "Niewystarczająco..."  │
│                                                             │
│  2. Aktualizacja danych gracza:                             │
│     ├─ Nagroda: spentOnRewards += cost                      │
│     └─ Kara: earnedFromPenalties += |cost|                  │
│                                                             │
│  3. Dodanie do historii zakupów:                            │
│     data.purchases.push({                                   │
│         id: generateId(),                                   │
│         player, itemId, cost, type, date                    │
│     })                                                      │
│                                                             │
│  4. Sprawdzenie osiągnięć:                                  │
│     checkAndAwardAchievements(player)                       │
│                                                             │
│  5. Synchronizacja (jeśli skonfigurowana):                  │
│     await syncData()                                        │
│                                                             │
│  6. Odświeżenie UI:                                         │
│     renderShop(), renderPlayerBalances(),                   │
│     renderPurchaseHistory()                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Limit miesięczny

Każdy przedmiot może być użyty **raz w miesiącu** przez każdego gracza.

### Sprawdzanie limitu

```javascript
// shop.js
function hasUsedItemThisMonth(playerName, itemId) {
    const data = getData();
    const purchases = data.purchases || [];
    const currentMonth = getCurrentMonthKey();  // "YYYY-MM"

    return purchases.some(purchase => {
        if (purchase.player !== playerName || purchase.itemId !== itemId) {
            return false;
        }
        const purchaseDate = new Date(purchase.date);
        const purchaseMonth = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
        return purchaseMonth === currentMonth;
    });
}
```

### Punkty blokady
1. `createShopItemCard()` - karta ma klasę `used-this-month`, przycisk disabled
2. `openPurchaseModal()` - pokazuje powiadomienie i kończy funkcję
3. `completePurchase()` - dodatkowa weryfikacja przed zapisem

## Funkcje API (shop.js)

### Rendering
```javascript
renderShop()                // Renderuje siatki nagród i kar
createShopItemCard(item, type)  // Tworzy kartę przedmiotu
renderPlayerBalances()      // Aktualizuje salda wszystkich graczy
renderPurchaseHistory()     // Renderuje ostatnie 20 transakcji
renderPlayerSelector()      // Selektor gracza (zablokowany - auto z loginu)
```

### Logika zakupu
```javascript
openPurchaseModal(item)     // Otwiera modal potwierdzenia
closePurchaseModal()        // Zamyka modal
completePurchase()          // Finalizuje zakup
getPlayerBalance(playerName)  // Bilans gracza
hasUsedItemThisMonth(player, itemId)  // Sprawdza limit miesięczny
```

### Bonusy
```javascript
applyInactivityBonuses()    // Przyznaje bonusy za nieaktywność
```

## Funkcje API (shop-items.js)

```javascript
getShopItems()              // Wszystkie przedmioty
getRewards()                // Tylko nagrody (type === 'reward')
getPenalties()              // Tylko kary (type === 'penalty')
getShopItemById(id)         // Przedmiot po ID
getShopItemsByCategory(cat) // Przedmioty z kategorii
getPlayerStatus(points)     // Status gracza na podstawie bilansu
getAllStatuses()            // Wszystkie definicje statusów
```

## System statusów gracza

Statusy są definiowane w `PLAYER_STATUSES` (shop-items.js):

```javascript
const PLAYER_STATUSES = [
    { min: 50,  max: Infinity, name: "Święty",      icon: "😇", color: "#f1c40f" },
    { min: 20,  max: 49,       name: "Grzeczny",    icon: "😊", color: "#27ae60" },
    { min: 1,   max: 19,       name: "W normie",    icon: "🙂", color: "#3498db" },
    { min: -9,  max: 0,        name: "Neutralny",   icon: "😐", color: "#95a5a6" },
    { min: -30, max: -10,      name: "Gorsze dni",  icon: "😤", color: "#e67e22" },
    { min: -50, max: -31,      name: "Niegrzeczny", icon: "🤬", color: "#e74c3c" },
    { min: -Infinity, max: -51, name: "Przeklinator", icon: "👹", color: "#8e44ad" }
];
```

### Użycie
```javascript
const status = getPlayerStatus(playerBalance);
// { min, max, name, icon, color }
```

## Bonusy za nieaktywność

Funkcja `applyInactivityBonuses()` uruchamiana przy ładowaniu sklepu:

| Okres | Bonus | Pole |
|-------|-------|------|
| Każdy dzień bez przekleństwa | +1 pkt | `bonusGained` |
| Każdy pełny tydzień | +5 pkt (dodatkowo) | `bonusGained` |
| Cały miesiąc bez przekleństw | +10 pkt | `bonusGained` |

### Tracking
- `rewardedInactiveDays` - ile dni już nagrodzono
- `rewardedInactiveWeeks` - ile tygodni już nagrodzono
- `lastMonthBonusCheck` - ostatni sprawdzony miesiąc (klucz "YYYY-MM")
- `lastBonusCheck` (globalne) - data ostatniego sprawdzenia (raz dziennie)

## Aktualne przedmioty

### Nagrody (wymagają punktów dodatnich)

| ID | Nazwa | Koszt |
|----|-------|-------|
| `beer_meeting` | Piwne spotkanie | 40 |
| `coffee_served` | Kawa na życzenie | 20 |

### Kary (wymagają punktów ujemnych)

| ID | Nazwa | Wymaga |
|----|-------|--------|
| `beer_apology` | Przepraszam piwem | -50 |
| `pizza_time` | Pizza time! | -30 |
| `coffe_beans` | Sudo Coffee | -30 |
| `tea_bags` | Sir it's Tea | -30 |
| `cake_team` | There really was a cake... | -30 |
| `donuts_team` | Pączki dla zespołu | -20 |
| `dance_break` | Taneczna przerwa | -20 |
| `gym_session` | Sesja na siłowni | -20 |
| `karaoke` | Karaoke solo | -20 |
| `silly_hat` | Czapka wstydu | -10 |
| `joke_day` | Dzień dowcipów | -10 |
| `apologize` | Moja wina! | -5 |

## Dodawanie nowego przedmiotu

```javascript
// shop-items.js - dodaj do SHOP_ITEMS

// Nowa nagroda
{
    id: "new_reward",           // Unikalny ID (snake_case)
    name: "Nazwa nagrody",
    description: "Co gracz dostaje",
    cost: 25,                   // Dodatni = nagroda
    icon: "🎁",
    type: "reward",
    category: "personal"        // team, personal, fun
}

// Nowa kara
{
    id: "new_penalty",
    name: "Nazwa kary",
    description: "Co gracz musi zrobić",
    cost: -20,                  // Ujemny = kara
    icon: "⚡",
    type: "penalty",
    category: "fun"
}
```

## CSS klasy

| Klasa | Opis |
|-------|------|
| `.shop-item-card.reward` | Karta nagrody (zielone obramowanie) |
| `.shop-item-card.penalty` | Karta kary (czerwone obramowanie) |
| `.shop-item-card.used-this-month` | Przedmiot już użyty w miesiącu |
| `.used-badge` | Znaczek "Użyte" |
| `.btn-success` | Przycisk nagrody |
| `.btn-warning` | Przycisk kary |
