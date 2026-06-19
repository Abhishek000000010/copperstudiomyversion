// The app's mock data is set in mid-2026 (project due dates cluster there),
// so "today" is fixed to match it instead of the real system clock.
export const TODAY = new Date(2026, 5, 16);
export const DAY_MS = 1000 * 60 * 60 * 24;

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export function parseFullDate(value) {
  const [day, month, year] = value.split(" ");
  return new Date(Number(year), MONTHS[month], Number(day));
}

export function parseShortDate(value, year) {
  const [day, month] = value.split(" ");
  return new Date(year, MONTHS[month], Number(day));
}

export function formatRange(start, end) {
  const fmt = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
}

export function daysBetween(start, end) {
  return Math.round((end - start) / DAY_MS);
}
