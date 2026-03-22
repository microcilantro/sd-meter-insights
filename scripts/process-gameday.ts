import type { DailySummaryRecord } from "./types.ts";
import type { PadresGame } from "./fetch-schedule.ts";

const SURCHARGE_START = "2025-09-01";
const DOWNTOWN_ZONE = "Downtown";

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

export interface GamedayOutput {
  summary: GamedayStat[];
  daily: GamedayDailyRecord[];
}

export function processGameday(
  daily: DailySummaryRecord[],
  schedules: Map<number, PadresGame[]>
): GamedayOutput {
  // Build a Set of all Padres home game dates
  const gameDaySet = new Map<string, { dayNight: "day" | "night" | "tbd" }>();
  for (const [, games] of schedules) {
    for (const game of games) {
      gameDaySet.set(game.date, { dayNight: game.dayNight });
    }
  }

  // Filter to Downtown zone records only (Petco Park surcharge applies to Downtown)
  const downtownRecords = daily.filter((r) => r.zone === DOWNTOWN_ZONE);

  // Accumulators for summary stats
  const buckets = new Map<
    string,
    { revenue: number; transactions: number; days: number }
  >();

  const dailyOutput: GamedayDailyRecord[] = [];

  for (const r of downtownRecords) {
    const isGameDay = gameDaySet.has(r.date);
    const period: "pre-surcharge" | "post-surcharge" =
      r.date >= SURCHARGE_START ? "post-surcharge" : "pre-surcharge";
    const gameInfo = gameDaySet.get(r.date);

    // Build summary bucket key
    const bucketKey = `${period}|${isGameDay}`;
    const bucket = buckets.get(bucketKey) ?? { revenue: 0, transactions: 0, days: 0 };
    bucket.revenue += r.revenue;
    bucket.transactions += r.transactions;
    bucket.days += 1;
    buckets.set(bucketKey, bucket);

    dailyOutput.push({
      date: r.date,
      revenue: r.revenue,
      transactions: r.transactions,
      isGameDay,
      ...(isGameDay && gameInfo?.dayNight && gameInfo.dayNight !== "tbd"
        ? { dayNight: gameInfo.dayNight }
        : {}),
    });
  }

  // Build summary from buckets
  const summary: GamedayStat[] = [];
  const periods: Array<"pre-surcharge" | "post-surcharge"> = [
    "pre-surcharge",
    "post-surcharge",
  ];
  for (const period of periods) {
    for (const isGameDay of [false, true]) {
      const key = `${period}|${isGameDay}`;
      const b = buckets.get(key) ?? { revenue: 0, transactions: 0, days: 0 };
      summary.push({
        period,
        isGameDay,
        avgDailyRevenue: b.days > 0 ? b.revenue / b.days : 0,
        avgDailyTransactions: b.days > 0 ? b.transactions / b.days : 0,
        sampleDays: b.days,
      });
    }
  }

  // Sort daily by date
  dailyOutput.sort((a, b) => a.date.localeCompare(b.date));

  console.log(`  Processed ${dailyOutput.length} Downtown daily records`);
  console.log(`  Game days found: ${dailyOutput.filter((d) => d.isGameDay).length}`);
  for (const s of summary) {
    console.log(
      `  ${s.period} ${s.isGameDay ? "game day" : "non-game"}: ` +
        `$${s.avgDailyRevenue.toFixed(0)}/day avg, ${s.sampleDays} days`
    );
  }

  return { summary, daily: dailyOutput };
}
