'use client';

import Link from 'next/link';
import { Volume2, BookOpen, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toggleFavoriteAction } from '@/lib/actions/vocabulary';
import { useTransition } from 'react';

function difficultyVariant(d) {
  if (d === 'beginner') return 'success';
  if (d === 'intermediate') return 'warning';
  return 'danger';
}

function posLabel(pos) {
  return pos.charAt(0).toUpperCase() + pos.slice(1);
}

export function WordCard({ word, isFavorite = false }) {
  const [isPending, startTransition] = useTransition();
  const meaning = word.word_meanings?.[0];

  function handleFavorite(e) {
    e.preventDefault();
    startTransition(() => toggleFavoriteAction(word.id, isFavorite));
  }

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base tracking-tight truncate">
            {word.headword}
          </h3>
          {word.pronunciation && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{word.pronunciation}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleFavorite}
            disabled={isPending}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isFavorite
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-slate-300 hover:text-red-400 hover:bg-red-50'
            )}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-red-500')} />
          </button>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="default" className="text-[11px]">{posLabel(word.part_of_speech)}</Badge>
        <Badge variant={difficultyVariant(word.difficulty)} className="text-[11px]">
          {word.difficulty}
        </Badge>
        {word.is_phrase && <Badge variant="brand" className="text-[11px]">Phrase</Badge>}
      </div>

      {/* Translation */}
      {meaning ? (
        <p className="text-sm font-medium text-slate-700 leading-snug line-clamp-2">
          {meaning.translation}
        </p>
      ) : (
        <p className="text-xs text-slate-400 italic">Translation pending</p>
      )}

      {/* Example */}
      {meaning?.example_en && (
        <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
          &ldquo;{meaning.example_en}&rdquo;
        </p>
      )}

      {/* Footer link */}
      <Link
        href={`/words/${word.id}`}
        className="mt-auto pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 group/link"
      >
        <span>View Details</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/link:translate-x-0.5" />
      </Link>
    </div>
  );
}

