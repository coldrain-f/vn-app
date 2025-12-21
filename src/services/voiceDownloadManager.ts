// Voice Download Manager - Downloads all voice files for offline use
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { VOICE_BASE_URL } from '../config/voiceAssets';

// @ts-ignore
export const VOICE_CACHE_DIR = (FileSystem.documentDirectory || '') + 'Voice/';

let voiceFileList: string[] = [];

export interface DownloadProgress {
    total: number;
    completed: number;
    failed: number;
    currentFile: string;
    isDownloading: boolean;
    isPaused: boolean;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

class VoiceDownloadManager {
    private isDownloading: boolean = false;
    private isPaused: boolean = false;
    private shouldCancel: boolean = false;
    private progressCallback: ProgressCallback | null = null;

    setVoiceFileList(files: string[]) {
        voiceFileList = [...new Set(files.filter(f => f && f.trim() !== ''))];
    }

    getLocalPath(filename: string): string {
        const key = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '');
        return VOICE_CACHE_DIR + key + '.mp3';
    }

    async isDownloaded(filename: string): Promise<boolean> {
        try {
            const localPath = this.getLocalPath(filename);
            const info = await FileSystem.getInfoAsync(localPath);
            return info.exists;
        } catch {
            return false;
        }
    }

    async getVoiceSource(filename: string): Promise<{ uri: string }> {
        const key = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '');
        const localPath = VOICE_CACHE_DIR + key + '.mp3';

        try {
            const info = await FileSystem.getInfoAsync(localPath);
            if (info.exists) {
                return { uri: localPath };
            }
        } catch {
            // Fall through to remote
        }

        return { uri: VOICE_BASE_URL + '/' + key + '.mp3' };
    }

    private async ensureCacheDir(): Promise<void> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(VOICE_CACHE_DIR, { intermediates: true });
            }
        } catch {
            // Ignore
        }
    }

    private async downloadFile(key: string): Promise<boolean> {
        const url = VOICE_BASE_URL + '/' + key + '.mp3';
        const localPath = VOICE_CACHE_DIR + key + '.mp3';

        try {
            const info = await FileSystem.getInfoAsync(localPath);
            if (info.exists) {
                return true;
            }

            const result = await FileSystem.downloadAsync(url, localPath);
            return result.status === 200;
        } catch {
            return false;
        }
    }

    async startDownload(onProgress: ProgressCallback): Promise<void> {
        if (this.isDownloading) {
            return;
        }

        this.isDownloading = true;
        this.isPaused = false;
        this.shouldCancel = false;
        this.progressCallback = onProgress;

        await this.ensureCacheDir();

        const total = voiceFileList.length;
        let completed = 0;
        let failed = 0;

        for (const filename of voiceFileList) {
            if (this.shouldCancel) break;

            while (this.isPaused && !this.shouldCancel) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (this.shouldCancel) break;

            const key = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '');

            this.progressCallback?.({
                total,
                completed,
                failed,
                currentFile: key,
                isDownloading: true,
                isPaused: this.isPaused,
            });

            const success = await this.downloadFile(key);
            if (success) {
                completed++;
            } else {
                failed++;
            }
        }

        this.progressCallback?.({
            total,
            completed,
            failed,
            currentFile: '',
            isDownloading: false,
            isPaused: false,
        });

        this.isDownloading = false;
        this.progressCallback = null;
    }

    pause(): void {
        this.isPaused = true;
    }

    resume(): void {
        this.isPaused = false;
    }

    cancel(): void {
        this.shouldCancel = true;
        this.isPaused = false;
    }

    getStatus(): { isDownloading: boolean; isPaused: boolean } {
        return {
            isDownloading: this.isDownloading,
            isPaused: this.isPaused,
        };
    }

    async getCacheSize(): Promise<number> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (!dirInfo.exists) return 0;

            const files = await FileSystem.readDirectoryAsync(VOICE_CACHE_DIR);
            let totalSize = 0;

            for (const file of files) {
                const fileInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR + file);
                if (fileInfo.exists && fileInfo.size) {
                    totalSize += fileInfo.size;
                }
            }

            return totalSize;
        } catch {
            return 0;
        }
    }

    async getDownloadedCount(): Promise<number> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (!dirInfo.exists) return 0;

            const files = await FileSystem.readDirectoryAsync(VOICE_CACHE_DIR);
            return files.length;
        } catch {
            return 0;
        }
    }

    async clearCache(): Promise<void> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (dirInfo.exists) {
                await FileSystem.deleteAsync(VOICE_CACHE_DIR, { idempotent: true });
            }
        } catch {
            // Ignore
        }
    }

    getTotalFileCount(): number {
        return voiceFileList.length;
    }
}

export const voiceDownloadManager = new VoiceDownloadManager();
