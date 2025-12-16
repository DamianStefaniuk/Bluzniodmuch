# System Synchronizacji

## Przegląd

System synchronizacji wykorzystuje GitHub Gist API do przechowywania i współdzielenia danych między urządzeniami. Dane są zapisywane jako pliki JSON w prywatnym Gist.

## Pliki w Gist

| Nazwa pliku | Zawartość |
|-------------|-----------|
| `bluzniodmuch_data.json` | Główne dane (gracze, zakupy) |
| `bluzniodmuch_achievements.json` | Przyznane osiągnięcia |

## Przepływ synchronizacji

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ localStorage│     │   sync.js   │     │ GitHub Gist │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │   getData()       │                   │
       │◄──────────────────│                   │
       │                   │                   │
       │                   │  fetchFromGist()  │
       │                   │──────────────────►│
       │                   │                   │
       │                   │   remote data     │
       │                   │◄──────────────────│
       │                   │                   │
       │                   │ mergeAllData()    │
       │                   │ (local + remote)  │
       │                   │                   │
       │   saveData()      │                   │
       │◄──────────────────│                   │
       │                   │                   │
       │                   │  saveToGist()     │
       │                   │──────────────────►│
       │                   │                   │
```

## Funkcje API (sync.js)

### Konfiguracja

```javascript
isSyncConfigured()          // Czy sync jest skonfigurowany
getGistId()                 // Pobierz Gist ID
getGithubToken()            // Pobierz token (trimowany)
saveSyncConfig(gistId, token, username)  // Zapisz konfigurację
clearSyncConfig()           // Usuń konfigurację
extractGistId(input)        // Wyciągnij ID z URL lub zwróć czyste ID
```

### Operacje sync

```javascript
syncData()                  // Główna funkcja synchronizacji
fetchFromGist()             // Pobierz dane z Gist
saveToGist(scores, achievements)  // Zapisz dane do Gist
createNewGist(token, description) // Utwórz nowy Gist
testConnection(token)       // Testuj token, zwraca username
forceResetSync()            // Wymusza reset na wszystkich urządzeniach
```

### Scalanie danych

```javascript
mergeAllData(local, remote)           // Scala wszystkie dane
mergePlayerData(local, remote)        // Scala dane gracza
mergeCounters(local, remote)          // Scala liczniki (max)
mergePurchases(local, remote)         // Scala zakupy (union po ID)
mergeNewerDate(local, remote)         // Nowsza data wygrywa
mergeAchievements(local, remote)      // Scala osiągnięcia
```

## Strategie scalania

### Liczniki (swearCount, spentOnRewards, etc.)
**Strategia**: `Math.max(local, remote)`

Uzasadnienie: Większa wartość oznacza więcej wykonanych akcji, co nie może zostać cofnięte.

### Liczniki miesięczne/roczne
**Strategia**: `Math.max()` dla każdego klucza

```javascript
monthly: {
    "2025-01": Math.max(local["2025-01"], remote["2025-01"]),
    "2025-02": Math.max(local["2025-02"], remote["2025-02"])
}
```

### Daty (lastActivity, lastBonusCheck)
**Strategia**: Nowsza data wygrywa

```javascript
return localDate > remoteDate ? local : remote;
```

### Stringi czasowe (lastMonthWinnerCheck, lastYearWinnerCheck)
**Strategia**: Nowszy string wygrywa (porównanie leksykograficzne)

```javascript
// "2024-12" > "2024-11" → bierzemy "2024-12"
// "2025" > "2024" → bierzemy "2025"
```

### Tablice wygranych (monthsWon, yearsWon)
**Strategia**: Union bez duplikatów

```javascript
monthsWon: mergeArraysUnique(local.monthsWon, remote.monthsWon)
// ["2024-11"] + ["2024-12"] → ["2024-11", "2024-12"]
```

### Zakupy (purchases)
**Strategia**: Union bez duplikatów (po ID)

```javascript
// Tworzy Map z ID jako kluczem
// Lokalne zakupy + zdalne (bez nadpisywania)
// Sortuje po dacie
```

### Osiągnięcia
**Strategia**: Union bez duplikatów (po ID osiągnięcia)

## Automatyczna synchronizacja

### Przy starcie aplikacji (app.js, shop.js)
```javascript
if (isSyncConfigured()) {
    await performSync();  // lub syncData()
}
```

### Po akcji użytkownika (z debounce)
```javascript
// app.js
function scheduleSyncAfterAction() {
    if (!isSyncConfigured()) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
        await performSync();
    }, 2000);  // 2 sekundy opóźnienia
}
```

## Obsługa błędów

### Kody HTTP

| Kod | Znaczenie | Działanie |
|-----|-----------|-----------|
| 200 | OK | Sukces |
| 401 | Unauthorized | Token nieprawidłowy lub wygasły |
| 404 | Not Found | Gist nie istnieje |

### Komunikaty błędów

```javascript
// fetchFromGist()
"Gist nie został znaleziony. Sprawdź Gist ID."
"Nieprawidłowy token. Sprawdź Personal Access Token."
"Błąd pobierania danych: {status}"

// saveToGist()
"Nieprawidłowy token lub brak uprawnień do zapisu."
"Błąd zapisywania danych: {status}"

// testConnection()
"Nieprawidłowy token - sprawdź czy skopiowałeś cały token"
"Błąd sieci - sprawdź połączenie internetowe..."
```

## Wskaźnik synchronizacji (UI)

### Stany (index.html footer)

| Stan | Ikona | Tekst |
|------|-------|-------|
| Offline | ⚪ | "Offline" |
| Połączono | 🟢 | "Połączono" |
| Synchronizowanie | 🔄 | "Synchronizowanie..." |

### Interakcja
Kliknięcie wskaźnika:
- Jeśli skonfigurowany: wywołuje `performSync()`
- Jeśli nie: przekierowuje do `settings.html`

## Konfiguracja nowego urządzenia

### Pierwsze urządzenie
1. Wygeneruj Personal Access Token na GitHub (scope: `gist`)
2. Wklej token w ustawieniach
3. Kliknij "Utwórz nowy Gist"
4. Zapisz Gist ID

### Kolejne urządzenia
1. Wklej ten sam token
2. Wklej Gist ID (lub pełny URL - zostanie wyekstrahowany)
3. Kliknij "Połącz z GitHub"

## Wymuszanie resetu (Force Reset)

Mechanizm pozwalający administratorowi wymusić nadpisanie danych na wszystkich urządzeniach po imporcie.

### Jak działa

1. Administrator importuje dane przez UI w ustawieniach
2. Funkcja `forceResetSync()` ustawia `forceResetTimestamp` na aktualny czas
3. Dane są zapisywane do Gist
4. Inne urządzenia przy synchronizacji:
   - Porównują `forceResetTimestamp` zdalny vs lokalny
   - Jeśli zdalny jest nowszy → nadpisują lokalne dane (bez scalania)
   - Jeśli lokalny jest nowszy/równy → normalne scalanie

### Pole danych

```javascript
{
    players: { ... },
    purchases: [ ... ],
    forceResetTimestamp: 1702000000000  // timestamp wymuszenia
}
```

### Funkcje

```javascript
// sync.js
forceResetSync()  // Ustawia timestamp i uploaduje do Gist

// settings.js
forceUploadToGist()  // Wrapper używany po imporcie
```

### Przepływ wymuszenia resetu

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Admin      │     │   Gist      │     │ Inne urządz.│
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  import +         │                   │
       │  forceResetSync() │                   │
       │──────────────────►│                   │
       │                   │                   │
       │  forceResetTS=NOW │                   │
       │                   │                   │
       │                   │   syncData()      │
       │                   │◄──────────────────│
       │                   │                   │
       │                   │  remoteTS > local │
       │                   │  → nadpisz dane   │
       │                   │──────────────────►│
       │                   │                   │
```

## Wymagane uprawnienia tokena

- `gist` - jedyne wymagane uprawnienie

## Diagram sekwencji - pełna synchronizacja

```
User          App           sync.js        GitHub API
 │             │               │               │
 │  akcja      │               │               │
 │────────────►│               │               │
 │             │  syncData()   │               │
 │             │──────────────►│               │
 │             │               │ GET /gists/id │
 │             │               │──────────────►│
 │             │               │   remote data │
 │             │               │◄──────────────│
 │             │               │               │
 │             │               │ merge(local,  │
 │             │               │       remote) │
 │             │               │               │
 │             │               │PATCH /gists/id│
 │             │               │──────────────►│
 │             │               │     200 OK    │
 │             │               │◄──────────────│
 │             │   {success}   │               │
 │             │◄──────────────│               │
 │             │               │               │
 │             │ renderViews() │               │
 │             │               │               │
 │  UI update  │               │               │
 │◄────────────│               │               │
```
