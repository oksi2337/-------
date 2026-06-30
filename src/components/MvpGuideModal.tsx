import { BookOpen, CheckCircle, Cpu, Database, Eye, FileSpreadsheet, Layers, ShieldCheck, X } from 'lucide-react';

interface MvpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete: () => void;
}

export function MvpGuideModal({ isOpen, onClose, onConfirmComplete }: MvpGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 헤더 */}
        <div className="px-7 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">퇴직연금 가입자 관리 MVP 기획 답변서 & 조율 솔루션</h2>
              <p className="text-xs text-slate-400 mt-0.5">제안해주신 5가지 핵심 질문에 대한 정밀한 MVP 답변 및 시스템 검증 내용</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 스크롤 영역 */}
        <div className="p-7 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">기획 질문에 대한 MVP 조율 방향성 안내</p>
              <p className="mt-1 text-xs text-indigo-800">
                사용자님께서 구체화하고자 하신 5가지 질의사항에 대해 <strong>가장 실무적으로 유연한 MVP 기본값</strong>을 이 프로그램에 즉시 구현해 두었습니다. 
                아래 5가지 항목의 의사결정 내용을 확인하시고 실시간으로 테스트해 보세요.
              </p>
            </div>
          </div>

          {/* 1번 답변 */}
          <div className="space-y-2 border-l-4 border-indigo-600 pl-4 py-1 bg-slate-50/60 rounded-r-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>1. 개인정보 입력 및 마스킹 방식</span>
              </h4>
              <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">권장 솔루션 반영 완료</span>
            </div>
            <p className="text-slate-600">
              • <strong>채택된 방식:</strong> <strong>"전체 정보를 입력하면 프로그램이 자동으로 마스킹하여 보여주고 저장하는 방식(후자)"</strong>을 MVP 기본값으로 구현했습니다. (상단 '정책 설정'에서 수동 마스킹 직접 입력 방식으로도 실시간 토글 가능)
            </p>
            <p className="text-slate-600">
              • <strong>동명이인 및 중복 식별 규칙 정의:</strong> 이름이 <em>홍*동</em>으로 동일하게 마스킹될 경우, 시스템은 <strong>교번의 비마스킹 영역(앞 2자리 + 끝 2자리, 예: 24**56 vs 25**56)을 조합하여 고유 식별키로 사용</strong>합니다. 또한 내부 데이터 구조에 보이지 않는 유니크 ID(<code className="bg-slate-200 px-1 rounded">sub_timestamp</code>)를 부여하여 동명이인 데이터 충돌을 원천 방지했습니다.
            </p>
          </div>

          {/* 2번 답변 */}
          <div className="space-y-2 border-l-4 border-emerald-600 pl-4 py-1 bg-slate-50/60 rounded-r-xl p-4 border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>2. 입사월과 당월 비교 기준 및 표기 방식</span>
            </h4>
            <p className="text-slate-600">
              • <strong>비교 기준:</strong> 퇴직연금 부담금은 통상 매년 도래하는 가입 주기에 따라 발생하므로, <strong>"매년 돌아오는 '월(Month)' 자체 기준"</strong>을 기본값으로 반영했습니다. (예: 2021년 6월 입사자도 매년 6월이 되면 부담금 납입 대상으로 자동 판별). 연도까지 일치해야 하는 '특정 연월 옵션' 역시 상단 정책 설정에서 즉시 변경 가능합니다.
            </p>
            <p className="text-slate-600">
              • <strong>화면 표기 방식:</strong> 납입 대상 인원은 <strong>① 연한 인디고 블루 색상 배경으로 행 전체 하이라이트</strong>, <strong>② '초록색 납입대상 펄스 배지' 표시</strong>, <strong>③ 상단 요약 카드에 당월 산출 총액 별도 집계</strong>, <strong>④ '당월 납입대상만 보기' 탭 필터링 기능</strong> 등 4중 표기 체계로 직관적으로 보여집니다.
            </p>
          </div>

          {/* 3번 답변 */}
          <div className="space-y-2 border-l-4 border-amber-500 pl-4 py-1 bg-slate-50/60 rounded-r-xl p-4 border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>3. 소속부서와 '별도회계기관 여부' 판단 방식</span>
            </h4>
            <p className="text-slate-600">
              • <strong>하이브리드 방식 채택:</strong> 신규 가입자 등록 시 부서명에 <code className="bg-amber-100 text-amber-900 px-1 font-bold rounded">'산학협력단', '국제교류원', '사업단'</code> 등의 키워드가 입력되면 <strong>프로그램이 자동으로 별도회계기관 체크박스를 활성화(매핑)</strong>해 줍니다. 
              동시에 특수 예외 케이스를 위해 <strong>사용자가 언제든 체크박스를 직접 수동 선택/해제할 수 있는 오버라이드 기능</strong>을 함께 부여했습니다.
            </p>
          </div>

          {/* 4번 답변 */}
          <div className="space-y-2 border-l-4 border-cyan-600 pl-4 py-1 bg-slate-50/60 rounded-r-xl p-4 border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <span>4. 프로그램의 운영 환경</span>
            </h4>
            <p className="text-slate-600">
              • <strong>옵션 B (웹 브라우저 접속형 웹 애플리케이션):</strong> 별도 엑셀 매크로 보안 경고나 PC OS 호환성 이슈 없이, <strong>링크 하나로 크롬/엣지 등 웹 브라우저 어디서나 즉시 열리는 구글 AI 스튜디오 클라우드 웹 앱 환경</strong>으로 최적화하여 구축했습니다.
            </p>
          </div>

          {/* 5번 답변 */}
          <div className="space-y-2 border-l-4 border-purple-600 pl-4 py-1 bg-slate-50/60 rounded-r-xl p-4 border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <span>5. 데이터 저장 및 관리 방식</span>
            </h4>
            <p className="text-slate-600">
              • <strong>옵션 A 기반의 무설치 스토리지 + CSV 호환:</strong> 초기 검증 단계의 속도를 위해 <strong>담당자 브라우저 로컬 DB에 자동 영구 보관</strong>되며, 상단의 <strong className="text-slate-900">'엑셀(CSV) 저장'</strong> 기능을 통해 언제든 엑셀 파일로 추출하여 중앙 공유 폴더에 보관할 수 있습니다.
            </p>
          </div>

          {/* 하단 기획 조율 완료 안내 배너 */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">모든 기획 요구사항 조율 및 구현이 검증되었습니다.</p>
              <p className="text-xs text-slate-400 mt-0.5">질문하신 내용에 대한 답변 검토가 끝나셨다면, 아래 확인 버튼을 눌러 피드백을 완료하세요.</p>
            </div>
            <button
              onClick={() => {
                onConfirmComplete();
                onClose();
              }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-xl transition-transform active:scale-95 cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>'완료' 및 MVP 실무 가동</span>
            </button>
          </div>

        </div>

        {/* 모달 푸터 */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
