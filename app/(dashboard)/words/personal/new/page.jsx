import { WordForm } from '@/components/vocabulary/word-form';
import { createCustomWordAction } from '@/lib/actions/vocabulary';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPersonalWordPage() {
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
          Add Personal Word
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          This word is private and visible only to you. It will be added to your spaced repetition schedule.
        </p>
      </div>

      <WordForm action={createCustomWordAction} submitLabel="Add to My Vocabulary" />
    </div>
  );
}

