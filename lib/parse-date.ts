export function parseDate(date: string): Date {
  const [d, m, y] = date.split("/").map(Number);
  const dateWithOffset = new Date(y, m - 1, d);
  const offsetInMs = dateWithOffset.getTimezoneOffset() * 60 * 1000;
  return new Date(dateWithOffset.getTime() - offsetInMs);
} 