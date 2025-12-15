/**
 * Bluzniodmuch - System automatycznych osiagniec
 *
 * INSTRUKCJA DODAWANIA NOWYCH OSIAGNIEC:
 *
 * 1. Dodaj nowy obiekt do INDIVIDUAL_ACHIEVEMENTS lub TEAM_ACHIEVEMENTS
 * 2. Kazde osiagniecie musi miec:
 *    - id: unikalny identyfikator (string)
 *    - name: nazwa wyswietlana
 *    - description: opis jak zdobyc
 *    - icon: emoji
 *    - condition: funkcja(playerData, allPlayersData, playerName) => boolean
 *
 * Przyklad dodania nowego osiagniecia:
 * {
 *     id: "super_curser",
 *     name: "Super Przeklinacz",
 *     description: "200 przeklenstw lacznie",
 *     icon: "💀",
 *     condition: (player) => (player.swearCount || 0) >= 200
 * }
 */

// Klucz localStorage dla osiagniec
const ACHIEVEMENTS_STORAGE_KEY = 'bluzniodmuch_achievements';

// ============================================
// OSIAGNIECIA INDYWIDUALNE
// ============================================
const INDIVIDUAL_ACHIEVEMENTS = [
    {
        id: "first_swear",
        name: "Inicjacja",
        description: "Pierwsze przeklenstwo w sloiczku",
        icon: "🎯",
        condition: (player) => (player.swearCount || 0) >= 1
    },
    {
        id: "ten_swears",
        name: "Poczatkujacy",
        description: "10 przeklenstw lacznie",
        icon: "🌱",
        condition: (player) => (player.swearCount || 0) >= 10
    },
    {
        id: "twenty_five_swears",
        name: "Regularny",
        description: "25 przeklenstw lacznie",
        icon: "📈",
        condition: (player) => (player.swearCount || 0) >= 25
    },
    {
        id: "fifty_swears",
        name: "Weteran",
        description: "50 przeklenstw lacznie",
        icon: "⭐",
        condition: (player) => (player.swearCount || 0) >= 50
    },
    {
        id: "hundred_swears",
        name: "Legenda",
        description: "100 przeklenstw lacznie",
        icon: "🏆",
        condition: (player) => (player.swearCount || 0) >= 100
    },
    {
        id: "first_penalty",
        name: "Pokutnik",
        description: "Wykonaj pierwsza kare",
        icon: "🙏",
        condition: (player, allData) => {
            const purchases = allData.purchases || [];
            return purchases.some(p => p.type === 'penalty');
        }
    },
    {
        id: "first_reward",
        name: "Nagrodzony",
        description: "Odbierz pierwsza nagrode",
        icon: "🎁",
        condition: (player, allData) => {
            const purchases = allData.purchases || [];
            return purchases.some(p => p.type === 'reward');
        }
    },
    {
        id: "positive_balance",
        name: "W Plusie",
        description: "Osiagnij dodatni bilans punktow",
        icon: "📊",
        condition: (player) => (player.total || 0) > 0
    },
    {
        id: "ten_positive",
        name: "Dobra Passa",
        description: "Osiagnij 10 punktow dodatnich",
        icon: "🌟",
        condition: (player) => (player.total || 0) >= 10
    },
    {
        id: "twenty_positive",
        name: "Wzorowy",
        description: "Osiagnij 20 punktow dodatnich",
        icon: "🏅",
        condition: (player) => (player.total || 0) >= 20
    },
    {
        id: "fifty_positive",
        name: "Swiety",
        description: "Osiagnij 50 punktow dodatnich",
        icon: "😇",
        condition: (player) => (player.total || 0) >= 50
    },
    {
        id: "deep_negative",
        name: "Dno",
        description: "Spadnij do -50 punktow",
        icon: "🕳️",
        condition: (player) => (player.total || 0) <= -50
    },
    {
        id: "comeback",
        name: "Powrot",
        description: "Wyjdz z ujemnego bilansu na dodatni",
        icon: "🔄",
        condition: (player) => {
            // Sprawdz czy gracz mial kiedys ujemny bilans i teraz ma dodatni
            return (player.swearCount || 0) > 0 && (player.total || 0) > 0;
        }
    },
    {
        id: "clean_week",
        name: "Swiety Tydzien",
        description: "Zdobadz bonus za tydzien bez przeklenstwa",
        icon: "📅",
        condition: (player) => (player.rewardedInactiveWeeks || 0) >= 1
    },
    {
        id: "clean_month",
        name: "Swiety Miesiac",
        description: "Caly miesiac bez przeklenstwa",
        icon: "🗓️",
        condition: (player) => player.lastMonthBonusCheck !== null && player.lastMonthBonusCheck !== undefined
    },
    {
        id: "five_penalties",
        name: "Pokuty Mistrz",
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
// OSIAGNIECIA ZESPOLOWE
// ============================================
const TEAM_ACHIEVEMENTS = [
    {
        id: "team_first",
        name: "Start",
        description: "Pierwsze przeklenstwo w zespole",
        icon: "🚀",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 1;
        }
    },
    {
        id: "team_fifty",
        name: "Polowa Setki",
        description: "50 przeklenstw zespolu lacznie",
        icon: "5️⃣",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 50;
        }
    },
    {
        id: "team_hundred",
        name: "Setka Zespolowa",
        description: "100 przeklenstw zespolu lacznie",
        icon: "💯",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 100;
        }
    },
    {
        id: "team_five_hundred",
        name: "Piecsetka",
        description: "500 przeklenstw zespolu lacznie",
        icon: "🎯",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 500;
        }
    },
    {
        id: "team_thousand",
        name: "Tysiac Wentyli",
        description: "1000 przeklenstw zespolu lacznie",
        icon: "🏅",
        condition: (allData) => {
            const totalSwears = Object.values(allData.players || {})
                .reduce((sum, p) => sum + (p.swearCount || 0), 0);
            return totalSwears >= 1000;
        }
    },
    {
        id: "all_participated",
        name: "Wszyscy na Pokladzie",
        description: "Kazdy czlonek zespolu ma min. 1 przeklenstwo",
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
// FUNKCJE ZARZADZANIA OSIAGNIECIAMI
// ============================================

/**
 * Pobiera przyznane osiagniecia z localStorage
 */
function getAwardedAchievements() {
    const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!stored) {
        return { individual: {}, team: [] };
    }
    return JSON.parse(stored);
}

/**
 * Zapisuje przyznane osiagniecia do localStorage
 */
function saveAwardedAchievements(awarded) {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(awarded));
}

/**
 * Sprawdza i przyznaje osiagniecia dla gracza
 * Zwraca tablice nowo przyznanych osiagniec
 */
function checkAndAwardAchievements(playerName) {
    const data = getData();
    const playerData = data.players[playerName];
    if (!playerData) return [];

    const awarded = getAwardedAchievements();
    const newlyAwarded = [];

    // Inicjalizuj strukture dla gracza jesli nie istnieje
    if (!awarded.individual[playerName]) {
        awarded.individual[playerName] = [];
    }

    // Sprawdz osiagniecia indywidualne
    INDIVIDUAL_ACHIEVEMENTS.forEach(achievement => {
        // Pomijaj juz przyznane
        if (awarded.individual[playerName].some(a => a.id === achievement.id)) {
            return;
        }

        // Sprawdz warunek
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

    // Sprawdz osiagniecia zespolowe
    TEAM_ACHIEVEMENTS.forEach(achievement => {
        // Pomijaj juz przyznane
        if (awarded.team.some(a => a.id === achievement.id)) {
            return;
        }

        // Sprawdz warunek
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

    // Zapisz jesli byly nowe osiagniecia
    if (newlyAwarded.length > 0) {
        saveAwardedAchievements(awarded);
    }

    return newlyAwarded;
}

/**
 * Sprawdza osiagniecia dla wszystkich graczy
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
// FUNKCJE POMOCNICZE (kompatybilnosc z trophies.js)
// ============================================

/**
 * Pobiera wszystkie osiagniecia indywidualne
 */
function getAllIndividualAchievements() {
    return INDIVIDUAL_ACHIEVEMENTS;
}

/**
 * Pobiera wszystkie osiagniecia zespolowe
 */
function getAllTeamAchievements() {
    return TEAM_ACHIEVEMENTS;
}

/**
 * Pobiera przyznane osiagniecia dla gracza
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
 * Pobiera przyznane osiagniecia zespolowe
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
 * Sprawdza czy gracz ma dane osiagniecie
 */
function hasAchievement(playerName, achievementId) {
    const awarded = getAwardedAchievements();
    const playerAwarded = awarded.individual[playerName] || [];
    return playerAwarded.some(a => a.id === achievementId);
}

/**
 * Sprawdza czy zespol ma dane osiagniecie
 */
function teamHasAchievement(achievementId) {
    const awarded = getAwardedAchievements();
    return awarded.team.some(a => a.id === achievementId);
}

/**
 * Pobiera statystyki osiagniec gracza
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
 * Wyswietla powiadomienie o nowym osiagnieciu
 */
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <div class="achievement-title">Nowe osiagniecie!</div>
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
