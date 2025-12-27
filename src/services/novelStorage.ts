import * as FileSystem from 'expo-file-system';
import { Novel, Sentence, DictionaryData } from '../types';

const NOVELS_DIR = FileSystem.documentDirectory + 'novels/';
const NOVELS_LIST_FILE = FileSystem.documentDirectory + 'novels.json';

// Ensure novels directory exists
export const initNovelStorage = async (): Promise<void> => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(NOVELS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(NOVELS_DIR, { intermediates: true });
        }
    } catch (error) {
        console.error('Failed to init novel storage:', error);
    }
};

// Load list of installed novels
export const loadNovelList = async (): Promise<Novel[]> => {
    try {
        await initNovelStorage(); // Ensure dir exists

        const fileInfo = await FileSystem.getInfoAsync(NOVELS_LIST_FILE);
        if (!fileInfo.exists) {
            return [];
        }
        const content = await FileSystem.readAsStringAsync(NOVELS_LIST_FILE);
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to load novel list:', error);
        return [];
    }
};

// Save list of installed novels
export const saveNovelList = async (novels: Novel[]): Promise<void> => {
    try {
        await FileSystem.writeAsStringAsync(NOVELS_LIST_FILE, JSON.stringify(novels));
    } catch (error) {
        console.error('Failed to save novel list:', error);
        throw error;
    }
};

// Save a new novel (sentences and dict)
export const saveNovelData = async (
    novel: Novel,
    sentences: Sentence[],
    dictionary: DictionaryData
): Promise<void> => {
    const novelDir = NOVELS_DIR + novel.id + '/';

    try {
        // 1. Create directory
        await FileSystem.makeDirectoryAsync(novelDir, { intermediates: true });

        // 2. Save sentences.json
        await FileSystem.writeAsStringAsync(
            novelDir + 'sentences.json',
            JSON.stringify(sentences)
        );

        // 3. Save dictionary.json
        await FileSystem.writeAsStringAsync(
            novelDir + 'dictionary.json',
            JSON.stringify(dictionary)
        );

        // 4. Update novel list
        const novels = await loadNovelList();
        const existingIndex = novels.findIndex(n => n.id === novel.id);

        if (existingIndex >= 0) {
            novels[existingIndex] = novel;
        } else {
            novels.push(novel);
        }

        await saveNovelList(novels);

    } catch (error) {
        console.error(`Failed to save novel data for ${novel.id}:`, error);
        // Clean up partial data
        try {
            await FileSystem.deleteAsync(novelDir, { idempotent: true });
        } catch (e) {
            console.warn('Failed to cleanup after error:', e);
        }
        throw error;
    }
};

// Load sentences for a specific novel
export const loadNovelSentences = async (novelId: string): Promise<Sentence[]> => {
    const path = NOVELS_DIR + novelId + '/sentences.json';
    try {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) {
            throw new Error(`Sentences file not found for ${novelId}`);
        }
        const content = await FileSystem.readAsStringAsync(path);
        return JSON.parse(content);
    } catch (error) {
        console.error(`Failed to load sentences for ${novelId}:`, error);
        throw error;
    }
};

// Load dictionary for a specific novel
export const loadNovelDictionary = async (novelId: string): Promise<DictionaryData | null> => {
    const path = NOVELS_DIR + novelId + '/dictionary.json';
    try {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return null;

        const content = await FileSystem.readAsStringAsync(path);
        return JSON.parse(content);
    } catch (error) {
        console.error(`Failed to load dictionary for ${novelId}:`, error);
        return null; // Dictionary might be optional or broken
    }
};

// Delete a novel
export const deleteNovel = async (novelId: string): Promise<void> => {
    const novelDir = NOVELS_DIR + novelId + '/';
    try {
        // Remove directory
        const dirInfo = await FileSystem.getInfoAsync(novelDir);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(novelDir, { idempotent: true });
        }

        // Update list
        const novels = await loadNovelList();
        const updatedNovels = novels.filter(n => n.id !== novelId);
        await saveNovelList(updatedNovels);

    } catch (error) {
        console.error(`Failed to delete novel ${novelId}:`, error);
        throw error;
    }
};
