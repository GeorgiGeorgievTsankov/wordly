import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SoundToggle } from '@/components/learning/sound-toggle';

export function SessionHeader({
  currentIndex,
  totalWords,
  modeName = 'Study Session',
  sourceLabel = null,
  totalXp = 0,
  autoSound = true,
  onToggleSound = null,
}) {
  const progressPercent = totalWords > 0 ? Math.round(((currentIndex) / totalWords) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/learn"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Exit</span>
        </Link>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <Badge variant="brand">{modeName}</Badge>
          {sourceLabel && <Badge variant="secondary">{sourceLabel}</Badge>}
          {totalXp > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-400" />
              +{totalXp} XP
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {onToggleSound && (
            <SoundToggle autoSound={autoSound} onToggle={onToggleSound} />
          )}
          <span className="text-sm font-semibold text-slate-700">
            {Math.min(currentIndex + 1, totalWords)} / {totalWords}
          </span>
        </div>
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
