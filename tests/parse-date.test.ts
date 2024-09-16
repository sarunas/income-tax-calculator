import { parseDate } from '../lib/parse-date';

describe('parseDate', () => {
  it('should correctly parse valid date strings', () => {
    expect(parseDate('01/01/2021')).toEqual(new Date(Date.UTC(2021, 0, 1)));
    expect(parseDate('31/12/2020')).toEqual(new Date(Date.UTC(2020, 11, 31)));
  });

  it('should throw an error for invalid date formats', () => {
    expect(() => parseDate('2021-01-01')).toThrow('Invalid date format');
    expect(() => parseDate('01/13/2021')).toThrow('Invalid date format');
    expect(() => parseDate('00/01/2021')).toThrow('Invalid date format');
  });

  it('should throw an error for dates before 1900', () => {
    expect(() => parseDate('01/01/1899')).toThrow('Invalid date format');
  });
});