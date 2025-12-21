// Sentence Edit Modal - Edit current sentence fields
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';
import { Sentence } from '../../types';
import { generateReading, generateMeaning, generateExplanation } from '../../services/claudeApi';

interface SentenceEditModalProps {
    visible: boolean;
    sentence: Sentence | null;
    sentenceIndex: number;
    onClose: () => void;
    onSave: (index: number, updates: Partial<Sentence>) => void;
}

export const SentenceEditModal: React.FC<SentenceEditModalProps> = ({
    visible,
    sentence,
    sentenceIndex,
    onClose,
    onSave,
}) => {
    const { settings, readingDict } = useAppStore();
    const theme = getTheme(settings.theme);

    // Form state
    const [expression, setExpression] = useState('');
    const [reading, setReading] = useState('');
    const [meaning, setMeaning] = useState('');
    const [speaker, setSpeaker] = useState('');
    const [memo, setMemo] = useState('');

    // Loading state for AI operations
    const [loadingField, setLoadingField] = useState<'reading' | 'meaning' | 'memo' | null>(null);

    // Populate form when sentence changes
    useEffect(() => {
        if (sentence) {
            setExpression(sentence.expression || '');
            setReading(sentence.reading || '');
            setMeaning(sentence.meaning || '');
            setSpeaker(sentence.speaker || '');
            setMemo(sentence.memo || '');
        }
    }, [sentence]);

    const handleSave = () => {
        if (!expression.trim()) {
            return; // Expression is required
        }

        onSave(sentenceIndex, {
            expression: expression.trim(),
            reading: reading.trim() || expression.trim(),
            meaning: meaning.trim(),
            speaker: speaker.trim(),
            memo: memo.trim(),
        });
        onClose();
    };

    // AI Generators
    const handleGenerateReading = async () => {
        if (!expression.trim()) return;

        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            Alert.alert('오류', 'API 키가 설정되지 않았습니다.');
            return;
        }

        setLoadingField('reading');
        try {
            const result = await generateReading(
                expression,
                readingDict,
                apiKey,
                settings.apiModel
            );
            if (result) {
                setReading(result);
            } else {
                Alert.alert('실패', '읽기 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '생성 중 오류가 발생했습니다.');
        } finally {
            setLoadingField(null);
        }
    };

    const handleGenerateMeaning = async () => {
        if (!expression.trim()) return;

        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            Alert.alert('오류', 'API 키가 설정되지 않았습니다.');
            return;
        }

        setLoadingField('meaning');
        try {
            const result = await generateMeaning(
                expression,
                readingDict,
                apiKey,
                settings.apiModel
            );
            if (result) {
                setMeaning(result);
            } else {
                Alert.alert('실패', '번역 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '생성 중 오류가 발생했습니다.');
        } finally {
            setLoadingField(null);
        }
    };

    const handleGenerateMemo = async () => {
        if (!expression.trim()) return;

        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            Alert.alert('오류', 'API 키가 설정되지 않았습니다.');
            return;
        }

        setLoadingField('memo');
        try {
            const result = await generateExplanation(
                expression,
                readingDict,
                apiKey,
                settings.apiModel
            );
            if (result) {
                setMemo(result);
            } else {
                Alert.alert('실패', '해설 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '생성 중 오류가 발생했습니다.');
        } finally {
            setLoadingField(null);
        }
    };

    const renderAiButton = (field: 'reading' | 'meaning' | 'memo', onPress: () => void, label: string) => {
        const isLoading = loadingField === field;
        return (
            <TouchableOpacity
                style={[
                    styles.aiButton,
                    {
                        borderColor: theme.colors.info,
                        backgroundColor: `${theme.colors.info}10`,
                        opacity: !expression.trim() || isLoading ? 0.5 : 1
                    }
                ]}
                onPress={onPress}
                disabled={!expression.trim() || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.info} />
                ) : (
                    <MaterialCommunityIcons name="robot" size={14} color={theme.colors.info} />
                )}
                <Text style={{ color: theme.colors.info, fontSize: 12, marginLeft: 4 }}>
                    {isLoading ? '생성 중...' : label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (!visible || !sentence) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.title, { color: theme.colors.primary }]}>
                            문장 편집
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textDim }]}>
                            #{sentenceIndex + 1}
                        </Text>
                    </View>

                    {/* Form */}
                    <ScrollView style={styles.form} showsVerticalScrollIndicator={true}>
                        {/* Expression (Required) */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: theme.colors.primary }]}>
                                원문 *
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.multilineInput,
                                    {
                                        backgroundColor: theme.colors.darker,
                                        color: theme.colors.textLight,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                value={expression}
                                onChangeText={setExpression}
                                placeholder="일본어 원문"
                                placeholderTextColor={theme.colors.textDim}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Reading */}
                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: theme.colors.info, marginBottom: 0 }]}>
                                    읽기 (후리가나)
                                </Text>
                                {renderAiButton('reading', handleGenerateReading, 'AI 읽기 생성')}
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.multilineInput,
                                    {
                                        backgroundColor: theme.colors.darker,
                                        color: theme.colors.textLight,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                value={reading}
                                onChangeText={setReading}
                                placeholder="읽기 (예: 今日[きょう]は)"
                                placeholderTextColor={theme.colors.textDim}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Meaning */}
                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: theme.colors.accent, marginBottom: 0 }]}>
                                    한국어
                                </Text>
                                {renderAiButton('meaning', handleGenerateMeaning, 'AI 번역 생성')}
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.multilineInput,
                                    {
                                        backgroundColor: theme.colors.darker,
                                        color: theme.colors.textLight,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                value={meaning}
                                onChangeText={setMeaning}
                                placeholder="한국어 번역"
                                placeholderTextColor={theme.colors.textDim}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Speaker */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: theme.colors.textDim }]}>
                                캐릭터 이름
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.colors.darker,
                                        color: theme.colors.textLight,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                value={speaker}
                                onChangeText={setSpeaker}
                                placeholder="캐릭터 이름"
                                placeholderTextColor={theme.colors.textDim}
                            />
                        </View>

                        {/* Memo */}
                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: theme.colors.textDim, marginBottom: 0 }]}>
                                    해설/메모
                                </Text>
                                {renderAiButton('memo', handleGenerateMemo, 'AI 해설 생성')}
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.multilineInput,
                                    {
                                        backgroundColor: theme.colors.darker,
                                        color: theme.colors.textLight,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                value={memo}
                                onChangeText={setMemo}
                                placeholder="AI 해설 또는 메모"
                                placeholderTextColor={theme.colors.textDim}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </ScrollView>

                    {/* Buttons */}
                    <View style={[styles.buttons, { borderTopColor: theme.colors.border }]}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={{ color: theme.colors.textDim }}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.saveButton,
                                {
                                    backgroundColor: theme.colors.primary,
                                    opacity: expression.trim() ? 1 : 0.5,
                                },
                            ]}
                            onPress={handleSave}
                            disabled={!expression.trim()}
                        >
                            <MaterialCommunityIcons name="check" size={18} color={theme.colors.darker} />
                            <Text style={[styles.saveButtonText, { color: theme.colors.darker }]}>
                                저장
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: 16,
    },
    container: {
        maxHeight: '90%',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Pretendard-Bold',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Pretendard',
    },
    form: {
        padding: 16,
        maxHeight: 400,
    },
    field: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        fontFamily: 'Pretendard',
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'Pretendard',
    },
    multilineInput: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    buttons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 6,
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {},
    saveButtonText: {
        fontWeight: '600',
        fontFamily: 'Pretendard',
    },
});
