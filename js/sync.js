/**
 * Bluzniodmuch - Moduł synchronizacji z GitHub Gist
 *
 * Ten moduł obsługuje synchronizację danych między urządzeniami
 * poprzez GitHub Gist API.
 */

const SYNC_STORAGE_KEYS = {
    GIST_ID: 'bluzniodmuch_gist_id',
    GITHUB_TOKEN: 'bluzniodmuch_github_token',
    GITHUB_USERNAME: 'bluzniodmuch_github_username',
    LAST_SYNC: 'bluzniodmuch_last_sync'
};

const GIST_FILENAME = 'bluzniodmuch_data.json';
const GIST_ACHIEVEMENTS_FILENAME = 'bluzniodmuch_achievements.json';

// Lista administratorów (GitHub usernames) - tylko ci użytkownicy mają dostęp do zarządzania danymi
const ADMIN_USERS = ['DamianStefaniuk'];

// Lista autoryzowanych użytkowników (GitHub usernames) - tylko ci użytkownicy mogą korzystać z aplikacji
const ALLOWED_USERS = {
    'DamianStefaniuk': 'Damian',
    'Jacek': 'Jacek',
    'Mateusz': 'Mateusz',
    'Tomek': 'Tomek',
    'Karol': 'Karol'
};

/**
 * Sprawdza czy synchronizacja jest skonfigurowana
 */
function isSyncConfigured() {
    return !!(getGistId() && getGithubToken());
}

/**
 * Pobiera Gist ID z localStorage
 */
function getGistId() {
    return localStorage.getItem(SYNC_STORAGE_KEYS.GIST_ID);
}

/**
 * Pobiera GitHub Token z localStorage
 */
function getGithubToken() {
    return localStorage.getItem(SYNC_STORAGE_KEYS.GITHUB_TOKEN);
}

/**
 * Zapisuje konfigurację synchronizacji
 */
function saveSyncConfig(gistId, githubToken, username = null) {
    localStorage.setItem(SYNC_STORAGE_KEYS.GIST_ID, gistId);
    localStorage.setItem(SYNC_STORAGE_KEYS.GITHUB_TOKEN, githubToken);
    if (username) {
        localStorage.setItem(SYNC_STORAGE_KEYS.GITHUB_USERNAME, username);
    }
}

/**
 * Usuwa konfigurację synchronizacji
 */
function clearSyncConfig() {
    localStorage.removeItem(SYNC_STORAGE_KEYS.GIST_ID);
    localStorage.removeItem(SYNC_STORAGE_KEYS.GITHUB_TOKEN);
    localStorage.removeItem(SYNC_STORAGE_KEYS.GITHUB_USERNAME);
    localStorage.removeItem(SYNC_STORAGE_KEYS.LAST_SYNC);
}

/**
 * Pobiera GitHub username z localStorage
 */
function getGithubUsername() {
    return localStorage.getItem(SYNC_STORAGE_KEYS.GITHUB_USERNAME);
}

/**
 * Zapisuje GitHub username
 */
function saveGithubUsername(username) {
    localStorage.setItem(SYNC_STORAGE_KEYS.GITHUB_USERNAME, username);
}

/**
 * Sprawdza czy zalogowany użytkownik jest administratorem
 */
function isAdmin() {
    const username = getGithubUsername();
    if (!username) return false;
    return ADMIN_USERS.includes(username);
}

/**
 * Sprawdza czy zalogowany użytkownik jest autoryzowany (może korzystać z aplikacji)
 */
function isAuthorizedUser() {
    const username = getGithubUsername();
    if (!username) return false;
    return username in ALLOWED_USERS;
}

/**
 * Pobiera nazwę gracza na podstawie zalogowanego GitHub username
 */
function getPlayerNameFromGithub() {
    const username = getGithubUsername();
    if (!username) return null;
    return ALLOWED_USERS[username] || null;
}

/**
 * Pobiera czas ostatniej synchronizacji
 */
function getLastSyncTime() {
    const timestamp = localStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(parseInt(timestamp)) : null;
}

/**
 * Zapisuje czas synchronizacji
 */
function setLastSyncTime() {
    localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
}

/**
 * Pobiera dane z GitHub Gist
 */
async function fetchFromGist() {
    const gistId = getGistId();
    const token = getGithubToken();

    if (!gistId || !token) {
        throw new Error('Synchronizacja nie jest skonfigurowana');
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Gist nie został znaleziony. Sprawdź Gist ID.');
        }
        if (response.status === 401) {
            throw new Error('Nieprawidłowy token. Sprawdź Personal Access Token.');
        }
        throw new Error(`Błąd pobierania danych: ${response.status}`);
    }

    const gist = await response.json();

    const result = {
        scores: null,
        achievements: null
    };

    if (gist.files[GIST_FILENAME]) {
        result.scores = JSON.parse(gist.files[GIST_FILENAME].content);
    }

    if (gist.files[GIST_ACHIEVEMENTS_FILENAME]) {
        result.achievements = JSON.parse(gist.files[GIST_ACHIEVEMENTS_FILENAME].content);
    }

    return result;
}

/**
 * Zapisuje dane do GitHub Gist
 */
async function saveToGist(scoresData, achievementsData = null) {
    const gistId = getGistId();
    const token = getGithubToken();

    if (!gistId || !token) {
        throw new Error('Synchronizacja nie jest skonfigurowana');
    }

    const files = {
        [GIST_FILENAME]: {
            content: JSON.stringify(scoresData, null, 2)
        }
    };

    if (achievementsData) {
        files[GIST_ACHIEVEMENTS_FILENAME] = {
            content: JSON.stringify(achievementsData, null, 2)
        };
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Nieprawidłowy token lub brak uprawnień do zapisu.');
        }
        throw new Error(`Błąd zapisywania danych: ${response.status}`);
    }

    setLastSyncTime();
    return await response.json();
}

/**
 * Tworzy nowy Gist z początkowymi danymi
 */
async function createNewGist(token, description = 'Bluzniodmuch - Dane słoiczka') {
    const initialScores = {
        players: {},
        history: {}
    };

    PLAYERS.forEach(player => {
        initialScores.players[player] = {
            total: 0,
            monthly: {},
            yearly: {}
        };
    });

    const initialAchievements = [];

    const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: description,
            public: false,
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(initialScores, null, 2)
                },
                [GIST_ACHIEVEMENTS_FILENAME]: {
                    content: JSON.stringify(initialAchievements, null, 2)
                }
            }
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Nieprawidłowy token. Upewnij się, że token ma uprawnienie "gist".');
        }
        throw new Error(`Błąd tworzenia Gist: ${response.status}`);
    }

    const gist = await response.json();
    return gist.id;
}

/**
 * Synchronizuje dane - pobiera z Gist i scala z lokalnymi
 */
async function syncData() {
    if (!isSyncConfigured()) {
        return { success: false, message: 'Synchronizacja nie jest skonfigurowana' };
    }

    try {
        const remoteData = await fetchFromGist();
        const localData = getData();

        // Scala dane - bierze większą wartość dla każdego licznika
        const mergedData = mergeScores(localData, remoteData.scores);

        // Zapisz lokalnie
        saveData(mergedData);

        // Zapisz na Gist
        await saveToGist(mergedData);

        return { success: true, message: 'Synchronizacja zakończona pomyślnie' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Scala dane z dwóch źródeł - bierze większe wartości
 */
function mergeScores(local, remote) {
    if (!remote) return local;
    if (!local) return remote;

    const merged = {
        players: {},
        history: local.history || {}
    };

    // Połącz wszystkich graczy z obu źródeł
    const allPlayers = new Set([
        ...Object.keys(local.players || {}),
        ...Object.keys(remote.players || {})
    ]);

    allPlayers.forEach(player => {
        const localPlayer = local.players?.[player] || { total: 0, monthly: {}, yearly: {} };
        const remotePlayer = remote.players?.[player] || { total: 0, monthly: {}, yearly: {} };

        merged.players[player] = {
            total: Math.max(localPlayer.total || 0, remotePlayer.total || 0),
            monthly: mergeCounters(localPlayer.monthly || {}, remotePlayer.monthly || {}),
            yearly: mergeCounters(localPlayer.yearly || {}, remotePlayer.yearly || {})
        };
    });

    return merged;
}

/**
 * Scala liczniki - bierze większą wartość dla każdego klucza
 */
function mergeCounters(local, remote) {
    const merged = { ...local };

    Object.keys(remote).forEach(key => {
        merged[key] = Math.max(merged[key] || 0, remote[key] || 0);
    });

    return merged;
}

/**
 * Testuje połączenie z GitHub API
 */
async function testConnection(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error('Nieprawidłowy token');
    }

    const user = await response.json();
    return user.login;
}
