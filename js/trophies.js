/**
 * Bluzniodmuch - Strona trofeów
 */

// Aktualnie wybrany gracz
let currentPlayer = 'Jacek';

/**
 * Inicjalizacja strony trofeów
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    applyInactivityBonuses(); // Nalicz bonusy za nieaktywność
    renderTeamTrophies();
    renderPlayerTrophies(currentPlayer);
    renderLegend();
    setupTrophyEventListeners();
});

/**
 * Renderuje trofea zespołowe
 */
function renderTeamTrophies() {
    const display = document.getElementById('teamTrophyDisplay');
    const allTeamAchievements = getAllTeamAchievements();
    const awardedTeam = getTeamAwardedAchievements();

    const total = allTeamAchievements.length;
    const earned = awardedTeam.length;
    const percentage = Math.round((earned / total) * 100);

    display.innerHTML = '';

    // Nagłówek ze statystykami
    const header = document.createElement('div');
    header.className = 'player-stats-header';
    header.innerHTML = `
        <p>Zdobyte trofea: <strong>${earned}/${total}</strong> (${percentage}%)</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
    `;
    display.appendChild(header);

    // Pokaż komunikat jeśli brak trofeów
    if (awardedTeam.length === 0) {
        const noTrophies = document.createElement('p');
        noTrophies.className = 'no-trophies';
        noTrophies.textContent = 'Zespół nie zdobył jeszcze żadnych trofeów. Czas to zmienić!';
        display.appendChild(noTrophies);
        return;
    }

    // Siatka trofeów - tylko zdobyte
    const grid = document.createElement('div');
    grid.className = 'player-trophies-list';

    awardedTeam.forEach(achievement => {
        const card = document.createElement('div');
        card.className = 'trophy-card unlocked';

        // Obsługa ikony - emoji lub obrazek
        let iconHtml;
        if (achievement.hasImage && achievement.image) {
            iconHtml = `<img src="${achievement.image}" alt="${achievement.name}" class="trophy-icon-img">`;
        } else {
            iconHtml = achievement.icon;
        }

        card.innerHTML = `
            <div class="trophy-icon">${iconHtml}</div>
            <div class="trophy-name">${achievement.name}</div>
            <div class="trophy-description">${achievement.description}</div>
            <div class="trophy-date">Zdobyte: ${formatDate(achievement.date)}</div>
            ${achievement.note ? `<div class="trophy-note">${achievement.note}</div>` : ''}
        `;

        grid.appendChild(card);
    });

    display.appendChild(grid);
}

/**
 * Renderuje trofea gracza
 */
function renderPlayerTrophies(playerName) {
    const display = document.getElementById('playerTrophyDisplay');
    const playerAchievements = getPlayerAwardedAchievements(playerName);
    const stats = getPlayerAchievementStats(playerName);

    display.innerHTML = '';

    // Nagłówek ze statystykami
    const header = document.createElement('div');
    header.className = 'player-stats-header';

    let statsHtml = `<p>Trofea podstawowe: <strong>${stats.staticEarned}/${stats.staticTotal}</strong> (${stats.percentage}%)</p>`;
    if (stats.monthChampionCount > 0) {
        statsHtml += `<p>Wygrane miesiące: <strong>${stats.monthChampionCount}</strong> 🏆</p>`;
    }
    if (stats.yearChampionCount > 0) {
        statsHtml += `<p>Wygrane lata: <strong>${stats.yearChampionCount}</strong> 🏅</p>`;
    }
    statsHtml += `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${stats.percentage}%"></div>
        </div>
    `;
    header.innerHTML = statsHtml;
    display.appendChild(header);

    if (playerAchievements.length === 0) {
        const noTrophies = document.createElement('p');
        noTrophies.className = 'no-trophies';
        noTrophies.textContent = `${playerName} nie zdobył jeszcze żadnych trofeów. Czas zacząć!`;
        display.appendChild(noTrophies);
        return;
    }

    // Siatka trofeów
    const grid = document.createElement('div');
    grid.className = 'player-trophies-list';

    playerAchievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = 'trophy-card unlocked';

        // Obsługa ikony - emoji lub obrazek
        let iconHtml;
        if (achievement.hasImage && achievement.image) {
            iconHtml = `<img src="${achievement.image}" alt="${achievement.name}" class="trophy-icon-img">`;
        } else {
            iconHtml = achievement.icon;
        }

        card.innerHTML = `
            <div class="trophy-icon">${iconHtml}</div>
            <div class="trophy-name">${achievement.name}</div>
            <div class="trophy-description">${achievement.description}</div>
            <div class="trophy-date">Zdobyte: ${formatDate(achievement.date)}</div>
            ${achievement.note ? `<div class="trophy-note">${achievement.note}</div>` : ''}
        `;

        grid.appendChild(card);
    });

    display.appendChild(grid);
}

/**
 * Renderuje legendę wszystkich osiągnięć
 */
function renderLegend() {
    const grid = document.getElementById('legendGrid');

    grid.innerHTML = '<h3 style="grid-column: 1/-1; margin-bottom: 10px;">Indywidualne</h3>';

    getAllIndividualAchievements().forEach(achievement => {
        const card = document.createElement('div');
        card.className = 'trophy-card';

        // Obsługa ikony - emoji lub obrazek
        let iconHtml;
        if (achievement.image) {
            iconHtml = `<img src="${achievement.image}" alt="${achievement.name}" class="trophy-icon-img">`;
        } else {
            iconHtml = achievement.icon;
        }

        card.innerHTML = `
            <div class="trophy-icon">${iconHtml}</div>
            <div class="trophy-name">${achievement.name}</div>
            <div class="trophy-description">${achievement.description}</div>
        `;
        grid.appendChild(card);
    });

    const teamHeader = document.createElement('h3');
    teamHeader.style.cssText = 'grid-column: 1/-1; margin: 20px 0 10px 0;';
    teamHeader.textContent = 'Zespołowe';
    grid.appendChild(teamHeader);

    getAllTeamAchievements().forEach(achievement => {
        const card = document.createElement('div');
        card.className = 'trophy-card';

        // Obsługa ikony - emoji lub obrazek
        let iconHtml;
        if (achievement.image) {
            iconHtml = `<img src="${achievement.image}" alt="${achievement.name}" class="trophy-icon-img">`;
        } else {
            iconHtml = achievement.icon;
        }

        card.innerHTML = `
            <div class="trophy-icon">${iconHtml}</div>
            <div class="trophy-name">${achievement.name}</div>
            <div class="trophy-description">${achievement.description}</div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Formatuje datę do czytelnej formy
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupTrophyEventListeners() {
    document.querySelectorAll('.player-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Usuń aktywną klasę ze wszystkich
            document.querySelectorAll('.player-tab').forEach(t => t.classList.remove('active'));

            // Dodaj aktywną klasę do klikniętego
            e.target.classList.add('active');

            // Zmień gracza i odśwież
            currentPlayer = e.target.dataset.player;
            renderPlayerTrophies(currentPlayer);
        });
    });
}
