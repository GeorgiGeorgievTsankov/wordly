import Link from 'next/link';
import {
  Sparkles,
  Brain,
  Flame,
  Target,
  ArrowRight,
  BookOpen,
  Keyboard,
  ListChecks,
  Shuffle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Real stats queries
  const nowUtc = new Date().toISOString();

  // 1. Total words in progress
  const { count: totalWordsCount } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 2. Words due for review
  const { count: dueWordsCount } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', nowUtc);

  // 3. Mastered words
  const { count: masteredCount } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'mastered');

  // 4. Total XP earned
  const { data: xpData } = await supabase
    .from('xp_events')
    .select('xp')
    .eq('user_id', user.id);

  const totalXp = xpData?.reduce((acc, row) => acc + (row.xp || 0), 0) || 0;

  const dailyGoal = profile?.daily_goal || 10;
  const displayName = profile?.display_name || profile?.username || 'Learner';

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {displayName}!
            </h1>
            <Badge variant="brand" className="text-xs">
              {profile?.role === 'admin' ? 'Admin' : 'Student'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Keep up your vocabulary consistency. Regular spaced repetition builds permanent recall.
          </p>
        </div>

        <Link href="/learn">
          <Button size="md" className="shadow-sm">
            <Brain className="w-4 h-4 mr-2" />
            <span>Continue Learning</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total In Learning */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Words Studied
            </span>
            <p className="text-2xl font-bold text-slate-900">{totalWordsCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </Card>

        {/* Due For Review */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Due For Review
            </span>
            <p className="text-2xl font-bold text-slate-900">{dueWordsCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        {/* Mastered Words */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mastered Words
            </span>
            <p className="text-2xl font-bold text-slate-900">{masteredCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </Card>

        {/* Total XP */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total XP
            </span>
            <p className="text-2xl font-bold text-slate-900">{totalXp}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Daily Goal & Streak Banner */}
      <Card className="p-6 bg-gradient-to-br from-white to-brand-50/30 border-brand-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900">
                Daily Goal: {dailyGoal} words
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Complete your daily review session to maintain your study streak.
            </p>
          </div>

          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl text-sm font-semibold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>0 Day Streak (Today: 0/{dailyGoal})</span>
          </div>
        </div>
      </Card>

      {/* Quick Launch Study Modes */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Choose a Study Mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/learn/flashcards" className="group">
            <Card hover className="p-5 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Flashcards</h4>
                <p className="text-xs text-slate-500">
                  SM-2 card flips with Again, Hard, Good, and Easy ratings.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>

          <Link href="/learn/quiz" className="group">
            <Card hover className="p-5 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ListChecks className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Quiz</h4>
                <p className="text-xs text-slate-500">
                  Multiple-choice recall with 4 randomized Bulgarian options.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
                <span>Start Quiz</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>

          <Link href="/learn/typing" className="group">
            <Card hover className="p-5 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Keyboard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Typing</h4>
                <p className="text-xs text-slate-500">
                  Deep active recall by typing Bulgarian translations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
                <span>Start Typing</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>

          <Link href="/learn/matching" className="group">
            <Card hover className="p-5 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Shuffle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Matching</h4>
                <p className="text-xs text-slate-500">
                  Speed pair-matching between English and Bulgarian terms.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
                <span>Start Matching</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
