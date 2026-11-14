import Link from 'next/link';
import { Trophy, Sparkles, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SessionComplete({
  totalWords = 0,
  correctCount = 0,
  xpEarned = 0,
  onRestart,
  nextModeHref = '/learn',
}) {
  const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 100;

  return (
    <div className="max-w-md mx-auto pt-6 text-center space-y-6">
      <Card className="p-8 space-y-6 border-indigo-100 shadow-xl shadow-indigo-100/50">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-black text-slate-900">
            Session Completed!
          </CardTitle>
          <CardDescription className="text-sm">
            Great work! Your progress and spaced-repetition schedules have been updated.
          </CardDescription>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100">
          <div className="text-center p-2">
            <p className="text-2xl font-extrabold text-slate-900">{totalWords}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Reviewed</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-extrabold text-emerald-600">{accuracy}%</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Accuracy</p>
          </div>
          <div className="text-center p-2">
            <div className="inline-flex items-center text-2xl font-extrabold text-amber-600">
              <Sparkles className="w-5 h-5 mr-1 fill-amber-400 text-amber-500" />
              <span>+{xpEarned}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">XP Earned</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {onRestart && (
            <Button onClick={onRestart} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              <span>Practice Again</span>
            </Button>
          )}

          <Link href={nextModeHref} className="block w-full">
            <Button variant="outline" className="w-full">
              <span>Back to Study Modes</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

