import { describe, it, expect } from 'vitest';
import {
  normalizeHeadword,
  normalizeAnswer,
  isCorrectAnswer,
  validateWordPayload,
  PARTS_OF_SPEECH,
  DIFFICULTIES,
} from '../lib/validation/vocabulary';

describe('Vocabulary Validation', () => {
  it('normalizes headword: trims and lowercases', () => {
    expect(normalizeHeadword('  Accomplish  ')).toBe('accomplish');
    expect(normalizeHeadword('LOOK  UP')).toBe('look up');
    expect(normalizeHeadword(' set off ')).toBe('set off');
  });

  it('validates required fields', () => {
    const { valid, errors } = validateWordPayload({
      headword: '',
      translation: 'постигам',
      part_of_speech: 'verb',
    });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('English word'))).toBe(true);
  });

  it('validates part_of_speech must be in allowed list', () => {
    const { valid, errors } = validateWordPayload({
      headword: 'run',
      translation: 'тичам',
      part_of_speech: 'unknown_pos',
    });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('Part of speech'))).toBe(true);
  });

  it('passes valid payload', () => {
    const { valid, errors } = validateWordPayload({
      headword: 'accomplish',
      translation: 'постигам',
      part_of_speech: 'verb',
    });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('normalizes answer: lowercases, strips punct, collapses spaces', () => {
    expect(normalizeAnswer('  Постигам! ')).toBe('постигам');
    expect(normalizeAnswer('постигам,  осъществявам')).toBe('постигам осъществявам');
  });

  it('isCorrectAnswer accepts exact translation', () => {
    expect(isCorrectAnswer('постигам', 'постигам')).toBe(true);
  });

  it('isCorrectAnswer accepts case-insensitive match', () => {
    expect(isCorrectAnswer('ПОСТИГАМ', 'постигам')).toBe(true);
  });

  it('isCorrectAnswer accepts from accepted_translations', () => {
    expect(isCorrectAnswer('осъществявам', 'постигам', ['осъществявам', 'изпълнявам'])).toBe(true);
  });

  it('isCorrectAnswer rejects wrong answer', () => {
    expect(isCorrectAnswer('бягам', 'постигам', ['осъществявам'])).toBe(false);
  });

  it('WORK (noun) and WORK (verb) are distinct by normalizeHeadword + pos pair', () => {
    const noun = { normalized_headword: normalizeHeadword('work'), part_of_speech: 'noun' };
    const verb = { normalized_headword: normalizeHeadword('work'), part_of_speech: 'verb' };
    expect(noun.normalized_headword).toBe(verb.normalized_headword);
    expect(`${noun.normalized_headword}:${noun.part_of_speech}`).not.toBe(
      `${verb.normalized_headword}:${verb.part_of_speech}`
    );
  });

  it('exports all PARTS_OF_SPEECH including verb and noun', () => {
    expect(PARTS_OF_SPEECH).toContain('verb');
    expect(PARTS_OF_SPEECH).toContain('noun');
    expect(PARTS_OF_SPEECH).toContain('adjective');
  });

  it('exports all DIFFICULTIES', () => {
    expect(DIFFICULTIES).toContain('beginner');
    expect(DIFFICULTIES).toContain('intermediate');
    expect(DIFFICULTIES).toContain('advanced');
  });
});

