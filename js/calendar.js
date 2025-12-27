/**
 * Bluzniodmuch - Moduł kalendarza urlopów
 *
 * Pozwala graczom oznaczać urlopy i przeglądać urlopy innych graczy.
 * Podczas urlopu gracz jest zablokowany (brak bonusów, przekleństw, osiągnięć).
 */

// Aktualnie wyświetlany miesiąc
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Kolory dla graczy
const PLAYER_COLORS = {
    'Jacek': '#3498db',     // niebieski
    'Mateusz': '#e74c3c',   // czerwony
    'Tomek': '#2ecc71',     // zielony
    'Karol': '#f39c12',     // pomarańczowy
    'Damian': '#9b59b6'     // fioletowy
};

/**
 * Inicjalizacja strony kalendarza
 */
document.addEventListener('DOMContentLoaded', async () => {
    initializeData();
    applyInactivityBonuses();

    renderCalendar();
    renderLegend();
    setupCalendarEventListeners();
    setupVacationForm();
    updateSyncIndicator();

    if (isSyncConfigured()) {
        await performSync();
        renderCalendar();
        renderMyVacations();
    }
});

/**
 * Renderuje kalendarz dla aktualnego miesiąca
 */
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('monthLabel');

    // Aktualizuj etykietę miesiąca
    const monthNames = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Wyczyść dni (zostaw nagłówki)
    const headers = grid.querySelectorAll('.calendar-header');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    // Pobierz urlopy dla tego miesiąca
    const vacationsThisMonth = getVacationsForMonth(currentYear, currentMonth);

    // Pierwszy dzień miesiąca (0 = niedziela, 1 = poniedziałek, ...)
    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDay = firstDay.getDay();
    // Konwertuj na poniedziałek = 0
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Liczba dni w miesiącu
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Dodaj puste komórki na początek
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    // Dodaj dni miesiąca
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        // Oznacz dzisiejszy dzień
        if (dateStr === todayStr) {
            dayCell.classList.add('today');
        }

        // Numer dnia
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Dodaj paski urlopów
        const vacationIndicators = document.createElement('div');
        vacationIndicators.className = 'vacation-indicators';

        PLAYERS.forEach(playerName => {
            if (isPlayerOnVacationOnDate(playerName, dateStr, vacationsThisMonth)) {
                const indicator = document.createElement('div');
                indicator.className = 'vacation-indicator';
                indicator.style.backgroundColor = PLAYER_COLORS[playerName] || '#999';
                indicator.title = `${playerName} - urlop`;
                vacationIndicators.appendChild(indicator);
            }
        });

        dayCell.appendChild(vacationIndicators);
        grid.appendChild(dayCell);
    }

    // Wypełnij pozostałe komórki do pełnych tygodni
    const totalCells = startDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    // Odśwież listę urlopów
    renderMyVacations();
}

/**
 * Sprawdza czy gracz jest na urlopie w danym dniu (pomocnicza funkcja dla kalendarza)
 */
function isPlayerOnVacationOnDate(playerName, dateStr, vacationsData) {
    const playerVacations = vacationsData[playerName] || [];

    return playerVacations.some(vacation => {
        return dateStr >= vacation.startDate && dateStr <= vacation.endDate;
    });
}

/**
 * Renderuje legendę kolorów graczy
 */
function renderLegend() {
    const legend = document.getElementById('calendarLegend');
    legend.innerHTML = '';

    PLAYERS.forEach(playerName => {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = PLAYER_COLORS[playerName] || '#999';

        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = playerName;

        item.appendChild(colorBox);
        item.appendChild(label);
        legend.appendChild(item);
    });
}

/**
 * Renderuje listę urlopów zalogowanego gracza
 */
function renderMyVacations() {
    const currentPlayer = getSelectedPlayer();
    const myVacationsSection = document.getElementById('myVacationsSection');
    const myVacationsList = document.getElementById('myVacationsList');

    if (!currentPlayer) {
        myVacationsSection.style.display = 'none';
        return;
    }

    myVacationsSection.style.display = 'block';
    const vacations = getPlayerVacations(currentPlayer);

    if (vacations.length === 0) {
        myVacationsList.innerHTML = '<p class="no-vacations">Nie masz zaplanowanych urlopów.</p>';
        return;
    }

    // Sortuj po dacie początkowej
    const sortedVacations = [...vacations].sort((a, b) => a.startDate.localeCompare(b.startDate));

    myVacationsList.innerHTML = sortedVacations.map(vacation => {
        const startDate = formatDatePL(vacation.startDate);
        const endDate = formatDatePL(vacation.endDate);
        const days = calculateDays(vacation.startDate, vacation.endDate);

        return `
            <div class="vacation-item">
                <div class="vacation-dates">
                    <span class="vacation-range">${startDate} - ${endDate}</span>
                    <span class="vacation-days">(${days} dni)</span>
                </div>
                <button class="btn btn-danger btn-small" onclick="deleteVacation('${vacation.id}')">Usuń</button>
            </div>
        `;
    }).join('');
}

/**
 * Formatuje datę po polsku
 */
function formatDatePL(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Oblicza liczbę dni między datami
 */
function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
}

/**
 * Usuwa urlop
 */
async function deleteVacation(vacationId) {
    const currentPlayer = getSelectedPlayer();
    if (!currentPlayer) return;

    if (!confirm('Czy na pewno chcesz usunąć ten urlop?')) {
        return;
    }

    removeVacation(currentPlayer, vacationId);
    renderCalendar();

    // Synchronizuj jeśli skonfigurowane
    if (isSyncConfigured()) {
        await syncData();
    }
}

/**
 * Konfiguruje formularz dodawania urlopu
 */
function setupVacationForm() {
    const currentPlayer = getSelectedPlayer();
    const vacationFormSection = document.getElementById('vacationFormSection');

    if (!currentPlayer) {
        vacationFormSection.style.display = 'none';
        return;
    }

    vacationFormSection.style.display = 'block';

    const form = document.getElementById('vacationForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Walidacja
        if (!startDate || !endDate) {
            alert('Wybierz obie daty');
            return;
        }

        if (endDate < startDate) {
            alert('Data końcowa musi być późniejsza lub równa dacie początkowej');
            return;
        }

        // Dodaj urlop
        addVacation(currentPlayer, startDate, endDate);

        // Wyczyść formularz
        form.reset();

        // Odśwież kalendarz
        renderCalendar();

        // Synchronizuj jeśli skonfigurowane
        if (isSyncConfigured()) {
            await syncData();
        }
    });
}

/**
 * Konfiguruje nasłuchiwacze zdarzeń
 */
function setupCalendarEventListeners() {
    // Nawigacja między miesiącami
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Synchronizacja po kliknięciu
    const syncIndicator = document.getElementById('syncIndicator');
    if (syncIndicator) {
        syncIndicator.addEventListener('click', async () => {
            if (isSyncConfigured()) {
                syncIndicator.classList.add('syncing');
                await syncData();
                renderCalendar();
                updateSyncIndicator();
                syncIndicator.classList.remove('syncing');
            }
        });
    }
}

/**
 * Wykonuje pełną synchronizację
 */
async function performSync() {
    try {
        const result = await syncData();
        updateSyncIndicator();
        return result;
    } catch (error) {
        console.error('Błąd synchronizacji:', error);
        updateSyncIndicator();
    }
}

/**
 * Aktualizuje wskaźnik synchronizacji
 */
function updateSyncIndicator() {
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');

    if (!syncIcon || !syncText) return;

    if (isSyncConfigured()) {
        const lastSync = getLastSyncTime();
        syncIcon.textContent = '🟢';
        if (lastSync) {
            const timeAgo = getTimeAgo(lastSync);
            syncText.textContent = `Sync: ${timeAgo}`;
        } else {
            syncText.textContent = 'Połączono';
        }
    } else {
        syncIcon.textContent = '⚪';
        syncText.textContent = 'Offline';
    }
}

/**
 * Formatuje czas od ostatniej synchronizacji
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'przed chwilą';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
    return `${Math.floor(diff / 86400)} dni temu`;
}
