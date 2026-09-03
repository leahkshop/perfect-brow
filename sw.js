/* Perfect Brow — service worker
   앱 셸은 즉시 캐시, MediaPipe CDN 자산은 처음 사용할 때 캐시(런타임 캐시).
   → 한 번 열어두면 인터넷 없이도 동작합니다. */

const VERSION = "pb-v176"; /* v3.36.0 — 미러링 선은 부드럽다(balSmoothTrace: 창 40% 2차 곡선 + 몸통 쪽 잔차 분위수 30/70%) — 잔떨림·완만한 불룩함 무시. pb-v175 = v3.35.0 — 미러링 점 양쪽 굵기·투명도 동일(기준쪽 값 r1.5/1.2 · 0.5). pb-v174 = v3.34.0 — 아치두께는 픽셀 판독 그대로(원장님 확정 C): v3.32.0 의 「밴드로 덮기」 폐지 — 색이 피부로 돌아오는 곳까지가 두께. 케이스 2 아치두께 173→188. pb-v173 = v3.33.0 — 미러링 점 색 3종(빨강·노랑·파랑, 초기화 왼쪽, 켜졌을 때만) · 미러링 점은 미러링 버튼으로 끄기 전까지 유지(편집·사진변경 시트에 안 사라짐, 사진 이동 시 다시 잼). pb-v172 = v3.32.0 — 꼬리 높이 = 심 아랫끝(옆으로 더 못 나가도 · 기울기 ≤1.3px/열) + 아치두께 그늘 방어(픽셀 판독이 밴드 아랫선보다 max(4px,0.5칸) 아래면 밴드) — 케이스 2 원장님 확인. pb-v171 = v3.31.0 — 꼬리 쪽 판독 열 연속성(trimOutside ⓕ): 이웃 열과 세로로 안 겹치는 바깥 열은 머리카락 (케이스 1·3 실사진 · 랜드마크 경로 첫 재현). pb-v170 = v3.30.0 — 꼬리 심 추적의 머리카락·그늘 덩어리 방어 (원장님 실기기 확인 2026-09-02, 고개 돌린 각도 사진: 꼬리선이 머리카락 속으로): 심 주변 어두운 줄이 max(30px, 밴드 끝 두께×2) 보다 길거나 위아래 12px 에 피부가 없으면 정지. pb-v169 = v3.29.1. */
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
