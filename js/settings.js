/**
 * Bluzniodmuch - Strona ustawień
 */

/**
 * Pobiera plik JSON do pobrania
 */
function downloadJsonFile(content, filenamePrefix) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

/**
 * Czyta plik asynchronicznie
 */
function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

/**
 * Wymusza upload danych do Gist z flagą wymuszającą reset na innych urządzeniach
 * Używane po imporcie, aby wymusić nowe dane dla wszystkich urządzeń
 */
async function forceUploadToGist() {
    // Użyj funkcji z sync.js która ustawia forceResetTimestamp
    return await forceResetSync();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    updateSyncStatus();
    updatePlayerSelection();
    updateDataManagementAccess();
    setupSettingsEventListeners();
});

/**
 * Aktualizuje sekcję wyboru gracza
 */
function updatePlayerSelection() {
    const playerSelectionSection = document.getElementById('playerSelectionSection');
    const playerSelect = document.getElementById('playerSelect');
    const currentPlayerInfo = document.getElementById('currentPlayerInfo');

    if (!isSyncConfigured()) {
        playerSelectionSection.style.display = 'none';
        return;
    }

    // Pokaż sekcję wyboru gracza
    playerSelectionSection.style.display = 'block';

    // Wypełnij dropdown listą graczy
    const players = getAvailablePlayers();
    const currentPlayer = getSelectedPlayer();

    playerSelect.innerHTML = '<option value="">-- Wybierz gracza --</option>';
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player;
        option.textContent = player;
        if (player === currentPlayer) {
            option.selected = true;
        }
        playerSelect.appendChild(option);
    });

    // Pokaż info o aktualnie wybranym graczu
    if (currentPlayer) {
        currentPlayerInfo.style.display = 'flex';
        const data = getData();
        const playerData = data.players[currentPlayer];
        const balance = playerData ? calculatePlayerTotal(playerData) : 0;
        const status = getPlayerStatus(balance);

        document.getElementById('playerAvatar').textContent = status.icon;
        document.getElementById('playerAvatar').style.color = status.color;
        document.getElementById('playerNameDisplay').textContent = currentPlayer;
        document.getElementById('playerStatusDisplay').textContent = status.name;
        document.getElementById('playerStatusDisplay').style.color = status.color;
    } else {
        currentPlayerInfo.style.display = 'none';
    }
}

/**
 * Aktualizuje dostęp do sekcji zarządzania danymi
 */
function updateDataManagementAccess() {
    const authNotice = document.getElementById('authRequiredNotice');
    const dataActions = document.getElementById('dataActionsContainer');
    const dataManagementSection = document.getElementById('dataManagementSection');

    if (isSyncConfigured() && isAdmin()) {
        // Użytkownik jest zalogowany jako admin - pokaż sekcję i akcje
        dataManagementSection.style.display = 'block';
        authNotice.style.display = 'none';
        dataActions.style.display = 'grid';
    } else if (isSyncConfigured()) {
        // Użytkownik jest zalogowany ale nie jest adminem - ukryj całą sekcję
        dataManagementSection.style.display = 'none';
    } else {
        // Użytkownik nie jest zalogowany - pokaż sekcję z komunikatem
        dataManagementSection.style.display = 'block';
        authNotice.style.display = 'flex';
        dataActions.style.display = 'none';
    }
}

/**
 * Aktualizuje status synchronizacji
 */
function updateSyncStatus() {
    const statusIcon = document.getElementById('statusIcon');
    const statusLabel = document.getElementById('statusLabel');
    const statusDetail = document.getElementById('statusDetail');
    const syncActions = document.getElementById('syncActions');
    const syncSetup = document.getElementById('syncSetup');

    if (isSyncConfigured()) {
        const username = getGithubUsername();
        const adminBadge = isAdmin() ? ' <span class="admin-badge">Admin</span>' : '';

        statusIcon.textContent = '🟢';
        statusLabel.innerHTML = `Zalogowano jako: <strong>${username}</strong>${adminBadge}`;

        const lastSync = getLastSyncTime();
        if (lastSync) {
            statusDetail.textContent = `Ostatnia synchronizacja: ${formatDateTime(lastSync)}`;
        } else {
            statusDetail.textContent = 'Jeszcze nie synchronizowano';
        }

        syncActions.style.display = 'flex';
        syncSetup.querySelector('.setup-form').style.display = 'none';
        syncSetup.querySelector('.setup-info').innerHTML = `
            <p>✅ Synchronizacja jest skonfigurowana.</p>
            <p><strong>Gist ID:</strong> <code>${getGistId()}</code></p>
            <p><a href="https://gist.github.com/${getGistId()}" target="_blank">Otwórz Gist w GitHub</a></p>
        `;
    } else {
        statusIcon.textContent = '⚪';
        statusLabel.textContent = 'Nie skonfigurowano';
        statusDetail.textContent = 'Skonfiguruj synchronizację poniżej';
        syncActions.style.display = 'none';
        syncSetup.querySelector('.setup-form').style.display = 'block';
    }

    // Aktualizuj sekcję wyboru gracza i dostęp do zarządzania danymi
    updatePlayerSelection();
    updateDataManagementAccess();
}

/**
 * Formatuje datę i czas
 */
function formatDateTime(date) {
    return date.toLocaleString('pl-PL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Pokazuje wynik operacji
 */
function showResult(message, isError = false) {
    const resultDiv = document.getElementById('setupResult');
    resultDiv.style.display = 'block';
    resultDiv.className = `setup-result ${isError ? 'error' : 'success'}`;
    resultDiv.textContent = message;

    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupSettingsEventListeners() {
    // Wybór gracza
    document.getElementById('playerSelect').addEventListener('change', (e) => {
        const selectedPlayer = e.target.value;
        if (selectedPlayer) {
            saveSelectedPlayer(selectedPlayer);
            showResult(`Zalogowano jako ${selectedPlayer}!`);
        } else {
            clearSelectedPlayer();
        }
        updatePlayerSelection();
    });

    // Toggle widoczności tokena
    document.getElementById('toggleToken').addEventListener('click', () => {
        const tokenInput = document.getElementById('githubToken');
        tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
    });

    // Połącz z istniejącym Gist
    document.getElementById('connectBtn').addEventListener('click', async () => {
        const token = document.getElementById('githubToken').value.trim();
        const gistId = document.getElementById('gistId').value.trim();

        if (!token) {
            showResult('Podaj Personal Access Token', true);
            return;
        }

        if (!gistId) {
            showResult('Podaj Gist ID lub użyj "Utwórz nowy Gist"', true);
            return;
        }

        try {
            document.getElementById('connectBtn').disabled = true;
            document.getElementById('connectBtn').textContent = 'Łączenie...';

            // Testuj token i pobierz username
            const username = await testConnection(token);

            // Zapisz konfigurację z username
            saveSyncConfig(gistId, token, username);

            // Spróbuj pobrać dane
            const result = await syncData();

            if (result.success) {
                showResult(`Połączono jako ${username}!`);
                updateSyncStatus();
            } else {
                clearSyncConfig();
                showResult(result.message, true);
            }
        } catch (error) {
            showResult(error.message, true);
        } finally {
            document.getElementById('connectBtn').disabled = false;
            document.getElementById('connectBtn').textContent = 'Połącz z GitHub';
        }
    });

    // Utwórz nowy Gist
    document.getElementById('createNewBtn').addEventListener('click', async () => {
        const token = document.getElementById('githubToken').value.trim();

        if (!token) {
            showResult('Podaj Personal Access Token', true);
            return;
        }

        try {
            document.getElementById('createNewBtn').disabled = true;
            document.getElementById('createNewBtn').textContent = 'Tworzenie...';

            // Testuj token i pobierz username
            const username = await testConnection(token);

            // Utwórz nowy Gist
            const gistId = await createNewGist(token);

            // Zapisz konfigurację z username
            saveSyncConfig(gistId, token, username);

            // Wyślij aktualne dane
            const currentData = getData();
            await saveToGist(currentData);

            showResult(`Utworzono nowy Gist jako ${username}!`);
            updateSyncStatus();

        } catch (error) {
            showResult(error.message, true);
        } finally {
            document.getElementById('createNewBtn').disabled = false;
            document.getElementById('createNewBtn').textContent = 'Utwórz nowy Gist';
        }
    });

    // Synchronizuj teraz
    document.getElementById('syncNowBtn').addEventListener('click', async () => {
        try {
            document.getElementById('syncNowBtn').disabled = true;
            document.getElementById('syncNowBtn').textContent = 'Synchronizowanie...';

            const result = await syncData();

            if (result.success) {
                showResult('Zsynchronizowano pomyślnie!');
                updateSyncStatus();
            } else {
                showResult(result.message, true);
            }
        } catch (error) {
            showResult(error.message, true);
        } finally {
            document.getElementById('syncNowBtn').disabled = false;
            document.getElementById('syncNowBtn').textContent = 'Synchronizuj teraz';
        }
    });

    // Rozłącz
    document.getElementById('disconnectBtn').addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz rozłączyć synchronizację? Dane lokalne pozostaną.')) {
            clearSyncConfig();
            showResult('Rozłączono z GitHub Gist');
            updateSyncStatus();
            location.reload();
        }
    });

    // Eksport danych (tylko scores)
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        downloadJsonFile(exportData(), 'bluzniodmuch_data');
        showResult('Dane wyeksportowane!');
    });

    // Eksport osiągnięć
    document.getElementById('exportAchievementsBtn').addEventListener('click', () => {
        const achievements = getAwardedAchievements();
        downloadJsonFile(JSON.stringify(achievements, null, 2), 'bluzniodmuch_achievements');
        showResult('Osiągnięcia wyeksportowane!');
    });

    // Eksport wszystkiego (dane + osiągnięcia)
    document.getElementById('exportAllBtn').addEventListener('click', () => {
        downloadJsonFile(exportData(), 'bluzniodmuch_data');
        const achievements = getAwardedAchievements();
        downloadJsonFile(JSON.stringify(achievements, null, 2), 'bluzniodmuch_achievements');
        showResult('Dane i osiągnięcia wyeksportowane!');
    });

    // Import danych
    document.getElementById('importBtn').addEventListener('click', async () => {
        const dataFile = document.getElementById('importDataFile').files[0];
        const achievementsFile = document.getElementById('importAchievementsFile').files[0];

        if (!dataFile && !achievementsFile) {
            showResult('Wybierz przynajmniej jeden plik do importu', true);
            return;
        }

        if (!confirm('Czy na pewno chcesz zaimportować dane? Obecne dane zostaną nadpisane i wymuszona zostanie synchronizacja dla wszystkich urządzeń.')) {
            return;
        }

        try {
            let dataImported = false;
            let achievementsImported = false;

            // Import danych
            if (dataFile) {
                const dataContent = await readFileAsync(dataFile);
                const success = importData(dataContent);
                if (!success) {
                    showResult('Błąd importu danych - nieprawidłowy format pliku', true);
                    return;
                }
                dataImported = true;
            }

            // Import osiągnięć
            if (achievementsFile) {
                const achievementsContent = await readFileAsync(achievementsFile);
                try {
                    const achievements = JSON.parse(achievementsContent);
                    saveAwardedAchievements(achievements);
                    achievementsImported = true;
                } catch (e) {
                    showResult('Błąd importu osiągnięć - nieprawidłowy format pliku', true);
                    return;
                }
            }

            // Wymuś synchronizację do Gist (nadpisanie danych zdalnych)
            if (isSyncConfigured()) {
                await forceUploadToGist();
                showResult('Import zakończony! Dane zostały wymuszone na serwerze.');
            } else {
                showResult('Import zakończony! Skonfiguruj synchronizację, aby udostępnić dane innym.');
            }

            // Wyczyść pola plików
            document.getElementById('importDataFile').value = '';
            document.getElementById('importAchievementsFile').value = '';

        } catch (error) {
            showResult('Błąd podczas importu: ' + error.message, true);
        }
    });

    // Reset danych
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE lokalne dane? Ta operacja jest nieodwracalna!')) {
            if (confirm('Naprawdę na pewno? Stracisz wszystkie lokalne wyniki!')) {
                localStorage.removeItem(STORAGE_KEYS.SCORES);
                initializeData();
                showResult('Dane lokalne zostały zresetowane');
            }
        }
    });

    // Reset osiągnięć
    document.getElementById('resetAchievementsBtn').addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz usunąć wszystkie zdobyte osiągnięcia?')) {
            localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
            showResult('Osiągnięcia zostały zresetowane');
        }
    });
}
