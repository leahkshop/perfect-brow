/* ═══════════════════════════════════════════════════════════════════════
   측정-검증.mjs — 이너 · 앞머리 · 앞두께 **판독 성적표**

   원장님 확정 정답(케이스-정답.json)과 앱의 실제 판독을 눈금으로 견줍니다.
   룰을 고칠 때마다 이걸 돌려서 **성적이 떨어지지 않았는지** 확인하세요.
   (회귀 테스트가 「깨지지 않았나」를 본다면, 이 도구는 「더 정확해졌나」를 봅니다.)

   ⛔ 고객 얼굴 사진은 이 저장소에 **절대** 넣지 마세요 — 저장소가 Public 입니다.
      사진은 각자 컴퓨터에 두고 폴더만 알려 줍니다.

   쓰는 법:
     PB_CASES=<사진 폴더> PB_CHROME=<크롬 실행파일> node 측정-검증.mjs
   예:
     PB_CASES=~/cases PB_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
       node 측정-검증.mjs

   사진 파일 이름은 케이스-정답.json 의 file 값과 같아야 합니다.
   사진이 없는 케이스는 건너뛰고, 있는 것만 채점합니다.
   ═══════════════════════════════════════════════════════════════════════ */
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "케이스-정답.json"), "utf8"));
const CASE_DIR = (process.env.PB_CASES || "").replace(/^~/, process.env.HOME || "~");
if (!CASE_DIR) { console.error("PB_CASES 에 사진 폴더를 지정하세요."); process.exit(2); }

const PORT = 8975;
const server = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (f.endsWith("/")) f += "index.html";
  try { res.end(fs.readFileSync(f)); } catch { res.statusCode = 404; res.end(); }
}).listen(PORT);

const browser = await chromium.launch({ executablePath: process.env.PB_CHROME || undefined });
const rows = [];

for (const C of DATA.cases) {
  const file = path.join(CASE_DIR, C.file);
  if (!fs.existsSync(file)) { rows.push({ ...C, skip: true }); continue; }
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);
  await p.setInputFiles("#fileInput", file);
  await p.waitForTimeout(4000);
  const r = await p.evaluate((C) => {
    const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H;
    /* 사진을 케이스의 내안각 좌표에 맞춰 앉힌다 (자동 정렬과 같은 자리) */
    const sz = (0.663 - 0.400) * W / (C.inR - C.inL);
    S.p.rot = 0; S.p.zoom = sz / S.s0;
    S.p.ox = (0.400 * W - W / 2 - (C.inL - S.iw / 2) * sz) / W;
    S.p.oy = (0.56 * H - H / 2 - (C.eyeY - S.ih / 2) * sz) / H;
    const v1 = 0.5315, halfIn = 0.1315;
    S.g.v1 = v1; S.g.v2 = v1 - halfIn; S.g.v3 = v1 + halfIn; S.g.h1 = 0.56;
    S.g.v4 = v1 - 0.30; S.g.v5 = v1 + 0.30; S.innerAnchor = halfIn;
    S.refSide = "L"; S.landmarks = null; PBx.render();
    const ok = PBx.autoFromDrawing();
    /* 캔버스 y → 사진 원본 y (rot = 0 이므로 단순 역변환) */
    const toImg = (cy) => { const z = S.p.zoom * S.s0; return (cy - H / 2 - S.p.oy * H) / z + S.ih / 2; };
    const ir = S.innerRead;
    return {
      ok,
      innerF: ir ? +ir.f.toFixed(3) : null,
      innerWhy: ir ? ir.why : null,
      frontImgY: toImg(S.g.front * H),
      ftImgY: toImg(S.g.frontThickness * H),
    };
  }, C);
  await ctx.close();
  /* 사진 원본 좌표를 **실측한 0 자리·1눈금**으로 눈금 환산 */
  const front = (C.zeroY - r.frontImgY) / C.unitPx;
  const thick = (r.frontImgY - r.ftImgY) / C.unitPx;
  rows.push({ ...C, ...r, innerAns: C.innerF, appInnerF: r.innerF, appFront: +front.toFixed(2), appThick: +thick.toFixed(2) });
}

await browser.close();
server.close();

/* ── 성적표 ─────────────────────────────────────── */
const f = (v) => (v === null || v === undefined ? "  -  " : String(v).padStart(5));
const errs = { inner: [], front: [], thick: [] };
console.log("\n케이스  종류                판독   이너f(정답)      앞머리(정답)      앞두께(정답)");
console.log("─".repeat(86));
for (const r of rows) {
  if (r.skip) { console.log(` ${String(r.id).padStart(2)}    ${r.kind.padEnd(18)} 사진 없음 — 건너뜀`); continue; }
  if (r.appInnerF !== null && r.innerAns !== null) errs.inner.push(Math.abs(r.appInnerF - r.innerAns));
  if (r.front !== null) errs.front.push(Math.abs(r.appFront - r.front));
  if (r.thickness !== null) errs.thick.push(Math.abs(r.appThick - r.thickness));
  console.log(
    ` ${String(r.id).padStart(2)}    ${r.kind.padEnd(18)} ${r.innerWhy === "read" ? "판독 " : "대체 "}` +
    ` ${f(r.appInnerF)}(${f(r.innerAns)})   ${f(r.appFront)}(${f(r.front)})   ${f(r.appThick)}(${f(r.thickness)})`
  );
}
const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : "-");
console.log("─".repeat(86));
console.log(`  이너 평균 오차 ${avg(errs.inner)} (얼굴비율 f · 1눈금 ≈ 0.076)  ·  앞머리 ${avg(errs.front)} 눈금 (n=${errs.front.length})  ·  앞두께 ${avg(errs.thick)} 눈금 (n=${errs.thick.length})`);
console.log(`  기준선 (v2.4.1 실측 · 사진 8장): 이너 0.10 · 앞머리 1.41 눈금 · 앞두께 0.92 눈금`);
console.log(`  ※ 앞머리 1.41 은 4번(옅은 반영구) 판독 실패분 3.78 이 끌어올린 값입니다 —`);
console.log(`     읽힌 2건은 0.07 · 0.39. 이보다 나빠지면 룰을 되돌리세요.\n`);
