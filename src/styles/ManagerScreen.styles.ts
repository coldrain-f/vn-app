// ManagerScreen Styles
import { StyleSheet } from 'react-native';

export const managerStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        fontFamily: 'Pretendard',
    },
    headerSpacer: {
        width: 70,
    },
    tabBar: {
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 4,
        fontFamily: 'Pretendard',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        marginLeft: 8,
        fontFamily: 'Pretendard',
    },
    selectionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    selectionActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 8,
    },
    listItem: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    listItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    listItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItemIndex: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Pretendard',
    },
    listItemSpeaker: {
        fontSize: 12,
        fontFamily: 'Pretendard',
    },
    listItemText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'YuMincho',
    },
    listItemMeaning: {
        fontSize: 13,
        marginTop: 6,
        fontFamily: 'Pretendard',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    paginationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    settingsSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        fontFamily: 'Pretendard',
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        fontFamily: 'Pretendard',
    },
    formInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'Pretendard',
    },
    formTextarea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    aiButton: {
        flexDirection: 'row',
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        fontFamily: 'Pretendard',
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    themeOption: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    backupButtons: {},
    backupButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsCard: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 32,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    // Toggle styles for Voice Settings
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 10,
    },
    toggleSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
});
