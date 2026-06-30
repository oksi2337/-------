export interface Subscriber {
  id: string;
  rawName: string;       // 원본 이름 (예: 홍길동)
  maskedName: string;    // 마스킹 이름 (예: 홍*동)
  rawIdNumber: string;   // 원본 교번 (예: 243556)
  maskedIdNumber: string;// 마스킹 교번 (예: 24**56)
  birthDate?: string;    // 생년월일 (YYYY-MM-DD)
  department: string;    // 소속부서
  joinDate: string;      // 입사일 (YYYY-MM-DD)
  isSeparateAccount: boolean; // 별도회계기관 여부 (Y/N)
  baseSalary: number;    // 월 기준급여 (원)
  contributionAmount: number; // 당월 산출 부담금 (원)
  memo?: string;
}

export type MaskingInputMode = 'AUTO' | 'MANUAL';
export type ComparisonCriteria = 'MONTH_ONLY' | 'YEAR_MONTH';

export interface CalculationConfig {
  referenceMonth: string; // 현재 산출 기준 연월 (YYYY-MM)
  maskingMode: MaskingInputMode; // AUTO: 원본 입력 시 자동 마스킹 생성, MANUAL: 입력부터 마스킹 입력
  comparisonCriteria: ComparisonCriteria; // MONTH_ONLY: 매년 도래하는 '월' 일치 시 대상, YEAR_MONTH: 특정 연월 정확히 일치 시 대상
  contributionRatePercent: number; // 부담금 산출 비율 (기본값 100% 즉 기준급여 상당액, 혹은 8.33% 등)
  separateAccountDepartments: string[]; // 별도회계기관으로 자동 분류할 부서 키워드 목록
}

export interface SummaryStats {
  totalCount: number;
  targetCount: number;
  totalContribution: number;
  generalContribution: number;
  separateContribution: number;
  generalCount: number;
  separateCount: number;
}

// ─── DC형 퇴직연금 납입액 계산기 타입 ───

export interface ExtraPayItem {
  label: string;
  amount: number;
  included: boolean;
}

export interface DcEmployee {
  empName: string;
  empId: string;
  birthDate: string;
  department: string;
  separateFunding: boolean;
  startDate: string;
  endDate: string;
  totalBase: number;
  firstMode: 'prorated' | 'deduction';
  firstBase: number;
  firstDeduction: number;
  lastMode: 'prorated' | 'deduction';
  lastBase: number;
  lastDeduction: number;
  extraPays: ExtraPayItem[];
  prevPaid: number;
  totalWage: number;
  severance: number;
}

export interface DcCalcResult {
  totalWage: number;
  grossSeverance: number;
  roundedSeverance: number;
  netSeverance: number;
  firstContrib: number;
  lastContrib: number;
  proratedFirst: number;
  proratedLast: number;
  startWorked: number;
  startTotal: number;
  endWorked: number;
  endTotal: number;
  includedExtra: number;
  description: string;
}
