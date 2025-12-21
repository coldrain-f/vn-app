// Animated Logo Component - VN;READER with enhanced glow and glitch effects
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

interface AnimatedLogoProps {
    size?: 'small' | 'medium' | 'large';
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 'medium' }) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    // Animated values
    const glowAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glitchAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Intense glow pulse animation (faster)
        const glowLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: false,
                }),
            ])
        );

        // More noticeable scale breathing
        const scaleLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        // Random glitch/flicker effect
        const glitchLoop = Animated.loop(
            Animated.sequence([
                Animated.delay(3000 + Math.random() * 2000),
                Animated.timing(glitchAnim, {
                    toValue: 1,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(glitchAnim, {
                    toValue: 0,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(glitchAnim, {
                    toValue: 1,
                    duration: 30,
                    useNativeDriver: true,
                }),
                Animated.timing(glitchAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ])
        );

        // Subtle opacity flicker
        const flickerLoop = Animated.loop(
            Animated.sequence([
                Animated.delay(5000),
                Animated.timing(opacityAnim, {
                    toValue: 0.7,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 50,
                    useNativeDriver: true,
                }),
            ])
        );

        glowLoop.start();
        scaleLoop.start();
        glitchLoop.start();
        flickerLoop.start();

        return () => {
            glowLoop.stop();
            scaleLoop.stop();
            glitchLoop.stop();
            flickerLoop.stop();
        };
    }, [glowAnim, scaleAnim, glitchAnim, opacityAnim]);

    // Interpolate shadow radius for glow effect
    const shadowRadius = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 20],
    });

    // Glitch horizontal offset
    const glitchOffset = glitchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 3],
    });

    const fontSize = size === 'large' ? 28 : size === 'medium' ? 18 : 14;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { scale: scaleAnim },
                        { translateX: glitchOffset },
                    ],
                    opacity: opacityAnim,
                },
            ]}
        >
            {/* Shadow/glow layer (behind) */}
            <Animated.Text
                style={[
                    styles.logo,
                    styles.glowLayer,
                    {
                        fontSize,
                        color: theme.colors.primary,
                        textShadowColor: theme.colors.primary,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: shadowRadius,
                        opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.6],
                        }),
                    },
                ]}
            >
                VN;READER
            </Animated.Text>

            {/* Main text layer */}
            <Animated.Text
                style={[
                    styles.logo,
                    {
                        fontSize,
                        color: theme.colors.primary,
                        textShadowColor: theme.colors.primary,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 12,
                    },
                ]}
            >
                VN
                <Animated.Text
                    style={{
                        color: theme.colors.accent,
                        textShadowColor: theme.colors.accent,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 15,
                    }}
                >
                    ;
                </Animated.Text>
                READER
            </Animated.Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    logo: {
        fontWeight: 'bold',
        letterSpacing: 2,
        fontFamily: 'Pretendard-Bold',
    },
    glowLayer: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
});
