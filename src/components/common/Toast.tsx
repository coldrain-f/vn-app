// Toast component for notifications
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Modal, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

interface ToastProps {
    message: string;
    visible: boolean;
    onHide: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    visible,
    onHide,
    duration = 2000
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 50,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={true}
            animationType="none"
            onRequestClose={onHide}
        >
            <View style={styles.modalContainer} pointerEvents="box-none">
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: theme.colors.panel,
                            borderColor: theme.colors.primary,
                            opacity: fadeAnim,
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    <Text style={[styles.text, { color: theme.colors.primary }]}>
                        {message}
                    </Text>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        // backgroundColor: 'transparent', // default
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    container: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        // zIndex is handled by Modal
    },
    text: {
        fontSize: 14,
        fontWeight: '500',
    },
});
