/**
 * Returns true if (year, month) is within a completed month relative to lastCompleteMonth.
 * Excludes partial months (e.g., the current in-progress month).
 */
export function isCompleteMonth(
  year: number,
  month: number,
  last: { year: number; month: number }
): boolean {
  return year < last.year || (year === last.year && month <= last.month);
}
