import { ComparisonCriteria, Subscriber } from './types';
import * as XLSX from 'xlsx-js-style';

/**
 * 이름 자동 마스킹 규칙 (예: 홍길동 -> 홍*동, 홍동 -> 홍*동)
 * 성과 끝자리만 입력받아 가운데를 *로 마스킹
 */
export function autoMaskName(name: string): string {
  if (!name) return '';
  const clean = name.trim();
  if (clean.length <= 1) return clean;
  return clean[0] + '*'.repeat(Math.max(1, clean.length - 2)) + clean[clean.length - 1];
}

/**
 * 교번 자동 마스킹 규칙 (예: 243556 -> 24**56, 2456 -> 24**56)
 * 앞 2자리 + 끝 2자리만 입력받아 가운데를 **로 마스킹
 */
export function autoMaskIdNumber(idNum: string): string {
  if (!idNum) return '';
  const clean = idNum.trim();
  if (clean.length <= 2) return clean;
  return clean.slice(0, 2) + '*'.repeat(Math.max(2, clean.length - 4)) + clean.slice(-2);
}

/**
 * 입사월과 산출 기준월 비교하여 당월 부담금 납입 대상 여부 판별
 */
export function isTargetMonth(
  joinDate: string,
  referenceMonth: string,
  criteria: ComparisonCriteria
): boolean {
  if (!joinDate || !referenceMonth) return false;

  if (criteria === 'YEAR_MONTH') {
    return joinDate.slice(0, 7) === referenceMonth.slice(0, 7);
  } else {
    // MONTH_ONLY: 연도 무관 월(Month)만 비교 (예: '2024-06' 과 '2026-06' -> '06' === '06')
    const joinM = joinDate.slice(5, 7);
    const refM = referenceMonth.slice(5, 7);
    return joinM === refM && Boolean(joinM);
  }
}

/**
 * 소속부서명 기반 별도회계기관 여부 자동 감지
 */
export function detectSeparateAccount(dept: string, separateKeywords: string[]): boolean {
  if (!dept) return false;
  const d = dept.trim();
  return separateKeywords.some(keyword => d.includes(keyword) || keyword.includes(d));
}

/**
 * 부담금 계산 (기준급여 * 비율(%))
 */
export function calculateContribution(baseSalary: number, ratePercent: number): number {
  if (!baseSalary || baseSalary < 0) return 0;
  return Math.round((baseSalary * ratePercent) / 100);
}

/**
 * 금액 한글 원화 포맷
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';
}

/**
 * 입사일 입력값 정규화
 * - YYYY-MM-DD는 그대로 사용
 * - YYYY-MM은 YYYY-MM-01로 보정
 */
export function normalizeJoinDate(joinDate: string): string {
  const clean = joinDate.trim();
  if (!clean) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (/^\d{4}-\d{2}$/.test(clean)) return `${clean}-01`;
  return clean;
}

/**
 * CSV 파싱 헬퍼 (샘플 대량 등록용)
 */
export function parseCSVToSubscribers(csvText: string, separateDepts: string[]): Partial<Subscriber>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Partial<Subscriber>[] = [];
  // Header 예상: 이름,교번,생년월일,소속부서,입사일(YYYY-MM-DD),기준급여
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length >= 5) {
      const rawName = cols[0] || '';
      const rawId = cols[1] || '';
      const birthDate = cols.length >= 6 ? cols[2] || '' : '';
      const dept = cols.length >= 6 ? cols[3] || '일반부서' : cols[2] || '일반부서';
      const joinDate = normalizeJoinDate(cols.length >= 6
        ? cols[4] || `${new Date().toISOString().slice(0, 10)}`
        : cols[3] || `${new Date().toISOString().slice(0, 10)}`);
      const salary = Number((cols.length >= 6 ? cols[5] : cols[4])?.replace(/[^0-9]/g, '')) || 3500000;

      results.push({
        id: 'sub_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
        rawName,
        maskedName: autoMaskName(rawName),
        rawIdNumber: rawId,
        maskedIdNumber: autoMaskIdNumber(rawId),
        birthDate,
        department: dept,
        joinDate,
        isSeparateAccount: detectSeparateAccount(dept, separateDepts),
        baseSalary: salary,
        contributionAmount: salary,
        memo: 'CSV 대량 업로드 가입자'
      });
    }
  }
  return results;
}

/**
 * CSV 다운로드 생성
 */
export function exportToCSV(subscribers: Subscriber[], refMonth: string, criteria: ComparisonCriteria): string {
  const headers = ['마스킹이름', '원본이름(보안)', '마스킹교번', '생년월일', '소속부서', '입사일', '별도회계여부', '기준급여(원)', '당월부담금(원)', '당월납입대상여부', '비고'];
  const rows = subscribers.map(s => {
    const isTarget = isTargetMonth(s.joinDate, refMonth, criteria);
    return [
      s.maskedName,
      s.rawName || s.maskedName,
      s.maskedIdNumber,
      s.birthDate || '',
      s.department,
      s.joinDate,
      s.isSeparateAccount ? '별도회계(Y)' : '일반회계(N)',
      s.baseSalary,
      isTarget ? s.contributionAmount : 0,
      isTarget ? '대상' : '비대상',
      s.memo || ''
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

/**
 * 당월 부담금 입력용 빈 엑셀 템플릿 생성
 */
export function exportContributionTemplateXlsx(referenceMonth: string): void {
  const worksheetData = [
    ['퇴직연금 당월 납입 부담금 입력용 양식'],
    [`기준월: ${referenceMonth}`],
    [],
    ['마스킹 이름', '마스킹 교번', '생년월일', '소속부서', '입사일', '기준급여', '당월 산출 부담금', '비고']
  ];

  for (let i = 0; i < 30; i++) {
    worksheetData.push(['', '', '', '', '', '', '', '']);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '당월부담금');

  const safeMonth = referenceMonth || new Date().toISOString().slice(0, 7);
  XLSX.writeFile(workbook, `퇴직연금_당월부담금_양식_${safeMonth}.xlsx`);
}

function cell(v: any, opts: any = {}): any {
  const c: any = { v };
  if (typeof v === 'number') c.t = 'n';
  else c.t = 's';
  c.s = {
    font: opts.font || { name: '맑은 고딕', sz: 11 },
    alignment: opts.align || { horizontal: 'left', vertical: 'center' },
    border: opts.border || {
      top: { style: 'thin', color: { rgb: 'BFBFBF' } },
      bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
      left: { style: 'thin', color: { rgb: 'BFBFBF' } },
      right: { style: 'thin', color: { rgb: 'BFBFBF' } },
    },
    ...(opts.fill ? { fill: opts.fill } : {}),
  };
  return c;
}

/**
 * 가입자 명부 엑셀 업로드용 양식 다운로드
 * 이름 성/끝, 교번 앞2/끝2 분리, 회계기관분류 선택 가능
 */
export function downloadSubscriberTemplateXlsx(): void {
  const headers = [
    '이름(성)', '이름(끝)', '교번(앞2)', '교번(끝2)',
    '생년월일', '소속부서', '입사일', '회계기관분류', '기준급여', '비고'
  ];

  const FONT_BOLD = { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
  const FILL_HEAD = { patternType: 'solid', fgColor: { rgb: '1F4E78' } };
  const ALIGN_C = { horizontal: 'center', vertical: 'center' };
  const ALIGN_L = { horizontal: 'left', vertical: 'center' };

  const ws: any = {};
  headers.forEach((h, i) => {
    const col = XLSX.utils.encode_col(i);
    ws[`${col}1`] = cell(h, { font: FONT_BOLD, fill: FILL_HEAD, align: ALIGN_C });
  });

  // 10개 빈 행 + 예시 행
  for (let r = 2; r <= 12; r++) {
    headers.forEach((_, i) => {
      const col = XLSX.utils.encode_col(i);
      ws[`${col}${r}`] = cell('', { align: ALIGN_L });
    });
  }
  // 예시 데이터 행
  const example = ['홍', '동', '24', '56', '1991-04-12', '총무처 인사팀', '2026-06-01', '일반회계', '3800000', '신규입사'];
  example.forEach((v, i) => {
    const col = XLSX.utils.encode_col(i);
    ws[`${col}13`] = cell(v, { align: ALIGN_L, font: { name: '맑은 고딕', sz: 11, italic: true, color: { rgb: '888888' } } });
  });

  ws['!ref'] = 'A1:J13';
  ws['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 24 }
  ];

  // 데이터 유효성 검사 (회계기관분류 드롭다운)
  ws['!dataValidations'] = [{
    type: 'list',
    formula1: '"일반회계,별도회계"',
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: '입력 오류',
    error: '"일반회계" 또는 "별도회계"를 입력하세요.',
    ranges: [{ s: { r: 1, c: 7 }, e: { r: 99, c: 7 } }]  // H열 (0-indexed: col 7)
  }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '가입자등록양식');
  XLSX.writeFile(wb, '퇴직연금_가입자_등록_양식.xlsx', { bookType: 'xlsx', cellStyles: true });
}

/**
 * 업로드된 엑셀 데이터를 Subscriber 배열로 파싱
 * 엑셀 열 순서: 이름(성), 이름(끝), 교번(앞2), 교번(끝2), 생년월일, 소속부서, 입사일, 회계기관분류, 기준급여, 비고
 */
export function parseXlsxToSubscribers(arrayBuffer: ArrayBuffer, separateDepts: string[]): Partial<Subscriber>[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 }) as any[][];

  const results: Partial<Subscriber>[] = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every((c: any) => c === undefined || c === null || c === '')) continue;

    const firstName = String(row[0] || '').trim();
    const lastName = String(row[1] || '').trim();
    const idFirst2 = String(row[2] || '').trim();
    const idLast2 = String(row[3] || '').trim();
    const birthDate = String(row[4] || '').trim();
    const department = String(row[5] || '').trim();
    const joinDate = String(row[6] || '').trim();
    const accountType = String(row[7] || '').trim();
    const salary = Number(String(row[8] || '0').replace(/[^0-9]/g, '')) || 0;
    const memo = String(row[9] || '').trim();

    const rawName = firstName + lastName;
    const rawIdNumber = idFirst2 + idLast2;
    const maskedName = autoMaskName(rawName);
    const maskedIdNumber = autoMaskIdNumber(rawIdNumber);
    const isSeparate = accountType === '별도회계';

    if (!rawName || !rawIdNumber) continue;

    results.push({
      id: 'sub_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
      rawName,
      maskedName,
      rawIdNumber,
      maskedIdNumber,
      birthDate: birthDate || undefined,
      department: department || '일반부서',
      joinDate: normalizeJoinDate(joinDate || new Date().toISOString().slice(0, 10)),
      isSeparateAccount: isSeparate,
      baseSalary: salary,
      contributionAmount: salary,
      memo
    });
  }
  return results;
}
