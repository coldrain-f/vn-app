// Custom Modal component
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

interface CustomModalProps {
    visible: boolean;
    title: string;
    message?: string | React.ReactNode;
    type?: 'confirm' | 'alert' | 'prompt';
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
    onRetry?: () => void;
    retryText?: string;
}

export const CustomModal: React.FC<CustomModalProps> = ({
    visible,
    title,
    message,
    type = 'confirm',
    defaultValue = '',
    confirmText = '확인',
    cancelText = '취소',
    confirmColor,
    onConfirm,
    onCancel,
    onRetry,
    retryText = '재시도',
}) => {
    const [inputValue, setInputValue] = React.useState(defaultValue);
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    React.useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue, visible]);

    const handleConfirm = () => {
        if (type === 'prompt') {
            onConfirm?.(inputValue);
        } else {
            onConfirm?.();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: theme.colors.panel,
                            borderColor: theme.colors.primary,
                        },
                    ]}
                >
                    <Text style={[styles.title, { color: theme.colors.primary }]}>
                        {title}
                    </Text>

                    {message && (
                        typeof message === 'string' ? (
                            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
                                <Text style={[styles.message, { color: theme.colors.text }]}>
                                    {message}
                                </Text>
                            </ScrollView>
                        ) : (
                            <View style={{ maxHeight: 400, marginBottom: 16 }}>
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                    {message}
                                </ScrollView>
                            </View>
                        )
                    )}

                    {type === 'prompt' && (
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.colors.darker,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                },
                            ]}
                            value={inputValue}
                            onChangeText={setInputValue}
                            placeholderTextColor={theme.colors.textDim}
                            autoFocus
                        />
                    )}

                    <View style={styles.buttonContainer}>
                        {onRetry && (
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { borderColor: theme.colors.border, marginRight: 'auto' }, // Push to left
                                ]}
                                onPress={onRetry}
                            >
                                <Text style={[styles.buttonText, { color: theme.colors.textDim }]}>
                                    {retryText}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {type !== 'alert' && (
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.cancelButton,
                                    { borderColor: theme.colors.border },
                                ]}
                                onPress={onCancel}
                            >
                                <Text style={[styles.buttonText, { color: theme.colors.textDim }]}>
                                    {cancelText}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                {
                                    backgroundColor: `${confirmColor || theme.colors.primary}20`,
                                    borderColor: confirmColor || theme.colors.primary,
                                },
                            ]}
                            onPress={handleConfirm}
                        >
                            <Text style={[styles.buttonText, { color: confirmColor || theme.colors.primary }]}>
                                {confirmText}
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 8,
        borderWidth: 1,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'left',
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
        borderWidth: 1,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {},
    confirmButton: {},
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
