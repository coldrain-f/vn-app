// Data Types for VN;READER

export interface Token {
    surface: string;
    dictForm?: string;
    reading?: string;
    pos?: string;
    baseForm?: string;
    normalizedForm?: string;
    hasDictEntry?: boolean;
    dictSources?: string[];
}

export interface Sentence {
    id?: string | number;
    order: number;
    speaker: string;
    expression: string;
    reading: string;
    meaning: string;
    audio: string;
    memo: string;
    tokens?: Token[];
}

export interface Settings {
    apiKey: string;
    apiModel: string;
    bgmVolume: number;
    bgmAutoplay: boolean;
    bgmTrack: string;
    voiceVolume: number;
    voiceAutoplay: boolean;
    hapticEnabled: boolean;
    theme: ThemeName;
    showFurigana: boolean;
    showTranslation: boolean;
    password: string;
}

export type ThemeName =
    | 'steinsgate'
    | 'cyberpunk'
    | 'ocean'
    | 'sakura'
    | 'amber'
    | 'monochrome'
    | 'modern';

export interface AppData {
    sentences: Sentence[];
    bookmarks: Set<number>;
    readingDict: Record<string, string>;
    currentIndex: number;
    settings: Settings;
}

export interface BackupData {
    version: string;
    exportDate: string;
    data: {
        sentences: Sentence[];
        bookmarks: number[];
        readingDict: Record<string, string>;
        currentIndex: number;
        settings: Settings;
    };
}

export interface KanjiInfo {
    kanji: string;
    huneum: string;
    meaning: string;
    structure: string;
    radical: string;
    strokes: string;
    onyomi: string;
    kunyomi: string;
    jlptLevel: string;
}

export type TabName = 'novels' | 'list' | 'bookmarks' | 'add' | 'dict' | 'settings';

export interface BatchResult {
    index: number;
    success: boolean;
    message: string;
    detail: string;
    type: 'reading' | 'meaning' | 'verify' | 'explanation';
    rawResult: string;
    suggestedValue?: string;
}

// VN-Pack types
export interface Novel {
    id: string;
    title: string;
    importedAt: string;
    sentenceCount: number;
}

export interface DictionaryData {
    css: Record<string, string>;
    entries: Record<string, { dictionary: string; html: string }[]>;
}

// Per-novel progress tracking
export interface NovelProgress {
    currentIndex: number;
    bookmarks: number[];
}
