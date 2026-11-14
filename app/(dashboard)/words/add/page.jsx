import Link from 'next/link';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUserSubmissions } from '@/lib/services/vocabulary';
import { WordForm } from '@/components/vocabulary/word-form';
import { submitWordProposalAction } from '@/lib/actions/vocabulary';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function statusVariant(s) {
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  return 'default';
}

export default async function ProposeWordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const submissions = await getUserSubmissions(user.id);

  return (
    <div className="max-w-2xl space-y-8">
      <Link
        href="/words"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dictionary
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Propose a Word
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Suggest an English word or phrase to add to the shared core dictionary. An admin will review your proposal.
        </p>
      </div>

      {/* Guidelines */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Submission guidelines</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700">
            <li>Provide an accurate Bulgarian translation (not machine-generated).</li>
            <li>The word must not already exist in the core dictionary.</li>
            <li>Examples are optional but help the reviewer understand usage.</li>
          </ul>
        </div>
      </div>

      <WordForm
        action={submitWordProposalAction}
        submitLabel="Submit for Review"
        showExplanation
      />

      {/* User's previous submissions */}
      {submissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Your Previous Submissions</h2>
          <div className="space-y-2">
            {submissions.map((s) => (
              <Card key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{s.headword}</p>
                  <p className="text-xs text-slate-500">
                    {s.part_of_speech} · {s.translation}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant={statusVariant(s.status)} className="text-xs">
                    {s.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

