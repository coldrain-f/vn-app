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

        const css = dictionaryData.css[selectedDictName] || '';

        // Merge HTMLs
        const mergedHtml = targetEntries.map(e => e.html).join('<hr class="entry-divider" style="margin: 20px 0; border: 0; border-top: 1px dashed #ccc;" />');

        // Base HTML structure with injected CSS and dark mode support if needed
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <base href="https://pub-ced4ba529aee44d4be6d41ac76678ba5.r2.dev/" />
                <style>
                    :root {
                        --background-color: ${theme.colors.background};
                        --text-color: ${theme.colors.text};
                        --primary-color: ${theme.colors.primary};
                        --border-color: ${theme.colors.border};
                    }
                    body {
                        background-color: var(--background-color);
                        color: var(--text-color);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        padding: 16px;
                        margin: 0;
                        font-size: 16px;
                        line-height: 1.5;
                    }
                    /* Injected Dictionary CSS */
                    ${css}
                    
                    /* Overrides for better mobile display */
                    img { max-width: 100%; height: auto; }
                    a { color: var(--primary-color); text-decoration: none; }
                </style>
            </head>
            <body>
                ${mergedHtml}
                <script>
                    // Prevent link navigation if needed, or handle it
                </script>
            </body>
            </html>
        `;
    }, [entries, selectedDictName, dictionaryData, theme]);

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
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.panel }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            {word}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textDim} />
                        </TouchableOpacity>
                    </View>

                    {/* Dictionary Tabs */}
                    {uniqueDictionaries.length > 1 && (
                        <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {uniqueDictionaries.map((dictName, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.tab,
                                            selectedDictIndex === index && {
                                                borderBottomColor: theme.colors.primary,
                                                borderBottomWidth: 2
                                            }
                                        ]}
                                        onPress={() => setSelectedDictIndex(index)}
                                    >
                                        <Text style={[
                                            styles.tabText,
                                            { color: selectedDictIndex === index ? theme.colors.primary : theme.colors.textDim }
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
                                style={{ backgroundColor: theme.colors.background }}
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
