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
    grid.innerHTML = '';

    PLAYERS.forEach(player => {
        const monthlySwears = getPlayerMonthlyScore(player);
        const balance = getPlayerTotalBalance(player);
        const status = getPlayerStatus(balance);

        const balanceDisplay = balance >= 0 ? `+${balance}` : balance;
        const balanceClass = balance >= 0 ? 'positive' : 'negative';

        const card = document.createElement('div');
        card.className = 'clicker-card';
        card.dataset.player = player;
        card.innerHTML = `
            <div class="player-status-badge" style="color: ${status.color}">${status.icon}</div>
            <div class="player-name">${player}</div>
            <div class="count">${monthlySwears}</div>
            <div class="player-total ${balanceClass}">Bilans: ${balanceDisplay} pkt</div>
            <div class="click-hint">Kliknij!</div>
        `;

        card.addEventListener('click', () => handleClick(player, card));

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
    return player.total || 0;
}

/**
 * Obsługuje kliknięcie w kliker
 */
function handleClick(playerName, cardElement) {
    // Dodaj przekleństwo
    const playerData = addSwear(playerName);

    // Animacja
    cardElement.classList.add('pop-animation');
    setTimeout(() => cardElement.classList.remove('pop-animation'), 300);

    // Aktualizuj licznik na karcie
    const countElement = cardElement.querySelector('.count');
    countElement.textContent = playerData.monthly[getCurrentMonthKey()] || 0;

    // Aktualizuj bilans na karcie
    const balance = playerData.total || 0;
    const balanceElement = cardElement.querySelector('.player-total');
    if (balanceElement) {
        const balanceDisplay = balance >= 0 ? `+${balance}` : balance;
        balanceElement.textContent = `Bilans: ${balanceDisplay} pkt`;
        balanceElement.className = `player-total ${balance >= 0 ? 'positive' : 'negative'}`;
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

        const pointsDisplay = player.points >= 0 ? `+${player.points}` : player.points;
        const pointsClass = player.points >= 0 ? 'positive' : 'negative';

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
            label.textContent = 'Wszech czasów';
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
