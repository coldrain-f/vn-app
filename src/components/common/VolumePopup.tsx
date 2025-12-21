// Volume Popup Component - Dropdown for BGM volume control
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

interface VolumePopupProps {
    visible: boolean;
    volume: number;
    onVolumeChange: (value: number) => void;
    onClose: () => void;
}

export const VolumePopup: React.FC<VolumePopupProps> = ({
    visible,
    volume,
    onVolumeChange,
    onClose,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    const adjustVolume = (delta: number) => {
        const newVolume = Math.max(0, Math.min(100, volume + delta));
        onVolumeChange(newVolume);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.popup,
                        {
                            backgroundColor: theme.colors.panel,
                            borderColor: theme.colors.primary,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <MaterialCommunityIcons
                            name="music"
                            size={18}
                            color={theme.colors.primary}
                        />
                        <Text style={[styles.title, { color: theme.colors.textLight }]}>
                            BGM 볼륨
                        </Text>
                    </View>

                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={[styles.volumeBtn, { borderColor: theme.colors.border }]}
                            onPress={() => adjustVolume(-10)}
                        >
                            <MaterialCommunityIcons name="minus" size={20} color={theme.colors.textDim} />
                        </TouchableOpacity>

                        <View style={[styles.volumeDisplay, { backgroundColor: theme.colors.darker }]}>
                            <Text style={[styles.volumeValue, { color: theme.colors.primary }]}>
                                {Math.round(volume)}%
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.volumeBtn, { borderColor: theme.colors.border }]}
                            onPress={() => adjustVolume(10)}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.textDim} />
                        </TouchableOpacity>
                    </View>

                    {/* Quick presets */}
                    <View style={styles.presets}>
                        {[0, 25, 50, 75, 100].map((preset) => (
                            <TouchableOpacity
                                key={preset}
                                style={[
                                    styles.presetBtn,
                                    {
                                        backgroundColor: volume === preset ? theme.colors.primary : 'transparent',
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                onPress={() => onVolumeChange(preset)}
                            >
                                <Text
                                    style={{
                                        color: volume === preset ? theme.colors.darker : theme.colors.textDim,
                                        fontSize: 12,
                                    }}
                                >
                                    {preset}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 80,
    },
    popup: {
        width: 260,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Pretendard',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    volumeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    volumeDisplay: {
        width: 80,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    volumeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Pretendard-Bold',
    },
    presets: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    presetBtn: {
        width: 40,
        height: 32,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
