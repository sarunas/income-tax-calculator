export function parseDate(date: string): Date {
  const [day, month, year] = date.split('/').map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year) ||
      day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    throw new Error(`Invalid date format: ${date}`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}