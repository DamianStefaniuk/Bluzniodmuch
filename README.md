# Bluzniodmuch

Aplikacja webowa do gamifikacji "słoiczka na przekleństwa" dla Zespołu Wentylacji.

## Funkcjonalności

- **Tablica wyników** - ranking graczy z podziałem na miesiąc, rok i ogółem
- **Kliker przekleństw** - każdy zalogowany gracz może dodawać przekleństwa jednym kliknięciem
- **Sklep nagród i kar** - odbieraj nagrody za punkty dodatnie lub wykonuj kary za punkty ujemne
- **System punktacji** - bilans punktów oparty na składnikach (przekleństwa, nagrody, kary, bonusy)
- **System autoryzacji** - tylko zalogowani użytkownicy mogą dodawać przekleństwa i korzystać ze sklepu
- **System statusów** - dynamiczne statusy graczy na podstawie bilansu punktów
- **System bonusów** - automatyczne punkty za dni/tygodnie/miesiące bez przekleństw
- **System trofeów** - osiągnięcia indywidualne i zespołowe
- **Synchronizacja** - dane synchronizowane między urządzeniami przez GitHub Gist

## Gracze

- Jacek
- Mateusz
- Tomek
- Karol
- Damian (Administrator)

## System punktacji

### Jak działa bilans punktów?

Bilans każdego gracza jest obliczany ze składników:

```
bilans = bonusy + punkty_z_kar - przekleństwa - wydane_na_nagrody
```

| Akcja | Wpływ na bilans |
|-------|-----------------|
| Przekleństwo | -1 pkt |
| Dzień bez przekleństwa | +1 pkt |
| Tydzień bez przekleństwa | +5 pkt (dodatkowo) |
| Miesiąc bez przekleństwa | +10 pkt (dodatkowo) |
| Odebranie nagrody | -koszt nagrody |
| Wykonanie kary | +wartość kary |

### Nagrody vs Kary

- **Nagrody** - dostępne gdy masz punkty dodatnie. Odbierając nagrodę, wydajesz punkty.
- **Kary** - dostępne gdy masz punkty ujemne. Wykonując karę, poprawiasz swój bilans.

## System statusów

Każdy gracz ma status zależny od bilansu punktów:

| Status | Ikona | Bilans punktów |
|--------|-------|----------------|
| Święty | 😇 | 50+ pkt |
| Grzeczny | 😊 | 20-49 pkt |
| W normie | 🙂 | 1-19 pkt |
| Neutralny | 😐 | 0 do -9 pkt |
| Gorsze dni | 😤 | -10 do -30 pkt |
| Niegrzeczny | 🤬 | -31 do -50 pkt |
| Przeklinator | 👹 | -51 i mniej |

## Uruchomienie

### GitHub Pages

1. Przejdź do ustawień repozytorium (Settings)
2. W sekcji "Pages" wybierz źródło: "Deploy from a branch"
3. Wybierz branch `main` i folder `/ (root)`
4. Zapisz - strona będzie dostępna pod adresem `https://<username>.github.io/Bluzniodmuch/`

### Lokalnie

Po prostu otwórz plik `index.html` w przeglądarce.

## Struktura projektu

```
Bluzniodmuch/
├── index.html          # Główna strona z tablicą wyników i klikerami
├── shop.html           # Sklep nagród i kar
├── trophies.html       # Strona z trofeami
├── settings.html       # Strona ustawień i synchronizacji
├── css/
│   └── style.css       # Style aplikacji
├── js/
│   ├── data.js         # Zarządzanie danymi (localStorage)
│   ├── sync.js         # Synchronizacja z GitHub Gist + autoryzacja
│   ├── app.js          # Logika głównej strony
│   ├── shop-items.js   # Definicje nagród, kar i statusów
│   ├── shop.js         # Logika sklepu
│   ├── achievements.js # Definicje osiągnięć
│   ├── trophies.js     # Logika strony trofeów
│   └── settings.js     # Logika strony ustawień
├── image/              # Grafiki i ikony
│   └── title-swear-jar.svg  # Favicon
└── README.md
```

## Przechowywanie danych

### Struktura danych gracza

```javascript
{
    swearCount: 0,           // Liczba przekleństw
    spentOnRewards: 0,       // Punkty wydane na nagrody
    earnedFromPenalties: 0,  // Punkty zdobyte z kar
    bonusGained: 0,          // Punkty z bonusów
    monthly: {},             // Przekleństwa miesięczne
    yearly: {},              // Przekleństwa roczne
    lastActivity: null,      // Data ostatniego przekleństwa
    rewardedInactiveDays: 0, // Nagrodzone dni nieaktywności
    rewardedInactiveWeeks: 0,// Nagrodzone tygodnie nieaktywności
    lastMonthBonusCheck: null // Ostatni sprawdzony miesiąc
}
```

### Tryb lokalny (domyślny)
- Dane są zapisywane w **localStorage** przeglądarki
- Każda przeglądarka/urządzenie ma osobne dane
- Wyczyszczenie danych przeglądarki usunie postępy

### Tryb zsynchronizowany (GitHub Gist)
- Dane są synchronizowane między wszystkimi urządzeniami
- Wymaga jednorazowej konfiguracji tokena GitHub
- Automatyczna synchronizacja przy każdej akcji

## Konfiguracja synchronizacji (GitHub Gist)

Aby współdzielić dane między urządzeniami:

### 1. Utwórz Personal Access Token

1. Przejdź do [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens/new)
2. Kliknij **"Generate new token (classic)"**
3. Nadaj nazwę np. "Bluzniodmuch"
4. Zaznacz uprawnienie **`gist`**
5. Kliknij **"Generate token"** i **skopiuj token** (zobaczysz go tylko raz!)

### 2. Skonfiguruj aplikację

1. Otwórz stronę i przejdź do zakładki **"Ustawienia"**
2. Wklej skopiowany token
3. Kliknij **"Utwórz nowy Gist"** (pierwszy raz) lub podaj Gist ID (kolejne urządzenia)

### 3. Na kolejnych urządzeniach

1. Otwórz stronę i przejdź do **"Ustawienia"**
2. Wklej ten sam token
3. Wklej **Gist ID** (znajdziesz go w ustawieniach pierwszego urządzenia lub w URL Gista)
4. Kliknij **"Połącz z GitHub"**

### Jak działa synchronizacja?

- Przy ładowaniu strony dane są automatycznie pobierane z Gist
- Po każdej akcji (przekleństwo, zakup) dane są synchronizowane z opóźnieniem 2s
- Wskaźnik synchronizacji w stopce pokazuje status połączenia

### Strategia scalania danych

| Pole | Strategia |
|------|-----------|
| `swearCount` | Większa wartość (więcej przekleństw) |
| `spentOnRewards` | Większa wartość (więcej wydanych) |
| `earnedFromPenalties` | Większa wartość (więcej zdobytych) |
| `bonusGained` | Większa wartość (więcej bonusów) |
| `monthly/yearly` | Większa wartość dla każdego klucza |
| `purchases` | Scalanie list bez duplikatów (po ID) |
| `lastActivity` | Nowsza data |

Dzięki tej strategii **żadne dane nie zostaną utracone** przy synchronizacji między urządzeniami.

## Sklep nagród i kar

### Nagrody (punkty dodatnie)

Gracze z dodatnim bilansem mogą odbierać nagrody:
- **Zespołowe** - pizza, ciasto, kawa dla wszystkich
- **Osobiste** - wolne od obowiązków, priorytet wyboru

### Kary (punkty ujemne)

Gracze z ujemnym bilansem mogą poprawić status wykonując kary:
- **Zadania** - sprzątanie, dyżury
- **Zabawne** - czapka wstydu, taniec, karaoke

### Dodawanie własnych nagród/kar

Edytuj plik `js/shop-items.js`:

```javascript
// Nagrody (cost > 0)
{
    id: "custom_reward",
    name: "Nazwa nagrody",
    description: "Co dostajesz",
    cost: 25,        // Koszt w punktach
    icon: "🎁",
    type: "reward"
}

// Kary (cost < 0)
{
    id: "custom_penalty",
    name: "Nazwa kary",
    description: "Co musisz zrobić",
    cost: -15,       // Wymagane ujemne punkty
    icon: "⚡",
    type: "penalty"
}
```

## System trofeów

### Przyznawanie osiągnięć

Osiągnięcia przyznaje się poprzez edycję pliku `js/achievements.js`:

```javascript
const AWARDED_ACHIEVEMENTS = [
    {
        type: "individual",
        achievementId: "first_swear",
        player: "Damian",
        date: "2025-01-15",
        note: "Komentarz opcjonalny"
    },
    {
        type: "team",
        achievementId: "team_hundred",
        date: "2025-02-01"
    }
];
```

### Dostępne osiągnięcia indywidualne

| ID | Nazwa | Opis |
|---|---|---|
| `first_swear` | Inicjacja | Pierwsze przekleństwo |
| `ten_swears` | Początkujący | 10 przekleństw łącznie |
| `fifty_swears` | Weteran | 50 przekleństw łącznie |
| `hundred_swears` | Legenda | 100 przekleństw łącznie |
| `month_champion` | Mistrz Miesiąca | Pierwsze miejsce w miesiącu |
| `year_champion` | Mistrz Roku | Pierwsze miejsce na koniec roku |
| `clean_week` | Święty Tydzień | Tydzień bez przekleństwa |
| `humble` | Skromny | Najmniej w miesiącu |

### Dostępne osiągnięcia zespołowe

| ID | Nazwa | Opis |
|---|---|---|
| `team_hundred` | Setka Zespołowa | 100 łącznie |
| `team_five_hundred` | Pięćsetka | 500 łącznie |
| `team_thousand` | Tysiąc Wentyli | 1000 łącznie |
| `all_participated` | Wszyscy na Pokładzie | Każdy ma min. 1 |
| `quiet_month` | Cichy Miesiąc | <20 w miesiącu |

### Dodawanie własnych osiągnięć

```javascript
{
    id: "custom_achievement",
    name: "Nazwa Osiągnięcia",
    description: "Jak je zdobyć",
    icon: "🎯"
}
```

## Technologie

- HTML5
- CSS3 (zmienne CSS, Flexbox, Grid)
- JavaScript (ES6+, async/await)
- GitHub Gist API (synchronizacja)
- localStorage (dane lokalne)

## Autorzy

Zespół Wentylacji, 2025
