# System Osiągnięć

## Przegląd

System automatycznie przyznaje osiągnięcia na podstawie zdefiniowanych warunków. Osiągnięcia dzielą się na:
- **Indywidualne** - przyznawane konkretnemu graczowi
- **Zespołowe** - przyznawane całemu zespołowi

## Struktura osiągnięcia

```javascript
{
    id: "first_swear",                    // Unikalny identyfikator
    name: "Inicjacja",                    // Nazwa wyświetlana
    description: "Pierwsze przekleństwo", // Opis jak zdobyć
    icon: "🎯",                           // Emoji
    condition: (playerData, allData, playerName) => boolean
}
```

## Funkcja warunku

### Parametry

| Parametr | Typ | Opis |
|----------|-----|------|
| `playerData` | Object | Dane gracza (`data.players[name]`) |
| `allData` | Object | Wszystkie dane (`data`) - dostęp do `purchases`, innych graczy |
| `playerName` | String | Nazwa gracza (przydatne przy filtrach zakupów) |

### Przykłady warunków

```javascript
// Prosty - licznik przekleństw
condition: (player) => (player.swearCount || 0) >= 10

// Bilans punktów
condition: (player) => calculatePlayerTotal(player) >= 20

// Sprawdzenie zakupów gracza
condition: (player, allData, playerName) => {
    const purchases = allData.purchases || [];
    return purchases.filter(p =>
        p.player === playerName && p.type === 'penalty'
    ).length >= 5;
}

// Sprawdzenie wszystkich zakupów
condition: (player, allData) => {
    return (allData.purchases || []).some(p => p.type === 'reward');
}

// Zespołowe - suma wszystkich graczy
condition: (allData) => {
    const totalSwears = Object.values(allData.players || {})
        .reduce((sum, p) => sum + (p.swearCount || 0), 0);
    return totalSwears >= 100;
}
```

## Przepływ przyznawania

```
┌─────────────────────────────────────────────────────────────┐
│              checkAndAwardAchievements(playerName)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Pobierz dane gracza: getData().players[playerName]      │
│                                                             │
│  2. Pobierz już przyznane: getAwardedAchievements()         │
│                                                             │
│  3. Dla każdego INDIVIDUAL_ACHIEVEMENTS:                    │
│     ├─ Czy już przyznane? → pomiń                           │
│     ├─ Sprawdź condition(playerData, allData, playerName)   │
│     └─ Jeśli true → dodaj do awarded.individual[player]     │
│                                                             │
│  4. Dla każdego TEAM_ACHIEVEMENTS:                          │
│     ├─ Czy już przyznane? → pomiń                           │
│     ├─ Sprawdź condition(allData)                           │
│     └─ Jeśli true → dodaj do awarded.team                   │
│                                                             │
│  5. Zapisz: saveAwardedAchievements(awarded)                │
│                                                             │
│  6. Zwróć tablicę nowo przyznanych (do powiadomień)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Kiedy sprawdzane są osiągnięcia

### app.js - po dodaniu przekleństwa
```javascript
function handleClick(playerName, cardElement) {
    addSwear(playerName);
    // ...
    const newAchievements = checkAndAwardAchievements(playerName);
    newAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
    });
}
```

### shop.js - po zakupie
```javascript
async function completePurchase() {
    // ... zapis zakupu ...
    if (typeof checkAndAwardAchievements === 'function') {
        const newAchievements = checkAndAwardAchievements(selectedPlayer);
        newAchievements.forEach(achievement => {
            showAchievementNotification(achievement);
        });
    }
}
```

## Funkcje API (achievements.js)

### Zarządzanie osiągnięciami
```javascript
getAwardedAchievements()              // Pobierz wszystkie przyznane
saveAwardedAchievements(awarded)      // Zapisz przyznane
checkAndAwardAchievements(playerName) // Sprawdź i przyznaj
checkAllPlayersAchievements()         // Sprawdź dla wszystkich graczy
```

### Pobieranie definicji
```javascript
getAllIndividualAchievements()        // Tablica INDIVIDUAL_ACHIEVEMENTS
getAllTeamAchievements()              // Tablica TEAM_ACHIEVEMENTS
```

### Pobieranie przyznanych
```javascript
getPlayerAwardedAchievements(playerName)  // Osiągnięcia gracza (z definicjami)
getTeamAwardedAchievements()              // Osiągnięcia zespołu (z definicjami)
```

### Sprawdzanie
```javascript
hasAchievement(playerName, achievementId)  // Czy gracz ma osiągnięcie
teamHasAchievement(achievementId)          // Czy zespół ma osiągnięcie
getPlayerAchievementStats(playerName)      // { earned, total, percentage }
```

### UI
```javascript
showAchievementNotification(achievement)   // Pokazuje toast z osiągnięciem
```

## Aktualne osiągnięcia indywidualne

| ID | Nazwa | Warunek |
|----|-------|---------|
| `first_swear` | Inicjacja | swearCount >= 1 |
| `ten_swears` | Początkujący | swearCount >= 10 |
| `twenty_five_swears` | Regularny | swearCount >= 25 |
| `fifty_swears` | Weteran | swearCount >= 50 |
| `hundred_swears` | Legenda | swearCount >= 100 |
| `first_penalty` | Pokutnik | Wykonano karę |
| `first_reward` | Nagrodzony | Odebrano nagrodę |
| `positive_balance` | W Plusie | bilans > 0 |
| `ten_positive` | Dobra Passa | bilans >= 10 |
| `twenty_positive` | Wzorowy | bilans >= 20 |
| `fifty_positive` | Święty | bilans >= 50 |
| `deep_negative` | Dno | bilans <= -50 |
| `comeback` | Powrót | swearCount > 0 && bilans > 0 |
| `clean_week` | Święty Tydzień | rewardedInactiveWeeks >= 1 |
| `clean_month` | Święty Miesiąc | lastMonthBonusCheck !== null |
| `five_penalties` | Mistrz Pokuty | 5 wykonanych kar |

## Aktualne osiągnięcia zespołowe

| ID | Nazwa | Warunek |
|----|-------|---------|
| `team_first` | Start | suma przekleństw >= 1 |
| `team_fifty` | Połowa Setki | suma >= 50 |
| `team_hundred` | Setka Zespołowa | suma >= 100 |
| `team_five_hundred` | Pięćsetka | suma >= 500 |
| `team_thousand` | Tysiąc Wentyli | suma >= 1000 |
| `all_participated` | Wszyscy na Pokładzie | każdy ma min. 1 |
| `first_shop_use` | Sklep Otwarty | purchases.length >= 1 |
| `ten_transactions` | Stali Klienci | purchases.length >= 10 |

## Osiągnięcia dynamiczne (Mistrz Miesiąca/Roku)

Osiągnięcia za wygrane miesiące i lata są przyznawane automatycznie podczas resetu miesięcznego.

### Mistrz Miesiąca

| Przykładowe ID | Nazwa | Warunek |
|----------------|-------|---------|
| `month_champion_2024-12` | Mistrz Grudnia 2024 | Najmniej przekleństw w miesiącu |

**Logika wyboru zwycięzcy:**
1. Sortuj graczy po liczbie przekleństw w danym miesiącu (rosnąco)
2. Przy remisie: wygrywa osoba z wyższym bilansem punktów
3. Sprawdzane na początku nowego miesiąca (dla poprzedniego miesiąca)

**Funkcje:**
- `checkMonthWinner(data)` - sprawdza i przyznaje (shop.js)
- `awardMonthChampion(playerName, monthKey)` - przyznaje osiągnięcie (achievements.js)
- `getPlayerMonthChampionAchievements(playerName)` - pobiera osiągnięcia gracza

### Mistrz Roku

| Przykładowe ID | Nazwa | Warunek |
|----------------|-------|---------|
| `year_champion_2024` | Mistrz Roku 2024 | Najmniej przekleństw w roku |

**Logika wyboru zwycięzcy:**
1. Sortuj graczy po liczbie przekleństw w danym roku (rosnąco)
2. Przy remisie: wygrywa osoba z wyższym bilansem punktów
3. Sprawdzane **tylko w styczniu** (dla poprzedniego roku)

**Funkcje:**
- `checkYearWinner(data)` - sprawdza i przyznaje (shop.js)
- `awardYearChampion(playerName, yearKey)` - przyznaje osiągnięcie (achievements.js)
- `getPlayerYearChampionAchievements(playerName)` - pobiera osiągnięcia gracza

### Konfiguracja ikon miesięcy

Plik `month-icons.js` zawiera konfigurację ikon dla każdego miesiąca:

```javascript
const MONTH_ICONS = {
    '01': { icon: '🏆', image: null },  // Styczeń
    '02': { icon: '🏆', image: null },  // Luty
    // ... etc
};
```

Aby użyć własnej grafiki: `image: 'image/month-january.png'`

## Dodawanie nowego osiągnięcia

### Indywidualne
```javascript
// achievements.js - dodaj do INDIVIDUAL_ACHIEVEMENTS

{
    id: "super_curser",              // Unikalny ID
    name: "Super Przeklinacz",
    description: "200 przekleństw łącznie",
    icon: "💀",
    condition: (player) => (player.swearCount || 0) >= 200
}

// Z dostępem do zakupów
{
    id: "big_spender",
    name: "Wydawca",
    description: "Wydaj 100 punktów na nagrody",
    icon: "💰",
    condition: (player) => (player.spentOnRewards || 0) >= 100
}
```

### Zespołowe
```javascript
// achievements.js - dodaj do TEAM_ACHIEVEMENTS

{
    id: "quiet_month",
    name: "Cichy Miesiąc",
    description: "Mniej niż 20 przekleństw w miesiącu",
    icon: "🤫",
    condition: (allData) => {
        const monthKey = getCurrentMonthKey();
        const monthlyTotal = Object.values(allData.players || {})
            .reduce((sum, p) => sum + (p.monthly?.[monthKey] || 0), 0);
        return monthlyTotal < 20;
    }
}
```

## Powiadomienie o osiągnięciu

```javascript
function showAchievementNotification(achievement) {
    // Tworzy element .achievement-notification
    // Animacja: slide-in z prawej
    // Auto-hide po 4 sekundach
}
```

### CSS klasy
- `.achievement-notification` - kontener powiadomienia
- `.achievement-notification.show` - stan widoczny (transform)
- `.achievement-icon` - emoji osiągnięcia
- `.achievement-info` - kontener tekstów
- `.achievement-title` - "Nowe osiągnięcie!"
- `.achievement-name` - nazwa osiągnięcia

## Strona trofeów (trophies.html / trophies.js)

### Sekcje
1. **Trofea zespołowe** - `renderTeamTrophies()`
2. **Trofea gracza** - `renderPlayerTrophies(playerName)` + zakładki
3. **Legenda** - `renderLegend()` - wszystkie dostępne osiągnięcia

### Wyświetlanie
- Tylko zdobyte osiągnięcia są pokazywane (nie ma "locked")
- Pasek postępu: `earned/total (percentage%)`
- Data zdobycia formatowana po polsku

## Synchronizacja osiągnięć

Osiągnięcia są synchronizowane razem z danymi głównymi:
- Plik w Gist: `bluzniodmuch_achievements.json`
- Strategia scalania: union bez duplikatów (po ID osiągnięcia)
- Funkcja: `mergeAchievements(local, remote)` w sync.js
