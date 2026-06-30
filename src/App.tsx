import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AddSubscriberModal } from './components/AddSubscriberModal';
import DcCalculatorPage from './components/DcCalculator';
import { Header } from './components/Header';
import { MvpGuideModal } from './components/MvpGuideModal';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { SubscriberTable } from './components/SubscriberTable';
import { SummaryCards } from './components/SummaryCards';
import { INITIAL_SEPARATE_DEPTS, INITIAL_SUBSCRIBERS } from './data';
import { CalculationConfig, Subscriber, SummaryStats } from './types';
import { calculateContribution, downloadSubscriberTemplateXlsx, exportContributionTemplateXlsx, isTargetMonth, normalizeJoinDate, parseXlsxToSubscribers } from './utils';

const STORAGE_KEY_SUBS = 'PENSION_MVP_SUBSCRIBERS_V1';
const STORAGE_KEY_CONFIG = 'PENSION_MVP_CONFIG_V1';
const STORAGE_CLEAR_FLAG = 'PENSION_MVP_CLEARED_V2';

// 이전 버전 로컬스토리지 데이터 일괄 삭제 (최초 1회)
if (!localStorage.getItem(STORAGE_CLEAR_FLAG)) {
  localStorage.removeItem(STORAGE_KEY_SUBS);
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  localStorage.setItem(STORAGE_CLEAR_FLAG, 'true');
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'SUBSCRIBER' | 'DC'>('SUBSCRIBER');

  // 1. 초기 연월 설정 (예: 2026-06)
  const defaultMonth = new Date().toISOString().slice(0, 7);

  // 2. 가입자 목록 상태 (로컬 스토리지 연동)
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBS);
      if (saved) return JSON.parse(saved).map((sub: Subscriber) => ({
        ...sub,
        birthDate: sub.birthDate || '',
        joinDate: normalizeJoinDate(sub.joinDate)
      }));
    } catch (e) {
      console.error('Failed to load subscribers from storage', e);
    }
    return INITIAL_SUBSCRIBERS;
  });

  // 3. 산출 및 정책 설정 상태
  const [config, setConfig] = useState<CalculationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load config', e);
    }
    return {
      referenceMonth: defaultMonth,
      maskingMode: 'AUTO',
      comparisonCriteria: 'MONTH_ONLY',
      contributionRatePercent: 100, // 월급여 상당액 100%
      separateAccountDepartments: INITIAL_SEPARATE_DEPTS
    };
  });

  // 모달 상태 (사용자 질문에 대한 답변서를 첫 로드 시 바로 보여주기 위해 Guide 기본 오픈)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // 로컬 스토리지 자동 저장 효과
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(subscribers));
    } catch (e) {
      console.error('Storage quota exceeded', e);
    }
  }, [subscribers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Config save error', e);
    }
  }, [config]);

  // 가입자 부담금 실시간 자동 재계산 및 요약 통계 산출
  const computedSubscribers = useMemo(() => {
    return subscribers.map(sub => {
      const amount = calculateContribution(sub.baseSalary, config.contributionRatePercent);
      return {
        ...sub,
        contributionAmount: amount
      };
    });
  }, [subscribers, config.contributionRatePercent]);

  const stats = useMemo<SummaryStats>(() => {
    let targetCount = 0;
    let totalContribution = 0;
    let generalContribution = 0;
    let separateContribution = 0;
    let generalCount = 0;
    let separateCount = 0;

    computedSubscribers.forEach(s => {
      if (s.isSeparateAccount) separateCount++;
      else generalCount++;

      const isTarget = isTargetMonth(s.joinDate, config.referenceMonth, config.comparisonCriteria);
      if (isTarget) {
        targetCount++;
        totalContribution += s.contributionAmount;
        if (s.isSeparateAccount) separateContribution += s.contributionAmount;
        else generalContribution += s.contributionAmount;
      }
    });

    return {
      totalCount: computedSubscribers.length,
      targetCount,
      totalContribution,
      generalContribution,
      separateContribution,
      generalCount,
      separateCount
    };
  }, [computedSubscribers, config.referenceMonth, config.comparisonCriteria]);

  // 핸들러 모음
  const handleUpdateConfig = (newCfg: Partial<CalculationConfig>) => {
    setConfig(prev => ({ ...prev, ...newCfg }));
  };

  const handleAddSubscriber = (newSub: Subscriber) => {
    setSubscribers(prev => [newSub, ...prev]);
  };

  const handleAddBatchSubscribers = (batch: Partial<Subscriber>[]) => {
    const validBatch = batch.map((item, idx) => ({
      id: item.id || `sub_batch_${Date.now()}_${idx}`,
      rawName: item.rawName || '',
      maskedName: item.maskedName || '*가입자',
      rawIdNumber: item.rawIdNumber || '000000',
      maskedIdNumber: item.maskedIdNumber || '00**00',
      birthDate: item.birthDate || '',
      department: item.department || '일반부서',
      joinDate: normalizeJoinDate(item.joinDate || `${config.referenceMonth}-01`),
      isSeparateAccount: Boolean(item.isSeparateAccount),
      baseSalary: item.baseSalary || 3500000,
      contributionAmount: item.contributionAmount || 3500000,
      memo: item.memo || ''
    })) as Subscriber[];

    setSubscribers(prev => [...validBatch, ...prev]);
  };

  const handleDeleteSubscriber = (id: string) => {
    if (confirm('해당 가입자 정보를 리스트에서 삭제하시겠습니까?')) {
      setSubscribers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleSeparateAccount = (id: string) => {
    setSubscribers(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isSeparateAccount: !s.isSeparateAccount };
      }
      return s;
    }));
  };

  const handleDownloadExcelTemplate = () => {
    exportContributionTemplateXlsx(config.referenceMonth);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = useCallback(() => {
    downloadSubscriberTemplateXlsx();
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as ArrayBuffer;
      const parsed = parseXlsxToSubscribers(data, config.separateAccountDepartments);
      if (parsed.length === 0) {
        alert('유효한 데이터가 없습니다. 엑셀 양식을 확인해주세요.');
        return;
      }
      handleAddBatchSubscribers(parsed);
      alert(`${parsed.length}명의 가입자를 등록했습니다.`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [config.separateAccountDepartments]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 pb-16">

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-slate-200 px-6 py-0 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex gap-1">
          <button
            onClick={() => setActiveTab('SUBSCRIBER')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'SUBSCRIBER'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            가입자 관리 및 당월 부담금 산출
          </button>
          <button
            onClick={() => setActiveTab('DC')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DC'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            DC형 납입액 계산기
          </button>
        </div>
      </div>

      {activeTab === 'SUBSCRIBER' ? (
        <>

      {/* 상단 컨트롤 헤더 */}
      <Header
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        targetCount={stats.targetCount}
      />

      {/* 메인 콘텐츠 바디 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-6">
        
        {/* 상단 통계 요약 카드 영역 */}
        <SummaryCards
          stats={stats}
          referenceMonth={config.referenceMonth}
          onDownloadTemplate={handleDownloadExcelTemplate}
        />

        {/* 하단 가입자 목록 표 영역 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">가입자 명부 및 부담금 산출 대장</h2>
              <p className="text-xs text-slate-500">
                산출 기준월(<strong className="text-indigo-600">{config.referenceMonth}</strong>)에 도래한 납입 대상자는 파란색으로 하이라이트됩니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" />
                </svg>
                엑셀 양식 다운로드
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              <button
                onClick={handleUploadClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5-5 5 5M12 4v12" />
                </svg>
                엑셀 업로드
              </button>
            </div>
          </div>

          <SubscriberTable
            subscribers={computedSubscribers}
            onDeleteSubscriber={handleDeleteSubscriber}
            onToggleSeparateAccount={handleToggleSeparateAccount}
            referenceMonth={config.referenceMonth}
            comparisonCriteria={config.comparisonCriteria}
          />
        </div>

      </main>

      {/* 모달 그룹 */}
      <AddSubscriberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSubscriber={handleAddSubscriber}
        onAddBatchSubscribers={handleAddBatchSubscribers}
        maskingMode={config.maskingMode}
        separateKeywords={config.separateAccountDepartments}
      />

      <PolicyConfigModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />

      <MvpGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onConfirmComplete={() => {
          // 확인 완료 시 배지나 알림을 줄 수 있음
        }}
      />

        </>
      ) : (
        <DcCalculatorPage />
      )}

    </div>
  );
}
