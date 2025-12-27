import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { saveNovelData } from './novelStorage';
import { Novel, Sentence, DictionaryData } from '../types';

export class ImportService {

    /**
     * Pick a .vnpack file and import it into the app storage.
     * @param onProgress Callback for progress updates (0-100)
     * @returns Promise<boolean> true if imported, false if cancelled
     */
    static async pickAndImportNovel(
        onProgress?: (progress: number, message: string) => void
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

            const file = result.assets[0];
            const uri = file.uri;

            // Simple validation
            if (!file.name.toLowerCase().endsWith('.vnpack') && !file.name.toLowerCase().endsWith('.zip')) {
                throw new Error('Invalid file type. Please select a .vnpack file.');
            }

            if (onProgress) onProgress(10, 'Reading file...');

            // 2. Read File (as Base64 for JSZip)
            // Note: For very large files, this might crash due to memory strings.
            // But for typical novels (5-20MB), it should be fine.
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64
            });

            if (onProgress) onProgress(30, 'Unzipping...');

            // 3. Unzip
            const zip = await JSZip.loadAsync(base64, { base64: true });

            // Check required files
            if (!zip.file('sentences.json') || !zip.file('dictionary.json')) {
                throw new Error('Invalid vnpack structure: Missing core JSON files.');
            }

            if (onProgress) onProgress(50, 'Parsing data...');

            // 4. Parse JSON
            const sentencesText = await zip.file('sentences.json')!.async('string');
            const dictionaryText = await zip.file('dictionary.json')!.async('string');

            const sentencesData = JSON.parse(sentencesText);
            const dictionaryData = JSON.parse(dictionaryText) as DictionaryData;

            // Extract Metadata
            // VN-Forge format: { novelId, novelName, sentences: [...] }
            const novelId = sentencesData.novelId ? String(sentencesData.novelId) : file.name.replace(/\.(vnpack|zip)$/i, '');
            const novelTitle = sentencesData.novelName || file.name.replace(/\.(vnpack|zip)$/i, '');

            if (!Array.isArray(sentencesData.sentences)) {
                throw new Error('Invalid sentences.json: "sentences" array missing.');
            }

            const sentences = sentencesData.sentences as Sentence[];

            const novel: Novel = {
                id: novelId,
                title: novelTitle,
                importedAt: new Date().toISOString(),
                sentenceCount: sentences.length
            };

            if (onProgress) onProgress(80, 'Saving to storage...');

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
