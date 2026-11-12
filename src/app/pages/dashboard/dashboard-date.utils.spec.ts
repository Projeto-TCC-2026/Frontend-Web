import { isoWeekBounds, isoWeekString } from './dashboard-date.utils';

describe('dashboard ISO week conversion', () => {
  it('converts an ISO week to Monday and Sunday without timezone shifts', () => {
    expect(isoWeekBounds('2026-W46')).toEqual({
      start: '2026-11-09',
      end: '2026-11-15',
    });
  });

  it('rejects week numbers that do not exist in the given ISO year', () => {
    expect(isoWeekBounds('2025-W53')).toBeNull();
  });

  it('uses the ISO week-year for dates at the start of January', () => {
    expect(isoWeekString(new Date(2021, 0, 1))).toBe('2020-W53');
  });
});
