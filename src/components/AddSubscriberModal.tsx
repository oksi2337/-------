import { Building2, Check, FileSpreadsheet, Plus, ShieldAlert, Sparkles, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { SAMPLE_CSV_TEMPLATE } from '../data';
import { MaskingInputMode, Subscriber } from '../types';
import { autoMaskIdNumber, autoMaskName, detectSeparateAccount, normalizeJoinDate, parseCSVToSubscribers } from '../utils';

interface AddSubscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubscriber: (sub: Subscriber) => void;
  onAddBatchSubscribers: (subs: Partial<Subscriber>[]) => void;
  maskingMode: MaskingInputMode;
  separateKeywords: string[];
}

export function AddSubscriberModal({
  isOpen,
  onClose,
  onAddSubscriber,
  onAddBatchSubscribers,
  maskingMode,
  separateKeywords
}: AddSubscriberModalProps) {
  const [tab, setTab] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Single Add States
  const [rawName, setRawName] = useState('');
  const [rawIdNumber, setRawIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [department, setDepartment] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSeparateAccount, setIsSeparateAccount] = useState(false);
  const [memo, setMemo] = useState('');
  const [manualOverrideSeparate, setManualOverrideSeparate] = useState(false);

  // Batch CSV States
  const [csvText, setCsvText] = useState(SAMPLE_CSV_TEMPLATE);

  if (!isOpen) return null;

  // 부서 입력 시 별도회계 자동 감지 핸들러
  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    if (!manualOverrideSeparate) {
      const autoDetected = detectSeparateAccount(val, separateKeywords);
      setIsSeparateAccount(autoDetected);
    }
  };

  const handleSingleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rawName.trim() || !rawIdNumber.trim()) {
      alert('이름과 교번을 입력해주세요.');
      return;
    }

    const newSub: Subscriber = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      rawName: rawName.trim(),
      maskedName: autoMaskName(rawName.trim()),
      rawIdNumber: rawIdNumber.trim(),
      maskedIdNumber: autoMaskIdNumber(rawIdNumber.trim()),
      birthDate: birthDate || undefined,
      department: department.trim() || '일반부서',
      joinDate: normalizeJoinDate(joinDate),
      isSeparateAccount,
      baseSalary: 0,
      contributionAmount: 0,
      memo: memo.trim()
    };

    onAddSubscriber(newSub);
    // 초기화
    setRawName('');
    setRawIdNumber('');
    setBirthDate('');
    setDepartment('');
    setMemo('');
    setIsSeparateAccount(false);
    setManualOverrideSeparate(false);
    onClose();
  };

  const handleBatchSubmit = () => {
    const parsed = parseCSVToSubscribers(csvText, separateKeywords);
    if (parsed.length === 0) {
      alert('유효한 데이터가 파싱되지 않았습니다. 형식을 확인해주세요.');
      return;
    }
    onAddBatchSubscribers(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">신규 퇴직연금 가입자 등록</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 컨트롤 */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setTab('SINGLE')}
            className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
              tab === 'SINGLE'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            개별 등록 (입력폼)
          </button>
          <button
            onClick={() => setTab('BATCH')}
            className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'BATCH'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>엑셀/CSV 대량 붙여넣기</span>
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {tab === 'SINGLE' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              
              {/* 마스킹 정책 안내 상자 */}
              <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-lg flex items-start gap-2 text-indigo-900">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">현재 입력 방식: 성 + 끝자리만 입력</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    이름은 성과 끝자리(예: 홍동), 교번은 앞 2자리와 끝 2자리(예: 2456)만 입력하시면
                    자동으로 홍*동, 24**56으로 마스킹 처리되어 저장됩니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 이름 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    이름 (성+끝자리) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="예: 홍동"
                    value={rawName}
                    onChange={(e) => setRawName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                  {rawName && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>마스킹 결과: [{autoMaskName(rawName)}]</span>
                    </p>
                  )}
                </div>

                {/* 교번 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    교번 (앞2+끝2자리) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="예: 2456"
                    value={rawIdNumber}
                    onChange={(e) => setRawIdNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  />
                  {rawIdNumber && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold font-mono">
                      <Sparkles className="w-3 h-3" />
                      <span>마스킹 결과: [{autoMaskIdNumber(rawIdNumber)}]</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 생년월일 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">생년월일</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* 소속부서 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">소속부서</label>
                  <input
                    type="text"
                    placeholder="예: 산학협력단 연구팀"
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 입사일 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">입사일</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* 별도회계 자동판별 체크박스 */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${isSeparateAccount ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-slate-800">별도회계기관 여부</span>
                    <p className="text-[10px] text-slate-500">부서명에 '{separateKeywords.join(', ')}' 포함 시 자동 체크</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSeparateAccount}
                    onChange={(e) => {
                      setIsSeparateAccount(e.target.checked);
                      setManualOverrideSeparate(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* 비고 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">비고 / 메모</label>
                <input
                  type="text"
                  placeholder="예: 이번 달 정규직 전환"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 푸터 버튼 */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm shadow-indigo-200 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>가입자 등록 완료</span>
                </button>
              </div>

            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-600">
                <p className="font-bold text-slate-800 mb-1">엑셀에서 복사한 데이터를 아래 텍스트 상자에 그대로 붙여넣으세요.</p>
                <p className="text-[11px] leading-relaxed">
                  형식: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold">이름, 교번, 생년월일(YYYY-MM-DD), 소속부서, 입사일(YYYY-MM-DD), 월급여액</code> 순서로 줄바꿈하여 작성합니다. 
                  전체 정보 입력 시 자동으로 보안 마스킹 처리가 완료됩니다.
                </p>
              </div>

                <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 leading-normal"
                placeholder="홍길동, 241122, 1990-01-01, 산학협력단, 2026-06-15, 4000000"
              />

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm shadow-indigo-200 flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>일괄 파싱 및 등록하기</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
