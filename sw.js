/* Perfect Brow — service worker
   앱 셸은 즉시 캐시, MediaPipe CDN 자산은 처음 사용할 때 캐시(런타임 캐시).
   → 한 번 열어두면 인터넷 없이도 동작합니다. */

const VERSION = "pb-v161"; /* v3.22.0 — 미러링 표시를 v3.15.0(읽은 점을 그대로 찍는 방식)으로 되돌림 (원장님 결정 2026-09-02 「더 엉망이다. v3.15.0으로 돌아가는게 최선」 · 「너의 좌표는 추측이 아주 많은것 같다」). v3.16.0~v3.20.1의 표시 규칙(5점 곡선·두께 띠·단조·직선 클램프·연한 패스 넓히기)은 전부 폐기 — app.js 는 v3.15.0 그대로(버전 문자열만 다름). 판독·판정 로직은 그 사이에도 건드린 적 없음. */
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
