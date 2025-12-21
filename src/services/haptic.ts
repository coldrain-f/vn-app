// Haptic Feedback Service
// Provides various haptic feedback patterns for UI interactions
import { Vibration, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export type HapticType =
    | 'light'       // 가벼운 터치 (버튼 클릭)
    | 'medium'      // 중간 (문장 이동)
    | 'heavy'       // 강한 (삭제, 중요 액션)
    | 'success'     // 성공 (저장 완료)
    | 'warning'     // 경고 (확인 필요)
    | 'error'       // 오류
    | 'selection';  // 선택 변경

// Vibration patterns (duration in ms) - 더 잘 느껴지도록 시간 증가
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
    light: 30,          // 가벼운 터치 (버튼 클릭)
    medium: 50,         // 중간 (문장 이동)
    heavy: 100,         // 강한 (삭제, 중요 액션)
    success: [0, 50, 80, 50],    // 짧은 더블 진동
    warning: [0, 80, 120, 80],   // 긴 더블 진동
    error: [0, 150, 80, 150, 80, 150], // 세 번 진동
    selection: 40,      // 선택 변경
};

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
    trigger(type: HapticType = 'light') {
        if (!this.isEnabled()) return;

        // Web에서는 햅틱 지원 안 함
        if (Platform.OS === 'web') return;

        const pattern = HAPTIC_PATTERNS[type];

        if (Array.isArray(pattern)) {
            Vibration.vibrate(pattern);
        } else {
            Vibration.vibrate(pattern);
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
     * 선택 변경 피드백
     */
    selection() {
        this.trigger('selection');
    }
}

// 싱글톤 인스턴스
export const haptic = new HapticService();
