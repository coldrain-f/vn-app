import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

export interface ActionItem {
    id: string;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    color?: string;
    disabled?: boolean;
    autoClose?: boolean; // Default true. Set false to keep modal open (e.g., for async actions)
}

interface ActionMenuModalProps {
    visible: boolean;
    title?: string;
    actions: ActionItem[];
    onClose: () => void;
    isLoading?: boolean;
}

export const ActionMenuModal: React.FC<ActionMenuModalProps> = ({
    visible,
    title = '추가 기능',
    actions,
    onClose,
    isLoading = false,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    const handleClose = () => {
        if (!isLoading) onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View
                            style={[
                                styles.container,
                                {
                                    backgroundColor: theme.colors.panel,
                                    borderColor: theme.colors.primary,
                                },
                            ]}
                        >
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: theme.colors.text }]}>
                                    {title}
                                </Text>
                                {!isLoading && (
                                    <TouchableOpacity
                                        onPress={handleClose}
                                        style={styles.closeButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <MaterialCommunityIcons
                                            name="close"
                                            size={24}
                                            color={theme.colors.textDim}
                                        />
                                    </TouchableOpacity>
                                )}
                                {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                            </View>

                            <View style={styles.list}>
                                {actions.map((action, index) => (
                                    <TouchableOpacity
                                        key={action.id}
                                        style={[
                                            styles.actionItem,
                                            {
                                                borderBottomColor: `${theme.colors.primary}20`,
                                                borderBottomWidth: index < actions.length - 1 ? 1 : 0
                                            },
                                            (action.disabled || isLoading) && styles.disabledItem
                                        ]}
                                        onPress={() => {
                                            if (!action.disabled && !isLoading) {
                                                if (action.autoClose !== false) {
                                                    onClose();
                                                }
                                                action.onPress();
                                            }
                                        }}
                                        disabled={action.disabled || isLoading}
                                    >
                                        <View style={[
                                            styles.iconBox,
                                            { backgroundColor: `${action.color || theme.colors.primary}15` }
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={action.icon}
                                                size={20}
                                                color={(action.disabled || isLoading) ? theme.colors.textDim : (action.color || theme.colors.primary)}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.actionLabel,
                                                { color: (action.disabled || isLoading) ? theme.colors.textDim : theme.colors.text }
                                            ]}
                                        >
                                            {action.label}
                                        </Text>
                                        <MaterialCommunityIcons
                                            name="chevron-right"
                                            size={16}
                                            color={theme.colors.textDim}
                                            style={styles.chevron}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Loading Overlay */}
                            {isLoading && (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' }]}>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Pretendard-Bold',
    },
    closeButton: {
        padding: 4,
    },
    list: {
        paddingVertical: 4,
    },
    actionItem: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    disabledItem: {
        opacity: 0.5,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionLabel: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Pretendard',
        fontWeight: '500',
    },
    chevron: {
        opacity: 0.5,
    },
});
