// Data Manager Screen - Redesigned with vector icons
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    ScrollView,
    Alert,
    Modal,
} from 'react-native';
import { managerStyles as styles } from '../styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { Toast } from '../components/common/Toast';
import { CustomModal } from '../components/common/Modal';
import { TabName, ThemeName } from '../types';
import { generateReading, generateMeaning, generateExplanation, verifyReading } from '../services/claudeApi';
import { audioPlayer } from '../services/audioPlayer';
import { haptic } from '../services/haptic';
import { SentenceEditModal } from '../components/common/SentenceEditModal';
import { ActionMenuModal, ActionItem } from '../components/common/ActionMenuModal';
import { FuriganaText } from '../components/common/FuriganaText';
import { ActivityIndicator, Dimensions } from 'react-native';
import { voiceDownloadManager, DownloadProgress } from '../services/voiceDownloadManager';
import { BgmSelectionModal, getTrackName } from '../components/common/BgmSelectionModal';

const ITEMS_PER_PAGE = 10;

export const ManagerScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const {
        sentences,
        bookmarks,
        settings,
        readingDict,
        currentIndex,
        addSentence,
        deleteSentence,
        setSettings,
        setCurrentIndex,
        selectedListItems,
        selectedBookmarkItems,
        toggleSelection,
        clearSelection,
        deleteSentences,
        exportBackup,
        importBackup,
        addToReadingDict,
        removeFromReadingDict,
        removeMultipleFromReadingDict,
        selectedDictWords,
        toggleDictSelection,
        clearDictSelection,
        updateSentence,
        selectAll,
        toggleBookmark,
    } = useAppStore();

    const theme = getTheme(settings.theme);

    // Refs
    const listRef = useRef<FlatList>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<TabName>('list');

    const selectedSentences = useMemo(() => {
        return activeTab === 'bookmarks' ? selectedBookmarkItems : selectedListItems;
    }, [activeTab, selectedBookmarkItems, selectedListItems]);

    const selectionScope = activeTab === 'bookmarks' ? 'bookmarks' : 'list';

    // Handle initial tab param
    React.useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params]);

    // Stop voice playback when entering this screen
    React.useEffect(() => {
        audioPlayer.stopVoice();
    }, []);

    // Handle BGM based on autoplay setting
    React.useEffect(() => {
        if (settings.bgmAutoplay) {
            // Stop any existing BGM first to prevent overlap
            audioPlayer.stopBgm().then(() => {
                audioPlayer.playBgm(settings.bgmTrack || 'gate_of_steiner');
            });
        } else {
            // Stop BGM when autoplay is turned off
            audioPlayer.stopBgm();
        }
    }, [settings.bgmAutoplay, settings.bgmTrack]);

    // Initialize voice download manager
    React.useEffect(() => {
        // Set voice file list from sentences
        const voiceFiles = sentences
            .filter(s => s.audio && s.audio.trim() !== '')
            .map(s => s.audio);
        voiceDownloadManager.setVoiceFileList(voiceFiles);
        setTotalVoiceCount(voiceDownloadManager.getTotalFileCount());

        // Load cache stats
        const loadCacheStats = async () => {
            const count = await voiceDownloadManager.getDownloadedCount();
            const size = await voiceDownloadManager.getCacheSize();
            setDownloadedCount(count);
            setCacheSize(size);
        };
        loadCacheStats();
    }, [sentences]);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Custom Modal States
    const [navConfirm, setNavConfirm] = useState<{ visible: boolean, index: number | null }>({ visible: false, index: null });
    const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
    const [batchAiConfirm, setBatchAiConfirm] = useState<{ visible: boolean, type: 'reading' | 'meaning' | 'memo' | 'verification' | null }>({ visible: false, type: null });
    const [showPageModal, setShowPageModal] = useState(false);
    const [targetPageInput, setTargetPageInput] = useState('');
    // Refs
    const isBatchCancelled = React.useRef(false);
    const isAutoApply = React.useRef(false);
    const batchQueue = React.useRef<number[]>([]);

    // Batch Results State
    const [batchResults, setBatchResults] = useState<Array<{
        index: number;
        original: any;
        result: any;
        type: 'reading' | 'meaning' | 'memo' | 'verification';
        selected: boolean;
    }>>([]);
    const [showBatchResultModal, setShowBatchResultModal] = useState(false);
    const tempBatchResults = React.useRef<any[]>([]);
    const [isApplying, setIsApplying] = useState(false);
    const activeBatchType = React.useRef<'reading' | 'meaning' | 'memo' | 'verification' | null>(null);

    // Add form state
    const [addForm, setAddForm] = useState({
        speaker: '',
        expression: '',
        reading: '',
        meaning: '',
        audio: '',
        memo: '',
    });

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTargetIndex, setEditTargetIndex] = useState<number | null>(null);

    // Batch Progress State
    const [batchProgress, setBatchProgress] = useState<{
        visible: boolean;
        current: number;
        total: number;
        type: 'reading' | 'meaning' | 'memo' | 'delete' | 'verification';
    }>({
        visible: false,
        current: 0,
        total: 0,
        type: 'reading',
    });

    // Dict form state
    const [dictForm, setDictForm] = useState({ word: '', reading: '' });
    const [dictSearchQuery, setDictSearchQuery] = useState('');
    const [dictPage, setDictPage] = useState(0);
    const [editingDictItem, setEditingDictItem] = useState<{ word: string; reading: string } | null>(null);
    const [editDictForm, setEditDictForm] = useState({ word: '', reading: '' });

    // Action Menu State
    const [showActionMenu, setShowActionMenu] = useState(false);

    // Voice Download State
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const [downloadedCount, setDownloadedCount] = useState(-1);  // -1 = loading
    const [totalVoiceCount, setTotalVoiceCount] = useState(0);
    const [cacheSize, setCacheSize] = useState(0);

    // BGM Selection Modal State
    const [showBgmModal, setShowBgmModal] = useState(false);

    const showToastMessage = useCallback((message: string) => {
        setToastMessage(message);
        setShowToast(true);
    }, []);

    // Filtered data
    const filteredSentences = useMemo(() => {
        if (!searchQuery.trim()) return sentences;
        const query = searchQuery.toLowerCase();
        return sentences.filter((s, i) =>
            s.expression.toLowerCase().includes(query) ||
            s.meaning?.toLowerCase().includes(query) ||
            s.speaker?.toLowerCase().includes(query) ||
            String(i + 1).includes(query)
        );
    }, [sentences, searchQuery]);

    const filteredBookmarks = useMemo(() => {
        const bookmarkedSentences = sentences
            .map((s, i) => ({ ...s, originalIndex: i }))
            .filter((_, i) => bookmarks.has(i));

        if (!searchQuery.trim()) return bookmarkedSentences;
        const query = searchQuery.toLowerCase();
        return bookmarkedSentences.filter(s =>
            s.expression.toLowerCase().includes(query) ||
            s.meaning?.toLowerCase().includes(query)
        );
    }, [sentences, bookmarks, searchQuery]);

    // Pagination
    const paginatedData = useMemo(() => {
        const data = activeTab === 'bookmarks' ? filteredBookmarks : filteredSentences;
        const start = currentPage * ITEMS_PER_PAGE;
        return data.slice(start, start + ITEMS_PER_PAGE);
    }, [activeTab, filteredSentences, filteredBookmarks, currentPage]);

    const totalPages = useMemo(() => {
        const total = activeTab === 'bookmarks' ? filteredBookmarks.length : filteredSentences.length;
        return Math.ceil(total / ITEMS_PER_PAGE);
    }, [activeTab, filteredSentences, filteredBookmarks]);

    // Handlers
    const handleGoToSentence = (index: number) => {
        setNavConfirm({ visible: true, index });
    };

    const confirmNavigation = () => {
        if (navConfirm.index !== null) {
            setCurrentIndex(navConfirm.index);
            navigation.navigate('Reader');
        }
        setNavConfirm({ visible: false, index: null });
    };

    const confirmDelete = () => {
        if (deleteTargetIndex !== null) {
            deleteSentence(deleteTargetIndex);
            showToastMessage('삭제되었습니다');
        }
        setShowDeleteModal(false);
        setDeleteTargetIndex(null);
    };

    const handleBatchDelete = () => {
        if (selectedSentences.size === 0) return;
        setBatchDeleteConfirm(true);
    };

    const confirmBatchDelete = () => {
        deleteSentences([...selectedSentences]);
        clearSelection(selectionScope);
        showToastMessage(`${selectedSentences.size}개 삭제됨`);
        setBatchDeleteConfirm(false);
    };

    const handleAddSentence = () => {
        if (!addForm.expression.trim()) {
            showToastMessage('일본어 문장을 입력하세요');
            return;
        }

        addSentence({
            order: sentences.length + 1,
            speaker: addForm.speaker,
            expression: addForm.expression,
            reading: addForm.reading,
            meaning: addForm.meaning,
            audio: addForm.audio,
            memo: addForm.memo,
        });

        setAddForm({
            speaker: '',
            expression: '',
            reading: '',
            meaning: '',
            audio: '',
            memo: '',
        });
        showToastMessage('문장이 추가되었습니다');
    };

    // AI Generation
    const handleGenerateReading = async () => {
        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키를 설정해주세요');
            return;
        }
        if (!addForm.expression.trim()) {
            showToastMessage('일본어 문장을 먼저 입력하세요');
            return;
        }

        setIsLoading(true);
        const result = await generateReading(
            addForm.expression,
            readingDict,
            apiKey,
            settings.apiModel
        );
        setIsLoading(false);

        if (result) {
            setAddForm(prev => ({ ...prev, reading: result.trim() }));
            showToastMessage('읽기 생성 완료');
        } else {
            showToastMessage('생성 실패');
        }
    };

    const handleGenerateMeaning = async () => {
        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키를 설정해주세요');
            return;
        }
        if (!addForm.expression.trim()) {
            showToastMessage('일본어 문장을 먼저 입력하세요');
            return;
        }

        setIsLoading(true);
        const result = await generateMeaning(
            addForm.expression,
            readingDict,
            apiKey,
            settings.apiModel
        );
        setIsLoading(false);

        if (result) {
            setAddForm(prev => ({ ...prev, meaning: result.trim() }));
            showToastMessage('번역 생성 완료');
        } else {
            showToastMessage('생성 실패');
        }
    };
    const processNextBatchItem = async () => {
        if (isBatchCancelled.current || batchQueue.current.length === 0) {
            setBatchProgress(prev => ({ ...prev, visible: false }));

            if (tempBatchResults.current.length > 0) {
                setBatchResults(tempBatchResults.current);
                setShowBatchResultModal(true);
            } else {
                showToastMessage('작업이 완료되었습니다 (결과 없음)');
                clearSelection(selectionScope);
            }
            return;
        }

        const index = batchQueue.current[0];
        setBatchProgress(prev => ({ ...prev, current: prev.total - batchQueue.current.length + 1 }));

        try {
            const sentence = sentences[index];
            const currentType = activeBatchType.current;

            if (!currentType) { console.error("No batch type"); return; }

            const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
            let result: any = null;

            if (currentType === 'reading') {
                result = await generateReading(sentence.expression, readingDict, apiKey!, settings.apiModel);
            } else if (currentType === 'meaning') {
                result = await generateMeaning(sentence.expression, readingDict, apiKey!, settings.apiModel);
            } else if (currentType === 'memo') {
                result = await generateExplanation(sentence.expression, readingDict, apiKey!, settings.apiModel);
            } else if (currentType === 'verification') {
                if (sentence.reading) {
                    const verifyResult = await verifyReading(sentence.expression, sentence.reading, readingDict, apiKey!, settings.apiModel);
                    if (verifyResult.correctedReading) {
                        result = verifyResult.correctedReading;
                    } else if (verifyResult.isCorrect) {
                        result = sentence.reading; // Include correct results so user knows it was verified
                    }
                }
            }

            if (result) {
                tempBatchResults.current.push({
                    index,
                    original: sentence,
                    result,
                    type: currentType,
                    selected: true
                });
            }

            batchQueue.current.shift();
            processNextBatchItem();

        } catch (error) {
            console.error(`Batch error at index ${index}:`, error);
            batchQueue.current.shift();
            processNextBatchItem();
        }
    };

    const handleApplyBatchResults = async () => {
        setIsApplying(true);
        // Small delay to render loading state
        await new Promise(resolve => setTimeout(resolve, 50));

        const toApply = batchResults.filter(r => r.selected);
        toApply.forEach(item => {
            const update: any = {};
            if (item.type === 'reading' || item.type === 'verification') update.reading = item.result;
            if (item.type === 'meaning') update.meaning = item.result;
            if (item.type === 'memo') update.memo = item.result;
            updateSentence(item.index, update);
        });

        setIsApplying(false);
        setShowBatchResultModal(false);
        setBatchResults([]);
        showToastMessage(`${toApply.length}개 항목이 적용되었습니다`);
        // clearSelection(selectionScope); // Keep selection as requested
    };

    const toggleBatchResultSelection = (resultIndex: number) => {
        setBatchResults(prev => prev.map((item, i) =>
            i === resultIndex ? { ...item, selected: !item.selected } : item
        ));
    };

    // Batch AI Handler
    const handleBatchAiAction = (type: 'reading' | 'meaning' | 'memo' | 'verification') => {
        if (selectedSentences.size === 0) return;
        setBatchAiConfirm({ visible: true, type });
    };

    const confirmBatchAi = async () => {
        const type = batchAiConfirm.type;
        if (!type) return;

        setBatchAiConfirm({ visible: false, type: null });

        const apiKey = settings.apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
        if (!apiKey) {
            showToastMessage('API 키가 필요합니다');
            return;
        }

        // Initialize Batch
        isBatchCancelled.current = false;
        activeBatchType.current = type;
        tempBatchResults.current = []; // Clear temp results
        batchQueue.current = Array.from(selectedSentences).sort((a, b) => a - b);

        setBatchProgress({
            visible: true,
            current: 0,
            total: batchQueue.current.length,
            type,
        });

        // Start
        processNextBatchItem();
    };

    // Selection Handlers
    const handleSelectAll = () => {
        const targetList = activeTab === 'bookmarks' ? filteredBookmarks : filteredSentences;
        const start = currentPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const currentItems = targetList.slice(start, end);

        const pageIndices = currentItems.map(item => {
            if (activeTab === 'bookmarks') return (item as any).originalIndex;
            return sentences.indexOf(item);
        }).filter(idx => idx !== -1);

        const allSelected = pageIndices.length > 0 && pageIndices.every(idx => selectedSentences.has(idx));

        if (allSelected) {
            // Deselect all on this page
            const newSelection = Array.from(selectedSentences).filter(idx => !pageIndices.includes(idx));
            selectAll(newSelection, selectionScope);
        } else {
            // Select all on this page
            const newSelection = new Set(selectedSentences);
            pageIndices.forEach(idx => newSelection.add(idx));
            selectAll(Array.from(newSelection), selectionScope);
        }
    };

    // Edit Handlers
    const handleOpenEdit = (index: number) => {
        setEditTargetIndex(index);
        setShowEditModal(true);
    };

    const handleSaveEdit = (index: number, updates: any) => {
        updateSentence(index, updates);
        showToastMessage('수정되었습니다');
    };
    const handleExportBackup = async () => {
        try {
            const data = await exportBackup();
            const filename = `vn-reader-backup-${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = (FileSystem as any).cacheDirectory + filename;

            await (FileSystem as any).writeAsStringAsync(fileUri, data);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
                showToastMessage('백업 파일 생성됨');
            } else {
                showToastMessage('공유 기능을 사용할 수 없습니다');
            }
        } catch (error) {
            console.error('Export error:', error);
            showToastMessage('백업 실패');
        }
    };

    const handleImportBackup = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const content = await (FileSystem as any).readAsStringAsync(file.uri);

            await importBackup(content);
            showToastMessage('복원 완료');
        } catch (error) {
            console.error('Import error:', error);
            showToastMessage('복원 실패');
        }
    };

    // Voice Download Handlers
    const handleStartDownload = async () => {
        setDownloadProgress({
            total: totalVoiceCount,
            completed: downloadedCount,
            failed: 0,
            currentFile: '',
            isDownloading: true,
            isPaused: false,
        });

        await voiceDownloadManager.startDownload((progress) => {
            setDownloadProgress(progress);
            if (!progress.isDownloading) {
                // Download finished
                setDownloadedCount(progress.completed);
                voiceDownloadManager.getCacheSize().then(setCacheSize);
                showToastMessage(`다운로드 완료: ${progress.completed}개 파일`);
            }
        });
    };

    const handlePauseDownload = () => {
        const status = voiceDownloadManager.getStatus();
        if (status.isPaused) {
            voiceDownloadManager.resume();
            // UI 즉시 갱신
            if (downloadProgress) {
                setDownloadProgress({ ...downloadProgress, isPaused: false });
            }
        } else {
            voiceDownloadManager.pause();
            // UI 즉시 갱신
            if (downloadProgress) {
                setDownloadProgress({ ...downloadProgress, isPaused: true, currentFile: '일시정지됨' });
            }
        }
    };

    const handleCancelDownload = () => {
        Alert.alert(
            '다운로드 취소',
            '진행 중인 다운로드를 취소하시겠습니까?',
            [
                { text: '계속', style: 'cancel' },
                {
                    text: '취소',
                    style: 'destructive',
                    onPress: () => {
                        voiceDownloadManager.cancel();
                        setDownloadProgress(null);
                    }
                }
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            '캐시 삭제',
            `다운로드된 음성 파일 ${downloadedCount}개를 모두 삭제하시겠습니까?\n(${(cacheSize / 1024 / 1024).toFixed(1)} MB)`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        await voiceDownloadManager.clearCache();
                        setDownloadedCount(0);
                        setCacheSize(0);
                        showToastMessage('캐시가 삭제되었습니다');
                    }
                }
            ]
        );
    };

    // Tab config
    const tabs: { key: TabName; icon: string; label: string }[] = [
        { key: 'list', icon: 'format-list-bulleted', label: '목록' },
        { key: 'bookmarks', icon: 'star', label: '북마크' },
        { key: 'add', icon: 'plus-circle', label: '추가' },
        { key: 'dict', icon: 'book-alphabet', label: '사전' },
        { key: 'settings', icon: 'cog', label: '설정' },
    ];

    const actionMenuActions: ActionItem[] = [
        {
            id: 'reading',
            label: 'AI 읽기 생성',
            icon: 'format-annotation-plus',
            color: theme.colors.info,
            onPress: () => handleBatchAiAction('reading'),
        },
        {
            id: 'meaning',
            label: 'AI 번역 생성',
            icon: 'translate',
            color: theme.colors.accent,
            onPress: () => handleBatchAiAction('meaning'),
        },
        {
            id: 'memo',
            label: 'AI 해설 생성',
            icon: 'comment-text-outline',
            color: theme.colors.success,
            onPress: () => handleBatchAiAction('memo'),
        },
        {
            id: 'verification',
            label: 'AI 읽기 검증',
            icon: 'check-decagram',
            color: theme.colors.warning || '#ff9800',
            onPress: () => handleBatchAiAction('verification'),
        },
    ];

    // Render list item
    const renderListItem = useCallback(({ item, index }: { item: any; index: number }) => {
        const originalIndex = item.originalIndex ?? sentences.findIndex(s => s.order === item.order);
        const isSelected = selectedSentences.has(originalIndex);
        const isBookmarked = bookmarks.has(originalIndex);
        const hasMemo = !!item.memo && item.memo.trim().length > 0;
        const hasReading = !!item.reading && item.reading.trim().length > 0;

        return (
            <View
                style={[
                    styles.listItem,
                    {
                        backgroundColor: isSelected ? `${theme.colors.primary}10` : theme.colors.panel,
                        borderColor: isSelected ? theme.colors.primary : `${theme.colors.border}40`,
                        flexDirection: 'column',
                        padding: 0,
                        overflow: 'hidden',
                        marginBottom: 12,
                    }
                ]}
            >
                <TouchableOpacity
                    style={{ padding: 16, paddingBottom: 12 }}
                    onPress={() => handleGoToSentence(originalIndex)}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        {/* Checkbox (Integrated) */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation && e.stopPropagation();
                                toggleSelection(originalIndex, selectionScope);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 8 }}
                        >
                            <MaterialCommunityIcons
                                name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                                size={22}
                                color={isSelected ? theme.colors.primary : theme.colors.textDim}
                            />
                        </TouchableOpacity>

                        <Text style={[styles.listItemIndex, { color: theme.colors.primaryDim, marginRight: 8, fontSize: 13 }]}>
                            #{originalIndex + 1}
                        </Text>

                        {/* Speaker Badge */}
                        {item.speaker ? (
                            <View style={{
                                backgroundColor: `${theme.colors.primary}20`,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                marginRight: 6
                            }}>
                                <Text style={{ color: theme.colors.primary, fontSize: 11, fontFamily: 'Pretendard-Bold' }}>
                                    {item.speaker.split('|')[0]}
                                </Text>
                            </View>
                        ) : null}

                        {hasMemo ? (
                            <MaterialCommunityIcons name="comment-text-outline" size={14} color={theme.colors.success} />
                        ) : null}

                        <View style={{ flex: 1 }} />

                        {/* Bookmark Toggle (Far Right) */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation && e.stopPropagation();
                                toggleBookmark(originalIndex);
                            }}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            style={{ padding: 4 }}
                        >
                            <MaterialCommunityIcons
                                name={isBookmarked ? "star" : "star-outline"}
                                size={24}
                                color={isBookmarked ? theme.colors.accent : theme.colors.textDim}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Content Display: Priority to Reading (Ruby/Plain), fallback to Expression */}
                    {hasReading ? (
                        <View style={{ marginBottom: 4, alignItems: 'flex-start' }}>
                            {(item.reading.includes('[') || item.reading.includes('【')) ? (
                                <FuriganaText
                                    text={item.reading}
                                    fontSize={18}
                                    textStyle={{ color: theme.colors.text }}
                                    furiganaStyle={{ color: theme.colors.info }}
                                />
                            ) : (
                                <Text
                                    style={[styles.listItemText, { color: theme.colors.text, fontSize: 16, lineHeight: 24, marginBottom: 4 }]}
                                    textBreakStrategy="simple"
                                >
                                    {item.reading}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text
                            style={[styles.listItemText, { color: theme.colors.text, fontSize: 16, lineHeight: 24, marginBottom: 4 }]}
                            textBreakStrategy="simple"
                        >
                            {item.expression}
                        </Text>
                    )}

                    {item.meaning ? (
                        <Text style={[styles.listItemMeaning, { color: theme.colors.textDim, fontSize: 14 }]} numberOfLines={2}>
                            {item.meaning}
                        </Text>
                    ) : null}
                </TouchableOpacity>

                {/* Footer Actions */}
                <View style={{
                    flexDirection: 'row',
                    borderTopWidth: 1,
                    borderTopColor: `${theme.colors.border}40`,
                    marginTop: 0,
                }}>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderRightWidth: 1,
                            borderRightColor: `${theme.colors.border}40`,
                            backgroundColor: `${theme.colors.panel}50`
                        }}
                        onPress={() => handleOpenEdit(originalIndex)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.info} />
                        <Text style={{ marginLeft: 6, color: theme.colors.info, fontSize: 13, fontFamily: 'Pretendard-Bold' }}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingVertical: 12,
                            backgroundColor: `${theme.colors.error}10` // Red background for delete
                        }}
                        onPress={() => {
                            setDeleteTargetIndex(originalIndex);
                            setShowDeleteModal(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={16} color={theme.colors.error} />
                        <Text style={{ marginLeft: 6, color: theme.colors.error, fontSize: 13, fontFamily: 'Pretendard-Bold' }}>삭제</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [sentences, selectedSentences, bookmarks, theme, toggleSelection, handleGoToSentence, handleOpenEdit]);

    const renderListTab = () => (
        <View style={[
            styles.tabContent,
        ]}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.dark }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textDim} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="검색..."
                    placeholderTextColor={theme.colors.textDim}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textDim} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Selection Bar moved to bottom of screen */}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 }}>
                <TouchableOpacity onPress={handleSelectAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={16} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary, marginLeft: 4, fontSize: 12 }}>전체 선택</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                ref={listRef}
                data={paginatedData}
                renderItem={renderListItem}
                keyExtractor={(item, index) => `${item.order}-${index}`}
                extraData={selectedSentences}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />

            {/* Pagination */}
            {totalPages > 1 ? (
                <View style={[styles.pagination, { borderTopColor: theme.colors.border }]}>
                    <TouchableOpacity
                        disabled={currentPage === 0}
                        onPress={() => { haptic.light(); setCurrentPage(p => Math.max(0, p - 10)); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }}
                        style={[styles.paginationBtn, { marginRight: 4 }]}
                    >
                        <MaterialCommunityIcons
                            name="chevron-double-left"
                            size={20}
                            color={currentPage === 0 ? theme.colors.textDim : theme.colors.primary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        disabled={currentPage === 0}
                        onPress={() => { haptic.light(); setCurrentPage(p => Math.max(0, p - 1)); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }}
                        style={styles.paginationBtn}
                    >
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={20}
                            color={currentPage === 0 ? theme.colors.textDim : theme.colors.primary}
                        />
                        <Text style={{ color: currentPage === 0 ? theme.colors.textDim : theme.colors.primary, fontFamily: 'Pretendard' }}>
                            이전
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setTargetPageInput((currentPage + 1).toString());
                            setShowPageModal(true);
                        }}
                    >
                        <Text style={{ color: theme.colors.text, fontFamily: 'Pretendard', paddingHorizontal: 8 }}>
                            {currentPage + 1} / {totalPages}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled={currentPage >= totalPages - 1}
                        onPress={() => { haptic.light(); setCurrentPage(p => Math.min(totalPages - 1, p + 1)); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }}
                        style={styles.paginationBtn}
                    >
                        <Text style={{ color: currentPage >= totalPages - 1 ? theme.colors.textDim : theme.colors.primary, fontFamily: 'Pretendard' }}>
                            다음
                        </Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={currentPage >= totalPages - 1 ? theme.colors.textDim : theme.colors.primary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        disabled={currentPage >= totalPages - 1}
                        onPress={() => { haptic.light(); setCurrentPage(p => Math.min(totalPages - 1, p + 10)); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }}
                        style={[styles.paginationBtn, { marginLeft: 4 }]}
                    >
                        <MaterialCommunityIcons
                            name="chevron-double-right"
                            size={20}
                            color={currentPage >= totalPages - 1 ? theme.colors.textDim : theme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );

    const renderAddTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>캐릭터 이름</Text>
                <TextInput
                    style={[styles.formInput, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="예: 岡部倫太郎|Okabe"
                    placeholderTextColor={theme.colors.textDim}
                    value={addForm.speaker}
                    onChangeText={(v) => setAddForm(prev => ({ ...prev, speaker: v }))}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>원문 *</Text>
                <TextInput
                    style={[styles.formInput, styles.formTextarea, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="일본어 문장을 입력하세요"
                    placeholderTextColor={theme.colors.textDim}
                    value={addForm.expression}
                    onChangeText={(v) => setAddForm(prev => ({ ...prev, expression: v }))}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>읽기 (후리가나)</Text>
                <TextInput
                    style={[styles.formInput, styles.formTextarea, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="食[た]べる 형식으로 후리가나 표기"
                    placeholderTextColor={theme.colors.textDim}
                    value={addForm.reading}
                    onChangeText={(v) => setAddForm(prev => ({ ...prev, reading: v }))}
                    multiline
                    numberOfLines={3}
                />
                <TouchableOpacity
                    style={[styles.aiButton, { borderColor: theme.colors.info, backgroundColor: `${theme.colors.info}10` }]}
                    onPress={handleGenerateReading}
                    disabled={isLoading}
                >
                    <MaterialCommunityIcons name="robot" size={16} color={theme.colors.info} />
                    <Text style={{ color: theme.colors.info, marginLeft: 6 }}>
                        {isLoading ? '생성 중...' : 'AI 읽기 생성'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>한국어</Text>
                <TextInput
                    style={[styles.formInput, styles.formTextarea, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="한국어 번역"
                    placeholderTextColor={theme.colors.textDim}
                    value={addForm.meaning}
                    onChangeText={(v) => setAddForm(prev => ({ ...prev, meaning: v }))}
                    multiline
                    numberOfLines={2}
                />
                <TouchableOpacity
                    style={[styles.aiButton, { borderColor: theme.colors.info, backgroundColor: `${theme.colors.info}10` }]}
                    onPress={handleGenerateMeaning}
                    disabled={isLoading}
                >
                    <MaterialCommunityIcons name="robot" size={16} color={theme.colors.info} />
                    <Text style={{ color: theme.colors.info, marginLeft: 6 }}>
                        {isLoading ? '생성 중...' : 'AI 번역 생성'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddSentence}
            >
                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.dark} />
                <Text style={[styles.submitButtonText, { color: theme.colors.dark }]}>문장 추가</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // Dict tab - filtered and paginated dict entries
    const DICT_ITEMS_PER_PAGE = 20;
    const dictEntries = useMemo(() => {
        const entries = Object.entries(readingDict).map(([word, reading]) => ({ word, reading }));
        if (!dictSearchQuery.trim()) return entries;
        const query = dictSearchQuery.toLowerCase();
        return entries.filter(e =>
            e.word.toLowerCase().includes(query) ||
            e.reading.toLowerCase().includes(query)
        );
    }, [readingDict, dictSearchQuery]);

    const paginatedDictEntries = useMemo(() => {
        const start = dictPage * DICT_ITEMS_PER_PAGE;
        return dictEntries.slice(start, start + DICT_ITEMS_PER_PAGE);
    }, [dictEntries, dictPage]);

    const dictTotalPages = Math.ceil(dictEntries.length / DICT_ITEMS_PER_PAGE);

    const handleAddDict = () => {
        if (!dictForm.word.trim() || !dictForm.reading.trim()) {
            showToastMessage('단어와 읽기를 모두 입력하세요');
            return;
        }
        addToReadingDict(dictForm.word.trim(), dictForm.reading.trim());
        setDictForm({ word: '', reading: '' });
        showToastMessage('사전에 추가되었습니다');
    };

    const handleBatchDeleteDict = () => {
        if (selectedDictWords.size === 0) return;
        Alert.alert(
            '일괄 삭제',
            `선택한 ${selectedDictWords.size}개 항목을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        removeMultipleFromReadingDict([...selectedDictWords]);
                        showToastMessage(`${selectedDictWords.size}개 삭제됨`);
                    }
                },
            ]
        );
    };

    const handleDeleteDictItem = (word: string) => {
        Alert.alert(
            '삭제 확인',
            `"${word}"을(를) 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        removeFromReadingDict(word);
                        showToastMessage('삭제되었습니다');
                    }
                },
            ]
        );
    };

    const handleEditDictItem = (item: { word: string; reading: string }) => {
        setEditingDictItem(item);
        setEditDictForm({ word: item.word, reading: item.reading });
    };

    const handleSaveEditDict = () => {
        if (!editingDictItem || !editDictForm.word.trim() || !editDictForm.reading.trim()) {
            showToastMessage('단어와 읽기를 모두 입력하세요');
            return;
        }
        // If word changed, remove old entry
        if (editDictForm.word.trim() !== editingDictItem.word) {
            removeFromReadingDict(editingDictItem.word);
        }
        addToReadingDict(editDictForm.word.trim(), editDictForm.reading.trim());
        setEditingDictItem(null);
        showToastMessage('수정되었습니다');
    };

    const renderDictItem = ({ item }: { item: { word: string; reading: string } }) => {
        const isSelected = selectedDictWords.has(item.word);
        return (
            <View
                style={[
                    styles.listItem,
                    {
                        backgroundColor: isSelected ? `${theme.colors.primary}15` : theme.colors.panel,
                        borderColor: isSelected ? theme.colors.primary : `${theme.colors.border}50`,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                    }
                ]}
            >
                {/* Checkbox */}
                <TouchableOpacity
                    onPress={() => toggleDictSelection(item.word)}
                    style={{ padding: 4, marginRight: 8 }}
                >
                    <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={22}
                        color={isSelected ? theme.colors.primary : theme.colors.textDim}
                    />
                </TouchableOpacity>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: 'YuMincho' }}>
                        {item.word}
                    </Text>
                    <Text style={{ color: theme.colors.textDim, fontSize: 14, marginTop: 2 }}>
                        → {item.reading}
                    </Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                    onPress={() => handleEditDictItem(item)}
                    style={{ padding: 8 }}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.colors.info} />
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                    onPress={() => handleDeleteDictItem(item.word)}
                    style={{ padding: 8 }}
                >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderDictTab = () => (
        <View style={styles.tabContent}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.dark }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textDim} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="검색..."
                    placeholderTextColor={theme.colors.textDim}
                    value={dictSearchQuery}
                    onChangeText={(v) => { setDictSearchQuery(v); setDictPage(0); }}
                />
                {dictSearchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setDictSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textDim} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Add Form */}
            <View style={[styles.settingsSection, { marginTop: 8, paddingBottom: 12 }]}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="plus-circle" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>새 항목 추가</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                        style={[styles.formInput, { flex: 1, backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="단어 (예: 世界線)"
                        placeholderTextColor={theme.colors.textDim}
                        value={dictForm.word}
                        onChangeText={(v) => setDictForm(prev => ({ ...prev, word: v }))}
                    />
                    <TextInput
                        style={[styles.formInput, { flex: 1, backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="읽기 (예: せかいせん)"
                        placeholderTextColor={theme.colors.textDim}
                        value={dictForm.reading}
                        onChangeText={(v) => setDictForm(prev => ({ ...prev, reading: v }))}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: theme.colors.primary, marginTop: 8 }]}
                    onPress={handleAddDict}
                >
                    <MaterialCommunityIcons name="plus" size={18} color={theme.colors.dark} />
                    <Text style={{ color: theme.colors.dark, marginLeft: 6, fontWeight: 'bold' }}>추가</Text>
                </TouchableOpacity>
            </View>

            {/* Selection Bar */}
            {selectedDictWords.size > 0 ? (
                <View style={[styles.selectionBar, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Text style={{ color: theme.colors.text, fontFamily: 'Pretendard' }}>
                        {selectedDictWords.size}개 선택
                    </Text>
                    <View style={styles.selectionActions}>
                        <TouchableOpacity onPress={handleBatchDeleteDict} style={styles.selectionBtn}>
                            <MaterialCommunityIcons name="delete" size={18} color={theme.colors.error} />
                            <Text style={{ color: theme.colors.error, marginLeft: 4, fontFamily: 'Pretendard' }}>삭제</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={clearDictSelection} style={[styles.selectionBtn, { marginLeft: 16 }]}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.colors.textDim} />
                            <Text style={{ color: theme.colors.textDim, marginLeft: 4, fontFamily: 'Pretendard' }}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {/* Stats */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="book-open-page-variant" size={14} color={theme.colors.textDim} />
                <Text style={{ color: theme.colors.textDim, fontSize: 13, marginLeft: 6 }}>
                    사전 항목: {dictEntries.length}개
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={paginatedDictEntries}
                renderItem={renderDictItem}
                keyExtractor={(item) => item.word}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={{ padding: 32, alignItems: 'center' }}>
                        <MaterialCommunityIcons name="book-open-variant" size={48} color={theme.colors.textDim} />
                        <Text style={{ color: theme.colors.textDim, marginTop: 12 }}>
                            {dictSearchQuery ? '검색 결과가 없습니다' : '사전이 비어있습니다'}
                        </Text>
                    </View>
                }
            />

            {/* Pagination */}
            {dictTotalPages > 1 ? (
                <View style={[styles.pagination, { borderTopColor: theme.colors.border }]}>
                    <TouchableOpacity
                        disabled={dictPage === 0}
                        onPress={() => setDictPage(p => p - 1)}
                        style={styles.paginationBtn}
                    >
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={20}
                            color={dictPage === 0 ? theme.colors.textDim : theme.colors.primary}
                        />
                        <Text style={{ color: dictPage === 0 ? theme.colors.textDim : theme.colors.primary, fontFamily: 'Pretendard' }}>
                            이전
                        </Text>
                    </TouchableOpacity>
                    <Text style={{ color: theme.colors.text, fontFamily: 'Pretendard' }}>
                        {dictPage + 1} / {dictTotalPages}
                    </Text>
                    <TouchableOpacity
                        disabled={dictPage >= dictTotalPages - 1}
                        onPress={() => setDictPage(p => p + 1)}
                        style={styles.paginationBtn}
                    >
                        <Text style={{ color: dictPage >= dictTotalPages - 1 ? theme.colors.textDim : theme.colors.primary, fontFamily: 'Pretendard' }}>
                            다음
                        </Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={dictPage >= dictTotalPages - 1 ? theme.colors.textDim : theme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );

    const renderSettingsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* API Settings */}
            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="api" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Claude API</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.colors.text }]}>API Key</Text>
                    <TextInput
                        style={[styles.formInput, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="sk-ant-..."
                        placeholderTextColor={theme.colors.textDim}
                        value={settings.apiKey}
                        onChangeText={(v) => setSettings({ apiKey: v })}
                        secureTextEntry
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.colors.text }]}>Model</Text>
                    {(() => {
                        // Model configuration with default dates
                        const modelConfigs = [
                            { type: 'opus', prefix: 'claude-opus-4-5-', defaultDate: '20251101', label: 'Opus 4.5' },
                            { type: 'sonnet', prefix: 'claude-sonnet-4-5-', defaultDate: '20250929', label: 'Sonnet 4.5' },
                            { type: 'haiku', prefix: 'claude-haiku-4-5-', defaultDate: '20251001', label: 'Haiku 4.5' },
                        ];

                        // Parse current model to get type and date
                        const getCurrentModelInfo = () => {
                            for (const config of modelConfigs) {
                                if (settings.apiModel.startsWith(config.prefix)) {
                                    return {
                                        type: config.type,
                                        date: settings.apiModel.replace(config.prefix, ''),
                                        config,
                                        isCustom: false,
                                    };
                                }
                            }
                            // If doesn't match any known prefix, it's custom
                            return {
                                type: 'custom',
                                date: '',
                                config: null,
                                isCustom: true,
                            };
                        };

                        const modelInfo = getCurrentModelInfo();

                        const handleTypeChange = (config: typeof modelConfigs[0]) => {
                            setSettings({ apiModel: config.prefix + config.defaultDate });
                        };

                        const handleDateChange = (date: string) => {
                            if (modelInfo.config) {
                                setSettings({ apiModel: modelInfo.config.prefix + date });
                            }
                        };

                        const handleCustomChange = (fullModelId: string) => {
                            setSettings({ apiModel: fullModelId });
                        };

                        return (
                            <View>
                                {/* Model Type Selector */}
                                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {modelConfigs.map((config) => {
                                        const isSelected = modelInfo.type === config.type;
                                        return (
                                            <TouchableOpacity
                                                key={config.type}
                                                style={[
                                                    styles.themeOption,
                                                    {
                                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                                        backgroundColor: isSelected ? `${theme.colors.primary}20` : theme.colors.dark,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 8,
                                                    }
                                                ]}
                                                onPress={() => handleTypeChange(config)}
                                            >
                                                <Text style={{
                                                    color: isSelected ? theme.colors.primary : theme.colors.text,
                                                    fontSize: 12,
                                                }}>
                                                    {config.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {/* Custom option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.themeOption,
                                            {
                                                borderColor: modelInfo.isCustom ? theme.colors.primary : theme.colors.border,
                                                backgroundColor: modelInfo.isCustom ? `${theme.colors.primary}20` : theme.colors.dark,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                            }
                                        ]}
                                        onPress={() => setSettings({ apiModel: '' })}
                                    >
                                        <Text style={{
                                            color: modelInfo.isCustom ? theme.colors.primary : theme.colors.text,
                                            fontSize: 12,
                                        }}>
                                            기타
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Date Version Input (for known models) */}
                                {!modelInfo.isCustom && modelInfo.config && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: theme.colors.textDim, fontSize: 12 }}>Version:</Text>
                                        <TextInput
                                            style={[styles.formInput, {
                                                backgroundColor: theme.colors.dark,
                                                borderColor: theme.colors.border,
                                                color: theme.colors.text,
                                                flex: 1,
                                                paddingVertical: 6,
                                            }]}
                                            placeholder={modelInfo.config.defaultDate}
                                            placeholderTextColor={theme.colors.textDim}
                                            value={modelInfo.date}
                                            onChangeText={handleDateChange}
                                            keyboardType="numeric"
                                            maxLength={8}
                                        />
                                    </View>
                                )}

                                {/* Full Model ID Input (for custom) */}
                                {modelInfo.isCustom && (
                                    <TextInput
                                        style={[styles.formInput, {
                                            backgroundColor: theme.colors.dark,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.text,
                                            paddingVertical: 6,
                                        }]}
                                        placeholder="claude-..."
                                        placeholderTextColor={theme.colors.textDim}
                                        value={settings.apiModel}
                                        onChangeText={handleCustomChange}
                                    />
                                )}

                                {/* Current Model Display */}
                                <Text style={{ color: theme.colors.textDim, fontSize: 10, marginTop: 4 }}>
                                    → {settings.apiModel || '(미설정)'}
                                </Text>
                            </View>
                        );
                    })()}
                </View>
            </View>

            {/* Theme Settings */}
            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="palette" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>테마</Text>
                </View>
                <View style={styles.themeGrid}>
                    {(['steinsgate', 'cyberpunk', 'ocean', 'sakura', 'amber', 'monochrome', 'modern'] as ThemeName[]).map((themeName) => (
                        <TouchableOpacity
                            key={themeName}
                            style={[
                                styles.themeOption,
                                {
                                    borderColor: settings.theme === themeName ? theme.colors.primary : theme.colors.border,
                                    backgroundColor: settings.theme === themeName ? `${theme.colors.primary}20` : theme.colors.dark,
                                }
                            ]}
                            onPress={() => setSettings({ theme: themeName })}
                        >
                            <Text style={{
                                color: settings.theme === themeName ? theme.colors.primary : theme.colors.text,
                                fontSize: 12,
                            }}>
                                {themeName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Voice Settings */}
            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="volume-high" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>음성</Text>
                </View>

                {/* Autoplay Toggle */}
                <TouchableOpacity
                    style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border }]}
                    onPress={() => setSettings({ voiceAutoplay: !settings.voiceAutoplay })}
                >
                    <Text style={{ color: theme.colors.text }}>음성 자동 재생</Text>
                    <View style={[
                        styles.toggleSwitch,
                        {
                            backgroundColor: settings.voiceAutoplay ? theme.colors.primary : theme.colors.border,
                        }
                    ]}>
                        <View style={[
                            styles.toggleKnob,
                            {
                                backgroundColor: '#fff',
                                transform: [{ translateX: settings.voiceAutoplay ? 18 : 2 }],
                            }
                        ]} />
                    </View>
                </TouchableOpacity>

                {/* Volume Control */}
                <View style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, marginTop: 10 }]}>
                    <Text style={{ color: theme.colors.text }}>볼륨</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => {
                                const newVol = Math.max(0, settings.voiceVolume - 10);
                                setSettings({ voiceVolume: newVol });
                                audioPlayer.setVoiceVolume(newVol);
                            }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: 10, backgroundColor: `${theme.colors.primary}20`, borderRadius: 8 }}
                        >
                            <MaterialCommunityIcons name="minus" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={{ color: theme.colors.primary, fontWeight: 'bold', minWidth: 50, textAlign: 'center', fontSize: 16 }}>
                            {settings.voiceVolume}%
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                const newVol = Math.min(100, settings.voiceVolume + 10);
                                setSettings({ voiceVolume: newVol });
                                audioPlayer.setVoiceVolume(newVol);
                            }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: 10, backgroundColor: `${theme.colors.primary}20`, borderRadius: 8 }}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.backupButton, { borderColor: theme.colors.info, backgroundColor: `${theme.colors.info}10`, marginTop: 10 }]}
                    onPress={() => {
                        // Play a fixed sample voice for preview
                        audioPlayer.playVoice('OKA_0001.mp3');
                    }}
                >
                    <MaterialCommunityIcons name="play-circle-outline" size={18} color={theme.colors.info} />
                    <Text style={{ color: theme.colors.info, marginLeft: 8 }}>미리 듣기</Text>
                </TouchableOpacity>
            </View>

            {/* Haptic Feedback Settings */}
            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="vibrate" size={18} color={theme.colors.success} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.success }]}>햅틱 피드백</Text>
                </View>

                <TouchableOpacity
                    style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border }]}
                    onPress={() => setSettings({ hapticEnabled: !settings.hapticEnabled })}
                >
                    <Text style={{ color: theme.colors.text }}>진동 피드백</Text>
                    <View style={[
                        styles.toggleSwitch,
                        {
                            backgroundColor: settings.hapticEnabled ? theme.colors.success : theme.colors.border,
                        }
                    ]}>
                        <View style={[
                            styles.toggleKnob,
                            {
                                backgroundColor: '#fff',
                                transform: [{ translateX: settings.hapticEnabled ? 18 : 2 }],
                            }
                        ]} />
                    </View>
                </TouchableOpacity>
                <Text style={{ color: theme.colors.textDim, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                    버튼 클릭, 문장 이동 시 진동 피드백을 제공합니다
                </Text>
            </View>

            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="music" size={18} color={theme.colors.accent} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>배경음악 (BGM)</Text>
                </View>

                {/* BGM Track Selector - Dropdown Style */}
                <TouchableOpacity
                    style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border }]}
                    onPress={() => setShowBgmModal(true)}
                >
                    <Text style={{ color: theme.colors.text }}>트랙</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.accent, marginRight: 8 }}>
                            {getTrackName(settings.bgmTrack)}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textDim} />
                    </View>
                </TouchableOpacity>

                {/* BGM Autoplay Toggle */}
                <TouchableOpacity
                    style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, marginTop: 10 }]}
                    onPress={() => setSettings({ bgmAutoplay: !settings.bgmAutoplay })}
                >
                    <Text style={{ color: theme.colors.text }}>자동 재생</Text>
                    <View style={[
                        styles.toggleSwitch,
                        { backgroundColor: settings.bgmAutoplay ? theme.colors.accent : theme.colors.border }
                    ]}>
                        <View style={[
                            styles.toggleKnob,
                            { backgroundColor: '#fff', transform: [{ translateX: settings.bgmAutoplay ? 18 : 2 }] }
                        ]} />
                    </View>
                </TouchableOpacity>

                {/* BGM Volume Control */}
                <View style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, marginTop: 10 }]}>
                    <Text style={{ color: theme.colors.text }}>볼륨</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => {
                                const newVol = Math.max(0, settings.bgmVolume - 10);
                                setSettings({ bgmVolume: newVol });
                                audioPlayer.setBgmVolume(newVol);
                            }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: 10, backgroundColor: `${theme.colors.accent}20`, borderRadius: 8 }}
                        >
                            <MaterialCommunityIcons name="minus" size={22} color={theme.colors.accent} />
                        </TouchableOpacity>
                        <Text style={{ color: theme.colors.accent, fontWeight: 'bold', minWidth: 50, textAlign: 'center', fontSize: 16 }}>
                            {settings.bgmVolume}%
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                const newVol = Math.min(100, settings.bgmVolume + 10);
                                setSettings({ bgmVolume: newVol });
                                audioPlayer.setBgmVolume(newVol);
                            }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: 10, backgroundColor: `${theme.colors.accent}20`, borderRadius: 8 }}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color={theme.colors.accent} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Backup */}
            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="cloud-sync" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>백업/복원</Text>
                </View>
                <View style={styles.backupButtons}>
                    <TouchableOpacity
                        style={[styles.backupButton, { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }]}
                        onPress={handleExportBackup}
                    >
                        <MaterialCommunityIcons name="cloud-upload" size={18} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.primary, marginLeft: 8 }}>백업 내보내기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.backupButton, { borderColor: theme.colors.info, backgroundColor: `${theme.colors.info}10`, marginTop: 10 }]}
                        onPress={handleImportBackup}
                    >
                        <MaterialCommunityIcons name="cloud-download" size={18} color={theme.colors.info} />
                        <Text style={{ color: theme.colors.info, marginLeft: 8 }}>백업 불러오기</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Offline Voice Download */}
            <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="download" size={18} color={theme.colors.warning} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.warning }]}>오프라인 다운로드</Text>
                </View>

                {/* Status */}
                <View style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border }]}>
                    <Text style={{ color: theme.colors.text }}>다운로드 상태</Text>
                    <Text style={{ color: theme.colors.textDim }}>
                        {downloadedCount === -1 ? '로딩 중...' : `${downloadedCount} / ${totalVoiceCount}개`}
                    </Text>
                </View>

                <View style={[styles.toggleRow, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, marginTop: 10 }]}>
                    <Text style={{ color: theme.colors.text }}>캐시 용량</Text>
                    <Text style={{ color: theme.colors.textDim }}>
                        {(cacheSize / 1024 / 1024).toFixed(1)} MB
                    </Text>
                </View>

                {/* Progress Bar (when downloading) */}
                {downloadProgress?.isDownloading && (
                    <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ color: theme.colors.textDim, fontSize: 12 }}>
                                {downloadProgress.currentFile || '준비 중...'}
                            </Text>
                            <Text style={{ color: theme.colors.warning, fontSize: 12 }}>
                                {downloadProgress.completed} / {downloadProgress.total}
                            </Text>
                        </View>
                        <View style={{
                            height: 8,
                            backgroundColor: `${theme.colors.warning}20`,
                            borderRadius: 4,
                            overflow: 'hidden'
                        }}>
                            <View style={{
                                height: '100%',
                                width: `${(downloadProgress.completed / downloadProgress.total) * 100}%`,
                                backgroundColor: theme.colors.warning,
                                borderRadius: 4,
                            }} />
                        </View>
                        {downloadProgress.failed > 0 && (
                            <Text style={{ color: theme.colors.error, fontSize: 11, marginTop: 4 }}>
                                실패: {downloadProgress.failed}개
                            </Text>
                        )}
                    </View>
                )}

                {/* Buttons */}
                <View style={[styles.backupButtons, { marginTop: downloadProgress?.isDownloading ? 16 : 0 }]}>
                    {!downloadProgress?.isDownloading ? (
                        <TouchableOpacity
                            style={[
                                styles.backupButton,
                                {
                                    borderColor: theme.colors.warning,
                                    backgroundColor: `${theme.colors.warning}10`,
                                    opacity: (downloadedCount === -1 || (downloadedCount === totalVoiceCount && totalVoiceCount > 0)) ? 0.5 : 1,
                                }
                            ]}
                            onPress={handleStartDownload}
                            disabled={downloadedCount === -1 || totalVoiceCount === 0 || (downloadedCount === totalVoiceCount && totalVoiceCount > 0)}
                        >
                            <MaterialCommunityIcons
                                name={downloadedCount === totalVoiceCount && totalVoiceCount > 0 ? "check-circle" : "download"}
                                size={18}
                                color={theme.colors.warning}
                            />
                            <Text style={{ color: theme.colors.warning, marginLeft: 8 }}>
                                {downloadedCount === -1
                                    ? '로딩 중...'
                                    : downloadedCount === totalVoiceCount && totalVoiceCount > 0
                                        ? '다운로드 완료됨'
                                        : downloadedCount > 0
                                            ? `이어받기 (${downloadedCount}/${totalVoiceCount})`
                                            : '전체 다운로드 시작'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.backupButton, { flex: 1, borderColor: theme.colors.info, backgroundColor: `${theme.colors.info}10` }]}
                                onPress={handlePauseDownload}
                            >
                                <MaterialCommunityIcons
                                    name={downloadProgress.isPaused ? "play" : "pause"}
                                    size={18}
                                    color={theme.colors.info}
                                />
                                <Text style={{ color: theme.colors.info, marginLeft: 8 }}>
                                    {downloadProgress.isPaused ? '재개' : '일시정지'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.backupButton, { flex: 1, borderColor: theme.colors.error, backgroundColor: `${theme.colors.error}10` }]}
                                onPress={handleCancelDownload}
                            >
                                <MaterialCommunityIcons name="close" size={18} color={theme.colors.error} />
                                <Text style={{ color: theme.colors.error, marginLeft: 8 }}>취소</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {downloadedCount > 0 && !downloadProgress?.isDownloading && (
                        <TouchableOpacity
                            style={[styles.backupButton, { borderColor: theme.colors.error, backgroundColor: `${theme.colors.error}10`, marginTop: 10 }]}
                            onPress={handleClearCache}
                        >
                            <MaterialCommunityIcons name="delete" size={18} color={theme.colors.error} />
                            <Text style={{ color: theme.colors.error, marginLeft: 8 }}>캐시 삭제</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={{ color: theme.colors.textDim, fontSize: 11, marginTop: 8 }}>
                    WIFI 환경에서 다운로드하면 오프라인에서도 음성과 배경음악을 재생할 수 있습니다
                </Text>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.darker }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.panel }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Reader')}
                >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary, fontFamily: 'Pretendard' }}>리더</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>데이터 관리</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tabs */}
            <View style={[styles.tabBar, { backgroundColor: theme.colors.panel }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && {
                                borderBottomColor: theme.colors.primary,
                                borderBottomWidth: 2,
                                backgroundColor: `${theme.colors.primary}10`,
                            }
                        ]}
                        onPress={() => {
                            setActiveTab(tab.key);
                            setCurrentPage(0);
                            setSearchQuery('');
                        }}
                    >
                        <MaterialCommunityIcons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.key ? theme.colors.primary : theme.colors.textDim}
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textDim }
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'list' && renderListTab()}
            {activeTab === 'bookmarks' && renderListTab()}
            {activeTab === 'add' && renderAddTab()}
            {activeTab === 'dict' && renderDictTab()}
            {activeTab === 'settings' && renderSettingsTab()}

            {/* Delete Modal */}
            <CustomModal
                visible={showDeleteModal}
                title="삭제 확인"
                message="이 문장을 삭제하시겠습니까?"
                confirmText="삭제"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            {/* Dict Edit Modal */}
            <CustomModal
                visible={!!editingDictItem}
                title="사전 항목 수정"
                message={
                    <View>
                        <Text style={{ color: theme.colors.textDim, fontSize: 12, marginBottom: 4 }}>단어</Text>
                        <TextInput
                            style={[styles.formInput, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text, marginBottom: 12 }]}
                            placeholder="단어"
                            placeholderTextColor={theme.colors.textDim}
                            value={editDictForm.word}
                            onChangeText={(v) => setEditDictForm(prev => ({ ...prev, word: v }))}
                        />
                        <Text style={{ color: theme.colors.textDim, fontSize: 12, marginBottom: 4 }}>읽기</Text>
                        <TextInput
                            style={[styles.formInput, { backgroundColor: theme.colors.dark, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="읽기"
                            placeholderTextColor={theme.colors.textDim}
                            value={editDictForm.reading}
                            onChangeText={(v) => setEditDictForm(prev => ({ ...prev, reading: v }))}
                        />
                    </View>
                }
                confirmText="저장"
                onConfirm={handleSaveEditDict}
                cancelText="취소"
                onCancel={() => setEditingDictItem(null)}
            />

            {/* Toast */}
            <Toast
                message={toastMessage}
                visible={showToast}
                onHide={() => setShowToast(false)}
            />

            {/* Sentence Edit Modal */}
            <SentenceEditModal
                visible={showEditModal}
                sentence={editTargetIndex !== null ? sentences[editTargetIndex] : null}
                sentenceIndex={editTargetIndex || 0}
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveEdit}
            />

            {/* Batch Progress Modal */}
            <CustomModal
                visible={batchProgress.visible}
                title="일괄 작업 진행 중"
                message={
                    <View style={{ alignItems: 'center', padding: 16 }}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.text, marginTop: 16, fontSize: 16 }}>
                            {batchProgress.current} / {batchProgress.total}
                        </Text>
                        <Text style={{ color: theme.colors.textDim, marginTop: 8 }}>
                            잠시만 기다려주세요...
                        </Text>
                    </View>
                }
                type="alert" // Hide default cancel button
                confirmText="중단"
                confirmColor={theme.colors.error}
                onConfirm={() => {
                    isBatchCancelled.current = true;
                    setBatchProgress(prev => ({ ...prev, visible: false }));
                }}
            />

            {/* Navigation Confirm Modal */}
            <CustomModal
                visible={navConfirm.visible}
                title="읽기 모드로 이동"
                message="선택한 문장으로 이동하시겠습니까?&#10;현재 진행 위치가 변경됩니다."
                confirmText="이동"
                onConfirm={confirmNavigation}
                onCancel={() => setNavConfirm({ visible: false, index: null })}
            />

            {/* Batch Delete Confirm Modal */}
            <CustomModal
                visible={batchDeleteConfirm}
                title="일괄 삭제"
                message={`선택한 ${selectedSentences.size}개 항목을 삭제하시겠습니까?`}
                confirmText="삭제"
                confirmColor={theme.colors.error}
                onConfirm={confirmBatchDelete}
                onCancel={() => setBatchDeleteConfirm(false)}
            />

            {/* Batch AI Confirm Modal */}
            <CustomModal
                visible={batchAiConfirm.visible}
                title={`일괄 ${batchAiConfirm.type ? { 'reading': '읽기', 'meaning': '번역', 'memo': '해설', 'verification': '검증' }[batchAiConfirm.type] : ''} 생성`}
                message={`선택한 ${selectedSentences.size}개 항목에 대해 작업을 진행하시겠습니까?`}
                confirmText="실행"
                confirmColor={theme.colors.info}
                onConfirm={confirmBatchAi}
                onCancel={() => setBatchAiConfirm({ visible: false, type: null })}
            />

            {/* Batch Result Review Modal */}
            <Modal
                visible={showBatchResultModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowBatchResultModal(false)}
            >
                <View style={{ backgroundColor: 'rgba(0,0,0,0.8)', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.colors.panel, width: '100%', maxWidth: 600, maxHeight: '80%', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>

                        {/* Header */}
                        <View style={{ padding: 16, backgroundColor: `${theme.colors.primary}10`, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontFamily: 'Pretendard-Bold', color: theme.colors.primary }}>
                                생성 결과 확인 ({batchResults.length}개)
                            </Text>
                            <TouchableOpacity onPress={() => setShowBatchResultModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textDim} />
                            </TouchableOpacity>
                        </View>

                        {/* List */}
                        <FlatList
                            data={batchResults}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    onPress={() => toggleBatchResultSelection(index)}
                                    style={{
                                        flexDirection: 'row',
                                        marginBottom: 12,
                                        backgroundColor: theme.colors.background,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: item.selected ? theme.colors.primary : theme.colors.border,
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Checkbox Area */}
                                    <View style={{ width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: item.selected ? `${theme.colors.primary}20` : 'transparent' }}>
                                        <MaterialCommunityIcons
                                            name={item.selected ? "checkbox-marked" : "checkbox-blank-outline"}
                                            size={24}
                                            color={item.selected ? theme.colors.primary : theme.colors.textDim}
                                        />
                                    </View>

                                    {/* Content Area */}
                                    <View style={{ flex: 1, padding: 12 }}>
                                        <View style={{ marginBottom: 6 }}>
                                            <Text style={{ color: theme.colors.textDim, fontSize: 12, marginBottom: 2 }}>원본</Text>
                                            <Text style={{ color: theme.colors.text, fontFamily: 'Pretendard-Medium' }}>
                                                {item.original.expression}
                                            </Text>
                                        </View>

                                        <View>
                                            <Text style={{ color: theme.colors.success, fontSize: 12, marginBottom: 2 }}>생성 결과</Text>
                                            {/* Verification Comparison */}
                                            {item.type === 'verification' && item.original.reading && (
                                                <View style={{ marginBottom: 8 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Text style={{ color: theme.colors.textDim, fontSize: 11, marginBottom: 2 }}>기존</Text>
                                                        {item.result === item.original.reading && (
                                                            <Text style={{ color: theme.colors.success, fontSize: 11, fontWeight: 'bold' }}>✓ 검증 완료 (이상 없음)</Text>
                                                        )}
                                                    </View>
                                                    <FuriganaText
                                                        text={item.original.expression}
                                                        reading={item.original.reading}
                                                        showFurigana={true}
                                                        textStyle={{ color: theme.colors.textDim, fontSize: 14 }}
                                                        fontSize={14}
                                                    />
                                                </View>
                                            )}

                                            {(item.type === 'reading' || item.type === 'verification') ? (
                                                <View>
                                                    {item.type === 'verification' && <Text style={{ color: item.result === item.original.reading ? theme.colors.textDim : theme.colors.warning, fontSize: 11, marginBottom: 2 }}>{item.result === item.original.reading ? '결과' : '수정 제안'}</Text>}
                                                    <FuriganaText
                                                        text={item.original.expression}
                                                        reading={item.result}
                                                        showFurigana={true}
                                                        textStyle={{ color: item.type === 'verification' && item.result !== item.original.reading ? theme.colors.warning : theme.colors.text, fontSize: 16 }}
                                                        fontSize={16}
                                                    />
                                                </View>
                                            ) : (
                                                <Text style={{ color: theme.colors.text, fontSize: 15 }}>
                                                    {item.result}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />

                        {/* Footer Actions */}
                        <View style={{ flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowBatchResultModal(false)}
                                style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border }}
                            >
                                <Text style={{ color: theme.colors.textDim, fontFamily: 'Pretendard-Medium' }}>취소 (미적용)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleApplyBatchResults}
                                disabled={isApplying}
                                style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 24,
                                    borderRadius: 8,
                                    backgroundColor: isApplying ? theme.colors.textDim : theme.colors.primary,
                                    opacity: isApplying ? 0.8 : 1,
                                    minWidth: 120,
                                    alignItems: 'center'
                                }}
                            >
                                {isApplying ? (
                                    <ActivityIndicator size="small" color={theme.colors.dark} />
                                ) : (
                                    <Text style={{ color: theme.colors.dark, fontFamily: 'Pretendard-Bold' }}>
                                        선택한 {batchResults.filter(r => r.selected).length}개항목 적용
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Fixed Selection Bar (Only for list/bookmarks tabs) */}
            {(activeTab === 'list' || activeTab === 'bookmarks') && selectedSentences.size > 0 && (
                <View style={[
                    styles.selectionBar,
                    {
                        backgroundColor: theme.colors.panel,
                        borderTopWidth: 1,
                        borderTopColor: `${theme.colors.primary}30`,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        paddingBottom: 24, // Add padding for bottom safe area
                        zIndex: 100,
                        elevation: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    }
                ]}>
                    {/* Left: Count */}
                    <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: `${theme.colors.primary}15`,
                        borderRadius: 8,
                    }}>
                        <Text style={{ color: theme.colors.primary, fontFamily: 'Pretendard-Bold', fontSize: 14 }}>
                            {selectedSentences.size}개
                        </Text>
                    </View>

                    {/* Right: Actions + Cancel */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* More Button */}
                        <TouchableOpacity
                            onPress={() => setShowActionMenu(true)}
                            style={{
                                flexDirection: 'row',
                                paddingHorizontal: 10,
                                paddingVertical: 10,
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: `${theme.colors.primary}10`,
                            }}
                        >
                            <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.colors.primary} />
                            <Text style={{ marginLeft: 4, color: theme.colors.primary, fontFamily: 'Pretendard-Bold', fontSize: 13 }}>작업</Text>
                        </TouchableOpacity>

                        <View style={{ width: 1, height: 20, backgroundColor: `${theme.colors.border}40` }} />

                        <TouchableOpacity
                            onPress={handleBatchDelete}
                            style={{
                                flexDirection: 'row',
                                paddingHorizontal: 10,
                                paddingVertical: 10,
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: `${theme.colors.error}10`,
                            }}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                            <Text style={{ marginLeft: 4, color: theme.colors.error, fontFamily: 'Pretendard-Bold', fontSize: 13 }}>삭제</Text>
                        </TouchableOpacity>

                        <View style={{ width: 1, height: 20, backgroundColor: `${theme.colors.border}40` }} />

                        {/* Cancel Button (Far Right) */}
                        <TouchableOpacity
                            onPress={() => clearSelection(selectionScope)}
                            style={{
                                flexDirection: 'row',
                                paddingHorizontal: 10,
                                paddingVertical: 10,
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <MaterialCommunityIcons name="close" size={20} color={theme.colors.textDim} />
                            <Text style={{ marginLeft: 4, color: theme.colors.textDim, fontFamily: 'Pretendard', fontSize: 13 }}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Page Jump Modal */}
            <CustomModal
                visible={showPageModal}
                title="페이지 이동"
                message={
                    <View style={{ padding: 16 }}>
                        <Text style={{ color: theme.colors.textDim, marginBottom: 8, fontSize: 14 }}>
                            이동할 페이지 (1 ~ {totalPages})
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: theme.colors.primary,
                                borderRadius: 8,
                                padding: 12,
                                color: theme.colors.text,
                                fontSize: 18,
                                textAlign: 'center',
                                backgroundColor: `${theme.colors.primary}10`,
                                fontFamily: 'Pretendard'
                            }}
                            keyboardType="number-pad"
                            value={targetPageInput}
                            onChangeText={setTargetPageInput}
                            autoFocus
                            selectTextOnFocus
                            onSubmitEditing={() => {
                                const page = parseInt(targetPageInput);
                                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                    setCurrentPage(page - 1);
                                    setShowPageModal(false);
                                } else {
                                    showToastMessage('올바른 페이지를 입력하세요');
                                }
                            }}
                        />
                    </View>
                }
                cancelText="취소"
                onCancel={() => setShowPageModal(false)}
                confirmText="이동"
                onConfirm={() => {
                    const page = parseInt(targetPageInput);
                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                        setCurrentPage(page - 1);
                        setShowPageModal(false);
                    } else {
                        showToastMessage('올바른 페이지를 입력하세요');
                    }
                }}
            />

            {/* Action Menu Modal */}
            <ActionMenuModal
                visible={showActionMenu}
                title="일괄 작업"
                actions={actionMenuActions}
                onClose={() => setShowActionMenu(false)}
            />

            {/* BGM Selection Modal */}
            <BgmSelectionModal
                visible={showBgmModal}
                onClose={() => setShowBgmModal(false)}
                onSelect={(trackKey) => {
                    setSettings({ bgmTrack: trackKey });
                    audioPlayer.stopBgm();
                }}
                currentTrack={settings.bgmTrack}
            />
        </SafeAreaView>
    );
};
