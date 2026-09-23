/**
 * Timezone-safe local date string helper (YYYY-MM-DD) based on current visitor's local date
 */
export const formatLocalDate = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's date string in YYYY-MM-DD format (local timezone)
 */
export const getTodayDateStr = (): string => {
  return formatLocalDate(new Date());
};

/**
 * Returns relative date string offset by N days from baseDate (local timezone)
 */
export const getRelativeDateStr = (offsetDays: number = 0, baseDate: Date = new Date()): string => {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offsetDays);
  return formatLocalDate(d);
};

/**
 * Relative timestamp generator based on visitor's local date (in ms)
 */
export const getRelativeTimestamp = (offsetDays: number = 0, offsetHours: number = 0, baseDate: Date = new Date()): number => {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offsetDays, 12, 0, 0);
  d.setHours(d.getHours() + offsetHours);
  return d.getTime();
};
