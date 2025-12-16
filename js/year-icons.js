/**
 * Bluzniodmuch - Konfiguracja ikon dla wygranych lat
 *
 * Aby ustawić własną ikonę dla roku:
 * 1. Umieść obrazek w folderze image/ (np. image/year-2024.png)
 * 2. Wpisz ścieżkę w odpowiednim roku poniżej
 *
 * Obsługiwane formaty: PNG, JPG, SVG, GIF, WEBP
 * Zalecany rozmiar: 64x64 px lub 128x128 px
 */

const YEAR_ICONS = {
    // Dodaj kolejne lata w miarę potrzeb
    '2024': {
        icon: '🏆',           // Emoji (używane gdy brak obrazka)
        image: null           // Ścieżka do obrazka, np: 'image/year-2024.png'
    },
    '2025': {
        icon: '🏆',
        image: 'image/2025.png'           // np: 'image/year-2025.png'
    },
    '2026': {
        icon: '🏆',
        image: null           // np: 'image/year-2026.png'
    },
    '2027': {
        icon: '🏆',
        image: null           // np: 'image/year-2027.png'
    },
    '2028': {
        icon: '🏆',
        image: null           // np: 'image/year-2028.png'
    },
    '2029': {
        icon: '🏆',
        image: null           // np: 'image/year-2029.png'
    },
    '2030': {
        icon: '🏆',
        image: null           // np: 'image/year-2030.png'
    }
};

// Domyślna ikona dla lat nieuwzględnionych w konfiguracji
const DEFAULT_YEAR_ICON = {
    icon: '🏆',
    image: null
};

/**
 * Pobiera ikonę dla danego roku
 * @param {string} yearKey - klucz roku w formacie "YYYY"
 * @returns {object} - { icon: string, image: string|null, hasImage: boolean }
 */
function getYearIcon(yearKey) {
    const config = YEAR_ICONS[yearKey] || DEFAULT_YEAR_ICON;

    return {
        icon: config.icon,
        image: config.image,
        hasImage: config.image !== null && config.image !== ''
    };
}

/**
 * Zwraca HTML dla ikony roku (obrazek lub emoji)
 * @param {string} yearKey - klucz roku w formacie "YYYY"
 * @param {string} cssClass - opcjonalna klasa CSS
 * @returns {string} - HTML
 */
function getYearIconHTML(yearKey, cssClass = 'year-icon') {
    const iconData = getYearIcon(yearKey);

    if (iconData.hasImage) {
        return `<img src="${iconData.image}" alt="Mistrz roku ${yearKey}" class="${cssClass}">`;
    }

    return `<span class="${cssClass}">${iconData.icon}</span>`;
}
