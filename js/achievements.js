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
/**
 * Aby ustawić własną grafikę dla osiągnięcia:
 * 1. Umieść obrazek w folderze image/ (np. image/achievement-first-swear.png)
 * 2. Zmień wartość `image: null` na ścieżkę do obrazka
 *
 * Obsługiwane formaty: PNG, JPG, SVG, GIF, WEBP
 * Zalecany rozmiar: 64x64 px lub 128x128 px
 */
const INDIVIDUAL_ACHIEVEMENTS = [
    {
        id: "first_swear",
        name: "Inicjacja",
        description: "Pierwsze przekleństwo w słoiczku",
        icon: "🎯",
        image: null,  // np: 'image/achievement-first-swear.png'
        condition: (player) => (player.swearCount || 0) >= 1
    },
    {
        id: "ten_swears",
        name: "Początkujący",
        description: "10 przekleństw łącznie",
        icon: "🌱",
        image: null,  // np: 'image/achievement-ten-swears.png'
        condition: (player) => (player.swearCount || 0) >= 10
    },
    {
        id: "twenty_five_swears",
        name: "Regularny",
        description: "25 przekleństw łącznie",
        icon: "📈",
        image: null,  // np: 'image/achievement-twenty-five-swears.png'
        condition: (player) => (player.swearCount || 0) >= 25
    },
    {
        id: "fifty_swears",
        name: "Weteran",
        description: "50 przekleństw łącznie",
        icon: "⭐",
        image: null,  // np: 'image/achievement-fifty-swears.png'
        condition: (player) => (player.swearCount || 0) >= 50
    },
    {
        id: "hundred_swears",
        name: "Legenda",
        description: "100 przekleństw łącznie",
        icon: "🏆",
        image: null,  // np: 'image/achievement-hundred-swears.png'
        condition: (player) => (player.swearCount || 0) >= 100
    },
    {
        id: "first_penalty",
        name: "Pokutnik",
        description: "Wykonaj pierwszą karę",
        icon: "🙏",
        image: null,  // np: 'image/achievement-first-penalty.png'
        condition: (player, allData, playerName) => {
            const purchases = allData.purchases || [];
            return purchases.some(p => p.type === 'penalty' && p.player === playerName);
        }
    },
    {
        id: "first_reward",
        name: "Nagrodzony",
        description: "Odbierz pierwszą nagrodę",
        icon: "🎁",
        image: null,  // np: 'image/achievement-first-reward.png'
        condition: (player, allData, playerName) => {
            const purchases = allData.purchases || [];
            return purchases.some(p => p.type === 'reward' && p.player === playerName);
        }
    },
    {
        id: "positive_balance",
        name: "W Plusie",
        description: "Osiągnij dodatni bilans punktów",
        icon: "📊",
        image: null,  // np: 'image/achievement-positive-balance.png'
        condition: (player) => calculatePlayerTotal(player) > 0
    },
    {
        id: "ten_positive",
        name: "Dobra Passa",
        description: "Osiągnij 10 punktów dodatnich",
        icon: "🌟",
        image: null,  // np: 'image/achievement-ten-positive.png'
        condition: (player) => calculatePlayerTotal(player) >= 10
    },
    {
        id: "twenty_positive",
        name: "Wzorowy",
        description: "Osiągnij 20 punktów dodatnich",
        icon: "🏅",
        image: null,  // np: 'image/achievement-twenty-positive.png'
        condition: (player) => calculatePlayerTotal(player) >= 20
    },
    {
        id: "fifty_positive",
        name: "Święty",
        description: "Osiągnij 50 punktów dodatnich",
        icon: "😇",
        image: null,  // np: 'image/achievement-fifty-positive.png'
        condition: (player) => calculatePlayerTotal(player) >= 50
    },
    {
        id: "deep_negative",
        name: "Dno",
        description: "Spadnij do -50 punktów",
        icon: "🕳️",
        image: null,  // np: 'image/achievement-deep-negative.png'
        condition: (player) => calculatePlayerTotal(player) <= -50
    },
    {
        id: "comeback",
        name: "Powrót",
        description: "Wyjdź z ujemnego bilansu na dodatni",
        icon: "🔄",
        image: null,  // np: 'image/achievement-comeback.png'
        condition: (player) => {
            // Sprawdź czy gracz miał kiedyś ujemny bilans i teraz ma dodatni
            return (player.swearCount || 0) > 0 && calculatePlayerTotal(player) > 0;
        }
    },
    {
        id: "clean_week",
        name: "Święty Tydzień",
        description: "Zdobądź bonus za tydzień bez przekleństwa",
        icon: "📅",
        image: null,  // np: 'image/achievement-clean-week.png'
        condition: (player) => (player.rewardedInactiveWeeks || 0) >= 1
    },
    {
        id: "clean_month",
        name: "Święty Miesiąc",
        description: "Cały miesiąc bez przekleństwa",
        icon: "🗓️",
        image: null,  // np: 'image/achievement-clean-month.png'
        condition: (player) => (player.cleanMonths?.length || 0) >= 1
    },
    {
        id: "five_penalties",
        name: "Mistrz Pokuty",
        description: "Wykonaj 5 kar",
        icon: "⚖️",
        image: null,  // np: 'image/achievement-five-penalties.png'
        condition: (player, allData, playerName) => {
            const purchases = allData.purchases || [];
            const penalties = purchases.filter(p => p.player === playerName && p.type === 'penalty');
            return penalties.length >= 5;
        }
    }
    // Osiągnięcia za wygrane miesiące są przyznawane dynamicznie w checkMonthWinner()
    // z ID typu "month_champion_2025-01" i nazwą "Mistrz Stycznia 2025"
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
        image: null,  // np: 'image/achievement-team-first.png'
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
        image: null,  // np: 'image/achievement-team-fifty.png'
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
        image: null,  // np: 'image/achievement-team-hundred.png'
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
        image: null,  // np: 'image/achievement-team-five-hundred.png'
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
        image: null,  // np: 'image/achievement-team-thousand.png'
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
        image: null,  // np: 'image/achievement-all-participated.png'
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
        image: null,  // np: 'image/achievement-first-shop-use.png'
        condition: (allData) => {
            return (allData.purchases || []).length >= 1;
        }
    },
    {
        id: "ten_transactions",
        name: "Stali Klienci",
        description: "10 transakcji w sklepie",
        icon: "🏪",
        image: null,  // np: 'image/achievement-ten-transactions.png'
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
                hasImage: achievement.image !== null && achievement.image !== '',
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
                hasImage: achievement.image !== null && achievement.image !== '',
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
 * Uwzględnia zarówno statyczne osiągnięcia jak i dynamiczne za wygrane miesiące
 */
function getPlayerAwardedAchievements(playerName) {
    const awarded = getAwardedAchievements();
    const playerAwarded = awarded.individual[playerName] || [];

    const achievements = [];

    playerAwarded.forEach(a => {
        // Sprawdź czy to dynamiczne osiągnięcie za miesiąc
        if (a.id.startsWith('month_champion_')) {
            const monthKey = a.monthKey || a.id.replace('month_champion_', '');
            const monthIconData = getMonthIcon(monthKey);
            achievements.push({
                id: a.id,
                name: `Mistrz ${formatMonthNamePL(monthKey)}`,
                description: `Najmniej przekleństw w miesiącu ${formatMonthNamePL(monthKey)}`,
                icon: monthIconData.icon,
                image: monthIconData.image,
                hasImage: monthIconData.hasImage,
                date: a.date,
                monthKey: monthKey
            });
        } else if (a.id.startsWith('year_champion_')) {
            // Dynamiczne osiągnięcie za rok
            const yearKey = a.yearKey || a.id.replace('year_champion_', '');
            const yearIconData = getYearIcon(yearKey);
            achievements.push({
                id: a.id,
                name: `Mistrz Roku ${yearKey}`,
                description: `Najmniej przekleństw w roku ${yearKey}`,
                icon: yearIconData.icon,
                image: yearIconData.image,
                hasImage: yearIconData.hasImage,
                date: a.date,
                yearKey: yearKey
            });
        } else {
            // Statyczne osiągnięcie
            const achievement = INDIVIDUAL_ACHIEVEMENTS.find(ach => ach.id === a.id);
            if (achievement) {
                achievements.push({
                    ...achievement,
                    hasImage: achievement.image !== null && achievement.image !== '',
                    date: a.date
                });
            }
        }
    });

    return achievements;
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
            hasImage: achievement.image !== null && achievement.image !== '',
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
 * Uwzględnia zarówno statyczne jak i dynamiczne osiągnięcia
 */
function getPlayerAchievementStats(playerName) {
    const playerAwarded = getPlayerAwardedAchievements(playerName);
    const staticAchievements = playerAwarded.filter(a =>
        !a.id.startsWith('month_champion_') && !a.id.startsWith('year_champion_')
    );
    const monthChampionAchievements = playerAwarded.filter(a => a.id.startsWith('month_champion_'));
    const yearChampionAchievements = playerAwarded.filter(a => a.id.startsWith('year_champion_'));

    return {
        earned: playerAwarded.length,
        staticEarned: staticAchievements.length,
        staticTotal: INDIVIDUAL_ACHIEVEMENTS.length,
        monthChampionCount: monthChampionAchievements.length,
        yearChampionCount: yearChampionAchievements.length,
        percentage: Math.round((staticAchievements.length / INDIVIDUAL_ACHIEVEMENTS.length) * 100)
    };
}

/**
 * Wyświetla powiadomienie o nowym osiągnięciu
 */
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';

    // Obsługa ikony - emoji lub obrazek
    let iconHtml;
    if (achievement.hasImage && achievement.image) {
        iconHtml = `<img src="${achievement.image}" alt="${achievement.name}" class="achievement-icon-img">`;
    } else {
        iconHtml = achievement.icon;
    }

    notification.innerHTML = `
        <div class="achievement-icon">${iconHtml}</div>
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

// ============================================
// OSIĄGNIĘCIA ZA WYGRANE MIESIĄCE (DYNAMICZNE)
// ============================================

/**
 * Nazwy miesięcy po polsku (dopełniacz)
 */
const MONTH_NAMES_PL = [
    'Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca',
    'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia'
];

/**
 * Formatuje nazwę miesiąca po polsku
 * @param {string} monthKey - klucz miesiąca w formacie "YYYY-MM"
 * @returns {string} np. "Stycznia 2025"
 */
function formatMonthNamePL(monthKey) {
    const [year, month] = monthKey.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTH_NAMES_PL[monthIndex]} ${year}`;
}

/**
 * Przyznaje osiągnięcie za wygranie konkretnego miesiąca
 * @param {string} playerName - nazwa gracza
 * @param {string} monthKey - klucz miesiąca w formacie "YYYY-MM"
 * @returns {object|null} - przyznane osiągnięcie lub null jeśli już przyznane
 */
function awardMonthChampion(playerName, monthKey) {
    const achievementId = `month_champion_${monthKey}`;
    const awarded = getAwardedAchievements();

    // Inicjalizuj strukturę dla gracza jeśli nie istnieje
    if (!awarded.individual[playerName]) {
        awarded.individual[playerName] = [];
    }

    // Sprawdź czy już przyznane
    if (awarded.individual[playerName].some(a => a.id === achievementId)) {
        return null;
    }

    // Pobierz ikonę dla miesiąca
    const monthIconData = getMonthIcon(monthKey);

    // Utwórz osiągnięcie
    const achievement = {
        id: achievementId,
        name: `Mistrz ${formatMonthNamePL(monthKey)}`,
        description: `Najmniej przekleństw w miesiącu ${formatMonthNamePL(monthKey)}`,
        icon: monthIconData.icon,
        image: monthIconData.image,
        hasImage: monthIconData.hasImage,
        date: new Date().toISOString(),
        type: 'individual',
        player: playerName,
        monthKey: monthKey
    };

    // Zapisz
    awarded.individual[playerName].push({
        id: achievementId,
        date: achievement.date,
        monthKey: monthKey
    });
    saveAwardedAchievements(awarded);

    return achievement;
}

/**
 * Pobiera wszystkie osiągnięcia za wygrane miesiące dla gracza
 */
function getPlayerMonthChampionAchievements(playerName) {
    const awarded = getAwardedAchievements();
    const playerAwarded = awarded.individual[playerName] || [];

    return playerAwarded
        .filter(a => a.id.startsWith('month_champion_'))
        .map(a => {
            const monthKey = a.monthKey || a.id.replace('month_champion_', '');
            const monthIconData = getMonthIcon(monthKey);
            return {
                id: a.id,
                name: `Mistrz ${formatMonthNamePL(monthKey)}`,
                description: `Najmniej przekleństw w miesiącu ${formatMonthNamePL(monthKey)}`,
                icon: monthIconData.icon,
                image: monthIconData.image,
                hasImage: monthIconData.hasImage,
                date: a.date,
                monthKey: monthKey
            };
        });
}

// ============================================
// OSIĄGNIĘCIA ZA WYGRANE LATA (DYNAMICZNE)
// ============================================

/**
 * Przyznaje osiągnięcie za wygranie konkretnego roku
 * @param {string} playerName - nazwa gracza
 * @param {string} yearKey - klucz roku w formacie "YYYY"
 * @returns {object|null} - przyznane osiągnięcie lub null jeśli już przyznane
 */
function awardYearChampion(playerName, yearKey) {
    const achievementId = `year_champion_${yearKey}`;
    const awarded = getAwardedAchievements();

    // Inicjalizuj strukturę dla gracza jeśli nie istnieje
    if (!awarded.individual[playerName]) {
        awarded.individual[playerName] = [];
    }

    // Sprawdź czy już przyznane
    if (awarded.individual[playerName].some(a => a.id === achievementId)) {
        return null;
    }

    // Pobierz ikonę dla roku
    const yearIconData = getYearIcon(yearKey);

    // Utwórz osiągnięcie
    const achievement = {
        id: achievementId,
        name: `Mistrz Roku ${yearKey}`,
        description: `Najmniej przekleństw w roku ${yearKey}`,
        icon: yearIconData.icon,
        image: yearIconData.image,
        hasImage: yearIconData.hasImage,
        date: new Date().toISOString(),
        type: 'individual',
        player: playerName,
        yearKey: yearKey
    };

    // Zapisz
    awarded.individual[playerName].push({
        id: achievementId,
        date: achievement.date,
        yearKey: yearKey
    });
    saveAwardedAchievements(awarded);

    return achievement;
}

/**
 * Pobiera wszystkie osiągnięcia za wygrane lata dla gracza
 */
function getPlayerYearChampionAchievements(playerName) {
    const awarded = getAwardedAchievements();
    const playerAwarded = awarded.individual[playerName] || [];

    return playerAwarded
        .filter(a => a.id.startsWith('year_champion_'))
        .map(a => {
            const yearKey = a.yearKey || a.id.replace('year_champion_', '');
            const yearIconData = getYearIcon(yearKey);
            return {
                id: a.id,
                name: `Mistrz Roku ${yearKey}`,
                description: `Najmniej przekleństw w roku ${yearKey}`,
                icon: yearIconData.icon,
                image: yearIconData.image,
                hasImage: yearIconData.hasImage,
                date: a.date,
                yearKey: yearKey
            };
        });
}
