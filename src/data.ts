import { Subscriber } from './types';

const currentYearMonth = new Date().toISOString().slice(0, 7);
const currentYear = currentYearMonth.split('-')[0];
const currentMonth = currentYearMonth.split('-')[1];

export const INITIAL_SEPARATE_DEPTS = ['산학협력단', '국제교류원', '별도사업단', '연구비관리부'];

export const INITIAL_SUBSCRIBERS: Subscriber[] = [];

export const SAMPLE_CSV_TEMPLATE = `이름(성),이름(끝),교번(앞2),교번(끝2),생년월일,소속부서,입사일,회계기관분류,기준급여,비고`;
// 예시 데이터는 엑셀 양식 다운로드로 제공
