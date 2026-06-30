import { useCallback, useMemo, useState } from 'react';
import { Building2, Download, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { createDcEmployee, calcDcEmployee, exportDcToExcel, formatWon } from '../dcCalculator';
import { DcEmployee, DcCalcResult, ExtraPayItem } from '../types';

function formatNumberInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString() : '';
}

function parseNum(str: string): number {
  return parseInt((str || '').replace(/,/g, '')) || 0;
}

function EmployeeForm({ idx, emp, result, onChange }: {
  idx: number; emp: DcEmployee; result: DcCalcResult | null; onChange: (idx: number, e: DcEmployee) => void;
}) {
  const canDelete = false;

  const update = (field: Partial<DcEmployee>) => {
    onChange(idx, { ...emp, ...field });
  };

  const setFirstMode = (mode: 'prorated' | 'deduction') => {
    update({ firstMode: mode });
  };
  const setLastMode = (mode: 'prorated' | 'deduction') => {
    update({ lastMode: mode });
  };

  const addExtraPay = () => {
    update({ extraPays: [...emp.extraPays, { label: '', amount: 0, included: false }] });
  };
  const updateExtra = (ei: number, key: keyof ExtraPayItem, value: any) => {
    const items = [...emp.extraPays];
    items[ei] = { ...items[ei], [key]: value };
    update({ extraPays: items });
  };
  const removeExtra = (ei: number) => {
    update({ extraPays: emp.extraPays.filter((_, i) => i !== ei) });
  };

  const togglePrevPaid = () => {
    if (emp.prevPaid > 0) update({ prevPaid: 0 });
  };

  return (
    <div className="border-t-4 border-blue-100 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">{idx + 1}</span>
        <h2 className="text-xl font-bold text-slate-800">직원 {idx + 1}</h2>
        <span className="text-xs text-slate-400">DC 납입액 산출 정보 입력</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">

          {/* 1. 기본 정보 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-xs font-bold">1</span>
              기본 정보 및 기산일
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">성명</label>
                <input type="text" value={emp.empName} onChange={e => update({ empName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="홍길동" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">사번</label>
                <input type="text" value={emp.empId} onChange={e => update({ empId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">소속 부서</label>
                <input type="text" value={emp.department} onChange={e => update({ department: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="예: 총무팀" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">인건비 재원</label>
                <label className="flex items-center gap-2 h-[42px] px-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  <input type="checkbox" checked={emp.separateFunding} onChange={e => update({ separateFunding: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700">별도 재원</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">생년월일</label>
                <input type="date" value={emp.birthDate} onChange={e => update({ birthDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">입사일</label>
                <input type="date" value={emp.startDate} onChange={e => update({ startDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">퇴직일/기산일자</label>
                <input type="date" value={emp.endDate} onChange={e => update({ endDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" />
              </div>
            </div>
          </div>

          {/* 2. 급여지급액 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
              <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-xs font-bold">2</span>
              급여지급액
            </h3>
            <p className="text-xs text-slate-500 mb-5">명세서에 표기된 1년치 기본급여 총계와, 첫 달 / 마지막 달 지급액을 입력합니다.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">1년치 급여지급액 총합계 <span className="text-xs font-normal text-slate-400 ml-1">(원)</span></label>
                <div className="relative">
                  <input type="text" value={emp.totalBase ? emp.totalBase.toLocaleString() : ''}
                    onChange={e => update({ totalBase: parseNum(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold text-right focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8" placeholder="0" />
                  <span className="absolute right-3 top-3.5 text-slate-500 text-sm">원</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 mr-0.5">첫 달 지급액</span>
                    <button type="button" onClick={() => setFirstMode('prorated')}
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${emp.firstMode !== 'deduction' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>일할 계산</button>
                    <button type="button" onClick={() => setFirstMode('deduction')}
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${emp.firstMode === 'deduction' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>차감액 입력</button>
                  </div>
                  {emp.firstMode !== 'deduction' ? (
                    <div className="relative">
                      <input type="text" value={emp.firstBase ? emp.firstBase.toLocaleString() : ''}
                        onChange={e => update({ firstBase: parseNum(e.target.value) })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8" placeholder="0" />
                      <span className="absolute right-3 top-2.5 text-slate-500 text-sm">원</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" value={emp.firstDeduction ? emp.firstDeduction.toLocaleString() : ''}
                        onChange={e => update({ firstDeduction: parseNum(e.target.value) })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8" placeholder="0" />
                      <span className="absolute right-3 top-2.5 text-slate-500 text-sm">원</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 mr-0.5">마지막 달 지급액</span>
                    <button type="button" onClick={() => setLastMode('prorated')}
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${emp.lastMode !== 'deduction' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>일할 계산</button>
                    <button type="button" onClick={() => setLastMode('deduction')}
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${emp.lastMode === 'deduction' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>차감액 입력</button>
                  </div>
                  {emp.lastMode !== 'deduction' ? (
                    <div className="relative">
                      <input type="text" value={emp.lastBase ? emp.lastBase.toLocaleString() : ''}
                        onChange={e => update({ lastBase: parseNum(e.target.value) })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8" placeholder="0" />
                      <span className="absolute right-3 top-2.5 text-slate-500 text-sm">원</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" value={emp.lastDeduction ? emp.lastDeduction.toLocaleString() : ''}
                        onChange={e => update({ lastDeduction: parseNum(e.target.value) })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8" placeholder="0" />
                      <span className="absolute right-3 top-2.5 text-slate-500 text-sm">원</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 과세별도기지급액 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-xs font-bold">3</span>
                과세별도기지급액 관리
              </h3>
              <button onClick={addExtraPay} className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer">
                + 항목 추가
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">비일회성 수당(연차수당, 상여금 등)은 체크하여 급여지급액과 합산합니다.</p>
            {emp.extraPays.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">등록된 항목이 없습니다.</div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <div className="col-span-4">수당명</div>
                  <div className="col-span-3 text-right">금액</div>
                  <div className="col-span-4 text-center">비일회성 포함</div>
                  <div className="col-span-1"></div>
                </div>
                {emp.extraPays.map((item, ei) => (
                  <div key={ei} className="grid grid-cols-12 gap-2 px-4 py-2 items-center hover:bg-slate-100 transition">
                    <div className="col-span-4">
                      <input type="text" value={item.label} onChange={e => updateExtra(ei, 'label', e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0" placeholder="항목명" />
                    </div>
                    <div className="col-span-3">
                      <input type="text" value={item.amount ? item.amount.toLocaleString() : ''}
                        onChange={e => updateExtra(ei, 'amount', parseNum(e.target.value))}
                        className="w-full bg-transparent border-none text-sm font-medium text-indigo-600 text-right focus:ring-0 p-0" placeholder="0" />
                    </div>
                    <div className="col-span-4 text-center">
                      <input type="checkbox" checked={item.included} onChange={e => updateExtra(ei, 'included', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                    </div>
                    <div className="col-span-1 text-center">
                      <button onClick={() => removeExtra(ei)} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. 기지급 납입액 차감 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
              <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-xs font-bold">4</span>
              기 지급 납입액 차감
            </h3>
            <p className="text-xs text-slate-500 mb-4">기존에 이미 지급된 퇴직연금 납입액이 있는 경우 입력합니다.</p>
            {emp.prevPaid > 0 ? (
              <div className="relative">
                <input type="text" value={emp.prevPaid.toLocaleString()}
                  onChange={e => update({ prevPaid: parseNum(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8" placeholder="0" />
                <span className="absolute right-3 top-2.5 text-slate-500 text-sm">원</span>
                <button onClick={() => update({ prevPaid: 0 })} className="text-xs text-red-500 mt-1 cursor-pointer">초기화</button>
              </div>
            ) : (
              <button onClick={() => update({ prevPaid: 0 })} className="text-xs text-indigo-600 border border-indigo-300 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer"
                onFocus={() => {}}>
                입력
              </button>
            )}
          </div>

        </div>

        {/* 우측: 결과 패널 */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 rounded-2xl shadow-xl p-6 md:p-8 text-white" style={{ position: 'sticky', top: '100px' }}>
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center border-b border-slate-700 pb-4">
              <span className="w-6 h-6 rounded bg-indigo-500 text-white flex items-center justify-center mr-2 text-xs">결과</span>
              최종 산출 내역
            </h3>
            <div className="space-y-5 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">성명</span>
                <span className="font-medium">{emp.empName || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">사번</span>
                <span className="font-medium">{emp.empId || '-'}</span>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-slate-400 text-sm block mb-1">산출된 임금총액 (A)</span>
                <div className="text-3xl font-bold text-indigo-400 text-right">{result ? result.totalWage.toLocaleString() : '0'}</div>
                <div className="text-right text-xs text-slate-600 mt-0.5">원</div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-slate-400 text-sm block mb-1">예상 퇴직연금 납입액 (A ÷ 12)</span>
                <div className="text-4xl font-black text-white text-right tracking-tight">{result ? result.grossSeverance.toLocaleString() : '0'}</div>
                <div className="text-right text-xs text-slate-600 mt-0.5">원</div>
              </div>
              {(emp.prevPaid || 0) > 0 && (
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-400">기 지급 납입액 차감</span>
                  <span className="text-red-400 font-semibold">-{emp.prevPaid.toLocaleString()}원</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-slate-400 text-sm block mb-1">최종 퇴직연금 납입액 <span className="text-xs text-slate-500">(10원 단위 반올림)</span></span>
                <div className="text-4xl font-black text-emerald-400 text-right tracking-tight">{result ? result.netSeverance.toLocaleString() : '0'}</div>
                <div className="text-right text-xs text-slate-600 mt-0.5">원</div>
              </div>
            </div>
            {result && (
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h4 className="text-sm font-bold text-slate-300 mb-2">산출 방법</h4>
                <div className="text-xs text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: result.description }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DcCalculatorPage() {
  const [employees, setEmployees] = useState<DcEmployee[]>(() => [createDcEmployee()]);

  const results = useMemo(() => {
    return employees.map(e => calcDcEmployee(e));
  }, [employees]);

  const updateEmployee = useCallback((idx: number, emp: DcEmployee) => {
    setEmployees(prev => {
      const next = [...prev];
      next[idx] = emp;
      return next;
    });
  }, []);

  const addEmployee = () => {
    setEmployees(prev => [...prev, createDcEmployee()]);
  };

  const removeEmployee = (idx: number) => {
    if (employees.length <= 1) return;
    setEmployees(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExport = () => {
    exportDcToExcel(employees, results);
  };

  const summaryTotal = useMemo(() => {
    return employees.reduce((sum, e, i) => sum + (results[i]?.netSeverance || 0), 0);
  }, [employees, results]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 페이지 헤더 */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">퇴직연금 DC형 납입액 계산기</h1>
            <p className="text-slate-500 text-sm">개인별과세소득액내역 기반 산출</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm cursor-pointer">
            <Download className="w-4 h-4" />
            엑셀 추출
          </button>
        </div>
      </div>

      {/* 전체 요약 패널 */}
      <div className="bg-white rounded-2xl shadow-xs border border-emerald-200 p-6 mb-10 sticky top-4 z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">합</span>
          <h2 className="text-lg font-bold text-slate-800">퇴직연금 납입액 합계 요약</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="text-left pb-2 pr-4 w-10">No.</th>
                <th className="text-left pb-2 pr-4">성명</th>
                <th className="text-left pb-2 pr-4">사번</th>
                <th className="text-right pb-2">퇴직연금 납입액</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={4} className="py-3 text-center text-slate-400 text-xs">입력된 정보가 없습니다.</td></tr>
              ) : (
                employees.map((emp, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-emerald-50 transition">
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">{i + 1}</td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-800">{emp.empName || <span className="text-slate-300">미입력</span>}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{emp.empId || <span className="text-slate-300">-</span>}</td>
                    <td className="py-2.5 text-right font-bold text-indigo-600">{(results[i]?.netSeverance || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300">
                <td colSpan={3} className="pt-3 font-bold text-slate-700 text-sm">합계</td>
                <td className="pt-3 text-right text-xl font-black text-emerald-600">{summaryTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 직원 폼 목록 */}
      <div className="space-y-12">
        {employees.map((emp, i) => (
          <div key={i} className="relative">
            {employees.length > 1 && (
              <button onClick={() => removeEmployee(i)}
                className="absolute top-0 right-0 text-xs text-red-500 border border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-semibold z-10 cursor-pointer">
                <X className="w-3 h-3 inline mr-1" />삭제
              </button>
            )}
            <EmployeeForm idx={i} emp={emp} result={results[i]} onChange={updateEmployee} />
          </div>
        ))}
      </div>

      {/* 직원 추가 버튼 */}
      <div className="mt-10 text-center">
        <button onClick={addEmployee}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition shadow-md text-base cursor-pointer inline-flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          직원 추가
        </button>
        <span className="block text-xs text-slate-400 mt-2">현재 <span className="font-bold text-slate-600">{employees.length}</span>명 입력됨</span>
      </div>
    </div>
  );
}