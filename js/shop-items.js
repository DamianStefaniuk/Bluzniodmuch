/**
 * Bluzniodmuch - Definicje przedmiotów w sklepie
 *
 * SYSTEM PUNKTACJI:
 * - Przekleństwo = -1 punkt
 * - Dzień bez przekleństwa = +1 punkt
 * - Tydzień bez przekleństwa = +5 punktów
 * - Miesiąc bez przekleństwa = +10 punktów
 *
 * NAGRODY (type: 'reward'):
 * - Kupowane za punkty dodatnie
 * - Koszt dodatni (np. 10 pkt)
 * - Wymagane: punkty >= koszt
 * - To co gracz DOSTAJE jako nagrodę
 *
 * KARY (type: 'penalty'):
 * - Kupowane gdy mamy ujemne punkty
 * - Koszt ujemny (np. -10 pkt oznacza że trzeba mieć min -10 punktów)
 * - Po wykonaniu kary punkty są dodawane (poprawa statusu)
 * - To co gracz MUSI ZROBIĆ aby poprawić wynik
 */

const SHOP_ITEMS = [
    // ============================================
    // NAGRODY - kupowane za punkty dodatnie
    // ============================================
    {
        id: "beer_meeting",
        name: "Piwne spotkanie",
        description: "Idziecie na piwo po pracy, pierwsze Twoje piwo, opłaca zespół!",
        cost: 40,
        icon: "🍺",
        type: "reward",
        category: "team"
    },
    {
        id: "coffee_served",
        name: "Kawa na życzenie",
        description: "Koledzy robią Ci kawę przez cały dzień",
        cost: 20,
        icon: "☕",
        type: "reward",
        category: "personal"
    },

    // ============================================
    // KARY - kupowane za ujemne punkty
    // Wykonanie kary poprawia wynik gracza
    // ============================================
    {
        id: "beer_apology",
        name: "Przepraszam piwem",
        description: "Idziecie na piwo po pracy, pierwsze browary, stawiasz Ty!",
        cost: -50,
        icon: "🍺",
        type: "penalty",
        category: "team"
    },
    {
        id: "pizza_time",
        name: "Pizza time!",
        description: "Stawiasz pizzę dla całego zespołu!",
        cost: -30,
        icon: "🍕",
        type: "penalty",
        category: "team"
    },
    {
        id: "coffe_beans",
        name: "Sudo Coffee",
        description: "Kupujesz kawę do korzystania dla zespołu",
        cost: -30,
        icon: "☕",
        type: "penalty",
        category: "team"
    },
    {
        id: "tea_bags",
        name: "Sir it's Tea",
        description: "Kupujesz herbatę do korzystania dla zespołu",
        cost: -30,
        icon: "🍵",
        type: "penalty",
        category: "team"
    },
    {
        id: "cake_team",
        name: "There really was a cake...",
        description: "Przynosisz ciasto dla zespołu",
        cost: -30,
        icon: "🎂",
        type: "penalty",
        category: "team"
    },
    {
        id: "donuts_team",
        name: "Pączki dla zespołu",
        description: "Przynosisz pączki dla wszystkich",
        cost: -20,
        icon: "🍩",
        type: "penalty",
        category: "team"
    },
    {
        id: "dance_break",
        name: "Taneczna przerwa",
        description: "Musisz zatańczyć przed zespołem",
        cost: -20,
        icon: "💃",
        type: "penalty",
        category: "fun"
    },
    {
        id: "gym_session",
        name: "Sesja na siłowni",
        description: "Musisz zrobić krótką sesję ćwiczeń w pokoju",
        cost: -20,
        icon: "🏋️",
        type: "penalty",
        category: "fun"
    },
    {
        id: "karaoke",
        name: "Karaoke solo",
        description: "Śpiewasz piosenkę wybraną przez zespół",
        cost: -20,
        icon: "🎤",
        type: "penalty",
        category: "fun"
    },
    {
        id: "silly_hat",
        name: "Czapka wstydu",
        description: "Nosisz śmieszną czapkę przez cały dzień",
        cost: -10,
        icon: "🎩",
        type: "penalty",
        category: "fun"
    },
    {
        id: "joke_day",
        name: "Dzień dowcipów",
        description: "Musisz opowiedzieć 5 dowcipów (nawet słabych)",
        cost: -10,
        icon: "😂",
        type: "penalty",
        category: "fun"
    },
    {
        id: "apologize",
        name: "Moja wina!",
        description: "Musisz przeprosić na chatcie zespołowym za swoje przekleństwa",
        cost: -5,
        icon: "🙏",
        type: "penalty",
        category: "fun"
    }
];

/**
 * Definicje statusów graczy - teraz bazowane na bilansie punktów
 * Dodatnie punkty = dobry status, ujemne = zły status
 */
const PLAYER_STATUSES = [
    { min: 50, max: Infinity, name: "Święty", icon: "😇", color: "#f1c40f" },
    { min: 20, max: 49, name: "Grzeczny", icon: "😊", color: "#27ae60" },
    { min: 1, max: 19, name: "W normie", icon: "🙂", color: "#3498db" },
    { min: -9, max: 0, name: "Neutralny", icon: "😐", color: "#95a5a6" },
    { min: -30, max: -10, name: "Gorsze dni", icon: "😤", color: "#e67e22" },
    { min: -50, max: -31, name: "Niegrzeczny", icon: "🤬", color: "#e74c3c" },
    { min: -Infinity, max: -51, name: "Przeklinator", icon: "👹", color: "#8e44ad" }
];

/**
 * Pobiera wszystkie przedmioty ze sklepu
 */
function getShopItems() {
    return SHOP_ITEMS;
}

/**
 * Pobiera nagrody (do kupienia za punkty dodatnie)
 */
function getRewards() {
    return SHOP_ITEMS.filter(item => item.type === 'reward');
}

/**
 * Pobiera kary (do kupienia za punkty ujemne)
 */
function getPenalties() {
    return SHOP_ITEMS.filter(item => item.type === 'penalty');
}

/**
 * Pobiera przedmioty z danej kategorii
 */
function getShopItemsByCategory(category) {
    return SHOP_ITEMS.filter(item => item.category === category);
}

/**
 * Pobiera przedmiot po ID
 */
function getShopItemById(id) {
    return SHOP_ITEMS.find(item => item.id === id);
}

/**
 * Pobiera status gracza na podstawie bilansu punktów
 */
function getPlayerStatus(points) {
    for (const status of PLAYER_STATUSES) {
        if (points >= status.min && points <= status.max) {
            return status;
        }
    }
    return PLAYER_STATUSES[PLAYER_STATUSES.length - 1];
}

/**
 * Pobiera wszystkie statusy
 */
function getAllStatuses() {
    return PLAYER_STATUSES;
}
