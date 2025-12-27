import React, { useState } from 'react';
import { isLoaded } from 'expo-font';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { parseFurigana, FuriganaPart } from '../../utils/furigana';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';
import { isKanji } from '../../utils/kanjiData';
import { haptic } from '../../services/haptic';

import { Token } from '../../types';

interface FuriganaTextProps {
    text: string;
    reading?: string;
    showFurigana?: boolean;
    textStyle?: object;
    furiganaStyle?: object;
    fontSize?: number;
    onKanjiPress?: (kanji: string | string[]) => void;
    onPress?: (event: any) => void;
    tokens?: Token[]; // Added tokens prop
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
    tokens,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    const furiSize = fontSize * 0.5;
    // const containerLineHeight = fontSize + 12; // Unused
    const baseLineHeight = fontSize + 4;

    const fontFamily = isLoaded('YuMincho') ? 'YuMincho' : 'Pretendard-Medium';

    // RENDER STRATEGY 1: Token-based (Priority)
    if (tokens && tokens.length > 0) {
        return (
            <View style={styles.container}>
                {tokens.map((token, index) => {
                    // Check if newline
                    if (token.surface === '\n') {
                        return <View key={index} style={{ width: '100%', height: 0 }} />;
                    }

                    // Lookup target: baseForm -> dictForm -> surface
                    const lookupTarget = token.baseForm || token.dictForm || token.surface;

                    // Determine display content
                    // If surface has brackets, use parseFurigana
                    const parts = parseFurigana(token.surface);

                    // If no brackets but we have a reading, and it differs from surface (and strictly kana/kanji check?), 
                    // force group ruby.
                    // But simplest is: if parseFurigana returned 1 part with no reading, AND we have token.reading, use that.
                    if (parts.length === 1 && !parts[0].reading && token.reading && token.reading !== token.surface) {
                        // Force reading? 
                        // Check if surface contains Kanji
                        if (/[一-龯]/.test(token.surface)) {
                            parts[0].reading = token.reading;
                        }
                    }

                    // Now render this token as a unit
                    return (
                        <InteractiveToken
                            key={index}
                            parts={parts}
                            lookupTarget={lookupTarget}
                            onKanjiPress={onKanjiPress}
                            onPress={onPress}
                            baseStyle={{
                                fontSize: fontSize,
                                lineHeight: baseLineHeight,
                                color: theme.colors.textLight,
                                fontFamily: fontFamily,
                                includeFontPadding: false,
                                textAlignVertical: 'center',
                                ...((textStyle as any) || {})
                            }}
                            furiStyle={{
                                fontSize: furiSize,
                                lineHeight: furiSize,
                                color: theme.colors.primaryDim,
                                fontFamily: fontFamily,
                                marginBottom: 0,
                                includeFontPadding: false,
                                textAlignVertical: 'center',
                                ...((furiganaStyle as any) || {})
                            }}
                            showFurigana={showFurigana}
                            accentColor={theme.colors.accent}
                        />
                    );
                })}
            </View>
        );
    }

    // RENDER STRATEGY 2: Legacy String-based
    const displayText = reading || text;
    const parts = parseFurigana(displayText);
    const renderItems: FuriganaPart[] = [];
    parts.forEach(part => {
        if (part.reading) {
            renderItems.push(part);
        } else {
            const chars = part.text.split('');
            chars.forEach(char => {
                renderItems.push({
                    text: char,
                    reading: undefined
                });
            });
        }
    });

    return (
        <View style={styles.container}>
            {renderItems.map((item, index) => {
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
                        fontFamily: fontFamily,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                    },
                    textStyle,
                ];

                const furiColor = part.reading ? theme.colors.primaryDim : 'transparent';
                const furiText = part.reading && showFurigana ? part.reading : ' ';

                return (
                    <View key={index} style={[styles.rubyUnit, { marginRight: 0 }]}>
                        <Text
                            style={[
                                styles.furigana,
                                {
                                    fontSize: furiSize,
                                    lineHeight: furiSize,
                                    color: furiColor,
                                    fontFamily: fontFamily,
                                    marginBottom: 0,
                                    includeFontPadding: false,
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

// Component for rendering a full token (possibly multiple ruby parts) as one interactive unit
const InteractiveToken: React.FC<{
    parts: FuriganaPart[];
    lookupTarget: string;
    onKanjiPress?: (target: string) => void;
    onPress?: (event: any) => void;
    baseStyle: any;
    furiStyle: any;
    showFurigana: boolean;
    accentColor: string;
}> = ({ parts, lookupTarget, onKanjiPress, onPress, baseStyle, furiStyle, showFurigana, accentColor }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handlePressIn = () => {
        setIsPressed(true);
        haptic.medium();
    };

    const handlePressOut = () => {
        setIsPressed(false);
    };

    const handlePress = () => {
        if (onKanjiPress) {
            onKanjiPress(lookupTarget);
        }
    };

    return (
        <Pressable
            onPress={onPress || handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={300}
            style={({ pressed }) => [styles.rubyUnit, { opacity: pressed ? 0.7 : 1 }]}
        >
            {/* Render all parts of this token sequentially */}
            {parts.map((part, idx) => {
                const furiText = part.reading && showFurigana ? part.reading : ' ';
                const furiColor = part.reading ? furiStyle.color : 'transparent';

                return (
                    <View key={idx} style={{ alignItems: 'center' }}>
                        <Text style={[furiStyle, { color: furiColor }]}>
                            {furiText}
                        </Text>
                        <Text style={[baseStyle, isPressed && { color: accentColor }]}>
                            {part.text}
                        </Text>
                    </View>
                );
            })}
        </Pressable>
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
        setIsPressed(true);
        haptic.medium();
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

    const handlePress = () => {
        // Treat short press as word lookup
        // We pass the full text as the "kanji" argument for now, ReaderScreen will distinguish
        onKanjiPress(text);
    };

    return (
        <Pressable
            onPress={onPress || handlePress}
            onLongPress={hasKanji ? handleLongPress : undefined}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
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

