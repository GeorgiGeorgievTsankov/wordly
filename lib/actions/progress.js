'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateStreak, evaluateAchievements } from '@/lib/services/progress';

export async function getUserStatisticsAction() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Profile timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone, daily_goal')
      .eq('id', user.id)
      .single();

    const timezone = profile?.timezone || 'Europe/Sofia';
    const dailyGoal = profile?.daily_goal || 10;
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());

    // 2. Daily activity history (last 30 days)
    const { data: activityRows } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', user.id)
      .order('activity_date', { ascending: true })
      .limit(30);

    const streak = calculateStreak(activityRows || [], todayStr);

    // 3. XP total from xp_events
    const { data: xpRows } = await supabase
      .from('xp_events')
      .select('xp')
      .eq('user_id', user.id);

    const totalXp = (xpRows || []).reduce((acc, row) => acc + (row.xp || 0), 0);

    // 4. Progress breakdown
    const { data: progressRows } = await supabase
      .from('user_word_progress')
      .select('status, correct_count, incorrect_count, ease_factor, word_id, custom_word_id')
      .eq('user_id', user.id);

    let learningCount = 0;
    let reviewingCount = 0;
    let masteredCount = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    const hardWordIds = [];

    if (progressRows) {
      for (const p of progressRows) {
        if (p.status === 'mastered') masteredCount += 1;
        else if (p.status === 'reviewing') reviewingCount += 1;
        else learningCount += 1;

        totalCorrect += p.correct_count || 0;
        totalIncorrect += p.incorrect_count || 0;

        if (p.incorrect_count > p.correct_count || Number(p.ease_factor) < 2.0) {
          hardWordIds.push(p.word_id || p.custom_word_id);
        }
      }
    }

    const totalReviews = totalCorrect + totalIncorrect;
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 100;
    const totalWordsStudied = (progressRows || []).length;

    // 5. Unlock eligible achievements
    const eligibleAchievements = evaluateAchievements({
      wordsMastered: masteredCount,
      wordsStudied: totalWordsStudied,
      streak,
      totalReviews,
    });

    for (const achId of eligibleAchievements) {
      await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: achId })
        .select()
        .maybeSingle();
    }

    // 6. Last 7 days chart format
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const act = (activityRows || []).find((r) => r.activity_date === dStr);
      last7Days.push({
        day: dayLabel,
        date: dStr,
        reviewed: act?.words_reviewed || 0,
        xp: act?.xp_earned || 0,
      });
    }

    return {
      success: true,
      stats: {
        streak,
        totalXp,
        totalWordsStudied,
        learningCount,
        reviewingCount,
        masteredCount,
        accuracy,
        dailyGoal,
        todayReviewed: (activityRows || []).find((r) => r.activity_date === todayStr)?.words_reviewed || 0,
        last7Days,
        hardWordsCount: hardWordIds.length,
      },
    };
  } catch (err) {
    console.error('getUserStatisticsAction error:', err);
    return { success: false, error: err.message };
  }
}
