// Voice Download Manager - Downloads all voice and BGM files for offline use
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { VOICE_BASE_URL } from '../config/voiceAssets';

// @ts-ignore
export const VOICE_CACHE_DIR = (FileSystem.documentDirectory || '') + 'Voice/';
// @ts-ignore
export const BGM_CACHE_DIR = (FileSystem.documentDirectory || '') + 'BGM/';
const BGM_BASE_URL = 'https://pub-ced4ba529aee44d4be6d41ac76678ba5.r2.dev/BGM';

// BGM tracks to download
const BGM_TRACKS = [
    '01. Promise -piano-.mp3',
    '01. Promise.mp3',
    '02. August 13 -Explanation-.mp3',
    '02. Confrontation with fear.mp3',
    '03. ラボの日常.mp3',
    '03. 秋葉原.mp3',
    '04. Experiment.mp3',
    '04. Warmth of days -Promise-.mp3',
    '05. Butterfly effect.mp3',
    '05. Tajitaji.mp3',
    '06. Adrenaline.mp3',
    '06. Timeleap.mp3',
    '07. Science of the Strings.mp3',
    '07. 脅威.mp3',
    '08. 対峙.mp3',
    '08. 未来ガジェット研究所.mp3',
    '09. One of selection -Gate of steiner-.mp3',
    '09. かえり道.mp3',
    '10. GATE OF STEINER -piano-.mp3',
    '10. GATE OF STEINER.mp3',
    '11. Believe Me.mp3',
    '11. 鈴羽.mp3',
    '12. Christina I.mp3',
    '12. Dメール.mp3',
    '13. Christina II.mp3',
    '13. Disquiet.mp3',
    '14. 別れ.mp3',
    '14. 厨二病のタンゴ.mp3',
    '15. Tender affection.mp3',
    '15. Tubes.mp3',
    '16. 依存.mp3',
    '16. 冷めた視線.mp3',
    '17. ジョン・タイター.mp3',
    '17. 観測者.mp3',
    '18. My alley.mp3',
    '18. Silence eyes.mp3',
    '19. No joke!.mp3',
    '19. Run away!.mp3',
    '20. @Channel.mp3',
    '20. 男の娘.mp3',
    '21. オカリンのサスペンス.mp3',
    '21. 最終ミッション.mp3',
    '22. AnotherHeaven ～orchestra～.mp3',
    '22. 事件.mp3',
    '23. Operation G-BACK.mp3',
    '24. Lab-members.mp3',
];

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

        return { uri: VOICE_BASE_URL + '/' + encodeURIComponent(key + '.mp3') };
    }

    private async ensureCacheDir(): Promise<void> {
        try {
            const voiceDirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (!voiceDirInfo.exists) {
                await FileSystem.makeDirectoryAsync(VOICE_CACHE_DIR, { intermediates: true });
            }
            const bgmDirInfo = await FileSystem.getInfoAsync(BGM_CACHE_DIR);
            if (!bgmDirInfo.exists) {
                await FileSystem.makeDirectoryAsync(BGM_CACHE_DIR, { intermediates: true });
            }
        } catch {
            // Ignore
        }
    }

    private async downloadBgmFile(filename: string): Promise<boolean> {
        const url = BGM_BASE_URL + '/' + encodeURIComponent(filename);
        const localPath = BGM_CACHE_DIR + filename;

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

    private async downloadFile(key: string): Promise<boolean> {
        const url = VOICE_BASE_URL + '/' + encodeURIComponent(key + '.mp3');
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

        const total = voiceFileList.length + BGM_TRACKS.length;
        let completed = 0;
        let failed = 0;

        // Download Voice files
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
                currentFile: key + '.mp3',
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

        // Download BGM files
        for (const bgmFile of BGM_TRACKS) {
            if (this.shouldCancel) break;

            while (this.isPaused && !this.shouldCancel) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (this.shouldCancel) break;

            this.progressCallback?.({
                total,
                completed,
                failed,
                currentFile: '[BGM] ' + bgmFile,
                isDownloading: true,
                isPaused: this.isPaused,
            });

            const success = await this.downloadBgmFile(bgmFile);
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
        // 즉시 UI 갱신
        this.progressCallback?.({
            total: voiceFileList.length + BGM_TRACKS.length,
            completed: 0,  // 정확한 값은 루프에서 유지됨
            failed: 0,
            currentFile: '일시정지됨',
            isDownloading: true,
            isPaused: true,
        });
    }

    resume(): void {
        this.isPaused = false;
    }

    cancel(): void {
        this.shouldCancel = true;
        this.isPaused = false;
        this.isDownloading = false;  // 즉시 false로 설정하여 재시작 가능
        this.progressCallback = null;
    }

    getStatus(): { isDownloading: boolean; isPaused: boolean } {
        return {
            isDownloading: this.isDownloading,
            isPaused: this.isPaused,
        };
    }

    async getCacheSize(): Promise<number> {
        let totalSize = 0;
        try {
            // Voice cache
            const voiceDirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (voiceDirInfo.exists) {
                const voiceFiles = await FileSystem.readDirectoryAsync(VOICE_CACHE_DIR);
                for (const file of voiceFiles) {
                    const fileInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR + file);
                    if (fileInfo.exists && fileInfo.size) {
                        totalSize += fileInfo.size;
                    }
                }
            }
            // BGM cache
            const bgmDirInfo = await FileSystem.getInfoAsync(BGM_CACHE_DIR);
            if (bgmDirInfo.exists) {
                const bgmFiles = await FileSystem.readDirectoryAsync(BGM_CACHE_DIR);
                for (const file of bgmFiles) {
                    const fileInfo = await FileSystem.getInfoAsync(BGM_CACHE_DIR + file);
                    if (fileInfo.exists && fileInfo.size) {
                        totalSize += fileInfo.size;
                    }
                }
            }
            return totalSize;
        } catch {
            return totalSize;
        }
    }

    async getDownloadedCount(): Promise<number> {
        let count = 0;
        try {
            // Voice cache
            const voiceDirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (voiceDirInfo.exists) {
                const voiceFiles = await FileSystem.readDirectoryAsync(VOICE_CACHE_DIR);
                count += voiceFiles.length;
            }
            // BGM cache
            const bgmDirInfo = await FileSystem.getInfoAsync(BGM_CACHE_DIR);
            if (bgmDirInfo.exists) {
                const bgmFiles = await FileSystem.readDirectoryAsync(BGM_CACHE_DIR);
                count += bgmFiles.length;
            }
            return count;
        } catch {
            return count;
        }
    }

    async clearCache(): Promise<void> {
        try {
            const voiceDirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
            if (voiceDirInfo.exists) {
                await FileSystem.deleteAsync(VOICE_CACHE_DIR, { idempotent: true });
            }
            const bgmDirInfo = await FileSystem.getInfoAsync(BGM_CACHE_DIR);
            if (bgmDirInfo.exists) {
                await FileSystem.deleteAsync(BGM_CACHE_DIR, { idempotent: true });
            }
        } catch {
            // Ignore
        }
    }

    getTotalFileCount(): number {
        return voiceFileList.length + BGM_TRACKS.length;
    }
}

export const voiceDownloadManager = new VoiceDownloadManager();
