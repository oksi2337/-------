import { AlertCircle, Building2, CheckCircle2, Filter, Search, Trash2, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ComparisonCriteria, Subscriber } from '../types';
import { formatKRW, isTargetMonth } from '../utils';

interface SubscriberTableProps {
  subscribers: Subscriber[];
  onDeleteSubscriber: (id: string) => void;
  onToggleSeparateAccount: (id: string) => void;
  referenceMonth: string;
  comparisonCriteria: ComparisonCriteria;
}

export function SubscriberTable({
  subscribers,
  onDeleteSubscriber,
  onToggleSeparateAccount,
  referenceMonth,
  comparisonCriteria
}: SubscriberTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TARGET' | 'SEPARATE' | 'GENERAL'>('ALL');

  const filtered = useMemo(() => {
    return subscribers.filter(s => {
      // 1. 검색어 필터
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || 
        s.maskedName.toLowerCase().includes(term) ||
        (s.rawName && s.rawName.toLowerCase().includes(term)) ||
        s.maskedIdNumber.includes(term) ||
        s.rawIdNumber.includes(term) ||
        (s.birthDate && s.birthDate.includes(term)) ||
        s.department.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // 2. 카테고리 필터
      const isTarget = isTargetMonth(s.joinDate, referenceMonth, comparisonCriteria);
      if (filterType === 'TARGET') return isTarget;
      if (filterType === 'SEPARATE') return s.isSeparateAccount;
      if (filterType === 'GENERAL') return !s.isSeparateAccount;

      return true;
    });
  }, [subscribers, searchTerm, filterType, referenceMonth, comparisonCriteria]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* 테이블 상단 툴바 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* 검색창 */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="이름(홍*동), 교번(24**), 부서명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1 hidden sm:inline" />
          {[
            { id: 'ALL', label: '전체 보기' },
            { id: 'TARGET', label: '당월 납입대상만' },
            { id: 'SEPARATE', label: '별도회계만' },
            { id: 'GENERAL', label: '일반회계만' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider border-b border-slate-200 font-semibold">
              <th className="py-3.5 px-4 w-28 whitespace-nowrap">마스킹 이름</th>
              <th className="py-3.5 px-4 w-28 whitespace-nowrap">마스킹 교번</th>
              <th className="py-3.5 px-4 w-32 whitespace-nowrap">생년월일</th>
              <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">입사일</th>
              <th className="py-3.5 px-4 w-36 whitespace-nowrap">소속부서</th>
              <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">회계기관 분류</th>
              <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">당월 납입대상</th>
              <th className="py-3.5 px-4 w-44 whitespace-nowrap">비고</th>
              <th className="py-3.5 px-4 w-20 text-center whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserX className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-500">조회된 가입자가 없습니다.</p>
                    <p className="text-xs text-slate-400">검색 조건을 변경하거나 상단의 '가입자 등록' 버튼을 눌러 추가하세요.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const isTarget = isTargetMonth(s.joinDate, referenceMonth, comparisonCriteria);
                
                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isTarget
                        ? 'bg-indigo-50/60 hover:bg-indigo-100/60 font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* 마스킹 이름 (호버 시 원본 이름 툴팁 혹은 작은 글씨 표기 가능) */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{s.maskedName}</span>
                        {/* 동명이인 구분을 위한 원본 툴팁 아이콘 */}
                        <span className="text-[10px] text-slate-400 font-normal" title={`원본 이름: ${s.rawName}`}>
                          ({s.rawName[0]}*)
                        </span>
                      </div>
                    </td>

                    {/* 마스킹 교번 */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {s.maskedIdNumber}
                    </td>

                    {/* 생년월일 */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {s.birthDate || '-'}
                    </td>

                    {/* 입사일 */}
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {s.joinDate}
                    </td>

                    {/* 소속부서 */}
                    <td className="py-3 px-4 text-slate-800">
                      {s.department}
                    </td>

                    {/* 회계기관 분류 (클릭 시 토글 가능하게 MVP 제공) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleSeparateAccount(s.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-transform active:scale-95 cursor-pointer border ${
                          s.isSeparateAccount
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="클릭 시 일반회계 ↔ 별도회계기관 여부를 변경합니다."
                      >
                        <Building2 className="w-3 h-3" />
                        <span>{s.isSeparateAccount ? '별도회계기관' : '일반회계'}</span>
                      </button>
                    </td>

                    {/* 당월 납입대상 여부 */}
                    <td className="py-3 px-4 text-center">
                      {isTarget ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs animate-pulse">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>납입대상</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">해당없음</span>
                      )}
                    </td>

                    {/* 비고 */}
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={s.memo}>
                      {s.memo || '-'}
                    </td>

                    {/* 관리 액션 */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteSubscriber(s.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="가입자 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 테이블 하단 요약 정보 */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>동명이인 식별 기준: 마스킹된 이름이 같을 경우 고유 교번(앞/끝 자리)으로 개인을 특정합니다.</span>
        </div>
        <div>
          조회 건수: <strong className="text-slate-800">{filtered.length}건</strong>
        </div>
      </div>

    </div>
  );
}
