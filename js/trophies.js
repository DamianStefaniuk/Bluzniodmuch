/**
 * Bluzniodmuch - Strona trofeów
 */

// Aktualnie wybrany gracz
let currentPlayer = 'Jacek';

/**
 * Inicjalizacja strony trofeów
 */
document.addEventListener('DOMContentLoaded', () => {
    renderTeamTrophies();
    renderPlayerTrophies(currentPlayer);
    renderLegend();
    setupTrophyEventListeners();
});

/**
 * Renderuje trofea zespołowe
 */
function renderTeamTrophies() {
    const grid = document.getElementById('teamTrophiesGrid');
    const allTeamAchievements = getAllTeamAchievements();
    const awardedTeam = getTeamAwardedAchievements();

    grid.innerHTML = '';

    allTeamAchievements.forEach(achievement => {
        const awarded = awardedTeam.find(a => a.id === achievement.id);
        const isUnlocked = !!awarded;

        const card = document.createElement('div');
        card.className = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;

        card.innerHTML = `
            <div class="trophy-icon">${achievement.icon}</div>
            <div class="trophy-name">${achievement.name}</div>
            <div class="trophy-description">${achievement.description}</div>
            ${isUnlocked ? `<div class="trophy-date">Zdobyte: ${formatDate(awarded.date)}</div>` : ''}
            ${awarded?.note ? `<div class="trophy-note">${awarded.note}</div>` : ''}
        `;

        grid.appendChild(card);
    });

    // Pokaż komunikat jeśli brak trofeów
    if (awardedTeam.length === 0) {
        const noTrophies = document.createElement('p');
        noTrophies.className = 'no-trophies';
        noTrophies.textContent = 'Zespół nie zdobył jeszcze żadnych trofeów. Czas to zmienić!';
        grid.appendChild(noTrophies);
    }
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
    header.innerHTML = `
        <p>Zdobyte trofea: <strong>${stats.earned}/${stats.total}</strong> (${stats.percentage}%)</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${stats.percentage}%"></div>
        </div>
    `;
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

        card.innerHTML = `
            <div class="trophy-icon">${achievement.icon}</div>
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
        card.innerHTML = `
            <div class="trophy-icon">${achievement.icon}</div>
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
        card.innerHTML = `
            <div class="trophy-icon">${achievement.icon}</div>
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
