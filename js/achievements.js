/**
 * Bluzniodmuch - Moduł osiągnięć
 *
 * Ten plik zawiera definicje wszystkich osiągnięć i trofeów.
 * Aby dodać nowe osiągnięcie, wystarczy dodać nowy wpis do odpowiedniej tablicy.
 *
 * INSTRUKCJA DODAWANIA OSIĄGNIĘĆ:
 *
 * 1. Osiągnięcia indywidualne (INDIVIDUAL_ACHIEVEMENTS):
 *    - id: unikalny identyfikator (np. "first_swear")
 *    - name: nazwa wyświetlana
 *    - description: opis jak zdobyć
 *    - icon: emoji reprezentujące osiągnięcie
 *
 * 2. Osiągnięcia zespołowe (TEAM_ACHIEVEMENTS):
 *    - podobna struktura jak indywidualne
 *
 * 3. Przyznane osiągnięcia (AWARDED_ACHIEVEMENTS):
 *    - type: "individual" lub "team"
 *    - achievementId: id osiągnięcia z powyższych list
 *    - player: nazwa gracza (tylko dla individual)
 *    - date: data przyznania (format: "YYYY-MM-DD")
 *    - note: opcjonalna notatka/komentarz
 */

// ============================================
// DEFINICJE OSIĄGNIĘĆ INDYWIDUALNYCH
// ============================================
const INDIVIDUAL_ACHIEVEMENTS = [
    {
        id: "first_swear",
        name: "Inicjacja",
        description: "Pierwsze przekleństwo w słoiczku",
        icon: "🎯"
    },
    {
        id: "ten_swears",
        name: "Początkujący",
        description: "10 przekleństw łącznie",
        icon: "🌱"
    },
    {
        id: "fifty_swears",
        name: "Weteran",
        description: "50 przekleństw łącznie",
        icon: "⭐"
    },
    {
        id: "hundred_swears",
        name: "Legenda",
        description: "100 przekleństw łącznie",
        icon: "🏆"
    },
    {
        id: "month_champion",
        name: "Mistrz Miesiąca",
        description: "Pierwsze miejsce w miesiącu",
        icon: "👑"
    },
    {
        id: "year_champion",
        name: "Mistrz Roku",
        description: "Pierwsze miejsce na koniec roku",
        icon: "🎖️"
    },
    {
        id: "monday_starter",
        name: "Poniedziałkowy Blues",
        description: "5 przekleństw w jeden poniedziałek",
        icon: "😤"
    },
    {
        id: "friday_finisher",
        name: "Piątkowe Wentylowanie",
        description: "Najwięcej przekleństw w piątek",
        icon: "🎉"
    },
    {
        id: "clean_week",
        name: "Święty Tydzień",
        description: "Cały tydzień bez przekleństwa",
        icon: "😇"
    },
    {
        id: "triple_threat",
        name: "Potrójne Uderzenie",
        description: "3 przekleństwa w ciągu minuty",
        icon: "⚡"
    },
    {
        id: "early_bird",
        name: "Ranny Ptaszek",
        description: "Pierwsze przekleństwo dnia przed 8:00",
        icon: "🌅"
    },
    {
        id: "night_owl",
        name: "Nocna Sowa",
        description: "Przekleństwo po 18:00",
        icon: "🦉"
    },
    {
        id: "comeback_king",
        name: "Król Powrotu",
        description: "Z ostatniego miejsca na pierwsze w ciągu miesiąca",
        icon: "🔥"
    },
    {
        id: "consistent",
        name: "Konsekwentny",
        description: "Przekleństwo każdego dnia przez tydzień",
        icon: "📅"
    },
    {
        id: "humble",
        name: "Skromny",
        description: "Najmniej przekleństw w miesiącu (min. 1)",
        icon: "🙏"
    }
];

// ============================================
// DEFINICJE OSIĄGNIĘĆ ZESPOŁOWYCH
// ============================================
const TEAM_ACHIEVEMENTS = [
    {
        id: "team_hundred",
        name: "Setka Zespołowa",
        description: "100 przekleństw zespołu łącznie",
        icon: "💯"
    },
    {
        id: "team_five_hundred",
        name: "Pięćsetka",
        description: "500 przekleństw zespołu łącznie",
        icon: "🎯"
    },
    {
        id: "team_thousand",
        name: "Tysiąc Wentyli",
        description: "1000 przekleństw zespołu łącznie",
        icon: "🏅"
    },
    {
        id: "all_participated",
        name: "Wszyscy na Pokładzie",
        description: "Każdy członek zespołu ma min. 1 przekleństwo",
        icon: "🤝"
    },
    {
        id: "balanced_team",
        name: "Zbalansowany Zespół",
        description: "Wszyscy gracze mają podobną liczbę (±5) w miesiącu",
        icon: "⚖️"
    },
    {
        id: "quiet_month",
        name: "Cichy Miesiąc",
        description: "Mniej niż 20 przekleństw zespołowych w miesiącu",
        icon: "🤫"
    },
    {
        id: "loud_month",
        name: "Głośny Miesiąc",
        description: "Więcej niż 100 przekleństw zespołowych w miesiącu",
        icon: "📢"
    },
    {
        id: "first_month",
        name: "Pierwszy Miesiąc",
        description: "Ukończenie pierwszego pełnego miesiąca śledzenia",
        icon: "📆"
    },
    {
        id: "anniversary",
        name: "Rocznica",
        description: "Rok prowadzenia słoiczka",
        icon: "🎂"
    }
];

// ============================================
// PRZYZNANE OSIĄGNIĘCIA
// Edytuj tę sekcję aby przyznawać osiągnięcia!
// ============================================
const AWARDED_ACHIEVEMENTS = [
    // Przykłady (odkomentuj i dostosuj):

    // {
    //     type: "individual",
    //     achievementId: "first_swear",
    //     player: "Damian",
    //     date: "2025-01-15",
    //     note: "Pierwsze przekleństwo w historii słoiczka!"
    // },
    // {
    //     type: "individual",
    //     achievementId: "month_champion",
    //     player: "Jacek",
    //     date: "2025-01-31",
    //     note: "Mistrz stycznia 2025"
    // },
    // {
    //     type: "team",
    //     achievementId: "all_participated",
    //     date: "2025-01-10",
    //     note: "Wszyscy się zaangażowali już pierwszego tygodnia!"
    // }
];

// ============================================
// FUNKCJE POMOCNICZE
// ============================================

/**
 * Pobiera wszystkie osiągnięcia indywidualne
 */
function getAllIndividualAchievements() {
    return INDIVIDUAL_ACHIEVEMENTS;
}

/**
 * Pobiera wszystkie osiągnięcia zespołowe
 */
function getAllTeamAchievements() {
    return TEAM_ACHIEVEMENTS;
}

/**
 * Pobiera przyznane osiągnięcia dla gracza
 */
function getPlayerAwardedAchievements(playerName) {
    return AWARDED_ACHIEVEMENTS.filter(
        a => a.type === "individual" && a.player === playerName
    ).map(awarded => {
        const achievement = INDIVIDUAL_ACHIEVEMENTS.find(a => a.id === awarded.achievementId);
        return {
            ...achievement,
            date: awarded.date,
            note: awarded.note
        };
    });
}

/**
 * Pobiera przyznane osiągnięcia zespołowe
 */
function getTeamAwardedAchievements() {
    return AWARDED_ACHIEVEMENTS.filter(
        a => a.type === "team"
    ).map(awarded => {
        const achievement = TEAM_ACHIEVEMENTS.find(a => a.id === awarded.achievementId);
        return {
            ...achievement,
            date: awarded.date,
            note: awarded.note
        };
    });
}

/**
 * Sprawdza czy gracz ma dane osiągnięcie
 */
function hasAchievement(playerName, achievementId) {
    return AWARDED_ACHIEVEMENTS.some(
        a => a.type === "individual" &&
            a.player === playerName &&
            a.achievementId === achievementId
    );
}

/**
 * Sprawdza czy zespół ma dane osiągnięcie
 */
function teamHasAchievement(achievementId) {
    return AWARDED_ACHIEVEMENTS.some(
        a => a.type === "team" && a.achievementId === achievementId
    );
}

/**
 * Pobiera statystyki osiągnięć gracza
 */
function getPlayerAchievementStats(playerName) {
    const awarded = getPlayerAwardedAchievements(playerName);
    return {
        earned: awarded.length,
        total: INDIVIDUAL_ACHIEVEMENTS.length,
        percentage: Math.round((awarded.length / INDIVIDUAL_ACHIEVEMENTS.length) * 100)
    };
}
