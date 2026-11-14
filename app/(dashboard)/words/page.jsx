import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Library, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getWords, getCategories, getFavoriteWordIds } from '@/lib/services/vocabulary';
import { Button } from '@/components/ui/button';
import { VocabularyFilters } from '@/components/vocabulary/vocabulary-filters';
import { WordCard } from '@/components/vocabulary/word-card';
import { WordsPagination } from '@/components/vocabulary/words-pagination';

export const dynamic = 'force-dynamic';

export default async function WordsPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const pos = params?.pos || '';
  const difficulty = params?.difficulty || '';
  const category = params?.category || '';
  const page = parseInt(params?.page || '1', 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ words, total, totalPages }, categories, favoriteData] = await Promise.all([
    getWords({ search, pos, difficulty, categorySlug: category, page }),
    getCategories(),
    getFavoriteWordIds(user.id),
  ]);

  const favoriteWordIds = new Set(favoriteData.map((f) => f.word_id).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Core Vocabulary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? (
              <>Showing {total.toLocaleString()} word{total !== 1 ? 's' : ''}</>
            ) : (
              'Browse and search the English vocabulary dictionary.'
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/words/personal">
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-1.5" />
              <span>Personal Words</span>
            </Button>
          </Link>
          <Link href="/words/add">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Propose Word</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <VocabularyFilters categories={categories} />
      </Suspense>

      {/* Word Grid */}
      {words.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Library className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900">No words found</h3>
          <p className="text-sm text-slate-500">
            {search || pos || difficulty || category
              ? 'Try adjusting your search or filters.'
              : 'The core dictionary is empty. Import words from the admin panel.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {words.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                isFavorite={favoriteWordIds.has(word.id)}
              />
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
