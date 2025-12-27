// Global state management using Zustand
import { create } from 'zustand';
import { Sentence, Settings, ThemeName } from '../types';
import * as storage from '../services/storage';

interface AppState {
    // Data
    sentences: Sentence[];
    bookmarks: Set<number>;
    readingDict: Record<string, string>;
    currentIndex: number;
    settings: Settings;

    // UI State
    isLoading: boolean;
    loadingProgress: number;
    isAuthenticated: boolean;
    selectedListItems: Set<number>;
    selectedBookmarkItems: Set<number>;
    selectedDictWords: Set<string>;
    activeNovelId: string | null;

    // Actions - Data
    setSentences: (sentences: Sentence[]) => void;
    addSentence: (sentence: Sentence) => void;
    updateSentence: (index: number, sentence: Partial<Sentence>) => void;
    deleteSentence: (index: number) => void;
    deleteSentences: (indices: number[]) => void;

    // Actions - Navigation
    setCurrentIndex: (index: number) => void;
    nextSentence: () => void;
    prevSentence: () => void;

    // Actions - Bookmarks
    toggleBookmark: (index?: number) => void;

    // Actions - Settings
    setSettings: (settings: Partial<Settings>) => void;
    setTheme: (theme: ThemeName) => void;

    // Actions - Reading Dict
    addToReadingDict: (word: string, reading: string) => void;
    updateReadingDict: (word: string, reading: string) => void;
    removeFromReadingDict: (word: string) => void;
    removeMultipleFromReadingDict: (words: string[]) => void;
    toggleDictSelection: (word: string) => void;
    clearDictSelection: () => void;

    // Actions - Selection
    toggleSelection: (index: number, scope: 'list' | 'bookmarks') => void;
    selectAll: (indices: number[], scope: 'list' | 'bookmarks') => void;
    clearSelection: (scope?: 'list' | 'bookmarks') => void;

    // Actions - Auth
    authenticate: () => void;

    // Actions - Loading
    loadData: () => Promise<void>;

    // Actions - Backup
    exportBackup: () => Promise<string>;
    importBackup: (data: string) => Promise<void>;
    // Actions - Active Novel
    setActiveNovelId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    sentences: [],
    bookmarks: new Set(),
    readingDict: {},
    currentIndex: 0,
    settings: {
        apiKey: '',
        apiModel: 'claude-sonnet-4-5-20250929',
        bgmVolume: 10,
        bgmAutoplay: true,
        bgmTrack: 'gate_of_steiner',
        voiceVolume: 100,
        voiceAutoplay: true,
        hapticEnabled: true,
        theme: 'steinsgate',
        showFurigana: false,
        showTranslation: false,
        password: '',
    },
    isLoading: true,
    loadingProgress: 0,
    isAuthenticated: false,
    selectedListItems: new Set(),
    selectedBookmarkItems: new Set(),
    selectedDictWords: new Set(),
    activeNovelId: null,

    // Data actions
    setSentences: (sentences) => {
        set({ sentences });
        storage.saveSentences(sentences);
    },

    addSentence: (sentence) => {
        const { sentences } = get();
        const newSentence = { ...sentence, order: sentences.length + 1 };
        const newSentences = [...sentences, newSentence];
        set({ sentences: newSentences });
        storage.saveSentences(newSentences);
    },

    updateSentence: (index, updates) => {
        const { sentences } = get();
        const newSentences = [...sentences];
        newSentences[index] = { ...newSentences[index], ...updates };
        set({ sentences: newSentences });
        storage.saveSentences(newSentences);
    },

    deleteSentence: (index) => {
        const { sentences, bookmarks, currentIndex } = get();
        const newSentences = sentences.filter((_, i) => i !== index);
        // Reorder
        newSentences.forEach((s, i) => { s.order = i + 1; });

        // Update bookmarks
        const newBookmarks = new Set<number>();
        bookmarks.forEach(b => {
            if (b < index) newBookmarks.add(b);
            else if (b > index) newBookmarks.add(b - 1);
        });

        // Adjust current index
        let newIndex = currentIndex;
        if (currentIndex >= newSentences.length) {
            newIndex = Math.max(0, newSentences.length - 1);
        }

        set({ sentences: newSentences, bookmarks: newBookmarks, currentIndex: newIndex });
        storage.saveSentences(newSentences);
        storage.saveBookmarks(newBookmarks);
        storage.saveCurrentIndex(newIndex);
    },

    deleteSentences: (indices) => {
        const { sentences, bookmarks, currentIndex } = get();
        const indexSet = new Set(indices);
        const newSentences = sentences.filter((_, i) => !indexSet.has(i));
        newSentences.forEach((s, i) => { s.order = i + 1; });

        // Update bookmarks (complex mapping)
        const newBookmarks = new Set<number>();
        let removed = 0;
        sentences.forEach((_, i) => {
            if (indexSet.has(i)) {
                removed++;
            } else if (bookmarks.has(i)) {
                newBookmarks.add(i - removed);
            }
        });

        let newIndex = currentIndex;
        if (currentIndex >= newSentences.length) {
            newIndex = Math.max(0, newSentences.length - 1);
        }

        set({
            sentences: newSentences,
            bookmarks: newBookmarks,
            currentIndex: newIndex,
            selectedListItems: new Set(),
            selectedBookmarkItems: new Set()
        });
        storage.saveSentences(newSentences);
        storage.saveBookmarks(newBookmarks);
        storage.saveCurrentIndex(newIndex);
    },

    // Navigation actions
    setCurrentIndex: (index) => {
        const { sentences } = get();
        if (index >= 0 && index < sentences.length) {
            set({ currentIndex: index });
            storage.saveCurrentIndex(index);
        }
    },

    nextSentence: () => {
        const { currentIndex, sentences } = get();
        if (currentIndex < sentences.length - 1) {
            set({ currentIndex: currentIndex + 1 });
            storage.saveCurrentIndex(currentIndex + 1);
        }
    },

    prevSentence: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
            set({ currentIndex: currentIndex - 1 });
            storage.saveCurrentIndex(currentIndex - 1);
        }
    },

    // Bookmark actions
    toggleBookmark: (index) => {
        const { bookmarks, currentIndex } = get();
        const targetIndex = index ?? currentIndex;
        const newBookmarks = new Set(bookmarks);

        if (newBookmarks.has(targetIndex)) {
            newBookmarks.delete(targetIndex);
        } else {
            newBookmarks.add(targetIndex);
        }

        set({ bookmarks: newBookmarks });
        storage.saveBookmarks(newBookmarks);
    },

    // Settings actions
    setSettings: (updates) => {
        const { settings } = get();
        const newSettings = { ...settings, ...updates };
        set({ settings: newSettings });
        storage.saveSettings(newSettings);
    },

    setTheme: (theme) => {
        const { settings } = get();
        const newSettings = { ...settings, theme };
        set({ settings: newSettings });
        storage.saveSettings(newSettings);
    },

    // Reading dict actions
    addToReadingDict: (word, reading) => {
        const { readingDict } = get();
        const newDict = { ...readingDict, [word]: reading };
        set({ readingDict: newDict });
        storage.saveReadingDict(newDict);
    },

    updateReadingDict: (word, reading) => {
        const { readingDict } = get();
        if (word in readingDict) {
            const newDict = { ...readingDict, [word]: reading };
            set({ readingDict: newDict });
            storage.saveReadingDict(newDict);
        }
    },

    removeFromReadingDict: (word) => {
        const { readingDict, selectedDictWords } = get();
        const newDict = { ...readingDict };
        delete newDict[word];
        const newSelected = new Set(selectedDictWords);
        newSelected.delete(word);
        set({ readingDict: newDict, selectedDictWords: newSelected });
        storage.saveReadingDict(newDict);
    },

    removeMultipleFromReadingDict: (words) => {
        const { readingDict } = get();
        const newDict = { ...readingDict };
        words.forEach(word => delete newDict[word]);
        set({ readingDict: newDict, selectedDictWords: new Set() });
        storage.saveReadingDict(newDict);
    },

    toggleDictSelection: (word) => {
        const { selectedDictWords } = get();
        const newSelected = new Set(selectedDictWords);
        if (newSelected.has(word)) {
            newSelected.delete(word);
        } else {
            newSelected.add(word);
        }
        set({ selectedDictWords: newSelected });
    },

    clearDictSelection: () => {
        set({ selectedDictWords: new Set() });
    },

    setActiveNovelId: (id) => {
        set({ activeNovelId: id });
        storage.saveActiveNovelId(id);
    },

    // Selection actions
    toggleSelection: (index, scope = 'list') => {
        const { selectedListItems, selectedBookmarkItems } = get();
        const targetSet = scope === 'bookmarks' ? selectedBookmarkItems : selectedListItems;
        const newSelected = new Set(targetSet);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }

        if (scope === 'bookmarks') set({ selectedBookmarkItems: newSelected });
        else set({ selectedListItems: newSelected });
    },

    selectAll: (indices, scope = 'list') => {
        if (scope === 'bookmarks') set({ selectedBookmarkItems: new Set(indices) });
        else set({ selectedListItems: new Set(indices) });
    },

    clearSelection: (scope) => {
        if (scope === 'bookmarks') set({ selectedBookmarkItems: new Set() });
        else if (scope === 'list') set({ selectedListItems: new Set() });
        else set({ selectedListItems: new Set(), selectedBookmarkItems: new Set() });
    },

    // Auth actions
    authenticate: () => {
        set({ isAuthenticated: true });
    },

    // Load data
    loadData: async () => {
        set({ isLoading: true, loadingProgress: 0 });
        try {
            const data = await storage.loadAllData((progress) => {
                set({ loadingProgress: progress });
            });
            set({
                sentences: data.sentences,
                bookmarks: new Set(data.bookmarks),
                readingDict: data.readingDict,
                currentIndex: data.currentIndex,
                settings: data.settings ? { ...get().settings, ...data.settings } : get().settings,
                activeNovelId: data.activeNovelId,
                isLoading: false,
                loadingProgress: 100,
            });
        } catch (error) {
            console.error('Error loading data:', error);
            set({ isLoading: false, loadingProgress: 0 });
        }
    },

    // Backup actions
    exportBackup: async () => {
        const backup = await storage.exportBackup();
        return JSON.stringify(backup, null, 2);
    },

    importBackup: async (data) => {
        const backup = JSON.parse(data);
        await storage.importBackup(backup);
        await get().loadData();
    },
}));
