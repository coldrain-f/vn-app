// Tappable Text component for kanji lookup
// Wraps each kanji character in a touchable element
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { parseFurigana, FuriganaPart } from '../../utils/furigana';
import { isKanji } from '../../utils/kanjiData';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

interface Props {
    text: string;
    reading?: string;
    showFurigana?: boolean;
    onKanjiPress?: (kanji: string) => void;
}

export const TappableText: React.FC<Props> = ({
    text,
    reading,
    showFurigana = true,
    onKanjiPress,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    const displayText = reading || text;
    const parts = parseFurigana(displayText);

    // Render a single character, making kanji tappable
    const renderCharacter = (char: string, index: number, hasReading: boolean, readingText?: string) => {
        const kanjiChar = isKanji(char);

        if (kanjiChar && onKanjiPress) {
            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => onKanjiPress(char)}
                    activeOpacity={0.6}
                    style={styles.kanjiTouchable}
                >
                    <View style={styles.rubyContainer}>
                        {showFurigana && hasReading && readingText && (
                            <Text style={[styles.furigana, { color: theme.colors.primaryDim }]}>
                                {readingText}
                            </Text>
                        )}
                        <Text style={[styles.kanjiText, { color: theme.colors.primary }]}>
                            {char}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View key={index} style={styles.rubyContainer}>
                {showFurigana && hasReading && readingText && (
                    <Text style={[styles.furigana, { color: theme.colors.primaryDim }]}>
                        {readingText}
                    </Text>
                )}
                <Text style={[styles.text, { color: theme.colors.textLight }]}>
                    {char}
                </Text>
            </View>
        );
    };

    // Render each part from furigana parsing
    const renderPart = (part: FuriganaPart, partIndex: number) => {
        if (part.reading) {
            // This part has furigana, need to match characters with readings
            // For simplicity, if the text is a single kanji with reading, render it as one unit
            if (part.text.length === 1) {
                return renderCharacter(part.text, partIndex, true, part.reading);
            }

            // For multi-character parts with readings, render as a group
            return (
                <View key={partIndex} style={styles.rubyContainer}>
                    {showFurigana && (
                        <Text style={[styles.furigana, { color: theme.colors.primaryDim }]}>
                            {part.reading}
                        </Text>
                    )}
                    <View style={styles.textRow}>
                        {part.text.split('').map((char, i) => {
                            const kanjiChar = isKanji(char);
                            if (kanjiChar && onKanjiPress) {
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => onKanjiPress(char)}
                                        activeOpacity={0.6}
                                    >
                                        <Text style={[styles.kanjiText, { color: theme.colors.primary }]}>
                                            {char}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <Text key={i} style={[styles.text, { color: theme.colors.textLight }]}>
                                    {char}
                                </Text>
                            );
                        })}
                    </View>
                </View>
            );
        }

        // No furigana, render each character individually
        return (
            <View key={partIndex} style={styles.textRow}>
                {part.text.split('').map((char, i) => {
                    const kanjiChar = isKanji(char);
                    if (kanjiChar && onKanjiPress) {
                        return (
                            <TouchableOpacity
                                key={i}
                                onPress={() => onKanjiPress(char)}
                                activeOpacity={0.6}
                            >
                                <Text style={[styles.kanjiText, { color: theme.colors.primary }]}>
                                    {char}
                                </Text>
                            </TouchableOpacity>
                        );
                    }
                    return (
                        <Text key={i} style={[styles.text, { color: theme.colors.textLight }]}>
                            {char}
                        </Text>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {parts.map(renderPart)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
    },
    rubyContainer: {
        alignItems: 'center',
        marginBottom: 4,
    },
    textRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    kanjiTouchable: {
        marginBottom: 4,
    },
    text: {
        fontSize: 24,
        lineHeight: 36,
        fontWeight: '500',
    },
    kanjiText: {
        fontSize: 24,
        lineHeight: 36,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    furigana: {
        fontSize: 10,
        lineHeight: 14,
        marginBottom: -2,
    },
});
