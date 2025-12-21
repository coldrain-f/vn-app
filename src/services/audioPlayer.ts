// Audio player service using expo-av
import { Audio, AVPlaybackStatus } from 'expo-av';
import { getVoiceUrl } from '../config/voiceAssets';
import { voiceDownloadManager } from './voiceDownloadManager';

class AudioPlayerService {
    private bgmSound: Audio.Sound | null = null;
    private voiceSound: Audio.Sound | null = null;
    private bgmVolume: number = 0.3;
    private voiceVolume: number = 1.0;
    private isBgmPlaying: boolean = false;

    // BGM base URL on Cloudflare R2
    private readonly BGM_BASE_URL = 'https://pub-ced4ba529aee44d4be6d41ac76678ba5.r2.dev/BGM';

    // BGM track filenames (key -> filename)
    private bgmTracks: Record<string, string> = {
        // Disc 1
        'promise_piano': '01. Promise -piano-.mp3',
        'promise': '01. Promise.mp3',
        'august_13': '02. August 13 -Explanation-.mp3',
        'confrontation': '02. Confrontation with fear.mp3',
        'lab_daily': '03. ラボの日常.mp3',
        'akihabara': '03. 秋葉原.mp3',
        'experiment': '04. Experiment.mp3',
        'warmth': '04. Warmth of days -Promise-.mp3',
        'butterfly': '05. Butterfly effect.mp3',
        'tajitaji': '05. Tajitaji.mp3',
        'adrenaline': '06. Adrenaline.mp3',
        'timeleap': '06. Timeleap.mp3',
        'science_strings': '07. Science of the Strings.mp3',
        'threat': '07. 脅威.mp3',
        'taiji': '08. 対峙.mp3',
        'gadget_lab': '08. 未来ガジェット研究所.mp3',
        'one_of_selection': '09. One of selection -Gate of steiner-.mp3',
        'kaeri': '09. かえり道.mp3',
        'gate_of_steiner_piano': '10. GATE OF STEINER -piano-.mp3',
        'gate_of_steiner': '10. GATE OF STEINER.mp3',
        'believe_me': '11. Believe Me.mp3',
        'suzuha': '11. 鈴羽.mp3',
        // Disc 2
        'christina_1': '12. Christina I.mp3',
        'd_mail': '12. Dメール.mp3',
        'christina_2': '13. Christina II.mp3',
        'disquiet': '13. Disquiet.mp3',
        'farewell': '14. 別れ.mp3',
        'chuuni_tango': '14. 厨二病のタンゴ.mp3',
        'tender': '15. Tender affection.mp3',
        'tubes': '15. Tubes.mp3',
        'dependency': '16. 依存.mp3',
        'cold_gaze': '16. 冷めた視線.mp3',
        'john_titor': '17. ジョン・タイター.mp3',
        'observer': '17. 観測者.mp3',
        'my_alley': '18. My alley.mp3',
        'silence_eyes': '18. Silence eyes.mp3',
        'no_joke': '19. No joke!.mp3',
        'run_away': '19. Run away!.mp3',
        'at_channel': '20. @Channel.mp3',
        'otokonoko': '20. 男の娘.mp3',
        'okarin_suspense': '21. オカリンのサスペンス.mp3',
        'final_mission': '21. 最終ミッション.mp3',
        'another_heaven': '22. AnotherHeaven ～orchestra～.mp3',
        'incident': '22. 事件.mp3',
        'operation_g_back': '23. Operation G-BACK.mp3',
        'lab_members': '24. Lab-members.mp3',
    };

    async setBgmVolume(volume: number): Promise<void> {
        this.bgmVolume = volume / 100;
        if (this.bgmSound) {
            await this.bgmSound.setVolumeAsync(this.bgmVolume);
        }
    }

    async setVoiceVolume(volume: number): Promise<void> {
        this.voiceVolume = volume / 100;
        if (this.voiceSound) {
            await this.voiceSound.setVolumeAsync(this.voiceVolume);
        }
    }

    private currentBgmTrack: string | null = null;

    async playBgm(trackKey: string = 'gate_of_steiner'): Promise<void> {
        try {
            // Skip if the same track is already playing
            if (this.isBgmPlaying && this.currentBgmTrack === trackKey) {
                return;
            }

            // Stop current BGM if playing
            if (this.bgmSound) {
                await this.bgmSound.unloadAsync();
                this.bgmSound = null;
            }

            const trackFilename = this.bgmTracks[trackKey];
            if (!trackFilename) {
                console.warn('BGM track not found:', trackKey);
                return;
            }

            // Encode filename for URL (handle spaces and special characters)
            const bgmUrl = `${this.BGM_BASE_URL}/${encodeURIComponent(trackFilename)}`;

            const { sound } = await Audio.Sound.createAsync(
                { uri: bgmUrl },
                {
                    volume: this.bgmVolume,
                    isLooping: true,
                }
            );

            this.bgmSound = sound;
            this.currentBgmTrack = trackKey;
            await sound.playAsync();
            this.isBgmPlaying = true;
        } catch (error) {
            console.error('Error playing BGM:', error);
        }
    }

    async stopBgm(): Promise<void> {
        try {
            if (this.bgmSound) {
                await this.bgmSound.stopAsync();
                await this.bgmSound.unloadAsync();
                this.bgmSound = null;
                this.isBgmPlaying = false;
                this.currentBgmTrack = null;
            }
        } catch (error) {
            console.error('Error stopping BGM:', error);
        }
    }

    async toggleBgm(trackKey: string = 'gate_of_steiner'): Promise<boolean> {
        if (this.isBgmPlaying) {
            await this.stopBgm();
            return false;
        } else {
            await this.playBgm(trackKey);
            return true;
        }
    }

    private isVoicePlaying: boolean = false;
    private currentVoiceFile: string | null = null;
    private voiceRequestId: number = 0;  // Track request to invalidate stale ones

    async playVoice(filename: string): Promise<boolean> {
        if (!filename) {
            return false;
        }

        // Increment request ID to invalidate any pending requests
        const thisRequestId = ++this.voiceRequestId;

        try {
            // Remove extension if present to match keys in VoiceAssets
            const key = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '');

            // Skip if the same voice is already playing
            if (this.isVoicePlaying && this.currentVoiceFile === key) {
                return true;
            }

            // Stop and unload current voice if exists
            if (this.voiceSound) {
                const oldSound = this.voiceSound;
                this.voiceSound = null;
                this.isVoicePlaying = false;
                try {
                    await oldSound.stopAsync();
                    await oldSound.unloadAsync();
                } catch (e) {
                    // Ignore stop errors
                }
            }

            // Try to get from local cache first, then fall back to R2 URL
            const voiceSource = await voiceDownloadManager.getVoiceSource(key);

            const { sound } = await Audio.Sound.createAsync(
                voiceSource,
                {
                    volume: this.voiceVolume,
                    shouldPlay: true
                }
            );

            // Check if this request is still valid (no newer request came in)
            if (thisRequestId !== this.voiceRequestId) {
                // A newer request was made, discard this sound
                await sound.unloadAsync();
                return false;
            }

            this.voiceSound = sound;
            this.currentVoiceFile = key;
            this.isVoicePlaying = true;

            // Listen for playback completion
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    this.isVoicePlaying = false;
                    this.currentVoiceFile = null;
                }
            });

            return true;
        } catch (error) {
            console.error('Error playing voice:', error);
            this.isVoicePlaying = false;
            return false;
        }
    }

    async stopVoice(): Promise<void> {
        // Store reference locally to prevent race condition
        const sound = this.voiceSound;
        this.voiceSound = null;
        this.isVoicePlaying = false;
        this.currentVoiceFile = null;

        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (error) {
                // Ignore errors - sound may already be unloaded
            }
        }
    }

    async cleanup(): Promise<void> {
        if (this.bgmSound) {
            await this.bgmSound.unloadAsync();
        }
        if (this.voiceSound) {
            await this.voiceSound.unloadAsync();
        }
    }

    isBgmCurrentlyPlaying(): boolean {
        return this.isBgmPlaying;
    }
}

export const audioPlayer = new AudioPlayerService();
