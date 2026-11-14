/**
 * Progress and Streak Service
 * Calculates user metrics, streaks in local timezone, and achievement milestones.
 */

/**
 * Calculates current daily streak based on continuous activity dates in user timezone.
 *
 * @param {Array<string>} activityDates - Sorted array of 'YYYY-MM-DD' dates or objects with activity_date
 * @param {string} [todayDate] - Current date 'YYYY-MM-DD' in user timezone
 * @returns {number} Current consecutive streak count
 */
export function calculateStreak(activityDates = [], todayDate) {
  if (!activityDates || activityDates.length === 0) return 0;

  const dateSet = new Set(
    activityDates.map((item) => (typeof item === 'string' ? item : item.activity_date))
  );

  const today = todayDate || new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Streak continues if active today OR yesterday
  let checkDateMs = todayMs;
  const todayStr = new Date(checkDateMs).toISOString().split('T')[0];

  if (!dateSet.has(todayStr)) {
    // Check if active yesterday
    checkDateMs -= oneDayMs;
    const yesterdayStr = new Date(checkDateMs).toISOString().split('T')[0];
    if (!dateSet.has(yesterdayStr)) {
      return 0; // Streak broken
    }
  }

  let streak = 0;
  while (true) {
    const dStr = new Date(checkDateMs).toISOString().split('T')[0];
    if (dateSet.has(dStr)) {
      streak += 1;
      checkDateMs -= oneDayMs;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Evaluates which achievements a user qualifies for based on current stats.
 */
export function evaluateAchievements(stats = {}) {
  const {
    wordsMastered = 0,
    wordsStudied = 0,
    streak = 0,
    totalReviews = 0,
  } = stats;

  const unlocked = [];

  if (wordsStudied >= 1) unlocked.push('first_word');
  if (wordsStudied >= 10 || wordsMastered >= 5) unlocked.push('ten_words');
  if (wordsStudied >= 50 || wordsMastered >= 20) unlocked.push('fifty_words');
  if (wordsStudied >= 100 || wordsMastered >= 50) unlocked.push('hundred_words');
  if (streak >= 7) unlocked.push('streak_7');
  if (streak >= 30) unlocked.push('streak_30');

  return unlocked;
}
