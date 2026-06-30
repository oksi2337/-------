import { Calendar, FileSpreadsheet, HelpCircle, Plus, Settings, ShieldCheck } from 'lucide-react';
import { CalculationConfig } from '../types';

interface HeaderProps {
  config: CalculationConfig;
  onUpdateConfig: (newConfig: Partial<CalculationConfig>) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenGuideModal: () => void;
  targetCount: number;
}

export function Header({
  config,
  onUpdateConfig,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenGuideModal,
  targetCount
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* 타이틀 영역 */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-nowrap min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap leading-tight">
                퇴직연금 가입자 관리 및 당월 부담금 산출
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              별도회계기관 자동 감지
            </p>
          </div>
        </div>

        {/* 오른쪽 액션 바 */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* 산출 기준 월 컨트롤러 */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-medium text-slate-600 hidden sm:inline">산출 기준월:</span>
            <input
              type="month"
              value={config.referenceMonth}
              onChange={(e) => onUpdateConfig({ referenceMonth: e.target.value })}
              className="text-xs font-bold text-indigo-900 bg-transparent focus:outline-hidden cursor-pointer border-none p-0"
            />
          </div>

          {/* MVP 기획 QA 안내 버튼 */}
          <button
            onClick={onOpenGuideModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            title="기획 질문 5가지에 대한 MVP 구현 솔루션 보기"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">MVP 기획 답변서</span>
          </button>

          {/* 정책 설정 버튼 */}
          <button
            onClick={onOpenSettingsModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            title="마스킹 규칙 및 입사월 대조 기준 설정"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">정책 설정</span>
          </button>

          {/* 가입자 신규 등록 버튼 */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all cursor-pointer shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>가입자 등록</span>
          </button>

        </div>

      </div>

      {/* 활성 정책 배지 알림 바 */}
      <div className="max-w-7xl mx-auto mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            성+끝자리 이름 / 앞2+끝2 교번 입력
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {config.comparisonCriteria === 'MONTH_ONLY' ? '매년 도래하는 월(Month) 기준 대상 표기' : '특정 연월(Year-Month) 정확히 일치 시 대상'}
          </span>
        </div>
        <div>
          <span className="text-indigo-600 font-semibold">{config.referenceMonth}</span> 월 기준 총 <span className="font-bold text-slate-900">{targetCount}명</span>의 부담금이 산출되었습니다.
        </div>
      </div>
    </header>
  );
}
