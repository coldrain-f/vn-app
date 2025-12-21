// ReaderScreen Styles
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const readerStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    emptyButtonText: {
        marginLeft: 8,
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Pretendard',
    },
    header: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10, // Ensure header stays on top
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
        fontFamily: 'Pretendard-Bold',
    },

    pageCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    progressBadge: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    progressBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'Pretendard-Bold',
    },

    counterText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Pretendard',
    },
    counterDivider: {
        fontSize: 14,
        marginHorizontal: 2,
        fontFamily: 'Pretendard',
    },
    counterTotal: {
        fontSize: 13,
        fontFamily: 'Pretendard',
    },
    progressText: {
        fontSize: 11,
        marginLeft: 4,
        fontFamily: 'Pretendard',
    },
    dataButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    progressContainer: {
        height: 5,
    },
    progressBar: {
        height: 5,
    },
    mainContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-end',
    },
    navHints: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    navHintLeft: {
        padding: 8,
    },
    navHintRight: {
        padding: 8,
    },
    textBox: {
        minHeight: 180,
        maxHeight: height * 0.55,
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        // Native shadow (iOS/Android)
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8, // Android
    },
    speakerBox: {
        position: 'absolute',
        top: -14,
        left: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderWidth: 1,
        borderRadius: 6,
        zIndex: 10,
    },
    aiButtonBox: {
        position: 'absolute',
        top: -14,
        right: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderRadius: 6,
        zIndex: 10,
    },
    speakerText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        fontFamily: 'Pretendard',
    },
    cornerTL: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 14,
        height: 14,
        borderLeftWidth: 2,
        borderTopWidth: 2,
    },
    cornerTR: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 14,
        height: 14,
        borderRightWidth: 2,
        borderTopWidth: 2,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        width: 14,
        height: 14,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 14,
        height: 14,
        borderRightWidth: 2,
        borderBottomWidth: 2,
    },
    textContent: {
        marginTop: 12,
    },
    textContentInner: {
        paddingBottom: 8,
    },
    japaneseContainer: {
        marginBottom: 12,
    },
    japaneseText: {
        fontSize: 26,
        lineHeight: 42,
        fontFamily: 'YuMincho',
    },
    translationContainer: {
        paddingTop: 14,
        paddingHorizontal: 12,
        paddingBottom: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderRadius: 6,
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'Pretendard',
    },
    controlPanel: {
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderTopWidth: 1,
    },
    navArrow: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    navArrowDisabled: {
        opacity: 0.3,
        backgroundColor: 'transparent',
    },
    centerButtonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ctrlBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        minWidth: 44,
        borderRadius: 8,
    },
    ctrlBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    ctrlBtnDisabled: {
        opacity: 0.4,
    },
    ctrlBtnLabel: {
        fontSize: 10,
        marginTop: 3,
        letterSpacing: -0.3,
        fontFamily: 'Pretendard',
    },
    // New Styles for Redesign
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerProgress: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Pretendard',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    characterContainer: {
        flex: 1,
    },
    textBoxContainer: {
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        position: 'relative',
        minHeight: 180,
        maxHeight: height * 0.55,
        // Shadows
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 20, // Ensure it stacks correctly
        overflow: 'visible', // Important for negative margins on child elements
    },
    speakerNameContainer: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 8,
        borderRadius: 4,
    },
    speakerName: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Pretendard',
    },
});
