import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  Lightbulb,
  Tag,
  BarChart2,
  MessageSquare,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getWordById } from '@/lib/services/vocabulary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function difficultyVariant(d) {
  if (d === 'beginner') return 'success';
  if (d === 'intermediate') return 'warning';
  return 'danger';
}

export default async function WordDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const word = await getWordById(id, user?.id);
  if (!word) notFound();

  const categories = word.word_categories?.map((wc) => wc.categories).filter(Boolean) || [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back button */}
      <Link
        href="/words"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dictionary
      </Link>

      {/* Word Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {word.headword}
            </h1>
            {word.pronunciation && (
              <p className="text-sm text-slate-400 font-mono mt-1">{word.pronunciation}</p>
            )}
          </div>

          {word.pronunciation && (
            <button
              type="button"
              aria-label="Play pronunciation"
              className="p-2.5 rounded-full border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-colors flex-shrink-0"
              onClick={undefined} // Speech synthesis handled client-side in Phase 4
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            {word.part_of_speech.charAt(0).toUpperCase() + word.part_of_speech.slice(1)}
          </Badge>
          <Badge variant={difficultyVariant(word.difficulty)}>{word.difficulty}</Badge>
          {word.is_phrase && <Badge variant="brand">Phrase</Badge>}
          {categories.map((c) => (
            <Badge key={c.id} variant="default">{c.name}</Badge>
          ))}
        </div>

        {/* Progress indicator */}
        {word.progress && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <BarChart2 className="w-4 h-4 text-brand-500" />
            <span>
              Status: <span className="text-slate-800 capitalize">{word.progress.status}</span>
              {' '}·{' '}
              {word.progress.correct_count} correct / {word.progress.incorrect_count} incorrect
            </span>
          </div>
        )}
      </div>

      {/* Meanings */}
      {word.word_meanings?.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" />
            Meanings & Translations
          </h2>

          {word.word_meanings
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((m, idx) => (
              <Card key={m.id} className="p-5 space-y-3">
                {word.word_meanings.length > 1 && (
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Meaning {idx + 1}
                  </span>
                )}

                {/* Translation */}
                <div className="p-3.5 rounded-xl bg-brand-50/60 border border-brand-100">
                  <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-1">
                    Bulgarian Translation
                  </p>
                  <p className="text-lg font-bold text-slate-900">{m.translation}</p>
                  {m.accepted_translations?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Also accepted: {m.accepted_translations.join(', ')}
                    </p>
                  )}
                </div>

                {/* Definition */}
                {m.definition && (
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{m.definition}</p>
                  </div>
                )}

                {/* Examples */}
                {(m.example_en || m.example_bg) && (
                  <div className="space-y-1 text-sm border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-1.5 text-slate-400">
                      <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Examples</span>
                    </div>
                    {m.example_en && (
                      <p className="text-slate-700 italic pl-5">&ldquo;{m.example_en}&rdquo;</p>
                    )}
                    {m.example_bg && (
                      <p className="text-slate-500 pl-5">{m.example_bg}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
        </div>
      ) : (
        <Card className="p-6 text-center space-y-2 text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm">No translations available yet for this word.</p>
        </Card>
      )}

      {/* Study CTA */}
      <div className="flex justify-end pt-2">
        <Link href="/learn/flashcards">
          <Button>
            Study this word
          </Button>
        </Link>
      </div>
    </div>
  );
}

