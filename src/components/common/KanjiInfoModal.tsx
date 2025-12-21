// Kanji Info Modal Component
// Shows kanji information when user taps on a kanji character
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';
import { KanjiInfo } from '../../types';

interface KanjiInfoModalProps {
    visible: boolean;
    kanji: string;
    info: KanjiInfo | null;
    onClose: () => void;
}

export const KanjiInfoModal: React.FC<KanjiInfoModalProps> = ({
    visible,
    kanji,
    info,
    onClose,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={styles.overlay}
            >
                <View
                    style={[
                        styles.container,
                        {
                            backgroundColor: theme.colors.panel,
                            borderColor: theme.colors.primary,
                        },
                    ]}
                >
                    {/* Header with Kanji */}
                    <View style={styles.header}>
                        <Text style={[styles.kanjiChar, { color: theme.colors.textLight }]}>
                            {kanji}
                        </Text>
                        {info && (
                            <Text style={[styles.meaning, { color: theme.colors.text }]}>
                                {info.meaning || info.huneum || ''}
                            </Text>
                        )}
                    </View>

                    {info ? (
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
                            {/* Korean Reading (훈음) */}
                            {info.huneum && (
                                <View style={styles.row}>
                                    <Text style={[styles.label, { color: theme.colors.primaryDim }]}>
                                        훈음
                                    </Text>
                                    <Text style={[styles.value, { color: theme.colors.text }]}>
                                        {info.huneum}
                                    </Text>
                                </View>
                            )}

                            {/* Japanese Readings */}
                            {info.onyomi && (
                                <View style={styles.row}>
                                    <Text style={[styles.label, { color: theme.colors.info }]}>
                                        음독
                                    </Text>
                                    <Text style={[styles.value, { color: theme.colors.text }]}>
                                        {info.onyomi}
                                    </Text>
                                </View>
                            )}
                            {info.kunyomi && (
                                <View style={styles.row}>
                                    <Text style={[styles.label, { color: theme.colors.accent }]}>
                                        훈독
                                    </Text>
                                    <Text style={[styles.value, { color: theme.colors.text }]}>
                                        {info.kunyomi}
                                    </Text>
                                </View>
                            )}

                            {/* Additional Info */}
                            {info.structure && (
                                <View style={styles.row}>
                                    <Text style={[styles.label, { color: theme.colors.textDim }]}>
                                        모양자
                                    </Text>
                                    <Text style={[styles.value, { color: theme.colors.text }]}>
                                        {info.structure}
                                    </Text>
                                </View>
                            )}
                            {info.jlptLevel && (
                                <View style={styles.row}>
                                    <Text style={[styles.label, { color: theme.colors.textDim }]}>
                                        급수
                                    </Text>
                                    <Text style={[styles.value, { color: theme.colors.primary }]}>
                                        {info.jlptLevel}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    ) : (
                        <View style={styles.content}>
                            <Text style={[styles.noInfo, { color: theme.colors.textDim }]}>
                                한자 정보가 없습니다
                            </Text>
                        </View>
                    )}

                    {/* Close button */}
                    <TouchableOpacity
                        style={[styles.closeButton, { borderColor: theme.colors.border }]}
                        onPress={onClose}
                    >
                        <Text style={{ color: theme.colors.textDim }}>닫기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        maxHeight: '60%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    kanjiChar: {
        fontSize: 56,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    meaning: {
        fontSize: 16,
        textAlign: 'center',
    },
    content: {
        marginBottom: 16,
        maxHeight: 250,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    label: {
        width: 60,
        fontSize: 12,
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    noInfo: {
        textAlign: 'center',
        fontSize: 14,
        paddingVertical: 20,
    },
    closeButton: {
        paddingVertical: 10,
        borderTopWidth: 1,
        alignItems: 'center',
    },
});
