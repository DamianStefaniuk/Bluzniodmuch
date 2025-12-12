/**
 * Bluzniodmuch - Logika sklepu
 */

let selectedPlayer = 'Jacek';
let selectedItem = null;

/**
 * Inicjalizacja sklepu
 */
document.addEventListener('DOMContentLoaded', async () => {
    initializeData();

    // Sprawdź i zastosuj bonusy za nieaktywność
    applyInactivityBonuses();

    renderShop();
    renderPlayerBalances();
    renderPurchaseHistory();
    setupShopEventListeners();

    // Synchronizuj jeśli skonfigurowane
    if (isSyncConfigured()) {
        await syncData();
        renderPlayerBalances();
        renderPurchaseHistory();
    }
});

/**
 * Renderuje sklep z fantami
 */
function renderShop() {
    const grid = document.getElementById('shopGrid');
    const items = getShopItems();

    grid.innerHTML = '';

    // Grupuj po kategorii
    const categories = {
        team: { name: 'Fanty zespołowe', items: [] },
        personal: { name: 'Fanty osobiste', items: [] },
        fun: { name: 'Fanty zabawne', items: [] }
    };

    items.forEach(item => {
        if (categories[item.category]) {
            categories[item.category].items.push(item);
        }
    });

    // Renderuj każdą kategorię
    Object.entries(categories).forEach(([key, category]) => {
        if (category.items.length === 0) return;

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'shop-category-header';
        categoryHeader.textContent = category.name;
        grid.appendChild(categoryHeader);

        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'shop-category-grid';

        category.items.forEach(item => {
            const card = createShopItemCard(item);
            categoryGrid.appendChild(card);
        });

        grid.appendChild(categoryGrid);
    });
}

/**
 * Tworzy kartę przedmiotu
 */
function createShopItemCard(item) {
    const card = document.createElement('div');
    card.className = 'shop-item-card';
    card.dataset.itemId = item.id;

    card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.description}</div>
        <div class="shop-item-cost">
            <span class="cost-value">${item.cost}</span>
            <span class="cost-label">pkt</span>
        </div>
        <button class="btn btn-primary shop-buy-btn" data-item-id="${item.id}">
            Kup
        </button>
    `;

    return card;
}

/**
 * Renderuje salda graczy
 */
function renderPlayerBalances() {
    PLAYERS.forEach(player => {
        const balance = getPlayerBalance(player);
        const status = getPlayerStatus(balance);

        const balanceEl = document.getElementById(`balance-${player}`);
        const statusEl = document.getElementById(`status-${player}`);

        if (balanceEl) {
            balanceEl.textContent = balance;
        }

        if (statusEl) {
            statusEl.textContent = `${status.icon} ${status.name}`;
            statusEl.style.color = status.color;
        }
    });

    // Aktualizuj aktywny przycisk
    document.querySelectorAll('.player-select-btn').forEach(btn => {
        const player = btn.dataset.player;
        const balance = getPlayerBalance(player);
        const status = getPlayerStatus(balance);
        btn.style.borderColor = status.color;
    });
}

/**
 * Pobiera saldo gracza (całkowite punkty minus wydane)
 */
function getPlayerBalance(playerName) {
    const data = getData();
    const player = data.players[playerName];

    if (!player) return 0;

    const totalPoints = player.total || 0;
    const spentPoints = player.spent || 0;

    return Math.max(0, totalPoints - spentPoints);
}

/**
 * Renderuje historię zakupów
 */
function renderPurchaseHistory() {
    const historyList = document.getElementById('historyList');
    const data = getData();
    const purchases = data.purchases || [];

    if (purchases.length === 0) {
        historyList.innerHTML = '<p class="no-history">Brak historii zakupów</p>';
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

        return `
            <div class="history-item">
                <span class="history-icon">${item?.icon || '🎁'}</span>
                <div class="history-details">
                    <span class="history-player">${purchase.player}</span>
                    <span class="history-name">${item?.name || purchase.itemId}</span>
                </div>
                <div class="history-meta">
                    <span class="history-cost">-${purchase.cost} pkt</span>
                    <span class="history-date">${date}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Otwiera modal potwierdzenia zakupu
 */
function openPurchaseModal(item) {
    selectedItem = item;
    const balance = getPlayerBalance(selectedPlayer);

    document.getElementById('modalTitle').textContent = `Kupić "${item.name}"?`;
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalCost').textContent = item.cost;
    document.getElementById('modalBalance').textContent = balance;

    const confirmBtn = document.getElementById('modalConfirm');
    if (balance < item.cost) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Za mało punktów!';
    } else {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Kupuję!';
    }

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
 * Realizuje zakup
 */
async function completePurchase() {
    if (!selectedItem || !selectedPlayer) return;

    const balance = getPlayerBalance(selectedPlayer);
    if (balance < selectedItem.cost) {
        alert('Za mało punktów!');
        return;
    }

    // Zapisz zakup
    const data = getData();

    // Dodaj wydane punkty do gracza
    if (!data.players[selectedPlayer].spent) {
        data.players[selectedPlayer].spent = 0;
    }
    data.players[selectedPlayer].spent += selectedItem.cost;

    // Dodaj do historii zakupów
    if (!data.purchases) {
        data.purchases = [];
    }
    data.purchases.push({
        player: selectedPlayer,
        itemId: selectedItem.id,
        cost: selectedItem.cost,
        date: new Date().toISOString()
    });

    saveData(data);

    // Synchronizuj
    if (isSyncConfigured()) {
        await syncData();
    }

    // Odśwież widoki
    renderPlayerBalances();
    renderPurchaseHistory();
    closePurchaseModal();

    // Pokaż potwierdzenie
    showNotification(`${selectedPlayer} odkupił: ${selectedItem.name}!`);
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
 */
function applyInactivityBonuses() {
    const data = getData();
    const today = new Date().toISOString().split('T')[0];
    const lastBonusCheck = data.lastBonusCheck || null;

    // Jeśli już sprawdzono dzisiaj, pomiń
    if (lastBonusCheck === today) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    PLAYERS.forEach(player => {
        if (!data.players[player]) return;

        const playerData = data.players[player];
        const lastActivity = playerData.lastActivity ? new Date(playerData.lastActivity) : null;

        if (!lastActivity) return;

        // Oblicz dni nieaktywności
        const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

        // Bonus za dni bez przekleństw (max do liczby punktów)
        if (daysSinceActivity > 0) {
            const daysToReward = playerData.rewardedInactiveDays || 0;
            const newDaysToReward = daysSinceActivity - daysToReward;

            if (newDaysToReward > 0) {
                // Odejmij punkty za nieaktywne dni (1 punkt za dzień)
                const bonusPoints = Math.min(newDaysToReward, playerData.total || 0);

                if (bonusPoints > 0) {
                    if (!playerData.bonusReductions) {
                        playerData.bonusReductions = 0;
                    }
                    playerData.bonusReductions += bonusPoints;
                    playerData.total = Math.max(0, playerData.total - bonusPoints);
                }

                playerData.rewardedInactiveDays = daysSinceActivity;
            }
        }

        // Sprawdź bonus za cały miesiąc bez przekleństw
        const monthlyCount = playerData.monthly?.[currentMonth] || 0;
        const lastMonthChecked = playerData.lastMonthBonusCheck || null;

        // Sprawdź poprzedni miesiąc
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

        if (lastMonthChecked !== prevMonthKey && now.getDate() >= 1) {
            const prevMonthCount = playerData.monthly?.[prevMonthKey] || 0;

            if (prevMonthCount === 0 && playerData.total > 0) {
                // Bonus -10 za cały miesiąc bez przekleństw
                const monthBonus = Math.min(10, playerData.total);
                playerData.total = Math.max(0, playerData.total - monthBonus);

                if (!playerData.bonusReductions) {
                    playerData.bonusReductions = 0;
                }
                playerData.bonusReductions += monthBonus;

                playerData.lastMonthBonusCheck = prevMonthKey;
            }
        }
    });

    data.lastBonusCheck = today;
    saveData(data);
}

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupShopEventListeners() {
    // Wybór gracza
    document.querySelectorAll('.player-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.player-select-btn').forEach(b =>
                b.classList.remove('active')
            );
            btn.classList.add('active');
            selectedPlayer = btn.dataset.player;
        });
    });

    // Przyciski kupna
    document.getElementById('shopGrid').addEventListener('click', (e) => {
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
