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
    editor_undo: "되돌리기",
    editor_all_hide: "모든 라인 숨김",
    editor_multi: "여러라인",
    multi_on: "여러라인 — 선을 눌러 추가 · 다시 누르면 해제",
    multi_off: "한 줄 선택으로 돌아왔습니다",
    sel_count: "개 선택됨 · 함께 움직입니다",
    undo_done: "한 단계 되돌렸습니다",
    undo_none: "되돌릴 작업이 없습니다",
    editor_align: "동공정렬",
    editor_preset: "프리셋",
    editor_preset_save: "현재 설정 저장",
    editor_load_preset: "프리셋",
    editor_preset_load: "프리셋",
    editor_photo_lock: "사진잠금",
    editor_photo_unlock: "잠금해제",
    editor_export: "사진저장",
    editor_change_photo: "사진변경",
    editor_rotate: "화면가로",
    editor_rotate_off: "가로해제",
    rot_on: "화면을 가로로 고정했습니다",
    rot_off: "기기 방향을 따릅니다",
    pick_1: "① 왼쪽 눈동자 중앙을 탭하세요",
    pick_2: "② 오른쪽 눈동자 중앙을 탭하세요",
    pick_done: "동공 기준 자동 정렬 완료",
    pick_cancel: "정렬을 취소했습니다",
    rot_auto_off: "기기 회전이 되는 환경입니다 · 강제 가로를 껐습니다",
    editor_inner_angle: "V 센터 피봇",
    editor_outer_angle: "V 앵글",
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
    panel_values: "가이드 값",
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
    ai_drawn: "그린 선에 맞춰 배치했습니다",
    ai_redraw: "드로잉 맞춤",
    ai_redraw_fail: "그린 선을 못 찾았습니다",
    ai_fail: "AI 얼굴 인식 실패 · 사진을 손으로 맞춰 주세요",
    ai_noface: "얼굴 인식 실패 · [동공정렬]을 눌러 정렬하세요",
    hint_updown: "▼ 아래　　위 ▲ · 화면을 드래그해도 조절됩니다",
    hint_leftright: "◀ 왼쪽　　오른쪽 ▶ · 화면을 드래그해도 조절됩니다",
    hint_narrowwide: "◀ 좁게　　넓게 ▶",
    hint_zoom: "◀ 축소　　확대 ▶",
    hint_photo_ud: "◀ 위로　　아래로 ▶",
    hint_photo_lr: "◀ 왼쪽　　오른쪽 ▶",
    hint_photo_bal: "◀ 반시계　　시계 ▶",
    hint_drag: "화면의 선을 손가락으로 직접 끌어서 옮길 수 있습니다",
    locked_msg: "사진 잠금 — 사진이 움직이지 않습니다 (선은 계속 조절 가능)",
    lock_short: "사진잠금",
    unlock_short: "잠금해제",
    sel_line: "선택",
    line_hidden: "숨김",
    line_shown: "표시",
    ai_placed: "AI 측정 위치",
    preset_fitted: "프리셋을 고객 얼굴에 맞춰 적용했습니다",
    fav_max: "즐겨찾기는 3개까지입니다",
    fav_on: "즐겨찾기에 넣었습니다",
    fav_off: "즐겨찾기에서 뺐습니다",
    editor_balance_check: "밸런스",
    bal_ref_l: "기준 왼쪽",
    bal_ref_r: "기준 오른쪽",
    bal_left: "왼쪽",
    bal_right: "오른쪽",
    preset_export: "내보내기",
    preset_import: "가져오기",
    preset_exported: "프리셋을 파일로 저장했습니다",
    preset_imported: "개를 가져왔습니다",
    preset_import_fail: "프리셋 파일을 읽지 못했습니다",
    bal_ok: "모든 선이 기준과 같습니다",
    bal_diff: "곳이 기준과 다릅니다",
    bal_skip: "곳은 선을 못 읽어 건너뜀",
    bal_off: "밸런스 표시 끔",
    bal_no_photo: "사진을 먼저 불러오세요",
    /* 라인 이름 (v1.19.0) — 왼쪽 레일 버튼 · 캔버스 라벨 · 조절자 이름이 모두 이걸 쓴다 */
    line_eye: "눈",
    line_front: "앞머리",
    line_ft: "앞두께",
    line_arch: "아치",
    line_at: "아치두께",
    line_tail: "꼬리",
    line_center: "센터",
    line_archv: "아치선",
    line_inner: "이너",
    line_outer: "아우터",
    editor_redo: "다시 실행",
    redo_done: "다시 실행했습니다",
    redo_none: "다시 실행할 작업이 없습니다",
    editor_all_lines: "전체라인",
    pan_hint: "사진 이동은 두 손가락 드래그",
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
    editor_undo: "Undo",
    editor_all_hide: "Hide all lines",
    editor_multi: "Multi",
    multi_on: "Multi-select — tap a line to add, tap again to remove",
    multi_off: "Back to single select",
    sel_count: " selected · they move together",
    undo_done: "Undone one step",
    undo_none: "Nothing to undo",
    editor_align: "Pupil Align",
    editor_preset: "Presets",
    editor_preset_save: "Save current",
    editor_load_preset: "Presets",
    editor_preset_load: "Presets",
    editor_photo_lock: "Lock Photo",
    editor_photo_unlock: "Unlock",
    editor_export: "Save Photo",
    editor_change_photo: "Change Photo",
    editor_rotate: "Landscape",
    editor_rotate_off: "Auto rotate",
    rot_on: "Locked to landscape",
    rot_off: "Following device orientation",
    pick_1: "① Tap the centre of the left pupil",
    pick_2: "② Tap the centre of the right pupil",
    pick_done: "Aligned to pupils",
    pick_cancel: "Alignment cancelled",
    rot_auto_off: "Device rotation works — forced landscape turned off",
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
    panel_values: "Guide Values",
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
    ai_drawn: "Snapped to your drawing",
    ai_redraw: "Snap to drawing",
    ai_redraw_fail: "No drawing found",
    ai_fail: "Face detection failed · adjust the photo by hand",
    ai_noface: "No face found · use [Pupil Align]",
    hint_updown: "▼ down　　up ▲ · drag anywhere to adjust",
    hint_leftright: "◀ left　　right ▶ · drag anywhere to adjust",
    hint_narrowwide: "◀ narrow　　wide ▶",
    hint_zoom: "◀ out　　in ▶",
    hint_photo_ud: "◀ up　　down ▶",
    hint_photo_lr: "◀ left　　right ▶",
    hint_photo_bal: "◀ ccw　　cw ▶",
    hint_drag: "Drag any line directly on the photo to move it",
    locked_msg: "Photo locked — it will not move (lines still adjustable)",
    lock_short: "Lock photo",
    unlock_short: "Unlock",
    sel_line: "selected",
    line_hidden: "hidden",
    line_shown: "shown",
    ai_placed: "AI-measured",
    preset_fitted: "Preset fitted to this face",
    fav_max: "Up to 3 favourites",
    fav_on: "Added to favourites",
    fav_off: "Removed from favourites",
    editor_balance_check: "Balance",
    bal_ref_l: "Ref: Left",
    bal_ref_r: "Ref: Right",
    bal_left: "Left",
    bal_right: "Right",
    preset_export: "Export",
    preset_import: "Import",
    preset_exported: "Presets saved to a file",
    preset_imported: " imported",
    preset_import_fail: "Could not read that preset file",
    bal_ok: "Every line matches the reference",
    bal_diff: " differ from the reference",
    bal_skip: " skipped (line not readable)",
    bal_off: "Balance view off",
    bal_no_photo: "Load a photo first",
    line_eye: "Eye",
    line_front: "Front",
    line_ft: "F.T",
    line_arch: "Arch",
    line_at: "A.T",
    line_tail: "Tail",
    line_center: "Center",
    line_archv: "Arch V",
    line_inner: "Inner",
    line_outer: "Outer",
    editor_redo: "Redo",
    redo_done: "Redone",
    redo_none: "Nothing to redo",
    editor_all_lines: "All lines",
    pan_hint: "Pan the photo with two fingers",
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
/* ⚠️ `anchor` — 가로 자는 **자기 묶음의 세로선 위에** 올라간다 (v1.32.0)
   원장님 지시(2026-08-20): 「아우터 세로라인은 꼬리와 함께 움직임 / 이너라인은 앞머리
   앞두께와 함께 움직인다 / 아치 세로선 두개 더 생성」
     앞머리 · 앞두께 → 이너(v2/v3)      · 검정
     아치 · 아치두께 → **아치선(v6/v7)** · 파랑
     꼬리            → 아우터(v4/v5)    · 보라
   v1.31.x 까지는 자 위치가 frac 상수로 박혀 있어, **아치 자가 아우터를 따라 움직였습니다**
   (원장님이 직접 찾아내신 문제). 상수를 되살리지 말고 anchor 를 쓰세요. */
  { key: "h1", vis: "h1Visible", i18n: "line_eye",   color: "#3A3F4A", dot: "#9AA3B2", w: 2.2, op: 0.5, anchor: null },
  { key: "front", vis: "frontVisible", i18n: "line_front", color: "#14161B", dot: "#C9D1E0", w: 1.4, op: 0.9, anchor: "v2" },
  { key: "frontThickness", vis: "frontThicknessVisible", i18n: "line_ft", color: "#14161B", dot: "#C9D1E0", w: 1.4, op: 0.9, anchor: "v2" },
  { key: "h2", vis: "h2Visible", i18n: "line_arch",  color: "#2E8BFF", dot: "#2E8BFF", w: 1.4, op: 0.95, anchor: "v6" },
  { key: "archThickness", vis: "archThicknessVisible", i18n: "line_at", color: "#2E8BFF", dot: "#2E8BFF", w: 1.4, op: 0.95, anchor: "v6" },
  { key: "h3", vis: "h3Visible", i18n: "line_tail",  color: "#A855F7", dot: "#A855F7", w: 1.4, op: 0.95, anchor: "v4" },
];

const V_SPECS = [
  { key: "v1", vis: "v1Visible", i18n: "line_center", color: "#14161B", dot: "#C9D1E0", w: 1.3, op: 1,   mirror: null },
  /* 이너만 길게(눈까지) 남긴다 — 콧방울·내안각과 맞춰 보는 기준선이기 때문 (원장님 지시 2026-08-20) */
  { key: "v2", vis: "v2Visible", i18n: "line_inner",  color: "#14161B", dot: "#C9D1E0", w: 1.6, op: 0.6, mirror: "v3", long: true },
  /* 아치선 (v1.32.0) — 아치·아치두께가 올라가는 기둥. 아우터보다 **얇게** 그려 소속을 표시한다 */
  { key: "v6", vis: "v6Visible", i18n: "line_archv",  color: "#2E8BFF", dot: "#2E8BFF", w: 0.9, op: 0.9, mirror: "v7" },
  /* 아우터는 **보라** — 꼬리와 한 묶음이라 색으로 묶어 준다 (원장님 지시 2026-08-20) */
  { key: "v4", vis: "v4Visible", i18n: "line_outer",  color: "#A855F7", dot: "#A855F7", w: 1.1, op: 1,   mirror: "v5" },
];

const ALL_VIS = [
  "h1Visible", "h2Visible", "h3Visible", "archThicknessVisible",
  "frontVisible", "frontThicknessVisible",
  "v1Visible", "v2Visible", "v4Visible", "v6Visible",
  "baseStructureVisible", "eyeGuideVisible",
];

/* 선 키 → 표시 여부 키 / 라벨 (v1.18.1)
   Pivot·V Angle 은 Base Structure 하나로 묶여 있으므로 baseStructureVisible 을 쓴다. */
function specOf(k) { return [...H_SPECS, ...V_SPECS].find((s) => s.key === k) || null; }
function visKeyOf(k) {
  if (k === "innerAngle" || k === "outerAngle") return "baseStructureVisible";
  const sp = specOf(k);
  return sp ? sp.vis : null;
}
/* 라인 이름은 언어에 따라 바뀐다 (v1.19.0) — 하드코딩된 영문 label 을 되살리지 마세요.
   버튼·라벨·HUD·조절자 이름이 모두 이 함수 하나를 씁니다. */
function labelOf(k) {
  if (k === "innerAngle") return t("editor_inner_angle");
  if (k === "outerAngle") return t("editor_outer_angle");
  const sp = specOf(k);
  return sp ? t(sp.i18n) : k;
}

/* ⚠️ 표시 여부 — **사진을 넣으면 선이 전부 올라와 있어야 합니다** (v1.30.1)
   v1.30.0 까지 앞머리·앞두께·아치·아치두께·꼬리·아우터가 꺼져 있어서,
   드로잉에 맞춰 자리는 잡아 놓고도 **화면에는 안 보였습니다**(원장님 지적).
   V 피봇·V 앵글(baseStructureVisible)과 눈 아몬드만 **사용자 선택**으로 꺼 둡니다. */
const DEFAULT_GUIDE = Object.freeze({
  h1: 0.60,  h1Visible: true,   // v1.19.0 — 눈 기준선을 5% 아래로 (위에 V 사선 공간 확보)
  h2: 0.34,  h2Visible: true,
  h3: 0.43,  h3Visible: true,
  archThickness: 0.38, archThicknessVisible: true,
  front: 0.40, frontVisible: true,
  frontThickness: 0.35, frontThicknessVisible: true,
  v1: 0.5,   v1Visible: true,
  v2: 0.35,  v2Visible: true,
  v3: 0.65,
  v4: 0.15,  v4Visible: true,
  v5: 0.85,
  v6: 0.24,  v6Visible: true,      // 아치선 — 이너와 아우터 사이 (v1.32.0)
  v7: 0.76,
  eyeGuideVisible: false,   // 아몬드 눈 가이드 — 자동 줌이 충분하므로 기본 꺼짐
  innerAngle: 0.10,      // Pivot Point Y (0=위, 1=아래) — v1.19.0: 위 10% 지점에서 시작
  outerAngle: 0.125,     // V 벌어짐 (0.5 = 수평) — v1.19.0: 아래 45° 에서 시작
  baseStructureVisible: false,
});
const DEFAULT_PHOTO = Object.freeze({ zoom: 1, ox: 0, oy: 0, rot: 0 });

const V_ANGLE_MAX = 60;   // V Angle 최대 각도(도) — v1.19.0: ±45° 를 담으려고 40 → 60
const ROT_MAX = 30;       // 밸런스(회전) 최대 각도(도)
const ZOOM_MIN = 0.5, ZOOM_MAX = 20;   /* v1.25.0 — 작은 사진도 목표 눈 크기까지 확대되도록 8→20 */
const OFFSET_MAX = 1.0;   // 사진 좌우/위아래 이동 한계 (캔버스 비율)
const SLIDER_OFFSET = 0.5;// 좌우/위아래 슬라이더 범위 (드래그는 OFFSET_MAX 까지)
const HIT_PX = 28;        // 화면에서 선을 탭/드래그로 잡는 인식 반경
const EYE_FRAC = 0.44;    // 자동 정렬 시 동공 간 거리 / 캔버스 폭 (클수록 얼굴이 크게 잡힘)
/* ── 메인 작업 영역 (v1.17.0) ──────────────────────────────────
   캔버스 왼쪽 끝 ~ **오른쪽 위아래 드래그 바 왼쪽 끝**까지가 실제 작업 공간이다.
   · 가로 가이드 선은 이 영역을 넘어가지 않는다 (오른쪽 컨트롤·스크림 위로 튀어나오지 않게)
   · 사진 자동 배치와 라인 배치도 이 영역의 **한가운데**를 기준으로 한다
   세로는 위쪽에 눈썹을 그릴 여유를 두려고 55% (CENTER_Y). */
const WORK_GAP = 8;              // 드래그 바 왼쪽에서 띄우는 여유
const CENTER_Y = 0.60;
function workRight() {           // 0~1 정규화. 도크가 아직 없으면 1(전체)
  const d = $("rightDock"), W = S.dim.W;
  if (!d || !d.offsetWidth || !W) return 1;
  return clamp((d.offsetLeft - WORK_GAP) / W, 0.5, 1);
}
const centerX = () => workRight() / 2;
/* 인체 계측 평균비 — 동공 간 거리 기준 (동공 오프셋 = 1.0) */
const R_INNER = 0.52;     // 눈 앞머리(내안각)
const R_OUTER = 1.50;     // 눈꼬리(외안각)

/* ═══════════ 3. state ═══════════ */
const S = {
  g: { ...DEFAULT_GUIDE },
  p: { ...DEFAULT_PHOTO },
  sel: "h1",
  /* 조절자가 2개이므로 축별로 대상을 따로 기억한다 (v1.9.0)
     selUD = 세로 조절자가 움직일 가로선 / selLR = 가로 조절자가 움직일 세로선 */
  selUD: "h1",
  selLR: "v1",
  /* 아래 오른쪽 가로 드래그 바는 하나로 두 가지를 조절한다 (v1.11.0)
     "line"  = S.selLR 세로선 좌우 이동  /  "photo" = 사진 보정(줌·위아래·좌우·밸런스) */
  hMode: "line",
  hist: [],              // 되돌리기 스택 (v1.12.0) — 한 번에 한 작업씩
  redo: [],              // 다시 실행 스택 (v1.19.0) — 되돌린 작업을 앞으로 되감는다
  activePreset: null,    // 지금 적용 중인 프리셋 id (v1.25.0)
  balOn: false,          // 밸런스 표시 중 (v1.26.0)
  refSide: localStorage.getItem("pb_refside") === "R" ? "R" : "L",   // 기준 쪽 — 다음에도 유지
  balance: null,         // { off: {key: 차이px}, skipped: [key] }
  multi: false,          // 여러라인 모드 (v1.18.0)
  selSet: [],            // 여러라인 모드에서 선택된 키들 — 함께 움직인다
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
  picking: false,        // 사진 선택 시트가 열려 있는 동안 (v1.27.0) — 그때만 세로로 되돌린다
};

/* ═══════════ DOM ═══════════ */
const $ = (id) => document.getElementById(id);
const stage = $("stage"), photo = $("photo"), svg = $("guides"), touch = $("touch");
const hud = $("hud"), aiStatus = $("aiStatus");
const posSliderV = $("posSliderV"), posSliderH = $("posSliderH");

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SVGNS = "http://www.w3.org/2000/svg";

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("on"), 1900);
}
function showHud(html, ms) {
  hud.innerHTML = html;
  hud.classList.add("show");
  clearTimeout(showHud._t);
  showHud._t = setTimeout(() => hud.classList.remove("show"), ms || 900);
}

/* ═══════════ 4. render ═══════════ */

function measure() {
  /* getBoundingClientRect 는 CSS 회전이 걸리면 축정렬 bbox 를 돌려주므로
     변환과 무관한 레이아웃 크기(offsetWidth/Height)를 쓴다. (BASELINE 1-1) */
  S.dim.W = Math.max(1, stage.offsetWidth || Math.round(stage.getBoundingClientRect().width));
  S.dim.H = Math.max(1, stage.offsetHeight || Math.round(stage.getBoundingClientRect().height));
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
  bx = clamp(bx, 1, (S.wr || S.dim.W) - w - 1);
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

/* ═══ 가로 자의 x 범위 (v1.32.0) ═══════════════════════════════
   ⚠️ **자는 자기 묶음의 세로선 위에 올라간다.** frac 상수로 박아 두지 마세요 —
   v1.31.x 가 그렇게 돼 있어서 **아치 자가 아우터를 따라 움직였습니다**
   (원장님이 직접 찾아내신 문제, 2026-08-20).
     앞머리·앞두께 → 이너(v2/v3) · 아치·아치두께 → 아치선(v6/v7) · 꼬리 → 아우터(v4/v5)
   자의 폭은 **눈썹 폭(이너~아우터 거리)** 에 비례하므로, 확대하거나 얼굴이 바뀌어도
   자가 관자놀이·코까지 뻗지 않습니다. 눈 기준선(h1)만 좌우를 관통합니다. */
const SEG_HALF = 0.19;           // 자 반폭 (눈썹 폭 기준)
const BROW_PAD = 0.022;          // 눈 기준선이 아우터 바깥으로 더 나가는 여유
const VPAD = 0.045;              // 세로선(긴 것)이 위아래로 더 나가는 여유
const VPAD_TIGHT = 0.025;        // 짧은 세로선의 여유 — 눈까지 내려오지 않는다 (v1.33.0)

/* 그 가로선의 좌·우 토막 [x0px, x1px]. 그리는 범위 = 잡는 범위 = 재는 범위 (BASELINE 1-11) */
function segPx(sp) {
  const { W } = S.dim, g = S.g;
  const cl0 = (t) => clamp(t, 0, workRight()) * W;
  if (!sp.anchor) {                                      // 눈 기준선 — 눈썹 구간을 좌우로 관통
    const lo = Math.min(g.v2, g.v4, g.v6) - BROW_PAD;
    return [[cl0(lo), cl0(2 * g.v1 - lo)]];
  }
  const aL = g[sp.anchor], aR = 2 * g.v1 - aL;
  const half = SEG_HALF * (Math.abs(g.v2 - g.v4) || 0.12);
  return [[cl0(aL - half), cl0(aL + half)], [cl0(aR - half), cl0(aR + half)]];
}

/* 세로선이 실제로 진하게 보이는 구간 — 가장 위 가로선 위쪽부터 눈 기준선 아래까지.
   표시 여부와 무관하게 모든 가로선 값을 쓰므로 선을 껐다 켜도 길이가 흔들리지 않는다. */
/* tight=true → **눈썹 가로선만** 감싼다 (눈 기준선 제외). 아치선·아우터가 씁니다.
   원장님 지시(2026-08-20): 「세로 라인은 이너라인 빼고 더 얇게 짧게 · 아래 눈 위치까지
   내려오지 않아도 된다」. 이너만 눈까지 길게 — 내안각과 맞춰 보는 기준선이라서. */
function browBandY(tight) {
  const g = S.g;
  const ys = H_SPECS.filter((sp) => !tight || sp.anchor).map((sp) => g[sp.key]);
  const pad = tight ? VPAD_TIGHT : VPAD;
  return { y0: clamp(Math.min(...ys) - pad, 0, 1), y1: clamp(Math.max(...ys) + pad, 0, 1) };
}

function renderGuides() {
  const { W, H } = S.dim, g = S.g;
  const WR = workRight() * W;          // 가로선·라벨은 여기까지만 (v1.17.0)
  S.wr = WR;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const frag = document.createDocumentFragment();
  const vBadges = [];   // 세로선 라벨은 겹치지 않게 나중에 한꺼번에 배치
  /* 가로선 라벨 배지는 표시하지 않는다 — 선 색상과 왼쪽 레일 버튼 색이 1:1 로 대응하므로
     화면을 가리지 않는 쪽이 시술 중에 훨씬 낫다. (2026-08-15 제거) */
  /* 상단 오버레이 칩(all line / V Center Pivot) 아래로 세로선 라벨 배치 */
  const V_LABEL_Y = 6;   /* 세로선 라벨은 캔버스 맨 위에서 6px 갭 (v1.15.0) */

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

  /* 가로 라인 — 세로 이너 선과 **같은 방식**: 재는 구간만 두껍게, 이너까지는 얇은 실선 (v1.23.0)
     얇은 선 색은 이너 선과 같은 중성색으로 통일한다. 이 선이 없으면 자가 공중에 떠 보인다. */
  {
    const HAIR = V_SPECS[1].color;                     // 이너 선 색 (중성)
    for (const sp of H_SPECS) {
      if (!g[sp.vis]) continue;
      const y = g[sp.key] * H;
      const sel = isSelected(sp.key);
      const segs = segPx(sp);
      /* 눈은 원래 좌우를 관통하고, 꼬리는 얇은 실선 없이 토막만 (v1.24.0).
         나머지는 **자기 토막 ↔ 이너 선**을 아주 옅게 이어 준다 — 자가 공중에 떠 보이지 않게. */
      if (sp.key !== "h1" && sp.key !== "h3") {
        const xi = g.v2 * W, xi2 = (2 * g.v1 - g.v2) * W;
        for (const [seg, tgt] of [[segs[0], xi], [segs[1], xi2]]) {
          const xa = Math.min(seg[0], seg[1], tgt), xb = Math.max(seg[0], seg[1], tgt);
          if (xb - xa < 2) continue;
          frag.appendChild(mk("line", {
            x1: xa, y1: y, x2: xb, y2: y, stroke: HAIR,
            "stroke-width": 1, "stroke-opacity": 0.16,
          }));
        }
      }
      /* 밸런스 표시 중이면 **기준 반대쪽 토막만** 빨갛게 (기준 쪽은 정답이므로 건드리지 않음) */
      const offBy = S.balOn && S.balance && S.balance.off[sp.key];
      const badIdx = S.refSide === "L" ? 1 : 0;
      segs.forEach(([xa, xb], idx) => {
        if (xb - xa < 2) return;                       // 세로선이 화면 밖으로 밀리면 그리지 않는다
        const bad = offBy && idx === badIdx;
        drawLine(frag, xa, y, xb, y,
          bad ? BAL_RED : sp.color,
          bad ? sp.w + 2.2 : (sel ? sp.w + 1.6 : sp.w),
          bad ? 1 : (sel ? 1 : sp.op));
      });
    }
  }

  /* 세로 라인 (+ 대칭선) */
  {
    const bandL = browBandY(false), bandT = browBandY(true);
    /* Center(v1) 는 얼굴 중심축이라 위아래 전체 길이 그대로 (BASELINE 1-7).
       이너(long)는 눈까지 길게, 아치선·아우터는 **눈썹 구간만 짧게** (v1.33.0 원장님 지시).
       라벨(캔버스 맨 위)까지는 아주 옅은 연결선만 남겨 라벨이 허공에 뜨지 않게 한다. */
    for (const sp of V_SPECS) {
      if (!g[sp.vis]) continue;
      const sel = isSelected(sp.key);
      const w = sel ? sp.w + 1.6 : sp.w, op = sel ? 1 : sp.op;
      const full = sp.key === "v1";
      const band = sp.long ? bandL : bandT;
      const by0 = band.y0 * H, by1 = band.y1 * H;
      const draw = (x) => {
        if (full) { drawLine(frag, x, 0, x, H, sp.color, w, op); return; }
        frag.appendChild(mk("line", {                       // 라벨 ↔ 선 연결 (헤일로 없음)
          x1: x, y1: 0, x2: x, y2: H, stroke: sp.color,
          "stroke-width": 1, "stroke-opacity": 0.16,
        }));
        drawLine(frag, x, by0, x, by1, sp.color, w, op);    // 실제로 읽는 구간
      };
      const x = g[sp.key] * W;
      draw(x);
      vBadges.push({ label: t(sp.i18n), color: sp.color, x });
      if (sp.mirror) {
        const xm = (2 * g.v1 - g[sp.key]) * W;
        draw(xm);
        vBadges.push({ label: t(sp.i18n), color: sp.color, x: xm });
      }
    }
  }
  /* 세로선 라벨 — 가로로 겹치면 아래 줄로 내려서 배치 */
  {
    const ly = Math.min(V_LABEL_Y, Math.max(3, H - 40));
    const rowRight = [];
    /* 왼쪽 위 오버레이 칩(all line · AI 안내)을 가리지 않도록 그 사각형을 피해 배치한다.
       회전(rot90) 때문에 getBoundingClientRect 는 쓰지 않고 레이아웃 좌표로 계산한다. */
    const blocks = [];
    /* 캔버스 위쪽에 떠 있는 것들을 **전부** 피한다 (v1.29.0).
       하나라도 빼면 `센터`·`이너` 라벨이 그 글자 위에 겹쳐 둘 다 안 읽힙니다.
       실제로 v1.29.0 개발 중 밸런스 묶음을 빠뜨려 `센터` 라벨이 가려졌습니다. */
    /* ⚠️ offsetParent 를 **끝까지** 거슬러 올라가고, **transform 이동량까지** 더합니다.
       `offsetLeft` 는 CSS transform 을 반영하지 않습니다 — `드로잉 맞춤`·`밸런스` 묶음이
       `translateX(-50%)` 로 놓여 있어, 이걸 빼먹으면 좌표가 통째로 어긋나 라벨이 겹칩니다.
       회전(rot90) 때문에 getBoundingClientRect 는 여기서 쓸 수 없습니다 (BASELINE 1-6). */
    const tfxy = (el) => {
      const m = getComputedStyle(el).transform;
      const p = m && m !== "none" ? m.match(/matrix\(([^)]+)\)/) : null;
      if (!p) return { x: 0, y: 0 };
      const a = p[1].split(",").map(Number);
      return { x: a[4] || 0, y: a[5] || 0 };
    };
    for (const el of [$("btnAllLine"), $("btnMulti"), $("aiStatus"), $("btnBalance"), $("btnSnap"), $("refWrap")]) {
      if (!el || !el.offsetWidth) continue;
      let bx = el.offsetLeft, by = el.offsetTop, node = el, par = el.offsetParent;
      for (;;) {
        const d = tfxy(node); bx += d.x; by += d.y;
        if (!par || par === stage) break;
        bx += par.offsetLeft; by += par.offsetTop;
        node = par; par = par.offsetParent;
      }
      blocks.push({ x0: bx, x1: bx + el.offsetWidth, y0: by, y1: by + el.offsetHeight });
    }
    vBadges.sort((a, b) => a.x - b.x);
    for (const bg of vBadges) {
      const bw = badgeW(bg.label), bl = bg.x - bw / 2, br = bg.x + bw / 2;
      let r = 0;
      while (r < 7) {
        const y0 = ly + r * 17, y1 = y0 + 14;
        const hitRow = rowRight[r] !== undefined && bl < rowRight[r] + 3;
        const hitChip = blocks.some((k) => bl < k.x1 + 3 && br > k.x0 - 3 && y0 < k.y1 && y1 > k.y0);
        if (!hitRow && !hitChip) break;
        r++;
      }
      rowRight[r] = br;
      drawBadge(frag, bg.label, bg.x, Math.min(ly + r * 17, H - 16), bg.color, "middle");
    }
  }

  /* Base Structure — V형 기본 구조 */
  if (g.baseStructureVisible) {
    const px = g.v1 * W, py = g.innerAngle * H;
    const deg = (g.outerAngle - 0.5) * 2 * V_ANGLE_MAX;
    const tn = Math.tan((deg * Math.PI) / 180);
    const selA = isSelected("outerAngle"), selP = isSelected("innerAngle");
    const w = selA ? 3.4 : 2.2;
    drawLine(frag, px, py, 0, py - tn * px, "#14161B", w, 0.85);
    drawLine(frag, px, py, WR, py - tn * (WR - px), "#14161B", w, 0.85);
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
    g.v6 = clamp(g.v6 + d, 0, 1);
    g.v7 = clamp(g.v7 + d, 0, 1);
  } else if (key === "v2") {
    g.v2 = val; g.v3 = 2 * g.v1 - val;
  } else if (key === "v4") {
    g.v4 = val; g.v5 = 2 * g.v1 - val;
  } else if (key === "v6") {
    g.v6 = val; g.v7 = 2 * g.v1 - val;
  } else {
    g[key] = val;
  }
}

/* 선택된 바를 손가락 이동량(정규화 델타)만큼 움직인다.
   각 바는 자기 축으로만 움직이고(BASELINE 1-7), 대칭은 setLine() 이 처리한다(1-2). */
function dragLineBy(key, base, dxN, dyN, mirrored) {
  const g = S.g;
  if (key === "innerAngle") {
    g.innerAngle = clamp(base + dyN, 0.02, 0.98);          // 위아래
  } else if (key === "outerAngle") {
    g.outerAngle = clamp(base - dyN * 1.2, 0, 1);          // 위로 = 넓게
  } else if (H_KEYS.has(key)) {
    setLine(key, base + dyN);                              // 가로 바 → 위아래로만
  } else {
    setLine(key, mirrored ? base - dxN : base + dxN);      // 세로 바 → 좌우로만 (대칭 유지)
  }
}

/* ═══════════ 5. gesture ═══════════ */

function linePixels() {
  const { W, H } = S.dim, g = S.g, out = [];
  for (const sp of H_SPECS) {
    if (!g[sp.vis]) continue;
    out.push({ type: "h", key: sp.key, y: g[sp.key] * H, segs: segPx(sp) });
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
      /* 그리는 범위와 잡는 범위는 반드시 같아야 한다 (BASELINE 1-11) — 둘 다 segPx */
      const inSeg = L.segs.some(([xa, xb]) => x >= xa - 12 && x <= xb + 12);
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

/* 사진 이동 한계 — 배율이 커질수록 더 멀리 밀 수 있어야 자연스럽다 */
const panLimit = () => OFFSET_MAX * Math.max(1, S.p.zoom);

/* 화면(포인터) 좌표 → 캔버스 좌표 ─ v1.10.0
   ⚠️ getScreenCTM() 은 쓰지 않는다. iOS 사파리(WebKit)는 조상 요소의 **CSS transform 을
      CTM 에 반영하지 않는** 경우가 있어, body.rot90 상태에서 손가락 방향이 90° 어긋난다
      (위아래로 끌면 선이 좌우로 움직임). 크로미움은 반영하므로 PC 테스트로는 안 잡힌다.
   대신 rot90 의 변환을 직접 역으로 푼다. .screen 은
      transform-origin:0 0; transform: translateX(100dvw) rotate(90deg)
   이므로  로컬 +x → 뷰포트 +y,  로컬 +y → 뷰포트 −x  이다.
   회전된 stage 의 축정렬 bbox 로 나타내면  로컬x = clientY − rect.top,
                                            로컬y = rect.right − clientX. */
function stagePoint(e) {
  const r = stage.getBoundingClientRect();
  if (document.body.classList.contains("rot90")) {
    return { x: e.clientY - r.top, y: r.right - e.clientX };
  }
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
  const sp = stagePoint(e);
  pts.set(e.pointerId, sp);
  beginEdit();                       /* 제스처 1회 = 되돌리기 1단계 (v1.12.0) */

  if (pts.size === 1) {
    /* 데스크톱 보조: Shift + 드래그 = 사진 이동 */
    if (e.shiftKey && !S.locked) {
      gMode = "pan";
      gDrag = { ox: S.p.ox, oy: S.p.oy, x0: sp.x, y0: sp.y };
      return;
    }
    /* v1.11.0 — 한 손가락 규칙
         · 선 위를 잡으면        → 그 선을 선택하고 끈다 (잠금 여부 무관)
         · 빈 곳 + 잠금 해제     → 사진을 사방으로 자유 이동 (팬)
         · 빈 곳 + 사진 잠금     → 이미 선택된 선을 끈다 (미세조정 모드)
       두 손가락은 항상 줌·회전·이동. */
    const hit = hitTest(sp.x, sp.y);
    let key, mirrored = false, tapKey = null, wasSel = false;
    if (hit) {
      if (hit.type === "pivot") key = "innerAngle";
      else if (hit.type === "arm") key = "outerAngle";
      else { key = hit.key; mirrored = !!hit.mirrored; }
      tapKey = key;
      /* 한 줄 모드에서 "이미 선택돼 있던 선"을 다시 탭하면 손을 뗄 때 숨김/표시로 판정한다
         (레일 버튼과 같은 규칙 · BASELINE 1-7). 판정 기준은 setSel 이 S.sel 을 덮어쓰기 전 값. */
      wasSel = !S.multi && S.sel === key && S.hMode === "line";
      if (S.multi) noteSel(key);      /* 탭/해제는 손을 뗄 때 판정 (데드존) */
      else setSel(key);
    } else if (!S.locked) {
      gMode = "pan";
      gDrag = { ox: S.p.ox, oy: S.p.oy, x0: sp.x, y0: sp.y };
      return;
    } else {
      key = S.sel;
    }
    /* 여러라인 모드에서 아직 선택되지 않은 선을 잡으면, 끌기 시작할 때 선택에 합류시킨다 */
    const keys = S.multi
      ? (S.selSet.includes(key) ? S.selSet.slice() : S.selSet.concat(key))
      : [key];
    gMode = "line";
    gDrag = { key, mirrored, tapKey, wasSel, keys, baseAll: { ...S.g }, base: S.g[key], x0: sp.x, y0: sp.y };
    render();
    const c0 = posConfig();
    showHud(`${c0.name} ${t("sel_line")}<br>${c0.axis === "v" ? "▲▼" : "◀▶"} ${c0.disp}`);
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
  const sp = stagePoint(e);
  pts.set(e.pointerId, sp);
  const { W, H } = S.dim, g = S.g;

  if (gMode === "line" && gDrag) {
    /* 탭으로 선을 "고르기만" 할 때 손가락 떨림으로 선이 밀리지 않도록 3px 데드존.
       넘어선 뒤에는 처음 누른 지점 기준 전체 이동량을 그대로 적용한다(정확도 유지). */
    if (!gDrag.moved) {
      if (Math.hypot(sp.x - gDrag.x0, sp.y - gDrag.y0) < 3) return;
      gDrag.moved = true;
      /* 끌기 시작 = 잡은 선을 선택에 합류 (여러라인 모드) */
      if (S.multi && gDrag.tapKey && !S.selSet.includes(gDrag.tapKey)) S.selSet.push(gDrag.tapKey);
    }
    const dxN = (sp.x - gDrag.x0) / W, dyN = (sp.y - gDrag.y0) / H;
    if (S.multi && gDrag.keys.length > 1) {
      dragManyBy(gDrag.keys, gDrag.baseAll, dxN, dyN, gDrag.mirrored ? gDrag.key : null);
    } else {
      dragLineBy(gDrag.key, gDrag.base, dxN, dyN, gDrag.mirrored);
    }
    render();
    const cd = posConfig();
    showHud(S.multi && gDrag.keys.length > 1
      ? `${gDrag.keys.length}${t("sel_count")}`
      : `${cd.name}<br>${cd.axis === "v" ? "▲▼" : "◀▶"} ${cd.disp}`);
  } else if (gMode === "pan" && gDrag) {
    /* 손가락 이동량을 1:1 로 따라간다. 확대할수록 더 멀리 밀 수 있어야 하므로
       한계도 배율에 비례시킨다 (panLimit). */
    const lim = panLimit();
    S.p.ox = clamp(gDrag.ox + (sp.x - gDrag.x0) / W, -lim, lim);
    S.p.oy = clamp(gDrag.oy + (sp.y - gDrag.y0) / H, -lim, lim);
    render();
  } else if (gMode === "xform" && gDrag && pts.size >= 2) {
    const [a, b] = [...pts.values()];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    S.p.zoom = clamp(gDrag.zoom0 * (d / gDrag.d0), ZOOM_MIN, ZOOM_MAX);
    S.p.rot = clamp(gDrag.rot0 + ((ang - gDrag.a0) * 180) / Math.PI, -ROT_MAX, ROT_MAX);
    const lim2 = panLimit();
    S.p.ox = clamp(gDrag.ox0 + (cx - gDrag.cx0) / W, -lim2, lim2);
    S.p.oy = clamp(gDrag.oy0 + (cy - gDrag.cy0) / H, -lim2, lim2);
    showHud(`${t("editor_zoom")} ${S.p.zoom.toFixed(2)}×<br>${t("editor_balance")} ${S.p.rot.toFixed(1)}°`);
    render();
  }
}, { passive: false });

function endPointer(e) {
  pts.delete(e.pointerId);
  /* "탭만" 했을 때(3px 데드존을 넘지 않음)의 판정 — 여러라인 / 한 줄 모드가 다르다 (BASELINE 1-7)
       · 여러라인 : 선택에 추가 / 이미 있으면 선택 해제 (숨기지 않음)
       · 한 줄    : 새 선이면 선택만, 이미 선택돼 있던 선을 다시 탭하면 숨김/표시 */
  if (pts.size === 0 && gMode === "line" && gDrag && !gDrag.moved && gDrag.tapKey) {
    if (S.multi) {
      toggleSel(gDrag.tapKey);
      render();
      showHud(S.selSet.length ? `${S.selSet.length}${t("sel_count")}` : t("multi_on"));
    } else if (gDrag.wasSel) {
      const vk = visKeyOf(gDrag.tapKey);
      if (vk) {
        step(() => { S.g[vk] = !S.g[vk]; });
        render();
        showHud(`${labelOf(gDrag.tapKey)} ${S.g[vk] ? t("line_shown") : t("line_hidden")}`);
      }
    }
  }
  if (pts.size < 2) { gMode = pts.size === 1 ? null : null; gDrag = null; }
  if (pts.size === 0) commitEdit();   /* 손을 다 떼면 한 작업으로 확정 */
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

/* ═══════════ 6. 되돌리기 (undo) ═══════════ v1.12.0
   "작업" 하나 = 사용자가 손을 뗄 때까지의 한 동작.
   · 드래그/핀치 제스처 1회      (pointerdown → pointerup)
   · 슬라이더 드래그 1회          (pointerdown → change)
   · 버튼 한 번                   (± · 숨김/표시 · 초기화 · 프리셋 적용)
   시작 전에 beginEdit() 로 스냅샷을 잡고, 끝나면 commitEdit() 이
   **실제로 값이 바뀌었을 때만** 스택에 넣는다. (탭만 한 경우는 기록되지 않음) */
const HIST_MAX = 60;
const snapState = () => ({
  g: { ...S.g },
  p: { ...S.p },
  hs: S.hiddenSnapshot ? { ...S.hiddenSnapshot } : null,
});
const sameState = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let editSnap = null;
function beginEdit() { if (!editSnap) editSnap = snapState(); }
function commitEdit() {
  if (!editSnap) return;
  const before = editSnap;
  editSnap = null;
  if (sameState(before, snapState())) return;          // 값이 그대로면 기록하지 않는다
  S.hist.push(before);
  if (S.hist.length > HIST_MAX) S.hist.shift();
  S.redo = [];
  S.balance = null;                                   // 선을 건드리면 측정값이 낡는다 (v1.26.0)                                        // 새 작업을 하면 다시 실행 갈래는 버린다
  updateUndoBtn();
}
function clearHist() { S.hist = []; S.redo = []; editSnap = null; updateUndoBtn(); }
function updateUndoBtn() {
  const u = $("btnUndo"), r = $("btnRedo");
  if (u) u.disabled = S.hist.length === 0;
  if (r) r.disabled = S.redo.length === 0;
}
/* 되돌리기 ↔ 다시 실행 — 서로의 스택에 현재 상태를 넘겨주며 한 단계씩 오간다 (v1.19.0) */
function applySnap(sn) {
  S.g = { ...sn.g };
  S.p = { ...sn.p };
  S.hiddenSnapshot = sn.hs ? { ...sn.hs } : null;
  render();
  updateUndoBtn();
}
function undo() {
  const prev = S.hist.pop();
  if (!prev) { toast(t("undo_none")); return; }
  S.redo.push(snapState());                           // 지금 상태를 다시 실행 쪽으로
  if (S.redo.length > HIST_MAX) S.redo.shift();
  applySnap(prev);
  toast(t("undo_done"));
}
function redo() {
  const next = S.redo.pop();
  if (!next) { toast(t("redo_none")); return; }
  S.hist.push(snapState());                           // 지금 상태를 되돌리기 쪽으로
  if (S.hist.length > HIST_MAX) S.hist.shift();
  applySnap(next);
  toast(t("redo_done"));
}
/* 한 번의 클릭으로 끝나는 작업을 감싸는 helper */
function step(fn) { beginEdit(); fn(); commitEdit(); }

/* ═══════════ 6. 버튼 · 패널 ═══════════ */

/* ── 선택 판정 (v1.18.0) ──────────────────────────────
   여러라인 모드에서는 selSet 에 든 선이 모두 "선택됨"(굵고 선명하게)이고 함께 움직인다.
   selSet 이 비면 단일 선택(S.sel)으로 폴백한다. */
const isSelected = (k) => (S.multi && S.selSet.length ? S.selSet.includes(k) : S.sel === k);
const activeKeys = () => (S.multi && S.selSet.length ? S.selSet.slice() : [S.sel]);
function toggleSel(k) {
  const i = S.selSet.indexOf(k);
  if (i >= 0) S.selSet.splice(i, 1);
  else S.selSet.push(k);
  noteSel(k);
}

/* 여러 선을 손가락 이동량만큼 **동시에** 움직인다 (기준값 + 델타 · BASELINE 1-4).
   Center(v1) 가 포함되면 v1 만 움직여도 나머지 세로선이 따라오므로(1-2) 중복 이동을 막는다. */
function dragManyBy(keys, baseAll, dxN, dyN, mirroredKey) {
  const ud = keys.filter((k) => axisOf(k) === "v");
  let lr = keys.filter((k) => axisOf(k) === "h");
  if (lr.includes("v1")) lr = ["v1"];
  for (const k of ud) dragLineBy(k, baseAll[k], 0, dyN, false);
  for (const k of lr) dragLineBy(k, baseAll[k], dxN, 0, k === mirroredKey);
}

/* 선택 기록 — S.sel(드래그 대상) 과 축별 조절자 대상을 함께 갱신 */
function noteSel(key) {
  S.sel = key;
  /* 세로선(좌우 이동)을 고르면 아래 가로 바를 선 조절로 되돌린다 (v1.11.0) */
  if (axisOf(key) === "v") S.selUD = key;
  else { S.selLR = key; S.hMode = "line"; }
}
function setSel(key) {
  noteSel(key);
  updatePanels();
}

function buildLineButtons() {
  const mkBtn = (spec) => {
    const b = document.createElement("button");
    b.className = "lbtn";
    b.dataset.key = spec.key;
    b.dataset.vis = spec.vis;
    b.textContent = t(spec.i18n);
    b.addEventListener("click", () => {
      let aiSnapped = false;
      /* 여러라인 모드 : 누를 때마다 선택에 추가 / 다시 누르면 해제 (숨기지 않음)
         한 줄 모드   : 1번 탭 = 선택(움직임), 같은 버튼 다시 탭 = 숨김/표시
         사진 보정 중이었다면 첫 탭은 선 조절로 되돌리는 역할만 한다. */
      if (S.multi) {
        step(() => { S.g[spec.vis] = true; });
        toggleSel(spec.key);
        showHud(S.selSet.length ? `${S.selSet.length}${t("sel_count")}` : t("multi_on"));
      } else {
        step(() => {
          const wasOn = S.g[spec.vis];
          if (S.sel === spec.key && S.hMode === "line") S.g[spec.vis] = !S.g[spec.vis];
          else S.g[spec.vis] = true;
          /* 꺼져 있던 선을 켤 때는 **그 고객 사진에서 측정한 자리**로 올린다 (v1.22.0).
             랜드마크가 없으면(얼굴 인식 실패) 마지막 값 그대로 — 조용히 실패한다. */
          if (!wasOn && S.g[spec.vis] && aiPlaceLine(spec.key)) aiSnapped = true;
        });
        noteSel(spec.key);
      }
      render();
      if (aiSnapped) showHud(`${t(spec.i18n)} · ${t("ai_placed")}`, 1400);
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
    /* v1.20.0 — 버튼 전체를 선 색으로 칠하지 않는다 (가이드 선과 색이 싸움).
       왼쪽 색 띠 = 어느 선인지 / 채움 = 선택됨. BASELINE 1-13 참고. */
    b.style.setProperty("--dot", spec.dot || spec.color);
    b.classList.toggle("hidden-line", !vis);
    b.classList.toggle("sel", isSelected(spec.key));
  });
  $("btnMulti").classList.toggle("on", S.multi);
  /* 전체라인 = 여러라인의 후속 버튼 — 여러라인이 꺼져 있으면 아예 보이지 않는다 (v1.19.0) */
  const allSel = $("btnAllSel");
  allSel.hidden = !S.multi;
  const vk = visibleLineKeys();
  allSel.classList.toggle("on", S.multi && vk.length > 0 && vk.every((k) => S.selSet.includes(k)));
  $("btnPivot").classList.toggle("on", isSelected("innerAngle") && S.g.baseStructureVisible);
  $("btnVAngle").classList.toggle("on", isSelected("outerAngle") && S.g.baseStructureVisible);
  $("btnAllLine").classList.toggle("on", !!S.hiddenSnapshot);
  setLockIcon(S.locked);
  $("btnPresetLoad").classList.toggle("preset-on", !!S.activePreset);
  $("btnBalance").classList.toggle("on", S.balOn);
  /* 기준 쪽 — 밸런스를 켜야 나오고, **왼쪽/오른쪽 중 켜진 쪽만** 색이 들어온다 (v1.29.0) */
  $("refWrap").hidden = !S.balOn;
  $("btnRefL").classList.toggle("on", S.refSide === "L");
  $("btnRefR").classList.toggle("on", S.refSide === "R");
  $("btnLock").classList.toggle("on", S.locked);
  $("lockLabel").textContent = S.locked ? t("editor_photo_unlock") : t("editor_photo_lock");
  updateUndoBtn();
}

/* 잠금 아이콘은 상태에 따라 **모양**이 바뀐다 (v1.20.0)
   색만으로 구분하면 역광·화면 기울임에서 안 읽힌다. 자물쇠가 닫혔나 열렸나로 판단하게 한다. */
const LOCK_SVG = {
  on:  '<rect x="4.5" y="10.5" width="15" height="10" rx="2.4"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/><circle cx="12" cy="15.4" r="1.15" fill="currentColor" stroke="none"/>',
  off: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.4"/><path d="M8 10.5V7.8a4 4 0 0 1 7.6-1.7"/><circle cx="12" cy="15.4" r="1.15" fill="currentColor" stroke="none"/>',
};
let lockIconState = null;
function setLockIcon(locked) {
  if (lockIconState === locked) return;          // 매 프레임 innerHTML 을 새로 쓰지 않는다
  lockIconState = locked;
  const svg = $("lockIcon") && $("lockIcon").querySelector("svg");
  if (svg) svg.innerHTML = locked ? LOCK_SVG.on : LOCK_SVG.off;
}

/* ── 위치 조절 패널 ── */
const H_KEYS = new Set(H_SPECS.map((s) => s.key));

/* 이 선은 어느 축으로 움직이는가 — "v" 위아래(가로선) / "h" 좌우(세로선) */
const axisOf = (k) => (H_KEYS.has(k) || k === "innerAngle" || k === "outerAngle" ? "v" : "h");

function posConfig(key) {
  const g = S.g, k = key || S.sel;
  /* axis: "v" = 위아래로만 움직이는 바(가로선) / "h" = 좌우로만 움직이는 바(세로선)
     각 바는 자기 축으로만 움직인다. 대칭 처리는 setLine() 이 담당. (BASELINE 1-2) */
  if (k === "outerAngle") {
    const deg = (g.outerAngle - 0.5) * 2 * V_ANGLE_MAX;
    return { name: t("editor_outer_angle"), v: g.outerAngle, disp: deg.toFixed(1) + "°", hint: t("hint_narrowwide"), step: 0.006, invert: false, axis: "v" };
  }
  if (k === "innerAngle") {
    return { name: t("editor_inner_angle"), v: 1 - g.innerAngle, disp: Math.round((1 - g.innerAngle) * 100), hint: t("hint_updown"), step: 0.003, invert: true, axis: "v" };
  }
  if (H_KEYS.has(k)) {
    const sp = H_SPECS.find((s) => s.key === k);
    return { name: t(sp.i18n), v: 1 - g[k], disp: Math.round((1 - g[k]) * 100), hint: t("hint_updown"), step: 0.003, invert: true, axis: "v" };
  }
  const sp = V_SPECS.find((s) => s.key === k);
  return { name: t(sp.i18n), v: g[k], disp: Math.round(g[k] * 100), hint: t("hint_leftright"), step: 0.003, invert: false, axis: "h" };
}

function applyPos(v, key) {
  const k = key || S.sel, c = posConfig(k);
  v = clamp(v, 0, 1);
  if (k === "outerAngle") S.g.outerAngle = v;
  else if (k === "innerAngle") S.g.innerAngle = clamp(1 - v, 0.02, 0.98);
  else setLine(k, c.invert ? 1 - v : v);
  render();
}

/* ── 사진 보정 패널 ── */
function photoConfig() {
  const p = S.p, lim = panLimit();
  switch (S.photoMode) {
    case "zoom":
      return { name: t("editor_zoom"), v: Math.log(p.zoom / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN), disp: p.zoom.toFixed(2) + "×", step: 0.03 };
    case "vertical":
      return { name: t("editor_vertical"), v: clamp(p.oy / (2 * lim) + 0.5, 0, 1), disp: Math.round(p.oy * 100), step: 0.012 };
    case "horizontal":
      return { name: t("editor_horizontal"), v: clamp(p.ox / (2 * lim) + 0.5, 0, 1), disp: Math.round(p.ox * 100), step: 0.012 };
    case "balance":
      return { name: t("editor_balance"), v: p.rot / (2 * ROT_MAX) + 0.5, disp: p.rot.toFixed(1) + "°", step: 0.008 };
  }
}

function applyPhoto(v) {
  v = clamp(v, 0, 1);
  const p = S.p, lim = panLimit();
  if (S.photoMode === "zoom") p.zoom = ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, v);
  else if (S.photoMode === "vertical") p.oy = (v - 0.5) * 2 * lim;
  else if (S.photoMode === "horizontal") p.ox = (v - 0.5) * 2 * lim;
  else if (S.photoMode === "balance") p.rot = (v - 0.5) * 2 * ROT_MAX;
  render();
}

/* 세로 조절자는 가로 range 를 -90° 회전해 쓰므로 트랙 길이를 슬롯 높이에 맞춘다.
   (writing-mode 세로 range 는 구형 사파리에서 동작하지 않음) */
function sizePosSlider() {
  const slot = $("pSlotV");
  if (!slot) return;
  const len = Math.max(80, slot.clientHeight);
  if (posSliderV.dataset.len !== String(len)) {
    posSliderV.style.width = len + "px";
    posSliderV.dataset.len = String(len);
  }
}

/* 아래 오른쪽 가로 바가 지금 무엇을 조절하는가 (v1.11.0) */
const hIsPhoto = () => S.hMode === "photo" && !S.locked;
const hConfig = () => (hIsPhoto() ? photoConfig() : posConfig(S.selLR));
function applyH(v) {
  if (hIsPhoto()) applyPhoto(v);
  else applyPos(v, S.selLR);
}

function updatePanels() {
  /* 조절자는 2개이고 둘 다 항상 보인다 (BASELINE 1-7)
     세로 조절자(오른쪽 끝·세로 중앙) = S.selUD 가로선
     가로 조절자(아래·오른쪽)         = S.selLR 세로선  또는  사진 보정 (S.hMode) */
  const cv = posConfig(S.selUD), ch = hConfig();
  $("selNameV").textContent = cv.name;
  $("posValV").textContent = cv.disp;
  if (document.activeElement !== posSliderV) posSliderV.value = cv.v;
  $("selNameH").textContent = ch.name;
  $("posValH").textContent = ch.disp;
  if (document.activeElement !== posSliderH) posSliderH.value = ch.v;

  /* 지금 조작 대상인 쪽만 강조 — 어느 쪽도 숨기지 않는다 */
  const vActive = !hIsPhoto() && axisOf(S.sel) === "v";
  $("posCtlV").classList.toggle("active", vActive);
  $("posCtlH").classList.toggle("active", !vActive);
  sizePosSlider();

  /* 사진 잠금 시 사진 보정 버튼은 반투명 + 잠김. 선 조절은 그대로 가능 */
  document.querySelectorAll("#photoModes button[data-mode]").forEach((b) => {
    b.disabled = S.locked;
    b.classList.toggle("on", !S.locked && S.hMode === "photo" && b.dataset.mode === S.photoMode);
  });
}

/* ═══════════ 7. presets ═══════════ */
const PKEY = "pb_presets_v1";

const BUILTIN_FRAME = () => faceFrame(DEFAULT_GUIDE);
const BUILTINS = () => [
  { id: "b:natural", frame: BUILTIN_FRAME(), name: t("p_natural"), builtin: true, state: { ...DEFAULT_GUIDE, h2: 0.36, h2Visible: true, archThickness: 0.40, archThicknessVisible: true, h3: 0.45, h3Visible: true, v2: 0.38, v2Visible: true } },
  { id: "b:bold", frame: BUILTIN_FRAME(),    name: t("p_bold"),    builtin: true, state: { ...DEFAULT_GUIDE, h2: 0.30, h2Visible: true, archThickness: 0.375, archThicknessVisible: true, h3: 0.41, h3Visible: true, v2: 0.33, v4: 0.12, v4Visible: true, front: 0.38, frontVisible: true } },
  { id: "b:arch", frame: BUILTIN_FRAME(),    name: t("p_arch"),    builtin: true, state: { ...DEFAULT_GUIDE, h2: 0.28, h2Visible: true, archThickness: 0.345, archThicknessVisible: true, h3: 0.44, h3Visible: true, v2: 0.36, v4: 0.17, v4Visible: true, baseStructureVisible: true, innerAngle: 0.44, outerAngle: 0.58 } },
];

/* ═══ 즐겨찾기 (v1.28.0) ══════════════════════════════════════
   시술 중 자주 쓰는 프리셋은 모달을 열고 → 찾고 → 로드하는 세 단계가 번거롭습니다.
   ★ 로 지정한 것만 **캔버스 왼쪽 아래에 버튼으로 꺼내** 한 번에 올립니다.
   · 최대 3개 — 그 이상은 화면 아래가 버튼으로 가득 차 사진을 가립니다
   · 지정한 개수만큼만 나옵니다. 하나도 없으면 `프리셋` 버튼만 있습니다 (빈 자리를 만들지 않음)
   · **id 만 저장**합니다. 프리셋 내용을 복사해 두면 원본을 수정했을 때 따로 놀게 됩니다. */
const FAV_KEY = "pb_favs_v1";
const FAV_MAX = 3;
function favIds() {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return Array.isArray(v) ? v.slice(0, FAV_MAX) : [];
  } catch { return []; }
}
function writeFavs(list) { localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, FAV_MAX))); }
const isFav = (id) => favIds().includes(id);
/* 켜면 true, 3개가 차서 못 넣으면 false */
function toggleFav(id) {
  const list = favIds(), i = list.indexOf(id);
  if (i >= 0) { list.splice(i, 1); writeFavs(list); buildFavBar(); toast(t("fav_off")); return true; }
  if (list.length >= FAV_MAX) { toast(t("fav_max")); return false; }
  list.push(id); writeFavs(list); buildFavBar(); toast(t("fav_on"));
  return true;
}

const FAV_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z"/></svg>';

/* 즐겨찾기 버튼 줄 — 지워진 프리셋을 가리키는 id 는 조용히 걸러낸다. */
function buildFavBar() {
  const row = $("favRow");
  if (!row) return;
  const all = allPresets();
  const items = favIds().map((id) => all.find((p) => p.id === id)).filter(Boolean);
  row.replaceChildren(...items.map((p) => {
    const b = document.createElement("button");
    b.className = "favbtn";
    b.dataset.preset = p.id;
    b.innerHTML = `<i>${FAV_SVG}</i><em></em>`;
    b.querySelector("em").textContent = p.name;      // 프리셋 이름은 사용자 입력이므로 textContent
    b.addEventListener("click", () => applyPreset(p));
    return b;
  }));
}

function userPresets() {
  try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; }
}
function writeUserPresets(list) {
  localStorage.setItem(PKEY, JSON.stringify(list));
}
function allPresets() { return [...BUILTINS(), ...userPresets()]; }

/* ═══ 얼굴 기준틀 (v1.25.0) ═══════════════════════════════════
   프리셋을 화면 좌표 그대로 적용하면 **얼굴 폭·눈썹 높이가 다른 고객에게 안 맞습니다.**
   저장할 때 그 얼굴의 기준틀을 같이 넣고, 불러올 때 **지금 고객의 기준틀로 환산**합니다.
     가로 단위 ux = |Inner − Center|   → 얼굴이 넓다/좁다
     세로 단위 uy = |Eye − Arch|       → 눈과 눈썹 사이가 멀다/가깝다
   두 축을 따로 두는 이유: 얼굴은 넓은데 눈썹이 낮은 사람이 있기 때문입니다. */
function faceFrame(g) {
  return {
    cx: g.v1, ux: Math.max(Math.abs(g.v2 - g.v1), 0.02),
    ey: g.h1, uy: Math.max(Math.abs(g.h1 - g.h2), 0.02),
  };
}
const PRESET_VX = ["v1", "v2", "v3", "v4", "v5", "v6", "v7"];
const PRESET_VY = ["h1", "h2", "h3", "front", "frontThickness", "archThickness", "innerAngle"];

function fitPresetToFace(state, frame) {
  const now = faceFrame(S.g);
  const kx = now.ux / frame.ux, ky = now.uy / frame.uy;
  const out = { ...state };
  for (const k of PRESET_VX) if (typeof state[k] === "number")
    out[k] = clamp(now.cx + (state[k] - frame.cx) * kx, 0.01, 0.99);
  for (const k of PRESET_VY) if (typeof state[k] === "number")
    out[k] = clamp(now.ey + (state[k] - frame.ey) * ky, 0.01, 0.99);
  out.v3 = clamp(2 * out.v1 - out.v2, 0, 1);      /* 대칭 재확립 (BASELINE 1-2) */
  out.v5 = clamp(2 * out.v1 - out.v4, 0, 1);
  out.v7 = clamp(2 * out.v1 - out.v6, 0, 1);
  return out;
}

function savePreset(name) {
  const list = userPresets();
  list.push({ id: "u" + Date.now(), name, state: { ...S.g }, frame: faceFrame(S.g) });
  writeUserPresets(list);
  toast(t("preset_saved"));
}
function applyPreset(p) {
  const raw = { ...DEFAULT_GUIDE, ...p.state };              // 누락 필드 자동 보정
  /* 기준틀이 있으면 지금 고객 얼굴에 맞춰 크기를 환산한다.
     옛 프리셋(기준틀 없음)은 예전처럼 그대로 적용 — 조용히 실패해야 기존 저장분이 안 깨집니다. */
  const fitted = p.frame ? fitPresetToFace(raw, p.frame) : raw;
  step(() => { S.g = fitted; });
  S.activePreset = p.id;                                    // 프리셋 버튼에 적용중 표시
  render();
  toast(p.frame ? t("preset_fitted") : t("preset_loaded"));
}
function renderPresetList() {
  const box = $("presetList");
  const list = allPresets();
  if (!list.length) { box.innerHTML = `<div class="empty">${t("preset_none")}</div>`; return; }
  box.replaceChildren(...list.map((p) => {
    const row = document.createElement("div");
    row.className = "pitem";
    /* ★ 즐겨찾기 토글 (v1.28.0) — 켜면 캔버스 왼쪽 아래에 버튼으로 나옵니다.
       내장 프리셋도 지정할 수 있습니다(자연·강한·아치가 실제로 제일 자주 쓰입니다). */
    const st = document.createElement("button");
    st.className = "star"; st.dataset.star = p.id;
    st.innerHTML = FAV_SVG;
    const paintStar = () => st.classList.toggle("on", isFav(p.id));
    paintStar();
    st.onclick = () => { toggleFav(p.id); renderPresetList(); };
    row.appendChild(st);
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
      del.onclick = () => {
        writeUserPresets(userPresets().filter((x) => x.id !== p.id));
        writeFavs(favIds().filter((id) => id !== p.id));   /* 지운 프리셋은 즐겨찾기에서도 뺀다 */
        buildFavBar(); renderPresetList(); toast(t("preset_deleted"));
      };
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
    ox: clamp(-nx / W + (centerX() - 0.5), -OFFSET_MAX, OFFSET_MAX),
    oy: clamp(-ny / H + (CENTER_Y - 0.5), -OFFSET_MAX, OFFSET_MAX),
  };
  placeLinesFromEyes(centerX(), CENTER_Y, EYE_FRAC / 2);
}

/* ═══ AI 랜드마크 → 각 선의 위치 (v1.22.0) ═══════════════════
   MediaPipe FaceLandmarker 의 눈썹 윤곽점. 위/아래 윤곽이 따로 있어
   **두께 선을 고정 오프셋이 아니라 실측**으로 잡을 수 있다.
     눈썹 위 윤곽 : 꼬리 70/300 · 산 105/334 · 앞머리 107/336
     눈썹 아래 윤곽:       46/276 ·    52/282 ·        55/285
   ⚠️ 이 인덱스는 MediaPipe FaceMesh 규약이다. 모델을 바꾸면 같이 확인해야 한다. */
const AI_LM = {
  h1: null,                       // 눈 기준선은 동공에서 (아래 aiValueFor 참고)
  h2: [105, 334],                 // 아치 = 눈썹 산 위쪽
  archThickness: [52, 282],       // 아치 두께 = 같은 자리 아래쪽 윤곽
  front: [107, 336],              // 앞머리 = 눈썹 머리 위쪽
  frontThickness: [55, 285],      // 앞 두께 = 같은 자리 아래쪽 윤곽
  h3: [70, 300],                  // 꼬리 = 눈썹 꼬리 위쪽
};
const IRIS_L = [468, 469, 470, 471, 472], IRIS_R = [473, 474, 475, 476, 477];
const EYE_CORNERS = [33, 133, 362, 263];

const lmAvg = (lm, idx) => {
  let x = 0, y = 0;
  for (const i of idx) { x += lm[i].x * S.iw; y += lm[i].y * S.ih; }
  return { x: x / idx.length, y: y / idx.length };
};

/* 좌우 내안각·외안각 (이미지 좌표). x 순서로 정렬해 인덱스 규약에 의존하지 않는다. */
function eyeCorners(lm) {
  const c = EYE_CORNERS.map((i) => ({ x: lm[i].x * S.iw, y: lm[i].y * S.ih })).sort((a, b) => a.x - b.x);
  return { outerL: c[0], innerL: c[1], innerR: c[2], outerR: c[3] };
}

/* 지금 화면 변환(S.p) 기준으로 그 선이 있어야 할 값(0~1). 랜드마크가 없으면 null. */
function aiValueFor(key) {
  const lm = S.landmarks;
  if (!lm || !S.dim.H) return null;
  const { W, H } = S.dim, tr = S.p;
  const yOf = (idx) => { const p = lmAvg(lm, idx); return clamp(imgToCanvas(p.x, p.y, tr).y / H, 0.02, 0.98); };

  if (key === "h1") {
    const a = lmAvg(lm, IRIS_L), b = lmAvg(lm, IRIS_R);
    return clamp(imgToCanvas((a.x + b.x) / 2, (a.y + b.y) / 2, tr).y / H, 0.02, 0.98);
  }
  if (AI_LM[key]) return yOf(AI_LM[key]);

  /* 세로선 — 대칭을 지켜야 하므로 좌·우 실측값의 **평균 거리**를 쓴다 (BASELINE 1-2).
     한쪽만 재서 거울상을 만들면 비대칭 얼굴에서 한쪽이 크게 뜬다. */
  if (key === "v1" || key === "v2" || key === "v4" || key === "v6") {
    const c = eyeCorners(lm);
    const cx = (imgToCanvas(c.innerL.x, c.innerL.y, tr).x + imgToCanvas(c.innerR.x, c.innerR.y, tr).x) / 2 / W;
    if (key === "v1") return clamp(cx, 0.02, 0.98);
    /* 아치선은 **눈썹 산(105/334)** 의 x — 눈이 아니라 눈썹에서 잽니다 (v1.32.0) */
    const xOf = (i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, tr).x / W;
    const pair = key === "v2" ? [c.innerL, c.innerR] : key === "v4" ? [c.outerL, c.outerR] : null;
    const half = pair
      ? (Math.abs(imgToCanvas(pair[0].x, pair[0].y, tr).x / W - cx) + Math.abs(imgToCanvas(pair[1].x, pair[1].y, tr).x / W - cx)) / 2
      : (Math.abs(xOf(AI_LM.h2[0]) - cx) + Math.abs(xOf(AI_LM.h2[1]) - cx)) / 2;
    return clamp(S.g.v1 - half, 0.02, 0.98);
  }
  return null;
}

/* 선을 켤 때 AI 위치로 스냅. 배치했으면 true. */
function aiPlaceLine(key) {
  const v = aiValueFor(key);
  if (v === null) return false;
  setLine(key, v);
  return true;
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
  const tr = { zoom, rot, ox: clamp(-(rx * zoom) / W + (centerX() - 0.5), -OFFSET_MAX, OFFSET_MAX), oy: clamp(-(ry * zoom) / H + (CENTER_Y - 0.5), -OFFSET_MAX, OFFSET_MAX) };
  S.p = tr;

  /* 라인 자동 배치 */
  const g = S.g;
  const cx = (x, y) => imgToCanvas(x, y, tr);

  /* 중심축은 **동공 중점이 아니라 양쪽 내안각의 중점** (v1.22.0).
     이너 바가 좌우 내안각에 고르게 닿으려면 이 축이 기준이어야 한다. */
  const inLc = cx(innerL.x, innerL.y), inRc = cx(innerR.x, innerR.y);
  g.v1 = clamp((inLc.x + inRc.x) / 2 / W, 0.02, 0.98);
  g.h1 = clamp(cx(mx, my).y / H, 0.02, 0.98);

  /* 좌·우 실측 거리의 **평균** — 한쪽만 재서 거울상을 만들면 비대칭 얼굴에서 한쪽이 크게 뜬다.
     평균을 쓰면 양쪽이 똑같이 아주 조금씩만 뜬다 (BASELINE 1-2 대칭 유지). */
  const outLc = cx(outerL.x, outerL.y), outRc = cx(outerR.x, outerR.y);
  const halfIn = (Math.abs(inLc.x / W - g.v1) + Math.abs(inRc.x / W - g.v1)) / 2;
  const halfOut = (Math.abs(outLc.x / W - g.v1) + Math.abs(outRc.x / W - g.v1)) / 2;
  g.v2 = clamp(g.v1 - halfIn, 0.02, 0.98);  g.v3 = 2 * g.v1 - g.v2;
  g.v4 = clamp(g.v1 - halfOut, 0.02, 0.98); g.v5 = 2 * g.v1 - g.v4;

  /* 아치선 — 눈썹 산(105/334)의 x. 아치·아치두께 자가 이 기둥 위에 올라간다 (v1.32.0) */
  const arL = cx(P(AI_LM.h2[0]).x, P(AI_LM.h2[0]).y), arR = cx(P(AI_LM.h2[1]).x, P(AI_LM.h2[1]).y);
  const halfArch = (Math.abs(arL.x / W - g.v1) + Math.abs(arR.x / W - g.v1)) / 2;
  g.v6 = clamp(g.v1 - halfArch, 0.02, 0.98); g.v7 = 2 * g.v1 - g.v6;

  /* 눈썹 기준선 — 두께 선은 **눈썹 아래 윤곽을 실측**한다 (고정 오프셋 아님, v1.22.0) */
  const yAt = (idx) => { const p = avg(idx); return clamp(cx(p.x, p.y).y / H, 0.02, 0.98); };
  g.h2 = yAt(AI_LM.h2);
  g.h3 = yAt(AI_LM.h3);
  g.front = yAt(AI_LM.front);
  g.archThickness = yAt(AI_LM.archThickness);
  g.frontThickness = yAt(AI_LM.frontThickness);

  /* Base Structure pivot 을 코끝 높이에 */
  g.innerAngle = clamp(g.h1 + 0.16, 0.05, 0.95);

  fitBrowsInFrame(lm);   // 눈썹 꼬리가 잘리면 배율을 낮춘다
}

/* ═══ 눈썹이 화면 안에 들어오게 (v1.22.0) ═════════════════════
   autoAlign 은 동공 간 거리를 캔버스 폭의 EYE_FRAC 으로 고정 확대한다.
   얼굴이 넓거나 눈 간격이 좁으면 **눈썹 꼬리가 프레임 밖으로 밀려난다** (실제로 잘렸음).
   정렬 직후 양쪽 꼬리가 들어오는지 재고, 넘치면 들어올 때까지 배율만 낮춘다. */
const FRAME_PAD = 0.06;          // 좌우 여백 (작업 영역 폭 기준)
function fitBrowsInFrame(lm) {
  if (!lm || !S.dim.W) return;
  const { W } = S.dim, WRn = workRight();
  const xs = [70, 300].map((i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W);
  const lo = Math.min(...xs), hi = Math.max(...xs);
  const left = FRAME_PAD * WRn, right = WRn - FRAME_PAD * WRn;
  const c = S.g.v1;
  const need = Math.max((c - lo) / Math.max(c - left, 1e-6), (hi - c) / Math.max(right - c, 1e-6));
  if (need <= 1.001) return;                       // 이미 들어옴
  const zoom = clamp(S.p.zoom / need, ZOOM_MIN, ZOOM_MAX);
  if (Math.abs(zoom - S.p.zoom) < 1e-4) return;
  S.p.zoom = zoom;
  autoAlignRelayout(lm);
}

/* 배율만 바뀌었으므로 위치·선을 그 배율로 다시 계산 (재귀 없이 한 번만) */
function autoAlignRelayout(lm) {
  const { W, H } = S.dim, tr = S.p;
  const c = eyeCorners(lm);
  const a = lmAvg(lm, IRIS_L), b = lmAvg(lm, IRIS_R);
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const vx = (mx - S.iw / 2) * S.s0, vy = (my - S.ih / 2) * S.s0;
  const r = (tr.rot * Math.PI) / 180;
  const rx = vx * Math.cos(r) - vy * Math.sin(r), ry = vx * Math.sin(r) + vy * Math.cos(r);
  S.p.ox = clamp(-(rx * tr.zoom) / W + (centerX() - 0.5), -OFFSET_MAX, OFFSET_MAX);
  S.p.oy = clamp(-(ry * tr.zoom) / H + (CENTER_Y - 0.5), -OFFSET_MAX, OFFSET_MAX);
  const g = S.g, cv = (x, y) => imgToCanvas(x, y, S.p);
  const inLc = cv(c.innerL.x, c.innerL.y), inRc = cv(c.innerR.x, c.innerR.y);
  const outLc = cv(c.outerL.x, c.outerL.y), outRc = cv(c.outerR.x, c.outerR.y);
  g.v1 = clamp((inLc.x + inRc.x) / 2 / W, 0.02, 0.98);
  g.h1 = clamp(cv(mx, my).y / H, 0.02, 0.98);
  const halfIn = (Math.abs(inLc.x / W - g.v1) + Math.abs(inRc.x / W - g.v1)) / 2;
  const halfOut = (Math.abs(outLc.x / W - g.v1) + Math.abs(outRc.x / W - g.v1)) / 2;
  g.v2 = clamp(g.v1 - halfIn, 0.02, 0.98);  g.v3 = 2 * g.v1 - g.v2;
  g.v4 = clamp(g.v1 - halfOut, 0.02, 0.98); g.v5 = 2 * g.v1 - g.v4;

  /* 아치선 — 눈썹 산(105/334)의 x (v1.32.0) */
  { const v = aiValueFor("v6"); if (v !== null) { g.v6 = v; g.v7 = 2 * g.v1 - v; } }
  for (const k of ["h2", "h3", "front", "archThickness", "frontThickness"]) {
    const v = aiValueFor(k);
    if (v !== null) g[k] = v;
  }
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
    render();
    /* 얼굴 정렬이 끝난 뒤 **그려진 드로잉 위로** 선을 다시 올린다 (v1.30.0).
       그린 선이 없거나 못 읽으면 조용히 얼굴 기준 배치 그대로 둔다. */
    const drawn = autoFromDrawing();
    setAI(drawn ? t("ai_drawn") : t("ai_ok"), "ok");
    render();
  } catch (err) {
    console.warn("[PerfectBrow] face AI unavailable:", err);
    S.landmarks = null;
    setAI(t("ai_fail"), "warn");
    render();
  }
}


/* ═══ 드로잉 자동 맞춤 (v1.31.0) ═══════════════════════════════
   ⚠️ **이 앱의 실제 사용 순서**를 코드에 반영한 것입니다. 지우지 마세요.

     ① 원장님이 **왼쪽 눈썹에 먼저 굵은 드로잉**을 그린다
     ② 오른쪽에 그리기 전 **포인트를 먼저 찍는다**
     ③ 자(가로선)는 **그 드로잉의 짙은 선 위에** 올라가야 한다
     ④ 오른쪽은 자와 눈썹 사이 **갭**을 보며 맞춘다
     ⑤ 양쪽이 완성되면 `밸런스` 로 어긋난 곳을 확인한다

   ⚠️ v1.30.x 는 x 를 `browX(frac)` 으로 뽑았습니다. 그건 **이너·아우터가 이미
   맞아야** 눈썹을 훑는 구조라, 한 번 어긋나면 계속 눈꺼풀을 읽었습니다(원장님 지적:
   「기본 라인이 이렇게 올라옴. 전혀 프로페셔널하지 못한 설정이다」 2026-08-20).
   v1.31.0 은 순서를 뒤집습니다 — **사진에서 눈썹을 먼저 찾고**, 찾은 모양에서
   이너·아우터·앞머리·앞두께·아치·아치두께·꼬리를 뽑습니다.
   여기서 `browX()` 를 다시 쓰면 순환 의존이 되어 같은 버그가 돌아옵니다. */

/* MediaPipe 눈썹 윤곽점 (FaceMesh 규약) — 위/아래가 따로 있어 두께를 실측할 수 있다 */
const BROW_UP_A = [70, 63, 105, 66, 107], BROW_LO_A = [46, 53, 52, 65, 55];
const BROW_UP_B = [300, 293, 334, 296, 336], BROW_LO_B = [276, 283, 282, 295, 285];

const DRAW_COLS = 56;         // 눈썹 하나를 훑는 세로 열 개수
const DRAW_CONTRAST = 18;     // 피부보다 이만큼 어두워야 "그린 선"으로 본다 (1차 패스)
/* 2차 패스 (v1.33.0) — **맨 눈썹(드로잉 없음)** 은 털과 피부의 대비가 그린 선보다 훨씬
   약합니다. 1차가 실패하면 이 낮은 문턱으로 한 번 더 읽습니다. 낮은 문턱은 그림자도
   잘못 잡기 쉬우므로 **1차가 실패했을 때만** 씁니다 — 순서를 바꾸지 마세요. */
const DRAW_CONTRAST_SOFT = 9;
const DRAW_MIN_HITS = 10;     // 이보다 적게 찾으면 실패 (조용히 건너뛴다)
const DRAW_PAD_X = 0.16;      // 좌우 여유 (눈썹 폭 비율) — 드로잉은 털보다 길게 그린다
const DRAW_PAD_UP = 0.95;     // 위 여유 (눈썹 높이 비율)
const DRAW_PAD_DN = 0.70;     // 아래 여유
const DRAW_EYE_GAP = 0.55;    // 눈(동공)까지 이만큼은 남긴다 — 눈꺼풀을 읽지 않기 위해
const DRAW_MAX_FILL = 0.72;   // 열의 이만큼을 넘게 어두우면 머리카락·그림자로 보고 버린다
/* ⚠️ 테두리 판정 (v1.31.2) — **열마다 따로 붙이면 안 됩니다.**
   v1.31.1 은 한 열 안에서 가까운 덩어리를 그냥 이어 붙였습니다. 그 결과 맨 눈썹 사진에서
   **쌍꺼풀 선·눈꺼풀 주름이 눈썹에 딸려 붙어** 앞두께가 눈썹 아래 피부까지 내려갔습니다
   (원장님 스크린샷 2026-08-20). 이제 **사진 전체를 보고 한 번만** 판정합니다 —
   "잉크가 비슷한 두 줄 + 그 사이가 비어 있음" 이 과반의 열에서 보여야 테두리 드로잉입니다.
   눈썹 털은 한 덩어리라 이 조건을 못 넘고, 주름은 잉크가 훨씬 옅어 짝이 되지 못합니다. */
const DRAW_PAIR_INK = 0.5;      // 짝이 되려면 씨앗 잉크의 이만큼은 되어야 한다
const DRAW_PAIR_FILL = 0.7;     // 두 줄의 두께 합이 전체 폭의 이만큼 이하 = 사이가 비어 있다
const DRAW_OUTLINE_RATIO = 0.5; // 이 비율 이상의 열이 짝을 이뤄야 "테두리로 그린 드로잉"

/* 읽어낸 두께가 랜드마크 눈썹 높이의 이 범위를 벗어나면 **잘못 읽은 것**으로 보고 버린다.
   드로잉은 털보다 도톰하게 그리므로 위쪽은 넉넉히, 아래쪽은 얇은 오독을 막습니다. */
const DRAW_THICK_MAX = 1.9, DRAW_THICK_MIN = 0.3;

/* 랜드마크 → 지금 화면 좌표의 **눈썹 탐색 상자** 2개(화면 왼쪽/오른쪽).
   랜드마크가 없으면 null → 아래 fallbackBox() 로 넘어간다. */
function browBoxes() {
  const lm = S.landmarks, { W, H } = S.dim;
  if (!lm || !W || !H) return null;
  const pt = (i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p);
  let eyeY = null;
  try {
    const a = lmAvg(lm, IRIS_L), b = lmAvg(lm, IRIS_R);
    eyeY = imgToCanvas((a.x + b.x) / 2, (a.y + b.y) / 2, S.p).y;
  } catch { eyeY = null; }

  const box = (up, lo) => {
    const U = up.map(pt), L = lo.map(pt), all = [...U, ...L];
    const xs = all.map((p) => p.x);
    const yU = Math.min(...U.map((p) => p.y)), yL = Math.max(...L.map((p) => p.y));
    const h = Math.max(yL - yU, 6), wd = Math.max(Math.max(...xs) - Math.min(...xs), 10);
    let y1 = yL + DRAW_PAD_DN * h;
    if (eyeY !== null) y1 = Math.min(y1, eyeY - DRAW_EYE_GAP * h);   // 눈꺼풀 방어선
    return {
      x0: Math.min(...xs) - DRAW_PAD_X * wd, x1: Math.max(...xs) + DRAW_PAD_X * wd,
      y0: yU - DRAW_PAD_UP * h, y1: Math.max(y1, yL + 0.15 * h),
      cy: (yU + yL) / 2, h,          // h = 랜드마크 눈썹 높이 — 두께 상식 검사에 쓴다
    };
  };
  const a = box(BROW_UP_A, BROW_LO_A), b = box(BROW_UP_B, BROW_LO_B);
  return a.x0 <= b.x0 ? { left: a, right: b } : { left: b, right: a };
}

/* 랜드마크가 없을 때 — 기준 쪽 절반의 위쪽을 통째로 훑는다.
   실제 앱에서는 얼굴 인식이 끝난 뒤에만 부르므로 거의 쓰이지 않지만,
   인식이 실패한 사진에서도 그린 선을 잡을 수 있게 남겨 둡니다. */
function fallbackBox(side) {
  const { W, H } = S.dim;
  const cx = S.g.v1 * W, wr = workRight() * W;
  return side === "L"
    ? { x0: 0, x1: cx - 4, y0: 0, y1: S.g.h1 * H, cy: null, h: null }
    : { x0: cx + 4, x1: wr, y0: 0, y1: S.g.h1 * H, cy: null, h: null };
}

/* 한 열에서 "그린 선" 한 덩어리를 찾는다.
   밝은 쪽 40% 평균을 피부로 보고, 그보다 DRAW_CONTRAST 어두운 픽셀만 선으로 센다.
   후보가 여럿이면 **잉크량(어두운 정도 × 두께)** 이 가장 많은 덩어리 —
   눈썹 털 한 올이나 속눈썹에 끌려가지 않게 하려는 것. */
/* 한 열의 어두운 덩어리를 **전부** 모으고, 그중 씨앗(잉크가 가장 많은 것)을 고른다.
   ⚠️ 여기서 덩어리를 합치지 마세요. 합칠지 말지는 `readDrawing` 이 **사진 전체를 보고**
   한 번만 정합니다 — 열마다 따로 합쳤다가 눈꺼풀 주름이 딸려 왔습니다 (v1.31.1 의 실패). */
function columnRuns(img, x, y0, y1, cy, contrast) {
  const { W } = S.dim;
  const v = [];
  for (let y = y0; y <= y1; y++) v.push(lumaAt(img, W, x, y));
  const N = v.length;
  if (N < 6) return null;
  const s = [...v].sort((a, b) => a - b), k = Math.floor(N * 0.6);
  let sum = 0;
  for (let i = k; i < N; i++) sum += s[i];
  const cut = sum / Math.max(1, N - k) - contrast;

  const runs = [];
  let t = -1, ink = 0;
  for (let i = 0; i < N; i++) {
    const dark = v[i] < cut;
    if (dark) { if (t < 0) { t = i; ink = 0; } ink += cut - v[i]; }
    if ((!dark || i === N - 1) && t >= 0) {
      const b = dark ? i : i - 1, len = b - t + 1;
      if (len >= 2 && len <= DRAW_MAX_FILL * N) runs.push({ top: y0 + t, bot: y0 + b, ink, len });
      t = -1;
    }
  }
  if (!runs.length) return null;

  /* 씨앗 = 잉크(어두운 정도 × 두께)가 가장 많은 덩어리. 비슷하면 눈썹 중앙에 가까운 쪽 */
  let si = 0;
  const mid = (r) => (r.top + r.bot) / 2;
  for (let i = 1; i < runs.length; i++) {
    const a = runs[i], b = runs[si];
    const closer = cy !== null && Math.abs(mid(a) - cy) < Math.abs(mid(b) - cy);
    if (a.ink > b.ink * 1.15 || (a.ink > b.ink * 0.85 && closer)) si = i;
  }
  return { x, runs, si, N };
}

/* 이 열이 **테두리로 그린 두 줄**처럼 보이는가 — 그렇다면 합친 {top,bot}, 아니면 null.
   조건 ① 두 줄의 잉크가 비슷하다 (테두리는 위·아래를 같은 힘으로 그립니다)
        ② 두 줄 사이가 **비어 있다** (꽉 찬 덩어리는 여기서 걸러집니다)
   눈꺼풀 주름은 ①에서, 꽉 채워 그린 드로잉은 ②에서 떨어집니다. */
function outlinePair(c) {
  const s = c.runs[c.si];
  let best = null;
  for (let i = 0; i < c.runs.length; i++) {
    if (i === c.si) continue;
    const r = c.runs[i];
    if (r.ink < s.ink * DRAW_PAIR_INK) continue;
    const top = Math.min(s.top, r.top), bot = Math.max(s.bot, r.bot), span = bot - top + 1;
    if (span > DRAW_MAX_FILL * c.N) continue;
    if (s.len + r.len > span * DRAW_PAIR_FILL) continue;
    if (!best || span < best.span) best = { top, bot, span };
  }
  return best;
}

/* 찾은 덩어리들 중 **한 줄기로 이어지는 것**만 남긴다.
   중앙값에서 크게 벗어난 열(머리카락·안경테·눈꺼풀)을 버리고 이웃 3개 중앙값으로 다듬는다. */
function keepBand(pts) {
  if (pts.length < DRAW_MIN_HITS) return null;
  const mid = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  let keep = pts;
  for (let pass = 0; pass < 2; pass++) {
    const th = mid(keep.map((p) => p.bot - p.top));
    const cy = mid(keep.map((p) => (p.top + p.bot) / 2));
    const lim = Math.max(th * 1.6, 6);
    const next = keep.filter((p) => Math.abs((p.top + p.bot) / 2 - cy) <= lim && p.bot - p.top <= th * 2.6 + 2);
    if (next.length < DRAW_MIN_HITS) break;
    keep = next;
  }
  if (keep.length < DRAW_MIN_HITS) return null;
  const m3 = (i, key) => {
    const s = [keep[Math.max(0, i - 1)][key], keep[i][key], keep[Math.min(keep.length - 1, i + 1)][key]].sort((a, b) => a - b);
    return s[1];
  };
  return keep.map((p, i) => ({ x: p.x, top: m3(i, "top"), bot: m3(i, "bot") }));
}

/* 기준 쪽 눈썹에서 그려진 드로잉을 읽는다. 실패하면 null.
   반환: x 오름차순 [{x, top, bot}] — top/bot 은 캔버스 px */
function readDrawing(img, contrast) {
  const { W, H } = S.dim;
  const boxes = browBoxes();
  const b = boxes ? (S.refSide === "L" ? boxes.left : boxes.right) : fallbackBox(S.refSide);
  const x0 = Math.max(0, Math.round(b.x0)), x1 = Math.min(W - 1, Math.round(b.x1));
  const y0 = Math.max(0, Math.round(b.y0)), y1 = Math.min(H - 1, Math.round(b.y1));
  if (x1 - x0 < 16 || y1 - y0 < 8) return null;
  const cols = [];
  for (let i = 0; i < DRAW_COLS; i++) {
    const x = Math.round(x0 + ((x1 - x0) * (i + 0.5)) / DRAW_COLS);
    if (x < 0 || x >= W) continue;
    const c = columnRuns(img, x, y0, y1, b.cy, contrast);
    if (c) cols.push(c);
  }
  if (cols.length < DRAW_MIN_HITS) return null;

  /* **한 번만** 판정한다 — 이 사진이 테두리로 그린 드로잉인가, 꽉 찬 덩어리인가 */
  let paired = 0;
  for (const c of cols) { c.pair = outlinePair(c); if (c.pair) paired++; }
  const outline = paired >= cols.length * DRAW_OUTLINE_RATIO;

  const pts = cols.map((c) => {
    const r = outline && c.pair ? c.pair : c.runs[c.si];
    return { x: c.x, top: r.top, bot: r.bot };
  });
  pts.sort((p, q) => p.x - q.x);
  const band = keepBand(pts);
  if (band) band.refH = b.h;          // 랜드마크 눈썹 높이 — 두께 상식 검사용
  return band;
}

/* 사진에 그려진 드로잉 위로 모든 선을 올린다. 올렸으면 true.
   센터(v1)는 얼굴 축이라 건드리지 않습니다 (내안각 중점 · BASELINE 1-15).
   V 피봇·V 앵글도 자동으로 올리지 않습니다 — 쓰실 때만 켜는 보조선입니다. */
function autoFromDrawing() {
  const { W, H } = S.dim;
  const img = photoPixels();
  if (!img) return false;
  /* 2패스 (v1.33.0) — ① 그린 드로잉(진한 대비) ② 실패하면 맨 눈썹(옅은 대비).
     원장님 스크린샷(2026-08-20)에서 맨 눈썹 사진이 1차에서 떨어져 랜드마크 배치로
     남았고, 그 배치가 「전혀 프로페셔널하지 못한」 위치였습니다. */
  let pts = null;
  for (const contrast of [DRAW_CONTRAST, DRAW_CONTRAST_SOFT]) {
    const cand = readDrawing(img, contrast);
    if (!cand || cand.length < DRAW_MIN_HITS) continue;
    /* ⚠️ **두께 상식 검사** (v1.31.2) — 읽어낸 두께가 랜드마크 눈썹 높이와 너무 다르면
       눈꺼풀 주름·머리카락을 잘못 읽은 것입니다. 그 패스는 버리고 다음 패스로 넘어갑니다.
       억지로 올리면 원장님이 다시 다 옮기셔야 합니다. */
    if (cand.refH) {
      const th = cand.map((p) => p.bot - p.top).sort((a, b) => a - b)[Math.floor(cand.length / 2)];
      if (th > DRAW_THICK_MAX * cand.refH || th < DRAW_THICK_MIN * cand.refH) continue;
    }
    pts = cand; break;
  }
  if (!pts) return false;

  /* seq[0] = 안쪽(앞머리) … seq[n−1] = 바깥(꼬리).
     화면 왼쪽 눈썹이면 x 가 큰 쪽이 코 방향(=안쪽)이므로 뒤집는다. */
  const cx = S.g.v1 * W;
  const seq = pts[0].x > cx ? pts : [...pts].reverse();
  const n = seq.length;

  /* 구간 t(0=앞머리 … 1=꼬리) 안 표본들의 중앙값 — 점 하나에 끌려가지 않게 */
  const at = (a, b, key) => {
    const i0 = clamp(Math.floor(a * (n - 1)), 0, n - 1);
    const i1 = clamp(Math.ceil(b * (n - 1)), 0, n - 1);
    const v = seq.slice(Math.min(i0, i1), Math.max(i0, i1) + 1).map((p) => p[key]).sort((x, y) => x - y);
    return v.length ? v[Math.floor(v.length / 2)] : null;
  };

  /* 아치 = 드로잉에서 **제일 높은 곳**. 위치를 미리 정하지 않고 사진에서 찾는다. */
  let pk = 0;
  for (let i = 1; i < n; i++) if (seq[i].top < seq[pk].top) pk = i;
  const win = Math.max(1, Math.round(n * 0.08));
  const pa = clamp(pk - win, 0, n - 1) / (n - 1), pb = clamp(pk + win, 0, n - 1) / (n - 1);

  const setY = (key, py) => { if (py !== null && isFinite(py)) setLine(key, clamp(py / H, 0.02, 0.98)); };
  setY("front", at(0, 0.18, "top"));             // 앞머리   = 머리 쪽 윗선
  setY("frontThickness", at(0, 0.18, "bot"));    // 앞두께   = 같은 자리 아랫선
  setY("h2", at(pa, pb, "top"));                 // 아치     = 제일 높은 곳 윗선
  setY("archThickness", at(pa, pb, "bot"));      // 아치두께 = 그 자리 아랫선
  setY("h3", at(0.86, 1, "top"));                // 꼬리     = 바깥쪽 끝 윗선

  /* 이너·아우터 = 드로잉이 실제로 있는 x 양 끝 (setLine 이 반대쪽을 대칭으로 맞춘다) */
  setLine("v2", clamp(S.g.v1 - Math.abs(seq[0].x - cx) / W, 0.02, 0.98));
  setLine("v4", clamp(S.g.v1 - Math.abs(seq[n - 1].x - cx) / W, 0.02, 0.98));
  /* 아치선 = **제일 높은 곳의 x**. 아치 자가 진짜 산 위에 올라가게 하려는 것입니다 (v1.32.0) */
  setLine("v6", clamp(S.g.v1 - Math.abs(seq[pk].x - cx) / W, 0.02, 0.98));
  return true;
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
/* 화면을 바꾸면 방향 판정도 다시 한다 (v1.27.0)
   홈 = 기기 방향 그대로(세로) / 편집기 = 가로 강제. applyLayout() 참고. */
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  applyLayout();
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
    S.activePreset = null;
    S.balOn = false; S.balance = null;
    S.locked = false;
    S.hiddenSnapshot = null;
    S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line"; S.multi = false; S.selSet = [];
    S.pickMode = false;
    S.pick = [];
    clearHist();                 /* 새 사진 = 되돌리기 기록 초기화 */
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
  /* 편집 화면 한/영 칩 (v1.19.0) — 현재 언어만 색이 켜진다 */
  document.querySelectorAll("#railLang button").forEach((b) =>
    b.classList.toggle("on", b.dataset.lang === LANG));
  /* 라인 버튼 이름은 i18n 키로 만들어지므로 언어가 바뀌면 다시 그린다 */
  document.querySelectorAll(".lbtn").forEach((b) => {
    const sp = specOf(b.dataset.key);
    if (sp) b.textContent = t(sp.i18n);
  });
  $("saveName").placeholder = t("preset_enter_name");
  $("renameName").placeholder = t("preset_enter_name");
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  $("installTip").innerHTML = isIOS ? t("install_ios") : isAndroid ? t("install_android") : t("install_desktop");
  buildFavBar();
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
document.querySelectorAll("#railLang button").forEach((b) =>
  b.addEventListener("click", () => { setLang(b.dataset.lang); render(); }));

/* ═══ 사진 선택 중에는 화면을 어둡게 (v1.27.0) ═══════════════
   iOS 사진 선택 시트는 웹페이지 **바깥에서 OS 가 그리므로** 앱이 회전시킬 수 없다.
   앱을 세로로 되돌려 방향을 맞추는 방법도 있지만, 화면이 돌아버리면
   **지금 가로인지 세로인지 헷갈린다**(원장님 판단). 그래서 방향은 그대로 두고
   화면만 어둡게 낮춰 시트가 주인공이 되게 한다.
   시트가 닫힌 것은 웹이 직접 알 수 없으므로 네 갈래로 감지한다
   (change · focus · visibilitychange · 첫 터치). 하나만 믿으면 화면이 어두운 채로 남는다. */
let pickOpenedAt = 0;
function openPicker() {
  S.picking = true;
  applyLayout();                    // 시트가 뜨기 전에 먼저 어둡게
  pickOpenedAt = Date.now();
  $("fileInput").click();
}
function endPicking() {
  if (!S.picking) return;
  S.picking = false;
  applyLayout();                    // 밝기 복구
}
/* 시트를 여는 순간 곧바로 오는 focus/pointerdown 은 무시한다 (아직 열리는 중) */
const pickSettled = () => S.picking && Date.now() - pickOpenedAt > 400;
window.addEventListener("focus", () => { if (pickSettled()) setTimeout(endPicking, 120); });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && pickSettled()) setTimeout(endPicking, 120);
});
window.addEventListener("pointerdown", () => { if (pickSettled()) endPicking(); }, { passive: true });

$("pickBtn").onclick = openPicker;
$("btnChange").onclick = openPicker;
$("fileInput").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  endPicking();                     // 사진을 골랐으면 loadPhoto 전에 가로로 되돌린다
  if (f) loadPhoto(f);
  e.target.value = "";
});

$("btnReset").onclick = () => {
  step(() => {
    S.g = { ...DEFAULT_GUIDE };
    S.p = { ...DEFAULT_PHOTO };
    S.activePreset = null;
    S.balOn = false; S.balance = null;
    S.hiddenSnapshot = null;
    S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line"; S.multi = false; S.selSet = [];
    S.pickMode = false;
    S.pick = [];
    if (S.landmarks) autoAlign(S.landmarks);
  });
  render();
  toast(t("reset_done"));
};

$("btnUndo").onclick = undo;
$("btnRedo").onclick = redo;

function toggleLock() {
  S.locked = !S.locked;
  /* 잠그면 사진 보정을 쓸 수 없으므로 가로 바를 선 조절로 되돌린다 */
  if (S.locked) S.hMode = "line";
  updateButtons();
  updatePanels();
  toast(S.locked ? t("locked_msg") : t("unlocked_msg"));
}
$("btnLock").onclick = toggleLock;

$("btnExport").onclick = exportImage;

$("btnAllLine").onclick = () => step(() => {
  if (S.hiddenSnapshot) {
    Object.assign(S.g, S.hiddenSnapshot);
    S.hiddenSnapshot = null;
  } else {
    S.hiddenSnapshot = {};
    ALL_VIS.forEach((k) => { S.hiddenSnapshot[k] = S.g[k]; S.g[k] = false; });
  }
  render();
});

$("btnPivot").onclick = () => step(() => {
  if (S.sel === "innerAngle" && S.g.baseStructureVisible) S.g.baseStructureVisible = false;
  else { noteSel("innerAngle"); S.g.baseStructureVisible = true; }
  render();
});
$("btnVAngle").onclick = () => step(() => {
  if (S.sel === "outerAngle" && S.g.baseStructureVisible) S.g.baseStructureVisible = false;
  else { noteSel("outerAngle"); S.g.baseStructureVisible = true; }
  render();
});

/* 여러라인 — 켜면 선을 누를 때마다 선택에 쌓이고, 선택된 선들이 함께 움직인다 (v1.18.0)
   `전체라인` 은 여러라인의 **후속 버튼**이라 여러라인이 꺼져 있으면 화면에 없다 (v1.19.0). */
$("btnMulti").onclick = () => {
  S.multi = !S.multi;
  S.selSet = S.multi && S.sel ? [S.sel] : [];
  render();
  showHud(S.multi ? t("multi_on") : t("multi_off"), 2600);
  toast(S.multi ? t("editor_multi") : t("multi_off"));
};

/* ═══ 밸런스 판정 (v1.26.0) ═══════════════════════════════════
   가이드 선은 대칭이라 항상 맞습니다. 그래서 비교 대상은 **사진에 그려진 실제 선**입니다.
   기준 쪽(왼/오른)에 그린 자리를 기준으로, 반대쪽 드로잉이 같은 높이에 있는지 봅니다.

   ⚠️ 한계 — 사진을 읽는 방식이라 다음 상황에서는 틀릴 수 있습니다.
      · 그린 선이 흐리거나 피부와 명도 차이가 작을 때
      · 좌우 조명이 다를 때 (그림자를 선으로 오인)
      · 얼굴이 옆으로 돌아가 한쪽이 짧게 찍혔을 때
   그래서 못 읽은 선은 **빨간 표시를 하지 않고 조용히 건너뜁니다.** */
const BAL_RED = "#FF3B4E";  // 밸런스가 다른 곳 표시색
const BAL_BAND = 0.045;    // 선 위아래로 훑는 범위 (캔버스 높이 비율)
const BAL_SAMPLES = 21;    // 한 토막에서 뽑는 x 표본 수
const BAL_CONTRAST = 14;   // 이만큼도 안 어두우면 "선을 못 찾음"으로 본다

/* ═══ 허용 오차 — 화면 px 이 아니라 **얼굴 크기 기준** (v1.29.0) ═══════
   ⛔ **px 고정으로 되돌리지 마세요.**
   v1.28.1 까지 `BAL_TOL = 1px` 고정이었는데, 이러면 **사진을 확대할수록 앱이 더 예민해집니다.**
   눈썹 하나를 화면 가득 확대해서 보실 때(시술 중 늘 그렇게 하십니다) 1px 이 나타내는
   실제 거리가 0.05mm 수준까지 줄어들어, **눈으로 완벽히 맞는 눈썹도 빨갛게** 칠했습니다.

   그래서 기준을 얼굴에 붙입니다 — **양쪽 내안각 사이 거리(이너 선 간격)** 를 자로 씁니다.
   확대하면 이너 간격도 같이 커지므로 **허용 오차가 배율을 따라갑니다.**

   `BAL_TOL_MM` 은 원장님이 실제 시술 감각으로 정하신 값입니다 (2026-08-20).
   "이 정도는 밸런스가 맞다고 봐야 한다" — 임의로 낮추지 마세요. */
const BAL_TOL_MM = 0.8;    // 이보다 작은 차이는 **맞다고 본다** (원장님 기준)
const INNER_MM = 32;       // 양쪽 내안각 사이 평균 거리(mm) · 인체 계측 평균
const BAL_TOL_MIN = 2, BAL_TOL_MAX = 16;   // 이너 선이 겹치거나 극단적으로 벌어졌을 때의 안전선

/* 지금 화면에서 허용 오차 몇 px 인가 */
function balTolPx() {
  const W = S.dim.W, g = S.g;
  const innerPx = Math.abs(g.v3 - g.v2) * W;
  if (!W || !innerPx) return 3;
  return clamp((BAL_TOL_MM * innerPx) / INNER_MM, BAL_TOL_MIN, BAL_TOL_MAX);
}

/* 지금 화면에 보이는 그대로의 사진 픽셀. 사진은 캔버스 안에서만 처리되고 어디에도 안 나갑니다. */
function photoPixels() {
  const { W, H } = S.dim;
  if (!S.imgEl || !W || !H) return null;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2 + S.p.ox * W, H / 2 + S.p.oy * H);
  ctx.scale(S.p.zoom, S.p.zoom);
  ctx.rotate((S.p.rot * Math.PI) / 180);
  ctx.drawImage(S.imgEl, -S.fitW / 2, -S.fitH / 2, S.fitW, S.fitH);
  ctx.restore();
  try { return ctx.getImageData(0, 0, W, H); } catch { return null; }
}

const lumaAt = (img, W, x, y) => {
  const i = (y * W + x) * 4;
  return 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2];
};

/* 한 토막(x 범위)에서 선의 y 를 잰다 — 표본마다 가장 어두운 y 를 찾아 **중앙값**.
   평균이 아니라 중앙값인 이유: 점·머리카락 한 올에 결과가 끌려가지 않게. */
function measureSegY(img, seg, y0, band) {
  const { W, H } = S.dim;
  const xa = seg[0], xb = seg[1];
  if (xb - xa < 4) return null;
  const y1 = Math.max(0, Math.round(y0 - band)), y2 = Math.min(H - 1, Math.round(y0 + band));
  if (y2 - y1 < 4) return null;
  const found = [];
  for (let i = 0; i < BAL_SAMPLES; i++) {
    const x = Math.round(xa + ((xb - xa) * (i + 0.5)) / BAL_SAMPLES);
    if (x < 0 || x >= W) continue;
    let best = -1, bestV = 1e9, sum = 0, n = 0;
    for (let y = y1; y <= y2; y++) {
      const v = lumaAt(img, W, x, y);
      sum += v; n++;
      if (v < bestV) { bestV = v; best = y; }
    }
    if (n && sum / n - bestV >= BAL_CONTRAST) found.push(best);   // 충분히 어두울 때만 채택
  }
  if (found.length < BAL_SAMPLES * 0.5) return null;              // 절반도 못 찾으면 포기
  found.sort((a, b) => a - b);
  return found[Math.floor(found.length / 2)];
}

/* 밸런스 검사 — 기준 쪽과 반대쪽의 드로잉 높이를 비교한다.
   모든 선을 **한 번에** 검사합니다 (하나씩 넘기면 전체 패턴이 안 보입니다). */
function runBalance() {
  const img = photoPixels();
  if (!img) { toast(t("bal_no_photo")); return false; }
  const { H } = S.dim, band = BAL_BAND * H;
  const tol = balTolPx();                                       // 얼굴 크기에 맞춘 허용 오차 (v1.29.0)
  const off = {}, skipped = [];
  for (const sp of H_SPECS) {
    if (!S.g[sp.vis] || !sp.anchor) continue;                     // 눈 기준선은 좌우 관통이라 제외
    const sg = segPx(sp);
    const y0 = S.g[sp.key] * H;
    const L = measureSegY(img, sg[0], y0, band);
    const R = measureSegY(img, sg[1], y0, band);
    if (L === null || R === null) { skipped.push(sp.key); continue; }
    const d = S.refSide === "L" ? R - L : L - R;                  // 반대쪽 − 기준쪽
    if (Math.abs(d) > tol) off[sp.key] = d;
  }
  S.balance = { off, skipped, tol };
  return true;
}

/* 지금 화면에 보이는 선들의 키 — 숨긴 선은 함께 움직일 수 없으므로 제외한다 */
function visibleLineKeys() {
  const out = [...H_SPECS, ...V_SPECS].filter((sp) => S.g[sp.vis]).map((sp) => sp.key);
  /* V 피봇은 "위치"라 함께 옮길 수 있지만 V 앵글은 "각도"라서 같이 끌면 V 모양이 일그러진다.
     그래서 전체 선택에는 넣지 않는다 (v1.19.0). */
  if (S.g.baseStructureVisible) out.push("innerAngle");
  return out;
}

/* 전체라인 — 화면의 모든 선을 한 번에 선택해서 통째로 옮긴다. 다시 누르면 전체 해제. */
/* 밸런스 — 기준 쪽 드로잉과 반대쪽이 같은 높이인지 검사하고, 다른 곳만 빨갛게 (v1.26.0) */
$("btnBalance").onclick = () => {
  if (S.balOn) { S.balOn = false; S.balance = null; render(); showHud(t("bal_off"), 1400); return; }
  if (!runBalance()) return;
  S.balOn = true;
  render();
  const n = Object.keys(S.balance.off).length, sk = S.balance.skipped.length;
  showHud(n === 0 ? t("bal_ok") : `${n}${t("bal_diff")}` + (sk ? `<br>${sk}${t("bal_skip")}` : ""), 3000);
};

/* 기준 쪽 — 밸런스의 후속 버튼. 고른 값은 다음에도 유지된다.
   v1.29.0: 토글 하나가 아니라 **왼쪽/오른쪽 두 버튼**. 지금 어느 쪽이 기준인지 눌러 보지 않아도 보인다. */
function setRefSide(side) {
  if (S.refSide === side) return;
  S.refSide = side;
  localStorage.setItem("pb_refside", side);
  if (S.balOn) runBalance();
  render();
  showHud(side === "L" ? t("bal_ref_l") : t("bal_ref_r"), 1600);
}
/* 그린 선에 다시 맞추기 — 드로잉을 더 그리거나 지운 뒤 다시 올릴 때 (v1.30.0) */
$("btnSnap").onclick = () => {
  let ok = false;
  step(() => { ok = autoFromDrawing(); });
  render();
  showHud(ok ? t("ai_drawn") : t("ai_redraw_fail"), 1600);
};
$("btnRefL").onclick = () => setRefSide("L");
$("btnRefR").onclick = () => setRefSide("R");

$("btnAllSel").onclick = () => {
  if (!S.multi) return;
  const all = visibleLineKeys();
  const already = all.length > 0 && all.every((k) => S.selSet.includes(k));
  S.selSet = already ? [] : all;
  if (S.selSet.length) noteSel(S.selSet[0]);
  render();
  showHud(S.selSet.length ? `${S.selSet.length}${t("sel_count")}` : t("multi_on"));
};

/* 슬라이더 한 번 끄는 동안(pointerdown → change)을 되돌리기 1단계로 묶는다 */
function histSlider(el) {
  el.addEventListener("pointerdown", beginEdit);
  el.addEventListener("keydown", beginEdit);
  el.addEventListener("change", commitEdit);
  el.addEventListener("pointerup", commitEdit);
  el.addEventListener("blur", commitEdit);
}
histSlider(posSliderV);
histSlider(posSliderH);

/* 세로 조절자 — 위아래로 움직이는 가로선(S.selUD) 전담 */
posSliderV.addEventListener("input", (e) => { beginEdit(); noteSel(S.selUD); applyPos(parseFloat(e.target.value), S.selUD); });
$("posMinusV").onclick = () => step(() => { noteSel(S.selUD); applyPos(parseFloat(posSliderV.value) - posConfig(S.selUD).step, S.selUD); });
$("posPlusV").onclick  = () => step(() => { noteSel(S.selUD); applyPos(parseFloat(posSliderV.value) + posConfig(S.selUD).step, S.selUD); });

/* 가로 조절자 — 세로선 좌우 이동 + 사진 보정 겸용 (v1.11.0) */
posSliderH.addEventListener("input", (e) => { beginEdit(); if (!hIsPhoto()) noteSel(S.selLR); applyH(parseFloat(e.target.value)); });
$("posMinusH").onclick = () => step(() => { if (!hIsPhoto()) noteSel(S.selLR); applyH(parseFloat(posSliderH.value) - hConfig().step); });
$("posPlusH").onclick  = () => step(() => { if (!hIsPhoto()) noteSel(S.selLR); applyH(parseFloat(posSliderH.value) + hConfig().step); });

/* 사진 보정 모드 버튼 — 누르면 아래 가로 바가 사진 조절로 전환된다.
   같은 버튼을 다시 누르면 선 조절로 되돌아간다. */
$("photoModes").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-mode]");
  if (!b || b.disabled) return;
  if (S.hMode === "photo" && S.photoMode === b.dataset.mode) S.hMode = "line";
  else { S.photoMode = b.dataset.mode; S.hMode = "photo"; }
  updatePanels();
});

$("btnPresetSave").onclick = () => { closeMask("mLoad"); $("saveName").value = ""; openMask("mSave"); };
$("doSave").onclick = () => {
  const n = $("saveName").value.trim();
  if (!n) return;
  savePreset(n);
  buildFavBar();
  closeMask("mSave");
};
$("btnPresetLoad").onclick = () => { renderPresetList(); openMask("mLoad"); };

/* ═══ 프리셋 내보내기 · 가져오기 (v1.29.0) ══════════════════════
   프리셋은 브라우저 localStorage 에만 있습니다 — 기기를 바꾸거나 브라우저 데이터를 지우면
   **그대로 사라집니다.** 파일로 빼 두면 옮길 수 있고, 원장님이 만드신 디자인을
   앱 기본 제공 프리셋으로 넣을 때도 이 파일을 씁니다.
   내장 프리셋은 코드에서 매번 만들므로 **내보내지 않습니다** (1-5). */
const PRESET_FILE_TAG = "perfect-brow-presets";
$("btnPresetExport").onclick = () => {
  const data = { tag: PRESET_FILE_TAG, v: 1, presets: userPresets(), favs: favIds() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `perfect-brow-presets-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t("preset_exported"));
};
$("btnPresetImport").onclick = () => $("presetFile").click();
$("presetFile").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      const list = Array.isArray(d) ? d : (d && Array.isArray(d.presets) ? d.presets : null);
      if (!list) throw new Error("bad");
      /* 같은 id 는 덮어쓰고 새 것은 뒤에 붙인다 — 기존 저장분을 지우지 않습니다 */
      const cur = userPresets(), byId = new Map(cur.map((x) => [x.id, x]));
      let n = 0;
      for (const p of list) {
        if (!p || typeof p !== "object" || !p.state) continue;
        const id = p.id || "u" + Date.now() + Math.floor(n);
        byId.set(id, { ...p, id });
        n++;
      }
      if (!n) throw new Error("empty");
      writeUserPresets([...byId.values()]);
      if (d && Array.isArray(d.favs)) writeFavs(d.favs);
      buildFavBar(); renderPresetList();
      toast(`${n}${t("preset_imported")}`);
    } catch { toast(t("preset_import_fail")); }
  };
  rd.onerror = () => toast(t("preset_import_fail"));
  rd.readAsText(f);
});
$("doRename").onclick = () => {
  const n = $("renameName").value.trim();
  if (!n || !S.renamingId) return;
  const list = userPresets().map((p) => (p.id === S.renamingId ? { ...p, name: n } : p));
  writeUserPresets(list);
  S.renamingId = null;
  closeMask("mRename");
  buildFavBar();
  renderPresetList();
};

/* ═══════════ 화면 방향 (가로 전용) ═══════════ v1.8.0
   이 앱은 가로 전용이다. 세로 모드는 지원하지 않는다.
   기기 회전 잠금이 켜져 있어도 항상 가로로 쓸 수 있어야 한다.

   pb_orient : "auto"  (기본) 터치 기기에서 뷰포트가 세로면 무조건 가로로 돌림
               "on"    항상 가로로 강제 (데스크톱 포함)
               "off"   기기 방향을 그대로 따름 — 사용자가 ⟳ 버튼으로 끈 경우만  */
const ORIENT_KEY = "pb_orient";
const getOrient = () => localStorage.getItem(ORIENT_KEY) || "auto";
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches ||
  navigator.standalone === true;
/* 손가락으로 쓰는 기기인가 — 데스크톱 브라우저 창을 세로로 좁혀놨을 때
   화면이 통째로 돌아가지 않도록 구분한다. */
const isTouchDevice = () =>
  window.matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 0;

/* v1.8.0 마이그레이션 — v1.7.0 은 기기가 가로가 되면 pb_orient 를 스스로 "off" 로 바꿨다.
   그 저장값이 남아 있으면 새 정책(항상 가로)이 먹히지 않으므로 딱 한 번 지운다. */
if (localStorage.getItem("pb_orient_v") !== "2") {
  localStorage.setItem("pb_orient_v", "2");
  localStorage.removeItem(ORIENT_KEY);
}

function placeLineBars() {
  const G = $("railLang"), L = $("hButtons"), R = $("vButtons"), X = $("railExtra");
  /* 가로 = 왼쪽 세로 레일(왼손 선택) / 세로 = 캔버스 위 오버레이.
     순서는 위에서부터 한/영 → 가로선 → 세로선 → V 기본구조 (v1.19.0). */
  if (document.body.classList.contains("land")) $("lineRail").append(G, L, R, X);
  else stage.append(L, R);
}

/* 오른쪽 도크는 아래 도크와 겹치면 안 되므로 아래 도크 높이를 CSS 변수로 넘긴다 */
function syncDockSpace() {
  const b = $("bottomDock");
  if (!b) return;
  stage.style.setProperty("--bdock", (b.offsetHeight + 18) + "px");
}

function applyLayout() {
  const mode = getOrient();
  const devPortrait = window.innerHeight > window.innerWidth;

  /* v1.8.0 — 세로 지원 중지.
     뷰포트가 세로면(= 기기 회전 잠금이 켜져 있든 아니든) 화면을 90° 돌려 가로로 만든다.
     OS 레벨 잠금(tryOrientationLock)이 성공하면 뷰포트 자체가 가로가 되므로
     devPortrait 가 false 가 되어 이 가짜 회전은 자동으로 꺼진다.

     v1.27.0 — **가짜 회전은 편집 화면에서만.**
     홈(사진 선택)과 사진 선택 시트가 열려 있는 동안은 기기 방향을 그대로 따른다.
     iOS 사진 시트는 OS 가 그려서 앱이 회전시킬 수 없으므로, 앱만 돌아 있으면
     둘이 90° 어긋나 사진을 고르기가 어렵다 (원장님 실제 불편 · 스크린샷 확인).
     "가로 전용"은 **작업 화면**에 대한 규칙이고, 사진을 넣는 동안에는 적용하지 않는다. */
  const editing = !!($("editor") && $("editor").classList.contains("active"));
  const rot = devPortrait && editing
    && (mode === "on" || (mode === "auto" && isTouchDevice()));
  /* 사진 선택 중에는 **방향을 바꾸지 않고** 화면만 어둡게 낮춘다 (index.html `body.picking`).
     세로로 돌려버리면 "지금 가로냐 세로냐"가 헷갈린다 — 원장님 지시 (v1.27.0). */
  document.body.classList.toggle("picking", !!S.picking);

  document.body.classList.toggle("rot90", rot);
  const w = rot ? window.innerHeight : window.innerWidth;
  const h = rot ? window.innerWidth : window.innerHeight;
  document.body.classList.toggle("land", w > h);
  document.body.classList.toggle("compact", h < 560);

  placeLineBars();
  updateButtons();
  measure();
  render();
}

/* 진짜 방향 잠금 — 성공하면 폰 화면 자체가 가로로 돌아간다(= 시스템 UI 도 함께 가로).
   · 안드로이드 설치앱(PWA standalone) : 동작함
   · 안드로이드 브라우저 탭            : 전체화면 상태에서만 허용되는 경우가 있어 재시도
   · 아이폰/아이패드 사파리            : 미구현 — 위의 rot90 CSS 회전이 대신 처리한다
   실패해도 조용히 넘어간다. 실패 = 가짜 회전으로 폴백. */
let orientLockDone = false, orientLockTries = 0;
function tryOrientationLock() {
  if (orientLockDone || getOrient() === "off") return;
  if (++orientLockTries > 4) { orientLockDone = true; return; }   /* 무한 재시도 방지 */
  const so = screen.orientation;
  if (!so || typeof so.lock !== "function") { orientLockDone = true; return; }
  try {
    so.lock("landscape").then(() => {
      orientLockDone = true;
      applyLayout();               /* 진짜로 돌아갔으면 가짜 회전 해제 */
    }).catch(() => { /* 사용자 제스처/전체화면 필요 — 아래에서 재시도 */ });
  } catch { orientLockDone = true; }
}
/* 일부 브라우저는 사용자 제스처가 있어야 잠금을 허용한다. 첫 터치에 한 번 더 시도. */
window.addEventListener("pointerdown", () => tryOrientationLock(), { once: false, passive: true });

/* 리사이즈 / 회전 대응 */
const ro = new ResizeObserver(() => { measure(); render(); });
ro.observe(stage);
new ResizeObserver(() => sizePosSlider()).observe($("pSlotV"));
new ResizeObserver(() => syncDockSpace()).observe($("bottomDock"));
window.addEventListener("resize", () => applyLayout());
window.addEventListener("orientationchange", () => setTimeout(applyLayout, 250));

/* ═══════════ init ═══════════ */
buildLineButtons();
buildFavBar();
applyI18n();
applyLayout();
tryOrientationLock();
/* 설치된 앱은 실행 직후 display-mode 판정이 늦게 잡히는 경우가 있어 한 번 더 확인 */
setTimeout(applyLayout, 600);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

/* 개발/디버깅용 */
window.PB = { S, DEFAULT_GUIDE, V_ANGLE_MAX, H_SPECS, V_SPECS,
  LINE_COLORS: { eye: "#3A3F4A", arch: "#2E8BFF", tail: "#A855F7", neutral: "#14161B" },
  render, runFaceAI, loadPhoto, alignFromPupils, autoAlign, aiValueFor, imgToCanvas,
  faceFrame, applyPreset, segPx, fitPresetToFace, runBalance, photoPixels, buildFavBar, favIds, balTolPx,
  autoFromDrawing, readDrawing, browBoxes, columnRuns, outlinePair,
  applyLayout, openPicker, endPicking };
