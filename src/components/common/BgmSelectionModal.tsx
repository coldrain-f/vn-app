// BGM Selection Modal - Scrollable list of all BGM tracks
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { getTheme } from '../../theme';

// All BGM tracks with display names
export const BGM_TRACKS = [
    // Disc 1
    { key: 'promise_piano', name: 'Promise (Piano)', disc: 1 },
    { key: 'promise', name: 'Promise', disc: 1 },
    { key: 'august_13', name: 'August 13 -Explanation-', disc: 1 },
    { key: 'confrontation', name: 'Confrontation with fear', disc: 1 },
    { key: 'lab_daily', name: 'ラボの日常', disc: 1 },
    { key: 'akihabara', name: '秋葉原', disc: 1 },
    { key: 'experiment', name: 'Experiment', disc: 1 },
    { key: 'warmth', name: 'Warmth of days', disc: 1 },
    { key: 'butterfly', name: 'Butterfly effect', disc: 1 },
    { key: 'tajitaji', name: 'Tajitaji', disc: 1 },
    { key: 'adrenaline', name: 'Adrenaline', disc: 1 },
    { key: 'timeleap', name: 'Timeleap', disc: 1 },
    { key: 'science_strings', name: 'Science of the Strings', disc: 1 },
    { key: 'threat', name: '脅威', disc: 1 },
    { key: 'taiji', name: '対峙', disc: 1 },
    { key: 'gadget_lab', name: '未来ガジェット研究所', disc: 1 },
    { key: 'one_of_selection', name: 'One of selection', disc: 1 },
    { key: 'kaeri', name: 'かえり道', disc: 1 },
    { key: 'gate_of_steiner_piano', name: 'GATE OF STEINER (Piano)', disc: 1 },
    { key: 'gate_of_steiner', name: 'GATE OF STEINER', disc: 1 },
    { key: 'believe_me', name: 'Believe Me', disc: 1 },
    { key: 'suzuha', name: '鈴羽', disc: 1 },
    // Disc 2
    { key: 'christina_1', name: 'Christina I', disc: 2 },
    { key: 'd_mail', name: 'Dメール', disc: 2 },
    { key: 'christina_2', name: 'Christina II', disc: 2 },
    { key: 'disquiet', name: 'Disquiet', disc: 2 },
    { key: 'farewell', name: '別れ', disc: 2 },
    { key: 'chuuni_tango', name: '厨二病のタンゴ', disc: 2 },
    { key: 'tender', name: 'Tender affection', disc: 2 },
    { key: 'tubes', name: 'Tubes', disc: 2 },
    { key: 'dependency', name: '依存', disc: 2 },
    { key: 'cold_gaze', name: '冷めた視線', disc: 2 },
    { key: 'john_titor', name: 'ジョン・タイター', disc: 2 },
    { key: 'observer', name: '観測者', disc: 2 },
    { key: 'my_alley', name: 'My alley', disc: 2 },
    { key: 'silence_eyes', name: 'Silence eyes', disc: 2 },
    { key: 'no_joke', name: 'No joke!', disc: 2 },
    { key: 'run_away', name: 'Run away!', disc: 2 },
    { key: 'at_channel', name: '@Channel', disc: 2 },
    { key: 'otokonoko', name: '男の娘', disc: 2 },
    { key: 'okarin_suspense', name: 'オカリンのサスペンス', disc: 2 },
    { key: 'final_mission', name: '最終ミッション', disc: 2 },
    { key: 'another_heaven', name: 'AnotherHeaven ～orchestra～', disc: 2 },
    { key: 'incident', name: '事件', disc: 2 },
    { key: 'operation_g_back', name: 'Operation G-BACK', disc: 2 },
    { key: 'lab_members', name: 'Lab-members', disc: 2 },
];

interface BgmSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (trackKey: string) => void;
    currentTrack: string;
}

export const BgmSelectionModal: React.FC<BgmSelectionModalProps> = ({
    visible,
    onClose,
    onSelect,
    currentTrack,
}) => {
    const { settings } = useAppStore();
    const theme = getTheme(settings.theme);

    const disc1Tracks = BGM_TRACKS.filter(t => t.disc === 1);
    const disc2Tracks = BGM_TRACKS.filter(t => t.disc === 2);

    const renderTrackItem = (track: typeof BGM_TRACKS[0]) => {
        const isSelected = currentTrack === track.key;
        return (
            <TouchableOpacity
                key={track.key}
                style={[
                    styles.trackItem,
                    {
                        backgroundColor: isSelected ? `${theme.colors.accent}20` : 'transparent',
                        borderColor: isSelected ? theme.colors.accent : 'transparent',
                    }
                ]}
                onPress={() => {
                    onSelect(track.key);
                    onClose();
                }}
            >
                <MaterialCommunityIcons
                    name={isSelected ? "music-circle" : "music-note"}
                    size={20}
                    color={isSelected ? theme.colors.accent : theme.colors.textDim}
                />
                <Text style={[
                    styles.trackName,
                    { color: isSelected ? theme.colors.accent : theme.colors.text }
                ]}>
                    {track.name}
                </Text>
                {isSelected && (
                    <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={theme.colors.accent}
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                        <MaterialCommunityIcons name="music" size={22} color={theme.colors.accent} />
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            배경음악 선택
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textDim} />
                        </TouchableOpacity>
                    </View>

                    {/* Track List */}
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
                        {/* Disc 1 */}
                        <View style={styles.discSection}>
                            <Text style={[styles.discLabel, { color: theme.colors.primary }]}>
                                Disc 1
                            </Text>
                            {disc1Tracks.map(renderTrackItem)}
                        </View>

                        {/* Disc 2 */}
                        <View style={styles.discSection}>
                            <Text style={[styles.discLabel, { color: theme.colors.primary }]}>
                                Disc 2
                            </Text>
                            {disc2Tracks.map(renderTrackItem)}
                        </View>

                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        maxHeight: '80%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        fontFamily: 'Pretendard-Bold',
    },
    closeBtn: {
        padding: 4,
    },
    scrollView: {
        paddingHorizontal: 16,
    },
    discSection: {
        marginTop: 12,
    },
    discLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'Pretendard-Bold',
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
        borderWidth: 1,
    },
    trackName: {
        flex: 1,
        fontSize: 15,
        marginLeft: 10,
        fontFamily: 'Pretendard',
    },
});

// Helper function to get track name by key
export const getTrackName = (key: string): string => {
    const track = BGM_TRACKS.find(t => t.key === key);
    return track?.name || key;
};
