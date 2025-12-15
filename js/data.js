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
 * Inicjalizuje dane jeśli nie istnieją i migruje stare dane
 */
function initializeData() {
    let scores = localStorage.getItem(STORAGE_KEYS.SCORES);

    if (!scores) {
        const initialData = {
            players: {},
            history: {}
        };

        PLAYERS.forEach(player => {
            initialData.players[player] = {
                total: 0,
                swearCount: 0,
                monthly: {},
                yearly: {},
                lastActivity: null,
                rewardedInactiveDays: 0,
                rewardedInactiveWeeks: 0
            };
        });

        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(initialData));
    } else {
        // Migracja starych danych - upewnij się że wszystkie pola istnieją
        const data = JSON.parse(scores);
        let needsSave = false;

        PLAYERS.forEach(player => {
            if (!data.players[player]) {
                data.players[player] = {
                    total: 0,
                    swearCount: 0,
                    monthly: {},
                    yearly: {},
                    lastActivity: null,
                    rewardedInactiveDays: 0,
                    rewardedInactiveWeeks: 0
                };
                needsSave = true;
            } else {
                // Upewnij się że total istnieje (może być ujemny)
                if (typeof data.players[player].total !== 'number') {
                    data.players[player].total = 0;
                    needsSave = true;
                }
                // Dodaj brakujące pola
                if (typeof data.players[player].swearCount !== 'number') {
                    data.players[player].swearCount = data.players[player].total > 0 ? data.players[player].total : 0;
                    needsSave = true;
                }
                if (typeof data.players[player].rewardedInactiveDays !== 'number') {
                    data.players[player].rewardedInactiveDays = 0;
                    needsSave = true;
                }
                if (typeof data.players[player].rewardedInactiveWeeks !== 'number') {
                    data.players[player].rewardedInactiveWeeks = 0;
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
            total: 0,
            swearCount: 0,
            monthly: {},
            yearly: {},
            spent: 0,
            lastActivity: null,
            rewardedInactiveDays: 0,
            rewardedInactiveWeeks: 0
        };
    }

    const player = data.players[playerName];

    // Odejmij punkt za przekleństwo
    player.total--;

    // Zwiększ licznik przekleństw (do statystyk)
    if (!player.swearCount) player.swearCount = 0;
    player.swearCount++;

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

    return player;
}

/**
 * Pobiera wyniki dla danego okresu
 * Teraz pokazuje punkty (dodatnie = dobre, ujemne = złe)
 * Sortowanie: najwyższy wynik = 1 miejsce
 */
function getScores(period = 'month') {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    const scores = PLAYERS.map(player => {
        const playerData = data.players[player] || { total: 0, monthly: {}, yearly: {} };
        let points = 0;
        let swearCount = 0;

        switch (period) {
            case 'month':
                // Punkty za miesiąc = ujemna liczba przekleństw w miesiącu
                swearCount = playerData.monthly[monthKey] || 0;
                points = -swearCount; // każde przekleństwo to -1
                break;
            case 'year':
                // Punkty za rok = ujemna liczba przekleństw w roku
                swearCount = playerData.yearly[yearKey] || 0;
                points = -swearCount;
                break;
            case 'all':
                // Całkowity bilans punktów
                points = playerData.total || 0;
                swearCount = playerData.swearCount || 0;
                break;
        }

        return { name: player, points, swearCount };
    });

    // Sortuj od najwyższego wyniku (najbardziej dodatni = 1 miejsce)
    return scores.sort((a, b) => b.points - a.points);
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
    return player.total || 0;
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
