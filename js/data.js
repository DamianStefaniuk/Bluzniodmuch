/**
 * Bluzniodmuch - Moduł danych
 *
 * Ten plik zawiera konfigurację graczy oraz funkcje do zarządzania danymi w localStorage.
 * Dane są przechowywane lokalnie w przeglądarce każdego użytkownika.
 */

// Lista graczy zespołu
const PLAYERS = ['Jacek', 'Mateusz', 'Tomek', 'Karol', 'Damian'];

// Klucze localStorage
const STORAGE_KEYS = {
    SCORES: 'bluzniodmuch_scores',
    ACHIEVEMENTS: 'bluzniodmuch_achievements'
};

/**
 * Pobiera aktualny klucz miesiąca (format: YYYY-MM)
 */
function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Pobiera aktualny klucz roku (format: YYYY)
 */
function getCurrentYearKey() {
    return new Date().getFullYear().toString();
}

/**
 * Pobiera nazwę miesiąca po polsku
 */
function getMonthName(monthKey) {
    const months = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const [year, month] = monthKey.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
}

/**
 * Generuje unikalny identyfikator
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Inicjalizuje dane jeśli nie istnieją i migruje stare dane
 */
function initializeData() {
    let scores = localStorage.getItem(STORAGE_KEYS.SCORES);

    if (!scores) {
        const initialData = {
            players: {},
            purchases: [],
            lastBonusCheck: null,
            history: {},
            trackingStartDate: new Date().toISOString() // Data rozpoczęcia śledzenia
        };

        PLAYERS.forEach(player => {
            initialData.players[player] = {
                swearCount: 0,
                spentOnRewards: 0,
                earnedFromPenalties: 0,
                bonusGained: 0,
                monthly: {},
                yearly: {},
                lastActivity: null,
                rewardedInactiveDays: 0,
                rewardedInactiveWeeks: 0,
                lastMonthBonusCheck: null,
                monthsWon: [],
                yearsWon: [],
                cleanMonths: [] // Miesiące bez przekleństw z naliczonym bonusem
            };
        });

        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(initialData));
    } else {
        // Migracja starych danych - upewnij się że wszystkie pola istnieją
        const data = JSON.parse(scores);
        let needsSave = false;

        // Migracja: dodaj purchases jeśli nie istnieje
        if (!data.purchases) {
            data.purchases = [];
            needsSave = true;
        }

        // Migracja: dodaj ID do zakupów bez ID
        data.purchases.forEach(purchase => {
            if (!purchase.id) {
                purchase.id = generateId();
                needsSave = true;
            }
        });

        // Migracja: dodaj trackingStartDate jeśli nie istnieje
        // Domyślnie 15.12.2025 (data startu aplikacji)
        if (!data.trackingStartDate) {
            data.trackingStartDate = '2025-12-15T00:00:00.000Z';
            needsSave = true;
        }

        PLAYERS.forEach(player => {
            if (!data.players[player]) {
                data.players[player] = {
                    swearCount: 0,
                    spentOnRewards: 0,
                    earnedFromPenalties: 0,
                    bonusGained: 0,
                    monthly: {},
                    yearly: {},
                    lastActivity: null,
                    rewardedInactiveDays: 0,
                    rewardedInactiveWeeks: 0,
                    lastMonthBonusCheck: null,
                    monthsWon: [],
                    yearsWon: []
                };
                needsSave = true;
            } else {
                const p = data.players[player];

                // Migracja: dodaj brakujące pola składników bilansu
                if (typeof p.swearCount !== 'number') {
                    p.swearCount = 0;
                    needsSave = true;
                }
                if (typeof p.spentOnRewards !== 'number') {
                    p.spentOnRewards = 0;
                    needsSave = true;
                }
                if (typeof p.earnedFromPenalties !== 'number') {
                    p.earnedFromPenalties = 0;
                    needsSave = true;
                }
                if (typeof p.bonusGained !== 'number') {
                    p.bonusGained = 0;
                    needsSave = true;
                }
                if (typeof p.rewardedInactiveDays !== 'number') {
                    p.rewardedInactiveDays = 0;
                    needsSave = true;
                }
                if (typeof p.rewardedInactiveWeeks !== 'number') {
                    p.rewardedInactiveWeeks = 0;
                    needsSave = true;
                }
                if (!Array.isArray(p.monthsWon)) {
                    p.monthsWon = [];
                    needsSave = true;
                }
                if (!Array.isArray(p.yearsWon)) {
                    p.yearsWon = [];
                    needsSave = true;
                }
                if (!Array.isArray(p.cleanMonths)) {
                    p.cleanMonths = [];
                    needsSave = true;
                }

                // Migracja: reset lastMonthBonusCheck jeśli jest starsze niż trackingStartDate
                const trackingStart = data.trackingStartDate || '2025-12-15T00:00:00.000Z';
                const trackingStartMonth = trackingStart.substring(0, 7); // "2025-12"
                if (p.lastMonthBonusCheck && p.lastMonthBonusCheck < trackingStartMonth) {
                    p.lastMonthBonusCheck = null;
                    needsSave = true;
                }

                // Migracja: jeśli istnieje stare pole 'total', oblicz składniki
                if (typeof p.total === 'number') {
                    // Oblicz aktualny bilans ze składników
                    const calculatedTotal = (p.bonusGained || 0) + (p.earnedFromPenalties || 0) - (p.swearCount || 0) - (p.spentOnRewards || 0);

                    // Jeśli stary total różni się od obliczonego, skoryguj bonusGained
                    if (p.total !== calculatedTotal) {
                        const diff = p.total - calculatedTotal;
                        p.bonusGained = (p.bonusGained || 0) + diff;
                        needsSave = true;
                    }

                    // Usuń stare pole total
                    delete p.total;
                    needsSave = true;
                }
            }
        });

        if (needsSave) {
            localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(data));
        }
    }

    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORES));
}

/**
 * Oblicza bilans punktów gracza na podstawie składników
 */
function calculatePlayerTotal(playerData) {
    if (!playerData) return 0;
    return (playerData.bonusGained || 0)
         + (playerData.earnedFromPenalties || 0)
         - (playerData.swearCount || 0)
         - (playerData.spentOnRewards || 0);
}

/**
 * Pobiera wszystkie dane
 */
function getData() {
    return initializeData();
}

/**
 * Zapisuje dane
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(data));
}

/**
 * Dodaje przekleństwo dla gracza (każde przekleństwo = -1 punkt)
 */
function addSwear(playerName) {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    if (!data.players[playerName]) {
        data.players[playerName] = {
            swearCount: 0,
            spentOnRewards: 0,
            earnedFromPenalties: 0,
            bonusGained: 0,
            monthly: {},
            yearly: {},
            lastActivity: null,
            rewardedInactiveDays: 0,
            rewardedInactiveWeeks: 0,
            lastMonthBonusCheck: null
        };
    }

    const player = data.players[playerName];

    // Zwiększ licznik przekleństw (każde przekleństwo = -1 punkt w bilansie)
    player.swearCount = (player.swearCount || 0) + 1;

    // Zwiększ licznik miesięczny przekleństw
    if (!player.monthly[monthKey]) {
        player.monthly[monthKey] = 0;
    }
    player.monthly[monthKey]++;

    // Zwiększ licznik roczny przekleństw
    if (!player.yearly[yearKey]) {
        player.yearly[yearKey] = 0;
    }
    player.yearly[yearKey]++;

    // Zapisz ostatnią aktywność i zresetuj liczniki nieaktywnych okresów
    player.lastActivity = new Date().toISOString();
    player.rewardedInactiveDays = 0;
    player.rewardedInactiveWeeks = 0;

    saveData(data);

    // Dodaj obliczony total do zwracanego obiektu dla kompatybilności
    return { ...player, total: calculatePlayerTotal(player) };
}

/**
 * Pobiera wyniki dla danego okresu
 * - month: bilans punktów (reaguje na zakupy), swearCount = przekleństwa w miesiącu
 * - year: liczba przekleństw w roku
 * - all: całkowita liczba przekleństw
 *
 * Sortowanie:
 * - month: najwyższy bilans = 1 miejsce; przy remisie: mniej przekleństw w miesiącu wygrywa
 * - year/all: najmniej przekleństw = 1 miejsce; przy remisie: wyższy bilans wygrywa
 */
function getScores(period = 'month') {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    const scores = PLAYERS.map(player => {
        const playerData = data.players[player] || {};
        let points = 0;
        let swearCount = 0;
        let balance = calculatePlayerTotal(playerData);

        switch (period) {
            case 'month':
                // Miesiąc: bilans punktów, ale swearCount to przekleństwa w miesiącu
                points = balance;
                swearCount = playerData.monthly?.[monthKey] || 0;
                break;
            case 'year':
                // Rok: liczba przekleństw w roku
                swearCount = playerData.yearly?.[yearKey] || 0;
                points = swearCount;
                break;
            case 'all':
                // Ogółem: całkowita liczba przekleństw
                swearCount = playerData.swearCount || 0;
                points = swearCount;
                break;
        }

        return { name: player, points, swearCount, balance };
    });

    // Sortowanie z obsługą remisów:
    if (period === 'month') {
        // Miesiąc: od najwyższego bilansu, przy remisie mniej przekleństw wygrywa
        return scores.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points; // Wyższy bilans = lepszy
            }
            return a.swearCount - b.swearCount; // Mniej przekleństw = lepszy
        });
    } else {
        // Rok/Ogółem: od najmniejszej liczby przekleństw, przy remisie wyższy bilans wygrywa
        return scores.sort((a, b) => {
            if (a.points !== b.points) {
                return a.points - b.points; // Mniej przekleństw = lepszy
            }
            return b.balance - a.balance; // Wyższy bilans = lepszy
        });
    }
}

/**
 * Pobiera miesięczny wynik gracza
 */
function getPlayerMonthlyScore(playerName) {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    return data.players[playerName]?.monthly[monthKey] || 0;
}

/**
 * Pobiera sumę przekleństw zespołu dla okresu
 */
function getTeamTotal(period = 'month') {
    const scores = getScores(period);
    return scores.reduce((sum, player) => sum + player.swearCount, 0);
}

/**
 * Pobiera bilans punktów gracza (może być dodatni lub ujemny)
 */
function getPlayerPoints(playerName) {
    const data = getData();
    const player = data.players[playerName];
    if (!player) return 0;
    return calculatePlayerTotal(player);
}

/**
 * Eksportuje dane (do backupu)
 */
function exportData() {
    return JSON.stringify(getData(), null, 2);
}

/**
 * Importuje dane (z backupu)
 */
function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        saveData(data);
        return true;
    } catch (e) {
        console.error('Błąd importu danych:', e);
        return false;
    }
}
