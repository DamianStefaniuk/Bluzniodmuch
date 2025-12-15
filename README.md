# Bluzniodmuch

Aplikacja webowa do gamifikacji słoiczka na przekleństwa dla Zespołu Wentylacji.

## Funkcjonalności

- **Tablica wyników** - ranking graczy z podziałem na miesiąc, rok i ogółem
- **Kliker** - każdy gracz może dodawać swoje przekleństwa jednym kliknięciem
- **Sklep fantów** - wydawaj punkty przekleństw na fanty/kary dla zespołu
- **System statusów** - dynamiczne statusy graczy na podstawie liczby punktów
- **System bonusów** - automatyczne odejmowanie punktów za nieaktywność
- **System trofeów** - osiągnięcia indywidualne i zespołowe
- **Statystyki zespołu** - podsumowanie aktywności zespołu

## Gracze

- Jacek
- Mateusz
- Tomek
- Karol
- Damian

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
├── shop.html           # Sklep fantów
├── trophies.html       # Strona z trofeami
├── settings.html       # Strona ustawień i synchronizacji
├── css/
│   └── style.css       # Style aplikacji
├── js/
│   ├── data.js         # Zarządzanie danymi (localStorage)
│   ├── sync.js         # Synchronizacja z GitHub Gist
│   ├── app.js          # Logika głównej strony
│   ├── shop-items.js   # Definicje fantów i statusów (EDYTUJ TEN PLIK!)
│   ├── shop.js         # Logika sklepu
│   ├── achievements.js # Definicje osiągnięć (EDYTUJ TEN PLIK!)
│   ├── trophies.js     # Logika strony trofeów
│   └── settings.js     # Logika strony ustawień
└── README.md
```

## Przechowywanie danych

Dane mogą być przechowywane na dwa sposoby:

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
- Po każdym kliknięciu (dodaniu przekleństwa) dane są synchronizowane
- Konflikty są rozwiązywane przez wzięcie większej wartości (żaden klik nie zostanie utracony)
- Wskaźnik synchronizacji w nagłówku pokazuje status połączenia

## Przyznawanie osiągnięć

Osiągnięcia przyznaje się ręcznie poprzez edycję pliku `js/achievements.js`.

### Jak dodać osiągnięcie dla gracza:

1. Otwórz plik `js/achievements.js`
2. Znajdź sekcję `AWARDED_ACHIEVEMENTS`
3. Dodaj nowy wpis:

```javascript
const AWARDED_ACHIEVEMENTS = [
    {
        type: "individual",
        achievementId: "first_swear",  // ID osiągnięcia
        player: "Damian",              // Nazwa gracza
        date: "2025-01-15",            // Data przyznania
        note: "Komentarz opcjonalny"   // Opcjonalna notatka
    },
    // ... więcej osiągnięć
];
```

### Jak dodać osiągnięcie zespołowe:

```javascript
{
    type: "team",
    achievementId: "team_hundred",
    date: "2025-02-01",
    note: "Setka w pierwszy miesiąc!"
}
```

### Dostępne ID osiągnięć indywidualnych:

| ID | Nazwa | Opis |
|---|---|---|
| `first_swear` | Inicjacja | Pierwsze przekleństwo |
| `ten_swears` | Początkujący | 10 przekleństw łącznie |
| `fifty_swears` | Weteran | 50 przekleństw łącznie |
| `hundred_swears` | Legenda | 100 przekleństw łącznie |
| `month_champion` | Mistrz Miesiąca | Pierwsze miejsce w miesiącu |
| `year_champion` | Mistrz Roku | Pierwsze miejsce na koniec roku |
| `monday_starter` | Poniedziałkowy Blues | 5 przekleństw w poniedziałek |
| `friday_finisher` | Piątkowe Wentylowanie | Najwięcej w piątek |
| `clean_week` | Święty Tydzień | Tydzień bez przekleństwa |
| `triple_threat` | Potrójne Uderzenie | 3 w ciągu minuty |
| `early_bird` | Ranny Ptaszek | Przed 8:00 |
| `night_owl` | Nocna Sowa | Po 18:00 |
| `comeback_king` | Król Powrotu | Z ostatniego na pierwsze |
| `consistent` | Konsekwentny | Codziennie przez tydzień |
| `humble` | Skromny | Najmniej w miesiącu |

### Dostępne ID osiągnięć zespołowych:

| ID | Nazwa | Opis |
|---|---|---|
| `team_hundred` | Setka Zespołowa | 100 łącznie |
| `team_five_hundred` | Pięćsetka | 500 łącznie |
| `team_thousand` | Tysiąc Wentyli | 1000 łącznie |
| `all_participated` | Wszyscy na Pokładzie | Każdy ma min. 1 |
| `balanced_team` | Zbalansowany Zespół | Podobne wyniki (±5) |
| `quiet_month` | Cichy Miesiąc | <20 w miesiącu |
| `loud_month` | Głośny Miesiąc | >100 w miesiącu |
| `first_month` | Pierwszy Miesiąc | Pierwszy pełny miesiąc |
| `anniversary` | Rocznica | Rok prowadzenia |

## Dodawanie nowych osiągnięć

Możesz tworzyć własne osiągnięcia edytując tablice `INDIVIDUAL_ACHIEVEMENTS` lub `TEAM_ACHIEVEMENTS` w pliku `js/achievements.js`:

```javascript
{
    id: "custom_achievement",      // Unikalne ID
    name: "Nazwa Osiągnięcia",     // Wyświetlana nazwa
    description: "Jak je zdobyć",  // Opis
    icon: "🎯"                     // Emoji jako ikona
}
```

## Sklep fantów

Gracze mogą "odkupywać" swoje grzechy wydając zebrane punkty przekleństw na fanty/kary.

### Jak to działa?

1. Każde przekleństwo = 1 punkt
2. Punkty można wydać w sklepie na fanty
3. Wydane punkty są odejmowane od salda gracza
4. Historia zakupów jest zapisywana

### Kategorie fantów

- **Zespołowe** - pizza, ciasto, kawa dla wszystkich
- **Osobiste** - sprzątanie, dyżury, obowiązki
- **Zabawne** - czapka wstydu, taniec, karaoke

### Dodawanie własnych fantów

Edytuj plik `js/shop-items.js` i dodaj do tablicy `SHOP_ITEMS`:

```javascript
{
    id: "custom_fant",
    name: "Nazwa fantu",
    description: "Co trzeba zrobić",
    cost: 25,
    icon: "🎁",
    category: "team"  // team, personal lub fun
}
```

## System statusów

Każdy gracz ma status zależny od liczby punktów (po odjęciu wydanych):

| Status | Ikona | Punkty |
|--------|-------|--------|
| Święty | 😇 | 0 |
| Grzeczny | 😊 | 1-5 |
| Neutralny | 😐 | 6-15 |
| Gorsze dni | 😤 | 16-30 |
| Niegrzeczny | 🤬 | 31-50 |
| Przeklinator | 👹 | 51+ |

## System bonusów

Aplikacja automatycznie nagradza za dobre zachowanie:

| Bonus | Wartość |
|-------|---------|
| Dzień bez przekleństwa | -1 punkt |
| Cały miesiąc bez przekleństwa | -10 punktów (dodatkowo) |

Bonusy są naliczane automatycznie przy każdym odwiedzeniu strony.

## Autorzy

Zespół Wentylacji, 2025
