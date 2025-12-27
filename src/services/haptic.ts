// Haptic Feedback Service
// Provides various haptic feedback patterns for UI interactions
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';

export type HapticType =
    | 'light'       // 가벼운 터치 (버튼 클릭)
    | 'medium'      // 중간 (문장 이동)
    | 'heavy'       // 강한 (삭제, 중요 액션)
    | 'success'     // 성공 (저장 완료)
    | 'warning'     // 경고 (확인 필요)
    | 'error'       // 오류
    | 'selection';  // 선택 변경 (가장 약함)

class HapticService {
    /**
     * 햅틱 피드백이 활성화되어 있는지 확인 (설정에서 읽음)
     */
    private isEnabled(): boolean {
        try {
            const state = useAppStore.getState();
            return state.settings.hapticEnabled ?? true;
        } catch {
            return true; // 기본값
        }
    }

    /**
     * 햅틱 피드백 실행
     */
    async trigger(type: HapticType = 'light') {
        if (!this.isEnabled()) return;

        // Web에서는 햅틱 지원 안 함
        if (Platform.OS === 'web') return;

        try {
            switch (type) {
                case 'light':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'heavy':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case 'success':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'warning':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
                case 'error':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                case 'selection':
                    // 가장 약한 햅틱 - 선택 변경용
                    await Haptics.selectionAsync();
                    break;
            }
        } catch (e) {
            // 햅틱 실패 시 무시
            console.log('Haptic feedback failed:', e);
        }
    }

    /**
     * 가벼운 터치 피드백 (버튼 클릭)
     */
    light() {
        this.trigger('light');
    }

    /**
     * 중간 세기 피드백 (문장 이동)
     */
    medium() {
        this.trigger('medium');
    }

    /**
     * 강한 피드백 (삭제, 중요 액션)
     */
    heavy() {
        this.trigger('heavy');
    }

    /**
     * 성공 피드백
     */
    success() {
        this.trigger('success');
    }

    /**
     * 경고 피드백
     */
    warning() {
        this.trigger('warning');
    }

    /**
     * 오류 피드백
     */
    error() {
        this.trigger('error');
    }

    /**
     * 선택 변경 피드백 (가장 약함)
     */
    selection() {
        this.trigger('selection');
    }
}

// 싱글톤 인스턴스
export const haptic = new HapticService();
