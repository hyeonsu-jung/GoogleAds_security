/**
 * Google Ads 보안 자가진단 — 응답 수집 스크립트 (CID 취합 버전)
 *
 * [배포 방법]
 * 1. Google Sheets 새 파일 생성
 * 2. 상단 메뉴 → 확장 프로그램 → Apps Script
 * 3. 이 코드 전체 붙여넣기 후 저장 (Ctrl+S)
 * 4. 편집기에서 setupSheets() 함수 선택 후 ▶ 실행 → 시트 초기 세팅
 * 5. 우측 상단 [배포] → [새 배포]
 *    - 유형: 웹 앱
 *    - 다음 사용자로 실행: 나 (본인 Google 계정)
 *    - 액세스 권한: 모든 사용자
 * 6. [배포] → 권한 승인 → 웹 앱 URL 복사
 * 7. Vercel 환경변수 GAS_URL 에 붙여넣기
 */

// ── 시트 이름 상수 ──
var SHEET_CID = 'CID 제출 현황';

// ── 초기 세팅 (최초 1회 실행) ──
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // CID 제출 시트
  var cidSheet = ss.getSheetByName(SHEET_CID) || ss.insertSheet(SHEET_CID);
  cidSheet.clearContents();
  var cidHeaders = ['제출 일시', '소속 본부', '담당 팀', '대상 CID'];
  var hRange = cidSheet.getRange(1, 1, 1, cidHeaders.length);
  hRange.setValues([cidHeaders]);
  hRange.setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  cidSheet.setColumnWidth(1, 170);
  cidSheet.setColumnWidth(2, 150);
  cidSheet.setColumnWidth(3, 150);
  cidSheet.setColumnWidth(4, 160);
  cidSheet.setFrozenRows(1);

  Logger.log('시트 세팅 완료');
}

// ── GET 요청 처리 ──
function doGet(e) {
  try {
    var p = e.parameter;
    var action = p.action || 'legacy';

    // CID 제출 (action=cid)
    if (action === 'cid') {
      return handleCIDSubmit(p);
    }

    // 카운트 조회 (action=count)
    if (action === 'count') {
      return handleCount();
    }

    // 레거시 (기존 체크리스트 제출)
    return handleLegacy(p);

  } catch (err) {
    Logger.log('오류: ' + err);
    return buildResponse({ok: false, error: err.toString()});
  }
}

// ── CID 제출 처리 ──
function handleCIDSubmit(p) {
  if (!p.dept || !p.team || !p.cid) {
    return buildResponse({ok: false, error: '필수값 누락'});
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CID) || ss.insertSheet(SHEET_CID);

  var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([now, p.dept, p.team, p.cid]);

  // 행 색상 (짝수/홀수 구분)
  var lastRow = sheet.getLastRow();
  var bgColor = (lastRow % 2 === 0) ? '#f8f9ff' : '#ffffff';
  sheet.getRange(lastRow, 1, 1, 4).setBackground(bgColor);

  // 제출 후 현재 카운트 반환
  var count = Math.max(0, sheet.getLastRow() - 1);
  return buildResponse({ok: true, count: count});
}

// ── 카운트 조회 ──
function handleCount() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CID);
  var count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  return buildResponse({ok: true, count: count});
}

// ── 레거시 체크리스트 제출 (기존 호환) ──
function handleLegacy(p) {
  if (!p.dept || !p.team || !p.cid) {
    return buildResponse({ok: false, error: '필수값 누락'});
  }
  // 기존 동작과 동일하게 CID 시트에도 기록
  return handleCIDSubmit(p);
}

// ── JSON 응답 헬퍼 ──
function buildResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
