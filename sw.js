/* Perfect Brow — service worker
   앱 셸은 즉시 캐시, MediaPipe CDN 자산은 처음 사용할 때 캐시(런타임 캐시).
   → 한 번 열어두면 인터넷 없이도 동작합니다. */

const VERSION = "pb-v166"; /* v3.27.0 — 아치 규칙 (원장님 확정 2026-09-02, 일자형 파우더 눈썹 실제 사진): ① 아치두께 5칸 상한 폐지(읽은 값 그대로 = C) ② 마지노선 1.5칸 여유(작은 위반은 일자 눈썹, 큰 위반만 그늘로 올림) ③ 아치선 넘버링 하한 15 → 꼬리 자리+3칸(상한 25 유지). pb-v165 = v3.26.0. */
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
