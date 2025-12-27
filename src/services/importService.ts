import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { saveNovelData } from './novelStorage';
import { Novel, Sentence, DictionaryData } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ImportService {

    /**
     * Pick a .vnpack file and import it into the app storage.
     * @param onProgress Callback for progress updates (0-100)
     * @returns Promise<boolean> true if imported, false if cancelled
     */
    static async pickAndImportNovel(
        onProgress?: (progress: number, message: string) => void,
        checkCancelled?: () => boolean
    ): Promise<boolean> {
        try {
            // 1. Pick File
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
                copyToCacheDirectory: true
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return false;
            }

            if (checkCancelled?.()) throw new Error('Import cancelled by user');

            const file = result.assets[0];
            const uri = file.uri;

            // Simple validation
            if (!file.name.toLowerCase().endsWith('.vnpack') && !file.name.toLowerCase().endsWith('.zip')) {
                throw new Error('Invalid file type. Please select a .vnpack file.');
            }

            if (onProgress) onProgress(10, 'Reading file...');

            await delay(100);
            if (checkCancelled?.()) throw new Error('Import cancelled by user');

            // 2. Read File (as Base64 for JSZip)
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64
            });

            await delay(100);
            if (checkCancelled?.()) throw new Error('Import cancelled by user');

            if (onProgress) onProgress(30, 'Unzipping...');
            await delay(100);

            // 3. Unzip
            const zip = await JSZip.loadAsync(base64, { base64: true });

            // Check required files
            if (!zip.file('sentences.json') || !zip.file('dictionary.json')) {
                throw new Error('Invalid vnpack structure: Missing core JSON files.');
            }

            if (onProgress) onProgress(50, 'Parsing data...');

            await delay(100);
            if (checkCancelled?.()) throw new Error('Import cancelled by user');

            // 4. Parse JSON
            const sentencesText = await zip.file('sentences.json')!.async('string');
            const dictionaryText = await zip.file('dictionary.json')!.async('string');

            await delay(100);
            if (checkCancelled?.()) throw new Error('Import cancelled by user');

            const sentencesJson = JSON.parse(sentencesText);
            const dictionaryData = JSON.parse(dictionaryText) as DictionaryData;

            let sentences: Sentence[] = [];
            let novelId = '';
            let novelTitle = '';

            if (Array.isArray(sentencesJson)) {
                // Direct array format (VN-Forge export)
                sentences = sentencesJson as Sentence[];
                // Use filename as title/id since metadata is not in JSON
                // Clean filename: remove extension
                const nameBase = file.name.replace(/\.(vnpack|zip)$/i, '');
                novelTitle = nameBase;
                // Generate a simpler ID: remove special chars, add timestamp for uniqueness
                // Clean spaces and special chars for ID
                const safeName = nameBase.replace(/[^a-zA-Z0-9_\-\u00C0-\u00FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/g, '_');
                novelId = safeName + '_' + Date.now().toString().slice(-6);
            } else if (sentencesJson.sentences && Array.isArray(sentencesJson.sentences)) {
                // Wrapped format
                sentences = sentencesJson.sentences as Sentence[];
                novelId = sentencesJson.novelId ? String(sentencesJson.novelId) : file.name.replace(/\.(vnpack|zip)$/i, '');
                novelTitle = sentencesJson.novelName || file.name.replace(/\.(vnpack|zip)$/i, '');
            } else {
                throw new Error('Invalid sentences.json: Root must be array or object with "sentences".');
            }

            // Fix empty ids
            sentences = sentences.map((s, idx) => ({ ...s, id: s.id || idx }));

            const novel: Novel = {
                id: novelId,
                title: novelTitle,
                importedAt: new Date().toISOString(),
                sentenceCount: sentences.length
            };

            if (onProgress) onProgress(80, 'Saving to storage...');

            await delay(100);
            if (checkCancelled?.()) throw new Error('Import cancelled by user');

            // 5. Save using NovelStorage
            await saveNovelData(novel, sentences, dictionaryData);

            if (onProgress) onProgress(100, 'Import complete!');

            return true;

        } catch (error) {
            console.error('Import failed:', error);
            // Re-throw to handle UI error alert
            throw error;
        }
    }
}
