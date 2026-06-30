import * as XLSX from 'xlsx-js-style';
import { DcEmployee, DcCalcResult } from './types';

export function createDcEmployee(): DcEmployee {
  return {
    empName: '', empId: '', birthDate: '', department: '',
    separateFunding: false, startDate: '', endDate: '',
    totalBase: 0, firstMode: 'prorated', firstBase: 0, firstDeduction: 0,
    lastMode: 'prorated', lastBase: 0, lastDeduction: 0,
    extraPays: [], prevPaid: 0, totalWage: 0, severance: 0
  };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function parseNum(str: string): number {
  return parseInt((str || '').replace(/,/g, '')) || 0;
}

export function calcDcEmployee(p: DcEmployee): DcCalcResult {
  const firstMode = p.firstMode || 'prorated';
  const lastMode = p.lastMode || 'prorated';

  let proratedFirst = 0, proratedLast = 0;
  let startTotal = 0, startWorked = 0, endTotal = 0, endWorked = 0;

  if (p.startDate && p.endDate) {
    const startD = new Date(p.startDate);
    startTotal = getDaysInMonth(startD.getFullYear(), startD.getMonth() + 1);
    startWorked = startD.getDate() - 1; // 기산일 전일까지 (기산일 제외)
    proratedFirst = (p.firstBase / startTotal) * startWorked;

    const endD = new Date(p.endDate);
    endTotal = getDaysInMonth(endD.getFullYear(), endD.getMonth() + 1);
    endWorked = endD.getDate();
    proratedLast = (p.lastBase / endTotal) * endWorked;
  }

  let firstSubtract = 0, firstContrib = 0;
  if (firstMode === 'prorated') {
    firstSubtract = p.firstBase || 0;
    firstContrib = proratedFirst;
  } else {
    firstSubtract = p.firstDeduction || 0;
  }

  let lastSubtract = 0, lastContrib = 0;
  if (lastMode === 'prorated') {
    lastSubtract = p.lastBase || 0;
    lastContrib = proratedLast;
  } else {
    lastSubtract = p.lastDeduction || 0;
  }

  let includedExtra = 0;
  p.extraPays.forEach(item => {
    if (item.included) includedExtra += item.amount;
  });

  const prevPaid = p.prevPaid || 0;

  const lines: string[] = [];
  if (p.startDate && p.endDate) {
    lines.push('<div>· 중간 기간 급여: 전액 반영</div>');
    if (firstMode === 'prorated' && (p.firstBase || 0) > 0) {
      lines.push(`<div>· 첫 달: ${startTotal}일 중 <b>${startWorked}일</b> 일할 → <b>${Math.round(proratedFirst).toLocaleString()}원</b></div>`);
    } else if (firstMode === 'deduction' && firstSubtract > 0) {
      lines.push(`<div>· 첫 달: 총합계에서 <b>${firstSubtract.toLocaleString()}원</b> 차감</div>`);
    }
    if (lastMode === 'prorated' && (p.lastBase || 0) > 0) {
      lines.push(`<div>· 마지막 달: ${endTotal}일 중 <b>${endWorked}일</b> 일할 → <b>${Math.round(proratedLast).toLocaleString()}원</b></div>`);
    } else if (lastMode === 'deduction' && lastSubtract > 0) {
      lines.push(`<div>· 마지막 달: 총합계에서 <b>${lastSubtract.toLocaleString()}원</b> 차감</div>`);
    }
  } else {
    lines.push('<div>· 급여지급액 총합계 기반 산출</div>');
  }
  lines.push(`<div>· 비일회성 과세별도 <b>${includedExtra.toLocaleString()}원</b> 급여지급액과 합산</div>`);
  lines.push('<div>· 임금총액 ÷ 12 = 예상 퇴직연금 납입액</div>');
  lines.push('<div>· 10원 단위 반올림 → 최종 퇴직연금 납입액</div>');
  if (prevPaid > 0) lines.push('<div style="color:#fbbf24">· 기 지급 납입액 차감 적용</div>');

  const finalWage = p.totalBase - firstSubtract + firstContrib - lastSubtract + lastContrib + includedExtra;
  const tw = Math.round(finalWage);
  const gross = Math.round(finalWage / 12);
  const rounded = Math.round(gross / 10) * 10;
  const net = rounded - prevPaid;

  return {
    totalWage: tw,
    grossSeverance: gross,
    roundedSeverance: rounded,
    netSeverance: net,
    firstContrib: Math.round(firstContrib),
    lastContrib: Math.round(lastContrib),
    proratedFirst: Math.round(proratedFirst),
    proratedLast: Math.round(proratedLast),
    startWorked, startTotal, endWorked, endTotal,
    includedExtra,
    description: lines.join('')
  };
}

export function formatWon(v: number): string {
  return v.toLocaleString() + '원';
}

export function computeSummary(employees: DcEmployee[]): { total: number; count: number } {
  let total = 0;
  employees.forEach(e => { total += e.severance || 0; });
  return { total, count: employees.length };
}

export function exportDcToExcel(employees: DcEmployee[], results: DcCalcResult[]): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const FONT = { name: '맑은 고딕', sz: 11 };
  const FONT_BOLD = { name: '맑은 고딕', sz: 11, bold: true };
  const FONT_HEAD = { name: '맑은 고딕', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
  const FONT_FINAL = { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'C00000' } };
  const FONT_BLK = { name: '맑은 고딕', sz: 12, bold: true };

  const FILL_HEAD = { patternType: 'solid', fgColor: { rgb: '1F4E78' } };
  const FILL_TOTAL = { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } };
  const FILL_BLOCK = { patternType: 'solid', fgColor: { rgb: 'D9E1F2' } };
  const FILL_SUB = { patternType: 'solid', fgColor: { rgb: 'F2F2F2' } };

  const BORDER_THIN = {
    top: { style: 'thin', color: { rgb: 'BFBFBF' } },
    bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
    left: { style: 'thin', color: { rgb: 'BFBFBF' } },
    right: { style: 'thin', color: { rgb: 'BFBFBF' } },
  };
  const BORDER_TOTAL = {
    top: { style: 'medium', color: { rgb: '000000' } },
    bottom: { style: 'medium', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: 'BFBFBF' } },
    right: { style: 'thin', color: { rgb: 'BFBFBF' } },
  };

  const ALIGN_C = { horizontal: 'center', vertical: 'center' };
  const ALIGN_L = { horizontal: 'left', vertical: 'center' };
  const ALIGN_R = { horizontal: 'right', vertical: 'center' };
  const MONEY_FMT = '#,##0"원";[Red]-#,##0"원";"-"';

  const cell = (v: any, opts: any = {}) => {
    const c: any = { v };
    if (typeof v === 'number') c.t = 'n';
    else if (typeof v === 'string' && v.startsWith('=')) { c.t = 'n'; c.f = v.slice(1); delete c.v; }
    else c.t = 's';
    c.s = {
      font: opts.font || FONT,
      alignment: opts.align || ALIGN_L,
      border: opts.border || BORDER_THIN,
      ...(opts.fill ? { fill: opts.fill } : {}),
      ...(opts.fmt ? { numFmt: opts.fmt } : {}),
    };
    return c;
  };

  const setCell = (ws: any, addr: string, c: any) => { ws[addr] = c; };
  const colLetter = (n: number) => XLSX.utils.encode_col(n);

  // Sheet 1: 요약
  const ws1: any = {};
  const headers = ['No', '성명', '사번', '생년월일', '부서', '임금총액', '예상 납입액', '기지급 차감', '최종 납입액', '비고'];
  headers.forEach((h, i) => {
    setCell(ws1, `${colLetter(i)}1`, cell(h, { font: FONT_HEAD, fill: FILL_HEAD, align: ALIGN_C, border: BORDER_THIN }));
  });

  const FONT_NOTE = { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'C00000' } };
  employees.forEach((p, i) => {
    const r = i + 2;
    const res = results[i];
    const note = p.separateFunding ? '교비로 선 지출 후 입금 예정' : '';
    setCell(ws1, `A${r}`, cell(i + 1, { align: ALIGN_C }));
    setCell(ws1, `B${r}`, cell(p.empName || '', { align: ALIGN_C }));
    setCell(ws1, `C${r}`, cell(p.empId || '', { align: ALIGN_C }));
    setCell(ws1, `D${r}`, cell(p.birthDate || '', { align: ALIGN_C }));
    setCell(ws1, `E${r}`, cell(p.department || '', { align: ALIGN_C }));
    setCell(ws1, `F${r}`, cell(res?.totalWage || 0, { align: ALIGN_R, fmt: MONEY_FMT }));
    setCell(ws1, `G${r}`, cell(res?.grossSeverance || 0, { align: ALIGN_R, fmt: MONEY_FMT }));
    setCell(ws1, `H${r}`, cell(p.prevPaid || 0, { align: ALIGN_R, fmt: MONEY_FMT }));
    setCell(ws1, `I${r}`, cell(res?.netSeverance || 0, { font: FONT_FINAL, align: ALIGN_R, fmt: MONEY_FMT }));
    setCell(ws1, `J${r}`, cell(note, { font: p.separateFunding ? FONT_NOTE : FONT, align: ALIGN_C }));
  });

  const totalRow = employees.length + 2;
  const lastDataRow = employees.length + 1;
  setCell(ws1, `A${totalRow}`, cell('합계', { font: FONT_BOLD, fill: FILL_TOTAL, align: ALIGN_C, border: BORDER_TOTAL }));
  setCell(ws1, `B${totalRow}`, cell('', { font: FONT_BOLD, fill: FILL_TOTAL, border: BORDER_TOTAL }));
  setCell(ws1, `C${totalRow}`, cell('', { font: FONT_BOLD, fill: FILL_TOTAL, border: BORDER_TOTAL }));
  setCell(ws1, `D${totalRow}`, cell('', { font: FONT_BOLD, fill: FILL_TOTAL, border: BORDER_TOTAL }));
  setCell(ws1, `E${totalRow}`, cell('', { font: FONT_BOLD, fill: FILL_TOTAL, border: BORDER_TOTAL }));
  ['F', 'G', 'H', 'I'].forEach(col => {
    setCell(ws1, `${col}${totalRow}`, cell(`=SUM(${col}2:${col}${lastDataRow})`, {
      font: FONT_BOLD, fill: FILL_TOTAL, align: ALIGN_R, fmt: MONEY_FMT, border: BORDER_TOTAL
    }));
  });
  setCell(ws1, `J${totalRow}`, cell('', { font: FONT_BOLD, fill: FILL_TOTAL, border: BORDER_TOTAL }));

  ws1['!merges'] = [{ s: { r: totalRow - 1, c: 0 }, e: { r: totalRow - 1, c: 4 } }];
  ws1['!ref'] = `A1:J${totalRow}`;
  ws1['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 28 }];
  ws1['!rows'] = [{ hpt: 28 }];
  XLSX.utils.book_append_sheet(wb, ws1, '요약');

  // Sheet 2: 상세 내역
  const ws2: any = {};
  let row = 1;

  const writeRow = (cells: any[]) => {
    cells.forEach((c, i) => { if (c) setCell(ws2, `${colLetter(i)}${row}`, c); });
    row++;
  };
  const blankRow = () => { row++; };

  employees.forEach((p, i) => {
    const res = results[i];
    if (!res) return;
    const firstMode = p.firstMode || 'prorated';
    const lastMode = p.lastMode || 'prorated';

    // 블록 헤더
    const blockTitle = `No.${i + 1} — ${p.empName || '(미입력)'} (${p.empId || '-'})`;
    setCell(ws2, `A${row}`, cell(blockTitle, { font: FONT_BLK, fill: FILL_BLOCK, align: ALIGN_L }));
    setCell(ws2, `B${row}`, cell('', { fill: FILL_BLOCK }));
    setCell(ws2, `C${row}`, cell('', { fill: FILL_BLOCK }));
    setCell(ws2, `D${row}`, cell('', { fill: FILL_BLOCK }));
    if (!ws2['!merges']) ws2['!merges'] = [];
    ws2['!merges'].push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: 3 } });
    row++;

    // 1. 기본 정보
    setCell(ws2, `A${row}`, cell('1. 기본 정보', { font: FONT_BOLD, fill: FILL_SUB, align: ALIGN_L })); row++;
    writeRow([cell('  • 소속 부서', { align: ALIGN_L }), cell(p.department || '-', { align: ALIGN_L })]);
    writeRow([cell('  • 인건비 재원', { align: ALIGN_L }), cell(p.separateFunding ? '별도 재원' : '일반 재원', { align: ALIGN_L })]);
    writeRow([cell('  • 입사일', { align: ALIGN_L }), cell(p.startDate || '-', { align: ALIGN_L })]);
    writeRow([cell('  • 퇴직일/기산일자', { align: ALIGN_L }), cell(p.endDate || '-', { align: ALIGN_L })]);
    blankRow();

    // 2. 임금총액 산출 내역
    setCell(ws2, `A${row}`, cell('2. 임금총액 산출 내역', { font: FONT_BOLD, fill: FILL_SUB, align: ALIGN_L })); row++;
    const sumStart = row;
    writeRow([cell('  • 1년치 급여지급액 총합계', { align: ALIGN_L }), cell(p.totalBase || 0, { align: ALIGN_R, fmt: MONEY_FMT })]);

    if (firstMode === 'prorated') {
      if ((p.firstBase || 0) > 0) {
        writeRow([cell('  • 첫 달 월급여 제외', { align: ALIGN_L }), cell(-(p.firstBase), { align: ALIGN_R, fmt: MONEY_FMT }), cell(`${(p.firstBase).toLocaleString()}원 전액 제거`, { align: ALIGN_L })]);
        writeRow([cell('  • 첫 달 일할 반영', { align: ALIGN_L }), cell(res.proratedFirst, { align: ALIGN_R, fmt: MONEY_FMT }), cell(`${res.startTotal}일 중 ${res.startWorked}일 근무`, { align: ALIGN_L })]);
      }
    } else if ((p.firstDeduction || 0) > 0) {
      writeRow([cell('  • 첫 달 차감 (직접 입력)', { align: ALIGN_L }), cell(-(p.firstDeduction), { align: ALIGN_R, fmt: MONEY_FMT })]);
    }

    if (lastMode === 'prorated') {
      if ((p.lastBase || 0) > 0) {
        writeRow([cell('  • 마지막 달 월급여 제외', { align: ALIGN_L }), cell(-(p.lastBase), { align: ALIGN_R, fmt: MONEY_FMT }), cell(`${(p.lastBase).toLocaleString()}원 전액 제거`, { align: ALIGN_L })]);
        writeRow([cell('  • 마지막 달 일할 반영', { align: ALIGN_L }), cell(res.proratedLast, { align: ALIGN_R, fmt: MONEY_FMT }), cell(`${res.endTotal}일 중 ${res.endWorked}일 근무`, { align: ALIGN_L })]);
      }
    } else if ((p.lastDeduction || 0) > 0) {
      writeRow([cell('  • 마지막 달 차감 (직접 입력)', { align: ALIGN_L }), cell(-(p.lastDeduction), { align: ALIGN_R, fmt: MONEY_FMT })]);
    }

    const nonRecurringSum = (p.extraPays || []).filter(e => e.included).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    writeRow([cell('  • 비일회성 별도지급액', { align: ALIGN_L }), cell(nonRecurringSum, { align: ALIGN_R, fmt: MONEY_FMT })]);

    const sumEnd = row - 1;
    const totalBorder = {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
      left: { style: 'thin', color: { rgb: 'BFBFBF' } },
      right: { style: 'thin', color: { rgb: 'BFBFBF' } },
    };
    setCell(ws2, `A${row}`, cell('  ▶ 임금총액 (A)', { font: FONT_BOLD, align: ALIGN_L, border: totalBorder }));
    setCell(ws2, `B${row}`, cell(`=SUM(B${sumStart}:B${sumEnd})`, { font: FONT_BOLD, align: ALIGN_R, fmt: MONEY_FMT, border: totalBorder }));
    row++;
    blankRow();

    // 3. 과세별도기지급액 항목
    setCell(ws2, `A${row}`, cell('3. 과세별도기지급액 항목', { font: FONT_BOLD, fill: FILL_SUB, align: ALIGN_L })); row++;
    if (p.extraPays && p.extraPays.length > 0) {
      const subHeaderFill = { patternType: 'solid', fgColor: { rgb: 'E7E6E6' } };
      setCell(ws2, `A${row}`, cell('  항목명', { font: FONT_BOLD, fill: subHeaderFill, align: ALIGN_C }));
      setCell(ws2, `B${row}`, cell('금액', { font: FONT_BOLD, fill: subHeaderFill, align: ALIGN_C }));
      setCell(ws2, `C${row}`, cell('구분', { font: FONT_BOLD, fill: subHeaderFill, align: ALIGN_C }));
      setCell(ws2, `D${row}`, cell('포함 여부', { font: FONT_BOLD, fill: subHeaderFill, align: ALIGN_C }));
      row++;
      p.extraPays.forEach(e => {
        writeRow([
          cell(`  ${e.label || '(항목명 없음)'}`, { align: ALIGN_L }),
          cell(Number(e.amount) || 0, { align: ALIGN_R, fmt: MONEY_FMT }),
          cell(e.included ? '비일회성' : '일회성', { align: ALIGN_C }),
          cell(e.included ? '✓ 포함' : '✗ 제외', { align: ALIGN_C }),
        ]);
      });
    } else {
      setCell(ws2, `A${row}`, cell('  해당 없음', { align: ALIGN_L })); row++;
    }
    blankRow();

    // 4. 산출 결과
    setCell(ws2, `A${row}`, cell('4. 산출 결과', { font: FONT_BOLD, fill: FILL_SUB, align: ALIGN_L })); row++;
    writeRow([cell('  • 예상 납입액 (A÷12)', { align: ALIGN_L }), cell(res.grossSeverance, { align: ALIGN_R, fmt: MONEY_FMT })]);
    if (res.roundedSeverance !== res.grossSeverance) {
      writeRow([cell('  • 10원 단위 반올림 조정', { align: ALIGN_L }), cell(res.roundedSeverance - res.grossSeverance, { align: ALIGN_R, fmt: MONEY_FMT })]);
    }
    writeRow([cell('  • 기지급 차감', { align: ALIGN_L }), cell(-(p.prevPaid || 0), { align: ALIGN_R, fmt: MONEY_FMT })]);

    const finalBorder = {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'medium', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: 'BFBFBF' } },
      right: { style: 'thin', color: { rgb: 'BFBFBF' } },
    };
    setCell(ws2, `A${row}`, cell('  ▶ 최종 납입액', { font: FONT_FINAL, fill: FILL_TOTAL, align: ALIGN_L, border: finalBorder }));
    setCell(ws2, `B${row}`, cell(res.netSeverance, { font: FONT_FINAL, fill: FILL_TOTAL, align: ALIGN_R, fmt: MONEY_FMT, border: finalBorder }));
    row++;
    blankRow(); blankRow();
  });

  ws2['!ref'] = `A1:D${row}`;
  ws2['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, '상세 내역');

  XLSX.writeFile(wb, `퇴직연금_DC_납입액_${dateStr}.xlsx`, { bookType: 'xlsx', cellStyles: true });
}