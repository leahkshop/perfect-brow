# Perfect Brow — 눈썹 밸런스 가이드 (웹앱)

PMU 아티스트용 눈썹 대칭·밸런스 가이드 도구.
브라우저에서 단독 실행되며 **서버가 필요 없습니다.** 사진은 기기 밖으로 나가지 않습니다.

### 🔗 https://leahkshop.github.io/perfect-brow/

> 📌 **코드를 고치기 전에 반드시 [`BASELINE.md`](./BASELINE.md) 를 읽으세요.**
> 지키지 않으면 조용히 깨지는 규칙(좌표계·대칭·프리셋 저장소)이 정리돼 있습니다.
> 고친 뒤에는 `node regression-test.mjs` 로 15개 항목을 자동 검증하세요.

> **가로(landscape) 모드 · 양손 조작 기준으로 설계**되었습니다.
>
> ```
> [ 왼손 ]        [   사진   ]        [ 오른손 ]
>  라인 선택        가이드 표시         위치·보정 조절
>  Eye/Front/…                        슬라이더 · ＋ －
> ```
>
> 왼손 엄지로 조절할 바를 고르고, 오른손으로 그 바를 위아래(좌우)로 움직입니다.
> 세로로 들어도 정상 동작하며(위=도구, 가운데=사진, 아래=조절) 회전하면 자동 전환됩니다.

---

## 1. 사용하기

**이미 배포돼 있습니다.** 폰·태블릿에서 아래 주소를 열면 바로 씁니다.

### https://leahkshop.github.io/perfect-brow/

인터넷 없이 혼자 확인만 하려면 `perfect-brow-standalone.html` 을 더블클릭하세요 (전부 한 파일에 들어있는 버전).

---

## 2. 수정한 내용을 반영하기

1. 파일 수정 (`index.html` / `app.js`)
2. `node regression-test.mjs` → **15개 항목 전부 통과 확인**
3. GitHub 저장소에서 `Add file` → `Upload files` → 해당 파일 덮어쓰기 → Commit
4. 약 1분 뒤 위 주소에 자동 반영

로컬에서 먼저 보려면:

```bash
python3 -m http.server 8080     # 이 폴더에서 실행
# http://localhost:8080
```

---

## 3. 아이폰 / 아이패드 홈 화면에 앱으로 설치

1. **사파리**로 위 주소 열기 (크롬 아님 — 사파리여야 설치됨)
2. 하단 **공유 버튼** → **홈 화면에 추가**
3. 홈 화면에 나비 아이콘 생성 → 누르면 주소창 없이 전체화면 실행
4. 실행 후 **기기를 가로로 눕혀서** 사용하세요 (제어판에서 화면 회전 잠금 해제)

안드로이드는 크롬 **⋮ 메뉴 → 앱 설치**.

한 번 열어두면 **오프라인에서도 동작**합니다 (시술실 와이파이가 약해도 OK).

---

## 4. 사용법

| 기능 | 조작 |
| --- | --- |
| **선 옮기기** | 화면의 선을 **손가락으로 직접 끌기** |
| 선 미세조정 | **오른쪽** `위치 조절` 슬라이더 / `−` `+` |
| 선 선택·표시 | 색상 버튼 — **1번 탭 = 선택, 다시 탭 = 숨김/표시**<br>(가로 = **왼쪽 세로 레일**, 세로 = 캔버스 하단) |
| 사진 확대·회전 | 두 손가락 핀치 / 비틀기 (또는 `사진 보정` 슬라이더) |
| 사진 이동 | 선이 없는 곳을 한 손가락으로 끌기 |
| **동공정렬** | 상단 `◎ 동공정렬` → 양쪽 눈동자 중앙을 차례로 탭 → 수평·중앙·확대 자동 정렬 |
| 사진 잠금 | `🔒 사진잠금` — 사진은 고정, 선은 계속 조절 가능 |
| 전체 선 숨김 | 캔버스 좌상단 `all line` |
| V형 기본구조 | 우상단 `V Center Pivot`(기준점 높이) / `V Angle`(벌어짐 각도) |
| 프리셋 | `☆ 프리셋` → 로드 / 현재 설정 저장 / 이름변경 / 삭제 |
| 결과 저장 | `⬇ 이미지저장` — 사진 + 가이드라인을 PNG로 저장 |

### 가이드 라인

| 버튼 | 색 | 의미 |
| --- | --- | --- |
| Eye | 빨강 | 동공 수평 기준선 |
| Front | 검정 | 눈썹 앞머리 높이 |
| F.T | 검정 | 앞머리 두께 |
| Arch | 파랑 | 눈썹 산 |
| A.T | 파랑 | 산 두께 |
| Tail | 보라 | 눈썹 꼬리 |
| Center | 검정 | 얼굴 중심 (움직이면 나머지 세로선이 함께 이동) |
| Inner | 검정 | 눈 앞머리 — **Center 기준 좌우 대칭** |
| Outer | 파랑 | 눈꼬리 — **Center 기준 좌우 대칭** |

---

## 5. AI 얼굴 자동 인식

사진을 고르면 **기기 안에서** 얼굴 랜드마크를 인식해 자동 정렬합니다
(동공 수평 맞춤 → 중앙 정렬 → 확대 → Inner/Outer/눈썹 라인 자동 배치).

- 모델은 **처음 한 번만** 인터넷에서 내려받고, 이후에는 캐시되어 오프라인 동작합니다.
- 사진은 **어디에도 업로드되지 않습니다.** 전부 브라우저 안에서 처리됩니다.
- 인식이 안 되면 `◎ 동공정렬`로 두 번 탭하면 동일한 정렬이 즉시 됩니다.

### 자체 서버 AI를 붙이고 싶다면

`app.js` 맨 위 `SERVER_AI_ENDPOINT` 에 주소를 넣으세요.
`POST { imageUrl }` → `FaceAnalysisResult` JSON 을 돌려주면 됩니다.
(기존 Manus 서버의 `brow.analyzeFace` 와 같은 형식)

---

## 6. 앱스토어 / 구글플레이 등록 (나중 단계)

이 웹앱 코드를 **다시 짤 필요 없이** 그대로 네이티브 앱으로 감쌀 수 있습니다.

```bash
npm init -y
npm i @capacitor/core @capacitor/ios @capacitor/android
npm i -D @capacitor/cli
npx cap init "Perfect Brow" com.perfectbrow.app --web-dir=.
npx cap add ios
npx cap add android
npx cap open ios        # Xcode 에서 빌드 → App Store Connect 업로드
npx cap open android    # Android Studio 에서 빌드 → Play Console 업로드
```

필요한 것: Xcode(맥), Apple Developer Program 연 $99, Google Play Console 1회 $25.
심사는 보통 1~3일 걸립니다.

---

## 7. 파일 구성

```
perfect-brow/
├── index.html              화면 구조 + 전체 CSS
├── app.js                  전 로직 (상단 주석에 1~9 섹션 지도)
├── manifest.webmanifest    앱 이름·아이콘·가로 고정·전체화면
├── sw.js                   오프라인 캐시
├── icon-192.png            아이콘 (파일 추가 시 sw.js SHELL_FILES 에도 추가)
├── icon-512.png
├── apple-touch-icon.png
├── BASELINE.md             🔒 잠금 사양 · 복구 방법  ← 작업 전 필독
├── regression-test.mjs     ✅ 자동 회귀 테스트 (15항목)
└── README.md               이 문서
```

### 자주 바꿀 만한 값 (`app.js` 상단)

| 위치 | 내용 |
| --- | --- |
| `H_SPECS` / `V_SPECS` | 각 선의 **색상 · 두께 · 길이** |
| `DEFAULT_GUIDE` | 선의 **기본 위치 · 기본 표시 여부** |
| `ZOOM_MIN/MAX`, `ROT_MAX`, `V_ANGLE_MAX` | 줌 0.5~8배, 회전 ±30°, V각도 ±40° |
| `EYE_FRAC`, `R_INNER`, `R_OUTER` | 자동 정렬 기준 비율 |
| `BUILTINS()` | 기본 프리셋 3종 |
| `I18N` | 한국어/영어 문구 |

---

## 8. 원본(Manus Expo 프로젝트) 대비 달라진 점

원본 `perfect-brow-source` 폴더는 **하나도 건드리지 않았습니다.**

**고친 것**

- 라인 직접 드래그 — 원본은 `PanResponder`를 import만 하고 미구현, SVG가 `pointerEvents="none"` 이라 아예 동작 불가였음
- 프리셋 저장 — 원본은 저장 모달을 여는 버튼이 없었고, `loadPresets`가 매번 저장소를 기본값으로 덮어써서 저장분이 사라졌음
- 줌 자동 중앙정렬 단위 오류 — 정규화 변수에 픽셀값을 넣고 렌더링에서 캔버스 폭을 또 곱해 약 400배 어긋남
- 핀치/드래그 튐 — 누적 이동량을 매 프레임 델타처럼 더하던 문제
- 네이티브에서 안 그려지던 요소 — 소문자 `<circle> <rect> <path>` 사용으로 눈 가이드·라벨·기준점이 웹에서만 보였음
- Front / F.T 가 같은 길이로 그려지던 문제
- 라벨 겹침 — 세로/가로 라벨 자동 회피 배치
- 화면 회전·리사이즈 미대응 (모듈 로드 시점에 화면 크기를 한 번만 읽던 문제)

**뺀 것**

- Manus 종속 전부 (forge.manus.ai LLM, manus.computer 터널, Manus OAuth, TiDB, iframe 브리지)
- 사용되지 않던 죽은 코드 (h4, arch, spacing, lineColor, lineOpacity, pivotPointY 등)

**더한 것**

- `◎ 동공정렬` — 눈동자 두 번 탭으로 즉시 정렬 (AI 없이도, 오프라인에서도 동작)
- 결과 이미지 PNG 저장
- 오프라인 실행 · 홈 화면 앱 설치
- 가로 모드 양손 레이아웃 — 왼쪽 라인 레일 / 가운데 사진 / 오른쪽 조절 패널
  (원본 `design.md`의 "메인 캔버스 + 우측 조절 패널" 구조를 실제로 구현하고 왼손 선택 레일을 추가)
- 모든 선에 흰색 헤일로 — 어두운 피부톤/배경에서도 선이 보이게

---

## 9. ⚠️ 보안 — 반드시 확인

원본 `perfect-brow-source/.project-config.json` 안에 **실제 인증정보가 평문으로** 들어 있습니다.

- TiDB 데이터베이스 접속 비밀번호
- AWS 액세스 키 / 세션 토큰
- JWT 시크릿, Manus API 키

이 폴더를 **GitHub에 올리거나 남에게 전달하면 안 됩니다.**
지금 만든 웹앱에는 이 값들이 전혀 포함돼 있지 않습니다.
