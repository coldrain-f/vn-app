# VN;READER

Steins;Gate 스타일 비주얼 노벨 일본어 학습 앱 (React Native / Expo)

## 주요 기능

### 리더 화면
- 일본어 문장 + 후리가나 표시
- 한국어 번역 토글
- 스와이프 제스처로 문장 이동
- 한자 롱프레스 → 한자 정보 모달
- AI 해설 생성 (Claude API)
- 음성/BGM 재생

### 데이터 관리
- 문장 목록/북마크/추가/사전/설정 탭
- AI 일괄 처리 (읽기, 번역, 해설 생성)
- 백업 내보내기/불러오기 (JSON)
- 7가지 테마 지원

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
./node_modules/.bin/expo start
```

## 빌드 방법

### Android APK 빌드
```bash
# EAS CLI 설치 (최초 1회)
npm install -g eas-cli

# EAS 로그인
eas login

# 빌드 (클라우드) - APK로 직접 설치 가능
eas build --platform android --profile preview
```

**EAS 빌드 후 설치 방법:**
1. 빌드 완료 후 EAS 대시보드에서 APK 다운로드
2. 폰에 APK 파일 전송 (USB, 클라우드 등)
3. "알 수 없는 소스 설치 허용" 설정 후 설치

| 프로필 | 용도 | 결과물 |
|--------|------|--------|
| `preview` | 테스트/개인용 | APK (직접 설치) |
| `production` | 스토어 배포용 | AAB (Play Store 전용) |

```bash
# 로컬 빌드 (Android SDK 필요)
npx expo prebuild
cd android && ./gradlew assembleRelease
# APK 파일 위치: android/app/build/outputs/apk/release/app-release.apk
```

### 로컬 빌드 환경 설정 (Windows)

1. [Android Command-line Tools](https://developer.android.com/studio#command-tools) 다운로드
2. 압축 해제 후 원하는 위치에 배치 (예: `C:\Android\cmdline-tools\latest`)
3. 환경변수 설정:
   ```
   ANDROID_HOME = C:\Android
   Path에 추가: %ANDROID_HOME%\cmdline-tools\latest\bin
   Path에 추가: %ANDROID_HOME%\platform-tools
   ```
4. SDK 설치:
   ```bash
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```
5. 빌드 실행:
   ```bash
   npx expo prebuild
   cd android && ./gradlew assembleRelease
   ```

### iOS 빌드 (Mac 필요)
```bash
# 빌드 (클라우드)
eas build --platform ios --profile preview

# 로컬 빌드
npx expo prebuild
cd ios && xcodebuild -workspace VnReaderApp.xcworkspace -scheme VnReaderApp
```

## 캐시 초기화 (Git Bash)

```bash
rm -rf "$LOCALAPPDATA/Temp/metro-cache"
```

## 기술 스택

- React Native + Expo
- TypeScript
- Zustand (상태 관리)
- Claude API (AI 생성)
- expo-av (오디오)

## 프로젝트 구조

```
src/
├── components/    # 공통 컴포넌트
├── screens/       # 화면 (ReaderScreen, ManagerScreen)
├── services/      # API, 오디오, 햅틱
├── store/         # Zustand 상태
├── styles/        # 스타일
├── theme/         # 테마 정의
├── types/         # TypeScript 타입
└── utils/         # 유틸리티 (후리가나. 한자 등)
```

## 개발 진행 현황

자세한 개발 진행 상황은 [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md)를 참고하세요.
