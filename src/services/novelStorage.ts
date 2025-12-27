import * as FileSystem from 'expo-file-system/legacy';
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
        await initNovelStorage();

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
        await FileSystem.makeDirectoryAsync(novelDir, { intermediates: true });

        await FileSystem.writeAsStringAsync(
            novelDir + 'sentences.json',
            JSON.stringify(sentences)
        );

        await FileSystem.writeAsStringAsync(
            novelDir + 'dictionary.json',
            JSON.stringify(dictionary)
        );

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
        try {
            await FileSystem.deleteAsync(novelDir, { idempotent: true });
        } catch (e) {
            console.warn('Failed to cleanup after error:', e);
        }
        throw error;
    }
};

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

export const loadNovelDictionary = async (novelId: string): Promise<DictionaryData | null> => {
    const path = NOVELS_DIR + novelId + '/dictionary.json';
    try {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return null;

        const content = await FileSystem.readAsStringAsync(path);
        return JSON.parse(content);
    } catch (error) {
        console.error(`Failed to load dictionary for ${novelId}:`, error);
        return null;
    }
};

export const deleteNovel = async (novelId: string): Promise<void> => {
    const novelDir = NOVELS_DIR + novelId + '/';
    try {
        const dirInfo = await FileSystem.getInfoAsync(novelDir);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(novelDir, { idempotent: true });
        }

        const novels = await loadNovelList();
        const updatedNovels = novels.filter(n => n.id !== novelId);
        await saveNovelList(updatedNovels);

    } catch (error) {
        console.error(`Failed to delete novel ${novelId}:`, error);
        throw error;
    }
};

// Activate a novel (copy to main files)
export const activateNovel = async (novelId: string): Promise<void> => {
    const novelDir = NOVELS_DIR + novelId + '/';
    // Matches storage.ts SENTENCES_FILE constant standard
    const mainSentencesPath = FileSystem.documentDirectory + 'sentences.json';
    const mainDictPath = FileSystem.documentDirectory + 'active_dictionary.json';

    try {
        // Sentences
        await FileSystem.deleteAsync(mainSentencesPath, { idempotent: true });
        await FileSystem.copyAsync({
            from: novelDir + 'sentences.json',
            to: mainSentencesPath
        });

        // Dictionary
        await FileSystem.deleteAsync(mainDictPath, { idempotent: true });
        const dictSrc = novelDir + 'dictionary.json';
        const dictInfo = await FileSystem.getInfoAsync(dictSrc);

        if (dictInfo.exists) {
            await FileSystem.copyAsync({
                from: dictSrc,
                to: mainDictPath
            });
        }
    } catch (error) {
        console.error(`Failed to activate novel ${novelId}:`, error);
        throw error;
    }
};
