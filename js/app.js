/**
 * Bluzniodmuch - Główna aplikacja
 */

// Aktualnie wybrany okres
let currentPeriod = 'month';

// Flaga synchronizacji w toku
let isSyncing = false;

/**
 * Inicjalizacja aplikacji
 */
document.addEventListener('DOMContentLoaded', async () => {
    initializeData();
    applyInactivityBonuses(); // Nalicz bonusy za nieaktywność
    renderClickers();
    renderScoreboard();
    renderTeamStats();
    setupEventListeners();
    updatePeriodLabel();
    updateSyncIndicator();

    // Automatyczna synchronizacja przy starcie
    if (isSyncConfigured()) {
        await performSync();
    }
});

/**
 * Renderuje przyciski klikerów
 */
function renderClickers() {
    const grid = document.getElementById('clickerGrid');
    const clickerSection = grid.closest('.clickers');
    grid.innerHTML = '';

    // Sprawdź czy użytkownik jest autoryzowany
    const isUserAuthorized = isAuthorizedUser();
    const currentPlayerName = getPlayerNameFromGithub();

    // Pokaż/ukryj overlay dla niezalogowanych
    let overlay = clickerSection.querySelector('.auth-overlay');
    if (!isUserAuthorized) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'auth-overlay';
            overlay.innerHTML = `
                <div class="auth-overlay-content">
                    <span class="auth-overlay-icon">🔒</span>
                    <span class="auth-overlay-text">Zaloguj się w ustawieniach, aby dodawać przekleństwa</span>
                    <a href="settings.html" class="btn btn-primary">Przejdź do ustawień</a>
                </div>
            `;
            clickerSection.style.position = 'relative';
            clickerSection.appendChild(overlay);
        }
    } else if (overlay) {
        overlay.remove();
    }

    // Sprawdź czy jest weekend
    const weekendNow = isWeekend();

    PLAYERS.forEach(player => {
        const monthlySwears = getPlayerMonthlyScore(player);
        const balance = getPlayerTotalBalance(player);
        const status = getPlayerStatus(balance);

        const balanceDisplay = balance > 0 ? `+${balance}` : balance;
        const balanceClass = balance > 0 ? 'positive' : (balance < 0 ? 'negative' : 'neutral');

        const isCurrentPlayer = player === currentPlayerName;

        // Sprawdź czy gracz jest zablokowany (urlop lub weekend)
        const isOnVacation = isPlayerOnVacation(player);
        const isBlocked = isOnVacation || weekendNow;

        // Ustal status blokady
        let blockReason = null;
        let blockIcon = '';
        let blockText = '';
        if (isOnVacation) {
            blockReason = 'vacation';
            blockIcon = '🏖️';
            blockText = 'Na urlopie';
        } else if (weekendNow) {
            blockReason = 'weekend';
            blockIcon = '📅';
            blockText = 'Weekend';
        }

        const card = document.createElement('div');
        card.className = 'clicker-card'
            + (isCurrentPlayer ? ' current-player' : '')
            + (!isUserAuthorized ? ' disabled' : '')
            + (isBlocked ? ' blocked' : '')
            + (isOnVacation ? ' on-vacation' : '');
        card.dataset.player = player;
        if (blockReason) {
            card.dataset.blockReason = blockReason;
        }

        // Generuj HTML karty
        let cardHtml = `
            <div class="player-status-badge" style="color: ${status.color}">${status.icon}</div>
            <div class="player-name">${player}</div>
            <div class="count">${monthlySwears}</div>
            <div class="player-total ${balanceClass}">Bilans: ${balanceDisplay} pkt</div>
        `;

        // Dodaj informację o blokadzie lub hint
        if (isBlocked) {
            cardHtml += `<div class="block-status">${blockIcon} ${blockText}</div>`;
        } else if (isUserAuthorized) {
            cardHtml += `<div class="click-hint">Kliknij!</div>`;
        } else {
            cardHtml += `<div class="click-hint">🔒</div>`;
        }

        card.innerHTML = cardHtml;

        if (isUserAuthorized) {
            card.addEventListener('click', () => handleClick(player, card));
        }

        grid.appendChild(card);
    });
}

/**
 * Pobiera całkowity bilans punktów gracza (może być dodatni lub ujemny)
 */
function getPlayerTotalBalance(playerName) {
    const data = getData();
    const player = data.players[playerName];
    if (!player) return 0;
    return calculatePlayerTotal(player);
}

/**
 * Obsługuje kliknięcie w kliker
 */
function handleClick(playerName, cardElement) {
    // Dodaj przekleństwo
    const playerData = addSwear(playerName);

    // Sprawdź czy akcja została zablokowana
    if (playerData.blocked) {
        // Animacja shake dla zablokowanej karty
        cardElement.classList.add('shake-animation');
        setTimeout(() => cardElement.classList.remove('shake-animation'), 500);

        // Pokaż powiadomienie o blokadzie
        let message = '';
        if (playerData.reason === 'vacation') {
            message = `${playerName} jest na urlopie - nie można dodać przekleństwa`;
        } else if (playerData.reason === 'weekend') {
            message = 'Weekend - gra jest wstrzymana do poniedziałku';
        }

        showBlockedNotification(message);
        return;
    }

    // Animacja
    cardElement.classList.add('pop-animation');
    setTimeout(() => cardElement.classList.remove('pop-animation'), 300);

    // Aktualizuj licznik na karcie
    const countElement = cardElement.querySelector('.count');
    countElement.textContent = playerData.monthly[getCurrentMonthKey()] || 0;

    // Aktualizuj bilans na karcie
    const balance = calculatePlayerTotal(playerData);
    const balanceElement = cardElement.querySelector('.player-total');
    if (balanceElement) {
        const balanceDisplay = balance > 0 ? `+${balance}` : balance;
        const balanceClass = balance > 0 ? 'positive' : (balance < 0 ? 'negative' : 'neutral');
        balanceElement.textContent = `Bilans: ${balanceDisplay} pkt`;
        balanceElement.className = `player-total ${balanceClass}`;
    }

    // Sprawdź osiągnięcia
    const newAchievements = checkAndAwardAchievements(playerName);
    newAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
    });

    // Aktualizuj tablicę i statystyki
    renderScoreboard();
    renderTeamStats();

    // Zaplanuj synchronizację
    scheduleSyncAfterAction();
}

/**
 * Pokazuje powiadomienie o zablokowanej akcji
 */
function showBlockedNotification(message) {
    // Usuń istniejące powiadomienie jeśli jest
    const existing = document.querySelector('.blocked-notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'blocked-notification';
    notification.innerHTML = `
        <span class="blocked-icon">🚫</span>
        <span class="blocked-message">${message}</span>
    `;
    document.body.appendChild(notification);

    // Animacja wejścia
    setTimeout(() => notification.classList.add('show'), 10);

    // Usuń po 3 sekundach
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Renderuje tablicę wyników
 */
function renderScoreboard() {
    const tbody = document.getElementById('scoresBody');
    const scores = getScores(currentPeriod);

    tbody.innerHTML = '';

    scores.forEach((player, index) => {
        const place = index + 1;
        const row = document.createElement('tr');
        row.className = place <= 3 ? `place-${place}` : '';

        let pointsDisplay, pointsClass;

        if (currentPeriod === 'month') {
            // Miesiąc: pokazuje bilans (z kolorowaniem)
            pointsDisplay = player.points > 0 ? `+${player.points}` : player.points;
            pointsClass = player.points > 0 ? 'positive' : (player.points < 0 ? 'negative' : 'neutral');
        } else {
            // Rok/Ogółem: pokazuje liczbę przekleństw (bez kolorowania)
            pointsDisplay = player.points;
            pointsClass = 'neutral';
        }

        row.innerHTML = `
            <td><span class="place-badge">${place}</span></td>
            <td>${player.name}</td>
            <td class="${pointsClass}">${pointsDisplay}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Renderuje statystyki zespołu
 */
function renderTeamStats() {
    document.getElementById('totalMonth').textContent = getTeamTotal('month');
    document.getElementById('totalYear').textContent = getTeamTotal('year');
    document.getElementById('totalAll').textContent = getTeamTotal('all');
}

/**
 * Aktualizuje etykietę okresu
 */
function updatePeriodLabel() {
    const label = document.getElementById('currentPeriodLabel');
    switch (currentPeriod) {
        case 'month':
            label.textContent = getMonthName(getCurrentMonthKey());
            break;
        case 'year':
            label.textContent = `Rok ${getCurrentYearKey()}`;
            break;
        case 'all':
            label.textContent = 'Ogółem';
            break;
    }
}

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupEventListeners() {
    // Przyciski okresów
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Usuń aktywną klasę ze wszystkich
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

            // Dodaj aktywną klasę do klikniętego
            e.target.classList.add('active');

            // Zmień okres i odśwież
            currentPeriod = e.target.dataset.period;
            renderScoreboard();
            updatePeriodLabel();
        });
    });

    // Wskaźnik synchronizacji - kliknięcie
    const syncIndicator = document.getElementById('syncIndicator');
    if (syncIndicator) {
        syncIndicator.addEventListener('click', async () => {
            if (isSyncConfigured()) {
                await performSync();
            } else {
                window.location.href = 'settings.html';
            }
        });
    }
}

/**
 * Aktualizuje wskaźnik synchronizacji
 */
function updateSyncIndicator() {
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    const syncIndicator = document.getElementById('syncIndicator');

    if (!syncIcon || !syncText) return;

    if (isSyncConfigured()) {
        if (isSyncing) {
            syncIcon.textContent = '🔄';
            syncText.textContent = 'Synchronizowanie...';
            syncIndicator.classList.add('syncing');
        } else {
            syncIcon.textContent = '🟢';
            syncText.textContent = 'Połączono';
            syncIndicator.classList.remove('syncing');
        }
    } else {
        syncIcon.textContent = '⚪';
        syncText.textContent = 'Offline';
        syncIndicator.classList.remove('syncing');
    }
}

/**
 * Wykonuje synchronizację
 */
async function performSync() {
    if (isSyncing || !isSyncConfigured()) return;

    isSyncing = true;
    updateSyncIndicator();

    try {
        const result = await syncData();

        if (result.success) {
            // Odśwież widoki po synchronizacji
            renderClickers();
            renderScoreboard();
            renderTeamStats();
        } else {
            console.error('Sync failed:', result.message);
        }
    } catch (error) {
        console.error('Sync error:', error);
    } finally {
        isSyncing = false;
        updateSyncIndicator();
    }
}

/**
 * Synchronizuje po każdej akcji (z debounce)
 */
let syncTimeout = null;
function scheduleSyncAfterAction() {
    if (!isSyncConfigured()) return;

    // Debounce - czekaj 2 sekundy po ostatniej akcji
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(async () => {
        await performSync();
    }, 2000);
}
