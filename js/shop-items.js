/**
 * Bluzniodmuch - Definicje fantów w sklepie
 *
 * INSTRUKCJA DODAWANIA FANTÓW:
 * Aby dodać nowy fant, dodaj obiekt do tablicy SHOP_ITEMS:
 * {
 *     id: "unique_id",           // Unikalny identyfikator
 *     name: "Nazwa fantu",       // Wyświetlana nazwa
 *     description: "Opis",       // Co trzeba zrobić
 *     cost: 10,                  // Koszt w punktach przekleństw
 *     icon: "🍕",                // Emoji jako ikona
 *     category: "team"           // Kategoria: "team", "personal", "fun"
 * }
 */

const SHOP_ITEMS = [
    // ============================================
    // FANTY ZESPOŁOWE (dla całego zespołu)
    // ============================================
    {
        id: "pizza_team",
        name: "Pizza dla zespołu",
        description: "Stawiasz pizzę dla całego zespołu wentylacji!",
        cost: 50,
        icon: "🍕",
        category: "team"
    },
    {
        id: "cake_team",
        name: "Ciasto dla zespołu",
        description: "Przynosisz ciasto/tort dla kolegów",
        cost: 30,
        icon: "🎂",
        category: "team"
    },
    {
        id: "coffee_team",
        name: "Kawa dla wszystkich",
        description: "Fundujeszrundę kawy z automatu dla zespołu",
        cost: 20,
        icon: "☕",
        category: "team"
    },
    {
        id: "donuts_team",
        name: "Pączki dla zespołu",
        description: "Przynosisz pączki dla wszystkich",
        cost: 25,
        icon: "🍩",
        category: "team"
    },
    {
        id: "breakfast_team",
        name: "Śniadanie zespołowe",
        description: "Organizujesz śniadanie dla zespołu",
        cost: 40,
        icon: "🥐",
        category: "team"
    },

    // ============================================
    // FANTY OSOBISTE (kary dla siebie)
    // ============================================
    {
        id: "clean_desk",
        name: "Sprzątanie biurek",
        description: "Sprzątasz wszystkie biurka w pokoju",
        cost: 15,
        icon: "🧹",
        category: "personal"
    },
    {
        id: "make_tea",
        name: "Herbata na życzenie",
        description: "Przez tydzień robisz herbatę na życzenie kolegów",
        cost: 20,
        icon: "🫖",
        category: "personal"
    },
    {
        id: "water_plants",
        name: "Opiekun roślin",
        description: "Przez miesiąc podlewasz rośliny w biurze",
        cost: 10,
        icon: "🌱",
        category: "personal"
    },
    {
        id: "trash_duty",
        name: "Dyżur śmieciowy",
        description: "Przez tydzień wynosisz śmieci z pokoju",
        cost: 15,
        icon: "🗑️",
        category: "personal"
    },
    {
        id: "meeting_notes",
        name: "Protokolant",
        description: "Robisz notatki z następnych 3 spotkań zespołu",
        cost: 25,
        icon: "📝",
        category: "personal"
    },

    // ============================================
    // FANTY ZABAWNE
    // ============================================
    {
        id: "silly_hat",
        name: "Czapka wstydu",
        description: "Nosisz śmieszną czapkę przez cały dzień",
        cost: 10,
        icon: "🎩",
        category: "fun"
    },
    {
        id: "compliment_day",
        name: "Dzień komplementów",
        description: "Przez cały dzień musisz komplementować kolegów",
        cost: 8,
        icon: "💬",
        category: "fun"
    },
    {
        id: "no_chair",
        name: "Stojący dzień",
        description: "Pracujesz na stojąco przez godzinę",
        cost: 5,
        icon: "🧍",
        category: "fun"
    },
    {
        id: "dance_break",
        name: "Taneczna przerwa",
        description: "Musisz zatańczyć przed zespołem",
        cost: 12,
        icon: "💃",
        category: "fun"
    },
    {
        id: "karaoke",
        name: "Karaoke solo",
        description: "Śpiewasz piosenkę wybraną przez zespół",
        cost: 15,
        icon: "🎤",
        category: "fun"
    },
    {
        id: "joke_day",
        name: "Dzień dowcipów",
        description: "Musisz opowiedzieć 5 dowcipów (nawet słabych)",
        cost: 6,
        icon: "😂",
        category: "fun"
    },
    {
        id: "accent_hour",
        name: "Godzina z akcentem",
        description: "Przez godzinę mówisz ze śmiesznym akcentem",
        cost: 8,
        icon: "🗣️",
        category: "fun"
    }
];

/**
 * Definicje statusów graczy
 */
const PLAYER_STATUSES = [
    { min: 0, max: 0, name: "Święty", icon: "😇", color: "#f1c40f" },
    { min: 1, max: 5, name: "Grzeczny", icon: "😊", color: "#27ae60" },
    { min: 6, max: 15, name: "Neutralny", icon: "😐", color: "#3498db" },
    { min: 16, max: 30, name: "Gorsze dni", icon: "😤", color: "#e67e22" },
    { min: 31, max: 50, name: "Niegrzeczny", icon: "🤬", color: "#e74c3c" },
    { min: 51, max: Infinity, name: "Przeklinator", icon: "👹", color: "#8e44ad" }
];

/**
 * Pobiera wszystkie przedmioty ze sklepu
 */
function getShopItems() {
    return SHOP_ITEMS;
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
 * Pobiera status gracza na podstawie liczby punktów
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
