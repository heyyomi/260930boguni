import { ClaimRecord, GoogleSheetsConfig } from '../types';

export const CODE_GS_SCRIPT = `/**
 * [추억의 뽑기 상품 수령 관리 시스템] 구글 앱스 스크립트 (Code.gs)
 * 
 * [설치 및 배포 가이드]
 * 1. 새 구글 스프레드시트 생성 (예: "추억의 뽑기 수령 명단")
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 3. 기존 코드 전체를 지우고 이 스크립트 내용을 그대로 붙여넣기
 * 4. 오른쪽 상단 [배포] -> [새 배포] 클릭
 * 5. 톱니바퀴 아이콘 -> [웹 앱] 선택
 *    - 설명: 뽑기 수령 연동 API
 *    - 다음 사용자로 실행: [나] (본인 구글 계정)
 *    - 액세스 권한이 있는 사용자: [모든 사용자] (⚠️ 매우 중요! 로그인이 필요 없어야 태블릿에서 동작함)
 * 6. [배포] 버튼 클릭 후 표시되는 "웹 앱 URL"(https://script.google.com/macros/s/.../exec)을 복사하여
 *    뽑기 웹앱의 [구글 시트 연동 설정]에 붙여넣기하세요!
 */

const SHEET_NAME = '수령기록';
const HEADERS = ['등록일시', '고유ID', '구분', '학년', '반', '이름', '직책/역할', '당첨상품', '등수', '접수기기'];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 첫 행에 헤더 스타일 적용
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    headerRange.setBackground('#4F46E5');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 36);
  }
  return sheet;
}

// GET 요청: 저장된 모든 수령 기록 반환
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return jsonResponse({
        status: 'success',
        records: [],
        message: '등록된 데이터가 없습니다.'
      });
    }

    const rows = data.slice(1);
    const records = rows.map(function(row) {
      return {
        id: String(row[1] || ''),
        timestamp: String(row[0] || ''),
        formattedTime: String(row[0] || ''),
        userType: row[2] === '학생' ? 'student' : 'staff',
        grade: row[3] ? Number(row[3]) : undefined,
        classNum: row[4] ? Number(row[4]) : undefined,
        name: String(row[5] || ''),
        role: String(row[6] || ''),
        prizeName: String(row[7] || ''),
        prizeRank: Number(row[8] || 0),
        deviceLabel: String(row[9] || '디벗')
      };
    }).reverse(); // 최신순

    return jsonResponse({
      status: 'success',
      records: records,
      count: records.length
    });
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

// POST 요청: 새로운 수령 기록 추가
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    // 액션 분기 (기록 추가 또는 테스트)
    if (body.action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: '구글 시트 연동 성공!'
      });
    }

    if (body.action === 'add' || body.record) {
      const rec = body.record || body;
      const userTypeLabel = rec.userType === 'student' ? '학생' : '교직원';
      const gradeVal = rec.grade ? rec.grade : '';
      const classVal = rec.classNum ? rec.classNum : '';
      const roleVal = rec.role ? rec.role : '';
      const timeStr = rec.formattedTime || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

      sheet.appendRow([
        timeStr,
        rec.id,
        userTypeLabel,
        gradeVal,
        classVal,
        rec.name,
        roleVal,
        rec.prizeName,
        rec.prizeRank,
        rec.deviceLabel || '디벗'
      ]);

      return jsonResponse({
        status: 'success',
        message: '저장 완료',
        id: rec.id
      });
    }

    // 기록 삭제 지원
    if (body.action === 'delete' && body.id) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]) === String(body.id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ status: 'success', message: '삭제 완료' });
        }
      }
      return jsonResponse({ status: 'not_found', message: '일치하는 기록을 찾을 수 없습니다.' });
    }

    return jsonResponse({
      status: 'ignored',
      message: '알 수 없는 요청'
    });
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export async function testGasConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: '올바른 웹 앱 URL을 입력해 주세요. (https://script.google.com/macros/s/...)' };
  }

  try {
    const trimmedUrl = url.trim();
    // Test with GET first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(trimmedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok && res.type !== 'opaque') {
      return { success: false, message: `서버 응답 오류 (HTTP ${res.status}). 웹 앱 배포 권한을 "모든 사용자"로 설정했는지 확인하세요.` };
    }

    const data = await res.json().catch(() => null);
    if (data && (data.status === 'success' || Array.isArray(data.records))) {
      return { success: true, message: '구글 시트 연동 성공! 데이터 통신이 원활합니다.' };
    }

    return { success: true, message: '구글 시트 웹 앱에 정상 연결되었습니다.' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, message: '요청 시간이 초과되었습니다. 구글 앱스 스크립트 배포 상태를 확인해주세요.' };
    }
    // In some browser CORS environments, GET is permitted or mode opaque
    return { success: false, message: `연동 테스트 실패: ${error.message || '네트워크 오류가 발생했습니다. Apps Script 권한을 확인해주세요.'}` };
  }
}

export async function saveRecordToGas(url: string, record: ClaimRecord): Promise<boolean> {
  if (!url || !url.trim().startsWith('http')) {
    return false;
  }

  try {
    const trimmedUrl = url.trim();
    // Using text/plain prevents unwanted preflight OPTIONS block in GAS
    const payload = JSON.stringify({
      action: 'add',
      record,
    });

    await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
      mode: 'no-cors', // GAS web app redirects can be handled transparently
    });

    return true;
  } catch (error) {
    console.error('Failed to post record to GAS:', error);
    return false;
  }
}

export async function fetchRecordsFromGas(url: string): Promise<ClaimRecord[] | null> {
  if (!url || !url.trim().startsWith('http')) {
    return null;
  }

  try {
    const trimmedUrl = url.trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${trimmedUrl}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.status === 'success' && Array.isArray(data.records)) {
      return data.records;
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch records from GAS:', error);
    return null;
  }
}

export async function deleteRecordFromGas(url: string, recordId: string): Promise<boolean> {
  if (!url || !url.trim().startsWith('http')) {
    return false;
  }

  try {
    await fetch(url.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'delete',
        id: recordId,
      }),
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.error('Failed to delete from GAS:', error);
    return false;
  }
}
