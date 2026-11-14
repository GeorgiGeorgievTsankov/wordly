import { describe, it, expect } from 'vitest';
import { generateSession } from '../lib/services/session-generator.js';

describe('Study Session Generator', () => {
  const makeWords = (prefix, count) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i + 1}`,
      headword: `${prefix}_word_${i + 1}`,
      part_of_speech: 'noun',
    }));

  it('assembles a session with 50% due, 25% new, and 25% hard when all pools are full', () => {
    const dueWords = makeWords('due', 10);
    const newWords = makeWords('new', 10);
    const hardWords = makeWords('hard', 10);

    const session = generateSession({
      dueWords,
      newWords,
      hardWords,
      sessionSize: 10,
    });

    expect(session.length).toBe(10);

    const dueCount = session.filter((w) => w.id.startsWith('due-')).length;
    const newCount = session.filter((w) => w.id.startsWith('new-')).length;
    const hardCount = session.filter((w) => w.id.startsWith('hard-')).length;

    expect(dueCount).toBe(5); // 50% of 10
    expect(newCount).toBe(3); // Math.round(2.5) = 3
    expect(hardCount).toBe(2); // remaining
  });

  it('never includes duplicate words in the generated session', () => {
    const sharedWord = { id: 'shared-1', headword: 'duplicate', part_of_speech: 'verb' };
    const dueWords = [sharedWord, ...makeWords('due', 5)];
    const newWords = [sharedWord, ...makeWords('new', 5)];
    const hardWords = [sharedWord, ...makeWords('hard', 5)];

    const session = generateSession({
      dueWords,
      newWords,
      hardWords,
      sessionSize: 10,
    });

    const ids = session.map((w) => w.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('gracefully backfills when some pools are empty or underfilled', () => {
    const dueWords = makeWords('due', 2); // only 2 due words available
    const newWords = []; // no new words
    const hardWords = makeWords('hard', 15); // plenty of hard words

    const session = generateSession({
      dueWords,
      newWords,
      hardWords,
      sessionSize: 8,
    });

    expect(session.length).toBe(8);
    // Should contain the 2 due words and 6 hard words
    expect(session.filter((w) => w.id.startsWith('due-')).length).toBe(2);
    expect(session.filter((w) => w.id.startsWith('hard-')).length).toBe(6);
  });

  it('returns all available words when total pool count is less than requested session size', () => {
    const dueWords = makeWords('due', 2);
    const newWords = makeWords('new', 1);

    const session = generateSession({
      dueWords,
      newWords,
      hardWords: [],
      sessionSize: 10,
    });

    expect(session.length).toBe(3);
  });
});

