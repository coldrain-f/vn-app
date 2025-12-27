// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
// import { Asset } from 'expo-asset'; // Not needed for direct require
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentence } from '../types';

// @ts-ignore
const SENTENCES_FILE = (FileSystem.documentDirectory || '') + 'sentences.json';

// Save all sentences to JSON file
export const saveSentences = async (sentences: Sentence[]): Promise<void> => {
    try {
        await FileSystem.writeAsStringAsync(SENTENCES_FILE, JSON.stringify(sentences));
    } catch (error) {
        console.error('Error saving sentences to file:', error);
        throw error;
    }
};



export const loadSentences = async (onProgress?: (progress: number) => void): Promise<Sentence[]> => {
    try {
        // Try to read from file system directly
        // This avoids using the deprecated getInfoAsync
        try {
            console.log('Loading sentences from file system...');
            const content = await FileSystem.readAsStringAsync(SENTENCES_FILE);
            const sentences = JSON.parse(content);
            console.log(`Loaded ${sentences.length} sentences from file`);
            if (onProgress) onProgress(100);
            return sentences;
        } catch (e) {
            // File does not exist or valid JSON not found
            console.log('No existing data file found.');
            if (onProgress) onProgress(100);
            return [];
        }

        return [];
    } catch (error) {
        console.error('Error loading sentences:', error);
        return [];
    }
};

// Helpers for other data types (using AsyncStorage for lightweight data)
export const saveBookmarks = async (bookmarks: Set<number> | number[]) => {
    try {
        const bookmarksArray = Array.from(bookmarks);
        await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarksArray));
    } catch (error) {
        console.error('Error saving bookmarks:', error);
    }
};

export const saveCurrentIndex = async (index: number) => {
    try {
        await AsyncStorage.setItem('currentIndex', JSON.stringify(index));
    } catch (error) {
        console.error('Error saving current index:', error);
    }
};

export const saveSettings = async (settings: any) => {
    try {
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
};

export const saveReadingDict = async (dict: Record<string, string>) => {
    try {
        await AsyncStorage.setItem('readingDict', JSON.stringify(dict));
    } catch (error) {
        console.error('Error saving reading dict:', error);
    }
};

export const saveActiveNovelId = async (id: string | null) => {
    try {
        if (id) {
            await AsyncStorage.setItem('activeNovelId', id);
        } else {
            await AsyncStorage.removeItem('activeNovelId');
        }
    } catch (error) {
        console.error('Error saving active novel ID:', error);
    }
};

export const loadAllData = async (onProgress?: (progress: number) => void): Promise<{
    sentences: Sentence[];
    bookmarks: number[];
    readingDict: Record<string, string>;
    currentIndex: number;
    settings: any;
    activeNovelId: string | null;
}> => {
    // 1. Sentences from File System
    const sentences = await loadSentences(onProgress);

    // 2. Bookmarks
    const bookmarksJson = await AsyncStorage.getItem('bookmarks');
    const bookmarks = bookmarksJson ? JSON.parse(bookmarksJson) : [];

    // 3. Reading Dict
    const readingDictJson = await AsyncStorage.getItem('readingDict');
    const readingDict = readingDictJson ? JSON.parse(readingDictJson) : {};

    // 4. Current Index
    const currentIndexJson = await AsyncStorage.getItem('currentIndex');
    const currentIndex = currentIndexJson ? JSON.parse(currentIndexJson) : 0;

    // 5. Settings
    const settingsJson = await AsyncStorage.getItem('settings');
    const settings = settingsJson ? JSON.parse(settingsJson) : null;

    // 6. Active Novel ID
    const activeNovelId = await AsyncStorage.getItem('activeNovelId');

    return { sentences, bookmarks, readingDict, currentIndex, settings, activeNovelId };
};

// Backup Functions
export const exportBackup = async (): Promise<{
    sentences: Sentence[];
    bookmarks: number[];
    readingDict: Record<string, string>;
    settings: any;
}> => {
    const sentences = await loadSentences();
    const bookmarksJson = await AsyncStorage.getItem('bookmarks');
    const readingDictJson = await AsyncStorage.getItem('readingDict');
    const settingsJson = await AsyncStorage.getItem('settings');

    return {
        sentences,
        bookmarks: bookmarksJson ? JSON.parse(bookmarksJson) : [],
        readingDict: readingDictJson ? JSON.parse(readingDictJson) : {},
        settings: settingsJson ? JSON.parse(settingsJson) : {},
    };
};

export const importBackup = async (backup: any) => {
    if (backup.sentences) await saveSentences(backup.sentences);
    if (backup.bookmarks) await saveBookmarks(backup.bookmarks);
    if (backup.readingDict) await saveReadingDict(backup.readingDict);
    if (backup.settings) await saveSettings(backup.settings);
};

export const resetAppData = async (): Promise<void> => {
    try {
        await FileSystem.deleteAsync(SENTENCES_FILE, { idempotent: true });
        // Also delete active dictionary if exists
        const dictPath = (FileSystem.documentDirectory || '') + 'active_dictionary.json';
        await FileSystem.deleteAsync(dictPath, { idempotent: true });

        await AsyncStorage.clear();
        console.log('App data reset complete.');
    } catch (error) {
        console.error('Failed to reset app data:', error);
        throw error;
    }
};
