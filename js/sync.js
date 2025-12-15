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
    'jacek4468': 'Jacek',
    'MateuszCzajkowskiPlum': 'Mateusz',
    'tomaszkozlow': 'Tomek',
    'BarolKartoszuk': 'Karol'
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
        purchases: [],
        lastBonusCheck: null,
        history: {}
    };

    PLAYERS.forEach(player => {
        initialScores.players[player] = {
            swearCount: 0,
            spentOnRewards: 0,
            earnedFromPenalties: 0,
            bonusGained: 0,
            monthly: {},
            yearly: {},
            lastActivity: null,
            rewardedInactiveDays: 0,
            rewardedInactiveWeeks: 0,
            lastMonthBonusCheck: null
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

        // Scala dane - używa odpowiednich strategii dla każdego pola
        const mergedData = mergeAllData(localData, remoteData.scores);

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
 * Scala wszystkie dane z dwóch źródeł
 */
function mergeAllData(local, remote) {
    if (!remote) return local;
    if (!local) return remote;

    const merged = {
        players: {},
        purchases: mergePurchases(local.purchases || [], remote.purchases || []),
        lastBonusCheck: mergeNewerDate(local.lastBonusCheck, remote.lastBonusCheck),
        history: local.history || remote.history || {}
    };

    // Połącz wszystkich graczy z obu źródeł
    const allPlayers = new Set([
        ...Object.keys(local.players || {}),
        ...Object.keys(remote.players || {})
    ]);

    allPlayers.forEach(player => {
        merged.players[player] = mergePlayerData(
            local.players?.[player],
            remote.players?.[player]
        );
    });

    return merged;
}

/**
 * Scala dane pojedynczego gracza
 */
function mergePlayerData(local, remote) {
    if (!remote) return local || createEmptyPlayer();
    if (!local) return remote;

    return {
        // Składniki bilansu - bierzemy większą wartość (więcej = więcej akcji wykonanych)
        swearCount: Math.max(local.swearCount || 0, remote.swearCount || 0),
        spentOnRewards: Math.max(local.spentOnRewards || 0, remote.spentOnRewards || 0),
        earnedFromPenalties: Math.max(local.earnedFromPenalties || 0, remote.earnedFromPenalties || 0),
        bonusGained: Math.max(local.bonusGained || 0, remote.bonusGained || 0),

        // Liczniki miesięczne i roczne
        monthly: mergeCounters(local.monthly || {}, remote.monthly || {}),
        yearly: mergeCounters(local.yearly || {}, remote.yearly || {}),

        // Pola związane z bonusami - bierzemy wartości które wskazują na więcej naliczonych bonusów
        rewardedInactiveDays: Math.max(local.rewardedInactiveDays || 0, remote.rewardedInactiveDays || 0),
        rewardedInactiveWeeks: Math.max(local.rewardedInactiveWeeks || 0, remote.rewardedInactiveWeeks || 0),

        // Data ostatniej aktywności - bierzemy nowszą (późniejsze przekleństwo)
        lastActivity: mergeNewerDate(local.lastActivity, remote.lastActivity),

        // Ostatni sprawdzony miesiąc dla bonusu - bierzemy nowszy
        lastMonthBonusCheck: mergeNewerString(local.lastMonthBonusCheck, remote.lastMonthBonusCheck)
    };
}

/**
 * Tworzy pustą strukturę gracza
 */
function createEmptyPlayer() {
    return {
        swearCount: 0,
        spentOnRewards: 0,
        earnedFromPenalties: 0,
        bonusGained: 0,
        monthly: {},
        yearly: {},
        lastActivity: null,
        rewardedInactiveDays: 0,
        rewardedInactiveWeeks: 0,
        lastMonthBonusCheck: null
    };
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
 * Scala listy zakupów - usuwa duplikaty po ID
 */
function mergePurchases(local, remote) {
    const purchaseMap = new Map();

    // Dodaj lokalne zakupy
    local.forEach(purchase => {
        if (purchase.id) {
            purchaseMap.set(purchase.id, purchase);
        } else {
            // Dla zakupów bez ID, generuj klucz z danych
            const key = `${purchase.player}-${purchase.itemId}-${purchase.date}`;
            purchaseMap.set(key, { ...purchase, id: key });
        }
    });

    // Dodaj zdalne zakupy (nie nadpisuje istniejących)
    remote.forEach(purchase => {
        if (purchase.id) {
            if (!purchaseMap.has(purchase.id)) {
                purchaseMap.set(purchase.id, purchase);
            }
        } else {
            const key = `${purchase.player}-${purchase.itemId}-${purchase.date}`;
            if (!purchaseMap.has(key)) {
                purchaseMap.set(key, { ...purchase, id: key });
            }
        }
    });

    // Konwertuj mapę na tablicę i sortuj po dacie
    return Array.from(purchaseMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Scala daty - bierze nowszą
 */
function mergeNewerDate(local, remote) {
    if (!local) return remote;
    if (!remote) return local;

    const localDate = new Date(local);
    const remoteDate = new Date(remote);

    return localDate > remoteDate ? local : remote;
}

/**
 * Scala stringi reprezentujące daty/klucze - bierze "większy" (nowszy)
 */
function mergeNewerString(local, remote) {
    if (!local) return remote;
    if (!remote) return local;

    // Dla kluczy typu "2025-12" - większy string = nowszy miesiąc
    return local > remote ? local : remote;
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
