import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SessionHeader({
  currentIndex,
  totalWords,
  modeName = 'Study Session',
  totalXp = 0,
}) {
  const progressPercent = totalWords > 0 ? Math.round(((currentIndex) / totalWords) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/learn"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Exit</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Badge variant="brand">{modeName}</Badge>
          {totalXp > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-400" />
              +{totalXp} XP
            </span>
          )}
        </div>

        <span className="text-sm font-semibold text-slate-700">
          {Math.min(currentIndex + 1, totalWords)} / {totalWords}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

