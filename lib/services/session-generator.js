/**
 * Study Session Generator
 * Pure logic module — NO UI or Database imports.
 *
 * Assembles a balanced, deduplicated session of words based on:
 * - 50% due review words
 * - 25% new words
 * - 25% hard words
 * Adapting dynamically when any pool is underfilled.
 */

/**
 * Generates an array of words for a study session.
 *
 * @param {Object} params
 * @param {Array} [params.dueWords=[]] - Words due for review (scheduled next_review_at <= now)
 * @param {Array} [params.newWords=[]] - Words the user has not studied yet
 * @param {Array} [params.hardWords=[]] - Words with high failure rate or low ease factor
 * @param {number} [params.sessionSize=10] - Desired number of words in session
 * @returns {Array} Ordered, deduplicated array of word items
 */
export function generateSession({
  dueWords = [],
  newWords = [],
  hardWords = [],
  sessionSize = 10,
}) {
  const safeSessionSize = Math.max(1, sessionSize);
  const selected = [];
  const seenIds = new Set();

  function addItem(item) {
    if (!item) return false;
    const key = item.id || (item.headword && `${item.headword}-${item.part_of_speech}`);
    if (!key || seenIds.has(key)) return false;
    seenIds.add(key);
    selected.push(item);
    return true;
  }

  // 1. Calculate target allocations (50% due, 25% new, 25% hard)
  const targetDue = Math.round(safeSessionSize * 0.5);
  const targetNew = Math.round(safeSessionSize * 0.25);
  const targetHard = Math.max(0, safeSessionSize - targetDue - targetNew);

  // 2. Select from Due words
  let dueCount = 0;
  for (const word of dueWords) {
    if (dueCount >= targetDue || selected.length >= safeSessionSize) break;
    if (addItem(word)) {
      dueCount += 1;
    }
  }

  // 3. Select from New words
  let newCount = 0;
  for (const word of newWords) {
    if (newCount >= targetNew || selected.length >= safeSessionSize) break;
    if (addItem(word)) {
      newCount += 1;
    }
  }

  // 4. Select from Hard words
  let hardCount = 0;
  for (const word of hardWords) {
    if (hardCount >= targetHard || selected.length >= safeSessionSize) break;
    if (addItem(word)) {
      hardCount += 1;
    }
  }

  // 5. Backfill if some pools were empty/undersized
  // Priority: remaining due -> remaining hard -> remaining new
  const backfillPools = [dueWords, hardWords, newWords];
  for (const pool of backfillPools) {
    if (selected.length >= safeSessionSize) break;
    for (const word of pool) {
      if (selected.length >= safeSessionSize) break;
      addItem(word);
    }
  }

  return selected;
}

/**
 * Shuffles an array randomly (Fisher-Yates)
 */
export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

