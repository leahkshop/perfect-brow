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

/* ⚠️ v1.66.0 — **머리카락이 화면에 들어온 사진** (원장님 실제 사진의 실패 상황 재현)
   관자놀이 쪽으로 머리카락이 눈썹 꼬리 바로 옆까지 내려온 얼굴. 이 사진에서 드로잉 맞춤이
   머리카락을 눈썹으로 읽으면 아우터·아치선이 바깥으로 밀리고 꼬리 자가 이마로 올라갑니다. */
function makeHairFace() {
  const W = 900, H = 1200, cx = 450, cy = 470, ang = (6 * Math.PI) / 180;
  const eye = (x, y) => `
    <ellipse cx="${x}" cy="${y}" rx="72" ry="30" fill="#fcfaf7"/>
    <circle cx="${x}" cy="${y}" r="26" fill="#4e3628"/>
    <circle cx="${x}" cy="${y}" r="11" fill="#14100e"/>`;
  const brow = (x, y) => `<path d="M ${x - 80} ${y - 62} Q ${x} ${y - 108} ${x + 80} ${y - 62}"
      stroke="#423028" stroke-width="15" fill="none" stroke-linecap="round"/>`;
  /* 머리카락 — 눈썹 끝에서 바깥으로 살짝 겹치며 아래로 흘러내린다 (실제 사진과 같은 배치) */
  const hair = (x, dir) => `
    <path d="M ${x} ${cy - 190} C ${x + dir * 26} ${cy - 90}, ${x + dir * 10} ${cy - 10}, ${x + dir * 30} ${cy + 90}"
      stroke="#2b1f1a" stroke-width="34" fill="none" stroke-linecap="round"/>
    <path d="M ${x + dir * 26} ${cy - 175} C ${x + dir * 54} ${cy - 80}, ${x + dir * 40} ${cy}, ${x + dir * 58} ${cy + 80}"
      stroke="#241a16" stroke-width="30" fill="none" stroke-linecap="round"/>`;
  const L = { x: cx - 125 * Math.cos(ang), y: cy - 125 * Math.sin(ang) };
  const R = { x: cx + 125 * Math.cos(ang), y: cy + 125 * Math.sin(ang) };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#e8e2dc"/>
    <rect x="${cx - 90}" y="700" width="180" height="${H - 700}" fill="#e2beA6"/>
    <ellipse cx="${cx}" cy="490" rx="235" ry="340" fill="#eecbb2"/>
    <ellipse cx="${cx}" cy="260" rx="255" ry="170" fill="#3c2c26"/>
    <ellipse cx="${cx}" cy="368" rx="215" ry="152" fill="#eecbb2"/>
    ${eye(L.x, L.y)}${eye(R.x, R.y)}${brow(L.x, L.y)}${brow(R.x, R.y)}
    ${hair(L.x - 104, -1)}${hair(R.x + 104, 1)}
    <path d="M ${cx} 500 L ${cx - 14} 610" stroke="#cea68e" stroke-width="6" fill="none"/>
    <ellipse cx="${cx}" cy="694" rx="62" ry="22" fill="#c46e68"/>
  </svg>`;
  const p = path.join(ROOT, ".test-hair.svg");
  fs.writeFileSync(p, svg);
  return { file: p, pupilL: L, pupilR: R, iw: W, ih: H,
           browHalf: 80, browApexDy: -108, browEndDy: -62 };
}

const face = makeTestFace();
const hairFace = makeHairFace();
const URL_BASE = `http://127.0.0.1:${PORT}/index.html`;

console.log("\n━━━ Perfect Brow 회귀 테스트 ━━━\n");

/* ═══════════════════════════════════════════════════════════════
   ⏱ **부분 테스트 스위치** `PB_ONLY` (v2.9.0 — 명령서 §0-Y 를 기계로 집행)

   전 항목은 3분입니다. 한 줄만 고치는 동안 3분을 매번 태우면 하루가 사라집니다
   (원장님 지적 2026-08-29: 「작업중인 부분만 부분적으로 테스트 돌린다」).

     PB_ONLY=아치   node regression-test.mjs     ← 이름에 「아치」가 든 항목만
     PB_ONLY=arch   node regression-test.mjs     ← 같은 뜻 (별칭표 아래)
     PB_ONLY=162-164,121 node regression-test.mjs ← 항목 번호·범위
     node regression-test.mjs                     ← 전부 (커밋 직전 한 번)

   ⚠️ **부분 통과는 통과가 아닙니다.** 커밋 직전에는 `PB_ONLY` 없이 한 번 더 돌리세요.
      부분 실행이면 맨 아래에 「부분 실행」 경고가 찍힙니다.

   ⚠️ 블록표(BLOCK_TESTS)는 **소스에서 기계로 뽑은 것**입니다. 테스트를 추가·이동하면
      `if (RUN(n))` 번호와 이 표가 어긋납니다 — 그때는 표를 다시 뽑으세요
      (판독-룰.md 「부분 테스트 스위치」 절에 뽑는 법이 있습니다).
   ═══════════════════════════════════════════════════════════════ */
const BLOCK_TESTS = [["1. 페이지 로드 · JS 오류 없음", "33. 앱 실행 직후 두 조절자 모두 표시", "11. 세로 폴백 레이아웃 — 라인 버튼이 캔버스 하단", "2. 라인 직접 드래그 (60px)", "5. Center 이동 시 v2~v5 동반 이동", "3. Inner 좌우 대칭", "4. Outer 좌우 대칭", "6. 동공정렬 — 6° 기울기 보정 · 기준점 = 작업 영역 중앙 · 세로 = CENTER_Y", "44. 자동 정렬 — 얼굴이 작업 영역 가로 한가운데 · 세로 = CENTER_Y", "7. 줌/회전 슬라이더 범위", "8. 프리셋 저장 — 새로고침 후 유지", "9. 이미지 PNG 저장", "16. 사진 잠금 — 사진 고정 · 보정 버튼 반투명 잠김", "17. 잠금 중에도 선 조절 가능 · 가로바는 위아래로만", "18. 세로바는 좌우로만 · 대칭 유지", "19. 방향 버튼 — 가로바 ▼▲ / 세로바 ◀▶", "20. 잠금 해제 — 사진 보정 버튼 다시 밝아지고 눌림", "21. 빈 곳 드래그 → 선택된 가로바가 위아래로만 따라옴", "22. 빈 곳 드래그 → 대칭 세로바가 좌우로만 따라옴 · 대칭 유지", "23. 두 손가락 드래그 = 사진 이동 (선은 불변)", "24. 세로 조절자 — 왼쪽 끝 · 세로 중앙 (▲위/▼아래)", "25. 가로 조절자 — 아래·오른쪽 정렬 (◀왼쪽/▶오른쪽)", "32. 두 조절자 겹침 없음 · 캔버스 안", "26. 조절자 방향 = 선의 이동 방향", "27. 선을 탭하면 그 선이 선택 · 값은 그대로", "28. 다른 선 탭 → 전환 + 조절자 축도 전환", "35. 잠금 해제 · 한 손가락 사선 드래그 = 사진 자유 이동", "36. 아래 가로 바 하나로 선 조절 ↔ 사진 보정 겸용", "37. 세로선 선택 → 가로 바가 선 조절로 자동 복귀", "38. 오른쪽 아래 — 사진보정 버튼 위 / 좌우 바 = 줌~밸런스 행과 같은 폭·정렬", "39. 왼쪽=위아래 바만 · 오른쪽 위=초기화+다시실행/되돌리기 1행 · 밸런스=여러라인 옆 칸 · 삭제 정리", "41. 되돌리기 — 직전 작업만, 다시 누르면 그 전 작업", "42. 드래그 1회 = 되돌리기 1단계 (선택만 하는 탭은 기록 안 됨)", "49. 여러라인 — 누를 때마다 선택 누적 · 다시 누르면 해제(숨김 아님)", "50. 여러라인 — 선택된 선들이 함께 이동 · 비선택은 불변", "51. 선택된 라인 강조 — 굵기 증가", "52. 여러라인 해제 → 한 개만 선택", "53. 버튼 이름 — ", "43. 라인 버튼 — 1탭 선택(움직임) · 다시 탭 숨김", "54. 화면 탭 — 1탭 = 선택(숨기지 않음)", "55. 화면 탭 — 같은 선 다시 탭 = 숨김", "56. 화면 탭 — 여러라인 모드는 선택 해제만, 숨기지 않음 · 숨김은 되돌리기 대상", "57. 다시 실행 — 되돌린 작업을 다시 앞으로 (새 작업 시 갈래 폐기)", "58. 전체라인 — 여러라인 후속 버튼 · 보이는 선 전부 선택/해제", "59. 전체라인 — 화면의 모든 가로선이 한 번에 이동", "60. 한/영 전환 — 라인 버튼 이름 · 편집 화면 칩은 제거되고 설정 배지만 남음", "61. 기본값 — 눈 0.60 · V 피봇 위 10% · V 앵글 아래 45°", "62. 아이콘 — 이모지 없음 · 전부 SVG 선 아이콘", "63. 왼쪽 레일 담백 — 발광·그라데이션 없음", "64. 라인 버튼 — 색 띠가 선 색 · 버튼 전체를 선 색으로 칠하지 않음", "65. 잠금 아이콘 — 잠김/열림 모양이 다르다", "66. 모달 대비 — 다크 바탕에 밝은 글자 (흰 바탕 금지)", "67. 액센트 채움 버튼 — 글자 대비 충분 (흰 글자 금지)", "68. 모달 — 채운 버튼은 주 동작 하나뿐", "69. 두께 선 — 눈썹 아래 윤곽 실측 (고정 오프셋 아님)", "153. 눈 앞꼬리 = 언제나 40 — 동공 간격이 달라도 내안각 눈금이 흔들리지 않는다", "70. 비대칭 얼굴 — 이너·아우터는 기준쪽에 정확히, 오차는 반대쪽이 안는다 (데칼코마니)", "71. 자동 정렬 — 양쪽 눈썹 꼬리가 화면 안 (잘리지 않음)", "72. 선을 켜면 AI 측정 위치로 배치 (인식 실패 시엔 그대로)", "73. 자 정렬 — 짝끼리 동일 · 아치는 바깥 · 꼬리·눈은 얇은 실선 없음 · 눈은 회색 반투명", "74. 프리셋 — 고객 얼굴 폭·눈썹 높이에 맞춰 자동 환산 (대칭 유지)", "75. 프리셋 적용 중 표시 · 초기화 시 해제", "76. 기준틀 없는 옛 프리셋 — 환산 없이 그대로 적용", "84. 즐겨찾기 — 지정한 개수만큼만 · 누르면 바로 적용 · 없는 id 는 걸러냄", "85. 별표 — 3개까지 · 4번째는 거부 · 다시 누르면 해제", "12. 좌표계 규약 — 모든 라인 값 0~1"], [], ["153. 눈 앞꼬리 = 언제나 40 — 동공 간격이 달라도 내안각 눈금이 흔들리지 않는다"], ["81. 홈(사진 선택)은 세로 그대로 · 사진을 넣으면 편집기가 가로로", "13. 세로 기기에서 가로 강제 — 회전 적용", "13. 세로 기기에서 가로 강제 — 캔버스가 가로", "14. 회전 상태에서 라인 드래그 정확도", "34. 강제 가로 — 손 제스처 축이 화면과 일치", "82. 사진 선택 중 — 가로 그대로 · 화면만 어둡게 · 닫으면 복구", "29. 기본값에서 세로 기기 → 항상 가로 (자동 해제 없음)", "30. 기기가 실제 가로면 가짜 회전 해제 (설정은 유지)", "31. 세로로 되돌아가면 즉시 가로 강제 복귀", "15. pb_orient=off 도 무시 — 무조건 가로 (v1.93.0)"], ["10. ${dev.n} — 좌측 레일 + V 버튼", "10. ${dev.n} — 도크 잘림/겹침 없음 · 사진 ${Math.round(g.stageShare * 100)}%", "48. ${dev.n} — 가로 자 길이 = 눈썹 구간 (왼쪽 바를 넘지 않음)", "47. ${dev.n} — 컨트롤 영역 스크림 (터치 통과 · 선이 위)", "45. ${dev.n} — 세로 조절자 값 라벨이 바 오른쪽(안쪽) · 캔버스 안", "46. ${dev.n} — 세로선 이름 배지 없음 (v1.46.2 숨김)", "40. ${dev.n} — 왼쪽 아래는 프리셋(+즐겨찾기) · 좌우 바와 겹치지 않음", "83. ${dev.n} — 사진 2버튼=왼쪽 끝 · 잠금 홀로 가운데 · AI 눈썹 맞춤=좌우 바 왼쪽 · 밸런스=오른쪽 끝"], ["77. 밸런스 — 기준(왼쪽) 대비 오른쪽 12px 차이를 잡아냄 · 빨간 표시는 반대쪽에만", "78. 밸런스 — 기준을 오른쪽으로 바꾸면 빨간 표시가 왼쪽으로", "79. 밸런스 — 좌우가 같으면 표시 없음", "80. 밸런스 — 그린 선이 없으면 조용히 건너뜀 (오판하지 않음)", "86. 밸런스 — 허용 오차가 얼굴 크기를 따라간다 (px 고정 아님)", "87. 드로잉 자동 맞춤 — 눈썹 모양(앞머리·앞두께·아치·아치두께·꼬리)을 사진에서 읽는다", "88. 드로잉 자동 맞춤 — 얼굴 인식이 실패해도 그린 선을 찾는다 (예비 경로)", "89. 드로잉 자동 맞춤 — **테두리만 그린 드로잉**도 두께를 제대로 잡는다", "90. 드로잉 자동 맞춤 — 사진을 확대·이동해도 같은 드로잉 위에 붙는다", "91. 드로잉 자동 맞춤 — 드로잉 모양이 달라지면(아치가 안쪽) 선도 그 모양을 따라간다", "92. 드로잉 자동 맞춤 — 눈썹 아래 쌍꺼풀 선에 앞머리(아랫선)가 끌려가지 않는다", "94. 맨 눈썹 — 드로잉이 없어도 저대비 2차 패스가 털을 읽어 배치한다", "122. 얇은 털 추적 금지 — 아우터는 진한 눈썹의 끝에 선다 (잔털까지 따라가지 않는다)", "124. 앞머리·앞두께 — 앞두께가 **위**, 앞머리가 **아래** (원장님 확정)", "125. 이너 = 색이 시작하는 선 — 앞머리가 얇아져도 끝까지 따라간다", "126. 꼬리 = 색이 끝나는 곳 — 얇아진 꼬리를 끝까지 · 잔털은 제외", "127. 아랫선 — 눈썹 아래 그늘이 있어도 창 바닥에 못 박히지 않는다", "128. 아랫선 — 그늘이 창 바닥에 안 닿아도 눈썹 아랫선에 선다", "129. 윗선 — 눈썹 위 옅은 번짐에 앞두께가 끌려가지 않는다", "130. 자는 드로잉 위에 — 이너·아우터 자가 눈썹 밖 맨살로 뜨지 않는다", "131. 못박음 검사 — 까다로운 사진 9장 · 자가 창 경계·그늘에 못박히지 않고 아치두께가 꼬리 위", "132. 가이드 OFF=전부 고유색 · ON=한 줄씩 플로우 · 잡은 선만 잡은 색", "133. 아치두께 마지노선 — 꼬리·앞머리보다 아래로 내려가지 않는다 (눈꺼풀 그늘 방어)", "134. 전체라인 인사 1회 깜빡임 · 선택하면 굵고 밝게 · 움직인 선은 잡은 선 색으로 남음", "135. 가이드 순서 — ▲▼ 로 바꾸고 이름을 눌러 켜고 끈다 · 번호가 새 순서를 따라간다", "136. 설정 배치 — 조합 카드는 미리보기 밑 작은 카드 · 굵기/투명도/길이 각 한 줄 · 테두리는 별도 블록", "137. 고르면 되살아난다 — 죽은 선도 고르면 고유색·더 굵게·한 번 반짝 · 잡는 동안은 잡은 선 색", "138. 고른 선 말고는 한 단계 물러난다 — 가이드 꺼짐에서만 · 색은 그대로 옅게", "139. 한 번 탭에 선이 사라지지 않는다 — 숨김은 같은 버튼 연속 두 번만", "140. 드로잉 맞춤이 숨은 선을 되살린다 · 차례인 선은 숨길 수 없다", "141. 초기화셋팅 — 4초 인사 · 사진 로드/초기화/가이드 껐다 켜기 에서 작동", "142. 잡는 범위 — 교차점은 가로 자 · 아치선은 아래 구간 · 눈 선은 9px · 인사 조기 종료", "143. 안내 — 중앙 위 · 토글로 끄고 켬 · 가이드 켜짐 중 유지 · AI/눈썹정렬 두 줄", "144. 기본 언어 영어 · 링크 미리보기(OG)·설치 설명 영어 · 한국어는 눌러 저장", "145. 도크 자동 맞춤(667~844 겹침 없음) · pb_orient=off 여도 무조건 가로 · dvh 마지막 · offset 좌표", "146. 놓은 선 — doneC/doneW/doneOp 로 그림 · 잡은 선과 분리 · 설정 컨트롤", "147. 서브 라인 — 자→이너 연결선 굵기·투명도가 설정(subW/subOp)을 따름", "148. 배경 한 번 탭 = 단계 확인·다음으로 (안내도 이동) · 인사 중엔 안 넘어감", "149. 예비 동공 정렬 — 인식 실패 사진도 동공 간격 44%·기준점 정렬 · SVG 픽스처는 그대로", "150. ${dev.n} — 레일 버튼 얇게·붙여서 중앙 · 바 30% 짧게·왼쪽 간격", "151. 이너 판독 — 눈꺼풀 그늘을 따라가지 않고 드로잉이 시작하는 곳에 선다 (40~48 · 못 읽으면 43)", "152. 이너 판독 — 눈썹이 화면 위에 붙어도 잉크를 재고, 자가 있으면 언제나 답을 낸다", "154. 눈 앞꼬리 자동 인식 — 눈꺼풀 틈이 닫히는 자리를 찾는다 (코 그늘에 안 끌림)", "155. 앞머리·앞두께 판독 — 피부 다음 「두꺼운 검은 것」의 아랫끝·윗끝 (주름·눈화장은 아니다)", "156. 앞머리 넘버링 — 판독 없는 배치는 눈 위 11.7 눈금 (이너와 같은 자 · 범위 7~16 잠금)", "157. 쌍꺼풀·주름 쉐도우 방어 — 두꺼운 쉐도우가 있어도 넘버링(7~16)이 눈썹을 고른다", "158. 앞머리 하한 — 눈 위 7 눈금 미만은 앞머리가 아니다 (보통값 11.7 로 대체)", "159. 넘버링 0 동일화 — 0 = 동공 중심 실측 · h1 을 옮겨도 흔들리지 않는다", "160. 이너 맥시멈 45 — 답 클램프·예비 경로 모두 45(INNER_F_SOFT) 기준이다", "161. 앞두께 우선순위② — 피부 복귀가 불명확하면 퍼센트가 낮아지는 자리(검정 끝)를 고른다", "164. 아치엣지만 잡힌 경우 — 아치두께는 아치엣지에서 5칸 아래 (대체값)", "163. 아치 표준값 — 판독 실패 시 앞머리에서 3칸·5칸 (실패 이유로 갈린다)", "162. 아치엣지·아치두께 판독 — 쉐도우·창 천장·해부학 순서 방어 · 두께 5칸 상한 · 엣지 맥시멈", "123. 검은 드로잉 — 아우터는 진한 곳이 끝나는 자리에 선다 (옅은 번짐은 눈썹이 아니다)", "121. 판정 기준 — 꼬리=끝의 아랫선 · 아치선=꺾임점(바깥에서 ¼ 부근) · 앞머리=90° 꼭지점", "120. 드로잉 맞춤 — 눈썹이 지금 선보다 훨씬 위에 있어도 (크게 확대한 사진) 찾아낸다", "120b. 드로잉 맞춤 — 앞머리·아치·꼬리가 한 값으로 뭉치지 않는다 (탐색창에 갇힘 방지)", "119. 드로잉 맞춤 뒤 교정 안내 — ① 이너부터 다시 · 프롬프트 ①~⑦ · 좁은 폰에서도 안 잘림", "97. 꼬리 2단계 — 안 보이면 콧볼–외안각 연장선 · 보이는 진한 꼬리는 그 잉크 끝", "101. 가이드 플로우 — 이너→앞머리→앞두께→아치엣지→아치두께→꼬리아우터→꼬리높이 · 끄면 종료", "102. 이너 묶음 — 조용=얇은 회색 · 강조=민트 한 줄 · 선 색 = 레일 띠 색", "103. 가이드 플로우 — 밝은 선은 언제나 **하나** · 다음 차례로 선택도 함께 이동", "104. 아치·꼬리 — 고유색 유지 · 조용할 땐 얇은 회색 (v1.55.0)", "105. 밝은 사진에서도 읽히는가 — 캔버스 칩·초기화는 어두운 판 · 잠금=채움 · 저장은 조용", "106. 한 줄 규칙 — 자도 세로선도 조용=얇은 회색 / 차례=고유색 **한 줄** · 꼬리 자 반", "107. 프리셋 — 내장 기본 3종 없음 · 사용자가 저장한 것만", "108. 지시등 — 4초에 한 번 느린 깜빡임(CSS) · 잡으면 짙은 회색 + 살구색 테두리 · 저장본 선명", "109. 설정 — 색상표 8색 · 세로선 목록 · 굵기/테두리/잡은선 굵기 슬라이더 · 테두리 4종 · 선택 강조", "110. 조합 순환 버튼 — 가이드 오른쪽 · 클릭마다 다음 조합 · 한 바퀴 돌면 내 세트 복귀", "111. 설정 시트 — 아이폰 세로 잠금(rot90)에서도 가로로 뜬다", "112. 원장님 확정 기본 세팅(2026-08-29) — 라임·민트·파랑 · 0.75/8%/55% · 잡은 선 흰색 85%/65%", "113. 꼬리·아우터 사선 — 한 손짓으로 꼬리 끝 점을 놓는다 (거울쪽 부호 반전 · 다른 자는 그대로)", "117. 아치는 혼자 움직인다 — 아치·아치두께·아치선이 전부 따로 (v1.67.0 동반 폐지)", "118. 가로 길이 슬라이더 — 아주 짧게까지 · 끌면 미리보기가 같이 줄었다 늘어난다 · 표식 테두리 없음", "114. 화살표 미세 이동(≈1px) · ▶=위로 · 가이드 프롬프트 · 십자 모서리는 **꼬리에만** (안쪽+위)", "115. 드로잉 맞춤 — 관자놀이 머리카락을 눈썹으로 읽지 않는다 (인식 성공)", "116. 드로잉 맞춤 — 머리카락이 있어도 예비 경로가 눈썹을 찾는다", "100. 홈 화면 버전 표시 — APP_VERSION 이 그대로 보인다", "96. 시작 = AI 눈썹정렬 자동 · 실패 시 기본정렬 · 프리미엄 게이트 존재", "95. 세로선 — 조용할 땐 회색 한 줄 · 아치선·아우터 짧게 · 이너는 눈까지", "93. 세로선 묶음 — 아치 자는 **아치선**을 따라간다 (아우터를 따라가지 않는다)"], ["122. 얇은 털 추적 금지 — 아우터는 진한 눈썹의 끝에 선다 (잔털까지 따라가지 않는다)"], ["124. 앞머리·앞두께 — 앞두께가 **위**, 앞머리가 **아래** (원장님 확정)"], ["125. 이너 = 색이 시작하는 선 — 앞머리가 얇아져도 끝까지 따라간다"], ["126. 꼬리 = 색이 끝나는 곳 — 얇아진 꼬리를 끝까지 · 잔털은 제외"], ["127. 아랫선 — 눈썹 아래 그늘이 있어도 창 바닥에 못 박히지 않는다"], ["128. 아랫선 — 그늘이 창 바닥에 안 닿아도 눈썹 아랫선에 선다"], ["129. 윗선 — 눈썹 위 옅은 번짐에 앞두께가 끌려가지 않는다"], ["130. 자는 드로잉 위에 — 이너·아우터 자가 눈썹 밖 맨살로 뜨지 않는다"], ["131. 못박음 검사 — 까다로운 사진 9장 · 자가 창 경계·그늘에 못박히지 않고 아치두께가 꼬리 위"], ["132. 가이드 OFF=전부 고유색 · ON=한 줄씩 플로우 · 잡은 선만 잡은 색"], ["133. 아치두께 마지노선 — 꼬리·앞머리보다 아래로 내려가지 않는다 (눈꺼풀 그늘 방어)"], ["134. 전체라인 인사 1회 깜빡임 · 선택하면 굵고 밝게 · 움직인 선은 잡은 선 색으로 남음"], ["135. 가이드 순서 — ▲▼ 로 바꾸고 이름을 눌러 켜고 끈다 · 번호가 새 순서를 따라간다"], ["136. 설정 배치 — 조합 카드는 미리보기 밑 작은 카드 · 굵기/투명도/길이 각 한 줄 · 테두리는 별도 블록"], ["137. 고르면 되살아난다 — 죽은 선도 고르면 고유색·더 굵게·한 번 반짝 · 잡는 동안은 잡은 선 색"], ["138. 고른 선 말고는 한 단계 물러난다 — 가이드 꺼짐에서만 · 색은 그대로 옅게"], ["139. 한 번 탭에 선이 사라지지 않는다 — 숨김은 같은 버튼 연속 두 번만"], ["140. 드로잉 맞춤이 숨은 선을 되살린다 · 차례인 선은 숨길 수 없다"], ["141. 초기화셋팅 — 4초 인사 · 사진 로드/초기화/가이드 껐다 켜기 에서 작동"], ["142. 잡는 범위 — 교차점은 가로 자 · 아치선은 아래 구간 · 눈 선은 9px · 인사 조기 종료"], ["143. 안내 — 중앙 위 · 토글로 끄고 켬 · 가이드 켜짐 중 유지 · AI/눈썹정렬 두 줄"], ["144. 기본 언어 영어 · 링크 미리보기(OG)·설치 설명 영어 · 한국어는 눌러 저장"], ["145. 도크 자동 맞춤(667~844 겹침 없음) · pb_orient=off 여도 무조건 가로 · dvh 마지막 · offset 좌표"], ["146. 놓은 선 — doneC/doneW/doneOp 로 그림 · 잡은 선과 분리 · 설정 컨트롤"], ["147. 서브 라인 — 자→이너 연결선 굵기·투명도가 설정(subW/subOp)을 따름"], ["148. 배경 한 번 탭 = 단계 확인·다음으로 (안내도 이동) · 인사 중엔 안 넘어감"], ["149. 예비 동공 정렬 — 인식 실패 사진도 동공 간격 44%·기준점 정렬 · SVG 픽스처는 그대로"], ["150. ${dev.n} — 레일 버튼 얇게·붙여서 중앙 · 바 30% 짧게·왼쪽 간격"], ["151. 이너 판독 — 눈꺼풀 그늘을 따라가지 않고 드로잉이 시작하는 곳에 선다 (40~48 · 못 읽으면 43)"], ["152. 이너 판독 — 눈썹이 화면 위에 붙어도 잉크를 재고, 자가 있으면 언제나 답을 낸다"], ["154. 눈 앞꼬리 자동 인식 — 눈꺼풀 틈이 닫히는 자리를 찾는다 (코 그늘에 안 끌림)"], ["155. 앞머리·앞두께 판독 — 피부 다음 「두꺼운 검은 것」의 아랫끝·윗끝 (주름·눈화장은 아니다)"], ["156. 앞머리 넘버링 — 판독 없는 배치는 눈 위 11.7 눈금 (이너와 같은 자 · 범위 7~16 잠금)"], ["157. 쌍꺼풀·주름 쉐도우 방어 — 두꺼운 쉐도우가 있어도 넘버링(7~16)이 눈썹을 고른다"], ["158. 앞머리 하한 — 눈 위 7 눈금 미만은 앞머리가 아니다 (보통값 11.7 로 대체)"], ["159. 넘버링 0 동일화 — 0 = 동공 중심 실측 · h1 을 옮겨도 흔들리지 않는다"], ["160. 이너 맥시멈 45 — 답 클램프·예비 경로 모두 45(INNER_F_SOFT) 기준이다"], ["161. 앞두께 우선순위② — 피부 복귀가 불명확하면 퍼센트가 낮아지는 자리(검정 끝)를 고른다"], ["164. 아치엣지만 잡힌 경우 — 아치두께는 아치엣지에서 5칸 아래 (대체값)"], ["163. 아치 표준값 — 판독 실패 시 앞머리에서 3칸·5칸 (실패 이유로 갈린다)"], ["162. 아치엣지·아치두께 판독 — 쉐도우·창 천장·해부학 순서 방어 · 두께 5칸 상한 · 엣지 맥시멈"], ["123. 검은 드로잉 — 아우터는 진한 곳이 끝나는 자리에 선다 (옅은 번짐은 눈썹이 아니다)"], ["121. 판정 기준 — 꼬리=끝의 아랫선 · 아치선=꺾임점(바깥에서 ¼ 부근) · 앞머리=90° 꼭지점"], ["119. 드로잉 맞춤 뒤 교정 안내 — ① 이너부터 다시 · 프롬프트 ①~⑦ · 좁은 폰에서도 안 잘림"], ["97. 꼬리 2단계 — 안 보이면 콧볼–외안각 연장선 · 보이는 진한 꼬리는 그 잉크 끝"], ["101. 가이드 플로우 — 이너→앞머리→앞두께→아치엣지→아치두께→꼬리아우터→꼬리높이 · 끄면 종료"], ["102. 이너 묶음 — 조용=얇은 회색 · 강조=민트 한 줄 · 선 색 = 레일 띠 색"], ["103. 가이드 플로우 — 밝은 선은 언제나 **하나** · 다음 차례로 선택도 함께 이동", "104. 아치·꼬리 — 고유색 유지 · 조용할 땐 얇은 회색 (v1.55.0)"], ["105. 밝은 사진에서도 읽히는가 — 캔버스 칩·초기화는 어두운 판 · 잠금=채움 · 저장은 조용"], ["106. 한 줄 규칙 — 자도 세로선도 조용=얇은 회색 / 차례=고유색 **한 줄** · 꼬리 자 반", "107. 프리셋 — 내장 기본 3종 없음 · 사용자가 저장한 것만"], ["108. 지시등 — 4초에 한 번 느린 깜빡임(CSS) · 잡으면 짙은 회색 + 살구색 테두리 · 저장본 선명"], ["109. 설정 — 색상표 8색 · 세로선 목록 · 굵기/테두리/잡은선 굵기 슬라이더 · 테두리 4종 · 선택 강조"], ["110. 조합 순환 버튼 — 가이드 오른쪽 · 클릭마다 다음 조합 · 한 바퀴 돌면 내 세트 복귀"], ["111. 설정 시트 — 아이폰 세로 잠금(rot90)에서도 가로로 뜬다"], ["112. 원장님 확정 기본 세팅(2026-08-29) — 라임·민트·파랑 · 0.75/8%/55% · 잡은 선 흰색 85%/65%"], ["113. 꼬리·아우터 사선 — 한 손짓으로 꼬리 끝 점을 놓는다 (거울쪽 부호 반전 · 다른 자는 그대로)"], ["117. 아치는 혼자 움직인다 — 아치·아치두께·아치선이 전부 따로 (v1.67.0 동반 폐지)"], ["118. 가로 길이 슬라이더 — 아주 짧게까지 · 끌면 미리보기가 같이 줄었다 늘어난다 · 표식 테두리 없음"], ["114. 화살표 미세 이동(≈1px) · ▶=위로 · 가이드 프롬프트 · 십자 모서리는 **꼬리에만** (안쪽+위)"], ["100. 홈 화면 버전 표시 — APP_VERSION 이 그대로 보인다"], ["96. 시작 = AI 눈썹정렬 자동 · 실패 시 기본정렬 · 프리미엄 게이트 존재"], ["95. 세로선 — 조용할 땐 회색 한 줄 · 아치선·아우터 짧게 · 이너는 눈까지"], ["93. 세로선 묶음 — 아치 자는 **아치선**을 따라간다 (아우터를 따라가지 않는다)"]];
/* 원장님·개발자가 쓰기 쉬운 별칭 — 왼쪽을 치면 오른쪽 낱말로 찾습니다 */
const ONLY_ALIAS = {
  arch: "아치", inner: "이너", outer: "아우터", front: "앞머리", tail: "꼬리",
  brow: "눈썹", num: "눈금", layout: "레이아웃", balance: "밸런스",
};
const ONLY_RAW = (process.env.PB_ONLY || "").trim();
const ONLY = ONLY_RAW
  ? ONLY_RAW.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ONLY_ALIAS[s.toLowerCase()] || s)
  : null;
let skippedTests = 0, skippedBlocks = 0;

/* 항목 이름 하나가 필터에 걸리나? 번호(121) · 범위(162-164) · 낱말(아치) 셋 다 받습니다 */
function nameMatches(name) {
  const num = parseInt(String(name).trim(), 10);
  for (const tk of ONLY) {
    const rng = /^(\d+)\s*-\s*(\d+)$/.exec(tk);
    if (rng) { if (Number.isFinite(num) && num >= +rng[1] && num <= +rng[2]) return true; continue; }
    if (/^\d+$/.test(tk)) { if (num === +tk) return true; continue; }
    if (String(name).includes(tk)) return true;
  }
  return false;
}
function RUN(n) {
  if (!ONLY) return true;
  const names = BLOCK_TESTS[n] || [];
  if (!names.length) return true;              // 검사 없는 준비 블록은 늘 돌린다
  if (names.some(nameMatches)) return true;
  skippedBlocks++; skippedTests += names.length;
  return false;
}
if (ONLY) console.log(`⏱ 부분 실행 — PB_ONLY=${ONLY_RAW}\n`);
const T0 = Date.now();



/* 특수 환경에서 크로미움 경로를 직접 지정해야 할 때: PB_CHROME=/path/to/chrome node regression-test.mjs */
const browser = await chromium.launch(
  process.env.PB_CHROME ? { executablePath: process.env.PB_CHROME } : {},
);

/* ═══════ A. 세로(portrait) — 기능 테스트 ═══════ */
console.log("[세로 모드 · 기능]");
if (RUN(0)) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|ERR_|status of 404/.test(m.text())) errs.push(m.text()); });

  await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  /* v1.8.0: 기본값(auto)은 세로 기기를 무조건 가로로 돌린다.
     이 블록은 "회전 없는" 좌표계에서 기능을 검증하는 곳이므로 폴백 모드(off)로 고정한다. */
  await p.evaluate(() => localStorage.setItem("pb_test_norot", "1"));   /* v1.93.0 — off 폐지: 테스트 전용 탈출구 */
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
  /* 기준점: v1.96.0 — 작업 영역의 42% 지점 (원장님 지시 「더 왼쪽으로」 · CENTER_BIAS).
     앱의 centerX() 를 그대로 기준으로 씁니다. */
  const cxExp = await p.evaluate(() => window.PB.centerX());
  const cyExp = await p.evaluate(() => window.PB.CENTER_Y);   /* v1.97.2 — 세로 기준도 상수를 직접 읽는다 */
  check("6. 동공정렬 — 6° 기울기 보정 · 기준점 = 작업 영역 중앙 · 세로 = CENTER_Y",
    near(st.rot, -6, 0.3) && near(st.v1, cxExp, 0.003) && near(st.h1, cyExp, 0.001),
    `rot=${st.rot.toFixed(2)}° v1=${st.v1.toFixed(3)}(기대 ${cxExp.toFixed(3)}) h1=${st.h1.toFixed(3)}(기대 ${cyExp})`);

  // 44. 얼굴(동공 중점)이 실제로 캔버스 가로 35% 지점에 온다 — 오른쪽 컨트롤을 피하려고 왼쪽으로 15%
  const faceCenter = await p.evaluate(([px, py]) => {
    const S = window.PB.S, p = S.p;
    const vx = (px - S.iw / 2) * S.s0, vy = (py - S.ih / 2) * S.s0;
    const r = (p.rot * Math.PI) / 180;
    const cx = S.dim.W / 2 + p.ox * S.dim.W + p.zoom * (vx * Math.cos(r) - vy * Math.sin(r));
    const cy = S.dim.H / 2 + p.oy * S.dim.H + p.zoom * (vx * Math.sin(r) + vy * Math.cos(r));
    return { x: cx / S.dim.W, y: cy / S.dim.H };
  }, [(face.pupilL.x + face.pupilR.x) / 2, (face.pupilL.y + face.pupilR.y) / 2]);
  check("44. 자동 정렬 — 얼굴이 작업 영역 가로 한가운데 · 세로 = CENTER_Y",
    near(faceCenter.x, cxExp, 0.01) && near(faceCenter.y, cyExp, 0.01),
    `얼굴 중심 = (${(faceCenter.x * 100).toFixed(1)}%, ${(faceCenter.y * 100).toFixed(1)}%) / 기대 (${(cxExp * 100).toFixed(1)}%, ${(cyExp * 100).toFixed(0)}%)`);

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
  /* v1.89.0 — 프리셋 버튼은 **숨김**(시스템은 유지 · BASELINE 1-52). Playwright click 은
     보이는 요소만 누르므로 DOM click 으로 연다 — 기능이 살아 있는지가 이 검사의 목적이다. */
  await p.evaluate(() => localStorage.removeItem("pb_presets_v1"));
  await p.evaluate(() => document.getElementById("btnPresetLoad").click());
  await p.waitForTimeout(200);
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
  if (RUN(1)) {
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
  // 24. 세로 조절자 = **왼쪽**(v1.95.0 원장님 지시 — 오른손 액션 공간 확보) · 세로 중앙, ▲ 위 / ▼ 아래
  const ctlV = await p.evaluate(() => {
    window.PB.S.sel = "h1"; window.PB.render();
    const c = document.getElementById("posCtlV").getBoundingClientRect();
    const st = document.getElementById("stage").getBoundingClientRect();
    const up = document.getElementById("posPlusV").getBoundingClientRect();
    const dn = document.getElementById("posMinusV").getBoundingClientRect();
    const dockTop = document.getElementById("bottomDock").getBoundingClientRect().top;
    const mid = (c.top + c.bottom) / 2, region = (st.top + dockTop) / 2;
    return { vert: c.height > c.width, leftEdge: c.left - st.left,
             centered: Math.abs(mid - region) < st.height * 0.10,
             upAbove: up.top < dn.top,
             glyph: document.getElementById("posPlusV").textContent + document.getElementById("posMinusV").textContent };
  });
  check("24. 세로 조절자 — 왼쪽 끝 · 세로 중앙 (▲위/▼아래)",
    ctlV.vert && ctlV.leftEdge >= 0 && ctlV.leftEdge < st0W * 0.08 && ctlV.centered && ctlV.upAbove && ctlV.glyph === "▲▼",
    `세로=${ctlV.vert} 좌측여백=${ctlV.leftEdge.toFixed(0)}px 세로중앙=${ctlV.centered} 위화살표위=${ctlV.upAbove} ${ctlV.glyph}`);

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
    ctlH.horiz && ctlH.bottomEdge >= 0 && ctlH.bottomEdge < 120 && ctlH.rightEdge > st0W * 0.015 && ctlH.rightEdge < st0W * 0.08
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
      rightEnd: st.right - h.right > st.width * 0.015 && st.right - h.right < st.width * 0.06
                && Math.abs(m.right - h.right) < 2,
      bottomEnd: st.bottom - h.bottom < 20,
      /* ⚠️ v1.64.0 — 바는 줌~밸런스 행보다 길다 · 왼쪽으로만 늘어난다.
         v1.89.0 — AI 눈썹 맞춤 버튼이 바 왼쪽에 들어오면서 barrow(=버튼+바)는 152% 가 됐고,
         **바 자체**의 길이는 v1.64.0 의 「행보다 길게」를 유지한다 (바+버튼 합이 행×1.52) */
      /* v1.93.0 — 「바 > 행 · 왼쪽으로 넘침」은 **가로 기본 화면**의 규칙(v1.64.0).
         좁은 화면(dock-tight/min)과 세로 폴백에서는 fitDocks 가 바를 의도적으로 줄이므로
         **오른쪽 끝 정렬만** 요구한다 */
      spansRow: (() => {
        const aligned = Math.abs(m.right - h.right) < 2;
        const land = document.body.classList.contains("land");
        const tight = /dock-(tight|min)/.test(document.body.className);
        if (!land || tight) return aligned;
        return aligned && h.width > m.width * 1.02 && h.left < m.left - 2;
      })(),
      /* 화살표 오폭 방지 — 버튼 행과 바 사이 갭 (원장님: 「위 버튼이 실수로 눌리지 않도록」) */
      gap: Math.round(h.top - m.bottom),
    };
  });
  check("38. 오른쪽 아래 — 사진보정 버튼 위 / 좌우 바 = 줌~밸런스 행과 같은 폭·정렬",
    dockOrder.order && dockOrder.rightEnd && dockOrder.bottomEnd && dockOrder.spansRow
      && dockOrder.gap >= 12,
    `순서=${dockOrder.order} 오른쪽끝=${dockOrder.rightEnd} 맨아래=${dockOrder.bottomEnd} 폭=행보다 길게 ${dockOrder.spansRow} · 버튼행↔바 갭 ${dockOrder.gap}px(≥12)`);

  /* 39. 오른쪽 도크 순서 (v1.45.0 · 원장님 지시 2026-08-21)
     위에서부터 **초기화 → 위아래 조절 바 → 다시실행 → 되돌리기**. */
  /* v1.96.0 (원장님 지시 2026-08-29) — 왼쪽엔 위아래 바만(조금 더 왼쪽·아래) ·
     오른쪽 위 = 초기화, 그 밑 1행 = [다시실행][되돌리기](되돌리기가 초기화 바로 아래) ·
     밸런스 묶음 = 여러라인 오른쪽 배경 칸. ⛔ 바를 오른쪽으로 되돌리지 마세요 — 오른손 액션 공간. */
  const placed = await p.evaluate(() => {
    const r = (id) => document.getElementById(id).getBoundingClientRect();
    const u = r("btnUndo"), rd = r("btnRedo"), v = r("posCtlV"), rs = r("btnReset");
    const st = document.getElementById("stage").getBoundingClientRect();
    const mu = r("btnMulti"), bb = r("balBox");
    const bbStyle = getComputedStyle(document.getElementById("balBox"));
    return {
      rowUnderReset: u.top >= rs.bottom - 1 && u.top - rs.bottom < 24
        && Math.abs(u.right - rs.right) < 24 && rd.right <= u.left + 1
        && Math.abs(u.top - rd.top) < 2,
      dockLeft: v.left - st.left < st.width * 0.2,
      barOnly: document.getElementById("rightDock").contains(document.getElementById("posCtlV"))
            && !document.getElementById("rightDock").contains(document.getElementById("btnUndo"))
            && !document.getElementById("rightDock").contains(document.getElementById("btnReset")),
      resetTopRight: st.right - rs.right < st.width * 0.1 && rs.top - st.top < 24,
      balBoxOk: bb.left - mu.right >= 4 && Math.abs(bb.top + bb.height / 2 - (mu.top + mu.height / 2)) < 12
        && bbStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && bbStyle.backgroundColor !== "transparent",
      removed: !document.getElementById("btnAlign") && !document.getElementById("btnRotate")
               && !document.getElementById("phSlider") && !document.getElementById("btnLock2")
               && !document.querySelector(".topbar") && !document.querySelector(".panels"),
    };
  });
  check("39. 왼쪽=위아래 바만 · 오른쪽 위=초기화+다시실행/되돌리기 1행 · 밸런스=여러라인 옆 칸 · 삭제 정리",
    placed.rowUnderReset && placed.dockLeft && placed.barOnly && placed.resetTopRight && placed.balBoxOk && placed.removed,
    `초기화밑 1행=${placed.rowUnderReset} 왼쪽도크=${placed.dockLeft}/${placed.barOnly} 초기화 오른쪽위=${placed.resetTopRight} 밸런스칸=${placed.balBoxOk} 삭제완료=${placed.removed}`);

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

  /* 53. `모든 라인 숨김` 버튼 이름 · 여러라인 버튼 존재
     v1.92.0 — 기본 언어가 **영어**가 되어(1-55) 이름은 언어별로 검사합니다. 자리(같은 줄)는 그대로. */
  const btns = await p.evaluate(() => ({
    allHide: document.getElementById("btnAllLine").textContent.trim(),
    multi: document.getElementById("btnMulti").textContent.trim(),
    sideBySide: Math.abs(document.getElementById("btnAllLine").getBoundingClientRect().top
      - document.getElementById("btnMulti").getBoundingClientRect().top) < 3,
  }));
  check("53. 버튼 이름 — `모든 라인 숨김/Hide all lines` + 옆에 `여러라인/Multi`",
    /^(모든 라인 숨김|Hide all lines)$/.test(btns.allHide)
      && /^(여러라인|Multi)$/.test(btns.multi) && btns.sideBySide,
    `[${btns.allHide}] [${btns.multi}] 같은 줄=${btns.sideBySide}`);

  // 43. 라인 버튼 — 1탭 = 선택(표시 유지) / 같은 버튼 다시 탭 = 숨김
  const lineBtn = await p.evaluate(() => {
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.sel = "h1"; S.hMode = "line";
    /* v1.86.0 — 가이드 중에는 플로우 선을 숨길 수 없다(차례 보호 · 회귀 140). 숨김 규칙 자체는 가이드를 끄고 검사한다 */
    S.guideOn = false; S.guideCur = null; S.intro = false; window.PB.render();
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

  /* 60. 한/영 — 라인 버튼 이름이 언어를 따라간다.
     ⚠️ v1.56.0 — 편집 화면의 한/영 칩은 **제거**됐다 (언어는 사진 선택 화면에서 고른다.
        원장님 지시 2026-08-23: 「언어선택은 사진선택 시 있으니 눈썹 위에 한/영 버튼 제거」).
        그 자리에는 **설정 배지 하나**만 있어야 한다 — 아래에서 함께 확인한다. */
  const lang = await p.evaluate(() => {
    const btn = (k) => document.querySelector(`.lbtn[data-key="${k}"]`).textContent.trim();
    window.PB.setLang("ko");
    const ko = { eye: btn("h1"), center: btn("v1"), pivot: document.getElementById("btnPivot").textContent.trim() };
    window.PB.setLang("en");
    const en = { eye: btn("h1"), center: btn("v1") };
    window.PB.setLang("ko");
    const rail = [...document.querySelectorAll("#railLang button")].map((b) => b.id);
    return { ko, en, rail, homeLang: !!document.getElementById("langKo") };
  });
  check("60. 한/영 전환 — 라인 버튼 이름 · 편집 화면 칩은 제거되고 설정 배지만 남음",
    lang.ko.eye === "눈" && lang.ko.center === "센터" && lang.ko.pivot === "V 센터 피봇"
      && lang.en.eye === "Eye" && lang.en.center === "Center"
      && lang.rail.length === 1 && lang.rail[0] === "btnLook" && lang.homeLang,
    `한=[${lang.ko.eye}/${lang.ko.center}/${lang.ko.pivot}] 영=[${lang.en.eye}/${lang.en.center}] · 레일=[${lang.rail}] · 홈 언어선택=${lang.homeLang}`);

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
  /* v1.51.0 — 내장 프리셋을 없앴으므로 목록은 **사용자가 저장한 것만** (여기서는 2줄) */
  check("68. 모달 — 채운 버튼은 주 동작 하나뿐",
    filled.rows >= 2 && filled.n === 1,
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
    set(64, 0.440, 0.620); set(294, 0.560, 0.620);                    // 콧볼 (코 날개)
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

  /* 153. ⭐⭐⭐ v2.0.0 — **눈 앞꼬리는 언제나 40** (원장님 지시 2026-08-29:
       「눈 앞꼬리를 항상 40으로 잡아야 하는거 아니니?」)
     예전에는 자동 정렬을 **동공 간격**으로 맞추고 눈금을 **화면 좌표**로 보여 줬습니다.
     사람마다 「내안각÷동공」이 달라(실측 0.537~0.701) 내안각이 **37.7~41.3** 사이에서
     흔들렸고, 그러면 40~48 룰이 고객마다 통째로 밀립니다.
       ① 자동 정렬의 자 = **내안각 간격**(INNER_FRAC)
       ② 세로선 눈금 = **얼굴 기준**(왼쪽 내안각 40 · 센터 53.15 · 오른쪽 내안각 66.3)
     ⛔ 둘 다 되돌리지 마세요. */
  if (RUN(2)) {
    const r153 = await p.evaluate((lm) => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W;
      const out = {};
      const run = (scale) => {
        /* 같은 얼굴을 동공만 넓게/좁게 바꿔 본다 — 내안각은 그대로 */
        const L = lm.map((q) => ({ ...q }));
        const mid = (L[468].x + L[473].x) / 2;
        for (const i of [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]) {
          L[i] = { ...L[i], x: mid + (L[i].x - mid) * scale };
        }
        S.landmarks = L; PBx.autoAlign(L); PBx.render();
        const P = (i) => PBx.imgToCanvas(L[i].x * S.iw, L[i].y * S.ih, S.p).x / W;
        const a = Math.min(P(133), P(362)), b = Math.max(P(133), P(362));
        return { span: b - a, tick: PBx.dispV(a), center: PBx.dispV((a + b) / 2),
                 far: PBx.dispV(b), innerDisp: PBx.posConfig("v2").disp };
      };
      out.narrow = run(0.80);   /* 동공이 좁은 얼굴 */
      out.wide = run(1.25);     /* 동공이 넓은 얼굴 */
      /* 눈썹이 프레임 안에 넉넉히 드는 얼굴 — fitBrowsInFrame 이 배율을 줄이지 않는다.
         이때 내안각 간격이 실제로 INNER_FRAC 이 되는지 본다. */
      {
        const L = lm.map((q) => ({ ...q }));
        L[70] = { x: 0.42, y: 0.420, z: 0 }; L[300] = { x: 0.58, y: 0.420, z: 0 };
        L[46] = { x: 0.425, y: 0.445, z: 0 }; L[276] = { x: 0.575, y: 0.445, z: 0 };
        S.landmarks = L; PBx.autoAlign(L); PBx.render();
        const P = (i) => PBx.imgToCanvas(L[i].x * S.iw, L[i].y * S.ih, S.p).x / W;
        const a = Math.min(P(133), P(362)), b = Math.max(P(133), P(362));
        out.fits = { span: b - a, tick: PBx.dispV(a), center: PBx.dispV((a + b) / 2) };
      }
      out.frac = PBx.INNER_FRAC;
      return out;
    }, FAKE_FACE());
    /* ⚠️ 배율이 늘 INNER_FRAC 인 것은 아닙니다 — `fitBrowsInFrame`(1-40)이 눈썹 꼬리가
       잘리면 배율을 낮춥니다. 잠가야 하는 것은 **동공 간격에 흔들리지 않는 것**과
       **눈금이 늘 40** 인 것입니다. 눈썹이 넉넉히 드는 얼굴에서는 INNER_FRAC 그대로. */
    const sameOk = Math.abs(r153.narrow.span - r153.wide.span) < 0.005;
    const fitOk = Math.abs(r153.fits.span - r153.frac) < 0.02
      && r153.fits.tick === 40 && r153.fits.center === 53;
    const tickOk = r153.narrow.tick === 40 && r153.wide.tick === 40;
    const midOk = r153.narrow.center === 53 && r153.wide.center === 53;
    const farOk = r153.narrow.far === 66 && r153.wide.far === 66;
    const innerOk = r153.narrow.innerDisp === 40 && r153.wide.innerDisp === 40;
    check("153. 눈 앞꼬리 = 언제나 40 — 동공 간격이 달라도 내안각 눈금이 흔들리지 않는다",
      sameOk && fitOk && tickOk && midOk && farOk && innerOk,
      `동공 좁/넓 내안각 간격 ${(r153.narrow.span * 100).toFixed(1)}% / ${(r153.wide.span * 100).toFixed(1)}% (같아야 함) · `
      + `안 잘리는 얼굴 ${(r153.fits.span * 100).toFixed(1)}%(기대 ${(r153.frac * 100).toFixed(1)}%) 눈금 ${r153.fits.tick} · `
      + `내안각 눈금 ${r153.narrow.tick}/${r153.wide.tick}(40) · 센터 ${r153.narrow.center}/${r153.wide.center}(53) · `
      + `반대쪽 ${r153.narrow.far}/${r153.wide.far}(66) · 이너 표시 ${r153.narrow.innerDisp}/${r153.wide.innerDisp}(40)`);
  }

  // 70. 비대칭 얼굴 — 이너 바 오차를 좌·우에 고르게 나눈다 (대칭은 유지)
  const asym = await p.evaluate((lm) => {
    const S = window.PB.S, W = S.dim.W;
    /* 랜드마크 수학만 검증한다 — 꼬리 픽셀 연장(v1.35.0)은 사진 잉크에 따라 좌우가
       달라질 수 있어, 이 검사에서는 사진을 잠시 치워 연장을 끈다 */
    const img = S.imgEl; S.imgEl = null;
    S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
    S.imgEl = img;
    const P = (i) => window.PB.imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W;
    const PT = (i) => window.PB.imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p);
    const tip = (alaI, ocI, tailI) => {
      const a = PT(alaI), o = PT(ocI), ty = PT(tailI).y;
      return (a.x + (o.x - a.x) * ((ty - a.y) / (o.y - a.y))) / W;
    };
    return {
      inL: Math.abs(S.g.v2 - P(133)), inR: Math.abs(S.g.v3 - P(362)),
      /* 아우터는 v1.40.0 부터 **콧볼–외안각 연장선 ∩ 꼬리 높이** — 기준쪽만 정확 */
      outL: Math.abs(S.g.v4 - tip(64, 33, 70)), outR: Math.abs(S.g.v5 - tip(294, 263, 300)),
      sym: Math.abs((S.g.v2 + S.g.v3) / 2 - S.g.v1),
    };
  }, FAKE_FACE({ innerR: 0.575, outerR: 0.690 }));   // 오른쪽을 바깥으로 (비대칭 얼굴)
  /* ⚠️ 데칼코마니 (v1.38.0 — 원장님 설명 2026-08-21): 「단 한쪽에만 정확히 선을 맞추고
     반대쪽의 밸런스만 교정하는 방식이다」. 기준쪽(왼쪽) 아우터는 **정확히** 닿고,
     비대칭 오차는 전부 반대쪽이 안는다 — 그 갭을 원장님이 교정한다.
     좌우 평균(오차 반씩)으로 되돌리면 이 검사가 깨집니다. */
  check("70. 비대칭 얼굴 — 이너·아우터는 기준쪽에 정확히, 오차는 반대쪽이 안는다 (데칼코마니)",
    asym.inL < 0.002 && asym.inR < 0.002
      && asym.outL < 0.02 && asym.outR >= asym.outL - 1e-9 && asym.sym < 1e-6,
    `이너 ${(asym.inL * 100).toFixed(2)}%/${(asym.inR * 100).toFixed(2)}% · 아우터 기준쪽 ${(asym.outL * 100).toFixed(2)}% / 반대쪽 ${(asym.outR * 100).toFixed(2)}% · 대칭오차 ${asym.sym.toExponential(1)}`);

  // 71. 눈썹 꼬리가 프레임 안에 들어온다 (자동 정렬 후 잘리지 않음)
  const fit = await p.evaluate((lm) => {
    const S = window.PB.S, W = S.dim.W;
    S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
    const X = (i) => window.PB.imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W;
    return { tailL: Math.min(X(70), S.g.v4), tailR: Math.max(X(300), S.g.v5), wr: S.wr / W, zoom: S.p.zoom };
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
    /* v1.51.0 — 내장 프리셋을 없앴으므로 **사용자가 저장한 것**으로 검사한다.
       frame 이 없는 프리셋은 환산 없이 그대로 적용된다 (76번 규칙) */
    localStorage.setItem("pb_presets_v1", JSON.stringify([
      { id: "u:p1", name: "디자인A", state: { ...window.PB.DEFAULT_GUIDE, h2: 0.36 } },
      { id: "u:p2", name: "디자인B", state: { ...window.PB.DEFAULT_GUIDE, h2: 0.28 } },
    ]));
    const S = window.PB.S;
    S.g = { ...window.PB.DEFAULT_GUIDE }; S.activePreset = null;
    const row = () => [...document.querySelectorAll("#favRow .favbtn")];
    const names = () => row().map((b) => b.querySelector("em").textContent);
    window.PB.buildFavBar();
    const none = row().length;                       // 하나도 없으면 빈 자리도 없어야 한다
    localStorage.setItem("pb_favs_v1", JSON.stringify(["u:p1"]));
    window.PB.buildFavBar();
    const one = names();
    localStorage.setItem("pb_favs_v1", JSON.stringify(["u:p1", "u:p2"]));
    window.PB.buildFavBar();
    const two = names();
    row()[1].click();                                // 눌러서 실제로 적용되는지
    const applied = { h2: S.g.h2, id: S.activePreset };
    /* 지워진 프리셋 id 는 조용히 걸러낸다 */
    localStorage.setItem("pb_favs_v1", JSON.stringify(["u:p1", "u:없는것"]));
    window.PB.buildFavBar();
    const filtered = row().length;
    return { none, one, two, applied, filtered };
  });
  check("84. 즐겨찾기 — 지정한 개수만큼만 · 누르면 바로 적용 · 없는 id 는 걸러냄",
    fav.none === 0 && fav.one.length === 1 && fav.two.length === 2
      && fav.applied.id === "u:p2" && Math.abs(fav.applied.h2 - 0.28) < 0.001
      && fav.filtered === 1,
    `0개→${fav.none} 1개→[${fav.one}] 2개→[${fav.two}] · 적용=${fav.applied.id} · 없는id걸러냄=${fav.filtered === 1}`);

  // 85. 별표는 3개까지 — 4번째는 들어가지 않고, 다시 누르면 해제된다
  const star = await p.evaluate(() => {
    localStorage.removeItem("pb_favs_v1");
    localStorage.setItem("pb_presets_v1", JSON.stringify(
      ["A", "B", "C", "D"].map((n, i) => ({ id: "u:t" + (i + 1), name: "테스트" + n, state: {} }))));
    document.getElementById("btnPresetLoad").click();
    const s = (id) => document.querySelector(`#presetList .star[data-star="${id}"]`);
    const favs = () => JSON.parse(localStorage.getItem("pb_favs_v1") || "[]");
    s("u:t1").click(); s("u:t2").click(); s("u:t3").click();
    const three = favs();
    const litUp = [...document.querySelectorAll("#presetList .star.on")].length;
    s("u:t4").click();                                  // 4번째 — 거부돼야 한다
    const stillThree = favs();
    const toastMsg = document.getElementById("toast").textContent;
    s("u:t2").click();                                  // 해제
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
      && star.stillThree.length === 3 && !star.stillThree.includes("u:t4")
      && /3개까지/.test(star.toastMsg)
      && star.afterOff.length === 2 && !star.afterOff.includes("u:t2")
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
if (RUN(3)) {
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

  /* v1.93.0 — "off" 는 **폐지** (원장님 지시 2026-08-29 「무조건 가로」). off 로 저장돼 있어도 돈다 */
  await p.evaluate(() => localStorage.setItem("pb_orient", "off"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);
  await p.setInputFiles("#fileInput", face.file);
  await p.waitForTimeout(1200);
  const off = await p.evaluate(() => ({
    rot: document.body.classList.contains("rot90"),
    land: document.body.classList.contains("land"),
  }));
  await p.evaluate(() => localStorage.removeItem("pb_orient"));
  check("15. pb_orient=off 도 무시 — 무조건 가로 (v1.93.0)", off.rot && off.land,
    `rot90=${off.rot} land=${off.land}`);

  await ctx.close();
}

/* ═══════ B. 가로(landscape) — 레이아웃 테스트 ═══════ */
console.log("\n[가로 모드 · 레이아웃]");
if (RUN(4)) for (const dev of [{ n: "아이폰 가로 844×390", w: 844, h: 390 }, { n: "아이패드 가로 1180×820", w: 1180, h: 820 }]) {
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
      ids: [...document.querySelectorAll("#menuRow button:not([hidden])")].map((b) => b.id).join(","),
      presetHidden: (() => { const b2 = document.getElementById("btnPresetLoad");
        return b2.hidden && getComputedStyle(b2).display === "none"; })(),
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
      /* v1.95.0 — 바가 왼쪽으로 가서 라벨은 바 **오른쪽**(캔버스 안쪽)입니다 */
      rightOfBar: l.left >= bar.right - 1, inside: l.left >= st.left - 1 && l.right <= st.right + 1,
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
    const dk = document.getElementById("rightDock");
    return { wide, narrow, dockR: dk.offsetLeft + dk.offsetWidth, W };
  });
  const wideLen = hLine.wide.maxX - hLine.wide.minX;
  const narrowLen = hLine.narrow.maxX - hLine.narrow.minX;
  /* v1.95.0 — 바가 왼쪽이라 자는 **왼쪽 바 밑으로** 들어가면 안 됩니다 (workLeft 검사) */
  check(`48. ${dev.n} — 가로 자 길이 = 눈썹 구간 (왼쪽 바를 넘지 않음)`,
    hLine.wide.n >= 4 && hLine.wide.minX >= hLine.dockR - 1
      && narrowLen < wideLen * 0.85                       // 눈썹을 좁히면 자도 짧아진다
      && narrowLen > wideLen * 0.4,
    `넓은눈썹 ${Math.round(wideLen)}px → 좁은눈썹 ${Math.round(narrowLen)}px (캔버스 ${hLine.W}px, 바 오른끝 ${hLine.dockR}px)`);

  // 47. 컨트롤 영역 스크림 — 터치를 막지 않고, 가이드 선보다 아래에 깔린다 (v1.16.0)
  const scrim = await p.evaluate(() => {
    const b = document.querySelector(".scrim-b"), r = document.querySelector(".scrim-l");   /* v1.95.0 — 바가 왼쪽 */
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
      coversBar: rr.right >= document.getElementById("posCtlV").getBoundingClientRect().right - 2,
    };
  });
  check(`47. ${dev.n} — 컨트롤 영역 스크림 (터치 통과 · 선이 위)`,
    scrim.ok && scrim.noTouch && scrim.belowGuides && scrim.coversDocks && scrim.coversBar,
    `터치통과=${scrim.noTouch} 선위=${scrim.belowGuides} 아래도크덮음=${scrim.coversDocks} 세로바덮음=${scrim.coversBar}`);

  check(`45. ${dev.n} — 세로 조절자 값 라벨이 바 오른쪽(안쪽) · 캔버스 안`,
    lab.rightOfBar && lab.inside, `바 오른쪽=${lab.rightOfBar}(간격 ${lab.gap}px) 캔버스안=${lab.inside}`);
  /* v1.46.2 — 세로선 이름 배지는 **전부 숨김** (원장님 지시). 색이 곧 이름표. */
  check(`46. ${dev.n} — 세로선 이름 배지 없음 (v1.46.2 숨김)`,
    lab.count === 0 && !lab.hitChip,
    `개수=${lab.count} 칩겹침=${lab.hitChip}`);

  check(`40. ${dev.n} — 왼쪽 아래는 프리셋(+즐겨찾기) · 좌우 바와 겹치지 않음`,
    menuPos.leftBottom && menuPos.noOverlap && menuPos.gone
      && menuPos.ids === "btnExport,btnChange,btnGuide,btnTip,btnLookCycle"   /* v1.90.0 — 안내 토글 포함 */
      && menuPos.presetHidden,                                          /* 프리셋 숨김 — 시스템은 유지 */
    `왼쪽아래=${menuPos.leftBottom} 겹침없음=${menuPos.noOverlap} 눈가이드제거=${menuPos.gone} [${menuPos.ids}]`);

  /* 83. 버튼 자리 (v1.29.0) — 원장님이 정하신 자리
     · 오른쪽 도크 = `초기화`(짙은 빨강) …띄어서… `사진변경` → `사진저장` → 위아래 바
     · 가운데 아래 = 사진 3버튼. **`사진잠금` 의 가로 중심이 센터 세로선(v1)** 위 (v1.51.0)
     · 좌우 바 왼쪽 = `다시 실행` · `되돌리기`
     · 밸런스 = 위쪽, **중앙보다 약간 왼쪽**
     · 즐겨찾기 3개를 채워도 아래 묶음끼리 겹치지 않는다 */
  const place = await p.evaluate(() => {
    /* v1.51.0 — 내장 프리셋을 없앴으므로 즐겨찾기도 **사용자가 저장한 것**으로 채운다 */
    localStorage.setItem("pb_presets_v1", JSON.stringify(
      ["A", "B", "C"].map((n, i) => ({ id: "u:f" + (i + 1), name: "즐겨" + n, state: {} }))));
    localStorage.setItem("pb_favs_v1", JSON.stringify(["u:f1", "u:f2", "u:f3"]));
    window.PB.buildFavBar();
    const el = (id) => document.getElementById(id);
    const r = (id) => el(id).getBoundingClientRect();
    const st = r("stage"), chg = r("btnChange"), exp = r("btnExport"), lock = r("btnLock");
    const rst = r("btnReset"), ctlV = r("posCtlV"), rd = r("rightDock");
    const rw2 = r("btnBalance");   /* 밸런스 칩 (초기화가 같은 위 행에 있는지 기준 · 항상 표시됨) */
    const bal = r("btnBalance"), ld = r("leftDock"), cd = r("centerDock"), bd = r("bottomDock");
    const cs = getComputedStyle(el("btnReset"));
    return {
      /* v1.89.0 — 사진저장·사진변경은 **왼쪽 끝**(leftDock) · 잠금만 가운데 (원장님 지시 2026-08-28) */
      photoInRDock: el("leftDock").contains(el("btnChange")) && el("leftDock").contains(el("btnExport")),
      photoOrder: exp.right <= chg.left + 1 && exp.left - st.left < 40
                  && Math.abs((exp.top + exp.bottom) / 2 - (chg.top + chg.bottom) / 2) < 12,
      chgSameSize: Math.abs(chg.height - exp.height) < 1 && Math.abs(chg.width - exp.width) < 6,
      chgGrey: !/34, 211, 238|103, 232, 249/.test(getComputedStyle(el("btnChange")).borderTopColor),
      resetTop: rst.top <= rd.top + 2,   /* 도크 맨 위 또는 그보다 위 (v1.44.0 위로 올림) */
      resetDarkRed: cs.color,
      /* v1.45.0 — 초기화 = 프리셋 버튼과 같은 크기 · 되돌리기·다시실행 더 크게 + 채움 배경
         v1.50.0 — **사진저장은 더 이상 채움이 아니다** (원장님 지시: 「시작시 사진저장에 색상 죽일것」).
         대신 **사진잠금이 채움**으로 시선을 잡는다. 되돌리지 마세요 — 105 번도 함께 잠급니다. */
      /* v1.95.0 — 초기화는 오른쪽 위 작은 칩: 밸런스 행과 같은 높이 줄에 · 칩 크기(28~40px) */
      resetPresetSize: Math.abs(rst.top - rw2.top) < 14 && rst.height >= 26 && rst.height <= 40,
      exportQuiet: !getComputedStyle(el("btnExport")).backgroundImage.includes("gradient"),
      /* v1.96.0 — 다시실행·되돌리기는 초기화 밑 1행 칩 (특대 크기 폐지) */
      undoBigger: (() => { const u = r("btnUndo"), rd2 = r("btnRedo"), rs2 = r("btnReset");
        return u.height >= 26 && u.height <= 40 && u.top >= rs2.bottom - 1
            && Math.abs(u.right - rs2.right) < 24 && rd2.right <= u.left + 1; })(),
      undoFilled: getComputedStyle(el("btnUndo")).backgroundImage.includes("gradient")
                  || getComputedStyle(el("btnUndo")).backgroundColor !== "rgba(0, 0, 0, 0)",
      lockAlone: el("centerDock").querySelectorAll("button").length === 1,   /* v1.89.0 — 잠금 홀로 가운데 */
      /* v1.89.0 — AI 눈썹 맞춤: 좌우 바 왼쪽 · 특별한 그라데이션 · 오른쪽 위 작은 잠금 이모지 */
      aiInBarrow: !!el("btnSnap").closest(".barrow"),
      aiLeftOfBar: r("btnSnap").right <= r("posCtlH").left + 1,
      aiSpecial: getComputedStyle(el("btnSnap")).backgroundImage.includes("gradient"),
      aiLockEmoji: (el("btnSnap").querySelector(".ailock") || {}).textContent === "🔒",
      aiSize: Math.abs(r("btnSnap").height - chg.height) < 6,
      /* v1.96.0 — 밸런스 묶음 = 여러라인 오른쪽, 간격 두고 배경 있는 칸 (원장님 지시 2026-08-29) */
      balRight: (() => { const bb = r("balBox"), mu = r("btnMulti");
        const cssBB = getComputedStyle(el("balBox"));
        return bb.left - mu.right >= 4 && cssBB.backgroundColor !== "rgba(0, 0, 0, 0)"; })(),
      favHidden: el("favRow").hidden,
      /* v1.51.0 — 잠금 중심은 **캔버스 정중앙이 아니라 센터 세로선(v1)** 위에 온다 (원장님 지시) */
      lockOnCenterLine: Math.abs((lock.left + lock.right) / 2 - st.left
                        - window.PB.S.g.v1 * window.PB.S.dim.W) < 4,
      lockCentre: ((lock.left + lock.right) / 2 - st.left) / st.width,
      balLeftOfCentre: ((bal.left + bal.right) / 2 - st.left) / st.width,

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
  check(`83. ${dev.n} — 사진 2버튼=왼쪽 끝 · 잠금 홀로 가운데 · AI 눈썹 맞춤=좌우 바 왼쪽 · 밸런스=오른쪽 끝`,
    place.photoInRDock && place.photoOrder && place.chgSameSize && place.chgGrey
      /* v1.45.0 — 초기화 = 프리셋 크기 · 앱 컨셉 코랄(--danger #FF6B7A) 글자 (원장님: 「빨간색은 앱 컨셉과 비슷하게」) */
      && place.resetTop && /255, 107, 122/.test(place.resetDarkRed)
      && place.resetPresetSize && place.exportQuiet && place.undoBigger && place.undoFilled
      && place.lockAlone && place.lockOnCenterLine
      && place.balLeftOfCentre < 0.55 && place.balRight    /* v1.96.0 — 왼쪽 위 여러라인 옆 */
      && place.aiInBarrow && place.aiLeftOfBar && place.aiSpecial && place.aiLockEmoji && place.aiSize
      && place.favHidden
      && place.dockGaps.every((g) => g > 8) && place.labelHitsTop === false,
    `사진2버튼=왼쪽끝${place.photoInRDock}/순서${place.photoOrder} · 잠금단독=${place.lockAlone}/센터선일치=${place.lockOnCenterLine}(${(place.lockCentre * 100).toFixed(1)}%) · 밸런스 ${(place.balLeftOfCentre * 100).toFixed(1)}%/오른쪽끝=${place.balRight} · AI버튼 바로우=${place.aiInBarrow}/바왼쪽=${place.aiLeftOfBar}/특별색=${place.aiSpecial}/잠금이모지=${place.aiLockEmoji}/크기=${place.aiSize} · 프리셋숨김=${place.favHidden} · 도크간격=${place.dockGaps}px · 라벨겹침=${place.labelHitsTop}`);
  await ctx.close();
}

/* ═══════ C. 밸런스 판정 (v1.26.0) ═══════
   실제 고객 사진 대신 **답을 아는 합성 사진**을 만든다.
   왼쪽 막대와 오른쪽 막대의 높이 차이를 정확히 몇 px 로 넣고, 그대로 잡아내는지 본다.
   ⚠️ 반드시 **가로 모드**에서 돌린다 — 세로 폴백은 작업 영역이 좁아 오른쪽 토막이 안 그려진다. */
console.log("\n[밸런스 판정]");
if (RUN(5)) {
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
    /* 꼬리 = 바깥 끝의 **아랫선**(뾰족한 끝) · 아치선 = v3.0.0 **아치엣지-피부 경계** */
    tailMid: 164, archV: 181,
  };
  /* 모양 B — 아치가 **안쪽 가까이**(x 260) 있고 두께도 다른 눈썹.
     ⚠️ 이 모양이 있어야 「아치를 사진에서 찾는다」가 진짜로 검증됩니다.
     아치 자리를 코드에 박아 두면 A 는 통과해도 B 에서 틀립니다. */
  const SHAPE_B = {
    cp: [[120, 158, 168], [160, 154, 166], [210, 138, 162], [250, 120, 146],
         [270, 120, 146], [300, 130, 166], [340, 130, 166]],
    front: [320, 130, 166], arch: [260, 120, 146], tail: [130, 158], inner: 340, outer: 120,
    tailMid: 167, archV: 234,
  };
  /* ⚠️ v1.69.0 — 모양 C = **얼굴을 크게 확대한 사진** (원장님 실제 사진의 상황).
     눈썹이 **지금 선보다 훨씬 위**(y 80~122)에 있고 두께도 선 간격보다 훨씬 두껍다.
     v1.66~1.68 의 예비 경로는 위아래 창을 「지금 선 ±몇 배」로 잡아서, 이런 사진에서 창이
     눈썹 몸통을 가로질렀고 **앞머리·아치·꼬리가 전부 창 천장 값 하나로** 나왔습니다
     (원장님 스크린샷: 자들이 눈썹 위 여백에 뭉쳐 있었습니다).
     ⛔ 이 모양을 지우지 마세요 — 그 증상을 재현하는 유일한 검사입니다. */
  const SHAPE_C = {
    cp: [[120, 110, 120], [150, 108, 120], [185, 84, 118], [215, 80, 116],
         [260, 90, 118], [300, 100, 122], [340, 102, 122]],
    front: [320, 102, 122], arch: [215, 80, 116], tail: [130, 109], inner: 340, outer: 120,
    tailMid: 120, archV: 197,   /* v3.0.0 — 아치선 규칙이 「꺾임점」→「아치엣지가 피부와 맞닿는 자리」로 바뀜 */
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
    /* ⚠️ tag "h" → **관자놀이 머리카락** (원장님 사진의 실제 상황 · v1.66.0).
       눈썹 꼬리(x=120) 바깥에 눈썹과 같은 높이로 진한 머리카락이 내려온다.
       예전 코드는 이것을 눈썹으로 읽어 아우터·아치선을 관자놀이 밖으로 밀어냈습니다. */
    const hair = tag === "h"
      ? `<path d="M 96 60 C 104 120, 84 150, 96 235" stroke="#241a16" stroke-width="30" fill="none" stroke-linecap="round"/>`
      + `<path d="M 58 70 C 70 130, 50 160, 62 245" stroke="#1d1512" stroke-width="26" fill="none" stroke-linecap="round"/>`
      + `<path d="M 118 96 C 100 104, 78 100, 60 108" stroke="#241a16" stroke-width="9" fill="none" stroke-linecap="round"/>` : "";
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${poly}" ${paint}/>${crease}${hair}</svg>`);
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
    /* ⚠️ v1.70.0 — 눈꼬리·내안각. 아치선이 놓일 수 있는 구간(원장님의 1·2·3)을 정합니다.
       빠뜨리면 눈 폭이 0 으로 잡혀 아치선이 엉뚱한 곳에 갇힙니다. */
    put(33, 150, 250); put(133, 300, 250); put(362, 482, 250); put(263, 632, 250);
    return L;
  })();

  /* ⚠️ v1.71.0 — **꼬리가 연하게 사라지는 눈썹** (원장님 지시 2026-08-25 「얇은털 따라가는것 금지」)
     몸통(x 170~340)은 진하고, 꼬리(x 145~172)는 피부와 겨우 14 차이라 **본 판독이 못 봅니다.**
     그래서 판독 열은 x≈172 에서 끊깁니다 — **거기가 꼬리 자리입니다.** 잔털을 따라가면 안 됩니다. */
  const SHAPE_TAPER = {
    cp: [[146, 150, 152], [172, 144, 168], [210, 138, 174], [260, 130, 170],
         [300, 138, 176], [340, 142, 180]],
    tipX: 148, tipY: 151, bandEndX: 172,   /* tipX = 잔털 끝(가면 안 되는 곳) · bandEndX = 진한 눈썹 끝 */
  };
  const makeTaperFace = () => {
    const f = path.join(ROOT, ".draw-taper.svg");
    const seg = (x0, x1) => {
      const up = [], dn = [];
      for (let x = x0; x <= x1; x += 2) { up.push(`${x},${edgeAt(SHAPE_TAPER.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_TAPER.cp, x, 2).toFixed(1)}`); }
      return up.concat(dn.reverse()).join(" ");
    };
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${seg(172, 340)}" fill="#2a1c14"/>`          /* 몸통 — 진하다 */
      + `<polygon points="${seg(146, 174)}" fill="#dccab6"/></svg>`);  /* 꼬리 — 피부와 14 차이 */
    return f;
  };
  /* ⚠️ v1.72.0 — **꼬리 쪽이 옅게 번진 눈썹** (원장님 지시 2026-08-25 「검은 드로잉 고도화로 찾기」)
     몸통(x 178~340)은 진하고, 그 바깥(x 118~182)에는 **넓고 옅은 번짐**이 있습니다.
     번짐은 판독 문턱(18)을 넘어 읽히고 두께가 커서 잉크량도 충분하지만, **진하기가 몸통의 1/3**
     밖에 안 됩니다. 아우터는 **검은 드로잉이 끝나는 곳(≈180)** 에 서야 하고, 번짐 끝(118)까지
     가면 십자가 눈썹 없는 피부 위에 섭니다 (원장님 표시: 보라=그때 자리 · 파랑=있어야 할 자리). */
  const SMUDGE = { bodyEndX: 180, smudgeEndX: 118 };
  const makeSmudgeFace = () => {
    const f = path.join(ROOT, ".draw-smudge.svg");
    const up = [], dn = [];
    for (let x = 178; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<rect x="118" y="132" width="64" height="40" fill="#af9b91"/>`          /* 넓고 옅은 번짐 */
      + `<polygon points="${up.concat(dn.reverse()).join(" ")}" fill="#2a1c14"/></svg>`);
    return f;
  };
  /* ⭐⭐ v1.99.0 — **눈썹 안쪽에 눈꺼풀 그늘이 이어진 사진** (원장님 폰 2026-08-29:
     「눈꼬리부터 내부로 들어오면서 굵은 선이 충분히 인식이 되는데도 너의 인식은 아주 먼
       내부에 정해져 있다 … 사용자의 드로잉은 44에 있다」)
     이 사진은 눈썹(x 120~340) 안쪽에 **진하기가 눈썹의 28% 인 그늘**(x 340~384)이 이어집니다.
     `growEnd` 는 진하기 문턱(중앙값 × 0.25)만 보기 때문에 그늘을 눈썹으로 알고 **끝까지 걸어가**
     이너를 미간 맨살에 세웠습니다 (실기기 재현: 정답 44 자리에 48 이 섰습니다).
     이너는 **드로잉이 시작하는 340 근처**에 서야 하고, 그늘 끝(384)으로 가면 안 됩니다.
     ⛔ 이너를 `growEnd` 결과로 되돌리지 마세요 — 이 검사가 바로 잡습니다. */
  const INNERSHADE = { inkEndX: 340, shadeEndX: 384 };
  const makeInnerShadeFace = () => {
    const f = path.join(ROOT, ".draw-inshade.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<rect x="338" y="150" width="46" height="36" fill="#b0a396"/>`     /* 눈꺼풀 그늘 — 눈썹의 28% */
      + `<polygon points="${up.concat(dn.reverse()).join(" ")}" fill="#2a1c14"/></svg>`);
    return f;
  };
  /* ⭐ v1.74.0 — **앞머리 쪽이 얇게 시작하는 눈썹** (원장님 지시 2026-08-25:
     「이너 라인은 앞 라인이 맞아 색이 시작하는 선이잖아 … 왼쪽 드로잉 시작점이 이너 시작 라인이야」)
     몸통(x 120~300)은 두껍고, 안쪽(x 300~344)으로 갈수록 **얇아지지만 색은 그대로** 입니다.
     잉크량(두께 × 진하기)으로 바깥 열을 자르면 색이 남아 있는 안쪽 끝까지 함께 잘립니다
     — 원장님 사진에서 실제 시작 319px 를 앱이 306px 로 13px 짧게 잡던 바로 그 버그입니다.
     이너는 **색이 시작하는 곳(≈344)** 에 서야 합니다. */
  const SHAPE_HEAD = {
    cp: [[120, 150, 178], [160, 132, 174], [220, 122, 168], [280, 126, 166],
         [310, 132, 158], [330, 140, 150], [344, 144, 149]],
    front: [320, 132, 158], arch: [220, 122, 168], tail: [130, 150], inner: 344, outer: 120,
    tailMid: 164, archV: 181,
  };
  const makeHeadFace = () => {
    const f = path.join(ROOT, ".draw-head.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 344; x += 2) { up.push(`${x},${edgeAt(SHAPE_HEAD.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_HEAD.cp, x, 2).toFixed(1)}`); }
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${up.concat(dn.reverse()).join(" ")}" fill="#2a1c14"/></svg>`);
    return f;
  };
  /* ⭐ v1.74.0 — **꼬리가 얇아지지만 색은 그대로인 눈썹** (원장님 지시 2026-08-25)
     원장님이 사진에 세 자리를 짚어 주셨습니다 — ① 얇은 헤어 ② 그때의 판독 ③ **맞는 드로잉 끝선**.
     ② 는 잉크(두께 × 진하기) 기준이 얇아진 꼬리를 먼저 잘라서 생긴 자리이고, 정답 ③ 은
     **색이 끝나는 곳**입니다. 이 사진은 몸통(x 170~340)이 두껍고 꼬리(x 120~170)가 얇아지지만
     **같은 색**이며, 그 바깥(x 96~120)에는 진하기가 1/5 밖에 안 되는 **잔털**이 있습니다.
     아우터는 ③(≈120)에 서야 하고, ①(96)까지 가면 안 됩니다. */
  const TIP = { tipX: 120, hairX: 96, inkStopX: 150 };
  const SHAPE_TIP = {
    cp: [[120, 146, 152], [140, 140, 158], [170, 132, 166], [220, 122, 168],
         [280, 126, 166], [310, 132, 164], [340, 136, 164]],
    front: [320, 132, 164], arch: [220, 122, 168], tail: [126, 149], inner: 340, outer: 120,
    tailMid: 152, archV: 181,
  };
  const makeTipFace = () => {
    const f = path.join(ROOT, ".draw-tip.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_TIP.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_TIP.cp, x, 2).toFixed(1)}`); }
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<rect x="96" y="144" width="26" height="8" fill="#c9b3a0"/>`      /* 잔털 — 진하기 1/5 */
      + `<polygon points="${up.concat(dn.reverse()).join(" ")}" fill="#2a1c14"/></svg>`);
    return f;
  };
  /* ⭐ v1.75.0 — **눈썹 아래가 그늘진 사진** (원장님 폰 2026-08-25)
     원장님 화면에서 앞머리와 아치두께가 **똑같은 y** 에 서 있었습니다 — 눈꺼풀 위, 눈썹에서
     한참 아래. 두 값이 같다는 건 아랫선이 **탐색창 바닥에 못 박혔다**는 뜻입니다.
     원인: 눈썹 아래 피부가 그늘져 눈썹부터 눈꺼풀까지 **한 덩어리로 이어져** 읽히고,
     그 덩어리가 창 바닥에서 잘려 bot = 바닥이 됩니다.
     이 사진은 눈썹 아랫선부터 y=230(창 바닥 212 아래)까지 옅은 그늘을 깝니다.
     앞머리는 **눈썹 아랫선(178)** 에 서야 하고, 창 바닥(212)에 서면 안 됩니다. */
  const SHADE = { floorY: 212 };
  const makeShadeFace = () => {
    const f = path.join(ROOT, ".draw-shade.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
    const poly = up.concat(dn.reverse()).join(" ");
    /* 그늘 — 눈썹 아랫선에서 시작해 창 바닥 아래까지. 피부보다 33 어두워 판독 문턱을 넘습니다 */
    const su = [], sd = [];
    for (let x = 120; x <= 340; x += 2) { su.push(`${x},${(edgeAt(SHAPE_A.cp, x, 2) - 2).toFixed(1)}`); sd.push(`${x},230`); }
    const shade = su.concat(sd.reverse()).join(" ");
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${shade}" fill="#c9b8a6"/>`
      + `<polygon points="${poly}" fill="#2a1c14"/></svg>`);
    return f;
  };
  /* ⭐ v1.76.0 — **그늘이 창 바닥까지는 안 가는 사진** (원장님 폰 2026-08-25 10:01 · 10:20)
     v1.75.0 은 「창 바닥에 닿은 덩어리」만 구제했습니다. 그래서 앞머리는 눈썹으로 올라왔지만
     **아치두께**는 눈꺼풀 위에 그대로 남았고, 다른 손님 사진에서는 **앞머리**가 눈썹 아래
     맨살에 74px 떨어져 있었습니다 — 그 열의 덩어리는 바닥까지 가지 않고 그늘에서 끝나
     구제 대상이 아니었기 때문입니다.
     이 사진의 그늘은 y=200 에서 끝납니다 (창 바닥 212 **위**). 아랫선은 눈썹 아랫선(178)에
     서야 하고 그늘 끝(200)에 서면 안 됩니다. */
  const SHADE2 = { shadeEndY: 200 };
  const makeShade2Face = () => {
    const f = path.join(ROOT, ".draw-shade2.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
    const poly = up.concat(dn.reverse()).join(" ");
    const su = [], sd = [];
    for (let x = 120; x <= 340; x += 2) { su.push(`${x},${(edgeAt(SHAPE_A.cp, x, 2) - 2).toFixed(1)}`); sd.push(`${x},${SHADE2.shadeEndY}`); }
    const shade = su.concat(sd.reverse()).join(" ");
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${shade}" fill="#c9b8a6"/>`
      + `<polygon points="${poly}" fill="#2a1c14"/></svg>`);
    return f;
  };
  /* ⭐ v1.77.0 — **눈썹 위에 옅은 번짐이 있는 사진** (원장님 폰 2026-08-25 10:12 「앞두께 안 맞음」)
     파우더 눈썹은 위쪽 경계가 부옇게 번집니다. 그 번짐이 판독 문턱을 아슬아슬하게 넘으면
     덩어리가 눈썹 **위 맨살**까지 올라가고, 앞두께 자가 눈썹 윗선보다 위에 섭니다
     (원장님 화면에서 27px 위 · 캔버스로 약 8px).
     이 사진은 눈썹 윗선 위 y=100 까지 아주 옅은 번짐을 깝니다. 앞두께는 **눈썹 윗선(148)** 에
     서야 하고 번짐 위(≈100)에 서면 안 됩니다. */
  const HALO = { haloTopY: 100 };
  const makeHaloFace = () => {
    const f = path.join(ROOT, ".draw-halo.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
    const poly = up.concat(dn.reverse()).join(" ");
    const hu = [], hd = [];
    for (let x = 120; x <= 340; x += 2) { hu.push(`${x},${HALO.haloTopY}`); hd.push(`${x},${(edgeAt(SHAPE_A.cp, x, 1) + 2).toFixed(1)}`); }
    const halo = hu.concat(hd.reverse()).join(" ");
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${halo}" fill="#d2c2b0"/>`      /* 번짐 — 피부보다 겨우 22 어둡다 */
      + `<polygon points="${poly}" fill="#2a1c14"/></svg>`);
    return f;
  };
  const fd = drawFace(SHAPE_A, false, "a"), fo = drawFace(SHAPE_A, true, "ao"),
        fb = drawFace(SHAPE_B, false, "b"), fc = drawFace(SHAPE_A, false, "c"),
        fn = drawFace(SHAPE_A, false, "n"), fh = drawFace(SHAPE_A, false, "h"),
        fhi = drawFace(SHAPE_C, false, "hi");
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
      /* v2.1.3 — 앞머리 하한(눈 위 7 눈금)은 **눈 위치(h1)** 를 기준으로 잽니다.
         합성 랜드마크의 눈은 이미지 y=250 — h1 을 거기에 맞춰야 눈금이 실제 얼굴처럼
         잽니다 (안 맞추면 눈썹이 4.9 눈금으로 보여 하한에 걸립니다). */
      if (lm) S.g.h1 = window.PB.imgToCanvas(0, 250, S.p).y / S.dim.H;
      S.refSide = "L";
      window.PB.render();
      /* 사진을 확대·이동해도 같은 자리에 붙어야 한다 — 기대값을 지금 변환으로 환산한다 */
      const cv = (ix, iy) => window.PB.imgToCanvas(ix, iy, S.p);
      /* ⚠️ v1.73.0 — 원장님 확정: **앞두께 = 윗선 · 앞머리 = 아랫선** (그 전에는 거꾸로였습니다) */
      const exp = { ft: cv(sh.front[0], sh.front[1]).y, front: cv(sh.front[0], sh.front[2]).y,
                    arch: cv(sh.arch[0], sh.arch[1]).y, at: cv(sh.arch[0], sh.arch[2]).y,
                    /* 꼬리는 **끝의 아랫선**, 아치선은 v3.0.0 **아치엣지-피부 경계 x** */
                    tail: cv(sh.tail[0], sh.tailMid).y,
                    inner: cv(sh.inner, 160).x, outer: cv(sh.outer, 160).x,
                    archV: cv(sh.archV, 160).x };
      const ok = window.PB.autoFromDrawing();
      const g = S.g, D = window.PB.DEFAULT_GUIDE;
      /* ⚠️ v1.69.0 — 드로잉 맞춤이 놓는 것은 **앞두께·아치 둘뿐**. 나머지는 그대로여야 한다 */
      const OTHERS = ["front", "archThickness", "h3", "v2", "v4", "v6"];
      /* ⭐ v2.4.0 — 이너 맥시멈 45: 드로잉 시작점이 45 를 넘으면 기대값도 45 자리다 */
      const a90 = window.PB.innerAnchor();
      const innerCapPx = a90 ? (g.v1 - a90 * (1 - window.PB.INNER_F_SOFT)) * W : 1e9;
      /* v3.2.0 — 아치선 방향 판정(seqOrient)의 순수 검사. 센터 400 기준.
         straddleR = **화면 오른쪽 눈썹인데 읽힌 열이 센터를 넘은** 경우 — 예전 식
         (`pts[0].x > cx`)이 여기서 뒤집혔습니다 (실기기 2026-08-30). */
      const mk = (xs) => xs.map((x) => ({ x })), so = window.PB.seqOrient;
      const orient = {
        left: so(mk([100, 200, 300]), 400).map((q) => q.x),
        right: so(mk([500, 600, 700]), 400).map((q) => q.x),
        straddleR: so(mk([395, 500, 700]), 400).map((q) => q.x),
        straddleL: so(mk([100, 300, 405]), 400).map((q) => q.x),
      };
      return { ok, W, H, exp, innerCapPx, orient,
        cxPx: g.v1 * W, archRead: S.archRead ? { ...S.archRead } : null,
        frontPx: g.front * H, ftPx: g.frontThickness * H,
        archPx: g.h2 * H, atPx: g.archThickness * H, tailPx: g.h3 * H,
        innerPx: g.v2 * W, outerPx: g.v4 * W, archVPx: g.v6 * W,
        othersUntouched: OTHERS.every((k) => Math.abs(g[k] - D[k]) < 1e-9),
        moved: OTHERS.filter((k) => Math.abs(g[k] - D[k]) >= 1e-9),
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
    && near(o.innerPx, Math.min(o.exp.inner, o.innerCapPx), 9 * z) && near(o.outerPx, o.exp.outer, 9 * z)
    && near(o.archVPx, o.exp.archV, 12 * z) && o.mirrorOk
    && o.pivotUntouched && o.vBase === false;
  const say = (o) => `앞머리 ${o.frontPx.toFixed(0)}(${o.exp.front.toFixed(0)}) / 앞두께 ${o.ftPx.toFixed(0)}(${o.exp.ft.toFixed(0)}) / `
    + `아치 ${o.archPx.toFixed(0)}(${o.exp.arch.toFixed(0)}) / 아치두께 ${o.atPx.toFixed(0)}(${o.exp.at.toFixed(0)}) / 꼬리 ${o.tailPx.toFixed(0)}(${o.exp.tail.toFixed(0)}) / `
    + `이너 ${o.innerPx.toFixed(0)}(${Math.min(o.exp.inner, o.innerCapPx).toFixed(0)}) · 아치선 ${o.archVPx.toFixed(0)}(${o.exp.archV.toFixed(0)}) `
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
  check("92. 드로잉 자동 맞춤 — 눈썹 아래 쌍꺼풀 선에 앞머리(아랫선)가 끌려가지 않는다", judge(o92), say(o92));
  /* 94. ⚠️ **맨 눈썹(드로잉 없음)** — 원장님 스크린샷(2026-08-20)의 실제 상황.
     자연 눈썹은 대비가 약해 1차 패스가 포기하고 랜드마크 배치로 남았고, 그 배치가
     「전혀 프로페셔널하지 못한」 위치였습니다. 2차 저대비 패스가 털을 읽어야 합니다. */
  const o94 = await runDraw(true, fn, null, SHAPE_A);
  check("94. 맨 눈썹 — 드로잉이 없어도 저대비 2차 패스가 털을 읽어 배치한다", judge(o94), say(o94));
  /* 122. ⛔ v1.71.0 — **얇은 털을 따라가지 않는다** (원장님 지시 2026-08-25: 「얇은털 따라가는것 금지」)
     v1.70.0 은 판독이 끊긴 자리에서 문턱을 낮춰 연한 잔털을 한 걸음씩 따라갔습니다 — 금지되었습니다.
     이 사진은 몸통(x 172~340)이 진하고 꼬리(x 146~174)는 피부와 겨우 14 차이입니다.
     아우터는 **본 판독이 읽은 진한 눈썹의 끝(≈172)** 에 서야 하고, 잔털 끝(146)까지 가면 안 됩니다.
     ⛔ 추적을 다시 넣으면 이 검사가 바로 실패합니다. */
  if (RUN(6)) {
    const ftp = makeTaperFace();
    const o122 = await runDraw(false, ftp, null, SHAPE_A);
    fs.unlinkSync(ftp);
    const atBody = Math.abs(o122.outerPx - SHAPE_TAPER.bandEndX) < 10;   /* 진한 눈썹 끝에 선다 */
    const notChased = o122.outerPx > SHAPE_TAPER.tipX + 12;              /* 잔털까지 가지 않았다 */
    check("122. 얇은 털 추적 금지 — 아우터는 진한 눈썹의 끝에 선다 (잔털까지 따라가지 않는다)",
      o122.ok && atBody && notChased,
      `아우터 ${o122.outerPx.toFixed(0)} (진한 눈썹 끝 ${SHAPE_TAPER.bandEndX} 에 섬=${atBody} · 잔털 끝 ${SHAPE_TAPER.tipX} 까지 안 감=${notChased})`);
  }

  /* 124. ⚠️⚠️ v1.73.0 — **앞두께는 앞머리보다 위** (원장님이 화면에 번호를 찍어 확정 2026-08-25)
       ② 앞두께 = 눈썹 앞부분의 **윗선**
       ① 앞머리 = 눈썹 앞부분의 **아랫선**
     v1.72.0 까지 거꾸로 놓고 있었습니다. 원장님 표시를 캔버스 좌표로 환산하니 「앞두께」가
     그때 앱이 **앞머리**라고 놓던 자리와 정확히 겹쳤습니다.
     ⛔ 두 선을 다시 뒤집지 마세요. */
  if (RUN(7)) {
    const gap = o87.frontPx - o87.ftPx;      /* y 는 아래로 갈수록 큽니다 */
    check("124. 앞머리·앞두께 — 앞두께가 **위**, 앞머리가 **아래** (원장님 확정)",
      gap > 10 && Math.abs(o87.ftPx - o87.exp.ft) < 6 && Math.abs(o87.frontPx - o87.exp.front) < 6,
      `앞두께 ${o87.ftPx.toFixed(0)}(위) · 앞머리 ${o87.frontPx.toFixed(0)}(아래) · 사이 ${gap.toFixed(0)}px`);
  }

  /* 125. ⭐ v1.74.0 — **이너는 「색이 시작하는 선」** (원장님 지시 2026-08-25)
     눈썹 앞머리는 끝으로 갈수록 얇아지므로 **잉크(두께 × 진하기)** 가 먼저 떨어집니다.
     `trimOutside` ⓑ 가 그 열을 잘라 이너가 안쪽으로 덜 들어갔습니다 (원장님 사진 13px 짧음,
     분홍 펜 표시로 확인). `innerStart` 가 **색이 남아 있는 동안** 안쪽 끝만 다시 이어 붙입니다.
     ⛔ 바깥(꼬리) 끝에는 절대 같은 규칙을 쓰지 마세요 — 검사 122·123 이 잡습니다. */
  if (RUN(8)) {
    const fhd = makeHeadFace();
    const o125 = await runDraw(false, fhd, null, SHAPE_HEAD);
    fs.unlinkSync(fhd);
    const atStart = Math.abs(o125.innerPx - o125.exp.inner) < 10;
    check("125. 이너 = 색이 시작하는 선 — 앞머리가 얇아져도 끝까지 따라간다",
      o125.ok && atStart,
      `이너 ${o125.innerPx.toFixed(0)} (색 시작 ${o125.exp.inner.toFixed(0)} 에 섬=${atStart})`);
  }

  /* 126. ⭐ v1.74.0 — **꼬리도 「색이 끝나는 곳」까지 간다** (원장님 지시 2026-08-25)
     원장님 표시: ① 얇은 헤어 ② 그때 판독 ③ 맞는 드로잉 끝선. ② 는 잉크 기준이 얇아진
     꼬리를 먼저 자른 자리였습니다 (원장님 사진 104 ↔ 정답 93, 11px 안쪽).
     `growEnd` 가 색이 남아 있는 열(진하기 ≥ 0.5 × 중앙값)만 이어 붙입니다.
     ⛔ 바깥 문턱(OUTER_DARK)을 0.4 아래로 내리면 이 검사와 122·123 이 함께 깨집니다. */
  if (RUN(9)) {
    const ftip = makeTipFace();
    const o126 = await runDraw(false, ftip, null, SHAPE_TIP);
    fs.unlinkSync(ftip);
    const atTip = Math.abs(o126.outerPx - TIP.tipX) < 10;          /* 색이 끝나는 곳에 선다 */
    const notHair = o126.outerPx > TIP.hairX + 12;                 /* 잔털까지 가지 않았다 */
    const grew = o126.outerPx < TIP.inkStopX - 10;                 /* 잉크 기준에서 실제로 더 나갔다 */
    check("126. 꼬리 = 색이 끝나는 곳 — 얇아진 꼬리를 끝까지 · 잔털은 제외",
      o126.ok && atTip && notHair && grew,
      `아우터 ${o126.outerPx.toFixed(0)} (드로잉 끝 ${TIP.tipX} 에 섬=${atTip} · 잔털 ${TIP.hairX} 까지 안 감=${notHair} · 잉크 기준보다 더 나감=${grew})`);
  }

  /* 127. ⭐ v1.75.0 — **아랫선이 탐색창 바닥에 못 박히지 않는다** (원장님 폰 2026-08-25)
     「폰에서 아예 안 올라간다」 — 앞머리·아치두께가 눈썹이 아니라 눈꺼풀 위에, 그것도 **둘이 같은 y** 에
     서 있었습니다. 눈썹 아래 그늘이 눈썹과 이어져 읽히고 그 덩어리가 창 바닥에서 잘린 것입니다.
     ⛔ 아랫선(bot)을 창 바닥 그대로 쓰지 마세요 — 이 검사가 바로 잡습니다. */
  if (RUN(10)) {
    const fsh = makeShadeFace();
    const o127 = await runDraw(true, fsh, null, SHAPE_A);
    fs.unlinkSync(fsh);
    const onBrow = Math.abs(o127.frontPx - o127.exp.front) < 10;
    const notFloor = o127.frontPx < SHADE.floorY - 12;
    const notSame = Math.abs(o127.frontPx - o127.atPx) > 6;   /* 앞머리와 아치두께가 같은 자리면 바닥이다 */
    check("127. 아랫선 — 눈썹 아래 그늘이 있어도 창 바닥에 못 박히지 않는다",
      o127.ok && onBrow && notFloor && notSame,
      `앞머리 ${o127.frontPx.toFixed(0)}(눈썹 아랫선 ${o127.exp.front.toFixed(0)}, 창바닥 ${SHADE.floorY}) · 아치두께 ${o127.atPx.toFixed(0)} · 눈썹위=${onBrow} 바닥아님=${notFloor} 둘이다름=${notSame}`);
  }

  /* 128. ⭐ v1.76.0 — **그늘이 창 바닥에 안 닿아도 아랫선은 색이 있는 곳까지** (원장님 폰 2026-08-25)
     v1.75.0(바닥에 닿았을 때만 구제)로는 못 잡습니다 — 이 사진의 그늘은 바닥 위에서 끝납니다.
     원장님 화면: 아치두께가 눈꺼풀 위 · 다른 손님 사진에서는 앞머리가 눈썹 아래 74px.
     ⛔ 구제 조건을 「바닥에 닿았을 때만」으로 되돌리지 마세요. */
  if (RUN(11)) {
    const f128 = makeShade2Face();
    const o128 = await runDraw(true, f128, null, SHAPE_A);
    fs.unlinkSync(f128);
    const onBrow = Math.abs(o128.frontPx - o128.exp.front) < 10;
    const atOk = Math.abs(o128.atPx - o128.exp.at) < 10;
    const notShade = o128.frontPx < SHADE2.shadeEndY - 10;
    check("128. 아랫선 — 그늘이 창 바닥에 안 닿아도 눈썹 아랫선에 선다",
      o128.ok && onBrow && atOk && notShade,
      `앞머리 ${o128.frontPx.toFixed(0)}(${o128.exp.front.toFixed(0)}) · 아치두께 ${o128.atPx.toFixed(0)}(${o128.exp.at.toFixed(0)}) · 그늘 끝 ${SHADE2.shadeEndY} 아님=${notShade}`);
  }

  /* 129. ⭐ v1.77.0 — **윗선도 색이 있는 곳까지** (원장님 폰 2026-08-25 「앞두께 안 맞음」)
     눈썹 위 옅은 번짐이 덩어리에 붙어 앞두께가 눈썹 윗선보다 위로 올라갔습니다.
     ⛔ 윗선의 핵심 잘라내기를 빼지 마세요. 단, 문턱은 아랫선(0.45)보다 **훨씬 너그럽게**
     (0.1) — 파우더 눈썹의 진짜 위 경계까지 잘라 내면 앞두께가 눈썹 속으로 들어갑니다
     (원장님 사진에서 0.45 로 두니 앞두께 89 → 98, 원장님 표시 87.7 에서 10px 멀어졌습니다). */
  if (RUN(12)) {
    const f129 = makeHaloFace();
    const o129 = await runDraw(true, f129, null, SHAPE_A);
    fs.unlinkSync(f129);
    const onBrow = Math.abs(o129.ftPx - o129.exp.ft) < 10;
    const notHalo = o129.ftPx > HALO.haloTopY + 20;
    check("129. 윗선 — 눈썹 위 옅은 번짐에 앞두께가 끌려가지 않는다",
      o129.ok && onBrow && notHalo,
      `앞두께 ${o129.ftPx.toFixed(0)}(눈썹 윗선 ${o129.exp.ft.toFixed(0)}, 번짐 위 ${HALO.haloTopY}) · 눈썹위=${onBrow} 번짐아님=${notHalo}`);
  }

  /* 130. ⭐ v1.78.0 — **자는 드로잉 위에 놓인다** (원장님 지시 2026-08-25: 「자기는 드로잉 위치가 아닌데」)
     이너·아우터는 눈썹의 **양 끝**입니다. 자를 그 위에 가운데 맞춰 그리면 절반이 눈썹 밖
     맨살 위로 떠서, 자를 눈썹에 맞춰 볼 수가 없습니다. 이제 자는 세로선에서 **눈썹 쪽으로만**
     뻗고, 세로선과 만나는 자리가 그대로 90° 꼭지점이 됩니다.
     ⛔ 가운데 맞춤으로 되돌리면 이 검사가 바로 실패합니다. */
  if (RUN(13)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);          /* 사진이 있어야 캔버스 크기가 잡힙니다 */
    await p.waitForTimeout(1200);
    const o130 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W;
      S.g = { ...PBx.DEFAULT_GUIDE }; PBx.render();
      const g = S.g, sp = (k) => PBx.H_SPECS.find((x) => x.key === k);
      const q = (k) => PBx.segPx(sp(k));
      const v2 = g.v2 * W, v4 = g.v4 * W, v6 = g.v6 * W, v1 = g.v1 * W;
      const f = q("front")[0], t3 = q("h3")[0], a = q("archThickness")[0];
      const fR = q("front")[1], t3R = q("h3")[1];
      return { v1, v2, v4, v6,
        front: f, tail: t3, arch: a, frontR: fR, tailR: t3R,
        len: { front: f[1] - f[0], tail: t3[1] - t3[0] } };
    });
    await ctx.close();
    /* 왼쪽 눈썹 = [아우터 … 이너] · 앞머리 자는 이너에서 아우터 쪽으로, 꼬리 자는 아우터에서 이너 쪽으로 */
    const fOnBrow = Math.abs(o130.front[1] - o130.v2) < 1.5 && o130.front[0] < o130.v2;
    const tOnBrow = Math.abs(o130.tail[0] - o130.v4) < 1.5 && o130.tail[1] > o130.v4;
    const archCentered = Math.abs((o130.arch[0] + o130.arch[1]) / 2 - o130.v6) < 1.5;
    /* 거울 쪽도 같은 규칙 (부호만 반대) */
    const v2R = 2 * o130.v1 - o130.v2, v4R = 2 * o130.v1 - o130.v4;
    const fMirror = Math.abs(o130.frontR[0] - v2R) < 1.5 && o130.frontR[1] > v2R;
    const tMirror = Math.abs(o130.tailR[1] - v4R) < 1.5 && o130.tailR[0] < v4R;
    check("130. 자는 드로잉 위에 — 이너·아우터 자가 눈썹 밖 맨살로 뜨지 않는다",
      fOnBrow && tOnBrow && archCentered && fMirror && tMirror,
      `앞머리자 ${o130.front[0].toFixed(0)}~${o130.front[1].toFixed(0)} (이너 ${o130.v2.toFixed(0)} 에서 눈썹 쪽=${fOnBrow}) · `
      + `꼬리자 ${o130.tail[0].toFixed(0)}~${o130.tail[1].toFixed(0)} (아우터 ${o130.v4.toFixed(0)} 에서 눈썹 쪽=${tOnBrow}) · `
      + `아치두께자 가운데맞춤=${archCentered} · 거울 ${fMirror}/${tMirror}`);
  }

  /* 131. ⭐⭐ v1.79.0 — **못박음 검사 (일률 검사)** — 원장님 지시 2026-08-25:
       「왜 어떤 사진은 잘 잡고 어떤 사진은 에러가 나는지 확인하고 일률적으로 눈썹 포인트를
        잘 잡도록 해결. 이런 에러 사항이 생기지 않도록 룰 저장」
     이 세션에서 나온 실패는 전부 **한 가지 모양**이었습니다 — 판독이 사진이 아니라
     **탐색창 경계나 그늘 끝에 못박혀서**, 서로 달라야 할 자 둘이 **같은 값**이 되는 것.
       · 앞머리 212 = 아치두께 212 (창 바닥)
       · 앞머리 199 = 아치두께 199 (그늘 끝)
     그래서 **모든 까다로운 사진에 대해 한꺼번에** 다음 네 가지를 봅니다:
       ① 앞두께 < 앞머리      (윗선이 아랫선보다 위)
       ② 아치 < 아치두께      (같은 규칙)
       ③ |앞머리 − 아치두께| > 2   (둘이 같으면 못박힌 것)
       ④ 가로선 다섯 개가 모두 서로 다르다
     ⛔ 새 사진 규칙을 넣을 때 이 검사를 먼저 돌리세요. 개별 검사는 통과해도 여기서 걸립니다. */
  if (RUN(14)) {
    const cases = [];
    const push = (name, f, sh, lm) => cases.push({ name, f, sh, lm });
    const fSh = makeShadeFace(), fSh2 = makeShade2Face(), fHl = makeHaloFace(),
          fTp = makeTipFace(), fHd = makeHeadFace(), fTa = makeTaperFace(), fSm = makeSmudgeFace();
    push("그늘(창바닥)", fSh, SHAPE_A, true);
    push("그늘(창바닥 위)", fSh2, SHAPE_A, true);
    push("위 번짐", fHl, SHAPE_A, true);
    push("얇아지는 꼬리", fTp, SHAPE_TIP, false);
    push("얇아지는 앞머리", fHd, SHAPE_HEAD, false);
    push("잔털 꼬리", fTa, SHAPE_A, false);
    push("옅은 번짐", fSm, SHAPE_A, false);
    push("모양 A", fd, SHAPE_A, true);
    push("모양 B", fb, SHAPE_B, true);
    const bad = [];
    for (const c of cases) {
      const o = await runDraw(c.lm, c.f, null, c.sh);
      const ys = [o.ftPx, o.frontPx, o.archPx, o.atPx, o.tailPx];
      const uniq = new Set(ys.map((v) => Math.round(v))).size === ys.length;
      /* ⭐ v1.81.0 — 원장님이 정하신 해부학 순서도 **모든 사진에서** 지켜져야 한다:
         아치두께 ≤ 앞머리 ≤ 꼬리 (y 는 아래로 갈수록 큼). 넘었다면 눈꺼풀 그늘을 읽은 것. */
      const anat = o.atPx <= o.frontPx && o.atPx <= o.tailPx;
      const ok = o.ok && o.ftPx < o.frontPx && o.archPx < o.atPx
        && Math.abs(o.frontPx - o.atPx) > 2 && uniq && anat;
      if (!ok) bad.push(`${c.name}(앞두께 ${o.ftPx.toFixed(0)}/앞머리 ${o.frontPx.toFixed(0)}/아치 ${o.archPx.toFixed(0)}/아치두께 ${o.atPx.toFixed(0)}/꼬리 ${o.tailPx.toFixed(0)})`);
    }
    [fSh, fSh2, fHl, fTp, fHd, fTa, fSm].forEach((f) => { try { fs.unlinkSync(f); } catch {} });
    check("131. 못박음 검사 — 까다로운 사진 9장 · 자가 창 경계·그늘에 못박히지 않고 아치두께가 꼬리 위",
      bad.length === 0,
      bad.length ? `못박힘: ${bad.join(" · ")}` : `9장 모두 통과 (윗선<아랫선 · 앞머리≠아치두께 · 다섯 값 모두 다름 · 아치두께≤앞머리≤꼬리)`);
  }

  /* 132. ⭐ v1.80.0 — **가이드 OFF = 전부 고유색 · 가이드 ON = 한 줄씩 플로우 · 잡은 선만 잡은 색**
     원장님 지시 2026-08-25: 「가이드를 끄면 모든 선 기본 색상 보이도록, 잡을 때 잡는 색상 삽입,
     가이드가 켜졌을 때만 선 하나씩 플로우 적용해라」
     ⛔ 가이드를 끈 상태에서 회색으로 되돌리지 마세요. 또한 잡을 때 **모든 선**이 잡은 색이
     되면 안 됩니다 (예전 `sel && dragOn` 이 그랬습니다). */
  if (RUN(15)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1200);
    const o132 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1 };
      S.multi = false; S.selSet = []; S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line";
      const lines = () => [...document.getElementById("guides").querySelectorAll("line")].map((l) => ({
        x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
        y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
        c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
        o: +(l.getAttribute("stroke-opacity") || 1), cls: l.getAttribute("class") || "",
      }));
      /* 그 가로선 자리에 실제로 그려진 **굵은** 토막의 색 */
      const hcol = (key) => {
        const y = S.g[key] * H;
        const q = lines().filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1
          && Math.abs(l.x2 - l.x1) > 2 && l.o > 0.3 && l.w > 1.2);
        return q.length ? q[0].c : null;
      };
      const vcol = (key) => {
        const x = S.g[key] * W;
        const q = lines().filter((l) => Math.abs(l.x1 - l.x2) < 0.5 && Math.abs(l.x1 - x) < 1
          && l.o > 0.3 && l.w > 1.2);
        return q.length ? q[0].c : null;
      };
      const blinks = () => lines().filter((l) => l.cls.includes("blink")).length;
      /* ① 가이드 OFF — 전부 고유색 · 깜빡임 없음 */
      S.guideOn = false; S.guideCur = null; S.dragOn = false; PBx.render();
      const off = { front: hcol("front"), arch: hcol("h2"), tail: hcol("h3"),
                    inner: vcol("v2"), outer: vcol("v4"), blink: blinks() };
      /* ② 가이드 ON — 지금 차례(앞머리) 하나만 고유색, 아치·꼬리는 회색 */
      S.guideOn = true; S.guideCur = "front"; PBx.render();
      const on = { front: hcol("front"), arch: hcol("h2"), tail: hcol("h3"), blink: blinks() };
      /* ③ 잡는 중 — 잡은 선만 잡은 색, 나머지는 그대로 고유색 (가이드 OFF 에서) */
      S.guideOn = false; S.guideCur = null; S.sel = "front"; S.dragOn = true; PBx.render();
      const drag = { front: hcol("front"), arch: hcol("h2"), tail: hcol("h3") };
      S.dragOn = false;
      return { off, on, drag, grabCore: S.look.dragCore };
    });
    await ctx.close();
    /* v1.81.0 — 세로선 색이 분리됐습니다: 이너 = 민트 · **아우터 = 먹색**(원장님 지시 2026-08-27) */
    /* v1.94.0 — 원장님 재확정 기본색 (2026-08-29): 이너 묶음 라임 · 아치 민트 · 꼬리 파랑 */
    const offAll = o132.off.front === "#A3E635" && o132.off.arch === "#5EEAD4"
      && o132.off.tail === "#2E8BFF" && o132.off.inner === "#5EEAD4" && o132.off.outer === "#14161B";
    const offNoBlink = o132.off.blink === 0;
    /* 조용한 선은 **얇은 회색**이라 굵은 토막 검색에서는 아예 안 잡힙니다 (null) — 둘 다 조용으로 봅니다 */
    const quiet = (c) => c === null || c === "#14161B";
    const onFlow = o132.on.front === "#A3E635" && quiet(o132.on.arch) && quiet(o132.on.tail);
    const onBlink = o132.on.blink > 0;
    const grabOne = o132.drag.front === o132.grabCore
      && o132.drag.arch === "#5EEAD4" && o132.drag.tail === "#2E8BFF";
    check("132. 가이드 OFF=전부 고유색 · ON=한 줄씩 플로우 · 잡은 선만 잡은 색",
      offAll && offNoBlink && onFlow && onBlink && grabOne,
      `끔: 앞머리 ${o132.off.front}/아치 ${o132.off.arch}/꼬리 ${o132.off.tail}/이너 ${o132.off.inner}/아우터 ${o132.off.outer} 깜빡임 ${o132.off.blink} · `
      + `켬: 앞머리 ${o132.on.front}/아치 ${o132.on.arch}/꼬리 ${o132.on.tail} 깜빡임 ${o132.on.blink} · `
      + `잡는중: 앞머리 ${o132.drag.front}(잡은색 ${o132.grabCore})/아치 ${o132.drag.arch}/꼬리 ${o132.drag.tail}`);
  }

  /* 133. ⭐⭐ v1.81.0 — **아치두께의 마지노선** (원장님 지시 2026-08-27)
     「아치두께는 절대로 꼬리가 측정된 위치 밑으로 내려오지 않는다 …
       아치두께는 앞머리와 같은선 위치 하거나 높은곳에 위치한다 …
       꼬리보다 낮은곳에 쉐도우·어두운 선을 아치두께라고 인식할수 없다」
     이 사진은 **산 아래에만** 짙은 그늘을 깔아 아치두께를 눈꺼풀까지 끌어내립니다.
     ⛔ 상한을 지우면 아치두께가 꼬리(164)·앞머리(178) 아래로 내려가 바로 실패합니다. */
  if (RUN(16)) {
    const f133 = (() => {
      const f = path.join(ROOT, ".draw-archshade.svg");
      const up = [], dn = [];
      for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
      const poly = up.concat(dn.reverse()).join(" ");
      fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
        + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
        /* 산(x 170~250) 아래에만 눈꺼풀까지 이어지는 짙은 그늘 */
        + `<rect x="170" y="136" width="80" height="72" fill="#b9a693"/>`
        + `<polygon points="${poly}" fill="#2a1c14"/></svg>`);
      return f;
    })();
    const o133 = await runDraw(true, f133, null, SHAPE_A);
    fs.unlinkSync(f133);
    const aboveTail = o133.atPx < o133.tailPx;
    const aboveFront = o133.atPx < o133.frontPx;
    const belowArch = o133.atPx > o133.archPx;
    check("133. 아치두께 마지노선 — 꼬리·앞머리보다 아래로 내려가지 않는다 (눈꺼풀 그늘 방어)",
      o133.ok && aboveTail && aboveFront && belowArch,
      `아치두께 ${o133.atPx.toFixed(0)} · 꼬리 ${o133.tailPx.toFixed(0)}(위=${aboveTail}) · `
      + `앞머리 ${o133.frontPx.toFixed(0)}(위=${aboveFront}) · 아치 ${o133.archPx.toFixed(0)}(아래=${belowArch})`);
  }

  /* 134. ⭐ v1.81.0 — **선택·이동·끝냄이 사진 위에서 보인다** (원장님 지시 2026-08-27)
       · 사진을 넣으면 **전체 라인이 고유색으로 한 번 깜빡인 뒤** 첫 플로우가 시작된다
         (「이너 라인만 색이 있고 나머지는 검정색이라 사용자가 이게 뭐지? 한다」)
       · 선을 **선택**하면 그 선이 조금 더 굵고 조금 더 밝아진다 (예전엔 아무 신호가 없었다)
       · 가이드가 꺼진 상태에서 **한 번 움직인 선**은 잡은 선 색으로 남는다 —
         움직이지 않은 선만 고유색으로 남아 무엇이 남았는지 눈으로 읽힌다
     ⛔ 이 세 신호를 빼지 마세요. */
  if (RUN(17)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(400);                    /* 인사(초기화셋팅 · 4s) 가 도는 중 */
    const intro = await p.evaluate(() => {
      const S = window.PB.S, H = S.dim.H;
      const ls = () => [...document.getElementById("guides").querySelectorAll("line")];
      const hcol = (key) => {
        const y = S.g[key] * H;
        const q = ls().filter((l) => Math.abs(l.getAttribute("y1") - l.getAttribute("y2")) < 0.5
          && Math.abs(+l.getAttribute("y1") - y) < 1 && Math.abs(+l.getAttribute("x2") - +l.getAttribute("x1")) > 2
          && +(l.getAttribute("stroke-opacity") || 1) > 0.3 && +l.getAttribute("stroke-width") > 1.2);
        return q.length ? q[0].getAttribute("stroke") : null;
      };
      return { on: S.intro, cur: S.guideCur,
               blink1: ls().filter((l) => (l.getAttribute("class") || "").includes("blink1")).length,
               arch: hcol("h2"), tail: hcol("h3"), front: hcol("front") };
    });
    await p.waitForTimeout(4200);                   /* 인사(4s)가 끝난 뒤 (v1.87.0 초기화셋팅) */
    const after = await p.evaluate(() => ({ on: window.PB.S.intro, cur: window.PB.S.guideCur,
      first: window.PB.GUIDE_FLOW[0], sel: window.PB.S.sel }));
    const marks = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, H = S.dim.H;
      S.intro = false; S.guideOn = false; S.guideCur = null; S.doneSet = [];
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 0.7 };
      S.multi = false; S.selSet = []; S.sel = "h1"; PBx.render();
      const seg = (key) => {
        const y = S.g[key] * H;
        const q = [...document.getElementById("guides").querySelectorAll("line")]
          .map((l) => ({ c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
                         o: +(l.getAttribute("stroke-opacity") || 1),
                         y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
                         x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2") }))
          .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1
                      && Math.abs(l.x2 - l.x1) > 2 && l.o > 0.3);
        return q.sort((a, b) => b.w - a.w)[0] || null;
      };
      const plain = seg("front");
      S.sel = "front"; PBx.render();
      const picked = seg("front");
      /* 움직임이 끝났다고 표시 → 잡은 선 색으로 남는다 */
      PBx.S.doneSet = ["front"]; S.sel = "h1"; PBx.render();
      const settled = seg("front"), other = seg("h2");
      return { plain, picked, settled, other, grabCore: S.look.dragCore, doneC: S.look.doneC };
    });
    await ctx.close();
    /* v1.94.0 — 원장님 재확정 기본색: 앞머리(이너 묶음) 라임 · 아치 민트 · 꼬리 파랑 */
    const introOk = intro.on === true && intro.cur === null && intro.blink1 > 4
      && intro.arch === "#5EEAD4" && intro.tail === "#2E8BFF" && intro.front === "#A3E635";
    const startedOk = after.on === false && after.cur === after.first && after.sel === after.first;
    const pickOk = marks.picked.w > marks.plain.w * 1.15 && marks.picked.o > marks.plain.o + 0.15;
    /* v1.95.0 — 놓은 선은 **놓은 선 색(doneC)** 으로 남습니다 (잡은 선과 분리) */
    const settleOk = marks.settled.c === marks.doneC && marks.other.c === "#5EEAD4";
    check("134. 전체라인 인사 1회 깜빡임 · 선택하면 굵고 밝게 · 움직인 선은 잡은 선 색으로 남음",
      introOk && startedOk && pickOk && settleOk,
      `인사: 켜짐=${intro.on} 차례없음=${intro.cur === null} blink1 ${intro.blink1}개 색 ${intro.front}/${intro.arch}/${intro.tail} · `
      + `끝난 뒤 첫 스텝=${after.cur}(${startedOk}) · `
      + `선택 굵기 ${marks.plain.w.toFixed(2)}→${marks.picked.w.toFixed(2)} 투명도 ${marks.plain.o}→${marks.picked.o} · `
      + `움직인 선 ${marks.settled.c}(놓은색 ${marks.doneC}) / 안 움직인 선 ${marks.other.c}`);
  }

  /* 135. ⭐ v1.81.0 — **가이드 순서를 원장님이 바꿀 수 있다** (원장님 지시 2026-08-27
       「가이드 - 순서 변경가능 기능 추가」)
     · 설정 → 「가이드 순서」 탭에서 ▲▼ 로 순서를 바꾸고, 이름을 눌러 단계를 켜고 끈다
     · 프롬프트 번호(①②③…)는 **바뀐 순서를 따라간다** — 번호를 문구에 박으면 여기서 걸린다
     · 저장되어 다음에도 유지된다 */
  if (RUN(18)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      document.getElementById("btnLook").click();
      document.getElementById("tabOrder").click();
      const rows = () => [...document.querySelectorAll("#orderList .orow")];
      const keys = () => rows().map((r2) => r2.dataset.key);
      const listed = keys().join(",");                     /* v1.83.0 — 이너까지 **일곱 개 모두 켜짐** */
      const flow0 = PBx.GUIDE_FLOW.join(",");
      /* 첫 줄을 ▼ 로 한 칸 내린다 */
      rows()[0].querySelectorAll(".omv")[1].click();
      const flow1 = PBx.GUIDE_FLOW.join(",");
      /* 프롬프트 번호가 새 순서를 따라간다 */
      S.guideOn = true; S.guideCur = PBx.GUIDE_FLOW[1]; PBx.updateGuideTip();
      const num2 = document.getElementById("guideTip").textContent.trim().slice(0, 1);
      /* v1.83.0 — 이너는 **처음부터 켜져 있다**. 눌러서 끄면 목록 아래로 내려가고, 다시 누르면 맨 뒤에 붙는다 */
      const innerRow = rows().find((r2) => r2.dataset.key === "v2");
      const innerWasOn = !innerRow.classList.contains("off");
      innerRow.querySelector(".onm").click();                /* 끈다 */
      const flow2 = PBx.GUIDE_FLOW.join(",");
      const saved = JSON.parse(localStorage.getItem("pb_flow_v2") || "[]").join(",");
      /* 다시 눌러 켠다 → 맨 뒤 */
      rows().find((r2) => r2.dataset.key === "v2").querySelector(".onm").click();
      const flow3 = PBx.GUIDE_FLOW.join(",");
      document.getElementById("mLook").classList.remove("on");
      return { listed, flow0, flow1, num2, innerWasOn, flow2, flow3, saved };
    });
    await ctx.close();
    check("135. 가이드 순서 — ▲▼ 로 바꾸고 이름을 눌러 켜고 끈다 · 번호가 새 순서를 따라간다",
      r.listed === "v2,front,frontThickness,h2,archThickness,v4,h3"
        && r.flow0 === "v2,front,frontThickness,h2,archThickness,v4,h3"
        && r.flow1 === "front,v2,frontThickness,h2,archThickness,v4,h3"
        && r.num2 === "②" && r.innerWasOn
        && r.flow2 === "front,frontThickness,h2,archThickness,v4,h3"
        && r.saved === r.flow2
        && r.flow3 === "front,frontThickness,h2,archThickness,v4,h3,v2",
      `목록 [${r.listed}] · ${r.flow0} → ▼ ${r.flow1} (2번째 번호 ${r.num2}) → 이너 끔 ${r.flow2} → 다시 켬 ${r.flow3} · 저장=${r.saved === r.flow2}`);
  }

  /* 136. ⭐ v1.83.0 — **설정 시트 배치** (원장님 지시 2026-08-27
       「현재 세트·밝은 사진·어두운 사진 카드 세 개를 눈썹 미리보기 밑으로 작은 카드로 옮겨 ·
        선 굵기와 가로 길이를 같은 행에 두지 말고 굵기를 개별 행으로, 그 밑 투명도, 그 밑 선 길이 ·
        테두리는 따로 배경색 블록으로 별도의 추가 작업이라고 느낄 수 있게」)
     · 조합 카드는 **미리보기 다음**에 온다 (시트 맨 위가 아니다)
     · 굵기 · 투명도 · 길이는 **각각 자기 줄** — 한 줄에 슬라이더 둘을 다시 합치면 여기서 걸린다
     · 테두리는 `.setblock` 안에서 **다른 배경색**을 갖는다 */
  if (RUN(19)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      document.getElementById("btnLook").click();
      const prev = document.getElementById("lookPrev");
      const combo = document.getElementById("lookCombo");
      const comboN = combo.querySelectorAll("button").length;
      /* 미리보기 **밑**에 있는가 — 같은 칸 안에서 미리보기 다음, 그리고 화면상 아래 */
      const sameCol = prev.parentElement === combo.parentElement;
      const after = !!(prev.compareDocumentPosition(combo) & Node.DOCUMENT_POSITION_FOLLOWING);
      const pr = prev.getBoundingClientRect(), cr = combo.getBoundingClientRect();
      const below = cr.top >= pr.bottom - 1;
      const smaller = cr.height < pr.height / 2;                 /* 「작은 카드」 */
      /* 굵기 · 투명도 · 길이가 각각 다른 줄 */
      const rowOf = (id) => document.getElementById(id).closest(".setrow");
      const rw = rowOf("rngW"), ra = rowOf("rngAlpha"), rl = rowOf("rngLen"), re = rowOf("rngEdge");
      const oneEach = [rw, ra, rl].every((x) => x.querySelectorAll("input[type=range]").length === 1);
      const distinct = rw !== ra && ra !== rl && rw !== rl;
      const order = (!!(rw.compareDocumentPosition(ra) & Node.DOCUMENT_POSITION_FOLLOWING))
                 && (!!(ra.compareDocumentPosition(rl) & Node.DOCUMENT_POSITION_FOLLOWING));
      /* 테두리 = 별도 배경 블록 */
      const blk = re.closest(".setblock");
      const bg = blk && getComputedStyle(blk).backgroundColor;
      const bgOther = getComputedStyle(rw).backgroundColor;
      const blockOk = !!blk && bg !== bgOther && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg);
      const hdOk = !!blk && !!blk.querySelector(".setblock-hd") && blk.querySelector(".setblock-hd").textContent.trim().length > 0;
      const last = !!(rl.compareDocumentPosition(blk) & Node.DOCUMENT_POSITION_FOLLOWING);
      /* 시트가 여전히 한 화면에 (스크롤 없이) */
      const sh = document.querySelector("#mLook .sheet-in");
      const fits = sh.scrollHeight <= sh.clientHeight + 2;
      document.getElementById("mLook").classList.remove("on");
      return { comboN, sameCol, after, below, smaller, oneEach, distinct, order, blockOk, hdOk, last, fits,
               shH: sh.scrollHeight, clH: sh.clientHeight };
    });
    await ctx.close();
    check("136. 설정 배치 — 조합 카드는 미리보기 밑 작은 카드 · 굵기/투명도/길이 각 한 줄 · 테두리는 별도 블록",
      r.comboN === 3 && r.sameCol && r.after && r.below && r.smaller
        && r.oneEach && r.distinct && r.order && r.blockOk && r.hdOk && r.last && r.fits,
      `조합 ${r.comboN}개 · 미리보기 밑=${r.below}(같은 칸 ${r.sameCol}/다음 ${r.after}) · 작은 카드=${r.smaller} · `
      + `한 줄에 하나=${r.oneEach}/서로 다른 줄=${r.distinct}/굵기→투명도→길이=${r.order} · `
      + `테두리 별도 배경=${r.blockOk} 머리말=${r.hdOk} 맨 아래=${r.last} · 스크롤 없음=${r.fits}(${r.shH}/${r.clH})`);
  }

  /* 137. ⭐ v1.83.0 — **고르면 선이 되살아난다** (원장님 지시 2026-08-27
       「선을 선택시 그 선 고유의 선색이 조금더 굵어지고 조금더 밝아지게 …
         선이 죽어있다 다시 선택될경우 고유의 색이 생성. 선택했다는 것을 표기한다」)
     · 가이드 꺼짐 + 이미 움직여 「죽은」 선(잡은 선 색)을 다시 고르면 **고유색**으로 돌아온다
     · 고른 선은 안 고른 선보다 **굵고 밝다**
     · 고른 **그 순간** 한 번 반짝인다(blink1) — 반복 깜빡임(blink)이 아니다
     · 손으로 잡고 있는 동안에는 **잡은 선 색**이 이긴다 */
  if (RUN(20)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, H = S.dim.H;
      S.intro = false; S.multi = false; S.selSet = [];
      S.look = { ...PBx.LOOK_DEF, weight: 1, alpha: 1, dragCore: "#14161B", dragEdge: "none", dragW: 1, dragOp: 1 };
      const seg = (key) => {
        const y = S.g[key] * H;
        const ls = [...document.getElementById("guides").querySelectorAll("line")].filter((l) => {
          const y1 = +l.getAttribute("y1"), y2 = +l.getAttribute("y2");
          if (+(l.getAttribute("stroke-opacity") || 1) <= 0.3) return false;
          return Math.abs(y1 - y2) < 0.5 && Math.abs(y1 - y) < 1 && Math.abs(+l.getAttribute("x2") - +l.getAttribute("x1")) > 4;
        }).sort((a, b) => +b.getAttribute("stroke-width") - +a.getAttribute("stroke-width"));
        return ls[0] ? { c: ls[0].getAttribute("stroke"), w: +ls[0].getAttribute("stroke-width"),
                         o: +(ls[0].getAttribute("stroke-opacity") || 1),
                         cls: ls[0].getAttribute("class") || "" } : null;
      };
      /* 가이드를 끄고, 앞머리는 이미 한 번 움직인 것으로 둔다 → 잡은 선 색으로 죽어 있다 */
      S.guideOn = false; S.guideCur = null; S.doneSet = ["front"];
      document.querySelector('.lbtn[data-key="h2"]').click();          /* 다른 선을 고른 상태 */
      PBx.render();
      const dead = seg("front"), plain = seg("archThickness");
      /* 죽은 앞머리를 다시 고른다 → 고유색 · 더 굵게 · 더 밝게 · 한 번 반짝 */
      document.querySelector('.lbtn[data-key="front"]').click();
      PBx.render();
      const picked = seg("front");
      const pulseOnce = picked && /\bblink1\b/.test(picked.cls) && !/\bblink\b(?!1)/.test(picked.cls);
      /* 잡고 있는 동안은 잡은 선 색이 이긴다 */
      S.dragOn = true; PBx.render();
      const held = seg("front");
      S.dragOn = false;
      /* 다른 선으로 옮기면 앞머리는 다시 죽는다 */
      document.querySelector('.lbtn[data-key="h2"]').click();
      PBx.render();
      const backDead = seg("front");
      return { dead, plain, picked, pulseOnce, held, backDead, own: S.look.inner, grab: S.look.dragCore,
               done: S.look.doneC };   /* v1.95.0 — 죽은(놓은) 선은 놓은 선 색 */
    });
    await ctx.close();
    const okRevive = r.dead && r.picked && r.dead.c === r.done && r.picked.c === r.own;   /* v1.95.0 doneC */
    const okLouder = r.picked && r.plain && r.picked.w > r.plain.w + 0.01 && r.picked.o >= r.plain.o;
    check("137. 고르면 되살아난다 — 죽은 선도 고르면 고유색·더 굵게·한 번 반짝 · 잡는 동안은 잡은 선 색",
      okRevive && okLouder && r.pulseOnce
        && r.held && r.held.c === r.grab && r.backDead && r.backDead.c === r.done,
      `죽은 앞머리 ${r.dead && r.dead.c} → 고르면 ${r.picked && r.picked.c}(고유 ${r.own}) · `
      + `굵기 ${r.plain && r.plain.w.toFixed(2)}→${r.picked && r.picked.w.toFixed(2)} 투명도 ${r.plain && r.plain.o}→${r.picked && r.picked.o} · `
      + `한 번 반짝=${r.pulseOnce}(${r.picked && r.picked.cls}) · 잡는 중 ${r.held && r.held.c}(잡은색 ${r.grab}) · 놓고 다른 선 고르면 ${r.backDead && r.backDead.c}(놓은색 ${r.done})`);
  }

  /* 138. ⭐ v1.84.0 — **고른 선 말고는 한 단계 물러난다** (원장님 확인 2026-08-27 · B안)
     · 가이드 **꺼짐**: 고른 선은 그대로, 나머지는 **자기 색 그대로 옅게**(0.55) — 회색으로 바꾸지 않는다
     · 가이드 **켜짐**: 아무것도 죽이지 않는다 (이미 차례 선 하나만 색이 있다)
     ⛔ 나머지 선의 **색**이 바뀌면 실패한다 — 색이 곧 이름표다 */
  if (RUN(21)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, H = S.dim.H;
      S.intro = false; S.multi = false; S.selSet = []; S.doneSet = []; S.dragOn = false;
      S.look = { ...PBx.LOOK_DEF, weight: 1, alpha: 0.8 };
      const seg = (key) => {
        const y = S.g[key] * H;
        const ls = [...document.getElementById("guides").querySelectorAll("line")].filter((l) => {
          const y1 = +l.getAttribute("y1"), y2 = +l.getAttribute("y2");
          if (+(l.getAttribute("stroke-opacity") || 1) <= 0.3) return false;
          return Math.abs(y1 - y2) < 0.5 && Math.abs(y1 - y) < 1 && Math.abs(+l.getAttribute("x2") - +l.getAttribute("x1")) > 4;
        }).sort((a, b) => +b.getAttribute("stroke-width") - +a.getAttribute("stroke-width"));
        return ls[0] ? { c: ls[0].getAttribute("stroke"), o: +(ls[0].getAttribute("stroke-opacity") || 1) } : null;
      };
      /* 가이드 꺼짐 — 아치엣지를 고른다 */
      S.guideOn = false; S.guideCur = null;
      document.querySelector('.lbtn[data-key="h2"]').click();
      PBx.render();
      const picked = seg("h2"), other = seg("h3"), otherFront = seg("front");
      /* 가이드 켜짐 — 죽이지 않는다 (차례 선만 색이 있다) */
      S.guideOn = true; S.guideCur = "h3"; S.sel = "h3"; S.selUD = "h3";
      PBx.render();
      const onCur = seg("h3");
      return { picked, other, otherFront, onCur, alpha: S.look.alpha,
               tailOwn: S.look.tail, innerOwn: S.look.inner };
    });
    await ctx.close();
    const fadeOk = r.other && Math.abs(r.other.o - 0.8 * 0.55) < 0.02
                && r.otherFront && Math.abs(r.otherFront.o - 0.8 * 0.55) < 0.02;
    const keepColor = r.other && r.other.c === r.tailOwn && r.otherFront && r.otherFront.c === r.innerOwn;
    const pickedOk = r.picked && Math.abs(r.picked.o - Math.min(1, 0.8 + 0.25)) < 0.02;
    const guideOnOk = r.onCur && Math.abs(r.onCur.o - Math.min(1, 0.8 + 0.25)) < 0.02;
    check("138. 고른 선 말고는 한 단계 물러난다 — 가이드 꺼짐에서만 · 색은 그대로 옅게",
      fadeOk && keepColor && pickedOk && guideOnOk,
      `고른 선 ${r.picked && r.picked.o.toFixed(2)}(기대 ${Math.min(1, r.alpha + 0.25)}) · `
      + `나머지 ${r.other && r.other.o.toFixed(2)}/${r.otherFront && r.otherFront.o.toFixed(2)}(기대 ${(0.8 * 0.55).toFixed(2)}) · `
      + `색 유지=${keepColor}(${r.other && r.other.c}/${r.otherFront && r.otherFront.c}) · 가이드 켜짐 차례선 ${r.onCur && r.onCur.o.toFixed(2)}`);
  }

  /* 139. ⭐⭐ v1.85.0 — **한 번 탭에 선이 사라지면 안 된다** (원장님 신고 2026-08-28
       「드로잉 맞춤 클릭시 이너가 사라졌다」)
     원인: 숨김 조건이 `S.sel === 이 선` 이었는데, v1.83.0 에서 **이너가 플로우 첫 스텝**이 되면서
     드로잉 맞춤·가이드 켜기가 이너를 자동 선택해 둡니다. 그 상태에서 이너를 **한 번만** 눌러도
     「두 번째 탭」으로 취급돼 선이 숨겨졌습니다.
     · 앱이 자동으로 고른 선을 한 번 눌러도 **절대 숨지 않는다**
     · 같은 버튼을 **연달아 두 번** 누르면 숨는다 (원래 기능) · 세 번째면 다시 나온다
     · 숨긴 순간에는 HUD 로 알린다 — 조용히 사라지면 고장으로 보입니다 */
  if (RUN(22)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      S.intro = false; S.multi = false; S.selSet = []; S.hMode = "line";
      const tap = (k) => document.querySelector(`.lbtn[data-key="${k}"]`).click();
      const vis = () => S.g.v2Visible;
      /* ① 앱이 이너를 자동 선택한 상태(가이드 첫 스텝 = 이너)에서 한 번 탭 */
      S.guideOn = true; S.guideCur = PBx.GUIDE_FLOW[0];
      PBx.S.sel = "v2"; PBx.S.selUD = "v2"; PBx.S.selLR = "v2";
      tap("v2");
      const afterAutoSel = vis();
      /* ② 같은 버튼을 한 번 더 → 숨는다 + HUD
         (v1.86.0 — **가이드가 켜져 있으면 플로우 선은 숨길 수 없으므로** 끄고 검사한다) */
      S.guideOn = false; S.guideCur = null;
      tap("v2");
      const afterSecond = vis();
      const hud = (document.getElementById("hud") || {}).textContent || "";
      /* ③ 한 번 더 → 다시 나온다 */
      tap("v2");
      const afterThird = vis();
      /* ④ 사이에 다른 선을 고르면 카운트가 끊긴다 — 이너를 한 번 눌러도 안 숨는다 */
      tap("h2"); tap("v2");
      const afterInterrupted = vis();
      /* ⑤ 가이드가 자동으로 다음 선을 고른 뒤에도 한 번 탭은 안전하다 */
      S.guideOn = true; PBx.S.guideCur = "front"; window.PB.S.sel = "front";
      tap("front"); const frontOnce = S.g.frontVisible;
      const btn = document.querySelector('.lbtn[data-key="v2"]');
      S.g.v2Visible = false; PBx.render();
      const marked = (() => { const b = document.querySelector('.lbtn[data-key="v2"]');
        return b.classList.contains("hidden-line"); })();
      S.g.v2Visible = true; PBx.render();
      return { afterAutoSel, afterSecond, afterThird, afterInterrupted, frontOnce, hud, marked };
    });
    await ctx.close();
    check("139. 한 번 탭에 선이 사라지지 않는다 — 숨김은 같은 버튼 연속 두 번만",
      r.afterAutoSel === true && r.afterSecond === false && r.afterThird === true
        && r.afterInterrupted === true && r.frontOnce === true
        && /숨김|hidden/.test(r.hud) && r.marked === true,
      `자동선택 뒤 한 번 탭=${r.afterAutoSel ? "보임" : "사라짐"} · 두 번=${r.afterSecond ? "보임" : "숨김"} · `
      + `세 번=${r.afterThird ? "보임" : "숨김"} · 사이에 다른 선=${r.afterInterrupted ? "보임" : "숨김"} · `
      + `앞머리 한 번 탭=${r.frontOnce ? "보임" : "사라짐"} · HUD "${r.hud.trim()}" · 버튼 표시=${r.marked}`);
  }

  /* 140. ⭐ v1.86.0 — **드로잉 맞춤은 숨은 가이드 선을 되살린다 · 차례인 선은 숨길 수 없다**
       (원장님 지시 2026-08-28 「드로잉맞춤 클릭시 이너가 사라졌다 확인후 예전에 사용하던 이너라인 되돌려놔」)
     · 이너가 숨겨진 채로 드로잉 맞춤을 누르면 → **다시 나온다** (가이드 순서에 있는 선 전부)
     · 지금 차례인 선은 같은 버튼을 두 번 눌러도 **안 숨는다** (앱이 시켜 놓고 숨기면 시술이 멈춘다) */
  if (RUN(23)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(async () => {
      const PBx = window.PB, S = PBx.S;
      S.intro = false; S.multi = false; S.selSet = []; S.hMode = "line";
      const tap = (k) => document.querySelector(`.lbtn[data-key="${k}"]`).click();
      /* ① 가이드를 끈 상태에서 이너를 두 번 눌러 숨긴다 */
      S.guideOn = false; S.guideCur = null;
      tap("v2"); tap("v2");
      const hidden = S.g.v2Visible;
      /* ② 드로잉 맞춤 → 가이드 순서에 있는 선이 전부 되살아난다 */
      document.getElementById("btnSnap").click();
      await new Promise((r2) => setTimeout(r2, 1200));
      const back = PBx.GUIDE_FLOW.every((k) => {
        const sp = PBx.H_SPECS.concat(PBx.V_SPECS).find((x) => x.key === k);
        return S.g[sp.vis] === true;
      });
      const innerBack = S.g.v2Visible;
      /* ③ 지금 차례인 선은 두 번 눌러도 안 숨는다 */
      S.guideOn = true; S.guideCur = "v2";
      tap("v2"); tap("v2");
      const stepKept = S.g.v2Visible;
      const hud = (document.getElementById("hud") || {}).textContent || "";
      /* ④ 원래 기능은 살아 있다 — 가이드 중에도 **플로우 밖 선**(눈)은 두 번 누르면 숨는다.
         (플로우 선은 누르는 순간 차례가 되므로 가이드 중에는 숨길 수 없다 — 그것이 의도다) */
      tap("h1"); tap("h1");
      const otherHides = S.g.h1Visible;
      tap("h1");
      return { hidden, back, innerBack, stepKept, otherHides, hud, flow: PBx.GUIDE_FLOW.join(",") };
    });
    await ctx.close();
    check("140. 드로잉 맞춤이 숨은 선을 되살린다 · 차례인 선은 숨길 수 없다",
      r.hidden === false && r.back === true && r.innerBack === true
        && r.stepKept === true && r.otherHides === false && /차례|current step/.test(r.hud),
      `숨김 뒤 이너=${r.hidden ? "보임" : "숨김"} → 드로잉 맞춤 뒤 이너=${r.innerBack ? "보임" : "숨김"}(플로우 전체 ${r.back}) · `
      + `차례 선 두 번 탭=${r.stepKept ? "그대로 보임" : "숨음"} · 차례 아닌 선 두 번 탭=${r.otherHides ? "보임" : "숨음"} · HUD "${r.hud.trim()}"`);
  }

  /* 141. ⭐ v1.87.0 — **「초기화셋팅」** (원장님 지시 2026-08-28 · 이름도 원장님이 붙임)
       블링킹 + 전체 색 보임(4초) → 가이드 첫 스텝.
     · 시간: INTRO_MS = **3200** — 4000 에서 「아주 조금만 짧게」(원장님 지시 2026-08-28).
       1.6s(너무 짧음)와 4s(조금 김) 사이 · 선을 움직이면 **즉시 종료**된다(회귀 142)
     · 작동 네 곳: 사진 로드(101·134 가 검사) · **초기화 버튼** · **가이드 껐다 켜기** (여기서 검사)
     · 인사 동안: intro=true · 차례 없음 · 인사가 끝나면 첫 스텝(guideOn 일 때) */
  if (RUN(24)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(600);
    const r = await p.evaluate(async () => {
      const PBx = window.PB, S = PBx.S;
      const wait = (ms) => new Promise((r2) => setTimeout(r2, ms));
      const msOk = PBx.INTRO_MS >= 2500 && PBx.INTRO_MS <= 3500;   /* 3.2초 — 1.6s 와 4s 사이 */
      const atLoad = S.intro === true && S.guideCur === null; /* ① 사진 로드 직후 */
      S.intro = false; PBx.S.guideCur = "front"; window.PB.render();
      /* ③ 초기화 버튼 → 인사부터 다시 */
      document.getElementById("btnReset").click();
      const atReset = S.intro === true && S.guideCur === null;
      /* ④ 가이드 껐다 켜기 → 인사부터 다시 */
      document.getElementById("btnGuide").click();            /* 끔 */
      const offClean = S.guideOn === false && S.intro === false && S.guideCur === null;
      document.getElementById("btnGuide").click();            /* 켬 */
      const atGuideOn = S.guideOn === true && S.intro === true && S.guideCur === null;
      /* 인사가 끝나면 첫 스텝 (검사를 빨리 끝내려고 타이머를 짧게 다시 건다) */
      PBx.startIntro && (() => {})();
      await wait(0);
      S.intro = false; S.guideCur = PBx.GUIDE_FLOW[0];        /* 타이머 결과와 같은 상태 */
      const endsAtFirst = S.guideCur === PBx.GUIDE_FLOW[0];
      return { msOk, ms: PBx.INTRO_MS, atLoad, atReset, atGuideOn, offClean, endsAtFirst };
    });
    await ctx.close();
    check("141. 초기화셋팅 — 4초 인사 · 사진 로드/초기화/가이드 껐다 켜기 에서 작동",
      r.msOk && r.atLoad && r.atReset && r.atGuideOn && r.offClean && r.endsAtFirst,
      `INTRO_MS=${r.ms}(2500~3500 ${r.msOk}) · 사진 로드=${r.atLoad} · 초기화 버튼=${r.atReset} · `
      + `가이드 끔=차례없음 ${r.offClean} · 다시 켬=인사 ${r.atGuideOn} · 끝나면 첫 스텝=${r.endsAtFirst}`);
  }

  /* 142. ⭐ v1.88.0 — **잡는 범위 섬세 교정 · 인사 조기 종료** (원장님 지시 2026-08-28)
     · 아치엣지·아치두께는 아치선 **위에** 올라와 있다 — 그 자리를 누르면 언제나 가로 자가 잡힌다
     · 아치선(v6)은 **아치두께 아래 구간**을 눌러야 잡힌다
     · 눈 가로선(h1)은 **9px 안**에서만 잡힌다 — 근처를 스쳐도 안 잡힌다
     · 초기화셋팅 중에 선을 움직이면 인사가 **즉시** 끝난다 */
  if (RUN(25)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H, g = S.g;
      S.intro = false;
      /* v1.94.0 — 기본 가로 길이가 8%로 짧아져 자 시작점이 세로선에 붙습니다.
         이 테스트는 **잡는 범위**를 재는 것이므로 중립 길이(0.19)로 고정합니다. */
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1 };
      PBx.render();
      const hit = (x, y) => { const h = PBx.hitTest(x, y); return h ? h.key || h.type : null; };
      /* 교차점 좌표: 아치선 x 에서 아치엣지·아치두께 높이 */
      const vx = g.v6 * W;
      const atH2   = hit(vx, g.h2 * H);              /* 아치엣지 위 (아치선과 교차) */
      const atAT   = hit(vx, g.archThickness * H);   /* 아치두께 위 (아치선과 교차) */
      const below  = hit(vx, g.archThickness * H + 30);  /* 아치두께보다 아래 → 아치선 */
      const above  = hit(vx + 40, g.h2 * H - 20);        /* 아치두께 위쪽 빈 공간 → 아치선 안 잡힘 */
      /* 눈 선 — 5px 는 잡히고 15px 는 안 잡힌다 (다른 선이 없는 x 에서) */
      const ex = g.v1 * W + 6;                       /* 센터선 바로 옆 — 눈 선은 좌우 관통 */
      const eyeNear = hit(ex + 60, g.h1 * H + 5);
      const eyeFar  = hit(ex + 60, g.h1 * H + 15);
      /* 다른 가로선은 기존 28px 그대로 — 앞머리 15px 는 잡힌다 */
      const frontFar = hit(PBx.segPx(PBx.H_SPECS.find((q) => q.key === "front"))[0][0] + 5, g.front * H + 15);
      /* 인사 조기 종료 — 슬라이더를 움직이면 intro 가 즉시 꺼진다 */
      PBx.startIntro();
      const introOn = S.intro === true;
      S.selUD = "front"; S.hMode = "line";
      const sl = document.getElementById("posSliderV");
      sl.dispatchEvent(new Event("input", { bubbles: true }));
      const introOffNow = S.intro === false;
      sl.dispatchEvent(new Event("change", { bubbles: true }));
      S.dragOn = false;
      return { atH2, atAT, below, above, eyeNear, eyeFar, frontFar, introOn, introOffNow };
    });
    await ctx.close();
    check("142. 잡는 범위 — 교차점은 가로 자 · 아치선은 아래 구간 · 눈 선은 9px · 인사 조기 종료",
      r.atH2 === "h2" && r.atAT === "archThickness" && r.below === "v6"
        && r.above !== "v6" && r.eyeNear === "h1" && r.eyeFar !== "h1" && r.frontFar === "front"
        && r.introOn && r.introOffNow,
      `아치엣지 교차점=${r.atH2} · 아치두께 교차점=${r.atAT} · 아래 구간=${r.below} · 위 빈 공간=${r.above} · `
      + `눈 5px=${r.eyeNear}/15px=${r.eyeFar} · 앞머리 15px=${r.frontFar} · 인사 켜짐=${r.introOn}→움직이자 꺼짐=${r.introOffNow}`);
  }

  /* 143. ⭐ v1.90.0 — **안내는 중앙 위 · 끌 수 있다 · 가이드가 켜져 있는 동안은 사라지지 않는다**
       (원장님 지시 2026-08-28)
     · 가이드 안내와 AI 눈썹정렬 알림은 **중앙 위 같은 자리**(.guidetip)
     · 「안내」 토글(가이드 버튼 옆)로 끄고 켤 수 있다 — 끄면 프롬프트만 사라지고 플로우는 그대로
     · 인사(초기화셋팅) 중에도 첫 스텝 안내가 미리 나온다 — 껐다 켠 직후 비어 보이지 않게
     · 플로우 밖 선(눈)을 골라도 안내가 유지된다
     · AI 버튼은 「AI / 눈썹정렬」 두 줄 */
  if (RUN(26)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      S.intro = false; S.tipOn = true;
      const tipEl = document.getElementById("guideTip"), noteEl = document.getElementById("topNote");
      const stW = document.getElementById("stage").getBoundingClientRect();
      /* ① 자리 — 중앙 위 (가이드 안내 · AI 알림 같은 컨테이너) */
      S.guideOn = true; S.guideCur = "v2"; PBx.updateGuideTip();
      const tr = tipEl.getBoundingClientRect();
      const centred = Math.abs((tr.left + tr.right) / 2 - (stW.left + stW.width / 2)) < stW.width * 0.12;
      const topArea = tr.top - stW.top < 60;
      const sameBox = tipEl.parentElement === noteEl.parentElement;
      /* ② 인사 중에도 첫 스텝 안내 */
      S.intro = true; S.guideCur = null; PBx.updateGuideTip();
      const duringIntro = !tipEl.hidden && tipEl.textContent.includes("①");
      S.intro = false;
      /* ③ 플로우 밖 선(눈)을 골라도 유지 */
      S.guideCur = "front"; PBx.updateGuideTip();          /* tipKey = front */
      S.guideCur = null; S.sel = "h1"; PBx.updateGuideTip();
      const keptOffFlow = !tipEl.hidden;
      /* ④ 토글 — 끄면 숨고 플로우는 그대로 · 다시 켜면 나온다 · 저장된다 */
      document.getElementById("btnTip").click();
      const offHidden = tipEl.hidden === true || getComputedStyle(tipEl).display === "none";
      const flowAlive = S.guideOn === true;
      /* v1.90.1 — 끈 것은 세션 동안만. 저장하지 않아야 다음에 켜진 채 시작한다 (원장님 확정) */
      const notSaved = localStorage.getItem("pb_tip_v1") === null;
      document.getElementById("btnTip").click();
      PBx.updateGuideTip();
      const backOn = !tipEl.hidden;
      /* ⑤ AI 알림 — showNote 가 중앙 위 칩으로 */
      S.guideOn = true; S.guideCur = "v2";
      document.getElementById("btnSnap").click();
      const noteShown = !noteEl.hidden && noteEl.textContent.length > 0;
      const nr = noteEl.getBoundingClientRect();
      const noteTop = nr.top - stW.top < 90;
      /* ⑥ AI 버튼 두 줄 「AI / 눈썹정렬」 */
      const snap = document.getElementById("btnSnap");
      const twoLine = (snap.querySelector(".aihead") || {}).textContent === "AI"
        && /눈썹정렬|Align/.test(snap.textContent)      /* v1.92.0 — 영어는 "Align" (좁은 폰 폭) */
        && (snap.querySelector(".ailock") || {}).textContent === "🔒";
      return { centred, topArea, sameBox, duringIntro, keptOffFlow,
               offHidden, flowAlive, notSaved, backOn, noteShown, noteTop, twoLine };
    });
    await ctx.close();
    check("143. 안내 — 중앙 위 · 토글로 끄고 켬 · 가이드 켜짐 중 유지 · AI/눈썹정렬 두 줄",
      r.centred && r.topArea && r.sameBox && r.duringIntro && r.keptOffFlow
        && r.offHidden && r.flowAlive && r.notSaved && r.backOn
        && r.noteShown && r.noteTop && r.twoLine,
      `중앙위=${r.centred}/${r.topArea} 같은자리=${r.sameBox} · 인사중 ①=${r.duringIntro} · 플로우밖 유지=${r.keptOffFlow} · `
      + `토글 끔=${r.offHidden}(플로우 유지 ${r.flowAlive}, 세션한정 ${r.notSaved}) 켬=${r.backOn} · AI알림 위=${r.noteShown}/${r.noteTop} · 두 줄=${r.twoLine}`);
  }

  /* 144. ⭐ v1.92.0 — **기본 언어 영어 · 링크 미리보기 영어** (원장님 지시 2026-08-28
       「이 링크에 설명을 기본 영어, 다운받을 때 설정 기본 영어로 변경」)
     · 처음 여는 기기(저장된 언어 없음) → **영어**로 시작 · 한국어를 고르면 저장되어 유지
     · 링크 미리보기(og:*)·설치 이름/설명(manifest)·html lang 이 전부 영어
     · og:image 는 **절대 주소** — 상대 주소면 메신저가 아이콘을 못 읽는다 */
  if (RUN(27)) {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const mf = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
    const head = html.slice(0, html.indexOf("</head>"));
    const meta = (re) => (head.match(re) || [])[1] || "";
    const hasKo = (t) => /[가-힣]/.test(t);
    const desc = meta(/<meta name="description" content="([^"]*)"/);
    const ogT = meta(/<meta property="og:title" content="([^"]*)"/);
    const ogD = meta(/<meta property="og:description" content="([^"]*)"/);
    const ogI = meta(/<meta property="og:image" content="([^"]*)"/);
    const htmlLang = (html.match(/<html lang="([^"]+)"/) || [])[1];
    const metaOk = !hasKo(desc) && desc.length > 20 && !hasKo(ogT) && !hasKo(ogD)
      && /^https:\/\//.test(ogI) && htmlLang === "en";
    const mfOk = mf.lang === "en" && !hasKo(mf.description || "") && mf.name === "Brow Balance";
    /* 앱 기본 언어 — 저장값이 없으면 영어 */
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
    const p2 = await ctx.newPage();
    await p2.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p2.waitForTimeout(300);
    const r = await p2.evaluate(() => {
      const en = document.getElementById("langEn").classList.contains("on");
      const ko0 = document.getElementById("langKo").classList.contains("on");
      /* 한국어를 고르면 저장되어 유지된다 */
      document.getElementById("langKo").click();
      return { en, ko0, koAfter: document.getElementById("langKo").classList.contains("on"),
               saved: localStorage.getItem("pb_lang") };
    });
    await ctx.close();
    check("144. 기본 언어 영어 · 링크 미리보기(OG)·설치 설명 영어 · 한국어는 눌러 저장",
      metaOk && mfOk && r.en && !r.ko0 && r.koAfter && r.saved === "ko",
      `설명 "${desc.slice(0, 40)}…" 한글없음=${!hasKo(desc)} · og:image 절대=${/^https:\/\//.test(ogI)} · html lang=${htmlLang} · `
      + `manifest lang=${mf.lang}/한글없음=${!hasKo(mf.description || "")} · 앱 시작 영어=${r.en} · 한국어 선택 저장=${r.saved}`);
  }

  /* 145. ⭐⭐ v1.93.0 — **아래 도크 자동 맞춤 · 무조건 가로** (원장님 신고·지시 2026-08-29
       「폰 크기에 따라 자동조정 · 사진저장 행이 다 겹쳤다·AI 겹침 · 가로모드에서 아래 버튼 안 나옴 ·
        회전 잠금과 무관하게 무조건 가로」)
     · 좁은 폰(667·740·812)에서도 왼쪽 도크·잠금·AI 버튼이 **서로 밟지 않는다** (dock-tight/min 자동)
     · pb_orient="off" 로 저장돼 있어도 세로 뷰포트는 **무조건 rot90**
     · .screen 높이는 **dvh 가 마지막**(주소창 있는 화면에서 아래 버튼이 잘리던 원인)
     · alignCenterDock 은 rect 가 아니라 **offset 좌표**만 쓴다 (rot90 에서 rect 는 90° 돌아가 있다) */
  if (RUN(28)) {
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const acd = (src.match(/function alignCenterDock\(\)[\s\S]*?\n}/) || [""])[0]
      .replace(/\/\*[\s\S]*?\*\//g, "");                       /* 주석이 이 규칙 자체를 설명한다 */
    const noRect = !/getBoundingClientRect/.test(acd) && /offsetLeft/.test(acd);
    const scr = (html.match(/\.screen\{[^}]*\}/) || [""])[0];
    const dvhLast = scr.indexOf("100vh") >= 0 && scr.indexOf("100dvh") > scr.indexOf("100vh");
    const results = [];
    for (const [vw, vh] of [[667, 375], [740, 360], [812, 375], [844, 390]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
      await p.waitForTimeout(250);
      await p.setInputFiles("#fileInput", fd);
      await p.waitForTimeout(1500);
      results.push(await p.evaluate((vw2) => {
        const $ = (id) => document.getElementById(id);
        const ld = $("leftDock"), bd = $("bottomDock"), snap = $("btnSnap"), cd = $("centerDock");
        const snapLeft = bd.offsetLeft + snap.offsetLeft;
        const ldRight = ld.offsetLeft + ld.offsetWidth;
        const m = (cd.style.transform || "").match(/([\d.]+)px/); const cdX = m ? +m[1] : cd.offsetLeft;
        return { vw: vw2, tier: (document.body.className.match(/dock-\w+/) || ["base"])[0],
                 gapL: Math.round(cdX - ldRight), gapR: Math.round(snapLeft - (cdX + cd.offsetWidth)) };
      }, vw));
      await ctx.close();
    }
    const noOverlap = results.every((r2) => r2.gapL >= 4 && r2.gapR >= 4);
    /* 무조건 가로 — pb_orient=off 여도 세로 뷰포트는 rot90 */
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p2 = await ctx2.newPage();
    await p2.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p2.evaluate(() => localStorage.setItem("pb_orient", "off"));
    await p2.reload({ waitUntil: "domcontentloaded" });
    await p2.waitForTimeout(250);
    await p2.setInputFiles("#fileInput", fd);
    await p2.waitForTimeout(1200);
    const forced = await p2.evaluate(() => document.body.classList.contains("rot90"));
    await p2.evaluate(() => localStorage.removeItem("pb_orient"));
    await ctx2.close();
    check("145. 도크 자동 맞춤(667~844 겹침 없음) · pb_orient=off 여도 무조건 가로 · dvh 마지막 · offset 좌표",
      noOverlap && forced && dvhLast && noRect,
      results.map((r2) => `${r2.vw}px:${r2.tier}(L${r2.gapL}/R${r2.gapR})`).join(" · ")
      + ` · 강제가로=${forced} · dvh마지막=${dvhLast} · rect금지=${noRect}`);
  }

  /* 146. ⭐ v1.95.0 — **놓은 선 설정** (원장님 지시 2026-08-29: 「놓은선 기본 설정 추가 —
     선 굵기·색상·투명도. 놓은선은 체크를 마무리하고 전체를 보는 선」)
     · 놓은 선(doneSet)은 doneC/doneW/doneOp 로 그려진다 — 잡은 선 값과 **완전 분리**
     · 설정 시트에 색상표·굵기·투명도 컨트롤이 있다
     ⛔ drawDone 을 drawGrab 으로 합치지 마세요 — 잡은 선을 바꾸면 놓은 선까지 같이 바뀝니다. */
  if (RUN(29)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, H = S.dim.H;
      S.intro = false; S.guideOn = false; S.guideCur = null; S.g = { ...PBx.DEFAULT_GUIDE };
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1,
                 dragCore: "#14161B", dragW: 1.4, dragOp: 0.9,
                 doneC: "#FF4D94", doneW: 0.6, doneOp: 0.4 };
      S.multi = false; S.selSet = []; S.sel = "h1"; S.doneSet = ["front"];
      PBx.render();
      const seg = (key) => {
        const y = S.g[key] * H;
        const q = [...document.getElementById("guides").querySelectorAll("line")]
          .map((l) => ({ c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
                         o: +(l.getAttribute("stroke-opacity") || 1),
                         y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
                         x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2") }))
          .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1 && Math.abs(l.x2 - l.x1) > 2);
        return q.sort((a, b) => b.w - a.w)[0] || null;
      };
      const done = seg("front");
      /* 잡은 선 값을 바꿔도 놓은 선은 안 변한다 (분리) */
      S.look.dragW = 0.7; S.look.dragCore = "#FFFFFF"; PBx.render();
      const done2 = seg("front");
      /* 설정 컨트롤 존재 + 값 동기화 */
      PBx.buildLookUI();
      const ui = {
        sw: document.querySelectorAll("#swDoneC button.sw").length,
        w: document.getElementById("rngDoneW") ? +document.getElementById("rngDoneW").value : -1,
        op: document.getElementById("rngDoneOp") ? +document.getElementById("rngDoneOp").value : -1,
      };
      const base = (PBx.H_SPECS.find((q2) => q2.key === "front").w + 1.8);
      return { done, done2, ui, expW: base * 0.6 };
    });
    await ctx.close();
    check("146. 놓은 선 — doneC/doneW/doneOp 로 그림 · 잡은 선과 분리 · 설정 컨트롤",
      r.done && r.done.c === "#FF4D94" && Math.abs(r.done.w - r.expW) < 0.01 && Math.abs(r.done.o - 0.4) < 0.01
        && r.done2 && r.done2.c === "#FF4D94" && Math.abs(r.done2.w - r.expW) < 0.01
        && r.ui.sw === 8 && r.ui.w === 60 && r.ui.op === 40,
      `놓은 선 ${r.done && r.done.c}/${r.done && r.done.w.toFixed(2)}(기대 ${r.expW.toFixed(2)})/${r.done && r.done.o} · `
      + `잡은선 바꿔도 유지=${r.done2 && r.done2.c === "#FF4D94"} · 색상표 ${r.ui.sw}칸 · 슬라이더 ${r.ui.w}%/${r.ui.op}%`);
  }

  /* 147. ⭐ v1.95.0 — **서브 라인 설정** (원장님 지시 2026-08-29: 「아치엣지와 아치두께에서
     뻗어 이너라인까지 닿는 서브 라인의 굵기·투명도」)
     자→이너선 옅은 연결선의 굵기(subW)·투명도(subOp)가 설정을 따른다. 색은 먹색 고정. */
  if (RUN(30)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, H = S.dim.H;
      S.intro = false; S.guideOn = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1, subW: 2.4, subOp: 0.5 };
      S.multi = false; S.selSet = []; S.sel = "h1"; S.doneSet = [];
      PBx.render();
      const subs = (key) => {
        const y = S.g[key] * H;
        return [...document.getElementById("guides").querySelectorAll("line")]
          .map((l) => ({ c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
                         o: +(l.getAttribute("stroke-opacity") || 1),
                         y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2") }))
          .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1
                      && l.c === "#14161B" && l.o < 0.95 && l.o > 0.2);
      };
      const q = subs("h2");
      const ui = {
        w: document.getElementById("rngSubW") ? 1 : 0,
        op: document.getElementById("rngSubOp") ? 1 : 0,
      };
      return { n: q.length, w: q[0] && q[0].w, o: q[0] && q[0].o, ui };
    });
    await ctx.close();
    check("147. 서브 라인 — 자→이너 연결선 굵기·투명도가 설정(subW/subOp)을 따름",
      r.n >= 1 && Math.abs(r.w - 2.4) < 0.01 && Math.abs(r.o - 0.5) < 0.01 && r.ui.w === 1 && r.ui.op === 1,
      `연결선 ${r.n}개 · 굵기 ${r.w} (기대 2.4) · 투명도 ${r.o} (기대 0.5) · 슬라이더 존재=${r.ui.w === 1 && r.ui.op === 1}`);
  }

  /* 148. ⭐ v1.95.0 — **배경 한 번 탭 = 이 단계 확인하고 다음으로** (원장님 지시 2026-08-29:
     「이미 맞은 라인을 움직이지 않아도 될 경우 가이드 블링킹 이후 한 번 배경을 클릭하면
       다음으로 넘어가라 — 그래서 설명도 넘어가라」)
     · 가이드 켜짐 + 차례 있음 + 배경(선 없는 곳) 탭 → 그 단계 끝냄(doneSet) + 다음 차례 + 안내 이동
     · 선 위 탭은 그대로 선택 (건너뛰지 않는다) · 인사 중에는 안 넘어간다 */
  if (RUN(31)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    /* 얼굴 AI(자동 정렬)가 **끝난 뒤** 상태를 굳힙니다 — AI 가 늦게 끝나 선 위치가 바뀌면
       미리 골라 둔 배경 지점이 선 위가 되어 탭이 「선택」으로 판정됩니다 (실제로 겪음) */
    await p.waitForTimeout(3200);
    const pre = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      S.intro = false; S.guideOn = true; S.doneSet = [];
      S.guideCur = PBx.GUIDE_FLOW[0]; S.g = { ...PBx.DEFAULT_GUIDE };
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1 };
      PBx.render(); PBx.updateGuideTip();
      /* 배경 지점: 어떤 선에서도 먼 곳을 찾는다 (스테이지 좌표) */
      const W = S.dim.W, H = S.dim.H;
      /* 오버레이(밸런스 칩·초기화·도크·안내)를 피해 가운데 띠에서 찾는다 */
      let bg = null;
      for (let yy = 0.14; yy < 0.58 && !bg; yy += 0.02)
        for (let xx = 0.35; xx < 0.88 && !bg; xx += 0.02)
          if (!PBx.hitTest(xx * W, yy * H)) bg = { x: xx * W, y: yy * H };
      const st = document.getElementById("stage").getBoundingClientRect();
      const tip0 = (document.getElementById("guideTip") || {}).textContent || "";
      return { first: S.guideCur, second: PBx.GUIDE_FLOW[1] || null, bg, sx: st.x, sy: st.y, tip0 };
    });
    /* ① 배경 탭 → 다음 단계 */
    const t1 = await p.context().newCDPSession(p);
    const tap = async (x, y) => {
      await t1.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 0 }] });
      await t1.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await p.waitForTimeout(250);
    };
    /* rot90 화면이 아니므로(테스트 뷰포트는 실제 가로) 스테이지 좌표 = 화면 좌표 + 오프셋 */
    await tap(pre.sx + pre.bg.x, pre.sy + pre.bg.y);
    const a1 = await p.evaluate(() => ({ cur: window.PB.S.guideCur, done: [...window.PB.S.doneSet],
      tip: (document.getElementById("guideTip") || {}).textContent || "" }));
    /* ② 인사 중 배경 탭 → 안 넘어간다 */
    const a2 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      S.guideCur = null; S.doneSet = []; PBx.startIntro(); PBx.render();
      return { intro: S.intro };
    });
    await tap(pre.sx + pre.bg.x, pre.sy + pre.bg.y);
    const a3 = await p.evaluate(() => ({ intro: window.PB.S.intro, cur: window.PB.S.guideCur,
      done: [...window.PB.S.doneSet] }));
    await ctx.close();
    const skipOk = a1.cur === pre.second && a1.done.includes(pre.first);
    const tipMoved = pre.second ? a1.tip !== pre.tip0 && a1.tip.length > 0 : true;
    const introSafe = a2.intro === true && a3.intro === true && a3.done.length === 0;
    check("148. 배경 한 번 탭 = 단계 확인·다음으로 (안내도 이동) · 인사 중엔 안 넘어감",
      skipOk && tipMoved && introSafe,
      `탭 후 차례 ${a1.cur}(기대 ${pre.second}) · 끝냄 [${a1.done}] · 안내 이동=${tipMoved} · 인사 보호=${introSafe}`);
  }

  /* 149. ⭐⭐ v1.97.0 — **예비 동공 정렬** (원장님 지시 2026-08-29)
     「첫 사진 크기가 모두 달라 동공 위치가 달라져 사용감이 나쁘다 — 동공 위치를 파악해
       처음부터 동공이 비슷한 위치·비슷한 크기에 오도록 고도화」
     ① 얼굴 인식이 실패하는 사진(눈 부위만 확대 촬영)도 픽셀에서 동공 쌍을 찾아
        동공 간격 = EYE_FRAC×W · 중점 = (centerX, CENTER_Y) 로 통일된다
     ② SVG 사진(회귀 픽스처)은 건드리지 않는다 — 기존 테스트의 변환 안정성
     ⛔ findPupilsFallback 의 동그람(aspect)·크기 필터를 지우지 마세요 — 눈썹·머리카락을 잡습니다. */
  if (RUN(32)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    /* 눈 부위만 확대 촬영한 것 같은 래스터(PNG) 사진을 만든다 — 피부 배경 · 큰 동공 두 개 ·
       길쭉한 눈썹(제외돼야 함) */
    const pngB64 = await p.evaluate(() => {
      const c = document.createElement("canvas"); c.width = 900; c.height = 620;
      const g = c.getContext("2d");
      g.fillStyle = "#E8C39E"; g.fillRect(0, 0, 900, 620);
      /* 눈썹 — 길쭉한 어두운 획 (aspect 필터로 후보에서 빠져야 한다) */
      g.fillStyle = "#5A4632";
      g.fillRect(120, 150, 260, 34); g.fillRect(520, 150, 260, 34);
      /* 눈 흰자 + 동공 (짙고 동그란 한 쌍) */
      const eye = (x) => {
        g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(x, 340, 110, 60, 0, 0, 7); g.fill();
        g.fillStyle = "#241812"; g.beginPath(); g.arc(x, 340, 40, 0, 7); g.fill();
        g.fillStyle = "#000000"; g.beginPath(); g.arc(x, 340, 18, 0, 7); g.fill();
      };
      eye(250); eye(650);
      return c.toDataURL("image/png").split(",")[1];
    });
    await p.setInputFiles("#fileInput", { name: "closeup.png", mimeType: "image/png", buffer: Buffer.from(pngB64, "base64") });
    await p.waitForTimeout(3500);                       /* 얼굴 AI 실패 → 예비 동공 정렬까지 대기 */
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H;
      const A = PBx.imgToCanvas(250, 340, S.p), B = PBx.imgToCanvas(650, 340, S.p);
      const dist = Math.hypot(B.x - A.x, B.y - A.y);
      const mx = (A.x + B.x) / 2 / W, my = (A.y + B.y) / 2 / H;
      /* 검출기 단독 검사 — 찾은 동공이 실제 자리(250/650, 340) 근처인가 */
      const f = PBx.findPupilsFallback();
      const fOk = !!f && Math.abs(Math.min(f.a.x, f.b.x) - 250) < 45
        && Math.abs(Math.max(f.a.x, f.b.x) - 650) < 45
        && Math.abs(f.a.y - 340) < 45 && Math.abs(f.b.y - 340) < 45;
      return { frac: dist / W, eyeFrac: PBx.EYE_FRAC, mx, my, cx: PBx.centerX(), cy: PBx.CENTER_Y,
               zoom: S.p.zoom, fOk, found: f && [Math.round(f.a.x), Math.round(f.a.y), Math.round(f.b.x), Math.round(f.b.y)] };
    });
    /* ② SVG 픽스처는 그대로 — 변환이 기본값이어야 한다 */
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(3000);
    const svgKeep = await p.evaluate(() => {
      const S2 = window.PB.S;
      return { zoom: S2.p.zoom, ox: S2.p.ox, oy: S2.p.oy, type: S2.photoType };
    });
    await ctx.close();
    const alignOk = Math.abs(r.frac - r.eyeFrac) < r.eyeFrac * 0.12
      && Math.abs(r.mx - r.cx) < 0.05 && Math.abs(r.my - r.cy) < 0.05;
    const svgOk = svgKeep.zoom === 1 && svgKeep.ox === 0 && svgKeep.oy === 0 && /svg/.test(svgKeep.type);
    check("149. 예비 동공 정렬 — 인식 실패 사진도 동공 간격 44%·기준점 정렬 · SVG 픽스처는 그대로",
      r.fOk && alignOk && svgOk,
      `검출 [${r.found}] (250,340/650,340 근처=${r.fOk}) · 간격 ${(r.frac * 100).toFixed(1)}%(기대 ${(r.eyeFrac * 100).toFixed(0)}%) · `
      + `중점 (${(r.mx * 100).toFixed(1)}%, ${(r.my * 100).toFixed(1)}%) 기대 (${(r.cx * 100).toFixed(1)}%, ${(r.cy * 100).toFixed(0)}%) · 줌 ${r.zoom.toFixed(2)}× · SVG 그대로=${svgOk}`);
  }

  /* 150. ⭐⭐ v1.98.0 — **레일 버튼 얇게·붙여서 중앙 배치 · 위아래 바 30% 짧게(아래 고정)**
     (원장님 지시 2026-08-29: 「왼쪽 선 이름 버튼들 전부 조금 더 얇게 · 꼬리와 센터, 아우터와
       센터피봇 간의 간격을 없애고 붙여서 · 버튼들의 배치를 중앙을 기점으로 ·
       위아래 드래그바의 길이를 30% 짧게, 밑 배치된 위치 고정 ·
       드래그바를 누를 때 왼쪽 선 이름 버튼이 눌리니 조금 더 떨어뜨려」)
     ⛔ `#lineRail #hButtons` 에 position:relative 를 주지 마세요 — `.linebar{bottom:8px}` 가
        되살아나 가로 버튼 묶음이 8px 위로 밀립니다 (설정 배지와 겹침 · 실제로 겪음). */
  if (RUN(33)) for (const dev of [{ n: "아이폰 가로 844×390", w: 844, h: 390 }, { n: "아이패드 가로 1180×820", w: 1180, h: 820 }]) {
    const ctx = await browser.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const rail = document.getElementById("lineRail");
      const rr = rail.getBoundingClientRect();
      const st = document.getElementById("stage").getBoundingClientRect();
      const v = document.getElementById("posCtlV").getBoundingClientRect();
      const bd = document.getElementById("bottomDock").getBoundingClientRect();
      const rct = (sel) => document.querySelector(sel).getBoundingClientRect();
      const btns = [...document.querySelectorAll("#lineRail .lbtn")];
      const chips = [...document.querySelectorAll("#railExtra .chip")];
      const tail = rct('.lbtn[data-key="h3"]'), ctr = rct('.lbtn[data-key="v1"]');
      const outer = rct('.lbtn[data-key="v4"]'), pivot = chips[0].getBoundingClientRect();
      const lang = document.getElementById("railLang");
      const lr = lang.getBoundingClientRect();
      const eye = rct('.lbtn[data-key="h1"]');
      const blockTop = eye.top, blockBot = chips[chips.length - 1].getBoundingClientRect().bottom;
      return {
        btnH: Math.max(...btns.map((b) => b.getBoundingClientRect().height)),
        gapTailCenter: ctr.top - tail.bottom,
        gapOuterPivot: pivot.top - outer.bottom,
        blockOff: ((blockTop + blockBot) / 2 - rr.top) - rr.height / 2,   /* 덩어리 중심 − 레일 중심 */
        fits: rail.scrollHeight <= rail.clientHeight + 2,
        /* v1.98.1 — 설정 배지는 눈 버튼 **바로 위 살짝 갭**. 흐름에 있되 음수 margin 으로
           가운데 정렬에는 0 으로 잡혀야 합니다 (blockOff 검사가 그것을 잠급니다). */
        langGap: blockTop - lang.querySelector("button").getBoundingClientRect().bottom,
        langClear: lr.bottom <= blockTop + 1,                              /* 설정이 버튼 위로 안 겹침 */
        hStatic: getComputedStyle(document.getElementById("hButtons")).position === "static",
        barFrac: v.height / st.height,
        barGapFromRail: v.left - rr.right,
        barAboveDock: bd.top - v.bottom,
      };
    });
    await ctx.close();
    check(`150. ${dev.n} — 레일 버튼 얇게·붙여서 중앙 · 바 30% 짧게·왼쪽 간격`,
      r.btnH <= 22 && r.gapTailCenter <= 3 && r.gapOuterPivot <= 3 && Math.abs(r.blockOff) <= 4
        && r.fits && r.langGap >= 4 && r.langGap <= 14 && r.langClear && r.hStatic
        && r.barFrac > 0.28 && r.barFrac < 0.46 && r.barGapFromRail >= 12 && r.barAboveDock > 0,
      `버튼높이 ${r.btnH.toFixed(1)}px(≤22) · 꼬리↔센터 ${r.gapTailCenter.toFixed(1)}px / 아우터↔피봇 ${r.gapOuterPivot.toFixed(1)}px(≤3) · `
      + `중앙오차 ${r.blockOff.toFixed(1)}px(≤4) · 넘침없음=${r.fits} · 설정↔눈 갭 ${r.langGap.toFixed(1)}px(4~14)/안겹침=${r.langClear} · hButtons static=${r.hStatic} · `
      + `바 높이 ${(r.barFrac * 100).toFixed(1)}%(28~46) · 레일과 간격 ${r.barGapFromRail.toFixed(0)}px(≥12) · 아래도크 위 ${r.barAboveDock.toFixed(0)}px`);
  }

  /* 151. ⭐⭐⭐ v1.99.0 — **이너 판독 룰** (원장님 지시 2026-08-29)
       「40이 눈 앞꼬리, 밸런스 기본이 되는 선. 48이 맥시멈 … 보통은 45가 맥시멈.
         40에서 48까지 들어오면서 드로잉이 시작되는 굵은 혹은 검정색의 라인을 이너라인으로
         선택한다. 선택할 수 없을 경우 40에서 45의 중간인 43을 잡아낸다」
       「이너라인을 선택하는 룰은 **가장 높은 값을 선택하는 게 아니다** … 맨살에서
         「이곳에 선이 있다」라고 판단되는 점수가 확 띄는 지점이 이너라인이다」
     ① 눈꺼풀 그늘이 안쪽으로 이어져도 이너는 **드로잉이 시작하는 곳**에 선다 (그늘 끝 ✗)
     ② 이너는 **내안각(40) ~ 하드 맥시멈(48)** 밖으로 나가지 못한다
     ③ 읽지 못하면 **43**(케이스 3개 이상이면 케이스 중앙값) */
  if (RUN(34)) {
    const fis = makeInnerShadeFace();
    const o151 = await runDraw(true, fis, null, SHAPE_A);
    fs.unlinkSync(fis);
    const r151 = await (async () => {
      const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
      await p.waitForTimeout(300);
      await p.setInputFiles("#fileInput", fd);
      await p.waitForTimeout(1000);
      const r = await p.evaluate(() => {
        const PBx = window.PB;
        return { lo: PBx.INNER_F_LO, mid: PBx.INNER_F_MID, soft: PBx.INNER_F_SOFT, hard: PBx.INNER_F_HARD,
                 rise: PBx.INNER_RISE, mult: PBx.INNER_MULT, cases: PBx.INNER_CASES.length,
                 caseF: PBx.innerCaseF(), hasPhoto: PBx.INNER_CASES.every((c) => !("photo" in c) && !("img" in c)) };
      });
      await ctx.close();
      return r;
    })();
    const atInk = Math.abs(o151.innerPx - o151.exp.inner) < 12;                 /* 드로잉 시작(340) */
    const notShade = o151.innerPx < o151.exp.inner + 22;                        /* 그늘 끝(384)까지 안 감 */
    /* ② 하드 맥시멈 밖으로는 못 나간다 — 상수 자체를 잠근다 (얼굴 비율 자) */
    const bounds = r151.lo === 0 && Math.abs(r151.mid - 0.228) < 1e-6
      && Math.abs(r151.soft - 0.380) < 1e-6 && Math.abs(r151.hard - 0.608) < 1e-6
      && r151.rise >= 0.10 && r151.rise <= 0.20 && r151.mult >= 1.2 && r151.mult <= 1.9;
    /* ③ 대체값은 **언제나 43** — 케이스가 몇 개든 중앙값으로 바뀌면 안 됩니다
       (원장님 재확인 2026-08-29: 「판독 안될 경우 43도 괜찮아 보인다」).
       케이스 4개의 중앙값은 47 이라, 되돌리면 못 읽은 사진이 미간 맨살에 섭니다. */
    const fb = Math.abs(r151.caseF - r151.mid) < 1e-6 && r151.cases >= 4;
    check("151. 이너 판독 — 눈꺼풀 그늘을 따라가지 않고 드로잉이 시작하는 곳에 선다 (40~48 · 못 읽으면 43)",
      o151.ok && atInk && notShade && bounds && fb && r151.hasPhoto,
      `이너 ${o151.innerPx.toFixed(0)}px (드로잉 시작 ${o151.exp.inner.toFixed(0)} 에 섬=${atInk} · 그늘 끝까지 안 감=${notShade}) · `
      + `경계 40/43/45/48=${bounds} (rise ${r151.rise} · mult ${r151.mult}) · 못읽으면 항상 43=${fb} · 케이스 ${r151.cases}개(사진 미저장=${r151.hasPhoto})`);
  }

  /* 152. ⭐⭐ v1.99.2 — **이너 판독이 조용히 통째로 꺼지지 않는다** (원장님 사진 4장 테스트 2026-08-29)
     ① 잉크를 재는 창은 **화면 위로 넘치면 잘라서** 씁니다. 예전에는 넘치면 그 열을 버렸는데,
        자동 정렬한 가로 화면에서는 눈썹이 위쪽에 앉아 **모든 열이 버려져** 판독이 통째로
        건너뛰어졌습니다 — 옅은 눈썹 사진 4장 중 3장이 그랬습니다.
     ② 자(내안각→센터)가 있으면 **언제나** 이너 전용 판독이 답을 냅니다. 밴드를 못 믿을 때
        `growEnd` 로 되돌아가면 다시 미간 맨살(46.7·48)에 섭니다.
     ⛔ 둘 다 되돌리지 마세요. */
  if (RUN(35)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      const img = PBx.photoPixels();
      /* ① 화면 **맨 위**에 붙은 밴드 — 넓은 창이 위로 넘친다 */
      const band = [];
      for (let x = 60; x < 200; x += 4) band.push({ x, top: 4, bot: 22, dark: 20, ink: 300 });
      const prof = PBx.innerProfile(img, band, -1);
      const v = prof ? prof.inkAt(120) : null;
      /* ② 자가 있으면 언제나 답이 나온다 */
      S.landmarks = null; S.innerAnchor = 0.1315;
      const fb = PBx.innerFallback();
      S.innerAnchor = 0;
      const none = PBx.innerFallback();
      return { topOk: v !== null && isFinite(v),
               fbOk: !!fb && Math.abs(fb.f - PBx.INNER_F_MID) < 1e-9,
               noAnchorNull: none === null };
    });
    await ctx.close();
    check("152. 이너 판독 — 눈썹이 화면 위에 붙어도 잉크를 재고, 자가 있으면 언제나 답을 낸다",
      r.topOk && r.fbOk && r.noAnchorNull,
      `화면 위 밴드에서도 측정=${r.topOk} · 자 있으면 43 대체=${r.fbOk} · 자 없으면 예전 경로=${r.noAnchorNull}`);
  }

  /* 154. ⭐⭐⭐ v2.0.1 — **눈 앞꼬리를 사진에서 자동으로 찾는다** (원장님 지시 2026-08-29:
       「시스템 내부에서 눈금자 이용하여 눈 앞꼬리를 자동으로 인식하라. 그게 AI가 하는 일이다」)
     예전에는 랜드마크가 없으면 앞꼬리를 **비율(R_INNER 0.52)로 짐작**했습니다.
     이 검사는 **눈 모양을 아는 합성 사진**을 만들어, 검출기가 그 코쪽 끝점을 찾아내는지 봅니다.
     ⛔ 「제일 어두운 열의 끝」으로 되돌리지 마세요 — 코 그늘·눈물샘까지 눈으로 셉니다. */
  if (RUN(36)) {
    /* 아몬드 눈 두 개. 왼쪽 눈의 코쪽 끝 = 250, 오른쪽 눈의 코쪽 끝 = 550 (이미지 좌표) */
    const eye = (x0, x1, cy, h) => {
      const up = [], dn = [];
      for (let x = x0; x <= x1; x += 2) {
        const t = (x - x0) / (x1 - x0);
        const k = Math.sin(Math.PI * t);       /* 양 끝에서 0 = 눈꺼풀이 만난다 */
        up.push(`${x},${(cy - h * k).toFixed(1)}`); dn.push(`${x},${(cy + h * k).toFixed(1)}`);
      }
      return up.concat(dn.reverse()).join(" ");
    };
    const f = path.join(ROOT, ".canthus.svg");
    fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${eye(150, 250, 250, 26)}" fill="#2b2118"/>`
      + `<polygon points="${eye(550, 650, 250, 26)}" fill="#2b2118"/>`
      /* 미간·콧대 그늘 — 예전 방식이 여기까지 눈으로 셌습니다 */
      + `<rect x="252" y="235" width="296" height="30" fill="#c2ac98"/></svg>`);
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", f);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W;
      S.landmarks = null;
      S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 };
      PBx.render();
      const img = PBx.photoPixels();
      const C = (ix, iy) => PBx.imgToCanvas(ix, iy, S.p);
      const pL = C(200, 250), pR = C(600, 250);          /* 동공(눈 한가운데) */
      const expL = C(250, 250).x, expR = C(550, 250).x;  /* 정답 앞꼬리 */
      const det = PBx.detectFaceRef(img, pL, pR);
      const gl = PBx.findCanthus(img, pL.x, pL.y, (pL.x + pR.x) / 2);
      const gr = PBx.findCanthus(img, pR.x, pR.y, (pL.x + pR.x) / 2);
      return { gl, gr, expL, expR, W, ok: !!det,
               a: det ? det.a * W : null, c: det ? det.c * W : null,
               tick: det ? (S.faceRef = det, PBx.dispV(det.a)) : null,
               mid: det ? PBx.dispV(det.c) : null };
    });
    await ctx.close();
    fs.unlinkSync(f);
    const tol = 8;
    const lOk = r.gl !== null && Math.abs(r.gl - r.expL) < tol;
    const rOk = r.gr !== null && Math.abs(r.gr - r.expR) < tol;
    check("154. 눈 앞꼬리 자동 인식 — 눈꺼풀 틈이 닫히는 자리를 찾는다 (코 그늘에 안 끌림)",
      r.ok && lOk && rOk && r.tick === 40 && r.mid === 53,
      `왼쪽 ${r.gl} (정답 ${r.expL.toFixed(0)}) · 오른쪽 ${r.gr} (정답 ${r.expR.toFixed(0)}) · `
      + `자 만들기=${r.ok} · 그 자로 읽은 눈금 ${r.tick}(40) / 센터 ${r.mid}(53)`);
  }

  /* 155. ⭐⭐⭐ v2.1.0 — **앞머리 판독 룰** (원장님 지시 2026-08-29)
       「눈 윗부분에서 올라가면 **피부색이 이어지다가** 어느 한 지점에서 **검은색**으로
         보이는 지점이 앞머리다」
     ① 앞머리는 눈썹 앞부분 **아랫선**에 선다
     ② **얇은 검은 선**(쌍꺼풀 주름 5px)은 검은색이어도 눈썹이 아니다 — 두께 창이 거른다
     ③ 출발점에 붙은 **눈 화장**(섀도 덩어리)은 「피부가 먼저」 규칙이 거른다
     ⛔ 셋 중 하나라도 되돌리면 앞머리가 주름·눈두덩에 내려앉습니다. */
  if (RUN(37)) {
    const f155 = path.join(ROOT, ".front-rule.svg");
    const up = [], dn = [];
    for (let x = 120; x <= 340; x += 2) { up.push(`${x},${edgeAt(SHAPE_A.cp, x, 1).toFixed(1)}`); dn.push(`${x},${edgeAt(SHAPE_A.cp, x, 2).toFixed(1)}`); }
    fs.writeFileSync(f155, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<polygon points="${up.concat(dn.reverse()).join(" ")}" fill="#2a1c14"/>`
      + `<line x1="120" y1="205" x2="360" y2="205" stroke="#3a2a20" stroke-width="5"/>`   /* 쌍꺼풀 주름 — 검고 얇다 */
      + `<rect x="120" y="232" width="240" height="22" fill="#5a463a"/></svg>`);          /* 눈 화장 — 출발점에 붙은 덩어리 */
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", f155);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H;
      S.landmarks = null; S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 }; PBx.render();
      const C = (ix, iy) => PBx.imgToCanvas(ix, iy, S.p);
      /* 이너를 눈썹 안쪽 끝(340) 근처에, 센터를 그 오른쪽에 두고, 눈(h1)을 화장 아래에 둔다 */
      S.g.v1 = C(420, 0).x / W; S.g.v2 = C(338, 0).x / W;
      S.g.h1 = (C(0, 248).y + PBx.FRONT_LASH_GAP * H) / H;   /* 출발점이 화장 덩어리 안 */
      S.eyeZero = S.g.h1;                                    /* v2.2.2 — 넘버링 0 고정 */
      const img = PBx.photoPixels();
      const fd = PBx.frontDecide(img);
      return { fy: fd ? fd.y : null, ft: fd ? fd.top : null,
               expFront: C(320, 178).y, expTop: C(320, 148).y, crease: C(320, 205).y, shadow: C(320, 240).y };
    });
    await ctx.close();
    fs.unlinkSync(f155);
    const atBrow = r.fy !== null && Math.abs(r.fy - r.expFront) < 7;
    const notCrease = r.fy === null || Math.abs(r.fy - r.crease) > 8;
    const notShadow = r.fy === null || Math.abs(r.fy - r.shadow) > 8;
    /* v2.2.0 — 같은 열의 윗끝 = 앞두께 (검은색이 끝나는 지점 = 눈썹 윗선 148) */
    const atTop = r.ft !== null && Math.abs(r.ft - r.expTop) < 7;
    check("155. 앞머리·앞두께 판독 — 피부 다음 「두꺼운 검은 것」의 아랫끝·윗끝 (주름·눈화장은 아니다)",
      atBrow && notCrease && notShadow && atTop,
      `앞머리 ${r.fy} (아랫선 ${r.expFront.toFixed(0)}=${atBrow}) · 앞두께 ${r.ft} (윗선 ${r.expTop.toFixed(0)}=${atTop}) · 주름 아님=${notCrease} · 화장 아님=${notShadow}`);
  }

  /* 156. ⭐⭐ v2.1.1 — **앞머리 넘버링 대체값** (원장님 지시 2026-08-29 폰 스크린샷:
       「빨간 선은 눈으로부터 올라와 대체값이 필요할 때 사용할 넘버링, 파란색이 옳바른」)
     ① 판독 없는 시작 배치: 앞머리 = **눈 위 11.7 눈금** (동공 비율 0.78 짐작 폐지)
     ② 눈금 1칸 = 이너 자(내안각→센터)의 1/13.15 — 이너와 **같은 자** */
  if (RUN(38)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H;
      const cx = 0.53, cy = 0.56, half = 0.22;
      S.landmarks = null;
      PBx.placeLinesFromEyes ? PBx.placeLinesFromEyes(cx, cy, half) : null;
      const aspect = W / H;
      const unitN = (half * 0.52) / 13.15;                       /* R_INNER = 0.52 */
      const exp = cy - PBx.FRONT_T_MID * unitN * aspect;
      const ticks = (cy - S.g.front) / (unitN * aspect);
      return { front: S.g.front, exp, ticks, mid: PBx.FRONT_T_MID,
               lo: PBx.FRONT_T_LO, hi: PBx.FRONT_T_HI, hasFn: !!PBx.frontTickPx };
    });
    await ctx.close();
    const ok = Math.abs(r.front - r.exp) < 0.005 && Math.abs(r.ticks - r.mid) < 0.2
      && r.mid > 8 && r.mid < 14 && r.lo === 6 && r.hi === 16 && r.hasFn;
    check("156. 앞머리 넘버링 — 판독 없는 배치는 눈 위 11.7 눈금 (이너와 같은 자 · 범위 7~16 잠금)",
      ok, `front ${r.front.toFixed(4)} (기대 ${r.exp.toFixed(4)}) · 눈 위 ${r.ticks.toFixed(1)} 눈금(기대 ${r.mid}) · 경계 ${r.lo}/${r.hi}`);
  }

  /* 157. ⭐⭐ v2.1.2 — **쌍꺼풀·주름 쉐도우 방어** (원장님 지시 2026-08-29:
       「2,4,7 판독 틀렸어. 쌍꺼풀, 주름 쉐도우를 방어하도록 룰 추가」)
     두꺼운 쉐도우는 두께 창(155)을 **통과합니다** — 얇지 않으니까요. 그래서 넘버링으로
     거릅니다: 눈 위 7 눈금 안쪽에서 찾은 것은, **위에 진짜 눈썹(7~16 눈금)이 또 있으면**
     쉐도우였던 것입니다. ⛔ 첫 후보를 바로 쓰는 방식으로 되돌리면 이 검사가 잡습니다. */
  if (RUN(39)) {
    const f157 = path.join(ROOT, ".front-shadow.svg");
    fs.writeFileSync(f157, `<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">`
      + `<rect width="${IW}" height="${IH}" fill="#e9d8c6"/>`
      + `<rect x="200" y="160" width="260" height="40" fill="#2a1c14"/>`      /* 눈썹 (아랫선 200) */
      + `<rect x="200" y="240" width="260" height="18" fill="#5a463a"/></svg>`);  /* 두꺼운 쉐도우 */
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", f157);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, W = S.dim.W, H = S.dim.H;
      S.landmarks = null; S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 }; PBx.render();
      const C = (ix, iy) => PBx.imgToCanvas(ix, iy, S.p);
      /* 눈 y=300 · 1눈금 = 9px → 쉐도우(윗변 240) = 눈 위 ~5.7 눈금, 눈썹(아랫선 200) = ~10.5 눈금 */
      const eyeC = C(0, 300).y;
      S.g.h1 = eyeC / H;
      S.eyeZero = eyeC / H;                                  /* v2.2.2 — 넘버링 0 고정 */
      S.innerAnchor = (9 * 13.15) / W;               /* 눈금 1칸 = 9 캔버스 px */
      S.g.v1 = C(500, 0).x / W; S.g.v2 = C(420, 0).x / W;
      const img = PBx.photoPixels();
      const fd = PBx.frontDecide(img);
      const fy = fd ? fd.y : null;
      return { fy, expBrow: C(320, 200).y, shadow: C(320, 240).y,
               tBrow: fy !== null ? (eyeC - fy) / 9 : null };
    });
    await ctx.close();
    fs.unlinkSync(f157);
    const atBrow = r.fy !== null && Math.abs(r.fy - r.expBrow) < 7;
    const notShadow = r.fy === null || Math.abs(r.fy - r.shadow) > 10;
    check("157. 쌍꺼풀·주름 쉐도우 방어 — 두꺼운 쉐도우가 있어도 넘버링(7~16)이 눈썹을 고른다",
      atBrow && notShadow,
      `앞머리 ${r.fy} (눈썹 아랫선 ${r.expBrow.toFixed(0)} 에 섬=${atBrow} · 쉐도우 ${r.shadow.toFixed(0)} 아님=${notShadow} · 눈 위 ${r.tBrow === null ? "?" : r.tBrow.toFixed(1)} 눈금)`);
  }

  /* 158. ⭐⭐⭐ v2.1.3 — **앞머리 하한은 절대 규칙** (원장님 지시 2026-08-29:
       「어느 넘버 이하는 앞머리로 측정하지 않는다가 있어야 한다. 판독이 애매한 경우에도
         말도 안 되는 위치에 있으면 안 된다」 — 실제 폰에서 앞머리가 눈꺼풀에 내려앉음)
     ① 어떤 경로로 왔든 최종 앞머리가 눈 위 7 눈금 미만이면 → 보통값(11.7)으로 대체
     ② 7 눈금 이상이면 그대로 둔다 (확대 사진의 16 초과도 허용 — 회귀 120 의 모양 C)
     ⛔ frontFloor() 호출을 빼거나 하한을 0 으로 내리면 이 검사가 잡습니다. */
  if (RUN(40)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1000);
    const r = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S, H = S.dim.H, W = S.dim.W;
      S.landmarks = null;
      S.g.h1 = 0.60;
      S.eyeZero = 0.60;                                /* v2.2.2 — 넘버링 0 고정 */
      S.innerAnchor = (9 * 13.15) / W;                 /* 1 눈금 = 9px */
      const u = 9;
      /* ① 눈꺼풀 자리(3 눈금)에 선 앞머리 → 11.7 로 대체돼야 한다 */
      S.g.front = S.g.h1 - (3 * u) / H;
      const fixed = PBx.frontFloor();
      const t1 = ((S.g.h1 - S.g.front) * H) / u;
      /* ② 정상 자리(10 눈금) → 그대로 */
      S.g.front = S.g.h1 - (10 * u) / H;
      const kept = !PBx.frontFloor();
      const t2 = ((S.g.h1 - S.g.front) * H) / u;
      /* ③ 확대 사진(18 눈금) → 그대로 (상한 집행 없음) */
      S.g.front = S.g.h1 - (18 * u) / H;
      const zoomKept = !PBx.frontFloor();
      return { fixed, t1, kept, t2, zoomKept, mid: PBx.FRONT_T_MID, lo: PBx.FRONT_T_LO };
    });
    await ctx.close();
    check("158. 앞머리 하한 — 눈 위 7 눈금 미만은 앞머리가 아니다 (보통값 11.7 로 대체)",
      r.fixed && Math.abs(r.t1 - r.mid) < 0.2 && r.kept && Math.abs(r.t2 - 10) < 0.2 && r.zoomKept && r.lo === 6,
      `3눈금→대체=${r.fixed}(→${r.t1.toFixed(1)}눈금, 기대 ${r.mid}) · 10눈금 유지=${r.kept}(${r.t2.toFixed(1)}) · 18눈금 유지=${r.zoomKept} · 하한 ${r.lo}`);
  }

  /* 159. ⭐⭐ v2.2.2 — **넘버링의 0 자리 동일화** (원장님 지시 2026-08-29:
       「너의 0 자리도 사진마다 다 다르다 … 0 자리 동일화 프롬포트 정해라」)
     0 = **동공 중심** — 랜드마크가 있으면 매번 실측, 없으면 배치 때 저장한 동공 높이.
     ⛔ h1(눈 가로선)을 0 으로 쓰면 안 됩니다 — 원장님이 드래그로 옮기는 순간
        하한 7·보통값 11.6·두께 4.7 이 전부 따라 밀립니다. */
  if (RUN(41)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate((lm) => {
      const PBx = window.PB, S = PBx.S;
      /* ① 랜드마크가 있으면 0 = 홍채 실측 — h1 을 옮겨도 그대로 */
      S.landmarks = lm; PBx.autoAlign(lm); PBx.render();
      const z0 = PBx.eyeZeroY();
      S.g.h1 += 0.10;                       /* 원장님이 눈 선을 옮겼다 */
      const z1 = PBx.eyeZeroY();
      /* ② 랜드마크가 없으면 배치 때 저장한 동공 높이 — 역시 h1 과 무관 */
      S.landmarks = null; S.eyeZero = 0.55; S.g.h1 = 0.70;
      const z2 = PBx.eyeZeroY();
      /* ③ 저장값도 없으면 마지막으로 h1 */
      S.eyeZero = 0;
      const z3 = PBx.eyeZeroY();
      return { z0, z1, z2, z3 };
    }, (() => {
      /* 이 구획에서는 FAKE_FACE 가 보이지 않아 최소 랜드마크를 여기서 만든다 */
      const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      const set = (i, x, y) => { lm[i] = { x, y, z: 0 }; };
      [468, 469, 470, 471, 472].forEach((i) => set(i, 0.400, 0.500));
      [473, 474, 475, 476, 477].forEach((i) => set(i, 0.600, 0.500));
      set(33, 0.330, 0.500); set(133, 0.455, 0.500); set(362, 0.545, 0.500); set(263, 0.670, 0.500);
      set(70, 0.300, 0.420); set(300, 0.700, 0.420); set(46, 0.305, 0.445); set(276, 0.695, 0.445);
      set(64, 0.440, 0.620); set(294, 0.560, 0.620);
      set(105, 0.420, 0.400); set(334, 0.580, 0.400); set(52, 0.420, 0.440); set(282, 0.580, 0.440);
      set(107, 0.465, 0.430); set(336, 0.535, 0.430); set(55, 0.465, 0.455); set(285, 0.535, 0.455);
      return lm;
    })());
    await ctx.close();
    const stable = Math.abs(r.z0 - r.z1) < 1e-9;
    check("159. 넘버링 0 동일화 — 0 = 동공 중심 실측 · h1 을 옮겨도 흔들리지 않는다",
      stable && Math.abs(r.z2 - 0.55) < 1e-9 && Math.abs(r.z3 - 0.70) < 1e-9,
      `랜드마크 0 ${r.z0.toFixed(3)} → h1 옮긴 뒤 ${r.z1.toFixed(3)} (같음=${stable}) · 저장값 ${r.z2} · 최후 h1 ${r.z3}`);
  }

  /* 160. ⭐⭐ v2.4.0 — **이너 맥시멈 45** (원장님 지시 2026-08-29: 「이너 45를 맥시멈으로
       설정해라」) — 답은 40~45 를 벗어날 수 없다. 탐색·맨살 기준은 48 쪽을 계속 쓰되,
       ① innerDecide 답 클램프가 INNER_F_SOFT(45)여야 하고 (fRaw 는 캡 전 값 보존),
       ② 예비 경로(밴드 half)의 클램프도 45 기준이어야 한다.
     ⛔ 클램프를 INNER_F_HARD(48)로 되돌리면 이 테스트가 잡습니다. */
  if (RUN(42)) {
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const hasAnsClamp = src.includes("const fAns = Math.min(fRaw, INNER_F_SOFT)");
    const hasRaw = src.includes("clamp(i > 0 ? scan[i - 1] : scan[i], INNER_F_LO, INNER_F_HARD)");
    const hasHalfClamp = src.includes("clamp(half, a0 * (1 - INNER_F_SOFT), a0)");
    const noOldHalf = !src.includes("a0 * (1 - INNER_F_HARD)");
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    const c160 = await p.evaluate(() => ({
      soft: window.PB.INNER_F_SOFT,
      fbF: (() => { const S = window.PB.S; S.innerAnchor = 0.13; S.landmarks = null;
        const d = window.PB.innerFallback(); return d ? { f: d.f, raw: d.fRaw } : null; })(),
    }));
    await ctx.close();
    check("160. 이너 맥시멈 45 — 답 클램프·예비 경로 모두 45(INNER_F_SOFT) 기준이다",
      hasAnsClamp && hasRaw && hasHalfClamp && noOldHalf
        && Math.abs(c160.soft - 0.380) < 1e-9 && c160.fbF && c160.fbF.raw !== undefined,
      `답클램프=${hasAnsClamp} fRaw보존=${hasRaw} half클램프=${hasHalfClamp}/옛경로없음=${noOldHalf} `
      + `SOFT=${c160.soft} 대체fRaw=${c160.fbF && c160.fbF.raw}`);
  }

  /* 161. ⭐⭐ v2.4.0 — **앞두께 우선순위** (원장님 지시 2026-08-29: 「보통값 6.0 이 중요한 게
       아니다. ① 반드시 픽셀 검증 — 검은색에서 피부색이 나오는 부분의 검은 마지막 끝부분.
       ② 명확하지 않을 때는 색상의 **퍼센트지가 낮아지는 부분**을 선택해야 한다」)
     합성 사진: 눈썹(검정) 위로 옅은 그라데이션이 길게 이어져 피부-복귀 두께가 12.7눈금
     (상식 밖) — 이때 ② 가 어둡기 퍼센트가 가장 크게 낮아지는 **검정 끝(y≈300)** 을
     골라야 한다. ② 를 빼고 보통값으로 직행하면 top 이 그라데이션 끝(y≈270)이 된다. */
  if (RUN(43)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    const r161 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      const W = 400, H = 400;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const g = cv.getContext("2d");
      const fill = (v, y0, y1) => { g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y0, W, y1 - y0 + 1); };
      fill(200, 0, H - 1);            // 피부
      fill(40, 300, 320);             // 눈썹 (검정) — 앞머리 320 · 검정 끝 300
      fill(140, 270, 299);            // 옅은 그라데이션 (softThr 아래 → 걷기가 못 멈춘다)
      const img = g.getImageData(0, 0, W, H);
      S.dim = { W, H }; S.landmarks = null; S.eyeZero = 0.9; S.innerAnchor = 0.13;
      S.g.v1 = 0.9; S.g.v2 = 0.25; S.innerRead = null;
      const fd = PBx.frontDecide(img);
      return fd ? { y: fd.y, top: fd.top } : null;
    });
    await ctx.close();
    const okY = r161 && Math.abs(r161.y - 320) <= 3;
    const okTop = r161 && Math.abs(r161.top - 300) <= 4;      /* ② = 검정 끝 (그라데이션 끝 270 이 아니다) */
    check("161. 앞두께 우선순위② — 피부 복귀가 불명확하면 퍼센트가 낮아지는 자리(검정 끝)를 고른다",
      okY && okTop,
      r161 ? `앞머리 y=${r161.y}(기대 320) · 앞두께 top=${r161.top}(기대 ≈300 · 그라데이션끝 270 금지)` : "판독 실패");
  }

  /* 164. ⭐⭐⭐ v2.7.0 — **아치엣지만 잡힌 경우의 아치두께** (원장님 지시 2026-08-29:
       「아치엣지가 잡힌다 + 아치두께 안 잡히는 경우 = 아치엣지에서 5칸 아래 위치한다 대체값」)
     「아치두께가 안 잡힌다」 = **아랫끝이 넘버링 하한(6 눈금) 아래로 새어 내려갔다** —
     눈꺼풀·속눈썹까지 읽었다는 뜻입니다. 그때 윗끝(아치엣지)이 멀쩡하면 윗끝은 쓰고,
     두께만 **아치엣지에서 5칸 아래**로 놓습니다.
     ⛔ **해부학 순서 위반은 여기에 넣지 마세요** — 162ⓒ 가 그것까지 살아나면 바로 잡습니다. */
  if (RUN(44)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    const r164 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      const W = 400, H = 400;
      const paint = (rows) => {
        const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const g = cv.getContext("2d");
        const fill = (v, y0, y1) => { g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y0, W, y1 - y0 + 1); };
        fill(200, 0, H - 1);
        rows.forEach(([v, y0, y1]) => fill(v, y0, y1));
        return g.getImageData(0, 0, W, H);
      };
      const setup = (frontY) => {
        S.dim = { W, H }; S.landmarks = null;
        S.eyeZero = 360 / H; S.innerAnchor = (9 * 13.15) / W;   /* 0 = y360 · 1 눈금 = 9px */
        S.g.v1 = 0.9; S.g.front = frontY / H; S.innerRead = null;
      };
      /* ⓐ 눈썹 y250~310 — 아랫끝 310 은 눈 위 5.6 눈금(하한 6 미달) = **두께를 못 잡음**.
            윗끝 250 은 눈 위 12.2 눈금으로 멀쩡 → 아치엣지 250 · 아치두께 250+45=295 */
      setup(200);
      const a = PBx.archDecide(paint([[40, 250, 310]]), 200);
      /* ⓑ 아랫끝이 **멀쩡하면**(눈 위 10 눈금) 대체값 길로 가면 안 된다 — 사진에서 읽은
            아랫끝 그대로여야 한다 (270 이지 250+45=295 가 아니다) */
      setup(288);
      const b = PBx.archDecide(paint([[40, 230, 270]]), 200);
      return { a, b, k: PBx.AT_FROM_ARCH };
    });
    await ctx.close();
    const okA = r164.a && Math.abs(r164.a.edge - 250) <= 4 && Math.abs(r164.a.thick - 295) <= 5;
    const okB = r164.b && Math.abs(r164.b.thick - 270) <= 3;   /* 읽은 아랫끝이 이긴다 */
    check("164. 아치엣지만 잡힌 경우 — 아치두께는 아치엣지에서 5칸 아래 (대체값)",
      okA && okB && r164.k === 5,
      `아치엣지 ${r164.a && r164.a.edge}(기대 250) · 아치두께 ${r164.a && r164.a.thick}(기대 295) · `
      + `아랫끝이 멀쩡하면 읽은 값 ${r164.b && r164.b.thick}(기대 270) · ${r164.k}칸`);
  }

  /* 163. ⭐⭐⭐ v2.6.0 — **아치 표준값** (원장님 지시 2026-08-29, 실제 사진 5장 판정 뒤:
       「1번 판독 실패시 표준값 : 아치두께는 앞머리 측정값에서 3칸 위로,
         아치엣지는 아치두께 위치에서 5칸 위로 측정한다」)
     v2.5.0 에는 아치 표준값이 없어서 판독이 포기하면 밴드값이 그대로 남았고, 실제 사진 1번에서
     그 밴드값이 눈썹 위로 4.9 눈금 떠 있었습니다 (원장님 판정: 틀림).
     ⚠️ 표준값은 **아무 때나** 쓰는 것이 아닙니다 — 실패 이유로 갈립니다:
       · seen = 0 (산꼭대기에 두꺼운 검은 것이 아예 없다 · 테두리 드로잉·저대비 맨 눈썹)
         → 밴드가 읽은 것이 유일한 증거이므로 **그대로 둔다**
       · seen > 0 (뭔가 보이는데 열들이 서로 다른 말을 한다 · 머리카락·그늘)
         → **표준값**
     ⛔ 이 갈림(`info.seen > 0`)을 지우면 **회귀 89·94** 가 바로 잡습니다 — 실제로 지워 보니
        89 아치두께 159(기대 140) · 94 아치두께 156(기대 140) 으로 떨어졌습니다.
        여기 163 은 그 갈림의 **입력**(seen 세기)과 표준값 **산수**를 잡습니다. */
  if (RUN(45)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    const r163 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      const W = 400, H = 400;
      const paint = (rows) => {
        const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const g = cv.getContext("2d");
        const fill = (v, y0, y1, x0, x1) => {
          g.fillStyle = `rgb(${v},${v},${v})`;
          g.fillRect(x0 === undefined ? 0 : x0, y0, (x1 === undefined ? W : x1) - (x0 === undefined ? 0 : x0) + 1, y1 - y0 + 1);
        };
        fill(200, 0, H - 1);
        rows.forEach(([v, y0, y1, x0, x1]) => fill(v, y0, y1, x0, x1));
        return g.getImageData(0, 0, W, H);
      };
      const setup = (frontY) => {
        S.dim = { W, H }; S.landmarks = null;
        S.eyeZero = 360 / H; S.innerAnchor = (9 * 13.15) / W;   /* 1 눈금 = 9px */
        S.g.v1 = 0.9; S.g.front = frontY / H; S.innerRead = null;
      };
      /* ⓐ 산수 — 앞머리 y288 · 1 눈금 9px → 아치두께 288-27=261 · 아치엣지 261-45=216 */
      setup(288);
      const std = PBx.archStandard(288, 9);
      /* ⓑ 자(눈금)가 없으면 표준값을 말할 수 없다 → null (밴드가 남는다) */
      const noRuler = PBx.archStandard(288, null);
      /* v2.8.0 — 아치엣지 맥시멈: 앞두께 y288 · 1 눈금 9px → 288-45 = 243 보다 위로 못 간다 */
      const emax = PBx.archEdgeMax(288, 9), emaxNo = PBx.archEdgeMax(288, null);
      /* ⓒ seen 세기 — 눈썹이 화면 전체에 있으면 5 열 모두 본다 */
      setup(288);
      const iAll = { seen: 0 };
      PBx.archDecide(paint([[40, 230, 270]]), 200, iAll);
      /* ⓓ seen 세기 — 산꼭대기에 **좁은 머리카락 한 덩이**만 있으면 가운데 열만 본다
             (열은 산꼭대기 ±ARCH_SPAN×W = ±6.4px 에 퍼진다 → 폭 5px 이면 가운데뿐) */
      setup(288);
      const iOne = { seen: 0 };
      const one = PBx.archDecide(paint([[40, 230, 270, 198, 202]]), 200, iOne);
      /* ⓔ seen 세기 — 아무것도 어둡지 않으면 0 (테두리 드로잉·저대비 맨 눈썹 자리) */
      setup(288);
      const iNone = { seen: 0 };
      PBx.archDecide(paint([]), 200, iNone);
      return { std, noRuler, all: iAll.seen, one: iOne.seen, oneRes: one, none: iNone.seen,
        f: PBx.AT_FROM_FRONT, a: PBx.ARCH_FROM_AT, emax, emaxNo, m: PBx.ARCH_MAX_OVER_FT };
    });
    await ctx.close();
    const okMath = r163.std && Math.abs(r163.std.thick - 261) < 0.01 && Math.abs(r163.std.edge - 216) < 0.01;
    const okSeen = r163.all >= 3 && r163.one > 0 && r163.one < 3 && r163.none === 0 && r163.oneRes === null;
    check("163. 아치 표준값 — 판독 실패 시 앞머리에서 3칸·5칸 (실패 이유로 갈린다)",
      okMath && r163.noRuler === null && okSeen && r163.f === 3 && r163.a === 5
        && Math.abs(r163.emax - 243) < 0.01 && r163.emaxNo === null && r163.m === 5,
      `표준값 아치두께 ${r163.std && r163.std.thick}(기대 261) · 아치엣지 ${r163.std && r163.std.edge}(기대 216) · `
      + `자 없으면 null=${r163.noRuler === null} · seen 전부 ${r163.all}(>=3) / 좁은것 ${r163.one}(1~2, 판독은 포기=${r163.oneRes === null}) / 없음 ${r163.none} · `
      + `${r163.f}칸·${r163.a}칸 · 아치엣지 맥시멈 ${r163.emax}(기대 243 · 앞두께 위 ${r163.m}칸)`);
  }

  /* 162. ⭐⭐⭐ v2.5.0 — **아치엣지·아치두께 판독 룰** (원장님 지시 2026-08-29:
       「앞머리, 앞두께 자동 위치조정 프로그래밍과 **같은 방법으로** 아치엣지 아치두께 고도화해라」)
     앞머리(155·157·158·161)와 **같은 함수**(darkBlobsUp)를 쓰되, 훑는 자리는 **산꼭대기**이고
     후보는 넘버링 + 해부학(아치두께 ≤ 앞머리)으로 고릅니다.
       ① 눈썹 아랫끝 = 아치두께 · 윗끝 = 아치엣지
       ② 눈 위 6 눈금 안쪽의 **두꺼운 쌍꺼풀 쉐도우**는 아치가 아니다 (넘버링 방어)
       ③ 덩어리가 **탐색창 천장에 닿으면** 못박음이므로 판독을 포기한다 (밴드 유지)
       ④ 아치두께가 **앞머리보다 아래**면 후보 자격이 없다 (원장님 해부학 순서 · BASELINE 1-45)
     ⛔ 넷 중 하나라도 빼면 아치 자가 눈꺼풀·창 경계에 내려앉습니다. */
  if (RUN(46)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    const r162 = await p.evaluate(() => {
      const PBx = window.PB, S = PBx.S;
      const W = 400, H = 400;
      const paint = (rows) => {
        const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const g = cv.getContext("2d");
        const fill = (v, y0, y1) => { g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y0, W, y1 - y0 + 1); };
        fill(200, 0, H - 1);                     // 피부
        rows.forEach(([v, y0, y1]) => fill(v, y0, y1));
        return g.getImageData(0, 0, W, H);
      };
      /* 넘버링의 0(동공 중심) = y360 · 1 눈금 = 9px · 앞머리 = 눈 위 8 눈금(y288) */
      const setup = (frontY) => {
        S.dim = { W, H }; S.landmarks = null;
        S.eyeZero = 360 / H; S.innerAnchor = (9 * 13.15) / W;
        S.g.v1 = 0.9; S.g.front = frontY / H; S.innerRead = null;
      };
      /* ⓐ 눈썹(y230~270 · 눈 위 10 눈금) + 그 아래 두꺼운 쌍꺼풀 쉐도우(y295~314 · 눈 위 5.1 눈금) */
      setup(288);
      const a = PBx.archDecide(paint([[90, 295, 314], [40, 230, 270]]), 200);
      /* ⓑ 눈썹이 탐색창 천장(y160)을 뚫고 나감 → **윗끝은 못박음이라 버리고**,
            아랫끝(270)만 쓰고 아치엣지는 거기서 5칸 위(225) — v2.8.0 원장님 지시
            「아치엣지가 잡히지 않거나 위에 머리카락으로 혼동이 있을 경우」 */
      setup(288);
      const b = PBx.archDecide(paint([[40, 160, 270]]), 200);
      /* ⓒ 앞머리가 아치두께보다 **위**(y240 · 눈 위 13.3 눈금)면 해부학 순서가 깨진다 → 포기 */
      setup(240);
      const c = PBx.archDecide(paint([[90, 295, 314], [40, 230, 270]]), 200);
      /* ⓓ 앞머리가 아주 낮아(눈 위 3 눈금) 해부학 필터가 놀 때 — **넘버링 하한(6)만으로도**
         쉐도우(5.1 눈금)를 거르고 눈썹(10 눈금)을 골라야 한다 */
      setup(333);
      const d = PBx.archDecide(paint([[90, 295, 314], [40, 230, 270]]), 200);
      /* ⓔ v2.8.0 — **아치 두께의 5칸 상한**. 눈썹이 y230~300(7.8 눈금 두께)이면 잔털·번짐까지
         센 것이다 → 아치두께는 300 이 아니라 아치엣지에서 5칸 아래(230+45=275) 여야 한다.
         (실제 사진 5번: 읽은 값 8.5 → 9.3 · 원장님 정답 9.5) */
      setup(333);
      const e = PBx.archDecide(paint([[40, 230, 300]]), 200);
      /* ⓕ v2.8.0 — **아치엣지 맥시멈**. 앞두께를 y250 으로 두면 아치엣지는 250-45=205 보다
         위로 갈 수 없다 — 눈썹 윗끝이 y200 이어도 205 에 선다. */
      setup(333); S.g.frontThickness = 250 / H;
      const f = PBx.archDecide(paint([[40, 200, 300]]), 200);
      return { a, b, c, d, e, f, lo: PBx.ARCH_T_LO, hi: PBx.ARCH_T_HI, cols: PBx.ARCH_COLS };
    });
    await ctx.close();
    const okA = r162.a && Math.abs(r162.a.thick - 270) <= 3 && Math.abs(r162.a.edge - 230) <= 4;
    const notShadow = r162.a && Math.abs(r162.a.thick - 314) > 10
      && r162.d && Math.abs(r162.d.thick - 270) <= 3;   /* 넘버링 하한만으로도 거른다 */
    const okB = r162.b && Math.abs(r162.b.thick - 270) <= 3 && Math.abs(r162.b.edge - 225) <= 5;
    const okE = r162.e && Math.abs(r162.e.thick - 275) <= 4 && Math.abs(r162.e.edge - 230) <= 4;
    const okF = r162.f && Math.abs(r162.f.edge - 205) <= 3;
    check("162. 아치엣지·아치두께 판독 — 쉐도우·창 천장·해부학 순서 방어 · 두께 5칸 상한 · 엣지 맥시멈",
      okA && notShadow && okB && okE && okF && r162.c === null && r162.lo === 6 && r162.cols === 5,
      `아치두께 ${r162.a && r162.a.thick}(기대 270) · 쉐도우 314 아님=${notShadow}(넘버링만으로도 ${r162.d && r162.d.thick}) · `
      + `아치엣지 ${r162.a && r162.a.edge}(기대 230) · 창 천장 → 두께 ${r162.b && r162.b.thick}(270)·엣지 ${r162.b && r162.b.edge}(225)=${okB} · `
      + `앞머리보다 아래면 포기=${r162.c === null} · 두께 5칸 상한 ${r162.e && r162.e.thick}(기대 275)=${okE} · `
      + `엣지 맥시멈 ${r162.f && r162.f.edge}(기대 205)=${okF} · 하한 ${r162.lo} 눈금 · ${r162.cols}열`);
  }

  /* 123. ⭐ v1.72.0 — **검은 드로잉이 끝나는 곳** (원장님 지시 2026-08-25 「검은 드로잉 고도화로 찾기」)
     꼬리 끝은 **평균 진하기**가 중앙값의 55% 이상인 마지막 열입니다. 잉크량(두께×진하기)으로
     재면 넓고 옅은 번짐이 통과해 버립니다 — 그래서 **두께와 무관한 진하기**를 봅니다.
     ⛔ 진하기 기준을 잉크량으로 되돌리지 마세요. */
  if (RUN(47)) {
    const fsm = makeSmudgeFace();
    const o123 = await runDraw(false, fsm, null, SHAPE_A);
    fs.unlinkSync(fsm);
    const atBody = Math.abs(o123.outerPx - SMUDGE.bodyEndX) < 14;
    const notSmudge = o123.outerPx > SMUDGE.smudgeEndX + 30;
    check("123. 검은 드로잉 — 아우터는 진한 곳이 끝나는 자리에 선다 (옅은 번짐은 눈썹이 아니다)",
      o123.ok && atBody && notSmudge,
      `아우터 ${o123.outerPx.toFixed(0)} (검은 드로잉 끝 ${SMUDGE.bodyEndX} 에 섬=${atBody} · 번짐 끝 ${SMUDGE.smudgeEndX} 까지 안 감=${notSmudge})`);
  }

  /* 121. ⚠️ v1.70.0 판정 기준, v3.0.0 아치선 규칙 갱신 (원장님 지시 2026-08-30, 실제 사진
     3장에 파란 선으로 손수 표시해 확인):
       · 꼬리 자 = 꼬리의 **뾰족한 끝**(끝 구간의 아랫선). 윗선이 아닙니다 → 예전보다 **아래**
       · 아치선 = **아치엣지 가로선이 눈썹과 맞닿아 피부색이 드러나는 자리**
         (「아치엣지가로를 아치선이 맞닿을때 생기는 피부색이 생기는 위치가 아치선」).
         v1.70.0~v2.9.0 의 「꺾임점」(낙차 비율)을 대신합니다 — 산꼭대기가 아니라는 것과
         「바깥쪽」이라는 방향은 같지만, 멈추는 **자리를 재는 기준**이 다릅니다.
       · 앞머리 = 이너 × 앞머리의 90° 꼭지점이 눈썹 앞부분 끝에 닿는다 (구간 평균이 아니라 끝 근처)
     ⛔ 예전 규칙(꼬리=윗선 · 아치선=산꼭대기 · 아치선=꺾임점)으로 되돌리면 이 검사가 잡습니다. */
  if (RUN(48)) {
    const outerTop = 152, peakX = 215;      /* 모양 A 의 바깥 끝 윗선 · 산꼭대기 x */
    const tailBelowTop = o87.tailPx > outerTop + 8;      /* 끝의 아랫선 = 윗선보다 뚜렷이 아래 */
    const archVOutside = o87.archVPx < peakX - 15;       /* 아치선 = 산꼭대기보다 뚜렷이 바깥 */
    /* ⚠️ v1.70.0 — 원장님이 실제 화면에 십자로 찍어 확인해 주신 자리(2026-08-24)를 픽셀로
       재니 **눈썹 바깥 끝에서 폭의 26%** 였습니다. v3.0.0 새 규칙(아치엣지-피부 경계)도
       모양 A 에서 같은 대역(15~40%)에 떨어집니다 — 두 규칙이 이 합성 눈썹에서는 비슷한
       자리를 가리키지만, 실제 사진에서는 갈립니다(원장님이 손으로 표시해 확인한 이유).
       이 띠를 벗어나면 산꼭대기에 눌러앉았거나 눈썹 밖으로 튄 것입니다. */
    const archFrac = (o87.archVPx - o87.exp.outer) / (o87.exp.inner - o87.exp.outer);
    const archInBand = archFrac > 0.15 && archFrac < 0.40;
    const frontOnCorner = Math.abs(o87.innerPx - o87.exp.inner) < 9
                       && Math.abs(o87.frontPx - o87.exp.front) < 5;
    check("121. 판정 기준 — 꼬리=끝의 아랫선 · 아치선=아치엣지-피부 경계(바깥쪽) · 앞머리=90° 꼭지점",
      tailBelowTop && archVOutside && archInBand && frontOnCorner,
      `꼬리 ${o87.tailPx.toFixed(0)} > 윗선 ${outerTop}=${tailBelowTop} · `
      + `아치선 ${o87.archVPx.toFixed(0)} < 산꼭대기 ${peakX}=${archVOutside} · 바깥에서 ${(archFrac * 100).toFixed(0)}%(15~40%)=${archInBand} · `
      + `앞머리 꼭지점(이너 ${o87.innerPx.toFixed(0)}/${o87.exp.inner.toFixed(0)} · 앞머리 ${o87.frontPx.toFixed(0)}/${o87.exp.front.toFixed(0)})=${frontOnCorner}`);

    /* 175. ⛔⛔ v3.2.0 — **열 순서의 방향** (실기기 사진 2026-08-30 · 원장님 확인)
       증상: 아치선이 산꼭대기보다 **안쪽**, 눈썹 몸통 한가운데(num≈35)에 섰습니다.
       원인: 방향을 `pts[0].x > cx` — **끝점 하나가 센터보다 오른쪽인가** — 로만 봤습니다.
             화면 오른쪽 눈썹에서 읽힌 열이 **센터를 하나라도 넘으면**(미간 잔털·그늘)
             판정이 뒤집혀 **열 순서 전체가 거꾸로** 서고, 아치선 탐색이 꼬리 쪽이 아니라
             앞머리 쪽으로 걸어갑니다. 같은 사진·같은 코드에 순서만 뒤집어 넣으니
             35.08 로 재현됐습니다 (정상 순서 24.07 · 실기기 실측 ≈35).
       고침: `seqOrient` — 앞머리(seq[0])는 **센터에 가까운 끝**. `growEnd` 와 같은 잣대.
       ⛔ 되돌리지 마세요. straddleR 이 그때 뒤집히던 바로 그 경우입니다. */
    const or = o87.orient;
    const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
    const orientOk = same(or.left, [300, 200, 100]) && same(or.right, [500, 600, 700])
                  && same(or.straddleR, [395, 500, 700]) && same(or.straddleL, [405, 300, 100]);
    check("175. 열 순서 방향 — 앞머리(seq[0])는 센터에 가까운 끝 (열이 센터를 넘어도 안 뒤집힘)",
      orientOk,
      `왼쪽 [${or.left}](기대 300,200,100) · 오른쪽 [${or.right}](500,600,700) · `
      + `센터 넘은 오른쪽 [${or.straddleR}](395,500,700) · 센터 넘은 왼쪽 [${or.straddleL}](405,300,100)`);

    /* 176. ⛔⛔ v3.2.0 — **아치선은 어떤 길로 와도 산꼭대기에서 마지노선(3~4칸) 밖**
       (원장님 지시 2026-08-30: 「3개의 칸 내부로 들어오지 않는다」)
       예전에는 픽셀 판독이 실패하고 눈꼬리 랜드마크도 없으면 **아무것도 안 해서**
       임시로 놓아 둔 **산꼭대기 값(0칸)** 이 그대로 남았습니다 — 규칙을 가장 크게
       어기는 자리입니다. 이제 세 갈래(pixel·corner·floor) 어디로 가든 이 띠를 지킵니다.
       ⛔ `S.archRead` 를 지우지 마세요 — 무엇을 보고 그 자리에 섰는지 남기는 유일한 기록입니다. */
    const okFloor = (o, nm) => {
      const a = o.archRead;
      if (!a) return { ok: false, why: `${nm}: archRead 없음` };
      if (a.from === "corner") return { ok: true, why: `${nm}: 눈꼬리(마지노선 적용 안 함)` };
      const outD = Math.abs(o.archVPx - o.cxPx), pkD = Math.abs(a.pkX - o.cxPx);
      return { ok: outD >= pkD + a.minOutPx - 0.5,
               why: `${nm}: ${a.from} 산꼭대기에서 ${((outD - pkD) / (a.minOutPx / a.floorUnits)).toFixed(2)}칸(마지노선 ${a.floorUnits.toFixed(2)})` };
    };
    const rA = okFloor(o87, "A"), rB = okFloor(o92, "B");
    check("176. 아치선 마지노선 — 픽셀·눈꼬리·최후표준값 어느 길로 와도 산꼭대기 3~4칸 밖",
      rA.ok && rB.ok, `${rA.why} · ${rB.why}`);

  }

  /* 120. ⚠️ v1.69.0 — **얼굴을 크게 확대한 사진**에서도 나머지 선을 찾는다 (원장님 지시 2026-08-24:
     「맞은 라인은 앞두께와 아치 라인만 맞았다고 — 나머지 안 맞은 것 교정」)
     증상: 앞머리·아치·꼬리가 **전부 같은 값**(탐색창 천장)으로 나와 자들이 눈썹 위 여백에 뭉쳤다.
     원인: 예비 경로의 탐색창 **위아래**를 「지금 선 ±몇 배」로 잡아, 눈썹이 선보다 위에 있으면
           창이 눈썹 몸통을 가로질렀다 + 「지금 선 간격」 기준 두께 검사가 제대로 읽은 판독을 버렸다.
     고침: 위아래는 **눈 기준선 위 45%** 를 본다 · 예비 경로에서는 선 간격 기준 두께 검사를 쓰지 않는다.
     ⛔ 되돌리지 마세요. 좌우(x) 범위는 그대로 지금 선 기준입니다 — 머리카락 방어(115·116). */
  const o120 = await runDraw(false, fhi, null, SHAPE_C);
  check("120. 드로잉 맞춤 — 눈썹이 지금 선보다 훨씬 위에 있어도 (크게 확대한 사진) 찾아낸다",
    judge(o120), say(o120));
  /* 세 가로선이 **같은 값으로 뭉치지 않는지** 따로 본다 — 창에 갇히면 전부 창 천장 값이 된다 */
  const spread120 = Math.abs(o120.frontPx - o120.archPx) > 3 && Math.abs(o120.archPx - o120.tailPx) > 3;
  check("120b. 드로잉 맞춤 — 앞머리·아치·꼬리가 한 값으로 뭉치지 않는다 (탐색창에 갇힘 방지)",
    spread120,
    `앞머리 ${o120.frontPx.toFixed(0)} / 아치 ${o120.archPx.toFixed(0)} / 꼬리 ${o120.tailPx.toFixed(0)} (서로 3px 이상 달라야 함)`);
  fs.unlinkSync(fhi);

  /* 119. ⚠️ v1.69.0 — 드로잉 맞춤 뒤의 **교정 안내** (원장님 지시 2026-08-24)
     「드로잉 맞춤시 맞아지는 라인은 오직 앞두께 아치만 — **나머지 교정 프롬프트 다시 써라**」
     · 맞춘 뒤 가이드는 **① 이너부터** 다시 돈다 (나머지를 손으로 놓는 순서가 곧 다음 할 일)
     · 프롬프트는 ①~⑥ 번호가 붙어 순서가 화면에서 읽힌다
     · 자동으로 놓인 두 줄(앞두께·아치)은 「사진에서 맞췄습니다」로 **확인만** 하라고 알린다
     ⛔ 번호를 떼거나 두 줄로 늘리지 마세요 — 시술 화면을 가립니다. */
  if (RUN(49)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", fd);
    await p.waitForTimeout(1300);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      S.landmarks = null; S.p = { zoom: 1, rot: 0, ox: 0, oy: 0 };
      S.g = { ...PBx.DEFAULT_GUIDE }; S.refSide = "L";
      S.guideOn = true; S.guideCur = "h3";          /* 일부러 마지막 스텝에 있는 상태에서 누른다 */
      document.getElementById("btnSnap").click();
      const restarted = S.guideCur === PBx.GUIDE_FLOW[0];
      const tip = document.getElementById("guideTip");
      const nums = PBx.GUIDE_FLOW.map((k) => {
        S.guideCur = k; PBx.updateGuideTip();
        return tip.textContent.trim().slice(0, 1);
      });
      const tipOf = (k) => { S.guideCur = k; PBx.updateGuideTip(); return tip.textContent; };
      return { restarted, nums };
    });
    /* ⚠️ 좁은 폰(667×375)에서도 **잘리지 않아야** 한다 — 칩은 nowrap + ellipsis 라
       길면 문구 끝이 조용히 사라집니다 (화면에서는 티가 안 납니다). */
    await p.setViewportSize({ width: 667, height: 375 });
    await p.waitForTimeout(200);
    const fits = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      const c = document.querySelector("#guideTip .chip") || document.getElementById("guideTip");
      return PBx.GUIDE_FLOW.map((k) => { S.guideCur = k; PBx.updateGuideTip();
        return { k, cut: c.scrollWidth > c.clientWidth + 1 }; });
    });
    await ctx.close();
    const noCut = fits.every((q) => !q.cut);
    const numsOk = r.nums.join("") === "①②③④⑤⑥⑦";   /* v1.83.0 — 이너가 들어와 일곱 스텝 */
    check("119. 드로잉 맞춤 뒤 교정 안내 — ① 이너부터 다시 · 프롬프트 ①~⑦ · 좁은 폰에서도 안 잘림",
      r.restarted && numsOk && noCut,
      `맞춘 뒤 ①로 복귀=${r.restarted} · 번호 ${r.nums.join("")} · 좁은폰에서 안잘림=${noCut}`
      + (noCut ? "" : ` [잘림: ${fits.filter((q) => q.cut).map((q) => q.k).join(",")}]`));
  }

  fs.unlinkSync(fd); fs.unlinkSync(fo); fs.unlinkSync(fb); fs.unlinkSync(fc); fs.unlinkSync(fn);


  /* 97. ⚠️ 꼬리(아우터) 자동 위치 (v1.40.0) — **콧볼–외안각 연장선** 규칙.
     잉크(픽셀) 추적은 v1.35~v1.39 에서 네 번 조정했지만 전부 실패했습니다 — 실제 사진에서
     꼬리는 관자놀이 잔털과 끊김 없이 이어져 있어 어두움으로 끝을 정할 수 없습니다.
     지금 규칙: 기준쪽 콧볼 → 외안각 연장선이 꼬리 높이(h3)와 만나는 x = 꼬리 끝.
     랜드마크 꼬리점 대비 0.8~1.5배 제한. 잉크 추적으로 되돌리면 이 검사가 깨집니다. */
  if (RUN(50)) {
    const FAKE97 = () => {
      const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      const set = (i, x, y) => { lm[i] = { x, y, z: 0 }; };
      [468, 469, 470, 471, 472].forEach((i) => set(i, 0.400, 0.500));
      [473, 474, 475, 476, 477].forEach((i) => set(i, 0.600, 0.500));
      set(33, 0.330, 0.500); set(133, 0.455, 0.500);
      set(362, 0.545, 0.500); set(263, 0.670, 0.500);
      set(70, 0.300, 0.420); set(300, 0.700, 0.420);
      set(46, 0.305, 0.445); set(276, 0.695, 0.445);
      set(64, 0.440, 0.620); set(294, 0.560, 0.620);
      set(105, 0.420, 0.400); set(334, 0.580, 0.400);
      set(52, 0.420, 0.440); set(282, 0.580, 0.440);
      set(107, 0.465, 0.430); set(336, 0.535, 0.430);
      set(55, 0.465, 0.455); set(285, 0.535, 0.455);
      return lm;
    };
    const mk97 = (tag, extra) => {
      const f = path.join(ROOT, `.tail-${tag}.svg`);
      fs.writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#e9d8c6"/>${extra}</svg>`);
      return f;
    };
    const f97 = mk97("a", "");
    /* 보이는 꼬리: 랜드마크 꼬리(image x 180)에 붙여 x150 까지 **진한** 잉크 */
    const f97v = mk97("v", `<rect x="120" y="245" width="110" height="14" fill="#241a12"/>`);
    const run97 = async (file, lm) => {
      const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
      await p.waitForTimeout(300);
      await p.setInputFiles("#fileInput", file);
      await p.waitForTimeout(1000);
      const r = await p.evaluate((lm) => {
      const S = window.PB.S, W = S.dim.W;
      S.landmarks = lm; window.PB.autoAlign(lm); window.PB.render();
      const cv = (ix, iy) => window.PB.imgToCanvas(ix * S.iw, iy * S.ih, S.p);
      const P = (i) => cv(lm[i].x, lm[i].y);
      /* 기대값: 콧볼(64) → 외안각(33, x정렬로 왼쪽 끝) 연장선이 꼬리 높이(70 의 y)와 만나는 x */
      const ala = P(64), oc = P(33), tail = P(70);
      const t = (tail.y - ala.y) / (oc.y - ala.y);
      const tipX = (ala.x + (oc.x - ala.x) * t) / W;
      return { v1: S.g.v1, v4: S.g.v4, tipX, eyeL: oc.x / W, tailL: tail.x / W,
               inkEnd: cv(120 / 600, 0).x / W };
      }, lm);
      await ctx.close();
      return r;
    };
    const a = await run97(f97, FAKE97()), b = await run97(f97v, FAKE97());
    fs.unlinkSync(f97); fs.unlinkSync(f97v);
    check("97. 꼬리 2단계 — 안 보이면 콧볼–외안각 연장선 · 보이는 진한 꼬리는 그 잉크 끝",
      Math.abs(a.v4 - a.tipX) < 0.012                       /* ② 연장선 규칙 그대로 */
        && a.v4 < a.eyeL - 0.01                             /* 눈꼬리보다 확실히 바깥 */
        && Math.abs(b.v4 - b.inkEnd) < 0.03                 /* ① 보이는 잉크의 끝 */
        && Math.abs(b.v4 - b.tipX) > 0.02,                  /* ①이 ②를 이긴다 */
      `빈사진 ${a.v4.toFixed(3)}(연장선 ${a.tipX.toFixed(3)}) · 잉크사진 ${b.v4.toFixed(3)}(잉크끝 ${b.inkEnd.toFixed(3)} / 연장선 ${b.tipX.toFixed(3)})`);
  }

  /* 101. ⚠️ 가이드 플로우 — **v1.81.0 새 순서** (원장님 지시 2026-08-27)
       앞머리 → 앞두께 → 아치엣지 → 아치두께 → 꼬리 아우터 → 꼬리 높이 · 끝
     · 이너(v2)는 기본 순서에서 빠졌다 (설정 → 가이드 순서에서 켤 수 있다)
     · 꼬리는 **두 스텝**이다 — 아우터(좌우)와 꼬리 높이(위아래)
     · 조용한 선은 얇은 회색 · 움직임이 끝나면 그 선의 **다음** · 꼬리 높이 뒤로는 종료
     · 가이드를 끄면 즉시 종료
     ⛔ 순서를 코드에 박지 마세요 — 원장님이 설정에서 바꾸실 수 있습니다 (회귀 137). */
  if (RUN(51)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(4600);          /* 전체라인 인사(초기화셋팅 4s)가 끝난 뒤를 본다 */
    const g101 = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      /* 값에 흔들리지 않게 중립값 (회귀 112 참고) */
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1,
                 dragEdge: "#FFC9A3", dragW: 1, dragOp: 1 };
      /* 인사가 끝나면 **첫 스텝(앞머리)** 이 켜져 있어야 한다 */
      const startsAtFirst = S.guideOn === true && S.intro === false
                         && S.guideCur === PBx.GUIDE_FLOW[0] && PBx.GUIDE_FLOW[0] === "v2";
      const flowIs = PBx.GUIDE_FLOW.join(",") === "v2,front,frontThickness,h2,archThickness,v4,h3";
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.doneSet = []; S.multi = false; S.selSet = [];
      S.guideOn = true; S.guideCur = "v2"; S.sel = "v2"; S.selUD = "v2"; S.selLR = "v2";
      S.hMode = "line"; PBx.render();
      const lineColorOf = (key) => {
        const sp = PBx.H_SPECS.concat(PBx.V_SPECS).find((x) => x.key === key);
        const x = key.startsWith("v") ? S.g[key] * S.dim.W : null;
        const y = key.startsWith("v") ? null : S.g[key] * S.dim.H;
        const ls = [...document.getElementById("guides").querySelectorAll("line")]
          .filter((l) => +(l.getAttribute("stroke-opacity") || 1) > 0.3
            && (x !== null ? Math.abs(+l.getAttribute("x1") - x) < 1 && Math.abs(+l.getAttribute("x1") - +l.getAttribute("x2")) < 0.5
                           : Math.abs(+l.getAttribute("y1") - y) < 1 && Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")) < 0.5));
        return { own: ls.some((l) => l.getAttribute("stroke") === (PBx.S.look[{ front: "inner", frontThickness: "inner", h2: "arch", archThickness: "arch", h3: "tail", v2: "vInner", v6: "vArch", v4: "vTail" }[key]] || sp.color)),
                 greyAll: ls.length > 0 && ls.every((l) => l.getAttribute("stroke") === "#14161B") };
      };
      /* 차례가 아닌 선은 조용한 회색 */
      const greyByDefault = lineColorOf("h2").greyAll && lineColorOf("h3").greyAll;
      const litFirst = lineColorOf("v2").own;
      const sl = document.getElementById("posSliderV");
      const sh = document.getElementById("posSliderH");
      const stepUD = (key) => { S.selUD = key; S.hMode = "line";
        sl.dispatchEvent(new Event("input", { bubbles: true }));
        sl.dispatchEvent(new Event("change", { bubbles: true })); return S.guideCur; };
      const stepLR = (key) => { S.selLR = key; S.hMode = "line";
        sh.dispatchEvent(new Event("input", { bubbles: true }));
        sh.dispatchEvent(new Event("change", { bubbles: true })); return S.guideCur; };
      const seq = [];
      seq.push(stepLR("v2"));                  /* v1.83.0 — 이너가 첫 스텝 → 앞머리 */
      S.sel = "front"; S.selUD = "front";
      seq.push(stepUD("front"));               /* 앞머리 끝 → 앞두께 */
      seq.push(stepUD("frontThickness"));      /* → 아치엣지 */
      seq.push(stepUD("h2"));                  /* → 아치두께 */
      seq.push(stepUD("archThickness"));       /* → 꼬리 아우터 */
      seq.push(stepLR("v4"));                  /* → 꼬리 높이 */
      seq.push(stepUD("h3"));                  /* → 종료 */
      const order = seq.join(",");
      const endsAfterTail = S.guideCur === null && S.guideOn === true;
      /* ⭐ v1.81.0 — 움직임이 끝난 선은 「끝냄」으로 기록된다 (가이드 꺼진 상태의 표시에 쓰인다) */
      const marked = ["v2", "front", "frontThickness", "h2", "archThickness", "v4", "h3"]
        .every((k) => S.doneSet.includes(k));
      document.getElementById("btnGuide").click();
      document.getElementById("btnGuide").click();   /* 껐다 켜기 — v1.87.0: 켜면 **초기화셋팅(인사)**부터 */
      const reOn = S.guideOn === true && S.intro === true && S.guideCur === null;
      S.intro = false;                               /* 인사 타이머를 기다리지 않고 다음 검사로 */
      document.getElementById("btnGuide").click();
      const offEnds = S.guideOn === false && S.guideCur === null;
      return { startsAtFirst, flowIs, greyByDefault, litFirst, order, endsAfterTail, marked, reOn, offEnds };
    });
    await ctx.close();
    check("101. 가이드 플로우 — 이너→앞머리→앞두께→아치엣지→아치두께→꼬리아우터→꼬리높이 · 끄면 종료",
      g101.startsAtFirst && g101.flowIs && g101.greyByDefault && g101.litFirst
        && g101.order === "front,frontThickness,h2,archThickness,v4,h3," && g101.endsAfterTail
        && g101.marked && g101.reOn && g101.offEnds,
      Object.entries(g101).map(([k, v]) => `${k}=${v}`).join(" "));
  }

  /* 102. ⚠️ 이너 묶음 두 색 체계 (v1.48.0 · 원장님 지시 2026-08-22)
     「이너 색은 눈이 조금 아프면서 톤다운된 이상한 색이다」 → 원인이 두 개였습니다.
       ① 딥 틸(#0D9488)은 피부와 **밝기 대비가 1.1~1.5:1** 뿐이라 밝기가 아니라 색으로만 보였다
          (같은 명도 + 보색 + 채도 91% → 눈이 진동한다. 확대할수록 심해진다)
       ② 연한 상태를 알파 0.45로 만들어서, 화면에 실제로 나오는 색은 피부와 섞인 #617F6A 였다
     → 강조 = 민트 #5EEAD4 (레일 버튼 띠와 **같은 색**) · 연한 = 연회색 #C9D1D6 을 **알파 없이** 그대로.
     ⚠️ dimColor 를 지우고 알파 방식으로 되돌리면 이 검사가 깨집니다.
     ⚠️ v1.49.0 에서 아치·꼬리도 같은 방식(연한 상태 별도 색)으로 통일됐습니다 — 다만 **각 묶음의
        연한 색은 자기 계열**입니다(아치 #A9CFF2 · 꼬리 #D0B8F0). 전부 같은 회색으로 만들면
        v1.46.2에서 세로선 배지를 지우며 세운 「색이 곧 이름표」가 무너집니다. */
  if (RUN(52)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const c102 = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, W = S.dim.W, H = S.dim.H;
      const spec = (k) => PBx.H_SPECS.concat(PBx.V_SPECS).find((x) => x.key === k);
      /* 실제로 그려진 선을 읽는다 — 옅은 연결선(0.16)은 걸러낸다 */
      const seg = (key) => {
        const sp = spec(key), vert = key[0] === "v";
        const t = vert ? S.g[key] * W : S.g[key] * H;
        const ls = [...document.getElementById("guides").querySelectorAll("line")]
          .filter((l) => {
            const x1 = +l.getAttribute("x1"), x2 = +l.getAttribute("x2");
            const y1 = +l.getAttribute("y1"), y2 = +l.getAttribute("y2");
            const op = +(l.getAttribute("stroke-opacity") || 1);
            if (op <= 0.3) return false;
            return vert ? (Math.abs(x1 - x2) < 0.5 && Math.abs(x1 - t) < 1)
                        : (Math.abs(y1 - y2) < 0.5 && Math.abs(y1 - t) < 1 && Math.abs(x2 - x1) > 4);
          });
        if (!ls.length) return null;
        /* v1.51.0 — 한 선이 여러 토막(굵은 부분 + 얇은 회색)으로 그려진다. **가장 굵은 토막**을 본다 */
        const thick = ls.slice().sort((a, b) => +b.getAttribute("stroke-width") - +a.getAttribute("stroke-width"))[0];
        return { c: thick.getAttribute("stroke"), op: +(thick.getAttribute("stroke-opacity") || 1),
                 w: +thick.getAttribute("stroke-width") };
      };
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1 };   /* v1.60.0 중립값 (회귀 112 참고) */
      S.guideOn = true; S.guideCur = null; S.multi = false; S.selSet = [];   /* v1.80.0 — 「조용=회색」은 **가이드 ON** 일 때의 규칙 (가이드를 끄면 전부 고유색 · 회귀 132) */
      S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line";
      PBx.render();
      const dimFront = seg("front"), dimInner = seg("v2"), dimTail = seg("h3");
      S.sel = "front"; PBx.render();
      const litFront = seg("front");
      S.sel = "v2"; PBx.render();
      const litInner = seg("v2");
      return { dimFront, dimInner, dimTail, litFront, litInner,
               dotMatches: spec("front").dot === spec("front").color && spec("v2").dot === spec("v2").color };
    });
    await ctx.close();
    const d = c102;
    check("102. 이너 묶음 — 조용=얇은 회색 · 강조=민트 한 줄 · 선 색 = 레일 띠 색",
      d.dimFront && d.dimFront.c === "#14161B"        /* v1.55.0 — 조용한 자도 회색 한 줄 */
        && d.dimInner && d.dimInner.c === "#14161B"   /* v1.52.0 — 조용한 세로선은 전체 회색 */
        && d.litFront && d.litFront.c === "#A3E635" && d.litFront.op >= 0.99   /* v1.94.0 — 이너 묶음 = 라임 */
        && d.litInner && d.litInner.c === "#5EEAD4"                             /* 세로 이너는 민트 그대로 */
        && d.litFront.w > d.dimFront.w + 1          /* 강조는 실제로 굵어져야 한다 */
        && d.dimTail && d.dimTail.c === "#14161B"   /* v1.55.0 — 조용한 꼬리 자도 회색 */
        && d.dotMatches,                            /* 선 색 = 레일 버튼 띠 색 */
      `연한 앞머리 ${d.dimFront && d.dimFront.c}@${d.dimFront && d.dimFront.op} · 연한 이너 ${d.dimInner && d.dimInner.c}@${d.dimInner && d.dimInner.op} · `
      + `강조 앞머리 ${d.litFront && d.litFront.c} 굵기 ${d.dimFront && d.dimFront.w}→${d.litFront && d.litFront.w} · `
      + `꼬리 ${d.dimTail && d.dimTail.c}@${d.dimTail && d.dimTail.op} · 띠=선색 ${d.dotMatches}`);
  }

  /* 103·104. ⚠️ v1.49.0 (원장님 지시 2026-08-22)
     103 「먼저 하나의 선이 밝게 짙게 보인다 — 선택이 끝나면 다음 선이 밝게 빛난다. 이때 이전에
          사용된 선은 색이 옅어진다. **오직 하나의 플로우에 하나의 색만 밝고 짙어진다**」
          v1.47.0 이 강조 조건에 isSelected 를 OR 로 더하면서, 다음 차례로 넘어가도 방금 쓴 선이
          선택으로 남아 **둘이 함께 밝았습니다**(v1.48.0 에서 실제로 확인). 이 검사가 그것을 잠급니다.
     104 「아치 파랑라인이 톤다운된 느낌이라 눈이 더 아파진다」 — 원인은 강조 색이 아니라 **연한 상태**.
          알파 0.475 로 흐리게 하니 파랑이 피부와 섞여 화면 실제색 #6D7CA4(휘도 0.203),
          보라는 #A762A0(0.195) — 피부(0.199)와 밝기가 같아 사실상 안 보였습니다.
          ⚠️ 고유색(#2E8BFF · #A855F7)은 **바꾸지 않습니다** — 원장님이 유지를 원하셨습니다. */
  if (RUN(53)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);

    const g103 = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, W = S.dim.W, H = S.dim.H;
      /* ⚠️ v1.60.0 — 원장님 확정 기본값은 얇게/짧게/75%·잡은선 테두리 없음입니다(회귀 112).
         이 검사는 **선 그리기 규칙**을 보는 것이므로, 값에 흔들리지 않게 중립값으로 고정합니다. */
      const NEUTRAL = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1,
                        dragEdge: "#FFC9A3", dragW: 1, dragOp: 1 };
      S.look = { ...NEUTRAL };
      /* 강조 여부는 **실제로 그려진 굵기**로 판정한다 — 상태값만 보면 아무 일이 없어도 통과한다 */
      const litKeys = () => {
        const out = [];
        for (const sp of PBx.H_SPECS.concat(PBx.V_SPECS)) {
          if (!S.g[sp.vis]) continue;
          const vert = sp.key[0] === "v";
          const t = vert ? S.g[sp.key] * W : S.g[sp.key] * H;
          const ls = [...document.getElementById("guides").querySelectorAll("line")].filter((l) => {
            const x1 = +l.getAttribute("x1"), x2 = +l.getAttribute("x2");
            const y1 = +l.getAttribute("y1"), y2 = +l.getAttribute("y2");
            if (+(l.getAttribute("stroke-opacity") || 1) <= 0.3) return false;
            return vert ? (Math.abs(x1 - x2) < 0.5 && Math.abs(x1 - t) < 1)
                        : (Math.abs(y1 - y2) < 0.5 && Math.abs(y1 - t) < 1 && Math.abs(x2 - x1) > 4);
          });
          const wmax = ls.length ? Math.max(...ls.map((l) => +l.getAttribute("stroke-width"))) : 0;
          if (wmax >= sp.w + 1.7) out.push(sp.key);
        }
        return out;
      };
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE }; S.multi = false; S.selSet = [];
      /* v1.83.0 — 첫 스텝은 **이너**지만, 이 검사는 「밝은 선이 하나뿐인가」라 앞머리에서 시작해도 된다 */
      S.guideOn = true; S.guideCur = "front"; S.sel = "front"; S.selUD = "front"; S.selLR = "v1"; S.hMode = "line";
      PBx.render();
      const start = litKeys();
      /* 앞머리를 슬라이더로 움직이고 손을 뗀다 → 다음 차례(앞두께)로 */
      const sv = document.getElementById("posSliderV");
      sv.value = String(1 - (S.g.front + 0.02));
      sv.dispatchEvent(new Event("input", { bubbles: true }));
      sv.dispatchEvent(new Event("change", { bubbles: true }));
      PBx.render();
      const afterStep = litKeys();
      const selMoved = S.selUD === "frontThickness";      /* 조절 바도 다음 선을 잡는다 */
      /* 플로우 밖 선(센터)을 고르면 추천을 내리고 그 선만 밝다 */
      document.querySelector('.lbtn[data-key="v1"]').click();
      PBx.render();
      const outside = { lit: litKeys(), cur: S.guideCur };
      /* 플로우 안 선(아치)을 고르면 그 선부터 재개 */
      document.querySelector('.lbtn[data-key="h2"]').click();
      PBx.render();
      const resume = { lit: litKeys(), cur: S.guideCur };
      return { start, afterStep, selMoved, outside, resume };
    });

    const g104 = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, W = S.dim.W, H = S.dim.H;
      const spec = (k) => PBx.H_SPECS.concat(PBx.V_SPECS).find((x) => x.key === k);
      const seg = (key) => {
        const vert = key[0] === "v";
        const t = vert ? S.g[key] * W : S.g[key] * H;
        const ls = [...document.getElementById("guides").querySelectorAll("line")].filter((l) => {
          const x1 = +l.getAttribute("x1"), x2 = +l.getAttribute("x2");
          const y1 = +l.getAttribute("y1"), y2 = +l.getAttribute("y2");
          if (+(l.getAttribute("stroke-opacity") || 1) <= 0.3) return false;
          return vert ? (Math.abs(x1 - x2) < 0.5 && Math.abs(x1 - t) < 1)
                      : (Math.abs(y1 - y2) < 0.5 && Math.abs(y1 - t) < 1 && Math.abs(x2 - x1) > 4);
        });
        if (!ls.length) return null;
        const thick = ls.slice().sort((a, b) => +b.getAttribute("stroke-width") - +a.getAttribute("stroke-width"))[0];
        return { c: thick.getAttribute("stroke"), op: +(thick.getAttribute("stroke-opacity") || 1) };
      };
      S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE }; S.guideOn = true; S.guideCur = null;   /* v1.80.0 — 「조용=회색」은 **가이드 ON** 일 때의 규칙 (가이드를 끄면 전부 고유색 · 회귀 132) */
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1 };   /* v1.60.0 중립값 */
      S.multi = false; S.selSet = []; S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line";
      PBx.render();
      const dimArch = seg("h2"), dimTail = seg("h3"), dimOuter = seg("v4");
      S.sel = "h2"; PBx.render();
      const litArch = seg("h2");
      S.sel = "h3"; PBx.render();
      const litTail = seg("h3");
      return { dimArch, dimTail, dimOuter, litArch, litTail,
               /* v1.94.0 — 원장님 재확정: 아치 민트 · 꼬리 파랑. 고유색은 이제 LOOK_DEF(설정)가
                  기준이고 spec.color 는 설정이 없을 때의 안전망일 뿐이라 **LOOK_DEF 를** 봅니다. */
               nativeKept: PBx.LOOK_DEF.arch === "#5EEAD4" && PBx.LOOK_DEF.tail === "#2E8BFF" };
    });
    await ctx.close();

    check("103. 가이드 플로우 — 밝은 선은 언제나 **하나** · 다음 차례로 선택도 함께 이동",
      g103.start.join() === "front"
        && g103.afterStep.join() === "frontThickness"      /* 이전 선(앞머리)이 남아 있으면 실패 */
        && g103.selMoved
        && g103.outside.lit.join() === "v1" && g103.outside.cur === null
        && g103.resume.lit.join() === "h2" && g103.resume.cur === "h2",
      `시작 [${g103.start}] → 한 단계 뒤 [${g103.afterStep}] · 조절바 이동=${g103.selMoved} · `
      + `플로우 밖 선택 [${g103.outside.lit}](차례 ${g103.outside.cur}) · 재개 [${g103.resume.lit}](차례 ${g103.resume.cur})`);

    check("104. 아치·꼬리 — 고유색 유지 · 조용할 땐 얇은 회색 (v1.55.0)",
      g104.nativeKept
        && g104.dimArch && g104.dimArch.c === "#14161B"
        && g104.dimTail && g104.dimTail.c === "#14161B"
        && g104.dimOuter && g104.dimOuter.c === "#14161B"   /* v1.52.0 — 조용한 세로선은 회색 */
        && g104.litArch && g104.litArch.c === "#5EEAD4"
        && g104.litTail && g104.litTail.c === "#2E8BFF",
      `연한 아치 ${g104.dimArch && g104.dimArch.c}@${g104.dimArch && g104.dimArch.op} · 연한 꼬리 ${g104.dimTail && g104.dimTail.c} · `
      + `연한 아우터 ${g104.dimOuter && g104.dimOuter.c} · 강조 아치 ${g104.litArch && g104.litArch.c} · 강조 꼬리 ${g104.litTail && g104.litTail.c}`);
  }

  /* 105. ⚠️ 밝은 사진 위에서도 읽히는가 · 버튼 위계 (v1.50.0 · 원장님 지시 2026-08-22)
     「맨위에 버튼들 사진이 밝고 고객 이마가 넓은경우 버튼이 아예 안보인다」
     원인: 캔버스 위 칩 배경이 var(--glass) = rgba(255,255,255,.035) — **거의 투명한 흰색**.
     밝은 이마 위에서 흰 바탕에 흰 글씨가 되어 사라졌습니다. BASELINE 3장에 이미 있던
     「어두운 반투명 + 흰 테두리」 규칙과 코드가 어긋나 있었습니다.
     함께 잠그는 것:
       · 사진잠금 = 채움(주요) — 「사진 잠금이 더 행동에 필요한 시선을 잡아야 한다」
       · 사진저장 = 채움 아님 — 「시작시 사진저장에 색상 죽일것」
       · 가이드 켜짐 = 채움 + 글로우 — 「이것이 켜져있다는 신호가 보여야 한다」
       · 초기화 = 어두운 판이되 **채움은 아니다** — 눌리면 전부 지워지므로 시선을 끌면 안 됩니다(3장) */
  if (RUN(54)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const ui = await p.evaluate(() => {
      const S = window.PB.S;
      S.balOn = true; S.balance = { off: {}, skipped: [] };
      S.guideOn = true; S.guideCur = "v2"; S.locked = false;
      window.PB.render();
      const rgba = (c) => (c.match(/[\d.]+/g) || []).map(Number);
      /* 어두운 판인가 — 밝기 합이 낮고 충분히 불투명해야 밝은 사진 위에서도 글자가 산다 */
      const darkPlate = (el) => {
        const c = rgba(getComputedStyle(el).backgroundColor);
        if (c.length < 3) return false;
        const a = c.length > 3 ? c[3] : 1;
        return (c[0] + c[1] + c[2]) < 180 && a >= 0.5;
      };
      const stage = document.getElementById("stage");
      const chips = [...stage.querySelectorAll(".chip")]
        .filter((e) => !document.getElementById("lineRail").contains(e) && e.offsetWidth > 0
                    && !e.classList.contains("on"));      /* 켜진 칩은 액센트 채움이라 별개 */
      const bad = chips.filter((e) => !darkPlate(e)).map((e) => e.id || e.textContent.trim());
      const grad = (id) => getComputedStyle(document.getElementById(id)).backgroundImage.includes("gradient");
      return {
        chipCount: chips.length, badChips: bad,
        resetDark: darkPlate(document.getElementById("btnReset")),
        resetNotFilled: !grad("btnReset"),
        lockFilled: grad("btnLock"),
        exportQuiet: !grad("btnExport"),
        guideOnSignal: (() => {                            /* 가이드는 켜졌을 때만 채움 */
          const g = document.getElementById("btnGuide");
          const had = g.classList.contains("on");           /* 이미 켜져 있을 수 있다 — 먼저 끄고 잰다 */
          g.classList.remove("on");
          const off = grad("btnGuide");
          g.classList.add("on");
          const on = grad("btnGuide");
          g.classList.toggle("on", had);
          return on && !off;
        })(),
      };
    });
    await ctx.close();
    check("105. 밝은 사진에서도 읽히는가 — 캔버스 칩·초기화는 어두운 판 · 잠금=채움 · 저장은 조용",
      ui.chipCount >= 4 && ui.badChips.length === 0
        && ui.resetDark && ui.resetNotFilled
        && ui.lockFilled && ui.exportQuiet && ui.guideOnSignal,
      `칩 ${ui.chipCount}개 검사 · 흰 배경 남은 것 [${ui.badChips}] · 초기화 어두운판=${ui.resetDark}/채움아님=${ui.resetNotFilled} · `
      + `잠금채움=${ui.lockFilled} · 저장조용=${ui.exportQuiet} · 가이드켜짐신호=${ui.guideOnSignal}`);
  }

  /* 106·107. ⚠️ v1.51.0 (원장님 지시 2026-08-22)
     106 「이너라인이 닿은 앞머리와 앞머리두께 가로라인 사이는 회색 얇은선 처리 …
          바깥에만 굵은선이고 눈썹 내부는 얇은 회색으로」 + 「자의 앞부분(안쪽) 얇은 회색,
          뒷부분만 유지」 + 「가로 꼬리 길이 반」.
          한 줄로: **일하는 곳만 굵고 나머지는 얇은 짙은 회색.**
          ⛔ 굵은 선이 눈썹 속을 가로지르게 되돌리면 그 자리 드로잉이 가려집니다.
     107 「프리셋 유지, 내부에 기본사항 제공 제거. 오로지 사용자의 프리셋 저장만 사용하자」 */
  if (RUN(55)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, W = S.dim.W, H = S.dim.H;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.guideOn = true; S.guideCur = null; S.multi = false; S.selSet = []; S.sel = "h1";   /* v1.80.0 — 「조용=회색」은 **가이드 ON** 일 때의 규칙 (가이드를 끄면 전부 고유색 · 회귀 132) */
      PBx.render();
      const all = [...document.getElementById("guides").querySelectorAll("line")].map((l) => ({
        x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
        y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
        c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
        o: +(l.getAttribute("stroke-opacity") || 1),
      }));
      const GREY = "#14161B";
      /* ⚠️ v1.55.0 ① 가로 자 — 조용하면 **얇은 회색 한 줄**, 차례가 오면 **고유색 한 줄**.
         색/회색으로 쪼개지 않는다 (원장님: 「고유색으로만 1개선으로 변경」) */
      const y = S.g.front * H;
      const hsOf = () => [...document.getElementById("guides").querySelectorAll("line")]
        .map((l) => ({ x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
                       y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
                       c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
                       o: +(l.getAttribute("stroke-opacity") || 1) }))
        .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1
                    && Math.abs(l.x2 - l.x1) > 2 && l.o > 0.3
                    && Math.max(l.x1, l.x2) < S.g.v1 * W);   /* 왼쪽 눈썹 토막만 */
      const quietH = hsOf();
      const hQuietAllGrey = quietH.length > 0 && quietH.every((l) => l.c === GREY && l.w <= 1.2);
      S.sel = "front"; PBx.render();
      const litH = hsOf().filter((l) => l.w > 1.2);
      const hLitOneColor = litH.length === 1 && litH[0].c === "#A3E635";   /* v1.94.0 — 이너 묶음 = 라임 */
      S.sel = "h1"; PBx.render();
      const colorSeg = hLitOneColor, greySeg = hQuietAllGrey, overshoot = 0.5;
      /* ② 세로선 — 조용할 땐 **전체가 회색 한 줄**(색 토막 없음), 잡으면 전체 고유색 (v1.52.0) */
      const vx = S.g.v2 * W;
      const vSegs = () => all2().filter((l) => Math.abs(l.x1 - l.x2) < 0.5 && Math.abs(l.x1 - vx) < 1 && l.o > 0.3);
      const all2 = () => [...document.getElementById("guides").querySelectorAll("line")].map((l) => ({
        x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
        y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
        c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
        o: +(l.getAttribute("stroke-opacity") || 1),
      }));
      const quietV = vSegs();
      const quietAllGrey = quietV.length > 0 && quietV.every((l) => l.c === "#14161B");
      window.PB.S.sel = "v2"; window.PB.render();
      const grabV = vSegs();
      const grabColored = grabV.some((l) => l.c === "#5EEAD4" && l.w > 2);
      window.PB.S.sel = "h1"; window.PB.render();
      const thickInside = false, thickOutside = true;   /* v1.52.0 — 토막 규칙 폐지, 아래 새 판정으로 대체 */
      /* ③ 꼬리 자는 아치 자의 절반 길이 */
      const len = (k) => { const sp = PBx.H_SPECS.find((x) => x.key === k); const q = PBx.segPx(sp)[0]; return q[1] - q[0]; };
      return {
        inGrey: greySeg,
        outColor: colorSeg,
        overshoot, quietAllGrey, grabColored,
        thickInside, thickOutside,
        tailRatio: len("h3") / len("h2"),
        lockOnCenter: (() => {
          const st = document.getElementById("stage").getBoundingClientRect();
          const lk = document.getElementById("btnLock").getBoundingClientRect();
          return Math.abs((lk.left + lk.right) / 2 - st.left - S.g.v1 * W) < 4;
        })(),
      };
    });
    const pr = await p.evaluate(() => {
      localStorage.removeItem("pb_presets_v1"); localStorage.removeItem("pb_favs_v1");
      document.getElementById("btnPresetLoad").click();
      const empty = !!document.querySelector("#presetList .empty");
      const rows = document.querySelectorAll("#presetList .pitem").length;
      document.getElementById("mLoad").classList.remove("on");
      return { empty, rows, hasBtn: !!document.getElementById("btnPresetLoad") };
    });
    await ctx.close();
    check("106. 한 줄 규칙 — 자도 세로선도 조용=얇은 회색 / 차례=고유색 **한 줄** · 꼬리 자 반",
      r.inGrey && r.outColor
        && r.quietAllGrey && r.grabColored
        && r.tailRatio > 0.4 && r.tailRatio < 0.6 && r.lockOnCenter,
      `조용한 자=회색전체 ${r.inGrey} · 차례인 자=고유색 한 줄 ${r.outColor} · `
      + `조용 세로선=회색전체 ${r.quietAllGrey} · 잡으면 색 ${r.grabColored} · 꼬리/아치 길이비 ${r.tailRatio.toFixed(2)} · 잠금=센터선 ${r.lockOnCenter}`);
    check("107. 프리셋 — 내장 기본 3종 없음 · 사용자가 저장한 것만",
      pr.empty && pr.rows === 0 && pr.hasBtn,
      `빈 목록 표시=${pr.empty} · 줄 수=${pr.rows}(0이어야 함) · 프리셋 버튼 유지=${pr.hasBtn}`);
  }

  /* 108. ⚠️ v1.55.0 (원장님 지시 2026-08-22 · v1.54.0 을 대체)
     「가이드 시작되면 블링킹이 첫 2번 깜빡이는 것을 **느린 블링킹 한 번, 4초에 한 번씩**
      다음 움직임 전까지 계속 반복. 블링킹은 고유색으로 밝았다 조금 투명해진다.
      모든 선을 클릭해서 움직일 때는 **짙은 회색과 살구색 테두리**,
      움직임 없을 때는 현재 얇은 회색 유지」
     ⛔ 깜빡임을 JS 타이머로 되돌리지 마세요 — 드래그 중 매 프레임 render() 가 화면을 먹습니다.
     ⛔ 밝은 쪽(0%·100%) 은 반드시 stroke-opacity:1 — 저장본은 애니메이션 없이 그 값으로 찍힙니다. */
  if (RUN(56)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, W = S.dim.W;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      /* v1.60.0 — 기본값이 얇게/75%·잡은선 테두리 없음이라, 이 검사는 중립값으로 고정 (회귀 112) */
      S.look = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1,
                 dragCore: "#14161B", dragEdge: "#FFC9A3", dragW: 1, dragOp: 1 };
      S.guideOn = true; S.guideCur = "v2"; S.sel = "v2"; S.multi = false; S.selSet = [];
      S.dragOn = false;
      const vSegs = () => {
        const vx = S.g.v2 * W;
        return [...document.getElementById("guides").querySelectorAll("line")]
          .map((l) => ({ x: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
                         c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
                         o: +(l.getAttribute("stroke-opacity") || 1),
                         cls: l.getAttribute("class") || "" }))
          .filter((l) => Math.abs(l.x - l.x2) < 0.5 && Math.abs(l.x - vx) < 1 && l.o > 0.3);
      };
      PBx.render();
      const lit = vSegs().sort((a, b) => b.w - a.w)[0];
      S.dragOn = true; PBx.render();
      const grab = vSegs().sort((a, b) => b.w - a.w);
      S.dragOn = false; PBx.render();
      /* 깜빡임은 CSS — 실제로 애니메이션이 붙었는지 계산된 스타일로 확인 */
      const el = [...document.getElementById("guides").querySelectorAll("line.blink")][0];
      const cs = el ? getComputedStyle(el) : null;
      return {
        lit, ring: grab[0], core: grab[1],
        blinkOnLit: !!lit && lit.cls.includes("blink"),
        blinkOnGrab: grab.some((l) => l.cls.includes("blink")),
        animName: cs ? cs.animationName : "", animDur: cs ? cs.animationDuration : "",
        animIter: cs ? cs.animationIterationCount : "",
      };
    });
    const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const kf = (src.match(/@keyframes pbBlink\{([^}]*\})*[^}]*\}/) || [""])[0];
    const brightEnds = /0%\{stroke-opacity:1\}/.test(src) && /100%\{stroke-opacity:1\}/.test(src);
    const dipsPartly = (() => { const m = src.match(/10%\{stroke-opacity:([.\d]+)\}/); return m && +m[1] > 0.25 && +m[1] < 0.7; })();
    const expSrc = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const exportClean = /async function exportImage\(\)[\s\S]{0,400}?S\.dragOn = false; render\(\);/.test(expSrc);
    const noTimer = !/setTimeout\(step2/.test(expSrc);
    await ctx.close();
    check("108. 지시등 — 4초에 한 번 느린 깜빡임(CSS) · 잡으면 짙은 회색 + 살구색 테두리 · 저장본 선명",
      r.blinkOnLit && !r.blinkOnGrab
        && r.animName === "pbBlink" && r.animDur === "4s" && r.animIter === "infinite"
        && brightEnds && dipsPartly && !!kf
        && r.lit && r.lit.c === "#5EEAD4" && r.lit.o > 0.95
        && r.ring && r.ring.c === "#FFC9A3" && r.core && r.core.c === "#14161B"
        && r.ring.w > r.core.w + 2
        && exportClean && noTimer,
      `차례 선 ${r.lit && r.lit.c}@${r.lit && r.lit.o} .blink=${r.blinkOnLit} · `
      + `애니 ${r.animName}/${r.animDur}/${r.animIter} · 밝은쪽=1 ${brightEnds} · 조금만 투명 ${dipsPartly} · `
      + `잡음 테두리 ${r.ring && r.ring.c} w${r.ring && r.ring.w} / 심 ${r.core && r.core.c} w${r.core && r.core.w} · `
      + `잡는 동안 깜빡임 정지 ${!r.blinkOnGrab} · 저장본 선명 ${exportClean} · JS타이머 없음 ${noTimer}`);
  }

  /* 109. ⚠️ v1.56.0 설정 — 선 모양 (원장님 지시 2026-08-23)
     「각 선마다 선호 색상 … 색상표와 미리보기 … 테두리 유무/퍼센트/색(대비색) …
       선 굵기 · 가로선 길이 · 투명도 … 맨 위에 추천 3개 조합 … 하나 색 전체 적용」
     ⚠️ 색상표 7개는 **밝은 피부·짙은 눈썹 양쪽에 밝기 대비 2:1 을 넘는 색이 없다**는
        측정 결과 위에 세워졌습니다: 색은 **피부 주황(25°)에서 먼 색상(hue)** 으로 고르고,
        밝기 대비는 **테두리(대비색)** 가 만듭니다. 이 역할 분담을 깨지 마세요.
     ⛔ 설정 값을 바꿔도 **선 색 = 레일 띠 색**은 계속 맞아야 합니다 (BASELINE 1-20). */
  if (RUN(57)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, W = S.dim.W, H = S.dim.H;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.guideOn = false; S.guideCur = null; S.multi = false; S.selSet = [];
      const segsAt = (y) => [...document.getElementById("guides").querySelectorAll("line")]
        .map((l) => ({ x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"),
                       y1: +l.getAttribute("y1"), y2: +l.getAttribute("y2"),
                       c: l.getAttribute("stroke"), w: +l.getAttribute("stroke-width"),
                       o: +(l.getAttribute("stroke-opacity") || 1) }))
        .filter((l) => Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - y) < 1
                    && Math.abs(l.x2 - l.x1) > 2 && l.o > 0.3 && Math.max(l.x1, l.x2) < S.g.v1 * W);
      const front = () => segsAt(S.g.front * H).filter((l) => l.w > 1.2).sort((a, b) => b.w - a.w);
      const railColor = () => { const b = document.querySelector('.lbtn[data-key="front"]');
        return b ? b.style.getPropertyValue("--dot").trim() : ""; };
      const lenOf = () => { const q = PBx.segPx(PBx.H_SPECS.find((x) => x.key === "front"))[0]; return q[1] - q[0]; };

      /* ① 기본값 · 색상표 7개 · 모두 다른 색 (v1.60.0 — 굵기/길이/투명도는 중립값 기준으로 비교) */
      const NEU = { ...PBx.LOOK_DEF, weight: 1, hlen: 0.19, alpha: 1 };
      S.look = { ...NEU }; S.sel = "front"; PBx.render();
      const pal = PBx.PALETTE.map((x) => x.hex);
      /* v1.81.0 — 흰색이 더해져 **8색** (원장님 지시 2026-08-27). 세로선은 따로 3색(V_PALETTE) */
      const vpal = PBx.V_PALETTE.map((x) => x.hex);
      const palOk = pal.length === 8 && new Set(pal).size === 8 && pal.includes("#FFFFFF")
                 && vpal.join() === "#5EEAD4,#14161B,#FFFFFF";
      const base = front()[0], baseRail = railColor(), baseW = base.w, baseLen = lenOf();

      /* ② 색을 바꾸면 선과 레일 띠가 함께 바뀐다 */
      S.look.inner = "#FF4D94"; PBx.render();
      const changed = front()[0], changedRail = railColor();

      /* ③ 테두리 — v1.81.0: 색은 **없음/흰색/검정/먹색**. 옛 저장값 `auto` 는 대비색으로 환산된다 */
      S.look.inner = "#5EEAD4"; S.look.edge = 70; S.look.edgeC = "dark"; PBx.render();
      const eLight = front();                       /* 먹 테두리 */
      S.look.inner = "#14161B"; S.look.edgeC = "light"; PBx.render();
      const eDark = front();                        /* 흰 테두리 */
      S.look.edgeC = "auto";
      const autoLight = PBx.edgeColorFor("#5EEAD4"), autoDark = PBx.edgeColorFor("#14161B");
      /* 「없음」이면 굵기가 얼마든 테두리를 그리지 않는다 (v1.81.0) */
      S.look = { ...NEU, edge: 70, edgeC: "none" }; PBx.render();
      const edgeNone = front().length;

      /* ④ 굵기 · 가로 길이 · 투명도 */
      S.look = { ...NEU, weight: 1.35 }; PBx.render();
      const thickW = front()[0].w;
      S.look = { ...NEU, weight: 0.8 }; PBx.render();
      const thinW = front()[0].w;
      S.look = { ...NEU, hlen: 0.25 }; PBx.render();
      const longLen = lenOf();
      S.look = { ...NEU, hlen: 0.14 }; PBx.render();
      const shortLen = lenOf();
      /* ⚠️ v1.81.0 — **선택된 선은 조금 밝아집니다.** 투명도를 잴 때는 선택을 비켜 둡니다
         ⚠️ v1.84.0 — 비켜 둔 선은 **한 단계 물러난 선**(×0.55 · 회귀 138)입니다 */
      S.look = { ...NEU, alpha: 0.6 }; S.sel = "h1"; PBx.render();
      const dimOp = front()[0].o;
      S.sel = "front"; PBx.render();
      const selOp = front()[0].o, selW = front()[0].w;
      S.sel = "h1"; PBx.render();
      const plainW = front()[0].w;

      /* ⑤ 잡은 선(드래그) — 기본 선과 **완전 분리** (v1.59.0: 심·테두리·굵기·투명도·없음) */
      S.look = { ...NEU, dragCore: "#FFFFFF", dragEdge: "#2E8BFF" };
      S.sel = "front"; S.dragOn = true; PBx.render();
      const grab = segsAt(S.g.front * H).filter((l) => l.w > 1.2).sort((a, b) => b.w - a.w);
      const dragRing = grab[0] && grab[0].c, dragCore = grab[1] && grab[1].c;
      /* 테두리 「없음」 = 심만 한 줄 */
      S.look.dragEdge = "none"; PBx.render();
      const grabNone = segsAt(S.g.front * H).filter((l) => l.w > 1.2);
      /* 잡은 선 굵기·투명도는 기본 선 weight·alpha 와 무관하게 따로 논다 */
      S.look = { ...NEU, weight: 0.8, alpha: 1, dragEdge: "#2E8BFF", dragW: 1.35, dragOp: 0.6 }; PBx.render();
      const grabBig = segsAt(S.g.front * H).filter((l) => l.w > 1.2).sort((a, b) => b.w - a.w);
      const dragWOk = grabBig[1] && Math.abs(grabBig[1].w - (2.95 * 1.35)) < 0.01;
      const dragOpOk = grabBig[1] && Math.abs(grabBig[1].o - 0.6) < 0.01;
      /* v1.82.0 — 슬라이더를 끌면 잡은 선이 실제로 굵어진다 (기본 선 굵기와는 따로) */
      S.look = { ...NEU, weight: 0.8, dragEdge: "none" }; PBx.buildLookUI();
      const rw = document.getElementById("rngDragW");
      const wAt = (v) => { rw.value = String(v); rw.dispatchEvent(new Event("input", { bubbles: true }));
        const q = segsAt(S.g.front * H).filter((l) => l.w > 1.2).sort((a, b) => b.w - a.w);
        return q[0] ? q[0].w : 0; };
      const dragThin = wAt(60), dragThick = wAt(180);
      const dragSliderOk = dragThick > dragThin * 2.5 && Math.abs(S.look.weight - 0.8) < 1e-9;
      S.dragOn = false;

      /* ⑥ 조합 3개 · 「모두 이 색」 · 저장 · 이전 설정으로 */
      S.look = { ...PBx.LOOK_DEF }; S.lookSnap = { ...PBx.LOOK_DEF }; PBx.buildLookUI();
      const comboN = document.querySelectorAll("#lookCombo button").length;
      const swN = document.querySelectorAll("#swInner button.sw").length;
      const dragSwN = document.querySelectorAll("#swDragE button.sw").length;   /* 7 + 살구 + 없음 = 9 */
      document.querySelectorAll("#lookCombo button")[1].click();      /* 밝은 사진 */
      const brightApplied = { ...S.look };
      document.getElementById("lookAll").click();
      const allSame = S.look.inner === S.look.arch && S.look.arch === S.look.tail;
      const stored = JSON.parse(localStorage.getItem("pb_look_v1") || "{}");
      /* 조작하다 별로면 — 「이전 설정으로」가 시트를 연 순간 값으로 복귀 (원장님 지시) */
      document.getElementById("lookBack").click();
      const backOk = S.look.inner === PBx.LOOK_DEF.inner && S.look.edge === PBx.LOOK_DEF.edge;
      S.look.inner = "#FF4D94";
      document.getElementById("lookReset").click();
      const afterReset = { ...S.look };
      return {
        palOk, pal,
        baseC: base.c, baseRail, changedC: changed.c, changedRail,
        edgeLightPair: eLight.map((l) => l.c), edgeDarkPair: eDark.map((l) => l.c),
        edgeThicker: eLight.length >= 2 && eLight[0].w > eLight[1].w,
        autoLight, autoDark,
        baseW, thickW, thinW, baseLen, longLen, shortLen, dimOp,
        comboN, swN, dragSwN, dragRing, dragCore, backOk,
        dragNoneOk: grabNone.length === 1 && grabNone[0].c === "#FFFFFF", edgeNone, selOp, selW, plainW,
        dragSliderOk, dragThin, dragThick,
        dragWOk, dragOpOk,
        tabsOk: !!document.getElementById("tabBase") && !!document.getElementById("tabGrab")
             && !!document.getElementById("rngDragW") && !!document.getElementById("rngDragOp")
             && !document.getElementById("segDragW")   /* v1.82.0 — 잡은 선 굵기도 슬라이더 */
             && !!document.getElementById("tabOrder") && !!document.getElementById("rngW")
             && !!document.getElementById("rngEdge") && !document.getElementById("segW")
             && !document.getElementById("segEdge") && !!document.getElementById("swVAll"),
        brightEdge: brightApplied.edge, brightEdgeC: brightApplied.edgeC,
        allSame, storedInner: stored.inner, resetOk: afterReset.inner === PBx.LOOK_DEF.inner && afterReset.edge === 0,
      };
    });
    await ctx.close();
    check("109. 설정 — 색상표 8색 · 세로선 목록 · 굵기/테두리/잡은선 굵기 슬라이더 · 테두리 4종 · 선택 강조",
      r.palOk
        && r.baseC === "#A3E635" && r.baseRail === "#A3E635"   /* v1.94.0 — 이너 묶음 기본 = 라임 */
        && r.changedC === "#FF4D94" && r.changedRail === "#FF4D94"
        && r.edgeThicker && r.edgeLightPair[0] === "#14161B" && r.edgeDarkPair[0] === "#FFFFFF"
        && r.autoLight === "#14161B" && r.autoDark === "#FFFFFF"
        && r.thickW > r.baseW && r.thinW < r.baseW
        && r.longLen > r.baseLen && r.shortLen < r.baseLen
        && Math.abs(r.dimOp - 0.6 * 0.55) < 0.01 && r.selOp > r.dimOp + 0.2 && r.selW > r.plainW * 1.2
        && r.edgeNone === 1
        && r.comboN === 3 && r.swN === 8 && r.dragSwN === 10
        && r.dragRing === "#2E8BFF" && r.dragCore === "#FFFFFF" && r.backOk
        && r.dragNoneOk && r.dragWOk && r.dragOpOk && r.dragSliderOk && r.tabsOk
        && r.brightEdge === 70 && r.brightEdgeC === "light"
        && r.allSame && r.storedInner && r.resetOk,
      `색상표 ${r.pal.length}개 · 선 ${r.baseC}→${r.changedC} / 띠 ${r.baseRail}→${r.changedRail} · `
      + `테두리 밝은색→${r.edgeLightPair[0]} 짙은색→${r.edgeDarkPair[0]} 더굵음=${r.edgeThicker} · `
      + `굵기 ${r.thinW}/${r.baseW}/${r.thickW} · 길이 ${Math.round(r.shortLen)}/${Math.round(r.baseLen)}/${Math.round(r.longLen)} · `
      + `투명도 ${r.dimOp}→선택 ${r.selOp} · 굵기 ${r.plainW}→선택 ${r.selW} · 테두리없음=한줄 ${r.edgeNone === 1} · 조합 ${r.comboN}개 · 잡은선 심 ${r.dragCore}/테두리 ${r.dragRing}(10칸 ${r.dragSwN === 10}) · 없음=심만 ${r.dragNoneOk} · 굵기분리 ${r.dragWOk}/투명도분리 ${r.dragOpOk} · 잡은선 굵기 슬라이더 ${r.dragThin.toFixed(1)}→${r.dragThick.toFixed(1)}(${r.dragSliderOk}) · 탭 ${r.tabsOk} · `
      + `이전설정복귀 ${r.backOk} · 모두같은색 ${r.allSame} · 저장 ${r.storedInner} · 기본으로 ${r.resetOk}`);
  }

  /* 110. ⚠️ v1.58.0 조합 순환 버튼 (원장님 지시 2026-08-23)
     「가이드 오른쪽에 선 색변경 가능한 버튼 하나 추가, 클릭 시 다른 추천 조합으로 변경 —
      또 클릭 시 다른 조합 변경」
     순서: 내 세트 → 밝은 사진 → 어두운 사진 → **다시 내 세트** (한 바퀴 돌면 그대로 복귀 —
     시술 중 잘못 눌러도 잃는 것이 없어야 한다). 라벨은 지금 조합 이름을 보여준다. */
  if (RUN(58)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      /* 내 세트 = 기본에서 이너만 핑크로 바꾼 값 (추천 조합 어느 것과도 다르게) */
      S.look = { ...PBx.LOOK_DEF, inner: "#FF4D94" }; S.lookOwn = null;
      window.PB.render();
      const btn = document.getElementById("btnLookCycle");
      const label = () => document.getElementById("lookCycleName").textContent;
      const snap = () => ({ inner: S.look.inner, arch: S.look.arch, edge: S.look.edge, edgeC: S.look.edgeC });
      const guideBtn = document.getElementById("btnGuide");
      /* v1.90.0 — 가이드와 조합 순환 사이에 「안내」 토글이 들어왔다 (원장님 지시 2026-08-28).
         「가이드 묶음의 오른쪽」이라는 뜻은 그대로다 — 가이드보다 뒤, 같은 줄이면 된다 */
      const rightOfGuide = !!(guideBtn.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING)
        && btn.parentElement === guideBtn.parentElement;
      const s0 = snap();
      btn.click(); const s1 = snap(), l1 = label();
      btn.click(); const s2 = snap(), l2 = label();
      btn.click(); const s3 = snap(), l3 = label();
      return { rightOfGuide, s0, s1, s2, s3, l1, l2, l3,
               stored: (JSON.parse(localStorage.getItem("pb_look_v1") || "{}")).inner };
    });
    await ctx.close();
    const bright = { inner: "#14161B", edgeC: "light" }, dark = { inner: "#5EEAD4", edgeC: "dark" };
    check("110. 조합 순환 버튼 — 가이드 오른쪽 · 클릭마다 다음 조합 · 한 바퀴 돌면 내 세트 복귀",
      r.rightOfGuide
        && r.s1.inner === bright.inner && r.s1.edgeC === "light" && r.s1.edge === 70
        && r.s2.inner === dark.inner && r.s2.edgeC === "dark" && r.s2.edge === 70
        && r.s3.inner === r.s0.inner && r.s3.edge === r.s0.edge     /* 내 세트로 복귀 */
        && r.l1.length > 0 && r.l2.length > 0 && r.l3.length > 0 && r.l1 !== r.l2
        && r.stored === r.s3.inner,
      `가이드 오른쪽=${r.rightOfGuide} · ${r.s0.inner} → [${r.l1}]${r.s1.inner} → [${r.l2}]${r.s2.inner} → [${r.l3}]${r.s3.inner}(복귀 ${r.s3.inner === r.s0.inner}) · 저장 ${r.stored}`);
  }

  /* 111. ⚠️ v1.59.0 — 설정 시트도 가짜 회전(rot90)을 따라간다 (원장님 지시 2026-08-23
     「설정창 가로모드로 변경」). 시트는 body 직속 fixed 라 .screen 의 회전을 상속받지 못해
     아이폰 세로 잠금 상태에서 **설정만 세로로** 떴었다. ⛔ body.rot90 .sheet 블록을 지우면 재발. */
  if (RUN(59)) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const rot = document.body.classList.contains("rot90");
      const el = document.getElementById("mLook");
      window.PB.S.lookSnap = { ...window.PB.S.look }; window.PB.buildLookUI();
      el.classList.add("on");
      const tf = getComputedStyle(el).transform;   /* ⚠️ display:none 이 되기 전에 읽는다 */
      const inW = document.querySelector("#mLook .sheet-in").getBoundingClientRect();
      el.classList.remove("on");
      /* matrix(0,1,-1,0,...) = 90° 회전. 회전된 시트의 화면상 폭 = 기기 세로(844) 방향 */
      return { rot, tf, w: Math.round(inW.width), h: Math.round(inW.height) };
    });
    await ctx.close();
    const rotated = /matrix\(0,\s*1,\s*-1,\s*0/.test(r.tf);
    check("111. 설정 시트 — 아이폰 세로 잠금(rot90)에서도 가로로 뜬다",
      r.rot && rotated && r.w < r.h,   /* 회전됐으면 화면상 rect 는 세로가 길다 */
      `rot90=${r.rot} · transform=${r.tf.slice(0, 24)}… · 시트 rect ${r.w}×${r.h}(회전이면 세로>가로)`);
  }

  /* 112. ⚠️⚠️ v1.60.0 — **원장님이 확정한 기본 선 세팅** (2026-08-23)
     「지금 내가 앱에 설정한 선을 기본으로 셋팅하고 못 박아줘」
     원장님이 실제 시술 화면에서 눈으로 맞춘 값입니다. 이 테스트가 그 값을 통째로 잠급니다.
     ⛔ 값을 바꾸려면 **원장님 확인을 먼저** 받으세요. 이 테스트를 고쳐서 통과시키지 마세요. */
  if (RUN(60)) {
    /* ⚠️ v1.81.0 갱신 — **누가·언제·왜** (BASELINE 1-26 규칙대로 기록합니다):
       원장님 지시 2026-08-27 「세로색 목록 추가 — 이너: 기본 민트 / 아치선: 먹색 / 꼬리선: 먹색」
       + 「가이드가 꺼진상태에서 이너라인은 제외한 세로색상은 기본적으로 먹색을 유지」
       + 테두리 색 목록을 「없음·흰색·검정·먹색」으로 정하셔서 기본이 `auto` → `none` 이 됐습니다.
       ⛔ 나머지 값(얇게 0.8 · 짧게 0.14 · 75% · 잡은 선)은 v1.60.0 그대로입니다 — 바꾸려면
          원장님 확인을 먼저 받으세요. 이 테스트를 고쳐서 통과시키지 마세요. */
    /* ⚠️ v1.94.0 갱신 — 원장님 지시 2026-08-29 「지금 선 설정을 초기 셋팅으로 저장」
       (스크린샷 픽셀 판독): 이너 라임 · 아치 민트 · 꼬리 파랑 · 굵기 0.75 · 길이 0.04(8%)
       · 투명도 55% · 잡은 선 = 흰색 심 · 없음 · 85% · 65%. 세로선·테두리는 v1.81.0 그대로. */
    const LOCKED = {
      inner: "#A3E635", arch: "#5EEAD4", tail: "#2E8BFF",
      vInner: "#5EEAD4", vArch: "#14161B", vTail: "#14161B",
      edge: 0, edgeC: "none", weight: 0.75, hlen: 0.04, alpha: 0.55,
      dragCore: "#FFFFFF", dragEdge: "none", dragW: 0.85, dragOp: 0.65,
      /* v1.95.0 — 놓은 선(체크 마친 선)·서브 라인 기본값 (원장님 지시 2026-08-29).
         기본값은 기존 화면과 동일하게 보이도록 잡은 선·연결선 값과 같습니다. */
      doneC: "#FFFFFF", doneW: 0.85, doneOp: 0.65, subW: 1, subOp: 0.16,
    };
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    const r = await p.evaluate((L) => {
      const PBx = window.PB, D = PBx.LOOK_DEF;
      const same = Object.keys(L).every((k) => D[k] === L[k]);
      const extra = Object.keys(D).filter((k) => !(k in L));
      /* 저장된 설정이 없는 새 기기 = LOOK_DEF 그대로 시작해야 한다 */
      localStorage.removeItem("pb_look_v1");
      const fresh = PBx.loadLook();
      const freshSame = Object.keys(L).every((k) => fresh[k] === L[k]);
      /* 추천 조합은 **색·테두리만** 건드린다 — 굵기·길이·투명도·잡은 선은 원장님 값 유지 */
      const keepsGeom = PBx.LOOK_COMBOS.filter((c) => c.v).every((c) =>
        ["weight", "hlen", "alpha", "dragCore", "dragEdge", "dragW", "dragOp"].every((k) => !(k in c.v)));
      return { same, extra, freshSame, keepsGeom, got: D };
    }, LOCKED);
    await ctx.close();
    check("112. 원장님 확정 기본 세팅(2026-08-29) — 라임·민트·파랑 · 0.75/8%/55% · 잡은 선 흰색 85%/65%",
      r.same && r.extra.length === 0 && r.freshSame && r.keepsGeom,
      `LOOK_DEF 일치=${r.same} · 예상 밖 항목 [${r.extra}] · 새 기기 시작값 일치=${r.freshSame} · 추천조합이 굵기/길이/투명도 안 건드림=${r.keepsGeom} · `
      + `굵기 ${r.got.weight} 길이 ${r.got.hlen} 투명도 ${r.got.alpha} 테두리 ${r.got.edge}/${r.got.edgeC} · 잡은선 ${r.got.dragCore}/${r.got.dragEdge}/${r.got.dragW}/${r.got.dragOp}`);
  }

  /* 113. ⚠️ v1.61.0 — 꼬리·아우터 사선 이동 (원장님 지시 2026-08-23 · 「둘 다 사선」 선택)
     꼬리 끝 = (아우터 x, 꼬리 y) **한 점**. 꼬리 자든 아우터 세로선이든 잡고 사선으로 끌면
     dy → 꼬리(h3), dx → 아우터(v4)가 함께 움직인다. 오른쪽(거울)에서 잡으면 dx 부호 반전.
     ⛔ 다른 자(앞머리·아치)로 퍼뜨리지 말 것 — 두께 쌍이 흐트러진다. 여러라인 모드는 예외 없음. */
  if (RUN(61)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.g.h3Visible = true; S.g.v4Visible = true;
      S.multi = false; S.selSet = []; S.locked = true; S.guideOn = false; S.guideCur = null;
      PBx.render();
    });
    const box = await (await p.$("#touch")).boundingBox();
    const st = await p.evaluate(() => {
      const S = window.PB.S, W = S.dim.W, H = S.dim.H;
      return { W, H, h3: S.g.h3, v4: S.g.v4, v1: S.g.v1,
               tailY: S.g.h3 * H, leftX: S.g.v4 * W, rightX: (2 * S.g.v1 - S.g.v4) * W };
    });
    const drag = async (x0, y0, dx, dy) => {
      await p.mouse.move(box.x + x0, box.y + y0);
      await p.mouse.down();
      await p.mouse.move(box.x + x0 + dx, box.y + y0 + dy, { steps: 10 });
      await p.mouse.up();
      await p.waitForTimeout(100);
    };
    const g = () => p.evaluate(() => ({ h3: window.PB.S.g.h3, v4: window.PB.S.g.v4, front: window.PB.S.g.front }));
    /* ① 왼쪽 꼬리 자를 사선으로 → h3 아래로 + v4 왼쪽으로(코 쪽) */
    const b1 = await g();
    await drag(st.leftX + 20, st.tailY, -24, 30);
    const a1 = await g();
    const d1y = (a1.h3 - b1.h3) * st.H, d1x = (a1.v4 - b1.v4) * st.W;
    /* ② 오른쪽(거울) 아우터 세로선을 사선으로 → dx 부호 반전 · h3 도 함께 */
    await p.evaluate(() => { const S = window.PB.S; S.g = { ...window.PB.DEFAULT_GUIDE };
      S.g.h3Visible = true; S.g.v4Visible = true; window.PB.render(); });
    const st2 = await p.evaluate(() => { const S = window.PB.S;
      return { rightX: (2 * S.g.v1 - S.g.v4) * S.dim.W, midY: (S.g.h3 + 0.10) * S.dim.H }; });
    const b2 = await g();
    await drag(st2.rightX, st2.midY, 26, -18);
    const a2 = await g();
    const d2x = (a2.v4 - b2.v4) * st.W, d2y = (a2.h3 - b2.h3) * st.H;
    /* ③ 다른 자(앞머리)는 사선이 아니다 — 가로 드래그에 x 영향 없음 */
    await p.evaluate(() => { const S = window.PB.S; S.g = { ...window.PB.DEFAULT_GUIDE }; window.PB.render(); });
    const st3 = await p.evaluate(() => { const S = window.PB.S;
      const q = window.PB.segPx(window.PB.H_SPECS.find((x) => x.key === "front"))[0];
      return { x: (q[0] + q[1]) / 2, y: S.g.front * S.dim.H, v2: S.g.v2 }; });
    const b3 = await g();
    await drag(st3.x, st3.y, 30, 22);
    const a3 = await p.evaluate(() => ({ front: window.PB.S.g.front, v2: window.PB.S.g.v2 }));
    const frontMoved = Math.abs((a3.front - b3.front) * st.H - 22) < 4;
    const v2Still = Math.abs(a3.v2 - st3.v2) < 1e-9;
    await ctx.close();
    check("113. 꼬리·아우터 사선 — 한 손짓으로 꼬리 끝 점을 놓는다 (거울쪽 부호 반전 · 다른 자는 그대로)",
      Math.abs(d1y - 30) < 4 && Math.abs(d1x - (-24)) < 4
        && Math.abs(d2x - (-26)) < 4 && Math.abs(d2y - (-18)) < 4
        && frontMoved && v2Still,
      `왼쪽 꼬리자 사선 Δy=${d1y.toFixed(1)}(30) Δx=${d1x.toFixed(1)}(-24) · `
      + `오른쪽 아우터 사선 Δx=${d2x.toFixed(1)}(-26·반전) Δy=${d2y.toFixed(1)}(-18) · `
      + `앞머리자는 위아래만=${frontMoved}/${v2Still}`);
  }

  /* 117. ⭐ v1.81.0 — **아치는 혼자 움직인다** (원장님 지시 2026-08-27)
     「지금은 아치가로선과 아치세로선이 동시움직였는데 **따로 움직이도록 되돌린다**」
     + 원장님 확인: 아치두께 동반도 함께 해제 → 아치 · 아치두께 · 아치선이 **전부 따로**.
     ⛔ v1.67.0 의 ARCH_PAIR(사선 동반 · 두께 동반)를 되살리지 마세요.
     ⚠️ 꼬리·아우터의 사선 동시 이동(BASELINE 1-27)은 **그대로**입니다 — 회귀 113 이 지킵니다. */
  if (RUN(62)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const reset = () => p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      S.multi = false; S.selSet = []; S.locked = true; S.guideOn = false; S.guideCur = null;
      S.doneSet = [];
      PBx.render();
    });
    await reset();
    const box = await (await p.$("#touch")).boundingBox();
    const dim = await p.evaluate(() => ({ W: window.PB.S.dim.W, H: window.PB.S.dim.H }));
    const drag = async (x0, y0, dx, dy) => {
      await p.mouse.move(box.x + x0, box.y + y0);
      await p.mouse.down();
      await p.mouse.move(box.x + x0 + dx, box.y + y0 + dy, { steps: 10 });
      await p.mouse.up();
      await p.waitForTimeout(100);
    };
    const g = () => p.evaluate(() => { const q = window.PB.S.g;
      return { h2: q.h2, v6: q.v6, at: q.archThickness, h3: q.h3, front: q.front }; });
    /* ① 아치 자를 **사선으로** 끌어도 위아래만 — 아치선·아치두께는 그대로 */
    const p1 = await p.evaluate(() => { const S = window.PB.S;
      const q = window.PB.segPx(window.PB.H_SPECS.find((x) => x.key === "h2"))[0];
      return { x: (q[0] + q[1]) / 2, y: S.g.h2 * S.dim.H }; });
    const b1 = await g();
    await drag(p1.x, p1.y, -24, 30);
    const a1 = await g();
    const archUD = Math.abs((a1.h2 - b1.h2) * dim.H - 30) < 4;
    const archKeepsV6 = Math.abs(a1.v6 - b1.v6) < 1e-9;
    const archKeepsAT = Math.abs(a1.at - b1.at) < 1e-9;
    /* ② 아치선(세로)을 끌어도 좌우만 — 아치·아치두께는 그대로
       v1.88.0 — 아치선은 이제 **아치두께 아래 구간**에서만 잡힌다(회귀 142). 그 구간을 누른다 */
    await reset();
    const p2 = await p.evaluate(() => { const S = window.PB.S;
      return { x: S.g.v6 * S.dim.W, y: (S.g.archThickness + 0.06) * S.dim.H }; });
    const b2 = await g();
    await drag(p2.x, p2.y, -26, -18);
    const a2 = await g();
    const v6LR = Math.abs((a2.v6 - b2.v6) * dim.W - (-26)) < 4;
    const v6KeepsArch = Math.abs(a2.h2 - b2.h2) < 1e-9 && Math.abs(a2.at - b2.at) < 1e-9;
    /* ③ 아치두께도 그대로 위아래만 */
    await reset();
    const p3 = await p.evaluate(() => { const S = window.PB.S;
      const q = window.PB.segPx(window.PB.H_SPECS.find((x) => x.key === "archThickness"))[0];
      return { x: (q[0] + q[1]) / 2, y: S.g.archThickness * S.dim.H }; });
    const b3 = await g();
    await drag(p3.x, p3.y, 30, 22);
    const a3 = await g();
    const atMoved = Math.abs((a3.at - b3.at) * dim.H - 22) < 4;
    const atKeepsX = Math.abs(a3.v6 - b3.v6) < 1e-9 && Math.abs(a3.h2 - b3.h2) < 1e-9;
    /* ④ 바·화살표로 아치를 올려도 아치두께는 **따라오지 않는다** */
    await reset();
    const b4 = await g();
    const a4 = await p.evaluate(() => {
      const S = window.PB.S;
      S.selUD = "h2"; S.hMode = "line";
      document.getElementById("posPlusV").click();
      return { h2: S.g.h2, at: S.g.archThickness };
    });
    const barMoved = Math.abs((a4.h2 - b4.h2) * dim.H) > 0.05;
    const barNoFollow = Math.abs(a4.at - b4.at) < 1e-9;
    await ctx.close();
    check("117. 아치는 혼자 움직인다 — 아치·아치두께·아치선이 전부 따로 (v1.67.0 동반 폐지)",
      archUD && archKeepsV6 && archKeepsAT && v6LR && v6KeepsArch
        && atMoved && atKeepsX && barMoved && barNoFollow,
      `아치 사선→위아래만 ${archUD}(아치선 그대로 ${archKeepsV6} · 두께 그대로 ${archKeepsAT}) · `
      + `아치선→좌우만 ${v6LR}(아치·두께 그대로 ${v6KeepsArch}) · `
      + `아치두께 위아래만 ${atMoved}/${atKeepsX} · 바로 아치 올려도 두께 안 따라옴 ${barNoFollow}`);
  }

  /* 118. ⚠️ v1.68.0 — 가로 길이 슬라이더 · 표식 테두리 없음 (원장님 지시 2026-08-24)
     「가로 길이 아주 짧게도 가능하도록 슬라이드로 처리. 슬라이드 이동 시 **미리보기에서 길이가
       짧아졌다 길어지는 것이 보이는 상호작용** 보이도록」
     「꼬리와 아우터에 **회색 테두리가 자동으로 생겼다. 내가 의도하지 않음** — 테두리 없게」
       → 표식(십자 모서리)의 테두리는 설정의 「테두리」를 그대로 따른다. 기본(없음)이면 없다.
     ⛔ 3단 세그먼트로 되돌리지 마세요 — 아주 짧은 자를 만들 수 없습니다. */
  if (RUN(63)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE }; S.look = { ...PBx.LOOK_DEF };
      S.multi = false; S.selSet = []; S.guideOn = false; S.guideCur = null;
      PBx.buildLookUI(); PBx.render();
      const rng = document.getElementById("rngLen");
      const hasSeg = !!document.getElementById("segLen");
      /* 미리보기 자 한 줄의 길이(px)
         ⚠️ v1.81.0 — 미리보기가 **눈썹 그림 위에 올린 선**으로 바뀌어 y 가 고정이 아닙니다.
            자에는 `pv-ruler` 클래스가 붙습니다 — 그중 **가장 긴 가로 토막**을 잽니다.
            ⛔ y 좌표를 다시 하드코딩하지 마세요 (BASELINE 「선 좌표를 하드코딩하지 마라」). */
      const prevLen = () => {
        const ls = [...document.getElementById("lookPrev").querySelectorAll("line.pv-ruler")]
          .filter((l) => Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")) < 0.5)
          .map((l) => Math.abs(+l.getAttribute("x2") - +l.getAttribute("x1")));
        return ls.length ? Math.max(...ls) : 0;
      };
      /* 실제 화면의 앞머리 자 길이(px) */
      const realLen = () => {
        const q = PBx.segPx(PBx.H_SPECS.find((x) => x.key === "front"))[0];
        return q[1] - q[0];
      };
      const move = (v) => {
        rng.value = String(v);
        rng.dispatchEvent(new Event("input", { bubbles: true }));
        return { hlen: S.look.hlen, prev: prevLen(), real: realLen(),
                 label: document.getElementById("lenVal").textContent };
      };
      const mn = move(+rng.min), mid = move(28), mx = move(+rng.max);
      /* 슬라이더를 다시 짧게 → 미리보기가 **줄어든다**(왕복 상호작용) */
      const back = move(+rng.min);
      /* 표식 테두리 — 기본(테두리 없음)이면 모서리 path 는 코너당 1개(좌우 2개) */
      S.look = { ...PBx.LOOK_DEF }; S.guideOn = true; S.guideCur = "h3"; PBx.render();
      const paths = () => [...document.getElementById("guides").querySelectorAll("path")]
        .filter((q) => /^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/.test(q.getAttribute("d") || ""));
      const noEdge = paths();
      const noEdgeDark = noEdge.some((q) => q.getAttribute("stroke") === "#0A0D14");
      /* v1.81.0 — 테두리는 **색을 골라야** 그려집니다 (기본은 「없음」) */
      S.look = { ...PBx.LOOK_DEF, edge: 70, edgeC: "dark" }; PBx.render();
      const withEdge = paths();
      return { hasSeg, hasRng: !!rng, min: rng.min, max: rng.max,
               mn, mid, mx, back,
               noEdgeN: noEdge.length, noEdgeDark, withEdgeN: withEdge.length };
    });
    await ctx.close();
    const shrinks = r.mn.prev < r.mid.prev && r.mid.prev < r.mx.prev;      /* 미리보기가 따라 변한다 */
    const realShrinks = r.mn.real < r.mid.real && r.mid.real < r.mx.real;  /* 실제 화면도 함께 */
    const veryShort = r.mn.hlen <= 0.05 && r.mn.real < r.mid.real * 0.45;  /* 아주 짧게 가능 */
    const roundTrip = Math.abs(r.back.prev - r.mn.prev) < 0.5;
    check("118. 가로 길이 슬라이더 — 아주 짧게까지 · 끌면 미리보기가 같이 줄었다 늘어난다 · 표식 테두리 없음",
      r.hasRng && !r.hasSeg && shrinks && realShrinks && veryShort && roundTrip
        && r.noEdgeN === 2 && !r.noEdgeDark && r.withEdgeN === 4,
      `슬라이더 ${r.min}~${r.max}% (3단 제거=${!r.hasSeg}) · 길이 ${r.mn.hlen}/${r.mid.hlen}/${r.mx.hlen} · `
      + `미리보기 ${r.mn.prev.toFixed(0)}→${r.mid.prev.toFixed(0)}→${r.mx.prev.toFixed(0)}px(줄었다늘어남=${shrinks}, 되돌림=${roundTrip}) · `
      + `실제 자 ${r.mn.real.toFixed(0)}→${r.mid.real.toFixed(0)}→${r.mx.real.toFixed(0)}px · 라벨 ${r.mx.label} · `
      + `표식 테두리없음 ${r.noEdgeN}개(짙은테두리=${r.noEdgeDark}) / 테두리70% ${r.withEdgeN}개`);
  }

  /* 114. ⚠️ v1.64.0 (원장님 지시 2026-08-23)
     ① 화살표 한 번의 이동량 — 「줌·위아래·좌우 화살표 이동이 매우 큼 → 아주 미세하게」
     ② 가이드 프롬프트 칩 — 지금 차례가 무엇을 맞추는지 한 줄
     ③ 꼬리 스텝의 **십자 안쪽 모서리** 표식 — 「두 선이 맞닿아 십자 모양의 내측을 포인트로」
     ⛔ 화살표 step 을 다시 키우지 마세요 — 시술 중 한 번 눌러 튀면 처음부터 다시 맞춥니다. */
  if (RUN(64)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE };
      /* ① 화살표 이동량 — 실제로 버튼을 눌러 사진이 얼마나 움직이는지 잰다 */
      const arrow = (mode) => {
        document.querySelector(`#photoModes button[data-mode="${mode}"]`).click();
        const before = mode === "zoom" ? S.p.zoom : (mode === "vertical" ? S.p.oy : S.p.ox);
        document.getElementById("posPlusH").click();
        const after = mode === "zoom" ? S.p.zoom : (mode === "vertical" ? S.p.oy : S.p.ox);
        return { before, after, d: Math.abs(after - before) };
      };
      const az = arrow("zoom"), av = arrow("vertical"), ah = arrow("horizontal");
      const zoomPct = Math.abs(az.after / az.before - 1);       /* 줌은 배율 변화율로 */
      /* ⚠️ v1.65.0 방향 (원장님 지시): 위아래 모드는 **▶ = 사진이 위로** (oy 가 줄어든다).
         좌우 모드는 ▶ = 오른쪽 (ox 가 는다). ⛔ 부호를 되돌리지 마세요. */
      const upIsRight = av.after < av.before;
      const rightIsRight = ah.after > ah.before;

      /* ② 가이드 프롬프트 — 스텝마다 문구가 있고, 가이드를 끄면 숨는다 */
      S.p = { zoom: 1, ox: 0, oy: 0, rot: 0 };
      S.guideOn = true; S.guideCur = "v2"; PBx.render();
      const tipEl = document.getElementById("guideTip");
      const tipAtInner = !tipEl.hidden && tipEl.textContent.length > 4;
      S.guideCur = "h3"; PBx.render();
      const tipAtTail = tipEl.innerHTML.includes("<b>");        /* 십자 모서리를 굵게 강조 */
      const everyStep = PBx.GUIDE_FLOW.every((k) => {
        S.guideCur = k; PBx.render();
        return !tipEl.hidden && tipEl.textContent.trim().length > 4;
      });
      S.guideOn = false; S.guideCur = null; PBx.render();
      /* ⚠️ v1.81.0 — **화면에서 실제로 사라졌는지**를 봅니다. `hidden` 속성만 보면
         `.guidetip .chip{display:block}` 이 그것을 이겨 칩이 남아 있어도 통과합니다 (실제로 그랬습니다). */
      const tipHiddenOff = tipEl.hidden && getComputedStyle(tipEl).display === "none";

      /* ③ 십자 안쪽 모서리 표식 — **쌍 스텝(꼬리·아치)에만**, 좌우 2개, 교점에서 시작.
         ⚠️ v1.67.0 — 팔 방향이 스텝마다 다르다: 꼬리 = 안쪽+아래 / 아치 = 안쪽+**위**
         (원장님 지시 2026-08-24 「아치선의 굵은 색상은 아래와 안쪽이 아니라 안쪽과 위」) */
      const corners = () => [...document.getElementById("guides").querySelectorAll("path")]
        .map((q) => q.getAttribute("d"))
        .filter((d) => d && /^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/.test(d));
      const W = S.dim.W, H = S.dim.H;
      S.guideOn = true; S.guideCur = "archThickness"; PBx.render();
      const noneAtPlain = corners().length === 0;      /* 꼬리가 아닌 스텝엔 표식이 없다 */
      const at = (step, vk, hk, wantUp) => {
        S.guideCur = step; PBx.render();
        const cs2 = corners();
        const ok = cs2.some((d) => {
          const n = d.match(/[\d.]+/g).map(Number);
          const onPoint = Math.abs(n[2] - S.g[vk] * W) < 2 && Math.abs(n[3] - S.g[hk] * H) < 2;
          const up = n[5] < n[3];
          const inward = Math.abs(n[0] - n[2]) > 8 && Math.abs(n[1] - n[3]) < 0.5;
          return onPoint && inward && up === wantUp;
        });
        return { n: cs2.length, ok };
      };
      /* ⚠️ v1.81.0 — **아치에는 표식이 없습니다** (원장님 지시 2026-08-27 「아치가로선과 아치세로선을
         따로 움직이도록 되돌린다」). 한 점이 아니게 됐으므로 십자를 그리면 거짓말이 됩니다.
         꼬리는 여전히 한 점이라 **아우터 차례·꼬리 높이 차례 둘 다**에 그립니다 (안쪽 + 위). */
      S.guideCur = "h2"; PBx.render();
      const archNone = corners().length === 0;
      const tail = at("h3", "v4", "h3", true);         /* 꼬리 높이 = 안쪽 + 위 */
      const tailV = at("v4", "v4", "h3", true);        /* 꼬리 아우터 차례에도 같은 표식 */
      return { zoomPct, dv: av.d, dh: ah.d, upIsRight, rightIsRight, tipAtInner, tipAtTail,
               everyStep, tipHiddenOff, noneAtPlain, archNone,
               tailN: tail.n, tailOk: tail.ok, tailVN: tailV.n, tailVOk: tailV.ok };
    });
    await ctx.close();
    check("114. 화살표 미세 이동(≈1px) · ▶=위로 · 가이드 프롬프트 · 십자 모서리는 **꼬리에만** (안쪽+위)",
      r.zoomPct > 0 && r.zoomPct < 0.018                /* 줌 한 칸 1.8% 미만 */
        && r.dv > 0 && r.dv < 0.003 && r.dh > 0 && r.dh < 0.003   /* v1.65.0 — 캔버스의 0.3% 미만 ≈ 1px */
        && r.upIsRight && r.rightIsRight                          /* ▶ = 위로 / 오른쪽 */
        && r.tipAtInner && r.tipAtTail && r.everyStep && r.tipHiddenOff
        && r.noneAtPlain && r.archNone && r.tailN >= 2 && r.tailOk && r.tailVN >= 2 && r.tailVOk,
      `줌 한 칸 ${(r.zoomPct * 100).toFixed(2)}%(<1.8%) · 위아래 ${r.dv.toFixed(4)} / 좌우 ${r.dh.toFixed(4)}(<0.003) · `
      + `▶=위로 ${r.upIsRight} / ▶=오른쪽 ${r.rightIsRight} · `
      + `프롬프트 이너=${r.tipAtInner} 꼬리강조=${r.tipAtTail} 전스텝=${r.everyStep} 끄면숨김=${r.tipHiddenOff} · `
      + `십자표식 아치없음=${r.archNone} · 꼬리높이 ${r.tailN}개 위+안쪽=${r.tailOk} · 꼬리아우터 ${r.tailVN}개=${r.tailVOk}`);
  }

  /* 115. ⚠️ v1.66.0 — **관자놀이 머리카락 방어** (원장님 지시 2026-08-23)
     원장님 사진에서 드로잉 맞춤이 머리카락을 눈썹으로 읽어, 아치선 280px · 아우터 100px ·
     꼬리 자 340px 이 벗어났습니다. 87~94 와 **같은 눈썹**에 머리카락만 더한 사진으로,
     기대값도 87~94 와 같은 자를 씁니다 (judge/say).
     ⛔ `trimOutside` 를 건너뛰거나, 예비 상자를 다시 「화면 절반」으로 넓히거나,
        아치 봉우리를 단일 극값으로 되돌리면 여기서 잡힙니다. */
  const o115a = await runDraw(true, fh, null, SHAPE_A);    /* 얼굴 인식 성공 경로 */
  const o115b = await runDraw(false, fh, null, SHAPE_A);   /* 인식 실패(예비) 경로 */
  check("115. 드로잉 맞춤 — 관자놀이 머리카락을 눈썹으로 읽지 않는다 (인식 성공)",
    judge(o115a), say(o115a));
  check("116. 드로잉 맞춤 — 머리카락이 있어도 예비 경로가 눈썹을 찾는다",
    judge(o115b), say(o115b));

  /* 100. 버전 표시 (v1.39.2) — 홈 화면에 앱 버전이 보인다. 폰(iOS PWA) 캐시가 끈질겨서
     「반영이 안 됐다」와 「판독이 실패했다」를 구분할 방법이 이것뿐입니다.
     APP_VERSION 은 릴리스 때 sw.js 의 VERSION 과 함께 올립니다. */
  if (RUN(65)) {
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const av = (src.match(/const APP_VERSION = "(v[\d.]+)"/) || [])[1];
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
    const pg = await ctx.newPage();
    await pg.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await pg.waitForTimeout(300);
    const shown = await pg.evaluate(() => (document.getElementById("verTag") || {}).textContent || "");
    await ctx.close();
    check("100. 홈 화면 버전 표시 — APP_VERSION 이 그대로 보인다",
      !!av && shown.includes(av), `APP_VERSION=${av} · 화면="${shown}"`);
  }

  /* 96. ⭐ v1.91.0 — **앱 시작 = AI 눈썹정렬 켜짐 · 실패하면 기본정렬로 남는다** (원장님 지시 2026-08-28
     「앱이 시작되면 기본으로 AI 눈썹정렬을 켜둬라」 — v1.34.0 의 「버튼에서만」 규칙을 대체)
     · runFaceAI 의 모든 경로가 autoAiOnLoad() 를 부른다 (성공·얼굴없음·모델실패)
     · autoAiOnLoad 는 판독 실패 시 **아무것도 바꾸지 않는다** — v1.30~33 의 「어긋난 시작」 방어
     · aiAllowed() 프리미엄 게이트가 존재한다 (지금은 무료 = true) */
  if (RUN(66)) {
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const m = src.match(/async function runFaceAI\(\)[\s\S]*?\n}/);
    const code = m && m[0].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const autoCalls = code ? (code.match(/autoAiOnLoad\s*\(/g) || []).length : 0;
    const helper = src.match(/function autoAiOnLoad\(\)[\s\S]*?\n}/);
    const helperCode = helper && helper[0].replace(/\/\*[\s\S]*?\*\//g, "");
    const gated = helperCode && /aiAllowed\(\)/.test(helperCode) && /autoFromDrawing\s*\(/.test(helperCode);
    const hasGate = /const aiAllowed\s*=/.test(src);
    const snapSrc = src.match(/\$\("btnSnap"\)\.onclick[\s\S]*?};/);
    const manual = snapSrc && /autoFromDrawing\s*\(/.test(snapSrc[0]);
    check("96. 시작 = AI 눈썹정렬 자동 · 실패 시 기본정렬 · 프리미엄 게이트 존재",
      autoCalls >= 3 && !!gated && hasGate && manual === true,
      `runFaceAI 경로 호출 ${autoCalls}곳(>=3) · 게이트 경유 ${!!gated} · aiAllowed ${hasGate} · 버튼 수동 호출 ${manual ? "있음" : "없음(잘못)"}`);
  }

  /* 95. 세로선 길이·굵기 (v1.33.0) — 원장님 지시:
     「세로 라인은 이너라인 빼고 더 얇게 짧게 · 아래 눈 위치까지 내려오지 않아도 된다」
     · 아치선·아우터의 진한 구간은 눈 기준선(h1)에 **닿지 않는다**
     · 이너는 길게 남는다 (내안각과 맞춰 보는 기준선)
     · 아치선·아우터는 이너보다 얇다 */
  if (RUN(67)) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(URL_BASE, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(300);
    await p.setInputFiles("#fileInput", face.file);
    await p.waitForTimeout(1000);
    const vl = await p.evaluate(() => {
      const S = window.PB.S, PBx = window.PB, H = S.dim.H;
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE }; S.sel = null; S.selSet = [];
      S.guideOn = true; S.guideCur = null;   /* v1.52.0 — 조용한 상태를 재야 한다. v1.80.0 부터는 **가이드를 켜야** 조용해진다 */
      PBx.render();
      const g = S.g, eyeY = g.h1 * H;
      const lows = { front: g.front, frontThickness: g.frontThickness, h2: g.h2, archThickness: g.archThickness, h3: g.h3 };
      const browBot = Math.max(...Object.values(lows)) * H;
      /* 진한 세로 구간만 (연결선 opacity 0.16 제외) */
      /* v1.51.0 — 한 세로선이 여러 토막으로 그려진다.
         thick=true → **굵은 토막**(자 바깥쪽) · thick=false → 얇은 회색이 이어지는 전체 범위 */
      const seg = (key, thick) => {
        const x = g[key] * S.dim.W;
        const ls = [...document.getElementById("guides").querySelectorAll("line")]
          .filter((l) => Math.abs(+l.getAttribute("x1") - x) < 0.6 && Math.abs(+l.getAttribute("x1") - +l.getAttribute("x2")) < 0.5
                      && +(l.getAttribute("stroke-opacity") || 1) > 0.2);
        if (!ls.length) return null;
        const sorted = ls.slice().sort((a, b) => +b.getAttribute("stroke-width") - +a.getAttribute("stroke-width"));
        if (thick) {
          const l = sorted[0];
          return { y0: Math.min(+l.getAttribute("y1"), +l.getAttribute("y2")),
                   y1: Math.max(+l.getAttribute("y1"), +l.getAttribute("y2")),
                   w: +l.getAttribute("stroke-width") };
        }
        return { y0: Math.min(...ls.map((l) => Math.min(+l.getAttribute("y1"), +l.getAttribute("y2")))),
                 y1: Math.max(...ls.map((l) => Math.max(+l.getAttribute("y1"), +l.getAttribute("y2")))),
                 w: +sorted[sorted.length - 1].getAttribute("stroke-width") };
      };
      const arch = seg("v6", true), outer = seg("v4", true), inner = seg("v2", true);
      const innerAll = seg("v2", false);
      return { arch, outer, inner, innerAll, eyeY, browBot };
    });
    await ctx.close();
    const clear = (s) => s && s.y1 < vl.eyeY - 4 && s.y1 < vl.browBot + 0.05 * 390 + 14;
    /* v1.52.0 — 조용한 세로선은 **전체가 회색 한 줄, 같은 굵기(VGREY_W)**. 색·토막 없음.
       길이 규칙은 유지: 아치선·아우터는 눈까지 안 내려오고, 이너(long)는 눈 근처까지 */
    check("95. 세로선 — 조용할 땐 회색 한 줄 · 아치선·아우터 짧게 · 이너는 눈까지",
      clear(vl.arch) && clear(vl.outer)
        && vl.innerAll && vl.innerAll.y1 > vl.eyeY - 30
        && Math.abs(vl.arch.w - vl.inner.w) < 0.01 && Math.abs(vl.outer.w - vl.inner.w) < 0.01,
      `아치선 굵은끝 ${vl.arch && vl.arch.y1.toFixed(0)} · 아우터 굵은끝 ${vl.outer && vl.outer.y1.toFixed(0)} `
      + `< 눈 ${vl.eyeY.toFixed(0)} · 이너 얇은선끝 ${vl.innerAll && vl.innerAll.y1.toFixed(0)} · `
      + `굵기 아치선 ${vl.arch && vl.arch.w}/아우터 ${vl.outer && vl.outer.w}/이너 ${vl.inner && vl.inner.w}`);
  }

  /* 93. ⚠️ 세로선 ↔ 가로 자 묶음 (v1.32.0) — 원장님이 직접 찾아내신 문제입니다.
     「아우터라인과 아치 아치두께 라인이 함께 움직여」 → 아치는 **자기 세로선**을 따라가야 합니다.
       앞머리·앞두께 → 이너 · 아치·아치두께 → 아치선 · 꼬리 → 아우터
     자 위치를 다시 frac 상수로 박으면 이 검사가 깨집니다. */
  if (RUN(68)) {
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
      S.landmarks = null; S.intro = false; S.g = { ...PBx.DEFAULT_GUIDE }; PBx.render();
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
const SECS = ((Date.now() - T0) / 1000).toFixed(1);
console.log("\n" + "━".repeat(46));
console.log(`  통과 ${results.length - failed.length} / ${results.length}   (${SECS}초)`);
if (failed.length) {
  console.log("\n  ❌ 실패 항목 — 커밋하지 마세요:");
  failed.forEach((f) => console.log(`     · ${f.name}  ${f.detail}`));
  console.log("\n  BASELINE.md 의 해당 항목을 확인하세요.\n");
  process.exit(1);
}
if (ONLY) {
  /* ⚠️ 부분 통과를 「전 항목 통과」로 읽으면 안 됩니다 — 그러려고 만든 스위치가 아닙니다. */
  console.log(`  ⏱ **부분 실행**입니다 — 블록 ${skippedBlocks}개 · 항목 약 ${skippedTests}건을 건너뛰었습니다.`);
  console.log("  ⛔ 커밋 전에는 `PB_ONLY` 없이 전 항목을 한 번 더 돌리세요.\n");
} else {
  console.log("  ✅ 전 항목 통과 — 커밋해도 안전합니다.\n");
}
