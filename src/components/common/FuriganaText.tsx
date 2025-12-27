import React, { useState } from 'react';
import { isLoaded } from 'expo-font';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { parseFurigana, FuriganaPart } from '../../utils/furigana';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';
import { isKanji } from '../../utils/kanjiData';
import { haptic } from '../../services/haptic';

interface FuriganaTextProps {
    text: string;
    reading?: string;
    showFurigana?: boolean;
    textStyle?: object;
    furiganaStyle?: object;
    fontSize?: number;
    onKanjiPress?: (kanji: string | string[]) => void;
    onPress?: (event: any) => void;  // For short tap navigation
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({
    text,
    reading,
    showFurigana = true,
    textStyle,
    furiganaStyle,
    fontSize = 22,
    onKanjiPress,
    onPress,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    const displayText = reading || text;
    const parts = parseFurigana(displayText);
    const furiSize = fontSize * 0.5;

    // Line height: Was fontSize + 6 (~28 for 22px), user says "too high".
    // Try reduced line height.
    const containerLineHeight = fontSize + 12; // Sufficient for ruby + base
    const baseLineHeight = fontSize + 4;

    // Split parts into renderable items (single chars for plain text)
    const renderItems: FuriganaPart[] = [];
    parts.forEach(part => {
        if (part.reading) {
            renderItems.push(part);
        } else {
            // Split plain text into characters for better wrapping
            const chars = part.text.split('');
            chars.forEach(char => {
                renderItems.push({
                    text: char,
                    reading: undefined // Plain char has no reading
                });
            });
        }
    });

    return (
        <View style={styles.container}>
            {renderItems.map((item, index) => {
                // Handle newlines explicitly
                if (item.text === '\n') {
                    return <View key={index} style={{ width: '100%', height: 0 }} />;
                }

                const part = item;
                const baseStyle = [
                    styles.baseText,
                    {
                        fontSize: fontSize,
                        lineHeight: baseLineHeight,
                        color: theme.colors.textLight,
                        fontFamily: 'Pretendard-Medium',
                        includeFontPadding: false, // Fix vertical alignment on Android
                        textAlignVertical: 'center',
                    },
                    textStyle,
                ];

                // For plain text (no reading), furigana is transparent spacer
                const furiColor = part.reading ? theme.colors.primaryDim : 'transparent';
                const furiText = part.reading && showFurigana ? part.reading : ' ';

                return (
                    <View key={index} style={[styles.rubyUnit, { marginRight: 0 }]}>
                        <Text
                            style={[
                                styles.furigana,
                                {
                                    fontSize: furiSize,
                                    lineHeight: furiSize, // Tighten line height to exact size
                                    color: furiColor,
                                    fontFamily: 'Pretendard-Medium',
                                    marginBottom: 0, // Remove negative margin
                                    includeFontPadding: false, // Fix vertical alignment on Android
                                    textAlignVertical: 'center',
                                },
                                furiganaStyle,
                            ]}
                        >
                            {furiText}
                        </Text>

                        {onKanjiPress ? (
                            <InteractiveKanji
                                text={part.text}
                                baseStyle={baseStyle}
                                onPress={onPress}
                                onKanjiPress={onKanjiPress}
                                accentColor={theme.colors.accent}
                            />
                        ) : (
                            <Text style={baseStyle}>{part.text}</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

// Sub-component for handling press state independently
const InteractiveKanji: React.FC<{
    text: string;
    baseStyle: any;
    onPress?: (event: any) => void;
    onKanjiPress: (kanji: string | string[]) => void;
    accentColor: string;
}> = ({ text, baseStyle, onPress, onKanjiPress, accentColor }) => {
    const [isPressed, setIsPressed] = useState(false);

    // Check if there are any kanji in this part
    const kanjiChars = text.split('').filter(isKanji);
    const hasKanji = kanjiChars.length > 0;

    const handlePressIn = () => {
        if (hasKanji) {
            setIsPressed(true);
            haptic.medium();
        }
    };

    const handlePressOut = () => {
        setIsPressed(false);
    };

    const handleLongPress = () => {
        if (hasKanji) {
            // Pass all kanji chars to handler
            onKanjiPress(kanjiChars.length === 1 ? kanjiChars[0] : kanjiChars);
        }
    };

    return (
        <Pressable
            onPress={onPress}
            onLongPress={hasKanji ? handleLongPress : undefined}
            onPressIn={hasKanji ? handlePressIn : undefined}
            onPressOut={hasKanji ? handlePressOut : undefined}
            delayLongPress={300}
        >
            <Text style={[baseStyle, isPressed && { color: accentColor }]}>
                {text}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
    },
    rubyUnit: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginVertical: 0,
    },
    furigana: {
        textAlign: 'center',
    },
    baseText: {
        textAlign: 'left',
    },
});

