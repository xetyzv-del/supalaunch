import { describe, it, expect } from 'vitest';
import { formatClock, formatDuration, formatDateTimeIST, formatBytes } from '../src/lib/format';

describe('Format Utilities', () => {
  it('formats clock correctly in mm:ss and hh:mm:ss', () => {
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(3665)).toBe('1:01:05');
  });

  it('formats duration in m s', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(15)).toBe('0m 15s');
  });

  it('formats date and time in IST format', () => {
    const iso = '2026-03-15T06:30:00.000Z';
    const formatted = formatDateTimeIST(iso);
    expect(formatted).toContain('IST');
    expect(typeof formatted).toBe('string');
  });

  it('formats bytes into readable human units', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(0)).toBe('—');
  });
});
