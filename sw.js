/* Perfect Brow — service worker
   앱 셸은 즉시 캐시, MediaPipe CDN 자산은 처음 사용할 때 캐시(런타임 캐시).
   → 한 번 열어두면 인터넷 없이도 동작합니다. */

const VERSION = "pb-v156"; /* v3.17.0 — 미러링 점선 = 눈썹 기본 디자인 규칙: 앞→아치(앞두께→아치엣지 · 앞머리→아치두께)는 두 점만 매끈한 곡선으로 잇고(고객 드로잉 무시), 아치→꼬리(아치엣지/아치두께→꼬리)는 고객 드로잉 궤적을 중앙값+이동평균으로 편 뒤 그대로 따라가다 꼬리 한 점으로 모은다. v3.16.0(아치→꼬리까지 5점만으로 곡선을 만들어 눈썹 모양이 안 나왔던 것)의 수정. 앞머리 두께 하한(≥아치 두께) 규칙 유지. 판정 로직은 그대로. (원장님 지시 2026-09-02) */
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
