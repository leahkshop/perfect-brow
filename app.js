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
    set_dragc: "심 색", set_drage: "테두리 색", set_back: "이전 설정으로",
    set_cycle: "선 색", set_c_mine: "내 세트",
    /* v1.64.0 가이드 스텝 프롬프트 — 지금 무엇을 맞추는지 한 줄로 */
    /* ⚠️ v1.69.0 — 「드로잉 맞춤시 맞아지는 라인은 오직 앞두께·아치만. 나머지 교정 프롬프트
       다시 써라」(원장님 지시 2026-08-24). 자동으로 맞는 두 줄은 **확인**, 나머지는 **손으로 교정**.
       ⛔ 한 줄을 넘기지 마세요 — 시술 화면을 가립니다. */
    /* ⚠️ v1.81.0 — 번호(①②③…)는 **문구에 박지 않습니다.** 순서를 원장님이 바꾸실 수 있으므로
       updateGuideTip 이 지금 순서에서 매번 붙입니다. ⛔ 번호를 다시 문구에 넣지 마세요. */
    tip_v2: "이너 — 드로잉 앞부분에 맞추세요 (좌우 바)",
    tip_front: "앞머리 — 눈썹 앞부분 <b>아랫선</b>에 얹으세요 (위아래 바)",
    tip_frontThickness: "앞두께 — 앞부분 <b>윗선</b>에 맞추세요 (위아래 바)",
    tip_h2: "아치엣지 — 산꼭대기 <b>윗선</b>에 얹으세요 (위아래 바)",
    tip_archThickness: "아치두께 — 산 <b>아랫선</b>에 얹으세요 (위아래 바)",
    tip_v4: "꼬리 아우터 — <b>십자 안쪽 위 모서리</b>를 꼬리 끝에 맞추세요 (좌우 바)",
    tip_h3: "꼬리 높이 — 꼬리 끝 <b>아랫선</b>에 얹으세요 (위아래 바)",
    set_tab_base: "기본 선 · 차례", set_tab_grab: "잡은 선 · 놓은 선",
    set_grab_note: "잡은 선 = 선을 손가락이나 조절 바로 움직이는 동안의 모습입니다. 손을 떼면 기본 선으로 돌아갑니다.",
    /* v1.95.0 — 놓은 선 · 서브 라인 (원장님 지시 2026-08-29) */
    set_dline_hd: "놓은 선 — 체크를 마친 선", set_color: "색상", set_sub: "서브 라인",
    set_dline_note: "놓은 선 = 체크를 마무리하고 놓아 둔 선 — 전체 그림을 볼 때의 모습입니다.",
    set_backed: "이전 설정으로 되돌렸습니다", set_inner: "이너 묶음", set_arch: "아치 묶음", set_tail: "꼬리 묶음",
    line_hidden: "숨김 — 다시 누르면 나옵니다",
    editor_tip: "안내", ai_name: "눈썹정렬",
    ai_auto_on: "AI 눈썹정렬 적용됨 — 되돌리기를 누르면 기본정렬로",
    /* v3.3.0 — 판독 실패를 조용히 넘기지 않는다 */
    ai_arch_fail: "사진에서 눈썹을 못 읽었습니다 — 선은 기본정렬 그대로입니다",
    line_step_keep: "지금 차례라 숨기지 않습니다",
    set_all: "모두 이 색", set_edge: "테두리", set_weight: "선 굵기", set_hlen: "가로 길이",
    set_edge_hd: "테두리 — 없어도 되는 덤",
    set_alpha: "투명도", set_reset: "기본으로", set_done: "완료",
    set_vlines: "세로선",
    set_prev_note: "왼쪽 = 밝은 피부 · 오른쪽 = 어두운 피부. 선 이름이 그 선이 눈썹에서 놓이는 자리에 붙어 있습니다.",
    set_order: "가이드 순서", set_order_note: "▲▼ 로 순서를 바꾸고, 이름을 눌러 그 단계를 켜고 끕니다.",
    set_none: "없음", set_auto: "자동", set_light: "흰색", set_black: "검정", set_dark: "먹색",
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
    editor_exposure: "EXPOSURE",
    editor_brightness: "밝기",
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
    ai_drawn: "그린 선에 맞춰 배치했습니다 — 가이드 ①~⑥ 으로 확인하세요",
    ai_redraw: "AI 눈썹 맞춤",
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
    editor_balance_check: "미러링",
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
    bal_off: "미러링 표시 끔",
    bal_checking: "밸런스 체킹중",   /* v3.15.0 — 미러링 켜지는 동안 위 안내(showNote) 자리에 */
    bal_no_photo: "사진을 먼저 불러오세요",
    /* 라인 이름 (v1.19.0) — 왼쪽 레일 버튼 · 캔버스 라벨 · 조절자 이름이 모두 이걸 쓴다 */
    line_eye: "눈",
    line_front: "앞머리",
    line_ft: "앞두께",
    /* v1.81.0 — 원장님 지시 2026-08-27 「아치 (아치엣지:이름변경)」 — **가로선** 이름만 바뀝니다.
       세로선(v6)은 「아치선」 그대로입니다. */
    line_arch: "아치엣지",
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
    editor_guide: "Guide",          /* v1.92.0 — 영어가 기본이 되며 빠져 있던 것을 채움 */
    editor_preset: "Presets",
    editor_preset_save: "Save current",
    set_title: "Settings — Line look", set_badge: "Set",
    set_dragc: "Core", set_drage: "Outline", set_back: "Undo changes",
    set_cycle: "Colors", set_c_mine: "My set",
    tip_v2: "Inner — align it to the start of the drawing",
    tip_front: "Front — put it on the <b>lower</b> edge of the front",
    tip_frontThickness: "Front thickness — put it on the <b>upper</b> edge of the front",
    tip_h2: "Arch edge — put it on the <b>upper</b> edge of the peak",
    tip_archThickness: "Arch thickness — put it on the <b>lower</b> edge of the arch",
    tip_v4: "Tail outer — put the <b>inner-upper corner</b> on the tail tip (left/right bar)",
    tip_h3: "Tail height — put it on the <b>lower</b> edge of the tail tip",
    set_tab_base: "Base lines", set_tab_grab: "Grab · Done",
    set_grab_note: "The grabbed line is how a line looks while you are moving it. It returns to the base look when you let go.",
    /* v1.95.0 — done line · sub line */
    set_dline_hd: "Done line — after checking", set_color: "Color", set_sub: "Sub line",
    set_dline_note: "A done line is one you have finished checking and set down — how it looks when viewing the whole.",
    set_backed: "Restored previous settings", set_inner: "Inner", set_arch: "Arch", set_tail: "Tail",
    line_hidden: "hidden — tap again to show",
    editor_tip: "Tips", ai_name: "Align",   /* v1.92.0 — 좁은 폰에서 잠금(센터선)과 부딪히지 않는 폭 */
    ai_auto_on: "AI Brow Align applied — Undo for default layout",
    ai_arch_fail: "Could not read the brow from the photo — lines left at default layout",
    line_step_keep: "kept — this is the current step",
    set_all: "All this color", set_edge: "Outline", set_weight: "Width", set_hlen: "Ruler length",
    set_edge_hd: "Outline — optional extra",
    set_alpha: "Opacity", set_reset: "Defaults", set_done: "Done",
    set_vlines: "Verticals",
    set_prev_note: "Left = light skin · Right = dark skin. Each name sits where that line lands on the brow.",
    set_order: "Guide order", set_order_note: "Reorder with ▲▼; tap a name to turn that step on or off.",
    set_none: "None", set_auto: "Auto", set_light: "White", set_black: "Black", set_dark: "Ink",
    set_thin: "Thin", set_mid: "Medium", set_thick: "Thick",
    set_short: "Short", set_long: "Long",
    set_c_now: "Current", set_c_now_d: "What you use now",
    set_c_bright: "Bright photo", set_c_bright_d: "Dark lines + white outline",
    set_c_dark: "Dark photo", set_c_dark_d: "Bright lines + ink outline",
    set_saved: "Settings saved",
    editor_load_preset: "Presets",
    editor_preset_load: "Presets",
    editor_photo_lock: "Lock",      /* v1.92.0 — 짧게: 가운데 잠금이 센터선 위에 남아야 합니다 */
    editor_photo_unlock: "Unlock",
    editor_exposure: "EXPOSURE",
    editor_brightness: "Brightness",
    editor_export: "Save",          /* v1.92.0 — 짧게: 왼쪽 도크가 넓어지면 가운데 잠금을 밀어냅니다 */
    editor_change_photo: "Change",
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
    ai_drawn: "Snapped to your drawing — check with guide ①~⑥",
    ai_redraw: "AI Brow Fit",
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
    editor_balance_check: "Mirror",
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
    bal_off: "Mirror view off",
    bal_checking: "Checking balance…",
    bal_no_photo: "Load a photo first",
    line_eye: "Eye",
    line_front: "Front",
    line_ft: "F.T",
    line_arch: "Arch Edge",
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
/* v1.92.0 — **기본 언어 = 영어** (원장님 지시 2026-08-28: 「링크에 설명을 기본 영어,
   다운받을 때 설정 기본 영어로 변경」). 해외 학생에게 링크를 보낼 때가 기준입니다.
   ⚠️ 한 번 고른 언어는 pb_lang 에 저장되어 유지됩니다 — 원장님 폰에서 「한국어」를 한 번 누르시면 끝. */
let LANG = localStorage.getItem("pb_lang") || "en";
const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.ko[k] || k;

/* ═══════════ 2. 라인 정의 · 기본값 ═══════════ */
/* 색상/기본위치는 원본 editor.tsx + BASELINE_CONFIG.md 를 그대로 계승 */

/* 화면에 보여 주는 앱 버전 — ⚠️ 릴리스 때 sw.js 의 VERSION 과 **함께** 올리세요.
   폰(iOS PWA)은 캐시가 끈질겨서, 이 표시가 옛 버전이면 아직 업데이트 전입니다. */
const APP_VERSION = "v3.29.0";

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
/* ⭐ v1.81.0 — **새 플로우 순서 · 사용자가 순서를 바꿀 수 있다** (원장님 지시 2026-08-27)
   「가이드 - 순서 변경가능 기능 추가 —
     앞머리 · 앞두께 · 아치(아치엣지) · 아치두께 · 꼬리 아우터 · 꼬리 높이」
   · ⭐ v1.83.0 — **이너(v2)가 기본 순서에 들어왔습니다** (원장님 지시 2026-08-27
     「설정서 가이드 순서 정할때 이너가 빠져있다. 이너도 포함하라」).
     이너는 **모든 자의 기준점**(BASELINE 1-7)이라 맨 앞입니다 — 이너가 흔들리면 뒤의 여섯 스텝이
     전부 다시 흔들립니다. 필요 없으면 설정 → 가이드 순서에서 이름을 눌러 끄면 됩니다.
     ⛔ 옛 기기에 저장된 순서(pb_flow_v1)는 이너가 빠져 있으므로 **한 번 옮겨 담습니다**(FLOW_KEY v2).
   · 꼬리는 **두 스텝으로 나뉩니다** — 아우터(좌우)로 끝점의 x, 꼬리 높이로 y.
     ⚠️ 손으로 사선을 끄는 규칙(BASELINE 1-27)은 그대로입니다 — 스텝만 나뉜 것입니다.
   ⛔ 순서를 코드에 다시 박지 마세요. GUIDE_FLOW 는 **배열 내용만 바꿔** 씁니다
      (window.PB.GUIDE_FLOW 가 같은 배열을 가리키고 있어 재대입하면 회귀 테스트가 옛 순서를 봅니다). */
const FLOW_KEY = "pb_flow_v2";        /* v1.83.0 — 이너 포함 순서. 옛 키(pb_flow_v1)는 아래에서 옮겨 담는다 */
const FLOW_KEY_OLD = "pb_flow_v1";
const FLOW_ALL = ["v2", "front", "frontThickness", "h2", "archThickness", "v4", "h3"];
const FLOW_DEF = ["v2", "front", "frontThickness", "h2", "archThickness", "v4", "h3"];
const GUIDE_FLOW = [];
function setFlow(list) {
  const seen = new Set();
  const clean = (list || []).filter((k) => FLOW_ALL.includes(k) && !seen.has(k) && seen.add(k));
  GUIDE_FLOW.length = 0;
  GUIDE_FLOW.push(...(clean.length ? clean : FLOW_DEF));
}
function saveFlow() { try { localStorage.setItem(FLOW_KEY, JSON.stringify(GUIDE_FLOW)); } catch (e) {} }
setFlow((() => {
  try {
    const cur = JSON.parse(localStorage.getItem(FLOW_KEY));
    if (Array.isArray(cur) && cur.length) return cur;
    /* 옛 기기 — v1.81~82 에서 저장된 순서에는 이너가 없다. 맨 앞에 넣어 옮겨 담는다 */
    const old = JSON.parse(localStorage.getItem(FLOW_KEY_OLD));
    if (Array.isArray(old) && old.length) return old.includes("v2") ? old : ["v2", ...old];
  } catch (e) {}
  return null;
})());

/* ⚠️ v1.81.0 — **아치는 이제 혼자 움직입니다** (원장님 지시 2026-08-27:
     「지금은 아치가로선과 아치세로선이 동시움직였는데 **따로 움직이도록 되돌린다**」
      · 원장님 확인: 아치두께 동반도 함께 해제 — 아치·아치두께·아치선이 전부 따로)
   ⛔ ARCH_PAIR(v1.67.0)를 되살리지 마세요. 십자 모서리 표식도 아치에서는 그리지 않습니다 —
      두 선이 한 점이 아니게 됐으므로 표식이 거짓말을 하게 됩니다.

   꼬리 끝만 여전히 **한 점**입니다 (BASELINE 1-27 · 사선 동시 이동은 그대로).
   플로우에서만 두 스텝으로 나뉘고, 십자 안쪽 **위** 모서리는 두 스텝 모두에서 그립니다. */
const TAIL_CROSS = { h: "h3", v: "v4", up: true };
const crossOfStep = (step) => (step === "h3" || step === "v4" ? TAIL_CROSS : null);
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
  h1: 0.60,  h1Visible: true,   // ⚠️ v3.8.3 — 원장님 지시(2026-08-31)로 0.36 시도했으나 보류.
                                 // 이 값은 AI 인식이 실패했을 때 판독 알고리즘이 눈썹을 찾기 시작하는
                                 // 탐색창의 기준점이라(예비 경로), 0.36 으로 두면 회귀 14개가 깨진다
                                 // (88·95·116·119·120·122·123·125·126·131·140·178·179·14 — 예비 경로·
                                 // 못박음 검사·드로잉 자동맞춤 등, 단순 화면 표시가 아니라 실제 판독 실패).
                                 // 0.60 유지, 원장님 확인 필요.
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
/* ⭐ v1.88.0 — 잡는 범위 섬세 교정 (원장님 지시 2026-08-28)
   ① EYE_HIT_PX: 눈 가로선(h1)은 **아주 가까이(9px)에서만** 잡힌다 — 화면을 가로지르는 긴 선이라
      아치엣지·아치두께·꼬리를 만지려던 손이 자꾸 눈 선을 잡았습니다. 잡힌 **뒤의** 드래그는
      다른 선과 똑같습니다(손이 멀어져도 잡은 선이 움직인다 — 기존 시스템 유지).
   ② V6_HIT_GAP: 아치선(v6)은 **아치두께보다 아래로 내려온 구간에서만** 잡힌다 —
      아치엣지·아치두께가 아치선 위(위쪽)에 올라와 있으므로, 그 높이에서의 탭은 언제나
      가로 자(본인 선)로 간다. 아치선을 잡으려면 아치두께 아래 구간을 누른다.
   ⛔ 이 두 상수를 지우거나 h1 을 HIT_PX 로 되돌리지 마세요 — 회귀 142 가 잡습니다. */
const EYE_HIT_PX = 9;
const V6_HIT_GAP = 8;
const EYE_FRAC = 0.44;    // (예비 경로 전용) 동공 간 거리 / 캔버스 폭
/* ⭐⭐⭐ v2.0.0 — **자동 정렬의 자는 동공이 아니라 내안각입니다** (원장님 지시 2026-08-29:
   「눈 앞꼬리를 항상 40으로 잡아야 하는거 아니니?」)
   동공 간격으로 맞추면 사람마다 「내안각÷동공」 비율이 달라(실측 0.537~0.701) 내안각이
   **37.7~41.3 눈금** 사이에서 흔들립니다 — 폭 3.6 눈금. 그러면 40~48 룰이 고객마다
   통째로 밀립니다. 내안각 간격으로 맞추면 **내안각이 늘 같은 자리**에 옵니다.
   0.263 = 내안각 반간격 0.1315 × 2 → **1 눈금 = 화면 1%** 가 되어 룰의 13.15 와 딱 맞습니다.
   ⛔ 동공 기준으로 되돌리지 마세요 — 회귀 153 이 잡습니다. */
const INNER_FRAC = 0.263; // 자동 정렬 시 내안각 간 거리 / 캔버스 폭
/* ── 메인 작업 영역 (v1.17.0) ──────────────────────────────────
   캔버스 왼쪽 끝 ~ **오른쪽 위아래 드래그 바 왼쪽 끝**까지가 실제 작업 공간이다.
   · 가로 가이드 선은 이 영역을 넘어가지 않는다 (오른쪽 컨트롤·스크림 위로 튀어나오지 않게)
   · 사진 자동 배치와 라인 배치도 이 영역의 **한가운데**를 기준으로 한다
   세로 기준(CENTER_Y)은 아래 상수 주석 참고. */
const WORK_GAP = 8;              // 드래그 바 왼쪽에서 띄우는 여유
/* ⭐ v1.97.2 — 동공 세로 기준 0.60 → 0.56 (원장님 지시 2026-08-29:
   「고객 얼굴의 중앙은 조금 위로 올리고」).
   ⭐ v3.8.3 — 0.56 → 0.53 (원장님 지시 2026-08-31: 센터 53). h1(DEFAULT_GUIDE, 아래 주석)과
   함께 바꿨을 때는 회귀 14개가 깨졌지만, 격리 테스트로 원인이 h1 쪽임을 확인했다 — CENTER_Y만
   0.53으로 두고 h1은 0.60(원복)인 조합으로 전체 179개 재검증 통과.
   ⭐⭐ v3.9.0 — 0.53 → **0.63** (원장님 지시 2026-09-01). 원인 규명: "눈" 줄의 화면 숫자는
   내부값을 그대로 보여주는 게 아니라 (100 − 내부값×100) 로 **거꾸로** 표시된다(posConfig 의
   H_KEYS 분기, invert:true). CENTER_Y=0.53일 때 화면엔 정확히 47 이 떴는데, 원장님은 "눈" 줄이
   37 로 보이길 원하셨다 — 즉 원하신 건 0.53 이 아니라 1−0.37=**0.63** 이었다.
   (8/31의 "센터 53" 지시는 이 CENTER_Y 얘기가 아니라 v1"센터" 줄 자체 — 그 줄은 눈금자 정의상
   항상 ~53으로 표시되므로 실은 손댈 필요가 없는 값이었다. 두 "센터"라는 이름이 우연히 겹쳐서
   생긴 혼선.) 실제 코드 실행으로 검증: g.h1=0.63 → posConfig("h1").disp === 37 (확인됨).
   ⛔ 다시 0.53 으로 되돌리지 마세요 — 화면엔 47 로 보여 원장님 의도(37)와 어긋납니다.
   회귀 6·44 가 이 상수를 직접 읽습니다. */
const CENTER_Y = 0.63;
/* ⭐ v1.95.0 — **위아래 바가 왼쪽으로** 갔습니다 (원장님 지시 2026-08-29:
   「선 움직임을 사실 오른손으로만 움직이는데 드래그 바 때문에 손 액션 공간이 별로 없다」).
   그래서 작업 영역이 [workLeft ~ workRight] 로 바뀝니다:
   · workLeft  = 왼쪽 바(#rightDock — 이름은 역사, 자리만 왼쪽) 오른쪽 끝 + 여유
   · workRight = 오른쪽은 위 모서리 초기화 버튼뿐이라 **거의 전폭**(작은 여백만)
   ⛔ workRight 를 다시 #rightDock 위치로 계산하지 마세요 — 도크가 왼쪽이라 0.5 로
      붕괴해 얼굴이 반쪽에 구겨집니다 (실제 사고 방지 주석). */
function workLeft() {            // 0~1 정규화. 도크가 아직 없으면 0(전체)
  const d = $("rightDock"), W = S.dim.W;
  if (!d || !d.offsetWidth || !W) return 0;
  return clamp((d.offsetLeft + d.offsetWidth + WORK_GAP) / W, 0, 0.5);
}
function workRight() {
  const W = S.dim.W;
  return W ? 1 - 8 / W : 1;
}
/* v1.96.0 — 사진 기준점을 작업 영역의 **42% 지점**으로 (원장님 지시 2026-08-29:
   「사진 중앙 정렬은 지금보다 더 왼쪽으로 — 오른쪽으로 너무 치우침」).
   한가운데(50%)는 오른손 액션 공간까지 얼굴이 밀려 보였습니다.
   ⭐ v1.97.1 — 원장님이 실기기에서 보고 **조금만 더 오른쪽**으로 (2026-08-29): 0.42 → 0.45.
   ⭐⭐ v1.97.2 — 원장님이 기준을 **정확히 정의**하셨습니다 (2026-08-29 · 파란 빗금 스크린샷):
     「왼쪽 오른쪽의 중앙 — 왼쪽은 드래그바 옆으로부터 측정, 오른쪽은 화면의 끝으로 측정할 것.
       그러면 고객 얼굴과 배경의 여백이 비슷하게 남는다」
     = workLeft(드래그 바 오른쪽 끝+여유) ~ workRight(화면 오른쪽 끝-8px)의 **정중앙 = 0.5**.
   ⛔ 이 정의가 기준입니다 — 다시 바꾸려면 원장님 지시가 먼저입니다. */
const CENTER_BIAS = 0.5;
const centerX = () => { const l = workLeft(), r = workRight(); return l + (r - l) * CENTER_BIAS; };
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
  /* v1.81.0 — 원장님 지시 2026-08-27 「선 색상 제공 : 흰색 추가」.
     짙은 눈썹·어두운 피부에서 대비가 가장 큽니다 (짙은 눈썹 13.8:1). */
  { hex: "#FFFFFF", ko: "흰색", en: "White" },
];
/* ⚠️ v1.81.0 — **세로선은 색 목록이 따로입니다** (원장님 지시 2026-08-27)
   「세로색 목록 추가 — 이너: 기본 민트·먹색·흰색 / 아치선: 먹색·민트·흰색 /
     꼬리선: 먹색·민트·흰색 (모두 이색 적용)」
   세로선은 얼굴을 세로로 가로지르므로 색이 많으면 화면이 시끄럽습니다. 세 가지로 고정합니다.
   ⛔ 가로 자 팔레트(8색)를 세로선에 그대로 붙이지 마세요. */
const V_PALETTE = [
  { hex: "#5EEAD4", ko: "민트", en: "Mint" },
  { hex: "#14161B", ko: "먹",   en: "Ink" },
  { hex: "#FFFFFF", ko: "흰색", en: "White" },
];
const LOOK_KEY = "pb_look_v1";
/* ⚠️⚠️ v1.60.0 — **원장님이 실제 앱에서 맞춰 확정한 기본값** (2026-08-23 · 스크린샷 픽셀 판독)
   「지금 내가 앱에 설정한 선을 기본으로 셋팅하고 못 박아줘」
   ▶ v1.94.0 (2026-08-29) 에서 원장님이 **다시 확정**했습니다 — 아래 값 설명은 그날 기준
     역사 기록이고, 현재 값은 LOOK_DEF 바로 위 v1.94.0 주석이 기준입니다.

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
/* ⚠️ v1.81.0 — 원장님 지시 2026-08-27
   · 세로선 색을 **가로 자와 분리**했습니다 (`vInner`/`vArch`/`vTail`).
     이너 = 민트(기존 그대로) · 아치선·아우터 = **먹색**.
     「가이드가 꺼진상태에서 이너라인은 제외한 세로색상은 기본적으로 먹색을 유지」
   · 테두리 색은 **없음 / 흰색 / 검정 / 먹색** 네 가지 (「자동」 폐지 — 원장님이 목록을 지정하셨습니다)
   · 선 굵기·테두리 굵기는 **슬라이더**라 값이 연속입니다 (3단 세그먼트 폐지) */
/* ⚠️⚠️ v1.94.0 — **원장님이 다시 확정한 기본값** (2026-08-29 · 스크린샷 픽셀 판독)
   「지금 선 설정을 초기 셋팅으로 저장」
   · 기본 선 색: 이너 = **라임** · 아치 = **민트** · 꼬리 = **파랑** (한 자리씩 이동)
   · 세로선: 이너 민트 · 아치선/아우터 먹색 (v1.81.0 그대로)
   · 굵기 0.75 · 가로 길이 0.04(슬라이더 8%) · 투명도 55% — 더 얇고 짧고 연하게
   · 잡은 선 = **흰색 심** · 테두리 없음 · 굵기 85% · 투명도 65%
   ⛔ 값을 바꾸려면 원장님 확인을 먼저 받으세요. 회귀 112 가 이 값을 통째로 잠급니다. */
/* ⭐ v1.95.0 — 원장님 지시 2026-08-29 「놓은선 기본 설정 추가 — 선 굵기·색상·투명도.
     놓은선은 체크를 마무리하고 전체를 보는 선」 + 서브 라인(자→이너 연결선) 굵기·투명도.
   · doneC/doneW/doneOp = **놓은 선**(체크 끝낸 선 · S.doneSet) 전용 — 잡은 선과 값 분리
   · subW/subOp = 가로 자에서 이너선까지 잇는 **서브 라인**(옅은 연결선)
   기본값은 기존 화면과 똑같이 보이도록 잡은 선 값(흰색·85%·65%)과 연결선 값(1px·16%)을 그대로. */
const LOOK_DEF = { inner: "#A3E635", arch: "#5EEAD4", tail: "#2E8BFF",
                   vInner: "#5EEAD4", vArch: "#14161B", vTail: "#14161B",
                   edge: 0, edgeC: "none", weight: 0.75, hlen: 0.04, alpha: 0.55,
                   dragCore: "#FFFFFF", dragEdge: "none", dragW: 0.85, dragOp: 0.65,
                   doneC: "#FFFFFF", doneW: 0.85, doneOp: 0.65, subW: 1, subOp: 0.16 };
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
/* ⚠️ v1.81.0 — 세로선은 자기 열쇠를 씁니다 (가로 자와 색이 분리됨 · LOOK_DEF 주석) */
const GROUP_OF = { v2: "vInner", front: "inner", frontThickness: "inner",
                   v6: "vArch", h2: "arch", archThickness: "arch",
                   v4: "vTail", h3: "tail" };
const groupColor = (key) => (S.look && S.look[GROUP_OF[key]]) || null;
/* 상대 휘도 — 테두리 「자동」이 밝은 선엔 먹, 짙은 선엔 흰색을 고르는 근거 */
function relLum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
const EDGE_LIGHT = "#FFFFFF", EDGE_BLACK = "#000000", EDGE_DARK = "#14161B";
/* ⚠️ v1.81.0 — 테두리 색은 원장님이 지정한 **없음 / 흰색 / 검정 / 먹색** 뿐입니다.
   ⛔ 「자동(대비색)」을 되살리지 마세요 — 원장님이 목록에서 빼셨습니다.
   옛 저장값(`auto`)은 대비색으로 한 번 환산해 줍니다 (기존 기기에서 테두리가 사라지지 않게). */
function edgeColorFor(hex) {
  const c = S.look.edgeC;
  if (c === "light") return EDGE_LIGHT;
  if (c === "black") return EDGE_BLACK;
  if (c === "dark") return EDGE_DARK;
  if (c === "auto") return relLum(hex) > 0.32 ? EDGE_DARK : EDGE_LIGHT;   /* 옛 저장값 호환 */
  return null;                                                            /* "none" = 테두리 없음 */
}
/* 테두리를 실제로 그리는가 — 색이 「없음」이거나 굵기가 0이면 그리지 않는다 */
const hasEdge = () => S.look.edgeC !== "none" && S.look.edge > 0;
/* 고유색 선 하나 — 테두리(있으면) 먼저, 그 위에 색. 깜빡임 클래스는 둘 다에 붙인다 */
/* boost = 1 이면 **선택된 선** — 조금 더 굵고 조금 더 밝게 (v1.81.0 · 원장님 지시 2026-08-27).
   ⚠️ 값을 키우지 마세요: 크게 하면 「잡은 선」과 구분이 안 되고, 자가 눈썹을 덮습니다. */
const SEL_W = 1.3, SEL_OP = 0.25;
/* ⭐ v1.84.0 — **고른 선 말고는 한 단계 물러난다** (원장님 확인 2026-08-27 · B안)
   · 고른 선은 지금 그대로(고유색 · 굵기 ×1.3 · 밝기 +0.25 · 고른 순간 한 번 반짝)
   · 나머지는 **자기 색 그대로 옅게** — 회색으로 바꾸지 않습니다. 색이 곧 이름표이기 때문입니다(1-46.2)
   · **가이드가 꺼졌을 때만** 적용합니다. 가이드가 켜져 있으면 이미 차례 선 하나만 색이 있어
     더 죽일 것이 없고, 두 신호가 겹치면 무엇이 차례인지 흐려집니다
   ⛔ 값을 더 내리지 마세요(0.55). 더 내리면 「가이드를 끄면 전부 보인다」(1-40)가 무너집니다.
   ⛔ 고른 선의 색을 바꾸는 방식(A안)으로 되돌리지 마세요 — 사진 위에서 선 이름을 잃습니다. */
const SEL_FADE = 0.55;
function drawLive(frag, x1, y1, x2, y2, hex, w, cls, boost) {
  const fade = (!S.guideOn && !S.intro && !boost) ? SEL_FADE : 1;
  const op = (boost ? Math.min(1, S.look.alpha + SEL_OP) : S.look.alpha) * fade;
  const ww = boost ? w * SEL_W : w;
  if (hasEdge()) drawLine(frag, x1, y1, x2, y2, edgeColorFor(hex),
                          ww * (1 + 2 * S.look.edge / 100), op * 0.9, cls);
  drawLine(frag, x1, y1, x2, y2, hex, ww, op, cls);
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
  /* v1.90.0 — 가이드 안내(중앙 위 프롬프트) 켜기/끄기.
     v1.90.1 (원장님 확정 2026-08-28) — **앱을 열 때는 언제나 켜진 채 시작**한다.
     끈 것은 그 세션 동안만 유효하다. ⛔ localStorage 로 되살리지 마세요 —
     지난주에 꺼 둔 것을 잊고 「안내가 고장났다」가 됩니다. */
  tipOn: true,
  /* v1.90.0 — 마지막으로 안내를 띄운 플로우 선. 플로우 밖 선(눈·센터)을 골라도
     가이드가 켜져 있는 동안 안내가 사라지지 않게 붙잡아 둔다 (원장님 지시 2026-08-28) */
  tipKey: null,
  balance: null,         // { off: {key: 차이px}, skipped: [key] }
  balAnim: null,         // v3.15.0 — 미러링 켜질 때 앞머리→꼬리 순차 애니메이션 { phase:'ref'|'mirror', t0 }
  multi: false,          // 여러라인 모드 (v1.18.0)
  selSet: [],            // 여러라인 모드에서 선택된 키들 — 함께 움직인다
  photoMode: "zoom",
  locked: true,    /* ⭐ v3.26.0 — 앱은 **잠금 상태로 시작** (원장님 지시 2026-09-02). 사진을 넣을 때도 loadPhoto 가 true 로 */
  guideOn: false, guideCur: null,   // 가이드 플로우 (v1.42.0)
  dragOn: false,         // 선을 잡고 움직이는 중 (v1.55.0 — 짙은 회색 + 살구색 테두리)
  /* ⭐ v1.81.0 — **한 번이라도 움직인 선** (원장님 지시 2026-08-27 · 가이드 꺼진 상태 모드)
     「움직임을 한번이라도 한 색상은 잡은선 색으로 색이 죽어, 움직이지 않은 선들이 눈길을 끌어
       가이드가 자동으로 없더라도 사용자가 체크를 한 선과 남아있는 선을 직관적으로 볼수있다」
     ⛔ 되돌리기 스냅샷에 넣지 마세요 — 선택 상태와 같은 이유입니다 (BASELINE 1-9). */
  doneSet: [],
  /* v1.83.0 — 방금 **고른 선**(1.5초). 고른 순간 한 번 반짝여 「이 선을 골랐다」를 알린다 */
  pulseKey: null,
  /* v1.81.0 — 사진을 넣은 직후의 **전체라인 인사**: 모든 선이 고유색으로 한 번 깜빡인 뒤
     첫 플로우가 시작됩니다 (원장님: 「이너 라인만 색이 있고 나머지는 검정색이라 이게 뭐지? 한다」) */
  intro: false,
  look: loadLook(),      // 선 모양 설정 (v1.56.0) — 색·테두리·굵기·길이·투명도
  lookSnap: null,        // 설정 시트를 연 순간의 값 (「현재 세트」 카드)
  lookTab: "base",       // 설정 시트에서 열린 탭 (v1.81.0 — 미리보기가 이 탭을 따라간다)
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
  brightnessOn: false,                  // 밝기 조절 활성화 상태
  exposureBrightnessValue: 0,           // -100 ~ 100
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
/* v1.90.0 — 중앙 위 알림 (가이드 안내와 같은 자리 · 원장님 지시 2026-08-28).
   AI 눈썹정렬 결과처럼 「읽고 지나가는 말」은 화면 한가운데(HUD)가 아니라 여기로. */
function showNote(html, ms) {
  const el = $("topNote"); if (!el) { showHud(html, ms); return; }
  el.innerHTML = html;
  el.hidden = false;
  clearTimeout(showNote._t);
  showNote._t = setTimeout(() => { el.hidden = true; }, ms || 2200);
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
/* ⭐ v1.95.0 — **놓은 선** (체크를 마무리하고 놓아 둔 선 · 원장님 지시 2026-08-29).
   잡은 선과 값이 **완전 분리**입니다 — 설정의 「놓은 선」 색·굵기·투명도를 그대로 그립니다.
   ⛔ drawGrab 으로 되돌리지 마세요 — 잡은 선 굵기를 바꾸면 놓은 선까지 같이 바뀝니다. */
function drawDone(frag, x1, y1, x2, y2, w) {
  const L = S.look || {};
  drawLine(frag, x1, y1, x2, y2, L.doneC || "#FFFFFF",
           w * (L.doneW != null ? L.doneW : 1), L.doneOp != null ? L.doneOp : 1);
}
const SEG_HALF = 0.19;           // 자 반폭 기본값 — 실제 값은 S.look.hlen (v1.56.0 설정)
const segHalf = () => (S.look && S.look.hlen) || SEG_HALF;
const BROW_PAD = 0.022;          // 눈 기준선이 아우터 바깥으로 더 나가는 여유
const VPAD = 0.045;              // 세로선(긴 것)이 위아래로 더 나가는 여유
const VPAD_TIGHT = 0.025;        // 짧은 세로선의 여유 — 눈까지 내려오지 않는다 (v1.33.0)

/* 그 가로선의 좌·우 토막 [x0px, x1px]. 그리는 범위 = 잡는 범위 = 재는 범위 (BASELINE 1-11) */
function segPx(sp) {
  const { W } = S.dim, g = S.g;
  const cl0 = (t) => clamp(t, workLeft(), workRight()) * W;   /* v1.95.0 — 왼쪽 바 밑으로 안 들어감 */
  if (!sp.anchor) {                                      // 눈 기준선 — 눈썹 구간을 좌우로 관통
    const lo = Math.min(g.v2, g.v4, g.v6) - BROW_PAD;
    return [[cl0(lo), cl0(2 * g.v1 - lo)]];
  }
  const aL = g[sp.anchor], aR = 2 * g.v1 - aL;
  const half = segHalf() * (sp.halfK || 1) * (Math.abs(g.v2 - g.v4) || 0.12);
  /* ⭐ v1.78.0 — **자는 드로잉 위에 놓인다** (원장님 지시 2026-08-25: 「자기는 드로잉 위치가
     아닌데」). 이너·아우터는 눈썹의 **양 끝**입니다. 자를 그 위에 가운데 맞춰 그리면 절반이
     눈썹 밖 맨살 위로 떠서, 원장님이 자를 눈썹에 맞춰 볼 수가 없습니다.
     이제 자는 **세로선에서 눈썹 쪽으로만** 뻗습니다 — 길이는 그대로, 방향만 안쪽으로.
     그러면 세로선과 가로선이 만나는 자리가 그대로 **90° 꼭지점**이 됩니다 (1-34 판정 기준).
     아치선(v6)은 눈썹 한가운데라 지금처럼 가운데 맞춤을 유지합니다.
     ⛔ 다시 가운데 맞춤으로 되돌리지 마세요 — 자가 맨살 위로 떠서 판정이 불가능해집니다. */
  const oth = sp.anchor === "v2" ? g.v4 : sp.anchor === "v4" ? g.v2 : null;
  if (oth === null) return [[cl0(aL - half), cl0(aL + half)], [cl0(aR - half), cl0(aR + half)]];
  const seg = (a, o) => (o >= a ? [cl0(a), cl0(a + 2 * half)] : [cl0(a - 2 * half), cl0(a)]);
  return [seg(aL, oth), seg(aR, 2 * g.v1 - oth)];
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
  /* ⭐ v1.80.0 — **가이드를 끄면 모든 선이 기본 색상** (원장님 지시 2026-08-25:
       「가이드를 끄면 모든 선 기본 색상 보이도록, 잡을 때 잡는 색상 삽입,
        가이드가 켜졌을 때만 선 하나씩 플로우 적용해라」)
     · 가이드 OFF → 전부 고유색 (한눈에 다 보고 시술한다)
     · 가이드 ON  → **지금 차례 하나만** 고유색, 나머지는 조용한 회색 (플로우)
     · 어느 쪽이든 **잡고 있는 선만** 「잡은 선」 색으로 바뀐다 (아래 `grabbed`)
     ⛔ 가이드 OFF 에서 회색으로 되돌리지 마세요 — 회귀 132 가 잡습니다. */
  /* ⭐ v1.81.0 — 사진 직후의 **전체라인 인사** 동안에는 가이드가 꺼진 것처럼 전부 고유색 */
  const emph = (sp) => S.intro || !S.guideOn || S.guideCur === sp.key || isSelected(sp.key);
  /* 지금 손가락(또는 조절 바)이 붙잡고 있는 선인가 — 이 선만 「잡은 선」 색으로 그린다.
     예전에는 `sel && S.dragOn` 이라, 가이드를 끄면 **모든 선이 한꺼번에** 잡은 색이 됩니다. */
  const grabbed = (sp) => !!S.dragOn
    && (gDrag && gDrag.keys && gDrag.keys.length ? gDrag.keys.includes(sp.key) : isSelected(sp.key));
  /* 깜빡임(지시등)은 **플로우 차례 선**에만 — 가이드를 끄면 아무것도 깜빡이지 않는다 */
  const blinkOf = (sp) => (S.intro ? "blink1"
    : (S.guideOn && S.guideCur === sp.key ? "blink"
    : (S.pulseKey === sp.key ? "blink1" : null)));   /* v1.83.0 — 고른 순간 한 번 */
  /* ⭐ v1.81.0 — **선택된 선은 조금 더 굵고 조금 더 밝다** (원장님 지시 2026-08-27:
       「선을 선택시 지금은 아무런 액션이 없다 … 그 선 고유의 선색이 조금더 굵어지고
         조금더 밝아지게 해서 선이 선택되었음을 표시한다」)
     ⛔ 이 신호를 빼지 마세요 — 왼쪽 버튼만 밝아지면 사진 위에서는 무엇을 잡았는지 알 수 없습니다. */
  const boost = (sp) => (S.intro || isSelected(sp.key) ? 1 : 0);
  /* ⭐ v1.81.0 — 가이드가 꺼져 있을 때, **한 번 움직인 선**은 잡은 선 색으로 남는다 (S.doneSet)
     ⭐ v1.83.0 — 다만 **다시 고르면 고유색으로 되살아난다** (원장님 지시 2026-08-27:
        「선이 죽어있다 다시 선택될경우 고유의 색이 생성. 선택했다는 것을 표기한다」)
     ⛔ settled 를 isSelected 보다 먼저 검사하지 마세요 — 죽은 선을 골라도 먹색 그대로라
        무엇을 골랐는지 사진 위에서 알 수 없게 됩니다. */
  const settled = (sp) => !S.guideOn && !S.intro && S.doneSet.includes(sp.key) && !isSelected(sp.key);
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
          /* v1.95.0 — 서브 라인 굵기·투명도는 설정(subW/subOp)을 따른다 (원장님 지시 2026-08-29) */
          frag.appendChild(mk("line", {
            x1: xa, y1: y, x2: xb, y2: y, stroke: HAIR,
            "stroke-width": (S.look && S.look.subW) || 1,
            "stroke-opacity": S.look && S.look.subOp != null ? S.look.subOp : 0.16,
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
        if (bad) { drawLine(frag, xa, y, xb, y, BAL_BAD, sp.w + 2.2, 1); return; }   /* v3.26.0 — 5포인트 틀린 토막 = 민트(정지) */
        if (grabbed(sp)) { drawGrab(frag, xa, y, xb, y, sp.w + 1.8); return; }
        if (settled(sp)) { drawDone(frag, xa, y, xb, y, sp.w + 1.8); return; }   /* v1.95.0 놓은 선 */
        if (sel) { drawLive(frag, xa, y, xb, y, liveColor(sp), (sp.w + 1.8) * S.look.weight, blinkOf(sp), boost(sp)); return; }
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
          if (grabbed(sp)) { drawGrab(frag, x, 0, x, H, w); return; }
          if (settled(sp)) { drawDone(frag, x, 0, x, H, w); return; }            /* v1.95.0 놓은 선 */
          if (sel) { drawLive(frag, x, 0, x, H, lc, w * S.look.weight, blinkOf(sp), boost(sp)); return; }
          drawLine(frag, x, 0, x, H, lc, w, op); return;
        }
        frag.appendChild(mk("line", {                       // 라벨 ↔ 선 연결 (헤일로 없음)
          x1: x, y1: 0, x2: x, y2: H, stroke: lc,
          "stroke-width": 1, "stroke-opacity": 0.16,
        }));
        /* v1.52.0 — 잡은(강조) 세로선은 **전체 길이 고유색**: "세로줄 = 좌우 이동" 신호.
           조용할 땐 **전체가 회색 한 줄** — 색과 토막이 없어 자의 색 토막과 헷갈리지 않는다 */
        if (grabbed(sp)) { drawGrab(frag, x, by0, x, by1, w); return; }
        if (settled(sp)) { drawDone(frag, x, by0, x, by1, w); return; }          /* v1.95.0 놓은 선 */
        if (sel) { drawLive(frag, x, by0, x, by1, lc, w * S.look.weight, blinkOf(sp), boost(sp)); return; }
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
    const pr = S.guideOn ? crossOfStep(S.guideCur) : null;
    const vsp = pr ? V_SPECS.find((q) => q.key === pr.v) : null;
    if (pr && vsp && g[specOf(pr.h).vis] && g[vsp.vis]) {
      const y = g[pr.h] * H, arm = Math.max(16, Math.min(W, H) * 0.045);
      const ay = pr.up ? y - arm : y + arm;
      for (const [x, inward] of [[g[pr.v] * W, 1], [(2 * g.v1 - g[pr.v]) * W, -1]]) {
        if (x < workLeft() * W + 2 || x > workRight() * W) continue;   /* v1.95.0 — 왼쪽 바 회피 */
        const d = `M ${x + inward * arm} ${y} L ${x} ${y} L ${x} ${ay}`;
        const hex = liveColor(specOf(pr.h));
        /* ⚠️ v1.68.0 — 표식의 테두리는 **설정의 「테두리」를 그대로 따른다** (원장님 지시 2026-08-24:
           「꼬리와 아우터에 회색 테두리가 자동으로 생겼다. 내가 의도하지 않음 — 테두리 없게」).
           v1.64~1.67 은 여기에 짙은 테두리를 **박아** 두어, 설정이 「없음」인데도 회색 테두리가 났습니다.
           ⛔ 다시 박지 마세요. 선과 표식은 같은 규칙을 씁니다 (drawLive 와 동일). */
        if (hasEdge()) frag.appendChild(mk("path", { d, fill: "none", stroke: edgeColorFor(hex),
          "stroke-width": 3 * (1 + 2 * S.look.edge / 100), "stroke-linecap": "round",
          "stroke-linejoin": "round", "stroke-opacity": S.look.alpha * 0.9 }));
        frag.appendChild(mk("path", { d, fill: "none", stroke: hex, "stroke-opacity": S.look.alpha,
          "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", class: "blink" }));
      }
    }
  }

  /* ⭐ v3.13.0 — 밸런스 커브(Phase 3) — S.balOn 일 때만, 기존 토막 빨강 표시 위에 겹쳐 그린다 */
  if (S.balOn) renderBalCurve(frag);

  svg.replaceChildren(frag);
}

/* v1.64.0 — 지금 차례인 선의 프롬프트 한 줄. 가이드가 꺼져 있으면 숨긴다 */
const STEP_NUM = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];
function updateGuideTip() {
  const el = $("guideTip"); if (!el) return;
  /* ⭐ v1.90.0 (원장님 지시 2026-08-28 「가이드가 켜져 있는 상태에서는 안내가 나오도록」)
     · 인사(초기화셋팅) 중에도 **첫 스텝 안내**를 미리 띄운다 — 껐다 켠 직후 3.2초가 비어 보였다
     · 플로우 밖 선(눈·센터 등)을 골라 차례가 잠시 내려가도 **마지막 안내를 유지**한다 (S.tipKey)
     · 「안내」 토글(S.tipOn)이 꺼져 있으면 숨긴다 */
  if (S.guideOn && S.guideCur) S.tipKey = S.guideCur;
  const key = S.guideOn && S.tipOn
    ? (S.guideCur || (S.intro ? GUIDE_FLOW[0] : S.tipKey) || GUIDE_FLOW[0]) : null;
  const msg = key ? t("tip_" + key) : "";
  if (!key || msg === "tip_" + key) { el.hidden = true; return; }
  /* 번호는 **지금 순서**에서 계산한다 — 원장님이 순서를 바꾸면 번호도 따라 바뀐다 (v1.81.0) */
  const i = GUIDE_FLOW.indexOf(key);
  el.hidden = false;
  el.innerHTML = (i >= 0 ? (STEP_NUM[i] || (i + 1) + ".") + " " : "") + msg;
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
      /* v1.88.0 ① — 눈 선은 아주 가까이서만. 근처를 스쳐도 안 잡힌다 */
      if (L.key === "h1" && d > EYE_HIT_PX) continue;
    } else {
      /* v1.88.0 ② — 아치선은 아치두께 **아래 구간**에서만 잡힌다.
         아치두께가 숨어 있으면 아치엣지 기준, 둘 다 숨어 있으면 제한 없음 */
      if (L.key === "v6") {
        const topKey = g.archThicknessVisible ? "archThickness" : (g.h2Visible ? "h2" : null);
        if (topKey && y < g[topKey] * H + V6_HIT_GAP) continue;
      }
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
    /* ⛔ v1.81.0 — 아치·아치선의 사선 동반(archPair)은 **폐지**되었습니다 (원장님 지시 2026-08-27).
       아치 가로선, 아치두께, 아치선은 각자 자기 축으로만 움직입니다. 회귀 117 이 지킵니다. */
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
      endIntroEarly();   /* v1.88.0 — 인사 중에 선을 움직이면 인사는 즉시 끝난다 */
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
    } else {
      dragLineBy(gDrag.key, gDrag.base, dxN, dyN, gDrag.mirrored);
    }
    render();
    /* 값 네모칸(HUD)은 띄우지 않는다 (v1.44.0 원장님 지시) — 드래그 바 라벨에 숫자가
       이미 있어 중복이고 사진을 가립니다. 여러라인 개수 안내만 유지. */
    if (S.multi && gDrag.keys.length > 1) showHud(`${gDrag.keys.length}${t("sel_count")}`);
  } else if (gMode === "pan" && gDrag) {
    /* v1.95.0 — 배경 탭(3px 미만) 판정용. 팬 동작 자체는 그대로 즉시 따라간다 */
    if (!gDrag.moved && Math.hypot(sp.x - gDrag.x0, sp.y - gDrag.y0) >= 3) gDrag.moved = true;
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
  const gKeys = gMode === "line" && gDrag && gDrag.moved ? gDrag.keys : null;
  /* ⭐ v1.95.0 — **배경 한 번 탭 = 이 단계 확인하고 다음으로** (원장님 지시 2026-08-29:
     「이미 맞은 라인을 움직이지 않아도 될 경우 가이드 블링킹 이후 한 번 배경을 클릭하면
       다음으로 넘어가라 — 그래서 설명도 넘어가라」).
     · 배경 탭 = 선을 안 잡았고(3px 데드존 안) 움직이지도 않은 한 손가락 탭
       (잠금 해제 상태의 팬 탭, 잠금 상태의 빈 곳 탭 — 둘 다)
     · 지금 차례 선을 「끝냄」으로 표시하고(놓은 선 색이 된다) 다음 차례로 — 설명도 따라간다
     · 인사(초기화셋팅) 중에는 안 넘어간다 — 인사는 선을 움직여야만 일찍 끝난다 (v1.88.0) */
  const bgTap = gDrag && !gDrag.moved && !S.intro && S.guideOn && S.guideCur
    && GUIDE_FLOW.includes(S.guideCur)
    && (gMode === "pan" || (gMode === "line" && !gDrag.tapKey));
  const skipKey = bgTap ? S.guideCur : null;
  if (pts.size < 2) { gMode = pts.size === 1 ? null : null; gDrag = null; }
  if (pts.size === 0) {
    commitEdit();   /* 손을 다 떼면 한 작업으로 확정 */
    /* v1.81.0 — 실제로 움직인 선만 「끝냄」으로 표시한다 (탭만 한 것은 표시하지 않는다) */
    if (guideKey) { (gKeys || [guideKey]).forEach(markDone); guideAdvance(guideKey); }
    else if (skipKey) { markDone(skipKey); guideAdvance(skipKey); }
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
  /* v1.81.0 — 꼬리는 아우터(x)·높이(y)가 **각자의 스텝**입니다. 움직인 선이 곧 끝낸 스텝입니다. */
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
  S.balCurve = null;                                  // v3.13.0 — 커브 판정도 함께 낡는다
  S.balAnim = null;                                   // v3.15.0 — 애니메이션도 함께 낡는다
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

/* ⭐ v1.81.0 — 이 선의 **움직임이 끝났다**고 표시한다 (가이드 꺼진 상태 모드 · S.doneSet 주석).
   꼬리 끝은 한 점이라 사선으로 끌면 꼬리·아우터가 함께 놓입니다 → 둘 다 표시합니다. */
function markDone(key) {
  const add = (k) => { if (k && !S.doneSet.includes(k)) S.doneSet.push(k); };
  add(key);
  if (key === "h3" || key === "v4") { add("h3"); add("v4"); }
}

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

/* ⭐ v1.83.0 — **고른 순간 한 번 반짝** (원장님 지시 2026-08-27 「선택했다는 것을 표기한다」)
   굵기·밝기만으로는 이미 굵은 선(꼬리)이나 밝은 사진에서 변화가 눈에 잘 안 들어옵니다.
   고르는 **그 순간에만** 1.4초짜리 한 번 깜빡임(pbBlink1)을 붙여 눈이 그 선을 따라가게 합니다.
   ⛔ 반복 깜빡임(blink)으로 바꾸지 마세요 — 시술 중 계속 깜빡이면 눈이 피로합니다.
   ⚠️ 가이드 차례 선(blink)과 겹치면 차례 깜빡임이 이깁니다 — 신호가 둘이면 아무 뜻이 없습니다. */
const SEL_PULSE_MS = 1500;
let selPulseTimer = null;
function pulseSel(key) {
  S.pulseKey = key || null;
  if (selPulseTimer) clearTimeout(selPulseTimer);
  if (!key) return;
  selPulseTimer = setTimeout(() => { selPulseTimer = null; S.pulseKey = null; render(); }, SEL_PULSE_MS);
}

/* 선택 기록 — S.sel(드래그 대상) 과 축별 조절자 대상을 함께 갱신 */
function noteSel(key) {
  /* v1.85.0 — 레일 탭이 아닌 경로(가이드 진행·드로잉 맞춤·초기화 등)로 선택이 바뀌면
     「두 번 탭 = 숨김」 카운트를 지운다. ⛔ 지우지 않으면 앱이 고른 선을 한 번만 눌러도 사라집니다. */
  lastTapKey = null;
  if (key !== S.sel) pulseSel(key);
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
}
function setSel(key) {
  noteSel(key);
  updatePanels();
  render();                 /* v1.83.0 — 고른 순간의 반짝임·굵기 변화를 바로 그린다 */
}

/* v1.85.0 — 레일 버튼 **직전 탭**. 숨김(두 번 탭)은 이것으로만 판단합니다.
   앱이 자동으로 고른 선(가이드 첫 스텝 등)은 여기에 들어가지 않습니다. */
let lastTapKey = null;
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
        /* ⭐ v1.85.0 — 숨김은 **원장님이 같은 버튼을 두 번 누른 때만** (원장님 신고 2026-08-28
             「드로잉 맞춤 클릭시 이너가 사라졌다」)
           예전 조건은 `S.sel === 이 선` 이었습니다. v1.83.0 에서 **이너가 플로우 첫 스텝**이 되면서
           드로잉 맞춤·가이드 켜기가 이너를 **자동으로 선택**해 두는데, 그 상태에서 이너를 한 번만
           눌러도 「두 번째 탭」으로 취급돼 **선이 사라졌습니다.**
           → 앱이 고른 선은 숨김의 근거가 되지 않습니다. **직전 탭이 같은 버튼일 때만** 숨깁니다.
           ⛔ `S.sel === spec.key` 조건으로 되돌리지 마세요 — 회귀 139 가 잡습니다. */
        /* ⭐ v1.86.0 — **지금 차례인 선은 숨길 수 없다** (원장님 지시 2026-08-28 「예전에 쓰던 이너 라인 되돌려놔」)
           앱이 「이 선을 놓으세요」라고 시켜 놓고 그 선을 숨겨 버리면 시술이 그 자리에서 멈춥니다. */
        const isStep = S.guideOn && S.guideCur === spec.key;
        const twoTaps = lastTapKey === spec.key && S.hMode === "line" && !isStep;
        let hidNow = false, blockedHide = false;
        step(() => {
          const wasOn = S.g[spec.vis];
          if (twoTaps) S.g[spec.vis] = !S.g[spec.vis];
          else S.g[spec.vis] = true;
          blockedHide = isStep && lastTapKey === spec.key && wasOn;
          hidNow = wasOn && !S.g[spec.vis];
          /* 꺼져 있던 선을 켤 때는 **그 고객 사진에서 측정한 자리**로 올린다 (v1.22.0).
             랜드마크가 없으면(얼굴 인식 실패) 마지막 값 그대로 — 조용히 실패한다. */
          if (!wasOn && S.g[spec.vis] && aiPlaceLine(spec.key)) aiSnapped = true;
        });
        noteSel(spec.key);
        lastTapKey = spec.key;          /* noteSel 이 지운 뒤에 찍는다 — 다음 탭이 「두 번째」 */
        /* 숨겼다는 것을 말로 알린다 — 선이 조용히 사라지면 고장으로 보입니다 */
        if (hidNow) showHud(`${t(spec.i18n)} · ${t("line_hidden")}`, 1800);
        else if (blockedHide) showHud(`${t(spec.i18n)} · ${t("line_step_keep")}`, 1600);
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
  { const bt = $("btnTip"); if (bt) bt.classList.toggle("on", S.tipOn); }   /* v1.90.0 */
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
  /* 기준 쪽 — **왼쪽/오른쪽 중 켜진 쪽만** 색이 들어온다 (v1.29.0).
     v3.25.0 — 「밸런스를 켜야 나온다」(hidden 토글)는 CSS 에 져서 한 번도 동작한 적이 없었고
     원장님은 늘 보이는 상태로 써 오셨다 → 항상 표시로 확정 (index.html #refWrap 주석). */
  $("btnRefL").classList.toggle("on", S.refSide === "L");
  $("btnRefR").classList.toggle("on", S.refSide === "R");
  $("btnLock").classList.toggle("on", S.locked);
  $("btnGuide").classList.toggle("on", !!S.guideOn);
  $("lockLabel").textContent = S.locked ? t("editor_photo_unlock") : t("editor_photo_lock");
  updateExposureBrightnessButtons();
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
  /* v2.0.0 — 세로선은 **얼굴 기준 눈금**(왼쪽 내안각 40 · 센터 53.15). dispV 주석 참고. */
  return { name: t(sp.i18n), v: g[k], disp: dispV(g[k]), hint: t("hint_leftright"), step: 0.003, invert: false, axis: "h" };
}

function applyPos(v, key) {
  const k = key || S.sel, c = posConfig(k);
  v = clamp(v, 0, 1);
  if (k === "outerAngle") S.g.outerAngle = v;
  else if (k === "innerAngle") S.g.innerAngle = clamp(1 - v, 0.02, 0.98);
  /* ⛔ v1.81.0 — 아치를 올려도 아치두께는 따라오지 않습니다 (원장님 지시 2026-08-27 · 위 주석) */
  else setLine(k, c.invert ? 1 - v : v);
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
  fitDocks();          /* 즐겨찾기로 왼쪽 도크 폭이 바뀌면 도크 전체를 다시 맞춘다 (v1.58.0 · v1.93.0) */
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
  S.eyeZero = cy;     /* v2.2.2 — 넘버링의 0 (정렬이 맞춘 동공 높이) */
  S.innerAnchor = half * R_INNER;   /* v1.99.0 — 랜드마크가 없을 때의 「내안각 → 센터」 자 */
  S.faceRef = { a: cx - half * R_INNER, c: cx };   /* v2.0.0 — 눈금 표시의 자 */
  g.v2 = clamp(cx - half * R_INNER, 0.01, 0.99); g.v3 = 2 * cx - g.v2;
  g.v4 = clamp(cx - half * R_OUTER, 0.01, 0.99); g.v5 = 2 * cx - g.v4;
  const up = (f) => clamp(cy - half * f * aspect, 0.02, 0.98);
  g.h2 = up(0.92);              // 눈썹 산 (Arch)
  g.archThickness = up(0.66);
  /* v2.1.1 — 앞머리는 동공 비율(0.78) 짐작이 아니라 **넘버링**으로 (위 FRONT_T_MID 주석):
     눈 위로 11.7 눈금. 1 눈금 = (내안각 반간격)/13.15 — 이너 자와 같은 자입니다. */
  g.front = clamp(cy - FRONT_T_MID * ((half * R_INNER) / 13.15) * aspect, 0.02, 0.98);
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
  /* ⭐ v2.0.1 — 랜드마크가 없는 길입니다. 예전에는 앞꼬리를 **비율(R_INNER 0.52)로 짐작**
     했습니다. 이제 사진에서 **직접 찾아** 눈금의 자를 바로잡습니다 (위 findCanthus 주석).
     못 찾으면 조용히 짐작값으로 남습니다 — 원장님 지시대로 시스템이 스스로 판단합니다. */
  try {
    const img = photoPixels();
    /* 정렬이 끝난 뒤 동공은 정의상 (centerX ± EYE_FRAC/2, CENTER_Y) 에 있습니다 */
    const det = img && detectFaceRef(img,
      { x: (centerX() - EYE_FRAC / 2) * W, y: CENTER_Y * H },
      { x: (centerX() + EYE_FRAC / 2) * W, y: CENTER_Y * H });
    if (det) { S.faceRef = det; S.innerAnchor = det.c - det.a; }
  } catch { /* 판독 실패는 조용히 넘어간다 — 짐작값으로 남습니다 */ }
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

  /* 줌: **내안각 간 거리**가 캔버스 폭의 INNER_FRAC 이 되도록 (v2.0.0 · 위 상수 주석) */
  const d = Math.hypot(innerR.x - innerL.x, innerR.y - innerL.y) * S.s0;
  const zoom = clamp((INNER_FRAC * W) / Math.max(d, 1), ZOOM_MIN, ZOOM_MAX);

  /* 이동: 좌우는 **내안각 중점**(얼굴 축), 위아래는 동공 높이(v1.97.2 에서 맞춘 CENTER_Y) */
  const mx = (innerL.x + innerR.x) / 2, my = (irisA.y + irisB.y) / 2;
  const vx = (mx - iw / 2) * S.s0, vy = (my - ih / 2) * S.s0;
  const r = (rot * Math.PI) / 180;
  const rx = vx * Math.cos(r) - vy * Math.sin(r);
  const ry = vx * Math.sin(r) + vy * Math.cos(r);
  const tr = { zoom, rot, ox: clamp(-(rx * zoom) / W + (centerX() - 0.5), -OFFSET_MAX, OFFSET_MAX), oy: clamp(-(ry * zoom) / H + (CENTER_Y - 0.5), -OFFSET_MAX, OFFSET_MAX) };
  S.p = tr;

  /* 라인 자동 배치 — **기준쪽 실측만** 쓴다 (데칼코마니 · placeLines 의 주석 참고) */
  placeLines(lm);

  /* ⭐⭐⭐ v3.29.0 — **배율의 자는 눈이 아니라 눈썹** (원장님 확정 2026-09-02 「이걸로 하자 고도화」).
     위의 INNER_FRAC 배율은 출발값일 뿐이고, 여기서 **양쪽 눈썹 꼬리 끝 간격이 작업 영역 폭의
     BROW_FRAC(80%)** 가 되도록 배율을 다시 맞춘다 (fitBrowsToFrame). 고객이 누구든 눈썹이 같은 크기로
     화면을 채운다 — 시술은 눈썹을 보고 하기 때문. 눈 사이가 좁고 눈썹이 긴 얼굴(케이스 1)은 예전엔
     INNER_FRAC 로 크게 확대됐다가 fitBrowsInFrame 이 꼬리를 넣느라 한참 줄여 얼굴이 작아 보였고,
     눈 사이가 넓고 눈썹이 짧은 얼굴(케이스 2)은 크게 남았다 — 같은 앱에서 두 고객의 눈썹 크기가 달랐다.
     ⚠️ 눈금 자·40~53 룰은 사진 기준(innerAnchor)이라 배율과 무관 — 회귀 153 이 「내안각 = 40」을 그대로 잠근다.
     ⚠️ 내안각의 **화면 위치**는 이제 고객마다 다르다 (1눈금 = 화면 1% 는 더 이상 보장하지 않는다). */
  fitBrowsToFrame(lm);
  fitBrowsInFrame(lm);   // 안전판 — 그래도 잘리면 배율을 낮춘다 (80% < 88% 라 보통은 작동하지 않는다)
}

const BROW_FRAC = 0.80;          // 양쪽 눈썹 꼬리 끝 간격 / 작업 영역 폭 (v3.29.0)
/* 지금 배율에서 눈썹이 작업 영역을 얼마나 채우는가 — 1 이면 딱 BROW_FRAC.
   fitBrowsInFrame 과 같은 자로 잰다: 랜드마크 꼬리(70·300)와 아우터 연장선 끝 중 먼 쪽. */
function browFillNeed(lm) {
  const { W } = S.dim, g = S.g;
  const lmXs = [70, 300].map((i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p).x / W);
  const half = browTailHalf(lm, S.p, g.v1);
  const lo = Math.min(...lmXs, g.v1 - half), hi = Math.max(...lmXs, g.v1 + half);
  const span = workRight() - workLeft();
  const c = g.v1;
  const extent = Math.max(c - lo, hi - c);            // 센터에서 먼 쪽 꼬리까지
  return { need: extent / Math.max((BROW_FRAC / 2) * span, 1e-6), lo, hi, c, span };
}
function fitBrowsToFrame(lm) {
  if (!lm || !S.dim.W || !lm[70] || !lm[300]) return;
  for (let pass = 0; pass < 6; pass++) {
    const { need } = browFillNeed(lm);
    if (!isFinite(need) || need <= 0) return;
    if (Math.abs(need - 1) <= 0.005) return;          // 수렴
    const zoom = clamp(S.p.zoom / need, ZOOM_MIN, ZOOM_MAX);
    if (Math.abs(zoom - S.p.zoom) < 1e-4) return;     // 배율 한계에 닿음
    S.p.zoom = zoom;
    autoAlignRelayout(lm);
  }
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
    /* v1.95.0 — 작업 영역이 [workLeft ~ workRight] 라 여백도 그 폭 기준으로 잰다 */
    const WLn = workLeft(), span = WRn - WLn;
    const left = WLn + FRAME_PAD * span, right = WRn - FRAME_PAD * span;
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
  /* v2.0.0 — 좌우는 내안각 중점(얼굴 축), 위아래는 동공 높이. autoAlign 과 같은 기준. */
  const mx = (c.innerL.x + c.innerR.x) / 2, my = (a.y + b.y) / 2;
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
  S.eyeZero = g.h1;   /* v2.2.2 — 넘버링의 0 (동공 중심). h1 은 이후 옮겨질 수 있다 */
  const halfIn = Math.abs((refIsLeft() ? inLc : inRc).x / W - g.v1);
  S.innerAnchor = halfIn;   /* v1.99.0 — 「내안각 → 센터」 자. 이너 판독의 기준 (40 = 여기) */
  S.faceRef = { a: Math.min(inLc.x, inRc.x) / W, c: g.v1 };   /* v2.0.0 — 눈금 표시의 자 */
  g.v2 = clamp(g.v1 - halfIn, 0.02, 0.98);  g.v3 = 2 * g.v1 - g.v2;
  const halfOut = browTailHalf(lm, S.p, g.v1);   /* 기준쪽 눈썹 꼬리 (v1.35.0/v1.38.0) */
  g.v4 = clamp(g.v1 - halfOut, 0.02, 0.98); g.v5 = 2 * g.v1 - g.v4;

  /* 아치선·가로선 — aiValueFor 가 기준쪽 랜드마크를 쓴다 (v1.38.0) */
  { const v = aiValueFor("v6"); if (v !== null) { g.v6 = v; g.v7 = 2 * g.v1 - v; } }
  for (const k of ["h2", "h3", "front", "archThickness", "frontThickness"]) {
    const v = aiValueFor(k);
    if (v !== null) g[k] = v;
  }
  /* ⛔⛔ v3.4.0 — **초기 배치에도 25 상한을 건다** (원장님 확정 2026-08-30:
     「AI 자동배치에서 절대 있어서는 안 되는 자리 29 혹은 30 같은 위치에 있어서는 안 된다」).
     `aiValueFor("v6")` 는 눈썹 산 위쪽 랜드마크(105/334)라 사람에 따라 30 을 훌쩍 넘습니다 —
     실기기에서 34~35 에 서 있던 값이 바로 이것입니다. 판독 전에 여기서 먼저 자릅니다.
     ⛔ 이 한 줄을 지우지 마세요. */
  archVCap();
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

/* ⭐ v1.91.0 — **앱 시작 = AI 눈썹정렬 켜짐** (원장님 지시 2026-08-28:
     「앱이 시작되면 기본으로 AI 눈썹정렬을 켜둬라 · 나중에 무료 캐시가 끝나면 꺼지고
      프리미엄 가입 시 다시 켜진다 · 무료 캐시를 다 쓰면 기본정렬로 변경된다」)
   · 사진을 넣으면 랜드마크 기본정렬을 깐 뒤 **자동으로 AI 눈썹정렬**을 한 번 돌린다
   · 판독이 실패하면(드로잉이 없는 사진 등) **조용히 기본정렬로 남는다** —
     v1.34.0 의 실패(어긋난 판독으로 시작)를 그대로 안고 가지 않기 위한 안전판. ⛔ 이 안전판을 빼지 마세요
   · aiAllowed() = 프리미엄 게이트 자리. 지금은 무료(항상 true).
     나중에 무료 캐시 소진 → false → 자동 정렬 꺼짐 + 버튼 🔒 잠금, 프리미엄 가입 → true.
   · step() 으로 감싼다 — 되돌리기 한 번이면 기본정렬로 돌아간다 */
const aiAllowed = () => true;   /* TODO(프리미엄): 무료 캐시·구독 상태를 여기서 판정 */
function autoAiOnLoad() {
  if (!aiAllowed()) return;
  let ok = false;
  step(() => { ok = autoFromDrawing(); });
  /* 실패하면 아무것도 바뀌지 않고, commitEdit 는 값이 그대로면 기록하지 않으므로
     되돌리기 기록도 더럽혀지지 않는다 — 조용히 기본정렬로 남는다 */
  /* ⭐ v3.3.0 — **판독이 어긋난 것을 조용히 넘기지 않는다** (원장님 지시 2026-08-30).
     실기기에서 아치선이 몸통 한가운데에 서 있었는데 화면에는 「적용됨」만 떠서, 원장님이
     값을 직접 재 보시기 전까지 아무도 몰랐습니다. 안전판이 걸렸으면 그 사실을 알립니다.
     ⛔ 다시 조용하게 만들지 마세요. */
  if (ok) {
    /* ⭐ v3.8.4 — **성공 안내(「AI 눈썹정렬 적용됨」)는 숨김** (원장님 지시 2026-09-01: 「Ai자동정렬
       안내 숨김, 필요가 없음」). 사진을 넣을 때마다 자동으로 뜨던 알림이라 반복적이고 더는 필요
       없다는 판단입니다. ⚠️ 실패 안내(ai_arch_fail, 바로 아래 else)는 그대로 둡니다 — v3.3.0에서
       「판독이 어긋난 것을 조용히 넘기지 않는다」고 명시적으로 지시하신 안전판이라, 이번 지시는
       성공 알림에만 해당한다고 해석했습니다. */
    render();
    showArchDots();               /* v3.3.1 — 읽은 윗선을 점으로 8초 표시 (진단) */
  } else {
    showNote(t("ai_arch_fail"), 4200);
    render();
  }
}

/* ═══ v1.97.0 — 예비 동공 정렬 (원장님 지시 2026-08-29) ═══════════════════
   「사진이 자동 정렬되는 첫 크기가 모두 달라 동공 위치가 달라져 사용감이 나쁘다.
     동공 위치를 파악해 처음부터 동공이 비슷한 위치·비슷한 크기에 오도록 고도화」
   얼굴 전체가 나온 사진은 MediaPipe → autoAlign 이 이미 동공 간격을 EYE_FRAC(44%)으로
   통일합니다. 문제는 **눈 부위만 확대 촬영한 사진** — 얼굴 인식이 실패해 보정이 아예
   안 걸리고 눈이 화면만큼 커진 채 시작됩니다 (실기기에서 확인).
   → 인식이 실패하면 사진 픽셀에서 동공(어둡고 동그란 한 쌍)을 직접 찾아
     alignFromPupils() 로 **같은 크기·같은 자리**에 놓습니다.
   · 어두운 픽셀(하위 6%)의 연결 덩어리 중 **동그란 것**만 후보 — 눈썹(길쭉)·머리카락(큼) 제외
   · 한 쌍 조건: 가로 간격 12~80% · 기울기 ±22° · 크기비 3.2배 이내 · 어두울수록 가점
   · SVG 사진(회귀 테스트 자산)은 건드리지 않습니다 — 픽스처 변환 안정성 (회귀 149의 ② 검사)
   ⛔ 성공 경로(autoAlign)를 이것으로 대체하지 마세요 — 랜드마크가 늘 더 정확합니다. */
function findPupilsFallback() {
  if (!S.imgEl || !S.iw || !S.ih) return null;
  const DW = 220, DH = Math.max(60, Math.round((DW * S.ih) / S.iw));
  const cv = document.createElement("canvas"); cv.width = DW; cv.height = DH;
  const cx2 = cv.getContext("2d", { willReadFrequently: true });
  let d;
  try { cx2.drawImage(S.imgEl, 0, 0, DW, DH); d = cx2.getImageData(0, 0, DW, DH).data; }
  catch (e) { return null; }
  const N = DW * DH, lum = new Float32Array(N);
  for (let i = 0; i < N; i++) lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  const th = Float32Array.from(lum).sort()[Math.floor(N * 0.06)];   /* 하위 6% 어두움 */
  const seen = new Uint8Array(N), blobs = [];
  const qx = new Int32Array(N), qy = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    if (seen[i] || lum[i] > th) continue;
    let head = 0, tail = 0;
    qx[0] = i % DW; qy[0] = (i / DW) | 0; tail = 1; seen[i] = 1;
    let minx = DW, maxx = 0, miny = DH, maxy = 0, sx = 0, sy = 0, n = 0, sl = 0;
    while (head < tail) {
      const px = qx[head], py = qy[head]; head++;
      const id = py * DW + px;
      n++; sx += px; sy += py; sl += lum[id];
      if (px < minx) minx = px; if (px > maxx) maxx = px;
      if (py < miny) miny = py; if (py > maxy) maxy = py;
      if (px > 0)      { const j = id - 1;  if (!seen[j] && lum[j] <= th) { seen[j] = 1; qx[tail] = px - 1; qy[tail] = py; tail++; } }
      if (px < DW - 1) { const j = id + 1;  if (!seen[j] && lum[j] <= th) { seen[j] = 1; qx[tail] = px + 1; qy[tail] = py; tail++; } }
      if (py > 0)      { const j = id - DW; if (!seen[j] && lum[j] <= th) { seen[j] = 1; qx[tail] = px; qy[tail] = py - 1; tail++; } }
      if (py < DH - 1) { const j = id + DW; if (!seen[j] && lum[j] <= th) { seen[j] = 1; qx[tail] = px; qy[tail] = py + 1; tail++; } }
    }
    if (n < 6) continue;
    const w = maxx - minx + 1, h = maxy - miny + 1;
    if (w > DW * 0.22 || h > DH * 0.3) continue;        /* 머리카락·그림자 같은 큰 덩어리 */
    const ar = w / h;
    if (ar > 2.4 || ar < 0.35) continue;                /* 눈썹처럼 길쭉한 것 */
    if (n / (w * h) < 0.45) continue;                   /* 속이 빈 테두리 모양 */
    blobs.push({ x: sx / n, y: sy / n, n, dark: sl / n });
  }
  if (blobs.length < 2) return null;
  let best = null;
  for (let i = 0; i < blobs.length; i++) for (let j = i + 1; j < blobs.length; j++) {
    const A = blobs[i], B = blobs[j];
    const dx = Math.abs(A.x - B.x), dy = Math.abs(A.y - B.y);
    if (dx < DW * 0.12 || dx > DW * 0.8) continue;      /* 콧구멍 쌍(좁음)·화면 끝끼리(넓음) 배제 */
    if (dy > dx * 0.4) continue;                        /* 기울기 ±22° 안 */
    if (Math.max(A.n, B.n) / Math.min(A.n, B.n) > 3.2) continue;
    const score = (255 - A.dark) + (255 - B.dark) + dx * 0.15 - dy * 0.6;
    if (!best || score > best.score) best = { score, a: A, b: B };
  }
  if (!best) return null;
  const kx = S.iw / DW, ky = S.ih / DH;
  return { a: { x: best.a.x * kx, y: best.a.y * ky }, b: { x: best.b.x * kx, y: best.b.y * ky } };
}
function fallbackPupilAlign() {
  if (S.photoType && S.photoType.includes("svg")) return false;   /* 테스트 자산 보호 (위 주석) */
  const pp = findPupilsFallback();
  if (!pp) return false;
  const A = imgToCanvas(pp.a.x, pp.a.y, S.p), B = imgToCanvas(pp.b.x, pp.b.y, S.p);
  alignFromPupils(A, B);
  render();
  return true;
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
      fallbackPupilAlign();       /* v1.97.0 — 동공을 직접 찾아 같은 크기·자리로 (확대 촬영 사진) */
      autoAiOnLoad();             /* v1.91.0 — 얼굴 인식이 안 돼도 예비 경로가 드로잉을 찾는다 */
      return;
    }
    S.landmarks = res.faceLandmarks[0];
    autoAlign(S.landmarks);
    /* ⚠️ 여기서 autoFromDrawing() 을 **자동으로 부르지 마세요** (v1.34.0).
       v1.30.0~v1.33.0 은 사진을 넣자마자 드로잉 판독까지 돌렸는데, 실제 고객 사진에서
       판독이 어긋나면 선이 엉뚱하게 벌어진 채 시작됐습니다. 원장님 판정(2026-08-21):
       「초기화 눌렀을때 올라온 선들이 맞다. 이것을 내가 사진을 입력하는 순간부터
       적용하고싶다」 — 즉 시작 배치는 **초기화와 동일한 랜드마크 배치**입니다.
       (v1.91.0) 원장님 새 지시로 **자동 AI 눈썹정렬**이 켜졌지만, 위 원칙은 남아 있습니다 —
       autoAiOnLoad() 는 판독이 실패하면 **랜드마크 배치를 그대로** 둡니다. */
    setAI(t("ai_ok"), "ok");
    render();
    autoAiOnLoad();               /* v1.91.0 — 시작 = AI 눈썹정렬 켜짐 (원장님 지시 2026-08-28) */
  } catch (err) {
    console.warn("[PerfectBrow] face AI unavailable:", err);
    S.landmarks = null;
    setAI(t("ai_fail"), "warn");
    render();
    fallbackPupilAlign();         /* v1.97.0 — 모델이 없어도 동공 기준 크기·자리 통일 */
    autoAiOnLoad();               /* v1.91.0 — AI 모델이 없어도(오프라인) 예비 경로로 */
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
const TAIL_INK = 0.45;    // **평균 진하기**가 중앙값의 이 비율 이상이어야 「검은 드로잉」 (v1.72.0)
/* ⛔ v3.0.0 — KINK_DROP(「꺾임점」 문턱)은 폐지되었습니다. 아치선(v6)은 이제
   autoFromDrawing() 안의 seq/smoothTop 기반 블록(ARCHV_EPS·ARCHV_HOLD·3칸 마지노선)이
   직접 잡습니다 — 독립 함수가 아니라 그 흐름 안에 인라인으로 있습니다. 되살리지
   마세요 — 회귀 121 이 새 규칙으로 바뀌었습니다. */
/* ⚠️ v1.70.0 — 아래 경계 (원장님 지시 2026-08-24: 「빨간 X 부분 **해석 불필요**」)
   원장님이 눈 기준선 바로 위(≈7%)에 X 를 찍어 「여기는 읽지 마라」고 하셨습니다 — 눈꺼풀·
   쌍꺼풀 주름 자리입니다. 아래 경계를 눈 기준선 위 **8%** 로 올려 그 띠를 아예 보지 않습니다.
   ⛔ 3% 로 되돌리지 마세요 — 눈꺼풀이 판독에 섞입니다. */
const FB_UP = 0.45, FB_DOWN = 0.08;   // 눈 기준선 위 45% ~ 위 8%
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
  /* ⚠️ v1.69.0 — **위아래는 눈 기준선에서 잰다** (원장님 지시 2026-08-24: 「나머지 안 맞은 것 교정」)
     v1.66~1.68 은 위아래도 **지금 선이 있는 자리** 기준(±1.3h/1.7h)이었습니다. 그런데 원장님
     사진처럼 얼굴이 크게 확대돼 **눈썹이 지금 선보다 훨씬 위에** 있으면, 그 창이 눈썹 몸통을
     가로질러 **모든 열의 윗선이 창 천장에 붙었습니다** — 앞머리·아치·꼬리가 전부 같은 값(112px)
     으로 나오던 실제 증상입니다 (스크린샷에서 자들이 눈썹 위 여백에 뭉쳐 있었습니다).
     눈썹은 언제나 **눈 기준선 위 45% 안**에 있으므로 그 범위를 봅니다.
     ⛔ 위아래를 다시 「지금 선 ±몇 배」로 되돌리지 마세요 — 선이 눈썹에서 멀면 영영 못 찾습니다.
     ⚠️ 좌우(x)는 그대로 **지금 선 기준**입니다 — 관자놀이 머리카락을 막는 자입니다 (1-31). */
  const y0 = Math.max(0, g.h1 * H - FB_UP * H);
  const y1 = Math.max(y0 + 8, g.h1 * H - FB_DOWN * H);
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
const CORE_DROP = 0.45;   // 아랫선 — 제일 진한 곳의 이 비율 아래로 떨어지면 「색이 끝났다」 (v1.75.0)
const CORE_UP = 0.1;      // 윗선 — 위쪽은 더 너그럽게 (v1.77.0 · 아래 주석)
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
      if (len >= 2 && len <= DRAW_MAX_FILL * N) {
        /* ⭐ v1.75.0 — **어두운 핵심**도 같이 재 둔다 (원장님 폰 2026-08-25).
           덩어리가 탐색창 바닥에 닿으면 그 `bot` 은 눈썹 아랫선이 아니라 **창 바닥**입니다.
           그때 쓰려고, 제일 진한 곳에서 위아래로 걸어 나가며 진하기가 `CORE_DROP` 아래로
           떨어지는 자리를 함께 기록합니다 — 「색이 있는 곳까지」를 위아래에도 적용한 것. */
        let pk = t, pv = cut - v[t];
        for (let i = t; i <= b; i++) { const d = cut - v[i]; if (d > pv) { pv = d; pk = i; } }
        let cb = pk; while (cb + 1 <= b && cut - v[cb + 1] >= CORE_DROP * pv) cb++;
        let ct = pk; while (ct - 1 >= t && cut - v[ct - 1] >= CORE_UP * pv) ct--;
        /* ⭐ v3.5.0 — `peak` = 이 덩어리에서 **가장 진한 점**이 문턱(cut)보다 얼마나 더 어두운가.
           `contrast + peak` 가 곧 **피부 대비 절대 어둡기**입니다 — 꼬리 끝 판정이 이걸 씁니다. */
        runs.push({ top: y0 + t, bot: y0 + b, coreTop: y0 + ct, coreBot: y0 + cb, ink, len, peak: pv });
      }
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
  /* ⭐⭐⭐ v3.5.1 — **씨앗이 창 천장에 닿았으면 천장에 안 닿은 덩어리로 다시 고른다**
     (원장님 지시 2026-08-30 · 실사진 실측)
     관자놀이 **머리카락**이 눈썹 꼬리 위를 덮은 열에서는 잉크가 머리카락 쪽이 3~4배
     많습니다. 그래서 씨앗이 머리카락이 되고, 그 열은 `edge`(=머리카락)로 찍혀
     `trimOutside` ⓒ 가 통째로 버립니다 — **꼬리가 아직 그 열에 있는데도** 판독이
     한두 열 일찍 끝났습니다. 실측(원장님 사진, 꼬리 끝 canvas x=84.4):
       x 92  씨앗=꼬리          → 판독됨 (여기서 멈춤)
       x 86  씨앗=머리카락 1072 · **꼬리 288 (core 54)** → 버려짐  ← 여기까지가 정답
       x 80  씨앗=머리카락 1825 · 꼬리 71 (core 31)      → 꼬리 끝 바깥, 버리는 게 맞음
     이 앱의 원칙은 이미 「창 천장으로 빠져나가는 것은 눈썹이 아니라 머리카락」입니다
     (v1.66.0). 그렇다면 **천장에 닿은 덩어리를 씨앗으로 삼아서도 안 됩니다.**
     ⛔ 조건을 빼지 마세요 — 바꾸는 것은 ① 씨앗이 천장에 닿았고 ② 대신 고른 덩어리가
        눈썹 중심(cy)에 **더 가까울 때**뿐입니다. 머리카락만 있는 열은 그대로 머리카락입니다
        (회귀 115·116·131 이 지킵니다). */
  if (cy !== null && runs[si].top <= y0 + 1) {
    let alt = -1;
    for (let i = 0; i < runs.length; i++) {
      if (runs[i].top <= y0 + 1) continue;
      if (alt < 0) { alt = i; continue; }
      const a = runs[i], b = runs[alt];
      const closer = Math.abs(mid(a) - cy) < Math.abs(mid(b) - cy);
      if (a.ink > b.ink * 1.15 || (a.ink > b.ink * 0.85 && closer)) alt = i;
    }
    if (alt >= 0 && Math.abs(mid(runs[alt]) - cy) < Math.abs(mid(runs[si]) - cy)) si = alt;
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
  /* ⭐ v3.5.0 — `core`(피부 대비 절대 어둡기)도 그대로 넘긴다. 꼬리 끝 판정이 씁니다 */
  return keep.map((p, i) => ({ x: p.x, top: m3(i, "top"), bot: m3(i, "bot"), ink: p.ink, dark: p.dark, core: p.core, edge: p.edge }));
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


/* ⚠️⚠️ v1.74.0 — **자는 「색이 있는 곳」까지 간다** (원장님 지시 2026-08-25)
   `trimOutside` ⓑ 는 **잉크(두께 × 진하기)** 로 양 끝을 자릅니다. 눈썹은 앞머리도 꼬리도
   끝으로 갈수록 **얇아지므로** 잉크가 먼저 떨어집니다 — 색은 아직 남아 있는데 잘렸습니다.
   그래서 다듬기가 끝난 뒤 **양 끝을 각각** 다시 이어 붙입니다. 조건은 넷:
     ① 이어져 있다 (중심이 두께의 55% 안 · 두께 1.6배 이내)
     ② 색이 남아 있다 (평균 진하기 ≥ 문턱 × 중앙값)
     ③ 창 천장에 닿지 않았다 (`edge` = 머리카락)
     ④ 안쪽은 센터를 넘지 않는다
   **문턱은 양쪽이 다릅니다** — 안쪽(코 방향)에는 머리카락이 없지만, 바깥(관자놀이)에는
   머리카락·번짐·잔털이 있습니다:
     · 이너 0.25 — 원장님 표시 318.6 ↔ 앱 316
     · 아우터 0.5 — 원장님이 ①얇은헤어(81) ②지금 판독(104) ③맞는 끝(93) 으로 짚어 주셨습니다.
       0.5 면 93 에 서고, 얇은 헤어(81)·번짐은 문턱을 못 넘습니다. 회귀 122·123 이 지킵니다.
   ⛔ 바깥 문턱을 0.4 아래로 내리지 마세요 — 「얇은털 따라가는것 금지」(2026-08-24)가 깨집니다. */
const INNER_DARK = 0.25;   // 안쪽(앞머리) — 이 비율 이상이면 아직 「색이 있다」
const OUTER_DARK = 0.5;    // 바깥(꼬리) — 머리카락·번짐이 있으므로 엄격하게
/* ⭐⭐⭐ v3.5.0 — **꼬리 끝은 「검은 점이 아직 있는가」로 봅니다** (원장님 지시 2026-08-30)
   ───────────────────────────────────────────────────────────────────────────
     「원래는 드로잉이 끝나는 위치는 아치선에서 밖으로 뻗어나오면서 검은 드로잉이 끝나고
       피부색으로 시작되는 지점의 검은라인 끝이 눈꼬리 끝이다」
   지금까지 바깥 문턱은 `dark`(그 열 덩어리의 **평균** 진하기)만 봤습니다. 꼬리는 털이
   성글어져 덩어리 평균이 먼저 떨어지므로, **아직 새까만 털이 남아 있는데도** 끊겼습니다.
   원장님 사진 실측 (아우터가 선 자리 x=813 기준, 중앙값 대비 비율):
       x 810  평균 0.58  ← 문턱 0.5 를 겨우 못 넘어 여기서 멈췄습니다
       x 800  평균 0.82   · 790 0.79 · 780 0.55 · 770 0.59  ← 아직 검은 눈썹
       x 760  평균 0.13                                     ← 진짜 피부
   `core` = **피부보다 얼마나 어두운 점이 있는가**(가장 진한 점 기준)로 다시 재면:
       810 0.84 · 800 1.19 · 790 1.00 · 780 0.82 · 770 0.55 · 760 0.25 ← 여기서 끊깁니다
   그래서 바깥 문턱은 **평균 또는 core** 중 하나만 넘으면 통과입니다 (넓히는 쪽으로만 작동).
   ⛔ core 만 보도록 바꾸지 마세요 — 넓고 옅은 **번짐**은 core 가 절대값으로는 진해서
      그대로 통과합니다. 중앙값 대비 비율(0.5)이 번짐(0.31)을 걸러 냅니다. 회귀 123.
   ⛔ 절대 바닥(DRAW_CONTRAST)을 빼지 마세요 — 맨살로 걸어 나갑니다. 회귀 122. */
const OUTER_CORE = 0.5;    // 바깥(꼬리) — core 가 중앙값의 이 비율 이상이면 아직 「검은 선」

/* ⭐⭐⭐ v3.6.0 — **꼬리 = 윗선과 아랫선이 만나는 자리** (원장님 지시 2026-08-31)
   ───────────────────────────────────────────────────────────────────────────
   원장님 말씀 그대로:

     「이 꼬리 판독의 중요한 키는 단지 사진에 보이는 검은색이 있냐, 이것이 머리카락인지
       아닌지 판독하는 데에 있지 않다. 우리는 **눈썹이라는 디자인을 그린다**는 데에 목적이
       있다. 그러니 눈썹의 디자인을 판독하고, **있을 수 없는 자리에 포인트가 있으면 안 된다**」
     「아치엣지에서 부드럽게 파란색 점들이 아래로 내려온다. 그 선을 따라 (내가 넣는) 점이
       같은 방향으로 내려와야 한다. **털이나 쉐도우 때문에 포인트가 옆으로 갈 수 없다**」
     「아치두께에서 바깥 꼬리로 부드러운 곡선을 그리며 바깥으로 이동한다. 끝으로 갈수록
       커브가 더 생겨 아치엣지에서 내려온 선과 **만난다**. 그것이 꼬리 포인트다」
     「선들은 픽셀에 보이는 대로 최대한 따라온다. 만약 색이 뭉개지거나 머리카락이 헷갈리게
       되어 있어도 **눈썹 모양을 유추하여** 꼬리를 찾는 게 중요하다」

   즉 꼬리는 「마지막으로 읽힌 열」이 아니라 **두 모서리가 만나는 점**입니다. 판독은 흐릿한
   끝에서 먼저 멈추므로, 마지막 구간의 **두께가 줄어드는 기울기**를 그대로 이어서 두께가
   0 이 되는 자리를 꼬리로 봅니다.
   ⛔ 무한정 늘리지 마세요 — `TAIL_EXT_FRAC` 로 판독 구간의 일부까지만 늘립니다. 예전에
      직선 연장을 상한 없이 시도했다가 25px 빗나간 적이 있습니다 (v1.70.0). 회귀 122·123·126. */
const TAIL_FIT_COLS = 8;     // 끝에서 이만큼의 열로 두께 기울기를 잰다
const TAIL_EXT_FRAC = 0.05;  // 판독 구간의 이 비율까지만 바깥으로 늘린다
function tailConverge(seqT, tailIdx) {
  const n = seqT.length;
  if (!n || tailIdx < 1) return null;
  const dir = Math.sign(seqT[tailIdx].x - seqT[Math.max(0, tailIdx - 1)].x) || 1;
  const k = Math.max(4, Math.min(TAIL_FIT_COLS, tailIdx + 1));
  const pts = [];
  for (let i = tailIdx - k + 1; i <= tailIdx; i++) {
    if (i < 0) continue;
    const p = seqT[i];
    pts.push({ u: (p.x - seqT[tailIdx].x) * dir, t: p.bot - p.top, m: (p.top + p.bot) / 2 });
  }
  if (pts.length < 4) return null;
  /* 최소제곱 직선. u 는 꼬리 쪽이 + · t = 두께 · m = 가운데선 */
  const fit = (key) => {
    let su = 0, sv = 0, suu = 0, suv = 0;
    for (const q of pts) { su += q.u; sv += q[key]; suu += q.u * q.u; suv += q.u * q[key]; }
    const nn = pts.length, den = nn * suu - su * su;
    if (!den) return null;
    const b = (nn * suv - su * sv) / den;
    return { b, c: (sv - b * su) / nn };
  };
  const ft = fit("t"), fm = fit("m");
  if (!ft || !fm) return null;
  if (!(ft.b < 0) || !(ft.c > 0)) return null;      // 끝으로 갈수록 두꺼워지면 꼬리가 아니다
  const span = Math.abs(seqT[n - 1].x - seqT[0].x) || 1;
  const ext = Math.min(-ft.c / ft.b, TAIL_EXT_FRAC * span);
  if (!(ext > 0)) return null;
  return { x: seqT[tailIdx].x + dir * ext, y: fm.b * ext + fm.c,
           ext, thickEnd: ft.c, slope: ft.b };
}
/* ⭐⭐⭐ v3.28.0 — **가늘어진 꼬리 심을 끝까지 따라간다** (원장님 확인 2026-09-02, 일자형 파우더 눈썹 실제 사진:
   「아치 세로선 맞고 아치엣지·두께 맞고 꼬리만 안 맞다」 — 노란 십자를 꼬리 끝 **아래·바깥**에 찍어 주심).
   그 사진에서 밴드 판독은 x123 에서 멈췄고(열 평균이 옅어져서), tailConverge 는 5% 상한(12.7px)에 걸려 x110 의
   **가운데 높이**에 섰다. 그런데 픽셀을 보면 x123→x90 까지 폭 2~3px 의 **검은 심 한 줄**이 비스듬히 내려가며
   이어져 있었고(대비 70~85, 몸통 심 120 의 60%), 원장님 십자는 그 심이 끝나는 자리(x≈89, y≈183)였다.
   → 밴드가 멈춘 열부터 바깥으로 **한 열씩** 걸으며, 직전 열의 심 높이 근처(위 5px·아래 8px — 꼬리는 내려간다)에서
     가장 어두운 픽셀을 찾는다. 그 대비가 **몸통 심 대비의 TAIL_TRACE_CORE(40%) 이상**이면 아직 꼬리, 3열 연속
     모자라면 끝. 끝 열의 심 **아랫끝**(대비 절반 아래로 떨어지는 마지막 줄)이 꼬리 자리(x·y 둘 다).
   ⚠️ 이것은 「얇은 털 따라가기」(v1.71.0 금지)가 아니다 — 잔털·번짐은 대비가 몸통의 절반에 못 미치거나(회귀 122·123)
      열마다 높이가 튀어 창(±5/8px)을 벗어난다. **연속된 한 줄의 검은 심**만 따라간다 (v3.5.0 「검은 심이 끝나는 곳」의
      연장선, 회귀 178). 밴드 끝보다 4px 이상 더 나갔을 때만 채택 — 못 나가면 v3.6.x 수렴점 그대로.
   ⛔ 폭주 방지: 판독 구간의 TAIL_TRACE_MAX(35%) 까지만. */
const TAIL_TRACE_CORE = 0.4;   // 몸통 심 대비의 이 비율 이상이어야 아직 꼬리 (실제 사진: 0.5 는 5열 만에 끊김 · 0.4 = 원장님 십자 자리(89,182) · 0.3 도 같은 자리)
const TAIL_TRACE_MAX = 0.35;   // 판독 구간(밴드 폭)의 이 비율까지만 걷는다
const TAIL_TRACE_UP = 5, TAIL_TRACE_DN = 8;   // 직전 심 높이 기준 탐색 창 (위/아래 px)
const TAIL_TRACE_GAP = 3;      // 연속 이 열이 모자라면 끝
function tailTrace(img, seqT, tailIdx) {
  const { W, H } = S.dim;
  if (!img || !seqT || tailIdx < 8 || !W || !H) return null;
  const dir = Math.sign(seqT[tailIdx].x - seqT[Math.max(0, tailIdx - 1)].x) || 1;
  const px = (x, y) => lumaAt(img, W, Math.round(x), Math.round(y));
  /* 열 하나의 심: 창 안 최암부와, 창 위·아래 바깥의 밝은 값(피부)으로 대비를 낸다 */
  const colCore = (x, y0, y1) => {
    const a = Math.max(0, Math.floor(y0)), b = Math.min(H - 1, Math.ceil(y1));
    if (b - a < 2) return null;
    let minL = 1e9, minY = a;
    for (let y = a; y <= b; y++) { const l = px(x, y); if (l < minL) { minL = l; minY = y; } }
    const around = [];
    for (let y = Math.max(0, a - 14); y < a - 4; y++) around.push(px(x, y));
    for (let y = b + 5; y <= Math.min(H - 1, b + 15); y++) around.push(px(x, y));
    if (around.length < 4) return null;
    around.sort((u, v) => u - v);
    const skin = around[Math.floor(around.length * 0.7)];
    return { y: minY, minL, skin, contrast: skin - minL };
  };
  /* 몸통 심 대비 — 밴드 끝 8열의 중앙값 */
  const refs = [];
  for (let i = tailIdx - 7; i <= tailIdx; i++) {
    const q = seqT[i]; if (!q) continue;
    const c = colCore(q.x, q.top - 2, q.bot + 2); if (c && c.contrast > 0) refs.push(c.contrast);
  }
  if (refs.length < 4) return null;
  refs.sort((u, v) => u - v);
  const bodyCore = refs[Math.floor(refs.length / 2)];
  if (!(bodyCore >= DRAW_CONTRAST)) return null;
  const need = TAIL_TRACE_CORE * bodyCore;
  const span = Math.abs(seqT[seqT.length - 1].x - seqT[0].x) || 1;
  const maxX = TAIL_TRACE_MAX * span;
  const last = seqT[tailIdx];
  const c0 = colCore(last.x, last.top - 2, last.bot + 2);
  if (!c0) return null;
  let prevY = c0.y, lastGood = null, gap = 0, walked = 0;
  for (let x = last.x + dir; x >= 1 && x <= W - 2 && walked <= maxX; x += dir, walked++) {
    const c = colCore(x, prevY - TAIL_TRACE_UP, prevY + TAIL_TRACE_DN);
    if (c && c.contrast >= need) { prevY = c.y; lastGood = { x, ...c }; gap = 0; }
    else { gap++; if (gap >= TAIL_TRACE_GAP) break; }
  }
  if (!lastGood) return null;
  /* 끝 열의 심 아랫끝 — 대비의 절반 아래로 떨어지는 마지막 줄 */
  const half = lastGood.skin - lastGood.contrast * 0.5;
  let yb = lastGood.y;
  for (let y = lastGood.y + 1; y <= Math.min(H - 1, lastGood.y + 6); y++) { if (px(lastGood.x, y) < half) yb = y; else break; }
  return { x: lastGood.x, y: yb, coreY: lastGood.y, bodyCore: +bodyCore.toFixed(1), endContrast: +lastGood.contrast.toFixed(1),
           cols: Math.abs(lastGood.x - last.x) };
}
const GROW_STEP = 0.55;    // 중심이 두께의 이 비율 넘게 어긋나면 이어진 것이 아니다
const GROW_MAX = 0.18;     // 판독 폭의 이 비율까지만 이어 붙인다 (폭주 방지)
/* 한쪽 끝을 이어 붙인다. `toInner` 면 안쪽(코 방향), 아니면 바깥(꼬리 방향).
   돌려주는 것은 **이어 붙인 열들** — 끝에서 먼 순서(바깥으로 갈수록 뒤). */
function growEnd(band, kept, toInner) {
  if (!band || !band.length || !kept || !kept.length) return [];
  const cx = S.g.v1 * S.dim.W;
  const first = band[0], last = band[band.length - 1];
  const innerRight = Math.abs(last.x - cx) < Math.abs(first.x - cx);   // 안쪽이 x 큰 쪽인가
  const goRight = toInner ? innerRight : !innerRight;                  // 이어 붙일 방향
  const edge = goRight ? last : first;
  const mid = (a) => { const v = a.slice().sort((x, y) => x - y); return v[Math.floor(v.length / 2)] || 0; };
  const medDark = mid(band.map((p) => p.dark || 0));
  const medCore = mid(band.map((p) => p.core || 0));
  const th = mid(band.map((p) => p.bot - p.top)) || 1;
  const limX = GROW_MAX * (Math.abs(last.x - first.x) || 1);
  const darkMin = (toInner ? INNER_DARK : OUTER_DARK) * medDark;
  /* v3.5.0 — 바깥만 core 기준을 함께 봅니다 (위 주석). 안쪽은 예전 그대로 — 이너는
     이제 `innerDecide` 가 정하고, 여기를 건드리면 눈꺼풀 그늘 문제가 되돌아옵니다. */
  const coreMin = toInner || medCore <= 0 ? null : Math.max(DRAW_CONTRAST, OUTER_CORE * medCore);
  const pool = goRight
    ? kept.filter((p) => p.x > edge.x).sort((a, b2) => a.x - b2.x)
    : kept.filter((p) => p.x < edge.x).sort((a, b2) => b2.x - a.x);
  const add = [];
  let prev = edge;
  for (const p of pool) {
    if (Math.abs(p.x - edge.x) > limX) break;
    if (toInner && (innerRight ? p.x >= cx : p.x <= cx)) break;   // 센터를 넘지 않는다
    if (p.edge) break;                                            // 창 천장에 닿은 열 = 머리카락
    /* 색이 끝났다 — 평균(dark) 도 core 도 못 넘으면 여기가 검은 드로잉의 끝입니다 */
    if ((p.dark || 0) < darkMin && !(coreMin !== null && (p.core || 0) >= coreMin)) break;
    if (p.bot - p.top > th * 1.6) break;                          // 갑자기 두꺼워지면 다른 것
    const c0 = (prev.top + prev.bot) / 2, c1 = (p.top + p.bot) / 2;
    if (Math.abs(c1 - c0) > Math.max(GROW_STEP * th, 6)) break;
    add.push(p); prev = p;
  }
  return add;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⭐⭐⭐ v1.99.0 — **이너(앞머리 세로선) 판독 룰** (원장님 지시 2026-08-29)
   ───────────────────────────────────────────────────────────────────────────
   원장님 말씀 그대로 (프롬프트로 읽으세요):

     「40이 눈 앞꼬리, 밸런스 기본이 되는 선. 48이 맥시멈, 각 나라마다 맥시멈 자리가
       있다. 보통은 45가 맥시멈, 최대 48까지 늘어날 수 있다. 40에서 48까지 들어오면서
       드로잉이 시작되는 굵은 혹은 검정색의 라인을 이너라인으로 선택한다. 만약 이너
       라인을 선택할 수 없을 경우 40에서 45의 중간인 43을 잡아낸다. 그러니 42이거나
       43이거나 44일 수 있다. 42,43,44 중에 근접하게 검정 선이 있을 때 자동으로
       선택해라. 자동으로 선택할 수 없을 경우 중간 43을 선택한다」

     「이너라인을 선택하는 룰은 **가장 높은 값을 선택하는 게 아니다.** 사실 46은 거의
       맨살, 45도 맨살 낮은 점수, 그리고 44에서 조금 더 높은 점수로 띄는 값이 이너라인의
       선택지라고 볼 수 있다. 맨살에 쉐도우와 확연히 조금 더 짙은 선이 시작하는 부분,
       맨살에서 「이곳에 선이 있다」라고 판단되는 점수가 확 띄는 지점이 이너라인으로
       선택될 수 있다」

   ⚠️ **40·43·45·48 은 화면 눈금이 아니라 얼굴 비율입니다.**
   원장님이 부르시는 숫자는 자동 정렬된 화면에서 이너 슬라이더가 가리키는 값(= v2 × 100)
   입니다. 사진 프레임이 달라지면 그 숫자는 흔들리므로, 앱은 같은 뜻을 **얼굴에 붙은 자**로
   저장합니다 — 「내안각 → 센터」 거리를 1.0 으로 본 비율 f:
       f = (이너 − 내안각) / (센터 − 내안각)
   원장님 사진에서 내안각 = 40, 센터 = 53.15 였으므로 1 눈금 = 7.6% 입니다:
       40 → f 0.000 (하한 · 눈 앞꼬리, 이보다 바깥으로 절대 안 나간다)
       43 → f 0.228 (읽을 수 없을 때의 답)
       44 → f 0.304 (원장님 정답 · 케이스 1)
       45 → f 0.380 (보통 맥시멈)
       48 → f 0.608 (절대 맥시멈)
   ⛔ 이 상수들을 화면 눈금(0.40 등)으로 되돌리지 마세요 — 프레임이 바뀌면 다 틀립니다.

   ⚠️ **왜 `growEnd` 로는 안 되는가** (2026-08-29 컨테이너 재현으로 확인)
   `growEnd` 는 열마다 columnRuns 가 스스로 찾은 「제일 진한 덩어리」의 진하기를 봅니다.
   눈썹 앞머리 안쪽에는 **눈꺼풀·눈두덩 그늘**이 이어져 있어서, 눈썹이 끝난 뒤에도 그
   덩어리의 진하기가 중앙값의 30% 대로 계속 남습니다 (재현값 dark 10~13, 문턱 8.5).
   그래서 밴드는 44.0 에서 제대로 끝나는데 `growEnd` 가 48.3 까지 걸어갔습니다.
   결정적 단서: 그 열들의 **두께가 78~111px** — 진짜 눈썹(약 40px)의 2~3배였습니다.
   → 이제 이너는 **두께를 눈썹으로 고정한 창**으로 다시 잽니다 (`innerProfile`).
   ⛔ 이너를 `growEnd` 결과로 되돌리지 마세요 — 회귀 151 이 잡습니다. */

const INNER_F_LO   = 0.000;   // 40 — 눈 앞꼬리(내안각). 하한
const INNER_F_MID  = 0.228;   // 43 — 읽을 수 없을 때
const INNER_F_SOFT = 0.380;   // 45 — **맥시멈** (원장님 확정 2026-08-29: 「이너 45를 맥시멈으로 설정해라」)
const INNER_F_HARD = 0.608;   // 48 — 맨살 골짜기 샘플링·탐색 시작점으로만 쓴다 (답으로는 못 나간다)
/* ⭐ v2.4.0 — **이너의 답은 40~45 를 벗어날 수 없습니다.** 탐색은 48 에서 시작하지만
   (48 쪽이 맨살 기준이라), 선이 45 를 넘게 그려져 있어도 답은 45 로 자릅니다.
   ⛔ 답 클램프를 INNER_F_HARD 로 되돌리지 마세요 — 회귀 160 이 잡습니다. */
/* 「확 띄는 지점」의 잣대 두 개. 맨살(0) ~ 눈썹 잉크(1) 사이에서 이만큼 올라오고,
   동시에 맨살의 이 배는 되어야 「여기서 선이 시작한다」로 봅니다.
   ── 케이스 1 실측 (컨테이너 재현 · 눈썹 잉크 = 100%, 맨살 기준 = 45~48 골짜기) ──
     앱 42.0 → 59% (올라온 정도 0.42 · 맨살의 2.02배)
     앱 43.0 → 45% (0.219 · 1.53배)
     앱 43.5 → 39% (0.138 · 1.33배)  ← **여기서 처음 문턱을 넘는다**
     앱 44.0 → 32% (0.045 · 1.11배)  ← 그 바로 안쪽 = **선의 안쪽 경계 = 정답 44**
     앱 44.5~46 → 32~34% (맨살) · 앱 46.5~47 → 28% (맨살 바닥)
   ⛔ RISE 를 0.10 아래로 내리지 마세요 — 45·46(맨살)의 잔물결까지 선으로 봅니다.
   ⛔ MULT 를 2.0 같은 큰 값으로 올리지 마세요 — 어두운 핵심 평균(INNER_CORE)이라
      맨살도 0 이 아닙니다. 2.2 로 뒀을 때 42 로 밀렸습니다 (2026-08-29 1차 시도). */
const INNER_RISE = 0.12;
const INNER_MULT = 1.28;
const INNER_CORE = 0.35;      // 창에서 제일 어두운 이 비율만 평균 낸다 (가는 선 보존)
const INNER_STEP = 0.010;     // f 를 이 간격으로 훑는다 (≈ 0.13 눈금)
const INNER_RUN  = 2;         // 연속 이만큼 통과해야 인정 (점 하나에 안 끌리게)

/* ═══ 드로잉 케이스 보관함 (원장님 지시 2026-08-29: 「드로잉 케이스마다 저장하고,
   여러 케이스에서 가장 잘 사용되는 것, 판독을 자세히 측정할 수 없을 때 가장 비슷하다고
   생각되는 지점을 선택하도록 룰을 만들어야 한다」)
   ⛔ **사진은 저장하지 않습니다** — 저장소가 Public 이고 고객 얼굴이기 때문입니다.
      숫자만 남깁니다. 케이스가 3개 이상 모이면 「읽을 수 없을 때의 답」이 43 대신
      **케이스들의 중앙값**이 됩니다 = 「가장 잘 쓰이는 지점」. */
const INNER_CASES = [
  /* id · 눈썹 종류 · f(원장님 정답) · app(v2.0.1 판독) · ok(원장님이 자리를 직접 확인)
     ⛔ **사진은 저장하지 않습니다** — 공개 저장소이고 고객 얼굴입니다. 숫자만.
     ⚠️ f 는 얼굴에 붙은 값이라 **앱을 고쳐도 그대로**입니다. app 열만 다시 잽니다. */
  { id: 1, kind: "드로잉(굵은 선)",    f: 0.411, app: 45.1, ok: false },
  { id: 2, kind: "짙은 파우더 반영구",  f: 0.555, app: 48.0, ok: false },
  { id: 3, kind: "자연 결 눈썹",       f: 0.456, app: 46.7, ok: false },
  { id: 4, kind: "옅은 반영구",        f: 0.198, app: 40.4, ok: false },
  /* 5~8 은 원장님이 **앞꼬리 자리까지 확대해서 확인**해 주신 케이스입니다
     (2026-08-29 「빨간 선이 맞다」 · 「맞다 이대로 넣어라」). 검출기 검증의 정답지입니다. */
  { id: 5, kind: "옅은 자연 눈썹 ①",   f: 0.137, app: 43.0, ok: true },
  { id: 6, kind: "옅은 자연 눈썹 ②",   f: 0.183, app: 42.2, ok: true },
  { id: 7, kind: "옅은 자연 눈썹 ③",   f: 0.144, app: 47.2, ok: true },
  { id: 8, kind: "옅은 자연 눈썹 ④",   f: 0.388, app: 45.4, ok: true },
];
/* ⚠️ **대체값은 43 으로 고정합니다** (원장님 재확인 2026-08-29, 케이스 4를 보시고:
     「44가 맞다 하지만 **판독 안될 경우 43도 괜찮아 보인다**」).
   케이스 4개의 중앙값을 쓰면 47 이 나오는데, 그것은 「짙은 반영구가 많다」는 뜻이지
   「못 읽었을 때 47 에 세우라」는 뜻이 아닙니다 — 못 읽은 사진에 47 을 세우면 미간
   맨살에 설 위험이 큽니다. `INNER_CASES` 는 **기록·검증표**로만 씁니다.
   ⛔ 케이스 중앙값을 대체값으로 되돌리지 마세요 — 회귀 151 이 잡습니다. */
function innerCaseF() {
  return INNER_F_MID;
}

/* ⭐⭐⭐ v2.0.1 — **눈 앞꼬리를 사진에서 직접 찾습니다** (원장님 지시 2026-08-29:
   「시스템 내부에서 눈금자 이용하여 눈 앞꼬리를 **자동으로 인식**하라. 그게 AI가 하는
    일이다. 나는 너가 똑똑해지라고, 내 경험을 배우라고 지시한 것이다」)

   원리 — 원장님이 정해 주신 정의(위·아래 눈꺼풀이 만나는 코쪽 끝점)를 픽셀로 옮긴 것:
     **눈꺼풀 틈의 세로 높이는 코 쪽으로 갈수록 줄어 앞꼬리에서 0 이 된다.**
       ① 동공에서 코 쪽으로 열마다 「피부보다 CANTHUS_DARK 어두운 픽셀 수」= 틈 높이를 잰다
       ② 틈이 가장 넓은 열(눈 한가운데)을 찾고, 거기서 코 쪽으로 걸어가
       ③ 높이가 최대의 CANTHUS_AP 아래로 CANTHUS_RUN 열 연속 떨어지는 자리 = **앞꼬리**
   ⛔ 「제일 어두운 열의 끝」으로 되돌리지 마세요 — 코 그늘·눈물샘을 눈으로 오인해
      앞꼬리를 코 쪽으로 10px 넘게 밀어냅니다 (실측).
   원장님이 확인해 주신 4장 8점 기준 **평균 0.58 · 최대 0.94 눈금** — 손으로 짚던
   1.2~3.3 눈금보다 훨씬 안정적입니다. 회귀 154 가 지킵니다. */
const CANTHUS_BAND = 16;   // 눈 높이 위아래 이만큼(px)만 본다
const CANTHUS_DARK = 30;   // 피부보다 이만큼 어두우면 「눈 틈」
const CANTHUS_AP = 0.30;   // 틈 높이가 최대의 이 비율 아래면 닫힌 것
const CANTHUS_RUN = 3;     // 이만큼 연속 닫혀야 인정 (점 하나에 안 끌리게)
function findCanthus(img, px, py, towardX) {
  const { W, H } = S.dim;
  if (!img || !W || !H) return null;
  const y0 = Math.max(0, Math.round(py - CANTHUS_BAND));
  const y1 = Math.min(H - 1, Math.round(py + CANTHUS_BAND));
  if (y1 - y0 < 8) return null;
  const dir = towardX > px ? 1 : -1;
  const xs = [];
  for (let i = 0; i <= Math.abs(towardX - px); i++) {
    const x = Math.round(px + dir * i);
    if (x < 0 || x >= W) break;
    xs.push(x);
  }
  if (xs.length < 12) return null;
  const all = [];
  for (const x of xs) for (let y = y0; y <= y1; y += 2) all.push(lumaAt(img, W, x, y));
  all.sort((a, b) => a - b);
  const skin = all[Math.floor(all.length * 0.8)];
  const hs = xs.map((x) => {
    let n = 0;
    for (let y = y0; y <= y1; y++) if (lumaAt(img, W, x, y) < skin - CANTHUS_DARK) n++;
    return n;
  });
  let im = 0;
  for (let i = 1; i < hs.length; i++) if (hs[i] > hs[im]) im = i;
  if (hs[im] < 6) return null;
  const thr = hs[im] * CANTHUS_AP;
  let run = 0;
  for (let i = im; i < hs.length; i++) {
    if (hs[i] <= thr) { run++; if (run >= CANTHUS_RUN) return xs[i - CANTHUS_RUN + 1]; }
    else run = 0;
  }
  return null;
}
/* 동공 두 개(캔버스 px)에서 양쪽 앞꼬리를 찾아 **눈금의 자**를 만든다.
   찾지 못하면 null → 부르는 쪽이 예전 비율값(R_INNER)으로 남는다. */
function detectFaceRef(img, a, b) {
  const W = S.dim.W;
  if (a.x > b.x) { const t = a; a = b; b = t; }
  const mid = (a.x + b.x) / 2;
  const cl = findCanthus(img, a.x, a.y, mid);
  const cr = findCanthus(img, b.x, b.y, mid);
  if (cl === null || cr === null) return null;
  const gap = cr - cl, eye = b.x - a.x;
  /* 상식 검사 — 앞꼬리 간격은 동공 간격의 30~90% 안에 있어야 한다 */
  if (gap < eye * 0.30 || gap > eye * 0.90) return null;
  return { a: cl / W, c: (cl + cr) / 2 / W };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⭐⭐⭐ v2.1.0 — **앞머리 판독 룰** (원장님 지시 2026-08-29, 이너 룰과 같은 방식)
   ───────────────────────────────────────────────────────────────────────────
   원장님 말씀 그대로 (프롬프트로 읽으세요):

     「눈 윗부분부터 올라가서 이너 부분에 닿는 첫 검은 선.
       눈 윗부분에서 올라가면 **피부색이 이어지다가 어느 한 지점에서 검은색으로
       보이는 지점**이 앞머리다」

   구현 — 이너 세로선 자리에서 **세로로** 훑습니다:
     ① 눈(h1) 위로 FRONT_LASH_GAP 띄운 곳에서 시작 — 속눈썹·아이라인을 건너뛴다
     ② 이너에서 눈썹 몸통 방향으로 FRONT_COLS 개 열을 잡고, 열마다 **아래→위**로 걷는다
     ③ 「검은색」의 잣대 = 피부와 그 열의 제일 어두운 값의 **중간** (최소 FRONT_DARK_MIN)
        — 눈꺼풀 그늘은 어둡지만 「검은색」의 절반에 못 미쳐 통과한다
     ④ 창(9줄) 안에 7줄 이상 어두워야 인정 — **얇은 선(쌍꺼풀 주름·아이라인)은
        검은색이어도 눈썹이 아니다.** 두께가 눈썹의 증거다 (이너 룰과 같은 교훈)
     ⑤ 열들의 중앙값 = 앞머리. 3열 미만이면 포기 → 기존 밴드 판독을 그대로 둔다
   ⛔ ④를 빼지 마세요 — 쌍꺼풀 주름(5px 선)에 앞머리가 내려앉습니다. 회귀 155 가 잡습니다. */
const FRONT_COLS = 5;         // 이너에서 눈썹 방향으로 훑는 열 수
const FRONT_SPAN = 0.05;      // 그 열들이 퍼지는 폭 (화면 비율)
const FRONT_LASH_GAP = 0.07;  // 눈(h1) 위로 이만큼 띄우고 시작 — 속눈썹·아이라인 방어
const FRONT_UP = 0.42;        // h1 에서 위로 이 비율까지만 올라간다
const FRONT_HALF = 0.5;       // 「검은색」 문턱 = 피부 ↔ 제일 어두운 값의 중간
const FRONT_DARK_MIN = 25;    // 이 대비도 없으면 검은 것이 없는 열 (시도 자체를 안 한다)
const FRONT_WIN = 9;          // 두께 창 (px)
const FRONT_HIT = 7;          // 창 안에서 이만큼 어두워야 눈썹 (얇은 선 방어)
const FRONT_SKIN = 5;         // 검은 것 **바로 앞에 피부가 이만큼 이어져야** 인정
/* ⭐ v2.1.1 — **앞머리 넘버링 (대체값)** — 원장님 지시 2026-08-29 (폰 스크린샷의 빨간 선):
   「빨간 선은 눈으로부터 올라와 **대체값이 필요할 때 사용할 넘버링**, 파란색이 옳바른 (자리)」
   이너의 43 과 같은 구조를 **세로**로 만듭니다. 자는 같은 자 — 「내안각→센터」의 1/13.15
   가 1 눈금이고, **눈(동공 높이)에서 위로** 몇 눈금인지로 앞머리를 셉니다.
   확정 케이스 5장 실측: 9.4 · 11.4 · 11.7 · 11.7 · 13.5 → **중앙값 11.7 눈금**.
     · 판독이 아예 없는 시작 배치(placeLinesFromEyes)는 이 넘버링으로 놓는다
     · 판독(밴드)이 있어도 이 범위(7~16)를 벗어나면 눈꺼풀·이마를 읽은 것 → 11.7 로 대체
   ⛔ 동공 간격 비율(up 0.78)로 되돌리지 마세요 — 얼굴마다 흔들리던 바로 그 짐작입니다. */
/* ⚠️⚠️ v2.2.3 — **0 을 동공 중심 실측으로 바로잡고 전부 다시 잰 값입니다** (0-4 규칙).
   그 전 값(11.6·하한 7)은 제 손 0 이 평균 1.3 눈금 낮았던 상태에서 잰 것이라 치우쳐
   있었습니다 — 원장님이 4번 사진에 동공 십자를 그려 확인해 주셨습니다 (실측 3.8 눈금 차).
   확정 6건(바로잡은 눈금): 7.3 · 7.9 · 9.4 · 10.2 · 10.9 · 13.3 → 중앙값 9.8.
   (원장님 정답: 4번=구눈금 14 → 10.2 · 7번=구눈금 9 → 7.3 으로 환산)
   케이스가 늘 때마다 갱신합니다 (판독-룰 2-7). */
/* 확정 7건 (원장님 최종 확인 2026-08-29): 7.3 · 7.9 · 9.4 · 10.2 · 10.9 · 11.0(케이스 2) · 13.3
   — 4번=10.2 · 7번=7.3 은 확인 사진으로 재확인 완료 ⭐ */
const FRONT_T_MID = 10.2;     // 눈 위 눈금 — 대체값 (확정 케이스 7건의 중앙값)
const FRONT_T_LO = 6;         // 이보다 가까우면 눈꺼풀을 읽은 것 (실측 최소 7.3 아래 여유)
const FRONT_T_HI = 16;        // 이보다 멀면 이마·머리카락을 읽은 것
/* 눈금 1칸의 세로 px = (내안각→센터 px)/13.15. anchor 는 화면 폭 비율이므로 ×W */
function frontTickPx() {
  const a = innerAnchor();
  return a ? (a * S.dim.W) / 13.15 : null;
}
/* ─────────────────────────────────────────────────────────────────────────
   ⭐ v2.5.0 — **한 열을 걸어 「두꺼운 검은 것」을 찾는 공용 판독** (원장님 지시 2026-08-29:
   「앞머리, 앞두께 자동 위치조정 프로그래밍과 **같은 방법으로** 아치엣지 아치두께 고도화해라」)

   v2.1~2.4 에서 앞머리·앞두께가 쓰던 규칙을 **그대로 꺼내** 아치엣지·아치두께가 같은 함수를
   쓰게 했습니다. ⛔ 이 규칙을 두 군데서 키우지 마세요 — 한쪽만 고치면 두 판독이 서로 다른
   말을 하게 됩니다 (명령서 §0-X 의 「두 군데서 자라면 서로 어긋난다」).

   한 열을 **아래(눈) → 위**로 걸으며 후보를 **전부** 모읍니다:
     ① 피부가 FRONT_SKIN 줄 이상 이어진 **뒤에** 오는 것만 후보 (눈화장·아이라인 방어)
     ② 창 FRONT_WIN 줄 중 FRONT_HIT 줄이 어두워야 눈썹 (쌍꺼풀 주름 같은 얇은 선 방어)
     ③ 「검은색」 문턱은 그 열의 피부 ↔ 최암부의 **중간 — 상대값만** (어두운 조명 방어)
     ④ 윗끝(=두께 선)은 우선순위 ① 피부 복귀 → ② 어둡기 퍼센트 하락 (BASELINE 1-68)
   돌려주는 것: `[{ y, top, ceil }]` — y=아랫끝 · top=윗끝(캔버스 px) · ceil=창 천장에 닿음.
   ⚠️ `ceil` 은 **못박음 신호**입니다 — 창이 눈썹을 가로지른 것이므로 부르는 쪽이 버립니다. */
function darkBlobsUp(img, x, yB, yT, tMin, tMax) {
  const { W } = S.dim;
  if (!img || x < 0 || x >= W || yB - yT < FRONT_WIN + 6) return null;
  const col = [];                                        // col[0] = 맨 아래(yB)
  for (let y = yB; y >= yT; y--) col.push(lumaAt(img, W, x, y));
  const sorted = col.slice().sort((a, b) => a - b);
  const skin = sorted[Math.floor(sorted.length * 0.75)];
  const darkest = sorted[Math.floor(sorted.length * 0.03)];
  if (skin - darkest < FRONT_DARK_MIN) return null;      // 검은 것이 없는 열
  /* ⚠️ 문턱은 **상대값만** 씁니다 — 절대값(예: 피부−40)을 섞으면 조명이 어두운 사진에서
     눈썹의 절반이 문턱 위에 남아 두께 창(7/9)을 못 채웁니다 (실측: 8장 중 6장 실패). */
  const thr = skin - (skin - darkest) * FRONT_HALF;
  const softThr = skin - (skin - darkest) * FT_SOFT;
  const dark = col.map((v) => v < thr);
  const u2 = frontTickPx();
  const nC = col.length;
  const pc = (y) => { const yy = Math.max(0, Math.min(nC - 1, y));
    return Math.max(0, Math.min(1, (skin - col[yy]) / Math.max(1, skin - darkest))); };
  const sm = (y) => (pc(y - 1) + pc(y) + pc(y + 1)) / 3;
  const out = [];
  let light = 0;
  for (let i = 0; i + FRONT_WIN <= dark.length; i++) {
    if (light >= FRONT_SKIN) {
      let hit = 0;
      for (let j = 0; j < FRONT_WIN; j++) if (dark[i + j]) hit++;
      if (hit >= FRONT_HIT) {
        let i0 = i; while (i0 < i + FRONT_WIN && !dark[i0]) i0++;   // 창 안 첫 어두운 줄
        /* 윗끝 — 짙은 검정이 끝나도 옅은 윗털·파우더 그라데이션(FT_SOFT)이 이어지면 계속,
           피부가 FT_SKIN 줄 연속되면 끝 (v2.3.0 원장님 확정) */
        let j = i0, last = i0, gap = 0, clearSkin = false;
        while (j + 1 < dark.length) {
          j++;
          if (col[j] < softThr) { last = j; gap = 0; }
          else { gap++; if (gap >= FT_SKIN) { clearSkin = true; break; } }
        }
        let ftop = last;
        const thTk = u2 ? (last - i0) / u2 : null;
        /* 우선순위 ② — 피부 복귀가 불명확하거나 두께가 상식 범위 밖이면
           어둡기 퍼센트가 **가장 크게 낮아지는 자리**를 고른다 (v2.4.0 원장님 확정) */
        if (!clearSkin || (thTk !== null && (thTk < tMin || thTk > tMax))) {
          const lim = Math.min(nC - 2, u2 ? i0 + Math.round(tMax * u2) : nC - 2);
          let bj = -1, bd = 0;
          for (let y2 = i0 + 1; y2 <= lim; y2++) {
            const drop = sm(y2) - sm(y2 + 2);
            if (drop > bd) { bd = drop; bj = y2; }
          }
          if (bj > i0 && bd >= FT_P2_MIN) ftop = bj;
        }
        out.push({ y: yB - i0, top: yB - ftop, ceil: ftop >= nC - 2 });
        while (i + FRONT_WIN <= dark.length) {           // 이 덩어리를 지나쳐 계속 걷는다
          let h2 = 0;
          for (let j2 = 0; j2 < FRONT_WIN; j2++) if (dark[i + j2]) h2++;
          if (h2 < 2) break;
          i++;
        }
        light = 0;
        continue;
      }
    }
    /* 피부 세기는 **너그럽게** — 잔털·주근깨 한 줄로 끊기지 않게, 두 줄 연속 어두울 때만 0 */
    if (dark[i]) { if (i > 0 && dark[i - 1]) light = 0; }
    else light++;
  }
  return out;
}

/* 앞머리·앞두께 — 이너 자리에서 위로 걸어 「피부 다음의 두꺼운 검은 것」을 찾는다.
   후보 고르기는 **넘버링**이 한다: 눈 위 FRONT_T_LO~FRONT_T_HI 안의 **가장 아래** 후보
   (쌍꺼풀·주름 쉐도우 방어 · v2.1.2). 3열 미만이면 포기 → 기존 밴드 판독 유지. */
function frontDecide(img) {
  const { W, H } = S.dim;
  if (!img || !W || !H) return null;
  const cx = S.g.v1 * W;
  let ix = S.g.v2 * W;
  /* ⭐ v2.4.0 — 이너 선이 45 로 캡되어도 훑는 열은 **캡 전 실제 드로잉 시작점**(fRaw)에
     둡니다 — 열을 캡 자리로 옮기면 파우더·짙은 드로잉 사진의 앞머리가 밀립니다. */
  const ir = S.innerRead;
  if (ir && ir.fRaw != null && ir.fRaw > INNER_F_SOFT && ir.anchor)
    ix = clamp(S.g.v1 - ir.anchor * (1 - ir.fRaw), 0.02, 0.98) * W;
  const dir = ix < cx ? -1 : 1;                          // 눈썹 몸통 방향 = 센터 반대쪽
  const ez = eyeZeroY();                                 // 넘버링의 0 = 동공 중심 (v2.2.2)
  const yB = Math.round((ez - FRONT_LASH_GAP) * H);      // 시작(아래)
  const yT = Math.max(2, Math.round((ez - FRONT_UP) * H));
  if (yB - yT < FRONT_WIN + 6 || yB >= H) return null;
  const u0 = frontTickPx(), eyePx = ez * H;
  const ys = [];
  for (let k = 1; k <= FRONT_COLS; k++) {
    const x = Math.round(ix + dir * (FRONT_SPAN * W * k) / FRONT_COLS);
    const cands = darkBlobsUp(img, x, yB, yT, FT_T_MIN, FT_T_MAX);
    if (!cands || !cands.length) continue;
    /* ⭐ v2.1.3 — **하한은 절대 규칙**: 7 눈금 미만은 후보 자격이 없다. 범위 안에 아무것도
       없으면 이 열은 포기한다 (→ 대체값 경로). ⛔ 낮은 후보라도 쓰던 옛 방식으로 되돌리지 마세요. */
    let pick = null;
    if (u0) {
      for (const c of cands) {
        const t = (eyePx - c.y) / u0;
        if (t >= FRONT_T_LO && t <= FRONT_T_HI) { pick = c; break; }
      }
    } else pick = cands[0];
    if (pick) ys.push(pick);
  }
  if (ys.length < 3) return null;
  /* 앞머리 = 아랫끝들의 중앙값 · 앞두께 = 윗끝들의 중앙값 */
  const bots = ys.map((c) => c.y).sort((a, b) => a - b);
  const tops = ys.map((c) => c.top).sort((a, b) => a - b);
  return { y: bots[Math.floor(bots.length / 2)], top: tops[Math.floor(tops.length / 2)] };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⭐⭐⭐ v2.5.0 — **아치엣지·아치두께 판독 룰** (원장님 지시 2026-08-29:
   「앞머리, 앞두께 자동 위치조정 프로그래밍과 **같은 방법으로** 아치엣지 아치두께 고도화해라」)
   ───────────────────────────────────────────────────────────────────────────
   앞머리와 **완전히 같은 방법**입니다 — 다른 것은 「어느 열을 훑는가」와 「어느 후보를 고르는가」뿐:

   | | 앞머리·앞두께 | 아치엣지·아치두께 |
   |---|---|---|
   | 훑는 열 | 이너(v2) 자리에서 눈썹 몸통 쪽 5열 | **산꼭대기(peak)** 좌우 5열 |
   | 아랫끝 | 앞머리 | **아치두께** |
   | 윗끝 | 앞두께 | **아치엣지** |
   | 후보 자격 | 눈 위 7~16 눈금 | 눈 위 6 눈금 이상 · **앞머리보다 위**(해부학) |

   ⚠️ **훑는 열은 아치선(v6)이 아니라 산꼭대기입니다.** 아치선은 「꺾임점」(BASELINE 1-34)이라
   봉우리보다 바깥이고, 거기서 재면 아치 자가 산이 아닌 자리의 눈썹을 잽니다.
   자를 그리는 기둥(v6)과 **재는 자리(peak)** 는 다릅니다 — 섞지 마세요.

   ⚠️ **아치두께는 앞머리보다 아래로 못 내려갑니다** (원장님 지시 2026-08-27 · BASELINE 1-45).
   그래서 후보 자격에 그 순서를 그대로 넣었습니다 — 새 상수를 만든 것이 아니라 이미 있는
   원장님 규칙을 후보 고르기에 쓴 것입니다.

   ⛔ **보통값(대체값)은 만들지 않았습니다.** 앞머리(10.2)·앞두께(6.0)는 원장님이 케이스로
   확정해 주신 숫자입니다. 아치에는 그 확정 케이스가 아직 없으므로, 판독에 실패하면
   **조용히 기존 밴드 판독을 그대로 둡니다** (앞머리와 같은 안전판). 케이스를 주시면
   그때 넘버링을 확정합니다. */
const ARCH_COLS = 5;          // 산꼭대기 좌우로 훑는 열 수
const ARCH_SPAN = 0.016;      // 그 열들이 퍼지는 반폭 (화면 비율) — 봉우리 주변만
const ARCH_UP = 0.50;         // 눈(0) 위로 이 비율까지 — 아치는 앞머리보다 위에 있다
const ARCH_T_LO = FRONT_T_LO; // 눈 위 이 눈금 미만은 눈꺼풀 (앞머리와 같은 하한)
const ARCH_T_HI = 26;         // 이보다 멀면 이마·머리카락 (확대 사진 여유 · 앞머리 16 보다 넉넉히)
const AT_T_MIN = 2, AT_T_MAX = 14;   // 두께 상식 범위 — **탐색 보조일 뿐 보통값이 아니다**
/* ⭐⭐⭐ v2.6.0 — **아치 표준값** (원장님 지시 2026-08-29, 실제 사진 5장 판정 뒤):
     「1번 판독 실패시 표준값 : 아치두께는 앞머리 측정값에서 3칸 위로,
       아치엣지는 아치두께 위치에서 5칸 위로 측정한다」

   v2.5.0 에는 아치 표준값이 없어서, 판독이 포기하면 **밴드값이 그대로 남았습니다**.
   실제 사진 1번에서 그 밴드값이 눈썹 위로 4.9 눈금 떠 있었습니다 (원장님 판정: 틀림).
   이제 판독이 포기하면 밴드값을 그대로 두지 않고 **앞머리에서 재서** 놓습니다.
   앞머리는 이미 보통값(10.2)·하한(6)이 지키고 있으므로, 아치도 그 위에 얹힙니다.

   ⚠️ 눈금 자(1 눈금 = 내안각 기준)가 없으면 적용하지 않습니다 — 잴 자가 없는데
      「3칸 위」를 말할 수 없습니다. 그때는 예전처럼 밴드값이 남습니다.
   ⚠️ 이 값은 **판독이 실패했을 때만** 씁니다. 판독이 성공하면 사진에서 읽은 값이 이깁니다. */
const AT_FROM_FRONT = 3;      // 아치두께 = 앞머리에서 위로 이 눈금
const ARCH_FROM_AT = 5;       // 아치엣지 = 아치두께에서 위로 이 눈금
/* ⭐⭐⭐ v2.7.0 — **아치엣지만 잡힌 경우의 아치두께 대체값** (원장님 지시 2026-08-29:
     「아치엣지가 잡힌다 + 아치두께 안 잡히는 경우 = 아치엣지에서 5칸 아래 위치한다 대체값」)
   ⚠️ 「아치두께가 안 잡힌다」의 뜻을 좁게 정했습니다 — **아랫끝이 넘버링 하한(6 눈금) 아래로
      새어 내려간 경우**입니다. 그건 눈썹이 아니라 눈꺼풀·속눈썹까지 읽었다는 뜻이라
      「두께를 못 잡은 것」이 맞습니다.
   ⛔ **해부학 순서 위반(아치두께가 앞머리보다 아래)은 여기에 넣지 마세요.** 그건 덩어리
      자체가 눈썹이 아닐 수 있다는 신호라 윗끝도 못 믿습니다 — 회귀 162ⓒ 가 잡습니다. */
const AT_FROM_ARCH = 5;       // 아치두께 = 아치엣지에서 아래로 이 눈금 (대체값)
/* ⭐⭐⭐ v2.8.0 — **아치엣지의 맥시멈** (원장님 지시 2026-08-29:
     「아치 엣지가 잡히지 않거나, 위에 머리카락으로 혼동이 있을 경우 **맥시멈 위치 추가** —
       앞두께 위로 5칸 이상 넘어가는 곳을 임의로 잡지 않는다」)
   아치두께에는 이미 마지노선(1-45 · 앞머리보다 아래로 못 감)이 있습니다. 아치엣지에는
   위쪽 마지노선이 없어서 머리카락·이마로 떠오를 수 있었습니다 — 그 짝을 맞춘 것입니다. */
const ARCH_MAX_OVER_FT = 5;   // 아치엣지는 앞두께 위로 이 눈금을 넘지 않는다
/* 앞두께 자리(캔버스 y)와 눈금 1칸(px)에서 아치엣지가 갈 수 있는 **가장 위** 를 낸다 */
function archEdgeMax(ftY, u) {
  return u && isFinite(ftY) ? ftY - ARCH_MAX_OVER_FT * u : null;
}
/* 앞머리 자리(캔버스 y)와 눈금 1칸(px)에서 아치 두 줄을 낸다 — 원장님 규칙 그대로 */
function archStandard(frontY, u, ftY) {
  if (!u || !isFinite(frontY)) return null;
  const thick = frontY - AT_FROM_FRONT * u;
  let edge = thick - ARCH_FROM_AT * u;
  const m = archEdgeMax(ftY, u);                         // 맥시멈 — 앞두께 위로 5칸까지
  if (m !== null && edge < m) edge = m;
  return { thick, edge };
}
function archDecide(img, peakX, info) {
  const { W, H } = S.dim;
  if (info) info.seen = 0;
  if (!img || !W || !H || peakX === null || peakX === undefined) return null;
  const ez = eyeZeroY();                                 // 넘버링의 0 = 동공 중심 (v2.2.2)
  const yB = Math.round((ez - FRONT_LASH_GAP) * H);
  const yT = Math.max(2, Math.round((ez - ARCH_UP) * H));
  if (yB - yT < FRONT_WIN + 6 || yB >= H) return null;
  const u = frontTickPx(), eyePx = ez * H;
  const frontTk = u ? (eyePx - S.g.front * H) / u : null;
  const tops = [], bots = [], edgeOnly = [], thickOnly = [], half = (ARCH_COLS - 1) / 2;
  for (let k = 0; k < ARCH_COLS; k++) {
    const x = Math.round(peakX + ((k - half) * ARCH_SPAN * W) / half);
    const cands = darkBlobsUp(img, x, yB, yT, AT_T_MIN, AT_T_MAX);
    if (!cands || !cands.length) continue;
    if (info) info.seen++;                                 // v2.6.0 — 「눈썹처럼 보이는 것」이 있었는가
    let pick = null, anatomyCut = false;
    for (const c of cands) {
      if (c.ceil) {
        /* ⭐ v2.8.0 — 창 천장에 닿음 = **윗끝(아치엣지)을 못 믿는다** (머리카락·확대 사진).
           원장님 2026-08-29: 「아치엣지가 잡히지 않거나 위에 머리카락으로 혼동이 있을 경우」
           → 윗끝은 버리고 **아랫끝만** 챙긴다. 아치엣지는 나중에 아치두께에서 5칸 위로. */
        if (u) {
          const tb = (eyePx - c.y) / u;
          if (tb >= ARCH_T_LO && tb <= ARCH_T_HI
              && !(frontTk !== null && tb < frontTk - 1.5)) thickOnly.push(c.y);
        }
        continue;                                        // 못박음 (판독-룰 3장)
      }
      if (u) {
        const t = (eyePx - c.y) / u;
        if (t < ARCH_T_LO || t > ARCH_T_HI) continue;    // 눈꺼풀·이마
        /* 해부학 순서 — 아치두께 ≤ 앞머리 (원장님 2026-08-27). 1.5 눈금 여유는
           일자 눈썹처럼 둘이 거의 같은 높이인 경우를 위한 것입니다. */
        if (frontTk !== null && t < frontTk - 1.5) { anatomyCut = true; continue; }
      }
      pick = c; break;                                   // 자격 있는 **가장 아래** 후보
    }
    if (!pick) {
      /* v2.7.0 — 아랫끝이 **넘겨받을 수 없는 자리(넘버링 하한 아래)** 로 새어 내려갔다.
         윗끝이 멀쩡하면 윗끝만 챙긴다 — 두께는 나중에 아치엣지에서 5칸 아래로 놓는다. */
      if (u && !anatomyCut) {                            // ⛔ 해부학으로 잘린 열은 윗끝도 못 믿는다 (162ⓒ)
        for (const c of cands) {
          if (c.ceil) continue;
          const tt = (eyePx - c.top) / u;
          if (tt < ARCH_T_LO || tt > ARCH_T_HI) continue;   // 윗끝이 멀쩡해야 아치엣지로 쓴다
          /* ⚠️ 아랫끝은 따로 안 봅니다 — 여기 온 시점에 **자격 있는 아랫끝은 이미 없습니다**
             (있었으면 위에서 pick 이 됐습니다). 돌연변이 검사로 확인한 사실이라, 조건을 하나 더
             넣어도 아무 것도 더 막지 못합니다(막지 못하는 조건은 테스트도 못 합니다). */
          edgeOnly.push(c.top); break;
        }
      }
      continue;
    }
    bots.push(pick.y); tops.push(pick.top);
  }
  /* ⭐⭐⭐ v2.8.0 — **아치두께는 아치엣지에서 5칸보다 더 내려가지 않는다** (원장님 지시 2026-08-29:
       「판별이 두께의 경우 매우 심중한 문제사항이 아니므로 남겨두지 말고,
         아치엣지가 잡힐 경우 아래 5칸 아래 두면 된다」)
     ① 아랫끝이 아예 없으면(잔털이 하한 아래로 샌 열들) → **아치엣지 + 5칸**
     ② 아랫끝을 읽었으면 그것을 쓰되 **5칸을 넘지 못한다** — 넘었다면 잔털·번짐을 센 것이다
        (실제 사진 5번: 읽은 값 8.5 → 5칸 자리 9.3 · 원장님 정답 9.5)
     ⚠️ ②를 「무조건 5칸」으로 바꾸지 마세요 — 원장님이 **그려 놓은 드로잉**은 아치가 5칸보다
        얇을 수 있고, 그때는 그린 선의 아랫끝이 정답입니다 (회귀 87·90·91·92·115·116·128). */
  /* ⭐⭐⭐ v3.27.0 — **② 「5칸을 넘지 못한다」는 폐지** (원장님 확정 2026-09-02, 실제 사진(일자형 파우더 눈썹,
     아치 두께 8.4칸)으로 A~D 네 가지를 비교한 뒤: 「두께는 C(읽은 값 그대로)가 맞다」).
     이 눈썹은 눈 사이가 좁아 눈금 1칸이 작게 잡혀 두께가 8~12칸으로 계산되는데, 5칸 상한이 정답(아랫끝)을
     잘라 아치두께를 눈썹 한가운데에 세웠다. 이제 아랫끝을 읽었으면 **읽은 값 그대로**. ①(아랫끝을 아예 못
     읽은 열들 → 아치엣지+5칸 대체값, 회귀 164)은 그대로 둔다. ⛔ 사진 5번(읽은 값 8.5 → 상한 9.3 → 정답 9.5)
     같은 잔털 케이스는 이제 1칸쯤 낮게 잡힐 수 있다 — 원장님이 그것을 알고 C 를 고르셨다. */
  const cap = u ? AT_FROM_ARCH * u : null;
  /* ⭐ v2.8.0 — 아치엣지 맥시멈 (위 ARCH_MAX_OVER_FT 주석). ⚠️ **밴드 판독에는 걸지 않습니다** —
     밴드가 읽는 것은 원장님이 그려 놓은 드로잉이고, 드로잉은 그 자체가 정답입니다. */
  const eMax = archEdgeMax(S.g.frontThickness * H, u);
  const capEdge = (e) => (eMax !== null && e < eMax ? eMax : e);
  const mid = (a) => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const edges = tops.concat(edgeOnly), thicks = bots.concat(thickOnly);
  if (edges.length >= 3) {                               // ① 아치엣지를 읽었다 — 여기가 기준
    const edge = capEdge(mid(edges));
    let thick = bots.length >= 3 ? mid(bots) : null;
    if (cap && thick === null) thick = edge + cap;      /* v3.27.0 — 상한(Math.min) 제거, 대체값만 */
    if (thick === null) return null;                     // 자도 없고 아랫끝도 없으면 말할 수 없다
    if (!(edge < thick - 1)) return null;                // 윗선이 아랫선보다 위가 아니면 오독
    return { edge, thick };
  }
  if (cap && thicks.length >= 3) {                       // ② 아치엣지만 못 읽었다 → 두께에서 5칸 위
    const thick = mid(thicks);
    return { edge: capEdge(thick - cap), thick };
  }
  return null;                                           // 3열 미만 → 조용히 포기 (밴드 유지)
}

/* ⭐⭐ v2.1.3 — **최종 하한 집행** — 어떤 경로로 왔든(판독·밴드·이전 값) 앞머리가
   눈 위 FRONT_T_LO(7) 눈금 미만이면 그것은 앞머리가 아닙니다 → 보통값(11.7)으로 대체.
   원장님: 「판독이 애매한 경우에도 말도 안 되는 위치에 있으면 안 된다」
   ⚠️ 상한(16)은 집행하지 않습니다 — 크게 확대한 사진(회귀 120 의 모양 C)에서는 눈썹이
      정당하게 16 눈금을 넘습니다. 위쪽 오독은 후보 선택(≤16)이 이미 막습니다. */
/* ⭐⭐⭐ v2.2.2 — **넘버링의 0 자리 동일화** (원장님 지시 2026-08-29:
   「너의 0 자리도 앞머리 고도화와 마찬가지 오류로 사진마다 다 다르다. 그러니 보통값도
     이상한 자리가 된다. **0 자리 동일화 프롬포트 정해라**」)
   정의: **0 = 동공(눈동자) 중심의 높이.** 사람이 눈대중으로 찍는 값이 아니라
   시스템이 측정하는 값입니다:
     ① 랜드마크가 있으면 홍채 중심(468~477)의 평균 — 매번 실측
     ② 없으면 배치 때 저장한 동공 높이(S.eyeZero — 정렬이 맞춘 CENTER_Y 자리)
     ③ 그것도 없으면 눈 가로선(h1)
   ⚠️ **h1 을 직접 쓰지 마세요** — h1 은 원장님이 드래그로 옮길 수 있는 선이라,
      옮기는 순간 넘버링 전체(하한 7 · 보통값 11.6 · 두께 4.7)가 따라 밀립니다.
      0 은 얼굴에 붙어 있어야 합니다. 회귀 159 가 잡습니다. */
function eyeZeroY() {
  const lm = S.landmarks, H = S.dim.H;
  if (lm && H) {
    try {
      const a = lmAvg(lm, IRIS_L), b = lmAvg(lm, IRIS_R);
      const y = imgToCanvas((a.x + b.x) / 2, (a.y + b.y) / 2, S.p).y / H;
      if (y > 0.05 && y < 0.95) return y;
    } catch { /* 랜드마크가 깨졌으면 저장값으로 */ }
  }
  return S.eyeZero && S.eyeZero > 0.05 && S.eyeZero < 0.95 ? S.eyeZero : S.g.h1;
}

/* ⭐ v2.2.0 — **앞두께 넘버링** (원장님 승인 2026-08-29: 「진행」)
   앞두께 = 앞머리에서 위로 몇 눈금(두께)인가. 케이스 실측으로 확정한 범위:
   두께가 이 범위를 벗어나면 파우더 번짐·이마 그늘을 읽은 것 → 보통값으로 대체. */
/* ⚠️⚠️ v2.3.0 — 원장님 확정 2026-08-29:
   ① 앞두께의 정의: 「앞머리에서 올라가 **검은선에서 피부색이 나오는 지점**」 —
      짙은 검정이 끝나도 옅은 윗털·파우더 그라데이션이 이어지면 계속, 피부가 나와야 끝.
      (예전 「짙은 검정 끝」 기준은 5장 중 4장에서 낮게 잡혔습니다 — 원장님 핑크 표시)
   ② 확정 두께 5건 (원장님 최종: 2번 앞머리 11·앞두께 17 → 두께 6.0):
      1번 4.8 · 2번 6.0 · 3번 7 · 6번 6 · 8번 7 → **중앙값 6.0** */
const FT_T_MID = 6.0;   // 앞머리 위 눈금 — 보통 두께 (원장님 확정 5건의 중앙값)
const FT_T_MIN = 3;     // 이보다 얇으면 잘못 읽은 것 (확정 최소 4.8 아래 여유)
const FT_T_MAX = 9;     // 이보다 두꺼우면 이마 그늘·머리카락까지 읽은 것
const FT_SOFT = 0.25;   // 「아직 피부가 아니다」의 문턱 — 피부↔최암부 차의 이 비율
const FT_SKIN = 4;      // 피부가 이만큼 연속되면 눈썹이 끝난 것
const FT_P2_MIN = 0.15; // 우선순위② — 「퍼센트가 낮아진다」로 인정할 최소 하락폭 (3줄 평활 기준)
/* ⭐⭐ v2.4.0 — ftGuard 는 이제 **최후 안전판**입니다 (원장님 2026-08-29:
   「두께 보통값 6.0 이 중요한 게 아니다」). 우선순위는 frontDecide 안에 있습니다:
   ① 픽셀 검증 — 피부색이 나오기 전 **검은 마지막 끝부분**
   ② 불명확하면 — 어둡기 **퍼센트가 낮아지는 부분**
   ③ 그래도 두께가 3~9 눈금 밖이면 여기서 보통값 6.0 으로 대체 (말도 안 되는 자리 방지). */
function ftGuard() {
  const u = frontTickPx();
  if (!u) return false;
  const H = S.dim.H;
  const th = ((S.g.front - S.g.frontThickness) * H) / u;   // 앞두께가 앞머리 위 몇 눈금인가
  if (th < FT_T_MIN || th > FT_T_MAX) {
    setLine("frontThickness", clamp(S.g.front - (FT_T_MID * u) / H, 0.02, 0.98));
    return true;
  }
  return false;
}

function frontFloor() {
  const u = frontTickPx();
  if (!u) return false;
  const H = S.dim.H;
  const ez = eyeZeroY();                                  // 0 = 동공 중심 (v2.2.2)
  const t = ((ez - S.g.front) * H) / u;
  if (t < FRONT_T_LO) {
    setLine("front", clamp(ez - (FRONT_T_MID * u) / H, 0.02, 0.98));
    return true;
  }
  return false;
}

/* ⭐⭐⭐ v2.0.0 — **세로선 눈금은 얼굴에 붙은 자로 읽습니다** (원장님 지시 2026-08-29)
   예전에는 `v × 100`, 즉 **화면 좌표**를 그대로 보여 줬습니다. 자동 정렬을 내안각 기준으로
   바꿔도(위 INNER_FRAC) 기기 폭·도크 폭에 따라 센터가 조금씩 움직이고, `fitBrowsInFrame`
   이 배율을 낮추면 또 밀립니다. 그래서 **표시 자체를 얼굴 기준**으로 바꿉니다:

       왼쪽 내안각 = 40 · 센터 = 53.15 · 오른쪽 내안각 = 66.3   (1 눈금 = 이 자의 1/13.15)

   이제 어떤 고객·어떤 기기에서도 **40 은 늘 눈 앞꼬리**이고, 48 은 늘 하드 맥시멈입니다.
   ⛔ `Math.round(g[k] * 100)` 으로 되돌리지 마세요 — 회귀 153 이 잡습니다. */
function faceRef() {
  const lm = S.landmarks, W = S.dim.W;
  if (lm && W) {
    try {
      const c = eyeCorners(lm);
      const l = imgToCanvas(c.innerL.x, c.innerL.y, S.p).x / W;
      const r = imgToCanvas(c.innerR.x, c.innerR.y, S.p).x / W;
      const a = Math.min(l, r), b = Math.max(l, r);
      if (b - a > 0.04) return { a, c: (a + b) / 2 };
    } catch { /* 랜드마크가 깨졌으면 저장값으로 */ }
  }
  const f = S.faceRef;
  return f && f.c - f.a > 0.02 ? f : null;
}
/* 세로선 값(0~1) → 원장님 눈금. 자가 없으면 예전처럼 화면 % 를 돌려준다. */
function dispV(v) {
  const f = faceRef();
  if (!f) return Math.round(v * 100);
  return Math.round(40 + ((v - f.a) / (f.c - f.a)) * 13.15);
}

/* ⚠️⚠️ **내안각(40)의 정의** — 원장님 확인 2026-08-29
   「위·아래 눈꺼풀이 만나는 **코쪽 끝점**」 = 눈물샘(caruncle)의 안쪽 끝입니다.
   눈물샘이 **시작하는** 자리가 아닙니다. 두 자리는 사진마다 6~14px 차이가 나고,
   1 눈금이 4~15px 이므로 그대로 두면 **눈금이 최대 3칸** 어긋납니다.
   원장님 지적: 「너는 눈앞꼬리를 40으로 잡는데, 각 사진마다 41 혹은 43으로 잡으니
   대체값이 항상 변하게 되고 그러면 더 형편없는 대체값이 된다」
   앱은 MediaPipe 랜드마크 **133 / 362** 를 씁니다 — 그 점이 바로 이 정의의 자리입니다.
   ⛔ 다른 인덱스(눈물샘 시작·속눈썹 끝)로 바꾸지 마세요. 눈금 전체가 틀어집니다. */
/* 내안각 → 센터 거리 (화면 폭 비율). 랜드마크가 있으면 실측, 없으면 배치 때 저장한 값. */
function innerAnchor() {
  const lm = S.landmarks, W = S.dim.W;
  if (lm && W) {
    try {
      const c = eyeCorners(lm);
      const inLc = imgToCanvas(c.innerL.x, c.innerL.y, S.p);
      const inRc = imgToCanvas(c.innerR.x, c.innerR.y, S.p);
      const v1 = (inLc.x + inRc.x) / 2 / W;
      const a = Math.abs((refIsLeft() ? inLc : inRc).x / W - v1);
      if (a > 0.02 && a < 0.45) return a;
    } catch { /* 랜드마크가 깨졌으면 저장값으로 */ }
  }
  return S.innerAnchor && S.innerAnchor > 0.02 ? S.innerAnchor : null;
}

/* f(얼굴 비율) → 화면 x(px). sgn = +1 이면 눈썹이 센터 오른쪽. */
const innerFx = (f, sgn, anchor) => (S.g.v1 + sgn * anchor * (1 - f)) * S.dim.W;

/* ─────────────────────────────────────────────────────────────────────────
   `innerProfile` — 열마다 **눈썹 두께로 고정한 창**의 잉크를 잰다.
   columnRuns 의 `dark` 는 열에서 제일 진한 덩어리를 스스로 고르므로 눈썹이 끝난 뒤에는
   눈꺼풀 그늘을 따라갑니다. 여기서는 밴드 안쪽 끝의 창(중심선 기울기 + 두께)을 그대로
   끌고 가며 **눈썹이 있어야 할 자리만** 재기 때문에 맨살에서는 값이 뚝 떨어집니다. */
function innerProfile(img, band, sgn) {
  const { W, H } = S.dim;
  if (!img || !band || band.length < 6) return null;
  /* 안쪽 40% 열로 중심선(1차식)과 두께(중앙값)를 잡는다 */
  const asc = band.slice().sort((a, b) => a.x - b.x);
  const inSide = sgn > 0 ? asc.slice(0, Math.max(4, Math.round(asc.length * 0.4)))
                         : asc.slice(-Math.max(4, Math.round(asc.length * 0.4)));
  const mid = (a) => { const v = a.slice().sort((x, y) => x - y); return v[Math.floor(v.length / 2)] || 0; };
  const th = Math.max(6, mid(inSide.map((p) => p.bot - p.top)));
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of inSide) { const y = (p.top + p.bot) / 2; sx += p.x; sy += y; sxx += p.x * p.x; sxy += p.x * y; }
  const nI = inSide.length, den = nI * sxx - sx * sx;
  let slope = den ? (nI * sxy - sx * sy) / den : 0;
  slope = clamp(slope, -1.2, 1.2);                       // 폭주 방지
  const x0 = sx / nI, y0 = sy / nI;
  const midY = (x) => y0 + slope * (x - x0);

  /* 한 열의 잉크 = 창 안에서 「피부보다 얼마나 어두운가」의 평균.
     피부는 창 위아래를 넉넉히 포함한 큰 열의 **밝은 40% 평균** (columnRuns 와 같은 잣대) */
  const inkAt = (x) => {
    const xi = Math.round(x);
    if (xi < 0 || xi >= W) return null;
    const cy = midY(x);
    const t = Math.round(cy - th / 2), b = Math.round(cy + th / 2);
    if (t < 0 || b >= H) return null;                  // 눈썹 자리 자체가 화면 밖
    /* ⭐ v1.99.2 — 피부 기준을 재는 **넓은 창은 화면 안으로 자릅니다**.
       예전에는 넓은 창이 화면 위로 넘치면 그 열을 통째로 버렸는데, 자동 정렬한
       가로 화면에서는 눈썹이 위쪽에 앉아 **모든 열이 버려졌습니다** — 그래서
       옅은 눈썹 사진 4장 중 3장이 이너 판독을 통째로 건너뛰었습니다 (2026-08-29).
       ⛔ 다시 `return null` 로 되돌리지 마세요 — 회귀 152 가 잡습니다. */
    const bt = Math.max(0, Math.round(cy - 2.2 * th));
    const bb = Math.min(H - 1, Math.round(cy + 2.2 * th));
    if (bb - bt < th) return null;                     // 피부를 잴 여유가 없다
    const big = [];
    for (let y = bt; y <= bb; y++) big.push(lumaAt(img, W, xi, y));
    const s = big.slice().sort((p, q) => p - q), k = Math.floor(s.length * 0.6);
    let sum = 0;
    for (let i = k; i < s.length; i++) sum += s[i];
    const skin = sum / Math.max(1, s.length - k);
    /* ⭐ 창 전체 평균이 아니라 **제일 어두운 INNER_CORE 만큼의 평균**입니다.
       눈썹은 안쪽으로 갈수록 얇아지므로, 두께 고정 창의 평균을 쓰면 진짜 선이 있어도
       맨살에 희석되어 「없다」가 됩니다 (원장님 44 자리가 맨살 46 과 겨우 5%p 차이였습니다).
       어두운 쪽만 보면 **가는 선 한 줄도 그대로 드러납니다**. */
    const dif = [];
    for (let y = t; y <= b; y++) dif.push(Math.max(0, skin - lumaAt(img, W, xi, y)));
    if (!dif.length) return null;
    dif.sort((p1, q1) => q1 - p1);
    const kc = Math.max(3, Math.round(dif.length * INNER_CORE));
    let ink = 0;
    for (let i = 0; i < kc; i++) ink += dif[i];
    return ink / kc;
  };
  return { inkAt, th, midY };
}

/* ─────────────────────────────────────────────────────────────────────────
   이너 최종 판정. 돌려주는 것은 { f, why } — f 는 얼굴 비율, why 는 기록용.
   ① 맨살 기준선을 **하드 맥시멈(48)보다 안쪽**(미간 맨살)에서 잰다
   ② 눈썹 잉크 기준선은 밴드 한가운데 열들의 중앙값 (= 100%)
   ③ 하드 맥시멈에서 **바깥(눈꼬리 방향)으로 걸어 나오며** 처음으로
      「맨살보다 확 띄는」 열을 만나면 그 자리가 이너다
   ④ 못 찾으면 43 (케이스가 3개 이상이면 케이스 중앙값) */
function innerDecide(img, band) {
  const { W } = S.dim;
  const anchor = innerAnchor();
  if (!anchor || !img || !band || band.length < 6) return null;
  const cx = S.g.v1 * W;
  const bandMid = (band[0].x + band[band.length - 1].x) / 2;
  const sgn = bandMid < cx ? -1 : 1;
  const prof = innerProfile(img, band, sgn);
  if (!prof) return null;
  const mid = (a) => { const v = a.slice().sort((x, y) => x - y); return v[Math.floor(v.length / 2)] || 0; };

  /* ② 눈썹 잉크 기준 — 밴드 가운데 50% 열 */
  const asc = band.slice().sort((a, b) => a.x - b.x);
  const q0 = Math.floor(asc.length * 0.25), q1 = Math.ceil(asc.length * 0.75);
  const core = [];
  for (let i = q0; i < q1; i++) { const v = prof.inkAt(asc[i].x); if (v !== null) core.push(v); }
  const browInk = mid(core);
  if (!(browInk > 0)) return null;

  /* ① 맨살 기준 — **45~48 골짜기** (원장님: 「46은 거의 맨살, 45도 맨살 낮은 점수」).
     ⛔ 48 **너머**에서 재지 마세요 — 그쪽은 미간·콧대 그늘과 반대쪽 눈썹이라
        맨살보다 훨씬 어둡습니다 (실측: 앱 51 에서 눈썹의 57%). 기준이 부풀면
        진짜 선(44)이 문턱을 못 넘습니다. 실패 재현: 2026-08-29 1차 시도 → 42. */
  const skinS = [];
  for (let f = INNER_F_SOFT; f <= INNER_F_HARD + 0.25; f += INNER_STEP) {
    const v = prof.inkAt(innerFx(f, sgn, anchor));
    if (v !== null) skinS.push(v);
  }
  skinS.sort((a, b) => a - b);
  /* **낮은 15% 분위** — 「골짜기」를 고르는 자리입니다. 평균·중앙값을 쓰면
     ⓐ 드로잉이 45 를 넘게 그려진 사진에서는 드로잉이,
     ⓑ 48 너머에서는 미간·콧대 그늘이 기준을 끌어올려 진짜 선이 문턱을 못 넘습니다. */
  const skinInk = skinS.length ? skinS[Math.floor(skinS.length * 0.15)] : 0;
  const span = Math.max(1e-6, browInk - skinInk);
  if (browInk <= skinInk * 1.4) return null;   // 눈썹과 맨살이 구분되지 않는다 → 판독 포기

  /* ③ 48 → 40 방향으로 걸어 나오며 처음 「확 띄는」 자리 */
  const pass = (f) => {
    const v = prof.inkAt(innerFx(f, sgn, anchor));
    if (v === null) return false;
    return (v - skinInk) / span >= INNER_RISE && v >= skinInk * INNER_MULT;
  };
  const scan = [];
  for (let f = INNER_F_HARD; f >= INNER_F_LO - 1e-9; f -= INNER_STEP) scan.push(f);
  for (let i = 0; i < scan.length; i++) {
    let ok = true;
    for (let k = 0; k < INNER_RUN; k++) { if (i + k >= scan.length || !pass(scan[i + k])) { ok = false; break; } }
    if (ok) {
      /* ⭐ 답은 통과한 열이 아니라 **그 바로 안쪽(맨살 쪽) 열**입니다.
         원장님: 「맨살에서 이곳에 선이 있다라고 판단되는 점수가 확 띄는 지점」 —
         선의 **안쪽 경계**가 이너입니다. 통과한 열은 이미 선 위에 올라선 자리라
         그대로 쓰면 한 눈금 바깥(눈꼬리 쪽)으로 밀립니다. */
      /* ⭐ v2.4.0 — 답의 상한은 45(INNER_F_SOFT) — 원장님: 「이너 45를 맥시멈으로」.
         fRaw = 캡 전 실제 시작점 — 앞머리 훑는 열(frontDecide)은 이걸 씁니다.
         캡 때문에 열까지 옮기면 케이스 2·3·8 앞머리가 밀립니다 (실측 2026-08-29). */
      const fRaw = clamp(i > 0 ? scan[i - 1] : scan[i], INNER_F_LO, INNER_F_HARD);
      const fAns = Math.min(fRaw, INNER_F_SOFT);
      const v = prof.inkAt(innerFx(scan[i], sgn, anchor));
      return { f: fAns, fRaw, sgn, anchor,
               rise: (v - skinInk) / span, mult: v / Math.max(1e-6, skinInk), why: "read" };
    }
  }
  /* ④ 읽지 못했다 — 중간(43) */
  return { f: innerCaseF(), fRaw: innerCaseF(), sgn, anchor, rise: 0, mult: 0, why: "fallback" };
}

/* ⭐⭐ v1.99.2 — **자가 없을 때만 예전 경로**입니다.
   `innerDecide` 는 밴드를 못 믿을 때(눈썹과 맨살이 구분 안 될 때)도 null 을 돌려줬고,
   그러면 `growEnd` 가 다시 눈꺼풀 그늘을 따라갔습니다 — 옅은 눈썹 사진에서 실제로
   이너가 **46.7 · 48**(미간 맨살)에 섰습니다 (2026-08-29 원장님 사진 4장 테스트).
   원장님 룰은 그때 「자동으로 선택할 수 없을 경우 중간 43을 선택한다」입니다.
   → 자(anchor)만 있으면 **언제나** 답을 냅니다. 못 읽으면 43.
   ⛔ 이 안전판을 빼지 마세요 — 회귀 152 가 잡습니다. */
function innerFallback() {
  const anchor = innerAnchor();
  if (!anchor) return null;
  return { f: INNER_F_MID, fRaw: INNER_F_MID, sgn: -1, anchor, rise: 0, mult: 0, why: "no-band" };
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
    /* v1.72.0 — `ink` 는 **두께 × 진하기** 라 얇은 꼬리에서 자연히 작아집니다. 꼬리 끝 판정에는
       두께와 무관한 **평균 진하기(dark)** 를 씁니다 — 「검은 드로잉」의 잣대는 진하기입니다. */
    const sd0 = c.runs[c.si];
    /* ⭐⭐ v1.75.0 — **아랫선이 탐색창 바닥에 못 박히는 것을 막는다** (원장님 폰 2026-08-25:
       「폰에서 아예 안 올라간다」). 원장님 화면에서 앞머리와 아치두께가 **똑같은 y** 에,
       눈썹이 아니라 눈꺼풀 위에 서 있었습니다. 두 값이 같다는 것이 결정적인 단서였습니다 —
       아랫선이 사진에서 읽힌 값이 아니라 **창 바닥**이라는 뜻입니다.
       원인: 눈썹 아래 피부가 그늘지면 눈썹부터 눈꺼풀까지 한 덩어리로 이어져 읽히고,
       그 덩어리가 창 바닥에서 잘립니다. 랜드마크 경로에서 특히 잘 납니다 — 창 바닥이
       눈에 가깝기 때문입니다 (예비 경로에서는 잘 안 나서 여기 컨테이너 재현에서 못 봤습니다).
       해결: 바닥에 닿은 덩어리는 `coreBot`(진하기가 살아 있는 곳까지)으로 대신합니다.
       ⛔ `r.bot` 을 그대로 쓰도록 되돌리지 마세요 — 회귀 127 이 바로 잡습니다. */
    /* ⭐ v1.76.0 — 창 바닥에 **닿지 않아도** 마찬가지입니다 (원장님 폰 2026-08-25 10:01).
       v1.75.0 은 바닥에 닿은 덩어리만 구제해서 앞머리는 눈썹으로 올라왔지만, **아치두께**는
       여전히 눈꺼풀 위에 남았습니다 — 그 열의 덩어리는 바닥까지 가지 않고 눈꺼풀에서 끝나서
       구제 대상이 아니었습니다. 아랫선은 **언제나 색이 살아 있는 곳까지**입니다.
       ⚠️ 테두리로 그린 드로잉(`outline`)에는 쓰지 않습니다 — 그때 `r` 은 **위·아래 두 줄을 묶은 것**
       이라 씨앗 한 줄의 핵심으로 자르면 아랫줄이 통째로 날아갑니다 (회귀 89 가 잡습니다). */
    /* ⭐ v1.77.0 — **윗선도 마찬가지입니다** (원장님 폰 2026-08-25 10:12 「앞두께 안 맞음」).
       눈썹 앞머리 쪽은 색이 옅어서 그 열의 문턱이 낮게 잡히고, 덩어리가 눈썹 **위 맨살**까지
       올라갑니다 (원장님 화면: 앞두께가 눈썹 윗선보다 35px 위). 아래와 똑같이 잘라 냅니다. */
    const usingPair = outline && c.pair;
    const bot = !usingPair && sd0.coreBot !== undefined ? Math.min(r.bot, sd0.coreBot) : r.bot;
    const top = !usingPair && sd0.coreTop !== undefined ? Math.max(r.top, sd0.coreTop) : r.top;
    return { x: c.x, top, bot, ink: sd0.ink,
             /* ⭐ v3.5.0 — core = 피부 대비 절대 어둡기(가장 진한 점). 꼬리 끝 판정용 */
             core: contrast + (sd0.peak || 0),
             dark: sd0.ink / Math.max(1, sd0.len), edge: r.top <= y0 + 1 };
  });
  pts.sort((p, q) => p.x - q.x);
  const kept = keepBand(pts);
  let band = trimOutside(kept, b);  /* v1.66.0 — 머리카락·그림자 방어 (아래 참고) */
  /* ⚠️ v1.69.0 — **두께 상식 검사는 랜드마크가 있을 때만.** `b.h`(예비 경로에서는 지금 선 간격)는
     실제 눈썹 두께의 대리값이 못 됩니다 — 원장님 사진에서 선 간격 15px vs 실제 눈썹 50px 이라
     제대로 읽은 판독이 「두껍다」는 이유로 버려졌습니다. 예비 경로의 방어는 머리카락 규칙
     (창 천장·끊긴 조각·잉크 · 1-31)이 맡습니다. */
  /* v1.74.0 — 이너(세로선)만 **색이 시작하는 곳**까지 늘려 잡는다. 밴드 자체는 건드리지
     않습니다 — 앞두께·앞머리는 「앞부분」의 윗선·아랫선이라 성근 시작 털까지 평균에
     넣으면 자가 아래로 끌려갑니다 (원장님 표시 87.7 → 89 이 92 로 밀렸습니다). */
  if (band) {
    const gi = growEnd(band, kept, true), go = growEnd(band, kept, false);
    band.innerX = gi.length ? gi[gi.length - 1].x : band[0].x;   // 방향은 autoFromDrawing 이 정리
    if (gi.length) band.innerX = gi[gi.length - 1].x;
    else { const cx0 = S.g.v1 * W; band.innerX = Math.abs(band[band.length - 1].x - cx0) < Math.abs(band[0].x - cx0) ? band[band.length - 1].x : band[0].x; }
    band.tailAdd = go;                                           // 꼬리 쪽으로 이어 붙인 열들
  }
  if (band) { band.refH = boxes ? b.h : null; band.ink = inkSum; }   // refH: 두께 상식 검사 · ink: 좌우 비교
  return band;
}


/* ⛔⛔⛔ v3.2.0 — **열 순서의 방향을 정하는 단 하나의 자리** (실기기 사진 2026-08-30).
   `pts` 는 x 오름차순입니다. 앞머리(seq[0])는 **센터에 가까운 끝**입니다 — 화면 왼쪽
   눈썹이면 x 가 큰 쪽, 오른쪽 눈썹이면 x 가 작은 쪽. `growEnd` 가 쓰는 잣대와 같습니다.
   ⛔ 예전의 `pts[0].x > cx`(끝점 하나가 센터보다 오른쪽인가)로 되돌리지 마세요 —
      읽힌 열이 센터를 하나라도 넘으면 판정이 뒤집혀 **열 순서 전체가 거꾸로** 섭니다.
      회귀 175 가 잡습니다. */
function seqOrient(pts, cx) {
  return Math.abs(pts[0].x - cx) < Math.abs(pts[pts.length - 1].x - cx) ? pts : [...pts].reverse();
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
     화면 왼쪽 눈썹이면 x 가 큰 쪽이 코 방향(=안쪽)이므로 뒤집는다.

     ⛔⛔⛔ v3.2.0 — **방향은 「어느 끝이 센터에 가까운가」로 정한다** (실기기 사진 2026-08-30).
     예전에는 `pts[0].x > cx` — **끝점 하나가 센터보다 오른쪽인가** — 로만 봤습니다.
     화면 오른쪽 눈썹에서 읽힌 열이 **센터를 하나라도 넘으면**(미간 잔털·그늘) `pts[0].x`
     가 센터보다 왼쪽이 되어 판정이 뒤집히고, **열 순서 전체가 거꾸로** 섭니다.
     그러면 아치선 탐색이 산꼭대기에서 꼬리 쪽이 아니라 **앞머리 쪽으로** 걸어가고,
     아치선이 눈썹 몸통 한가운데(마지노선 규칙과 정반대 자리)에 섭니다.
     실기기 스크린샷의 아치선(≈35)을 같은 사진·같은 코드에 **순서만 뒤집어** 넣으면
     35.08 로 재현됐습니다 (정상 순서 24.07). 확대율 무관하게 재현됩니다.
     ⚠️ 실기기에서 뒤집힘을 일으킨 정확한 입력은 컨테이너에서 재현하지 못했습니다 —
        MediaPipe 가 막혀 랜드마크 경로(browBoxes)를 못 타고, 예비 경로(fallbackBox)는
        상자를 센터(cx±4)에서 잘라 애초에 못 넘습니다. **랜드마크 경로에는 그 잘라내기가
        없습니다** — 그래서 실기기에서만 났습니다.
     이제 `growEnd`(위)와 **같은 잣대**를 씁니다 — 센터에 가까운 끝이 앞머리.
     열이 센터를 안 넘는 보통 사진에서는 예전 식과 결과가 같습니다 (확정 4장 불변).
     ⛔ 다시 끝점 하나(`pts[0].x > cx`)로 되돌리지 마세요 — 회귀 175 가 잡습니다. */
  const cx = S.g.v1 * W;
  const seq = seqOrient(pts, cx);
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
  /* ⛔⛔⛔ v3.4.0 — **산꼭대기 후보는 내안각(넘버링 40)보다 바깥이어야 한다**
     (실기기 점선 진단 2026-08-30 · 원장님 화면에서 직접 확인)
     ───────────────────────────────────────────────────────────────────────────
     v3.3.1 의 점선 표시로 실기기에서만 나던 증상의 원인이 드러났습니다: **판독 열이 눈썹
     앞머리(이너 44)를 지나 미간까지 이어지고**, 거기 잔털이 만든 높은점이 진짜 산꼭대기보다
     9px 더 높게 읽혀 **`pk` 가 미간 쪽(num 45.6)에 섰습니다.** 산꼭대기가 틀리면 아치엣지·
     아치두께(그 열에서 읽음)와 아치선(그 자리에서 바깥으로 탐색)이 전부 함께 틀어집니다.

     예전 방어는 **`n` 의 15%~85% 라는 「몇 번째 열이냐」** 였습니다. 열이 눈썹 밖까지
     이어지면 그 비율 창도 같이 밀려서 아무것도 막지 못합니다.
     이제 **얼굴 기준 넘버링**으로 막습니다 — 아치는 해부학적으로 **내안각(40)보다 안쪽에
     설 수 없습니다.** 확대율·사진 크기와 무관한 자입니다(확정 4장의 산꼭대기는 27~31).
     ⛔ 다시 비율(15%)만으로 되돌리지 마세요 — 회귀 178 이 잡습니다.
     ⚠️ 눈금 자가 없으면(랜드마크·동공 정렬 실패) 예전처럼 비율 창만 씁니다 — 가두지 않는다. */
  const ARCHPK_NUM_MAX = 40;      // 내안각. 산꼭대기가 이보다 안쪽이면 눈썹이 아니다
  let lo = Math.max(1, Math.round(n * 0.15));
  const hi = Math.min(n - 2, Math.round(n * 0.85));
  {
    const tk = frontTickPx();
    if (tk) {
      /* seq 는 앞머리→꼬리 순이라 index 가 커질수록 num 이 작아진다 */
      const numAt = (i) => 53.15 - Math.abs(seq[i].x - cx) / tk;
      while (lo < hi && numAt(lo) > ARCHPK_NUM_MAX) lo++;
    }
  }
  let pk = lo;
  for (let i = lo; i <= hi; i++) if (smoothTop(i) < smoothTop(pk)) pk = i;
  const win = Math.max(1, Math.round(n * 0.08));
  const pa = clamp(pk - win, 0, n - 1) / (n - 1), pb = clamp(pk + win, 0, n - 1) / (n - 1);

  const setY = (key, py) => { if (py !== null && isFinite(py)) setLine(key, clamp(py / H, 0.02, 0.98)); };
  /* ⚠️ v1.70.0 — **원장님이 정해 주신 판정 기준** (2026-08-24, 사진 3장 + 확인 답변)
       ① 앞머리 : 이너(세로) × 앞머리(가로)가 이루는 **90° 꼭지점에 눈썹 앞부분이 닿는다**
                 → 구간 평균이 아니라 **안쪽 끝 근처**만 본다. v1.69 까지는 안쪽 18% 를
                   분위수로 평균 내서, 앞머리 자가 실제보다 **아래**로 내려갔습니다
                   (원장님 표시: 아래 빨간 ㄴ = 지금 자리 · 위 빨간 ㄴ = 있어야 할 자리).
       ② 꼬리   : 십자 꼭지점에 **꼬리의 뾰족한 끝점**이 닿는다 → 윗선이 아니라 **끝의 한가운데**.
                 v1.69 까지는 윗선(top)이라 꼬리 자가 실제보다 위에 있었습니다.
       ③ 아치선 : 산꼭대기가 아니라, **아치 가로선에서 눈썹이 아래로 빠지기 시작하는 꺾임점**.
                 랜드마크가 있으면 그 x 를 **눈동자 바깥 끝 ~ 눈꼬리 바깥**(원장님의 1·2·3 자리)
                 으로 가둔다.
     ⛔ 이 세 기준을 「구간 분위수」로 되돌리지 마세요 — 회귀 87~94·121 이 잡습니다. */
  const END = 0.08;                    // 끝점으로 볼 구간 (양 끝 8%)
  /* ⚠️⚠️ v1.73.0 — **앞머리와 앞두께는 이렇게 나뉩니다** (원장님이 화면에 번호를 찍어 확정,
     2026-08-25). v1.72.0 까지 **거꾸로** 놓고 있었습니다.
         앞두께 = 눈썹 앞부분의 **윗선**   ← 위
         앞머리 = 눈썹 앞부분의 **아랫선** ← 아래
     원장님 표시를 캔버스 좌표로 환산하니 「② 앞두께」가 그때까지 앱이 **앞머리**라고 놓던
     자리(y 88)와 정확히 겹쳤고, 「① 앞머리」는 그보다 한참 아래(y 137)였습니다.
     ⛔ 다시 뒤집지 마세요. 회귀 87~94·124 가 잡습니다. */
  /* ⚠️ 계산식은 v1.72.0 까지 쓰던 **그대로**입니다 — 원장님: 「드로잉 판독은 정확하게 하고
     있음에도 선의 **명칭과 위치**를 잘못 제공하고 있다」. 실제로 원장님 표시와 재보니
     예전 `앞머리` 값(안쪽 18% 윗선 30%분위)이 **앞두께** 자리(4.6px), 예전 `앞두께` 값
     (아랫선 70%분위)이 **앞머리** 자리(4.3px)였습니다. 이름만 바꿔 답니다.
     ⛔ 구간을 8% 로 좁히지 마세요 — 안쪽 끝만 보면 앞두께가 40px 아래로 처집니다. */
  setY("frontThickness", at(0, 0.18, "top", 0.3));  // 앞두께 = 앞부분 **윗선**
  setY("front", at(0, 0.18, "bot", 0.7));           // 앞머리 = 앞부분 **아랫선**
  setY("h2", at(pa, pb, "top"));                 // 아치     = 제일 높은 곳 윗선
  setY("archThickness", at(pa, pb, "bot"));      // 아치두께 = 그 자리 아랫선
  /* ⚠️ v1.70.0 — **꼬리 = 뾰족한 끝의 아랫선** (원장님 지시 2026-08-24 · 빨간 십자)
     원장님이 십자를 눈썹 꼬리의 **아래·바깥**에 그려 주셨습니다. 판독 열은 꼬리의 연한 털
     앞에서 끊기므로, 마지막 구간의 **아랫선(bot)** 이 실제 끝점에 가장 가깝습니다.
       · v1.69 까지 : 윗선(top)  → 십자가 실제 끝보다 **위**에 섰습니다
       · v1.70 잠깐 : 가운데    → 여전히 위였습니다 (원장님: 「꼬리 아직도 잘못 해석했다」)
       · v1.70 확정 : **아랫선** → 뾰족하게 닫히는 자리에 가장 가깝습니다
     ⚠️ 윗선·아랫선을 직선으로 연장해 만나는 점을 구하는 방법도 시도했지만, 실제 눈썹 꼬리는
        곡선이라 25px 이상 빗나가 **버렸습니다**. 더 정확히 하려면 판독이 연한 꼬리 털까지
        따라가야 합니다 (다음 과제).
     ⛔ 윗선이나 가운데로 되돌리지 마세요 — 회귀 121 이 잡습니다. */
  /* ⛔ v1.71.0 — **얇은 털을 따라가지 않습니다** (원장님 지시 2026-08-25: 「얇은털 따라가는것 금지」)
     ⭐ v1.72.0 — **검은 드로잉이 끝나는 곳을 찾습니다** (원장님 지시 2026-08-25: 「검은 드로잉
        고도화로 찾기」). 판독은 눈썹 가장자리의 **옅게 번진 열**까지 읽습니다. 그 열까지 꼬리로
        치면 십자가 눈썹이 없는 피부 위에 섭니다 (원장님 표시: 보라=그때 자리 · 파랑=있어야 할 자리).
        이제 **잉크가 중앙값의 `TAIL_INK` 이상인 열**만 「검은 드로잉」으로 보고, 바깥에서
        안쪽으로 훑어 처음 만나는 그 열을 꼬리 끝으로 삼습니다.
     ⛔ 문턱을 낮춰 옅은 쪽으로 다시 늘리지 마세요. 회귀 122·123 이 잡습니다. */
  /* ⭐ v1.74.0 — 꼬리 판정은 **이어 붙인 끝까지** 본다 (원장님 지시 2026-08-25,
     사진에 ①얇은헤어 ②지금 판독 ③맞는 끝 세 자리를 짚어 주셨습니다).
     다듬기가 잉크로 자른 탓에 ② 가 ③ 보다 11px 안쪽에 서 있었습니다. `growEnd` 가
     색이 남아 있는 열(진하기 ≥ 0.5 × 중앙값)만 이어 붙이므로 ①(얇은 헤어)에는 못 갑니다.
     ⚠️ 앞머리·아치·아치두께는 **원래 밴드(seq)** 로 계산합니다 — 성근 끝 털을 구간
     평균에 넣으면 자가 끌려갑니다 (1-36). 꼬리·아우터만 `seqT` 를 씁니다. */
  const seqT = pts.tailAdd && pts.tailAdd.length ? seq.concat(pts.tailAdd) : seq;
  const nT = seqT.length;
  let tailIdx = nT - 1;
  {
    const darks = seqT.map((p) => p.dark || 0).slice().sort((a, b) => a - b);
    const medDark = darks[Math.floor(darks.length / 2)] || 0;
    /* ⭐ v3.5.0 — `growEnd` 와 **같은 잣대**입니다: 평균(dark) 또는 core 중 하나만 넘으면
       아직 검은 드로잉입니다. 여기만 예전 기준으로 두면 이어 붙인 열이 도로 잘립니다. */
    const cores = seqT.map((p) => p.core || 0).slice().sort((a, b) => a - b);
    const medCore = cores[Math.floor(cores.length / 2)] || 0;
    const coreMin = medCore > 0 ? Math.max(DRAW_CONTRAST, TAIL_INK * medCore) : null;
    if (medDark > 0) {
      for (let i = nT - 1; i >= Math.floor(nT * 0.45); i--) {
        const p = seqT[i];
        if ((p.dark || 0) >= TAIL_INK * medDark || (coreMin !== null && (p.core || 0) >= coreMin)) { tailIdx = i; break; }
      }
    }
    const t0 = Math.max(0, tailIdx - Math.round(END * (nT - 1)));
    const bots = seqT.slice(t0, tailIdx + 1).map((p) => p.bot).sort((x, y) => x - y);
    /* 앞머리와 같은 잣대 — 아랫선은 **70% 분위**. 성근 털에서 중앙값은 위로 뜹니다 */
    setY("h3", bots.length ? bots[clamp(Math.round(0.7 * (bots.length - 1)), 0, bots.length - 1)] : null);
  }

  /* 이너·아우터 = 드로잉이 실제로 있는 x 양 끝 (setLine 이 반대쪽을 대칭으로 맞춘다).
     아우터는 **검은 드로잉이 끝나는 열**입니다 (v1.72.0 · 얇은 털 추적 금지 v1.71.0). */
  /* v1.74.0 — 이너 = **드로잉 색이 시작하는 선** (원장님 2026-08-25). 밴드의 안쪽 끝이
     아니라 `growEnd` 가 이어 붙인 끝입니다 — 위 `growEnd` 주석 참고. */
  /* ⭐ v1.99.0 — 이너는 **전용 판독**(innerDecide)이 정합니다 — 위 룰 주석 참고.
     `growEnd` 는 눈꺼풀 그늘을 따라 미간 맨살(앱 48)까지 걸어갔습니다.
     판독이 아예 안 되면 예전 경로를 쓰되 **40~48 밖으로는 못 나가게** 자릅니다. */
  {
    const dec = innerDecide(img, pts) || innerFallback();
    S.innerRead = dec || null;
    if (dec) {
      setLine("v2", clamp(S.g.v1 - dec.anchor * (1 - dec.f), 0.02, 0.98));
    } else {
      const innerX = pts.innerX !== undefined && pts.innerX !== null ? pts.innerX : seq[0].x;
      let half = Math.abs(innerX - cx) / W;
      const a0 = innerAnchor();
      if (a0) half = clamp(half, a0 * (1 - INNER_F_SOFT), a0);   /* v2.4.0 — 맥시멈 45 */
      setLine("v2", clamp(S.g.v1 - half, 0.02, 0.98));
    }
  }
  /* ⭐ v2.1.0 — 앞머리 = 눈 위에서 올라가 처음 만나는 「두꺼운 검은 것」 (위 frontDecide).
     이너(v2)가 정해진 다음에 불러야 합니다 — 훑는 열이 이너 자리이기 때문입니다.
     실패하면 기존 밴드 판독 값이 그대로 남습니다. */
  {
    const fd = frontDecide(img);
    if (fd) {
      setY("front", fd.y);
      /* ⭐ v2.2.0 — 같은 열의 윗끝 = **앞두께** (검은색이 끝나는 지점 · 눈썹 윗선) */
      if (fd.top !== null && fd.top < fd.y) setY("frontThickness", fd.top);
    }
    /* 어떤 경로로 왔든 마지막에 **하한 집행** — 눈 위 7 눈금 미만이면 앞머리가 아니다.
       (상한 대체는 뺐습니다 — 크게 확대한 사진에서는 눈썹이 정당하게 16 을 넘습니다.) */
    frontFloor();
    /* 앞두께 최후 안전판 — 우선순위①②(frontDecide) 뒤에도 3~9 눈금 밖이면 보통값(6.0) */
    ftGuard();
  }
  /* ⭐ v3.6.0 — 꼬리는 **두 모서리가 만나는 자리**입니다 (위 tailConverge 주석).
     판독이 흐릿한 끝에서 먼저 멈추므로, 두께가 0 이 되는 자리까지 이어서 봅니다. */
  {
    const tc = tailConverge(seqT, tailIdx);
    let tipX = tc ? tc.x : seqT[tailIdx].x;
    S.tailRead = { lastX: seqT[tailIdx].x, tipX,
                   ext: tc ? +tc.ext.toFixed(1) : 0,
                   tipY: tc ? +tc.y.toFixed(1) : null,
                   thickEnd: tc ? +tc.thickEnd.toFixed(1) : null };
    /* ⭐ v3.28.0 — 가늘어진 꼬리 심 추적 (위 tailTrace 주석). 수렴점보다 4px 이상 더 나갔을 때만 채택 */
    const tt = tailTrace(img, seqT, tailIdx);
    const dirT = Math.sign(seqT[tailIdx].x - seqT[Math.max(0, tailIdx - 1)].x) || 1;
    const traced = !!(tt && (tt.x - tipX) * dirT >= 4);
    if (traced) tipX = tt.x;
    S.tailRead.trace = tt ? { x: tt.x, y: tt.y, cols: tt.cols, bodyCore: tt.bodyCore, endContrast: tt.endContrast, used: traced } : null;
    setLine("v4", clamp(S.g.v1 - Math.abs(tipX - cx) / W, 0.02, 0.98));
    /* ⭐⭐ v3.6.1 — **꼬리 자의 높이도 수렴점으로 내려온다** (원장님 확인 2026-08-31:
       「흰점 잘 들어옴, 뻗어나간 끝지점 선택 잘됨. 상하 위치만 잘 잡으면 된다.
         끝지점에서 아래로 내려와야 하는 유추 기능 고도화 필요」)
       윗선과 아랫선이 만나는 점은 x·y 를 **둘 다** 가진 점입니다. x 만 옮기고 높이를
       예전대로 두면 십자가 꼬리 끝보다 위에 뜹니다 (원장님 화면에서 17px 위였습니다).
       수렴점을 못 구한 사진(끝이 뭉툭해 두께가 안 줄어드는 드로잉)에서는 예전 계산
       그대로입니다 — 회귀 121 이 그 경우를 지킵니다.
       ⛔ 「끝 구간 아랫선의 70% 분위」로 되돌리지 마세요. 그것은 판독이 멈춘 자리의
          아랫선이지 **꼬리 끝**이 아닙니다. */
    if (traced) setY("h3", tt.y);          /* v3.28.0 — 추적한 심의 아랫끝 (x·y 둘 다) */
    else if (tc) setY("h3", tc.y);
  }
  /* ⭐ v3.0.0 — **아치선(v6)은 아치엣지(h2)가 확정된 뒤에 잡습니다** — 아래에서
     archDecide/archStandard 로 h2 를 다 정한 다음, 이 함수 맨 아래의 v6 판정 블록
     (ARCHV_EPS·ARCHV_HOLD·3칸 마지노선)이 seq/smoothTop 를 훑어 다시 정합니다.
     여기서는 「일단 산꼭대기」로만 임시로 놓아 둡니다 — 이너·앞머리처럼
     실패하면 예전 배치가 남아 있어야 하기 때문입니다. */
  setLine("v6", clamp(S.g.v1 - Math.abs(seq[pk].x - cx) / W, 0.02, 0.98));

  /* ⭐⭐ v1.81.0 — **아치두께의 마지노선** (원장님 지시 2026-08-27)
     「절대로 : 아치두께는 절대로 꼬리가 측정된 위치 밑으로 내려오지 않는다.
       눈썹중 꼬리가 가장 낮은곳에 위치한다. 아치두께는 앞머리와 같은선 위치 하거나 높은곳에 위치한다.
       그러니 아치두께를 자동위치할때 꼬리보다 낮은곳에 쉐도우·어두운 선을 아치두께라고 인식할수 없다」

     눈썹의 해부학이 정해 주는 순서입니다 — **아치두께 ≤ 앞머리 ≤ 꼬리** (y 는 아래로 갈수록 큼).
     아치두께가 이 선을 넘었다면 그것은 눈썹이 아니라 **눈꺼풀 그늘**을 읽은 것입니다.
     ⛔ 이 상한을 지우지 마세요 — 회귀 133 이 잡습니다.
     ⚠️ `AT_GAP` — 상한에 **딱 붙이지 않고 조금 위**에 세웁니다. 딱 붙이면 아치두께와 앞머리가
        같은 값이 되어, 못박음 검사(회귀 131)가 「사진에서 읽은 값이 아니다」로 잡습니다.
        상한이 걸렸다는 것 자체가 판독이 흔들렸다는 뜻이므로 붙여 두면 안 됩니다. */
  /* ⭐⭐⭐ v2.5.0 — 아치엣지·아치두께도 앞머리와 **같은 방법**으로 픽셀 검증 (원장님 지시 2026-08-29:
     「앞머리, 앞두께 자동 위치조정 프로그래밍과 같은 방법으로 아치엣지 아치두께 고도화해라」).
     ⚠️ 훑는 자리는 **산꼭대기**(밴드에서 찾은 봉우리 열)입니다 — 아치선(v6·꺾임점)이 아닙니다.
     ⚠️ 이너(v2)·앞머리가 정해진 **뒤에** 부릅니다 — 해부학 순서(아치두께 ≤ 앞머리)를 후보 고르기에 씁니다.
     실패하면 아무것도 바꾸지 않고 위의 밴드 판독이 그대로 남습니다 (조용한 안전판). */
  {
    const info = { seen: 0 };
    const ad = archDecide(img, seq[pk].x, info);
    if (ad) { setY("h2", ad.edge); setY("archThickness", ad.thick); }
    else if (info.seen > 0) {
      /* ⭐ v2.6.0 — 판독 실패 → **표준값** (위 AT_FROM_FRONT 주석의 원장님 지시).
         ⚠️ `info.seen > 0` 조건을 지우지 마세요 — **왜 실패했는지**로 갈립니다:
           · seen = 0 : 산꼭대기에 「두꺼운 검은 것」이 **아예 없다** → 테두리만 그린 드로잉,
             맨 눈썹 저대비. 이때는 **밴드가 읽은 것이 유일한 증거**이므로 그대로 둡니다.
             (회귀 89 · 94 가 잡습니다 — 드로잉을 표준값으로 덮으면 원장님 작업이 망가집니다)
           · seen > 0 : 뭔가 보이긴 하는데 열들이 서로 다른 말을 한다 → 머리카락·그늘일
             가능성이 큽니다. 밴드도 그 흔들리는 것을 읽었을 것이므로 **표준값**으로 갑니다.
             (실제 사진 1번 — 밴드 아치엣지가 눈썹 위로 4.9 눈금 떠 있었습니다) */
      const std = archStandard(S.g.front * H, frontTickPx(), S.g.frontThickness * H);
      if (std) { setY("archThickness", std.thick); setY("h2", std.edge); }
    }
  }
  applyArchThickFloor();   /* 아치두께 마지노선 (v1.81.0 · v3.27.0 1.5칸 여유) — 아래 함수 */

  /* ⭐⭐⭐ v3.0.0 — **아치선(v6) — 아치엣지 가로선이 눈썹과 맞닿는 자리** (원장님 지시
     2026-08-30, 실제 사진 3장에 파란 선으로 손수 표시해 확인):
       「아치엣지가로를 아치선이 맞닿을때 생기는 피부색이 생기는 위치가 아치선」
     즉 **아치엣지(h2, 방금 위에서 확정됨) 높이의 수평선을 산꼭대기에서 바깥으로 밀 때,
     눈썹 윗선(smoothTop)이 그 높이를 처음 넘어서는(=피부가 드러나는) 자리**입니다.

     ⛔ v1.70.0~v2.9.0 의 「꺾임점」(낙차의 KINK_DROP 비율)을 대신합니다 — 원장님이 실제
     사진에 짚어 주신 자리가 꺾임점과 달랐습니다. **훑는 자료는 seq/smoothTop 그대로**
     씁니다 — 테두리만 그린 드로잉·저대비 맨눈썹에서도 이미 검증된 자료라(회귀 89·94),
     따로 픽셀을 다시 훑으면(darkBlobsUp) 테두리 드로잉의 속 빈 부분을 잘못 읽습니다.

     ⚠️ **기준 높이는 archDecide 의 h2 가 아니라 `smoothTop(pk)` 자체입니다.** 밴드(seq)와
     archDecide 는 서로 다른 픽셀 판독이라 h2 와 `smoothTop(pk)` 가 1~2px 어긋날 수 있고,
     그 어긋남이 바로 다음 열들을 「벌써 피부」로 잘못 읽게 만듭니다(원장님 사진 A·D로
     확인 — 눈썹 한복판에 섰습니다). **밴드 안에서 자기 자신과만 비교**해야 일관됩니다.

     ⚠️⚠️ **여유는 그 눈썹의 낙차에 비례(ARCHV_EPS_FRAC)** — 예전 「꺾임점」(KINK_DROP)과
     같은 이유로 고정 px 여유는 사진마다 결이 달라 흔들립니다(회귀 A·D). 산꼭대기~꼬리
     낙차(`fall`, 아래 KINK_DROP 자리에서 쓰던 그 자)의 작은 비율로 잡으면 사진마다 저절로
     맞는 여유가 됩니다. **꺾임점(0.15)보다 훨씬 작습니다** — 「다 꺾였다」가 아니라
     「막 피부가 비치기 시작했다」를 잡는 것이므로.

     ⚠️⚠️⚠️ v3.0.1 — **버팀(ARCHV_HOLD)은 「계속 피부」뿐 아니라 「계속 늘어나야」 확정** —
     원장님이 A사진에 직접 짚어 주신 자리(2026-08-30, 파란 세로선)로 확인: 산꼭대기 바로
     옆에 눈썹 결 때문에 잠깐 튀었다가 도로 가라앉는 「가짜 상승」이 있고(A·D), 진짜 아치선은
     그 뒤에 옵니다. 예전엔 문턱만 넘으면 쭉 세었기 때문에(가짜 상승도 문턱은 넘음) 가짜
     상승에 먼저 낚였습니다. 이제는 **버팀 구간 내내 높이가 줄어들면 안 됩니다**(작은 결
     흔들림은 tol만큼 봐줌) — 가짜 상승처럼 올라갔다 도로 가라앉으면 그 시작점은 버려지고,
     다음으로 「내내 늘기만 하는」 진짜 시작점을 찾습니다. B·C·D는 애초에 가짜 상승이 없어서
     이 조건을 추가해도 값이 그대로입니다(회귀 확인됨) — A만 29.52→25.46 으로 밀렸습니다.
     ⏸ 대기함 — 원장님 손 표시(≈23)에는 아직 못 미칩니다. 거기까지 밀려면 문턱
     자체(ARCHV_EPS_FRAC)를 올려야 하는데, 그러면 B·C·D도 같이 밀립니다 — 이 파일 하나만
     따로 봐주는 규칙이 아니라 전체가 같이 쓰는 공식이라서 그렇습니다.

     ⛔⛔ v3.0.2 — **산꼭대기에서 최소 3칸 안쪽은 아예 후보에서 뺀다** (원장님 지시
     2026-08-30, 3칸 표시 스크린샷): 「3개의 칸 내부로 들어오지 않는다 · 무조건 3개칸
     이후부터 찾거나, 못 찾으면 3개칸 이후의 눈꼬리 윗부분을 표준값으로」. v3.0.1의 가짜
     상승 방어는 그 상승이 EPS를 넘고 다시 가라앉아야만 걸러지는데, 만약 어떤 사진에서
     가짜 상승이 가라앉지 않고 그대로 버팀(HOLD)까지 이어지면 또 산꼭대기 바로 옆에서
     낚일 수 있다 — 그 경우를 위한 마지막 방어선. **몇 번째 줄(i)이 아니라 실제 눈금
     거리(px)로 잰다**(frontTickPx 그 자) — 사진마다 확대율이 달라 i 개수는 사진마다
     다른 실제 거리를 가리키기 때문.

     ⛔⛔⛔ v3.1.0 — **마지노선이 눈썹 길이를 따라 3~4칸으로 늘어난다** (원장님 지시
     2026-08-30): 「사진이 늘어나거나 눈썹이 길어지면 3, 3.5, 최대 4칸까지 마지노선.
     4칸 전에 눈꼬리가 3·3.5·4 사이에 걸리면 눈꼬리를 마지노선 쪽으로 더 밀어내지
     않는다」. 고정 3칸은 **눈썹 자체가 길수록**(그만큼 산꼭대기~피부 경계도 자연히
     더 멀어질 여지가 있는데) 그대로면 오히려 너무 헐거울 수 있다 — 그래서 **산꼭대기~
     꼬리쪽 끝의 실제 길이(눈금 단위, `browSpanUnits` — 확대율과 무관하게 이미 눈금
     단위라 사진이 늘어나도 그대로)** 를 보고 12칸 이하(보통 눈썹, 지금 4장 전부 이
     아래)면 3칸, 20칸 이상(많이 긴 눈썹)이면 4칸, 그 사이는 선형으로 3~4칸. **자
     자체(①②③)에만 적용** — ②의 못 찾음 표준값(눈꼬리)은 **더는 마지노선 쪽으로
     밀어내지 않는다.** 눈꼬리는 랜드마크로 실측한 자리라 그 자체가 이미 신뢰할
     기준이고, 억지로 3~4칸 밖으로 미는 게 오히려 얼굴 비율을 왜곡했다.
     ⚠️ **12·20칸 경계는 아직 미검증** — 지금 4장(10.4~14.75칸)은 전부 3칸 근처라
     안 흔들리는 걸 확인했을 뿐, 실제로 긴 눈썹 사진을 받아 봐야 20칸 근처가
     맞는지 확정된다. 사례가 더 필요하다. */
  {
    const peakTop = smoothTop(pk);
    const fall = Math.max((at(1 - END, 1, "top") || peakTop) - peakTop, 4);
    const ARCHV_EPS_FRAC = 0.05;  // 꺾임점의 0.15 보다 훨씬 작다 — 「막 비치기 시작」 기준
    const ARCHV_EPS = Math.max(1.5, ARCHV_EPS_FRAC * fall);
    const ARCHV_HOLD = 5;        // 연속 이 열이 계속 피부 + 계속 증가여야 확정 (가짜 상승 방어, v3.0.1)
    const ARCHV_TOL = 0.5;       // 버팀 중 이만큼의 흔들림(결 노이즈)은 「감소」로 안 침
    const tickPx = frontTickPx();
    /* v3.1.0 — 눈썹 길이(눈금)에 따라 마지노선 3~4칸 (⚠️ 12·20 미검증, 위 주석 참고) */
    const BROW_SPAN_LO = 12, BROW_SPAN_HI = 20;   // 이 아래=3칸 · 이 위=4칸 · 사이는 선형
    const FLOOR_LO = 3, FLOOR_HI = 4;
    /* v3.3.1 — 넘버링 상한선 (원장님 확정 2026-08-30). 확정 4장 17.65~25.46 · 오류값 34~35.4.
       ⚠️ 상한은 원장님 승인값 30 에서 **31 로 한 칸 넓혔습니다** — 회귀 91(아치가 안쪽에 있는
       모양 B)의 확정 지점이 넘버링으로 30.46 이라 30 에 걸렸기 때문입니다. 31 이어도
       오류값(34~35.4)과는 3.5칸 여유가 있습니다. 더 좁히려면 모양 B 같은 눈썹을 포기해야
       합니다 — 그러지 마세요. */
    /* ⭐⭐ v3.27.0 — **하한 15 폐지 → 「꼬리 자리에서 3칸 안쪽」** (원장님 확인 2026-09-02, 실제 사진에 노란 선으로
       아치선을 짚어 주심: 「아치 세로선부터 잘못되었다」). 그 사진에서 픽셀 판독은 원장님 노란선 자리(num 8.4)를
       정확히 찾았는데 절대 하한 15 에 걸려 버려지고 표준값 23(눈썹 몸통 한가운데)에 섰다. 눈 사이가 좁고
       눈썹이 긴 얼굴은 눈금 자가 작아 넘버링이 통째로 바깥으로 밀리므로(꼬리가 num 0 이하), 하한은
       **그 얼굴의 꼬리 자리(v4)에 상대적**이어야 한다. 상한 25(실기기 오류 34~35 방어)는 그대로.
       v3.1.0 주석에 적어 둔 「긴 눈썹 사진이 오면 넓혀야 한다」의 그 사례다. 확정 4장(17.6~25.5)은 영향 없음. */
    const ARCHV_NUM_HI = ARCHV_NUM_MAX, ARCHV_NUM_STD = ARCHV_NUM_23;
    const ARCHV_TAIL_IN = 3;
    const browSpanUnits = tickPx ? Math.abs(seq[n - 1].x - seq[pk].x) / tickPx : 0;
    const spanT = Math.max(0, Math.min(1, (browSpanUnits - BROW_SPAN_LO) / (BROW_SPAN_HI - BROW_SPAN_LO)));
    const floorUnits = FLOOR_LO + spanT * (FLOOR_HI - FLOOR_LO);
    const MIN_OUT_PX = tickPx ? tickPx * floorUnits : 0;   // 산꼭대기에서 최소 3~4칸 — 그 안쪽은 후보 자격 없음
    let outI = -1, hold = 0, firstI = -1, prevD = null;
    for (let i = pk; i <= n - 1; i++) {
      const d = smoothTop(i) - peakTop;
      const farEnough = Math.abs(seq[i].x - seq[pk].x) >= MIN_OUT_PX;
      const cont = farEnough && d >= ARCHV_EPS && (hold === 0 || d >= prevD - ARCHV_TOL);
      if (cont) {
        if (hold === 0) firstI = i;
        hold++;
        prevD = d;
        if (hold >= ARCHV_HOLD && outI < 0) outI = firstI;
      } else {
        hold = 0; prevD = null;
        if (farEnough && d >= ARCHV_EPS) { hold = 1; firstI = i; prevD = d; }
      }
    }
    /* 순서 — ① 픽셀 판독(주역) → ② 눈꼬리 랜드마크 → ③ 산꼭대기 + 마지노선.
       ⛔ v3.1.0 — 눈꼬리를 마지노선(3~4칸) 밖으로 억지로 밀지 않는다 (원장님 지시:
          「4칸 전 눈꼬리가 3·3.5·4에 걸릴 경우 눈꼬리가 마지노선으로 더 늘어나지
          않는다」). 마지노선은 ①의 픽셀 판독 후보를 거르는 자이지, 랜드마크로 실측한
          눈꼬리까지 밀어낼 이유가 없다 — 밀면 오히려 실제 얼굴 비율에서 벗어난다. */
    const eyeR = eyeArchRange(seq[0].x < cx ? "L" : "R");   /* 판독에 실제로 쓰인 쪽 */
    /* ❌ v3.2.0 — 시도했다가 **접은 것**: 눈 기준 구간(eyeArchRange 의 `a`·눈동자 바깥
       끝)으로 픽셀 판독을 **검증**하려 했습니다 (원장님 질문 2026-08-30: 「눈꼬리 랜드마크
       설정하는것도 좋은 방법이니?」). 픽셀 판독이 눈동자 바깥 끝보다 코 쪽으로 들어오면
       눈썹 몸통을 짚은 것으로 보고 버리는 안이었습니다.
       접은 이유: **회귀 91 이 바로 잡았습니다** — 모양 B(아치가 안쪽 x260 에 있는 눈썹)의
       **정상 판독(234)** 을 「너무 안쪽」으로 오판해 눈꼬리(150)로 버렸습니다. 눈 구간은
       사람마다 눈썹-눈 배치가 달라 **판독을 감시할 만큼 촘촘한 자가 못 됩니다** —
       아치가 안쪽에 있는 눈썹이 정상인데 그걸 이상으로 읽습니다.
       ⛔ 문턱만 느슨하게 해서 되살리지 마세요 — 통과하게 맞춘 문턱은 근거가 없습니다.
       이번 실기기 버그(아치선이 눈동자보다 한참 안쪽)는 애초에 **열 순서 뒤집힘**이
       원인이고, 그건 `seqOrient` 에서 막습니다. 눈꼬리는 지금처럼 **못 찾았을 때의
       표준값(②)** 으로만 씁니다 — 판독의 감시자로는 쓰지 않습니다. */
    /* ⭐⭐ v3.3.1 — **넘버링 상한선** (원장님 지시 2026-08-30: 「눈 앞꼬리가 40으로 맞춰지는
       판이 있는데, 앞 40에서 바깥으로 나와 25 혹은 23에 위치하는 게 어렵니?」 → 확정 승인).
       넘버링 판(내안각 40 · 센터 53.15)은 확대율·얼굴 크기를 이미 정규화한 자라 폰에서도
       정상이었습니다(오류 화면에서도 이너 43.88 이 맞았습니다). 그 자로 픽셀 판독을 거릅니다:
       판독 결과가 **num 15~30 을 벗어나면 버립니다.** 확정 4장이 17.65~25.46 이고, 실기기
       오류값이 34~35.4 였으므로 이 범위가 정상과 오류를 가릅니다.
       버린 뒤에는 ② 눈꼬리 랜드마크(사람마다 실측이라 표준값보다 정확) → ③ **표준값 23**
       (확정 4장의 중앙값 22.83 ≒ 원장님이 짚으신 23) → 눈금 자가 없으면 산꼭대기+마지노선.
       ⚠️ 이 범위는 확정 4장 + 실기기 오류 사진으로 정한 것입니다 — 아주 짧거나 긴 눈썹이
          15~30 을 벗어나는 사례가 나오면 넓혀야 합니다.
       ⚠️ v3.2.0 에서 접은 「눈 구간 검증」과 다릅니다 — 그건 비율 자(사람마다 다른 눈썹-눈
          배치)라 모양 B 를 오판했고, 이것은 **넘버링 절대값**이라 모양 B(확정 지점 num 30.46)를 다치게
          하지 않는지 회귀 91 로 확인했습니다 — 그래서 상한이 31 입니다. */
    const numOf = (xpx) => tickPx ? 53.15 - Math.abs(xpx - cx) / tickPx : null;
    const outNum = outI >= 0 ? numOf(seq[outI].x) : null;
    const tailNum = numOf(S.g.v4 * W);                                   /* 꼬리 자리(방금 위에서 확정) */
    const ARCHV_NUM_LO = tailNum === null ? -Infinity : tailNum + ARCHV_TAIL_IN;
    const numOk = outNum === null || (outNum >= ARCHV_NUM_LO && outNum <= ARCHV_NUM_HI);
    /* ⭐ v3.2.0 — **판독 근거를 남긴다** (이너의 `S.innerRead` 와 같은 방식).
       이번 실기기 버그를 찾는 데 오래 걸린 이유가 「무엇을 보고 그 자리에 섰는지」가
       아무 데도 안 남아서였습니다. 회귀 176 이 이 값을 읽습니다. */
    S.archRead = { pkX: seq[pk].x, outX: outI >= 0 ? seq[outI].x : null,
                   floorUnits, minOutPx: MIN_OUT_PX, browSpanUnits,
                   tailNum: tailNum === null ? null : Math.round(tailNum * 10) / 10,
                   numLo: Number.isFinite(ARCHV_NUM_LO) ? Math.round(ARCHV_NUM_LO * 10) / 10 : null,
                   pkNum: dispV(seq[pk].x / W),
                   outNum: outNum === null ? null : Math.round(outNum * 10) / 10, numOk,
                   from: outI >= 0 && numOk ? "pixel" : tickPx ? "std23" : "floor" };
    if (outI >= 0 && numOk) {
      setLine("v6", clamp(S.g.v1 - Math.abs(seq[outI].x - cx) / W, 0.02, 0.98));
    } else if (tickPx) {
      /* ⛔⛔ v3.4.0 — **못 읽거나 25 를 넘으면 무조건 23** (원장님 확정 2026-08-30:
         「25가 넘어가는 자리에 있어 오류가 보고될 경우 23으로 자동위치 채택한다,
          절대위치로 못 받는다. 오류로 못 읽으면 23」).
         ❌ **눈꼬리 랜드마크 대체는 폐지했습니다** — 눈꼬리는 사람에 따라 25 를 넘는 자리라
            「절대위치로 못 받는다」는 지시와 충돌합니다. 판독이 못 미더우면 답은 23 하나입니다.
         ⛔ 눈꼬리 대체를 되살리지 마세요 — 회귀 177 이 잡습니다. */
      setLine("v6", clamp(S.g.v1 - ((53.15 - ARCHV_NUM_STD) * tickPx) / W, 0.02, 0.98));
    } else {
      /* v3.2.0 — 눈금 자마저 없을 때: 산꼭대기 + 마지노선(3~4칸).
         예전에는 여기서 아무것도 안 해서 산꼭대기 값(0칸)이 그대로 남았습니다. */
      setLine("v6", clamp(S.g.v1 - (Math.abs(seq[pk].x - cx) + MIN_OUT_PX) / W, 0.02, 0.98));
    }
    archVCap();   /* ⛔ v3.4.0 — 어느 길로 왔든 25 넘으면 23 (위 archVCap 주석) */
  }
  /* ⭐ v3.3.1 — **점선 진단**: 앱이 읽은 눈썹 윗선을 화면에 그대로 보여 줄 수 있게 남긴다
     (원장님 확인 2026-08-30: 「점선으로 판독한 방법은 뭐니?」 — 그 점선이 이 seq 입니다).
     실기기에서만 나는 증상이라, 폰이 만든 점선을 폰 화면에서 직접 봐야 어긋난 지점이
     보입니다. showArchDots() 가 이 값을 그립니다. ⏸ 원인이 잡히면 떼도 됩니다.

     ⭐ v3.4.1 — **꼬리까지 그린다** (원장님 지시 2026-08-30: 「파란 선을 그대로 꼬리까지
     인식하여 꼬리 배치 고도화 할 수 있니?」). 앱은 이미 꼬리까지 읽고 있었습니다 —
     꼬리선(v4)이 쓰는 자료는 `seqT`(= seq + tailAdd)인데 점은 `seq` 만 그려서, 화면에서
     점이 꼬리 앞에서 끊겨 보였습니다. 이제 `seqT` 를 그리고 **이어 붙인 꼬리 열은 보라색**
     으로 구분합니다. 꼬리선이 실제로 어느 열에 섰는지도 분홍 점으로 같이 찍습니다.
     ⚠️ **판독 로직은 하나도 안 건드립니다** — 보이는 것만 늘렸습니다.
     ⛔ 「마지막 점 = 꼬리」로 바꾸지 마세요 — 원장님 확정 「얇은털 따라가는것 금지」(v1.71.0)
        「검은 드로잉이 끝나는 곳」(v1.72.0)과 충돌합니다. 회귀 122·123 이 잡습니다. */
  S.archDots = seqT.map((p, i) => ({ x: p.x, top: p.top, bot: p.bot, tail: i >= n }));
  return true;
}

/* ⭐ v3.3.1 — 진단: 앱이 읽은 눈썹 윗선을 점으로 8초간 표시.
   render() 와 무관한 별도 SVG 라 다음 render 에 지워지지 않고, 시간이 지나면 스스로 사라진다.
   저장본에는 안 찍힌다(exportImage 와 무관).
     초록 = 아치선(v6)이 선 자리 · 분홍 = v3.4.1 — 꼬리선(v4)이 선 자리
     흰점 = v3.6.0 — 두 모서리가 만난다고 본 자리(수렴점)
     민트(큰) = 앞머리 최종값 · 민트(작은) = 앞두께 최종값
       — v3.11.0: 이 진하고 큰 점들은 frontDecide/archDecide 가 앞머리·이너 위치·해부학
         순서(아치두께 ≤ 앞머리 ≤ 꼬리)까지 반영해 **최종 확정한 값**이다. 원장님이 지적하신
         "점선이 쌍꺼풀에 찍힌다"는 사례는 이 최종값이 아니라 raw seq 쪽이었음을
         2026-09-01 실기기 확인으로 확정 — 원장님 확인: "정확히 드로잉 위에".
       — v3.12.0: (이후 v3.15.0에서 삭제) raw 점을 옅게 처리했었다.
       — ⭐ v3.15.0 — **기본 표시를 줄였다** (원장님 지시 2026-09-02: 「처음 들어가면 …
         민트점 두개·아치선위 초록점·꼬리선 위 핑크·흰점 빼고 모든점은 숨기기 · 다른 점들은
         시스템 내부에서만 작동하도록」). raw 열별 원본(seq) 점 · 아치엣지/아치두께(파랑)
         최종값 · 산꼭대기(주황) 표시점은 **더 이상 그리지 않는다** — 그 값 자체(S.archDots·
         S.archRead·h2·archThickness)는 그대로 계산되고 가이드 배치에 그대로 쓰인다, 화면에만
         안 그릴 뿐이다("시스템 내부에서만 작동"). 이 진단점 다섯 개(민트 2·초록·분홍·흰)만
         남기고, 나머지 전체(raw + 파랑 2 + 주황)는 **미러링 켤 때**(runBalanceCurve의
         readSideCurve trace, renderBalCurve)에서 이미 모든 열을 점으로 다시 보여준다 —
         원장님 지시: 「모든 점들은 미러링사용시 사용하고 싶음」. */
let archDotsTimer = null;
function showArchDots() {
  try {
    const stage = document.getElementById("stage");
    if (!stage || !S.archDots || !S.archDots.length) return;
    const { W, H } = S.dim;
    const old = document.getElementById("archDotsOverlay");
    if (old) old.remove();
    clearTimeout(archDotsTimer);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.id = "archDotsOverlay";
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;z-index:60;";
    const dot = (x, y, r, fill) => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r);
      c.setAttribute("fill", fill); c.setAttribute("stroke", "#14161B"); c.setAttribute("stroke-width", "0.6");
      svg.appendChild(c);
    };
    /* v3.15.0 — top0(기준 높이)는 초록·분홍 점 위치 계산에 여전히 필요하다 —
       raw 점 자체를 그리지 않아도 S.archDots 값으로 계산은 그대로 한다. */
    const top0 = S.archDots.reduce((m, p) => Math.min(m, p.top), 1e9) - 6;
    const a = S.archRead;
    /* v3.4.1 — 꼬리선이 선 자리. 점들의 끝과 견줘 보라고 같이 찍는다 */
    if (S.g.v4 !== undefined) dot(S.g.v4 * W, top0, 4, "#FF4D94");
    if (a) dot(S.g.v6 * W, top0, 4, "#00C853");
    /* v3.6.0 — 두 모서리가 만난다고 본 자리(수렴점) — 흰 점 */
    if (S.tailRead && S.tailRead.tipY !== null) dot(S.tailRead.tipX, S.tailRead.tipY, 3.2, "#FFFFFF");
    /* ⭐ v3.11.0 — **최종 확정값**도 함께 찍는다 (원장님 지시 2026-09-01: 점선이 쌍꺼풀
       같은 엉뚱한 자리에 찍히는 문제 — raw seq 만 보여서는 그게 "원본 노이즈"인지
       "진짜 최종 판독 실패"인지 구분이 안 됐다). frontDecide/archDecide 가 이너·앞머리
       위치와 해부학 순서까지 반영해 확정한 자리라, raw seq 보다 훨씬 안정적이다.
       x 좌표는 표시용으로만 frontDecide 의 ix 계산을 그대로 옮겨 온 것 — 판독 로직에는
       전혀 관여하지 않는다. */
    {
      let ix = S.g.v2 * W;
      const ir = S.innerRead;
      if (ir && ir.fRaw != null && ir.fRaw > INNER_F_SOFT && ir.anchor)
        ix = clamp(S.g.v1 - ir.anchor * (1 - ir.fRaw), 0.02, 0.98) * W;
      dot(ix, S.g.front * H, 5, "#5EEAD4");
      dot(ix, S.g.frontThickness * H, 3.4, "#5EEAD4");
      /* v3.15.0 — 아치엣지(h2)·아치두께 파랑 점은 기본 표시에서 뺐다(위 설명). 계산은 그대로:
         const pkX = a ? a.pkX : S.g.v6 * W; h2Y = S.g.h2*H; archThicknessY = S.g.archThickness*H; */
    }
    stage.appendChild(svg);
    archDotsTimer = setTimeout(() => { const el = document.getElementById("archDotsOverlay"); if (el) el.remove(); }, 8000);
  } catch (e) { /* 진단 표시는 실패해도 조용히 — 본 기능에 영향 없음 */ }
}

/* ⛔⛔⛔ v3.4.0 — **아치선은 넘버링 25를 절대 넘지 않는다. 넘으면 23.**
   (원장님 확정 2026-08-30 · 실기기 사진 5장으로 직접 확인)
   ───────────────────────────────────────────────────────────────────────────
   원장님 말씀 그대로: 「사진이 들어오는데 모두 최대 25 이상을 넘어가지 않아. 사진 4와 5는
   같은 사진인데 비율이 커지나 작아지나 25 이상을 넘어가지 않고. 그러니 상한선 25로 강행.
   25가 넘어가는 자리에 있어 오류가 보고될 경우 23으로 자동위치 채택한다, 절대위치로 못
   받는다. 오류로 못 읽으면 23. 자동 범위계산이 25 이상 상한을 넘으면 23. 이는 AI 자동배치에서
   절대 있어서는 안 되는 자리 29 혹은 30 같은 위치에 있어서는 안 되는 오류를 범하면 안 되기
   때문이다」

   실기기 5장 실측(아치선): 21 · 24 · 23 · 23 · 24 — 전부 25 이하. 4·5번은 **같은 사진을
   확대율만 달리한 것**인데 둘 다 25 이하였습니다. 반면 고장난 판독은 34~35 에 섰습니다.

   ⛔ 이 자는 **모든 경로에 걸립니다** — 픽셀 판독·눈꼬리 랜드마크·랜드마크 초기배치
      (`placeLines`) 전부. 29·30 같은 자리는 어떤 길로도 화면에 나오면 안 됩니다.
   ⚠️ 눈금 자가 없으면(랜드마크·동공 정렬 실패) 아무것도 하지 않습니다 — 잴 수 없으면 가두지 않는다.
   ⚠️ 합성 회귀 픽스처(모양 A 확대본 26.3 · 모양 B 30.3)는 이 자에 걸려 23 으로 갑니다.
      원장님 규칙이 절대값이므로 **픽스처 기대값을 규칙에 맞춰 고쳤습니다** (회귀 90·91·177). */
const ARCHV_NUM_MAX = 25;   // 아치선 절대 상한 (원장님 확정)
const ARCHV_NUM_23  = 23;   // 넘으면 무조건 이 자리
/* ⭐⭐ v1.81.0 — **아치두께의 마지노선** (원장님 지시 2026-08-27 「아치두께는 절대로 꼬리 밑으로 내려오지 않는다 ·
   앞머리와 같은 선이거나 높은 곳」). 해부학 순서 **아치두께 ≤ 앞머리 ≤ 꼬리**(y 는 아래로 갈수록 큼)를 넘었다면
   눈꺼풀 그늘을 읽은 것 → 마지노선까지 올린다. ⛔ 지우지 마세요 — 회귀 133.
   AT_GAP — 상한에 딱 붙이지 않고 3px 위(못박음 검사 131 과 부딪히지 않게).
   ⭐ v3.27.0 — **1.5칸 여유** (원장님 확정 2026-09-02 「두께는 C」). 일자형 눈썹은 아치 아랫선과 꼬리·앞머리가
   거의 같은 높이라 읽은 값이 마지노선을 1.5칸 이내로 넘는데, 그것까지 올려 세우면 정답이 밀린다(실제 사진:
   꼬리 자 20.4칸 · 읽은 아치두께 19.6칸 → 예전엔 20.9칸으로 올렸다). archDecide 의 해부학 여유(frontTk − 1.5)와
   같은 숫자. **1.5칸을 넘게 낮으면 그늘로 보고 예전처럼 마지노선까지 올린다** — 회귀 133 그대로 · 189 신규.
   돌려주는 값: 올렸으면 true. */
function applyArchThickFloor() {
  const { H } = S.dim;
  if (!H) return false;
  const AT_GAP = 3 / H;
  const floor = S.g.h2 + 4 / H;                          // 아치 윗선보다는 반드시 아래
  const lim = Math.max(floor, Math.min(S.g.h3, S.g.front) - AT_GAP);
  const tk = frontTickPx();
  const tol = tk ? (1.5 * tk) / H : 0;
  if (S.g.archThickness > lim + tol) { setLine("archThickness", lim); return true; }
  return false;
}

function archVCap() {
  const { W } = S.dim, g = S.g;
  if (!W) return false;
  const tk = frontTickPx();
  if (!tk) return false;
  const cx = g.v1 * W;
  const num = 53.15 - Math.abs(g.v6 * W - cx) / tk;
  if (num <= ARCHV_NUM_MAX) return false;
  setLine("v6", clamp(g.v1 - ((53.15 - ARCHV_NUM_23) * tk) / W, 0.02, 0.98));
  if (S.archRead) { S.archRead.capped = true; S.archRead.wasNum = Math.round(num * 10) / 10; }
  return true;
}

/* ⚠️ v1.70.0 — 아치선이 놓일 수 있는 **눈 기준 구간** (원장님 지시 2026-08-24)
   「보통 1·2·3 에 위치한다 — ① 검은 눈동자 바깥 끝과 눈꼬리 사이 ② 눈꼬리
     ③ 눈꼬리에서 나온 꼬리 섀도우」
   랜드마크가 없으면 null (가두지 않는다). 눈 바깥으로 조금(EYE_TAIL) 더 허용합니다. */
const EYE_TAIL = 0.35;      // 눈꼬리 바깥으로 눈 너비의 이 비율까지 (③ 꼬리 섀도우)
function eyeArchRange(side) {
  const lm = S.landmarks; if (!lm) return null;
  try {
    const P = (i) => imgToCanvas(lm[i].x * S.iw, lm[i].y * S.ih, S.p);
    const corners = [33, 133, 362, 263].map(P).sort((a, b) => a.x - b.x);
    const outerL = corners[0], innerL = corners[1], innerR = corners[2], outerR = corners[3];
    /* lmAvg 는 **이미지 픽셀**을 돌려줍니다 (S.iw/S.ih 를 이미 곱한 값) — 다시 곱하지 마세요.
       왼쪽/오른쪽은 인덱스 규약이 아니라 **화면 x** 로 고릅니다 (사진이 뒤집혀도 안전). */
    const i1 = imgToCanvas(lmAvg(lm, IRIS_L).x, lmAvg(lm, IRIS_L).y, S.p);
    const i2 = imgToCanvas(lmAvg(lm, IRIS_R).x, lmAvg(lm, IRIS_R).y, S.p);
    const useL = side === "L";
    const ip = (i1.x <= i2.x) === useL ? i1 : i2;
    const outer = useL ? outerL : outerR, inner = useL ? innerL : innerR;
    const wide = Math.abs(outer.x - inner.x);
    if (!(wide > 8)) return null;      // 눈 코너를 못 받았으면 가두지 않는다 (엉뚱한 범위 방지)
    const irisEdge = ip.x + (useL ? -1 : 1) * wide * 0.18;      // ① 눈동자 바깥 끝
    const tailShadow = outer.x + (useL ? -1 : 1) * wide * EYE_TAIL; // ③ 꼬리 섀도우
    return { a: irisEdge, b: tailShadow, corner: outer.x };    // corner = ② 눈꼬리 그 자체
  } catch (e) { return null; }
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
/* ⭐ v1.87.0 — **「초기화셋팅」** (원장님 지시 2026-08-28 · 이름도 원장님이 붙였습니다)
   블링킹 + 모든 선 전체 색 보임 → 가이드 첫 스텝 시작.
   「블링킹이 너무 짧다 — 세로에서 가로로 돌리는 사용자의 액션 때문에 첫 셋팅 전체 색 보임이
    더 길어져야 한다」 → 1.6초 → **4초**. 폰을 돌리는 동안 지나가 버리지 않게.
   작동하는 네 곳: ① 앱을 처음 열어 사진을 불러왔을 때 ② 사진을 다시 불러왔을 때
   ③ 초기화 버튼 ④ 가이드를 껐다가 다시 켰을 때.
   ⭐ v1.88.0 (원장님 지시 2026-08-28) — ① 시간 4000 → **3200** (「아주 조금만 짧게」)
   ② 사용자가 **선을 움직이기 시작하면 즉시 종료** (endIntroEarly — 이미 익숙해졌다는 뜻).
   조기 종료 때는 첫 스텝을 강제로 켜지 않습니다 — 방금 잡은 선이 곧 차례가 됩니다.
   ⛔ 트리거를 빼거나 시간을 크게 바꾸지 마세요 — 회귀 141 이 잡습니다. */
const INTRO_MS = 3200;
let introTimer = null;
function startIntro() {
  S.intro = true;
  S.guideCur = null;
  clearTimeout(introTimer);
  introTimer = setTimeout(() => {
    S.intro = false;
    if (S.guideOn) { S.guideCur = GUIDE_FLOW[0]; noteSel(GUIDE_FLOW[0]); }
    render();
  }, INTRO_MS);
}
/* 초기화셋팅 조기 종료 — 선을 움직이는 순간. 차례는 움직인 선 쪽 로직이 정한다 */
function endIntroEarly() {
  if (!S.intro) return;
  S.intro = false;
  clearTimeout(introTimer);
}
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
    S.photoType = (file && file.type) || "";   /* v1.97.0 — 예비 동공 정렬의 SVG(테스트 자산) 구분용 */
    photo.src = url;
    S.g = { ...DEFAULT_GUIDE };
    S.p = { ...DEFAULT_PHOTO };
    S.activePreset = null;
    S.balOn = false; S.balance = null; S.balCurve = null; S.balAnim = null;
    /* ⭐ v3.26.0 — 새 사진도 **잠금 상태로 시작** (원장님 지시 2026-09-02: 「사진 잠금은 앱이 시작되면 잠금 상태로
       시작하고 사용자가 끄면 색상 조금 더 꺼진 느낌으로」). 시술 중 사진이 손에 밀리지 않는 것이 기본.
       사진을 옮기려면 잠금을 풀어야 한다. 첫 자동 정렬(runFaceAI→autoAlign)은 잠금과 무관하게 사진을 놓는다.
       ⚠️ 초기화·AI 눈썹정렬은 잠금 중엔 사진 위치를 유지하고 선만 다시 잰다(v3.9.1) — 그 규칙 그대로. */
    S.locked = true;
    S.hiddenSnapshot = null;
    S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line"; S.multi = false; S.selSet = [];
    S.pickMode = false;
    S.pick = [];
    S.brightnessOn = false;
    S.exposureBrightnessValue = 0;
    /* v1.47.0 원장님 지시 — 「가이드는 앱이 켜지면 항상 시작 상태로 유지, 사용자가 클릭할 때만 꺼짐」
       사진이 올라와 편집이 시작될 때마다 가이드 ON + 이너부터. 끄는 건 가이드 버튼 클릭뿐. */
    S.guideOn = true;
    /* ⭐ v1.81.0 — 원장님 지시 2026-08-27: 「앱이 열리면 가이드 첫 라인이 시작되기 전에
       **전체라인이 아주 살짝 두껍게 밝게** 표시되고, 동시에 **1번 가벼운 블링킹** 뒤에
       가이드 첫 라인 시작해라. 첫 사진 불러오자마자 이너 라인만 색이 있고 나머지는
       검정색이라 사용자가 이게 뭐지? 한다」
       ⚠️ 이 타이머는 **한 번만** 도는 플래그 전환입니다 — v1.54.0 처럼 매 프레임 render() 를
          돌리는 깜빡임이 아닙니다 (BASELINE 1-24 의 ⛔ 는 그쪽을 막는 것입니다). */
    S.doneSet = [];
    startIntro();               /* 초기화셋팅 ①② — 처음 열었을 때 · 사진을 다시 불러왔을 때 */
    clearHist();                 /* 새 사진 = 되돌리기 기록 초기화 */
    show("editor");
    $("exposureBrightnessSlider").value = 0;  /* EXPOSURE/밝기 슬라이더 초기화 */
    photo.style.filter = "";                   /* 필터 초기화 */
    requestAnimationFrame(() => {
      measure();
      render();
      updateButtons();
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
  /* ② 묶음별 색상표 (가로 자) */
  [["swInner", "inner"], ["swArch", "arch"], ["swTail", "tail"]].forEach(([id, key]) => {
    const box = $(id); box.innerHTML = "";
    PALETTE.forEach((p) => box.appendChild(swatchBtn(p.hex, L[key] === p.hex, () => lookSet({ [key]: p.hex }))));
  });
  /* ②-b **세로선 색** — 세 선을 한 줄에, 각자 이름표를 달고 (v1.81.0 원장님 지시 2026-08-27).
     목록은 민트·먹색·흰색 세 가지뿐입니다 (V_PALETTE 주석 참고). */
  {
    const box = $("swVAll");
    if (box) {
      box.innerHTML = "";
      [["v2", "vInner"], ["v6", "vArch"], ["v4", "vTail"]].forEach(([lineKey, key]) => {
        const g = document.createElement("span");
        g.className = "vgrp";
        const b = document.createElement("b");
        b.textContent = labelOf(lineKey);
        g.appendChild(b);
        V_PALETTE.forEach((p) => g.appendChild(swatchBtn(p.hex, L[key] === p.hex, () => lookSet({ [key]: p.hex }))));
        box.appendChild(g);
      });
    }
  }
  /* v1.57.0 — 잡은 선(드래그)의 심·테두리. v1.59.0 — 테두리에 **없음** 추가 (사선 스와치) */
  [["swDragC", "dragCore", ["#FFFFFF"]], ["swDragE", "dragEdge", [APRICOT, "none"]],
   /* v1.95.0 — 놓은 선 색 (원장님 지시 2026-08-29). 팔레트 8색 그대로 */
   ["swDoneC", "doneC", []]].forEach(([id, key, extra]) => {
    const box = $(id); if (!box) return; box.innerHTML = "";
    [...PALETTE.map((p) => p.hex), ...extra].forEach((hex) => {
      const b = swatchBtn(hex === "none" ? "transparent" : hex, L[key] === hex, () => lookSet({ [key]: hex }));
      if (hex === "none") { b.classList.add("none"); b.title = t("set_none"); }
      box.appendChild(b);
    });
  });
  /* ③ 테두리 색 — **없음 / 흰색 / 검정 / 먹색** (v1.81.0 · 「자동」 폐지).
     색을 고르는데 굵기가 0 이면 아무 변화가 없어 고장처럼 보입니다 → 그때만 70% 로 올려 줍니다. */
  const edgeC = $("segEdgeC"); edgeC.innerHTML = "";
  [["none", t("set_none")], ["light", t("set_light")], ["black", t("set_black")], ["dark", t("set_dark")]]
    .forEach(([v, lb]) => edgeC.appendChild(segBtn(lb, L.edgeC === v, () =>
      lookSet(v !== "none" && !(L.edge > 0) ? { edgeC: v, edge: 70 } : { edgeC: v }))));
  /* v1.81.0 — **선 굵기·테두리 굵기도 슬라이더** (원장님 지시 2026-08-27 「드레그 조정으로 변경」).
     ⛔ 3단(얇게·중간·두껍게) 세그먼트로 되돌리지 마세요 — 그 사이 값을 만들 수 없습니다. */
  $("rngW").value = Math.round(L.weight * 100);
  $("wVal").textContent = Math.round(L.weight * 100) + "%";
  $("rngEdge").value = Math.round(L.edge);
  $("edgeVal").textContent = Math.round(L.edge) + "%";
  /* v1.68.0 — 「가로 길이」는 **슬라이더**. 3단(짧게·중간·길게)으로는 원장님이 원하시는
     **아주 짧은** 자를 만들 수 없었습니다. 값 = 자 전체 길이 ÷ 눈썹 폭 (%) */
  $("rngLen").value = Math.round(L.hlen * 200);
  $("lenVal").textContent = Math.round(L.hlen * 200) + "%";
  $("rngAlpha").value = Math.round(L.alpha * 100);
  $("alphaVal").textContent = Math.round(L.alpha * 100) + "%";
  /* 「모두 이 색」이 **눌렸다는 것이 보여야 한다** (원장님 지시 2026-08-27).
     상태로 표시합니다 — 세 묶음이 같은 색인 동안 계속 켜져 있어 눌렀는지 되짚을 필요가 없습니다. */
  { const b = $("lookAll"); if (b) b.classList.toggle("on", L.inner === L.arch && L.arch === L.tail); }
  /* v1.59.0 — 잡은 선 전용 굵기·투명도 (기본 선과 **값은** 완전 분리).
     v1.82.0 — 굵기도 **슬라이더**로 (원장님 지시 2026-08-27). 값은 따로, 조작 방식만 같습니다. */
  if ($("rngDragW")) {
    $("rngDragW").value = Math.round((L.dragW != null ? L.dragW : 1) * 100);
    $("dragWVal").textContent = Math.round((L.dragW != null ? L.dragW : 1) * 100) + "%";
    $("rngDragOp").value = Math.round((L.dragOp != null ? L.dragOp : 1) * 100);
    $("dragOpVal").textContent = Math.round((L.dragOp != null ? L.dragOp : 1) * 100) + "%";
  }
  /* v1.95.0 — 놓은 선 · 서브 라인 슬라이더 값 동기화 (원장님 지시 2026-08-29) */
  if ($("rngDoneW")) {
    $("rngDoneW").value = Math.round((L.doneW != null ? L.doneW : 1) * 100);
    $("doneWVal").textContent = Math.round((L.doneW != null ? L.doneW : 1) * 100) + "%";
    $("rngDoneOp").value = Math.round((L.doneOp != null ? L.doneOp : 1) * 100);
    $("doneOpVal").textContent = Math.round((L.doneOp != null ? L.doneOp : 1) * 100) + "%";
  }
  if ($("rngSubW")) {
    $("rngSubW").value = Math.round((L.subW != null ? L.subW : 1) * 100);
    $("subWVal").textContent = Math.round((L.subW != null ? L.subW : 1) * 100) + "%";
    $("rngSubOp").value = Math.round((L.subOp != null ? L.subOp : 0.16) * 100);
    $("subOpVal").textContent = Math.round((L.subOp != null ? L.subOp : 0.16) * 100) + "%";
  }
  lookPreview();
}
const HLEN_MIN = 0.04, HLEN_MAX = 0.30;

/* ═══ 설정 미리보기 (v1.81.0 · 원장님 지시 2026-08-27) ═══════════════════
   「설정에서 선들이 미리보기가 되어있는데 그냥 선들이 정렬되어있어.
     **선의 이름과 그 선이 눈썹 위에 올려지는 위치가 매칭되어 보일수 있게**
     눈썹 드로잉을 밝은피부·어두운피부로 올린 뒤 각 선들이 위치하는 것을 그 위에 올려
     색을 변경할 때 어떤식으로 보여질지 미리보기를 **더 크게**」

   목적 — 초보자가 **선 이름 ↔ 색 ↔ 눈썹에서의 자리**를 설정 화면에서 한 번에 본다.
   ⛔ 선을 그냥 나란히 긋던 예전 미리보기로 되돌리지 마세요.

   ⚠️ 눈썹은 **코드로 그립니다 (사진 파일이 아닙니다)** — 원장님 확인 2026-08-27.
      ① 오프라인 앱이라 사진을 넣으면 용량과 sw.js 캐시가 그만큼 무거워집니다
      ② 저장소가 **공개**라 고객 얼굴 사진을 올릴 수 없습니다 (BASELINE 1-10)
      윤곽은 원장님 드로잉 사진의 비율을 따라 잡았습니다 — 꼬리가 가장 낮고,
      아치두께는 앞머리보다 위입니다 (드로잉 맞춤의 판정 규칙과 같은 모양). */

/* 눈썹 윤곽 — x 0 = 꼬리(화면 왼쪽) … 1 = 앞머리(코 쪽) · y 0 = 위 … 1 = 아래
   ⚠️ 이 비율은 **판정 규칙과 같은 눈썹**입니다 (BASELINE 1-34 · 아래 1-41):
     꼬리가 가장 낮고(0.78) · 아치두께(0.545)는 앞머리(0.70)보다 위 · 꼬리 끝은 뾰족하다.
   ⛔ 이 순서가 깨진 눈썹으로 바꾸지 마세요 — 미리보기가 앱의 판정과 다른 말을 하게 됩니다. */
const PV_UP = [[0, .765], [.04, .63], [.10, .50], [.18, .40], [.28, .31], [.40, .235], [.53, .21], [.66, .24], [.80, .31], [.92, .38], [1, .42]];
const PV_LO = [[0, .785], [.04, .72], [.10, .665], [.18, .625], [.28, .59], [.40, .555], [.53, .545], [.66, .565], [.80, .615], [.92, .685], [1, .735]];
/* 각 선이 이 눈썹 위에서 **실제로 놓이는 자리** — 위 윤곽에서 그대로 뽑은 값 */
const PV_Y = { h2: .21, frontThickness: .40, archThickness: .545, front: .71, h3: .785 };
const PV_X = { v4: .02, v6: .28, v2: .98 };
const PV_W = 360, PV_H = 320;          /* 한 칸 크기 (두 칸 = 720 × 320) */
const pvAt = (arr, t) => {
  for (let k = 0; k < arr.length - 1; k++) {
    const a = arr[k], b = arr[k + 1];
    if (t >= a[0] && t <= b[0]) return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
  }
  return arr[arr.length - 1][1];
};
/* 한 칸 안에서 눈썹이 차지하는 상자 */
function pvBox(x0) { return { x: x0 + 28, y: 54, w: 252, h: 152 }; }
/* 글자가 피부 위에서도 눈썹 위에서도 읽히게 — **대비색 헤일로**를 깔고 그 위에 선 색.
   ⚠️ 헤일로를 늘 어둡게 두면 **먹색 이름표가 검은 헤일로에 묻혀** 안 읽힙니다
   (세로선 기본이 먹색이 된 v1.81.0 에서 실제로 그랬습니다). 휘도로 갈라 주세요. */
function pvText(f, x, y, txt, color, anchor, size) {
  const t = mk("text", {
    x, y, fill: color, "font-size": size || 12, "font-weight": "800",
    "text-anchor": anchor || "start", "font-family": "system-ui,-apple-system,sans-serif",
    stroke: relLum(color) > 0.32 ? "#0A0D14" : "#FFFFFF", "stroke-width": 3.4, "stroke-opacity": .8,
    "paint-order": "stroke", "stroke-linejoin": "round",
  });
  t.textContent = txt;
  f.appendChild(t);
}
/* 한 칸 — 피부 + 눈썹 드로잉 + 눈 */
function pvBrowArt(f, x0, dark) {
  const skin = dark ? "#6E4C38" : "#EAC6A6";
  const shade = dark ? "#4E3327" : "#D6AC86";
  const ink = dark ? "#1E1310" : "#3A2A20";
  f.appendChild(mk("rect", { x: x0, y: 0, width: PV_W, height: PV_H, fill: skin }));
  /* 평평한 색판으로 보이지 않게 — 관자놀이·눈두덩 그늘 */
  f.appendChild(mk("ellipse", { cx: x0 + PV_W * .55, cy: PV_H * 1.3, rx: PV_W * .8, ry: PV_H * .68,
                                fill: shade, "fill-opacity": .45 }));
  f.appendChild(mk("ellipse", { cx: x0 + PV_W * .02, cy: PV_H * .45, rx: PV_W * .2, ry: PV_H * .8,
                                fill: shade, "fill-opacity": .3 }));
  const b = pvBox(x0);
  const pt = (t, up) => [b.x + t * b.w, b.y + pvAt(up ? PV_UP : PV_LO, t) * b.h];
  const pstr = (t, up) => pt(t, up).map((v) => v.toFixed(1)).join(",");
  const d = "M " + PV_UP.map(([t]) => pstr(t, true)).join(" L ")
          + " L " + PV_LO.slice().reverse().map(([t]) => pstr(t, false)).join(" L ") + " Z";
  /* 파우더 번짐 → 진한 심 (PMU 드로잉의 결) */
  f.appendChild(mk("path", { d, fill: ink, "fill-opacity": .18, stroke: ink,
                             "stroke-opacity": .14, "stroke-width": 5, "stroke-linejoin": "round" }));
  f.appendChild(mk("path", { d, fill: ink, "fill-opacity": .93 }));
  /* 털결 — 꼬리 쪽으로 눕는다 */
  for (let i = 1; i < 30; i++) {
    const t = .04 + (i / 30) * .93;
    const [x1, y1] = pt(t, false), [x2, y2] = pt(t, true);
    f.appendChild(mk("line", { x1: x1 + 3, y1: y1 - 1.5, x2: x2 - 4, y2: y2 + 1.5,
      stroke: dark ? "#0C0806" : "#20150E", "stroke-opacity": .45, "stroke-width": 1.5, "stroke-linecap": "round" }));
  }
  /* 눈 — 「이 선이 눈썹의 어디냐」를 얼굴로 읽히게 하는 최소한의 기준 */
  const ex = b.x + b.w * .46, ey = 254, ew = 52, eh = 11;
  f.appendChild(mk("path", { d: `M ${ex - ew} ${ey} Q ${ex} ${ey - eh} ${ex + ew} ${ey} Q ${ex} ${ey + eh} ${ex - ew} ${ey} Z`,
    fill: dark ? "#E4D8CD" : "#FAF4ED", "fill-opacity": .9 }));
  f.appendChild(mk("circle", { cx: ex + 4, cy: ey, r: 7.5, fill: "#4A3527" }));
  f.appendChild(mk("circle", { cx: ex + 4, cy: ey, r: 3.2, fill: "#120C08" }));
  f.appendChild(mk("path", { d: `M ${ex - ew} ${ey} Q ${ex} ${ey - eh - 1.5} ${ex + ew} ${ey}`,
    fill: "none", stroke: ink, "stroke-opacity": .7, "stroke-width": 2.4, "stroke-linecap": "round" }));
  f.appendChild(mk("path", { d: `M ${ex - ew * .8} ${ey - 22} Q ${ex} ${ey - 30} ${ex + ew * .9} ${ey - 20}`,
    fill: "none", stroke: ink, "stroke-opacity": .18, "stroke-width": 2 }));   /* 쌍꺼풀 결 */
}

/* 미리보기 — 왼쪽 밝은 피부 / 오른쪽 어두운 피부. 두 칸 모두 **같은 눈썹** 위에
   지금 설정한 선을 실제 자리·실제 규칙(테두리·굵기·길이·투명도)으로 올린다. */
function lookPreview() {
  const svgP = $("lookPrev"); if (!svgP) return;
  const L = S.look, f = document.createDocumentFragment();
  const grabTab = S.lookTab === "grab";
  const put = (x1, y1, x2, y2, hex, w, forceGrab) => {
    if (forceGrab === "done") {                       /* v1.95.0 — 놓은 선 미리보기 (drawDone 과 같은 규칙) */
      f.appendChild(mk("line", { x1, y1, x2, y2, stroke: L.doneC || "#FFFFFF",
        "stroke-width": w * (L.doneW != null ? L.doneW : 1),
        "stroke-opacity": L.doneOp != null ? L.doneOp : 1, "stroke-linecap": "round" }));
      return;
    }
    if (forceGrab) {                                  /* 잡은 선 탭 — drawGrab 과 같은 규칙 */
      const gw = w * (L.dragW || 1), op = L.dragOp != null ? L.dragOp : 1, e = L.dragEdge || "none";
      if (e !== "none") f.appendChild(mk("line", { x1, y1, x2, y2, stroke: e, "stroke-width": gw + 4,
        "stroke-opacity": .95 * op, "stroke-linecap": "round" }));
      f.appendChild(mk("line", { x1, y1, x2, y2, stroke: L.dragCore || "#14161B", "stroke-width": gw,
        "stroke-opacity": op, "stroke-linecap": "round" }));
      return;
    }
    if (hasEdge()) f.appendChild(mk("line", { x1, y1, x2, y2, stroke: edgeColorFor(hex),
      "stroke-width": w * (1 + 2 * L.edge / 100), "stroke-opacity": L.alpha * .9, "stroke-linecap": "round" }));
    f.appendChild(mk("line", { x1, y1, x2, y2, stroke: hex, "stroke-width": w,
      "stroke-opacity": L.alpha, "stroke-linecap": "round", class: "pv-ruler" }));
  };
  [0, 1].forEach((side) => {
    const x0 = side * PV_W, dark = side === 1;
    pvBrowArt(f, x0, dark);
    const b = pvBox(x0);
    const vx = (k) => b.x + PV_X[k] * b.w;
    const hy = (k) => b.y + PV_Y[k] * b.h;
    const half = clamp(L.hlen, HLEN_MIN, HLEN_MAX) * (vx("v2") - vx("v4"));
    const wOf = (k) => (specOf(k).w + 1.8) * L.weight * 1.45;
    /* 세로선 — 이너는 눈까지 길게, 아치선·아우터는 눈썹 구간만 (앱과 같은 규칙) */
    [["v2", 268], ["v6", 214], ["v4", 214]].forEach(([k, y1]) => {
      const x = vx(k), c = groupColor(k) || specOf(k).color;
      f.appendChild(mk("line", { x1: x, y1: 42, x2: x, y2: y1, stroke: c,
        "stroke-width": 1, "stroke-opacity": .18 }));       /* 이름표까지 잇는 옅은 선 */
      put(x, 46, x, y1, c, wOf(k), grabTab && k === "v6");
    });
    /* 가로 자 — 자는 세로선에서 **눈썹 쪽으로만** 뻗는다 (BASELINE 1-38) */
    const seg = {
      front: [vx("v2") - 2 * half, vx("v2")],
      frontThickness: [vx("v2") - 2 * half, vx("v2")],
      h2: [vx("v6") - half, vx("v6") + half],
      archThickness: [vx("v6") - half, vx("v6") + half],
      h3: [vx("v4"), vx("v4") + half],                      /* 꼬리 자는 길이 반 (halfK 0.5) */
    };
    Object.keys(seg).forEach((k) => {
      const y = hy(k), c = groupColor(k) || specOf(k).color;
      /* 잡은 선 탭 — 아치는 잡은 모습, 아치두께는 **놓은 선** 모습 (v1.95.0: 한 화면에서 둘 다 확인) */
      put(seg[k][0], y, seg[k][1], y, c, wOf(k),
          grabTab && k === "h2" ? true : grabTab && k === "archThickness" ? "done" : false);
    });
    /* 이름표 — 자 바로 옆에 그 선의 색으로. 「이름 ↔ 색 ↔ 자리」가 한눈에 붙는다 */
    const lab = (k, x, anchor) => pvText(f, x, hy(k) + 4, labelOf(k), groupColor(k) || specOf(k).color, anchor);
    lab("h2", seg.h2[1] + 7);
    lab("archThickness", seg.archThickness[1] + 7);
    lab("h3", seg.h3[1] + 7);
    lab("frontThickness", seg.frontThickness[1] + 7);
    lab("front", seg.front[1] + 7);
    /* 세로선 이름표는 **위쪽 한 줄** — 앱에서도 세로선 라벨은 캔버스 맨 위입니다 (BASELINE 1-7) */
    /* 세 이름이 붙지 않게 자리를 나눈다 — 아우터는 칸 왼쪽 끝, 아치선은 자기 선 오른쪽, 이너는 왼쪽 */
    [["v4", "start", x0 + 5], ["v6", "start", vx("v6") + 7], ["v2", "end", vx("v2") - 6]]
      .forEach(([k, an, lx]) => pvText(f, lx, 38, labelOf(k), groupColor(k) || specOf(k).color, an, 12));
    pvText(f, x0 + 10, 17, dark ? (LANG === "ko" ? "어두운 피부" : "Dark skin")
                               : (LANG === "ko" ? "밝은 피부" : "Light skin"), "#FFFFFF", "start", 11);
  });
  svgP.setAttribute("viewBox", `0 0 ${PV_W * 2} ${PV_H}`);
  svgP.replaceChildren(f);
}
$("btnLook").onclick = () => { S.lookSnap = { ...S.look }; lookTab("base"); buildLookUI(); $("mLook").classList.add("on"); };

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
/* 「모두 이 색」 — 가로 세 묶음을 이너 색으로. 그 색이 **세로선 목록에도 있으면** 세로선까지
   함께 맞춥니다 (원장님 지시 2026-08-27 세로선 목록 옆의 「모두 이색 적용」).
   목록 밖 색(라임·핑크 등)일 때 세로선은 그대로 둡니다 — 세로선은 세 색만 쓰기로 정했습니다. */
$("lookAll").onclick = () => {
  const c = S.look.inner;
  const v = V_PALETTE.some((p) => p.hex === c) ? { vInner: c, vArch: c, vTail: c } : {};
  lookSet({ arch: c, tail: c, ...v });
};
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
/* v1.81.0 — 선 굵기 · 테두리 굵기 슬라이더 (원장님 지시 2026-08-27).
   끄는 동안 미리보기와 실제 화면이 함께 변합니다 — 가로 길이와 같은 규칙입니다. */
$("rngW").addEventListener("input", (e) => {
  S.look.weight = clamp(+e.target.value / 100, 0.6, 1.8);
  $("wVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngW").addEventListener("change", () => { saveLook(); buildLookUI(); });
$("rngEdge").addEventListener("input", (e) => {
  S.look.edge = clamp(+e.target.value, 0, 120);
  $("edgeVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngEdge").addEventListener("change", () => { saveLook(); buildLookUI(); });
$("rngAlpha").addEventListener("input", (e) => {
  S.look.alpha = +e.target.value / 100;
  $("alphaVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngAlpha").addEventListener("change", () => { saveLook(); buildLookUI(); });
/* v1.82.0 — 잡은 선 굵기 슬라이더. 끄는 동안 미리보기(잡은 선 탭)와 화면이 같이 변합니다 */
$("rngDragW").addEventListener("input", (e) => {
  S.look.dragW = clamp(+e.target.value / 100, 0.6, 1.8);
  $("dragWVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngDragW").addEventListener("change", () => { saveLook(); buildLookUI(); });
$("rngDragOp").addEventListener("input", (e) => {
  S.look.dragOp = +e.target.value / 100;
  $("dragOpVal").textContent = e.target.value + "%";
  lookPreview(); render();
});
$("rngDragOp").addEventListener("change", () => { saveLook(); buildLookUI(); });
/* ⭐ v1.95.0 — 놓은 선 굵기·투명도 + 서브 라인 굵기·투명도 (원장님 지시 2026-08-29) */
if ($("rngDoneW")) {
  $("rngDoneW").addEventListener("input", (e) => {
    S.look.doneW = clamp(+e.target.value / 100, 0.3, 1.8);
    $("doneWVal").textContent = e.target.value + "%";
    lookPreview(); render();
  });
  $("rngDoneW").addEventListener("change", () => { saveLook(); buildLookUI(); });
  $("rngDoneOp").addEventListener("input", (e) => {
    S.look.doneOp = +e.target.value / 100;
    $("doneOpVal").textContent = e.target.value + "%";
    lookPreview(); render();
  });
  $("rngDoneOp").addEventListener("change", () => { saveLook(); buildLookUI(); });
}
if ($("rngSubW")) {
  $("rngSubW").addEventListener("input", (e) => {
    S.look.subW = clamp(+e.target.value / 100, 0.4, 3);
    $("subWVal").textContent = e.target.value + "%";
    lookPreview(); render();
  });
  $("rngSubW").addEventListener("change", () => { saveLook(); buildLookUI(); });
  $("rngSubOp").addEventListener("input", (e) => {
    S.look.subOp = +e.target.value / 100;
    $("subOpVal").textContent = e.target.value + "%";
    lookPreview(); render();
  });
  $("rngSubOp").addEventListener("change", () => { saveLook(); buildLookUI(); });
}
/* 탭 — 기본 선 / 잡은 선 (v1.59.0) */
/* ═══ 가이드 순서 편집 (v1.81.0 · 원장님 지시 2026-08-27) ═══════════════════
   「가이드 - 순서 변경가능 기능 추가」
   · ▲▼ 로 순서를 바꾸고, 이름을 눌러 그 단계를 **켜고 끈다** (이너처럼 안 쓰는 단계를 뺄 수 있게)
   · 켜진 단계가 위, 꺼진 단계는 아래에 흐리게 — 목록에서 사라지면 다시 켤 방법이 없습니다
   · 순서를 바꾸면 프롬프트 번호(①②③…)도 같이 따라갑니다 (updateGuideTip) */
function buildOrderUI() {
  const box = $("orderList"); if (!box) return;
  const off = FLOW_ALL.filter((k) => !GUIDE_FLOW.includes(k));
  const rows = [...GUIDE_FLOW.map((k) => [k, true]), ...off.map((k) => [k, false])];
  const apply = () => {
    saveFlow();
    /* 지금 차례가 목록에서 빠졌으면 처음으로 되돌린다 — 없는 단계에 머물면 플로우가 멈춥니다 */
    if (S.guideOn && (!S.guideCur || !GUIDE_FLOW.includes(S.guideCur))) S.guideCur = GUIDE_FLOW[0] || null;
    buildOrderUI(); render(); updateButtons();
  };
  box.replaceChildren(...rows.map(([k, on], i) => {
    const r = document.createElement("div");
    r.className = "orow" + (on ? "" : " off");
    r.dataset.key = k;
    const n = document.createElement("i");
    n.textContent = on ? (STEP_NUM[i] || i + 1) : "·";
    r.appendChild(n);
    const nm = document.createElement("button");
    nm.type = "button"; nm.className = "onm"; nm.textContent = labelOf(k);
    nm.style.setProperty("--dot", groupColor(k) || specOf(k).dot || specOf(k).color);
    nm.onclick = () => {
      const at = GUIDE_FLOW.indexOf(k);
      if (at >= 0) { if (GUIDE_FLOW.length > 1) GUIDE_FLOW.splice(at, 1); }   /* 마지막 하나는 못 끈다 */
      else GUIDE_FLOW.push(k);
      apply();
    };
    r.appendChild(nm);
    [["▲", -1], ["▼", 1]].forEach(([g, d]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "omv"; b.textContent = g;
      const at = GUIDE_FLOW.indexOf(k), to = at + d;
      b.disabled = !on || to < 0 || to >= GUIDE_FLOW.length;
      b.onclick = () => { const v = GUIDE_FLOW[at]; GUIDE_FLOW[at] = GUIDE_FLOW[to]; GUIDE_FLOW[to] = v; apply(); };
      r.appendChild(b);
    });
    return r;
  }));
}

function lookTab(which) {
  S.lookTab = which;
  $("tabBase").classList.toggle("on", which === "base");
  $("tabGrab").classList.toggle("on", which === "grab");
  $("tabOrder").classList.toggle("on", which === "order");
  $("lookTabBase").hidden = which !== "base";
  $("lookTabGrab").hidden = which !== "grab";
  $("lookTabOrder").hidden = which !== "order";
  if (which === "order") buildOrderUI();
  /* v1.81.0 — 미리보기가 지금 탭을 따라간다: 「잡은 선」 탭에서는 아치 자·아치선이
     잡은 선 색으로 그려져, 눈썹 위에서 실제로 어떻게 보일지 그대로 확인됩니다. */
  lookPreview();
}
$("tabBase").onclick = () => lookTab("base");
$("tabGrab").onclick = () => lookTab("grab");
$("tabOrder").onclick = () => lookTab("order");
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
  if ($("orderList")) buildOrderUI();
  updateButtons();
  updatePanels();
  if (typeof cycleLabel === "function") cycleLabel();   /* 순환 버튼 라벨 = 지금 조합 이름 (v1.58.0) */
}
function setLang(l) {
  LANG = l;
  localStorage.setItem("pb_lang", l);
  applyI18n();
  fitDocks();   /* v1.93.0 — 언어가 바뀌면 글자 폭이 바뀐다: 도크를 다시 맞춘다 */
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
    S.balOn = false; S.balance = null; S.balCurve = null; S.balAnim = null;
    S.hiddenSnapshot = null;
    S.sel = "h1"; S.selUD = "h1"; S.selLR = "v1"; S.hMode = "line"; S.multi = false; S.selSet = [];
    S.pickMode = false;
    S.pick = [];
    S.doneSet = [];             /* v1.81.0 — 「체크한 선」 표시도 함께 처음으로 */
    if (S.landmarks) { if (keepPhoto) placeLines(S.landmarks); else autoAlign(S.landmarks); }
    /* ⭐ v3.8.5 — **초기화 = AI 눈썹정렬로 돌아가기** (원장님 지시 2026-09-01:
       「작업 이후 초기화 버튼으로 돌아가는건 ai자동정렬로 돌아가는걸 의미」).
       v1.91.0(2026-08-21)의 「초기화는 AI 결과가 마음에 안 들 때 도망칠 곳이니 AI를 다시
       돌리지 마라」 규칙을 뒤집는다 — 이제 랜드마크 배치 위에 **드로잉 자동맞춤까지** 다시
       읽는다. 사진 로드 때(runFaceAI)와 같은 순서: 랜드마크 배치 → 잉크 판독.
       aiAllowed() 로 게이트 — 나중에 프리미엄이 꺼지면 여기서도 자동으로 랜드마크
       기본정렬까지만 돌아간다(원장님 지시 2026-09-01 「프리미엄 모드가 꺼지면 기본
       상태로 돌아간다」). 판독 실패는 조용히 랜드마크 배치로 남는다(v3.3.0 안전판과 동일). */
    if (S.landmarks && aiAllowed()) autoFromDrawing();
  });
  startIntro();                 /* 초기화셋팅 ③ — 초기화 버튼 (원장님 지시 2026-08-28) */
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

/* ═══ 밝기 조절 (v3.7.0) ═════════════════════════════════════════
   고객이 사진을 더 잘 보기 위해 라이브 조절 — 태양 버튼으로 활성화 */
function applyExposureBrightness() {
  const v = S.exposureBrightnessValue;
  if (v === 0) {
    photo.style.filter = "";
    return;
  }
  /* 밝기: 명도 조절 */
  const brightness = 100 + v;
  photo.style.filter = `brightness(${brightness}%)`;
}

function toggleBrightnessMode() {
  /* ⭐ v3.8.4 — 닫아도 조절값 유지 (원장님 지시 2026-09-01): 태양 버튼은 조절 바를
     보이거나 숨길 뿐, 사진에 적용된 밝기는 리셋하지 않는다. 밝기를 실제로 0으로
     되돌리려면 슬라이더를 직접 가운데로 옮기거나(값 0) 새 사진/초기화로 리셋해야 한다.
     ⛔ 여기서 exposureBrightnessValue 를 다시 0으로 되돌리지 마세요 — 그게 바로 이 버그였습니다. */
  S.brightnessOn = !S.brightnessOn;
  updateExposureBrightnessButtons();
  showHud(S.brightnessOn ? t("editor_brightness") : t("multi_off"), 2600);
}

function updateExposureBrightnessButtons() {
  const btn = $("btnBrightness");
  const ctrl = $("brightnessCtrl");
  btn.classList.toggle("on", S.brightnessOn);
  ctrl.hidden = !S.brightnessOn;
  if (S.brightnessOn) {
    ctrl.classList.add("active");
  } else {
    ctrl.classList.remove("active");
  }
}

$("btnBrightness").onclick = toggleBrightnessMode;

$("exposureBrightnessSlider").addEventListener("input", (e) => {
  S.exposureBrightnessValue = parseInt(e.target.value, 10);
  applyExposureBrightness();
});

$("exposureBrightnessSlider").addEventListener("change", () => {
  /* 필요시 여기에 저장 로직 추가 */
});

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
const BAL_RED = "#FF3B4E";  // 미러링 점선 색 (v3.26.0 부터 **전체 점선**이 이 빨강)
/* ⭐ v3.26.0 — 원장님 지시 2026-09-02 (실기기 확인 후): 「미러링 전체 선 색상은 빨간색으로 변경 · 블링킹 효과 빼 ·
   틀린 부분 표기 5포인트만 민트로 표기하여 틀린 부분만 눈에 띄도록」.
   → 점선(기준쪽 실측 + 반대쪽 미러링)은 구간 판정(devFront/devArch/devTail)과 무관하게 **전부 BAL_RED**.
   → 틀린 곳 표시는 **5포인트 자 토막**(runBalance 가 재는 앞머리·앞두께·아치엣지·아치두께·꼬리 가로 자의 기준
     반대쪽 토막)만 **민트 BAL_BAD, 정지**(깜빡임 없음). v3.25.0 의 민트 점선+깜빡임은 폐기.
   판정 로직(runBalance·runBalanceCurve)은 그대로 — devFront 등은 내부 값으로만 남는다. */
const BAL_BAD = "#3DFFC9";
const BAL_BAND = 0.045;    // ⚠️ v3.10.0 이후 balBandPx() 의 안전 폴백값으로만 쓰인다 (아래 참고)
const BAL_SAMPLES = 21;    // 한 토막에서 뽑는 x 표본 수
const BAL_CONTRAST = 14;   // 이만큼도 안 어두우면 "선을 못 찾음"으로 본다

/* ⭐⭐ v3.10.0 — 반대쪽을 **찾는** 탐색 범위도 tol 처럼 얼굴 크기(확대율)를 따라간다
   (원장님 지시 2026-09-01: 「아치 두께부분도 맞지 않는데 빨간 표시가 나오지 않는 이유?」).
   원인 규명: 이 탐색 범위가 그동안 캔버스 높이의 **고정 4.5%** 였다. 허용 오차(tol,
   BAL_TOL_MM)는 이미 8/20에 확대율 방어(mm 기준)를 받았는데, 반대쪽 실제 잉크 라인을
   "찾는" 이 범위는 그 개선을 못 받고 고정 픽셀 그대로 남아 있었다.
   확대해서 볼수록(시술 중 늘 그러시듯) 4.5%가 실제 눈썹 기준으로는 점점 좁아져서,
   좌우 차이가 클수록(=진짜 다른 경우일수록) 반대쪽 라인이 그 좁은 창 밖으로 빠져나가
   못 찾고 skipped 로 조용히 빠졌다 — 차이가 클수록 더 못 잡는 역설이었다.
   그래서 balTolPx() 와 같은 이너 간격(mm) 기준으로 맞춘다.
   ⚠️ BAL_BAND_MM 은 첫 추정값입니다 — 실제 사진에서 너무 넓다/좁다 판단되시면
   확인 후 조정하세요. ⛔ 다시 캔버스 고정 비율로 되돌리지 마세요 — 회귀 89 가 잡습니다. */
const BAL_BAND_MM = 4.0;                    // 반대쪽 탐색 반경(mm)
const BAL_BAND_MIN = 8, BAL_BAND_MAX = 40;  // px 안전선

/* 지금 화면에서 반대쪽을 찾는 탐색 반경 몇 px 인가 (balTolPx() 와 짝) */
function balBandPx() {
  const W = S.dim.W, g = S.g;
  const innerPx = Math.abs(g.v3 - g.v2) * W;
  if (!W || !innerPx) return BAL_BAND * (S.dim.H || 0);   // 이너를 모르면 옛 고정값으로 폴백
  return clamp((BAL_BAND_MM * innerPx) / INNER_MM, BAL_BAND_MIN, BAL_BAND_MAX);
}

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

/* ⭐⭐⭐ v3.13.0 — **밸런스 커브 — 좌우를 각각 독립으로 읽어 비교한다** (Phase 3, 원장님 지시
   2026-09-01 「곡선 기반 AI 어시스턴트」로 밸런스 재구축).
   ─────────────────────────────────────────────────────────────────────────
   기존 `runBalance()`의 한계 — 실기기에서 확인됨(2026-09-01):
   「왼쪽에서도 드로잉과 거리가 멀어져도(가이드가 틀려도) 오른쪽 판정이 필요하다」
   원인: `measureSegY`가 찾는 탐색창(x·y 모두)이 **지금 가이드 값**에서 나옵니다
   (`segPx`→`g[anchor]`, y0=`g[key]*H`) — 오른쪽 탐색창조차 왼쪽 가이드를 거울에 비춘
   자리입니다. 왼쪽 가이드가 틀리면 오른쪽 탐색까지 함께 틀어집니다.

   이 함수는 **가이드 값을 전혀 보지 않고** 좌우를 각각 landmark(`browBoxes`)+픽셀
   (`readDrawing`)로 독립적으로 읽습니다 — Phase 1(browBoxes)이 원래 설계된 이유가
   이것입니다. 앞머리·아치·꼬리 세 지점에서 좌우를 직접 비교하므로, 어느 쪽 가이드가
   얼마나 틀렸든 무관하게 실제 드로잉끼리 비교합니다.

   ⛔ 기존 `runBalance()`/`segPx()`/`measureSegY()`는 **그대로 둡니다** — 회귀 77~86·180이
   그 정확한 동작(가이드 기준 토막 비교)에 물려 있습니다. 이 함수는 완전히 별도의 새
   판정을 **추가**하는 것이지 교체가 아닙니다 — 화면에는 기존 토막 빨강 표시 + 이 커브
   표시가 함께 나옵니다. */
const CURVE_FRONT_END = 0.18;      // autoFromDrawing의 앞부분 구간(0~18%)과 같은 잣대
const CURVE_ARCHPK_NUM_MAX = 40;   // autoFromDrawing의 ARCHPK_NUM_MAX(내안각)와 같은 값
const CURVE_TAIL_END = 0.08;       // autoFromDrawing의 END(끝점 구간)와 같은 잣대

/* seq 구간의 분위수 — autoFromDrawing 안의 `at()` 닫힘과 같은 계산 (순수 함수로 분리) */
function curveQuantile(seq, a, b, key, frac) {
  const n = seq.length;
  const i0 = clamp(Math.floor(a * (n - 1)), 0, n - 1);
  const i1 = clamp(Math.ceil(b * (n - 1)), 0, n - 1);
  const v = seq.slice(Math.min(i0, i1), Math.max(i0, i1) + 1).map((p) => p[key]).sort((x, y) => x - y);
  if (!v.length) return null;
  const q = frac !== undefined ? frac : 0.5;
  return v[clamp(Math.round(q * (v.length - 1)), 0, v.length - 1)];
}
/* 산꼭대기(pk) 열 찾기 — autoFromDrawing 안의 산꼭대기 탐색 블록과 같은 계산 */
function curvePeak(seq, cx) {
  const n = seq.length;
  const smoothTop = (i) => {
    const a = seq[Math.max(0, i - 1)].top, b2 = seq[i].top, c2 = seq[Math.min(n - 1, i + 1)].top;
    return (a + b2 + c2) / 3;
  };
  let lo = Math.max(1, Math.round(n * 0.15));
  const hi = Math.min(n - 2, Math.round(n * 0.85));
  const tk = frontTickPx();
  if (tk) {
    const numAt = (i) => 53.15 - Math.abs(seq[i].x - cx) / tk;
    while (lo < hi && numAt(lo) > CURVE_ARCHPK_NUM_MAX) lo++;
  }
  let pk = lo;
  for (let i = lo; i <= hi; i++) if (smoothTop(i) < smoothTop(pk)) pk = i;
  return pk;
}

/* 한쪽 눈썹을 **가이드와 무관하게** landmark+픽셀로 읽어, 위·아래 경계 곡선(3점: 앞머리·아치·꼬리)
   을 돌려준다. `readDrawing`(browBoxes/fallbackBox 기반, side 매개변수 있음)을 그대로 재사용하고,
   그 seq 위에서 autoFromDrawing과 같은 잣대(앞부분 분위수 · 산꼭대기 · 꼬리 수렴)로 3점을 뽑는다.
   실패하면 조용히 null — 부르는 쪽이 "못 읽음"으로 건너뛴다. */
function readSideCurve(img, side) {
  try {
    const { W } = S.dim;
    let pts = null;
    for (const contrast of [DRAW_CONTRAST, DRAW_CONTRAST_SOFT]) {
      const cand = readDrawing(img, contrast, side);
      if (!cand || cand.length < DRAW_MIN_HITS) continue;
      if (cand.refH) {
        const th = cand.map((p) => p.bot - p.top).sort((a, b) => a - b)[Math.floor(cand.length / 2)];
        if (th > DRAW_THICK_MAX * cand.refH || th < DRAW_THICK_MIN * cand.refH) continue;
      }
      pts = cand; break;
    }
    if (!pts) return null;
    const cx = S.g.v1 * W;
    const seq = seqOrient(pts, cx);
    const n = seq.length;
    if (n < 4) return null;

    const frontX = pts.innerX !== undefined && pts.innerX !== null ? pts.innerX : seq[0].x;
    const frontThicknessY = curveQuantile(seq, 0, CURVE_FRONT_END, "top", 0.3);
    const frontY = curveQuantile(seq, 0, CURVE_FRONT_END, "bot", 0.7);

    const pk = curvePeak(seq, cx);
    const win = Math.max(1, Math.round(n * 0.08));
    const pa = clamp(pk - win, 0, n - 1) / (n - 1), pb = clamp(pk + win, 0, n - 1) / (n - 1);
    const archX = seq[pk].x;
    const h2Y = curveQuantile(seq, pa, pb, "top");
    const archThicknessY = curveQuantile(seq, pa, pb, "bot");

    const seqT = pts.tailAdd && pts.tailAdd.length ? seq.concat(pts.tailAdd) : seq;
    const nT = seqT.length;
    let tailIdx = nT - 1;
    const darks = seqT.map((p) => p.dark || 0).slice().sort((a, b) => a - b);
    const medDark = darks[Math.floor(darks.length / 2)] || 0;
    const cores = seqT.map((p) => p.core || 0).slice().sort((a, b) => a - b);
    const medCore = cores[Math.floor(cores.length / 2)] || 0;
    const coreMin = medCore > 0 ? Math.max(DRAW_CONTRAST, TAIL_INK * medCore) : null;
    if (medDark > 0) {
      for (let i = nT - 1; i >= Math.floor(nT * 0.45); i--) {
        const p = seqT[i];
        if ((p.dark || 0) >= TAIL_INK * medDark || (coreMin !== null && (p.core || 0) >= coreMin)) { tailIdx = i; break; }
      }
    }
    const tc = tailConverge(seqT, tailIdx);
    let tailX, tailY;
    if (tc) { tailX = tc.x; tailY = tc.y; }
    else {
      const t0 = Math.max(0, tailIdx - Math.round(CURVE_TAIL_END * (nT - 1)));
      const bots = seqT.slice(t0, tailIdx + 1).map((p) => p.bot).sort((x, y) => x - y);
      tailX = seqT[tailIdx].x;
      tailY = bots.length ? bots[clamp(Math.round(0.7 * (bots.length - 1)), 0, bots.length - 1)] : seqT[tailIdx].bot;
    }

    if ([frontThicknessY, frontY, h2Y, archThicknessY, tailY].some((v) => v === null || v === undefined || !isFinite(v))) return null;

    /* ⭐ v3.14.0 — 열별 원본 궤적(raw seq, showArchDots의 점선과 같은 자료)도 함께 돌려준다.
       `renderBalCurve`가 이 점들을 거울에 비춰 반대쪽에 그대로 얹는 용도 (원장님 지시
       2026-09-01 「점선이 반대쪽에 미러링되어 보여지는것으로」). zone: 0=앞머리~아치 구간,
       1=아치~꼬리 구간 — pk(산꼭대기) 열을 기준으로 나눈다. 꼬리 보정 구간(tailAdd)은 항상
       꼬리 쪽(zone 1)이다. 판정 로직에는 전혀 관여하지 않는 표시 전용 자료다. */
    const trace = seq.map((p, i) => ({ x: p.x, top: p.top, bot: p.bot, zone: i <= pk ? 0 : 1 }));
    if (pts.tailAdd && pts.tailAdd.length) {
      for (const p of pts.tailAdd) trace.push({ x: p.x, top: p.top, bot: p.bot, zone: 1 });
    }

    return {
      side,
      top: [{ x: frontX, y: frontThicknessY }, { x: archX, y: h2Y }, { x: tailX, y: tailY }],
      bot: [{ x: frontX, y: frontY }, { x: archX, y: archThicknessY }, { x: tailX, y: tailY }],
      trace,
    };
  } catch (e) { return null; }
}

/* 좌우 곡선을 각각 읽어 비교 — 앞머리·아치·꼬리 세 지점에서 위·아래 경계 둘 다 본다.
   허용 오차는 기존과 같은 `balTolPx()`(얼굴 크기 기준)를 그대로 씁니다. */
function runBalanceCurve() {
  try {
    const img = photoPixels();
    if (!img) { S.balCurve = null; return false; }
    const L = readSideCurve(img, "L"), R = readSideCurve(img, "R");
    if (!L || !R) { S.balCurve = null; return false; }
    const tol = balTolPx();
    const off = (a, b) => Math.abs(a - b) > tol;
    const devFront = off(L.top[0].y, R.top[0].y) || off(L.bot[0].y, R.bot[0].y);
    const devArch = off(L.top[1].y, R.top[1].y) || off(L.bot[1].y, R.bot[1].y);
    const devTail = off(L.top[2].y, R.top[2].y) || off(L.bot[2].y, R.bot[2].y);
    S.balCurve = { L, R, devFront, devArch, devTail, tol };
    return true;
  } catch (e) { S.balCurve = null; return false; }
}

/* ⭐⭐ v3.14.0 — 밸런스 커브 그리기 **재설계** (원장님 지시 2026-09-01, 실기기 스크린샷 확인 후):
   「오른쪽 선이 쫙 그어지는것보다 왼쪽처럼 자연스럽게 드로잉을 따라가는 느낌이 더 좋아보이네
    흰색 빨간색 선 숨기고, 화면에서 위쪽에있는 점선들이 반대쪽에 미러링되어 보여지는것으로,
    위치가 다른것은 빨간선 그대로 보여지기 / 왼쪽 점선들이 미러링되어 반대쪽에도 똑같이
    입혀지기 / 그러면 사용자가 자연스럽게 본인의 드로잉과 미러링이 다르다는것을 시각적으로
    보게됨」
   ─────────────────────────────────────────────────────────────────────────
   v3.13.0의 굵은 직선(민트/파랑 2토막)과 흰 점선 "정답 위치" 가이드는 **없앤다** — 대신
   기준쪽(refC)의 열별 원본 점선 궤적(trace, showArchDots가 찍는 것과 같은 자료)을 x만
   거울(cx 기준)에 비춰 **반대쪽 사진 위에 점으로 그대로 얹는다.** y(높이)는 그대로다 —
   좌우가 실제로 균형 잡혀 있으면 이 미러링 점들이 반대쪽 실제 드로잉과 자연스럽게 겹쳐
   보이고, 어긋난 구간(앞머리·아치·꼬리 판정)만 빨갛게 되어 원장님이 "내 드로잉과 미러링이
   다르다"를 점을 눈으로 훑으며 자연스럽게 보게 된다. */
/* v3.15.0 — 한 단계(기준쪽 실제 점 · 반대쪽 미러링 점) 애니메이션 길이(ms).
   원장님 지시 2026-09-02: 「왼쪽 점들이 먼저 앞머리부터 순차적으로 점이 꼬리까지 찍힌다 ·
   그리고 오른쪽 미러링도 앞머리부터 꼬리까지 순차적으로 생긴다」 — 두 단계라 전체는 이 값의 2배. */
const BAL_ANIM_MS = 650;

/* ⭐ v3.23.0 — **튄 구간은 무시하고 양옆(파란점↔파란점)을 이어 채운다** (원장님 지시 2026-09-02,
   v3.15.0 표시 결과 위에 노란 원(아래선이 몇 열 동안 눈썹 안쪽으로 튄 곳)과 초록 점선(양옆을 이어 채울
   자리)을 그려 주심: 「노란색 부위는 좀 무시하고 아래 양옆을 유추하여 이음선 제작 안되니?」).
   v3.15.0 의 "읽은 점 그대로"는 유지한다. 다만 열마다 읽은 y 가 **이웃들의 흐름**(창 11 중앙값)에서
   국소 두께의 25%(최소 3px) 넘게 벗어나면 그 열은 튄 것으로 보고 버리고, 양옆의 정상 열 두 개를 직선으로
   이어 그 자리를 채운다. 위선·아래선 각각 따로. 전체를 다시 그리거나 매끈하게 만드는 규칙은 없다 —
   v3.16~3.20 처럼 사진 전체를 추정 규칙으로 덮는 것이 아니라, 이웃과 동떨어진 열만 이웃으로 채운다. */
const BR_FRAC = 0.2, BR_MIN = 3, BR_SHARP = 3, BR_MAX_RUN = 0.45, BR_PASSES = 2;
/* 튐 = **급격한 단차**: 이웃 열과의 y 차이가 그 자리 두께의 20%(최소 3px)를 넘고, 직전 5열의 평소
   열간 변화량의 3배도 넘을 때(부드러운 곡선은 열마다 조금씩 변하므로 걸리지 않는다 — 꼬리·아치 보호).
   단차가 나면 그 직전 열(a, 원장님의 첫 "파란점")의 기울기(직전 5열 중앙값)로 선을 뻗어, 점이 그 선
   근처(두께의 20% 안)로 **돌아오는 첫 열**(둘째 "파란점")을 찾아 a~그 열을 직선으로 잇는다. 궤적 길이의
   45% 안에서 못 돌아오면(진짜 곡선일 수 있으므로) 아무것도 바꾸지 않는다. 위선·아래선 각각. */
function balBridgeOutliers(trace) {
  let cur = trace;
  for (let pass = 0; pass < BR_PASSES; pass++) cur = balBridgeOnce(cur);
  return cur;
}
function balBridgeOnce(trace) {
  const n = trace.length;
  if (n < 6) return trace;
  const out = trace.map((p) => ({ ...p }));
  const xs = trace.map((p) => p.x);
  const thick = trace.map((p) => Math.abs((p.bot ?? p.top) - p.top));
  const med = (arr) => { const s = arr.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const maxRun = Math.max(3, Math.round(BR_MAX_RUN * n));
  for (const key of ["top", "bot"]) {
    const ys = trace.map((p) => p[key]);
    if (ys.some((v) => v === undefined || !isFinite(v))) continue;
    const lim = (i) => Math.max(BR_MIN, BR_FRAC * (thick[i] || 0));
    let i = 1;
    while (i < n) {
      const d = ys[i] - ys[i - 1];
      const prevDiffs = []; for (let k = Math.max(1, i - 5); k < i; k++) prevDiffs.push(Math.abs(ys[k] - ys[k - 1]));
      const usual = prevDiffs.length >= 2 ? med(prevDiffs) : 1;
      if (Math.abs(d) > lim(i) && Math.abs(d) > BR_SHARP * Math.max(usual, 0.5)) {
        const a = i - 1;
        const slopes = []; for (let k = Math.max(1, a - 4); k <= a; k++) { const dx = xs[k] - xs[k - 1]; if (Math.abs(dx) > 1e-6) slopes.push((ys[k] - ys[k - 1]) / dx); }
        const slope = slopes.length ? med(slopes) : 0;
        let found = -1;
        for (let k = i + 1; k < n && k - a <= maxRun; k++) {
          const pred = ys[a] + slope * (xs[k] - xs[a]);
          if (Math.abs(ys[k] - pred) <= lim(k)) { found = k; break; }
        }
        if (found > 0) {
          for (let q = a + 1; q < found; q++) { const t = (xs[q] - xs[a]) / ((xs[found] - xs[a]) || 1); out[q][key] = ys[a] + (ys[found] - ys[a]) * t; }
          i = found + 1; continue;
        }
      }
      i++;
    }
  }
  return out;
}
/* ⭐⭐ v3.24.0 — **미러링 점선 "무시 규칙" 목록** (원장님 지시 2026-09-02: 「이너라인의 앞부분은 눈썹
   드로잉이라고 볼수없는 자리로 무시해 / 이제 이런 무시해야 하는 자리를 케이스를 모아 점점 더 고도화하자 /
   무시하는 점에 대한 룰을 설립하라 — 이너라인 앞쪽(이미 AI가 이너라인을 잘 선택하고 있으므로) · 앞머리
   밑쪽도 무시에 넣어라」).
   원칙: **표시 전용**(판정·자 배치 무관) · 기준은 픽셀 추측이 아니라 **가이드 값(원장님이 옮긴 자리)** ·
   규칙은 아래 BAL_IGNORE_RULES 에 한 줄씩 추가한다(이름·이유·판정 함수). 무시된 점은 가운데면 양옆 정상
   점을 직선으로 이어 채우고, 궤적의 끝(앞/꼬리)이면 그 열을 버린다. 그 뒤 v3.23.0 의 파란점↔파란점 잇기가
   이어진다.
   ─ 규칙 목록 ─
   ① innerFront  이너 앞쪽: 이너 선(v2/v3)보다 센터 쪽으로 2px 넘게 들어간 열 — 미간·코 그늘이지 눈썹 드로잉이 아니다
   ② belowFront  앞머리 밑쪽: 앞머리 선(front)보다 2px 넘게 아래(눈 쪽)에 찍힌 점 — 눈꺼풀·그늘. (눈썹 디자인
                 원칙상 꼬리도 앞머리보다 낮지 않으므로 전 구간에 적용) */
const BAL_IGNORE_RULES = [
  { name: "innerFront", whole: true,
    hit: (p, ctx) => (p.x - ctx.innerX) * ctx.toCenter > 2 },
  { name: "belowFront", whole: false,
    hit: (p, ctx, key) => p[key] > ctx.frontY + 2 },
];
function balIgnoreZones(trace, side) {
  try {
    const g = S.g, { W, H } = S.dim;
    const innerX = (side === "L" ? g.v2 : g.v3) * W, cx = g.v1 * W;
    if (![innerX, cx, g.front].every((v) => isFinite(v))) return trace;
    const ctx = { innerX, toCenter: Math.sign(cx - innerX) || 1, frontY: g.front * H };
    // ① 열 통째로 버리는 규칙
    let t = trace.filter((p) => !BAL_IGNORE_RULES.some((r) => r.whole && r.hit(p, ctx)));
    if (t.length < 4) return trace;
    // ② 점 단위 규칙: 가운데는 양옆 보간, 끝은 열 제거
    const out = t.map((p) => ({ ...p }));
    const drop = new Array(out.length).fill(false);
    for (const key of ["top", "bot"]) {
      const ys = t.map((p) => p[key]);
      if (ys.some((v) => v === undefined || !isFinite(v))) continue;
      const bad = t.map((p) => BAL_IGNORE_RULES.some((r) => !r.whole && r.hit(p, ctx, key)));
      let i = 0;
      while (i < out.length) {
        if (!bad[i]) { i++; continue; }
        let j = i; while (j < out.length && bad[j]) j++;
        const a = i - 1, b = j;
        if (a >= 0 && b < out.length) {
          for (let q = i; q < j; q++) { const s = (t[q].x - t[a].x) / ((t[b].x - t[a].x) || 1); out[q][key] = ys[a] + (ys[b] - ys[a]) * s; }
        } else { for (let q = i; q < j; q++) drop[q] = true; }
        i = j;
      }
    }
    const kept = out.filter((_, i) => !drop[i]);
    return kept.length >= 4 ? kept : trace;
  } catch (e) { return trace; }
}

const BAL_BRIDGE_MODE = true;   // v3.23.0 — 표시용 trace 에 양옆 잇기 적용 (false 로 두면 v3.15.0 그대로)

function renderBalCurve(frag) {
  const bc = S.balCurve;
  if (!bc || !bc.L || !bc.R) return;
  const ref = S.refSide;
  const refC = bc[ref];
  if (!refC.trace || !refC.trace.length) return;
  const cx = S.g.v1 * S.dim.W;
  const devs = [bc.devFront, bc.devArch, bc.devTail];
  const badZone = (zone) => (zone === 0 ? devs[0] || devs[1] : devs[1] || devs[2]);
  const trace = BAL_BRIDGE_MODE ? balBridgeOutliers(balIgnoreZones(refC.trace, ref)) : refC.trace;   // v3.24.0: 무시 규칙 → 파란점↔파란점 잇기
  const n = trace.length;

  /* ⭐ v3.15.0 — 켜지는 순간엔 앞머리(index 0)→꼬리(index n-1) 순서로 두 단계 애니메이션.
     1단계: 기준쪽(refC, 실제 위치) 점이 순서대로 채워진다. 2단계: 그 다음 반대쪽 미러링
     점이 순서대로 채워진다. 애니메이션이 끝나면(S.balAnim=null) 둘 다 항상 전체가 보인다 —
     기준쪽 실제 점도 계속 남겨 둔다(원장님이 자기 드로잉과 미러링을 나란히 비교하도록).
     ⛔ 판정(devFront/devArch/devTail, runBalanceCurve)에는 전혀 관여하지 않는 순수 표시 연출. */
  let refCount = n, mirCount = n;
  if (S.balAnim) {
    const frac = clamp((performance.now() - S.balAnim.t0) / BAL_ANIM_MS, 0, 1);
    if (S.balAnim.phase === "ref") { refCount = Math.round(n * frac); mirCount = 0; }
    else { refCount = n; mirCount = Math.round(n * frac); }
  }

  /* ⭐ v3.26.0 — 점선은 **전부 빨강(BAL_RED)**, 구간 판정으로 색을 바꾸지 않는다 (원장님 지시 2026-09-02
     「미러링 전체 선 색상은 빨간색으로 · 블링킹 빼 · 틀린 부분은 5포인트만 민트」). 기준쪽 실측 점은 옅게,
     반대쪽 미러링 점은 진하게 — 어느 쪽이 거울상인지 구분만 남긴다. badZone 은 내부 값으로만 유지. */
  void badZone;
  for (let i = 0; i < refCount; i++) {
    const p = trace[i];
    frag.appendChild(mk("circle", { cx: p.x, cy: p.top, r: 1.5, fill: BAL_RED, "fill-opacity": 0.5 }));
    if (p.bot !== undefined) frag.appendChild(mk("circle", { cx: p.x, cy: p.bot, r: 1.2, fill: BAL_RED, "fill-opacity": 0.5 }));
  }
  for (let i = 0; i < mirCount; i++) {
    const p = trace[i];
    const mx = 2 * cx - p.x;              // 기준쪽 x를 거울에 비춰 반대쪽 자리로
    frag.appendChild(mk("circle", { cx: mx, cy: p.top, r: 2.0, fill: BAL_RED, "fill-opacity": 0.9 }));
    if (p.bot !== undefined) frag.appendChild(mk("circle", { cx: mx, cy: p.bot, r: 1.7, fill: BAL_RED, "fill-opacity": 0.9 }));
  }
}

/* ⭐ v3.15.0 — 미러링을 켤 때 앞머리→꼬리 순차 애니메이션으로 시작한다 (원장님 지시
   2026-09-02, 실기기 스크린샷 확인 후: 「미러링 클릭시 - 왼쪽 점들이 먼저 앞머리부터
   순차적으로 점이 꼬리까지 찍힌다(애니메이션 처럼) · 그리고 오른쪽 미러링도 앞머리부터
   꼬리까지 순차적으로 생긴다 · 이때 위 안내에 (밸런스체킹중)」).
   "위 안내"는 showNote()의 그 자리 — v3.14.0에서 「그린 선에 맞춰 배치했습니다」 안내를
   지운 바로 그 자리를 재활용한다. render() 를 매 프레임 다시 불러 renderBalCurve() 가
   S.balAnim 의 진행률만큼만 점을 그리게 한다 — 판정 로직은 전혀 건드리지 않는다. */
function startBalAnim() {
  S.balAnim = { phase: "ref", t0: performance.now() };
  showNote(t("bal_checking"), BAL_ANIM_MS * 2 + 400);
  const step = () => {
    if (!S.balAnim || !S.balOn) { render(); return; }
    const frac = (performance.now() - S.balAnim.t0) / BAL_ANIM_MS;
    if (frac >= 1) {
      if (S.balAnim.phase === "ref") { S.balAnim = { phase: "mirror", t0: performance.now() }; }
      else { S.balAnim = null; render(); return; }
    }
    render();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* 밸런스 검사 — 기준 쪽과 반대쪽의 드로잉 높이를 비교한다.
   모든 선을 **한 번에** 검사합니다 (하나씩 넘기면 전체 패턴이 안 보입니다). */
function runBalance() {
  const img = photoPixels();
  if (!img) { toast(t("bal_no_photo")); return false; }
  const { H } = S.dim, band = balBandPx();                       // ⭐ v3.10.0 — 얼굴 크기에 맞춘 탐색 범위
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
/* ⭐ v3.25.0 — 미러링을 켜고 끌 때 **가운데 HUD 안내를 띄우지 않는다** (원장님 지시 2026-09-02:
   「끝난 뒤의 작업이어서 미러링 시 안내 숨김, 방해만 될 뿐」). 「N곳이 기준과 다릅니다 / N곳은 선을
   못 읽어 건너뜀」·「미러링 해제」·기준 쪽 바꿈 HUD 가 눈썹 한가운데를 가렸다. 판정은 화면의
   민트 깜빡임 자체가 말해 준다. 위쪽 작은 「밸런스 체킹중」(v3.15.0 지시)만 남긴다. */
$("btnBalance").onclick = () => {
  if (S.balOn) { S.balOn = false; S.balance = null; S.balCurve = null; S.balAnim = null; render(); return; }
  if (!runBalance()) return;
  runBalanceCurve();   /* ⭐ v3.13.0 — Phase 3: 좌우 독립 커브 판정도 함께 (실패해도 조용히 null) */
  S.balOn = true;
  startBalAnim();      /* ⭐ v3.15.0 — 앞머리→꼬리 순차 애니메이션으로 켠다 (아래) */
};

/* 기준 쪽 — 밸런스의 후속 버튼. 고른 값은 다음에도 유지된다.
   v1.29.0: 토글 하나가 아니라 **왼쪽/오른쪽 두 버튼**. 지금 어느 쪽이 기준인지 눌러 보지 않아도 보인다. */
function setRefSide(side) {
  if (S.refSide === side) return;
  S.refSide = side;
  localStorage.setItem("pb_refside", side);
  if (S.balOn) runBalance();
  render();
  if (!S.balOn) showHud(side === "L" ? t("bal_ref_l") : t("bal_ref_r"), 1600);   /* v3.25.0 — 미러링 중엔 HUD 없음 */
}
/* 그린 선에 다시 맞추기 — 드로잉을 더 그리거나 지운 뒤 다시 올릴 때 (v1.30.0) */
$("btnSnap").onclick = () => {
  let ok = false;
  step(() => {
    /* ⭐ v3.9.1 — **AI 눈썹정렬 버튼도 초기화와 같은 로직으로 사진의 눈 위치부터 다시 잡는다**
       (원장님 지시 2026-09-01: 「Ai자동정렬을 눌렀을때 사진의 눈위치에 맞춰 자동정렬 선들도
       따라 움직일것 · 초기화 버튼의 로직과 동일함」).
       이전에는 autoFromDrawing() 만 불러서, 사진을 움직이거나 확대한 뒤 이 버튼을 눌러도
       센터·눈 같은 랜드마크 기반 선은 그 자리에 그대로 묶여 있었다(잉크 판독만 다시 함).
       btnReset 과 똑같이: 사진잠금 중이면 placeLines(위치는 그대로·선만 실측), 잠금 아니면
       autoAlign(사진 배치까지 눈 위치에 맞춰 다시 잡음) — 그 다음에 드로잉 판독. */
    if (S.landmarks) { if (S.locked) placeLines(S.landmarks); else autoAlign(S.landmarks); }
    ok = autoFromDrawing();
    /* ⭐ v1.86.0 — 맞춘 뒤에는 **가이드 순서에 있는 선이 하나도 숨어 있지 않게** 되돌립니다
       (원장님 지시 2026-08-28 「예전에 쓰던 이너 라인 되돌려놔」).
       드로잉 맞춤은 「이 사진에 다시 맞춘다」는 뜻이므로, 숨긴 채로 두면 맞춘 결과가 안 보입니다.
       ⛔ 「모든 라인 숨김」으로 일부러 숨긴 상태까지 되살리지는 않습니다 — 그건 원장님 선택입니다. */
    if (ok) for (const k of GUIDE_FLOW) { const sp = specOf(k); if (sp) S.g[sp.vis] = true; }
  });
  /* v1.69.0 — 맞춘 뒤에는 **가이드를 처음(① 이너)부터** 다시 돕니다.
     드로잉 맞춤이 놓는 것은 앞두께·아치 둘뿐이므로, 나머지를 손으로 놓는 순서가 곧 다음 할 일입니다. */
  if (ok && S.guideOn) { S.intro = false; clearTimeout(introTimer); S.guideCur = GUIDE_FLOW[0]; noteSel(GUIDE_FLOW[0]); }
  render(); updateButtons();
  /* ⭐ v3.15.0 — 성공 안내("그린 선에 맞춰 배치했습니다 …")는 **삭제** (원장님 지시
     2026-09-02: 「"그린 선에 맞춰 배치했습니다 …" 안내 삭제」). 이 자리(showNote, 위 안내)는
     이제 미러링 애니메이션 중 "밸런스 체킹중" 표시가 쓴다(startBalAnim() 참고). 실패 안내는
     v3.3.0에서 「조용히 넘기지 않는다」고 지시하신 안전판이라 그대로 둔다. */
  if (!ok) showNote(t("ai_redraw_fail"), 2600);
  if (ok) showArchDots();         /* v3.3.1 — 수동 눈썹정렬에도 점선 진단 표시(이제 5개 점만) */
};
/* 가이드 켜고 끄기 — 끄면 플로우 즉시 종료. 켠 직후엔 아무 선도 켜지 않는다:
   **처음 움직이는 선**이 플로우의 시작이다 (원장님 지시 2026-08-21) */
$("btnGuide").onclick = () => {
  S.guideOn = !S.guideOn;
  /* ⭐ v1.87.0 — 다시 켜면 **초기화셋팅 ④**: 블링킹 + 전체 색을 보여 준 뒤 첫 스텝
     (원장님 지시 2026-08-28. v1.44.0 의 「켜는 순간 이너부터」는 초기화셋팅 **뒤에** 이어집니다) */
  if (S.guideOn) startIntro();
  else { S.guideCur = null; S.intro = false; clearTimeout(introTimer); }
  updateButtons();
  render();
};
/* v1.90.0 — 안내 켜기/끄기 (가이드 플로우 자체는 그대로) */
$("btnTip").onclick = () => {
  S.tipOn = !S.tipOn;          /* v1.90.1 — 세션 동안만. 다음에 열면 다시 켜져 시작 */
  updateButtons(); updateGuideTip();
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
posSliderV.addEventListener("input", (e) => { endIntroEarly(); beginEdit(); noteSel(S.selUD);
  S.dragOn = true;                                                 /* v1.55.0 */
  if (S.guideOn && GUIDE_FLOW.includes(S.selUD)) S.guideCur = S.selUD;
  applyPos(parseFloat(e.target.value), S.selUD); });
posSliderV.addEventListener("change", () => { const moved = S.dragOn; S.dragOn = false;
  if (moved) markDone(S.selUD); guideAdvance(S.selUD); });
$("posMinusV").onclick = () => step(() => { endIntroEarly(); noteSel(S.selUD); markDone(S.selUD); applyPos(parseFloat(posSliderV.value) - posConfig(S.selUD).step, S.selUD); });
$("posPlusV").onclick  = () => step(() => { endIntroEarly(); noteSel(S.selUD); markDone(S.selUD); applyPos(parseFloat(posSliderV.value) + posConfig(S.selUD).step, S.selUD); });

/* 가로 조절자 — 세로선 좌우 이동 + 사진 보정 겸용 (v1.11.0) */
posSliderH.addEventListener("input", (e) => { if (!hIsPhoto()) endIntroEarly(); beginEdit(); if (!hIsPhoto()) noteSel(S.selLR);
  if (!hIsPhoto()) { S.dragOn = true; }                            /* v1.55.0 */
  if (!hIsPhoto() && S.guideOn && GUIDE_FLOW.includes(S.selLR)) S.guideCur = S.selLR;
  applyH(parseFloat(e.target.value)); });
posSliderH.addEventListener("change", () => { const moved = S.dragOn; S.dragOn = false;
  if (!hIsPhoto()) { if (moved) markDone(S.selLR); guideAdvance(S.selLR); } });
$("posMinusH").onclick = () => step(() => { if (!hIsPhoto()) { endIntroEarly(); noteSel(S.selLR); markDone(S.selLR); } applyH(parseFloat(posSliderH.value) - hConfig().step); });
$("posPlusH").onclick  = () => step(() => { if (!hIsPhoto()) { endIntroEarly(); noteSel(S.selLR); markDone(S.selLR); } applyH(parseFloat(posSliderH.value) + hConfig().step); });

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
   (원장님 지시 2026-08-22: 「사진잠금이 센터 라인과 동일 선상에 있도록」). — v3.9.1 에서 폐기,
   아래 참고.
   v1.50.0 까지는 `left:50%` 로 **캔버스 정중앙**이었습니다. 얼굴 중심축은 화면 중앙과
   다르므로(자동 정렬은 작업 영역 한가운데에 맞춥니다) 잠금이 센터선에서 늘 어긋나 보였습니다.
   ⚠️ 왼쪽 도크(프리셋)·아래 도크와 겹치지 않게 **클램프**합니다 — 겹치면 버튼이 눌리지 않습니다.

   ⭐⭐ v3.9.1 — **센터 세로선(v1) 추적을 그만두고, 작업 영역 한가운데에 고정** (원장님 지시
   2026-09-01: 「센터가 사진잠금과 붙어움직이지 않도록 사진잠금과 밝기 버튼이 화면에
   고정되도록 해라」). v3.9.0 부터 AI 자동정렬 버튼도 초기화처럼 사진 위치를 다시 잡으면서,
   그때마다 이 도크가 `S.g.v1` 을 따라 화면에서 같이 튀는 문제가 생겼다 — 사진잠금·밝기
   버튼이 편집 중 계속 흔들리면 실기기에서 누르기 어렵다. `S.g.v1`(사진마다·정렬마다 바뀜)
   대신 `centerX()`(작업 영역 자체의 가운데 — v1.17.0, 사진·선 상태와 무관하게 항상 같음)를
   기준으로 삼는다. ⛔ 다시 S.g.v1 로 되돌리지 마세요 — v1.51.0 문제(잠금이 센터선과 어긋나
   보임)는 사라지지만, 그 대가로 버튼이 다시 흔들립니다. */
function alignCenterDock() {
  const cd = $("centerDock"), lk = $("btnLock");
  if (!cd || !lk || !cd.offsetWidth || !S.dim.W) return;
  const lockMid = lk.offsetLeft + lk.offsetWidth / 2;     // 도크 안에서 잠금 버튼의 중심
  let x = centerX() * S.dim.W - lockMid;                  // 잠금 중심이 작업 영역 한가운데 고정
  const ld = $("leftDock"), bd = $("bottomDock");
  const loLimit = ld ? ld.offsetLeft + ld.offsetWidth + 10 : 0;
  /* ⚠️ v1.92.0 — 좌우 바 행(.barrow)은 .bdock 보다 **왼쪽으로 넘쳐** 있습니다(152%).
     그 왼쪽 끝에 AI 눈썹정렬 버튼이 있으므로, bdock 만 보면 잠금이 AI 버튼 위로 올라탑니다
     (영어 라벨로 왼쪽 도크가 넓어졌을 때 실제로 겹쳤습니다). **더 왼쪽인 쪽**을 한계로 잡습니다. */
  const snap = $("btnSnap");
  /* ⚠️ v1.93.0 — getBoundingClientRect 는 rot90(세로폰 가짜 회전)에서 90° 돌아간 좌표를 줍니다.
     실제 폰에서 잠금이 엉뚱한 곳에 놓여 AI 버튼과 겹친 원인(원장님 신고 2026-08-29).
     **offsetLeft(레이아웃 좌표)** 로만 잰다 — BASELINE 1-6 과 같은 이유입니다. ⛔ rect 로 되돌리지 마세요. */
  const snapLeft = bd && snap && snap.offsetParent ? bd.offsetLeft + snap.offsetLeft : S.dim.W;
  const rightEdge = Math.min(bd ? bd.offsetLeft : S.dim.W, snapLeft);
  /* v3.25.0 — 잠금 오른쪽에 미러링 도크(10px + 폭)가 붙으므로 그만큼 더 왼쪽에서 멈춘다.
     자리가 모자라면 잠금이 그만큼 왼쪽으로 밀린다(겹치는 것보다 밀리는 게 낫다 — 기존 원칙).
     ⚠️ dock-min(667·740 같은 좁은 폰)에서는 잠금+미러링이 왼쪽 도크와 AI 사이에 못 들어간다 —
     그때만 미러링을 **위 행 오른쪽 끝**([밝기][왼쪽][오른쪽][미러링])으로 올린다 (index.html CSS 도 함께). */
  const mirrorUp = document.body.classList.contains("dock-min");
  const mdEl = $("mirrorDock"), brD = $("brightnessDock");
  const mdW = (!mirrorUp && mdEl && mdEl.offsetWidth) ? mdEl.offsetWidth + 10 : 0;
  const hiLimit = rightEdge - 10 - cd.offsetWidth - mdW;
  x = clamp(x, Math.min(loLimit, Math.max(hiLimit, 0)), Math.max(hiLimit, 0));
  cd.style.left = "0px";
  cd.style.transform = `translateX(${Math.round(x)}px)`;

  /* v3.7.1 — 밝기 버튼 묶음은 `.cdock` 밖 (BASELINE "가운데아래 .cdock = 사진잠금 하나" · 회귀 83·106 lockAlone).
     ⭐ v3.25.0 — 두 행 배치 (원장님 지시 2026-09-02). 잠금 도크와 같은 x 좌표계로:
       · 위 행 `#topRowDock` = [밝기(길고 얇게)][왼쪽][오른쪽] — 잠금 **위**, 왼쪽 끝을 잠금에 맞춤
       · 아래 행 `#mirrorDock` = [미러링] — 잠금 **오른쪽 10px** (잠금 ↔ AI 눈썹정렬 사이)
     ⚠️ 위 행이 AI 버튼(snapLeft) 쪽으로 넘치면 왼쪽으로 물러선다 — 겹치는 것보다 밀리는 게 낫다.
     아래 행(미러링)은 alignCenterDock 의 hiLimit 계산에 자기 폭이 포함되어 있어(아래) 넘치지 않는다. */
  /* ⭐ v3.26.0 배치 (원장님 지시 2026-09-02, 두 번째 조정):
       아래 행 = [밝기 (잠금 왼쪽 8px)][잠금][미러링 (잠금 오른쪽 10px)]
       위 행   = [왼쪽][오른쪽] — 미러링 바로 위, 미러링 왼쪽 끝에 맞춤
     dock-min(좁은 폰) 만 예외: 위 행 = [밝기][왼쪽][오른쪽][미러링] / 아래 행 = [잠금].
     위 행은 아래 행 버튼들 위에 떠 있으므로 왼쪽 도크와 겹치지 않는다 — 오른쪽의 줌~밸런스 행만 피한다. */
  const tr = $("topRowDock");
  const brW = brD && brD.offsetWidth ? brD.offsetWidth : 0;
  const trW0 = tr && tr.offsetWidth ? tr.offsetWidth : 0;
  const mdW0 = mdEl && mdEl.offsetWidth ? mdEl.offsetWidth : 0;
  const place = (el, px) => { if (!el) return; el.style.left = "0px"; el.style.transform = `translateX(${Math.round(px)}px)`; };
  if (mirrorUp) {
    const rowW = brW + 6 + trW0 + 6 + mdW0;
    const trLo = ld ? ld.offsetLeft : 0, trHi = (bd ? bd.offsetLeft : S.dim.W) - 10 - rowW;
    const tx = clamp(x, Math.min(trLo, Math.max(trHi, 0)), Math.max(trHi, 0));
    place(brD, tx); place(tr, tx + brW + 6); place(mdEl, tx + brW + 6 + trW0 + 6);
  } else {
    if (brD && brW) place(brD, Math.max(x - brW - 8, loLimit));   /* 밝기: 잠금 왼쪽 (좁으면 잠금과 벌어짐 — v3.7.1 원칙) */
    const mx = x + cd.offsetWidth + 10;
    place(mdEl, mx);
    if (tr && trW0) {
      const trHi = (bd ? bd.offsetLeft : S.dim.W) - 10 - trW0;
      place(tr, clamp(mx, Math.min(mx, Math.max(trHi, 0)), Math.max(trHi, 0)));
    }
  }
}

/* ⭐ v1.93.0 — **아래 도크 자동 맞춤** (원장님 지시 2026-08-29). 화면 폭은 기기마다 다르다 —
   실제로 재 보고, 왼쪽 도크와 잠금·AI 버튼이 서로 밟으면 dock-tight → dock-min 으로 줄인다.
   측정은 전부 offsetLeft(레이아웃 좌표) — rot90 에서 rect 는 돌아가 있다(위 alignCenterDock 주석). */
function fitDocks() {
  const b = document.body;
  const ld = $("leftDock"), bd = $("bottomDock"), snap = $("btnSnap"), lk = $("btnLock");
  const tr = $("topRowDock"), md = $("mirrorDock"), brD = $("brightnessDock");
  if (!ld || !bd || !snap || !lk || !ld.offsetWidth) return;
  /* v3.7.1 — 밝기 버튼 몫까지 여유 계산에 넣어야 좁은 화면에서 dock-tight/dock-min 으로 제때 줄어든다.
     ⭐ v3.25.0 — 두 행: 아래 행 = 잠금 + 8 + 미러링 · 위 행 = 밝기 + 왼쪽 + 오른쪽. 둘 중 넓은 쪽이 기준. */
  for (const cls of ["", "dock-tight", "dock-min"]) {
    b.classList.remove("dock-tight", "dock-min");
    if (cls) b.classList.add(cls);
    const snapLeft = bd.offsetLeft + snap.offsetLeft;
    const ldRight = ld.offsetLeft + ld.offsetWidth;
    const up = cls === "dock-min";                                   /* dock-min 이면 밝기·미러링은 위 행 (alignCenterDock) */
    const mdWidth = md && md.offsetWidth && !up ? md.offsetWidth + 10 : 0;
    const brWidth = brD && brD.offsetWidth && !up ? brD.offsetWidth + 8 : 0;
    const trWidth = (tr && tr.offsetWidth ? tr.offsetWidth : 0) + (up ? (md ? md.offsetWidth + 6 : 0) + (brD ? brD.offsetWidth + 6 : 0) : 0);
    /* 아래 행: 잠금+미러링이 왼쪽 도크와 AI 버튼 사이에 여유 있게 들어가는가.
       위 행: 왼쪽 도크(아래 행 버튼들)보다 **위**에 떠 있어 왼쪽은 화면 끝(ld.offsetLeft)까지 자유롭고,
       오른쪽은 줌~밸런스 행(bd.offsetLeft)만 피하면 된다 — 위 행 때문에 dock-min 으로 떨어지면 안 된다. */
    if (snapLeft - ldRight >= brWidth + lk.offsetWidth + mdWidth + 24
        && bd.offsetLeft - ld.offsetLeft >= trWidth + 20) break;
  }
  alignCenterDock();
}

/* 오른쪽 도크는 아래 도크와 겹치면 안 되므로 아래 도크 높이를 CSS 변수로 넘긴다 */
function syncDockSpace() {
  const b = $("bottomDock");
  if (!b) return;
  stage.style.setProperty("--bdock", (b.offsetHeight + 18) + "px");
}

function applyLayout() {
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
  /* ⭐ v1.93.0 — **무조건 가로** (원장님 지시 2026-08-29: 「핸드폰 회전 잠금이 잠겨 있든 아니든
     우리 앱은 무조건 가로모드」). pb_orient 설정("off" 포함)을 더 이상 따지지 않는다 —
     **손가락으로 쓰는 기기**(폰·태블릿)는 편집 화면에서 뷰포트가 세로면 언제나 90° 돌린다.
     isTouchDevice 는 남긴다: 데스크톱 브라우저 창을 세로로 좁힌 경우까지 돌리면
     PC 확인 작업이 불가능해진다 (세로 폴백 레이아웃 · 회귀 11). 사진 선택 중 예외(v1.27.0)도 그대로. */
  /* pb_test_norot — **회귀 테스트 전용** 탈출구. 세로 폴백 레이아웃(회귀 11 등)을 터치 컨텍스트에서
     검사하려면 회전을 잠시 꺼야 한다. 사용자용 설정이 아니다 — UI 어디에도 없다. */
  const rot = devPortrait && editing && isTouchDevice()
    && localStorage.getItem("pb_test_norot") !== "1";
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
  fitDocks();                     /* v1.93.0 — 이 화면 폭에 맞게 아래 도크를 줄인다 */
}

/* 진짜 방향 잠금 — 성공하면 폰 화면 자체가 가로로 돌아간다(= 시스템 UI 도 함께 가로).
   · 안드로이드 설치앱(PWA standalone) : 동작함
   · 안드로이드 브라우저 탭            : 전체화면 상태에서만 허용되는 경우가 있어 재시도
   · 아이폰/아이패드 사파리            : 미구현 — 위의 rot90 CSS 회전이 대신 처리한다
   실패해도 조용히 넘어간다. 실패 = 가짜 회전으로 폴백. */
let orientLockDone = false, orientLockTries = 0;
function tryOrientationLock() {
  if (orientLockDone) return;   /* v1.93.0 — 무조건 가로: "off" 예외 폐지 */
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
  /* v1.94.0 — 고유색이 LOOK_DEF 를 따라가도록 참조로 연결 (기본값이 바뀌어도 안 어긋나게) */
  LINE_COLORS: { eye: "#3A3F4A", arch: LOOK_DEF.arch, tail: LOOK_DEF.tail, inner: LOOK_DEF.inner, innerDim: "#C9D1D6", neutral: "#14161B" },
  render, runFaceAI, loadPhoto, alignFromPupils, autoAlign, aiValueFor, imgToCanvas, posConfig,
  showNote, showHud, startBalAnim,   /* v3.15.0 — 미러링 애니메이션 검사용 */
  placeLinesFromEyes,
  faceFrame, applyPreset, segPx, fitPresetToFace, runBalance, photoPixels, buildFavBar, favIds, balTolPx, balBandPx,
  runBalanceCurve, readSideCurve, balBridgeOutliers, balIgnoreZones, BAL_IGNORE_RULES,
  autoFromDrawing, readDrawing, browBoxes, columnRuns, outlinePair, seqOrient, showArchDots,
  applyLayout, openPicker, endPicking, setLang,
  PALETTE, LOOK_DEF, LOOK_COMBOS, loadLook, saveLook, buildLookUI, edgeColorFor, relLum,
  GUIDE_FLOW, FLOW_ALL, FLOW_DEF, setFlow, saveFlow, TAIL_CROSS, crossOfStep,
  updateGuideTip, trimOutside, browBoxes, innerDecide, innerProfile, innerAnchor, innerCaseF, innerFallback,
  INNER_F_LO, INNER_F_MID, INNER_F_SOFT, INNER_F_HARD, INNER_RISE, INNER_MULT, INNER_CORE, INNER_CASES, V_PALETTE, hasEdge, startIntro, INTRO_MS, hitTest, endIntroEarly,
  workLeft, workRight, centerX,     /* v1.95.0 — 작업 영역 검사용 (v1.96.0 centerX 추가) */
  findPupilsFallback, fallbackPupilAlign, EYE_FRAC, INNER_FRAC, CENTER_Y, faceRef, dispV,
  findCanthus, detectFaceRef, CANTHUS_BAND, CANTHUS_DARK, CANTHUS_AP, CANTHUS_RUN,
  frontDecide, darkBlobsUp, archDecide, eyeArchRange,
  BROW_FRAC, browFillNeed, fitBrowsToFrame,
  ARCH_COLS, ARCH_SPAN, ARCH_UP, ARCH_T_LO, ARCH_T_HI, AT_T_MIN, AT_T_MAX, AT_FROM_FRONT, ARCH_FROM_AT, AT_FROM_ARCH, ARCH_MAX_OVER_FT, archEdgeMax, archStandard, applyArchThickFloor, tailTrace,
  FRONT_COLS, FRONT_SPAN, FRONT_LASH_GAP, FRONT_UP, FRONT_HALF, FRONT_DARK_MIN, FRONT_WIN, FRONT_HIT,
  FRONT_T_MID, FRONT_T_LO, FRONT_T_HI, frontTickPx, frontFloor, FT_T_MID, FT_T_MIN, FT_T_MAX, FT_P2_MIN, INNER_F_SOFT, ftGuard, eyeZeroY };   /* v1.97.0 — 예비 동공 정렬 검사용 */
