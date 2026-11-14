/**
 * SM-2 Spaced Repetition Engine
 * Pure logic module — NO UI or Database imports.
 *
 * Implements an adaptive spaced repetition algorithm inspired by SuperMemo SM-2,
 * tracking repetitions, ease factor, interval, and review scheduling.
 */

export const GRADES = {
  AGAIN: 'again',
  HARD: 'hard',
  GOOD: 'good',
  EASY: 'easy',
};

export const STATUSES = {
  LEARNING: 'learning',
  REVIEWING: 'reviewing',
  MASTERED: 'mastered',
};

// Threshold of distinct successful sessions required before a word is marked mastered
export const MASTERY_SESSION_THRESHOLD = 3;

// Default initial SM-2 ease factor
export const DEFAULT_EASE_FACTOR = 2.5;
// Absolute minimum ease factor to prevent ease lock
export const MIN_EASE_FACTOR = 1.3;

/**
 * Calculates the next SRS review interval, ease factor, and progress state.
 *
 * @param {Object} currentProgress - Current progress object or null for new words
 * @param {string} grade - One of: 'again', 'hard', 'good', 'easy'
 * @param {Object} [options]
 * @param {Date} [options.now=new Date()] - Reference timestamp
 * @param {boolean} [options.isNewSession=true] - Whether this review is part of a new distinct session
 * @returns {Object} Updated progress fields
 */
export function calculateNextReview(currentProgress = null, grade = GRADES.GOOD, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  const isNewSession = options.isNewSession !== false;

  const prev = currentProgress || {};
  let repetitions = Number.isInteger(prev.repetitions) ? prev.repetitions : 0;
  let easeFactor = typeof prev.ease_factor === 'number' ? prev.ease_factor : DEFAULT_EASE_FACTOR;
  let intervalDays = typeof prev.interval_days === 'number' ? prev.interval_days : 0;
  let correctCount = Number.isInteger(prev.correct_count) ? prev.correct_count : 0;
  let incorrectCount = Number.isInteger(prev.incorrect_count) ? prev.incorrect_count : 0;
  let consecutiveCorrect = Number.isInteger(prev.consecutive_correct) ? prev.consecutive_correct : 0;
  let distinctSuccessSessions = Number.isInteger(prev.distinct_success_sessions) ? prev.distinct_success_sessions : 0;

  // Grade-specific calculation
  switch (grade) {
    case GRADES.AGAIN: {
      // Failed recall
      incorrectCount += 1;
      consecutiveCorrect = 0;
      repetitions = 0;
      // Interval resets to 1 day (or immediate review)
      intervalDays = 1;
      // Ease factor decreases significantly
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      break;
    }

    case GRADES.HARD: {
      // Recalled with hesitation/difficulty
      correctCount += 1;
      consecutiveCorrect += 1;
      repetitions += 1;
      // Slight reduction in ease factor
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);

      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 2;
      } else {
        // Slower interval growth (1.2x)
        intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      }

      if (isNewSession) {
        distinctSuccessSessions += 1;
      }
      break;
    }

    case GRADES.GOOD: {
      // Standard successful recall
      correctCount += 1;
      consecutiveCorrect += 1;
      repetitions += 1;

      // Initial standard intervals: 1 day -> 3 days -> 7 days -> adaptive
      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 3;
      } else if (repetitions === 3) {
        intervalDays = 7;
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
      }

      if (isNewSession) {
        distinctSuccessSessions += 1;
      }
      break;
    }

    case GRADES.EASY: {
      // Very easy recall
      correctCount += 1;
      consecutiveCorrect += 1;
      repetitions += 1;
      // Ease factor bonus
      easeFactor += 0.15;

      if (repetitions === 1) {
        intervalDays = 2;
      } else if (repetitions === 2) {
        intervalDays = 5;
      } else if (repetitions === 3) {
        intervalDays = 10;
      } else {
        // Faster growth with ease factor + bonus multiplier
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
      }

      if (isNewSession) {
        distinctSuccessSessions += 1;
      }
      break;
    }

    default:
      throw new Error(`Unknown SRS review grade: ${grade}`);
  }

  // Calculate next review timestamp in UTC
  const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  // Determine learning status
  let status = STATUSES.LEARNING;
  if (distinctSuccessSessions >= MASTERY_SESSION_THRESHOLD && consecutiveCorrect >= 2) {
    status = STATUSES.MASTERED;
  } else if (repetitions > 0) {
    status = STATUSES.REVIEWING;
  }

  return {
    status,
    repetitions,
    interval_days: intervalDays,
    ease_factor: Math.round(easeFactor * 100) / 100, // round to 2 decimals
    next_review_at: nextReviewDate.toISOString(),
    last_reviewed_at: now.toISOString(),
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    consecutive_correct: consecutiveCorrect,
    distinct_success_sessions: distinctSuccessSessions,
  };
}

/**
 * Checks whether progress meets the mastery condition.
 */
export function isMastered(progress) {
  if (!progress) return false;
  return (
    progress.status === STATUSES.MASTERED ||
    (progress.distinct_success_sessions >= MASTERY_SESSION_THRESHOLD && progress.consecutive_correct >= 2)
  );
}

/**
 * Formats interval in days to human readable string.
 */
export function formatInterval(days) {
  if (days <= 0) return 'Immediate';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  if (months === 1) return '1 month';
  return `${months} months`;
}

