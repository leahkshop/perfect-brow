/* ═══════════════════════════════════════════════════════════════
   Perfect Brow — 회귀 테스트 (Regression Test)

   코드를 고친 뒤 반드시 실행하세요. 하나라도 FAIL 이면 커밋하지 마세요.

     npm install playwright          (최초 1회)
     npx playwright install chromium (최초 1회)
     node regression-test.mjs

   BASELINE.md 6번 항목과 1:1로 대응합니다.
   ═══════════════════════════════════════════════════════════════ */

import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8931;

/* ── 결과 집계 ───────────────────────────────── */
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "  ✅" : "  ❌"} ${name}${detail ? "  — " + detail : ""}`);
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* ── 테스트용 얼굴 이미지 (6° 기울어짐) 생성 ───── */
function makeTestFace() {
  const W = 900, H = 1200, cx = 450, cy = 470, ang = (6 * Math.PI) / 180;
  const eye = (x, y) => `
    <ellipse cx="${x}" cy="${y}" rx="72" ry="30" fill="#fcfaf7"/>
    <circle cx="${x}" cy="${y}" r="26" fill="#4e3628"/>
    <circle cx="${x}" cy="${y}" r="11" fill="#14100e"/>`;
  const brow = (x, y) => `<path d="M ${x - 80} ${y - 62} Q ${x} ${y - 108} ${x + 80} ${y - 62}"
      stroke="#423028" stroke-width="15" fill="none" stroke-linecap="round"/>`;
  const L = { x: cx - 125 * Math.cos(ang), y: cy - 125 * Math.sin(ang) };
  const R = { x: cx + 125 * Math.cos(ang), y: cy + 125 * Math.sin(ang) };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#e8e2dc"/>
    <rect x="${cx - 90}" y="700" width="180" height="${H - 700}" fill="#e2beA6"/>
    <ellipse cx="${cx}" cy="490" rx="235" ry="340" fill="#eecbb2"/>
    <ellipse cx="${cx}" cy="260" rx="255" ry="170" fill="#3c2c26"/>
    <ellipse cx="${cx}" cy="368" rx="215" ry="152" fill="#eecbb2"/>
    ${eye(L.x, L.y)}${eye(R.x, R.y)}${brow(L.x, L.y)}${brow(R.x, R.y)}
    <path d="M ${cx} 500 L ${cx - 14} 610" stroke="#cea68e" stroke-width="6" fill="none"/>
    <ellipse cx="${cx}" cy="694" rx="62" ry="22" fill="#c46e68"/>
  </svg>`;
  const p = path.join(ROOT, ".test-face.svg");
  fs.writeFileSync(p, svg);
  return { file: p, pupilL: L, pupilR: R, iw: W, ih: H };
}

/* ── 정적 서버 ───────────────────────────────── */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json", ".json": "application/json", ".md": "text/markdown" };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const face = makeTestFace();
const URL_BASE = `http://127.0.0.1:${PORT}/index.html`;

console.log("\n━━━ Perfect Brow 회귀 테스트 ━━━\n");

/* 특수 환경에서 크로미움 경로를 직접 지정해야 할 때: PB_CHROME=/path/to/chrome node regression-test.mjs */
const browser = await chromium.launch(
  process.env.PB_CHROME ? { executablePath: process.env.PB_CHROME } : {},
);

/* ═══════ A. 세로(portrait) — 기능 테스트 ═══════ */
console.log("[세로 모드 · 기능]");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|ERR_|status of 404/.test(m.text())) errs.push(m.text()); });

  await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  /* v1.8.0: 기본값(auto)은 세로 기기를 무조건 가로로 돌린다.
     이 블록은 "회전 없는" 좌표계에서 기능을 검증하는 곳이므로 폴백 모드(off)로 고정한다. */
  await p.evaluate(() => localStorage.setItem("pb_orient", "off"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(500);
  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1200);

  check("1. 페이지 로드 · JS 오류 없음", errs.length === 0, errs.join(" | "));

  // 33. 앱을 열자마자 두 조절자가 모두 보여야 한다 (어느 하나도 숨기지 않음)
  const bothOpen = await p.evaluate(() => {
    const vis = (id) => {
      const e = document.getElementById(id), r = e.getBoundingClientRect();
      return getComputedStyle(e).display !== "none" && r.width > 20 && r.height > 20;
    };
    return { v: vis("posCtlV"), h: vis("posCtlH"), selUD: window.PB.S.selUD, selLR: window.PB.S.selLR };
  });
  check("33. 앱 실행 직후 두 조절자 모두 표시", bothOpen.v && bothOpen.h,
    `세로=${bothOpen.v} 가로=${bothOpen.h} 대상=${bothOpen.selUD}/${bothOpen.selLR}`);

  // 11. 폴백(⟳ 끔) 세로 레이아웃에서 라인 버튼이 캔버스 안에 있는지
  const inStage = await p.evaluate(() => document.getElementById("stage").contains(document.getElementById("hButtons")));
  check("11. 세로 폴백 레이아웃 — 라인 버튼이 캔버스 하단", inStage);

  const box = await p.locator("#stage").boundingBox();

  // 2. 라인 드래그
  const y0 = await p.evaluate(() => window.PB.S.g.h1);
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * y0);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * y0 + 60, { steps: 12 });
  await p.mouse.up();
  const y1 = await p.evaluate(() => window.PB.S.g.h1);
  const moved = (y1 - y0) * box.height;
  check("2. 라인 직접 드래그 (60px)", near(moved, 60, 3), `${moved.toFixed(1)}px`);

  // 5. Center 이동 시 동반 이동
  await p.evaluate(() => { window.PB.S.g.v4Visible = true; window.PB.render(); });
  const before = await p.evaluate(() => ({ ...window.PB.S.g }));
  await p.evaluate(() => {
    const s = window.PB.S;
    const d = 0.06;
    // setLine 을 거쳐야 함 — 직접 대입 금지 (BASELINE 1-2)
    window.PB.render();
    const ev = { v1: s.g.v1 + d };
    window.PB.S.__t = ev;
  });
  await p.evaluate(() => {
    // 앱 내부 setLine 을 쓰기 위해 v1 슬라이더 경로로 이동
    const s = window.PB.S; s.sel = "v1"; s.selLR = "v1";
    const el = document.getElementById("posSliderH");
    el.value = String(s.g.v1 + 0.06);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const after = await p.evaluate(() => ({ ...window.PB.S.g }));
  const dv1 = after.v1 - before.v1;
  const okShift = ["v2", "v3", "v4", "v5"].every((k) => near(after[k] - before[k], dv1, 0.002));
  check("5. Center 이동 시 v2~v5 동반 이동", okShift && dv1 > 0.03, `Δv1=${dv1.toFixed(4)}`);

  // 3 / 4. 대칭
  const sym = await p.evaluate(() => {
    const s = window.PB.S;
    s.sel = "v2"; s.selLR = "v2";
    const el = document.getElementById("posSliderH");
    el.value = String(1 - (s.g.v2 - 0.05));   // H가 아닌 V는 비반전이지만 값 변화만 주면 됨
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const g1 = { ...s.g };
    s.sel = "v4"; s.selLR = "v4";
    const el2 = document.getElementById("posSliderH");
    el2.value = String(g1.v4 + 0.04);
    el2.dispatchEvent(new Event("input", { bubbles: true }));
    const g = window.PB.S.g;
    return { v1: g.v1, v2: g.v2, v3: g.v3, v4: g.v4, v5: g.v5 };
  });
  check("3. Inner 좌우 대칭", near((sym.v2 + sym.v3) / 2, sym.v1, 0.001),
    `mid=${((sym.v2 + sym.v3) / 2).toFixed(5)} v1=${sym.v1.toFixed(5)}`);
  check("4. Outer 좌우 대칭", near((sym.v4 + sym.v5) / 2, sym.v1, 0.001),
    `mid=${((sym.v4 + sym.v5) / 2).toFixed(5)} v1=${sym.v1.toFixed(5)}`);

  // 6. 동공정렬
  await p.evaluate(() => { window.PB.S.g = { ...window.PB.DEFAULT_GUIDE }; window.PB.S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 }; window.PB.render(); });
  const geo = await p.evaluate(() => ({ iw: window.PB.S.iw, ih: window.PB.S.ih, s0: window.PB.S.s0, W: window.PB.S.dim.W, H: window.PB.S.dim.H }));
  const toC = (px, py) => ({ x: geo.W / 2 + (px - geo.iw / 2) * geo.s0, y: geo.H / 2 + (py - geo.ih / 2) * geo.s0 });
  const A = toC(face.pupilL.x, face.pupilL.y), B = toC(face.pupilR.x, face.pupilR.y);
  await p.evaluate(([a, b]) => { window.PB.alignFromPupils(a, b); window.PB.render(); }, [A, B]);
  await p.waitForTimeout(200);
  const st = await p.evaluate(() => ({ ...window.PB.S.p, v1: window.PB.S.g.v1, h1: window.PB.S.g.h1 }));
  check("6. 동공정렬 — 6° 기울기 보정", near(st.rot, -6, 0.3) && near(st.v1, 0.5, 0.001) && near(st.h1, 0.5, 0.001),
    `rot=${st.rot.toFixed(2)}° v1=${st.v1.toFixed(3)} h1=${st.h1.toFixed(3)}`);

  // 7. 슬라이더
  const sl = await p.evaluate(() => {
    const s = document.getElementById("posSliderH");
    document.querySelector('#photoModes button[data-mode="zoom"]').click();
    s.value = "0.7"; s.dispatchEvent(new Event("input", { bubbles: true }));
    const zoom = window.PB.S.p.zoom;
    document.querySelector('#photoModes button[data-mode="balance"]').click();
    s.value = "0.65"; s.dispatchEvent(new Event("input", { bubbles: true }));
    const out = { zoom, rot: window.PB.S.p.rot };
    document.querySelector('#photoModes button[data-mode="balance"]').click();   // 선 조절로 복귀
    window.PB.S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 }; window.PB.render();
    return out;
  });
  check("7. 줌/회전 슬라이더 범위", sl.zoom > 0.5 && sl.zoom <= 8 && sl.rot >= -30 && sl.rot <= 30,
    `zoom=${sl.zoom.toFixed(2)}× rot=${sl.rot.toFixed(1)}°`);

  // 8. 프리셋 저장 · 영속성
  await p.evaluate(() => localStorage.removeItem("pb_presets_v1"));
  await p.click("#btnPresetLoad"); await p.waitForTimeout(200);
  await p.click("#btnPresetSave");
  await p.fill("#saveName", "REGRESSION");
  await p.click("#doSave"); await p.waitForTimeout(300);
  await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(400);
  const kept = await p.evaluate(() => JSON.parse(localStorage.getItem("pb_presets_v1") || "[]"));
  check("8. 프리셋 저장 — 새로고침 후 유지", kept.length === 1 && kept[0].name === "REGRESSION",
    `${kept.length}개`);

  // 9. 이미지 저장
  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1200);
  const dl = p.waitForEvent("download", { timeout: 20000 }).catch(() => null);
  await p.click("#btnExport");
  const d = await dl;
  check("9. 이미지 PNG 저장", !!d, d ? d.suggestedFilename() : "다운로드 실패");

  // 16. 사진 잠금 — 사진이 움직이지 않고, 선은 계속 움직임
  await p.evaluate(() => { window.PB.S.locked = false; document.getElementById("btnLock").click(); });
  await p.waitForTimeout(200);
  const lockState = await p.evaluate(() => ({
    locked: window.PB.S.locked,
    hMode: window.PB.S.hMode,
    modeDisabled: [...document.querySelectorAll('#photoModes button[data-mode]')].every(b => b.disabled),
    modeFaded: [...document.querySelectorAll('#photoModes button[data-mode]')].every(b => parseFloat(getComputedStyle(b).opacity) < 0.6),
    lockOn: document.getElementById("btnLock").classList.contains("on"),
  }));
  const pBefore = await p.evaluate(() => ({ ...window.PB.S.p }));
  // 잠금 상태에서 사진 팬 시도 (빈 영역 드래그)
  await p.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.85);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.12 + 70, box.y + box.height * 0.85 + 70, { steps: 10 });
  await p.mouse.up();
  const pAfter = await p.evaluate(() => ({ ...window.PB.S.p }));
  const photoFrozen = pBefore.ox === pAfter.ox && pBefore.oy === pAfter.oy && pBefore.zoom === pAfter.zoom;
  check("16. 사진 잠금 — 사진 고정 · 보정 버튼 반투명 잠김",
    lockState.locked && lockState.modeDisabled && lockState.modeFaded && lockState.lockOn
      && lockState.hMode === "line" && photoFrozen,
    `잠김=${lockState.modeDisabled} 반투명=${lockState.modeFaded} 사진고정=${photoFrozen} 바=${lockState.hMode}`);

  // 17. 잠금 중에도 선은 조절 가능 + 축 고정 (가로바=위아래만 / 세로바=좌우만)
  await p.evaluate(() => { const s = window.PB.S; s.sel = "h1"; window.PB.render(); });
  const hb = await p.evaluate(() => ({ h1: window.PB.S.g.h1, v1: window.PB.S.g.v1 }));
  const hy = box.y + box.height * hb.h1;
  await p.mouse.move(box.x + box.width * 0.5, hy);
  await p.mouse.down();
  // 대각선으로 끌어도 가로바는 세로 성분만 따라야 한다
  await p.mouse.move(box.x + box.width * 0.5 + 80, hy + 40, { steps: 12 });
  await p.mouse.up();
  const ha = await p.evaluate(() => ({ h1: window.PB.S.g.h1, v1: window.PB.S.g.v1 }));
  check("17. 잠금 중에도 선 조절 가능 · 가로바는 위아래로만",
    near((ha.h1 - hb.h1) * box.height, 40, 3) && ha.v1 === hb.v1,
    `Δy=${((ha.h1 - hb.h1) * box.height).toFixed(1)}px, v1 불변=${ha.v1 === hb.v1}`);

  // 18. 세로바는 좌우로만 (+ 대칭 유지)
  await p.evaluate(() => { const s = window.PB.S; s.sel = "v2"; window.PB.render(); });
  const vb = await p.evaluate(() => ({ ...window.PB.S.g }));
  const vx = box.x + box.width * vb.v2;
  await p.mouse.move(vx, box.y + box.height * 0.55);
  await p.mouse.down();
  await p.mouse.move(vx - 40, box.y + box.height * 0.55 + 90, { steps: 12 });
  await p.mouse.up();
  const va = await p.evaluate(() => ({ ...window.PB.S.g }));
  check("18. 세로바는 좌우로만 · 대칭 유지",
    near((va.v2 - vb.v2) * box.width, -40, 3) && va.h1 === vb.h1 && near((va.v2 + va.v3) / 2, va.v1, 0.001),
    `Δx=${((va.v2 - vb.v2) * box.width).toFixed(1)}px, h1 불변=${va.h1 === vb.h1}, 대칭오차=${Math.abs((va.v2 + va.v3) / 2 - va.v1).toExponential(1)}`);

  // 19. 방향 버튼이 축에 맞게 표시
  const dirs = await p.evaluate(() => {
    const out = {};
    const s = window.PB.S;
    s.sel = "h1"; window.PB.render();
    out.h = document.getElementById("posMinusV").textContent + document.getElementById("posPlusV").textContent;
    s.sel = "v2"; window.PB.render();
    out.v = document.getElementById("posMinusH").textContent + document.getElementById("posPlusH").textContent;
    return out;
  });
  check("19. 방향 버튼 — 가로바 ▼▲ / 세로바 ◀▶", dirs.h === "▼▲" && dirs.v === "◀▶", `${dirs.h} / ${dirs.v}`);

  // 잠금 해제 후 원상복구
  await p.evaluate(() => { document.getElementById("btnLock").click(); });
  await p.waitForTimeout(150);
  const unlocked = await p.evaluate(() => ({
    locked: window.PB.S.locked,
    modesOn: [...document.querySelectorAll('#photoModes button[data-mode]')].every(b => !b.disabled),
    bright: [...document.querySelectorAll('#photoModes button[data-mode]')].every(b => parseFloat(getComputedStyle(b).opacity) > 0.9),
  }));
  check("20. 잠금 해제 — 사진 보정 버튼 다시 밝아지고 눌림",
    !unlocked.locked && unlocked.modesOn && unlocked.bright,
    `버튼활성=${unlocked.modesOn} 밝기복구=${unlocked.bright}`);

  // 21. 사진 잠금 중 빈 곳 드래그 → 선택된 가로 바가 손을 따라 위아래로 (v1.11.0: 잠금 시에만)
  await p.evaluate(() => { const s = window.PB.S; s.locked = true; s.sel = "h1"; window.PB.render(); });
  await p.waitForTimeout(150);
  const box2 = await p.locator("#stage").boundingBox();   // 패널 높이 변화 반영해 다시 측정
  const b21 = await p.evaluate(() => ({ h1: window.PB.S.g.h1, v1: window.PB.S.g.v1, p: { ...window.PB.S.p } }));
  // 선에서 멀리 떨어진 빈 곳에서 시작
  /* 선·조절자 오버레이가 없는 빈 지점을 앱 상태에서 직접 찾는다 */
  const freeSpot = async () => p.evaluate(() => {
    const S = window.PB.S, W = S.dim.W, H = S.dim.H, g = S.g;
    const vx = ["v1", "v2", "v3", "v4", "v5"].map((k) => g[k] * W);
    const hy = ["h1", "h2", "h3", "front", "frontThickness", "archThickness"].map((k) => g[k] * H);
    const cv = document.getElementById("posCtlV").getBoundingClientRect();
    const chz = document.getElementById("posCtlH").getBoundingClientRect();
    const st = document.getElementById("stage").getBoundingClientRect();
    for (let fy = 0.16; fy < 0.60; fy += 0.02)
      for (let fx = 0.10; fx < 0.80; fx += 0.02) {
        const x = fx * W, y = fy * H;
        const sx = st.left + x, sy = st.top + y;
        const over = (r) => sx > r.left - 12 && sx < r.right + 12 && sy > r.top - 12 && sy < r.bottom + 12;
        if (over(cv) || over(chz)) continue;
        if (vx.every((v) => Math.abs(v - x) > 45) && hy.every((v) => Math.abs(v - y) > 45)) return { x, y };
      }
    return { x: W * 0.2, y: H * 0.25 };
  });
  let fp = await freeSpot();
  const far = { x: box2.x + fp.x, y: box2.y + fp.y };
  await p.mouse.move(far.x, far.y);
  await p.mouse.down();
  await p.mouse.move(far.x + 55, far.y - 50, { steps: 12 });   // 대각선
  await p.mouse.up();
  const a21 = await p.evaluate(() => ({ h1: window.PB.S.g.h1, v1: window.PB.S.g.v1, p: { ...window.PB.S.p } }));
  check("21. 빈 곳 드래그 → 선택된 가로바가 위아래로만 따라옴",
    near((a21.h1 - b21.h1) * box2.height, -50, 3) && a21.v1 === b21.v1
      && a21.p.ox === b21.p.ox && a21.p.oy === b21.p.oy,
    `Δy=${((a21.h1 - b21.h1) * box2.height).toFixed(1)}px, 사진 안움직임=${a21.p.ox === b21.p.ox && a21.p.oy === b21.p.oy}`);

  // 22. 대칭 세로 바 선택 후 빈 곳 좌우 드래그 → 대칭으로 따라옴
  await p.evaluate(() => { const s = window.PB.S; s.sel = "v2"; window.PB.render(); });
  const b22 = await p.evaluate(() => ({ ...window.PB.S.g }));
  await p.waitForTimeout(120);
  fp = await freeSpot();                       // 조절자가 아래로 옮겨졌으므로 다시 탐색
  const far2 = { x: box2.x + fp.x, y: box2.y + fp.y };
  await p.mouse.move(far2.x, far2.y);
  await p.mouse.down();
  await p.mouse.move(far2.x + 45, far2.y - 70, { steps: 12 });   // 대각선
  await p.mouse.up();
  const a22 = await p.evaluate(() => ({ ...window.PB.S.g }));
  check("22. 빈 곳 드래그 → 대칭 세로바가 좌우로만 따라옴 · 대칭 유지",
    near((a22.v2 - b22.v2) * box2.width, 45, 3) && a22.h1 === b22.h1
      && near((a22.v2 + a22.v3) / 2, a22.v1, 0.001)
      && near((a22.v3 - b22.v3) * box2.width, -45, 3),
    `Δv2=${((a22.v2 - b22.v2) * box2.width).toFixed(1)}px, Δv3=${((a22.v3 - b22.v3) * box2.width).toFixed(1)}px, 대칭오차=${Math.abs((a22.v2 + a22.v3) / 2 - a22.v1).toExponential(1)}`);

  // 23. 두 손가락 드래그 = 사진 이동 (선은 그대로)
  await p.evaluate(() => { window.PB.S.locked = false; window.PB.S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 }; window.PB.render(); });
  const b23 = await p.evaluate(() => ({ g: { ...window.PB.S.g }, p: { ...window.PB.S.p } }));
  {
    const t1 = await p.context().newCDPSession(p);
    const cx = box2.x + box2.width * 0.5, cy = box2.y + box2.height * 0.5;
    const pts0 = [{ x: cx - 60, y: cy }, { x: cx + 60, y: cy }];
    await t1.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pts0.map((q, i) => ({ x: q.x, y: q.y, id: i })) });
    await t1.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pts0.map((q, i) => ({ x: q.x + 50, y: q.y + 30, id: i })) });
    await t1.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await p.waitForTimeout(200);
  }
  const a23 = await p.evaluate(() => ({ g: { ...window.PB.S.g }, p: { ...window.PB.S.p } }));
  check("23. 두 손가락 드래그 = 사진 이동 (선은 불변)",
    near((a23.p.ox - b23.p.ox) * box2.width, 50, 6) && a23.g.h1 === b23.g.h1 && a23.g.v2 === b23.g.v2,
    `Δox=${((a23.p.ox - b23.p.ox) * box2.width).toFixed(1)}px, 선 불변=${a23.g.h1 === b23.g.h1 && a23.g.v2 === b23.g.v2}`);

  // 24. 세로 조절자 = 오른쪽 끝 · 세로 중앙, ▲ 위 / ▼ 아래 (v1.11.0)
  const ctlV = await p.evaluate(() => {
    window.PB.S.sel = "h1"; window.PB.render();
    const c = document.getElementById("posCtlV").getBoundingClientRect();
    const st = document.getElementById("stage").getBoundingClientRect();
    const up = document.getElementById("posPlusV").getBoundingClientRect();
    const dn = document.getElementById("posMinusV").getBoundingClientRect();
    const dockTop = document.getElementById("bottomDock").getBoundingClientRect().top;
    const mid = (c.top + c.bottom) / 2, region = (st.top + dockTop) / 2;
    return { vert: c.height > c.width, rightEdge: st.right - c.right,
             centered: Math.abs(mid - region) < st.height * 0.10,
             upAbove: up.top < dn.top,
             glyph: document.getElementById("posPlusV").textContent + document.getElementById("posMinusV").textContent };
  });
  check("24. 세로 조절자 — 오른쪽 끝 · 세로 중앙 (▲위/▼아래)",
    ctlV.vert && ctlV.rightEdge >= 0 && ctlV.rightEdge < 30 && ctlV.centered && ctlV.upAbove && ctlV.glyph === "▲▼",
    `세로=${ctlV.vert} 우측여백=${ctlV.rightEdge.toFixed(0)}px 세로중앙=${ctlV.centered} 위화살표위=${ctlV.upAbove} ${ctlV.glyph}`);

  // 25. 가로 조절자 = 아래 · 오른쪽 정렬, ◀ 왼쪽 / ▶ 오른쪽
  const ctlH = await p.evaluate(() => {
    window.PB.S.sel = "v2"; window.PB.render();
    const c = document.getElementById("posCtlH").getBoundingClientRect();
    const st = document.getElementById("stage").getBoundingClientRect();
    const rt = document.getElementById("posPlusH").getBoundingClientRect();
    const lf = document.getElementById("posMinusH").getBoundingClientRect();
    return { horiz: c.width > c.height, bottomEdge: st.bottom - c.bottom, rightEdge: st.right - c.right,
             rightOfLeft: rt.left > lf.left,
             glyph: document.getElementById("posMinusH").textContent + document.getElementById("posPlusH").textContent };
  });
  check("25. 가로 조절자 — 아래·오른쪽 정렬 (◀왼쪽/▶오른쪽)",
    ctlH.horiz && ctlH.bottomEdge >= 0 && ctlH.bottomEdge < 120 && ctlH.rightEdge >= 0 && ctlH.rightEdge < 30
      && ctlH.rightOfLeft && ctlH.glyph === "◀▶",
    `가로=${ctlH.horiz} 하단여백=${ctlH.bottomEdge.toFixed(0)}px 우측여백=${ctlH.rightEdge.toFixed(0)}px 오른쪽화살표오른쪽=${ctlH.rightOfLeft} ${ctlH.glyph}`);

  // 32. 두 조절자가 겹치지 않고 둘 다 화면 안에 있음
  const noOverlap = await p.evaluate(() => {
    const a = document.getElementById("posCtlV").getBoundingClientRect();
    const b = document.getElementById("posCtlH").getBoundingClientRect();
    const st = document.getElementById("stage").getBoundingClientRect();
    const sep = a.bottom <= b.top + 1 || a.right <= b.left + 1 || b.right <= a.left + 1 || b.bottom <= a.top + 1;
    const inside = (r) => r.top >= st.top - 1 && r.bottom <= st.bottom + 1 && r.left >= st.left - 1 && r.right <= st.right + 1;
    return { sep, inside: inside(a) && inside(b), gap: (b.top - a.bottom).toFixed(0) };
  });
  check("32. 두 조절자 겹침 없음 · 캔버스 안", noOverlap.sep && noOverlap.inside,
    `겹침없음=${noOverlap.sep} 캔버스안=${noOverlap.inside} 세로-가로 간격=${noOverlap.gap}px`);

  // 26. 조절자 방향 = 선의 이동 방향 (위로 밀면 위로 / 오른쪽으로 밀면 오른쪽으로)
  const dirMatch = await p.evaluate(() => {
    const S = window.PB.S;
    const bump = (key, d) => {
      S.sel = key; if (key[0] === "h" || key === "front") S.selUD = key; else S.selLR = key;
      window.PB.render();
      const sl = document.getElementById(key[0] === "v" ? "posSliderH" : "posSliderV");
      const v0 = parseFloat(sl.value), before = S.g[key];
      sl.value = String(Math.min(1, Math.max(0, v0 + d)));
      sl.dispatchEvent(new Event("input", { bubbles: true }));
      return { before, after: S.g[key] };
    };
    const h = bump("h1", +0.1);   // 세로 조절자 값↑(위쪽) → h1 감소(선이 위로)
    const v = bump("v2", +0.1);   // 가로 조절자 값↑(오른쪽) → v2 증가(선이 오른쪽으로)
    return { hUp: h.after < h.before, vRight: v.after > v.before };
  });
  check("26. 조절자 방향 = 선의 이동 방향", dirMatch.hUp && dirMatch.vRight,
    `위로밀면 위로=${dirMatch.hUp}, 오른쪽으로밀면 오른쪽=${dirMatch.vRight}`);

  // 27. 화면의 선을 탭 → 그 선이 선택되고, 값은 변하지 않음 (데드존)
  await p.evaluate(() => {
    const S = window.PB.S;
    S.locked = false; S.sel = "h1";
    S.g.h1 = 0.42; S.g.v2 = 0.30; S.g.v3 = 2 * S.g.v1 - 0.30;
    window.PB.render();
  });
  await p.waitForTimeout(150);
  const bx = await p.locator("#stage").boundingBox();
  const st27 = await p.evaluate(() => ({ v1: window.PB.S.g.v1, v2: window.PB.S.g.v2, W: window.PB.S.dim.W, H: window.PB.S.dim.H }));
  // Inner(v2) 선 위를 탭
  await p.mouse.click(bx.x + st27.v2 * st27.W, bx.y + st27.H * 0.42);
  await p.waitForTimeout(200);
  const a27 = await p.evaluate(() => ({ sel: window.PB.S.sel, v2: window.PB.S.g.v2, h1: window.PB.S.g.h1 }));
  check("27. 선을 탭하면 그 선이 선택 · 값은 그대로",
    a27.sel === "v2" && Math.abs(a27.v2 - st27.v2) < 0.0005 && Math.abs(a27.h1 - 0.42) < 0.0005,
    `선택=${a27.sel}, v2변화=${((a27.v2 - st27.v2) * st27.W).toFixed(2)}px`);

  // 28. 다른 선을 탭하면 그 선으로 전환 + 조절자 축도 함께 전환
  await p.evaluate(() => {                       // 세로선과 겹치지 않는 깨끗한 상태로
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE };
    S.g.h1 = 0.42; S.sel = "v2";
    window.PB.render();
  });
  await p.waitForTimeout(150);
  await p.mouse.click(bx.x + st27.W * 0.22, bx.y + st27.H * 0.42);   // Eye(h1) 선 위, 세로선에서 먼 지점
  await p.waitForTimeout(200);
  const a28 = await p.evaluate(() => ({
    sel: window.PB.S.sel,
    axisV: document.getElementById("posCtlV").classList.contains("active"),
    selUD: window.PB.S.selUD,
  }));
  check("28. 다른 선 탭 → 전환 + 조절자 축도 전환", a28.sel === "h1" && a28.axisV,
    `선택=${a28.sel}, 세로조절자=${a28.axisV}`);

  /* ── v1.11.0 신규 ─────────────────────────────────────── */

  // 35. 잠금 해제 + 빈 곳 한 손가락 드래그 → 사진이 사방으로 자유 이동 (선은 불변)
  await p.evaluate(() => {
    const S = window.PB.S;
    S.locked = false; S.g = { ...window.PB.DEFAULT_GUIDE };
    S.p = { zoom: 2, ox: 0, oy: 0, rot: 0 };
    window.PB.render();
  });
  await p.waitForTimeout(150);
  const fp35 = await freeSpot();
  const b35 = await p.evaluate(() => ({ g: { ...window.PB.S.g }, p: { ...window.PB.S.p } }));
  await p.mouse.move(box2.x + fp35.x, box2.y + fp35.y);
  await p.mouse.down();
  await p.mouse.move(box2.x + fp35.x + 70, box2.y + fp35.y - 55, { steps: 14 });   // 사선
  await p.mouse.up();
  const a35 = await p.evaluate(() => ({ g: { ...window.PB.S.g }, p: { ...window.PB.S.p } }));
  const dx35 = (a35.p.ox - b35.p.ox) * box2.width, dy35 = (a35.p.oy - b35.p.oy) * box2.height;
  check("35. 잠금 해제 · 한 손가락 사선 드래그 = 사진 자유 이동",
    near(dx35, 70, 4) && near(dy35, -55, 4) && a35.g.h1 === b35.g.h1 && a35.g.v2 === b35.g.v2,
    `Δ=(${dx35.toFixed(1)}, ${dy35.toFixed(1)})px, 선 불변=${a35.g.h1 === b35.g.h1 && a35.g.v2 === b35.g.v2}`);

  // 36. 사진보정 버튼 → 아래 가로 바가 사진 조절로 전환, 다시 누르면 선 조절로 복귀
  const share = await p.evaluate(() => {
    const S = window.PB.S, out = {};
    S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 }; S.hMode = "line"; window.PB.render();
    const sl = document.getElementById("posSliderH");
    document.querySelector('#photoModes button[data-mode="balance"]').click();
    out.photoMode = S.hMode === "photo";
    out.label = document.getElementById("selNameH").textContent;
    const v2before = S.g.v2;
    sl.value = "0.7"; sl.dispatchEvent(new Event("input", { bubbles: true }));
    out.rotChanged = Math.abs(S.p.rot) > 1;
    out.lineUntouched = S.g.v2 === v2before;
    document.querySelector('#photoModes button[data-mode="balance"]').click();   // 같은 버튼 재클릭
    out.backToLine = S.hMode === "line";
    const rotBefore = S.p.rot;
    sl.value = "0.3"; sl.dispatchEvent(new Event("input", { bubbles: true }));
    out.lineMoved = S.g.v2 !== v2before && S.p.rot === rotBefore;
    S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 }; S.g = { ...window.PB.DEFAULT_GUIDE }; window.PB.render();
    return out;
  });
  check("36. 아래 가로 바 하나로 선 조절 ↔ 사진 보정 겸용",
    share.photoMode && share.rotChanged && share.lineUntouched && share.backToLine && share.lineMoved,
    `사진모드=${share.photoMode}(${share.label}) 사진반응=${share.rotChanged} 선불변=${share.lineUntouched} 선복귀=${share.backToLine}`);

  // 37. 세로선을 고르면 가로 바가 자동으로 선 조절로 돌아온다
  const backLine = await p.evaluate(() => {
    const S = window.PB.S;
    document.querySelector('#photoModes button[data-mode="zoom"]').click();
    const wasPhoto = S.hMode === "photo";
    document.querySelector('#vButtons .lbtn[data-key="v2"]').click();
    return { wasPhoto, now: S.hMode, sel: S.sel };
  });
  check("37. 세로선 선택 → 가로 바가 선 조절로 자동 복귀",
    backLine.wasPhoto && backLine.now === "line" && backLine.sel === "v2",
    `이전=${backLine.wasPhoto ? "photo" : "line"} → ${backLine.now} (선택 ${backLine.sel})`);

  // 38. 아래 도크 순서 — 위에서부터 [사진보정 버튼] [좌우 드래그] [메뉴 5버튼], 모두 오른쪽 정렬
  const dockOrder = await p.evaluate(() => {
    const r = (id) => document.getElementById(id).getBoundingClientRect();
    const m = r("photoModes"), h = r("posCtlH"), n = r("menuRow"), st = r("stage");
    return {
      order: m.bottom <= h.top + 1 && h.bottom <= n.top + 1,
      bottomRow: st.bottom - n.bottom < 30,
      rightAligned: Math.abs(m.right - n.right) < 2 && Math.abs(h.right - n.right) < 2,
      count: document.querySelectorAll("#menuRow button").length,
      ids: [...document.querySelectorAll("#menuRow button")].map((b) => b.id).join(","),
    };
  });
  check("38. 아래 도크 — 사진보정 / 좌우 드래그 / 메뉴 5버튼 (맨 아래, 오른쪽 정렬)",
    dockOrder.order && dockOrder.bottomRow && dockOrder.rightAligned && dockOrder.count === 5
      && dockOrder.ids === "btnChange,btnPresetLoad,btnEyeGuide,btnExport,btnLock",
    `순서=${dockOrder.order} 맨아래=${dockOrder.bottomRow} 우측정렬=${dockOrder.rightAligned} [${dockOrder.ids}]`);

  // 39. 초기화 버튼이 위아래 드래그 바 바로 위 · 삭제된 버튼/패널이 남아 있지 않음
  //     (V 버튼이 왼쪽 레일에 있는지는 가로 레이아웃 테스트 10번에서 검증)
  const placed = await p.evaluate(() => {
    const rst = document.getElementById("btnReset").getBoundingClientRect();
    const v = document.getElementById("posCtlV").getBoundingClientRect();
    return {
      resetAbove: rst.bottom <= v.top + 1 && Math.abs((rst.left + rst.right) / 2 - (v.left + v.right) / 2) < 12,
      removed: !document.getElementById("btnAlign") && !document.getElementById("btnRotate")
               && !document.getElementById("phSlider") && !document.getElementById("btnLock2")
               && !document.querySelector(".topbar") && !document.querySelector(".panels"),
    };
  });
  check("39. 초기화 = 위아래 드래그 바 바로 위 · 삭제 버튼/패널 정리",
    placed.resetAbove && placed.removed,
    `초기화위=${placed.resetAbove} 삭제완료=${placed.removed}`);

  // 12. 좌표계 규약
  const norm = await p.evaluate(() => {
    const g = window.PB.S.g;
    const keys = ["h1", "h2", "h3", "front", "frontThickness", "archThickness", "v1", "v2", "v3", "v4", "v5", "innerAngle", "outerAngle"];
    return keys.filter((k) => typeof g[k] !== "number" || g[k] < -0.001 || g[k] > 1.001);
  });
  check("12. 좌표계 규약 — 모든 라인 값 0~1", norm.length === 0, norm.join(","));

  await ctx.close();
}

/* ═══════ A-2. 강제 가로 회전 (기기가 세로로 잠겨 있을 때) ═══════ */
console.log("\n[강제 가로 회전]");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await p.evaluate(() => localStorage.setItem("pb_orient", "on"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(500);
  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1200);

  const cls = await p.evaluate(() => ({
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
    railVisible: getComputedStyle(document.getElementById("lineRail")).display !== "none",
    stageW: document.getElementById("stage").offsetWidth,
    stageH: document.getElementById("stage").offsetHeight,
  }));
  check("13. 세로 기기에서 가로 강제 — 회전 적용", cls.rot && cls.land && cls.railVisible,
    `rot90=${cls.rot} land=${cls.land} rail=${cls.railVisible}`);
  check("13. 세로 기기에서 가로 강제 — 캔버스가 가로", cls.stageW > cls.stageH,
    `${cls.stageW}×${cls.stageH}`);

  /* 회전 상태에서도 라인 드래그 좌표가 정확한지.
     ⚠️ getScreenCTM 을 쓰지 않고 rot90 변환을 직접 계산한다 —
        CTM 을 쓰면 앱과 테스트가 같은 함수를 공유해 축이 뒤바뀌어도 통과해 버린다.
        rot90: 로컬 +x → 뷰포트 +y, 로컬 +y → 뷰포트 −x */
  const stageRect = () => p.evaluate(() => {
    const r = document.getElementById("stage").getBoundingClientRect();
    return { top: r.top, right: r.right, left: r.left, bottom: r.bottom };
  });
  const rr = await stageRect();
  const toScreen = (x, y) => ({ x: rr.right - y, y: rr.top + x });   // 로컬 → 뷰포트

  const g0 = await p.evaluate(() => window.PB.S.g.h1);
  const W = cls.stageW, H = cls.stageH;
  const from = toScreen(W * 0.5, H * g0);
  const to = toScreen(W * 0.5, H * g0 + 60);
  await p.mouse.move(from.x, from.y);
  await p.mouse.down();
  await p.mouse.move(to.x, to.y, { steps: 12 });
  await p.mouse.up();
  const g1 = await p.evaluate(() => window.PB.S.g.h1);
  const moved = (g1 - g0) * H;
  check("14. 회전 상태에서 라인 드래그 정확도", near(moved, 60, 3), `${moved.toFixed(1)}px`);

  /* 34. 강제 가로에서 손 제스처 방향이 화면과 일치하는가 (v1.10.0 — iOS 축 뒤바뀜 회귀 방지)
        화면상 "아래로" = 뷰포트 −x, 화면상 "오른쪽으로" = 뷰포트 +y */
  await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE };
    S.sel = "h1"; S.selUD = "h1"; S.selLR = "v2";
    S.locked = true;          /* v1.11.0: 잠금 해제 상태의 빈 곳 드래그는 사진 이동이므로 */
    window.PB.render();
  });
  const b34 = await p.evaluate(() => ({ ...window.PB.S.g }));
  const c34 = toScreen(cls.stageW * 0.30, cls.stageH * 0.55);   // 선·조절자와 겹치지 않는 지점
  await p.mouse.move(c34.x, c34.y);
  await p.mouse.down();
  await p.mouse.move(c34.x - 60, c34.y, { steps: 12 });          // 화면상 아래로 60px
  await p.mouse.up();
  const aDown = await p.evaluate(() => ({ ...window.PB.S.g }));
  const dH = (aDown.h1 - b34.h1) * cls.stageH;

  await p.evaluate(() => { window.PB.S.sel = "v2"; window.PB.render(); });
  const c35 = toScreen(cls.stageW * 0.30, cls.stageH * 0.55);
  await p.mouse.move(c35.x, c35.y);
  await p.mouse.down();
  await p.mouse.move(c35.x, c35.y + 60, { steps: 12 });          // 화면상 오른쪽으로 60px
  await p.mouse.up();
  const aRight = await p.evaluate(() => ({ ...window.PB.S.g }));
  const dV = (aRight.v2 - aDown.v2) * cls.stageW;

  check("34. 강제 가로 — 손 제스처 축이 화면과 일치",
    near(dH, 60, 4) && near(dV, 60, 4),
    `아래로끌기→h1 ${dH.toFixed(1)}px / 오른쪽끌기→v2 ${dV.toFixed(1)}px`);

  /* 29. v1.8.0 — 기본(auto)에서 회전 잠금이 켜진 세로 터치 기기도 항상 가로.
        저장값을 스스로 off 로 바꾸지 않아야 한다(v1.7.0 자동 해제 로직 제거 확인). */
  await p.evaluate(() => localStorage.removeItem("pb_orient"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(500);
  const auto = await p.evaluate(() => ({
    stored: localStorage.getItem("pb_orient"),
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
    railVisible: getComputedStyle(document.getElementById("lineRail")).display !== "none",
  }));
  check("29. 기본값에서 세로 기기 → 항상 가로 (자동 해제 없음)",
    auto.rot && auto.land && auto.railVisible && auto.stored === null,
    `저장값=${auto.stored} rot90=${auto.rot} land=${auto.land} rail=${auto.railVisible}`);

  /* 30. 기기를 실제로 눕히면(회전 잠금 해제) 가짜 회전은 스스로 꺼진다 — 저장값은 그대로 auto */
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(400);
  const realLand = await p.evaluate(() => ({
    stored: localStorage.getItem("pb_orient"),
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
  }));
  check("30. 기기가 실제 가로면 가짜 회전 해제 (설정은 유지)",
    !realLand.rot && realLand.land && realLand.stored === null,
    `저장값=${realLand.stored} rot90=${realLand.rot} land=${realLand.land}`);

  /* 31. 다시 세로로 잠기면 즉시 가로 복귀 */
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(400);
  const backPortrait = await p.evaluate(() => ({
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
  }));
  check("31. 세로로 되돌아가면 즉시 가로 강제 복귀",
    backPortrait.rot && backPortrait.land,
    `rot90=${backPortrait.rot} land=${backPortrait.land}`);

  /* 해제하면 다시 세로 레이아웃 */
  await p.evaluate(() => localStorage.setItem("pb_orient", "off"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);
  const off = await p.evaluate(() => ({
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
  }));
  check("15. 가로 강제 해제 — 기기 방향 복귀", !off.rot && !off.land);

  await ctx.close();
}

/* ═══════ B. 가로(landscape) — 레이아웃 테스트 ═══════ */
console.log("\n[가로 모드 · 레이아웃]");
for (const dev of [{ n: "아이폰 가로 844×390", w: 844, h: 390 }, { n: "아이패드 가로 1180×820", w: 1180, h: 820 }]) {
  const ctx = await browser.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);
  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1000);

  const g = await p.evaluate(() => {
    const rail = document.getElementById("lineRail");
    const stage = document.getElementById("stage");
    const sr = stage.getBoundingClientRect();
    const bd = document.getElementById("bottomDock").getBoundingClientRect();
    const rd = document.getElementById("rightDock").getBoundingClientRect();
    const inside = (r) => r.top >= sr.top - 1 && r.bottom <= sr.bottom + 1 && r.left >= sr.left - 1 && r.right <= sr.right + 1;
    return {
      railVisible: getComputedStyle(rail).display !== "none",
      railHasButtons: rail.contains(document.getElementById("hButtons")) && rail.contains(document.getElementById("vButtons")),
      railHasV: rail.contains(document.getElementById("railExtra")),
      railFits: rail.scrollHeight <= rail.clientHeight + 2,
      docksFit: inside(bd) && inside(rd),
      dockGap: Math.round(bd.top - rd.bottom),
      stageW: Math.round(sr.width),
      stageShare: sr.width / window.innerWidth,
    };
  });
  check(`10. ${dev.n} — 좌측 레일 + V 버튼`, g.railVisible && g.railHasButtons && g.railHasV);
  check(`10. ${dev.n} — 도크 잘림/겹침 없음 · 사진 ${Math.round(g.stageShare * 100)}%`,
    g.railFits && g.docksFit && g.dockGap > 0 && g.stageShare > 0.9,
    `rail=${g.railFits ? "ok" : "overflow"} 도크안쪽=${g.docksFit} 도크간격=${g.dockGap}px`);
  await ctx.close();
}

await browser.close();
server.close();
fs.unlinkSync(face.file);

/* ── 요약 ───────────────────────────────── */
const failed = results.filter((r) => !r.pass);
console.log("\n" + "━".repeat(46));
console.log(`  통과 ${results.length - failed.length} / ${results.length}`);
if (failed.length) {
  console.log("\n  ❌ 실패 항목 — 커밋하지 마세요:");
  failed.forEach((f) => console.log(`     · ${f.name}  ${f.detail}`));
  console.log("\n  BASELINE.md 의 해당 항목을 확인하세요.\n");
  process.exit(1);
}
console.log("  ✅ 전 항목 통과 — 커밋해도 안전합니다.\n");
