/**
 * Google Ads 보안 자가진단 - 응답 수집 스크립트
 *
 * [배포 방법]
 * 1. Google Sheets 새 파일 생성
 * 2. 상단 메뉴 → 확장 프로그램 → Apps Script
 * 3. 이 코드 전체 붙여넣기 후 저장 (Ctrl+S)
 * 4. 우측 상단 [배포] → [새 배포] 클릭
 *    - 유형: 웹 앱
 *    - 설명: (자유롭게 입력)
 *    - 다음 사용자로 실행: 나 (본인 Google 계정)
 *    - 액세스 권한: 모든 사용자
 * 5. [배포] 클릭 → 권한 승인 → 웹 앱 URL 복사
 * 6. 복사한 URL을 Vercel 프로젝트 Environment Variables의 GAS_URL에 등록
 *    (로컬: .env.example → .env.local 복사 후 값 입력, `npx vercel dev`)
 */

// ── 시트 헤더 초기 세팅 (최초 1회만 실행)
// Apps Script 편집기에서 직접 실행하거나 배포 전 수동 실행
function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.setName('자가진단 응답');

  var headers = [
    '제출 일시',
    '소속 본부',
    '담당 팀',
    '마스터 MCC ID',
    '대상 개별 CID',
    '비밀번호 재설정',
    '2단계 인증(MFA)',
    '허용 도메인 제한',
    '계정 소유권 확인',
    '보안 달성률'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // 헤더 스타일
  headerRange.setBackground('#1a1a2e');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 열 너비 자동 조정
  sheet.setColumnWidth(1, 160); // 제출 일시
  sheet.setColumnWidth(2, 130); // 소속 본부
  sheet.setColumnWidth(3, 130); // 담당 팀
  sheet.setColumnWidth(4, 140); // 마스터 MCC ID
  sheet.setColumnWidth(5, 140); // 대상 개별 CID
  sheet.setColumnWidth(6, 130); // 비밀번호 재설정
  sheet.setColumnWidth(7, 130); // 2단계 인증
  sheet.setColumnWidth(8, 130); // 허용 도메인
  sheet.setColumnWidth(9, 130); // 계정 소유권
  sheet.setColumnWidth(10, 100); // 보안 달성률

  // 행 고정
  sheet.setFrozenRows(1);

  Logger.log('시트 헤더 설정 완료');
}


// ── GET 요청 처리 (HTML에서 fetch GET으로 데이터 전송)
function doGet(e) {
  try {
    var params = e.parameter;

    // 필수값 검증
    if (!params.dept || !params.team || !params.cid) {
      return buildResponse('error', '필수 입력값 누락');
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 한국 시간 기준 타임스탬프
    var now = Utilities.formatDate(
      new Date(),
      'Asia/Seoul',
      'yyyy-MM-dd HH:mm:ss'
    );

    // 체크박스 값 Y/N 변환
    function yn(val) { return val === 'true' ? 'Y' : 'N'; }

    var row = [
      now,
      params.dept  || '',
      params.team  || '',
      params.mcc   || '미입력',
      params.cid   || '',
      yn(params.chk_pw),
      yn(params.chk_mfa),
      yn(params.chk_domain),
      yn(params.chk_owner),
      (params.score || '0') + '%'
    ];

    sheet.appendRow(row);

    // 새로 추가된 행에 조건부 색상 적용
    var lastRow = sheet.getLastRow();
    colorizeRow(sheet, lastRow, params);

    return buildResponse('success', '제출 완료');

  } catch (err) {
    Logger.log('오류: ' + err.toString());
    return buildResponse('error', err.toString());
  }
}


// ── 100% 달성 행은 초록, 미완료 행은 노랑으로 하이라이트
function colorizeRow(sheet, rowNum, params) {
  var allChecked =
    params.chk_pw     === 'true' &&
    params.chk_mfa    === 'true' &&
    params.chk_domain === 'true' &&
    params.chk_owner  === 'true';

  var bgColor = allChecked ? '#e6f4ea' : '#fef9c3';
  sheet.getRange(rowNum, 1, 1, 10).setBackground(bgColor);
}


// ── JSON 응답 헬퍼
function buildResponse(status, message) {
  var payload = JSON.stringify({ status: status, message: message });
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}
