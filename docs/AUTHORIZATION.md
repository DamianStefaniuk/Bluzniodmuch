# System Autoryzacji

## Przegląd

System autoryzacji opiera się na:
1. **GitHub Personal Access Token** - uwierzytelnienie z GitHub API
2. **Mapowanie użytkowników** - GitHub username → nazwa gracza
3. **Wybór profilu** - użytkownik wybiera gracza po zalogowaniu
4. **Role** - rozróżnienie między zwykłym użytkownikiem a administratorem

## Konfiguracja użytkowników (sync.js)

```javascript
// Administratorzy - dostęp do zarządzania danymi
const ADMIN_USERS = ['DamianStefaniuk'];

// Dozwoleni użytkownicy - mapowanie GitHub username → gracz
const ALLOWED_USERS = {
    'DamianStefaniuk': 'Damian',
    'jacek4468': 'Jacek',
    'MateuszCzajkowskiPlum': 'Mateusz',
    'tomaszkozlow': 'Tomek',
    'BarolKartoszuk': 'Karol'
};
```

## Przepływ logowania

```
┌─────────────────────────────────────────────────────────────┐
│                    Strona ustawień                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Użytkownik wkleja GitHub Token                          │
│                                                             │
│  2. testConnection(token):                                  │
│     GET https://api.github.com/user                         │
│     → zwraca GitHub username                                │
│                                                             │
│  3. saveSyncConfig(gistId, token, username)                 │
│     Zapisuje do localStorage:                               │
│     - bluzniodmuch_gist_id                                  │
│     - bluzniodmuch_github_token                             │
│     - bluzniodmuch_github_username                          │
│                                                             │
│  4. Użytkownik wybiera gracza z dropdown                    │
│     saveSelectedPlayer(playerName)                          │
│     → bluzniodmuch_selected_player                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Funkcje autoryzacji (sync.js)

### Sprawdzanie stanu

```javascript
isSyncConfigured()     // Czy token i gist_id są ustawione
isAuthorizedUser()     // Czy wybrany gracz jest w PLAYERS
isAdmin()              // Czy GitHub username jest w ADMIN_USERS
```

### Pobieranie danych

```javascript
getGithubUsername()         // GitHub username z localStorage
getSelectedPlayer()         // Wybrany profil gracza
getPlayerNameFromGithub()   // Alias dla getSelectedPlayer()
getAvailablePlayers()       // Lista wszystkich graczy (PLAYERS)
```

### Zarządzanie

```javascript
saveGithubUsername(username)    // Zapisz GitHub username
saveSelectedPlayer(playerName)  // Zapisz wybranego gracza
clearSelectedPlayer()           // Wyczyść wybranego gracza
clearSyncConfig()               // Wyczyść całą konfigurację sync
```

## Uprawnienia w aplikacji

### Niezalogowany użytkownik

| Funkcja | Dostęp |
|---------|--------|
| Przeglądanie tablicy wyników | ✅ |
| Przeglądanie sklepu | ✅ |
| Przeglądanie trofeów | ✅ |
| Dodawanie przekleństw | ❌ (overlay z info) |
| Zakupy w sklepie | ❌ (overlay z info) |
| Zarządzanie danymi | ❌ (ukryte lub info) |

### Zalogowany użytkownik (nie-admin)

| Funkcja | Dostęp |
|---------|--------|
| Wszystko powyżej | ✅ |
| Dodawanie przekleństw | ✅ |
| Zakupy w sklepie (dla siebie) | ✅ |
| Zarządzanie danymi | ❌ (sekcja ukryta) |

### Administrator

| Funkcja | Dostęp |
|---------|--------|
| Wszystko powyżej | ✅ |
| Eksport danych | ✅ |
| Import danych | ✅ |
| Reset danych | ✅ |
| Reset osiągnięć | ✅ |

## Implementacja w UI

### Główna strona (app.js)

```javascript
function renderClickers() {
    const isUserAuthorized = isAuthorizedUser();
    const currentPlayerName = getPlayerNameFromGithub();

    // Overlay dla niezalogowanych
    if (!isUserAuthorized) {
        // Pokazuje overlay z linkiem do ustawień
    }

    // Podświetlenie karty aktualnego gracza
    const isCurrentPlayer = player === currentPlayerName;
    card.className = 'clicker-card' +
        (isCurrentPlayer ? ' current-player' : '') +
        (!isUserAuthorized ? ' disabled' : '');
}
```

### Sklep (shop.js)

```javascript
function renderPlayerSelector() {
    if (!isAuthorizedUser()) {
        // Overlay z info o logowaniu
        return;
    }

    // Automatyczne zaznaczenie zalogowanego gracza
    // Zablokowanie wyboru innych graczy (.locked)
}

function openPurchaseModal(item) {
    if (!isAuthorizedUser() || !selectedPlayer) {
        showNotification('Musisz być zalogowany...');
        return;
    }
}
```

### Ustawienia (settings.js)

```javascript
function updateDataManagementAccess() {
    if (isSyncConfigured() && isAdmin()) {
        // Pokaż sekcję zarządzania danymi
    } else if (isSyncConfigured()) {
        // Ukryj całą sekcję (nie-admin)
    } else {
        // Pokaż info o wymaganiu logowania
    }
}
```

## CSS klasy autoryzacji

| Klasa | Opis |
|-------|------|
| `.auth-overlay` | Overlay blokujący dostęp |
| `.auth-overlay-content` | Zawartość overlay |
| `.auth-overlay-icon` | Ikona kłódki |
| `.auth-overlay-text` | Tekst informacyjny |
| `.clicker-card.disabled` | Wyszarzona karta klikera |
| `.clicker-card.current-player` | Podświetlenie aktualnego gracza |
| `.player-select-btn.active` | Aktywny (wybrany) gracz |
| `.player-select-btn.locked` | Zablokowany wybór innego gracza |
| `.admin-badge` | Plakietka "Admin" |

## Dodawanie nowego użytkownika

1. Dodaj gracza do `PLAYERS` w `data.js`:
```javascript
const PLAYERS = ['Jacek', 'Mateusz', 'Tomek', 'Karol', 'Damian', 'NowyGracz'];
```

2. Dodaj mapowanie w `sync.js`:
```javascript
const ALLOWED_USERS = {
    // ... istniejące mapowania ...
    'github_username_nowego': 'NowyGracz'
};
```

3. Opcjonalnie - dodaj do administratorów:
```javascript
const ADMIN_USERS = ['DamianStefaniuk', 'github_username_nowego'];
```

## Bezpieczeństwo

### Token GitHub
- Przechowywany w localStorage (tylko lokalnie)
- Wymagane uprawnienie: `gist` (minimalne)
- Automatycznie trimowany przy zapisie/odczycie

### Walidacja
- Token sprawdzany przez `testConnection()` przed zapisem
- Błędne tokeny są odrzucane z komunikatem

### Ograniczenia
- Użytkownik może działać tylko jako wybrany gracz
- Nie ma możliwości podszywania się pod innego gracza
- Zakupy są zapisywane z nazwą wybranego gracza

## Diagram przepływu autoryzacji

```
                    ┌─────────────────┐
                    │   Użytkownik    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ isSyncConfigured│
                    │      ()?        │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │ false                  true │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │  Tryb offline   │           │ isAuthorizedUser│
    │ (tylko podgląd) │           │      ()?        │
    └─────────────────┘           └────────┬────────┘
                                           │
                            ┌──────────────┴──────────────┐
                            │ false                  true │
                            ▼                             ▼
                  ┌─────────────────┐           ┌─────────────────┐
                  │ Wybierz gracza  │           │    isAdmin()?   │
                  │ (settings.html) │           └────────┬────────┘
                  └─────────────────┘                    │
                                          ┌─────────────┴─────────────┐
                                          │ false                true │
                                          ▼                           ▼
                                ┌─────────────────┐         ┌─────────────────┐
                                │  Zwykły dostęp  │         │  Pełny dostęp   │
                                │  (bez admina)   │         │  (z adminem)    │
                                └─────────────────┘         └─────────────────┘
```
