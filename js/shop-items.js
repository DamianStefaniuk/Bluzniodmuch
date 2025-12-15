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
        id: "free_day",
        name: "Dzień bez obowiązków",
        description: "Przez jeden dzień nie musisz robić niczego dla zespołu!",
        cost: 30,
        icon: "🏖️",
        type: "reward",
        category: "personal"
    },
    {
        id: "late_arrival",
        name: "Późniejsze przyjście",
        description: "Możesz przyjść 30 minut później do pracy",
        cost: 15,
        icon: "😴",
        type: "reward",
        category: "personal"
    },
    {
        id: "early_leave",
        name: "Wcześniejsze wyjście",
        description: "Możesz wyjść 30 minut wcześniej z pracy",
        cost: 15,
        icon: "🏃",
        type: "reward",
        category: "personal"
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
    {
        id: "music_choice",
        name: "DJ na dzień",
        description: "Przez cały dzień Ty wybierasz muzykę w biurze",
        cost: 10,
        icon: "🎵",
        type: "reward",
        category: "personal"
    },
    {
        id: "best_chair",
        name: "Najlepsze krzesło",
        description: "Dostajesz najwygodniejsze krzesło na tydzień",
        cost: 25,
        icon: "🪑",
        type: "reward",
        category: "personal"
    },
    {
        id: "lunch_treat",
        name: "Lunch fundowany",
        description: "Zespół funduje Ci lunch",
        cost: 40,
        icon: "🍽️",
        type: "reward",
        category: "team"
    },
    {
        id: "parking_spot",
        name: "Najlepsze miejsce parkingowe",
        description: "Przez tydzień masz zarezerwowane najlepsze miejsce",
        cost: 20,
        icon: "🅿️",
        type: "reward",
        category: "personal"
    },

    // ============================================
    // KARY - kupowane za ujemne punkty
    // Wykonanie kary poprawia wynik gracza
    // ============================================
    {
        id: "pizza_team",
        name: "Pizza dla zespołu",
        description: "Stawiasz pizzę dla całego zespołu!",
        cost: -50,
        icon: "🍕",
        type: "penalty",
        category: "team"
    },
    {
        id: "cake_team",
        name: "Ciasto dla zespołu",
        description: "Przynosisz ciasto/tort dla kolegów",
        cost: -30,
        icon: "🎂",
        type: "penalty",
        category: "team"
    },
    {
        id: "coffee_team",
        name: "Kawa dla wszystkich",
        description: "Fundujesz rundę kawy z automatu dla zespołu",
        cost: -20,
        icon: "☕",
        type: "penalty",
        category: "team"
    },
    {
        id: "donuts_team",
        name: "Pączki dla zespołu",
        description: "Przynosisz pączki dla wszystkich",
        cost: -25,
        icon: "🍩",
        type: "penalty",
        category: "team"
    },
    {
        id: "clean_desk",
        name: "Sprzątanie biurek",
        description: "Sprzątasz wszystkie biurka w pokoju",
        cost: -15,
        icon: "🧹",
        type: "penalty",
        category: "personal"
    },
    {
        id: "make_tea",
        name: "Herbata na życzenie",
        description: "Przez tydzień robisz herbatę na życzenie kolegów",
        cost: -20,
        icon: "🫖",
        type: "penalty",
        category: "personal"
    },
    {
        id: "water_plants",
        name: "Opiekun roślin",
        description: "Przez miesiąc podlewasz rośliny w biurze",
        cost: -10,
        icon: "🌱",
        type: "penalty",
        category: "personal"
    },
    {
        id: "trash_duty",
        name: "Dyżur śmieciowy",
        description: "Przez tydzień wynosisz śmieci z pokoju",
        cost: -15,
        icon: "🗑️",
        type: "penalty",
        category: "personal"
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
        id: "compliment_day",
        name: "Dzień komplementów",
        description: "Przez cały dzień musisz komplementować kolegów",
        cost: -8,
        icon: "💬",
        type: "penalty",
        category: "fun"
    },
    {
        id: "dance_break",
        name: "Taneczna przerwa",
        description: "Musisz zatańczyć przed zespołem",
        cost: -12,
        icon: "💃",
        type: "penalty",
        category: "fun"
    },
    {
        id: "karaoke",
        name: "Karaoke solo",
        description: "Śpiewasz piosenkę wybraną przez zespół",
        cost: -15,
        icon: "🎤",
        type: "penalty",
        category: "fun"
    },
    {
        id: "joke_day",
        name: "Dzień dowcipów",
        description: "Musisz opowiedzieć 5 dowcipów (nawet słabych)",
        cost: -6,
        icon: "😂",
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
