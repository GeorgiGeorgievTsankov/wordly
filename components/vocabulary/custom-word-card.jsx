'use client';

import { useState, useTransition } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deleteCustomWordAction } from '@/lib/actions/vocabulary';
import { cn } from '@/lib/utils';

export function CustomWordCard({ word }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(() => deleteCustomWordAction(word.id));
  }

  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        isPending && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base tracking-tight truncate">
            {word.headword}
          </h3>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={`/words/personal/${word.id}/edit`}
            aria-label={`Edit ${word.headword}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </a>
          <button
            onClick={handleDelete}
            aria-label={confirmDelete ? 'Confirm delete' : `Delete ${word.headword}`}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              confirmDelete
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
            )}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-slate-400 hover:text-slate-700 px-1.5"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="default" className="text-[11px]">
          {word.part_of_speech.charAt(0).toUpperCase() + word.part_of_speech.slice(1)}
        </Badge>
        {word.is_phrase && <Badge variant="brand" className="text-[11px]">Phrase</Badge>}
        <Badge variant="brand" className="text-[11px] bg-purple-50 text-purple-700 border-purple-200">
          Personal
        </Badge>
      </div>

      {/* Translation */}
      <p className="text-sm font-medium text-slate-700 leading-snug">{word.translation}</p>

      {/* Definition */}
      {word.definition && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{word.definition}</p>
      )}

      {/* Example */}
      {word.example_en && (
        <p className="text-xs text-slate-400 italic line-clamp-2">
          &ldquo;{word.example_en}&rdquo;
        </p>
      )}

      {confirmDelete && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          Click the delete button again to confirm removal.
        </p>
      )}
    </div>
  );
}

