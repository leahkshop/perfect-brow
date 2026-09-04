/* Perfect Brow — service worker
   앱 셸은 즉시 캐시, MediaPipe CDN 자산은 처음 사용할 때 캐시(런타임 캐시).
   → 한 번 열어두면 인터넷 없이도 동작합니다. */

const VERSION = "pb-v185"; /* v3.45.0 — 꼬리 쪽도 같은 박스로 잇는다(balBoxTail): 밴드가 멈춘 곳부터 꼬리 자(v4/v5)까지 가늘어지는 몸통을 박스 경계로 이어 미러링 점선이 눈썹 전체를 덮는다 · 눈썹이 끝나면 멈춤(회귀 207). pb-v184 = v3.44.0 — 원장님 아이디어 「작은 박스」(balBoxEdges): 미러링 점선의 위·아래 경계를 열 좌우 6px×두께 절반 박스의 가로 평균 프로필로 다시 잼 — 박스 안 흰(90%)↔검(10%) 중간값을 몸통 쪽에서 처음 3줄 연속 넘는 자리. 대비 없는 열은 원값. 표시 전용(회귀 206). pb-v183 = v3.43.0 — 밴드 판독(columnRuns)의 아랫끝도 발 밑 피부 기준(cutB=base−contrast): 눈두덩이 어두운 플래시 사진에서 덩어리가 창 바닥까지 이어져 미러링 점선이 앞머리 앞 30% 를 비우던 것 — 이제 앞머리까지 잇는다(회귀 205). pb-v182 = v3.42.0 — 앞머리·앞두께(·아치) 판독의 「피부」= 발 밑 피부(darkBlobsUp base): 플래시 사진처럼 눈두덩이 이마보다 어두우면 문턱을 눈두덩↔최암부 중간으로 — 5열 중 3열 후보 0개로 포기하던 확실한 드로잉을 읽는다(회귀 204). pb-v181 = v3.41.0 — 미러링 앞머리 끝 규칙(balFrontEnd): 안쪽 끝 3~4열이 눈두덩 그늘로 꺾여 내려가던 물결을 몸통 흐름으로 잇는다(표시 전용 · 회귀 203). pb-v180 = v3.40.0 — 시작시(자동/수동 눈썹정렬 뒤) 뜨던 진단점 5개(민트 2·초록·분홍·흰, showArchDots) 완전히 숨김 · 설정 시트 세로 모드(rot90)에서 예시 눈썹 미리보기 칸을 스크롤 상단에 고정(position:sticky)해 아래 탭·슬라이더만 그 밑으로 스크롤. pb-v179 = v3.39.0 — 설정 미리보기가 **한 칸**(밝은/어두운 피부는 드래그 슬라이더로 전환, pb_pvskin 저장) · 미리보기에 서브 라인 표시 · 서브 라인 길이(subLen)와 세로선 길이(vlen) 드래그 추가 (세로선은 아래끝 고정 · 윗끝이 아치엣지 밑으로 내려옴). pb-v178 = v3.38.0 — 사진변경=leftDock 왼쪽끝(흰테두리)로, 사진저장=화면 왼쪽위(모든라인숨김·여러라인 앞)로 이동 · 설정 시트는 아이폰 세로 잠금(rot90)에서도 더 이상 가짜 회전 안 함 — 실제 세로 화면 그대로 써서 setcols 1열·글자/스와치/슬라이더 확대 (그리드 블로우아웃 minmax(0,1fr)로 방지 · 스와치·세로선 줄은 줄바꿈 허용). pb-v177 = v3.37.0 — 되돌리기·다시실행 세로 1열(다시실행이 되돌리기 밑) · 미러링 색 도크 밑 투명도 드래그바(S.balOpacity, pb_balopacity 저장) · 가이드 설명 끝 (위아래 바)/(좌우 바) 힌트 삭제. pb-v176 = v3.36.0 — 미러링 선은 부드럽다(balSmoothTrace: 창 40% 2차 곡선 + 몸통 쪽 잔차 분위수 30/70%) — 잔떨림·완만한 불룩함 무시. pb-v175 = v3.35.0 — 미러링 점 양쪽 굵기·투명도 동일(기준쪽 값 r1.5/1.2 · 0.5). pb-v174 = v3.34.0 — 아치두께는 픽셀 판독 그대로(원장님 확정 C): v3.32.0 의 「밴드로 덮기」 폐지 — 색이 피부로 돌아오는 곳까지가 두께. 케이스 2 아치두께 173→188. pb-v173 = v3.33.0 — 미러링 점 색 3종(빨강·노랑·파랑, 초기화 왼쪽, 켜졌을 때만) · 미러링 점은 미러링 버튼으로 끄기 전까지 유지(편집·사진변경 시트에 안 사라짐, 사진 이동 시 다시 잼). pb-v172 = v3.32.0 — 꼬리 높이 = 심 아랫끝(옆으로 더 못 나가도 · 기울기 ≤1.3px/열) + 아치두께 그늘 방어(픽셀 판독이 밴드 아랫선보다 max(4px,0.5칸) 아래면 밴드) — 케이스 2 원장님 확인. pb-v171 = v3.31.0 — 꼬리 쪽 판독 열 연속성(trimOutside ⓕ): 이웃 열과 세로로 안 겹치는 바깥 열은 머리카락 (케이스 1·3 실사진 · 랜드마크 경로 첫 재현). pb-v170 = v3.30.0 — 꼬리 심 추적의 머리카락·그늘 덩어리 방어 (원장님 실기기 확인 2026-09-02, 고개 돌린 각도 사진: 꼬리선이 머리카락 속으로): 심 주변 어두운 줄이 max(30px, 밴드 끝 두께×2) 보다 길거나 위아래 12px 에 피부가 없으면 정지. pb-v169 = v3.29.1. */
const SHELL = "shell-" + VERSION;
const RUNTIME = "runtime-" + VERSION;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL && k !== RUNTIME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // 앱 셸: 네트워크 우선, 실패 시 캐시 (업데이트가 바로 반영되도록)
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))),
    );
    return;
  }

  // CDN(MediaPipe wasm/모델): 캐시 우선
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }),
    ),
  );
});
