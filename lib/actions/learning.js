'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateNextReview, GRADES } from '@/lib/services/srs.js';
import { generateSession, shuffleArray } from '@/lib/services/session-generator.js';

/**
 * Helper to compute local date YYYY-MM-DD for a user's timezone.
 */
function getLocalDate(timeZone = 'Europe/Sofia') {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Starts a new study session and fetches balanced words.
 */
export async function startStudySessionAction({
  mode = 'flashcards',
  categoryId = null,
  wordSource = 'all', // 'all' | 'core' | 'personal'
  sessionSize = 10,
} = {}) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Fetch user's existing progress
    const { data: progressRows } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', user.id);

    const progressMap = new Map();
    const dueWordIds = new Set();
    const hardWordIds = new Set();
    const studiedWordIds = new Set();
    const now = new Date();

    if (progressRows) {
      for (const p of progressRows) {
        const key = p.word_id || p.custom_word_id;
        progressMap.set(key, p);
        if (p.word_id) studiedWordIds.add(p.word_id);

        if (new Date(p.next_review_at) <= now) {
          dueWordIds.add(key);
        } else if (p.incorrect_count > p.correct_count || Number(p.ease_factor) < 2.0) {
          hardWordIds.add(key);
        }
      }
    }

    // 2. Fetch Core Words if requested
    let coreWords = [];
    const validCategoryId =
      categoryId && categoryId !== 'all' && typeof categoryId === 'string' && categoryId.length > 10
        ? categoryId
        : null;

    if (wordSource !== 'personal') {
      let query = supabase
        .from('words')
        .select(`
          id,
          headword,
          part_of_speech,
          pronunciation,
          status,
          word_meanings (
            id,
            translation,
            accepted_translations,
            definition,
            example_en,
            example_bg,
            sort_order
          ),
          word_categories${validCategoryId ? '!inner' : ''} (category_id)
        `)
        .eq('status', 'active');

      if (validCategoryId) {
        query = query.eq('word_categories.category_id', validCategoryId);
      }

      const { data: wordsData, error: wordsErr } = await query.limit(1000);

      if (wordsErr) {
        console.error('Failed to load core words:', wordsErr);
        return { success: false, error: wordsErr.message, words: [] };
      }

      if (wordsData) {
        coreWords = wordsData
          .filter((w) => w.word_meanings && w.word_meanings.length > 0)
          .map((w) => {
            const m = [...w.word_meanings].sort(
              (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
            )[0];
            return {
              id: w.id,
              isCustom: false,
              headword: w.headword,
              part_of_speech: w.part_of_speech,
              phonetic_transcription: w.pronunciation || null,
              translation: m.translation,
              accepted_translations: m.accepted_translations || [],
              definition: m.definition || '',
              example_sentence: m.example_en || '',
              example_translation: m.example_bg || '',
              progress: progressMap.get(w.id) || null,
            };
          });
      }
    }

    // 3. Fetch Personal Words if requested
    let personalWords = [];
    if (wordSource !== 'core' && !validCategoryId) {
      const { data: customData, error: customErr } = await supabase
        .from('user_custom_words')
        .select('*')
        .eq('user_id', user.id);

      if (customErr) {
        console.error('Failed to load personal words:', customErr);
      }

      if (customData) {
        personalWords = customData
          .filter((w) => w.translation)
          .map((w) => ({
            id: w.id,
            isCustom: true,
            headword: w.headword,
            part_of_speech: w.part_of_speech,
            phonetic_transcription: null,
            translation: w.translation,
            accepted_translations: w.accepted_translations || [],
            definition: w.definition || '',
            example_sentence: w.example_en || w.example_sentence || '',
            example_translation: w.example_bg || w.example_translation || '',
            progress: progressMap.get(w.id) || null,
          }));
      }
    }

    const allCandidateWords = [...coreWords, ...personalWords];

    if (allCandidateWords.length === 0) {
      let customErrorMsg = 'No vocabulary words found with translations. Add personal words or import words to begin.';
      if (wordSource === 'core') {
        customErrorMsg = 'No core vocabulary words found for the selected category. Try selecting "All Categories" or another category.';
      } else if (wordSource === 'personal') {
        customErrorMsg = 'You have not added any personal words yet. Go to Personal Words to add your first word!';
      }

      return {
        success: false,
        error: customErrorMsg,
        words: [],
      };
    }

    // Separate into SRS buckets
    const dueWordsList = allCandidateWords.filter((w) => dueWordIds.has(w.id));
    const hardWordsList = allCandidateWords.filter((w) => hardWordIds.has(w.id));
    const newWordsList = allCandidateWords.filter((w) => !progressMap.has(w.id));

    // Generate balanced session
    const sessionWords = generateSession({
      dueWords: shuffleArray(dueWordsList),
      newWords: shuffleArray(newWordsList),
      hardWords: shuffleArray(hardWordsList),
      sessionSize,
    });

    // 4. Create study_sessions record
    const { data: sessionRecord, error: sessionErr } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        mode,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionErr) {
      console.error('Failed to create study session:', sessionErr);
      return { success: false, error: 'Could not initialize session.' };
    }

    return {
      success: true,
      sessionId: sessionRecord.id,
      words: sessionWords,
    };
  } catch (err) {
    console.error('startStudySessionAction error:', err);
    return { success: false, error: err.message || 'Failed to start study session.' };
  }
}

/**
 * Submits an answer review for a single word in a session.
 * Awards XP server-side and logs progress.
 */
export async function submitReviewAction({
  sessionId,
  wordId,
  isCustom = false,
  grade = GRADES.GOOD,
  responseTimeMs = 0,
  reviewMode = 'flashcards',
}) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Fetch user profile for timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const userTimezone = profile?.timezone || 'Europe/Sofia';
    const localDate = getLocalDate(userTimezone);

    // 2. Fetch current progress record
    let progressQuery = supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', user.id);

    if (isCustom) {
      progressQuery = progressQuery.eq('custom_word_id', wordId);
    } else {
      progressQuery = progressQuery.eq('word_id', wordId);
    }

    const { data: existingProgress } = await progressQuery.maybeSingle();

    // 3. Compute updated SRS state
    const newProgress = calculateNextReview(existingProgress, grade);

    // Check if word achieved mastery in this turn
    const wasMasteredBefore = existingProgress?.status === 'mastered';
    const isMasteredNow = newProgress.status === 'mastered';
    const newlyLearned = !wasMasteredBefore && isMasteredNow;

    // 4. Upsert user_word_progress
    const progressPayload = {
      user_id: user.id,
      word_id: isCustom ? null : wordId,
      custom_word_id: isCustom ? wordId : null,
      ...newProgress,
      updated_at: new Date().toISOString(),
    };

    if (existingProgress?.id) {
      await supabase
        .from('user_word_progress')
        .update(progressPayload)
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('user_word_progress')
        .insert(progressPayload);
    }

    // 5. Insert review_logs
    const { data: reviewLog } = await supabase
      .from('review_logs')
      .insert({
        user_id: user.id,
        word_id: isCustom ? null : wordId,
        custom_word_id: isCustom ? wordId : null,
        session_id: sessionId || null,
        result: grade,
        response_time_ms: responseTimeMs,
        review_mode: reviewMode,
        reviewed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // 6. Calculate & Award XP server-side via xp_events (tamper-proof)
    let xpAmount = 1; // 1 XP for effort on 'again'
    if (grade === GRADES.GOOD || grade === GRADES.EASY) {
      xpAmount = 5;
    } else if (grade === GRADES.HARD) {
      xpAmount = 3;
    }

    if (reviewLog?.id) {
      // Idempotent insert with unique constraint uq_user_xp_event
      await supabase
        .from('xp_events')
        .insert({
          user_id: user.id,
          source_type: 'review',
          source_id: reviewLog.id,
          xp: xpAmount,
        });
    }

    // 7. Update daily_activity for user's local date
    const { data: existingActivity } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_date', localDate)
      .maybeSingle();

    if (existingActivity) {
      await supabase
        .from('daily_activity')
        .update({
          words_reviewed: existingActivity.words_reviewed + 1,
          words_learned: existingActivity.words_learned + (newlyLearned ? 1 : 0),
          xp_earned: existingActivity.xp_earned + xpAmount,
        })
        .eq('id', existingActivity.id);
    } else {
      await supabase
        .from('daily_activity')
        .insert({
          user_id: user.id,
          activity_date: localDate,
          words_reviewed: 1,
          words_learned: newlyLearned ? 1 : 0,
          xp_earned: xpAmount,
          study_minutes: 1,
        });
    }

    return {
      success: true,
      xpEarned: xpAmount,
      newStatus: newProgress.status,
      intervalDays: newProgress.interval_days,
    };
  } catch (err) {
    console.error('submitReviewAction error:', err);
    return { success: false, error: err.message || 'Failed to submit review' };
  }
}

/**
 * Concludes a study session and awards session completion bonus XP.
 * Idempotent: if the bonus was already awarded for this session (unique
 * constraint on xp_events), nothing is added a second time.
 */
export async function completeStudySessionAction({
  sessionId,
  totalQuestions = 0,
  correctAnswers = 0,
  durationSeconds = 0,
}) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const sessionBonusXp = 10;

    // 1. Award session bonus XP idempotently
    if (sessionId) {
      const { error: xpErr } = await supabase
        .from('xp_events')
        .insert({
          user_id: user.id,
          source_type: 'session_complete',
          source_id: sessionId,
          xp: sessionBonusXp,
        });

      if (xpErr) {
        // Already awarded (duplicate request) or could not be recorded:
        // do not add bonus XP or study minutes a second time.
        return { success: true, bonusXp: 0, alreadyCompleted: true };
      }
    }

    // 2. Update study_sessions record
    if (sessionId) {
      await supabase
        .from('study_sessions')
        .update({
          completed_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          xp_earned: sessionBonusXp,
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);
    }

    // 3. Update daily_activity study minutes and bonus XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const localDate = getLocalDate(profile?.timezone);
    const studyMinutes = Math.max(1, Math.round(durationSeconds / 60));

    const { data: existingActivity } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_date', localDate)
      .maybeSingle();

    if (existingActivity) {
      await supabase
        .from('daily_activity')
        .update({
          xp_earned: existingActivity.xp_earned + sessionBonusXp,
          study_minutes: existingActivity.study_minutes + studyMinutes,
        })
        .eq('id', existingActivity.id);
    } else {
      await supabase
        .from('daily_activity')
        .insert({
          user_id: user.id,
          activity_date: localDate,
          xp_earned: sessionBonusXp,
          study_minutes: studyMinutes,
        });
    }

    return {
      success: true,
      bonusXp: sessionBonusXp,
    };
  } catch (err) {
    console.error('completeStudySessionAction error:', err);
    return { success: false, error: err.message || 'Failed to complete session' };
  }
}