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
  /* x = 0.20 — 세로선(v1 0.5 / v2 0.35)에서 충분히 떨어진 지점이라야 가로선이 잡힌다.
     선이 교차하는 곳을 찍으면 "가장 가까운 선"이 세로선이 될 수 있다 (HIT_PX 28px). */
  const y0 = await p.evaluate(() => window.PB.S.g.h1);
  await p.mouse.move(box.x + box.width * 0.20, box.y + box.height * y0);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.20, box.y + box.height * y0 + 60, { steps: 12 });
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
  /* 기준점 = 메인 작업 영역(캔버스 왼쪽 ~ 오른쪽 드래그 바)의 한가운데 (v1.17.0) */
  const cxExp = await p.evaluate(() => {
    const d = document.getElementById("rightDock");
    return (d.offsetLeft - 8) / window.PB.S.dim.W / 2;
  });
  check("6. 동공정렬 — 6° 기울기 보정 · 기준점 = 작업 영역 중앙 · 세로 0.60",
    near(st.rot, -6, 0.3) && near(st.v1, cxExp, 0.003) && near(st.h1, 0.60, 0.001),
    `rot=${st.rot.toFixed(2)}° v1=${st.v1.toFixed(3)}(기대 ${cxExp.toFixed(3)}) h1=${st.h1.toFixed(3)}`);

  // 44. 얼굴(동공 중점)이 실제로 캔버스 가로 35% 지점에 온다 — 오른쪽 컨트롤을 피하려고 왼쪽으로 15%
  const faceCenter = await p.evaluate(([px, py]) => {
    const S = window.PB.S, p = S.p;
    const vx = (px - S.iw / 2) * S.s0, vy = (py - S.ih / 2) * S.s0;
    const r = (p.rot * Math.PI) / 180;
    const cx = S.dim.W / 2 + p.ox * S.dim.W + p.zoom * (vx * Math.cos(r) - vy * Math.sin(r));
    const cy = S.dim.H / 2 + p.oy * S.dim.H + p.zoom * (vx * Math.sin(r) + vy * Math.cos(r));
    return { x: cx / S.dim.W, y: cy / S.dim.H };
  }, [(face.pupilL.x + face.pupilR.x) / 2, (face.pupilL.y + face.pupilR.y) / 2]);
  check("44. 자동 정렬 — 얼굴이 작업 영역 가로 한가운데 · 세로 60%",
    near(faceCenter.x, cxExp, 0.01) && near(faceCenter.y, 0.60, 0.01),
    `얼굴 중심 = (${(faceCenter.x * 100).toFixed(1)}%, ${(faceCenter.y * 100).toFixed(1)}%) / 기대 x ${(cxExp * 100).toFixed(1)}%`);

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
  await p.mouse.move(box.x + box.width * 0.20, hy);
  await p.mouse.down();
  // 대각선으로 끌어도 가로바는 세로 성분만 따라야 한다
  await p.mouse.move(box.x + box.width * 0.20 + 80, hy + 40, { steps: 12 });
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

  const st0W = await p.evaluate(() => window.PB.S.dim.W);
  // 24. 세로 조절자 = 오른쪽(스와이프 여백 확보) · 세로 중앙, ▲ 위 / ▼ 아래
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
    ctlV.vert && ctlV.rightEdge > st0W * 0.04 && ctlV.rightEdge < st0W * 0.10 && ctlV.centered && ctlV.upAbove && ctlV.glyph === "▲▼",
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
    ctlH.horiz && ctlH.bottomEdge >= 0 && ctlH.bottomEdge < 120 && ctlH.rightEdge > st0W * 0.04 && ctlH.rightEdge < st0W * 0.10
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
    S.locked = false;
    /* v1.30.1 — 기본 표시가 전부 켜져 빈 곳이 없다. **사진 드래그 검사**이므로 선을 줄인다. */
    S.g = { ...window.PB.DEFAULT_GUIDE, h2Visible: false, h3Visible: false,
            frontVisible: false, frontThicknessVisible: false, archThicknessVisible: false,
            v4Visible: false, v6Visible: false };
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
    S.g = { ...window.PB.DEFAULT_GUIDE, h2Visible: false, h3Visible: false,
            frontVisible: false, frontThicknessVisible: false, archThicknessVisible: false,
            v4Visible: false, v6Visible: false };
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

  // 38. 오른쪽 아래 도크 — [사진보정 버튼] 위, [좌우 드래그 바] 아래, 둘 다 오른쪽 끝 정렬 (v1.12.0)
  const dockOrder = await p.evaluate(() => {
    const r = (id) => document.getElementById(id).getBoundingClientRect();
    const m = r("photoModes"), h = r("posCtlH"), st = r("stage");
    return {
      order: m.bottom <= h.top + 1,
      rightEnd: st.right - h.right > st.width * 0.04 && st.right - h.right < st.width * 0.10
                && Math.abs(m.right - h.right) < 2,
      bottomEnd: st.bottom - h.bottom < 20,
    };
  });
  check("38. 오른쪽 아래 — 사진보정 버튼 위 / 좌우 바가 오른쪽에서 5% 떨어져 맨 아래",
    dockOrder.order && dockOrder.rightEnd && dockOrder.bottomEnd,
    `순서=${dockOrder.order} 오른쪽끝=${dockOrder.rightEnd} 맨아래=${dockOrder.bottomEnd}`);

  /* 39. 되돌리기·다시실행 = **좌우 드래그 바 왼쪽, 같은 행** (v1.29.0)
     되돌리기가 바에 가장 가깝습니다 — 제일 자주 누르는 버튼이라 손이 짧게 움직입니다.
     v1.28.1 까지는 오른쪽 도크(위아래 바 위)에 있었습니다. */
  const placed = await p.evaluate(() => {
    const r = (id) => document.getElementById(id).getBoundingClientRect();
    const u = r("btnUndo"), rd = r("btnRedo"), h = r("posCtlH");
    return {
      leftOfBar: u.right <= h.left + 1 && rd.right <= u.left + 1,
      sameRow: Math.abs((u.top + u.bottom) / 2 - (h.top + h.bottom) / 2) < 10,
      undoNearest: Math.abs(h.left - u.right) < Math.abs(h.left - rd.right),
      removed: !document.getElementById("btnAlign") && !document.getElementById("btnRotate")
               && !document.getElementById("phSlider") && !document.getElementById("btnLock2")
               && !document.querySelector(".topbar") && !document.querySelector(".panels"),
    };
  });
  check("39. 되돌리기·다시실행 = 좌우 드래그 바 왼쪽 (되돌리기가 바에 가깝게) · 삭제 버튼 정리",
    placed.leftOfBar && placed.sameRow && placed.undoNearest && placed.removed,
    `바왼쪽=${placed.leftOfBar} 같은행=${placed.sameRow} 되돌리기가까움=${placed.undoNearest} 삭제완료=${placed.removed}`);

  // 41. 되돌리기 — 직전 작업 1단계씩, 두 번 누르면 그 전 작업까지
  const undoTest = await p.evaluate(async () => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE };
    S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 };
    S.sel = "h1"; S.selUD = "h1"; S.hist = [];
    window.PB.render();
    const v0 = S.g.h1;
    document.getElementById("posPlusV").click();     // 작업 1
    const v1 = S.g.h1;
    document.getElementById("posPlusV").click();     // 작업 2
    const v2 = S.g.h1;
    const depth = S.hist.length;
    document.getElementById("btnUndo").click();      // 작업 2 취소
    const u1 = S.g.h1;
    document.getElementById("btnUndo").click();      // 작업 1 취소
    const u2 = S.g.h1;
    const emptyDisabled = document.getElementById("btnUndo").disabled;
    return { v0, v1, v2, u1, u2, depth, emptyDisabled };
  });
  check("41. 되돌리기 — 직전 작업만, 다시 누르면 그 전 작업",
    undoTest.depth === 2 && undoTest.v1 !== undoTest.v0 && undoTest.v2 !== undoTest.v1
      && Math.abs(undoTest.u1 - undoTest.v1) < 1e-9 && Math.abs(undoTest.u2 - undoTest.v0) < 1e-9
      && undoTest.emptyDisabled,
    `단계=${undoTest.depth} ${undoTest.v0.toFixed(3)}→${undoTest.v1.toFixed(3)}→${undoTest.v2.toFixed(3)} ⇢ ${undoTest.u1.toFixed(3)} ⇢ ${undoTest.u2.toFixed(3)}, 빈스택잠김=${undoTest.emptyDisabled}`);

  /* 42. 드래그 제스처 1회 = 되돌리기 1단계.
     "선택만 하는 탭"(아직 선택돼 있지 않던 선을 처음 탭)은 기록하지 않는다.
     ⚠️ 이미 선택된 선을 다시 탭하면 숨김이므로 그건 정상적으로 1단계로 기록된다 (v1.18.1, 55번). */
  await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.locked = true; S.sel = "v1"; S.hist = [];
    window.PB.render();
  });
  await p.waitForTimeout(120);
  const gy = await p.evaluate(() => window.PB.S.g.h1);
  await p.mouse.click(box2.x + box2.width * 0.20, box2.y + box2.height * gy);   // 탭만
  await p.waitForTimeout(120);
  const afterTap = await p.evaluate(() => window.PB.S.hist.length);
  await p.mouse.move(box2.x + box2.width * 0.20, box2.y + box2.height * gy);
  await p.mouse.down();
  await p.mouse.move(box2.x + box2.width * 0.20, box2.y + box2.height * gy + 50, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(120);
  const dragRes = await p.evaluate(() => {
    const S = window.PB.S;
    const moved = S.g.h1;
    const depth = S.hist.length;
    document.getElementById("btnUndo").click();
    return { moved, depth, back: S.g.h1 };
  });
  check("42. 드래그 1회 = 되돌리기 1단계 (선택만 하는 탭은 기록 안 됨)",
    afterTap === 0 && dragRes.depth === 1 && Math.abs(dragRes.back - gy) < 1e-9,
    `탭후=${afterTap}단계, 드래그후=${dragRes.depth}단계, 복원=${Math.abs(dragRes.back - gy) < 1e-9}`);

  /* ── 여러라인 (v1.18.0) ─────────────────────────────── */

  // 49. 여러라인 ON → 누를 때마다 선택 누적, 같은 버튼 다시 누르면 해제 (숨기지 않음)
  const multiSel = await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.multi = false; S.selSet = []; S.sel = "h1";
    window.PB.render();
    document.getElementById("btnMulti").click();          // 여러라인 ON → 현재 선택 seed
    const seeded = [...S.selSet];
    const tap = (k) => document.querySelector(`.lbtn[data-key="${k}"]`).click();
    tap("h2"); tap("h3");
    const added = [...S.selSet];
    tap("h3");                                            // 다시 → 해제
    const removed = [...S.selSet];
    const stillVisible = S.g.h3Visible;                   // 해제해도 숨겨지지 않아야 함
    return { seeded, added, removed, stillVisible, btnOn: document.getElementById("btnMulti").classList.contains("on") };
  });
  check("49. 여러라인 — 누를 때마다 선택 누적 · 다시 누르면 해제(숨김 아님)",
    multiSel.btnOn && multiSel.seeded.join() === "h1"
      && multiSel.added.join() === "h1,h2,h3" && multiSel.removed.join() === "h1,h2"
      && multiSel.stillVisible === true,
    `seed=[${multiSel.seeded}] → [${multiSel.added}] → [${multiSel.removed}], 표시유지=${multiSel.stillVisible}`);

  // 50. 선택된 라인들이 함께 움직인다 (비선택 라인은 불변)
  await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE };
    S.g.h2Visible = true; S.g.archThicknessVisible = true; S.g.h3Visible = true;
    S.multi = true; S.selSet = ["h2", "archThickness"]; S.sel = "h2"; S.selUD = "h2";
    S.locked = true;                                      // 빈 곳 드래그 = 선 조절
    window.PB.render();
  });
  await p.waitForTimeout(120);
  const b50 = await p.evaluate(() => ({ ...window.PB.S.g }));
  await p.mouse.move(box2.x + box2.width * 0.5, box2.y + box2.height * 0.72);
  await p.mouse.down();
  await p.mouse.move(box2.x + box2.width * 0.5, box2.y + box2.height * 0.72 + 55, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(120);
  const a50 = await p.evaluate(() => ({ ...window.PB.S.g }));
  const d50 = (k) => (a50[k] - b50[k]) * box2.height;
  check("50. 여러라인 — 선택된 선들이 함께 이동 · 비선택은 불변",
    near(d50("h2"), 55, 3) && near(d50("archThickness"), 55, 3)
      && Math.abs(d50("h1")) < 0.5 && Math.abs(d50("h3")) < 0.5,
    `Δ Arch=${d50("h2").toFixed(1)} A.T=${d50("archThickness").toFixed(1)} / Eye=${d50("h1").toFixed(1)} Tail=${d50("h3").toFixed(1)}`);

  // 51. 선택된 라인은 모두 굵고 선명하게 그려진다
  const emph = await p.evaluate(() => {
    const S = window.PB.S;
    const read = () => [...document.getElementById("guides").querySelectorAll("line")]
      .filter((l) => l.getAttribute("stroke") === window.PB.LINE_COLORS.arch)
      .map((l) => +l.getAttribute("stroke-width"));
    S.selSet = []; S.multi = false; S.sel = "h1"; window.PB.render();
    const plain = Math.max(...read());
    S.multi = true; S.selSet = ["h2", "archThickness"]; window.PB.render();
    const bold = Math.max(...read());
    return { plain, bold };
  });
  check("51. 선택된 라인 강조 — 굵기 증가",
    emph.bold > emph.plain + 1, `기본 ${emph.plain} → 선택 ${emph.bold}`);

  // 52. 여러라인 OFF → 한 개만 선택
  const single = await p.evaluate(() => {
    const S = window.PB.S;
    document.getElementById("btnMulti").click();          // OFF
    const off = { multi: S.multi, set: [...S.selSet] };
    document.querySelector('.lbtn[data-key="h3"]').click();
    return { off, sel: S.sel, set: [...S.selSet] };
  });
  check("52. 여러라인 해제 → 한 개만 선택",
    single.off.multi === false && single.off.set.length === 0 && single.sel === "h3" && single.set.length === 0,
    `모드=${single.off.multi} 선택=${single.sel} 세트=${single.set.length}개`);
  await p.evaluate(() => {
    const S = window.PB.S;
    S.multi = false; S.selSet = []; S.locked = false;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.sel = "h1"; window.PB.render();
  });

  // 53. `모든 라인 숨김` 버튼 이름 · 여러라인 버튼 존재
  const btns = await p.evaluate(() => ({
    allHide: document.getElementById("btnAllLine").textContent.trim(),
    multi: document.getElementById("btnMulti").textContent.trim(),
    sideBySide: Math.abs(document.getElementById("btnAllLine").getBoundingClientRect().top
      - document.getElementById("btnMulti").getBoundingClientRect().top) < 3,
  }));
  check("53. 버튼 이름 — `모든 라인 숨김` + 옆에 `여러라인`",
    btns.allHide === "모든 라인 숨김" && btns.multi === "여러라인" && btns.sideBySide,
    `[${btns.allHide}] [${btns.multi}] 같은 줄=${btns.sideBySide}`);

  // 43. 라인 버튼 — 1탭 = 선택(표시 유지) / 같은 버튼 다시 탭 = 숨김
  const lineBtn = await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.sel = "h1"; S.hMode = "line"; window.PB.render();
    const b = document.querySelector('#hButtons .lbtn[data-key="h2"]');
    b.click();                                   // 1탭 → 선택 + 표시
    const first = { sel: S.sel, vis: S.g.h2Visible };
    b.click();                                   // 2탭 → 숨김
    const second = { sel: S.sel, vis: S.g.h2Visible };
    b.click();                                   // 3탭 → 다시 표시
    return { first, second, third: S.g.h2Visible };
  });
  check("43. 라인 버튼 — 1탭 선택(움직임) · 다시 탭 숨김",
    lineBtn.first.sel === "h2" && lineBtn.first.vis === true
      && lineBtn.second.sel === "h2" && lineBtn.second.vis === false && lineBtn.third === true,
    `1탭=${lineBtn.first.sel}/표시${lineBtn.first.vis} → 2탭 표시${lineBtn.second.vis} → 3탭 표시${lineBtn.third}`);
  await p.evaluate(() => { window.PB.S.locked = false; window.PB.S.hist = []; window.PB.render(); });

  /* 54~56. 화면의 선을 직접 탭했을 때 (v1.18.1)
     레일 버튼과 같은 규칙이어야 한다 — 한 줄 모드 1탭 = 선택 / 같은 선 다시 탭 = 숨김.
     v1.18.0 에서는 캔버스 탭이 선택만 하고 숨기지 않는 버그가 있었다. */
  /* 자의 길이·위치가 버전마다 바뀌므로 좌표를 하드코딩하지 않는다.
     **실제로 그려진 토막의 한가운데**를 찾아서 찍는다 (v1.24.0). */
  const tapAt = async (key) => {
    const pt = await p.evaluate((k) => {
      const S = window.PB.S, { W, H } = S.dim;
      const H_KEYS = ["h1", "h2", "h3", "front", "frontThickness", "archThickness"];
      if (!H_KEYS.includes(k)) return { x: Math.round(S.g[k] * W), y: Math.round(H * 0.5) };
      const y = S.g[k] * H;
      const seg = [...document.getElementById("guides").querySelectorAll("line")]
        .map((l) => ({ x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
                       y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
                       o: +(l.getAttribute("stroke-opacity") || 1) }))
        .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1.5 && l.o > 0.2
                    && Math.abs(l.x2 - l.x1) > 4)
        .sort((a, b) => Math.min(a.x1, a.x2) - Math.min(b.x1, b.x2))[0];
      if (!seg) return { x: Math.round((S.wr || W) * 0.4), y: Math.round(y) };
      return { x: Math.round((seg.x1 + seg.x2) / 2), y: Math.round(y) };
    }, key);
    await p.mouse.click(box2.x + pt.x, box2.y + pt.y);
    await p.waitForTimeout(120);
  };

  await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.g.h2Visible = true;
    S.multi = false; S.selSet = []; S.sel = "v1"; S.hMode = "line";
    S.locked = true;                    /* 빈 곳 탭이 사진 팬으로 새지 않도록 */
    window.PB.render();
  });
  await tapAt("h2");
  const canvas1 = await p.evaluate(() => ({ sel: window.PB.S.sel, vis: window.PB.S.g.h2Visible }));
  check("54. 화면 탭 — 1탭 = 선택(숨기지 않음)",
    canvas1.sel === "h2" && canvas1.vis === true,
    `선택=${canvas1.sel} 표시=${canvas1.vis}`);

  await tapAt("h2");
  const canvas2 = await p.evaluate(() => ({ sel: window.PB.S.sel, vis: window.PB.S.g.h2Visible }));
  check("55. 화면 탭 — 같은 선 다시 탭 = 숨김",
    canvas2.vis === false, `표시=${canvas2.vis} (선택=${canvas2.sel})`);

  /* 되돌리기로 복원되는지 (숨김도 한 작업) */
  await p.evaluate(() => { document.getElementById("btnUndo").click(); });
  await p.waitForTimeout(120);
  const canvasUndo = await p.evaluate(() => window.PB.S.g.h2Visible);

  /* 여러라인 모드에서는 탭해도 숨기면 안 된다 */
  await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.g.h2Visible = true;
    S.multi = true; S.selSet = ["h2"]; S.sel = "h2"; S.hMode = "line"; S.locked = true;
    window.PB.render();
  });
  await tapAt("h2");
  const canvas3 = await p.evaluate(() => ({ set: [...window.PB.S.selSet], vis: window.PB.S.g.h2Visible }));
  check("56. 화면 탭 — 여러라인 모드는 선택 해제만, 숨기지 않음 · 숨김은 되돌리기 대상",
    canvas3.vis === true && canvas3.set.length === 0 && canvasUndo === true,
    `표시=${canvas3.vis} 세트=${canvas3.set.length}개 되돌리기복원=${canvasUndo}`);

  await p.evaluate(() => {
    const S = window.PB.S;
    S.multi = false; S.selSet = []; S.locked = false; S.hist = [];
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.sel = "h1"; window.PB.render();
  });

  /* ── v1.19.0 ─────────────────────────────────────────── */

  // 57. 다시 실행 — 되돌린 작업을 앞으로 되감는다
  const rd = await p.evaluate(() => {
    const S = window.PB.S, PBx = window.PB;
    S.g = { ...PBx.DEFAULT_GUIDE }; S.hist = []; S.redo = []; S.multi = false; S.selSet = [];
    S.sel = "h1"; S.selUD = "h1"; S.hMode = "line";
    PBx.render();
    const v0 = S.g.h1;
    document.getElementById("posPlusV").click();
    const v1 = S.g.h1;
    document.getElementById("posPlusV").click();
    const v2 = S.g.h1;
    const redoLockedAtStart = document.getElementById("btnRedo").disabled;
    document.getElementById("btnUndo").click();            // → v1
    const afterUndo = S.g.h1;
    document.getElementById("btnRedo").click();            // → v2 로 복귀
    const afterRedo = S.g.h1;
    document.getElementById("btnUndo").click();
    document.getElementById("btnUndo").click();            // → v0
    const back = S.g.h1;
    document.getElementById("posMinusV").click();          // 새 작업 → redo 갈래 폐기
    const redoCleared = document.getElementById("btnRedo").disabled;
    return { v0, v1, v2, afterUndo, afterRedo, back, redoLockedAtStart, redoCleared };
  });
  check("57. 다시 실행 — 되돌린 작업을 다시 앞으로 (새 작업 시 갈래 폐기)",
    rd.redoLockedAtStart === true && rd.v1 !== rd.v0 && rd.v2 !== rd.v1     /* 실제로 값이 바뀌었어야 의미 있는 검증 */
      && Math.abs(rd.afterUndo - rd.v1) < 1e-9
      && Math.abs(rd.afterRedo - rd.v2) < 1e-9 && Math.abs(rd.back - rd.v0) < 1e-9
      && rd.redoCleared === true,
    `${rd.v0.toFixed(4)}→${rd.v1.toFixed(4)}→${rd.v2.toFixed(4)} ⇠${rd.afterUndo.toFixed(4)} ⇢${rd.afterRedo.toFixed(4)} ⇠⇠${rd.back.toFixed(4)}, 새작업후잠김=${rd.redoCleared}`);

  // 58. 전체라인 — 여러라인의 후속 버튼 (여러라인 OFF 면 화면에 없다)
  const allSel = await p.evaluate(() => {
    const S = window.PB.S, PBx = window.PB;
    S.g = { ...PBx.DEFAULT_GUIDE }; S.multi = false; S.selSet = []; S.sel = "h1";
    PBx.render();
    const hiddenWhenOff = document.getElementById("btnAllSel").hidden;
    document.getElementById("btnMulti").click();           // 여러라인 ON
    const shownWhenOn = !document.getElementById("btnAllSel").hidden;
    document.getElementById("btnAllSel").click();          // 전체 선택
    const picked = [...S.selSet].sort();
    document.getElementById("btnAllSel").click();          // 다시 → 전체 해제
    const cleared = S.selSet.length;
    document.getElementById("btnMulti").click();           // 여러라인 OFF
    return { hiddenWhenOff, shownWhenOn, picked, cleared, hiddenAgain: document.getElementById("btnAllSel").hidden };
  });
  /* v1.30.1 — 기본 표시가 **전부 켜짐**. V 기본구조(피봇·앵글)만 꺼져 있다.
     `outerAngle` 은 각도라 전체 선택에 넣지 않는다 (1-7). */
  check("58. 전체라인 — 여러라인 후속 버튼 · 보이는 선 전부 선택/해제",
    allSel.hiddenWhenOff === true && allSel.shownWhenOn === true
      && allSel.picked.join() === "archThickness,front,frontThickness,h1,h2,h3,v1,v2,v4,v6"
      && allSel.cleared === 0 && allSel.hiddenAgain === true,
    `OFF숨김=${allSel.hiddenWhenOff} ON표시=${allSel.shownWhenOn} 선택=[${allSel.picked}] 해제=${allSel.cleared}개`);

  // 59. 전체라인으로 고른 선들이 한 번에 움직인다
  await p.evaluate(() => {
    const S = window.PB.S, PBx = window.PB;
    S.g = { ...PBx.DEFAULT_GUIDE }; S.g.h2Visible = true; S.g.h3Visible = true;
    S.multi = false; S.selSet = []; S.sel = "h1"; S.locked = true;
    document.getElementById("btnMulti").click();
    document.getElementById("btnAllSel").click();
    PBx.render();
  });
  await p.waitForTimeout(120);
  const b59 = await p.evaluate(() => ({ ...window.PB.S.g }));
  await p.mouse.move(box2.x + box2.width * 0.20, box2.y + box2.height * 0.30);
  await p.mouse.down();
  await p.mouse.move(box2.x + box2.width * 0.20, box2.y + box2.height * 0.30 + 40, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(120);
  const a59 = await p.evaluate(() => ({ ...window.PB.S.g }));
  const d59 = (k) => (a59[k] - b59[k]) * box2.height;
  check("59. 전체라인 — 화면의 모든 가로선이 한 번에 이동",
    near(d59("h1"), 40, 3) && near(d59("h2"), 40, 3) && near(d59("h3"), 40, 3),
    `Δ Eye=${d59("h1").toFixed(1)} Arch=${d59("h2").toFixed(1)} Tail=${d59("h3").toFixed(1)}`);
  await p.evaluate(() => {
    const S = window.PB.S;
    S.multi = false; S.selSet = []; S.locked = false; S.hist = []; S.redo = [];
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.sel = "h1"; window.PB.render();
  });

  // 60. 한/영 — 왼쪽 라인 버튼 이름이 언어를 따라간다
  const lang = await p.evaluate(() => {
    const btn = (k) => document.querySelector(`.lbtn[data-key="${k}"]`).textContent.trim();
    const on = (id) => document.getElementById(id).classList.contains("on");
    document.getElementById("langKoR").click();
    const ko = { eye: btn("h1"), center: btn("v1"), pivot: document.getElementById("btnPivot").textContent.trim(), koOn: on("langKoR"), enOn: on("langEnR") };
    document.getElementById("langEnR").click();
    const en = { eye: btn("h1"), center: btn("v1"), koOn: on("langKoR"), enOn: on("langEnR") };
    document.getElementById("langKoR").click();
    return { ko, en };
  });
  check("60. 한/영 전환 — 라인 버튼 이름 · 현재 언어만 색 켜짐",
    lang.ko.eye === "눈" && lang.ko.center === "센터" && lang.ko.pivot === "V 센터 피봇"
      && lang.ko.koOn && !lang.ko.enOn
      && lang.en.eye === "Eye" && lang.en.center === "Center" && lang.en.enOn && !lang.en.koOn,
    `한=[${lang.ko.eye}/${lang.ko.center}/${lang.ko.pivot}] 영=[${lang.en.eye}/${lang.en.center}]`);

  // 61. 기본값 — 눈 기준선 0.60 · V 피봇 위 10% · V 앵글 아래 45°
  const defs = await p.evaluate(() => {
    const D = window.PB.DEFAULT_GUIDE;
    return { h1: D.h1, inner: D.innerAngle, outer: D.outerAngle, max: window.PB.V_ANGLE_MAX };
  });
  const vDeg = (defs.outer - 0.5) * 2 * defs.max;
  check("61. 기본값 — 눈 0.60 · V 피봇 위 10% · V 앵글 아래 45°",
    near(defs.h1, 0.60, 1e-6) && near(defs.inner, 0.10, 1e-6) && near(vDeg, -45, 0.2),
    `눈=${defs.h1} 피봇=${defs.inner} 앵글=${vDeg.toFixed(1)}°`);

  /* ── v1.20.0 디자인 시스템 ─────────────────────────────
     한 줄 규칙: 그라데이션·글로우는 "지금 켜져 있는 모드"에만.
     왼쪽 레일(목록)과 사진 위 가이드 선은 절대 발광하지 않는다. */

  // 62. 아이콘은 SVG 선 아이콘 — 이모지가 남아 있으면 안 된다 (기기마다 모양이 달라짐)
  const icons = await p.evaluate(() => {
    const ids = ["btnChange","btnPresetLoad","btnExport","btnLock","btnUndo","btnRedo"];   /* v1.28.0 — 눈가이드 제거 · 초기화는 칩(글자) */
    const bad = [], ok = [];
    for (const id of ids) {
      const i = document.getElementById(id).querySelector("i");
      const txt = (i.textContent || "").trim();
      if (i.querySelector("svg") && txt === "") ok.push(id); else bad.push(id + ":" + txt);
    }
    return { ok: ok.length, bad };
  });
  check("62. 아이콘 — 이모지 없음 · 전부 SVG 선 아이콘",
    icons.bad.length === 0 && icons.ok === 6, `SVG ${icons.ok}/6, 문제 [${icons.bad}]`);

  // 63. 왼쪽 레일은 담백 — 발광(box-shadow)·그라데이션 금지
  const railFlat = await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.sel = "h1"; window.PB.render();
    const els = [...document.querySelectorAll(".lbtn, #railExtra .chip, #railLang button")];
    const glowy = [], grad = [];
    for (const el of els) {
      const c = getComputedStyle(el);
      if (c.boxShadow && c.boxShadow !== "none") glowy.push(el.dataset.key || el.id || el.textContent.trim());
      if (/gradient/.test(c.backgroundImage)) grad.push(el.dataset.key || el.id || el.textContent.trim());
    }
    return { n: els.length, glowy, grad };
  });
  check("63. 왼쪽 레일 담백 — 발광·그라데이션 없음",
    railFlat.n > 10 && railFlat.glowy.length === 0 && railFlat.grad.length === 0,
    `${railFlat.n}개 검사 · 발광 [${railFlat.glowy}] · 그라데이션 [${railFlat.grad}]`);

  // 64. 라인 버튼: 왼쪽 색 띠 = 선 색 / 버튼 배경은 선 색이 아니다
  const stripe = await p.evaluate(() => {
    const b = document.querySelector('.lbtn[data-key="h1"]');
    const bg = getComputedStyle(b).backgroundColor;
    const dot = b.style.getPropertyValue("--dot").trim();
    const before = getComputedStyle(b, "::before").backgroundColor;
    return { dot, bg, before, sel: b.classList.contains("sel") };
  });
  check("64. 라인 버튼 — 색 띠가 선 색 · 버튼 전체를 선 색으로 칠하지 않음",
    stripe.dot.toUpperCase() === "#9AA3B2"
      && stripe.before === "rgb(154, 163, 178)"
      && !/154, 163, 178/.test(stripe.bg),
    `띠=${stripe.dot}(${stripe.before}) 배경=${stripe.bg}`);

  // 65. 잠금 아이콘은 상태에 따라 모양이 바뀐다 (색만으로 구분하지 않는다)
  const lockShape = await p.evaluate(() => {
    const svg = () => document.querySelector("#lockIcon svg").innerHTML;
    const S = window.PB.S;
    S.locked = false; window.PB.render();
    const open = svg();
    S.locked = true; window.PB.render();
    const shut = svg();
    S.locked = false; window.PB.render();
    return { open, shut, differ: open !== shut };
  });
  check("65. 잠금 아이콘 — 잠김/열림 모양이 다르다",
    lockShape.differ && lockShape.shut.includes("M8 10.5V7.8a4 4 0 0 1 8 0v2.7"),
    `모양다름=${lockShape.differ}`);

  /* ── v1.20.1 · 읽히는가 (대비) ─────────────────────────
     v1.20.0 에서 :root 토큰을 다크로 뒤집으면서 모달만 `background:#fff` 로 남아
     밝은 글자 + 흰 바탕 = 아무것도 안 보이는 사고가 났다. 그걸 막는 테스트다. */
  const contrast = (a, b) => {
    const lum = (c) => {
      const [r, g, bl] = c.match(/[\d.]+/g).slice(0, 3).map((v) => {
        v = +v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  // 66. 모달은 다크 · 글자가 읽힌다
  const modalC = await p.evaluate(() => {
    document.getElementById("mLoad").classList.add("on");
    const m = document.querySelector("#mLoad .modal");
    const h = m.querySelector("h3");
    const bg = getComputedStyle(m).backgroundColor;
    const fg = getComputedStyle(h).color;
    document.getElementById("mLoad").classList.remove("on");
    return { bg, fg };
  });
  check("66. 모달 대비 — 다크 바탕에 밝은 글자 (흰 바탕 금지)",
    contrast(modalC.bg, modalC.fg) >= 7,
    `배경 ${modalC.bg} / 글자 ${modalC.fg} · 대비 ${contrast(modalC.bg, modalC.fg).toFixed(1)}:1`);

  // 67. 시안 채움 버튼 위 글자는 어두워야 한다 (흰 글자는 대비 2:1 도 안 나온다)
  const priC = await p.evaluate(() => {
    document.getElementById("mLoad").classList.add("on");
    const b = document.querySelector("#mLoad .modal-row button.pri");
    const r = { bg: getComputedStyle(b).backgroundColor, fg: getComputedStyle(b).color };
    document.getElementById("mLoad").classList.remove("on");
    return r;
  });
  check("67. 액센트 채움 버튼 — 글자 대비 충분 (흰 글자 금지)",
    contrast(priC.bg, priC.fg) >= 7,
    `배경 ${priC.bg} / 글자 ${priC.fg} · 대비 ${contrast(priC.bg, priC.fg).toFixed(1)}:1`);

  // 68. 한 모달에 "채운" 버튼은 하나만 — 여러 개면 화면이 시끄럽고 뭐가 주 동작인지 모른다
  const filled = await p.evaluate(() => {
    localStorage.setItem("pb_presets_v1", JSON.stringify(
      [{ id: "t1", name: "테스트A", state: {} }, { id: "t2", name: "테스트B", state: {} }]));
    document.getElementById("btnPresetLoad").click();
    const m = document.querySelector("#mLoad .modal");
    const opaque = [...m.querySelectorAll("button")].filter((b) => {
      const c = getComputedStyle(b).backgroundColor.match(/[\d.]+/g);
      return c && (c.length < 4 || +c[3] > 0.5) && !(c[0] === "0" && c[1] === "0" && c[2] === "0" && (c[3] || 1) < 0.5);
    }).filter((b) => {
      const c = getComputedStyle(b).backgroundColor.match(/[\d.]+/g);
      return +c[0] + +c[1] + +c[2] > 120 && (c.length < 4 || +c[3] > 0.5);
    });
    const rows = m.querySelectorAll(".pitem").length;
    const labels = opaque.map((b) => b.textContent.trim());
    document.getElementById("mLoad").classList.remove("on");
    return { n: opaque.length, labels, rows };
  });
  check("68. 모달 — 채운 버튼은 주 동작 하나뿐",
    filled.rows >= 5 && filled.n === 1,
    `${filled.rows}줄 · 채운 버튼 ${filled.n}개 [${filled.labels}]`);

  /* ── v1.22.0 · AI 측정 배치 ─────────────────────────────
     실제 MediaPipe 는 테스트에서 못 돌리므로(모델 CDN 필요) **가짜 랜드마크**를 넣어
     계산 경로만 검증한다. 인덱스 규약이 바뀌면 여기서 잡힌다. */
  const FAKE_FACE = (opt = {}) => {
    const d = { innerR: 0.545, outerR: 0.670, ...opt };
    const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    const set = (i, x, y) => { lm[i] = { x, y, z: 0 }; };
    [468, 469, 470, 471, 472].forEach((i) => set(i, 0.400, 0.500));   // 왼 홍채
    [473, 474, 475, 476, 477].forEach((i) => set(i, 0.600, 0.500));   // 오른 홍채
    set(33, 0.330, 0.500); set(133, 0.455, 0.500);                    // 왼 외안각·내안각
    set(362, d.innerR, 0.500); set(263, d.outerR, 0.500);             // 오른 내안각·외안각
    set(70, 0.300, 0.420); set(300, 0.700, 0.420);                    // 꼬리 (위 윤곽)
    set(46, 0.305, 0.445); set(276, 0.695, 0.445);                    // 꼬리 (아래 윤곽)
    set(105, 0.420, 0.400); set(334, 0.580, 0.400);                   // 산 (위)
    set(52, 0.420, 0.440); set(282, 0.580, 0.440);                    // 산 (아래) = 두께
    set(107, 0.465, 0.430); set(336, 0.535, 0.430);                   // 앞머리 (위)
    set(55, 0.465, 0.455); set(285, 0.535, 0.455);                    // 앞머리 (아래) = 두께
    return lm;
  };

  // 69. 두께 선은 고정 오프셋이 아니라 **눈썹 아래 윤곽 실측**
  const meas = await p.evaluate((lm) => {
    const S = window.PB.S;
    S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
    const g = S.g;
    return { h2: g.h2, at: g.archThickness, front: g.front, ft: g.frontThickness };
  }, FAKE_FACE());
  /* 이미지에서 아치 위 0.400 / 아래 0.440, 앞머리 위 0.430 / 아래 0.455
     → 화면에서도 두께 선이 각 짝보다 **아래**(값이 큼)에 와야 한다 */
  check("69. 두께 선 — 눈썹 아래 윤곽 실측 (고정 오프셋 아님)",
    meas.at > meas.h2 + 0.005 && meas.ft > meas.front + 0.003
      && Math.abs((meas.at - meas.h2) - (meas.ft - meas.front) * (0.040 / 0.025)) < 0.02,
    `아치 ${meas.h2.toFixed(3)}→두께 ${meas.at.toFixed(3)} / 앞머리 ${meas.front.toFixed(3)}→두께 ${meas.ft.toFixed(3)}`);

  // 70. 비대칭 얼굴 — 이너 바 오차를 좌·우에 고르게 나눈다 (대칭은 유지)
  const asym = await p.evaluate((lm) => {
    const S = window.PB.S, W = S.dim.W;
    /* 랜드마크 수학만 검증한다 — 꼬리 픽셀 연장(v1.35.0)은 사진 잉크에 따라 좌우가
       달라질 수 있어, 이 검사에서는 사진을 잠시 치워 연장을 끈다 */
    const img = S.imgEl; S.imgEl = null;
    S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
    S.imgEl = img;
    const P = (i) => window.PB.imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W;
    return {
      inL: Math.abs(S.g.v2 - P(133)), inR: Math.abs(S.g.v3 - P(362)),
      /* 아우터는 v1.35.0 부터 **눈썹 꼬리(70/300)** 기준 — 눈꼬리(33/263)가 아니다 */
      outL: Math.abs(S.g.v4 - P(70)), outR: Math.abs(S.g.v5 - P(300)),
      sym: Math.abs((S.g.v2 + S.g.v3) / 2 - S.g.v1),
    };
  }, FAKE_FACE({ innerR: 0.575, outerR: 0.690 }));   // 오른쪽을 바깥으로 (비대칭 얼굴)
  /* 중심축을 **내안각 중점**으로 잡으므로 이너 바는 좌우 모두 정확히 닿는다.
     비대칭의 오차는 아우터로 옮겨가고, 그건 좌우에 **똑같이** 나뉘어야 한다. */
  check("70. 비대칭 얼굴 — 이너는 양쪽 다 닿고, 아우터 오차는 좌우 균등",
    asym.inL < 0.002 && asym.inR < 0.002
      && Math.abs(asym.outL - asym.outR) < 0.004 && asym.sym < 1e-6,
    `이너 ${(asym.inL * 100).toFixed(2)}%/${(asym.inR * 100).toFixed(2)}% · 아우터 ${(asym.outL * 100).toFixed(2)}%/${(asym.outR * 100).toFixed(2)}% · 대칭오차 ${asym.sym.toExponential(1)}`);

  // 71. 눈썹 꼬리가 프레임 안에 들어온다 (자동 정렬 후 잘리지 않음)
  const fit = await p.evaluate((lm) => {
    const S = window.PB.S, W = S.dim.W;
    S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
    const X = (i) => window.PB.imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W;
    return { tailL: X(70), tailR: X(300), wr: S.wr / W, zoom: S.p.zoom };
  }, FAKE_FACE());
  check("71. 자동 정렬 — 양쪽 눈썹 꼬리가 화면 안 (잘리지 않음)",
    fit.tailL > 0.01 && fit.tailR < fit.wr - 0.01,
    `왼쪽 꼬리 ${(fit.tailL * 100).toFixed(1)}% / 오른쪽 ${(fit.tailR * 100).toFixed(1)}% (작업영역 ${(fit.wr * 100).toFixed(1)}%, 배율 ${fit.zoom.toFixed(2)}×)`);

  // 72. 꺼져 있던 선을 켜면 그 사진에서 **측정한 자리**로 올라온다
  const snap = await p.evaluate((lm) => {
    const S = window.PB.S;
    S.landmarks = lm; window.PB.autoAlign(lm);
    S.g.h2Visible = false; S.g.h2 = 0.10;          // 엉뚱한 값으로 밀어둠
    S.multi = false; S.selSet = []; S.sel = "h1"; S.hMode = "line";
    window.PB.render();
    const want = window.PB.aiValueFor("h2");
    document.querySelector('.lbtn[data-key="h2"]').click();   // 켜기
    const got = S.g.h2;
    /* 랜드마크가 없으면(얼굴 인식 실패) 조용히 마지막 값 유지 */
    S.landmarks = null; S.g.h3Visible = false; S.g.h3 = 0.11;
    document.querySelector('.lbtn[data-key="h3"]').click();
    const noAi = S.g.h3;
    return { want, got, vis: S.g.h2Visible, noAi };
  }, FAKE_FACE());
  check("72. 선을 켜면 AI 측정 위치로 배치 (인식 실패 시엔 그대로)",
    snap.vis === true && Math.abs(snap.got - snap.want) < 1e-9
      && Math.abs(snap.got - 0.10) > 0.05 && Math.abs(snap.noAi - 0.11) < 1e-9,
    `0.100 → ${snap.got.toFixed(3)} (기대 ${snap.want.toFixed(3)}) · 랜드마크 없을 때 ${snap.noAi.toFixed(3)} 유지`);

  await p.evaluate(() => {
    const S = window.PB.S;
    S.landmarks = null; S.g = { ...window.PB.DEFAULT_GUIDE };
    S.p = { ...window.PB.S.p, zoom: 1, rot: 0, ox: 0, oy: 0 };
    S.sel = "h1"; S.hist = []; S.redo = []; window.PB.render();
  });

  /* 73. 자 정렬 (v1.24.0) — 짝끼리 길이·끝이 같아야 두께를 눈으로 잰다
     · 앞머리 = 앞두께 (완전히 동일)
     · 아치  = 아치두께 (완전히 동일) · 눈썹 **산**이 있는 바깥쪽
     · 꼬리  = 제일 바깥 · 얇은 실선 없음
     · 눈    = 좌우 관통 · 짙은 회색 반투명 */
  const ruler = await p.evaluate(() => {
    const S = window.PB.S;
    const spec = (k) => window.PB.H_SPECS.find((x) => x.key === k);
    const px = (k) => window.PB.segPx(spec(k));
    const seg = (k) => JSON.stringify(px(k));
    S.g = { ...window.PB.DEFAULT_GUIDE };
    for (const k of ["h2Visible", "h3Visible", "archThicknessVisible", "frontVisible", "frontThicknessVisible"]) S.g[k] = true;
    window.PB.render();
    /* 얇은 실선(0.16)이 붙은 y 높이들 */
    const H = S.dim.H;
    const faintY = [...document.getElementById("guides").querySelectorAll("line")]
      .filter((l) => Math.abs(+l.getAttribute("stroke-opacity") - 0.16) < 1e-6
                  && Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")) < 0.5)
      .map((l) => Math.round(+l.getAttribute("y1")));
    const near = (k) => faintY.some((y) => Math.abs(y - S.g[k] * H) < 1.5);
    return {
      frontPair: seg("front") === seg("frontThickness"),
      archPair: seg("h2") === seg("archThickness"),
      archOutOfHead: px("h2")[0][1] < px("front")[0][0],   // 아치가 앞머리보다 바깥
      tailOutermost: px("h3")[0][0] < px("h2")[0][0],      // 꼬리가 제일 바깥
      tailHair: near("h3"), archHair: near("h2"), frontHair: near("front"), eyeHair: near("h1"),
      eye: { c: spec("h1").color, op: spec("h1").op },
    };
  });
  check("73. 자 정렬 — 짝끼리 동일 · 아치는 바깥 · 꼬리·눈은 얇은 실선 없음 · 눈은 회색 반투명",
    ruler.frontPair && ruler.archPair && ruler.archOutOfHead && ruler.tailOutermost
      && ruler.tailHair === false && ruler.eyeHair === false
      && ruler.archHair === true && ruler.frontHair === true
      && ruler.eye.c === "#3A3F4A" && ruler.eye.op === 0.5,
    `앞머리쌍=${ruler.frontPair} 아치쌍=${ruler.archPair} 아치바깥=${ruler.archOutOfHead} 꼬리최외곽=${ruler.tailOutermost} · 얇은실선 꼬리=${ruler.tailHair}/눈=${ruler.eyeHair}/아치=${ruler.archHair} · 눈 ${ruler.eye.c} ${ruler.eye.op}`);

  /* ── v1.25.0 · 프리셋을 고객 얼굴에 맞춤 ───────────────── */

  // 74. 얼굴이 넓은/좁은 고객에게 같은 프리셋을 올리면 선이 그 얼굴 크기로 환산된다
  const pfit = await p.evaluate(() => {
    const S = window.PB.S, D = window.PB.DEFAULT_GUIDE;
    /* 좁은 얼굴에서 저장한 프리셋 (이너 반폭 0.10 · 눈~아치 0.20) */
    const src = { ...D, v1: 0.50, v2: 0.40, v3: 0.60, v4: 0.30, v5: 0.70,
                  h1: 0.60, h2: 0.40, h3: 0.46, front: 0.44,
                  h2Visible: true, h3Visible: true, frontVisible: true };
    const preset = { id: "t:fit", name: "테스트", state: src, frame: window.PB.faceFrame(src) };

    /* 지금 고객: 얼굴이 1.5배 넓고, 눈~눈썹 사이가 1.5배 멀다 */
    S.g = { ...D, v1: 0.50, v2: 0.35, v3: 0.65, v4: 0.20, v5: 0.80, h1: 0.60, h2: 0.30 };
    window.PB.applyPreset(preset);
    const wide = { ...S.g };

    /* 지금 고객: 얼굴이 절반으로 좁고 눈썹도 가깝다 */
    S.g = { ...D, v1: 0.50, v2: 0.45, v3: 0.55, v4: 0.40, v5: 0.60, h1: 0.60, h2: 0.50 };
    window.PB.applyPreset(preset);
    const narrow = { ...S.g };

    return {
      wide:   { v4: wide.v4,   h3: wide.h3,   sym: Math.abs((wide.v2 + wide.v3) / 2 - wide.v1) },
      narrow: { v4: narrow.v4, h3: narrow.h3, sym: Math.abs((narrow.v2 + narrow.v3) / 2 - narrow.v1) },
      on: !!S.activePreset,
    };
  });
  /* 원본: v4 는 중심에서 −0.20 (ux 0.10 의 2배) · h3 는 눈에서 −0.14 (uy 0.20 의 0.7배)
     넓은 얼굴(ux 0.15 · uy 0.30) → v4 = 0.50 − 0.30 = 0.20 · h3 = 0.60 − 0.21 = 0.39
     좁은 얼굴(ux 0.05 · uy 0.10) → v4 = 0.50 − 0.10 = 0.40 · h3 = 0.60 − 0.07 = 0.53 */
  check("74. 프리셋 — 고객 얼굴 폭·눈썹 높이에 맞춰 자동 환산 (대칭 유지)",
    near(pfit.wide.v4, 0.20, 0.005) && near(pfit.wide.h3, 0.39, 0.005)
      && near(pfit.narrow.v4, 0.40, 0.005) && near(pfit.narrow.h3, 0.53, 0.005)
      && pfit.wide.sym < 1e-9 && pfit.narrow.sym < 1e-9,
    `넓은얼굴 아우터 ${pfit.wide.v4.toFixed(3)} 꼬리 ${pfit.wide.h3.toFixed(3)} / 좁은얼굴 아우터 ${pfit.narrow.v4.toFixed(3)} 꼬리 ${pfit.narrow.h3.toFixed(3)}`);

  // 75. 프리셋 적용 중이면 프리셋 버튼에 표시 · 초기화하면 꺼진다
  const badge = await p.evaluate(() => {
    const S = window.PB.S;
    const on = () => document.getElementById("btnPresetLoad").classList.contains("preset-on");
    const applied = on();
    document.getElementById("btnReset").click();
    return { applied, afterReset: on(), id: S.activePreset };
  });
  check("75. 프리셋 적용 중 표시 · 초기화 시 해제",
    badge.applied === true && badge.afterReset === false && badge.id === null,
    `적용중=${badge.applied} 초기화후=${badge.afterReset}`);

  // 76. 기준틀이 없는 옛 프리셋은 예전처럼 그대로 적용 (기존 저장분이 깨지지 않아야 함)
  const legacy = await p.evaluate(() => {
    const S = window.PB.S, D = window.PB.DEFAULT_GUIDE;
    S.g = { ...D, v1: 0.5, v2: 0.35, h1: 0.6, h2: 0.3 };
    window.PB.applyPreset({ id: "t:old", name: "옛것", state: { ...D, v2: 0.42, h3: 0.47, h3Visible: true } });
    return { v2: S.g.v2, h3: S.g.h3 };
  });
  check("76. 기준틀 없는 옛 프리셋 — 환산 없이 그대로 적용",
    near(legacy.v2, 0.42, 1e-9) && near(legacy.h3, 0.47, 1e-9),
    `이너 ${legacy.v2} 꼬리 ${legacy.h3}`);

  await p.evaluate(() => {
    const S = window.PB.S;
    S.activePreset = null; S.g = { ...window.PB.DEFAULT_GUIDE };
    S.sel = "h1"; S.hist = []; S.redo = []; window.PB.render();
  });

  /* ── v1.28.0 · 프리셋 즐겨찾기 ─────────────────────────── */

  // 84. 즐겨찾기 — 지정한 개수만큼만 버튼으로 나오고, 누르면 그 프리셋이 올라간다
  const fav = await p.evaluate(() => {
    localStorage.removeItem("pb_favs_v1");
    localStorage.removeItem("pb_presets_v1");
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.activePreset = null;
    const row = () => [...document.querySelectorAll("#favRow .favbtn")];
    const names = () => row().map((b) => b.querySelector("em").textContent);
    window.PB.buildFavBar();
    const none = row().length;                       // 하나도 없으면 빈 자리도 없어야 한다
    localStorage.setItem("pb_favs_v1", JSON.stringify(["b:bold"]));
    window.PB.buildFavBar();
    const one = names();
    localStorage.setItem("pb_favs_v1", JSON.stringify(["b:bold", "b:arch"]));
    window.PB.buildFavBar();
    const two = names();
    /* 눌러서 실제로 적용되는지 — 아치형 프리셋은 h2 가 0.28 */
    row()[1].click();
    const applied = { h2: S.g.h2, id: S.activePreset };
    /* 지워진 프리셋 id 는 조용히 걸러낸다 */
    localStorage.setItem("pb_favs_v1", JSON.stringify(["b:bold", "u:없는것"]));
    window.PB.buildFavBar();
    const filtered = row().length;
    return { none, one, two, applied, filtered };
  });
  check("84. 즐겨찾기 — 지정한 개수만큼만 · 누르면 바로 적용 · 없는 id 는 걸러냄",
    fav.none === 0 && fav.one.length === 1 && fav.two.length === 2
      && fav.applied.id === "b:arch" && Math.abs(fav.applied.h2 - 0.28) < 0.06
      && fav.filtered === 1,
    `0개→${fav.none} 1개→[${fav.one}] 2개→[${fav.two}] · 적용=${fav.applied.id} · 없는id걸러냄=${fav.filtered === 1}`);

  // 85. 별표는 3개까지 — 4번째는 들어가지 않고, 다시 누르면 해제된다
  const star = await p.evaluate(() => {
    localStorage.removeItem("pb_favs_v1");
    localStorage.setItem("pb_presets_v1", JSON.stringify([{ id: "u:t1", name: "테스트A", state: {} }]));
    document.getElementById("btnPresetLoad").click();
    const s = (id) => document.querySelector(`#presetList .star[data-star="${id}"]`);
    const favs = () => JSON.parse(localStorage.getItem("pb_favs_v1") || "[]");
    s("b:natural").click(); s("b:bold").click(); s("b:arch").click();
    const three = favs();
    const litUp = [...document.querySelectorAll("#presetList .star.on")].length;
    s("u:t1").click();                                  // 4번째 — 거부돼야 한다
    const stillThree = favs();
    const toastMsg = document.getElementById("toast").textContent;
    s("b:bold").click();                                // 해제
    const afterOff = favs();
    const barCount = document.querySelectorAll("#favRow .favbtn").length;
    document.getElementById("mLoad").classList.remove("on");
    localStorage.removeItem("pb_presets_v1");
    localStorage.removeItem("pb_favs_v1");
    window.PB.buildFavBar();
    return { three, litUp, stillThree, toastMsg, afterOff, barCount };
  });
  check("85. 별표 — 3개까지 · 4번째는 거부 · 다시 누르면 해제",
    star.three.length === 3 && star.litUp === 3
      && star.stillThree.length === 3 && !star.stillThree.includes("u:t1")
      && /3개까지/.test(star.toastMsg)
      && star.afterOff.length === 2 && !star.afterOff.includes("b:bold")
      && star.barCount === 2,
    `3개=[${star.three}] 켜진별=${star.litUp} · 4번째거부=${star.stillThree.length === 3}("${star.toastMsg}") · 해제후=[${star.afterOff}] 버튼=${star.barCount}개`);

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

  /* 81. 홈(사진 선택)은 기기 방향 그대로 — 가짜 회전은 편집 화면에서만 (v1.27.0)
     홈까지 돌려놓으면 iOS 사진 시트(OS 가 그림)와 90° 어긋나 사진을 못 고른다. */
  const homeUp = await p.evaluate(() => ({
    rot: document.body.classList.contains("rot90"),
    editorOn: document.getElementById("editor").classList.contains("active"),
    homeOn: document.getElementById("home").classList.contains("active"),
    ctaVisible: document.getElementById("pickBtn").getBoundingClientRect().width > 40,
  }));

  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1200);

  const cls = await p.evaluate(() => ({
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
    railVisible: getComputedStyle(document.getElementById("lineRail")).display !== "none",
    stageW: document.getElementById("stage").offsetWidth,
    stageH: document.getElementById("stage").offsetHeight,
  }));
  check("81. 홈(사진 선택)은 세로 그대로 · 사진을 넣으면 편집기가 가로로",
    homeUp.rot === false && homeUp.homeOn && !homeUp.editorOn && homeUp.ctaVisible && cls.rot === true,
    `홈 rot90=${homeUp.rot} 사진선택버튼=${homeUp.ctaVisible} → 편집기 rot90=${cls.rot}`);

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

  /* 82. 사진 선택 시트가 열려 있는 동안 — **방향은 그대로**, 화면만 어두워진다 (v1.27.0)
        세로로 되돌리면 지금 가로인지 세로인지 헷갈리므로 딤만 깐다.
        ⚠️ 실제 iOS 시트는 자동화로 못 띄우므로 **판정 경로만** 검증한다.
           파일 다이얼로그가 뜨지 않도록 input.click 만 잠시 막는다. */
  const pickRot = await p.evaluate(() => {
    const inp = document.getElementById("fileInput");
    const real = inp.click.bind(inp);
    inp.click = () => {};                      // 다이얼로그는 열지 않는다
    const rot = () => document.body.classList.contains("rot90");
    const dim = () => {
      const s = getComputedStyle(document.querySelector(".screen.active"), "::after");
      const m = (s.backgroundColor || "").match(/[\d.]+/g);
      return !!m && m.length === 4 && +m[3] > 0.3 && s.content !== "none";
    };
    const before = { rot: rot(), dim: dim() };
    window.PB.openPicker();
    const during = { rot: rot(), dim: dim() };
    window.PB.endPicking();
    const after = { rot: rot(), dim: dim() };
    inp.click = real;
    return { before, during, after };
  });
  check("82. 사진 선택 중 — 가로 그대로 · 화면만 어둡게 · 닫으면 복구",
    pickRot.before.rot === true && pickRot.before.dim === false
      && pickRot.during.rot === true && pickRot.during.dim === true
      && pickRot.after.rot === true && pickRot.after.dim === false,
    `가로 ${pickRot.before.rot}→${pickRot.during.rot}→${pickRot.after.rot} · 딤 ${pickRot.before.dim}→${pickRot.during.dim}→${pickRot.after.dim}`);

  /* 29. v1.8.0 — 기본(auto)에서 회전 잠금이 켜진 세로 터치 기기도 항상 가로.
        저장값을 스스로 off 로 바꾸지 않아야 한다(v1.7.0 자동 해제 로직 제거 확인).
        v1.27.0 — 가짜 회전은 편집 화면에서만이므로 사진을 넣은 뒤에 검사한다. */
  await p.evaluate(() => localStorage.removeItem("pb_orient"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(500);
  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1200);
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

  /* 40. 왼쪽 아래 = 프리셋(+즐겨찾기) · 좌우 드래그 바와 겹치지 않음 (가로 전용 · v1.28.0)
     v1.27.0 까지는 여기에 메뉴 6버튼이 한 줄로 있었고 초기화가 끝에 붙어 있었습니다.
     v1.28.0 에서 사진변경→오른쪽 위 / 저장·잠금→가운데 / 초기화→위쪽 칩 줄로 흩어졌습니다. */
  const menuPos = await p.evaluate(() => {
    const r = (id) => document.getElementById(id).getBoundingClientRect();
    const n = r("leftDock"), st = r("stage"), h = r("posCtlH");
    return {
      leftBottom: n.left - st.left < 20 && st.bottom - n.bottom < 24,
      ids: [...document.querySelectorAll("#menuRow button")].map((b) => b.id).join(","),
      gone: !document.getElementById("btnEyeGuide"),
      noOverlap: n.right < h.left,
    };
  });
  // 45·46. 라벨 배치 (가로 전용 — 세로 폴백은 폭이 좁아 규칙이 다름)
  const lab = await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.g.v4Visible = true;
    S.sel = "h1"; S.selUD = "h1"; window.PB.render();
    const l = document.querySelector("#posCtlV .plabel").getBoundingClientRect();
    const bar = document.getElementById("posCtlV").getBoundingClientRect();
    const st = document.getElementById("stage").getBoundingClientRect();
    const svg = document.getElementById("guides");
    const rects = [...svg.querySelectorAll("rect")].map((r) => ({
      x: +r.getAttribute("x"), y: +r.getAttribute("y"),
      w: +r.getAttribute("width"), h: +r.getAttribute("height"),
    })).filter((r) => r.h === 14);
    const chip = document.getElementById("btnAllLine");
    const par = chip.offsetParent;
    const cx = (par ? par.offsetLeft : 0) + chip.offsetLeft;
    const cy = (par ? par.offsetTop : 0) + chip.offsetTop;
    const hitChip = rects.some((r) => r.x < cx + chip.offsetWidth && r.x + r.w > cx
      && r.y < cy + chip.offsetHeight && r.y + r.h > cy);
    return {
      rightOfBar: l.left >= bar.right - 1, inside: l.right <= st.right + 1,
      gap: Math.round(l.left - bar.right),
      count: rects.length, top: Math.min(...rects.map((r) => r.y)), hitChip,
    };
  });
  /* 48. 가로 자의 길이 = **눈썹 구간**(이너~아우터) (v1.21.0)
     · 오른쪽 드래그 바를 넘지 않는다 (v1.17.0 규칙 유지)
     · 이너·아우터를 좁히면 가로 자도 같이 짧아진다 — 캔버스 폭을 따라가면 안 된다 */
  const hLine = await p.evaluate(() => {
    const S = window.PB.S, W = S.dim.W;
    const span = () => {
      const lines = [...document.getElementById("guides").querySelectorAll("line")]
        .map((l) => ({ x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
                       y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
                       o: +(l.getAttribute("stroke-opacity") || 1) }))
        .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.x1 - l.x2) > 1 && l.o > 0.2);
      return { n: lines.length,
        minX: Math.min(...lines.map((l) => Math.min(l.x1, l.x2))),
        maxX: Math.max(...lines.map((l) => Math.max(l.x1, l.x2))) };
    };
    S.g = { ...window.PB.DEFAULT_GUIDE };
    S.g.h2Visible = true; S.g.h3Visible = true; S.g.archThicknessVisible = true;
    /* 넓은 눈썹 */
    S.g.v1 = 0.5; S.g.v2 = 0.34; S.g.v3 = 0.66; S.g.v4 = 0.16; S.g.v5 = 0.84;
    window.PB.render();
    const wide = span();
    /* 좁은 눈썹 — 아우터를 중앙 쪽으로 */
    S.g.v4 = 0.30; S.g.v5 = 0.70;
    window.PB.render();
    const narrow = span();
    S.g = { ...window.PB.DEFAULT_GUIDE }; window.PB.render();
    return { wide, narrow, dockL: document.getElementById("rightDock").offsetLeft, W };
  });
  const wideLen = hLine.wide.maxX - hLine.wide.minX;
  const narrowLen = hLine.narrow.maxX - hLine.narrow.minX;
  check(`48. ${dev.n} — 가로 자 길이 = 눈썹 구간 (바를 넘지 않음)`,
    hLine.wide.n >= 4 && hLine.wide.maxX <= hLine.dockL + 1
      && narrowLen < wideLen * 0.85                       // 눈썹을 좁히면 자도 짧아진다
      && narrowLen > wideLen * 0.4,
    `넓은눈썹 ${Math.round(wideLen)}px → 좁은눈썹 ${Math.round(narrowLen)}px (캔버스 ${hLine.W}px, 바 ${hLine.dockL}px)`);

  // 47. 컨트롤 영역 스크림 — 터치를 막지 않고, 가이드 선보다 아래에 깔린다 (v1.16.0)
  const scrim = await p.evaluate(() => {
    const b = document.querySelector(".scrim-b"), r = document.querySelector(".scrim-r");
    const g = document.getElementById("guides"), st = document.getElementById("stage");
    if (!b || !r) return { ok: false };
    const kids = [...st.children];
    const br = b.getBoundingClientRect(), rr = r.getBoundingClientRect();
    const bd = document.getElementById("bottomDock").getBoundingClientRect();
    const ld = document.getElementById("leftDock").getBoundingClientRect();
    return {
      ok: true,
      noTouch: getComputedStyle(b).pointerEvents === "none" && getComputedStyle(r).pointerEvents === "none",
      belowGuides: kids.indexOf(b) < kids.indexOf(g) && kids.indexOf(r) < kids.indexOf(g),
      coversDocks: br.top <= bd.top + 2 && br.top <= ld.top + 2,
      coversBar: rr.left <= document.getElementById("posCtlV").getBoundingClientRect().left + 2,
    };
  });
  check(`47. ${dev.n} — 컨트롤 영역 스크림 (터치 통과 · 선이 위)`,
    scrim.ok && scrim.noTouch && scrim.belowGuides && scrim.coversDocks && scrim.coversBar,
    `터치통과=${scrim.noTouch} 선위=${scrim.belowGuides} 아래도크덮음=${scrim.coversDocks} 세로바덮음=${scrim.coversBar}`);

  check(`45. ${dev.n} — 세로 조절자 값 라벨이 바 오른쪽 · 캔버스 안`,
    lab.rightOfBar && lab.inside, `바 오른쪽=${lab.rightOfBar}(간격 ${lab.gap}px) 캔버스안=${lab.inside}`);
  check(`46. ${dev.n} — 세로선 라벨이 캔버스 맨 위(갭 6px) · 칩과 겹침 없음`,
    lab.count >= 3 && lab.top >= 4 && lab.top <= 10 && !lab.hitChip,
    `개수=${lab.count} 맨위 y=${lab.top}px 칩겹침=${lab.hitChip}`);

  check(`40. ${dev.n} — 왼쪽 아래는 프리셋(+즐겨찾기) · 좌우 바와 겹치지 않음`,
    menuPos.leftBottom && menuPos.noOverlap && menuPos.gone
      && menuPos.ids === "btnPresetLoad",
    `왼쪽아래=${menuPos.leftBottom} 겹침없음=${menuPos.noOverlap} 눈가이드제거=${menuPos.gone} [${menuPos.ids}]`);

  /* 83. 버튼 자리 (v1.29.0) — 원장님이 정하신 자리
     · 오른쪽 도크 = `초기화`(짙은 빨강) …띄어서… `사진변경` → `사진저장` → 위아래 바
     · 가운데 아래 = `사진잠금` 하나. 가로 중심이 캔버스 정중앙
     · 좌우 바 왼쪽 = `다시 실행` · `되돌리기`
     · 밸런스 = 위쪽, **중앙보다 약간 왼쪽**
     · 즐겨찾기 3개를 채워도 아래 묶음끼리 겹치지 않는다 */
  const place = await p.evaluate(() => {
    localStorage.setItem("pb_favs_v1", JSON.stringify(["b:natural", "b:bold", "b:arch"]));
    window.PB.buildFavBar();
    const el = (id) => document.getElementById(id);
    const r = (id) => el(id).getBoundingClientRect();
    const st = r("stage"), chg = r("btnChange"), exp = r("btnExport"), lock = r("btnLock");
    const rst = r("btnReset"), ctlV = r("posCtlV"), rd = r("rightDock");
    const bal = r("btnBalance"), ld = r("leftDock"), cd = r("centerDock"), bd = r("bottomDock");
    const cs = getComputedStyle(el("btnReset"));
    return {
      photoInRDock: el("rightDock").contains(el("btnChange")) && el("rightDock").contains(el("btnExport")),
      photoOrder: rst.bottom <= chg.top + 1 && chg.bottom <= exp.top + 1 && exp.bottom <= ctlV.top + 1,
      chgSameSize: Math.abs(chg.height - exp.height) < 1 && Math.abs(chg.width - exp.width) < 6,
      chgGrey: !/34, 211, 238|103, 232, 249/.test(getComputedStyle(el("btnChange")).borderTopColor),
      resetTop: Math.abs(rst.top - rd.top) < 2,
      resetDarkRed: cs.color,
      lockAlone: el("centerDock").querySelectorAll("button").length === 1,
      lockCentre: ((lock.left + lock.right) / 2 - st.left) / st.width,
      balLeftOfCentre: ((bal.left + bal.right) / 2 - st.left) / st.width,
      favs: document.querySelectorAll("#favRow .favbtn").length,
      favShorter: r("btnPresetLoad").height - document.querySelector("#favRow .favbtn").getBoundingClientRect().height,
      /* 세로선 라벨이 위쪽 오버레이(밸런스·기준 버튼) 위에 겹쳐 그려지지 않아야 한다 */
      labelHitsTop: (() => {
        /* ⚠️ 여기서는 **화면 실측(getBoundingClientRect)** 으로 잽니다.
           offsetLeft 는 CSS transform 을 반영하지 않아 `밸런스`·`드로잉 맞춤` 묶음
           (translateX(-50%))의 자리를 통째로 틀리게 잡습니다 (v1.32.0 에서 실제로 겪음).
           이 검사는 가로 뷰포트라 rot90 이 없어 실측이 안전합니다. */
        const sr = document.getElementById("stage").getBoundingClientRect();
        const boxes = ["btnAllLine", "btnMulti", "btnBalance", "btnSnap", "refWrap"].map((id) => {
          const e = document.getElementById(id);
          if (!e || !e.offsetWidth) return null;
          const b = e.getBoundingClientRect();
          return { x0: b.left - sr.left, x1: b.right - sr.left, y0: b.top - sr.top, y1: b.bottom - sr.top };
        }).filter(Boolean);
        return [...document.getElementById("guides").querySelectorAll("rect")]
          .filter((q) => +q.getAttribute("height") === 14)
          .some((q) => {
            const x = +q.getAttribute("x"), y = +q.getAttribute("y"), w = +q.getAttribute("width");
            return boxes.some((b) => x < b.x1 && x + w > b.x0 && y < b.y1 && y + 14 > b.y0);
          });
      })(),
      dockGaps: [Math.round(cd.left - ld.right), Math.round(bd.left - cd.right)],
    };
  });
  check(`83. ${dev.n} — 사진 2버튼=오른쪽 도크 · 잠금 단독 정가운데 · 밸런스는 중앙보다 왼쪽`,
    place.photoInRDock && place.photoOrder && place.chgSameSize && place.chgGrey
      && place.resetTop && /240, 56, 76/.test(place.resetDarkRed)
      && place.lockAlone && Math.abs(place.lockCentre - 0.5) < 0.02
      && place.balLeftOfCentre < 0.48 && place.balLeftOfCentre > 0.25
      && place.favs === 3 && place.favShorter > 6
      && place.dockGaps.every((g) => g > 8) && place.labelHitsTop === false,
    `사진2버튼=도크${place.photoInRDock}/순서${place.photoOrder} · 잠금단독=${place.lockAlone}/중심${(place.lockCentre * 100).toFixed(1)}% · 밸런스 ${(place.balLeftOfCentre * 100).toFixed(1)}% · 즐겨찾기가 ${place.favShorter.toFixed(0)}px 낮음 · 도크간격=${place.dockGaps}px · 라벨겹침=${place.labelHitsTop}`);
  await ctx.close();
}

/* ═══════ C. 밸런스 판정 (v1.26.0) ═══════
   실제 고객 사진 대신 **답을 아는 합성 사진**을 만든다.
   왼쪽 막대와 오른쪽 막대의 높이 차이를 정확히 몇 px 로 넣고, 그대로 잡아내는지 본다.
   ⚠️ 반드시 **가로 모드**에서 돌린다 — 세로 폴백은 작업 영역이 좁아 오른쪽 토막이 안 그려진다. */
console.log("\n[밸런스 판정]");
{
  const IW = 782, IH = 390, BY = 200;            // 가로 캔버스(844×390)의 스테이지 크기와 동일
  const balFace = (dyRight, draw = true) => {
    const bar = (x1, x2, yy) => `<rect x="${x1}" y="${yy}" width="${x2 - x1}" height="5" fill="#241a14"/>`;
    const marks = draw ? bar(60, 250, BY) + bar(560, 740, BY + dyRight) : "";
    const f = path.join(ROOT, `.bal-${dyRight}-${draw}.svg`);
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>${marks}</svg>`);
    return f;
  };

  const runCase = async (file, ref) => {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", file);
    await p.waitForTimeout(1300);
    const out = await p.evaluate((refSide) => {
      const S = window.PB.S;
      S.landmarks = null;
      S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 };
      /* v1.30.1 — 기본 표시가 전부 켜졌으므로 **검사 대상만 남기고 끈다.**
         합성 사진에는 아치 자리에만 막대가 있어 나머지는 "못 읽음"으로 건너뛴다. */
      S.g = { ...window.PB.DEFAULT_GUIDE, h2: 200 / S.dim.H, h2Visible: true,
              h3Visible: false, frontVisible: false, frontThicknessVisible: false,
              archThicknessVisible: false };
      S.refSide = refSide;
      window.PB.render();
      const ok = window.PB.runBalance();
      const b = S.balance;
      S.balOn = true; window.PB.render();
      /* 빨간 토막이 **기준 반대쪽에만** 그려지는지 */
      const reds = [...document.getElementById("guides").querySelectorAll("line")]
        .filter((l) => l.getAttribute("stroke") === "#FF3B4E"
                    && Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")) < 0.5)
        .map((l) => (+l.getAttribute("x1") + +l.getAttribute("x2")) / 2 / S.dim.W);
      return { ok, dim: { ...S.dim }, s0: S.s0, off: b ? { ...b.off } : null,
               skipped: b ? [...b.skipped] : null, reds };
    }, ref);
    await ctx.close();
    return { ...out, errs };
  };

  /* 77. 오른쪽 드로잉이 12px 아래 → 잡아낸다 · 빨간 표시는 오른쪽에만
     v1.29.0 부터 허용 오차가 **얼굴 크기 기준**(기본값 화면에서 약 6px)이라
     확실히 넘는 12px 로 검사합니다. 6px 은 86번에서 경계 검사로 씁니다. */
  const f1 = balFace(12);
  const c1 = await runCase(f1, "L");
  const exp = 12 * (c1.s0 || 1);
  check("77. 밸런스 — 기준(왼쪽) 대비 오른쪽 12px 차이를 잡아냄 · 빨간 표시는 반대쪽에만",
    c1.errs.length === 0 && c1.off && near(c1.off.h2 ?? 0, exp, 1.5)
      && c1.skipped.length === 0 && c1.reds.length === 1 && c1.reds[0] > 0.6,
    `측정 ${c1.off ? (c1.off.h2 ?? "없음") : "실패"}px (기대 ${exp.toFixed(1)}) · 건너뜀 [${c1.skipped}] · 빨간토막 ${c1.reds.length}개 x=${c1.reds.map((v) => v.toFixed(2))}`);

  // 78. 기준을 오른쪽으로 바꾸면 부호가 뒤집히고 빨간 표시도 왼쪽으로
  const c2 = await runCase(f1, "R");
  check("78. 밸런스 — 기준을 오른쪽으로 바꾸면 빨간 표시가 왼쪽으로",
    c2.off && near(c2.off.h2 ?? 0, -exp, 1.5) && c2.reds.length === 1 && c2.reds[0] < 0.4,
    `측정 ${c2.off ? (c2.off.h2 ?? "없음") : "실패"}px · 빨간토막 x=${c2.reds.map((v) => v.toFixed(2))}`);

  // 79. 좌우가 같으면 빨간 표시가 없다 (건너뛴 것도 없어야 진짜 통과)
  const f0 = balFace(0);
  const c3 = await runCase(f0, "L");
  check("79. 밸런스 — 좌우가 같으면 표시 없음",
    c3.off && Object.keys(c3.off).length === 0 && c3.skipped.length === 0 && c3.reds.length === 0,
    `차이 ${c3.off ? Object.keys(c3.off).length : "?"}곳 · 건너뜀 [${c3.skipped}] · 빨간토막 ${c3.reds.length}개`);

  // 80. 선을 못 읽으면 조용히 건너뛴다 (억지로 빨갛게 칠하지 않는다)
  const fN = balFace(0, false);
  const c4 = await runCase(fN, "L");
  check("80. 밸런스 — 그린 선이 없으면 조용히 건너뜀 (오판하지 않음)",
    c4.off && Object.keys(c4.off).length === 0 && c4.skipped.includes("h2") && c4.reds.length === 0,
    `건너뜀 [${c4.skipped}] · 빨간토막 ${c4.reds.length}개`);

  /* 86. 허용 오차는 **얼굴 크기를 따라간다** (v1.29.0)
     ⛔ px 고정으로 되돌리면 이 테스트가 잡습니다.
     같은 사진·같은 6px 차이인데도
       · 이너 간격이 좁으면(허용 오차 작음) → 잡아내고
       · 이너 간격이 넓으면(확대한 것과 같음) → 맞다고 본다
     원장님 기준: "이 정도는 밸런스가 맞다고 봐야 한다" (2026-08-20) */
  const f6 = balFace(6);
  /* ⚠️ 아우터(v4)는 **건드리지 마세요.** browX() 의 왼쪽 끝이 아우터에서 나오므로
     v4 를 옮기면 자 토막이 합성 막대 밖으로 나가 "측정 실패"가 되고, 허용 오차가 아니라
     엉뚱한 이유로 통과합니다(실제로 그렇게 잘못 짰다가 잡았습니다). 이너만 조절합니다. */
  const runTol = async (v2) => {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", f6);
    await p.waitForTimeout(1300);
    const out = await p.evaluate((nv2) => {
      const S = window.PB.S;
      S.landmarks = null;
      S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 };
      S.g = { ...window.PB.DEFAULT_GUIDE, h2: 200 / S.dim.H, h2Visible: true,
              h3Visible: false, frontVisible: false, frontThicknessVisible: false,
              archThicknessVisible: false, v1: 0.5, v2: nv2, v3: 1 - nv2 };
      S.refSide = "L";
      window.PB.render();
      window.PB.runBalance();
      return { tol: window.PB.balTolPx(), off: Object.keys(S.balance.off).length,
               inner: Math.abs(S.g.v3 - S.g.v2) * S.dim.W };
    }, v2);
    await ctx.close();
    return out;
  };
  const narrow = await runTol(0.45);   // 이너 간격 좁음 → 예민
  const wide = await runTol(0.20);     // 이너 간격 넓음(확대한 것과 같음) → 관대
  check("86. 밸런스 — 허용 오차가 얼굴 크기를 따라간다 (px 고정 아님)",
    narrow.tol < wide.tol - 1 && narrow.off === 1 && wide.off === 0,
    `좁은 얼굴 이너 ${Math.round(narrow.inner)}px → 허용 ${narrow.tol.toFixed(1)}px · 6px 차이 ${narrow.off ? "잡음" : "통과"} / ` +
    `넓은 얼굴 이너 ${Math.round(wide.inner)}px → 허용 ${wide.tol.toFixed(1)}px · 6px 차이 ${wide.off ? "잡음" : "통과"}`);

  /* 87·88. 드로잉 자동 맞춤 (v1.31.0)
     원장님은 **왼쪽 눈썹에 먼저 굵은 드로잉을 그리고**, 자가 그 선 위로 올라가야 합니다.
     v1.30.x 는 이너·아우터가 이미 맞아야 눈썹을 훑는 구조라 눈꺼풀을 읽었습니다.
     그래서 여기서는 **네모가 아니라 진짜 눈썹 모양**(아치가 있고 두께가 변하는)으로 검증합니다.
       앞머리 쪽 x 300~340 : 위 148 / 아래 178   (두껍다)
       아치      x  ~215   : 위 120 / 아래 140   (제일 높다)
       꼬리 쪽  x 120~150 : 위 152 / 아래 164   (얇다)
     87 = 얼굴 인식이 된 경우(랜드마크 상자로 눈썹만 훑는 실제 경로)
     88 = 얼굴 인식이 실패한 경우(절반을 통째로 훑는 예비 경로) */
  /* 모양 A — 아치가 **바깥쪽**(x 215)에 있는 눈썹 */
  const SHAPE_A = {
    cp: [[120, 152, 164], [150, 152, 164], [185, 122, 142], [215, 120, 140],
         [260, 132, 158], [300, 148, 178], [340, 148, 178]],
    front: [320, 148, 178], arch: [215, 120, 140], tail: [130, 152], inner: 340, outer: 120,
  };
  /* 모양 B — 아치가 **안쪽 가까이**(x 260) 있고 두께도 다른 눈썹.
     ⚠️ 이 모양이 있어야 「아치를 사진에서 찾는다」가 진짜로 검증됩니다.
     아치 자리를 코드에 박아 두면 A 는 통과해도 B 에서 틀립니다. */
  const SHAPE_B = {
    cp: [[120, 158, 168], [160, 154, 166], [210, 138, 162], [250, 120, 146],
         [270, 120, 146], [300, 130, 166], [340, 130, 166]],
    front: [320, 130, 166], arch: [260, 120, 146], tail: [130, 158], inner: 340, outer: 120,
  };
  const edgeAt = (cp, x, i) => {
    for (let k = 0; k < cp.length - 1; k++) {
      const a = cp[k], b = cp[k + 1];
      if (x >= a[0] && x <= b[0]) return a[i] + ((b[i] - a[i]) * (x - a[0])) / (b[0] - a[0]);
    }
    return cp[cp.length - 1][i];
  };
  /* outline=true → 속을 비우고 **테두리만** 그린 드로잉 (원장님이 자주 쓰시는 방식).
     이때 한 열에 위선·아래선이 따로 잡히므로, 앱이 둘을 한 덩어리로 봐야 두께가 맞습니다. */
  const drawFace = (sh, outline, tag) => {
    const f = path.join(ROOT, `.draw-${tag}.svg`);
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(sh.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(sh.cp, x, 2).toFixed(1)}`); }
    const poly = up.concat(dn.reverse()).join(" ");
    /* tag "n" → **맨 눈썹**: 피부(#e9d8c6, 휘도 ≈218)보다 겨우 ~13 어두운 색.
       1차 패스(대비 18)로는 안 보이고 2차 패스(대비 9)로만 잡힙니다 — 색을 진하게
       바꾸면 이 테스트는 1차로 통과해 버려서 2차 패스가 죽어도 모릅니다. */
    const ink = tag === "n" ? "#e0cab5" : "#2a1c14";
    const paint = outline ? `fill="none" stroke="${ink}" stroke-width="5"` : `fill="${ink}"`;
    /* crease=true → 눈썹 아래에 **쌍꺼풀 선**을 하나 깐다 (원장님 스크린샷의 실제 상황).
       눈썹보다 옅지만 또렷해서, 이걸 눈썹에 붙여 읽으면 앞두께가 피부까지 내려갑니다. */
    const crease = tag === "c"
      ? `<line x1="120" y1="205" x2="340" y2="205" stroke="#6a5040" stroke-width="5"/>` : "";
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${poly}" ${paint}/>${crease}</svg>`);
    return f;
  };

  /* 합성 랜드마크 — 그린 선 근처의 눈썹 털이라고 가정한 위/아래 윤곽 + 동공 */
  const LMK = (() => {
    const L = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    const put = (i, x, y) => { L[i] = { x: x / IW, y: y / IH, z: 0 }; };
    const upA = [[70, 124, 154], [63, 155, 152], [105, 200, 124], [66, 265, 136], [107, 336, 150]];
    const loA = [[46, 124, 162], [53, 155, 162], [52, 200, 140], [65, 265, 156], [55, 336, 176]];
    upA.forEach(([i, x, y]) => put(i, x, y));
    loA.forEach(([i, x, y]) => put(i, x, y));
    /* 반대쪽 눈썹 — 중심 391 기준 거울 */
    const mir = (i, j) => { const s = L[j]; L[i] = { x: (2 * 391) / IW - s.x, y: s.y, z: 0 }; };
    [[300, 70], [293, 63], [334, 105], [296, 66], [336, 107],
     [276, 46], [283, 53], [282, 52], [295, 65], [285, 55]].forEach(([a, b]) => mir(a, b));
    for (let i = 468; i <= 472; i++) put(i, 230, 250);
    for (let i = 473; i <= 477; i++) put(i, 552, 250);
    return L;
  })();

  const fd = drawFace(SHAPE_A, false, "a"), fo = drawFace(SHAPE_A, true, "ao"),
        fb = drawFace(SHAPE_B, false, "b"), fc = drawFace(SHAPE_A, false, "c"),
        fn = drawFace(SHAPE_A, false, "n");
  const runDraw = async (useLandmarks, file, tr, sh) => {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", file || fd);
    await p.waitForTimeout(1300);
    const out = await p.evaluate(([lm, tr, sh]) => {
      const S = window.PB.S, H = S.dim.H, W = S.dim.W;
      S.landmarks = lm;
      S.p = tr || { zoom: 1, rot: 0, ox: 0, oy: 0 };
      S.g = { ...window.PB.DEFAULT_GUIDE };
      S.refSide = "L";
      window.PB.render();
      /* 사진을 확대·이동해도 같은 자리에 붙어야 한다 — 기대값을 지금 변환으로 환산한다 */
      const cv = (ix, iy) => window.PB.imgToCanvas(ix, iy, S.p);
      const exp = { front: cv(sh.front[0], sh.front[1]).y, ft: cv(sh.front[0], sh.front[2]).y,
                    arch: cv(sh.arch[0], sh.arch[1]).y, at: cv(sh.arch[0], sh.arch[2]).y,
                    tail: cv(sh.tail[0], sh.tail[1]).y,
                    inner: cv(sh.inner, 160).x, outer: cv(sh.outer, 160).x,
                    archV: cv(sh.arch[0], sh.arch[1]).x };
      const ok = window.PB.autoFromDrawing();
      const g = S.g;
      return { ok, W, H, exp,
        frontPx: g.front * H, ftPx: g.frontThickness * H,
        archPx: g.h2 * H, atPx: g.archThickness * H, tailPx: g.h3 * H,
        innerPx: g.v2 * W, outerPx: g.v4 * W, archVPx: g.v6 * W,
        mirrorOk: Math.abs(g.v7 - (2 * g.v1 - g.v6)) < 1e-9,
        pivotUntouched: Math.abs(g.innerAngle - window.PB.DEFAULT_GUIDE.innerAngle) < 1e-9,
        vBase: g.baseStructureVisible };
    }, [useLandmarks ? LMK : null, tr || null, sh || SHAPE_A]);
    await ctx.close();
    return out;
  };
  /* 허용 오차도 **확대율을 따라간다** — 사진을 키우면 같은 오차가 픽셀로는 커집니다 */
  const judge = (o, z = 1) => o.ok
    && near(o.frontPx, o.exp.front, 5 * z) && near(o.ftPx, o.exp.ft, 5 * z)
    && near(o.archPx, o.exp.arch, 5 * z) && near(o.atPx, o.exp.at, 5 * z)
    && near(o.tailPx, o.exp.tail, 5 * z)
    && near(o.innerPx, o.exp.inner, 9 * z) && near(o.outerPx, o.exp.outer, 9 * z)
    && near(o.archVPx, o.exp.archV, 12 * z) && o.mirrorOk
    && o.pivotUntouched && o.vBase === false;
  const say = (o) => `앞머리 ${o.frontPx.toFixed(0)}(${o.exp.front.toFixed(0)}) / 앞두께 ${o.ftPx.toFixed(0)}(${o.exp.ft.toFixed(0)}) / `
    + `아치 ${o.archPx.toFixed(0)}(${o.exp.arch.toFixed(0)}) / 아치두께 ${o.atPx.toFixed(0)}(${o.exp.at.toFixed(0)}) / 꼬리 ${o.tailPx.toFixed(0)}(${o.exp.tail.toFixed(0)}) / `
    + `이너 ${o.innerPx.toFixed(0)}(${o.exp.inner.toFixed(0)}) · 아치선 ${o.archVPx.toFixed(0)}(${o.exp.archV.toFixed(0)}) `
    + `· 아우터 ${o.outerPx.toFixed(0)}(${o.exp.outer.toFixed(0)}) · V피봇 그대로=${o.pivotUntouched}`;

  const o87 = await runDraw(true, fd, null, SHAPE_A);
  check("87. 드로잉 자동 맞춤 — 눈썹 모양(앞머리·앞두께·아치·아치두께·꼬리)을 사진에서 읽는다", judge(o87), say(o87));
  const o88 = await runDraw(false, fd, null, SHAPE_A);
  check("88. 드로잉 자동 맞춤 — 얼굴 인식이 실패해도 그린 선을 찾는다 (예비 경로)", judge(o88), say(o88));
  const o89 = await runDraw(true, fo, null, SHAPE_A);
  check("89. 드로잉 자동 맞춤 — **테두리만 그린 드로잉**도 두께를 제대로 잡는다", judge(o89), say(o89));
  /* 90. 얼굴(사진)이 커지고 위치가 달라져도 같은 자리에 붙어야 한다.
     ⚠️ 이 검사가 「고객 얼굴이 바뀌어도 자동으로 맞아야 한다」(원장님, 2026-08-20)를 지킵니다.
     ⚠️ 확대율을 더 올리지 마세요 — 눈썹 꼬리가 캔버스 밖으로 나가면 앱이 볼 수 없어
     아우터가 화면 끝에 붙습니다(그게 맞는 동작입니다). 실제 앱은 `fitBrowsInFrame()` 이 막아 줍니다. */
  const o90 = await runDraw(true, fd, { zoom: 1.35, rot: 0, ox: 0.03, oy: -0.02 }, SHAPE_A);
  check("90. 드로잉 자동 맞춤 — 사진을 확대·이동해도 같은 드로잉 위에 붙는다", judge(o90, 1.35), say(o90));
  /* 91. 드로잉 모양이 바뀌면 선도 따라가야 한다 — 아치가 안쪽으로 옮겨간 눈썹.
     ⚠️ 「드로잉이 바뀌어도 각 드로잉 위에 알맞은 선이 자동 위치해야 한다」(원장님, 2026-08-20) */
  const o91 = await runDraw(true, fb, null, SHAPE_B);
  check("91. 드로잉 자동 맞춤 — 드로잉 모양이 달라지면(아치가 안쪽) 선도 그 모양을 따라간다", judge(o91), say(o91));
  /* 92. ⚠️ 원장님 스크린샷(2026-08-20)에서 실제로 난 문제.
     눈썹 아래 **쌍꺼풀 선**이 눈썹에 딸려 붙어 앞두께가 피부까지 내려갔습니다.
     이제 "잉크가 비슷한 두 줄"만 테두리로 보므로, 옅은 주름은 붙지 않습니다.
     이 검사를 지우면 그 버그가 조용히 돌아옵니다. */
  const o92 = await runDraw(true, fc, null, SHAPE_A);
  check("92. 드로잉 자동 맞춤 — 눈썹 아래 쌍꺼풀 선에 앞두께가 끌려가지 않는다", judge(o92), say(o92));
  /* 94. ⚠️ **맨 눈썹(드로잉 없음)** — 원장님 스크린샷(2026-08-20)의 실제 상황.
     자연 눈썹은 대비가 약해 1차 패스가 포기하고 랜드마크 배치로 남았고, 그 배치가
     「전혀 프로페셔널하지 못한」 위치였습니다. 2차 저대비 패스가 털을 읽어야 합니다. */
  const o94 = await runDraw(true, fn, null, SHAPE_A);
  check("94. 맨 눈썹 — 드로잉이 없어도 저대비 2차 패스가 털을 읽어 배치한다", judge(o94), say(o94));
  fs.unlinkSync(fd); fs.unlinkSync(fo); fs.unlinkSync(fb); fs.unlinkSync(fc); fs.unlinkSync(fn);


  /* 97. ⚠️ 꼬리(아우터) 자동 위치 (v1.35.0) — 원장님 지적(2026-08-21):
     「꼬리는 눈썹의 끝 뾰족한 부분인데 자동 입력시 눈썹 꼬리부분 위치 선정 지정 고도화 해라」
     v1.34.0 까지 아우터를 **외안각(눈꼬리)** 에서 재서 꼬리 자가 눈썹 한가운데 떨어졌습니다.
     ① 빈 사진: 아우터 = 눈썹 꼬리 랜드마크(70/300·46/276 중 바깥쪽) — 눈꼬리(33/263)보다 바깥
     ② 꼬리 잉크가 랜드마크보다 더 바깥까지 이어진 사진: **아래로 처져도 경로를 추적해**
        그 끝까지 따라간다 (한계 +45% · v1.36.0)
     눈꼬리 기준으로 되돌리면 ①이, 픽셀 연장을 지우면 ②가 깨집니다. */
  {
    const mk = (tag, stroke) => {
      const f = path.join(ROOT, `.tail-${tag}.svg`);
      fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">`
        + `<rect width="600" height="600" fill="#e9d8c6"/>${stroke}</svg>`);
      return f;
    };
    const blank = mk("a", "");
    /* 왼쪽 꼬리 랜드마크(image x 0.300)에 **붙여서** 바깥(x 0.25)까지, **아래로 처지며**
       이어지는 잉크 — 실제 꼬리처럼. 경로 추적(v1.36.0)이 없으면 처진 구간을 놓칩니다 */
    const inked = mk("b", `<polyline points="192,252 178,264 164,280 150,298" fill="none" stroke="#2a1c14" stroke-width="14"/>`);
    /* FAKE_FACE 는 다른 블록 스코프에 있어 여기서 다시 만든다 (값은 그쪽과 동일하게 유지) */
    const FAKE97 = () => {
      const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      const set = (i, x, y) => { lm[i] = { x, y, z: 0 }; };
      [468, 469, 470, 471, 472].forEach((i) => set(i, 0.400, 0.500));
      [473, 474, 475, 476, 477].forEach((i) => set(i, 0.600, 0.500));
      set(33, 0.330, 0.500); set(133, 0.455, 0.500);
      set(362, 0.545, 0.500); set(263, 0.670, 0.500);
      set(70, 0.300, 0.420); set(300, 0.700, 0.420);
      set(46, 0.305, 0.445); set(276, 0.695, 0.445);
      set(105, 0.420, 0.400); set(334, 0.580, 0.400);
      set(52, 0.420, 0.440); set(282, 0.580, 0.440);
      set(107, 0.465, 0.430); set(336, 0.535, 0.430);
      set(55, 0.465, 0.455); set(285, 0.535, 0.455);
      return lm;
    };
    const run97 = async (file) => {
      const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
      await p.waitForTimeout(300);
      await p.setInputFiles("#fileInput", file);
      await p.waitForTimeout(1000);
      const r = await p.evaluate((lm) => {
        const S = window.PB.S, W = S.dim.W;
        S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
        const P = (i) => window.PB.imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W;
        return { v1: S.g.v1, v4: S.g.v4, eyeL: P(33), tailL: P(70) };
      }, FAKE97());
      await ctx.close();
      return r;
    };
    const a = await run97(blank), b = await run97(inked);
    fs.unlinkSync(blank); fs.unlinkSync(inked);
    const halfA = a.v1 - a.v4, halfB = b.v1 - b.v4;
    check("97. 꼬리 자동 위치 — 아우터 = 눈썹 꼬리 (눈꼬리 아님) · 잉크가 더 길면 끝까지 따라감",
      a.v4 < a.eyeL - 0.01                                  /* ① 눈꼬리보다 확실히 바깥 */
        && Math.abs(a.v4 - a.tailL) < 0.02                  /* ① 꼬리 랜드마크 근처 (빈 사진 = 연장 없음) */
        && halfB > halfA + 0.015                            /* ② 처진 잉크를 추적해 더 바깥으로 */
        && halfB <= halfA * 1.47,                           /* ② 한계(+45%) 안 */
      `빈사진 아우터 ${a.v4.toFixed(3)} (눈꼬리 ${a.eyeL.toFixed(3)} · 꼬리LM ${a.tailL.toFixed(3)}) · `
      + `잉크사진 반폭 ${halfA.toFixed(3)}→${halfB.toFixed(3)}`);
  }

  /* 98. ⚠️ 드로잉 맞춤의 기준쪽 (v1.37.0) — 원장님 지시(2026-08-21):
     「기본은 사용자가 밸런스에서 고른 기준쪽 드로잉에 맞춘다. 왼쪽을 선택한 상황에서
     드로잉이 오른쪽이 더 짙을경우 오토로 오른쪽에 맞춘다」
     왼쪽엔 옅은 눈썹, 오른쪽엔 훨씬 짙고 **더 낮은** 드로잉을 그려 두고 기준=왼쪽으로
     맞춤을 돌린다 → 선이 오른쪽(낮은 쪽) 높이로 가야 자동 전환이 작동한 것이다.
     두 눈썹의 짙기가 비슷하면 전환하지 않는다 (기준쪽 유지). */
  {
    const mk98 = (tag, extra) => {
      const f = path.join(ROOT, `.side-${tag}.svg`);
      fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">`
        + `<rect width="600" height="600" fill="#e9d8c6"/>${extra}</svg>`);
      return f;
    };
    /* 화면 왼쪽(기준) x 120~230 : 옅은 색 · y 250 근처
       화면 오른쪽 x 370~480 : 진한 색 · y 280 근처 (뚜렷이 낮음) */
    const f98 = mk98("a",
      `<rect x="120" y="244" width="110" height="14" fill="#d8c3ae"/>`
      + `<rect x="370" y="274" width="110" height="16" fill="#241a12"/>`);
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", f98);
    await p.waitForTimeout(1000);
    const r98 = await p.evaluate(() => {
      const S = window.PB.S, H = S.dim.H;
      S.landmarks = null; S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 };
      S.g = { ...window.PB.DEFAULT_GUIDE }; S.refSide = "L";
      window.PB.render();
      const ok = window.PB.autoFromDrawing();
      const cv = (iy) => window.PB.imgToCanvas(300, iy, S.p).y;   // 이미지 y → 캔버스 y
      return { ok, frontPx: S.g.front * H, refY: cv(244), oppY: cv(274) };
    });
    await ctx.close();
    fs.unlinkSync(f98);
    check("98. 드로잉 맞춤 기준쪽 — 반대쪽이 확실히 짙으면 자동으로 그쪽에 맞춘다",
      r98.ok === true && Math.abs(r98.frontPx - r98.oppY) < Math.abs(r98.frontPx - r98.refY),
      `앞머리 ${r98.frontPx.toFixed(0)} — 기준쪽 ${r98.refY.toFixed(0)} / 짙은 반대쪽 ${r98.oppY.toFixed(0)}`);
  }

  /* 99. ⚠️ 초기화 × 사진잠금 (v1.37.0) — 원장님 지시(2026-08-21):
     「초기화 버튼은 사진이 잠금이 되어있을경우 잠금이된 사진을 제외하고 나머지를
     초기화해라. 사진 잠금 없을경우 사진도 함께 초기화 한다」 */
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const r99 = await p.evaluate(() => {
      const S = window.PB.S;
      S.landmarks = null;
      /* 잠금 상태에서 초기화 → 사진 유지 · 선은 기본값 */
      S.p = { zoom: 3.3, rot: 7, ox: 0.11, oy: -0.07 };
      S.g = { ...window.PB.DEFAULT_GUIDE, h2: 0.11 };
      S.locked = true;
      document.getElementById("btnReset").click();
      const locked = { p: { ...S.p }, h2: S.g.h2, still: S.locked };
      /* 잠금 해제 상태에서 초기화 → 사진도 초기화 */
      S.locked = false;
      S.p = { zoom: 3.3, rot: 7, ox: 0.11, oy: -0.07 };
      document.getElementById("btnReset").click();
      return { locked, after: { ...S.p } };
    });
    await ctx.close();
    const kept = r99.locked.p.zoom === 3.3 && r99.locked.p.rot === 7 && Math.abs(r99.locked.p.ox - 0.11) < 1e-9;
    const wiped = r99.after.zoom === 1 && r99.after.rot === 0 && r99.after.ox === 0;
    check("99. 초기화 — 사진잠금 중엔 사진 유지(잠금도 유지) · 잠금 없으면 사진까지 초기화",
      kept && r99.locked.still === true && Math.abs(r99.locked.h2 - 0.11) > 1e-9 && wiped,
      `잠금: zoom ${r99.locked.p.zoom} rot ${r99.locked.p.rot} 유지=${kept} 선초기화=${Math.abs(r99.locked.h2 - 0.11) > 1e-9} · 해제 후: zoom ${r99.after.zoom} rot ${r99.after.rot}`);
  }

  /* 96. ⚠️ 시작 배치 규칙 (v1.34.0) — 원장님 판정(2026-08-21):
     「초기화 눌렀을때 올라온 선들이 맞다. 이것을 내가 사진을 입력하는 순간부터 적용하고싶다」
     사진을 넣으면 **초기화와 동일한 랜드마크 배치**로 시작한다. 드로잉 판독(autoFromDrawing)은
     `드로잉 맞춤` 버튼에서만 돈다. runFaceAI 안에 자동 호출을 되살리면 이 검사가 깨집니다 —
     실제 고객 사진에서 판독이 어긋나면 선이 엉뚱하게 벌어진 채 시작됐습니다 (v1.30.0~v1.33.0 의 실패). */
  {
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const m = src.match(/async function runFaceAI\(\)[\s\S]*?\n}/);
    /* 주석은 걷어내고 실제 코드만 본다 — 함수 안 주석이 이 규칙 자체를 설명하고 있어서 */
    const code = m && m[0].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const auto = m && /autoFromDrawing\s*\(/.test(code);
    const snapSrc = src.match(/\$\("btnSnap"\)\.onclick[\s\S]*?};/);
    const manual = snapSrc && /autoFromDrawing\s*\(/.test(snapSrc[0]);
    check("96. 시작 배치 = 랜드마크(초기화와 동일) · 드로잉 판독은 버튼에서만",
      !!m && auto === false && manual === true,
      `runFaceAI에 자동호출 ${auto ? "있음(잘못)" : "없음"} · 드로잉맞춤 버튼 호출 ${manual ? "있음" : "없음(잘못)"}`);
  }

  /* 95. 세로선 길이·굵기 (v1.33.0) — 원장님 지시:
     「세로 라인은 이너라인 빼고 더 얇게 짧게 · 아래 눈 위치까지 내려오지 않아도 된다」
     · 아치선·아우터의 진한 구간은 눈 기준선(h1)에 **닿지 않는다**
     · 이너는 길게 남는다 (내안각과 맞춰 보는 기준선)
     · 아치선·아우터는 이너보다 얇다 */
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const vl = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, H = S.dim.H;
      S.landmarks = null; S.g = { ...PBx.DEFAULT_GUIDE }; S.sel = null; S.selSet = []; PBx.render();
      const g = S.g, eyeY = g.h1 * H;
      const lows = { front: g.front, frontThickness: g.frontThickness, h2: g.h2, archThickness: g.archThickness, h3: g.h3 };
      const browBot = Math.max(...Object.values(lows)) * H;
      /* 진한 세로 구간만 (연결선 opacity 0.16 제외) */
      const seg = (key) => {
        const x = g[key] * S.dim.W;
        const ls = [...document.getElementById("guides").querySelectorAll("line")]
          .filter((l) => Math.abs(+l.getAttribute("x1") - x) < 0.6 && Math.abs(+l.getAttribute("x1") - +l.getAttribute("x2")) < 0.5
                      && +(l.getAttribute("stroke-opacity") || 1) > 0.2);
        if (!ls.length) return null;
        const l = ls[0];
        return { y0: Math.min(+l.getAttribute("y1"), +l.getAttribute("y2")),
                 y1: Math.max(+l.getAttribute("y1"), +l.getAttribute("y2")),
                 w: +l.getAttribute("stroke-width") };
      };
      const arch = seg("v6"), outer = seg("v4"), inner = seg("v2");
      return { arch, outer, inner, eyeY, browBot };
    });
    await ctx.close();
    const clear = (s) => s && s.y1 < vl.eyeY - 4 && s.y1 < vl.browBot + 0.05 * 390 + 14;
    check("95. 세로선 — 아치선·아우터는 짧고 얇게 (눈까지 안 내려옴) · 이너는 길게",
      clear(vl.arch) && clear(vl.outer)
        && vl.inner && vl.inner.y1 > vl.eyeY - 30
        && vl.arch.w < vl.inner.w && vl.outer.w < vl.inner.w,
      `아치선끝 ${vl.arch && vl.arch.y1.toFixed(0)} · 아우터끝 ${vl.outer && vl.outer.y1.toFixed(0)} `
      + `< 눈 ${vl.eyeY.toFixed(0)} · 이너끝 ${vl.inner && vl.inner.y1.toFixed(0)} · `
      + `굵기 아치선 ${vl.arch && vl.arch.w}/아우터 ${vl.outer && vl.outer.w}/이너 ${vl.inner && vl.inner.w}`);
  }

  /* 93. ⚠️ 세로선 ↔ 가로 자 묶음 (v1.32.0) — 원장님이 직접 찾아내신 문제입니다.
     「아우터라인과 아치 아치두께 라인이 함께 움직여」 → 아치는 **자기 세로선**을 따라가야 합니다.
       앞머리·앞두께 → 이너 · 아치·아치두께 → 아치선 · 꼬리 → 아우터
     자 위치를 다시 frac 상수로 박으면 이 검사가 깨집니다. */
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const grp = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      const spec = (k) => PBx.H_SPECS.find((x) => x.key === k);
      const vspec = (k) => PBx.V_SPECS.find((x) => x.key === k);
      const mid = (k) => { const s = PBx.segPx(spec(k))[0]; return (s[0] + s[1]) / 2; };
      const snap = () => ({ front: mid("front"), ft: mid("frontThickness"), arch: mid("h2"), at: mid("archThickness"), tail: mid("h3") });
      S.landmarks = null; S.g = { ...PBx.DEFAULT_GUIDE }; PBx.render();
      const a = snap();
      S.g.v4 -= 0.05; S.g.v5 = 2 * S.g.v1 - S.g.v4; PBx.render();     // 아우터만 옮긴다
      const b = snap();
      S.g = { ...PBx.DEFAULT_GUIDE }; S.g.v6 -= 0.05; S.g.v7 = 2 * S.g.v1 - S.g.v6; PBx.render();
      const c = snap();                                               // 아치선만 옮긴다
      S.g = { ...PBx.DEFAULT_GUIDE }; S.g.v2 -= 0.05; S.g.v3 = 2 * S.g.v1 - S.g.v2; PBx.render();
      const d = snap();                                               // 이너만 옮긴다
      const moved = (x, y, k) => Math.abs(x[k] - y[k]) > 3;
      return {
        outerMovesTail: moved(a, b, "tail"),
        outerLeavesArch: !moved(a, b, "arch") && !moved(a, b, "at"),
        archVMovesArch: moved(a, c, "arch") && moved(a, c, "at"),
        archVLeavesTail: !moved(a, c, "tail") && !moved(a, c, "front"),
        innerMovesFront: moved(a, d, "front") && moved(a, d, "ft"),
        outerPurple: vspec("v4").color === "#A855F7" && spec("h3").color === "#A855F7",
        archBlue: vspec("v6").color === "#2E8BFF" && spec("h2").color === "#2E8BFF",
        archThinner: vspec("v6").w < vspec("v4").w,
      };
    });
    await ctx.close();
    check("93. 세로선 묶음 — 아치 자는 **아치선**을 따라간다 (아우터를 따라가지 않는다)",
      grp.outerMovesTail && grp.outerLeavesArch && grp.archVMovesArch && grp.archVLeavesTail
        && grp.innerMovesFront && grp.outerPurple && grp.archBlue && grp.archThinner,
      `아우터→꼬리=${grp.outerMovesTail}/아치안움직임=${grp.outerLeavesArch} · `
      + `아치선→아치=${grp.archVMovesArch}/꼬리안움직임=${grp.archVLeavesTail} · 이너→앞머리=${grp.innerMovesFront} · `
      + `아우터보라=${grp.outerPurple} 아치파랑=${grp.archBlue} 아치선더얇음=${grp.archThinner}`);
  }

  for (const f of [f1, f0, fN, f6]) fs.unlinkSync(f);
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
