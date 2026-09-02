/* Perfect Brow — service worker
   앱 셸은 즉시 캐시, MediaPipe CDN 자산은 처음 사용할 때 캐시(런타임 캐시).
   → 한 번 열어두면 인터넷 없이도 동작합니다. */

const VERSION = "pb-v158"; /* v3.19.0 — 「사용자가 드로잉한것을 최대한 반영하도록」(원장님 지시 2026-09-02): 미러링 점선의 앞머리→아치 구간도 이제 편 드로잉 궤적을 따라간다(두 점 에르미트 폐지 · 규칙: 아치로 갈수록 올라가기만, 두께는 앞머리~아치 두께 사이). 아치→꼬리는 이동평균 창 9→7, 꼬리 모으기 35%→25%로 드로잉에 더 붙게. 아치 뒤 규칙(패임·되돌아오름·굵어짐 금지)과 앞머리 두께 하한은 그대로. 실제 사진 헤드리스 재검증 완료(사진 저장 안 함). 판정 로직 그대로. */
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
