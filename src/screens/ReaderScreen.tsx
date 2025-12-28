// Reader Screen - Main reading interface with professional design
import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar,
    Pressable,
    Modal,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { readerStyles as styles } from '../styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { FuriganaText } from '../components/common/FuriganaText';
import { Toast } from '../components/common/Toast';
import { CustomModal } from '../components/common/Modal';
import { KanjiInfoModal } from '../components/common/KanjiInfoModal';
import { SentenceEditModal } from '../components/common/SentenceEditModal';
import { VolumePopup } from '../components/common/VolumePopup';
import { AnimatedLogo } from '../components/common/AnimatedLogo';
import { ActionMenuModal, ActionItem } from '../components/common/ActionMenuModal';
import { DictionaryModal } from '../components/DictionaryModal';
import { getKanjiInfo } from '../utils/kanjiData';
import { generateExplanation, generateReading, verifyReading, generateMeaning } from '../services/claudeApi';

import { KanjiInfo, Sentence } from '../types';
import { audioPlayer } from '../services/audioPlayer';
import { haptic } from '../services/haptic';

const { width, height } = Dimensions.get('window');

export const ReaderScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {
        sentences,
        currentIndex,
        bookmarks,
        settings,
        readingDict,
        nextSentence,
        prevSentence,
        toggleBookmark,
        setCurrentIndex,
        setSettings,
        updateSentence,
    } = useAppStore();

    const theme = getTheme(settings.theme);
    const currentSentence = sentences[currentIndex];

    // UI State
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [showGoToModal, setShowGoToModal] = useState(false);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [showKanjiModal, setShowKanjiModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMeasureModal, setShowMeasureModal] = useState(false); // Validating previously unused state or just adding new one
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showVolumePopup, setShowVolumePopup] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const isAiLoading = !!loadingAction;
    const [selectedKanji, setSelectedKanji] = useState('');
    const [selectedKanjiInfo, setSelectedKanjiInfo] = useState<KanjiInfo | null>(null);
    const [pendingAiResult, setPendingAiResult] = useState<{ type: 'reading' | 'memo' | 'meaning'; value: string; status?: 'match' | 'diff'; sourceAction?: 'explanation' | 'reading' | 'verify' | 'meaning' } | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showGenerateMemoConfirm, setShowGenerateMemoConfirm] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false); // Show loading modal only from memo button

    // Dictionary Modal State
    const [showDictionaryModal, setShowDictionaryModal] = useState(false);
    const [selectedWord, setSelectedWord] = useState('');

    const { dictionaryData, activeNovelId } = useAppStore(); // Get dictionary data from store

    const showToastMessage = useCallback((message: string) => {
        setToastMessage(message);
        setShowToast(true);
    }, []);

    const handleToggleFurigana = () => {
        haptic.light();
        setSettings({ showFurigana: !settings.showFurigana });
        showToastMessage(settings.showFurigana ? '후리가나 OFF' : '후리가나 ON');
    };

    const handleToggleTranslation = () => {
        haptic.light();
        setSettings({ showTranslation: !settings.showTranslation });
        showToastMessage(settings.showTranslation ? '번역 OFF' : '번역 ON');
    };

    const handleToggleBookmark = () => {
        haptic.medium();
        toggleBookmark();
        showToastMessage(bookmarks.has(currentIndex) ? '북마크 해제' : '북마크 추가');
    };

    const handleGoTo = (value?: string) => {
        setShowGoToModal(false);
        if (!value) return;

        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > sentences.length) {
            showToastMessage('올바른 번호를 입력하세요');
            return;
        }

        setCurrentIndex(num - 1);
        showToastMessage(`${num}번 문장으로 이동`);
    };

    const handleShowMemo = () => {
        if (currentSentence?.memo) {
            setShowMemoModal(true);
        } else {
            setShowGenerateMemoConfirm(true);
        }
    };

    const handleEditSave = (index: number, updates: Partial<Sentence>) => {
        updateSentence(index, updates);
        showToastMessage('수정되었습니다');
    };

    // DEBUG: Force reload data
    const { loadData } = useAppStore();
    const handleForceReload = async () => {
        haptic.medium();
        showToastMessage('데이터를 다시 불러옵니다...');
        await loadData();
        showToastMessage('데이터 로드 완료');
    };

    const handleConfirmAiResult = () => {
        if (!pendingAiResult) return;

        const { type, value } = pendingAiResult;
        if (type === 'reading') {
            updateSentence(currentIndex, { reading: value });
            showToastMessage('읽기가 적용되었습니다');
        } else if (type === 'memo') {
            updateSentence(currentIndex, { memo: value });
            showToastMessage('해설이 저장되었습니다');
            // Optionally show memo modal immediately after saving?
            // setShowMemoModal(true); // User might want to see it rendered
        } else if (type === 'meaning') {
            updateSentence(currentIndex, { meaning: value });
            showToastMessage('번역이 저장되었습니다');
        }

        setShowReviewModal(false);
        setPendingAiResult(null);
    };

    const [showKanjiSelection, setShowKanjiSelection] = useState(false);
    const [kanjiCandidates, setKanjiCandidates] = useState<string[]>([]);

    // Handle kanji touch
    // Handle kanji/word touch
    const handleKanjiPress = useCallback((text: string | string[]) => {
        if (Array.isArray(text)) {
            // Multiple kanji found (from long press) - show selection menu
            setKanjiCandidates(text);
            setShowKanjiSelection(true);
            haptic.selection();
        } else {
            // Single tap: Check dictionary first, then Kanji info
            // Check if full word exists in dictionary entry list
            // dictionaryData.entries is Record<string, Entry[]>;
            console.log(`[ReaderScreen] Tapped text: "${text}"`);
            console.log(`[ReaderScreen] DictionaryData present:`, !!dictionaryData);
            if (dictionaryData && dictionaryData.entries) {
                console.log(`[ReaderScreen] Entry exists for "${text}":`, !!dictionaryData.entries[text]);
            }

            const hasEntry = dictionaryData && dictionaryData.entries && !!dictionaryData.entries[text];
            showToastMessage(`Tap: "${text}" / Found: ${hasEntry ? 'Yes' : 'No'}`);

            if (hasEntry && dictionaryData && dictionaryData.entries) {
                const entries = dictionaryData.entries[text];
                if (entries && entries.length > 0) {
                    setSelectedWord(text);
                    setShowDictionaryModal(true);
                    haptic.selection();
                    return;
                }
            }

            /*
            // Fallback to Kanji Grid if it contains Kanji
            // We need to filter for actual Kanji range
            const kanjiChars = text.split('').filter(c => c >= '\u4E00' && c <= '\u9FFF');

            if (kanjiChars.length > 0) {
                if (kanjiChars.length === 1) {
                    const info = getKanjiInfo(kanjiChars[0]);
                    setSelectedKanji(kanjiChars[0]);
                    setSelectedKanjiInfo(info);
                    setShowKanjiModal(true);
                } else {
                    // If multiple kanji in the word but no dictionary entry, show selection for kanji
                    setKanjiCandidates(kanjiChars);
                    setShowKanjiSelection(true);
                }
                haptic.selection();
            }
            */
        }
    }, [dictionaryData]);

    const handleRetryAiAction = () => {
        if (!pendingAiResult?.sourceAction) return;

        // Close modal and clear result temporarily (or keep modal open with loading?)
        // Better to close and show toast like the original action
        setShowReviewModal(false);
        setPendingAiResult(null);

        switch (pendingAiResult.sourceAction) {
            case 'explanation':
                handleAiExplanation();
                break;
            case 'reading':
                handleAiReading();
                break;
            case 'verify':
                handleAiVerify();
                break;
            case 'meaning':
                handleAiMeaning();
                break;
        }
    };

    // AI Handlers
    const handleAiExplanation = async () => {
        if (!currentSentence) return;
        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키를 설정해주세요');
            return;
        }

        setLoadingAction('ai_explain');

        try {
            const result = await generateExplanation(
                currentSentence.expression,
                readingDict,
                apiKey,
                settings.apiModel
            );

            if (result) {
                setPendingAiResult({ type: 'memo', value: result, sourceAction: 'explanation' });
                setShowActionMenu(false);
                setShowReviewModal(true);
            } else {
                showToastMessage('해설 생성 실패');
            }
        } catch (error) {
            console.error(error);
            showToastMessage('오류가 발생했습니다');
        } finally {
            setLoadingAction(null);
            setShowLoadingModal(false); // Reset loading modal flag
        }
    };

    const handleAiReading = async () => {
        if (!currentSentence) return;
        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키를 설정해주세요');
            return;
        }

        setLoadingAction('ai_reading');

        try {
            const result = await generateReading(
                currentSentence.expression,
                {},
                apiKey,
                settings.apiModel
            );

            if (result) {
                setPendingAiResult({ type: 'reading', value: result, sourceAction: 'reading' });
                setShowActionMenu(false);
                setShowReviewModal(true);
            } else {
                showToastMessage('읽기 생성 실패');
            }
        } catch (error) {
            console.error(error);
            showToastMessage('오류가 발생했습니다');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleAiVerify = async () => {
        if (!currentSentence) return;
        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키를 설정해주세요');
            return;
        }
        if (!currentSentence.reading) {
            showToastMessage('검증할 읽기 데이터가 없습니다');
            return;
        }

        setLoadingAction('ai_verify');

        try {
            const result = await verifyReading(
                currentSentence.expression,
                currentSentence.reading,
                {},
                apiKey,
                settings.apiModel
            );

            if (result.isCorrect) {
                // Show modal even if correct, with 'match' status
                setPendingAiResult({ type: 'reading', value: currentSentence.reading || '', status: 'match', sourceAction: 'verify' });
                setShowActionMenu(false);
                setShowReviewModal(true);
            } else if (result.correctedReading) {
                setPendingAiResult({ type: 'reading', value: result.correctedReading, status: 'diff', sourceAction: 'verify' });
                setShowActionMenu(false);
                setShowReviewModal(true);
            } else {
                // Fallback: If inconclusive, treat as match or just show current reading
                setPendingAiResult({ type: 'reading', value: currentSentence.reading || '', status: 'match', sourceAction: 'verify' });
                setShowActionMenu(false);
                setShowReviewModal(true);
            }
        } catch (error) {
            console.error(error);
            showToastMessage('오류가 발생했습니다');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleAiMeaning = async () => {
        if (!currentSentence) return;
        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키를 설정해주세요');
            return;
        }

        setLoadingAction('ai_meaning');

        try {
            const result = await generateMeaning(
                currentSentence.expression,
                readingDict,
                apiKey,
                settings.apiModel
            );

            if (result) {
                setPendingAiResult({ type: 'meaning', value: result, sourceAction: 'meaning' });
                setShowActionMenu(false);
                setShowReviewModal(true);
            } else {
                showToastMessage('의미 생성 실패');
            }
        } catch (error) {
            console.error(error);
            showToastMessage('오류가 발생했습니다');
        } finally {
            setLoadingAction(null);
        }
    };

    // Handle tap on left/right side of screen
    // Navigation via tap is disabled as per user request
    const progressPercent = sentences.length > 0
        ? ((currentIndex + 1) / sentences.length) * 100
        : 0;

    const getSpeakerDisplay = () => {
        if (!currentSentence?.speaker) return '';
        const parts = currentSentence.speaker.split('|');
        return parts[0] || '';
    };

    // Generate review message with comparison
    // Generate review message with comparison
    const renderReviewContent = () => {
        if (!pendingAiResult || !currentSentence) return null;

        const { type, value, status } = pendingAiResult;

        let statusHeader = null;
        if (type === 'reading' && status) {
            const isMatch = status === 'match';
            statusHeader = (
                <View style={{ marginBottom: 12, padding: 8, backgroundColor: isMatch ? '#e8f5e9' : '#fff3e0', borderRadius: 4, borderWidth: 1, borderColor: isMatch ? '#4caf50' : '#ff9800' }}>
                    <Text style={{ color: isMatch ? '#2e7d32' : '#f57c00', fontWeight: 'bold', textAlign: 'center' }}>
                        {isMatch ? 'AI 결과와 일치합니다' : 'AI가 다른 읽기를 제안했습니다'}
                    </Text>
                </View>
            );
        }

        let currentValue = '';
        if (type === 'reading') currentValue = currentSentence.reading || '';
        else if (type === 'memo') currentValue = currentSentence.memo || '';
        else if (type === 'meaning') currentValue = currentSentence.meaning || '';

        const renderContent = (content: string) => {
            if (type === 'reading' && content) {
                return (
                    <View style={{ alignItems: 'flex-start', marginVertical: 4 }}>
                        <FuriganaText
                            text={content}
                            fontSize={20}
                            textStyle={{ color: theme.colors.text }}
                        />
                    </View>
                );
            }
            return <Text style={{ color: theme.colors.text }}>{content}</Text>;
        };

        // If no current value or it's same/empty, just show result (unless it's a verification match case)
        if ((!currentValue || currentValue.trim() === '') && !status) {
            return (
                <View>
                    {statusHeader}
                    {renderContent(value)}
                </View>
            );
        }

        // Show comparison
        return (
            <View>
                {statusHeader}
                <Text style={{ fontWeight: 'bold', color: theme.colors.textDim, marginBottom: 4 }}>[기존 내용]</Text>
                <View style={{ marginBottom: 16 }}>
                    {renderContent(currentValue || '(없음)')}
                </View>

                <Text style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>[생성 결과]</Text>
                <View>
                    {renderContent(value)}
                </View>
            </View>
        );
    };

    // Voice autoplay effect - stops previous and plays new on sentence change
    // Voice autoplay effect - stops previous and plays new on sentence change
    const isFocused = useIsFocused();

    // Stop audio when leaving screen
    React.useEffect(() => {
        if (!isFocused) {
            audioPlayer.stopVoice();
        }
    }, [isFocused]);

    React.useEffect(() => {
        let cancelled = false;

        const handleVoiceChange = async () => {
            // Always stop any currently playing voice first
            await audioPlayer.stopVoice();

            // Only play new voice if not cancelled, autoplay is enabled, and audio exists AND screen is focused
            if (!cancelled && settings.voiceAutoplay && currentSentence?.audio && isFocused) {
                await audioPlayer.playVoice(currentSentence.audio);
            }
        };

        handleVoiceChange();

        return () => {
            cancelled = true;
            // Stop voice immediately when sentence changes to prevent overlap
            audioPlayer.stopVoice();
        };
    }, [currentIndex, isFocused]); // Add isFocused dependency

    // BGM autoplay effect - plays BGM when entering ReaderScreen if enabled
    useFocusEffect(
        React.useCallback(() => {
            if (settings.bgmAutoplay && !audioPlayer.isBgmCurrentlyPlaying()) {
                audioPlayer.playBgm(settings.bgmTrack || 'gate_of_steiner');
            }
        }, [settings.bgmAutoplay, settings.bgmTrack])
    );

    // Swipe gesture handling for navigation
    const SWIPE_THRESHOLD = 50; // 최소 스와이프 거리 (px)
    const translateX = useRef(new Animated.Value(0)).current;

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            const { translationX: tx, velocityX } = event.nativeEvent;

            // 스와이프 방향 판단
            if (tx > SWIPE_THRESHOLD || velocityX > 500) {
                // 오른쪽으로 스와이프 → 이전 문장
                if (currentIndex > 0) {
                    haptic.medium();
                    prevSentence();
                }
            } else if (tx < -SWIPE_THRESHOLD || velocityX < -500) {
                // 왼쪽으로 스와이프 → 다음 문장
                if (currentIndex < sentences.length - 1) {
                    haptic.medium();
                    nextSentence();
                }
            }

            // 위치 리셋
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start();
        }
    };

    // Handle voice replay
    const handleVoiceReplay = () => {
        if (currentSentence?.audio) {
            audioPlayer.playVoice(currentSentence.audio);
        }
    };

    if (!currentSentence) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.darker }]}>
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={64} color={theme.colors.primaryDim} />
                    <Text style={[styles.emptyText, { color: theme.colors.textDim }]}>
                        문장이 없습니다
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyButton, {
                            borderColor: theme.colors.primary,
                            backgroundColor: `${theme.colors.primary}15`,
                        }]}
                        onPress={() => navigation.navigate('Manager')}
                    >
                        <MaterialCommunityIcons name="database-cog" size={18} color={theme.colors.primary} />
                        <Text style={[styles.emptyButtonText, { color: theme.colors.primary }]}>데이터 관리</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={theme.colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.background}
            />

            {/* Header / Top Bar */}
            <View style={[styles.header, { backgroundColor: theme.colors.panel }]}>
                {/* Logo - Stats Modal Trigger */}
                <TouchableOpacity style={styles.logoContainer} onPress={() => setShowStatsModal(true)}>
                    <AnimatedLogo size="medium" />
                </TouchableOpacity>

                {/* Right Actions */}
                <View style={styles.headerActions}>
                    {/* Page Counter */}
                    <TouchableOpacity
                        style={[styles.pageCounter, { marginHorizontal: 8 }]}
                        onPress={() => setShowGoToModal(true)}
                    >
                        <Text style={[styles.counterText, { color: theme.colors.primary }]}>
                            {currentIndex + 1}
                        </Text>
                        <Text style={[styles.counterDivider, { color: theme.colors.textDim }]}>/</Text>
                        <Text style={[styles.counterTotal, { color: theme.colors.textDim }]}>
                            {sentences.length}
                        </Text>
                        <View style={[styles.progressBadge, { backgroundColor: `${theme.colors.primary}30` }]}>
                            <Text style={[styles.progressBadgeText, { color: theme.colors.primary }]}>
                                {sentences.length > 0 ? Math.round(((currentIndex + 1) / sentences.length) * 100) : 0}%
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Options Button */}
                    <TouchableOpacity
                        style={[styles.dataButton, { backgroundColor: `${theme.colors.primary}20` }]}
                        onPress={() => navigation.navigate('Manager', { initialTab: 'settings' })}
                        onLongPress={handleForceReload}
                        delayLongPress={1000}
                    >
                        <MaterialCommunityIcons name="cog" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                <View
                    style={[
                        styles.progressBar,
                        {
                            width: `${progressPercent}%`,
                            backgroundColor: theme.colors.primary,
                        }
                    ]}
                />
            </View>

            {/* Main Content Area - Swipeable */}
            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
                activeOffsetX={[-20, 20]}
            >
                <Animated.View
                    style={[
                        styles.mainContent,
                        { transform: [{ translateX: Animated.multiply(translateX, 0.3) }] }
                    ]}
                >
                    {/* Text Box Area */}
                    <View style={[styles.textBox, {
                        backgroundColor: `${theme.colors.panel}E6`, // 90% opacity
                        borderColor: theme.colors.primary,
                    }]}>
                        {/* Speaker Box (Absolute) */}
                        {currentSentence.speaker && (
                            <View style={[styles.speakerBox, {
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.colors.background,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6
                            }]}>
                                <Text style={[styles.speakerText, { color: theme.colors.primary }]}>
                                    {getSpeakerDisplay()}
                                </Text>
                                {/* Voice Replay Button */}
                                {currentSentence.audio && (
                                    <TouchableOpacity
                                        onPress={handleVoiceReplay}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <MaterialCommunityIcons
                                            name="volume-high"
                                            size={14}
                                            color={theme.colors.primary}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* AI Button Box (Absolute) */}
                        <View style={[styles.aiButtonBox, {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.background,
                        }]}>
                            <TouchableOpacity
                                onPress={() => setShowActionMenu(true)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons
                                    name="robot-outline"
                                    size={20}
                                    color={theme.colors.primary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Decorative Corner */}
                        <View style={[styles.cornerTL, { borderColor: theme.colors.primary }]} />
                        <View style={[styles.cornerTR, { borderColor: theme.colors.primary }]} />
                        <View style={[styles.cornerBL, { borderColor: theme.colors.primary }]} />
                        <View style={[styles.cornerBR, { borderColor: theme.colors.primary }]} />

                        <ScrollView
                            style={styles.textContent}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.textContentInner}
                        >
                            {/* Japanese Text with Furigana */}
                            <View style={styles.japaneseContainer}>
                                <FuriganaText
                                    text={currentSentence.expression}
                                    reading={currentSentence.reading || currentSentence.expression}
                                    showFurigana={settings.showFurigana}
                                    textStyle={[styles.japaneseText, { color: theme.colors.textLight }]}
                                    furiganaStyle={{ color: theme.colors.primaryDim }}
                                    onKanjiPress={handleKanjiPress}
                                    tokens={currentSentence.tokens}
                                />
                            </View>

                            {/* Translation */}
                            {(settings.showTranslation && currentSentence.meaning) ? (
                                <View style={[styles.translationContainer, {
                                    borderTopColor: `${theme.colors.primary}30`,
                                    backgroundColor: `${theme.colors.dark}50`,
                                }]}>
                                    <Text style={[styles.translationText, { color: theme.colors.textDim }]}>
                                        {currentSentence.meaning}
                                    </Text>
                                </View>
                            ) : null}
                        </ScrollView>
                    </View>
                </Animated.View>
            </PanGestureHandler>

            {/* Control Panel */}
            <View style={[styles.controlPanel, {
                backgroundColor: theme.colors.panel,
                borderTopColor: `${theme.colors.primary}20`,
            }]}>
                {/* Left Arrow - Larger */}
                <TouchableOpacity
                    style={[styles.navArrow, currentIndex === 0 && styles.navArrowDisabled]}
                    onPress={() => { haptic.medium(); prevSentence(); }}
                    disabled={currentIndex === 0}
                >
                    <MaterialCommunityIcons
                        name="chevron-left"
                        size={32}
                        color={currentIndex === 0 ? theme.colors.textDim : theme.colors.primary}
                    />
                </TouchableOpacity>

                {/* Center Button Group */}
                <View style={[styles.centerButtonGroup, { backgroundColor: `${theme.colors.darker}80` }]}>
                    <TouchableOpacity
                        style={[
                            styles.ctrlBtn,
                            settings.showFurigana && { backgroundColor: `${theme.colors.primary}30` }
                        ]}
                        onPress={handleToggleFurigana}
                    >
                        <MaterialCommunityIcons
                            name="format-annotation-plus"
                            size={20}
                            color={settings.showFurigana ? theme.colors.primary : theme.colors.textDim}
                        />
                        <Text style={[styles.ctrlBtnLabel, { color: settings.showFurigana ? theme.colors.primary : theme.colors.textDim }]}>
                            후리가나
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.ctrlBtn,
                            settings.showTranslation && { backgroundColor: `${theme.colors.primary}30` }
                        ]}
                        onPress={handleToggleTranslation}
                    >
                        <MaterialCommunityIcons
                            name="translate"
                            size={20}
                            color={settings.showTranslation ? theme.colors.primary : theme.colors.textDim}
                        />
                        <Text style={[styles.ctrlBtnLabel, { color: settings.showTranslation ? theme.colors.primary : theme.colors.textDim }]}>
                            번역
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.ctrlBtn,
                            bookmarks.has(currentIndex) && { backgroundColor: `${theme.colors.accent}30` }
                        ]}
                        onPress={handleToggleBookmark}
                    >
                        <MaterialCommunityIcons
                            name={bookmarks.has(currentIndex) ? "star" : "star-outline"}
                            size={20}
                            color={bookmarks.has(currentIndex) ? theme.colors.accent : theme.colors.textDim}
                        />
                        <Text style={[styles.ctrlBtnLabel, { color: bookmarks.has(currentIndex) ? theme.colors.accent : theme.colors.textDim }]}>
                            북마크
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.ctrlBtn,
                            currentSentence.memo && { backgroundColor: `${theme.colors.info}20` }
                        ]}
                        onPress={handleShowMemo}
                    >
                        <MaterialCommunityIcons
                            name="file-document-outline"
                            size={20}
                            color={currentSentence.memo ? theme.colors.info : theme.colors.textDim}
                        />
                        <Text style={[styles.ctrlBtnLabel, { color: currentSentence.memo ? theme.colors.info : theme.colors.textDim }]}>
                            해설
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.ctrlBtn}
                        onPress={() => setShowEditModal(true)}
                    >
                        <MaterialCommunityIcons
                            name="pencil-outline"
                            size={20}
                            color={theme.colors.accent}
                        />
                        <Text style={[styles.ctrlBtnLabel, { color: theme.colors.accent }]}>
                            편집
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Right Arrow - Larger */}
                <TouchableOpacity
                    style={[styles.navArrow, currentIndex >= sentences.length - 1 && styles.navArrowDisabled]}
                    onPress={() => { haptic.medium(); nextSentence(); }}
                    disabled={currentIndex >= sentences.length - 1}
                >
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={32}
                        color={currentIndex >= sentences.length - 1 ? theme.colors.textDim : theme.colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <DictionaryModal
                visible={showDictionaryModal}
                onClose={() => setShowDictionaryModal(false)}
                word={selectedWord}
                dictionaryData={dictionaryData}
                activeNovelId={activeNovelId}
            />
            <CustomModal
                visible={showGoToModal}
                title="이동"
                message={`이동할 문장 번호 (1-${sentences.length})`}
                type="prompt"
                defaultValue={String(currentIndex + 1)}
                confirmText="이동"
                onConfirm={handleGoTo}
                onCancel={() => setShowGoToModal(false)}
            />

            <CustomModal
                visible={showMemoModal}
                title="AI 해설"
                message={currentSentence?.memo || ''}
                type="alert"
                confirmText="닫기"
                onConfirm={() => setShowMemoModal(false)}
                onCancel={() => setShowMemoModal(false)}
                onRetry={() => {
                    setShowMemoModal(false);
                    setShowLoadingModal(true);
                    handleAiExplanation();
                }}
                retryText="재생성"
            />

            {/* Generate Memo Confirmation Modal */}
            <CustomModal
                visible={showGenerateMemoConfirm}
                title="해설 없음"
                message="이 문장에 해설이 없습니다. AI로 해설을 생성하시겠습니까?"
                type="confirm"
                confirmText="생성"
                cancelText="취소"
                onConfirm={() => {
                    setShowGenerateMemoConfirm(false);
                    setShowLoadingModal(true); // Enable loading modal for this trigger
                    handleAiExplanation();
                }}
                onCancel={() => setShowGenerateMemoConfirm(false)}
            />

            <CustomModal
                visible={showReviewModal}
                title="AI 결과"
                message={renderReviewContent()}
                confirmText="적용"
                onConfirm={handleConfirmAiResult}
                cancelText="취소"
                onCancel={() => {
                    setShowReviewModal(false);
                    setPendingAiResult(null);
                }}
                onRetry={handleRetryAiAction}
                retryText={
                    pendingAiResult?.sourceAction === 'explanation' ? '해설 재생성' :
                        pendingAiResult?.sourceAction === 'reading' ? '읽기 재생성' :
                            pendingAiResult?.sourceAction === 'verify' ? '검증 재시도' :
                                pendingAiResult?.sourceAction === 'meaning' ? '의미 재생성' : '재시도'
                }
            />

            {/* Action Menu Modal */}
            <ActionMenuModal
                visible={showActionMenu}
                title="메뉴"
                isLoading={isAiLoading}
                onClose={() => setShowActionMenu(false)}
                actions={[
                    {
                        id: 'ai_explain',
                        label: loadingAction === 'ai_explain' ? '생성 중...' : 'AI 해설 생성',
                        icon: 'robot',
                        color: theme.colors.info,
                        autoClose: false,
                        onPress: handleAiExplanation,
                    },
                    {
                        id: 'ai_meaning',
                        label: loadingAction === 'ai_meaning' ? '생성 중...' : 'AI 의미 생성',
                        icon: 'translate',
                        color: theme.colors.accent,
                        autoClose: false,
                        onPress: handleAiMeaning,
                    },
                    {
                        id: 'ai_reading',
                        label: 'AI 읽기 생성 (비활성)',
                        icon: 'syllabary-hiragana',
                        color: '#4caf50',
                        autoClose: false,
                        disabled: true,
                        onPress: handleAiReading,
                    },
                    {
                        id: 'ai_verify',
                        label: 'AI 읽기 검증 (비활성)',
                        icon: 'check-circle-outline',
                        color: '#ff9800',
                        autoClose: false,
                        disabled: true,
                        onPress: handleAiVerify,
                    },
                ]}
            />

            {/* Kanji Info Modal */}
            <KanjiInfoModal
                visible={showKanjiModal}
                kanji={selectedKanji}
                info={selectedKanjiInfo}
                onClose={() => setShowKanjiModal(false)}
            />

            {/* Sentence Edit Modal */}
            <SentenceEditModal
                visible={showEditModal}
                sentence={currentSentence}
                sentenceIndex={currentIndex}
                onClose={() => setShowEditModal(false)}
                onSave={handleEditSave}
            />



            {/* Kanji Selection Menu */}
            <ActionMenuModal
                visible={showKanjiSelection}
                title="한자 선택"
                onClose={() => setShowKanjiSelection(false)}
                actions={kanjiCandidates.map((char, index) => ({
                    id: `kanji_${index}`,
                    label: char,
                    icon: 'ideogram-cjk-variant',
                    onPress: () => {
                        handleKanjiPress(char);
                        setShowKanjiSelection(false);
                    }
                }))}
            />

            {/* Stats Modal */}
            <Modal
                transparent
                visible={showStatsModal}
                animationType="fade"
                onRequestClose={() => setShowStatsModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setShowStatsModal(false)}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View style={{
                            backgroundColor: theme.colors.panel,
                            borderRadius: 20,
                            minWidth: 300,
                            maxWidth: 340,
                            borderWidth: 1,
                            borderColor: theme.colors.primary,
                            overflow: 'hidden',
                        }}>
                            {/* Header with X button */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: `${theme.colors.primary}30`,
                                backgroundColor: `${theme.colors.primary}10`,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="chart-bar" size={22} color={theme.colors.primary} />
                                    <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 8, fontFamily: 'Pretendard' }}>
                                        VN;READER 통계
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowStatsModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <MaterialCommunityIcons name="close" size={22} color={theme.colors.textDim} />
                                </TouchableOpacity>
                            </View>

                            {/* Progress Card */}
                            <View style={{ padding: 16, paddingBottom: 12 }}>
                                <View style={{
                                    backgroundColor: theme.colors.dark,
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 16,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="book-open-page-variant" size={20} color={theme.colors.primary} />
                                            <Text style={{ color: theme.colors.text, marginLeft: 8, fontFamily: 'Pretendard', fontWeight: '600' }}>진행률</Text>
                                        </View>
                                        <Text style={{ color: theme.colors.primary, fontSize: 24, fontWeight: 'bold', fontFamily: 'Pretendard' }}>
                                            {sentences.length > 0 ? ((currentIndex + 1) / sentences.length * 100).toFixed(1) : 0}%
                                        </Text>
                                    </View>

                                    {/* Progress Bar */}
                                    <View style={{ height: 8, backgroundColor: `${theme.colors.primary}20`, borderRadius: 4, overflow: 'hidden' }}>
                                        <View style={{
                                            height: '100%',
                                            width: `${sentences.length > 0 ? ((currentIndex + 1) / sentences.length * 100) : 0}%`,
                                            backgroundColor: theme.colors.primary,
                                            borderRadius: 4,
                                        }} />
                                    </View>

                                    <Text style={{ color: theme.colors.textDim, fontSize: 12, marginTop: 8, textAlign: 'center', fontFamily: 'Pretendard' }}>
                                        {(currentIndex + 1).toLocaleString()} / {sentences.length.toLocaleString()} 문장
                                    </Text>
                                </View>

                                {/* Stats Grid */}
                                <View style={{ gap: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: `${theme.colors.border}50` }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="file-document-multiple" size={18} color={theme.colors.textDim} />
                                            <Text style={{ color: theme.colors.text, marginLeft: 10, fontFamily: 'Pretendard' }}>총 문장</Text>
                                        </View>
                                        <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 16, fontFamily: 'Pretendard' }}>
                                            {sentences.length.toLocaleString()}개
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: `${theme.colors.border}50` }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="star" size={18} color={theme.colors.accent} />
                                            <Text style={{ color: theme.colors.text, marginLeft: 10, fontFamily: 'Pretendard' }}>북마크</Text>
                                        </View>
                                        <Text style={{ color: theme.colors.accent, fontWeight: 'bold', fontSize: 16, fontFamily: 'Pretendard' }}>
                                            {bookmarks.size.toLocaleString()}개
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="book-alphabet" size={18} color="#ff9800" />
                                            <Text style={{ color: theme.colors.text, marginLeft: 10, fontFamily: 'Pretendard' }}>사전 항목</Text>
                                        </View>
                                        <Text style={{ color: '#ff9800', fontWeight: 'bold', fontSize: 16, fontFamily: 'Pretendard' }}>
                                            {Object.keys(readingDict).length}개
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Footer Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                }}
                                onPress={() => setShowStatsModal(false)}
                            >
                                <Text style={{ color: theme.colors.darker, fontWeight: 'bold', fontSize: 15, fontFamily: 'Pretendard' }}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </TouchableOpacity>
            </Modal>

            {/* AI Loading Modal - Only shown when triggered from memo button */}
            {showLoadingModal && isAiLoading ? (
                <Modal transparent visible={true} animationType="none">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.colors.panel,
                            borderRadius: 20,
                            padding: 32,
                            minWidth: 280,
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: theme.colors.primary,
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }}>
                            {/* Title */}
                            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', fontFamily: 'Pretendard', textAlign: 'center' }}>
                                {loadingAction === 'ai_explain' ? 'AI 해설 생성' :
                                    loadingAction === 'ai_reading' ? 'AI 읽기 생성' :
                                        loadingAction === 'ai_verify' ? 'AI 읽기 검증' :
                                            loadingAction === 'ai_meaning' ? 'AI 의미 생성' : 'AI 처리'}
                            </Text>

                            {/* Spinner */}
                            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20, marginBottom: 12 }} />

                            {/* Subtitle */}
                            <Text style={{ color: theme.colors.textDim, fontSize: 13, fontFamily: 'Pretendard' }}>
                                잠시만 기다려 주세요...
                            </Text>
                        </View>
                    </View>
                </Modal>
            ) : null}

            {/* Toast */}
            <Toast
                message={toastMessage}
                visible={showToast}
                onHide={() => setShowToast(false)}
            />
        </SafeAreaView >
    );
};
