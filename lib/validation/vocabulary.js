/**
 * Vocabulary validation — server-side only, no DB or UI imports.
 */

export const PARTS_OF_SPEECH = [
  'verb',
  'noun',
  'adjective',
  'adverb',
  'pronoun',
  'conjunction',
  'preposition',
  'numeral',
  'determiner',
  'phrase',
  'other',
];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

/** Normalize a headword for deduplication: lowercase + collapse whitespace */
export function normalizeHeadword(headword) {
  return headword.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Validate a custom word or submission payload.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateWordPayload(data) {
  const errors = [];

  const headword = (data.headword || '').trim();
  if (!headword) errors.push('English word or phrase is required.');
  if (headword.length > 200) errors.push('Headword must be under 200 characters.');

  const translation = (data.translation || '').trim();
  if (!translation) errors.push('Bulgarian translation is required.');
  if (translation.length > 500) errors.push('Translation must be under 500 characters.');

  const pos = data.part_of_speech;
  if (!pos || !PARTS_OF_SPEECH.includes(pos)) {
    errors.push(`Part of speech must be one of: ${PARTS_OF_SPEECH.join(', ')}.`);
  }

  if (data.definition && data.definition.length > 1000) {
    errors.push('Definition must be under 1000 characters.');
  }

  if (data.example_en && data.example_en.length > 500) {
    errors.push('English example sentence must be under 500 characters.');
  }

  if (data.example_bg && data.example_bg.length > 500) {
    errors.push('Bulgarian example sentence must be under 500 characters.');
  }

  if (data.explanation && data.explanation.length > 1000) {
    errors.push('Explanation must be under 1000 characters.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Normalize answer for type-the-answer comparison.
 * Strips diacritics, collapses whitespace, lowercases, removes harmless punctuation.
 */
export function normalizeAnswer(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check whether a user's typed answer matches the correct translation(s).
 */
export function isCorrectAnswer(userAnswer, translation, acceptedTranslations = []) {
  const normalize = normalizeAnswer;
  const target = normalize(userAnswer);
  const candidates = [translation, ...acceptedTranslations].map(normalize);
  return candidates.includes(target);
}
