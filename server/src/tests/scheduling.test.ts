import { describe, it, expect } from 'vitest';
import { SchedulingService } from '../services/scheduling.service';

describe('Scheduling Engine Logic', () => {
  it('correctly converts time strings to minutes and back', () => {
    expect(SchedulingService.timeToMinutes('09:00')).toBe(540);
    expect(SchedulingService.timeToMinutes('13:30')).toBe(810);
    expect(SchedulingService.minutesToTime(540)).toBe('09:00');
    expect(SchedulingService.minutesToTime(810)).toBe('13:30');
  });

  it('correctly detects overlapping and non-overlapping intervals', () => {
    // Exact match
    expect(SchedulingService.isOverlapping('09:00', '09:20', '09:00', '09:20')).toBe(true);
    // Partial overlap
    expect(SchedulingService.isOverlapping('09:00', '09:30', '09:20', '09:40')).toBe(true);
    // Adjacent intervals (should NOT overlap: 09:20 ends when 09:20 starts)
    expect(SchedulingService.isOverlapping('09:00', '09:20', '09:20', '09:40')).toBe(false);
    // Completely separate
    expect(SchedulingService.isOverlapping('09:00', '09:20', '10:00', '10:20')).toBe(false);
  });
});
