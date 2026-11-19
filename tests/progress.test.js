import { describe, it, expect } from 'vitest';
import { calculateStreak, evaluateAchievements } from '../lib/services/progress.js';

describe('Progress & Streak Calculations', () => {
  it('calculates 0 streak if no activity recorded', () => {
    expect(calculateStreak([], '2026-03-05')).toBe(0);
  });

  it('calculates active streak when active today', () => {
    const dates = ['2026-03-03', '2026-03-04', '2026-03-05'];
    expect(calculateStreak(dates, '2026-03-05')).toBe(3);
  });

  it('preserves streak if active yesterday but not yet today', () => {
    const dates = ['2026-03-02', '2026-03-03', '2026-03-04'];
    expect(calculateStreak(dates, '2026-03-05')).toBe(3);
  });

  it('breaks streak if missing yesterday', () => {
    const dates = ['2026-03-01', '2026-03-02', '2026-03-03'];
    // Missing March 4, today is March 5
    expect(calculateStreak(dates, '2026-03-05')).toBe(0);
  });

  it('evaluates unlocked achievements accurately', () => {
    expect(evaluateAchievements({ wordsStudied: 0, streak: 0 })).toEqual([]);

    expect(evaluateAchievements({ wordsStudied: 1, streak: 0 })).toEqual(['first_word']);

    expect(evaluateAchievements({ wordsStudied: 12, streak: 7 })).toEqual([
      'first_word',
      'ten_words',
      'streak_7',
    ]);
  });
});

