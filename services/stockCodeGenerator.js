const DEFAULT_PREFIX = process.env.STOCK_CODE_PREFIX || 'M';

const TURKISH_CHAR_MAP = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U',
    'â': 'a', 'Â': 'A', 'î': 'i', 'Î': 'I', 'û': 'u', 'Û': 'U',
    'á': 'a', 'Á': 'A', 'à': 'a', 'À': 'A', 'é': 'e', 'É': 'E',
    'è': 'e', 'È': 'E', 'ó': 'o', 'Ó': 'O', 'ò': 'o', 'Ò': 'O',
    'ü': 'u', 'Ü': 'U'
};

function transliterate(text = '') {
    if (!text) return '';
    return text
        .split('')
        .map(char => TURKISH_CHAR_MAP[char] || char)
        .join('');
}

function sanitizeWord(word = '') {
    return transliterate(word)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

function extractBaseName(urunAdi = '') {
    if (!urunAdi) return '';
    const trimmed = urunAdi.trim();
    const combinationMatch = trimmed.match(/\b([^\s]+(?:\s*\/\s*[^\s]+)+)$/);
    if (!combinationMatch) {
        return trimmed;
    }

    const combo = combinationMatch[0];
    const base = trimmed.slice(0, trimmed.length - combo.length).trim();
    return base || trimmed;
}

function generateBaseCode(urunAdi = '') {
    const baseName = extractBaseName(urunAdi);
    const words = baseName.split(/\s+/).filter(Boolean);
    if (!words.length) return '';

    const sanitizedWords = words.map(sanitizeWord).filter(Boolean);
    if (!sanitizedWords.length) return '';

    const isNumericWord = (word) => /^\d+$/.test(word);

    return sanitizedWords.reduce((acc, word, index) => {
        if (isNumericWord(word)) {
            return acc + word;
        }
        if (index === 0) {
            return acc + word.charAt(0);
        }
        if (index === 1) {
            return acc + word.slice(0, Math.min(3, word.length));
        }
        return acc + word.charAt(0);
    }, '');
}

function normalizeColorCombination(combo = '') {
    if (!combo) return '';
    return combo
        .split('/')
        .map(part => part.trim())
        .filter(Boolean)
        .join('/');
}

function generateColorCode(combo = '') {
    if (!combo) return 'STD';
    const normalized = normalizeColorCombination(combo);
    if (!normalized) return 'STD';

    const parts = normalized.split('/');
    const letters = parts.map(part => {
        const sanitized = sanitizeWord(part);
        if (!sanitized) {
            return 'X';
        }
        return sanitized.charAt(0);
    });

    return letters.join('');
}

function normalizeSize(size) {
    if (size === undefined || size === null) return 'STD';
    const str = String(size).trim();
    if (!str) return 'STD';
    const sanitized = sanitizeWord(str);
    return sanitized || 'STD';
}

function ensureArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value
            .split(/[\n,]/)
            .map(item => item.trim())
            .filter(Boolean);
    }
    return [];
}

function fallbackColorCombination(urunAdi) {
    const match = urunAdi?.match(/([^\s]+(?:\s*\/\s*[^\s]+)+)$/);
    if (match) {
        return [normalizeColorCombination(match[0])].filter(Boolean);
    }
    return [];
}

function generateStockData({
    urunAdi,
    renkKombinasyonlari,
    bedenler,
    prefix
}) {
    const resolvedPrefix = prefix || DEFAULT_PREFIX;
    const baseCode = generateBaseCode(urunAdi);

    let combos = ensureArray(renkKombinasyonlari).map(normalizeColorCombination).filter(Boolean);
    if (!combos.length) {
        combos = fallbackColorCombination(urunAdi);
    }
    if (!combos.length) {
        combos = ['Tek'];
    }

    const sizes = ensureArray(bedenler);
    if (!sizes.length) {
        sizes.push('STD');
    }

    const canonicalSizes = sizes.map(size => String(size).trim() || 'STD');

    const variants = [];

    combos.forEach(combo => {
        const colorCode = generateColorCode(combo);
        canonicalSizes.forEach(size => {
            const normalizedSize = normalizeSize(size);
            const stockCodeParts = [resolvedPrefix];
            if (baseCode) {
                stockCodeParts.push(baseCode);
            }
            stockCodeParts.push(colorCode);
            stockCodeParts.push(normalizedSize);

            variants.push({
                renk: combo,
                beden: size,
                stokKodu: stockCodeParts.filter(Boolean).join('-'),
                renkKodu: colorCode
            });
        });
    });

    const primaryStockCode = variants.length
        ? variants[0].stokKodu
        : (baseCode ? `${resolvedPrefix}-${baseCode}` : resolvedPrefix);

    return {
        baseCode: baseCode ? `${resolvedPrefix}-${baseCode}` : resolvedPrefix,
        varyantlar: variants,
        kullanilanRenkKombinasyonlari: combos,
        prefix: resolvedPrefix,
        bedenler: canonicalSizes,
        anaStokKodu: primaryStockCode
    };
}

module.exports = {
    generateStockData
};

