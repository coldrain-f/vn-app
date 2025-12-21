// Audio player service using expo-av
import { Audio, AVPlaybackStatus } from 'expo-av';
import { VoiceAssets } from '../config/voiceAssets';

class AudioPlayerService {
    private bgmSound: Audio.Sound | null = null;
    private voiceSound: Audio.Sound | null = null;
    private bgmVolume: number = 0.3;
    private voiceVolume: number = 1.0;
    private isBgmPlaying: boolean = false;

    // BGM assets mapping
    private bgmTracks: Record<string, any> = {
        'gate_of_steiner': require('../../assets/BGM/1-03 GATE OF STEINER (Main Theme).mp3'),
        'noisy_times': require('../../assets/BGM/1-07 Noisy Times.mp3'),
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

            const track = this.bgmTracks[trackKey];
            if (!track) {
                console.warn('BGM track not found:', trackKey);
                return;
            }

            const { sound } = await Audio.Sound.createAsync(
                track,
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

            const asset = VoiceAssets[key];

            if (!asset) {
                console.warn(`Voice asset not found for key: ${key} (filename: ${filename})`);
                return false;
            }

            const { sound } = await Audio.Sound.createAsync(
                asset,
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
