import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { DictionaryData } from '../types';

interface DictionaryModalProps {
    visible: boolean;
    onClose: () => void;
    word: string;
    dictionaryData: DictionaryData | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
    visible,
    onClose,
    word,
    dictionaryData,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);
    const [selectedDictIndex, setSelectedDictIndex] = useState(0);

    // Get entries for the selected word
    const entries = useMemo(() => {
        if (!dictionaryData || !dictionaryData.entries || !word) return [];
        return dictionaryData.entries[word] || [];
    }, [dictionaryData, word]);

    // Group entries by dictionary
    const uniqueDictionaries = useMemo(() => {
        if (!entries.length) return [];
        const seen = new Set<string>();
        const unique: string[] = [];
        entries.forEach(e => {
            if (!seen.has(e.dictionary)) {
                seen.add(e.dictionary);
                unique.push(e.dictionary);
            }
        });
        return unique;
    }, [entries]);

    const selectedDictName = uniqueDictionaries[selectedDictIndex] || uniqueDictionaries[0];

    // Reset selection when word changes
    useEffect(() => {
        setSelectedDictIndex(0);
    }, [word]);

    // Generate HTML for the current dictionary
    const currentHtml = useMemo(() => {
        if (entries.length === 0 || !dictionaryData || !selectedDictName) return null;

        // Get all entries for this dictionary name
        const targetEntries = entries.filter(e => e.dictionary === selectedDictName);
        if (targetEntries.length === 0) return null;

        // Get common CSS and dictionary-specific CSS
        const commonCss = dictionaryData.css['_common'] || '';
        const dictCss = dictionaryData.css[selectedDictName] || '';

        // Merge HTMLs
        const mergedHtml = targetEntries.map(e => e.html).join('<hr class="entry-divider" style="margin: 20px 0; border: 0; border-top: 1px dashed #ccc;" />');

        // Base HTML structure - Light background to match SUDACHI LAB
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    /* Common Dictionary Styles */
                    ${commonCss}
                    
                    /* Dictionary-specific Styles */
                    ${dictCss}
                    
                    /* Base body styling - Light theme for compatibility */
                    body {
                        background-color: #FFFFFF;
                        color: #1e293b;
                        font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        padding: 16px;
                        margin: 0;
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    
                    /* Overrides for better mobile display */
                    img { max-width: 100%; height: auto; }
                    
                    /* Gaiji (external characters) - inline sizing */
                    img[src*="gaiji"] {
                        width: 1.2em !important;
                        height: auto !important;
                        max-width: none !important;
                        vertical-align: text-bottom;
                        display: inline-block;
                    }
                    
                    /* Details/Summary styling */
                    details {
                        margin: 0.5em 0;
                    }
                    
                    summary {
                        cursor: pointer;
                    }
                    
                    /* Hide dictionary's text-based arrow from [data-summary]::before */
                    [data-summary]::before {
                        display: none !important;
                        content: none !important;
                    }
                    
                    /* Expanded content styling */
                    details[open] > *:not(summary) {
                        padding-left: 1em;
                        border-left: 2px solid #E2E8F0;
                        margin-left: 0.5em;
                    }
                    
                    /* Visual feedback when open */
                    details[open] > summary {
                        color: #0284C7;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="dict-entries">
                    ${mergedHtml}
                </div>
            </body>
            </html>
        `;
    }, [entries, selectedDictName, dictionaryData]);

    if (!dictionaryData) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={[styles.modalContainer, { backgroundColor: '#FFFFFF' }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: '#E2E8F0' }]}>
                        <Text style={[styles.title, { color: '#1e293b' }]}>
                            {word}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Dictionary Tabs */}
                    {uniqueDictionaries.length > 1 && (
                        <View style={[styles.tabsContainer, { borderBottomColor: '#E2E8F0' }]}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {uniqueDictionaries.map((dictName, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.tab,
                                            selectedDictIndex === index && {
                                                borderBottomColor: '#0284C7',
                                                borderBottomWidth: 2
                                            }
                                        ]}
                                        onPress={() => setSelectedDictIndex(index)}
                                    >
                                        <Text style={[
                                            styles.tabText,
                                            { color: selectedDictIndex === index ? '#0284C7' : '#64748b' }
                                        ]}>
                                            {dictName}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {entries.length > 0 ? (
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: currentHtml || '' }}
                                style={{ backgroundColor: '#FFFFFF' }}
                                showsVerticalScrollIndicator={true}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: theme.colors.textDim }}>
                                    사전 데이터가 없습니다.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        height: SCREEN_HEIGHT * 0.8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Pretendard-Bold',
    },
    closeButton: {
        padding: 4,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        flexDirection: 'row',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        minWidth: 80,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Pretendard-Medium',
    },
    contentContainer: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
