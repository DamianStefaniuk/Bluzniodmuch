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
 * Konwertuje obiekt Date na string w formacie YYYY-MM-DD używając LOKALNEJ daty
 * (NIE używaj toISOString() bo zwraca UTC i może przesunąć dzień!)
 * @param {Date} date - data do konwersji
 * @returns {string} - data w formacie YYYY-MM-DD
 */
function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================
// FUNKCJE DNI ROBOCZYCH
// ============================================

/**
 * Sprawdza czy dana data to dzień roboczy (pon-pt)
 * @param {Date|string} date - data do sprawdzenia
 * @returns {boolean}
 */
function isWorkday(date = new Date()) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = d.getDay(); // 0 = niedziela, 1 = poniedziałek, ..., 6 = sobota
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Sprawdza czy dzisiaj jest weekend (sob-nie)
 * @returns {boolean}
 */
function isWeekend(date = new Date()) {
    return !isWorkday(date);
}

/**
 * Liczy dni robocze między dwiema datami (włącznie z obiema jeśli są robocze)
 * @param {Date} startDate - data początkowa
 * @param {Date} endDate - data końcowa
 * @returns {number} - liczba dni roboczych
 */
function countWorkdaysBetween(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        if (isWorkday(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

/**
 * Liczy dni robocze od daty do wczoraj (nie licząc daty początkowej ani dzisiejszego dnia)
 * Dzisiejszy dzień NIE jest liczony, bo jeszcze nie wiemy czy gracz przeklnie
 * Bonus za dzień X jest przyznawany dopiero w dniu X+1
 * Opcjonalnie uwzględnia urlopy gracza - dni urlopowe nie są liczone
 * @param {Date|string} fromDate - data początkowa
 * @param {string|null} playerName - opcjonalna nazwa gracza (aby wykluczyć dni urlopowe)
 * @returns {number} - liczba dni roboczych (bez urlopów jeśli podano gracza)
 */
function countWorkdaysSince(fromDate, playerName = null) {
    const start = typeof fromDate === 'string' ? new Date(fromDate) : new Date(fromDate);
    start.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Zacznij od następnego dnia po dacie początkowej
    const current = new Date(start);
    current.setDate(current.getDate() + 1);

    let count = 0;
    // Liczymy tylko dni PRZED dzisiejszym (current < now, nie current <= now)
    // Dzisiejszy dzień nie jest liczony, bo jeszcze się nie skończył
    while (current < now) {
        // Sprawdź czy to dzień roboczy
        if (isWorkday(current)) {
            // Jeśli podano gracza, sprawdź czy nie był na urlopie tego dnia
            if (playerName) {
                if (!isPlayerOnVacation(playerName, current)) {
                    count++;
                }
            } else {
                count++;
            }
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

/**
 * Liczy dni robocze w danym miesiącu
 * @param {number} year - rok
 * @param {number} month - miesiąc (0-11)
 * @returns {number} - liczba dni roboczych
 */
function countWorkdaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return countWorkdaysBetween(firstDay, lastDay);
}

/**
 * Liczy dni robocze w poprzednim miesiącu, w których gracz nie przeklinał
 * Uwzględnia tylko dni robocze od początku miesiąca (lub od trackingStartDate jeśli później)
 * @param {object} playerData - dane gracza
 * @param {string} monthKey - klucz miesiąca "YYYY-MM"
 * @param {Date} trackingStartDate - data rozpoczęcia śledzenia
 * @returns {object} - { workdays: liczba dni roboczych, swearCount: liczba przekleństw }
 */
function getMonthWorkdayStats(playerData, monthKey, trackingStartDate) {
    const [year, month] = monthKey.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    // Użyj późniejszej daty: początek miesiąca lub trackingStartDate
    const startDate = trackingStartDate > firstDayOfMonth ? trackingStartDate : firstDayOfMonth;

    const workdays = countWorkdaysBetween(startDate, lastDayOfMonth);
    const swearCount = playerData.monthly?.[monthKey] || 0;

    return { workdays, swearCount };
}

/**
 * Oblicza aktualny streak (dni robocze bez przeklinania) dla gracza
 * @param {string} playerName - nazwa gracza
 * @returns {number} - liczba dni roboczych bez przeklinania
 */
function calculateCurrentStreak(playerName) {
    const data = getData();
    const player = data.players[playerName];
    if (!player) return 0;

    // Jeśli brak lastActivity - liczymy od trackingStartDate
    const referenceDate = player.lastActivity
        ? new Date(player.lastActivity)
        : new Date(data.trackingStartDate);

    // Użyj istniejącej funkcji countWorkdaysSince (uwzględnia urlopy)
    return countWorkdaysSince(referenceDate, playerName);
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
            vacations: {},
            holidays: [],
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
                cleanMonths: [], // Miesiące bez przekleństw z naliczonym bonusem
                longestStreak: 0 // Najdłuższy streak (dni bez przeklinania)
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

        // Migracja: dodaj history jeśli nie istnieje
        if (!data.history) {
            data.history = {};
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
                if (typeof p.longestStreak !== 'number') {
                    p.longestStreak = 0;
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
 * Blokuje dodawanie jeśli gracz jest na urlopie lub jest weekend
 */
function addSwear(playerName) {
    // Sprawdź czy jest weekend - jeśli tak, zablokuj
    if (isWeekend()) {
        const data = getData();
        const player = data.players[playerName] || {};
        return { ...player, total: calculatePlayerTotal(player), blocked: true, reason: 'weekend' };
    }

    // Sprawdź czy gracz jest na urlopie - jeśli tak, zablokuj
    if (isPlayerOnVacation(playerName)) {
        const data = getData();
        const player = data.players[playerName] || {};
        return { ...player, total: calculatePlayerTotal(player), blocked: true, reason: 'vacation' };
    }

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
            lastMonthBonusCheck: null,
            longestStreak: 0
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

    // Zapisz aktualny streak jako najdłuższy jeśli jest większy (przed resetem)
    const currentStreak = calculateCurrentStreak(playerName);
    if (currentStreak > (player.longestStreak || 0)) {
        player.longestStreak = currentStreak;
    }

    // Zapisz ostatnią aktywność i zresetuj liczniki nieaktywnych okresów
    player.lastActivity = new Date().toISOString();
    player.rewardedInactiveDays = 0;
    player.rewardedInactiveWeeks = 0;

    saveData(data);

    // Dodaj obliczony total do zwracanego obiektu dla kompatybilności
    return { ...player, total: calculatePlayerTotal(player) };
}

/**
 * Pobiera poprzedni ranking dla danego okresu
 * @param {string} period - 'month', 'year' lub 'all'
 * @returns {object} - mapa gracz -> pozycja (1-indexed)
 */
function getPreviousRanking(period) {
    const data = getData();
    if (!data.history) return {};

    const key = `${period}Ranking`;
    return data.history[key] || {};
}

/**
 * Zapisuje aktualny ranking jako poprzedni
 * @param {string} period - 'month', 'year' lub 'all'
 * @param {Array} scores - posortowana tablica wyników
 */
function savePreviousRanking(period, scores) {
    const data = getData();
    if (!data.history) {
        data.history = {};
    }

    const key = `${period}Ranking`;
    const ranking = {};
    scores.forEach((player, index) => {
        ranking[player.name] = index + 1;
    });

    data.history[key] = ranking;
    saveData(data);
}

/**
 * Pobiera wyniki dla danego okresu
 * - month: liczba przekleństw w miesiącu
 * - year: liczba przekleństw w roku
 * - all: całkowita liczba przekleństw
 *
 * Sortowanie:
 * - Wszystkie okresy: najmniej przekleństw = 1 miejsce
 * - Przy remisie: poprzednia pozycja decyduje (kto był wyżej, zostaje wyżej)
 */
function getScores(period = 'month') {
    const data = getData();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    // Pobierz poprzedni ranking dla rozstrzygania remisów
    const previousRanking = getPreviousRanking(period);

    const scores = PLAYERS.map(player => {
        const playerData = data.players[player] || {};
        let points = 0;
        let swearCount = 0;
        let balance = calculatePlayerTotal(playerData);

        switch (period) {
            case 'month':
                // Miesiąc: liczba przekleństw w miesiącu
                swearCount = playerData.monthly?.[monthKey] || 0;
                points = swearCount;
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

        // Poprzednia pozycja (domyślnie bardzo wysoka liczba dla nowych graczy)
        const prevPosition = previousRanking[player] || 999;

        return { name: player, points, swearCount, balance, prevPosition };
    });

    // Sortowanie: od najmniejszej liczby przekleństw, przy remisie poprzednia pozycja decyduje
    const sortedScores = scores.sort((a, b) => {
        if (a.points !== b.points) {
            return a.points - b.points; // Mniej przekleństw = lepszy
        }
        return a.prevPosition - b.prevPosition; // Poprzednia niższa pozycja = lepszy
    });

    // Zapisz aktualny ranking jako poprzedni (dla przyszłych wywołań)
    savePreviousRanking(period, sortedScores);

    return sortedScores;
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

// ============================================
// FUNKCJE URLOPOWE
// ============================================

/**
 * Pobiera urlopy wszystkich graczy
 */
function getVacations() {
    const data = getData();
    return data.vacations || {};
}

/**
 * Pobiera urlopy konkretnego gracza (bez usuniętych)
 */
function getPlayerVacations(playerName) {
    const vacations = getVacations();
    const playerVacations = vacations[playerName] || [];
    // Filtruj usunięte urlopy (soft delete)
    return playerVacations.filter(v => !v.deleted);
}

/**
 * Pobiera wszystkie urlopy gracza (włącznie z usuniętymi) - do celów synchronizacji
 */
function getPlayerVacationsRaw(playerName) {
    const vacations = getVacations();
    return vacations[playerName] || [];
}

/**
 * Sprawdza czy gracz jest na urlopie w danym dniu
 * @param {string} playerName - nazwa gracza
 * @param {Date|string} date - data do sprawdzenia (domyślnie dzisiaj)
 * @returns {boolean}
 */
function isPlayerOnVacation(playerName, date = new Date()) {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const checkDateStr = toLocalDateString(checkDate);

    const playerVacations = getPlayerVacations(playerName); // już filtruje usunięte

    return playerVacations.some(vacation => {
        const startDate = vacation.startDate;
        const endDate = vacation.endDate;
        return checkDateStr >= startDate && checkDateStr <= endDate;
    });
}

/**
 * Sprawdza czy zakres dat obejmuje dzisiejszy dzień
 * @param {string} startDate - data początkowa (YYYY-MM-DD)
 * @param {string} endDate - data końcowa (YYYY-MM-DD)
 * @returns {boolean}
 */
function dateRangeIncludesToday(startDate, endDate) {
    const today = toLocalDateString(new Date());
    return today >= startDate && today <= endDate;
}

/**
 * Przelicza bonusy dla wszystkich graczy
 * Używane po synchronizacji lub masowych zmianach urlopów
 *
 * @returns {object} - informacje o korektach dla każdego gracza
 */
function recalculateAllPlayersBonuses() {
    const results = {};
    PLAYERS.forEach(playerName => {
        results[playerName] = recalculateBonusesForPlayer(playerName);
    });
    return results;
}

/**
 * Koryguje bonusy gracza na podstawie aktualnych urlopów
 * Używane po dodaniu/usunięciu urlopu (szczególnie wstecznego)
 *
 * WAŻNE: Nie resetuje całkowitego bonusGained, tylko koryguje różnicę!
 * Gracz mógł wcześniej zdobyć bonusy, potem przekląć, i znowu zdobywać -
 * te historyczne bonusy są zachowane.
 *
 * @param {string} playerName - nazwa gracza
 * @returns {object} - informacja o korekcie { oldBonus, newBonus, difference }
 */
function recalculateBonusesForPlayer(playerName) {
    const data = getData();
    const playerData = data.players[playerName];
    if (!playerData) return { oldBonus: 0, newBonus: 0, difference: 0 };

    const oldBonus = playerData.bonusGained || 0;
    const oldDays = playerData.rewardedInactiveDays || 0;
    const oldWeeks = playerData.rewardedInactiveWeeks || 0;

    // Data referencyjna - ostatnia aktywność lub tracking start
    const trackingStartDate = data.trackingStartDate
        ? new Date(data.trackingStartDate)
        : new Date('2025-12-15T00:00:00.000Z');

    const referenceDate = playerData.lastActivity
        ? new Date(playerData.lastActivity)
        : trackingStartDate;

    // Przelicz dni robocze (bez urlopów) od referencji do wczoraj
    const newDays = countWorkdaysSince(referenceDate, playerName);

    // Oblicz nowe tygodnie
    const newWeeks = Math.floor(newDays / 5);

    // Oblicz różnicę w dniach i tygodniach
    // Może być ujemna (gdy dodano urlop wsteczny) lub dodatnia (gdy usunięto urlop)
    const daysDiff = newDays - oldDays;
    const weeksDiff = newWeeks - oldWeeks;

    // Skoryguj bonusGained o różnicę
    // +1 za każdy dzień różnicy, +5 za każdy tydzień różnicy
    const bonusCorrection = daysDiff + (weeksDiff * 5);
    const newBonus = oldBonus + bonusCorrection;

    // Aktualizuj dane gracza
    playerData.bonusGained = newBonus;
    playerData.rewardedInactiveDays = newDays;
    playerData.rewardedInactiveWeeks = newWeeks;

    saveData(data);

    return {
        oldBonus,
        newBonus,
        difference: bonusCorrection,
        oldDays,
        newDays,
        daysDiff,
        oldWeeks,
        newWeeks,
        weeksDiff
    };
}

/**
 * Koryguje bonusy gracza gdy urlop jest dodawany/usuwany
 * Wywołuje pełne przeliczenie bonusów
 *
 * @param {string} playerName - nazwa gracza
 * @param {boolean} isAddingVacation - true gdy dodajemy urlop, false gdy usuwamy
 * @returns {object} - informacja o korekcie
 */
function adjustBonusForTodayVacation(playerName, isAddingVacation) {
    // Przelicz bonusy od nowa - urlopy są teraz uwzględnione
    return recalculateBonusesForPlayer(playerName);
}

/**
 * Dodaje urlop dla gracza
 * Automatycznie łączy nachodzące na siebie urlopy
 * Przelicza bonusy i osiągnięcia (urlop może być wsteczny)
 * @param {string} playerName - nazwa gracza
 * @param {string} startDate - data początkowa (YYYY-MM-DD)
 * @param {string} endDate - data końcowa (YYYY-MM-DD)
 * @returns {object} - dodany urlop
 */
function addVacation(playerName, startDate, endDate) {
    const data = getData();

    if (!data.vacations) {
        data.vacations = {};
    }

    if (!data.vacations[playerName]) {
        data.vacations[playerName] = [];
    }

    // Dodaj nowy urlop
    const newVacation = {
        id: generateId(),
        startDate: startDate,
        endDate: endDate,
        createdAt: new Date().toISOString()
    };

    data.vacations[playerName].push(newVacation);

    // Scal nachodzące urlopy
    data.vacations[playerName] = mergeOverlappingVacations(data.vacations[playerName]);

    saveData(data);

    // Przelicz bonusy - urlop może być wsteczny, więc zawsze przeliczamy
    recalculateBonusesForPlayer(playerName);

    // Usuń osiągnięcia przyznane w dni urlopowe i sprawdź ponownie
    if (typeof removeAchievementsOnVacationDays === 'function') {
        removeAchievementsOnVacationDays(playerName);
    }
    if (typeof recheckAchievementsAfterRecalculation === 'function') {
        recheckAchievementsAfterRecalculation();
    }

    return newVacation;
}

/**
 * Usuwa urlop gracza (soft delete - oznacza jako usunięty)
 * Przelicza bonusy i osiągnięcia (usunięty urlop mógł być wsteczny)
 * @param {string} playerName - nazwa gracza
 * @param {string} vacationId - ID urlopu do usunięcia
 * @returns {boolean} - czy usunięto
 */
function removeVacation(playerName, vacationId) {
    const data = getData();

    if (!data.vacations || !data.vacations[playerName]) {
        return false;
    }

    // Znajdź urlop do usunięcia
    const vacationToRemove = data.vacations[playerName].find(v => v.id === vacationId && !v.deleted);

    if (!vacationToRemove) {
        return false;
    }

    // Soft delete - oznacz jako usunięty zamiast fizycznie usuwać
    vacationToRemove.deleted = true;
    vacationToRemove.deletedAt = new Date().toISOString();

    saveData(data);

    // Przelicz bonusy - usunięty urlop mógł być wsteczny, więc zawsze przeliczamy
    recalculateBonusesForPlayer(playerName);

    // Ponownie sprawdź osiągnięcia (gracz mógł odzyskać punkty/dni bez przeklinania)
    if (typeof recheckAchievementsAfterRecalculation === 'function') {
        recheckAchievementsAfterRecalculation();
    }

    return true;
}

/**
 * Scala nachodzące na siebie urlopy
 * Urlopy świąteczne (isHoliday=true) nie są scalane z normalnymi urlopami
 * Usunięte urlopy (deleted=true) nie są scalane - są zachowane osobno dla synchronizacji
 * @param {Array} vacations - tablica urlopów
 * @returns {Array} - scalone urlopy
 */
function mergeOverlappingVacations(vacations) {
    if (vacations.length <= 1) return vacations;

    // Zachowaj usunięte urlopy osobno (nie scalamy ich)
    const deletedVacations = vacations.filter(v => v.deleted);
    const activeVacations = vacations.filter(v => !v.deleted);

    if (activeVacations.length <= 1) {
        return [...activeVacations, ...deletedVacations];
    }

    // Rozdziel urlopy świąteczne i normalne (tylko aktywne)
    const holidayVacations = activeVacations.filter(v => v.isHoliday);
    const normalVacations = activeVacations.filter(v => !v.isHoliday);

    // Scal tylko normalne urlopy
    const mergedNormal = mergeVacationArray(normalVacations);

    // Scal święta osobno (między sobą)
    const mergedHolidays = mergeVacationArray(holidayVacations);

    // Połącz wyniki (aktywne scalone + usunięte zachowane)
    return [...mergedNormal, ...mergedHolidays, ...deletedVacations];
}

/**
 * Pomocnicza funkcja do scalania tablicy urlopów
 * @param {Array} vacations - tablica urlopów do scalenia
 * @returns {Array} - scalone urlopy
 */
function mergeVacationArray(vacations) {
    if (vacations.length <= 1) return vacations;

    // Sortuj po dacie początkowej
    const sorted = [...vacations].sort((a, b) => a.startDate.localeCompare(b.startDate));

    const merged = [{ ...sorted[0] }]; // Kopiuj obiekt aby nie modyfikować oryginału

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];

        // Sprawdź czy urlopy nachodzą na siebie lub są przyległe
        // Dodajemy 1 dzień do last.endDate aby sprawdzić przyległość
        // Parsuj datę jako lokalną (dodaj T12:00 żeby uniknąć problemów z strefą czasową)
        const lastEndPlusOne = new Date(last.endDate + 'T12:00:00');
        lastEndPlusOne.setDate(lastEndPlusOne.getDate() + 1);
        const lastEndPlusOneStr = toLocalDateString(lastEndPlusOne);

        if (current.startDate <= lastEndPlusOneStr) {
            // Scal - weź późniejszą datę końcową
            if (current.endDate > last.endDate) {
                last.endDate = current.endDate;
            }
            // Zachowaj flagę isHoliday jeśli którykolwiek ją ma
            if (current.isHoliday) {
                last.isHoliday = true;
            }
        } else {
            // Nie nachodzą - dodaj jako osobny
            merged.push({ ...current });
        }
    }

    return merged;
}

/**
 * Pobiera urlopy wszystkich graczy w danym miesiącu
 * @param {number} year - rok
 * @param {number} month - miesiąc (0-11)
 * @returns {object} - urlopy per gracz dla danego miesiąca
 */
function getVacationsForMonth(year, month) {
    const vacations = getVacations();
    const result = {};

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const monthStartStr = toLocalDateString(monthStart);
    const monthEndStr = toLocalDateString(monthEnd);

    Object.keys(vacations).forEach(playerName => {
        const playerVacations = vacations[playerName] || [];

        // Filtruj urlopy które nachodzą na dany miesiąc (bez usuniętych)
        const relevantVacations = playerVacations.filter(v => {
            return !v.deleted && v.endDate >= monthStartStr && v.startDate <= monthEndStr;
        });

        if (relevantVacations.length > 0) {
            result[playerName] = relevantVacations;
        }
    });

    return result;
}

// ============================================
// FUNKCJE DNI WOLNYCH OD PRACY (ŚWIĘTA)
// ============================================

/**
 * Dodaje dzień wolny od pracy (urlop dla wszystkich graczy)
 * Przelicza bonusy i osiągnięcia dla wszystkich graczy (święto może być wsteczne)
 * @param {string} startDate - data początkowa (YYYY-MM-DD)
 * @param {string} endDate - data końcowa (YYYY-MM-DD)
 * @returns {object} - informacja o dodanych urlopach
 */
function addHoliday(startDate, endDate) {
    const data = getData();

    if (!data.vacations) {
        data.vacations = {};
    }

    // Zapisz informację o dniu wolnym (dla historii/wyświetlania)
    if (!data.holidays) {
        data.holidays = [];
    }

    const holidayId = generateId();
    const holiday = {
        id: holidayId,
        startDate: startDate,
        endDate: endDate,
        createdAt: new Date().toISOString()
    };
    data.holidays.push(holiday);

    // Scal nachodzące święta
    data.holidays = mergeOverlappingHolidays(data.holidays);

    // Dodaj urlop dla każdego gracza
    PLAYERS.forEach(playerName => {
        if (!data.vacations[playerName]) {
            data.vacations[playerName] = [];
        }

        const newVacation = {
            id: generateId(),
            startDate: startDate,
            endDate: endDate,
            createdAt: new Date().toISOString(),
            isHoliday: true // Oznacz jako dzień wolny od pracy
        };

        data.vacations[playerName].push(newVacation);

        // Scal nachodzące urlopy dla gracza
        data.vacations[playerName] = mergeOverlappingVacations(data.vacations[playerName]);
    });

    saveData(data);

    // Przelicz bonusy dla wszystkich graczy - święto może być wsteczne
    PLAYERS.forEach(playerName => {
        recalculateBonusesForPlayer(playerName);
    });

    // Usuń osiągnięcia przyznane w dni urlopowe i sprawdź ponownie
    if (typeof recalculateAllAchievements === 'function') {
        recalculateAllAchievements();
    }

    return holiday;
}

/**
 * Pobiera listę dni wolnych od pracy (bez usuniętych)
 * @returns {Array} - tablica świąt
 */
function getHolidays() {
    const data = getData();
    const holidays = data.holidays || [];
    // Filtruj usunięte święta (soft delete)
    return holidays.filter(h => !h.deleted);
}

/**
 * Usuwa dzień wolny od pracy (soft delete - oznacza jako usunięty)
 * Przelicza bonusy i osiągnięcia dla wszystkich graczy (usunięte święto mogło być wsteczne)
 * @param {string} holidayId - ID święta do usunięcia
 * @returns {boolean} - czy usunięto
 */
function removeHoliday(holidayId) {
    const data = getData();

    if (!data.holidays) {
        return false;
    }

    // Znajdź święto do usunięcia (nieusunięte)
    const holiday = data.holidays.find(h => h.id === holidayId && !h.deleted);
    if (!holiday) {
        return false;
    }

    // Soft delete święta
    holiday.deleted = true;
    holiday.deletedAt = new Date().toISOString();

    // Soft delete powiązanych urlopów graczy (te z flagą isHoliday w tym samym zakresie dat)
    PLAYERS.forEach(playerName => {
        if (data.vacations && data.vacations[playerName]) {
            data.vacations[playerName].forEach(v => {
                // Oznacz jako usunięty jeśli to urlop świąteczny z dokładnie takim samym zakresem
                if (v.isHoliday && !v.deleted && v.startDate === holiday.startDate && v.endDate === holiday.endDate) {
                    v.deleted = true;
                    v.deletedAt = new Date().toISOString();
                }
            });
        }
    });

    saveData(data);

    // Przelicz bonusy dla wszystkich graczy - usunięte święto mogło być wsteczne
    PLAYERS.forEach(playerName => {
        recalculateBonusesForPlayer(playerName);
    });

    // Ponownie sprawdź osiągnięcia (gracze mogli odzyskać punkty/dni bez przeklinania)
    if (typeof recheckAchievementsAfterRecalculation === 'function') {
        recheckAchievementsAfterRecalculation();
    }

    return true;
}

/**
 * Scala nachodzące na siebie święta
 * Usunięte święta (deleted=true) nie są scalane - są zachowane osobno dla synchronizacji
 * @param {Array} holidays - tablica świąt
 * @returns {Array} - scalone święta
 */
function mergeOverlappingHolidays(holidays) {
    if (holidays.length <= 1) return holidays;

    // Zachowaj usunięte święta osobno (nie scalamy ich)
    const deletedHolidays = holidays.filter(h => h.deleted);
    const activeHolidays = holidays.filter(h => !h.deleted);

    if (activeHolidays.length <= 1) {
        return [...activeHolidays, ...deletedHolidays];
    }

    // Sortuj po dacie początkowej (tylko aktywne)
    const sorted = [...activeHolidays].sort((a, b) => a.startDate.localeCompare(b.startDate));

    const merged = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];

        // Sprawdź czy święta nachodzą na siebie lub są przyległe
        // Parsuj datę jako lokalną (dodaj T12:00 żeby uniknąć problemów z strefą czasową)
        const lastEndPlusOne = new Date(last.endDate + 'T12:00:00');
        lastEndPlusOne.setDate(lastEndPlusOne.getDate() + 1);
        const lastEndPlusOneStr = toLocalDateString(lastEndPlusOne);

        if (current.startDate <= lastEndPlusOneStr) {
            // Scal - weź późniejszą datę końcową
            if (current.endDate > last.endDate) {
                last.endDate = current.endDate;
            }
        } else {
            // Nie nachodzą - dodaj jako osobne
            merged.push(current);
        }
    }

    // Zwróć scalone aktywne + zachowane usunięte
    return [...merged, ...deletedHolidays];
}

// ============================================
// FUNKCJE SPOTKAŃ (MEETINGS)
// ============================================

/**
 * Pobiera listę spotkań (bez usuniętych)
 * @returns {Array} - tablica spotkań
 */
function getMeetings() {
    const data = getData();
    const meetings = data.meetings || [];
    // Filtruj usunięte spotkania (soft delete)
    return meetings.filter(m => !m.deleted);
}

/**
 * Dodaje spotkanie w danym dniu
 * @param {string} date - data spotkania (YYYY-MM-DD)
 * @returns {object} - dodane spotkanie
 */
function addMeeting(date) {
    const data = getData();

    if (!data.meetings) {
        data.meetings = [];
    }

    // Sprawdź czy spotkanie w tym dniu już istnieje
    const existingMeeting = data.meetings.find(m => m.date === date && !m.deleted);
    if (existingMeeting) {
        return existingMeeting; // Zwróć istniejące spotkanie
    }

    const meeting = {
        id: generateId(),
        date: date,
        createdAt: new Date().toISOString()
    };

    data.meetings.push(meeting);
    saveData(data);

    return meeting;
}

/**
 * Usuwa spotkanie (soft delete)
 * @param {string} meetingId - ID spotkania do usunięcia
 * @returns {boolean} - czy usunięto
 */
function removeMeeting(meetingId) {
    const data = getData();

    if (!data.meetings) {
        return false;
    }

    const meeting = data.meetings.find(m => m.id === meetingId && !m.deleted);
    if (!meeting) {
        return false;
    }

    // Soft delete
    meeting.deleted = true;
    meeting.deletedAt = new Date().toISOString();

    saveData(data);
    return true;
}

/**
 * Sprawdza czy w danym dniu jest spotkanie
 * @param {string} dateStr - data w formacie YYYY-MM-DD
 * @returns {boolean}
 */
function isMeetingDay(dateStr) {
    const meetings = getMeetings();
    return meetings.some(m => m.date === dateStr);
}

/**
 * Sprawdza czy dzisiaj jest dzień spotkania
 * @returns {boolean}
 */
function isTodayMeetingDay() {
    const today = toLocalDateString(new Date());
    return isMeetingDay(today);
}

/**
 * Pobiera spotkanie dla danej daty
 * @param {string} dateStr - data w formacie YYYY-MM-DD
 * @returns {object|null} - spotkanie lub null
 */
function getMeetingForDate(dateStr) {
    const meetings = getMeetings();
    return meetings.find(m => m.date === dateStr) || null;
}
