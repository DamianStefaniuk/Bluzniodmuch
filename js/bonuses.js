/**
 * Bluzniodmuch - Moduł bonusów
 *
 * Funkcje do naliczania bonusów za nieaktywność (dni/tygodnie/miesiące bez przekleństw)
 * oraz sprawdzania zwycięzców miesiąca/roku.
 *
 * Zależności: data.js, achievements.js
 */

/**
 * Sprawdza i zapisuje zwycięzcę poprzedniego miesiąca
 * Zwycięzca to osoba z NAJMNIEJSZĄ liczbą przekleństw w danym miesiącu
 * Przy remisie wygrywa osoba z wyższym bilansem
 * Przyznaje osiągnięcie "Mistrz [Miesiąc] [Rok]"
 */
function checkMonthWinner(data) {
    const now = new Date();
    // Sprawdź poprzedni miesiąc
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    // Sprawdź czy już sprawdzono ten miesiąc (używamy pola lastMonthWinnerCheck na poziomie danych)
    if (data.lastMonthWinnerCheck === prevMonthKey) {
        return [];
    }

    // Data rozpoczęcia śledzenia - nie przyznajemy osiągnięć za miesiące przed startem
    const trackingStartDate = data.trackingStartDate
        ? new Date(data.trackingStartDate)
        : new Date('2025-12-15T00:00:00.000Z');
    const trackingStartMonthKey = `${trackingStartDate.getFullYear()}-${String(trackingStartDate.getMonth() + 1).padStart(2, '0')}`;

    // Nie przyznajemy osiągnięć za miesiące przed startem aplikacji
    if (prevMonthKey < trackingStartMonthKey) {
        data.lastMonthWinnerCheck = prevMonthKey;
        return [];
    }

    // Znajdź wyniki wszystkich graczy za poprzedni miesiąc
    const monthlyScores = [];
    PLAYERS.forEach(playerName => {
        const player = data.players[playerName];
        if (!player) return;
        const swears = player.monthly?.[prevMonthKey] || 0;
        const balance = calculatePlayerTotal(player);
        monthlyScores.push({ name: playerName, swears, balance });
    });

    // Sprawdź czy są gracze
    if (monthlyScores.length === 0) {
        data.lastMonthWinnerCheck = prevMonthKey;
        return [];
    }

    // Sortuj: najpierw po przekleństwach (mniej = lepiej), przy remisie po bilansie (wyższy = lepiej)
    monthlyScores.sort((a, b) => {
        if (a.swears !== b.swears) {
            return a.swears - b.swears; // Mniej przekleństw = lepszy
        }
        return b.balance - a.balance; // Wyższy bilans = lepszy (przy remisie)
    });

    // Zwycięzca - osoba z najmniejszą liczbą przekleństw (i najwyższym bilansem przy remisie)
    const winner = monthlyScores[0];

    // Sprawdź czy nie ma remisu na pierwszym miejscu (takie same przekleństwa I bilans)
    const tiedWinners = monthlyScores.filter(p => p.swears === winner.swears && p.balance === winner.balance);

    // Przyznaj osiągnięcia zwycięzcom
    const awardedAchievements = [];
    tiedWinners.forEach(w => {
        const player = data.players[w.name];

        // Dodaj wygrany miesiąc do listy wygranych
        if (!player.monthsWon) {
            player.monthsWon = [];
        }
        if (!player.monthsWon.includes(prevMonthKey)) {
            player.monthsWon.push(prevMonthKey);
        }

        // Przyznaj osiągnięcie za konkretny miesiąc
        const achievement = awardMonthChampion(w.name, prevMonthKey);
        if (achievement) {
            awardedAchievements.push(achievement);
        }
    });

    // Oznacz miesiąc jako sprawdzony
    data.lastMonthWinnerCheck = prevMonthKey;

    return awardedAchievements;
}

/**
 * Sprawdza i zapisuje zwycięzcę poprzedniego roku
 * Zwycięzca to osoba z NAJMNIEJSZĄ liczbą przekleństw w danym roku
 * Przy remisie wygrywa osoba z wyższym bilansem
 * Przyznaje osiągnięcie "Mistrz Roku [YYYY]"
 */
function checkYearWinner(data) {
    const now = new Date();

    // Sprawdzamy tylko w styczniu (początek nowego roku)
    if (now.getMonth() !== 0) {
        return [];
    }

    // Sprawdź poprzedni rok
    const prevYearKey = (now.getFullYear() - 1).toString();

    // Sprawdź czy już sprawdzono ten rok (używamy pola lastYearWinnerCheck na poziomie danych)
    if (data.lastYearWinnerCheck === prevYearKey) {
        return [];
    }

    // Data rozpoczęcia śledzenia - nie przyznajemy osiągnięć za lata przed startem
    const trackingStartDate = data.trackingStartDate
        ? new Date(data.trackingStartDate)
        : new Date('2025-12-15T00:00:00.000Z');
    const trackingStartYearKey = trackingStartDate.getFullYear().toString();

    // Nie przyznajemy osiągnięć za lata przed startem aplikacji
    if (prevYearKey < trackingStartYearKey) {
        data.lastYearWinnerCheck = prevYearKey;
        return [];
    }

    // Znajdź wyniki wszystkich graczy za poprzedni rok
    const yearlyScores = [];
    PLAYERS.forEach(playerName => {
        const player = data.players[playerName];
        if (!player) return;
        const swears = player.yearly?.[prevYearKey] || 0;
        const balance = calculatePlayerTotal(player);
        yearlyScores.push({ name: playerName, swears, balance });
    });

    // Sprawdź czy są gracze
    if (yearlyScores.length === 0) {
        data.lastYearWinnerCheck = prevYearKey;
        return [];
    }

    // Sortuj: najpierw po przekleństwach (mniej = lepiej), przy remisie po bilansie (wyższy = lepiej)
    yearlyScores.sort((a, b) => {
        if (a.swears !== b.swears) {
            return a.swears - b.swears; // Mniej przekleństw = lepszy
        }
        return b.balance - a.balance; // Wyższy bilans = lepszy (przy remisie)
    });

    // Zwycięzca - osoba z najmniejszą liczbą przekleństw (i najwyższym bilansem przy remisie)
    const winner = yearlyScores[0];

    // Sprawdź czy nie ma remisu na pierwszym miejscu (takie same przekleństwa I bilans)
    const tiedWinners = yearlyScores.filter(p => p.swears === winner.swears && p.balance === winner.balance);

    // Przyznaj osiągnięcia zwycięzcom
    const awardedAchievements = [];
    tiedWinners.forEach(w => {
        const player = data.players[w.name];

        // Dodaj wygrany rok do listy wygranych (jeśli potrzebne)
        if (!player.yearsWon) {
            player.yearsWon = [];
        }
        if (!player.yearsWon.includes(prevYearKey)) {
            player.yearsWon.push(prevYearKey);
        }

        // Przyznaj osiągnięcie za konkretny rok
        const achievement = awardYearChampion(w.name, prevYearKey);
        if (achievement) {
            awardedAchievements.push(achievement);
        }
    });

    // Oznacz rok jako sprawdzony
    data.lastYearWinnerCheck = prevYearKey;

    return awardedAchievements;
}

/**
 * Stosuje bonusy za nieaktywność (TYLKO DNI ROBOCZE pon-pt)
 * - Dzień roboczy bez przekleństwa = +1 punkt
 * - Tydzień roboczy (5 dni) bez przekleństwa = +5 punktów
 * - Miesiąc bez przekleństwa (wszystkie dni robocze) = +10 punktów
 */
function applyInactivityBonuses() {
    // ZAWSZE najpierw skoryguj bonusy na podstawie aktualnych urlopów
    // (urlopy mogły być dodane/usunięte od ostatniego sprawdzenia)
    if (typeof recalculateAllPlayersBonuses === 'function') {
        recalculateAllPlayersBonuses();
    }

    const data = getData();
    const today = toLocalDateString(new Date());
    const lastBonusCheck = data.lastBonusCheck || null;

    // Jeśli już sprawdzono dzisiaj, tylko sprawdź osiągnięcia i zakończ
    if (lastBonusCheck === today) {
        checkAndShowNewAchievements();
        return;
    }

    // W weekend nie naliczamy bonusów
    if (isWeekend()) {
        // Ale nadal sprawdzamy osiągnięcia i zwycięzców
        checkMonthWinner(data);
        checkYearWinner(data);
        saveData(data);
        checkAndShowNewAchievements();
        return;
    }

    // Sprawdź zwycięzcę poprzedniego miesiąca i przyznaj osiągnięcia
    const monthChampionAchievements = checkMonthWinner(data);
    monthChampionAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
    });

    // Sprawdź zwycięzcę poprzedniego roku i przyznaj osiągnięcia (tylko w styczniu)
    const yearChampionAchievements = checkYearWinner(data);
    yearChampionAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
    });

    const now = new Date();

    // Data rozpoczęcia śledzenia (dla graczy bez aktywności)
    const trackingStartDate = data.trackingStartDate
        ? new Date(data.trackingStartDate)
        : new Date('2025-12-15T00:00:00.000Z');

    PLAYERS.forEach(player => {
        if (!data.players[player]) return;

        // Pomiń graczy na urlopie - nie naliczamy bonusów
        if (isPlayerOnVacation(player)) {
            return;
        }

        const playerData = data.players[player];

        // Dla graczy bez aktywności (nigdy nie przeklinali) - używamy daty startu śledzenia
        // Dla graczy z aktywnością - używamy daty ostatniego przekleństwa
        const referenceDate = playerData.lastActivity
            ? new Date(playerData.lastActivity)
            : trackingStartDate;

        // Oblicz DNI ROBOCZE nieaktywności (od ostatniego przekleństwa lub od początku śledzenia)
        // Uwzględniamy urlopy gracza - dni urlopowe nie są liczone jako aktywne dni robocze
        const workdaysSinceActivity = countWorkdaysSince(referenceDate, player);

        // Bonus za dni robocze bez przekleństw (+1 punkt za dzień roboczy)
        if (workdaysSinceActivity > 0) {
            const daysRewarded = playerData.rewardedInactiveDays || 0;
            const newDaysToReward = workdaysSinceActivity - daysRewarded;

            if (newDaysToReward > 0) {
                // Dodaj punkty za nieaktywne dni robocze (tylko do bonusGained)
                playerData.bonusGained = (playerData.bonusGained || 0) + newDaysToReward;
                playerData.rewardedInactiveDays = workdaysSinceActivity;
            }
        }

        // Bonus za pełne tygodnie robocze bez przekleństw (+5 punktów za tydzień = 5 dni roboczych)
        const fullWorkWeeks = Math.floor(workdaysSinceActivity / 5); // 5 dni roboczych = 1 tydzień
        const weeksRewarded = playerData.rewardedInactiveWeeks || 0;
        const newWeeksToReward = fullWorkWeeks - weeksRewarded;

        if (newWeeksToReward > 0) {
            const weekBonus = newWeeksToReward * 5;
            playerData.bonusGained = (playerData.bonusGained || 0) + weekBonus;
            playerData.rewardedInactiveWeeks = fullWorkWeeks;
        }

        // Bonus za cały miesiąc bez przekleństw (+10 punktów)
        const lastMonthChecked = playerData.lastMonthBonusCheck || null;

        // Sprawdź poprzedni miesiąc
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

        // Klucz miesiąca startu śledzenia (nie przyznajemy bonusu za miesiące przed startem aplikacji)
        const trackingStartMonthKey = `${trackingStartDate.getFullYear()}-${String(trackingStartDate.getMonth() + 1).padStart(2, '0')}`;

        // Przyznaj bonus tylko jeśli:
        // 1. Nie sprawdzono jeszcze tego miesiąca
        // 2. Poprzedni miesiąc jest >= miesiąca startu śledzenia (aplikacja działała w tym miesiącu)
        // 3. Gracz nie przeklinał w poprzednim miesiącu (w żadnym dniu roboczym)
        if (lastMonthChecked !== prevMonthKey && prevMonthKey >= trackingStartMonthKey) {
            const prevMonthCount = playerData.monthly?.[prevMonthKey] || 0;

            if (prevMonthCount === 0) {
                // Bonus +10 za cały miesiąc bez przekleństw
                playerData.bonusGained = (playerData.bonusGained || 0) + 10;
                playerData.lastMonthBonusCheck = prevMonthKey;

                // Zapisz czysty miesiąc do listy (dla osiągnięć)
                if (!playerData.cleanMonths) playerData.cleanMonths = [];
                if (!playerData.cleanMonths.includes(prevMonthKey)) {
                    playerData.cleanMonths.push(prevMonthKey);
                }
            }
        }
    });

    data.lastBonusCheck = today;
    saveData(data);

    // Sprawdź wszystkie osiągnięcia dla wszystkich graczy i pokaż notyfikacje
    checkAndShowNewAchievements();
}

/**
 * Sprawdza wszystkie osiągnięcia dla wszystkich graczy
 * i wyświetla notyfikacje o nowo zdobytych
 */
function checkAndShowNewAchievements() {
    // Sprawdź czy funkcja checkAllPlayersAchievements istnieje (z achievements.js)
    if (typeof checkAllPlayersAchievements === 'function') {
        const newAchievements = checkAllPlayersAchievements();
        newAchievements.forEach(achievement => {
            showAchievementNotification(achievement);
        });
    }
}
