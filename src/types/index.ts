// Data Types for VN;READER

export interface Sentence {
    order: number;
    speaker: string;
    expression: string;
    reading: string;
    meaning: string;
    audio: string;
    memo: string;
}

export interface Settings {
    apiKey: string;
    apiModel: string;
    bgmVolume: number;
    bgmAutoplay: boolean;
    bgmTrack: string;
    voiceVolume: number;
    voiceAutoplay: boolean;
    hapticEnabled: boolean;  // 햄틱 피드백 ON/OFF
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
    kanji: string;       // 한자 문자 (primary key)
    huneum: string;      // 한국어 훈음 (예: "아름다울 가")
    meaning: string;     // 일상적 의미
    structure: string;   // 자형 구성 설명
    radical: string;     // 부수
    strokes: string;     // 획수
    onyomi: string;      // 음독 (カ, コ 등)
    kunyomi: string;     // 훈독
    jlptLevel: string;   // 한자검정 급수
}

export type TabName = 'list' | 'bookmarks' | 'add' | 'dict' | 'settings';

export interface BatchResult {
    index: number;
    success: boolean;
    message: string;
    detail: string;
    type: 'reading' | 'meaning' | 'verify' | 'explanation';
    rawResult: string;
    suggestedValue?: string;
}
