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
 * Inicjalizuje dane jeśli nie istnieją
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
                monthly: {},
                yearly: {}
            };
        });

        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(initialData));
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
 * Dodaje przekleństwo dla gracza
 */
function addSwear(playerName) {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    if (!data.players[playerName]) {
        data.players[playerName] = {
            total: 0,
            monthly: {},
            yearly: {},
            spent: 0,
            lastActivity: null,
            rewardedInactiveDays: 0
        };
    }

    const player = data.players[playerName];

    // Zwiększ całkowity licznik
    player.total++;

    // Zwiększ licznik miesięczny
    if (!player.monthly[monthKey]) {
        player.monthly[monthKey] = 0;
    }
    player.monthly[monthKey]++;

    // Zwiększ licznik roczny
    if (!player.yearly[yearKey]) {
        player.yearly[yearKey] = 0;
    }
    player.yearly[yearKey]++;

    // Zapisz ostatnią aktywność i zresetuj licznik nieaktywnych dni
    player.lastActivity = new Date().toISOString();
    player.rewardedInactiveDays = 0;

    saveData(data);

    return player;
}

/**
 * Pobiera wyniki dla danego okresu
 */
function getScores(period = 'month') {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    const scores = PLAYERS.map(player => {
        const playerData = data.players[player] || { total: 0, monthly: {}, yearly: {} };
        let count = 0;

        switch (period) {
            case 'month':
                count = playerData.monthly[monthKey] || 0;
                break;
            case 'year':
                count = playerData.yearly[yearKey] || 0;
                break;
            case 'all':
                count = playerData.total || 0;
                break;
        }

        return { name: player, count };
    });

    // Sortuj od największej liczby
    return scores.sort((a, b) => b.count - a.count);
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
 * Pobiera sumę zespołu dla okresu
 */
function getTeamTotal(period = 'month') {
    const scores = getScores(period);
    return scores.reduce((sum, player) => sum + player.count, 0);
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
