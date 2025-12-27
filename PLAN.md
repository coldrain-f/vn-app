# VN-Reader Development Plan: VN-Pack Integration

VN-Forge에서 생성된 `.vnpack` 파일을 VN-Reader 앱으로 가져와서 사용하기 위한 계획입니다.
기존 아키텍처와 일관성을 유지하기 위해 **File System 기반**으로 데이터를 관리합니다.

## 1. 사전 준비 (Dependencies)

- `react-native-webview`: 사전 엔트리(HTML) 표시용
- `jszip`: `.vnpack` (ZIP) 압축 해제용

> **Note**: `expo-sqlite` 대신 `expo-file-system`을 활용하여 JSON 파일로 데이터를 관리합니다.

## 2. 파일 시스템 구조 설계

`FileSystem.documentDirectory` 내에 다음과 같이 저장합니다.

```
documentDirectory/
├── novels.json             # 설치된 Novel 목록 (메타데이터)
└── novels/
    └── {novel_id}/         # Novel 별 폴더
        ├── sentences.json  # 문장 데이터
        └── dictionary.json # 사전 데이터 (CSS + Entries)
```

**[novels.json 구조]**
```json
[
  {
    "id": "Steins;Gate_20251227",
    "title": "Steins;Gate",
    "importedAt": "2025-12-27T...",
    "sentenceCount": 1500
  }
]
```

## 3. 구현 단계 (Workflow)

### Phase 1: 기반 구축
- [x] `react-native-webview`, `jszip` 설치 (Note: `npm install` need to be run by user)
- [x] `src/services/NovelStorageService.ts` 구현:
  - [x] `loadNovelList()`: `novels.json` 읽기/쓰기
  - [x] `saveNovelData(id, sentences, dictionary)`: 파일 시스템에 저장
  - [x] `loadNovelData(id)`: 문장 및 사전 데이터 로드

### Phase 2: Import 로직 구현 (`src/services/ImportService.ts`)
- [x] `expo-document-picker`로 `.vnpack` 선택
- [x] `jszip`으로 압축 해제 (메모리 로드 주의)
- [x] `sentences.json`에서 `novelId`, `novelName` 등 메타데이터 추출
- [x] `novels/{novel_id}` 폴더 생성 및 JSON 파일 저장
- [x] `novels.json` 목록 업데이트

### Phase 3: UI 연동
- [x] **ManagerScreen**: `Import` 버튼 및 '소설' 탭 추가
- [x] **Novel List**: 설치된 Novel 목록 표시 및 관리 기능 구현
- [x] **NovelReader**: 선택된 Novel 데이터 로드 로직 구현 (`activateNovel`으로 메인 파일 교체)

### Phase 4: 사전 팝업 (`DictionaryModal`)
- [ ] `WebView` 추가
- [ ] `dictionary.json`의 `css`와 `entries`를 사용하여 HTML 렌더링
- [ ] 탭(Tab) UI로 사전 간 전환 지원

## 4. 파일 구조 제안

```
src/
├── components/
│   ├── DictionaryModal.tsx   # WebView 포함 모달
│   └── ...
├── services/
│   ├── NovelStorageService.ts # File System Wrapper
│   └── ImportService.ts      # Zip & Import Logic
├── screens/
│   ├── ManagerScreen.tsx     # Import Button
│   └── ReaderScreen.tsx      # 문장 표시
└── types/
    └── index.ts              # 데이터 타입 정의
```
