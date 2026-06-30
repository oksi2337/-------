import { Building2, Coins, Download, Users, UserCheck } from 'lucide-react';
import { SummaryStats } from '../types';
import { formatKRW } from '../utils';

interface SummaryCardsProps {
  stats: SummaryStats;
  referenceMonth: string;
  onDownloadTemplate: () => void;
}

export function SummaryCards({ stats, referenceMonth, onDownloadTemplate }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 카드 1: 전체 등록 가입자 */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">전체 퇴직연금 가입자</span>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalCount}명</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>일반회계 {stats.generalCount}명</span>
            <span className="text-slate-300">/</span>
            <span>별도회계 {stats.separateCount}명</span>
          </div>
        </div>
      </div>

      {/* 카드 2: 당월 부담금 납입 대상자 */}
      <div className="bg-indigo-900 rounded-xl p-5 border border-indigo-800 shadow-md shadow-indigo-100 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-indigo-800/40 pointer-events-none" />
        <div className="flex items-center justify-between gap-3 text-indigo-200 mb-3 relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
            {referenceMonth.split('-')[1]}월 납입 대상자
          </span>
          <div className="w-9 h-9 rounded-lg bg-indigo-800 flex items-center justify-center text-indigo-100 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-3xl font-extrabold tracking-tight text-white">{stats.targetCount}명</div>
          <div className="mt-1 text-xs text-indigo-200 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>입사월이 당월 기준과 일치하는 인원</span>
          </div>
        </div>
      </div>

      {/* 카드 3: 당월 총 산출 부담금 */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between gap-3 text-slate-500 mb-3">
          <div className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">당월 총 산출 부담금</span>
            <button
              onClick={onDownloadTemplate}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              title="당월 납입 부담금 입력용 빈 엑셀 양식 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 양식</span>
            </button>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {formatKRW(stats.totalContribution)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>대상자 기준급여 100% 합계액</span>
          </div>
        </div>
      </div>

      {/* 카드 4: 기관별 회계 부담금 분리 */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">회계 기관별 분리 산출액</span>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">일반회계 기관:</span>
            <span className="font-bold text-slate-800">{formatKRW(stats.generalContribution)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">별도회계 기관:</span>
            <span className="font-bold text-amber-800">{formatKRW(stats.separateContribution)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
