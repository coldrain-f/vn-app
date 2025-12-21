// Furigana parsing utilities
// Format: 한자[히라가나] -> ruby text

export interface FuriganaPart {
    text: string;
    reading?: string;
}

// Kanji character ranges
const KANJI_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF々]/;

/**
 * Parse reading format like 食[た]べる into parts
 * Returns array of {text, reading?} objects
 * 
 * Key insight: Only kanji characters immediately before [...] should get furigana
 * Example: 夏[なつ]の強烈[きょうれつ] ->
 *   - { text: "夏", reading: "なつ" }
 *   - { text: "の" }
 *   - { text: "強烈", reading: "きょうれつ" }
 */
export const parseFurigana = (reading: string): FuriganaPart[] => {
    if (!reading) return [];

    const parts: FuriganaPart[] = [];

    // Match: one or more kanji followed by [furigana]
    // This regex matches ONLY kanji characters before the brackets
    const furiganaPattern = /([\u4E00-\u9FFF\u3400-\u4DBF々]+)\[([^\]]+)\]/g;

    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(reading)) !== null) {
        // Add any text before this match (hiragana, katakana, punctuation, etc.)
        if (match.index > lastIndex) {
            const beforeText = reading.slice(lastIndex, match.index);
            if (beforeText) {
                parts.push({ text: beforeText });
            }
        }

        // Add the kanji with its furigana reading
        parts.push({
            text: match[1],      // Kanji characters
            reading: match[2],   // Furigana reading
        });

        lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last match
    if (lastIndex < reading.length) {
        const remainingText = reading.slice(lastIndex);
        if (remainingText) {
            parts.push({ text: remainingText });
        }
    }

    return parts;
};

/**
 * Strip furigana markers from reading
 * 食[た]べる -> 食べる
 */
export const stripFurigana = (reading: string): string => {
    return reading.replace(/\[([^\[\]]+)\]/g, '');
};

/**
 * Get full hiragana reading
 * 食[た]べる -> たべる
 */
export const toHiragana = (reading: string): string => {
    const parts = parseFurigana(reading);
    return parts.map(p => p.reading || p.text).join('');
};

/**
 * Check if character is kanji
 */
export const isKanji = (char: string): boolean => {
    const code = char.charCodeAt(0);
    // CJK Unified Ideographs
    return (code >= 0x4E00 && code <= 0x9FFF) ||
        // CJK Unified Ideographs Extension A
        (code >= 0x3400 && code <= 0x4DBF) ||
        // CJK Compatibility Ideographs
        (code >= 0xF900 && code <= 0xFAFF) ||
        // Special character 々
        char === '々';
};

/**
 * Extract all kanji from text
 */
export const extractKanji = (text: string): string[] => {
    return [...new Set(text.split('').filter(isKanji))];
};
