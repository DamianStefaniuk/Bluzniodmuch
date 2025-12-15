/**
 * Bluzniodmuch - Logika sklepu
 *
 * NOWY SYSTEM:
 * - Nagrody: kupowane za punkty dodatnie (koszt dodatni)
 * - Kary: kupowane gdy mamy ujemne punkty (koszt ujemny)
 *   Po wykonaniu kary, punkty są dodawane (poprawa statusu)
 */

let selectedPlayer = null;
let selectedItem = null;

/**
 * Inicjalizacja sklepu
 */
document.addEventListener('DOMContentLoaded', async () => {
    initializeData();
    applyInactivityBonuses();

    // Automatycznie ustaw gracza na podstawie zalogowanego użytkownika
    const currentPlayerName = getPlayerNameFromGithub();
    if (currentPlayerName) {
        selectedPlayer = currentPlayerName;
    }

    renderShop();
    renderPlayerBalances();
    renderPlayerSelector();
    renderPurchaseHistory();
    setupShopEventListeners();

    if (isSyncConfigured()) {
        await syncData();
        renderPlayerBalances();
        renderPlayerSelector();
        renderPurchaseHistory();
    }
});

/**
 * Renderuje sklep z nagrodami i karami
 */
function renderShop() {
    const rewardsGrid = document.getElementById('rewardsGrid');
    const penaltiesGrid = document.getElementById('penaltiesGrid');

    // Renderuj nagrody
    const rewards = getRewards();
    rewardsGrid.innerHTML = '';
    rewards.forEach(item => {
        const card = createShopItemCard(item, 'reward');
        rewardsGrid.appendChild(card);
    });

    // Renderuj kary
    const penalties = getPenalties();
    penaltiesGrid.innerHTML = '';
    penalties.forEach(item => {
        const card = createShopItemCard(item, 'penalty');
        penaltiesGrid.appendChild(card);
    });
}

/**
 * Tworzy kartę przedmiotu
 */
function createShopItemCard(item, type) {
    const card = document.createElement('div');
    card.className = `shop-item-card ${type}`;
    card.dataset.itemId = item.id;

    const costDisplay = type === 'reward'
        ? `${item.cost} pkt`
        : `${Math.abs(item.cost)} pkt`;

    const costLabel = type === 'reward' ? 'Koszt' : 'Wymaga';
    const buttonText = type === 'reward' ? 'Odbierz nagrodę' : 'Wykonaj karę';
    const buttonClass = type === 'reward' ? 'btn-success' : 'btn-warning';

    card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.description}</div>
        <div class="shop-item-cost ${type}">
            <span class="cost-label">${costLabel}:</span>
            <span class="cost-value">${costDisplay}</span>
        </div>
        <button class="btn ${buttonClass} shop-buy-btn" data-item-id="${item.id}" data-type="${type}">
            ${buttonText}
        </button>
    `;

    return card;
}

/**
 * Renderuje salda graczy
 */
function renderPlayerBalances() {
    const data = getData();

    PLAYERS.forEach(player => {
        const playerData = data.players[player];
        const balance = playerData ? calculatePlayerTotal(playerData) : 0;
        const status = getPlayerStatus(balance);

        const balanceEl = document.getElementById(`balance-${player}`);
        const statusEl = document.getElementById(`status-${player}`);

        if (balanceEl) {
            const balanceDisplay = balance > 0 ? `+${balance}` : `${balance}`;
            const balanceClass = balance > 0 ? 'positive' : (balance < 0 ? 'negative' : 'neutral');
            balanceEl.textContent = balanceDisplay;
            balanceEl.className = `player-balance ${balanceClass}`;
        }

        if (statusEl) {
            statusEl.textContent = `${status.icon} ${status.name}`;
            statusEl.style.color = status.color;
        }
    });

    // Aktualizuj aktywny przycisk
    document.querySelectorAll('.player-select-btn').forEach(btn => {
        const player = btn.dataset.player;
        const playerData = data.players[player];
        const balance = playerData ? calculatePlayerTotal(playerData) : 0;
        const status = getPlayerStatus(balance);
        btn.style.borderColor = status.color;
    });
}

/**
 * Pobiera bilans punktów gracza (może być dodatni lub ujemny)
 */
function getPlayerBalance(playerName) {
    const data = getData();
    const player = data.players[playerName];

    if (!player) return 0;
    return calculatePlayerTotal(player);
}

/**
 * Renderuje historię zakupów
 */
function renderPurchaseHistory() {
    const historyList = document.getElementById('historyList');
    const data = getData();
    const purchases = data.purchases || [];

    if (purchases.length === 0) {
        historyList.innerHTML = '<p class="no-history">Brak historii</p>';
        return;
    }

    // Sortuj od najnowszych
    const sortedPurchases = [...purchases].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    // Pokaż ostatnie 20
    const recentPurchases = sortedPurchases.slice(0, 20);

    historyList.innerHTML = recentPurchases.map(purchase => {
        const item = getShopItemById(purchase.itemId);
        const date = new Date(purchase.date).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const isReward = purchase.type === 'reward';
        const pointsChange = isReward ? `-${Math.abs(purchase.cost)}` : `+${Math.abs(purchase.cost)}`;
        const changeClass = isReward ? 'negative' : 'positive';
        const actionText = isReward ? 'odebrał nagrodę' : 'wykonał karę';

        return `
            <div class="history-item ${purchase.type}">
                <span class="history-icon">${item?.icon || '🎁'}</span>
                <div class="history-details">
                    <span class="history-player">${purchase.player}</span>
                    <span class="history-action">${actionText}</span>
                    <span class="history-name">${item?.name || purchase.itemId}</span>
                </div>
                <div class="history-meta">
                    <span class="history-cost ${changeClass}">${pointsChange} pkt</span>
                    <span class="history-date">${date}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Otwiera modal potwierdzenia
 */
function openPurchaseModal(item) {
    // Sprawdź czy użytkownik jest zalogowany
    if (!isAuthorizedUser() || !selectedPlayer) {
        showNotification('Musisz być zalogowany, aby korzystać z tej funkcji!');
        return;
    }

    selectedItem = item;
    const balance = getPlayerBalance(selectedPlayer);
    const isReward = item.type === 'reward';

    const modalTitle = isReward ? `Odebrać nagrodę "${item.name}"?` : `Wykonać karę "${item.name}"?`;
    const actionText = isReward ? 'Odbieram!' : 'Wykonuję!';

    document.getElementById('modalTitle').textContent = modalTitle;
    document.getElementById('modalDescription').textContent = item.description;

    const costEl = document.getElementById('modalCost');
    const balanceEl = document.getElementById('modalBalance');
    const confirmBtn = document.getElementById('modalConfirm');

    if (isReward) {
        // Nagroda - potrzebne punkty dodatnie
        costEl.textContent = `${item.cost} pkt`;
        balanceEl.textContent = balance >= 0 ? `+${balance} pkt` : `${balance} pkt`;

        if (balance >= item.cost) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = actionText;
        } else {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Za mało punktów!';
        }
    } else {
        // Kara - potrzebne punkty ujemne
        costEl.textContent = `${Math.abs(item.cost)} pkt`;
        balanceEl.textContent = balance >= 0 ? `+${balance} pkt` : `${balance} pkt`;

        // Można wykonać karę jeśli mamy punkty <= cost (np. -10 <= -10)
        if (balance <= item.cost) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = actionText;
        } else {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Niewystarczająco ujemny wynik!';
        }
    }

    // Zaktualizuj etykiety w modalu
    document.getElementById('modalCostLabel').textContent = isReward ? 'Koszt:' : 'Wymaga min:';
    document.getElementById('modalBalanceLabel').textContent = 'Twój bilans:';

    document.getElementById('purchaseModal').classList.add('active');
}

/**
 * Zamyka modal
 */
function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
    selectedItem = null;
}

/**
 * Realizuje zakup/wykonanie
 */
async function completePurchase() {
    if (!selectedItem || !selectedPlayer) return;

    const balance = getPlayerBalance(selectedPlayer);
    const isReward = selectedItem.type === 'reward';

    // Sprawdź czy można wykonać akcję
    if (isReward && balance < selectedItem.cost) {
        alert('Za mało punktów!');
        return;
    }
    if (!isReward && balance > selectedItem.cost) {
        alert('Niewystarczająco ujemny wynik!');
        return;
    }

    // Zapisz zakup
    const data = getData();
    const playerData = data.players[selectedPlayer];

    if (isReward) {
        // Nagroda - zwiększ wydane punkty
        playerData.spentOnRewards = (playerData.spentOnRewards || 0) + selectedItem.cost;
    } else {
        // Kara - zwiększ zdobyte punkty z kar
        playerData.earnedFromPenalties = (playerData.earnedFromPenalties || 0) + Math.abs(selectedItem.cost);
    }

    // Dodaj do historii zakupów z unikalnym ID
    if (!data.purchases) {
        data.purchases = [];
    }
    data.purchases.push({
        id: generateId(),
        player: selectedPlayer,
        itemId: selectedItem.id,
        cost: selectedItem.cost,
        type: selectedItem.type,
        date: new Date().toISOString()
    });

    saveData(data);

    // Sprawdź osiągnięcia PRZED synchronizacją
    if (typeof checkAndAwardAchievements === 'function') {
        const newAchievements = checkAndAwardAchievements(selectedPlayer);
        newAchievements.forEach(achievement => {
            showAchievementNotification(achievement);
        });
    }

    // Synchronizuj (teraz włącznie z nowymi osiągnięciami)
    if (isSyncConfigured()) {
        await syncData();
    }

    // Odśwież widoki
    renderPlayerBalances();
    renderPurchaseHistory();
    closePurchaseModal();

    // Pokaż potwierdzenie
    const message = isReward
        ? `${selectedPlayer} odebrał nagrodę: ${selectedItem.name}!`
        : `${selectedPlayer} wykonał karę: ${selectedItem.name}!`;
    showNotification(message);
}

/**
 * Pokazuje powiadomienie
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Stosuje bonusy za nieaktywność
 * - Dzień bez przekleństwa = +1 punkt
 * - Tydzień bez przekleństwa = +5 punktów
 * - Miesiąc bez przekleństwa = +10 punktów
 */
function applyInactivityBonuses() {
    const data = getData();
    const today = new Date().toISOString().split('T')[0];
    const lastBonusCheck = data.lastBonusCheck || null;

    // Jeśli już sprawdzono dzisiaj, pomiń
    if (lastBonusCheck === today) return;

    const now = new Date();

    PLAYERS.forEach(player => {
        if (!data.players[player]) return;

        const playerData = data.players[player];
        const lastActivity = playerData.lastActivity ? new Date(playerData.lastActivity) : null;

        // Jeśli gracz nie ma jeszcze żadnej aktywności, ustaw datę rejestracji
        if (!lastActivity) {
            playerData.lastActivity = new Date().toISOString();
            playerData.rewardedInactiveDays = 0;
            playerData.rewardedInactiveWeeks = 0;
            return;
        }

        // Oblicz dni nieaktywności
        const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

        // Bonus za dni bez przekleństw (+1 punkt za dzień)
        if (daysSinceActivity > 0) {
            const daysRewarded = playerData.rewardedInactiveDays || 0;
            const newDaysToReward = daysSinceActivity - daysRewarded;

            if (newDaysToReward > 0) {
                // Dodaj punkty za nieaktywne dni (tylko do bonusGained)
                playerData.bonusGained = (playerData.bonusGained || 0) + newDaysToReward;
                playerData.rewardedInactiveDays = daysSinceActivity;
            }
        }

        // Bonus za pełne tygodnie bez przekleństw (+5 punktów za tydzień)
        const fullWeeks = Math.floor(daysSinceActivity / 7);
        const weeksRewarded = playerData.rewardedInactiveWeeks || 0;
        const newWeeksToReward = fullWeeks - weeksRewarded;

        if (newWeeksToReward > 0) {
            const weekBonus = newWeeksToReward * 5;
            playerData.bonusGained = (playerData.bonusGained || 0) + weekBonus;
            playerData.rewardedInactiveWeeks = fullWeeks;
        }

        // Bonus za cały miesiąc bez przekleństw (+10 punktów)
        const lastMonthChecked = playerData.lastMonthBonusCheck || null;

        // Sprawdź poprzedni miesiąc
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

        if (lastMonthChecked !== prevMonthKey && now.getDate() >= 1) {
            const prevMonthCount = playerData.monthly?.[prevMonthKey] || 0;

            if (prevMonthCount === 0) {
                // Bonus +10 za cały miesiąc bez przekleństw
                playerData.bonusGained = (playerData.bonusGained || 0) + 10;
                playerData.lastMonthBonusCheck = prevMonthKey;
            }
        }
    });

    data.lastBonusCheck = today;
    saveData(data);
}

/**
 * Renderuje selektor gracza (automatycznie zaznacza zalogowanego, blokuje innych)
 */
function renderPlayerSelector() {
    const playerSelector = document.querySelector('.player-selector');
    const playerSelectSection = document.querySelector('.player-select-section');
    const isUserAuthorized = isAuthorizedUser();
    const currentPlayerName = getPlayerNameFromGithub();

    // Usuń istniejący overlay jeśli jest
    const existingOverlay = playerSelectSection.querySelector('.auth-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Jeśli użytkownik nie jest zalogowany, pokaż overlay
    if (!isUserAuthorized) {
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-overlay-content">
                <span class="auth-overlay-icon">🔒</span>
                <span class="auth-overlay-text">Zaloguj się w ustawieniach, aby korzystać z nagród i kar</span>
                <a href="settings.html" class="btn btn-primary">Przejdź do ustawień</a>
            </div>
        `;
        playerSelectSection.style.position = 'relative';
        playerSelectSection.appendChild(overlay);
        return;
    }

    // Zaznacz aktualnie zalogowanego gracza i zablokuj pozostałych
    document.querySelectorAll('.player-select-btn').forEach(btn => {
        const player = btn.dataset.player;
        const isCurrentPlayer = player === currentPlayerName;

        btn.classList.remove('active', 'locked');

        if (isCurrentPlayer) {
            btn.classList.add('active');
        } else {
            btn.classList.add('locked');
        }
    });
}

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupShopEventListeners() {
    // Wybór gracza jest zablokowany - użytkownik jest automatycznie przypisany do swojego konta
    // Nie dodajemy event listenerów do przycisków wyboru gracza

    // Przyciski kupna - nagrody
    document.getElementById('rewardsGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('shop-buy-btn')) {
            const itemId = e.target.dataset.itemId;
            const item = getShopItemById(itemId);
            if (item) {
                openPurchaseModal(item);
            }
        }
    });

    // Przyciski kupna - kary
    document.getElementById('penaltiesGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('shop-buy-btn')) {
            const itemId = e.target.dataset.itemId;
            const item = getShopItemById(itemId);
            if (item) {
                openPurchaseModal(item);
            }
        }
    });

    // Modal - anuluj
    document.getElementById('modalCancel').addEventListener('click', closePurchaseModal);

    // Modal - potwierdź
    document.getElementById('modalConfirm').addEventListener('click', completePurchase);

    // Zamknij modal klikając poza nim
    document.getElementById('purchaseModal').addEventListener('click', (e) => {
        if (e.target.id === 'purchaseModal') {
            closePurchaseModal();
        }
    });
}
