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
    editor_guide: "가이드",
    editor_preset_save: "현재 설정 저장",
    /* v1.56.0 설정 시트 */
    set_title: "설정 — 선 모양", set_badge: "설정",
    set_dragc: "잡은 선 심", set_drage: "잡은 선 테두리", set_back: "이전 설정으로",
    set_cycle: "선 색", set_c_mine: "내 세트",
    /* v1.64.0 가이드 스텝 프롬프트 — 지금 무엇을 맞추는지 한 줄로 */
    tip_v2: "이너 — 콧방울·내안각 기준선에 맞추세요",
    tip_frontThickness: "앞두께 — 앞머리 아래선에 맞추세요",
    tip_front: "앞머리 — 앞머리 윗선에 맞추세요",
    tip_h2: "아치 + 아치선 — <b>십자의 안쪽 위 모서리</b>를 눈썹 산에 얹으세요 (사선으로 끌면 둘이 함께)",
    tip_archThickness: "아치두께 — 산 아래선에 맞추세요",
    tip_h3: "꼬리 + 아우터 — <b>십자의 안쪽 모서리</b>를 꼬리 끝에 얹으세요 (사선으로 끌면 둘이 함께)",
    tip_v6: "아치선 — 산 위를 지나도록 좌우로 맞추세요",
    set_tab_base: "기본 선 · 차례", set_tab_grab: "잡은 선 · 움직일 때",
    set_grab_note: "잡은 선 = 선을 손가락이나 조절 바로 움직이는 동안의 모습입니다. 손을 떼면 기본 선으로 돌아갑니다.",
    set_backed: "이전 설정으로 되돌렸습니다", set_inner: "이너 묶음", set_arch: "아치 묶음", set_tail: "꼬리 묶음",
    set_all: "모두 이 색", set_edge: "테두리", set_weight: "선 굵기", set_hlen: "가로 길이",
    set_alpha: "투명도", set_reset: "기본으로", set_done: "완료",
    set_prev_note: "왼쪽 = 밝은 피부 · 오른쪽 = 어두운 눈썹 위. 두 쪽 다 잘 보이는 조합을 고르세요.",
    set_none: "없음", set_auto: "자동", set_light: "흰색", set_dark: "먹색",
    set_thin: "얇게", set_mid: "중간", set_thick: "두껍게",
    set_short: "짧게", set_long: "길게",
    set_c_now: "현재 세트", set_c_now_d: "지금 쓰던 색 그대로",
    set_c_bright: "밝은 사진", set_c_bright_d: "짙은 선 + 흰 테두리",
    set_c_dark: "어두운 사진", set_c_dark_d: "밝은 선 + 먹 테두리",
    set_saved: "설정을 저장했습니다",
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
    set_title: "Settings — Line look", set_badge: "Set",
    set_dragc: "Grab core", set_drage: "Grab outline", set_back: "Undo changes",
    set_cycle: "Colors", set_c_mine: "My set",
    tip_v2: "Inner — align to the nostril / inner-canthus line",
    tip_frontThickness: "Front thickness — align to the lower edge of the front",
    tip_front: "Front — align to the upper edge of the front",
    tip_h2: "Arch + Arch line — put the <b>inner-upper corner of the cross</b> on the brow peak (drag diagonally to move both)",
    tip_archThickness: "Arch thickness — align to the lower edge of the arch",
    tip_h3: "Tail + Outer — put the <b>inner corner of the cross</b> on the tail tip (drag diagonally to move both)",
    tip_v6: "Arch line — move left/right so it passes over the peak",
    set_tab_base: "Base lines", set_tab_grab: "Grabbed line",
    set_grab_note: "The grabbed line is how a line looks while you are moving it. It returns to the base look when you let go.",
    set_backed: "Restored previous settings", set_inner: "Inner", set_arch: "Arch", set_tail: "Tail",
    set_all: "All this color", set_edge: "Outline", set_weight: "Width", set_hlen: "Ruler length",
    set_alpha: "Opacity", set_reset: "Defaults", set_done: "Done",
    set_prev_note: "Left = bright skin · Right = dark brow. Pick a set that reads on both.",
    set_none: "None", set_auto: "Auto", set_light: "White", set_dark: "Ink",
    set_thin: "Thin", set_mid: "Medium", set_thick: "Thick",
    set_short: "Short", set_long: "Long",
    set_c_now: "Current", set_c_now_d: "What you use now",
    set_c_bright: "Bright photo", set_c_bright_d: "Dark lines + white outline",
    set_c_dark: "Dark photo", set_c_dark_d: "Bright lines + ink outline",
    set_saved: "Settings saved",
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

/* 화면에 보여 주는 앱 버전 — ⚠️ 릴리스 때 sw.js 의 VERSION 과 **함께** 올리세요.
   폰(iOS PWA)은 캐시가 끈질겨서, 이 표시가 옛 버전이면 아직 업데이트 전입니다. */
const APP_VERSION = "v1.68.0";

/* ═══ 가이드 플로우 (v1.42.0 · 원장님 지시 2026-08-21) ═══════════════════
   선의 **기본색은 전부 짙은 회색** — 고유색은 그 선이 "지금 차례"(가이드)이거나
   선택됐을 때만 켜진다. 가이드 순서: 이너 → 앞두께 → 앞머리 → 아치두께 → 아치 → 꼬리.
   · 가이드는 **처음 움직인 선에서 시작**하고, 움직임이 끝나면 다음 순서가 켜진다
   · 다른 선을 다시 움직이면 그 선이 켜지고, 끝나면 **그 선의 다음** 순서가 켜진다
   · 어떤 선이든 순서와 무관하게 자유롭게 움직일 수 있다
   · 꼬리(마지막) 뒤로는 **처음으로 돌아가지 않는다** — 플로우 종료
   · 가이드를 끄면 즉시 종료 */
/* ⚠️ v1.64.0 원장님 지시 2026-08-23 — 플로우 재정렬
   「앞두께에서 아치 - 아치두께로 변경. 플로우가 아치 - 아치두께 - 꼬리+아우터 동시적용 - 아치선」
   · 아치두께↔아치 **순서를 바꿨다** — 아치(산 높이)를 먼저 잡고 그 위에 두께를 얹는다
   · 꼬리와 아우터는 **한 스텝**이다 (v1.61.0 사선 이동으로 한 점처럼 움직이므로).
     그 스텝에서 위아래 바 = 꼬리, 좌우 바 = 아우터 (TAIL_PAIR 참고)
   · 아치선(v6)이 마지막 — 플로우는 여기서 끝난다 (처음으로 돌아가지 않음)
   ⛔ 아우터(v4)를 다시 독립 스텝으로 넣지 마세요 — 꼬리와 한 점입니다 (BASELINE 1-27) */
/* ⚠️ v1.67.0 원장님 지시 2026-08-24 — **아치선도 아치와 한 스텝**
   「아치선 세로선도 꼬리와 마찬가지로 아치 가로선을 움직일 때 함께 사방으로 움직이도록.
     아치두께 가로선도 이에 따라 함께 따라온다. … 가이드 플로우는 아치 - 아치두께 - 꼬리로 종료」
   · 아치(h2)와 아치선(v6)은 **한 점**이다 — 사선으로 끌면 둘이 함께 (ARCH_PAIR)
   · 아치가 움직이면 **아치두께가 같은 만큼 따라온다** — 두께는 아치두께 차례에서만 정한다
   · 아치선(v6)은 이제 **독립 스텝이 아니다** → 플로우는 꼬리에서 끝난다
   ⛔ v6 를 플로우에 다시 넣지 마세요. 아우터와 같은 이유로 아치와 한 점입니다 (BASELINE 1-31) */
const GUIDE_FLOW = ["v2", "frontThickness", "front", "h2", "archThickness", "h3"];
/* 꼬리 스텝이 함께 잡는 세로선 — 좌우 바가 이 선을 잡는다 */
/* ⚠️ v1.68.0 원장님 지시 2026-08-24 — 「플로우 적용 시 **꼬리와 아우터 지점은 내부쪽과 위**다」
   (민트 펜으로 위·안쪽 두 팔을 그려 주셨습니다.) 아치와 같은 방향이 됐습니다.
   ⛔ 아래쪽으로 되돌리지 마세요 — 꼬리 아래는 눈썹이 이어지는 자리라 표식이 드로잉을 덮습니다. */
const TAIL_PAIR = { step: "h3", lr: "v4", up: true };
/* 아치 스텝이 함께 잡는 세로선 + 따라오는 두께선 (v1.67.0) */
const ARCH_PAIR = { step: "h2", lr: "v6", thick: "archThickness", up: true };
/* 가이드 스텝 ↔ 함께 움직이는 세로선 쌍 (마커·바 배정이 이 표 하나를 본다) */
const STEP_PAIRS = [TAIL_PAIR, ARCH_PAIR];
const pairOfStep = (step) => STEP_PAIRS.find((q) => q.step === step) || null;
/* v1.46.0 — 기본 회색(GREY_LINE) 폐지 (원장님: 「회색이라 내 드로잉과 겹쳐 잘 안 보인다」).
   모든 선은 **항상 자기 고유색**: 차례/선택이 아니면 연하게(투명도↓), 차례면 진하게+굵게.
   색만 봐도 어떤 선인지 알 수 있어 가이드를 모르는 사용자도 위쪽 칩 색과 바로 짝지을 수 있다. */

const H_SPECS = [
/* ⚠️ `anchor` — 가로 자는 **자기 묶음의 세로선 위에** 올라간다 (v1.32.0)
   원장님 지시(2026-08-20): 「아우터 세로라인은 꼬리와 함께 움직임 / 이너라인은 앞머리
   앞두께와 함께 움직인다 / 아치 세로선 두개 더 생성」
     앞머리 · 앞두께 → 이너(v2/v3)      · 검정
     아치 · 아치두께 → **아치선(v6/v7)** · 파랑
     꼬리            → 아우터(v4/v5)    · 보라
   v1.31.x 까지는 자 위치가 frac 상수로 박혀 있어, **아치 자가 아우터를 따라 움직였습니다**
   (원장님이 직접 찾아내신 문제). 상수를 되살리지 말고 anchor 를 쓰세요. */
  { key: "h1", vis: "h1Visible", i18n: "line_eye",   color: "#3A3F4A", dot: "#9AA3B2", w: 2.0, op: 0.5, anchor: null },
  /* ⚠️ v1.48.0 — 이너 묶음은 **강조=민트 / 연한=연회색** 두 색으로 나뉜다 (원장님 지시 2026-08-22).
     딥 틸(#0D9488)은 ① 피부와 밝기 대비가 1.1~1.5:1 뿐이라 **밝기가 아니라 색으로만** 보였고
     (같은 명도 + 보색 + 채도 91% = 눈이 진동한다 — 「눈이 조금 아프다」),
     ② 연한 상태가 알파 0.45로 피부와 섞여 실제 화면색이 #617F6A 탁한 이끼색이 됐다
     (「톤다운된 이상한 색」). 색 이름을 또 바꾸는 것으로는 해결되지 않는 문제였다.
     → 강조는 **레일 버튼 띠와 같은 민트**(선 색 = 띠 색이라 배지 없이 짝지어진다),
       연한 상태는 **알파를 쓰지 않고 연회색을 그대로** 그린다 (`dimColor` · 아래 dimOpOf 참고).
     ⚠️ `dimColor` 를 지우고 알파 방식으로 되돌리면 탁한 색이 그대로 돌아옵니다. */
  { key: "front", vis: "frontVisible", i18n: "line_front", color: "#5EEAD4", dimColor: "#C9D1D6", dot: "#5EEAD4", w: 1.15, op: 0.9, anchor: "v2" },
  { key: "frontThickness", vis: "frontThicknessVisible", i18n: "line_ft", color: "#5EEAD4", dimColor: "#C9D1D6", dot: "#5EEAD4", w: 1.15, op: 0.9, anchor: "v2" },
  /* ⚠️ v1.49.0 — 아치·꼬리도 **연한 상태를 알파가 아니라 별도 색**으로 (원장님 지시 2026-08-22).
     고유색(파랑·보라)은 **그대로 둡니다** — 원장님이 유지를 원하셨습니다.
     문제는 강조 색이 아니라 연한 상태였습니다: 알파 0.475로 흐리게 하니 파랑이 피부와 섞여
     화면 실제색이 #6D7CA4(휘도 0.203), 보라는 #A762A0(0.195) — **피부(0.199)와 밝기가 같아
     사실상 안 보였습니다.** 이너만 알파를 걷어낸 뒤로 「아치 파랑이 죽어있는 느낌」이 된 이유. */
  { key: "h2", vis: "h2Visible", i18n: "line_arch",  color: "#2E8BFF", dimColor: "#A9CFF2", dot: "#2E8BFF", w: 1.15, op: 0.95, anchor: "v6" },
  { key: "archThickness", vis: "archThicknessVisible", i18n: "line_at", color: "#2E8BFF", dimColor: "#A9CFF2", dot: "#2E8BFF", w: 1.15, op: 0.95, anchor: "v6" },
  /* v1.51.0 — 꼬리 자는 **길이 반** (원장님 지시). 아우터를 가운데 두는 것은 그대로 */
  { key: "h3", vis: "h3Visible", i18n: "line_tail",  color: "#A855F7", dimColor: "#D0B8F0", dot: "#A855F7", w: 1.15, op: 0.95, anchor: "v4", halfK: 0.5 },
];

const V_SPECS = [
  { key: "v1", vis: "v1Visible", i18n: "line_center", color: "#14161B", dot: "#C9D1E0", w: 1.1, op: 1,   mirror: null },
  /* 이너만 길게(눈까지) 남긴다 — 콧방울·내안각과 맞춰 보는 기준선이기 때문 (원장님 지시 2026-08-20) */
  { key: "v2", vis: "v2Visible", i18n: "line_inner",  color: "#5EEAD4", dimColor: "#C9D1D6", dot: "#5EEAD4", w: 1.35, op: 0.6, mirror: "v3", long: true },
  /* 아치선 (v1.32.0) — 아치·아치두께가 올라가는 기둥. 아우터보다 **얇게** 그려 소속을 표시한다 */
  { key: "v6", vis: "v6Visible", i18n: "line_archv",  color: "#2E8BFF", dimColor: "#A9CFF2", dot: "#2E8BFF", w: 0.75, op: 0.9, mirror: "v7" },
  /* 아우터는 **보라** — 꼬리와 한 묶음이라 색으로 묶어 준다 (원장님 지시 2026-08-20) */
  { key: "v4", vis: "v4Visible", i18n: "line_outer",  color: "#A855F7", dimColor: "#D0B8F0", dot: "#A855F7", w: 0.95, op: 1,   mirror: "v5" },
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

/* ═══════════ 2-b. 설정 — 선 모양 (v1.56.0 · 원장님 지시 2026-08-23) ═══════════
   「각 선마다 사용자가 선호하는 색상 … 색상표와 아래 미리보기 선 … 선의 테두리 유무,
     있을 때 몇 퍼센트, 테두리 색상도 대비색으로 … 선 굵기 / 가로선 길이 / 투명도 …
     맨 위에 추천 3개 조합 … 너무 자세하게는 말고 직관적으로 깔끔하게」

   ⚠️ 색상표를 고른 근거 (숫자로 확인함 — 마음대로 바꾸지 마세요)
   원장님 사진의 피부(밝은 쪽 rgb 215,170,140 / 보통 189,128,100)와 짙은 눈썹(55,42,38)
   **양쪽 모두에 밝기 대비 2:1 을 넘기는 색은 사실상 없습니다** (흰색 2.10 / 먹 1.07 이 한계).
   → 그래서 색은 **색상(hue)이 피부의 주황(약 25°)에서 멀리 떨어지도록** 고르고,
     밝기 대비는 **테두리(대비색 헤일로)** 가 만들도록 역할을 나눴습니다. 이 설정의 설계입니다.
   먹(#14161B)은 밝은 피부 대비 8.6:1 로 **밝은 사진에서 가장 잘 보이는 색**이라 넣었습니다. */
const PALETTE = [
  { hex: "#5EEAD4", ko: "민트", en: "Mint" },     /* 166° */
  { hex: "#A3E635", ko: "라임", en: "Lime" },     /*  81° */
  { hex: "#38BDF8", ko: "하늘", en: "Sky" },      /* 199° */
  { hex: "#2E8BFF", ko: "파랑", en: "Blue" },     /* 215° */
  { hex: "#A855F7", ko: "보라", en: "Violet" },   /* 280° */
  { hex: "#FF4D94", ko: "핑크", en: "Pink" },     /* 334° */
  { hex: "#14161B", ko: "먹",   en: "Ink" },      /* 밝은 피부에서 최고 대비 8.6:1 */
];
const LOOK_KEY = "pb_look_v1";
/* ⚠️⚠️ v1.60.0 — **원장님이 실제 앱에서 맞춰 확정한 기본값** (2026-08-23 · 스크린샷 픽셀 판독)
   「지금 내가 앱에 설정한 선을 기본으로 셋팅하고 못 박아줘」

   이 값은 취향이 아니라 **시술 현장에서 눈으로 맞춘 결과**입니다. 임의로 바꾸지 마세요:
   · 선 굵기 얇게(0.8) · 가로 길이 짧게(0.14) · 투명도 75%
       → 자가 눈썹 위를 덜 가리고, 아래 드로잉이 비쳐 갭을 눈으로 잽니다
   · 테두리 없음 + 자동
       → 원장님 사진에서는 테두리 없이도 읽혀서, 화면을 더 조용하게 두는 쪽을 고르셨습니다
   · 잡은 선 = 먹 심 · 테두리 **없음** · 얇게 · 95%
       → 잡은 순간 「짙은 한 줄」로만 바뀌는 것이 가장 방해가 적다는 판단
   ⛔ 값을 바꾸려면 원장님 확인을 먼저 받으세요. 회귀 112 가 이 값을 통째로 잠급니다.
   ⛔ LOOK_COMBOS(추천 조합)는 **색과 테두리만** 바꿉니다 — 굵기·길이·투명도·잡은 선은
      원장님 값이 그대로 남아야 합니다 (조합을 돌려도 손에 익은 두께가 안 변하도록). */
const LOOK_DEF = { inner: "#5EEAD4", arch: "#2E8BFF", tail: "#A855F7",
                   edge: 0, edgeC: "auto", weight: 0.8, hlen: 0.14, alpha: 0.75,
                   dragCore: "#14161B", dragEdge: "none", dragW: 0.8, dragOp: 0.95 };
/* 맨 위 3개 조합 — 첫 칸은 늘 「현재 세트」(지금 값), 나머지 둘은 상황별 추천 */
const LOOK_COMBOS = [
  { id: "now",    name: "set_c_now",    desc: "set_c_now_d" },
  /* ⚠️ v1.60.0 — 추천 조합은 **색과 테두리만** 손댑니다. 굵기·가로 길이·투명도·잡은 선은
     원장님이 확정한 값(LOOK_DEF)이 그대로 남습니다 — 조합을 돌려도 손에 익은 두께가 안 변하게. */
  { id: "bright", name: "set_c_bright", desc: "set_c_bright_d",
    v: { inner: "#14161B", arch: "#2E8BFF", tail: "#A855F7", edge: 70, edgeC: "light" } },
  { id: "dark",   name: "set_c_dark",   desc: "set_c_dark_d",
    v: { inner: "#5EEAD4", arch: "#38BDF8", tail: "#FF4D94", edge: 70, edgeC: "dark" } },
];
function loadLook() {
  try { return { ...LOOK_DEF, ...(JSON.parse(localStorage.getItem(LOOK_KEY)) || {}) }; }
  catch (e) { return { ...LOOK_DEF }; }
}
function saveLook() { try { localStorage.setItem(LOOK_KEY, JSON.stringify(S.look)); } catch (e) {} }
/* 선 키 → 색 묶음. 레일 버튼 색과 1:1 로 맞아야 합니다 (BASELINE 1-20) */
const GROUP_OF = { v2: "inner", front: "inner", frontThickness: "inner",
                   v6: "arch", h2: "arch", archThickness: "arch",
                   v4: "tail", h3: "tail" };
const groupColor = (key) => (S.look && S.look[GROUP_OF[key]]) || null;
/* 상대 휘도 — 테두리 「자동」이 밝은 선엔 먹, 짙은 선엔 흰색을 고르는 근거 */
function relLum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
const EDGE_LIGHT = "#FFFFFF", EDGE_DARK = "#0A0D14";
function edgeColorFor(hex) {
  if (S.look.edgeC === "light") return EDGE_LIGHT;
  if (S.look.edgeC === "dark") return EDGE_DARK;
  return relLum(hex) > 0.32 ? EDGE_DARK : EDGE_LIGHT;   /* 자동 = 대비색 */
}
/* 고유색 선 하나 — 테두리(있으면) 먼저, 그 위에 색. 깜빡임 클래스는 둘 다에 붙인다 */
function drawLive(frag, x1, y1, x2, y2, hex, w, cls) {
  const op = S.look.alpha;
  if (S.look.edge > 0) drawLine(frag, x1, y1, x2, y2, edgeColorFor(hex),
                                w * (1 + 2 * S.look.edge / 100), op * 0.9, cls);
  drawLine(frag, x1, y1, x2, y2, hex, w, op, cls);
}

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
  guideOn: false, guideCur: null,   // 가이드 플로우 (v1.42.0)
  dragOn: false,         // 선을 잡고 움직이는 중 (v1.55.0 — 짙은 회색 + 살구색 테두리)
  look: loadLook(),      // 선 모양 설정 (v1.56.0) — 색·테두리·굵기·길이·투명도
  lookSnap: null,        // 설정 시트를 연 순간의 값 (「현재 세트」 카드)
  lookOwn: null,         // 순환 버튼의 「내 세트」 (v1.58.0) — 추천을 돌다 돌아올 내 설정
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

function drawLine(frag, x1, y1, x2, y2, color, w, op, cls) {
  /* 흰색 헤일로 없음 (v1.42.1 — 원장님 지시: 「선은 흰색 테두리말고 그냥 짙은회색으로」).
     헤일로를 되살리면 선이 두꺼워 보여 정교함이 죽습니다. */
  const a = {
    x1, y1, x2, y2, stroke: color, "stroke-width": w,
    "stroke-opacity": op, "stroke-linecap": "round",
  };
  if (cls) a.class = cls;
  frag.appendChild(mk("line", a));
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
/* ⚠️ v1.51.0 — 선의 "조용한 부분" (원장님 지시 2026-08-22 · 세 밝기 중 2안 선택)
   자와 세로선은 **일하는 곳만 굵고 나머지는 얇은 짙은 회색**으로 잇는다.
   · 가로 자  : 세로선을 경계로 **안쪽(센터 쪽) 절반**이 얇다 — 앞부분은 참고, 뒷부분으로 맞춘다
   · 세로선   : **두 자 사이(눈썹 몸통)가 얇다** — 굵은 선이 눈썹 속을 가로지르면 드로잉을 가린다
                (원장님: 「바깥에만 굵은선이고 눈썹 내부는 얇은 회색으로」) */
const HALF_GREY = "#14161B", HALF_W = 1.0, HALF_OP = 0.5;
/* ⚠️ v1.52.0 — 세로선과 자의 방향 신호 (원장님 지시 2026-08-22)
   v1.51.0 의 토막 방식은 "굵은 조각이 자 끝에 붙은 ㄱ자"로 보여 **어느 방향으로 움직이는
   선인지 읽히지 않았다** (원장님: 「세로로 움직여야하는지 가로로 움직여야하는지 직관적이지
   않다」). 해결 두 가지:
   ① 세로선은 조용할 때 **전체가 회색 한 줄**(색 없음·조금 두껍게) — 잡는 순간 전체가
      고유색으로 켜져 "세로줄 = 좌우 이동"이 그 순간 읽힌다 (원장님 제안)
   ② 가로 자의 고유색은 세로선을 **지나 안쪽으로 반폭의 50%** 까지 나온다 — 색 토막이
      세로선을 관통하므로 "이 선은 가로"가 읽힌다 (원장님이 빨간 펜으로 그어주신 길이를
      픽셀로 재서 45~55% → 50%로 확정)
   ⛔ 색 토막을 세로선에서 뚝 끊거나(ㄱ자로 돌아감), 조용한 세로선에 색 토막을 되살리지 마세요. */
const VGREY_W = 1.7, VGREY_OP = 0.6;   // 조용한 세로선 — 얇은 참조선(1.0)보다는 분명한 한 줄
const TAIL_EXT = true;                 // 꼬리 자 바깥의 얇은 회색 참조선 (v1.53.0 원장님 지시)
/* ⚠️ v1.55.0 — 선의 상태는 **딱 세 가지** (원장님 지시 2026-08-22 · v1.51~1.54 의 혼합 폐지)
   ① 조용            : 얇은 짙은 회색 **한 줄** — 가로 자도 색 토막 없이 전부 회색
   ② 지금 차례·선택   : **고유색 한 줄** — 4초에 한 번 느리게 깜빡(밝음→조금 투명→밝음)
   ③ 잡고 움직이는 중 : **짙은 회색 심 + 살구색 테두리**
   원장님: 「가로바들이 회색과 고유색으로 섞여있는데 고유색으로만 1개선으로 변경 …
   모든 선을 클릭해서 움직일 때는 짙은회색과 살구색 테두리, 움직임 없을 때는 얇은 회색 유지」
   ⛔ 자를 색+회색으로 나누던 v1.51~1.53 방식으로 되돌리지 마세요 — 「1개선」이 지시입니다.
   ⛔ 깜빡임은 CSS(`#guides line.blink`)가 돌립니다. JS 타이머로 되돌리면 드래그가 버벅입니다.
   ⛔ 저장(내보내기)은 SVG를 직렬화하므로 CSS 애니메이션이 안 붙습니다 → 늘 선명하게 찍힙니다. */
const APRICOT = "#FFC9A3";              // 살구색 — 잡은 선 테두리의 기본값
const GRAB_RING = 3.2;                  // 테두리가 심보다 넓은 양(px)
/* v1.57.0 — 잡은 선의 심·테두리 색도 설정에서 고른다 (원장님 지시 2026-08-23:
   「색상 변경은 두 개 컨셉 — 선택하기 전 / 선택 후 움직이는 것. 설정에서 두 개 선 선택」) */
function drawGrab(frag, x1, y1, x2, y2, w) {
  const L = S.look || {};
  const gw = w * (L.dragW || 1), op = L.dragOp != null ? L.dragOp : 1;
  const e = L.dragEdge || APRICOT;
  if (e !== "none") drawLine(frag, x1, y1, x2, y2, e, gw + GRAB_RING, 0.95 * op);
  drawLine(frag, x1, y1, x2, y2, L.dragCore || HALF_GREY, gw, op);
}
const SEG_HALF = 0.19;           // 자 반폭 기본값 — 실제 값은 S.look.hlen (v1.56.0 설정)
const segHalf = () => (S.look && S.look.hlen) || SEG_HALF;
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
  const half = segHalf() * (sp.halfK || 1) * (Math.abs(g.v2 - g.v4) || 0.12);
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
  /* v1.46.0 — 모든 선은 **항상 고유색**: 강조(차례/선택)가 아니면 연하게(투명도 60%),
     강조면 진하게(불투명)+굵게(+1.6). 회색 기본은 드로잉 위에서 사라져 폐지 (원장님 지시).
     가이드 중에는 지금 차례(guideCur) 하나만 강조 (v1.44.0). */
  /* v1.47.0 — 가이드가 기본 상시 ON이 되면서, 가이드 중에도 **선택한 선은 켜진다**
     (안 그러면 아우터·아치선처럼 플로우 밖 선을 골라도 아무 표시가 없다 — 회귀 51).
     플로우 진행 중엔 움직인 선이 곧 선택이라 실제로는 하나만 켜진 것처럼 보인다. */
  const emph = (sp) => (S.guideOn && S.guideCur === sp.key) || isSelected(sp.key);
  /* v1.56.0 — 고유색은 **설정에서 고른 묶음 색**이 먼저. 설정에 없는 선(눈·센터)만 스펙 색 */
  const liveColor = (sp) => groupColor(sp.key) || sp.color;
  /* ⚠️ v1.48.0 — 연한 상태를 **알파로 만들지 않는다** (원장님 지시 2026-08-22).
     알파로 흐리게 하면 그 색이 피부와 섞여 고른 색과 전혀 다른 탁한 색이 화면에 나온다
     (딥 틸 0.45 → #617F6A). `dimColor` 가 있는 스펙은 **그 색을 불투명하게 그대로** 그린다.
     `dimColor` 가 없는 스펙(눈·아치·꼬리·센터·아우터)은 예전처럼 고유색을 알파로 연하게. */
  const dimOp = (sp) => Math.max(0.4, sp.op * 0.5);   /* v1.46.3 — 연한 상태 한 단계 더 차분하게 (0.6→0.5) */
  const dimColor = (sp) => sp.dimColor || sp.color;
  const dimOpOf = (sp) => (sp.dimColor ? 1 : dimOp(sp));
  const lineColor = (sp, sel) => (sel ? liveColor(sp) : dimColor(sp));
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
    const HAIR = "#14161B";   // 옅은 연결선용 중성색 (v1.46.0 — 이너가 앰버가 되어 분리)
    for (const sp of H_SPECS) {
      if (!g[sp.vis]) continue;
      const y = g[sp.key] * H;
      const sel = emph(sp);
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
        /* v1.53.0 — 꼬리 자는 **바깥(관자놀이 쪽)으로 얇은 회색 참조선**을 더 뺀다 (원장님 지시
           2026-08-22: 「꼬리 선 밖으로 얇은 회색선 더 빼주고」). 자 길이만큼 뻗는다 */
        if (!bad && TAIL_EXT && sp.key === "h3" && sp.anchor) {
          const ext = (xb - xa);
          const t0 = idx === 0 ? clamp(xa - ext, 0, W) : xb;
          const t1 = idx === 0 ? xa : clamp(xb + ext, 0, workRight() * W);
          if (t1 - t0 > 1) drawLine(frag, t0, y, t1, y, HALF_GREY, HALF_W, HALF_OP);
        }
        /* ⚠️ v1.55.0 — 세 상태 (위 상수 주석 참고). 자를 색/회색으로 쪼개지 않는다 */
        if (bad) { drawLine(frag, xa, y, xb, y, BAL_RED, sp.w + 2.2, 1); return; }
        if (sel && S.dragOn) { drawGrab(frag, xa, y, xb, y, sp.w + 1.8); return; }
        if (sel) { drawLive(frag, xa, y, xb, y, liveColor(sp), (sp.w + 1.8) * S.look.weight, "blink"); return; }
        drawLine(frag, xa, y, xb, y, HALF_GREY, HALF_W, HALF_OP);
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
      const sel = emph(sp);
      const w = sel ? sp.w + 1.8 : sp.w + 0.6, op = sel ? 1 : dimOpOf(sp);   /* v1.47.1 — 기본 +0.6 */
      const full = sp.key === "v1";
      const band = sp.long ? bandL : bandT;
      const by0 = band.y0 * H, by1 = band.y1 * H;
      const lc = lineColor(sp, sel);
      const draw = (x) => {
        if (full) {
          if (sel && S.dragOn) { drawGrab(frag, x, 0, x, H, w); return; }
          if (sel) { drawLive(frag, x, 0, x, H, lc, w * S.look.weight, "blink"); return; }
          drawLine(frag, x, 0, x, H, lc, w, op); return;
        }
        frag.appendChild(mk("line", {                       // 라벨 ↔ 선 연결 (헤일로 없음)
          x1: x, y1: 0, x2: x, y2: H, stroke: lc,
          "stroke-width": 1, "stroke-opacity": 0.16,
        }));
        /* v1.52.0 — 잡은(강조) 세로선은 **전체 길이 고유색**: "세로줄 = 좌우 이동" 신호.
           조용할 땐 **전체가 회색 한 줄** — 색과 토막이 없어 자의 색 토막과 헷갈리지 않는다 */
        if (sel && S.dragOn) { drawGrab(frag, x, by0, x, by1, w); return; }
        if (sel) { drawLive(frag, x, by0, x, by1, lc, w * S.look.weight, "blink"); return; }
        drawLine(frag, x, by0, x, by1, HALF_GREY, VGREY_W, VGREY_OP);
      };
      const x = g[sp.key] * W;
      draw(x);
      /* v1.46.2 — 세로선 이름 배지 전부 숨김 (원장님 지시 「세로선들 이름 배지 모두 숨김」).
         v1.46.0부터 선이 항상 고유색이라 색이 곧 이름표 — 배지는 화면만 가린다.
         vBadges.push(...) 를 되살리면 배지가 돌아온다. 회귀 46이 0개를 검사한다. */
      if (sp.mirror) {
        const xm = (2 * g.v1 - g[sp.key]) * W;
        draw(xm);
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

  /* ⚠️ v1.64.0 — 꼬리 스텝의 **십자 안쪽 모서리** 표식 (원장님 지시 2026-08-23:
     「두 선이 맞닿아 십자가 모양의 내측을 포인트로 꼬리 자동 정렬 찾는 프롬프트로 넣을 것」)
     꼬리 자(h3 = 꼬리 **윗선**)와 아우터(v4)가 만나는 점에서, 눈썹 몸통 쪽(안쪽·아래쪽)으로
     ㄱ자 팔을 그린다 — 원장님이 빨간 펜으로 그려주신 그 모양입니다.
     이 모서리를 드로잉의 꼬리 끝에 얹으면 꼬리·아우터가 한 번에 맞습니다.
     ⛔ 가이드가 꼬리 차례일 때만 그립니다 — 늘 그리면 화면이 시끄러워집니다. */
  /* ⚠️ v1.67.0 — 아치 스텝에도 같은 표식. **팔 방향이 다릅니다** (원장님 지시 2026-08-24:
     「아치선의 굵은 색상은 아래와 안쪽이 아니라 **안쪽과 위** 라인이어야 한다」)
       · 꼬리 : 안쪽 + **아래** — 꼬리 끝 아래로 눈썹 몸통이 이어집니다
       · 아치 : 안쪽 + **위**  — 산 바로 아래가 눈썹이라, 아래로 그으면 드로잉을 덮습니다
     ⛔ 두 방향을 같게 만들지 마세요. */
  {
    const pr = S.guideOn ? pairOfStep(S.guideCur) : null;
    const vsp = pr ? V_SPECS.find((q) => q.key === pr.lr) : null;
    if (pr && vsp && g[specOf(pr.step).vis] && g[vsp.vis]) {
      const y = g[pr.step] * H, arm = Math.max(16, Math.min(W, H) * 0.045);
      const ay = pr.up ? y - arm : y + arm;
      for (const [x, inward] of [[g[pr.lr] * W, 1], [(2 * g.v1 - g[pr.lr]) * W, -1]]) {
        if (x < 2 || x > workRight() * W) continue;
        const d = `M ${x + inward * arm} ${y} L ${x} ${y} L ${x} ${ay}`;
        const hex = liveColor(specOf(pr.step));
        /* ⚠️ v1.68.0 — 표식의 테두리는 **설정의 「테두리」를 그대로 따른다** (원장님 지시 2026-08-24:
           「꼬리와 아우터에 회색 테두리가 자동으로 생겼다. 내가 의도하지 않음 — 테두리 없게」).
           v1.64~1.67 은 여기에 짙은 테두리를 **박아** 두어, 설정이 「없음」인데도 회색 테두리가 났습니다.
           ⛔ 다시 박지 마세요. 선과 표식은 같은 규칙을 씁니다 (drawLive 와 동일). */
        if (S.look.edge > 0) frag.appendChild(mk("path", { d, fill: "none", stroke: edgeColorFor(hex),
          "stroke-width": 3 * (1 + 2 * S.look.edge / 100), "stroke-linecap": "round",
          "stroke-linejoin": "round", "stroke-opacity": S.look.alpha * 0.9 }));
        frag.appendChild(mk("path", { d, fill: "none", stroke: hex, "stroke-opacity": S.look.alpha,
          "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", class: "blink" }));
      }
    }
  }

  svg.replaceChildren(frag);
}

/* v1.64.0 — 지금 차례인 선의 프롬프트 한 줄. 가이드가 꺼져 있으면 숨긴다 */
function updateGuideTip() {
  const el = $("guideTip"); if (!el) return;
  const key = S.guideOn ? S.guideCur : null;
  const msg = key ? t("tip_" + key) : "";
  if (!key || msg === "tip_" + key) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = msg;
}

function render() {
  renderPhoto();
  renderGuides();
  updateButtons();
  updatePanels();
  updateGuideTip();
  alignCenterDock();
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
    /* ═══ v1.61.0 — 꼬리·아우터는 **한 점**이다 (원장님 지시 2026-08-23) ═══════════
       「꼬리와 아우터는 붙어있는데 … 양방향 사선 동시에 움직일 수 있니?」 → 「둘 다 사선」 선택.
       꼬리 끝 = (아우터 x, 꼬리 y) 한 점이므로, 꼬리 자든 아우터 세로선이든 잡고 **사선으로
       끌면 둘이 함께** 움직인다. dy → 꼬리(h3), dx → 아우터(v4 · 대칭은 setLine 이 처리).
       · 아우터를 오른쪽(거울) 인스턴스로 잡으면 dx 부호가 뒤집힌다 — 기존 mirrored 와 동일 규칙
       · 꼬리 자를 잡았을 때의 좌/우 판정은 **누른 지점이 센터선(v1)의 어느 쪽인가**로
       · 한 축만 미세 조정하고 싶으면 아래 조절 바(위아래/좌우)를 쓰면 된다 — 바는 한 축씩
       · 여러라인 모드에서는 이 규칙을 끈다(dragManyBy 가 이미 각자 축으로 움직임)
       ⛔ 다른 자(앞머리·아치 등)에 이 규칙을 퍼뜨리지 마세요 — 그 자들은 두께를 재는
          쌍이라 x 가 세로선에 묶여 있고, 사선이 되면 잰 값이 흐트러집니다. */
    if (!S.multi && (key === "h3" || key === "v4") && S.g.h3Visible && S.g.v4Visible) {
      gDrag.tailPair = {
        h3: S.g.h3, v4: S.g.v4,
        flip: key === "v4" ? mirrored : sp.x > S.g.v1 * S.dim.W,
      };
    }
    /* v1.67.0 — 아치(h2)·아치선(v6)도 같은 규칙. 아치두께는 아치를 따라 **같은 만큼** 내려간다
       (두께를 유지한 채 산 전체가 움직인다). ⛔ 아치두께 자체를 잡으면 위아래만 — 그대로 둡니다. */
    if (!S.multi && (key === "h2" || key === "v6") && S.g.h2Visible && S.g.v6Visible) {
      gDrag.archPair = {
        h2: S.g.h2, v6: S.g.v6, at: S.g.archThickness,
        flip: key === "v6" ? mirrored : sp.x > S.g.v1 * S.dim.W,
      };
    }
    render();
    const c0 = posConfig();
    /* 값 HUD 없음 (v1.44.0) — 바 라벨의 숫자로 충분합니다 */
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
      S.dragOn = true;   /* 움직이는 동안 짙은 회색 + 살구색 테두리 (v1.55.0) */
      /* 끌기 시작 = 잡은 선을 선택에 합류 (여러라인 모드) */
      if (S.multi && gDrag.tapKey && !S.selSet.includes(gDrag.tapKey)) S.selSet.push(gDrag.tapKey);
      /* 가이드: 움직이기 시작한 선이 "지금 차례"가 된다 — 예약돼 있던 다음 선은 꺼진다 (v1.42.0) */
      if (S.guideOn && GUIDE_FLOW.includes(gDrag.key)) S.guideCur = gDrag.key;
    }
    const dxN = (sp.x - gDrag.x0) / W, dyN = (sp.y - gDrag.y0) / H;
    if (S.multi && gDrag.keys.length > 1) {
      dragManyBy(gDrag.keys, gDrag.baseAll, dxN, dyN, gDrag.mirrored ? gDrag.key : null);
    } else if (gDrag.tailPair) {
      /* 꼬리·아우터 사선 (v1.61.0) — 한 손짓으로 꼬리 끝 점을 놓는다 */
      setLine("h3", gDrag.tailPair.h3 + dyN);
      setLine("v4", gDrag.tailPair.flip ? gDrag.tailPair.v4 - dxN : gDrag.tailPair.v4 + dxN);
    } else if (gDrag.archPair) {
      /* 아치·아치선 사선 (v1.67.0) — 산꼭대기 한 점을 한 손짓으로. 두께가 함께 따라온다 */
      const a = gDrag.archPair;
      setLine("h2", a.h2 + dyN);
      setLine(ARCH_PAIR.thick, a.at + dyN);
      setLine("v6", a.flip ? a.v6 - dxN : a.v6 + dxN);
    } else {
      dragLineBy(gDrag.key, gDrag.base, dxN, dyN, gDrag.mirrored);
    }
    render();
    /* 값 네모칸(HUD)은 띄우지 않는다 (v1.44.0 원장님 지시) — 드래그 바 라벨에 숫자가
       이미 있어 중복이고 사진을 가립니다. 여러라인 개수 안내만 유지. */
    if (S.multi && gDrag.keys.length > 1) showHud(`${gDrag.keys.length}${t("sel_count")}`);
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
  if (pts.size === 0) S.dragOn = false;   /* 손을 떼면 다시 선명 (v1.54.0) */
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
  const guideKey = gMode === "line" && gDrag && gDrag.moved ? gDrag.key : null;
  if (pts.size < 2) { gMode = pts.size === 1 ? null : null; gDrag = null; }
  if (pts.size === 0) {
    commitEdit();   /* 손을 다 떼면 한 작업으로 확정 */
    if (guideKey) guideAdvance(guideKey);
  }
}

/* ═══ 지시등 블링킹 (v1.55.0 · 원장님 지시 2026-08-22) ═══════════════════
   「느린 블링킹 한 번, 4초에 한 번씩 다음 움직임 전까지 계속 반복.
     블링킹은 고유색으로 밝았다 조금 투명해진다」
   → **CSS 가 돌린다**: `#guides line.blink { animation: pbBlink 4s ... infinite }` (index.html).
     JS 타이머로 매 프레임 render() 하던 v1.54.0 방식은 드래그 중 화면을 잡아먹습니다.
     강조된 선에 `blink` 클래스만 붙이면 되고, 잡는 순간 클래스가 빠져 깜빡임이 멎습니다. */

/* 가이드: 이 선의 움직임이 끝났다 → **그 선의 다음** 순서가 켜진다.
   마지막(꼬리) 뒤로는 처음으로 돌아가지 않는다 — 플로우 종료 (원장님 지시 2026-08-21) */
function guideAdvance(key) {
  if (!S.guideOn) return;
  /* 꼬리 스텝에서 아우터를 움직였어도 **그 스텝을 끝낸 것**으로 친다 (v1.64.0) */
  {
    const pr = pairOfStep(S.guideCur);
    if (pr && key === pr.lr) key = pr.step;
  }
  const i = GUIDE_FLOW.indexOf(key);
  if (i < 0) return;                                   // 플로우 밖의 선은 순서에 영향 없음
  const next = i + 1 < GUIDE_FLOW.length ? GUIDE_FLOW[i + 1] : null;
  S.guideCur = next;
  /* v1.49.0 — 다음 차례로 **선택도 함께 옮긴다**. 두 가지가 한 번에 해결된다:
       ① 방금 쓴 선이 선택으로 남아 같이 밝아지는 문제가 사라진다 (밝은 선 = 항상 하나)
       ② 조절 바가 곧바로 다음 선을 잡아, 레일에서 다시 고를 필요가 없다 (시술 중 손이 덜 간다) */
  if (next) noteSel(next);
  render();
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
  /* ⚠️ v1.49.0 — 가이드 중에는 **밝은 선이 언제나 하나**여야 한다 (원장님 지시 2026-08-22):
     「오직 하나의 플로우에 하나의 색만 밝고 짙어진다」.
     v1.47.0 이 강조 조건에 `isSelected` 를 OR 로 더하면서, 다음 차례로 넘어가도 **방금 쓴 선이
     선택으로 남아 둘이 함께 밝은** 상태가 됐다(실제로 확인함). 사용자가 고른 선이 곧 지금
     차례가 되게 해서 둘을 항상 붙여 둔다. 플로우 밖 선(센터·V피봇 등)을 고르면 추천을
     잠시 내리고(null), 플로우 안 선을 다시 고르면 **그 선부터 재개**한다.
     ⚠️ 이 두 줄을 지우면 밝은 선이 두 개가 되는 문제가 그대로 돌아옵니다. */
  if (S.guideOn) S.guideCur = GUIDE_FLOW.includes(key) ? key : null;
  /* v1.64.0 — 꼬리 스텝은 **꼬리+아우터 동시**: 위아래 바=꼬리, 좌우 바=아우터
     v1.67.0 — 아치 스텝도 같은 방식: 위아래 바=아치, 좌우 바=아치선 */
  if (S.guideOn) { const pr = pairOfStep(S.guideCur); if (pr) S.selLR = pr.lr; }
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
    /* v1.56.0 — 설정에서 색을 바꾸면 **레일 띠도 같이 바뀐다** (선 색 = 띠 색 · BASELINE 1-20) */
    b.style.setProperty("--dot", groupColor(spec.key) || spec.dot || spec.color);
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
  $("btnGuide").classList.toggle("on", !!S.guideOn);
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
  else if (k === ARCH_PAIR.step) {
    /* v1.67.0 — 바·화살표로 아치를 올리면 **아치두께도 같은 만큼** 따라온다.
       손으로 끄는 사선과 같은 규칙이어야 합니다 (한쪽만 고치면 두께가 어긋납니다). */
    const nv = c.invert ? 1 - v : v, d = nv - S.g[k];
    setLine(k, nv);
    setLine(ARCH_PAIR.thick, S.g[ARCH_PAIR.thick] + d);
  } else setLine(k, c.invert ? 1 - v : v);
  render();
}

/* ── 사진 보정 패널 ── */
function photoConfig() {
  const p = S.p, lim = panLimit();
  switch (S.photoMode) {
    /* ⚠️ v1.65.0 — 화살표 한 번의 이동량 (원장님 지시 2026-08-23)
       v1.64.0 「이동이 매우 큼 — 아주 미세하게」 → v1.65.0 「좌우·위아래 더 예민하게」
         줌       0.03  → 0.004   (≈1.5%/회)
         위아래·좌우 0.012 → 0.0012  (**≈1px/회** — 손끝 한 픽셀 단위 마무리)
       바를 끌면 여전히 크게 움직입니다 — 화살표는 **마무리 미세조정** 전용입니다.
       ⛔ 다시 키우지 마세요 — 시술 중 한 번 눌러 튀면 처음부터 다시 맞춰야 합니다.

       ⚠️ v1.65.0 **위아래 모드의 방향** (원장님 지시): 「오른쪽 화살표가 아래로 움직이는데
       위로 올라가도록」 → 위아래 모드는 **▶ = 사진이 위로**, ◀ = 아래로. 부호를 뒤집어 둡니다.
       바를 끄는 방향도 같이 뒤집혀 오른쪽 = 위 로 일치합니다.
       ⛔ 부호를 되돌리지 마세요 — 원장님 손이 그렇게 기억합니다. */
    case "zoom":
      return { name: t("editor_zoom"), v: Math.log(p.zoom / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN), disp: p.zoom.toFixed(2) + "×", step: 0.004 };
    case "vertical":
      return { name: t("editor_vertical"), v: clamp(-p.oy / (2 * lim) + 0.5, 0, 1), disp: Math.round(p.oy * 100), step: 0.0012 };
    case "horizontal":
      return { name: t("editor_horizontal"), v: clamp(p.ox / (2 * lim) + 0.5, 0, 1), disp: Math.round(p.ox * 100), step: 0.0012 };
    case "balance":
      return { name: t("editor_balance"), v: p.rot / (2 * ROT_MAX) + 0.5, disp: p.rot.toFixed(1) + "°", step: 0.008 };
  }
}

function applyPhoto(v) {
  v = clamp(v, 0, 1);
  const p = S.p, lim = panLimit();
  if (S.photoMode === "zoom") p.zoom = ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, v);
  else if (S.photoMode === "vertical") p.oy = -(v - 0.5) * 2 * lim;   /* ▶ = 위로 (v1.65.0) */
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

/* ⚠️ v1.51.0 — **내장 프리셋(자연·강한·아치형)을 없앴습니다** (원장님 지시 2026-08-22:
   「프리셋 유지, 내부에 기본사항 제공 제거. 오로지 사용자의 프리셋 저장만 사용하자」).
   이유: 드로잉 맞춤이 고객마다 실제 잉크를 읽으므로, 「일자·아치」 같은 고정 비율은
   근사치일 뿐이고 원장님 작업 흐름(BASELINE 1-19)에 등장하지 않습니다.
   ⛔ 되살리지 마세요. 프리셋 기능 자체(저장·로드·즐겨찾기·내보내기)는 그대로 둡니다. */

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
  alignCenterDock();   /* 즐겨찾기로 왼쪽 도크 폭이 바뀌면 가운데 도크를 다시 맞춘다 (v1.58.0) */
}

function userPresets() {
  try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; }
}
function writeUserPresets(list) {
  localStorage.setItem(PKEY, JSON.stringify(list));
}
function allPresets() { return userPresets(); }   /* v1.51.0 — 사용자가 저장한 것만 */

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
    const load = document.createElement("button");
    load.className = "pri"; load.textContent = t("editor_load");
    load.onclick = () => { applyPreset(p); closeMask("mLoad"); };
    row.appendChild(load);
    {
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

/* 눈썹 꼬리 랜드마크 (위 70/300 · 아래 46/276) — browTail 의 안전망·상한선 기준.
   ⚠️ 아우터를 외안각(눈꼬리 33/263)에서 재면 안 됩니다 — 눈썹 꼬리는 눈꼬리보다
   훨씬 바깥입니다 (v1.34.0 의 실패, 원장님 지적 2026-08-21). */
const BROW_TAIL_L = [70, 46], BROW_TAIL_R = [300, 276];

/* ═══ 꼬리(아우터) 위치 — 2단계 규칙 (v1.41.0 · 원장님 지시 2026-08-21) ═══════
   「1. 사진에 보이는 꼬리에 선을 올린다. 2. 보이지 않을경우 얇은 눈썹은 드로잉이라고
    처리하지 않는다. 얼굴의 기본 꼬리위치를 계산하여 …눈꼬리의 평균 지점에 위치한다」

   ① **보이는 꼬리** — 강한 대비(DRAW_CONTRAST)로만 잉크를 찾는다. 그려졌거나 또렷한
      꼬리는 통과하고, 옅은 잔털·관자놀이 솜털은 못 넘는다. 충분한 표본(TAIL_VIS_MIN)이
      나와야 "보인다"로 인정 → 그 잉크의 끝에 아우터를 세운다.
   ② **안 보이면** — 얼굴 표준 위치: **콧볼–외안각 연장선이 꼬리 높이(h3)와 만나는 점.**
      얇은 눈썹을 억지로 읽지 않는다.
   ⚠️ ①을 약한 대비(SOFT)로 바꾸지 마세요 — v1.35~v1.39 에서 네 번 실패했습니다:
   옅은 잔털이 눈썹과 끊김 없이 이어져 있어 약한 대비로는 끝을 정할 수 없습니다.
   기준쪽만 잽니다 (데칼코마니 · 1-19). 랜드마크 꼬리점 대비 0.8~1.5배 제한. */
const NOSE_ALA = [64, 294];   // 콧볼(코 날개) 좌/우 랜드마크
const TAIL_VIS_MIN = 6;       // 강한 대비 표본이 이만큼은 나와야 "보이는 꼬리"
const TAIL_TIP_INK = 0.30;    // 최고 잉크의 이만큼 + 2열 연속이어야 끝으로 인정

function browTail(lm, tr, v1frac) {
  const { W, H } = S.dim;
  const pt = (i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, tr);
  const xOf = (i) => pt(i).x / W;
  const all = [...BROW_TAIL_L, ...BROW_TAIL_R];
  const refXs = all.map(xOf).filter((x) => (refIsLeft() ? x < v1frac : x > v1frac));
  const lmHalf = refXs.length ? Math.max(...refXs.map((x) => Math.abs(x - v1frac)))
                              : Math.max(...all.map((i) => Math.abs(xOf(i) - v1frac)));

  /* ① 보이는 꼬리 — 강한 대비 잉크의 끝 */
  const img = photoPixels();
  const boxes = img && browBoxes();
  if (boxes) {
    const b = refIsLeft() ? boxes.left : boxes.right, dir = refIsLeft() ? -1 : 1;
    const bh = Math.max(12, b.h ? b.h : (b.y1 - b.y0) / 4);
    let got = null, gap = 0, cy = b.cy, inkRef = 0, prevSolid = false, solids = 0;
    for (let f = lmHalf * 0.70; f <= lmHalf * 1.5; f += 0.006) {
      const x = Math.round((v1frac + dir * f) * W);
      if (x < 0 || x >= W) break;
      const y0 = Math.max(0, Math.round((cy === null ? (b.y0 + b.y1) / 2 : cy) - bh));
      const y1 = Math.min(H - 1, Math.round((cy === null ? (b.y0 + b.y1) / 2 : cy) + bh));
      if (y1 - y0 < 8) break;
      const c = columnRuns(img, x, y0, y1, cy, DRAW_CONTRAST);   // ⚠️ 강한 대비 — SOFT 금지
      const r = c && c.runs[c.si];
      const mid = r ? (r.top + r.bot) / 2 : null;
      if (r && (cy === null || Math.abs(mid - cy) <= bh * 0.6)) {
        inkRef = Math.max(inkRef, r.ink);
        const solid = r.ink >= inkRef * TAIL_TIP_INK && r.bot - r.top >= 2;
        if (solid) { solids++; if (prevSolid) got = f; }
        prevSolid = solid;
        cy = mid; gap = 0;
      } else { prevSolid = false; if (f > lmHalf * 0.9 && ++gap > 5) break; }
    }
    if (got !== null && solids >= TAIL_VIS_MIN)
      return { half: clamp(got, lmHalf * 0.8, lmHalf * 1.5), tipY: null };
  }

  /* ② 얼굴 표준 위치 — 콧볼–외안각 연장선 ∩ 꼬리 높이 */
  let half = lmHalf;
  const alaL = pt(NOSE_ALA[0]), alaR = pt(NOSE_ALA[1]);
  const ala = (refIsLeft() ? (alaL.x <= alaR.x ? alaL : alaR) : (alaL.x <= alaR.x ? alaR : alaL));
  const c2 = eyeCorners(lm);
  const oc = refIsLeft() ? c2.outerL : c2.outerR;
  const occ = imgToCanvas(oc.x, oc.y, tr);
  const tailY = refOfPair(lm, tr, AI_LM.h3, v1frac).y;
  const dy = occ.y - ala.y;
  if (Math.abs(dy) > 4) {
    const t = (tailY - ala.y) / dy;
    const tipX = ala.x + (occ.x - ala.x) * t;
    if (isFinite(tipX)) half = clamp(Math.abs(tipX / W - v1frac), lmHalf * 0.8, lmHalf * 1.5);
  }
  /* 0~1 로 자르지 않는다 — fitBrowsInFrame 이 화면 밖 여부를 봐야 한다 */
  return { half, tipY: null };
}

/* 예전 이름 호환 — 반폭만 필요할 때 */
function browTailHalf(lm, tr, v1frac) { return browTail(lm, tr, v1frac).half; }

/* 지금 화면 변환(S.p) 기준으로 그 선이 있어야 할 값(0~1). 랜드마크가 없으면 null. */
/* ═══ 데칼코마니 원칙 (v1.38.0 — 원장님 설명 2026-08-21) ══════════════════
   이 앱은 **한쪽(기준쪽) 드로잉/눈썹에만 정확히** 선을 맞추고, 센터 대칭으로 반대쪽에
   기준이 저절로 생기게 하는 도구입니다. 반대쪽의 오차는 평균으로 나누는 것이 아니라
   **원장님이 갭을 보고 교정**합니다.
   「선들의 기준점은 오른쪽왼쪽 드로잉의 평균 밸런스가 아닌 단 한쪽에만 정확히 선을
   맞추고 반대쪽의 밸런스만 교정하는 방식이다」
   ⚠️ 좌·우 평균으로 되돌리지 마세요 — v1.37.0 까지 그랬고, 기준쪽조차 어긋난 채
   양쪽이 반씩 뜨는 배치가 나왔습니다. 회귀 70·97 이 기준쪽 정확 일치를 검사합니다.
   센터(v1)·눈(h1)만 양쪽에서 잡습니다 — 대칭 축 자체이기 때문입니다. */
function refIsLeft() { return S.refSide !== "R"; }

/* 랜드마크 쌍 [i, j] 중 **기준쪽**(센터에서 화면 왼/오른쪽)에 있는 점의 캔버스 좌표 */
function refOfPair(lm, tr, pair, v1frac) {
  const { W } = S.dim;
  const p0 = imgToCanvas(lm[pair[0]].x * S.iw, lm[pair[0]].y * S.ih, tr);
  const p1 = imgToCanvas(lm[pair[1]].x * S.iw, lm[pair[1]].y * S.ih, tr);
  const left = p0.x <= p1.x ? p0 : p1, right = p0.x <= p1.x ? p1 : p0;
  return refIsLeft() ? left : right;
}

function aiValueFor(key) {
  const lm = S.landmarks;
  if (!lm || !S.dim.H) return null;
  const { W, H } = S.dim, tr = S.p;

  if (key === "h1") {
    const a = lmAvg(lm, IRIS_L), b = lmAvg(lm, IRIS_R);
    return clamp(imgToCanvas((a.x + b.x) / 2, (a.y + b.y) / 2, tr).y / H, 0.02, 0.98);
  }
  /* 꼬리 자(h3)의 높이는 **랜드마크 그대로** — 원장님 확인(2026-08-21): 「꼬리 가로선은
     맞다」. 잉크 끝 높이로 바꿨다가 되돌렸습니다. 다시 바꾸지 마세요. */
  /* 가로선 — **기준쪽 눈썹의 높이** (데칼코마니: 반대쪽과 평균하지 않는다) */
  if (AI_LM[key]) return clamp(refOfPair(lm, tr, AI_LM[key], S.g.v1).y / H, 0.02, 0.98);

  if (key === "v1" || key === "v2" || key === "v4" || key === "v6") {
    const c = eyeCorners(lm);
    const inL = imgToCanvas(c.innerL.x, c.innerL.y, tr).x / W;
    const inR = imgToCanvas(c.innerR.x, c.innerR.y, tr).x / W;
    const cx = (inL + inR) / 2;
    if (key === "v1") return clamp(cx, 0.02, 0.98);
    /* 세로선도 **기준쪽 실측** — 대칭은 setLine 거울상이 만든다 (1-2) */
    const half = key === "v2"
      ? Math.abs((refIsLeft() ? inL : inR) - cx)
      : key === "v4" ? browTailHalf(lm, tr, S.g.v1)
      : Math.abs(refOfPair(lm, tr, AI_LM.h2, S.g.v1).x / W - cx);
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

  /* 라인 자동 배치 — **기준쪽 실측만** 쓴다 (데칼코마니 · placeLines 의 주석 참고) */
  placeLines(lm);

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
  /* **랜드마크 꼬리와 아우터 선(연장선 끝) 둘 다** 들어와야 한다 (v1.40.0).
     연장선 끝은 랜드마크보다 바깥일 수 있고, g.v4 는 0~1 로 잘려 있어 진짜 위치를
     못 보므로 반폭을 다시 계산해서 잰다. */
  /* ⚠️ **수렴할 때까지 반복**한다 (v1.41.0) — 꼬리 잉크가 화면 밖까지 이어지면
     측정 자체가 화면 끝에서 잘려, 한 번의 축소로는 부족합니다 (실제로 겪음). */
  for (let pass = 0; pass < 4; pass++) {
    const g = S.g;
    const lmXs = [70, 300].map((i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W);
    const half = browTailHalf(lm, S.p, g.v1);
    const lo = Math.min(...lmXs, g.v1 - half), hi = Math.max(...lmXs, g.v1 + half);
    const left = FRAME_PAD * WRn, right = WRn - FRAME_PAD * WRn;
    const c = g.v1;
    const need = Math.max((c - lo) / Math.max(c - left, 1e-6), (hi - c) / Math.max(right - c, 1e-6));
    if (need <= 1.001) return;                     // 들어옴
    const zoom = clamp(S.p.zoom / need, ZOOM_MIN, ZOOM_MAX);
    if (Math.abs(zoom - S.p.zoom) < 1e-4) return;
    S.p.zoom = zoom;
    autoAlignRelayout(lm);
  }
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
  placeLines(lm);
}

/* **지금 화면 변환(S.p)은 그대로 두고** 선만 랜드마크 위치로 올린다 (v1.37.0).
   사진잠금 상태의 초기화가 씁니다 — 원장님 지시(2026-08-21): 「초기화 버튼은 사진이
   잠금이 되어있을경우 잠금이된 사진을 제외하고 나머지를 초기화해라」 */
function placeLines(lm) {
  const { W, H } = S.dim;
  const g = S.g, c = eyeCorners(lm), cv = (x, y) => imgToCanvas(x, y, S.p);
  const a = lmAvg(lm, IRIS_L), b = lmAvg(lm, IRIS_R);
  /* 센터·눈만 양쪽에서 — 대칭 축 자체이므로. 나머지는 전부 **기준쪽 실측** (데칼코마니) */
  const inLc = cv(c.innerL.x, c.innerL.y), inRc = cv(c.innerR.x, c.innerR.y);
  g.v1 = clamp((inLc.x + inRc.x) / 2 / W, 0.02, 0.98);
  g.h1 = clamp(cv((a.x + b.x) / 2, (a.y + b.y) / 2).y / H, 0.02, 0.98);
  const halfIn = Math.abs((refIsLeft() ? inLc : inRc).x / W - g.v1);
  g.v2 = clamp(g.v1 - halfIn, 0.02, 0.98);  g.v3 = 2 * g.v1 - g.v2;
  const halfOut = browTailHalf(lm, S.p, g.v1);   /* 기준쪽 눈썹 꼬리 (v1.35.0/v1.38.0) */
  g.v4 = clamp(g.v1 - halfOut, 0.02, 0.98); g.v5 = 2 * g.v1 - g.v4;

  /* 아치선·가로선 — aiValueFor 가 기준쪽 랜드마크를 쓴다 (v1.38.0) */
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
    /* ⚠️ 여기서 autoFromDrawing() 을 **자동으로 부르지 마세요** (v1.34.0).
       v1.30.0~v1.33.0 은 사진을 넣자마자 드로잉 판독까지 돌렸는데, 실제 고객 사진에서
       판독이 어긋나면 선이 엉뚱하게 벌어진 채 시작됐습니다. 원장님 판정(2026-08-21):
       「초기화 눌렀을때 올라온 선들이 맞다. 이것을 내가 사진을 입력하는 순간부터
       적용하고싶다」 — 즉 시작 배치는 **초기화와 동일한 랜드마크 배치**입니다.
       드로잉 판독은 `드로잉 맞춤` 버튼을 눌렀을 때만 돕니다. */
    setAI(t("ai_ok"), "ok");
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
const DRAW_SIDE_SWITCH = 1.5;   // 반대쪽 잉크가 기준쪽의 이만큼을 넘어야 자동 전환 (v1.37.0)

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
      /* v1.66.0 — **랜드마크 원본 범위**(여유 없음). 머리카락·그림자를 걸러내는 자입니다.
         읽어낸 판독이 이 범위에서 크게 벗어나면 눈썹이 아닌 것을 읽은 것입니다. */
      lx0: Math.min(...xs), lx1: Math.max(...xs), wd,
    };
  };
  const a = box(BROW_UP_A, BROW_LO_A), b = box(BROW_UP_B, BROW_LO_B);
  return a.x0 <= b.x0 ? { left: a, right: b } : { left: b, right: a };
}

/* ⚠️ v1.66.0 — 랜드마크가 없을 때의 탐색 상자 (원장님 지시 2026-08-23)
   예전엔 **기준 쪽 화면 절반을 통째로** 훑었습니다. 그래서 얼굴 인식이 실패한 사진에서
   화면 가장자리의 **머리카락**이 그대로 눈썹 잉크가 되어, 아우터·아치선이 관자놀이 밖으로
   밀리고 꼬리 자가 이마로 올라갔습니다.
   이제 **지금 선이 있는 자리**를 사전 정보로 씁니다 — 이너~아우터 사이 ±22%, 위아래는
   아치~앞두께 밴드의 앞뒤로 한 배쯤. 눈 기준선 위로는 넘어가지 않습니다.
   ⛔ 다시 화면 절반으로 되돌리지 마세요. 머리카락이 들어온 사진에서 그대로 재발합니다. */
function fallbackBox(side) {
  const { W, H } = S.dim, g = S.g;
  const cx = g.v1 * W, wr = workRight() * W;
  const inner = Math.abs(g.v2 - g.v1) * W;      // 센터 → 이너
  const outer = Math.abs(g.v4 - g.v1) * W;      // 센터 → 아우터
  const wd = Math.max(outer - inner, 20);
  /* 안쪽(코 쪽)은 넉넉히 — 앞머리 위치는 사람마다 크게 다릅니다.
     바깥(관자놀이)은 좁게 — 그쪽에 머리카락이 있습니다. */
  const padIn = 0.55 * wd, padOut = 0.30 * wd;
  const yTop = Math.min(g.h2, g.front) * H;
  const yBot = Math.max(g.frontThickness, g.archThickness) * H;
  const h = Math.max(yBot - yTop, 10);
  const y0 = Math.max(0, yTop - 1.3 * h);
  const y1 = Math.max(y0 + 8, Math.min(g.h1 * H - 0.20 * h, yBot + 1.7 * h));
  const Lx0 = cx - outer, Lx1 = cx - inner;
  return side === "L"
    ? { x0: Math.max(0, Lx0 - padOut), x1: Math.min(cx - 4, Lx1 + padIn), y0, y1,
        cy: (yTop + yBot) / 2, h, lx0: Lx0 - padOut * 0.5, lx1: Lx1 + padIn * 0.5, wd }
    : { x0: Math.max(cx + 4, 2 * cx - Lx1 - padIn), x1: Math.min(wr, 2 * cx - Lx0 + padOut), y0, y1,
        cy: (yTop + yBot) / 2, h, lx0: 2 * cx - Lx1 - padIn * 0.5, lx1: 2 * cx - Lx0 + padOut * 0.5, wd };
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
  return keep.map((p, i) => ({ x: p.x, top: m3(i, "top"), bot: m3(i, "bot"), ink: p.ink, edge: p.edge }));
}

/* ⚠️ v1.66.0 — **머리카락·그림자 방어** (원장님 지시 2026-08-23)
   원장님 사진에서 화면 양 끝의 **머리카락**이 눈썹 잉크로 읽혀, 아우터·아치선이 관자놀이
   바깥으로 밀리고 꼬리 자가 이마 위로 올라갔습니다 (스크린샷 픽셀로 확인 — 아치선 280px,
   아우터 100px, 꼬리 340px 벗어남). 원인은 두 가지였습니다:
     ① 탐색 상자 가장자리 열에는 **눈썹이 아예 없어서** 거기서 제일 어두운 것(머리카락·
        눈꺼풀 그림자)이 그대로 표본이 된다
     ② `seq[0]`·`seq[n-1]`(이너·아우터)와 아치 봉우리가 **그 극값 열 하나**로 정해진다
   해결: 판독 뒤 **양 끝을 다듬는다**.
     · 잉크가 중앙값의 `TRIM_INK` 미만인 바깥 열을 끝에서부터 버린다 (눈썹이 없는 열)
     · 랜드마크 눈썹 범위 밖 `TRIM_OUT` 을 넘는 열은 버린다 (머리카락은 늘 이 밖에 있다)
     · 남은 폭이 랜드마크 눈썹의 `TRIM_MIN_SPAN` 미만이면 **판독 실패로 돌린다**
       — 「애매하면 아무것도 보여주지 않는다」(원장님 기준). 틀린 자리에 확신 있게
       선을 놓는 것이 안 놓는 것보다 나쁩니다.
   ⛔ 이 함수를 건너뛰지 마세요. 건너뛰면 머리카락이 들어온 사진에서 그대로 재발합니다. */
const TRIM_INK = 0.38;        // 중앙값 잉크의 이 비율 미만인 바깥 열은 눈썹이 아니다
const TRIM_OUT = 0.14;        // 랜드마크 눈썹 폭의 이 비율까지만 바깥을 허용
const TRIM_MIN_SPAN = 0.5;    // 다듬고 남은 폭이 랜드마크 눈썹의 이 비율 미만이면 실패
const TRIM_GAP = 2.5;         // 열 간격의 이 배를 넘게 벌어지면 다른 덩어리로 본다
const TRIM_PIECE = 0.25;      // 전체 열의 이 비율 미만인 바깥 덩어리는 눈썹이 아니다
function trimOutside(band, b) {
  if (!band || !band.length) return null;
  /* ⓐ 랜드마크 범위 밖 열 버리기 — 머리카락은 언제나 눈썹 바깥에 있다 */
  if (b && b.lx0 !== undefined) {
    const pad = TRIM_OUT * b.wd;
    band = band.filter((p) => p.x >= b.lx0 - pad && p.x <= b.lx1 + pad);
    if (band.length < DRAW_MIN_HITS) return null;
  }
  /* ⓑ 잉크가 옅은 바깥 열을 끝에서부터 버리기 — 눈썹이 없는 열 */
  const inks = band.map((p) => p.ink || 0).slice().sort((x, y) => x - y);
  const med = inks[Math.floor(inks.length / 2)] || 0;
  if (med > 0) {
    let a = 0, z = band.length - 1;
    while (a < z && (band[a].ink || 0) < med * TRIM_INK) a++;
    while (z > a && (band[z].ink || 0) < med * TRIM_INK) z--;
    band = band.slice(a, z + 1);
    if (band.length < DRAW_MIN_HITS) return null;
  }
  /* ⓒ **탐색창 천장에 닿은** 바깥 열을 끝에서부터 버리기 — 머리카락은 세로로 서서 창 위로
     그냥 빠져나갑니다. 잉크·두께로는 못 거릅니다 — 머리카락이 눈썹보다 **더 짙고**, 창에
     걸친 만큼만 보여서 두께도 눈썹과 비슷하게 나옵니다 (원장님 사진: 눈썹 잉크 2039 vs
     머리카락 5160, 두께 11 vs 35). */
  {
    let a = 0, z = band.length - 1;
    while (a < z && band[a].edge) a++;
    while (z > a && band[z].edge) z--;
    band = band.slice(a, z + 1);
    if (band.length < DRAW_MIN_HITS) return null;
  }
  /* ⓓ **끊어진 바깥 조각** 버리기 — 눈썹은 한 덩어리입니다. 열 간격보다 훨씬 크게 벌어져
     떨어져 나온 작은 조각(머리카락 몇 열, 그림자 한 점)은 눈썹이 아닙니다.
     가운데가 끊긴 것은 그대로 둡니다 — 성근 털 사진에서 눈썹 절반을 잃지 않으려는 것. */
  if (band.length > 2) {
    const dxs = [];
    for (let i = 1; i < band.length; i++) dxs.push(band[i].x - band[i - 1].x);
    const step = dxs.slice().sort((x, y) => x - y)[Math.floor(dxs.length / 2)] || 1;
    const cl = [[band[0]]];
    for (let i = 1; i < band.length; i++) {
      if (band[i].x - band[i - 1].x > TRIM_GAP * step) cl.push([]);
      cl[cl.length - 1].push(band[i]);
    }
    if (cl.length > 1) {
      while (cl.length > 1 && cl[0].length < TRIM_PIECE * band.length) cl.shift();
      while (cl.length > 1 && cl[cl.length - 1].length < TRIM_PIECE * band.length) cl.pop();
      band = cl.flat();
      if (band.length < DRAW_MIN_HITS) return null;
    }
  }
  /* ⓔ 남은 폭이 너무 짧으면 판독 실패 — 조용히 실패하는 편이 낫다 */
  if (b && b.wd) {
    const span = band[band.length - 1].x - band[0].x;
    if (span < TRIM_MIN_SPAN * b.wd) return null;
  }
  return band;
}

/* 기준 쪽 눈썹에서 그려진 드로잉을 읽는다. 실패하면 null.
   반환: x 오름차순 [{x, top, bot}] — top/bot 은 캔버스 px */
function readDrawing(img, contrast, side) {
  const { W, H } = S.dim;
  const sd = side || S.refSide;
  const boxes = browBoxes();
  const b = boxes ? (sd === "L" ? boxes.left : boxes.right) : fallbackBox(sd);
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

  let inkSum = 0;
  const pts = cols.map((c) => {
    const r = outline && c.pair ? c.pair : c.runs[c.si];
    inkSum += c.runs[c.si].ink;                    // 이 쪽 드로잉이 얼마나 짙은가 (좌우 비교용)
    /* v1.66.0 — 탐색창 **천장에 닿은** 열 표시. 눈썹 위로는 늘 여유를 두고 창을 잡으므로,
       창 위로 그냥 빠져나가는 것은 눈썹이 아니라 머리카락입니다. `trimOutside` 가 씁니다.
       ⚠️ 바닥은 세지 마세요 — 창 아래는 **눈꺼풀 방어선**이라 눈썹 앞머리가 닿습니다. */
    return { x: c.x, top: r.top, bot: r.bot, ink: c.runs[c.si].ink, edge: r.top <= y0 + 1 };
  });
  pts.sort((p, q) => p.x - q.x);
  let band = keepBand(pts);
  band = trimOutside(band, b);      /* v1.66.0 — 머리카락·그림자 방어 (아래 참고) */
  if (band) { band.refH = b.h; band.ink = inkSum; }   // refH: 두께 상식 검사 · ink: 좌우 비교
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
  /* ⚠️ **두께 상식 검사** (v1.31.2) — 읽어낸 두께가 랜드마크 눈썹 높이와 너무 다르면
     눈꺼풀 주름·머리카락을 잘못 읽은 것입니다. 그 판독은 버립니다. */
  const sane = (cand) => {
    if (!cand || cand.length < DRAW_MIN_HITS) return null;
    if (cand.refH) {
      const th = cand.map((p) => p.bot - p.top).sort((a, b) => a - b)[Math.floor(cand.length / 2)];
      if (th > DRAW_THICK_MAX * cand.refH || th < DRAW_THICK_MIN * cand.refH) return null;
    }
    return cand;
  };
  /* ⚠️ **기준은 원장님이 고른 쪽** (v1.37.0 — 원장님 지시 2026-08-21):
     「왼쪽을 선택한상황에서 드로잉이 오른쪽이 더 짙을경우 오토로 오른쪽에 맞춘다.
     그 이외에 상황을 제외하고 기본에 맞춤한다」
     → 기본은 선택된 기준쪽(S.refSide)의 드로잉에 맞춘다. 반대쪽 잉크가 **확실히**
     (DRAW_SIDE_SWITCH 배 이상) 짙을 때만 반대쪽으로 자동 전환한다.
     문턱을 낮추면 조명 좌우 차이만으로 기준이 뒤집힙니다. */
  let pts = null;
  const other = S.refSide === "L" ? "R" : "L";
  for (const contrast of [DRAW_CONTRAST, DRAW_CONTRAST_SOFT]) {
    const ref = sane(readDrawing(img, contrast, S.refSide));
    const opp = sane(readDrawing(img, contrast, other));
    if (!ref && !opp) continue;
    pts = !ref ? opp : (opp && opp.ink > ref.ink * DRAW_SIDE_SWITCH ? opp : ref);
    break;
  }
  if (!pts) return false;

  /* seq[0] = 안쪽(앞머리) … seq[n−1] = 바깥(꼬리).
     화면 왼쪽 눈썹이면 x 가 큰 쪽이 코 방향(=안쪽)이므로 뒤집는다. */
  const cx = S.g.v1 * W;
  const seq = pts[0].x > cx ? pts : [...pts].reverse();
  const n = seq.length;

  /* 구간 t(0=앞머리 … 1=꼬리) 안 표본들의 **분위수** (v1.37.0).
     ⚠️ 중앙값이 아닙니다 — 앞머리는 털이 성글게 시작해서, 중앙값을 쓰면 윗선은 낮게
     아랫선은 얕게 잡혀 「이보다 더 확실히 보일 수 없는」 드로잉도 빗나갔습니다
     (원장님 지적 2026-08-21). 윗선(top)은 위쪽 30% 지점, 아랫선(bot)은 아래쪽 70%
     지점을 씁니다 — 꽉 찬 드로잉에서는 중앙값과 거의 같고, 성근 털에서는 실제 경계에
     붙습니다. 극값(0%/100%)은 쓰지 마세요 — 점 하나에 끌려갑니다. */
  const at = (a, b, key, frac) => {
    const i0 = clamp(Math.floor(a * (n - 1)), 0, n - 1);
    const i1 = clamp(Math.ceil(b * (n - 1)), 0, n - 1);
    const v = seq.slice(Math.min(i0, i1), Math.max(i0, i1) + 1).map((p) => p[key]).sort((x, y) => x - y);
    if (!v.length) return null;
    const q = frac !== undefined ? frac : 0.5;
    return v[clamp(Math.round(q * (v.length - 1)), 0, v.length - 1)];
  };

  /* 아치 = 드로잉에서 **제일 높은 곳**. 위치를 미리 정하지 않고 사진에서 찾는다.
     ⚠️ v1.66.0 — 예전엔 `top` 최솟값 **열 하나**로 정해서, 머리카락·그림자 한 조각이
     높게 잡히면 아치선이 통째로 그리로 끌려갔습니다 (원장님 사진에서 280px 벗어남).
     이제 ① 이웃 3열 평균으로 **완만하게** 보고 ② 눈썹 양 끝 15% 는 후보에서 뺀다
     (아치는 앞머리나 꼬리 끝에 있을 수 없습니다).
     ⛔ 다시 단일 극값으로 되돌리지 마세요. */
  const smoothTop = (i) => {
    const a = seq[Math.max(0, i - 1)].top, b2 = seq[i].top, c2 = seq[Math.min(n - 1, i + 1)].top;
    return (a + b2 + c2) / 3;
  };
  const lo = Math.max(1, Math.round(n * 0.15)), hi = Math.min(n - 2, Math.round(n * 0.85));
  let pk = lo;
  for (let i = lo; i <= hi; i++) if (smoothTop(i) < smoothTop(pk)) pk = i;
  const win = Math.max(1, Math.round(n * 0.08));
  const pa = clamp(pk - win, 0, n - 1) / (n - 1), pb = clamp(pk + win, 0, n - 1) / (n - 1);

  const setY = (key, py) => { if (py !== null && isFinite(py)) setLine(key, clamp(py / H, 0.02, 0.98)); };
  /* 앞머리 구간만 분위수(위 30% · 아래 70%) — 머리는 털이 성글어 중앙값이 빗나간다.
     아치·꼬리는 표본이 적어 분위수가 오히려 흔들리므로 중앙값 유지 (회귀 89가 잡음) */
  setY("front", at(0, 0.18, "top", 0.3));        // 앞머리   = 머리 쪽 윗선
  setY("frontThickness", at(0, 0.18, "bot", 0.7)); // 앞두께 = 같은 자리 아랫선
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
    /* v1.55.0 — 저장본은 **언제나 선명한 고유색**. 잡고 있던 살구색 테두리가 찍히면 안 됩니다.
       (깜빡임은 CSS 라 직렬화된 SVG 에는 애초에 안 붙습니다.) ⛔ 이 두 줄을 지우지 마세요. */
    S.dragOn = false; render();
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
    /* v1.47.0 원장님 지시 — 「가이드는 앱이 켜지면 항상 시작 상태로 유지, 사용자가 클릭할 때만 꺼짐」
       사진이 올라와 편집이 시작될 때마다 가이드 ON + 이너부터. 끄는 건 가이드 버튼 클릭뿐. */
    S.guideOn = true;
    S.guideCur = GUIDE_FLOW[0];
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
/* ═══════════ 설정 시트 (v1.56.0) ═══════════
   값은 **누르는 즉시** 적용되고 저장됩니다 — 확인 버튼을 찾을 필요가 없게 (시술 중 손을 아끼려고).
   ⛔ 미리보기(`lookPreview`)는 실제 `S.look` 을 그대로 쓰는 그림입니다. 별도 색을 하드코딩하면
      「선택 시 어떤 색상이 화면에 보일지」가 거짓말이 됩니다. */
const SKIN_PREV = "#D7AA8C";      /* 미리보기 왼쪽 = 밝은 피부 */
const BROW_PREV = "#37281F";      /* 미리보기 오른쪽 = 짙은 눈썹/어두운 화면 */

function segBtn(label, on, fn) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = label; if (on) b.classList.add("on");
  b.onclick = fn; return b;
}
function swatchBtn(hex, on, fn) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "sw" + (on ? " on" : "");
  b.style.background = hex; b.title = hex; b.onclick = fn; return b;
}
function lookSet(patch) {
  Object.assign(S.look, patch);
  /* 순환 버튼의 「내 세트」 동기화 (v1.58.0) — 추천 조합과 다른 값을 만들면 그게 내 세트다 */
  if (!LOOK_COMBOS.some((c) => c.v && ["inner", "arch", "tail"].every((k) => c.v[k] === S.look[k])
      && c.v.edge === S.look.edge && c.v.edgeC === S.look.edgeC)) S.lookOwn = { ...S.look };
  saveLook(); buildLookUI(); render(); updateButtons();
  if (typeof cycleLabel === "function") cycleLabel();
}
function buildLookUI() {
  const L = S.look, nm = (p) => (LANG === "ko" ? p.ko : p.en);
  /* ① 조합 3개 — 첫 칸 「현재 세트」는 지금 값 그대로 */
  const combo = $("lookCombo"); combo.innerHTML = "";
  /* 「현재 세트」는 **시트를 연 순간의 값**을 담아 둔다 — 추천을 눌러 보고 되돌아올 자리 */
  const matches = (v) => ["inner", "arch", "tail"].every((k) => v[k] === L[k])
                      && v.edge === L.edge && v.edgeC === L.edgeC;
  const hit = LOOK_COMBOS.some((c) => c.v && matches(c.v));
  LOOK_COMBOS.forEach((c) => {
    const v = c.v || S.lookSnap || L;
    const b = document.createElement("button");
    b.type = "button";
    if (c.v ? matches(c.v) : (!hit && matches(v))) b.classList.add("on");
    b.innerHTML = `<b>${t(c.name)}</b><i>${t(c.desc)}</i><em>`
      + ["inner", "arch", "tail"].map((k) => `<s style="background:${v[k]}"></s>`).join("") + "</em>";
    b.onclick = () => lookSet({ ...v });
    combo.appendChild(b);
  });
  /* ② 묶음별 색상표 */
  [["swInner", "inner"], ["swArch", "arch"], ["swTail", "tail"]].forEach(([id, key]) => {
    const box = $(id); box.innerHTML = "";
    PALETTE.forEach((p) => box.appendChild(swatchBtn(p.hex, L[key] === p.hex, () => lookSet({ [key]: p.hex }))));
  });
  /* v1.57.0 — 잡은 선(드래그)의 심·테두리. v1.59.0 — 테두리에 **없음** 추가 (사선 스와치) */
  [["swDragC", "dragCore", ["#FFFFFF"]], ["swDragE", "dragEdge", [APRICOT, "none"]]].forEach(([id, key, extra]) => {
    const box = $(id); if (!box) return; box.innerHTML = "";
    [...PALETTE.map((p) => p.hex), ...extra].forEach((hex) => {
      const b = swatchBtn(hex === "none" ? "transparent" : hex, L[key] === hex, () => lookSet({ [key]: hex }));
      if (hex === "none") { b.classList.add("none"); b.title = t("set_none"); }
      box.appendChild(b);
    });
  });
  /* ③ 테두리 · 굵기 · 길이 */
  const edge = $("segEdge"); edge.innerHTML = "";
  [[0, t("set_none")], [40, "40%"], [70, "70%"], [100, "100%"]]
    .forEach(([v, lb]) => edge.appendChild(segBtn(lb, L.edge === v, () => lookSet({ edge: v }))));
  const edgeC = $("segEdgeC"); edgeC.innerHTML = "";
  [["auto", t("set_auto")], ["light", t("set_light")], ["dark", t("set_dark")]]
    .forEach(([v, lb]) => edgeC.appendChild(segBtn(lb, L.edgeC === v, () => lookSet({ edgeC: v }))));
  const sw = $("segW"); sw.innerHTML = "";
  [[0.8, t("set_thin")], [1, t("set_mid")], [1.35, t("set_thick")]]
    .forEach(([v, lb]) => sw.appendChild(segBtn(lb, L.weight === v, () => lookSet({ weight: v }))));
  /* v1.68.0 — 「가로 길이」는 **슬라이더**. 3단(짧게·중간·길게)으로는 원장님이 원하시는
     **아주 짧은** 자를 만들 수 없었습니다. 값 = 자 전체 길이 ÷ 눈썹 폭 (%) */
  $("rngLen").value = Math.round(L.hlen * 200);
  $("lenVal").textContent = Math.round(L.hlen * 200) + "%";
  $("rngAlpha").value = Math.round(L.alpha * 100);
  $("alphaVal").textContent = Math.round(L.alpha * 100) + "%";
  /* v1.59.0 — 잡은 선 전용 굵기·투명도 (기본 선과 완전 분리) */
  const sdw = $("segDragW");
  if (sdw) {
    sdw.innerHTML = "";
    [[0.8, t("set_thin")], [1, t("set_mid")], [1.35, t("set_thick")]]
      .forEach(([v, lb]) => sdw.appendChild(segBtn(lb, L.dragW === v, () => lookSet({ dragW: v }))));
    $("rngDragOp").value = Math.round((L.dragOp != null ? L.dragOp : 1) * 100);
    $("dragOpVal").textContent = Math.round((L.dragOp != null ? L.dragOp : 1) * 100) + "%";
  }
  lookPreview();
}
/* 미리보기 자의 반폭(px) — **슬라이더를 끌면 길이가 눈앞에서 줄었다 늘었다** 해야 합니다
   (원장님 지시 2026-08-24). 설정 범위(HLEN_MIN~HLEN_MAX)가 미리보기 폭에 그대로 대응합니다. */
const HLEN_MIN = 0.04, HLEN_MAX = 0.30;
const prevHalf = (L) => clamp(L.hlen / HLEN_MAX, 0.08, 1) * 170;
/* 미리보기 — 왼쪽 밝은 피부 / 오른쪽 어두운 눈썹. 세 묶음 색을 실제 규칙 그대로 그린다 */
function lookPreview() {
  const svgP = $("lookPrev"); if (!svgP) return;
  svgP.innerHTML = "";
  const f = document.createDocumentFragment();
  f.appendChild(mk("rect", { x: 0, y: 0, width: 360, height: 96, fill: SKIN_PREV }));
  f.appendChild(mk("rect", { x: 360, y: 0, width: 360, height: 96, fill: BROW_PREV }));
  const L = S.look;
  [["inner", 18], ["arch", 40], ["tail", 62]].forEach(([k, y]) => {
    const hex = L[k], w = 3.0 * L.weight;
    const put = (x1, x2) => {
      if (L.edge > 0) f.appendChild(mk("line", { x1, y1: y, x2, y2: y, stroke: edgeColorFor(hex),
        "stroke-width": w * (1 + 2 * L.edge / 100), "stroke-opacity": L.alpha * 0.9, "stroke-linecap": "round" }));
      f.appendChild(mk("line", { x1, y1: y, x2, y2: y, stroke: hex,
        "stroke-width": w, "stroke-opacity": L.alpha, "stroke-linecap": "round" }));
    };
    const half = prevHalf(L);
    put(180 - half, 180 + half);
    put(540 - half, 540 + half);
  });
  /* 맨 아래 줄 = **잡은 선** — drawGrab 과 같은 규칙 (v1.59.0: 굵기·투명도·없음 분리) */
  {
    const y = 84, w = 3.0 * (L.dragW || 1), op = L.dragOp != null ? L.dragOp : 1;
    const half = prevHalf(L), e = L.dragEdge || "#FFC9A3";
    const put = (x1, x2) => {
      if (e !== "none") f.appendChild(mk("line", { x1, y1: y, x2, y2: y, stroke: e,
        "stroke-width": w + 4, "stroke-opacity": 0.95 * op, "stroke-linecap": "round" }));
      f.appendChild(mk("line", { x1, y1: y, x2, y2: y, stroke: L.dragCore || "#14161B",
        "stroke-width": w, "stroke-opacity": op, "stroke-linecap": "round" }));
    };
    put(180 - half, 180 + half);
    put(540 - half, 540 + half);
  }
  svgP.appendChild(f);
}
$("btnLook").onclick = () => { S.lookSnap = { ...S.look }; buildLookUI(); $("mLook").classList.add("on"); };

/* ═══ 조합 순환 버튼 (v1.58.0 · 원장님 지시 2026-08-23) ═══════════════════
   「가이드 오른쪽에 선 색변경 버튼 — 클릭 시 다른 추천 조합, 또 클릭 시 다른 조합」
   순서: **내 세트 → 밝은 사진 → 어두운 사진 → 다시 내 세트**.
   ⚠️ 「내 세트」는 순환을 **시작한 순간의 내 설정**입니다 — 한 바퀴 돌면 그대로 돌아오므로
      시술 중 잘못 눌러도 잃는 것이 없습니다. 추천 조합인 채로 설정에서 값을 직접 바꾸면
      그 값이 새 「내 세트」가 됩니다 (lookSet 이 lookOwn 을 갱신).
   ⚠️ 버튼 라벨이 지금 조합 이름을 보여줍니다 — 무엇이 켜져 있는지 화면에서 읽히게. */
function comboMatches(v) {
  return ["inner", "arch", "tail"].every((k) => v[k] === S.look[k])
      && v.edge === S.look.edge && v.edgeC === S.look.edgeC;
}
function currentComboId() {
  for (const c of LOOK_COMBOS) if (c.v && comboMatches(c.v)) return c.id;
  return "mine";
}
function cycleLabel() {
  const id = currentComboId();
  const el = $("lookCycleName"); if (!el) return;
  el.textContent = id === "mine" ? t("set_c_mine")
    : t(LOOK_COMBOS.find((c) => c.id === id).name);
}
$("btnLookCycle").onclick = () => {
  const order = ["mine", "bright", "dark"];
  const cur = currentComboId();
  if (cur === "mine") S.lookOwn = { ...S.look };          /* 내 세트를 기억하고 떠난다 */
  const next = order[(order.indexOf(cur) + 1) % order.length];
  const v = next === "mine" ? (S.lookOwn || { ...LOOK_DEF })
                            : LOOK_COMBOS.find((c) => c.id === next).v;
  Object.assign(S.look, v);
  saveLook(); render(); updateButtons(); cycleLabel();
  showHud(next === "mine" ? t("set_c_mine") : t(LOOK_COMBOS.find((c) => c.id === next).name), 1400);
};
$("lookAll").onclick = () => lookSet({ arch: S.look.inner, tail: S.look.inner });
$("lookReset").onclick = () => lookSet({ ...LOOK_DEF });
/* 조작하다 별로면 **시트를 연 순간의 값**으로 한 번에 복귀 (원장님 지시 2026-08-23) */
$("lookBack").onclick = () => { if (S.lookSnap) { lookSet({ ...S.lookSnap }); showHud(t("set_backed"), 1400); } };
/* v1.68.0 — 가로 길이 슬라이더. 끄는 동안 **미리보기와 실제 화면이 같이** 줄었다 늘어난다 */
$("rngLen").addEventListener("input", (e) => {
  S.look.hlen = clamp(+e.target.value / 200, HLEN_MIN, HLEN_MAX);
  $("lenVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngLen").addEventListener("change", () => { saveLook(); buildLookUI(); });
$("rngAlpha").addEventListener("input", (e) => {
  S.look.alpha = +e.target.value / 100;
  $("alphaVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngAlpha").addEventListener("change", () => { saveLook(); buildLookUI(); });
$("rngDragOp").addEventListener("input", (e) => {
  S.look.dragOp = +e.target.value / 100;
  $("dragOpVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngDragOp").addEventListener("change", () => { saveLook(); buildLookUI(); });
/* 탭 — 기본 선 / 잡은 선 (v1.59.0) */
function lookTab(which) {
  $("tabBase").classList.toggle("on", which === "base");
  $("tabGrab").classList.toggle("on", which === "grab");
  $("lookTabBase").hidden = which !== "base";
  $("lookTabGrab").hidden = which !== "grab";
}
$("tabBase").onclick = () => lookTab("base");
$("tabGrab").onclick = () => lookTab("grab");
document.querySelectorAll("[data-closesheet]").forEach((b) =>
  b.addEventListener("click", () => { $(b.dataset.closesheet).classList.remove("on"); toast(t("set_saved")); }));
$("mLook").addEventListener("click", (e) => { if (e.target.id === "mLook") $("mLook").classList.remove("on"); });

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
  /* v1.56.0 — 편집 화면 한/영 칩은 제거됐다(언어는 사진 선택 화면에서 고른다) */
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
  if (typeof cycleLabel === "function") cycleLabel();   /* 순환 버튼 라벨 = 지금 조합 이름 (v1.58.0) */
}
function setLang(l) {
  LANG = l;
  localStorage.setItem("pb_lang", l);
  applyI18n();
}

/* ═══════════ 이벤트 배선 ═══════════ */
$("langKo").onclick = () => setLang("ko");
$("langEn").onclick = () => setLang("en");

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
    /* 원장님 지시(2026-08-21): 사진잠금 중이면 **사진(위치·배율·회전·잠금)은 그대로** 두고
       나머지만 초기화한다. 잠금이 없으면 사진까지 함께 초기화한다. */
    const keepPhoto = S.locked;
    S.g = { ...DEFAULT_GUIDE };
    if (!keepPhoto) S.p = { ...DEFAULT_PHOTO };
    S.activePreset = null;
    S.balOn = false; S.balance = null;
    S.hiddenSnapshot = null;
    S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line"; S.multi = false; S.selSet = [];
    S.pickMode = false;
    S.pick = [];
    if (S.landmarks) { if (keepPhoto) placeLines(S.landmarks); else autoAlign(S.landmarks); }
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
/* 가이드 켜고 끄기 — 끄면 플로우 즉시 종료. 켠 직후엔 아무 선도 켜지 않는다:
   **처음 움직이는 선**이 플로우의 시작이다 (원장님 지시 2026-08-21) */
$("btnGuide").onclick = () => {
  S.guideOn = !S.guideOn;
  /* 켜는 순간 **이너부터** 굵게 시작한다 (v1.44.0 원장님 지시 2026-08-21 —
     「시작 시 가이드 켜진 상태로 시작, 시작의 이너가 먼저 굵은 표시로」).
     끄면 즉시 종료. */
  S.guideCur = S.guideOn ? GUIDE_FLOW[0] : null;
  updateButtons();
  render();
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
posSliderV.addEventListener("input", (e) => { beginEdit(); noteSel(S.selUD);
  S.dragOn = true;                                                 /* v1.55.0 */
  if (S.guideOn && GUIDE_FLOW.includes(S.selUD)) S.guideCur = S.selUD;
  applyPos(parseFloat(e.target.value), S.selUD); });
posSliderV.addEventListener("change", () => { S.dragOn = false; guideAdvance(S.selUD); });
$("posMinusV").onclick = () => step(() => { noteSel(S.selUD); applyPos(parseFloat(posSliderV.value) - posConfig(S.selUD).step, S.selUD); });
$("posPlusV").onclick  = () => step(() => { noteSel(S.selUD); applyPos(parseFloat(posSliderV.value) + posConfig(S.selUD).step, S.selUD); });

/* 가로 조절자 — 세로선 좌우 이동 + 사진 보정 겸용 (v1.11.0) */
posSliderH.addEventListener("input", (e) => { beginEdit(); if (!hIsPhoto()) noteSel(S.selLR);
  if (!hIsPhoto()) { S.dragOn = true; }                            /* v1.55.0 */
  if (!hIsPhoto() && S.guideOn && GUIDE_FLOW.includes(S.selLR)) S.guideCur = S.selLR;
  applyH(parseFloat(e.target.value)); });
posSliderH.addEventListener("change", () => { S.dragOn = false; if (!hIsPhoto()) guideAdvance(S.selLR); });
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

/* ⚠️ v1.51.0 — 사진저장·사진잠금·사진변경 묶음을 **센터 세로선(v1)에 맞춘다**
   (원장님 지시 2026-08-22: 「사진잠금이 센터 라인과 동일 선상에 있도록」).
   v1.50.0 까지는 `left:50%` 로 **캔버스 정중앙**이었습니다. 얼굴 중심축은 화면 중앙과
   다르므로(자동 정렬은 작업 영역 한가운데에 맞춥니다) 잠금이 센터선에서 늘 어긋나 보였습니다.
   ⚠️ 왼쪽 도크(프리셋)·아래 도크와 겹치지 않게 **클램프**합니다 — 겹치면 버튼이 눌리지 않습니다. */
function alignCenterDock() {
  const cd = $("centerDock"), lk = $("btnLock");
  if (!cd || !lk || !cd.offsetWidth || !S.dim.W) return;
  const lockMid = lk.offsetLeft + lk.offsetWidth / 2;     // 도크 안에서 잠금 버튼의 중심
  let x = S.g.v1 * S.dim.W - lockMid;                     // 잠금 중심이 센터선에 오도록
  const ld = $("leftDock"), bd = $("bottomDock");
  const loLimit = ld ? ld.offsetLeft + ld.offsetWidth + 10 : 0;
  const hiLimit = (bd ? bd.offsetLeft - 10 : S.dim.W) - cd.offsetWidth;
  x = clamp(x, Math.min(loLimit, Math.max(hiLimit, 0)), Math.max(hiLimit, 0));
  cd.style.left = "0px";
  cd.style.transform = `translateX(${Math.round(x)}px)`;
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
{ const el = document.getElementById("verTag"); if (el) el.textContent = "Perfect Brow " + APP_VERSION; }

window.PB = { S, DEFAULT_GUIDE, V_ANGLE_MAX, H_SPECS, V_SPECS,
  LINE_COLORS: { eye: "#3A3F4A", arch: "#2E8BFF", tail: "#A855F7", inner: "#5EEAD4", innerDim: "#C9D1D6", neutral: "#14161B" },
  render, runFaceAI, loadPhoto, alignFromPupils, autoAlign, aiValueFor, imgToCanvas,
  faceFrame, applyPreset, segPx, fitPresetToFace, runBalance, photoPixels, buildFavBar, favIds, balTolPx,
  autoFromDrawing, readDrawing, browBoxes, columnRuns, outlinePair,
  applyLayout, openPicker, endPicking, setLang,
  PALETTE, LOOK_DEF, LOOK_COMBOS, loadLook, saveLook, buildLookUI, edgeColorFor, relLum,
  GUIDE_FLOW, TAIL_PAIR, ARCH_PAIR, updateGuideTip, trimOutside, browBoxes };
