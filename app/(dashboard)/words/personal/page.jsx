import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Bookmark, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCustomWords } from '@/lib/services/vocabulary';
import { Button } from '@/components/ui/button';
import { CustomWordCard } from '@/components/vocabulary/custom-word-card';
import { WordsPagination } from '@/components/vocabulary/words-pagination';

export const dynamic = 'force-dynamic';

export default async function PersonalWordsPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const pos = params?.pos || '';
  const page = parseInt(params?.page || '1', 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { words, total, totalPages } = await getCustomWords(user.id, { search, pos, page });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personal Vocabulary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0
              ? `${total} personal word${total !== 1 ? 's' : ''} — private to you only.`
              : 'Your private word collection. Add unlimited custom words.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/words">
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Core Dictionary
            </Button>
          </Link>
          <Link href="/words/personal/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Word
            </Button>
          </Link>
        </div>
      </div>

      {/* Word Grid or Empty */}
      {words.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto flex items-center justify-center">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900">No personal words yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Start building your private vocabulary — add English words with Bulgarian translations and they will enter your spaced repetition schedule automatically.
          </p>
          <Link href="/words/personal/new">
            <Button size="md" className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Word
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {words.map((word) => (
              <CustomWordCard key={word.id} word={word} />
            ))}
          </div>

          <Suspense fallback={null}>
            <WordsPagination page={page} totalPages={totalPages} />
          </Suspense>
        </>
      )}
    </div>
  );
}
