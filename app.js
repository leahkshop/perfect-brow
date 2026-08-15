/* ═══════════════════════════════════════════════════════════════
   Perfect Brow — 눈썹 밸런스 가이드
   클린 재구축 버전 (Manus 종속 제거 / 브라우저 단독 실행)

   구조
     1. i18n            다국어
     2. SPEC/DEFAULTS   라인 정의 · 기본값  (BASELINE_CONFIG.md 계승)
     3. state           앱 상태
     4. render          사진 변환 + SVG 가이드라인
     5. gesture         라인 직접 드래그 / 핀치 줌 / 회전 / 팬
     6. panels          위치 조절 · 사진 보정
     7. presets         저장 / 불러오기 / 이름변경 / 삭제
     8. faceAI          MediaPipe 얼굴 랜드마크 자동 정렬 (+ 서버 AI 훅)
     9. export          결과 이미지 PNG 저장
   ═══════════════════════════════════════════════════════════════ */

/* ── 서버 AI 훅 ────────────────────────────────────────────────
   비워두면 기기 내 MediaPipe만 사용합니다 (인터넷/서버 불필요).
   자체 서버를 쓰려면 아래에 엔드포인트를 넣으세요.
   POST { imageUrl: "data:image/..." }  →  FaceAnalysisResult JSON 반환
   ───────────────────────────────────────────────────────────── */
const SERVER_AI_ENDPOINT = "";

/* ═══════════ 1. i18n ═══════════ */
const I18N = {
  ko: {
    home_title: "Perfect Brow",
    home_subtitle: "전문가용 눈썹 디자인 도구",
    home_description:
      "AI 기반 정밀 가이드로 완벽한 눈썹 대칭과 밸런스를 잡습니다.\nPMU 아티스트와 눈썹 디자이너를 위한 전문 도구입니다.",
    home_footer: "전문가용 눈썹 측정 도구",
    select_photo: "사진 선택",
    editor_reset: "초기화",
    editor_align: "동공정렬",
    editor_preset: "프리셋",
    editor_preset_save: "현재 설정 저장",
    editor_load_preset: "프리셋",
    editor_preset_load: "프리셋",
    editor_photo_lock: "사진잠금",
    editor_photo_unlock: "잠금해제",
    editor_export: "이미지저장",
    editor_change_photo: "사진변경",
    pick_1: "① 왼쪽 눈동자 중앙을 탭하세요",
    pick_2: "② 오른쪽 눈동자 중앙을 탭하세요",
    pick_done: "동공 기준 자동 정렬 완료",
    pick_cancel: "정렬을 취소했습니다",
    editor_inner_angle: "V Center Pivot",
    editor_outer_angle: "V Angle",
    editor_photo_adjustment: "사진 보정",
    editor_zoom: "줌",
    editor_vertical: "위아래",
    editor_horizontal: "좌우",
    editor_balance: "밸런스",
    editor_save: "저장",
    editor_cancel: "취소",
    editor_delete: "삭제",
    editor_load: "로드",
    editor_edit: "수정",
    editor_close: "닫기",
    panel_position: "위치 조절",
    panel_lines: "가이드 라인",
    hint_linebtn: "1번 탭 = 선택 · 다시 탭 = 숨김/표시",
    preset_rename: "프리셋 이름 변경",
    preset_none: "저장된 프리셋이 없습니다",
    preset_saved: "프리셋이 저장되었습니다",
    preset_deleted: "프리셋이 삭제되었습니다",
    preset_loaded: "프리셋을 적용했습니다",
    preset_enter_name: "프리셋 이름을 입력하세요",
    preset_builtin: "기본",
    ai_loading: "AI 얼굴 인식 중…",
    ai_ok: "AI 자동 정렬 완료",
    ai_fail: "AI 사용 불가 · [동공정렬]을 눌러 정렬하세요",
    ai_noface: "얼굴 인식 실패 · [동공정렬]을 눌러 정렬하세요",
    hint_updown: "◀ 아래　　위 ▶",
    hint_leftright: "◀ 왼쪽　　오른쪽 ▶",
    hint_narrowwide: "◀ 좁게　　넓게 ▶",
    hint_zoom: "◀ 축소　　확대 ▶",
    hint_photo_ud: "◀ 위로　　아래로 ▶",
    hint_photo_lr: "◀ 왼쪽　　오른쪽 ▶",
    hint_photo_bal: "◀ 반시계　　시계 ▶",
    hint_drag: "화면의 선을 손가락으로 직접 끌어서 옮길 수 있습니다",
    locked_msg: "사진이 잠겨 있습니다 (선은 계속 조절 가능)",
    unlocked_msg: "사진 잠금 해제",
    saved_img: "이미지를 저장했습니다",
    export_fail: "이미지 저장에 실패했습니다",
    reset_done: "기본값으로 되돌렸습니다",
    install_ios:
      "<b>홈 화면에 앱으로 설치하기</b><br>사파리 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b> 를 누르면 앱 아이콘이 생기고 전체화면으로 실행됩니다.",
    install_android:
      "<b>홈 화면에 앱으로 설치하기</b><br>크롬 우측 상단 <b>⋮ 메뉴</b> → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b> 를 누르세요.",
    install_desktop:
      "<b>앱으로 설치하기</b><br>주소창 오른쪽의 <b>설치 아이콘</b>을 누르면 창 없이 앱처럼 실행됩니다.",
    p_natural: "자연스러운 눈썹",
    p_bold: "강한 눈썹",
    p_arch: "아치형 눈썹",
  },
  en: {
    home_title: "Perfect Brow",
    home_subtitle: "Professional Eyebrow Design Tool",
    home_description:
      "Achieve perfect eyebrow symmetry and balance with AI-powered precision guides.\nA professional tool for PMU artists and brow designers.",
    home_footer: "Professional Eyebrow Measurement Tool",
    select_photo: "Select Photo",
    editor_reset: "Reset",
    editor_align: "Pupil Align",
    editor_preset: "Presets",
    editor_preset_save: "Save current",
    editor_load_preset: "Presets",
    editor_preset_load: "Presets",
    editor_photo_lock: "Lock Photo",
    editor_photo_unlock: "Unlock",
    editor_export: "Save Image",
    editor_change_photo: "Change Photo",
    pick_1: "① Tap the centre of the left pupil",
    pick_2: "② Tap the centre of the right pupil",
    pick_done: "Aligned to pupils",
    pick_cancel: "Alignment cancelled",
    editor_inner_angle: "V Center Pivot",
    editor_outer_angle: "V Angle",
    editor_photo_adjustment: "Photo Adjustment",
    editor_zoom: "Zoom",
    editor_vertical: "Vertical",
    editor_horizontal: "Horizontal",
    editor_balance: "Balance",
    editor_save: "Save",
    editor_cancel: "Cancel",
    editor_delete: "Delete",
    editor_load: "Load",
    editor_edit: "Edit",
    editor_close: "Close",
    panel_position: "Position",
    panel_lines: "Guide Lines",
    hint_linebtn: "Tap = select · tap again = show/hide",
    preset_rename: "Rename Preset",
    preset_none: "No saved presets",
    preset_saved: "Preset saved",
    preset_deleted: "Preset deleted",
    preset_loaded: "Preset applied",
    preset_enter_name: "Enter preset name",
    preset_builtin: "Built-in",
    ai_loading: "Detecting face…",
    ai_ok: "Auto-aligned",
    ai_fail: "AI unavailable · use [Pupil Align]",
    ai_noface: "No face found · use [Pupil Align]",
    hint_updown: "◀ down　　up ▶",
    hint_leftright: "◀ left　　right ▶",
    hint_narrowwide: "◀ narrow　　wide ▶",
    hint_zoom: "◀ out　　in ▶",
    hint_photo_ud: "◀ up　　down ▶",
    hint_photo_lr: "◀ left　　right ▶",
    hint_photo_bal: "◀ ccw　　cw ▶",
    hint_drag: "Drag any line directly on the photo to move it",
    locked_msg: "Photo locked (lines still adjustable)",
    unlocked_msg: "Photo unlocked",
    saved_img: "Image saved",
    export_fail: "Could not save image",
    reset_done: "Reset to defaults",
    install_ios:
      "<b>Install to Home Screen</b><br>Safari <b>Share</b> → <b>Add to Home Screen</b>.",
    install_android:
      "<b>Install to Home Screen</b><br>Chrome <b>⋮ menu</b> → <b>Install app</b>.",
    install_desktop:
      "<b>Install as app</b><br>Click the <b>install icon</b> in the address bar.",
    p_natural: "Natural Brow",
    p_bold: "Bold Brow",
    p_arch: "Arched Brow",
  },
};
let LANG = localStorage.getItem("pb_lang") || "ko";
const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.ko[k] || k;

/* ═══════════ 2. 라인 정의 · 기본값 ═══════════ */
/* 색상/기본위치는 원본 editor.tsx + BASELINE_CONFIG.md 를 그대로 계승 */

const H_SPECS = [
  { key: "h1", vis: "h1Visible", label: "Eye",   color: "#FF0000", w: 2.6, op: 1,   segs: [[0, 1]] },
  { key: "front", vis: "frontVisible", label: "Front", color: "#111111", w: 2, op: 0.9, segs: [[0.30, 0.70]] },
  { key: "frontThickness", vis: "frontThicknessVisible", label: "F.T", color: "#111111", w: 2, op: 0.9, segs: [[0.36, 0.64]] },
  { key: "h2", vis: "h2Visible", label: "Arch",  color: "#0066FF", w: 2, op: 0.95, segs: [[0, 0.40], [0.60, 1]] },
  { key: "archThickness", vis: "archThicknessVisible", label: "A.T", color: "#0066FF", w: 2, op: 0.95, segs: [[0, 0.40], [0.60, 1]] },
  { key: "h3", vis: "h3Visible", label: "Tail",  color: "#7B2CBF", w: 2, op: 0.95, segs: [[0, 0.20], [0.80, 1]] },
];

const V_SPECS = [
  { key: "v1", vis: "v1Visible", label: "Center", color: "#111111", w: 1.8, op: 1,   mirror: null },
  { key: "v2", vis: "v2Visible", label: "Inner",  color: "#111111", w: 1.6, op: 0.6, mirror: "v3" },
  { key: "v4", vis: "v4Visible", label: "Outer",  color: "#0066FF", w: 1.6, op: 1,   mirror: "v5" },
];

const ALL_VIS = [
  "h1Visible", "h2Visible", "h3Visible", "archThicknessVisible",
  "frontVisible", "frontThicknessVisible",
  "v1Visible", "v2Visible", "v4Visible",
  "baseStructureVisible", "eyeGuideVisible",
];

const DEFAULT_GUIDE = Object.freeze({
  h1: 0.5,   h1Visible: true,
  h2: 0.34,  h2Visible: false,
  h3: 0.43,  h3Visible: false,
  archThickness: 0.38, archThicknessVisible: false,
  front: 0.40, frontVisible: false,
  frontThickness: 0.35, frontThicknessVisible: false,
  v1: 0.5,   v1Visible: true,
  v2: 0.35,  v2Visible: true,
  v3: 0.65,
  v4: 0.15,  v4Visible: false,
  v5: 0.85,
  eyeGuideVisible: true,
  innerAngle: 0.40,      // Pivot Point Y (0=위, 1=아래)
  outerAngle: 0.50,      // V 벌어짐 (0.5 = 수평)
  baseStructureVisible: false,
});
const DEFAULT_PHOTO = Object.freeze({ zoom: 1, ox: 0, oy: 0, rot: 0 });

const V_ANGLE_MAX = 40;   // V Angle 최대 각도(도)
const ROT_MAX = 30;       // 밸런스(회전) 최대 각도(도)
const ZOOM_MIN = 0.5, ZOOM_MAX = 8;
const OFFSET_MAX = 1.0;   // 사진 좌우/위아래 이동 한계 (캔버스 비율)
const SLIDER_OFFSET = 0.5;// 좌우/위아래 슬라이더 범위 (드래그는 OFFSET_MAX 까지)
const HIT_PX = 24;        // 라인 드래그 인식 반경
const EYE_FRAC = 0.30;    // 자동 정렬 시 동공 간 거리 / 캔버스 폭
/* 인체 계측 평균비 — 동공 간 거리 기준 (동공 오프셋 = 1.0) */
const R_INNER = 0.52;     // 눈 앞머리(내안각)
const R_OUTER = 1.50;     // 눈꼬리(외안각)

/* ═══════════ 3. state ═══════════ */
const S = {
  g: { ...DEFAULT_GUIDE },
  p: { ...DEFAULT_PHOTO },
  sel: "h1",
  photoMode: "zoom",
  locked: false,
  dim: { W: 0, H: 0 },
  iw: 0, ih: 0, s0: 1, fitW: 0, fitH: 0,
  hiddenSnapshot: null,
  landmarks: null,       // 마지막 AI 인식 결과 (초기화 시 재사용)
  imgEl: null,
  renamingId: null,
  pickMode: false,       // 동공 2점 지정 모드
  pick: [],
};

/* ═══════════ DOM ═══════════ */
const $ = (id) => document.getElementById(id);
const stage = $("stage"), photo = $("photo"), svg = $("guides"), touch = $("touch");
const hud = $("hud"), aiStatus = $("aiStatus");
const posSlider = $("posSlider"), phSlider = $("phSlider");

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SVGNS = "http://www.w3.org/2000/svg";

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("on"), 1900);
}
function showHud(html) {
  hud.innerHTML = html;
  hud.classList.add("show");
  clearTimeout(showHud._t);
  showHud._t = setTimeout(() => hud.classList.remove("show"), 900);
}

/* ═══════════ 4. render ═══════════ */

function measure() {
  const r = stage.getBoundingClientRect();
  S.dim.W = Math.max(1, Math.round(r.width));
  S.dim.H = Math.max(1, Math.round(r.height));
}

function renderPhoto() {
  const { W, H } = S.dim;
  if (!S.iw || !S.ih) return;
  S.s0 = Math.min(W / S.iw, H / S.ih);
  S.fitW = S.iw * S.s0;
  S.fitH = S.ih * S.s0;
  photo.style.width = S.fitW + "px";
  photo.style.height = S.fitH + "px";
  photo.style.transform =
    `translate(${S.p.ox * W}px, ${S.p.oy * H}px) scale(${S.p.zoom}) rotate(${S.p.rot}deg)`;
}

function mk(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function drawLine(frag, x1, y1, x2, y2, color, w, op) {
  // 흰색 헤일로 → 어떤 피부톤/배경에서도 선이 보이게
  frag.appendChild(mk("line", {
    x1, y1, x2, y2, stroke: "#ffffff", "stroke-width": w + 2.4,
    "stroke-opacity": 0.5, "stroke-linecap": "round",
  }));
  frag.appendChild(mk("line", {
    x1, y1, x2, y2, stroke: color, "stroke-width": w,
    "stroke-opacity": op, "stroke-linecap": "round",
  }));
}

const badgeW = (text) => Math.max(26, text.length * 6 + 12);

function drawBadge(frag, text, x, y, color, anchor) {
  const w = badgeW(text), h = 14;
  let bx = x;
  if (anchor === "middle") bx = x - w / 2;
  else if (anchor === "end") bx = x - w;
  bx = clamp(bx, 1, S.dim.W - w - 1);
  frag.appendChild(mk("rect", {
    x: bx, y, width: w, height: h, rx: 3, fill: color, "fill-opacity": 0.92,
  }));
  const tx = mk("text", {
    x: bx + w / 2, y: y + 10, fill: "#ffffff", "font-size": 8.5,
    "font-weight": "700", "text-anchor": "middle",
    "font-family": "system-ui,-apple-system,sans-serif",
  });
  tx.textContent = text;
  frag.appendChild(tx);
}

function renderGuides() {
  const { W, H } = S.dim, g = S.g;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const frag = document.createDocumentFragment();
  const hBadges = [], vBadges = [];   // 라벨은 겹치지 않게 나중에 한꺼번에 배치
  /* 상단 오버레이 칩(all line / V Center Pivot) 아래로 세로선 라벨 배치 */
  const V_LABEL_Y = Math.round(clamp(H * 0.14, 44, 98));

  /* 아몬드 눈 가이드 (Eye 라인 높이 · Inner 라인 기준) */
  if (g.eyeGuideVisible) {
    const cy = g.h1 * H;
    const xL = g.v2 * W, xR = (2 * g.v1 - g.v2) * W;
    const len = Math.max(24, Math.abs(g.v1 - g.v2) * W * 0.95);
    const bulge = len * 0.34;
    const almond = (x1, x2) => {
      const mx = (x1 + x2) / 2;
      const d = `M ${x1} ${cy} Q ${mx} ${cy - bulge} ${x2} ${cy} Q ${mx} ${cy + bulge} ${x1} ${cy} Z`;
      frag.appendChild(mk("path", { d, fill: "#ffffff", "fill-opacity": 0.16, stroke: "#000000", "stroke-opacity": 0.45, "stroke-width": 3 }));
      frag.appendChild(mk("path", { d, fill: "none", stroke: "#ffffff", "stroke-opacity": 0.95, "stroke-width": 1.4 }));
    };
    almond(xL, xL - len);
    almond(xR, xR + len);
  }

  /* 가로 라인 */
  for (const sp of H_SPECS) {
    if (!g[sp.vis]) continue;
    const y = g[sp.key] * H;
    const sel = S.sel === sp.key;
    for (const [a, b] of sp.segs) {
      drawLine(frag, a * W, y, b * W, y, sp.color, sel ? sp.w + 1.6 : sp.w, sel ? 1 : sp.op);
    }
    hBadges.push({ label: sp.label, color: sp.color, y: y - 17 });
  }
  /* 라벨 세로 겹침 제거 */
  hBadges.sort((a, b) => a.y - b.y);
  for (let i = 0; i < hBadges.length; i++) {
    hBadges[i].y = Math.max(hBadges[i].y, i ? hBadges[i - 1].y + 16 : 1);
  }
  for (let i = hBadges.length - 1; i >= 0; i--) {
    hBadges[i].y = Math.min(hBadges[i].y, i === hBadges.length - 1 ? H - 16 : hBadges[i + 1].y - 16);
    drawBadge(frag, hBadges[i].label, W - 3, Math.max(1, hBadges[i].y), hBadges[i].color, "end");
  }

  /* 세로 라인 (+ 대칭선) */
  for (const sp of V_SPECS) {
    if (!g[sp.vis]) continue;
    const sel = S.sel === sp.key;
    const w = sel ? sp.w + 1.6 : sp.w, op = sel ? 1 : sp.op;
    const x = g[sp.key] * W;
    drawLine(frag, x, 0, x, H, sp.color, w, op);
    vBadges.push({ label: sp.label, color: sp.color, x });
    if (sp.mirror) {
      const xm = (2 * g.v1 - g[sp.key]) * W;
      drawLine(frag, xm, 0, xm, H, sp.color, w, op);
      vBadges.push({ label: sp.label, color: sp.color, x: xm });
    }
  }
  /* 세로선 라벨 — 가로로 겹치면 아래 줄로 내려서 배치 */
  {
    const ly = Math.min(V_LABEL_Y, Math.max(3, H - 40));
    const rowRight = [];
    vBadges.sort((a, b) => a.x - b.x);
    for (const bg of vBadges) {
      const bw = badgeW(bg.label);
      let r = 0;
      while (rowRight[r] !== undefined && bg.x - bw / 2 < rowRight[r] + 3) r++;
      rowRight[r] = bg.x + bw / 2;
      drawBadge(frag, bg.label, bg.x, Math.min(ly + r * 17, H - 16), bg.color, "middle");
    }
  }

  /* Base Structure — V형 기본 구조 */
  if (g.baseStructureVisible) {
    const px = g.v1 * W, py = g.innerAngle * H;
    const deg = (g.outerAngle - 0.5) * 2 * V_ANGLE_MAX;
    const tn = Math.tan((deg * Math.PI) / 180);
    const selA = S.sel === "outerAngle", selP = S.sel === "innerAngle";
    const w = selA ? 3.4 : 2.2;
    drawLine(frag, px, py, 0, py - tn * px, "#111111", w, 0.85);
    drawLine(frag, px, py, W, py - tn * (W - px), "#111111", w, 0.85);
    frag.appendChild(mk("circle", { cx: px, cy: py, r: selP ? 9 : 6.5, fill: "#FF3B30", stroke: "#ffffff", "stroke-width": 2 }));
  }

  /* 동공 지정 마커 */
  for (const pt of S.pick) {
    frag.appendChild(mk("circle", { cx: pt.x, cy: pt.y, r: 12, fill: "none", stroke: "#ffffff", "stroke-width": 4, "stroke-opacity": 0.7 }));
    frag.appendChild(mk("circle", { cx: pt.x, cy: pt.y, r: 12, fill: "none", stroke: "#7A6FD8", "stroke-width": 2.5 }));
    frag.appendChild(mk("circle", { cx: pt.x, cy: pt.y, r: 2.5, fill: "#7A6FD8" }));
  }

  svg.replaceChildren(frag);
}

function render() {
  renderPhoto();
  renderGuides();
  updateButtons();
  updatePanels();
}

/* ═══════════ 라인 값 변경 (대칭 로직) ═══════════ */
function setLine(key, val) {
  const g = S.g;
  val = clamp(val, 0, 1);
  if (key === "v1") {
    const d = val - g.v1;
    g.v1 = val;
    g.v2 = clamp(g.v2 + d, 0, 1);
    g.v3 = clamp(g.v3 + d, 0, 1);
    g.v4 = clamp(g.v4 + d, 0, 1);
    g.v5 = clamp(g.v5 + d, 0, 1);
  } else if (key === "v2") {
    g.v2 = val; g.v3 = 2 * g.v1 - val;
  } else if (key === "v4") {
    g.v4 = val; g.v5 = 2 * g.v1 - val;
  } else {
    g[key] = val;
  }
}

/* ═══════════ 5. gesture ═══════════ */

function linePixels() {
  const { W, H } = S.dim, g = S.g, out = [];
  for (const sp of H_SPECS) {
    if (!g[sp.vis]) continue;
    out.push({ type: "h", key: sp.key, y: g[sp.key] * H, segs: sp.segs });
  }
  for (const sp of V_SPECS) {
    if (!g[sp.vis]) continue;
    out.push({ type: "v", key: sp.key, x: g[sp.key] * W, mirrored: false });
    if (sp.mirror) out.push({ type: "v", key: sp.key, x: (2 * g.v1 - g[sp.key]) * W, mirrored: true });
  }
  return out;
}

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = dx * dx + dy * dy;
  let tt = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0;
  tt = clamp(tt, 0, 1);
  return Math.hypot(px - (x1 + tt * dx), py - (y1 + tt * dy));
}

function hitTest(x, y) {
  const { W, H } = S.dim, g = S.g;
  let best = null, bd = HIT_PX;

  /* Base Structure 가 켜져 있으면 pivot / arm 우선 */
  if (g.baseStructureVisible) {
    const px = g.v1 * W, py = g.innerAngle * H;
    const dp = Math.hypot(x - px, y - py);
    if (dp < 26) return { type: "pivot" };
    const deg = (g.outerAngle - 0.5) * 2 * V_ANGLE_MAX;
    const tn = Math.tan((deg * Math.PI) / 180);
    const dl = distToSeg(x, y, px, py, 0, py - tn * px);
    const dr = distToSeg(x, y, px, py, W, py - tn * (W - px));
    const da = Math.min(dl, dr);
    if (da < 18) { best = { type: "arm" }; bd = da; }
  }

  for (const L of linePixels()) {
    let d;
    if (L.type === "h") {
      const inSeg = L.segs.some(([a, b]) => x >= a * W - 12 && x <= b * W + 12);
      if (!inSeg) continue;
      d = Math.abs(y - L.y);
    } else {
      d = Math.abs(x - L.x);
    }
    if (d < bd) { bd = d; best = L; }
  }
  return best;
}

const pts = new Map();
let gMode = null, gDrag = null;

function stagePoint(e) {
  const r = stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

touch.addEventListener("pointerdown", (e) => {
  e.preventDefault();

  /* 동공 2점 지정 모드 — 다른 제스처보다 우선 */
  if (S.pickMode) {
    const q = stagePoint(e);
    S.pick.push(q);
    if (S.pick.length >= 2) {
      const [a, b] = S.pick;
      S.pick = [];
      S.pickMode = false;
      alignFromPupils(a, b);
      setAI(t("pick_done"), "ok");
    } else {
      setAI(t("pick_2"));
    }
    updateButtons();
    render();
    return;
  }

  touch.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pts.size === 1) {
    const p = stagePoint(e);
    const hit = hitTest(p.x, p.y);
    if (hit) {
      gMode = "line";
      gDrag = { hit };
      if (hit.type === "pivot") setSel("innerAngle");
      else if (hit.type === "arm") setSel("outerAngle");
      else setSel(hit.key);
      render();
    } else if (!S.locked) {
      gMode = "pan";
      gDrag = { ox: S.p.ox, oy: S.p.oy, x0: e.clientX, y0: e.clientY };
    } else {
      gMode = null;
    }
  } else if (pts.size === 2 && !S.locked) {
    const [a, b] = [...pts.values()];
    gMode = "xform";
    gDrag = {
      d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      a0: Math.atan2(b.y - a.y, b.x - a.x),
      cx0: (a.x + b.x) / 2, cy0: (a.y + b.y) / 2,
      zoom0: S.p.zoom, rot0: S.p.rot, ox0: S.p.ox, oy0: S.p.oy,
    };
  }
}, { passive: false });

touch.addEventListener("pointermove", (e) => {
  if (!pts.has(e.pointerId)) return;
  e.preventDefault();
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const { W, H } = S.dim, g = S.g;

  if (gMode === "line" && gDrag) {
    const p = stagePoint(e);
    const h = gDrag.hit;
    if (h.type === "h") setLine(h.key, p.y / H);
    else if (h.type === "v") setLine(h.key, h.mirrored ? 2 * g.v1 - p.x / W : p.x / W);
    else if (h.type === "pivot") g.innerAngle = clamp(p.y / H, 0.02, 0.98);
    else if (h.type === "arm") {
      const px = g.v1 * W, py = g.innerAngle * H;
      const dx = Math.abs(p.x - px), dy = py - p.y;
      const deg = clamp((Math.atan2(dy, Math.max(dx, 6)) * 180) / Math.PI, -V_ANGLE_MAX, V_ANGLE_MAX);
      g.outerAngle = 0.5 + deg / (2 * V_ANGLE_MAX);
    }
    render();
  } else if (gMode === "pan" && gDrag) {
    S.p.ox = clamp(gDrag.ox + (e.clientX - gDrag.x0) / W, -OFFSET_MAX, OFFSET_MAX);
    S.p.oy = clamp(gDrag.oy + (e.clientY - gDrag.y0) / H, -OFFSET_MAX, OFFSET_MAX);
    render();
  } else if (gMode === "xform" && gDrag && pts.size >= 2) {
    const [a, b] = [...pts.values()];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    S.p.zoom = clamp(gDrag.zoom0 * (d / gDrag.d0), ZOOM_MIN, ZOOM_MAX);
    S.p.rot = clamp(gDrag.rot0 + ((ang - gDrag.a0) * 180) / Math.PI, -ROT_MAX, ROT_MAX);
    S.p.ox = clamp(gDrag.ox0 + (cx - gDrag.cx0) / W, -OFFSET_MAX, OFFSET_MAX);
    S.p.oy = clamp(gDrag.oy0 + (cy - gDrag.cy0) / H, -OFFSET_MAX, OFFSET_MAX);
    showHud(`${t("editor_zoom")} ${S.p.zoom.toFixed(2)}×<br>${t("editor_balance")} ${S.p.rot.toFixed(1)}°`);
    render();
  }
}, { passive: false });

function endPointer(e) {
  pts.delete(e.pointerId);
  if (pts.size < 2) { gMode = pts.size === 1 ? null : null; gDrag = null; }
}
touch.addEventListener("pointerup", endPointer);
touch.addEventListener("pointercancel", endPointer);

/* 데스크톱 휠 = 줌 */
touch.addEventListener("wheel", (e) => {
  if (S.locked) return;
  e.preventDefault();
  S.p.zoom = clamp(S.p.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), ZOOM_MIN, ZOOM_MAX);
  showHud(`${t("editor_zoom")} ${S.p.zoom.toFixed(2)}×`);
  render();
}, { passive: false });

/* ═══════════ 6. 버튼 · 패널 ═══════════ */

function setSel(key) {
  S.sel = key;
  updatePanels();
}

function buildLineButtons() {
  const mkBtn = (spec) => {
    const b = document.createElement("button");
    b.className = "lbtn";
    b.dataset.key = spec.key;
    b.dataset.vis = spec.vis;
    b.textContent = spec.label;
    b.addEventListener("click", () => {
      if (S.sel === spec.key) S.g[spec.vis] = !S.g[spec.vis];
      else { S.sel = spec.key; S.g[spec.vis] = true; }
      render();
    });
    return b;
  };
  $("hButtons").replaceChildren(...H_SPECS.map(mkBtn));
  $("vButtons").replaceChildren(...V_SPECS.map(mkBtn));
}

function updateButtons() {
  document.querySelectorAll(".lbtn").forEach((b) => {
    const spec = [...H_SPECS, ...V_SPECS].find((s) => s.key === b.dataset.key);
    const vis = S.g[b.dataset.vis];
    b.style.background = vis ? spec.color : "var(--btn-off)";
    b.classList.toggle("hidden-line", !vis);
    b.classList.toggle("sel", S.sel === spec.key);
  });
  $("btnPivot").classList.toggle("on", S.sel === "innerAngle" && S.g.baseStructureVisible);
  $("btnVAngle").classList.toggle("on", S.sel === "outerAngle" && S.g.baseStructureVisible);
  $("btnAllLine").classList.toggle("on", !!S.hiddenSnapshot);
  $("btnEyeGuide").classList.toggle("on", S.g.eyeGuideVisible);
  $("btnLock").classList.toggle("on", S.locked);
  $("btnAlign").classList.toggle("picking", S.pickMode);
  $("lockLabel").textContent = S.locked ? t("editor_photo_unlock") : t("editor_photo_lock");
}

/* ── 위치 조절 패널 ── */
const H_KEYS = new Set(H_SPECS.map((s) => s.key));

function posConfig() {
  const g = S.g, k = S.sel;
  if (k === "outerAngle") {
    const deg = (g.outerAngle - 0.5) * 2 * V_ANGLE_MAX;
    return { name: t("editor_outer_angle"), v: g.outerAngle, disp: deg.toFixed(1) + "°", hint: t("hint_narrowwide"), step: 0.006, invert: false };
  }
  if (k === "innerAngle") {
    return { name: t("editor_inner_angle"), v: 1 - g.innerAngle, disp: Math.round((1 - g.innerAngle) * 100), hint: t("hint_updown"), step: 0.003, invert: true };
  }
  if (H_KEYS.has(k)) {
    const sp = H_SPECS.find((s) => s.key === k);
    return { name: sp.label, v: 1 - g[k], disp: Math.round((1 - g[k]) * 100), hint: t("hint_updown"), step: 0.003, invert: true };
  }
  const sp = V_SPECS.find((s) => s.key === k);
  return { name: sp.label, v: g[k], disp: Math.round(g[k] * 100), hint: t("hint_leftright"), step: 0.003, invert: false };
}

function applyPos(v) {
  const k = S.sel, c = posConfig();
  v = clamp(v, 0, 1);
  if (k === "outerAngle") S.g.outerAngle = v;
  else if (k === "innerAngle") S.g.innerAngle = clamp(1 - v, 0.02, 0.98);
  else setLine(k, c.invert ? 1 - v : v);
  render();
}

/* ── 사진 보정 패널 ── */
function photoConfig() {
  const p = S.p;
  switch (S.photoMode) {
    case "zoom":
      return { v: Math.log(p.zoom / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN), disp: p.zoom.toFixed(2) + "×", hint: t("hint_zoom"), step: 0.03 };
    case "vertical":
      return { v: clamp(p.oy / (2 * SLIDER_OFFSET) + 0.5, 0, 1), disp: Math.round(p.oy * 100), hint: t("hint_photo_ud"), step: 0.012 };
    case "horizontal":
      return { v: clamp(p.ox / (2 * SLIDER_OFFSET) + 0.5, 0, 1), disp: Math.round(p.ox * 100), hint: t("hint_photo_lr"), step: 0.012 };
    case "balance":
      return { v: p.rot / (2 * ROT_MAX) + 0.5, disp: p.rot.toFixed(1) + "°", hint: t("hint_photo_bal"), step: 0.008 };
  }
}

function applyPhoto(v) {
  v = clamp(v, 0, 1);
  const p = S.p;
  if (S.photoMode === "zoom") p.zoom = ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, v);
  else if (S.photoMode === "vertical") p.oy = (v - 0.5) * 2 * SLIDER_OFFSET;
  else if (S.photoMode === "horizontal") p.ox = (v - 0.5) * 2 * SLIDER_OFFSET;
  else if (S.photoMode === "balance") p.rot = (v - 0.5) * 2 * ROT_MAX;
  render();
}

function updatePanels() {
  const c = posConfig();
  $("selName").textContent = c.name;
  $("posVal").textContent = c.disp;
  $("posHint").textContent = c.hint;
  if (document.activeElement !== posSlider) posSlider.value = c.v;

  const pc = photoConfig();
  $("photoVal").textContent = pc.disp;
  $("phHint").textContent = pc.hint;
  if (document.activeElement !== phSlider) phSlider.value = pc.v;
}

/* ═══════════ 7. presets ═══════════ */
const PKEY = "pb_presets_v1";

const BUILTINS = () => [
  { id: "b:natural", name: t("p_natural"), builtin: true, state: { ...DEFAULT_GUIDE, h2: 0.36, h2Visible: true, archThickness: 0.40, archThicknessVisible: true, h3: 0.45, h3Visible: true, v2: 0.38, v2Visible: true } },
  { id: "b:bold",    name: t("p_bold"),    builtin: true, state: { ...DEFAULT_GUIDE, h2: 0.30, h2Visible: true, archThickness: 0.375, archThicknessVisible: true, h3: 0.41, h3Visible: true, v2: 0.33, v4: 0.12, v4Visible: true, front: 0.38, frontVisible: true } },
  { id: "b:arch",    name: t("p_arch"),    builtin: true, state: { ...DEFAULT_GUIDE, h2: 0.28, h2Visible: true, archThickness: 0.345, archThicknessVisible: true, h3: 0.44, h3Visible: true, v2: 0.36, v4: 0.17, v4Visible: true, baseStructureVisible: true, innerAngle: 0.44, outerAngle: 0.62 } },
];

function userPresets() {
  try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; }
}
function writeUserPresets(list) {
  localStorage.setItem(PKEY, JSON.stringify(list));
}
function allPresets() { return [...BUILTINS(), ...userPresets()]; }

function savePreset(name) {
  const list = userPresets();
  list.push({ id: "u" + Date.now(), name, state: { ...S.g } });
  writeUserPresets(list);
  toast(t("preset_saved"));
}
function applyPreset(p) {
  S.g = { ...DEFAULT_GUIDE, ...p.state };   // 누락 필드 자동 보정
  render();
  toast(t("preset_loaded"));
}
function renderPresetList() {
  const box = $("presetList");
  const list = allPresets();
  if (!list.length) { box.innerHTML = `<div class="empty">${t("preset_none")}</div>`; return; }
  box.replaceChildren(...list.map((p) => {
    const row = document.createElement("div");
    row.className = "pitem";
    const nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = p.name;
    row.appendChild(nm);
    if (p.builtin) {
      const bd = document.createElement("span");
      bd.className = "badge"; bd.textContent = t("preset_builtin");
      row.appendChild(bd);
    }
    const load = document.createElement("button");
    load.className = "pri"; load.textContent = t("editor_load");
    load.onclick = () => { applyPreset(p); closeMask("mLoad"); };
    row.appendChild(load);
    if (!p.builtin) {
      const ed = document.createElement("button");
      ed.textContent = t("editor_edit");
      ed.onclick = () => { S.renamingId = p.id; $("renameName").value = p.name; openMask("mRename"); };
      row.appendChild(ed);
      const del = document.createElement("button");
      del.className = "del"; del.textContent = t("editor_delete");
      del.onclick = () => { writeUserPresets(userPresets().filter((x) => x.id !== p.id)); renderPresetList(); toast(t("preset_deleted")); };
      row.appendChild(del);
    }
    return row;
  }));
}

/* ═══════════ 8. faceAI ═══════════ */
let faceLandmarker = null, aiLoadPromise = null;
const MP_VER = "0.10.14";

async function getLandmarker() {
  if (faceLandmarker) return faceLandmarker;
  if (aiLoadPromise) return aiLoadPromise;
  aiLoadPromise = (async () => {
    const mod = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`);
    const fileset = await mod.FilesetResolver.forVisionTasks(
      `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`,
    );
    faceLandmarker = await mod.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    });
    return faceLandmarker;
  })();
  return aiLoadPromise;
}

function setAI(msg, kind) {
  aiStatus.hidden = false;
  aiStatus.textContent = msg;
  aiStatus.className = "chip" + (kind === "warn" ? " warn" : kind === "ok" ? " on" : "");
  if (kind) setTimeout(() => { aiStatus.hidden = true; }, 2600);
}

/* 이미지 픽셀좌표 → 캔버스 좌표 (현재 사진 변환 기준) */
function imgToCanvas(px, py, tr) {
  const { W, H } = S.dim;
  const vx = (px - S.iw / 2) * S.s0, vy = (py - S.ih / 2) * S.s0;
  const r = (tr.rot * Math.PI) / 180;
  const rx = vx * Math.cos(r) - vy * Math.sin(r);
  const ry = vx * Math.sin(r) + vy * Math.cos(r);
  return { x: W / 2 + rx * tr.zoom + tr.ox * W, y: H / 2 + ry * tr.zoom + tr.oy * H };
}

/* 동공 위치(정규화 캔버스 좌표)로부터 가이드 라인 일괄 배치.
   half = 동공 간 거리의 절반 (캔버스 폭 기준 비율)
   세로 비율은 인체 계측 평균비(동공 간 반거리 = 1.0 기준)를 사용 */
function placeLinesFromEyes(cx, cy, half) {
  const g = S.g, { W, H } = S.dim, aspect = W / H;
  g.v1 = cx;
  g.h1 = cy;
  g.v2 = clamp(cx - half * R_INNER, 0.01, 0.99); g.v3 = 2 * cx - g.v2;
  g.v4 = clamp(cx - half * R_OUTER, 0.01, 0.99); g.v5 = 2 * cx - g.v4;
  const up = (f) => clamp(cy - half * f * aspect, 0.02, 0.98);
  g.h2 = up(0.92);              // 눈썹 산 (Arch)
  g.archThickness = up(0.66);
  g.front = up(0.78);           // 눈썹 앞머리
  g.frontThickness = up(0.55);
  g.h3 = up(0.72);              // 눈썹 꼬리 (Tail)
  g.innerAngle = clamp(cy + half * 1.45 * aspect, 0.05, 0.95); // 코끝 부근
}

/* 사용자가 찍은 두 동공(캔버스 픽셀 좌표) 기준으로 사진을 수평·중앙·확대 정렬 */
function alignFromPupils(a, b) {
  const { W, H } = S.dim;
  if (a.x > b.x) { const tmp = a; a = b; b = tmp; }
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d < 8) { toast(t("pick_cancel")); return; }

  const theta = Math.atan2(b.y - a.y, b.x - a.x);
  const zoom = clamp(S.p.zoom * ((EYE_FRAC * W) / d), ZOOM_MIN, ZOOM_MAX);
  const rot = clamp(S.p.rot - (theta * 180) / Math.PI, -ROT_MAX, ROT_MAX);

  /* 두 동공 중점에 있는 이미지 점을 새 변환에서 캔버스 중앙으로 보낸다 */
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = mx - W / 2 - S.p.ox * W, dy = my - H / 2 - S.p.oy * H;
  const r0 = -(S.p.rot * Math.PI) / 180;
  const vx = (dx * Math.cos(r0) - dy * Math.sin(r0)) / S.p.zoom;
  const vy = (dx * Math.sin(r0) + dy * Math.cos(r0)) / S.p.zoom;
  const r1 = (rot * Math.PI) / 180;
  const nx = zoom * (vx * Math.cos(r1) - vy * Math.sin(r1));
  const ny = zoom * (vx * Math.sin(r1) + vy * Math.cos(r1));

  S.p = {
    zoom, rot,
    ox: clamp(-nx / W, -OFFSET_MAX, OFFSET_MAX),
    oy: clamp(-ny / H, -OFFSET_MAX, OFFSET_MAX),
  };
  placeLinesFromEyes(0.5, 0.5, EYE_FRAC / 2);
}

function autoAlign(lm) {
  const { W, H } = S.dim;
  const iw = S.iw, ih = S.ih;
  const P = (i) => ({ x: lm[i].x * iw, y: lm[i].y * ih });
  const avg = (idx) => {
    let x = 0, y = 0;
    idx.forEach((i) => { x += lm[i].x * iw; y += lm[i].y * ih; });
    return { x: x / idx.length, y: y / idx.length };
  };

  /* 홍채 중심 2개 → 좌우 정렬 */
  let irisA = avg([468, 469, 470, 471, 472]);
  let irisB = avg([473, 474, 475, 476, 477]);
  if (irisA.x > irisB.x) [irisA, irisB] = [irisB, irisA];

  /* 눈 앞머리 / 눈꼬리 4점을 x 순서로 정렬 (인덱스 규약에 의존하지 않음) */
  const corners = [33, 133, 362, 263].map(P).sort((a, b) => a.x - b.x);
  const outerL = corners[0], innerL = corners[1], innerR = corners[2], outerR = corners[3];

  /* 회전: 두 동공을 수평으로 */
  const rot = clamp(-(Math.atan2(irisB.y - irisA.y, irisB.x - irisA.x) * 180) / Math.PI, -ROT_MAX, ROT_MAX);

  /* 줌: 동공 간 거리가 캔버스 폭의 30% 가 되도록 */
  const d = Math.hypot(irisB.x - irisA.x, irisB.y - irisA.y) * S.s0;
  const zoom = clamp((EYE_FRAC * W) / Math.max(d, 1), ZOOM_MIN, ZOOM_MAX);

  /* 이동: 두 동공의 중점을 캔버스 중앙으로 */
  const mx = (irisA.x + irisB.x) / 2, my = (irisA.y + irisB.y) / 2;
  const vx = (mx - iw / 2) * S.s0, vy = (my - ih / 2) * S.s0;
  const r = (rot * Math.PI) / 180;
  const rx = vx * Math.cos(r) - vy * Math.sin(r);
  const ry = vx * Math.sin(r) + vy * Math.cos(r);
  const tr = { zoom, rot, ox: clamp(-(rx * zoom) / W, -OFFSET_MAX, OFFSET_MAX), oy: clamp(-(ry * zoom) / H, -OFFSET_MAX, OFFSET_MAX) };
  S.p = tr;

  /* 라인 자동 배치 */
  const g = S.g;
  g.v1 = 0.5;
  g.h1 = clamp(imgToCanvas(mx, my, tr).y / H, 0.02, 0.98);

  const cIn = imgToCanvas(innerL.x, innerL.y, tr);
  g.v2 = clamp(cIn.x / W, 0.02, 0.98);
  g.v3 = 2 * g.v1 - g.v2;

  const cOut = imgToCanvas(outerL.x, outerL.y, tr);
  g.v4 = clamp(cOut.x / W, 0.02, 0.98);
  g.v5 = 2 * g.v1 - g.v4;

  /* 눈썹 기준선 (표시 여부는 그대로 두고 위치만 잡아둠) */
  const browArch = avg([105, 334]);        // 눈썹 산
  const browTail = avg([70, 300]);         // 눈썹 꼬리
  const browHead = avg([107, 336]);        // 눈썹 앞머리
  g.h2 = clamp(imgToCanvas(browArch.x, browArch.y, tr).y / H, 0.02, 0.98);
  g.h3 = clamp(imgToCanvas(browTail.x, browTail.y, tr).y / H, 0.02, 0.98);
  g.front = clamp(imgToCanvas(browHead.x, browHead.y, tr).y / H, 0.02, 0.98);
  g.archThickness = clamp(g.h2 + 0.035, 0.02, 0.98);
  g.frontThickness = clamp(g.front - 0.04, 0.02, 0.98);

  /* Base Structure pivot 을 코끝 높이에 */
  g.innerAngle = clamp(g.h1 + 0.16, 0.05, 0.95);
}

async function serverAnalyze(dataUrl) {
  if (!SERVER_AI_ENDPOINT) return null;
  try {
    const res = await fetch(SERVER_AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: dataUrl }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j && j.faceDetected ? j : null;
  } catch { return null; }
}

async function runFaceAI() {
  setAI(t("ai_loading"));
  try {
    const lmk = await getLandmarker();
    const res = lmk.detect(S.imgEl);
    if (!res.faceLandmarks || !res.faceLandmarks.length) {
      S.landmarks = null;
      setAI(t("ai_noface"), "warn");
      render();
      return;
    }
    S.landmarks = res.faceLandmarks[0];
    autoAlign(S.landmarks);
    setAI(t("ai_ok"), "ok");
    render();
  } catch (err) {
    console.warn("[PerfectBrow] face AI unavailable:", err);
    S.landmarks = null;
    setAI(t("ai_fail"), "warn");
    render();
  }
}

/* ═══════════ 9. export ═══════════ */
async function exportImage() {
  try {
    const { W, H } = S.dim, R = 2;
    const c = document.createElement("canvas");
    c.width = W * R; c.height = H * R;
    const ctx = c.getContext("2d");
    ctx.scale(R, R);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2 + S.p.ox * W, H / 2 + S.p.oy * H);
    ctx.scale(S.p.zoom, S.p.zoom);
    ctx.rotate((S.p.rot * Math.PI) / 180);
    ctx.drawImage(S.imgEl, -S.fitW / 2, -S.fitH / 2, S.fitW, S.fitH);
    ctx.restore();

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", SVGNS);
    clone.setAttribute("width", W);
    clone.setAttribute("height", H);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    await new Promise((ok, no) => {
      const im = new Image();
      im.onload = () => { ctx.drawImage(im, 0, 0, W, H); ok(); };
      im.onerror = no;
      im.src = url;
    });

    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `perfect-brow-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(t("saved_img"));
  } catch (e) {
    console.error(e);
    toast(t("export_fail"));
  }
}

/* ═══════════ 화면 전환 · 사진 로드 ═══════════ */
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}

function loadPhoto(file) {
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    if (photo.src && photo.src.startsWith("blob:")) URL.revokeObjectURL(photo.src);
    S.imgEl = im;
    S.iw = im.naturalWidth; S.ih = im.naturalHeight;
    photo.src = url;
    S.g = { ...DEFAULT_GUIDE };
    S.p = { ...DEFAULT_PHOTO };
    S.locked = false;
    S.hiddenSnapshot = null;
    S.sel = "h1";
    S.pickMode = false;
    S.pick = [];
    show("editor");
    requestAnimationFrame(() => {
      measure();
      render();
      runFaceAI();
    });
  };
  im.onerror = () => toast(t("export_fail"));
  im.src = url;
}

/* ═══════════ 모달 ═══════════ */
const openMask = (id) => $(id).classList.add("on");
const closeMask = (id) => $(id).classList.remove("on");
document.querySelectorAll("[data-close]").forEach((b) =>
  b.addEventListener("click", () => closeMask(b.dataset.close)));
document.querySelectorAll(".mask").forEach((m) =>
  m.addEventListener("click", (e) => { if (e.target === m) m.classList.remove("on"); }));

/* ═══════════ i18n 적용 ═══════════ */
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $("langKo").classList.toggle("on", LANG === "ko");
  $("langEn").classList.toggle("on", LANG === "en");
  $("saveName").placeholder = t("preset_enter_name");
  $("renameName").placeholder = t("preset_enter_name");
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  $("installTip").innerHTML = isIOS ? t("install_ios") : isAndroid ? t("install_android") : t("install_desktop");
  updateButtons();
  updatePanels();
}
function setLang(l) {
  LANG = l;
  localStorage.setItem("pb_lang", l);
  applyI18n();
}

/* ═══════════ 이벤트 배선 ═══════════ */
$("langKo").onclick = () => setLang("ko");
$("langEn").onclick = () => setLang("en");

$("pickBtn").onclick = () => $("fileInput").click();
$("btnChange").onclick = () => $("fileInput").click();
$("fileInput").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) loadPhoto(f);
  e.target.value = "";
});

$("btnReset").onclick = () => {
  S.g = { ...DEFAULT_GUIDE };
  S.p = { ...DEFAULT_PHOTO };
  S.hiddenSnapshot = null;
  S.sel = "h1";
  S.pickMode = false;
  S.pick = [];
  if (S.landmarks) autoAlign(S.landmarks);
  render();
  toast(t("reset_done"));
};

$("btnAlign").onclick = () => {
  if (S.pickMode) {
    S.pickMode = false; S.pick = [];
    setAI(t("pick_cancel"), "warn");
  } else {
    S.pickMode = true; S.pick = [];
    S.locked = false;
    setAI(t("pick_1"));
  }
  updateButtons();
  render();
};

$("btnLock").onclick = () => {
  S.locked = !S.locked;
  updateButtons();
  toast(S.locked ? t("locked_msg") : t("unlocked_msg"));
};

$("btnExport").onclick = exportImage;

$("btnAllLine").onclick = () => {
  if (S.hiddenSnapshot) {
    Object.assign(S.g, S.hiddenSnapshot);
    S.hiddenSnapshot = null;
  } else {
    S.hiddenSnapshot = {};
    ALL_VIS.forEach((k) => { S.hiddenSnapshot[k] = S.g[k]; S.g[k] = false; });
  }
  render();
};

$("btnPivot").onclick = () => {
  if (S.sel === "innerAngle" && S.g.baseStructureVisible) S.g.baseStructureVisible = false;
  else { S.sel = "innerAngle"; S.g.baseStructureVisible = true; }
  render();
};
$("btnVAngle").onclick = () => {
  if (S.sel === "outerAngle" && S.g.baseStructureVisible) S.g.baseStructureVisible = false;
  else { S.sel = "outerAngle"; S.g.baseStructureVisible = true; }
  render();
};
$("btnEyeGuide").onclick = () => { S.g.eyeGuideVisible = !S.g.eyeGuideVisible; render(); };

posSlider.addEventListener("input", (e) => applyPos(parseFloat(e.target.value)));
$("posMinus").onclick = () => applyPos(parseFloat(posSlider.value) - posConfig().step);
$("posPlus").onclick = () => applyPos(parseFloat(posSlider.value) + posConfig().step);

phSlider.addEventListener("input", (e) => applyPhoto(parseFloat(e.target.value)));
$("phMinus").onclick = () => applyPhoto(parseFloat(phSlider.value) - photoConfig().step);
$("phPlus").onclick = () => applyPhoto(parseFloat(phSlider.value) + photoConfig().step);

$("photoModes").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-mode]");
  if (!b) return;
  S.photoMode = b.dataset.mode;
  document.querySelectorAll("#photoModes button[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
  updatePanels();
});

$("btnPresetSave").onclick = () => { closeMask("mLoad"); $("saveName").value = ""; openMask("mSave"); };
$("doSave").onclick = () => {
  const n = $("saveName").value.trim();
  if (!n) return;
  savePreset(n);
  closeMask("mSave");
};
$("btnPresetLoad").onclick = () => { renderPresetList(); openMask("mLoad"); };
$("doRename").onclick = () => {
  const n = $("renameName").value.trim();
  if (!n || !S.renamingId) return;
  const list = userPresets().map((p) => (p.id === S.renamingId ? { ...p, name: n } : p));
  writeUserPresets(list);
  S.renamingId = null;
  closeMask("mRename");
  renderPresetList();
};

/* 가로 모드에서는 라인 선택 버튼을 우측 패널로 옮긴다 */
const mqLand = window.matchMedia("(orientation:landscape)");
function placeLineBars() {
  const L = $("hButtons"), R = $("vButtons");
  /* 가로 = 왼쪽 세로 레일(왼손 선택) / 세로 = 캔버스 위 오버레이 */
  (mqLand.matches ? $("lineRail") : stage).append(L, R);
}
mqLand.addEventListener("change", () => { placeLineBars(); measure(); render(); });

/* 리사이즈 / 회전 대응 */
const ro = new ResizeObserver(() => { measure(); render(); });
ro.observe(stage);
window.addEventListener("orientationchange", () => setTimeout(() => { placeLineBars(); measure(); render(); }, 250));

/* ═══════════ init ═══════════ */
buildLineButtons();
placeLineBars();
applyI18n();
measure();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

/* 개발/디버깅용 */
window.PB = { S, DEFAULT_GUIDE, render, runFaceAI, loadPhoto };
