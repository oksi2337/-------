import { Check, Info, Lock, RefreshCw, Settings2, X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { CalculationConfig } from '../types';

interface PolicyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CalculationConfig;
  onUpdateConfig: (newConfig: Partial<CalculationConfig>) => void;
}

export function PolicyConfigModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}: PolicyConfigModalProps) {
  const [keywordInput, setKeywordInput] = useState('');

  if (!isOpen) return null;

  const handleAddKeyword = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!config.separateAccountDepartments.includes(keywordInput.trim())) {
        onUpdateConfig({
          separateAccountDepartments: [...config.separateAccountDepartments, keywordInput.trim()]
        });
      }
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    onUpdateConfig({
      separateAccountDepartments: config.separateAccountDepartments.filter(k => k !== kw)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">MVP 시스템 정책 및 기준 설정</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Q1: 개인정보 입력 방식 설정 */}
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>1. 개인정보 입력 방식 (일부 정보만 입력)</span>
              </label>
              <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded font-semibold">
                동명이인 식별: 교번 앞/끝자리 대조
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              신규 등록 시 <strong>이름은 성+끝자리(2자)</strong>, <strong>교번은 앞2자+끝2자(4자)</strong>만 입력하면
              홍*동, 24**56 형태로 저장됩니다. 전체 정보를 입력하지 않고 일부만 입력해도 됩니다.
            </p>
          </div>

          {/* Q2: 입사월 비교 기준 설정 */}
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <label className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>2. 입사월과 당월 비교 기준</span>
            </label>
            <p className="text-slate-500 text-[11px]">
              "입사월이 지금 월과 동일한 경우 부담금 납입자 표기"에서 비교할 연월 기준을 선택합니다.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onUpdateConfig({ comparisonCriteria: 'MONTH_ONLY' })}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  config.comparisonCriteria === 'MONTH_ONLY'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>매년 월(Month) 자체 일치</span>
                  {config.comparisonCriteria === 'MONTH_ONLY' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal">연도와 무관하게 매년 6월 입사자 모두를 매년 6월 당월 부담금 납입 대상으로 표기합니다.</p>
              </button>

              <button
                onClick={() => onUpdateConfig({ comparisonCriteria: 'YEAR_MONTH' })}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  config.comparisonCriteria === 'YEAR_MONTH'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>연도+월(Year-Month) 정확 일치</span>
                  {config.comparisonCriteria === 'YEAR_MONTH' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal">예: 2026년 6월 신규 입사자만 딱 2026년 6월에 당월 신규 납입자로 표기합니다.</p>
              </button>
            </div>
          </div>

          {/* Q3: 별도회계기관 매핑 부서 관리 */}
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <label className="font-bold text-slate-900 text-sm block">
              3. 소속부서별 '별도회계기관 여부' 자동 감지 키워드
            </label>
            <p className="text-slate-500 text-[11px]">
              아래 등록된 키워드가 부서명에 포함되어 있으면 등록 시 자동으로 별도회계기관으로 매핑됩니다. (엔터키로 추가)
            </p>
            
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-12 items-center">
              {config.separateAccountDepartments.map(kw => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-semibold text-xs border border-amber-200 shadow-2xs"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ 키워드 입력 후 엔터..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                className="bg-transparent border-none text-xs focus:outline-hidden p-1 min-w-32 text-slate-800"
              />
            </div>
          </div>

          {/* Q4 & Q5 운영환경 및 데이터 관리방식 요약 */}
          <div className="bg-slate-100 p-4 rounded-xl space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>4번 & 5번 항목 구현 환경 안내</span>
            </div>
            <p>
              • <strong>운영 환경(옵션 B):</strong> 별도 PC 설치 없이 웹 브라우저에서 즉시 실행되는 MVP 웹 애플리케이션으로 동작합니다.
            </p>
            <p>
              • <strong>저장 방식(옵션 A 겸용):</strong> 브라우저 로컬 스토리지에 자동 저장되며, 언제든 상단의 '엑셀(CSV) 저장' 버튼으로 PC에 파일 다운로드 및 백업이 가능합니다.
            </p>
          </div>

        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            설정 저장 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
