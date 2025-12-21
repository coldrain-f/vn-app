// Kanji data loader and lookup utility
import { KanjiInfo } from '../types';

// Kanji data map: { "漢": { ...data... } }
let kanjiMap: Record<string, KanjiInfo> = {};
let isLoaded = false;

/**
 * Load kanji data from the bundled JSON file
 * This should be called once at app startup
 */
export const loadKanjiData = (data: any[]): void => {
    kanjiMap = {};

    if (Array.isArray(data)) {
        data.forEach((item: any) => {
            // kanji-data.json now uses English keys
            if (item.kanji) {
                kanjiMap[item.kanji] = item as KanjiInfo;
            }
        });
    }

    isLoaded = true;
    console.log(`Loaded ${Object.keys(kanjiMap).length} kanji entries`);
};

/**
 * Get kanji info by character
 */
export const getKanjiInfo = (kanji: string): KanjiInfo | null => {
    return kanjiMap[kanji] || null;
};

/**
 * Check if kanji data is loaded
 */
export const isKanjiDataLoaded = (): boolean => {
    return isLoaded;
};

/**
 * Check if a character is kanji
 */
export const isKanji = (char: string): boolean => {
    const code = char.charCodeAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0xF900 && code <= 0xFAFF);
};

/**
 * Extract all unique kanji from text
 */
export const extractKanji = (text: string): string[] => {
    return [...new Set(text.split('').filter(isKanji))];
};

/**
 * Get kanji count
 */
export const getKanjiCount = (): number => {
    return Object.keys(kanjiMap).length;
};

