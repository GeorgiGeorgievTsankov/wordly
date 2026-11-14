import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  isMastered,
  GRADES,
  STATUSES,
  MASTERY_SESSION_THRESHOLD,
  DEFAULT_EASE_FACTOR,
} from '../lib/services/srs.js';

describe('SM-2 SRS Algorithm', () => {
  const baseDate = new Date('2026-03-01T12:00:00Z');

  it('initializes a new word on first GOOD review with 1 day interval', () => {
    const res = calculateNextReview(null, GRADES.GOOD, { now: baseDate });

    expect(res.repetitions).toBe(1);
    expect(res.interval_days).toBe(1);
    expect(res.ease_factor).toBe(DEFAULT_EASE_FACTOR);
    expect(res.status).toBe(STATUSES.REVIEWING);
    expect(res.correct_count).toBe(1);
    expect(res.consecutive_correct).toBe(1);
    expect(res.distinct_success_sessions).toBe(1);
    expect(new Date(res.next_review_at).toISOString()).toBe('2026-03-02T12:00:00.000Z');
  });

  it('schedules initial intervals: 1 day -> 3 days -> 7 days on consecutive GOOD reviews', () => {
    // 1st review
    const r1 = calculateNextReview(null, GRADES.GOOD, { now: baseDate });
    expect(r1.interval_days).toBe(1);

    // 2nd review
    const r2 = calculateNextReview(r1, GRADES.GOOD, { now: baseDate });
    expect(r2.interval_days).toBe(3);
    expect(r2.repetitions).toBe(2);

    // 3rd review
    const r3 = calculateNextReview(r2, GRADES.GOOD, { now: baseDate });
    expect(r3.interval_days).toBe(7);
    expect(r3.repetitions).toBe(3);

    // 4th review: uses ease factor adaptive growth (7 * 2.5 = 17.5 -> 18)
    const r4 = calculateNextReview(r3, GRADES.GOOD, { now: baseDate });
    expect(r4.interval_days).toBe(Math.round(7 * 2.5));
  });

  it('resets interval and repetitions on AGAIN grade and decreases ease factor', () => {
    const prior = {
      repetitions: 3,
      interval_days: 7,
      ease_factor: 2.5,
      correct_count: 3,
      incorrect_count: 0,
      consecutive_correct: 3,
      distinct_success_sessions: 3,
    };

    const res = calculateNextReview(prior, GRADES.AGAIN, { now: baseDate });

    expect(res.repetitions).toBe(0);
    expect(res.interval_days).toBe(1);
    expect(res.ease_factor).toBe(2.3);
    expect(res.consecutive_correct).toBe(0);
    expect(res.incorrect_count).toBe(1);
  });

  it('handles HARD grade with slower interval growth and slight ease reduction', () => {
    const prior = {
      repetitions: 2,
      interval_days: 3,
      ease_factor: 2.5,
      correct_count: 2,
      incorrect_count: 0,
      consecutive_correct: 2,
      distinct_success_sessions: 2,
    };

    const res = calculateNextReview(prior, GRADES.HARD, { now: baseDate });

    expect(res.repetitions).toBe(3);
    expect(res.interval_days).toBe(Math.round(3 * 1.2)); // 4 days instead of 7
    expect(res.ease_factor).toBe(2.35); // 2.5 - 0.15
  });

  it('handles EASY grade with faster interval growth and ease bonus', () => {
    const prior = {
      repetitions: 2,
      interval_days: 5,
      ease_factor: 2.5,
      correct_count: 2,
      incorrect_count: 0,
      consecutive_correct: 2,
      distinct_success_sessions: 2,
    };

    const res = calculateNextReview(prior, GRADES.EASY, { now: baseDate });

    expect(res.repetitions).toBe(3);
    expect(res.interval_days).toBe(10);
    expect(res.ease_factor).toBe(2.65); // 2.5 + 0.15
  });

  it('enforces that a word is MASTERED only after distinct_success_sessions reaches threshold', () => {
    let progress = null;

    // 1st session
    progress = calculateNextReview(progress, GRADES.GOOD, { now: baseDate });
    expect(progress.distinct_success_sessions).toBe(1);
    expect(progress.status).toBe(STATUSES.REVIEWING);
    expect(isMastered(progress)).toBe(false);

    // 2nd session
    progress = calculateNextReview(progress, GRADES.GOOD, { now: baseDate });
    expect(progress.distinct_success_sessions).toBe(2);
    expect(progress.status).toBe(STATUSES.REVIEWING);
    expect(isMastered(progress)).toBe(false);

    // 3rd session -> now satisfies threshold
    progress = calculateNextReview(progress, GRADES.GOOD, { now: baseDate });
    expect(progress.distinct_success_sessions).toBe(MASTERY_SESSION_THRESHOLD);
    expect(progress.status).toBe(STATUSES.MASTERED);
    expect(isMastered(progress)).toBe(true);
  });

  it('continues scheduling future maintenance reviews even when a word is mastered', () => {
    const masteredState = {
      status: STATUSES.MASTERED,
      repetitions: 5,
      interval_days: 30,
      ease_factor: 2.5,
      correct_count: 5,
      incorrect_count: 0,
      consecutive_correct: 5,
      distinct_success_sessions: 4,
    };

    const res = calculateNextReview(masteredState, GRADES.GOOD, { now: baseDate });

    expect(res.status).toBe(STATUSES.MASTERED);
    expect(res.interval_days).toBeGreaterThan(30);
    expect(new Date(res.next_review_at).getTime()).toBeGreaterThan(baseDate.getTime());
  });

  it('never drops ease factor below the minimum floor (1.3)', () => {
    let progress = {
      repetitions: 0,
      interval_days: 1,
      ease_factor: 1.4,
      correct_count: 0,
      incorrect_count: 5,
      consecutive_correct: 0,
      distinct_success_sessions: 0,
    };

    const res = calculateNextReview(progress, GRADES.AGAIN, { now: baseDate });
    expect(res.ease_factor).toBe(1.3);

    const res2 = calculateNextReview(res, GRADES.AGAIN, { now: baseDate });
    expect(res2.ease_factor).toBe(1.3);
  });
});
