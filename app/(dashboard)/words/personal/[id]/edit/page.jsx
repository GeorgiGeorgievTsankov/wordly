import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { WordForm } from '@/components/vocabulary/word-form';
import { updateCustomWordAction } from '@/lib/actions/vocabulary';

export const dynamic = 'force-dynamic';

export default async function EditCustomWordPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: word, error } = await supabase
    .from('user_custom_words')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !word) notFound();

  const action = updateCustomWordAction.bind(null, id);

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/words/personal"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Personal Words
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Edit: {word.headword}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your personal vocabulary entry.
        </p>
      </div>

      <WordForm action={action} defaultValues={word} submitLabel="Save Changes" />
    </div>
  );
}
