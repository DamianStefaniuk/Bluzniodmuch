/**
 * Bluzniodmuch - System automatycznych osiągnięć
 *
 * INSTRUKCJA DODAWANIA NOWYCH OSIĄGNIĘĆ:
 *
 * 1. Dodaj nowy obiekt do INDIVIDUAL_ACHIEVEMENTS lub TEAM_ACHIEVEMENTS
 * 2. Każde osiągnięcie musi mieć:
 *    - id: unikalny identyfikator (string)
 *    - name: nazwa wyświetlana
 *    - description: opis jak zdobyć
 *    - icon: emoji
 *    - condition: funkcja(playerData, allPlayersData, playerName) => boolean
 *
 * Przykład dodania nowego osiągnięcia:
 * {
 *     id: "super_curser",
 *     name: "Super Przeklinacz",
 *     description: "200 przekleństw łącznie",
 *     icon: "💀",
 *     condition: (player) => (player.swearCount || 0) >= 200
 * }
 */

// Klucz localStorage dla osiągnięć
const ACHIEVEMENTS_STORAGE_KEY = 'bluzniodmuch_achievements';

// ============================================
// OSIĄGNIĘCIA INDYWIDUALNE
// ============================================
const INDIVIDUAL_ACHIEVEMENTS = [
    {
        id: "first_swear",
        name: "Inicjacja",
        description: "Pierwsze przekleństwo w słoiczku",
        icon: "🎯",
        condition: (player) => (player.swearCount || 0) >= 1
    },
    {
        id: "ten_swears",
        name: "Początkujący",
        description: "10 przekleństw łącznie",
        icon: "🌱",
        condition: (player) => (player.swearCount || 0) >= 10
    },
    {
        id: "twenty_five_swears",
        name: "Regularny",
        description: "25 przekleństw łącznie",
        icon: "📈",
        condition: (player) => (player.swearCount || 0) >= 25
    },
    {
        id: "fifty_swears",
        name: "Weteran",
        description: "50 przekleństw łącznie",
        icon: "⭐",
        condition: (player) => (player.swearCount || 0) >= 50
    },
    {
        id: "hundred_swears",
        name: "Legenda",
        description: "100 przekleństw łącznie",
        icon: "🏆",
        condition: (player) => (player.swearCount || 0) >= 100
    },
    {
        id: "first_penalty",
        name: "Pokutnik",
        description: "Wykonaj pierwszą karę",
        icon: "🙏",
        condition: (player, allData) => {
            const purchases = allData.purchases || [];
            return purchases.some(p => p.type === 'penalty');
        }
    },
    {
        id: "first_reward",
        name: "Nagrodzony",
        description: "Odbierz pierwszą nagrodę",
        icon: "🎁",
        condition: (player, allData) => {
            const purchases = allData.purchases || [];
            return purchases.some(p => p.type === 'reward');
        }
    },
    {
        id: "positive_balance",
        name: "W Plusie",
        description: "Osiągnij dodatni bilans punktów",
        icon: "📊",
        condition: (player) => (player.total || 0) > 0
    },
    {
        id: "ten_positive",
        name: "Dobra Passa",
        description: "Osiągnij 10 punktów dodatnich",
        icon: "🌟",
        condition: (player) => (player.total || 0) >= 10
    },
    {
        id: "twenty_positive",
        name: "Wzorowy",
        description: "Osiągnij 20 punktów dodatnich",
        icon: "🏅",
        condition: (player) => (player.total || 0) >= 20
    },
    {
        id: "fifty_positive",
        name: "Święty",
        description: "Osiągnij 50 punktów dodatnich",
        icon: "😇",
        condition: (player) => (player.total || 0) >= 50
    },
    {
        id: "deep_negative",
        name: "Dno",
        description: "Spadnij do -50 punktów",
        icon: "🕳️",
        condition: (player) => (player.total || 0) <= -50
    },
    {
        id: "comeback",
        name: "Powrót",
        description: "Wyjdź z ujemnego bilansu na dodatni",
        icon: "🔄",
        condition: (player) => {
            // Sprawdź czy gracz miał kiedyś ujemny bilans i teraz ma dodatni
            return (player.swearCount || 0) > 0 && (player.total || 0) > 0;
        }
    },
    {
        id: "clean_week",
        name: "Święty Tydzień",
        description: "Zdobądź bonus za tydzień bez przekleństwa",
        icon: "📅",
        condition: (player) => (player.rewardedInactiveWeeks || 0) >= 1
    },
    {
        id: "clean_month",
        name: "Święty Miesiąc",
        description: "Cały miesiąc bez przekleństwa",
        icon: "🗓️",
        condition: (player) => player.lastMonthBonusCheck !== null && player.lastMonthBonusCheck !== undefined
    },
    {
        id: "five_penalties",
        name: "Mistrz Pokuty",
        description: "Wykonaj 5 kar",
        icon: "⚖️",
        condition: (player, allData, playerName) => {
            const purchases = allData.purchases || [];
            const penalties = purchases.filter(p => p.player === playerName && p.type === 'penalty');
            return penalties.length >= 5;
        }
    }
];

// ============================================
// OSIĄGNIĘCIA ZESPOŁOWE
// ============================================
const TEAM_ACHIEVEMENTS = [
    {
        id: "team_first",
        name: "Start",
        description: "Pierwsze przekleństwo w zespole",
        icon: "🚀",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 1;
        }
    },
    {
        id: "team_fifty",
        name: "Połowa Setki",
        description: "50 przekleństw zespołu łącznie",
        icon: "5️⃣",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 50;
        }
    },
    {
        id: "team_hundred",
        name: "Setka Zespołowa",
        description: "100 przekleństw zespołu łącznie",
        icon: "💯",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 100;
        }
    },
    {
        id: "team_five_hundred",
        name: "Pięćsetka",
        description: "500 przekleństw zespołu łącznie",
        icon: "🎯",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 500;
        }
    },
    {
        id: "team_thousand",
        name: "Tysiąc Wentyli",
        description: "1000 przekleństw zespołu łącznie",
        icon: "🏅",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 1000;
        }
    },
    {
        id: "all_participated",
        name: "Wszyscy na Pokładzie",
        description: "Każdy członek zespołu ma min. 1 przekleństwo",
        icon: "🤝",
        condition: (allData) => {
            const players = Object.values(allData.players || {});
            if (players.length === 0) return false;
            return players.every(p => (p.swearCount || 0) >= 1);
        }
    },
    {
        id: "first_shop_use",
        name: "Sklep Otwarty",
        description: "Pierwsza transakcja w sklepie",
        icon: "🛒",
        condition: (allData) => {
            return (allData.purchases || []).length >= 1;
        }
    },
    {
        id: "ten_transactions",
        name: "Stali Klienci",
        description: "10 transakcji w sklepie",
        icon: "🏪",
        condition: (allData) => {
            return (allData.purchases || []).length >= 10;
        }
    }
];

// ============================================
// FUNKCJE ZARZĄDZANIA OSIĄGNIĘCIAMI
// ============================================

/**
 * Pobiera przyznane osiągnięcia z localStorage
 */
function getAwardedAchievements() {
    const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!stored) {
        return { individual: {}, team: [] };
    }
    return JSON.parse(stored);
}

/**
 * Zapisuje przyznane osiągnięcia do localStorage
 */
function saveAwardedAchievements(awarded) {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(awarded));
}

/**
 * Sprawdza i przyznaje osiągnięcia dla gracza
 * Zwraca tablicę nowo przyznanych osiągnięć
 */
function checkAndAwardAchievements(playerName) {
    const data = getData();
    const playerData = data.players[playerName];
    if (!playerData) return [];

    const awarded = getAwardedAchievements();
    const newlyAwarded = [];

    // Inicjalizuj strukturę dla gracza jeśli nie istnieje
    if (!awarded.individual[playerName]) {
        awarded.individual[playerName] = [];
    }

    // Sprawdź osiągnięcia indywidualne
    INDIVIDUAL_ACHIEVEMENTS.forEach(achievement => {
        // Pomijaj już przyznane
        if (awarded.individual[playerName].some(a => a.id === achievement.id)) {
            return;
        }

        // Sprawdź warunek
        if (achievement.condition(playerData, data, playerName)) {
            const awardedAchievement = {
                id: achievement.id,
                date: new Date().toISOString()
            };
            awarded.individual[playerName].push(awardedAchievement);
            newlyAwarded.push({
                ...achievement,
                type: 'individual',
                player: playerName,
                date: awardedAchievement.date
            });
        }
    });

    // Sprawdź osiągnięcia zespołowe
    TEAM_ACHIEVEMENTS.forEach(achievement => {
        // Pomijaj już przyznane
        if (awarded.team.some(a => a.id === achievement.id)) {
            return;
        }

        // Sprawdź warunek
        if (achievement.condition(data)) {
            const awardedAchievement = {
                id: achievement.id,
                date: new Date().toISOString()
            };
            awarded.team.push(awardedAchievement);
            newlyAwarded.push({
                ...achievement,
                type: 'team',
                date: awardedAchievement.date
            });
        }
    });

    // Zapisz jeśli były nowe osiągnięcia
    if (newlyAwarded.length > 0) {
        saveAwardedAchievements(awarded);
    }

    return newlyAwarded;
}

/**
 * Sprawdza osiągnięcia dla wszystkich graczy
 */
function checkAllPlayersAchievements() {
    const allNewlyAwarded = [];
    PLAYERS.forEach(player => {
        const newAchievements = checkAndAwardAchievements(player);
        allNewlyAwarded.push(...newAchievements);
    });
    return allNewlyAwarded;
}

// ============================================
// FUNKCJE POMOCNICZE (kompatybilność z trophies.js)
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
    const awarded = getAwardedAchievements();
    const playerAwarded = awarded.individual[playerName] || [];

    return playerAwarded.map(a => {
        const achievement = INDIVIDUAL_ACHIEVEMENTS.find(ach => ach.id === a.id);
        if (!achievement) return null;
        return {
            ...achievement,
            date: a.date
        };
    }).filter(a => a !== null);
}

/**
 * Pobiera przyznane osiągnięcia zespołowe
 */
function getTeamAwardedAchievements() {
    const awarded = getAwardedAchievements();

    return awarded.team.map(a => {
        const achievement = TEAM_ACHIEVEMENTS.find(ach => ach.id === a.id);
        if (!achievement) return null;
        return {
            ...achievement,
            date: a.date
        };
    }).filter(a => a !== null);
}

/**
 * Sprawdza czy gracz ma dane osiągnięcie
 */
function hasAchievement(playerName, achievementId) {
    const awarded = getAwardedAchievements();
    const playerAwarded = awarded.individual[playerName] || [];
    return playerAwarded.some(a => a.id === achievementId);
}

/**
 * Sprawdza czy zespół ma dane osiągnięcie
 */
function teamHasAchievement(achievementId) {
    const awarded = getAwardedAchievements();
    return awarded.team.some(a => a.id === achievementId);
}

/**
 * Pobiera statystyki osiągnięć gracza
 */
function getPlayerAchievementStats(playerName) {
    const playerAwarded = getPlayerAwardedAchievements(playerName);
    return {
        earned: playerAwarded.length,
        total: INDIVIDUAL_ACHIEVEMENTS.length,
        percentage: Math.round((playerAwarded.length / INDIVIDUAL_ACHIEVEMENTS.length) * 100)
    };
}

/**
 * Wyświetla powiadomienie o nowym osiągnięciu
 */
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <div class="achievement-title">Nowe osiągnięcie!</div>
            <div class="achievement-name">${achievement.name}</div>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
