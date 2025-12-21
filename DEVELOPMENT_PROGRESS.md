# VN;READER React Native 개발 진행 상황
> 마지막 업데이트: 2025-12-21 05:20

## 📱 프로젝트 개요

기존 HTML/CSS/JavaScript 기반 VN;READER 웹앱을 React Native(Expo)로 이식하는 프로젝트입니다.

### 기술 스택
- **Framework**: React Native + Expo SDK 54
- **Navigation**: @react-navigation/stack
- **State Management**: Zustand
- **Storage**: AsyncStorage + FileSystem (JSON)
- **Audio**: expo-av
- **Icons**: @expo/vector-icons (MaterialCommunityIcons)
- **Fonts**: YuMincho (일본어), Pretendard (한국어)
- **Language**: TypeScript

---

## ✅ 완료된 작업

### 1. 프로젝트 설정
- Expo 프로젝트 생성 (`vn-reader-app`)
- 커스텀 폰트 로딩 (YuMincho, Pretendard)
- 전역 폰트 적용 (한국어: Pretendard, 일본어: YuMincho)

### 2. 핵심 기능 구현

#### ReaderScreen (리더 화면)
- 일본어 문장 표시 (YuMincho 폰트)
- **후리가나 표시** - 정규식 수정으로 정확한 한자 위치에 표시
- 번역 토글 (Pretendard 폰트)
- 북마크 기능
- AI 해설 모달
- 좌/우 터치 네비게이션
- **한자 롱프레스 시 정보 모달** - 진동 피드백, 복수 한자 선택 지원
- **음성 자동 재생** - 문장 전환 시 자동 재생 (설정 가능)
- **다시 듣기 버튼** - 스피커 아이콘으로 현재 문장 음성 재생

#### ManagerScreen (데이터 관리)
- 문장 목록 탭 (검색, 페이지네이션)
- 북마크 탭
- 문장 추가 탭 (AI 읽기/번역 생성)
- 설정 탭 (API 키, 테마, 백업/복원)
- **음성 설정** - 자동 재생 토글, 볼륨 조절, 미리 듣기
- **BGM 설정** - 트랙 선택(드롭다운), 자동 재생 토글, 볼륨 조절

#### 공통 컴포넌트
- `FuriganaText` - 후리가나 렌더링 (정규식 버그 수정 완료)
- `Toast` - 알림 메시지
- `Modal` - 커스텀 모달
- `ActionMenuModal` - AI 액션 메뉴 (로딩 상태 지원)

### 3. 오디오 시스템 (2025-12-20 세션)

#### AudioPlayerService (`src/services/audioPlayer.ts`)
- **BGM 재생**: 루프 재생, 볼륨 조절, 트랙 전환
- **Voice 재생**: 문장별 음성 재생, 자동/수동 재생
- **중복 재생 방지**: Request ID 패턴으로 비동기 경쟁 상태 해결

#### Voice 기능
- `playVoice(filename)` - 음성 파일 재생
- `stopVoice()` - 재생 중지
- `setVoiceVolume(volume)` - 볼륨 설정 (0-100)
- **자동 재생**: `settings.voiceAutoplay` 설정에 따라 문장 전환 시 자동 재생

#### BGM 기능
- `playBgm(trackKey)` - BGM 재생 (루프)
- `stopBgm()` - BGM 중지
- `toggleBgm(trackKey)` - 재생/중지 토글
- `setBgmVolume(volume)` - 볼륨 설정 (0-100)
- **트랙 목록**: gate_of_steiner, noisy_times

### 4. 디자인 시스템
- 7가지 테마 (steinsgate, cyberpunk, ocean, sakura, amber, monochrome, modern)
- MaterialCommunityIcons 벡터 아이콘

---

## 🐛 해결된 문제들

### 1. Native Stack Navigator 에러
**해결**: `@react-navigation/stack`으로 변경

### 2. AsyncStorage 용량 제한
**해결**: 번들된 데이터는 메모리에서 직접 사용

### 3. "Unexpected text node" 에러
**원인**: `{condition && (...)}` 패턴에서 `false`가 텍스트로 렌더링됨
**해결**: 모든 조건부 렌더링을 `{condition ? (...) : null}` 패턴으로 변경

### 4. 폰트 형식 오류
**해결**: TTF 형식 폰트만 사용 (woff 불가)

### 5. 후리가나 정렬 오류 (핵심 버그)
**원인**: 정규식이 한자 외 문자까지 캡처
```javascript
// 수정 - 한자만 캡처
/[\u4E00-\u9FFF\u3400-\u4DBF々]+\[([^\]]+)\]/g
```

### 6. SQLite DB Lock 이슈
**최종 해결**: SQLite 제거 및 FileSystem(JSON) 방식으로 완전 마이그레이션 (락 문제 원천 해결)

### 7. 오디오 중복 재생 이슈 (2025-12-20)
**상황**: 빠르게 문장을 넘기면 음성이 중첩 재생됨
**원인**: `createAsync()`가 비동기라서 완료 전에 새 요청이 들어오면 이전 요청이 취소되지 않음
**해결**: 
```typescript
// Request ID 패턴으로 stale request 무효화
private voiceRequestId: number = 0;

async playVoice(filename: string) {
    const thisRequestId = ++this.voiceRequestId;
    // ... createAsync 실행 ...
    
    // 새 요청이 들어왔으면 이 요청은 폐기
    if (thisRequestId !== this.voiceRequestId) {
        await sound.unloadAsync();
        return false;
    }
}
```

### 8. stopVoice Race Condition
**상황**: 빠르게 호출 시 `Cannot read property 'unloadAsync' of null` 에러
**해결**: 로컬 변수에 참조 저장 후 즉시 인스턴스 변수 null로 설정
```typescript
async stopVoice() {
    const sound = this.voiceSound;  // 로컬에 저장
    this.voiceSound = null;         // 즉시 null로
    if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
    }
}
```

### 9. ⚠️ Metro EMFILE 에러 (Windows)
**상황**: 앱을 껐다가 다시 들어오면 발생
```
Metro has encountered an error: EMFILE: too many open files
The development server returned response error code 500
```
**원인**: 
- Windows에서 Metro bundler가 파일 핸들을 과다하게 열어둠
- Voice 파일이 ~14000개라서 번들링 시 파일 핸들 부족
- 앱 재시작 시 Metro 캐시와 충돌

**임시 해결책**:
```bash
# Metro 캐시 삭제 및 재시작
npx expo start --clear

# 또는 수동으로 캐시 삭제
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\metro-cache"
```

**근본적 해결책 (미적용)**:
- Voice 파일을 앱 번들에서 제외하고 CDN/외부 서버에서 로드
- 또는 Windows에서 파일 핸들 제한 늘리기 (레지스트리 수정 필요)

### 10. 통계 모달 닫기 동작 수정
**상황**: 통계 모달 내부를 터치해도 모달이 닫히는 문제
**해결**: `Pressable`과 `stopPropagation()`을 사용하여 내부 터치 이벤트 전파 차단

### 11. 문장 편집 모달 AI 기능 추가
**상황**: 문장 수정 중 AI 도움을 받을 수 있는 기능 부재
**해결**: 문장 편집 모달의 읽기, 의미, 메모 필드에 AI 생성 버튼 추가

### 12. ThemeColors 타입 에러 수정
**상황**: `ThemeColors` 인터페이스에 `success` 속성이 없어 TS 에러 발생
**해결**: `src/theme/index.ts`에 `success` 속성 추가 및 모든 테마에 색상 값(`#4caf50` 등) 적용

## 📁 프로젝트 구조

```
vn-reader-app/
├── App.tsx                    # 메인 앱 (폰트/한자 데이터 로딩)
├── assets/
│   ├── fonts/                 # YuMincho, Pretendard
│   ├── BGM/                   # 배경음악 파일
│   ├── Voice/                 # 음성 파일 (~14000개)
│   └── resources/
│       ├── vn-reader-data.json
│       └── kanji-data.json    # 한자 정보 (3159개)
└── src/
    ├── components/common/     # FuriganaText, Modal, Toast, ActionMenuModal
    ├── config/
    │   └── voiceAssets.ts     # Voice 파일 맵 (자동 생성)
    ├── screens/               # ReaderScreen, ManagerScreen
    ├── store/useAppStore.ts   # Zustand (settings 포함)
    ├── services/
    │   ├── storage.ts         # FileSystem JSON 저장소
    │   ├── claudeApi.ts       # Claude API 연동
    │   └── audioPlayer.ts     # BGM/Voice 재생 서비스
    ├── theme/index.ts         # 7가지 테마
    └── utils/furigana.ts      # 파싱 (정규식 수정됨)
```

---

## 📝 개발 메모

### React Native 주의사항
- **폰트**: TTF/OTF만 지원
- **조건부 렌더링**: `&&` 대신 `? : null` 패턴 사용
- **후리가나 정규식**: `/[\u4E00-\u9FFF\u3400-\u4DBF々]+\[([^\]]+)\]/g`

### 오디오 개발 주의사항
- **비동기 경쟁 상태**: `createAsync()`는 취소 불가 → Request ID 패턴 필수
- **중복 재생 방지**: 같은 파일 재생 중이면 skip하는 로직 필요
- **메모리 관리**: 반드시 `unloadAsync()` 호출하여 리소스 해제
- **화면 전환**: ManagerScreen 진입 시 Voice 정지, BGM은 유지

### Voice Assets 생성
```bash
node scripts/generateVoiceMap.js
# → src/config/voiceAssets.ts 자동 생성
```

### 실행 방법
```bash
cd vn-reader-app
npx expo start
# r: 새로고침, w: 웹, j: 디버거
```

### 개발 실행(제거 금지)
```bash
./node_modules/.bin/expo start
```
### 캐시 초기화 명령어 - Git Bash (제거 금지)
rm -rf "$LOCALAPPDATA/Temp/metro-cache"
---

## 🔜 향후 작업 예정

### 높은 우선순위
- [x] BGM 자동 재생 (ReaderScreen 진입 시) ✅ 2025-12-20
- [x] 배치 작업 (AI 읽기/번역/해설/검증 일괄 생성) ✅ 2025-12-21
- [x] 읽기 사전 관리 (DICT 탭) ✅ 2025-12-20
- [x] AI 프롬프트 개선 (사전 필터링, Few-shot 예시) ✅ 2025-12-20
- [x] 모델 선택 UI 개선 (Opus/Sonnet/Haiku + 버전 입력) ✅ 2025-12-20
- [x] 통계 모달 (로고 클릭 시 표시, 프로그레스 바 포함) ✅ 2025-12-20

### 중간 우선순위
- [x] 북마크 검색/페이지네이션 ✅ 2025-12-21
- [x] 스와이프 제스처 네비게이션 (좌/우 스와이프로 문장 이동) ✅ 2025-12-21
- [x] Splash Screen 커스터마이징 (앱 로딩 화면) ✅ 2025-12-21
- [x] 햅틱 피드백 강화 (버튼 클릭, 문장 이동 시 진동) ✅ 2025-12-21

---

## � 추천 개발 기능 (미래)

### 학습 강화
- [ ] 단어장 기능 (한자/단어 저장 및 복습)
- [ ] 플래시카드 모드 (암기용 카드 뒤집기)
- [ ] 학습 통계 대시보드 (일일/주간 학습량, 연속 학습일)
- [ ] 퀴즈 모드 (읽기/뜻 맞추기)

### UI/UX 개선
- [ ] 다크/라이트 모드 자동 전환 (시스템 설정 연동)
- [ ] 문장 검색 기능 (표현/번역/화자로 검색)
- [ ] 탭 제스처로 빠른 후리가나/번역 토글
- [ ] 문장 위치 기억 (마지막 읽은 위치 자동 저장)

### 데이터 관리
- [ ] 클라우드 동기화 (Google Drive / iCloud)
- [ ] CSV/Excel 가져오기/내보내기
- [ ] 여러 작품 관리 (프로젝트/폴더 개념)
- [ ] 문장 태그 기능 (장면, 캐릭터별 분류)

### AI 기능 확장
- [ ] 문법 해설 자동 생성
- [ ] 유사 표현 추천
- [ ] 발음 TTS (Text-to-Speech)
- [ ] 음성 인식으로 읽기 연습

## �💡 재개 시 팁

```
VN;READER React Native 프로젝트를 이어서 개발하려고 해. 
DEVELOPMENT_PROGRESS.md 파일을 확인하고 [기능명]을 구현해줘.
```

### Settings 타입 (참고용)
```typescript
interface Settings {
    apiKey: string;
    apiModel: string;
    bgmVolume: number;      // 0-100
    bgmAutoplay: boolean;
    bgmTrack: string;       // 'gate_of_steiner' | 'noisy_times'
    voiceVolume: number;    // 0-100
    voiceAutoplay: boolean;
    theme: ThemeName;
    showFurigana: boolean;
    showTranslation: boolean;
    password: string;
}
```

### 5. Manager Screen 고도화 (2025-12-21 세션)

#### Batch AI Workflow (일괄 생성 프로세스 2.0)
- **개념**: 기존의 '선택 -> 건별 모달 확인' 방식을 **'선택 -> 일괄 생성 -> 일괄 검토 리스트'** 방식(Post-Process Review)으로 변경
- **BatchResultModal**: 생성된 결과를 리스트(FlatList)로 한 번에 보여주고, 체크박스로 선택 적용 가능
- **UI 최적화**: 
  - 읽기(reading) 결과는 FuriganaText 컴포넌트를 사용하여 **Ruby(후리가나)** 스타일로 렌더링
  - '적용' 버튼에 로딩 인디케이터(ActivityIndicator) 추가 및 버튼 색상 개선 (가독성 향상)
  - 적용 후에도 선택 상태 유지 (편의성 증대)

#### AI Verification (읽기 검증) 기능
- **목적**: 기존 등록된 읽기 정보가 맞는지 AI가 검사
- **로직 개선**: 
  - ai.ts의 verifyReading 함수 연동
  - 검증 결과가 '올바름'인 경우에도 '✓ 검증 완료 (이상 없음)'으로 결과 리스트에 표시 (Empty State 방지)
- **UI 개선**:
  - 검증 결과 모달에서 **[기존 데이터]**와 **[제안 데이터]**를 상하로 배치하여 비교
  - **기존 데이터** 표시에도 FuriganaText를 적용하여 시각적 통일성 확보

#### Layout & Bug Fixes
- **Footer 레이아웃 수정**: FlatList 하단 여백(paddingBottom) 조정으로 페이지네이션이 떠 보이는 현상 해결
- **Selection Bar**: 하단 고정형 전체 너비 디자인 적용 및 **Action Menu(More)** 버튼 구현
- **Action Menu**: 공간 효율을 위해 AI 기능(읽기, 번역, 해설, 검증)을 드롭다운 메뉴로 이동
