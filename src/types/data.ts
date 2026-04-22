export interface MonthYear {
  year: number;
  month: number; // 1–12
}

export interface DateRange {
  start: MonthYear;
  end: MonthYear;
}

export interface PadresGame {
  date: string;      // YYYY-MM-DD
  opponent: string;
  dayNight: "day" | "night" | "tbd";
}

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
  dayOfWeek: number;
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

export interface MeterLocationRecord {
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
  r: number;  // revenue
  t: number;  // transactions
}

export interface PolicyDate {
  date: string;
  label: string;
  description: string;
}

export interface Metadata {
  lastRefresh: string;
  lastCompleteMonth: { year: number; month: number };
  dataRange: { start: string; end: string };
  meterCount: number;
  zoneBreakdown: Record<string, number>;
  policyDates: PolicyDate[];
}

export interface ZonePricing {
  zone: string;
  avgPrice: number;            // $/hr
  avgEnforcementHours: number; // hours/day
  avgDaysPerWeek: number;      // days/week enforced
}

export interface GamedayStat {
  period: "pre-surcharge" | "post-surcharge";
  isGameDay: boolean;
  avgDailyRevenue: number;
  avgDailyTransactions: number;
  sampleDays: number;
}

export interface GamedayDailyRecord {
  date: string;
  revenue: number;
  transactions: number;
  isGameDay: boolean;
  dayNight?: "day" | "night";
}

export interface GamedayData {
  summary: GamedayStat[];
  daily: GamedayDailyRecord[];
}

export interface HourlyRecord {
  hour: number;         // 0–23
  dow: number;          // 0=Sun, 1=Mon, … 6=Sat
  zone: string;
  isGameDay: boolean;
  period: "pre-reform" | "post-reform";
  occupancy: number;    // 0–100 (payment occupancy %)
  sampleDays: number;
}

export interface DashboardData {
  monthly: MonthlyRevenueRecord[];
  daily: DailySummaryRecord[];
  dowHeatmap: DowHeatmapRecord[];
  citations: CitationMonthlyRecord[];
  locations: MeterLocationRecord[];
  metadata: Metadata;
  payments: PaymentMethodRecord[] | null;
  zonePricing: ZonePricing[] | null;
  gameday: GamedayData | null;
  hourly: HourlyRecord[] | null;
}
