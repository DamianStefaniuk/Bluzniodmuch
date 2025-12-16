/**
 * Bluzniodmuch - Konfiguracja ikon dla wygranych miesięcy
 *
 * Aby ustawić własną ikonę dla miesiąca:
 * 1. Umieść obrazek w folderze image/ (np. image/month-january.png)
 * 2. Wpisz ścieżkę w odpowiednim miesiącu poniżej
 *
 * Obsługiwane formaty: PNG, JPG, SVG, GIF, WEBP
 * Zalecany rozmiar: 64x64 px lub 128x128 px
 */

const MONTH_ICONS = {
    // Styczeń
    '01': {
        icon: '🏆',           // Emoji (używane gdy brak obrazka)
        image: 'image/january.png'           // Ścieżka do obrazka, np: 'image/month-january.png'
    },
    // Luty
    '02': {
        icon: '🏆',
        image: null           // np: 'image/month-february.png'
    },
    // Marzec
    '03': {
        icon: '🏆',
        image: null           // np: 'image/month-march.png'
    },
    // Kwiecień
    '04': {
        icon: '🏆',
        image: null           // np: 'image/month-april.png'
    },
    // Maj
    '05': {
        icon: '🏆',
        image: null           // np: 'image/month-may.png'
    },
    // Czerwiec
    '06': {
        icon: '🏆',
        image: null           // np: 'image/month-june.png'
    },
    // Lipiec
    '07': {
        icon: '🏆',
        image: null           // np: 'image/month-july.png'
    },
    // Sierpień
    '08': {
        icon: '🏆',
        image: null           // np: 'image/month-august.png'
    },
    // Wrzesień
    '09': {
        icon: '🏆',
        image: null           // np: 'image/month-september.png'
    },
    // Październik
    '10': {
        icon: '🏆',
        image: null           // np: 'image/month-october.png'
    },
    // Listopad
    '11': {
        icon: '🏆',
        image: null           // np: 'image/month-november.png'
    },
    // Grudzień
    '12': {
        icon: '🏆',
        image: null           // np: 'image/month-december.png'
    }
};

/**
 * Pobiera ikonę dla danego miesiąca
 * @param {string} monthKey - klucz miesiąca w formacie "YYYY-MM" lub "MM"
 * @returns {object} - { icon: string, image: string|null, hasImage: boolean }
 */
function getMonthIcon(monthKey) {
    // Wyciągnij numer miesiąca (ostatnie 2 znaki lub cały jeśli krótki)
    const monthNum = monthKey.length > 2 ? monthKey.slice(-2) : monthKey;

    const config = MONTH_ICONS[monthNum] || { icon: '🏆', image: null };

    return {
        icon: config.icon,
        image: config.image,
        hasImage: config.image !== null && config.image !== ''
    };
}

/**
 * Zwraca HTML dla ikony miesiąca (obrazek lub emoji)
 * @param {string} monthKey - klucz miesiąca w formacie "YYYY-MM"
 * @param {string} cssClass - opcjonalna klasa CSS
 * @returns {string} - HTML
 */
function getMonthIconHTML(monthKey, cssClass = 'month-icon') {
    const iconData = getMonthIcon(monthKey);

    if (iconData.hasImage) {
        return `<img src="${iconData.image}" alt="Mistrz miesiąca" class="${cssClass}">`;
    }

    return `<span class="${cssClass}">${iconData.icon}</span>`;
}
