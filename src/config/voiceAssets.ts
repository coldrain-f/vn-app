// Voice files are now hosted on Cloudflare R2
// Base URL for voice assets
export const VOICE_BASE_URL = 'https://pub-ced4ba529aee44d4be6d41ac76678ba5.r2.dev/Voice';

// Helper function to get voice URL
export function getVoiceUrl(filename: string): string {
    // Remove extension if present
    const key = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '');
    return `${VOICE_BASE_URL}/${key}.mp3`;
}

// Legacy export for compatibility (empty object)
export const VoiceAssets: { [key: string]: any } = {};
