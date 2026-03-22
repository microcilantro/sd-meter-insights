// === CSV Row Types (as parsed from files) ===

export interface MonthlyTransactionRow {
  pole_id: string;
  month: string;
  sum_trans_amt: string;
  num_trans: string;
}

export interface DailyTransactionRow {
  pole_id: string;
  month: string;
  day: string;
  sum_trans_amt: string;
  num_trans: string;
}

export interface RawTransactionRow {
  pole_id: string;
  meter_type: string;
  date_trans_start: string;
  date_meter_expire: string;
  trans_amt: string;
  pay_method: string;
}

export interface LocationRow {
  zone: string;
  area: string;
  "sub-area": string;
  pole: string;
  latitude: string;
  longitude: string;
  configid: string;
  configname: string;
  time_start: string;
  time_end: string;
  time_limit: string;
  days_in_operation: string;
  price: string;
  mobile_pay: string;
  multi_space: string;
  restrictions: string;
}

export interface CitationRow {
  citation_id: string;
  date_issue: string;
  date_creation: string;
  location: string;
  sector1: string;
  vio_code: string;
  vio_desc: string;
  vio_fine: string;
}

// === Processed Location Info ===

export interface MeterLocation {
  zone: string;
  area: string;
  subArea: string;
  lat: number;
  lng: number;
  price: string;
  timeStart: string;
  timeEnd: string;
  daysInOp: string;
  timeLimit: string;
  configName: string;
}

// === Output JSON Types ===

export interface MonthlyRevenueRecord {
  year: number;
  month: number;
  zone: string;
  revenue: number;
  transactions: number;
  avgPerTrans: number;
  meterCount: number;
}

export interface DailySummaryRecord {
  date: string;
  zone: string;
  revenue: number;
  transactions: number;
  dayOfWeek: number; // 0=Sunday
}

export interface DowHeatmapRecord {
  zone: string;
  dayOfWeek: number;
  period: "pre-reform" | "post-reform";
  avgTransactions: number;
  avgRevenue: number;
}

export interface CitationMonthlyRecord {
  year: number;
  month: number;
  zone: string;
  meterRelated: boolean;
  citationCount: number;
  fineTotal: number;
  topViolations: { code: string; desc: string; count: number }[];
}

export interface PaymentMethodRecord {
  year: number;
  month: number;
  zone: string;
  payMethod: string;
  transactions: number;
  revenue: number;
}

export interface MeterLocationOutput {
  p: string;  // pole
  z: string;  // zone
  a: string;  // area
  s: string;  // sub-area
  la: number; // latitude
  ln: number; // longitude
  pr: string; // price
  ts: string; // time_start
  te: string; // time_end
  d: string;  // days_in_operation
  r: number;  // revenue (latest year)
  t: number;  // transactions (latest year)
}

export interface Metadata {
  lastRefresh: string;
  lastCompleteMonth: { year: number; month: number };
  dataRange: { start: string; end: string };
  meterCount: number;
  zoneBreakdown: Record<string, number>;
  policyDates: {
    date: string;
    label: string;
    description: string;
  }[];
}
